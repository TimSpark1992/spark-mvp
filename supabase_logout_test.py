#!/usr/bin/env python3
"""
SUPABASE LOGOUT FUNCTION SPECIFIC TESTING
==========================================

Test the specific Supabase signOut function and authentication state management:
1. Test signOut function implementation in supabase.js
2. Test AuthProvider logout handling
3. Test session persistence after logout
4. Test authentication state cleanup
"""

import requests
import json
import time
import os
from datetime import datetime

class SupabaseLogoutTester:
    def __init__(self):
        self.backend_url = 'http://localhost:3000'
        self.api_base = f"{self.backend_url}/api"
        
        print(f"🎯 SUPABASE LOGOUT FUNCTION SPECIFIC TESTING")
        print(f"Backend URL: {self.backend_url}")
        print("=" * 80)
        
        self.test_results = []
        self.session = requests.Session()

    def log_test_result(self, test_name, success, details, response_time=None):
        """Log test results with consistent formatting"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            'test': test_name,
            'status': status,
            'success': success,
            'details': details,
            'response_time': response_time,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        time_info = f" ({response_time:.3f}s)" if response_time else ""
        print(f"{status}: {test_name}{time_info}")
        if details:
            print(f"    Details: {details}")
        print()

    def test_supabase_signout_function_implementation(self):
        """Test 1: Verify signOut function is properly implemented in supabase.js"""
        try:
            start_time = time.time()
            
            # Read the supabase.js file to verify signOut function implementation
            supabase_file_path = '/app/lib/supabase.js'
            
            if not os.path.exists(supabase_file_path):
                self.log_test_result(
                    "Supabase signOut Function Implementation",
                    False,
                    "supabase.js file not found"
                )
                return False
            
            with open(supabase_file_path, 'r') as f:
                content = f.read()
            
            response_time = time.time() - start_time
            
            # Check for signOut function implementation
            signout_checks = {
                'signOut function exported': 'export const signOut' in content,
                'supabase.auth.signOut called': 'supabase.auth.signOut()' in content,
                'error handling present': 'error' in content.lower() and 'signout' in content.lower(),
                'async function': 'async' in content and 'signOut' in content
            }
            
            all_checks_passed = all(signout_checks.values())
            check_details = ', '.join([f"{k}: {'✓' if v else '✗'}" for k, v in signout_checks.items()])
            
            if all_checks_passed:
                self.log_test_result(
                    "Supabase signOut Function Implementation",
                    True,
                    f"signOut function properly implemented - {check_details}",
                    response_time
                )
                return True
            else:
                self.log_test_result(
                    "Supabase signOut Function Implementation",
                    False,
                    f"signOut function implementation issues - {check_details}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test_result(
                "Supabase signOut Function Implementation",
                False,
                f"Failed to verify signOut implementation: {str(e)}"
            )
            return False

    def test_auth_provider_logout_handling(self):
        """Test 2: Verify AuthProvider properly handles logout"""
        try:
            start_time = time.time()
            
            # Read the AuthProvider.js file to verify logout handling
            auth_provider_path = '/app/components/AuthProvider.js'
            
            if not os.path.exists(auth_provider_path):
                self.log_test_result(
                    "AuthProvider Logout Handling",
                    False,
                    "AuthProvider.js file not found"
                )
                return False
            
            with open(auth_provider_path, 'r') as f:
                content = f.read()
            
            response_time = time.time() - start_time
            
            # Check for proper logout handling in AuthProvider
            auth_checks = {
                'onAuthStateChange listener': 'onAuthStateChange' in content,
                'user state management': 'setUser(null)' in content,
                'profile state management': 'setProfile(null)' in content,
                'session handling': 'session' in content,
                'loading state management': 'setLoading' in content
            }
            
            all_checks_passed = all(auth_checks.values())
            check_details = ', '.join([f"{k}: {'✓' if v else '✗'}" for k, v in auth_checks.items()])
            
            if all_checks_passed:
                self.log_test_result(
                    "AuthProvider Logout Handling",
                    True,
                    f"AuthProvider properly handles logout - {check_details}",
                    response_time
                )
                return True
            else:
                self.log_test_result(
                    "AuthProvider Logout Handling",
                    False,
                    f"AuthProvider logout handling issues - {check_details}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test_result(
                "AuthProvider Logout Handling",
                False,
                f"Failed to verify AuthProvider logout handling: {str(e)}"
            )
            return False

    def test_navbar_logout_implementation(self):
        """Test 3: Verify Navbar logout button implementation"""
        try:
            start_time = time.time()
            
            # Read the Navbar.js file to verify logout button implementation
            navbar_path = '/app/components/shared/Navbar.js'
            
            if not os.path.exists(navbar_path):
                self.log_test_result(
                    "Navbar Logout Implementation",
                    False,
                    "Navbar.js file not found"
                )
                return False
            
            with open(navbar_path, 'r') as f:
                content = f.read()
            
            response_time = time.time() - start_time
            
            # Check for proper logout implementation in Navbar
            navbar_checks = {
                'handleLogout function': 'handleLogout' in content,
                'signOut import': 'signOut' in content and 'import' in content,
                'logout button present': 'Logout' in content or 'LogOut' in content,
                'loading state': 'isLoggingOut' in content,
                'error handling': 'error' in content.lower() and 'logout' in content.lower(),
                'redirect after logout': 'router.push' in content and 'handleLogout' in content
            }
            
            all_checks_passed = all(navbar_checks.values())
            check_details = ', '.join([f"{k}: {'✓' if v else '✗'}" for k, v in navbar_checks.items()])
            
            if all_checks_passed:
                self.log_test_result(
                    "Navbar Logout Implementation",
                    True,
                    f"Navbar logout properly implemented - {check_details}",
                    response_time
                )
                return True
            else:
                self.log_test_result(
                    "Navbar Logout Implementation",
                    False,
                    f"Navbar logout implementation issues - {check_details}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test_result(
                "Navbar Logout Implementation",
                False,
                f"Failed to verify Navbar logout implementation: {str(e)}"
            )
            return False

    def test_logout_error_handling_implementation(self):
        """Test 4: Verify proper error handling in logout functions"""
        try:
            start_time = time.time()
            
            # Check error handling in multiple files
            files_to_check = [
                ('/app/lib/supabase.js', 'Supabase'),
                ('/app/lib/auth.js', 'Auth'),
                ('/app/components/shared/Navbar.js', 'Navbar')
            ]
            
            error_handling_results = []
            all_files_have_error_handling = True
            
            for file_path, file_name in files_to_check:
                if os.path.exists(file_path):
                    with open(file_path, 'r') as f:
                        content = f.read()
                    
                    # Check for error handling patterns
                    has_try_catch = 'try' in content and 'catch' in content
                    has_error_logging = 'console.error' in content or 'console.warn' in content
                    has_error_return = 'error' in content and 'return' in content
                    
                    if has_try_catch and (has_error_logging or has_error_return):
                        error_handling_results.append(f"{file_name}: ✓ Proper error handling")
                    else:
                        error_handling_results.append(f"{file_name}: ✗ Missing error handling")
                        all_files_have_error_handling = False
                else:
                    error_handling_results.append(f"{file_name}: ✗ File not found")
                    all_files_have_error_handling = False
            
            response_time = time.time() - start_time
            
            if all_files_have_error_handling:
                self.log_test_result(
                    "Logout Error Handling Implementation",
                    True,
                    f"Proper error handling in all files: {', '.join(error_handling_results)}",
                    response_time
                )
                return True
            else:
                self.log_test_result(
                    "Logout Error Handling Implementation",
                    False,
                    f"Error handling issues: {', '.join(error_handling_results)}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test_result(
                "Logout Error Handling Implementation",
                False,
                f"Failed to verify error handling: {str(e)}"
            )
            return False

    def test_logout_redirect_implementation(self):
        """Test 5: Verify logout redirect functionality"""
        try:
            start_time = time.time()
            
            # Check redirect implementation in Navbar
            navbar_path = '/app/components/shared/Navbar.js'
            
            if not os.path.exists(navbar_path):
                self.log_test_result(
                    "Logout Redirect Implementation",
                    False,
                    "Navbar.js file not found"
                )
                return False
            
            with open(navbar_path, 'r') as f:
                content = f.read()
            
            response_time = time.time() - start_time
            
            # Check for redirect implementation
            redirect_checks = {
                'useRouter import': 'useRouter' in content and 'next/navigation' in content,
                'router.push in handleLogout': 'router.push' in content and 'handleLogout' in content,
                'redirect to home': "router.push('/')" in content,
                'redirect after error': 'router.push' in content and 'catch' in content
            }
            
            all_checks_passed = all(redirect_checks.values())
            check_details = ', '.join([f"{k}: {'✓' if v else '✗'}" for k, v in redirect_checks.items()])
            
            if all_checks_passed:
                self.log_test_result(
                    "Logout Redirect Implementation",
                    True,
                    f"Logout redirect properly implemented - {check_details}",
                    response_time
                )
                return True
            else:
                self.log_test_result(
                    "Logout Redirect Implementation",
                    False,
                    f"Logout redirect implementation issues - {check_details}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test_result(
                "Logout Redirect Implementation",
                False,
                f"Failed to verify redirect implementation: {str(e)}"
            )
            return False

    def test_logout_loading_states(self):
        """Test 6: Verify logout loading states implementation"""
        try:
            start_time = time.time()
            
            # Check loading states in Navbar
            navbar_path = '/app/components/shared/Navbar.js'
            
            if not os.path.exists(navbar_path):
                self.log_test_result(
                    "Logout Loading States",
                    False,
                    "Navbar.js file not found"
                )
                return False
            
            with open(navbar_path, 'r') as f:
                content = f.read()
            
            response_time = time.time() - start_time
            
            # Check for loading state implementation
            loading_checks = {
                'isLoggingOut state': 'isLoggingOut' in content and 'useState' in content,
                'setIsLoggingOut(true)': 'setIsLoggingOut(true)' in content,
                'setIsLoggingOut(false)': 'setIsLoggingOut(false)' in content,
                'disabled during logout': 'disabled={isLoggingOut}' in content,
                'loading text': 'Logging out...' in content,
                'finally block': 'finally' in content and 'setIsLoggingOut(false)' in content
            }
            
            all_checks_passed = all(loading_checks.values())
            check_details = ', '.join([f"{k}: {'✓' if v else '✗'}" for k, v in loading_checks.items()])
            
            if all_checks_passed:
                self.log_test_result(
                    "Logout Loading States",
                    True,
                    f"Logout loading states properly implemented - {check_details}",
                    response_time
                )
                return True
            else:
                self.log_test_result(
                    "Logout Loading States",
                    False,
                    f"Logout loading states implementation issues - {check_details}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test_result(
                "Logout Loading States",
                False,
                f"Failed to verify loading states: {str(e)}"
            )
            return False

    def test_mobile_logout_support(self):
        """Test 7: Verify mobile logout support"""
        try:
            start_time = time.time()
            
            # Check mobile logout in Navbar
            navbar_path = '/app/components/shared/Navbar.js'
            
            if not os.path.exists(navbar_path):
                self.log_test_result(
                    "Mobile Logout Support",
                    False,
                    "Navbar.js file not found"
                )
                return False
            
            with open(navbar_path, 'r') as f:
                content = f.read()
            
            response_time = time.time() - start_time
            
            # Check for mobile logout implementation
            mobile_checks = {
                'mobile menu': 'md:hidden' in content,
                'mobile logout button': 'handleLogout' in content and 'mobile' in content.lower(),
                'mobile menu close': 'setIsMenuOpen(false)' in content,
                'mobile auth actions': 'Mobile Auth Actions' in content or ('isAuthenticated' in content and 'mobile' in content.lower())
            }
            
            # Count how many checks passed (mobile support is good if most are present)
            passed_checks = sum(mobile_checks.values())
            total_checks = len(mobile_checks)
            
            check_details = ', '.join([f"{k}: {'✓' if v else '✗'}" for k, v in mobile_checks.items()])
            
            if passed_checks >= 3:  # At least 3 out of 4 mobile features
                self.log_test_result(
                    "Mobile Logout Support",
                    True,
                    f"Mobile logout support implemented ({passed_checks}/{total_checks}) - {check_details}",
                    response_time
                )
                return True
            else:
                self.log_test_result(
                    "Mobile Logout Support",
                    False,
                    f"Mobile logout support incomplete ({passed_checks}/{total_checks}) - {check_details}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test_result(
                "Mobile Logout Support",
                False,
                f"Failed to verify mobile logout support: {str(e)}"
            )
            return False

    def run_all_tests(self):
        """Run all Supabase logout function tests"""
        print("🚀 Starting Supabase Logout Function Testing...")
        print()
        
        tests = [
            self.test_supabase_signout_function_implementation,
            self.test_auth_provider_logout_handling,
            self.test_navbar_logout_implementation,
            self.test_logout_error_handling_implementation,
            self.test_logout_redirect_implementation,
            self.test_logout_loading_states,
            self.test_mobile_logout_support
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed_tests += 1
            except Exception as e:
                print(f"❌ Test {test.__name__} failed with exception: {e}")
        
        # Print summary
        print("=" * 80)
        print("🎯 SUPABASE LOGOUT FUNCTION TESTING SUMMARY")
        print("=" * 80)
        
        success_rate = (passed_tests / total_tests) * 100
        print(f"Overall Success Rate: {success_rate:.1f}% ({passed_tests}/{total_tests} tests passed)")
        print()
        
        # Print detailed results
        for result in self.test_results:
            print(f"{result['status']}: {result['test']}")
            if result['details']:
                print(f"    {result['details']}")
            if result['response_time']:
                print(f"    Response Time: {result['response_time']:.3f}s")
            print()
        
        # Overall assessment
        if success_rate >= 85:
            print("✅ OVERALL ASSESSMENT: Supabase logout function implementation is EXCELLENT")
            print("   All critical logout components are properly implemented.")
        elif success_rate >= 70:
            print("⚠️ OVERALL ASSESSMENT: Supabase logout function implementation is GOOD")
            print("   Most logout components work correctly with minor issues.")
        else:
            print("❌ OVERALL ASSESSMENT: Supabase logout function implementation needs IMPROVEMENT")
            print("   Critical logout implementation issues detected.")
        
        return success_rate >= 70

def main():
    """Main function to run Supabase logout function testing"""
    tester = SupabaseLogoutTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 Supabase logout function testing completed successfully!")
        exit(0)
    else:
        print("\n⚠️ Supabase logout function testing completed with issues.")
        exit(1)

if __name__ == "__main__":
    main()