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
import { verifyStorageBuckets, getStorageSetupInstructions } from '@/lib/verify-storage-setup'
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
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

export default function CreatorProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState({})
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [storageStatus, setStorageStatus] = useState(null)
  const [showStorageSetup, setShowStorageSetup] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

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
      
      // Verify storage configuration when profile loads
      checkStorageConfiguration()
    }
  }, [profile])

  const checkStorageConfiguration = async () => {
    try {
      console.log('🔍 Checking storage configuration...')
      const status = await verifyStorageBuckets()
      setStorageStatus(status)
      
      if (!status.profiles || !status.mediaKits) {
        console.warn('⚠️ Storage buckets not properly configured:', status)
      } else {
        console.log('✅ Storage configuration verified')
      }
    } catch (error) {
      console.error('❌ Storage verification failed:', error)
      setStorageStatus({ 
        profiles: false, 
        mediaKits: false, 
        errors: [error.message] 
      })
    }
  }

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
      console.log('🔍 Checking media kit upload function availability...')
      console.log('uploadFile type:', typeof uploadFile)
      console.log('getFileUrl type:', typeof getFileUrl)
      console.log('updateProfile type:', typeof updateProfile)

      // Enhanced function availability checks with detailed logging
      if (!uploadFile || typeof uploadFile !== 'function') {
        console.error('❌ uploadFile function is not available:', uploadFile)
        throw new Error('Upload functionality is not properly initialized. Please refresh the page and try again.')
      }
      
      if (!getFileUrl || typeof getFileUrl !== 'function') {
        console.error('❌ getFileUrl function is not available:', getFileUrl)  
        throw new Error('URL generation functionality is not properly initialized. Please refresh the page and try again.')
      }
      
      if (!updateProfile || typeof updateProfile !== 'function') {
        console.error('❌ updateProfile function is not available:', updateProfile)
        throw new Error('Profile update functionality is not properly initialized. Please refresh the page and try again.')
      }

      if (!profile || !profile.id) {
        console.error('❌ Profile data is not available:', profile)
        throw new Error('Profile information is not available. Please refresh the page and try again.')
      }

      // Sanitize filename more thoroughly
      const sanitizedFileName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase()
      
      const fileName = `${profile.id}/media-kit-${Date.now()}-${sanitizedFileName}`
      console.log('📤 Uploading media kit with filename:', fileName)
      
      // Add timeout wrapper for upload operation
      const uploadTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timed out after 45 seconds')), 45000)
      )
      
      const uploadPromise = uploadFile('media-kits', fileName, file)
      const uploadResult = await Promise.race([uploadPromise, uploadTimeout])
      
      console.log('📡 Media kit upload result received:', uploadResult)
      
      if (!uploadResult) {
        throw new Error('Upload function returned null result')
      }
      
      const { data: uploadData, error: uploadError } = uploadResult
      
      if (uploadError) {
        console.error('❌ Media kit upload error details:', uploadError)
        
        // Check for specific error types
        if (uploadError.message?.includes('bucket') || uploadError.code === 'BUCKET_NOT_FOUND') {
          throw new Error('Storage is not configured. Please contact support to enable file uploads.')
        } else if (uploadError.message?.includes('permission') || uploadError.message?.includes('policy')) {
          throw new Error('You do not have permission to upload files. Please contact support.')
        } else if (uploadError.message?.includes('timeout')) {
          throw new Error('Upload timed out. Please check your internet connection and try again.')
        } else {
          throw new Error(uploadError.message || 'Failed to upload file to storage')
        }
      }

      console.log('✅ Media kit uploaded successfully, getting URL...')
      console.log('📊 Upload data:', uploadData)
      
      // Enhanced URL generation with error checking
      let mediaKitUrl
      try {
        mediaKitUrl = getFileUrl('media-kits', fileName)
        console.log('🔗 Generated media kit URL:', mediaKitUrl)
      } catch (urlError) {
        console.error('❌ Media kit URL generation error:', urlError)
        throw new Error('Failed to generate file URL. Please try again.')
      }
      
      if (!mediaKitUrl || typeof mediaKitUrl !== 'string') {
        console.error('❌ Invalid media kit URL generated:', mediaKitUrl)
        throw new Error('Generated file URL is invalid. Please try again.')
      }

      console.log('🔄 Updating profile with media kit URL...')
      
      // Simplified profile update without Promise.race complexity
      try {
        const updateResult = await updateProfile(profile.id, {
          media_kit_url: mediaKitUrl
        })
        
        console.log('📊 Media kit profile update result:', updateResult)
        
        if (!updateResult) {
          throw new Error('Profile update function returned null result')
        }
        
        const { error: updateError } = updateResult
        
        if (updateError) {
          console.error('❌ Media kit profile update error:', updateError)
          throw new Error(updateError.message || 'Failed to update profile')
        }
        
        console.log('✅ Profile updated successfully with new media kit URL')
        
      } catch (updateErr) {
        console.error('❌ Media kit profile update failed:', updateErr)
        throw new Error(`Profile update failed: ${updateErr.message}`)
      }

      console.log('🔄 Refreshing profile data...')
      
      // Add error handling for profile refresh
      try {
        if (refreshProfile && typeof refreshProfile === 'function') {
          await refreshProfile()
        } else {
          console.warn('⚠️ refreshProfile function not available, skipping refresh')
        }
      } catch (refreshError) {
        console.warn('⚠️ Profile refresh failed (non-critical):', refreshError)
        // Don't throw error here as the upload was successful
      }
      
      setSuccess('Media kit uploaded successfully!')
      console.log('✅ Media kit upload completed successfully')
      
    } catch (error) {
      console.error('❌ Critical error during media kit upload:', error)
      console.error('❌ Error stack:', error.stack)
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to upload media kit'
      
      if (error.message.includes('not properly initialized')) {
        errorMessage = error.message + ' This might be due to a page loading issue.'
      } else if (error.message.includes('Storage is not configured')) {
        errorMessage = 'File upload is temporarily unavailable. Please contact support.'
      } else if (error.message.includes('permission')) {
        errorMessage = 'You do not have permission to upload files. Please contact support.'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Upload timed out. Please check your internet connection and try a smaller file.'
      } else if (error.message.includes('size')) {
        errorMessage = error.message
      } else {
        errorMessage = error.message || errorMessage
      }
      
      setError(errorMessage)
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
      console.log('🔍 Checking upload function availability...')
      console.log('uploadFile type:', typeof uploadFile)
      console.log('getFileUrl type:', typeof getFileUrl)
      console.log('updateProfile type:', typeof updateProfile)
      console.log('profile data:', profile)

      // Enhanced function availability checks with detailed logging
      if (!uploadFile || typeof uploadFile !== 'function') {
        console.error('❌ uploadFile function is not available:', uploadFile)
        throw new Error('Upload functionality is not properly initialized. Please refresh the page and try again.')
      }
      
      if (!getFileUrl || typeof getFileUrl !== 'function') {
        console.error('❌ getFileUrl function is not available:', getFileUrl)  
        throw new Error('URL generation functionality is not properly initialized. Please refresh the page and try again.')
      }
      
      if (!updateProfile || typeof updateProfile !== 'function') {
        console.error('❌ updateProfile function is not available:', updateProfile)
        throw new Error('Profile update functionality is not properly initialized. Please refresh the page and try again.')
      }

      if (!profile || !profile.id) {
        console.error('❌ Profile data is not available:', profile)
        throw new Error('Profile information is not available. Please refresh the page and try again.')
      }

      // Sanitize filename more thoroughly
      const sanitizedFileName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase()
      
      const fileName = `${profile.id}/profile-${Date.now()}-${sanitizedFileName}`
      console.log('📤 Uploading profile picture with filename:', fileName)
      
      // Add timeout wrapper for upload operation
      const uploadTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timed out after 30 seconds')), 30000)
      )
      
      const uploadPromise = uploadFile('profiles', fileName, file)
      const uploadResult = await Promise.race([uploadPromise, uploadTimeout])
      
      console.log('📡 Upload result received:', uploadResult)
      
      if (!uploadResult) {
        throw new Error('Upload function returned null result')
      }
      
      const { data: uploadData, error: uploadError } = uploadResult
      
      if (uploadError) {
        console.error('❌ Upload error details:', uploadError)
        
        // Check for specific error types
        if (uploadError.message?.includes('bucket') || uploadError.code === 'BUCKET_NOT_FOUND') {
          throw new Error('Storage is not configured. Please contact support to enable file uploads.')
        } else if (uploadError.message?.includes('permission') || uploadError.message?.includes('policy')) {
          throw new Error('You do not have permission to upload files. Please contact support.')
        } else if (uploadError.message?.includes('timeout')) {
          throw new Error('Upload timed out. Please check your internet connection and try again.')
        } else {
          throw new Error(uploadError.message || 'Failed to upload image to storage')
        }
      }

      console.log('✅ Profile picture uploaded successfully, getting URL...')
      console.log('📊 Upload data:', uploadData)
      
      // Enhanced URL generation with error checking
      let profilePictureUrl
      try {
        profilePictureUrl = getFileUrl('profiles', fileName)
        console.log('🔗 Generated URL:', profilePictureUrl)
      } catch (urlError) {
        console.error('❌ URL generation error:', urlError)
        throw new Error('Failed to generate image URL. Please try again.')
      }
      
      if (!profilePictureUrl || typeof profilePictureUrl !== 'string') {
        console.error('❌ Invalid URL generated:', profilePictureUrl)
        throw new Error('Generated image URL is invalid. Please try again.')
      }

      console.log('🔄 Updating profile with picture URL...')
      
      // Simplified profile update without Promise.race complexity
      try {
        const updateResult = await updateProfile(profile.id, {
          profile_picture: profilePictureUrl
        })
        
        console.log('📊 Profile update result:', updateResult)
        
        if (!updateResult) {
          throw new Error('Profile update function returned null result')
        }
        
        const { error: updateError } = updateResult
        
        if (updateError) {
          console.error('❌ Profile update error:', updateError)
          throw new Error(updateError.message || 'Failed to update profile')
        }
        
        console.log('✅ Profile updated successfully with new picture URL')
        
      } catch (updateErr) {
        console.error('❌ Profile update failed:', updateErr)
        throw new Error(`Profile update failed: ${updateErr.message}`)
      }

      console.log('🔄 Refreshing profile data...')
      
      // Add error handling for profile refresh
      try {
        if (refreshProfile && typeof refreshProfile === 'function') {
          await refreshProfile()
        } else {
          console.warn('⚠️ refreshProfile function not available, skipping refresh')
        }
      } catch (refreshError) {
        console.warn('⚠️ Profile refresh failed (non-critical):', refreshError)
        // Don't throw error here as the upload was successful
      }
      
      setSuccess('Profile picture updated successfully!')
      console.log('✅ Profile picture upload completed successfully')
      
    } catch (error) {
      console.error('❌ Critical error during profile picture upload:', error)
      console.error('❌ Error stack:', error.stack)
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to upload profile picture'
      
      if (error.message.includes('not properly initialized')) {
        errorMessage = error.message + ' This might be due to a page loading issue.'
      } else if (error.message.includes('Storage is not configured')) {
        errorMessage = 'File upload is temporarily unavailable. Please contact support.'
      } else if (error.message.includes('permission')) {
        errorMessage = 'You do not have permission to upload files. Please contact support.'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Upload timed out. Please check your internet connection and try a smaller image.'
      } else if (error.message.includes('size')) {
        errorMessage = error.message
      } else {
        errorMessage = error.message || errorMessage
      }
      
      setError(errorMessage)
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
      
      console.log('📊 Sanitized data for profile update:', sanitizedData)
      
      // Add timeout protection for profile update (systematic fix pattern)
      const updateTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile update timed out after 15 seconds')), 15000)
      )
      
      const updatePromise = updateProfile(profile.id, sanitizedData)
      const updateResult = await Promise.race([updatePromise, updateTimeout])
      
      console.log('📊 Profile update result:', updateResult)
      
      if (!updateResult) {
        throw new Error('Profile update returned no result')
      }
      
      const { error: updateError } = updateResult
      
      if (updateError) {
        console.error('❌ Profile update error:', updateError)
        throw new Error(updateError.message || 'Failed to update profile')
      }

      console.log('✅ Creator profile update successful, refreshing profile...')
      
      // Add timeout protection for profile refresh (systematic fix pattern)
      try {
        if (refreshProfile && typeof refreshProfile === 'function') {
          const refreshTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile refresh timed out after 10 seconds')), 10000)
          )
          
          const refreshPromise = refreshProfile()
          await Promise.race([refreshPromise, refreshTimeout])
          console.log('✅ Profile refresh completed successfully')
        } else {
          console.warn('⚠️ refreshProfile function not available, skipping refresh')
        }
      } catch (refreshError) {
        console.warn('⚠️ Profile refresh failed (non-critical):', refreshError)
        // Don't throw error here as the main update was successful
      }
      
      setSuccess('Profile updated successfully!')
      console.log('🎉 Creator profile save completed successfully')
      
      // Force loading state to false after 1 second as additional protection
      setTimeout(() => {
        setLoading(false)
      }, 1000)
      
    } catch (error) {
      console.error('❌ Creator profile save failed:', error)
      
      // Provide specific error messages based on error type (systematic fix pattern)
      let errorMessage = 'Failed to update profile'
      
      if (error.message.includes('timed out')) {
        errorMessage = 'Profile save timed out. Please check your internet connection and try again.'
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error occurred. Please check your connection and try again.'
      } else if (error.message.includes('validation')) {
        errorMessage = 'Please check your input and try again.'
      } else {
        errorMessage = error.message || errorMessage
      }
      
      setError(errorMessage)
    } finally {
      // Always ensure loading is set to false (systematic fix pattern)
      setLoading(false)
      console.log('🔄 Profile save process completed, loading state cleared')
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
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <Text size="sm" color="primary" className="text-red-400">{error}</Text>
                </div>
              </div>
            )}

            {/* Storage Configuration Warning */}
            {storageStatus && (!storageStatus.profiles || !storageStatus.mediaKits) && (
              <div className="bg-yellow-500/20 border border-yellow-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <Text size="sm" weight="semibold" className="text-yellow-400 mb-2">
                      File Upload Setup Required
                    </Text>
                    <Text size="sm" className="text-yellow-200 mb-3">
                      Storage buckets need to be configured to enable profile picture and media kit uploads.
                    </Text>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={() => setShowStorageSetup(!showStorageSetup)}
                        className="bg-yellow-600/20 border-yellow-500/30 text-yellow-300 hover:bg-yellow-600/30"
                      >
                        {showStorageSetup ? 'Hide' : 'Show'} Setup Instructions
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={checkStorageConfiguration}
                        className="bg-yellow-600/20 border-yellow-500/30 text-yellow-300 hover:bg-yellow-600/30"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Recheck
                      </Button>
                    </div>
                    {showStorageSetup && (
                      <div className="mt-4 p-3 bg-black/20 rounded border border-yellow-500/10">
                        <pre className="text-xs text-yellow-100 whitespace-pre-wrap overflow-x-auto">
                          {getStorageSetupInstructions()}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
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
                      
                      <div className="relative">
                        <input
                          type="file"
                          id="media-kit-upload"
                          accept=".pdf,image/jpeg,image/png,image/webp"
                          onChange={handleMediaKitUpload}
                          className="hidden"
                          disabled={uploadLoading.mediaKit}
                        />
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="w-full"
                          disabled={uploadLoading.mediaKit}
                          onClick={() => {
                            const input = document.getElementById('media-kit-upload')
                            if (input) input.click()
                          }}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadLoading.mediaKit ? 'Uploading...' : 'Upload Media Kit'}
                        </Button>
                      </div>
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