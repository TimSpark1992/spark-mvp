'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navigation from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getBrandCampaigns, getCampaignApplications } from '@/lib/supabase'
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
  XCircle
} from 'lucide-react'
import Link from 'next/link'

export default function BrandDashboard() {
  const { profile } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalApplications: 0,
    acceptedApplications: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        if (profile?.id) {
          // Load brand's campaigns
          const { data: campaignsData, error: campaignsError } = await getBrandCampaigns(profile.id)
          if (campaignsData) {
            setCampaigns(campaignsData)
            
            // Calculate stats
            let totalApplications = 0
            let acceptedApplications = 0
            
            for (const campaign of campaignsData) {
              const { data: applications } = await getCampaignApplications(campaign.id)
              if (applications) {
                totalApplications += applications.length
                acceptedApplications += applications.filter(app => app.status === 'accepted').length
              }
            }
            
            setStats({
              totalCampaigns: campaignsData.length,
              activeCampaigns: campaignsData.filter(c => c.status === 'active').length,
              totalApplications,
              acceptedApplications
            })
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="brand">
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-montserrat font-bold text-gray-900 mb-2">
                Welcome back, {profile?.company_name || profile?.full_name || 'Brand'}!
              </h1>
              <p className="text-gray-600">
                Manage your campaigns and connect with talented creators.
              </p>
            </div>
            <Link href="/brand/campaigns/create">
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Post Campaign
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
                  </div>
                  <Briefcase className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                    <p className="text-2xl font-bold text-green-600">{stats.activeCampaigns}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalApplications}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Creators Hired</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.acceptedApplications}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/brand/campaigns/create">
                <CardContent className="p-6 text-center">
                  <Plus className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Post New Campaign</h3>
                  <p className="text-gray-600 text-sm">Create a new campaign brief and start finding creators</p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/brand/campaigns">
                <CardContent className="p-6 text-center">
                  <Briefcase className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Manage Campaigns</h3>
                  <p className="text-gray-600 text-sm">View and manage all your active and past campaigns</p>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/brand/applications">
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Review Applications</h3>
                  <p className="text-gray-600 text-sm">Review creator applications and manage partnerships</p>
                </CardContent>
              </Link>
            </Card>
          </div>

          {/* Recent Campaigns */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Recent Campaigns
                </CardTitle>
                <Link href="/brand/campaigns">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="mb-2">No campaigns yet.</p>
                  <p className="text-sm mb-4">Create your first campaign to start connecting with creators!</p>
                  <Link href="/brand/campaigns/create">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Post Your First Campaign
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.slice(0, 5).map((campaign) => (
                    <div key={campaign.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{campaign.title}</h3>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {campaign.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {campaign.budget_range}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {campaign.deadline ? new Date(campaign.deadline).toLocaleDateString() : 'No deadline'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/brand/campaigns/${campaign.id}/applications`}>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              Applications
                            </Button>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}