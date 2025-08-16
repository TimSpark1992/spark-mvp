'use client'

import Navbar from './Navbar'
import { useAuth } from '@/components/AuthProvider'
import { sparkTheme } from '@/lib/theme'

export default function Layout({ 
  children, 
  variant = 'app',
  showNavbar = true,
  className = ''
}) {
  const { profile } = useAuth()
  
  return (
    <div className={`min-h-screen bg-[#0F0F1A] text-white font-inter ${className}`}>
      {showNavbar && <Navbar variant={variant} role={profile?.role} />}
      <main className={showNavbar ? 'pt-16' : ''}>
        {children}
      </main>
    </div>
  )
}