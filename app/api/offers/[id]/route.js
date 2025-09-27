// app/api/offers/[id]/route.js
import { NextResponse } from 'next/server'
import { getOffer, updateOffer, deleteOffer } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// Create Supabase admin client for delete operations
function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase environment variables not configured')
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET(request, { params }) {
  try {
    const { id } = params
    
    console.log('📋 Fetching offer:', id)
    
    const { data: offer, error } = await getOffer(id)
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Offer not found' },
          { status: 404 }
        )
      }
      
      console.error('❌ Error fetching offer:', error)
      return NextResponse.json(
        { error: 'Failed to fetch offer' },
        { status: 500 }
      )
    }
    
    console.log('✅ Offer fetched:', offer.id)
    
    return NextResponse.json({ 
      offer,
      success: true 
    })
    
  } catch (error) {
    console.error('❌ Offer fetch API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    
    console.log('📋 Updating offer:', id, body)
    
    // Validate status transitions if status is being updated
    if (body.status) {
      const validStatuses = ['drafted', 'sent', 'accepted', 'paid_escrow', 'in_progress', 'submitted', 'approved', 'released', 'completed', 'cancelled', 'refunded']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }
    }
    
    // Validate currency if provided
    if (body.currency && !['USD', 'MYR', 'SGD'].includes(body.currency)) {
      return NextResponse.json(
        { error: 'Invalid currency' },
        { status: 400 }
      )
    }
    
    // Validate pricing if provided
    if (body.subtotal_cents && body.subtotal_cents < 0) {
      return NextResponse.json(
        { error: 'Subtotal cannot be negative' },
        { status: 400 }
      )
    }
    
    if (body.total_cents && body.total_cents <= 0) {
      return NextResponse.json(
        { error: 'Total must be greater than zero' },
        { status: 400 }
      )
    }
    
    const { data: offer, error } = await updateOffer(id, body)
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Offer not found' },
          { status: 404 }
        )
      }
      
      console.error('❌ Error updating offer:', error)
      return NextResponse.json(
        { error: 'Failed to update offer' },
        { status: 500 }
      )
    }
    
    console.log('✅ Offer updated:', offer.id)
    
    return NextResponse.json({ 
      offer,
      success: true 
    })
    
  } catch (error) {
    console.error('❌ Offer update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    
    console.log('📋 Deleting offer:', id)
    
    const supabase = getSupabaseAdminClient()
    if (!supabase) {
      return NextResponse.json({
        error: 'Database service unavailable - Supabase not configured'
      }, { status: 503 })
    }
    
    // Use admin client to ensure delete permissions
    const { data: offer, error } = await supabase
      .from('offers')
      .update({ 
        status: 'cancelled', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Offer not found' },
          { status: 404 }
        )
      }
      
      console.error('❌ Error deleting offer:', error)
      return NextResponse.json(
        { error: 'Failed to delete offer' },
        { status: 500 }
      )
    }
    
    console.log('✅ Offer deleted - status set to cancelled:', offer.id)
    
    return NextResponse.json({ 
      offer,
      success: true 
    })
    
  } catch (error) {
    console.error('❌ Offer deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}