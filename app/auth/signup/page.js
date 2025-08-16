'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { signUp, supabase } from '@/lib/supabase'
import { sanitizeFieldValue } from '@/lib/xss-protection'

function SignupPageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F0F1A] via-[#1A1A2E] to-[#16213E]">
      <div className="text-white text-xl">Loading signup form...</div>
    </div>
  )
}

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleFromUrl = searchParams.get('role')
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: roleFromUrl || ''
  })
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    // Store raw input during typing, sanitize only on form submission
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (!formData.role) {
      setError('Please select your role')
      setLoading(false)
      return
    }

    try {
      console.log('🔄 Starting signup process for:', formData.email, 'with role:', formData.role)
      
      // Enhanced timeout handling with better error messages (increased for production network conditions)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Signup request timed out. Please check your internet connection and try again.')), 30000)
      )
      
      const signupPromise = signUp(
        sanitizeFieldValue('email', formData.email),
        formData.password,
        {
          full_name: sanitizeFieldValue('full_name', formData.fullName),
          role: sanitizeFieldValue('role', formData.role)
        }
      )
      
      // Race between signup and timeout
      const { data, error: authError } = await Promise.race([signupPromise, timeoutPromise])

      if (authError) {
        console.error('❌ Signup error:', authError)
        
        // Handle different types of errors
        if (authError.message.includes('Profile creation failed')) {
          setError(`Unable to complete account setup: ${authError.message}. Please try again or contact support if the problem persists.`)
        } else {
          setError(`Signup failed: ${authError.message}`)
        }
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('Signup failed: No user data returned')
        setLoading(false)
        return
      }

      console.log('✅ Signup successful for user:', data.user.email)
      console.log('🔄 Starting redirect process...')
      
      // Simple redirect using Next.js router
      const redirectPath = formData.role === 'creator' ? '/creator/dashboard' : '/brand/dashboard'
      console.log('🔄 Redirect path:', redirectPath)
      
      // Clear loading state and redirect
      setLoading(false)
      
      setTimeout(async () => {
        try {
          console.log('🔄 Using router.push to redirect to:', redirectPath)
          await router.push(redirectPath)
          console.log('✅ Router redirect successful')
        } catch (routerError) {
          console.error('❌ Router redirect failed:', routerError)
          // Fallback to window.location
          window.location.href = redirectPath
        }
      }, 1500) // 1.5 second delay to show success

    } catch (error) {
      console.error('❌ Signup process error:', error)
      setError(`Signup failed: ${error.message || 'Unknown error occurred'}. Please try again.`)
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setLoading(true)
    setError('')

    if (!formData.role) {
      setError('Please select your role first')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=${formData.role}`
        }
      })

      if (error) {
        console.error('❌ Google signup error:', error)
        setError(`Google signup failed: ${error.message}`)
        setLoading(false)
      }
      // Note: Don't set loading to false on success since redirect will happen
    } catch (error) {
      console.error('❌ Google signup exception:', error)
      setError('Google signup failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F0F1A] via-[#1A1A2E] to-[#16213E]">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Join as a {formData.role || 'user'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
              {error.includes('dashboard:') ? (
                <div>
                  <p>{error.split(': ')[0]}:</p>
                  <a 
                    href={error.split(': ')[1]} 
                    className="text-purple-400 hover:text-purple-300 underline font-medium inline-block mt-2"
                  >
                    Go to Dashboard →
                  </a>
                </div>
              ) : error.includes('this link') ? (
                <div>
                  <p>Account created successfully!</p>
                  <a 
                    href={error.match(/\/\w+\/dashboard/)?.[0] || '/dashboard'} 
                    className="text-purple-400 hover:text-purple-300 underline font-medium inline-block mt-2"
                  >
                    Go to Dashboard →
                  </a>
                </div>
              ) : (
                error
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="sr-only">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="role" className="sr-only">
                Role
              </label>
              <select
                id="role"
                name="role"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                value={formData.role}
                onChange={handleInputChange}
                disabled={loading}
              >
                <option value="">Select your role</option>
                <option value="creator">Creator</option>
                <option value="brand">Brand</option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#0F0F1A] text-gray-400">Or continue with</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-gray-600 text-sm font-medium rounded-lg text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Signing up...' : 'Continue with Google'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <a
                href="/auth/login"
                className="font-medium text-purple-400 hover:text-purple-300"
              >
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupPageFallback />}>
      <SignupForm />
    </Suspense>
  )
}