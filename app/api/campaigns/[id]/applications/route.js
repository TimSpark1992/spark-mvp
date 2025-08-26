import { NextResponse } from 'next/server'
import { getCampaignApplications } from '../../../../../lib/supabase'

export async function GET(request, { params }) {
  try {
    const { id } = params
    console.log(`📡 API: GET /api/campaigns/${id}/applications called`)
    
    if (!id) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }
    
    // Get applications for the specific campaign
    const { data: applications, error } = await getCampaignApplications(id)
    
    if (error) {
      console.error(`❌ API: Error fetching applications for campaign ${id}:`, error)
      return NextResponse.json(
        { error: 'Failed to fetch applications', details: error.message },
        { status: 500 }
      )
    }
    
    console.log(`✅ API: Found ${applications?.length || 0} applications for campaign ${id}`)
    return NextResponse.json({ 
      applications: applications || [],
      count: applications?.length || 0
    })

  } catch (error) {
    console.error(`❌ API: Exception in GET /api/campaigns/${params?.id}/applications:`, error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}