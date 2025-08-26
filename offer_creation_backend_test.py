#!/usr/bin/env python3
"""
🎯 OFFER CREATION PAGE INFINITE LOADING FIX - BACKEND API TESTING
=================================================================

Testing the backend APIs supporting the offer creation page to verify:
1. Campaign API: /api/campaigns/be9e2307-d8bc-4292-b6f7-17ddcd0b07ca
2. Applications API: /api/campaigns/be9e2307-d8bc-4292-b6f7-17ddcd0b07ca/applications  
3. Profiles API: /api/profiles?role=creator
4. Performance within 8-second timeout limit
5. Error handling for debugging

Context: User reported infinite loading on /brand/campaigns/be9e2307-d8bc-4292-b6f7-17ddcd0b07ca/offers/create
Applied systematic loading fixes with timeout protection and error handling.
"""

import requests
import time
import json
import os
from datetime import datetime

# Get backend URL from environment - use local for testing
BACKEND_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000')
API_BASE = f"{BACKEND_URL}/api"

# Test campaign ID from review request
CAMPAIGN_ID = "be9e2307-d8bc-4292-b6f7-17ddcd0b07ca"

class OfferCreationAPITester:
    def __init__(self):
        self.results = []
        self.total_tests = 0
        self.passed_tests = 0
        
    def log_result(self, test_name, success, details, response_time=None):
        """Log test result with timing information"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            'test': test_name,
            'status': status,
            'success': success,
            'details': details,
            'response_time': response_time,
            'timestamp': datetime.now().isoformat()
        }
        self.results.append(result)
        self.total_tests += 1
        if success:
            self.passed_tests += 1
        
        timing_info = f" ({response_time:.3f}s)" if response_time else ""
        print(f"{status} {test_name}{timing_info}")
        print(f"   📝 {details}")
        print()

    def test_campaign_api(self):
        """Test Campaign API: /api/campaigns/{id}"""
        print("🔍 Testing Campaign API...")
        
        try:
            start_time = time.time()
            url = f"{API_BASE}/campaigns/{CAMPAIGN_ID}"
            
            response = requests.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if 'campaign' in data and data['campaign']:
                    campaign = data['campaign']
                    self.log_result(
                        "Campaign API Response",
                        True,
                        f"Campaign found: '{campaign.get('title', 'No title')}' (Status: {campaign.get('status', 'unknown')})",
                        response_time
                    )
                    
                    # Check if response time is within 8-second timeout
                    if response_time <= 8.0:
                        self.log_result(
                            "Campaign API Performance",
                            True,
                            f"Response time {response_time:.3f}s is within 8s timeout requirement",
                            response_time
                        )
                    else:
                        self.log_result(
                            "Campaign API Performance",
                            False,
                            f"Response time {response_time:.3f}s exceeds 8s timeout requirement",
                            response_time
                        )
                    
                    return campaign
                else:
                    self.log_result(
                        "Campaign API Response",
                        False,
                        f"Campaign data missing in response: {data}",
                        response_time
                    )
            elif response.status_code == 404:
                self.log_result(
                    "Campaign API Response",
                    False,
                    f"Campaign {CAMPAIGN_ID} not found (404). This may cause infinite loading on offer creation page.",
                    response_time
                )
            else:
                self.log_result(
                    "Campaign API Response",
                    False,
                    f"HTTP {response.status_code}: {response.text[:200]}",
                    response_time
                )
                
        except requests.exceptions.Timeout:
            self.log_result(
                "Campaign API Response",
                False,
                "Request timed out after 10 seconds - this will cause infinite loading",
                10.0
            )
        except Exception as e:
            self.log_result(
                "Campaign API Response",
                False,
                f"Request failed: {str(e)}",
                None
            )
        
        return None

    def test_applications_api(self):
        """Test Applications API: /api/campaigns/{id}/applications"""
        print("🔍 Testing Applications API...")
        
        try:
            start_time = time.time()
            url = f"{API_BASE}/campaigns/{CAMPAIGN_ID}/applications"
            
            response = requests.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                applications = data.get('applications', [])
                self.log_result(
                    "Applications API Response",
                    True,
                    f"Found {len(applications)} applications for campaign",
                    response_time
                )
                
                # Check performance
                if response_time <= 8.0:
                    self.log_result(
                        "Applications API Performance",
                        True,
                        f"Response time {response_time:.3f}s is within 8s timeout requirement",
                        response_time
                    )
                else:
                    self.log_result(
                        "Applications API Performance",
                        False,
                        f"Response time {response_time:.3f}s exceeds 8s timeout requirement",
                        response_time
                    )
                
                return applications
                
            elif response.status_code == 404:
                self.log_result(
                    "Applications API Response",
                    False,
                    f"Applications endpoint not found (404). This API may need to be implemented for offer creation page.",
                    response_time
                )
            else:
                self.log_result(
                    "Applications API Response",
                    False,
                    f"HTTP {response.status_code}: {response.text[:200]}",
                    response_time
                )
                
        except requests.exceptions.Timeout:
            self.log_result(
                "Applications API Response",
                False,
                "Request timed out after 10 seconds - this will cause infinite loading",
                10.0
            )
        except Exception as e:
            self.log_result(
                "Applications API Response",
                False,
                f"Request failed: {str(e)}",
                None
            )
        
        return None

    def test_profiles_api(self):
        """Test Profiles API: /api/profiles?role=creator"""
        print("🔍 Testing Profiles API...")
        
        try:
            start_time = time.time()
            url = f"{API_BASE}/profiles?role=creator"
            
            response = requests.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                profiles = data.get('profiles', [])
                creators = [p for p in profiles if p.get('role') == 'creator']
                
                self.log_result(
                    "Profiles API Response",
                    True,
                    f"Found {len(creators)} creator profiles (fallback for creator loading)",
                    response_time
                )
                
                # Check performance
                if response_time <= 8.0:
                    self.log_result(
                        "Profiles API Performance",
                        True,
                        f"Response time {response_time:.3f}s is within 8s timeout requirement",
                        response_time
                    )
                else:
                    self.log_result(
                        "Profiles API Performance",
                        False,
                        f"Response time {response_time:.3f}s exceeds 8s timeout requirement",
                        response_time
                    )
                
                return creators
                
            elif response.status_code == 404:
                self.log_result(
                    "Profiles API Response",
                    False,
                    f"Profiles endpoint not found (404). This API may need to be implemented as fallback for creator loading.",
                    response_time
                )
            else:
                self.log_result(
                    "Profiles API Response",
                    False,
                    f"HTTP {response.status_code}: {response.text[:200]}",
                    response_time
                )
                
        except requests.exceptions.Timeout:
            self.log_result(
                "Profiles API Response",
                False,
                "Request timed out after 10 seconds - this will cause infinite loading",
                10.0
            )
        except Exception as e:
            self.log_result(
                "Profiles API Response",
                False,
                f"Request failed: {str(e)}",
                None
            )
        
        return None

    def test_error_handling(self):
        """Test error handling for debugging"""
        print("🔍 Testing Error Handling...")
        
        # Test with invalid campaign ID
        try:
            start_time = time.time()
            url = f"{API_BASE}/campaigns/invalid-uuid"
            
            response = requests.get(url, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 400:
                self.log_result(
                    "Error Handling - Invalid ID",
                    True,
                    f"Proper 400 error for invalid UUID format",
                    response_time
                )
            elif response.status_code == 404:
                self.log_result(
                    "Error Handling - Invalid ID",
                    True,
                    f"Proper 404 error for non-existent campaign",
                    response_time
                )
            else:
                self.log_result(
                    "Error Handling - Invalid ID",
                    False,
                    f"Unexpected status {response.status_code} for invalid ID",
                    response_time
                )
                
        except Exception as e:
            self.log_result(
                "Error Handling - Invalid ID",
                False,
                f"Error handling test failed: {str(e)}",
                None
            )

    def test_concurrent_requests(self):
        """Test concurrent request handling (simulating multiple users)"""
        print("🔍 Testing Concurrent Request Handling...")
        
        import threading
        import queue
        
        results_queue = queue.Queue()
        
        def make_request():
            try:
                start_time = time.time()
                url = f"{API_BASE}/campaigns/{CAMPAIGN_ID}"
                response = requests.get(url, timeout=10)
                response_time = time.time() - start_time
                results_queue.put((response.status_code, response_time))
            except Exception as e:
                results_queue.put((None, None))
        
        # Make 3 concurrent requests
        threads = []
        for i in range(3):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Collect results
        successful_requests = 0
        total_time = 0
        
        while not results_queue.empty():
            status_code, response_time = results_queue.get()
            if status_code == 200 and response_time:
                successful_requests += 1
                total_time += response_time
        
        if successful_requests > 0:
            avg_time = total_time / successful_requests
            self.log_result(
                "Concurrent Request Handling",
                True,
                f"{successful_requests}/3 requests successful, avg time: {avg_time:.3f}s",
                avg_time
            )
        else:
            self.log_result(
                "Concurrent Request Handling",
                False,
                "No concurrent requests were successful",
                None
            )

    def run_all_tests(self):
        """Run all offer creation API tests"""
        print("🚀 OFFER CREATION PAGE BACKEND API TESTING")
        print("=" * 60)
        print(f"Testing APIs for campaign: {CAMPAIGN_ID}")
        print(f"Backend URL: {BACKEND_URL}")
        print()
        
        # Test individual APIs
        campaign = self.test_campaign_api()
        applications = self.test_applications_api()
        creators = self.test_profiles_api()
        
        # Test error handling and performance
        self.test_error_handling()
        self.test_concurrent_requests()
        
        # Summary
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {(self.passed_tests/self.total_tests)*100:.1f}%")
        print()
        
        # Critical issues analysis
        critical_issues = []
        
        # Check if campaign API is working
        campaign_working = any(r['test'] == 'Campaign API Response' and r['success'] for r in self.results)
        if not campaign_working:
            critical_issues.append("❌ Campaign API not working - will cause infinite loading on offer creation page")
        
        # Check if any API exceeds timeout
        timeout_issues = [r for r in self.results if 'Performance' in r['test'] and not r['success']]
        if timeout_issues:
            critical_issues.append(f"⚠️ {len(timeout_issues)} API(s) exceed 8s timeout requirement")
        
        # Check if applications API exists
        apps_working = any(r['test'] == 'Applications API Response' and r['success'] for r in self.results)
        if not apps_working:
            critical_issues.append("⚠️ Applications API not found - may need implementation for creator loading")
        
        # Check if profiles API exists
        profiles_working = any(r['test'] == 'Profiles API Response' and r['success'] for r in self.results)
        if not profiles_working:
            critical_issues.append("⚠️ Profiles API not found - may need implementation as fallback for creator loading")
        
        if critical_issues:
            print("🚨 CRITICAL ISSUES IDENTIFIED:")
            for issue in critical_issues:
                print(f"   {issue}")
        else:
            print("✅ NO CRITICAL ISSUES - All APIs supporting offer creation page are working correctly")
        
        print()
        
        # Recommendations
        print("💡 RECOMMENDATIONS:")
        if not campaign_working:
            print("   1. Fix Campaign API to return proper data for campaign ID")
        if not apps_working:
            print("   2. Implement Applications API endpoint: /api/campaigns/{id}/applications")
        if not profiles_working:
            print("   3. Implement Profiles API endpoint: /api/profiles?role=creator")
        
        if campaign_working and not timeout_issues:
            print("   ✅ Backend APIs are ready to support offer creation page without infinite loading")
        
        return self.passed_tests == self.total_tests

if __name__ == "__main__":
    tester = OfferCreationAPITester()
    success = tester.run_all_tests()
    
    if success:
        print("🎉 ALL TESTS PASSED - Offer creation page backend APIs are working correctly!")
        exit(0)
    else:
        print("❌ SOME TESTS FAILED - Issues found that may cause infinite loading on offer creation page")
        exit(1)