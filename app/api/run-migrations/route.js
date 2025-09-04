// app/api/run-migrations/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with environment variable checks
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase environment variables not configured for migrations')
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Database service unavailable - Supabase not configured'
      }, { status: 503 })
    }

    const body = await request.json()
    const { sql } = body

    if (!sql) {
      return NextResponse.json({
        success: false,
        error: 'SQL statement is required'
      }, { status: 400 })
    }

    console.log('🔄 Running migration SQL...')

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('❌ Migration error:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    console.log('✅ Migration completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      data
    })

  } catch (error) {
    console.error('❌ Migration execution error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}