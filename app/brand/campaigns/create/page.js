'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Navigation from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createCampaign } from '@/lib/supabase'
import { sanitizeFieldValue } from '@/lib/xss-protection'
import { ArrowLeft, Save, Eye } from 'lucide-react'
import Link from 'next/link'

export default function CreateCampaignPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
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
      const campaignData = {
        ...formData,
        brand_id: profile.id,
        status: 'active'
      }

      const { data, error: campaignError } = await createCampaign(campaignData)

      if (campaignError) {
        setError(campaignError.message || 'Failed to create campaign')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/brand/dashboard')
      }, 2000)

    } catch (error) {
      setError(error.message || 'An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    // TODO: Implement save as draft functionality
    console.log('Save as draft:', formData)
  }

  if (success) {
    return (
      <ProtectedRoute requiredRole="brand">
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="container mx-auto px-4 py-8">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Save className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Campaign Created Successfully!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your campaign "{formData.title}" is now live and visible to creators.
                </p>
                <div className="flex justify-center gap-4">
                  <Link href="/brand/dashboard">
                    <Button>
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Link href="/brand/campaigns/create">
                    <Button variant="outline">
                      Create Another Campaign
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="brand">
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/brand/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-montserrat font-bold text-gray-900">
                  Create Campaign Brief
                </h1>
                <p className="text-gray-600">
                  Post a new campaign and start connecting with creators
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Campaign Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {error && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Campaign Title *</Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="e.g., Summer Collection Launch Campaign"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Campaign Description *</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Describe your campaign goals, key messages, and what you're looking for..."
                        rows={4}
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category *</Label>
                        <Select onValueChange={(value) => handleSelectChange('category', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Budget Range *</Label>
                        <Select onValueChange={(value) => handleSelectChange('budget_range', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select budget range" />
                          </SelectTrigger>
                          <SelectContent>
                            {budgetRanges.map((range) => (
                              <SelectItem key={range} value={range}>
                                {range}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="creator_requirements">Creator Requirements</Label>
                      <Textarea
                        id="creator_requirements"
                        name="creator_requirements"
                        placeholder="Specify follower count, engagement rates, content style, or any other requirements..."
                        rows={3}
                        value={formData.creator_requirements}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deadline">Application Deadline</Label>
                      <Input
                        id="deadline"
                        name="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="flex justify-between pt-6 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSaveDraft}
                        disabled={loading}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save as Draft
                      </Button>

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={loading}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        <Button type="submit" disabled={loading}>
                          {loading ? 'Creating...' : 'Create Campaign'}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Tips & Guidelines */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Write a Clear Title</h4>
                    <p className="text-sm text-gray-600">
                      Make it descriptive and specific to attract the right creators.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Detailed Description</h4>
                    <p className="text-sm text-gray-600">
                      Include campaign goals, key messages, deliverables, and timeline.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Set Clear Requirements</h4>
                    <p className="text-sm text-gray-600">
                      Specify follower count, content style, and any platform preferences.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Fair Budget Range</h4>
                    <p className="text-sm text-gray-600">
                      Offer competitive compensation to attract quality creators.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Campaign Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Estimated Reach</span>
                      <span className="text-sm font-medium">10K - 100K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Expected Applications</span>
                      <span className="text-sm font-medium">5 - 20</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Campaign Duration</span>
                      <span className="text-sm font-medium">2 - 4 weeks</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}