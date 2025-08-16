'use client'

import { useState, useEffect } from 'react'
import { Container } from '@/components/shared/Container'
import Layout from '@/components/shared/Layout'
import { Heading, Text } from '@/components/ui/Typography'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  AlertTriangle,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye,
  Activity,
  Zap,
  Shield,
  CreditCard,
  MessageSquare,
  Target,
  Clock
} from 'lucide-react'

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    overview: {
      total_revenue: 125000,
      total_users: 156,
      total_transactions: 89,
      growth_rate: 12.5,
      conversion_rate: 4.2,
      avg_transaction_value: 140500
    },
    trends: {
      revenue_trend: [45000, 52000, 48000, 67000, 75000, 89000, 125000],
      user_trend: [25, 34, 48, 67, 89, 123, 156],
      transaction_trend: [12, 18, 15, 23, 31, 45, 89]
    },
    violations: {
      total_violations: 23,
      high_risk: 7,
      resolved: 16,
      violation_trends: [2, 3, 5, 4, 3, 4, 2]
    },
    performance: {
      avg_response_time: 245,
      uptime: 99.8,
      error_rate: 0.2,
      api_calls_today: 2456
    },
    demographics: {
      creators: 98,
      brands: 58,
      by_country: {
        US: 89,
        UK: 23,
        AU: 18,
        CA: 15,
        Others: 11
      }
    }
  })
  
  const [timeRange, setTimeRange] = useState('7d')
  const [loading, setLoading] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState('revenue')

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      // Mock API call - in real implementation, this would call /api/admin/analytics
      console.log('Loading analytics for time range:', timeRange)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Analytics data is already loaded with mock data
      
    } catch (error) {
      console.error('❌ Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async () => {
    try {
      // Mock export functionality
      console.log('Exporting analytics report for:', timeRange)
      
      const reportData = {
        generated_at: new Date().toISOString(),
        time_range: timeRange,
        metrics: analytics.overview,
        trends: analytics.trends,
        violations: analytics.violations
      }
      
      // In real implementation, this would generate and download a CSV/PDF
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-report-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('❌ Error exporting report:', error)
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

  const formatPercentage = (num) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`
  }

  const getTimeRangeLabel = (range) => {
    switch (range) {
      case '24h': return 'Last 24 Hours'
      case '7d': return 'Last 7 Days'
      case '30d': return 'Last 30 Days'
      case '90d': return 'Last 90 Days'
      default: return 'Last 7 Days'
    }
  }

  const getTrendColor = (value) => {
    return value >= 0 ? 'text-green-400' : 'text-red-400'
  }

  const getTrendIcon = (value) => {
    return value >= 0 ? 
      <TrendingUp className="w-4 h-4 text-green-400" /> : 
      <TrendingDown className="w-4 h-4 text-red-400" />
  }

  return (
    <Layout>
      <Container className="py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Heading level={1} size="2xl" className="mb-2">
              Platform Analytics
            </Heading>
            <Text color="secondary">
              Comprehensive insights and performance metrics
            </Text>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg text-sm"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            
            <Button onClick={loadAnalytics} disabled={loading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            
            <Button onClick={exportReport}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(analytics.overview.growth_rate)}
                <Text size="sm" className={getTrendColor(analytics.overview.growth_rate)}>
                  {formatPercentage(analytics.overview.growth_rate)}
                </Text>
              </div>
            </div>
            <Text size="sm" color="secondary" className="mb-1">Total Revenue</Text>
            <Text size="2xl" weight="bold">{formatCurrency(analytics.overview.total_revenue)}</Text>
            <Text size="xs" color="secondary" className="mt-2">
              Platform fee earnings from all transactions
            </Text>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                Active
              </Badge>
            </div>
            <Text size="sm" color="secondary" className="mb-1">Total Users</Text>
            <Text size="2xl" weight="bold">{formatNumber(analytics.overview.total_users)}</Text>
            <Text size="xs" color="secondary" className="mt-2">
              {analytics.demographics.creators} creators, {analytics.demographics.brands} brands
            </Text>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <CreditCard className="w-6 h-6 text-purple-400" />
              </div>
              <Text size="sm" className="text-purple-400">
                Avg: {formatCurrency(analytics.overview.avg_transaction_value)}
              </Text>
            </div>
            <Text size="sm" color="secondary" className="mb-1">Total Transactions</Text>
            <Text size="2xl" weight="bold">{formatNumber(analytics.overview.total_transactions)}</Text>
            <Text size="xs" color="secondary" className="mt-2">
              {analytics.overview.conversion_rate}% conversion rate
            </Text>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trends Chart Placeholder */}
          <Card>
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <Heading level={3} size="lg">Revenue Trends</Heading>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-400 border-green-400/30">
                    {formatPercentage(analytics.overview.growth_rate)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              {/* Simplified chart representation */}
              <div className="h-48 flex items-end justify-between gap-2">
                {analytics.trends.revenue_trend.map((value, index) => (
                  <div key={index} className="flex-1 bg-green-600/20 rounded-t flex items-end justify-center pb-2" 
                       style={{ height: `${(value / Math.max(...analytics.trends.revenue_trend)) * 100}%` }}>
                    <Text size="xs" color="secondary">{formatCurrency(value)}</Text>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>6d ago</span>
                <span>5d ago</span>
                <span>4d ago</span>
                <span>3d ago</span>
                <span>2d ago</span>
                <span>Yesterday</span>
                <span>Today</span>
              </div>
            </div>
          </Card>

          {/* Platform Safety */}
          <Card>
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-red-400" />
                  <Heading level={3} size="lg">Platform Safety</Heading>
                </div>
                <Button size="sm" onClick={() => window.location.href = '/admin/violations'}>
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <Text size="lg" weight="bold" className="text-red-400">
                    {analytics.violations.total_violations}
                  </Text>
                  <Text size="sm" color="secondary">Total</Text>
                </div>
                <div className="text-center">
                  <Text size="lg" weight="bold" className="text-orange-400">
                    {analytics.violations.high_risk}
                  </Text>
                  <Text size="sm" color="secondary">High Risk</Text>
                </div>
                <div className="text-center">
                  <Text size="lg" weight="bold" className="text-green-400">
                    {analytics.violations.resolved}
                  </Text>
                  <Text size="sm" color="secondary">Resolved</Text>
                </div>
              </div>
              
              {/* Violation trend mini chart */}
              <div className="h-16 flex items-end justify-between gap-1">
                {analytics.violations.violation_trends.map((value, index) => (
                  <div key={index} className="flex-1 bg-red-600/20 rounded-t" 
                       style={{ height: `${(value / Math.max(...analytics.violations.violation_trends)) * 100}%` }}>
                  </div>
                ))}
              </div>
              <Text size="xs" color="secondary" className="text-center mt-2">
                7-day violation trend
              </Text>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Performance Metrics */}
          <Card>
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-green-400" />
                <Heading level={3} size="lg">System Performance</Heading>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Text size="sm" color="secondary">Uptime</Text>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <Text size="sm" weight="medium">{analytics.performance.uptime}%</Text>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Text size="sm" color="secondary">Avg Response Time</Text>
                <Text size="sm" weight="medium">{analytics.performance.avg_response_time}ms</Text>
              </div>
              
              <div className="flex items-center justify-between">
                <Text size="sm" color="secondary">Error Rate</Text>
                <Text size="sm" weight="medium" className="text-green-400">
                  {analytics.performance.error_rate}%
                </Text>
              </div>
              
              <div className="flex items-center justify-between">
                <Text size="sm" color="secondary">API Calls Today</Text>
                <Text size="sm" weight="medium">{formatNumber(analytics.performance.api_calls_today)}</Text>
              </div>
            </div>
          </Card>

          {/* User Demographics */}
          <Card>
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-400" />
                <Heading level={3} size="lg">User Demographics</Heading>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <Text size="sm" color="secondary" className="mb-2">By Role</Text>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Text size="sm">Creators</Text>
                    <Text size="sm" weight="medium">{analytics.demographics.creators}</Text>
                  </div>
                  <div className="flex items-center justify-between">
                    <Text size="sm">Brands</Text>
                    <Text size="sm" weight="medium">{analytics.demographics.brands}</Text>
                  </div>
                </div>
              </div>
              
              <div>
                <Text size="sm" color="secondary" className="mb-2">By Country</Text>
                <div className="space-y-2">
                  {Object.entries(analytics.demographics.by_country).map(([country, count]) => (
                    <div key={country} className="flex items-center justify-between">
                      <Text size="sm">{country}</Text>
                      <Text size="sm" weight="medium">{count}</Text>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-yellow-400" />
                <Heading level={3} size="lg">Quick Insights</Heading>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="p-3 bg-green-900/20 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <Text size="sm" weight="medium" className="text-green-400">Growth Accelerating</Text>
                </div>
                <Text size="xs" color="secondary">
                  Revenue up {formatPercentage(analytics.overview.growth_rate)} vs last period
                </Text>
              </div>
              
              <div className="p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-blue-400" />
                  <Text size="sm" weight="medium" className="text-blue-400">User Acquisition</Text>
                </div>
                <Text size="xs" color="secondary">
                  {Math.round(analytics.overview.total_users / 7)} new users per day average
                </Text>
              </div>
              
              <div className="p-3 bg-yellow-900/20 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <Text size="sm" weight="medium" className="text-yellow-400">Safety Alert</Text>
                </div>
                <Text size="xs" color="secondary">
                  {analytics.violations.high_risk} high-risk violations need review
                </Text>
              </div>
              
              <Button size="sm" className="w-full mt-4" onClick={() => window.location.href = '/admin/reports'}>
                <FileText className="w-4 h-4 mr-2" />
                Generate Full Report
              </Button>
            </div>
          </Card>
        </div>
      </Container>
    </Layout>
  )
}