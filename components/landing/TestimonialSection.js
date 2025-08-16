'use client'

import { Star } from 'lucide-react'

export default function TestimonialSection() {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Marketing Director",
      company: "TechFlow Inc",
      avatar: "S",
      rating: 5,
      testimonial: "Spark transformed our influencer marketing strategy. The AI voice generation feature helped us create consistent, high-quality content across all campaigns. Our ROI increased by 250% in just 3 months."
    },
    {
      name: "Marcus Rodriguez",
      role: "Content Creator",
      company: "@MarcusCreates",
      avatar: "M",
      rating: 5,
      testimonial: "As a creator, Spark made it incredibly easy to connect with brands that align with my values. The platform's matching system is spot-on, and I've seen a 40% increase in my campaign earnings."
    },
    {
      name: "Emily Watson",
      role: "Brand Manager",
      company: "Fashion Forward",
      avatar: "E",
      rating: 5,
      testimonial: "The analytics dashboard is phenomenal. We can track everything from engagement rates to conversion metrics in real-time. It's like having a dedicated data analyst for every campaign."
    },
    {
      name: "David Kim",
      role: "Influencer",
      company: "@DavidTech",
      avatar: "D",
      rating: 5,
      testimonial: "Spark's AI voice generation feature opened up new opportunities for me in podcast advertising and audiobook promotions. The quality is indistinguishable from real recordings."
    },
    {
      name: "Lisa Thompson",
      role: "CMO",
      company: "GrowthLabs",
      avatar: "L",
      rating: 5,
      testimonial: "We've tried every influencer platform out there, but nothing comes close to Spark's efficiency and results. Campaign setup that used to take weeks now takes hours."
    },
    {
      name: "Alex Chen",
      role: "YouTuber",
      company: "@AlexReviews",
      avatar: "A",
      rating: 5,
      testimonial: "The creator network on Spark is incredible. I've collaborated with brands I never would have discovered otherwise, and every partnership has been successful."
    }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" id="testimonials">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            What Our
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] to-[#FF1493]"> Community </span>
            Says
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Real feedback from brands and creators who have transformed their campaigns with Spark
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="group">
              <div className="bg-gradient-to-br from-[#1C1C2D] to-[#2A2A3A] rounded-2xl p-6 h-full border border-white/5 hover:border-white/10 transition-all hover:transform hover:scale-105">
                {/* Stars */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-gray-300 leading-relaxed mb-6 text-sm">
                  "{testimonial.testimonial}"
                </p>

                {/* Author */}
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{testimonial.name}</p>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                    <p className="text-gray-500 text-xs">{testimonial.company}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="space-y-4">
            <p className="text-lg text-gray-300">Ready to join our success stories?</p>
            <button className="bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all transform hover:scale-105">
              Start Your Success Story
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}