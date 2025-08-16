'use client'

import { useState } from 'react'
import { Mic, Sparkles, ArrowRight, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react'

// Navigation Component
function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F0F1A]/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">SPARK</h1>
          </div>
          
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
          <div className="space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Powerful campaigns for 
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]">
                modern creators
              </span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              Connect with top influencers and creators to amplify your brand through AI-powered voice generation and targeted campaigns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all transform hover:scale-105">
                I'm a Brand
              </button>
              <button className="bg-transparent border-2 border-[#8A2BE2] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#8A2BE2] transition-all">
                I'm a Creator
              </button>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#1C1C2D] to-[#2A2A3A] rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-semibold">AI Voice Campaign</span>
                </div>
                <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]">
                  Live
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">L</span>
                  </div>
                  <span className="text-white">Lena - Voice Generation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#FF1493] to-[#8A2BE2] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">E</span>
                  </div>
                  <span className="text-white">Ethan - Content Creation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Tab Switcher Component
function TabSwitcher({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'trending', label: 'Trending' },
    { id: 'creators', label: 'Top Creators' },
    { id: 'campaigns', label: 'Active Campaigns' }
  ]

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center">
          <div className="bg-[#1C1C2D] rounded-2xl p-2 flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl transition-all font-semibold ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-[#2A2A3A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Top Creators Component
function TopCreators() {
  const creators = [
    { name: 'Lena', specialty: 'Voice Generation', avatar: 'L' },
    { name: 'Ethan', specialty: 'Content Creation', avatar: 'E' },
    { name: 'Maya', specialty: 'Brand Partnerships', avatar: 'M' },
    { name: 'Alex', specialty: 'Tech Reviews', avatar: 'A' }
  ]

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Featured Creators
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {creators.map((creator, index) => (
            <div key={index} className="bg-gradient-to-br from-[#1C1C2D] to-[#2A2A3A] rounded-2xl p-6 hover:transform hover:scale-105 transition-all">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full flex items-center justify-center mx-auto">
                  <span className="text-white text-xl font-bold">{creator.avatar}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{creator.name}</h3>
                  <p className="text-gray-400">{creator.specialty}</p>
                </div>
                <button className="w-full bg-[#2A2A3A] text-white py-2 rounded-xl hover:bg-gradient-to-r hover:from-[#8A2BE2] hover:to-[#FF1493] transition-all">
                  View Profile
                </button>
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
            
            <div className="bg-[#1C1C2D] rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Creators</p>
                  <p className="text-2xl font-bold text-white">318</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Live Campaigns</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-8 h-8 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">47</span>
                    </div>
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

// CTA Section
function CallToAction() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
          Ready to launch your first campaign?
        </h2>
        <p className="text-xl text-gray-300">
          Join thousands of brands and creators already using Spark to create amazing content with AI-powered voice generation.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all transform hover:scale-105">
            Get Started Today
          </button>
          <button className="bg-transparent border-2 border-[#8A2BE2] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#8A2BE2] transition-all">
            Start Free Trial
          </button>
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
      <CallToAction />
    </div>
  )
}