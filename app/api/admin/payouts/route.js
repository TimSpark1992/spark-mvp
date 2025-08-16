// app/api/admin/payouts/route.js
import { NextResponse } from 'next/server'
import { getPayouts, createPayout, updatePayout } from '@/lib/supabase'
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
    const creatorId = searchParams.get('creator_id')
    const method = searchParams.get('method')
    
    console.log('👨‍💼 Admin fetching payouts:', { status, creatorId, method })
    
    const filters = {}
    if (status) filters.status = status
    if (creatorId) filters.creator_id = creatorId
    if (method) filters.method = method
    
    const { data: payouts, error } = await getPayouts(filters)
    
    if (error) {
      console.error('❌ Error fetching payouts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payouts' },
        { status: 500 }
      )
    }
    
    console.log('✅ Payouts fetched for admin:', payouts?.length || 0)
    
    return NextResponse.json({
      payouts,
      success: true
    })
    
  } catch (error) {
    console.error('❌ Admin payouts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
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
    const { payment_id, creator_id, amount_cents, currency, method, reference_number, admin_notes } = body
    
    console.log('👨‍💼 Admin creating manual payout:', body)
    
    // Validate required fields
    const requiredFields = ['payment_id', 'creator_id', 'amount_cents', 'currency']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }
    
    // Validate amount
    if (amount_cents <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than zero' },
        { status: 400 }
      )
    }
    
    // Validate currency
    if (!['USD', 'MYR', 'SGD'].includes(currency)) {
      return NextResponse.json(
        { error: 'Invalid currency' },
        { status: 400 }
      )
    }
    
    // Validate method
    const validMethods = ['stripe', 'manual']
    if (method && !validMethods.includes(method)) {
      return NextResponse.json(
        { error: 'Invalid payout method' },
        { status: 400 }
      )
    }
    
    const payoutData = {
      payment_id,
      creator_id,
      amount_cents,
      currency,
      method: method || 'manual',
      status: 'pending',
      reference_number,
      admin_notes
    }
    
    const { data: payout, error } = await createPayout(payoutData)
    
    if (error) {
      console.error('❌ Error creating payout:', error)
      
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Invalid payment_id or creator_id' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create payout' },
        { status: 500 }
      )
    }
    
    console.log('✅ Manual payout created:', payout.id)
    
    return NextResponse.json({
      payout,
      message: 'Manual payout created successfully',
      success: true
    }, { status: 201 })
    
  } catch (error) {
    console.error('❌ Admin payout creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}