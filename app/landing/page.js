'use client'

import { useState } from 'react'
import { Mic, Sparkles, ArrowRight, Play } from 'lucide-react'

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('trending')

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white font-inter">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F0F1A]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-white tracking-tight">SPARK</h1>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#campaigns" className="text-gray-300 hover:text-white transition-colors">Campaigns</a>
              <a href="#creators" className="text-gray-300 hover:text-white transition-colors">Creators</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            </div>
            <button className="bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all transform hover:scale-105">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Powerful campaigns for 
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]">
                  creators
                </span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed max-w-2xl">
                AI-generated campaigns to grow your audience and expand your reach.
              </p>
              <button className="bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all transform hover:scale-105">
                Get Started
              </button>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="w-64 h-64 bg-gradient-to-br from-[#8A2BE2] to-[#FF1493] rounded-full flex items-center justify-center">
                <Sparkles className="w-24 h-24 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Switcher */}
      <div className="flex justify-center mb-12">
        <div className="bg-[#1C1C2D] p-1 rounded-full">
          <button 
            onClick={() => setActiveTab('trending')}
            className={`px-8 py-3 rounded-full font-medium transition-all ${
              activeTab === 'trending' 
                ? 'bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white shadow-lg' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Trending
          </button>
          <button 
            onClick={() => setActiveTab('creators')}
            className={`px-8 py-3 rounded-full font-medium transition-all ${
              activeTab === 'creators' 
                ? 'bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white shadow-lg' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Creators
          </button>
        </div>
      </div>

      {/* Top Creators */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12">Top Creators</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {['Lena', 'Alex', 'Brianna'].map((name, index) => (
              <div key={index} className="bg-[#1C1C2D] rounded-2xl p-6 hover:bg-[#252536] transition-colors">
                <div className="flex flex-col items-center space-y-4">
                  <div className={`w-20 h-20 ${index === 0 ? 'bg-pink-500' : index === 1 ? 'bg-blue-500' : 'bg-yellow-500'} rounded-full flex items-center justify-center text-white text-2xl font-bold`}>
                    {name[0]}
                  </div>
                  <h3 className="text-xl font-semibold text-white">{name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Voice Feature */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-[#1C1C2D] to-[#2A2A3A] rounded-3xl p-8 space-y-6">
              <div className="w-16 h-16 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full flex items-center justify-center">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white">
                Generate voices with AI
              </h3>
              <div className="flex items-center space-x-1 py-4">
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i}
                    className="bg-gradient-to-t from-[#8A2BE2] to-[#FF1493] rounded-full"
                    style={{
                      width: '3px',
                      height: `${Math.random() * 40 + 10}px`,
                    }}
                  />
                ))}
              </div>
              <button className="flex items-center space-x-2 text-[#FF1493] hover:text-white transition-colors">
                <span>Try it now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="bg-[#1C1C2D] rounded-2xl p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">L</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Lena</p>
                    <p className="text-gray-400 text-sm">AI Voice Sample</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button className="w-10 h-10 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full flex items-center justify-center hover:shadow-lg transition-all">
                    <Play className="w-5 h-5 text-white ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}'use client'

import { useState } from 'react'
import { Mic, Sparkles, ArrowRight, Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react'

// Navigation Component
function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F0F1A]/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">SPARK</h1>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#campaigns" className="text-gray-300 hover:text-white transition-colors">
              Campaigns
            </a>
            <a href="#creators" className="text-gray-300 hover:text-white transition-colors">
              Creators
            </a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">
              Pricing
            </a>
          </div>
          
          {/* CTA Button */}
          <button className="bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all transform hover:scale-105">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  )
}

