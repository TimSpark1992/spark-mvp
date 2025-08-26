// lib/marketplace/pricing.test.js
// Comprehensive unit tests for Cost Estimator calculations

import { 
  calculatePricing, 
  applyRushPricing, 
  validateOfferPricing,
  generateOfferItems,
  convertCurrency
} from './pricing.js'

// Test Suite 1: Core Pricing Calculations
describe('calculatePricing', () => {
  test('should calculate correct pricing for single item', () => {
    const items = [{
      deliverable_type: 'IG_Reel',
      qty: 1,
      unit_price_cents: 5000, // $50.00
      currency: 'USD'
    }]
    
    const result = calculatePricing(items, 20)
    
    expect(result.subtotalCents).toBe(5000)
    expect(result.platformFeeCents).toBe(1000) // 20% of 5000
    expect(result.totalCents).toBe(6000) // 5000 + 1000
    expect(result.creatorEarningsCents).toBe(5000)
    expect(result.currency).toBe('USD')
    expect(result.platformFeePct).toBe(20)
  })

  test('should calculate correct pricing for multiple quantities', () => {
    const items = [{
      deliverable_type: 'IG_Reel',
      qty: 2, // TEST SCENARIO: quantity = 2
      unit_price_cents: 5000, // $50.00 each
      currency: 'USD'
    }]
    
    const result = calculatePricing(items, 20)
    
    expect(result.subtotalCents).toBe(10000) // 5000 × 2
    expect(result.platformFeeCents).toBe(2000) // 20% of 10000
    expect(result.totalCents).toBe(12000) // 10000 + 2000
    expect(result.creatorEarningsCents).toBe(10000)
  })

  test('should calculate correct pricing for multiple items', () => {
    const items = [
      {
        deliverable_type: 'IG_Reel',
        qty: 1,
        unit_price_cents: 5000,
        currency: 'USD'
      },
      {
        deliverable_type: 'IG_Story',
        qty: 3,
        unit_price_cents: 2000,
        currency: 'USD'
      }
    ]
    
    const result = calculatePricing(items, 20)
    
    expect(result.subtotalCents).toBe(11000) // 5000 + (2000 × 3)
    expect(result.platformFeeCents).toBe(2200) // 20% of 11000
    expect(result.totalCents).toBe(13200) // 11000 + 2200
  })

  test('should handle empty items array', () => {
    const result = calculatePricing([], 20)
    
    expect(result.subtotalCents).toBe(0)
    expect(result.platformFeeCents).toBe(0)
    expect(result.totalCents).toBe(0)
    expect(result.creatorEarningsCents).toBe(0)
  })

  test('should validate same currency requirement', () => {
    const items = [
      { deliverable_type: 'IG_Reel', qty: 1, unit_price_cents: 5000, currency: 'USD' },
      { deliverable_type: 'IG_Story', qty: 1, unit_price_cents: 2000, currency: 'MYR' }
    ]
    
    expect(() => calculatePricing(items, 20)).toThrow('All items must have the same currency')
  })
})

// Test Suite 2: Rush Pricing Calculations  
describe('applyRushPricing', () => {
  test('should apply 25% rush fee correctly', () => {
    const basePriceCents = 5000 // $50.00
    const rushPct = 25 // TEST SCENARIO: 25% rush fee
    
    const result = applyRushPricing(basePriceCents, rushPct)
    
    expect(result).toBe(6250) // 5000 + (5000 × 0.25)
  })

  test('should handle 0% rush fee', () => {
    const basePriceCents = 5000
    const rushPct = 0
    
    const result = applyRushPricing(basePriceCents, rushPct)
    
    expect(result).toBe(5000) // No change
  })

  test('should handle negative rush percentage', () => {
    const basePriceCents = 5000
    const rushPct = -10
    
    const result = applyRushPricing(basePriceCents, rushPct)
    
    expect(result).toBe(5000) // Should return base price for negative values
  })

  test('should handle high rush percentages', () => {
    const basePriceCents = 5000
    const rushPct = 100 // 100% rush fee
    
    const result = applyRushPricing(basePriceCents, rushPct)
    
    expect(result).toBe(10000) // 5000 + (5000 × 1.0)
  })

  test('should round rush amounts correctly', () => {
    const basePriceCents = 3333 // $33.33
    const rushPct = 33 // 33% rush fee
    
    const result = applyRushPricing(basePriceCents, rushPct)
    
    const expectedRushAmount = Math.round(3333 * 0.33) // 1100 (rounded)
    expect(result).toBe(3333 + expectedRushAmount)
  })
})

