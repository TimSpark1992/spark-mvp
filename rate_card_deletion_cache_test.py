#!/usr/bin/env python3
"""
Rate Card Deletion and Cache Management Backend Testing
Tests the rate card deletion API endpoint and cache management system
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

# Test data
TEST_CREATOR_ID = "5b408260-4d3d-4392-a589-0a485a4152a9"  # Existing creator ID
TEST_RATE_CARDS = []

def log_test(message, status="INFO"):
    """Log test messages with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {status}: {message}")

def test_health_check():
    """Test if the API is accessible"""
    log_test("Testing API health check...")
    try:
        response = requests.get(f"{API_BASE}/health", timeout=10)
        if response.status_code == 200:
            log_test("✅ API health check passed", "SUCCESS")
            return True
        else:
            log_test(f"❌ API health check failed: {response.status_code}", "ERROR")
            return False
    except Exception as e:
        log_test(f"❌ API health check exception: {str(e)}", "ERROR")
        return False

def create_test_rate_card(deliverable_type="IG_Reel", base_price_cents=50000, currency="USD"):
    """Create a test rate card for deletion testing"""
    log_test(f"Creating test rate card: {deliverable_type} - {currency}")
    
    # Use unique combinations to avoid conflicts
    unique_combinations = [
        ("IG_Reel", "MYR"),
        ("IG_Story", "SGD"), 
        ("TikTok_Post", "USD"),
        ("YouTube_Video", "MYR"),
        ("Bundle", "SGD")
    ]
    
    # Find an unused combination
    for combo_type, combo_currency in unique_combinations:
        rate_card_data = {
            "creator_id": TEST_CREATOR_ID,
            "deliverable_type": combo_type,
            "base_price_cents": base_price_cents + len(TEST_RATE_CARDS) * 1000,  # Vary price
            "currency": combo_currency,
            "rush_pct": 25
        }
        
        try:
            response = requests.post(
                f"{API_BASE}/rate-cards",
                json=rate_card_data,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code == 201:
                data = response.json()
                if data.get('success') and data.get('rateCard'):
                    rate_card = data['rateCard']
                    TEST_RATE_CARDS.append(rate_card)
                    log_test(f"✅ Rate card created: {rate_card['id']} ({combo_type} - {combo_currency})", "SUCCESS")
                    return rate_card
                else:
                    log_test(f"❌ Rate card creation failed: Invalid response format", "ERROR")
            elif response.status_code == 409:
                # This combination already exists, try next one
                continue
            else:
                log_test(f"❌ Rate card creation failed: {response.status_code} - {response.text}", "ERROR")
                
        except Exception as e:
            log_test(f"❌ Rate card creation exception: {str(e)}", "ERROR")
    
    log_test(f"❌ Could not create rate card - all combinations may be in use", "ERROR")
    return None

def test_rate_card_deletion_api(rate_card_id):
    """Test the DELETE /api/rate-cards/{id} endpoint"""
    log_test(f"Testing rate card deletion API for ID: {rate_card_id}")
    
    try:
        # Get initial count
        response_before = requests.get(
            f"{API_BASE}/rate-cards?creator_id={TEST_CREATOR_ID}",
            timeout=15
        )
        
        if response_before.status_code != 200:
            log_test("❌ Failed to get initial rate card count", "ERROR")
            return None
        
        initial_count = len(response_before.json().get('rateCards', []))
        log_test(f"Initial rate card count: {initial_count}")
        
        # Test deletion
        response = requests.delete(
            f"{API_BASE}/rate-cards/{rate_card_id}",
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                log_test(f"✅ Rate card deletion API successful", "SUCCESS")
                
                # Verify the rate card is removed from active results
                time.sleep(1)  # Small delay for consistency
                response_after = requests.get(
                    f"{API_BASE}/rate-cards?creator_id={TEST_CREATOR_ID}",
                    timeout=15
                )
                
                if response_after.status_code == 200:
                    final_count = len(response_after.json().get('rateCards', []))
                    log_test(f"Final rate card count: {final_count}")
                    
                    if final_count == initial_count - 1:
                        log_test(f"   - Rate card successfully removed from active results")
                        return {"id": rate_card_id, "deleted": True}
                    else:
                        log_test(f"❌ Rate card not removed from active results", "ERROR")
                        return None
                else:
                    log_test(f"❌ Failed to verify deletion", "ERROR")
                    return None
            else:
                log_test(f"❌ Rate card deletion failed: Invalid response format", "ERROR")
                return None
        else:
            log_test(f"❌ Rate card deletion failed: {response.status_code} - {response.text}", "ERROR")
            return None
            
    except Exception as e:
        log_test(f"❌ Rate card deletion exception: {str(e)}", "ERROR")
        return None

def verify_rate_card_removed_from_database(rate_card_id):
    """Verify that deleted rate card is properly removed from active results"""
    log_test(f"Verifying rate card {rate_card_id} is removed from database")
    
    try:
        # Fetch all rate cards for the creator
        response = requests.get(
            f"{API_BASE}/rate-cards?creator_id={TEST_CREATOR_ID}",
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and 'rateCards' in data:
                rate_cards = data['rateCards']
                
                # Check if deleted rate card is still in active results
                deleted_card_found = any(card['id'] == rate_card_id for card in rate_cards)
                
                if not deleted_card_found:
                    log_test(f"✅ Rate card properly removed from active results", "SUCCESS")
                    return True
                else:
                    log_test(f"❌ Deleted rate card still appears in active results", "ERROR")
                    return False
            else:
                log_test(f"❌ Failed to fetch rate cards for verification", "ERROR")
                return False
        else:
            log_test(f"❌ Database verification failed: {response.status_code}", "ERROR")
            return False
            
    except Exception as e:
        log_test(f"❌ Database verification exception: {str(e)}", "ERROR")
        return False

def test_cache_management_system():
    """Test the rate card cache management system functionality"""
    log_test("Testing rate card cache management system")
    
    # Create multiple rate cards for comprehensive cache testing
    cache_test_cards = []
    deliverable_types = ["IG_Reel", "IG_Story", "TikTok_Post"]
    
    for deliverable_type in deliverable_types:
        card = create_test_rate_card(deliverable_type, 75000 + len(cache_test_cards) * 10000)
        if card:
            cache_test_cards.append(card)
    
    if len(cache_test_cards) < 2:
        log_test("❌ Insufficient rate cards created for cache testing", "ERROR")
        return False
    
    log_test(f"Created {len(cache_test_cards)} rate cards for cache testing")
    
    # Test cache consistency by fetching rate cards multiple times
    log_test("Testing cache consistency...")
    
    try:
        # First fetch - should populate cache
        response1 = requests.get(
            f"{API_BASE}/rate-cards?creator_id={TEST_CREATOR_ID}",
            timeout=15
        )
        
        # Second fetch - should use cache or be consistent
        time.sleep(1)  # Small delay
        response2 = requests.get(
            f"{API_BASE}/rate-cards?creator_id={TEST_CREATOR_ID}",
            timeout=15
        )
        
        if response1.status_code == 200 and response2.status_code == 200:
            data1 = response1.json()
            data2 = response2.json()
            
            if data1.get('rateCards') and data2.get('rateCards'):
                cards1 = data1['rateCards']
                cards2 = data2['rateCards']
                
                # Check consistency
                if len(cards1) == len(cards2):
                    card_ids1 = set(card['id'] for card in cards1)
                    card_ids2 = set(card['id'] for card in cards2)
                    
                    if card_ids1 == card_ids2:
                        log_test("✅ Cache consistency verified", "SUCCESS")
                        
                        # Now test deletion and cache invalidation
                        return test_cache_invalidation_on_deletion(cache_test_cards)
                    else:
                        log_test("❌ Cache inconsistency detected - different card IDs", "ERROR")
                        return False
                else:
                    log_test("❌ Cache inconsistency detected - different card counts", "ERROR")
                    return False
            else:
                log_test("❌ Invalid response format for cache testing", "ERROR")
                return False
        else:
            log_test("❌ Failed to fetch rate cards for cache testing", "ERROR")
            return False
            
    except Exception as e:
        log_test(f"❌ Cache management testing exception: {str(e)}", "ERROR")
        return False

def test_cache_invalidation_on_deletion(cache_test_cards):
    """Test that cache is properly invalidated when rate cards are deleted"""
    log_test("Testing cache invalidation on deletion")
    
    if len(cache_test_cards) < 2:
        log_test("❌ Insufficient cards for cache invalidation testing", "ERROR")
        return False
    
    try:
        # Get initial count
        response_before = requests.get(
            f"{API_BASE}/rate-cards?creator_id={TEST_CREATOR_ID}",
            timeout=15
        )
        
        if response_before.status_code != 200:
            log_test("❌ Failed to get initial rate card count", "ERROR")
            return False
        
        initial_count = len(response_before.json().get('rateCards', []))
        log_test(f"Initial rate card count: {initial_count}")
        
        # Delete one rate card
        card_to_delete = cache_test_cards[0]
        deleted_card = test_rate_card_deletion_api(card_to_delete['id'])
        
        if not deleted_card:
            log_test("❌ Failed to delete rate card for cache testing", "ERROR")
            return False
        
        # Wait a moment for cache invalidation
        time.sleep(2)
        
        # Fetch again and verify count decreased
        response_after = requests.get(
            f"{API_BASE}/rate-cards?creator_id={TEST_CREATOR_ID}",
            timeout=15
        )
        
        if response_after.status_code == 200:
            final_count = len(response_after.json().get('rateCards', []))
            log_test(f"Final rate card count: {final_count}")
            
            if final_count == initial_count - 1:
                log_test("✅ Cache properly invalidated on deletion", "SUCCESS")
                return True
            else:
                log_test(f"❌ Cache invalidation failed - expected {initial_count - 1}, got {final_count}", "ERROR")
                return False
        else:
            log_test("❌ Failed to verify cache invalidation", "ERROR")
            return False
            
    except Exception as e:
        log_test(f"❌ Cache invalidation testing exception: {str(e)}", "ERROR")
        return False

def test_crud_operations_cache_consistency():
    """Test cache consistency across all CRUD operations"""
    log_test("Testing CRUD operations cache consistency")
    
    try:
        # Create operation
        new_card = create_test_rate_card("YouTube_Video", 100000, "USD")
        if not new_card:
            log_test("❌ Failed to create rate card for CRUD testing", "ERROR")
            return False
        
        # Read operation - verify creation is reflected
        response = requests.get(
            f"{API_BASE}/rate-cards?creator_id={TEST_CREATOR_ID}",
            timeout=15
        )
        
        if response.status_code == 200:
            cards = response.json().get('rateCards', [])
            created_card_found = any(card['id'] == new_card['id'] for card in cards)
            
            if created_card_found:
                log_test("✅ CREATE operation cache consistency verified", "SUCCESS")
            else:
                log_test("❌ CREATE operation cache inconsistency", "ERROR")
                return False
        else:
            log_test("❌ Failed to verify CREATE operation", "ERROR")
            return False
        
        # Update operation
        update_data = {
            "base_price_cents": 120000,
            "rush_pct": 50
        }
        
        update_response = requests.patch(
            f"{API_BASE}/rate-cards/{new_card['id']}",
            json=update_data,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        if update_response.status_code == 200:
            log_test("✅ UPDATE operation successful", "SUCCESS")
            
            # Verify update is reflected in cache
            time.sleep(1)
            response = requests.get(
                f"{API_BASE}/rate-cards?creator_id={TEST_CREATOR_ID}",
                timeout=15
            )
            
            if response.status_code == 200:
                cards = response.json().get('rateCards', [])
                updated_card = next((card for card in cards if card['id'] == new_card['id']), None)
                
                if updated_card and updated_card['base_price_cents'] == 120000:
                    log_test("✅ UPDATE operation cache consistency verified", "SUCCESS")
                else:
                    log_test("❌ UPDATE operation cache inconsistency", "ERROR")
                    return False
            else:
                log_test("❌ Failed to verify UPDATE operation", "ERROR")
                return False
        else:
            log_test("❌ UPDATE operation failed", "ERROR")
            return False
        
        # Delete operation
        deleted_card = test_rate_card_deletion_api(new_card['id'])
        if deleted_card:
            log_test("✅ DELETE operation successful", "SUCCESS")
            
            # Verify deletion is reflected in cache
            time.sleep(1)
            if verify_rate_card_removed_from_database(new_card['id']):
                log_test("✅ DELETE operation cache consistency verified", "SUCCESS")
                return True
            else:
                log_test("❌ DELETE operation cache inconsistency", "ERROR")
                return False
        else:
            log_test("❌ DELETE operation failed", "ERROR")
            return False
            
    except Exception as e:
        log_test(f"❌ CRUD operations testing exception: {str(e)}", "ERROR")
        return False

def test_data_consistency_issues():
    """Test for data consistency issues that could cause deleted items to reappear"""
    log_test("Testing for data consistency issues")
    
    try:
        # Create a rate card
        test_card = create_test_rate_card("Bundle", 200000, "USD")
        if not test_card:
            log_test("❌ Failed to create test card for consistency testing", "ERROR")
            return False
        
        # Delete the rate card
        deleted_card = test_rate_card_deletion_api(test_card['id'])
        if not deleted_card:
            log_test("❌ Failed to delete test card for consistency testing", "ERROR")
            return False
        
        # Multiple rapid requests to check for race conditions
        log_test("Testing for race conditions with rapid requests...")
        
        consistency_results = []
        for i in range(5):
            response = requests.get(
                f"{API_BASE}/rate-cards?creator_id={TEST_CREATOR_ID}",
                timeout=10
            )
            
            if response.status_code == 200:
                cards = response.json().get('rateCards', [])
                deleted_card_found = any(card['id'] == test_card['id'] for card in cards)
                consistency_results.append(not deleted_card_found)  # True if consistent (not found)
            else:
                consistency_results.append(False)
            
            time.sleep(0.5)  # Small delay between requests
        
        # Check consistency
        if all(consistency_results):
            log_test("✅ No data consistency issues detected", "SUCCESS")
            return True
        else:
            log_test(f"❌ Data consistency issues detected: {consistency_results}", "ERROR")
            return False
            
    except Exception as e:
        log_test(f"❌ Data consistency testing exception: {str(e)}", "ERROR")
        return False

def cleanup_test_data():
    """Clean up test data"""
    log_test("Cleaning up test data...")
    
    cleanup_count = 0
    for rate_card in TEST_RATE_CARDS:
        try:
            # Try to delete any remaining test rate cards
            response = requests.delete(
                f"{API_BASE}/rate-cards/{rate_card['id']}",
                timeout=10
            )
            if response.status_code == 200:
                cleanup_count += 1
        except:
            pass  # Ignore cleanup errors
    
    log_test(f"Cleaned up {cleanup_count} test rate cards")

def main():
    """Main test execution"""
    log_test("🎯 RATE CARD DELETION AND CACHE MANAGEMENT TESTING STARTED")
    log_test(f"Testing against: {BASE_URL}")
    
    test_results = {
        "health_check": False,
        "rate_card_deletion_api": False,
        "database_removal_verification": False,
        "cache_management_system": False,
        "crud_cache_consistency": False,
        "data_consistency_issues": False
    }
    
    try:
        # 1. Health Check
        test_results["health_check"] = test_health_check()
        
        if not test_results["health_check"]:
            log_test("❌ API not accessible, skipping tests", "ERROR")
            return
        
        # 2. Test Rate Card Deletion API
        log_test("\n" + "="*60)
        log_test("TESTING RATE CARD DELETION API ENDPOINT")
        log_test("="*60)
        
        # Create a test rate card for deletion
        test_card = create_test_rate_card("IG_Reel", 50000, "USD")
        if test_card:
            deleted_card = test_rate_card_deletion_api(test_card['id'])
            test_results["rate_card_deletion_api"] = deleted_card is not None
            
            # 3. Verify Database Removal
            if deleted_card:
                test_results["database_removal_verification"] = verify_rate_card_removed_from_database(test_card['id'])
        
        # 4. Test Cache Management System
        log_test("\n" + "="*60)
        log_test("TESTING RATE CARD CACHE MANAGEMENT SYSTEM")
        log_test("="*60)
        
        test_results["cache_management_system"] = test_cache_management_system()
        
        # 5. Test CRUD Operations Cache Consistency
        log_test("\n" + "="*60)
        log_test("TESTING CRUD OPERATIONS CACHE CONSISTENCY")
        log_test("="*60)
        
        test_results["crud_cache_consistency"] = test_crud_operations_cache_consistency()
        
        # 6. Test Data Consistency Issues
        log_test("\n" + "="*60)
        log_test("TESTING DATA CONSISTENCY ISSUES")
        log_test("="*60)
        
        test_results["data_consistency_issues"] = test_data_consistency_issues()
        
    except Exception as e:
        log_test(f"❌ Main execution exception: {str(e)}", "ERROR")
    
    finally:
        # Cleanup
        cleanup_test_data()
    
    # Results Summary
    log_test("\n" + "="*60)
    log_test("RATE CARD DELETION AND CACHE MANAGEMENT TEST RESULTS")
    log_test("="*60)
    
    passed_tests = sum(test_results.values())
    total_tests = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        log_test(f"{test_name.replace('_', ' ').title()}: {status}")
    
    log_test(f"\nOVERALL RESULTS: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        log_test("🎉 ALL TESTS PASSED - Rate card deletion and cache management working correctly!", "SUCCESS")
    else:
        log_test("⚠️ SOME TESTS FAILED - Issues detected in rate card deletion or cache management", "WARNING")
    
    return test_results

if __name__ == "__main__":
    main()