'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Heading, Text } from '@/components/ui/Typography'
import { 
  Calculator,
  Plus,
  Trash2,
  Zap,
  AlertCircle,
  DollarSign
} from 'lucide-react'
import { calculatePricing, formatPrice, DELIVERABLE_LABELS } from '@/lib/marketplace/pricing'

const DELIVERABLE_TYPES = {
  'IG_Reel': { label: 'Instagram Reel', color: 'text-purple-400' },
  'IG_Story': { label: 'Instagram Story', color: 'text-pink-400' },
  'TikTok_Post': { label: 'TikTok Post', color: 'text-red-400' },
  'YouTube_Video': { label: 'YouTube Video', color: 'text-red-500' },
  'Bundle': { label: 'Bundle Package', color: 'text-green-400' }
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'MYR', symbol: 'RM', label: 'Malaysian Ringgit' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' }
]

export default function CostEstimator({ 
  creatorId, 
  onOfferCreate, 
  initialItems = [],
  className = '' 
}) {
  const [items, setItems] = useState(initialItems)
  const [rateCards, setRateCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [platformFeePct, setPlatformFeePct] = useState(20)

  // Load creator's rate cards
  useEffect(() => {
    const loadRateCards = async () => {
      if (!creatorId) return
      
      try {
        setLoading(true)
        console.log('🎯 Cost Estimator loading rate cards for creator:', creatorId)
        const response = await fetch(`/api/rate-cards?creator_id=${creatorId}`)
        const data = await response.json()
        
        console.log('📊 Rate cards API response:', { status: response.status, data })
        
        if (response.ok) {
          setRateCards(data.rateCards || [])
          console.log(`✅ Loaded ${data.rateCards?.length || 0} rate cards`)
          if (data.warning) {
            console.warn('Cost Estimator warning:', data.warning)
          }
        } else {
          console.error('Rate cards API error:', data.error)
          setError(data.error || 'Failed to load rate cards')
          setRateCards([])
        }
      } catch (err) {
        console.error('❌ Cost Estimator fetch error:', err)
        setError('Failed to load rate cards')
        setRateCards([])
      } finally {
        setLoading(false)
      }
    }

    loadRateCards()
  }, [creatorId])

  const addItem = () => {
    setItems([...items, {
      id: Date.now(),
      deliverable_type: '',
      qty: 1,
      unit_price_cents: 0,
      currency: 'USD',
      rush_pct: 0
    }])
  }

  const removeItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId))
  }

  const updateItem = (itemId, field, value) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value }
        
        // Auto-populate pricing from rate card
        if (field === 'deliverable_type' && value) {
          const rateCard = rateCards.find(rc => 
            rc.deliverable_type === value && 
            rc.currency === item.currency
          )
          
          if (rateCard) {
            updatedItem.unit_price_cents = rateCard.base_price_cents
            updatedItem.currency = rateCard.currency
            updatedItem.rush_pct = 0 // Reset rush percentage
          }
        }
        
        // Apply rush pricing
        if (field === 'rush_pct') {
          const baseRateCard = rateCards.find(rc => 
            rc.deliverable_type === item.deliverable_type && 
            rc.currency === item.currency
          )
          
          if (baseRateCard) {
            const rushAmount = Math.round(baseRateCard.base_price_cents * (value / 100))
            updatedItem.unit_price_cents = baseRateCard.base_price_cents + rushAmount
          }
        }
        
        return updatedItem
      }
      return item
    }))
  }

  const getAvailableDeliverables = (currency) => {
    return rateCards
      .filter(rc => rc.currency === currency)
      .map(rc => ({
        value: rc.deliverable_type,
        label: DELIVERABLE_TYPES[rc.deliverable_type]?.label || rc.deliverable_type,
        basePrice: rc.base_price_cents
      }))
  }

  const calculateTotal = () => {
    if (items.length === 0) return null
    
    const validItems = items.filter(item => 
      item.deliverable_type && 
      item.unit_price_cents > 0 && 
      item.qty > 0
    )
    
    if (validItems.length === 0) return null
    
    return calculatePricing(validItems, platformFeePct)
  }

  const pricing = calculateTotal()

  const handleCreateOffer = () => {
    if (!pricing || !onOfferCreate) return
    
    const offerData = {
      items: items.filter(item => 
        item.deliverable_type && 
        item.unit_price_cents > 0 && 
        item.qty > 0
      ),
      subtotal_cents: pricing.subtotalCents,
      platform_fee_pct: platformFeePct,
      platform_fee_cents: pricing.platformFeeCents,
      total_cents: pricing.totalCents,
      currency: pricing.currency
    }
    
    onOfferCreate(offerData)
  }

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="w-5 h-5 text-blue-400" />
          <Heading level={3} size="lg">Cost Estimator</Heading>
        </div>
        <Text>Loading rate cards...</Text>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`p-6 border-red-500/20 bg-red-900/20 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <Heading level={3} size="lg" className="text-red-400">Error</Heading>
        </div>
        <Text className="text-red-400">{error}</Text>
      </Card>
    )
  }

  if (rateCards.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="w-5 h-5 text-gray-400" />
          <Heading level={3} size="lg">Cost Estimator</Heading>
        </div>
        <Text color="secondary">This creator hasn't set up their rate cards yet.</Text>
      </Card>
    )
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calculator className="w-5 h-5 text-blue-400" />
          <Heading level={3} size="lg">Cost Estimator</Heading>
        </div>
        <Button onClick={addItem} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Items List */}
      <div className="space-y-4 mb-6">
        {items.map((item, index) => (
          <Card key={item.id} className="p-4 bg-[#1A1A2A] border-white/5">
            <div className="flex items-center justify-between mb-3">
              <Text size="sm" weight="medium">Item {index + 1}</Text>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => removeItem(item.id)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Deliverable Type */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Deliverable
                </label>
                <select
                  value={item.deliverable_type}
                  onChange={(e) => updateItem(item.id, 'deliverable_type', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#2A2A3A] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type</option>
                  {getAvailableDeliverables(item.currency).map(deliverable => (
                    <option key={deliverable.value} value={deliverable.value}>
                      {deliverable.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-sm bg-[#2A2A3A] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Rush Percentage */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Rush %
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={item.rush_pct}
                    onChange={(e) => updateItem(item.id, 'rush_pct', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm bg-[#2A2A3A] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {item.rush_pct > 0 && <Zap className="w-4 h-4 text-yellow-400" />}
                </div>
              </div>

              {/* Unit Price */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Unit Price
                </label>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <Text size="sm" weight="medium" className="text-green-400">
                    {formatPrice(item.unit_price_cents, item.currency)}
                  </Text>
                </div>
              </div>
            </div>

            {/* Line Total */}
            <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center">
              <Text size="sm" color="secondary">Line Total</Text>
              <Text size="sm" weight="medium" className="text-green-400">
                {formatPrice(item.unit_price_cents * item.qty, item.currency)}
              </Text>
            </div>
          </Card>
        ))}
      </div>

      {/* Pricing Breakdown */}
      {pricing && (
        <Card className="p-4 bg-blue-900/20 border-blue-500/20">
          <Heading level={4} size="md" className="text-blue-400 mb-3">
            Pricing Breakdown
          </Heading>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Text size="sm" color="secondary">Subtotal</Text>
              <Text size="sm" weight="medium">
                {formatPrice(pricing.subtotalCents, pricing.currency)}
              </Text>
            </div>
            
            <div className="flex justify-between items-center">
              <Text size="sm" color="secondary">
                Platform Fee ({pricing.platformFeePct}%)
              </Text>
              <Text size="sm" weight="medium">
                {formatPrice(pricing.platformFeeCents, pricing.currency)}
              </Text>
            </div>
            
            <div className="border-t border-white/10 pt-2 flex justify-between items-center">
              <Text weight="semibold">Total</Text>
              <Text weight="semibold" className="text-green-400 text-lg">
                {formatPrice(pricing.totalCents, pricing.currency)}
              </Text>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex justify-between items-center text-sm">
              <Text color="secondary">Creator Earnings</Text>
              <Text className="text-green-400">
                {formatPrice(pricing.creatorEarningsCents, pricing.currency)}
              </Text>
            </div>
          </div>

          {onOfferCreate && (
            <div className="mt-4">
              <Button onClick={handleCreateOffer} className="w-full">
                Create Offer
              </Button>
            </div>
          )}
        </Card>
      )}

      {items.length === 0 && (
        <div className="text-center py-8">
          <Calculator className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <Text color="secondary">Add items to calculate the cost</Text>
          <Button onClick={addItem} className="mt-3">
            <Plus className="w-4 h-4 mr-2" />
            Add First Item
          </Button>
        </div>
      )}
    </Card>
  )
}