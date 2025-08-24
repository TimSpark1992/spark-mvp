/**
 * Rate Card Cache Management Utility
 * Handles localStorage caching for rate card data with proper CRUD operations
 */

const CACHE_KEYS = {
  RATE_CARDS: 'creator_rate_cards_cache',
  TIMESTAMP: 'creator_rate_cards_cache_time'
}

const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes (shorter for better consistency)

/**
 * Get rate cards from cache
 */
export const getCachedRateCards = (creatorId) => {
  if (typeof window === 'undefined') return null
  
  try {
    const cached = localStorage.getItem(`${CACHE_KEYS.RATE_CARDS}_${creatorId}`)
    const timestamp = localStorage.getItem(`${CACHE_KEYS.TIMESTAMP}_${creatorId}`)
    
    if (!cached || !timestamp) return null
    
    const cacheAge = Date.now() - parseInt(timestamp)
    if (cacheAge > CACHE_DURATION) {
      console.log('🕒 Rate card cache expired, needs refresh')
      clearRateCardCache(creatorId)
      return null
    }
    
    console.log('✅ Using cached rate cards (age:', Math.round(cacheAge / 1000), 'seconds)')
    return JSON.parse(cached)
  } catch (e) {
    console.warn('Failed to get cached rate cards:', e)
    return null
  }
}

/**
 * Update rate cards cache
 */
export const updateRateCardsCache = (creatorId, rateCards) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(`${CACHE_KEYS.RATE_CARDS}_${creatorId}`, JSON.stringify(rateCards))
    localStorage.setItem(`${CACHE_KEYS.TIMESTAMP}_${creatorId}`, Date.now().toString())
    console.log('💾 Rate cards cache updated with', rateCards.length, 'rate cards for creator', creatorId)
  } catch (e) {
    console.warn('Failed to update rate cards cache:', e)
  }
}

/**
 * Remove rate card from cache (for deletions)
 */
export const removeRateCardFromCache = (creatorId, rateCardId) => {
  if (typeof window === 'undefined') return
  
  try {
    const cached = getCachedRateCards(creatorId)
    if (!cached) return null
    
    const updatedRateCards = cached.filter(card => card.id !== rateCardId)
    updateRateCardsCache(creatorId, updatedRateCards)
    
    console.log('🗑️ Rate card', rateCardId, 'removed from cache for creator', creatorId)
    return updatedRateCards
  } catch (e) {
    console.warn('Failed to remove rate card from cache:', e)
    return null
  }
}

/**
 * Add rate card to cache (for new rate cards)
 */
export const addRateCardToCache = (creatorId, rateCard) => {
  if (typeof window === 'undefined') return
  
  try {
    const cached = getCachedRateCards(creatorId) || []
    const updatedRateCards = [...cached, rateCard]
    updateRateCardsCache(creatorId, updatedRateCards)
    
    console.log('➕ Rate card', rateCard.id, 'added to cache for creator', creatorId)
    return updatedRateCards
  } catch (e) {
    console.warn('Failed to add rate card to cache:', e)
    return null
  }
}

/**
 * Update existing rate card in cache (for edits)
 */
export const updateRateCardInCache = (creatorId, rateCardId, updatedRateCard) => {
  if (typeof window === 'undefined') return
  
  try {
    const cached = getCachedRateCards(creatorId)
    if (!cached) return null
    
    const cardIndex = cached.findIndex(card => card.id === rateCardId)
    if (cardIndex === -1) {
      console.warn('Rate card not found in cache for update:', rateCardId)
      return null
    }
    
    // Update the rate card in the cache array
    const updatedRateCards = [...cached]
    updatedRateCards[cardIndex] = { ...cached[cardIndex], ...updatedRateCard }
    
    updateRateCardsCache(creatorId, updatedRateCards)
    
    console.log('✏️ Rate card', rateCardId, 'updated in cache for creator', creatorId)
    return updatedRateCards
  } catch (e) {
    console.warn('Failed to update rate card in cache:', e)
    return null
  }
}

/**
 * Clear rate card cache for specific creator
 */
export const clearRateCardCache = (creatorId) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(`${CACHE_KEYS.RATE_CARDS}_${creatorId}`)
    localStorage.removeItem(`${CACHE_KEYS.TIMESTAMP}_${creatorId}`)
    console.log('🧹 Rate card cache cleared for creator', creatorId)
  } catch (e) {
    console.warn('Failed to clear rate card cache:', e)
  }
}

/**
 * Clear all rate card caches (for global cleanup)
 */
export const clearAllRateCardCaches = () => {
  if (typeof window === 'undefined') return
  
  try {
    // Get all localStorage keys and remove rate card cache keys
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.includes('creator_rate_cards_cache')) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    console.log('🧹 All rate card caches cleared')
  } catch (e) {
    console.warn('Failed to clear all rate card caches:', e)
  }
}

/**
 * Check if cache is fresh for specific creator
 */
export const isRateCardCacheFresh = (creatorId) => {
  if (typeof window === 'undefined') return false
  
  try {
    const timestamp = localStorage.getItem(`${CACHE_KEYS.TIMESTAMP}_${creatorId}`)
    if (!timestamp) return false
    
    const cacheAge = Date.now() - parseInt(timestamp)
    return cacheAge < CACHE_DURATION
  } catch (e) {
    return false
  }
}