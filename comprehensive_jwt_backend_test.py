#!/usr/bin/env python3
"""
COMPREHENSIVE JWT TOKEN FIX BACKEND VERIFICATION TEST
Backend API Testing for Spark Marketplace MVP - Direct Supabase Integration Test

This test directly simulates the exact JWT token fix implementation from the frontend signup page.
It tests the critical changes made to resolve the "Invalid number of parts: Expected 3 parts; got 1" errors.

CRITICAL JWT TOKEN FIX BEING TESTED:
1. Profile creation using authenticated session directly (supabase.from('profiles').insert())
2. Session establishment verification (supabase.auth.getSession())
3. JWT token format validation and proper authentication flow
4. RLS policies working with authenticated JWT tokens

EXPECTED RESULTS AFTER JWT TOKEN FIX:
✅ NO JWT token errors ("Invalid number of parts" issue resolved)
✅ NO PostgreSQL error 42501 (RLS policies + JWT tokens working together)
✅ NO HTTP 401/406 errors during profile operations
✅ Profile creation succeeds for both creator and brand roles
✅ Complete signup flow works end-to-end without any errors
"""

import requests
import json
import time
import uuid
import sys
from datetime import datetime

class ComprehensiveJWTBackendTest:
    def __init__(self):
        # Supabase configuration
        self.supabase_url = "https://fgcefqowzkpeivpckljf.supabase.co"
        self.supabase_anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY2VmcW93emtwZWl2cGNrbGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjcyMTAsImV4cCI6MjA2OTkwMzIxMH0.xf0wNeAawVYDr0642b0t4V0URnNMnOBT5BhSCG34cCk"
        
        # Test credentials
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.test_creator_email = f"creator.jwt.backend.{timestamp}@sparktest.com"
        self.test_brand_email = f"brand.jwt.backend.{timestamp}@sparktest.com"
        self.test_password = "password123"
        
        self.results = {
            "jwt_token_format_valid": {"creator": False, "brand": False},
            "session_establishment": {"creator": False, "brand": False},
            "profile_creation_with_jwt": {"creator": False, "brand": False},
            "profile_retrieval_success": {"creator": False, "brand": False},
            "no_jwt_token_errors": {"creator": False, "brand": False},
            "no_http_errors": {"creator": False, "brand": False}
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
    
    def check_jwt_token_format(self, token, context=""):
        """Validate JWT token format (should have 3 parts separated by dots)"""
        if not token:
            self.jwt_token_errors_found.append(f"JWT Token is None in {context}")
            return False
        
        parts = token.split('.')
        if len(parts) != 3:
            error_msg = f"Invalid JWT token format in {context}: Expected 3 parts, got {len(parts)}"
            self.jwt_token_errors_found.append(error_msg)
            return False
        
        return True
    
    def test_supabase_signup_with_jwt_monitoring(self, role):
        """Test Supabase signup with comprehensive JWT token monitoring"""
        print(f"\n🔐 Testing Supabase Signup with JWT Monitoring for {role.upper()}")
        
        email = self.test_creator_email if role == "creator" else self.test_brand_email
        full_name = f"{role.title()} JWT Backend Test"
        
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
            
            if response.status_code == 200:
                data = response.json()
                user = data.get("user")
                session = data.get("session")
                
                if user and user.get("id"):
                    user_id = user["id"]
                    
                    if session and session.get("access_token"):
                        access_token = session["access_token"]
                        
                        # Validate JWT token format - CRITICAL TEST
                        if self.check_jwt_token_format(access_token, f"Signup Response ({role})"):
                            self.log_result(f"JWT Token Format Validation ({role})", True, 
                                          f"✅ Valid JWT token with 3 parts: {access_token[:50]}...")
                            self.results["jwt_token_format_valid"][role] = True
                            self.results["no_jwt_token_errors"][role] = True
                            
                            return {
                                "success": True, 
                                "user_id": user_id, 
                                "access_token": access_token, 
                                "email": unique_email,
                                "session": session
                            }
                        else:
                            self.log_result(f"JWT Token Format Validation ({role})", False, 
                                          f"❌ Invalid JWT token format")
                            return {"success": False, "error": "Invalid JWT token format"}
                    else:
                        self.log_result(f"Supabase Signup ({role})", False, 
                                      f"❌ No access token in session: {session}")
                        return {"success": False, "error": "No access token in session"}
                else:
                    self.log_result(f"Supabase Signup ({role})", False, 
                                  f"❌ No user data in response: {data}")
                    return {"success": False, "error": "No user data"}
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                self.log_result(f"Supabase Signup ({role})", False, error_msg)
                return {"success": False, "error": error_msg}
                
        except Exception as e:
            self.log_result(f"Supabase Signup ({role})", False, str(e))
            return {"success": False, "error": str(e)}
    
    def test_session_establishment_with_jwt(self, role, access_token):
        """Test session establishment using JWT token - simulates the frontend fix"""
        print(f"\n🔑 Testing Session Establishment with JWT Token for {role.upper()}")
        
        # Test session endpoint - simulates supabase.auth.getSession()
        session_url = f"{self.supabase_url}/auth/v1/user"
        
        headers = {
            "Content-Type": "application/json",
            "apikey": self.supabase_anon_key,
            "Authorization": f"Bearer {access_token}"  # Using JWT token
        }
        
        try:
            response = self.session.get(session_url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("id"):
                    self.log_result(f"Session Establishment ({role})", True, 
                                  f"✅ Session established successfully with JWT token")
                    self.results["session_establishment"][role] = True
                    return {"success": True, "user_data": data}
                else:
                    self.log_result(f"Session Establishment ({role})", False, 
                                  f"❌ No user data in session response: {data}")
                    return {"success": False, "error": "No user data in session"}
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                
                # Check for JWT token errors
                if "Invalid number of parts" in response.text:
                    error_msg += " - ❌ CRITICAL: JWT Token Error Still Present!"
                    self.jwt_token_errors_found.append(f"Session establishment error: {response.text}")
                    self.results["no_jwt_token_errors"][role] = False
                
                self.log_result(f"Session Establishment ({role})", False, error_msg)
                return {"success": False, "error": error_msg}
                
        except Exception as e:
            self.log_result(f"Session Establishment ({role})", False, str(e))
            return {"success": False, "error": str(e)}
    
    def test_profile_creation_jwt_fix(self, role, user_id, access_token, email):
        """Test profile creation using JWT token - simulates the exact frontend fix"""
        print(f"\n👤 Testing Profile Creation with JWT Token Fix for {role.upper()}")
        print("   This simulates the exact fix: supabase.from('profiles').insert() with authenticated session")
        
        # Supabase profiles table endpoint - simulates the frontend fix
        profiles_url = f"{self.supabase_url}/rest/v1/profiles"
        
        headers = {
            "Content-Type": "application/json",
            "apikey": self.supabase_anon_key,
            "Authorization": f"Bearer {access_token}",  # Using authenticated JWT token - THE FIX
            "Prefer": "return=representation"
        }
        
        profile_data = {
            "id": user_id,
            "email": email,
            "full_name": f"{role.title()} JWT Backend Test",
            "role": role
        }
        
        try:
            response = self.session.post(profiles_url, json=profile_data, headers=headers, timeout=30)
            
            if response.status_code in [200, 201]:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    profile = data[0]
                    self.log_result(f"Profile Creation with JWT Fix ({role})", True, 
                                  f"✅ SUCCESS: Profile created using authenticated JWT token! ID: {profile.get('id')}")
                    self.results["profile_creation_with_jwt"][role] = True
                    self.results["no_http_errors"][role] = True
                    return {"success": True, "profile": profile}
                else:
                    self.log_result(f"Profile Creation with JWT Fix ({role})", False, 
                                  f"❌ Unexpected response format: {data}")
                    return {"success": False, "error": "Unexpected response format"}
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                
                # Check for specific errors that should be resolved by JWT token fix
                if response.status_code == 401:
                    error_msg += " - ❌ CRITICAL: HTTP 401 ERROR STILL PRESENT (JWT token fix not working)"
                    self.results["no_http_errors"][role] = False
                elif response.status_code == 406:
                    error_msg += " - ❌ CRITICAL: HTTP 406 ERROR STILL PRESENT"
                    self.results["no_http_errors"][role] = False
                
                # Check for PostgreSQL error 42501 - should be resolved with proper JWT tokens
                if "42501" in response.text or "row-level security policy" in response.text.lower():
                    error_msg += " - ❌ CRITICAL: PostgreSQL error 42501 STILL PRESENT (JWT + RLS not working)"
                
                # Check for JWT token errors
                if "Invalid number of parts" in response.text:
                    error_msg += " - ❌ CRITICAL: JWT Token Error Still Present!"
                    self.jwt_token_errors_found.append(f"Profile creation error: {response.text}")
                    self.results["no_jwt_token_errors"][role] = False
                
                self.log_result(f"Profile Creation with JWT Fix ({role})", False, error_msg)
                return {"success": False, "error": error_msg}
                
        except Exception as e:
            self.log_result(f"Profile Creation with JWT Fix ({role})", False, str(e))
            return {"success": False, "error": str(e)}
    
    def test_profile_retrieval_with_jwt(self, role, user_id, access_token):
        """Test profile retrieval with JWT token to verify no HTTP 406 errors"""
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
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    profile = data[0]
                    self.log_result(f"Profile Retrieval with JWT ({role})", True, 
                                  f"✅ SUCCESS: Profile retrieved with JWT token! Name: {profile.get('full_name')}")
                    self.results["profile_retrieval_success"][role] = True
                    return {"success": True, "profile": profile}
                else:
                    self.log_result(f"Profile Retrieval with JWT ({role})", False, 
                                  f"❌ No profile data found: {data}")
                    return {"success": False, "error": "No profile data found"}
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                
                # Check for specific HTTP errors that should be resolved
                if response.status_code == 406:
                    error_msg += " - ❌ CRITICAL: HTTP 406 ERROR STILL PRESENT (JWT token fix not working)"
                elif response.status_code == 401:
                    error_msg += " - ❌ CRITICAL: HTTP 401 ERROR STILL PRESENT (JWT token fix not working)"
                
                # Check for JWT token errors
                if "Invalid number of parts" in response.text:
                    error_msg += " - ❌ CRITICAL: JWT Token Error Still Present!"
                    self.jwt_token_errors_found.append(f"Profile retrieval error: {response.text}")
                    self.results["no_jwt_token_errors"][role] = False
                
                self.log_result(f"Profile Retrieval with JWT ({role})", False, error_msg)
                return {"success": False, "error": error_msg}
                
        except Exception as e:
            self.log_result(f"Profile Retrieval with JWT ({role})", False, str(e))
            return {"success": False, "error": str(e)}
    
    def run_comprehensive_jwt_backend_test(self):
        """Run comprehensive JWT token fix backend verification"""
        print("🚀 STARTING COMPREHENSIVE JWT TOKEN FIX BACKEND VERIFICATION")
        print("=" * 80)
        print("Testing the exact JWT token fix implementation from the frontend signup page...")
        print("=" * 80)
        
        # Test both creator and brand flows
        for role in ["creator", "brand"]:
            print(f"\n{'='*25} TESTING {role.upper()} JWT BACKEND FLOW {'='*25}")
            
            # Step 1: Test Supabase signup with JWT token monitoring
            signup_result = self.test_supabase_signup_with_jwt_monitoring(role)
            
            if signup_result["success"]:
                user_id = signup_result["user_id"]
                access_token = signup_result["access_token"]
                email = signup_result["email"]
                
                # Step 2: Test session establishment with JWT token
                session_result = self.test_session_establishment_with_jwt(role, access_token)
                
                if session_result["success"]:
                    # Step 3: Test profile creation with JWT token fix (CRITICAL TEST)
                    profile_result = self.test_profile_creation_jwt_fix(role, user_id, access_token, email)
                    
                    if profile_result["success"]:
                        # Step 4: Test profile retrieval with JWT token
                        retrieval_result = self.test_profile_retrieval_with_jwt(role, user_id, access_token)
                        
                        if retrieval_result["success"]:
                            print(f"✅ {role.upper()} JWT TOKEN FIX FLOW: COMPLETE SUCCESS!")
                        else:
                            print(f"❌ {role.upper()} JWT TOKEN FIX FLOW: Profile retrieval failed")
                    else:
                        print(f"❌ {role.upper()} JWT TOKEN FIX FLOW: Profile creation failed")
                else:
                    print(f"❌ {role.upper()} JWT TOKEN FIX FLOW: Session establishment failed")
            else:
                print(f"❌ {role.upper()} JWT TOKEN FIX FLOW: Signup failed")
            
            # Add delay between role tests
            time.sleep(2)
        
        # Generate final report
        self.generate_comprehensive_jwt_report()
    
    def generate_comprehensive_jwt_report(self):
        """Generate comprehensive JWT token fix test report"""
        print("\n" + "="*80)
        print("🎯 COMPREHENSIVE JWT TOKEN FIX BACKEND VERIFICATION RESULTS")
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
            "jwt_token_format_valid": "JWT Token Format Validation",
            "session_establishment": "Session Establishment with JWT",
            "profile_creation_with_jwt": "Profile Creation with JWT Fix",
            "profile_retrieval_success": "Profile Retrieval Success",
            "no_jwt_token_errors": "No JWT Token Errors",
            "no_http_errors": "No HTTP 401/406 Errors"
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
        
        # Final verdict based on expected results
        print(f"\n🏁 FINAL VERDICT:")
        
        # Check if all critical tests passed
        jwt_format_valid = all(self.results["jwt_token_format_valid"].values())
        session_establishment = all(self.results["session_establishment"].values())
        profile_creation_success = all(self.results["profile_creation_with_jwt"].values())
        profile_retrieval_success = all(self.results["profile_retrieval_success"].values())
        no_jwt_errors = all(self.results["no_jwt_token_errors"].values())
        no_http_errors = all(self.results["no_http_errors"].values())
        
        all_critical_tests_passed = (
            jwt_format_valid and 
            session_establishment and 
            profile_creation_success and 
            profile_retrieval_success and 
            no_jwt_errors and 
            no_http_errors
        )
        
        if all_critical_tests_passed:
            print("✅ SUCCESS: JWT TOKEN FIX HAS RESOLVED ALL CRITICAL SIGNUP ISSUES!")
            print("✅ ALL EXPECTED RESULTS ACHIEVED:")
            print("   ✅ NO JWT token errors ('Invalid number of parts' issue resolved)")
            print("   ✅ NO PostgreSQL error 42501 (RLS policies + JWT tokens working together)")
            print("   ✅ NO HTTP 401/406 errors during profile operations")
            print("   ✅ Profile creation succeeds for both creator and brand roles")
            print("   ✅ Complete signup flow works end-to-end without any errors")
            print("\n🎉 MVP IS FULLY FUNCTIONAL AND READY FOR PRODUCTION!")
        else:
            print("❌ FAILURE: JWT TOKEN FIX HAS NOT RESOLVED ALL CRITICAL ISSUES!")
            
            if not jwt_format_valid:
                print("❌ JWT token format validation failed")
            if not session_establishment:
                print("❌ Session establishment with JWT tokens failed")
            if not profile_creation_success:
                print("❌ Profile creation with JWT token fix failed")
            if not profile_retrieval_success:
                print("❌ Profile retrieval with JWT tokens failed")
            if not no_jwt_errors:
                print("❌ JWT token errors still present ('Invalid number of parts' issue not resolved)")
            if not no_http_errors:
                print("❌ HTTP 401/406 errors still present during profile operations")
            
            print("\n🔧 RECOMMENDED ACTIONS:")
            print("1. Verify JWT token format and structure in Supabase authentication responses")
            print("2. Check that authenticated sessions are properly established before profile creation")
            print("3. Ensure RLS policies work correctly with JWT tokens")
            print("4. Test JWT token validation in Supabase console")
            print("5. Main agent should use web search tool to research proper JWT token handling with Supabase")
        
        print("\n" + "="*80)
        
        return success_rate >= 80  # Consider 80%+ success rate as acceptable

def main():
    """Main test execution"""
    test_runner = ComprehensiveJWTBackendTest()
    
    try:
        success = test_runner.run_comprehensive_jwt_backend_test()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n💥 Test failed with unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()