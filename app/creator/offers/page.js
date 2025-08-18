'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Eye, DollarSign, Clock, CheckCircle, XCircle, AlertTriangle, Package } from 'lucide-react';
import OfferSheet from '@/components/marketplace/OfferSheet';
import { useAuth } from '@/components/AuthProvider';

const CreatorOffersPage = () => {
  const router = useRouter();
  const { profile } = useAuth();
  
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showOfferSheet, setShowOfferSheet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [dataLoaded, setDataLoaded] = useState(false);

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

  const handleOfferAction = async (offerId, action, counterData = null) => {
    try {
      const response = await fetch(`/api/offers/${offerId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action,
          ...counterData
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the offer in the list
        setOffers(offers.map(offer => 
          offer.id === offerId ? { ...offer, status: data.offer.status } : offer
        ));
        setShowOfferSheet(false);
        setSelectedOffer(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} offer`);
      }
    } catch (err) {
      throw err;
    }
  };

  const formatPrice = (cents, currency = 'USD') => {
    const symbols = { USD: '$', MYR: 'RM', SGD: 'S$' };
    return `${symbols[currency]}${(cents / 100).toFixed(2)}`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-500', text: 'Draft', icon: Package },
      sent: { color: 'bg-blue-500', text: 'Pending', icon: Clock },
      accepted: { color: 'bg-green-500', text: 'Accepted', icon: CheckCircle },
      rejected: { color: 'bg-red-500', text: 'Rejected', icon: XCircle },
      counter_offer: { color: 'bg-orange-500', text: 'Counter Offer', icon: AlertTriangle },
      paid_escrow: { color: 'bg-purple-500', text: 'Paid (Escrow)', icon: DollarSign },
      in_progress: { color: 'bg-yellow-500', text: 'In Progress', icon: Clock },
      submitted: { color: 'bg-indigo-500', text: 'Submitted', icon: CheckCircle },
      approved: { color: 'bg-green-600', text: 'Approved', icon: CheckCircle },
      completed: { color: 'bg-emerald-500', text: 'Completed', icon: CheckCircle },
      cancelled: { color: 'bg-gray-600', text: 'Cancelled', icon: XCircle },
      refunded: { color: 'bg-red-600', text: 'Refunded', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-white flex items-center space-x-1`}>
        <Icon className="w-3 h-3" />
        <span>{config.text}</span>
      </Badge>
    );
  };

  const filterOffers = (status) => {
    if (status === 'all') return offers;
    if (status === 'pending') return offers.filter(o => o.status === 'sent');
    if (status === 'active') return offers.filter(o => ['accepted', 'paid_escrow', 'in_progress'].includes(o.status));
    if (status === 'completed') return offers.filter(o => ['submitted', 'approved', 'completed'].includes(o.status));
    return offers.filter(o => o.status === status);
  };

  const openOfferDetails = (offer) => {
    setSelectedOffer(offer);
    setShowOfferSheet(true);
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="creator">
        <Container className="py-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </Container>
      </ProtectedRoute>
    );
  }

  const pendingOffers = offers.filter(o => o.status === 'sent');
  const activeOffers = offers.filter(o => ['accepted', 'paid_escrow', 'in_progress'].includes(o.status));
  const completedOffers = offers.filter(o => ['submitted', 'approved', 'completed'].includes(o.status));

  return (
    <ProtectedRoute requiredRole="creator">
      <Container className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/creator/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Offers</h1>
              <p className="text-gray-600">
                Manage offers from brands and track your projects
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Alert className="border-red-500">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold text-blue-600">{pendingOffers.length}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold text-green-600">{activeOffers.length}</p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Package className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <p className="text-2xl font-bold text-emerald-600">{completedOffers.length}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold text-purple-600">
                  {formatPrice(
                    offers
                      .filter(o => ['accepted', 'paid_escrow', 'in_progress', 'submitted', 'approved', 'completed'].includes(o.status))
                      .reduce((sum, offer) => sum + (offer.total_cents || 0), 0)
                  )}
                </p>
                <p className="text-sm text-gray-600">Total Earnings</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Offers Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              Pending ({pendingOffers.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({activeOffers.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedOffers.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({offers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <OffersList 
              offers={pendingOffers} 
              onViewOffer={openOfferDetails}
              emptyMessage="No pending offers"
              emptyDescription="New offers from brands will appear here"
            />
          </TabsContent>

          <TabsContent value="active">
            <OffersList 
              offers={activeOffers} 
              onViewOffer={openOfferDetails}
              emptyMessage="No active offers"
              emptyDescription="Accepted offers currently in progress will appear here"
            />
          </TabsContent>

          <TabsContent value="completed">
            <OffersList 
              offers={completedOffers} 
              onViewOffer={openOfferDetails}
              emptyMessage="No completed offers"
              emptyDescription="Successfully completed offers will appear here"
            />
          </TabsContent>

          <TabsContent value="all">
            <OffersList 
              offers={offers} 
              onViewOffer={openOfferDetails}
              emptyMessage="No offers yet"
              emptyDescription="Offers from brands will appear here once they start reaching out"
            />
          </TabsContent>
        </Tabs>

        {/* Offer Details Modal */}
        {showOfferSheet && selectedOffer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <OfferSheet
                  offer={selectedOffer}
                  mode="view"
                  userRole="creator"
                  onAccept={(offerId) => handleOfferAction(offerId, 'accept')}
                  onReject={(offerId) => handleOfferAction(offerId, 'reject')}
                  onCounterOffer={(offerId, counterData) => handleOfferAction(offerId, 'counter', counterData)}
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

// Helper component for rendering offer lists
const OffersList = ({ offers, onViewOffer, emptyMessage, emptyDescription }) => {
  const formatPrice = (cents, currency = 'USD') => {
    const symbols = { USD: '$', MYR: 'RM', SGD: 'S$' };
    return `${symbols[currency]}${(cents / 100).toFixed(2)}`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-500', text: 'Draft' },
      sent: { color: 'bg-blue-500', text: 'Pending' },
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

  if (offers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">{emptyMessage}</p>
            <p className="text-gray-500">{emptyDescription}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {offers.map((offer) => (
        <Card key={offer.id} className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onViewOffer(offer)}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">
                    {offer.campaign_title || 'Untitled Campaign'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {offer.deliverable_type?.replace('_', ' ')} • {offer.quantity}x
                  </p>
                  <p className="text-sm text-gray-600">
                    From: {offer.brand_profile?.full_name || 'Brand'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {formatPrice(offer.total_cents, offer.currency)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Due: {offer.deadline ? new Date(offer.deadline).toLocaleDateString() : 'Not set'}
                  </p>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  {getStatusBadge(offer.status)}
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </div>
            </div>

            {offer.description && (
              <div className="mt-4 pl-16">
                <p className="text-sm text-gray-700 line-clamp-2">
                  {offer.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CreatorOffersPage;