// app/api/admin/payouts/[id]/release/route.js
import { NextResponse } from 'next/server'
import { getPayout, updatePayout } from '@/lib/supabase'
import { verifyAdminAccess } from '@/lib/auth-helpers'

export async function POST(request, { params }) {
  try {
    // Verify admin access
    const adminCheck = await verifyAdminAccess(request)
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { id } = params
    const body = await request.json()
    const { reference_number, admin_notes } = body
    
    console.log('👨‍💼 Admin releasing payout:', id)
    
    // Get current payout
    const { data: payout, error: fetchError } = await getPayout(id)
    
    if (fetchError || !payout) {
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 }
      )
    }
    
    // Validate payout can be released
    if (payout.status !== 'pending') {
      return NextResponse.json(
        { error: `Payout cannot be released. Current status: ${payout.status}. Only pending payouts can be released.` },
        { status: 400 }
      )
    }
    
    // Update payout status to released
    const updateData = {
      status: 'released',
      reference_number: reference_number || payout.reference_number,
      admin_notes: admin_notes || payout.admin_notes
    }
    
    const { data: updatedPayout, error: updateError } = await updatePayout(id, updateData)
    
    if (updateError) {
      console.error('❌ Error releasing payout:', updateError)
      return NextResponse.json(
        { error: 'Failed to release payout' },
        { status: 500 }
      )
    }
    
    console.log('✅ Payout released:', updatedPayout.id)
    
    // TODO: In a real implementation, you might want to:
    // 1. Send notification to creator
    // 2. Create transaction record
    // 3. Send confirmation emails
    // 4. Update payment status to 'released'
    
    return NextResponse.json({
      payout: updatedPayout,
      message: 'Payout released successfully',
      success: true
    })
    
  } catch (error) {
    console.error('❌ Payout release error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}