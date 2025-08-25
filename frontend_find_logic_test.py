#!/usr/bin/env python3
"""
Frontend Find Logic Simulation Test
Testing the exact frontend find() logic that's causing the "Campaign not found" error
Focus: Simulating the exact JavaScript find() comparison logic
"""

import requests
import json
import time
import sys
import os
from datetime import datetime

# Configuration
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://www.sparkplatform.tech')
API_BASE = f"{BASE_URL}/api"
TARGET_CAMPAIGN_ID = 'bf199737-6845-4c29-9ce3-047acb644d32'

class FrontendFindLogicTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = 30
        self.test_results = []
        
    def log_test(self, test_name, success, details="", error=None):
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

    def test_api_campaigns_response_structure(self):
        """Test 1: Get campaigns and analyze response structure"""
        print("🔍 Testing API Campaigns Response Structure...")
        
        try:
            response = self.session.get(f"{API_BASE}/campaigns")
            
            if response.status_code == 200:
                data = response.json()
                campaigns = data.get('campaigns', [])
                
                if campaigns:
                    first_campaign = campaigns[0]
                    campaign_keys = list(first_campaign.keys())
                    campaign_id = first_campaign.get('id')
                    campaign_id_type = type(campaign_id).__name__
                    
                    self.log_test(
                        "API Response Structure", 
                        True, 
                        f"Found {len(campaigns)} campaigns. First campaign ID: '{campaign_id}' (type: {campaign_id_type}). Keys: {campaign_keys[:5]}..."
                    )
                    return campaigns
                else:
                    self.log_test(
                        "API Response Structure", 
                        False, 
                        "No campaigns found in API response"
                    )
                    return []
            else:
                self.log_test(
                    "API Response Structure", 
                    False, 
                    f"HTTP {response.status_code}: {response.text[:200]}"
                )
                return []
                
        except Exception as e:
            self.log_test(
                "API Response Structure", 
                False, 
                f"Request failed: {str(e)}"
            )
            return []

    def test_exact_find_logic_simulation(self, campaigns):
        """Test 2: Simulate exact JavaScript find() logic"""
        print("🔍 Simulating Exact JavaScript find() Logic...")
        
        if not campaigns:
            self.log_test(
                "JavaScript find() Logic", 
                False, 
                "No campaigns data to test"
            )
            return False
        
        # Simulate: result.data.find(c => c.id === params.id)
        found_campaign = None
        comparison_details = []
        
        print(f"   Target ID: '{TARGET_CAMPAIGN_ID}' (type: {type(TARGET_CAMPAIGN_ID).__name__})")
        print(f"   Searching through {len(campaigns)} campaigns...")
        
        for i, campaign in enumerate(campaigns):
            campaign_id = campaign.get('id')
            
            # JavaScript === comparison (strict equality)
            strict_equal = campaign_id == TARGET_CAMPAIGN_ID
            
            # Additional comparisons for debugging
            string_equal = str(campaign_id) == str(TARGET_CAMPAIGN_ID)
            type_match = type(campaign_id) == type(TARGET_CAMPAIGN_ID)
            
            comparison_details.append({
                'index': i,
                'campaign_id': campaign_id,
                'campaign_id_type': type(campaign_id).__name__,
                'strict_equal': strict_equal,
                'string_equal': string_equal,
                'type_match': type_match,
                'title': campaign.get('title', 'NO_TITLE')
            })
            
            print(f"   Campaign {i}: ID='{campaign_id}' (type: {type(campaign_id).__name__})")
            print(f"      Strict Equal (===): {strict_equal}")
            print(f"      String Equal: {string_equal}")
            print(f"      Type Match: {type_match}")
            print(f"      Title: '{campaign.get('title', 'NO_TITLE')}'")
            
            if strict_equal:
                found_campaign = campaign
                print(f"      ✅ FOUND! This is the target campaign")
                break
            else:
                print(f"      ❌ Not a match")
        
        if found_campaign:
            self.log_test(
                "JavaScript find() Logic", 
                True, 
                f"Campaign found via find() logic! Title: '{found_campaign.get('title')}', ID: '{found_campaign.get('id')}'"
            )
            return True
        else:
            self.log_test(
                "JavaScript find() Logic", 
                False, 
                f"Campaign NOT found via find() logic. Comparison details: {comparison_details}"
            )
            return False

    def test_url_parameter_simulation(self):
        """Test 3: Simulate URL parameter extraction"""
        print("🔍 Simulating URL Parameter Extraction...")
        
        # Simulate Next.js useParams() extraction from URL
        test_urls = [
            f"https://www.sparkplatform.tech/creator/campaigns/{TARGET_CAMPAIGN_ID}",
            f"/creator/campaigns/{TARGET_CAMPAIGN_ID}",
            TARGET_CAMPAIGN_ID
        ]
        
        extracted_ids = []
        
        for url in test_urls:
            # Simulate parameter extraction
            if url.startswith('http'):
                # Full URL
                extracted_id = url.split('/')[-1]
            elif url.startswith('/'):
                # Relative URL
                extracted_id = url.split('/')[-1]
            else:
                # Just the ID
                extracted_id = url
            
            extracted_ids.append({
                'original_url': url,
                'extracted_id': extracted_id,
                'matches_target': extracted_id == TARGET_CAMPAIGN_ID,
                'extracted_type': type(extracted_id).__name__
            })
            
            print(f"   URL: {url}")
            print(f"   Extracted ID: '{extracted_id}' (type: {type(extracted_id).__name__})")
            print(f"   Matches target: {extracted_id == TARGET_CAMPAIGN_ID}")
        
        all_match = all(item['matches_target'] for item in extracted_ids)
        
        self.log_test(
            "URL Parameter Extraction", 
            all_match, 
            f"URL parameter extraction results: {extracted_ids}"
        )
        return all_match

    def test_campaign_data_consistency(self):
        """Test 4: Test campaign data consistency across multiple requests"""
        print("🔍 Testing Campaign Data Consistency...")
        
        consistency_results = []
        
        for i in range(3):
            try:
                response = self.session.get(f"{API_BASE}/campaigns")
                
                if response.status_code == 200:
                    data = response.json()
                    campaigns = data.get('campaigns', [])
                    
                    # Find target campaign
                    target_campaign = None
                    for campaign in campaigns:
                        if campaign.get('id') == TARGET_CAMPAIGN_ID:
                            target_campaign = campaign
                            break
                    
                    consistency_results.append({
                        'request': i + 1,
                        'total_campaigns': len(campaigns),
                        'target_found': target_campaign is not None,
                        'target_title': target_campaign.get('title') if target_campaign else None,
                        'target_status': target_campaign.get('status') if target_campaign else None
                    })
                    
                    print(f"   Request {i+1}: {len(campaigns)} campaigns, target found: {target_campaign is not None}")
                    if target_campaign:
                        print(f"      Target title: '{target_campaign.get('title')}'")
                        print(f"      Target status: '{target_campaign.get('status')}'")
                else:
                    consistency_results.append({
                        'request': i + 1,
                        'error': f"HTTP {response.status_code}"
                    })
                    
            except Exception as e:
                consistency_results.append({
                    'request': i + 1,
                    'error': str(e)
                })
        
        # Check consistency
        successful_requests = [r for r in consistency_results if 'error' not in r]
        if successful_requests:
            target_found_counts = [r['target_found'] for r in successful_requests]
            consistent = len(set(target_found_counts)) <= 1
            
            self.log_test(
                "Campaign Data Consistency", 
                consistent, 
                f"Consistency across {len(successful_requests)} requests: {consistency_results}"
            )
            return consistent
        else:
            self.log_test(
                "Campaign Data Consistency", 
                False, 
                f"All requests failed: {consistency_results}"
            )
            return False

    def test_frontend_error_scenario_simulation(self):
        """Test 5: Simulate the exact frontend error scenario"""
        print("🔍 Simulating Frontend Error Scenario...")
        
        try:
            # Step 1: Get campaigns (like frontend does)
            response = self.session.get(f"{API_BASE}/campaigns")
            
            if response.status_code != 200:
                self.log_test(
                    "Frontend Error Scenario", 
                    False, 
                    f"API request failed: HTTP {response.status_code}"
                )
                return False
            
            data = response.json()
            campaigns = data.get('campaigns', [])
            
            print(f"   Step 1: API returned {len(campaigns)} campaigns")
            
            # Step 2: Simulate params.id (from URL)
            params_id = TARGET_CAMPAIGN_ID  # This is what useParams() would return
            print(f"   Step 2: params.id = '{params_id}' (type: {type(params_id).__name__})")
            
            # Step 3: Simulate the exact find() logic from the frontend
            found_campaign = None
            for campaign in campaigns:
                if campaign.get('id') == params_id:  # This is the exact comparison
                    found_campaign = campaign
                    break
            
            print(f"   Step 3: find() result = {found_campaign is not None}")
            
            # Step 4: Simulate the frontend logic after find()
            if not found_campaign:
                print(f"   Step 4: Campaign not found, would show 'Campaign not found' error")
                # This is where the frontend shows the error
                self.log_test(
                    "Frontend Error Scenario", 
                    False, 
                    f"Frontend would show 'Campaign not found' error. Campaign exists in API but find() failed."
                )
                return False
            else:
                print(f"   Step 4: Campaign found, would display campaign details")
                self.log_test(
                    "Frontend Error Scenario", 
                    True, 
                    f"Frontend would display campaign: '{found_campaign.get('title')}'"
                )
                return True
                
        except Exception as e:
            self.log_test(
                "Frontend Error Scenario", 
                False, 
                f"Simulation failed: {str(e)}"
            )
            return False

    def run_all_tests(self):
        """Run all frontend find logic tests"""
        print("🚀 FRONTEND FIND LOGIC SIMULATION TESTING")
        print("=" * 70)
        print(f"Testing against: {BASE_URL}")
        print(f"Target Campaign ID: {TARGET_CAMPAIGN_ID}")
        print("Focus: Simulating exact frontend JavaScript find() logic")
        print("=" * 70)
        
        # Test 1: Get campaigns data
        campaigns = self.test_api_campaigns_response_structure()
        
        # Run remaining tests
        tests = [
            ("JavaScript find() Logic", lambda: self.test_exact_find_logic_simulation(campaigns)),
            ("URL Parameter Extraction", self.test_url_parameter_simulation),
            ("Campaign Data Consistency", self.test_campaign_data_consistency),
            ("Frontend Error Scenario", self.test_frontend_error_scenario_simulation)
        ]
        
        passed = 1 if campaigns else 0  # Count the first test
        total = len(tests) + 1  # +1 for the first test
        
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
        print("📊 FRONTEND FIND LOGIC SIMULATION SUMMARY")
        print("=" * 70)
        
        success_rate = (passed / total) * 100
        print(f"Tests Passed: {passed}/{total} ({success_rate:.1f}%)")
        
        # Analysis
        print(f"\n🎯 FRONTEND FIND LOGIC ANALYSIS:")
        
        if campaigns:
            target_found = any(c.get('id') == TARGET_CAMPAIGN_ID for c in campaigns)
            
            if target_found:
                print(f"   ✅ Campaign exists in API response")
                print(f"   ✅ JavaScript find() logic should work correctly")
                print(f"   🤔 If user still sees 'Campaign not found', the issue may be:")
                print(f"      - Frontend caching issues")
                print(f"      - Authentication/permission problems")
                print(f"      - Race conditions in loading")
                print(f"      - URL routing issues")
            else:
                print(f"   ❌ Campaign does NOT exist in API response")
                print(f"   ✅ 'Campaign not found' error is CORRECT")
        else:
            print(f"   ❌ Could not retrieve campaigns data")
        
        # Detailed results
        print(f"\n📋 DETAILED TEST RESULTS:")
        for result in self.test_results:
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            print(f"   {status} {result['test']}: {result['details']}")
            if result['error']:
                print(f"      Error: {result['error']}")
        
        return success_rate >= 70

def main():
    """Main test execution"""
    print("🔧 Starting Frontend Find Logic Simulation Testing...")
    print("📋 This test simulates the exact frontend JavaScript logic:")
    print("   - getCampaigns() API call")
    print("   - result.data.find(c => c.id === params.id)")
    print("   - URL parameter extraction")
    print("   - Error handling logic")
    print()
    
    tester = FrontendFindLogicTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Frontend find logic simulation completed - see analysis above")
        sys.exit(0)
    else:
        print("\n❌ Frontend find logic simulation found issues")
        sys.exit(1)

if __name__ == "__main__":
    main()