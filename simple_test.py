#!/usr/bin/env python3
"""
Simple Admin API Test - Check if endpoints are accessible
"""

import requests
import json

BASE_URL = "https://spark-bugfix.preview.emergentagent.com"

def test_endpoint(endpoint):
    """Test a single endpoint"""
    try:
        url = f"{BASE_URL}{endpoint}"
        print(f"Testing: {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 502:
            print("❌ 502 Bad Gateway - Server error")
        elif response.status_code == 403:
            print("✅ 403 Forbidden - API working, auth required")
        elif response.status_code == 404:
            print("❌ 404 Not Found - Endpoint missing")
        elif response.status_code == 200:
            print("✅ 200 OK - API working")
        else:
            print(f"⚠️ Unexpected status: {response.status_code}")
            
        # Try to get response content
        try:
            if response.headers.get('content-type', '').startswith('application/json'):
                content = response.json()
                print(f"Response: {json.dumps(content, indent=2)[:200]}...")
            else:
                print(f"Response: {response.text[:200]}...")
        except:
            print("Response: Unable to parse")
            
        print("-" * 50)
        
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        print("-" * 50)

def main():
    print("🔍 SIMPLE ADMIN API ACCESSIBILITY TEST")
    print("=" * 60)
    
    endpoints = [
        "/api/admin/platform-settings",
        "/api/admin/payouts", 
        "/api/admin/users",
        "/api/admin/analytics",
        "/api/setup-database"  # Control test
    ]
    
    for endpoint in endpoints:
        test_endpoint(endpoint)

if __name__ == "__main__":
    main()