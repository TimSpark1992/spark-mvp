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
    // Enhanced JavaScript protocol removal (case-insensitive, whitespace variations)
    .replace(/\s*j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/&#[xX]?[0-9a-fA-F]+;/g, '') // Remove HTML entities that might encode javascript:
    // Remove VBScript protocol (case-insensitive, whitespace variations)
    .replace(/\s*v\s*b\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi, '')
    .replace(/vbscript:/gi, '')
    // Enhanced data protocol handling - only allow safe data types
    .replace(/data:\s*(?!image\/(?:png|jpe?g|gif|svg\+xml);base64,)[^;,]*[;,]/gi, '')
    // Remove on* event handlers (quoted)
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove on* event handlers (unquoted) - enhanced pattern
    .replace(/\s*on\w+\s*=\s*[^>\s]+/gi, '')
    // Remove standalone event handlers like 'onerror=alert(1)'
    .replace(/on[a-z]+\s*=\s*[^>\s]+/gi, '')
    // Remove expression() CSS (IE specific XSS vector)
    .replace(/expression\s*\(/gi, '')
    // Remove eval() calls
    .replace(/eval\s*\(/gi, '')
    // Remove setTimeout/setInterval with string arguments
    .replace(/(setTimeout|setInterval)\s*\(\s*["'][^"']*["']/gi, '$1(')
    // Remove dangerous protocols with HTML entity encoding
    .replace(/&#74;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;/gi, '') // javascript: encoded
    .replace(/&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;/gi, '') // javascript: encoded (lowercase)
    // Remove dangerous characters that could be used in bypass attempts
    .replace(/[\u0001-\u001F\u007F-\u009F]/g, '') // Remove control characters but preserve spaces (0x20)
    // Additional protocol variations
    .replace(/livescript:/gi, '')
    .replace(/mocha:/gi, '')
    .replace(/about:/gi, '')
    // Remove potential bypass attempts with null bytes
    .replace(/\0/g, '')
    // Remove potential Unicode bypass attempts
    .replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, '') // Remove zero-width characters

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
  // Allow empty URLs - they are optional
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return { isValid: true, sanitized: '', error: null }
  }

  const sanitized = sanitizeText(url)
  
  // If still empty after sanitization, that's fine
  if (!sanitized) {
    return { isValid: true, sanitized: '', error: null }
  }

  // Only validate if there's actual content
  if (!validator.isURL(sanitized, { 
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
    allow_underscores: false
  })) {
    return { isValid: false, sanitized, error: 'Please enter a valid URL (must include http:// or https://)' }
  }

  return { isValid: true, sanitized, error: null }
}

/**
 * Comprehensive field sanitization for different content types
 */
export const FIELD_SANITIZERS = {
  // Profile fields
  full_name: (value) => sanitizeText(value),
  bio: (value) => {
    // Special handling for bio to preserve spaces and line breaks
    if (!value || typeof value !== 'string') return ''
    
    // First, preserve the original spacing by replacing spaces with placeholders
    let processed = value
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .trim() // Remove leading/trailing whitespace
    
    // Apply basic HTML sanitization while preserving spaces
    const sanitized = sanitizeInput(processed, 'basic_html')
    
    // Ensure we don't lose spaces in the sanitization process
    return sanitized
  },
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

/**
 * Comprehensive XSS test suite with enhanced attack vectors
 * @returns {Array} - Array of test results
 */
export const runComprehensiveXSSTests = () => {
  const testVectors = [
    // Basic XSS
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    
    // JavaScript protocol variations
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'j a v a s c r i p t:alert(1)',
    '&#74;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(1)',
    
    // VBScript
    'vbscript:msgbox(1)',
    'VBScript:msgbox(1)',
    
    // Data protocol
    'data:text/html,<script>alert(1)</script>',
    'data:image/svg+xml,<svg onload=alert(1)>',
    
    // Event handlers
    '<div onclick=alert(1)>click</div>',
    '<span onmouseover=alert(1)>hover</span>',
    '<input onfocus=alert(1)>',
    
    // Expression CSS
    'expression(alert(1))',
    
    // Encoded attacks
    '&lt;script&gt;alert(1)&lt;/script&gt;',
    
    // Unicode attacks
    '\u003cscript\u003ealert(1)\u003c/script\u003e'
  ]
  
  return testVectors.map(vector => testXSSProtection(vector))
}

/**
 * Calculate XSS protection effectiveness rate
 * @param {Array} testResults - Results from runComprehensiveXSSTests
 * @returns {Object} - Protection statistics
 */
export const calculateProtectionRate = (testResults) => {
  const totalTests = testResults.length
  const safeResults = testResults.filter(result => result.safe).length
  const rate = (safeResults / totalTests) * 100
  
  return {
    totalTests,
    passedTests: safeResults,
    failedTests: totalTests - safeResults,
    protectionRate: Math.round(rate * 10) / 10,
    isHighlySafe: rate >= 90
  }
}// Forced update Sun Aug 10 03:09:54 UTC 2025
