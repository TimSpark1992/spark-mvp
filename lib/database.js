import { supabase } from './supabase'
import { validateInputEnhanced, enhancedCampaignSchema, enhancedApplicationSchema, enhancedProfileUpdateSchema } from './validation-enhanced'
import { sanitizeFieldValue } from './xss-protection'
import { canAccessResource } from './auth'

// Enhanced database functions with validation and security

// Profile operations
export const dbCreateProfile = async (profileData) => {
  try {
    const sanitizedData = sanitizeObject(profileData)
    
    const { data, error } = await supabase
      .from('profiles')
      .insert([sanitizedData])
      .select('id, email, full_name, role, created_at')
    
    return { data, error }
  } catch (error) {
    console.error('Database profile creation error:', error)
    return { data: null, error: { message: 'Failed to create profile' } }
  }
}

export const dbGetProfile = async (userId, requestingUserId, requestingUserRole) => {
  try {
    if (!canAccessResource(requestingUserRole, userId, requestingUserId)) {
      return { data: null, error: { message: 'Unauthorized access' } }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    return { data, error }
  } catch (error) {
    console.error('Database profile fetch error:', error)
    return { data: null, error: { message: 'Failed to fetch profile' } }
  }
}

export const dbUpdateProfile = async (userId, updates, requestingUserId, requestingUserRole) => {
  try {
    if (!canAccessResource(requestingUserRole, userId, requestingUserId)) {
      return { data: null, error: { message: 'Unauthorized access' } }
    }

    const validation = validateInputEnhanced(enhancedProfileUpdateSchema, updates)
    if (!validation.success) {
      return { data: null, error: { message: validation.error } }
    }

    // All data is already sanitized by the enhanced validation schema
    const sanitizedUpdates = validation.data
    
    const { data, error } = await supabase
      .from('profiles')
      .update(sanitizedUpdates)
      .eq('id', userId)
      .select('id, email, full_name, role, bio, website_url, company_name')
    
    return { data, error }
  } catch (error) {
    console.error('Database profile update error:', error)
    return { data: null, error: { message: 'Failed to update profile' } }
  }
}

// Campaign operations
export const dbCreateCampaign = async (campaignData, brandId, requestingUserRole) => {
  try {
    if (requestingUserRole !== 'brand' && requestingUserRole !== 'admin') {
      return { data: null, error: { message: 'Only brands can create campaigns' } }
    }

    const validation = validateInputEnhanced(enhancedCampaignSchema, campaignData)
    if (!validation.success) {
      return { data: null, error: { message: validation.error } }
    }

    // All data is already sanitized by the enhanced validation schema
    const sanitizedData = {
      ...validation.data,
      brand_id: brandId,
      status: 'active'
    }
    
    const { data, error } = await supabase
      .from('campaigns')
      .insert([sanitizedData])
      .select(`
        id, title, description, category, budget_range, 
        creator_requirements, deadline, status, created_at
      `)
    
    return { data, error }
  } catch (error) {
    console.error('Database campaign creation error:', error)
    return { data: null, error: { message: 'Failed to create campaign' } }
  }
}

export const dbGetCampaigns = async (filters = {}, limit = 50) => {
  try {
    let query = supabase
      .from('campaigns')
      .select(`
        id, title, description, category, budget_range,
        creator_requirements, deadline, status, created_at,
        profiles!campaigns_brand_id_fkey (
          full_name,
          company_name
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 100)) // Max 100 for performance
    
    if (filters.category) {
      query = query.eq('category', filters.category)
    }
    
    if (filters.budget_range) {
      query = query.eq('budget_range', filters.budget_range)
    }
    
    const { data, error } = await query
    return { data, error }
  } catch (error) {
    console.error('Database campaigns fetch error:', error)
    return { data: null, error: { message: 'Failed to fetch campaigns' } }
  }
}

export const dbGetBrandCampaigns = async (brandId, requestingUserId, requestingUserRole) => {
  try {
    if (!canAccessResource(requestingUserRole, brandId, requestingUserId)) {
      return { data: null, error: { message: 'Unauthorized access' } }
    }

    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(100)
    
    return { data, error }
  } catch (error) {
    console.error('Database brand campaigns fetch error:', error)
    return { data: null, error: { message: 'Failed to fetch brand campaigns' } }
  }
}

// Application operations
export const dbCreateApplication = async (applicationData, creatorId, requestingUserRole) => {
  try {
    if (requestingUserRole !== 'creator' && requestingUserRole !== 'admin') {
      return { data: null, error: { message: 'Only creators can create applications' } }
    }

    const validation = validateInput(applicationSchema, applicationData)
    if (!validation.success) {
      return { data: null, error: { message: validation.error } }
    }

    const sanitizedData = sanitizeObject({
      ...validation.data,
      creator_id: creatorId,
      status: 'pending'
    })
    
    const { data, error } = await supabase
      .from('applications')
      .insert([sanitizedData])
      .select('id, campaign_id, note, status, applied_at')
    
    return { data, error }
  } catch (error) {
    console.error('Database application creation error:', error)
    return { data: null, error: { message: 'Failed to create application' } }
  }
}

export const dbGetCreatorApplications = async (creatorId, requestingUserId, requestingUserRole) => {
  try {
    if (!canAccessResource(requestingUserRole, creatorId, requestingUserId)) {
      return { data: null, error: { message: 'Unauthorized access' } }
    }

    const { data, error } = await supabase
      .from('applications')
      .select(`
        id, note, status, applied_at,
        campaigns (
          id, title, deadline,
          profiles!campaigns_brand_id_fkey (
            full_name,
            company_name
          )
        )
      `)
      .eq('creator_id', creatorId)
      .order('applied_at', { ascending: false })
      .limit(100)
    
    return { data, error }
  } catch (error) {
    console.error('Database creator applications fetch error:', error)
    return { data: null, error: { message: 'Failed to fetch creator applications' } }
  }
}

export const dbUpdateApplicationStatus = async (applicationId, status, brandId, requestingUserRole) => {
  try {
    if (requestingUserRole !== 'brand' && requestingUserRole !== 'admin') {
      return { data: null, error: { message: 'Only brands can update application status' } }
    }

    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return { data: null, error: { message: 'Invalid status' } }
    }

    // Verify the application belongs to a campaign owned by the requesting brand
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select(`
        id,
        campaigns!inner (
          brand_id
        )
      `)
      .eq('id', applicationId)
      .single()

    if (fetchError || !application) {
      return { data: null, error: { message: 'Application not found' } }
    }

    if (requestingUserRole !== 'admin' && application.campaigns.brand_id !== brandId) {
      return { data: null, error: { message: 'Unauthorized access' } }
    }

    const { data, error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', applicationId)
      .select('id, status')
    
    return { data, error }
  } catch (error) {
    console.error('Database application status update error:', error)
    return { data: null, error: { message: 'Failed to update application status' } }
  }
}

// Admin operations
export const dbGetAllUsers = async (requestingUserRole, limit = 100) => {
  try {
    if (requestingUserRole !== 'admin') {
      return { data: null, error: { message: 'Admin access required' } }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, company_name, created_at')
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 500))
    
    return { data, error }
  } catch (error) {
    console.error('Database users fetch error:', error)
    return { data: null, error: { message: 'Failed to fetch users' } }
  }
}

export const dbGetAllCampaigns = async (requestingUserRole, limit = 100) => {
  try {
    if (requestingUserRole !== 'admin') {
      return { data: null, error: { message: 'Admin access required' } }
    }

    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        id, title, description, status, created_at,
        profiles!campaigns_brand_id_fkey (
          full_name,
          company_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 500))
    
    return { data, error }
  } catch (error) {
    console.error('Database campaigns fetch error:', error)
    return { data: null, error: { message: 'Failed to fetch campaigns' } }
  }
}