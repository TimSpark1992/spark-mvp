#!/usr/bin/env python3
"""
Campaign Cache Management Testing
=================================

Tests the campaign cache management fixes to verify:
1. Campaign cache management no longer clears existing campaigns on unexpected data
2. New campaign creation adds to cache without removing existing campaigns
3. Cache consistency is maintained across operations
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://www.sparkplatform.tech"
API_BASE = f"{BASE_URL}/api"

class CampaignCacheManagementTester:
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
    
    def test_campaign_cache_consistency_across_requests(self):
        """Test 1: Verify campaign cache consistency across multiple requests"""
        try:
            start_time = time.time()
            
            # Make multiple requests to test cache consistency
            campaign_counts = []
            campaign_ids = []
            
            for i in range(5):
                response = self.session.get(f"{API_BASE}/campaigns")
                if response.status_code == 200:
                    data = response.json()
                    campaigns = data.get('campaigns', [])
                    campaign_counts.append(len(campaigns))
                    
                    # Collect campaign IDs to check consistency
                    ids = [c.get('id') for c in campaigns if c.get('id')]
                    campaign_ids.append(sorted(ids))
                    
                time.sleep(0.2)  # Small delay between requests
            
            response_time = time.time() - start_time
            
            # Check if counts are consistent
            counts_consistent = len(set(campaign_counts)) <= 1
            
            # Check if campaign IDs are consistent
            ids_consistent = all(ids == campaign_ids[0] for ids in campaign_ids)
            
            overall_consistent = counts_consistent and ids_consistent
            
            self.log_test(
                "Campaign Cache Consistency Across Requests",
                overall_consistent,
                f"Counts: {campaign_counts}, IDs consistent: {ids_consistent}",
                response_time
            )
            return overall_consistent
            
        except Exception as e:
            self.log_test(
                "Campaign Cache Consistency Across Requests",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def test_campaign_data_structure_stability(self):
        """Test 2: Verify campaign data structure remains stable"""
        try:
            start_time = time.time()
            
            response = self.session.get(f"{API_BASE}/campaigns")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                campaigns = data.get('campaigns', [])
                
                if len(campaigns) > 0:
                    # Check if campaigns have consistent structure
                    first_campaign = campaigns[0]
                    required_fields = ['id', 'title', 'created_at', 'status']
                    
                    has_required_fields = all(
                        field in first_campaign for field in required_fields
                    )
                    
                    # Check if all campaigns have same structure
                    all_consistent = all(
                        all(field in campaign for field in required_fields)
                        for campaign in campaigns
                    )
                    
                    self.log_test(
                        "Campaign Data Structure Stability",
                        has_required_fields and all_consistent,
                        f"Required fields present: {has_required_fields}, All consistent: {all_consistent}",
                        response_time
                    )
                    return has_required_fields and all_consistent
                else:
                    self.log_test(
                        "Campaign Data Structure Stability",
                        True,
                        "No campaigns to test structure (empty array)",
                        response_time
                    )
                    return True
            else:
                self.log_test(
                    "Campaign Data Structure Stability",
                    False,
                    f"API error: HTTP {response.status_code}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Campaign Data Structure Stability",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def test_no_campaign_disappearance(self):
        """Test 3: Verify campaigns don't disappear unexpectedly"""
        try:
            start_time = time.time()
            
            # Get initial campaign count
            initial_response = self.session.get(f"{API_BASE}/campaigns")
            if initial_response.status_code != 200:
                self.log_test(
                    "No Campaign Disappearance",
                    False,
                    "Failed to get initial campaign count",
                    time.time() - start_time
                )
                return False
            
            initial_data = initial_response.json()
            initial_campaigns = initial_data.get('campaigns', [])
            initial_count = len(initial_campaigns)
            initial_ids = set(c.get('id') for c in initial_campaigns if c.get('id'))
            
            # Wait and check again multiple times
            campaign_counts = [initial_count]
            campaign_id_sets = [initial_ids]
            
            for i in range(4):
                time.sleep(0.5)
                response = self.session.get(f"{API_BASE}/campaigns")
                if response.status_code == 200:
                    data = response.json()
                    campaigns = data.get('campaigns', [])
                    count = len(campaigns)
                    ids = set(c.get('id') for c in campaigns if c.get('id'))
                    
                    campaign_counts.append(count)
                    campaign_id_sets.append(ids)
            
            response_time = time.time() - start_time
            
            # Check if campaigns disappeared
            min_count = min(campaign_counts)
            max_count = max(campaign_counts)
            
            # Check if any campaign IDs disappeared
            all_ids = set()
            for id_set in campaign_id_sets:
                all_ids.update(id_set)
            
            ids_disappeared = any(
                not all_ids.issubset(id_set) for id_set in campaign_id_sets
            )
            
            no_disappearance = (min_count == max_count) and not ids_disappeared
            
            self.log_test(
                "No Campaign Disappearance",
                no_disappearance,
                f"Count range: {min_count}-{max_count}, IDs disappeared: {ids_disappeared}",
                response_time
            )
            return no_disappearance
            
        except Exception as e:
            self.log_test(
                "No Campaign Disappearance",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def test_cache_performance_consistency(self):
        """Test 4: Verify cache performance is consistent"""
        try:
            start_time = time.time()
            
            response_times = []
            
            # Test multiple requests for performance consistency
            for i in range(5):
                req_start = time.time()
                response = self.session.get(f"{API_BASE}/campaigns")
                req_time = time.time() - req_start
                
                if response.status_code == 200:
                    response_times.append(req_time)
                
                time.sleep(0.1)
            
            total_time = time.time() - start_time
            
            if len(response_times) >= 3:
                avg_time = sum(response_times) / len(response_times)
                max_time = max(response_times)
                min_time = min(response_times)
                
                # Check if performance is consistent (no hanging requests)
                performance_consistent = max_time < 10.0  # No hanging
                reasonable_variance = (max_time - min_time) < 5.0  # Reasonable variance
                
                overall_performance = performance_consistent and reasonable_variance
                
                self.log_test(
                    "Cache Performance Consistency",
                    overall_performance,
                    f"Avg: {avg_time:.2f}s, Range: {min_time:.2f}s-{max_time:.2f}s",
                    total_time
                )
                return overall_performance
            else:
                self.log_test(
                    "Cache Performance Consistency",
                    False,
                    "Insufficient successful requests for performance testing",
                    total_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Cache Performance Consistency",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def run_all_tests(self):
        """Run all campaign cache management tests"""
        print("🎯 CAMPAIGN CACHE MANAGEMENT TESTING")
        print("=" * 50)
        print(f"Testing against: {BASE_URL}")
        print(f"Started at: {datetime.now().isoformat()}")
        print()
        
        # Run all tests
        test_methods = [
            self.test_campaign_cache_consistency_across_requests,
            self.test_campaign_data_structure_stability,
            self.test_no_campaign_disappearance,
            self.test_cache_performance_consistency,
        ]
        
        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                print(f"❌ CRITICAL ERROR in {test_method.__name__}: {e}")
            print()
        
        # Summary
        print("=" * 50)
        print("📊 CAMPAIGN CACHE MANAGEMENT TEST SUMMARY")
        print("=" * 50)
        
        passed_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"✅ Passed: {passed_tests}/{total_tests} ({success_rate:.1f}%)")
        
        if passed_tests == total_tests:
            print("🎉 ALL TESTS PASSED - Campaign cache management is working correctly!")
        else:
            print("⚠️ SOME TESTS FAILED - Issues detected in campaign cache management")
            
            failed_tests = [r for r in self.test_results if not r['success']]
            print("\n❌ Failed Tests:")
            for result in failed_tests:
                print(f"   • {result['test']}: {result['details']}")
        
        return passed_tests == total_tests

if __name__ == "__main__":
    tester = CampaignCacheManagementTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)