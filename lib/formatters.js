// lib/formatters.js
// Utility functions for consistent formatting across the application

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'MYR', symbol: 'RM', label: 'Malaysian Ringgit' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' }
]

/**
 * Format price in cents to currency string
 * Handles null, undefined, NaN, and negative values gracefully
 */
export const formatPrice = (priceCents, currency = 'USD') => {
  // Handle null, undefined, or invalid price values
  // Note: 0 is a valid price, so we specifically check for null/undefined
  if (priceCents === null || priceCents === undefined || isNaN(priceCents) || priceCents < 0) {
    const currencyInfo = CURRENCIES.find(c => c.code === currency)
    return `${currencyInfo?.symbol || '$'}0.00`
  }
  
  const price = priceCents / 100
  const currencyInfo = CURRENCIES.find(c => c.code === currency)
  return `${currencyInfo?.symbol || '$'}${price.toFixed(2)}`
}

/**
 * Format date string to localized date
 * Handles null, undefined, and invalid dates gracefully
 */
export const formatDate = (dateString, fallback = 'Recently') => {
  // Handle null, undefined, or invalid date values
  if (!dateString) {
    return fallback
  }
  
  try {
    const date = new Date(dateString)
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return fallback
    }
    return date.toLocaleDateString()
  } catch (error) {
    console.warn('Invalid date format:', dateString, error)
    return fallback
  }
}

/**
 * Format relative date (e.g., "2 days ago")
 * Handles null, undefined, and invalid dates gracefully
 */
export const formatRelativeDate = (dateString, fallback = 'Recently') => {
  if (!dateString) {
    return fallback
  }
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return fallback
    }
    
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  } catch (error) {
    console.warn('Invalid date format for relative date:', dateString, error)
    return fallback
  }
}

/**
 * Format percentage value
 * Handles null, undefined, and invalid values gracefully
 */
export const formatPercentage = (value, fallback = '0%') => {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback
  }
  return `${value}%`
}

/**
 * Safe number parsing that returns 0 for invalid values
 */
export const safeParseInt = (value, fallback = 0) => {
  const parsed = parseInt(value)
  return isNaN(parsed) ? fallback : parsed
}

/**
 * Safe number parsing for floats that returns 0 for invalid values
 */
export const safeParseFloat = (value, fallback = 0) => {
  const parsed = parseFloat(value)
  return isNaN(parsed) ? fallback : parsed
}