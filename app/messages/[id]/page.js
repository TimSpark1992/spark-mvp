'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/shared/Layout'
import { Container, Section } from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Heading, Text } from '@/components/ui/Typography'
import { 
  getConversationMessages, 
  createMessage, 
  getUserConversations 
} from '@/lib/supabase'
import { sanitizeFieldValue } from '@/lib/xss-protection'
import { 
  ArrowLeft,
  Send,
  Briefcase,
  Clock
} from 'lucide-react'
import Link from 'next/link'

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useAuth()
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const loadConversationAndMessages = async () => {
      if (!profile?.id || !params.id) return

      try {
        // Get conversation details
        const { data: conversationsData, error: convError } = await getUserConversations(profile.id)
        if (convError) throw new Error(convError.message)

        const foundConversation = conversationsData?.find(c => c.id === params.id)
        if (!foundConversation) {
          router.push('/messages')
          return
        }
        setConversation(foundConversation)

        // Get messages
        const { data: messagesData, error: msgError } = await getConversationMessages(params.id)
        if (msgError) throw new Error(msgError.message)
        setMessages(messagesData || [])

      } catch (error) {
        console.error('Error loading conversation:', error)
        router.push('/messages')
      } finally {
        setLoading(false)
      }
    }

    loadConversationAndMessages()
  }, [params.id, profile?.id, router])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !conversation?.id || sendingMessage) return

    setSendingMessage(true)
    const messageContent = sanitizeFieldValue('message', newMessage.trim())

    try {
      const { data, error } = await createMessage({
        conversation_id: conversation.id,
        sender_id: profile.id,
        content: messageContent
      })

      if (error) throw new Error(error.message)

      // Add message to local state
      const newMsg = {
        ...data[0],
        sender: {
          full_name: profile.full_name,
          profile_picture: profile.profile_picture
        }
      }
      setMessages(prev => [...prev, newMsg])
      setNewMessage('')

    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const getOtherParticipant = () => {
    if (!conversation) return null
    
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

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
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

  if (!conversation) {
    return (
      <Layout variant="app">
        <Section padding="lg">
          <Container>
            <div className="text-center">
              <Heading level={2}>Conversation not found</Heading>
              <Link href="/messages">
                <Button className="mt-4">Back to Messages</Button>
              </Link>
            </div>
          </Container>
        </Section>
      </Layout>
    )
  }

  const otherParticipant = getOtherParticipant()

  return (
    <ProtectedRoute>
      <Layout variant="app">
        <Section padding="lg">
          <Container>
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Link href="/messages">
                    <Button variant="ghost" size="sm">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Messages
                    </Button>
                  </Link>
                  
                  <div className="flex items-center gap-3">
                    <Avatar 
                      name={otherParticipant?.name}
                      src={otherParticipant?.picture}
                      size="md"
                    />
                    <div>
                      <Heading level={3} size="lg" className="mb-1">
                        {otherParticipant?.name}
                      </Heading>
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <Text size="sm" color="secondary">
                          {conversation.campaigns?.title}
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <Card className="flex flex-col h-[600px]">
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <Text color="secondary">
                        No messages yet. Start the conversation!
                      </Text>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.sender_id === profile.id
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex gap-3 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                            <Avatar 
                              name={message.sender?.full_name}
                              src={message.sender?.profile_picture}
                              size="sm"
                            />
                            <div>
                              <div className={`rounded-2xl px-4 py-3 ${
                                isOwnMessage 
                                  ? 'bg-gradient-to-r from-[#8A2BE2] to-[#FF1493] text-white' 
                                  : 'bg-[#2A2A3A] text-white'
                              }`}>
                                <Text size="sm" className="whitespace-pre-wrap">
                                  {message.content}
                                </Text>
                              </div>
                              <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                                isOwnMessage ? 'justify-end' : 'justify-start'
                              }`}>
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(message.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-white/10 p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full"
                        disabled={sendingMessage}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={!newMessage.trim() || sendingMessage}
                      className="px-6"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {sendingMessage ? 'Sending...' : 'Send'}
                    </Button>
                  </form>
                </div>
              </Card>
            </div>
          </Container>
        </Section>
      </Layout>
    </ProtectedRoute>
  )
}