import { UserPlus, FileText, Users, Trophy } from 'lucide-react'

export default function HowItWorks() {
  const steps = [
    {
      icon: UserPlus,
      title: "Sign Up",
      description: "Create your account as a brand or creator in just a few minutes.",
      forBrands: "Set up your company profile and campaign preferences.",
      forCreators: "Build your creator profile and showcase your portfolio."
    },
    {
      icon: FileText,
      title: "Create & Discover",
      description: "Brands post campaigns, creators discover opportunities.",
      forBrands: "Post detailed campaign briefs with requirements and budget.",
      forCreators: "Browse and filter campaigns that match your niche and interests."
    },
    {
      icon: Users,
      title: "Connect & Apply",
      description: "Smart matching connects the right creators with the right brands.",
      forBrands: "Review applications and select the best creators for your campaign.",
      forCreators: "Apply to campaigns with your media kit and proposal."
    },
    {
      icon: Trophy,
      title: "Execute & Succeed",
      description: "Collaborate seamlessly and achieve your campaign goals.",
      forBrands: "Track campaign progress and measure results with analytics.",
      forCreators: "Create amazing content and build lasting brand relationships."
    }
  ]

  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-montserrat font-bold text-gray-900 mb-6">
            How It Works
          </h2>
          <p className="text-xl text-gray-600">
            Our streamlined process makes it easy for brands and creators to find each other 
            and create successful partnerships.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Step number */}
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold z-10">
                {index + 1}
              </div>
              
              {/* Connection line (hidden on last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-16 w-full h-0.5 bg-gray-200 z-0"></div>
              )}

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 h-full">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                
                <p className="text-gray-600 mb-4">
                  {step.description}
                </p>
                
                <div className="space-y-3">
                  <div className="text-sm">
                    <div className="font-medium text-primary mb-1">For Brands:</div>
                    <div className="text-gray-600">{step.forBrands}</div>
                  </div>
                  
                  <div className="text-sm">
                    <div className="font-medium text-accent mb-1">For Creators:</div>
                    <div className="text-gray-600">{step.forCreators}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}