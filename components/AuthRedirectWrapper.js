'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function AuthRedirectWrapper({ children }) {
  const { user, profile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user || !profile) return

    console.log('AuthRedirectWrapper: User authenticated', { 
      userId: user.id, 
      userRole: profile.role, 
      currentPath: pathname 
    })

    // CRITICAL FIX: Don't redirect if user explicitly visits login/signup pages
    // This prevents jarring experience where users can't access login form
    if (pathname.includes('/auth/login') || pathname.includes('/auth/signup')) {
      console.log('AuthRedirectWrapper: User on auth page - respecting their intent, no redirect')
      return
    }

    // Only redirect from homepage to dashboard (prevent jarring redirects from other pages)
    if (pathname === '/') {
      setLoading(true)

      // Show welcome back message for better UX
      const welcomeMessage = document.createElement('div')
      welcomeMessage.id = 'welcome-back-message'
      welcomeMessage.className = 'fixed top-4 right-4 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white px-6 py-3 rounded-lg shadow-lg z-50 font-medium'
      welcomeMessage.innerHTML = `👋 Welcome back, ${profile.full_name || profile.email}! Taking you to your dashboard...`
      
      // Remove any existing welcome message
      const existingMessage = document.getElementById('welcome-back-message')
      if (existingMessage) {
        existingMessage.remove()
      }
      
      document.body.appendChild(welcomeMessage)

      // Smooth redirect after showing welcome message
      const redirectTimeout = setTimeout(() => {
        console.log('AuthRedirectWrapper: Redirecting from homepage to dashboard')
        
        let dashboardPath = '/brand/dashboard' // Default
        
        if (profile.role === 'creator') {
          dashboardPath = '/creator/dashboard'
        } else if (profile.role === 'admin') {
          dashboardPath = '/admin/panel'
        }
        
        console.log('AuthRedirectWrapper: Dashboard path determined:', dashboardPath)
        
        // Clean up welcome message before redirect
        welcomeMessage.remove()
        
        // Use Next.js router for smooth navigation
        router.replace(dashboardPath)
        
      }, 2000) // 2 second delay to show welcome message

      return () => {
        clearTimeout(redirectTimeout)
        const msg = document.getElementById('welcome-back-message')
        if (msg) msg.remove()
      }
    }
  }, [user, profile, pathname, router])

  // Show loading only when actually redirecting from homepage
  if (loading && pathname === '/') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8A2BE2]"></div>
      </div>
    )
  }

  // For all other cases, just render children - doesn't render anything when not loading/redirecting
  return children
}