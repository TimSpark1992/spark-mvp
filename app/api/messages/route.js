// app/api/messages/route.js
import { NextResponse } from 'next/server'
import { getMessages, sendMessage, getConversation } from '@/lib/supabase'
import { sanitizeMessage } from '../../../lib/marketplace/anti-disintermediation.js'
import { sanitizeInput } from '../../../lib/xss-protection.js'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    console.log('📨 Fetching messages:', { conversationId, page, limit })
    
    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversation_id is required' },
        { status: 400 }
      )
    }
    
    const { data: messages, error } = await getMessages(conversationId, { page, limit })
    
    if (error) {
      console.error('❌ Error fetching messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }
    
    // Filter messages based on redaction status
    const processedMessages = messages?.map(message => ({
      ...message,
      content: message.redacted && message.original_content 
        ? '[Message contained contact information and has been redacted for platform safety]'
        : message.content,
      is_redacted: message.redacted || false,
      redaction_reason: message.redacted ? 'Contact information detected' : null
    })) || []
    
    console.log('✅ Messages fetched:', processedMessages.length)
    
    return NextResponse.json({
      messages: processedMessages,
      pagination: {
        current_page: page,
        per_page: limit,
        total_items: messages?.length || 0
      },
      success: true
    })
    
  } catch (error) {
    console.error('❌ Messages API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { conversation_id, sender_id, content } = body
    
    console.log('📨 Sending message:', { conversation_id, sender_id, contentLength: content?.length })
    
    // Validate required fields
    if (!conversation_id || !sender_id || !content) {
      return NextResponse.json(
        { error: 'conversation_id, sender_id, and content are required' },
        { status: 400 }
      )
    }
    
    // Verify conversation exists and user has access
    const { data: conversation, error: convError } = await getConversation(conversation_id)
    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }
    
    // Verify sender is part of the conversation
    if (sender_id !== conversation.brand_id && sender_id !== conversation.creator_id) {
      return NextResponse.json(
        { error: 'Sender not authorized for this conversation' },
        { status: 403 }
      )
    }
    
    // Basic XSS sanitization
    const xssSanitized = sanitizeInput(content, 'rich_text')
    
    // Advanced anti-disintermediation analysis
    const antiDisAnalysis = sanitizeMessage(xssSanitized, sender_id, conversation_id)
    
    console.log('🔍 Message analysis:', {
      isRedacted: antiDisAnalysis.isRedacted,
      riskScore: antiDisAnalysis.riskScore,
      shouldBlock: antiDisAnalysis.shouldBlock,
      violationCount: antiDisAnalysis.violations.length
    })
    
    // Block message if it's too risky
    if (antiDisAnalysis.shouldBlock) {
      console.log('🚫 Message blocked due to high risk:', antiDisAnalysis.violations)
      return NextResponse.json({
        error: 'Message blocked: Contains prohibited contact information or bypass attempts',
        reason: 'platform_safety',
        violations: antiDisAnalysis.violations.map(v => v.category),
        success: false
      }, { status: 400 })
    }
    
    // Prepare message data
    const messageData = {
      conversation_id,
      sender_id,
      content: antiDisAnalysis.sanitizedContent,
      redacted: antiDisAnalysis.isRedacted,
      original_content: antiDisAnalysis.isRedacted ? antiDisAnalysis.originalContent : null
    }
    
    // Send message to database
    const { data: message, error } = await sendMessage(messageData)
    
    if (error) {
      console.error('❌ Error sending message:', error)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }
    
    console.log('✅ Message sent:', message.id)
    
    // Return response with safety information
    const response = {
      message: {
        ...message,
        content: antiDisAnalysis.sanitizedContent,
        is_redacted: antiDisAnalysis.isRedacted
      },
      safety_info: {
        was_sanitized: antiDisAnalysis.isRedacted,
        risk_score: antiDisAnalysis.riskScore,
        requires_review: antiDisAnalysis.requiresReview,
        violation_categories: antiDisAnalysis.violations.map(v => v.category)
      },
      success: true
    }
    
    // Add warning if message was sanitized
    if (antiDisAnalysis.isRedacted) {
      response.warning = 'Your message contained contact information which has been redacted for platform safety. All communication must remain on the platform.'
    }
    
    return NextResponse.json(response, { status: 201 })
    
  } catch (error) {
    console.error('❌ Message sending error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}