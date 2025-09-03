'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn, signInWithGoogle, supabase } from '@/lib/supabase'
import { Zap, Mail, Eye, EyeOff } from 'lucide-react'

// New design system components
import Layout from '@/components/shared/Layout'
import { Container } from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Heading, Text } from '@/components/ui/Typography'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [redirectPath, setRedirectPath] = useState('')
  const [authenticatedUser, setAuthenticatedUser] = useState(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'

  useEffect(() => {
    // Check if user is already authenticated when visiting login page
    const checkAuthStatus = async () => {
      try {
        console.log('🔍 Login page: Checking authentication status...')
        
        if (typeof window !== 'undefined') {
          const { data: { user }, error } = await supabase.auth.getUser()
          
          if (error) {
            console.error('❌ Auth check error:', error)
            return
          }
          
          if (user) {
            console.log('✅ Login page: User already authenticated:', user.email)
            setAuthenticatedUser(user.email)
            
            // Also get the profile to ensure we have role information
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
              
              if (profileData) {
                console.log('✅ Profile loaded for popup:', profileData.role)
              }
            } catch (profileError) {
              console.warn('⚠️ Could not load profile for popup:', profileError)
            }
          } else {
            console.log('📝 Login page: No authenticated user found')
            setAuthenticatedUser(null)
          }
        }
      } catch (error) {
        console.error('❌ Error checking auth status:', error)
        setAuthenticatedUser(null)
      }
    }
    
    checkAuthStatus()
  }, [])

  const handleLogout = async () => {
    try {
      console.log('Logging out current user...')
      await supabase.auth.signOut()
      setAuthenticatedUser(null)
      console.log('✅ Logout successful - user can now log in with different credentials')
    } catch (error) {
      console.error('❌ Logout failed:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('🔄 Starting login process for:', email)
      
      // Enhanced timeout handling - increased to 45s for network variability and proper AbortController cleanup
      let timeoutId
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Login request timed out. Please check your internet connection and try again.'))
        }, 45000)
      })

      const loginPromise = signIn(email, password).finally(() => {
        // Clean up timeout to prevent resource conflicts
        if (timeoutId) clearTimeout(timeoutId)
      })
      
      const result = await Promise.race([loginPromise, timeoutPromise])
      
      if (result.error) {
        console.error('❌ Login failed:', result.error)
        setError(result.error.message)
        setLoading(false)
        return
      }

      if (result.data?.user) {
        console.log('✅ Login successful for user:', result.data.user.email)
        
        // Show immediate success feedback using React state
        setError('')
        setLoading(false)
        setLoginSuccess(true)
        
        // Get user role for proper redirect
        const userMetadata = result.data.user.user_metadata
        const userRole = userMetadata?.role || 'brand' // Default to brand
        
        console.log('🔄 User role detected:', userRole)
        
        // Determine dashboard path
        const dashboardPath = userRole === 'creator' ? '/creator/dashboard' : 
                             userRole === 'admin' ? '/admin/panel' : 
                             '/brand/dashboard'
        
        console.log('🔄 Redirecting to dashboard:', dashboardPath)
        setRedirectPath(dashboardPath)
        setSuccessMessage('🎉 Login successful! Redirecting to your dashboard...')
        
        // Simple redirect using Next.js router
        setTimeout(async () => {
          try {
            console.log('🔄 Using router.push to redirect to:', dashboardPath)
            await router.push(dashboardPath)
            console.log('✅ Router redirect successful')
          } catch (routerError) {
            console.error('❌ Router redirect failed:', routerError)
            // Fallback to window.location
            window.location.href = dashboardPath
          }
        }, 1500) // 1.5 second delay to show success message
        
      } else {
        throw new Error('Login succeeded but no user data returned')
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      
      // Provide specific error messages
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        setError('Login request timed out. Please check your internet connection and try again.')
      } else if (error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials and try again.')
      } else if (error.message.includes('Network request failed')) {
        setError('Network error. Please check your internet connection and try again.')
      } else {
        setError(error.message || 'An unexpected error occurred during login. Please try again.')
      }
      
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    
    const { error: authError } = await signInWithGoogle()
    
    if (authError) {
      setError(authError.message)
      setLoading(false)
    }
  }

  return (
    <Layout showNavbar={false}>
      <div className="min-h-screen flex items-center justify-center py-12">
        <Container size="narrow" className="max-w-md">
          <div className="space-y-8">
            {/* Logo */}
            <div className="text-center">
              <Link href="/" className="inline-flex items-center justify-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-lg flex items-center justify-center">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">SPARK</span>
              </Link>
              <div className="mt-6 space-y-2">
                <Heading level={2} size="3xl">Sign in to your account</Heading>
                <Text className="text-center">
                  Or{' '}
                  <Link href="/auth/signup" className="text-[#8A2BE2] hover:text-[#FF1493] transition-colors font-medium">
                    create a new account
                  </Link>
                </Text>
              </div>
            </div>

            <Card className="p-8">
              <div className="space-y-6">
                {authenticatedUser && (
                  <div className="bg-blue-500/20 border border-blue-500/20 rounded-lg p-4 mb-6">
                    <div className="text-center space-y-3">
                      <Text size="sm" className="text-blue-400 font-medium">
                        👤 Already signed in as: {authenticatedUser}
                      </Text>
                      <div className="flex space-x-3">
                        <Button
                          onClick={() => {
                            console.log('🔄 Redirecting authenticated user to dashboard...')
                            console.log('User profile:', profile)
                            
                            // Fix: Detect user role and redirect to correct dashboard
                            let dashboardPath = '/brand/dashboard' // Default
                            
                            if (profile?.role === 'creator') {
                              dashboardPath = '/creator/dashboard'
                            } else if (profile?.role === 'admin') {
                              dashboardPath = '/admin/panel'
                            }
                            
                            console.log('🎯 Redirecting to:', dashboardPath)
                            window.location.href = dashboardPath
                          }}
                          className="flex-1"
                        >
                          Go to Dashboard
                        </Button>
                        <Button
                          onClick={handleLogout}
                          variant="outline"
                          className="flex-1"
                        >
                          Sign Out & Login as Different User
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center space-y-2">
                  <Heading level={3} size="xl">Welcome back</Heading>
                  <Text size="sm">Enter your credentials to access your account</Text>
                </div>

                {loginSuccess && (
                  <div className="bg-green-500/20 border border-green-500/20 rounded-lg p-4 text-green-400 text-center mb-4">
                    <div className="font-medium mb-2">{successMessage}</div>
                    {redirectPath && successMessage.includes('Click the button below') && (
                      <a 
                        href={redirectPath}
                        className="inline-block bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                      >
                        Go to Dashboard →
                      </a>
                    )}
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/20 border border-red-500/20 rounded-lg p-4">
                    <Text size="sm" color="primary" className="text-red-400">{error}</Text>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Text size="sm" weight="medium" color="primary">Email</Text>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Text size="sm" weight="medium" color="primary">Password</Text>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-12"
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Link href="/auth/forgot-password" className="text-sm text-[#8A2BE2] hover:text-[#FF1493] transition-colors">
                      Forgot your password?
                    </Link>
                  </div>

                  <Button 
                    type="submit" 
                    className={`w-full ${loginSuccess ? 'bg-green-500 hover:bg-green-600' : ''}`}
                    disabled={loading || loginSuccess}
                  >
                    {loginSuccess ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 text-white">✅</div>
                        <span>Login Successful!</span>
                      </div>
                    ) : loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[#1C1C2D] px-4 text-gray-400 uppercase tracking-wide">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <Mail className="mr-3 h-5 w-5" />
                  Google
                </Button>
              </div>
            </Card>
          </div>
        </Container>
      </div>
    </Layout>
  )
}

function LoginPageFallback() {
  return (
    <Layout showNavbar={false}>
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8A2BE2]"></div>
      </div>
    </Layout>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginForm />
    </Suspense>
  )
}