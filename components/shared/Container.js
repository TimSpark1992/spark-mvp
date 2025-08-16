'use client'

import { sparkTheme } from '@/lib/theme'

export function Container({ 
  children, 
  size = 'wide',
  padding = 'sm',
  className = '',
  ...props 
}) {
  const sizes = {
    wide: 'max-w-7xl mx-auto',
    narrow: 'max-w-4xl mx-auto',
    text: 'max-w-3xl mx-auto'
  }
  
  const paddings = {
    none: '',
    sm: 'px-4 sm:px-6 lg:px-8',
    md: 'px-6 sm:px-8 lg:px-12',
    lg: 'px-8 sm:px-12 lg:px-16'
  }
  
  return (
    <div 
      className={`${sizes[size]} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function Section({ 
  children, 
  padding = 'md',
  background = 'primary',
  className = '',
  ...props 
}) {
  const paddings = {
    sm: 'py-12',
    md: 'py-16', 
    lg: 'py-20',
    xl: 'py-24'
  }
  
  const backgrounds = {
    primary: 'bg-[#0F0F1A]',
    secondary: 'bg-[#0A0A0F]',
    transparent: 'bg-transparent'
  }
  
  return (
    <section 
      className={`${paddings[padding]} ${backgrounds[background]} ${className}`}
      {...props}
    >
      {children}
    </section>
  )
}