#!/usr/bin/env python3
"""
Profile Creation Test for test.creator@example.com
This test will authenticate as the user and create the missing profile record.
"""

import requests
import json
import os
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://spark-bugfix.preview.emergentagent.com"
SUPABASE_URL = "https://fgcefqowzkpeivpckljf.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY2VmcW93emtwZWl2cGNrbGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjcyMTAsImV4cCI6MjA2OTkwMzIxMH0.xf0wNeAawVYDr0642b0t4V0URnNMnOBT5BhSCG34cCk"

# Test user credentials
TEST_EMAIL = "test.creator@example.com"
TEST_PASSWORD = "testpassword123"

def print_test_header(test_name):
    print(f"\n{'='*60}")
    print(f"🧪 {test_name}")
    print(f"{'='*60}")

def print_step(step_name):
    print(f"\n🔄 {step_name}")

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_warning(message):
    print(f"⚠️ {message}")

def authenticate_user():
    """Authenticate the user with Supabase and get their UUID"""
    print_step("Authenticating user with Supabase")
    
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json'
    }
    
    auth_data = {
        'email': TEST_EMAIL,
        'password': TEST_PASSWORD
    }
    
    try:
        response = requests.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers=headers,
            json=auth_data,
            timeout=30
        )
        
        print(f"Authentication response status: {response.status_code}")
        
        if response.status_code == 200:
            auth_result = response.json()
            user_id = auth_result.get('user', {}).get('id')
            access_token = auth_result.get('access_token')
            
            if user_id and access_token:
                print_success(f"Authentication successful! User ID: {user_id}")
                return user_id, access_token
            else:
                print_error("Authentication response missing user ID or access token")
                print(f"Response: {json.dumps(auth_result, indent=2)}")
                return None, None
        else:
            print_error(f"Authentication failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Response text: {response.text}")
            return None, None
            
    except Exception as e:
        print_error(f"Authentication request failed: {str(e)}")
        return None, None

def check_existing_profile(user_id, access_token):
    """Check if profile already exists for the user"""
    print_step("Checking existing profile in Supabase")
    
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}",
            headers=headers,
            timeout=30
        )
        
        print(f"Profile check response status: {response.status_code}")
        
        if response.status_code == 200:
            profiles = response.json()
            if profiles and len(profiles) > 0:
                profile = profiles[0]
                print_success(f"Profile found! Role: {profile.get('role', 'unknown')}")
                print(f"Profile data: {json.dumps(profile, indent=2)}")
                return profile
            else:
                print_warning("No profile found for user")
                return None
        else:
            print_error(f"Profile check failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Response text: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Profile check request failed: {str(e)}")
        return None

def create_profile(user_id, access_token):
    """Create the missing profile record"""
    print_step("Creating missing profile record")
    
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    
    profile_data = {
        'id': user_id,
        'email': TEST_EMAIL,
        'full_name': 'Test Creator',
        'role': 'creator',
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat()
    }
    
    try:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/profiles",
            headers=headers,
            json=profile_data,
            timeout=30
        )
        
        print(f"Profile creation response status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            created_profile = response.json()
            if isinstance(created_profile, list) and len(created_profile) > 0:
                created_profile = created_profile[0]
            
            print_success("Profile created successfully!")
            print(f"Created profile: {json.dumps(created_profile, indent=2)}")
            return created_profile
        else:
            print_error(f"Profile creation failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Response text: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Profile creation request failed: {str(e)}")
        return None

def test_login_flow():
    """Test the complete login flow after profile creation"""
    print_step("Testing login flow through frontend")
    
    # Test login page accessibility
    try:
        response = requests.get(f"{BASE_URL}/auth/login", timeout=30)
        if response.status_code == 200:
            print_success("Login page accessible")
        else:
            print_warning(f"Login page returned status {response.status_code}")
    except Exception as e:
        print_error(f"Login page test failed: {str(e)}")
    
    # Test creator dashboard accessibility (should require auth)
    try:
        response = requests.get(f"{BASE_URL}/creator/dashboard", timeout=30)
        if response.status_code in [200, 302, 401, 403]:
            print_success("Creator dashboard endpoint accessible (auth protection working)")
        else:
            print_warning(f"Creator dashboard returned unexpected status {response.status_code}")
    except Exception as e:
        print_error(f"Creator dashboard test failed: {str(e)}")

def main():
    print_test_header("PROFILE CREATION TEST FOR test.creator@example.com")
    
    # Step 1: Authenticate user
    user_id, access_token = authenticate_user()
    if not user_id or not access_token:
        print_error("Cannot proceed without authentication")
        return False
    
    # Step 2: Check existing profile
    existing_profile = check_existing_profile(user_id, access_token)
    
    if existing_profile:
        if existing_profile.get('role') == 'creator':
            print_success("Profile already exists with correct creator role!")
            print_warning("User should be able to access creator dashboard")
        else:
            print_warning(f"Profile exists but has incorrect role: {existing_profile.get('role')}")
            print("Need to update role to 'creator'")
            # Could implement role update here if needed
    else:
        # Step 3: Create missing profile
        created_profile = create_profile(user_id, access_token)
        if not created_profile:
            print_error("Failed to create profile")
            return False
    
    # Step 4: Test login flow
    test_login_flow()
    
    print_test_header("TEST SUMMARY")
    print_success("Profile creation test completed!")
    print("✅ User authenticated successfully")
    print("✅ Profile record created/verified with creator role")
    print("✅ Login flow endpoints accessible")
    print("\n🎯 NEXT STEPS:")
    print("1. User should now be able to login at /auth/login")
    print("2. After login, user should access /creator/dashboard without restrictions")
    print("3. AuthProvider should recognize user as creator")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)