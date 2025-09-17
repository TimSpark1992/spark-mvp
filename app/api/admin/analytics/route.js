import { NextResponse } from 'next/server';
import { verifyAdminAccess } from '../../../../lib/auth-helpers.js';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

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
    const timeframe = searchParams.get('timeframe') || '30d'; // 7d, 30d, 90d, 1y
    const metrics = searchParams.get('metrics')?.split(',') || ['all'];

    // Import supabase client with service role with environment checks
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Supabase environment variables not configured for admin analytics');
      return NextResponse.json(
        { error: 'Database service unavailable' },
        { status: 503 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const analytics = {};

    // User Metrics
    if (metrics.includes('all') || metrics.includes('users')) {
      try {
        const { data: allUsers } = await supabase
          .from('profiles')
          .select('id, role, created_at, is_suspended, warning_count')
          .not('role', 'is', null);

        const { data: newUsers } = await supabase
          .from('profiles')
          .select('id, role, created_at')
          .gte('created_at', startDate.toISOString())
          .not('role', 'is', null);

        analytics.user_metrics = {
          total_users: allUsers?.length || 0,
          new_users_period: newUsers?.length || 0,
          creators: allUsers?.filter(u => u.role === 'creator').length || 0,
          brands: allUsers?.filter(u => u.role === 'brand').length || 0,
          admins: allUsers?.filter(u => u.role === 'admin').length || 0,
          suspended_users: allUsers?.filter(u => u.is_suspended === true).length || 0,
          warned_users: allUsers?.filter(u => (u.warning_count || 0) > 0).length || 0,
          new_creators_period: newUsers?.filter(u => u.role === 'creator').length || 0,
          new_brands_period: newUsers?.filter(u => u.role === 'brand').length || 0
        };
      } catch (error) {
        console.error('Error fetching user metrics:', error);
        analytics.user_metrics = { error: 'Failed to fetch user metrics' };
      }
    }

    // Campaign Metrics
    if (metrics.includes('all') || metrics.includes('campaigns')) {
      try {
        const { data: allCampaigns } = await supabase
          .from('campaigns')
          .select('id, status, budget_cents, currency, created_at');

        const { data: newCampaigns } = await supabase
          .from('campaigns')
          .select('id, status, budget_cents, currency, created_at')
          .gte('created_at', startDate.toISOString());

        analytics.campaign_metrics = {
          total_campaigns: allCampaigns?.length || 0,
          new_campaigns_period: newCampaigns?.length || 0,
          active_campaigns: allCampaigns?.filter(c => c.status === 'active').length || 0,
          completed_campaigns: allCampaigns?.filter(c => c.status === 'completed').length || 0,
          total_campaign_budget: allCampaigns?.reduce((sum, c) => sum + (c.budget_cents || 0), 0) || 0,
          new_campaign_budget_period: newCampaigns?.reduce((sum, c) => sum + (c.budget_cents || 0), 0) || 0
        };
      } catch (error) {
        console.error('Error fetching campaign metrics:', error);
        analytics.campaign_metrics = { error: 'Failed to fetch campaign metrics' };
      }
    }

    // Financial Metrics
    if (metrics.includes('all') || metrics.includes('financial')) {
      try {
        const { data: allPayments } = await supabase
          .from('payments')
          .select('id, amount_cents, currency, platform_fee_cents, status, created_at');

        const { data: newPayments } = await supabase
          .from('payments')
          .select('id, amount_cents, currency, platform_fee_cents, status, created_at')
          .gte('created_at', startDate.toISOString());

        const { data: allPayouts } = await supabase
          .from('payouts')
          .select('id, amount_cents, currency, status, created_at');

        const { data: newPayouts } = await supabase
          .from('payouts')
          .select('id, amount_cents, currency, status, created_at')
          .gte('created_at', startDate.toISOString());

        analytics.financial_metrics = {
          total_payments: allPayments?.length || 0,
          total_revenue: allPayments?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0,
          total_fees_collected: allPayments?.reduce((sum, p) => sum + (p.platform_fee_cents || 0), 0) || 0,
          new_payments_period: newPayments?.length || 0,
          new_revenue_period: newPayments?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0,
          new_fees_period: newPayments?.reduce((sum, p) => sum + (p.platform_fee_cents || 0), 0) || 0,
          total_payouts: allPayouts?.length || 0,
          total_payout_amount: allPayouts?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0,
          pending_payouts: allPayouts?.filter(p => p.status === 'pending').length || 0,
          completed_payouts: allPayouts?.filter(p => p.status === 'completed').length || 0,
          escrowed_payments: allPayments?.filter(p => p.status === 'paid_escrow').length || 0
        };
      } catch (error) {
        console.error('Error fetching financial metrics:', error);
        analytics.financial_metrics = { error: 'Failed to fetch financial metrics' };
      }
    }

    // Violation Metrics
    if (metrics.includes('all') || metrics.includes('violations')) {
      try {
        const { data: allViolations } = await supabase
          .from('violation_logs')
          .select('id, risk_score, violation_type, status, created_at');

        const { data: newViolations } = await supabase
          .from('violation_logs')
          .select('id, risk_score, violation_type, status, created_at')
          .gte('created_at', startDate.toISOString());

        analytics.violation_metrics = {
          total_violations: allViolations?.length || 0,
          new_violations_period: newViolations?.length || 0,
          high_risk_violations: allViolations?.filter(v => (v.risk_score || 0) >= 3).length || 0,
          pending_violations: allViolations?.filter(v => v.status === 'pending').length || 0,
          resolved_violations: allViolations?.filter(v => v.status === 'resolved').length || 0,
          email_violations: allViolations?.filter(v => v.violation_type === 'email').length || 0,
          phone_violations: allViolations?.filter(v => v.violation_type === 'phone').length || 0,
          social_violations: allViolations?.filter(v => v.violation_type === 'social').length || 0
        };
      } catch (error) {
        console.error('Error fetching violation metrics:', error);
        analytics.violation_metrics = { error: 'Failed to fetch violation metrics' };
      }
    }

    // Platform Health Metrics
    if (metrics.includes('all') || metrics.includes('health')) {
      try {
        // Rate Cards
        const { data: rateCards } = await supabase
          .from('rate_cards')
          .select('id, created_at')
          .eq('active', true);

        // Offers  
        const { data: offers } = await supabase
          .from('offers')
          .select('id, status, created_at');

        // Applications
        const { data: applications } = await supabase
          .from('applications')
          .select('id, status, created_at');

        analytics.platform_health = {
          active_rate_cards: rateCards?.length || 0,
          total_offers: offers?.length || 0,
          pending_offers: offers?.filter(o => o.status === 'sent').length || 0,
          accepted_offers: offers?.filter(o => o.status === 'accepted').length || 0,
          total_applications: applications?.length || 0,
          pending_applications: applications?.filter(a => a.status === 'pending').length || 0,
          approved_applications: applications?.filter(a => a.status === 'approved').length || 0,
          marketplace_activity_score: Math.min(100, Math.round(
            ((offers?.length || 0) * 2 + (applications?.length || 0) + (rateCards?.length || 0)) / 10
          ))
        };
      } catch (error) {
        console.error('Error fetching platform health metrics:', error);
        analytics.platform_health = { error: 'Failed to fetch platform health metrics' };
      }
    }

    // Growth Trends (simplified)
    if (metrics.includes('all') || metrics.includes('trends')) {
      try {
        // Get user growth trend for the period
        const daysInPeriod = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
        const { data: dailySignups } = await supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .not('role', 'is', null)
          .order('created_at');

        // Group by day
        const dailyData = {};
        dailySignups?.forEach(user => {
          const date = new Date(user.created_at).toISOString().split('T')[0];
          dailyData[date] = (dailyData[date] || 0) + 1;
        });

        analytics.growth_trends = {
          daily_signups: dailyData,
          average_daily_signups: (dailySignups?.length || 0) / daysInPeriod,
          growth_rate: 'calculated_dynamically', // Would need historical comparison
          timeframe: timeframe,
          period_days: daysInPeriod
        };
      } catch (error) {
        console.error('Error fetching growth trends:', error);
        analytics.growth_trends = { error: 'Failed to fetch growth trends' };
      }
    }

    // Add metadata
    analytics.metadata = {
      timeframe,
      start_date: startDate.toISOString(),
      end_date: now.toISOString(),
      generated_at: now.toISOString(),
      requested_metrics: metrics
    };

    return NextResponse.json({
      success: true,
      analytics,
      timeframe,
      generated_at: now.toISOString()
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}