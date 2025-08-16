// app/api/files/upload/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { shouldGateFileSharing, validateExternalLink } from '@/lib/marketplace/anti-disintermediation'
import { getOffer } from '@/lib/supabase'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const conversationId = formData.get('conversation_id')
    const senderId = formData.get('sender_id')
    const offerId = formData.get('offer_id')
    
    console.log('📁 File upload request:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      conversationId,
      senderId,
      offerId
    })
    
    // Validate required fields
    if (!file || !conversationId || !senderId) {
      return NextResponse.json(
        { error: 'file, conversation_id, and sender_id are required' },
        { status: 400 }
      )
    }
    
    // Get offer context for gating decision
    let offerContext = {}
    if (offerId) {
      const { data: offer, error: offerError } = await getOffer(offerId)
      if (!offerError && offer) {
        offerContext = {
          offerStatus: offer.status,
          isPaymentComplete: ['paid_escrow', 'in_progress', 'submitted', 'approved', 'released', 'completed'].includes(offer.status)
        }
      }
    }
    
    // Check if file sharing should be gated
    const gatingDecision = shouldGateFileSharing(file.name, file.type, offerContext)
    
    console.log('🚪 File gating decision:', gatingDecision)
    
    // Block file if gating rules are violated
    if (gatingDecision.shouldGate) {
      return NextResponse.json({
        error: 'File sharing not allowed',
        reason: 'File sharing is restricted until payment is completed',
        risks: gatingDecision.risks,
        allowed_after: 'payment_completed',
        success: false
      }, { status: 403 })
    }
    
    // Validate file type and size
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/webm',
      'application/pdf',
      'text/plain'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'File type not allowed',
        allowed_types: allowedTypes,
        success: false
      }, { status: 400 })
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'File too large',
        max_size: maxSize,
        current_size: file.size,
        success: false
      }, { status: 400 })
    }
    
    // Generate secure filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const secureFileName = `conversation_${conversationId}_${timestamp}_${randomId}.${fileExtension}`
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('conversation-files')
      .upload(secureFileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('❌ File upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('conversation-files')
      .getPublicUrl(secureFileName)
    
    // Store file record in database
    const { data: fileRecord, error: dbError } = await supabase
      .from('conversation_files')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        offer_id: offerId,
        original_filename: file.name,
        stored_filename: secureFileName,
        file_type: file.type,
        file_size: file.size,
        public_url: publicUrl,
        is_gated: false,
        risk_score: gatingDecision.riskScore,
        upload_ip: request.headers.get('x-forwarded-for') || 'unknown'
      })
      .select()
      .single()
    
    if (dbError) {
      console.error('❌ Database error storing file record:', dbError)
      
      // Clean up uploaded file if database insert failed
      await supabase.storage
        .from('conversation-files')
        .remove([secureFileName])
      
      return NextResponse.json(
        { error: 'Failed to store file record' },
        { status: 500 }
      )
    }
    
    console.log('✅ File uploaded successfully:', fileRecord.id)
    
    return NextResponse.json({
      file: {
        id: fileRecord.id,
        filename: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size,
        uploaded_at: fileRecord.created_at
      },
      safety_info: {
        risk_score: gatingDecision.riskScore,
        risks: gatingDecision.risks,
        requires_approval: gatingDecision.requiresApproval
      },
      success: true
    }, { status: 201 })
    
  } catch (error) {
    console.error('❌ File upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}