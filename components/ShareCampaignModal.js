'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Heading, Text } from '@/components/ui/Typography'
import { 
  X, 
  Copy, 
  Check, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Mail,
  MessageCircle,
  Share,
  ExternalLink
} from 'lucide-react'

export default function ShareCampaignModal({ 
  isOpen, 
  onClose, 
  campaign, 
  shareUrl 
}) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: copied ? Check : Copy,
      color: copied ? 'text-green-400' : 'text-blue-400',
      onClick: handleCopyLink,
      description: copied ? 'Link copied!' : 'Copy campaign link'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'text-blue-400',
      onClick: () => {
        const text = `Check out this amazing campaign: "${campaign?.title}"`
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank')
      },
      description: 'Share on Twitter'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-600',
      onClick: () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank')
      },
      description: 'Share on LinkedIn'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-500',
      onClick: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')
      },
      description: 'Share on Facebook'
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'text-gray-400',
      onClick: () => {
        const subject = `Campaign Opportunity: ${campaign?.title}`
        const body = `Hi there!

I wanted to share this exciting campaign opportunity with you:

${campaign?.title}
${campaign?.description ? campaign.description.substring(0, 200) + '...' : ''}

Budget: ${campaign?.budget_range || 'Not specified'}
Category: ${campaign?.category || 'Not specified'}

Check it out here: ${shareUrl}

Best regards!`
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
      },
      description: 'Share via Email'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-500',
      onClick: () => {
        const text = `Check out this campaign: "${campaign?.title}" ${shareUrl}`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
      },
      description: 'Share on WhatsApp'
    }
  ]

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Share className="w-5 h-5 text-[#8A2BE2]" />
            <Heading level={3} size="lg">Share Campaign</Heading>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-[#2A2A3A] text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Campaign Preview */}
        <div className="bg-[#2A2A3A]/50 rounded-lg p-4 mb-6">
          <Heading level={4} size="md" className="mb-2 line-clamp-1">
            {campaign?.title || 'Campaign'}
          </Heading>
          <Text size="sm" color="secondary" className="line-clamp-2">
            {campaign?.description || 'No description available'}
          </Text>
          <div className="flex items-center gap-4 mt-3">
            {campaign?.budget_range && (
              <Text size="xs" className="text-green-400">
                {campaign.budget_range}
              </Text>
            )}
            {campaign?.category && (
              <Text size="xs" className="text-blue-400">
                {campaign.category}
              </Text>
            )}
          </div>
        </div>

        {/* Share Options */}
        <div className="space-y-3">
          <Text size="sm" color="secondary" className="mb-3">
            Share this campaign with potential creators
          </Text>
          
          {shareOptions.map((option) => {
            const IconComponent = option.icon
            return (
              <button
                key={option.name}
                onClick={option.onClick}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#2A2A3A]/50 hover:bg-[#2A2A3A] transition-colors group"
              >
                <div className={`w-10 h-10 rounded-lg bg-[#1A1A2E] flex items-center justify-center ${option.color}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <Text size="sm" weight="medium" className="group-hover:text-white">
                    {option.name}
                  </Text>
                  <Text size="xs" color="secondary">
                    {option.description}
                  </Text>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )
          })}
        </div>

        {/* Link Display */}
        <div className="mt-6 p-3 bg-[#1A1A2E] rounded-lg">
          <Text size="xs" color="secondary" className="mb-1">
            Campaign Link:
          </Text>
          <Text size="xs" className="break-all text-gray-300">
            {shareUrl}
          </Text>
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-3 mt-6 pt-4 border-t border-white/10">
          <Text size="xs" color="secondary">
            Click anywhere outside to close
          </Text>
          <Button variant="ghost" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </Card>
    </div>
  )
}