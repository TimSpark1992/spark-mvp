'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/shared/Layout'
import { Container, Section } from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Heading, Text } from '@/components/ui/Typography'
import { getCampaigns, createApplication, getCreatorApplications } from '@/lib/supabase'
import { sanitizeFieldValue } from '@/lib/xss-protection'
import { 
  ArrowLeft,
  Calendar,
  DollarSign,
  Building,
  User,
  FileText,
  Send,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

export default function CampaignDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [applicationLoading, setApplicationLoading] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [applicationForm, setApplicationForm] = useState({
    message: '',
    portfolio_url: '',
    media_kit_url: ''
  })

  useEffect(() => {
    let mounted = true
    
    const loadCampaignAndApplication = async () => {
      // Only load if we have campaign ID, profile, and haven't loaded yet
      if (!params.id || authLoading || dataLoaded) {
        return
      }

      try {
        console.log('📋 Loading campaign details for ID:', params.id)
        setLoading(true)
        setError('')

        // Add timeout protection (systematic fix pattern)
        const loadTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Campaign loading timed out after 10 seconds')), 10000)
        )

        // Get campaign details with timeout protection
        const campaignPromise = getCampaigns().then(result => {
          if (!mounted) return { data: [], error: null }
          
          if (result.error) throw new Error(result.error.message)
          
          console.log('🔍 Debug - Looking for campaign ID:', params.id, typeof params.id)
          console.log('🔍 Debug - Available campaigns:', result.data.map(c => ({ id: c.id, type: typeof c.id, title: c.title })))
          
          const foundCampaign = result.data.find(c => {
            console.log('🔍 Debug - Comparing:', c.id, '===', params.id, '?', c.id === params.id)
            return c.id === params.id
          })
          
          if (!foundCampaign) {
            console.warn('⚠️ Campaign not found, redirecting to campaigns list')
            console.warn('⚠️ Searched for ID:', params.id, 'in', result.data.length, 'campaigns')
            router.push('/creator/campaigns')
            return { data: [], error: null }
          }
          
          setCampaign(foundCampaign)
          console.log('✅ Campaign loaded successfully:', foundCampaign.title)
          return result
        })

        // Check if creator has already applied (only if profile exists)
        let applicationPromise = Promise.resolve({ data: [], error: null })
        if (profile?.id) {
          applicationPromise = getCreatorApplications(profile.id).then(result => {
            if (!mounted) return { data: [], error: null }
            
            if (result.error) throw new Error(result.error.message)
            
            const existingApplication = result.data.find(app => app.campaign_id === params.id)
            if (existingApplication) {
              setHasApplied(true)
              setApplicationStatus(existingApplication.status)
              console.log('✅ Found existing application:', existingApplication.status)
            }
            
            return result
          })
        }

        // Wait for both with timeout protection
        await Promise.race([
          Promise.all([campaignPromise, applicationPromise]),
          loadTimeout
        ])

        if (mounted) {
          setDataLoaded(true)
          console.log('🎉 Campaign and application data loaded successfully')
        }

      } catch (error) {
        console.error('❌ Error loading campaign:', error)
        if (mounted) {
          if (error.message.includes('timed out')) {
            setError('Loading timed out. Please check your connection and try again.')
          } else {
            setError(error.message || 'Failed to load campaign details')
          }
          setDataLoaded(true) // Prevent retry loops
        }
      } finally {
        if (mounted) {
          setLoading(false)
          console.log('🔄 Campaign loading state cleared')
        }
      }
    }

    // Add safety timeout (systematic fix pattern)
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading && !dataLoaded) {
        console.warn('⚠️ Campaign safety timeout - forcing loading to false')
        setLoading(false)
      }
    }, 15000) // 15 second safety net

    loadCampaignAndApplication()

    return () => {
      mounted = false
      clearTimeout(safetyTimeout)
    }
  }, [params.id, profile?.id, authLoading, dataLoaded, router])

  // Add additional loading protection based on profile availability
  useEffect(() => {
    // If we have profile and campaign ID but loading is still true after 8 seconds, force it to false
    if (profile && params.id && loading && !authLoading) {
      const forceLoadTimeout = setTimeout(() => {
        console.warn('⚠️ Forcing campaign loading to false due to profile availability')
        setLoading(false)
      }, 8000) // 8 seconds for detail pages
      
      return () => clearTimeout(forceLoadTimeout)
    }
  }, [profile, params.id, loading, authLoading])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    const sanitizedValue = sanitizeFieldValue(name, value)
    setApplicationForm(prev => ({ ...prev, [name]: sanitizedValue }))
  }

  const handleSubmitApplication = async (e) => {
    e.preventDefault()
    setApplicationLoading(true)
    setError('')

    if (!profile?.id) {
      setError('Please login to apply to this campaign')
      setApplicationLoading(false)
      return
    }

    if (!applicationForm.message.trim()) {
      setError('Please provide a message explaining why you\'re a good fit')
      setApplicationLoading(false)
      return
    }

    try {
      console.log('🔄 Starting campaign application process...')
      
      const applicationData = {
        campaign_id: params.id,
        creator_id: profile.id,
        message: sanitizeFieldValue('message', applicationForm.message),
        portfolio_url: sanitizeFieldValue('portfolio_url', applicationForm.portfolio_url),
        media_kit_url: sanitizeFieldValue('media_kit_url', applicationForm.media_kit_url),
        status: 'pending'
      }

      // Enhanced timeout handling for production reliability
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Application submission timed out. Please check your connection and try again.')), 30000)
      )
      
      const applicationPromise = createApplication(applicationData)
      
      // Race between application and timeout
      const { data, error: applicationError } = await Promise.race([applicationPromise, timeoutPromise])
      
      if (applicationError) throw new Error(applicationError.message)

      console.log('✅ Campaign application submitted successfully')
      setHasApplied(true)
      setApplicationStatus('pending')
      setSuccess('Application submitted successfully! The brand will review your application and get back to you.')
      setApplicationForm({ message: '', portfolio_url: '', media_kit_url: '' })

    } catch (error) {
      console.error('❌ Campaign application failed:', error)
      if (error.message.includes('timed out')) {
        setError('Application submission timed out. Please check your internet connection and try again.')
      } else {
        setError(error.message || 'Failed to submit application. Please try again.')
      }
    } finally {
      setApplicationLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'rejected': return <AlertCircle className="w-5 h-5 text-red-400" />
      default: return <Clock className="w-5 h-5 text-yellow-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'success'
      case 'rejected': return 'danger'
      default: return 'warning'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'accepted': return 'Accepted'
      case 'rejected': return 'Rejected' 
      default: return 'Under Review'
    }
  }

  if (loading && !dataLoaded) {
    return (
      <ProtectedRoute requiredRole="creator">
        <Layout variant="app">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8A2BE2] mx-auto"></div>
              <Text size="lg" color="secondary">Loading campaign details...</Text>
              <Text size="sm" color="secondary">
                {authLoading ? 'Authenticating...' : 
                 !profile?.id ? 'Loading profile...' : 
                 'Fetching campaign information...'}
              </Text>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  if (!campaign) {
    return (
      <Layout variant="app">
        <Section padding="lg">
          <Container>
            <div className="text-center">
              <Heading level={2}>Campaign not found</Heading>
              <Link href="/creator/campaigns">
                <Button className="mt-4">Back to Campaigns</Button>
              </Link>
            </div>
          </Container>
        </Section>
      </Layout>
    )
  }

  return (
    <ProtectedRoute requiredRole="creator">
      <Layout variant="app">
        <Section padding="lg">
          <Container>
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <Link href="/creator/campaigns">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Campaigns
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Campaign Details */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-8">
                  <div className="space-y-6">
                    {/* Campaign Header */}
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <Badge variant="secondary">{campaign.category}</Badge>
                        <Text size="sm" color="secondary">
                          Posted {new Date(campaign.created_at).toLocaleDateString()}
                        </Text>
                      </div>
                      
                      <Heading level={1} size="3xl">{campaign.title}</Heading>
                      
                      <div className="flex items-center gap-2">
                        <Building className="w-5 h-5 text-gray-400" />
                        <Text size="lg" weight="medium">
                          {campaign.profiles?.company_name || campaign.profiles?.full_name}
                        </Text>
                      </div>
                    </div>

                    {/* Campaign Info */}
                    <div className="grid md:grid-cols-2 gap-4 py-6 border-t border-white/10">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-[#8A2BE2]" />
                        <div>
                          <Text size="sm" color="secondary">Budget Range</Text>
                          <Text weight="semibold">{campaign.budget_range}</Text>
                        </div>
                      </div>
                      
                      {campaign.deadline && (
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-[#8A2BE2]" />
                          <div>
                            <Text size="sm" color="secondary">Application Deadline</Text>
                            <Text weight="semibold">
                              {new Date(campaign.deadline).toLocaleDateString()}
                            </Text>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                      <Heading level={3} size="xl">Campaign Description</Heading>
                      <Text className="whitespace-pre-wrap leading-relaxed">
                        {campaign.description}
                      </Text>
                    </div>

                    {/* Requirements */}
                    {campaign.creator_requirements && (
                      <div className="space-y-4">
                        <Heading level={3} size="xl">Creator Requirements</Heading>
                        <div className="bg-[#2A2A3A]/50 rounded-xl p-6">
                          <Text className="whitespace-pre-wrap leading-relaxed">
                            {campaign.creator_requirements}
                          </Text>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Application Section */}
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#8A2BE2]" />
                      <Heading level={3} size="lg">Apply to Campaign</Heading>
                    </div>

                    {/* Application Status */}
                    {hasApplied && (
                      <div className="bg-[#2A2A3A]/50 rounded-xl p-6 text-center">
                        <div className="flex items-center justify-center gap-2 mb-3">
                          {getStatusIcon(applicationStatus)}
                          <Badge variant={getStatusColor(applicationStatus)}>
                            {getStatusText(applicationStatus)}
                          </Badge>
                        </div>
                        <Heading level={4} size="lg" className="mb-2">
                          Application {getStatusText(applicationStatus)}
                        </Heading>
                        <Text size="sm" color="secondary">
                          {applicationStatus === 'accepted' && 'Congratulations! The brand has accepted your application.'}
                          {applicationStatus === 'rejected' && 'Unfortunately, your application was not selected this time.'}
                          {applicationStatus === 'pending' && 'Your application is being reviewed by the brand.'}
                        </Text>
                      </div>
                    )}

                    {/* Success Message */}
                    {success && (
                      <div className="bg-green-500/20 border border-green-500/20 rounded-lg p-4">
                        <Text size="sm" color="primary" className="text-green-400">{success}</Text>
                      </div>
                    )}

                    {/* Error Message */}
                    {error && (
                      <div className="bg-red-500/20 border border-red-500/20 rounded-lg p-4">
                        <Text size="sm" color="primary" className="text-red-400">{error}</Text>
                      </div>
                    )}

                    {/* Application Form */}
                    {!hasApplied && (
                      <form onSubmit={handleSubmitApplication} className="space-y-4">
                        <div className="space-y-2">
                          <Text size="sm" weight="medium" color="primary">
                            Why are you a good fit for this campaign? *
                          </Text>
                          <textarea
                            name="message"
                            value={applicationForm.message}
                            onChange={handleInputChange}
                            placeholder="Describe your relevant experience, audience demographics, and why you're excited about this campaign..."
                            className="w-full bg-[#1C1C2D] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-[#8A2BE2] focus:outline-none min-h-[120px] resize-vertical"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Text size="sm" weight="medium" color="primary">Portfolio URL</Text>
                          <Input
                            name="portfolio_url"
                            type="url"
                            value={applicationForm.portfolio_url}
                            onChange={handleInputChange}
                            placeholder="Link to your Instagram, TikTok, or website"
                          />
                        </div>

                        <div className="space-y-2">
                          <Text size="sm" weight="medium" color="primary">Media Kit URL</Text>
                          <Input
                            name="media_kit_url"
                            type="url"
                            value={applicationForm.media_kit_url}
                            onChange={handleInputChange}
                            placeholder="Link to your media kit or rate card"
                          />
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={applicationLoading}
                        >
                          {applicationLoading ? (
                            'Submitting Application...'
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Submit Application
                            </>
                          )}
                        </Button>
                      </form>
                    )}

                    {/* Reapply Option for Rejected Applications */}
                    {hasApplied && applicationStatus === 'rejected' && (
                      <div className="pt-4 border-t border-white/10">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setHasApplied(false)
                            setApplicationStatus(null)
                            setSuccess('')
                            setError('')
                          }}
                        >
                          Submit New Application
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Campaign Tips */}
                <Card className="p-6">
                  <div className="space-y-4">
                    <Heading level={4} size="lg">Application Tips</Heading>
                    <div className="space-y-3 text-sm">
                      <div>
                        <Text weight="semibold" size="sm">Be Specific</Text>
                        <Text size="xs" color="secondary">
                          Mention relevant past campaigns or content that aligns with this brief.
                        </Text>
                      </div>
                      <div>
                        <Text weight="semibold" size="sm">Show Your Audience</Text>
                        <Text size="xs" color="secondary">
                          Include audience demographics and engagement stats.
                        </Text>
                      </div>
                      <div>
                        <Text weight="semibold" size="sm">Professional Portfolio</Text>
                        <Text size="xs" color="secondary">
                          Link to your best work that showcases your style and quality.
                        </Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Container>
        </Section>
      </Layout>
    </ProtectedRoute>
  )
}