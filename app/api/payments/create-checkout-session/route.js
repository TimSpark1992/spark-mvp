// app/api/payments/create-checkout-session/route.js
import { NextResponse } from 'next/server'
import { createPayment } from '@/lib/supabase'
import { getOffer } from '@/lib/supabase'

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

export async function POST(request) {
  try {
    const body = await request.json()
    const { offer_id, origin_url } = body
    
    console.log('💳 Creating checkout session for offer:', offer_id)
    
    // Check if Stripe is available
    const stripeInstance = getStripe()
    if (!stripeInstance) {
      return NextResponse.json(
        { error: 'Payment system is not configured. Please contact support.' },
        { status: 503 }
      )
    }
    
    // Validate required fields
    if (!offer_id || !origin_url) {
      return NextResponse.json(
        { error: 'offer_id and origin_url are required' },
        { status: 400 }
      )
    }
    
    // Get offer details to determine payment amount
    const { data: offer, error: offerError } = await getOffer(offer_id)
    
    if (offerError || !offer) {
      console.error('❌ Error fetching offer:', offerError)
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      )
    }
    
    // Validate offer status
    if (offer.status !== 'accepted') {
      return NextResponse.json(
        { error: `Offer cannot be paid. Current status: ${offer.status}. Only accepted offers can be paid.` },
        { status: 400 }
      )
    }
    
    // Security: Get payment amount from server-side offer data only
    // NEVER accept payment amounts from frontend
    const paymentAmount = offer.total_cents
    const currency = offer.currency.toLowerCase()
    
    // Build dynamic success/cancel URLs from frontend origin
    const successUrl = `${origin_url}/marketplace/${offer_id}/payment-success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${origin_url}/marketplace/${offer_id}/payment-cancelled`
    
    console.log('💰 Payment details:', {
      amount: paymentAmount,
      currency,
      successUrl,
      cancelUrl
    })
    
    // Create Stripe checkout session
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: `Marketplace Offer #${offer_id.slice(0, 8)}`,
              description: `Payment for offer from ${offer.creator?.full_name || 'Creator'} for campaign: ${offer.campaign?.title || 'N/A'}`,
              metadata: {
                offer_id: offer_id,
                brand_id: offer.brand_id,
                creator_id: offer.creator_id,
                campaign_id: offer.campaign_id
              }
            },
            unit_amount: paymentAmount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        offer_id: offer_id,
        brand_id: offer.brand_id,
        creator_id: offer.creator_id,
        campaign_id: offer.campaign_id,
        platform_fee_cents: offer.platform_fee_cents.toString(),
        subtotal_cents: offer.subtotal_cents.toString()
      },
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    })
    
    // Create payment record in database BEFORE redirecting user
    const paymentData = {
      offer_id: offer_id,
      stripe_session_id: session.id,
      amount_cents: paymentAmount,
      currency: currency.toUpperCase(),
      status: 'pending'
    }
    
    const { data: payment, error: paymentError } = await createPayment(paymentData)
    
    if (paymentError) {
      console.error('❌ Error creating payment record:', paymentError)
      
      // Cancel the Stripe session if database creation failed
      try {
        await stripeInstance.checkout.sessions.expire(session.id)
      } catch (expireError) {
        console.error('❌ Error expiring Stripe session:', expireError)
      }
      
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      )
    }
    
    console.log('✅ Checkout session created:', session.id)
    console.log('✅ Payment record created:', payment.id)
    
    // Update offer status to paid_escrow (payment initiated)
    // This will be updated to 'paid_escrow' by webhook once payment confirms
    
    return NextResponse.json({
      session_id: session.id,
      checkout_url: session.url,
      payment_id: payment.id,
      success: true
    })
    
  } catch (error) {
    console.error('❌ Checkout session creation error:', error)
    
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: 'Your card was declined.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}