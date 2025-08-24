'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/shared/Layout'
import { Container, Section } from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Heading, Text } from '@/components/ui/Typography'
import { formatPrice, formatDate } from '@/lib/formatters'
import { 
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Zap,
  Camera,
  Play,
  Package,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { getCampaigns } from '@/lib/supabase'
import { 
  getCachedRateCards,
  updateRateCardsCache,
  removeRateCardFromCache,
  addRateCardToCache,
  updateRateCardInCache,
  clearRateCardCache
} from '@/lib/rate-card-cache'

const DELIVERABLE_TYPES = {
  'IG_Reel': { label: 'Instagram Reel', icon: Camera, color: 'text-purple-400' },
  'IG_Story': { label: 'Instagram Story', icon: Camera, color: 'text-pink-400' },
  'TikTok_Post': { label: 'TikTok Post', icon: Play, color: 'text-red-400' },
  'YouTube_Video': { label: 'YouTube Video', icon: Play, color: 'text-red-500' },
  'Bundle': { label: 'Bundle Package', icon: Package, color: 'text-green-400' }
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'MYR', symbol: 'RM', label: 'Malaysian Ringgit' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' }
]

export default function RateCardsPage() {
  const { profile, loading: authLoading } = useAuth()
  const [rateCards, setRateCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCard, setEditingCard] = useState(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingCard, setDeletingCard] = useState(null)
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 Rate Cards Page State:', {
      authLoading,
      profileId: profile?.id,
      profileRole: profile?.role,
      dataLoaded,
      loading,
      rateCardsCount: rateCards.length
    })
  }, [authLoading, profile?.id, profile?.role, dataLoaded, loading, rateCards.length])

  const [formData, setFormData] = useState({
    deliverable_type: '',
    base_price_dollars: 0, // Store as dollars for better UX, convert to cents on submit
    currency: 'USD',
    rush_pct: 0
  })

  // Main data loading effect for personal rate cards - simple and clean
  useEffect(() => {
    let isMounted = true;
    
    const loadRateCards = async () => {
      // Only load if we have an authenticated creator profile and haven't loaded yet
      if (!profile?.id || dataLoaded || authLoading) {
        return
      }
      
      try {
        console.log('📋 Loading personal rate cards for creator:', profile.id)
        setLoading(true)
        setError('')
        
        const response = await fetch(`/api/rate-cards?creator_id=${profile.id}`)
        
        if (!isMounted) return
        
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || `Failed to load rate cards (${response.status})`)
        }
        
        console.log('✅ Personal rate cards loaded successfully:', data.rateCards?.length || 0)
        setRateCards(data.rateCards || [])
        setDataLoaded(true)
        setLoading(false) // Success - stop loading immediately
        
      } catch (error) {
        console.error('❌ Error loading rate cards:', error)
        if (isMounted) {
          // Show error but don't disrupt the page - just show an error message
          setError(`Failed to load rate cards: ${error.message}`)
          setRateCards([])
          setDataLoaded(true)
          setLoading(false) // Error - stop loading, show the page anyway
        }
      }
    }

    // Load rate cards when we have a valid creator profile
    if (profile?.id && profile?.role === 'creator') {
      loadRateCards()
    }
    
    return () => {
      isMounted = false
    }
  }, [profile?.id, profile?.role, authLoading]) // Minimal dependencies

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'base_price_dollars') {
      // Handle base price as dollars - store directly as dollars for clean input experience
      const dollarAmount = value === '' ? 0 : parseFloat(value) || 0
      setFormData(prev => ({
        ...prev,
        [name]: dollarAmount
      }))
    } else if (name === 'rush_pct') {
      // Handle rush percentage (keep as percentage)
      const percentage = value === '' ? 0 : parseFloat(value) || 0
      setFormData(prev => ({
        ...prev,
        [name]: percentage
      }))
    } else {
      // Handle other fields normally
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const resetForm = () => {
    setFormData({
      deliverable_type: '',
      base_price_dollars: 0,
      currency: 'USD',
      rush_pct: 0
    })
    setShowAddForm(false)
    setEditingCard(null)
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      console.log('🔄 Starting rate card creation...')
      console.log('📋 Form data:', formData)
      console.log('👤 Profile:', profile)
      
      // Validate profile
      if (!profile?.id) {
        throw new Error('User profile not loaded. Please refresh the page and try again.')
      }
      
      // Validate form
      if (!formData.deliverable_type) {
        throw new Error('Please select a deliverable type')
      }
      
      // Use more precise validation for price - check for null/undefined/NaN instead of falsy
      if (formData.base_price_dollars === null || formData.base_price_dollars === undefined || 
          isNaN(formData.base_price_dollars) || formData.base_price_dollars <= 0) {
        throw new Error('Please enter a valid price')
      }

      // Convert dollars to cents for API submission
      const requestBody = {
        creator_id: profile.id,
        deliverable_type: formData.deliverable_type,
        base_price_cents: Math.round((formData.base_price_dollars || 0) * 100), // Convert to cents
        currency: formData.currency,
        rush_pct: formData.rush_pct || 0
      }

      console.log('🔄 Request body:', requestBody)
      
      // Enhanced timeout handling for production reliability
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Rate card save request timed out. Please check your connection and try again.')), 30000)
      )
      
      let responsePromise
      if (editingCard) {
        // Update existing rate card
        console.log('🔄 Updating existing rate card...')
        responsePromise = fetch(`/api/rate-cards/${editingCard.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(25000) // 25s timeout for fetch
        })
      } else {
        // Create new rate card  
        console.log('🔄 Creating new rate card...')
        responsePromise = fetch('/api/rate-cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(25000) // 25s timeout for fetch
        })
      }
      
      // Race between rate card save and timeout
      const response = await Promise.race([responsePromise, timeoutPromise])
      
      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)
      
      const data = await response.json()
      console.log('📡 Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save rate card')
      }

      console.log('✅ Rate card saved:', data.rateCard?.id)
      
      // Update local state
      if (editingCard) {
        setRateCards(prev => prev.map(card => 
          card.id === editingCard.id ? data.rateCard : card
        ))
        setSuccess('Rate card updated successfully!')
      } else {
        setRateCards(prev => [...prev, data.rateCard])
        setSuccess('Rate card created successfully!')
      }

      resetForm()

    } catch (error) {
      console.error('❌ Error saving rate card:', error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (rateCard) => {
    setFormData({
      deliverable_type: rateCard.deliverable_type,
      base_price_dollars: (rateCard.base_price_cents || 0) / 100, // Convert cents to dollars for display
      currency: rateCard.currency || 'USD',
      rush_pct: rateCard.rush_pct || 0
    })
    setEditingCard(rateCard)
    setShowAddForm(true)
  }

  const handleDelete = async (rateCard) => {
    // Show custom modal instead of window.confirm
    setDeletingCard(rateCard)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingCard) return

    try {
      console.log('🗑️ Deleting rate card:', deletingCard.id)

      const response = await fetch(`/api/rate-cards/${deletingCard.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setRateCards(rateCards.filter(card => card.id !== deletingCard.id))
        setSuccess('Rate card deleted successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete rate card')
      }
    } catch (error) {
      console.error('❌ Error deleting rate card:', error)
      setError(error.message)
      setTimeout(() => setError(''), 5000)
    } finally {
      setDeletingCard(null)
      setShowDeleteModal(false)
    }
  }

  const cancelDelete = () => {
    setDeletingCard(null)
    setShowDeleteModal(false)
  }

  const getAvailableDeliverableTypes = () => {
    const usedTypes = rateCards
      .filter(card => card.currency === formData.currency)
      .map(card => card.deliverable_type)
    
    return Object.entries(DELIVERABLE_TYPES)
      .filter(([key]) => !usedTypes.includes(key) || (editingCard && editingCard.deliverable_type === key))
  }

  if (loading && !dataLoaded) {
    return (
      <ProtectedRoute requiredRole="creator">
        <Layout variant="app">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8A2BE2] mx-auto"></div>
              <Text size="lg" color="secondary">Loading your rate cards...</Text>
              <Text size="sm" color="secondary">
                {authLoading ? 'Authenticating...' : 
                 !profile?.id ? 'Loading profile...' : 
                 'Fetching your rate cards...'}
              </Text>
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
              <div className="flex items-center gap-4">
                <Link href="/creator/dashboard">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
                <div>
                  <Heading level={1} size="3xl">Rate Cards</Heading>
                  <Text size="lg" color="secondary">Manage your pricing for different deliverables</Text>
                </div>
              </div>
              
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Rate Card
              </Button>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <Card className="p-4 mb-6 bg-green-500/20 border border-green-500/20 rounded-lg">
                <Text className="text-green-400">{success}</Text>
              </Card>
            )}

            {error && (
              <Card className="p-4 mb-6 bg-red-500/20 border border-red-500/20 rounded-lg">
                <Text className="text-red-400">{error}</Text>
              </Card>
            )}

            {/* Add/Edit Form */}
            {showAddForm && (
              <Card className="p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <Heading level={3} size="lg">
                    {editingCard ? 'Edit Rate Card' : 'Add New Rate Card'}
                  </Heading>
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-white">
                        Deliverable Type *
                      </label>
                      <select
                        name="deliverable_type"
                        value={formData.deliverable_type}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]"
                      >
                        <option value="">Select deliverable type</option>
                        {getAvailableDeliverableTypes().map(([key, value]) => (
                          <option key={key} value={key}>{value.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-white">
                        Currency *
                      </label>
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]"
                      >
                        {CURRENCIES.map(currency => (
                          <option key={currency.code} value={currency.code}>
                            {currency.symbol} {currency.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-white">
                        Base Price *
                      </label>
                      <div className="relative">
                        <DollarSign className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          name="base_price_dollars"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={formData.base_price_dollars || ''}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-10 pr-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]"
                          placeholder="Enter base price (e.g., 75.00)"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-white">
                        Rush Fee %
                      </label>
                      <div className="relative">
                        <Zap className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          name="rush_pct"
                          type="number"
                          min="0"
                          max="200"
                          step="0.1"
                          value={formData.rush_pct || ''}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]"
                          placeholder="0.0"
                        />
                      </div>
                      <Text size="xs" color="secondary">
                        Optional: Additional percentage for rush orders
                      </Text>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Saving...' : (editingCard ? 'Update Rate Card' : 'Create Rate Card')}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Rate Cards Grid */}
            {rateCards.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#2A2A3A] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-gray-500" />
                  </div>
                  <Heading level={3} size="lg" className="mb-2">No Rate Cards Yet</Heading>
                  <Text size="sm" color="secondary" className="mb-6">
                    Create rate cards to set your pricing for different types of content
                  </Text>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Rate Card
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rateCards.map((rateCard) => {
                  const deliverableInfo = DELIVERABLE_TYPES[rateCard.deliverable_type]
                  const IconComponent = deliverableInfo?.icon || Camera

                  return (
                    <Card key={rateCard.id} className="p-6 hover:bg-[#2A2A3A]/50 transition-colors border border-white/5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] flex items-center justify-center`}>
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <Heading level={4} size="md">{deliverableInfo?.label}</Heading>
                            <Badge variant="secondary" className="mt-1">
                              {rateCard.currency}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(rateCard)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(rateCard)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Text size="sm" color="secondary">Base Price</Text>
                          <Text size="lg" weight="semibold" className="text-green-400">
                            {formatPrice(rateCard.base_price_cents, rateCard.currency)}
                          </Text>
                        </div>
                        
                        {rateCard.rush_pct > 0 && (
                          <div>
                            <Text size="sm" color="secondary">Rush Fee</Text>
                            <Text size="sm" className="text-yellow-400">
                              +{rateCard.rush_pct}% ({formatPrice(
                                Math.round(rateCard.base_price_cents * (rateCard.rush_pct / 100)), 
                                rateCard.currency
                              )})
                            </Text>
                          </div>
                        )}

                        <div className="pt-2 border-t border-white/10">
                          <Text size="xs" color="secondary">
                            Updated {formatDate(rateCard.updated_at)}
                          </Text>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Getting Started Tips */}
            {rateCards.length > 0 && rateCards.length < 3 && (
              <Card className="p-6 mt-8 bg-blue-500/20 border border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <Zap className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <Heading level={4} size="sm" className="text-blue-400 mb-2">
                      Maximize Your Earning Potential
                    </Heading>
                    <Text size="sm" color="secondary" className="mb-3">
                      Add more rate cards for different deliverable types to attract more brands:
                    </Text>
                    <ul className="text-sm space-y-1 text-gray-300">
                      <li>• Instagram Reels tend to have higher engagement rates</li>
                      <li>• Bundle packages can increase your average order value</li>
                      <li>• Consider rush fees for tight deadlines</li>
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          {/* Custom Delete Confirmation Modal */}
          {showDeleteModal && deletingCard && (
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#1A1A2A] border border-white/10 rounded-2xl max-w-md w-full mx-4 shadow-2xl">
                <div className="p-6">
                  {/* Header with Icon */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                      <svg 
                        className="w-8 h-8 text-red-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                        />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Title */}
                  <div className="text-center mb-6">
                    <Heading level={3} size="lg" className="mb-3">
                      Delete Rate Card
                    </Heading>
                    <Text color="secondary" className="mb-2">
                      You're about to permanently delete your{" "}
                      <span className="font-semibold text-white">
                        {DELIVERABLE_TYPES[deletingCard.deliverable_type]?.label}
                      </span>{" "}
                      rate card.
                    </Text>
                    <div className="bg-[#2A2A3A] rounded-lg p-4 mt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Current Price:</span>
                        <span className="font-semibold text-green-400">
                          {formatPrice(deletingCard.base_price_cents, deletingCard.currency)}
                        </span>
                      </div>
                      {deletingCard.rush_pct > 0 && (
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-gray-400">Rush Fee:</span>
                          <span className="font-semibold text-yellow-400">
                            +{deletingCard.rush_pct}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Warning Message */}
                  <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <svg 
                        className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5C2.962 18.333 3.924 20 5.464 20z" 
                        />
                      </svg>
                      <div>
                        <Text size="sm" weight="medium" className="text-red-400 mb-1">
                          This action cannot be undone
                        </Text>
                        <Text size="sm" color="secondary">
                          Once deleted, you'll need to recreate this rate card from scratch.
                        </Text>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={cancelDelete}
                      className="flex-1 border-white/20 text-gray-300 hover:bg-white/5"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={confirmDelete}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <svg 
                        className="w-4 h-4 mr-2" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                        />
                      </svg>
                      Delete Rate Card
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          </Container>
        </Section>
      </Layout>
    </ProtectedRoute>
  )
}