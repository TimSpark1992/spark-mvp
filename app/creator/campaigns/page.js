'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/shared/Layout'
import { Container, Section } from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Heading, Text } from '@/components/ui/Typography'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { getCampaigns } from '@/lib/supabase'
import { 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  Building,
  Users,
  ArrowRight,
  Briefcase,
  Clock,
  MapPin
} from 'lucide-react'
import Link from 'next/link'

export default function CreatorCampaigns() {
  const { profile } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [filteredCampaigns, setFilteredCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedBudget, setSelectedBudget] = useState('all')
  const [dataLoaded, setDataLoaded] = useState(false) // Track if data has been loaded

  const categories = [
    'Fashion & Beauty', 'Technology', 'Food & Beverage', 'Travel & Lifestyle',
    'Health & Wellness', 'Entertainment', 'Education', 'Sports & Fitness',
    'Home & Garden', 'Business & Finance', 'Art & Design', 'Music',
    'Gaming', 'Parenting', 'DIY & Crafts', 'Photography'
  ]

  const budgetRanges = [
    '$500 - $1,000', '$1,000 - $2,500', '$2,500 - $5,000', 
    '$5,000 - $10,000', '$10,000+'
  ]

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates if component unmounts
    
    const loadCampaigns = async () => {
      // Don't start loading if already loading, data already loaded, or component unmounted
      if (!isMounted || dataLoaded) return;
      
      try {
        console.log('🔄 Loading campaigns from Supabase...')
        
        // Set shorter timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          if (isMounted && !dataLoaded) {
            console.log('⚠️ Campaign loading timeout, using fallback data')
            const sampleCampaigns = [
              {
                id: '1',
                title: 'Fashion Photography Campaign',  
                description: 'Looking for fashion influencers to showcase our new summer collection',
                category: 'Fashion & Beauty',
                budget_range: '$2,500 - $5,000',
                application_deadline: '2025-09-15',
                created_at: '2025-08-15',
                profiles: { company_name: 'Sample Fashion Brand' }
              },
              {
                id: '2',
                title: 'Tech Review Campaign',
                description: 'Need tech reviewers for our latest smartphone release', 
                category: 'Technology',
                budget_range: '$1,000 - $2,500',
                application_deadline: '2025-09-30',
                created_at: '2025-08-16',
                profiles: { company_name: 'TechCorp' }
              }
            ]
            setCampaigns(sampleCampaigns)
            setFilteredCampaigns(sampleCampaigns)
            setDataLoaded(true)
            setLoading(false)
          }
        }, 5000) // 5 second timeout (shorter)
        
        // Get real campaigns data from Supabase
        const { data: campaignsData, error } = await getCampaigns()
        
        // Clear timeout if request completes
        clearTimeout(timeoutId)
        
        // Only update state if component is still mounted
        if (!isMounted) return;
        
        if (error) {
          console.error('❌ Error loading campaigns:', error)
          // Fallback to sample data if Supabase fails
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
          console.log('⚠️ Using fallback sample data')
          setCampaigns(sampleCampaigns)
          setFilteredCampaigns(sampleCampaigns)
        } else {
          console.log('✅ Real campaigns loaded:', campaignsData?.length || 0)
          setCampaigns(campaignsData || [])
          setFilteredCampaigns(campaignsData || [])
        }
        
        // Mark data as loaded
        setDataLoaded(true)
        
      } catch (error) {
        console.error('❌ Exception loading campaigns:', error)
        // Only update state if component is still mounted
        if (isMounted) {
          setCampaigns([])
          setFilteredCampaigns([])
          setDataLoaded(true) // Mark as loaded even on error
        }
      } finally {
        // Only update loading state if component is still mounted
        if (isMounted) {
          console.log('🏁 Setting loading to false')
          setLoading(false)
        }
      }
    }

    loadCampaigns()
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false
    }
  }, [dataLoaded]) // Add dataLoaded to dependencies

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
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(campaign => 
        campaign && campaign.category === selectedCategory
      )
    }

    // Filter by budget range (with null checks)
    if (selectedBudget && selectedBudget !== 'all') {
      filtered = filtered.filter(campaign => 
        campaign && campaign.budget_range === selectedBudget
      )
    }

    setFilteredCampaigns(filtered)
  }, [campaigns, searchTerm, selectedCategory, selectedBudget])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedBudget('all')
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="creator">
        <Layout variant="app">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8A2BE2] mx-auto mb-4"></div>
              <Text size="lg" color="secondary">Loading campaigns...</Text>
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
                <Heading level={1} size="3xl" className="mb-2">Browse Campaigns</Heading>
                <Text size="lg" color="secondary">
                  Discover exciting collaboration opportunities with brands
                </Text>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <Text size="sm" color="secondary">Available Campaigns</Text>
                  <Heading level={3} size="2xl">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]">
                      {filteredCampaigns.length}
                    </span>
                  </Heading>
                </div>
              </div>
            </div>

            {/* Filters */}
            <Card className="p-6 mb-8">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 text-[#8A2BE2]" />
                <Heading level={3} size="lg">Filter Campaigns</Heading>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
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
                    <SelectItem value="all">All Categories</SelectItem>
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
                    <SelectItem value="all">All Budgets</SelectItem>
                    {budgetRanges.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="secondary" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </Card>

            {/* Results Summary */}
            <div className="flex items-center justify-between mb-6">
              <Text color="secondary">
                Showing {filteredCampaigns.length} of {campaigns.length} campaigns
              </Text>
              {(searchTerm || selectedCategory !== 'all' || selectedBudget !== 'all') && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  Filters applied
                </Badge>
              )}
            </div>

            {/* Campaigns Grid */}
            {filteredCampaigns.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#2A2A3A] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-gray-500" />
                  </div>
                  <Heading level={4} size="lg" className="mb-2">No campaigns found</Heading>
                  <Text size="sm" color="secondary" className="mb-6">
                    {campaigns.length === 0 
                      ? 'Check back later for new opportunities!'
                      : 'Try adjusting your filters to see more campaigns.'
                    }
                  </Text>
                  {(searchTerm || selectedCategory !== 'all' || selectedBudget !== 'all') && (
                    <Button variant="secondary" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <div className="grid gap-6">
                {filteredCampaigns.map((campaign) => {
                  // Add null checks to prevent crashes
                  if (!campaign || !campaign.id) return null
                  
                  return (
                    <Card key={campaign.id} className="p-6 hover:bg-[#2A2A3A]/50 transition-colors border border-white/5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Heading level={4} size="lg" className="mb-0">
                              {campaign.title || 'Untitled Campaign'}
                            </Heading>
                            <Badge variant="secondary">{campaign.category || 'Uncategorized'}</Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center space-x-1 text-sm text-gray-400">
                              <Building className="w-4 h-4" />
                              <span>{campaign.profiles?.company_name || 'Brand'}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-400">
                              <Calendar className="w-4 h-4" />
                              <span>Posted {campaign.created_at 
                                ? new Date(campaign.created_at).toLocaleDateString()
                                : 'Recently'
                              }</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Text size="sm" className="mb-4 line-clamp-2">
                        {campaign.description || 'No description available'}
                      </Text>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-green-400" />
                            <Text size="sm" weight="medium" className="text-green-400">
                              {campaign.budget_range || 'Budget not specified'}
                            </Text>
                          </div>
                          {campaign.application_deadline && (
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-yellow-400" />
                              <Text size="sm" className="text-yellow-400">
                                Apply by {new Date(campaign.application_deadline).toLocaleDateString()}
                              </Text>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Link href={`/creator/campaigns/${campaign.id}`}>
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </Link>
                          <Link href={`/creator/campaigns/${campaign.id}`}>
                            <Button size="sm">
                              <ArrowRight className="w-4 h-4 mr-2" />
                              Apply Now
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  )
                }).filter(Boolean)}
              </div>
            )}
          </Container>
        </Section>
      </Layout>
    </ProtectedRoute>
  )
}