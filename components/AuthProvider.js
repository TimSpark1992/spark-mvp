'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getCurrentUser, getProfile } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial user
    getCurrentUser().then(({ user, error }) => {
      if (user) {
        setUser(user)
        // Get user profile
        getProfile(user.id).then(({ data: profile, error: profileError }) => {
          if (profile) {
            setProfile(profile)
          } else if (profileError) {
            console.warn('Profile retrieval error (non-blocking):', profileError)
          }
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          // Get user profile
          const { data: profile, error } = await getProfile(session.user.id)
          if (profile) {
            setProfile(profile)
          }
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    profile,
    loading,
    setProfile,
    isAuthenticated: !!user,
    isCreator: profile?.role === 'creator',
    isBrand: profile?.role === 'brand',
    isAdmin: profile?.role === 'admin'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}