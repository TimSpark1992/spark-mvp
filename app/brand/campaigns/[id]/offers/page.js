'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/components/AuthProvider'

const OffersPage = () => {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id
  const { user, profile, loading: authLoading } = useAuth()

  // Hydration-safe: track if component is mounted on client
  const [isMounted, setIsMounted] = useState(false)
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Hydration guard: Set mounted state only on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Data fetching: Only run on client after mount and authentication
  useEffect(() => {
    if (isMounted && campaignId && user && !authLoading) {
      loadOffers()
    }
  }, [isMounted, campaignId, user, authLoading])

  const loadOffers = async () => {
    try {
      const response = await fetch(`/api/offers?campaign_id=${campaignId}`)
      if (response.ok) {
        const data = await response.json()
        const offersData = Array.isArray(data.offers) ? data.offers : []
        setOffers(offersData)
      } else {
        setError('Failed to load offers')
      }
    } catch (err) {
      console.error('Error loading offers:', err)
      setError('Failed to load offers')
    } finally {
      setLoading(false)
    }
  }

  // Prevent hydration mismatch: Don't render content until mounted on client
  if (!isMounted || loading) {
    return (
      <ProtectedRoute requiredRole="brand">
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-400">
              {!isMounted ? 'Initializing...' : 'Loading offers...'}
            </p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="brand">
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/brand/campaigns')}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Campaigns
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Campaign Offers</h1>
                <p className="text-gray-400">
                  {campaign?.title || `Campaign ${campaignId}`}
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push(`/brand/campaigns/${campaignId}/offers/create`)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Offer
            </Button>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Campaign Summary */}
          {campaign && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Campaign Summary</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Total Offers</p>
                  <p className="text-2xl font-bold text-blue-400">{offers.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Accepted</p>
                  <p className="text-2xl font-bold text-green-400">
                    {offers.filter(o => o.status === 'accepted').length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Pending</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {offers.filter(o => o.status === 'sent').length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Total Value</p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatPrice(
                      offers.reduce((sum, offer) => sum + (offer.total_cents || 0), 0),
                      campaign.currency || 'USD'
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Offers List */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-bold text-white">Offers</h2>
            </div>
            
            {offers.length === 0 ? (
              <div className="text-center py-16">
                <DollarSign className="w-20 h-20 mx-auto text-gray-600 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-3">No offers created yet</h3>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  Start by creating your first offer to a creator. Use the Cost Estimator to calculate accurate pricing.
                </p>
                <Button
                  onClick={() => router.push(`/brand/campaigns/${campaignId}/offers/create`)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Offer
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {offers.map((offer) => {
                  const deliverable = getDeliverableInfo(offer)
                  return (
                    <div
                      key={offer.id}
                      className="bg-gray-900 border border-gray-700 rounded-lg p-6 hover:border-purple-500/50 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-white mb-1">
                              {offer.creator_profile?.full_name || 'Unknown Creator'}
                            </p>
                            <p className="text-sm text-gray-400 mb-2">
                              {deliverable.type} • Qty: {deliverable.quantity}
                            </p>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4 text-green-400" />
                                <span className="font-medium text-green-400">
                                  {formatPrice(offer.total_cents, offer.currency)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <span className="text-sm text-gray-400">
                                  Due: {formatDate(offer.expires_at)}
                                </span>
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
                                e.preventDefault()
                                e.stopPropagation()
                                openOfferSheet(offer, 'view')
                              }}
                              type="button"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            {(offer.status === 'draft' || offer.status === 'drafted' || offer.status === 'sent') && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  openOfferSheet(offer, 'edit')
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
                                e.preventDefault()
                                e.stopPropagation()
                                handleDeleteOffer(offer.id)
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

                      {offer.notes && (
                        <div className="mt-4 pl-16">
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {offer.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Offer Sheet Modal */}
          {showOfferSheet && selectedOffer && (
            <OfferSheet
              offer={selectedOffer}
              campaignId={campaignId}
              mode={offerSheetMode}
              userRole="brand"
              onSubmit={handleUpdateOffer}
              onCancel={() => {
                setShowOfferSheet(false)
                setSelectedOffer(null)
              }}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default OffersPage