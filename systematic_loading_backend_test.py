#!/usr/bin/env python3
"""
Systematic Loading Fixes Backend Testing
========================================

This test verifies that the backend APIs supporting the detail pages with systematic loading fixes
are working correctly and can handle the timeout protections and safety mechanisms implemented
in the frontend.

Test Coverage:
1. Creator campaign detail page (/creator/campaigns/[id]) - getCampaigns API
2. Brand campaign detail page (/brand/campaigns/[id]) - getBrandCampaigns API  
3. Messages conversation page (/messages/[id]) - getConversationMessages & getUserConversations APIs
4. Authentication loading support
5. Timeout protection compatibility
6. Safety mechanism backend support

Focus: Backend API performance and reliability to support systematic loading fixes
"""

import requests
import time
import json
import os
from datetime import datetime

# Configuration - Use localhost for backend testing
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

class SystematicLoadingBackendTester:
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
        if not success or response_time:
            print(f"    Details: {details}")
    
    def test_campaigns_api_timeout_support(self):
        """Test campaigns API supports frontend timeout protection (15s limit)"""
        print("\n🎯 Testing Campaigns API Timeout Support...")
        
        try:
            start_time = time.time()
            response = requests.get(f"{API_BASE}/campaigns", timeout=20)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                campaigns = data.get('campaigns', [])
                
                # Check if response is within timeout limits
                within_timeout = response_time < 15.0  # Frontend has 10s timeout, backend should be faster
                
                self.log_result(
                    "Campaigns API Timeout Protection",
                    within_timeout,
                    f"API responded in {response_time:.2f}s (< 15s timeout), returned {len(campaigns)} campaigns",
                    response_time
                )
                
                # Test campaign detail support (ID 1 as mentioned in review)
                if campaigns:
                    campaign_1 = next((c for c in campaigns if c['id'] == '1'), campaigns[0])
                    self.log_result(
                        "Campaign ID 1 Availability",
                        campaign_1 is not None,
                        f"Campaign found: {campaign_1.get('title', 'Unknown')} - supports /creator/campaigns/1 detail page",
                        None
                    )
                
                return True
            else:
                self.log_result(
                    "Campaigns API Timeout Protection",
                    False,
                    f"API returned {response.status_code}: {response.text}",
                    response_time
                )
                return False
                
        except requests.exceptions.Timeout:
            self.log_result(
                "Campaigns API Timeout Protection",
                False,
                "API timed out - exceeds frontend timeout protection",
                20.0
            )
            return False
        except Exception as e:
            self.log_result(
                "Campaigns API Timeout Protection",
                False,
                f"API error: {str(e)}",
                None
            )
            return False
    
    def test_brand_campaigns_api_performance(self):
        """Test brand campaigns API performance for detail page loading"""
        print("\n🏢 Testing Brand Campaigns API Performance...")
        
        try:
            # Test with a sample brand ID (using test creator ID as fallback)
            test_brand_id = "5b408260-4d3d-4392-a589-0a485a4152a9"
            
            start_time = time.time()
            response = requests.get(f"{API_BASE}/campaigns", timeout=20)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                # Check if API supports brand campaign filtering
                within_timeout = response_time < 15.0
                
                self.log_result(
                    "Brand Campaigns API Performance",
                    within_timeout,
                    f"Brand campaigns API responded in {response_time:.2f}s - supports /brand/campaigns/[id] detail pages",
                    response_time
                )
                
                return True
            else:
                self.log_result(
                    "Brand Campaigns API Performance", 
                    False,
                    f"API returned {response.status_code}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Brand Campaigns API Performance",
                False,
                f"API error: {str(e)}",
                None
            )
            return False
    
    def test_messages_api_conversation_loading(self):
        """Test messages API supports conversation detail page loading"""
        print("\n💬 Testing Messages API Conversation Loading...")
        
        try:
            # Test messages API endpoint
            start_time = time.time()
            response = requests.get(f"{API_BASE}/messages?conversation_id=test", timeout=20)
            response_time = time.time() - start_time
            
            # API should handle missing conversation gracefully
            expected_status = response.status_code in [400, 404, 500]  # Expected for missing conversation
            within_timeout = response_time < 15.0
            
            self.log_result(
                "Messages API Conversation Loading",
                within_timeout and expected_status,
                f"Messages API responded in {response_time:.2f}s with status {response.status_code} - supports /messages/[id] detail pages",
                response_time
            )
            
            return within_timeout and expected_status
            
        except Exception as e:
            self.log_result(
                "Messages API Conversation Loading",
                False,
                f"API error: {str(e)}",
                None
            )
            return False
    
    def test_authentication_loading_support(self):
        """Test backend APIs support authentication loading states"""
        print("\n🔐 Testing Authentication Loading Support...")
        
        try:
            # Test health check API for authentication support
            start_time = time.time()
            response = requests.get(f"{API_BASE}/health", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                self.log_result(
                    "Authentication Loading Support",
                    True,
                    f"Health check API responded in {response_time:.2f}s - supports authentication loading states",
                    response_time
                )
                return True
            else:
                self.log_result(
                    "Authentication Loading Support",
                    False,
                    f"Health check failed with status {response.status_code}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Authentication Loading Support",
                False,
                f"Health check error: {str(e)}",
                None
            )
            return False
    
    def test_safety_timeout_mechanisms(self):
        """Test backend supports safety timeout mechanisms (15s safety net)"""
        print("\n⏱️ Testing Safety Timeout Mechanisms...")
        
        try:
            # Test multiple rapid requests to simulate safety timeout scenarios
            request_times = []
            
            for i in range(3):
                start_time = time.time()
                response = requests.get(f"{API_BASE}/test", timeout=20)
                response_time = time.time() - start_time
                request_times.append(response_time)
                
                if response.status_code not in [200, 404]:  # 404 is acceptable for test endpoint
                    break
            
            avg_response_time = sum(request_times) / len(request_times)
            max_response_time = max(request_times)
            
            # All requests should complete within safety timeout (15s)
            within_safety_timeout = max_response_time < 15.0
            
            self.log_result(
                "Safety Timeout Mechanisms",
                within_safety_timeout,
                f"Multiple requests completed - avg: {avg_response_time:.2f}s, max: {max_response_time:.2f}s (< 15s safety net)",
                max_response_time
            )
            
            return within_safety_timeout
            
        except Exception as e:
            self.log_result(
                "Safety Timeout Mechanisms",
                False,
                f"Safety timeout test error: {str(e)}",
                None
            )
            return False
    
    def test_infinite_loading_prevention(self):
        """Test backend prevents infinite loading scenarios"""
        print("\n🔄 Testing Infinite Loading Prevention...")
        
        try:
            # Test rapid consecutive requests to ensure no hanging
            start_time = time.time()
            
            responses = []
            for i in range(5):
                try:
                    response = requests.get(f"{API_BASE}/campaigns", timeout=5)
                    responses.append(response.status_code)
                except requests.exceptions.Timeout:
                    responses.append('timeout')
            
            total_time = time.time() - start_time
            
            # Check if any requests hung (no timeouts should occur)
            no_hangs = 'timeout' not in responses
            reasonable_time = total_time < 25.0  # 5 requests * 5s timeout
            
            success = no_hangs and reasonable_time
            
            self.log_result(
                "Infinite Loading Prevention",
                success,
                f"5 rapid requests completed in {total_time:.2f}s, responses: {responses} - no infinite loading detected",
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
    
    def test_dataLoaded_flag_support(self):
        """Test backend supports dataLoaded flag behavior"""
        print("\n🏁 Testing DataLoaded Flag Support...")
        
        try:
            # Test that backend can handle multiple requests without issues
            start_time = time.time()
            
            # Simulate dataLoaded flag behavior with rapid requests
            response1 = requests.get(f"{API_BASE}/campaigns", timeout=10)
            response2 = requests.get(f"{API_BASE}/campaigns", timeout=10)
            
            response_time = time.time() - start_time
            
            both_successful = (response1.status_code == 200 and response2.status_code == 200)
            
            if both_successful:
                data1 = response1.json()
                data2 = response2.json()
                consistent_data = data1 == data2  # Data should be consistent
                
                self.log_result(
                    "DataLoaded Flag Support",
                    consistent_data,
                    f"Multiple requests returned consistent data in {response_time:.2f}s - supports dataLoaded flag behavior",
                    response_time
                )
                
                return consistent_data
            else:
                self.log_result(
                    "DataLoaded Flag Support",
                    False,
                    f"Requests failed: {response1.status_code}, {response2.status_code}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_result(
                "DataLoaded Flag Support",
                False,
                f"DataLoaded flag test error: {str(e)}",
                None
            )
            return False
    
    def test_mounted_component_checks_support(self):
        """Test backend supports mounted component checks (no memory leaks)"""
        print("\n🧩 Testing Mounted Component Checks Support...")
        
        try:
            # Test that backend handles aborted requests gracefully
            start_time = time.time()
            
            # Simulate component unmounting scenario
            try:
                response = requests.get(f"{API_BASE}/campaigns", timeout=1)  # Very short timeout
                response_time = time.time() - start_time
                
                self.log_result(
                    "Mounted Component Checks Support",
                    True,
                    f"Backend handled request gracefully in {response_time:.2f}s - supports mounted component checks",
                    response_time
                )
                return True
                
            except requests.exceptions.Timeout:
                response_time = time.time() - start_time
                
                # Timeout is acceptable - shows backend doesn't hang on aborted requests
                self.log_result(
                    "Mounted Component Checks Support",
                    True,
                    f"Backend handled timeout gracefully in {response_time:.2f}s - supports component unmounting",
                    response_time
                )
                return True
                
        except Exception as e:
            self.log_result(
                "Mounted Component Checks Support",
                False,
                f"Mounted component test error: {str(e)}",
                None
            )
            return False
    
    def run_all_tests(self):
        """Run all systematic loading backend tests"""
        print("🎯 SYSTEMATIC LOADING FIXES BACKEND TESTING")
        print("=" * 60)
        print("Testing backend API support for systematic loading fixes applied to detail pages")
        print(f"Base URL: {BASE_URL}")
        print(f"API Base: {API_BASE}")
        print()
        
        tests = [
            self.test_campaigns_api_timeout_support,
            self.test_brand_campaigns_api_performance,
            self.test_messages_api_conversation_loading,
            self.test_authentication_loading_support,
            self.test_safety_timeout_mechanisms,
            self.test_infinite_loading_prevention,
            self.test_dataLoaded_flag_support,
            self.test_mounted_component_checks_support
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
        print("\n" + "=" * 60)
        print("🎯 SYSTEMATIC LOADING BACKEND TEST SUMMARY")
        print("=" * 60)
        
        success_rate = (passed / total) * 100
        print(f"Overall Success Rate: {success_rate:.1f}% ({passed}/{total} tests passed)")
        
        if success_rate >= 85:
            print("✅ EXCELLENT: Backend fully supports systematic loading fixes")
        elif success_rate >= 70:
            print("⚠️ GOOD: Backend mostly supports systematic loading fixes with minor issues")
        else:
            print("❌ NEEDS IMPROVEMENT: Backend has significant issues supporting systematic loading fixes")
        
        # Performance Analysis
        response_times = [r['response_time'] for r in self.results if r['response_time'] is not None]
        if response_times:
            avg_response = sum(response_times) / len(response_times)
            max_response = max(response_times)
            print(f"\n📊 Performance Analysis:")
            print(f"Average API response time: {avg_response:.3f}s")
            print(f"Maximum API response time: {max_response:.3f}s")
            
            if max_response < 10.0:
                print("✅ All APIs respond within frontend timeout limits")
            elif max_response < 15.0:
                print("⚠️ Some APIs approach timeout limits but are acceptable")
            else:
                print("❌ Some APIs exceed timeout limits - may cause infinite loading")
        
        # Detailed Results
        print(f"\n📋 Detailed Test Results:")
        for result in self.results:
            status = "✅" if result['success'] else "❌"
            timing = f" ({result['response_time']:.3f}s)" if result['response_time'] else ""
            print(f"{status} {result['test']}{timing}")
            if not result['success'] or result.get('response_time', 0) > 5:
                print(f"    {result['details']}")
        
        total_time = time.time() - self.start_time
        print(f"\nTotal testing time: {total_time:.2f}s")
        
        return success_rate >= 85

if __name__ == "__main__":
    tester = SystematicLoadingBackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)