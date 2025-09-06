'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { useRouter, usePathname } from 'next/navigation'

export default function ProtectedRoute({ children, requiredRole = null, redirectTo = '/auth/login' }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [showUnauthorized, setShowUnauthorized] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Only redirect to login if user is not authenticated
        console.log('🔓 ProtectedRoute: No user - redirecting to login')
        router.push(redirectTo)
        return
      }

      // Add additional check: if requiredRole is specified but profile is not loaded yet, wait
      if (requiredRole && !profile) {
        console.log('🔄 ProtectedRoute: Profile still loading, waiting...')
        return
      }

      if (requiredRole && profile?.role !== requiredRole) {
        // Instead of automatic redirect, show unauthorized message
        // This prevents unwanted redirects and data loss
        console.log('❌ ProtectedRoute: User role mismatch', {
          required: requiredRole,
          userRole: profile?.role,
          currentPath: pathname,
          profileLoaded: !!profile
        })
        setShowUnauthorized(true)
        return
      }
      
      // User is authorized for this page
      console.log('✅ ProtectedRoute: Access granted', {
        userRole: profile?.role,
        requiredRole,
        currentPath: pathname
      })
      setShowUnauthorized(false)
    }
  }, [user, profile, loading, requiredRole, redirectTo, router, pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F1A]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8A2BE2] mx-auto"></div>
          <p className="text-white">
            {user === null ? 'Redirecting to login...' : 'Loading your profile...'}
          </p>
          <p className="text-gray-400 text-sm">
            This should only take a few seconds
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  if (showUnauthorized) {
    // Show unauthorized message instead of automatic redirect
    const allowedRole = requiredRole === 'brand' ? 'Brand' : 
                       requiredRole === 'creator' ? 'Creator' : 
                       requiredRole === 'admin' ? 'Admin' : 'User'
    
    const userDashboard = profile?.role === 'creator' ? '/creator/dashboard' : 
                         profile?.role === 'brand' ? '/brand/dashboard' :
                         profile?.role === 'admin' ? '/admin/panel' : '/'

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F1A] text-white">
        <div className="text-center space-y-6 max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Access Restricted</h2>
            <p className="text-gray-400">
              This page is only accessible to {allowedRole} users. 
              You are currently logged in as a {profile?.role || 'User'}.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => router.push(userDashboard)}
              className="w-full bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] hover:from-[#7A1FD2] hover:to-[#E61483] text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
            >
              Go to My Dashboard
            </button>
            <button
              onClick={() => router.back()}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return children
}