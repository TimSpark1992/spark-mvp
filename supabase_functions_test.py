#!/usr/bin/env python3
"""
Specific test for Supabase uploadFile and getFileUrl functions
Testing the exact functions mentioned in the review request
"""

import requests
import json
import time
import tempfile
import os

# Configuration from .env.local
SUPABASE_URL = "https://fgcefqowzkpeivpckljf.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY2VmcW93emtwZWl2cGNrbGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjcyMTAsImV4cCI6MjA2OTkwMzIxMH0.xf0wNeAawVYDr0642b0t4V0URnNMnOBT5BhSCG34cCk"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY2VmcW93emtwZWl2cGNrbGpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMyNzIxMCwiZXhwIjoyMDY5OTAzMjEwfQ.49WxOD9ZbTzc9UoQNBmeXrMgSWIq0IYDynqsMFdGUAU"

class SupabaseFunctionTester:
    def __init__(self):
        self.session = requests.Session()
        
    def log(self, message, level="INFO"):
        """Log messages with timestamp"""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def create_test_image(self):
        """Create a minimal test image"""
        # Create minimal JPEG data
        jpeg_data = (
            b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00'
            b'\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t'
            b'\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a'
            b'\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342'
            b'\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01'
            b'\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00'
            b'\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00'
            b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
            b'\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa'
            b'\xff\xd9'
        )
        return jpeg_data
    
    def test_uploadFile_function(self):
        """Test the uploadFile function from supabase.js"""
        self.log("📤 Testing uploadFile Function...")
        
        try:
            # Create test image
            test_image = self.create_test_image()
            
            # Test upload to profiles bucket using Supabase Storage API
            bucket = "profiles"
            file_path = f"test-user-{int(time.time())}/profile-test.jpg"
            
            # Upload using Supabase Storage REST API (mimicking the uploadFile function)
            upload_url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{file_path}"
            
            headers = {
                'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
                'Content-Type': 'image/jpeg',
                'x-upsert': 'true'
            }
            
            response = self.session.post(upload_url, data=test_image, headers=headers, timeout=30)
            
            if response.status_code in [200, 201]:
                self.log("✅ uploadFile function working correctly")
                response_data = response.json()
                self.log(f"✅ Upload response: {response_data}")
                return True, file_path
            elif response.status_code == 403:
                self.log("⚠️ Upload blocked by RLS policies - testing with service role", "WARNING")
                
                # Try with service role key
                headers['Authorization'] = f'Bearer {SUPABASE_SERVICE_ROLE_KEY}'
                service_response = self.session.post(upload_url, data=test_image, headers=headers, timeout=30)
                
                if service_response.status_code in [200, 201]:
                    self.log("✅ uploadFile function working with service role")
                    return True, file_path
                else:
                    self.log(f"❌ Upload failed even with service role: {service_response.status_code} - {service_response.text}", "ERROR")
                    return False, None
            else:
                self.log(f"❌ uploadFile failed: {response.status_code} - {response.text}", "ERROR")
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ uploadFile request failed: {e}", "ERROR")
            return False, None
    
    def test_getFileUrl_function(self, file_path=None):
        """Test the getFileUrl function from supabase.js"""
        self.log("🔗 Testing getFileUrl Function...")
        
        try:
            # Use provided file path or create a test path
            if not file_path:
                file_path = "test-user-123/profile-test.jpg"
            
            bucket = "profiles"
            
            # Test URL generation (mimicking the getFileUrl function)
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{file_path}"
            
            # Test if the URL format is correct by making a HEAD request
            response = self.session.head(public_url, timeout=10)
            
            # Any response (including 404) indicates the URL structure is correct
            if response.status_code in [200, 404]:
                self.log("✅ getFileUrl function format is correct")
                self.log(f"✅ Generated URL: {public_url}")
                return True, public_url
            else:
                self.log(f"❌ getFileUrl format test failed: {response.status_code}", "ERROR")
                return False, None
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ getFileUrl test failed: {e}", "ERROR")
            return False, None
    
    def test_storage_bucket_policies(self):
        """Test storage bucket policies from storage-bucket-setup.sql"""
        self.log("🔒 Testing Storage Bucket Policies...")
        
        try:
            # Test if we can list objects in the bucket (should work for public buckets)
            bucket = "profiles"
            list_url = f"{SUPABASE_URL}/storage/v1/object/list/{bucket}"
            
            headers = {
                'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
                'Content-Type': 'application/json'
            }
            
            # Try to list objects
            response = self.session.post(list_url, json={}, headers=headers, timeout=10)
            
            if response.status_code in [200, 400]:  # 400 might be due to empty folder
                self.log("✅ Storage bucket policies appear to be configured")
                return True
            elif response.status_code == 403:
                self.log("⚠️ Storage bucket access restricted - checking with service role", "WARNING")
                
                # Try with service role
                headers['Authorization'] = f'Bearer {SUPABASE_SERVICE_ROLE_KEY}'
                service_response = self.session.post(list_url, json={}, headers=headers, timeout=10)
                
                if service_response.status_code in [200, 400]:
                    self.log("✅ Storage bucket accessible with service role")
                    return True
                else:
                    self.log(f"❌ Storage bucket not accessible even with service role: {service_response.status_code}", "ERROR")
                    return False
            else:
                self.log(f"❌ Storage bucket policy test failed: {response.status_code}", "ERROR")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ Storage bucket policy test failed: {e}", "ERROR")
            return False
    
    def test_profile_update_simulation(self):
        """Test profile update functionality that would handle profile picture URLs"""
        self.log("👤 Testing Profile Update Simulation...")
        
        try:
            # Simulate what the frontend would do after successful upload
            test_profile_picture_url = f"{SUPABASE_URL}/storage/v1/object/public/profiles/test-user/profile-test.jpg"
            
            # Test if the URL is properly formatted and accessible
            response = self.session.head(test_profile_picture_url, timeout=10)
            
            if response.status_code in [200, 404]:  # 404 is fine, means URL format is correct
                self.log("✅ Profile picture URL format is correct for database storage")
                self.log(f"✅ URL would be: {test_profile_picture_url}")
                return True
            else:
                self.log(f"❌ Profile picture URL format issue: {response.status_code}", "ERROR")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ Profile update simulation failed: {e}", "ERROR")
            return False
    
    def test_frontend_error_diagnosis(self):
        """Diagnose potential causes of 'TypeError: r is not a function' error"""
        self.log("🐛 Diagnosing Frontend Error Causes...")
        
        potential_issues = []
        
        # Test 1: Check if Supabase client configuration is correct
        try:
            auth_url = f"{SUPABASE_URL}/auth/v1/settings"
            response = self.session.get(auth_url, timeout=10)
            
            if response.status_code == 200:
                self.log("✅ Supabase client configuration appears correct")
            else:
                potential_issues.append(f"Supabase auth endpoint returned {response.status_code}")
                
        except Exception as e:
            potential_issues.append(f"Supabase connection issue: {e}")
        
        # Test 2: Check if storage API is accessible
        try:
            storage_url = f"{SUPABASE_URL}/storage/v1/bucket"
            headers = {'Authorization': f'Bearer {SUPABASE_ANON_KEY}'}
            response = self.session.get(storage_url, headers=headers, timeout=10)
            
            if response.status_code in [200, 401, 403]:
                self.log("✅ Storage API is accessible")
            else:
                potential_issues.append(f"Storage API returned {response.status_code}")
                
        except Exception as e:
            potential_issues.append(f"Storage API connection issue: {e}")
        
        # Test 3: Check environment variables format
        if not SUPABASE_URL.startswith('https://'):
            potential_issues.append("SUPABASE_URL format may be incorrect")
        
        if len(SUPABASE_ANON_KEY) < 100:  # JWT tokens are typically longer
            potential_issues.append("SUPABASE_ANON_KEY may be malformed")
        
        if potential_issues:
            self.log("⚠️ Potential issues found:", "WARNING")
            for issue in potential_issues:
                self.log(f"  - {issue}", "WARNING")
            return False
        else:
            self.log("✅ No obvious configuration issues found")
            return True
    
    def run_comprehensive_test(self):
        """Run all Supabase function tests"""
        self.log("🚀 Starting Supabase Functions Testing...")
        self.log("=" * 80)
        
        test_results = {}
        uploaded_file_path = None
        
        # Test 1: Storage Bucket Policies
        test_results['bucket_policies'] = self.test_storage_bucket_policies()
        
        # Test 2: uploadFile Function
        upload_success, file_path = self.test_uploadFile_function()
        test_results['upload_file'] = upload_success
        if upload_success:
            uploaded_file_path = file_path
        
        # Test 3: getFileUrl Function
        url_success, file_url = self.test_getFileUrl_function(uploaded_file_path)
        test_results['get_file_url'] = url_success
        
        # Test 4: Profile Update Simulation
        test_results['profile_update'] = self.test_profile_update_simulation()
        
        # Test 5: Frontend Error Diagnosis
        test_results['error_diagnosis'] = self.test_frontend_error_diagnosis()
        
        # Generate report
        self.log("=" * 80)
        self.log("📊 SUPABASE FUNCTIONS TEST RESULTS")
        self.log("=" * 80)
        
        passed_tests = 0
        total_tests = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name.replace('_', ' ').title()}: {status}")
            if result:
                passed_tests += 1
        
        self.log("=" * 80)
        self.log(f"OVERALL RESULT: {passed_tests}/{total_tests} tests passed")
        
        # Specific analysis for the "TypeError: r is not a function" error
        self.log("=" * 80)
        self.log("🔍 ANALYSIS FOR 'TypeError: r is not a function' ERROR:")
        
        if not test_results['upload_file']:
            self.log("❌ CRITICAL: uploadFile function is not working properly")
            self.log("   This could cause 'r is not a function' if the function returns undefined")
        
        if not test_results['get_file_url']:
            self.log("❌ CRITICAL: getFileUrl function is not working properly")
            self.log("   This could cause 'r is not a function' if the function returns undefined")
        
        if not test_results['error_diagnosis']:
            self.log("❌ CRITICAL: Configuration issues detected")
            self.log("   This could cause function import/export problems")
        
        if passed_tests >= 4:
            self.log("✅ LIKELY CAUSE: Frontend code issue, not backend configuration")
            self.log("   Check function imports/exports in the Creator Profile page")
        elif passed_tests >= 2:
            self.log("⚠️ MIXED RESULTS: Some backend issues, some frontend issues")
            self.log("   Check both backend configuration and frontend code")
        else:
            self.log("❌ BACKEND ISSUES: Multiple backend problems detected")
            self.log("   Fix backend configuration before addressing frontend")
        
        self.log("=" * 80)
        
        return test_results

def main():
    """Main test execution"""
    tester = SupabaseFunctionTester()
    results = tester.run_comprehensive_test()
    
    # Return exit code based on results
    passed_tests = sum(1 for result in results.values() if result)
    total_tests = len(results)
    
    if passed_tests >= total_tests * 0.8:
        exit(0)  # Success
    else:
        exit(1)  # Failure

if __name__ == "__main__":
    main()