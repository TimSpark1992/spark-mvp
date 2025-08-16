'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Users, Target, DollarSign } from 'lucide-react';
import OfferSheet from '@/components/marketplace/OfferSheet';
import CostEstimator from '@/components/marketplace/CostEstimator';

const CreateOfferPage = () => {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id;

  const [campaign, setCampaign] = useState(null);
  const [creators, setCreators] = useState([]);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [showOfferSheet, setShowOfferSheet] = useState(false);
  const [showCostEstimator, setShowCostEstimator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCampaignData();
    loadAvailableCreators();
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

  const loadAvailableCreators = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/applications`);
      if (response.ok) {
        const data = await response.json();
        // Get creators who have applied to this campaign
        setCreators(data.applications?.map(app => app.creator) || []);
      } else {
        // If no applications API, load all creators as fallback
        const creatorsResponse = await fetch('/api/profiles?role=creator');
        if (creatorsResponse.ok) {
          const creatorsData = await creatorsResponse.json();
          setCreators(creatorsData.profiles || []);
        }
      }
    } catch (err) {
      console.error('Failed to load creators:', err);
    } finally {
      setLoading(false);
    }
  };

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
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/brand/campaigns/${campaignId}/offers`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create offer');
      }
    } catch (err) {
      throw err;
    }
  };

  const formatPrice = (cents, currency = 'USD') => {
    const symbols = { USD: '$', MYR: 'RM', SGD: 'S$' };
    return `${symbols[currency]}${(cents / 100).toFixed(2)}`;
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
              <h1 className="text-2xl font-bold text-gray-900">Create Offer</h1>
              <p className="text-gray-600">
                Campaign: {campaign?.title || `Campaign ${campaignId}`}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Alert className="border-red-500">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Campaign Context Card */}
        {campaign && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Campaign Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Campaign</p>
                  <p className="font-medium">{campaign.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Budget</p>
                  <p className="font-medium">{formatPrice(campaign.budget_cents, campaign.currency)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deadline</p>
                  <p className="font-medium">
                    {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
              </div>
              {campaign.description && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-800">{campaign.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Creator Selection */}
        {!selectedCreator && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Select Creator
              </CardTitle>
            </CardHeader>
            <CardContent>
              {creators.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No creators available</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Creators will appear here once they apply to your campaign
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {creators.map((creator) => (
                    <Card
                      key={creator.id}
                      className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-purple-500"
                      onClick={() => setSelectedCreator(creator)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">{creator.full_name}</p>
                            <p className="text-sm text-gray-600">@{creator.username || 'creator'}</p>
                          </div>
                        </div>
                        <div className="mt-3 space-y-1">
                          <p className="text-sm">
                            <span className="text-gray-600">Followers:</span> {creator.followers_count?.toLocaleString() || 'N/A'}
                          </p>
                          <p className="text-sm">
                            <span className="text-gray-600">Category:</span> {creator.categories?.join(', ') || 'General'}
                          </p>
                        </div>
                        <Button className="w-full mt-3" size="sm">
                          Select Creator
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Selected Creator & Actions */}
        {selectedCreator && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Creator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedCreator.full_name}</p>
                    <p className="text-sm text-gray-600">@{selectedCreator.username || 'creator'}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCostEstimator(true)}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Cost Estimator
                  </Button>
                  <Button
                    onClick={() => setShowOfferSheet(true)}
                  >
                    Create Offer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCreator(null)}
                  >
                    Change Creator
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cost Estimator Modal */}
        {showCostEstimator && selectedCreator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Cost Estimator</h3>
                <CostEstimator
                  creatorId={selectedCreator.id}
                  onClose={() => setShowCostEstimator(false)}
                  onCreateOffer={(estimatedData) => {
                    setShowCostEstimator(false);
                    setShowOfferSheet(true);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Offer Sheet Modal */}
        {showOfferSheet && selectedCreator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
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
    </ProtectedRoute>
  );
};

export default CreateOfferPage;