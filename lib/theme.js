// Spark Design System Theme Configuration
export const sparkTheme = {
  // Color Palette
  colors: {
    // Brand Colors
    primary: {
      gradient: 'from-[#8A2BE2] to-[#FF1493]', // Purple to Pink gradient
      purple: '#8A2BE2',
      pink: '#FF1493',
      deep: '#9400D3'
    },
    
    // Background Colors
    background: {
      primary: '#0F0F1A',     // Main dark background
      secondary: '#0A0A0F',   // Darker sections
      card: '#1C1C2D',       // Card backgrounds
      cardDark: '#2A2A3A',   // Darker card variant
      overlay: '#0F0F1A/95'  // Backdrop blur overlay
    },
    
    // Text Colors
    text: {
      primary: '#ffffff',     // Primary white text
      secondary: '#d1d5db',   // Gray-300 equivalent
      muted: '#9ca3af',       // Gray-400 equivalent
      accent: '#6b7280'       // Gray-500 equivalent
    },
    
    // Border & UI Elements
    border: {
      primary: 'white/10',    // Standard border
      hover: 'white/20',      // Hover state border
      focus: '#8A2BE2'        // Focus state border
    },
    
    // Status Colors
    status: {
      success: '#10b981',     // Green
      warning: '#f59e0b',     // Yellow
      error: '#ef4444',       // Red
      info: '#3b82f6'         // Blue
    }
  },
  
  // Typography Scale
  typography: {
    fontFamily: {
      primary: ['Inter', 'sans-serif'],
      display: ['Satoshi', 'sans-serif']
    },
    
    sizes: {
      xs: 'text-xs',      // 12px
      sm: 'text-sm',      // 14px
      base: 'text-base',  // 16px
      lg: 'text-lg',      // 18px
      xl: 'text-xl',      // 20px
      '2xl': 'text-2xl',  // 24px
      '3xl': 'text-3xl',  // 30px
      '4xl': 'text-4xl',  // 36px
      '5xl': 'text-5xl',  // 48px
      '6xl': 'text-6xl',  // 60px
      '7xl': 'text-7xl'   // 72px
    },
    
    weights: {
      normal: 'font-normal',    // 400
      medium: 'font-medium',    // 500
      semibold: 'font-semibold', // 600
      bold: 'font-bold'         // 700
    }
  },
  
  // Spacing Scale
  spacing: {
    sections: {
      sm: 'py-12',      // Small section padding
      md: 'py-16',      // Medium section padding
      lg: 'py-20',      // Large section padding
      xl: 'py-24'       // Extra large section padding
    },
    
    containers: {
      sm: 'px-4 sm:px-6 lg:px-8',           // Standard container padding
      wide: 'max-w-7xl mx-auto',            // Max width container
      narrow: 'max-w-4xl mx-auto',          // Narrow content
      text: 'max-w-3xl mx-auto'             // Text content max width
    }
  },
  
  // Component Variants
  components: {
    buttons: {
      primary: 'bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all transform hover:scale-105',
      secondary: 'bg-transparent border-2 border-[#8A2BE2] text-white font-semibold hover:bg-[#8A2BE2] transition-all',
      ghost: 'text-gray-300 hover:text-white transition-colors',
      dark: 'bg-[#2A2A3A] text-white hover:bg-gradient-to-r hover:from-[#8A2BE2] hover:to-[#FF1493] transition-all'
    },
    
    cards: {
      primary: 'bg-gradient-to-br from-[#1C1C2D] to-[#2A2A3A] rounded-2xl border border-white/5 hover:border-white/10 transition-all',
      glass: 'bg-[#0F0F1A]/95 backdrop-blur-sm border border-white/10',
      feature: 'bg-gradient-to-br from-[#1C1C2D] to-[#2A2A3A] rounded-2xl p-8 hover:transform hover:scale-105 transition-all'
    },
    
    inputs: {
      primary: 'bg-[#1C1C2D] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-[#8A2BE2] focus:outline-none',
      search: 'bg-[#0F0F1A] border border-white/10 rounded-full text-white placeholder-gray-400 focus:border-[#8A2BE2] focus:outline-none'
    }
  },
  
  // Layout & Grid
  layout: {
    navigation: {
      height: 'h-16',
      background: 'bg-[#0F0F1A]/95 backdrop-blur-sm border-b border-white/10',
      position: 'fixed top-0 left-0 right-0 z-50'
    },
    
    grids: {
      responsive2: 'grid md:grid-cols-2 gap-8',
      responsive3: 'grid md:grid-cols-2 lg:grid-cols-3 gap-8',
      responsive4: 'grid md:grid-cols-2 lg:grid-cols-4 gap-8',
      features: 'grid lg:grid-cols-2 gap-12 items-center'
    }
  },
  
  // Animations & Effects
  effects: {
    gradients: {
      primary: 'bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]',
      reverse: 'bg-gradient-to-r from-[#FF1493] to-[#8A2BE2]',
      text: 'text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]',
      glow: 'shadow-xl shadow-purple-500/30'
    },
    
    transitions: {
      fast: 'transition-all duration-200',
      normal: 'transition-all duration-300',
      slow: 'transition-all duration-500'
    },
    
    hover: {
      scale: 'hover:transform hover:scale-105',
      glow: 'hover:shadow-lg hover:shadow-purple-500/25'
    }
  }
}

// Helper Functions
export const getButtonClass = (variant = 'primary', size = 'md') => {
  const baseClass = 'inline-flex items-center justify-center rounded-full font-semibold transition-all'
  
  const variants = {
    primary: sparkTheme.components.buttons.primary,
    secondary: sparkTheme.components.buttons.secondary,
    ghost: sparkTheme.components.buttons.ghost,
    dark: sparkTheme.components.buttons.dark
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }
  
  return `${baseClass} ${variants[variant]} ${sizes[size]}`
}

export const getCardClass = (variant = 'primary') => {
  return sparkTheme.components.cards[variant]
}

export const getTextClass = (size = 'base', weight = 'normal', color = 'primary') => {
  const sizes = sparkTheme.typography.sizes
  const weights = sparkTheme.typography.weights
  const colors = {
    primary: 'text-white',
    secondary: 'text-gray-300',
    muted: 'text-gray-400',
    gradient: sparkTheme.effects.gradients.text
  }
  
  return `${sizes[size]} ${weights[weight]} ${colors[color]}`
}