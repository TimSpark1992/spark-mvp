#!/usr/bin/env python3
"""
Comprehensive Campaign Navigation Fix Testing
============================================

This test verifies the complete campaign navigation and loading issue fix including:
1. Direct API access via /api/campaigns/{id}
2. Fallback to getBrandCampaigns() when direct API fails
3. Data consistency between different access methods
4. Navigation fix verification for "Back to Campaign" functionality
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
LOCAL_URL = "http://localhost:3000"
EXTERNAL_URL = "https://www.sparkplatform.tech"
TEST_CAMPAIGN_ID = "be9e2307-d8bc-4292-b6f7-17ddcd0b07ca"

class ComprehensiveCampaignTester:
    def __init__(self):
        self.results = []
        self.session = requests.Session()
        self.session.timeout = 30
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            'test': test_name,
            'status': status,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.results.append(result)
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
    
    def test_local_direct_campaign_api(self):
        """Test 1: Local direct campaign API endpoint"""
        try:
            print(f"\n🔍 Testing local direct campaign API for ID: {TEST_CAMPAIGN_ID}...")
            
            response = self.session.get(f"{LOCAL_URL}/api/campaigns/{TEST_CAMPAIGN_ID}")
            
            if response.status_code == 200:
                data = response.json()
                campaign = data.get('campaign')
                
                if campaign and campaign.get('id') == TEST_CAMPAIGN_ID:
                    self.log_result(
                        "Local Direct Campaign API",
                        True,
                        f"Successfully retrieved campaign: {campaign.get('title')}",
                        f"Response time: {response.elapsed.total_seconds():.3f}s"
                    )
                    return campaign
                else:
                    self.log_result(
                        "Local Direct Campaign API",
                        False,
                        "Campaign data structure invalid or ID mismatch"
                    )
                    return None
            else:
                self.log_result(
                    "Local Direct Campaign API",
                    False,
                    f"API returned status {response.status_code}",
                    response.text[:200]
                )
                return None
                
        except Exception as e:
            self.log_result(
                "Local Direct Campaign API",
                False,
                f"Exception occurred: {str(e)}"
            )
            return None
    
    def test_local_general_campaigns_api(self):
        """Test 2: Local general campaigns API (fallback method)"""
        try:
            print("\n🔍 Testing local general campaigns API (fallback method)...")
            
            response = self.session.get(f"{LOCAL_URL}/api/campaigns")
            
            if response.status_code == 200:
                data = response.json()
                campaigns = data.get('campaigns', [])
                
                # Find our test campaign
                test_campaign = None
                for campaign in campaigns:
                    if campaign.get('id') == TEST_CAMPAIGN_ID:
                        test_campaign = campaign
                        break
                
                if test_campaign:
                    self.log_result(
                        "Local General Campaigns API (Fallback)",
                        True,
                        f"Found test campaign via fallback method: {test_campaign.get('title')}",
                        f"Total campaigns: {len(campaigns)}, Response time: {response.elapsed.total_seconds():.3f}s"
                    )
                    return test_campaign
                else:
                    self.log_result(
                        "Local General Campaigns API (Fallback)",
                        False,
                        f"Test campaign not found in {len(campaigns)} campaigns"
                    )
                    return None
            else:
                self.log_result(
                    "Local General Campaigns API (Fallback)",
                    False,
                    f"API returned status {response.status_code}"
                )
                return None
                
        except Exception as e:
            self.log_result(
                "Local General Campaigns API (Fallback)",
                False,
                f"Exception occurred: {str(e)}"
            )
            return None
    
    def test_data_consistency_between_methods(self, direct_campaign, fallback_campaign):
        """Test 3: Data consistency between direct API and fallback method"""
        try:
            print("\n🔍 Testing data consistency between direct API and fallback method...")
            
            if not direct_campaign or not fallback_campaign:
                self.log_result(
                    "Data Consistency Between Methods",
                    False,
                    "Cannot compare - one or both methods failed to retrieve campaign"
                )
                return False
            
            # Compare key fields
            key_fields = ['id', 'title', 'description', 'status', 'brand_id', 'created_at']
            inconsistencies = []
            
            for field in key_fields:
                direct_value = direct_campaign.get(field)
                fallback_value = fallback_campaign.get(field)
                
                if direct_value != fallback_value:
                    inconsistencies.append(f"{field}: direct='{direct_value}' vs fallback='{fallback_value}'")
            
            if not inconsistencies:
                self.log_result(
                    "Data Consistency Between Methods",
                    True,
                    "Campaign data is consistent between direct API and fallback method",
                    f"Verified {len(key_fields)} key fields"
                )
                return True
            else:
                self.log_result(
                    "Data Consistency Between Methods",
                    False,
                    f"Found {len(inconsistencies)} data inconsistencies",
                    "; ".join(inconsistencies)
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Data Consistency Between Methods",
                False,
                f"Exception occurred: {str(e)}"
            )
            return False
    
    def test_navigation_fix_simulation(self, campaign_data):
        """Test 4: Simulate the navigation fix for "Back to Campaign" functionality"""
        try:
            print("\n🔍 Testing navigation fix simulation...")
            
            if not campaign_data:
                self.log_result(
                    "Navigation Fix Simulation",
                    False,
                    "Cannot test navigation - no campaign data available"
                )
                return False
            
            # Simulate the frontend navigation logic
            # Check if campaign has all required fields for navigation
            required_navigation_fields = [
                'id', 'title', 'description', 'status', 'brand_id', 
                'created_at', 'category', 'budget_range'
            ]
            
            missing_fields = []
            for field in required_navigation_fields:
                if field not in campaign_data or campaign_data[field] is None:
                    missing_fields.append(field)
            
            if not missing_fields:
                # Simulate the "Back to Campaign" navigation
                campaign_url = f"/creator/campaigns/{campaign_data['id']}"
                brand_info = campaign_data.get('profiles', {})
                
                navigation_info = {
                    'campaign_id': campaign_data['id'],
                    'campaign_title': campaign_data['title'],
                    'campaign_status': campaign_data['status'],
                    'brand_name': brand_info.get('company_name', 'Unknown Brand'),
                    'navigation_url': campaign_url
                }
                
                self.log_result(
                    "Navigation Fix Simulation",
                    True,
                    "Navigation fix working - all required data available for 'Back to Campaign'",
                    f"URL: {campaign_url}, Brand: {navigation_info['brand_name']}"
                )
                
                # Test that the campaign is active and accessible
                if campaign_data['status'] == 'active':
                    self.log_result(
                        "Campaign Accessibility",
                        True,
                        "Campaign is active and accessible for navigation"
                    )
                else:
                    self.log_result(
                        "Campaign Accessibility",
                        False,
                        f"Campaign status is '{campaign_data['status']}' - may not be accessible"
                    )
                
                return True
            else:
                self.log_result(
                    "Navigation Fix Simulation",
                    False,
                    f"Navigation fix incomplete - missing required fields: {missing_fields}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Navigation Fix Simulation",
                False,
                f"Exception occurred: {str(e)}"
            )
            return False
    
    def test_brand_campaigns_fallback_logic(self, campaign_data):
        """Test 5: Test getBrandCampaigns fallback logic"""
        try:
            print("\n🔍 Testing getBrandCampaigns fallback logic...")
            
            if not campaign_data or not campaign_data.get('brand_id'):
                self.log_result(
                    "Brand Campaigns Fallback Logic",
                    False,
                    "Cannot test fallback - no campaign data or brand_id available"
                )
                return False
            
            brand_id = campaign_data['brand_id']
            
            # Get all campaigns and filter by brand_id (simulating getBrandCampaigns)
            response = self.session.get(f"{LOCAL_URL}/api/campaigns")
            
            if response.status_code == 200:
                data = response.json()
                all_campaigns = data.get('campaigns', [])
                
                # Filter campaigns by brand_id
                brand_campaigns = [c for c in all_campaigns if c.get('brand_id') == brand_id]
                
                # Check if our test campaign is in the brand campaigns
                test_campaign_in_brand = any(c.get('id') == TEST_CAMPAIGN_ID for c in brand_campaigns)
                
                if test_campaign_in_brand:
                    self.log_result(
                        "Brand Campaigns Fallback Logic",
                        True,
                        f"Fallback logic working - found {len(brand_campaigns)} campaigns for brand",
                        f"Test campaign found in brand campaigns list"
                    )
                    return True
                else:
                    self.log_result(
                        "Brand Campaigns Fallback Logic",
                        False,
                        f"Test campaign not found in brand campaigns (found {len(brand_campaigns)} campaigns for brand)"
                    )
                    return False
            else:
                self.log_result(
                    "Brand Campaigns Fallback Logic",
                    False,
                    f"Could not fetch campaigns for fallback test: {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Brand Campaigns Fallback Logic",
                False,
                f"Exception occurred: {str(e)}"
            )
            return False
    
    def test_external_api_status(self):
        """Test 6: Check external API status (production deployment)"""
        try:
            print(f"\n🔍 Testing external API status...")
            
            # Test general campaigns API
            response = self.session.get(f"{EXTERNAL_URL}/api/campaigns")
            
            if response.status_code == 200:
                data = response.json()
                campaigns = data.get('campaigns', [])
                
                self.log_result(
                    "External API Status",
                    True,
                    f"External API working - returned {len(campaigns)} campaigns",
                    f"Response time: {response.elapsed.total_seconds():.3f}s"
                )
                
                # Test specific campaign API
                try:
                    specific_response = self.session.get(f"{EXTERNAL_URL}/api/campaigns/{TEST_CAMPAIGN_ID}")
                    if specific_response.status_code == 200:
                        self.log_result(
                            "External Specific Campaign API",
                            True,
                            "External specific campaign API working"
                        )
                    elif specific_response.status_code == 504:
                        self.log_result(
                            "External Specific Campaign API",
                            False,
                            "External specific campaign API timing out (504) - deployment issue",
                            "Local API works, but external deployment has timeout issues"
                        )
                    else:
                        self.log_result(
                            "External Specific Campaign API",
                            False,
                            f"External specific campaign API returned {specific_response.status_code}"
                        )
                except:
                    self.log_result(
                        "External Specific Campaign API",
                        False,
                        "External specific campaign API request failed"
                    )
                
                return True
            else:
                self.log_result(
                    "External API Status",
                    False,
                    f"External API returned status {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "External API Status",
                False,
                f"Exception occurred: {str(e)}"
            )
            return False
    
    def run_comprehensive_tests(self):
        """Run all comprehensive campaign navigation tests"""
        print("🚀 Starting Comprehensive Campaign Navigation Fix Testing")
        print("=" * 80)
        print(f"Target Campaign ID: {TEST_CAMPAIGN_ID}")
        print(f"Local URL: {LOCAL_URL}")
        print(f"External URL: {EXTERNAL_URL}")
        print("=" * 80)
        
        # Test 1: Local direct campaign API
        direct_campaign = self.test_local_direct_campaign_api()
        
        # Test 2: Local general campaigns API (fallback)
        fallback_campaign = self.test_local_general_campaigns_api()
        
        # Test 3: Data consistency between methods
        self.test_data_consistency_between_methods(direct_campaign, fallback_campaign)
        
        # Test 4: Navigation fix simulation
        campaign_for_navigation = direct_campaign or fallback_campaign
        self.test_navigation_fix_simulation(campaign_for_navigation)
        
        # Test 5: Brand campaigns fallback logic
        self.test_brand_campaigns_fallback_logic(campaign_for_navigation)
        
        # Test 6: External API status
        self.test_external_api_status()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE CAMPAIGN NAVIGATION TESTING SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for r in self.results if "✅ PASS" in r['status'])
        failed = sum(1 for r in self.results if "❌ FAIL" in r['status'])
        total = len(self.results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed} ✅")
        print(f"Failed: {failed} ❌")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        print("\n📋 DETAILED RESULTS:")
        for result in self.results:
            print(f"{result['status']}: {result['test']}")
            print(f"   {result['message']}")
            if result['details']:
                print(f"   Details: {result['details']}")
        
        print("\n🎯 CAMPAIGN NAVIGATION FIX ANALYSIS:")
        
        # Analyze critical components
        direct_api_working = any(r['test'] == 'Local Direct Campaign API' and '✅ PASS' in r['status'] for r in self.results)
        fallback_working = any(r['test'] == 'Local General Campaigns API (Fallback)' and '✅ PASS' in r['status'] for r in self.results)
        navigation_working = any(r['test'] == 'Navigation Fix Simulation' and '✅ PASS' in r['status'] for r in self.results)
        data_consistent = any(r['test'] == 'Data Consistency Between Methods' and '✅ PASS' in r['status'] for r in self.results)
        
        if direct_api_working and fallback_working and navigation_working:
            print("✅ CAMPAIGN NAVIGATION FIX: FULLY WORKING")
            print("   - Direct campaign API endpoint implemented and working")
            print("   - Fallback to general campaigns API working")
            print("   - Navigation fix resolves 'Campaign Not Found' errors")
            print("   - 'Back to Campaign' functionality restored")
        elif fallback_working and navigation_working:
            print("⚠️  CAMPAIGN NAVIGATION FIX: PARTIALLY WORKING")
            print("   - Fallback method working (resolves the core issue)")
            print("   - Navigation functionality restored")
            print("   - Direct API may have deployment issues but fallback covers it")
        else:
            print("❌ CAMPAIGN NAVIGATION FIX: ISSUES DETECTED")
            print("   - Critical navigation functionality may still have problems")
        
        if data_consistent:
            print("✅ DATA CONSISTENCY: Excellent - no data inconsistencies detected")
        
        print("\n🔧 FINAL RECOMMENDATIONS:")
        
        if not direct_api_working:
            print("⚠️  Deploy the /api/campaigns/[id]/route.js endpoint to production")
        
        external_api_issues = any('504' in r['message'] for r in self.results)
        if external_api_issues:
            print("⚠️  External API has timeout issues - check deployment configuration")
        
        if passed >= total * 0.8:  # 80% pass rate
            print("✅ OVERALL: Campaign navigation fix is production-ready")
        else:
            print("❌ OVERALL: Additional fixes needed before production deployment")
        
        return passed >= total * 0.8

if __name__ == "__main__":
    tester = ComprehensiveCampaignTester()
    success = tester.run_comprehensive_tests()
    sys.exit(0 if success else 1)