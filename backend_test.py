#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Rate Cards API
Testing the critical rate card update functionality and service role authentication fixes
"""

import requests
import json
import uuid
import time
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

class RateCardsAPITester:
    def __init__(self):
        self.test_results = []
        # Use an existing creator ID from the database
        self.test_creator_id = "5b408260-4d3d-4392-a589-0a485a4152a9"
        self.created_rate_cards = []
        
    def log_test(self, test_name, success, details="", error=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "error": str(error) if error else None,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
        print()

    def test_rate_cards_get_empty(self):
        """Test GET /api/rate-cards with no data"""
        try:
            response = requests.get(f"{API_BASE}/rate-cards", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'rateCards' in data and isinstance(data['rateCards'], list):
                    self.log_test(
                        "GET Rate Cards (Empty State)", 
                        True, 
                        f"Status: {response.status_code}, Rate Cards: {len(data['rateCards'])}"
                    )
                    return True
                else:
                    self.log_test(
                        "GET Rate Cards (Empty State)", 
                        False, 
                        f"Invalid response structure: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "GET Rate Cards (Empty State)", 
                    False, 
                    f"Status: {response.status_code}, Response: {response.text[:200]}"
                )
                return False
                
        except Exception as e:
            self.log_test("GET Rate Cards (Empty State)", False, error=e)
            return False

    def test_rate_cards_create(self):
        """Test POST /api/rate-cards - Create new rate cards"""
        test_rate_cards = [
            {
                "creator_id": self.test_creator_id,
                "deliverable_type": "IG_Reel",
                "base_price_cents": 7500,  # $75.00 - matching the bug report scenario
                "currency": "USD",
                "rush_pct": 25
            },
            {
                "creator_id": self.test_creator_id,
                "deliverable_type": "IG_Story", 
                "base_price_cents": 2000,  # $20.00
                "currency": "USD",
                "rush_pct": 20
            },
            {
                "creator_id": self.test_creator_id,
                "deliverable_type": "TikTok_Post",
                "base_price_cents": 10000,  # $100.00
                "currency": "MYR",
                "rush_pct": 30
            }
        ]
        
        success_count = 0
        for i, rate_card_data in enumerate(test_rate_cards):
            try:
                response = requests.post(
                    f"{API_BASE}/rate-cards",
                    json=rate_card_data,
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                if response.status_code == 201:
                    data = response.json()
                    if data.get('success') and 'rateCard' in data:
                        rate_card = data['rateCard']
                        self.created_rate_cards.append(rate_card['id'])
                        
                        # Verify the created data matches input
                        if (rate_card['base_price_cents'] == rate_card_data['base_price_cents'] and
                            rate_card['deliverable_type'] == rate_card_data['deliverable_type'] and
                            rate_card['currency'] == rate_card_data['currency']):
                            
                            success_count += 1
                            self.log_test(
                                f"CREATE Rate Card {i+1} ({rate_card_data['deliverable_type']})",
                                True,
                                f"Created ID: {rate_card['id']}, Price: {rate_card['base_price_cents']} cents, Currency: {rate_card['currency']}"
                            )
                        else:
                            self.log_test(
                                f"CREATE Rate Card {i+1} ({rate_card_data['deliverable_type']})",
                                False,
                                f"Data mismatch - Expected: {rate_card_data}, Got: {rate_card}"
                            )
                    else:
                        self.log_test(
                            f"CREATE Rate Card {i+1} ({rate_card_data['deliverable_type']})",
                            False,
                            f"Invalid response structure: {data}"
                        )
                else:
                    self.log_test(
                        f"CREATE Rate Card {i+1} ({rate_card_data['deliverable_type']})",
                        False,
                        f"Status: {response.status_code}, Response: {response.text[:200]}"
                    )
                    
            except Exception as e:
                self.log_test(f"CREATE Rate Card {i+1} ({rate_card_data['deliverable_type']})", False, error=e)
        
        return success_count == len(test_rate_cards)

    def test_rate_cards_get_with_data(self):
        """Test GET /api/rate-cards with created data"""
        try:
            # Test general GET
            response = requests.get(f"{API_BASE}/rate-cards", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'rateCards' in data and len(data['rateCards']) >= len(self.created_rate_cards):
                    self.log_test(
                        "GET Rate Cards (With Data)",
                        True,
                        f"Status: {response.status_code}, Rate Cards Found: {len(data['rateCards'])}"
                    )
                    
                    # Test filtered GET by creator_id
                    response_filtered = requests.get(
                        f"{API_BASE}/rate-cards?creator_id={self.test_creator_id}",
                        timeout=10
                    )
                    
                    if response_filtered.status_code == 200:
                        filtered_data = response_filtered.json()
                        expected_count = len(self.created_rate_cards)
                        actual_count = len(filtered_data.get('rateCards', []))
                        
                        if actual_count == expected_count:
                            self.log_test(
                                "GET Rate Cards (Filtered by Creator)",
                                True,
                                f"Found {actual_count} rate cards for creator {self.test_creator_id}"
                            )
                            return True
                        else:
                            self.log_test(
                                "GET Rate Cards (Filtered by Creator)",
                                False,
                                f"Expected {expected_count} rate cards, got {actual_count}"
                            )
                            return False
                    else:
                        self.log_test(
                            "GET Rate Cards (Filtered by Creator)",
                            False,
                            f"Status: {response_filtered.status_code}"
                        )
                        return False
                else:
                    self.log_test(
                        "GET Rate Cards (With Data)",
                        False,
                        f"Expected at least {len(self.created_rate_cards)} rate cards, got {len(data.get('rateCards', []))}"
                    )
                    return False
            else:
                self.log_test(
                    "GET Rate Cards (With Data)",
                    False,
                    f"Status: {response.status_code}, Response: {response.text[:200]}"
                )
                return False
                
        except Exception as e:
            self.log_test("GET Rate Cards (With Data)", False, error=e)
            return False

    def test_rate_card_update_critical_scenario(self):
        """Test PATCH /api/rate-cards/[id] - The critical scenario from bug report"""
        if not self.created_rate_cards:
            self.log_test("UPDATE Rate Card (Critical Scenario)", False, "No rate cards created to update")
            return False
            
        # Find the IG_Reel rate card (7500 cents, 25% rush fee)
        try:
            response = requests.get(f"{API_BASE}/rate-cards?creator_id={self.test_creator_id}", timeout=10)
            if response.status_code != 200:
                self.log_test("UPDATE Rate Card (Critical Scenario)", False, "Failed to fetch rate cards for update test")
                return False
                
            data = response.json()
            ig_reel_card = None
            for card in data.get('rateCards', []):
                if card['deliverable_type'] == 'IG_Reel' and card['base_price_cents'] == 7500:
                    ig_reel_card = card
                    break
                    
            if not ig_reel_card:
                self.log_test("UPDATE Rate Card (Critical Scenario)", False, "IG_Reel card with 7500 cents not found")
                return False
                
            # Test the critical scenario: Update rush fee from 25% to 20%
            update_data = {
                "rush_pct": 20  # Change from 25% to 20%
            }
            
            response = requests.patch(
                f"{API_BASE}/rate-cards/{ig_reel_card['id']}",
                json=update_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                updated_data = response.json()
                if updated_data.get('success') and 'rateCard' in updated_data:
                    updated_card = updated_data['rateCard']
                    
                    # Verify the update worked correctly
                    if (updated_card['rush_pct'] == 20 and 
                        updated_card['base_price_cents'] == 7500 and  # Price should remain unchanged
                        updated_card['deliverable_type'] == 'IG_Reel'):
                        
                        self.log_test(
                            "UPDATE Rate Card (Critical Scenario)",
                            True,
                            f"Successfully updated rush fee from 25% to 20%. Price preserved: {updated_card['base_price_cents']} cents ($75.00)"
                        )
                        return True
                    else:
                        self.log_test(
                            "UPDATE Rate Card (Critical Scenario)",
                            False,
                            f"Update validation failed. Expected: rush_pct=20, base_price_cents=7500. Got: {updated_card}"
                        )
                        return False
                else:
                    self.log_test(
                        "UPDATE Rate Card (Critical Scenario)",
                        False,
                        f"Invalid response structure: {updated_data}"
                    )
                    return False
            else:
                self.log_test(
                    "UPDATE Rate Card (Critical Scenario)",
                    False,
                    f"Status: {response.status_code}, Response: {response.text[:200]}"
                )
                return False
                
        except Exception as e:
            self.log_test("UPDATE Rate Card (Critical Scenario)", False, error=e)
            return False

    def test_rate_card_update_price_scenario(self):
        """Test PATCH /api/rate-cards/[id] - Update price from $75.00 to $100.00"""
        if not self.created_rate_cards:
            self.log_test("UPDATE Rate Card (Price Change)", False, "No rate cards created to update")
            return False
            
        try:
            response = requests.get(f"{API_BASE}/rate-cards?creator_id={self.test_creator_id}", timeout=10)
            if response.status_code != 200:
                self.log_test("UPDATE Rate Card (Price Change)", False, "Failed to fetch rate cards for price update test")
                return False
                
            data = response.json()
            ig_reel_card = None
            for card in data.get('rateCards', []):
                if card['deliverable_type'] == 'IG_Reel':
                    ig_reel_card = card
                    break
                    
            if not ig_reel_card:
                self.log_test("UPDATE Rate Card (Price Change)", False, "IG_Reel card not found for price update")
                return False
                
            # Update price from 7500 cents ($75.00) to 10000 cents ($100.00)
            update_data = {
                "base_price_cents": 10000
            }
            
            response = requests.patch(
                f"{API_BASE}/rate-cards/{ig_reel_card['id']}",
                json=update_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                updated_data = response.json()
                if updated_data.get('success') and 'rateCard' in updated_data:
                    updated_card = updated_data['rateCard']
                    
                    if updated_card['base_price_cents'] == 10000:
                        self.log_test(
                            "UPDATE Rate Card (Price Change)",
                            True,
                            f"Successfully updated price from 7500 cents ($75.00) to 10000 cents ($100.00)"
                        )
                        return True
                    else:
                        self.log_test(
                            "UPDATE Rate Card (Price Change)",
                            False,
                            f"Price update failed. Expected: 10000 cents, Got: {updated_card['base_price_cents']} cents"
                        )
                        return False
                else:
                    self.log_test(
                        "UPDATE Rate Card (Price Change)",
                        False,
                        f"Invalid response structure: {updated_data}"
                    )
                    return False
            else:
                self.log_test(
                    "UPDATE Rate Card (Price Change)",
                    False,
                    f"Status: {response.status_code}, Response: {response.text[:200]}"
                )
                return False
                
        except Exception as e:
            self.log_test("UPDATE Rate Card (Price Change)", False, error=e)
            return False

    def test_validation_edge_cases(self):
        """Test API validation for edge cases"""
        edge_cases = [
            {
                "name": "Invalid Price (Zero)",
                "data": {
                    "creator_id": self.test_creator_id,
                    "deliverable_type": "IG_Reel",
                    "base_price_cents": 0,
                    "currency": "USD"
                },
                "expected_status": 400
            },
            {
                "name": "Invalid Price (Negative)",
                "data": {
                    "creator_id": self.test_creator_id,
                    "deliverable_type": "IG_Reel", 
                    "base_price_cents": -100,
                    "currency": "USD"
                },
                "expected_status": 400
            },
            {
                "name": "Invalid Currency",
                "data": {
                    "creator_id": self.test_creator_id,
                    "deliverable_type": "IG_Reel",
                    "base_price_cents": 5000,
                    "currency": "INVALID"
                },
                "expected_status": 400
            },
            {
                "name": "Invalid Deliverable Type",
                "data": {
                    "creator_id": self.test_creator_id,
                    "deliverable_type": "INVALID_TYPE",
                    "base_price_cents": 5000,
                    "currency": "USD"
                },
                "expected_status": 400
            },
            {
                "name": "Missing Required Field",
                "data": {
                    "deliverable_type": "IG_Reel",
                    "base_price_cents": 5000,
                    "currency": "USD"
                    # Missing creator_id
                },
                "expected_status": 400
            }
        ]
        
        success_count = 0
        for case in edge_cases:
            try:
                response = requests.post(
                    f"{API_BASE}/rate-cards",
                    json=case["data"],
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                if response.status_code == case["expected_status"]:
                    success_count += 1
                    self.log_test(
                        f"VALIDATION: {case['name']}",
                        True,
                        f"Correctly rejected with status {response.status_code}"
                    )
                else:
                    self.log_test(
                        f"VALIDATION: {case['name']}",
                        False,
                        f"Expected status {case['expected_status']}, got {response.status_code}"
                    )
                    
            except Exception as e:
                self.log_test(f"VALIDATION: {case['name']}", False, error=e)
        
        return success_count == len(edge_cases)

    def test_data_persistence(self):
        """Test that updates are properly persisted"""
        if not self.created_rate_cards:
            self.log_test("DATA PERSISTENCE", False, "No rate cards to test persistence")
            return False
            
        try:
            # Get current state
            response = requests.get(f"{API_BASE}/rate-cards?creator_id={self.test_creator_id}", timeout=10)
            if response.status_code != 200:
                self.log_test("DATA PERSISTENCE", False, "Failed to fetch rate cards for persistence test")
                return False
                
            data = response.json()
            rate_cards_before = data.get('rateCards', [])
            
            # Wait a moment and fetch again to ensure data persists
            time.sleep(2)
            
            response2 = requests.get(f"{API_BASE}/rate-cards?creator_id={self.test_creator_id}", timeout=10)
            if response2.status_code != 200:
                self.log_test("DATA PERSISTENCE", False, "Failed to re-fetch rate cards for persistence test")
                return False
                
            data2 = response2.json()
            rate_cards_after = data2.get('rateCards', [])
            
            # Compare the data
            if len(rate_cards_before) == len(rate_cards_after):
                # Check if the updated IG_Reel card still has the correct price
                ig_reel_before = next((card for card in rate_cards_before if card['deliverable_type'] == 'IG_Reel'), None)
                ig_reel_after = next((card for card in rate_cards_after if card['deliverable_type'] == 'IG_Reel'), None)
                
                if ig_reel_before and ig_reel_after:
                    if (ig_reel_before['base_price_cents'] == ig_reel_after['base_price_cents'] == 10000 and
                        ig_reel_before['rush_pct'] == ig_reel_after['rush_pct'] == 20):
                        
                        self.log_test(
                            "DATA PERSISTENCE",
                            True,
                            f"Data persisted correctly. IG_Reel: {ig_reel_after['base_price_cents']} cents, {ig_reel_after['rush_pct']}% rush"
                        )
                        return True
                    else:
                        self.log_test(
                            "DATA PERSISTENCE",
                            False,
                            f"Data changed unexpectedly. Before: {ig_reel_before}, After: {ig_reel_after}"
                        )
                        return False
                else:
                    self.log_test("DATA PERSISTENCE", False, "IG_Reel card not found in persistence test")
                    return False
            else:
                self.log_test(
                    "DATA PERSISTENCE",
                    False,
                    f"Rate card count changed. Before: {len(rate_cards_before)}, After: {len(rate_cards_after)}"
                )
                return False
                
        except Exception as e:
            self.log_test("DATA PERSISTENCE", False, error=e)
            return False

    def cleanup_test_data(self):
        """Clean up created test data"""
        cleanup_count = 0
        for rate_card_id in self.created_rate_cards:
            try:
                response = requests.delete(f"{API_BASE}/rate-cards/{rate_card_id}", timeout=10)
                if response.status_code == 200:
                    cleanup_count += 1
            except Exception as e:
                print(f"Failed to cleanup rate card {rate_card_id}: {e}")
        
        self.log_test(
            "CLEANUP Test Data",
            cleanup_count == len(self.created_rate_cards),
            f"Cleaned up {cleanup_count}/{len(self.created_rate_cards)} rate cards"
        )

    def run_all_tests(self):
        """Run all rate cards API tests"""
        print("🚀 Starting Comprehensive Rate Cards API Testing")
        print("=" * 60)
        print(f"Testing against: {API_BASE}")
        print(f"Test Creator ID: {self.test_creator_id}")
        print()
        
        # Test sequence
        tests = [
            ("Initial State", self.test_rate_cards_get_empty),
            ("Create Rate Cards", self.test_rate_cards_create),
            ("Fetch Created Data", self.test_rate_cards_get_with_data),
            ("Critical Update Scenario", self.test_rate_card_update_critical_scenario),
            ("Price Update Scenario", self.test_rate_card_update_price_scenario),
            ("Validation Edge Cases", self.test_validation_edge_cases),
            ("Data Persistence", self.test_data_persistence)
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            print(f"🧪 Running: {test_name}")
            if test_func():
                passed_tests += 1
            print()
        
        # Cleanup
        print("🧹 Cleaning up test data...")
        self.cleanup_test_data()
        print()
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print()
        
        # Detailed results
        print("📋 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}")
            if result['details']:
                print(f"   {result['details']}")
            if result['error']:
                print(f"   Error: {result['error']}")
        
        return passed_tests == total_tests

def main():
    """Main function"""
    tester = RateCardsAPITester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 ALL TESTS PASSED! Rate Cards API is working correctly.")
    else:
        print("\n⚠️  SOME TESTS FAILED. Check the detailed results above.")
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()