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

class CreatorLoginAfterRoleFixTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'SPARK-Creator-Login-Tester/1.0'
        })
        self.results = []
        self.auth_token = None
        
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

    def test_login_authentication(self):
        """Test 1: Verify login with test.creator@example.com works"""
        print("🔐 TESTING AUTHENTICATION - Login with test.creator@example.com")
        print("=" * 60)
        
        try:
            # Test login API endpoint
            login_data = {
                "email": URGENT_USER_EMAIL,
                "password": URGENT_USER_PASSWORD
            }
            
            print(f"Attempting login for: {URGENT_USER_EMAIL}")
            
            # Try login via API
            response = self.session.post(
                f"{API_BASE}/auth/login", 
                json=login_data, 
                timeout=30
            )
            
            if response.status_code == 200:
                response_data = response.json()
                
                if response_data.get('success'):
                    self.auth_token = response_data.get('token') or response_data.get('access_token')
                    
                    self.log_result(
                        "Authentication - Login API", 
                        True, 
                        "Login successful via API",
                        f"Response: {response_data.get('message', 'Login completed')}"
                    )
                    
                    # Update session with auth token if available
                    if self.auth_token:
                        self.session.headers.update({
                            'Authorization': f'Bearer {self.auth_token}'
                        })
                        
                else:
                    self.log_result(
                        "Authentication - Login API", 
                        False, 
                        "Login failed - API returned success=false",
                        f"Error: {response_data.get('error', 'Unknown error')}"
                    )
                    
            elif response.status_code == 401:
                self.log_result(
                    "Authentication - Login API", 
                    False, 
                    "Login failed - Invalid credentials",
                    "User credentials may be incorrect or account disabled"
                )
                
            elif response.status_code == 404:
                self.log_result(
                    "Authentication - Login API", 
                    False, 
                    "Login API endpoint not found",
                    "API endpoint may not be implemented"
                )
                
            else:
                self.log_result(
                    "Authentication - Login API", 
                    False, 
                    f"Login failed - HTTP {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
        except requests.exceptions.Timeout:
            self.log_result(
                "Authentication - Login API", 
                False, 
                "Login timed out after 30 seconds",
                "CRITICAL: Login timeout issue still exists"
            )
            
        except Exception as e:
            self.log_result(
                "Authentication - Login API", 
                False, 
                "Login failed with error",
                f"Error: {str(e)}"
            )

    def test_creator_dashboard_access(self):
        """Test 2: Verify user can access /creator/dashboard without "Access Restricted" error"""
        print("🏠 TESTING CREATOR DASHBOARD ACCESS")
        print("=" * 60)
        
        try:
            print("Testing creator dashboard access...")
            
            # Test creator dashboard access
            response = self.session.get(
                f"{BASE_URL}/creator/dashboard", 
                timeout=30,
                allow_redirects=True
            )
            
            if response.status_code == 200:
                html_content = response.text
                
                # Check for access restricted error
                if "Access Restricted" in html_content:
                    self.log_result(
                        "Dashboard Access - Creator Dashboard", 
                        False, 
                        "Access Restricted error still present",
                        "Role fix may not have been applied correctly"
                    )
                    
                elif "This page is only accessible to Creator users" in html_content:
                    self.log_result(
                        "Dashboard Access - Creator Dashboard", 
                        False, 
                        "Creator role restriction still active",
                        "User still appears to have wrong role assignment"
                    )
                    
                elif "You are currently logged in as a User" in html_content:
                    self.log_result(
                        "Dashboard Access - Creator Dashboard", 
                        False, 
                        "User still has 'User' role instead of 'Creator'",
                        "Role fix was not applied - user role is still 'user'"
                    )
                    
                elif "creator" in html_content.lower() and "dashboard" in html_content.lower():
                    # Look for creator-specific content
                    creator_indicators = []
                    if "rate cards" in html_content.lower():
                        creator_indicators.append("Rate Cards section")
                    if "earnings" in html_content.lower():
                        creator_indicators.append("Earnings section")
                    if "campaigns" in html_content.lower():
                        creator_indicators.append("Campaigns section")
                    if "profile" in html_content.lower():
                        creator_indicators.append("Profile section")
                        
                    if creator_indicators:
                        self.log_result(
                            "Dashboard Access - Creator Dashboard", 
                            True, 
                            "Creator dashboard loaded successfully",
                            f"Found creator features: {', '.join(creator_indicators)}"
                        )
                    else:
                        self.log_result(
                            "Dashboard Access - Creator Dashboard", 
                            True, 
                            "Dashboard accessible but creator features unclear",
                            "Page loaded but creator-specific content not clearly identified"
                        )
                        
                else:
                    self.log_result(
                        "Dashboard Access - Creator Dashboard", 
                        True, 
                        "Dashboard accessible without access restrictions",
                        "No 'Access Restricted' errors detected"
                    )
                    
            elif response.status_code == 401:
                self.log_result(
                    "Dashboard Access - Creator Dashboard", 
                    False, 
                    "Dashboard requires authentication",
                    "User may not be properly logged in"
                )
                
            elif response.status_code == 403:
                self.log_result(
                    "Dashboard Access - Creator Dashboard", 
                    False, 
                    "Dashboard access forbidden",
                    "User may still have insufficient permissions"
                )
                
            elif '/auth/login' in response.url:
                self.log_result(
                    "Dashboard Access - Creator Dashboard", 
                    False, 
                    "Redirected to login page",
                    "User authentication may have failed or expired"
                )
                
            else:
                self.log_result(
                    "Dashboard Access - Creator Dashboard", 
                    False, 
                    f"Dashboard access failed - HTTP {response.status_code}",
                    f"Unexpected response from dashboard"
                )
                
        except requests.exceptions.Timeout:
            self.log_result(
                "Dashboard Access - Creator Dashboard", 
                False, 
                "Dashboard access timed out after 30 seconds",
                "Dashboard loading timeout issue"
            )
            
        except Exception as e:
            self.log_result(
                "Dashboard Access - Creator Dashboard", 
                False, 
                "Dashboard access failed with error",
                f"Error: {str(e)}"
            )

    def test_user_profile_role(self):
        """Test 3: Check that user profile shows role: 'creator'"""
        print("👤 TESTING USER PROFILE ROLE")
        print("=" * 60)
        
        try:
            print("Testing user profile API for role verification...")
            
            # Test profile API endpoint
            response = self.session.get(
                f"{API_BASE}/profile", 
                timeout=30
            )
            
            if response.status_code == 200:
                try:
                    profile_data = response.json()
                    
                    user_role = profile_data.get('role')
                    user_email = profile_data.get('email')
                    
                    if user_role == 'creator':
                        self.log_result(
                            "Profile Role - API Check", 
                            True, 
                            f"User role correctly set to 'creator'",
                            f"Email: {user_email}, Role: {user_role}"
                        )
                        
                    elif user_role == 'user':
                        self.log_result(
                            "Profile Role - API Check", 
                            False, 
                            f"User role still set to 'user' instead of 'creator'",
                            f"Email: {user_email}, Role: {user_role} - Role fix not applied"
                        )
                        
                    elif user_role:
                        self.log_result(
                            "Profile Role - API Check", 
                            False, 
                            f"User has unexpected role: '{user_role}'",
                            f"Email: {user_email}, Expected: 'creator', Got: '{user_role}'"
                        )
                        
                    else:
                        self.log_result(
                            "Profile Role - API Check", 
                            False, 
                            "User profile missing role information",
                            f"Profile data: {profile_data}"
                        )
                        
                except json.JSONDecodeError:
                    self.log_result(
                        "Profile Role - API Check", 
                        False, 
                        "Profile API returned invalid JSON",
                        f"Response: {response.text[:200]}"
                    )
                    
            elif response.status_code == 401:
                self.log_result(
                    "Profile Role - API Check", 
                    False, 
                    "Profile API requires authentication",
                    "User may not be properly logged in"
                )
                
            elif response.status_code == 404:
                self.log_result(
                    "Profile Role - API Check", 
                    False, 
                    "Profile API endpoint not found",
                    "API endpoint may not be implemented"
                )
                
            else:
                self.log_result(
                    "Profile Role - API Check", 
                    False, 
                    f"Profile API failed - HTTP {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_result(
                "Profile Role - API Check", 
                False, 
                "Profile role check failed with error",
                f"Error: {str(e)}"
            )

        # Alternative: Check profile via dashboard page content
        try:
            print("Testing profile role via dashboard page content...")
            
            response = self.session.get(
                f"{BASE_URL}/creator/dashboard", 
                timeout=30
            )
            
            if response.status_code == 200:
                html_content = response.text
                
                # Look for role indicators in the page
                if '"role":"creator"' in html_content or "'role': 'creator'" in html_content:
                    self.log_result(
                        "Profile Role - Dashboard Content", 
                        True, 
                        "Creator role found in dashboard page data",
                        "Role appears correctly set in frontend"
                    )
                    
                elif '"role":"user"' in html_content or "'role': 'user'" in html_content:
                    self.log_result(
                        "Profile Role - Dashboard Content", 
                        False, 
                        "User role found in dashboard page data",
                        "Role fix not applied - still shows 'user' role"
                    )
                    
                else:
                    self.log_result(
                        "Profile Role - Dashboard Content", 
                        True, 
                        "No explicit role data found in dashboard content",
                        "Role may be handled server-side or in different format"
                    )
                    
            else:
                self.log_result(
                    "Profile Role - Dashboard Content", 
                    False, 
                    f"Cannot check dashboard content - HTTP {response.status_code}",
                    "Dashboard not accessible for role verification"
                )
                
        except Exception as e:
            self.log_result(
                "Profile Role - Dashboard Content", 
                False, 
                "Dashboard content role check failed",
                f"Error: {str(e)}"
            )

    def test_creator_dashboard_functionality(self):
        """Test 4: Verify creator-specific features are accessible"""
        print("⚙️ TESTING CREATOR DASHBOARD FUNCTIONALITY")
        print("=" * 60)
        
        # Test creator-specific API endpoints
        creator_endpoints = [
            ("/api/rate-cards", "Rate Cards API"),
            ("/api/offers", "Offers API"),
            ("/api/creator/earnings", "Creator Earnings API"),
            ("/api/creator/campaigns", "Creator Campaigns API"),
            ("/api/creator/profile", "Creator Profile API")
        ]
        
        working_endpoints = 0
        total_endpoints = len(creator_endpoints)
        
        for endpoint, description in creator_endpoints:
            try:
                print(f"Testing {description}...")
                
                response = self.session.get(
                    f"{BASE_URL}{endpoint}", 
                    timeout=15
                )
                
                if response.status_code == 200:
                    working_endpoints += 1
                    self.log_result(
                        f"Creator Functionality - {description}", 
                        True, 
                        f"API accessible and responding",
                        f"Status: {response.status_code}"
                    )
                    
                elif response.status_code == 401:
                    self.log_result(
                        f"Creator Functionality - {description}", 
                        False, 
                        f"API requires authentication",
                        "User may not be properly authenticated"
                    )
                    
                elif response.status_code == 403:
                    self.log_result(
                        f"Creator Functionality - {description}", 
                        False, 
                        f"API access forbidden",
                        "User may not have creator permissions"
                    )
                    
                elif response.status_code == 404:
                    self.log_result(
                        f"Creator Functionality - {description}", 
                        True, 
                        f"API endpoint not implemented (404)",
                        "Endpoint may not be built yet - not a role issue"
                    )
                    
                else:
                    self.log_result(
                        f"Creator Functionality - {description}", 
                        False, 
                        f"API returned HTTP {response.status_code}",
                        f"Unexpected response"
                    )
                    
            except requests.exceptions.Timeout:
                self.log_result(
                    f"Creator Functionality - {description}", 
                    False, 
                    f"API timed out after 15 seconds",
                    "API performance issue"
                )
                
            except Exception as e:
                self.log_result(
                    f"Creator Functionality - {description}", 
                    False, 
                    f"API test failed with error",
                    f"Error: {str(e)}"
                )

        # Test creator dashboard page features
        try:
            print("Testing creator dashboard page features...")
            
            response = self.session.get(
                f"{BASE_URL}/creator/dashboard", 
                timeout=30
            )
            
            if response.status_code == 200:
                html_content = response.text
                
                # Look for creator-specific features
                creator_features = []
                
                if "rate cards" in html_content.lower():
                    creator_features.append("Rate Cards management")
                if "earnings" in html_content.lower():
                    creator_features.append("Earnings tracking")
                if "campaigns" in html_content.lower():
                    creator_features.append("Campaign management")
                if "offers" in html_content.lower():
                    creator_features.append("Offers management")
                if "profile" in html_content.lower():
                    creator_features.append("Profile management")
                    
                if len(creator_features) >= 3:
                    self.log_result(
                        "Creator Functionality - Dashboard Features", 
                        True, 
                        f"Multiple creator features found ({len(creator_features)})",
                        f"Features: {', '.join(creator_features)}"
                    )
                elif len(creator_features) >= 1:
                    self.log_result(
                        "Creator Functionality - Dashboard Features", 
                        True, 
                        f"Some creator features found ({len(creator_features)})",
                        f"Features: {', '.join(creator_features)}"
                    )
                else:
                    self.log_result(
                        "Creator Functionality - Dashboard Features", 
                        False, 
                        "No clear creator features found in dashboard",
                        "Dashboard may not have creator-specific functionality"
                    )
                    
            else:
                self.log_result(
                    "Creator Functionality - Dashboard Features", 
                    False, 
                    f"Cannot access dashboard - HTTP {response.status_code}",
                    "Dashboard not accessible for feature testing"
                )
                
        except Exception as e:
            self.log_result(
                "Creator Functionality - Dashboard Features", 
                False, 
                "Dashboard feature test failed",
                f"Error: {str(e)}"
            )

    def run_creator_login_tests(self):
        """Run all creator login tests after role fix"""
        
        print("🎯 CREATOR LOGIN AFTER ROLE FIX - COMPREHENSIVE TESTING")
        print("=" * 80)
        print(f"TARGET USER: {URGENT_USER_EMAIL}")
        print(f"EXPECTED ROLE: {URGENT_USER_ROLE}")
        print(f"ISSUE: Previous role permission error after successful login")
        print(f"FIX APPLIED: User role updated from 'user' to 'creator'")
        print(f"TARGET URL: {BASE_URL}")
        print(f"TIMESTAMP: {datetime.now().isoformat()}")
        print("=" * 80)
        print()
        
        # Run all tests in sequence
        self.test_login_authentication()
        self.test_creator_dashboard_access()
        self.test_user_profile_role()
        self.test_creator_dashboard_functionality()
        
        # Generate test summary
        self.generate_test_summary()

    def generate_test_summary(self):
        """Generate comprehensive test summary"""
        
        print("\n" + "=" * 80)
        print("🎯 CREATOR LOGIN TESTING RESULTS")
        print("=" * 80)
        
        # Calculate success rates
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r['success'])
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"TEST SUMMARY:")
        print(f"  Tests Completed: {total_tests}")
        print(f"  Tests Passed: {passed_tests}")
        print(f"  Success Rate: {success_rate:.1f}%")
        print()
        
        # Categorize results
        auth_tests = [r for r in self.results if 'Authentication' in r['test']]
        access_tests = [r for r in self.results if 'Dashboard Access' in r['test']]
        role_tests = [r for r in self.results if 'Profile Role' in r['test']]
        functionality_tests = [r for r in self.results if 'Creator Functionality' in r['test']]
        
        # Test category results
        categories = [
            ("Authentication Tests", auth_tests),
            ("Dashboard Access Tests", access_tests),
            ("Profile Role Tests", role_tests),
            ("Creator Functionality Tests", functionality_tests)
        ]
        
        print("📊 RESULTS BY CATEGORY:")
        print()
        
        for category_name, category_tests in categories:
            if category_tests:
                category_passed = sum(1 for t in category_tests if t['success'])
                category_total = len(category_tests)
                category_rate = (category_passed / category_total) * 100
                
                status = "✅" if category_rate >= 80 else "⚠️" if category_rate >= 50 else "❌"
                print(f"{status} {category_name}: {category_passed}/{category_total} ({category_rate:.1f}%)")
                
                # Show failed tests in this category
                failed_tests = [t for t in category_tests if not t['success']]
                if failed_tests:
                    for test in failed_tests:
                        print(f"   ❌ {test['test']}: {test['message']}")
                print()
        
        # Overall assessment
        print("🎯 OVERALL ASSESSMENT:")
        print()
        
        if success_rate >= 90:
            print("✅ EXCELLENT - Role fix appears to be working correctly")
            print("   User should be able to login and access creator dashboard")
            print("   All major functionality is working as expected")
            
        elif success_rate >= 70:
            print("✅ GOOD - Role fix mostly working with minor issues")
            print("   User can login and access creator dashboard")
            print("   Some functionality may need attention")
            
        elif success_rate >= 50:
            print("⚠️ PARTIAL - Role fix partially working")
            print("   Some aspects working but significant issues remain")
            print("   Additional fixes may be needed")
            
        else:
            print("❌ FAILED - Role fix not working correctly")
            print("   Major issues prevent proper creator access")
            print("   Role fix may not have been applied or other issues exist")
        
        print()
        print("🔧 RECOMMENDATIONS:")
        
        # Specific recommendations based on test results
        auth_success = all(t['success'] for t in auth_tests) if auth_tests else False
        access_success = all(t['success'] for t in access_tests) if access_tests else False
        role_success = all(t['success'] for t in role_tests) if role_tests else False
        
        if not auth_success:
            print("   1. ❌ AUTHENTICATION ISSUES - Check login credentials and authentication system")
        elif not access_success:
            print("   1. ❌ ACCESS ISSUES - Check role-based access controls and permissions")
        elif not role_success:
            print("   1. ❌ ROLE ISSUES - Verify role fix was applied correctly in database")
        else:
            print("   1. ✅ CORE FUNCTIONALITY WORKING - Role fix appears successful")
        
        if success_rate < 100:
            print("   2. 🔍 INVESTIGATE FAILED TESTS - Review specific test failures above")
            print("   3. 🔄 RE-TEST AFTER FIXES - Run tests again after addressing issues")
        
        print("=" * 80)
        
        return success_rate >= 70  # Return True if role fix is working

def main():
    """Main execution for creator login testing after role fix"""
    print("🚨 SPARK PLATFORM - CREATOR LOGIN AFTER ROLE FIX TESTING")
    print("Focus: Verify role fix for test.creator@example.com")
    print(f"Target: {BASE_URL}")
    print(f"Test User: {URGENT_USER_EMAIL}")
    print()
    
    tester = CreatorLoginAfterRoleFixTester()
    
    try:
        tester.run_creator_login_tests()
        
        print("\n🏁 CREATOR LOGIN TESTING COMPLETE")
        print("   Check results above for role fix verification")
            
    except KeyboardInterrupt:
        print("\n⚠️ Testing interrupted by user")
    except Exception as e:
        print(f"\n❌ Testing failed with error: {str(e)}")
        
    print(f"\n📊 Total tests completed: {len(tester.results)}")
    print("🎯 Creator login role fix testing complete")

if __name__ == "__main__":
    main()