'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/shared/Layout'
import { Container } from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Heading, Text } from '@/components/ui/Typography'
import { getBrandCampaigns, updateCampaign } from '@/lib/supabase'
import { updateCampaignInCache } from '@/lib/campaign-cache'
import { sanitizeFieldValue } from '@/lib/xss-protection'
import { formatDate } from '@/lib/formatters'
import { 
  ArrowLeft,
  Save,
  X,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

export default function EditCampaignPage() {
  const { id: campaignId } = useParams()
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget_range: '',
    creator_requirements: '',
    deadline: '',
    status: 'active'
  })

  const categories = [
    'Fashion & Beauty',
    'Technology',
    'Food & Beverage',
    'Travel & Lifestyle',
    'Health & Wellness',
    'Entertainment',
    'Education',
    'Sports & Fitness',
    'Home & Garden',
    'Business & Finance'
  ]

  const budgetRanges = [
    '$500 - $1,000',
    '$1,000 - $2,500',
    '$2,500 - $5,000',
    '$5,000 - $10,000',
    '$10,000 - $25,000',
    '$25,000+'
  ]

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'paused', label: 'Paused', color: 'yellow' },
    { value: 'draft', label: 'Draft', color: 'gray' },
    { value: 'completed', label: 'Completed', color: 'blue' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' }
  ]

  useEffect(() => {
    let mounted = true
    
    const loadCampaign = async () => {
      // Only load if we have campaign ID, profile, and haven't loaded yet
      if (!campaignId || !profile?.id || authLoading || dataLoaded) {
        return
      }

      try {
        console.log('🔄 Loading campaign for editing:', campaignId)
        setLoading(true)
        setError('')

        // Add timeout protection (systematic fix pattern)
        const loadTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Campaign loading timed out after 10 seconds')), 10000)
        )

        // Get campaigns with timeout protection
        const campaignsPromise = getBrandCampaigns(profile.id).then(result => {
          if (!mounted) return { data: [], error: null }
          
          if (result.error) {
            console.error('❌ Error fetching campaigns:', result.error)
            throw new Error(result.error.message || 'Failed to load campaigns')
          }
          
          const foundCampaign = result.data?.find(c => c.id === campaignId)
          
          if (foundCampaign) {
            setCampaign(foundCampaign)
            setFormData({
              title: foundCampaign.title || '',
              description: foundCampaign.description || '',
              category: foundCampaign.category || '',
              budget_range: foundCampaign.budget_range || '',
              creator_requirements: foundCampaign.creator_requirements || '',
              deadline: foundCampaign.deadline || '',
              status: foundCampaign.status || 'active'
            })
            console.log('✅ Campaign loaded for editing:', foundCampaign.title)
          } else {
            console.warn('⚠️ Campaign not found, redirecting to campaigns list')
            router.push('/brand/campaigns')
            return { data: [], error: null }
          }
          
          return result
        })

        // Wait for data loading with timeout protection
        await Promise.race([campaignsPromise, loadTimeout])

        if (mounted) {
          setDataLoaded(true)
          console.log('🎉 Campaign edit data loaded successfully')
        }

      } catch (error) {
        console.error('❌ Error loading campaign for editing:', error)
        if (mounted) {
          if (error.message.includes('timed out')) {
            setError('Loading timed out. Please check your connection and try again.')
          } else if (error.message.includes('not found')) {
            setError('Campaign not found. Redirecting to campaigns list.')
            setTimeout(() => router.push('/brand/campaigns'), 2000)
          } else {
            setError(error.message || 'Failed to load campaign for editing')
          }
          setDataLoaded(true) // Prevent retry loops
        }
      } finally {
        if (mounted) {
          setLoading(false)
          console.log('🔄 Campaign edit loading state cleared')
        }
      }
    }

    // Add safety timeout (systematic fix pattern)
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading && !dataLoaded) {
        console.warn('⚠️ Campaign edit safety timeout - forcing loading to false')
        setLoading(false)
      }
    }, 15000) // 15 second safety net

    loadCampaign()

    return () => {
      mounted = false
      clearTimeout(safetyTimeout)
    }
  }, [profile?.id, campaignId, authLoading, dataLoaded, router])

  // Add additional loading protection
  useEffect(() => {
    if (profile && campaignId && loading && !authLoading) {
      const forceLoadTimeout = setTimeout(() => {
        console.warn('⚠️ Forcing campaign edit loading to false due to profile availability')
        setLoading(false)
      }, 8000)
      
      return () => clearTimeout(forceLoadTimeout)
    }
  }, [profile, campaignId, loading, authLoading])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        setError('Campaign title is required')
        setSaving(false)
        return
      }

      // Sanitize form data
      const sanitizedData = {
        title: sanitizeFieldValue('title', formData.title),
        description: sanitizeFieldValue('description', formData.description),
        category: sanitizeFieldValue('category', formData.category),
        budget_range: sanitizeFieldValue('budget_range', formData.budget_range),
        creator_requirements: sanitizeFieldValue('creator_requirements', formData.creator_requirements),
        deadline: formData.deadline || null,
        status: formData.status
      }

      console.log('🔄 Updating campaign:', campaignId, sanitizedData)

      // Update campaign in database
      const { data, error: updateError } = await updateCampaign(campaignId, sanitizedData)

      if (updateError) {
        console.error('❌ Campaign update error:', updateError)
        setError(updateError.message || 'Failed to update campaign')
        setSaving(false)
        return
      }

      console.log('✅ Campaign updated successfully:', data)
      
      // Update campaign in cache immediately for instant UI updates
      if (data && data.length > 0) {
        console.log('🔄 Updating campaign cache with new data...')
        updateCampaignInCache(campaignId, data[0])
        console.log('✅ Campaign cache synchronized with status:', data[0].status)
      }
      
      setSuccess('Campaign updated successfully!')

      // Redirect back to campaigns dashboard after a brief delay
      setTimeout(() => {
        router.push('/brand/campaigns')
      }, 1500)

    } catch (error) {
      console.error('❌ Campaign update error:', error)
      setError(error.message || 'An unexpected error occurred')
      setSaving(false)
    }
  }

  if (loading && !dataLoaded) {
    return (
      <ProtectedRoute requiredRole="brand">
        <Layout>
          <Container>
            <div className="py-8">
              <Card className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8A2BE2] mx-auto mb-4"></div>
                <Text size="lg" color="secondary">Loading campaign for editing...</Text>
                <Text size="sm" color="secondary" className="mt-2">
                  {authLoading ? 'Authenticating...' : 
                   !profile?.id ? 'Loading profile...' : 
                   'Fetching campaign data...'}
                </Text>
              </Card>
            </div>
          </Container>
        </Layout>
      </ProtectedRoute>
    )
  }

  if (error && !campaign) {
    return (
      <ProtectedRoute requiredRole="brand">
        <Layout>
          <Container>
            <div className="py-8">
              <Card className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <Heading level={3} size="lg" className="mb-4">Error Loading Campaign</Heading>
                <Text className="mb-6">{error}</Text>
                <Link href="/brand/campaigns">
                  <Button>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Campaigns
                  </Button>
                </Link>
              </Card>
            </div>
          </Container>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="brand">
      <Layout>
        <Container>
          <div className="py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Link href={`/brand/campaigns/${campaignId}`}>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Campaign
                  </Button>
                </Link>
                <div>
                  <Heading level={1} size="3xl">Edit Campaign</Heading>
                  <Text size="lg" color="secondary">Make changes to your campaign details</Text>
                </div>
              </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <Card className="p-4 mb-6 bg-green-900/20 border-green-500/20">
                <Text className="text-green-400">{success}</Text>
              </Card>
            )}

            {error && (
              <Card className="p-4 mb-6 bg-red-900/20 border-red-500/20">
                <Text className="text-red-400">{error}</Text>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Form */}
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <Heading level={2} size="xl">Campaign Information</Heading>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">
                          Campaign Title *
                        </label>
                        <input
                          name="title"
                          type="text"
                          required
                          value={formData.title}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]"
                          placeholder="Enter campaign title..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">
                          Description
                        </label>
                        <textarea
                          name="description"
                          rows={4}
                          value={formData.description}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]"
                          placeholder="Describe your campaign objectives, deliverables, and key messages..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-white">Category</label>
                          <select
                            name="category"
                            value={formData.category}
                            onChange={(e) => handleSelectChange('category', e.target.value)}
                            className="w-full px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]"
                          >
                            <option value="">Select category</option>
                            {categories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-white">Budget Range</label>
                          <select
                            name="budget_range"
                            value={formData.budget_range}
                            onChange={(e) => handleSelectChange('budget_range', e.target.value)}
                            className="w-full px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]"
                          >
                            <option value="">Select budget range</option>
                            {budgetRanges.map((range) => (
                              <option key={range} value={range}>
                                {range}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">
                          Creator Requirements
                        </label>
                        <textarea
                          name="creator_requirements"
                          rows={3}
                          value={formData.creator_requirements}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]"
                          placeholder="Specify follower count, engagement rates, content style, or any other requirements..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">
                          Application Deadline
                        </label>
                        <input
                          name="deadline"
                          type="date"
                          value={formData.deadline}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">
                          Campaign Status
                        </label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={(e) => handleSelectChange('status', e.target.value)}
                          className="w-full px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8A2BE2]"
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-6 border-t border-white/10">
                      <Link href={`/brand/campaigns/${campaignId}`}>
                        <Button type="button" variant="ghost">
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </Link>

                      <Button type="submit" disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving Changes...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Current Status */}
                <Card className="p-6">
                  <Heading level={3} size="lg" className="mb-4">Current Status</Heading>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Text size="sm">Status</Text>
                      <Badge variant={statusOptions.find(s => s.value === formData.status)?.color}>
                        {statusOptions.find(s => s.value === formData.status)?.label}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <Text size="sm">Created</Text>
                      <Text size="sm">{formatDate(campaign?.created_at)}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text size="sm">Last Updated</Text>
                      <Text size="sm">{formatDate(campaign?.updated_at)}</Text>
                    </div>
                  </div>
                </Card>

                {/* Tips */}
                <Card className="p-6">
                  <Heading level={3} size="lg" className="mb-4">Editing Tips</Heading>
                  <div className="space-y-3">
                    <Text size="sm">• Changes will be visible to creators immediately</Text>
                    <Text size="sm">• Pausing a campaign hides it from creators</Text>
                    <Text size="sm">• Draft campaigns are only visible to you</Text>
                    <Text size="sm">• Completed campaigns cannot be edited</Text>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </Container>
      </Layout>
    </ProtectedRoute>
  )
}