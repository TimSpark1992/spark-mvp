import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

// XSS Protection Configuration
const XSS_CONFIG = {
  // DOMPurify configuration for different content types
  STRICT: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i
  },
  
  BASIC_HTML: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  },
  
  RICH_TEXT: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['class'],
    KEEP_CONTENT: true
  }
}

/**
 * Sanitize string input with strict XSS protection
 * @param {string} input - Raw user input
 * @param {string} type - Type of content ('strict', 'basic_html', 'rich_text')
 * @returns {string} - Sanitized safe string
 */
export const sanitizeInput = (input, type = 'strict') => {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // First pass: Remove obviously dangerous content
  let sanitized = input
    .trim()
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove on* event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove data: protocol (potential XSS vector)
    .replace(/data:/gi, '')
    // Remove vbscript: protocol
    .replace(/vbscript:/gi, '')
    // Remove expression() CSS
    .replace(/expression\s*\(/gi, '')

  // Second pass: DOMPurify sanitization based on content type
  const config = XSS_CONFIG[type.toUpperCase()] || XSS_CONFIG.STRICT

  try {
    sanitized = DOMPurify.sanitize(sanitized, config)
  } catch (error) {
    console.error('DOMPurify sanitization error:', error)
    // Fallback: return empty string if sanitization fails
    return ''
  }

  // Third pass: Additional validation
  // Remove any remaining potentially dangerous patterns
  sanitized = sanitized
    .replace(/&lt;script/gi, '')
    .replace(/&lt;\/script/gi, '')
    .replace(/&lt;iframe/gi, '')
    .replace(/&lt;object/gi, '')
    .replace(/&lt;embed/gi, '')

  // Limit length to prevent DoS attacks
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000)
  }

  return sanitized
}

/**
 * Sanitize HTML content for rich text fields
 * @param {string} html - Raw HTML input
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHTML = (html) => {
  return sanitizeInput(html, 'rich_text')
}

/**
 * Sanitize plain text with no HTML allowed
 * @param {string} text - Raw text input
 * @returns {string} - Sanitized plain text
 */
export const sanitizeText = (text) => {
  return sanitizeInput(text, 'strict')
}

/**
 * Sanitize object with multiple fields
 * @param {Object} obj - Object with potentially unsafe fields
 * @param {Object} fieldTypes - Mapping of field names to sanitization types
 * @returns {Object} - Object with sanitized fields
 */
export const sanitizeObject = (obj, fieldTypes = {}) => {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  const sanitized = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      const sanitizationType = fieldTypes[key] || 'strict'
      sanitized[key] = sanitizeInput(value, sanitizationType)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' 
          ? sanitizeInput(item, fieldTypes[key] || 'strict')
          : item
      )
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, fieldTypes[key] || {})
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Validate email with XSS protection
 * @param {string} email - Email input
 * @returns {Object} - Validation result
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, sanitized: '', error: 'Email is required' }
  }

  const sanitized = sanitizeText(email)
  
  if (!validator.isEmail(sanitized)) {
    return { isValid: false, sanitized, error: 'Invalid email format' }
  }

  if (sanitized.length > 254) {
    return { isValid: false, sanitized, error: 'Email too long' }
  }

  return { isValid: true, sanitized, error: null }
}

/**
 * Validate URL with XSS protection
 * @param {string} url - URL input
 * @returns {Object} - Validation result
 */
export const validateURL = (url) => {
  if (!url || typeof url !== 'string') {
    return { isValid: true, sanitized: '', error: null } // URL is optional
  }

  const sanitized = sanitizeText(url)

  if (!validator.isURL(sanitized, { 
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
    allow_underscores: false
  })) {
    return { isValid: false, sanitized, error: 'Invalid URL format' }
  }

  return { isValid: true, sanitized, error: null }
}

/**
 * Comprehensive field sanitization for different content types
 */
export const FIELD_SANITIZERS = {
  // Profile fields
  full_name: (value) => sanitizeText(value),
  bio: (value) => sanitizeInput(value, 'basic_html'),
  company_name: (value) => sanitizeText(value),
  industry: (value) => sanitizeText(value),
  website_url: (value) => {
    const result = validateURL(value)
    return result.sanitized
  },
  
  // Campaign fields
  title: (value) => sanitizeText(value),
  description: (value) => sanitizeInput(value, 'basic_html'),
  category: (value) => sanitizeText(value),
  budget_range: (value) => sanitizeText(value),
  creator_requirements: (value) => sanitizeInput(value, 'basic_html'),
  
  // Application fields
  note: (value) => sanitizeInput(value, 'basic_html'),
  media_kit_url: (value) => {
    const result = validateURL(value)
    return result.sanitized
  },
  
  // Social links
  social_links: (value) => {
    if (!value || typeof value !== 'object') return {}
    const sanitized = {}
    for (const [platform, url] of Object.entries(value)) {
      const platformSanitized = sanitizeText(platform)
      const urlResult = validateURL(url)
      if (urlResult.isValid) {
        sanitized[platformSanitized] = urlResult.sanitized
      }
    }
    return sanitized
  },
  
  // Tags array
  category_tags: (value) => {
    if (!Array.isArray(value)) return []
    return value.map(tag => sanitizeText(tag)).filter(tag => tag.length > 0)
  }
}

/**
 * Sanitize user input based on field type
 * @param {string} fieldName - Name of the field
 * @param {any} value - Field value
 * @returns {any} - Sanitized value
 */
export const sanitizeFieldValue = (fieldName, value) => {
  const sanitizer = FIELD_SANITIZERS[fieldName]
  if (sanitizer) {
    return sanitizer(value)
  }
  // Default to strict text sanitization
  return typeof value === 'string' ? sanitizeText(value) : value
}

/**
 * Test XSS protection with common attack vectors
 * @param {string} input - Test input
 * @returns {Object} - Test results
 */
export const testXSSProtection = (input) => {
  const originalLength = input.length
  const sanitized = sanitizeText(input)
  const sanitizedLength = sanitized.length
  
  const testResults = {
    original: input,
    sanitized: sanitized,
    lengthChanged: originalLength !== sanitizedLength,
    potentiallyDangerous: originalLength > sanitizedLength,
    containsScript: input.toLowerCase().includes('script'),
    containsJavascript: input.toLowerCase().includes('javascript:'),
    containsOnEvent: /on\w+\s*=/i.test(input),
    safe: !sanitized.toLowerCase().includes('script') && 
          !sanitized.toLowerCase().includes('javascript:') &&
          !/on\w+\s*=/i.test(sanitized)
  }
  
  return testResults
}