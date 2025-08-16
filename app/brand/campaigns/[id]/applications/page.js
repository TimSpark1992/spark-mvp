'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/shared/Layout'
import { Container, Section } from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Heading, Text } from '@/components/ui/Typography'
import { getBrandCampaigns, getCampaignApplications, updateApplicationStatus } from '@/lib/supabase'
import { 
  ArrowLeft,
  User,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Globe,
  FileText
} from 'lucide-react'
import Link from 'next/link'

export default function CampaignApplicationsPage() {
  const params = useParams()
  const { profile } = useAuth()
  const [campaign, setCampaign] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const loadCampaignAndApplications = async () => {
      try {
        if (!profile?.id) return

        // Get brand's campaigns to verify ownership
        const { data: campaignsData, error: campaignError } = await getBrandCampaigns(profile.id)
        if (campaignError) throw new Error(campaignError.message)

        const foundCampaign = campaignsData.find(c => c.id === params.id)
        if (!foundCampaign) {
          throw new Error('Campaign not found or you do not have permission to view it')
        }
        setCampaign(foundCampaign)

        // Get applications for this campaign
        const { data: applicationsData, error: appError } = await getCampaignApplications(params.id)
        if (appError) throw new Error(appError.message)

        setApplications(applicationsData || [])
      } catch (error) {
        console.error('Error loading applications:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCampaignAndApplications()
  }, [params.id, profile?.id])

  const handleStatusUpdate = async (applicationId, newStatus) => {
    setActionLoading(prev => ({ ...prev, [applicationId]: true }))
    
    try {
      const { error } = await updateApplicationStatus(applicationId, newStatus)
      if (error) throw new Error(error.message)

      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: newStatus }
            : app
        )
      )
    } catch (error) {
      console.error('Error updating application status:', error)
      // You could add error toast here
    } finally {
      setActionLoading(prev => ({ ...prev, [applicationId]: false }))
    }
  }

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true
    return app.status === filter
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'success'
      case 'rejected': return 'danger'
      default: return 'warning'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <Layout variant="app">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8A2BE2]"></div>
        </div>
      </Layout>
    )
  }

  return (
    <ProtectedRoute requiredRole="brand">
      <Layout variant="app">
        <Section padding="lg">
          <Container>
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
                  <Heading level={1} size="3xl">Campaign Applications</Heading>
                  <Text size="lg" color="secondary">
                    {campaign?.title}
                  </Text>
                </div>
              </div>
              
              <div className="text-right">
                <Text size="sm" color="secondary">Total Applications</Text>
                <Heading level={3} size="2xl">{applications.length}</Heading>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="p-6 text-center">
                <Heading level={3} size="2xl" className="mb-2">{applications.length}</Heading>
                <Text size="sm" color="secondary">Total Applications</Text>
              </Card>
              
              <Card className="p-6 text-center">
                <Heading level={3} size="2xl" className="mb-2 text-yellow-400">
                  {applications.filter(app => app.status === 'pending').length}
                </Heading>
                <Text size="sm" color="secondary">Pending Review</Text>
              </Card>
              
              <Card className="p-6 text-center">
                <Heading level={3} size="2xl" className="mb-2 text-green-400">
                  {applications.filter(app => app.status === 'accepted').length}
                </Heading>
                <Text size="sm" color="secondary">Accepted</Text>
              </Card>
              
              <Card className="p-6 text-center">
                <Heading level={3} size="2xl" className="mb-2 text-red-400">
                  {applications.filter(app => app.status === 'rejected').length}
                </Heading>
                <Text size="sm" color="secondary">Rejected</Text>
              </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6">
              <Text weight="medium" className="mr-4">Filter by status:</Text>
              {[
                { key: 'all', label: 'All', count: applications.length },
                { key: 'pending', label: 'Pending', count: applications.filter(app => app.status === 'pending').length },
                { key: 'accepted', label: 'Accepted', count: applications.filter(app => app.status === 'accepted').length },
                { key: 'rejected', label: 'Rejected', count: applications.filter(app => app.status === 'rejected').length }
              ].map((tab) => (
                <Button
                  key={tab.key}
                  variant={filter === tab.key ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(tab.key)}
                >
                  {tab.label} ({tab.count})
                </Button>
              ))}
            </div>

            {/* Applications List */}
            {filteredApplications.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <Heading level={3} size="xl" className="mb-2">
                    No applications {filter !== 'all' ? `with status "${filter}"` : 'yet'}
                  </Heading>
                  <Text color="secondary">
                    {filter !== 'all' 
                      ? 'Try changing the filter to see other applications.'
                      : 'Applications will appear here when creators apply to your campaign.'
                    }
                  </Text>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredApplications.map((application) => (
                  <Card key={application.id} className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-4">
                        <Avatar 
                          name={application.profiles?.full_name} 
                          src={application.profiles?.profile_picture}
                          size="lg"
                        />
                        <div>
                          <Heading level={4} size="lg" className="mb-1">
                            {application.profiles?.full_name}
                          </Heading>
                          <Text size="sm" color="secondary" className="mb-2">
                            Applied {new Date(application.applied_at).toLocaleDateString()}
                          </Text>
                          <Badge variant={getStatusColor(application.status)} className="flex items-center gap-1 w-fit">
                            {getStatusIcon(application.status)}
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </Badge>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {application.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusUpdate(application.id, 'rejected')}
                            disabled={actionLoading[application.id]}
                            className="text-red-400 border-red-400 hover:bg-red-400"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(application.id, 'accepted')}
                            disabled={actionLoading[application.id]}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      {/* Application Message */}
                      <div className="md:col-span-2 space-y-4">
                        <div>
                          <Text weight="semibold" className="mb-2">Application Message</Text>
                          <div className="bg-[#2A2A3A]/50 rounded-lg p-4">
                            <Text className="whitespace-pre-wrap leading-relaxed">
                              {application.message}
                            </Text>
                          </div>
                        </div>

                        {/* Creator Bio */}
                        {application.profiles?.bio && (
                          <div>
                            <Text weight="semibold" className="mb-2">Creator Bio</Text>
                            <Text size="sm" color="secondary" className="leading-relaxed">
                              {application.profiles.bio}
                            </Text>
                          </div>
                        )}
                      </div>

                      {/* Creator Info & Links */}
                      <div className="space-y-4">
                        <div>
                          <Text weight="semibold" className="mb-3">Creator Links</Text>
                          <div className="space-y-2">
                            {application.portfolio_url && (
                              <a 
                                href={application.portfolio_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[#8A2BE2] hover:text-[#FF1493] transition-colors text-sm"
                              >
                                <Globe className="w-4 h-4" />
                                Portfolio
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            
                            {application.media_kit_url && (
                              <a 
                                href={application.media_kit_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[#8A2BE2] hover:text-[#FF1493] transition-colors text-sm"
                              >
                                <FileText className="w-4 h-4" />
                                Media Kit
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            
                            {/* Social Links */}
                            {application.profiles?.social_links && Object.keys(application.profiles.social_links).map((platform) => (
                              <a 
                                key={platform}
                                href={application.profiles.social_links[platform]} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[#8A2BE2] hover:text-[#FF1493] transition-colors text-sm capitalize"
                              >
                                <Globe className="w-4 h-4" />
                                {platform}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ))}
                          </div>
                        </div>

                        {/* Category Tags */}
                        {application.profiles?.category_tags && application.profiles.category_tags.length > 0 && (
                          <div>
                            <Text weight="semibold" className="mb-2">Categories</Text>
                            <div className="flex flex-wrap gap-1">
                              {application.profiles.category_tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Contact */}
                        {application.status === 'accepted' && (
                          <div className="pt-4 border-t border-white/10">
                            <Link 
                              href={`/messages?brand=${profile.id}&creator=${application.creator_id}&campaign=${params.id}`}
                            >
                              <Button size="sm" variant="ghost" className="w-full">
                                <Mail className="w-4 h-4 mr-2" />
                                Message Creator
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Container>
        </Section>
      </Layout>
    </ProtectedRoute>
  )
}