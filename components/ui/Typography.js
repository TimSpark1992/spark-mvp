'use client'

import { getTextClass } from '@/lib/theme'

export function Heading({ 
  level = 1, 
  children, 
  size, 
  weight = 'bold', 
  color = 'primary', 
  className = '',
  gradient = false,
  ...props 
}) {
  // Auto-determine size based on heading level if not provided
  const defaultSizes = {
    1: '6xl',
    2: '4xl',
    3: '3xl',
    4: '2xl',
    5: 'xl',
    6: 'lg'
  }
  
  const finalSize = size || defaultSizes[level] || 'xl'
  const textClass = getTextClass(finalSize, weight, gradient ? 'gradient' : color)
  const Tag = `h${level}`
  
  return (
    <Tag className={`${textClass} leading-tight ${className}`} {...props}>
      {children}
    </Tag>
  )
}

export function Text({ 
  children, 
  size = 'base', 
  weight = 'normal', 
  color = 'secondary', 
  className = '',
  as = 'p',
  ...props 
}) {
  const textClass = getTextClass(size, weight, color)
  const Tag = as
  
  return (
    <Tag className={`${textClass} leading-relaxed ${className}`} {...props}>
      {children}
    </Tag>
  )
}

export function GradientText({ children, className = '', ...props }) {
  return (
    <span className={`text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] ${className}`} {...props}>
      {children}
    </span>
  )
}