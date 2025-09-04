// app/api/files/upload/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Create Supabase client with environment variable checks
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL  
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase environment variables not configured for file upload')
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        error: 'File upload service unavailable - Supabase not configured'
      }, { status: 503 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const bucket = formData.get('bucket') || 'media-kits'
    const userId = formData.get('user_id')

    if (!file) {
      return NextResponse.json({
        error: 'No file provided'
      }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({
        error: 'User ID is required'
      }, { status: 400 })
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'File size exceeds 10MB limit'
      }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf',
      'video/mp4',
      'video/quicktime',
      'video/webm'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Allowed: images, PDFs, and videos'
      }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${uuidv4()}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('❌ Storage upload error:', error)
      return NextResponse.json({
        error: error.message
      }, { status: 500 })
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      file: {
        path: data.path,
        url: publicUrlData.publicUrl,
        size: file.size,
        type: file.type,
        name: file.name
      }
    })

  } catch (error) {
    console.error('❌ File upload API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}