'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Container } from '@/components/shared/Container'
import Layout from '@/components/shared/Layout'
import { Heading, Text } from '@/components/ui/Typography'
import PaymentCheckout from '@/components/marketplace/PaymentCheckout'
import PaymentStatus from '@/components/marketplace/PaymentStatus'
import { Card } from '@/components/ui/Card'
import { Loader2, AlertCircle } from 'lucide-react'
import { formatPrice } from '@/lib/marketplace/pricing'

export default function MarketplacePaymentPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { offerId } = params
  const sessionId = searchParams.get('session_id')
  
  const [offer, setOffer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentStatus, setPaymentStatus] = useState(null)

  useEffect(() => {
    if (offerId) {
      loadOffer()
    }
  }, [offerId])

  const loadOffer = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`/api/offers/${offerId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load offer')
      }
      
      const data = await response.json()
      setOffer(data.offer)
      
    } catch (err) {
      console.error('❌ Error loading offer:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentStatusUpdate = (status, data) => {
    setPaymentStatus(status)
    
    if (status === 'success') {
      // Refresh offer data to get updated status
      loadOffer()
    }
  }

  if (loading) {
    return (
      <Layout>
        <Container className="py-8">
          <Card className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
            <Text>Loading payment information...</Text>
          </Card>
        </Container>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <Container className="py-8">
          <Card className="p-8 border-red-500/20 bg-red-900/20 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <Heading level={2} size="xl" className="text-red-400 mb-4">
              Payment Error
            </Heading>
            <Text className="text-red-400 mb-4">{error}</Text>
            <Text size="sm" color="secondary">
              Please try again or contact support if the problem persists.
            </Text>
          </Card>
        </Container>
      </Layout>
    )
  }

  return (
    <Layout>
      <Container className="py-8 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <Heading level={1} size="2xl" className="mb-2">
            {sessionId ? 'Payment Status' : 'Complete Payment'}
          </Heading>
          <Text color="secondary">
            {sessionId 
              ? 'Checking your payment status...' 
              : 'Secure payment processing for your marketplace offer'
            }
          </Text>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Payment Component */}
          <div>
            {sessionId ? (
              <PaymentStatus
                sessionId={sessionId}
                onStatusUpdate={handlePaymentStatusUpdate}
              />
            ) : (
              <PaymentCheckout
                offer={offer}
                onPaymentSuccess={(data) => {
                  console.log('Payment successful:', data)
                  handlePaymentStatusUpdate('success', data)
                }}
                onPaymentCancel={() => {
                  console.log('Payment cancelled')
                  window.location.href = `/marketplace/${offerId}`
                }}
              />
            )}
          </div>

          {/* Right Column - Offer Details */}
          {offer && (
            <div>
              <Card className="p-6">
                <Heading level={3} size="lg" className="mb-4">
                  Offer Details
                </Heading>
                
                <div className="space-y-4">
                  <div>
                    <Text size="sm" color="secondary">Campaign</Text>
                    <Text weight="medium">{offer.campaign?.title || 'N/A'}</Text>
                  </div>
                  
                  <div>
                    <Text size="sm" color="secondary">Creator</Text>
                    <Text weight="medium">{offer.creator?.full_name || 'N/A'}</Text>
                  </div>
                  
                  <div>
                    <Text size="sm" color="secondary">Status</Text>
                    <Text weight="medium" className={`
                      ${offer.status === 'accepted' ? 'text-green-400' :
                        offer.status === 'paid_escrow' ? 'text-blue-400' :
                        'text-gray-400'
                      }
                    `}>
                      {offer.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </div>
                  
                  {offer.items && offer.items.length > 0 && (
                    <div>
                      <Text size="sm" color="secondary" className="mb-2">Deliverables</Text>
                      <div className="space-y-2">
                        {offer.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <Text>{item.deliverable_type} × {item.qty}</Text>
                            <Text className="text-green-400">
                              {formatPrice(item.unit_price_cents * item.qty, offer.currency)}
                            </Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {offer.notes && (
                    <div>
                      <Text size="sm" color="secondary">Notes</Text>
                      <Text size="sm" className="bg-[#1A1A2A] p-3 rounded-lg mt-1">
                        {offer.notes}
                      </Text>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="mt-8 text-center">
          <Text size="sm" color="secondary">
            Need help? Contact our support team for assistance with payments and offers.
          </Text>
        </div>
      </Container>
    </Layout>
  )
}