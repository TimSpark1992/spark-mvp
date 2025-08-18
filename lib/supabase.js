import { createClient } from '@supabase/supabase-js'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ SUPABASE CONFIGURATION ERROR:')
  console.error('Missing environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Present' : '❌ Missing')
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Present' : '❌ Missing')
  throw new Error('Supabase environment variables are not configured properly. Check .env.local file.')
}

console.log('✅ Supabase configuration loaded successfully')
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Missing')

// Configure Supabase client with timeout handling for production network conditions
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options = {}) => {
      // Create AbortController for timeout handling
      const controller = new AbortController()
      
      // Set 25-second timeout for Supabase operations (longer than frontend 10s timeout)
      const timeoutId = setTimeout(() => controller.abort(), 25000)
      
      // Use AbortController signal
      const fetchOptions = {
        ...options,
        signal: controller.signal
      }
      
      return fetch(url, fetchOptions)
        .finally(() => clearTimeout(timeoutId))
        .catch(error => {
          if (error.name === 'AbortError') {
            throw new Error('Supabase request timed out. Please check your internet connection and try again.')
          }
          throw error
        })
    }
  }
})

// Auth helpers
export const signUp = async (email, password, userData) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
      emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
    }
  })
  
  // If signup successful, create profile record
  if (data.user && !error) {
    try {
      console.log('🔄 Creating profile for user:', data.user.id, 'with role:', userData.role)
      
      const profileData = {
        id: data.user.id,
        email: email,
        full_name: userData.full_name,
        role: userData.role
      }
      
      // Add timeout to profile creation to prevent hanging
      const profileTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile creation timeout')), 15000)
      )
      
      const profileCreation = supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()
      
      const { data: profile, error: profileError } = await Promise.race([
        profileCreation,
        profileTimeout
      ])
      
      if (profileError) {
        console.error('❌ Profile creation failed:', profileError)
        // Don't fail the entire signup for profile creation issues
        console.warn('⚠️ Continuing with signup despite profile creation failure')
      } else {
        console.log('✅ Profile created successfully:', profile)
      }
    } catch (profileErr) {
      console.error('❌ Profile creation exception:', profileErr)
      return { 
        data: null, 
        error: { 
          message: `Profile creation failed: ${profileErr.message}. Please contact support.`,
          originalError: profileErr
        } 
      }
    }
  }
  
  return { data, error }
}

export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    // Enhanced error handling
    if (error) {
      console.error('Supabase signIn error:', error)
      
      // Provide user-friendly error messages
      let userMessage = error.message
      
      if (error.message.includes('Invalid login credentials')) {
        userMessage = 'Invalid email or password. Please check your credentials and try again.'
      } else if (error.message.includes('Email not confirmed')) {
        userMessage = 'Please check your email and click the confirmation link before signing in.'
      } else if (error.message.includes('Too many requests')) {
        userMessage = 'Too many login attempts. Please wait a moment before trying again.'
      } else if (error.message.includes('Network request failed')) {
        userMessage = 'Network error. Please check your internet connection and try again.'
      }
      
      return { data: null, error: { ...error, message: userMessage } }
    }
    
    if (data?.user) {
      console.log('SignIn successful for user:', data.user.email)
    }
    
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected signIn error:', err)
    return { 
      data: null, 
      error: { 
        message: 'An unexpected error occurred during sign in. Please try again.',
        originalError: err 
      } 
    }
  }
}

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
    }
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Database helpers
export const createProfile = async (profile) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert([profile])
    .select()
    .single()
  return { data, error }
}

export const getProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    // Handle 406 errors specifically - usually indicates no data found
    if (error && error.code === 'PGRST116') {
      console.warn(`Profile not found for user ${userId}:`, error)
      return { data: null, error: null } // Return null data instead of error for missing profiles
    }
    
    return { data, error }
  } catch (err) {
    console.error('Error fetching profile:', err)
    return { data: null, error: err }
  }
}

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
  return { data, error }
}

