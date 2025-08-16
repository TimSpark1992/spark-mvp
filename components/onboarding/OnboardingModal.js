'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Heading, Text } from '@/components/ui/Typography'
import { updateProfile } from '@/lib/supabase'
import { getBrandCampaigns, getCampaignApplications } from '@/lib/supabase'
import { 
  X, 
  CheckCircle, 
  Circle, 
  User, 
  Upload, 
  Search, 
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  Play,
  SkipForward
} from 'lucide-react'
import Link from 'next/link'

const ONBOARDING_STEPS = {
  creator: [
    {
      id: 'complete-profile',
      title: 'Complete Your Profile',
      description: 'Add your bio, social links, and content categories to attract brands.',
      icon: User,
      action: 'Complete Profile',
      link: '/creator/profile',
      completed: (profile, stats) => !!(profile?.bio && profile?.social_links && Object.values(profile.social_links || {}).some(link => link))
    },
    {
      id: 'upload-media-kit',
      title: 'Upload Media Kit',
      description: 'Upload your media kit or rate card to showcase your work and pricing.',
      icon: Upload,
      action: 'Upload Media Kit',
      link: '/creator/profile',
      completed: (profile, stats) => !!profile?.media_kit_url
    },
    {
      id: 'browse-campaigns',
      title: 'Browse Campaigns',
      description: 'Discover exciting brand partnerships and apply to campaigns that match your style.',
      icon: Search,
      action: 'Browse Campaigns',
      link: '/creator/campaigns',
      completed: (profile, stats) => !!(profile?.category_tags && profile.category_tags.length > 0)
    },
    {
      id: 'apply-campaign',
      title: 'Apply to Your First Campaign',
      description: 'Submit your first application and start building brand relationships.',
      icon: MessageCircle,
      action: 'View Campaigns',
      link: '/creator/campaigns',
      completed: (profile, stats) => stats?.creatorApplications > 0 // Based on actual applications
    }
  ],
  brand: [
    {
      id: 'complete-profile',
      title: 'Complete Your Brand Profile',
      description: 'Add your company information and brand details to attract the right creators.',
      icon: User,
      action: 'Complete Profile',
      link: '/brand/profile',
      completed: (profile, stats) => !!(profile?.company_name && profile?.company_description)
    },
    {
      id: 'create-campaign',
      title: 'Create Your First Campaign',
      description: 'Post a detailed campaign brief to start connecting with talented creators.',
      icon: Upload,
      action: 'Create Campaign',
      link: '/brand/campaigns/create',
      completed: (profile, stats) => stats?.totalCampaigns > 0 // Based on actual campaigns created
    },
    {
      id: 'review-applications',
      title: 'Review Creator Applications',
      description: 'Browse creator portfolios and select the perfect partners for your campaigns.',
      icon: Search,
      action: 'View Dashboard',
      link: '/brand/dashboard',
      completed: (profile, stats) => stats?.totalApplications > 0 // Based on actual applications received
    },
    {
      id: 'connect-creators',
      title: 'Connect with Creators',
      description: 'Use our messaging system to discuss collaboration details with accepted creators.',
      icon: MessageCircle,
      action: 'View Messages',
      link: '/messages',
      completed: (profile, stats) => stats?.acceptedApplications > 0 // Based on actual hired creators
    }
  ]
}

