'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Text } from '@/components/ui/Typography'
import { 
  Shield,
  Eye,
  EyeOff,
  MessageSquare,
  ExternalLink,
  AlertCircle,
  Lock,
  User
} from 'lucide-react'
import { maskProfileContacts, generateMaskedContact } from '@/lib/marketplace/anti-disintermediation'

export default function ContactMask({ 
  user, 
  currentUserId, 
  allowDirectContact = false,
  showMaskedVersion = true,
  onContactRequest,
  className = '' 
}) {
  const [showRealInfo, setShowRealInfo] = useState(false)
  const [requestingContact, setRequestingContact] = useState(false)

  if (!user) return null

  const isOwnProfile = user.id === currentUserId
  const maskedProfile = showMaskedVersion ? maskProfileContacts(user, currentUserId) : user
  const maskedContact = generateMaskedContact(user)

  const handleContactRequest = async () => {
    if (!onContactRequest) return
    
    try {
      setRequestingContact(true)
      await onContactRequest(user.id)
    } catch (error) {
      console.error('Error requesting contact:', error)
    } finally {
      setRequestingContact(false)
    }
  }

  const renderContactField = (label, value, realValue, icon) => {
    if (!realValue && !value) return null
    
    const displayValue = (showRealInfo && isOwnProfile) ? realValue : value
    const isMasked = displayValue !== realValue && !isOwnProfile
    
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          {icon}
          <Text size="sm" color="secondary">{label}</Text>
        </div>
        
        <div className="flex items-center gap-2">
          {isMasked && (
            <Shield className="w-3 h-3 text-yellow-400" />
          )}
          <Text size="sm" weight="medium" className={isMasked ? 'text-yellow-400' : ''}>
            {displayValue || 'Not provided'}
          </Text>
        </div>
      </div>
    )
  }

  return (
    <Card className={`p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <User className="w-8 h-8 text-blue-400" />
            {!isOwnProfile && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                <Shield className="w-2 h-2 text-white" />
              </div>
            )}
          </div>
          <div>
            <Text weight="semibold">{maskedProfile.full_name || 'Platform User'}</Text>
            <Text size="sm" color="secondary">
              {maskedProfile.role === 'brand' ? 'Brand' : 'Creator'}
            </Text>
          </div>
        </div>
        
        {!isOwnProfile && (
          <Badge variant="outline" className="text-blue-400 border-blue-400/30">
            <Lock className="w-3 h-3 mr-1" />
            Protected
          </Badge>
        )}
      </div>

      {/* Contact Information */}
      <div className="space-y-1 mb-4">
        {renderContactField(
          'Email', 
          maskedProfile.email, 
          user.email,
          <MessageSquare className="w-4 h-4 text-gray-400" />
        )}
        
        {renderContactField(
          'Platform Handle', 
          maskedContact.platformHandle, 
          maskedContact.platformHandle,
          <User className="w-4 h-4 text-gray-400" />
        )}
        
        {user.instagram_url && renderContactField(
          'Instagram', 
          maskedProfile.instagram_url, 
          user.instagram_url,
          <ExternalLink className="w-4 h-4 text-gray-400" />
        )}
        
        {user.tiktok_url && renderContactField(
          'TikTok', 
          maskedProfile.tiktok_url, 
          user.tiktok_url,
          <ExternalLink className="w-4 h-4 text-gray-400" />
        )}
      </div>

      {/* Platform Communication Notice */}
      {!isOwnProfile && (
        <div className="p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg mb-4">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <Text size="sm" weight="medium" className="text-blue-400">
                Secure Platform Communication
              </Text>
              <Text size="xs" color="secondary" className="mt-1">
                All communication must go through our secure messaging system to protect both parties and ensure transaction safety.
              </Text>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {!isOwnProfile && (
          <>
            <Button 
              onClick={() => window.location.href = `/messages?user=${user.id}`}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Message on Platform
            </Button>
            
            {allowDirectContact && (
              <Button
                onClick={handleContactRequest}
                disabled={requestingContact}
                variant="outline"
                className="text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10"
              >
                {requestingContact ? 'Requesting...' : 'Request Contact'}
              </Button>
            )}
          </>
        )}
        
        {isOwnProfile && (
          <div className="flex gap-2 w-full">
            <Button
              onClick={() => setShowRealInfo(!showRealInfo)}
              variant="outline"
              className="flex-1"
            >
              {showRealInfo ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showRealInfo ? 'Hide' : 'Show'} Real Info
            </Button>
            
            <Button
              onClick={() => window.location.href = '/profile/edit'}
              variant="outline"
              className="flex-1"
            >
              Edit Profile
            </Button>
          </div>
        )}
      </div>

      {/* Security Notice */}
      {!isOwnProfile && (
        <div className="mt-4 pt-3 border-t border-white/10 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <Text size="xs" color="secondary">
            Contact information is protected to prevent platform bypass. 
            Direct contact sharing may result in account warnings or suspension.
          </Text>
        </div>
      )}
      
      {isOwnProfile && showRealInfo && (
        <div className="mt-4 pt-3 border-t border-white/10 flex items-start gap-2">
          <Shield className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
          <Text size="xs" color="secondary">
            This is how your information appears to you. Other users see a masked version to protect your privacy and maintain platform integrity.
          </Text>
        </div>
      )}
    </Card>
  )
}