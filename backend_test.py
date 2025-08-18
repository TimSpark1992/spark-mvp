#!/usr/bin/env python3
"""
URGENT: Backend Testing for Creator Login After Role Fix
=======================================================

CRITICAL TESTING: User test.creator@example.com after role update
- Previous issue: User authenticated but had wrong role assignment
- Role fix applied: User role should now be 'creator' instead of 'user'
- Need to verify login works and creator dashboard access is granted

IMMEDIATE TESTING FOCUS:
1. Test Authentication - Verify login with test.creator@example.com / testpassword123 works
2. Test Role Access - Verify user can access /creator/dashboard without "Access Restricted" error
3. Test Profile Data - Check that user profile shows role: 'creator' 
4. Test Dashboard Functionality - Verify creator-specific features are accessible

EXPECTED OUTCOME: 
✅ Login succeeds without timeout
✅ User redirected to /creator/dashboard  
✅ No "Access Restricted" error messages
✅ Creator dashboard loads with proper functionality
"""

import requests
import json
import time
import os
from datetime import datetime

# Configuration
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://brand-creator-link-1.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

# URGENT: Test credentials for the problematic user
URGENT_USER_EMAIL = "test.creator@example.com"
URGENT_USER_PASSWORD = "testpassword123"
URGENT_USER_ROLE = "creator"

class UrgentLoginTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'SPARK-Urgent-Login-Tester/1.0'
        })
        self.results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
        print()

    def test_system_health_check(self):
        """URGENT: Test basic system health before diagnosing user issue"""
        print("🚨 URGENT SYSTEM HEALTH CHECK")
        print("=" * 60)
        
        # Test 1: API Connectivity
        try:
            response = self.session.get(f"{API_BASE}/root", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('message') == 'Hello World':
                    self.log_result(
                        "System Health - API", 
                        True, 
                        "Backend API is healthy and responding",
                        f"Response time: {response.elapsed.total_seconds():.2f}s"
                    )
                else:
                    self.log_result(
                        "System Health - API", 
                        False, 
                        "API responding but with unexpected data",
                        f"Got: {data}"
                    )
            else:
                self.log_result(
                    "System Health - API", 
                    False, 
                    f"API unhealthy - status {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_result(
                "System Health - API", 
                False, 
                "API completely inaccessible",
                f"Error: {str(e)}"
            )

        # Test 2: Frontend Health
        try:
            response = self.session.get(f"{BASE_URL}/auth/login", timeout=15)
            
            if response.status_code == 200:
                html_content = response.text
                
                # Check for critical errors
                if "SUPABASE CONFIGURATION ERROR" in html_content:
                    self.log_result(
                        "System Health - Frontend", 
                        False, 
                        "CRITICAL: Supabase configuration error detected",
                        "Missing environment variables"
                    )
                elif "error" in html_content.lower() and "500" in html_content:
                    self.log_result(
                        "System Health - Frontend", 
                        False, 
                        "Frontend showing server errors",
                        "500 error detected in HTML"
                    )
                else:
                    self.log_result(
                        "System Health - Frontend", 
                        True, 
                        "Frontend login page accessible and healthy",
                        f"Response time: {response.elapsed.total_seconds():.2f}s"
                    )
            else:
                self.log_result(
                    "System Health - Frontend", 
                    False, 
                    f"Frontend unhealthy - status {response.status_code}",
                    f"Login page not accessible"
                )
                
        except Exception as e:
            self.log_result(
                "System Health - Frontend", 
                False, 
                "Frontend completely inaccessible",
                f"Error: {str(e)}"
            )

    def test_user_account_existence(self):
        """URGENT: Test if the problematic user account exists"""
        print(f"🔍 URGENT USER ACCOUNT DIAGNOSIS: {URGENT_USER_EMAIL}")
        print("=" * 60)
        
        # Test 1: Check signup page behavior (should indicate user exists)
        try:
            print(f"Testing signup behavior for existing user: {URGENT_USER_EMAIL}")
            
            # Access signup page
            response = self.session.get(f"{BASE_URL}/auth/signup", timeout=10)
            
            if response.status_code == 200:
                self.log_result(
                    "User Existence - Signup Page Access", 
                    True, 
                    "Signup page accessible for testing user existence",
                    f"Can proceed with user existence test"
                )
                
                # Check if page has proper form elements for testing
                html_content = response.text
                has_email_field = 'type="email"' in html_content or 'name="email"' in html_content
                has_password_field = 'type="password"' in html_content
                
                if has_email_field and has_password_field:
                    self.log_result(
                        "User Existence - Signup Form", 
                        True, 
                        "Signup form has required fields for testing",
                        "Email and password fields detected"
                    )
                else:
                    self.log_result(
                        "User Existence - Signup Form", 
                        False, 
                        "Signup form missing required fields",
                        f"Email field: {has_email_field}, Password field: {has_password_field}"
                    )
            else:
                self.log_result(
                    "User Existence - Signup Page Access", 
                    False, 
                    f"Cannot access signup page (status: {response.status_code})",
                    "Cannot test user existence"
                )
                
        except Exception as e:
            self.log_result(
                "User Existence - Signup Page Access", 
                False, 
                "Failed to access signup page",
                f"Error: {str(e)}"
            )

        # Test 2: Check creator dashboard protection (should redirect to login)
        try:
            print(f"Testing creator dashboard access for authentication check...")
            
            response = self.session.get(f"{BASE_URL}/creator/dashboard", timeout=10, allow_redirects=True)
            
            # Should redirect to login if not authenticated
            if '/auth/login' in response.url:
                self.log_result(
                    "User Account - Dashboard Protection", 
                    True, 
                    "Creator dashboard properly protected (redirects to login)",
                    f"Redirected to: {response.url}"
                )
            elif response.status_code == 401:
                self.log_result(
                    "User Account - Dashboard Protection", 
                    True, 
                    "Creator dashboard properly protected (401 unauthorized)",
                    "Authentication required as expected"
                )
            elif response.status_code == 200:
                self.log_result(
                    "User Account - Dashboard Protection", 
                    False, 
                    "SECURITY ISSUE: Dashboard accessible without authentication",
                    "This indicates a serious security problem"
                )
            else:
                self.log_result(
                    "User Account - Dashboard Protection", 
                    False, 
                    f"Unexpected dashboard response (status: {response.status_code})",
                    f"Expected redirect to login or 401"
                )
                
        except Exception as e:
            self.log_result(
                "User Account - Dashboard Protection", 
                False, 
                "Failed to test dashboard protection",
                f"Error: {str(e)}"
            )

    def test_login_timeout_diagnosis(self):
        """URGENT: Diagnose the specific login timeout issue"""
        print(f"⏱️ URGENT LOGIN TIMEOUT DIAGNOSIS: {URGENT_USER_EMAIL}")
        print("=" * 60)
        
        # Test 1: Login page response time
        try:
            print("Testing login page response time...")
            
            start_time = time.time()
            response = self.session.get(f"{BASE_URL}/auth/login", timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                if response_time < 5.0:
                    self.log_result(
                        "Login Timeout - Page Load Speed", 
                        True, 
                        f"Login page loads quickly ({response_time:.2f}s)",
                        "Page load speed not causing timeout"
                    )
                elif response_time < 15.0:
                    self.log_result(
                        "Login Timeout - Page Load Speed", 
                        True, 
                        f"Login page loads acceptably ({response_time:.2f}s)",
                        "May contribute to timeout but not critical"
                    )
                else:
                    self.log_result(
                        "Login Timeout - Page Load Speed", 
                        False, 
                        f"Login page loads slowly ({response_time:.2f}s)",
                        "Slow page load likely contributing to timeout"
                    )
            else:
                self.log_result(
                    "Login Timeout - Page Load Speed", 
                    False, 
                    f"Login page failed to load (status: {response.status_code})",
                    f"Response time: {response_time:.2f}s"
                )
                
        except requests.exceptions.Timeout:
            self.log_result(
                "Login Timeout - Page Load Speed", 
                False, 
                "Login page itself times out after 30s",
                "CRITICAL: Page load timeout explains user login timeout"
            )
        except Exception as e:
            self.log_result(
                "Login Timeout - Page Load Speed", 
                False, 
                "Failed to test login page load speed",
                f"Error: {str(e)}"
            )

        # Test 2: Check for timeout configurations in login page
        try:
            print("Checking login page for timeout configurations...")
            
            response = self.session.get(f"{BASE_URL}/auth/login", timeout=15)
            
            if response.status_code == 200:
                html_content = response.text
                
                # Look for timeout-related code
                timeout_indicators = []
                if "30000" in html_content:  # 30 second timeout
                    timeout_indicators.append("30-second timeout configured")
                if "25000" in html_content:  # 25 second Supabase timeout
                    timeout_indicators.append("25-second Supabase timeout configured")
                if "timeout" in html_content.lower():
                    timeout_indicators.append("Timeout handling code present")
                if "promise.race" in html_content.lower():
                    timeout_indicators.append("Promise.race timeout protection")
                if "abortcontroller" in html_content.lower():
                    timeout_indicators.append("AbortController timeout protection")
                
                if timeout_indicators:
                    self.log_result(
                        "Login Timeout - Configuration Check", 
                        True, 
                        "Timeout protection mechanisms found in login page",
                        f"Found: {', '.join(timeout_indicators)}"
                    )
                else:
                    self.log_result(
                        "Login Timeout - Configuration Check", 
                        False, 
                        "No timeout protection mechanisms found",
                        "Login page may lack timeout handling"
                    )
            else:
                self.log_result(
                    "Login Timeout - Configuration Check", 
                    False, 
                    f"Cannot check timeout configuration (status: {response.status_code})",
                    "Unable to analyze login page code"
                )
                
        except Exception as e:
            self.log_result(
                "Login Timeout - Configuration Check", 
                False, 
                "Failed to check timeout configuration",
                f"Error: {str(e)}"
            )

    def test_supabase_connectivity(self):
        """URGENT: Test Supabase connectivity and configuration"""
        print("🔧 URGENT SUPABASE CONNECTIVITY TEST")
        print("=" * 60)
        
        # Test 1: Check for Supabase configuration errors
        try:
            print("Checking for Supabase configuration errors...")
            
            response = self.session.get(f"{BASE_URL}/auth/login", timeout=10)
            
            if response.status_code == 200:
                html_content = response.text
                
                # Check for specific Supabase errors
                if "SUPABASE CONFIGURATION ERROR" in html_content:
                    self.log_result(
                        "Supabase - Configuration", 
                        False, 
                        "CRITICAL: Supabase configuration error detected",
                        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
                    )
                elif "Missing environment variables" in html_content:
                    self.log_result(
                        "Supabase - Configuration", 
                        False, 
                        "CRITICAL: Missing Supabase environment variables",
                        "Check .env.local file for Supabase configuration"
                    )
                elif "supabase" in html_content.lower():
                    self.log_result(
                        "Supabase - Configuration", 
                        True, 
                        "Supabase configuration appears valid",
                        "No configuration errors detected in HTML"
                    )
                else:
                    self.log_result(
                        "Supabase - Configuration", 
                        True, 
                        "No obvious Supabase configuration issues",
                        "Login page loads without configuration errors"
                    )
            else:
                self.log_result(
                    "Supabase - Configuration", 
                    False, 
                    f"Cannot check Supabase configuration (status: {response.status_code})",
                    "Login page not accessible"
                )
                
        except Exception as e:
            self.log_result(
                "Supabase - Configuration", 
                False, 
                "Failed to check Supabase configuration",
                f"Error: {str(e)}"
            )

        # Test 2: Test Supabase-related API endpoints
        try:
            print("Testing Supabase-related functionality...")
            
            # Test if any Supabase-related endpoints are accessible
            supabase_endpoints = [
                "/api/auth/callback",
                "/api/profiles", 
                "/api/setup-database"
            ]
            
            working_endpoints = 0
            total_endpoints = len(supabase_endpoints)
            
            for endpoint in supabase_endpoints:
                try:
                    response = self.session.get(f"{BASE_URL}{endpoint}", timeout=10)
                    # Any response (even 404/401) is better than timeout/connection error
                    if response.status_code in [200, 401, 404, 405, 500]:
                        working_endpoints += 1
                except:
                    pass  # Endpoint not working
            
            if working_endpoints >= total_endpoints // 2:
                self.log_result(
                    "Supabase - API Endpoints", 
                    True, 
                    f"Supabase-related endpoints responding ({working_endpoints}/{total_endpoints})",
                    "Supabase connectivity appears functional"
                )
            else:
                self.log_result(
                    "Supabase - API Endpoints", 
                    False, 
                    f"Most Supabase endpoints not responding ({working_endpoints}/{total_endpoints})",
                    "Supabase connectivity issues detected"
                )
                
        except Exception as e:
            self.log_result(
                "Supabase - API Endpoints", 
                False, 
                "Failed to test Supabase endpoints",
                f"Error: {str(e)}"
            )

    def test_network_performance(self):
        """URGENT: Test network performance that might cause timeouts"""
        print("⚡ URGENT NETWORK PERFORMANCE TEST")
        print("=" * 60)
        
        # Test multiple requests to identify network issues
        test_urls = [
            (f"{BASE_URL}/", "Homepage"),
            (f"{BASE_URL}/auth/login", "Login Page"),
            (f"{BASE_URL}/auth/signup", "Signup Page"),
            (f"{API_BASE}/root", "API Root")
        ]
        
        total_tests = len(test_urls)
        fast_responses = 0
        slow_responses = 0
        failed_responses = 0
        
        for url, description in test_urls:
            try:
                start_time = time.time()
                response = self.session.get(url, timeout=30)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    if response_time < 3.0:
                        fast_responses += 1
                        self.log_result(
                            f"Network Performance - {description}", 
                            True, 
                            f"Fast response: {response_time:.2f}s",
                            "Good network performance"
                        )
                    elif response_time < 10.0:
                        slow_responses += 1
                        self.log_result(
                            f"Network Performance - {description}", 
                            True, 
                            f"Slow response: {response_time:.2f}s",
                            "May contribute to timeout issues"
                        )
                    else:
                        failed_responses += 1
                        self.log_result(
                            f"Network Performance - {description}", 
                            False, 
                            f"Very slow response: {response_time:.2f}s",
                            "Likely causing timeout issues"
                        )
                else:
                    failed_responses += 1
                    self.log_result(
                        f"Network Performance - {description}", 
                        False, 
                        f"Failed request: status {response.status_code} in {response_time:.2f}s",
                        "Request failed"
                    )
                    
            except requests.exceptions.Timeout:
                failed_responses += 1
                self.log_result(
                    f"Network Performance - {description}", 
                    False, 
                    "Request timed out after 30s",
                    "CRITICAL: Network timeout explains login issues"
                )
            except Exception as e:
                failed_responses += 1
                self.log_result(
                    f"Network Performance - {description}", 
                    False, 
                    f"Network error: {str(e)}",
                    "Network connectivity issue"
                )
        
        # Overall network assessment
        if fast_responses >= total_tests // 2:
            self.log_result(
                "Network Performance - Overall", 
                True, 
                f"Network performance good ({fast_responses}/{total_tests} fast responses)",
                "Network not likely causing login timeout"
            )
        elif slow_responses + fast_responses >= total_tests // 2:
            self.log_result(
                "Network Performance - Overall", 
                True, 
                f"Network performance acceptable ({fast_responses + slow_responses}/{total_tests} working)",
                "Network may contribute to login timeout"
            )
        else:
            self.log_result(
                "Network Performance - Overall", 
                False, 
                f"Network performance poor ({failed_responses}/{total_tests} failed)",
                "Network issues likely causing login timeout"
            )

    def run_urgent_diagnosis(self):
        """Run urgent diagnosis for the specific login issue"""
        
        print("🚨 URGENT LOGIN ISSUE DIAGNOSIS")
        print("=" * 80)
        print(f"PROBLEM USER: {URGENT_USER_EMAIL}")
        print(f"ISSUE: Account exists but login times out with valid credentials")
        print(f"EXPECTED: User should login successfully and access creator dashboard")
        print(f"TARGET URL: {BASE_URL}")
        print(f"TIMESTAMP: {datetime.now().isoformat()}")
        print("=" * 80)
        print()
        
        # Run all diagnostic tests in order of priority
        self.test_system_health_check()
        self.test_user_account_existence()
        self.test_login_timeout_diagnosis()
        self.test_supabase_connectivity()
        self.test_network_performance()
        
        # Generate urgent recommendations
        self.generate_urgent_recommendations()

    def generate_urgent_recommendations(self):
        """Generate urgent recommendations based on test results"""
        
        print("\n" + "=" * 80)
        print("🎯 URGENT DIAGNOSIS RESULTS & RECOMMENDATIONS")
        print("=" * 80)
        
        # Calculate success rates
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r['success'])
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"DIAGNOSIS SUMMARY:")
        print(f"  Tests Completed: {total_tests}")
        print(f"  Tests Passed: {passed_tests}")
        print(f"  Success Rate: {success_rate:.1f}%")
        print()
        
        # Analyze critical issues
        critical_issues = []
        system_issues = []
        config_issues = []
        network_issues = []
        
        for result in self.results:
            if not result['success']:
                if 'System Health' in result['test']:
                    system_issues.append(result)
                elif 'Supabase' in result['test'] or 'Configuration' in result['test']:
                    config_issues.append(result)
                elif 'Network' in result['test'] or 'timeout' in result['message'].lower():
                    network_issues.append(result)
                else:
                    critical_issues.append(result)
        
        # Generate specific recommendations
        print("🚨 URGENT ACTIONS REQUIRED:")
        print()
        
        if system_issues:
            print("1. SYSTEM HEALTH ISSUES DETECTED:")
            for issue in system_issues:
                print(f"   ❌ {issue['test']}: {issue['message']}")
            print("   → IMMEDIATE ACTION: Check server status and restart services")
            print("   → Run: sudo supervisorctl restart all")
            print()
        
        if config_issues:
            print("2. CONFIGURATION ISSUES DETECTED:")
            for issue in config_issues:
                print(f"   ❌ {issue['test']}: {issue['message']}")
            print("   → IMMEDIATE ACTION: Check Supabase configuration")
            print("   → Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local")
            print("   → Check Supabase project status and API keys")
            print()
        
        if network_issues:
            print("3. NETWORK/TIMEOUT ISSUES DETECTED:")
            for issue in network_issues:
                print(f"   ❌ {issue['test']}: {issue['message']}")
            print("   → IMMEDIATE ACTION: Network connectivity causing login timeout")
            print("   → Check internet connection and DNS resolution")
            print("   → Consider increasing timeout values if network is slow")
            print()
        
        # Specific recommendations for the user issue
        print("🎯 SPECIFIC RECOMMENDATIONS FOR USER LOGIN ISSUE:")
        print()
        
        if success_rate >= 80:
            print("✅ SYSTEM APPEARS HEALTHY - Issue likely user-specific:")
            print("   1. Check Supabase Auth dashboard for user account status")
            print("   2. Verify user email confirmation status")
            print("   3. Check if user account is suspended or disabled")
            print("   4. Try password reset for the user")
            print("   5. Check RLS policies in Supabase for profile access")
        elif success_rate >= 60:
            print("⚠️ SYSTEM HAS ISSUES - Mixed system and user problems:")
            print("   1. Fix system issues identified above first")
            print("   2. Then check user-specific issues")
            print("   3. Monitor system performance during login attempts")
        else:
            print("❌ CRITICAL SYSTEM ISSUES - Fix system first:")
            print("   1. System is too unhealthy to diagnose user-specific issues")
            print("   2. Fix all system health, configuration, and network issues")
            print("   3. Re-run diagnosis after system fixes")
            print("   4. Then address user-specific login problems")
        
        print()
        print("🔧 IMMEDIATE NEXT STEPS:")
        print("   1. Address highest priority issues identified above")
        print("   2. Test login with a different user account to isolate issue")
        print("   3. Check Supabase logs for authentication errors")
        print("   4. Re-test login for test.creator@example.com after fixes")
        
        print("=" * 80)
        
        return success_rate >= 60  # Return True if system is healthy enough for user fixes

def main():
    """Main execution for urgent login diagnosis"""
    print("🚨 SPARK PLATFORM - URGENT LOGIN ISSUE DIAGNOSIS")
    print("Focus: Existing User Login Timeout Issue")
    print(f"Target: {BASE_URL}")
    print(f"Problem User: {URGENT_USER_EMAIL}")
    print()
    
    tester = UrgentLoginTester()
    
    try:
        system_healthy = tester.run_urgent_diagnosis()
        
        if system_healthy:
            print("\n✅ DIAGNOSIS COMPLETE - System healthy enough for user-specific fixes")
            print("   Focus on user account issues and Supabase authentication")
        else:
            print("\n❌ DIAGNOSIS COMPLETE - System issues must be fixed first")
            print("   Address system health issues before user-specific problems")
            
    except KeyboardInterrupt:
        print("\n⚠️ Diagnosis interrupted by user")
    except Exception as e:
        print(f"\n❌ Diagnosis failed with error: {str(e)}")
        
    print(f"\n📊 Total diagnostic tests: {len(tester.results)}")
    print("🏁 Urgent diagnosis complete")

if __name__ == "__main__":
    main()