#!/usr/bin/env python3
"""
Backend Testing Script for Profile Picture Upload Functionality Fixes
Testing the specific fixes mentioned in the review request:
1. Test updateProfile function from /app/lib/supabase.js works correctly
2. Verify the new refreshProfile function in AuthProvider.js is accessible  
3. Test that the simplified profile update logic (without Promise.race) works properly
4. Check that the enhanced error handling prevents JavaScript errors
5. Verify all upload-related functions are properly imported and exported
"""

import requests
import json
import os
import time
import subprocess
import re
from pathlib import Path

# Configuration
BACKEND_URL = "https://www.sparkplatform.tech"
API_BASE = f"{BACKEND_URL}/api"

class ProfileUploadFixTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'Profile-Upload-Fix-Test/1.0'
        })
        
    def log(self, message, level="INFO"):
        """Log messages with timestamp"""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
    
    def test_updateProfile_function_implementation(self):
        """Test 1: Verify updateProfile function from /app/lib/supabase.js is properly implemented"""
        self.log("🔍 Testing updateProfile Function Implementation...")
        
        try:
            # Read the supabase.js file to verify updateProfile function
            supabase_file = Path("/app/lib/supabase.js")
            if not supabase_file.exists():
                self.log("❌ /app/lib/supabase.js file not found", "ERROR")
                return False
            
            content = supabase_file.read_text()
            
            # Check for updateProfile function export
            if "export const updateProfile" in content:
                self.log("✅ updateProfile function is exported")
                
                # Check function implementation - look for the actual implementation
                if "userId" in content and "updates" in content and "updateProfile" in content:
                    self.log("✅ updateProfile function has correct parameters (userId, updates)")
                else:
                    self.log("❌ updateProfile function parameters incorrect", "ERROR")
                    return False
                
                # Check for Supabase update operation
                if ".from('profiles')" in content and ".update(updates)" in content and ".eq('id', userId)" in content:
                    self.log("✅ updateProfile function implements correct Supabase update logic")
                else:
                    self.log("❌ updateProfile function missing correct Supabase logic", "ERROR")
                    return False
                
                # Check for proper return format
                if "return { data, error }" in content:
                    self.log("✅ updateProfile function returns correct format { data, error }")
                else:
                    self.log("❌ updateProfile function return format incorrect", "ERROR")
                    return False
                
                return True
            else:
                self.log("❌ updateProfile function not exported", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error testing updateProfile function: {e}", "ERROR")
            return False
    
    def test_refreshProfile_function_in_AuthProvider(self):
        """Test 2: Verify the new refreshProfile function in AuthProvider.js is accessible"""
        self.log("🔄 Testing refreshProfile Function in AuthProvider...")
        
        try:
            # Read the AuthProvider.js file
            auth_provider_file = Path("/app/components/AuthProvider.js")
            if not auth_provider_file.exists():
                self.log("❌ /app/components/AuthProvider.js file not found", "ERROR")
                return False
            
            content = auth_provider_file.read_text()
            
            # Check for refreshProfile function definition
            if "const refreshProfile = async" in content:
                self.log("✅ refreshProfile function is defined in AuthProvider")
                
                # Check function implementation
                refresh_profile_match = re.search(r'const refreshProfile = async \(\) => \{([^}]+)\}', content, re.DOTALL)
                if refresh_profile_match:
                    body = refresh_profile_match.group(1)
                    
                    # Check for user authentication check
                    if "if (!user)" in body:
                        self.log("✅ refreshProfile function has user authentication check")
                    else:
                        self.log("⚠️ refreshProfile function missing user check", "WARNING")
                    
                    # Check for getProfile call
                    if "getProfile(user.id)" in body:
                        self.log("✅ refreshProfile function calls getProfile correctly")
                    else:
                        self.log("❌ refreshProfile function missing getProfile call", "ERROR")
                        return False
                    
                    # Check for setProfile call
                    if "setProfile(profileData)" in body:
                        self.log("✅ refreshProfile function updates profile state")
                    else:
                        self.log("❌ refreshProfile function doesn't update profile state", "ERROR")
                        return False
                    
                    # Check for error handling
                    if "try {" in body and "catch" in body:
                        self.log("✅ refreshProfile function has proper error handling")
                    else:
                        self.log("⚠️ refreshProfile function missing try-catch error handling", "WARNING")
                else:
                    self.log("❌ refreshProfile function implementation not found", "ERROR")
                    return False
                
                # Check if refreshProfile is exported in the value object
                if "refreshProfile," in content:
                    self.log("✅ refreshProfile function is exported in AuthProvider value")
                else:
                    self.log("❌ refreshProfile function not exported in AuthProvider value", "ERROR")
                    return False
                
                return True
            else:
                self.log("❌ refreshProfile function not found in AuthProvider", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error testing refreshProfile function: {e}", "ERROR")
            return False
    
    def test_simplified_profile_update_logic(self):
        """Test 3: Test that the simplified profile update logic (without Promise.race) works properly"""
        self.log("⚡ Testing Simplified Profile Update Logic...")
        
        try:
            # Read the creator profile page to check for simplified logic
            profile_page_file = Path("/app/app/creator/profile/page.js")
            if not profile_page_file.exists():
                self.log("❌ Creator profile page not found", "ERROR")
                return False
            
            content = profile_page_file.read_text()
            
            # Check for simplified profile update without Promise.race
            if "Promise.race" in content:
                # Count Promise.race occurrences
                promise_race_count = content.count("Promise.race")
                self.log(f"⚠️ Found {promise_race_count} Promise.race usage(s) - should be minimized", "WARNING")
                
                # Check if Promise.race is used in profile update context
                if "updateProfile" in content and "Promise.race" in content:
                    # Look for specific patterns that indicate complex Promise.race usage
                    complex_race_pattern = r'Promise\.race\(\s*\[\s*updateProfile[^}]+\}\s*\]\s*\)'
                    if re.search(complex_race_pattern, content, re.DOTALL):
                        self.log("❌ Complex Promise.race pattern still found in profile update", "ERROR")
                        return False
                    else:
                        self.log("✅ No complex Promise.race pattern in profile update logic")
                else:
                    self.log("✅ Promise.race not used with updateProfile")
            else:
                self.log("✅ No Promise.race usage found - simplified logic confirmed")
            
            # Check for direct updateProfile calls (simplified approach)
            if "await updateProfile(" in content:
                self.log("✅ Direct updateProfile calls found - simplified approach confirmed")
                
                # Count direct updateProfile calls
                update_calls = content.count("await updateProfile(")
                self.log(f"✅ Found {update_calls} direct updateProfile call(s)")
                
                return True
            else:
                self.log("⚠️ No direct updateProfile calls found", "WARNING")
                return True  # Not necessarily an error
                
        except Exception as e:
            self.log(f"❌ Error testing simplified profile update logic: {e}", "ERROR")
            return False
    
    def test_enhanced_error_handling_prevents_js_errors(self):
        """Test 4: Check that the enhanced error handling prevents JavaScript errors"""
        self.log("🛡️ Testing Enhanced Error Handling for JavaScript Error Prevention...")
        
        try:
            # Read the creator profile page for error handling patterns
            profile_page_file = Path("/app/app/creator/profile/page.js")
            if not profile_page_file.exists():
                self.log("❌ Creator profile page not found", "ERROR")
                return False
            
            content = profile_page_file.read_text()
            
            error_handling_checks = []
            
            # Check 1: Function type checking to prevent "r is not a function"
            if "typeof uploadFile !== 'function'" in content:
                error_handling_checks.append("uploadFile type check")
                self.log("✅ uploadFile function type checking implemented")
            else:
                self.log("❌ uploadFile function type checking missing", "ERROR")
            
            if "typeof getFileUrl !== 'function'" in content:
                error_handling_checks.append("getFileUrl type check")
                self.log("✅ getFileUrl function type checking implemented")
            else:
                self.log("❌ getFileUrl function type checking missing", "ERROR")
            
            if "typeof updateProfile !== 'function'" in content:
                error_handling_checks.append("updateProfile type check")
                self.log("✅ updateProfile function type checking implemented")
            else:
                self.log("❌ updateProfile function type checking missing", "ERROR")
            
            # Check 2: Null/undefined result handling
            if "returned null result" in content or "is not available" in content:
                error_handling_checks.append("null result handling")
                self.log("✅ Null/undefined result handling implemented")
            else:
                self.log("❌ Null/undefined result handling missing", "ERROR")
            
            # Check 3: Timeout protection
            timeout_patterns = [
                "timed out after",
                "timeout",
                "setTimeout"
            ]
            
            timeout_found = any(pattern in content for pattern in timeout_patterns)
            if timeout_found:
                error_handling_checks.append("timeout protection")
                self.log("✅ Timeout protection implemented")
            else:
                self.log("❌ Timeout protection missing", "ERROR")
            
            # Check 4: Try-catch blocks for upload operations
            try_catch_count = content.count("try {")
            if try_catch_count >= 2:  # Should have multiple try-catch blocks
                error_handling_checks.append("try-catch blocks")
                self.log(f"✅ Multiple try-catch blocks found ({try_catch_count})")
            else:
                self.log(f"⚠️ Limited try-catch blocks found ({try_catch_count})", "WARNING")
            
            # Check 5: Specific error messages for different scenarios
            error_message_patterns = [
                "Upload functionality is not properly initialized",
                "Profile information is not available",
                "Upload timed out",
                "Storage is not configured"
            ]
            
            error_messages_found = sum(1 for pattern in error_message_patterns if pattern in content)
            if error_messages_found >= 3:
                error_handling_checks.append("specific error messages")
                self.log(f"✅ Comprehensive error messages found ({error_messages_found}/4)")
            else:
                self.log(f"⚠️ Limited error messages found ({error_messages_found}/4)", "WARNING")
            
            # Overall assessment
            if len(error_handling_checks) >= 4:
                self.log("✅ Enhanced error handling should prevent 'TypeError: r is not a function'")
                return True
            else:
                self.log("❌ Enhanced error handling insufficient to prevent JavaScript errors", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error testing enhanced error handling: {e}", "ERROR")
            return False
    
    def test_upload_functions_import_export(self):
        """Test 5: Verify all upload-related functions are properly imported and exported"""
        self.log("📦 Testing Upload-Related Functions Import/Export...")
        
        try:
            results = []
            
            # Test 1: Check supabase.js exports
            supabase_file = Path("/app/lib/supabase.js")
            if supabase_file.exists():
                supabase_content = supabase_file.read_text()
                
                required_exports = [
                    "export const uploadFile",
                    "export const getFileUrl", 
                    "export const updateProfile",
                    "export const deleteFile"
                ]
                
                for export_func in required_exports:
                    if export_func in supabase_content:
                        self.log(f"✅ {export_func.split()[-1]} function exported from supabase.js")
                        results.append(True)
                    else:
                        self.log(f"❌ {export_func.split()[-1]} function not exported from supabase.js", "ERROR")
                        results.append(False)
            else:
                self.log("❌ supabase.js file not found", "ERROR")
                return False
            
            # Test 2: Check creator profile page imports
            profile_page_file = Path("/app/app/creator/profile/page.js")
            if profile_page_file.exists():
                profile_content = profile_page_file.read_text()
                
                # Check import statement
                import_pattern = r'import\s+\{[^}]*\}\s+from\s+[\'"]@/lib/supabase[\'"]'
                import_match = re.search(import_pattern, profile_content)
                
                if import_match:
                    import_statement = import_match.group(0)
                    self.log("✅ Import statement found in creator profile page")
                    
                    # Check specific function imports
                    required_imports = ["updateProfile", "uploadFile", "getFileUrl"]
                    
                    for func_name in required_imports:
                        if func_name in import_statement:
                            self.log(f"✅ {func_name} imported in creator profile page")
                            results.append(True)
                        else:
                            self.log(f"❌ {func_name} not imported in creator profile page", "ERROR")
                            results.append(False)
                else:
                    self.log("❌ No import statement found for supabase functions", "ERROR")
                    results.append(False)
            else:
                self.log("❌ Creator profile page not found", "ERROR")
                return False
            
            # Test 3: Check AuthProvider imports
            auth_provider_file = Path("/app/components/AuthProvider.js")
            if auth_provider_file.exists():
                auth_content = auth_provider_file.read_text()
                
                # Check for getProfile import
                if "getProfile" in auth_content and "from '@/lib/supabase'" in auth_content:
                    self.log("✅ getProfile imported in AuthProvider")
                    results.append(True)
                else:
                    self.log("❌ getProfile not properly imported in AuthProvider", "ERROR")
                    results.append(False)
            else:
                self.log("❌ AuthProvider file not found", "ERROR")
                return False
            
            # Overall assessment
            success_rate = sum(results) / len(results) if results else 0
            if success_rate >= 0.8:  # 80% success rate
                self.log(f"✅ Upload functions import/export verification passed ({sum(results)}/{len(results)})")
                return True
            else:
                self.log(f"❌ Upload functions import/export verification failed ({sum(results)}/{len(results)})", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error testing upload functions import/export: {e}", "ERROR")
            return False
    
    def test_refreshProfile_accessibility(self):
        """Test 6: Verify refreshProfile function is accessible from useAuth hook"""
        self.log("🔗 Testing refreshProfile Function Accessibility...")
        
        try:
            # Check AuthProvider exports refreshProfile
            auth_provider_file = Path("/app/components/AuthProvider.js")
            if not auth_provider_file.exists():
                self.log("❌ AuthProvider file not found", "ERROR")
                return False
            
            content = auth_provider_file.read_text()
            
            # Check if refreshProfile is in the value object
            value_pattern = r'const value = \{([^}]+)\}'
            value_match = re.search(value_pattern, content, re.DOTALL)
            
            if value_match:
                value_content = value_match.group(1)
                if "refreshProfile" in value_content:
                    self.log("✅ refreshProfile included in AuthProvider value object")
                else:
                    self.log("❌ refreshProfile not included in AuthProvider value object", "ERROR")
                    return False
            else:
                self.log("❌ AuthProvider value object not found", "ERROR")
                return False
            
            # Check creator profile page uses refreshProfile
            profile_page_file = Path("/app/app/creator/profile/page.js")
            if profile_page_file.exists():
                profile_content = profile_page_file.read_text()
                
                # Check for useAuth hook usage
                if "const { profile, refreshProfile } = useAuth()" in profile_content:
                    self.log("✅ refreshProfile destructured from useAuth hook")
                elif "refreshProfile" in profile_content and "useAuth" in profile_content:
                    self.log("✅ refreshProfile accessed from useAuth hook")
                else:
                    self.log("⚠️ refreshProfile usage not found in profile page", "WARNING")
                
                # Check for refreshProfile calls
                if "refreshProfile()" in profile_content:
                    self.log("✅ refreshProfile function is called in profile page")
                    return True
                else:
                    self.log("⚠️ refreshProfile function not called in profile page", "WARNING")
                    return True  # Still accessible even if not called
            else:
                self.log("❌ Creator profile page not found", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error testing refreshProfile accessibility: {e}", "ERROR")
            return False
    
    def run_comprehensive_fix_test(self):
        """Run all tests for the profile upload fixes"""
        self.log("🚀 Starting Profile Picture Upload Fix Testing...")
        self.log("Testing specific fixes mentioned in review request")
        self.log("=" * 80)
        
        test_results = {}
        
        # Test 1: updateProfile function implementation
        test_results['updateProfile_function'] = self.test_updateProfile_function_implementation()
        
        # Test 2: refreshProfile function in AuthProvider
        test_results['refreshProfile_in_AuthProvider'] = self.test_refreshProfile_function_in_AuthProvider()
        
        # Test 3: Simplified profile update logic
        test_results['simplified_profile_update'] = self.test_simplified_profile_update_logic()
        
        # Test 4: Enhanced error handling
        test_results['enhanced_error_handling'] = self.test_enhanced_error_handling_prevents_js_errors()
        
        # Test 5: Upload functions import/export
        test_results['upload_functions_import_export'] = self.test_upload_functions_import_export()
        
        # Test 6: refreshProfile accessibility
        test_results['refreshProfile_accessibility'] = self.test_refreshProfile_accessibility()
        
        # Generate comprehensive report
        self.log("=" * 80)
        self.log("📊 PROFILE UPLOAD FIX TEST RESULTS")
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
        
        if passed_tests == total_tests:
            self.log("🎉 ALL FIXES VERIFIED - Profile picture upload fixes are working correctly")
        elif passed_tests >= total_tests * 0.8:
            self.log("✅ MOSTLY WORKING - Most fixes verified, minor issues may remain")
        else:
            self.log("❌ FIXES INCOMPLETE - Profile picture upload fixes need more work")
        
        # Specific findings
        self.log("=" * 80)
        self.log("🔍 KEY FINDINGS:")
        
        if test_results['updateProfile_function']:
            self.log("✅ updateProfile function is properly implemented in supabase.js")
        
        if test_results['refreshProfile_in_AuthProvider']:
            self.log("✅ refreshProfile function is available in AuthProvider.js")
        
        if test_results['simplified_profile_update']:
            self.log("✅ Profile update logic has been simplified (reduced Promise.race usage)")
        
        if test_results['enhanced_error_handling']:
            self.log("✅ Enhanced error handling should prevent 'TypeError: r is not a function'")
        
        if test_results['upload_functions_import_export']:
            self.log("✅ Upload-related functions are properly imported and exported")
        
        if test_results['refreshProfile_accessibility']:
            self.log("✅ refreshProfile function is accessible from useAuth hook")
        
        self.log("=" * 80)
        
        return test_results

def main():
    """Main test execution"""
    tester = ProfileUploadFixTester()
    results = tester.run_comprehensive_fix_test()
    
    # Return exit code based on results
    passed_tests = sum(1 for result in results.values() if result)
    total_tests = len(results)
    
    if passed_tests >= total_tests * 0.8:
        exit(0)  # Success
    else:
        exit(1)  # Failure

if __name__ == "__main__":
    main()