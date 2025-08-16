'use client'

import { useState } from 'react'
import { ArrowRight, Mail } from 'lucide-react'

export default function JoinBetaSection() {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // In a real app, you would send this to your backend
    setIsSubscribed(true)
    setEmail('')
    setTimeout(() => setIsSubscribed(false), 3000)
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0F0F1A] to-[#1C1C2D]" id="join-beta">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-8">
          {/* Section Header */}
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Join the 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]"> Beta </span>
              Revolution
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Be among the first to experience the future of creator-brand collaborations. 
              Get early access and exclusive benefits.
            </p>
          </div>

          {/* Email Signup Form */}
          <div className="max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-6 py-4 bg-[#1C1C2D] border border-white/10 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8A2BE2] focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={isSubscribed}
                className="bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white px-8 py-4 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubscribed ? (
                  <span>Subscribed!</span>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>Join Beta</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Alternative CTA */}
          <div className="pt-8">
            <p className="text-gray-400 mb-4">Ready to get started now?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/auth/signup?role=creator">
                <button className="bg-transparent border-2 border-[#8A2BE2] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#8A2BE2] transition-all flex items-center justify-center space-x-2 cursor-pointer">
                  <span>I'm a Creator</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </a>
              <a href="/auth/signup?role=brand">
                <button className="bg-transparent border-2 border-[#FF1493] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#FF1493] transition-all flex items-center justify-center space-x-2 cursor-pointer">
                  <span>I'm a Brand</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}