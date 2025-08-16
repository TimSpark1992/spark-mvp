'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Users, Briefcase } from 'lucide-react'

export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-primary/5 via-secondary/50 to-primary/10 py-20 lg:py-32">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-montserrat font-bold text-gray-900 mb-6">
            Smarter Campaigns.
            <br />
            <span className="text-primary">Spark is Your All-Powered Growth Platform.</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Connect brands with creators through our innovative marketplace platform. 
            Launch campaigns, find talent, and grow your business with Spark.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/auth/signup?role=creator">
              <Button size="lg" className="w-full sm:w-auto flex items-center gap-2">
                <Users className="w-5 h-5" />
                I'm a Creator
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            
            <Link href="/auth/signup?role=brand">
              <Button size="lg" variant="outline" className="w-full sm:w-auto flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                I'm a Brand
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Hero Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">10K+</div>
              <div className="text-gray-600">Active Creators</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-gray-600">Successful Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">95%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}