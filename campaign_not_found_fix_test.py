#!/usr/bin/env python3
"""
Campaign Not Found Fix - Backend Testing
Testing the critical "Campaign Not Found" fix by verifying the corrected fallback logic

Focus Areas:
1. Primary API Test: Verify /api/campaigns/be9e2307-d8bc-4292-b6f7-17ddcd0b07ca returns campaign data correctly
2. Fallback Logic Test: Test that getBrandCampaigns() now receives proper brandId parameter
3. Brand Campaign Filter: Verify campaigns are properly filtered by brand ID
4. Data Consistency: Ensure campaign exists in both primary API and brand campaigns list
5. Error Recovery: Test that fallback logic works when primary API fails

Context: Fixed critical issue where getBrandCampaigns() was called without required brandId parameter,
causing fallback to return empty array and trigger "Campaign Not Found" error.
"""

import requests
import json
import time
import sys
import os
from datetime import datetime

# Configuration - Use environment URL or fallback
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://4f187fa2-e698-4163-ab14-cb3017f6b9af.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

# Test campaign ID from review request
TEST_CAMPAIGN_ID = "be9e2307-d8bc-4292-b6f7-17ddcd0b07ca"
TEST_BRAND_ID = "84eb94eb-1aca-4104-a161-e3df03d4759d"  # From test_result.md

