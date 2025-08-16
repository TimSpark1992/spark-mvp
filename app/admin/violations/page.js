'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Container } from '@/components/shared/Container';
import ViolationMonitor from '@/components/marketplace/ViolationMonitor';

export default function AdminViolationsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <Container className="py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Violation Management</h1>
              <p className="text-gray-600">
                Monitor and manage anti-disintermediation policy violations
              </p>
            </div>
          </div>

          <ViolationMonitor />
        </div>
      </Container>
    </ProtectedRoute>
  );
}