// app/api/webhooks/stripe/route.js
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

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request) {
  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')
    
    console.log('🎣 Received Stripe webhook')
    
    // Check if Stripe is available
    const stripeInstance = getStripe()
    if (!stripeInstance) {
      console.log('⚠️ Stripe not configured, skipping webhook processing')
      return NextResponse.json({ received: true })
    }
    
    let event
    
    try {
      // Verify webhook signature if secret is provided
      if (endpointSecret) {
        event = stripeInstance.webhooks.constructEvent(body, sig, endpointSecret)
      } else {
        // For development/testing without webhook secret
        event = JSON.parse(body)
        console.log('⚠️ Webhook processed without signature verification (development mode)')
      }
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      )
    }
    
    console.log('📨 Webhook event type:', event.type)
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break
        
      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object)
        break
        
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object)
        break
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object)
        break
        
      default:
        console.log(`🤷 Unhandled event type: ${event.type}`)
    }
    
    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session) {
  console.log('✅ Processing checkout.session.completed:', session.id)
  
  try {
    // Get payment record
    const { data: payment, error: paymentError } = await getPaymentBySessionId(session.id)
    
    if (paymentError || !payment) {
      console.error('❌ Payment not found for session:', session.id)
      return
    }
    
    // Update payment status
    const { error: updateError } = await updatePayment(payment.id, {
      status: 'paid_escrow',
      stripe_payment_intent: session.payment_intent,
      webhook_events: [...(payment.webhook_events || []), {
        type: 'checkout.session.completed',
        timestamp: new Date().toISOString(),
        session_id: session.id
      }]
    })
    
    if (updateError) {
      console.error('❌ Error updating payment:', updateError)
      return
    }
    
    // Update offer status
    const { error: offerUpdateError } = await updateOffer(payment.offer_id, {
      status: 'paid_escrow'
    })
    
    if (offerUpdateError) {
      console.error('❌ Error updating offer status:', offerUpdateError)
    } else {
      console.log('✅ Payment and offer updated successfully')
    }
    
  } catch (error) {
    console.error('❌ Error handling checkout session completed:', error)
  }
}

async function handleCheckoutSessionExpired(session) {
  console.log('⏰ Processing checkout.session.expired:', session.id)
  
  try {
    // Get payment record
    const { data: payment, error: paymentError } = await getPaymentBySessionId(session.id)
    
    if (paymentError || !payment) {
      console.error('❌ Payment not found for session:', session.id)
      return
    }
    
    // Update payment status to failed
    const { error: updateError } = await updatePayment(payment.id, {
      status: 'failed',
      last_error: 'Session expired',
      webhook_events: [...(payment.webhook_events || []), {
        type: 'checkout.session.expired',
        timestamp: new Date().toISOString(),
        session_id: session.id
      }]
    })
    
    if (updateError) {
      console.error('❌ Error updating payment:', updateError)
    } else {
      console.log('✅ Payment marked as failed due to expiration')
    }
    
  } catch (error) {
    console.error('❌ Error handling checkout session expired:', error)
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('💰 Processing payment_intent.succeeded:', paymentIntent.id)
  
  try {
    // Find payment by payment intent
    // This is additional confirmation of successful payment
    console.log('✅ Payment intent succeeded confirmation received')
    
  } catch (error) {
    console.error('❌ Error handling payment intent succeeded:', error)
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  console.log('💸 Processing payment_intent.payment_failed:', paymentIntent.id)
  
  try {
    // Handle failed payment intent
    console.log('❌ Payment intent failed:', paymentIntent.last_payment_error?.message)
    
  } catch (error) {
    console.error('❌ Error handling payment intent failed:', error)
  }
}