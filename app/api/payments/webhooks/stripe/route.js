import { NextResponse } from 'next/server';

// Lazy initialization for Stripe to prevent build-time issues
let stripe = null;

const getStripe = () => {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key not configured');
    }
    const Stripe = require('stripe');
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-08-16',
    });
  }
  return stripe;
};

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Stripe webhook secret not configured' },
        { status: 500 }
      );
    }

    let event;
    
    try {
      const stripeInstance = getStripe();
      event = stripeInstance.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    // Import Supabase functions
    const { updateOffer, getOffer, createPayment, updatePayment } = require('@/lib/supabase');

    console.log('Received Stripe webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle successful checkout session completion
async function handleCheckoutCompleted(session) {
  try {
    console.log('Processing checkout completion:', session.id);
    
    // Extract offer ID from metadata
    const offerId = session.metadata?.offer_id;
    if (!offerId) {
      console.error('No offer ID found in session metadata');
      return;
    }

    // Get the offer details
    const { data: offer, error: offerError } = await getOffer(offerId);
    if (offerError) {
      console.error('Error fetching offer:', offerError);
      return;
    }

    if (!offer) {
      console.error('Offer not found:', offerId);
      return;
    }

    // Create payment record
    const paymentData = {
      offer_id: offerId,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent,
      amount_cents: session.amount_total,
      currency: session.currency.toUpperCase(),
      status: 'paid_escrow',
      platform_fee_pct: 20, // Default platform fee
      platform_fee_cents: Math.round(session.amount_total * 0.20),
      creator_amount_cents: Math.round(session.amount_total * 0.80),
      payment_method: session.payment_method_types?.[0] || 'card',
      metadata: {
        stripe_session_id: session.id,
        payment_intent: session.payment_intent,
        customer_email: session.customer_details?.email,
      }
    };

    const { data: payment, error: paymentError } = await createPayment(paymentData);
    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return;
    }

    // Update offer status to paid_escrow
    const { error: updateError } = await updateOffer(offerId, {
      status: 'paid_escrow',
      payment_id: payment.id
    });

    if (updateError) {
      console.error('Error updating offer status:', updateError);
      return;
    }

    console.log(`✅ Checkout completed successfully for offer ${offerId}`);
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

// Handle successful payment intent
async function handlePaymentSucceeded(paymentIntent) {
  try {
    console.log('Processing payment success:', paymentIntent.id);
    
    // Update payment status if record exists
    const { error } = await updatePayment(
      { stripe_payment_intent_id: paymentIntent.id },
      { status: 'paid_escrow' }
    );

    if (error) {
      console.error('Error updating payment status:', error);
    }

    console.log(`✅ Payment succeeded: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Handle failed payment intent
async function handlePaymentFailed(paymentIntent) {
  try {
    console.log('Processing payment failure:', paymentIntent.id);
    
    // Update payment status if record exists
    const { error } = await updatePayment(
      { stripe_payment_intent_id: paymentIntent.id },
      { 
        status: 'failed',
        failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed'
      }
    );

    if (error) {
      console.error('Error updating payment status:', error);
    }

    console.log(`❌ Payment failed: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Handle canceled payment intent
async function handlePaymentCanceled(paymentIntent) {
  try {
    console.log('Processing payment cancellation:', paymentIntent.id);
    
    // Update payment status if record exists
    const { error } = await updatePayment(
      { stripe_payment_intent_id: paymentIntent.id },
      { status: 'cancelled' }
    );

    if (error) {
      console.error('Error updating payment status:', error);
    }

    console.log(`🚫 Payment canceled: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}