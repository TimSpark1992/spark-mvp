'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, CheckCircle } from 'lucide-react'

export default function JoinBeta() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: Implement beta signup logic
    setIsSubmitted(true)
    setEmail('')
  }

  if (isSubmitted) {
    return (
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <CheckCircle className="w-16 h-16 mx-auto mb-6 text-green-400" />
            <h2 className="text-3xl md:text-4xl font-montserrat font-bold mb-4">
              Thanks for joining the beta!
            </h2>
            <p className="text-xl text-primary-foreground/80">
              We'll be in touch soon with early access to Spark. 
              Get ready to revolutionize your campaigns!
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-primary text-white">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-montserrat font-bold mb-6">
            Join Our Beta Program Today
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-10">
            Be among the first to experience the future of brand-creator collaborations. 
            Join our beta program and get early access to exclusive features.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white text-gray-900 border-white flex-1"
            />
            <Button 
              type="submit" 
              variant="secondary" 
              className="flex items-center gap-2 px-8"
            >
              Join Beta
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-sm text-primary-foreground/60 mt-4">
            No spam, ever. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  )
}