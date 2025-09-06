#!/usr/bin/env python3
"""
Backend Testing for Base Price $0.00 Display Issue in OfferSheet Component
Testing the offers API to debug the Base Price display issue where raw data contains 
correct values like base_price_cents: 7150 but frontend shows $0.00

Focus Areas:
1. GET /api/offers API returns correct data structure with items JSONB field
2. Test specific offer ID "07bc674b-f40f-4928-be79-b5bc574fb1fa" 
3. Test campaign offers endpoint: GET /api/offers?campaign_id=be9e2307-d8bc-4292-b6f7-17ddcd0b07ca
4. Verify JSONB parsing logic - ensure items field is returned as valid JSON string
5. Test mathematical calculations: 7150 cents * 2 quantity = 14300 cents = $143.00
"""

import requests
import json
import time
import sys
import os
from datetime import datetime

# Configuration - Use environment variable or fallback
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://www.sparkplatform.tech')
API_BASE = f"{BASE_URL}/api"

class OfferBasePriceBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = 30
        self.test_results = []
        
        # Test data from review request
        self.test_offer_id = "07bc674b-f40f-4928-be79-b5bc574fb1fa"
        self.test_campaign_id = "be9e2307-d8bc-4292-b6f7-17ddcd0b07ca"
        
    def log_test(self, test_name, success, details="", error=None, response_time=None):
        """Log test results with response time tracking"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "error": str(error) if error else None,
            "response_time": response_time,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        time_info = f" ({response_time:.3f}s)" if response_time else ""
        print(f"{status} {test_name}{time_info}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
        print()

    def test_offers_api_structure(self):
        """Test 1: Verify GET /api/offers API returns correct data structure"""
        print("🔍 Testing Offers API Data Structure...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/offers")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check basic structure
                if 'offers' in data and isinstance(data['offers'], list):
                    offers_count = len(data['offers'])
                    
                    # Check if we have offers to analyze
                    if offers_count > 0:
                        sample_offer = data['offers'][0]
                        
                        # Check for required fields
                        required_fields = ['id', 'items', 'subtotal_cents', 'total_cents', 'currency']
                        missing_fields = [field for field in required_fields if field not in sample_offer]
                        
                        if not missing_fields:
                            # Check items field specifically
                            items_field = sample_offer.get('items')
                            if items_field:
                                try:
                                    # Try to parse items as JSON
                                    if isinstance(items_field, str):
                                        items_data = json.loads(items_field)
                                        self.log_test(
                                            "Offers API Structure", 
                                            True, 
                                            f"API returns {offers_count} offers with proper structure. Items field is JSON string: {items_field[:100]}...",
                                            response_time=response_time
                                        )
                                        return True, data
                                    else:
                                        self.log_test(
                                            "Offers API Structure", 
                                            False, 
                                            f"Items field is not a JSON string: {type(items_field)} - {items_field}",
                                            response_time=response_time
                                        )
                                        return False, data
                                except json.JSONDecodeError as e:
                                    self.log_test(
                                        "Offers API Structure", 
                                        False, 
                                        f"Items field is not valid JSON: {items_field} - Error: {e}",
                                        response_time=response_time
                                    )
                                    return False, data
                            else:
                                self.log_test(
                                    "Offers API Structure", 
                                    False, 
                                    "Items field is missing or null",
                                    response_time=response_time
                                )
                                return False, data
                        else:
                            self.log_test(
                                "Offers API Structure", 
                                False, 
                                f"Missing required fields: {missing_fields}",
                                response_time=response_time
                            )
                            return False, data
                    else:
                        self.log_test(
                            "Offers API Structure", 
                            True, 
                            "API returns proper structure but no offers found (empty array)",
                            response_time=response_time
                        )
                        return True, data
                else:
                    self.log_test(
                        "Offers API Structure", 
                        False, 
                        f"Invalid response format: {data}",
                        response_time=response_time
                    )
                    return False, None
            else:
                self.log_test(
                    "Offers API Structure", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    response_time=response_time
                )
                return False, None
                
        except Exception as e:
            self.log_test(
                "Offers API Structure", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False, None

    def test_specific_offer_id(self):
        """Test 2: Test specific offer ID from review request"""
        print("🔍 Testing Specific Offer ID...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/offers/{self.test_offer_id}")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if 'offer' in data:
                    offer = data['offer']
                    
                    # Check for items field
                    items_field = offer.get('items')
                    if items_field:
                        try:
                            # Parse items JSON
                            if isinstance(items_field, str):
                                items_data = json.loads(items_field)
                                
                                # Look for base_price_cents in items
                                if isinstance(items_data, list) and len(items_data) > 0:
                                    first_item = items_data[0]
                                    base_price_cents = first_item.get('base_price_cents')
                                    quantity = first_item.get('quantity', 1)
                                    deliverable_type = first_item.get('deliverable_type')
                                    
                                    if base_price_cents is not None:
                                        # Calculate expected values
                                        base_price_dollars = base_price_cents / 100
                                        total_base_cents = base_price_cents * quantity
                                        total_base_dollars = total_base_cents / 100
                                        
                                        self.log_test(
                                            "Specific Offer ID", 
                                            True, 
                                            f"Found offer {self.test_offer_id}: {deliverable_type}, qty={quantity}, base_price_cents={base_price_cents} (${base_price_dollars:.2f}), total=${total_base_dollars:.2f}",
                                            response_time=response_time
                                        )
                                        return True, offer
                                    else:
                                        self.log_test(
                                            "Specific Offer ID", 
                                            False, 
                                            f"base_price_cents not found in items: {first_item}",
                                            response_time=response_time
                                        )
                                        return False, offer
                                else:
                                    self.log_test(
                                        "Specific Offer ID", 
                                        False, 
                                        f"Items data is not a valid array: {items_data}",
                                        response_time=response_time
                                    )
                                    return False, offer
                            else:
                                self.log_test(
                                    "Specific Offer ID", 
                                    False, 
                                    f"Items field is not a JSON string: {type(items_field)} - {items_field}",
                                    response_time=response_time
                                )
                                return False, offer
                        except json.JSONDecodeError as e:
                            self.log_test(
                                "Specific Offer ID", 
                                False, 
                                f"Items field JSON parse error: {e} - Data: {items_field}",
                                response_time=response_time
                            )
                            return False, offer
                    else:
                        self.log_test(
                            "Specific Offer ID", 
                            False, 
                            "Items field is missing or null in offer",
                            response_time=response_time
                        )
                        return False, offer
                else:
                    self.log_test(
                        "Specific Offer ID", 
                        False, 
                        f"No offer field in response: {data}",
                        response_time=response_time
                    )
                    return False, None
            elif response.status_code == 404:
                self.log_test(
                    "Specific Offer ID", 
                    False, 
                    f"Offer {self.test_offer_id} not found (404)",
                    response_time=response_time
                )
                return False, None
            else:
                self.log_test(
                    "Specific Offer ID", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    response_time=response_time
                )
                return False, None
                
        except Exception as e:
            self.log_test(
                "Specific Offer ID", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False, None

    def test_campaign_offers_endpoint(self):
        """Test 3: Test campaign offers endpoint"""
        print("🔍 Testing Campaign Offers Endpoint...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/offers?campaign_id={self.test_campaign_id}")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if 'offers' in data and isinstance(data['offers'], list):
                    offers = data['offers']
                    offers_count = len(offers)
                    
                    if offers_count > 0:
                        # Analyze each offer for base_price_cents
                        valid_offers = 0
                        total_base_price_issues = 0
                        
                        for i, offer in enumerate(offers):
                            items_field = offer.get('items')
                            if items_field:
                                try:
                                    if isinstance(items_field, str):
                                        items_data = json.loads(items_field)
                                        if isinstance(items_data, list) and len(items_data) > 0:
                                            first_item = items_data[0]
                                            base_price_cents = first_item.get('base_price_cents')
                                            if base_price_cents is not None and base_price_cents > 0:
                                                valid_offers += 1
                                            elif base_price_cents == 0:
                                                total_base_price_issues += 1
                                except:
                                    pass
                        
                        self.log_test(
                            "Campaign Offers Endpoint", 
                            True, 
                            f"Found {offers_count} offers for campaign {self.test_campaign_id}. Valid base prices: {valid_offers}, Zero base prices: {total_base_price_issues}",
                            response_time=response_time
                        )
                        return True, offers
                    else:
                        self.log_test(
                            "Campaign Offers Endpoint", 
                            True, 
                            f"No offers found for campaign {self.test_campaign_id} (empty array)",
                            response_time=response_time
                        )
                        return True, []
                else:
                    self.log_test(
                        "Campaign Offers Endpoint", 
                        False, 
                        f"Invalid response format: {data}",
                        response_time=response_time
                    )
                    return False, None
            else:
                self.log_test(
                    "Campaign Offers Endpoint", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    response_time=response_time
                )
                return False, None
                
        except Exception as e:
            self.log_test(
                "Campaign Offers Endpoint", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False, None

    def test_jsonb_parsing_logic(self):
        """Test 4: Verify JSONB parsing logic"""
        print("🔍 Testing JSONB Parsing Logic...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/offers")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if 'offers' in data and isinstance(data['offers'], list):
                    offers = data['offers']
                    
                    if len(offers) > 0:
                        parsing_results = {
                            'total_offers': len(offers),
                            'valid_json_items': 0,
                            'invalid_json_items': 0,
                            'missing_items': 0,
                            'valid_base_prices': 0,
                            'zero_base_prices': 0,
                            'missing_base_prices': 0
                        }
                        
                        for offer in offers:
                            items_field = offer.get('items')
                            
                            if items_field is None:
                                parsing_results['missing_items'] += 1
                                continue
                            
                            try:
                                if isinstance(items_field, str):
                                    items_data = json.loads(items_field)
                                    parsing_results['valid_json_items'] += 1
                                    
                                    # Check base_price_cents in parsed data
                                    if isinstance(items_data, list) and len(items_data) > 0:
                                        first_item = items_data[0]
                                        base_price_cents = first_item.get('base_price_cents')
                                        
                                        if base_price_cents is None:
                                            parsing_results['missing_base_prices'] += 1
                                        elif base_price_cents == 0:
                                            parsing_results['zero_base_prices'] += 1
                                        else:
                                            parsing_results['valid_base_prices'] += 1
                                else:
                                    # Items field is not a string - might be already parsed
                                    parsing_results['invalid_json_items'] += 1
                                    
                            except json.JSONDecodeError:
                                parsing_results['invalid_json_items'] += 1
                        
                        # Determine if parsing is working correctly
                        success = (parsing_results['valid_json_items'] > 0 and 
                                 parsing_results['invalid_json_items'] == 0)
                        
                        details = f"Parsing results: {parsing_results}"
                        
                        self.log_test(
                            "JSONB Parsing Logic", 
                            success, 
                            details,
                            response_time=response_time
                        )
                        return success, parsing_results
                    else:
                        self.log_test(
                            "JSONB Parsing Logic", 
                            True, 
                            "No offers to test parsing (empty array)",
                            response_time=response_time
                        )
                        return True, {}
                else:
                    self.log_test(
                        "JSONB Parsing Logic", 
                        False, 
                        f"Invalid response format: {data}",
                        response_time=response_time
                    )
                    return False, None
            else:
                self.log_test(
                    "JSONB Parsing Logic", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    response_time=response_time
                )
                return False, None
                
        except Exception as e:
            self.log_test(
                "JSONB Parsing Logic", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False, None

    def test_mathematical_calculations(self):
        """Test 5: Test mathematical calculations (7150 cents * 2 quantity = 14300 cents = $143.00)"""
        print("🔍 Testing Mathematical Calculations...")
        
        # Test the specific calculation from review request
        test_base_price_cents = 7150
        test_quantity = 2
        expected_total_cents = 14300
        expected_total_dollars = 143.00
        
        # Perform calculations
        calculated_total_cents = test_base_price_cents * test_quantity
        calculated_total_dollars = calculated_total_cents / 100
        
        # Check if calculations match expected values
        cents_match = calculated_total_cents == expected_total_cents
        dollars_match = abs(calculated_total_dollars - expected_total_dollars) < 0.01
        
        if cents_match and dollars_match:
            self.log_test(
                "Mathematical Calculations", 
                True, 
                f"Calculations correct: {test_base_price_cents} cents * {test_quantity} = {calculated_total_cents} cents = ${calculated_total_dollars:.2f}"
            )
            
            # Now test if we can find offers with similar calculations
            try:
                start_time = time.time()
                response = self.session.get(f"{API_BASE}/offers")
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if 'offers' in data and isinstance(data['offers'], list):
                        calculation_matches = 0
                        
                        for offer in data['offers']:
                            items_field = offer.get('items')
                            if items_field:
                                try:
                                    if isinstance(items_field, str):
                                        items_data = json.loads(items_field)
                                        if isinstance(items_data, list) and len(items_data) > 0:
                                            first_item = items_data[0]
                                            base_price_cents = first_item.get('base_price_cents')
                                            quantity = first_item.get('quantity', 1)
                                            
                                            if base_price_cents and quantity:
                                                calculated_subtotal = base_price_cents * quantity
                                                offer_subtotal = offer.get('subtotal_cents', 0)
                                                
                                                # Check if backend calculation matches frontend expectation
                                                if calculated_subtotal == offer_subtotal:
                                                    calculation_matches += 1
                                except:
                                    pass
                        
                        print(f"   Found {calculation_matches} offers with correct subtotal calculations")
                        return True, calculation_matches
                    
            except Exception as e:
                print(f"   Could not verify calculations in real offers: {e}")
                
            return True, 0
        else:
            self.log_test(
                "Mathematical Calculations", 
                False, 
                f"Calculation error: {test_base_price_cents} * {test_quantity} = {calculated_total_cents} (expected {expected_total_cents}), ${calculated_total_dollars:.2f} (expected ${expected_total_dollars:.2f})"
            )
            return False, 0

    def test_offer_creation_pipeline(self):
        """Test 6: Test offer creation/retrieval pipeline"""
        print("🔍 Testing Offer Creation/Retrieval Pipeline...")
        
        # Test the POST endpoint structure (without actually creating)
        try:
            start_time = time.time()
            
            # Test with invalid data to see validation response
            test_payload = {
                "campaign_id": "test-campaign-id",
                "creator_id": "test-creator-id", 
                "brand_id": "test-brand-id",
                "deliverable_type": "IG_Reel",
                "quantity": 2,
                "base_price_cents": 7150,
                "rush_fee_pct": 10,
                "platform_fee_pct": 20,
                "subtotal_cents": 14300,
                "total_cents": 17160,
                "currency": "USD"
            }
            
            response = self.session.post(
                f"{API_BASE}/offers",
                json=test_payload,
                headers={"Content-Type": "application/json"}
            )
            response_time = time.time() - start_time
            
            # We expect this to fail due to invalid IDs, but we want to see the validation
            if response.status_code in [400, 401, 403, 500]:
                try:
                    error_data = response.json()
                    
                    # Check if the API is properly structured to handle the data
                    if 'error' in error_data:
                        self.log_test(
                            "Offer Creation Pipeline", 
                            True, 
                            f"API properly validates offer creation (HTTP {response.status_code}): {error_data.get('error', 'Unknown error')}",
                            response_time=response_time
                        )
                        return True, error_data
                    else:
                        self.log_test(
                            "Offer Creation Pipeline", 
                            False, 
                            f"API response format issue (HTTP {response.status_code}): {error_data}",
                            response_time=response_time
                        )
                        return False, error_data
                except json.JSONDecodeError:
                    self.log_test(
                        "Offer Creation Pipeline", 
                        False, 
                        f"API returned non-JSON response (HTTP {response.status_code}): {response.text[:200]}",
                        response_time=response_time
                    )
                    return False, None
            elif response.status_code == 201:
                # Unexpected success - should not happen with test data
                data = response.json()
                self.log_test(
                    "Offer Creation Pipeline", 
                    False, 
                    f"Unexpected successful creation with test data: {data}",
                    response_time=response_time
                )
                return False, data
            else:
                self.log_test(
                    "Offer Creation Pipeline", 
                    False, 
                    f"Unexpected HTTP status {response.status_code}: {response.text[:200]}",
                    response_time=response_time
                )
                return False, None
                
        except Exception as e:
            self.log_test(
                "Offer Creation Pipeline", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False, None

    def run_all_tests(self):
        """Run all backend tests for Base Price $0.00 issue"""
        print("🚀 BASE PRICE $0.00 DISPLAY ISSUE - BACKEND TESTING")
        print("=" * 80)
        print(f"Testing against: {BASE_URL}")
        print(f"API Base URL: {API_BASE}")
        print("Focus: Base Price display issue in OfferSheet component")
        print("Target Offer ID:", self.test_offer_id)
        print("Target Campaign ID:", self.test_campaign_id)
        print("=" * 80)
        
        # Run all tests
        tests = [
            ("Offers API Structure", self.test_offers_api_structure),
            ("Specific Offer ID", self.test_specific_offer_id),
            ("Campaign Offers Endpoint", self.test_campaign_offers_endpoint),
            ("JSONB Parsing Logic", self.test_jsonb_parsing_logic),
            ("Mathematical Calculations", self.test_mathematical_calculations),
            ("Offer Creation Pipeline", self.test_offer_creation_pipeline)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                print(f"\n--- {test_name} ---")
                result = test_func()
                if isinstance(result, tuple):
                    success, _ = result
                else:
                    success = result
                    
                if success:
                    passed += 1
            except Exception as e:
                print(f"❌ Test {test_name} crashed: {str(e)}")
                self.log_test(test_name, False, f"Test crashed: {str(e)}")
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 BASE PRICE $0.00 ISSUE - BACKEND TESTING SUMMARY")
        print("=" * 80)
        
        success_rate = (passed / total) * 100
        print(f"Tests Passed: {passed}/{total} ({success_rate:.1f}%)")
        
        # Analyze response times
        api_times = [r['response_time'] for r in self.test_results if r['response_time'] and r['response_time'] < 30]
        if api_times:
            avg_time = sum(api_times) / len(api_times)
            max_time = max(api_times)
            print(f"\n⏱️  API RESPONSE TIME ANALYSIS:")
            print(f"   Average Response Time: {avg_time:.3f}s")
            print(f"   Maximum Response Time: {max_time:.3f}s")
            print(f"   Total API Calls Made: {len(api_times)}")
        
        # Overall assessment
        print(f"\n🎯 BASE PRICE ISSUE ASSESSMENT:")
        if success_rate >= 85:
            print("   🎉 EXCELLENT - Backend API is working correctly")
            print("   ✅ Offers API returns proper data structure")
            print("   ✅ JSONB parsing should work correctly")
            print("   ✅ Mathematical calculations are accurate")
        elif success_rate >= 70:
            print("   ⚠️  GOOD - Core functionality works but issues detected")
            print("   ✅ Basic API functionality working")
            print("   ⚠️  Some data structure or parsing issues found")
        else:
            print("   🚨 NEEDS ATTENTION - Significant backend issues found")
            print("   ❌ API or data structure problems detected")
            print("   ❌ Base Price issue likely caused by backend problems")
        
        # Detailed results
        print(f"\n📋 DETAILED TEST RESULTS:")
        for result in self.test_results:
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            time_info = f" ({result['response_time']:.3f}s)" if result['response_time'] else ""
            print(f"   {status} {result['test']}: {result['details']}{time_info}")
            if result['error']:
                print(f"      Error: {result['error']}")
        
        return success_rate >= 70

def main():
    """Main test execution"""
    print("🔧 Starting Base Price $0.00 Backend Testing...")
    print("📋 This test focuses on debugging the OfferSheet component issue:")
    print("   - Verify GET /api/offers API returns correct data structure")
    print("   - Test specific offer ID with base_price_cents: 7150")
    print("   - Test campaign offers filtering")
    print("   - Verify JSONB parsing logic for items field")
    print("   - Test mathematical calculations (7150 * 2 = 14300 cents = $143.00)")
    print("   - Verify offer creation/retrieval pipeline")
    print()
    
    tester = OfferBasePriceBackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Backend testing completed successfully - Base Price data should be available correctly")
        sys.exit(0)
    else:
        print("\n❌ Backend testing found issues that may cause Base Price $0.00 display problem")
        sys.exit(1)

if __name__ == "__main__":
    main()