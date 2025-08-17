#!/usr/bin/env python3
"""
URGENT: Backend Testing for Existing User Login Issue
====================================================

CRITICAL ISSUE: User test.creator@example.com exists but login times out
- Account exists (signup says "User already registered") 
- Login times out with valid credentials test.creator@example.com / testpassword123
- Need to diagnose account state and authentication flow

IMMEDIATE TESTING FOCUS:
1. Check User Account State - Verify user exists and profile data
2. Test Authentication Flow - Test Supabase signInWithPassword directly  
3. Diagnose Login Timeout - Identify root cause of timeout issue
4. Verify System Health - Check if issue is user-specific or system-wide
5. Test Account Recovery - Verify if password reset would resolve issue

EXPECTED OUTCOME: 
✅ Identify exact cause of login timeout for existing user
✅ Provide specific recommendations to fix the account
✅ Verify login works after fixes applied
"""

import requests
import time
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

# Configuration
BASE_URL = "https://006ef4e7-1e43-4b34-92e8-18a672524883.preview.emergentagent.com"
TIMEOUT_LIMIT = 30  # 30 second timeout for all requests
TEST_CREDENTIALS = {
    "email": "prodtest1755229904@example.com",
    "password": "testpassword123"
}

class InfiniteLoadingTester:
    def __init__(self):
        self.results = []
        self.session = requests.Session()
        self.session.timeout = TIMEOUT_LIMIT
        
    def log_result(self, test_name, success, details, duration=None):
        """Log test results with timestamp"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "duration": duration,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        duration_str = f" ({duration:.2f}s)" if duration else ""
        print(f"{status} {test_name}{duration_str}: {details}")
        
    def test_authentication_timeout_protection(self):
        """Test 1: Authentication Forms Timeout Protection"""
        print("\n🔐 TESTING AUTHENTICATION TIMEOUT PROTECTION")
        
        # Test Login Page Accessibility
        start_time = time.time()
        try:
            response = self.session.get(f"{BASE_URL}/auth/login", timeout=TIMEOUT_LIMIT)
            duration = time.time() - start_time
            
            if response.status_code == 200 and duration < TIMEOUT_LIMIT:
                self.log_result("Login Page Access", True, f"Page loads in {duration:.2f}s (< {TIMEOUT_LIMIT}s timeout)", duration)
            else:
                self.log_result("Login Page Access", False, f"Status: {response.status_code}, Duration: {duration:.2f}s", duration)
        except requests.exceptions.Timeout:
            duration = time.time() - start_time
            self.log_result("Login Page Access", False, f"Request timed out after {duration:.2f}s", duration)
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Login Page Access", False, f"Error: {str(e)}", duration)
            
        # Test Signup Page Accessibility
        start_time = time.time()
        try:
            response = self.session.get(f"{BASE_URL}/auth/signup", timeout=TIMEOUT_LIMIT)
            duration = time.time() - start_time
            
            if response.status_code == 200 and duration < TIMEOUT_LIMIT:
                self.log_result("Signup Page Access", True, f"Page loads in {duration:.2f}s (< {TIMEOUT_LIMIT}s timeout)", duration)
            else:
                self.log_result("Signup Page Access", False, f"Status: {response.status_code}, Duration: {duration:.2f}s", duration)
        except requests.exceptions.Timeout:
            duration = time.time() - start_time
            self.log_result("Signup Page Access", False, f"Request timed out after {duration:.2f}s", duration)
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Signup Page Access", False, f"Error: {str(e)}", duration)
            
        # Test Forgot Password Page Accessibility
        start_time = time.time()
        try:
            response = self.session.get(f"{BASE_URL}/auth/forgot-password", timeout=TIMEOUT_LIMIT)
            duration = time.time() - start_time
            
            if response.status_code == 200 and duration < TIMEOUT_LIMIT:
                self.log_result("Forgot Password Page Access", True, f"Page loads in {duration:.2f}s (< {TIMEOUT_LIMIT}s timeout)", duration)
            else:
                self.log_result("Forgot Password Page Access", False, f"Status: {response.status_code}, Duration: {duration:.2f}s", duration)
        except requests.exceptions.Timeout:
            duration = time.time() - start_time
            self.log_result("Forgot Password Page Access", False, f"Request timed out after {duration:.2f}s", duration)
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Forgot Password Page Access", False, f"Error: {str(e)}", duration)
    
    def test_profile_operations_timeout_protection(self):
        """Test 2: Profile Operations Timeout Protection"""
        print("\n👤 TESTING PROFILE OPERATIONS TIMEOUT PROTECTION")
        
        # Test Brand Profile Page
        start_time = time.time()
        try:
            response = self.session.get(f"{BASE_URL}/brand/profile", timeout=TIMEOUT_LIMIT)
            duration = time.time() - start_time
            
            if response.status_code in [200, 302, 401] and duration < TIMEOUT_LIMIT:
                self.log_result("Brand Profile Page Access", True, f"Page accessible in {duration:.2f}s (Status: {response.status_code})", duration)
            else:
                self.log_result("Brand Profile Page Access", False, f"Status: {response.status_code}, Duration: {duration:.2f}s", duration)
        except requests.exceptions.Timeout:
            duration = time.time() - start_time
            self.log_result("Brand Profile Page Access", False, f"Request timed out after {duration:.2f}s", duration)
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Brand Profile Page Access", False, f"Error: {str(e)}", duration)
            
        # Test Creator Profile Page
        start_time = time.time()
        try:
            response = self.session.get(f"{BASE_URL}/creator/profile", timeout=TIMEOUT_LIMIT)
            duration = time.time() - start_time
            
            if response.status_code in [200, 302, 401] and duration < TIMEOUT_LIMIT:
                self.log_result("Creator Profile Page Access", True, f"Page accessible in {duration:.2f}s (Status: {response.status_code})", duration)
            else:
                self.log_result("Creator Profile Page Access", False, f"Status: {response.status_code}, Duration: {duration:.2f}s", duration)
        except requests.exceptions.Timeout:
            duration = time.time() - start_time
            self.log_result("Creator Profile Page Access", False, f"Request timed out after {duration:.2f}s", duration)
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Creator Profile Page Access", False, f"Error: {str(e)}", duration)
    
    def test_rate_cards_timeout_protection(self):
        """Test 3: Rate Cards Operations Timeout Protection"""
        print("\n💳 TESTING RATE CARDS TIMEOUT PROTECTION")
        
        # Test Rate Cards API Endpoint
        start_time = time.time()
        try:
            response = self.session.get(f"{BASE_URL}/api/rate-cards", timeout=TIMEOUT_LIMIT)
            duration = time.time() - start_time
            
            if duration < TIMEOUT_LIMIT:
                self.log_result("Rate Cards API Timeout", True, f"API responds in {duration:.2f}s (Status: {response.status_code})", duration)
            else:
                self.log_result("Rate Cards API Timeout", False, f"API took {duration:.2f}s (> {TIMEOUT_LIMIT}s)", duration)
        except requests.exceptions.Timeout:
            duration = time.time() - start_time
            self.log_result("Rate Cards API Timeout", False, f"API timed out after {duration:.2f}s", duration)
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Rate Cards API Timeout", False, f"Error: {str(e)}", duration)
            
        # Test Creator Rate Cards Page
        start_time = time.time()
        try:
            response = self.session.get(f"{BASE_URL}/creator/rate-cards", timeout=TIMEOUT_LIMIT)
            duration = time.time() - start_time
            
            if response.status_code in [200, 302, 401] and duration < TIMEOUT_LIMIT:
                self.log_result("Creator Rate Cards Page", True, f"Page accessible in {duration:.2f}s (Status: {response.status_code})", duration)
            else:
                self.log_result("Creator Rate Cards Page", False, f"Status: {response.status_code}, Duration: {duration:.2f}s", duration)
        except requests.exceptions.Timeout:
            duration = time.time() - start_time
            self.log_result("Creator Rate Cards Page", False, f"Request timed out after {duration:.2f}s", duration)
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Creator Rate Cards Page", False, f"Error: {str(e)}", duration)
    
    def test_campaign_applications_timeout_protection(self):
        """Test 4: Campaign Applications Timeout Protection"""
        print("\n📋 TESTING CAMPAIGN APPLICATIONS TIMEOUT PROTECTION")
        
        # Test Applications API Endpoint
        start_time = time.time()
        try:
            response = self.session.get(f"{BASE_URL}/api/applications", timeout=TIMEOUT_LIMIT)
            duration = time.time() - start_time
            
            if duration < TIMEOUT_LIMIT:
                self.log_result("Applications API Timeout", True, f"API responds in {duration:.2f}s (Status: {response.status_code})", duration)
            else:
                self.log_result("Applications API Timeout", False, f"API took {duration:.2f}s (> {TIMEOUT_LIMIT}s)", duration)
        except requests.exceptions.Timeout:
            duration = time.time() - start_time
            self.log_result("Applications API Timeout", False, f"API timed out after {duration:.2f}s", duration)
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Applications API Timeout", False, f"Error: {str(e)}", duration)
            
        # Test Creator Applications Page
        start_time = time.time()
        try:
            response = self.session.get(f"{BASE_URL}/creator/applications", timeout=TIMEOUT_LIMIT)
            duration = time.time() - start_time
            
            if response.status_code in [200, 302, 401] and duration < TIMEOUT_LIMIT:
                self.log_result("Creator Applications Page", True, f"Page accessible in {duration:.2f}s (Status: {response.status_code})", duration)
            else:
                self.log_result("Creator Applications Page", False, f"Status: {response.status_code}, Duration: {duration:.2f}s", duration)
        except requests.exceptions.Timeout:
            duration = time.time() - start_time
            self.log_result("Creator Applications Page", False, f"Request timed out after {duration:.2f}s", duration)
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Creator Applications Page", False, f"Error: {str(e)}", duration)
    
    def test_supabase_client_timeout_configuration(self):
        """Test 5: Supabase Client Platform-Wide Timeout Configuration"""
        print("\n🔧 TESTING SUPABASE CLIENT TIMEOUT CONFIGURATION")
        
        # Test multiple API endpoints that use Supabase client
        endpoints = [
            "/api/profiles",
            "/api/campaigns", 
            "/api/messages",
            "/api/setup-database"
        ]
        
        for endpoint in endpoints:
            start_time = time.time()
            try:
                response = self.session.get(f"{BASE_URL}{endpoint}", timeout=TIMEOUT_LIMIT)
                duration = time.time() - start_time
                
                if duration < 25:  # Supabase client has 25-second timeout
                    self.log_result(f"Supabase Timeout - {endpoint}", True, f"Responds in {duration:.2f}s (< 25s Supabase timeout)", duration)
                else:
                    self.log_result(f"Supabase Timeout - {endpoint}", False, f"Took {duration:.2f}s (> 25s Supabase timeout)", duration)
            except requests.exceptions.Timeout:
                duration = time.time() - start_time
                self.log_result(f"Supabase Timeout - {endpoint}", False, f"Request timed out after {duration:.2f}s", duration)
            except Exception as e:
                duration = time.time() - start_time
                self.log_result(f"Supabase Timeout - {endpoint}", False, f"Error: {str(e)}", duration)
    
    def test_concurrent_request_handling(self):
        """Test 6: Concurrent Request Handling (No Infinite Loading Under Load)"""
        print("\n⚡ TESTING CONCURRENT REQUEST HANDLING")
        
        def make_request(url):
            start_time = time.time()
            try:
                response = requests.get(url, timeout=TIMEOUT_LIMIT)
                duration = time.time() - start_time
                return {
                    "url": url,
                    "status": response.status_code,
                    "duration": duration,
                    "success": duration < TIMEOUT_LIMIT
                }
            except Exception as e:
                duration = time.time() - start_time
                return {
                    "url": url,
                    "status": "ERROR",
                    "duration": duration,
                    "success": False,
                    "error": str(e)
                }
        
        # Test concurrent requests to different endpoints
        urls = [
            f"{BASE_URL}/auth/login",
            f"{BASE_URL}/auth/signup", 
            f"{BASE_URL}/brand/dashboard",
            f"{BASE_URL}/creator/dashboard",
            f"{BASE_URL}/api/campaigns"
        ]
        
        start_time = time.time()
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request, url) for url in urls]
            results = [future.result() for future in as_completed(futures)]
        
        total_duration = time.time() - start_time
        successful_requests = sum(1 for r in results if r["success"])
        
        self.log_result("Concurrent Request Handling", 
                       successful_requests >= 3,  # At least 3/5 should succeed
                       f"{successful_requests}/5 requests completed successfully in {total_duration:.2f}s",
                       total_duration)
    
    def test_timeout_error_handling(self):
        """Test 7: Timeout Error Handling (User-Friendly Messages)"""
        print("\n🚨 TESTING TIMEOUT ERROR HANDLING")
        
        # Test pages that should have timeout protection
        pages_with_timeout_protection = [
            "/auth/login",
            "/auth/signup",
            "/brand/profile",
            "/creator/profile"
        ]
        
        for page in pages_with_timeout_protection:
            start_time = time.time()
            try:
                response = self.session.get(f"{BASE_URL}{page}", timeout=TIMEOUT_LIMIT)
                duration = time.time() - start_time
                
                # Check if page contains timeout handling code
                if response.status_code == 200:
                    content = response.text.lower()
                    has_timeout_handling = any(keyword in content for keyword in [
                        "timeout", "timed out", "30000", "25000", "promise.race", "abortcontroller"
                    ])
                    
                    self.log_result(f"Timeout Handling - {page}", 
                                   has_timeout_handling,
                                   f"Page loads in {duration:.2f}s, timeout handling: {'present' if has_timeout_handling else 'not detected'}",
                                   duration)
                else:
                    self.log_result(f"Timeout Handling - {page}", False, f"Page not accessible (Status: {response.status_code})", duration)
                    
            except Exception as e:
                duration = time.time() - start_time
                self.log_result(f"Timeout Handling - {page}", False, f"Error: {str(e)}", duration)
    
    def run_comprehensive_test(self):
        """Run all timeout protection tests"""
        print("🎯 COMPREHENSIVE PLATFORM-WIDE INFINITE LOADING FIXES TESTING")
        print("=" * 80)
        print(f"Base URL: {BASE_URL}")
        print(f"Timeout Limit: {TIMEOUT_LIMIT} seconds")
        print(f"Test Started: {datetime.now().isoformat()}")
        print("=" * 80)
        
        # Run all test categories
        self.test_authentication_timeout_protection()
        self.test_profile_operations_timeout_protection()
        self.test_rate_cards_timeout_protection()
        self.test_campaign_applications_timeout_protection()
        self.test_supabase_client_timeout_configuration()
        self.test_concurrent_request_handling()
        self.test_timeout_error_handling()
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate comprehensive test summary"""
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        
        # Category breakdown
        categories = {
            "Authentication": [r for r in self.results if "Login" in r["test"] or "Signup" in r["test"] or "Password" in r["test"]],
            "Profile Operations": [r for r in self.results if "Profile" in r["test"]],
            "Rate Cards": [r for r in self.results if "Rate Cards" in r["test"]],
            "Applications": [r for r in self.results if "Applications" in r["test"]],
            "Supabase Client": [r for r in self.results if "Supabase" in r["test"]],
            "Concurrent Handling": [r for r in self.results if "Concurrent" in r["test"]],
            "Timeout Handling": [r for r in self.results if "Timeout Handling" in r["test"]]
        }
        
        print("\n📋 CATEGORY BREAKDOWN:")
        for category, tests in categories.items():
            if tests:
                category_passed = sum(1 for t in tests if t["success"])
                category_total = len(tests)
                category_rate = (category_passed / category_total) * 100
                status = "✅" if category_rate >= 80 else "⚠️" if category_rate >= 60 else "❌"
                print(f"{status} {category}: {category_passed}/{category_total} ({category_rate:.1f}%)")
        
        # Failed tests details
        failed_results = [r for r in self.results if not r["success"]]
        if failed_results:
            print("\n❌ FAILED TESTS DETAILS:")
            for result in failed_results:
                print(f"  • {result['test']}: {result['details']}")
        
        # Performance summary
        durations = [r["duration"] for r in self.results if r["duration"] is not None]
        if durations:
            avg_duration = sum(durations) / len(durations)
            max_duration = max(durations)
            print(f"\n⏱️ PERFORMANCE SUMMARY:")
            print(f"Average Response Time: {avg_duration:.2f}s")
            print(f"Maximum Response Time: {max_duration:.2f}s")
            print(f"Timeout Compliance: {sum(1 for d in durations if d < TIMEOUT_LIMIT)}/{len(durations)} requests under {TIMEOUT_LIMIT}s")
        
        # Overall assessment
        print(f"\n🎯 OVERALL ASSESSMENT:")
        if success_rate >= 90:
            print("✅ EXCELLENT: Platform-wide infinite loading fixes are working excellently")
        elif success_rate >= 80:
            print("✅ GOOD: Platform-wide infinite loading fixes are working well with minor issues")
        elif success_rate >= 70:
            print("⚠️ ACCEPTABLE: Platform-wide infinite loading fixes are working but need attention")
        else:
            print("❌ NEEDS WORK: Platform-wide infinite loading fixes need significant improvement")
        
        print("=" * 80)

if __name__ == "__main__":
    tester = InfiniteLoadingTester()
    tester.run_comprehensive_test()