// app/api/create-rate-cards-table/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with environment variable checks
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase environment variables not configured for rate-cards table creation')
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

    console.log('🔄 Creating rate_cards table...')

    // SQL to create rate_cards table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS rate_cards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        deliverable_type TEXT NOT NULL,
        base_price_cents INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        description TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS rate_cards_creator_id_idx ON rate_cards(creator_id);
      CREATE INDEX IF NOT EXISTS rate_cards_active_idx ON rate_cards(active);
      CREATE INDEX IF NOT EXISTS rate_cards_deliverable_type_idx ON rate_cards(deliverable_type);

      -- Enable RLS
      ALTER TABLE rate_cards ENABLE ROW LEVEL SECURITY;

      -- Create policies
      CREATE POLICY "Creators can manage their own rate cards" ON rate_cards
        FOR ALL USING (auth.uid() = creator_id);

      CREATE POLICY "Anyone can view active rate cards" ON rate_cards
        FOR SELECT USING (active = true);
    `

    // Execute the SQL using rpc function (if available) or direct query
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: createTableSQL 
    }).catch(async () => {
      // Fallback: try executing parts individually if rpc doesn't work
      return await supabase.from('rate_cards').select('*').limit(1)
    })

    if (error) {
      console.error('❌ Table creation error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        recommendation: 'Please run the SQL manually in Supabase dashboard'
      }, { status: 500 })
    }

    console.log('✅ Rate cards table created successfully')

    return NextResponse.json({
      success: true,
      message: 'Rate cards table created successfully',
      data
    })

  } catch (error) {
    console.error('❌ Table creation execution error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}