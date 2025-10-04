'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

const OffersPage = () => {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id

  console.log('🧪 MINIMAL OFFERS PAGE - Campaign ID:', campaignId);

  return (
    <ProtectedRoute requiredRole="brand">
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">🧪 Test Offers Page</h1>
          
          <div className="bg-white rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Page Information</h2>
            <div className="space-y-2">
              <p><strong>Campaign ID:</strong> {campaignId}</p>
              <p><strong>Status:</strong> Page loaded successfully</p>
              <p><strong>Components:</strong> Minimal imports only</p>
            </div>
          </div>
          
          <div className="bg-blue-100 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Test Actions</h2>
            <div className="space-y-4">
              <button 
                onClick={() => router.push('/brand/dashboard')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                ← Back to Dashboard
              </button>
              
              <button 
                onClick={() => console.log('Test button clicked')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-4"
              >
                Test Button (Check Console)
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default OffersPage