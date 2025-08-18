#!/usr/bin/env python3

"""
Backend Testing Script for Rate Card Creation API
Testing the specific issues mentioned in the review request:
1. POST /api/rate-cards endpoint with valid creator data
2. Supabase createRateCard function testing
3. Database schema verification - rate_cards table
4. Authentication verification - Supabase access
5. Sample data testing matching frontend requirements
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration - Use environment URL from .env
BASE_URL = "https://www.sparkplatform.tech"
API_BASE = f"{BASE_URL}/api"

class RateCardTester:
    def __init__(self):
        self.results = []
        self.total_tests = 0
        self.passed_tests = 0
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
            
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.results.append(result)
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
    
    def test_api_endpoint(self, endpoint, method="GET", data=None, headers=None):
        """Test API endpoint with proper error handling"""
        try:
            url = f"{API_BASE}{endpoint}"
            
            if headers is None:
                headers = {'Content-Type': 'application/json'}
            
            if method == "GET":
                response = requests.get(url, timeout=10, headers=headers)
            elif method == "POST":
                response = requests.post(url, json=data, timeout=10, headers=headers)
            elif method == "PUT":
                response = requests.put(url, json=data, timeout=10, headers=headers)
            elif method == "DELETE":
                response = requests.delete(url, timeout=10, headers=headers)
            else:
                return False, f"Unsupported method: {method}", None
                
            # Check response
            if response.status_code == 200 or response.status_code == 201:
                try:
                    json_data = response.json()
                    return True, f"API successful (status: {response.status_code})", {
                        'status': response.status_code,
                        'data': json_data,
                        'response_size': len(str(json_data))
                    }
                except:
                    return True, f"API successful but non-JSON response (status: {response.status_code})", {
                        'status': response.status_code,
                        'content_type': response.headers.get('content-type', 'unknown')
                    }
            elif response.status_code == 400:
                try:
                    error_data = response.json()
                    return False, f"Bad Request - {error_data.get('error', 'Unknown error')}", {
                        'status': response.status_code,
                        'error': error_data
                    }
                except:
                    return False, f"Bad Request (status: 400)", {'status': response.status_code}
            elif response.status_code == 401:
                return False, f"Unauthorized - Authentication required", {'status': response.status_code}
            elif response.status_code == 403:
                return False, f"Forbidden - Access denied", {'status': response.status_code}
            elif response.status_code == 404:
                return False, f"API endpoint not found", {'status': response.status_code}
            elif response.status_code == 409:
                try:
                    error_data = response.json()
                    return False, f"Conflict - {error_data.get('error', 'Duplicate entry')}", {
                        'status': response.status_code,
                        'error': error_data
                    }
                except:
                    return False, f"Conflict (status: 409)", {'status': response.status_code}
            elif response.status_code == 500:
                try:
                    error_data = response.json()
                    return False, f"Server Error - {error_data.get('error', 'Internal server error')}", {
                        'status': response.status_code,
                        'error': error_data
                    }
                except:
                    return False, f"Internal Server Error (status: 500)", {'status': response.status_code}
            elif response.status_code == 502:
                return False, f"Bad Gateway - Server configuration issue", {
                    'status': response.status_code,
                    'note': 'API endpoint exists but server has configuration issues'
                }
            else:
                return False, f"Unexpected status code: {response.status_code}", {
                    'status': response.status_code
                }
                
        except requests.exceptions.Timeout:
            return False, "API request timed out", {'timeout': '10s'}
        except requests.exceptions.ConnectionError:
            return False, "Connection error to API", None
        except Exception as e:
            return False, f"Unexpected error: {str(e)}", None

    def test_rate_cards_api_endpoint(self):
        """Test 1: Rate Cards API Endpoint Accessibility"""
        print("\n🔌 TESTING RATE CARDS API ENDPOINT")
        print("=" * 60)
        
        # Test GET /api/rate-cards endpoint
        success, message, details = self.test_api_endpoint("/rate-cards", "GET")
        self.log_result(
            "Rate Cards GET Endpoint", 
            success, 
            f"Rate Cards GET API: {message}",
            details
        )
        
        return success

    def test_rate_card_creation_validation(self):
        """Test 2: Rate Card Creation Validation"""
        print("\n✅ TESTING RATE CARD CREATION VALIDATION")
        print("=" * 60)
        
        # Test missing required fields
        test_cases = [
            ({}, "Empty data"),
            ({"creator_id": "test-creator-id"}, "Missing deliverable_type"),
            ({"creator_id": "test-creator-id", "deliverable_type": "IG_Reel"}, "Missing base_price_cents"),
            ({"creator_id": "test-creator-id", "deliverable_type": "IG_Reel", "base_price_cents": 5000}, "Missing currency"),
            ({"creator_id": "test-creator-id", "deliverable_type": "INVALID_TYPE", "base_price_cents": 5000, "currency": "USD"}, "Invalid deliverable type"),
            ({"creator_id": "test-creator-id", "deliverable_type": "IG_Reel", "base_price_cents": 0, "currency": "USD"}, "Invalid price (zero)"),
            ({"creator_id": "test-creator-id", "deliverable_type": "IG_Reel", "base_price_cents": -100, "currency": "USD"}, "Invalid price (negative)"),
            ({"creator_id": "test-creator-id", "deliverable_type": "IG_Reel", "base_price_cents": 5000, "currency": "INVALID"}, "Invalid currency"),
        ]
        
        validation_passed = 0
        for test_data, description in test_cases:
            success, message, details = self.test_api_endpoint("/rate-cards", "POST", test_data)
            # For validation tests, we expect failures (400 status codes)
            expected_failure = not success and details and details.get('status') == 400
            
            self.log_result(
                f"Validation Test - {description}", 
                expected_failure, 
                f"Validation correctly rejected {description}: {message}",
                details
            )
            
            if expected_failure:
                validation_passed += 1
        
        return validation_passed >= 6  # Most validation tests should pass

    def test_rate_card_creation_with_valid_data(self):
        """Test 3: Rate Card Creation with Valid Data"""
        print("\n📝 TESTING RATE CARD CREATION WITH VALID DATA")
        print("=" * 60)
        
        # Test data matching frontend requirements
        valid_test_cases = [
            {
                "creator_id": "test-creator-id-1",
                "deliverable_type": "IG_Reel", 
                "base_price_cents": 5000,
                "currency": "USD",
                "rush_pct": 25
            },
            {
                "creator_id": "test-creator-id-2",
                "deliverable_type": "IG_Story", 
                "base_price_cents": 3000,
                "currency": "USD",
                "rush_pct": 20
            },
            {
                "creator_id": "test-creator-id-3",
                "deliverable_type": "TikTok_Post", 
                "base_price_cents": 7500,
                "currency": "MYR",
                "rush_pct": 30
            }
        ]
        
        creation_success = 0
        for i, test_data in enumerate(valid_test_cases):
            success, message, details = self.test_api_endpoint("/rate-cards", "POST", test_data)
            
            self.log_result(
                f"Valid Rate Card Creation {i+1}", 
                success, 
                f"Rate card creation with valid data: {message}",
                details
            )
            
            if success:
                creation_success += 1
        
        return creation_success > 0  # At least one should succeed

    def test_database_schema_verification(self):
        """Test 4: Database Schema Verification"""
        print("\n🗄️ TESTING DATABASE SCHEMA VERIFICATION")
        print("=" * 60)
        
        # Test database setup endpoint to verify schema
        success, message, details = self.test_api_endpoint("/setup-database", "GET")
        self.log_result(
            "Database Setup Verification", 
            success, 
            f"Database schema setup: {message}",
            details
        )
        
        # Test if we can query rate cards (indicates table exists)
        success2, message2, details2 = self.test_api_endpoint("/rate-cards?creator_id=test-creator", "GET")
        self.log_result(
            "Rate Cards Table Access", 
            success2, 
            f"Rate cards table accessibility: {message2}",
            details2
        )
        
        return success or success2

    def test_supabase_authentication(self):
        """Test 5: Supabase Authentication Verification"""
        print("\n🔐 TESTING SUPABASE AUTHENTICATION")
        print("=" * 60)
        
        # Test various endpoints that require Supabase
        endpoints_to_test = [
            ("/rate-cards", "GET", "Rate Cards API"),
            ("/campaigns", "GET", "Campaigns API"),
            ("/profiles", "GET", "Profiles API"),
        ]
        
        auth_working = 0
        for endpoint, method, description in endpoints_to_test:
            success, message, details = self.test_api_endpoint(endpoint, method)
            
            # Check if we get proper responses (not 401/403 which would indicate auth issues)
            auth_ok = success or (details and details.get('status') not in [401, 403])
            
            self.log_result(
                f"Supabase Auth - {description}", 
                auth_ok, 
                f"Supabase authentication for {description}: {message}",
                details
            )
            
            if auth_ok:
                auth_working += 1
        
        return auth_working >= 2  # Most should work

    def run_comprehensive_rate_card_tests(self):
        """Run comprehensive Rate Card API tests"""
        print("🚀 STARTING COMPREHENSIVE RATE CARD API TESTING")
        print("=" * 80)
        print(f"Testing against: {BASE_URL}")
        print(f"API Base: {API_BASE}")
        print(f"Test started at: {datetime.now().isoformat()}")
        
        # Run all test suites
        endpoint_ok = self.test_rate_cards_api_endpoint()
        validation_ok = self.test_rate_card_creation_validation()
        creation_ok = self.test_rate_card_creation_with_valid_data()
        schema_ok = self.test_database_schema_verification()
        auth_ok = self.test_supabase_authentication()
        
        # Print summary
        self.print_summary()
        
        return {
            'endpoint_accessible': endpoint_ok,
            'validation_working': validation_ok,
            'creation_working': creation_ok,
            'schema_verified': schema_ok,
            'auth_working': auth_ok
        }
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("🎯 RATE CARD API TESTING SUMMARY")
        print("=" * 80)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        print("\n📋 DETAILED RESULTS:")
        print("-" * 80)
        
        # Group results by category
        categories = {
            'API Endpoint': [],
            'Validation': [],
            'Creation': [],
            'Database': [],
            'Authentication': []
        }
        
        for result in self.results:
            test_name = result['test']
            if 'Endpoint' in test_name:
                categories['API Endpoint'].append(result)
            elif 'Validation' in test_name:
                categories['Validation'].append(result)
            elif 'Creation' in test_name:
                categories['Creation'].append(result)
            elif 'Database' in test_name or 'Schema' in test_name:
                categories['Database'].append(result)
            elif 'Auth' in test_name or 'Supabase' in test_name:
                categories['Authentication'].append(result)
        
        for category, results in categories.items():
            if results:
                passed = sum(1 for r in results if r['success'])
                total = len(results)
                print(f"\n{category}: {passed}/{total} passed")
                for result in results:
                    status = "✅" if result['success'] else "❌"
                    print(f"  {status} {result['test']}")
        
        print("\n🔍 KEY FINDINGS:")
        print("-" * 80)
        
        # Analyze results for key findings
        endpoint_tests = [r for r in self.results if 'Endpoint' in r['test']]
        validation_tests = [r for r in self.results if 'Validation' in r['test']]
        creation_tests = [r for r in self.results if 'Creation' in r['test']]
        
        if endpoint_tests:
            endpoint_success = any(r['success'] for r in endpoint_tests)
            print(f"✅ Rate Cards API Endpoint: {'ACCESSIBLE' if endpoint_success else 'NOT ACCESSIBLE'}")
        
        if validation_tests:
            validation_success = sum(1 for r in validation_tests if r['success']) >= len(validation_tests) * 0.7
            print(f"✅ Input Validation: {'WORKING' if validation_success else 'NEEDS ATTENTION'}")
        
        if creation_tests:
            creation_success = any(r['success'] for r in creation_tests)
            print(f"✅ Rate Card Creation: {'WORKING' if creation_success else 'FAILING'}")
        
        database_tests = [r for r in self.results if 'Database' in r['test'] or 'Schema' in r['test']]
        if database_tests:
            database_success = any(r['success'] for r in database_tests)
            print(f"✅ Database Schema: {'VERIFIED' if database_success else 'NEEDS ATTENTION'}")
        
        auth_tests = [r for r in self.results if 'Auth' in r['test'] or 'Supabase' in r['test']]
        if auth_tests:
            auth_success = sum(1 for r in auth_tests if r['success']) >= len(auth_tests) * 0.5
            print(f"✅ Supabase Authentication: {'WORKING' if auth_success else 'NEEDS ATTENTION'}")
        
        print(f"\n🏁 OVERALL STATUS: {'RATE CARD API READY' if success_rate >= 60 else 'NEEDS FIXES'}")
        
        if success_rate >= 60:
            print("✅ Rate Card API is functional and ready for frontend integration")
        else:
            print("⚠️ Rate Card API needs attention before frontend can work properly")
        
        # Specific recommendations
        print("\n💡 RECOMMENDATIONS:")
        print("-" * 80)
        
        failed_tests = [r for r in self.results if not r['success']]
        if failed_tests:
            print("Issues found that need attention:")
            for result in failed_tests[:5]:  # Show top 5 issues
                print(f"  • {result['test']}: {result['message']}")
                if result['details'] and 'error' in result['details']:
                    error_msg = result['details']['error'].get('error', '') if isinstance(result['details']['error'], dict) else str(result['details']['error'])
                    if error_msg:
                        print(f"    Error: {error_msg}")
        else:
            print("  • All tests passed! Rate Card API is working correctly.")

def main():
    """Main function"""
    tester = RateCardTester()
    results = tester.run_comprehensive_rate_card_tests()
    
    # Return appropriate exit code
    success_rate = (tester.passed_tests / tester.total_tests * 100) if tester.total_tests > 0 else 0
    sys.exit(0 if success_rate >= 60 else 1)

if __name__ == "__main__":
    main()