// Campaign helpers - FIXED: All campaign functions now return consistent array format
export const createCampaign = async (campaignData) => {
  const { data, error } = await supabase
    .from('campaigns')
    .insert(campaignData)
    .select()
  return { data, error }
}

export const updateCampaign = async (campaignId, campaignData) => {
  const updatedData = {
    ...campaignData,
    updated_at: new Date().toISOString()
  }
  
  const { data, error } = await supabase
    .from('campaigns')
    .update(updatedData)
    .eq('id', campaignId)
    .select()
  return { data, error }
}

export const deleteCampaign = async (campaignId) => {
  const { data, error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId)
    .select()
  return { data, error }
}

// ====================================
// MARKETPLACE - RATE CARDS
// ====================================

export const getRateCards = async (creatorId = null) => {
  let query = supabase
    .from('rate_cards')
    .select('*')
    .eq('active', true)
    .order('deliverable_type')
  
  if (creatorId) {
    query = query.eq('creator_id', creatorId)
  }
  
  const { data, error } = await query
  return { data, error }
}

export const createRateCard = async (rateCardData) => {
  const { data, error } = await supabase
    .from('rate_cards')
    .insert(rateCardData)
    .select()
  return { data, error }
}

export const updateRateCard = async (rateCardId, updates) => {
  const { data, error } = await supabase
    .from('rate_cards')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', rateCardId)
    .select()
  return { data, error }
}

export const deleteRateCard = async (rateCardId) => {
  const { data, error } = await supabase
    .from('rate_cards')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', rateCardId)
    .select()
  return { data, error }
}

// ====================================
// MARKETPLACE - OFFERS
// ====================================

export const getOffers = async (filters = {}) => {
  let query = supabase
    .from('offers')
    .select(`
      *,
      campaign:campaigns(id, title, description),
      brand:brand_id(id, full_name, company_name),
      creator:creator_id(id, full_name, profile_picture)
    `)
    .order('created_at', { ascending: false })
  
  if (filters.brandId) query = query.eq('brand_id', filters.brandId)
  if (filters.creatorId) query = query.eq('creator_id', filters.creatorId)
  if (filters.campaignId) query = query.eq('campaign_id', filters.campaignId)
  if (filters.status) query = query.eq('status', filters.status)
  
  const { data, error } = await query
  return { data, error }
}

export const getOffer = async (offerId) => {
  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      campaign:campaigns(id, title, description),
      brand:brand_id(id, full_name, company_name, email),
      creator:creator_id(id, full_name, profile_picture, email),
      payments(id, status, stripe_session_id, amount_cents, currency)
    `)
    .eq('id', offerId)
    .single()
  
  return { data, error }
}

export const createOffer = async (offerData) => {
  const { data, error } = await supabase
    .from('offers')
    .insert(offerData)
    .select()
  return { data, error }
}

export const updateOffer = async (offerId, updates) => {
  const { data, error } = await supabase
    .from('offers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', offerId)
    .select()
  return { data, error }
}

export const deleteOffer = async (offerId) => {
  const { data, error } = await supabase
    .from('offers')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', offerId)
    .select()
  return { data, error }
}

// ====================================
// MARKETPLACE - PAYMENTS
// ====================================

export const getPayments = async (filters = {}) => {
  let query = supabase
    .from('payments')
    .select(`
      *,
      offer:offers(
        id, total_cents, currency,
        brand:brand_id(id, full_name, company_name),
        creator:creator_id(id, full_name),
        campaign:campaigns(id, title)
      )
    `)
    .order('created_at', { ascending: false })
  
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.offerId) query = query.eq('offer_id', filters.offerId)
  
  const { data, error } = await query
  return { data, error }
}

export const createPayment = async (paymentData) => {
  const { data, error } = await supabase
    .from('payments')
    .insert(paymentData)
    .select()
  return { data, error }
}

export const getPaymentBySessionId = async (sessionId) => {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      offer:offers(
        id, total_cents, currency,
        brand:brand_id(id, full_name, company_name),
        creator:creator_id(id, full_name),
        campaign:campaigns(id, title)
      )
    `)
    .eq('stripe_session_id', sessionId)
    .single()
  return { data, error }
}

