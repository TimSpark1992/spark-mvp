'use client'

import { useAuth } from '@/components/AuthProvider'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Typography'
import { CheckCircle, Circle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const PROGRESS_ITEMS = {
  creator: [
    {
      id: 'profile',
      label: 'Complete Profile',
      link: '/creator/profile',
      check: (profile) => !!(profile?.bio && profile?.social_links && Object.values(profile.social_links).some(link => link))
    },
    {
      id: 'media_kit',
      label: 'Upload Media Kit',
      link: '/creator/profile',
      check: (profile) => !!profile?.media_kit_url
    },
    {
      id: 'categories',
      label: 'Add Categories',
      link: '/creator/profile',
      check: (profile) => !!(profile?.category_tags && profile.category_tags.length > 0)
    },
    {
      id: 'applications',
      label: 'Apply to Campaigns',
      link: '/creator/campaigns',
      check: () => false // This would need to check applications count
    }
  ],
  brand: [
    {
      id: 'profile',
      label: 'Complete Profile',
      link: '/brand/profile',
      check: (profile, stats) => !!(profile?.company_name && profile?.company_description)
    },
    {
      id: 'campaign',
      label: 'Create Campaign',
      link: '/brand/campaigns/create',
      check: (profile, stats) => stats?.totalCampaigns > 0
    },
    {
      id: 'applications',
      label: 'Review Applications',
      link: '/brand/applications',
      check: (profile, stats) => stats?.totalApplications > 0
    },
    {
      id: 'hire',
      label: 'Hire Creators',
      link: '/brand/applications',
      check: (profile, stats) => stats?.acceptedApplications > 0
    }
  ]
}

export default function OnboardingProgress({ className = '', stats = null }) {
  const { profile } = useAuth()
  
  if (!profile || profile.onboarding_completed) return null
  
  const items = PROGRESS_ITEMS[profile.role] || []
  const completedCount = items.filter(item => item.check(profile, stats)).length
  const totalCount = items.length
  const progressPercentage = (completedCount / totalCount) * 100

  if (completedCount === totalCount) return null

  return (
    <Card className={`p-4 mb-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Text size="sm" weight="semibold">
              Complete your setup
            </Text>
            <Text size="xs" color="secondary">
              {completedCount}/{totalCount} done
            </Text>
          </div>
          
          <div className="w-full bg-[#2A2A3A] rounded-full h-1.5 mb-3">
            <div 
              className="h-1.5 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <div className="flex items-center gap-4">
            {items.slice(0, 3).map((item) => {
              const isCompleted = item.check(profile, stats)
              return (
                <Link key={item.id} href={item.link}>
                  <div className="flex items-center gap-1.5 text-xs hover:text-white transition-colors cursor-pointer">
                    {isCompleted ? (
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    ) : (
                      <Circle className="w-3 h-3 text-gray-500" />
                    )}
                    <span className={isCompleted ? 'text-green-400' : 'text-gray-400'}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              )
            })}
            
            {items.length > 3 && (
              <Text size="xs" color="secondary">
                +{items.length - 3} more
              </Text>
            )}
          </div>
        </div>
        
        <Link href="/creator/profile" className="flex-shrink-0 ml-4">
          <div className="flex items-center gap-1 text-[#8A2BE2] hover:text-[#FF1493] transition-colors text-sm cursor-pointer">
            <span>Continue</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>
      </div>
    </Card>
  )
}