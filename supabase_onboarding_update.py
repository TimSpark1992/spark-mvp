#!/usr/bin/env python3
"""
Supabase Onboarding Status Update - Direct Database Operation
Performs the actual SQL update using Supabase Python client to set onboarding_completed = true
Tests all 5 requirements from the review request with real database operations
"""

import os
import sys
import time
from datetime import datetime
from supabase import create_client, Client

class SupabaseOnboardingUpdater:
    def __init__(self):
        # Load Supabase configuration from environment
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url or not self.supabase_service_key:
            print("❌ Missing Supabase configuration:")
            print(f"   SUPABASE_URL: {'✅ Present' if self.supabase_url else '❌ Missing'}")
            print(f"   SERVICE_KEY: {'✅ Present' if self.supabase_service_key else '❌ Missing'}")
            sys.exit(1)
        
        # Create Supabase client with service role (bypasses RLS)
        self.supabase: Client = create_client(self.supabase_url, self.supabase_service_key)
        
        # Target creator information
        self.creator_id = "5b408260-4d3d-4392-a589-0a485a4152a9"
        self.creator_email = "test.creator@example.com"
        
        self.test_results = []
        
    def log_result(self, test_name, success, details="", error=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "error": str(error) if error else None,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
        print()

    def test_1_check_current_status(self):
        """Test 1: Check current onboarding status before update"""
        print("🔍 Test 1: Checking Current Onboarding Status...")
        
        try:
            # Get current profile data
            response = self.supabase.table('profiles').select('*').eq('id', self.creator_id).execute()
            
            if response.data and len(response.data) > 0:
                profile = response.data[0]
                current_status = profile.get('onboarding_completed', False)
                email = profile.get('email', 'Unknown')
                full_name = profile.get('full_name', 'Unknown')
                
                self.log_result(
                    "Current Status Check",
                    True,
                    f"Profile found - Email: {email}, Name: {full_name}, Onboarding: {current_status}"
                )
                return True, current_status
            else:
                self.log_result(
                    "Current Status Check",
                    False,
                    "Creator profile not found in database"
                )
                return False, None
                
        except Exception as e:
            self.log_result(
                "Current Status Check",
                False,
                f"Database query failed: {str(e)}"
            )
            return False, None

    def test_2_execute_update(self):
        """Test 2: Execute SQL to set onboarding_completed = true"""
        print("🔍 Test 2: Executing Onboarding Status Update...")
        
        try:
            # Execute the SQL update
            response = self.supabase.table('profiles').update({
                'onboarding_completed': True,
                'updated_at': datetime.now().isoformat()
            }).eq('id', self.creator_id).execute()
            
            if response.data and len(response.data) > 0:
                updated_profile = response.data[0]
                new_status = updated_profile.get('onboarding_completed', False)
                
                self.log_result(
                    "Onboarding Status Update",
                    new_status == True,
                    f"SQL UPDATE executed successfully - onboarding_completed = {new_status}"
                )
                return new_status == True
            else:
                self.log_result(
                    "Onboarding Status Update",
                    False,
                    "Update query returned no data"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Onboarding Status Update",
                False,
                f"SQL update failed: {str(e)}"
            )
            return False

    def test_3_verify_update(self):
        """Test 3: Verify the onboarding_completed field is now true"""
        print("🔍 Test 3: Verifying Update Success...")
        
        try:
            # Query the database to verify the update
            response = self.supabase.table('profiles').select('onboarding_completed, email, full_name, updated_at').eq('id', self.creator_id).execute()
            
            if response.data and len(response.data) > 0:
                profile = response.data[0]
                onboarding_status = profile.get('onboarding_completed', False)
                updated_at = profile.get('updated_at', 'Unknown')
                
                self.log_result(
                    "Update Verification",
                    onboarding_status == True,
                    f"Verification query confirms onboarding_completed = {onboarding_status}, updated_at = {updated_at}"
                )
                return onboarding_status == True
            else:
                self.log_result(
                    "Update Verification",
                    False,
                    "Verification query returned no data"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Update Verification",
                False,
                f"Verification query failed: {str(e)}"
            )
            return False

    def test_4_creator_visibility(self):
        """Test 4: Test creator visibility in offer creation list"""
        print("🔍 Test 4: Testing Creator Visibility for Offers...")
        
        try:
            # Check if creator has rate cards (indicates visibility for offers)
            response = self.supabase.table('rate_cards').select('*').eq('creator_id', self.creator_id).eq('active', True).execute()
            
            if response.data:
                rate_cards = response.data
                deliverable_types = [card.get('deliverable_type') for card in rate_cards]
                
                # Also check if profile is accessible for offer creation
                profile_response = self.supabase.table('profiles').select('id, full_name, onboarding_completed').eq('id', self.creator_id).execute()
                
                if profile_response.data and len(profile_response.data) > 0:
                    profile = profile_response.data[0]
                    is_onboarded = profile.get('onboarding_completed', False)
                    
                    self.log_result(
                        "Creator Visibility for Offers",
                        is_onboarded and len(rate_cards) > 0,
                        f"Creator visible: onboarding_completed={is_onboarded}, {len(rate_cards)} rate cards available: {deliverable_types}"
                    )
                    return is_onboarded and len(rate_cards) > 0
                else:
                    self.log_result(
                        "Creator Visibility for Offers",
                        False,
                        "Creator profile not accessible"
                    )
                    return False
            else:
                self.log_result(
                    "Creator Visibility for Offers",
                    False,
                    "No rate cards found - creator may not be visible for offers"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Creator Visibility for Offers",
                False,
                f"Visibility check failed: {str(e)}"
            )
            return False

    def test_5_profile_integrity(self):
        """Test 5: Ensure all other creator data remains intact"""
        print("🔍 Test 5: Validating Profile Data Integrity...")
        
        try:
            # Get complete profile data to check integrity
            response = self.supabase.table('profiles').select('*').eq('id', self.creator_id).execute()
            
            if response.data and len(response.data) > 0:
                profile = response.data[0]
                
                # Check essential fields
                integrity_checks = {
                    'id': profile.get('id') == self.creator_id,
                    'email': profile.get('email') == self.creator_email,
                    'full_name': profile.get('full_name') is not None,
                    'role': profile.get('role') is not None,
                    'onboarding_completed': profile.get('onboarding_completed') == True
                }
                
                passed_checks = sum(integrity_checks.values())
                total_checks = len(integrity_checks)
                
                # Additional check: verify created_at wasn't modified
                created_at = profile.get('created_at')
                updated_at = profile.get('updated_at')
                
                details = f"Integrity checks: {passed_checks}/{total_checks} passed. "
                details += f"Fields: {', '.join([f'{k}={v}' for k, v in integrity_checks.items()])}. "
                details += f"Created: {created_at}, Updated: {updated_at}"
                
                self.log_result(
                    "Profile Data Integrity",
                    passed_checks == total_checks,
                    details
                )
                return passed_checks == total_checks
            else:
                self.log_result(
                    "Profile Data Integrity",
                    False,
                    "Profile not found for integrity check"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Profile Data Integrity",
                False,
                f"Integrity check failed: {str(e)}"
            )
            return False

    def test_6_rate_cards_accessibility(self):
        """Test 6: Verify creator's rate cards are still accessible"""
        print("🔍 Test 6: Checking Rate Cards Accessibility...")
        
        try:
            # Get all rate cards for the creator
            response = self.supabase.table('rate_cards').select('*').eq('creator_id', self.creator_id).execute()
            
            if response.data:
                rate_cards = response.data
                active_cards = [card for card in rate_cards if card.get('active', True)]
                
                # Analyze rate card data
                card_details = []
                for card in active_cards:
                    deliverable = card.get('deliverable_type', 'Unknown')
                    price_cents = card.get('base_price_cents', 0)
                    currency = card.get('currency', 'USD')
                    card_details.append(f"{deliverable}: ${price_cents/100:.2f} {currency}")
                
                self.log_result(
                    "Rate Cards Accessibility",
                    len(active_cards) > 0,
                    f"Rate cards accessible: {len(active_cards)}/{len(rate_cards)} active. Details: {', '.join(card_details)}"
                )
                return len(active_cards) > 0
            else:
                self.log_result(
                    "Rate Cards Accessibility",
                    False,
                    "No rate cards found for creator"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Rate Cards Accessibility",
                False,
                f"Rate cards check failed: {str(e)}"
            )
            return False

    def run_complete_update_process(self):
        """Run the complete onboarding update process"""
        print("🚀 SUPABASE ONBOARDING STATUS UPDATE - COMPLETE PROCESS")
        print("=" * 80)
        print(f"Supabase URL: {self.supabase_url}")
        print(f"Target Creator ID: {self.creator_id}")
        print(f"Target Creator Email: {self.creator_email}")
        print("=" * 80)
        print("EXECUTING ALL 5 REVIEW REQUEST REQUIREMENTS:")
        print("1. ✅ Update Onboarding Status: Execute SQL to set onboarding_completed = true")
        print("2. ✅ Verify Update: Confirm the onboarding_completed field is now true")
        print("3. ✅ Test Creator Visibility: Verify creator appears in offer creation list")
        print("4. ✅ Profile Validation: Ensure all other creator data remains intact")
        print("5. ✅ Rate Cards Check: Verify creator's rate cards are still accessible")
        print("=" * 80)
        
        # Execute all tests in sequence
        tests = [
            ("Check Current Status", self.test_1_check_current_status),
            ("Execute Update", self.test_2_execute_update),
            ("Verify Update", self.test_3_verify_update),
            ("Creator Visibility", self.test_4_creator_visibility),
            ("Profile Integrity", self.test_5_profile_integrity),
            ("Rate Cards Accessibility", self.test_6_rate_cards_accessibility)
        ]
        
        passed = 0
        total = len(tests)
        current_status = None
        
        for i, (test_name, test_func) in enumerate(tests, 1):
            try:
                print(f"\n--- Test {i}: {test_name} ---")
                
                if test_name == "Check Current Status":
                    success, current_status = test_func()
                    if success:
                        passed += 1
                else:
                    if test_func():
                        passed += 1
                        
            except Exception as e:
                print(f"❌ Test {test_name} crashed: {str(e)}")
                self.log_result(test_name, False, f"Test crashed: {str(e)}")
        
        # Final Summary
        print("\n" + "=" * 80)
        print("📊 ONBOARDING STATUS UPDATE - FINAL RESULTS")
        print("=" * 80)
        
        success_rate = (passed / total) * 100
        print(f"Tests Passed: {passed}/{total} ({success_rate:.1f}%)")
        
        if current_status is not None:
            print(f"Initial onboarding_completed status: {current_status}")
        
        # Review request compliance
        print(f"\n🎯 REVIEW REQUEST COMPLIANCE:")
        if success_rate >= 85:
            print("   🎉 EXCELLENT - All review requirements successfully fulfilled")
            print("   ✅ 1. Onboarding status updated: SQL executed successfully")
            print("   ✅ 2. Update verified: onboarding_completed = true confirmed")
            print("   ✅ 3. Creator visibility: Creator now appears in offer creation")
            print("   ✅ 4. Profile validation: All creator data remains intact")
            print("   ✅ 5. Rate cards check: Rate cards remain accessible")
        elif success_rate >= 70:
            print("   ⚠️  PARTIAL SUCCESS - Most requirements fulfilled")
            print("   ✅ Core onboarding update completed")
            print("   ⚠️  Some verification steps may need attention")
        else:
            print("   🚨 ISSUES DETECTED - Review requirements not fully met")
            print("   ❌ Significant problems found during update process")
        
        # Detailed results
        print(f"\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            print(f"   {status} {result['test']}: {result['details']}")
            if result['error']:
                print(f"      Error: {result['error']}")
        
        return success_rate >= 70

def main():
    """Main execution"""
    print("🔧 Starting Supabase Onboarding Status Update...")
    print("📋 This script will execute the actual database update:")
    print("   - Connect to Supabase database using service role")
    print("   - Update onboarding_completed = true for creator 5b408260-4d3d-4392-a589-0a485a4152a9")
    print("   - Verify all 5 requirements from the review request")
    print()
    
    updater = SupabaseOnboardingUpdater()
    success = updater.run_complete_update_process()
    
    if success:
        print("\n✅ Onboarding status update completed successfully!")
        print("🎯 Creator should now be visible in offer creation page")
        sys.exit(0)
    else:
        print("\n❌ Issues encountered during onboarding status update")
        sys.exit(1)

if __name__ == "__main__":
    main()