export const updatePayment = async (paymentId, updates) => {
  const { data, error } = await supabase
    .from('payments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', paymentId)
    .select()
  return { data, error }
}

// ====================================
// MARKETPLACE - PAYOUTS  
// ====================================

export const getPayouts = async (filters = {}) => {
  let query = supabase
    .from('payouts')
    .select(`
      *,
      payment:payments(
        id, amount_cents, currency, stripe_session_id,
        offer:offers(
          id, total_cents,
          brand:brand_id(id, full_name, company_name),
          campaign:campaigns(id, title)
        )
      ),
      creator:creator_id(id, full_name, email)
    `)
    .order('created_at', { ascending: false })
  
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.creator_id) query = query.eq('creator_id', filters.creator_id)
  if (filters.method) query = query.eq('method', filters.method)
  
  const { data, error } = await query
  return { data, error }
}

export const getPayout = async (payoutId) => {
  const { data, error } = await supabase
    .from('payouts')
    .select(`
      *,
      payment:payments(
        id, amount_cents, currency, stripe_session_id,
        offer:offers(
          id, total_cents,
          brand:brand_id(id, full_name, company_name),
          campaign:campaigns(id, title)
        )
      ),
      creator:creator_id(id, full_name, email)
    `)
    .eq('id', payoutId)
    .single()
  return { data, error }
}

export const createPayout = async (payoutData) => {
  const { data, error } = await supabase
    .from('payouts')
    .insert(payoutData)
    .select()
  return { data, error }
}

export const updatePayout = async (payoutId, updates) => {
  const { data, error } = await supabase
    .from('payouts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', payoutId)
    .select()
  return { data, error }
}

// ====================================
// MARKETPLACE - PLATFORM SETTINGS
// ====================================

export const getPlatformSettings = async () => {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .single()
  
  return { data, error }
}

export const updatePlatformSettings = async (updates) => {
  const { data, error } = await supabase
    .from('platform_settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .select()
    .single()
  
  return { data, error }
}

export const getCampaigns = async (filters = {}) => {
  let query = supabase
    .from('campaigns')
    .select(`
      *,
      profiles!campaigns_brand_id_fkey (
        full_name,
        company_name
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  
  if (filters.category) {
    query = query.eq('category', filters.category)
  }
  
  const { data, error } = await query
  return { data, error }
}

export const getBrandCampaigns = async (brandId) => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export const getCampaignById = async (campaignId) => {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      profiles!campaigns_brand_id_fkey (
        full_name,
        company_name,
        profile_picture
      )
    `)
    .eq('id', campaignId)
    .single()
  return { data, error }
}

// Application helpers
export const createApplication = async (application) => {
  const { data, error } = await supabase
    .from('applications')
    .insert([application])
    .select()
  return { data, error }
}

export const getCreatorApplications = async (creatorId) => {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      campaigns (
        title,
        deadline,
        status,
        profiles!campaigns_brand_id_fkey (
          full_name,
          company_name
        )
      )
    `)
    .eq('creator_id', creatorId)
    .order('applied_at', { ascending: false })
  return { data, error }
}

export const getCampaignApplications = async (campaignId) => {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      profiles!applications_creator_id_fkey (
        full_name,
        bio,
        profile_picture,
        social_links,
        category_tags,
        website_url,
        media_kit_url
      )
    `)
    .eq('campaign_id', campaignId)
    .order('applied_at', { ascending: false })
  return { data, error }
}

