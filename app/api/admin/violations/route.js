// app/api/admin/violations/route.js
import { NextResponse } from 'next/server'
import { verifyAdminAccess } from '../../../../lib/auth-helpers.js'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    // Verify admin access
    const adminCheck = await verifyAdminAccess(request)
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const riskLevel = searchParams.get('risk_level')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    
    console.log('👨‍💼 Admin fetching violations:', { riskLevel, page, limit, startDate, endDate })
    
    // Build query
    let query = supabase
      .from('violation_logs')
      .select(`
        *,
        sender:sender_id(id, full_name, email, role),
        conversation:conversations(
          id,
          brand:brand_id(id, full_name, company_name),
          creator:creator_id(id, full_name),
          campaign:campaigns(id, title)
        )
      `)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (riskLevel) {
      const minRisk = parseInt(riskLevel)
      query = query.gte('risk_score', minRisk)
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit
    query = query.range(startIndex, startIndex + limit - 1)
    
    const { data: violations, error } = await query
    
    if (error) {
      console.error('❌ Error fetching violations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch violations' },
        { status: 500 }
      )
    }
    
    // Get violation statistics
    const { data: stats, error: statsError } = await supabase
      .from('violation_logs')
      .select('risk_score, created_at')
    
    let statistics = {
      total_violations: 0,
      high_risk_count: 0,
      violations_today: 0,
      violations_this_week: 0
    }
    
    if (!statsError && stats) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      statistics = {
        total_violations: stats.length,
        high_risk_count: stats.filter(v => v.risk_score >= 3).length,
        violations_today: stats.filter(v => new Date(v.created_at) >= today).length,
        violations_this_week: stats.filter(v => new Date(v.created_at) >= weekAgo).length
      }
    }
    
    console.log('✅ Violations fetched for admin:', violations?.length || 0)
    
    return NextResponse.json({
      violations: violations || [],
      statistics,
      pagination: {
        current_page: page,
        per_page: limit,
        total_items: violations?.length || 0
      },
      success: true
    })
    
  } catch (error) {
    console.error('❌ Admin violations API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request) {
  try {
    // Verify admin access
    const adminCheck = await verifyAdminAccess(request)
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { violation_id, action, admin_notes } = body
    
    console.log('👨‍💼 Admin violation action:', { violation_id, action, admin_notes })
    
    if (!violation_id || !action) {
      return NextResponse.json(
        { error: 'violation_id and action are required' },
        { status: 400 }
      )
    }
    
    const validActions = ['reviewed', 'dismissed', 'escalated', 'user_warned', 'user_suspended']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
    
    // Update violation record
    const { data: violation, error } = await supabase
      .from('violation_logs')
      .update({
        admin_action: action,
        admin_notes: admin_notes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminCheck.user.id
      })
      .eq('id', violation_id)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error updating violation:', error)
      return NextResponse.json(
        { error: 'Failed to update violation' },
        { status: 500 }
      )
    }
    
    console.log('✅ Violation updated by admin:', violation.id)
    
    // If user is being warned or suspended, update their profile
    if (action === 'user_warned' || action === 'user_suspended') {
      const profileUpdate = {
        updated_at: new Date().toISOString()
      }
      
      if (action === 'user_warned') {
        profileUpdate.warning_count = supabase.raw('COALESCE(warning_count, 0) + 1')
        profileUpdate.last_warning_at = new Date().toISOString()
      } else if (action === 'user_suspended') {
        profileUpdate.is_suspended = true
        profileUpdate.suspended_at = new Date().toISOString()
        profileUpdate.suspension_reason = admin_notes || 'Platform policy violation'
      }
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', violation.sender_id)
      
      if (profileError) {
        console.error('❌ Error updating user profile:', profileError)
      }
    }
    
    return NextResponse.json({
      violation,
      message: `Violation ${action} successfully`,
      success: true
    })
    
  } catch (error) {
    console.error('❌ Admin violation update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}