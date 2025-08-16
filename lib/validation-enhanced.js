import { z } from 'zod'
import { sanitizeFieldValue, validateEmail, validateURL, sanitizeText } from './xss-protection'

// Custom Zod transforms with XSS protection
const createSanitizedString = (fieldName, minLength = 0, maxLength = 1000) => {
  return z.string()
    .transform((val) => sanitizeFieldValue(fieldName, val))
    .refine((val) => val.length >= minLength, {
      message: `Must be at least ${minLength} characters`
    })
    .refine((val) => val.length <= maxLength, {
      message: `Must be less than ${maxLength} characters`
    })
}

const createSanitizedEmail = () => {
  return z.string()
    .transform((val) => {
      const result = validateEmail(val)
      if (!result.isValid) {
        throw new Error(result.error)
      }
      return result.sanitized
    })
}

const createSanitizedURL = () => {
  return z.string()
    .optional()
    .transform((val) => {
      if (!val) return ''
      const result = validateURL(val)
      if (!result.isValid) {
        throw new Error(result.error)
      }
      return result.sanitized
    })
}

// Enhanced validation schemas with XSS protection
export const enhancedSignUpSchema = z.object({
  email: createSanitizedEmail(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  fullName: createSanitizedString('full_name', 2, 100)
    .refine((val) => /^[a-zA-Z\s'-]+$/.test(val), {
      message: 'Full name can only contain letters, spaces, hyphens, and apostrophes'
    }),
  role: z.enum(['creator', 'brand', 'admin'], {
    errorMap: () => ({ message: 'Please select a valid role' })
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const enhancedSignInSchema = z.object({
  email: createSanitizedEmail(),
  password: z.string().min(1, 'Password is required')
})

export const enhancedProfileUpdateSchema = z.object({
  full_name: createSanitizedString('full_name', 2, 100).optional(),
  bio: createSanitizedString('bio', 0, 500).optional(),
  website_url: createSanitizedURL().optional(),
  company_name: createSanitizedString('company_name', 2, 100).optional(),
  industry: createSanitizedString('industry', 0, 100).optional(),
  category_tags: z.array(z.string().transform(val => sanitizeText(val)))
    .max(10, 'Maximum 10 categories allowed')
    .optional(),
  social_links: z.record(z.string().transform(val => {
    const result = validateURL(val)
    if (!result.isValid) {
      throw new Error(result.error)
    }
    return result.sanitized
  })).optional()
})

export const enhancedCampaignSchema = z.object({
  title: createSanitizedString('title', 5, 200),
  description: createSanitizedString('description', 20, 2000),
  category: createSanitizedString('category', 1, 100),
  budget_range: createSanitizedString('budget_range', 1, 50),
  creator_requirements: createSanitizedString('creator_requirements', 0, 1000).optional(),
  deadline: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date')
    .optional()
    .or(z.literal(''))
})

export const enhancedApplicationSchema = z.object({
  note: createSanitizedString('note', 10, 1000),
  media_kit_url: createSanitizedURL().optional()
})

// Utility function for validation with enhanced XSS protection
export const validateInputEnhanced = (schema, data) => {
  try {
    const result = schema.parse(data)
    return { success: true, data: result, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return { 
        success: false, 
        data: null, 
        error: firstError?.message || 'Validation failed',
        field: firstError?.path?.[0] || null
      }
    }
    return { 
      success: false, 
      data: null, 
      error: error.message || 'Validation failed' 
    }
  }
}

// XSS test vectors for validation testing
export const XSS_TEST_VECTORS = [
  '<script>alert("xss")</script>',
  '<img src="x" onerror="alert(1)">',
  'javascript:alert("xss")',
  '<iframe src="javascript:alert(1)"></iframe>',
  '<svg onload="alert(1)">',
  '<body onload="alert(1)">',
  '<div onclick="alert(1)">Click me</div>',
  '<a href="javascript:alert(1)">Link</a>',
  '"><script>alert(1)</script>',
  '\';alert(1);var a=\'',
  '<script>document.cookie</script>',
  '<img src="" onerror="window.location=\'http://evil.com\'">',
  'data:text/html,<script>alert(1)</script>',
  'vbscript:msgbox("xss")',
  '<style>@import "javascript:alert(1)"</style>'
]

// Test XSS protection against all test vectors
export const runXSSProtectionTest = () => {
  const results = XSS_TEST_VECTORS.map(vector => {
    const titleResult = validateInputEnhanced(
      z.object({ title: createSanitizedString('title', 1, 200) }),
      { title: vector }
    )
    
    return {
      original: vector,
      sanitized: titleResult.data?.title || '[REJECTED]',
      safe: titleResult.success && 
            !titleResult.data?.title.toLowerCase().includes('script') &&
            !titleResult.data?.title.toLowerCase().includes('javascript:') &&
            !/on\w+\s*=/i.test(titleResult.data?.title || ''),
      blocked: !titleResult.success
    }
  })
  
  const totalTests = results.length
  const safeResults = results.filter(r => r.safe || r.blocked).length
  const successRate = (safeResults / totalTests) * 100
  
  return {
    results,
    totalTests,
    safeResults,
    successRate,
    allSafe: successRate === 100
  }
}