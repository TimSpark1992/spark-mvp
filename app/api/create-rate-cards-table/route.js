// app/api/create-rate-cards-table/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    console.log('🔧 Creating rate_cards table...')
    
    // Create the rate_cards table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS rate_cards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id UUID NOT NULL,
        deliverable_type TEXT NOT NULL CHECK (deliverable_type IN ('IG_Reel', 'IG_Story', 'TikTok_Post', 'YouTube_Video', 'Bundle')),
        base_price_cents INTEGER NOT NULL CHECK (base_price_cents > 0),
        currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'MYR', 'SGD')),
        rush_pct INTEGER DEFAULT 0 CHECK (rush_pct >= 0 AND rush_pct <= 200),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(creator_id, deliverable_type, currency)
      );
    `
    
    const { data: tableResult, error: tableError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    })
    
    if (tableError) {
      console.error('❌ Error creating table:', tableError)
      
      // Try alternative approach - direct SQL execution
      const { data: directResult, error: directError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'rate_cards')
        .single()
      
      if (directError && directError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          message: 'Table does not exist and cannot be created via API. Please run the migration SQL directly in Supabase dashboard.',
          sql: createTableSQL,
          error: tableError
        }, { status: 500 })
      }
    }
    
    // Create indexes
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_rate_cards_creator_id ON rate_cards(creator_id);
      CREATE INDEX IF NOT EXISTS idx_rate_cards_active ON rate_cards(active) WHERE active = true;
    `
    
    const { data: indexResult, error: indexError } = await supabase.rpc('exec_sql', {
      sql: createIndexSQL
    })
    
    // Enable RLS
    const rlsSQL = `
      ALTER TABLE rate_cards ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Creators can CRUD their own rate cards" ON rate_cards;
      CREATE POLICY "Creators can CRUD their own rate cards" ON rate_cards
        FOR ALL USING (creator_id = auth.uid());
      
      DROP POLICY IF EXISTS "Brands can view active rate cards" ON rate_cards;
      CREATE POLICY "Brands can view active rate cards" ON rate_cards
        FOR SELECT USING (active = true);
      
      DROP POLICY IF EXISTS "Service role can manage all rate cards" ON rate_cards;
      CREATE POLICY "Service role can manage all rate cards" ON rate_cards
        FOR ALL USING (true);
    `
    
    const { data: rlsResult, error: rlsError } = await supabase.rpc('exec_sql', {
      sql: rlsSQL
    })
    
    console.log('✅ Rate cards table setup completed')
    
    return NextResponse.json({
      success: true,
      message: 'Rate cards table created successfully',
      results: {
        table: tableResult,
        indexes: indexResult,
        rls: rlsResult
      },
      errors: {
        table: tableError,
        indexes: indexError,
        rls: rlsError
      }
    })
    
  } catch (error) {
    console.error('❌ Table creation error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to create rate cards table',
      error: error.message
    }, { status: 500 })
  }
}