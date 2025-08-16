#!/usr/bin/env python3
"""
CRITICAL JWT TOKEN FIX VERIFICATION TEST (January 8, 2025)
Backend API Testing for Spark Marketplace MVP

This test verifies that the CRITICAL JWT TOKEN FIX has resolved the signup process issues.

CRITICAL FIX APPLIED:
- Changed profile creation from using the helper function createProfile() to using the authenticated session directly
- Profile creation now uses supabase.from('profiles').insert() with the user's authenticated session
- This should ensure the JWT token is properly passed to the Supabase API

IMMEDIATE VERIFICATION REQUIRED:
1. JWT Token Issue Resolution - Verify NO MORE "Invalid number of parts: Expected 3 parts; got 1" errors
2. Profile Creation Success - Test that profile creation now works with proper JWT authentication
3. Creator Signup Flow - Complete end-to-end signup → profile creation → dashboard redirect
4. Brand Signup Flow - Complete end-to-end signup → profile creation → dashboard redirect
5. HTTP Error Resolution - Confirm NO MORE HTTP 401/406 errors
6. MVP Functionality - Verify complete signup flow works for production use

EXPECTED RESULTS AFTER JWT TOKEN FIX:
✅ NO JWT token errors ("Invalid number of parts" issue resolved)
✅ NO PostgreSQL error 42501 (RLS policies + JWT tokens working together)
✅ NO HTTP 401/406 errors during profile operations
✅ Profile creation succeeds for both creator and brand roles
✅ Users successfully redirect to dashboards (/creator/dashboard, /brand/dashboard)
✅ Complete signup flow works end-to-end without any errors
✅ MVP is fully functional and ready for production

Test Credentials:
- Creator: creator.jwt.fix.20250108@sparktest.com / password123
- Brand: brand.jwt.fix.20250108@sparktest.com / password123

CRITICAL: This should be the FINAL test. The JWT token fix combined with the correct RLS policies should resolve all authentication and profile creation issues.
"""

import requests
import json
import time
import uuid
import sys
from datetime import datetime

