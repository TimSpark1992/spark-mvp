import { CheckCircle, Target, Clock, Shield } from 'lucide-react'

export default function WhySpark() {
  const features = [
    {
      icon: Target,
      title: "Targeted Matching",
      description: "AI-powered matching connects brands with the perfect creators for their campaigns."
    },
    {
      icon: Clock,
      title: "Fast & Efficient",
      description: "Streamlined process from campaign creation to creator selection in just a few clicks."
    },
    {
      icon: Shield,
      title: "Verified Creators",
      description: "All creators are verified and vetted to ensure quality partnerships."
    },
    {
      icon: CheckCircle,
      title: "Proven Results",
      description: "Track performance metrics and ROI with our comprehensive analytics dashboard."
    }
  ]

  return (
    <section id="why-spark" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-montserrat font-bold text-gray-900 mb-6">
            Why Choose Spark?
          </h2>
          <p className="text-xl text-gray-600">
            Spark revolutionizes how brands and creators collaborate, making campaign management 
            simple, efficient, and results-driven.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}