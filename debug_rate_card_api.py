#!/usr/bin/env python3
"""
Debug Rate Card API Issues
"""

import requests
import json
import uuid

BASE_URL = "https://www.sparkplatform.tech"
API_BASE = f"{BASE_URL}/api"

def debug_post_error():
    """Debug the POST rate card error"""
    
    test_data = {
        'creator_id': str(uuid.uuid4()),
        'deliverable_type': 'IG_Reel',
        'base_price_cents': 50000,
        'currency': 'USD',
        'rush_pct': 25
    }
    
    print("🔍 Debugging POST /api/rate-cards error...")
    print(f"Request data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(f"{API_BASE}/rate-cards", json=test_data, timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"Response JSON: {json.dumps(response_data, indent=2)}")
        except json.JSONDecodeError:
            print(f"Response Text: {response.text}")
            
    except Exception as e:
        print(f"Request failed: {e}")

def debug_public_endpoint():
    """Debug the public endpoint error"""
    
    print("\n🔍 Debugging GET /api/rate-cards/public error...")
    
    try:
        response = requests.get(f"{API_BASE}/rate-cards/public", timeout=30)
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"Response JSON: {json.dumps(response_data, indent=2)}")
        except json.JSONDecodeError:
            print(f"Response Text: {response.text}")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    debug_post_error()
    debug_public_endpoint()