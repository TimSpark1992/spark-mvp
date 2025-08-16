import { Search, Handshake, Rocket } from 'lucide-react'

export default function HowItWorksSection() {
  const steps = [
    {
      icon: <Search className="w-8 h-8" />,
      title: "Discover & Connect",
      description: "Browse our verified creator network or let creators find your campaigns. Use filters to find the perfect match for your brand.",
      step: "01"
    },
    {
      icon: <Handshake className="w-8 h-8" />,
      title: "Collaborate & Create",
      description: "Work together on campaign concepts, utilize AI voice generation, and create engaging content that resonates with your audience.",
      step: "02"
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: "Launch & Track",
      description: "Deploy your campaigns across platforms and monitor performance with real-time analytics and detailed reporting.",
      step: "03"
    }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" id="how-it-works">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            How Spark 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]"> Works</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Simple, streamlined process to get your campaigns up and running in no time
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 right-0 w-full h-0.5 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] transform translate-x-1/2 -translate-y-1/2 z-0" 
                     style={{width: 'calc(100% + 3rem)'}} />
              )}
              
              <div className="relative z-10 text-center space-y-6">
                {/* Step Number */}
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full text-white font-bold text-xl mb-4">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#1C1C2D] to-[#2A2A3A] rounded-2xl flex items-center justify-center border border-white/10">
                    <div className="text-white">
                      {step.icon}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA - FIXED */}
        <div className="text-center mt-16">
          <a 
            href="/auth/signup" 
            className="bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all transform hover:scale-105 cursor-pointer no-underline inline-block"
            style={{textDecoration: 'none'}}
          >
            Get Started Today
          </a>
        </div>
      </div>
    </section>
  )
}