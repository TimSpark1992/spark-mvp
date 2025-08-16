#!/usr/bin/env python3
"""
FINAL JWT TOKEN FIX VERIFICATION TEST
Backend API Testing with Correct Supabase Response Parsing

Based on the debug test, we discovered that:
1. JWT tokens ARE being generated correctly by Supabase
2. The issue is in response parsing - tokens are at root level, not in session object
3. The JWT token fix approach is correct, just needs proper response handling

This test verifies the JWT token fix with the correct response parsing.
"""

import requests
import json
import time
import uuid
import sys
from datetime import datetime

class FinalJWTFixVerificationTest:
    def __init__(self):
        # Supabase configuration
        self.supabase_url = "https://fgcefqowzkpeivpckljf.supabase.co"
        self.supabase_anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY2VmcW93emtwZWl2cGNrbGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjcyMTAsImV4cCI6MjA2OTkwMzIxMH0.xf0wNeAawVYDr0642b0t4V0URnNMnOBT5BhSCG34cCk"
        
        # Test credentials
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.test_creator_email = f"creator.final.jwt.{timestamp}@sparktest.com"
        self.test_brand_email = f"brand.final.jwt.{timestamp}@sparktest.com"
        self.test_password = "password123"
        
        self.results = {
            "jwt_token_generation": {"creator": False, "brand": False},
            "jwt_token_format_valid": {"creator": False, "brand": False},
            "profile_creation_success": {"creator": False, "brand": False},
            "profile_retrieval_success": {"creator": False, "brand": False},
            "no_jwt_errors": {"creator": False, "brand": False},
            "no_http_errors": {"creator": False, "brand": False}
        }
        self.errors = []
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
    
    def test_supabase_signup_with_correct_parsing(self, role):
        """Test Supabase signup with correct response parsing"""
        print(f"\n🔐 Testing Supabase Signup with Correct Response Parsing for {role.upper()}")
        
        email = self.test_creator_email if role == "creator" else self.test_brand_email
        full_name = f"{role.title()} Final JWT Test"
        
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
                
                # Parse response correctly - tokens are at root level
                access_token = data.get("access_token")
                user = data.get("user")
                
                if user and user.get("id") and access_token:
                    user_id = user["id"]
                    
                    # Validate JWT token format
                    parts = access_token.split('.')
                    if len(parts) == 3:
                        self.log_result(f"JWT Token Generation ({role})", True, 
                                      f"✅ Valid JWT token generated: {access_token[:50]}...")
                        self.results["jwt_token_generation"][role] = True
                        self.results["jwt_token_format_valid"][role] = True
                        self.results["no_jwt_errors"][role] = True
                        
                        return {
                            "success": True, 
                            "user_id": user_id, 
                            "access_token": access_token, 
                            "email": unique_email
                        }
                    else:
                        self.log_result(f"JWT Token Format ({role})", False, 
                                      f"❌ Invalid JWT token format: {len(parts)} parts")
                        return {"success": False, "error": "Invalid JWT token format"}
                else:
                    self.log_result(f"Supabase Signup ({role})", False, 
                                  f"❌ Missing user or access_token in response")
                    return {"success": False, "error": "Missing user or access_token"}
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                self.log_result(f"Supabase Signup ({role})", False, error_msg)
                return {"success": False, "error": error_msg}
                
        except Exception as e:
            self.log_result(f"Supabase Signup ({role})", False, str(e))
            return {"success": False, "error": str(e)}
    
    def test_profile_creation_with_jwt_fix(self, role, user_id, access_token, email):
        """Test profile creation using JWT token - the actual fix implementation"""
        print(f"\n👤 Testing Profile Creation with JWT Token Fix for {role.upper()}")
        
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
            "full_name": f"{role.title()} Final JWT Test",
            "role": role
        }
        
        try:
            response = self.session.post(profiles_url, json=profile_data, headers=headers, timeout=30)
            
            if response.status_code in [200, 201]:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    profile = data[0]
                    self.log_result(f"Profile Creation with JWT Fix ({role})", True, 
                                  f"✅ SUCCESS: Profile created using JWT token! ID: {profile.get('id')}")
                    self.results["profile_creation_success"][role] = True
                    self.results["no_http_errors"][role] = True
                    return {"success": True, "profile": profile}
                else:
                    self.log_result(f"Profile Creation with JWT Fix ({role})", False, 
                                  f"❌ Unexpected response format: {data}")
                    return {"success": False, "error": "Unexpected response format"}
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                
                # Check for specific errors
                if response.status_code == 401:
                    error_msg += " - ❌ CRITICAL: HTTP 401 ERROR (JWT token not working)"
                    self.results["no_http_errors"][role] = False
                elif response.status_code == 406:
                    error_msg += " - ❌ CRITICAL: HTTP 406 ERROR"
                    self.results["no_http_errors"][role] = False
                
                # Check for PostgreSQL error 42501
                if "42501" in response.text or "row-level security policy" in response.text.lower():
                    error_msg += " - ❌ CRITICAL: PostgreSQL error 42501 (RLS policy issue)"
                
                # Check for JWT token errors
                if "Invalid number of parts" in response.text:
                    error_msg += " - ❌ CRITICAL: JWT Token Error Still Present!"
                    self.results["no_jwt_errors"][role] = False
                
                self.log_result(f"Profile Creation with JWT Fix ({role})", False, error_msg)
                return {"success": False, "error": error_msg}
                
        except Exception as e:
            self.log_result(f"Profile Creation with JWT Fix ({role})", False, str(e))
            return {"success": False, "error": str(e)}
    
    def test_profile_retrieval_with_jwt(self, role, user_id, access_token):
        """Test profile retrieval with JWT token"""
        print(f"\n📋 Testing Profile Retrieval with JWT Token for {role.upper()}")
        
        # Supabase profiles table endpoint with user ID filter
        profiles_url = f"{self.supabase_url}/rest/v1/profiles?id=eq.{user_id}&select=*"
        
        headers = {
            "Content-Type": "application/json",
            "apikey": self.supabase_anon_key,
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json"
        }
        
        try:
            response = self.session.get(profiles_url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    profile = data[0]
                    self.log_result(f"Profile Retrieval with JWT ({role})", True, 
                                  f"✅ SUCCESS: Profile retrieved! Name: {profile.get('full_name')}")
                    self.results["profile_retrieval_success"][role] = True
                    return {"success": True, "profile": profile}
                else:
                    self.log_result(f"Profile Retrieval with JWT ({role})", False, 
                                  f"❌ No profile data found: {data}")
                    return {"success": False, "error": "No profile data found"}
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                
                # Check for specific HTTP errors
                if response.status_code == 406:
                    error_msg += " - ❌ CRITICAL: HTTP 406 ERROR"
                elif response.status_code == 401:
                    error_msg += " - ❌ CRITICAL: HTTP 401 ERROR"
                
                self.log_result(f"Profile Retrieval with JWT ({role})", False, error_msg)
                return {"success": False, "error": error_msg}
                
        except Exception as e:
            self.log_result(f"Profile Retrieval with JWT ({role})", False, str(e))
            return {"success": False, "error": str(e)}
    
    def run_final_jwt_verification(self):
        """Run final JWT token fix verification"""
        print("🚀 STARTING FINAL JWT TOKEN FIX VERIFICATION TEST")
        print("=" * 80)
        print("Testing JWT token fix with correct Supabase response parsing...")
        print("=" * 80)
        
        # Test both creator and brand flows
        for role in ["creator", "brand"]:
            print(f"\n{'='*25} TESTING {role.upper()} FINAL JWT FLOW {'='*25}")
            
            # Step 1: Test Supabase signup with correct response parsing
            signup_result = self.test_supabase_signup_with_correct_parsing(role)
            
            if signup_result["success"]:
                user_id = signup_result["user_id"]
                access_token = signup_result["access_token"]
                email = signup_result["email"]
                
                # Step 2: Test profile creation with JWT token fix
                profile_result = self.test_profile_creation_with_jwt_fix(role, user_id, access_token, email)
                
                if profile_result["success"]:
                    # Step 3: Test profile retrieval with JWT token
                    retrieval_result = self.test_profile_retrieval_with_jwt(role, user_id, access_token)
                    
                    if retrieval_result["success"]:
                        print(f"✅ {role.upper()} JWT TOKEN FIX: COMPLETE SUCCESS!")
                    else:
                        print(f"❌ {role.upper()} JWT TOKEN FIX: Profile retrieval failed")
                else:
                    print(f"❌ {role.upper()} JWT TOKEN FIX: Profile creation failed")
            else:
                print(f"❌ {role.upper()} JWT TOKEN FIX: Signup failed")
            
            # Add delay between role tests
            time.sleep(2)
        
        # Generate final report
        self.generate_final_report()
    
    def generate_final_report(self):
        """Generate final JWT token fix verification report"""
        print("\n" + "="*80)
        print("🎯 FINAL JWT TOKEN FIX VERIFICATION RESULTS")
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
        
        # Detailed results by category
        print(f"\n📋 DETAILED RESULTS:")
        
        categories = {
            "jwt_token_generation": "JWT Token Generation",
            "jwt_token_format_valid": "JWT Token Format Validation",
            "profile_creation_success": "Profile Creation with JWT Fix",
            "profile_retrieval_success": "Profile Retrieval Success",
            "no_jwt_errors": "No JWT Token Errors",
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
        
        # Final verdict
        print(f"\n🏁 FINAL VERDICT:")
        
        # Check if all critical tests passed
        jwt_generation = all(self.results["jwt_token_generation"].values())
        jwt_format_valid = all(self.results["jwt_token_format_valid"].values())
        profile_creation = all(self.results["profile_creation_success"].values())
        profile_retrieval = all(self.results["profile_retrieval_success"].values())
        no_jwt_errors = all(self.results["no_jwt_errors"].values())
        no_http_errors = all(self.results["no_http_errors"].values())
        
        all_tests_passed = (
            jwt_generation and 
            jwt_format_valid and 
            profile_creation and 
            profile_retrieval and 
            no_jwt_errors and 
            no_http_errors
        )
        
        if all_tests_passed:
            print("✅ SUCCESS: JWT TOKEN FIX IS WORKING WITH CORRECT RESPONSE PARSING!")
            print("✅ ALL EXPECTED RESULTS ACHIEVED:")
            print("   ✅ JWT tokens are being generated correctly by Supabase")
            print("   ✅ JWT token format is valid (3 parts)")
            print("   ✅ Profile creation succeeds using authenticated JWT tokens")
            print("   ✅ Profile retrieval works with JWT tokens")
            print("   ✅ NO JWT token errors ('Invalid number of parts' issue resolved)")
            print("   ✅ NO HTTP 401/406 errors during profile operations")
            print("\n🎉 THE JWT TOKEN FIX APPROACH IS CORRECT!")
            print("🔧 FRONTEND NEEDS MINOR UPDATE: Parse access_token from root level, not session object")
        else:
            print("❌ FAILURE: JWT TOKEN FIX HAS ISSUES")
            
            if not jwt_generation:
                print("❌ JWT token generation failed")
            if not jwt_format_valid:
                print("❌ JWT token format validation failed")
            if not profile_creation:
                print("❌ Profile creation with JWT tokens failed")
            if not profile_retrieval:
                print("❌ Profile retrieval with JWT tokens failed")
            if not no_jwt_errors:
                print("❌ JWT token errors still present")
            if not no_http_errors:
                print("❌ HTTP 401/406 errors still present")
        
        print("\n" + "="*80)
        
        return success_rate >= 80

def main():
    """Main test execution"""
    test_runner = FinalJWTFixVerificationTest()
    
    try:
        success = test_runner.run_final_jwt_verification()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n💥 Test failed with unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()