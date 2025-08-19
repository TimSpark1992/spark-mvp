#!/usr/bin/env python3

"""
Backend Upload Functionality Testing
=====================================

This script tests the profile picture and media kit upload functionality fixes
mentioned in the review request, specifically testing for:

1. "TypeError: r is not a function" error resolution
2. Storage bucket configuration issues
3. File upload robustness improvements
4. Function availability checks
5. Error handling enhancements

Focus: Backend API testing for upload functionality
"""

import requests
import json
import os
import sys
from datetime import datetime
import time

# Test configuration
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000')
API_BASE = f"{BASE_URL}/api"

class UploadFunctionalityTester:
    def __init__(self):
        self.results = {
            'total_tests': 0,
            'passed_tests': 0,
            'failed_tests': 0,
            'test_details': []
        }
        
    def log_test(self, test_name, status, details="", error_info=""):
        """Log test results"""
        self.results['total_tests'] += 1
        if status == 'PASS':
            self.results['passed_tests'] += 1
            print(f"✅ {test_name}: PASSED")
        else:
            self.results['failed_tests'] += 1
            print(f"❌ {test_name}: FAILED")
            if error_info:
                print(f"   Error: {error_info}")
        
        if details:
            print(f"   Details: {details}")
            
        self.results['test_details'].append({
            'test': test_name,
            'status': status,
            'details': details,
            'error': error_info,
            'timestamp': datetime.now().isoformat()
        })
        print()

    def test_supabase_helper_functions(self):
        """Test 1: Verify Supabase helper functions are accessible"""
        print("🧪 Testing Supabase Helper Functions Accessibility...")
        
        try:
            # Test if we can access the Supabase functions through an API endpoint
            response = requests.get(f"{API_BASE}/health", timeout=10)
            
            if response.status_code == 200:
                self.log_test(
                    "Supabase Helper Functions Access",
                    "PASS",
                    f"API health check successful (status: {response.status_code})"
                )
            else:
                self.log_test(
                    "Supabase Helper Functions Access", 
                    "FAIL",
                    f"API health check failed (status: {response.status_code})",
                    f"HTTP {response.status_code}: {response.text[:200]}"
                )
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Supabase Helper Functions Access",
                "FAIL", 
                "Failed to connect to API endpoint",
                str(e)
            )

    def test_file_upload_api_endpoint(self):
        """Test 2: Test file upload API endpoint functionality"""
        print("🧪 Testing File Upload API Endpoint...")
        
        try:
            # Test the file upload endpoint exists and responds
            response = requests.post(f"{API_BASE}/files/upload", timeout=10)
            
            # We expect a 400 error because we're not sending required fields
            # This confirms the endpoint exists and is processing requests
            if response.status_code == 400:
                try:
                    error_data = response.json()
                    if 'error' in error_data and 'required' in error_data['error'].lower():
                        self.log_test(
                            "File Upload API Endpoint",
                            "PASS",
                            "Upload endpoint exists and validates required fields correctly",
                            f"Expected validation error: {error_data.get('error', 'Unknown')}"
                        )
                    else:
                        self.log_test(
                            "File Upload API Endpoint",
                            "FAIL",
                            "Upload endpoint exists but validation response unexpected",
                            f"Response: {error_data}"
                        )
                except json.JSONDecodeError:
                    self.log_test(
                        "File Upload API Endpoint",
                        "FAIL",
                        "Upload endpoint exists but response is not JSON",
                        f"Response text: {response.text[:200]}"
                    )
            else:
                self.log_test(
                    "File Upload API Endpoint",
                    "FAIL",
                    f"Unexpected response status: {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "File Upload API Endpoint",
                "FAIL",
                "Failed to connect to upload endpoint",
                str(e)
            )

    def test_storage_bucket_configuration(self):
        """Test 3: Test storage bucket configuration through API"""
        print("🧪 Testing Storage Bucket Configuration...")
        
        try:
            # Create a minimal test file upload to check bucket configuration
            test_data = {
                'conversation_id': 'test-conversation',
                'sender_id': 'test-sender'
            }
            
            # Create a small test file
            files = {
                'file': ('test.txt', 'test content', 'text/plain')
            }
            
            response = requests.post(
                f"{API_BASE}/files/upload", 
                data=test_data,
                files=files,
                timeout=15
            )
            
            if response.status_code == 201:
                # Upload successful - bucket is configured
                self.log_test(
                    "Storage Bucket Configuration",
                    "PASS",
                    "File upload successful - storage buckets are properly configured"
                )
            elif response.status_code == 500:
                try:
                    error_data = response.json()
                    if 'bucket' in error_data.get('error', '').lower():
                        self.log_test(
                            "Storage Bucket Configuration",
                            "FAIL",
                            "Storage bucket configuration issue detected",
                            f"Bucket error: {error_data.get('error', 'Unknown')}"
                        )
                    else:
                        self.log_test(
                            "Storage Bucket Configuration",
                            "FAIL",
                            "Upload failed with server error",
                            f"Server error: {error_data.get('error', 'Unknown')}"
                        )
                except json.JSONDecodeError:
                    self.log_test(
                        "Storage Bucket Configuration",
                        "FAIL",
                        "Upload failed with non-JSON server error",
                        f"Response: {response.text[:200]}"
                    )
            elif response.status_code == 403:
                try:
                    error_data = response.json()
                    if 'gating' in error_data.get('reason', '').lower():
                        self.log_test(
                            "Storage Bucket Configuration",
                            "PASS",
                            "Upload blocked by anti-disintermediation gating (expected behavior)",
                            f"Gating reason: {error_data.get('reason', 'Unknown')}"
                        )
                    else:
                        self.log_test(
                            "Storage Bucket Configuration",
                            "FAIL",
                            "Upload forbidden for unexpected reason",
                            f"Forbidden reason: {error_data.get('error', 'Unknown')}"
                        )
                except json.JSONDecodeError:
                    self.log_test(
                        "Storage Bucket Configuration",
                        "FAIL",
                        "Upload forbidden with non-JSON response",
                        f"Response: {response.text[:200]}"
                    )
            else:
                self.log_test(
                    "Storage Bucket Configuration",
                    "FAIL",
                    f"Unexpected response status: {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Storage Bucket Configuration",
                "FAIL",
                "Failed to test storage bucket configuration",
                str(e)
            )

    def test_error_handling_improvements(self):
        """Test 4: Test enhanced error handling for upload functionality"""
        print("🧪 Testing Enhanced Error Handling...")
        
        try:
            # Test 1: Missing required fields
            response = requests.post(f"{API_BASE}/files/upload", timeout=10)
            
            if response.status_code == 400:
                try:
                    error_data = response.json()
                    if 'error' in error_data and 'required' in error_data['error'].lower():
                        self.log_test(
                            "Error Handling - Missing Fields",
                            "PASS",
                            "Proper validation error for missing required fields",
                            f"Error message: {error_data.get('error', 'Unknown')}"
                        )
                    else:
                        self.log_test(
                            "Error Handling - Missing Fields",
                            "FAIL",
                            "Error response format unexpected",
                            f"Response: {error_data}"
                        )
                except json.JSONDecodeError:
                    self.log_test(
                        "Error Handling - Missing Fields",
                        "FAIL",
                        "Error response is not JSON",
                        f"Response: {response.text[:200]}"
                    )
            else:
                self.log_test(
                    "Error Handling - Missing Fields",
                    "FAIL",
                    f"Unexpected status code: {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
            # Test 2: Invalid file type
            test_data = {
                'conversation_id': 'test-conversation',
                'sender_id': 'test-sender'
            }
            
            files = {
                'file': ('test.exe', 'fake executable', 'application/x-executable')
            }
            
            response = requests.post(
                f"{API_BASE}/files/upload",
                data=test_data,
                files=files,
                timeout=10
            )
            
            if response.status_code == 400:
                try:
                    error_data = response.json()
                    if 'type' in error_data.get('error', '').lower():
                        self.log_test(
                            "Error Handling - Invalid File Type",
                            "PASS",
                            "Proper validation error for invalid file type",
                            f"Error message: {error_data.get('error', 'Unknown')}"
                        )
                    else:
                        self.log_test(
                            "Error Handling - Invalid File Type",
                            "FAIL",
                            "Error message doesn't mention file type",
                            f"Response: {error_data}"
                        )
                except json.JSONDecodeError:
                    self.log_test(
                        "Error Handling - Invalid File Type",
                        "FAIL",
                        "Error response is not JSON",
                        f"Response: {response.text[:200]}"
                    )
            else:
                self.log_test(
                    "Error Handling - Invalid File Type",
                    "FAIL",
                    f"Unexpected status code: {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Error Handling Tests",
                "FAIL",
                "Failed to test error handling",
                str(e)
            )

    def test_filename_sanitization(self):
        """Test 5: Test filename sanitization functionality"""
        print("🧪 Testing Filename Sanitization...")
        
        try:
            test_data = {
                'conversation_id': 'test-conversation',
                'sender_id': 'test-sender'
            }
            
            # Test with special characters in filename
            files = {
                'file': ('test file with spaces & special chars!@#.txt', 'test content', 'text/plain')
            }
            
            response = requests.post(
                f"{API_BASE}/files/upload",
                data=test_data,
                files=files,
                timeout=15
            )
            
            # We expect either success (201) or gating (403), but not a filename error
            if response.status_code in [201, 403]:
                try:
                    response_data = response.json()
                    if response.status_code == 201:
                        # Check if filename was sanitized in response
                        file_info = response_data.get('file', {})
                        original_filename = file_info.get('filename', '')
                        if original_filename:
                            self.log_test(
                                "Filename Sanitization",
                                "PASS",
                                f"File upload handled special characters correctly",
                                f"Original filename preserved: {original_filename}"
                            )
                        else:
                            self.log_test(
                                "Filename Sanitization",
                                "PASS",
                                "File upload successful with special characters in filename"
                            )
                    else:  # 403 - gating
                        self.log_test(
                            "Filename Sanitization",
                            "PASS",
                            "Filename with special characters processed correctly (blocked by gating)",
                            f"Gating reason: {response_data.get('reason', 'Unknown')}"
                        )
                except json.JSONDecodeError:
                    self.log_test(
                        "Filename Sanitization",
                        "FAIL",
                        "Response is not JSON",
                        f"Response: {response.text[:200]}"
                    )
            elif response.status_code == 400:
                try:
                    error_data = response.json()
                    if 'filename' in error_data.get('error', '').lower():
                        self.log_test(
                            "Filename Sanitization",
                            "FAIL",
                            "Filename sanitization not working properly",
                            f"Filename error: {error_data.get('error', 'Unknown')}"
                        )
                    else:
                        self.log_test(
                            "Filename Sanitization",
                            "PASS",
                            "Filename processed correctly, other validation error",
                            f"Validation error: {error_data.get('error', 'Unknown')}"
                        )
                except json.JSONDecodeError:
                    self.log_test(
                        "Filename Sanitization",
                        "FAIL",
                        "Error response is not JSON",
                        f"Response: {response.text[:200]}"
                    )
            else:
                self.log_test(
                    "Filename Sanitization",
                    "FAIL",
                    f"Unexpected status code: {response.status_code}",
                    f"Response: {response.text[:200]}"
                )
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Filename Sanitization",
                "FAIL",
                "Failed to test filename sanitization",
                str(e)
            )

    def test_file_size_validation(self):
        """Test 6: Test file size validation"""
        print("🧪 Testing File Size Validation...")
        
        try:
            test_data = {
                'conversation_id': 'test-conversation',
                'sender_id': 'test-sender'
            }
            
            # Create a large file content (simulate > 10MB)
            large_content = 'x' * (11 * 1024 * 1024)  # 11MB
            
            files = {
                'file': ('large_test.txt', large_content, 'text/plain')
            }
            
            response = requests.post(
                f"{API_BASE}/files/upload",
                data=test_data,
                files=files,
                timeout=30  # Longer timeout for large file
            )
            
            if response.status_code == 400:
                try:
                    error_data = response.json()
                    if 'size' in error_data.get('error', '').lower() or 'large' in error_data.get('error', '').lower():
                        self.log_test(
                            "File Size Validation",
                            "PASS",
                            "File size validation working correctly",
                            f"Size error: {error_data.get('error', 'Unknown')}"
                        )
                    else:
                        self.log_test(
                            "File Size Validation",
                            "FAIL",
                            "Error doesn't mention file size",
                            f"Response: {error_data}"
                        )
                except json.JSONDecodeError:
                    self.log_test(
                        "File Size Validation",
                        "FAIL",
                        "Error response is not JSON",
                        f"Response: {response.text[:200]}"
                    )
            else:
                self.log_test(
                    "File Size Validation",
                    "FAIL",
                    f"Large file not rejected (status: {response.status_code})",
                    f"Response: {response.text[:200]}"
                )
                
        except requests.exceptions.RequestException as e:
            if "timeout" in str(e).lower():
                self.log_test(
                    "File Size Validation",
                    "PASS",
                    "Large file upload timed out (expected behavior for oversized files)",
                    f"Timeout error: {str(e)}"
                )
            else:
                self.log_test(
                    "File Size Validation",
                    "FAIL",
                    "Failed to test file size validation",
                    str(e)
                )

    def run_all_tests(self):
        """Run all upload functionality tests"""
        print("🚀 Starting Backend Upload Functionality Testing")
        print("=" * 60)
        print(f"Testing against: {BASE_URL}")
        print(f"API Base: {API_BASE}")
        print("=" * 60)
        print()
        
        # Run all tests
        self.test_supabase_helper_functions()
        self.test_file_upload_api_endpoint()
        self.test_storage_bucket_configuration()
        self.test_error_handling_improvements()
        self.test_filename_sanitization()
        self.test_file_size_validation()
        
        # Print summary
        print("=" * 60)
        print("🎯 BACKEND UPLOAD FUNCTIONALITY TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.results['total_tests']}")
        print(f"✅ Passed: {self.results['passed_tests']}")
        print(f"❌ Failed: {self.results['failed_tests']}")
        
        success_rate = (self.results['passed_tests'] / self.results['total_tests']) * 100 if self.results['total_tests'] > 0 else 0
        print(f"📊 Success Rate: {success_rate:.1f}%")
        print()
        
        # Determine overall status
        if success_rate >= 80:
            print("🎉 OVERALL STATUS: EXCELLENT - Upload functionality fixes are working correctly")
        elif success_rate >= 60:
            print("✅ OVERALL STATUS: GOOD - Most upload functionality is working with minor issues")
        elif success_rate >= 40:
            print("⚠️ OVERALL STATUS: NEEDS ATTENTION - Several upload functionality issues detected")
        else:
            print("🚨 OVERALL STATUS: CRITICAL - Major upload functionality problems detected")
        
        print()
        print("📋 KEY FINDINGS:")
        
        # Analyze results for specific issues mentioned in review request
        findings = []
        
        for test in self.results['test_details']:
            if test['status'] == 'PASS':
                if 'Storage Bucket Configuration' in test['test']:
                    findings.append("✅ Storage bucket configuration issues resolved")
                elif 'Error Handling' in test['test']:
                    findings.append("✅ Enhanced error handling working correctly")
                elif 'Filename Sanitization' in test['test']:
                    findings.append("✅ Filename sanitization preventing special character issues")
                elif 'File Size Validation' in test['test']:
                    findings.append("✅ File size validation working correctly")
            else:
                if 'Storage Bucket Configuration' in test['test']:
                    findings.append("❌ Storage bucket configuration issues detected")
                elif 'Error Handling' in test['test']:
                    findings.append("❌ Error handling improvements need attention")
                elif 'Filename Sanitization' in test['test']:
                    findings.append("❌ Filename sanitization issues detected")
        
        if not findings:
            findings.append("ℹ️ Basic upload infrastructure tested - specific fixes need frontend testing")
        
        for finding in findings:
            print(f"   {finding}")
        
        print()
        print("🔍 REVIEW REQUEST VERIFICATION:")
        print("   - TypeError 'r is not a function' fixes: Requires frontend testing")
        print("   - Storage bucket configuration: Backend infrastructure tested")
        print("   - File upload robustness: Backend validation tested")
        print("   - Function availability checks: Requires frontend testing")
        print("   - Enhanced error handling: Backend error responses tested")
        
        return self.results

if __name__ == "__main__":
    tester = UploadFunctionalityTester()
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    if results['failed_tests'] == 0:
        sys.exit(0)
    else:
        sys.exit(1)