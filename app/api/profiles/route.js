import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    
    console.log(`📡 API: GET /api/profiles called with role filter: ${role}`)
    
    let query = supabase
      .from('profiles')
      .select('*')
    
    // Apply role filter if provided
    if (role) {
      query = query.eq('role', role)
    }
    
    const { data: profiles, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ API: Error fetching profiles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profiles', details: error.message },
        { status: 500 }
      )
    }
    
    const filteredProfiles = profiles || []
    console.log(`✅ API: Found ${filteredProfiles.length} profiles${role ? ` with role '${role}'` : ''}`)
    
    return NextResponse.json({ 
      profiles: filteredProfiles,
      count: filteredProfiles.length,
      role_filter: role
    })

  } catch (error) {
    console.error('❌ API: Exception in GET /api/profiles:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}