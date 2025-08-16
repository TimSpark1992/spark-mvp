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
import { getCampaigns } from '@/lib/supabase'
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
    '$10,000 - $25,000',
    '$25,000+'
  ]

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const { data, error } = await getCampaigns()
        if (data) {
          setCampaigns(data)
          setFilteredCampaigns(data)
        }
      } catch (error) {
        console.error('Error loading campaigns:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCampaigns()
  }, [])

  useEffect(() => {
    let filtered = campaigns

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(campaign => campaign.category === selectedCategory)
    }

    // Filter by budget range
    if (selectedBudget) {
      filtered = filtered.filter(campaign => campaign.budget_range === selectedBudget)
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="creator">
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-montserrat font-bold text-gray-900 mb-2">
              Available Campaigns
            </h1>
            <p className="text-gray-600">
              Discover and apply to campaigns that match your interests and expertise.
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

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

                <Button variant="outline" onClick={clearFilters}>
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

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
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {campaign.category}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">
                      {campaign.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {campaign.description}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Building className="w-4 h-4" />
                        <span>{campaign.profiles?.company_name || campaign.profiles?.full_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <DollarSign className="w-4 h-4" />
                        <span>{campaign.budget_range}</span>
                      </div>
                      
                      {campaign.deadline && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>Deadline: {new Date(campaign.deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {campaign.creator_requirements && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs font-medium text-gray-700 mb-1">Requirements:</p>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {campaign.creator_requirements}
                        </p>
                      </div>
                    )}

                    <Link href={`/creator/campaigns/${campaign.id}`}>
                      <Button className="w-full flex items-center justify-center gap-2">
                        View Details
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}