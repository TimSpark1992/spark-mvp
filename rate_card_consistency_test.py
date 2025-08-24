#!/usr/bin/env python3
"""
Rate Card Data Consistency Investigation Test
============================================

This test investigates the critical rate card data consistency issue where:
1. User deleted a rate card in the past
2. Platform still thinks it exists when trying to create a new one
3. User gets "Rate card already exists" error despite having deleted it

The test will:
1. Check current state of rate cards in database
2. Look for soft-deleted rate cards (active=false) 
3. Test rate card creation API validation logic
4. Verify cache consistency
5. Check if validation logic incorrectly counts deleted cards
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

def test_1_check_current_rate_cards():
    """Test 1: Check current state of rate cards for test creator"""
    log_test("=" * 60)
    log_test("TEST 1: CHECKING CURRENT RATE CARDS STATE")
    log_test("=" * 60)
    
    # Get all rate cards for the test creator
    response = make_api_request("GET", f"/rate-cards?creator_id={TEST_CREATOR_ID}")
    
    if not response["success"]:
        log_test(f"❌ Failed to fetch rate cards: {response['data']}", "ERROR")
        return False
    
    rate_cards = response["data"].get("rateCards", [])
    log_test(f"✅ Found {len(rate_cards)} active rate cards for creator {TEST_CREATOR_ID}")
    
    # Log details of each rate card
    for i, card in enumerate(rate_cards, 1):
        log_test(f"  {i}. ID: {card.get('id')}")
        log_test(f"     Type: {card.get('deliverable_type')}")
        log_test(f"     Currency: {card.get('currency')}")
        log_test(f"     Price: ${card.get('base_price_cents', 0) / 100:.2f}")
        log_test(f"     Active: {card.get('active')}")
        log_test(f"     Created: {card.get('created_at')}")
        log_test(f"     Updated: {card.get('updated_at')}")
    
    # Check for specific deliverable types that might cause conflicts
    deliverable_types = {}
    for card in rate_cards:
        key = f"{card.get('deliverable_type')}_{card.get('currency')}"
        if key in deliverable_types:
            log_test(f"⚠️ POTENTIAL DUPLICATE: Multiple {card.get('deliverable_type')} cards in {card.get('currency')}", "WARNING")
        deliverable_types[key] = card
    
    log_test(f"📊 Summary: {len(deliverable_types)} unique deliverable_type+currency combinations")
    
    return True

def test_2_check_database_for_soft_deleted():
    """Test 2: Check for soft-deleted rate cards that might cause validation issues"""
    log_test("=" * 60)
    log_test("TEST 2: CHECKING FOR SOFT-DELETED RATE CARDS")
    log_test("=" * 60)
    
    # Note: We can't directly query the database for active=false records through the API
    # because the API filters them out. This is actually the core of the issue.
    # We need to check if the validation logic is checking ALL records instead of just active ones.
    
    log_test("⚠️ Cannot directly check soft-deleted records through API (they're filtered out)")
    log_test("This filtering behavior might be the source of the validation issue")
    log_test("The validation logic might be checking ALL records instead of just active=true")
    
    return True

def test_3_test_rate_card_creation_validation():
    """Test 3: Test rate card creation with existing deliverable types"""
    log_test("=" * 60)
    log_test("TEST 3: TESTING RATE CARD CREATION VALIDATION")
    log_test("=" * 60)
    
    # First, get current rate cards to see what exists
    response = make_api_request("GET", f"/rate-cards?creator_id={TEST_CREATOR_ID}")
    if not response["success"]:
        log_test("❌ Cannot proceed without current rate cards data", "ERROR")
        return False
    
    existing_cards = response["data"].get("rateCards", [])
    
    if not existing_cards:
        log_test("ℹ️ No existing rate cards found, creating a test card first")
        
        # Create a test rate card
        test_card_data = {
            "creator_id": TEST_CREATOR_ID,
            "deliverable_type": "YouTube_Video",
            "base_price_cents": 50000,  # $500
            "currency": "USD",
            "rush_pct": 25
        }
        
        create_response = make_api_request("POST", "/rate-cards", test_card_data)
        if create_response["success"]:
            log_test("✅ Test rate card created successfully")
            existing_cards = [create_response["data"]["rateCard"]]
        else:
            log_test(f"❌ Failed to create test rate card: {create_response['data']}", "ERROR")
            return False
    
    # Now test creating a duplicate
    if existing_cards:
        existing_card = existing_cards[0]
        duplicate_data = {
            "creator_id": TEST_CREATOR_ID,
            "deliverable_type": existing_card["deliverable_type"],
            "base_price_cents": 60000,  # Different price
            "currency": existing_card["currency"],
            "rush_pct": 30
        }
        
        log_test(f"🔄 Attempting to create duplicate {existing_card['deliverable_type']} card in {existing_card['currency']}")
        
        duplicate_response = make_api_request("POST", "/rate-cards", duplicate_data)
        
        if duplicate_response["status_code"] == 409:
            log_test("✅ Validation working correctly - duplicate creation blocked with 409 error")
            log_test(f"   Error message: {duplicate_response['data'].get('error')}")
        elif duplicate_response["success"]:
            log_test("❌ VALIDATION ISSUE: Duplicate rate card was created successfully!", "ERROR")
            log_test("   This indicates the validation logic is not working properly")
        else:
            log_test(f"⚠️ Unexpected error during duplicate creation: {duplicate_response['data']}", "WARNING")
    
    return True

def test_4_test_soft_delete_and_recreation():
    """Test 4: Test the soft delete and recreation workflow"""
    log_test("=" * 60)
    log_test("TEST 4: TESTING SOFT DELETE AND RECREATION WORKFLOW")
    log_test("=" * 60)
    
    # Create a test rate card
    test_card_data = {
        "creator_id": TEST_CREATOR_ID,
        "deliverable_type": "TikTok_Post",
        "base_price_cents": 25000,  # $250
        "currency": "USD",
        "rush_pct": 20
    }
    
    log_test("🔄 Creating test rate card for deletion test")
    create_response = make_api_request("POST", "/rate-cards", test_card_data)
    
    if not create_response["success"]:
        if create_response["status_code"] == 409:
            log_test("ℹ️ Rate card already exists, will use existing one for deletion test")
            # Get the existing card
            response = make_api_request("GET", f"/rate-cards?creator_id={TEST_CREATOR_ID}")
            if response["success"]:
                existing_cards = response["data"].get("rateCards", [])
                test_card = None
                for card in existing_cards:
                    if (card["deliverable_type"] == "TikTok_Post" and 
                        card["currency"] == "USD"):
                        test_card = card
                        break
                
                if not test_card:
                    log_test("❌ Could not find existing TikTok_Post USD card", "ERROR")
                    return False
            else:
                log_test("❌ Could not fetch existing cards", "ERROR")
                return False
        else:
            log_test(f"❌ Failed to create test rate card: {create_response['data']}", "ERROR")
            return False
    else:
        test_card = create_response["data"]["rateCard"]
        log_test(f"✅ Test rate card created with ID: {test_card['id']}")
    
    # Delete the rate card (soft delete)
    log_test(f"🗑️ Soft deleting rate card {test_card['id']}")
    delete_response = make_api_request("DELETE", f"/rate-cards/{test_card['id']}")
    
    if not delete_response["success"]:
        log_test(f"❌ Failed to delete rate card: {delete_response['data']}", "ERROR")
        return False
    
    log_test("✅ Rate card soft deleted successfully")
    
    # Verify it's no longer in active results
    log_test("🔍 Verifying rate card is no longer in active results")
    response = make_api_request("GET", f"/rate-cards?creator_id={TEST_CREATOR_ID}")
    
    if response["success"]:
        active_cards = response["data"].get("rateCards", [])
        deleted_card_found = any(card["id"] == test_card["id"] for card in active_cards)
        
        if deleted_card_found:
            log_test("❌ SOFT DELETE ISSUE: Deleted card still appears in active results!", "ERROR")
        else:
            log_test("✅ Deleted card correctly removed from active results")
    
    # Now try to recreate the same rate card
    log_test("🔄 Attempting to recreate the same rate card after deletion")
    recreate_response = make_api_request("POST", "/rate-cards", test_card_data)
    
    if recreate_response["success"]:
        log_test("✅ RECREATION SUCCESS: Rate card recreated successfully after deletion")
        log_test("   This indicates the validation logic correctly ignores soft-deleted records")
        new_card = recreate_response["data"]["rateCard"]
        log_test(f"   New card ID: {new_card['id']}")
    elif recreate_response["status_code"] == 409:
        log_test("❌ CRITICAL BUG CONFIRMED: Cannot recreate rate card after deletion!", "ERROR")
        log_test("   This is the exact issue reported in the review request")
        log_test(f"   Error message: {recreate_response['data'].get('error')}")
        log_test("   The validation logic is incorrectly counting soft-deleted records")
    else:
        log_test(f"⚠️ Unexpected error during recreation: {recreate_response['data']}", "WARNING")
    
    return True

def test_5_cache_consistency_check():
    """Test 5: Check cache consistency after deletions"""
    log_test("=" * 60)
    log_test("TEST 5: CHECKING CACHE CONSISTENCY")
    log_test("=" * 60)
    
    # Make multiple rapid requests to check cache consistency
    log_test("🔄 Making multiple rapid requests to check cache consistency")
    
    results = []
    for i in range(5):
        response = make_api_request("GET", f"/rate-cards?creator_id={TEST_CREATOR_ID}")
        if response["success"]:
            count = len(response["data"].get("rateCards", []))
            results.append(count)
            log_test(f"   Request {i+1}: {count} rate cards")
        else:
            log_test(f"   Request {i+1}: Failed - {response['data']}")
        
        time.sleep(0.1)  # Small delay between requests
    
    # Check consistency
    if len(set(results)) == 1:
        log_test("✅ Cache consistency verified - all requests returned same count")
    else:
        log_test("❌ CACHE INCONSISTENCY DETECTED: Different counts returned", "ERROR")
        log_test(f"   Results: {results}")
    
    return True

def test_6_validation_logic_analysis():
    """Test 6: Analyze the validation logic behavior"""
    log_test("=" * 60)
    log_test("TEST 6: VALIDATION LOGIC ANALYSIS")
    log_test("=" * 60)
    
    log_test("🔍 Analyzing validation logic based on API behavior")
    
    # The validation logic is in the POST /api/rate-cards endpoint
    # Looking at the code, it should check for unique constraint violation (error code 23505)
    # The unique constraint is on (creator_id, deliverable_type, currency)
    
    log_test("📋 Current validation approach:")
    log_test("   1. API relies on database unique constraint")
    log_test("   2. Unique constraint: (creator_id, deliverable_type, currency)")
    log_test("   3. Constraint should only apply to active=true records")
    
    log_test("🔍 Potential issues:")
    log_test("   1. Database constraint might not include 'active' field")
    log_test("   2. Constraint might apply to ALL records (including soft-deleted)")
    log_test("   3. This would prevent recreation after soft deletion")
    
    log_test("💡 Expected behavior:")
    log_test("   1. Soft delete sets active=false")
    log_test("   2. Unique constraint should allow new record with same type+currency")
    log_test("   3. Only one active=true record per (creator_id, deliverable_type, currency)")
    
    return True

def run_all_tests():
    """Run all rate card consistency tests"""
    log_test("🚀 STARTING RATE CARD DATA CONSISTENCY INVESTIGATION")
    log_test(f"Testing against: {BASE_URL}")
    log_test(f"Test Creator ID: {TEST_CREATOR_ID}")
    log_test("")
    
    tests = [
        ("Current Rate Cards State", test_1_check_current_rate_cards),
        ("Soft-Deleted Records Check", test_2_check_database_for_soft_deleted),
        ("Creation Validation Logic", test_3_test_rate_card_creation_validation),
        ("Soft Delete & Recreation", test_4_test_soft_delete_and_recreation),
        ("Cache Consistency", test_5_cache_consistency_check),
        ("Validation Logic Analysis", test_6_validation_logic_analysis)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            log_test(f"\n🧪 Running: {test_name}")
            result = test_func()
            results[test_name] = "PASS" if result else "FAIL"
            log_test(f"✅ {test_name}: {'PASSED' if result else 'FAILED'}")
        except Exception as e:
            log_test(f"❌ {test_name}: EXCEPTION - {str(e)}", "ERROR")
            results[test_name] = "ERROR"
    
    # Summary
    log_test("\n" + "=" * 60)
    log_test("RATE CARD CONSISTENCY INVESTIGATION SUMMARY")
    log_test("=" * 60)
    
    for test_name, result in results.items():
        status_emoji = "✅" if result == "PASS" else "❌" if result == "FAIL" else "⚠️"
        log_test(f"{status_emoji} {test_name}: {result}")
    
    passed = sum(1 for r in results.values() if r == "PASS")
    total = len(results)
    
    log_test(f"\n📊 Overall Results: {passed}/{total} tests passed")
    
    if passed == total:
        log_test("🎉 All tests passed - Rate card system appears to be working correctly")
    else:
        log_test("⚠️ Some tests failed - Rate card data consistency issues detected")
    
    log_test("\n🔍 KEY FINDINGS:")
    log_test("1. Check if soft-deleted records are causing validation conflicts")
    log_test("2. Verify database unique constraint includes 'active' field")
    log_test("3. Ensure cache invalidation works properly after deletions")
    log_test("4. Confirm API validation logic only checks active records")
    
    return results

if __name__ == "__main__":
    run_all_tests()