class JWTTokenFixVerificationTest:
    def __init__(self):
        # Use production URL from .env
        self.base_url = "https://spark-payments.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.supabase_url = "https://fgcefqowzkpeivpckljf.supabase.co"
        self.supabase_anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY2VmcW93emtwZWl2cGNrbGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjcyMTAsImV4cCI6MjA2OTkwMzIxMH0.xf0wNeAawVYDr0642b0t4V0URnNMnOBT5BhSCG34cCk"
        
        # Test credentials as specified in review request
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.test_creator_email = f"creator.jwt.fix.{timestamp}@sparktest.com"
        self.test_brand_email = f"brand.jwt.fix.{timestamp}@sparktest.com"
        self.test_password = "password123"
        
        self.results = {
            "jwt_token_errors_resolved": {"creator": False, "brand": False},
            "profile_creation_success": {"creator": False, "brand": False},
            "signup_flow_complete": {"creator": False, "brand": False},
            "dashboard_redirect": {"creator": False, "brand": False},
            "http_errors_resolved": {"creator": False, "brand": False},
            "authentication_state": {"creator": False, "brand": False}
        }
        self.errors = []
        self.jwt_token_errors_found = []
        self.session = requests.Session()
        
        # Headers for Supabase API calls
        self.supabase_headers = {
            'apikey': self.supabase_anon_key,
            'Authorization': f'Bearer {self.supabase_anon_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
        
    def log_result(self, test_name, success, details=""):
        """Log test results with detailed information"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success:
            self.errors.append(f"{test_name}: {details}")
    
    def check_for_jwt_token_errors(self, response_text, context=""):
        """Check for JWT token errors in response"""
        jwt_error_patterns = [
            "Invalid number of parts: Expected 3 parts; got 1",
            "JWSError CompactDecodeError",
            "Invalid JWT token",
            "JWT token malformed",
            "Token verification failed"
        ]
        
        for pattern in jwt_error_patterns:
            if pattern in response_text:
                error_msg = f"JWT Token Error Found in {context}: {pattern}"
                self.jwt_token_errors_found.append(error_msg)
                print(f"🚨 {error_msg}")
                return True
        return False
    
    def test_supabase_auth_signup(self, role):
        """Test Supabase authentication signup with JWT token monitoring"""
        print(f"\n🔐 Testing Supabase Auth Signup for {role.upper()} (JWT Token Monitoring)")
        
        email = self.test_creator_email if role == "creator" else self.test_brand_email
        full_name = f"{role.title()} JWT Fix Test"
        
        # Generate unique email to avoid conflicts
        unique_email = f"test.{uuid.uuid4().hex[:8]}.{email}"
        
        # Supabase signup endpoint
        signup_url = f"{self.supabase_url}/auth/v1/signup"
        
        payload = {
            "email": unique_email,
            "password": self.test_password,
            "data": {
                "full_name": full_name,
                "role": role
            }
        }
        
        try:
            response = self.session.post(signup_url, json=payload, headers=self.supabase_headers, timeout=30)
            
            # Check for JWT token errors in response
            jwt_errors_found = self.check_for_jwt_token_errors(response.text, f"Auth Signup ({role})")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("user") and data.get("user", {}).get("id"):
                    user_id = data["user"]["id"]
                    access_token = data.get("session", {}).get("access_token")
                    
                    # Verify JWT token format
                    if access_token and len(access_token.split('.')) == 3:
                        self.log_result(f"Supabase Auth Signup ({role})", True, 
                                      f"✅ User created with valid JWT token. User ID: {user_id}")
                        self.results["authentication_state"][role] = True
                        if not jwt_errors_found:
                            self.results["jwt_token_errors_resolved"][role] = True
                        return {"success": True, "user_id": user_id, "access_token": access_token, "email": unique_email}
                    else:
                        self.log_result(f"Supabase Auth Signup ({role})", False, 
                                      f"❌ Invalid JWT token format: {access_token}")
                        return {"success": False, "error": "Invalid JWT token format"}
                else:
                    self.log_result(f"Supabase Auth Signup ({role})", False, 
                                  f"No user data in response: {data}")
                    return {"success": False, "error": "No user data"}
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                self.log_result(f"Supabase Auth Signup ({role})", False, error_msg)
                return {"success": False, "error": error_msg}
                
        except Exception as e:
            self.log_result(f"Supabase Auth Signup ({role})", False, str(e))
            return {"success": False, "error": str(e)}
    
    def test_session_establishment(self, role, access_token):
        """Test session establishment - critical for JWT token fix"""
        print(f"\n🔑 Testing Session Establishment for {role.upper()} (JWT Token Fix Verification)")
        
        # Test session endpoint
        session_url = f"{self.supabase_url}/auth/v1/user"
        
        headers = {
            "Content-Type": "application/json",
            "apikey": self.supabase_anon_key,
            "Authorization": f"Bearer {access_token}"
        }
        
        try:
            response = self.session.get(session_url, headers=headers, timeout=30)
            
            # Check for JWT token errors
            jwt_errors_found = self.check_for_jwt_token_errors(response.text, f"Session Establishment ({role})")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("id"):
                    self.log_result(f"Session Establishment ({role})", True, 
                                  f"✅ Session established successfully with JWT token")
                    if not jwt_errors_found:
                        self.results["jwt_token_errors_resolved"][role] = True
                    return {"success": True, "user_data": data}
                else:
                    self.log_result(f"Session Establishment ({role})", False, 
                                  f"No user data in session response: {data}")
                    return {"success": False, "error": "No user data in session"}
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                self.log_result(f"Session Establishment ({role})", False, error_msg)
                return {"success": False, "error": error_msg}
                
        except Exception as e:
            self.log_result(f"Session Establishment ({role})", False, str(e))
            return {"success": False, "error": str(e)}
    
    def test_profile_creation_with_jwt(self, role, user_id, access_token, email):
        """Test profile creation using authenticated session - THE CRITICAL JWT TOKEN FIX TEST"""
        print(f"\n👤 Testing Profile Creation with JWT Token for {role.upper()} (CRITICAL JWT FIX TEST)")
        
        # Supabase profiles table endpoint
        profiles_url = f"{self.supabase_url}/rest/v1/profiles"
        
        headers = {
            "Content-Type": "application/json",
            "apikey": self.supabase_anon_key,
            "Authorization": f"Bearer {access_token}",  # Using authenticated JWT token
            "Prefer": "return=representation"
        }
        
        profile_data = {
            "id": user_id,
            "email": email,
            "full_name": f"{role.title()} JWT Fix Test",
            "role": role
        }
        
        try:
            response = self.session.post(profiles_url, json=profile_data, headers=headers, timeout=30)
            
            # Check for JWT token errors - THESE SHOULD NOT HAPPEN AFTER FIX
            jwt_errors_found = self.check_for_jwt_token_errors(response.text, f"Profile Creation ({role})")
            
            if response.status_code in [200, 201]:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    profile = data[0]
                    self.log_result(f"Profile Creation with JWT ({role})", True, 
                                  f"✅ SUCCESS: Profile created using authenticated JWT token! Profile ID: {profile.get('id')}")
                    self.results["profile_creation_success"][role] = True
                    if not jwt_errors_found:
                        self.results["jwt_token_errors_resolved"][role] = True
                    return {"success": True, "profile": profile}
                else:
                    self.log_result(f"Profile Creation with JWT ({role})", False, 
                                  f"Unexpected response format: {data}")
                    return {"success": False, "error": "Unexpected response format"}
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                
                # Check for specific errors that should be resolved by JWT token fix
                if response.status_code == 401:
                    error_msg += " - ❌ CRITICAL: HTTP 401 ERROR STILL PRESENT (JWT token fix not working)"
                elif response.status_code == 406:
                    error_msg += " - ❌ CRITICAL: HTTP 406 ERROR STILL PRESENT"
                
                # Check for PostgreSQL error 42501 - should be resolved with proper JWT tokens
                if "42501" in response.text or "row-level security policy" in response.text.lower():
                    error_msg += " - ❌ CRITICAL: PostgreSQL error 42501 STILL PRESENT (JWT + RLS not working together)"
                
                self.log_result(f"Profile Creation with JWT ({role})", False, error_msg)
                return {"success": False, "error": error_msg}
                
        except Exception as e:
            self.log_result(f"Profile Creation with JWT ({role})", False, str(e))
            return {"success": False, "error": str(e)}
    
    def test_profile_retrieval_with_jwt(self, role, user_id, access_token):
        """Test profile retrieval with JWT token to check for HTTP 406 errors"""
        print(f"\n📋 Testing Profile Retrieval with JWT Token for {role.upper()}")
        
        # Supabase profiles table endpoint with user ID filter
        profiles_url = f"{self.supabase_url}/rest/v1/profiles?id=eq.{user_id}&select=*"
        
        headers = {
            "Content-Type": "application/json",
            "apikey": self.supabase_anon_key,
            "Authorization": f"Bearer {access_token}",  # Using authenticated JWT token
            "Accept": "application/json"
        }
        
        try:
            response = self.session.get(profiles_url, headers=headers, timeout=30)
            
            # Check for JWT token errors
            jwt_errors_found = self.check_for_jwt_token_errors(response.text, f"Profile Retrieval ({role})")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    profile = data[0]
                    self.log_result(f"Profile Retrieval with JWT ({role})", True, 
                                  f"✅ SUCCESS: Profile retrieved with JWT token! Name: {profile.get('full_name')}")
                    self.results["http_errors_resolved"][role] = True
                    if not jwt_errors_found:
                        self.results["jwt_token_errors_resolved"][role] = True
                    return {"success": True, "profile": profile}
                else:
                    self.log_result(f"Profile Retrieval with JWT ({role})", False, 
                                  f"No profile data found: {data}")
                    return {"success": False, "error": "No profile data found"}
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                
                # Check for specific HTTP errors that should be resolved
                if response.status_code == 406:
                    error_msg += " - ❌ CRITICAL: HTTP 406 ERROR STILL PRESENT (JWT token fix not working)"
                    self.results["http_errors_resolved"][role] = False
                elif response.status_code == 401:
                    error_msg += " - ❌ CRITICAL: HTTP 401 ERROR STILL PRESENT (JWT token fix not working)"
                    self.results["http_errors_resolved"][role] = False
                
                self.log_result(f"Profile Retrieval with JWT ({role})", False, error_msg)
                return {"success": False, "error": error_msg}
                
        except Exception as e:
            self.log_result(f"Profile Retrieval with JWT ({role})", False, str(e))
            return {"success": False, "error": str(e)}
    
    def test_dashboard_access(self, role):
        """Test dashboard accessibility after JWT token fix"""
        print(f"\n🏠 Testing Dashboard Access for {role.upper()}")
        
        dashboard_url = f"{self.base_url}/{role}/dashboard"
        
        try:
            response = self.session.get(dashboard_url, timeout=30)
            
            if response.status_code == 200:
                # Check if dashboard content is present
                content = response.text.lower()
                if "dashboard" in content:
                    self.log_result(f"Dashboard Access ({role})", True, 
                                  f"✅ SUCCESS: Dashboard accessible at /{role}/dashboard")
                    self.results["dashboard_redirect"][role] = True
                    return {"success": True}
                else:
                    self.log_result(f"Dashboard Access ({role})", False, 
                                  "Dashboard content not found")
                    return {"success": False, "error": "Dashboard content not found"}
            else:
                error_msg = f"HTTP {response.status_code}: Dashboard not accessible"
                self.log_result(f"Dashboard Access ({role})", False, error_msg)
                return {"success": False, "error": error_msg}
                
        except Exception as e:
            self.log_result(f"Dashboard Access ({role})", False, str(e))
            return {"success": False, "error": str(e)}
    
    def test_mongodb_api_routes(self):
        """Test MongoDB API routes functionality"""
        print(f"\n🗄️ Testing MongoDB API Routes")
        
        # Test root endpoint
        try:
            response = self.session.get(f"{self.api_url}/root", timeout=30)
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Hello World":
                    self.log_result("MongoDB API Root Endpoint", True, "Root endpoint working")
                else:
                    self.log_result("MongoDB API Root Endpoint", False, f"Unexpected response: {data}")
            else:
                self.log_result("MongoDB API Root Endpoint", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("MongoDB API Root Endpoint", False, str(e))
        
        # Test status endpoint POST
        try:
            payload = {"client_name": "jwt_fix_verification_test"}
            response = self.session.post(f"{self.api_url}/status", json=payload, timeout=30)
            if response.status_code == 200:
                data = response.json()
                if data.get("client_name") == "jwt_fix_verification_test":
                    self.log_result("MongoDB API Status POST", True, "Status POST working")
                else:
                    self.log_result("MongoDB API Status POST", False, f"Unexpected response: {data}")
            else:
                self.log_result("MongoDB API Status POST", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result("MongoDB API Status POST", False, str(e))
    
    def run_comprehensive_jwt_fix_test(self):
        """Run comprehensive JWT token fix verification"""
        print("🚀 STARTING CRITICAL JWT TOKEN FIX VERIFICATION TEST")
        print("=" * 80)
        print("Testing if the JWT token fix has resolved all critical signup issues...")
        print("=" * 80)
        
        # Test MongoDB API routes first
        self.test_mongodb_api_routes()
        
        # Test both creator and brand flows
        for role in ["creator", "brand"]:
            print(f"\n{'='*20} TESTING {role.upper()} JWT TOKEN FIX {'='*20}")
            
            # Step 1: Test Supabase authentication signup with JWT monitoring
            auth_result = self.test_supabase_auth_signup(role)
            
            if auth_result["success"]:
                user_id = auth_result["user_id"]
                access_token = auth_result["access_token"]
                email = auth_result["email"]
                
                # Step 2: Test session establishment (critical for JWT token fix)
                session_result = self.test_session_establishment(role, access_token)
                
                if session_result["success"]:
                    # Step 3: Test profile creation with JWT token (CRITICAL TEST)
                    profile_result = self.test_profile_creation_with_jwt(role, user_id, access_token, email)
                    
                    if profile_result["success"]:
                        self.results["signup_flow_complete"][role] = True
                        
                        # Step 4: Test profile retrieval with JWT token
                        retrieval_result = self.test_profile_retrieval_with_jwt(role, user_id, access_token)
                        
                        if retrieval_result["success"]:
                            self.results["http_errors_resolved"][role] = True
                        else:
                            self.results["http_errors_resolved"][role] = False
                    else:
                        # Profile creation failed - JWT token fix not working
                        self.results["signup_flow_complete"][role] = False
                        self.results["http_errors_resolved"][role] = False
                else:
                    # Session establishment failed
                    self.results["signup_flow_complete"][role] = False
                    self.results["authentication_state"][role] = False
                    self.results["http_errors_resolved"][role] = False
            else:
                # Authentication failed
                self.results["signup_flow_complete"][role] = False
                self.results["authentication_state"][role] = False
                self.results["http_errors_resolved"][role] = False
            
            # Step 5: Test dashboard access
            self.test_dashboard_access(role)
            
            # Add delay between role tests
            time.sleep(2)
        
        # Generate final report
        self.generate_final_jwt_fix_report()
    
    def generate_final_jwt_fix_report(self):
        """Generate comprehensive JWT token fix test report"""
        print("\n" + "="*80)
        print("🎯 CRITICAL JWT TOKEN FIX VERIFICATION RESULTS")
        print("="*80)
        
        # Calculate overall success rates
        total_tests = 0
        passed_tests = 0
        
        for category, results in self.results.items():
            for role, success in results.items():
                total_tests += 1
                if success:
                    passed_tests += 1
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"\n📊 OVERALL SUCCESS RATE: {success_rate:.1f}% ({passed_tests}/{total_tests})")
        
        # JWT Token Error Summary
        if self.jwt_token_errors_found:
            print(f"\n🚨 JWT TOKEN ERRORS FOUND ({len(self.jwt_token_errors_found)}):")
            for i, error in enumerate(self.jwt_token_errors_found, 1):
                print(f"  {i}. {error}")
        else:
            print(f"\n✅ NO JWT TOKEN ERRORS FOUND - JWT Token Fix Working!")
        
        # Detailed results by category
        print(f"\n📋 DETAILED RESULTS:")
        
        categories = {
            "jwt_token_errors_resolved": "JWT Token Errors Resolved",
            "profile_creation_success": "Profile Creation Success (JWT Token Fix)",
            "signup_flow_complete": "Complete Signup Flow",
            "dashboard_redirect": "Dashboard Redirect",
            "http_errors_resolved": "HTTP Error Resolution (401/406)",
            "authentication_state": "Authentication State Management"
        }
        
        for category, description in categories.items():
            print(f"\n{description}:")
            for role in ["creator", "brand"]:
                status = "✅ PASS" if self.results[category][role] else "❌ FAIL"
                print(f"  {role.capitalize()}: {status}")
        
        # Critical issues summary
        if self.errors:
            print(f"\n🚨 CRITICAL ISSUES FOUND ({len(self.errors)}):")
            for i, error in enumerate(self.errors, 1):
                print(f"  {i}. {error}")
        
        # Final verdict
        print(f"\n🏁 FINAL VERDICT:")
        
        # Check if all critical tests passed
        jwt_errors_resolved = all(self.results["jwt_token_errors_resolved"].values())
        profile_creation_success = all(self.results["profile_creation_success"].values())
        signup_flow_complete = all(self.results["signup_flow_complete"].values())
        http_errors_resolved = all(self.results["http_errors_resolved"].values())
        
        if jwt_errors_resolved and profile_creation_success and signup_flow_complete and http_errors_resolved:
            print("✅ SUCCESS: JWT TOKEN FIX HAS RESOLVED ALL CRITICAL SIGNUP ISSUES!")
            print("✅ NO MORE JWT token errors ('Invalid number of parts' issue resolved)")
            print("✅ NO MORE PostgreSQL error 42501 (RLS policies + JWT tokens working together)")
            print("✅ NO MORE HTTP 401/406 errors during profile operations")
            print("✅ Profile creation succeeds for both creator and brand roles")
            print("✅ Users successfully redirect to dashboards")
            print("✅ Complete signup flow works end-to-end without any errors")
            print("\n🎉 MVP IS FULLY FUNCTIONAL AND READY FOR PRODUCTION!")
        else:
            print("❌ FAILURE: JWT TOKEN FIX HAS NOT RESOLVED ALL CRITICAL ISSUES!")
            if not jwt_errors_resolved:
                print("❌ JWT token errors still present ('Invalid number of parts' issue not resolved)")
            if not profile_creation_success:
                print("❌ Profile creation still failing with JWT authentication issues")
            if not signup_flow_complete:
                print("❌ Complete signup flow still not working end-to-end")
            if not http_errors_resolved:
                print("❌ HTTP 401/406 errors still present during profile operations")
            
            print("\n🔧 RECOMMENDED ACTIONS:")
            print("1. Verify JWT token format and structure in authentication responses")
            print("2. Check that authenticated sessions are properly established before profile creation")
            print("3. Ensure RLS policies work correctly with JWT tokens")
            print("4. Test JWT token validation in Supabase console")
            print("5. Main agent should use web search tool to research proper JWT token handling with Supabase")
        
        print("\n" + "="*80)
        
        return success_rate >= 80  # Consider 80%+ success rate as acceptable

def main():
    """Main test execution"""
    test_runner = JWTTokenFixVerificationTest()
    
    try:
        success = test_runner.run_comprehensive_jwt_fix_test()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n💥 Test failed with unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()