// Hero Section Component
function HeroSection() {
  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Powerful campaigns for 
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]">
                creators
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 leading-relaxed max-w-2xl">
              AI-generated campaigns to grow your audience and expand your reach.
            </p>
            
            <button className="bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all transform hover:scale-105">
              Get Started
            </button>
          </div>
          
          {/* Right Icon */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-64 h-64 bg-gradient-to-br from-[#8A2BE2] to-[#FF1493] rounded-full flex items-center justify-center">
              <Sparkles className="w-24 h-24 text-white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Tab Switcher Component
function TabSwitcher({ activeTab, setActiveTab }) {
  return (
    <div className="flex justify-center mb-12">
      <div className="bg-[#1C1C2D] p-1 rounded-full">
        <button 
          onClick={() => setActiveTab('trending')}
          className={`px-8 py-3 rounded-full font-medium transition-all ${
            activeTab === 'trending' 
              ? 'bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white shadow-lg' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Trending
        </button>
        <button 
          onClick={() => setActiveTab('creators')}
          className={`px-8 py-3 rounded-full font-medium transition-all ${
            activeTab === 'creators' 
              ? 'bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white shadow-lg' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Creators
        </button>
      </div>
    </div>
  )
}

// Top Creators Section
function TopCreators() {
  const creators = [
    { name: 'Lena', avatar: 'L', color: 'bg-pink-500' },
    { name: 'Alex', avatar: '/api/placeholder/80/80', color: 'bg-blue-500' },
    { name: 'Brianna', avatar: 'B', color: 'bg-yellow-500' }
  ]

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-12">Top Creators</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {creators.map((creator, index) => (
            <div key={index} className="bg-[#1C1C2D] rounded-2xl p-6 hover:bg-[#252536] transition-colors">
              <div className="flex flex-col items-center space-y-4">
                {creator.avatar.startsWith('/') ? (
                  <img 
                    src={creator.avatar} 
                    alt={creator.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className={`w-20 h-20 ${creator.color} rounded-full flex items-center justify-center text-white text-2xl font-bold`}>
                    {creator.avatar}
                  </div>
                )}
                <h3 className="text-xl font-semibold text-white">{creator.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// AI Voice Feature Section
function AIVoiceFeature() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Voice Generation Card */}
          <div className="bg-gradient-to-br from-[#1C1C2D] to-[#2A2A3A] rounded-3xl p-8 space-y-6">
            <div className="w-16 h-16 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full flex items-center justify-center">
              <Mic className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-3xl font-bold text-white">
              Generate voices with AI
            </h3>
            
            {/* Waveform Visualization */}
            <div className="flex items-center space-x-1 py-4">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i}
                  className="bg-gradient-to-t from-[#8A2BE2] to-[#FF1493] rounded-full"
                  style={{
                    width: '3px',
                    height: `${Math.random() * 40 + 10}px`,
                    animation: `pulse ${Math.random() * 2 + 1}s infinite`
                  }}
                />
              ))}
            </div>
            
            <button className="flex items-center space-x-2 text-[#FF1493] hover:text-white transition-colors">
              <span>Try it now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* Mock Audio Player */}
          <div className="space-y-6">
            <div className="bg-[#1C1C2D] rounded-2xl p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">L</span>
                </div>
                <div>
                  <p className="text-white font-semibold">Lena</p>
                  <p className="text-gray-400 text-sm">AI Voice Sample</p>
                </div>
              </div>
              
              {/* Audio Controls */}
              <div className="flex items-center space-x-4">
                <button className="text-gray-400 hover:text-white transition-colors">
                  <SkipBack className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full flex items-center justify-center hover:shadow-lg transition-all">
                  <Play className="w-5 h-5 text-white ml-1" />
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <SkipForward className="w-5 h-5" />
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Creator Stats */}
            <div className="bg-[#1C1C2D] rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Creators</p>
                  <p className="text-2xl font-bold text-white">318</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Influencer Campaign</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-8 h-8 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">E</span>
                    </div>
                    <span className="text-white font-semibold">Ethan</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Welcome Section
function WelcomeSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              Welcome to Spark
            </h2>
            <p className="text-xl text-gray-300">
              The AI-driven platform for creators
            </p>
            <button className="bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all transform hover:scale-105">
              Get started
            </button>
          </div>
          
          <div className="space-y-8">
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              Empowor creators
            </h2>
            <button className="bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all transform hover:scale-105">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

// Enhanced Content Section
function EnhancedContentSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              Enhance your content with AI voices
            </h2>
            <button className="bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all transform hover:scale-105">
              Get started for free
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Creators Tab */}
            <div className="bg-[#1C1C2D] rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-lg"></div>
                <span className="text-white font-semibold">Creators</span>
              </div>
            </div>
            
            {/* Influencer Campaign Card */}
            <div className="bg-gradient-to-br from-[#2A2A3A] to-[#1C1C2D] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Influencer Campaign</h3>
                <span className="text-3xl font-bold text-white">318</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">E</span>
                </div>
                <span className="text-white font-semibold">Ethan</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Final CTA Section
function FinalCTA() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              Launch your first campaign
            </h2>
            <p className="text-xl text-gray-300">
              Find and collaborate with top creators to promote your product
            </p>
            <button className="bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all transform hover:scale-105">
              Get Started
            </button>
          </div>
          
          <div className="space-y-8">
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              Launch your first campaign
            </h2>
            <p className="text-xl text-gray-300">
              Find and collaborate with top creators to promote your product
            </p>
            <button className="bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all transform hover:scale-105">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

// Main Landing Page Component
export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('trending')

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white font-inter">
      <Navigation />
      <HeroSection />
      <TabSwitcher activeTab={activeTab} setActiveTab={setActiveTab} />
      <TopCreators />
      <AIVoiceFeature />
      <WelcomeSection />
      <EnhancedContentSection />
      <FinalCTA />
    </div>
  )
}
