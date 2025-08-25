#!/usr/bin/env python3
"""
Campaign Detail Access Debug Test
Debugging the specific campaign detail access issue for campaign ID: bf199737-6845-4c29-9ce3-047acb644d32
Focus: Testing if campaign exists, API response, frontend find logic simulation, authentication/permission issues
"""

import requests
import json
import time
import sys
import os
from datetime import datetime

# Configuration - Use production URL from .env.local
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://www.sparkplatform.tech')
API_BASE = f"{BASE_URL}/api"

# The specific campaign ID from the review request
TARGET_CAMPAIGN_ID = 'bf199737-6845-4c29-9ce3-047acb644d32'

class CampaignDetailDebugTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = 30
        self.test_results = []
        self.campaigns_data = None
        
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

    def test_campaigns_api_response(self):
        """Test 1: Check /api/campaigns endpoint response"""
        print("🔍 Testing /api/campaigns API Response...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/campaigns")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                self.campaigns_data = data.get('campaigns', [])
                
                self.log_test(
                    "Campaigns API Response", 
                    True, 
                    f"API returned {len(self.campaigns_data)} campaigns. Response structure: {list(data.keys())}",
                    response_time=response_time
                )
                return True
            else:
                self.log_test(
                    "Campaigns API Response", 
                    False, 
                    f"HTTP {response.status_code}: {response.text[:200]}",
                    response_time=response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Campaigns API Response", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False

    def test_target_campaign_exists_in_api(self):
        """Test 2: Check if target campaign ID exists in API response"""
        print(f"🔍 Testing if Campaign ID {TARGET_CAMPAIGN_ID} exists in API response...")
        
        if not self.campaigns_data:
            self.log_test(
                "Target Campaign in API", 
                False, 
                "No campaigns data available from previous test"
            )
            return False
        
        # Look for the target campaign ID
        target_campaign = None
        campaign_ids = []
        
        for campaign in self.campaigns_data:
            campaign_id = campaign.get('id', 'NO_ID')
            campaign_ids.append(campaign_id)
            
            if campaign_id == TARGET_CAMPAIGN_ID:
                target_campaign = campaign
                break
        
        if target_campaign:
            self.log_test(
                "Target Campaign in API", 
                True, 
                f"Campaign found! Title: '{target_campaign.get('title', 'NO_TITLE')}', Status: '{target_campaign.get('status', 'NO_STATUS')}', Brand ID: '{target_campaign.get('brand_id', 'NO_BRAND')[:8]}...'"
            )
            return True
        else:
            self.log_test(
                "Target Campaign in API", 
                False, 
                f"Campaign ID {TARGET_CAMPAIGN_ID} NOT FOUND in API response. Available IDs: {campaign_ids[:3]}{'...' if len(campaign_ids) > 3 else ''}"
            )
            return False

    def test_campaign_id_data_types(self):
        """Test 3: Analyze campaign ID data types and structure"""
        print("🔍 Testing Campaign ID Data Types and Structure...")
        
        if not self.campaigns_data:
            self.log_test(
                "Campaign ID Data Types", 
                False, 
                "No campaigns data available"
            )
            return False
        
        id_analysis = []
        for i, campaign in enumerate(self.campaigns_data[:5]):  # Analyze first 5 campaigns
            campaign_id = campaign.get('id')
            id_type = type(campaign_id).__name__
            id_length = len(str(campaign_id)) if campaign_id else 0
            has_hyphens = '-' in str(campaign_id) if campaign_id else False
            
            id_analysis.append({
                'index': i,
                'id': str(campaign_id)[:20] + '...' if len(str(campaign_id)) > 20 else str(campaign_id),
                'type': id_type,
                'length': id_length,
                'has_hyphens': has_hyphens
            })
        
        # Check if target campaign ID format matches existing IDs
        target_type = type(TARGET_CAMPAIGN_ID).__name__
        target_length = len(TARGET_CAMPAIGN_ID)
        target_has_hyphens = '-' in TARGET_CAMPAIGN_ID
        
        format_match = any(
            analysis['type'] == target_type and 
            analysis['has_hyphens'] == target_has_hyphens and
            abs(analysis['length'] - target_length) <= 2
            for analysis in id_analysis
        )
        
        self.log_test(
            "Campaign ID Data Types", 
            True, 
            f"ID Analysis: {id_analysis}. Target format matches existing: {format_match}"
        )
        return True

    def test_frontend_find_logic_simulation(self):
        """Test 4: Simulate frontend find() logic"""
        print("🔍 Simulating Frontend find() Logic...")
        
        if not self.campaigns_data:
            self.log_test(
                "Frontend Find Logic", 
                False, 
                "No campaigns data available"
            )
            return False
        
        # Simulate: campaigns.find(campaign => campaign.id === campaignId)
        found_campaign = None
        comparison_results = []
        
        for campaign in self.campaigns_data:
            campaign_id = campaign.get('id')
            
            # Test different comparison scenarios
            string_match = str(campaign_id) == str(TARGET_CAMPAIGN_ID)
            exact_match = campaign_id == TARGET_CAMPAIGN_ID
            
            comparison_results.append({
                'campaign_id': str(campaign_id)[:20] + '...' if len(str(campaign_id)) > 20 else str(campaign_id),
                'string_match': string_match,
                'exact_match': exact_match
            })
            
            if exact_match:
                found_campaign = campaign
                break
        
        if found_campaign:
            self.log_test(
                "Frontend Find Logic", 
                True, 
                f"Campaign found via find() logic! Title: '{found_campaign.get('title', 'NO_TITLE')}'"
            )
            return True
        else:
            self.log_test(
                "Frontend Find Logic", 
                False, 
                f"Campaign NOT found via find() logic. Comparison results: {comparison_results[:3]}{'...' if len(comparison_results) > 3 else ''}"
            )
            return False

    def test_campaign_by_id_endpoint(self):
        """Test 5: Test direct campaign by ID endpoint (if exists)"""
        print(f"🔍 Testing Direct Campaign by ID Endpoint...")
        
        # Try different possible endpoints
        endpoints_to_try = [
            f"{API_BASE}/campaigns/{TARGET_CAMPAIGN_ID}",
            f"{API_BASE}/campaign/{TARGET_CAMPAIGN_ID}",
            f"{API_BASE}/campaigns?id={TARGET_CAMPAIGN_ID}"
        ]
        
        success_count = 0
        
        for endpoint in endpoints_to_try:
            try:
                start_time = time.time()
                response = self.session.get(endpoint)
                response_time = time.time() - start_time
                
                print(f"  Testing {endpoint}: HTTP {response.status_code} ({response_time:.3f}s)")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"    ✅ Success: {list(data.keys())}")
                    success_count += 1
                elif response.status_code == 404:
                    print(f"    ❌ Not Found (expected for non-existent endpoints)")
                else:
                    print(f"    ⚠️  Unexpected status: {response.text[:100]}")
                    
            except Exception as e:
                print(f"    ❌ Exception: {str(e)}")
        
        self.log_test(
            "Campaign by ID Endpoints", 
            success_count > 0, 
            f"Tested {len(endpoints_to_try)} endpoints, {success_count} successful"
        )
        return success_count > 0

    def test_campaign_access_permissions(self):
        """Test 6: Test campaign access permissions and authentication"""
        print("🔍 Testing Campaign Access Permissions...")
        
        try:
            # Test without authentication
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/campaigns")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                campaigns = data.get('campaigns', [])
                
                # Check if campaigns are filtered by authentication
                has_active_campaigns = any(
                    campaign.get('status') == 'active' 
                    for campaign in campaigns
                )
                
                self.log_test(
                    "Campaign Access Permissions", 
                    True, 
                    f"Unauthenticated access allowed. {len(campaigns)} campaigns returned, {sum(1 for c in campaigns if c.get('status') == 'active')} active",
                    response_time=response_time
                )
                return True
            elif response.status_code in [401, 403]:
                self.log_test(
                    "Campaign Access Permissions", 
                    True, 
                    f"Authentication required (HTTP {response.status_code}) - this may explain the access issue",
                    response_time=response_time
                )
                return True
            else:
                self.log_test(
                    "Campaign Access Permissions", 
                    False, 
                    f"Unexpected response: HTTP {response.status_code}",
                    response_time=response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Campaign Access Permissions", 
                False, 
                f"Permission test failed: {str(e)}"
            )
            return False

    def test_campaign_status_and_visibility(self):
        """Test 7: Check campaign status and visibility rules"""
        print("🔍 Testing Campaign Status and Visibility Rules...")
        
        if not self.campaigns_data:
            self.log_test(
                "Campaign Status and Visibility", 
                False, 
                "No campaigns data available"
            )
            return False
        
        # Analyze campaign statuses
        status_counts = {}
        active_campaigns = []
        target_found_with_status = None
        
        for campaign in self.campaigns_data:
            status = campaign.get('status', 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
            
            if status == 'active':
                active_campaigns.append(campaign.get('id'))
            
            if campaign.get('id') == TARGET_CAMPAIGN_ID:
                target_found_with_status = status
        
        if target_found_with_status:
            self.log_test(
                "Campaign Status and Visibility", 
                True, 
                f"Target campaign found with status: '{target_found_with_status}'. All statuses: {status_counts}"
            )
        else:
            self.log_test(
                "Campaign Status and Visibility", 
                False, 
                f"Target campaign not found. Status distribution: {status_counts}. Active campaigns: {len(active_campaigns)}"
            )
        
        return target_found_with_status is not None

    def test_database_consistency_check(self):
        """Test 8: Database consistency check by making multiple requests"""
        print("🔍 Testing Database Consistency...")
        
        consistency_results = []
        
        for i in range(3):
            try:
                start_time = time.time()
                response = self.session.get(f"{API_BASE}/campaigns")
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    campaigns = data.get('campaigns', [])
                    campaign_count = len(campaigns)
                    
                    # Check if target campaign is in this response
                    target_in_response = any(
                        campaign.get('id') == TARGET_CAMPAIGN_ID 
                        for campaign in campaigns
                    )
                    
                    consistency_results.append({
                        'request': i + 1,
                        'campaign_count': campaign_count,
                        'target_found': target_in_response,
                        'response_time': response_time
                    })
                    
                    print(f"  Request {i+1}: {campaign_count} campaigns, target found: {target_in_response} ({response_time:.3f}s)")
                else:
                    consistency_results.append({
                        'request': i + 1,
                        'error': f"HTTP {response.status_code}",
                        'response_time': response_time
                    })
                    
            except Exception as e:
                consistency_results.append({
                    'request': i + 1,
                    'error': str(e)
                })
        
        # Check consistency
        campaign_counts = [r.get('campaign_count') for r in consistency_results if 'campaign_count' in r]
        target_found_counts = [r.get('target_found') for r in consistency_results if 'target_found' in r]
        
        consistent_counts = len(set(campaign_counts)) <= 1 if campaign_counts else False
        consistent_target = len(set(target_found_counts)) <= 1 if target_found_counts else False
        
        self.log_test(
            "Database Consistency", 
            consistent_counts and consistent_target, 
            f"Consistency check: Counts consistent: {consistent_counts}, Target consistent: {consistent_target}. Results: {consistency_results}"
        )
        
        return consistent_counts and consistent_target

    def run_all_tests(self):
        """Run all campaign detail debug tests"""
        print("🚀 CAMPAIGN DETAIL ACCESS DEBUG TESTING")
        print("=" * 70)
        print(f"Testing against: {BASE_URL}")
        print(f"API Base URL: {API_BASE}")
        print(f"Target Campaign ID: {TARGET_CAMPAIGN_ID}")
        print("Focus: Debugging 'Campaign not found' error for specific campaign")
        print("=" * 70)
        
        # Run all tests
        tests = [
            ("Campaigns API Response", self.test_campaigns_api_response),
            ("Target Campaign in API", self.test_target_campaign_exists_in_api),
            ("Campaign ID Data Types", self.test_campaign_id_data_types),
            ("Frontend Find Logic", self.test_frontend_find_logic_simulation),
            ("Campaign by ID Endpoints", self.test_campaign_by_id_endpoint),
            ("Campaign Access Permissions", self.test_campaign_access_permissions),
            ("Campaign Status and Visibility", self.test_campaign_status_and_visibility),
            ("Database Consistency", self.test_database_consistency_check)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                print(f"\n--- {test_name} ---")
                if test_func():
                    passed += 1
            except Exception as e:
                print(f"❌ Test {test_name} crashed: {str(e)}")
                self.log_test(test_name, False, f"Test crashed: {str(e)}")
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 CAMPAIGN DETAIL ACCESS DEBUG SUMMARY")
        print("=" * 70)
        
        success_rate = (passed / total) * 100
        print(f"Tests Passed: {passed}/{total} ({success_rate:.1f}%)")
        
        # Specific analysis for the campaign issue
        print(f"\n🎯 CAMPAIGN ACCESS ISSUE ANALYSIS:")
        
        if self.campaigns_data is not None:
            campaign_count = len(self.campaigns_data)
            target_found = any(c.get('id') == TARGET_CAMPAIGN_ID for c in self.campaigns_data)
            
            print(f"   📊 Total campaigns in API: {campaign_count}")
            print(f"   🎯 Target campaign found: {'✅ YES' if target_found else '❌ NO'}")
            
            if target_found:
                target_campaign = next(c for c in self.campaigns_data if c.get('id') == TARGET_CAMPAIGN_ID)
                print(f"   📝 Campaign details:")
                print(f"      - Title: {target_campaign.get('title', 'N/A')}")
                print(f"      - Status: {target_campaign.get('status', 'N/A')}")
                print(f"      - Brand ID: {target_campaign.get('brand_id', 'N/A')}")
                print(f"      - Created: {target_campaign.get('created_at', 'N/A')}")
                
                if target_campaign.get('status') != 'active':
                    print(f"   ⚠️  ISSUE IDENTIFIED: Campaign status is '{target_campaign.get('status')}', not 'active'")
                    print(f"      This may explain why it's not accessible to creators")
                else:
                    print(f"   ✅ Campaign is active and should be accessible")
            else:
                print(f"   🚨 ROOT CAUSE: Campaign ID {TARGET_CAMPAIGN_ID} does not exist in the database")
                print(f"      The 'Campaign not found' error is correct - the campaign doesn't exist")
                
                # Show available campaign IDs for comparison
                if self.campaigns_data:
                    sample_ids = [c.get('id', 'NO_ID') for c in self.campaigns_data[:3]]
                    print(f"   📋 Sample existing campaign IDs: {sample_ids}")
        else:
            print(f"   ❌ Could not retrieve campaigns data for analysis")
        
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
    print("🔧 Starting Campaign Detail Access Debug Testing...")
    print("📋 This test investigates the specific issue:")
    print(f"   - User accessing: https://www.sparkplatform.tech/creator/campaigns/{TARGET_CAMPAIGN_ID}")
    print("   - Getting 'Campaign not found' error")
    print("   - Need to determine if campaign exists and why it's not found")
    print()
    
    tester = CampaignDetailDebugTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Debug testing completed - see analysis above for root cause")
        sys.exit(0)
    else:
        print("\n❌ Debug testing found issues - see detailed results above")
        sys.exit(1)

if __name__ == "__main__":
    main()