export const updateApplicationStatus = async (applicationId, status) => {
  const { data, error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', applicationId)
    .select()
  return { data, error }
}

export const getApplicationStatus = async (campaignId, creatorId) => {
  const { data, error } = await supabase
    .from('applications')
    .select('status')
    .eq('campaign_id', campaignId)
    .eq('creator_id', creatorId)
    .single()
  return { data, error }
}

// File upload helpers
export const uploadFile = async (bucket, path, file) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    })
  return { data, error }
}

export const getFileUrl = (bucket, path) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  return data.publicUrl
}

export const deleteFile = async (bucket, path) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove([path])
  return { data, error }
}

// Messaging helpers
export const createMessage = async (message) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([message])
    .select()
  return { data, error }
}

export const getConversationMessages = async (conversationId) => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey (
        full_name,
        profile_picture
      )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  return { data, error }
}

export const createConversation = async (conversation) => {
  const { data, error } = await supabase
    .from('conversations')
    .insert([conversation])
    .select()
  return { data, error }
}

export const getUserConversations = async (userId) => {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      campaigns (
        title
      ),
      creator:profiles!conversations_creator_id_fkey (
        full_name,
        profile_picture
      ),
      brand:profiles!conversations_brand_id_fkey (
        full_name,
        company_name,
        profile_picture
      )
    `)
    .or(`creator_id.eq.${userId},brand_id.eq.${userId}`)
    .order('updated_at', { ascending: false })
  return { data, error }
}

export const getOrCreateConversation = async (brandId, creatorId, campaignId) => {
  // First try to get existing conversation
  const { data: existingConversation, error: fetchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('brand_id', brandId)
    .eq('creator_id', creatorId)
    .eq('campaign_id', campaignId)
    .single()

  if (existingConversation) {
    return { data: existingConversation, error: null }
  }

  // Create new conversation if it doesn't exist
  const { data, error } = await createConversation({
    brand_id: brandId,
    creator_id: creatorId,
    campaign_id: campaignId
  })

  return { data: data?.[0], error }
}

// ====================================
// MESSAGING SYSTEM
// ====================================

export const getMessages = async (conversationId, options = {}) => {
  const { page = 1, limit = 50 } = options
  const startIndex = (page - 1) * limit
  
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:sender_id(id, full_name, avatar_url, role)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .range(startIndex, startIndex + limit - 1)
  
  return { data, error }
}

export const sendMessage = async (messageData) => {
  const { data, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select(`
      *,
      sender:sender_id(id, full_name, avatar_url, role)
    `)
    .single()
  
  return { data, error }
}

export const getConversation = async (conversationId) => {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      brand:brand_id(id, full_name, company_name, avatar_url),
      creator:creator_id(id, full_name, avatar_url),
      campaign:campaigns(id, title, description)
    `)
    .eq('id', conversationId)
    .single()
  
  return { data, error }
}

export const getConversations = async (userId, role) => {
  const roleField = role === 'brand' ? 'brand_id' : 'creator_id'
  
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      brand:brand_id(id, full_name, company_name, avatar_url),
      creator:creator_id(id, full_name, avatar_url),
      campaign:campaigns(id, title, description),
      latest_message:messages(content, created_at, sender_id)
    `)
    .eq(roleField, userId)
    .order('updated_at', { ascending: false })
  
  return { data, error }
}

// Password reset functionality
export const resetPassword = async (email) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password`
    })
    
    if (error) {
      console.error('Password reset error:', error)
      return { data: null, error }
    }
    
    console.log('Password reset email sent successfully to:', email)
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected password reset error:', err)
    return { 
      data: null, 
      error: { 
        message: 'An unexpected error occurred. Please try again.',
        originalError: err 
      } 
    }
  }
}

// Update password functionality
export const updatePassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) {
      console.error('Password update error:', error)
      return { data: null, error }
    }
    
    console.log('Password updated successfully for user:', data.user?.email)
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected password update error:', err)
    return { 
      data: null, 
      error: { 
        message: 'An unexpected error occurred while updating password. Please try again.',
        originalError: err 
      } 
    }
  }
}