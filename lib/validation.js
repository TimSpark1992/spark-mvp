import { z } from 'zod'

// Base validation schemas
export const emailSchema = z.string().email('Please enter a valid email address')
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')

export const roleSchema = z.enum(['creator', 'brand', 'admin'], {
  errorMap: () => ({ message: 'Please select a valid role' })
})

// User schemas
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
  role: roleSchema
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
})

// Profile schemas
export const profileUpdateSchema = z.object({
  full_name: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .optional(),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  website_url: z.string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  company_name: z.string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be less than 100 characters')
    .optional(),
  industry: z.string()
    .max(100, 'Industry must be less than 100 characters')
    .optional(),
  category_tags: z.array(z.string()).max(10, 'Maximum 10 categories allowed').optional(),
  social_links: z.record(z.string().url('Please enter valid URLs')).optional()
})

// Campaign schemas
export const campaignSchema = z.object({
  title: z.string()
    .min(5, 'Campaign title must be at least 5 characters')
    .max(200, 'Campaign title must be less than 200 characters'),
  description: z.string()
    .min(20, 'Campaign description must be at least 20 characters')
    .max(2000, 'Campaign description must be less than 2000 characters'),
  category: z.string()
    .min(1, 'Please select a category'),
  budget_range: z.string()
    .min(1, 'Please select a budget range'),
  creator_requirements: z.string()
    .max(1000, 'Creator requirements must be less than 1000 characters')
    .optional(),
  deadline: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date')
    .optional()
    .or(z.literal(''))
})

// Application schemas
export const applicationSchema = z.object({
  note: z.string()
    .min(10, 'Application note must be at least 10 characters')
    .max(1000, 'Application note must be less than 1000 characters'),
  media_kit_url: z.string()
    .url('Please enter a valid media kit URL')
    .optional()
    .or(z.literal(''))
})

// Utility functions for validation
export const validateInput = (schema, data) => {
  try {
    return { success: true, data: schema.parse(data), error: null }
  } catch (error) {
    return { 
      success: false, 
      data: null, 
      error: error.errors?.[0]?.message || 'Validation failed' 
    }
  }
}

export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 10000) // Limit length for security
}

export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj
  
  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      )
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}