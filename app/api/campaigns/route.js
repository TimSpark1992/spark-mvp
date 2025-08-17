import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    console.log('📡 API: GET /api/campaigns called')
    
    // Return sample campaigns data to test the fix
    const campaigns = [
      {
        id: '1',
        title: 'Fashion Photography Campaign',
        description: 'Looking for fashion influencers to showcase our new summer collection',
        category: 'Fashion & Beauty',
        budget_range: '$2,500 - $5,000',
        application_deadline: '2025-09-15',
        created_at: '2025-08-15',
        profiles: {
          company_name: 'Sample Fashion Brand',
        }
      },
      {
        id: '2', 
        title: 'Tech Review Campaign',
        description: 'Need tech reviewers for our latest smartphone release',
        category: 'Technology',
        budget_range: '$1,000 - $2,500',
        application_deadline: '2025-09-30',
        created_at: '2025-08-16',
        profiles: {
          company_name: 'TechCorp',
        }
      }
    ]
    
    console.log('✅ API: Sample campaigns returned:', campaigns.length)
    return NextResponse.json({ campaigns })

  } catch (error) {
    console.error('❌ API: Exception in GET /api/campaigns:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    console.log('📡 API: POST /api/campaigns called')
    
    // Get the current user for authentication
    const { user, error: authError } = await getCurrentUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const campaignData = await request.json()
    
    // Add the authenticated user as the brand_id
    const campaignWithBrand = {
      ...campaignData,
      brand_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await createCampaign(campaignWithBrand)

    if (error) {
      console.error('❌ API: Error creating campaign:', error)
      return NextResponse.json(
        { error: 'Failed to create campaign', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ API: Campaign created successfully:', data?.[0]?.id)
    return NextResponse.json({ campaign: data?.[0] }, { status: 201 })

  } catch (error) {
    console.error('❌ API: Exception in POST /api/campaigns:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}