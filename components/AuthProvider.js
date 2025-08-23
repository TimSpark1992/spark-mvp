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
    // Get initial user with faster timeout for unauthenticated users
    const authTimeout = setTimeout(() => {
      console.log('⚠️ Auth timeout - assuming no user')
      setUser(null)
      setProfile(null)
      setLoading(false)
    }, 5000) // 5 second timeout for auth check
    
    getCurrentUser().then(async ({ user, error }) => {
      clearTimeout(authTimeout) // Clear timeout since we got a response
      
      if (user) {
        setUser(user)
        // Get user profile with retry mechanism
        let profile = null
        let retryCount = 0
        const maxRetries = 3
        
        while (!profile && retryCount < maxRetries) {
          const { data: profileData, error: profileError } = await getProfile(user.id)
          
          if (profileData) {
            profile = profileData
            setProfile(profile)
            break
          } else if (profileError) {
            console.warn(`Initial profile retrieval attempt ${retryCount + 1} failed:`, profileError)
          }
          
          retryCount++
          // Wait before retry (increasing delay)
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
          }
        }
        
        if (!profile) {
          console.warn('Initial profile retrieval failed after all retries for user:', user.id)
        }
      } else {
        console.log('🔓 No user authenticated - redirecting to login')
      }
      setLoading(false)
    }).catch((err) => {
      clearTimeout(authTimeout)
      console.error('❌ Auth check error:', err)
      setUser(null)
      setProfile(null) 
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          // Get user profile with retry mechanism for newly created profiles
          let profile = null
          let retryCount = 0
          const maxRetries = 3
          
          while (!profile && retryCount < maxRetries) {
            const { data: profileData, error } = await getProfile(session.user.id)
            
            if (profileData) {
              profile = profileData
              setProfile(profile)
              break
            } else if (error) {
              console.warn(`Profile retrieval attempt ${retryCount + 1} failed:`, error)
            }
            
            retryCount++
            // Wait before retry (increasing delay)
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
            }
          }
          
          if (!profile) {
            console.warn('Profile retrieval failed after all retries for user:', session.user.id)
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

  const refreshProfile = async () => {
    if (!user) {
      console.warn('⚠️ Cannot refresh profile - no user authenticated')
      return
    }

    try {
      console.log('🔄 Refreshing profile data for user:', user.id)
      const { data: profileData, error } = await getProfile(user.id)
      
      if (profileData) {
        setProfile(profileData)
        console.log('✅ Profile refreshed successfully')
      } else if (error) {
        console.error('❌ Error refreshing profile:', error)
        // Don't throw error here to avoid breaking the UI
      }
    } catch (err) {
      console.error('❌ Profile refresh failed:', err)
      // Don't throw error here to avoid breaking the UI
    }
  }

  const value = {
    user,
    profile,
    loading,
    setProfile,
    refreshProfile,
    isAuthenticated: !!user,
    isCreator: profile?.role === 'creator',
    isBrand: profile?.role === 'brand',
    isAdmin: profile?.role === 'admin'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}