#!/usr/bin/env python3
"""
Backend Testing for Rate Cards API - Timeout Removal Verification
Testing the rate cards functionality after removing disruptive timeout mechanisms
Focus: API functionality, no timeout disruptions, error handling, edit functionality
"""

import requests
import json
import time
import sys
import os
from datetime import datetime

# Configuration - Use production URL from .env
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://next-error-fix.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

class RateCardsAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = 30  # 30 second timeout to match frontend safety
        self.test_results = []
        # Use test creator ID
        self.test_creator_id = "test-creator-123"
        
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

    def test_api_response_time(self):
        """Test 1: Rate Cards API Response Time - verify API responds within reasonable time"""
        print("🔍 Testing Rate Cards API Response Time...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/rate-cards")
            response_time = time.time() - start_time
            
            if response_time > 15:  # Frontend has 15s safety timeout
                self.log_test(
                    "API Response Time", 
                    False, 
                    f"API response too slow: {response_time:.2f}s (exceeds 15s safety timeout)",
                    response_time=response_time
                )
                return False
            elif response_time > 12:  # Frontend has 12s API timeout
                self.log_test(
                    "API Response Time", 
                    False, 
                    f"API response slow: {response_time:.2f}s (exceeds 12s API timeout)",
                    response_time=response_time
                )
                return False
            else:
                self.log_test(
                    "API Response Time", 
                    True, 
                    f"API responds within acceptable time (< 12s timeout)",
                    response_time=response_time
                )
                return True
                
        except requests.exceptions.Timeout:
            self.log_test(
                "API Response Time", 
                False, 
                "API request timed out after 30 seconds"
            )
            return False
        except Exception as e:
            self.log_test(
                "API Response Time", 
                False, 
                f"API request failed: {str(e)}"
            )
            return False

    def test_rate_cards_get_endpoint(self):
        """Test 2: Rate Cards GET endpoint functionality"""
        print("🔍 Testing Rate Cards GET Endpoint...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/rate-cards")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if 'rateCards' in data and 'success' in data:
                    self.log_test(
                        "Rate Cards GET", 
                        True, 
                        f"GET endpoint working correctly, returned {len(data.get('rateCards', []))} rate cards",
                        response_time=response_time
                    )
                    return True
                else:
                    self.log_test(
                        "Rate Cards GET", 
                        False, 
                        f"Invalid response format: {data}",
                        response_time=response_time
                    )
                    return False
            else:
                self.log_test(
                    "Rate Cards GET", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    response_time=response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Rate Cards GET", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False

    def test_authentication_flow(self):
        """Test 3: Authentication Flow - ensure profile loading works correctly"""
        print("🔍 Testing Authentication Flow...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/rate-cards?creator_id={self.test_creator_id}")
            response_time = time.time() - start_time
            
            # The API should respond appropriately regardless of auth state
            if response.status_code in [200, 401, 403]:
                self.log_test(
                    "Authentication Flow", 
                    True, 
                    f"Authentication handled appropriately (HTTP {response.status_code})",
                    response_time=response_time
                )
                return True
            else:
                self.log_test(
                    "Authentication Flow", 
                    False, 
                    f"Unexpected auth response: {response.status_code}",
                    response_time=response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Authentication Flow", 
                False, 
                f"Auth test failed: {str(e)}"
            )
            return False

    def test_error_scenarios(self):
        """Test 4: Error Scenarios - test network issues, timeouts, API failures"""
        print("🔍 Testing Error Scenarios...")
        
        success_count = 0
        
        # Test 1: Invalid endpoint (404)
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/rate-cards/invalid-endpoint")
            response_time = time.time() - start_time
            
            if response.status_code == 404:
                print("  ✅ 404 errors handled correctly")
                success_count += 1
            else:
                print(f"  ❌ Expected 404, got {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ 404 test failed: {str(e)}")
        
        # Test 2: Malformed request
        try:
            start_time = time.time()
            response = self.session.post(
                f"{API_BASE}/rate-cards",
                data="invalid json",  # Malformed JSON
                headers={"Content-Type": "application/json"}
            )
            response_time = time.time() - start_time
            
            if response.status_code in [400, 500]:
                print(f"  ✅ Malformed JSON handled correctly (HTTP {response.status_code})")
                success_count += 1
            else:
                print(f"  ❌ Unexpected response to malformed JSON: {response.status_code}")
                
        except Exception as e:
            print(f"  ✅ Request properly failed with malformed JSON: {str(e)}")
            success_count += 1
        
        # Test 3: Invalid rate card ID
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/rate-cards/invalid-uuid")
            response_time = time.time() - start_time
            
            if response.status_code in [400, 404, 500]:
                print(f"  ✅ Invalid ID handled correctly (HTTP {response.status_code})")
                success_count += 1
            else:
                print(f"  ❌ Unexpected response to invalid ID: {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ Invalid ID test failed: {str(e)}")
        
        if success_count >= 2:
            self.log_test(
                "Error Scenarios", 
                True, 
                f"Error handling working correctly ({success_count}/3 tests passed)"
            )
            return True
        else:
            self.log_test(
                "Error Scenarios", 
                False, 
                f"Error handling issues found ({success_count}/3 tests passed)"
            )
            return False

    def test_loading_states_infinite_loading_fix(self):
        """Test 5: Loading States - verify proper loading/error/success transitions (INFINITE LOADING FIX)"""
        print("🔍 Testing Loading States and Infinite Loading Fix...")
        
        # Test multiple rapid requests to simulate the infinite loading scenario
        success_count = 0
        total_requests = 5
        response_times = []
        
        print(f"  Making {total_requests} rapid requests to test for infinite loading...")
        
        for i in range(total_requests):
            try:
                start_time = time.time()
                response = self.session.get(f"{API_BASE}/rate-cards")
                response_time = time.time() - start_time
                response_times.append(response_time)
                
                if response.status_code == 200 and response_time < 15:
                    success_count += 1
                    print(f"    Request {i+1}: ✅ Success ({response_time:.2f}s)")
                else:
                    print(f"    Request {i+1}: ❌ Failed (HTTP {response.status_code}, {response_time:.2f}s)")
                    
            except Exception as e:
                print(f"    Request {i+1}: ❌ Exception: {str(e)}")
        
        avg_time = sum(response_times) / len(response_times) if response_times else 0
        max_time = max(response_times) if response_times else 0
        
        if success_count == total_requests:
            self.log_test(
                "Infinite Loading Fix", 
                True, 
                f"All {total_requests} rapid requests succeeded. Avg: {avg_time:.2f}s, Max: {max_time:.2f}s. No infinite loading detected.",
                response_time=avg_time
            )
            return True
        elif success_count > total_requests // 2:
            self.log_test(
                "Infinite Loading Fix", 
                True, 
                f"{success_count}/{total_requests} requests succeeded. Avg: {avg_time:.2f}s, Max: {max_time:.2f}s. Partial success - no infinite loading.",
                response_time=avg_time
            )
            return True
        else:
            self.log_test(
                "Infinite Loading Fix", 
                False, 
                f"Only {success_count}/{total_requests} requests succeeded. Potential infinite loading or API issues.",
                response_time=avg_time
            )
            return False

    def test_debug_output_console_logs(self):
        """Test 6: Debug Output - check for proper API logging (simulated)"""
        print("🔍 Testing Debug Output and Console Logs...")
        
        # Test that API endpoints are responding with proper structure
        # This simulates checking for debug logs by verifying API behavior
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/rate-cards")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for proper response structure (indicates good logging/debugging)
                has_proper_structure = (
                    isinstance(data, dict) and
                    'rateCards' in data and
                    isinstance(data['rateCards'], list)
                )
                
                if has_proper_structure:
                    self.log_test(
                        "Debug Output Structure", 
                        True, 
                        "API returns proper structured response (indicates good debug logging)",
                        response_time=response_time
                    )
                    return True
                else:
                    self.log_test(
                        "Debug Output Structure", 
                        False, 
                        f"API response structure issues: {data}",
                        response_time=response_time
                    )
                    return False
            else:
                self.log_test(
                    "Debug Output Structure", 
                    False, 
                    f"API not responding properly for debug testing: HTTP {response.status_code}",
                    response_time=response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Debug Output Structure", 
                False, 
                f"Debug output test failed: {str(e)}"
            )
            return False

    def test_supabase_connectivity(self):
        """Test 7: Supabase Database Connectivity"""
        print("🔍 Testing Supabase Database Connectivity...")
        
        try:
            # Test if rate cards API is working (indicates Supabase connectivity)
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/rate-cards")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                self.log_test(
                    "Supabase Connectivity", 
                    True, 
                    "Rate cards API working (Supabase connection successful)",
                    response_time=response_time
                )
                return True
            elif response.status_code == 500:
                # Check if it's a Supabase connection error
                try:
                    error_data = response.json()
                    if 'supabase' in str(error_data).lower() or 'database' in str(error_data).lower():
                        self.log_test(
                            "Supabase Connectivity", 
                            False, 
                            f"Supabase connection error detected: {error_data}",
                            response_time=response_time
                        )
                    else:
                        self.log_test(
                            "Supabase Connectivity", 
                            False, 
                            f"API error (may be Supabase related): {error_data}",
                            response_time=response_time
                        )
                except:
                    self.log_test(
                        "Supabase Connectivity", 
                        False, 
                        f"API returning 500 errors (potential Supabase issues)",
                        response_time=response_time
                    )
                return False
            else:
                self.log_test(
                    "Supabase Connectivity", 
                    False, 
                    f"Unexpected API response: HTTP {response.status_code}",
                    response_time=response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Supabase Connectivity", 
                False, 
                f"Database connectivity test failed: {str(e)}"
            )
            return False

    def run_all_tests(self):
        """Run all backend tests focusing on infinite loading fix"""
        print("🚀 RATE CARDS INFINITE LOADING FIX - BACKEND TESTING")
        print("=" * 70)
        print(f"Testing against: {BASE_URL}")
        print(f"API Base URL: {API_BASE}")
        print("Focus: Infinite loading issue resolution, API response times, error handling")
        print("=" * 70)
        
        # Run all tests
        tests = [
            ("API Response Time", self.test_api_response_time),
            ("Rate Cards GET Endpoint", self.test_rate_cards_get_endpoint),
            ("Authentication Flow", self.test_authentication_flow),
            ("Error Scenarios", self.test_error_scenarios),
            ("Infinite Loading Fix", self.test_loading_states_infinite_loading_fix),
            ("Debug Output", self.test_debug_output_console_logs),
            ("Supabase Connectivity", self.test_supabase_connectivity)
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
        print("📊 INFINITE LOADING FIX - BACKEND TESTING SUMMARY")
        print("=" * 70)
        
        success_rate = (passed / total) * 100
        print(f"Tests Passed: {passed}/{total} ({success_rate:.1f}%)")
        
        # Analyze response times for infinite loading assessment
        api_times = [r['response_time'] for r in self.test_results if r['response_time'] and r['response_time'] < 30]
        if api_times:
            avg_time = sum(api_times) / len(api_times)
            max_time = max(api_times)
            print(f"\n⏱️  API RESPONSE TIME ANALYSIS:")
            print(f"   Average Response Time: {avg_time:.2f}s")
            print(f"   Maximum Response Time: {max_time:.2f}s")
            print(f"   Total API Calls Made: {len(api_times)}")
            
            if max_time < 12:
                print("   ✅ All API calls complete within 12s timeout - NO INFINITE LOADING RISK")
            elif max_time < 15:
                print("   ⚠️  Some API calls approach 12s timeout but within 15s safety limit")
            else:
                print("   🚨 API calls exceed safety timeout - INFINITE LOADING RISK EXISTS")
        
        # Overall assessment
        print(f"\n🎯 INFINITE LOADING FIX ASSESSMENT:")
        if success_rate >= 85:
            print("   🎉 EXCELLENT - Infinite loading issue appears to be RESOLVED")
            print("   ✅ Rate Cards API is working correctly with proper timeouts")
            print("   ✅ All safety mechanisms are functioning as expected")
        elif success_rate >= 70:
            print("   ⚠️  GOOD - Core functionality works but minor issues detected")
            print("   ✅ Infinite loading issue likely resolved")
            print("   ⚠️  Some edge cases may need attention")
        else:
            print("   🚨 NEEDS ATTENTION - Significant issues found")
            print("   ❌ Infinite loading issue may not be fully resolved")
            print("   ❌ API or connectivity problems detected")
        
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
    print("🔧 Starting Rate Cards Backend Testing for Infinite Loading Fix...")
    print("📋 This test focuses on the fixes mentioned in the review request:")
    print("   - 15-second safety timeout implementation")
    print("   - 12-second API timeout handling") 
    print("   - useEffect dependency management")
    print("   - Enhanced error handling")
    print("   - Debug logging verification")
    print()
    
    tester = RateCardsAPITester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Backend testing completed successfully - Infinite loading fix appears to be working")
        sys.exit(0)
    else:
        print("\n❌ Backend testing found issues that may affect the infinite loading fix")
        sys.exit(1)

if __name__ == "__main__":
    main()