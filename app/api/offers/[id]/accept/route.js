// app/api/offers/[id]/accept/route.js
import { NextResponse } from 'next/server'
import { getOffer, updateOffer } from '@/lib/supabase'

export async function POST(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    
    console.log('🤝 Accepting offer:', id, body)
    
    // Get current offer to validate
    const { data: currentOffer, error: fetchError } = await getOffer(id)
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Offer not found' },
          { status: 404 }
        )
      }
      
      console.error('❌ Error fetching offer for acceptance:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch offer' },
        { status: 500 }
      )
    }
    
    // Validate offer can be accepted
    if (currentOffer.status !== 'sent') {
      return NextResponse.json(
        { error: `Offer cannot be accepted. Current status: ${currentOffer.status}. Only 'sent' offers can be accepted.` },
        { status: 400 }
      )
    }
    
    // Check if offer has expired
    if (currentOffer.expires_at && new Date(currentOffer.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Offer has expired and cannot be accepted' },
        { status: 400 }
      )
    }
    
    // Update offer status to accepted
    const updateData = {
      status: 'accepted',
      notes: body.acceptance_notes || currentOffer.notes
    }
    
    const { data: offer, error } = await updateOffer(id, updateData)
    
    if (error) {
      console.error('❌ Error accepting offer:', error)
      return NextResponse.json(
        { error: 'Failed to accept offer' },
        { status: 500 }
      )
    }
    
    console.log('✅ Offer accepted:', offer.id)
    
    // TODO: In a real implementation, you might want to:
    // 1. Send notification to brand
    // 2. Create initial payment record
    // 3. Update campaign status
    // 4. Send confirmation emails
    
    return NextResponse.json({ 
      offer,
      message: 'Offer accepted successfully',
      success: true 
    })
    
  } catch (error) {
    console.error('❌ Offer acceptance API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    
    console.log('❌ Rejecting offer:', id, body)
    
    // Get current offer to validate
    const { data: currentOffer, error: fetchError } = await getOffer(id)
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Offer not found' },
          { status: 404 }
        )
      }
      
      console.error('❌ Error fetching offer for rejection:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch offer' },
        { status: 500 }
      )
    }
    
    // Validate offer can be rejected
    if (!['sent', 'drafted'].includes(currentOffer.status)) {
      return NextResponse.json(
        { error: `Offer cannot be rejected. Current status: ${currentOffer.status}. Only 'sent' or 'drafted' offers can be rejected.` },
        { status: 400 }
      )
    }
    
    // Update offer status to cancelled with rejection reason
    const updateData = {
      status: 'cancelled',
      notes: body.rejection_reason ? 
        `${currentOffer.notes || ''}\n\nREJECTED: ${body.rejection_reason}`.trim() : 
        currentOffer.notes
    }
    
    const { data: offer, error } = await updateOffer(id, updateData)
    
    if (error) {
      console.error('❌ Error rejecting offer:', error)
      return NextResponse.json(
        { error: 'Failed to reject offer' },
        { status: 500 }
      )
    }
    
    console.log('✅ Offer rejected:', offer.id)
    
    // TODO: In a real implementation, you might want to:
    // 1. Send notification to brand
    // 2. Update campaign status
    // 3. Send rejection notification emails
    
    return NextResponse.json({ 
      offer,
      message: 'Offer rejected successfully',
      success: true 
    })
    
  } catch (error) {
    console.error('❌ Offer rejection API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}