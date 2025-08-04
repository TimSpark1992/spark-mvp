'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Hero from '@/components/homepage/Hero'
import WhySpark from '@/components/homepage/WhySpark'
import HowItWorks from '@/components/homepage/HowItWorks'
import Benefits from '@/components/homepage/Benefits'
import Stats from '@/components/homepage/Stats'
import Testimonials from '@/components/homepage/Testimonials'
import FAQ from '@/components/homepage/FAQ'
import JoinBeta from '@/components/homepage/JoinBeta'
import Footer from '@/components/Footer'

export default function HomePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && profile) {
      // Redirect authenticated users to their dashboard
      if (profile.role === 'creator') {
        router.push('/creator/dashboard')
      } else if (profile.role === 'brand') {
        router.push('/brand/dashboard')
      } else if (profile.role === 'admin') {
        router.push('/admin/panel')
      }
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <Hero />
        <WhySpark />
        <HowItWorks />
        <Benefits />
        <Stats />
        <Testimonials />
        <FAQ />
        <JoinBeta />
      </main>
      <Footer />
    </div>
  )
}