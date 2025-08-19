'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/shared/Layout'
import { Container, Section } from '@/components/shared/Container'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Heading, Text } from '@/components/ui/Typography'
import { formatPrice, formatDate } from '@/lib/formatters'
import { 
  Camera,
  Play,
  Package,
  Users,
  Star,
  MapPin,
  Filter,
  Search
} from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const DELIVERABLE_TYPES = {
  'IG_Reel': { label: 'Instagram Reel', icon: Camera, color: 'text-purple-400' },
  'IG_Story': { label: 'Instagram Story', icon: Camera, color: 'text-pink-400' },
  'TikTok_Post': { label: 'TikTok Post', icon: Play, color: 'text-red-400' },
  'YouTube_Video': { label: 'YouTube Video', icon: Play, color: 'text-red-500' },
  'Bundle': { label: 'Bundle Package', icon: Package, color: 'text-green-400' }
}

export default function PublicRateCardsPage() {
  const [rateCards, setRateCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')

  useEffect(() => {
    let isMounted = true
    
    const loadPublicRateCards = async () => {
      try {
        console.log('📋 Loading public rate cards...')
        
        // Timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          if (isMounted) {
            console.log('⚠️ Public rate cards timeout - using fallback')
            setRateCards([])
            setLoading(false)
          }
        }, 10000)
        
        const response = await fetch('/api/rate-cards/public')
        
        clearTimeout(timeoutId)
        
        if (!isMounted) return
        
        if (!response.ok) {
          // If public API doesn't exist, use regular API
          const fallbackResponse = await fetch('/api/rate-cards')
          const fallbackData = await fallbackResponse.json()
          
          if (fallbackResponse.ok && fallbackData.rateCards) {
            setRateCards(fallbackData.rateCards)
          } else {
            throw new Error('Failed to load rate cards')
          }
        } else {
          const data = await response.json()
          setRateCards(data.rateCards || [])
        }
        
        console.log('✅ Public rate cards loaded')
        
      } catch (error) {
        console.error('❌ Error loading public rate cards:', error)
        if (isMounted) {
          setError(error.message)
          // Show sample data as fallback
          setRateCards([
            {
              id: 'sample-1',
              creator_profile: { full_name: 'Sample Creator', username: 'sample_creator' },
              deliverable_type: 'IG_Reel',
              base_price_cents: 7500,
              currency: 'USD',
              rush_pct: 25,
              active: true,
              created_at: new Date().toISOString()
            },
            {
              id: 'sample-2', 
              creator_profile: { full_name: 'Demo Creator', username: 'demo_creator' },
              deliverable_type: 'TikTok_Post',
              base_price_cents: 5000,
              currency: 'USD', 
              rush_pct: 20,
              active: true,
              created_at: new Date().toISOString()
            }
          ])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadPublicRateCards()
    
    return () => {
      isMounted = false
    }
  }, [])

  const filteredRateCards = rateCards.filter(card => {
    if (!card) return false
    
    const matchesSearch = !searchTerm || 
      card.creator_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.creator_profile?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = !selectedType || card.deliverable_type === selectedType
    
    return matchesSearch && matchesType && card.active
  })

  if (loading) {
    return (
      <Layout variant="app">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8A2BE2] mx-auto"></div>
            <Text size="lg" color="secondary">Loading rate cards...</Text>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout variant="app">
      <Section padding="lg">
        <Container>
          {/* Header */}
          <div className="text-center mb-12">
            <Heading level={1} size="4xl" className="mb-4">
              Creator Rate Cards
            </Heading>
            <Text size="xl" color="secondary" className="max-w-2xl mx-auto">
              Discover transparent pricing from top creators across different platforms and content types
            </Text>
          </div>

          {/* Search and Filters */}
          <Card className="p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search creators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg text-white"
              >
                <option value="">All Content Types</option>
                {Object.entries(DELIVERABLE_TYPES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </Card>

          {/* Error Message */}
          {error && (
            <Card className="p-4 mb-6 bg-red-900/20 border-red-500/20">
              <Text color="secondary" className="text-red-400">
                {error} - Showing sample data below
              </Text>
            </Card>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <Text color="secondary">
              Showing {filteredRateCards.length} rate cards
            </Text>
            {(searchTerm || selectedType) && (
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSearchTerm('')
                  setSelectedType('')
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Rate Cards Grid */}
          {filteredRateCards.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#2A2A3A] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-500" />
                </div>
                <Heading level={4} size="lg" className="mb-2">No rate cards found</Heading>
                <Text size="sm" color="secondary" className="mb-6">
                  {searchTerm || selectedType 
                    ? 'Try adjusting your filters to see more rate cards.'
                    : 'Rate cards will appear here when creators add them.'
                  }
                </Text>
              </div>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRateCards.map((rateCard) => {
                const deliverableConfig = DELIVERABLE_TYPES[rateCard.deliverable_type] || {}
                const Icon = deliverableConfig.icon || Package

                return (
                  <Card key={rateCard.id} className="p-6 hover:bg-[#2A2A3A]/50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-purple-100/10 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <Text weight="semibold" className="mb-1">
                            {rateCard.creator_profile?.full_name || 'Creator'}
                          </Text>
                          <Text size="sm" color="secondary">
                            @{rateCard.creator_profile?.username || 'creator'}
                          </Text>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icon className={`w-5 h-5 ${deliverableConfig.color}`} />
                          <Text size="sm" weight="medium">
                            {deliverableConfig.label || rateCard.deliverable_type}
                          </Text>
                        </div>
                        <Badge variant="secondary" className="text-green-400">
                          {rateCard.currency || 'USD'}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <Text size="sm" color="secondary">Base Price</Text>
                          <Text size="xl" weight="bold" className="text-green-400">
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
                      </div>

                      <div className="pt-4 border-t border-white/10">
                        <Text size="xs" color="secondary">
                          Updated {formatDate(rateCard.updated_at || rateCard.created_at)}
                        </Text>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Call to Action */}
          <div className="text-center mt-12 pt-12 border-t border-white/10">
            <Heading level={3} size="xl" className="mb-4">
              Ready to work with creators?
            </Heading>
            <Text size="lg" color="secondary" className="mb-6 max-w-xl mx-auto">
              Join Spark to connect with talented creators and launch your next campaign
            </Text>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => window.location.href = '/auth/signup'}>
                Get Started
              </Button>
              <Button variant="outline" size="lg" onClick={() => window.location.href = '/auth/login'}>
                Sign In
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </Layout>
  )
}