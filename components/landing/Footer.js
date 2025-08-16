import { Twitter, Instagram, Linkedin, Youtube, Mail } from 'lucide-react'

export default function Footer() {
  const footerLinks = {
    platform: [
      { name: 'How it Works', href: '#how-it-works' },
      { name: 'Creators', href: '#creators' },
      { name: 'Brands', href: '#brands' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'Enterprise', href: '#enterprise' }
    ],
    resources: [
      { name: 'Blog', href: '/blog' },
      { name: 'Help Center', href: '/help' },
      { name: 'Creator Guides', href: '/guides' },
      { name: 'API Documentation', href: '/docs' },
      { name: 'Case Studies', href: '/case-studies' }
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press', href: '/press' },
      { name: 'Contact', href: '/contact' },
      { name: 'Partners', href: '/partners' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'GDPR', href: '/gdpr' }
    ]
  }

  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/sparkplatform' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/sparkplatform' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/sparkplatform' },
    { name: 'YouTube', icon: Youtube, href: 'https://youtube.com/sparkplatform' },
    { name: 'Email', icon: Mail, href: 'mailto:hello@sparkplatform.tech' }
  ]

  return (
    <footer className="bg-[#0A0A0F] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white">SPARK</h3>
                <p className="text-gray-300 leading-relaxed">
                  The ultimate platform connecting brands with top creators through AI-powered voice 
                  generation and targeted marketing campaigns.
                </p>
              </div>
              
              {/* Social Links */}
              <div className="flex items-center space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gradient-to-r from-[#1C1C2D] to-[#2A2A3A] rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:from-[#8A2BE2] hover:to-[#FF1493] transition-all"
                    aria-label={social.name}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links Sections */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-white">Platform</h4>
              <ul className="space-y-3">
                {footerLinks.platform.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-white">Resources</h4>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-white">Company</h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-white">Legal</h4>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Signup - FIXED */}
        <div className="py-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h4 className="text-lg font-semibold text-white mb-2">Stay Updated</h4>
              <p className="text-gray-400">Get the latest updates, tips, and exclusive offers.</p>
            </div>
            
            <div className="flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-[#1C1C2D] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-[#8A2BE2] focus:outline-none min-w-[250px]"
                />
                <a 
                  href="/auth/signup" 
                  className="bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all cursor-pointer no-underline flex items-center justify-center"
                  style={{textDecoration: 'none'}}
                >
                  Subscribe
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © 2025 Spark Platform. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>🚀 Powered by AI</span>
              <span>🔒 SOC 2 Compliant</span>
              <span>🌍 Global Platform</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}