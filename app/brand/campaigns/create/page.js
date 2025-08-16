'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/shared/Layout'
import { Container, Section } from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Heading, Text } from '@/components/ui/Typography'
import { createCampaign } from '@/lib/supabase'
import { sanitizeFieldValue } from '@/lib/xss-protection'
import { addCampaignToCache, clearCampaignCache } from '@/lib/campaign-cache'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  X, 
  Calendar, 
  DollarSign, 
  Building,
  Users,
  Clock,
  TrendingUp,
  Target,
  Lightbulb,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

export default function CreateCampaignPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [draftLoading, setDraftLoading] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget_range: '',
    creator_requirements: '',
    deadline: ''
  })

  // Dynamic campaign stats based on form data
  const [campaignStats, setCampaignStats] = useState({
    estimatedReach: '10K - 100K',
    expectedApplications: '5 - 20', 
    campaignDuration: '2 - 4 weeks'
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    updateCampaignStats({ ...formData, [name]: value })
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    updateCampaignStats({ ...formData, [name]: value })
  }

  // Dynamic campaign stats calculation
  const updateCampaignStats = (data) => {
    let estimatedReach = '10K - 100K'
    let expectedApplications = '5 - 20'
    let campaignDuration = '2 - 4 weeks'

    // Calculate reach based on category and budget
    if (data.category) {
      switch (data.category) {
        case 'Fashion & Beauty':
          estimatedReach = '50K - 500K'
          expectedApplications = '15 - 50'
          break
        case 'Technology':
          estimatedReach = '25K - 250K'
          expectedApplications = '10 - 30'
          break
        case 'Food & Beverage':
          estimatedReach = '30K - 300K'
          expectedApplications = '12 - 40'
          break
        case 'Travel & Lifestyle':
          estimatedReach = '40K - 400K'
          expectedApplications = '20 - 60'
          break
        default:
          estimatedReach = '20K - 200K'
          expectedApplications = '8 - 25'
      }
    }

    // Adjust based on budget range
    if (data.budget_range) {
      const budget = data.budget_range
      if (budget.includes('$25,000+')) {
        estimatedReach = '100K - 1M+'
        expectedApplications = '50 - 150'
        campaignDuration = '4 - 8 weeks'
      } else if (budget.includes('$10,000 - $25,000')) {
        estimatedReach = '75K - 750K'
        expectedApplications = '30 - 100'
        campaignDuration = '3 - 6 weeks'
      } else if (budget.includes('$5,000 - $10,000')) {
        estimatedReach = '50K - 500K'
        expectedApplications = '20 - 60'
        campaignDuration = '2 - 5 weeks'
      }
    }

    // Adjust based on deadline urgency
    if (data.deadline) {
      const deadlineDate = new Date(data.deadline)
      const now = new Date()
      const daysUntilDeadline = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24))
      
      if (daysUntilDeadline <= 7) {
        expectedApplications = Math.round(parseInt(expectedApplications.split(' - ')[0]) * 0.7) + ' - ' + Math.round(parseInt(expectedApplications.split(' - ')[1]) * 0.7)
        campaignDuration = '1 - 2 weeks'
      } else if (daysUntilDeadline <= 14) {
        campaignDuration = '1 - 3 weeks'
      }
    }

    setCampaignStats({
      estimatedReach,
      expectedApplications,
      campaignDuration
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!profile?.id) {
      setError('Profile not found. Please refresh and try again.')
      setLoading(false)
      return
    }

    try {
      const sanitizedData = {
        title: sanitizeFieldValue('title', formData.title),
        description: sanitizeFieldValue('description', formData.description),
        category: sanitizeFieldValue('category', formData.category),
        budget_range: sanitizeFieldValue('budget_range', formData.budget_range),
        creator_requirements: sanitizeFieldValue('creator_requirements', formData.creator_requirements),
        deadline: sanitizeFieldValue('deadline', formData.deadline)
      }

      const campaignData = {
        ...sanitizedData,
        brand_id: profile.id,
        status: 'active'
      }

      console.log('🚀 Creating campaign with data:', campaignData)

      const { data, error: campaignError } = await createCampaign(campaignData)

      if (campaignError) {
        console.error('❌ Campaign creation error:', campaignError)
        setError(campaignError.message || 'Failed to create campaign')
        setLoading(false)
        return
      }

      console.log('✅ Campaign created successfully:', data)
      
      // Add the new campaign to cache immediately so it appears on dashboard
      if (data && data.length > 0) {
        const newCampaign = data[0] // createCampaign returns array with the new campaign
        console.log('💾 Adding new campaign to cache:', newCampaign.title)
        addCampaignToCache(newCampaign)
      } else {
        // If data structure is different, clear cache so it refreshes on next load
        console.log('🧹 Clearing cache to ensure fresh data on dashboard')
        clearCampaignCache()
      }
      
      setSuccess(true)
      setTimeout(() => {
        router.push('/brand/dashboard')
      }, 2000)

    } catch (error) {
      console.error('❌ Campaign creation error:', error)
      setError(error.message || 'An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    setDraftLoading(true)
    setError('')

    if (!profile?.id) {
      setError('Profile not found. Please refresh and try again.')
      setDraftLoading(false)
      return
    }

    try {
      const sanitizedData = {
        title: sanitizeFieldValue('title', formData.title),
        description: sanitizeFieldValue('description', formData.description),
        category: sanitizeFieldValue('category', formData.category),
        budget_range: sanitizeFieldValue('budget_range', formData.budget_range),
        creator_requirements: sanitizeFieldValue('creator_requirements', formData.creator_requirements),
        deadline: sanitizeFieldValue('deadline', formData.deadline)
      }

      const campaignData = {
        ...sanitizedData,
        brand_id: profile.id,
        status: 'draft'
      }

      console.log('🔄 Saving campaign draft...', campaignData)

      const { data, error: campaignError } = await createCampaign(campaignData)

      if (campaignError) {
        console.error('❌ Draft save error:', campaignError)
        setError(campaignError.message || 'Failed to save draft')
        setDraftLoading(false)
        return
      }

      console.log('✅ Draft saved successfully:', data)
      
      // Add the new draft campaign to cache if it's not already there
      if (data && data.length > 0) {
        const newCampaign = data[0]
        console.log('💾 Adding new draft campaign to cache:', newCampaign.title)
        addCampaignToCache(newCampaign)
      } else {
        // Clear cache to ensure fresh data
        console.log('🧹 Clearing cache to ensure fresh data on dashboard')
        clearCampaignCache()
      }
      
      setSuccess('draft')
      setTimeout(() => {
        router.push('/brand/dashboard')
      }, 2000)

    } catch (error) {
      console.error('❌ Draft save error:', error)
      setError(error.message || 'An unexpected error occurred while saving draft')
      setDraftLoading(false)
    }
  }

  const handlePreview = () => {
    console.log('🔄 Opening campaign preview modal')
    setShowPreviewModal(true)
  }

  if (success === true) {
    return (
      <ProtectedRoute requiredRole="brand">
        <Layout variant="app">
          <Section padding="lg">
            <Container>
              <Card className="max-w-2xl mx-auto p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <Heading level={2} size="2xl" className="mb-2">
                  Campaign Created Successfully!
                </Heading>
                <Text className="mb-6">
                  Your campaign is now live and visible to creators.
                </Text>
                <Button onClick={() => router.push('/brand/dashboard')}>
                  Go to Dashboard
                </Button>
              </Card>
            </Container>
          </Section>
        </Layout>
      </ProtectedRoute>
    )
  }

  if (success === 'draft') {
    return (
      <ProtectedRoute requiredRole="brand">
        <Layout variant="app">
          <Section padding="lg">
            <Container>
              <Card className="max-w-2xl mx-auto p-8 text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Save className="w-8 h-8 text-blue-400" />
                </div>
                <Heading level={2} size="2xl" className="mb-2">
                  Draft Saved Successfully!
                </Heading>
                <Text className="mb-6">
                  Your campaign draft has been saved. You can continue editing it later from your dashboard.
                </Text>
                <Button onClick={() => router.push('/brand/dashboard')}>
                  Go to Dashboard
                </Button>
              </Card>
            </Container>
          </Section>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="brand">
      <Layout variant="app">
        <Section padding="lg">
          <Container>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Link href="/brand/dashboard">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
                <div>
                  <Heading level={1} size="3xl" className="mb-2">
                    Create Campaign Brief
                  </Heading>
                  <Text size="lg">
                    Post a new campaign and start connecting with creators
                  </Text>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Campaign Form */}
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Target className="w-5 h-5 text-[#8A2BE2]" />
                    <Heading level={3} size="lg">Campaign Details</Heading>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                      <Text size="sm" className="text-red-300">{error}</Text>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Text size="sm" weight="medium" className="mb-2">Campaign Title *</Text>
                      <input
                        name="title"
                        placeholder="e.g., Summer Collection Launch Campaign"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-[#2A2A3A] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-400 focus:border-[#8A2BE2] focus:outline-none focus:ring-1 focus:ring-[#8A2BE2]/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Text size="sm" weight="medium" className="mb-2">Campaign Description *</Text>
                      <textarea
                        name="description"
                        placeholder="Describe your campaign goals, key messages, and what you're looking for..."
                        rows={4}
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-[#2A2A3A] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-400 focus:border-[#8A2BE2] focus:outline-none focus:ring-1 focus:ring-[#8A2BE2]/50 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Text size="sm" weight="medium" className="mb-2">Category *</Text>
                        <select
                          value={formData.category}
                          onChange={(e) => handleSelectChange('category', e.target.value)}
                          required
                          className="w-full bg-[#2A2A3A] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#8A2BE2] focus:outline-none focus:ring-1 focus:ring-[#8A2BE2]/50"
                        >
                          <option value="" disabled>Select category</option>
                          {categories.map((category) => (
                            <option key={category} value={category} className="bg-[#2A2A3A] text-white">
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Text size="sm" weight="medium" className="mb-2">Budget Range *</Text>
                        <select
                          value={formData.budget_range}
                          onChange={(e) => handleSelectChange('budget_range', e.target.value)}
                          required
                          className="w-full bg-[#2A2A3A] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#8A2BE2] focus:outline-none focus:ring-1 focus:ring-[#8A2BE2]/50"
                        >
                          <option value="" disabled>Select budget range</option>
                          {budgetRanges.map((range) => (
                            <option key={range} value={range} className="bg-[#2A2A3A] text-white">
                              {range}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Text size="sm" weight="medium" className="mb-2">Creator Requirements</Text>
                      <textarea
                        name="creator_requirements"
                        placeholder="Specify follower count, engagement rates, content style, or any other requirements..."
                        rows={3}
                        value={formData.creator_requirements}
                        onChange={handleInputChange}
                        className="w-full bg-[#2A2A3A] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-400 focus:border-[#8A2BE2] focus:outline-none focus:ring-1 focus:ring-[#8A2BE2]/50 resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Text size="sm" weight="medium" className="mb-2">Application Deadline</Text>
                      <div className="relative">
                        <input
                          name="deadline"
                          type="date"
                          value={formData.deadline}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full bg-[#2A2A3A] border border-white/10 rounded-lg px-4 py-3 pr-12 text-white focus:border-[#8A2BE2] focus:outline-none focus:ring-1 focus:ring-[#8A2BE2]/50 
                          [&::-webkit-calendar-picker-indicator]:opacity-0 
                          [&::-webkit-calendar-picker-indicator]:absolute 
                          [&::-webkit-calendar-picker-indicator]:right-3 
                          [&::-webkit-calendar-picker-indicator]:w-6 
                          [&::-webkit-calendar-picker-indicator]:h-6 
                          [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          placeholder="Select deadline date"
                        />
                        {/* Custom calendar icon overlay */}
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <Calendar className="w-5 h-5 text-gray-300 hover:text-[#8A2BE2] transition-colors" />
                        </div>
                        {/* Clickable overlay to trigger date picker */}
                        <div 
                          className="absolute right-0 top-0 w-12 h-full cursor-pointer flex items-center justify-center hover:bg-white/5 rounded-r-lg transition-colors"
                          onClick={() => {
                            const input = document.querySelector('input[name="deadline"]');
                            if (input) input.showPicker?.();
                          }}
                        >
                        </div>
                      </div>
                      {formData.deadline && (
                        <Text size="xs" className="text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Applications due on {new Date(formData.deadline).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      )}
                    </div>

                    <div className="flex justify-between pt-6 border-t border-white/10">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleSaveDraft}
                        disabled={loading || draftLoading}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {draftLoading ? 'Saving Draft...' : 'Save as Draft'}
                      </Button>

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handlePreview}
                          disabled={loading || draftLoading}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={loading || draftLoading}
                        >
                          {loading ? 'Creating...' : 'Create Campaign'}
                        </Button>
                      </div>
                    </div>
                  </form>
                </Card>
              </div>

              {/* Campaign Stats & Tips */}
              <div className="lg:col-span-1 space-y-6">
                {/* Dynamic Campaign Stats */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-5 h-5 text-[#8A2BE2]" />
                    <Heading level={3} size="lg">Campaign Insights</Heading>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Text size="sm" weight="medium" color="secondary" className="mb-2">Estimated Reach</Text>
                      <Text size="lg" weight="bold" className="text-blue-400">
                        {campaignStats.estimatedReach}
                      </Text>
                      <Text size="xs" color="secondary">
                        Based on category and budget
                      </Text>
                    </div>
                    
                    <div>
                      <Text size="sm" weight="medium" color="secondary" className="mb-2">Expected Applications</Text>
                      <Text size="lg" weight="bold" className="text-green-400">
                        {campaignStats.expectedApplications}
                      </Text>
                      <Text size="xs" color="secondary">
                        Projected creator interest
                      </Text>
                    </div>
                    
                    <div>
                      <Text size="sm" weight="medium" color="secondary" className="mb-2">Campaign Duration</Text>
                      <Text size="lg" weight="bold" className="text-purple-400">
                        {campaignStats.campaignDuration}
                      </Text>
                      <Text size="xs" color="secondary">
                        Typical completion time
                      </Text>
                    </div>

                    {formData.category && (
                      <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <Text size="sm" className="text-blue-300">
                          <strong>{formData.category}</strong> campaigns typically perform well with lifestyle and product showcase content.
                        </Text>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Tips & Guidelines */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Lightbulb className="w-5 h-5 text-[#8A2BE2]" />
                    <Heading level={3} size="lg">Campaign Tips</Heading>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Text size="sm" weight="medium" className="mb-2">Write a Clear Title</Text>
                      <Text size="sm" color="secondary">
                        Make it descriptive and specific to attract the right creators.
                      </Text>
                    </div>
                    
                    <div>
                      <Text size="sm" weight="medium" className="mb-2">Detailed Description</Text>
                      <Text size="sm" color="secondary">
                        Include campaign goals, key messages, deliverables, and timeline.
                      </Text>
                    </div>
                    
                    <div>
                      <Text size="sm" weight="medium" className="mb-2">Set Clear Requirements</Text>
                      <Text size="sm" color="secondary">
                        Specify follower count, content style, and any platform preferences.
                      </Text>
                    </div>
                    
                    <div>
                      <Text size="sm" weight="medium" className="mb-2">Fair Budget Range</Text>
                      <Text size="sm" color="secondary">
                        Offer competitive compensation to attract quality creators.
                      </Text>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Preview Modal */}
            {showPreviewModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-[#1A1A2E] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/10">
                  <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <Eye className="w-6 h-6 text-[#8A2BE2]" />
                      <Heading level={2} size="xl">Campaign Preview</Heading>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreviewModal(false)}
                      className="hover:bg-white/5"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <div className="p-6">
                    <div className="bg-gradient-to-r from-[#8A2BE2]/10 to-[#FF1493]/10 rounded-lg border-2 border-dashed border-[#8A2BE2]/30 p-6 mb-6">
                      <Text size="sm" className="text-[#8A2BE2] text-center">
                        ✨ This is how your campaign will appear to creators on their dashboard
                      </Text>
                    </div>

                    <Card className="shadow-lg border-white/10 p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex-1">
                          <Heading level={2} size="2xl" className="mb-2">
                            {formData.title || 'Untitled Campaign'}
                          </Heading>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                            <div className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              <span>{profile?.company_name || 'Your Company'}</span>
                            </div>
                            {formData.category && (
                              <Badge variant="secondary">{formData.category}</Badge>
                            )}
                          </div>
                        </div>
                        {formData.budget_range && (
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-lg font-semibold text-green-400">
                              <DollarSign className="w-5 h-5" />
                              <span>{formData.budget_range}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <Heading level={3} size="lg" className="mb-2">Campaign Description</Heading>
                          <Text className="whitespace-pre-wrap">
                            {formData.description || 'No description provided yet.'}
                          </Text>
                        </div>

                        {formData.creator_requirements && (
                          <div>
                            <Heading level={3} size="lg" className="mb-2 flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Creator Requirements
                            </Heading>
                            <Text className="whitespace-pre-wrap bg-[#2A2A3A]/50 p-3 rounded-lg">
                              {formData.creator_requirements}
                            </Text>
                          </div>
                        )}

                        {formData.deadline && (
                          <div>
                            <Heading level={3} size="lg" className="mb-2 flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Application Deadline
                            </Heading>
                            <Text>
                              {new Date(formData.deadline).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </Text>
                          </div>
                        )}

                        <div className="border-t border-white/10 pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-400">{campaignStats.estimatedReach}</div>
                              <div className="text-sm text-gray-400">Estimated Reach</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-400">{campaignStats.expectedApplications}</div>
                              <div className="text-sm text-gray-400">Expected Applications</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-400">{campaignStats.campaignDuration}</div>
                              <div className="text-sm text-gray-400">Campaign Duration</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-white/10">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">Posted just now</span>
                          </div>
                          <Button>
                            Apply Now
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                  
                  <div className="border-t border-white/10 p-6 bg-[#2A2A3A]/30">
                    <div className="flex justify-end gap-3">
                      <Button 
                        variant="ghost" 
                        onClick={() => setShowPreviewModal(false)}
                      >
                        Close Preview
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Container>
        </Section>
      </Layout>
    </ProtectedRoute>
  )
}