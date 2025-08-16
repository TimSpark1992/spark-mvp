// Stripe transfers management for creator payouts and escrow releases
// Handles transfers, refunds, and payment releases in the marketplace

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
 * Create a transfer to a creator's Stripe Connect account
 * @param {Object} transferData - Transfer details
 * @param {string} transferData.amount - Amount in cents
 * @param {string} transferData.currency - Currency code (USD, MYR, SGD)
 * @param {string} transferData.destination - Stripe Connect account ID
 * @param {string} transferData.description - Transfer description
 * @param {Object} transferData.metadata - Additional metadata
 */
export async function createTransfer(transferData) {
  try {
    const stripeInstance = getStripe();
    
    const transfer = await stripeInstance.transfers.create({
      amount: transferData.amount,
      currency: transferData.currency.toLowerCase(),
      destination: transferData.destination,
      description: transferData.description || `Marketplace payout for ${transferData.metadata?.offer_id}`,
      metadata: {
        offer_id: transferData.metadata?.offer_id,
        creator_id: transferData.metadata?.creator_id,
        payment_id: transferData.metadata?.payment_id,
        ...transferData.metadata
      }
    });

    return {
      success: true,
      transfer: {
        id: transfer.id,
        amount: transfer.amount,
        currency: transfer.currency.toUpperCase(),
        destination: transfer.destination,
        created: transfer.created,
        status: transfer.reversals?.data?.length > 0 ? 'reversed' : 'transferred'
      }
    };
  } catch (error) {
    console.error('Transfer creation failed:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

/**
 * Create a refund for a payment
 * @param {Object} refundData - Refund details
 * @param {string} refundData.paymentIntentId - Payment intent to refund
 * @param {number} refundData.amount - Amount to refund in cents (optional, full refund if not specified)
 * @param {string} refundData.reason - Refund reason
 * @param {Object} refundData.metadata - Additional metadata
 */
export async function createRefund(refundData) {
  try {
    const stripeInstance = getStripe();
    
    const refundParams = {
      payment_intent: refundData.paymentIntentId,
      reason: refundData.reason || 'requested_by_customer',
      metadata: {
        offer_id: refundData.metadata?.offer_id,
        refund_type: refundData.metadata?.refund_type || 'full',
        ...refundData.metadata
      }
    };

    // Add amount only if partial refund
    if (refundData.amount) {
      refundParams.amount = refundData.amount;
    }

    const refund = await stripeInstance.refunds.create(refundParams);

    return {
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency.toUpperCase(),
        status: refund.status,
        reason: refund.reason,
        created: refund.created
      }
    };
  } catch (error) {
    console.error('Refund creation failed:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

/**
 * Release escrowed payment to creator
 * @param {Object} releaseData - Release details
 * @param {string} releaseData.paymentId - Payment ID from database
 * @param {string} releaseData.creatorStripeAccountId - Creator's Stripe Connect account
 * @param {number} releaseData.creatorAmount - Amount to transfer to creator (after platform fee)
 * @param {string} releaseData.currency - Currency code
 * @param {Object} releaseData.metadata - Additional metadata
 */
export async function releaseEscrowPayment(releaseData) {
  try {
    const { 
      paymentId, 
      creatorStripeAccountId, 
      creatorAmount, 
      currency, 
      metadata = {} 
    } = releaseData;

    // Create transfer to creator
    const transferResult = await createTransfer({
      amount: creatorAmount,
      currency: currency,
      destination: creatorStripeAccountId,
      description: `Escrow release for payment ${paymentId}`,
      metadata: {
        payment_id: paymentId,
        type: 'escrow_release',
        ...metadata
      }
    });

    if (!transferResult.success) {
      return {
        success: false,
        error: 'Failed to transfer funds to creator',
        details: transferResult.error
      };
    }

    return {
      success: true,
      transfer: transferResult.transfer,
      message: 'Escrow payment released successfully'
    };
  } catch (error) {
    console.error('Escrow release failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get transfer details
 * @param {string} transferId - Stripe transfer ID
 */
export async function getTransfer(transferId) {
  try {
    const stripeInstance = getStripe();
    
    const transfer = await stripeInstance.transfers.retrieve(transferId);
    
    return {
      success: true,
      transfer: {
        id: transfer.id,
        amount: transfer.amount,
        currency: transfer.currency.toUpperCase(),
        destination: transfer.destination,
        created: transfer.created,
        status: transfer.reversals?.data?.length > 0 ? 'reversed' : 'transferred',
        metadata: transfer.metadata
      }
    };
  } catch (error) {
    console.error('Transfer retrieval failed:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

/**
 * Reverse a transfer (if possible)
 * @param {string} transferId - Transfer ID to reverse
 * @param {Object} reversalData - Reversal details
 */
export async function reverseTransfer(transferId, reversalData = {}) {
  try {
    const stripeInstance = getStripe();
    
    const reversal = await stripeInstance.transfers.createReversal(transferId, {
      amount: reversalData.amount, // Optional, full reversal if not specified
      description: reversalData.description || 'Transfer reversal',
      metadata: reversalData.metadata || {}
    });

    return {
      success: true,
      reversal: {
        id: reversal.id,
        amount: reversal.amount,
        currency: reversal.currency.toUpperCase(),
        created: reversal.created,
        transfer: transferId
      }
    };
  } catch (error) {
    console.error('Transfer reversal failed:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

/**
 * Calculate platform fees and creator payout
 * @param {number} totalAmount - Total payment amount in cents
 * @param {number} platformFeePercentage - Platform fee percentage (default 20%)
 */
export function calculatePaymentSplit(totalAmount, platformFeePercentage = 20) {
  const platformFeeCents = Math.round(totalAmount * (platformFeePercentage / 100));
  const creatorAmountCents = totalAmount - platformFeeCents;
  
  return {
    totalAmount: totalAmount,
    platformFeeCents: platformFeeCents,
    creatorAmountCents: creatorAmountCents,
    platformFeePercentage: platformFeePercentage
  };
}

/**
 * Batch process multiple transfers
 * @param {Array} transfers - Array of transfer data objects
 */
export async function batchProcessTransfers(transfers) {
  const results = [];
  
  for (const transferData of transfers) {
    const result = await createTransfer(transferData);
    results.push({
      transferData: transferData,
      result: result
    });
    
    // Small delay between transfers to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return {
    totalTransfers: transfers.length,
    successfulTransfers: results.filter(r => r.result.success).length,
    failedTransfers: results.filter(r => !r.result.success).length,
    results: results
  };
}

export default {
  createTransfer,
  createRefund,
  releaseEscrowPayment,
  getTransfer,
  reverseTransfer,
  calculatePaymentSplit,
  batchProcessTransfers
};