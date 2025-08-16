import { ArrowRight, Sparkles } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8" id="hero">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-8">
          {/* Hero Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight">
              Connect Brands with
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]">
                Top Creators
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              The ultimate platform for brands and creators to collaborate, create powerful campaigns, 
              and amplify their reach with AI-powered voice generation and targeted marketing.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href="/auth/signup?role=brand"
              className="block bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all transform hover:scale-105 cursor-pointer no-underline"
              style={{textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem'}}
            >
              <span>I'm a Brand</span>
              <ArrowRight className="w-5 h-5" />
            </a>
            <a 
              href="/auth/signup?role=creator"
              className="block bg-transparent border-2 border-[#8A2BE2] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#8A2BE2] transition-all cursor-pointer no-underline"
              style={{textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem'}}
            >
              <span>I'm a Creator</span>
              <Sparkles className="w-5 h-5" />
            </a>
          </div>

          {/* Hero Visual */}
          <div className="mt-16">
            <div className="bg-gradient-to-br from-[#1C1C2D] to-[#2A2A3A] rounded-3xl p-8 max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white font-semibold text-lg">AI-Powered Campaigns</span>
                  </div>
                  <p className="text-gray-300">
                    Create engaging content with AI voice generation, connect with top influencers, 
                    and track campaign performance in real-time.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-[#0F0F1A] rounded-xl p-4 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#FF1493] to-[#8A2BE2] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">L</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Lena - Voice Creator</p>
                      <p className="text-gray-400 text-sm">Campaign Performance: 94%</p>
                    </div>
                  </div>
                  <div className="bg-[#0F0F1A] rounded-xl p-4 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">E</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Ethan - Content Creator</p>
                      <p className="text-gray-400 text-sm">Campaign Performance: 89%</p>
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