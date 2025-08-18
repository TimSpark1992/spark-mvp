#!/usr/bin/env python3
"""
Direct Supabase Rate Cards Table Creation Script
Uses Supabase Python client to create the missing rate_cards table
"""

import os
import sys
from supabase import create_client, Client

# Load environment variables from .env.local
def load_env_file():
    env_vars = {}
    try:
        with open('/app/.env.local', 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
    except FileNotFoundError:
        print("❌ .env.local file not found")
        return None
    return env_vars

def create_rate_cards_table():
    """Create the rate_cards table directly using Supabase client"""
    print("🔧 DIRECT SUPABASE TABLE CREATION")
    print("=" * 50)
    
    # Load environment variables
    env_vars = load_env_file()
    if not env_vars:
        return False
    
    supabase_url = env_vars.get('NEXT_PUBLIC_SUPABASE_URL')
    supabase_service_key = env_vars.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_service_key:
        print("❌ Missing Supabase credentials in .env.local")
        print(f"URL: {'✅' if supabase_url else '❌'}")
        print(f"Service Key: {'✅' if supabase_service_key else '❌'}")
        return False
    
    print(f"🔗 Supabase URL: {supabase_url}")
    print(f"🔑 Service Key: {supabase_service_key[:20]}...")
    
    try:
        # Create Supabase client with service role key
        supabase: Client = create_client(supabase_url, supabase_service_key)
        print("✅ Supabase client created successfully")
        
        # SQL to create the rate_cards table
        create_table_sql = """
        -- Create rate_cards table
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
        """
        
        print("\n📋 Executing table creation SQL...")
        
        # Execute the SQL using rpc call
        result = supabase.rpc('exec_sql', {'sql': create_table_sql}).execute()
        
        if result.data:
            print("✅ Table creation SQL executed successfully")
        else:
            print("⚠️  Table creation SQL executed (no data returned)")
        
        # Create indexes
        index_sql = """
        CREATE INDEX IF NOT EXISTS idx_rate_cards_creator_id ON rate_cards(creator_id);
        CREATE INDEX IF NOT EXISTS idx_rate_cards_active ON rate_cards(active) WHERE active = true;
        """
        
        print("📋 Creating indexes...")
        index_result = supabase.rpc('exec_sql', {'sql': index_sql}).execute()
        
        if index_result.data:
            print("✅ Indexes created successfully")
        else:
            print("⚠️  Index creation executed (no data returned)")
        
        # Test if table exists by trying to query it
        print("\n🔍 Verifying table creation...")
        test_result = supabase.table('rate_cards').select('*').limit(1).execute()
        
        if test_result.data is not None:
            print("✅ Rate cards table verified - exists and is accessible")
            print(f"📊 Current records: {len(test_result.data)}")
            return True
        else:
            print("❌ Table verification failed")
            return False
            
    except Exception as e:
        print(f"❌ Error creating table: {str(e)}")
        
        # Try alternative approach - direct table query to check if it exists
        try:
            print("\n🔍 Checking if table already exists...")
            supabase: Client = create_client(supabase_url, supabase_service_key)
            test_result = supabase.table('rate_cards').select('*').limit(1).execute()
            
            if test_result.data is not None:
                print("✅ Rate cards table already exists!")
                print(f"📊 Current records: {len(test_result.data)}")
                return True
            else:
                print("❌ Table does not exist and creation failed")
                return False
                
        except Exception as e2:
            print(f"❌ Table verification also failed: {str(e2)}")
            return False

def test_rate_card_operations():
    """Test basic rate card operations"""
    print("\n📋 TESTING RATE CARD OPERATIONS")
    print("=" * 50)
    
    # Load environment variables
    env_vars = load_env_file()
    if not env_vars:
        return False
    
    supabase_url = env_vars.get('NEXT_PUBLIC_SUPABASE_URL')
    supabase_service_key = env_vars.get('SUPABASE_SERVICE_ROLE_KEY')
    
    try:
        supabase: Client = create_client(supabase_url, supabase_service_key)
        
        # Test data
        test_creator_id = "550e8400-e29b-41d4-a716-446655440000"  # Example UUID
        test_rate_card = {
            "creator_id": test_creator_id,
            "deliverable_type": "IG_Reel",
            "base_price_cents": 50000,  # $500.00
            "currency": "USD",
            "rush_pct": 25
        }
        
        print(f"📤 Creating test rate card...")
        print(f"   Creator ID: {test_creator_id}")
        print(f"   Type: {test_rate_card['deliverable_type']}")
        print(f"   Price: ${test_rate_card['base_price_cents'] / 100:.2f} {test_rate_card['currency']}")
        
        # Insert test rate card
        insert_result = supabase.table('rate_cards').insert(test_rate_card).execute()
        
        if insert_result.data:
            rate_card = insert_result.data[0]
            print("✅ Rate card created successfully")
            print(f"   ID: {rate_card.get('id')}")
            print(f"   Created: {rate_card.get('created_at')}")
            
            # Test retrieval
            print("\n📥 Testing rate card retrieval...")
            select_result = supabase.table('rate_cards').select('*').eq('creator_id', test_creator_id).execute()
            
            if select_result.data:
                print(f"✅ Retrieved {len(select_result.data)} rate cards for creator")
                for card in select_result.data:
                    print(f"   - {card['deliverable_type']}: ${card['base_price_cents'] / 100:.2f} {card['currency']}")
                return True
            else:
                print("❌ Failed to retrieve rate cards")
                return False
        else:
            print("❌ Failed to create rate card")
            return False
            
    except Exception as e:
        print(f"❌ Error testing rate card operations: {str(e)}")
        return False

def main():
    """Main function"""
    print("🎯 SUPABASE RATE CARDS TABLE SETUP")
    print("=" * 60)
    
    # Step 1: Create the table
    table_created = create_rate_cards_table()
    
    if table_created:
        print("\n🎉 TABLE CREATION SUCCESSFUL!")
        
        # Step 2: Test operations
        operations_working = test_rate_card_operations()
        
        if operations_working:
            print("\n🎉 RATE CARD OPERATIONS WORKING!")
            print("\n✅ SUMMARY:")
            print("   • Rate cards table created successfully")
            print("   • Table is accessible and functional")
            print("   • Rate card creation and retrieval working")
            print("   • Ready for frontend integration")
            return True
        else:
            print("\n⚠️  TABLE EXISTS BUT OPERATIONS FAILED")
            print("   • Table was created but testing failed")
            print("   • May need to check permissions or constraints")
            return False
    else:
        print("\n❌ TABLE CREATION FAILED")
        print("\n🔧 MANUAL STEPS REQUIRED:")
        print("1. Go to Supabase Dashboard: https://fgcefqowzkpeivpckljf.supabase.co")
        print("2. Navigate to SQL Editor")
        print("3. Execute the following SQL:")
        print("""
        -- Create rate_cards table
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

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_rate_cards_creator_id ON rate_cards(creator_id);
        CREATE INDEX IF NOT EXISTS idx_rate_cards_active ON rate_cards(active) WHERE active = true;
        """)
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)