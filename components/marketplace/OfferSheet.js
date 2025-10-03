'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DollarSign, Clock, User, Package, CheckCircle, XCircle, Edit } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/formatters';

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
  // MINIMAL TEST VERSION - Just render basic content to test modal functionality
  console.log('🧪 OfferSheet TEST VERSION - Rendering with offer ID:', offer?.id, 'Mode:', mode);
  
  return (
    <div className="p-6 bg-white rounded-lg">
      <h2 className="text-xl font-bold mb-4">Test OfferSheet Modal</h2>
      <p>Offer ID: {offer?.id || 'No ID'}</p>
      <p>Mode: {mode}</p>
      <p>Campaign ID: {campaignId}</p>
      <div className="mt-4">
        <Button onClick={onCancel} variant="secondary">
          Close
        </Button>
      </div>
    </div>
  );

  // OLD CODE COMMENTED OUT FOR TESTING
  /*
  const [formData, setFormData] = useState({
    campaign_id: campaignId,
    creator_id: creatorId,
    brand_id: null, // Will be set from user context
    deliverable_type: '',
    quantity: 1,
    currency: 'USD',
    base_price_cents: 0,
    rush_fee_pct: 0,
    platform_fee_pct: 20,
    subtotal_cents: 0,
    total_cents: 0,
    description: '',
    requirements: '',
    deadline: '',
    status: 'drafted'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // TEMPORARY SIMPLIFIED VERSION - Skip complex data processing to test modal functionality
  useEffect(() => {
    if (offer && mode !== 'create') {
      console.log('🔍 OfferSheet: SIMPLIFIED MODE - Processing offer data:', offer?.id)
      
      // MINIMAL DATA PROCESSING - just set basic form data without complex parsing
      const simpleFormData = {
        id: offer.id || '',
        campaign_id: offer.campaign_id || '',
        creator_id: offer.creator_id || '',
        brand_id: offer.brand_id || '',
        deliverable_type: offer.deliverable_type || 'IG_Reel',
        quantity: offer.quantity || 1,
        base_price_cents: offer.base_price_cents || 0,
        rush_fee_pct: offer.rush_fee_pct || 0,
        currency: offer.currency || 'USD',
        status: offer.status || 'drafted',
        deadline: '',
        description: offer.notes || 'No description',
        // Skip all JSONB parsing for now
        subtotal_cents: offer.subtotal_cents || 0,
        total_cents: offer.total_cents || 0,
        platform_fee_pct: offer.platform_fee_pct || 20
      }
      
      console.log('💾 Setting SIMPLIFIED form data for offer:', offer.id)
      setFormData(simpleFormData);
    }
  }, [offer, mode]);

  // Initialize form data with Cost Estimator data when creating new offer
  useEffect(() => {
    if (estimatedData && mode === 'create') {
      const firstItem = estimatedData.items?.[0];
      if (firstItem) {
        setFormData(prev => ({
          ...prev,
          campaign_id: campaignId,
          creator_id: creatorId,
          brand_id: brandId,
          deliverable_type: firstItem.deliverable_type || '',
          quantity: firstItem.qty || 1,
          currency: estimatedData.currency || 'USD',
          base_price_cents: firstItem.unit_price_cents || 0,
          rush_fee_pct: firstItem.rush_pct || 0,
          platform_fee_pct: estimatedData.platform_fee_pct || 20,
          subtotal_cents: estimatedData.subtotal_cents || 0,
          total_cents: estimatedData.total_cents || 0,
          status: 'drafted'
        }));
      }
    }
  }, [estimatedData, mode, campaignId, creatorId, brandId]);

  // Calculate pricing when relevant fields change
  useEffect(() => {
    const subtotal = formData.base_price_cents * formData.quantity;
    const rushFee = Math.round(subtotal * (formData.rush_fee_pct / 100));
    const subtotalWithRush = subtotal + rushFee;
    const platformFee = Math.round(subtotalWithRush * (formData.platform_fee_pct / 100));
    const total = subtotalWithRush + platformFee;

    setFormData(prev => ({
      ...prev,
      subtotal_cents: subtotalWithRush,
      total_cents: total
    }));
  }, [formData.base_price_cents, formData.quantity, formData.rush_fee_pct, formData.platform_fee_pct]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.creator_id) return 'Please select a creator';
    if (!formData.deliverable_type) return 'Please select a deliverable type';
    if (formData.base_price_cents <= 0) return 'Please enter a valid base price';
    if (formData.quantity <= 0) return 'Please enter a valid quantity';
    if (!formData.description.trim()) return 'Please provide a description';
    if (!formData.deadline) return 'Please set a deadline';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convert deadline to ISO format
      const offerData = {
        ...formData,
        deadline: new Date(formData.deadline + 'T23:59:59').toISOString()
      };

      await onSubmit(offerData);
      setSuccess('Offer submitted successfully!');
      
      // Reset form if creating new offer
      if (mode === 'create') {
        setTimeout(() => {
          setFormData({
            campaign_id: campaignId,
            creator_id: creatorId,
            brand_id: null,
            deliverable_type: '',
            quantity: 1,
            currency: 'USD',
            base_price_cents: 0,
            rush_fee_pct: 0,
            platform_fee_pct: 20,
            subtotal_cents: 0,
            total_cents: 0,
            description: '',
            requirements: '',
            deadline: '',
            status: 'drafted'
          });
          setSuccess('');
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit offer');
    } finally {
      setLoading(false);
    }
  };

  const handleOfferAction = async (action, counterOfferData = null) => {
    setLoading(true);
    setError('');

    try {
      if (action === 'accept' && onAccept) {
        await onAccept(offer.id);
        setSuccess('Offer accepted successfully!');
      } else if (action === 'reject' && onReject) {
        await onReject(offer.id);
        setSuccess('Offer rejected');
      } else if (action === 'counter' && onCounterOffer && counterOfferData) {
        await onCounterOffer(offer.id, counterOfferData);
        setSuccess('Counter-offer submitted!');
      }
    } catch (err) {
      setError(err.message || `Failed to ${action} offer`);
    } finally {
      setLoading(false);
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

  if (mode === 'view') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Offer Details</CardTitle>
            {getStatusBadge(offer?.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-500">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-500">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Deliverable Type</label>
                <div className="flex items-center mt-1">
                  <Package className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{formData.deliverable_type?.replace('_', ' ')}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Quantity</label>
                <div className="flex items-center mt-1">
                  <span className="font-medium">{formData.quantity}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Deadline</label>
                <div className="flex items-center mt-1">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  <span>{formatDate(offer?.deadline) || 'Not set'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Pricing</label>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Base Price:</span>
                    <span>{formatPrice(formData.base_price_cents * formData.quantity, formData.currency)}</span>
                  </div>
                  {formData.rush_fee_pct > 0 && (
                    <div className="flex justify-between">
                      <span>Rush Fee ({formData.rush_fee_pct}%):</span>
                      <span>{formatPrice(Math.round(formData.base_price_cents * formData.quantity * (formData.rush_fee_pct / 100)), formData.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(formData.subtotal_cents, formData.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee ({formData.platform_fee_pct}%):</span>
                    <span>{formatPrice(Math.round(formData.subtotal_cents * (formData.platform_fee_pct / 100)), formData.currency)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatPrice(formData.total_cents, formData.currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <p className="mt-1 text-gray-900">{offer?.description || 'No description provided'}</p>
            </div>

            {offer?.requirements && (
              <div>
                <label className="text-sm font-medium text-gray-700">Requirements</label>
                <p className="mt-1 text-gray-900">{offer.requirements}</p>
              </div>
            )}
          </div>

          {/* Action buttons for creators */}
          {userRole === 'creator' && offer?.status === 'sent' && (
            <div className="flex space-x-3 pt-4 border-t">
              <Button
                onClick={() => handleOfferAction('accept')}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Accept Offer
              </Button>
              <Button
                onClick={() => handleOfferAction('reject')}
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                Reject Offer
              </Button>
              <Button
                onClick={() => {
                  // Implement counter-offer modal/form logic
                  const counterPrice = prompt(`Current offer: ${formatPrice(offer.total_cents, offer.currency)}\nEnter your counter-offer amount (in ${offer.currency}):`);
                  if (counterPrice) {
                    const counterCents = Math.round(parseFloat(counterPrice) * 100);
                    if (counterCents > 0) {
                      handleOfferAction('counter', { total_cents: counterCents });
                    }
                  }
                }}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                Counter Offer
              </Button>
            </div>
          )}

          {/* Close button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onCancel} variant="outline">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? (estimatedData ? 'Summary' : 'Create New Offer') : 
           mode === 'edit' ? 'Edit Offer' : 'Offer Details'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert className="border-red-500">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-500">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {estimatedData && mode === 'create' && (
            <Alert className="border-blue-500 bg-blue-50/10">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-blue-200">
                ✨ Form pre-filled with Cost Estimator data. You can review and adjust the details below before creating the offer.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deliverable Type *
                </label>
                {estimatedData ? (
                  // Show as read-only when pre-filled from Cost Estimator
                  <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Package className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-900">
                      {formData.deliverable_type?.replace('_', ' ') || 'Not specified'}
                    </span>
                    <Badge variant="outline" className="ml-auto text-xs text-blue-700 bg-blue-100 border-blue-300">
                      Selected from Cost Estimator
                    </Badge>
                  </div>
                ) : (
                  // Show dropdown when creating manually
                  <Select value={formData.deliverable_type} onValueChange={(value) => handleInputChange('deliverable_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select deliverable type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IG_Reel">Instagram Reel</SelectItem>
                      <SelectItem value="IG_Story">Instagram Story</SelectItem>
                      <SelectItem value="TikTok_Post">TikTok Post</SelectItem>
                      <SelectItem value="YouTube_Video">YouTube Video</SelectItem>
                      <SelectItem value="YouTube_Short">YouTube Short</SelectItem>
                      <SelectItem value="Bundle">Bundle</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency *
                </label>
                <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="MYR">MYR (RM)</SelectItem>
                    <SelectItem value="SGD">SGD (S$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Price (per item) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-10"
                    value={formData.base_price_cents / 100}
                    onChange={(e) => handleInputChange('base_price_cents', Math.round(parseFloat(e.target.value || 0) * 100))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rush Fee (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="200"
                  value={formData.rush_fee_pct}
                  onChange={(e) => handleInputChange('rush_fee_pct', parseInt(e.target.value) || 0)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline *
                </label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pricing Summary
                </label>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Base Price:</span>
                    <span>{formatPrice(formData.base_price_cents * formData.quantity, formData.currency)}</span>
                  </div>
                  {formData.rush_fee_pct > 0 && (
                    <div className="flex justify-between">
                      <span>Rush Fee ({formData.rush_fee_pct}%):</span>
                      <span>{formatPrice(Math.round(formData.base_price_cents * formData.quantity * (formData.rush_fee_pct / 100)), formData.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(formData.subtotal_cents, formData.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee ({formData.platform_fee_pct}%):</span>
                    <span>{formatPrice(Math.round(formData.subtotal_cents * (formData.platform_fee_pct / 100)), formData.currency)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatPrice(formData.total_cents, formData.currency)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <Textarea
                  rows={4}
                  placeholder="Describe the offer details, expectations, and deliverables..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Requirements
                </label>
                <Textarea
                  rows={3}
                  placeholder="Any specific requirements, guidelines, or instructions..."
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {mode === 'create' ? 'Create Offer' : 'Update Offer'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default OfferSheet;