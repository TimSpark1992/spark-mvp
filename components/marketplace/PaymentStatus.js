'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Heading, Text } from '@/components/ui/Typography'
import { 
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  CreditCard,
  RefreshCw
} from 'lucide-react'
import { formatPrice } from '@/lib/marketplace/pricing'

export default function PaymentStatus({ 
  sessionId, 
  onStatusUpdate,
  maxAttempts = 5,
  pollInterval = 3000,
  className = '' 
}) {
  const [status, setStatus] = useState('checking')
  const [paymentData, setPaymentData] = useState(null)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lastChecked, setLastChecked] = useState(null)

  useEffect(() => {
    if (sessionId) {
      checkPaymentStatus()
    }
  }, [sessionId])

  const checkPaymentStatus = async (manualCheck = false) => {
    if (!sessionId) return
    
    try {
      if (manualCheck) {
        setStatus('checking')
        setError('')
      }
      
      console.log(`🔍 Checking payment status (attempt ${attempts + 1}/${maxAttempts})`)
      
      const response = await fetch(`/api/payments/status/${sessionId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to check payment status')
      }
      
      const data = await response.json()
      setPaymentData(data)
      setLastChecked(new Date())
      
      console.log('📊 Payment status data:', data)
      
      // Determine status based on Stripe and database status
      if (data.payment_status === 'paid' && data.database_status === 'paid_escrow') {
        setStatus('success')
        if (onStatusUpdate) {
          onStatusUpdate('success', data)
        }
        return // Stop polling
      } else if (data.status === 'expired' || data.database_status === 'failed') {
        setStatus('failed')
        if (onStatusUpdate) {
          onStatusUpdate('failed', data)
        }
        return // Stop polling
      } else if (data.status === 'open' && data.payment_status === 'unpaid') {
        setStatus('pending')
      } else {
        setStatus('processing')
      }
      
      // Continue polling if not final status and within attempt limits
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      
      if (newAttempts < maxAttempts && !['success', 'failed'].includes(status)) {
        setTimeout(() => checkPaymentStatus(), pollInterval)
      } else if (newAttempts >= maxAttempts) {
        setStatus('timeout')
        setError('Payment status check timed out. Please check your email for confirmation.')
      }
      
    } catch (err) {
      console.error('❌ Error checking payment status:', err)
      setError(err.message)
      setStatus('error')
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-400" />
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-400" />
      case 'timeout':
      case 'error':
        return <AlertTriangle className="w-6 h-6 text-yellow-400" />
      case 'pending':
        return <Clock className="w-6 h-6 text-blue-400" />
      case 'checking':
      case 'processing':
      default:
        return <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'success':
        return {
          title: 'Payment Successful!',
          message: 'Your payment has been processed and funds are now held in escrow. The creator will be notified to begin work.',
          color: 'text-green-400'
        }
      case 'failed':
        return {
          title: 'Payment Failed',
          message: 'Your payment could not be processed. Please try again or contact support.',
          color: 'text-red-400'
        }
      case 'timeout':
        return {
          title: 'Status Check Timeout',
          message: 'We\'re still processing your payment. Please check your email for confirmation or contact support.',
          color: 'text-yellow-400'
        }
      case 'error':
        return {
          title: 'Status Check Error',
          message: error || 'Unable to verify payment status. Please try again.',
          color: 'text-yellow-400'
        }
      case 'pending':
        return {
          title: 'Payment Pending',
          message: 'Your payment session is still active. Please complete the payment process.',
          color: 'text-blue-400'
        }
      case 'processing':
        return {
          title: 'Processing Payment',
          message: 'Your payment is being processed. This may take a few moments.',
          color: 'text-blue-400'
        }
      case 'checking':
      default:
        return {
          title: 'Checking Payment Status',
          message: 'Please wait while we verify your payment...',
          color: 'text-blue-400'
        }
    }
  }

  const statusInfo = getStatusMessage()

  return (
    <Card className={`p-6 ${className}`}>
      {/* Status Header */}
      <div className="flex items-center gap-4 mb-6">
        {getStatusIcon()}
        <div>
          <Heading level={3} size="lg" className={statusInfo.color}>
            {statusInfo.title}
          </Heading>
          <Text size="sm" color="secondary" className="mt-1">
            Session ID: {sessionId?.slice(0, 8)}...
          </Text>
        </div>
      </div>

      {/* Status Message */}
      <Text className="mb-6">
        {statusInfo.message}
      </Text>

      {/* Payment Details */}
      {paymentData && (
        <div className="space-y-4 mb-6">
          <div className="p-4 bg-[#1A1A2A] border border-white/5 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Text color="secondary">Amount</Text>
                <Text weight="medium">
                  {formatPrice(paymentData.amount_total, paymentData.currency)}
                </Text>
              </div>
              
              <div>
                <Text color="secondary">Status</Text>
                <Badge 
                  variant="outline" 
                  className={`${
                    status === 'success' ? 'text-green-400 border-green-400/30' :
                    status === 'failed' ? 'text-red-400 border-red-400/30' :
                    'text-blue-400 border-blue-400/30'
                  }`}
                >
                  {paymentData.payment_status}
                </Badge>
              </div>
              
              <div>
                <Text color="secondary">Offer ID</Text>
                <Text weight="medium" className="font-mono text-xs">
                  {paymentData.offer_id?.slice(0, 8)}...
                </Text>
              </div>
              
              <div>
                <Text color="secondary">Database Status</Text>
                <Badge variant="outline">
                  {paymentData.database_status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Polling Info */}
      {['checking', 'processing', 'pending'].includes(status) && (
        <div className="flex items-center justify-between p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-400" />
            <Text size="sm" className="text-blue-400">
              Auto-checking status... ({attempts}/{maxAttempts})
            </Text>
          </div>
          {lastChecked && (
            <Text size="xs" color="secondary">
              Last checked: {lastChecked.toLocaleTimeString()}
            </Text>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {['error', 'timeout'].includes(status) && (
          <Button 
            onClick={() => checkPaymentStatus(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Check Again
          </Button>
        )}
        
        {status === 'success' && paymentData?.offer_id && (
          <Button 
            onClick={() => window.location.href = `/brand/campaigns/${paymentData.offer_id}`}
            className="bg-green-600 hover:bg-green-700"
          >
            View Offer Details
          </Button>
        )}
        
        {status === 'failed' && (
          <Button 
            onClick={() => window.location.href = '/brand/dashboard'}
            variant="outline"
          >
            Back to Dashboard
          </Button>
        )}
      </div>

      {/* Additional Info */}
      <div className="mt-6 p-3 bg-gray-900/20 border border-gray-500/20 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-4 h-4 text-gray-400" />
          <Text size="sm" weight="medium" className="text-gray-300">Payment Information</Text>
        </div>
        <Text size="xs" color="secondary">
          All payments are processed securely through Stripe. Your funds are held in escrow 
          until work is completed and approved. You will receive email confirmations for all 
          payment-related activities.
        </Text>
      </div>
    </Card>
  )
}