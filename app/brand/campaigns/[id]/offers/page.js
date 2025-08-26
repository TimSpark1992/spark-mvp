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
import { ArrowLeft, Plus, Eye, Edit, Trash2, Users, DollarSign, AlertCircle, Target } from 'lucide-react'
import OfferSheet from '@/components/marketplace/OfferSheet'
import { formatPrice, formatDate } from '@/lib/formatters'

const OffersPage = () => {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id;

  const [offers, setOffers] = useState([]);
  const [campaign, setCampaign] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showOfferSheet, setShowOfferSheet] = useState(false);
  const [offerSheetMode, setOfferSheetMode] = useState('view');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCampaignData();
    loadOffers();
  }, [campaignId]);

  const loadCampaignData = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (response.ok) {
        const data = await response.json();
        setCampaign(data.campaign);
      } else {
        setError('Failed to load campaign details');
      }
    } catch (err) {
      setError('Failed to load campaign details');
    }
  };

  const loadOffers = async () => {
    try {
      const response = await fetch(`/api/offers?campaign_id=${campaignId}`);
      if (response.ok) {
        const data = await response.json();
        setOffers(data.offers || []);
      } else {
        setError('Failed to load offers');
      }
    } catch (err) {
      setError('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;

    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setOffers(offers.filter(offer => offer.id !== offerId));
      } else {
        setError('Failed to delete offer');
      }
    } catch (err) {
      setError('Failed to delete offer');
    }
  };

  const handleUpdateOffer = async (offerData) => {
    try {
      const response = await fetch(`/api/offers/${selectedOffer.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offerData),
      });

      if (response.ok) {
        const data = await response.json();
        setOffers(offers.map(offer => 
          offer.id === selectedOffer.id ? data.offer : offer
        ));
        setShowOfferSheet(false);
        setSelectedOffer(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update offer');
      }
    } catch (err) {
      throw err;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-500', text: 'Draft' },
      sent: { color: 'bg-blue-500', text: 'Sent' },
      accepted: { color: 'bg-green-500', text: 'Accepted' },
      rejected: { color: 'bg-red-500', text: 'Rejected' },
      counter_offer: { color: 'bg-orange-500', text: 'Counter Offer' },
      paid_escrow: { color: 'bg-purple-500', text: 'Paid (Escrow)' },
      in_progress: { color: 'bg-yellow-500', text: 'In Progress' },
      submitted: { color: 'bg-indigo-500', text: 'Submitted' },
      approved: { color: 'bg-green-600', text: 'Approved' },
      completed: { color: 'bg-emerald-500', text: 'Completed' },
      cancelled: { color: 'bg-gray-600', text: 'Cancelled' },
      refunded: { color: 'bg-red-600', text: 'Refunded' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return <Badge className={`${config.color} text-white`}>{config.text}</Badge>;
  };

  const openOfferSheet = (offer, mode) => {
    setSelectedOffer(offer);
    setOfferSheetMode(mode);
    setShowOfferSheet(true);
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="brand">
        <Container className="py-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </Container>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="brand">
      <Container className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/brand/campaigns/${campaignId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaign
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Campaign Offers</h1>
              <p className="text-gray-600">
                Campaign: {campaign?.title || `Campaign ${campaignId}`}
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push(`/brand/campaigns/${campaignId}/offers/create`)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Offer
          </Button>
        </div>

        {error && (
          <Alert className="border-red-500">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Campaign Summary */}
        {campaign && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Offers</p>
                  <p className="text-2xl font-bold">{offers.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Accepted</p>
                  <p className="text-2xl font-bold text-green-600">
                    {offers.filter(o => o.status === 'accepted').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {offers.filter(o => o.status === 'sent').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold">
                    {formatPrice(
                      offers.reduce((sum, offer) => sum + (offer.total_cents || 0), 0),
                      campaign.currency
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Offers List */}
        <Card>
          <CardHeader>
            <CardTitle>Offers</CardTitle>
          </CardHeader>
          <CardContent>
            {offers.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">No offers created yet</p>
                <p className="text-gray-500 mb-6">
                  Start by creating your first offer to a creator
                </p>
                <Button
                  onClick={() => router.push(`/brand/campaigns/${campaignId}/offers/create`)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Offer
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {offers.map((offer) => (
                  <Card key={offer.id} className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {offer.creator_profile?.full_name || 'Unknown Creator'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {offer.deliverable_type?.replace('_', ' ')} • {offer.quantity}x
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-medium">
                              {formatPrice(offer.total_cents, offer.currency)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Due: {formatDate(offer.deadline) || 'Not set'}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(offer.status)}
                          </div>
                        </div>
                      </div>

                      {offer.description && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {offer.description}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end space-x-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openOfferSheet(offer, 'view')}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {(offer.status === 'draft' || offer.status === 'sent') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openOfferSheet(offer, 'edit')}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        )}
                        {offer.status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteOffer(offer.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Offer Sheet Modal */}
        {showOfferSheet && selectedOffer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <OfferSheet
                  offer={selectedOffer}
                  campaignId={campaignId}
                  mode={offerSheetMode}
                  userRole="brand"
                  onSubmit={handleUpdateOffer}
                  onCancel={() => {
                    setShowOfferSheet(false);
                    setSelectedOffer(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </Container>
    </ProtectedRoute>
  );
};

export default OffersPage;