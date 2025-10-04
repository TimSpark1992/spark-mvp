#!/usr/bin/env python3
"""
PHASE 3 PAYMENTS & ESCROW BACKEND TESTING
Comprehensive testing of all payment-related backend components
"""

import requests
import json
import uuid
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://next-error-fix.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class PaymentBackendTester:
    def __init__(self):
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        
    def log_test(self, test_name, success, details="", error_msg=""):
        """Log test results"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            self.failed_tests += 1
            status = "❌ FAIL"
            
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "error": error_msg,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status} - {test_name}")
        if details:
            print(f"    Details: {details}")
        if error_msg:
            print(f"    Error: {error_msg}")
        print()

    def test_payment_api_endpoints(self):
        """Test Payment API Endpoints"""
        print("🔧 TESTING PAYMENT API ENDPOINTS")
        print("=" * 50)
        
        # Test 1: Create Checkout Session - Missing Required Fields
        try:
            response = requests.post(f"{API_BASE}/payments/create-checkout-session", 
                                   json={}, 
                                   timeout=10)
            
            if response.status_code == 400:
                data = response.json()
                if "offer_id and origin_url are required" in data.get("error", ""):
                    self.log_test("Create Checkout Session - Validation", True, 
                                "Properly validates required fields (offer_id, origin_url)")
                else:
                    self.log_test("Create Checkout Session - Validation", False, 
                                f"Unexpected error message: {data.get('error')}")
            else:
                self.log_test("Create Checkout Session - Validation", False, 
                            f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Create Checkout Session - Validation", False, 
                        error_msg=f"Request failed: {str(e)}")

        # Test 2: Create Checkout Session - Invalid Offer
        try:
            test_data = {
                "offer_id": "invalid-offer-id",
                "origin_url": BASE_URL
            }
            response = requests.post(f"{API_BASE}/payments/create-checkout-session", 
                                   json=test_data, 
                                   timeout=10)
            
            if response.status_code == 404:
                data = response.json()
                if "Offer not found" in data.get("error", ""):
                    self.log_test("Create Checkout Session - Invalid Offer", True, 
                                "Properly handles non-existent offers")
                else:
                    self.log_test("Create Checkout Session - Invalid Offer", False, 
                                f"Unexpected error: {data.get('error')}")
            else:
                self.log_test("Create Checkout Session - Invalid Offer", False, 
                            f"Expected 404, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Create Checkout Session - Invalid Offer", False, 
                        error_msg=f"Request failed: {str(e)}")

        # Test 3: Create Checkout Session - Stripe Configuration Check
        try:
            test_data = {
                "offer_id": str(uuid.uuid4()),
                "origin_url": BASE_URL
            }
            response = requests.post(f"{API_BASE}/payments/create-checkout-session", 
                                   json=test_data, 
                                   timeout=10)
            
            if response.status_code == 503:
                data = response.json()
                if "Payment system is not configured" in data.get("error", ""):
                    self.log_test("Create Checkout Session - Stripe Config", True, 
                                "Properly handles missing Stripe configuration")
                else:
                    self.log_test("Create Checkout Session - Stripe Config", False, 
                                f"Unexpected 503 error: {data.get('error')}")
            elif response.status_code == 404:
                self.log_test("Create Checkout Session - Stripe Config", True, 
                            "Stripe configured, offer validation working")
            else:
                data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                self.log_test("Create Checkout Session - Stripe Config", False, 
                            f"Unexpected status {response.status_code}: {data.get('error', 'Unknown error')}")
                
        except Exception as e:
            self.log_test("Create Checkout Session - Stripe Config", False, 
                        error_msg=f"Request failed: {str(e)}")

        # Test 4: Payment Status - Invalid Session ID
        try:
            response = requests.get(f"{API_BASE}/payments/status/invalid-session-id", timeout=10)
            
            if response.status_code in [404, 503]:
                data = response.json()
                error_msg = data.get("error", "")
                if "Payment not found" in error_msg or "Payment system is not configured" in error_msg:
                    self.log_test("Payment Status - Invalid Session", True, 
                                f"Properly handles invalid session ID: {error_msg}")
                else:
                    self.log_test("Payment Status - Invalid Session", False, 
                                f"Unexpected error: {error_msg}")
            else:
                self.log_test("Payment Status - Invalid Session", False, 
                            f"Expected 404 or 503, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Payment Status - Invalid Session", False, 
                        error_msg=f"Request failed: {str(e)}")

    def test_stripe_webhooks(self):
        """Test Stripe Webhooks Processing"""
        print("🔧 TESTING STRIPE WEBHOOKS")
        print("=" * 50)
        
        # Test 1: Check if webhook endpoint exists
        try:
            response = requests.post(f"{API_BASE}/payments/webhooks/stripe", 
                                   json={}, 
                                   timeout=10)
            
            if response.status_code == 404:
                self.log_test("Stripe Webhooks Endpoint", False, 
                            "❌ CRITICAL: Webhook endpoint /api/payments/webhooks/stripe does not exist")
            else:
                self.log_test("Stripe Webhooks Endpoint", True, 
                            f"Webhook endpoint exists (status: {response.status_code})")
                
        except Exception as e:
            self.log_test("Stripe Webhooks Endpoint", False, 
                        error_msg=f"❌ CRITICAL: Webhook endpoint missing or unreachable: {str(e)}")

    def test_stripe_integration_layer(self):
        """Test Stripe Integration Layer"""
        print("🔧 TESTING STRIPE INTEGRATION LAYER")
        print("=" * 50)
        
        # Test 1: Check if stripe checkout library exists
        try:
            response = requests.get(f"{BASE_URL}/lib/stripe/checkout.js", timeout=10)
            if response.status_code == 404:
                self.log_test("Stripe Checkout Library", False, 
                            "❌ MISSING: /lib/stripe/checkout.js does not exist")
            else:
                self.log_test("Stripe Checkout Library", True, 
                            "Stripe checkout library file exists")
        except Exception as e:
            self.log_test("Stripe Checkout Library", False, 
                        error_msg=f"❌ MISSING: Cannot access stripe checkout library: {str(e)}")

        # Test 2: Check if stripe transfers library exists  
        try:
            response = requests.get(f"{BASE_URL}/lib/stripe/transfers.js", timeout=10)
            if response.status_code == 404:
                self.log_test("Stripe Transfers Library", False, 
                            "❌ MISSING: /lib/stripe/transfers.js does not exist")
            else:
                self.log_test("Stripe Transfers Library", True, 
                            "Stripe transfers library file exists")
        except Exception as e:
            self.log_test("Stripe Transfers Library", False, 
                        error_msg=f"❌ MISSING: Cannot access stripe transfers library: {str(e)}")

    def test_escrow_payment_system(self):
        """Test Escrow Payment System"""
        print("🔧 TESTING ESCROW PAYMENT SYSTEM")
        print("=" * 50)
        
        # Test 1: Check if marketplace payments library exists
        try:
            response = requests.get(f"{BASE_URL}/lib/marketplace/payments.js", timeout=10)
            if response.status_code == 404:
                self.log_test("Marketplace Payments Library", False, 
                            "❌ MISSING: /lib/marketplace/payments.js does not exist")
            else:
                self.log_test("Marketplace Payments Library", True, 
                            "Marketplace payments library file exists")
        except Exception as e:
            self.log_test("Marketplace Payments Library", False, 
                        error_msg=f"❌ MISSING: Cannot access marketplace payments library: {str(e)}")

        # Test 2: Test pricing calculations (this file exists)
        try:
            response = requests.get(f"{BASE_URL}/lib/marketplace/pricing.js", timeout=10)
            if response.status_code == 200:
                self.log_test("Pricing Calculations Library", True, 
                            "✅ Pricing calculations library exists and accessible")
            else:
                self.log_test("Pricing Calculations Library", False, 
                            f"Pricing library not accessible: {response.status_code}")
        except Exception as e:
            self.log_test("Pricing Calculations Library", False, 
                        error_msg=f"Cannot access pricing library: {str(e)}")

    def test_admin_payments_api(self):
        """Test Admin Payments API"""
        print("🔧 TESTING ADMIN PAYMENTS API")
        print("=" * 50)
        
        # Test 1: Admin Payments GET - Should require authentication
        try:
            response = requests.get(f"{API_BASE}/admin/payments", timeout=10)
            
            if response.status_code == 403:
                data = response.json()
                if "Admin access required" in data.get("error", ""):
                    self.log_test("Admin Payments GET - Auth", True, 
                                "Properly requires admin authentication")
                else:
                    self.log_test("Admin Payments GET - Auth", False, 
                                f"Unexpected 403 error: {data.get('error')}")
            elif response.status_code == 401:
                self.log_test("Admin Payments GET - Auth", True, 
                            "Properly requires authentication")
            else:
                self.log_test("Admin Payments GET - Auth", False, 
                            f"Expected 401/403, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Admin Payments GET - Auth", False, 
                        error_msg=f"Request failed: {str(e)}")

        # Test 2: Admin Payments PATCH - Should require authentication
        try:
            test_data = {
                "payment_id": "test-id",
                "action": "release",
                "reason": "Test release"
            }
            response = requests.patch(f"{API_BASE}/admin/payments", 
                                    json=test_data, 
                                    timeout=10)
            
            if response.status_code == 403:
                data = response.json()
                if "Admin access required" in data.get("error", ""):
                    self.log_test("Admin Payments PATCH - Auth", True, 
                                "Properly requires admin authentication")
                else:
                    self.log_test("Admin Payments PATCH - Auth", False, 
                                f"Unexpected 403 error: {data.get('error')}")
            elif response.status_code == 401:
                self.log_test("Admin Payments PATCH - Auth", True, 
                            "Properly requires authentication")
            else:
                self.log_test("Admin Payments PATCH - Auth", False, 
                            f"Expected 401/403, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Admin Payments PATCH - Auth", False, 
                        error_msg=f"Request failed: {str(e)}")

    def test_offer_acceptance_integration(self):
        """Test Offer Acceptance Workflow Integration"""
        print("🔧 TESTING OFFER ACCEPTANCE WORKFLOW")
        print("=" * 50)
        
        # Test 1: Offer Accept Endpoint - Invalid Offer
        try:
            response = requests.post(f"{API_BASE}/offers/invalid-offer-id/accept", 
                                   json={}, 
                                   timeout=10)
            
            if response.status_code == 404:
                data = response.json()
                if "error" in data:
                    self.log_test("Offer Accept - Invalid Offer", True, 
                                "Properly handles non-existent offers")
                else:
                    self.log_test("Offer Accept - Invalid Offer", False, 
                                "Missing error message in 404 response")
            else:
                self.log_test("Offer Accept - Invalid Offer", False, 
                            f"Expected 404, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Offer Accept - Invalid Offer", False, 
                        error_msg=f"Request failed: {str(e)}")

        # Test 2: Offer Reject Endpoint - Invalid Offer
        try:
            response = requests.delete(f"{API_BASE}/offers/invalid-offer-id/accept", 
                                     timeout=10)
            
            if response.status_code == 404:
                data = response.json()
                if "error" in data:
                    self.log_test("Offer Reject - Invalid Offer", True, 
                                "Properly handles non-existent offers")
                else:
                    self.log_test("Offer Reject - Invalid Offer", False, 
                                "Missing error message in 404 response")
            else:
                self.log_test("Offer Reject - Invalid Offer", False, 
                            f"Expected 404, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Offer Reject - Invalid Offer", False, 
                        error_msg=f"Request failed: {str(e)}")

    def test_database_integration(self):
        """Test Database Integration for Payments"""
        print("🔧 TESTING DATABASE INTEGRATION")
        print("=" * 50)
        
        # Test 1: Database Connection via Setup Endpoint
        try:
            response = requests.get(f"{API_BASE}/setup-database", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Database Connection", True, 
                                "Database connection successful")
                else:
                    self.log_test("Database Connection", False, 
                                f"Database setup failed: {data.get('error', 'Unknown error')}")
            else:
                self.log_test("Database Connection", False, 
                            f"Database setup endpoint returned {response.status_code}")
                
        except Exception as e:
            self.log_test("Database Connection", False, 
                        error_msg=f"Database connection test failed: {str(e)}")

    def test_security_and_validation(self):
        """Test Security and Validation"""
        print("🔧 TESTING SECURITY & VALIDATION")
        print("=" * 50)
        
        # Test 1: XSS Protection in Payment Data
        try:
            xss_payload = {
                "offer_id": "<script>alert('xss')</script>",
                "origin_url": "javascript:alert('xss')"
            }
            response = requests.post(f"{API_BASE}/payments/create-checkout-session", 
                                   json=xss_payload, 
                                   timeout=10)
            
            # Should either sanitize or reject malicious input
            if response.status_code in [400, 404, 503]:
                self.log_test("XSS Protection - Payment Creation", True, 
                            "Properly handles potentially malicious input")
            else:
                self.log_test("XSS Protection - Payment Creation", False, 
                            f"Unexpected response to XSS payload: {response.status_code}")
                
        except Exception as e:
            self.log_test("XSS Protection - Payment Creation", False, 
                        error_msg=f"XSS test failed: {str(e)}")

        # Test 2: SQL Injection Protection
        try:
            sql_payload = "'; DROP TABLE payments; --"
            response = requests.get(f"{API_BASE}/payments/status/{sql_payload}", timeout=10)
            
            # Should handle SQL injection attempts safely
            if response.status_code in [400, 404, 503]:
                self.log_test("SQL Injection Protection", True, 
                            "Properly handles SQL injection attempts")
            else:
                self.log_test("SQL Injection Protection", False, 
                            f"Unexpected response to SQL injection: {response.status_code}")
                
        except Exception as e:
            self.log_test("SQL Injection Protection", False, 
                        error_msg=f"SQL injection test failed: {str(e)}")

    def run_all_tests(self):
        """Run all payment backend tests"""
        print("🚀 STARTING PHASE 3 PAYMENTS & ESCROW BACKEND TESTING")
        print("=" * 60)
        print(f"Testing against: {BASE_URL}")
        print("=" * 60)
        print()
        
        # Run all test suites
        self.test_payment_api_endpoints()
        self.test_stripe_webhooks()
        self.test_stripe_integration_layer()
        self.test_escrow_payment_system()
        self.test_admin_payments_api()
        self.test_offer_acceptance_integration()
        self.test_database_integration()
        self.test_security_and_validation()
        
        # Print summary
        print("=" * 60)
        print("🎯 PHASE 3 PAYMENTS & ESCROW TESTING SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.total_tests}")
        print(f"✅ Passed: {self.passed_tests}")
        print(f"❌ Failed: {self.failed_tests}")
        print(f"Success Rate: {(self.passed_tests/self.total_tests)*100:.1f}%")
        print()
        
        # Print critical issues
        critical_issues = []
        for result in self.test_results:
            if "❌ CRITICAL" in result["details"] or "❌ MISSING" in result["details"]:
                critical_issues.append(result)
        
        if critical_issues:
            print("🚨 CRITICAL ISSUES FOUND:")
            print("-" * 30)
            for issue in critical_issues:
                print(f"❌ {issue['test']}: {issue['details']}")
            print()
        
        # Print detailed results
        print("📋 DETAILED TEST RESULTS:")
        print("-" * 30)
        for result in self.test_results:
            print(f"{result['status']} {result['test']}")
            if result['details']:
                print(f"    {result['details']}")
            if result['error']:
                print(f"    Error: {result['error']}")
        
        return {
            "total_tests": self.total_tests,
            "passed_tests": self.passed_tests,
            "failed_tests": self.failed_tests,
            "success_rate": (self.passed_tests/self.total_tests)*100,
            "critical_issues": len(critical_issues),
            "results": self.test_results
        }

if __name__ == "__main__":
    tester = PaymentBackendTester()
    results = tester.run_all_tests()
    
    # Exit with error code if critical issues found
    if results["critical_issues"] > 0:
        exit(1)
    else:
        exit(0)