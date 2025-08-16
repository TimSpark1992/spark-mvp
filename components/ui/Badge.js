'use client'

export function Badge({ 
  children, 
  variant = 'primary',
  size = 'md',
  className = '',
  ...props 
}) {
  const baseClass = 'inline-flex items-center font-semibold'
  
  const variants = {
    primary: 'bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white',
    secondary: 'bg-[#2A2A3A] text-gray-300 border border-white/10',
    success: 'bg-green-500/20 text-green-400 border border-green-500/20',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/20'
  }
  
  const sizes = {
    sm: 'px-2 py-1 text-xs rounded-md',
    md: 'px-3 py-1 text-sm rounded-lg',
    lg: 'px-4 py-2 text-base rounded-xl'
  }
  
  return (
    <span 
      className={`${baseClass} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}