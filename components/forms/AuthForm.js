'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FormInput, FormRadioGroup } from './FormField'
import { authSignUp, authSignIn } from '@/lib/auth'
import { validateInputEnhanced, enhancedSignUpSchema, enhancedSignInSchema } from '@/lib/validation-enhanced'
import { sanitizeText } from '@/lib/xss-protection'
import { Zap, Mail, Eye, EyeOff, Users, Briefcase } from 'lucide-react'

export function SignUpForm({ preselectedRole = '' }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: preselectedRole
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleRoleChange = (value) => {
    setFormData(prev => ({ ...prev, role: value }))
    if (errors.role) {
      setErrors(prev => ({ ...prev, role: '' }))
    }
  }

  const validateForm = () => {
    const validation = validateInput(signUpSchema, formData)
    if (!validation.success) {
      // Extract field-specific errors
      const fieldErrors = {}
      if (validation.error) {
        fieldErrors.general = validation.error
      }
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setGlobalError('')

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await authSignUp(formData)

      if (error) {
        setGlobalError(error.message || 'Failed to create account')
        setLoading(false)
        return
      }

      // Wait for auth session to be established
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Redirect based on role
      if (formData.role === 'creator') {
        router.push('/creator/dashboard')
      } else if (formData.role === 'brand') {
        router.push('/brand/dashboard')
      } else {
        router.push('/')
      }
    } catch (error) {
      setGlobalError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const roleOptions = [
    {
      value: 'creator',
      label: 'Creator',
      icon: Users
    },
    {
      value: 'brand',
      label: 'Brand',
      icon: Briefcase
    }
  ]

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Link href="/" className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-montserrat font-bold text-gray-900">Spark</span>
        </Link>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Join Spark and start connecting with the right partners
        </CardDescription>
      </CardHeader>
      <CardContent>
        {globalError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{globalError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormRadioGroup
            label="I am a..."
            error={errors.role}
            required
            options={roleOptions}
            value={formData.role}
            onValueChange={handleRoleChange}
          />

          <FormInput
            label="Full Name"
            name="fullName"
            type="text"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={handleInputChange}
            error={errors.fullName}
            required
          />

          <FormInput
            label="Email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            required
          />

          <div className="space-y-2">
            <FormInput
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          <div className="space-y-2">
            <FormInput
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={errors.confirmPassword}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <div className="relative my-6">
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
          disabled={loading || !formData.role}
        >
          <Mail className="mr-2 h-4 w-4" />
          Google
        </Button>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:text-primary/80">
              Sign in
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function SignInForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const validation = validateInput(signInSchema, formData)
    if (!validation.success) {
      const fieldErrors = {}
      if (validation.error) {
        fieldErrors.general = validation.error
      }
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setGlobalError('')

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await authSignIn(formData)

      if (error) {
        setGlobalError(error.message || 'Failed to sign in')
        setLoading(false)
        return
      }

      router.push('/')
    } catch (error) {
      setGlobalError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Link href="/" className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-montserrat font-bold text-gray-900">Spark</span>
        </Link>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        {globalError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{globalError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            required
          />

          <div className="relative">
            <FormInput
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-3 top-8 h-8 w-8 p-0"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <Link href="/auth/forgot-password" className="text-sm text-primary hover:text-primary/80">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button type="button" variant="outline" className="w-full" disabled={loading}>
          <Mail className="mr-2 h-4 w-4" />
          Google
        </Button>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-primary hover:text-primary/80">
              Sign up
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}