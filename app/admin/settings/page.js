'use client'

import { useState, useEffect } from 'react'
import { Container } from '@/components/shared/Container'
import Layout from '@/components/shared/Layout'
import { Heading, Text } from '@/components/ui/Typography'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Settings,
  DollarSign,
  Shield,
  Bell,
  Database,
  Mail,
  Key,
  Zap,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Globe,
  Lock,
  Users,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    platform: {
      platform_fee_pct: 20,
      auto_release_days: 7,
      fallback_manual_payouts: false,
      relay_enabled: false,
      max_file_size_mb: 10,
      allowed_file_types: ['image/jpeg', 'image/png', 'video/mp4']
    },
    security: {
      violation_threshold: 3,
      auto_suspend_enabled: true,
      contact_detection_enabled: true,
      file_gating_enabled: true,
      message_retention_days: 365,
      admin_action_logging: true
    },
    notifications: {
      high_risk_violations: true,
      payment_failures: true,
      large_transactions: true,
      user_suspensions: true,
      daily_reports: true,
      email_notifications: true,
      slack_webhook_url: '',
      notification_threshold_amount: 100000
    },
    api: {
      stripe_webhook_secret: '',
      rate_limit_per_minute: 100,
      api_logging_enabled: true,
      cors_enabled: true,
      allowed_origins: ['https://spark-marketplace.com']
    }
  })
  
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [showSecrets, setShowSecrets] = useState({})
  const [testResults, setTestResults] = useState({})

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // Mock API call - in real implementation, this would call /api/admin/settings
      console.log('Loading platform settings...')
      
      // Settings are already initialized with mock data
      setLastSaved(new Date(Date.now() - 1000 * 60 * 15)) // 15 minutes ago
    } catch (error) {
      console.error('❌ Error loading settings:', error)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      
      // Mock API call - in real implementation, this would call /api/admin/settings
      console.log('Saving platform settings:', settings)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setLastSaved(new Date())
      
    } catch (error) {
      console.error('❌ Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const testIntegration = async (integration) => {
    try {
      setTestResults({ ...testResults, [integration]: 'testing' })
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const success = Math.random() > 0.3 // 70% success rate for demo
      setTestResults({ 
        ...testResults, 
        [integration]: success ? 'success' : 'error' 
      })
      
    } catch (error) {
      setTestResults({ ...testResults, [integration]: 'error' })
    }
  }

  const updateSetting = (section, key, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value
      }
    })
  }

  const toggleSecret = (key) => {
    setShowSecrets({ ...showSecrets, [key]: !showSecrets[key] })
  }

  const getTestIcon = (status) => {
    switch (status) {
      case 'testing': return <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-400" />
      default: return <Info className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <Layout>
      <Container className="py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Heading level={1} size="2xl" className="mb-2">
              Platform Settings
            </Heading>
            <Text color="secondary">
              Configure platform-wide settings and integrations
            </Text>
          </div>
          
          <div className="flex items-center gap-3">
            {lastSaved && (
              <Text size="sm" color="secondary">
                Last saved: {lastSaved.toLocaleTimeString()}
              </Text>
            )}
            
            <Button onClick={loadSettings} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload
            </Button>
            
            <Button onClick={saveSettings} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Platform Settings */}
          <Card>
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-400" />
                <Heading level={3} size="lg">Platform Settings</Heading>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Platform Fee Percentage
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={settings.platform.platform_fee_pct}
                    onChange={(e) => updateSetting('platform', 'platform_fee_pct', parseInt(e.target.value))}
                    className="flex-1 px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg"
                  />
                  <Text size="sm" color="secondary">%</Text>
                </div>
                <Text size="xs" color="secondary" className="mt-1">
                  Commission charged on all transactions
                </Text>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Auto Release Days
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.platform.auto_release_days}
                  onChange={(e) => updateSetting('platform', 'auto_release_days', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg"
                />
                <Text size="xs" color="secondary" className="mt-1">
                  Days to automatically release payments
                </Text>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Max File Size (MB)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.platform.max_file_size_mb}
                  onChange={(e) => updateSetting('platform', 'max_file_size_mb', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Text size="sm">Fallback Manual Payouts</Text>
                  <button
                    onClick={() => updateSetting('platform', 'fallback_manual_payouts', !settings.platform.fallback_manual_payouts)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.platform.fallback_manual_payouts ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.platform.fallback_manual_payouts ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <Text size="sm">Enable Relay System</Text>
                  <button
                    onClick={() => updateSetting('platform', 'relay_enabled', !settings.platform.relay_enabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.platform.relay_enabled ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.platform.relay_enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Security Settings */}
          <Card>
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-red-400" />
                <Heading level={3} size="lg">Security & Safety</Heading>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Violation Threshold for Auto-Suspension
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.security.violation_threshold}
                  onChange={(e) => updateSetting('security', 'violation_threshold', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Message Retention (Days)
                </label>
                <input
                  type="number"
                  min="30"
                  max="2555"
                  value={settings.security.message_retention_days}
                  onChange={(e) => updateSetting('security', 'message_retention_days', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Text size="sm">Auto-Suspend Users</Text>
                  <button
                    onClick={() => updateSetting('security', 'auto_suspend_enabled', !settings.security.auto_suspend_enabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.security.auto_suspend_enabled ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.security.auto_suspend_enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <Text size="sm">Contact Detection</Text>
                  <button
                    onClick={() => updateSetting('security', 'contact_detection_enabled', !settings.security.contact_detection_enabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.security.contact_detection_enabled ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.security.contact_detection_enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <Text size="sm">File Gating</Text>
                  <button
                    onClick={() => updateSetting('security', 'file_gating_enabled', !settings.security.file_gating_enabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.security.file_gating_enabled ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.security.file_gating_enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <Text size="sm">Admin Action Logging</Text>
                  <button
                    onClick={() => updateSetting('security', 'admin_action_logging', !settings.security.admin_action_logging)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.security.admin_action_logging ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.security.admin_action_logging ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card>
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-yellow-400" />
                <Heading level={3} size="lg">Notifications</Heading>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Large Transaction Threshold (cents)
                </label>
                <input
                  type="number"
                  min="1000"
                  value={settings.notifications.notification_threshold_amount}
                  onChange={(e) => updateSetting('notifications', 'notification_threshold_amount', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Slack Webhook URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type={showSecrets.slack ? 'text' : 'password'}
                    value={settings.notifications.slack_webhook_url}
                    onChange={(e) => updateSetting('notifications', 'slack_webhook_url', e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="flex-1 px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleSecret('slack')}
                  >
                    {showSecrets.slack ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => testIntegration('slack')}
                    disabled={!settings.notifications.slack_webhook_url}
                  >
                    {getTestIcon(testResults.slack)}
                    Test
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Text size="sm">High-Risk Violations</Text>
                  <button
                    onClick={() => updateSetting('notifications', 'high_risk_violations', !settings.notifications.high_risk_violations)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.notifications.high_risk_violations ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.notifications.high_risk_violations ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <Text size="sm">Payment Failures</Text>
                  <button
                    onClick={() => updateSetting('notifications', 'payment_failures', !settings.notifications.payment_failures)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.notifications.payment_failures ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.notifications.payment_failures ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <Text size="sm">Large Transactions</Text>
                  <button
                    onClick={() => updateSetting('notifications', 'large_transactions', !settings.notifications.large_transactions)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.notifications.large_transactions ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.notifications.large_transactions ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <Text size="sm">Daily Reports</Text>
                  <button
                    onClick={() => updateSetting('notifications', 'daily_reports', !settings.notifications.daily_reports)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.notifications.daily_reports ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.notifications.daily_reports ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* API & Integration Settings */}
          <Card>
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-blue-400" />
                <Heading level={3} size="lg">API & Integrations</Heading>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Stripe Webhook Secret
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type={showSecrets.stripe ? 'text' : 'password'}
                    value={settings.api.stripe_webhook_secret}
                    onChange={(e) => updateSetting('api', 'stripe_webhook_secret', e.target.value)}
                    placeholder="whsec_..."
                    className="flex-1 px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleSecret('stripe')}
                  >
                    {showSecrets.stripe ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => testIntegration('stripe')}
                    disabled={!settings.api.stripe_webhook_secret}
                  >
                    {getTestIcon(testResults.stripe)}
                    Test
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Rate Limit (per minute)
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={settings.api.rate_limit_per_minute}
                  onChange={(e) => updateSetting('api', 'rate_limit_per_minute', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-[#2A2A3A] border border-white/10 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Text size="sm">API Logging</Text>
                  <button
                    onClick={() => updateSetting('api', 'api_logging_enabled', !settings.api.api_logging_enabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.api.api_logging_enabled ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.api.api_logging_enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <Text size="sm">CORS Enabled</Text>
                  <button
                    onClick={() => updateSetting('api', 'cors_enabled', !settings.api.cors_enabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.api.cors_enabled ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.api.cors_enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Save Confirmation */}
        {saving && (
          <Card className="mt-8 p-4 bg-blue-900/20 border border-blue-500/20">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
              <Text className="text-blue-400">Saving platform settings...</Text>
            </div>
          </Card>
        )}
      </Container>
    </Layout>
  )
}