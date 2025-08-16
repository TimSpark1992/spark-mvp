'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Text } from '@/components/ui/Typography'
import { 
  Shield,
  AlertTriangle,
  Eye,
  EyeOff,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react'

export default function MessageSanitizer({ 
  message, 
  showOriginal = false, 
  onToggleOriginal,
  className = '' 
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!message) return null

  const hasViolations = message.is_redacted || message.safety_info?.was_sanitized
  const riskScore = message.safety_info?.risk_score || 0
  const violations = message.safety_info?.violation_categories || []

  const getRiskColor = (score) => {
    if (score >= 4) return 'text-red-400 border-red-400/30'
    if (score >= 3) return 'text-orange-400 border-orange-400/30'
    if (score >= 2) return 'text-yellow-400 border-yellow-400/30'
    return 'text-blue-400 border-blue-400/30'
  }

  const getRiskIcon = (score) => {
    if (score >= 4) return <XCircle className="w-3 h-3" />
    if (score >= 3) return <AlertTriangle className="w-3 h-3" />
    if (score >= 2) return <Info className="w-3 h-3" />
    return <CheckCircle className="w-3 h-3" />
  }

  if (!hasViolations) {
    return (
      <div className={`${className}`}>
        <Text>{message.content}</Text>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {/* Message Content */}
      <div className="space-y-2">
        <Text>{message.content}</Text>
        
        {/* Safety Warning */}
        <div className="flex items-start gap-2 p-2 bg-yellow-900/20 border border-yellow-500/20 rounded-md">
          <Shield className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <Text size="sm" className="text-yellow-400">
              {message.is_redacted 
                ? 'This message contained contact information and has been redacted for platform safety.'
                : 'This message was sanitized to remove prohibited content.'
              }
            </Text>
            
            {message.redaction_reason && (
              <Text size="xs" color="secondary" className="mt-1">
                Reason: {message.redaction_reason}
              </Text>
            )}
          </div>
        </div>

        {/* Violation Details */}
        {violations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Text size="sm" color="secondary">Detected violations:</Text>
              <div className="flex gap-1">
                {violations.map((violation, index) => (
                  <Badge 
                    key={index}
                    variant="outline" 
                    className={getRiskColor(riskScore)}
                    size="sm"
                  >
                    {violation}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {getRiskIcon(riskScore)}
              <Text size="sm" color="secondary">
                Risk Score: {riskScore}/4
              </Text>
            </div>
          </div>
        )}

        {/* Original Content Toggle (Admin/Debug only) */}
        {showOriginal && message.original_content && message.is_redacted && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <button
              onClick={() => {
                setIsExpanded(!isExpanded)
                if (onToggleOriginal) onToggleOriginal(!isExpanded)
              }}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300"
            >
              {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isExpanded ? 'Hide' : 'Show'} original content
            </button>
            
            {isExpanded && (
              <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-md">
                <Text size="sm" className="text-red-400 mb-2">
                  ⚠️ Original content (contains violations):
                </Text>
                <Text size="sm" className="font-mono bg-black/30 p-2 rounded">
                  {message.original_content}
                </Text>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}