// Test Suite 3: Complete User Testing Scenario
describe('User Testing Scenario', () => {
  test('should match user test case: quantity 2, 25% rush fee, 20% platform fee', () => {
    // Simulate user selecting deliverable with $50 base price
    const basePriceCents = 5000
    const quantity = 2
    const rushPct = 25
    const platformFeePct = 20
    
    // Step 1: Apply rush pricing to base price
    const unitPriceWithRush = applyRushPricing(basePriceCents, rushPct)
    expect(unitPriceWithRush).toBe(6250) // $50 + 25% = $62.50
    
    // Step 2: Create item for calculation
    const items = [{
      deliverable_type: 'IG_Reel',
      qty: quantity,
      unit_price_cents: unitPriceWithRush,
      currency: 'USD'
    }]
    
    // Step 3: Calculate final pricing
    const result = calculatePricing(items, platformFeePct)
    
    // Verify calculations step by step
    expect(result.subtotalCents).toBe(12500) // $62.50 × 2 = $125.00
    expect(result.platformFeeCents).toBe(2500) // 20% of $125.00 = $25.00
    expect(result.totalCents).toBe(15000) // $125.00 + $25.00 = $150.00
    expect(result.creatorEarningsCents).toBe(12500) // Creator gets $125.00
    
    // Format for human verification
    const subtotal = result.subtotalCents / 100
    const platformFee = result.platformFeeCents / 100  
    const total = result.totalCents / 100
    const creatorEarnings = result.creatorEarningsCents / 100
    
    console.log('USER TEST SCENARIO RESULTS:')
    console.log(`Base Price: $${basePriceCents / 100}`)
    console.log(`With 25% Rush: $${unitPriceWithRush / 100}`)
    console.log(`Quantity: ${quantity}`)
    console.log(`Subtotal: $${subtotal}`)
    console.log(`Platform Fee (20%): $${platformFee}`)
    console.log(`Total: $${total}`)
    console.log(`Creator Earnings: $${creatorEarnings}`)
  })
})

// Test Suite 4: Edge Cases and Validation
describe('validateOfferPricing', () => {
  test('should validate correct offer data', () => {
    const offerData = {
      items: [{
        deliverable_type: 'IG_Reel',
        qty: 2,
        unit_price_cents: 6250,
        currency: 'USD'
      }],
      subtotal_cents: 12500,
      platform_fee_pct: 20,
      platform_fee_cents: 2500,
      total_cents: 15000,
      currency: 'USD'
    }
    
    const result = validateOfferPricing(offerData)
    
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('should detect calculation mismatches', () => {
    const offerData = {
      items: [{
        deliverable_type: 'IG_Reel',
        qty: 2,
        unit_price_cents: 6250,
        currency: 'USD'
      }],
      subtotal_cents: 10000, // WRONG: should be 12500
      platform_fee_pct: 20,
      platform_fee_cents: 2000, // WRONG: should be 2500
      total_cents: 12000, // WRONG: should be 15000
      currency: 'USD'
    }
    
    const result = validateOfferPricing(offerData)
    
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Subtotal calculation mismatch')
    expect(result.errors).toContain('Total calculation mismatch')
  })
})

// Test Suite 5: Currency Conversion
describe('convertCurrency', () => {
  test('should handle same currency conversion', () => {
    const result = convertCurrency(5000, 'USD', 'USD')
    expect(result).toBe(5000)
  })

  test('should convert USD to MYR correctly', () => {
    const result = convertCurrency(5000, 'USD', 'MYR') // $50 USD
    expect(result).toBe(23500) // $50 × 4.7 = RM235
  })

  test('should convert USD to SGD correctly', () => {
    const result = convertCurrency(5000, 'USD', 'SGD') // $50 USD  
    expect(result).toBe(6750) // $50 × 1.35 = S$67.50
  })
})

// Test Suite 6: Offer Items Generation
describe('generateOfferItems', () => {
  test('should generate offer items with rush pricing', () => {
    const selections = [{
      creatorId: 'creator-1',
      deliverableType: 'IG_Reel',
      qty: 2,
      rushPct: 25
    }]
    
    const rateCards = [{
      creator_id: 'creator-1',
      deliverable_type: 'IG_Reel',
      base_price_cents: 5000,
      currency: 'USD',
      rush_pct: 0
    }]
    
    const result = generateOfferItems(selections, rateCards)
    
    expect(result).toHaveLength(1)
    expect(result[0].qty).toBe(2)
    expect(result[0].unit_price_cents).toBe(6250) // Base + 25% rush
    expect(result[0].rush_pct).toBe(25)
  })
})

// Run all tests
console.log('Starting Cost Estimator Tests...')