export default function OnboardingModal({ isOpen, onClose, stats: propStats = null }) {
  const { profile, refreshProfile } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState(propStats || {
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalApplications: 0,
    acceptedApplications: 0,
    creatorApplications: 0
  })

  const steps = ONBOARDING_STEPS[profile?.role] || []
  const totalSteps = steps.length

  // Fetch real user stats when modal opens
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!isOpen || !profile?.id) return
      
      try {
        if (profile.role === 'brand') {
          const { data: campaignsData, error: campaignsError } = await getBrandCampaigns(profile.id)
          
          if (!campaignsError && campaignsData) {
            let totalApplications = 0
            let acceptedApplications = 0
            
            // Count applications across all campaigns
            for (const campaign of campaignsData) {
              try {
                const { data: applications } = await getCampaignApplications(campaign.id)
                if (applications) {
                  totalApplications += applications.length
                  acceptedApplications += applications.filter(app => app.status === 'accepted').length
                }
              } catch (appError) {
                console.error('Error fetching applications for campaign:', campaign.id, appError)
              }
            }
            
            setStats({
              totalCampaigns: campaignsData.length,
              activeCampaigns: campaignsData.filter(c => c.status === 'active').length,
              totalApplications,
              acceptedApplications,
              creatorApplications: 0
            })
          }
        } else if (profile.role === 'creator') {
          // For creators, we'd need to fetch their application count
          // This would require a different API endpoint
          setStats({
            totalCampaigns: 0,
            activeCampaigns: 0,
            totalApplications: 0,
            acceptedApplications: 0,
            creatorApplications: 0 // This would come from a creator applications API
          })
        }
      } catch (error) {
        console.error('Error fetching user stats for onboarding:', error)
      }
    }

    fetchUserStats()
  }, [isOpen, profile?.id, profile?.role])

  // Auto-advance to the first incomplete step when stats are loaded
  useEffect(() => {
    if (profile && stats && steps.length > 0) {
      // Find the first incomplete step
      const firstIncompleteStepIndex = steps.findIndex(step => !step.completed(profile, stats))
      
      if (firstIncompleteStepIndex !== -1) {
        // Set current step to first incomplete step
        setCurrentStep(firstIncompleteStepIndex)
        console.log('🎯 Auto-advancing to first incomplete step:', firstIncompleteStepIndex, steps[firstIncompleteStepIndex]?.title)
      } else {
        // All steps completed, show the last step
        setCurrentStep(steps.length - 1)
        console.log('✅ All onboarding steps completed, showing final step')
      }
    }
  }, [profile, stats, steps])

  const getStepStatus = (step, index) => {
    if (step.completed(profile, stats)) return 'completed'
    if (index === currentStep) return 'current'
    if (index < currentStep) return 'completed'
    return 'pending'
  }

  const getCompletedStepsCount = () => {
    return steps.filter(step => step.completed(profile, stats)).length
  }

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      await updateProfile(profile.id, {
        onboarding_completed: true,
        first_login: false,
        onboarding_progress: {
          steps_completed: steps.map(step => step.id),
          current_step: totalSteps,
          total_steps: totalSteps,
          completed_at: new Date().toISOString()
        }
      })
      console.log('✅ Onboarding completed successfully')
      onClose()
    } catch (error) {
      console.error('Error completing onboarding:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    setLoading(true)
    try {
      await updateProfile(profile.id, {
        onboarding_skipped: true,
        first_login: false,
        onboarding_progress: {
          steps_completed: [],
          current_step: 0,
          total_steps: totalSteps,
          skipped_at: new Date().toISOString()
        }
      })
      console.log('✅ Onboarding skipped successfully')
      onClose()
    } catch (error) {
      console.error('Error skipping onboarding:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !profile) return null

  const currentStepData = steps[currentStep]
  const completedCount = getCompletedStepsCount()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <Heading level={2} size="2xl" className="mb-2">
                Welcome to Spark! 🎉
              </Heading>
              <Text size="sm" color="secondary">
                Let's get you set up for success
              </Text>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <Text size="sm" weight="medium">
                Progress: {completedCount}/{totalSteps} completed
              </Text>
              <Text size="sm" color="secondary">
                Step {currentStep + 1} of {totalSteps}
              </Text>
            </div>
            <div className="w-full bg-[#2A2A3A] rounded-full h-2">
              <div 
                className="h-2 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Steps Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => {
                const status = getStepStatus(step, index)
                return (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => setCurrentStep(index)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        status === 'completed'
                          ? 'bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white'
                          : status === 'current'
                          ? 'bg-[#8A2BE2] text-white ring-4 ring-[#8A2BE2]/20'
                          : 'bg-[#2A2A3A] text-gray-400 hover:bg-[#3A3A4A]'
                      }`}
                    >
                      {status === 'completed' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </button>
                    {index < totalSteps - 1 && (
                      <div className={`w-12 h-0.5 mx-2 ${
                        index < currentStep ? 'bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]' : 'bg-[#2A2A3A]'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Current Step Content */}
          {currentStepData && (
            <div className="text-center space-y-6 mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-2xl flex items-center justify-center mx-auto">
                <currentStepData.icon className="w-8 h-8 text-white" />
              </div>
              
              <div>
                <Heading level={3} size="xl" className="mb-3">
                  {currentStepData.title}
                </Heading>
                <Text className="max-w-md mx-auto">
                  {currentStepData.description}
                </Text>
              </div>

              {currentStepData.completed(profile, stats) ? (
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <Text size="sm" weight="medium">Already completed!</Text>
                </div>
              ) : (
                <Link href={currentStepData.link} onClick={onClose}>
                  <Button className="inline-flex items-center gap-2">
                    {currentStepData.action}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <Button variant="ghost" onClick={handlePrevious} disabled={loading}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={handleSkip} disabled={loading}>
                <SkipForward className="w-4 h-4 mr-2" />
                Skip for now
              </Button>
              
              {currentStep < totalSteps - 1 ? (
                <Button onClick={handleNext} disabled={loading}>
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={loading}>
                  {loading ? 'Finishing...' : 'Get Started!'}
                </Button>
              )}
            </div>
          </div>

          {/* Optional: Welcome Video Link */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <Text size="sm" color="secondary" className="mb-3">
              New to creator marketing? 
            </Text>
            <button className="inline-flex items-center gap-2 text-[#8A2BE2] hover:text-[#FF1493] transition-colors text-sm">
              <Play className="w-4 h-4" />
              Watch quick intro video (2 min)
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}