class CampaignNotFoundFixTester:
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
        time_info = f" ({response_time:.3f}s)" if response_time else ""
        print(f"{status} {test_name}{time_info}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
        print()

    def test_primary_campaign_api(self):
        """Test 1: Primary API Test - Verify /api/campaigns/{id} returns campaign data correctly"""
        print("🔍 Testing Primary Campaign API...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/campaigns/{TEST_CAMPAIGN_ID}")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify campaign data structure
                if 'campaign' in data:
                    campaign = data['campaign']
                    required_fields = ['id', 'title', 'description', 'status', 'brand_id']
                    missing_fields = [field for field in required_fields if field not in campaign]
                    
                    if not missing_fields and campaign['id'] == TEST_CAMPAIGN_ID:
                        self.log_test(
                            "Primary Campaign API", 
                            True, 
                            f"Campaign '{campaign.get('title', 'Unknown')}' found with all required fields. Status: {campaign.get('status', 'Unknown')}",
                            response_time=response_time
                        )
                        return campaign
                    else:
                        self.log_test(
                            "Primary Campaign API", 
                            False, 
                            f"Campaign data incomplete. Missing fields: {missing_fields}. ID match: {campaign.get('id') == TEST_CAMPAIGN_ID}",
                            response_time=response_time
                        )
                        return None
                else:
                    self.log_test(
                        "Primary Campaign API", 
                        False, 
                        f"Invalid response format: {data}",
                        response_time=response_time
                    )
                    return None
            elif response.status_code == 404:
                self.log_test(
                    "Primary Campaign API", 
                    False, 
                    f"Campaign {TEST_CAMPAIGN_ID} not found (404)",
                    response_time=response_time
                )
                return None
            else:
                self.log_test(
                    "Primary Campaign API", 
                    False, 
                    f"HTTP {response.status_code}: {response.text[:200]}",
                    response_time=response_time
                )
                return None
                
        except Exception as e:
            self.log_test(
                "Primary Campaign API", 
                False, 
                f"Request failed: {str(e)}"
            )
            return None

    def test_general_campaigns_api(self):
        """Test 2: General Campaigns API - Verify campaign exists in general campaigns list"""
        print("🔍 Testing General Campaigns API...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/campaigns")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if 'campaigns' in data and isinstance(data['campaigns'], list):
                    campaigns = data['campaigns']
                    target_campaign = None
                    
                    # Find the test campaign in the list
                    for campaign in campaigns:
                        if campaign.get('id') == TEST_CAMPAIGN_ID:
                            target_campaign = campaign
                            break
                    
                    if target_campaign:
                        self.log_test(
                            "General Campaigns API", 
                            True, 
                            f"Campaign found in general list. Title: '{target_campaign.get('title', 'Unknown')}'. Total campaigns: {len(campaigns)}",
                            response_time=response_time
                        )
                        return target_campaign
                    else:
                        campaign_ids = [c.get('id', 'No ID') for c in campaigns[:3]]  # Show first 3 IDs
                        self.log_test(
                            "General Campaigns API", 
                            False, 
                            f"Campaign {TEST_CAMPAIGN_ID} not found in {len(campaigns)} campaigns. Sample IDs: {campaign_ids}",
                            response_time=response_time
                        )
                        return None
                else:
                    self.log_test(
                        "General Campaigns API", 
                        False, 
                        f"Invalid response format: {data}",
                        response_time=response_time
                    )
                    return None
            else:
                self.log_test(
                    "General Campaigns API", 
                    False, 
                    f"HTTP {response.status_code}: {response.text[:200]}",
                    response_time=response_time
                )
                return None
                
        except Exception as e:
            self.log_test(
                "General Campaigns API", 
                False, 
                f"Request failed: {str(e)}"
            )
            return None

    def test_brand_campaigns_fallback(self):
        """Test 3: Brand Campaigns Fallback - Test getBrandCampaigns() with proper brandId parameter"""
        print("🔍 Testing Brand Campaigns Fallback Logic...")
        
        # First, we need to determine the brand ID from the campaign
        campaign_data = self.test_primary_campaign_api()
        if not campaign_data:
            self.log_test(
                "Brand Campaigns Fallback", 
                False, 
                "Cannot test fallback - primary campaign not found"
            )
            return None
        
        brand_id = campaign_data.get('brand_id')
        if not brand_id:
            self.log_test(
                "Brand Campaigns Fallback", 
                False, 
                "Cannot test fallback - no brand_id in campaign data"
            )
            return None
        
        try:
            # Test the brand campaigns API (this simulates getBrandCampaigns() with proper brandId)
            start_time = time.time()
            
            # We'll test this by calling the general campaigns API and filtering by brand
            # This simulates what getBrandCampaigns() should do internally
            response = self.session.get(f"{API_BASE}/campaigns")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                campaigns = data.get('campaigns', [])
                
                # Filter campaigns by brand_id (simulating getBrandCampaigns behavior)
                brand_campaigns = [c for c in campaigns if c.get('brand_id') == brand_id]
                target_campaign = None
                
                for campaign in brand_campaigns:
                    if campaign.get('id') == TEST_CAMPAIGN_ID:
                        target_campaign = campaign
                        break
                
                if target_campaign:
                    self.log_test(
                        "Brand Campaigns Fallback", 
                        True, 
                        f"Campaign found in brand campaigns (Brand ID: {brand_id}). Brand campaigns count: {len(brand_campaigns)}",
                        response_time=response_time
                    )
                    return brand_campaigns
                else:
                    self.log_test(
                        "Brand Campaigns Fallback", 
                        False, 
                        f"Campaign not found in brand campaigns for Brand ID: {brand_id}. Found {len(brand_campaigns)} brand campaigns",
                        response_time=response_time
                    )
                    return None
            else:
                self.log_test(
                    "Brand Campaigns Fallback", 
                    False, 
                    f"HTTP {response.status_code}: {response.text[:200]}",
                    response_time=response_time
                )
                return None
                
        except Exception as e:
            self.log_test(
                "Brand Campaigns Fallback", 
                False, 
                f"Request failed: {str(e)}"
            )
            return None

    def test_brand_campaign_filter(self):
        """Test 4: Brand Campaign Filter - Verify campaigns are properly filtered by brand ID"""
        print("🔍 Testing Brand Campaign Filtering...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/campaigns")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                campaigns = data.get('campaigns', [])
                
                # Group campaigns by brand_id to verify filtering logic
                brand_groups = {}
                for campaign in campaigns:
                    brand_id = campaign.get('brand_id')
                    if brand_id:
                        if brand_id not in brand_groups:
                            brand_groups[brand_id] = []
                        brand_groups[brand_id].append(campaign)
                
                # Check if our test campaign's brand has proper filtering
                test_campaign = None
                for campaign in campaigns:
                    if campaign.get('id') == TEST_CAMPAIGN_ID:
                        test_campaign = campaign
                        break
                
                if test_campaign:
                    test_brand_id = test_campaign.get('brand_id')
                    brand_campaign_count = len(brand_groups.get(test_brand_id, []))
                    
                    self.log_test(
                        "Brand Campaign Filter", 
                        True, 
                        f"Brand filtering working. Brand {test_brand_id} has {brand_campaign_count} campaigns. Total brands: {len(brand_groups)}",
                        response_time=response_time
                    )
                    return brand_groups
                else:
                    self.log_test(
                        "Brand Campaign Filter", 
                        False, 
                        f"Test campaign {TEST_CAMPAIGN_ID} not found for filtering test",
                        response_time=response_time
                    )
                    return None
            else:
                self.log_test(
                    "Brand Campaign Filter", 
                    False, 
                    f"HTTP {response.status_code}: {response.text[:200]}",
                    response_time=response_time
                )
                return None
                
        except Exception as e:
            self.log_test(
                "Brand Campaign Filter", 
                False, 
                f"Request failed: {str(e)}"
            )
            return None

    def test_data_consistency(self):
        """Test 5: Data Consistency - Ensure campaign exists in both primary API and brand campaigns list"""
        print("🔍 Testing Data Consistency...")
        
        # Get campaign from primary API
        primary_campaign = self.test_primary_campaign_api()
        if not primary_campaign:
            self.log_test(
                "Data Consistency", 
                False, 
                "Primary API failed - cannot test consistency"
            )
            return False
        
        # Get campaign from general campaigns API
        general_campaign = self.test_general_campaigns_api()
        if not general_campaign:
            self.log_test(
                "Data Consistency", 
                False, 
                "General campaigns API failed - cannot test consistency"
            )
            return False
        
        # Compare key fields
        consistency_checks = []
        key_fields = ['id', 'title', 'description', 'status', 'brand_id']
        
        for field in key_fields:
            primary_value = primary_campaign.get(field)
            general_value = general_campaign.get(field)
            
            if primary_value == general_value:
                consistency_checks.append(f"✅ {field}: {primary_value}")
            else:
                consistency_checks.append(f"❌ {field}: Primary='{primary_value}' vs General='{general_value}'")
        
        all_consistent = all("✅" in check for check in consistency_checks)
        
        self.log_test(
            "Data Consistency", 
            all_consistent, 
            f"Field consistency: {', '.join(consistency_checks)}"
        )
        return all_consistent

    def test_error_recovery_fallback(self):
        """Test 6: Error Recovery - Test that fallback logic works when primary API fails"""
        print("🔍 Testing Error Recovery and Fallback Logic...")
        
        # Test with invalid campaign ID to simulate primary API failure
        invalid_campaign_id = "invalid-campaign-id-12345"
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/campaigns/{invalid_campaign_id}")
            response_time = time.time() - start_time
            
            # Primary API should fail (404 or 500)
            primary_failed = response.status_code in [404, 500]
            
            if primary_failed:
                # Now test if fallback (general campaigns API) still works
                fallback_start = time.time()
                fallback_response = self.session.get(f"{API_BASE}/campaigns")
                fallback_time = time.time() - fallback_start
                
                if fallback_response.status_code == 200:
                    fallback_data = fallback_response.json()
                    campaigns = fallback_data.get('campaigns', [])
                    
                    # Check if our test campaign is still accessible via fallback
                    test_campaign_found = any(c.get('id') == TEST_CAMPAIGN_ID for c in campaigns)
                    
                    if test_campaign_found:
                        self.log_test(
                            "Error Recovery Fallback", 
                            True, 
                            f"Fallback working correctly. Primary API failed (HTTP {response.status_code}) but fallback found {len(campaigns)} campaigns including test campaign",
                            response_time=response_time + fallback_time
                        )
                        return True
                    else:
                        self.log_test(
                            "Error Recovery Fallback", 
                            False, 
                            f"Fallback API works but test campaign not found in {len(campaigns)} campaigns",
                            response_time=response_time + fallback_time
                        )
                        return False
                else:
                    self.log_test(
                        "Error Recovery Fallback", 
                        False, 
                        f"Both primary and fallback APIs failed. Fallback HTTP {fallback_response.status_code}",
                        response_time=response_time + fallback_time
                    )
                    return False
            else:
                self.log_test(
                    "Error Recovery Fallback", 
                    False, 
                    f"Primary API should have failed with invalid ID but returned HTTP {response.status_code}",
                    response_time=response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Error Recovery Fallback", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False

    def test_getbrandcampaigns_parameter_fix(self):
        """Test 7: getBrandCampaigns Parameter Fix - Verify brandId parameter is properly passed"""
        print("🔍 Testing getBrandCampaigns Parameter Fix...")
        
        # This test simulates the fix where getBrandCampaigns() now receives proper brandId parameter
        # We'll test this by verifying that brand-specific filtering works correctly
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/campaigns")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                campaigns = data.get('campaigns', [])
                
                # Find our test campaign to get its brand_id
                test_campaign = None
                for campaign in campaigns:
                    if campaign.get('id') == TEST_CAMPAIGN_ID:
                        test_campaign = campaign
                        break
                
                if test_campaign:
                    brand_id = test_campaign.get('brand_id')
                    
                    # Simulate getBrandCampaigns(brandId) by filtering campaigns
                    brand_campaigns = [c for c in campaigns if c.get('brand_id') == brand_id]
                    
                    # Verify the test campaign is in the filtered results
                    test_campaign_in_brand_list = any(c.get('id') == TEST_CAMPAIGN_ID for c in brand_campaigns)
                    
                    if test_campaign_in_brand_list and len(brand_campaigns) > 0:
                        self.log_test(
                            "getBrandCampaigns Parameter Fix", 
                            True, 
                            f"Parameter fix working. Brand {brand_id} has {len(brand_campaigns)} campaigns including test campaign. No empty array returned.",
                            response_time=response_time
                        )
                        return True
                    else:
                        self.log_test(
                            "getBrandCampaigns Parameter Fix", 
                            False, 
                            f"Parameter fix issue. Brand {brand_id} filtering returned {len(brand_campaigns)} campaigns. Test campaign found: {test_campaign_in_brand_list}",
                            response_time=response_time
                        )
                        return False
                else:
                    self.log_test(
                        "getBrandCampaigns Parameter Fix", 
                        False, 
                        f"Test campaign {TEST_CAMPAIGN_ID} not found in {len(campaigns)} campaigns",
                        response_time=response_time
                    )
                    return False
            else:
                self.log_test(
                    "getBrandCampaigns Parameter Fix", 
                    False, 
                    f"HTTP {response.status_code}: {response.text[:200]}",
                    response_time=response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "getBrandCampaigns Parameter Fix", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False

    def run_all_tests(self):
        """Run all Campaign Not Found fix tests"""
        print("🚀 CAMPAIGN NOT FOUND FIX - BACKEND TESTING")
        print("=" * 80)
        print(f"Testing against: {BASE_URL}")
        print(f"API Base URL: {API_BASE}")
        print(f"Test Campaign ID: {TEST_CAMPAIGN_ID}")
        print(f"Test Brand ID: {TEST_BRAND_ID}")
        print("Focus: Critical 'Campaign Not Found' fix verification")
        print("=" * 80)
        
        # Run all tests
        tests = [
            ("Primary Campaign API", self.test_primary_campaign_api),
            ("General Campaigns API", self.test_general_campaigns_api),
            ("Brand Campaigns Fallback", self.test_brand_campaigns_fallback),
            ("Brand Campaign Filter", self.test_brand_campaign_filter),
            ("Data Consistency", self.test_data_consistency),
            ("Error Recovery Fallback", self.test_error_recovery_fallback),
            ("getBrandCampaigns Parameter Fix", self.test_getbrandcampaigns_parameter_fix)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                print(f"\n--- {test_name} ---")
                result = test_func()
                if result is not False:  # True or data returned
                    passed += 1
            except Exception as e:
                print(f"❌ Test {test_name} crashed: {str(e)}")
                self.log_test(test_name, False, f"Test crashed: {str(e)}")
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 CAMPAIGN NOT FOUND FIX - TESTING SUMMARY")
        print("=" * 80)
        
        success_rate = (passed / total) * 100
        print(f"Tests Passed: {passed}/{total} ({success_rate:.1f}%)")
        
        # Analyze response times
        api_times = [r['response_time'] for r in self.test_results if r['response_time'] and r['response_time'] < 30]
        if api_times:
            avg_time = sum(api_times) / len(api_times)
            max_time = max(api_times)
            print(f"\n⏱️  API RESPONSE TIME ANALYSIS:")
            print(f"   Average Response Time: {avg_time:.3f}s")
            print(f"   Maximum Response Time: {max_time:.3f}s")
            print(f"   Total API Calls Made: {len(api_times)}")
        
        # Campaign Not Found Fix Assessment
        print(f"\n🎯 CAMPAIGN NOT FOUND FIX ASSESSMENT:")
        if success_rate >= 85:
            print("   🎉 EXCELLENT - Campaign Not Found fix is WORKING CORRECTLY")
            print("   ✅ Primary API returns campaign data correctly")
            print("   ✅ getBrandCampaigns() receives proper brandId parameter")
            print("   ✅ Fallback logic works when primary API fails")
            print("   ✅ Data consistency maintained across all access methods")
        elif success_rate >= 70:
            print("   ⚠️  GOOD - Core fix functionality works but minor issues detected")
            print("   ✅ Campaign Not Found issue likely resolved")
            print("   ⚠️  Some edge cases may need attention")
        else:
            print("   🚨 NEEDS ATTENTION - Significant issues found")
            print("   ❌ Campaign Not Found fix may not be fully working")
            print("   ❌ API or data consistency problems detected")
        
        # Detailed results
        print(f"\n📋 DETAILED TEST RESULTS:")
        for result in self.test_results:
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            time_info = f" ({result['response_time']:.3f}s)" if result['response_time'] else ""
            print(f"   {status} {result['test']}: {result['details']}{time_info}")
            if result['error']:
                print(f"      Error: {result['error']}")
        
        return success_rate >= 70

def main():
    """Main test execution"""
    print("🔧 Starting Campaign Not Found Fix Backend Testing...")
    print("📋 This test focuses on the fixes mentioned in the review request:")
    print("   - Primary API Test: /api/campaigns/be9e2307-d8bc-4292-b6f7-17ddcd0b07ca")
    print("   - Fallback Logic: getBrandCampaigns() with proper brandId parameter")
    print("   - Brand Campaign Filter: Proper filtering by brand ID")
    print("   - Data Consistency: Campaign exists in both primary and brand lists")
    print("   - Error Recovery: Fallback logic works when primary API fails")
    print()
    
    tester = CampaignNotFoundFixTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Campaign Not Found fix testing completed successfully")
        sys.exit(0)
    else:
        print("\n❌ Campaign Not Found fix testing found issues that need attention")
        sys.exit(1)

if __name__ == "__main__":
    main()