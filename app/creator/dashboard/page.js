'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/shared/Layout'
import { Container, Section } from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import TooltipButton from '@/components/ui/TooltipButton'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Heading, Text } from '@/components/ui/Typography'
import OnboardingProgress from '@/components/onboarding/OnboardingProgress'
import { useOnboarding } from '@/components/onboarding/OnboardingProvider'
import { getCampaigns, getCreatorApplications } from '@/lib/supabase'
import { formatDate } from '@/lib/formatters'
import { 
  User, 
  Briefcase, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  FileText,
  Calendar,
  DollarSign,
  Star,
  Settings,
  HelpCircle,
  Upload,
  Search
} from 'lucide-react'
import Link from 'next/link'

function CreatorDashboardContent() {
  const { profile } = useAuth()
  const { triggerOnboarding } = useOnboarding()
  const [campaigns, setCampaigns] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: campaignsData, error: campaignsError } = await getCampaigns()
        if (campaignsData) {
          setCampaigns(campaignsData.slice(0, 6))
        }

        if (profile?.id) {
          const { data: applicationsData, error: applicationsError } = await getCreatorApplications(profile.id)
          if (applicationsData) {
            setApplications(applicationsData)
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [profile?.id])

  const profileCompletion = () => {
    let completed = 0
    const total = 6
    
    if (profile?.full_name) completed++
    if (profile?.bio) completed++
    if (profile?.profile_picture) completed++
    if (profile?.social_links && Object.keys(profile.social_links).length > 0) completed++
    if (profile?.category_tags && profile.category_tags.length > 0) completed++
    if (profile?.website_url) completed++
    
    return Math.round((completed / total) * 100)
  }

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8A2BE2]"></div>
      </div>
    )
  }

  return (
    <Section padding="lg">
      <Container>
        {/* Onboarding Progress Bar */}
        <OnboardingProgress />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Avatar name={profile?.full_name || 'Creator'} size="lg" />
            <div>
              <Heading level={1} size="3xl" className="mb-2">
                Welcome back, {profile?.full_name || 'Creator'}!
              </Heading>
              <Text size="lg" className="mb-0">
                Ready to find your next campaign opportunity? Let's get started.
              </Text>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TooltipButton
              variant="ghost"
              size="sm"
              tooltipContent="Access your account settings and preferences"
              showTooltipCondition={!profile?.onboarding_completed}
            >
              <Settings className="w-5 h-5 mr-2" />
              Settings
            </TooltipButton>
            
            {!profile?.onboarding_completed && (
              <Button variant="secondary" size="sm" onClick={triggerOnboarding}>
                <HelpCircle className="w-4 h-4 mr-2" />
                Show Tutorial
              </Button>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 hover:bg-[#2A2A3A]/50 transition-colors">
            <Link href="/creator/campaigns" className="block">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-xl flex items-center justify-center">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <Heading level={3} size="lg">Browse Campaigns</Heading>
                  <Text size="sm" color="secondary">Find new opportunities</Text>
                </div>
              </div>
            </Link>
          </Card>
          
          <Card className="p-6 hover:bg-[#2A2A3A]/50 transition-colors">
            <Link href="/creator/rate-cards" className="block">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-[#10B981] to-[#059669] rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <Heading level={3} size="lg">Manage Rate Cards</Heading>
                  <Text size="sm" color="secondary">Set your pricing</Text>
                </div>
              </div>
            </Link>
          </Card>

          <Card className="p-6 hover:bg-[#2A2A3A]/50 transition-colors">
            <Link href="/creator/applications" className="block">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-[#F59E0B] to-[#D97706] rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <Heading level={3} size="lg">My Applications</Heading>
                  <Text size="sm" color="secondary">Track your submissions</Text>
                </div>
              </div>
            </Link>
          </Card>
          
          <Card className="p-6 hover:bg-[#2A2A3A]/50 transition-colors">
            <Link href="/creator/offers" className="block">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-[#EC4899] to-[#BE185D] rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <Heading level={3} size="lg">My Offers</Heading>
                  <Text size="sm" color="secondary">Manage brand offers</Text>
                </div>
              </div>
            </Link>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Text size="sm" weight="medium" color="secondary">Total Applications</Text>
                <Heading level={3} size="2xl" className="mt-1">{applications.length}</Heading>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Text size="sm" weight="medium" color="secondary">Accepted</Text>
                <Heading level={3} size="2xl" className="mt-1 text-green-400">
                  {applications.filter(app => app.status === 'accepted').length}
                </Heading>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Text size="sm" weight="medium" color="secondary">Pending</Text>
                <Heading level={3} size="2xl" className="mt-1 text-yellow-400">
                  {applications.filter(app => app.status === 'pending').length}
                </Heading>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Text size="sm" weight="medium" color="secondary">Profile Complete</Text>
                <Heading level={3} size="2xl" className="mt-1">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]">
                    {profileCompletion()}%
                  </span>
                </Heading>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Setup */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <User className="w-5 h-5 text-[#8A2BE2]" />
              <Heading level={3} size="lg">Profile Setup</Heading>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Text size="sm" weight="medium">Profile Completion</Text>
                  <Text size="sm" color="secondary">{profileCompletion()}%</Text>
                </div>
                <div className="w-full bg-[#2A2A3A] rounded-full h-3">
                  <div 
                    className="h-3 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full transition-all"
                    style={{ width: `${profileCompletion()}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Basic Info', completed: !!profile?.full_name },
                  { label: 'Bio', completed: !!profile?.bio },
                  { label: 'Profile Picture', completed: !!profile?.profile_picture },
                  { label: 'Social Links', completed: profile?.social_links && Object.keys(profile.social_links).length > 0 },
                  { label: 'Categories', completed: profile?.category_tags && profile.category_tags.length > 0 }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <Text size="sm">{item.label}</Text>
                    {item.completed ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                ))}
              </div>

              <Link href="/creator/profile">
                <TooltipButton 
                  variant="secondary" 
                  className="w-full"
                  tooltipContent="Complete your profile to attract more brand opportunities"
                  showTooltipCondition={!profile?.onboarding_completed && profileCompletion() < 80}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Complete Profile
                </TooltipButton>
              </Link>
            </div>
          </Card>

          {/* Campaign Feed */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-[#8A2BE2]" />
                <Heading level={3} size="lg">Available Campaigns</Heading>
              </div>
              <Link href="/creator/campaigns">
                <TooltipButton 
                  variant="ghost" 
                  size="sm"
                  tooltipContent="Browse all available campaigns and apply to the ones that match your style"
                  showTooltipCondition={!profile?.onboarding_completed && applications.length === 0}
                >
                  View All
                </TooltipButton>
              </Link>
            </div>

            {campaigns.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#2A2A3A] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-gray-500" />
                </div>
                <Heading level={4} size="lg" className="mb-2">No campaigns available</Heading>
                <Text size="sm">Check back later for new opportunities!</Text>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => {
                  // Add null checks to prevent crashes
                  if (!campaign || !campaign.id) return null
                  
                  return (
                    <div key={campaign.id} className="bg-[#2A2A3A]/50 rounded-xl p-4 hover:bg-[#2A2A3A] transition-colors border border-white/5">
                      <div className="flex justify-between items-start mb-3">
                        <Heading level={4} size="lg" className="mb-0">{campaign.title || 'Untitled Campaign'}</Heading>
                        <Badge variant="secondary">{campaign.category || 'Uncategorized'}</Badge>
                      </div>
                      <Text size="sm" className="mb-4 line-clamp-2">
                        {campaign.description || 'No description available'}
                      </Text>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center space-x-1 text-sm text-gray-400">
                            <DollarSign className="w-4 h-4" />
                            <span>{campaign.budget_range || 'Budget not specified'}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>{campaign.application_deadline 
                              ? formatDate(campaign.application_deadline)
                              : 'No deadline'
                            }</span>
                          </div>
                        </div>
                        <Link href={`/creator/campaigns/${campaign.id}`}>
                          <Button size="sm">Apply</Button>
                        </Link>
                      </div>
                    </div>
                  )
                }).filter(Boolean)}
              </div>
            )}
          </Card>
        </div>

        {/* Applications Tracker */}
        {applications.length > 0 && (
          <Card className="mt-8 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="w-5 h-5 text-[#8A2BE2]" />
              <Heading level={3} size="lg">Recent Applications</Heading>
            </div>

            <div className="space-y-4">
              {applications.slice(0, 5).map((application) => (
                <div key={application.id} className="flex items-center justify-between p-4 bg-[#2A2A3A]/50 rounded-xl border border-white/5">
                  <div className="flex-1">
                    <Heading level={4} size="base" className="mb-1">
                      {application.campaigns?.title}
                    </Heading>
                    <Text size="sm" color="secondary">
                      Applied {formatDate(application.applied_at)}
                    </Text>
                  </div>
                  <Badge variant={getStatusColor(application.status)} className="flex items-center gap-1">
                    {getStatusIcon(application.status)}
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
            
            {applications.length > 5 && (
              <div className="text-center mt-6">
                <Link href="/creator/applications">
                  <Button variant="secondary">
                    View All Applications
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        )}
      </Container>
    </Section>
  )
}

export default function CreatorDashboard() {
  return (
    <ProtectedRoute requiredRole="creator">
      <Layout variant="app">
        <CreatorDashboardContent />
      </Layout>
    </ProtectedRoute>
  )
}