'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Container } from '@/components/shared/Container'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice, formatDate } from '@/lib/formatters'
import {
  Eye,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  MessageSquare,
  ExternalLink
} from 'lucide-react'

const STATUS_CONFIG = {
  'pending': { color: 'bg-yellow-500', text: 'Pending', icon: Clock },
  'accepted': { color: 'bg-green-500', text: 'Accepted', icon: CheckCircle },
  'rejected': { color: 'bg-red-500', text: 'Rejected', icon: XCircle },
  'completed': { color: 'bg-blue-500', text: 'Completed', icon: CheckCircle },
  'paid': { color: 'bg-purple-500', text: 'Paid', icon: DollarSign }
}

export default function CreatorOffersPage() {
  const { profile } = useAuth()
  const [offers, setOffers] = useState([])
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [showOfferSheet, setShowOfferSheet] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    let isMounted = true;
    
    const loadOffers = async () => {
      if (!profile?.id || !isMounted || dataLoaded) return;
      
      try {
        console.log('🔄 Loading creator offers...')
        
        // Set timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          if (isMounted && !dataLoaded) {
            console.log('⚠️ Offers loading timeout')
            setOffers([])
            setDataLoaded(true)
            setLoading(false)
          }
        }, 5000)
        
        const response = await fetch(`/api/offers?creator_id=${profile.id}`)
        
        clearTimeout(timeoutId)
        
        if (!isMounted) return
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Offers loaded:', data.offers?.length || 0)
          setOffers(data.offers || [])
        } else {
          setError('Failed to load offers')
          setOffers([])
        }
        
        setDataLoaded(true)
        
      } catch (err) {
        console.error('❌ Error loading offers:', err)
        if (isMounted) {
          setError('Failed to load offers')
          setOffers([])
          setDataLoaded(true)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadOffers()
    
    return () => {
      isMounted = false
    }
  }, [profile?.id, dataLoaded])

  const getFilteredOffers = () => {
    if (activeTab === 'all') return offers
    return offers.filter(offer => offer.status === activeTab)
  }

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
    const IconComponent = config.icon
    
    return (
      <Badge className={`${config.color} text-white flex items-center space-x-1`}>
        <IconComponent className="w-3 h-3" />
        <span>{config.text}</span>
      </Badge>
    )
  }

  const handleAcceptOffer = async (offerId) => {
    try {
      const response = await fetch(`/api/offers/${offerId}/accept`, {
        method: 'POST'
      })
      
      if (response.ok) {
        setOffers(offers.map(offer => 
          offer.id === offerId ? { ...offer, status: 'accepted' } : offer
        ))
      }
    } catch (err) {
      setError('Failed to accept offer')
    }
  }

  const handleRejectOffer = async (offerId) => {
    try {
      const response = await fetch(`/api/offers/${offerId}/reject`, {
        method: 'POST'
      })
      
      if (response.ok) {
        setOffers(offers.map(offer => 
          offer.id === offerId ? { ...offer, status: 'rejected' } : offer
        ))
      }
    } catch (err) {
      setError('Failed to reject offer')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="creator">
        <Container className="py-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8A2BE2] mx-auto mb-4"></div>
              <p className="text-gray-400">Loading offers...</p>
            </div>
          </div>
        </Container>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="creator">
      <Container className="py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Offers</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage offers from brands</p>
          </div>
        </div>

        {error && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardContent className="p-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </CardContent>
          </Card>
        )}

        {/* Filter Tabs */}
        <div className="flex space-x-4 mb-6">
          {[
            { key: 'all', label: 'All', count: offers.length },
            { key: 'pending', label: 'Pending', count: offers.filter(o => o.status === 'pending').length },
            { key: 'accepted', label: 'Accepted', count: offers.filter(o => o.status === 'accepted').length },
            { key: 'completed', label: 'Completed', count: offers.filter(o => o.status === 'completed').length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Offers List */}
        <div className="space-y-4">
          {getFilteredOffers().length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No offers {activeTab !== 'all' ? `with status "${activeTab}"` : 'yet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {activeTab !== 'all' 
                    ? 'Try changing the filter to see other offers.'
                    : 'Offers from brands will appear here when available.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            getFilteredOffers().map((offer) => (
              <Card key={offer.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {offer.campaigns?.title || 'Campaign Offer'}
                        </h3>
                        {getStatusBadge(offer.status)}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <span>From: {offer.campaigns?.profiles?.company_name || 'Brand'}</span>
                        <span>•</span>
                        <span>{formatDate(offer.created_at, 'Recently created')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Value</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        {formatPrice(offer.total_cents, offer.currency)}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Deadline</span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(offer.deadline, 'Not set')}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Eye className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Deliverables</span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {offer.deliverables?.length || 0} items
                      </span>
                    </div>
                  </div>

                  {offer.message && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                      <p className="text-gray-700 dark:text-gray-300 text-sm">{offer.message}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOffer(offer)
                        setShowOfferSheet(true)
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    
                    {offer.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectOffer(offer.id)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptOffer(offer.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </Container>
    </ProtectedRoute>
  )
}