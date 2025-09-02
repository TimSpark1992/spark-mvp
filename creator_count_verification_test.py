#!/usr/bin/env python3
"""
Creator Count Verification Test
Testing the actual number of creators currently in the system
Focus: Verify real creator count vs claimed 32 creators, distinguish test vs real accounts
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

class CreatorCountVerificationTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = 30
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
        time_info = f" ({response_time:.2f}s)" if response_time else ""
        print(f"{status} {test_name}{time_info}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
        print()

    def test_profiles_api_accessibility(self):
        """Test 1: Verify profiles API is accessible"""
        print("🔍 Testing Profiles API Accessibility...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/profiles")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if 'profiles' in data and 'count' in data:
                    self.log_test(
                        "Profiles API Accessibility", 
                        True, 
                        f"API accessible, returned {data.get('count', 0)} total profiles",
                        response_time=response_time
                    )
                    return True, data
                else:
                    self.log_test(
                        "Profiles API Accessibility", 
                        False, 
                        f"Invalid response format: {data}",
                        response_time=response_time
                    )
                    return False, None
            else:
                self.log_test(
                    "Profiles API Accessibility", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    response_time=response_time
                )
                return False, None
                
        except Exception as e:
            self.log_test(
                "Profiles API Accessibility", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False, None

    def test_creator_profiles_count(self):
        """Test 2: Get actual count of creator profiles"""
        print("🔍 Testing Creator Profiles Count...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/profiles?role=creator")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                creator_count = data.get('count', 0)
                creators = data.get('profiles', [])
                
                self.log_test(
                    "Creator Profiles Count", 
                    True, 
                    f"Found {creator_count} creator profiles in the system",
                    response_time=response_time
                )
                return True, creators, creator_count
            else:
                self.log_test(
                    "Creator Profiles Count", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    response_time=response_time
                )
                return False, [], 0
                
        except Exception as e:
            self.log_test(
                "Creator Profiles Count", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False, [], 0

    def test_creator_profile_details(self, creators):
        """Test 3: Analyze creator profile details"""
        print("🔍 Testing Creator Profile Details...")
        
        if not creators:
            self.log_test(
                "Creator Profile Details", 
                False, 
                "No creator profiles to analyze"
            )
            return False
        
        try:
            # Analyze creator profiles
            test_accounts = []
            real_accounts = []
            
            for creator in creators:
                email = creator.get('email', '')
                full_name = creator.get('full_name', '')
                created_at = creator.get('created_at', '')
                
                # Identify test accounts vs real accounts
                is_test_account = (
                    'test' in email.lower() or 
                    'example' in email.lower() or
                    'test' in full_name.lower() or
                    full_name.lower() in ['test creator', 'test user', 'creator test']
                )
                
                if is_test_account:
                    test_accounts.append({
                        'email': email,
                        'name': full_name,
                        'created': created_at,
                        'id': creator.get('id', '')
                    })
                else:
                    real_accounts.append({
                        'email': email,
                        'name': full_name,
                        'created': created_at,
                        'id': creator.get('id', '')
                    })
            
            details = f"Test accounts: {len(test_accounts)}, Real accounts: {len(real_accounts)}"
            
            self.log_test(
                "Creator Profile Details", 
                True, 
                details
            )
            
            # Print detailed breakdown
            print("📊 CREATOR PROFILE BREAKDOWN:")
            print(f"   Total Creators: {len(creators)}")
            print(f"   Test Accounts: {len(test_accounts)}")
            print(f"   Real Accounts: {len(real_accounts)}")
            print()
            
            if test_accounts:
                print("🧪 TEST ACCOUNTS:")
                for i, account in enumerate(test_accounts, 1):
                    print(f"   {i}. {account['name']} ({account['email']}) - Created: {account['created'][:10]}")
                print()
            
            if real_accounts:
                print("👤 REAL ACCOUNTS:")
                for i, account in enumerate(real_accounts, 1):
                    # Mask email for privacy
                    masked_email = account['email'][:3] + "***@" + account['email'].split('@')[1] if '@' in account['email'] else account['email']
                    print(f"   {i}. {account['name']} ({masked_email}) - Created: {account['created'][:10]}")
                print()
            
            return True
            
        except Exception as e:
            self.log_test(
                "Creator Profile Details", 
                False, 
                f"Analysis failed: {str(e)}"
            )
            return False

    def test_brand_profiles_comparison(self):
        """Test 4: Compare with brand profiles count"""
        print("🔍 Testing Brand Profiles for Comparison...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/profiles?role=brand")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                brand_count = data.get('count', 0)
                
                self.log_test(
                    "Brand Profiles Comparison", 
                    True, 
                    f"Found {brand_count} brand profiles for comparison",
                    response_time=response_time
                )
                return True, brand_count
            else:
                self.log_test(
                    "Brand Profiles Comparison", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    response_time=response_time
                )
                return False, 0
                
        except Exception as e:
            self.log_test(
                "Brand Profiles Comparison", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False, 0

    def test_data_accuracy_verification(self, creator_count):
        """Test 5: Verify data accuracy for offer creation"""
        print("🔍 Testing Data Accuracy for Offer Creation...")
        
        try:
            # Check if the claimed 32 creators matches reality
            claimed_count = 32
            actual_count = creator_count
            
            accuracy_check = actual_count == claimed_count
            
            if accuracy_check:
                details = f"✅ Claimed count ({claimed_count}) matches actual count ({actual_count})"
            else:
                details = f"❌ Claimed count ({claimed_count}) does NOT match actual count ({actual_count}). Difference: {abs(claimed_count - actual_count)}"
            
            # For offer creation functionality, we need to know the real count
            if actual_count > 0:
                offer_creation_ready = True
                offer_details = f"Offer creation can proceed with {actual_count} available creators"
            else:
                offer_creation_ready = False
                offer_details = "⚠️ No creators available for offer creation"
            
            self.log_test(
                "Data Accuracy Verification", 
                True,  # Always pass this test, but report the findings
                f"{details}. {offer_details}"
            )
            
            return True, accuracy_check, actual_count
            
        except Exception as e:
            self.log_test(
                "Data Accuracy Verification", 
                False, 
                f"Verification failed: {str(e)}"
            )
            return False, False, 0

    def run_all_tests(self):
        """Run all creator count verification tests"""
        print("🚀 CREATOR COUNT VERIFICATION - BACKEND TESTING")
        print("=" * 70)
        print(f"Testing against: {BASE_URL}")
        print(f"API Base URL: {API_BASE}")
        print("Focus: Verify actual creator count vs claimed 32 creators")
        print("=" * 70)
        
        # Test 1: API Accessibility
        api_success, all_profiles_data = self.test_profiles_api_accessibility()
        if not api_success:
            print("❌ Cannot proceed - Profiles API not accessible")
            return False
        
        # Test 2: Creator Count
        creator_success, creators, creator_count = self.test_creator_profiles_count()
        if not creator_success:
            print("❌ Cannot get creator count")
            return False
        
        # Test 3: Profile Details
        details_success = self.test_creator_profile_details(creators)
        
        # Test 4: Brand Comparison
        brand_success, brand_count = self.test_brand_profiles_comparison()
        
        # Test 5: Data Accuracy
        accuracy_success, count_matches, actual_count = self.test_data_accuracy_verification(creator_count)
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 CREATOR COUNT VERIFICATION SUMMARY")
        print("=" * 70)
        
        passed = sum([api_success, creator_success, details_success, brand_success, accuracy_success])
        total = 5
        success_rate = (passed / total) * 100
        
        print(f"Tests Passed: {passed}/{total} ({success_rate:.1f}%)")
        print()
        
        # Key Findings
        print("🎯 KEY FINDINGS:")
        print(f"   📈 ACTUAL CREATOR COUNT: {actual_count}")
        print(f"   📊 CLAIMED CREATOR COUNT: 32")
        print(f"   🔍 COUNT ACCURACY: {'✅ MATCHES' if count_matches else '❌ DOES NOT MATCH'}")
        
        if brand_success:
            print(f"   👥 BRAND COUNT (for comparison): {brand_count}")
        
        print()
        
        # Offer Creation Assessment
        print("🎯 OFFER CREATION FUNCTIONALITY ASSESSMENT:")
        if actual_count > 0:
            print(f"   ✅ READY: {actual_count} creators available for offer creation")
            if actual_count >= 10:
                print("   ✅ GOOD: Sufficient creator pool for diverse offers")
            elif actual_count >= 5:
                print("   ⚠️  LIMITED: Small but workable creator pool")
            else:
                print("   ⚠️  MINIMAL: Very limited creator options")
        else:
            print("   ❌ NOT READY: No creators available for offer creation")
        
        print()
        
        # User Question Resolution
        print("🔍 USER QUESTION RESOLUTION:")
        print("   Question: 'User is questioning my previous claim of 32 creators'")
        print("   User mentioned: 'testing with only one account'")
        print(f"   ANSWER: The system currently has {actual_count} creator profiles")
        
        if actual_count == 1:
            print("   ✅ USER IS CORRECT: Only 1 creator account exists (matches user's testing experience)")
        elif actual_count < 32:
            print(f"   ⚠️  USER PARTIALLY CORRECT: {actual_count} creators exist, not 32 as previously claimed")
        elif actual_count == 32:
            print("   ❌ USER INCORRECT: 32 creators do exist as claimed")
        else:
            print(f"   📊 UNEXPECTED: {actual_count} creators found (more than claimed 32)")
        
        print()
        
        # Detailed results
        print("📋 DETAILED TEST RESULTS:")
        for result in self.test_results:
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            time_info = f" ({result['response_time']:.2f}s)" if result['response_time'] else ""
            print(f"   {status} {result['test']}: {result['details']}{time_info}")
            if result['error']:
                print(f"      Error: {result['error']}")
        
        return success_rate >= 80

def main():
    """Main test execution"""
    print("🔧 Starting Creator Count Verification Testing...")
    print("📋 This test addresses the review request:")
    print("   - Verify actual number of creators in system")
    print("   - Check current creator count vs claimed 32")
    print("   - Distinguish between test and real creator accounts")
    print("   - Provide accurate data for offer creation functionality")
    print("   - Resolve user's questioning of creator count")
    print()
    
    tester = CreatorCountVerificationTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Creator count verification completed successfully")
        sys.exit(0)
    else:
        print("\n❌ Creator count verification found issues")
        sys.exit(1)

if __name__ == "__main__":
    main()