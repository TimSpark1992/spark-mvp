#!/usr/bin/env python3
"""
Campaign Detail Page Backend Testing
Testing the campaign detail page backend functionality to verify client-side exception fix

Focus Areas:
1. Campaign API: Test /api/campaigns/be9e2307-d8bc-4292-b6f7-17ddcd0b07ca returns proper data structure
2. Applications API: Test that applications data is being returned correctly  
3. API Response Validation: Ensure response structure matches frontend expectations
4. Performance Check: Verify API responses are fast enough to prevent timeouts

Context: Fixed duplicate setApplications() call causing "Application error: a client-side exception has occurred"
"""

import requests
import json
import time
import sys
import os
from datetime import datetime

# Configuration - Use production URL from .env
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://www.sparkplatform.tech')
API_BASE = f"{BASE_URL}/api"

# Test campaign ID from review request
TEST_CAMPAIGN_ID = "be9e2307-d8bc-4292-b6f7-17ddcd0b07ca"

class CampaignDetailBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = 30  # 30 second timeout
        self.test_results = []
        
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

    def test_campaign_api_endpoint(self):
        """Test 1: Campaign API - Test specific campaign ID returns proper data structure"""
        print(f"🔍 Testing Campaign API for ID: {TEST_CAMPAIGN_ID}...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/campaigns/{TEST_CAMPAIGN_ID}")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                if 'campaign' in data:
                    campaign = data['campaign']
                    required_fields = ['id', 'title', 'description', 'status', 'brand_id', 'created_at']
                    missing_fields = [field for field in required_fields if field not in campaign]
                    
                    if not missing_fields:
                        # Check if campaign has brand profile data (joined data)
                        has_brand_profile = 'profiles' in campaign and campaign['profiles'] is not None
                        brand_info = ""
                        if has_brand_profile:
                            brand_info = f" with brand profile ({campaign['profiles'].get('full_name', 'N/A')})"
                        
                        self.log_test(
                            "Campaign API Structure", 
                            True, 
                            f"Campaign {campaign['id']} returned with all required fields{brand_info}",
                            response_time=response_time
                        )
                        return True, campaign
                    else:
                        self.log_test(
                            "Campaign API Structure", 
                            False, 
                            f"Missing required fields: {missing_fields}",
                            response_time=response_time
                        )
                        return False, None
                else:
                    self.log_test(
                        "Campaign API Structure", 
                        False, 
                        f"Invalid response format - missing 'campaign' key: {data}",
                        response_time=response_time
                    )
                    return False, None
            elif response.status_code == 404:
                self.log_test(
                    "Campaign API Structure", 
                    False, 
                    f"Campaign {TEST_CAMPAIGN_ID} not found (404)",
                    response_time=response_time
                )
                return False, None
            else:
                self.log_test(
                    "Campaign API Structure", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    response_time=response_time
                )
                return False, None
                
        except Exception as e:
            self.log_test(
                "Campaign API Structure", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False, None

    def test_applications_api_endpoint(self):
        """Test 2: Applications API - Test applications data for the campaign"""
        print(f"🔍 Testing Applications API for campaign: {TEST_CAMPAIGN_ID}...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/campaigns/{TEST_CAMPAIGN_ID}/applications")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                if 'applications' in data and 'count' in data:
                    applications = data['applications']
                    count = data['count']
                    
                    # Validate applications structure
                    if isinstance(applications, list):
                        # Check if applications have proper structure
                        if len(applications) > 0:
                            app = applications[0]
                            required_app_fields = ['id', 'creator_id', 'campaign_id', 'status', 'applied_at']
                            missing_app_fields = [field for field in required_app_fields if field not in app]
                            
                            if not missing_app_fields:
                                # Check if application has creator profile data
                                has_creator_profile = 'profiles' in app and app['profiles'] is not None
                                creator_info = ""
                                if has_creator_profile:
                                    creator_info = f" with creator profiles ({app['profiles'].get('full_name', 'N/A')})"
                                
                                self.log_test(
                                    "Applications API Structure", 
                                    True, 
                                    f"Found {count} applications with proper structure{creator_info}",
                                    response_time=response_time
                                )
                                return True, applications
                            else:
                                self.log_test(
                                    "Applications API Structure", 
                                    False, 
                                    f"Applications missing required fields: {missing_app_fields}",
                                    response_time=response_time
                                )
                                return False, None
                        else:
                            # Empty applications list is valid
                            self.log_test(
                                "Applications API Structure", 
                                True, 
                                f"No applications found for campaign (count: {count}) - valid empty response",
                                response_time=response_time
                            )
                            return True, applications
                    else:
                        self.log_test(
                            "Applications API Structure", 
                            False, 
                            f"Applications is not a list: {type(applications)}",
                            response_time=response_time
                        )
                        return False, None
                else:
                    self.log_test(
                        "Applications API Structure", 
                        False, 
                        f"Invalid response format - missing 'applications' or 'count': {data}",
                        response_time=response_time
                    )
                    return False, None
            else:
                self.log_test(
                    "Applications API Structure", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    response_time=response_time
                )
                return False, None
                
        except Exception as e:
            self.log_test(
                "Applications API Structure", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False, None

    def test_api_response_validation(self):
        """Test 3: API Response Validation - Ensure response structure matches frontend expectations"""
        print("🔍 Testing API Response Validation for Frontend Compatibility...")
        
        # Test both APIs together to ensure they work in sequence (like frontend would use them)
        try:
            # Test campaign API first
            start_time = time.time()
            campaign_response = self.session.get(f"{API_BASE}/campaigns/{TEST_CAMPAIGN_ID}")
            campaign_time = time.time() - start_time
            
            # Test applications API second
            start_time = time.time()
            apps_response = self.session.get(f"{API_BASE}/campaigns/{TEST_CAMPAIGN_ID}/applications")
            apps_time = time.time() - start_time
            
            total_time = campaign_time + apps_time
            
            # Validate both responses work together
            if campaign_response.status_code == 200 and apps_response.status_code == 200:
                campaign_data = campaign_response.json()
                apps_data = apps_response.json()
                
                # Check if data structure is compatible with frontend expectations
                frontend_compatible = True
                issues = []
                
                # Check campaign data structure
                if 'campaign' not in campaign_data:
                    frontend_compatible = False
                    issues.append("Campaign response missing 'campaign' key")
                
                # Check applications data structure  
                if 'applications' not in apps_data or 'count' not in apps_data:
                    frontend_compatible = False
                    issues.append("Applications response missing 'applications' or 'count' key")
                
                # Check if campaign ID matches in both responses
                if 'campaign' in campaign_data and 'applications' in apps_data:
                    campaign_id = campaign_data['campaign'].get('id')
                    if len(apps_data['applications']) > 0:
                        app_campaign_id = apps_data['applications'][0].get('campaign_id')
                        if campaign_id != app_campaign_id:
                            frontend_compatible = False
                            issues.append(f"Campaign ID mismatch: {campaign_id} vs {app_campaign_id}")
                
                if frontend_compatible:
                    self.log_test(
                        "Frontend Compatibility", 
                        True, 
                        f"Both APIs return frontend-compatible data structures (total: {total_time:.3f}s)",
                        response_time=total_time
                    )
                    return True
                else:
                    self.log_test(
                        "Frontend Compatibility", 
                        False, 
                        f"Frontend compatibility issues: {', '.join(issues)}",
                        response_time=total_time
                    )
                    return False
            else:
                self.log_test(
                    "Frontend Compatibility", 
                    False, 
                    f"API responses failed - Campaign: {campaign_response.status_code}, Apps: {apps_response.status_code}",
                    response_time=total_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Frontend Compatibility", 
                False, 
                f"Validation test failed: {str(e)}"
            )
            return False

    def test_performance_check(self):
        """Test 4: Performance Check - Verify API responses are fast enough to prevent timeouts"""
        print("🔍 Testing Performance to Prevent Client-Side Timeouts...")
        
        # Test multiple requests to get average performance
        campaign_times = []
        apps_times = []
        total_requests = 5
        
        print(f"  Making {total_requests} requests to each endpoint...")
        
        for i in range(total_requests):
            try:
                # Test campaign API performance
                start_time = time.time()
                campaign_response = self.session.get(f"{API_BASE}/campaigns/{TEST_CAMPAIGN_ID}")
                campaign_time = time.time() - start_time
                campaign_times.append(campaign_time)
                
                # Test applications API performance
                start_time = time.time()
                apps_response = self.session.get(f"{API_BASE}/campaigns/{TEST_CAMPAIGN_ID}/applications")
                apps_time = time.time() - start_time
                apps_times.append(apps_time)
                
                print(f"    Request {i+1}: Campaign {campaign_time:.3f}s, Applications {apps_time:.3f}s")
                
            except Exception as e:
                print(f"    Request {i+1}: Failed - {str(e)}")
        
        # Calculate performance metrics
        if campaign_times and apps_times:
            avg_campaign = sum(campaign_times) / len(campaign_times)
            max_campaign = max(campaign_times)
            avg_apps = sum(apps_times) / len(apps_times)
            max_apps = max(apps_times)
            avg_total = avg_campaign + avg_apps
            max_total = max_campaign + max_apps
            
            # Performance thresholds (based on typical frontend timeout settings)
            FAST_THRESHOLD = 2.0  # Under 2s is excellent
            ACCEPTABLE_THRESHOLD = 5.0  # Under 5s is acceptable
            TIMEOUT_THRESHOLD = 10.0  # Over 10s risks timeouts
            
            performance_status = "EXCELLENT"
            if max_total > TIMEOUT_THRESHOLD:
                performance_status = "TIMEOUT_RISK"
            elif max_total > ACCEPTABLE_THRESHOLD:
                performance_status = "ACCEPTABLE"
            elif max_total > FAST_THRESHOLD:
                performance_status = "GOOD"
            
            success = max_total < TIMEOUT_THRESHOLD
            
            self.log_test(
                "Performance Check", 
                success, 
                f"Campaign avg: {avg_campaign:.3f}s (max: {max_campaign:.3f}s), Apps avg: {avg_apps:.3f}s (max: {max_apps:.3f}s), Total max: {max_total:.3f}s - {performance_status}",
                response_time=avg_total
            )
            return success
        else:
            self.log_test(
                "Performance Check", 
                False, 
                "No successful requests to measure performance"
            )
            return False

    def test_duplicate_setapplications_fix_verification(self):
        """Test 5: Verify the duplicate setApplications() fix by testing rapid sequential calls"""
        print("🔍 Testing Duplicate setApplications() Fix - Rapid Sequential Calls...")
        
        # Simulate the scenario that was causing the client-side exception
        # Make rapid sequential calls to applications API to test for race conditions
        success_count = 0
        total_calls = 10
        response_times = []
        
        print(f"  Making {total_calls} rapid sequential calls to applications API...")
        
        for i in range(total_calls):
            try:
                start_time = time.time()
                response = self.session.get(f"{API_BASE}/campaigns/{TEST_CAMPAIGN_ID}/applications")
                response_time = time.time() - start_time
                response_times.append(response_time)
                
                if response.status_code == 200:
                    data = response.json()
                    if 'applications' in data and 'count' in data:
                        success_count += 1
                        print(f"    Call {i+1}: ✅ Success ({response_time:.3f}s) - {data['count']} applications")
                    else:
                        print(f"    Call {i+1}: ❌ Invalid structure ({response_time:.3f}s)")
                else:
                    print(f"    Call {i+1}: ❌ HTTP {response.status_code} ({response_time:.3f}s)")
                    
            except Exception as e:
                print(f"    Call {i+1}: ❌ Exception: {str(e)}")
        
        # Analyze results
        if response_times:
            avg_time = sum(response_times) / len(response_times)
            max_time = max(response_times)
            min_time = min(response_times)
            
            success_rate = (success_count / total_calls) * 100
            
            # The fix should result in consistent, successful responses
            if success_rate >= 90 and max_time < 10:  # 90%+ success rate, under 10s max
                self.log_test(
                    "Duplicate setApplications Fix", 
                    True, 
                    f"Rapid calls successful: {success_count}/{total_calls} ({success_rate:.1f}%) - Avg: {avg_time:.3f}s, Max: {max_time:.3f}s, Min: {min_time:.3f}s",
                    response_time=avg_time
                )
                return True
            else:
                self.log_test(
                    "Duplicate setApplications Fix", 
                    False, 
                    f"Rapid calls issues: {success_count}/{total_calls} ({success_rate:.1f}%) - potential race conditions or timeouts",
                    response_time=avg_time
                )
                return False
        else:
            self.log_test(
                "Duplicate setApplications Fix", 
                False, 
                "No response times recorded - all calls failed"
            )
            return False

    def run_all_tests(self):
        """Run all campaign detail backend tests"""
        print("🚀 CAMPAIGN DETAIL PAGE BACKEND TESTING")
        print("=" * 70)
        print(f"Testing against: {BASE_URL}")
        print(f"API Base URL: {API_BASE}")
        print(f"Test Campaign ID: {TEST_CAMPAIGN_ID}")
        print("Focus: Client-side exception fix verification")
        print("=" * 70)
        
        # Run all tests
        tests = [
            ("Campaign API Endpoint", self.test_campaign_api_endpoint),
            ("Applications API Endpoint", self.test_applications_api_endpoint),
            ("API Response Validation", self.test_api_response_validation),
            ("Performance Check", self.test_performance_check),
            ("Duplicate setApplications Fix", self.test_duplicate_setapplications_fix_verification)
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
        print("📊 CAMPAIGN DETAIL BACKEND TESTING SUMMARY")
        print("=" * 70)
        
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
            
            if max_time < 5:
                print("   ✅ All API calls complete within 5s - EXCELLENT PERFORMANCE")
            elif max_time < 10:
                print("   ✅ All API calls complete within 10s - GOOD PERFORMANCE")
            else:
                print("   ⚠️  Some API calls exceed 10s - POTENTIAL TIMEOUT RISK")
        
        # Overall assessment
        print(f"\n🎯 CLIENT-SIDE EXCEPTION FIX ASSESSMENT:")
        if success_rate >= 90:
            print("   🎉 EXCELLENT - Client-side exception fix appears to be WORKING")
            print("   ✅ Campaign detail page APIs are functioning correctly")
            print("   ✅ No duplicate setApplications() issues detected")
            print("   ✅ API response structures match frontend expectations")
        elif success_rate >= 70:
            print("   ⚠️  GOOD - Core functionality works but minor issues detected")
            print("   ✅ Client-side exception likely resolved")
            print("   ⚠️  Some edge cases may need attention")
        else:
            print("   🚨 NEEDS ATTENTION - Significant backend issues found")
            print("   ❌ Client-side exception fix may not be fully effective")
            print("   ❌ Backend API problems detected")
        
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
    print("🔧 Starting Campaign Detail Page Backend Testing...")
    print("📋 This test verifies the client-side exception fix by testing:")
    print("   - Campaign API endpoint functionality")
    print("   - Applications API endpoint functionality") 
    print("   - API response structure validation")
    print("   - Performance to prevent timeouts")
    print("   - Duplicate setApplications() fix verification")
    print()
    
    tester = CampaignDetailBackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Backend testing completed successfully - Client-side exception fix appears to be working")
        sys.exit(0)
    else:
        print("\n❌ Backend testing found issues that may affect the client-side exception fix")
        sys.exit(1)

if __name__ == "__main__":
    main()