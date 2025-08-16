// app/api/offers/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getOffers, createOffer } from '@/lib/supabase'
import { validateOfferPricing } from '@/lib/marketplace/pricing'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brand_id')
    const creatorId = searchParams.get('creator_id')
    const campaignId = searchParams.get('campaign_id')
    const status = searchParams.get('status')
    
    console.log('📋 Fetching offers with filters:', { brandId, creatorId, campaignId, status })
    
    const filters = {}
    if (brandId) filters.brand_id = brandId
    if (creatorId) filters.creator_id = creatorId
    if (campaignId) filters.campaign_id = campaignId
    if (status) filters.status = status
    
    const { data: offers, error } = await getOffers(filters)
    
    if (error) {
      console.error('❌ Error fetching offers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch offers' },
        { status: 500 }
      )
    }
    
    console.log('✅ Offers fetched:', offers?.length || 0)
    
    return NextResponse.json({ 
      offers,
      success: true 
    })
    
  } catch (error) {
    console.error('❌ Offers API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    
    console.log('📋 Creating offer:', body)
    
    // Validate required fields
    const requiredFields = ['campaign_id', 'brand_id', 'creator_id', 'items', 'subtotal_cents', 'total_cents', 'currency']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }
    
    // Validate offer pricing
    const validation = validateOfferPricing(body)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: `Validation failed: ${validation.errors.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Validate currency
    const validCurrencies = ['USD', 'MYR', 'SGD']
    if (!validCurrencies.includes(body.currency)) {
      return NextResponse.json(
        { error: 'Invalid currency' },
        { status: 400 }
      )
    }
    
    // Validate status
    const validStatuses = ['drafted', 'sent', 'accepted', 'paid_escrow', 'in_progress', 'submitted', 'approved', 'released', 'completed', 'cancelled', 'refunded']
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }
    
    // Calculate platform fee if not provided
    const platformFeePct = body.platform_fee_pct || 20
    const platformFeeCents = Math.round(body.subtotal_cents * (platformFeePct / 100))
    
    const offerData = {
      campaign_id: body.campaign_id,
      brand_id: body.brand_id,
      creator_id: body.creator_id,
      items: body.items,
      subtotal_cents: body.subtotal_cents,
      platform_fee_pct: platformFeePct,
      platform_fee_cents: platformFeeCents,
      total_cents: body.total_cents,
      currency: body.currency,
      status: body.status || 'drafted',
      expires_at: body.expires_at,
      notes: body.notes
    }
    
    const { data: offer, error } = await createOffer(offerData)
    
    if (error) {
      console.error('❌ Error creating offer:', error)
      
      // Handle constraint violations
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Invalid reference: campaign, brand, or creator not found' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create offer' },
        { status: 500 }
      )
    }
    
    console.log('✅ Offer created:', offer.id)
    
    return NextResponse.json({ 
      offer,
      success: true 
    }, { status: 201 })
    
  } catch (error) {
    console.error('❌ Offer creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}