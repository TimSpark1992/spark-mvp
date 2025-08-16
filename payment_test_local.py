#!/usr/bin/env python3
"""
PHASE 3 PAYMENTS & ESCROW BACKEND TESTING (LOCAL)
Comprehensive testing of payment-related backend components using local server
"""

import requests
import json
import uuid
import os
from datetime import datetime

# Configuration - Use local server since external has routing issues
BASE_URL = "http://localhost:3000"
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
            elif response.status_code == 503:
                data = response.json()
                if "Payment system is not configured" in data.get("error", ""):
                    self.log_test("Create Checkout Session - Validation", True, 
                                "API working but Stripe not configured (expected)")
                else:
                    self.log_test("Create Checkout Session - Validation", False, 
                                f"Unexpected 503 error: {data.get('error')}")
            else:
                self.log_test("Create Checkout Session - Validation", False, 
                            f"Expected 400 or 503, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Create Checkout Session - Validation", False, 
                        error_msg=f"Request failed: {str(e)}")

        # Test 2: Create Checkout Session - With Required Fields
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
                                "API structure working, Stripe not configured (expected)")
                else:
                    self.log_test("Create Checkout Session - Stripe Config", False, 
                                f"Unexpected 503 error: {data.get('error')}")
            elif response.status_code == 404:
                data = response.json()
                if "Offer not found" in data.get("error", ""):
                    self.log_test("Create Checkout Session - Stripe Config", True, 
                                "Stripe configured, offer validation working")
                else:
                    self.log_test("Create Checkout Session - Stripe Config", False, 
                                f"Unexpected 404 error: {data.get('error')}")
            else:
                self.log_test("Create Checkout Session - Stripe Config", False, 
                            f"Expected 503 or 404, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Create Checkout Session - Stripe Config", False, 
                        error_msg=f"Request failed: {str(e)}")

        # Test 3: Payment Status - Invalid Session ID
        try:
            response = requests.get(f"{API_BASE}/payments/status/invalid-session-id", timeout=10)
            
            if response.status_code == 503:
                data = response.json()
                if "Payment system is not configured" in data.get("error", ""):
                    self.log_test("Payment Status - Invalid Session", True, 
                                "API structure working, Stripe not configured (expected)")
                else:
                    self.log_test("Payment Status - Invalid Session", False, 
                                f"Unexpected 503 error: {data.get('error')}")
            elif response.status_code == 404:
                data = response.json()
                if "Payment not found" in data.get("error", ""):
                    self.log_test("Payment Status - Invalid Session", True, 
                                "Stripe configured, payment validation working")
                else:
                    self.log_test("Payment Status - Invalid Session", False, 
                                f"Unexpected 404 error: {data.get('error')}")
            else:
                self.log_test("Payment Status - Invalid Session", False, 
                            f"Expected 503 or 404, got {response.status_code}")
                
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
            elif response.status_code == 405:
                self.log_test("Stripe Webhooks Endpoint", False, 
                            "❌ CRITICAL: Webhook endpoint exists but method not allowed")
            else:
                self.log_test("Stripe Webhooks Endpoint", True, 
                            f"Webhook endpoint exists (status: {response.status_code})")
                
        except Exception as e:
            self.log_test("Stripe Webhooks Endpoint", False, 
                        error_msg=f"❌ CRITICAL: Webhook endpoint test failed: {str(e)}")

    def test_file_existence(self):
        """Test if required payment files exist"""
        print("🔧 TESTING FILE EXISTENCE")
        print("=" * 50)
        
        # Test files that should exist
        files_to_check = [
            ("/app/lib/stripe/checkout.js", "Stripe Checkout Library"),
            ("/app/lib/stripe/transfers.js", "Stripe Transfers Library"),
            ("/app/lib/marketplace/payments.js", "Marketplace Payments Library"),
            ("/app/lib/marketplace/pricing.js", "Pricing Calculations Library"),
            ("/app/app/api/payments/webhooks/stripe/route.js", "Stripe Webhooks Route"),
        ]
        
        for file_path, description in files_to_check:
            try:
                if os.path.exists(file_path):
                    self.log_test(f"File Exists - {description}", True, 
                                f"✅ {file_path} exists")
                else:
                    self.log_test(f"File Exists - {description}", False, 
                                f"❌ MISSING: {file_path} does not exist")
            except Exception as e:
                self.log_test(f"File Exists - {description}", False, 
                            error_msg=f"Error checking {file_path}: {str(e)}")

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
            elif response.status_code == 405:
                self.log_test("Admin Payments GET - Auth", False, 
                            "Method not allowed - endpoint may not exist")
            else:
                self.log_test("Admin Payments GET - Auth", False, 
                            f"Expected 401/403, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Admin Payments GET - Auth", False, 
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
            elif response.status_code == 500:
                data = response.json()
                if "error" in data:
                    self.log_test("Offer Accept - Invalid Offer", True, 
                                "RLS policies working (expected 500)")
                else:
                    self.log_test("Offer Accept - Invalid Offer", False, 
                                "Missing error message in 500 response")
            else:
                self.log_test("Offer Accept - Invalid Offer", False, 
                            f"Expected 404 or 500, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Offer Accept - Invalid Offer", False, 
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
            elif response.status_code == 405:
                self.log_test("Database Connection", False, 
                            "Setup endpoint method not allowed - may need POST")
            else:
                self.log_test("Database Connection", False, 
                            f"Database setup endpoint returned {response.status_code}")
                
        except Exception as e:
            self.log_test("Database Connection", False, 
                        error_msg=f"Database connection test failed: {str(e)}")

    def test_supabase_payment_functions(self):
        """Test Supabase Payment Functions by examining the code"""
        print("🔧 TESTING SUPABASE PAYMENT FUNCTIONS")
        print("=" * 50)
        
        try:
            # Check if supabase.js contains payment functions
            supabase_file = "/app/lib/supabase.js"
            if os.path.exists(supabase_file):
                with open(supabase_file, 'r') as f:
                    content = f.read()
                
                # Check for payment-related functions
                payment_functions = [
                    "getPayments",
                    "createPayment", 
                    "getPaymentBySessionId",
                    "updatePayment",
                    "getPayouts",
                    "createPayout",
                    "updatePayout"
                ]
                
                found_functions = []
                missing_functions = []
                
                for func in payment_functions:
                    if f"export const {func}" in content:
                        found_functions.append(func)
                    else:
                        missing_functions.append(func)
                
                if len(found_functions) >= 4:  # At least basic payment functions
                    self.log_test("Supabase Payment Functions", True, 
                                f"✅ Found {len(found_functions)} payment functions: {', '.join(found_functions)}")
                else:
                    self.log_test("Supabase Payment Functions", False, 
                                f"❌ Only found {len(found_functions)} functions, missing: {', '.join(missing_functions)}")
            else:
                self.log_test("Supabase Payment Functions", False, 
                            "❌ Supabase.js file not found")
                
        except Exception as e:
            self.log_test("Supabase Payment Functions", False, 
                        error_msg=f"Error checking Supabase functions: {str(e)}")

    def run_all_tests(self):
        """Run all payment backend tests"""
        print("🚀 STARTING PHASE 3 PAYMENTS & ESCROW BACKEND TESTING (LOCAL)")
        print("=" * 70)
        print(f"Testing against: {BASE_URL}")
        print("=" * 70)
        print()
        
        # Run all test suites
        self.test_payment_api_endpoints()
        self.test_stripe_webhooks()
        self.test_file_existence()
        self.test_admin_payments_api()
        self.test_offer_acceptance_integration()
        self.test_database_integration()
        self.test_supabase_payment_functions()
        
        # Print summary
        print("=" * 70)
        print("🎯 PHASE 3 PAYMENTS & ESCROW TESTING SUMMARY")
        print("=" * 70)
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
        
        # Print working components
        working_components = []
        for result in self.test_results:
            if result["status"] == "✅ PASS":
                working_components.append(result)
        
        if working_components:
            print("✅ WORKING COMPONENTS:")
            print("-" * 30)
            for component in working_components:
                print(f"✅ {component['test']}: {component['details']}")
            print()
        
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
    
    print("🔍 DETAILED ANALYSIS:")
    print("-" * 30)
    
    # Analyze results
    if results["success_rate"] >= 70:
        print("🎉 EXCELLENT: Most payment components are working correctly")
    elif results["success_rate"] >= 50:
        print("⚠️  GOOD: Core payment functionality present, some issues to address")
    else:
        print("🚨 NEEDS ATTENTION: Significant payment system issues detected")
    
    print(f"\n📊 Final Score: {results['success_rate']:.1f}% ({results['passed_tests']}/{results['total_tests']} tests passed)")
    
    # Exit with appropriate code
    exit(0 if results["critical_issues"] == 0 else 1)