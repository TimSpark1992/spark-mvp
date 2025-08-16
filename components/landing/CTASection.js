import { ArrowRight, Sparkles } from 'lucide-react'

export default function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" id="cta">
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#8A2BE2]/20 to-[#FF1493]/20 rounded-3xl blur-3xl"></div>
          
          <div className="relative bg-gradient-to-br from-[#1C1C2D] to-[#2A2A3A] rounded-3xl p-12 lg:p-16 border border-white/10">
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Ready to 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]"> Transform </span>
                  Your Campaigns?
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  Join thousands of brands and creators who are already using Spark to create incredible 
                  campaigns with AI-powered voice generation and targeted marketing.
                </p>
              </div>

              {/* CTA Buttons - FIXED */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a 
                  href="/auth/signup" 
                  className="block bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/40 transition-all transform hover:scale-105 cursor-pointer no-underline"
                  style={{textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px'}}
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a 
                  href="#hero" 
                  className="bg-transparent border-2 border-white/20 text-white px-10 py-4 rounded-full font-semibold text-lg hover:bg-white/5 transition-all cursor-pointer no-underline"
                  style={{textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px'}}
                >
                  <span>View Demo</span>
                  <Sparkles className="w-5 h-5" />
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-8 border-t border-white/10">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-400">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>14-day free trial</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Cancel anytime</span>
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