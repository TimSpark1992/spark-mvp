'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/shared/Layout'
import { Container, Section } from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Heading, Text } from '@/components/ui/Typography'
import { getUserConversations } from '@/lib/supabase'
import { 
  MessageCircle,
  ArrowRight,
  Clock,
  Briefcase
} from 'lucide-react'
import Link from 'next/link'

export default function MessagesPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadConversations = async () => {
      if (!profile?.id) {
        console.log('⚠️ No profile ID available for messages')
        setLoading(false)
        return
      }

      // Set timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('⚠️ Messages loading timeout reached, forcing completion')
        setLoading(false)
      }, 10000) // 10 second timeout

      try {
        console.log('🔄 Loading conversations for user:', profile.id)
        const { data, error } = await getUserConversations(profile.id)
        
        if (error) {
          console.error('❌ Error loading conversations:', error)
          throw new Error(error.message)
        }
        
        console.log('✅ Conversations loaded:', data?.length || 0)
        setConversations(data || [])
      } catch (error) {
        console.error('❌ Error loading conversations:', error)
        // Don't leave user in infinite loading state
        setConversations([])
      } finally {
        clearTimeout(timeoutId) // Clear timeout since we completed
        setLoading(false)
        console.log('🏁 Messages loading complete')
      }
    }

    console.log('🚀 Starting messages load, profile:', profile?.id)
    loadConversations()
  }, [profile?.id])

  const getOtherParticipant = (conversation) => {
    if (profile.role === 'brand') {
      return {
        name: conversation.creator?.full_name,
        picture: conversation.creator?.profile_picture,
        type: 'creator'
      }
    } else {
      return {
        name: conversation.brand?.company_name || conversation.brand?.full_name,
        picture: conversation.brand?.profile_picture,
        type: 'brand'
      }
    }
  }

  if (loading) {
    return (
      <Layout variant="app">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8A2BE2]"></div>
        </div>
      </Layout>
    )
  }

  return (
    <ProtectedRoute>
      <Layout variant="app">
        <Section padding="lg">
          <Container>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <Heading level={1} size="3xl">Messages</Heading>
                <Text size="lg" color="secondary">
                  Communicate with your {profile?.role === 'brand' ? 'creators' : 'brand partners'}
                </Text>
              </div>
              
              <div className="text-right">
                <Text size="sm" color="secondary">Active Conversations</Text>
                <Heading level={3} size="2xl">{conversations.length}</Heading>
              </div>
            </div>

            {/* Conversations List */}
            {conversations.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#2A2A3A] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-gray-500" />
                  </div>
                  <Heading level={3} size="xl" className="mb-2">No conversations yet</Heading>
                  <Text color="secondary" className="mb-6">
                    {profile?.role === 'brand' 
                      ? 'Start communicating with creators when they apply to your campaigns.'
                      : 'Messages will appear here when you apply to campaigns and brands want to connect.'
                    }
                  </Text>
                  <Link href={profile?.role === 'brand' ? '/brand/dashboard' : '/creator/campaigns'}>
                    <Button>
                      {profile?.role === 'brand' ? 'View Campaigns' : 'Browse Campaigns'}
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {conversations.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation)
                  
                  return (
                    <Link 
                      key={conversation.id} 
                      href={`/messages/${conversation.id}`}
                    >
                      <Card className="p-6 hover:bg-[#2A2A3A]/50 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar 
                              name={otherParticipant.name}
                              src={otherParticipant.picture}
                              size="lg"
                            />
                            <div>
                              <Heading level={4} size="lg" className="mb-1">
                                {otherParticipant.name}
                              </Heading>
                              <div className="flex items-center gap-2 mb-2">
                                <Briefcase className="w-4 h-4 text-gray-400" />
                                <Text size="sm" color="secondary">
                                  {conversation.campaigns?.title}
                                </Text>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>
                                  Last updated {new Date(conversation.updated_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <ArrowRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </Container>
        </Section>
      </Layout>
    </ProtectedRoute>
  )
}