'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Shield,
  BarChart3,
  Users,
  CreditCard,
  Settings,
  AlertTriangle,
  DollarSign,
  FileText,
  MessageSquare,
  Activity,
  Bell,
  LogOut,
  Menu,
  X,
  Home
} from 'lucide-react'
import { Text } from '@/components/ui/Typography'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: Home,
    description: 'Overview and key metrics'
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'User management and moderation'
  },
  {
    name: 'Payments',
    href: '/admin/payments',
    icon: CreditCard,
    description: 'Payment oversight and controls'
  },
  {
    name: 'Violations',
    href: '/admin/violations',
    icon: AlertTriangle,
    description: 'Safety and policy violations',
    badge: '7' // Dynamic badge for alerts
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Platform insights and reporting'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'Platform configuration'
  }
]

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const isActivePath = (href) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="min-h-screen bg-[#0F0F1A]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-[#1A1A2A] border-r border-white/10">
            <AdminSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex h-screen">
        {/* Desktop sidebar */}
        <div className="hidden lg:block w-64 bg-[#1A1A2A] border-r border-white/10">
          <AdminSidebar />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top header */}
          <header className="bg-[#1A1A2A] border-b border-white/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2"
                  variant="outline"
                  size="sm"
                >
                  <Menu className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-blue-400" />
                  <Text weight="semibold" size="lg">Admin Panel</Text>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="relative p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <Bell className="w-5 h-5 text-gray-400" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                </button>
                
                {/* Admin user */}
                <div className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <Text size="sm" weight="medium">Admin User</Text>
                    <Text size="xs" color="secondary">admin@spark.com</Text>
                  </div>
                </div>
                
                <Button variant="outline" size="sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

function AdminSidebar({ onClose }) {
  const pathname = usePathname()

  const isActivePath = (href) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <Text weight="semibold">Spark Admin</Text>
              <Text size="xs" color="secondary">Marketplace Control</Text>
            </div>
          </div>
          
          {onClose && (
            <Button onClick={onClose} size="sm" variant="ghost" className="lg:hidden">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigation.map((item) => {
            const isActive = isActivePath(item.href)
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-white'}`} />
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Text size="sm" weight={isActive ? 'medium' : 'normal'}>
                      {item.name}
                    </Text>
                    {item.badge && (
                      <Badge variant="outline" size="sm" className="text-red-400 border-red-400/30">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <Text size="xs" color="secondary" className="mt-0.5">
                    {item.description}
                  </Text>
                </div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Quick Stats */}
      <div className="p-4 border-t border-white/10">
        <Text size="sm" color="secondary" className="mb-3">Quick Stats</Text>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Active Users</span>
            <span className="text-green-400 font-medium">156</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Total Revenue</span>
            <span className="text-green-400 font-medium">$1,250</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Violations</span>
            <span className="text-red-400 font-medium">7</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Uptime</span>
            <span className="text-green-400 font-medium">99.8%</span>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <Text size="sm" className="text-green-400">All Systems Operational</Text>
        </div>
        <Text size="xs" color="secondary">
          Last updated: {new Date().toLocaleTimeString()}
        </Text>
      </div>
    </div>
  )
}