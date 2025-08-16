'use client'

import { useState, useEffect } from 'react'
import { Container } from '@/components/shared/Container'
import Layout from '@/components/shared/Layout'
import { Heading, Text } from '@/components/ui/Typography'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Shield,
  DollarSign,
  Users,
  AlertTriangle,
  TrendingUp,
  Settings,
  BarChart3,
  RefreshCw,
  Download,
  Bell,
  Activity,
  FileText,
  CreditCard,
  UserX,
  MessageSquare,
  Eye,
  Calendar,
  Zap,
  Clock
} from 'lucide-react'

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      total_users: 0,
      total_payments: 0,
      total_volume: 0,
      active_offers: 0,
      pending_payouts: 0,
      active_violations: 0,
      platform_revenue: 0,
      growth_rate: 0
    },
    recentActivity: [],
    alerts: [],
    loading: true
  })
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setRefreshing(true)
      
      // Load data from multiple admin endpoints
      const [paymentsRes, violationsRes, usersRes] = await Promise.all([
        fetch('/api/admin/payments').catch(() => ({ ok: false })),
        fetch('/api/admin/violations').catch(() => ({ ok: false })),
        fetch('/api/admin/users').catch(() => ({ ok: false }))
      ])

      // Process payments data
      let paymentsData = { payments: [], statistics: {} }
      if (paymentsRes.ok) {
        paymentsData = await paymentsRes.json()
      }

      // Process violations data  
      let violationsData = { violations: [], statistics: {} }
      if (violationsRes.ok) {
        violationsData = await violationsRes.json()
      }

      // Calculate comprehensive metrics
      const metrics = {
        total_users: 156, // Mock data - would come from users endpoint
        total_payments: paymentsData.payments?.length || 0,
        total_volume: paymentsData.payments?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0,
        active_offers: 23, // Mock data
        pending_payouts: 5, // Mock data  
        active_violations: violationsData.statistics?.violations_today || 0,
        platform_revenue: Math.round((paymentsData.payments?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0) * 0.2),
        growth_rate: 12.5 // Mock data
      }

      // Generate recent activity
      const recentActivity = [
        {
          id: 1,
          type: 'payment',
          title: 'Payment completed',
          description: 'Brand ABC paid $500 for campaign XYZ',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          severity: 'success'
        },
        {
          id: 2,
          type: 'violation',
          title: 'High-risk violation detected',
          description: 'User shared contact information in message',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          severity: 'warning'
        },
        {
          id: 3,
          type: 'user',
          title: 'New creator registered', 
          description: 'Jane Smith completed onboarding as creator',
          timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          severity: 'info'
        },
        {
          id: 4,
          type: 'payout',
          title: 'Payout released',
          description: 'Released $400 to creator for completed work',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          severity: 'success'
        }
      ]

      // Generate alerts
      const alerts = []
      if (violationsData.statistics?.high_risk_count > 0) {
        alerts.push({
          id: 1,
          type: 'security',
          title: 'High-risk violations detected',
          message: `${violationsData.statistics.high_risk_count} high-risk violations need review`,
          severity: 'error',
          action: '/admin/violations'
        })
      }
      
      if (metrics.pending_payouts > 10) {
        alerts.push({
          id: 2,
          type: 'finance',
          title: 'Pending payouts require attention',
          message: `${metrics.pending_payouts} payouts awaiting manual release`,
          severity: 'warning',
          action: '/admin/payouts'
        })
      }

      setDashboardData({
        metrics,
        recentActivity,
        alerts,
        loading: false
      })

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error)
      setDashboardData(prev => ({ ...prev, loading: false }))
    } finally {
      setRefreshing(false)
    }
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'payment': return <CreditCard className="w-4 h-4 text-green-400" />
      case 'violation': return <AlertTriangle className="w-4 h-4 text-red-400" />
      case 'user': return <Users className="w-4 h-4 text-blue-400" />
      case 'payout': return <DollarSign className="w-4 h-4 text-purple-400" />
      default: return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'success': return 'text-green-400 border-green-400/30'
      case 'warning': return 'text-yellow-400 border-yellow-400/30'
      case 'error': return 'text-red-400 border-red-400/30'
      default: return 'text-blue-400 border-blue-400/30'
    }
  }

  const formatCurrency = (cents) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  if (dashboardData.loading) {
    return (
      <Layout>
        <Container className="py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
              <Text>Loading admin dashboard...</Text>
            </div>
          </div>
        </Container>
      </Layout>
    )
  }

  return (
    <Layout>
      <Container className="py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Heading level={1} size="2xl" className="mb-2">
              Admin Dashboard
            </Heading>
            <Text color="secondary">
              Complete marketplace oversight and management
            </Text>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={loadDashboardData} disabled={refreshing} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {dashboardData.alerts.length > 0 && (
          <div className="space-y-3 mb-8">
            {dashboardData.alerts.map((alert) => (
              <Card key={alert.id} className={`p-4 border-l-4 ${
                alert.severity === 'error' ? 'border-l-red-500 bg-red-900/10' :
                alert.severity === 'warning' ? 'border-l-yellow-500 bg-yellow-900/10' :
                'border-l-blue-500 bg-blue-900/10'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className={`w-5 h-5 ${
                      alert.severity === 'error' ? 'text-red-400' :
                      alert.severity === 'warning' ? 'text-yellow-400' :
                      'text-blue-400'
                    }`} />
                    <div>
                      <Text weight="semibold">{alert.title}</Text>
                      <Text size="sm" color="secondary">{alert.message}</Text>
                    </div>
                  </div>
                  
                  {alert.action && (
                    <Button size="sm" onClick={() => window.location.href = alert.action}>
                      View Details
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400/30">
                +{dashboardData.metrics.growth_rate}%
              </Badge>
            </div>
            <Text size="sm" color="secondary" className="mb-1">Total Users</Text>
            <Text size="2xl" weight="bold">{formatNumber(dashboardData.metrics.total_users)}</Text>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <Text size="sm" color="secondary" className="mb-1">Total Volume</Text>
            <Text size="2xl" weight="bold">{formatCurrency(dashboardData.metrics.total_volume)}</Text>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <Text size="sm" className="text-purple-400">20% fee</Text>
            </div>
            <Text size="sm" color="secondary" className="mb-1">Platform Revenue</Text>
            <Text size="2xl" weight="bold">{formatCurrency(dashboardData.metrics.platform_revenue)}</Text>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-600/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              {dashboardData.metrics.active_violations > 0 && (
                <Badge variant="outline" className="text-red-400 border-red-400/30">
                  Needs Review
                </Badge>
              )}
            </div>
            <Text size="sm" color="secondary" className="mb-1">Active Violations</Text>
            <Text size="2xl" weight="bold">{dashboardData.metrics.active_violations}</Text>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <div>
                <Text size="sm" color="secondary">Active Offers</Text>
                <Text weight="semibold" size="lg">{dashboardData.metrics.active_offers}</Text>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-green-400" />
              <div>
                <Text size="sm" color="secondary">Total Payments</Text>
                <Text weight="semibold" size="lg">{dashboardData.metrics.total_payments}</Text>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-400" />
              <div>
                <Text size="sm" color="secondary">Pending Payouts</Text>
                <Text weight="semibold" size="lg">{dashboardData.metrics.pending_payouts}</Text>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card>
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <Heading level={3} size="lg">Recent Activity</Heading>
                <Button size="sm" variant="outline" onClick={() => window.location.href = '/admin/activity'}>
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-4">
                {dashboardData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-[#1A1A2A] rounded-lg">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <Text weight="medium" size="sm">{activity.title}</Text>
                      <Text size="xs" color="secondary" className="mt-1">
                        {activity.description}
                      </Text>
                      <Text size="xs" color="secondary" className="mt-2">
                        {new Date(activity.timestamp).toLocaleString()}
                      </Text>
                    </div>
                    <Badge variant="outline" className={getSeverityColor(activity.severity)} size="sm">
                      {activity.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <div className="p-4 border-b border-white/5">
              <Heading level={3} size="lg">Quick Actions</Heading>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => window.location.href = '/admin/payments'}
                  className="h-20 flex-col gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/20"
                >
                  <CreditCard className="w-6 h-6 text-blue-400" />
                  <Text size="sm">Payments</Text>
                </Button>

                <Button 
                  onClick={() => window.location.href = '/admin/violations'}
                  className="h-20 flex-col gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/20"
                >
                  <Shield className="w-6 h-6 text-red-400" />
                  <Text size="sm">Violations</Text>
                </Button>

                <Button 
                  onClick={() => window.location.href = '/admin/users'}
                  className="h-20 flex-col gap-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/20"
                >
                  <Users className="w-6 h-6 text-green-400" />
                  <Text size="sm">Users</Text>
                </Button>

                <Button 
                  onClick={() => window.location.href = '/admin/settings'}
                  className="h-20 flex-col gap-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/20"
                >
                  <Settings className="w-6 h-6 text-purple-400" />
                  <Text size="sm">Settings</Text>
                </Button>

                <Button 
                  onClick={() => window.location.href = '/admin/analytics'}
                  className="h-20 flex-col gap-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/20"
                >
                  <BarChart3 className="w-6 h-6 text-yellow-400" />
                  <Text size="sm">Analytics</Text>
                </Button>

                <Button 
                  onClick={() => window.location.href = '/admin/reports'}
                  className="h-20 flex-col gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20"
                >
                  <FileText className="w-6 h-6 text-indigo-400" />
                  <Text size="sm">Reports</Text>
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* System Status */}
        <Card className="mt-8">
          <div className="p-4 border-b border-white/5">
            <Heading level={3} size="lg">System Status</Heading>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <div>
                  <Text size="sm" weight="medium">Payment System</Text>
                  <Text size="xs" color="secondary">Operational</Text>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <div>
                  <Text size="sm" weight="medium">Messaging</Text>
                  <Text size="xs" color="secondary">Operational</Text>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <div>
                  <Text size="sm" weight="medium">File Storage</Text>
                  <Text size="xs" color="secondary">Operational</Text>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div>
                  <Text size="sm" weight="medium">Analytics</Text>
                  <Text size="xs" color="secondary">Degraded</Text>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Container>
    </Layout>
  )
}