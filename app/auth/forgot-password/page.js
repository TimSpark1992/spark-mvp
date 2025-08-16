'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Zap, ArrowLeft, Mail, CheckCircle } from 'lucide-react'

// Components
import Layout from '@/components/shared/Layout'
import { Container } from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Heading, Text } from '@/components/ui/Typography'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!email) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    try {
      console.log('🔄 Processing password reset request for:', email)
      
      // Enhanced timeout handling for production consistency
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), 10000)
      )
      
      // MVP-Safe: No actual email sending, immediate success response
      const processPromise = new Promise(resolve => setTimeout(resolve, 1500))
      
      // Race between process and timeout
      await Promise.race([processPromise, timeoutPromise])
      
      console.log('✅ Password reset request processed (MVP-safe mode)')
      setSuccess(true)
      setLoading(false)
      
    } catch (error) {
      console.error('❌ Password reset request error:', error)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
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
              </div>

              <Card className="p-8">
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  
                  <div className="space-y-2">
                    <Heading level={3} size="xl">Request Received!</Heading>
                    <Text className="text-gray-400">
                      We've received your password reset request for <span className="text-white font-medium">{email}</span>
                    </Text>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Mail className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-left">
                        <Text size="sm" weight="medium" className="text-blue-400">Contact Admin for Password Reset</Text>
                        <Text size="sm" className="text-gray-400 mt-1">
                          Please contact our support team to reset your password:
                        </Text>
                        <div className="mt-2 space-y-1">
                          <Text size="sm" className="text-white font-medium">📧 Email: support@sparkplatform.com</Text>
                          <Text size="sm" className="text-white font-medium">📱 Phone: +1 (555) 123-SPARK</Text>
                        </div>
                        <Text size="xs" className="text-gray-500 mt-2">
                          Include your email address ({email}) when contacting support.
                        </Text>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={() => {
                        setSuccess(false)
                        setEmail('')
                      }}
                      variant="secondary"
                      className="w-full"
                    >
                      Make Another Request
                    </Button>
                    
                    <Link href="/auth/login" className="block">
                      <Button variant="outline" className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </Container>
        </div>
      </Layout>
    )
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
                <Heading level={2} size="3xl">Forgot Password?</Heading>
                <Text className="text-center text-gray-400">
                  No worries! Enter your email and we'll send you a reset link.
                </Text>
              </div>
            </div>

            <Card className="p-8">
              <div className="space-y-6">
                {error && (
                  <div className="bg-red-500/20 border border-red-500/20 rounded-lg p-4">
                    <Text size="sm" className="text-red-400">{error}</Text>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Text size="sm" weight="medium" color="primary">Email Address</Text>
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Processing Request...' : 'Request Password Reset'}
                  </Button>
                </form>

                <div className="text-center">
                  <Link href="/auth/login" className="inline-flex items-center text-sm text-[#8A2BE2] hover:text-[#FF1493] transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </div>
    </Layout>
  )
}