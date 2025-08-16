/**
 * Campaign Cache Management Utility
 * Handles localStorage caching for campaign data across the platform
 */

const CACHE_KEYS = {
  CAMPAIGNS: 'brand_campaigns_cache',
  STATS: 'brand_stats_cache', 
  TIMESTAMP: 'brand_campaigns_cache_time'
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get campaigns from cache
 */
export const getCachedCampaigns = () => {
  if (typeof window === 'undefined') return null
  
  try {
    const cached = localStorage.getItem(CACHE_KEYS.CAMPAIGNS)
    const timestamp = localStorage.getItem(CACHE_KEYS.TIMESTAMP)
    
    if (!cached || !timestamp) return null
    
    const cacheAge = Date.now() - parseInt(timestamp)
    if (cacheAge > CACHE_DURATION) {
      console.log('🕒 Campaign cache expired, needs refresh')
      return null
    }
    
    console.log('✅ Using cached campaigns (age:', Math.round(cacheAge / 1000), 'seconds)')
    return JSON.parse(cached)
  } catch (e) {
    console.warn('Failed to get cached campaigns:', e)
    return null
  }
}

/**
 * Get stats from cache
 */
export const getCachedStats = () => {
  if (typeof window === 'undefined') return null
  
  try {
    const cached = localStorage.getItem(CACHE_KEYS.STATS)
    return cached ? JSON.parse(cached) : null
  } catch (e) {
    console.warn('Failed to get cached stats:', e)
    return null
  }
}

/**
 * Update campaigns cache
 */
export const updateCampaignsCache = (campaigns) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(CACHE_KEYS.CAMPAIGNS, JSON.stringify(campaigns))
    localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString())
    console.log('💾 Campaigns cache updated with', campaigns.length, 'campaigns')
  } catch (e) {
    console.warn('Failed to update campaigns cache:', e)
  }
}

/**
 * Update stats cache
 */
export const updateStatsCache = (stats) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(CACHE_KEYS.STATS, JSON.stringify(stats))
    console.log('💾 Stats cache updated')
  } catch (e) {
    console.warn('Failed to update stats cache:', e)
  }
}

/**
 * Remove campaign from cache (for deletions)
 */
export const removeCampaignFromCache = (campaignId) => {
  if (typeof window === 'undefined') return
  
  try {
    const cached = getCachedCampaigns()
    if (!cached) return
    
    const updatedCampaigns = cached.filter(c => c.id !== campaignId)
    updateCampaignsCache(updatedCampaigns)
    
    console.log('🗑️ Campaign', campaignId, 'removed from cache')
    return updatedCampaigns
  } catch (e) {
    console.warn('Failed to remove campaign from cache:', e)
    return null
  }
}

/**
 * Add campaign to cache (for new campaigns)
 */
export const addCampaignToCache = (campaign) => {
  if (typeof window === 'undefined') return
  
  try {
    const cached = getCachedCampaigns() || []
    const updatedCampaigns = [campaign, ...cached]
    updateCampaignsCache(updatedCampaigns)
    
    console.log('➕ Campaign', campaign.id, 'added to cache')
    return updatedCampaigns
  } catch (e) {
    console.warn('Failed to add campaign to cache:', e)
    return null
  }
}

/**
 * Clear all campaign cache
 */
export const clearCampaignCache = () => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(CACHE_KEYS.CAMPAIGNS)
    localStorage.removeItem(CACHE_KEYS.STATS)
    localStorage.removeItem(CACHE_KEYS.TIMESTAMP)
    console.log('🧹 Campaign cache cleared')
  } catch (e) {
    console.warn('Failed to clear campaign cache:', e)
  }
}

/**
 * Check if cache is fresh
 */
export const isCacheFresh = () => {
  if (typeof window === 'undefined') return false
  
  try {
    const timestamp = localStorage.getItem(CACHE_KEYS.TIMESTAMP)
    if (!timestamp) return false
    
    const cacheAge = Date.now() - parseInt(timestamp)
    return cacheAge < CACHE_DURATION
  } catch (e) {
    return false
  }
}