'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth callback error:', error)
        router.push('/auth/login?error=callback_error')
        return
      }

      if (data.session) {
        // Check if user has a profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single()

        if (profileError || !profile) {
          // Redirect to role selection if no profile exists
          router.push('/auth/signup')
        } else {
          // Redirect based on role
          if (profile.role === 'creator') {
            router.push('/creator/dashboard')
          } else if (profile.role === 'brand') {
            router.push('/brand/dashboard')
          } else if (profile.role === 'admin') {
            router.push('/admin/panel')
          } else {
            router.push('/')
          }
        }
      } else {
        router.push('/auth/login')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">
          Completing sign in...
        </h2>
        <p className="mt-2 text-gray-600">
          Please wait while we set up your account.
        </p>
      </div>
    </div>
  )
}