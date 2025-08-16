'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Heading, Text } from '@/components/ui/Typography'
import { 
  Shield,
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  Search,
  Filter
} from 'lucide-react'
import { formatPrice } from '@/lib/marketplace/pricing'

export default function AdminPaymentControls({ className = '' }) {
  const [payments, setPayments] = useState([])
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    total_payments: 0,
    total_volume: 0,
    pending_payouts: 0,
    active_escrow: 0
  })
  const [filters, setFilters] = useState({
    payment_status: '',
    payout_status: '',
    search: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      // Load payments and payouts data
      const [paymentsRes, payoutsRes] = await Promise.all([
        fetch('/api/admin/payments'),
        fetch('/api/admin/payouts')
      ])

      if (!paymentsRes.ok || !payoutsRes.ok) {
        throw new Error('Failed to load admin data')
      }

      const paymentsData = await paymentsRes.json()
      const payoutsData = await payoutsRes.json()

      setPayments(paymentsData.payments || [])
      setPayouts(payoutsData.payouts || [])

      // Calculate stats
      calculateStats(paymentsData.payments || [], payoutsData.payouts || [])

    } catch (err) {
      console.error('❌ Error loading admin data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (paymentsData, payoutsData) => {
    const totalPayments = paymentsData.length
    const totalVolume = paymentsData.reduce((sum, p) => sum + (p.amount_cents || 0), 0)
    const pendingPayouts = payoutsData.filter(p => p.status === 'pending').length
    const activeEscrow = paymentsData.filter(p => p.status === 'paid_escrow').reduce((sum, p) => sum + (p.amount_cents || 0), 0)

    setStats({
      total_payments: totalPayments,
      total_volume: totalVolume,
      pending_payouts: pendingPayouts,
      active_escrow: activeEscrow
    })
  }

  const handlePaymentAction = async (paymentId, action, reason) => {
    try {
      const response = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: paymentId,
          action,
          reason
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${action} payment`)
      }

      // Reload data
      await loadData()

    } catch (err) {
      console.error(`❌ Error ${action} payment:`, err)
      alert(`Error: ${err.message}`)
    }
  }

  const handlePayoutRelease = async (payoutId, referenceNumber, notes) => {
    try {
      const response = await fetch(`/api/admin/payouts/${payoutId}/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference_number: referenceNumber,
          admin_notes: notes
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to release payout')
      }

      // Reload data
      await loadData()

    } catch (err) {
      console.error('❌ Error releasing payout:', err)
      alert(`Error: ${err.message}`)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid_escrow':
      case 'released':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />
      case 'failed':
      case 'refunded':
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid_escrow':
      case 'released':
        return 'text-green-400 border-green-400/30'
      case 'pending':
        return 'text-yellow-400 border-yellow-400/30'
      case 'failed':
      case 'refunded':
        return 'text-red-400 border-red-400/30'
      default:
        return 'text-gray-400 border-gray-400/30'
    }
  }

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-blue-400" />
          <Heading level={3} size="lg">Admin Payment Controls</Heading>
        </div>
        <Text>Loading admin data...</Text>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`p-6 border-red-500/20 bg-red-900/20 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <Heading level={3} size="lg" className="text-red-400">Admin Error</Heading>
        </div>
        <Text className="text-red-400 mb-4">{error}</Text>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-400" />
          <Heading level={2} size="xl">Admin Payment Controls</Heading>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-green-400" />
            <div>
              <Text size="sm" color="secondary">Total Payments</Text>
              <Text weight="semibold" size="lg">{stats.total_payments}</Text>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <div>
              <Text size="sm" color="secondary">Total Volume</Text>
              <Text weight="semibold" size="lg">
                {formatPrice(stats.total_volume, 'USD')}
              </Text>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-yellow-400" />
            <div>
              <Text size="sm" color="secondary">Pending Payouts</Text>
              <Text weight="semibold" size="lg">{stats.pending_payouts}</Text>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-purple-400" />
            <div>
              <Text size="sm" color="secondary">Active Escrow</Text>
              <Text weight="semibold" size="lg">
                {formatPrice(stats.active_escrow, 'USD')}
              </Text>
            </div>
          </div>
        </Card>
      </div>

      {/* Payments Section */}
      <Card className="mb-6">
        <div className="p-4 border-b border-white/5">
          <Heading level={3} size="lg">Recent Payments</Heading>
        </div>
        
        <div className="p-4">
          {payments.length === 0 ? (
            <Text color="secondary" className="text-center py-8">
              No payments found
            </Text>
          ) : (
            <div className="space-y-3">
              {payments.slice(0, 10).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-[#1A1A2A] rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(payment.status)}
                    <div>
                      <Text weight="medium">
                        Payment #{payment.id.slice(0, 8)}
                      </Text>
                      <Text size="sm" color="secondary">
                        {formatPrice(payment.amount_cents, payment.currency)} • 
                        {payment.offer?.brand?.full_name || 'N/A'} → 
                        {payment.offer?.creator?.full_name || 'N/A'}
                      </Text>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                    
                    {payment.status === 'paid_escrow' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const reason = prompt('Release reason (optional):')
                            if (reason !== null) {
                              handlePaymentAction(payment.id, 'release', reason)
                            }
                          }}
                          className="text-green-400 border-green-400/30 hover:bg-green-400/10"
                        >
                          Release
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const reason = prompt('Refund reason (required):')
                            if (reason) {
                              handlePaymentAction(payment.id, 'refund', reason)
                            }
                          }}
                          className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                        >
                          Refund
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Payouts Section */}
      <Card>
        <div className="p-4 border-b border-white/5">
          <Heading level={3} size="lg">Pending Payouts</Heading>
        </div>
        
        <div className="p-4">
          {payouts.filter(p => p.status === 'pending').length === 0 ? (
            <Text color="secondary" className="text-center py-8">
              No pending payouts
            </Text>
          ) : (
            <div className="space-y-3">
              {payouts.filter(p => p.status === 'pending').map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-3 bg-[#1A1A2A] rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    <div>
                      <Text weight="medium">
                        Payout #{payout.id.slice(0, 8)}
                      </Text>
                      <Text size="sm" color="secondary">
                        {formatPrice(payout.amount_cents, payout.currency)} to {payout.creator?.full_name || 'N/A'}
                      </Text>
                      <Text size="xs" color="secondary">
                        Method: {payout.method} • Created: {new Date(payout.created_at).toLocaleDateString()}
                      </Text>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400/30">
                      {payout.status}
                    </Badge>
                    
                    <Button
                      size="sm"
                      onClick={() => {
                        const referenceNumber = prompt('Reference number (optional):')
                        const notes = prompt('Admin notes (optional):')
                        if (referenceNumber !== null) {
                          handlePayoutRelease(payout.id, referenceNumber, notes)
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Release
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}