'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  User,
  Calendar,
  Search,
  Download,
  RefreshCw,
  Eye,
  Plus
} from 'lucide-react';

const ManualPayoutsPage = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayouts, setSelectedPayouts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [processingPayout, setProcessingPayout] = useState(null);

  // Mock payout data for demonstration
  const mockPayouts = [
    {
      id: '1',
      creator_id: 'creator-1',
      creator_name: 'Sarah Johnson',
      creator_email: 'sarah@example.com',
      amount_cents: 45000, // $450.00
      currency: 'USD',
      status: 'pending',
      created_at: '2025-01-10T10:00:00Z',
      offer_id: 'offer-1',
      campaign_title: 'Summer Campaign 2025',
      payment_method: 'manual',
      notes: 'Stripe Connect not yet set up',
      priority: 'normal'
    },
    {
      id: '2',
      creator_id: 'creator-2',
      creator_name: 'Mike Chen',
      creator_email: 'mike@example.com',
      amount_cents: 78000, // $780.00
      currency: 'USD',
      status: 'processing',
      created_at: '2025-01-09T15:30:00Z',
      offer_id: 'offer-2',
      campaign_title: 'Product Launch Campaign',
      payment_method: 'manual',
      notes: 'High priority payout',
      priority: 'high'
    },
    {
      id: '3',
      creator_id: 'creator-3',
      creator_name: 'Emma Rodriguez',
      creator_email: 'emma@example.com',
      amount_cents: 32000, // $320.00
      currency: 'USD',
      status: 'completed',
      created_at: '2025-01-08T09:15:00Z',
      completed_at: '2025-01-08T14:30:00Z',
      offer_id: 'offer-3',
      campaign_title: 'Brand Awareness Campaign',
      payment_method: 'manual',
      notes: 'Paid via bank transfer',
      priority: 'normal'
    },
    {
      id: '4',
      creator_id: 'creator-4',
      creator_name: 'David Wilson',
      creator_email: 'david@example.com',
      amount_cents: 56000, // $560.00
      currency: 'USD',
      status: 'failed',
      created_at: '2025-01-07T16:45:00Z',
      offer_id: 'offer-4',
      campaign_title: 'Holiday Special Campaign',
      payment_method: 'manual',
      notes: 'Bank details incorrect - need update',
      priority: 'normal',
      failure_reason: 'Invalid bank account information'
    },
    {
      id: '5',
      creator_id: 'creator-5',
      creator_name: 'Lisa Thompson',
      creator_email: 'lisa@example.com',
      amount_cents: 92000, // $920.00
      currency: 'USD',
      status: 'pending',
      created_at: '2025-01-11T11:20:00Z',
      offer_id: 'offer-5',
      campaign_title: 'Influencer Collaboration',
      payment_method: 'manual',
      notes: 'Large payout - requires approval',
      priority: 'high'
    }
  ];

  const payoutStats = {
    total_payouts: mockPayouts.length,
    pending_payouts: mockPayouts.filter(p => p.status === 'pending').length,
    processing_payouts: mockPayouts.filter(p => p.status === 'processing').length,
    completed_payouts: mockPayouts.filter(p => p.status === 'completed').length,
    failed_payouts: mockPayouts.filter(p => p.status === 'failed').length,
    total_pending_amount: mockPayouts
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount_cents, 0),
    total_completed_amount: mockPayouts
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount_cents, 0)
  };

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      // In production, this would call: const response = await fetch('/api/admin/payouts');
      // For now, use mock data
      setTimeout(() => {
        setPayouts(mockPayouts);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to load payouts');
      setLoading(false);
    }
  };

  const formatPrice = (cents, currency = 'USD') => {
    const symbols = { USD: '$', MYR: 'RM', SGD: 'S$' };
    return `${symbols[currency]}${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500', text: 'Pending', icon: Clock },
      processing: { color: 'bg-blue-500', text: 'Processing', icon: RefreshCw },
      completed: { color: 'bg-green-500', text: 'Completed', icon: CheckCircle },
      failed: { color: 'bg-red-500', text: 'Failed', icon: XCircle },
      cancelled: { color: 'bg-gray-500', text: 'Cancelled', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white flex items-center space-x-1`}>
        <Icon className="w-3 h-3" />
        <span>{config.text}</span>
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'high') {
      return <Badge className="bg-red-100 text-red-800 border-red-300">High Priority</Badge>;
    }
    return null;
  };

  const handleProcessPayout = async (payoutId, action) => {
    try {
      setProcessingPayout(payoutId);
      
      // In production, this would call the API:
      // const response = await fetch(`/api/admin/payouts/${payoutId}/release`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ action })
      // });

      // Simulate API call
      setTimeout(() => {
        setPayouts(payouts.map(payout => 
          payout.id === payoutId 
            ? { ...payout, status: action === 'approve' ? 'processing' : 'failed' }
            : payout
        ));
        setProcessingPayout(null);
        setSuccess(`Payout ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
        setTimeout(() => setSuccess(''), 3000);
      }, 1500);
    } catch (err) {
      setError('Failed to process payout');
      setProcessingPayout(null);
      setTimeout(() => setError(''), 3000);
    }
  };

  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch = payout.creator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payout.creator_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payout.campaign_title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <Container className="py-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </Container>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <Container className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manual Payouts</h1>
            <p className="text-gray-600">
              Process manual payouts and manage creator payments
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={loadPayouts}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Payout
            </Button>
          </div>
        </div>

        {/* Alerts */}
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{payoutStats.pending_payouts}</p>
                  <p className="text-xs text-gray-600">Pending Payouts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-full">
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{payoutStats.processing_payouts}</p>
                  <p className="text-xs text-gray-600">Processing</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-full">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {formatPrice(payoutStats.total_pending_amount)}
                  </p>
                  <p className="text-xs text-gray-600">Pending Amount</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-full">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {formatPrice(payoutStats.total_completed_amount)}
                  </p>
                  <p className="text-xs text-gray-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by creator name, email, or campaign..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payouts List */}
        <Card>
          <CardHeader>
            <CardTitle>Payout Queue ({filteredPayouts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPayouts.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No payouts found</p>
                <p className="text-sm text-gray-500 mt-2">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Payouts will appear here when creators complete work'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayouts.map((payout) => (
                  <Card key={payout.id} className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">{payout.creator_name}</p>
                            <p className="text-sm text-gray-600">{payout.creator_email}</p>
                            <p className="text-sm text-gray-500">{payout.campaign_title}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {formatPrice(payout.amount_cents, payout.currency)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(payout.created_at)}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(payout.status)}
                            {getPriorityBadge(payout.priority)}
                          </div>
                        </div>
                      </div>

                      {payout.notes && (
                        <div className="mt-3 pl-14">
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            <strong>Notes:</strong> {payout.notes}
                          </p>
                        </div>
                      )}

                      {payout.failure_reason && (
                        <div className="mt-3 pl-14">
                          <Alert className="border-red-300 bg-red-50">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Failure Reason:</strong> {payout.failure_reason}
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        
                        {payout.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleProcessPayout(payout.id, 'approve')}
                              disabled={processingPayout === payout.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {processingPayout === payout.id ? (
                                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-1" />
                              )}
                              Approve Payout
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleProcessPayout(payout.id, 'reject')}
                              disabled={processingPayout === payout.id}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        
                        {payout.status === 'failed' && (
                          <Button
                            size="sm"
                            onClick={() => handleProcessPayout(payout.id, 'retry')}
                            disabled={processingPayout === payout.id}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Retry Payout
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
      </Container>
    </ProtectedRoute>
  );
};

export default ManualPayoutsPage;