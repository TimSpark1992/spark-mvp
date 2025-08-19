import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    console.log('📋 Fetching public rate cards...')
    
    // Get all active rate cards with creator profiles (public data only)
    const { data: rateCards, error } = await supabase
      .from('rate_cards')
      .select(`
        id,
        deliverable_type,
        base_price_cents,
        currency,
        rush_pct,
        active,
        created_at,
        updated_at,
        profiles:creator_id (
          full_name,
          username
        )
      `)
      .eq('active', true)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error fetching public rate cards:', error)
      return NextResponse.json(
        { error: 'Failed to fetch rate cards' },
        { status: 500 }
      )
    }
    
    // Transform the data to match expected format
    const formattedRateCards = (rateCards || []).map(card => ({
      id: card.id,
      deliverable_type: card.deliverable_type,
      base_price_cents: card.base_price_cents,
      currency: card.currency,
      rush_pct: card.rush_pct,
      active: card.active,
      created_at: card.created_at,
      updated_at: card.updated_at,
      creator_profile: {
        full_name: card.profiles?.full_name,
        username: card.profiles?.username
      }
    }))
    
    console.log(`✅ Public rate cards fetched: ${formattedRateCards.length}`)
    
    return NextResponse.json({
      rateCards: formattedRateCards,
      success: true
    })
    
  } catch (err) {
    console.error('❌ Exception in public rate cards API:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}