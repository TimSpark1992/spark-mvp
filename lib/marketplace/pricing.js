// lib/marketplace/pricing.js
// Spark Marketplace Pricing Calculations

/**
 * Calculate pricing for marketplace offers
 * @param {Array} items - Array of {deliverable_type, qty, unit_price_cents, currency}
 * @param {Number} platformFeePct - Platform fee percentage (default 20)
 * @returns {Object} Pricing breakdown
 */
export const calculatePricing = (items = [], platformFeePct = 20) => {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      subtotalCents: 0,
      platformFeePct: platformFeePct,
      platformFeeCents: 0,
      totalCents: 0,
      currency: 'USD',
      breakdown: []
    }
  }

  // Validate all items have same currency
  const currencies = [...new Set(items.map(item => item.currency || 'USD'))]
  if (currencies.length > 1) {
    throw new Error('All items must have the same currency')
  }
  
  const currency = currencies[0] || 'USD'
  
  // Calculate subtotal
  const subtotalCents = items.reduce((sum, item) => {
    const itemTotal = (item.unit_price_cents || 0) * (item.qty || 1)
    return sum + itemTotal
  }, 0)
  
  // Calculate platform fee
  const platformFeeCents = Math.round(subtotalCents * (platformFeePct / 100))
  
  // Calculate total (brand pays subtotal + platform fee)
  const totalCents = subtotalCents + platformFeeCents
  
  // Generate breakdown
  const breakdown = items.map(item => ({
    deliverable_type: item.deliverable_type,
    qty: item.qty || 1,
    unit_price_cents: item.unit_price_cents || 0,
    line_total_cents: (item.unit_price_cents || 0) * (item.qty || 1),
    currency
  }))
  
  return {
    subtotalCents,
    platformFeePct,
    platformFeeCents,
    totalCents,
    currency,
    breakdown,
    // Creator receives subtotal, platform keeps platform fee
    creatorEarningsCents: subtotalCents
  }
}

/**
 * Apply rush pricing to base price
 * @param {Number} basePriceCents - Base price in cents
 * @param {Number} rushPct - Rush percentage (0-200)
 * @returns {Number} Price with rush applied
 */
export const applyRushPricing = (basePriceCents, rushPct = 0) => {
  if (rushPct <= 0) return basePriceCents
  
  const rushAmount = Math.round(basePriceCents * (rushPct / 100))
  return basePriceCents + rushAmount
}

/**
 * Format price in cents to currency string
 * @param {Number} priceCents - Price in cents
 * @param {String} currency - Currency code (USD, MYR, SGD)
 * @returns {String} Formatted price string
 */
export const formatPrice = (priceCents, currency = 'USD') => {
  const price = priceCents / 100
  
  const formatters = {
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    MYR: new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }),
    SGD: new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' })
  }
  
  const formatter = formatters[currency] || formatters.USD
  return formatter.format(price)
}

/**
 * Convert price between currencies (simplified - in production use live rates)
 * @param {Number} priceCents - Price in cents
 * @param {String} fromCurrency - Source currency
 * @param {String} toCurrency - Target currency
 * @returns {Number} Converted price in cents
 */
export const convertCurrency = (priceCents, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return priceCents
  
  // Simplified conversion rates (in production, use live rates from API)
  const rates = {
    'USD_TO_MYR': 4.7,
    'USD_TO_SGD': 1.35,
    'MYR_TO_USD': 0.213,
    'MYR_TO_SGD': 0.287,
    'SGD_TO_USD': 0.741,
    'SGD_TO_MYR': 3.48
  }
  
  const rateKey = `${fromCurrency}_TO_${toCurrency}`
  const rate = rates[rateKey]
  
  if (!rate) {
    console.warn(`No conversion rate found for ${fromCurrency} to ${toCurrency}`)
    return priceCents
  }
  
  return Math.round(priceCents * rate)
}

/**
 * Validate offer pricing
 * @param {Object} offerData - Offer data to validate
 * @returns {Object} Validation result
 */
export const validateOfferPricing = (offerData) => {
  const errors = []
  
  if (!offerData.items || !Array.isArray(offerData.items) || offerData.items.length === 0) {
    errors.push('Offer must contain at least one item')
  }
  
  if (offerData.items) {
    offerData.items.forEach((item, index) => {
      if (!item.deliverable_type) {
        errors.push(`Item ${index + 1}: Deliverable type is required`)
      }
      
      if (!item.unit_price_cents || item.unit_price_cents <= 0) {
        errors.push(`Item ${index + 1}: Valid unit price is required`)
      }
      
      if (!item.qty || item.qty <= 0) {
        errors.push(`Item ${index + 1}: Valid quantity is required`)
      }
    })
  }
  
  if (offerData.subtotal_cents < 0) {
    errors.push('Subtotal cannot be negative')
  }
  
  if (offerData.platform_fee_pct < 0 || offerData.platform_fee_pct > 50) {
    errors.push('Platform fee must be between 0% and 50%')
  }
  
  if (offerData.total_cents <= 0) {
    errors.push('Total amount must be greater than zero')
  }
  
  // Verify calculations
  const calculated = calculatePricing(offerData.items, offerData.platform_fee_pct)
  if (Math.abs(calculated.subtotalCents - offerData.subtotal_cents) > 1) {
    errors.push('Subtotal calculation mismatch')
  }
  
  if (Math.abs(calculated.totalCents - offerData.total_cents) > 1) {
    errors.push('Total calculation mismatch')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    calculated
  }
}

/**
 * Generate offer items from rate cards and selections
 * @param {Array} selections - Array of {creatorId, deliverableType, qty, rushPct}
 * @param {Array} rateCards - Array of rate card data
 * @returns {Array} Formatted items array
 */
export const generateOfferItems = (selections, rateCards) => {
  return selections.map(selection => {
    const rateCard = rateCards.find(rc => 
      rc.creator_id === selection.creatorId && 
      rc.deliverable_type === selection.deliverableType
    )
    
    if (!rateCard) {
      throw new Error(`Rate card not found for ${selection.deliverableType}`)
    }
    
    const unitPriceCents = applyRushPricing(
      rateCard.base_price_cents, 
      selection.rushPct || rateCard.rush_pct || 0
    )
    
    return {
      creator_id: selection.creatorId,
      deliverable_type: selection.deliverableType,
      qty: selection.qty || 1,
      unit_price_cents: unitPriceCents,
      currency: rateCard.currency,
      rush_pct: selection.rushPct || 0
    }
  })
}

// Constants for deliverable types
export const DELIVERABLE_TYPES = {
  IG_REEL: 'IG_Reel',
  IG_STORY: 'IG_Story',
  TIKTOK_POST: 'TikTok_Post',
  YOUTUBE_VIDEO: 'YouTube_Video',
  BUNDLE: 'Bundle'
}

export const DELIVERABLE_LABELS = {
  [DELIVERABLE_TYPES.IG_REEL]: 'Instagram Reel',
  [DELIVERABLE_TYPES.IG_STORY]: 'Instagram Story',
  [DELIVERABLE_TYPES.TIKTOK_POST]: 'TikTok Post',
  [DELIVERABLE_TYPES.YOUTUBE_VIDEO]: 'YouTube Video',
  [DELIVERABLE_TYPES.BUNDLE]: 'Bundle Package'
}

// Constants for currencies
export const CURRENCIES = {
  USD: 'USD',
  MYR: 'MYR', 
  SGD: 'SGD'
}

export const CURRENCY_SYMBOLS = {
  [CURRENCIES.USD]: '$',
  [CURRENCIES.MYR]: 'RM',
  [CURRENCIES.SGD]: 'S$'
}