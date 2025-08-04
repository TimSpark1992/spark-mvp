import { Star, Quote } from 'lucide-react'

export default function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Director",
      company: "TechFlow Inc.",
      avatar: "SJ",
      rating: 5,
      text: "Spark transformed our influencer marketing strategy. We've seen a 200% increase in engagement and our campaigns are now more targeted than ever."
    },
    {
      name: "Mike Chen",
      role: "Content Creator",
      handle: "@mikecreates",
      avatar: "MC",
      rating: 5,
      text: "As a creator, Spark has opened doors to amazing brand partnerships. The platform makes it easy to find campaigns that align with my content style."
    },
    {
      name: "Emma Rodriguez",
      role: "Brand Manager",
      company: "StyleCo",
      avatar: "ER",
      rating: 5,
      text: "The ROI tracking and analytics on Spark are incredible. We can see exactly how our campaigns perform and optimize in real-time."
    }
  ]

  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-montserrat font-bold text-gray-900 mb-6">
            What Our Users Say
          </h2>
          <p className="text-xl text-gray-600">
            Don't just take our word for it. Here's what brands and creators 
            are saying about their experience with Spark.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <div className="relative mb-6">
                <Quote className="absolute -top-2 -left-2 w-8 h-8 text-primary/20" />
                <p className="text-gray-700 italic pl-6">
                  "{testimonial.text}"
                </p>
              </div>
              
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                  <span className="text-primary font-semibold">
                    {testimonial.avatar}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}
                    {testimonial.company && ` at ${testimonial.company}`}
                    {testimonial.handle && ` ${testimonial.handle}`}
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