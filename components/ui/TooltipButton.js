'use client'

import { useState } from 'react'
import Button from './Button'
import Tooltip from '@/components/onboarding/Tooltip'
import { useAuth } from '@/components/AuthProvider'

export default function TooltipButton({ 
  children, 
  tooltipContent, 
  showTooltipCondition = null,
  className = '',
  ...buttonProps 
}) {
  const { profile } = useAuth()
  const [hasBeenHovered, setHasBeenHovered] = useState(false)

  // Show tooltip if:
  // 1. Explicit condition is provided and true, or
  // 2. User hasn't completed onboarding and hasn't been hovered yet
  const shouldShowTooltip = showTooltipCondition !== null 
    ? showTooltipCondition 
    : (!profile?.onboarding_completed && !hasBeenHovered)

  const handleMouseEnter = () => {
    setHasBeenHovered(true)
  }

  return (
    <Tooltip 
      content={tooltipContent}
      disabled={!shouldShowTooltip}
      trigger="hover"
      position="top"
    >
      <Button 
        {...buttonProps} 
        className={`${className} ${shouldShowTooltip ? 'ring-2 ring-[#8A2BE2]/30 ring-offset-2 ring-offset-[#0F0F1A] animate-pulse' : ''}`}
        onMouseEnter={handleMouseEnter}
      >
        {children}
      </Button>
    </Tooltip>
  )
}