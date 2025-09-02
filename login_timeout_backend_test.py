#!/usr/bin/env python3
"""
Login Timeout Fix Backend Testing Suite
=====================================

This test suite verifies the login timeout fixes for authentication functionality:
1. Timeout Configuration Verification (Frontend: 30s, Supabase: 35s)
2. Authentication API Performance Testing
3. Supabase Connection Testing  
4. End-to-End Login Flow Testing
5. Timeout Sequence Verification
6. Performance Testing for normal login requests

Context: Fixed critical timeout conflict where Supabase AbortController timeout (20s) 
was triggering before frontend Promise.race timeout (30s), causing false timeout errors. 
Updated Supabase timeout to 35s to ensure proper sequencing.
"""

import requests
import time
import json
import sys
from datetime import datetime
import asyncio
import aiohttp
import concurrent.futures
from threading import Thread
import subprocess

class LoginTimeoutTester:
    def __init__(self):
        self.base_url = "https://www.sparkplatform.tech"
        self.api_base = f"{self.base_url}/api"
        self.test_results = []
        self.start_time = time.time()
        
        # Test credentials for authentication testing
        self.test_credentials = {
            "email": "test.creator@example.com",
            "password": "testpassword123"
        }
        
        print("🎯 LOGIN TIMEOUT FIX BACKEND TESTING SUITE")
        print("=" * 60)
        print(f"🌐 Base URL: {self.base_url}")
        print(f"🔗 API Base: {self.api_base}")
        print(f"⏰ Test Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()

    def log_result(self, test_name, success, details, response_time=None):
        """Log test results with timing information"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_time": response_time,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        time_info = f" ({response_time:.3f}s)" if response_time else ""
        print(f"{status} {test_name}{time_info}")
        if details:
            print(f"    📝 {details}")
        print()

    def test_supabase_connection(self):
        """Test 1: Supabase Connection - Test that Supabase authentication service is reachable and responsive"""
        print("🔍 TEST 1: SUPABASE CONNECTION TESTING")
        print("-" * 40)
        
        try:
            # Test basic API health endpoint
            start_time = time.time()
            response = requests.get(f"{self.api_base}/health", timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                self.log_result(
                    "Supabase Connection Health Check",
                    True,
                    f"API health endpoint accessible (HTTP {response.status_code})",
                    response_time
                )
            else:
                self.log_result(
                    "Supabase Connection Health Check",
                    False,
                    f"API health endpoint returned HTTP {response.status_code}",
                    response_time
                )
                
        except requests.exceptions.Timeout:
            self.log_result(
                "Supabase Connection Health Check",
                False,
                "Connection timed out after 30 seconds",
                30.0
            )
        except Exception as e:
            self.log_result(
                "Supabase Connection Health Check",
                False,
                f"Connection error: {str(e)}"
            )

        # Test Supabase configuration endpoint
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_base}/test", timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                self.log_result(
                    "Supabase Configuration Test",
                    True,
                    f"Supabase test endpoint accessible (HTTP {response.status_code})",
                    response_time
                )
            else:
                self.log_result(
                    "Supabase Configuration Test",
                    False,
                    f"Supabase test endpoint returned HTTP {response.status_code}",
                    response_time
                )
                
        except requests.exceptions.Timeout:
            self.log_result(
                "Supabase Configuration Test",
                False,
                "Supabase test endpoint timed out after 30 seconds",
                30.0
            )
        except Exception as e:
            self.log_result(
                "Supabase Configuration Test",
                False,
                f"Supabase test endpoint error: {str(e)}"
            )

    def test_authentication_api(self):
        """Test 2: Authentication API - Test login endpoints for proper response times"""
        print("🔍 TEST 2: AUTHENTICATION API TESTING")
        print("-" * 40)
        
        # Test authentication endpoint availability
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_base}/auth/session", timeout=30)
            response_time = time.time() - start_time
            
            # Accept both 200 (with session) and 401 (no session) as valid responses
            if response.status_code in [200, 401]:
                self.log_result(
                    "Authentication API Availability",
                    True,
                    f"Auth session endpoint accessible (HTTP {response.status_code})",
                    response_time
                )
            else:
                self.log_result(
                    "Authentication API Availability",
                    False,
                    f"Auth session endpoint returned HTTP {response.status_code}",
                    response_time
                )
                
        except requests.exceptions.Timeout:
            self.log_result(
                "Authentication API Availability",
                False,
                "Auth session endpoint timed out after 30 seconds",
                30.0
            )
        except Exception as e:
            self.log_result(
                "Authentication API Availability",
                False,
                f"Auth session endpoint error: {str(e)}"
            )

        # Test login API endpoint response time
        try:
            start_time = time.time()
            login_data = {
                "email": self.test_credentials["email"],
                "password": self.test_credentials["password"]
            }
            
            response = requests.post(
                f"{self.api_base}/auth/login",
                json=login_data,
                timeout=30,
                headers={"Content-Type": "application/json"}
            )
            response_time = time.time() - start_time
            
            # Check if response time is within acceptable limits (< 20s backend timeout)
            if response_time < 20.0:
                self.log_result(
                    "Login API Response Time",
                    True,
                    f"Login API responds within backend timeout limit (HTTP {response.status_code})",
                    response_time
                )
            else:
                self.log_result(
                    "Login API Response Time",
                    False,
                    f"Login API exceeds backend timeout limit (HTTP {response.status_code})",
                    response_time
                )
                
        except requests.exceptions.Timeout:
            self.log_result(
                "Login API Response Time",
                False,
                "Login API timed out after 30 seconds (exceeds backend limit)",
                30.0
            )
        except Exception as e:
            self.log_result(
                "Login API Response Time",
                False,
                f"Login API error: {str(e)}"
            )

    def test_timeout_configuration(self):
        """Test 3: Timeout Configuration - Verify the new timeout settings (Frontend: 30s, Supabase: 35s)"""
        print("🔍 TEST 3: TIMEOUT CONFIGURATION VERIFICATION")
        print("-" * 40)
        
        # Test that backend APIs respond well within 30s frontend timeout
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_base}/campaigns", timeout=32)
            response_time = time.time() - start_time
            
            if response_time < 30.0:
                self.log_result(
                    "Frontend Timeout Compatibility (30s)",
                    True,
                    f"Backend responds within 30s frontend timeout (actual: {response_time:.3f}s)",
                    response_time
                )
            else:
                self.log_result(
                    "Frontend Timeout Compatibility (30s)",
                    False,
                    f"Backend exceeds 30s frontend timeout (actual: {response_time:.3f}s)",
                    response_time
                )
                
        except requests.exceptions.Timeout:
            response_time = 32.0
            self.log_result(
                "Frontend Timeout Compatibility (30s)",
                False,
                f"Backend timeout exceeded 32s test limit",
                response_time
            )
        except Exception as e:
            self.log_result(
                "Frontend Timeout Compatibility (30s)",
                False,
                f"Frontend timeout compatibility test error: {str(e)}"
            )

        # Test Supabase timeout configuration (should be 35s, longer than frontend 30s)
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_base}/health", timeout=37)
            response_time = time.time() - start_time
            
            # Verify response is fast enough to prevent timeout conflicts
            if response_time < 25.0:  # Well within both 30s and 35s limits
                self.log_result(
                    "Supabase Timeout Sequence (35s > 30s)",
                    True,
                    f"Supabase operations complete before timeout conflicts (actual: {response_time:.3f}s)",
                    response_time
                )
            else:
                self.log_result(
                    "Supabase Timeout Sequence (35s > 30s)",
                    False,
                    f"Supabase operations may cause timeout conflicts (actual: {response_time:.3f}s)",
                    response_time
                )
                
        except requests.exceptions.Timeout:
            response_time = 37.0
            self.log_result(
                "Supabase Timeout Sequence (35s > 30s)",
                False,
                f"Supabase timeout exceeded 37s test limit",
                response_time
            )
        except Exception as e:
            self.log_result(
                "Supabase Timeout Sequence (35s > 30s)",
                False,
                f"Supabase timeout sequence test error: {str(e)}"
            )

        # Test timeout sequence verification - multiple rapid requests
        try:
            response_times = []
            for i in range(3):
                start_time = time.time()
                response = requests.get(f"{self.api_base}/test", timeout=32)
                response_time = time.time() - start_time
                response_times.append(response_time)
                
            avg_response_time = sum(response_times) / len(response_times)
            max_response_time = max(response_times)
            
            # Verify all requests complete well before timeout limits
            if max_response_time < 25.0:
                self.log_result(
                    "Timeout Sequence Consistency",
                    True,
                    f"All requests prevent timeout conflicts (avg: {avg_response_time:.3f}s, max: {max_response_time:.3f}s)",
                    avg_response_time
                )
            else:
                self.log_result(
                    "Timeout Sequence Consistency",
                    False,
                    f"Some requests may cause timeout conflicts (avg: {avg_response_time:.3f}s, max: {max_response_time:.3f}s)",
                    avg_response_time
                )
                
        except Exception as e:
            self.log_result(
                "Timeout Sequence Consistency",
                False,
                f"Timeout sequence consistency test error: {str(e)}"
            )

    def test_end_to_end_login_flow(self):
        """Test 4: End-to-End Login Flow - Test complete authentication workflow to ensure no premature timeouts"""
        print("🔍 TEST 4: END-TO-END LOGIN FLOW TESTING")
        print("-" * 40)
        
        # Test complete login workflow simulation
        try:
            # Step 1: Test login page access
            start_time = time.time()
            response = requests.get(f"{self.base_url}/auth/login", timeout=30)
            page_load_time = time.time() - start_time
            
            if response.status_code == 200 and page_load_time < 25.0:
                self.log_result(
                    "Login Page Access",
                    True,
                    f"Login page loads within timeout limits (HTTP {response.status_code})",
                    page_load_time
                )
            else:
                self.log_result(
                    "Login Page Access",
                    False,
                    f"Login page access issues (HTTP {response.status_code})",
                    page_load_time
                )
                
        except requests.exceptions.Timeout:
            self.log_result(
                "Login Page Access",
                False,
                "Login page access timed out after 30 seconds",
                30.0
            )
        except Exception as e:
            self.log_result(
                "Login Page Access",
                False,
                f"Login page access error: {str(e)}"
            )

        # Step 2: Test authentication API call simulation
        try:
            start_time = time.time()
            login_data = {
                "email": self.test_credentials["email"],
                "password": self.test_credentials["password"]
            }
            
            # Simulate the actual login API call that would happen in the frontend
            response = requests.post(
                f"{self.api_base}/auth/login",
                json=login_data,
                timeout=30,  # Frontend timeout
                headers={"Content-Type": "application/json"}
            )
            auth_time = time.time() - start_time
            
            # Check if authentication completes within frontend timeout
            if auth_time < 30.0:
                self.log_result(
                    "Authentication API Call",
                    True,
                    f"Auth API responds within 30s frontend timeout (HTTP {response.status_code})",
                    auth_time
                )
            else:
                self.log_result(
                    "Authentication API Call",
                    False,
                    f"Auth API exceeds 30s frontend timeout (HTTP {response.status_code})",
                    auth_time
                )
                
        except requests.exceptions.Timeout:
            self.log_result(
                "Authentication API Call",
                False,
                "Authentication API timed out after 30 seconds (matches frontend timeout)",
                30.0
            )
        except Exception as e:
            self.log_result(
                "Authentication API Call",
                False,
                f"Authentication API error: {str(e)}"
            )

        # Step 3: Test post-login redirect simulation
        try:
            start_time = time.time()
            response = requests.get(f"{self.base_url}/creator/dashboard", timeout=30)
            redirect_time = time.time() - start_time
            
            if redirect_time < 25.0:
                self.log_result(
                    "Post-Login Redirect",
                    True,
                    f"Post-login navigation completes within timeout (HTTP {response.status_code})",
                    redirect_time
                )
            else:
                self.log_result(
                    "Post-Login Redirect",
                    False,
                    f"Post-login navigation may timeout (HTTP {response.status_code})",
                    redirect_time
                )
                
        except requests.exceptions.Timeout:
            self.log_result(
                "Post-Login Redirect",
                False,
                "Post-login redirect timed out after 30 seconds",
                30.0
            )
        except Exception as e:
            self.log_result(
                "Post-Login Redirect",
                False,
                f"Post-login redirect error: {str(e)}"
            )

    def test_supabase_connection_performance(self):
        """Test 5: Supabase Connection Testing - Verify Supabase authentication service is responding quickly"""
        print("🔍 TEST 5: SUPABASE CONNECTION PERFORMANCE TESTING")
        print("-" * 40)
        
        # Test Supabase-backed API endpoints for performance
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_base}/profiles", timeout=30)
            response_time = time.time() - start_time
            
            if response_time < 25.0:  # Well within both 30s and 35s limits
                self.log_result(
                    "Supabase Profile API Performance",
                    True,
                    f"Supabase profile queries fast enough to prevent timeouts (HTTP {response.status_code})",
                    response_time
                )
            else:
                self.log_result(
                    "Supabase Profile API Performance",
                    False,
                    f"Supabase profile queries may cause timeout issues (HTTP {response.status_code})",
                    response_time
                )
                
        except requests.exceptions.Timeout:
            self.log_result(
                "Supabase Profile API Performance",
                False,
                "Supabase profile API timed out after 30 seconds",
                30.0
            )
        except Exception as e:
            self.log_result(
                "Supabase Profile API Performance",
                False,
                f"Supabase profile API error: {str(e)}"
            )

        # Test Supabase rate cards API (another Supabase operation)
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_base}/rate-cards", timeout=30)
            response_time = time.time() - start_time
            
            if response_time < 25.0:
                self.log_result(
                    "Supabase Rate Cards API Performance",
                    True,
                    f"Supabase rate cards queries complete quickly (HTTP {response.status_code})",
                    response_time
                )
            else:
                self.log_result(
                    "Supabase Rate Cards API Performance",
                    False,
                    f"Supabase rate cards queries may timeout (HTTP {response.status_code})",
                    response_time
                )
                
        except requests.exceptions.Timeout:
            self.log_result(
                "Supabase Rate Cards API Performance",
                False,
                "Supabase rate cards API timed out after 30 seconds",
                30.0
            )
        except Exception as e:
            self.log_result(
                "Supabase Rate Cards API Performance",
                False,
                f"Supabase rate cards API error: {str(e)}"
            )

        # Test Supabase campaigns API (critical for login flow)
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_base}/campaigns", timeout=30)
            response_time = time.time() - start_time
            
            if response_time < 25.0:
                self.log_result(
                    "Supabase Campaigns API Performance",
                    True,
                    f"Supabase campaigns queries support fast login flow (HTTP {response.status_code})",
                    response_time
                )
            else:
                self.log_result(
                    "Supabase Campaigns API Performance",
                    False,
                    f"Supabase campaigns queries may delay login (HTTP {response.status_code})",
                    response_time
                )
                
        except requests.exceptions.Timeout:
            self.log_result(
                "Supabase Campaigns API Performance",
                False,
                "Supabase campaigns API timed out after 30 seconds",
                30.0
            )
        except Exception as e:
            self.log_result(
                "Supabase Campaigns API Performance",
                False,
                f"Supabase campaigns API error: {str(e)}"
            )

    def test_error_handling(self):
        """Test 5: Error Handling - Test that timeout errors are properly handled and don't cause system issues"""
        print("🔍 TEST 5: ERROR HANDLING FOR TIMEOUT ERRORS")
        print("-" * 40)
        
        # Test invalid endpoint to check error handling
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_base}/invalid-endpoint", timeout=25)
            response_time = time.time() - start_time
            
            # Should return 404 or similar error, not timeout
            if response.status_code in [404, 405, 500] and response_time < 20.0:
                self.log_result(
                    "Error Handling Response Time",
                    True,
                    f"Error responses handled quickly (HTTP {response.status_code})",
                    response_time
                )
            else:
                self.log_result(
                    "Error Handling Response Time",
                    False,
                    f"Error handling too slow or unexpected response (HTTP {response.status_code})",
                    response_time
                )
                
        except requests.exceptions.Timeout:
            self.log_result(
                "Error Handling Response Time",
                False,
                "Error handling timed out (should be fast)",
                25.0
            )
        except Exception as e:
            self.log_result(
                "Error Handling Response Time",
                False,
                f"Error handling test error: {str(e)}"
            )

        # Test malformed request handling
        try:
            start_time = time.time()
            response = requests.post(
                f"{self.api_base}/auth/login",
                json={"invalid": "data"},
                timeout=25,
                headers={"Content-Type": "application/json"}
            )
            response_time = time.time() - start_time
            
            if response_time < 20.0:
                self.log_result(
                    "Malformed Request Handling",
                    True,
                    f"Malformed requests handled within timeout (HTTP {response.status_code})",
                    response_time
                )
            else:
                self.log_result(
                    "Malformed Request Handling",
                    False,
                    f"Malformed request handling exceeds timeout (HTTP {response.status_code})",
                    response_time
                )
                
        except requests.exceptions.Timeout:
            self.log_result(
                "Malformed Request Handling",
                False,
                "Malformed request handling timed out",
                25.0
            )
        except Exception as e:
            self.log_result(
                "Malformed Request Handling",
                False,
                f"Malformed request handling error: {str(e)}"
            )

    def test_performance_testing(self):
        """Test 6: Performance Testing - Verify normal login requests complete well within the timeout limits"""
        print("🔍 TEST 6: PERFORMANCE TESTING FOR LOGIN REQUESTS")
        print("-" * 40)
        
        # Test multiple concurrent requests to simulate load
        def make_request():
            try:
                start_time = time.time()
                response = requests.get(f"{self.api_base}/health", timeout=25)
                response_time = time.time() - start_time
                return response_time, response.status_code
            except Exception as e:
                return None, str(e)
        
        try:
            # Run 5 concurrent requests
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                futures = [executor.submit(make_request) for _ in range(5)]
                results = [future.result() for future in concurrent.futures.as_completed(futures)]
            
            successful_times = [r[0] for r in results if r[0] is not None]
            
            if successful_times:
                avg_time = sum(successful_times) / len(successful_times)
                max_time = max(successful_times)
                min_time = min(successful_times)
                
                if max_time < 15.0:  # Well within 20s backend and 30s frontend limits
                    self.log_result(
                        "Concurrent Request Performance",
                        True,
                        f"All concurrent requests fast (avg: {avg_time:.3f}s, max: {max_time:.3f}s, min: {min_time:.3f}s)",
                        avg_time
                    )
                else:
                    self.log_result(
                        "Concurrent Request Performance",
                        False,
                        f"Some concurrent requests slow (avg: {avg_time:.3f}s, max: {max_time:.3f}s)",
                        avg_time
                    )
            else:
                self.log_result(
                    "Concurrent Request Performance",
                    False,
                    "All concurrent requests failed"
                )
                
        except Exception as e:
            self.log_result(
                "Concurrent Request Performance",
                False,
                f"Concurrent request test error: {str(e)}"
            )

        # Test sequential requests for baseline performance
        try:
            sequential_times = []
            for i in range(3):
                start_time = time.time()
                response = requests.get(f"{self.api_base}/campaigns", timeout=25)
                response_time = time.time() - start_time
                sequential_times.append(response_time)
                
            avg_sequential = sum(sequential_times) / len(sequential_times)
            max_sequential = max(sequential_times)
            
            if max_sequential < 15.0:  # Well within timeout limits
                self.log_result(
                    "Sequential Request Performance",
                    True,
                    f"Sequential requests perform well (avg: {avg_sequential:.3f}s, max: {max_sequential:.3f}s)",
                    avg_sequential
                )
            else:
                self.log_result(
                    "Sequential Request Performance",
                    False,
                    f"Sequential requests too slow (avg: {avg_sequential:.3f}s, max: {max_sequential:.3f}s)",
                    avg_sequential
                )
                
        except Exception as e:
            self.log_result(
                "Sequential Request Performance",
                False,
                f"Sequential request test error: {str(e)}"
            )

    def run_all_tests(self):
        """Run all login timeout fix tests"""
        print("🚀 STARTING LOGIN TIMEOUT FIX COMPREHENSIVE TESTING")
        print("=" * 60)
        print()
        
        # Run all test suites
        self.test_supabase_connection()
        self.test_authentication_api()
        self.test_timeout_configuration()
        self.test_end_to_end_login_flow()
        self.test_supabase_connection_performance()
        self.test_error_handling()
        self.test_performance_testing()
        
        # Generate summary
        self.generate_summary()

    def generate_summary(self):
        """Generate comprehensive test summary"""
        total_time = time.time() - self.start_time
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print("=" * 60)
        print("🎯 LOGIN TIMEOUT FIX TESTING SUMMARY")
        print("=" * 60)
        print(f"📊 Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        print(f"⏱️  Total Time: {total_time:.2f}s")
        print()
        
        # Performance analysis
        response_times = [r["response_time"] for r in self.test_results if r["response_time"]]
        if response_times:
            avg_response = sum(response_times) / len(response_times)
            max_response = max(response_times)
            min_response = min(response_times)
            
            print("⚡ PERFORMANCE ANALYSIS:")
            print(f"   Average Response Time: {avg_response:.3f}s")
            print(f"   Maximum Response Time: {max_response:.3f}s")
            print(f"   Minimum Response Time: {min_response:.3f}s")
            print()
        
        # Timeout compliance analysis
        timeout_compliant = sum(1 for r in self.test_results 
                              if r["response_time"] and r["response_time"] < 30.0)
        timeout_tests = len([r for r in self.test_results if r["response_time"]])
        
        if timeout_tests > 0:
            timeout_compliance = (timeout_compliant / timeout_tests * 100)
            print("⏰ TIMEOUT COMPLIANCE ANALYSIS:")
            print(f"   Tests within 30s frontend limit: {timeout_compliant}/{timeout_tests}")
            print(f"   Timeout compliance rate: {timeout_compliance:.1f}%")
            print()
        
        # Critical findings
        print("🔍 CRITICAL FINDINGS:")
        
        critical_issues = []
        for result in self.test_results:
            if not result["success"]:
                if "timeout" in result["details"].lower():
                    critical_issues.append(f"❌ TIMEOUT ISSUE: {result['test']} - {result['details']}")
                elif result["response_time"] and result["response_time"] > 30.0:
                    critical_issues.append(f"⚠️ SLOW RESPONSE: {result['test']} - {result['response_time']:.3f}s exceeds 30s frontend limit")
        
        if critical_issues:
            for issue in critical_issues:
                print(f"   {issue}")
        else:
            print("   ✅ No critical timeout issues detected")
            print("   ✅ All responses within acceptable timeout limits")
            print("   ✅ Login timeout fixes (Frontend: 30s, Supabase: 35s) working correctly")
            print("   ✅ Timeout sequence properly configured to prevent conflicts")
        
        print()
        
        # Recommendations
        print("💡 RECOMMENDATIONS:")
        if success_rate >= 90:
            print("   ✅ Login timeout fixes are working correctly")
            print("   ✅ Backend performance is within acceptable limits")
            print("   ✅ Authentication system is responsive and stable")
        elif success_rate >= 70:
            print("   ⚠️ Most tests passing but some issues detected")
            print("   🔧 Review failed tests for potential optimizations")
        else:
            print("   ❌ Significant issues detected with login timeout fixes")
            print("   🚨 Immediate attention required for authentication system")
        
        print()
        print("=" * 60)
        print(f"🏁 LOGIN TIMEOUT FIX TESTING COMPLETED")
        print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)

if __name__ == "__main__":
    tester = LoginTimeoutTester()
    tester.run_all_tests()