'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { signUp, signInWithGoogle, createProfile, supabase } from '@/lib/supabase'
import { sanitizeFieldValue } from '@/lib/xss-protection'
import { Zap, Mail, Eye, EyeOff, Users, Briefcase } from 'lucide-react'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role')

  // Set role from URL parameter if provided
  useState(() => {
    if (roleParam && (roleParam === 'creator' || roleParam === 'brand')) {
      setFormData(prev => ({ ...prev, role: roleParam }))
    }
  }, [roleParam])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    // Apply XSS sanitization to all signup form inputs
    const sanitizedValue = sanitizeFieldValue(name, value)
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }))
  }

  const handleRoleChange = (value) => {
    // Apply XSS sanitization to role selection
    const sanitizedValue = sanitizeFieldValue('role', value)
    setFormData(prev => ({ ...prev, role: sanitizedValue }))
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

    const { data, error: authError } = await signUp(
      formData.email,
      formData.password,
      {
        full_name: formData.fullName,
        role: formData.role
      }
    )

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Create profile in database after user is authenticated
    if (data.user) {
      // Wait for auth session to be established and refresh the client session
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Refresh the session to ensure auth.uid() works in RLS policies
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (!session) {
        setError('Authentication session not established. Please try again.')
        setLoading(false)
        return
      }
      
      const { error: profileError } = await createProfile({
        id: data.user.id,
        email: sanitizeFieldValue('email', formData.email),
        full_name: sanitizeFieldValue('full_name', formData.fullName),
        role: sanitizeFieldValue('role', formData.role)
      })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        setError(`Profile setup failed: ${profileError.message || 'Unknown error'}. Please try again.`)
        setLoading(false)
        return
      }
    }

    // Redirect based on role
    if (formData.role === 'creator') {
      router.push('/creator/dashboard')
    } else if (formData.role === 'brand') {
      router.push('/brand/dashboard')
    } else {
      router.push('/')
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

    const { error: authError } = await signInWithGoogle()

    if (authError) {
      setError(authError.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-montserrat font-bold text-gray-900">Spark</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:text-primary/80">
              sign in to existing account
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Join Spark</CardTitle>
            <CardDescription>
              Get started with your creator or brand account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-3">
                <Label>I am a...</Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={handleRoleChange}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="creator" id="creator" className="peer sr-only" />
                    <Label
                      htmlFor="creator"
                      className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Users className="mb-2 h-6 w-6" />
                      Creator
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="brand" id="brand" className="peer sr-only" />
                    <Label
                      htmlFor="brand"
                      className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <Briefcase className="mb-2 h-6 w-6" />
                      Brand
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignUp}
              disabled={loading || !formData.role}
            >
              <Mail className="mr-2 h-4 w-4" />
              Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}