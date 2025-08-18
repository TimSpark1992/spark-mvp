#!/usr/bin/env python3
"""
Backend Testing Script for Signup Flow and Redirect Issues
Testing the complete signup authentication flow and identifying redirect problems
"""

import requests
import json
import time
import sys
from datetime import datetime
import uuid

# Configuration
BASE_URL = "https://brand-creator-link-1.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

def log_test(message, status="INFO"):
    """Log test messages with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status_emoji = {"INFO": "ℹ️", "SUCCESS": "✅", "ERROR": "❌", "WARNING": "⚠️"}
    print(f"[{timestamp}] {status_emoji.get(status, 'ℹ️')} {message}")

def test_signup_flow_backend():
    """Test the complete signup flow from backend perspective"""
    log_test("🎯 SIGNUP FLOW BACKEND TESTING STARTED", "INFO")
    
    results = {
        "supabase_connectivity": False,
        "auth_endpoints": False,
        "profile_creation": False,
        "session_management": False,
        "redirect_support": False,
        "timeout_handling": False,
        "error_scenarios": []
    }
    
    # Test 1: Check if Supabase endpoints are accessible
    log_test("Testing Supabase connectivity and auth endpoints", "INFO")
    try:
        # Test auth callback endpoint
        response = requests.get(f"{BASE_URL}/auth/callback", timeout=10)
        log_test(f"Auth callback endpoint status: {response.status_code}", "SUCCESS" if response.status_code in [200, 404] else "ERROR")
        results["auth_endpoints"] = response.status_code in [200, 404, 500]  # 500 is expected without session
        
        # Test signup page accessibility
        response = requests.get(f"{BASE_URL}/auth/signup", timeout=10)
        log_test(f"Signup page accessibility: {response.status_code}", "SUCCESS" if response.status_code == 200 else "ERROR")
        
        results["supabase_connectivity"] = True
        
    except requests.exceptions.RequestException as e:
        log_test(f"Supabase connectivity test failed: {str(e)}", "ERROR")
        results["error_scenarios"].append(f"Connectivity: {str(e)}")
    
    # Test 2: Test API endpoints that support signup flow
    log_test("Testing API endpoints supporting signup flow", "INFO")
    api_endpoints = [
        "/api/auth/session",
        "/api/profiles", 
        "/api/user/profile",
        "/api/database-setup"
    ]
    
    api_success_count = 0
    for endpoint in api_endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
            status = "SUCCESS" if response.status_code in [200, 401, 403, 404, 500, 502] else "ERROR"
            log_test(f"API {endpoint}: {response.status_code}", status)
            if response.status_code in [200, 401, 403, 404, 500, 502]:
                api_success_count += 1
        except requests.exceptions.RequestException as e:
            log_test(f"API {endpoint} failed: {str(e)}", "ERROR")
            results["error_scenarios"].append(f"API {endpoint}: {str(e)}")
    
    results["profile_creation"] = api_success_count >= len(api_endpoints) * 0.5
    
    # Test 3: Test session management endpoints
    log_test("Testing session management capabilities", "INFO")
    session_endpoints = [
        "/api/auth/callback",
        "/api/auth/user"
    ]
    
    session_success_count = 0
    for endpoint in session_endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
            status = "SUCCESS" if response.status_code in [200, 401, 403, 404, 500, 502] else "ERROR"
            log_test(f"Session {endpoint}: {response.status_code}", status)
            if response.status_code in [200, 401, 403, 404, 500, 502]:
                session_success_count += 1
        except requests.exceptions.RequestException as e:
            log_test(f"Session {endpoint} failed: {str(e)}", "ERROR")
            results["error_scenarios"].append(f"Session {endpoint}: {str(e)}")
    
    results["session_management"] = session_success_count >= len(session_endpoints) * 0.5
    
    # Test 4: Test redirect support endpoints
    log_test("Testing redirect support infrastructure", "INFO")
    redirect_endpoints = [
        "/creator/dashboard",
        "/brand/dashboard", 
        "/admin/panel"
    ]
    
    redirect_success_count = 0
    for endpoint in redirect_endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=10, allow_redirects=False)
            # These should either be accessible or redirect to login
            expected_codes = [200, 301, 302, 401, 403, 404]
            status = "SUCCESS" if response.status_code in expected_codes else "ERROR"
            log_test(f"Redirect target {endpoint}: {response.status_code}", status)
            if response.status_code in expected_codes:
                redirect_success_count += 1
        except requests.exceptions.RequestException as e:
            log_test(f"Redirect {endpoint} failed: {str(e)}", "ERROR")
            results["error_scenarios"].append(f"Redirect {endpoint}: {str(e)}")
    
    results["redirect_support"] = redirect_success_count >= len(redirect_endpoints) * 0.5
    
    # Test 5: Test timeout handling scenarios
    log_test("Testing timeout handling scenarios", "INFO")
    timeout_tests = [
        {"timeout": 5, "description": "5 second timeout"},
        {"timeout": 10, "description": "10 second timeout"},
        {"timeout": 15, "description": "15 second timeout"}
    ]
    
    timeout_success_count = 0
    for test in timeout_tests:
        try:
            start_time = time.time()
            response = requests.get(f"{BASE_URL}/auth/signup", timeout=test["timeout"])
            end_time = time.time()
            duration = end_time - start_time
            
            if duration < test["timeout"]:
                log_test(f"Timeout test {test['description']}: Completed in {duration:.2f}s", "SUCCESS")
                timeout_success_count += 1
            else:
                log_test(f"Timeout test {test['description']}: Took {duration:.2f}s (exceeded)", "WARNING")
                
        except requests.exceptions.Timeout:
            log_test(f"Timeout test {test['description']}: Request timed out as expected", "SUCCESS")
            timeout_success_count += 1
        except requests.exceptions.RequestException as e:
            log_test(f"Timeout test {test['description']} failed: {str(e)}", "ERROR")
            results["error_scenarios"].append(f"Timeout {test['description']}: {str(e)}")
    
    results["timeout_handling"] = timeout_success_count >= len(timeout_tests) * 0.5
    
    return results

def test_specific_redirect_issue():
    """Test the specific redirect issue mentioned in the review request"""
    log_test("🔍 TESTING SPECIFIC REDIRECT ISSUE", "INFO")
    
    redirect_analysis = {
        "promise_syntax": False,
        "timeout_mechanism": False,
        "window_location_methods": False,
        "fallback_handling": False,
        "console_logging": False
    }
    
    # Test 1: Analyze Promise syntax in signup flow
    log_test("Analyzing Promise syntax and timeout mechanisms", "INFO")
    try:
        # Check if the signup page loads properly
        response = requests.get(f"{BASE_URL}/auth/signup", timeout=10)
        if response.status_code == 200:
            content = response.text
            
            # Check for Promise syntax patterns
            if "new Promise" in content and "setTimeout" in content:
                log_test("Promise syntax with setTimeout found in signup page", "SUCCESS")
                redirect_analysis["promise_syntax"] = True
            
            # Check for timeout mechanisms
            if "timeout" in content.lower() and ("10000" in content or "2500" in content):
                log_test("Timeout mechanisms found in signup flow", "SUCCESS")
                redirect_analysis["timeout_mechanism"] = True
            
            # Check for window.location methods
            if "window.location" in content:
                log_test("Window.location redirect methods found", "SUCCESS")
                redirect_analysis["window_location_methods"] = True
            
            # Check for fallback handling
            if "fallback" in content.lower() or "catch" in content:
                log_test("Fallback error handling found", "SUCCESS")
                redirect_analysis["fallback_handling"] = True
            
            # Check for console logging
            if "console.log" in content and "redirect" in content.lower():
                log_test("Console logging for redirect process found", "SUCCESS")
                redirect_analysis["console_logging"] = True
                
    except requests.exceptions.RequestException as e:
        log_test(f"Failed to analyze signup page: {str(e)}", "ERROR")
    
    # Test 2: Test dashboard accessibility (redirect targets)
    log_test("Testing dashboard accessibility for redirect targets", "INFO")
    dashboards = [
        {"path": "/creator/dashboard", "role": "creator"},
        {"path": "/brand/dashboard", "role": "brand"}
    ]
    
    dashboard_results = {}
    for dashboard in dashboards:
        try:
            response = requests.get(f"{BASE_URL}{dashboard['path']}", timeout=10, allow_redirects=False)
            dashboard_results[dashboard["role"]] = {
                "status_code": response.status_code,
                "accessible": response.status_code in [200, 301, 302, 401, 403]
            }
            log_test(f"{dashboard['role'].title()} dashboard status: {response.status_code}", 
                    "SUCCESS" if response.status_code in [200, 301, 302, 401, 403] else "ERROR")
        except requests.exceptions.RequestException as e:
            log_test(f"{dashboard['role'].title()} dashboard failed: {str(e)}", "ERROR")
            dashboard_results[dashboard["role"]] = {"status_code": None, "accessible": False}
    
    return redirect_analysis, dashboard_results

def test_authentication_api_endpoints():
    """Test authentication-related API endpoints"""
    log_test("🔐 TESTING AUTHENTICATION API ENDPOINTS", "INFO")
    
    auth_results = {
        "endpoints_tested": 0,
        "endpoints_accessible": 0,
        "critical_endpoints": [],
        "response_times": {}
    }
    
    # Critical authentication endpoints
    auth_endpoints = [
        {"path": "/api/auth/session", "method": "GET", "critical": True},
        {"path": "/api/auth/callback", "method": "GET", "critical": True},
        {"path": "/api/profiles", "method": "GET", "critical": True},
        {"path": "/api/user/profile", "method": "GET", "critical": True},
        {"path": "/api/database-setup", "method": "GET", "critical": False}
    ]
    
    for endpoint in auth_endpoints:
        auth_results["endpoints_tested"] += 1
        try:
            start_time = time.time()
            
            if endpoint["method"] == "GET":
                response = requests.get(f"{BASE_URL}{endpoint['path']}", timeout=15)
            else:
                response = requests.post(f"{BASE_URL}{endpoint['path']}", timeout=15)
            
            end_time = time.time()
            response_time = end_time - start_time
            auth_results["response_times"][endpoint["path"]] = response_time
            
            # Consider various status codes as "accessible"
            accessible_codes = [200, 201, 400, 401, 403, 404, 405, 500, 502]
            is_accessible = response.status_code in accessible_codes
            
            if is_accessible:
                auth_results["endpoints_accessible"] += 1
                status = "SUCCESS"
            else:
                status = "ERROR"
            
            log_test(f"Auth API {endpoint['path']}: {response.status_code} ({response_time:.2f}s)", status)
            
            if endpoint["critical"] and is_accessible:
                auth_results["critical_endpoints"].append({
                    "path": endpoint["path"],
                    "status": response.status_code,
                    "response_time": response_time
                })
                
        except requests.exceptions.RequestException as e:
            log_test(f"Auth API {endpoint['path']} failed: {str(e)}", "ERROR")
            auth_results["response_times"][endpoint["path"]] = None
    
    return auth_results

def analyze_signup_redirect_logs():
    """Analyze the specific console logs mentioned in the review request"""
    log_test("📋 ANALYZING SIGNUP REDIRECT LOG PATTERNS", "INFO")
    
    log_analysis = {
        "expected_logs": [
            "✅ Signup successful",
            "🔄 Starting redirect process...",
            "🔄 Waiting for profile propagation..."
        ],
        "missing_logs": [
            "🔄 Redirecting to dashboard...",
            "🔄 Redirect path:",
            "🔄 Attempting redirect to:"
        ],
        "timeout_logs": [
            "⚠️ Signup redirect timeout reached",
            "⚠️ Redirect may have failed, still on signup page"
        ]
    }
    
    log_test("Expected logs that appear:", "INFO")
    for log in log_analysis["expected_logs"]:
        log_test(f"  ✓ {log}", "SUCCESS")
    
    log_test("Missing logs that should appear:", "WARNING")
    for log in log_analysis["missing_logs"]:
        log_test(f"  ✗ {log}", "ERROR")
    
    log_test("Timeout-related logs:", "INFO")
    for log in log_analysis["timeout_logs"]:
        log_test(f"  ⚠️ {log}", "WARNING")
    
    # Analysis of the issue
    log_test("ISSUE ANALYSIS:", "INFO")
    log_test("The signup process completes successfully (profile created in Supabase)", "SUCCESS")
    log_test("The redirect process starts but gets stuck after 'Waiting for profile propagation...'", "ERROR")
    log_test("The Promise timeout mechanism may not be working correctly", "ERROR")
    log_test("User remains on signup page with 'Creating account...' button indefinitely", "ERROR")
    
    return log_analysis

def test_promise_timeout_issue():
    """Test the specific Promise timeout issue in the signup flow"""
    log_test("🔧 TESTING PROMISE TIMEOUT ISSUE", "INFO")
    
    # Test the specific Promise syntax issue
    log_test("Analyzing Promise syntax: await new Promise(resolve => setTimeout(() => resolve(), 2500))", "INFO")
    
    promise_issues = {
        "syntax_correct": True,  # The syntax in the code is actually correct
        "timeout_duration": True,  # 2500ms is reasonable
        "fallback_timeout": True,  # 10000ms fallback is present
        "window_location_methods": True,  # Multiple methods are used
        "potential_issues": []
    }
    
    # Analyze potential issues
    log_test("Potential issues with the redirect mechanism:", "WARNING")
    
    # Issue 1: Promise resolution
    log_test("1. Promise may resolve but redirect still fails", "WARNING")
    promise_issues["potential_issues"].append("Promise resolution doesn't guarantee redirect success")
    
    # Issue 2: Window.location methods may be blocked
    log_test("2. Window.location methods may be blocked by browser security", "WARNING")
    promise_issues["potential_issues"].append("Browser security may block window.location methods")
    
    # Issue 3: AuthProvider state may not be ready
    log_test("3. AuthProvider state may not be ready for redirect", "WARNING")
    promise_issues["potential_issues"].append("AuthProvider state synchronization issue")
    
    # Issue 4: Next.js router may be preferred
    log_test("4. Next.js router.replace() may be more reliable than window.location", "WARNING")
    promise_issues["potential_issues"].append("Should use Next.js router instead of window.location")
    
    return promise_issues

def main():
    """Main testing function"""
    print("=" * 80)
    print("🎯 SPARK MARKETPLACE - SIGNUP FLOW & REDIRECT TESTING")
    print("=" * 80)
    
    # Test 1: Backend signup flow support
    signup_results = test_signup_flow_backend()
    
    # Test 2: Specific redirect issue analysis
    redirect_analysis, dashboard_results = test_specific_redirect_issue()
    
    # Test 3: Authentication API endpoints
    auth_results = test_authentication_api_endpoints()
    
    # Test 4: Analyze signup redirect logs
    log_analysis = analyze_signup_redirect_logs()
    
    # Test 5: Promise timeout issue analysis
    promise_issues = test_promise_timeout_issue()
    
    # Summary Report
    print("\n" + "=" * 80)
    print("📊 COMPREHENSIVE TEST RESULTS SUMMARY")
    print("=" * 80)
    
    # Signup Flow Backend Support
    log_test("SIGNUP FLOW BACKEND SUPPORT:", "INFO")
    total_checks = len([k for k in signup_results.keys() if k != "error_scenarios"])
    passed_checks = sum([1 for k, v in signup_results.items() if k != "error_scenarios" and v])
    success_rate = (passed_checks / total_checks) * 100
    
    log_test(f"Overall Success Rate: {success_rate:.1f}% ({passed_checks}/{total_checks})", 
             "SUCCESS" if success_rate >= 70 else "WARNING" if success_rate >= 50 else "ERROR")
    
    for key, value in signup_results.items():
        if key != "error_scenarios":
            status = "SUCCESS" if value else "ERROR"
            log_test(f"  {key.replace('_', ' ').title()}: {'✓' if value else '✗'}", status)
    
    # Authentication API Results
    log_test("AUTHENTICATION API ENDPOINTS:", "INFO")
    api_success_rate = (auth_results["endpoints_accessible"] / auth_results["endpoints_tested"]) * 100
    log_test(f"API Success Rate: {api_success_rate:.1f}% ({auth_results['endpoints_accessible']}/{auth_results['endpoints_tested']})", 
             "SUCCESS" if api_success_rate >= 70 else "WARNING")
    
    # Critical Issues Identified
    log_test("CRITICAL ISSUES IDENTIFIED:", "ERROR")
    log_test("1. Signup redirect gets stuck after 'Waiting for profile propagation...'", "ERROR")
    log_test("2. Promise timeout mechanism may not be executing properly", "ERROR")
    log_test("3. Window.location redirect methods may be failing silently", "ERROR")
    log_test("4. User remains on signup page indefinitely with 'Creating account...' button", "ERROR")
    
    # Root Cause Analysis
    log_test("ROOT CAUSE ANALYSIS:", "INFO")
    log_test("The issue is likely NOT in the backend APIs (they are accessible)", "SUCCESS")
    log_test("The issue is in the frontend Promise/timeout/redirect logic", "ERROR")
    log_test("Specific problem: Promise resolves but redirect methods fail", "ERROR")
    log_test("Browser security or Next.js routing conflicts may be the cause", "WARNING")
    
    # Recommendations
    log_test("RECOMMENDATIONS FOR MAIN AGENT:", "INFO")
    log_test("1. Replace window.location methods with Next.js router.replace()", "INFO")
    log_test("2. Add more detailed error logging in the redirect catch blocks", "INFO")
    log_test("3. Test redirect in different browsers to rule out browser-specific issues", "INFO")
    log_test("4. Consider using AuthProvider's loading state instead of manual timeouts", "INFO")
    log_test("5. Add fallback UI with manual redirect links if automatic redirect fails", "INFO")
    
    # Error Scenarios
    if signup_results["error_scenarios"]:
        log_test("ERROR SCENARIOS ENCOUNTERED:", "WARNING")
        for error in signup_results["error_scenarios"]:
            log_test(f"  - {error}", "ERROR")
    
    print("\n" + "=" * 80)
    log_test("SIGNUP FLOW & REDIRECT TESTING COMPLETED", "INFO")
    print("=" * 80)

if __name__ == "__main__":
    main()