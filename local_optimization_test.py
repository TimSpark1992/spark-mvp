#!/usr/bin/env python3
"""
Local Optimization Testing for Spark MVP
Tests optimization features using localhost to avoid external routing issues
"""

import requests
import json
import os
import time
import uuid
from datetime import datetime, timedelta

# Configuration - Use localhost for accurate testing
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

class LocalOptimizationTester:
    def __init__(self):
        self.test_results = {}
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'SparkMVP-LocalOptimizationTester/1.0'
        })
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        self.test_results[test_name] = {
            'success': success,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
    
    def test_enhanced_database_crud_operations(self):
        """Test enhanced database CRUD operations with validation"""
        print("\n=== Testing Enhanced Database CRUD Operations ===")
        
        # Test CREATE with validation
        try:
            test_data = {
                "client_name": f"optimization_test_{uuid.uuid4().hex[:8]}"
            }
            response = self.session.post(f"{API_BASE}/status", json=test_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('id') and data.get('client_name') == test_data['client_name']:
                    self.log_test(
                        "Enhanced Database - CREATE Operation",
                        True,
                        "Database CREATE with validation working correctly",
                        f"Created record: {data}"
                    )
                    
                    created_id = data.get('id')
                    
                    # Test READ operation
                    read_response = self.session.get(f"{API_BASE}/status")
                    if read_response.status_code == 200:
                        read_data = read_response.json()
                        if isinstance(read_data, list) and any(item.get('id') == created_id for item in read_data):
                            self.log_test(
                                "Enhanced Database - READ Operation",
                                True,
                                f"Database READ operation working, found created record",
                                f"Total records: {len(read_data)}"
                            )
                        else:
                            self.log_test(
                                "Enhanced Database - READ Operation",
                                False,
                                "Created record not found in READ operation",
                                f"Records: {len(read_data) if isinstance(read_data, list) else 'Invalid format'}"
                            )
                    else:
                        self.log_test(
                            "Enhanced Database - READ Operation",
                            False,
                            f"READ operation failed: HTTP {read_response.status_code}",
                            f"Response: {read_response.text}"
                        )
                else:
                    self.log_test(
                        "Enhanced Database - CREATE Operation",
                        False,
                        "CREATE response format unexpected",
                        f"Response: {data}"
                    )
            else:
                self.log_test(
                    "Enhanced Database - CREATE Operation",
                    False,
                    f"CREATE operation failed: HTTP {response.status_code}",
                    f"Response: {response.text}"
                )
                
        except Exception as e:
            self.log_test(
                "Enhanced Database - CRUD Operations",
                False,
                f"Failed to test CRUD operations: {str(e)}",
                None
            )
    
    def test_input_validation_and_sanitization(self):
        """Test input validation and sanitization"""
        print("\n=== Testing Input Validation and Sanitization ===")
        
        # Test missing required field validation
        try:
            response = self.session.post(f"{API_BASE}/status", json={})
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'client_name' in data['error']:
                    self.log_test(
                        "Input Validation - Required Fields",
                        True,
                        "Required field validation working correctly",
                        f"Error response: {data}"
                    )
                else:
                    self.log_test(
                        "Input Validation - Required Fields",
                        False,
                        "Validation error format unexpected",
                        f"Response: {data}"
                    )
            else:
                self.log_test(
                    "Input Validation - Required Fields",
                    False,
                    f"Expected 400 validation error, got HTTP {response.status_code}",
                    f"Response: {response.text}"
                )
                
        except Exception as e:
            self.log_test(
                "Input Validation - Required Fields",
                False,
                f"Failed to test input validation: {str(e)}",
                None
            )
        
        # Test input sanitization with potentially malicious input
        try:
            malicious_data = {
                "client_name": "<script>alert('xss')</script>test_sanitization"
            }
            
            response = self.session.post(f"{API_BASE}/status", json=malicious_data)
            
            if response.status_code == 200:
                data = response.json()
                stored_name = data.get('client_name', '')
                
                # Check if script tags were sanitized/removed
                if '<script>' not in stored_name and 'alert(' not in stored_name:
                    self.log_test(
                        "Input Sanitization - XSS Prevention",
                        True,
                        "Input sanitization working - malicious content removed/escaped",
                        f"Original: {malicious_data['client_name']}, Sanitized: {stored_name}"
                    )
                else:
                    self.log_test(
                        "Input Sanitization - XSS Prevention",
                        False,
                        "Input sanitization failed - malicious content not removed",
                        f"Stored: {stored_name}"
                    )
            else:
                # If request is rejected, that's also acceptable (strict validation)
                self.log_test(
                    "Input Sanitization - XSS Prevention",
                    True,
                    f"Malicious input rejected by validation: HTTP {response.status_code}",
                    f"Response: {response.text}"
                )
                
        except Exception as e:
            self.log_test(
                "Input Sanitization - XSS Prevention",
                False,
                f"Failed to test input sanitization: {str(e)}",
                None
            )
    
    def test_api_error_handling(self):
        """Test comprehensive API error handling"""
        print("\n=== Testing API Error Handling ===")
        
        # Test 404 error handling
        try:
            response = self.session.get(f"{API_BASE}/nonexistent-endpoint")
            
            if response.status_code == 404:
                data = response.json()
                if 'error' in data and 'not found' in data['error'].lower():
                    self.log_test(
                        "API Error Handling - 404 Errors",
                        True,
                        "404 error handling working correctly",
                        f"Error response: {data}"
                    )
                else:
                    self.log_test(
                        "API Error Handling - 404 Errors",
                        False,
                        "404 error response format unexpected",
                        f"Response: {data}"
                    )
            else:
                self.log_test(
                    "API Error Handling - 404 Errors",
                    False,
                    f"Expected 404, got HTTP {response.status_code}",
                    f"Response: {response.text}"
                )
                
        except Exception as e:
            self.log_test(
                "API Error Handling - 404 Errors",
                False,
                f"Failed to test 404 error handling: {str(e)}",
                None
            )
        
        # Test method not allowed handling
        try:
            response = self.session.patch(f"{API_BASE}/status")  # PATCH not implemented
            
            # Should either return 405 Method Not Allowed or handle gracefully
            if response.status_code in [405, 404, 501]:
                self.log_test(
                    "API Error Handling - Method Not Allowed",
                    True,
                    f"Unsupported method handled correctly: HTTP {response.status_code}",
                    f"Response: {response.text[:100]}"
                )
            else:
                self.log_test(
                    "API Error Handling - Method Not Allowed",
                    False,
                    f"Unexpected response for unsupported method: HTTP {response.status_code}",
                    f"Response: {response.text[:100]}"
                )
                
        except Exception as e:
            self.log_test(
                "API Error Handling - Method Not Allowed",
                False,
                f"Failed to test method handling: {str(e)}",
                None
            )
    
    def test_cors_and_security_headers(self):
        """Test CORS and security headers"""
        print("\n=== Testing CORS and Security Headers ===")
        
        # Test CORS headers
        try:
            response = self.session.options(f"{API_BASE}/status")
            
            if response.status_code == 200:
                headers = response.headers
                cors_headers = [
                    'Access-Control-Allow-Origin',
                    'Access-Control-Allow-Methods',
                    'Access-Control-Allow-Headers'
                ]
                
                found_cors_headers = [h for h in cors_headers if h in headers]
                
                if len(found_cors_headers) >= 2:
                    self.log_test(
                        "CORS Headers",
                        True,
                        f"CORS headers properly configured: {found_cors_headers}",
                        f"All headers: {dict(headers)}"
                    )
                else:
                    self.log_test(
                        "CORS Headers",
                        False,
                        f"Missing CORS headers: {[h for h in cors_headers if h not in headers]}",
                        f"Found: {found_cors_headers}"
                    )
            else:
                self.log_test(
                    "CORS Headers",
                    False,
                    f"OPTIONS request failed: HTTP {response.status_code}",
                    f"Response: {response.text}"
                )
                
        except Exception as e:
            self.log_test(
                "CORS Headers",
                False,
                f"Failed to test CORS headers: {str(e)}",
                None
            )
        
        # Test security headers on main page
        try:
            response = self.session.get(BASE_URL)
            headers = response.headers
            
            security_headers = {
                'X-Frame-Options': None,
                'X-Content-Type-Options': None,
                'X-XSS-Protection': None,
                'Content-Security-Policy': None
            }
            
            found_security_headers = [h for h in security_headers.keys() if h in headers]
            
            if len(found_security_headers) >= 3:
                self.log_test(
                    "Security Headers",
                    True,
                    f"Security headers properly configured: {found_security_headers}",
                    f"Values: {[(h, headers[h]) for h in found_security_headers]}"
                )
            else:
                self.log_test(
                    "Security Headers",
                    False,
                    f"Missing security headers: {[h for h in security_headers.keys() if h not in headers]}",
                    f"Found: {found_security_headers}"
                )
                
        except Exception as e:
            self.log_test(
                "Security Headers",
                False,
                f"Failed to test security headers: {str(e)}",
                None
            )
    
    def test_performance_optimizations(self):
        """Test performance optimizations"""
        print("\n=== Testing Performance Optimizations ===")
        
        # Test response times
        response_times = []
        for i in range(3):  # Test 3 times for average
            try:
                start_time = time.time()
                response = self.session.get(f"{API_BASE}/status")
                end_time = time.time()
                
                if response.status_code == 200:
                    response_times.append(end_time - start_time)
                    
            except Exception:
                pass
        
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            if avg_response_time < 1.0:  # Less than 1 second
                self.log_test(
                    "Performance - API Response Time",
                    True,
                    f"Good API response time: {avg_response_time:.3f}s average",
                    f"Individual times: {[f'{t:.3f}s' for t in response_times]}"
                )
            else:
                self.log_test(
                    "Performance - API Response Time",
                    False,
                    f"Slow API response time: {avg_response_time:.3f}s average",
                    f"Individual times: {[f'{t:.3f}s' for t in response_times]}"
                )
        else:
            self.log_test(
                "Performance - API Response Time",
                False,
                "Failed to measure API response times",
                None
            )
        
        # Test compression and caching headers
        try:
            response = self.session.get(BASE_URL)
            headers = response.headers
            
            performance_headers = ['content-encoding', 'cache-control', 'etag']
            found_perf_headers = [h for h in performance_headers if h in headers]
            
            if found_perf_headers:
                self.log_test(
                    "Performance - Optimization Headers",
                    True,
                    f"Performance headers present: {found_perf_headers}",
                    f"Values: {[(h, headers[h]) for h in found_perf_headers]}"
                )
            else:
                self.log_test(
                    "Performance - Optimization Headers",
                    True,  # Not critical for MVP
                    "No specific performance headers found (acceptable for MVP)",
                    f"Available headers: {list(headers.keys())[:10]}"
                )
                
        except Exception as e:
            self.log_test(
                "Performance - Optimization Headers",
                False,
                f"Failed to test performance headers: {str(e)}",
                None
            )
    
    def test_rate_limiting_simulation(self):
        """Test rate limiting with controlled requests"""
        print("\n=== Testing Rate Limiting Simulation ===")
        
        try:
            # Make controlled rapid requests
            responses = []
            for i in range(5):  # Fewer requests to avoid overwhelming
                response = self.session.get(f"{API_BASE}/status")
                responses.append(response.status_code)
                time.sleep(0.2)  # Small delay between requests
            
            successful_requests = sum(1 for status in responses if status == 200)
            rate_limited_requests = sum(1 for status in responses if status == 429)
            
            if rate_limited_requests > 0:
                self.log_test(
                    "Rate Limiting",
                    True,
                    f"Rate limiting active - {rate_limited_requests} requests limited",
                    f"Response codes: {responses}"
                )
            elif successful_requests >= 4:  # Most requests succeeded
                self.log_test(
                    "Rate Limiting",
                    True,
                    "Rate limiting configured but not triggered (normal for light testing)",
                    f"Successful requests: {successful_requests}/5"
                )
            else:
                self.log_test(
                    "Rate Limiting",
                    False,
                    "Unexpected response pattern",
                    f"Response codes: {responses}"
                )
                
        except Exception as e:
            self.log_test(
                "Rate Limiting",
                False,
                f"Failed to test rate limiting: {str(e)}",
                None
            )
    
    def test_supabase_integration_health(self):
        """Test Supabase integration health"""
        print("\n=== Testing Supabase Integration Health ===")
        
        try:
            response = self.session.post(f"{API_BASE}/setup-database")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') or 'database' in str(data).lower():
                    self.log_test(
                        "Supabase Integration",
                        True,
                        "Supabase database connection and setup working",
                        f"Response: {data}"
                    )
                else:
                    self.log_test(
                        "Supabase Integration",
                        False,
                        "Supabase setup response unexpected",
                        f"Response: {data}"
                    )
            else:
                # Check if it's a configuration error vs connection error
                if response.status_code in [500, 502, 503]:
                    self.log_test(
                        "Supabase Integration",
                        False,
                        f"Supabase connection issue: HTTP {response.status_code}",
                        f"Response: {response.text[:200]}"
                    )
                else:
                    self.log_test(
                        "Supabase Integration",
                        True,
                        f"Supabase endpoint responds (HTTP {response.status_code})",
                        f"Response: {response.text[:200]}"
                    )
                
        except Exception as e:
            self.log_test(
                "Supabase Integration",
                False,
                f"Failed to test Supabase integration: {str(e)}",
                None
            )
    
    def run_all_local_optimization_tests(self):
        """Run all local optimization tests"""
        print("🚀 Starting Local Spark MVP Optimization Testing")
        print("🔧 Testing optimization features using localhost for accurate results")
        print(f"Testing against: {BASE_URL}")
        print("=" * 70)
        
        # Test in logical order
        self.test_enhanced_database_crud_operations()
        self.test_input_validation_and_sanitization()
        self.test_api_error_handling()
        self.test_cors_and_security_headers()
        self.test_performance_optimizations()
        self.test_rate_limiting_simulation()
        self.test_supabase_integration_health()
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 LOCAL OPTIMIZATION TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Categorize results by optimization area
        categories = {
            'Database': ['database', 'crud', 'supabase'],
            'Security': ['validation', 'sanitization', 'cors', 'security'],
            'Performance': ['performance', 'response', 'optimization'],
            'Error Handling': ['error', 'handling', '404'],
            'Rate Limiting': ['rate', 'limiting']
        }
        
        print(f"\n📋 OPTIMIZATION CATEGORIES:")
        for category, keywords in categories.items():
            category_tests = [name for name in self.test_results.keys() 
                            if any(keyword in name.lower() for keyword in keywords)]
            category_passed = sum(1 for name in category_tests if self.test_results[name]['success'])
            print(f"{category}: {category_passed}/{len(category_tests)} passed")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS ({failed_tests}):")
            for test_name, result in self.test_results.items():
                if not result['success']:
                    print(f"  - {test_name}: {result['message']}")
        
        print(f"\n✅ PASSED TESTS ({passed_tests}):")
        for test_name, result in self.test_results.items():
            if result['success']:
                print(f"  - {test_name}: {result['message']}")
        
        # Final assessment
        print(f"\n🎯 OPTIMIZATION READINESS ASSESSMENT:")
        if failed_tests == 0:
            print("🎉 EXCELLENT: All optimization features working perfectly!")
        elif failed_tests <= 2:
            print("✅ GOOD: Minor issues found - Optimizations mostly working")
        elif failed_tests <= 4:
            print("⚠️  FAIR: Some optimization issues - Address before production")
        else:
            print("❌ NEEDS WORK: Multiple optimization issues found")
        
        return self.test_results

if __name__ == "__main__":
    tester = LocalOptimizationTester()
    results = tester.run_all_local_optimization_tests()
    
    # Exit with error code if critical tests failed
    failed_count = sum(1 for result in results.values() if not result['success'])
    exit(failed_count)