'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Heading, Text } from '@/components/ui/Typography'
import { 
  CreditCard,
  Lock,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { formatPrice } from '@/lib/marketplace/pricing'

export default function PaymentCheckout({ 
  offer, 
  onPaymentSuccess, 
  onPaymentCancel,
  className = '' 
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handlePayNow = async () => {
    if (!offer) return
    
    try {
      setLoading(true)
      setError('')
      
      // Get current origin for dynamic URLs
      const originUrl = window.location.origin
      
      console.log('💳 Initiating payment for offer:', offer.id)
      
      // Create checkout session
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offer_id: offer.id,
          origin_url: originUrl
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }
      
      const data = await response.json()
      
      if (data.checkout_url) {
        console.log('🔄 Redirecting to Stripe Checkout:', data.session_id)
        
        // Redirect to Stripe Checkout
        window.location.href = data.checkout_url
      } else {
        throw new Error('No checkout URL received')
      }
      
    } catch (err) {
      console.error('❌ Payment initiation error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  if (!offer) {
    return (
      <Card className={`p-6 border-red-500/20 bg-red-900/20 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <Heading level={3} size="lg" className="text-red-400">Payment Error</Heading>
        </div>
        <Text className="text-red-400">No offer data provided</Text>
      </Card>
    )
  }

  if (offer.status !== 'accepted') {
    return (
      <Card className={`p-6 border-yellow-500/20 bg-yellow-900/20 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <Heading level={3} size="lg" className="text-yellow-400">Payment Not Available</Heading>
        </div>
        <Text className="text-yellow-400">
          This offer must be accepted before payment can be processed.
        </Text>
        <Text size="sm" color="secondary" className="mt-2">
          Current status: <Badge variant="outline">{offer.status}</Badge>
        </Text>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className={`p-6 border-green-500/20 bg-green-900/20 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <Heading level={3} size="lg" className="text-green-400">Payment Successful!</Heading>
        </div>
        <Text className="text-green-400">
          Your payment has been processed successfully. The funds are now held in escrow.
        </Text>
      </Card>
    )
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-5 h-5 text-blue-400" />
        <Heading level={3} size="lg">Secure Payment</Heading>
      </div>

      {/* Payment Summary */}
      <div className="space-y-4 mb-6">
        <div className="p-4 bg-[#1A1A2A] border border-white/5 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <Text size="sm" color="secondary">Offer Summary</Text>
            <Badge variant="outline" className="text-green-400 border-green-400/30">
              {offer.status}
            </Badge>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <Text color="secondary">Creator</Text>
              <Text>{offer.creator?.full_name || 'N/A'}</Text>
            </div>
            
            <div className="flex justify-between">
              <Text color="secondary">Campaign</Text>
              <Text>{offer.campaign?.title || 'N/A'}</Text>
            </div>
            
            <div className="flex justify-between">
              <Text color="secondary">Items</Text>
              <Text>{offer.items?.length || 0} deliverable(s)</Text>
            </div>
          </div>
        </div>
        
        {/* Pricing Breakdown */}
        <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
          <Heading level={4} size="md" className="text-blue-400 mb-3">
            Payment Breakdown
          </Heading>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <Text color="secondary">Subtotal</Text>
              <Text>{formatPrice(offer.subtotal_cents, offer.currency)}</Text>
            </div>
            
            <div className="flex justify-between">
              <Text color="secondary">Platform Fee ({offer.platform_fee_pct}%)</Text>
              <Text>{formatPrice(offer.platform_fee_cents, offer.currency)}</Text>
            </div>
            
            <div className="border-t border-white/10 pt-2 flex justify-between">
              <Text weight="semibold">Total Amount</Text>
              <Text weight="semibold" className="text-green-400 text-lg">
                {formatPrice(offer.total_cents, offer.currency)}
              </Text>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex justify-between text-sm">
              <Text color="secondary">Creator will receive</Text>
              <Text className="text-green-400">
                {formatPrice(offer.subtotal_cents, offer.currency)}
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 bg-gray-900/20 border border-gray-500/20 rounded-lg mb-6">
        <Lock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
        <div>
          <Text size="sm" weight="medium" className="text-gray-300">Secure Escrow Payment</Text>
          <Text size="xs" color="secondary" className="mt-1">
            Your payment will be securely held in escrow until the work is completed and approved. 
            Powered by Stripe with industry-standard encryption.
          </Text>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-500/20 rounded-lg mb-4">
          <XCircle className="w-5 h-5 text-red-400" />
          <Text size="sm" className="text-red-400">{error}</Text>
        </div>
      )}

      {/* Payment Button */}
      <Button 
        onClick={handlePayNow}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Pay {formatPrice(offer.total_cents, offer.currency)} Now
          </div>
        )}
      </Button>

      <Text size="xs" color="secondary" className="text-center mt-3">
        You will be redirected to Stripe's secure payment page
      </Text>
    </Card>
  )
}