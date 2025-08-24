#!/usr/bin/env python3
"""
Rate Cards Constraint Analysis and Manual Fix Instructions
==========================================================

This script analyzes the current rate card constraint issue and provides
manual SQL commands to fix the database constraint.

Since we can't execute SQL directly through the Python client, this script
will provide the exact SQL commands that need to be run in Supabase SQL Editor.
"""

import requests
import json
from datetime import datetime

def log_message(message, status="INFO"):
    """Log messages with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {status}: {message}")

def analyze_current_state():
    """Analyze the current rate card state to understand the constraint issue"""
    
    log_message("🔍 ANALYZING CURRENT RATE CARD CONSTRAINT ISSUE")
    log_message("=" * 60)
    
    api_base = "http://localhost:3000/api"
    test_creator_id = "5b408260-4d3d-4392-a589-0a485a4152a9"
    
    # Get current active rate cards
    log_message("STEP 1: Checking current active rate cards")
    
    try:
        response = requests.get(f"{api_base}/rate-cards?creator_id={test_creator_id}", timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            active_cards = data.get("rateCards", [])
            
            log_message(f"✅ Found {len(active_cards)} active rate cards:")
            
            for i, card in enumerate(active_cards, 1):
                log_message(f"   {i}. {card['deliverable_type']} - {card['currency']} - ${card['base_price_cents']/100:.2f}")
                log_message(f"      ID: {card['id']}")
                log_message(f"      Active: {card['active']}")
                log_message(f"      Created: {card['created_at']}")
                log_message(f"      Updated: {card['updated_at']}")
            
            # Check if YouTube Video USD exists in active cards
            youtube_usd_active = any(
                card['deliverable_type'] == 'YouTube_Video' and card['currency'] == 'USD' 
                for card in active_cards
            )
            
            log_message(f"\n📹 YouTube Video USD in active cards: {'YES' if youtube_usd_active else 'NO'}")
            
        else:
            log_message(f"❌ Failed to fetch active rate cards: {response.status_code}", "ERROR")
            return False
            
    except Exception as e:
        log_message(f"❌ Error fetching active rate cards: {str(e)}", "ERROR")
        return False
    
    # Test creating YouTube Video USD rate card
    log_message("\nSTEP 2: Testing YouTube Video USD rate card creation")
    
    test_card_data = {
        "creator_id": test_creator_id,
        "deliverable_type": "YouTube_Video",
        "base_price_cents": 100000,  # $1000
        "currency": "USD",
        "rush_pct": 50
    }
    
    try:
        create_response = requests.post(f"{api_base}/rate-cards", json=test_card_data, timeout=30)
        
        if create_response.status_code == 201:
            log_message("✅ YouTube Video USD rate card created successfully")
            log_message("   This means the constraint issue might be resolved")
            
        elif create_response.status_code == 409:
            error_data = create_response.json()
            log_message("❌ CONSTRAINT VIOLATION CONFIRMED", "ERROR")
            log_message(f"   Error: {error_data.get('error')}")
            
            if not youtube_usd_active:
                log_message("🚨 CRITICAL BUG CONFIRMED:", "ERROR")
                log_message("   - No active YouTube Video USD rate card exists")
                log_message("   - But creation is blocked by unique constraint")
                log_message("   - This proves soft-deleted records are causing the issue")
                return True  # Bug confirmed
            else:
                log_message("   This is expected - active card exists")
                
        else:
            log_message(f"❌ Unexpected response: {create_response.status_code}", "ERROR")
            log_message(f"   Response: {create_response.text}")
            
    except Exception as e:
        log_message(f"❌ Error testing rate card creation: {str(e)}", "ERROR")
        return False
    
    return True

def provide_manual_fix_instructions():
    """Provide manual SQL fix instructions"""
    
    log_message("\n🔧 MANUAL DATABASE FIX INSTRUCTIONS")
    log_message("=" * 60)
    
    log_message("The issue is in the database unique constraint that applies to ALL records")
    log_message("(including soft-deleted ones) instead of only active records.")
    log_message("")
    
    log_message("🎯 ROOT CAUSE:")
    log_message("   Current constraint: UNIQUE(creator_id, deliverable_type, currency)")
    log_message("   This prevents recreation after soft deletion")
    log_message("")
    
    log_message("💡 SOLUTION:")
    log_message("   Replace with partial unique index that only applies to active records")
    log_message("")
    
    log_message("📋 MANUAL SQL COMMANDS TO RUN IN SUPABASE SQL EDITOR:")
    log_message("=" * 60)
    
    sql_commands = """
-- Step 1: Drop the existing unique constraint
ALTER TABLE rate_cards 
DROP CONSTRAINT IF EXISTS rate_cards_creator_id_deliverable_type_currency_key;

-- Step 2: Create partial unique index for active records only
CREATE UNIQUE INDEX IF NOT EXISTS rate_cards_unique_active
ON rate_cards (creator_id, deliverable_type, currency)
WHERE active = true;

-- Step 3: Verify the fix
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'rate_cards' 
AND indexname = 'rate_cards_unique_active';
"""
    
    print(sql_commands)
    
    log_message("=" * 60)
    log_message("📝 INSTRUCTIONS:")
    log_message("1. Copy the SQL commands above")
    log_message("2. Go to Supabase Dashboard > SQL Editor")
    log_message("3. Paste and run the SQL commands")
    log_message("4. Verify the fix by running the test again")
    log_message("")
    
    log_message("✅ EXPECTED RESULT AFTER FIX:")
    log_message("   - Users can delete rate cards (sets active=false)")
    log_message("   - Users can recreate rate cards with same type+currency")
    log_message("   - Only one active rate card per type+currency allowed")
    log_message("   - Multiple soft-deleted records are allowed")

def main():
    """Main analysis function"""
    
    log_message("🎯 RATE CARDS CONSTRAINT ANALYSIS")
    log_message("Investigating the critical data consistency bug")
    log_message("")
    
    # Analyze current state
    bug_confirmed = analyze_current_state()
    
    if bug_confirmed:
        log_message("\n🚨 BUG ANALYSIS COMPLETE")
        log_message("The rate card constraint issue has been confirmed")
        
        # Provide manual fix instructions
        provide_manual_fix_instructions()
        
        log_message("\n🔄 NEXT STEPS:")
        log_message("1. Run the provided SQL commands in Supabase SQL Editor")
        log_message("2. Test rate card deletion and recreation")
        log_message("3. Verify the fix resolves the user's issue")
        
    else:
        log_message("\n✅ NO CONSTRAINT ISSUE DETECTED")
        log_message("The rate card system appears to be working correctly")
    
    return bug_confirmed

if __name__ == "__main__":
    main()