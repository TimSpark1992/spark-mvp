'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import OnboardingModal from './OnboardingModal'

const OnboardingContext = createContext()

export const useOnboarding = () => {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}

export default function OnboardingProvider({ children }) {
  const { profile } = useAuth()
  const pathname = usePathname()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingChecked, setOnboardingChecked] = useState(false)

  useEffect(() => {
    if (!profile || onboardingChecked) return

    // CRITICAL FIX: Don't show onboarding if user is on auth pages
    // This prevents jarring experience where modal appears immediately on login page
    if (pathname.includes('/auth/login') || pathname.includes('/auth/signup')) {
      console.log('OnboardingProvider: User on auth page - not showing onboarding modal')
      setOnboardingChecked(true)
      return
    }

    console.log('OnboardingProvider: Checking if onboarding should be shown for user:', profile.email)

    // Show onboarding if it's user's first login and hasn't completed/skipped onboarding
    const shouldShowOnboarding = profile.first_login && 
                                 !profile.onboarding_completed && 
                                 !profile.onboarding_skipped

    console.log('OnboardingProvider: Should show onboarding?', shouldShowOnboarding, {
      firstLogin: profile.first_login,
      onboardingCompleted: profile.onboarding_completed,
      onboardingSkipped: profile.onboarding_skipped
    })

    setShowOnboarding(shouldShowOnboarding)
    setOnboardingChecked(true)
  }, [profile, onboardingChecked, pathname])

  const triggerOnboarding = () => {
    console.log('🎯 OnboardingProvider: triggerOnboarding called!')
    setShowOnboarding(true)
    console.log('🎯 OnboardingProvider: showOnboarding set to true')
  }
  
  const hideOnboarding = () => {
    console.log('🎯 OnboardingProvider: hideOnboarding called!')
    setShowOnboarding(false)
  }

  return (
    <OnboardingContext.Provider value={{ triggerOnboarding, hideOnboarding }}>
      {children}
      <OnboardingModal
        isVisible={showOnboarding}
        onClose={hideOnboarding}
        onComplete={hideOnboarding}
      />
    </OnboardingContext.Provider>
  )
}