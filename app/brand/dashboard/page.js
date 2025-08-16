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
import { getBrandCampaigns, getCampaignApplications, getApplications } from '@/lib/supabase'
import { 
  getCachedCampaigns, 
  getCachedStats,
  updateCampaignsCache, 
  updateStatsCache 
} from '@/lib/campaign-cache'
import { 
  Briefcase, 
  Users, 
  TrendingUp,
  Plus,
  Eye,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Settings,
  BarChart3,
  HelpCircle
} from 'lucide-react'
import Link from 'next/link'

function BrandDashboardContent() {
  const { profile } = useAuth()
  const { triggerOnboarding } = useOnboarding()
  const [campaigns, setCampaigns] = useState(() => {
    // Initialize from cache using utility function
    return getCachedCampaigns() || []
  })
  const [stats, setStats] = useState(() => {
    // Initialize stats from cache using utility function
    return getCachedStats() || {
      totalCampaigns: 0,
      activeCampaigns: 0,
      totalApplications: 0,
      acceptedApplications: 0
    }
  })
  const [loading, setLoading] = useState(false)
  const [dataFetched, setDataFetched] = useState(() => {
    // Check if we have cached data
    const cached = getCachedCampaigns()
    return cached ? cached.length > 0 : false
  }) // Track if data has been fetched

  useEffect(() => {
    const loadData = async () => {
      // Prevent multiple simultaneous loads
      if (loading && dataFetched) {
        console.log('⚠️ Data already being fetched, skipping duplicate request')
        return
      }

      // Don't reload if we already have campaigns and profile hasn't changed
      // Also check if cache is recent (less than 5 minutes old)
      const cacheTime = localStorage.getItem('brand_campaigns_cache_time')
      const cacheAge = cacheTime ? Date.now() - parseInt(cacheTime) : Infinity
      const cacheIsRecent = cacheAge < 5 * 60 * 1000 // 5 minutes
      
      if (campaigns.length > 0 && dataFetched && profile?.id && cacheIsRecent) {
        console.log('✅ Using cached campaign data, no reload needed (cache age:', Math.round(cacheAge / 1000), 'seconds)')
        setLoading(false)
        return
      }

      // If cache is old, mark as needing refresh
      if (!cacheIsRecent && campaigns.length > 0) {
        console.log('⏰ Cache is old (', Math.round(cacheAge / 1000), 'seconds), will refresh data')
      }

      setLoading(true)

      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('⚠️ Dashboard loading timeout reached, forcing loading to complete')
        setLoading(false)
      }, 15000) // 15 second timeout

      try {
        console.log('🔄 Loading brand dashboard data, profile:', profile?.id, 'role:', profile?.role)
        
        if (profile?.id) {
          console.log('✅ Profile found, fetching campaigns...')
          const { data: campaignsData, error: campaignsError } = await getBrandCampaigns(profile.id)
          
          if (campaignsError) {
            console.error('❌ Error fetching campaigns:', campaignsError)
            // Don't clear existing campaigns on error, keep them
            if (campaigns.length === 0) {
              setStats({
                totalCampaigns: 0,
                activeCampaigns: 0,
                totalApplications: 0,
                acceptedApplications: 0
              })
            }
          } else if (campaignsData) {
            console.log('✅ Campaigns fetched:', campaignsData.length)
            setCampaigns(campaignsData)
            setDataFetched(true)
            
            // Update cache using utility function
            updateCampaignsCache(campaignsData)
            console.log('💾 Campaigns cache updated from dashboard')
            
            let totalApplications = 0
            let acceptedApplications = 0
            
            for (const campaign of campaignsData) {
              try {
                const { data: applications } = await getCampaignApplications(campaign.id)
                if (applications) {
                  totalApplications += applications.length
                  acceptedApplications += applications.filter(app => app.status === 'accepted').length
                }
              } catch (appError) {
                console.error('❌ Error fetching applications for campaign:', campaign.id, appError)
                // Continue with other campaigns even if one fails
              }
            }
            
            const newStats = {
              totalCampaigns: campaignsData.length,
              activeCampaigns: campaignsData.filter(c => c.status === 'active').length,
              totalApplications,
              acceptedApplications
            }
            
            setStats(newStats)
            
            // Update stats cache using utility function
            updateStatsCache(newStats)
            console.log('💾 Stats cache updated from dashboard')
            
            console.log('✅ Stats calculated and cached:', newStats)
          } else {
            console.log('⚠️ No campaigns data received, but no error')
            // Only set empty stats if we don't have existing data
            if (campaigns.length === 0) {
              setStats({
                totalCampaigns: 0,
                activeCampaigns: 0,
                totalApplications: 0,
                acceptedApplications: 0
              })
            }
          }
        } else {
          console.log('⚠️ No profile available yet, keeping existing data if any')
          // Don't clear existing data when profile is temporarily unavailable
          if (campaigns.length === 0) {
            setStats({
              totalCampaigns: 0,
              activeCampaigns: 0,
              totalApplications: 0,
              acceptedApplications: 0
            })
          }
        }
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error)
        // Keep existing data on error, don't clear it
        if (campaigns.length === 0) {
          setStats({
            totalCampaigns: 0,
            activeCampaigns: 0,
            totalApplications: 0,
            acceptedApplications: 0
          })
        }
      } finally {
        clearTimeout(timeoutId) // Clear timeout if loading completes normally
        setLoading(false)
        console.log('✅ Brand dashboard loading complete')
      }
    }

    // Only load data if we have a profile or if we don't have any data yet
    if (profile?.id || campaigns.length === 0) {
      loadData()
    }
  }, [profile?.id]) // Keep profile.id dependency but add protection logic

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success'
      case 'paused': return 'warning'
      case 'completed': return 'primary'
      case 'cancelled': return 'danger'
      default: return 'secondary'
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
        <OnboardingProgress stats={stats} />

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center space-x-4">
            <Avatar name={profile?.company_name || profile?.full_name || 'Brand'} size="lg" />
            <div>
              <Heading level={1} size="3xl" className="mb-2">
                Welcome back, {profile?.company_name || profile?.full_name || 'Brand'}!
              </Heading>
              <Text size="lg" className="mb-0">
                Manage your campaigns and connect with talented creators.
              </Text>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/brand/profile">
              <TooltipButton
                variant="ghost"
                size="sm"
                tooltipContent="Access your account settings and preferences"
                showTooltipCondition={!profile?.onboarding_completed}
              >
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </TooltipButton>
            </Link>
            
            {!profile?.onboarding_completed && (
              <Button variant="secondary" size="sm" onClick={triggerOnboarding}>
                <HelpCircle className="w-4 h-4 mr-2" />
                Show Tutorial
              </Button>
            )}
            
            <Link href="/brand/campaigns/create">
              <TooltipButton
                tooltipContent="Create your first campaign to start connecting with creators"
                showTooltipCondition={!profile?.onboarding_completed && stats.totalCampaigns === 0}
              >
                <Plus className="w-5 h-5 mr-2" />
                Post Campaign
              </TooltipButton>
            </Link>
          </div>
        </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Text size="sm" weight="medium" color="secondary">Total Campaigns</Text>
                    <Heading level={3} size="2xl" className="mt-1">{stats.totalCampaigns}</Heading>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-xl flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Text size="sm" weight="medium" color="secondary">Active Campaigns</Text>
                    <Heading level={3} size="2xl" className="mt-1 text-green-400">{stats.activeCampaigns}</Heading>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Text size="sm" weight="medium" color="secondary">Total Applications</Text>
                    <Heading level={3} size="2xl" className="mt-1 text-blue-400">{stats.totalApplications}</Heading>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Text size="sm" weight="medium" color="secondary">Creators Hired</Text>
                    <Heading level={3} size="2xl" className="mt-1">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]">
                        {stats.acceptedApplications}
                      </span>
                    </Heading>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Link href="/brand/campaigns/create">
                <Card className="p-8 text-center hover:bg-[#2A2A3A]/50 transition-all hover:scale-105 cursor-pointer">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <Heading level={4} size="lg" className="mb-2">Post New Campaign</Heading>
                  <Text size="sm">Create a new campaign brief and start finding creators</Text>
                </Card>
              </Link>

              <Link href="/brand/campaigns">
                <Card className="p-8 text-center hover:bg-[#2A2A3A]/50 transition-all hover:scale-105 cursor-pointer">
                  <div className="w-16 h-16 bg-[#2A2A3A] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-[#8A2BE2]" />
                  </div>
                  <Heading level={4} size="lg" className="mb-2">Manage Campaigns</Heading>
                  <Text size="sm">View and manage all your active and past campaigns</Text>
                </Card>
              </Link>

              <Link href="/brand/applications">
                <Card className="p-8 text-center hover:bg-[#2A2A3A]/50 transition-all hover:scale-105 cursor-pointer">
                  <div className="w-16 h-16 bg-[#2A2A3A] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-[#8A2BE2]" />
                  </div>
                  <Heading level={4} size="lg" className="mb-2">Review Applications</Heading>
                  <Text size="sm">Review creator applications and manage partnerships</Text>
                </Card>
              </Link>
            </div>

            {/* Recent Campaigns */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-5 h-5 text-[#8A2BE2]" />
                  <Heading level={3} size="lg">Recent Campaigns</Heading>
                </div>
                <Link href="/brand/campaigns">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>

              {campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[#2A2A3A] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-gray-500" />
                  </div>
                  <Heading level={4} size="lg" className="mb-2">No campaigns yet</Heading>
                  <Text size="sm" className="mb-6">Create your first campaign to start connecting with creators!</Text>
                  <Link href="/brand/campaigns/create">
                    <TooltipButton
                      tooltipContent="Click here to create your first campaign and start finding creators"
                      showTooltipCondition={!profile?.onboarding_completed}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Post Your First Campaign
                    </TooltipButton>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.slice(0, 5).map((campaign) => (
                    <div key={campaign.id} className="bg-[#2A2A3A]/50 rounded-xl p-4 hover:bg-[#2A2A3A] transition-colors border border-white/5">
                      <div className="flex justify-between items-start mb-3">
                        <Heading level={4} size="lg" className="mb-0">{campaign.title}</Heading>
                        <Badge variant={getStatusColor(campaign.status)}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </Badge>
                      </div>
                      <Text size="sm" className="mb-4 line-clamp-2">
                        {campaign.description}
                      </Text>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center space-x-1 text-sm text-gray-400">
                            <DollarSign className="w-4 h-4" />
                            <span>{campaign.budget_range}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>{campaign.deadline ? new Date(campaign.deadline).toLocaleDateString() : 'No deadline'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/brand/campaigns/${campaign.id}/applications`}>
                            <TooltipButton 
                              variant="ghost" 
                              size="sm"
                              tooltipContent="Review and manage applications for this campaign"
                              showTooltipCondition={!profile?.onboarding_completed}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Applications
                            </TooltipButton>
                          </Link>
                          <Link href={`/brand/campaigns/${campaign.id}/offers`}>
                            <TooltipButton 
                              variant="ghost" 
                              size="sm"
                              tooltipContent="Create and manage offers for this campaign"
                              showTooltipCondition={!profile?.onboarding_completed}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Offers
                            </TooltipButton>
                          </Link>
                          <Link href={`/brand/campaigns/${campaign.id}`}>
                            <Button size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Container>
        </Section>
  )
}

export default function BrandDashboard() {
  return (
    <ProtectedRoute requiredRole="brand">
      <Layout variant="app">
        <BrandDashboardContent />
      </Layout>
    </ProtectedRoute>
  )
}