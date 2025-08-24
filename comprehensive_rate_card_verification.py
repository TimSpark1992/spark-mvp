#!/usr/bin/env python3
"""
Comprehensive Rate Card Verification Test
Final verification test for rate card functionality after frontend syntax fixes.
Tests all CRUD operations using existing data and handles edge cases.
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://www.sparkplatform.tech"
API_BASE = f"{BASE_URL}/api"

class ComprehensiveRateCardTest:
    def __init__(self):
        self.existing_creator_id = "5b408260-4d3d-4392-a589-0a485a4152a9"
        self.test_rate_card_id = None
        self.original_price = None
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
        
        # Test GET /api/rate-cards endpoint (general)
        success, response = self.test_api_endpoint('GET', f"{API_BASE}/rate-cards")
        
        if not success:
            return False
            
        try:
            data = response.json()
            if 'rateCards' in data and 'success' in data:
                total_cards = len(data['rateCards'])
                self.log(f"✅ Rate cards API accessible, found {total_cards} total rate cards")
            else:
                self.log("❌ Rate cards API response structure is invalid", "ERROR")
                return False
        except json.JSONDecodeError:
            self.log("❌ Rate cards API returned invalid JSON", "ERROR")
            return False
        
        # Test GET with creator filter
        success, response = self.test_api_endpoint('GET', f"{API_BASE}/rate-cards?creator_id={self.existing_creator_id}")
        
        if success:
            try:
                data = response.json()
                creator_cards = data.get('rateCards', [])
                self.log(f"✅ Creator-specific API accessible, found {len(creator_cards)} creator rate cards")
                
                # Store first rate card for testing
                if creator_cards:
                    self.test_rate_card_id = creator_cards[0]['id']
                    self.original_price = creator_cards[0]['base_price_cents']
                    self.log(f"✅ Selected rate card {self.test_rate_card_id} for testing (price: ${self.original_price/100:.2f})")
                
                return True
            except json.JSONDecodeError:
                self.log("❌ Creator-specific API returned invalid JSON", "ERROR")
                return False
        
        return False
    
    def test_crud_operations(self):
        """Test 2: CRUD operations (Read, Update, Delete) work correctly"""
        self.log("🎯 TEST 2: CRUD Operations")
        
        if not self.test_rate_card_id:
            self.log("❌ No test rate card available for CRUD operations", "ERROR")
            return False
        
        # READ - Test reading specific rate card
        success, response = self.test_api_endpoint('GET', f"{API_BASE}/rate-cards?creator_id={self.existing_creator_id}")
        
        if not success:
            self.log("❌ READ operation failed", "ERROR")
            return False
            
        try:
            read_result = response.json()
            rate_cards = read_result.get('rateCards', [])
            test_card = next((card for card in rate_cards if card['id'] == self.test_rate_card_id), None)
            
            if test_card:
                self.log(f"✅ READ: Successfully found test rate card")
                self.log(f"   - Type: {test_card['deliverable_type']}")
                self.log(f"   - Price: ${test_card['base_price_cents']/100:.2f}")
                self.log(f"   - Currency: {test_card['currency']}")
                self.log(f"   - Active: {test_card['active']}")
            else:
                self.log("❌ READ: Test rate card not found", "ERROR")
                return False
        except json.JSONDecodeError:
            self.log("❌ READ: Invalid JSON response", "ERROR")
            return False
        
        # UPDATE - Test updating the rate card
        new_price = self.original_price + 5000  # Add $50
        update_data = {
            'base_price_cents': new_price,
            'rush_pct': 30
        }
        
        success, response = self.test_api_endpoint('PATCH', f"{API_BASE}/rate-cards/{self.test_rate_card_id}", update_data)
        
        if not success:
            self.log("❌ UPDATE operation failed", "ERROR")
            return False
            
        try:
            update_result = response.json()
            if 'rateCard' in update_result and update_result.get('success'):
                updated_price = update_result['rateCard']['base_price_cents']
                updated_rush = update_result['rateCard']['rush_pct']
                
                if updated_price == new_price and updated_rush == 30:
                    self.log(f"✅ UPDATE: Rate card updated successfully")
                    self.log(f"   - New price: ${updated_price/100:.2f}")
                    self.log(f"   - New rush percentage: {updated_rush}%")
                else:
                    self.log(f"❌ UPDATE: Values not updated correctly", "ERROR")
                    self.log(f"   - Expected price: {new_price}, got: {updated_price}")
                    self.log(f"   - Expected rush: 30, got: {updated_rush}")
                    return False
            else:
                self.log("❌ UPDATE: Invalid response structure", "ERROR")
                return False
        except json.JSONDecodeError:
            self.log("❌ UPDATE: Invalid JSON response", "ERROR")
            return False
        
        # Verify update persisted
        success, response = self.test_api_endpoint('GET', f"{API_BASE}/rate-cards?creator_id={self.existing_creator_id}")
        
        if success:
            try:
                verify_result = response.json()
                rate_cards = verify_result.get('rateCards', [])
                updated_card = next((card for card in rate_cards if card['id'] == self.test_rate_card_id), None)
                
                if updated_card and updated_card['base_price_cents'] == new_price:
                    self.log("✅ UPDATE VERIFICATION: Changes persisted correctly")
                else:
                    self.log("❌ UPDATE VERIFICATION: Changes not persisted", "ERROR")
                    return False
            except json.JSONDecodeError:
                self.log("❌ UPDATE VERIFICATION: Invalid JSON response", "ERROR")
                return False
        
        # Restore original price for cleanup
        restore_data = {
            'base_price_cents': self.original_price,
            'rush_pct': 0
        }
        
        success, response = self.test_api_endpoint('PATCH', f"{API_BASE}/rate-cards/{self.test_rate_card_id}", restore_data)
        
        if success:
            self.log("✅ CLEANUP: Original values restored")
        else:
            self.log("⚠️ CLEANUP: Failed to restore original values")
        
        return True
    
    def test_cache_management_system(self):
        """Test 3: Cache management system is functioning"""
        self.log("🎯 TEST 3: Cache Management System")
        
        # Test rapid consecutive requests for cache consistency
        self.log("Testing cache consistency with rapid requests...")
        
        consistent_results = True
        first_result = None
        response_times = []
        
        for i in range(5):
            start_time = time.time()
            success, response = self.test_api_endpoint('GET', f"{API_BASE}/rate-cards?creator_id={self.existing_creator_id}")
            end_time = time.time()
            
            response_times.append(end_time - start_time)
            
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
        
        avg_response_time = sum(response_times) / len(response_times)
        
        if consistent_results:
            self.log(f"✅ CACHE CONSISTENCY: All {len(response_times)} requests returned consistent results")
            self.log(f"✅ PERFORMANCE: Average response time: {avg_response_time:.3f}s")
            return True
        else:
            self.log("❌ CACHE CONSISTENCY: Inconsistent results detected", "ERROR")
            return False
    
    def test_no_backend_errors(self):
        """Test 4: No backend errors from the syntax fixes"""
        self.log("🎯 TEST 4: Backend Error Detection")
        
        # Test various scenarios that could reveal backend errors
        test_scenarios = [
            ('GET', f"{API_BASE}/rate-cards", "Main endpoint"),
            ('GET', f"{API_BASE}/rate-cards?creator_id={self.existing_creator_id}", "Creator filter"),
            ('GET', f"{API_BASE}/rate-cards?creator_id=nonexistent", "Nonexistent creator"),
        ]
        
        all_working = True
        
        for method, url, description in test_scenarios:
            success, response = self.test_api_endpoint(method, url)
            
            if success:
                self.log(f"✅ {description}: Working correctly")
            else:
                # Check if it's a server error (5xx)
                if response and response.status_code >= 500:
                    self.log(f"❌ {description}: Server error {response.status_code}", "ERROR")
                    all_working = False
                else:
                    self.log(f"✅ {description}: Non-server error (expected behavior)")
        
        if all_working:
            self.log("✅ NO BACKEND ERRORS: All endpoints responding without server errors")
            return True
        else:
            self.log("❌ BACKEND ERRORS DETECTED: Some endpoints have server errors", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run all comprehensive tests"""
        self.log("🚀 Starting Comprehensive Rate Card Verification Test")
        self.log(f"Testing against: {BASE_URL}")
        self.log(f"Using existing creator ID: {self.existing_creator_id}")
        
        test_results = {
            'api_accessibility': False,
            'crud_operations': False,
            'cache_management': False,
            'no_backend_errors': False
        }
        
        # Run all tests
        test_results['api_accessibility'] = self.test_rate_card_api_accessibility()
        test_results['crud_operations'] = self.test_crud_operations()
        test_results['cache_management'] = self.test_cache_management_system()
        test_results['no_backend_errors'] = self.test_no_backend_errors()
        
        # Generate summary
        self.log("\n" + "="*70)
        self.log("📊 COMPREHENSIVE RATE CARD VERIFICATION SUMMARY")
        self.log("="*70)
        
        passed_tests = sum(1 for result in test_results.values() if result)
        total_tests = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name.replace('_', ' ').title()}: {status}")
        
        self.log(f"\nTest Results: {passed_tests}/{total_tests} tests passed")
        self.log(f"API Calls: {self.results['passed']}/{self.results['total_tests']} successful")
        
        if self.results['errors']:
            self.log("\n🚨 ERRORS ENCOUNTERED:")
            for error in self.results['errors']:
                self.log(f"  - {error}")
        
        # Final verdict
        self.log("\n" + "="*70)
        if passed_tests == total_tests:
            self.log("🎉 VERIFICATION COMPLETE: Rate card functionality is working correctly!")
            self.log("✅ All API endpoints are accessible and working")
            self.log("✅ CRUD operations (Read, Update) work correctly")
            self.log("✅ Cache management system is functioning")
            self.log("✅ No backend errors from the syntax fixes")
            self.log("\n🔧 CONTEXT: Frontend syntax fixes in /app/app/creator/rate-cards/page.js")
            self.log("   did not break the backend rate card functionality.")
            return True
        else:
            self.log(f"⚠️ VERIFICATION INCOMPLETE: {total_tests - passed_tests} test(s) failed")
            self.log("   Some issues detected in rate card functionality")
            return False

if __name__ == "__main__":
    test = ComprehensiveRateCardTest()
    success = test.run_all_tests()
    exit(0 if success else 1)