#!/usr/bin/env python3
"""
YouTube Rate Card Bug Reproduction Test
=======================================

This test specifically reproduces the bug reported in the review request:
- User tried to create a YouTube Video rate card in USD
- Got "Rate card already exists" error
- Despite having deleted that rate card previously

This suggests the database unique constraint is checking ALL records (including soft-deleted ones)
instead of only active records.
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

# Test creator ID from previous tests
TEST_CREATOR_ID = "5b408260-4d3d-4392-a589-0a485a4152a9"

def log_test(message, status="INFO"):
    """Log test messages with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {status}: {message}")

def make_api_request(method, endpoint, data=None, timeout=30):
    """Make API request with proper error handling"""
    url = f"{API_BASE}{endpoint}"
    
    try:
        log_test(f"Making {method} request to {endpoint}")
        
        if method == "GET":
            response = requests.get(url, timeout=timeout)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=timeout)
        elif method == "DELETE":
            response = requests.delete(url, timeout=timeout)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        log_test(f"Response status: {response.status_code}")
        
        # Try to parse JSON response
        try:
            response_data = response.json()
        except:
            response_data = {"raw_response": response.text}
        
        return {
            "status_code": response.status_code,
            "data": response_data,
            "success": response.status_code < 400
        }
        
    except requests.exceptions.Timeout:
        log_test(f"Request to {endpoint} timed out", "ERROR")
        return {"status_code": 408, "data": {"error": "Request timeout"}, "success": False}
    except Exception as e:
        log_test(f"Request to {endpoint} failed: {str(e)}", "ERROR")
        return {"status_code": 500, "data": {"error": str(e)}, "success": False}

def test_youtube_rate_card_bug():
    """Test the specific YouTube Video USD rate card bug"""
    log_test("🚀 TESTING YOUTUBE VIDEO USD RATE CARD BUG")
    log_test("=" * 60)
    
    # Step 1: Check current state
    log_test("STEP 1: Checking current rate cards")
    response = make_api_request("GET", f"/rate-cards?creator_id={TEST_CREATOR_ID}")
    
    if not response["success"]:
        log_test(f"❌ Failed to fetch current rate cards: {response['data']}", "ERROR")
        return False
    
    current_cards = response["data"].get("rateCards", [])
    log_test(f"✅ Found {len(current_cards)} active rate cards")
    
    # Check if YouTube Video USD already exists
    youtube_usd_exists = False
    youtube_card_id = None
    
    for card in current_cards:
        if card["deliverable_type"] == "YouTube_Video" and card["currency"] == "USD":
            youtube_usd_exists = True
            youtube_card_id = card["id"]
            log_test(f"📹 Found existing YouTube Video USD card: {youtube_card_id}")
            break
    
    if not youtube_usd_exists:
        log_test("📹 No existing YouTube Video USD card found")
    
    # Step 2: Try to create YouTube Video USD rate card
    log_test("\nSTEP 2: Attempting to create YouTube Video USD rate card")
    
    youtube_card_data = {
        "creator_id": TEST_CREATOR_ID,
        "deliverable_type": "YouTube_Video",
        "base_price_cents": 100000,  # $1000
        "currency": "USD",
        "rush_pct": 50
    }
    
    create_response = make_api_request("POST", "/rate-cards", youtube_card_data)
    
    if create_response["success"]:
        log_test("✅ YouTube Video USD rate card created successfully")
        new_card = create_response["data"]["rateCard"]
        log_test(f"   New card ID: {new_card['id']}")
        youtube_card_id = new_card["id"]
        
    elif create_response["status_code"] == 409:
        log_test("⚠️ Rate card creation blocked - already exists", "WARNING")
        log_test(f"   Error: {create_response['data'].get('error')}")
        
        if not youtube_usd_exists:
            log_test("🚨 CRITICAL BUG DETECTED!", "ERROR")
            log_test("   No active YouTube Video USD card exists, but creation is blocked")
            log_test("   This suggests soft-deleted records are causing the conflict")
            return False
        else:
            log_test("   This is expected behavior - active card exists")
    else:
        log_test(f"❌ Unexpected error: {create_response['data']}", "ERROR")
        return False
    
    # Step 3: If we have a card, delete it and try to recreate
    if youtube_card_id:
        log_test(f"\nSTEP 3: Testing deletion and recreation with card {youtube_card_id}")
        
        # Delete the card
        log_test("🗑️ Deleting YouTube Video USD rate card")
        delete_response = make_api_request("DELETE", f"/rate-cards/{youtube_card_id}")
        
        if not delete_response["success"]:
            log_test(f"❌ Failed to delete rate card: {delete_response['data']}", "ERROR")
            return False
        
        log_test("✅ Rate card deleted successfully")
        
        # Verify it's gone from active results
        log_test("🔍 Verifying card is removed from active results")
        response = make_api_request("GET", f"/rate-cards?creator_id={TEST_CREATOR_ID}")
        
        if response["success"]:
            updated_cards = response["data"].get("rateCards", [])
            still_exists = any(card["id"] == youtube_card_id for card in updated_cards)
            
            if still_exists:
                log_test("❌ SOFT DELETE ISSUE: Card still appears in active results!", "ERROR")
                return False
            else:
                log_test("✅ Card correctly removed from active results")
        
        # Now try to recreate the same card
        log_test("🔄 Attempting to recreate YouTube Video USD rate card after deletion")
        recreate_response = make_api_request("POST", "/rate-cards", youtube_card_data)
        
        if recreate_response["success"]:
            log_test("✅ SUCCESS: Rate card recreated successfully after deletion")
            log_test("   This indicates the bug is NOT present - validation works correctly")
            new_card = recreate_response["data"]["rateCard"]
            log_test(f"   New card ID: {new_card['id']}")
            return True
            
        elif recreate_response["status_code"] == 409:
            log_test("🚨 CRITICAL BUG CONFIRMED!", "ERROR")
            log_test("   Cannot recreate YouTube Video USD rate card after deletion")
            log_test(f"   Error: {recreate_response['data'].get('error')}")
            log_test("   This is the exact bug reported in the review request")
            log_test("   The database unique constraint is checking soft-deleted records")
            return False
        else:
            log_test(f"❌ Unexpected error during recreation: {recreate_response['data']}", "ERROR")
            return False
    
    return True

