// Stripe checkout integration for marketplace payments
// Handles checkout session creation, payment processing, and status tracking

import { formatPrice as utilFormatPrice } from '@/lib/formatters'

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

/**
 * Create a Stripe checkout session for an offer
 * @param {Object} sessionData - Checkout session data
 * @param {Object} sessionData.offer - Offer object with pricing details
 * @param {string} sessionData.originUrl - Origin URL for success/cancel redirects
 * @param {string} sessionData.customerEmail - Customer email (optional)
 */
export async function createCheckoutSession(sessionData) {
  try {
    const { offer, originUrl, customerEmail } = sessionData;
    const stripeInstance = getStripe();

    // FIXED: Better validation logic for offer data
    if (!offer || !offer.id || offer.total_cents === null || offer.total_cents === undefined || 
        isNaN(offer.total_cents) || offer.total_cents <= 0) {
      throw new Error('Invalid offer data provided');
    }

    // Format line items for Stripe
    const lineItems = [
      {
        price_data: {
          currency: (offer.currency || 'USD').toLowerCase(),
          product_data: {
            name: offer.title || `${offer.deliverable_type} (${offer.quantity}x)`,
            description: offer.description || `Marketplace offer for ${offer.deliverable_type}`,
            metadata: {
              offer_id: offer.id,
              deliverable_type: offer.deliverable_type,
              quantity: offer.quantity?.toString() || '1'
            }
          },
          unit_amount: Math.round(offer.total_cents), // Ensure integer
        },
        quantity: 1,
      },
    ];

    // Create checkout session
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      
      // Success and cancel URLs
      success_url: `${originUrl}/marketplace/payment?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${originUrl}/marketplace/payment?session_id={CHECKOUT_SESSION_ID}&status=cancelled`,
      
      // Customer information
      customer_email: customerEmail,
      
      // Metadata for tracking
      metadata: {
        offer_id: offer.id,
        creator_id: offer.creator_id,
        brand_id: offer.brand_id,
        campaign_id: offer.campaign_id || '',
        deliverable_type: offer.deliverable_type,
        quantity: offer.quantity?.toString() || '1'
      },
      
      // Payment settings
      payment_intent_data: {
        description: `Payment for ${offer.deliverable_type} offer`,
        metadata: {
          offer_id: offer.id,
          creator_id: offer.creator_id,
          brand_id: offer.brand_id
        }
      },
      
      // Additional settings
      billing_address_collection: 'required',
      shipping_address_collection: null, // Digital services don't need shipping
      
      // Expire session after 24 hours
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
      
      // Allow promotion codes
      allow_promotion_codes: true
    });

    return {
      success: true,
      session: {
        id: session.id,
        url: session.url,
        payment_intent: session.payment_intent,
        amount_total: session.amount_total,
        currency: session.currency?.toUpperCase(),
        expires_at: session.expires_at,
        status: session.status
      }
    };
  } catch (error) {
    console.error('Checkout session creation failed:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

/**
 * Retrieve checkout session status
 * @param {string} sessionId - Stripe checkout session ID
 */
export async function getCheckoutSessionStatus(sessionId) {
  try {
    const stripeInstance = getStripe();
    
    const session = await stripeInstance.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    });

    return {
      success: true,
      session: {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency?.toUpperCase(),
        customer_details: session.customer_details,
        payment_intent: {
          id: session.payment_intent?.id,
          status: session.payment_intent?.status,
          amount: session.payment_intent?.amount,
          currency: session.payment_intent?.currency?.toUpperCase()
        },
        metadata: session.metadata,
        created: session.created,
        expires_at: session.expires_at
      }
    };
  } catch (error) {
    console.error('Checkout session retrieval failed:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

/**
 * Retrieve payment intent status
 * @param {string} paymentIntentId - Stripe payment intent ID
 */
export async function getPaymentIntentStatus(paymentIntentId) {
  try {
    const stripeInstance = getStripe();
    
    const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentIntentId);

    return {
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency?.toUpperCase(),
        payment_method: paymentIntent.payment_method,
        created: paymentIntent.created,
        metadata: paymentIntent.metadata,
        last_payment_error: paymentIntent.last_payment_error
      }
    };
  } catch (error) {
    console.error('Payment intent retrieval failed:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

/**
 * Cancel a checkout session (if not yet completed)
 * @param {string} sessionId - Stripe checkout session ID
 */
export async function cancelCheckoutSession(sessionId) {
  try {
    const stripeInstance = getStripe();
    
    // First get the session to check its status and payment intent
    const session = await stripeInstance.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      throw new Error('Cannot cancel a completed payment');
    }
    
    // If there's a payment intent, cancel it
    if (session.payment_intent) {
      await stripeInstance.paymentIntents.cancel(session.payment_intent);
    }

    return {
      success: true,
      message: 'Checkout session canceled successfully',
      session: {
        id: sessionId,
        status: 'canceled'
      }
    };
  } catch (error) {
    console.error('Checkout session cancellation failed:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

/**
 * Create a payment link for an offer (alternative to checkout session)
 * @param {Object} linkData - Payment link data
 */
export async function createPaymentLink(linkData) {
  try {
    const { offer, returnUrl } = linkData;
    const stripeInstance = getStripe();

    // Create a product first
    const product = await stripeInstance.products.create({
      name: offer.title || `${offer.deliverable_type} (${offer.quantity}x)`,
      description: offer.description,
      metadata: {
        offer_id: offer.id,
        deliverable_type: offer.deliverable_type
      }
    });

    // Create a price for the product
    const price = await stripeInstance.prices.create({
      unit_amount: offer.total_cents,
      currency: (offer.currency || 'USD').toLowerCase(),
      product: product.id,
    });

    // Create payment link
    const paymentLink = await stripeInstance.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/marketplace/payment?status=success`,
        },
      },
      metadata: {
        offer_id: offer.id,
        creator_id: offer.creator_id,
        brand_id: offer.brand_id
      }
    });

    return {
      success: true,
      paymentLink: {
        id: paymentLink.id,
        url: paymentLink.url,
        active: paymentLink.active
      },
      product: {
        id: product.id,
        name: product.name
      },
      price: {
        id: price.id,
        unit_amount: price.unit_amount,
        currency: price.currency?.toUpperCase()
      }
    };
  } catch (error) {
    console.error('Payment link creation failed:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

/**
 * Format price for display - Use centralized formatter
 */
export const formatPrice = utilFormatPrice

export default {
  createCheckoutSession,
  getCheckoutSessionStatus,
  getPaymentIntentStatus,
  cancelCheckoutSession,
  createPaymentLink,
  formatPrice
};