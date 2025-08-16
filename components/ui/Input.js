'use client'

import { forwardRef } from 'react'
import { sparkTheme } from '@/lib/theme'

const Input = forwardRef(({ 
  type = 'text',
  variant = 'primary',
  size = 'md',
  className = '',
  error = false,
  ...props 
}, ref) => {
  const baseClass = 'transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-[#1C1C2D] border border-white/10 text-white placeholder-gray-400 focus:border-[#8A2BE2]',
    search: 'bg-[#0F0F1A] border border-white/10 text-white placeholder-gray-400 focus:border-[#8A2BE2] rounded-full'
  }
  
  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-3 text-base rounded-lg',
    lg: 'px-6 py-4 text-lg rounded-lg'
  }
  
  const errorClass = error ? 'border-red-500 focus:border-red-500' : ''
  
  return (
    <input
      ref={ref}
      type={type}
      className={`
        ${baseClass} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${errorClass}
        ${className}
      `}
      {...props}
    />
  )
})

Input.displayName = 'Input'

export default Input