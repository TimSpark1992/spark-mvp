'use client'

import { Mic, Users, BarChart3, Zap } from 'lucide-react'

export default function WhySparkSection() {
  const features = [
    {
      icon: <Mic className="w-8 h-8" />,
      title: "AI Voice Generation",
      description: "Create authentic, engaging voice content with our advanced AI technology. Perfect for podcasts, ads, and social media content.",
      gradient: "from-[#8A2BE2] to-[#FF1493]"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Creator Network",
      description: "Access thousands of verified creators and influencers across all major platforms. Find the perfect match for your brand.",
      gradient: "from-[#FF1493] to-[#8A2BE2]"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Real-time Analytics",
      description: "Track campaign performance, engagement rates, and ROI with our comprehensive analytics dashboard.",
      gradient: "from-[#8A2BE2] to-[#9400D3]"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Lightning Fast Setup",
      description: "Launch campaigns in minutes, not weeks. Our streamlined process gets you from concept to execution quickly.",
      gradient: "from-[#FF1493] to-[#8A2BE2]"
    }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0A0F]" id="why-spark">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Why Choose 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]"> Spark</span>?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            The most powerful platform for brands and creators, designed for the modern digital landscape
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group hover:transform hover:scale-105 transition-all duration-300">
              <div className="bg-gradient-to-br from-[#1C1C2D] to-[#2A2A3A] rounded-2xl p-8 h-full border border-white/5 hover:border-white/10">
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-purple-500/25 transition-all`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}