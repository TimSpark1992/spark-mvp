#!/usr/bin/env python3
"""
Focused Rate Card Backend Test
Tests rate card functionality using existing creator data from the system.
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://www.sparkplatform.tech"
API_BASE = f"{BASE_URL}/api"

class FocusedRateCardTest:
    def __init__(self):
        self.existing_creator_id = "5b408260-4d3d-4392-a589-0a485a4152a9"  # From test_result.md
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
                
                # Log response details for debugging
                try:
                    error_data = response.json()
                    self.log(f"Error details: {json.dumps(error_data, indent=2)}", "ERROR")
                except:
                    self.log(f"Error response text: {response.text}", "ERROR")
                
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
                self.log(f"✅ Rate cards API structure is correct, found {len(data['rateCards'])} rate cards")
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
                self.log(f"✅ Creator-specific rate cards: {len(creator_cards)} found")
            except json.JSONDecodeError:
                self.log("❌ Creator-specific API returned invalid JSON", "ERROR")
                return False
        
        return True
    
    def test_crud_operations_with_existing_data(self):
        """Test 2: CRUD operations using existing creator data"""
        self.log("🎯 TEST 2: CRUD Operations with Existing Creator")
        
        # First, get existing rate cards to avoid conflicts
        success, response = self.test_api_endpoint('GET', f"{API_BASE}/rate-cards?creator_id={self.existing_creator_id}")
        
        if not success:
            self.log("❌ Failed to fetch existing rate cards", "ERROR")
            return False
        
        try:
            existing_data = response.json()
            existing_cards = existing_data.get('rateCards', [])
            existing_types = [card['deliverable_type'] for card in existing_cards]
            self.log(f"Existing rate card types: {existing_types}")
        except json.JSONDecodeError:
            self.log("❌ Invalid JSON in existing rate cards", "ERROR")
            return False
        
        # Find a deliverable type that doesn't exist yet
        all_types = ['IG_Reel', 'IG_Story', 'TikTok_Post', 'YouTube_Video', 'Bundle']
        available_type = None
        
        for card_type in all_types:
            if card_type not in existing_types:
                available_type = card_type
                break
        
        if not available_type:
            self.log("⚠️ All deliverable types already exist, testing with Bundle type (will update existing)")
            available_type = 'Bundle'
        
        # CREATE - Test creating a rate card
        create_data = {
            'creator_id': self.existing_creator_id,
            'deliverable_type': available_type,
            'base_price_cents': 45000,  # $450.00
            'currency': 'USD',
            'rush_pct': 20
        }
        
        success, response = self.test_api_endpoint('POST', f"{API_BASE}/rate-cards", create_data, 201)
        
        if success:
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
        else:
            # If creation failed due to existing card, try to find and use existing one
            if "already exists" in str(response.text if response else ""):
                self.log("⚠️ Rate card already exists, finding existing one for testing")
                success, response = self.test_api_endpoint('GET', f"{API_BASE}/rate-cards?creator_id={self.existing_creator_id}")
                if success:
                    try:
                        data = response.json()
                        existing_card = next((card for card in data.get('rateCards', []) if card['deliverable_type'] == available_type), None)
                        if existing_card:
                            rate_card_id = existing_card['id']
                            self.log(f"✅ Using existing rate card ID {rate_card_id} for testing")
                        else:
                            self.log("❌ Could not find existing rate card", "ERROR")
                            return False
                    except json.JSONDecodeError:
                        self.log("❌ Invalid JSON when finding existing card", "ERROR")
                        return False
                else:
                    self.log("❌ CREATE operation failed and couldn't find existing card", "ERROR")
                    return False
            else:
                self.log("❌ CREATE operation failed", "ERROR")
                return False
        
        # READ - Test reading rate cards after creation
        success, response = self.test_api_endpoint('GET', f"{API_BASE}/rate-cards?creator_id={self.existing_creator_id}")
        
        if success:
            try:
                read_result = response.json()
                cards_after_create = read_result.get('rateCards', [])
                self.log(f"✅ READ: Found {len(cards_after_create)} rate cards after creation")
            except json.JSONDecodeError:
                self.log("❌ READ: Invalid JSON response", "ERROR")
                return False
        else:
            self.log("❌ READ operation failed", "ERROR")
            return False
        
        # UPDATE - Test updating the rate card
        update_data = {
            'base_price_cents': 55000,  # $550.00
            'rush_pct': 25
        }
        
        success, response = self.test_api_endpoint('PATCH', f"{API_BASE}/rate-cards/{rate_card_id}", update_data)
        
        if success:
            try:
                update_result = response.json()
                if 'rateCard' in update_result and update_result.get('success'):
                    updated_price = update_result['rateCard']['base_price_cents']
                    if updated_price == 55000:
                        self.log(f"✅ UPDATE: Rate card price updated to ${updated_price/100:.2f}")
                    else:
                        self.log(f"❌ UPDATE: Price not updated correctly (expected 55000, got {updated_price})", "ERROR")
                        return False
                else:
                    self.log("❌ UPDATE: Invalid response structure", "ERROR")
                    return False
            except json.JSONDecodeError:
                self.log("❌ UPDATE: Invalid JSON response", "ERROR")
                return False
        else:
            self.log("❌ UPDATE operation failed", "ERROR")
            return False
        
        # DELETE - Test deleting the rate card (soft delete)
        success, response = self.test_api_endpoint('DELETE', f"{API_BASE}/rate-cards/{rate_card_id}")
        
        if success:
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
        else:
            self.log("❌ DELETE operation failed", "ERROR")
            return False
        
        return True
    
    def test_cache_management_system(self):
        """Test 3: Cache management system functionality"""
        self.log("🎯 TEST 3: Cache Management System")
        
        # Test rapid consecutive requests for cache consistency
        self.log("Testing cache consistency with rapid requests...")
        
        consistent_results = True
        first_result = None
        
        for i in range(3):
            success, response = self.test_api_endpoint('GET', f"{API_BASE}/rate-cards?creator_id={self.existing_creator_id}")
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
            
            time.sleep(0.2)  # Small delay between requests
        
        if consistent_results:
            self.log("✅ CACHE CONSISTENCY: Rapid requests returned consistent results")
            return True
        else:
            self.log("❌ CACHE CONSISTENCY: Inconsistent results detected", "ERROR")
            return False
    
    def test_no_backend_errors(self):
        """Test 4: No critical backend errors"""
        self.log("🎯 TEST 4: Backend Error Detection")
        
        # Test main rate cards endpoint
        success, response = self.test_api_endpoint('GET', f"{API_BASE}/rate-cards")
        
        if success:
            self.log("✅ Main rate cards endpoint working correctly")
            return True
        else:
            self.log("❌ Main rate cards endpoint has errors", "ERROR")
            return False
    
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
        """Run all focused tests"""
        self.log("🚀 Starting Focused Rate Card Backend Test")
        self.log(f"Testing against: {BASE_URL}")
        self.log(f"Using existing creator ID: {self.existing_creator_id}")
        
        test_results = {
            'api_accessibility': False,
            'crud_operations': False,
            'cache_management': False,
            'no_backend_errors': False
        }
        
        try:
            # Run all tests
            test_results['api_accessibility'] = self.test_rate_card_api_accessibility()
            test_results['crud_operations'] = self.test_crud_operations_with_existing_data()
            test_results['cache_management'] = self.test_cache_management_system()
            test_results['no_backend_errors'] = self.test_no_backend_errors()
            
        finally:
            # Always cleanup
            self.cleanup()
        
        # Generate summary
        self.log("\n" + "="*60)
        self.log("📊 FOCUSED RATE CARD TEST SUMMARY")
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
    test = FocusedRateCardTest()
    success = test.run_all_tests()
    exit(0 if success else 1)