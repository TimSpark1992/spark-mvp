#!/usr/bin/env python3
"""
Rate Card Functionality Verification Test
Quick verification test to confirm the rate card functionality works properly 
after fixing the deployment syntax errors.

Tests:
1. Rate card API endpoints are accessible and working
2. CRUD operations (Create, Read, Update, Delete) work correctly  
3. Cache management system is functioning
4. No backend errors from the syntax fixes
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Configuration
BASE_URL = "https://www.sparkplatform.tech"
API_BASE = f"{BASE_URL}/api"

class RateCardVerificationTest:
    def __init__(self):
        self.test_creator_id = str(uuid.uuid4())
        self.created_rate_cards = []
        self.results = {
            'total_tests': 0,
            'passed': 0,
            'failed': 0,
            'errors': []
        }
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_api_endpoint(self, method, url, data=None, expected_status=200):
        """Generic API test helper"""
        try:
            self.results['total_tests'] += 1
            
            if method == 'GET':
                response = requests.get(url, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            self.log(f"{method} {url} -> {response.status_code}")
            
            if response.status_code == expected_status:
                self.results['passed'] += 1
                return True, response
            else:
                self.results['failed'] += 1
                error_msg = f"{method} {url} failed: expected {expected_status}, got {response.status_code}"
                self.results['errors'].append(error_msg)
                self.log(error_msg, "ERROR")
                return False, response
                
        except Exception as e:
            self.results['failed'] += 1
            error_msg = f"{method} {url} exception: {str(e)}"
            self.results['errors'].append(error_msg)
            self.log(error_msg, "ERROR")
            return False, None
    
    def test_rate_card_api_accessibility(self):
        """Test 1: Rate card API endpoints are accessible and working"""
        self.log("🎯 TEST 1: Rate Card API Accessibility")
        
        # Test GET /api/rate-cards endpoint
        success, response = self.test_api_endpoint('GET', f"{API_BASE}/rate-cards")
        
        if success:
            try:
                data = response.json()
                if 'rateCards' in data and 'success' in data:
                    self.log("✅ Rate cards API structure is correct")
                    return True
                else:
                    self.log("❌ Rate cards API response structure is invalid", "ERROR")
                    return False
            except json.JSONDecodeError:
                self.log("❌ Rate cards API returned invalid JSON", "ERROR")
                return False
        
        return False
    
    def test_crud_operations(self):
        """Test 2: CRUD operations (Create, Read, Update, Delete) work correctly"""
        self.log("🎯 TEST 2: CRUD Operations")
        
        # CREATE - Test creating a rate card
        create_data = {
            'creator_id': self.test_creator_id,
            'deliverable_type': 'IG_Reel',
            'base_price_cents': 50000,  # $500.00
            'currency': 'USD',
            'rush_pct': 25
        }
        
        success, response = self.test_api_endpoint('POST', f"{API_BASE}/rate-cards", create_data, 201)
        
        if not success:
            self.log("❌ CREATE operation failed", "ERROR")
            return False
            
        try:
            create_result = response.json()
            if 'rateCard' in create_result and create_result.get('success'):
                rate_card_id = create_result['rateCard']['id']
                self.created_rate_cards.append(rate_card_id)
                self.log(f"✅ CREATE: Rate card created with ID {rate_card_id}")
            else:
                self.log("❌ CREATE: Invalid response structure", "ERROR")
                return False
        except json.JSONDecodeError:
            self.log("❌ CREATE: Invalid JSON response", "ERROR")
            return False
        
        # READ - Test reading rate cards
        success, response = self.test_api_endpoint('GET', f"{API_BASE}/rate-cards?creator_id={self.test_creator_id}")
        
        if not success:
            self.log("❌ READ operation failed", "ERROR")
            return False
            
        try:
            read_result = response.json()
            if 'rateCards' in read_result and len(read_result['rateCards']) > 0:
                self.log(f"✅ READ: Found {len(read_result['rateCards'])} rate cards")
            else:
                self.log("❌ READ: No rate cards found or invalid structure", "ERROR")
                return False
        except json.JSONDecodeError:
            self.log("❌ READ: Invalid JSON response", "ERROR")
            return False
        
        # UPDATE - Test updating a rate card
        update_data = {
            'base_price_cents': 60000,  # $600.00
            'rush_pct': 30
        }
        
        success, response = self.test_api_endpoint('PATCH', f"{API_BASE}/rate-cards/{rate_card_id}", update_data)
        
        if not success:
            self.log("❌ UPDATE operation failed", "ERROR")
            return False
            
        try:
            update_result = response.json()
            if 'rateCard' in update_result and update_result.get('success'):
                updated_price = update_result['rateCard']['base_price_cents']
                if updated_price == 60000:
                    self.log(f"✅ UPDATE: Rate card price updated to ${updated_price/100:.2f}")
                else:
                    self.log(f"❌ UPDATE: Price not updated correctly (expected 60000, got {updated_price})", "ERROR")
                    return False
            else:
                self.log("❌ UPDATE: Invalid response structure", "ERROR")
                return False
        except json.JSONDecodeError:
            self.log("❌ UPDATE: Invalid JSON response", "ERROR")
            return False
        
        # DELETE - Test deleting a rate card (soft delete)
        success, response = self.test_api_endpoint('DELETE', f"{API_BASE}/rate-cards/{rate_card_id}")
        
        if not success:
            self.log("❌ DELETE operation failed", "ERROR")
            return False
            
        try:
            delete_result = response.json()
            if 'rateCard' in delete_result and delete_result.get('success'):
                # Verify soft delete (active should be false)
                if delete_result['rateCard']['active'] == False:
                    self.log("✅ DELETE: Rate card soft deleted successfully")
                else:
                    self.log("❌ DELETE: Rate card not properly soft deleted", "ERROR")
                    return False
            else:
                self.log("❌ DELETE: Invalid response structure", "ERROR")
                return False
        except json.JSONDecodeError:
            self.log("❌ DELETE: Invalid JSON response", "ERROR")
            return False
        
        # Verify deleted rate card doesn't appear in active results
        success, response = self.test_api_endpoint('GET', f"{API_BASE}/rate-cards?creator_id={self.test_creator_id}")
        
        if success:
            try:
                read_result = response.json()
                active_cards = [card for card in read_result.get('rateCards', []) if card.get('active', True)]
                if len(active_cards) == 0:
                    self.log("✅ DELETE VERIFICATION: Deleted rate card not in active results")
                else:
                    self.log("❌ DELETE VERIFICATION: Deleted rate card still appears in active results", "ERROR")
                    return False
            except json.JSONDecodeError:
                self.log("❌ DELETE VERIFICATION: Invalid JSON response", "ERROR")
                return False
        
        return True
    
    def test_cache_management_system(self):
        """Test 3: Cache management system is functioning"""
        self.log("🎯 TEST 3: Cache Management System")
        
        # Create multiple rate cards to test caching
        test_cards = [
            {
                'creator_id': self.test_creator_id,
                'deliverable_type': 'IG_Story',
                'base_price_cents': 25000,
                'currency': 'USD'
            },
            {
                'creator_id': self.test_creator_id,
                'deliverable_type': 'TikTok_Post',
                'base_price_cents': 75000,
                'currency': 'USD'
            }
        ]
        
        created_ids = []
        
        # Create test rate cards
        for card_data in test_cards:
            success, response = self.test_api_endpoint('POST', f"{API_BASE}/rate-cards", card_data, 201)
            if success:
                try:
                    result = response.json()
                    if 'rateCard' in result:
                        created_ids.append(result['rateCard']['id'])
                        self.created_rate_cards.append(result['rateCard']['id'])
                except json.JSONDecodeError:
                    pass
        
        if len(created_ids) < 2:
            self.log("❌ CACHE TEST: Failed to create test rate cards", "ERROR")
            return False
        
        # Test rapid consecutive requests (cache consistency)
        self.log("Testing cache consistency with rapid requests...")
        
        consistent_results = True
        first_result = None
        
        for i in range(3):
            success, response = self.test_api_endpoint('GET', f"{API_BASE}/rate-cards?creator_id={self.test_creator_id}")
            if success:
                try:
                    result = response.json()
                    current_count = len(result.get('rateCards', []))
                    
                    if first_result is None:
                        first_result = current_count
                    elif first_result != current_count:
                        consistent_results = False
                        self.log(f"❌ CACHE CONSISTENCY: Inconsistent results (first: {first_result}, current: {current_count})", "ERROR")
                        break
                        
                except json.JSONDecodeError:
                    consistent_results = False
                    break
            else:
                consistent_results = False
                break
            
            time.sleep(0.1)  # Small delay between requests
        
        if consistent_results:
            self.log("✅ CACHE CONSISTENCY: Rapid requests returned consistent results")
        else:
            self.log("❌ CACHE CONSISTENCY: Inconsistent results detected", "ERROR")
            return False
        
        # Test cache invalidation after operations
        if len(created_ids) > 0:
            # Update a rate card and verify cache invalidation
            update_data = {'base_price_cents': 80000}
            success, response = self.test_api_endpoint('PATCH', f"{API_BASE}/rate-cards/{created_ids[0]}", update_data)
            
            if success:
                # Immediately fetch to test cache invalidation
                success, response = self.test_api_endpoint('GET', f"{API_BASE}/rate-cards?creator_id={self.test_creator_id}")
                if success:
                    try:
                        result = response.json()
                        updated_card = next((card for card in result.get('rateCards', []) if card['id'] == created_ids[0]), None)
                        if updated_card and updated_card['base_price_cents'] == 80000:
                            self.log("✅ CACHE INVALIDATION: Updated data immediately available")
                        else:
                            self.log("❌ CACHE INVALIDATION: Updated data not immediately available", "ERROR")
                            return False
                    except json.JSONDecodeError:
                        self.log("❌ CACHE INVALIDATION: Invalid JSON response", "ERROR")
                        return False
        
        return True
    
    def test_no_backend_errors(self):
        """Test 4: No backend errors from the syntax fixes"""
        self.log("🎯 TEST 4: Backend Error Detection")
        
        # Test various API endpoints for errors
        endpoints_to_test = [
            ('GET', f"{API_BASE}/rate-cards"),
            ('GET', f"{API_BASE}/rate-cards/public"),
        ]
        
        error_free = True
        
        for method, url in endpoints_to_test:
            success, response = self.test_api_endpoint(method, url)
            
            if not success and response:
                try:
                    # Check if it's a 500 error (backend error)
                    if response.status_code >= 500:
                        self.log(f"❌ BACKEND ERROR: {method} {url} returned {response.status_code}", "ERROR")
                        error_free = False
                        
                        # Try to get error details
                        try:
                            error_data = response.json()
                            if 'error' in error_data:
                                self.log(f"Error details: {error_data['error']}", "ERROR")
                        except:
                            pass
                            
                except Exception as e:
                    self.log(f"Error checking response: {e}", "ERROR")
        
        if error_free:
            self.log("✅ NO BACKEND ERRORS: All endpoints responding without server errors")
        
        return error_free
    
    def cleanup(self):
        """Clean up created test data"""
        self.log("🧹 Cleaning up test data...")
        
        for rate_card_id in self.created_rate_cards:
            try:
                success, response = self.test_api_endpoint('DELETE', f"{API_BASE}/rate-cards/{rate_card_id}")
                if success:
                    self.log(f"✅ Cleaned up rate card {rate_card_id}")
                else:
                    self.log(f"⚠️ Failed to clean up rate card {rate_card_id}")
            except Exception as e:
                self.log(f"⚠️ Cleanup error for {rate_card_id}: {e}")
    
    def run_all_tests(self):
        """Run all verification tests"""
        self.log("🚀 Starting Rate Card Functionality Verification Test")
        self.log(f"Testing against: {BASE_URL}")
        
        test_results = {
            'api_accessibility': False,
            'crud_operations': False,
            'cache_management': False,
            'no_backend_errors': False
        }
        
        try:
            # Run all tests
            test_results['api_accessibility'] = self.test_rate_card_api_accessibility()
            test_results['crud_operations'] = self.test_crud_operations()
            test_results['cache_management'] = self.test_cache_management_system()
            test_results['no_backend_errors'] = self.test_no_backend_errors()
            
        finally:
            # Always cleanup
            self.cleanup()
        
        # Generate summary
        self.log("\n" + "="*60)
        self.log("📊 RATE CARD VERIFICATION TEST SUMMARY")
        self.log("="*60)
        
        passed_tests = sum(1 for result in test_results.values() if result)
        total_tests = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name.replace('_', ' ').title()}: {status}")
        
        self.log(f"\nOverall Results: {passed_tests}/{total_tests} tests passed")
        self.log(f"API Calls: {self.results['passed']}/{self.results['total_tests']} successful")
        
        if self.results['errors']:
            self.log("\n🚨 ERRORS ENCOUNTERED:")
            for error in self.results['errors']:
                self.log(f"  - {error}")
        
        # Final verdict
        if passed_tests == total_tests:
            self.log("\n🎉 ALL TESTS PASSED - Rate card functionality is working correctly!")
            return True
        else:
            self.log(f"\n⚠️ {total_tests - passed_tests} TEST(S) FAILED - Issues detected in rate card functionality")
            return False

if __name__ == "__main__":
    test = RateCardVerificationTest()
    success = test.run_all_tests()
    exit(0 if success else 1)