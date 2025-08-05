import { supabase } from './supabase'
import { sanitizeObject, validateInputEnhanced, enhancedSignUpSchema, enhancedSignInSchema } from './validation-enhanced'
import { sanitizeFieldValue } from './xss-protection'

// Enhanced auth functions with validation and error handling
export const authSignUp = async (formData) => {
  try {
    // Validate input data
    const validation = validateInput(signUpSchema, formData)
    if (!validation.success) {
      return { data: null, error: { message: validation.error } }
    }

    const { email, password, fullName, role } = validation.data
    
    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role
        },
        emailRedirectTo: `${window?.location?.origin || ''}/auth/callback`
      }
    })

    if (error) {
      return { data: null, error }
    }

    // If user was created, create profile
    if (data.user) {
      const profileData = sanitizeObject({
        id: data.user.id,
        email: email,
        full_name: fullName,
        role: role
      })

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()

      if (profileError) {
        console.error('Profile creation error:', profileError)
        return { 
          data: null, 
          error: { message: 'Account created but profile setup failed. Please contact support.' }
        }
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Auth signup error:', error)
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred during signup' }
    }
  }
}

export const authSignIn = async (formData) => {
  try {
    // Validate input data
    const validation = validateInput(signInSchema, formData)
    if (!validation.success) {
      return { data: null, error: { message: validation.error } }
    }

    const { email, password } = validation.data

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Auth signin error:', error)
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred during signin' }
    }
  }
}

export const authSignOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    console.error('Auth signout error:', error)
    return { error: { message: 'Failed to sign out' } }
  }
}

export const authGetSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  } catch (error) {
    console.error('Get session error:', error)
    return { session: null, error }
  }
}

// Role-based permission checks
export const hasPermission = (userRole, requiredRole) => {
  if (!userRole || !requiredRole) return false
  
  // Admin has access to everything
  if (userRole === 'admin') return true
  
  // Exact role match
  if (userRole === requiredRole) return true
  
  return false
}

export const canAccessResource = (userRole, resourceOwnerId, currentUserId) => {
  // Admin can access anything
  if (userRole === 'admin') return true
  
  // User can access their own resources
  if (resourceOwnerId === currentUserId) return true
  
  return false
}

// Rate limiting helper (simple implementation)
const rateLimitStore = new Map()

export const checkRateLimit = (identifier, maxRequests = 5, windowMs = 60000) => {
  const now = Date.now()
  const windowStart = now - windowMs
  
  if (!rateLimitStore.has(identifier)) {
    rateLimitStore.set(identifier, [])
  }
  
  const requests = rateLimitStore.get(identifier)
  
  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => timestamp > windowStart)
  rateLimitStore.set(identifier, validRequests)
  
  // Check if limit exceeded
  if (validRequests.length >= maxRequests) {
    return false
  }
  
  // Add current request
  validRequests.push(now)
  rateLimitStore.set(identifier, validRequests)
  
  return true
}