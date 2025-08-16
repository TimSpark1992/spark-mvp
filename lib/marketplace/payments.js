// Marketplace payment utilities and escrow management
// Handles payment lifecycle, escrow operations, and integration with Stripe

import { createTransfer, releaseEscrowPayment, calculatePaymentSplit, createRefund } from '@/lib/stripe/transfers';
import { updateOffer, updatePayment, getPayment, createPayment } from '@/lib/supabase';

/**
 * Process payment after offer acceptance
 * @param {Object} offer - Offer object
 * @param {Object} paymentData - Payment session data
 */
export async function processOfferPayment(offer, paymentData) {
  try {
    const { 
      stripeSessionId, 
      stripePaymentIntentId, 
      amountCents, 
      currency 
    } = paymentData;

    // Calculate payment split
    const paymentSplit = calculatePaymentSplit(amountCents, 20); // 20% platform fee

    // Create payment record
    const payment = {
      offer_id: offer.id,
      stripe_session_id: stripeSessionId,
      stripe_payment_intent_id: stripePaymentIntentId,
      amount_cents: amountCents,
      currency: currency,
      status: 'paid_escrow',
      platform_fee_pct: 20,
      platform_fee_cents: paymentSplit.platformFeeCents,
      creator_amount_cents: paymentSplit.creatorAmountCents,
      payment_method: 'card',
      metadata: {
        offer_title: offer.title || `${offer.deliverable_type} for ${offer.quantity}x`,
        creator_id: offer.creator_id,
        brand_id: offer.brand_id,
        campaign_id: offer.campaign_id
      }
    };

    const { data: paymentRecord, error: paymentError } = await createPayment(payment);
    if (paymentError) {
      throw new Error(`Failed to create payment record: ${paymentError.message}`);
    }

    // Update offer status
    const { error: offerError } = await updateOffer(offer.id, {
      status: 'paid_escrow',
      payment_id: paymentRecord.id
    });

    if (offerError) {
      throw new Error(`Failed to update offer status: ${offerError.message}`);
    }

    return {
      success: true,
      payment: paymentRecord,
      offer: { ...offer, status: 'paid_escrow', payment_id: paymentRecord.id }
    };
  } catch (error) {
    console.error('Payment processing failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Release escrowed payment to creator
 * @param {string} paymentId - Payment ID from database
 */
export async function releasePaymentToCreator(paymentId) {
  try {
    // Get payment details
    const { data: payment, error: paymentError } = await getPayment(paymentId);
    if (paymentError || !payment) {
      throw new Error(`Payment not found: ${paymentError?.message || 'Invalid payment ID'}`);
    }

    if (payment.status !== 'paid_escrow') {
      throw new Error(`Payment is not in escrow status. Current status: ${payment.status}`);
    }

    // Note: In a real implementation, you would need the creator's Stripe Connect account ID
    // For now, we'll update the status to indicate release is pending Connect account setup
    
    const { error: updateError } = await updatePayment(paymentId, {
      status: 'released',
      released_at: new Date().toISOString(),
      metadata: {
        ...payment.metadata,
        release_method: 'pending_connect_account',
        release_note: 'Payment marked for release - requires Stripe Connect integration'
      }
    });

    if (updateError) {
      throw new Error(`Failed to update payment status: ${updateError.message}`);
    }

    // Also update the associated offer
    if (payment.offer_id) {
      await updateOffer(payment.offer_id, {
        status: 'completed'
      });
    }

    return {
      success: true,
      message: 'Payment released successfully',
      payment: {
        ...payment,
        status: 'released',
        released_at: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Payment release failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process refund for a payment
 * @param {string} paymentId - Payment ID from database
 * @param {Object} refundData - Refund details
 */
export async function processPaymentRefund(paymentId, refundData = {}) {
  try {
    // Get payment details
    const { data: payment, error: paymentError } = await getPayment(paymentId);
    if (paymentError || !payment) {
      throw new Error(`Payment not found: ${paymentError?.message || 'Invalid payment ID'}`);
    }

    if (!payment.stripe_payment_intent_id) {
      throw new Error('Payment does not have a Stripe payment intent ID');
    }

    // Process refund through Stripe
    const refundResult = await createRefund({
      paymentIntentId: payment.stripe_payment_intent_id,
      amount: refundData.amount, // Optional, full refund if not specified
      reason: refundData.reason || 'requested_by_customer',
      metadata: {
        payment_id: paymentId,
        offer_id: payment.offer_id,
        refund_reason: refundData.reason || 'requested_by_customer'
      }
    });

    if (!refundResult.success) {
      throw new Error(`Stripe refund failed: ${refundResult.error}`);
    }

    // Update payment status
    const refundAmount = refundResult.refund.amount;
    const isPartialRefund = refundAmount < payment.amount_cents;
    
    const { error: updateError } = await updatePayment(paymentId, {
      status: isPartialRefund ? 'partially_refunded' : 'refunded',
      refunded_amount_cents: refundAmount,
      refunded_at: new Date().toISOString(),
      metadata: {
        ...payment.metadata,
        stripe_refund_id: refundResult.refund.id,
        refund_reason: refundData.reason || 'requested_by_customer'
      }
    });

    if (updateError) {
      throw new Error(`Failed to update payment status: ${updateError.message}`);
    }

    // Update associated offer status
    if (payment.offer_id) {
      await updateOffer(payment.offer_id, {
        status: 'refunded'
      });
    }

    return {
      success: true,
      refund: refundResult.refund,
      message: isPartialRefund ? 'Partial refund processed' : 'Full refund processed'
    };
  } catch (error) {
    console.error('Refund processing failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get payment status and details
 * @param {string} paymentId - Payment ID from database
 */
export async function getPaymentStatus(paymentId) {
  try {
    const { data: payment, error } = await getPayment(paymentId);
    if (error || !payment) {
      throw new Error(`Payment not found: ${error?.message || 'Invalid payment ID'}`);
    }

    return {
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount_cents: payment.amount_cents,
        currency: payment.currency,
        platform_fee_cents: payment.platform_fee_cents,
        creator_amount_cents: payment.creator_amount_cents,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        released_at: payment.released_at,
        refunded_at: payment.refunded_at,
        refunded_amount_cents: payment.refunded_amount_cents,
        metadata: payment.metadata
      }
    };
  } catch (error) {
    console.error('Failed to get payment status:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Calculate total earnings for a creator
 * @param {string} creatorId - Creator ID
 * @param {Object} filters - Optional filters (date range, status, etc.)
 */
export async function calculateCreatorEarnings(creatorId, filters = {}) {
  try {
    // This would require a new Supabase function to get payments by creator
    // For now, return a basic structure
    
    return {
      success: true,
      earnings: {
        total_earned_cents: 0,
        pending_escrow_cents: 0,
        released_cents: 0,
        currency: 'USD',
        payment_count: 0,
        average_payment_cents: 0
      },
      message: 'Creator earnings calculation requires additional Supabase functions'
    };
  } catch (error) {
    console.error('Failed to calculate creator earnings:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get payment analytics for platform
 * @param {Object} filters - Optional filters (date range, etc.)
 */
export async function getPlatformPaymentAnalytics(filters = {}) {
  try {
    // This would require analytics queries
    // For now, return a basic structure
    
    return {
      success: true,
      analytics: {
        total_volume_cents: 0,
        total_fees_collected_cents: 0,
        active_escrow_cents: 0,
        completed_payments: 0,
        pending_payments: 0,
        refunded_payments: 0,
        currency: 'USD'
      },
      message: 'Platform analytics requires additional database queries'
    };
  } catch (error) {
    console.error('Failed to get platform analytics:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Validate payment amount against offer
 * @param {Object} offer - Offer object
 * @param {number} paymentAmount - Payment amount in cents
 */
export function validatePaymentAmount(offer, paymentAmount) {
  const expectedAmount = offer.total_cents;
  
  if (paymentAmount !== expectedAmount) {
    return {
      valid: false,
      error: `Payment amount mismatch. Expected: ${expectedAmount}, Received: ${paymentAmount}`,
      expectedAmount,
      receivedAmount: paymentAmount
    };
  }
  
  return {
    valid: true,
    expectedAmount,
    receivedAmount: paymentAmount
  };
}

export default {
  processOfferPayment,
  releasePaymentToCreator,
  processPaymentRefund,
  getPaymentStatus,
  calculateCreatorEarnings,
  getPlatformPaymentAnalytics,
  validatePaymentAmount
};