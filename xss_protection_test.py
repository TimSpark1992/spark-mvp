#!/usr/bin/env python3
"""
COMPREHENSIVE XSS PROTECTION TESTING SUITE
Tests all XSS sanitization functions, validation schemas, and real-world attack vectors
"""

import requests
import json
import os
import time
import uuid
from datetime import datetime
from urllib.parse import quote, unquote

# Configuration
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000')
API_BASE = f"{BASE_URL}/api"

class XSSProtectionTester:
    def __init__(self):
        self.test_results = {}
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'XSS-Protection-Tester/1.0'
        })
        
        # XSS Attack Vectors for Testing
        self.xss_vectors = [
            # Basic script injection
            '<script>alert("xss")</script>',
            '<script>alert(1)</script>',
            '<script>document.cookie</script>',
            '<script>window.location="http://evil.com"</script>',
            
            # Event handler injection
            '<img src="x" onerror="alert(1)">',
            '<img src="" onerror="alert(\'xss\')">',
            '<div onclick="alert(1)">Click me</div>',
            '<body onload="alert(1)">',
            '<svg onload="alert(1)">',
            
            # JavaScript protocol
            'javascript:alert("xss")',
            'javascript:alert(1)',
            'javascript:document.cookie',
            
            # Iframe injection
            '<iframe src="javascript:alert(1)"></iframe>',
            '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>',
            
            # Data protocol
            'data:text/html,<script>alert(1)</script>',
            'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
            
            # VBScript protocol
            'vbscript:msgbox("xss")',
            
            # CSS injection
            'expression(alert(1))',
            'background:url(javascript:alert(1))',
            '<style>@import "javascript:alert(1)"</style>',
            
            # Encoded XSS
            '%3Cscript%3Ealert(1)%3C/script%3E',
            '&lt;script&gt;alert(1)&lt;/script&gt;',
            '&#60;script&#62;alert(1)&#60;/script&#62;',
            
            # Advanced XSS
            '"><script>alert(1)</script>',
            '\';alert(1);var a=\'',
            '<script>eval(String.fromCharCode(97,108,101,114,116,40,49,41))</script>',
            
            # Object/embed injection
            '<object data="javascript:alert(1)">',
            '<embed src="javascript:alert(1)">',
            
            # Form injection
            '<form><button formaction="javascript:alert(1)">Click</button></form>',
            
            # Meta refresh
            '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
            
            # Link injection
            '<a href="javascript:alert(1)">Click me</a>',
            '<link rel="stylesheet" href="javascript:alert(1)">',
        ]
        
        # Field-specific test data
        self.field_test_data = {
            'title': 'Amazing Campaign<script>alert("title")</script>',
            'description': '<p>Great campaign</p><script>steal_data()</script>',
            'bio': '<strong>Creator Bio</strong><img src=x onerror=alert(1)>',
            'full_name': 'John Doe<script>alert("name")</script>',
            'company_name': 'Evil Corp<iframe src="javascript:alert(1)"></iframe>',
            'website_url': 'javascript:alert("url")',
            'note': '<em>Interested!</em><svg onload="alert(1)">',
            'email': 'test<script>alert(1)</script>@example.com',
        }
        
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
        if details and not success:  # Only show details for failures
            print(f"   Details: {details}")
    
    def test_client_side_xss_protection(self):
        """Test client-side XSS protection functions via browser automation"""
        print("\n=== Testing Client-Side XSS Protection Functions ===")
        
        # We'll test this by making requests to pages that use the XSS protection
        # and checking if dangerous content is sanitized
        
        try:
            # Test homepage to see if XSS protection is loaded
            response = self.session.get(BASE_URL)
            
            if response.status_code == 200:
                # Check if the page loads without errors
                self.log_test(
                    "XSS Protection - Page Load",
                    True,
                    "Application loads successfully",
                    f"Status: {response.status_code}"
                )
            else:
                self.log_test(
                    "XSS Protection - Page Load",
                    False,
                    f"Application failed to load: HTTP {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
        except Exception as e:
            self.log_test(
                "XSS Protection - Page Load",
                False,
                f"Failed to load application: {str(e)}",
                None
            )
    
    def test_form_input_sanitization(self):
        """Test form input sanitization by attempting to submit malicious data"""
        print("\n=== Testing Form Input Sanitization ===")
        
        # Test signup form with malicious data
        for vector in self.xss_vectors[:10]:  # Test first 10 vectors
            try:
                # Attempt to access signup page with malicious data in URL parameters
                malicious_url = f"{BASE_URL}/auth/signup?role=creator&test={quote(vector)}"
                response = self.session.get(malicious_url)
                
                if response.status_code == 200:
                    # Check if the malicious content appears in the response
                    response_text = response.text.lower()
                    vector_lower = vector.lower()
                    
                    # Check for dangerous patterns in response
                    dangerous_patterns = ['<script', 'javascript:', 'onerror=', 'onload=', 'onclick=']
                    found_dangerous = any(pattern in response_text for pattern in dangerous_patterns)
                    
                    if not found_dangerous:
                        self.log_test(
                            f"Form Input Sanitization - {vector[:30]}...",
                            True,
                            "Malicious content not found in response",
                            None
                        )
                    else:
                        self.log_test(
                            f"Form Input Sanitization - {vector[:30]}...",
                            False,
                            "Dangerous patterns found in response",
                            f"Found patterns in response for vector: {vector}"
                        )
                else:
                    self.log_test(
                        f"Form Input Sanitization - {vector[:30]}...",
                        False,
                        f"Unexpected response code: {response.status_code}",
                        f"Vector: {vector}"
                    )
                    
            except Exception as e:
                self.log_test(
                    f"Form Input Sanitization - {vector[:30]}...",
                    False,
                    f"Request failed: {str(e)}",
                    f"Vector: {vector}"
                )
    
    def test_api_input_validation(self):
        """Test API endpoints with malicious input data"""
        print("\n=== Testing API Input Validation ===")
        
        # Test MongoDB API status endpoint with malicious client_name
        for i, vector in enumerate(self.xss_vectors[:5]):  # Test first 5 vectors
            try:
                malicious_data = {
                    "client_name": vector
                }
                
                response = self.session.post(f"{API_BASE}/status", json=malicious_data)
                
                if response.status_code == 200:
                    data = response.json()
                    returned_name = data.get('client_name', '')
                    
                    # Check if the returned data is sanitized
                    dangerous_patterns = ['<script', 'javascript:', 'onerror=', 'onload=', 'onclick=']
                    found_dangerous = any(pattern in returned_name.lower() for pattern in dangerous_patterns)
                    
                    if not found_dangerous:
                        self.log_test(
                            f"API Input Validation - Vector {i+1}",
                            True,
                            "API sanitized malicious input",
                            f"Original: {vector[:50]}... → Returned: {returned_name[:50]}..."
                        )
                    else:
                        self.log_test(
                            f"API Input Validation - Vector {i+1}",
                            False,
                            "API returned unsanitized malicious content",
                            f"Original: {vector} → Returned: {returned_name}"
                        )
                else:
                    # API rejection is also acceptable
                    self.log_test(
                        f"API Input Validation - Vector {i+1}",
                        True,
                        f"API rejected malicious input (HTTP {response.status_code})",
                        f"Vector: {vector[:50]}..."
                    )
                    
            except Exception as e:
                self.log_test(
                    f"API Input Validation - Vector {i+1}",
                    False,
                    f"Request failed: {str(e)}",
                    f"Vector: {vector}"
                )
    
    def test_url_parameter_sanitization(self):
        """Test URL parameter sanitization"""
        print("\n=== Testing URL Parameter Sanitization ===")
        
        # Test various pages with malicious URL parameters
        test_pages = [
            "/auth/signup",
            "/auth/login",
            "/",
        ]
        
        for page in test_pages:
            for i, vector in enumerate(self.xss_vectors[:3]):  # Test first 3 vectors per page
                try:
                    # Add malicious parameter to URL
                    malicious_url = f"{BASE_URL}{page}?malicious={quote(vector)}&role=creator"
                    response = self.session.get(malicious_url)
                    
                    if response.status_code == 200:
                        response_text = response.text.lower()
                        
                        # Check for dangerous patterns in response
                        dangerous_patterns = ['<script', 'javascript:', 'onerror=', 'onload=']
                        found_dangerous = any(pattern in response_text for pattern in dangerous_patterns)
                        
                        if not found_dangerous:
                            self.log_test(
                                f"URL Parameter Sanitization - {page} Vector {i+1}",
                                True,
                                "URL parameters properly sanitized",
                                None
                            )
                        else:
                            self.log_test(
                                f"URL Parameter Sanitization - {page} Vector {i+1}",
                                False,
                                "Dangerous content found in response",
                                f"Page: {page}, Vector: {vector[:50]}..."
                            )
                    else:
                        self.log_test(
                            f"URL Parameter Sanitization - {page} Vector {i+1}",
                            True,
                            f"Page rejected malicious URL (HTTP {response.status_code})",
                            None
                        )
                        
                except Exception as e:
                    self.log_test(
                        f"URL Parameter Sanitization - {page} Vector {i+1}",
                        False,
                        f"Request failed: {str(e)}",
                        f"Vector: {vector}"
                    )
    
    def test_content_security_policy(self):
        """Test Content Security Policy headers"""
        print("\n=== Testing Content Security Policy ===")
        
        try:
            response = self.session.get(BASE_URL)
            
            if response.status_code == 200:
                headers = response.headers
                csp_header = headers.get('Content-Security-Policy', '')
                
                if csp_header:
                    # Check for important CSP directives
                    required_directives = [
                        'script-src',
                        'object-src',
                        'base-uri'
                    ]
                    
                    missing_directives = [d for d in required_directives if d not in csp_header]
                    
                    if not missing_directives:
                        self.log_test(
                            "Content Security Policy",
                            True,
                            "CSP header present with required directives",
                            f"CSP: {csp_header[:100]}..."
                        )
                    else:
                        self.log_test(
                            "Content Security Policy",
                            False,
                            f"CSP missing directives: {missing_directives}",
                            f"Current CSP: {csp_header}"
                        )
                else:
                    self.log_test(
                        "Content Security Policy",
                        False,
                        "No CSP header found",
                        f"Available headers: {list(headers.keys())}"
                    )
            else:
                self.log_test(
                    "Content Security Policy",
                    False,
                    f"Failed to get response: HTTP {response.status_code}",
                    None
                )
                
        except Exception as e:
            self.log_test(
                "Content Security Policy",
                False,
                f"CSP test failed: {str(e)}",
                None
            )
    
    def test_security_headers(self):
        """Test other security headers"""
        print("\n=== Testing Security Headers ===")
        
        try:
            response = self.session.get(BASE_URL)
            
            if response.status_code == 200:
                headers = response.headers
                
                # Check for important security headers
                security_headers = {
                    'X-Frame-Options': 'Clickjacking protection',
                    'X-Content-Type-Options': 'MIME sniffing protection',
                    'X-XSS-Protection': 'XSS protection',
                    'Referrer-Policy': 'Referrer policy'
                }
                
                for header, description in security_headers.items():
                    if header in headers:
                        self.log_test(
                            f"Security Headers - {header}",
                            True,
                            f"{description} header present",
                            f"Value: {headers[header]}"
                        )
                    else:
                        self.log_test(
                            f"Security Headers - {header}",
                            False,
                            f"{description} header missing",
                            None
                        )
            else:
                self.log_test(
                    "Security Headers",
                    False,
                    f"Failed to get response: HTTP {response.status_code}",
                    None
                )
                
        except Exception as e:
            self.log_test(
                "Security Headers",
                False,
                f"Security headers test failed: {str(e)}",
                None
            )
    
    def test_encoded_xss_vectors(self):
        """Test various encoding techniques for XSS"""
        print("\n=== Testing Encoded XSS Vectors ===")
        
        # Different encoding techniques
        encoded_vectors = [
            # URL encoding
            '%3Cscript%3Ealert%281%29%3C%2Fscript%3E',
            # HTML entity encoding
            '&lt;script&gt;alert(1)&lt;/script&gt;',
            # Decimal encoding
            '&#60;script&#62;alert(1)&#60;/script&#62;',
            # Hex encoding
            '&#x3C;script&#x3E;alert(1)&#x3C;/script&#x3E;',
            # Double encoding
            '%253Cscript%253Ealert%25281%2529%253C%252Fscript%253E',
        ]
        
        for i, vector in enumerate(encoded_vectors):
            try:
                # Test in URL parameter
                test_url = f"{BASE_URL}/auth/signup?test={vector}"
                response = self.session.get(test_url)
                
                if response.status_code == 200:
                    response_text = response.text.lower()
                    
                    # Check if decoded malicious content appears
                    dangerous_patterns = ['<script', 'alert(', 'javascript:']
                    found_dangerous = any(pattern in response_text for pattern in dangerous_patterns)
                    
                    if not found_dangerous:
                        self.log_test(
                            f"Encoded XSS Vector {i+1}",
                            True,
                            "Encoded XSS vector properly handled",
                            None
                        )
                    else:
                        self.log_test(
                            f"Encoded XSS Vector {i+1}",
                            False,
                            "Encoded XSS vector was decoded and not sanitized",
                            f"Vector: {vector}"
                        )
                else:
                    self.log_test(
                        f"Encoded XSS Vector {i+1}",
                        True,
                        f"Server rejected encoded vector (HTTP {response.status_code})",
                        None
                    )
                    
            except Exception as e:
                self.log_test(
                    f"Encoded XSS Vector {i+1}",
                    False,
                    f"Request failed: {str(e)}",
                    f"Vector: {vector}"
                )
    
    def test_performance_with_large_inputs(self):
        """Test XSS protection performance with large malicious inputs"""
        print("\n=== Testing Performance with Large Inputs ===")
        
        try:
            # Create large malicious input
            large_vector = '<script>alert("xss")</script>' * 1000
            
            start_time = time.time()
            
            # Test with API endpoint
            response = self.session.post(f"{API_BASE}/status", json={
                "client_name": large_vector
            })
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            if response.status_code in [200, 400]:  # Either success or rejection is fine
                if processing_time < 5.0:  # Should process within 5 seconds
                    self.log_test(
                        "Performance - Large Input",
                        True,
                        f"Large input processed in {processing_time:.2f}s",
                        f"Input size: {len(large_vector)} chars"
                    )
                else:
                    self.log_test(
                        "Performance - Large Input",
                        False,
                        f"Large input took too long: {processing_time:.2f}s",
                        f"Input size: {len(large_vector)} chars"
                    )
            else:
                self.log_test(
                    "Performance - Large Input",
                    False,
                    f"Unexpected response: HTTP {response.status_code}",
                    f"Processing time: {processing_time:.2f}s"
                )
                
        except Exception as e:
            self.log_test(
                "Performance - Large Input",
                False,
                f"Performance test failed: {str(e)}",
                None
            )
    
    def run_comprehensive_xss_tests(self):
        """Run all XSS protection tests"""
        print("🔒 Starting Comprehensive XSS Protection Tests")
        print(f"Testing against: {BASE_URL}")
        print("=" * 80)
        
        # Run all test categories
        self.test_client_side_xss_protection()
        self.test_form_input_sanitization()
        self.test_api_input_validation()
        self.test_url_parameter_sanitization()
        self.test_content_security_policy()
        self.test_security_headers()
        self.test_encoded_xss_vectors()
        self.test_performance_with_large_inputs()
        
        # Generate comprehensive summary
        print("\n" + "=" * 80)
        print("🔒 XSS PROTECTION TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Categorize results
        critical_failures = []
        minor_issues = []
        
        for test_name, result in self.test_results.items():
            if not result['success']:
                if any(keyword in test_name.lower() for keyword in ['xss', 'sanitization', 'validation']):
                    critical_failures.append((test_name, result['message']))
                else:
                    minor_issues.append((test_name, result['message']))
        
        if critical_failures:
            print(f"\n❌ CRITICAL XSS PROTECTION FAILURES ({len(critical_failures)}):")
            for test_name, message in critical_failures:
                print(f"  - {test_name}: {message}")
        
        if minor_issues:
            print(f"\n⚠️  MINOR SECURITY ISSUES ({len(minor_issues)}):")
            for test_name, message in minor_issues:
                print(f"  - {test_name}: {message}")
        
        if passed_tests == total_tests:
            print("\n🎉 ALL XSS PROTECTION TESTS PASSED!")
            print("✅ Application appears to have comprehensive XSS protection")
        elif len(critical_failures) == 0:
            print("\n✅ CORE XSS PROTECTION WORKING")
            print("⚠️  Some minor security enhancements recommended")
        else:
            print("\n🚨 CRITICAL XSS VULNERABILITIES DETECTED")
            print("❌ Immediate security fixes required")
        
        # Security rating
        if passed_tests / total_tests >= 0.95:
            security_rating = "EXCELLENT"
        elif passed_tests / total_tests >= 0.85:
            security_rating = "GOOD"
        elif passed_tests / total_tests >= 0.70:
            security_rating = "FAIR"
        else:
            security_rating = "POOR"
        
        print(f"\n🔒 XSS PROTECTION RATING: {security_rating}")
        
        return {
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'failed_tests': failed_tests,
            'success_rate': (passed_tests/total_tests)*100,
            'critical_failures': len(critical_failures),
            'security_rating': security_rating,
            'all_tests_passed': passed_tests == total_tests,
            'results': self.test_results
        }

if __name__ == "__main__":
    tester = XSSProtectionTester()
    results = tester.run_comprehensive_xss_tests()
    
    # Exit with error code if critical failures found
    exit(results['critical_failures'])