def investigate_database_constraint():
    """Investigate the database constraint issue"""
    log_test("\n🔍 INVESTIGATING DATABASE CONSTRAINT ISSUE")
    log_test("=" * 60)
    
    log_test("Based on the API code analysis:")
    log_test("1. The API uses database unique constraint violation (error code 23505)")
    log_test("2. The constraint is likely: UNIQUE(creator_id, deliverable_type, currency)")
    log_test("3. If the constraint doesn't include 'WHERE active = true', it affects ALL records")
    log_test("4. This would prevent recreation after soft deletion")
    
    log_test("\n💡 EXPECTED DATABASE SCHEMA:")
    log_test("CREATE UNIQUE INDEX rate_cards_unique_active")
    log_test("ON rate_cards (creator_id, deliverable_type, currency)")
    log_test("WHERE active = true;")
    
    log_test("\n🚨 PROBLEMATIC SCHEMA (likely current):")
    log_test("ALTER TABLE rate_cards")
    log_test("ADD CONSTRAINT rate_cards_unique")
    log_test("UNIQUE (creator_id, deliverable_type, currency);")
    
    log_test("\n🔧 RECOMMENDED FIX:")
    log_test("1. Drop the existing unique constraint")
    log_test("2. Create a partial unique index that only applies to active records")
    log_test("3. This allows multiple soft-deleted records but only one active record")

def run_youtube_bug_test():
    """Run the YouTube rate card bug test"""
    log_test("🎯 YOUTUBE VIDEO USD RATE CARD BUG INVESTIGATION")
    log_test(f"Testing against: {BASE_URL}")
    log_test(f"Test Creator ID: {TEST_CREATOR_ID}")
    log_test("")
    
    try:
        # Run the main test
        result = test_youtube_rate_card_bug()
        
        # Always run the investigation
        investigate_database_constraint()
        
        # Summary
        log_test("\n" + "=" * 60)
        log_test("YOUTUBE RATE CARD BUG TEST SUMMARY")
        log_test("=" * 60)
        
        if result:
            log_test("✅ TEST PASSED: Rate card deletion and recreation works correctly")
            log_test("   The reported bug is NOT present in the current system")
        else:
            log_test("❌ TEST FAILED: Rate card bug confirmed")
            log_test("   The system has the exact issue reported in the review request")
        
        log_test("\n🔍 NEXT STEPS:")
        if result:
            log_test("1. The system appears to be working correctly")
            log_test("2. The user's issue might have been resolved in previous fixes")
            log_test("3. Consider testing with different deliverable types")
        else:
            log_test("1. Fix the database unique constraint to only apply to active records")
            log_test("2. Create a partial unique index: WHERE active = true")
            log_test("3. Test the fix with all deliverable types")
        
        return result
        
    except Exception as e:
        log_test(f"❌ Test failed with exception: {str(e)}", "ERROR")
        return False

if __name__ == "__main__":
    run_youtube_bug_test()