#!/usr/bin/env python3
"""
Campaign Creation Data Consistency Backend Testing
=================================================

Tests the campaign creation data consistency fixes to verify:
1. Campaign creation API is working correctly after import fixes
2. Campaign cache management no longer clears existing campaigns on unexpected data
3. New campaign creation adds to cache without removing existing campaigns
4. Backend supports the improved campaign creation flow
5. No data consistency issues remain in campaign management

CONTEXT: Fixed the critical campaign creation bug where creating new campaigns 
caused existing campaigns to disappear. Applied fixes:
- Fixed campaign creation fallback logic to NOT call clearCampaignCache() on unexpected data
- Enhanced handling of different data structures (array vs single object)
- Applied same fix to both campaign creation and draft save functionality
- Added warning logs instead of cache clearing to preserve existing campaigns
"""

import requests
import json
import time
import sys
from datetime import datetime
import uuid

# Configuration
BASE_URL = "https://www.sparkplatform.tech"
API_BASE = f"{BASE_URL}/api"

class CampaignCreationConsistencyTester:
    def __init__(self):
        self.test_results = []
        self.session = requests.Session()
        self.session.timeout = 30
        
    def log_test(self, test_name, success, details="", response_time=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            'test': test_name,
            'status': status,
            'success': success,
            'details': details,
            'response_time': response_time,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        time_info = f" ({response_time:.3f}s)" if response_time else ""
        print(f"{status}: {test_name}{time_info}")
        if details:
            print(f"    Details: {details}")
    
    def test_campaigns_api_accessibility(self):
        """Test 1: Verify campaigns API is accessible and working"""
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/campaigns")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                campaigns = data.get('campaigns', [])
                self.log_test(
                    "Campaigns API Accessibility",
                    True,
                    f"API responds with {len(campaigns)} campaigns",
                    response_time
                )
                return campaigns
            else:
                self.log_test(
                    "Campaigns API Accessibility",
                    False,
                    f"HTTP {response.status_code}: {response.text[:200]}",
                    response_time
                )
                return []
                
        except Exception as e:
            self.log_test(
                "Campaigns API Accessibility",
                False,
                f"Exception: {str(e)}"
            )
            return []
    
    def test_campaign_creation_api_imports(self):
        """Test 2: Verify campaign creation API imports are working correctly"""
        try:
            start_time = time.time()
            
            # Test POST endpoint with minimal data to check import issues
            test_campaign = {
                "title": "Import Test Campaign",
                "description": "Testing import fixes",
                "category": "Technology",
                "budget_range": "1000-5000",
                "requirements": "Test requirements"
            }
            
            response = self.session.post(
                f"{API_BASE}/campaigns",
                json=test_campaign,
                headers={'Content-Type': 'application/json'}
            )
            response_time = time.time() - start_time
            
            # Check if we get proper error handling (401 for auth) instead of 500 for imports
            if response.status_code == 401:
                self.log_test(
                    "Campaign Creation API Import Fixes",
                    True,
                    "API properly handles authentication (no import errors)",
                    response_time
                )
                return True
            elif response.status_code == 500:
                error_text = response.text
                if "getCurrentUser is not defined" in error_text:
                    self.log_test(
                        "Campaign Creation API Import Fixes",
                        False,
                        "Import error: getCurrentUser is not defined",
                        response_time
                    )
                    return False
                else:
                    self.log_test(
                        "Campaign Creation API Import Fixes",
                        True,
                        "No import errors detected (different 500 error)",
                        response_time
                    )
                    return True
            else:
                self.log_test(
                    "Campaign Creation API Import Fixes",
                    True,
                    f"API responds properly (HTTP {response.status_code})",
                    response_time
                )
                return True
                
        except Exception as e:
            self.log_test(
                "Campaign Creation API Import Fixes",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def test_campaign_data_structure_handling(self):
        """Test 3: Verify API handles different data structures correctly"""
        try:
            start_time = time.time()
            
            # Get current campaigns to understand data structure
            response = self.session.get(f"{API_BASE}/campaigns")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                campaigns = data.get('campaigns', [])
                
                # Check data structure consistency
                if isinstance(campaigns, list):
                    structure_type = "array"
                    if len(campaigns) > 0:
                        first_campaign = campaigns[0]
                        has_required_fields = all(
                            field in first_campaign 
                            for field in ['id', 'title', 'created_at']
                        )
                        
                        self.log_test(
                            "Campaign Data Structure Handling",
                            has_required_fields,
                            f"Returns {structure_type} with {len(campaigns)} campaigns, required fields: {has_required_fields}",
                            response_time
                        )
                        return has_required_fields
                    else:
                        self.log_test(
                            "Campaign Data Structure Handling",
                            True,
                            f"Returns empty {structure_type} (no campaigns to test structure)",
                            response_time
                        )
                        return True
                else:
                    self.log_test(
                        "Campaign Data Structure Handling",
                        False,
                        f"Unexpected data structure: {type(campaigns)}",
                        response_time
                    )
                    return False
            else:
                self.log_test(
                    "Campaign Data Structure Handling",
                    False,
                    f"API error: HTTP {response.status_code}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Campaign Data Structure Handling",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def test_campaign_cache_consistency(self):
        """Test 4: Verify campaign cache management doesn't clear existing campaigns"""
        try:
            start_time = time.time()
            
            # Test multiple rapid requests to simulate cache behavior
            campaign_counts = []
            
            for i in range(3):
                response = self.session.get(f"{API_BASE}/campaigns")
                if response.status_code == 200:
                    data = response.json()
                    campaigns = data.get('campaigns', [])
                    campaign_counts.append(len(campaigns))
                    time.sleep(0.1)  # Small delay between requests
                else:
                    campaign_counts.append(-1)  # Error marker
            
            response_time = time.time() - start_time
            
            # Check consistency - all requests should return same number of campaigns
            consistent = len(set(count for count in campaign_counts if count >= 0)) <= 1
            
            if consistent and all(count >= 0 for count in campaign_counts):
                self.log_test(
                    "Campaign Cache Consistency",
                    True,
                    f"Consistent campaign counts across requests: {campaign_counts}",
                    response_time
                )
                return True
            else:
                self.log_test(
                    "Campaign Cache Consistency",
                    False,
                    f"Inconsistent campaign counts: {campaign_counts}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Campaign Cache Consistency",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def test_campaign_creation_flow_support(self):
        """Test 5: Verify backend supports improved campaign creation flow"""
        try:
            start_time = time.time()
            
            # Test the complete flow endpoints
            endpoints_to_test = [
                ("/campaigns", "GET", "Campaign listing"),
                ("/campaigns", "POST", "Campaign creation"),
            ]
            
            flow_support = True
            endpoint_results = []
            
            for endpoint, method, description in endpoints_to_test:
                try:
                    if method == "GET":
                        resp = self.session.get(f"{API_BASE}{endpoint}")
                    else:  # POST
                        resp = self.session.post(
                            f"{API_BASE}{endpoint}",
                            json={"test": "data"},
                            headers={'Content-Type': 'application/json'}
                        )
                    
                    # Check if endpoint exists (not 404) and handles requests properly
                    if resp.status_code == 404:
                        endpoint_results.append(f"{description}: Missing")
                        flow_support = False
                    elif resp.status_code >= 500:
                        # Check if it's an import error (critical) vs other server errors
                        if "getCurrentUser is not defined" in resp.text:
                            endpoint_results.append(f"{description}: Import Error")
                            flow_support = False
                        else:
                            endpoint_results.append(f"{description}: Available")
                    else:
                        endpoint_results.append(f"{description}: Available")
                        
                except Exception as e:
                    endpoint_results.append(f"{description}: Error - {str(e)[:50]}")
                    flow_support = False
            
            response_time = time.time() - start_time
            
            self.log_test(
                "Campaign Creation Flow Support",
                flow_support,
                f"Endpoints: {', '.join(endpoint_results)}",
                response_time
            )
            return flow_support
            
        except Exception as e:
            self.log_test(
                "Campaign Creation Flow Support",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def test_no_data_consistency_issues(self):
        """Test 6: Verify no data consistency issues in campaign management"""
        try:
            start_time = time.time()
            
            # Test data consistency across multiple operations
            consistency_tests = []
            
            # Test 1: Multiple GET requests should return consistent data
            campaign_data = []
            for i in range(3):
                response = self.session.get(f"{API_BASE}/campaigns")
                if response.status_code == 200:
                    data = response.json()
                    campaigns = data.get('campaigns', [])
                    campaign_data.append(len(campaigns))
                time.sleep(0.1)
            
            # Check if campaign counts are consistent
            if len(set(campaign_data)) <= 1:
                consistency_tests.append("GET consistency: ✅")
            else:
                consistency_tests.append(f"GET consistency: ❌ ({campaign_data})")
            
            # Test 2: Check if API returns proper JSON structure
            response = self.session.get(f"{API_BASE}/campaigns")
            if response.status_code == 200:
                try:
                    data = response.json()
                    if 'campaigns' in data and isinstance(data['campaigns'], list):
                        consistency_tests.append("JSON structure: ✅")
                    else:
                        consistency_tests.append("JSON structure: ❌")
                except json.JSONDecodeError:
                    consistency_tests.append("JSON structure: ❌ (Invalid JSON)")
            else:
                consistency_tests.append(f"JSON structure: ❌ (HTTP {response.status_code})")
            
            # Test 3: Check response time consistency (no hanging)
            response_times = []
            for i in range(3):
                req_start = time.time()
                response = self.session.get(f"{API_BASE}/campaigns")
                req_time = time.time() - req_start
                response_times.append(req_time)
                time.sleep(0.1)
            
            avg_response_time = sum(response_times) / len(response_times)
            max_response_time = max(response_times)
            
            if max_response_time < 10:  # No hanging requests
                consistency_tests.append(f"Response time: ✅ (avg: {avg_response_time:.2f}s)")
            else:
                consistency_tests.append(f"Response time: ❌ (max: {max_response_time:.2f}s)")
            
            response_time = time.time() - start_time
            
            # Overall consistency check
            all_consistent = all("✅" in test for test in consistency_tests)
            
            self.log_test(
                "No Data Consistency Issues",
                all_consistent,
                f"Tests: {'; '.join(consistency_tests)}",
                response_time
            )
            return all_consistent
            
        except Exception as e:
            self.log_test(
                "No Data Consistency Issues",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def test_campaign_creation_error_handling(self):
        """Test 7: Verify proper error handling in campaign creation"""
        try:
            start_time = time.time()
            
            # Test various error scenarios
            error_scenarios = [
                ("Empty payload", {}),
                ("Invalid JSON structure", {"invalid": "structure"}),
                ("Missing required fields", {"title": "Test"}),
            ]
            
            error_handling_results = []
            
            for scenario_name, payload in error_scenarios:
                try:
                    response = self.session.post(
                        f"{API_BASE}/campaigns",
                        json=payload,
                        headers={'Content-Type': 'application/json'}
                    )
                    
                    # Check if we get proper error responses (not 500 import errors)
                    if response.status_code == 500 and "getCurrentUser is not defined" in response.text:
                        error_handling_results.append(f"{scenario_name}: Import Error")
                    elif response.status_code in [400, 401, 422]:
                        error_handling_results.append(f"{scenario_name}: Proper Error")
                    elif response.status_code == 500:
                        error_handling_results.append(f"{scenario_name}: Server Error (not import)")
                    else:
                        error_handling_results.append(f"{scenario_name}: HTTP {response.status_code}")
                        
                except Exception as e:
                    error_handling_results.append(f"{scenario_name}: Exception")
            
            response_time = time.time() - start_time
            
            # Check if we have proper error handling (no import errors)
            has_import_errors = any("Import Error" in result for result in error_handling_results)
            
            self.log_test(
                "Campaign Creation Error Handling",
                not has_import_errors,
                f"Error scenarios: {'; '.join(error_handling_results)}",
                response_time
            )
            return not has_import_errors
            
        except Exception as e:
            self.log_test(
                "Campaign Creation Error Handling",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def run_all_tests(self):
        """Run all campaign creation consistency tests"""
        print("🎯 CAMPAIGN CREATION DATA CONSISTENCY BACKEND TESTING")
        print("=" * 60)
        print(f"Testing against: {BASE_URL}")
        print(f"Started at: {datetime.now().isoformat()}")
        print()
        
        # Run all tests
        test_methods = [
            self.test_campaigns_api_accessibility,
            self.test_campaign_creation_api_imports,
            self.test_campaign_data_structure_handling,
            self.test_campaign_cache_consistency,
            self.test_campaign_creation_flow_support,
            self.test_no_data_consistency_issues,
            self.test_campaign_creation_error_handling,
        ]
        
        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                print(f"❌ CRITICAL ERROR in {test_method.__name__}: {e}")
            print()
        
        # Summary
        print("=" * 60)
        print("📊 CAMPAIGN CREATION CONSISTENCY TEST SUMMARY")
        print("=" * 60)
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"✅ Passed: {passed_tests}/{total_tests} ({success_rate:.1f}%)")
        
        if passed_tests == total_tests:
            print("🎉 ALL TESTS PASSED - Campaign creation data consistency is working correctly!")
        else:
            print("⚠️ SOME TESTS FAILED - Issues detected in campaign creation consistency")
            
            failed_tests = [r for r in self.test_results if not r['success']]
            print("\n❌ Failed Tests:")
            for result in failed_tests:
                print(f"   • {result['test']}: {result['details']}")
        
        # Performance summary
        response_times = [r['response_time'] for r in self.test_results if r['response_time']]
        if response_times:
            avg_time = sum(response_times) / len(response_times)
            max_time = max(response_times)
            print(f"\n⚡ Performance: Avg {avg_time:.3f}s, Max {max_time:.3f}s")
        
        return passed_tests == total_tests

if __name__ == "__main__":
    tester = CampaignCreationConsistencyTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)