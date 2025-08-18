'use client'

import { useState, useEffect } from 'react'
import { Container } from '@/components/shared/Container'
import Layout from '@/components/shared/Layout'
import { Heading, Text } from '@/components/ui/Typography'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Users,
  Search,
  Filter,
  MoreHorizontal,
  UserCheck,
  UserX,
  AlertTriangle,
  Shield,
  Mail,
  Calendar,
  Activity,
  Eye,
  Ban,
  MessageSquare,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/formatters'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: '',
    warning_level: ''
  })
  const [selectedUsers, setSelectedUsers] = useState([])
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [filters])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      // Mock data - in real implementation, this would call /api/admin/users
      const mockUsers = [
        {
          id: '1',
          full_name: 'John Smith',
          email: 'john@example.com',
          role: 'creator',
          created_at: '2025-01-01T00:00:00Z',
          last_seen_at: '2025-08-11T08:00:00Z',
          warning_count: 0,
          is_suspended: false,
          total_campaigns: 5,
          total_earnings: 250000,
          completion_rate: 95,
          violation_count: 0
        },
        {
          id: '2',
          full_name: 'Brand Corp',
          email: 'contact@brandcorp.com',
          role: 'brand',
          created_at: '2025-02-15T00:00:00Z',
          last_seen_at: '2025-08-11T06:30:00Z',
          warning_count: 1,
          is_suspended: false,
          total_campaigns: 12,
          total_spent: 500000,
          active_campaigns: 3,
          violation_count: 1
        },
        {
          id: '3',
          full_name: 'Jane Doe',
          email: 'jane@example.com',
          role: 'creator',
          created_at: '2025-03-20T00:00:00Z',
          last_seen_at: '2025-08-10T14:20:00Z',
          warning_count: 2,
          is_suspended: false,
          total_campaigns: 8,
          total_earnings: 180000,
          completion_rate: 88,
          violation_count: 2
        },
        {
          id: '4',
          full_name: 'Bad Actor LLC',
          email: 'bad@actor.com',
          role: 'brand',
          created_at: '2025-07-01T00:00:00Z',
          last_seen_at: '2025-08-08T10:15:00Z',
          warning_count: 3,
          is_suspended: true,
          suspended_at: '2025-08-08T10:30:00Z',
          suspension_reason: 'Multiple platform policy violations',
          total_campaigns: 2,
          total_spent: 50000,
          violation_count: 5
        }
      ]

      // Apply filters
      let filteredUsers = mockUsers
      if (filters.role) {
        filteredUsers = filteredUsers.filter(u => u.role === filters.role)
      }
      if (filters.status === 'suspended') {
        filteredUsers = filteredUsers.filter(u => u.is_suspended)
      } else if (filters.status === 'active') {
        filteredUsers = filteredUsers.filter(u => !u.is_suspended)
      }
      if (filters.warning_level) {
        const minWarnings = parseInt(filters.warning_level)
        filteredUsers = filteredUsers.filter(u => u.warning_count >= minWarnings)
      }
      if (filters.search) {
        const search = filters.search.toLowerCase()
        filteredUsers = filteredUsers.filter(u => 
          u.full_name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)
        )
      }

      setUsers(filteredUsers)
    } catch (error) {
      console.error('❌ Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (userId, action, reason = '') => {
    try {
      setActionLoading(true)
      
      // Mock API call - in real implementation, this would call /api/admin/users/[id]/actions
      console.log(`Admin action: ${action} on user ${userId}`, { reason })
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Reload users
      await loadUsers()
      
    } catch (error) {
      console.error(`❌ Error ${action} user:`, error)
      alert(`Error: ${error.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) return
    
    const reason = prompt(`Reason for ${action} (required):`)
    if (!reason) return
    
    try {
      setActionLoading(true)
      
      for (const userId of selectedUsers) {
        await handleUserAction(userId, action, reason)
      }
      
      setSelectedUsers([])
    } catch (error) {
      console.error(`❌ Error with bulk ${action}:`, error)
    }
  }

  const getUserStatusColor = (user) => {
    if (user.is_suspended) return 'text-red-400 border-red-400/30'
    if (user.warning_count >= 3) return 'text-orange-400 border-orange-400/30'
    if (user.warning_count >= 1) return 'text-yellow-400 border-yellow-400/30'
    return 'text-green-400 border-green-400/30'
  }

  const getUserStatusText = (user) => {
    if (user.is_suspended) return 'Suspended'
    if (user.warning_count >= 3) return 'High Risk'
    if (user.warning_count >= 1) return 'Warned'
    return 'Good Standing'
  }

  const getLastSeenText = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  return (
    <Layout>
      <Container className="py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Heading level={1} size="2xl" className="mb-2">
              User Management
            </Heading>
            <Text color="secondary">
              Monitor and manage all platform users
            </Text>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={loadUsers} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Export Users
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg text-sm w-64"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filters.role}
                onChange={(e) => setFilters({...filters, role: e.target.value})}
                className="px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg text-sm"
              >
                <option value="">All Roles</option>
                <option value="creator">Creators</option>
                <option value="brand">Brands</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            
            <select
              value={filters.warning_level}
              onChange={(e) => setFilters({...filters, warning_level: e.target.value})}
              className="px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg text-sm"
            >
              <option value="">All Warning Levels</option>
              <option value="1">1+ Warnings</option>
              <option value="2">2+ Warnings</option>
              <option value="3">3+ Warnings</option>
            </select>
          </div>
          
          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
              <Text size="sm" color="secondary">
                {selectedUsers.length} user(s) selected
              </Text>
              
              <Button
                size="sm"
                onClick={() => handleBulkAction('warn')}
                disabled={actionLoading}
                className="text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Warn Selected
              </Button>
              
              <Button
                size="sm"
                onClick={() => handleBulkAction('suspend')}
                disabled={actionLoading}
                className="text-red-400 border-red-400/30 hover:bg-red-400/10"
              >
                <Ban className="w-4 h-4 mr-2" />
                Suspend Selected
              </Button>
            </div>
          )}
        </Card>

        {/* Users List */}
        <Card>
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <Heading level={3} size="lg">
                Users ({users.length})
              </Heading>
              
              <div className="flex items-center gap-2">
                <Text size="sm" color="secondary">Sort by:</Text>
                <select className="px-2 py-1 bg-[#2A2A3A] border border-white/10 rounded text-sm">
                  <option>Recent Activity</option>
                  <option>Join Date</option>
                  <option>Warning Count</option>
                  <option>Total Earnings</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mx-auto mb-4" />
                <Text>Loading users...</Text>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <Text color="secondary">No users found</Text>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center gap-4 p-4 bg-[#1A1A2A] rounded-lg">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id])
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded"
                    />
                    
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                        {user.role === 'creator' ? 
                          <UserCheck className="w-5 h-5 text-blue-400" /> :
                          <Shield className="w-5 h-5 text-purple-400" />
                        }
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <Text weight="semibold">{user.full_name}</Text>
                          <Badge variant="outline" className={getUserStatusColor(user)}>
                            {getUserStatusText(user)}
                          </Badge>
                          <Badge variant="outline">
                            {user.role}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Joined {formatDate(user.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Last seen {getLastSeenText(user.last_seen_at)}
                          </span>
                        </div>
                      </div>
                      
                      {/* User Stats */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <Text size="sm" weight="semibold">
                            {user.role === 'creator' ? user.total_campaigns : user.total_campaigns}
                          </Text>
                          <Text size="xs" color="secondary">Campaigns</Text>
                        </div>
                        
                        <div>
                          <Text size="sm" weight="semibold" className={
                            user.role === 'creator' ? 'text-green-400' : 'text-blue-400'
                          }>
                            {user.role === 'creator' 
                              ? formatPrice(user.total_earnings)
                              : formatPrice(user.total_spent)
                            }
                          </Text>
                          <Text size="xs" color="secondary">
                            {user.role === 'creator' ? 'Earned' : 'Spent'}
                          </Text>
                        </div>
                        
                        <div>
                          <Text size="sm" weight="semibold" className={
                            user.violation_count > 0 ? 'text-red-400' : 'text-green-400'
                          }>
                            {user.violation_count}
                          </Text>
                          <Text size="xs" color="secondary">Violations</Text>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = `/admin/users/${user.id}`}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        
                        {!user.is_suspended ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const reason = prompt('Warning reason:')
                                if (reason) {
                                  handleUserAction(user.id, 'warn', reason)
                                }
                              }}
                              disabled={actionLoading}
                              className="text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const reason = prompt('Suspension reason:')
                                if (reason) {
                                  handleUserAction(user.id, 'suspend', reason)
                                }
                              }}
                              disabled={actionLoading}
                              className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm('Are you sure you want to unsuspend this user?')) {
                                handleUserAction(user.id, 'unsuspend')
                              }
                            }}
                            disabled={actionLoading}
                            className="text-green-400 border-green-400/30 hover:bg-green-400/10"
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Unsuspend
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </Container>
    </Layout>
  )
}