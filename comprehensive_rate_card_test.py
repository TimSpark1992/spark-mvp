#!/usr/bin/env python3
"""
Comprehensive Rate Card Deletion and Cache Management Testing
Tests with existing rate cards and verifies all functionality
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"
CREATOR_ID = "5b408260-4d3d-4392-a589-0a485a4152a9"

def log_test(message, status="INFO"):
    """Log test messages with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {status}: {message}")

def get_existing_rate_cards():
    """Get existing rate cards for testing"""
    try:
        response = requests.get(f"{API_BASE}/rate-cards?creator_id={CREATOR_ID}", timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get('rateCards', [])
        return []
    except Exception as e:
        log_test(f"Failed to get existing rate cards: {str(e)}", "ERROR")
        return []

def test_rate_card_deletion_api():
    """Test the DELETE /api/rate-cards/{id} endpoint with existing rate cards"""
    log_test("Testing rate card deletion API endpoint")
    
    # Get existing rate cards
    existing_cards = get_existing_rate_cards()
    if not existing_cards:
        log_test("❌ No existing rate cards found for testing", "ERROR")
        return False
    
    # Use the first rate card for testing
    test_card = existing_cards[0]
    card_id = test_card['id']
    initial_count = len(existing_cards)
    
    log_test(f"Testing deletion of rate card: {card_id}")
    log_test(f"   - Type: {test_card['deliverable_type']}")
    log_test(f"   - Currency: {test_card['currency']}")
    log_test(f"   - Initial count: {initial_count}")
    
    try:
        # Test deletion
        response = requests.delete(f"{API_BASE}/rate-cards/{card_id}", timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('rateCard'):
                deleted_card = data['rateCard']
                log_test(f"✅ Rate card deletion API successful", "SUCCESS")
                log_test(f"   - Deleted card ID: {deleted_card.get('id')}")
                log_test(f"   - Active status: {deleted_card.get('active')}")
                log_test(f"   - Updated timestamp: {deleted_card.get('updated_at')}")
                
                # Verify removal from active results
                time.sleep(1)
                after_cards = get_existing_rate_cards()
                final_count = len(after_cards)
                
                if final_count == initial_count - 1:
                    log_test(f"✅ Rate card properly removed from database (count: {initial_count} → {final_count})", "SUCCESS")
                    return True
                else:
                    log_test(f"❌ Rate card count inconsistent: expected {initial_count - 1}, got {final_count}", "ERROR")
                    return False
            else:
                log_test(f"❌ Rate card deletion failed: Invalid response format", "ERROR")
                return False
        else:
            log_test(f"❌ Rate card deletion failed: {response.status_code} - {response.text}", "ERROR")
            return False
            
    except Exception as e:
        log_test(f"❌ Rate card deletion exception: {str(e)}", "ERROR")
        return False

def test_cache_management_system():
    """Test the rate card cache management system"""
    log_test("Testing rate card cache management system")
    
    try:
        # Test cache consistency with multiple requests
        log_test("Testing cache consistency...")
        
        results = []
        for i in range(3):
            response = requests.get(f"{API_BASE}/rate-cards?creator_id={CREATOR_ID}", timeout=10)
            if response.status_code == 200:
                count = len(response.json().get('rateCards', []))
                results.append(count)
                log_test(f"   Request {i+1}: {count} rate cards")
            time.sleep(0.5)
        
        if len(set(results)) == 1:
            log_test("✅ Cache consistency verified", "SUCCESS")
            return True
        else:
            log_test(f"❌ Cache inconsistency detected: {results}", "ERROR")
            return False
            
    except Exception as e:
        log_test(f"❌ Cache management testing exception: {str(e)}", "ERROR")
        return False

def test_crud_operations_cache_consistency():
    """Test cache consistency across CRUD operations using existing rate cards"""
    log_test("Testing CRUD operations cache consistency")
    
    try:
        # Get existing rate cards
        existing_cards = get_existing_rate_cards()
        if not existing_cards:
            log_test("❌ No existing rate cards for CRUD testing", "ERROR")
            return False
        
        # Test READ operation consistency
        initial_count = len(existing_cards)
        log_test(f"Initial rate card count: {initial_count}")
        
        # Test UPDATE operation on first card
        test_card = existing_cards[0]
        card_id = test_card['id']
        original_price = test_card['base_price_cents']
        new_price = original_price + 1000  # Increase by $10
        
        log_test(f"Testing UPDATE operation on card {card_id}")
        log_test(f"   - Original price: {original_price}")
        log_test(f"   - New price: {new_price}")
        
        update_data = {"base_price_cents": new_price}
        update_response = requests.patch(
            f"{API_BASE}/rate-cards/{card_id}",
            json=update_data,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        if update_response.status_code == 200:
            log_test("✅ UPDATE operation successful", "SUCCESS")
            
            # Verify update is reflected in cache
            time.sleep(1)
            updated_cards = get_existing_rate_cards()
            updated_card = next((card for card in updated_cards if card['id'] == card_id), None)
            
            if updated_card and updated_card['base_price_cents'] == new_price:
                log_test("✅ UPDATE operation cache consistency verified", "SUCCESS")
                
                # Test DELETE operation
                log_test(f"Testing DELETE operation on updated card")
                delete_response = requests.delete(f"{API_BASE}/rate-cards/{card_id}", timeout=15)
                
                if delete_response.status_code == 200:
                    log_test("✅ DELETE operation successful", "SUCCESS")
                    
                    # Verify deletion is reflected in cache
                    time.sleep(1)
                    final_cards = get_existing_rate_cards()
                    final_count = len(final_cards)
                    
                    if final_count == initial_count - 1:
                        log_test("✅ DELETE operation cache consistency verified", "SUCCESS")
                        return True
                    else:
                        log_test(f"❌ DELETE operation cache inconsistency: expected {initial_count - 1}, got {final_count}", "ERROR")
                        return False
                else:
                    log_test("❌ DELETE operation failed", "ERROR")
                    return False
            else:
                log_test("❌ UPDATE operation cache inconsistency", "ERROR")
                return False
        else:
            log_test("❌ UPDATE operation failed", "ERROR")
            return False
            
    except Exception as e:
        log_test(f"❌ CRUD operations testing exception: {str(e)}", "ERROR")
        return False

def test_data_consistency_issues():
    """Test for data consistency issues using existing rate cards"""
    log_test("Testing for data consistency issues")
    
    try:
        # Get existing rate cards
        existing_cards = get_existing_rate_cards()
        if len(existing_cards) < 2:
            log_test("❌ Insufficient rate cards for consistency testing", "ERROR")
            return False
        
        # Test rapid deletion and fetching to check for race conditions
        test_card = existing_cards[0]
        card_id = test_card['id']
        initial_count = len(existing_cards)
        
        log_test(f"Testing data consistency with rapid operations on card {card_id}")
        
        # Delete the rate card
        delete_response = requests.delete(f"{API_BASE}/rate-cards/{card_id}", timeout=15)
        if delete_response.status_code != 200:
            log_test("❌ Failed to delete rate card for consistency testing", "ERROR")
            return False
        
        # Multiple rapid requests to check for race conditions
        log_test("Testing for race conditions with rapid requests...")
        
        consistency_results = []
        for i in range(5):
            cards = get_existing_rate_cards()
            deleted_card_found = any(card['id'] == card_id for card in cards)
            consistency_results.append(not deleted_card_found)  # True if consistent (not found)
            time.sleep(0.3)
        
        # Check consistency
        if all(consistency_results):
            log_test("✅ No data consistency issues detected", "SUCCESS")
            log_test(f"   - All {len(consistency_results)} requests showed consistent results")
            return True
        else:
            log_test(f"❌ Data consistency issues detected: {consistency_results}", "ERROR")
            return False
            
    except Exception as e:
        log_test(f"❌ Data consistency testing exception: {str(e)}", "ERROR")
        return False

def test_cache_invalidation_on_operations():
    """Test that cache is properly invalidated on CRUD operations"""
    log_test("Testing cache invalidation on operations")
    
    try:
        # Get initial state
        initial_cards = get_existing_rate_cards()
        if not initial_cards:
            log_test("❌ No rate cards available for cache invalidation testing", "ERROR")
            return False
        
        initial_count = len(initial_cards)
        log_test(f"Initial rate card count: {initial_count}")
        
        # Perform deletion
        test_card = initial_cards[0]
        card_id = test_card['id']
        
        delete_response = requests.delete(f"{API_BASE}/rate-cards/{card_id}", timeout=15)
        if delete_response.status_code != 200:
            log_test("❌ Failed to delete rate card for cache invalidation testing", "ERROR")
            return False
        
        # Test cache invalidation with multiple requests over time
        log_test("Testing cache invalidation over time...")
        
        for i in range(3):
            time.sleep(1)  # Wait for cache invalidation
            cards = get_existing_rate_cards()
            current_count = len(cards)
            deleted_card_found = any(card['id'] == card_id for card in cards)
            
            log_test(f"   Check {i+1}: {current_count} cards, deleted card found: {deleted_card_found}")
            
            if deleted_card_found:
                log_test(f"❌ Cache invalidation failed - deleted card still appears", "ERROR")
                return False
        
        log_test("✅ Cache invalidation working correctly", "SUCCESS")
        return True
        
    except Exception as e:
        log_test(f"❌ Cache invalidation testing exception: {str(e)}", "ERROR")
        return False

def main():
    """Main test execution"""
    log_test("🎯 COMPREHENSIVE RATE CARD DELETION AND CACHE MANAGEMENT TESTING")
    log_test(f"Testing against: {BASE_URL}")
    
    # Check API health
    try:
        response = requests.get(f"{API_BASE}/health", timeout=10)
        if response.status_code != 200:
            log_test("❌ API not accessible", "ERROR")
            return
        log_test("✅ API health check passed", "SUCCESS")
    except Exception as e:
        log_test(f"❌ API health check failed: {str(e)}", "ERROR")
        return
    
    test_results = {
        "rate_card_deletion_api": False,
        "cache_management_system": False,
        "crud_cache_consistency": False,
        "data_consistency_issues": False,
        "cache_invalidation": False
    }
    
    try:
        # 1. Test Rate Card Deletion API
        log_test("\n" + "="*60)
        log_test("TESTING RATE CARD DELETION API ENDPOINT")
        log_test("="*60)
        test_results["rate_card_deletion_api"] = test_rate_card_deletion_api()
        
        # 2. Test Cache Management System
        log_test("\n" + "="*60)
        log_test("TESTING RATE CARD CACHE MANAGEMENT SYSTEM")
        log_test("="*60)
        test_results["cache_management_system"] = test_cache_management_system()
        
        # 3. Test CRUD Operations Cache Consistency
        log_test("\n" + "="*60)
        log_test("TESTING CRUD OPERATIONS CACHE CONSISTENCY")
        log_test("="*60)
        test_results["crud_cache_consistency"] = test_crud_operations_cache_consistency()
        
        # 4. Test Data Consistency Issues
        log_test("\n" + "="*60)
        log_test("TESTING DATA CONSISTENCY ISSUES")
        log_test("="*60)
        test_results["data_consistency_issues"] = test_data_consistency_issues()
        
        # 5. Test Cache Invalidation
        log_test("\n" + "="*60)
        log_test("TESTING CACHE INVALIDATION ON OPERATIONS")
        log_test("="*60)
        test_results["cache_invalidation"] = test_cache_invalidation_on_operations()
        
    except Exception as e:
        log_test(f"❌ Main execution exception: {str(e)}", "ERROR")
    
    # Results Summary
    log_test("\n" + "="*60)
    log_test("COMPREHENSIVE RATE CARD TESTING RESULTS")
    log_test("="*60)
    
    passed_tests = sum(test_results.values())
    total_tests = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        log_test(f"{test_name.replace('_', ' ').title()}: {status}")
    
    log_test(f"\nOVERALL RESULTS: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        log_test("🎉 ALL TESTS PASSED - Rate card deletion and cache management working correctly!", "SUCCESS")
    elif passed_tests >= total_tests * 0.8:  # 80% pass rate
        log_test("✅ MOSTLY SUCCESSFUL - Rate card deletion and cache management mostly working", "SUCCESS")
    else:
        log_test("⚠️ SOME TESTS FAILED - Issues detected in rate card deletion or cache management", "WARNING")
    
    return test_results

if __name__ == "__main__":
    main()