// app/api/rate-cards/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getRateCards, createRateCard } from '@/lib/supabase'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const creatorId = searchParams.get('creator_id')
    
    console.log('📋 Fetching rate cards, creator_id:', creatorId)
    
    const { data: rateCards, error } = await getRateCards(creatorId)
    
    if (error) {
      console.error('❌ Error fetching rate cards:', error)
      return NextResponse.json(
        { error: 'Failed to fetch rate cards' },
        { status: 500 }
      )
    }
    
    console.log('✅ Rate cards fetched:', rateCards?.length || 0)
    
    return NextResponse.json({ 
      rateCards,
      success: true 
    })
    
  } catch (error) {
    console.error('❌ Rate cards API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    
    console.log('📋 Creating rate card:', body)
    
    // Validate required fields
    const requiredFields = ['creator_id', 'deliverable_type', 'base_price_cents', 'currency']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }
    
    // Validate price
    if (body.base_price_cents <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than zero' },
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
    
    // Validate deliverable type
    const validTypes = ['IG_Reel', 'IG_Story', 'TikTok_Post', 'YouTube_Video', 'Bundle']
    if (!validTypes.includes(body.deliverable_type)) {
      return NextResponse.json(
        { error: 'Invalid deliverable type' },
        { status: 400 }
      )
    }
    
    // Use service role client to bypass RLS
    const { data: rateCard, error } = await supabase
      .from('rate_cards')
      .insert({
        creator_id: body.creator_id,
        deliverable_type: body.deliverable_type,
        base_price_cents: body.base_price_cents,
        currency: body.currency,
        rush_pct: body.rush_pct || 0,
        active: true
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error creating rate card:', error)
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Rate card already exists for this deliverable type and currency' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create rate card' },
        { status: 500 }
      )
    }
    
    console.log('✅ Rate card created:', rateCard.id)
    
    return NextResponse.json({ 
      rateCard,
      success: true 
    }, { status: 201 })
    
  } catch (error) {
    console.error('❌ Rate card creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}