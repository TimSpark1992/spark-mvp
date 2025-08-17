import { NextRequest, NextResponse } from 'next/server'
import { getCampaigns, createCampaign, getBrandCampaigns } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/supabase'

export async function GET(request) {
  try {
    console.log('📡 API: GET /api/campaigns called')
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const brandId = searchParams.get('brandId')
    
    let result
    
    if (brandId) {
      // Get campaigns for specific brand
      result = await getBrandCampaigns(brandId)
    } else {
      // Get all public campaigns with optional category filter
      const filters = category ? { category } : {}
      result = await getCampaigns(filters)
    }

    const { data, error } = result

    if (error) {
      console.error('❌ API: Error fetching campaigns:', error)
      return NextResponse.json(
        { error: 'Failed to fetch campaigns', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ API: Campaigns fetched successfully:', data?.length || 0)
    return NextResponse.json({ campaigns: data || [] })

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