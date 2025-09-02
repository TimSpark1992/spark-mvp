#!/usr/bin/env python3
"""
Fix Creator Onboarding Status Test
==================================

This test fixes the identified issue where the creator "test.creator@example.com" 
has onboarding_completed = False, which is likely preventing them from appearing 
in the offer creation page.

Actions:
1. Update onboarding_completed to True
2. Verify the change
3. Test creator visibility again
"""

import requests
import json
import time
from datetime import datetime

class CreatorOnboardingFixer:
    def __init__(self):
        self.base_url = "https://www.sparkplatform.tech"
        self.api_base = f"{self.base_url}/api"
        self.target_creator_id = "5b408260-4d3d-4392-a589-0a485a4152a9"
        self.target_email = "test.creator@example.com"
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def get_current_creator_status(self):
        """Get current creator status before making changes"""
        self.log("📋 Getting current creator status...")
        
        try:
            response = requests.get(f"{self.api_base}/profiles", timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                profiles = data.get('profiles', [])
                
                for profile in profiles:
                    if profile.get('id') == self.target_creator_id:
                        self.log("✅ Found target creator profile")
                        self.log(f"   - Email: {profile.get('email')}")
                        self.log(f"   - Full Name: {profile.get('full_name')}")
                        self.log(f"   - Role: {profile.get('role')}")
                        self.log(f"   - Onboarding Completed: {profile.get('onboarding_completed')}")
                        return profile
                
                self.log("❌ Target creator not found")
                return None
            else:
                self.log(f"❌ Profiles API failed: {response.status_code}")
                return None
                
        except Exception as e:
            self.log(f"❌ Error getting creator status: {str(e)}")
            return None
    
    def update_creator_onboarding_status(self):
        """Update creator onboarding status to completed"""
        self.log("🔧 Attempting to update creator onboarding status...")
        
        # Since we don't have direct access to update the database via API,
        # let's check if there's a profiles update endpoint
        try:
            # Try to update via profiles API (if it supports PUT/PATCH)
            update_data = {
                "onboarding_completed": True
            }
            
            # Try PATCH method first
            response = requests.patch(
                f"{self.api_base}/profiles/{self.target_creator_id}",
                json=update_data,
                timeout=30
            )
            
            self.log(f"PATCH Profiles API Response: {response.status_code}")
            
            if response.status_code in [200, 204]:
                self.log("✅ Successfully updated creator onboarding status via PATCH")
                return True
            
            # Try PUT method
            response = requests.put(
                f"{self.api_base}/profiles/{self.target_creator_id}",
                json=update_data,
                timeout=30
            )
            
            self.log(f"PUT Profiles API Response: {response.status_code}")
            
            if response.status_code in [200, 204]:
                self.log("✅ Successfully updated creator onboarding status via PUT")
                return True
            
            # Try POST to profiles endpoint
            response = requests.post(
                f"{self.api_base}/profiles",
                json={**update_data, "id": self.target_creator_id},
                timeout=30
            )
            
            self.log(f"POST Profiles API Response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                self.log("✅ Successfully updated creator onboarding status via POST")
                return True
            
            self.log("❌ No suitable API endpoint found for updating profiles")
            return False
            
        except Exception as e:
            self.log(f"❌ Error updating creator status: {str(e)}")
            return False
    
    def verify_creator_visibility_after_fix(self):
        """Verify creator visibility after fixing onboarding status"""
        self.log("🔍 Verifying creator visibility after fix...")
        
        # Get updated status
        updated_profile = self.get_current_creator_status()
        
        if updated_profile:
            onboarding_completed = updated_profile.get('onboarding_completed')
            
            if onboarding_completed:
                self.log("✅ Onboarding status successfully updated to True")
                
                # Test if creator now appears in offer creation context
                self.log("🎯 Testing creator visibility for offer creation...")
                
                # Check rate cards (should still be there)
                try:
                    response = requests.get(
                        f"{self.api_base}/rate-cards?creator_id={self.target_creator_id}",
                        timeout=30
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        rate_cards = data.get('rateCards', [])
                        self.log(f"✅ Creator still has {len(rate_cards)} rate cards")
                        
                        # Creator should now be eligible for offers
                        self.log("✅ Creator should now be visible in offer creation!")
                        return True
                    else:
                        self.log(f"⚠️ Rate cards check failed: {response.status_code}")
                        return False
                        
                except Exception as e:
                    self.log(f"❌ Visibility verification error: {str(e)}")
                    return False
            else:
                self.log("❌ Onboarding status still False after update attempt")
                return False
        else:
            self.log("❌ Could not verify updated profile")
            return False
    
    def provide_manual_fix_instructions(self):
        """Provide manual fix instructions if API update doesn't work"""
        self.log("\n" + "=" * 70)
        self.log("🛠️ MANUAL FIX INSTRUCTIONS")
        self.log("=" * 70)
        
        self.log("Since API update may not be available, here's how to fix manually:")
        self.log("")
        self.log("1. Access Supabase Dashboard:")
        self.log("   - Go to your Supabase project dashboard")
        self.log("   - Navigate to Table Editor")
        self.log("   - Select 'profiles' table")
        self.log("")
        self.log("2. Find the creator record:")
        self.log(f"   - Search for ID: {self.target_creator_id}")
        self.log(f"   - Or search for email: {self.target_email}")
        self.log("")
        self.log("3. Update the onboarding_completed field:")
        self.log("   - Change onboarding_completed from 'false' to 'true'")
        self.log("   - Save the changes")
        self.log("")
        self.log("4. Verify the fix:")
        self.log("   - Refresh the offer creation page")
        self.log("   - The creator should now appear in the list")
        self.log("")
        self.log("SQL Command (if using SQL Editor):")
        self.log(f"UPDATE profiles SET onboarding_completed = true WHERE id = '{self.target_creator_id}';")
        self.log("")
        self.log("=" * 70)
    
    def run_comprehensive_fix(self):
        """Run comprehensive fix process"""
        self.log("🚀 Starting Creator Onboarding Fix Process")
        self.log("=" * 70)
        
        start_time = time.time()
        
        try:
            # Step 1: Get current status
            self.log("\n1️⃣ GETTING CURRENT STATUS")
            current_profile = self.get_current_creator_status()
            
            if not current_profile:
                self.log("❌ Cannot proceed - creator profile not found")
                return False
            
            current_onboarding = current_profile.get('onboarding_completed')
            self.log(f"Current onboarding_completed: {current_onboarding}")
            
            if current_onboarding:
                self.log("✅ Onboarding already completed - no fix needed")
                return True
            
            # Step 2: Attempt API update
            self.log("\n2️⃣ ATTEMPTING API UPDATE")
            update_success = self.update_creator_onboarding_status()
            
            if update_success:
                # Step 3: Verify fix
                self.log("\n3️⃣ VERIFYING FIX")
                verification_success = self.verify_creator_visibility_after_fix()
                
                if verification_success:
                    self.log("✅ Fix successful - creator should now be visible!")
                    return True
                else:
                    self.log("⚠️ Fix applied but verification failed")
                    return False
            else:
                # Step 4: Provide manual instructions
                self.log("\n4️⃣ PROVIDING MANUAL FIX INSTRUCTIONS")
                self.provide_manual_fix_instructions()
                return False
            
        except Exception as e:
            self.log(f"❌ Fix process failed: {str(e)}")
            return False
        
        finally:
            end_time = time.time()
            duration = end_time - start_time
            self.log(f"\n🏁 Fix process completed in {duration:.2f} seconds")

def main():
    """Main function to run the creator onboarding fix"""
    print("🔧 Creator Onboarding Fix Test")
    print("=" * 50)
    print("Fixing onboarding_completed status for test.creator@example.com")
    print("=" * 50)
    
    fixer = CreatorOnboardingFixer()
    
    try:
        # Run comprehensive fix
        success = fixer.run_comprehensive_fix()
        
        if success:
            print("\n✅ Creator onboarding fix completed successfully!")
            print("The creator should now be visible in offer creation page.")
        else:
            print("\n⚠️ Automatic fix not available - manual intervention required.")
            print("Please follow the manual fix instructions above.")
        
        return success
        
    except KeyboardInterrupt:
        print("\n⚠️ Fix process interrupted by user")
        return False
    except Exception as e:
        print(f"\n❌ Fix process failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()