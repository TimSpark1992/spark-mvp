'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/shared/Layout'
import { Container } from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Heading, Text } from '@/components/ui/Typography'
import { getBrandCampaigns, getCampaignApplications, deleteCampaign } from '@/lib/supabase'
import { 
  getCachedCampaigns, 
  updateCampaignsCache, 
  removeCampaignFromCache 
} from '@/lib/campaign-cache'
import { 
  Plus,
  Eye,
  Calendar,
  DollarSign,
  Users,
  Edit,
  Trash2,
  Search,
  Filter,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

export default function ManageCampaignsPage() {
  const { profile } = useAuth()
  const [campaigns, setCampaigns] = useState(() => {
    // Initialize from cache using utility function
    return getCachedCampaigns() || []
  })
  const [filteredCampaigns, setFilteredCampaigns] = useState([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dataFetched, setDataFetched] = useState(() => {
    // Check if we have cached data
    const cached = getCachedCampaigns()
    return cached ? cached.length > 0 : false
  }) // Track if data has been fetched
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState(null)

  // Delete campaign function - now uses modal instead of window.confirm
  const handleDeleteCampaign = async (campaignId, campaignTitle) => {
    // Store campaign info for modal and show it
    setCampaignToDelete({ id: campaignId, title: campaignTitle })
    setShowDeleteModal(true)
  }

  // Confirm deletion function (called from modal)
  const confirmDeleteCampaign = async () => {
    if (!campaignToDelete) return

    const { id: campaignId, title: campaignTitle } = campaignToDelete
    
    setDeleting(campaignId)
    setShowDeleteModal(false) // Close modal immediately
    
    try {
      console.log('🗑️ Deleting campaign:', campaignId)
      
      const { error } = await deleteCampaign(campaignId)
      
      if (error) {
        throw new Error(error.message || 'Failed to delete campaign')
      }
      
      console.log('✅ Campaign deleted successfully')
      
      // Remove from cache using utility function - this syncs across all pages
      const updatedCampaigns = removeCampaignFromCache(campaignId)
      
      if (updatedCampaigns !== null) {
        // Update local state to match cache
        setCampaigns(updatedCampaigns)
        setFilteredCampaigns(updatedCampaigns)
        console.log('🔄 Local state synchronized with cache after deletion')
      } else {
        // Fallback: remove from local state only
        const localUpdatedCampaigns = campaigns.filter(c => c.id !== campaignId)
        setCampaigns(localUpdatedCampaigns)
        setFilteredCampaigns(localUpdatedCampaigns)
        console.log('⚠️ Cache update failed, using local state fallback')
      }
      
    } catch (error) {
      console.error('❌ Error deleting campaign:', error)
      alert(`Failed to delete campaign: ${error.message}`)
    } finally {
      setDeleting(null)
      setCampaignToDelete(null)
    }
  }

  // Cancel deletion function
  const cancelDeleteCampaign = () => {
    setShowDeleteModal(false)
    setCampaignToDelete(null)
  }

  useEffect(() => {
    const loadCampaigns = async () => {
      // Prevent multiple simultaneous loads
      if (loading && dataFetched) {
        console.log('⚠️ Campaigns already being fetched, skipping duplicate request')
        return
      }

      // Don't reload if we already have campaigns and profile hasn't changed
      // Also check if cache is recent (less than 5 minutes old)
      const cacheTime = localStorage.getItem('brand_campaigns_cache_time')
      const cacheAge = cacheTime ? Date.now() - parseInt(cacheTime) : Infinity
      const cacheIsRecent = cacheAge < 5 * 60 * 1000 // 5 minutes
      
      if (campaigns.length > 0 && dataFetched && profile?.id && cacheIsRecent) {
        console.log('✅ Using cached campaign data from campaigns page, no reload needed (cache age:', Math.round(cacheAge / 1000), 'seconds)')
        setLoading(false)
        // Make sure filtered campaigns are set
        setFilteredCampaigns(campaigns)
        return
      }

      // If cache is old, mark as needing refresh
      if (!cacheIsRecent && campaigns.length > 0) {
        console.log('⏰ Cache is old (', Math.round(cacheAge / 1000), 'seconds), will refresh campaigns data')
      }

      try {
        console.log('🔄 Loading brand campaigns for profile:', profile?.id)
        
        if (!profile?.id) {
          console.log('❌ No profile ID available, keeping existing data')
          setLoading(false)
          return
        }
        
        const { data: campaignsData, error: campaignsError } = await getBrandCampaigns(profile.id)
        
        if (campaignsError) {
          console.error('❌ Error fetching campaigns:', campaignsError)
          // Don't clear existing campaigns on error, keep them
          if (campaigns.length === 0) {
            setCampaigns([])
            setFilteredCampaigns([])
          }
          setLoading(false)
          return
        }
        
        console.log('📊 Raw campaigns data:', campaignsData)
        
        if (campaignsData && campaignsData.length > 0) {
          console.log('✅ Campaigns found:', campaignsData.length)
          
          // Get application counts for each campaign
          const campaignsWithStats = await Promise.all(
            campaignsData.map(async (campaign) => {
              try {
                const { data: applications } = await getCampaignApplications(campaign.id)
                console.log(`📋 Applications for ${campaign.title}:`, applications?.length || 0)
                return {
                  ...campaign,
                  applicationCount: applications ? applications.length : 0
                }
              } catch (appError) {
                console.error('❌ Error fetching applications for campaign:', campaign.id, appError)
                return {
                  ...campaign,
                  applicationCount: 0
                }
              }
            })
          )
          
          console.log('✅ Final campaigns with stats:', campaignsWithStats)
          setCampaigns(campaignsWithStats)
          setFilteredCampaigns(campaignsWithStats)
          setDataFetched(true)
          
          // Update cache using utility function
          updateCampaignsCache(campaignsWithStats)
          console.log('💾 Campaigns cache updated from campaigns page')
        } else {
          console.log('⚠️ No campaigns found for user')
          // Only clear campaigns if this is the first load
          if (!dataFetched) {
            setCampaigns([])
            setFilteredCampaigns([])
          }
        }
      } catch (error) {
        console.error('❌ Error loading campaigns:', error)
        // Keep existing campaigns on error, don't clear them
        if (campaigns.length === 0) {
          setCampaigns([])
          setFilteredCampaigns([])
        }
      } finally {
        console.log('🏁 Setting loading to false')
        setLoading(false)
      }
    }

    console.log('🚀 Starting campaign load process, profile:', profile?.id)
    // Only load if we have profile or no data yet
    if (profile?.id || campaigns.length === 0) {
      loadCampaigns()
    } else {
      console.log('⏳ Waiting for profile to be available')
      setLoading(false)
    }
  }, [profile?.id])

  // Filter campaigns based on search and status
  useEffect(() => {
    let filtered = campaigns

    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(campaign => campaign.status === statusFilter)
    }

    setFilteredCampaigns(filtered)
  }, [campaigns, searchTerm, statusFilter])

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green'
      case 'paused': return 'yellow'
      case 'completed': return 'blue'
      case 'draft': return 'gray'
      case 'cancelled': return 'red'
      default: return 'gray'
    }
  }

  const getStatusStats = () => {
    return {
      all: campaigns.length,
      active: campaigns.filter(c => c.status === 'active').length,
      draft: campaigns.filter(c => c.status === 'draft').length,
      paused: campaigns.filter(c => c.status === 'paused').length,
      completed: campaigns.filter(c => c.status === 'completed').length
    }
  }

  const statusStats = getStatusStats()

  return (
    <ProtectedRoute requiredRole="brand">
      <Layout>
        <Container>
          <div className="py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Link href="/brand/dashboard">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
                <div>
                  <Heading level={1} size="3xl">Manage Campaigns</Heading>
                  <Text size="lg" color="secondary">View and manage all your campaigns</Text>
                </div>
              </div>
              
              <Link href="/brand/campaigns/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Campaign
                </Button>
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <Card className="p-4 text-center">
                <Text size="sm" color="secondary">Total</Text>
                <Heading level={3} size="2xl" className="text-blue-400">{statusStats.all}</Heading>
              </Card>
              <Card className="p-4 text-center">
                <Text size="sm" color="secondary">Active</Text>
                <Heading level={3} size="2xl" className="text-green-400">{statusStats.active}</Heading>
              </Card>
              <Card className="p-4 text-center">
                <Text size="sm" color="secondary">Draft</Text>
                <Heading level={3} size="2xl" className="text-gray-400">{statusStats.draft}</Heading>
              </Card>
              <Card className="p-4 text-center">
                <Text size="sm" color="secondary">Paused</Text>
                <Heading level={3} size="2xl" className="text-yellow-400">{statusStats.paused}</Heading>
              </Card>
              <Card className="p-4 text-center">
                <Text size="sm" color="secondary">Completed</Text>
                <Heading level={3} size="2xl" className="text-purple-400">{statusStats.completed}</Heading>
              </Card>
            </div>

            {/* Filters */}
            <Card className="p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search campaigns..."
                      className="w-full pl-10 pr-4 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    className="bg-[#2A2A3A] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Campaigns List */}
            {loading ? (
              <Card className="p-12 text-center">
                <Text>Loading campaigns...</Text>
              </Card>
            ) : filteredCampaigns.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 bg-[#2A2A3A] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-gray-500" />
                </div>
                <Heading level={3} size="lg" className="mb-2">
                  {campaigns.length === 0 ? 'No campaigns yet' : 'No campaigns found'}
                </Heading>
                <Text size="sm" className="mb-6">
                  {campaigns.length === 0 
                    ? 'Create your first campaign to start connecting with creators!'
                    : 'Try adjusting your search or filters'
                  }
                </Text>
                {campaigns.length === 0 && (
                  <Link href="/brand/campaigns/create">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Campaign
                    </Button>
                  </Link>
                )}
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredCampaigns.map((campaign) => (
                  <Card key={campaign.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Heading level={3} size="lg">{campaign.title}</Heading>
                          <Badge variant={getStatusColor(campaign.status)}>
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </Badge>
                        </div>
                        <Text size="sm" className="mb-3 line-clamp-2">
                          {campaign.description}
                        </Text>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center space-x-1 text-sm text-gray-400">
                            <DollarSign className="w-4 h-4" />
                            <span>{campaign.budget_range}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>{campaign.deadline ? new Date(campaign.deadline).toLocaleDateString() : 'No deadline'}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-400">
                            <Users className="w-4 h-4" />
                            <span>{campaign.applicationCount} applications</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Link href={`/brand/campaigns/${campaign.id}/applications`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Applications ({campaign.applicationCount})
                          </Button>
                        </Link>
                        <Link href={`/brand/campaigns/${campaign.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteCampaign(campaign.id, campaign.title)}
                          disabled={deleting === campaign.id}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {deleting === campaign.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Container>

        {/* Beautiful Delete Confirmation Modal */}
        {showDeleteModal && campaignToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#1A1A2E] rounded-xl shadow-2xl w-full max-w-md mx-4 border border-white/10 overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-red-500/20 to-pink-500/20 border-b border-red-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-white" />
                  </div>
                  <Heading level={3} size="lg" className="text-red-400">
                    Delete Campaign
                  </Heading>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="mb-6">
                  <Text className="text-gray-300 mb-3 leading-relaxed">
                    Are you sure you want to delete this campaign?
                  </Text>
                  
                  <div className="bg-[#2A2A3A] rounded-lg p-4 border border-white/10">
                    <Text weight="medium" className="text-white mb-1">
                      "{campaignToDelete.title}"
                    </Text>
                    <Text size="sm" color="secondary">
                      This action cannot be undone and will permanently remove all campaign data, applications, and analytics.
                    </Text>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={cancelDeleteCampaign}
                    className="flex-1 hover:bg-white/5"
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmDeleteCampaign}
                    disabled={deleting}
                    className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-medium transition-all duration-200 transform hover:scale-105"
                  >
                    {deleting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Deleting...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Delete Campaign
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  )
}