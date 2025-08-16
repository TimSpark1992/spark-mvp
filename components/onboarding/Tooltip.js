'use client'

import { useState, useRef, useEffect } from 'react'
import { Text } from '@/components/ui/Typography'

export default function Tooltip({ 
  children, 
  content, 
  position = 'top',
  trigger = 'hover',
  disabled = false,
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [actualPosition, setActualPosition] = useState(position)
  const tooltipRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltip = tooltipRef.current
      const trigger = triggerRef.current
      const rect = trigger.getBoundingClientRect()
      const tooltipRect = tooltip.getBoundingClientRect()
      
      // Check if tooltip goes off screen and adjust position
      let newPosition = position
      
      if (position === 'top' && rect.top - tooltipRect.height < 0) {
        newPosition = 'bottom'
      } else if (position === 'bottom' && rect.bottom + tooltipRect.height > window.innerHeight) {
        newPosition = 'top'
      } else if (position === 'left' && rect.left - tooltipRect.width < 0) {
        newPosition = 'right'
      } else if (position === 'right' && rect.right + tooltipRect.width > window.innerWidth) {
        newPosition = 'left'
      }
      
      setActualPosition(newPosition)
    }
  }, [isVisible, position])

  if (disabled) return children

  const showTooltip = () => setIsVisible(true)
  const hideTooltip = () => setIsVisible(false)

  const getPositionClasses = () => {
    const base = 'absolute z-50 px-3 py-2 text-sm bg-[#1C1C2D] border border-white/10 rounded-lg shadow-lg backdrop-blur-sm'
    
    switch (actualPosition) {
      case 'top':
        return `${base} bottom-full left-1/2 transform -translate-x-1/2 mb-2`
      case 'bottom':
        return `${base} top-full left-1/2 transform -translate-x-1/2 mt-2`
      case 'left':
        return `${base} right-full top-1/2 transform -translate-y-1/2 mr-2`
      case 'right':
        return `${base} left-full top-1/2 transform -translate-y-1/2 ml-2`
      default:
        return `${base} bottom-full left-1/2 transform -translate-x-1/2 mb-2`
    }
  }

  const getArrowClasses = () => {
    const arrow = 'absolute w-2 h-2 bg-[#1C1C2D] border border-white/10 transform rotate-45'
    
    switch (actualPosition) {
      case 'top':
        return `${arrow} top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-t-transparent border-l-transparent`
      case 'bottom':
        return `${arrow} bottom-full left-1/2 transform -translate-x-1/2 translate-y-1/2 border-b-transparent border-r-transparent`
      case 'left':
        return `${arrow} left-full top-1/2 transform -translate-y-1/2 translate-x-1/2 border-l-transparent border-b-transparent`
      case 'right':
        return `${arrow} right-full top-1/2 transform -translate-y-1/2 -translate-x-1/2 border-r-transparent border-t-transparent`
      default:
        return `${arrow} top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-t-transparent border-l-transparent`
    }
  }

  const triggerProps = trigger === 'hover' 
    ? { onMouseEnter: showTooltip, onMouseLeave: hideTooltip }
    : { onClick: isVisible ? hideTooltip : showTooltip }

  return (
    <div className={`relative inline-block ${className}`}>
      <div ref={triggerRef} {...triggerProps}>
        {children}
      </div>
      
      {isVisible && (
        <div 
          ref={tooltipRef}
          className={getPositionClasses()}
        >
          <div className={getArrowClasses()} />
          <Text size="sm" className="text-white whitespace-nowrap max-w-xs">
            {content}
          </Text>
        </div>
      )}
    </div>
  )
}