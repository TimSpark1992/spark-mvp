// app/api/check-rate-cards-table/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    console.log('🔍 Checking rate_cards table...')
    
    // Try to query the table to see if it exists
    const { data, error } = await supabase
      .from('rate_cards')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Table check error:', error)
      return NextResponse.json({
        tableExists: false,
        error: error,
        message: 'Rate cards table does not exist or is not accessible',
        recommendation: 'Please run the migration SQL in Supabase dashboard'
      })
    }
    
    console.log('✅ Rate cards table exists and is accessible')
    
    return NextResponse.json({
      tableExists: true,
      message: 'Rate cards table exists and is accessible',
      sampleData: data
    })
    
  } catch (error) {
    console.error('❌ Check error:', error)
    return NextResponse.json({
      tableExists: false,
      error: error.message,
      message: 'Failed to check rate cards table'
    }, { status: 500 })
  }
}