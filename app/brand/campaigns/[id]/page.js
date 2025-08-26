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
      try {
        setLoading(true)
        
        // Check if we're authenticated and have user data
        if (authLoading || !profile) {
          console.log('Still loading auth or no profile:', { authLoading, profile })
          return
        }

        console.log('Loading campaign data for ID:', campaignId)
        
        // Start loading with timeout protection
        const loadingTimeout = setTimeout(() => {
          if (mounted) {
            console.error('Data loading timeout - forcing load completion')
            setLoading(false)
            setDataLoaded(true)
          }
        }, 8000) // Reduced from 15s to 8s for faster loading

        const safetyTimeout = setTimeout(() => {
          if (mounted && !dataLoaded) {
            console.error('Safety timeout reached - forcing completion')
            setLoading(false)
            setDataLoaded(true)
          }
        }, 10000) // Reduced from 20s to 10s for faster loading

        try {
          // Load specific campaign directly
          const campaignResponse = await fetch(`/api/campaigns/${campaignId}`)
          let foundCampaign = null
          
          if (campaignResponse.ok) {
            const campaignResult = await campaignResponse.json()
            foundCampaign = campaignResult.campaign
          } else {
            console.warn('Direct campaign API failed, falling back to getBrandCampaigns')
            // Fallback to searching through all campaigns
            const campaignData = await getBrandCampaigns()
            foundCampaign = campaignData?.find(c => c.id === campaignId)
          }

          // Load applications
          const applicationsData = await getCampaignApplications(campaignId).catch(err => {
            console.warn('Failed to load applications:', err)
            return [] // Fallback to empty array
          })

          if (!mounted) return
          
          if (foundCampaign) {
            setCampaign(foundCampaign)
            console.log('Campaign found:', foundCampaign.title)
          } else {
            console.error('Campaign not found with ID:', campaignId)
          }

          setApplications(applicationsData || [])
          setDataLoaded(true)
          
          // Clear timeouts
          clearTimeout(loadingTimeout)
          clearTimeout(safetyTimeout)
          
        } catch (error) {
          console.error('Error loading campaign data:', error)
          if (mounted) {
            setDataLoaded(true)
          }
        }
      } catch (error) {
        console.error('Error in loadCampaignData:', error)
        if (mounted) {
          setDataLoaded(true)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadCampaignData()

    return () => {
      mounted = false
    }
  }, [campaignId, authLoading, profile])

  const handleShare = () => {
    setShowShareModal(true)
  }

  const handleCloseShareModal = () => {
    setShowShareModal(false)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        console.log('Link copied to clipboard')
        // You could add a toast notification here
      })
      .catch(err => {
        console.error('Failed to copy link:', err)
      })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4 text-green-500" />
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'draft':
        return <Clock className="w-4 h-4 text-gray-500" />
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      draft: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || colors.draft
  }

  // Calculate statistics
  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length
  }

  if (authLoading || loading) {
    return (
      <ProtectedRoute requiredRole="brand">
        <Layout>
          <Container className="py-8">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <Text>Loading campaign details...</Text>
              </div>
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
          <Container className="py-8">
            <div className="text-center py-12">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <Heading level={2} size="xl" className="mb-2">Campaign Not Found</Heading>
              <Text color="secondary" className="mb-6">
                The campaign you're looking for doesn't exist or you don't have permission to view it.
              </Text>
              <Link href="/brand/campaigns">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Campaigns
                </Button>
              </Link>
            </div>
          </Container>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="brand">
      <Layout>
        <Container className="py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Link href="/brand/campaigns">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Campaigns
                  </Button>
                </Link>
                <div>
                  <Heading level={1} size="2xl" className="mb-2">
                    {campaign.title}
                  </Heading>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusBadge(campaign.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(campaign.status)}
                        {campaign.status?.charAt(0).toUpperCase() + campaign.status?.slice(1)}
                      </span>
                    </Badge>
                    <Text color="secondary" size="sm">
                      Campaign ID: {campaign.id}
                    </Text>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="secondary" 
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share Campaign
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Campaign Overview */}
                <Card className="p-6">
                  <Heading level={2} size="lg" className="mb-6">Campaign Overview</Heading>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Text size="sm" color="secondary" className="mb-1">Category</Text>
                        <Text weight="medium">{campaign.category || 'General'}</Text>
                      </div>
                      
                      <div>
                        <Text size="sm" color="secondary" className="mb-1">Budget Range</Text>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <Text weight="medium">{campaign.budget_range || 'Not specified'}</Text>
                        </div>
                      </div>
                      
                      <div>
                        <Text size="sm" color="secondary" className="mb-1">Timeline</Text>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <Text weight="medium">
                            {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'Not set'} - 
                            {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'Not set'}
                          </Text>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Text size="sm" color="secondary" className="mb-1">Target Audience</Text>
                        <Text weight="medium">{campaign.target_audience || 'General'}</Text>
                      </div>
                      
                      <div>
                        <Text size="sm" color="secondary" className="mb-1">Created</Text>
                        <Text weight="medium">
                          {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : 'Unknown'}
                        </Text>
                      </div>
                      
                      <div>
                        <Text size="sm" color="secondary" className="mb-1">Applications</Text>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-500" />
                          <Text weight="medium">{stats.total} received</Text>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Campaign Description */}
                {campaign.description && (
                  <Card className="p-6">
                    <Heading level={3} size="lg" className="mb-4">Description</Heading>
                    <div className="prose prose-gray max-w-none">
                      <Text className="whitespace-pre-wrap leading-relaxed">
                        {campaign.description}
                      </Text>
                    </div>
                  </Card>
                )}

                {/* Creator Requirements */}
                {campaign.creator_requirements && (
                  <Card className="p-6">
                    <Heading level={3} size="lg" className="mb-4">Creator Requirements</Heading>
                    <div className="prose prose-gray max-w-none">
                      <Text className="whitespace-pre-wrap leading-relaxed">
                        {campaign.creator_requirements}
                      </Text>
                    </div>
                  </Card>
                )}

                {/* Recent Applications */}
                {applications.length > 0 && (
                  <Card className="p-6">
                    <Heading level={3} size="lg" className="mb-4">Recent Applications</Heading>
                    <div className="space-y-4">
                      {applications.slice(0, 5).map((application) => (
                        <div key={application.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <Text weight="medium">{application.creator?.full_name || 'Unknown Creator'}</Text>
                              <Text size="sm" color="secondary">
                                Applied {application.created_at ? new Date(application.created_at).toLocaleDateString() : 'Recently'}
                              </Text>
                            </div>
                          </div>
                          <Badge className={
                            application.status === 'approved' ? 'bg-green-100 text-green-800' :
                            application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {application.status?.charAt(0).toUpperCase() + application.status?.slice(1) || 'Pending'}
                          </Badge>
                        </div>
                      ))}
                      
                      {applications.length > 5 && (
                        <div className="text-center pt-4">
                          <Link href={`/brand/campaigns/${campaign.id}/applications`}>
                            <Button variant="secondary" size="sm">
                              View All {applications.length} Applications
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Campaign Actions */}
                <Card className="p-6">
                  <Heading level={3} size="lg" className="mb-6">Campaign Actions</Heading>
                  
                  <div className="space-y-4">
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
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {stats.pending}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Text size="sm">Approved</Text>
                      <Badge className="bg-green-100 text-green-800">
                        {stats.approved}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Text size="sm">Rejected</Text>
                      <Badge className="bg-red-100 text-red-800">
                        {stats.rejected}
                      </Badge>
                    </div>
                  </div>
                  
                  {stats.total > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <Link href={`/brand/applications`}>
                        <Button variant="secondary" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          Manage Applications
                        </Button>
                      </Link>
                    </div>
                  )}
                </Card>

                {/* Quick Stats */}
                <Card className="p-6">
                  <Heading level={3} size="lg" className="mb-4">Campaign Performance</Heading>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Text size="sm" color="secondary">Views</Text>
                      <Text size="sm" weight="medium">
                        {campaign.views || 0}
                      </Text>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Text size="sm" color="secondary">Conversion Rate</Text>
                      <Text size="sm" weight="medium">
                        {campaign.views > 0 
                          ? Math.round((stats.total / campaign.views) * 100) 
                          : 0}%
                      </Text>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Text size="sm" color="secondary">Status</Text>
                      <Badge className={getStatusBadge(campaign.status)}>
                        {campaign.status?.charAt(0).toUpperCase() + campaign.status?.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </Container>

        {/* Share Modal */}
        {showShareModal && (
          <ShareCampaignModal
            campaignTitle={campaign.title}
            shareUrl={shareUrl}
            onClose={handleCloseShareModal}
            onCopyLink={handleCopyLink}
          />
        )}
      </Layout>
    </ProtectedRoute>
  )
}