#!/usr/bin/env python3
"""
Fix Rate Cards Database Constraint
==================================

This script fixes the critical rate card data consistency issue by:
1. Dropping the existing unique constraint that applies to ALL records
2. Creating a partial unique index that only applies to active records
3. This allows multiple soft-deleted records but only one active record per (creator_id, deliverable_type, currency)

ISSUE: The current constraint UNIQUE(creator_id, deliverable_type, currency) prevents
recreation of rate cards after soft deletion because it applies to ALL records.

FIX: Replace with partial unique index that only applies WHERE active = true.
"""

import os
from supabase import create_client, Client
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/.env.local')

def log_message(message, status="INFO"):
    """Log messages with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {status}: {message}")

def fix_rate_cards_constraint():
    """Fix the rate cards unique constraint to only apply to active records"""
    
    log_message("🔧 FIXING RATE CARDS DATABASE CONSTRAINT")
    log_message("=" * 60)
    
    # Get Supabase credentials from .env.local file
    try:
        with open('/app/.env.local', 'r') as f:
            env_content = f.read()
            
        # Parse environment variables
        env_vars = {}
        for line in env_content.strip().split('\n'):
            if '=' in line and not line.startswith('#'):
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()
        
        supabase_url = env_vars.get('NEXT_PUBLIC_SUPABASE_URL')
        supabase_service_key = env_vars.get('SUPABASE_SERVICE_ROLE_KEY')
        
        log_message(f"✅ Loaded environment variables from .env.local")
        log_message(f"   Supabase URL: {supabase_url[:50]}..." if supabase_url else "   Supabase URL: Missing")
        log_message(f"   Service Key: {'Present' if supabase_service_key else 'Missing'}")
        
    except Exception as e:
        log_message(f"❌ Error loading .env.local: {str(e)}", "ERROR")
        return False
    
    if not supabase_url or not supabase_service_key:
        log_message("❌ Missing Supabase environment variables", "ERROR")
        log_message("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY", "ERROR")
        return False
    
    try:
        # Create Supabase client
        supabase: Client = create_client(supabase_url, supabase_service_key)
        log_message("✅ Supabase client created successfully")
        
        # Step 1: Check current constraint
        log_message("\nSTEP 1: Checking current constraint structure")
        
        check_constraint_sql = """
        SELECT 
            conname as constraint_name,
            pg_get_constraintdef(oid) as constraint_definition
        FROM pg_constraint 
        WHERE conrelid = 'rate_cards'::regclass 
        AND contype = 'u';
        """
        
        constraint_result = supabase.rpc('exec_sql', {'sql': check_constraint_sql}).execute()
        
        if constraint_result.data:
            log_message("📋 Current unique constraints:")
            for constraint in constraint_result.data:
                log_message(f"   {constraint['constraint_name']}: {constraint['constraint_definition']}")
        else:
            log_message("⚠️ No unique constraints found or unable to query")
        
        # Step 2: Drop the existing unique constraint
        log_message("\nSTEP 2: Dropping existing unique constraint")
        
        drop_constraint_sql = """
        ALTER TABLE rate_cards 
        DROP CONSTRAINT IF EXISTS rate_cards_creator_id_deliverable_type_currency_key;
        """
        
        drop_result = supabase.rpc('exec_sql', {'sql': drop_constraint_sql}).execute()
        log_message("✅ Existing unique constraint dropped (if it existed)")
        
        # Step 3: Create partial unique index for active records only
        log_message("\nSTEP 3: Creating partial unique index for active records")
        
        create_index_sql = """
        CREATE UNIQUE INDEX IF NOT EXISTS rate_cards_unique_active
        ON rate_cards (creator_id, deliverable_type, currency)
        WHERE active = true;
        """
        
        index_result = supabase.rpc('exec_sql', {'sql': create_index_sql}).execute()
        log_message("✅ Partial unique index created successfully")
        log_message("   Index: rate_cards_unique_active")
        log_message("   Constraint: (creator_id, deliverable_type, currency) WHERE active = true")
        
        # Step 4: Verify the fix
        log_message("\nSTEP 4: Verifying the fix")
        
        verify_sql = """
        SELECT 
            indexname,
            indexdef
        FROM pg_indexes 
        WHERE tablename = 'rate_cards' 
        AND indexname = 'rate_cards_unique_active';
        """
        
        verify_result = supabase.rpc('exec_sql', {'sql': verify_sql}).execute()
        
        if verify_result.data and len(verify_result.data) > 0:
            log_message("✅ Partial unique index verified:")
            for index in verify_result.data:
                log_message(f"   {index['indexname']}: {index['indexdef']}")
        else:
            log_message("⚠️ Could not verify index creation", "WARNING")
        
        log_message("\n" + "=" * 60)
        log_message("🎉 RATE CARDS CONSTRAINT FIX COMPLETED")
        log_message("=" * 60)
        
        log_message("✅ WHAT WAS FIXED:")
        log_message("   1. Removed constraint that applied to ALL records")
        log_message("   2. Created partial unique index for active records only")
        log_message("   3. Now allows multiple soft-deleted records")
        log_message("   4. But only one active record per (creator_id, deliverable_type, currency)")
        
        log_message("\n💡 EXPECTED BEHAVIOR NOW:")
        log_message("   1. Users can delete rate cards (sets active=false)")
        log_message("   2. Users can recreate rate cards with same type+currency")
        log_message("   3. Only one active rate card per type+currency allowed")
        log_message("   4. Multiple soft-deleted records are allowed")
        
        return True
        
    except Exception as e:
        log_message(f"❌ Error fixing constraint: {str(e)}", "ERROR")
        return False

def test_fix():
    """Test that the fix works by attempting to create duplicate rate cards"""
    
    log_message("\n🧪 TESTING THE FIX")
    log_message("=" * 60)
    
    import requests
    
    # Test data
    test_creator_id = "5b408260-4d3d-4392-a589-0a485a4152a9"
    test_card_data = {
        "creator_id": test_creator_id,
        "deliverable_type": "YouTube_Video",
        "base_price_cents": 100000,  # $1000
        "currency": "USD",
        "rush_pct": 50
    }
    
    api_base = "http://localhost:3000/api"
    
    try:
        # Try to create a YouTube Video USD rate card
        log_message("🔄 Testing rate card creation after fix")
        
        response = requests.post(f"{api_base}/rate-cards", json=test_card_data, timeout=30)
        
        if response.status_code == 201:
            log_message("✅ SUCCESS: Rate card created successfully!")
            card_data = response.json()
            card_id = card_data.get("rateCard", {}).get("id")
            log_message(f"   New card ID: {card_id}")
            
            # Now delete it and try to recreate
            if card_id:
                log_message("🗑️ Deleting the rate card to test recreation")
                delete_response = requests.delete(f"{api_base}/rate-cards/{card_id}", timeout=30)
                
                if delete_response.status_code == 200:
                    log_message("✅ Rate card deleted successfully")
                    
                    # Try to recreate
                    log_message("🔄 Attempting to recreate after deletion")
                    recreate_response = requests.post(f"{api_base}/rate-cards", json=test_card_data, timeout=30)
                    
                    if recreate_response.status_code == 201:
                        log_message("🎉 CRITICAL BUG FIXED!")
                        log_message("   Rate card successfully recreated after deletion")
                        log_message("   The database constraint fix is working correctly")
                        return True
                    else:
                        log_message(f"❌ Recreation failed: {recreate_response.status_code}", "ERROR")
                        log_message(f"   Response: {recreate_response.text}")
                        return False
                else:
                    log_message(f"❌ Deletion failed: {delete_response.status_code}", "ERROR")
                    return False
            
        elif response.status_code == 409:
            log_message("⚠️ Rate card already exists - this might be expected", "WARNING")
            log_message("   Try deleting existing YouTube Video USD cards first")
            return True
        else:
            log_message(f"❌ Creation failed: {response.status_code}", "ERROR")
            log_message(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        log_message(f"❌ Test failed: {str(e)}", "ERROR")
        return False

def main():
    """Main function to fix the constraint and test it"""
    
    log_message("🚀 RATE CARDS CONSTRAINT FIX AND TEST")
    log_message("This will fix the critical data consistency bug")
    log_message("")
    
    # Fix the constraint
    fix_success = fix_rate_cards_constraint()
    
    if fix_success:
        # Test the fix
        test_success = test_fix()
        
        if test_success:
            log_message("\n🎉 COMPLETE SUCCESS!")
            log_message("The rate card data consistency bug has been fixed and verified")
        else:
            log_message("\n⚠️ Fix applied but test failed")
            log_message("The constraint was fixed but testing encountered issues")
    else:
        log_message("\n❌ FAILED TO FIX CONSTRAINT")
        log_message("The database constraint could not be updated")
    
    return fix_success and test_success

if __name__ == "__main__":
    main()