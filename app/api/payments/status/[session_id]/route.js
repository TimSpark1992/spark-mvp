// app/api/payments/status/[session_id]/route.js
import { NextResponse } from 'next/server'
import { getPaymentBySessionId, updatePayment, updateOffer } from '@/lib/supabase'

// Initialize Stripe only when needed to avoid build-time errors
let stripe = null

function getStripe() {
  if (!stripe && process.env.STRIPE_API_KEY) {
    const Stripe = require('stripe')
    stripe = new Stripe(process.env.STRIPE_API_KEY, {
      apiVersion: '2024-06-20'
    })
  }
  return stripe
}

export async function GET(request, { params }) {
  try {
    const { session_id } = params
    
    console.log('🔍 Checking payment status for session:', session_id)
    
    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      )
    }
    
    // Check if Stripe is available
    const stripeInstance = getStripe()
    if (!stripeInstance) {
      return NextResponse.json(
        { error: 'Payment system is not configured. Please contact support.' },
        { status: 503 }
      )
    }
    
    // Get payment record from database
    const { data: payment, error: paymentError } = await getPaymentBySessionId(session_id)
    
    if (paymentError || !payment) {
      console.error('❌ Payment not found in database:', paymentError)
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }
    
    // Get current status from Stripe
    const session = await stripeInstance.checkout.sessions.retrieve(session_id)
    
    console.log('📊 Stripe session status:', {
      id: session.id,
      payment_status: session.payment_status,
      status: session.status
    })
    
    // Determine final status
    let finalStatus = payment.status
    let paymentStatus = session.payment_status
    let shouldUpdate = false
    
    if (session.payment_status === 'paid' && payment.status !== 'paid_escrow') {
      finalStatus = 'paid_escrow'
      shouldUpdate = true
    } else if (session.status === 'expired' && payment.status !== 'failed') {
      finalStatus = 'failed'
      shouldUpdate = true
    }
    
    // Update database if status changed and avoid duplicate processing
    if (shouldUpdate) {
      console.log(`🔄 Updating payment status: ${payment.status} → ${finalStatus}`)
      
      const { error: updateError } = await updatePayment(payment.id, {
        status: finalStatus,
        stripe_payment_intent: session.payment_intent,
        last_error: session.status === 'expired' ? 'Session expired' : null
      })
      
      if (updateError) {
        console.error('❌ Error updating payment:', updateError)
      } else {
        // Update offer status if payment successful
        if (finalStatus === 'paid_escrow') {
          const { error: offerUpdateError } = await updateOffer(payment.offer_id, {
            status: 'paid_escrow'
          })
          
          if (offerUpdateError) {
            console.error('❌ Error updating offer status:', offerUpdateError)
          } else {
            console.log('✅ Offer status updated to paid_escrow')
          }
        }
      }
    }
    
    return NextResponse.json({
      session_id: session_id,
      payment_id: payment.id,
      offer_id: payment.offer_id,
      status: session.status,
      payment_status: paymentStatus,
      amount_total: session.amount_total,
      currency: session.currency,
      database_status: finalStatus,
      metadata: session.metadata,
      success: true
    })
    
  } catch (error) {
    console.error('❌ Payment status check error:', error)
    
    if (error.code === 'resource_missing') {
      return NextResponse.json(
        { error: 'Stripe session not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}