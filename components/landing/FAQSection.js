'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

export default function FAQSection() {
  const [openItem, setOpenItem] = useState(null)

  const faqs = [
    {
      question: "How does Spark's AI voice generation work?",
      answer: "Our AI voice generation uses advanced machine learning to create natural-sounding voices for your campaigns. You can customize voice characteristics, tone, and style to match your brand perfectly. The technology ensures consistent quality across all your content while maintaining authenticity."
    },
    {
      question: "What types of creators are available on the platform?",
      answer: "Spark hosts over 10,000 verified creators across all major platforms including YouTube, Instagram, TikTok, Twitter, and podcasting. We have influencers in every niche from tech and gaming to fashion, lifestyle, fitness, and business. All creators are thoroughly vetted for authenticity and engagement quality."
    },
    {
      question: "How quickly can I launch a campaign?",
      answer: "With Spark's streamlined process, you can launch a campaign in as little as 2 hours. Our automated matching system helps you find suitable creators quickly, and our pre-built templates make content creation fast and efficient. Most campaigns go from concept to launch within 24-48 hours."
    },
    {
      question: "What kind of analytics and reporting do you provide?",
      answer: "Our comprehensive analytics dashboard tracks everything from engagement rates, click-through rates, conversions, and ROI in real-time. You get detailed insights into audience demographics, content performance, and campaign effectiveness. All data is exportable and integrates with major marketing platforms."
    },
    {
      question: "How do you ensure creator quality and authenticity?",
      answer: "Every creator undergoes a thorough verification process including identity verification, social media audit, engagement analysis, and background checks. We use AI-powered tools to detect fake followers and engagement. Only creators who meet our strict quality standards are accepted into the network."
    },
    {
      question: "What are your pricing plans?",
      answer: "We offer flexible pricing starting with a 14-day free trial. Plans are based on campaign volume and features needed, ranging from starter packages for small businesses to enterprise solutions for large brands. All plans include access to our creator network, AI tools, and analytics dashboard."
    },
    {
      question: "Can I use Spark for multiple brands or campaigns?",
      answer: "Absolutely! Our platform is designed to handle multiple brands and simultaneous campaigns. You can create separate workspaces for different brands, set user permissions, and manage all campaigns from a single dashboard. Perfect for agencies and businesses with multiple product lines."
    },
    {
      question: "What support do you offer?",
      answer: "We provide 24/7 customer support via chat, email, and phone. All users get access to our comprehensive knowledge base, video tutorials, and best practices guides. Premium plans include dedicated account managers and priority support with sub-1-hour response times."
    }
  ]

  const toggleItem = (index) => {
    setOpenItem(openItem === index ? null : index)
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0A0F]" id="faq">
      <div className="max-w-4xl mx-auto">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Frequently Asked
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]"> Questions</span>
          </h2>
          <p className="text-xl text-gray-300">
            Everything you need to know about Spark platform
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gradient-to-br from-[#1C1C2D] to-[#2A2A3A] rounded-2xl border border-white/5">
              <button
                onClick={() => toggleItem(index)}
                className="w-full text-left p-6 flex items-center justify-between hover:bg-white/5 transition-colors rounded-2xl"
              >
                <h3 className="text-lg font-semibold text-white pr-4">
                  {faq.question}
                </h3>
                <div className="flex-shrink-0">
                  {openItem === index ? (
                    <Minus className="w-5 h-5 text-[#8A2BE2]" />
                  ) : (
                    <Plus className="w-5 h-5 text-[#8A2BE2]" />
                  )}
                </div>
              </button>
              
              {openItem === index && (
                <div className="px-6 pb-6">
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA - FIXED */}
        <div className="text-center mt-16">
          <div className="space-y-4">
            <p className="text-lg text-gray-300">Still have questions?</p>
            <a 
              href="/contact" 
              className="bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all transform hover:scale-105 cursor-pointer no-underline inline-block"
              style={{textDecoration: 'none'}}
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}