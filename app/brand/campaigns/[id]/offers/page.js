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
import { ArrowLeft, Plus, Eye, Edit, Trash2, Users, DollarSign, AlertCircle, Target, Clock, CheckCircle } from 'lucide-react'
import OfferSheet from '@/components/marketplace/OfferSheet'
import { formatPrice, formatDate } from '@/lib/formatters'

const OffersPage = () => {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id

  const [offers, setOffers] = useState([])
  
  // Debug offers state changes
  useEffect(() => {
    console.log('🔵 offers state changed:', {
      type: typeof offers,
      isArray: Array.isArray(offers),
      length: offers?.length,
      value: offers
    });
  }, [offers])
  const [campaign, setCampaign] = useState(null)
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [showOfferSheet, setShowOfferSheet] = useState(false)
  const [offerSheetMode, setOfferSheetMode] = useState('view')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCampaignData()
    loadOffers()
  }, [campaignId])

  const loadCampaignData = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`)
      if (response.ok) {
        const data = await response.json()
        setCampaign(data.campaign)
      } else {
        setError('Failed to load campaign details')
      }
    } catch (err) {
      setError('Failed to load campaign details')
    }
  }

  const loadOffers = async () => {
    try {
      console.log('🔵 loadOffers: Fetching offers...');
      const response = await fetch(`/api/offers?campaign_id=${campaignId}`)
      if (response.ok) {
        const data = await response.json()
        console.log('🔵 loadOffers: API response:', data);
        console.log('🔵 loadOffers: data.offers type:', typeof data.offers, 'isArray:', Array.isArray(data.offers));
        
        const offersToSet = data.offers || [];
        console.log('🔵 loadOffers: Setting offers to:', offersToSet);
        setOffers(offersToSet);
      } else {
        console.error('🔴 loadOffers: API response not ok:', response.status);
        setError('Failed to load offers')
      }
    } catch (err) {
      console.error('🔴 loadOffers: Exception:', err);
      setError('Failed to load offers')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return

    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Safe filter with array check
        setOffers(prevOffers => {
          if (Array.isArray(prevOffers)) {
            return prevOffers.filter(offer => offer.id !== offerId);
          } else {
            console.error('🔴 offers is not an array:', prevOffers);
            return [];
          }
        });
      } else {
        setError('Failed to delete offer')
      }
    } catch (err) {
      setError('Failed to delete offer')
    }
  }

  const handleUpdateOffer = async (offerData) => {
    try {
      const response = await fetch(`/api/offers/${selectedOffer.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offerData),
      })

      if (response.ok) {
        const data = await response.json()
        setOffers(prevOffers => {
          if (Array.isArray(prevOffers)) {
            return prevOffers.map(offer => 
              offer.id === selectedOffer.id ? data.offer : offer
            );
          } else {
            console.error('🔴 offers is not an array in handleUpdateOffer:', prevOffers);
            return [data.offer];
          }
        })
        setShowOfferSheet(false)
        setSelectedOffer(null)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update offer')
      }
    } catch (err) {
      throw err
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { className: 'bg-gray-500/20 text-gray-300 border-gray-500/30', text: 'Draft' },
      sent: { className: 'bg-blue-500/20 text-blue-300 border-blue-500/30', text: 'Sent' },
      accepted: { className: 'bg-green-500/20 text-green-300 border-green-500/30', text: 'Accepted' },
      rejected: { className: 'bg-red-500/20 text-red-300 border-red-500/30', text: 'Rejected' },
      counter_offer: { className: 'bg-orange-500/20 text-orange-300 border-orange-500/30', text: 'Counter Offer' },
      paid_escrow: { className: 'bg-purple-500/20 text-purple-300 border-purple-500/30', text: 'Paid (Escrow)' },
      in_progress: { className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', text: 'In Progress' },
      submitted: { className: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', text: 'Submitted' },
      approved: { className: 'bg-green-600/20 text-green-300 border-green-600/30', text: 'Approved' },
      completed: { className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', text: 'Completed' },
      cancelled: { className: 'bg-gray-600/20 text-gray-300 border-gray-600/30', text: 'Cancelled' },
      refunded: { className: 'bg-red-600/20 text-red-300 border-red-600/30', text: 'Refunded' }
    }

    const config = statusConfig[status] || statusConfig.draft
    return <Badge className={config.className}>{config.text}</Badge>
  }

  const openOfferSheet = (offer, mode) => {
    console.log('🔵 openOfferSheet called with:', { offerId: offer?.id, mode });
    try {
      console.log('🔵 Setting selectedOffer...');
      setSelectedOffer(offer);
      console.log('🔵 Setting offerSheetMode...');
      setOfferSheetMode(mode);
      console.log('🔵 Setting showOfferSheet to true...');
      setShowOfferSheet(true);
      console.log('🔵 openOfferSheet completed successfully');
    } catch (error) {
      console.error('🔴 Error in openOfferSheet:', error);
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
                <Text>Loading offers...</Text>
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
                <Heading level={1} size="2xl" className="mb-2">Campaign Offers</Heading>
                <Text color="secondary">
                  Campaign: {campaign?.title || `Campaign ${campaignId}`}
                </Text>
              </div>
            </div>
            <Button
              onClick={() => router.push(`/brand/campaigns/${campaignId}/offers/create`)}
              className="bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] hover:from-[#7A1BD2] hover:to-[#E01483]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Offer
            </Button>
          </div>

          {error && (
            <Card className="p-4 border-red-500/20 bg-red-900/20">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <Text className="text-red-400">{error}</Text>
              </div>
            </Card>
          )}

          {/* Campaign Summary */}
          {campaign && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-blue-400" />
                <Heading level={2} size="lg">Campaign Summary</Heading>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <Text color="secondary" size="sm" className="mb-2">Total Offers</Text>
                  <Heading level={3} size="2xl" className="text-blue-400">{offers.length}</Heading>
                </div>
                <div className="text-center">
                  <Text color="secondary" size="sm" className="mb-2">Accepted</Text>
                  <Heading level={3} size="2xl" className="text-green-400">
                    {Array.isArray(offers) ? offers.filter(o => o.status === 'accepted').length : 0}
                  </Heading>
                </div>
                <div className="text-center">
                  <Text color="secondary" size="sm" className="mb-2">Pending</Text>
                  <Heading level={3} size="2xl" className="text-yellow-400">
                    {Array.isArray(offers) ? offers.filter(o => o.status === 'sent').length : 0}
                  </Heading>
                </div>
                <div className="text-center">
                  <Text color="secondary" size="sm" className="mb-2">Total Value</Text>
                  <Heading level={3} size="2xl" className="text-green-400">
                    {formatPrice(
                      offers.reduce((sum, offer) => sum + (offer.total_cents || 0), 0),
                      campaign.currency || 'USD'
                    )}
                  </Heading>
                </div>
              </div>
            </Card>
          )}

          {/* Offers List */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-6 h-6 text-green-400" />
              <Heading level={2} size="lg">Offers</Heading>
            </div>
            
            {offers.length === 0 ? (
              <div className="text-center py-16">
                <DollarSign className="w-20 h-20 mx-auto text-gray-500 mb-6" />
                <Heading level={3} size="xl" className="mb-3">No offers created yet</Heading>
                <Text color="secondary" className="mb-8 max-w-md mx-auto">
                  Start by creating your first offer to a creator. Use the Cost Estimator to calculate accurate pricing.
                </Text>
                <Button
                  onClick={() => router.push(`/brand/campaigns/${campaignId}/offers/create`)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Offer
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {Array.isArray(offers) ? offers.map((offer) => (
                  <Card key={offer.id} className="p-6 border-l-4 border-l-purple-500/50 hover:bg-[#1A1A2A]/30 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <Text weight="semibold" size="lg" className="mb-1">
                            {offer.creator_profile?.full_name || 'Unknown Creator'}
                          </Text>
                          <Text size="sm" color="secondary" className="mb-2">
                            {offer.deliverable_type?.replace('_', ' ')} • Qty: {offer.quantity}
                          </Text>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-green-400" />
                              <Text weight="medium" className="text-green-400">
                                {formatPrice(offer.total_cents, offer.currency)}
                              </Text>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-blue-400" />
                              <Text size="sm" color="secondary">
                                Due: {formatDate(offer.deadline) || 'Not set'}
                              </Text>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="lg:mr-4">
                          {getStatusBadge(offer.status)}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('View button clicked for offer:', offer.id);
                              openOfferSheet(offer, 'view');
                            }}
                            type="button"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          {(offer.status === 'draft' || offer.status === 'sent') && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Edit button clicked for offer:', offer.id);
                                openOfferSheet(offer, 'edit');
                              }}
                              type="button"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Delete button clicked for offer:', offer.id);
                              handleDeleteOffer(offer.id);
                            }}
                            type="button"
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>

                    {offer.description && (
                      <div className="mt-4 pl-16">
                        <Text size="sm" color="secondary" className="line-clamp-2">
                          {offer.description}
                        </Text>
                      </div>
                    )}
                  </Card>
                )) : (
                  <div className="text-center py-8">
                    <Text color="secondary">No offers data available</Text>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Offer Sheet Modal */}
          {(() => {
            console.log('🔵 Modal render check:', { showOfferSheet, selectedOffer: !!selectedOffer, offerSheetMode });
            
            if (showOfferSheet && selectedOffer) {
              console.log('🔵 Rendering modal with offer:', selectedOffer.id);
              return (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-[#0F0F1A] border border-white/10 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <Heading level={2} size="lg">
                          {offerSheetMode === 'view' ? 'View Offer' : 'Edit Offer'}
                        </Heading>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            console.log('🔵 Closing modal...');
                            setShowOfferSheet(false)
                            setSelectedOffer(null)
                          }}
                          className="text-gray-400 hover:text-white"
                        >
                          ✕
                        </Button>
                      </div>
                      <OfferSheet
                        offer={selectedOffer}
                        campaignId={campaignId}
                        mode={offerSheetMode}
                        userRole="brand"
                        onSubmit={handleUpdateOffer}
                        onCancel={() => {
                          console.log('🔵 OfferSheet onCancel called...');
                          setShowOfferSheet(false)
                          setSelectedOffer(null)
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            } else {
              console.log('🔵 Modal not shown - conditions not met');
              return null;
            }
          })()}
        </Container>
      </Layout>
    </ProtectedRoute>
  )
}

export default OffersPage