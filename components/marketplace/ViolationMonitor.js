'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Heading, Text } from '@/components/ui/Typography'
import { 
  Shield,
  AlertTriangle,
  Eye,
  UserX,
  MessageSquare,
  TrendingUp,
  Filter,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

export default function ViolationMonitor({ className = '' }) {
  const [violations, setViolations] = useState([])
  const [statistics, setStatistics] = useState({
    total_violations: 0,
    high_risk_count: 0,
    violations_today: 0,
    violations_this_week: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    risk_level: '',
    start_date: '',
    end_date: ''
  })
  const [expandedViolation, setExpandedViolation] = useState(null)

  useEffect(() => {
    loadViolations()
  }, [filters])

  const loadViolations = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (filters.risk_level) params.append('risk_level', filters.risk_level)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)

      const response = await fetch(`/api/admin/violations?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to load violations')
      }

      const data = await response.json()
      setViolations(data.violations || [])
      setStatistics(data.statistics || statistics)

    } catch (err) {
      console.error('❌ Error loading violations:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleViolationAction = async (violationId, action, notes = '') => {
    try {
      const response = await fetch('/api/admin/violations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          violation_id: violationId,
          action,
          admin_notes: notes
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${action} violation`)
      }

      // Reload violations
      await loadViolations()

    } catch (err) {
      console.error(`❌ Error ${action} violation:`, err)
      alert(`Error: ${err.message}`)
    }
  }

  const getRiskColor = (score) => {
    if (score >= 4) return 'text-red-400 border-red-400/30 bg-red-900/20'
    if (score >= 3) return 'text-orange-400 border-orange-400/30 bg-orange-900/20'
    if (score >= 2) return 'text-yellow-400 border-yellow-400/30 bg-yellow-900/20'
    return 'text-blue-400 border-blue-400/30 bg-blue-900/20'
  }

  const formatViolationTypes = (violations) => {
    if (!violations || !Array.isArray(violations)) return []
    
    const categories = new Set()
    violations.forEach(v => {
      if (v.category) categories.add(v.category)
    })
    
    return Array.from(categories)
  }

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-blue-400" />
          <Heading level={3} size="lg">Violation Monitor</Heading>
        </div>
        <Text>Loading violation data...</Text>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`p-6 border-red-500/20 bg-red-900/20 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <Heading level={3} size="lg" className="text-red-400">Error</Heading>
        </div>
        <Text className="text-red-400 mb-4">{error}</Text>
        <Button onClick={loadViolations} variant="outline">
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
          <Heading level={2} size="xl">Platform Safety Monitor</Heading>
        </div>
        <Button onClick={loadViolations} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <div>
              <Text size="sm" color="secondary">Total Violations</Text>
              <Text weight="semibold" size="lg">{statistics.total_violations}</Text>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div>
              <Text size="sm" color="secondary">High Risk</Text>
              <Text weight="semibold" size="lg">{statistics.high_risk_count}</Text>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <div>
              <Text size="sm" color="secondary">Today</Text>
              <Text weight="semibold" size="lg">{statistics.violations_today}</Text>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
            <div>
              <Text size="sm" color="secondary">This Week</Text>
              <Text weight="semibold" size="lg">{statistics.violations_this_week}</Text>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <Text size="sm" color="secondary">Filters:</Text>
          </div>
          
          <select
            value={filters.risk_level}
            onChange={(e) => setFilters({...filters, risk_level: e.target.value})}
            className="px-3 py-1 bg-[#2A2A3A] border border-white/10 rounded text-sm"
          >
            <option value="">All Risk Levels</option>
            <option value="1">Low Risk (1)</option>
            <option value="2">Medium Risk (2+)</option>
            <option value="3">High Risk (3+)</option>
            <option value="4">Critical Risk (4+)</option>
          </select>
          
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters({...filters, start_date: e.target.value})}
            className="px-3 py-1 bg-[#2A2A3A] border border-white/10 rounded text-sm"
            placeholder="Start Date"
          />
          
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({...filters, end_date: e.target.value})}
            className="px-3 py-1 bg-[#2A2A3A] border border-white/10 rounded text-sm"
            placeholder="End Date"
          />
        </div>
      </Card>

      {/* Violations List */}
      <Card>
        <div className="p-4 border-b border-white/5">
          <Heading level={3} size="lg">Recent Violations</Heading>
        </div>
        
        <div className="p-4">
          {violations.length === 0 ? (
            <Text color="secondary" className="text-center py-8">
              No violations found
            </Text>
          ) : (
            <div className="space-y-4">
              {violations.map((violation) => (
                <div key={violation.id} className="space-y-3">
                  <div className={`p-4 rounded-lg border ${getRiskColor(violation.risk_score)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className={getRiskColor(violation.risk_score)}>
                            Risk: {violation.risk_score}
                          </Badge>
                          
                          {formatViolationTypes(violation.violations).map((type, index) => (
                            <Badge key={index} variant="outline" size="sm">
                              {type}
                            </Badge>
                          ))}
                          
                          <Text size="sm" color="secondary">
                            {new Date(violation.created_at).toLocaleString()}
                          </Text>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <Text color="secondary">Sender</Text>
                            <Text weight="medium">
                              {violation.sender?.full_name || 'Unknown'} ({violation.sender?.role})
                            </Text>
                          </div>
                          
                          <div>
                            <Text color="secondary">Campaign</Text>
                            <Text weight="medium">
                              {violation.conversation?.campaign?.title || 'N/A'}
                            </Text>
                          </div>
                          
                          <div>
                            <Text color="secondary">Status</Text>
                            <Badge variant="outline" className={
                              violation.admin_action === 'reviewed' ? 'text-green-400 border-green-400/30' :
                              violation.admin_action === 'dismissed' ? 'text-gray-400 border-gray-400/30' :
                              violation.admin_action === 'escalated' ? 'text-red-400 border-red-400/30' :
                              'text-yellow-400 border-yellow-400/30'
                            }>
                              {violation.admin_action || 'pending'}
                            </Badge>
                          </div>
                        </div>
                        
                        {violation.content_snippet && (
                          <div className="mt-3 p-2 bg-black/30 rounded text-sm font-mono">
                            {violation.content_snippet}
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => setExpandedViolation(
                          expandedViolation === violation.id ? null : violation.id
                        )}
                        className="ml-4 p-1 hover:bg-white/10 rounded"
                      >
                        {expandedViolation === violation.id ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                        }
                      </button>
                    </div>
                  </div>
                  
                  {/* Expanded Actions */}
                  {expandedViolation === violation.id && (
                    <div className="pl-4 space-y-3">
                      {!violation.admin_action && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const notes = prompt('Review notes (optional):')
                              if (notes !== null) {
                                handleViolationAction(violation.id, 'reviewed', notes)
                              }
                            }}
                            className="text-green-400 border-green-400/30 hover:bg-green-400/10"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Mark Reviewed
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const reason = prompt('Warning reason:')
                              if (reason) {
                                handleViolationAction(violation.id, 'user_warned', reason)
                              }
                            }}
                            className="text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10"
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Warn User
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const reason = prompt('Suspension reason:')
                              if (reason) {
                                handleViolationAction(violation.id, 'user_suspended', reason)
                              }
                            }}
                            className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Suspend User
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm('Are you sure you want to dismiss this violation?')) {
                                handleViolationAction(violation.id, 'dismissed', 'False positive')
                              }
                            }}
                            className="text-gray-400 border-gray-400/30 hover:bg-gray-400/10"
                          >
                            Dismiss
                          </Button>
                        </div>
                      )}
                      
                      {violation.admin_notes && (
                        <div className="p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                          <Text size="sm" weight="medium" className="text-blue-400 mb-1">
                            Admin Notes:
                          </Text>
                          <Text size="sm">{violation.admin_notes}</Text>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}