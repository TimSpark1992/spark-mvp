#!/usr/bin/env python3
"""
SUPABASE DEBUG TEST - Investigate JWT Token and Session Issues

This test investigates the exact Supabase configuration and response format
to understand why JWT tokens are not being returned in signup responses.
"""

import requests
import json
import uuid
from datetime import datetime

def debug_supabase_signup():
    """Debug Supabase signup response to understand JWT token issues"""
    
    # Supabase configuration
    supabase_url = "https://fgcefqowzkpeivpckljf.supabase.co"
    supabase_anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY2VmcW93emtwZWl2cGNrbGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjcyMTAsImV4cCI6MjA2OTkwMzIxMH0.xf0wNeAawVYDr0642b0t4V0URnNMnOBT5BhSCG34cCk"
    
    # Generate unique test credentials
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    test_email = f"debug.test.{uuid.uuid4().hex[:8]}.{timestamp}@sparktest.com"
    test_password = "password123"
    
    print("🔍 SUPABASE DEBUG TEST")
    print("=" * 50)
    print(f"Test Email: {test_email}")
    print(f"Supabase URL: {supabase_url}")
    print("=" * 50)
    
    # Headers for Supabase API calls
    headers = {
        'apikey': supabase_anon_key,
        'Authorization': f'Bearer {supabase_anon_key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    
    # Signup payload
    signup_url = f"{supabase_url}/auth/v1/signup"
    payload = {
        "email": test_email,
        "password": test_password,
        "data": {
            "full_name": "Debug Test User",
            "role": "creator"
        }
    }
    
    print(f"\n📤 SENDING SIGNUP REQUEST:")
    print(f"URL: {signup_url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print(f"Headers: {json.dumps({k: v[:50] + '...' if len(v) > 50 else v for k, v in headers.items()}, indent=2)}")
    
    try:
        response = requests.post(signup_url, json=payload, headers=headers, timeout=30)
        
        print(f"\n📥 SIGNUP RESPONSE:")
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n📋 RESPONSE DATA STRUCTURE:")
            print(json.dumps(data, indent=2))
            
            # Analyze the response structure
            print(f"\n🔍 DETAILED ANALYSIS:")
            
            user = data.get("user")
            if user:
                print(f"✅ User object found:")
                print(f"   - ID: {user.get('id')}")
                print(f"   - Email: {user.get('email')}")
                print(f"   - Email Confirmed At: {user.get('email_confirmed_at')}")
                print(f"   - Confirmation Sent At: {user.get('confirmation_sent_at')}")
                print(f"   - Created At: {user.get('created_at')}")
            else:
                print("❌ No user object in response")
            
            session = data.get("session")
            if session:
                print(f"✅ Session object found:")
                print(f"   - Access Token: {session.get('access_token', 'None')[:50] if session.get('access_token') else 'None'}...")
                print(f"   - Refresh Token: {session.get('refresh_token', 'None')[:50] if session.get('refresh_token') else 'None'}...")
                print(f"   - Token Type: {session.get('token_type')}")
                print(f"   - Expires In: {session.get('expires_in')}")
                print(f"   - Expires At: {session.get('expires_at')}")
                
                # Check JWT token format if present
                access_token = session.get('access_token')
                if access_token:
                    parts = access_token.split('.')
                    print(f"   - JWT Token Parts: {len(parts)} (Expected: 3)")
                    if len(parts) == 3:
                        print(f"   ✅ JWT Token format is valid")
                    else:
                        print(f"   ❌ JWT Token format is invalid")
                else:
                    print(f"   ❌ No access token in session")
            else:
                print("❌ No session object in response")
                print("   This indicates email confirmation is required")
            
            # Check for any error indicators
            if data.get("error"):
                print(f"❌ Error in response: {data.get('error')}")
            
            # Check email confirmation requirement
            if user and not user.get('email_confirmed_at') and not session:
                print(f"\n🚨 DIAGNOSIS: EMAIL CONFIRMATION REQUIRED")
                print(f"   - User created but email not confirmed")
                print(f"   - No session returned (requires email confirmation)")
                print(f"   - This explains why JWT tokens are not available immediately")
                print(f"   - Frontend JWT token fix cannot work without session")
                
                print(f"\n💡 SOLUTION REQUIRED:")
                print(f"   1. Disable email confirmation in Supabase dashboard")
                print(f"   2. Enable auto-confirm users setting")
                print(f"   3. Or implement email confirmation flow")
            
        else:
            print(f"❌ Signup failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"💥 Request failed with error: {e}")

if __name__ == "__main__":
    debug_supabase_signup()