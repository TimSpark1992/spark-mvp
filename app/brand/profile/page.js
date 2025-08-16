'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
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
  Building2,
  Camera,
  Upload,
  Save,
  Plus,
  X,
  ExternalLink,
  Globe,
  FileText,
  CheckCircle,
  MapPin,
  Users
} from 'lucide-react'

export default function BrandProfilePage() {
  const { profile, setProfile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState({})
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('') // 'success' or 'error'
  const [modalMessage, setModalMessage] = useState('')
  const [isFirstTimeCompletion, setIsFirstTimeCompletion] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    company_name: '',
    company_description: '',
    company_size: '',
    industry: '',
    location: '',
    website_url: '',
    social_links: {
      instagram: '',
      facebook: '',
      twitter: '',
      linkedin: ''
    },
    brand_categories: []
  })

  const [newCategory, setNewCategory] = useState('')

  const companySizes = [
    '1-10 employees',
    '11-50 employees', 
    '51-200 employees',
    '201-1000 employees',
    '1000+ employees'
  ]

  const industries = [
    'Fashion & Beauty', 'Technology', 'Food & Beverage', 'Travel & Tourism',
    'Health & Wellness', 'Entertainment', 'Education', 'Sports & Fitness',
    'Home & Garden', 'Automotive', 'Financial Services', 'Real Estate',
    'E-commerce', 'Gaming', 'Software & Apps', 'Consulting',
    'Healthcare', 'Manufacturing', 'Non-profit', 'Other'
  ]

  const brandCategories = [
    'Consumer Electronics', 'Fashion & Apparel', 'Beauty & Cosmetics', 
    'Food & Beverage', 'Travel & Hospitality', 'Health & Wellness',
    'Home & Living', 'Sports & Outdoors', 'Entertainment & Media',
    'Automotive', 'Technology & Software', 'Finance & Banking',
    'Education & Learning', 'Gaming', 'Sustainability', 'Luxury'
  ]

  // Check if this is first-time profile completion
  useEffect(() => {
    if (profile) {
      // Consider it first-time if profile is mostly empty
      const isProfileEmpty = !profile.company_name || 
                            !profile.company_description || 
                            !profile.industry ||
                            !profile.brand_categories?.length
      setIsFirstTimeCompletion(isProfileEmpty)
    }
  }, [profile])

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        company_name: profile.company_name || '',
        company_description: profile.company_description || '',
        company_size: profile.company_size || '',
        industry: profile.industry || '',
        location: profile.location || '',
        website_url: profile.website_url || '',
        social_links: {
          instagram: profile.social_links?.instagram || '',
          facebook: profile.social_links?.facebook || '',
          twitter: profile.social_links?.twitter || '',
          linkedin: profile.social_links?.linkedin || ''
        },
        brand_categories: profile.brand_categories || []
      })
    }
  }, [profile])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    // Store raw input during typing, sanitize only on form submission
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSocialLinkChange = (platform, value) => {
    // Allow empty social links without validation
    setFormData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value
      }
    }))
  }

  const addBrandCategory = (category) => {
    if (!formData.brand_categories.includes(category)) {
      setFormData(prev => ({
        ...prev,
        brand_categories: [...prev.brand_categories, category]
      }))
    }
  }

  const removeBrandCategory = (category) => {
    console.log('🗑️ Removing brand category:', category)
    setFormData(prev => ({
      ...prev,
      brand_categories: prev.brand_categories.filter(cat => cat !== category)
    }))
  }

  const addCustomCategory = () => {
    if (newCategory.trim() && !formData.brand_categories.includes(newCategory.trim())) {
      const sanitizedCategory = sanitizeFieldValue('category', newCategory.trim())
      setFormData(prev => ({
        ...prev,
        brand_categories: [...prev.brand_categories, sanitizedCategory]
      }))
      setNewCategory('')
    }
  }

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('🖼️ Starting profile picture upload:', file.name, 'size:', file.size)

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
      console.log('🔄 Uploading to bucket "profiles" with path:', fileName)
      
      const { data: uploadData, error: uploadError } = await uploadFile('profiles', fileName, file)
      
      if (uploadError) {
        console.error('❌ Upload error:', uploadError)
        
        // Handle specific storage bucket errors
        if (uploadError.message.includes('Bucket not found')) {
          setError('Storage bucket not configured. Please contact support to set up file upload.')
        } else if (uploadError.message.includes('The resource was not found')) {
          setError('File upload service unavailable. Please try again later or contact support.')
        } else {
          setError(`Upload failed: ${uploadError.message}`)
        }
        return
      }

      console.log('✅ Upload successful:', uploadData)

      const profilePictureUrl = getFileUrl('profiles', fileName)
      console.log('🔗 Generated public URL:', profilePictureUrl)
      
      // Update profile with new picture
      const { error: updateError } = await updateProfile(profile.id, {
        profile_picture: profilePictureUrl
      })
      
      if (updateError) {
        console.error('❌ Profile update error:', updateError)
        setError(`Failed to save profile picture: ${updateError.message}`)
        return
      }

      console.log('✅ Profile updated with new picture')
      
      // Update the profile context directly with the correct URL
      setProfile({ ...profile, profile_picture: profilePictureUrl })
      
      // Show success modal instead of small message
      setModalType('success')
      setModalMessage('Profile picture updated successfully! Your new profile picture is now visible.')
      setShowModal(true)
      
    } catch (error) {
      console.error('❌ Profile picture upload error:', error)
      setError(error.message || 'Failed to upload profile picture')
    } finally {
      setUploadLoading(prev => ({ ...prev, profilePicture: false }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('🔄 Starting profile save process...')
    
    // Prevent double submission
    if (loading) {
      console.log('⚠️ Already saving, preventing double submission')
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess('')

    // Fallback timer to prevent infinite loading
    const fallbackTimer = setTimeout(() => {
      console.error('❌ Profile save taking too long, forcing completion')
      setLoading(false)
      setError('Save operation timed out. Please try again.')
    }, 15000) // 15 second timeout

    try {
      console.log('📋 Original form data:', formData)
      
      // Simplified data preparation without complex sanitization that might fail
      const sanitizedData = {
        full_name: String(formData.full_name || '').trim(),
        company_name: String(formData.company_name || '').trim(),
        company_description: String(formData.company_description || '').trim(),
        industry: String(formData.industry || '').trim(),
        company_size: String(formData.company_size || '').trim(),
        location: String(formData.location || '').trim(),
        website_url: String(formData.website_url || '').trim(),
        social_links: {
          instagram: String(formData.social_links?.instagram || '').trim(),
          facebook: String(formData.social_links?.facebook || '').trim(),
          twitter: String(formData.social_links?.twitter || '').trim(),
          linkedin: String(formData.social_links?.linkedin || '').trim()
        },
        brand_categories: Array.isArray(formData.brand_categories) ? formData.brand_categories : []
      }
      
      console.log('✅ Data preparation successful:', sanitizedData)

      console.log('💾 Attempting to save profile for user:', profile?.id)
      
      if (!profile?.id) {
        throw new Error('User profile ID not found. Please refresh the page and try again.')
      }

      // Call updateProfile with comprehensive error handling
      console.log('🔄 Calling updateProfile API...')
      const result = await updateProfile(profile.id, sanitizedData)
      console.log('📡 UpdateProfile API response:', result)
      
      if (result.error) {
        console.error('❌ Profile update error:', result.error)
        throw new Error(result.error.message || 'Failed to update profile')
      }

      console.log('✅ Profile API update successful')
      
      // Clear the fallback timer since we succeeded
      clearTimeout(fallbackTimer)
      
      // Update the profile context with error handling
      try {
        if (setProfile && typeof setProfile === 'function') {
          console.log('🔄 Updating profile context...')
          setProfile(prevProfile => {
            const updatedProfile = { ...prevProfile, ...sanitizedData }
            console.log('✅ Profile context updated to:', updatedProfile)
            return updatedProfile
          })
        } else {
          console.warn('⚠️ setProfile function not available')
        }
      } catch (contextError) {
        console.error('❌ Error updating profile context:', contextError)
        // Don't throw here, the save was successful
      }
      
      // Show prominent success modal instead of small message
      setModalType('success')
      if (isFirstTimeCompletion) {
        setModalMessage('Welcome to Spark! Your brand profile has been created successfully. Redirecting you to your dashboard...')
      } else {
        setModalMessage('Your brand profile has been updated successfully! All changes have been saved.')
      }
      setShowModal(true)
      console.log('🎉 Profile save process completed successfully')
      
      // Redirect to dashboard if this is first-time profile completion
      if (isFirstTimeCompletion) {
        console.log('🔄 First-time profile completion detected, redirecting to dashboard...')
        setTimeout(() => {
          router.push('/brand/dashboard')
        }, 2000) // 2 second delay to show success message
      }
      
    } catch (error) {
      console.error('❌ Profile save failed:', error)
      clearTimeout(fallbackTimer)
      
      // More specific error messages
      let errorMessage = 'Failed to update profile. Please try again.'
      if (error.message.includes('timeout')) {
        errorMessage = 'Save operation timed out. Please check your connection and try again.'
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      // Show prominent error modal instead of small message
      setModalType('error')
      setModalMessage(errorMessage)
      setShowModal(true)
    } finally {
      console.log('🏁 Setting loading to false')
      clearTimeout(fallbackTimer)
      setLoading(false)
    }
  }

  const profileCompletion = () => {
    let completed = 0
    const total = 9
    
    if (formData.full_name) completed++
    if (formData.company_name) completed++
    if (formData.company_description) completed++
    if (formData.industry) completed++
    if (formData.company_size) completed++
    if (formData.location) completed++
    if (profile?.profile_picture) completed++
    if (Object.values(formData.social_links).some(link => link)) completed++
    if (formData.brand_categories.length > 0) completed++
    
    return Math.round((completed / total) * 100)
  }

  return (
    <ProtectedRoute requiredRole="brand">
      <Layout variant="app">
        <Section padding="lg">
          <Container>
            <div className="flex items-center justify-between mb-8">
              <div>
                <Heading level={1} size="3xl">Brand Profile</Heading>
                <Text size="lg" color="secondary">
                  Complete your brand profile to attract top creators
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

            {/* Success and Error Messages - Remove old small messages */}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Picture & Stats */}
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="text-center space-y-6">
                    <div>
                      <Text weight="semibold" className="mb-4">Brand Logo</Text>
                      <div className="relative inline-block">
                        <Avatar 
                          name={formData.company_name || formData.full_name} 
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
                  </div>
                </Card>

                {/* Profile Completion */}
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-[#8A2BE2]" />
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
                        { label: 'Contact Name', completed: !!formData.full_name },
                        { label: 'Company Name', completed: !!formData.company_name },
                        { label: 'Description', completed: !!formData.company_description },
                        { label: 'Industry', completed: !!formData.industry },
                        { label: 'Company Size', completed: !!formData.company_size },
                        { label: 'Location', completed: !!formData.location },
                        { label: 'Brand Logo', completed: !!profile?.profile_picture },
                        { label: 'Social Links', completed: Object.values(formData.social_links).some(link => link) },
                        { label: 'Categories', completed: formData.brand_categories.length > 0 }
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
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Text size="sm" weight="medium" color="primary">Contact Name *</Text>
                        <Input
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Text size="sm" weight="medium" color="primary">Company Name *</Text>
                        <Input
                          name="company_name"
                          value={formData.company_name}
                          onChange={handleInputChange}
                          placeholder="Your company name"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Text size="sm" weight="medium" color="primary">Company Description</Text>
                      <textarea
                        name="company_description"
                        value={formData.company_description}
                        onChange={handleInputChange}
                        placeholder="Describe your company, products, and what makes your brand unique..."
                        className="w-full bg-[#1C1C2D] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-[#8A2BE2] focus:outline-none min-h-[120px] resize-vertical"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Text size="sm" weight="medium" color="primary">Industry</Text>
                        <select
                          name="industry"
                          value={formData.industry}
                          onChange={handleInputChange}
                          className="w-full bg-[#1C1C2D] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#8A2BE2] focus:outline-none"
                        >
                          <option value="">Select industry</option>
                          {industries.map(industry => (
                            <option key={industry} value={industry}>{industry}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Text size="sm" weight="medium" color="primary">Company Size</Text>
                        <select
                          name="company_size"
                          value={formData.company_size}
                          onChange={handleInputChange}
                          className="w-full bg-[#1C1C2D] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#8A2BE2] focus:outline-none"
                        >
                          <option value="">Select company size</option>
                          {companySizes.map(size => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Text size="sm" weight="medium" color="primary">Location</Text>
                        <Input
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          placeholder="City, Country"
                        />
                      </div>

                      <div className="space-y-2">
                        <Text size="sm" weight="medium" color="primary">Website URL</Text>
                        <Input
                          name="website_url"
                          type="text"
                          value={formData.website_url}
                          onChange={handleInputChange}
                          placeholder="https://yourcompany.com (optional)"
                        />
                        {formData.website_url && !/^https?:\/\/.+/.test(formData.website_url) && (
                          <Text size="xs" color="secondary" className="text-yellow-400">
                            Include http:// or https:// for valid URL
                          </Text>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Text size="sm" weight="medium" color="primary">Brand Bio</Text>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Tell creators about your brand values, target audience, and collaboration preferences..."
                        className="w-full bg-[#1C1C2D] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-[#8A2BE2] focus:outline-none min-h-[100px] resize-vertical"
                      />
                    </div>

                    {/* Social Links */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Text size="sm" weight="medium" color="primary">Brand Social Media</Text>
                        <Text size="xs" color="secondary">(Optional - leave empty if not applicable)</Text>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        {Object.entries(formData.social_links).map(([platform, url]) => (
                          <div key={platform} className="space-y-2">
                            <Text size="sm" color="secondary" className="capitalize">
                              {platform === 'linkedin' ? 'LinkedIn' : platform}
                            </Text>
                            <Input
                              type="text"
                              value={url}
                              onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                              placeholder={
                                platform === 'instagram' ? 'https://instagram.com/yourbrand (optional)' :
                                platform === 'facebook' ? 'https://facebook.com/yourbrand (optional)' :
                                platform === 'twitter' ? 'https://twitter.com/yourbrand (optional)' :
                                'https://linkedin.com/company/yourbrand (optional)'
                              }
                            />
                            {url && !/^https?:\/\/.+/.test(url) && (
                              <Text size="xs" color="secondary" className="text-yellow-400">
                                Include http:// or https:// for valid URL
                              </Text>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Brand Categories */}
                    <div className="space-y-4">
                      <Text size="sm" weight="medium" color="primary">Brand Categories</Text>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {brandCategories.map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => addBrandCategory(category)}
                              disabled={formData.brand_categories.includes(category)}
                              className={`p-2 rounded-lg text-sm transition-all ${
                                formData.brand_categories.includes(category)
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
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Add custom category"
                            className="flex-1"
                          />
                          <Button type="button" onClick={addCustomCategory} size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {formData.brand_categories.length > 0 && (
                          <div>
                            <Text size="sm" weight="medium" color="secondary" className="mb-2">
                              Selected Categories ({formData.brand_categories.length})
                            </Text>
                            <div className="flex flex-wrap gap-2">
                              {formData.brand_categories.map((category) => (
                                <Badge 
                                  key={category}
                                  variant="primary" 
                                  className="flex items-center gap-1 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white"
                                >
                                  {category}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      removeBrandCategory(category)
                                    }}
                                    className="hover:bg-white/20 rounded-full p-0.5 ml-1 transition-colors"
                                    title={`Remove ${category}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            <Text size="xs" color="secondary" className="mt-1">
                              Click the × button to remove categories
                            </Text>
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

        {/* Prominent Success/Error Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#1A1A2E] rounded-xl shadow-2xl w-full max-w-md mx-4 border border-white/10 overflow-hidden">
              {/* Modal Header */}
              <div className={`p-6 ${modalType === 'success' ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-b border-green-500/20' : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-b border-red-500/20'}`}>
                <div className="flex items-center gap-3 mb-2">
                  {modalType === 'success' ? (
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <X className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <Heading level={3} size="lg" className={modalType === 'success' ? 'text-green-400' : 'text-red-400'}>
                    {modalType === 'success' ? 'Profile Updated!' : 'Update Failed'}
                  </Heading>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <Text className="text-gray-300 mb-6 leading-relaxed">
                  {modalMessage}
                </Text>

                {/* Action Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      setShowModal(false)
                      setModalMessage('')
                      setModalType('')
                    }}
                    className={`px-6 py-2 ${modalType === 'success' 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' 
                      : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
                    } text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105`}
                  >
                    {modalType === 'success' ? 'Great!' : 'Try Again'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  )
}