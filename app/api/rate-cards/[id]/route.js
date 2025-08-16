// app/api/rate-cards/[id]/route.js
import { NextResponse } from 'next/server'
import { updateRateCard, deleteRateCard } from '@/lib/supabase'

export async function PATCH(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    
    console.log('📋 Updating rate card:', id, body)
    
    // Validate price if provided
    if (body.base_price_cents && body.base_price_cents <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than zero' },
        { status: 400 }
      )
    }
    
    // Validate currency if provided
    if (body.currency && !['USD', 'MYR', 'SGD'].includes(body.currency)) {
      return NextResponse.json(
        { error: 'Invalid currency' },
        { status: 400 }
      )
    }
    
    const { data: rateCard, error } = await updateRateCard(id, body)
    
    if (error) {
      console.error('❌ Error updating rate card:', error)
      return NextResponse.json(
        { error: 'Failed to update rate card' },
        { status: 500 }
      )
    }
    
    console.log('✅ Rate card updated:', rateCard.id)
    
    return NextResponse.json({ 
      rateCard,
      success: true 
    })
    
  } catch (error) {
    console.error('❌ Rate card update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    
    console.log('📋 Deleting rate card:', id)
    
    const { data: rateCard, error } = await deleteRateCard(id)
    
    if (error) {
      console.error('❌ Error deleting rate card:', error)
      return NextResponse.json(
        { error: 'Failed to delete rate card' },
        { status: 500 }
      )
    }
    
    console.log('✅ Rate card deactivated:', rateCard.id)
    
    return NextResponse.json({ 
      rateCard,
      success: true 
    })
    
  } catch (error) {
    console.error('❌ Rate card deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}