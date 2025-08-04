import { DollarSign, TrendingUp, Clock, Users, Shield, Zap } from 'lucide-react'

export default function Benefits() {
  const brandBenefits = [
    {
      icon: Users,
      title: "Access to Verified Creators",
      description: "Connect with a curated network of professional content creators and influencers."
    },
    {
      icon: TrendingUp,
      title: "Measurable ROI",
      description: "Track campaign performance with detailed analytics and reporting tools."
    },
    {
      icon: Clock,
      title: "Save Time & Resources",
      description: "Streamlined campaign management reduces time-to-market and operational overhead."
    }
  ]

  const creatorBenefits = [
    {
      icon: DollarSign,
      title: "Fair Compensation",
      description: "Transparent pricing and timely payments for all completed campaigns."
    },
    {
      icon: Shield,
      title: "Brand Safety",
      description: "Work with verified brands and secure contracts that protect your interests."
    },
    {
      icon: Zap,
      title: "Growth Opportunities",
      description: "Access exclusive campaigns and build long-term partnerships with top brands."
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-montserrat font-bold text-gray-900 mb-6">
            Benefits for Everyone
          </h2>
          <p className="text-xl text-gray-600">
            Spark provides value to both brands seeking authentic content and creators looking 
            for meaningful partnerships.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Brand Benefits */}
          <div>
            <div className="text-center mb-10">
              <h3 className="text-2xl font-montserrat font-bold text-primary mb-4">
                For Brands
              </h3>
              <p className="text-gray-600">
                Amplify your reach and drive results with authentic creator partnerships
              </p>
            </div>
            
            <div className="space-y-6">
              {brandBenefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {benefit.title}
                    </h4>
                    <p className="text-gray-600">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Creator Benefits */}
          <div>
            <div className="text-center mb-10">
              <h3 className="text-2xl font-montserrat font-bold text-accent mb-4">
                For Creators
              </h3>
              <p className="text-gray-600">
                Monetize your creativity and build your personal brand with top companies
              </p>
            </div>
            
            <div className="space-y-6">
              {creatorBenefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {benefit.title}
                    </h4>
                    <p className="text-gray-600">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}