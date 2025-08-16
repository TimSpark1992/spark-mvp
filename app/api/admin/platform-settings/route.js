// app/api/admin/platform-settings/route.js
import { NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/auth-helpers'
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
    
    console.log('👨‍💼 Admin fetching platform settings')
    
    // Get platform settings
    const { data: settings, error } = await supabase
      .from('platform_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      console.error('❌ Error fetching platform settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch platform settings' },
        { status: 500 }
      )
    }
    
    console.log('✅ Platform settings fetched')
    
    return NextResponse.json({
      settings,
      success: true
    })
    
  } catch (error) {
    console.error('❌ Platform settings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
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
    const { 
      platform_fee_pct, 
      auto_release_days, 
      relay_enabled, 
      fallback_manual_payouts 
    } = body
    
    console.log('👨‍💼 Admin updating platform settings:', body)
    
    // Validate settings
    if (platform_fee_pct !== undefined) {
      if (typeof platform_fee_pct !== 'number' || platform_fee_pct < 0 || platform_fee_pct > 50) {
        return NextResponse.json(
          { error: 'Platform fee must be between 0 and 50 percent' },
          { status: 400 }
        )
      }
    }
    
    if (auto_release_days !== undefined) {
      if (typeof auto_release_days !== 'number' || auto_release_days < 1) {
        return NextResponse.json(
          { error: 'Auto release days must be at least 1' },
          { status: 400 }
        )
      }
    }
    
    // Update platform settings
    const updateData = {
      updated_at: new Date().toISOString()
    }
    
    if (platform_fee_pct !== undefined) updateData.platform_fee_pct = platform_fee_pct
    if (auto_release_days !== undefined) updateData.auto_release_days = auto_release_days
    if (relay_enabled !== undefined) updateData.relay_enabled = relay_enabled
    if (fallback_manual_payouts !== undefined) updateData.fallback_manual_payouts = fallback_manual_payouts
    
    // Get current settings first
    const { data: currentSettings } = await supabase
      .from('platform_settings')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    
    if (currentSettings) {
      // Update existing settings
      const { data: settings, error } = await supabase
        .from('platform_settings')
        .update(updateData)
        .eq('id', currentSettings.id)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Error updating platform settings:', error)
        return NextResponse.json(
          { error: 'Failed to update platform settings' },
          { status: 500 }
        )
      }
      
      console.log('✅ Platform settings updated:', settings.id)
      
      return NextResponse.json({
        settings,
        message: 'Platform settings updated successfully',
        success: true
      })
    } else {
      // Create new settings record
      const { data: settings, error } = await supabase
        .from('platform_settings')
        .insert(updateData)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Error creating platform settings:', error)
        return NextResponse.json(
          { error: 'Failed to create platform settings' },
          { status: 500 }
        )
      }
      
      console.log('✅ Platform settings created:', settings.id)
      
      return NextResponse.json({
        settings,
        message: 'Platform settings created successfully',
        success: true
      }, { status: 201 })
    }
    
  } catch (error) {
    console.error('❌ Platform settings update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}