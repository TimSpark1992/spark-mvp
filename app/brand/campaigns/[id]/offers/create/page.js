'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/shared/Layout'
import { Container } from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Heading, Text } from '@/components/ui/Typography'
import { ArrowLeft, Users, Target, DollarSign, AlertCircle } from 'lucide-react'
import OfferSheet from '@/components/marketplace/OfferSheet'
import CostEstimator from '@/components/marketplace/CostEstimator'
import { formatPrice, formatDate } from '@/lib/formatters'

const CreateOfferPage = () => {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id

  const [campaign, setCampaign] = useState(null)
  const [creators, setCreators] = useState([])
  const [selectedCreator, setSelectedCreator] = useState(null)
  const [showOfferSheet, setShowOfferSheet] = useState(false)
  const [showCostEstimator, setShowCostEstimator] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    
    const loadPageData = async () => {
      try {
        setLoading(true)
        
        console.log('Loading offer creation page data for campaign:', campaignId)
        
        // Start loading with timeout protection
        const loadingTimeout = setTimeout(() => {
          if (mounted) {
            console.error('Data loading timeout - forcing load completion')
            setLoading(false)
            setDataLoaded(true)
          }
        }, 8000) // 8 second timeout

        const safetyTimeout = setTimeout(() => {
          if (mounted && !dataLoaded) {
            console.error('Safety timeout reached - forcing completion')
            setLoading(false)
            setDataLoaded(true)
          }
        }, 10000) // 10 second safety timeout

        try {
          await Promise.all([
            loadCampaignData(mounted),
            loadAvailableCreators(mounted)
          ])

          if (mounted) {
            setDataLoaded(true)
            
            // Clear timeouts
            clearTimeout(loadingTimeout)
            clearTimeout(safetyTimeout)
          }
        } catch (error) {
          console.error('Error loading page data:', error)
          if (mounted) {
            setError('Failed to load page data')
            setDataLoaded(true)
          }
        }
      } catch (error) {
        console.error('Error in loadPageData:', error)
        if (mounted) {
          setError('Failed to load page')
          setDataLoaded(true)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadPageData()

    return () => {
      mounted = false
    }
  }, [campaignId])

  const loadCampaignData = async (mounted = true) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`)
      if (response.ok) {
        const data = await response.json()
        if (mounted) {
          setCampaign(data.campaign)
        }
      } else {
        if (mounted) {
          setError('Failed to load campaign details')
        }
      }
    } catch (err) {
      if (mounted) {
        setError('Failed to load campaign details')
      }
    }
  }

  const loadAvailableCreators = async (mounted = true) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/applications`)
      if (response.ok) {
        const data = await response.json()
        // Get creators who have applied to this campaign
        if (mounted) {
          setCreators(data.applications?.map(app => app.creator) || [])
        }
      } else {
        // If no applications API, load all creators as fallback
        const creatorsResponse = await fetch('/api/profiles?role=creator')
        if (creatorsResponse.ok) {
          const creatorsData = await creatorsResponse.json()
          if (mounted) {
            setCreators(creatorsData.profiles || [])
          }
        }
      }
    } catch (err) {
      console.error('Failed to load creators:', err)
      if (mounted) {
        setError('Failed to load creators')
      }
    }
  }

  const handleCreateOffer = async (offerData) => {
    try {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...offerData,
          campaign_id: campaignId,
          creator_id: selectedCreator.id,
          status: 'draft'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/brand/campaigns/${campaignId}/offers`)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create offer')
      }
    } catch (err) {
      throw err
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="brand">
        <Layout>
          <Container className="py-8">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <Text>Loading offer creation...</Text>
              </div>
            </div>
          </Container>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="brand">
      <Layout>
        <Container className="py-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/brand/campaigns')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Campaigns
              </Button>
              <div>
                <Heading level={1} size="2xl" className="mb-2">Create Offer</Heading>
                <Text color="secondary">
                  Campaign: {campaign?.title || `Campaign ${campaignId}`}
                </Text>
              </div>
            </div>
          </div>

          {error && (
            <Card className="p-4 border-red-500/20 bg-red-900/20">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <Text className="text-red-400">{error}</Text>
              </div>
            </Card>
          )}

          {/* Campaign Context Card */}
          {campaign && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-blue-400" />
                <Heading level={2} size="lg">Campaign Overview</Heading>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Text size="sm" color="secondary" className="mb-1">Campaign</Text>
                  <Text weight="medium">{campaign.title}</Text>
                </div>
                <div>
                  <Text size="sm" color="secondary" className="mb-1">Budget</Text>
                  <Text weight="medium">{formatPrice(campaign.budget_cents, campaign.currency)}</Text>
                </div>
                <div>
                  <Text size="sm" color="secondary" className="mb-1">Deadline</Text>
                  <Text weight="medium">
                    {formatDate(campaign.end_date) || 'Not set'}
                  </Text>
                </div>
              </div>
              
              {campaign.description && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <Text size="sm" color="secondary" className="mb-2">Description</Text>
                  <Text className="leading-relaxed">{campaign.description}</Text>
                </div>
              )}
            </Card>
          )}

          {/* Creator Selection */}
          {!selectedCreator && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-purple-400" />
                <Heading level={2} size="lg">Select Creator</Heading>
              </div>
              
              {creators.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                  <Heading level={3} size="lg" className="mb-2">No Creators Available</Heading>
                  <Text color="secondary" className="mb-6 max-w-md mx-auto">
                    Creators will appear here once they apply to your campaign. Share your campaign to attract creators!
                  </Text>
                  <Button 
                    variant="secondary"
                    onClick={() => router.push(`/brand/campaigns/${campaignId}`)}
                  >
                    Back to Campaign
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {creators.map((creator) => (
                    <Card
                      key={creator.id}
                      className="p-6 cursor-pointer hover:bg-[#1A1A2A]/50 transition-all duration-200 border-white/10 hover:border-purple-500/50"
                      onClick={() => setSelectedCreator(creator)}
                    >
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <Text weight="semibold" className="mb-1">{creator.full_name}</Text>
                          <Text size="sm" color="secondary">@{creator.username || 'creator'}</Text>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between">
                          <Text size="sm" color="secondary">Followers:</Text>
                          <Text size="sm" weight="medium">
                            {creator.followers_count?.toLocaleString() || 'N/A'}
                          </Text>
                        </div>
                        <div className="flex justify-between">
                          <Text size="sm" color="secondary">Category:</Text>
                          <Text size="sm" weight="medium">
                            {creator.categories?.join(', ') || 'General'}
                          </Text>
                        </div>
                      </div>
                      
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        Select Creator
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Selected Creator & Actions */}
          {selectedCreator && (
            <Card className="p-6">
              <Heading level={2} size="lg" className="mb-6">Selected Creator</Heading>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <Text weight="semibold" size="lg" className="mb-1">{selectedCreator.full_name}</Text>
                    <Text color="secondary" className="mb-2">@{selectedCreator.username || 'creator'}</Text>
                    <div className="flex gap-4">
                      <Text size="sm">
                        <span className="text-gray-400">Followers:</span> {selectedCreator.followers_count?.toLocaleString() || 'N/A'}
                      </Text>
                      <Text size="sm">
                        <span className="text-gray-400">Category:</span> {selectedCreator.categories?.join(', ') || 'General'}
                      </Text>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setShowCostEstimator(true)}
                    className="flex items-center justify-center"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Cost Estimator
                  </Button>
                  <Button
                    onClick={() => setShowOfferSheet(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Create Offer
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedCreator(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    Change Creator
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Cost Estimator Modal */}
          {showCostEstimator && selectedCreator && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#0F0F1A] border border-white/10 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <Heading level={2} size="lg">Cost Estimator</Heading>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowCostEstimator(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </Button>
                  </div>
                  <CostEstimator
                    creatorId={selectedCreator.id}
                    onOfferCreate={(estimatedData) => {
                      setShowCostEstimator(false)
                      setShowOfferSheet(true)
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Offer Sheet Modal */}
          {showOfferSheet && selectedCreator && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#0F0F1A] border border-white/10 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <Heading level={2} size="lg">Create Offer</Heading>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowOfferSheet(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </Button>
                  </div>
                  <OfferSheet
                    campaignId={campaignId}
                    creatorId={selectedCreator.id}
                    mode="create"
                    userRole="brand"
                    onSubmit={handleCreateOffer}
                    onCancel={() => setShowOfferSheet(false)}
                  />
                </div>
              </div>
            </div>
          )}
        </Container>
      </Layout>
    </ProtectedRoute>
  )
}

export default CreateOfferPage