'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/shared/Layout'
import { Container } from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Heading, Text } from '@/components/ui/Typography'
import { getBrandCampaigns, getCampaignApplications, updateApplicationStatus } from '@/lib/supabase'
import { 
  ArrowLeft,
  Search,
  Filter,
  Check,
  X,
  MessageCircle,
  User,
  Calendar,
  Mail,
  ExternalLink,
  Eye
} from 'lucide-react'
import Link from 'next/link'

export default function ReviewApplicationsPage() {
  const { profile } = useAuth()
  const [applications, setApplications] = useState([])
  const [filteredApplications, setFilteredApplications] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [campaignFilter, setCampaignFilter] = useState('all')

  useEffect(() => {
    const loadApplications = async () => {
      try {
        console.log('🔄 Loading applications for brand:', profile?.id)
        
        if (profile?.id) {
          // First get all brand campaigns
          const { data: campaignsData, error: campaignsError } = await getBrandCampaigns(profile.id)
          
          if (campaignsError) {
            console.error('❌ Error fetching campaigns:', campaignsError)
            return
          }
          
          if (campaignsData && campaignsData.length > 0) {
            setCampaigns(campaignsData)
            
            // Get applications for all campaigns
            const allApplications = []
            
            for (const campaign of campaignsData) {
              const { data: campaignApplications, error } = await getCampaignApplications(campaign.id)
              if (campaignApplications) {
                const applicationsWithCampaign = campaignApplications.map(app => ({
                  ...app,
                  campaign: campaign
                }))
                allApplications.push(...applicationsWithCampaign)
              }
            }
            
            console.log('✅ Total applications loaded:', allApplications.length)
            setApplications(allApplications)
            setFilteredApplications(allApplications)
          } else {
            console.log('⚠️ No campaigns found')
            setCampaigns([])
            setApplications([])
            setFilteredApplications([])
          }
        }
      } catch (error) {
        console.error('❌ Error loading applications:', error)
      } finally {
        setLoading(false)
      }
    }

    if (profile?.id) {
      loadApplications()
    }
  }, [profile?.id])

  // Filter applications
  useEffect(() => {
    let filtered = applications

    if (searchTerm) {
      filtered = filtered.filter(app =>
        app.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.campaign?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.note?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    if (campaignFilter !== 'all') {
      filtered = filtered.filter(app => app.campaign_id === campaignFilter)
    }

    setFilteredApplications(filtered)
  }, [applications, searchTerm, statusFilter, campaignFilter])

  const handleApplicationAction = async (applicationId, newStatus) => {
    try {
      console.log('🔄 Updating application status:', applicationId, newStatus)
      
      const { error } = await updateApplicationStatus(applicationId, newStatus)
      
      if (error) {
        console.error('❌ Error updating application:', error)
        return
      }
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: newStatus }
            : app
        )
      )
      
      console.log('✅ Application status updated to:', newStatus)
    } catch (error) {
      console.error('❌ Error updating application status:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'yellow'
      case 'accepted': return 'green'
      case 'rejected': return 'red'
      default: return 'gray'
    }
  }

  const getStatusStats = () => {
    return {
      all: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      rejected: applications.filter(app => app.status === 'rejected').length
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
                  <Heading level={1} size="3xl">Review Applications</Heading>
                  <Text size="lg" color="secondary">Manage creator applications for your campaigns</Text>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-4 text-center">
                <Text size="sm" color="secondary">Total</Text>
                <Heading level={3} size="2xl" className="text-blue-400">{statusStats.all}</Heading>
              </Card>
              <Card className="p-4 text-center">
                <Text size="sm" color="secondary">Pending</Text>
                <Heading level={3} size="2xl" className="text-yellow-400">{statusStats.pending}</Heading>
              </Card>
              <Card className="p-4 text-center">
                <Text size="sm" color="secondary">Accepted</Text>
                <Heading level={3} size="2xl" className="text-green-400">{statusStats.accepted}</Heading>
              </Card>
              <Card className="p-4 text-center">
                <Text size="sm" color="secondary">Rejected</Text>
                <Heading level={3} size="2xl" className="text-red-400">{statusStats.rejected}</Heading>
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
                      placeholder="Search applications..."
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
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  
                  <select
                    className="bg-[#2A2A3A] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]"
                    value={campaignFilter}
                    onChange={(e) => setCampaignFilter(e.target.value)}
                  >
                    <option value="all">All Campaigns</option>
                    {campaigns.map(campaign => (
                      <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Applications List */}
            {loading ? (
              <Card className="p-12 text-center">
                <Text>Loading applications...</Text>
              </Card>
            ) : filteredApplications.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 bg-[#2A2A3A] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-gray-500" />
                </div>
                <Heading level={3} size="lg" className="mb-2">
                  {applications.length === 0 ? 'No applications yet' : 'No applications found'}
                </Heading>
                <Text size="sm" className="mb-6">
                  {applications.length === 0 
                    ? 'Applications will appear here when creators apply to your campaigns'
                    : 'Try adjusting your search or filters'
                  }
                </Text>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <Card key={application.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-4">
                        <Avatar 
                          src={application.profiles?.profile_picture} 
                          alt={application.profiles?.full_name || 'Creator'}
                          size="lg"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Heading level={3} size="lg">{application.profiles?.full_name || 'Anonymous Creator'}</Heading>
                            <Badge variant={getStatusColor(application.status)}>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </Badge>
                          </div>
                          <Text size="sm" className="mb-2">
                            Applied for: <Link href={`/brand/campaigns/${application.campaign_id}/applications`} className="text-[#8A2BE2] hover:underline">{application.campaign?.title}</Link>
                          </Text>
                          <Text size="sm" color="secondary" className="mb-3">
                            Applied on {new Date(application.applied_at).toLocaleDateString()}
                          </Text>
                          {application.note && (
                            <div className="bg-[#2A2A3A]/50 rounded-lg p-3 mb-3">
                              <Text size="sm">{application.note}</Text>
                            </div>
                          )}
                          <div className="flex items-center gap-4">
                            {application.profiles?.website_url && (
                              <a 
                                href={application.profiles.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-blue-400 hover:underline"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Website
                              </a>
                            )}
                            {application.profiles?.media_kit_url && (
                              <a 
                                href={application.profiles.media_kit_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-blue-400 hover:underline"
                              >
                                <Eye className="w-4 h-4" />
                                Media Kit
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {application.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                              onClick={() => handleApplicationAction(application.id, 'accepted')}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                              onClick={() => handleApplicationAction(application.id, 'rejected')}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Container>
      </Layout>
    </ProtectedRoute>
  )
}