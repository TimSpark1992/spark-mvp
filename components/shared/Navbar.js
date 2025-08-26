'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, MessageCircle, LogOut, User } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useAuth } from '@/components/AuthProvider'
import { signOut } from '@/lib/supabase'
import { sparkTheme } from '@/lib/theme'

export default function Navbar({ variant = 'landing', role = null }) {
  const router = useRouter()
  const { user, profile, isAuthenticated } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      console.log('🔐 Logging out user...')
      
      const { error } = await signOut()
      
      if (error) {
        console.error('❌ Logout error:', error)
        // Even if there's an error, still redirect to clear local state
      } else {
        console.log('✅ Logout successful')
      }
      
      // Always redirect to home page after logout attempt
      router.push('/')
      
    } catch (error) {
      console.error('❌ Logout failed:', error)
      // Still redirect even if logout fails to clear local state
      router.push('/')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const navigationItems = {
    landing: [
      { name: 'Why Spark', href: '#why-spark' },
      { name: 'How It Works', href: '#how-it-works' },
      { name: 'Benefits', href: '#benefits' },
      { name: 'Testimonials', href: '#testimonials' },
      { name: 'FAQ', href: '#faq' }
    ],
    app: role === 'brand' ? [
      { name: 'Dashboard', href: '/brand/dashboard' },
      { name: 'Campaigns', href: '/brand/campaigns' },
      { name: 'Messages', href: '/messages', icon: MessageCircle },
      { name: 'Profile', href: '/brand/profile' }
    ] : role === 'creator' ? [
      { name: 'Dashboard', href: '/creator/dashboard' },
      { name: 'Campaigns', href: '/creator/campaigns' },
      { name: 'Messages', href: '/messages', icon: MessageCircle },
      { name: 'Profile', href: '/creator/profile' }
    ] : [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Campaigns', href: '/campaigns' },
      { name: 'Messages', href: '/messages', icon: MessageCircle },
      { name: 'Profile', href: '/profile' }
    ]
  }

  const items = navigationItems[variant] || navigationItems.landing

  return (
    <nav className={sparkTheme.layout.navigation.position + ' ' + sparkTheme.layout.navigation.background}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-white tracking-tight hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-[#8A2BE2] hover:to-[#FF1493] transition-all cursor-pointer">
                SPARK
              </h1>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {items.map((item) => (
              <Link 
                key={item.name}
                href={item.href}
                className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.name}
              </Link>
            ))}
          </div>
          
          {/* CTA Button */}
          <div className="hidden md:block">
            <Link href="/auth/signup">
              <Button variant="primary" size="sm">
                Sign Up
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col space-y-4">
              {items.map((item) => (
                <Link 
                  key={item.name}
                  href={item.href}
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.name}
                </Link>
              ))}
              <Link href="/auth/signup">
                <Button variant="primary" size="sm" className="w-full">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}