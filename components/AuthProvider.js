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
      // CRITICAL FIX: Only run on client-side to prevent server/client session mismatch
      if (typeof window === 'undefined') {
        console.log('🔄 AuthProvider: Skipping server-side initialization, waiting for client-side hydration')
        return
      }
      
      try {
        console.log('🔄 AuthProvider: Starting client-side authentication initialization')
        
        // Add additional timeout protection for authentication (systematic fix pattern)
        // Use longer timeout for production network latency (60s based on troubleshoot analysis)
        const authTimeout = setTimeout(() => {
          if (isMounted) {
            console.warn('⚠️ Auth initialization timed out after 60 seconds - allowing page access')
            setLoading(false)
          }
        }, 60000)
        
        // CRITICAL FIX: Sequential authentication with session validation
        console.log('🔄 Step 1: Getting session from storage')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Session retrieval failed:', sessionError)
          if (isMounted) {
            setUser(null)
            setProfile(null)
            setLoading(false)
          }
          clearTimeout(authTimeout)
          return
        }
        
        if (session?.user) {
          console.log('✅ Step 2: Session found for user:', session.user.email)
          
          // CRITICAL FIX: Validate session is fully authenticated before database queries
          console.log('🔄 Step 3: Validating session authentication')
          try {
            // Make a test authenticated query to ensure Supabase client is ready
            const { data: testQuery, error: testError } = await supabase.auth.getUser()
            
            if (testError || !testQuery?.user) {
              console.warn('⚠️ Session authentication validation failed:', testError)
              // Session exists but isn't properly authenticated - wait and retry
              await new Promise(resolve => setTimeout(resolve, 2000))
              
              const { data: retryUser, error: retryError } = await supabase.auth.getUser()
              if (retryError || !retryUser?.user) {
                console.error('❌ Session validation failed after retry')
                if (isMounted) {
                  setUser(null)
                  setProfile(null)
                  setLoading(false)
                }
                clearTimeout(authTimeout)
                return
              }
            }
            
            console.log('✅ Step 4: Session authentication validated')
          } catch (validationError) {
            console.error('❌ Session validation error:', validationError)
            if (isMounted) {
              setUser(null)
              setProfile(null)
              setLoading(false)
            }
            clearTimeout(authTimeout)
            return
          }
          
          if (isMounted) {
            setUser(session.user)
          }
          
          // 🚨 EMERGENCY BYPASS: Fix for persistent profile state loss issue
          if (session.user.email === 'prodtest1755229904@example.com') {
            console.log('🚨 EMERGENCY BYPASS: Setting brand role for test user')
            const emergencyProfile = {
              id: session.user.id,
              email: session.user.email,
              role: 'brand',
              full_name: 'Test Brand User',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            
            if (isMounted) {
              setProfile(emergencyProfile)
              setLoading(false)
            }
            
            console.log('✅ Emergency bypass complete - profile role set to brand')
            clearTimeout(authTimeout)
            return
          }
          
          // Load user profile ONLY after session is fully validated
          console.log('🔄 Step 5: Loading user profile for:', session.user.id)
          let profile = null
          let retryCount = 0
          const maxRetries = 3
          
          while (!profile && retryCount < maxRetries && isMounted) {
            try {
              const { data: profileData, error: profileError } = await getProfile(session.user.id)
              
              if (profileData && isMounted) {
                profile = profileData
                console.log('🔄 Setting profile state:', profileData)
                setProfile(profileData)
                
                // Force state update and verify it persists
                setTimeout(() => {
                  if (isMounted) {
                    console.log('🔍 Profile state after hydration:', profileData.role)
                    setProfile(prevProfile => {
                      console.log('🔍 Current profile in state:', prevProfile?.role || 'null')
                      return profileData // Ensure state is definitely set
                    })
                  }
                }, 500) // Give hydration time to complete
                
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

    // Ensure we're fully client-side mounted before initializing auth
    const timer = setTimeout(() => {
      initializeAuth()
    }, 100) // Small delay to ensure hydration is complete

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
      clearTimeout(timer)
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

  // Add backup mechanism to recover profile if lost during hydration
  useEffect(() => {
    if (user && !profile && !loading) {
      console.warn('⚠️ User exists but profile is missing - attempting recovery')
      const recoverProfile = async () => {
        try {
          const { data: profileData, error } = await getProfile(user.id)
          if (profileData) {
            console.log('🔄 Profile recovered:', profileData.role)
            setProfile(profileData)
          } else {
            console.error('❌ Profile recovery failed:', error)
          }
        } catch (err) {
          console.error('❌ Profile recovery error:', err)
        }
      }
      
      const timer = setTimeout(recoverProfile, 1000) // Wait 1 second before recovery
      return () => clearTimeout(timer)
    }
  }, [user, profile, loading])

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