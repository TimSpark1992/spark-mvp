// app/api/fix-user-role/route.js
// Emergency endpoint to fix user role issues
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase environment variables not configured')
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET(request) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({
        error: 'Database service unavailable - Supabase not configured'
      }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const newRole = searchParams.get('role') || 'brand'

    if (!email) {
      return NextResponse.json({
        error: 'Email parameter required. Usage: /api/fix-user-role?email=user@example.com&role=brand'
      }, { status: 400 })
    }

    // Find user by email
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)

    if (fetchError) {
      console.error('Error fetching user profile:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        error: `No profile found for email: ${email}`
      }, { status: 404 })
    }

    const profile = profiles[0]
    console.log('Current profile:', profile)

    // Update the user's role
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()

    if (updateError) {
      console.error('Error updating user role:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated role for ${email}`,
      before: {
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name
      },
      after: updatedProfile[0]
    })

  } catch (error) {
    console.error('Fix user role API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}