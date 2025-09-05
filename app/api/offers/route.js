// app/api/offers/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { clearCampaignCache } from '@/lib/campaign-cache'

// Create Supabase client with environment variable checks  
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase environment variables not configured for offers')
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET(request) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        error: 'Database service unavailable - Supabase not configured'
      }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaign_id')
    const creatorId = searchParams.get('creator_id')
    const brandId = searchParams.get('brand_id')

    let query = supabase
      .from('offers')
      .select(`
        *,
        campaign:campaigns(id, title, brand_id),
        creator_profile:profiles!creator_id(id, full_name, username),
        brand_profile:profiles!brand_id(id, full_name, company_name)
      `)

    if (campaignId) query = query.eq('campaign_id', campaignId)
    if (creatorId) query = query.eq('creator_id', creatorId)  
    if (brandId) query = query.eq('brand_id', brandId)

    const { data: offers, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching offers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ offers })

  } catch (error) {
    console.error('❌ Offers API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        error: 'Database service unavailable - Supabase not configured'
      }, { status: 503 })
    }

    const body = await request.json()
    const {
      campaign_id,
      creator_id,
      brand_id,
      deliverable_type,
      quantity,
      base_price_cents,
      rush_fee_pct,
      platform_fee_pct,
      subtotal_cents,
      total_cents,
      currency,
      deadline,
      description,
      status
    } = body

    // Validation
    if (!campaign_id || !creator_id || !brand_id) {
      return NextResponse.json({
        error: 'campaign_id, creator_id, and brand_id are required'
      }, { status: 400 })
    }

    // Create the items array for the JSONB column
    const items = [{
      deliverable_type: deliverable_type || 'IG_Reel',
      quantity: quantity || 1,
      base_price_cents: base_price_cents || 0,
      rush_fee_pct: rush_fee_pct || 0
    }]

    const { data: offer, error } = await supabase
      .from('offers')
      .insert({
        campaign_id,
        creator_id,
        brand_id,
        items: JSON.stringify(items),
        subtotal_cents: subtotal_cents || 0,
        platform_fee_pct: platform_fee_pct || 20,
        platform_fee_cents: Math.round((subtotal_cents || 0) * ((platform_fee_pct || 20) / 100)),
        total_cents: total_cents || 0,
        currency: currency || 'USD',
        expires_at: deadline,
        notes: description,
        status: status || 'drafted'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating offer:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Clear campaign cache
    clearCampaignCache(brand_id)

    return NextResponse.json({
      offer,
      message: 'Offer created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Offer creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}