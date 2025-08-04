import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const signUp = async (email, password, userData) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  })
  return { data, error }
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
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
  return { data, error }
}

export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
  return { data, error }
}

// Campaign helpers
export const createCampaign = async (campaign) => {
  const { data, error } = await supabase
    .from('campaigns')
    .insert([campaign])
    .select()
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
        category_tags
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

// File upload helpers
export const uploadFile = async (bucket, path, file) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })
  return { data, error }
}

export const getFileUrl = (bucket, path) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  return data.publicUrl
}