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

  return (
    <ProtectedRoute requiredRole="brand">
      {!isMounted || loading ? (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-400">
              {!isMounted ? 'Initializing...' : 'Loading offers...'}
            </p>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-900 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
              <h1 className="text-3xl font-bold text-white mb-4">Campaign Offers</h1>
              <p className="text-gray-400 mb-6">Campaign ID: {campaignId}</p>
              
              {error && (
                <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4 mb-6">
                  <p className="text-red-400">{error}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <p className="text-white">Found {offers.length} offers</p>
                
                {offers.length > 0 ? (
                  <div className="space-y-3">
                    {offers.map((offer) => (
                      <div key={offer.id} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <p className="text-white font-medium">{offer.creator_profile?.full_name || 'Unknown'}</p>
                        <p className="text-gray-400 text-sm">Status: {offer.status}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No offers found</p>
                )}
                
                <button
                  onClick={() => router.push('/brand/campaigns')}
                  className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
                >
                  Back to Campaigns
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}

export default OffersPage