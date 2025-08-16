'use client'

export function Avatar({ 
  name, 
  src, 
  size = 'md', 
  className = '',
  variant = 'gradient',
  ...props 
}) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl'
  }
  
  const variants = {
    gradient: 'bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]',
    dark: 'bg-[#2A2A3A]',
    light: 'bg-white/10'
  }
  
  const initials = name ? name.split(' ').map(word => word[0]).join('').toUpperCase() : '?'
  
  return (
    <div 
      className={`
        ${sizes[size]} 
        ${variants[variant]} 
        rounded-full flex items-center justify-center text-white font-bold
        ${className}
      `}
      {...props}
    >
      {src ? (
        <img 
          src={src} 
          alt={name} 
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}