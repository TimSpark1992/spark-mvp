// app/api/admin/violations/[id]/route.js
import { NextResponse } from 'next/server'
import { verifyAdminAccess } from '../../../../../lib/auth-helpers.js'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request, { params }) {
  try {
    // Verify admin access
    const adminCheck = await verifyAdminAccess(request)
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { id } = params
    
    console.log('👨‍💼 Admin fetching violation details:', id)
    
    if (!id) {
      return NextResponse.json(
        { error: 'Violation ID is required' },
        { status: 400 }
      )
    }
    
    // Get violation details with relationships
    const { data: violation, error } = await supabase
      .from('violation_logs')
      .select(`
        *,
        sender:sender_id(id, full_name, email, role, warning_count, is_suspended),
        conversation:conversations(
          id,
          brand:brand_id(id, full_name, company_name),
          creator:creator_id(id, full_name),
          campaign:campaigns(id, title, description)
        ),
        reviewed_by_user:reviewed_by(id, full_name, email)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('❌ Error fetching violation:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Violation not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch violation' },
        { status: 500 }
      )
    }
    
    console.log('✅ Violation details fetched for admin:', violation.id)
    
    return NextResponse.json({
      violation,
      success: true
    })
    
  } catch (error) {
    console.error('❌ Admin violation details API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request, { params }) {
  try {
    // Verify admin access
    const adminCheck = await verifyAdminAccess(request)
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { id } = params
    const body = await request.json()
    const { action, admin_notes } = body
    
    console.log('👨‍💼 Admin updating violation:', { id, action, admin_notes })
    
    if (!id) {
      return NextResponse.json(
        { error: 'Violation ID is required' },
        { status: 400 }
      )
    }
    
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
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
      .eq('id', id)
      .select(`
        *,
        sender:sender_id(id, full_name, email, role)
      `)
      .single()
    
    if (error) {
      console.error('❌ Error updating violation:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Violation not found' },
          { status: 404 }
        )
      }
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
        // Increment warning count
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('warning_count')
          .eq('id', violation.sender_id)
          .single()
        
        profileUpdate.warning_count = (currentProfile?.warning_count || 0) + 1
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

export async function DELETE(request, { params }) {
  try {
    // Verify admin access
    const adminCheck = await verifyAdminAccess(request)
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { id } = params
    
    console.log('👨‍💼 Admin deleting violation:', id)
    
    if (!id) {
      return NextResponse.json(
        { error: 'Violation ID is required' },
        { status: 400 }
      )
    }
    
    // Soft delete by marking as dismissed
    const { data: violation, error } = await supabase
      .from('violation_logs')
      .update({
        admin_action: 'dismissed',
        admin_notes: 'Violation dismissed by admin',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminCheck.user.id
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error deleting violation:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Violation not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to delete violation' },
        { status: 500 }
      )
    }
    
    console.log('✅ Violation dismissed by admin:', violation.id)
    
    return NextResponse.json({
      message: 'Violation dismissed successfully',
      success: true
    })
    
  } catch (error) {
    console.error('❌ Admin violation delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}