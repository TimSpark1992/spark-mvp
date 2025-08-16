// app/api/admin/payments/route.js
import { NextResponse } from 'next/server'
import { getPayments, updatePayment } from '@/lib/supabase'
import { verifyAdminAccess } from '@/lib/auth-helpers'

export async function GET(request) {
  try {
    // Verify admin access
    const adminCheck = await verifyAdminAccess(request)
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    console.log('👨‍💼 Admin fetching payments:', { status, page, limit })
    
    const filters = {}
    if (status) filters.status = status
    
    const { data: payments, error } = await getPayments(filters)
    
    if (error) {
      console.error('❌ Error fetching payments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      )
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedPayments = payments?.slice(startIndex, endIndex) || []
    
    console.log('✅ Payments fetched for admin:', paginatedPayments.length)
    
    return NextResponse.json({
      payments: paginatedPayments,
      pagination: {
        current_page: page,
        per_page: limit,
        total_items: payments?.length || 0,
        total_pages: Math.ceil((payments?.length || 0) / limit)
      },
      success: true
    })
    
  } catch (error) {
    console.error('❌ Admin payments API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request) {
  try {
    // Verify admin access
    const adminCheck = await verifyAdminAccess(request)
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { payment_id, action, reason } = body
    
    console.log('👨‍💼 Admin payment action:', { payment_id, action, reason })
    
    if (!payment_id || !action) {
      return NextResponse.json(
        { error: 'payment_id and action are required' },
        { status: 400 }
      )
    }
    
    let updateData = {}
    
    switch (action) {
      case 'release':
        updateData = {
          status: 'released',
          admin_notes: reason || 'Released by admin'
        }
        break
        
      case 'refund':
        updateData = {
          status: 'refunded', 
          admin_notes: reason || 'Refunded by admin'
        }
        break
        
      case 'hold':
        updateData = {
          admin_notes: reason || 'Payment held by admin'
        }
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: release, refund, or hold' },
          { status: 400 }
        )
    }
    
    const { data: payment, error } = await updatePayment(payment_id, updateData)
    
    if (error) {
      console.error('❌ Error updating payment:', error)
      return NextResponse.json(
        { error: 'Failed to update payment' },
        { status: 500 }
      )
    }
    
    console.log('✅ Payment updated by admin:', payment.id)
    
    return NextResponse.json({
      payment,
      message: `Payment ${action} completed successfully`,
      success: true
    })
    
  } catch (error) {
    console.error('❌ Admin payment update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}