// app/api/rate-cards/route.js  
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { clearRateCardCache } from '@/lib/rate-card-cache'

// Create Supabase client with environment variable checks
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase environment variables not configured for rate-cards')
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
    const creatorId = searchParams.get('creator_id')

    let query = supabase
      .from('rate_cards')
      .select('*')
      .eq('active', true)

    if (creatorId) {
      query = query.eq('creator_id', creatorId)
    }

    const { data: rateCards, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching rate cards:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ rateCards })

  } catch (error) {
    console.error('❌ Rate cards API error:', error)
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
    const { creator_id, deliverable_type, base_price_cents, currency, description } = body

    if (!creator_id || !deliverable_type || !base_price_cents) {
      return NextResponse.json({
        error: 'creator_id, deliverable_type, and base_price_cents are required'
      }, { status: 400 })
    }

    const { data: rateCard, error } = await supabase
      .from('rate_cards')
      .insert({
        creator_id,
        deliverable_type,
        base_price_cents,
        currency: currency || 'USD',
        description,
        active: true
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating rate card:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Clear cache for this creator
    clearRateCardCache(creator_id)

    return NextResponse.json({ 
      rateCard,
      message: 'Rate card created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Rate cards creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}