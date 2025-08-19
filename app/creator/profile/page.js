'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/shared/Layout'
import { Container, Section } from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Heading, Text } from '@/components/ui/Typography'
import { updateProfile, uploadFile, getFileUrl } from '@/lib/supabase'
import { sanitizeFieldValue } from '@/lib/xss-protection'
import { 
  User,
  Camera,
  Upload,
  Save,
  Plus,
  X,
  ExternalLink,
  Instagram,
  Globe,
  FileText,
  CheckCircle
} from 'lucide-react'

export default function CreatorProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState({})
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    website_url: '',
    social_links: {
      instagram: '',
      tiktok: '',
      youtube: '',
      twitter: ''
    },
    category_tags: []
  })

  const [newTag, setNewTag] = useState('')
  const [mediaKitFile, setMediaKitFile] = useState(null)

  const categories = [
    'Fashion & Beauty', 'Technology', 'Food & Beverage', 'Travel & Lifestyle',
    'Health & Wellness', 'Entertainment', 'Education', 'Sports & Fitness',
    'Home & Garden', 'Business & Finance', 'Art & Design', 'Music',
    'Gaming', 'Parenting', 'DIY & Crafts', 'Photography'
  ]

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        website_url: profile.website_url || '',
        social_links: {
          instagram: profile.social_links?.instagram || '',
          tiktok: profile.social_links?.tiktok || '',
          youtube: profile.social_links?.youtube || '',
          twitter: profile.social_links?.twitter || ''
        },
        category_tags: profile.category_tags || []
      })
    }
  }, [profile])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    // Don't sanitize during typing - only store the raw value
    // Sanitization will happen on form submission
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSocialLinkChange = (platform, value) => {
    // Don't sanitize during typing - only store the raw value
    // Sanitization will happen on form submission
    setFormData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value
      }
    }))
  }

  const addCategoryTag = (category) => {
    if (!formData.category_tags.includes(category)) {
      setFormData(prev => ({
        ...prev,
        category_tags: [...prev.category_tags, category]
      }))
    }
  }

  const removeCategoryTag = (category) => {
    setFormData(prev => ({
      ...prev,
      category_tags: prev.category_tags.filter(tag => tag !== category)
    }))
  }

  const addCustomTag = () => {
    if (newTag.trim() && !formData.category_tags.includes(newTag.trim())) {
      const sanitizedTag = sanitizeFieldValue('category', newTag.trim())
      setFormData(prev => ({
        ...prev,
        category_tags: [...prev.category_tags, sanitizedTag]
      }))
      setNewTag('')
    }
  }

  const handleMediaKitUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB')
      return
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, JPEG, PNG, or WebP file')
      return
    }

    setUploadLoading(prev => ({ ...prev, mediaKit: true }))
    setError('')

    try {
      const fileName = `${profile.id}/media-kit-${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await uploadFile('media-kits', fileName, file)
      
      if (uploadError) throw new Error(uploadError.message)

      const mediaKitUrl = getFileUrl('media-kits', fileName)
      
      // Update profile with media kit URL
      const { error: updateError } = await updateProfile(profile.id, {
        media_kit_url: mediaKitUrl
      })
      
      if (updateError) throw new Error(updateError.message)
      
      await refreshProfile()
      setSuccess('Media kit uploaded successfully!')
      
    } catch (error) {
      console.error('Error uploading media kit:', error)
      setError(error.message || 'Failed to upload media kit')
    } finally {
      setUploadLoading(prev => ({ ...prev, mediaKit: false }))
    }
  }

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Image size must be less than 5MB')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP image')
      return
    }

    setUploadLoading(prev => ({ ...prev, profilePicture: true }))
    setError('')

    try {
      const fileName = `${profile.id}/profile-${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await uploadFile('profiles', fileName, file)
      
      if (uploadError) throw new Error(uploadError.message)

      const profilePictureUrl = getFileUrl('profiles', fileName)
      
      // Update profile with new picture
      const { error: updateError } = await updateProfile(profile.id, {
        profile_picture: profilePictureUrl
      })
      
      if (updateError) throw new Error(updateError.message)
      
      await refreshProfile()
      setSuccess('Profile picture updated successfully!')
      
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      setError(error.message || 'Failed to upload profile picture')
    } finally {
      setUploadLoading(prev => ({ ...prev, profilePicture: false }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      console.log('🔄 Starting Creator profile save process...')
      
      // Sanitize form data before submission
      const sanitizedData = {}
      for (const [key, value] of Object.entries(formData)) {
        sanitizedData[key] = sanitizeFieldValue(key, value)
      }
      
      // Enhanced timeout handling for production reliability
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile save request timed out. Please check your connection and try again.')), 30000)
      )
      
      const updatePromise = updateProfile(profile.id, sanitizedData)
      
      // Race between update and timeout
      const { error: updateError } = await Promise.race([updatePromise, timeoutPromise])
      
      if (updateError) throw new Error(updateError.message)

      console.log('✅ Creator profile update successful, refreshing profile...')
      await refreshProfile()
      setSuccess('Profile updated successfully!')
      console.log('🎉 Creator profile save completed successfully')
      
    } catch (error) {
      console.error('❌ Creator profile save failed:', error)
      if (error.message.includes('timed out')) {
        setError('Profile save timed out. Please check your internet connection and try again.')
      } else {
        setError(error.message || 'Failed to update profile')
      }
    } finally {
      setLoading(false)
    }
  }

  const profileCompletion = () => {
    let completed = 0
    const total = 7
    
    if (formData.full_name) completed++
    if (formData.bio) completed++
    if (profile?.profile_picture) completed++
    if (Object.values(formData.social_links).some(link => link)) completed++
    if (formData.category_tags.length > 0) completed++
    if (formData.website_url) completed++
    if (profile?.media_kit_url) completed++
    
    return Math.round((completed / total) * 100)
  }

  return (
    <ProtectedRoute requiredRole="creator">
      <Layout variant="app">
        <Section padding="lg">
          <Container>
            <div className="flex items-center justify-between mb-8">
              <div>
                <Heading level={1} size="3xl">Creator Profile</Heading>
                <Text size="lg" color="secondary">
                  Complete your profile to attract more brand opportunities
                </Text>
              </div>
              <div className="text-right">
                <Text size="sm" color="secondary">Profile Complete</Text>
                <Heading level={3} size="2xl">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]">
                    {profileCompletion()}%
                  </span>
                </Heading>
              </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="bg-green-500/20 border border-green-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <Text size="sm" color="primary" className="text-green-400">{success}</Text>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/20 rounded-lg p-4 mb-6">
                <Text size="sm" color="primary" className="text-red-400">{error}</Text>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Picture & Media Kit */}
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="text-center space-y-6">
                    <div>
                      <Text weight="semibold" className="mb-4">Profile Picture</Text>
                      <div className="relative inline-block">
                        <Avatar 
                          name={formData.full_name} 
                          src={profile?.profile_picture}
                          size="xl"
                        />
                        <label className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                          <Camera className="w-4 h-4 text-white" />
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleProfilePictureUpload}
                            className="hidden"
                            disabled={uploadLoading.profilePicture}
                          />
                        </label>
                      </div>
                      {uploadLoading.profilePicture && (
                        <Text size="sm" color="secondary" className="mt-2">Uploading...</Text>
                      )}
                    </div>

                    <div className="pt-6 border-t border-white/10">
                      <Text weight="semibold" className="mb-4">Media Kit</Text>
                      {profile?.media_kit_url ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-2 text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <Text size="sm">Media kit uploaded</Text>
                          </div>
                          <a 
                            href={profile.media_kit_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[#8A2BE2] hover:text-[#FF1493] transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            <Text size="sm">View Media Kit</Text>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <Text size="sm" color="secondary" className="mb-4">
                          Upload your media kit or rate card
                        </Text>
                      )}
                      
                      <label className="block">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="w-full"
                          disabled={uploadLoading.mediaKit}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadLoading.mediaKit ? 'Uploading...' : 'Upload Media Kit'}
                        </Button>
                        <input
                          type="file"
                          accept=".pdf,image/jpeg,image/png,image/webp"
                          onChange={handleMediaKitUpload}
                          className="hidden"
                          disabled={uploadLoading.mediaKit}
                        />
                      </label>
                      <Text size="xs" color="secondary" className="mt-2">
                        PDF, JPEG, PNG, or WebP (max 10MB)
                      </Text>
                    </div>
                  </div>
                </Card>

                {/* Profile Completion */}
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-[#8A2BE2]" />
                      <Text weight="semibold">Profile Completion</Text>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Text size="sm">Progress</Text>
                        <Text size="sm" color="secondary">{profileCompletion()}%</Text>
                      </div>
                      <div className="w-full bg-[#2A2A3A] rounded-full h-3">
                        <div 
                          className="h-3 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full transition-all"
                          style={{ width: `${profileCompletion()}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {[
                        { label: 'Full Name', completed: !!formData.full_name },
                        { label: 'Bio', completed: !!formData.bio },
                        { label: 'Profile Picture', completed: !!profile?.profile_picture },
                        { label: 'Social Links', completed: Object.values(formData.social_links).some(link => link) },
                        { label: 'Categories', completed: formData.category_tags.length > 0 },
                        { label: 'Website', completed: !!formData.website_url },
                        { label: 'Media Kit', completed: !!profile?.media_kit_url }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <Text size="sm">{item.label}</Text>
                          {item.completed ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-gray-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Profile Form */}
              <div className="lg:col-span-2">
                <Card className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Text size="sm" weight="medium" color="primary">Full Name *</Text>
                      <Input
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Text size="sm" weight="medium" color="primary">Bio</Text>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Tell brands about yourself, your content style, and your audience..."
                        className="w-full bg-[#1C1C2D] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-[#8A2BE2] focus:outline-none min-h-[120px] resize-vertical"
                      />
                    </div>

                    <div className="space-y-2">
                      <Text size="sm" weight="medium" color="primary">Website URL</Text>
                      <Input
                        name="website_url"
                        type="url"
                        value={formData.website_url}
                        onChange={handleInputChange}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    {/* Social Links */}
                    <div className="space-y-4">
                      <Text size="sm" weight="medium" color="primary">Social Media Links</Text>
                      <div className="grid md:grid-cols-2 gap-4">
                        {Object.entries(formData.social_links).map(([platform, url]) => (
                          <div key={platform} className="space-y-2">
                            <Text size="sm" color="secondary" className="capitalize">{platform}</Text>
                            <Input
                              type="url"
                              value={url}
                              onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                              placeholder={`Your ${platform} profile URL`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-4">
                      <Text size="sm" weight="medium" color="primary">Content Categories</Text>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {categories.map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => addCategoryTag(category)}
                              disabled={formData.category_tags.includes(category)}
                              className={`p-2 rounded-lg text-sm transition-all ${
                                formData.category_tags.includes(category)
                                  ? 'bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white cursor-not-allowed'
                                  : 'bg-[#2A2A3A] text-gray-300 hover:bg-[#3A3A4A] border border-white/10'
                              }`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add custom category"
                            className="flex-1"
                          />
                          <Button type="button" onClick={addCustomTag} size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {formData.category_tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {formData.category_tags.map((tag) => (
                              <Badge 
                                key={tag}
                                variant="primary" 
                                className="flex items-center gap-1"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeCategoryTag(tag)}
                                  className="hover:bg-white/20 rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-white/10">
                      <Button type="submit" disabled={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Saving...' : 'Save Profile'}
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            </div>
          </Container>
        </Section>
      </Layout>
    </ProtectedRoute>
  )
}