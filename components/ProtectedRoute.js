'use client'

import { useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'

export default function ProtectedRoute({ children, requiredRole = null, redirectTo = '/auth/login' }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo)
        return
      }

      if (requiredRole && profile?.role !== requiredRole) {
        // Redirect to appropriate dashboard if user has wrong role
        if (profile?.role === 'creator') {
          router.push('/creator/dashboard')
        } else if (profile?.role === 'brand') {
          router.push('/brand/dashboard')
        } else if (profile?.role === 'admin') {
          router.push('/admin/panel')
        } else {
          router.push('/')
        }
        return
      }
    }
  }, [user, profile, loading, requiredRole, redirectTo, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || (requiredRole && profile?.role !== requiredRole)) {
    return null
  }

  return children
}