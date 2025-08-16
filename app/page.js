import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import WhySparkSection from '@/components/landing/WhySparkSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import BenefitsSection from '@/components/landing/BenefitsSection'
import CTASection from '@/components/landing/CTASection'
import StatsSection from '@/components/landing/StatsSection'
import TestimonialSection from '@/components/landing/TestimonialSection'
import FAQSection from '@/components/landing/FAQSection'
import JoinBetaSection from '@/components/landing/JoinBetaSection'
import Footer from '@/components/landing/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white font-inter">
      {/* 1. Navbar */}
      <Navbar />
      
      {/* 2. Hero Header Section */}
      <HeroSection />
      
      {/* 3. Why Spark Section */}
      <WhySparkSection />
      
      {/* 4. How It Works Section */}
      <HowItWorksSection />
      
      {/* 5. Benefits Section */}
      <BenefitsSection />
      
      {/* 6. CTA Section */}
      <CTASection />
      
      {/* 7. Stats Section */}
      <StatsSection />
      
      {/* 8. Testimonial Section */}
      <TestimonialSection />
      
      {/* 9. FAQ Section */}
      <FAQSection />
      
      {/* 10. Join The Beta Section */}
      <JoinBetaSection />
      
      {/* 11. Footer */}
      <Footer />
    </div>
  )
}