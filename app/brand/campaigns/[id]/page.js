'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/shared/Layout'
import { Container } from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Heading, Text } from '@/components/ui/Typography'
import ShareCampaignModal from '@/components/ShareCampaignModal'
import { getBrandCampaigns, getCampaignApplications } from '@/lib/supabase'
import { 
  ArrowLeft,
  Edit,
  Users,
  Calendar,
  DollarSign,
  Eye,
  Share2,
  Play,
  Pause,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Target,
  Settings
} from 'lucide-react'
import Link from 'next/link'

export default function ViewCampaignPage() {
  const { id: campaignId } = useParams()
  const { profile, loading: authLoading } = useAuth()
  const [campaign, setCampaign] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/creator/campaigns/${campaignId}` 
    : `https://sparkplatform.tech/creator/campaigns/${campaignId}`

  useEffect(() => {
    let mounted = true
    
    const loadCampaignData = async () => {
      // Only load if we have campaign ID, profile, and haven't loaded yet
      if (!campaignId || !profile?.id || authLoading || dataLoaded) {
        return
      }

      try {
        console.log('🔄 Loading brand campaign data for:', campaignId)
        setLoading(true)

        // Add timeout protection (systematic fix pattern)
        const loadTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Campaign loading timed out after 10 seconds')), 10000)
        )

        // Get campaigns with timeout protection
        const campaignsPromise = getBrandCampaigns(profile.id).then(result => {
          if (!mounted) return { data: [], error: null }
          
          if (result.error) {
            console.error('❌ Error fetching campaigns:', result.error)
            throw new Error(result.error.message || 'Failed to load campaigns')
          }
          
          const foundCampaign = result.data?.find(c => c.id === campaignId)
          
          if (foundCampaign) {
            setCampaign(foundCampaign)
            console.log('✅ Brand campaign loaded:', foundCampaign.title)
          } else {
            console.log('❌ Campaign not found')
            throw new Error('Campaign not found')
          }
          
          return result
        })

        // Load applications with timeout protection
        const applicationsPromise = getCampaignApplications(campaignId).then(result => {
          if (!mounted) return { data: [], error: null }
          
          if (result.error) {
            console.error('❌ Error fetching applications:', result.error)
            // Don't throw error for applications - campaign can exist without applications
          } else {
            setApplications(result.data || [])
            console.log('✅ Applications loaded:', result.data?.length || 0)
          }
          
          return result
        })

        // Wait for both with timeout protection
        await Promise.race([
          Promise.all([campaignsPromise, applicationsPromise]),
          loadTimeout
        ])

        if (mounted) {
          setDataLoaded(true)
          console.log('🎉 Brand campaign and applications loaded successfully')
        }

      } catch (error) {
        console.error('❌ Error loading campaign data:', error)
        if (mounted) {
          // Handle specific error cases
          if (error.message.includes('timed out')) {
            console.error('Campaign loading timed out')
          } else if (error.message.includes('not found')) {
            console.error('Campaign not found')
          }
          setDataLoaded(true) // Prevent retry loops
        }
      } finally {
        if (mounted) {
          setLoading(false)
          console.log('🔄 Brand campaign loading state cleared')
        }
      }
    }

    // Add safety timeout (systematic fix pattern)
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading && !dataLoaded) {
        console.warn('⚠️ Brand campaign safety timeout - forcing loading to false')
        setLoading(false)
      }
    }, 15000) // 15 second safety net

    loadCampaignData()

    return () => {
      mounted = false
      clearTimeout(safetyTimeout)
    }
  }, [profile?.id, campaignId, authLoading, dataLoaded])

  // Add additional loading protection
  useEffect(() => {
    if (profile && campaignId && loading && !authLoading) {
      const forceLoadTimeout = setTimeout(() => {
        console.warn('⚠️ Forcing brand campaign loading to false due to profile availability')
        setLoading(false)
      }, 8000)
      
      return () => clearTimeout(forceLoadTimeout)
    }
  }, [profile, campaignId, loading, authLoading])

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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-5 h-5" />
      case 'paused': return <Pause className="w-5 h-5" />
      case 'completed': return <CheckCircle className="w-5 h-5" />
      case 'draft': return <Clock className="w-5 h-5" />
      case 'cancelled': return <XCircle className="w-5 h-5" />
      default: return <Clock className="w-5 h-5" />
    }
  }

  const getApplicationStats = () => {
    const pending = applications.filter(app => app.status === 'pending').length
    const accepted = applications.filter(app => app.status === 'accepted').length
    const rejected = applications.filter(app => app.status === 'rejected').length
    
    return { pending, accepted, rejected, total: applications.length }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="brand">
        <Layout>
          <Container>
            <div className="py-8">
              <Card className="p-12 text-center">
                <Text>Loading campaign...</Text>
              </Card>
            </div>
          </Container>
        </Layout>
      </ProtectedRoute>
    )
  }

  if (!campaign) {
    return (
      <ProtectedRoute requiredRole="brand">
        <Layout>
          <Container>
            <div className="py-8">
              <Card className="p-12 text-center">
                <Heading level={3} size="lg" className="mb-4">Campaign Not Found</Heading>
                <Text className="mb-6">The campaign you're looking for doesn't exist or you don't have permission to view it.</Text>
                <Link href="/brand/dashboard">
                  <Button>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
              </Card>
            </div>
          </Container>
        </Layout>
      </ProtectedRoute>
    )
  }

  const stats = getApplicationStats()

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
                  <div className="flex items-center gap-3 mb-2">
                    <Heading level={1} size="3xl">{campaign.title}</Heading>
                    <Badge variant={getStatusColor(campaign.status)}>
                      {getStatusIcon(campaign.status)}
                      <span className="ml-1">{campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}</span>
                    </Badge>
                  </div>
                  <Text size="lg" color="secondary">Created on {new Date(campaign.created_at).toLocaleDateString()}</Text>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setShowShareModal(true)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Link href={`/brand/campaigns/${campaign.id}/edit`}>
                  <Button variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Link href={`/brand/campaigns/${campaign.id}/applications`}>
                  <Button>
                    <Eye className="w-4 h-4 mr-2" />
                    View Applications ({stats.total})
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Campaign Details */}
                <Card className="p-6">
                  <Heading level={2} size="xl" className="mb-4">Campaign Details</Heading>
                  
                  <div className="space-y-6">
                    <div>
                      <Text weight="medium" className="mb-2">Description</Text>
                      <Text className="whitespace-pre-wrap">
                        {campaign.description || 'No description provided.'}
                      </Text>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Text weight="medium" className="mb-2">Category</Text>
                        <Text>{campaign.category || 'Not specified'}</Text>
                      </div>
                      <div>
                        <Text weight="medium" className="mb-2">Budget Range</Text>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-green-400" />
                          <Text>{campaign.budget_range || 'Not specified'}</Text>
                        </div>
                      </div>
                    </div>

                    {campaign.creator_requirements && (
                      <div>
                        <Text weight="medium" className="mb-2">Creator Requirements</Text>
                        <div className="bg-[#2A2A3A]/50 rounded-lg p-4">
                          <Text className="whitespace-pre-wrap">{campaign.creator_requirements}</Text>
                        </div>
                      </div>
                    )}

                    <div>
                      <Text weight="medium" className="mb-2">Application Deadline</Text>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <Text>
                          {campaign.deadline 
                            ? new Date(campaign.deadline).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'No deadline set'
                          }
                        </Text>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Recent Applications */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Heading level={2} size="xl">Recent Applications</Heading>
                    <Link href={`/brand/campaigns/${campaign.id}/applications`}>
                      <Button variant="ghost" size="sm">
                        View All ({stats.total})
                      </Button>
                    </Link>
                  </div>
                  
                  {applications.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <Text>No applications yet</Text>
                      <Text size="sm" color="secondary">Applications will appear here when creators apply</Text>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {applications.slice(0, 5).map((application) => (
                        <div key={application.id} className="flex items-center justify-between p-3 bg-[#2A2A3A]/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full flex items-center justify-center">
                              <Text size="sm" weight="medium" className="text-white">
                                {(application.profiles?.full_name || 'C').charAt(0)}
                              </Text>
                            </div>
                            <div>
                              <Text size="sm" weight="medium">{application.profiles?.full_name || 'Anonymous'}</Text>
                              <Text size="xs" color="secondary">Applied {new Date(application.applied_at).toLocaleDateString()}</Text>
                            </div>
                          </div>
                          <Badge variant={getStatusColor(application.status)}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Campaign Actions */}
                <Card className="p-6">
                  <Heading level={3} size="lg" className="mb-4">Campaign Actions</Heading>
                  
                  <div className="space-y-3">
                    {/* Create Offer Button */}
                    <Link href={`/brand/campaigns/${campaign.id}/offers/create`}>
                      <Button className="w-full bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] hover:from-[#7A1BD2] to-[#E01483]">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Offer
                      </Button>
                    </Link>
                    
                    {/* View All Offers */}
                    <Link href={`/brand/campaigns/${campaign.id}/offers`}>
                      <Button variant="secondary" className="w-full">
                        <Target className="w-4 h-4 mr-2" />
                        View All Offers
                      </Button>
                    </Link>
                    
                    {/* Edit Campaign */}
                    <Link href={`/brand/campaigns/${campaign.id}/edit`}>
                      <Button variant="secondary" className="w-full">
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Campaign
                      </Button>
                    </Link>
                  </div>
                </Card>

                {/* Application Stats */}
                <Card className="p-6">
                  <Heading level={3} size="lg" className="mb-4">Application Statistics</Heading>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Text size="sm">Total Applications</Text>
                      <Text size="sm" weight="medium">{stats.total}</Text>
                    </div>
                    <div className="flex justify-between items-center">
                      <Text size="sm">Pending Review</Text>
                      <Text size="sm" weight="medium" className="text-yellow-400">{stats.pending}</Text>
                    </div>
                    <div className="flex justify-between items-center">
                      <Text size="sm">Accepted</Text>
                      <Text size="sm" weight="medium" className="text-green-400">{stats.accepted}</Text>
                    </div>
                    <div className="flex justify-between items-center">
                      <Text size="sm">Rejected</Text>
                      <Text size="sm" weight="medium" className="text-red-400">{stats.rejected}</Text>
                    </div>
                  </div>
                </Card>

                {/* Campaign Performance */}
                <Card className="p-6">
                  <Heading level={3} size="lg" className="mb-4">Campaign Performance</Heading>
                  
                  <div className="space-y-4">
                    <div>
                      <Text size="sm" color="secondary">Application Rate</Text>
                      <Text size="lg" weight="medium" className="text-blue-400">
                        {stats.total > 0 ? `${((stats.accepted / stats.total) * 100).toFixed(1)}%` : '0%'}
                      </Text>
                    </div>
                    <div>
                      <Text size="sm" color="secondary">Days Active</Text>
                      <Text size="lg" weight="medium" className="text-green-400">
                        {Math.ceil((new Date() - new Date(campaign.created_at)) / (1000 * 60 * 60 * 24))}
                      </Text>
                    </div>
                    <div>
                      <Text size="sm" color="secondary">Time Left</Text>
                      <Text size="lg" weight="medium" className="text-purple-400">
                        {campaign.deadline 
                          ? Math.max(0, Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24))) + ' days'
                          : 'No deadline'
                        }
                      </Text>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </Container>

        {/* Share Modal */}
        <ShareCampaignModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          campaign={campaign}
          shareUrl={shareUrl}
        />
      </Layout>
    </ProtectedRoute>
  )
}