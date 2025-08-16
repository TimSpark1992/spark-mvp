import { TrendingUp, Clock, Shield, Globe, Star } from 'lucide-react'

export default function BenefitsSection() {
  const benefits = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Boost ROI by 300%",
      description: "Our AI-driven matching and campaign optimization delivers exceptional return on investment for brands.",
      stats: "Average 300% ROI increase"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Save 80% Time",
      description: "Streamlined workflows and automated processes reduce campaign setup time from weeks to hours.",
      stats: "Setup in under 2 hours"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "100% Verified Creators",
      description: "Every creator in our network is thoroughly vetted and verified for authenticity and quality.",
      stats: "10,000+ verified creators"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Reach",
      description: "Connect with creators and audiences worldwide across all major social media platforms.",
      stats: "150+ countries covered"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Premium Support",
      description: "24/7 dedicated support team to help you maximize your campaign success and troubleshoot issues.",
      stats: "< 1 hour response time"
    }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0A0F]" id="benefits">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Benefits That
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]"> Drive Results</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover why thousands of brands and creators choose Spark for their campaign management and content creation
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="group">
              <div className="bg-gradient-to-br from-[#1C1C2D] to-[#2A2A3A] rounded-2xl p-8 h-full border border-white/5 hover:border-white/10 transition-all hover:transform hover:scale-105">
                {/* Icon */}
                <div className="w-12 h-12 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-xl flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-purple-500/25 transition-all">
                  <div className="text-white">
                    {benefit.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white">{benefit.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{benefit.description}</p>
                  
                  {/* Stats */}
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]">
                      {benefit.stats}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA - FIXED */}
        <div className="text-center mt-16">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4">
            <span className="text-lg text-gray-300">Ready to see these benefits in action?</span>
            <a 
              href="/auth/signup" 
              className="bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all cursor-pointer no-underline"
              style={{textDecoration: 'none'}}
            >
              Start Free Trial
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}