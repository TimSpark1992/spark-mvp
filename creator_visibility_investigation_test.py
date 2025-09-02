#!/usr/bin/env python3
"""
Creator Visibility Investigation Test
====================================

This test investigates the specific creator account with email "test.creator@example.com"
and verifies creator visibility issues in the offer creation page.

Context: User manually created a test creator but cannot find it among the 32 creators
shown in the offer creation page. Need to verify if this creator exists and why it 
might not be visible.

Test Areas:
1. Specific Creator Search - Look for "test.creator@example.com"
2. Creator Details - Full name, ID, and profile details
3. Creator Role Verification - Verify role="creator" properly set
4. Profile Completeness - Check if profile is complete and active
5. All Creator Emails - List all creator emails to identify similar emails
6. Visibility Issues - Check for filtering or data issues
"""

import requests
import json
import time
from datetime import datetime

class CreatorVisibilityInvestigator:
    def __init__(self):
        self.base_url = "https://www.sparkplatform.tech"
        self.api_base = f"{self.base_url}/api"
        self.target_email = "test.creator@example.com"
        self.results = {
            'target_creator_found': False,
            'target_creator_details': None,
            'all_creators': [],
            'creator_emails': [],
            'visibility_issues': [],
            'recommendations': []
        }
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_profiles_api_access(self):
        """Test if we can access the profiles API to search for creators"""
        self.log("🔍 Testing Profiles API Access...")
        
        try:
            response = requests.get(f"{self.api_base}/profiles", timeout=30)
            self.log(f"Profiles API Response: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.log(f"✅ Profiles API accessible - Found {len(data.get('profiles', []))} profiles")
                    return data
                except json.JSONDecodeError:
                    self.log("❌ Profiles API returned invalid JSON")
                    return None
            else:
                self.log(f"❌ Profiles API returned status {response.status_code}")
                return None
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ Profiles API request failed: {str(e)}")
            return None
    
    def search_specific_creator(self):
        """Search for the specific creator with email test.creator@example.com"""
        self.log(f"🎯 Searching for specific creator: {self.target_email}")
        
        # Try profiles API first
        profiles_data = self.test_profiles_api_access()
        
        if profiles_data and 'profiles' in profiles_data:
            profiles = profiles_data['profiles']
            
            # Search for target creator
            target_creator = None
            all_creators = []
            
            for profile in profiles:
                if profile.get('role') == 'creator':
                    all_creators.append(profile)
                    self.results['creator_emails'].append(profile.get('email', 'No email'))
                    
                    if profile.get('email') == self.target_email:
                        target_creator = profile
                        self.results['target_creator_found'] = True
                        self.results['target_creator_details'] = profile
            
            self.results['all_creators'] = all_creators
            
            if target_creator:
                self.log(f"✅ FOUND TARGET CREATOR: {self.target_email}")
                self.log(f"   - ID: {target_creator.get('id')}")
                self.log(f"   - Full Name: {target_creator.get('full_name')}")
                self.log(f"   - Role: {target_creator.get('role')}")
                self.log(f"   - Created: {target_creator.get('created_at')}")
                return target_creator
            else:
                self.log(f"❌ TARGET CREATOR NOT FOUND: {self.target_email}")
                self.log(f"   - Total creators found: {len(all_creators)}")
                return None
        
        # If profiles API doesn't work, try alternative approaches
        self.log("⚠️ Profiles API not accessible, trying alternative methods...")
        return self.search_creator_alternative_methods()
    
    def search_creator_alternative_methods(self):
        """Alternative methods to search for the creator"""
        self.log("🔄 Trying alternative creator search methods...")
        
        # Try health check to verify API connectivity
        try:
            health_response = requests.get(f"{self.api_base}/health", timeout=10)
            self.log(f"Health Check: {health_response.status_code}")
            
            if health_response.status_code == 200:
                self.log("✅ API connectivity confirmed")
            else:
                self.log("⚠️ API connectivity issues detected")
                
        except Exception as e:
            self.log(f"❌ Health check failed: {str(e)}")
        
        # Try campaigns API to see if we can get creator data indirectly
        try:
            campaigns_response = requests.get(f"{self.api_base}/campaigns", timeout=30)
            self.log(f"Campaigns API Response: {campaigns_response.status_code}")
            
            if campaigns_response.status_code == 200:
                campaigns_data = campaigns_response.json()
                self.log(f"✅ Campaigns API accessible - Found {len(campaigns_data.get('campaigns', []))} campaigns")
                
                # Look for creator information in campaigns
                for campaign in campaigns_data.get('campaigns', []):
                    if 'profiles' in campaign:
                        profile = campaign['profiles']
                        if profile.get('role') == 'creator' and profile.get('email') == self.target_email:
                            self.log(f"✅ Found target creator in campaigns data!")
                            return profile
                            
        except Exception as e:
            self.log(f"❌ Campaigns API failed: {str(e)}")
        
        return None
    
    def verify_creator_role(self, creator_data):
        """Verify the creator has the correct role assignment"""
        self.log("🔐 Verifying Creator Role Assignment...")
        
        if not creator_data:
            self.log("❌ No creator data to verify")
            return False
        
        role = creator_data.get('role')
        email = creator_data.get('email')
        
        self.log(f"Creator Role Verification:")
        self.log(f"   - Email: {email}")
        self.log(f"   - Role: {role}")
        
        if role == 'creator':
            self.log("✅ Creator role correctly assigned")
            return True
        else:
            self.log(f"❌ INCORRECT ROLE: Expected 'creator', found '{role}'")
            self.results['visibility_issues'].append(f"Incorrect role assignment: {role} instead of 'creator'")
            return False
    
    def check_profile_completeness(self, creator_data):
        """Check if the creator profile is complete and active"""
        self.log("📋 Checking Profile Completeness...")
        
        if not creator_data:
            self.log("❌ No creator data to check")
            return False
        
        required_fields = ['id', 'email', 'full_name', 'role']
        optional_fields = ['bio', 'profile_picture', 'social_links', 'category_tags', 'website_url']
        
        missing_required = []
        missing_optional = []
        
        for field in required_fields:
            if not creator_data.get(field):
                missing_required.append(field)
        
        for field in optional_fields:
            if not creator_data.get(field):
                missing_optional.append(field)
        
        self.log(f"Profile Completeness Analysis:")
        self.log(f"   - Required fields present: {len(required_fields) - len(missing_required)}/{len(required_fields)}")
        self.log(f"   - Optional fields present: {len(optional_fields) - len(missing_optional)}/{len(optional_fields)}")
        
        if missing_required:
            self.log(f"❌ Missing required fields: {missing_required}")
            self.results['visibility_issues'].append(f"Missing required fields: {missing_required}")
            return False
        else:
            self.log("✅ All required fields present")
            
        if missing_optional:
            self.log(f"⚠️ Missing optional fields: {missing_optional}")
            self.results['recommendations'].append(f"Consider completing optional fields: {missing_optional}")
        
        return True
    
    def list_all_creator_emails(self):
        """List all creator email addresses to help identify similar emails"""
        self.log("📧 Listing All Creator Email Addresses...")
        
        creator_emails = self.results['creator_emails']
        
        if not creator_emails:
            self.log("❌ No creator emails found")
            return
        
        self.log(f"Found {len(creator_emails)} creator email addresses:")
        
        # Sort emails for easier analysis
        creator_emails.sort()
        
        for i, email in enumerate(creator_emails, 1):
            marker = "🎯" if email == self.target_email else "  "
            self.log(f"{marker} {i:2d}. {email}")
        
        # Look for similar emails
        target_parts = self.target_email.split('@')
        if len(target_parts) == 2:
            target_username = target_parts[0]
            target_domain = target_parts[1]
            
            similar_emails = []
            for email in creator_emails:
                if email != self.target_email:
                    email_parts = email.split('@')
                    if len(email_parts) == 2:
                        username = email_parts[0]
                        domain = email_parts[1]
                        
                        # Check for similar usernames or domains
                        if (target_username in username or username in target_username or
                            target_domain in domain or domain in target_domain):
                            similar_emails.append(email)
            
            if similar_emails:
                self.log(f"🔍 Found {len(similar_emails)} similar email addresses:")
                for email in similar_emails:
                    self.log(f"   - {email}")
            else:
                self.log("ℹ️ No similar email addresses found")
    
    def check_visibility_issues(self):
        """Check for potential filtering or data issues preventing creator visibility"""
        self.log("🔍 Checking for Visibility Issues...")
        
        total_creators = len(self.results['all_creators'])
        target_found = self.results['target_creator_found']
        
        self.log(f"Visibility Analysis:")
        self.log(f"   - Total creators in system: {total_creators}")
        self.log(f"   - Target creator found: {target_found}")
        self.log(f"   - User reports seeing: 32 creators in offer creation")
        
        if total_creators != 32:
            issue = f"Creator count mismatch: System has {total_creators} creators, but user sees 32"
            self.log(f"⚠️ {issue}")
            self.results['visibility_issues'].append(issue)
        
        if not target_found:
            self.results['visibility_issues'].append("Target creator not found in system")
            self.results['recommendations'].append("Verify creator account was created successfully")
            self.results['recommendations'].append("Check if creator completed signup process")
            self.results['recommendations'].append("Verify creator role assignment in database")
        
        # Check for potential filtering issues
        if target_found:
            creator = self.results['target_creator_details']
            
            # Check if creator might be filtered out
            if not creator.get('bio'):
                self.results['visibility_issues'].append("Creator has no bio - might be filtered out")
            
            if not creator.get('profile_picture'):
                self.results['visibility_issues'].append("Creator has no profile picture - might be filtered out")
            
            if not creator.get('category_tags'):
                self.results['visibility_issues'].append("Creator has no category tags - might be filtered out")
    
    def generate_recommendations(self):
        """Generate recommendations based on findings"""
        self.log("💡 Generating Recommendations...")
        
        if not self.results['target_creator_found']:
            self.results['recommendations'].extend([
                "1. Verify the creator account exists in the database",
                "2. Check if signup process completed successfully",
                "3. Verify email address spelling and case sensitivity",
                "4. Check if account was created in correct environment (dev vs prod)"
            ])
        else:
            creator = self.results['target_creator_details']
            
            if creator.get('role') != 'creator':
                self.results['recommendations'].append("Update user role to 'creator' in profiles table")
            
            if not creator.get('bio'):
                self.results['recommendations'].append("Add bio to creator profile")
            
            if not creator.get('profile_picture'):
                self.results['recommendations'].append("Upload profile picture")
            
            if not creator.get('category_tags'):
                self.results['recommendations'].append("Add category tags to improve discoverability")
        
        # General recommendations
        self.results['recommendations'].extend([
            "Check offer creation page filtering logic",
            "Verify creator visibility settings",
            "Test with different browser/cache clearing"
        ])
    
    def run_comprehensive_investigation(self):
        """Run the complete creator visibility investigation"""
        self.log("🚀 Starting Comprehensive Creator Visibility Investigation")
        self.log("=" * 70)
        
        start_time = time.time()
        
        try:
            # 1. Search for specific creator
            creator_data = self.search_specific_creator()
            
            # 2. Verify creator role if found
            if creator_data:
                self.verify_creator_role(creator_data)
                self.check_profile_completeness(creator_data)
            
            # 3. List all creator emails
            self.list_all_creator_emails()
            
            # 4. Check for visibility issues
            self.check_visibility_issues()
            
            # 5. Generate recommendations
            self.generate_recommendations()
            
        except Exception as e:
            self.log(f"❌ Investigation failed with exception: {str(e)}")
            self.results['visibility_issues'].append(f"Investigation exception: {str(e)}")
        
        end_time = time.time()
        duration = end_time - start_time
        
        self.log("=" * 70)
        self.log(f"🏁 Investigation completed in {duration:.2f} seconds")
        
        return self.results
    
    def print_final_report(self):
        """Print the final investigation report"""
        self.log("\n" + "=" * 70)
        self.log("📊 FINAL INVESTIGATION REPORT")
        self.log("=" * 70)
        
        # Target Creator Status
        if self.results['target_creator_found']:
            creator = self.results['target_creator_details']
            self.log("✅ TARGET CREATOR FOUND:")
            self.log(f"   - Email: {creator.get('email')}")
            self.log(f"   - ID: {creator.get('id')}")
            self.log(f"   - Full Name: {creator.get('full_name')}")
            self.log(f"   - Role: {creator.get('role')}")
            self.log(f"   - Created: {creator.get('created_at')}")
        else:
            self.log("❌ TARGET CREATOR NOT FOUND")
        
        # Creator Count Summary
        total_creators = len(self.results['all_creators'])
        self.log(f"\n📈 CREATOR COUNT SUMMARY:")
        self.log(f"   - Total creators in system: {total_creators}")
        self.log(f"   - User reports seeing: 32 creators")
        self.log(f"   - Count match: {'✅ Yes' if total_creators == 32 else '❌ No'}")
        
        # All Creator Emails
        if self.results['creator_emails']:
            self.log(f"\n📧 ALL CREATOR EMAILS ({len(self.results['creator_emails'])}):")
            for i, email in enumerate(sorted(self.results['creator_emails']), 1):
                marker = "🎯" if email == self.target_email else "  "
                self.log(f"{marker} {i:2d}. {email}")
        
        # Visibility Issues
        if self.results['visibility_issues']:
            self.log(f"\n⚠️ VISIBILITY ISSUES IDENTIFIED ({len(self.results['visibility_issues'])}):")
            for i, issue in enumerate(self.results['visibility_issues'], 1):
                self.log(f"   {i}. {issue}")
        else:
            self.log("\n✅ NO VISIBILITY ISSUES IDENTIFIED")
        
        # Recommendations
        if self.results['recommendations']:
            self.log(f"\n💡 RECOMMENDATIONS ({len(self.results['recommendations'])}):")
            for i, rec in enumerate(self.results['recommendations'], 1):
                self.log(f"   {i}. {rec}")
        
        self.log("\n" + "=" * 70)

def main():
    """Main function to run the creator visibility investigation"""
    print("🔍 Creator Visibility Investigation Test")
    print("=" * 50)
    print("Investigating creator: test.creator@example.com")
    print("Context: User cannot find this creator among 32 creators in offer creation page")
    print("=" * 50)
    
    investigator = CreatorVisibilityInvestigator()
    
    try:
        # Run comprehensive investigation
        results = investigator.run_comprehensive_investigation()
        
        # Print final report
        investigator.print_final_report()
        
        # Return results for further processing
        return results
        
    except KeyboardInterrupt:
        print("\n⚠️ Investigation interrupted by user")
        return None
    except Exception as e:
        print(f"\n❌ Investigation failed: {str(e)}")
        return None

if __name__ == "__main__":
    results = main()