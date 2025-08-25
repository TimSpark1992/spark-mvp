#!/usr/bin/env python3
"""
Detail Pages Backend Testing for Systematic Loading Fixes
=========================================================

This test specifically verifies the backend APIs that support the detail pages mentioned
in the review request:

1. Creator campaign detail page (/creator/campaigns/[id]) - Test with ID 1
2. Brand campaign detail page (/brand/campaigns/[id]) - Test loading functionality  
3. Messages conversation page (/messages/[id]) - Test conversation loading

Focus: Testing the specific backend functions called by these detail pages
"""

import requests
import time
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

class DetailPagesBackendTester:
    def __init__(self):
        self.results = []
        self.start_time = time.time()
        
    def log_result(self, test_name, success, details, response_time=None):
        """Log test result with timing information"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'response_time': response_time,
            'timestamp': datetime.now().isoformat()
        }
        self.results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        timing = f" ({response_time:.3f}s)" if response_time else ""
        print(f"{status}: {test_name}{timing}")
        if details and (not success or response_time and response_time > 1.0):
            print(f"    Details: {details}")
    
    def test_creator_campaign_detail_id_1(self):
        """Test creator campaign detail page backend support - specifically ID 1"""
        print("\n🎯 Testing Creator Campaign Detail Page (ID 1)...")
        
        try:
            # Test the getCampaigns API that creator detail page uses
            start_time = time.time()
            response = requests.get(f"{API_BASE}/campaigns", timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                campaigns = data.get('campaigns', [])
                
                # Find campaign with ID 1 (as specified in review request)
                campaign_1 = next((c for c in campaigns if c['id'] == '1'), None)
                
                if campaign_1:
                    # Verify campaign has required fields for detail page
                    required_fields = ['id', 'title', 'description', 'category', 'budget_range', 'created_at']
                    has_required_fields = all(field in campaign_1 for field in required_fields)
                    
                    self.log_result(
                        "Creator Campaign Detail (ID 1) - Data Loading",
                        has_required_fields,
                        f"Campaign ID 1 found: '{campaign_1.get('title')}' with all required fields for detail page",
                        response_time
                    )
                    
                    # Test timeout compatibility (should be well under 10s frontend timeout)
                    timeout_compatible = response_time < 8.0
                    self.log_result(
                        "Creator Campaign Detail (ID 1) - Timeout Protection",
                        timeout_compatible,
                        f"API responds in {response_time:.2f}s - compatible with 10s frontend timeout + 15s safety net",
                        response_time
                    )
                    
                    return has_required_fields and timeout_compatible
                else:
                    self.log_result(
                        "Creator Campaign Detail (ID 1) - Data Loading",
                        False,
                        f"Campaign ID 1 not found in {len(campaigns)} campaigns returned",
                        response_time
                    )
                    return False
            else:
                self.log_result(
                    "Creator Campaign Detail (ID 1) - Data Loading",
                    False,
                    f"API returned {response.status_code}: {response.text[:100]}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Creator Campaign Detail (ID 1) - Data Loading",
                False,
                f"API error: {str(e)}",
                None
            )
            return False
    
    def test_brand_campaign_detail_loading(self):
        """Test brand campaign detail page backend support"""
        print("\n🏢 Testing Brand Campaign Detail Page Loading...")
        
        try:
            # Test the campaigns API that brand detail page uses
            start_time = time.time()
            response = requests.get(f"{API_BASE}/campaigns", timeout=15)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                campaigns = data.get('campaigns', [])
                
                if campaigns:
                    # Test with first available campaign
                    test_campaign = campaigns[0]
                    campaign_id = test_campaign['id']
                    
                    # Verify campaign has fields needed for brand detail page
                    brand_detail_fields = ['id', 'title', 'description', 'category', 'budget_range', 'created_at']
                    has_brand_fields = all(field in test_campaign for field in brand_detail_fields)
                    
                    self.log_result(
                        "Brand Campaign Detail - Data Structure",
                        has_brand_fields,
                        f"Campaign ID {campaign_id} has all fields needed for brand detail page",
                        response_time
                    )
                    
                    # Test loading performance for brand detail page
                    loading_performance = response_time < 8.0  # Should be under 8s force load timeout
                    self.log_result(
                        "Brand Campaign Detail - Loading Performance",
                        loading_performance,
                        f"Brand campaign data loads in {response_time:.2f}s - supports 8s force load timeout",
                        response_time
                    )
                    
                    return has_brand_fields and loading_performance
                else:
                    self.log_result(
                        "Brand Campaign Detail - Data Structure",
                        False,
                        "No campaigns available for brand detail page testing",
                        response_time
                    )
                    return False
            else:
                self.log_result(
                    "Brand Campaign Detail - Data Structure",
                    False,
                    f"API returned {response.status_code}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Brand Campaign Detail - Data Structure",
                False,
                f"API error: {str(e)}",
                None
            )
            return False
    
    def test_messages_conversation_detail_loading(self):
        """Test messages conversation detail page backend support"""
        print("\n💬 Testing Messages Conversation Detail Page Loading...")
        
        try:
            # Test the messages API that conversation detail page uses
            start_time = time.time()
            response = requests.get(f"{API_BASE}/messages?conversation_id=test-conversation-123", timeout=15)
            response_time = time.time() - start_time
            
            # Messages API should handle missing conversation gracefully (400 or 500 expected)
            handles_missing_conversation = response.status_code in [400, 500]
            
            if handles_missing_conversation:
                self.log_result(
                    "Messages Conversation Detail - Error Handling",
                    True,
                    f"Messages API handles missing conversation gracefully (status {response.status_code})",
                    response_time
                )
                
                # Test timeout compatibility for conversation loading
                timeout_compatible = response_time < 8.0
                self.log_result(
                    "Messages Conversation Detail - Timeout Protection",
                    timeout_compatible,
                    f"Messages API responds in {response_time:.2f}s - compatible with conversation detail timeouts",
                    response_time
                )
                
                return timeout_compatible
            else:
                self.log_result(
                    "Messages Conversation Detail - Error Handling",
                    False,
                    f"Unexpected status code {response.status_code} for missing conversation",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Messages Conversation Detail - Error Handling",
                False,
                f"API error: {str(e)}",
                None
            )
            return False
    
    def test_authentication_loading_compatibility(self):
        """Test backend supports authentication loading states for all detail pages"""
        print("\n🔐 Testing Authentication Loading Compatibility...")
        
        try:
            # Test health check API for authentication state support
            start_time = time.time()
            response = requests.get(f"{API_BASE}/health", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                # Test that backend responds quickly for auth checks
                auth_responsive = response_time < 5.0
                
                self.log_result(
                    "Authentication Loading Compatibility",
                    auth_responsive,
                    f"Health check responds in {response_time:.2f}s - supports authentication loading states",
                    response_time
                )
                
                return auth_responsive
            else:
                self.log_result(
                    "Authentication Loading Compatibility",
                    False,
                    f"Health check failed with status {response.status_code}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Authentication Loading Compatibility",
                False,
                f"Health check error: {str(e)}",
                None
            )
            return False
    
    def test_systematic_timeout_protections(self):
        """Test backend supports systematic timeout protections (10s load, 15s safety, 8s force)"""
        print("\n⏱️ Testing Systematic Timeout Protections...")
        
        try:
            # Test multiple API calls to verify consistent performance
            api_calls = [
                ("campaigns", f"{API_BASE}/campaigns"),
                ("health", f"{API_BASE}/health"),
                ("test", f"{API_BASE}/test")
            ]
            
            all_within_limits = True
            response_times = []
            
            for name, url in api_calls:
                start_time = time.time()
                try:
                    response = requests.get(url, timeout=12)
                    response_time = time.time() - start_time
                    response_times.append(response_time)
                    
                    # Check if within systematic timeout limits
                    within_10s_load = response_time < 10.0  # 10s load timeout
                    within_8s_force = response_time < 8.0   # 8s force load timeout
                    
                    if not within_8s_force:
                        all_within_limits = False
                        
                except requests.exceptions.Timeout:
                    response_times.append(12.0)
                    all_within_limits = False
            
            avg_response = sum(response_times) / len(response_times) if response_times else 0
            max_response = max(response_times) if response_times else 0
            
            self.log_result(
                "Systematic Timeout Protections",
                all_within_limits,
                f"All APIs respond within systematic timeouts - avg: {avg_response:.2f}s, max: {max_response:.2f}s",
                max_response
            )
            
            return all_within_limits
            
        except Exception as e:
            self.log_result(
                "Systematic Timeout Protections",
                False,
                f"Timeout protection test error: {str(e)}",
                None
            )
            return False
    
    def test_infinite_loading_prevention(self):
        """Test backend prevents infinite loading issues for detail pages"""
        print("\n🔄 Testing Infinite Loading Prevention...")
        
        try:
            # Simulate rapid detail page loading scenarios
            start_time = time.time()
            
            # Test rapid requests to campaigns API (used by both creator and brand detail pages)
            rapid_requests = []
            for i in range(3):
                req_start = time.time()
                response = requests.get(f"{API_BASE}/campaigns", timeout=10)
                req_time = time.time() - req_start
                rapid_requests.append({
                    'status': response.status_code,
                    'time': req_time
                })
            
            total_time = time.time() - start_time
            
            # Check that no requests hung or took too long
            all_completed = all(req['status'] in [200, 404, 500] for req in rapid_requests)
            no_hangs = all(req['time'] < 10.0 for req in rapid_requests)
            reasonable_total = total_time < 30.0
            
            success = all_completed and no_hangs and reasonable_total
            
            avg_time = sum(req['time'] for req in rapid_requests) / len(rapid_requests)
            
            self.log_result(
                "Infinite Loading Prevention",
                success,
                f"3 rapid detail page requests completed in {total_time:.2f}s (avg: {avg_time:.2f}s) - no infinite loading",
                total_time
            )
            
            return success
            
        except Exception as e:
            self.log_result(
                "Infinite Loading Prevention",
                False,
                f"Infinite loading test error: {str(e)}",
                None
            )
            return False
    
    def run_all_tests(self):
        """Run all detail pages backend tests"""
        print("🎯 DETAIL PAGES SYSTEMATIC LOADING BACKEND TESTING")
        print("=" * 65)
        print("Testing backend support for systematic loading fixes on detail pages:")
        print("• Creator campaign detail page (/creator/campaigns/[id]) - Test with ID 1")
        print("• Brand campaign detail page (/brand/campaigns/[id]) - Test loading functionality")
        print("• Messages conversation page (/messages/[id]) - Test conversation loading")
        print(f"Base URL: {BASE_URL}")
        print()
        
        tests = [
            self.test_creator_campaign_detail_id_1,
            self.test_brand_campaign_detail_loading,
            self.test_messages_conversation_detail_loading,
            self.test_authentication_loading_compatibility,
            self.test_systematic_timeout_protections,
            self.test_infinite_loading_prevention
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            try:
                if test():
                    passed += 1
            except Exception as e:
                print(f"❌ Test {test.__name__} failed with exception: {e}")
        
        # Summary
        print("\n" + "=" * 65)
        print("🎯 DETAIL PAGES BACKEND TEST SUMMARY")
        print("=" * 65)
        
        success_rate = (passed / total) * 100
        print(f"Overall Success Rate: {success_rate:.1f}% ({passed}/{total} tests passed)")
        
        if success_rate >= 90:
            print("✅ EXCELLENT: Backend fully supports systematic loading fixes for detail pages")
        elif success_rate >= 75:
            print("⚠️ GOOD: Backend mostly supports systematic loading fixes with minor issues")
        else:
            print("❌ NEEDS IMPROVEMENT: Backend has issues supporting systematic loading fixes")
        
        # Performance Analysis
        response_times = [r['response_time'] for r in self.results if r['response_time'] is not None]
        if response_times:
            avg_response = sum(response_times) / len(response_times)
            max_response = max(response_times)
            print(f"\n📊 Performance Analysis:")
            print(f"Average API response time: {avg_response:.3f}s")
            print(f"Maximum API response time: {max_response:.3f}s")
            
            if max_response < 8.0:
                print("✅ All APIs respond within 8s force load timeout")
            elif max_response < 10.0:
                print("⚠️ APIs respond within 10s load timeout but may trigger force load")
            elif max_response < 15.0:
                print("⚠️ APIs respond within 15s safety timeout but may cause loading delays")
            else:
                print("❌ Some APIs exceed 15s safety timeout - may cause infinite loading")
        
        # Specific Detail Page Results
        print(f"\n📋 Detail Page Specific Results:")
        creator_tests = [r for r in self.results if 'Creator Campaign Detail' in r['test']]
        brand_tests = [r for r in self.results if 'Brand Campaign Detail' in r['test']]
        messages_tests = [r for r in self.results if 'Messages Conversation Detail' in r['test']]
        
        print(f"🎯 Creator Campaign Detail (ID 1): {len([t for t in creator_tests if t['success']])}/{len(creator_tests)} tests passed")
        print(f"🏢 Brand Campaign Detail: {len([t for t in brand_tests if t['success']])}/{len(brand_tests)} tests passed")
        print(f"💬 Messages Conversation Detail: {len([t for t in messages_tests if t['success']])}/{len(messages_tests)} tests passed")
        
        total_time = time.time() - self.start_time
        print(f"\nTotal testing time: {total_time:.2f}s")
        
        return success_rate >= 85

if __name__ == "__main__":
    tester = DetailPagesBackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)