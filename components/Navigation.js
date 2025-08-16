'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { Button } from '@/components/ui/button'
import { Menu, X, Zap } from 'lucide-react'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, profile } = useAuth()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-montserrat font-bold text-gray-900">Spark</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#why-spark" className="text-gray-600 hover:text-gray-900">
              Why Spark
            </Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900">
              How It Works
            </Link>
            <Link href="#testimonials" className="text-gray-600 hover:text-gray-900">
              Testimonials
            </Link>

            {user && profile ? (
              <div className="flex items-center space-x-4">
                <Link 
                  href={profile.role === 'creator' ? '/creator/dashboard' : profile.role === 'brand' ? '/brand/dashboard' : '/admin/panel'}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Dashboard
                </Link>
                <Button variant="outline" size="sm">
                  {profile.full_name || user.email}
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <Link href="#why-spark" className="text-gray-600 hover:text-gray-900">
                Why Spark
              </Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900">
                How It Works
              </Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-gray-900">
                Testimonials
              </Link>
              
              {user && profile ? (
                <div className="flex flex-col space-y-2 pt-4 border-t">
                  <Link 
                    href={profile.role === 'creator' ? '/creator/dashboard' : profile.role === 'brand' ? '/brand/dashboard' : '/admin/panel'}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Dashboard
                  </Link>
                  <Button variant="outline" size="sm" className="w-full">
                    {profile.full_name || user.email}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2 pt-4 border-t">
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}