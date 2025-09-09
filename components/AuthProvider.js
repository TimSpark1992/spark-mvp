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
    let isMounted = true
    
    // Initial auth check with improved session rehydration
    const initializeAuth = async () => {
      try {
        console.log('🔄 AuthProvider: Initializing authentication...')
        
        // Add additional timeout protection for authentication (systematic fix pattern)
        // Use longer timeout to allow login to complete properly
        const authTimeout = setTimeout(() => {
          if (isMounted) {
            console.warn('⚠️ Auth initialization timed out after 25 seconds - allowing page access')
            setLoading(false)
          }
        }, 25000)
        
        // Get current session with better error handling and retry mechanism
        let session = null
        let sessionError = null
        let retryCount = 0
        const maxRetries = 3
        
        while (!session && retryCount < maxRetries && isMounted) {
          try {
            const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
            session = sessionData?.session
            sessionError = sessionErr
            
            if (session || !sessionErr) break
            
            console.warn(`Session retrieval attempt ${retryCount + 1} failed:`, sessionErr)
            retryCount++
            
            if (retryCount < maxRetries && isMounted) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
            }
          } catch (err) {
            console.warn(`Session retrieval attempt ${retryCount + 1} error:`, err)
            retryCount++
            if (retryCount < maxRetries && isMounted) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
            }
          }
        }
        
        if (sessionError && !session) {
          console.error('❌ Session retrieval failed after all retries:', sessionError)
          if (isMounted) {
            setUser(null)
            setProfile(null)
            setLoading(false)
          }
          clearTimeout(authTimeout)
          return
        }
        
        if (session?.user) {
          console.log('✅ Session found for user:', session.user.email)
          
          if (isMounted) {
            setUser(session.user)
          }
          
          // Get user profile with retry mechanism
          let profile = null
          let retryCount = 0
          const maxRetries = 3
          
          while (!profile && retryCount < maxRetries && isMounted) {
            try {
              const { data: profileData, error: profileError } = await getProfile(session.user.id)
              
              if (profileData && isMounted) {
                profile = profileData
                setProfile(profileData)
                console.log('✅ Profile loaded successfully:', profileData.role)
                break
              } else if (profileError) {
                console.warn(`Profile retrieval attempt ${retryCount + 1} failed:`, profileError)
              }
            } catch (profileErr) {
              console.warn(`Profile retrieval attempt ${retryCount + 1} error:`, profileErr)
            }
            
            retryCount++
            // Wait before retry (increasing delay)
            if (retryCount < maxRetries && isMounted) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
            }
          }
          
          if (!profile && isMounted) {
            console.warn('⚠️ Profile retrieval failed after all retries for user:', session.user.id)
          }
        } else {
          console.log('🔓 No active session found')
          if (isMounted) {
            setUser(null)
            setProfile(null)
          }
        }
        
        if (isMounted) {
          setLoading(false)
        }
        clearTimeout(authTimeout)
        
      } catch (error) {
        console.error('❌ Auth initialization error:', error)
        if (isMounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    }

    initializeAuth()

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

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
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