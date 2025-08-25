#!/usr/bin/env python3
"""
Creator Campaign Access Test
Testing authentication and permission issues that might prevent campaign access
Focus: Testing creator role access, authentication states, and permission scenarios
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

class CreatorCampaignAccessTester:
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

    def test_unauthenticated_campaign_access(self):
        """Test 1: Test campaign access without authentication"""
        print("🔍 Testing Unauthenticated Campaign Access...")
        
        try:
            # Clear any existing session cookies
            self.session.cookies.clear()
            
            response = self.session.get(f"{API_BASE}/campaigns")
            
            if response.status_code == 200:
                data = response.json()
                campaigns = data.get('campaigns', [])
                
                target_found = any(c.get('id') == TARGET_CAMPAIGN_ID for c in campaigns)
                
                self.log_test(
                    "Unauthenticated Access", 
                    True, 
                    f"Unauthenticated access allowed. {len(campaigns)} campaigns returned, target found: {target_found}"
                )
                return True
            elif response.status_code in [401, 403]:
                self.log_test(
                    "Unauthenticated Access", 
                    True, 
                    f"Authentication required (HTTP {response.status_code}) - this explains the access issue"
                )
                return True
            else:
                self.log_test(
                    "Unauthenticated Access", 
                    False, 
                    f"Unexpected response: HTTP {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Unauthenticated Access", 
                False, 
                f"Test failed: {str(e)}"
            )
            return False

    def test_campaign_visibility_rules(self):
        """Test 2: Test campaign visibility and filtering rules"""
        print("🔍 Testing Campaign Visibility Rules...")
        
        try:
            response = self.session.get(f"{API_BASE}/campaigns")
            
            if response.status_code == 200:
                data = response.json()
                campaigns = data.get('campaigns', [])
                
                # Analyze campaign visibility
                visibility_analysis = {
                    'total_campaigns': len(campaigns),
                    'active_campaigns': 0,
                    'inactive_campaigns': 0,
                    'target_campaign_status': None,
                    'target_campaign_found': False
                }
                
                for campaign in campaigns:
                    status = campaign.get('status', 'unknown')
                    
                    if status == 'active':
                        visibility_analysis['active_campaigns'] += 1
                    else:
                        visibility_analysis['inactive_campaigns'] += 1
                    
                    if campaign.get('id') == TARGET_CAMPAIGN_ID:
                        visibility_analysis['target_campaign_status'] = status
                        visibility_analysis['target_campaign_found'] = True
                
                # Check if target campaign is visible to creators
                target_visible_to_creators = (
                    visibility_analysis['target_campaign_found'] and 
                    visibility_analysis['target_campaign_status'] == 'active'
                )
                
                self.log_test(
                    "Campaign Visibility Rules", 
                    target_visible_to_creators, 
                    f"Visibility analysis: {visibility_analysis}. Target visible to creators: {target_visible_to_creators}"
                )
                return target_visible_to_creators
            else:
                self.log_test(
                    "Campaign Visibility Rules", 
                    False, 
                    f"API request failed: HTTP {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Campaign Visibility Rules", 
                False, 
                f"Test failed: {str(e)}"
            )
            return False

    def test_creator_specific_endpoints(self):
        """Test 3: Test creator-specific API endpoints"""
        print("🔍 Testing Creator-Specific Endpoints...")
        
        creator_endpoints = [
            f"{API_BASE}/campaigns",  # General campaigns
            f"{API_BASE}/creator/campaigns",  # Creator-specific (if exists)
            f"{API_BASE}/campaigns?role=creator",  # Role-filtered (if exists)
        ]
        
        success_count = 0
        endpoint_results = []
        
        for endpoint in creator_endpoints:
            try:
                response = self.session.get(endpoint)
                
                result = {
                    'endpoint': endpoint,
                    'status_code': response.status_code,
                    'accessible': response.status_code == 200
                }
                
                if response.status_code == 200:
                    data = response.json()
                    campaigns = data.get('campaigns', [])
                    target_found = any(c.get('id') == TARGET_CAMPAIGN_ID for c in campaigns)
                    
                    result.update({
                        'campaign_count': len(campaigns),
                        'target_found': target_found
                    })
                    
                    if target_found:
                        success_count += 1
                    
                    print(f"   {endpoint}: HTTP {response.status_code}, {len(campaigns)} campaigns, target found: {target_found}")
                else:
                    print(f"   {endpoint}: HTTP {response.status_code}")
                
                endpoint_results.append(result)
                
            except Exception as e:
                endpoint_results.append({
                    'endpoint': endpoint,
                    'error': str(e)
                })
                print(f"   {endpoint}: Error - {str(e)}")
        
        self.log_test(
            "Creator-Specific Endpoints", 
            success_count > 0, 
            f"Tested {len(creator_endpoints)} endpoints, {success_count} found target campaign. Results: {endpoint_results}"
        )
        return success_count > 0

    def test_campaign_detail_page_simulation(self):
        """Test 4: Simulate the exact campaign detail page loading scenario"""
        print("🔍 Simulating Campaign Detail Page Loading...")
        
        try:
            # Step 1: Simulate initial page load (like useEffect)
            print("   Step 1: Simulating initial page load...")
            response = self.session.get(f"{API_BASE}/campaigns")
            
            if response.status_code != 200:
                self.log_test(
                    "Campaign Detail Page Simulation", 
                    False, 
                    f"Initial API call failed: HTTP {response.status_code}"
                )
                return False
            
            data = response.json()
            campaigns = data.get('campaigns', [])
            print(f"      API returned {len(campaigns)} campaigns")
            
            # Step 2: Simulate the find() logic (like frontend does)
            print("   Step 2: Simulating find() logic...")
            found_campaign = None
            for campaign in campaigns:
                if campaign.get('id') == TARGET_CAMPAIGN_ID:
                    found_campaign = campaign
                    break
            
            print(f"      Campaign found: {found_campaign is not None}")
            
            # Step 3: Simulate the conditional logic
            print("   Step 3: Simulating conditional logic...")
            if not found_campaign:
                print("      Would redirect to /creator/campaigns (campaign not found)")
                self.log_test(
                    "Campaign Detail Page Simulation", 
                    False, 
                    "Campaign detail page would show 'Campaign not found' and redirect"
                )
                return False
            else:
                print(f"      Would display campaign: '{found_campaign.get('title')}'")
                
                # Step 4: Check if campaign is accessible to creators
                campaign_status = found_campaign.get('status')
                accessible_to_creators = campaign_status == 'active'
                
                print(f"      Campaign status: '{campaign_status}'")
                print(f"      Accessible to creators: {accessible_to_creators}")
                
                self.log_test(
                    "Campaign Detail Page Simulation", 
                    accessible_to_creators, 
                    f"Campaign detail page would display: '{found_campaign.get('title')}' (status: {campaign_status})"
                )
                return accessible_to_creators
                
        except Exception as e:
            self.log_test(
                "Campaign Detail Page Simulation", 
                False, 
                f"Simulation failed: {str(e)}"
            )
            return False

    def test_race_condition_scenarios(self):
        """Test 5: Test race condition scenarios that might cause loading issues"""
        print("🔍 Testing Race Condition Scenarios...")
        
        try:
            # Simulate rapid requests (like multiple useEffect calls)
            rapid_results = []
            
            print("   Making 5 rapid requests to simulate race conditions...")
            for i in range(5):
                start_time = time.time()
                response = self.session.get(f"{API_BASE}/campaigns")
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    campaigns = data.get('campaigns', [])
                    target_found = any(c.get('id') == TARGET_CAMPAIGN_ID for c in campaigns)
                    
                    rapid_results.append({
                        'request': i + 1,
                        'response_time': response_time,
                        'campaign_count': len(campaigns),
                        'target_found': target_found,
                        'success': True
                    })
                    
                    print(f"      Request {i+1}: {response_time:.3f}s, {len(campaigns)} campaigns, target: {target_found}")
                else:
                    rapid_results.append({
                        'request': i + 1,
                        'response_time': response_time,
                        'status_code': response.status_code,
                        'success': False
                    })
                    print(f"      Request {i+1}: {response_time:.3f}s, HTTP {response.status_code}")
            
            # Analyze results
            successful_requests = [r for r in rapid_results if r.get('success')]
            target_found_count = sum(1 for r in successful_requests if r.get('target_found'))
            
            consistent_results = len(set(r.get('target_found') for r in successful_requests)) <= 1
            
            self.log_test(
                "Race Condition Scenarios", 
                consistent_results and target_found_count > 0, 
                f"Rapid requests: {len(successful_requests)}/{len(rapid_results)} successful, {target_found_count} found target, consistent: {consistent_results}"
            )
            return consistent_results and target_found_count > 0
            
        except Exception as e:
            self.log_test(
                "Race Condition Scenarios", 
                False, 
                f"Test failed: {str(e)}"
            )
            return False

    def test_frontend_caching_simulation(self):
        """Test 6: Test frontend caching scenarios"""
        print("🔍 Testing Frontend Caching Scenarios...")
        
        try:
            # Test with different cache headers
            cache_scenarios = [
                {'headers': {}, 'name': 'No Cache Headers'},
                {'headers': {'Cache-Control': 'no-cache'}, 'name': 'No Cache'},
                {'headers': {'Cache-Control': 'max-age=0'}, 'name': 'Max Age 0'},
            ]
            
            cache_results = []
            
            for scenario in cache_scenarios:
                response = self.session.get(f"{API_BASE}/campaigns", headers=scenario['headers'])
                
                if response.status_code == 200:
                    data = response.json()
                    campaigns = data.get('campaigns', [])
                    target_found = any(c.get('id') == TARGET_CAMPAIGN_ID for c in campaigns)
                    
                    cache_results.append({
                        'scenario': scenario['name'],
                        'campaign_count': len(campaigns),
                        'target_found': target_found,
                        'success': True
                    })
                    
                    print(f"   {scenario['name']}: {len(campaigns)} campaigns, target found: {target_found}")
                else:
                    cache_results.append({
                        'scenario': scenario['name'],
                        'status_code': response.status_code,
                        'success': False
                    })
                    print(f"   {scenario['name']}: HTTP {response.status_code}")
            
            successful_scenarios = [r for r in cache_results if r.get('success')]
            all_found_target = all(r.get('target_found') for r in successful_scenarios)
            
            self.log_test(
                "Frontend Caching Scenarios", 
                all_found_target, 
                f"Cache scenarios: {cache_results}. All found target: {all_found_target}"
            )
            return all_found_target
            
        except Exception as e:
            self.log_test(
                "Frontend Caching Scenarios", 
                False, 
                f"Test failed: {str(e)}"
            )
            return False

    def run_all_tests(self):
        """Run all creator campaign access tests"""
        print("🚀 CREATOR CAMPAIGN ACCESS TESTING")
        print("=" * 70)
        print(f"Testing against: {BASE_URL}")
        print(f"Target Campaign ID: {TARGET_CAMPAIGN_ID}")
        print("Focus: Authentication, permissions, and access issues")
        print("=" * 70)
        
        # Run all tests
        tests = [
            ("Unauthenticated Access", self.test_unauthenticated_campaign_access),
            ("Campaign Visibility Rules", self.test_campaign_visibility_rules),
            ("Creator-Specific Endpoints", self.test_creator_specific_endpoints),
            ("Campaign Detail Page Simulation", self.test_campaign_detail_page_simulation),
            ("Race Condition Scenarios", self.test_race_condition_scenarios),
            ("Frontend Caching Scenarios", self.test_frontend_caching_simulation)
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
        print("📊 CREATOR CAMPAIGN ACCESS SUMMARY")
        print("=" * 70)
        
        success_rate = (passed / total) * 100
        print(f"Tests Passed: {passed}/{total} ({success_rate:.1f}%)")
        
        # Analysis
        print(f"\n🎯 ACCESS ISSUE ANALYSIS:")
        
        if success_rate >= 80:
            print(f"   ✅ Campaign is accessible and should work correctly")
            print(f"   🤔 If user still sees 'Campaign not found', possible causes:")
            print(f"      - Browser caching issues (try hard refresh)")
            print(f"      - Temporary network issues")
            print(f"      - Frontend state management issues")
            print(f"      - Race conditions during page load")
        elif success_rate >= 50:
            print(f"   ⚠️  Some access issues detected")
            print(f"   🔍 Check authentication and permission settings")
        else:
            print(f"   ❌ Significant access issues found")
            print(f"   🚨 Campaign may not be accessible to creators")
        
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
    print("🔧 Starting Creator Campaign Access Testing...")
    print("📋 This test investigates access and permission issues:")
    print("   - Authentication requirements")
    print("   - Campaign visibility rules")
    print("   - Creator-specific access patterns")
    print("   - Race conditions and caching issues")
    print()
    
    tester = CreatorCampaignAccessTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Creator campaign access testing completed - see analysis above")
        sys.exit(0)
    else:
        print("\n❌ Creator campaign access testing found issues")
        sys.exit(1)

if __name__ == "__main__":
    main()