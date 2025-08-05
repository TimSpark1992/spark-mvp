// Add routing to the main app to redirect to landing page
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the new landing page
    router.push('/landing')
  }, [router])

  return (
    <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center">
      <div className="text-white text-xl">Redirecting to Spark Landing Page...</div>
    </div>
  )
}