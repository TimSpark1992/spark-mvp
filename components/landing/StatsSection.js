'use client'

import { Users, Zap, TrendingUp, Award } from 'lucide-react'

export default function StatsSection() {
  const stats = [
    {
      icon: <Users className="w-8 h-8" />,
      number: "10,000+",
      label: "Active Creators",
      description: "Verified influencers and content creators"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      number: "500+",
      label: "Campaigns Launched",
      description: "Successful brand collaborations"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      number: "300%",
      label: "Average ROI",
      description: "Return on investment for brands"
    },
    {
      icon: <Award className="w-8 h-8" />,
      number: "98%",
      label: "Success Rate",
      description: "Campaigns meeting their goals"
    }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0A0F]" id="stats">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Platform
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]"> Success </span>
            Metrics
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Numbers that speak for themselves - see why Spark is the trusted choice for brands and creators worldwide
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="group text-center">
              <div className="bg-gradient-to-br from-[#1C1C2D] to-[#2A2A3A] rounded-2xl p-8 border border-white/5 hover:border-white/10 transition-all hover:transform hover:scale-105">
                {/* Icon */}
                <div className="w-16 h-16 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg group-hover:shadow-purple-500/25 transition-all">
                  <div className="text-white">
                    {stat.icon}
                  </div>
                </div>

                {/* Number */}
                <div className="space-y-2 mb-4">
                  <h3 className="text-4xl font-bold text-white">{stat.number}</h3>
                  <p className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]">
                    {stat.label}
                  </p>
                </div>

                {/* Description */}
                <p className="text-gray-300 text-sm leading-relaxed">{stat.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Text */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-300">
            Join the growing community of successful brands and creators on Spark
          </p>
        </div>
      </div>
    </section>
  )
}