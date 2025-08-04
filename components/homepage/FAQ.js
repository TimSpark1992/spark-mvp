'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function FAQ() {
  const [openItem, setOpenItem] = useState(null)

  const faqs = [
    {
      question: "How does Spark work?",
      answer: "Spark connects brands with creators through our intelligent matching platform. Brands post campaign briefs, creators apply, and we facilitate secure collaboration with built-in project management tools."
    },
    {
      question: "What types of campaigns can I create?",
      answer: "You can create various types of campaigns including social media content, product reviews, sponsored posts, video content, blog articles, and more. Our platform supports all major content formats and social platforms."
    },
    {
      question: "How are creators vetted?",
      answer: "All creators go through our verification process which includes portfolio review, social media authentication, and performance history analysis. We ensure only quality creators join our marketplace."
    },
    {
      question: "What are the fees?",
      answer: "Spark operates on a transparent fee structure. Brands pay a small platform fee for successful campaigns, and creators receive their full agreed-upon compensation. No hidden fees or surprise charges."
    },
    {
      question: "How do payments work?",
      answer: "Payments are processed securely through our platform. Brands fund campaigns upfront, and creators receive payment upon successful campaign completion and approval. We support multiple payment methods."
    },
    {
      question: "Can I track campaign performance?",
      answer: "Yes! Our analytics dashboard provides real-time campaign performance metrics, engagement rates, reach data, and ROI tracking. You'll have full visibility into your campaign's success."
    }
  ]

  const toggleItem = (index) => {
    setOpenItem(openItem === index ? null : index)
  }

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-montserrat font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about getting started with Spark
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">
                    {faq.question}
                  </span>
                  {openItem === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                
                {openItem === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}