'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/shared/Layout'
import { Container, Section } from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Heading, Text } from '@/components/ui/Typography'
import { getCreatorApplications } from '@/lib/supabase'
import { 
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  DollarSign,
  Building,
  MessageCircle
} from 'lucide-react'
import Link from 'next/link'

export default function CreatorApplicationsPage() {
  const { profile } = useAuth()
  const [applications, setApplications] = useState([])
  const [filteredApplications, setFilteredApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    let isMounted = true;
    
    const loadApplications = async () => {
      if (!profile?.id || !isMounted || dataLoaded) return

      try {
        console.log('🔄 Loading creator applications...')
        
        // Set timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          if (isMounted && !dataLoaded) {
            console.log('⚠️ Applications loading timeout')
            setApplications([])
            setFilteredApplications([])
            setDataLoaded(true)
            setLoading(false)
          }
        }, 5000)
        
        const { data, error } = await getCreatorApplications(profile.id)
        
        clearTimeout(timeoutId)
        
        if (!isMounted) return
        
        if (error) throw new Error(error.message)
        
        console.log('✅ Applications loaded:', data?.length || 0)
        setApplications(data || [])
        setFilteredApplications(data || [])
        setDataLoaded(true)
        
      } catch (error) {
        console.error('❌ Error loading applications:', error)
        if (isMounted) {
          setApplications([])
          setFilteredApplications([])
          setDataLoaded(true)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadApplications()
    
    return () => {
      isMounted = false
    }
  }, [profile?.id, dataLoaded])

  useEffect(() => {
    if (filter === 'all') {
      setFilteredApplications(applications)
    } else {
      setFilteredApplications(applications.filter(app => app.status === filter))
    }
  }, [applications, filter])

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

  const getStatusText = (status) => {
    switch (status) {
      case 'accepted': return 'Accepted'
      case 'rejected': return 'Rejected'
      default: return 'Under Review'
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="creator">
        <Layout variant="app">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8A2BE2] mx-auto mb-4"></div>
              <Text size="lg" color="secondary">Loading applications...</Text>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="creator">
      <Layout variant="app">
        <Section padding="lg">
          <Container>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <Heading level={1} size="3xl">My Applications</Heading>
                <Text size="lg" color="secondary">
                  Track all your campaign applications and their status
                </Text>
              </div>
              
              <div className="text-right">
                <Text size="sm" color="secondary">Total Applications</Text>
                <Heading level={3} size="2xl">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]">
                    {applications.length}
                  </span>
                </Heading>
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
                <Text size="sm" color="secondary">Under Review</Text>
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
                { key: 'pending', label: 'Under Review', count: applications.filter(app => app.status === 'pending').length },
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
                  <div className="w-16 h-16 bg-[#2A2A3A] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-500" />
                  </div>
                  <Heading level={3} size="xl" className="mb-2">
                    No applications {filter !== 'all' ? `with status "${filter}"` : 'yet'}
                  </Heading>
                  <Text color="secondary" className="mb-6">
                    {filter !== 'all'
                      ? 'Try changing the filter to see other applications.'
                      : 'Start applying to campaigns to see your applications here.'
                    }
                  </Text>
                  {filter === 'all' && (
                    <Link href="/creator/campaigns">
                      <Button>
                        Browse Campaigns
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredApplications.map((application) => (
                  <Card key={application.id} className="p-6 hover:bg-[#2A2A3A]/50 transition-colors border border-white/5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <Heading level={4} size="lg" className="mb-2">
                              {application.campaigns?.title}
                            </Heading>
                            <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                              <div className="flex items-center gap-1">
                                <Building className="w-4 h-4" />
                                <span>{application.campaigns?.profiles?.company_name || application.campaigns?.profiles?.full_name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Applied {new Date(application.applied_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant={getStatusColor(application.status)} className="flex items-center gap-1">
                            {getStatusIcon(application.status)}
                            {getStatusText(application.status)}
                          </Badge>
                        </div>

                        <Text size="sm" className="mb-4 p-4 bg-[#2A2A3A]/50 rounded-lg">
                          {application.message}
                        </Text>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            {application.portfolio_url && (
                              <a 
                                href={application.portfolio_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#8A2BE2] hover:text-[#FF1493] transition-colors"
                              >
                                Portfolio ↗
                              </a>
                            )}
                            {application.media_kit_url && (
                              <a 
                                href={application.media_kit_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#8A2BE2] hover:text-[#FF1493] transition-colors"
                              >
                                Media Kit ↗
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {application.status === 'accepted' && (
                              <Button size="sm" variant="ghost">
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Message Brand
                              </Button>
                            )}
                            <Link href={`/creator/campaigns/${application.campaign_id}`}>
                              <Button size="sm" variant="ghost">
                                View Campaign
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status-specific messages */}
                    {application.status === 'accepted' && (
                      <div className="mt-4 p-4 bg-green-500/20 border border-green-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                          <div>
                            <Text size="sm" weight="semibold" className="text-green-400 mb-1">
                              Congratulations! Your application was accepted.
                            </Text>
                            <Text size="sm" color="secondary">
                              The brand is interested in working with you. Start the conversation to discuss next steps.
                            </Text>
                          </div>
                        </div>
                      </div>
                    )}

                    {application.status === 'rejected' && (
                      <div className="mt-4 p-4 bg-red-500/20 border border-red-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
                          <div>
                            <Text size="sm" weight="semibold" className="text-red-400 mb-1">
                              Application was not selected
                            </Text>
                            <Text size="sm" color="secondary">
                              Don't get discouraged! Keep applying to find the perfect brand match for your content.
                            </Text>
                          </div>
                        </div>
                      </div>
                    )}
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