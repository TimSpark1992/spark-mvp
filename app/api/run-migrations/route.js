// app/api/run-migrations/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    console.log('🔧 Running Supabase migrations...')
    
    // Create the rate_cards table
    const createRateCardsSQL = `
      -- 1) Creator Rate Cards
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
    
    // Create indexes
    const createIndexesSQL = `
      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_rate_cards_creator_id ON rate_cards(creator_id);
      CREATE INDEX IF NOT EXISTS idx_rate_cards_active ON rate_cards(active) WHERE active = true;
    `
    
    // Create triggers
    const createTriggersSQL = `
      -- Update triggers for timestamps
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = now();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_rate_cards_updated_at ON rate_cards;
      CREATE TRIGGER update_rate_cards_updated_at BEFORE UPDATE ON rate_cards FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    `
    
    // Execute table creation
    console.log('Creating rate_cards table...')
    const { data: tableData, error: tableError } = await supabase.rpc('sql', {
      query: createRateCardsSQL
    })
    
    if (tableError) {
      console.error('❌ Table creation error:', tableError)
    } else {
      console.log('✅ Rate cards table created')
    }
    
    // Execute indexes creation
    console.log('Creating indexes...')
    const { data: indexData, error: indexError } = await supabase.rpc('sql', {
      query: createIndexesSQL
    })
    
    if (indexError) {
      console.error('❌ Index creation error:', indexError)
    } else {
      console.log('✅ Indexes created')
    }
    
    // Execute triggers creation
    console.log('Creating triggers...')
    const { data: triggerData, error: triggerError } = await supabase.rpc('sql', {
      query: createTriggersSQL
    })
    
    if (triggerError) {
      console.error('❌ Trigger creation error:', triggerError)
    } else {
      console.log('✅ Triggers created')
    }
    
    // Test the table by trying to select from it
    console.log('Testing table access...')
    const { data: testData, error: testError } = await supabase
      .from('rate_cards')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('❌ Table test error:', testError)
    } else {
      console.log('✅ Table is accessible')
    }
    
    console.log('🎉 Migration completed successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'Migrations executed successfully',
      results: {
        table: { data: tableData, error: tableError },
        indexes: { data: indexData, error: indexError },
        triggers: { data: triggerData, error: triggerError },
        test: { data: testData, error: testError }
      }
    })
    
  } catch (error) {
    console.error('❌ Migration error:', error)
    return NextResponse.json({
      success: false,
      message: 'Migration failed',
      error: error.message
    }, { status: 500 })
  }
}