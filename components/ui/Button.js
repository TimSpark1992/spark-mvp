'use client'

import { getButtonClass } from '@/lib/theme'
import { forwardRef } from 'react'

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  type = 'button',
  onClick,
  ...props 
}, ref) => {
  const buttonClass = getButtonClass(variant, size)
  
  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${buttonClass} ${className} ${disabled ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}
      {...props}
    >
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export default Button