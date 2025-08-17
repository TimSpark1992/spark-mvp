'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navigation from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  Building,
  Users,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export default function CreatorCampaignsPage() {
  const { profile } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [filteredCampaigns, setFilteredCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedBudget, setSelectedBudget] = useState('')

  const categories = [
    'Fashion & Beauty',
    'Technology',
    'Food & Beverage',
    'Travel & Lifestyle',
    'Health & Wellness',
    'Entertainment',
    'Education',
    'Sports & Fitness',
    'Home & Garden',
    'Business & Finance'
  ]

  const budgetRanges = [
    '$500 - $1,000',
    '$1,000 - $2,500',
    '$2,500 - $5,000',
    '$5,000 - $10,000',
    '$10,000+'
  ]

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        console.log('🔄 Loading campaigns via API...')
        
        // For now, show sample campaigns to test the UI
        const sampleCampaigns = [
          {
            id: '1',
            title: 'Fashion Photography Campaign',
            description: 'Looking for fashion influencers to showcase our new summer collection',
            category: 'Fashion & Beauty',
            budget_range: '$2,500 - $5,000',
            application_deadline: '2025-09-15',
            created_at: '2025-08-15',
            profiles: {
              company_name: 'Sample Fashion Brand',
            }
          },
          {
            id: '2', 
            title: 'Tech Review Campaign',
            description: 'Need tech reviewers for our latest smartphone release',
            category: 'Technology',
            budget_range: '$1,000 - $2,500',
            application_deadline: '2025-09-30',
            created_at: '2025-08-16',
            profiles: {
              company_name: 'TechCorp',
            }
          }
        ]
        
        console.log('✅ Sample campaigns loaded:', sampleCampaigns.length)
        setCampaigns(sampleCampaigns)
        setFilteredCampaigns(sampleCampaigns)
        
      } catch (error) {
        console.error('❌ Exception loading campaigns:', error)
        setCampaigns([])
        setFilteredCampaigns([])
      } finally {
        setLoading(false)
      }
    }

    loadCampaigns()
  }, [])

  useEffect(() => {
    let filtered = campaigns || []

    // Filter by search term (with null checks)
    if (searchTerm && searchTerm.trim()) {
      filtered = filtered.filter(campaign => {
        if (!campaign) return false
        const title = campaign.title || ''
        const description = campaign.description || ''
        const searchLower = searchTerm.toLowerCase()
        return title.toLowerCase().includes(searchLower) ||
               description.toLowerCase().includes(searchLower)
      })
    }

    // Filter by category (with null checks)
    if (selectedCategory) {
      filtered = filtered.filter(campaign => 
        campaign && campaign.category === selectedCategory
      )
    }

    // Filter by budget range (with null checks)
    if (selectedBudget) {
      filtered = filtered.filter(campaign => 
        campaign && campaign.budget_range === selectedBudget
      )
    }

    setFilteredCampaigns(filtered)
  }, [campaigns, searchTerm, selectedCategory, selectedBudget])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedBudget('')
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['creator']}>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading campaigns...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['creator']}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Campaigns</h1>
            <p className="text-gray-600">
              Discover exciting collaboration opportunities with brands
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Campaigns</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Budget Filter */}
              <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                <SelectTrigger>
                  <SelectValue placeholder="All Budgets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Budgets</SelectItem>
                  {budgetRanges.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {(searchTerm || selectedCategory || selectedBudget) && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Results Header */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600">
              Showing {filteredCampaigns.length} of {campaigns.length} campaigns
            </p>
            {(searchTerm || selectedCategory || selectedBudget) && (
              <Badge variant="secondary">
                Filters applied
              </Badge>
            )}
          </div>

          {/* Campaigns Grid */}
          {filteredCampaigns.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No campaigns found
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || selectedCategory || selectedBudget
                    ? 'Try adjusting your filters to see more campaigns.'
                    : 'There are no active campaigns at the moment. Check back later!'}
                </p>
                {(searchTerm || selectedCategory || selectedBudget) && (
                  <Button onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => {
                // Add comprehensive null checks
                if (!campaign || !campaign.id) return null
                
                return (
                  <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {campaign.category || 'Uncategorized'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {campaign.created_at 
                            ? new Date(campaign.created_at).toLocaleDateString()
                            : 'No date'
                          }
                        </span>
                      </div>
                      <CardTitle className="text-lg line-clamp-2">
                        {campaign.title || 'Untitled Campaign'}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {campaign.description || 'No description available'}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="w-4 h-4 mr-2" />
                          <span>{campaign.budget_range || 'Budget not specified'}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Building className="w-4 h-4 mr-2" />
                          <span>{campaign.profiles?.company_name || campaign.profiles?.full_name || 'Unknown Brand'}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>Apply by {campaign.application_deadline 
                            ? new Date(campaign.application_deadline).toLocaleDateString()
                            : 'No deadline'
                          }</span>
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <Link href={`/creator/campaigns/${campaign.id}`}>
                          <Button className="w-full">
                            View Details
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              }).filter(Boolean)}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}