import { NextResponse } from 'next/server';
import { verifyAdminAccess } from '../../../../lib/auth-helpers.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Verify admin access
    const adminCheck = await verifyAdminAccess(request);
    if (!adminCheck.success) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    // Import supabase client with service role
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Build query
    let query = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        username,
        role,
        followers_count,
        categories,
        is_suspended,
        suspension_reason,
        warning_count,
        last_warning_at,
        created_at,
        updated_at,
        onboarding_completed
      `);

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`);
    }

    if (role) {
      query = query.eq('role', role);
    }

    if (status === 'active') {
      query = query.eq('is_suspended', false);
    } else if (status === 'suspended') {
      query = query.eq('is_suspended', true);
    } else if (status === 'warned') {
      query = query.gt('warning_count', 0);
    }

    // Apply sorting and pagination
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Get user statistics
    const { data: stats } = await supabase
      .from('profiles')
      .select('role, is_suspended, warning_count')
      .not('role', 'is', null);

    const userStats = {
      total_users: stats?.length || 0,
      creators: stats?.filter(u => u.role === 'creator').length || 0,
      brands: stats?.filter(u => u.role === 'brand').length || 0,
      admins: stats?.filter(u => u.role === 'admin').length || 0,
      suspended_users: stats?.filter(u => u.is_suspended === true).length || 0,
      warned_users: stats?.filter(u => (u.warning_count || 0) > 0).length || 0
    };

    return NextResponse.json({
      success: true,
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      },
      statistics: userStats
    });

  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    // Verify admin access
    const adminCheck = await verifyAdminAccess(request);
    if (!adminCheck.success) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    const { action, data } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    // Import supabase client with service role
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    let updateData = {};
    let logMessage = '';

    switch (action) {
      case 'suspend':
        updateData = {
          is_suspended: true,
          suspension_reason: data?.reason || 'Suspended by admin',
          suspended_at: new Date().toISOString()
        };
        logMessage = `User suspended: ${data?.reason || 'No reason provided'}`;
        break;

      case 'unsuspend':
        updateData = {
          is_suspended: false,
          suspension_reason: null,
          suspended_at: null
        };
        logMessage = 'User unsuspended';
        break;

      case 'warn':
        // Get current warning count
        const { data: currentUser } = await supabase
          .from('profiles')
          .select('warning_count')
          .eq('id', userId)
          .single();

        const currentWarnings = currentUser?.warning_count || 0;

        updateData = {
          warning_count: currentWarnings + 1,
          last_warning_at: new Date().toISOString()
        };
        logMessage = `User warned: ${data?.reason || 'No reason provided'}`;
        break;

      case 'change_role':
        if (!data?.role || !['creator', 'brand', 'admin'].includes(data.role)) {
          return NextResponse.json(
            { error: 'Valid role is required' },
            { status: 400 }
          );
        }
        updateData = {
          role: data.role
        };
        logMessage = `Role changed to: ${data.role}`;
        break;

      case 'reset_warnings':
        updateData = {
          warning_count: 0,
          last_warning_at: null
        };
        logMessage = 'Warning count reset';
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update user
    const { data: updatedUser, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Log admin action (this would typically go to an admin_actions table)
    console.log(`Admin action: ${logMessage} for user ${userId}`);

    return NextResponse.json({
      success: true,
      user: updatedUser,
      action: action,
      message: logMessage
    });

  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}