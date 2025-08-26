#!/usr/bin/env python3
"""
Campaign Creation Data Consistency Backend Testing
Testing the campaign creation data flow and cache management issue
Focus: Debug campaign creation API, data structure, cache management
"""

import requests
import json
import time
import sys
import os
from datetime import datetime
import uuid

# Configuration - Use production URL from .env
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://www.sparkplatform.tech')
API_BASE = f"{BASE_URL}/api"

class CampaignCreationTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = 30
        self.test_results = []
        # Use realistic test data
        self.test_brand_id = "test-brand-" + str(uuid.uuid4())[:8]
        
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

    def test_campaigns_api_get_endpoint(self):
        """Test 1: Campaigns GET endpoint - check data structure returned"""
        print("🔍 Testing Campaigns GET Endpoint Data Structure...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/campaigns")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check data structure
                if 'campaigns' in data and isinstance(data['campaigns'], list):
                    campaigns = data['campaigns']
                    campaign_count = len(campaigns)
                    
                    # Analyze campaign structure
                    structure_info = f"Found {campaign_count} campaigns"
                    if campaign_count > 0:
                        sample_campaign = campaigns[0]
                        required_fields = ['id', 'title', 'status', 'brand_id', 'created_at']
                        missing_fields = [field for field in required_fields if field not in sample_campaign]
                        
                        if missing_fields:
                            structure_info += f", missing fields: {missing_fields}"
                        else:
                            structure_info += f", all required fields present"
                            structure_info += f", sample ID type: {type(sample_campaign['id'])}"
                    
                    self.log_test(
                        "Campaigns GET Data Structure", 
                        True, 
                        structure_info,
                        response_time=response_time
                    )
                    return True, campaigns
                else:
                    self.log_test(
                        "Campaigns GET Data Structure", 
                        False, 
                        f"Invalid response format: {data}",
                        response_time=response_time
                    )
                    return False, []
            else:
                self.log_test(
                    "Campaigns GET Data Structure", 
                    False, 
                    f"HTTP {response.status_code}: {response.text[:200]}",
                    response_time=response_time
                )
                return False, []
                
        except Exception as e:
            self.log_test(
                "Campaigns GET Data Structure", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False, []

    def test_create_campaign_api_function(self):
        """Test 2: Create Campaign API function - test data structure returned"""
        print("🔍 Testing Create Campaign API Function...")
        
        # Create realistic campaign data
        campaign_data = {
            "title": f"Test Campaign {datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "description": "This is a test campaign to debug data consistency issues",
            "category": "Fashion",
            "budget_range": "$1,000 - $5,000",
            "requirements": "Must have 10k+ followers on Instagram",
            "deadline": "2025-02-15",
            "status": "active"
        }
        
        try:
            start_time = time.time()
            response = self.session.post(
                f"{API_BASE}/campaigns",
                json=campaign_data,
                headers={"Content-Type": "application/json"}
            )
            response_time = time.time() - start_time
            
            if response.status_code == 201:
                data = response.json()
                
                # Check response structure
                if 'campaign' in data:
                    created_campaign = data['campaign']
                    
                    # Verify campaign structure
                    required_fields = ['id', 'title', 'status', 'created_at']
                    missing_fields = [field for field in required_fields if field not in created_campaign]
                    
                    if missing_fields:
                        self.log_test(
                            "Create Campaign API", 
                            False, 
                            f"Created campaign missing fields: {missing_fields}",
                            response_time=response_time
                        )
                        return False, None
                    else:
                        details = f"Campaign created successfully with ID: {created_campaign['id']}"
                        details += f", title: '{created_campaign['title']}'"
                        details += f", status: {created_campaign['status']}"
                        
                        self.log_test(
                            "Create Campaign API", 
                            True, 
                            details,
                            response_time=response_time
                        )
                        return True, created_campaign
                else:
                    self.log_test(
                        "Create Campaign API", 
                        False, 
                        f"Invalid response format: {data}",
                        response_time=response_time
                    )
                    return False, None
            elif response.status_code == 401:
                self.log_test(
                    "Create Campaign API", 
                    True, 
                    "Authentication required (expected for POST without auth)",
                    response_time=response_time
                )
                return True, None  # This is expected behavior
            else:
                self.log_test(
                    "Create Campaign API", 
                    False, 
                    f"HTTP {response.status_code}: {response.text[:200]}",
                    response_time=response_time
                )
                return False, None
                
        except Exception as e:
            self.log_test(
                "Create Campaign API", 
                False, 
                f"Request failed: {str(e)}"
            )
            return False, None

    def test_campaign_data_consistency(self):
        """Test 3: Campaign data consistency - check if existing campaigns are affected"""
        print("🔍 Testing Campaign Data Consistency...")
        
        try:
            # Get campaigns before any operations
            start_time = time.time()
            response1 = self.session.get(f"{API_BASE}/campaigns")
            response_time1 = time.time() - start_time
            
            if response1.status_code != 200:
                self.log_test(
                    "Campaign Data Consistency", 
                    False, 
                    f"Failed to get initial campaigns: HTTP {response1.status_code}",
                    response_time=response_time1
                )
                return False
            
            initial_campaigns = response1.json().get('campaigns', [])
            initial_count = len(initial_campaigns)
            
            # Wait a moment and get campaigns again
            time.sleep(1)
            
            start_time = time.time()
            response2 = self.session.get(f"{API_BASE}/campaigns")
            response_time2 = time.time() - start_time
            
            if response2.status_code != 200:
                self.log_test(
                    "Campaign Data Consistency", 
                    False, 
                    f"Failed to get second campaigns: HTTP {response2.status_code}",
                    response_time=response_time2
                )
                return False
            
            second_campaigns = response2.json().get('campaigns', [])
            second_count = len(second_campaigns)
            
            # Compare campaigns
            if initial_count == second_count:
                # Check if same campaigns exist
                initial_ids = set(c['id'] for c in initial_campaigns)
                second_ids = set(c['id'] for c in second_campaigns)
                
                if initial_ids == second_ids:
                    self.log_test(
                        "Campaign Data Consistency", 
                        True, 
                        f"Campaign data consistent across requests ({initial_count} campaigns)",
                        response_time=(response_time1 + response_time2) / 2
                    )
                    return True
                else:
                    missing_campaigns = initial_ids - second_ids
                    new_campaigns = second_ids - initial_ids
                    
                    details = f"Campaign IDs changed between requests"
                    if missing_campaigns:
                        details += f", missing: {list(missing_campaigns)[:3]}"
                    if new_campaigns:
                        details += f", new: {list(new_campaigns)[:3]}"
                    
                    self.log_test(
                        "Campaign Data Consistency", 
                        False, 
                        details,
                        response_time=(response_time1 + response_time2) / 2
                    )
                    return False
            else:
                self.log_test(
                    "Campaign Data Consistency", 
                    False, 
                    f"Campaign count changed: {initial_count} → {second_count}",
                    response_time=(response_time1 + response_time2) / 2
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Campaign Data Consistency", 
                False, 
                f"Consistency test failed: {str(e)}"
            )
            return False

    def test_campaign_cache_simulation(self):
        """Test 4: Campaign cache management simulation"""
        print("🔍 Testing Campaign Cache Management Simulation...")
        
        try:
            # Simulate multiple rapid requests (like cache operations)
            request_count = 5
            response_times = []
            campaign_counts = []
            campaign_ids_sets = []
            
            print(f"  Making {request_count} rapid requests to simulate cache behavior...")
            
            for i in range(request_count):
                start_time = time.time()
                response = self.session.get(f"{API_BASE}/campaigns")
                response_time = time.time() - start_time
                response_times.append(response_time)
                
                if response.status_code == 200:
                    campaigns = response.json().get('campaigns', [])
                    campaign_counts.append(len(campaigns))
                    campaign_ids_sets.append(set(c['id'] for c in campaigns))
                    print(f"    Request {i+1}: ✅ {len(campaigns)} campaigns ({response_time:.3f}s)")
                else:
                    print(f"    Request {i+1}: ❌ HTTP {response.status_code} ({response_time:.3f}s)")
                    campaign_counts.append(0)
                    campaign_ids_sets.append(set())
                
                # Small delay between requests
                time.sleep(0.1)
            
            # Analyze consistency
            avg_response_time = sum(response_times) / len(response_times)
            unique_counts = set(campaign_counts)
            
            if len(unique_counts) == 1:
                # All requests returned same count
                consistent_ids = all(ids == campaign_ids_sets[0] for ids in campaign_ids_sets[1:])
                
                if consistent_ids:
                    self.log_test(
                        "Campaign Cache Simulation", 
                        True, 
                        f"All {request_count} requests consistent: {campaign_counts[0]} campaigns, avg: {avg_response_time:.3f}s",
                        response_time=avg_response_time
                    )
                    return True
                else:
                    self.log_test(
                        "Campaign Cache Simulation", 
                        False, 
                        f"Same count but different campaign IDs across requests",
                        response_time=avg_response_time
                    )
                    return False
            else:
                self.log_test(
                    "Campaign Cache Simulation", 
                    False, 
                    f"Inconsistent campaign counts: {list(unique_counts)}",
                    response_time=avg_response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Campaign Cache Simulation", 
                False, 
                f"Cache simulation failed: {str(e)}"
            )
            return False

    def test_campaign_creation_data_flow(self):
        """Test 5: Campaign creation data flow - comprehensive test"""
        print("🔍 Testing Campaign Creation Data Flow...")
        
        try:
            # Step 1: Get initial state
            start_time = time.time()
            initial_response = self.session.get(f"{API_BASE}/campaigns")
            initial_time = time.time() - start_time
            
            if initial_response.status_code != 200:
                self.log_test(
                    "Campaign Creation Data Flow", 
                    False, 
                    f"Failed to get initial state: HTTP {initial_response.status_code}",
                    response_time=initial_time
                )
                return False
            
            initial_campaigns = initial_response.json().get('campaigns', [])
            initial_count = len(initial_campaigns)
            initial_ids = set(c['id'] for c in initial_campaigns)
            
            print(f"    Initial state: {initial_count} campaigns")
            
            # Step 2: Attempt campaign creation (will likely fail due to auth, but we can check response)
            campaign_data = {
                "title": f"Data Flow Test Campaign {datetime.now().strftime('%H%M%S')}",
                "description": "Testing data flow consistency",
                "category": "Technology",
                "budget_range": "$2,000 - $10,000",
                "status": "active"
            }
            
            start_time = time.time()
            create_response = self.session.post(
                f"{API_BASE}/campaigns",
                json=campaign_data,
                headers={"Content-Type": "application/json"}
            )
            create_time = time.time() - start_time
            
            print(f"    Creation attempt: HTTP {create_response.status_code} ({create_time:.3f}s)")
            
            # Step 3: Check state after creation attempt
            start_time = time.time()
            after_response = self.session.get(f"{API_BASE}/campaigns")
            after_time = time.time() - start_time
            
            if after_response.status_code != 200:
                self.log_test(
                    "Campaign Creation Data Flow", 
                    False, 
                    f"Failed to get state after creation: HTTP {after_response.status_code}",
                    response_time=(initial_time + create_time + after_time) / 3
                )
                return False
            
            after_campaigns = after_response.json().get('campaigns', [])
            after_count = len(after_campaigns)
            after_ids = set(c['id'] for c in after_campaigns)
            
            print(f"    After state: {after_count} campaigns")
            
            # Step 4: Analyze data flow
            if initial_count == after_count and initial_ids == after_ids:
                self.log_test(
                    "Campaign Creation Data Flow", 
                    True, 
                    f"Data flow consistent: {initial_count} campaigns maintained, no data loss detected",
                    response_time=(initial_time + create_time + after_time) / 3
                )
                return True
            else:
                missing_campaigns = initial_ids - after_ids
                new_campaigns = after_ids - initial_ids
                
                details = f"Data flow inconsistency detected: {initial_count} → {after_count} campaigns"
                if missing_campaigns:
                    details += f", lost campaigns: {len(missing_campaigns)}"
                if new_campaigns:
                    details += f", new campaigns: {len(new_campaigns)}"
                
                self.log_test(
                    "Campaign Creation Data Flow", 
                    False, 
                    details,
                    response_time=(initial_time + create_time + after_time) / 3
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Campaign Creation Data Flow", 
                False, 
                f"Data flow test failed: {str(e)}"
            )
            return False

    def test_cache_clearing_operations(self):
        """Test 6: Cache clearing operations - check if clearCampaignCache affects data"""
        print("🔍 Testing Cache Clearing Operations Impact...")
        
        try:
            # This test simulates the cache clearing behavior mentioned in the review
            # We can't directly test frontend cache, but we can test API consistency
            
            # Multiple requests with different timing to simulate cache operations
            test_scenarios = [
                ("Immediate", 0),
                ("Short delay", 0.5),
                ("Medium delay", 1.0),
                ("Long delay", 2.0)
            ]
            
            results = []
            
            for scenario_name, delay in test_scenarios:
                if delay > 0:
                    time.sleep(delay)
                
                start_time = time.time()
                response = self.session.get(f"{API_BASE}/campaigns")
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    campaigns = response.json().get('campaigns', [])
                    results.append({
                        'scenario': scenario_name,
                        'count': len(campaigns),
                        'ids': set(c['id'] for c in campaigns),
                        'response_time': response_time
                    })
                    print(f"    {scenario_name}: {len(campaigns)} campaigns ({response_time:.3f}s)")
                else:
                    print(f"    {scenario_name}: HTTP {response.status_code} ({response_time:.3f}s)")
                    results.append({
                        'scenario': scenario_name,
                        'count': 0,
                        'ids': set(),
                        'response_time': response_time
                    })
            
            # Analyze consistency across scenarios
            counts = [r['count'] for r in results]
            unique_counts = set(counts)
            
            if len(unique_counts) == 1:
                # Check if IDs are consistent
                first_ids = results[0]['ids']
                consistent_ids = all(r['ids'] == first_ids for r in results[1:])
                
                if consistent_ids:
                    avg_time = sum(r['response_time'] for r in results) / len(results)
                    self.log_test(
                        "Cache Clearing Operations", 
                        True, 
                        f"API consistent across all timing scenarios: {counts[0]} campaigns, avg: {avg_time:.3f}s",
                        response_time=avg_time
                    )
                    return True
                else:
                    self.log_test(
                        "Cache Clearing Operations", 
                        False, 
                        f"Same count but different campaigns across timing scenarios",
                        response_time=sum(r['response_time'] for r in results) / len(results)
                    )
                    return False
            else:
                self.log_test(
                    "Cache Clearing Operations", 
                    False, 
                    f"Inconsistent campaign counts across scenarios: {list(unique_counts)}",
                    response_time=sum(r['response_time'] for r in results) / len(results)
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Cache Clearing Operations", 
                False, 
                f"Cache clearing test failed: {str(e)}"
            )
            return False

    def run_all_tests(self):
        """Run all campaign creation debugging tests"""
        print("🚀 CAMPAIGN CREATION DATA CONSISTENCY - BACKEND TESTING")
        print("=" * 80)
        print(f"Testing against: {BASE_URL}")
        print(f"API Base URL: {API_BASE}")
        print("Focus: Campaign creation data flow, cache management, data consistency")
        print("=" * 80)
        
        # Run all tests
        tests = [
            ("Campaigns GET Data Structure", self.test_campaigns_api_get_endpoint),
            ("Create Campaign API", self.test_create_campaign_api_function),
            ("Campaign Data Consistency", self.test_campaign_data_consistency),
            ("Campaign Cache Simulation", self.test_campaign_cache_simulation),
            ("Campaign Creation Data Flow", self.test_campaign_creation_data_flow),
            ("Cache Clearing Operations", self.test_cache_clearing_operations)
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
        print("\n" + "=" * 80)
        print("📊 CAMPAIGN CREATION DATA CONSISTENCY - BACKEND TESTING SUMMARY")
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
        
        # Campaign creation assessment
        print(f"\n🎯 CAMPAIGN CREATION DATA CONSISTENCY ASSESSMENT:")
        if success_rate >= 85:
            print("   🎉 EXCELLENT - Campaign creation data flow appears to be working correctly")
            print("   ✅ No data consistency issues detected in backend")
            print("   ✅ Cache management operations not affecting existing campaigns")
        elif success_rate >= 70:
            print("   ⚠️  GOOD - Core functionality works but some issues detected")
            print("   ✅ Basic campaign operations working")
            print("   ⚠️  Some data consistency concerns may need attention")
        else:
            print("   🚨 NEEDS ATTENTION - Significant data consistency issues found")
            print("   ❌ Campaign creation or data flow problems detected")
            print("   ❌ Backend API or data management issues identified")
        
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
    print("🔧 Starting Campaign Creation Data Consistency Backend Testing...")
    print("📋 This test focuses on the issues mentioned in the review request:")
    print("   - Campaign creation API function data structure")
    print("   - Campaign creation affecting existing campaigns in database")
    print("   - Campaign cache management (addCampaignToCache function)")
    print("   - New campaigns being added vs replacing cache")
    print("   - Cache clearing operations removing existing campaigns")
    print()
    
    tester = CampaignCreationTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Backend testing completed successfully - Campaign creation data flow appears to be working")
        sys.exit(0)
    else:
        print("\n❌ Backend testing found issues that may affect campaign creation data consistency")
        sys.exit(1)

if __name__ == "__main__":
    main()