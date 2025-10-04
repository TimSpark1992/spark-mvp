'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, DollarSign, Calendar, FileText, Package } from 'lucide-react'

const OfferSheet = ({ 
  offer = null, 
  campaignId, 
  creatorId = null,
  brandId = null,
  estimatedData = null,
  onSubmit, 
  onCancel,
  mode = 'create',
  userRole = 'brand'
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Parse offer items from JSONB
  const parseOfferItems = () => {
    if (!offer) return null
    try {
      const items = typeof offer.items === 'string' ? JSON.parse(offer.items) : offer.items
      return Array.isArray(items) && items.length > 0 ? items[0] : null
    } catch (err) {
      console.error('Error parsing offer items:', err)
      return null
    }
  }

  const offerItem = parseOfferItems()

  const formatPrice = (cents) => {
    if (typeof cents !== 'number') return '$0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    
    try {
      await onSubmit()
    } catch (err) {
      setError(err.message || 'Failed to update offer')
    } finally {
      setLoading(false)
    }
  }

  const isViewMode = mode === 'view'
  const title = isViewMode ? 'Offer Details' : 'Edit Offer'

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Creator Info */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Creator</h3>
            <p className="text-white font-semibold">
              {offer?.creator_profile?.full_name || 'Unknown Creator'}
            </p>
            <p className="text-sm text-gray-400">
              {offer?.creator_profile?.email || ''}
            </p>
          </div>

          {/* Deliverable Details */}
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-medium text-gray-400">Deliverable</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="text-white font-medium">
                  {offerItem?.deliverable_type?.replace(/_/g, ' ') || 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Quantity:</span>
                <span className="text-white font-medium">
                  {offerItem?.quantity || 1}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Rush Fee:</span>
                <span className="text-white font-medium">
                  {offerItem?.rush_fee_pct || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Details */}
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-green-400" />
              <h3 className="text-sm font-medium text-gray-400">Pricing</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Base Price:</span>
                <span className="text-white font-medium">
                  {formatPrice(offerItem?.base_price_cents || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal:</span>
                <span className="text-white font-medium">
                  {formatPrice(offer?.subtotal_cents || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Platform Fee ({offer?.platform_fee_pct || 20}%):</span>
                <span className="text-white font-medium">
                  {formatPrice(offer?.platform_fee_cents || 0)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-700">
                <span className="text-white font-semibold">Total:</span>
                <span className="text-green-400 font-bold text-lg">
                  {formatPrice(offer?.total_cents || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-medium text-gray-400">Timeline</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Deadline:</span>
                <span className="text-white font-medium">
                  {formatDate(offer?.expires_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-white font-medium capitalize">
                  {offer?.status?.replace(/_/g, ' ') || 'Draft'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {offer?.notes && (
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-medium text-gray-400">Notes</h3>
              </div>
              <p className="text-white">{offer.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {isViewMode ? 'Close' : 'Cancel'}
          </Button>
          {!isViewMode && (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default OfferSheet