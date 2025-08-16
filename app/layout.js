import { Inter, Montserrat } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import OnboardingProvider from '@/components/onboarding/OnboardingProvider'
import AuthRedirectWrapper from '@/components/AuthRedirectWrapper'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
})

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat'
})

export const metadata = {
  title: 'Spark - KOL & Creator Marketplace',
  description: 'Connect brands with creators through our innovative marketplace platform.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${montserrat.variable} font-sans antialiased`}>
        <AuthProvider>
          <AuthRedirectWrapper>
            <OnboardingProvider>
              {children}
            </OnboardingProvider>
          </AuthRedirectWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}