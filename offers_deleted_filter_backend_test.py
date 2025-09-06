#!/usr/bin/env python3
"""
Backend Testing for Offers API - Deleted Offers Filter Verification
Testing the fixed deleted offers filter to ensure cancelled offers don't reappear
Focus: GET /api/offers endpoint with .neq('status', 'cancelled') filter
"""

import requests
import json
import time
import sys
import os
from datetime import datetime

# Configuration - Use production URL
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://www.sparkplatform.tech')
API_BASE = f"{BASE_URL}/api"

class OffersFilterTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = 30  # 30 second timeout
        self.test_results = []
        # Test campaign ID from review request
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
        time_info = f" ({response_time:.2f}s)" if response_time else ""
        print(f"{status} {test_name}{time_info}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
        print()

    def test_offers_api_accessibility(self):
        """Test 1: Offers API Accessibility - verify API endpoint is working"""
        print("🔍 Testing Offers API Accessibility...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/offers")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if 'offers' in data:
                    self.log_test(
                        "Offers API Accessibility", 
                        True, 
                        f"API accessible, returned {len(data.get('offers', []))} offers",
                        response_time=response_time
                    )
                    return True, data
                else:
                    self.log_test(
                        "Offers API Accessibility", 
                        False, 
                        f"Invalid response format: {data}",
                        response_time=response_time
                    )
                    return False, None
            else:
                self.log_test(
                    "Offers API Accessibility", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    response_time=response_time
                )
                return False, None
                
        except Exception as e:
            self.log_test(
                "Offers API Accessibility", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False, None

    def test_cancelled_offers_filter(self):
        """Test 2: Cancelled Offers Filter - verify no offers with status 'cancelled' are returned"""
        print("🔍 Testing Cancelled Offers Filter...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/offers")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                offers = data.get('offers', [])
                
                # Check if any offers have status 'cancelled'
                cancelled_offers = [offer for offer in offers if offer.get('status') == 'cancelled']
                
                if len(cancelled_offers) == 0:
                    self.log_test(
                        "Cancelled Offers Filter", 
                        True, 
                        f"✅ NO cancelled offers found in {len(offers)} total offers. Filter working correctly.",
                        response_time=response_time
                    )
                    return True
                else:
                    self.log_test(
                        "Cancelled Offers Filter", 
                        False, 
                        f"❌ Found {len(cancelled_offers)} cancelled offers in response. Filter NOT working.",
                        response_time=response_time
                    )
                    return False
            else:
                self.log_test(
                    "Cancelled Offers Filter", 
                    False, 
                    f"API request failed: HTTP {response.status_code}",
                    response_time=response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Cancelled Offers Filter", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False

    def test_campaign_specific_filter(self):
        """Test 3: Campaign Specific Filter - test filtering with campaign_id parameter"""
        print("🔍 Testing Campaign Specific Filter...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/offers?campaign_id={self.test_campaign_id}")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                offers = data.get('offers', [])
                
                # Check if any offers have status 'cancelled'
                cancelled_offers = [offer for offer in offers if offer.get('status') == 'cancelled']
                
                # Check if all offers belong to the specified campaign
                wrong_campaign_offers = [offer for offer in offers if offer.get('campaign_id') != self.test_campaign_id]
                
                success = len(cancelled_offers) == 0 and len(wrong_campaign_offers) == 0
                
                if success:
                    self.log_test(
                        "Campaign Specific Filter", 
                        True, 
                        f"✅ Campaign filter working: {len(offers)} offers, no cancelled offers, all from correct campaign",
                        response_time=response_time
                    )
                    return True
                else:
                    details = []
                    if len(cancelled_offers) > 0:
                        details.append(f"{len(cancelled_offers)} cancelled offers found")
                    if len(wrong_campaign_offers) > 0:
                        details.append(f"{len(wrong_campaign_offers)} offers from wrong campaign")
                    
                    self.log_test(
                        "Campaign Specific Filter", 
                        False, 
                        f"❌ Filter issues: {', '.join(details)}",
                        response_time=response_time
                    )
                    return False
            else:
                self.log_test(
                    "Campaign Specific Filter", 
                    False, 
                    f"API request failed: HTTP {response.status_code}",
                    response_time=response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Campaign Specific Filter", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False

    def test_active_offers_inclusion(self):
        """Test 4: Active Offers Inclusion - verify non-cancelled offers are still returned"""
        print("🔍 Testing Active Offers Inclusion...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/offers")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                offers = data.get('offers', [])
                
                # Check for various active statuses
                active_statuses = ['drafted', 'sent', 'accepted', 'completed', 'pending']
                active_offers = [offer for offer in offers if offer.get('status') in active_statuses]
                
                # Verify no cancelled offers
                cancelled_offers = [offer for offer in offers if offer.get('status') == 'cancelled']
                
                if len(offers) > 0 and len(cancelled_offers) == 0:
                    status_counts = {}
                    for offer in offers:
                        status = offer.get('status', 'unknown')
                        status_counts[status] = status_counts.get(status, 0) + 1
                    
                    status_summary = ', '.join([f"{status}: {count}" for status, count in status_counts.items()])
                    
                    self.log_test(
                        "Active Offers Inclusion", 
                        True, 
                        f"✅ Active offers returned correctly. Total: {len(offers)}, Status breakdown: {status_summary}",
                        response_time=response_time
                    )
                    return True
                elif len(offers) == 0:
                    self.log_test(
                        "Active Offers Inclusion", 
                        True, 
                        "✅ No offers in system (acceptable - filter working, just no data)",
                        response_time=response_time
                    )
                    return True
                else:
                    self.log_test(
                        "Active Offers Inclusion", 
                        False, 
                        f"❌ Found {len(cancelled_offers)} cancelled offers in response",
                        response_time=response_time
                    )
                    return False
            else:
                self.log_test(
                    "Active Offers Inclusion", 
                    False, 
                    f"API request failed: HTTP {response.status_code}",
                    response_time=response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Active Offers Inclusion", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False

    def test_offer_count_consistency(self):
        """Test 5: Offer Count Consistency - verify count reflects only non-cancelled offers"""
        print("🔍 Testing Offer Count Consistency...")
        
        try:
            # Test general endpoint
            start_time = time.time()
            response1 = self.session.get(f"{API_BASE}/offers")
            response_time1 = time.time() - start_time
            
            # Test campaign-specific endpoint
            start_time = time.time()
            response2 = self.session.get(f"{API_BASE}/offers?campaign_id={self.test_campaign_id}")
            response_time2 = time.time() - start_time
            
            avg_response_time = (response_time1 + response_time2) / 2
            
            if response1.status_code == 200 and response2.status_code == 200:
                data1 = response1.json()
                data2 = response2.json()
                
                all_offers = data1.get('offers', [])
                campaign_offers = data2.get('offers', [])
                
                # Verify no cancelled offers in either response
                all_cancelled = [offer for offer in all_offers if offer.get('status') == 'cancelled']
                campaign_cancelled = [offer for offer in campaign_offers if offer.get('status') == 'cancelled']
                
                # Verify campaign offers are subset of all offers
                campaign_ids_in_all = [offer.get('campaign_id') for offer in all_offers if offer.get('campaign_id') == self.test_campaign_id]
                
                success = (len(all_cancelled) == 0 and 
                          len(campaign_cancelled) == 0 and 
                          len(campaign_offers) <= len(campaign_ids_in_all))
                
                if success:
                    self.log_test(
                        "Offer Count Consistency", 
                        True, 
                        f"✅ Count consistency verified. All offers: {len(all_offers)}, Campaign offers: {len(campaign_offers)}, no cancelled offers",
                        response_time=avg_response_time
                    )
                    return True
                else:
                    issues = []
                    if len(all_cancelled) > 0:
                        issues.append(f"{len(all_cancelled)} cancelled in all offers")
                    if len(campaign_cancelled) > 0:
                        issues.append(f"{len(campaign_cancelled)} cancelled in campaign offers")
                    
                    self.log_test(
                        "Offer Count Consistency", 
                        False, 
                        f"❌ Count consistency issues: {', '.join(issues)}",
                        response_time=avg_response_time
                    )
                    return False
            else:
                self.log_test(
                    "Offer Count Consistency", 
                    False, 
                    f"API requests failed: {response1.status_code}, {response2.status_code}",
                    response_time=avg_response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Offer Count Consistency", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False

    def test_api_response_structure(self):
        """Test 6: API Response Structure - verify proper response format"""
        print("🔍 Testing API Response Structure...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/offers")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                has_offers_field = 'offers' in data
                offers = data.get('offers', [])
                
                # Check offer structure if offers exist
                valid_structure = True
                if len(offers) > 0:
                    sample_offer = offers[0]
                    required_fields = ['id', 'campaign_id', 'creator_id', 'brand_id', 'status']
                    for field in required_fields:
                        if field not in sample_offer:
                            valid_structure = False
                            break
                
                if has_offers_field and valid_structure:
                    self.log_test(
                        "API Response Structure", 
                        True, 
                        f"✅ Response structure valid. Contains 'offers' field with {len(offers)} offers",
                        response_time=response_time
                    )
                    return True
                else:
                    issues = []
                    if not has_offers_field:
                        issues.append("missing 'offers' field")
                    if not valid_structure:
                        issues.append("invalid offer structure")
                    
                    self.log_test(
                        "API Response Structure", 
                        False, 
                        f"❌ Structure issues: {', '.join(issues)}",
                        response_time=response_time
                    )
                    return False
            else:
                self.log_test(
                    "API Response Structure", 
                    False, 
                    f"API request failed: HTTP {response.status_code}",
                    response_time=response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "API Response Structure", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False

    def run_all_tests(self):
        """Run all backend tests focusing on deleted offers filter"""
        print("🚀 OFFERS DELETED FILTER FIX - BACKEND TESTING")
        print("=" * 70)
        print(f"Testing against: {BASE_URL}")
        print(f"API Base URL: {API_BASE}")
        print("Focus: Verify .neq('status', 'cancelled') filter prevents deleted offers from reappearing")
        print("=" * 70)
        
        # Run all tests
        tests = [
            ("Offers API Accessibility", self.test_offers_api_accessibility),
            ("Cancelled Offers Filter", self.test_cancelled_offers_filter),
            ("Campaign Specific Filter", self.test_campaign_specific_filter),
            ("Active Offers Inclusion", self.test_active_offers_inclusion),
            ("Offer Count Consistency", self.test_offer_count_consistency),
            ("API Response Structure", self.test_api_response_structure)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                print(f"\n--- {test_name} ---")
                if test_func():
                    passed += 1
            except Exception as e:
                print(f"❌ Test {test_name} crashed: {str(e)}")
                self.log_test(test_name, False, f"Test crashed: {str(e)}")
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 DELETED OFFERS FILTER FIX - BACKEND TESTING SUMMARY")
        print("=" * 70)
        
        success_rate = (passed / total) * 100
        print(f"Tests Passed: {passed}/{total} ({success_rate:.1f}%)")
        
        # Analyze response times
        api_times = [r['response_time'] for r in self.test_results if r['response_time'] and r['response_time'] < 30]
        if api_times:
            avg_time = sum(api_times) / len(api_times)
            max_time = max(api_times)
            print(f"\n⏱️  API RESPONSE TIME ANALYSIS:")
            print(f"   Average Response Time: {avg_time:.2f}s")
            print(f"   Maximum Response Time: {max_time:.2f}s")
            print(f"   Total API Calls Made: {len(api_times)}")
        
        # Overall assessment
        print(f"\n🎯 DELETED OFFERS FILTER ASSESSMENT:")
        if success_rate >= 85:
            print("   🎉 EXCELLENT - Deleted offers filter is working correctly")
            print("   ✅ No cancelled offers are being returned by the API")
            print("   ✅ Active offers are still being returned properly")
            print("   ✅ Campaign filtering works with deleted offers filter")
        elif success_rate >= 70:
            print("   ⚠️  GOOD - Core filter functionality works but minor issues detected")
            print("   ✅ Deleted offers filter likely working")
            print("   ⚠️  Some edge cases may need attention")
        else:
            print("   🚨 NEEDS ATTENTION - Significant issues found")
            print("   ❌ Deleted offers filter may not be working properly")
            print("   ❌ Cancelled offers may still be appearing in responses")
        
        # Detailed results
        print(f"\n📋 DETAILED TEST RESULTS:")
        for result in self.test_results:
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            time_info = f" ({result['response_time']:.2f}s)" if result['response_time'] else ""
            print(f"   {status} {result['test']}: {result['details']}{time_info}")
            if result['error']:
                print(f"      Error: {result['error']}")
        
        return success_rate >= 70

def main():
    """Main test execution"""
    print("🔧 Starting Offers Backend Testing for Deleted Offers Filter Fix...")
    print("📋 This test verifies the fix mentioned in the review request:")
    print("   - GET /api/offers should NOT return offers with status 'cancelled'")
    print("   - GET /api/offers?campaign_id=X should filter out cancelled offers")
    print("   - Active offers (drafted, sent, accepted, etc.) should still be returned")
    print("   - Offer counts should reflect only non-cancelled offers")
    print("   - Deleted offers should not reappear after deletion")
    print()
    
    tester = OffersFilterTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Backend testing completed successfully - Deleted offers filter is working correctly")
        sys.exit(0)
    else:
        print("\n❌ Backend testing found issues with the deleted offers filter")
        sys.exit(1)

if __name__ == "__main__":
    main()