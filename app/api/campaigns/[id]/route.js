import { NextResponse } from 'next/server'
import { getCampaignById } from '../../../../lib/supabase'

export async function GET(request, { params }) {
  try {
    const { id } = params
    console.log(`📡 API: GET /api/campaigns/${id} called`)
    
    if (!id) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }
    
    // Get specific campaign by ID
    const { data: campaign, error } = await getCampaignById(id)
    
    if (error) {
      console.error(`❌ API: Error fetching campaign ${id}:`, error)
      return NextResponse.json(
        { error: 'Failed to fetch campaign', details: error.message },
        { status: 500 }
      )
    }
    
    if (!campaign) {
      console.log(`⚠️ API: Campaign ${id} not found`)
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }
    
    console.log(`✅ API: Campaign ${id} returned successfully:`, campaign.title)
    return NextResponse.json({ campaign })

  } catch (error) {
    console.error(`❌ API: Exception in GET /api/campaigns/${params?.id}:`, error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}