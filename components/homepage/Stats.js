export default function Stats() {
  const stats = [
    {
      number: "75%",
      label: "Campaign Success Rate",
      description: "Average success rate across all campaigns on our platform"
    },
    {
      number: "50%",
      label: "Time Saved",
      description: "Reduction in campaign setup and management time"
    },
    {
      number: "1000+",
      label: "Active Users",
      description: "Growing community of brands and creators"
    },
    {
      number: "95%",
      label: "User Satisfaction",
      description: "Positive feedback from our community members"
    }
  ]

  return (
    <section className="py-20 bg-primary text-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-montserrat font-bold mb-6">
            Spark's Impacting the Brand Campaign World
          </h2>
          <p className="text-xl text-primary-foreground/80">
            Our platform has transformed how brands and creators collaborate, 
            delivering measurable results across thousands of campaigns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-4">
                {stat.number}
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {stat.label}
              </h3>
              <p className="text-primary-foreground/70">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}