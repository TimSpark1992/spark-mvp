// lib/auth-helpers.js
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with environment variable checks
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase environment variables not configured for auth-helpers')
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function verifyAdminAccess(request) {
  try {
    const supabase = getSupabaseClient()
    
    if (!supabase) {
      return { 
        success: false, 
        isAdmin: false, 
        error: 'Supabase not configured - authentication unavailable during build' 
      }
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, isAdmin: false, error: 'No authorization token provided' }
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return { success: false, isAdmin: false, error: 'Invalid or expired token' }
    }
    
    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      return { isAdmin: false, error: 'User profile not found' }
    }
    
    const isAdmin = profile.role === 'admin'
    
    return {
      isAdmin,
      user,
      profile,
      error: isAdmin ? null : 'Admin role required'
    }
    
  } catch (error) {
    console.error('❌ Admin verification error:', error)
    return { isAdmin: false, error: 'Failed to verify admin access' }
  }
}