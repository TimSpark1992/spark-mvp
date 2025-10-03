'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

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
  console.log('🧪 OfferSheet CLEAN TEST VERSION - Props:', {
    offerId: offer?.id,
    mode,
    campaignId,
    userRole
  });
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">🧪 Test Modal</h2>
          
          <div className="space-y-3 mb-6 text-left">
            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm font-medium text-gray-700">Offer ID:</p>
              <p className="text-gray-900">{offer?.id || 'No ID'}</p>
            </div>
            
            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm font-medium text-gray-700">Mode:</p>
              <p className="text-gray-900">{mode}</p>
            </div>
            
            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm font-medium text-gray-700">Campaign ID:</p>
              <p className="text-gray-900">{campaignId}</p>
            </div>
            
            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm font-medium text-gray-700">Status:</p>
              <p className="text-gray-900">{offer?.status || 'Unknown'}</p>
            </div>
            
            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm font-medium text-gray-700">User Role:</p>
              <p className="text-gray-900">{userRole}</p>
            </div>
          </div>
          
          <Button 
            onClick={onCancel} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Close Test Modal
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OfferSheet;