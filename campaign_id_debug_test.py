#!/usr/bin/env python3
"""
Campaign ID Debug Test - Investigating "non-existent campaigns" error

This test specifically debugs the campaign ID issue reported where:
- User reports error when accessing campaign detail pages
- App calls "campaigns that is non-existent" 
- Likely data type mismatch between campaign IDs from database vs URL params

Focus areas:
1. Check what campaigns actually exist in the database
2. Check the data types of campaign IDs (string vs number)
3. Test accessing /creator/campaigns/1 specifically
4. Verify the getCampaigns API response format
5. Check if the ID comparison logic is working correctly
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://4f187fa2-e698-4163-ab14-cb3017f6b9af.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

def log_test(message, status="INFO"):
    """Enhanced logging with timestamps"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status_emoji = {"INFO": "ℹ️", "SUCCESS": "✅", "ERROR": "❌", "WARNING": "⚠️"}
    print(f"[{timestamp}] {status_emoji.get(status, 'ℹ️')} {message}")

def test_campaigns_api_response():
    """Test 1: Check what campaigns actually exist and their data types"""
    log_test("=== TEST 1: CAMPAIGNS API RESPONSE ANALYSIS ===")
    
    try:
        response = requests.get(f"{API_BASE}/campaigns", timeout=10)
        log_test(f"GET /api/campaigns - Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            campaigns = data.get('campaigns', [])
            
            log_test(f"Found {len(campaigns)} campaigns in API response", "SUCCESS")
            
            for i, campaign in enumerate(campaigns):
                campaign_id = campaign.get('id')
                campaign_title = campaign.get('title', 'No title')
                
                log_test(f"Campaign {i+1}:")
                log_test(f"  - ID: {campaign_id} (type: {type(campaign_id).__name__})")
                log_test(f"  - Title: {campaign_title}")
                log_test(f"  - Full data: {json.dumps(campaign, indent=2)}")
                
            return campaigns
        else:
            log_test(f"API returned error: {response.status_code} - {response.text}", "ERROR")
            return []
            
    except Exception as e:
        log_test(f"Exception testing campaigns API: {str(e)}", "ERROR")
        return []

def test_campaign_id_comparison():
    """Test 2: Test ID comparison logic that might be failing"""
    log_test("=== TEST 2: CAMPAIGN ID COMPARISON LOGIC ===")
    
    # Get campaigns from API
    try:
        response = requests.get(f"{API_BASE}/campaigns", timeout=10)
        if response.status_code != 200:
            log_test("Cannot get campaigns for comparison test", "ERROR")
            return
            
        campaigns = response.json().get('campaigns', [])
        
        # Test different ID comparison scenarios
        test_ids = ['1', '2', 1, 2, '01', 'invalid']
        
        for test_id in test_ids:
            log_test(f"Testing ID comparison with: {test_id} (type: {type(test_id).__name__})")
            
            # Simulate the find logic from the frontend
            found_campaign = None
            for campaign in campaigns:
                campaign_id = campaign.get('id')
                if campaign_id == test_id:
                    found_campaign = campaign
                    break
                    
            if found_campaign:
                log_test(f"  ✅ Found campaign: {found_campaign.get('title')}", "SUCCESS")
            else:
                log_test(f"  ❌ No campaign found with ID {test_id}", "WARNING")
                
                # Show what IDs are available
                available_ids = [c.get('id') for c in campaigns]
                log_test(f"  Available IDs: {available_ids}")
                
    except Exception as e:
        log_test(f"Exception in ID comparison test: {str(e)}", "ERROR")

def test_specific_campaign_access():
    """Test 3: Test accessing /creator/campaigns/1 specifically"""
    log_test("=== TEST 3: SPECIFIC CAMPAIGN ACCESS TEST ===")
    
    # Test the specific URL mentioned in the issue
    test_url = f"{BASE_URL}/creator/campaigns/1"
    
    try:
        log_test(f"Testing access to: {test_url}")
        
        # Note: This will likely redirect to login, but we can check the response
        response = requests.get(test_url, timeout=10, allow_redirects=False)
        log_test(f"Response status: {response.status_code}")
        log_test(f"Response headers: {dict(response.headers)}")
        
        if response.status_code in [301, 302, 307, 308]:
            redirect_location = response.headers.get('Location', 'No location header')
            log_test(f"Redirected to: {redirect_location}")
            
            if 'login' in redirect_location.lower() or 'auth' in redirect_location.lower():
                log_test("✅ Proper authentication redirect detected", "SUCCESS")
            else:
                log_test("⚠️ Unexpected redirect", "WARNING")
        
    except Exception as e:
        log_test(f"Exception testing specific campaign access: {str(e)}", "ERROR")

def test_api_data_consistency():
    """Test 4: Check API data consistency and structure"""
    log_test("=== TEST 4: API DATA CONSISTENCY CHECK ===")
    
    try:
        response = requests.get(f"{API_BASE}/campaigns", timeout=10)
        if response.status_code != 200:
            log_test("Cannot get campaigns for consistency test", "ERROR")
            return
            
        data = response.json()
        campaigns = data.get('campaigns', [])
        
        log_test("Checking campaign data structure consistency:")
        
        required_fields = ['id', 'title', 'description', 'category', 'budget_range', 'created_at']
        
        for i, campaign in enumerate(campaigns):
            log_test(f"Campaign {i+1} structure check:")
            
            for field in required_fields:
                if field in campaign:
                    value = campaign[field]
                    log_test(f"  ✅ {field}: {value} (type: {type(value).__name__})")
                else:
                    log_test(f"  ❌ Missing field: {field}", "WARNING")
                    
            # Check for nested profile data
            if 'profiles' in campaign:
                profiles = campaign['profiles']
                log_test(f"  ✅ profiles: {profiles} (type: {type(profiles).__name__})")
            else:
                log_test(f"  ⚠️ No profiles data", "WARNING")
                
    except Exception as e:
        log_test(f"Exception in data consistency test: {str(e)}", "ERROR")

def test_campaign_filtering_logic():
    """Test 5: Test the filtering logic that might be causing issues"""
    log_test("=== TEST 5: CAMPAIGN FILTERING LOGIC TEST ===")
    
    try:
        response = requests.get(f"{API_BASE}/campaigns", timeout=10)
        if response.status_code != 200:
            log_test("Cannot get campaigns for filtering test", "ERROR")
            return
            
        campaigns = response.json().get('campaigns', [])
        
        # Test various filtering scenarios that might be used
        log_test("Testing campaign filtering scenarios:")
        
        # Test 1: Find by exact ID match (string)
        target_id = '1'
        found = [c for c in campaigns if c.get('id') == target_id]
        log_test(f"Filter by ID '{target_id}': Found {len(found)} campaigns")
        
        # Test 2: Find by exact ID match (number)
        target_id = 1
        found = [c for c in campaigns if c.get('id') == target_id]
        log_test(f"Filter by ID {target_id}: Found {len(found)} campaigns")
        
        # Test 3: Find by string conversion
        target_id = '1'
        found = [c for c in campaigns if str(c.get('id')) == target_id]
        log_test(f"Filter by str(ID) == '{target_id}': Found {len(found)} campaigns")
        
        # Test 4: Find by int conversion (if possible)
        target_id = 1
        found = []
        for c in campaigns:
            try:
                if int(c.get('id')) == target_id:
                    found.append(c)
            except (ValueError, TypeError):
                pass
        log_test(f"Filter by int(ID) == {target_id}: Found {len(found)} campaigns")
        
        # Test 5: Case sensitivity test
        target_id = '1'
        found = [c for c in campaigns if str(c.get('id')).lower() == target_id.lower()]
        log_test(f"Filter by case-insensitive ID: Found {len(found)} campaigns")
        
    except Exception as e:
        log_test(f"Exception in filtering logic test: {str(e)}", "ERROR")

def test_url_parameter_simulation():
    """Test 6: Simulate URL parameter handling"""
    log_test("=== TEST 6: URL PARAMETER SIMULATION ===")
    
    try:
        # Simulate how Next.js params.id would be received
        url_params = ['1', '2', '01', '001', 'invalid']
        
        response = requests.get(f"{API_BASE}/campaigns", timeout=10)
        if response.status_code != 200:
            log_test("Cannot get campaigns for URL parameter test", "ERROR")
            return
            
        campaigns = response.json().get('campaigns', [])
        
        for param_id in url_params:
            log_test(f"Simulating URL param: /creator/campaigns/{param_id}")
            
            # This is the exact logic from the frontend code
            found_campaign = None
            for c in campaigns:
                if c.get('id') == param_id:
                    found_campaign = c
                    break
                    
            if found_campaign:
                log_test(f"  ✅ Would find campaign: {found_campaign.get('title')}", "SUCCESS")
            else:
                log_test(f"  ❌ Would show 'Campaign not found' error", "ERROR")
                log_test(f"  Available campaign IDs: {[c.get('id') for c in campaigns]}")
                
    except Exception as e:
        log_test(f"Exception in URL parameter simulation: {str(e)}", "ERROR")

def run_comprehensive_campaign_debug():
    """Run all campaign ID debugging tests"""
    log_test("🎯 STARTING COMPREHENSIVE CAMPAIGN ID DEBUG TESTING", "INFO")
    log_test(f"Testing against: {BASE_URL}")
    log_test("=" * 80)
    
    start_time = time.time()
    
    # Run all tests
    campaigns = test_campaigns_api_response()
    test_campaign_id_comparison()
    test_specific_campaign_access()
    test_api_data_consistency()
    test_campaign_filtering_logic()
    test_url_parameter_simulation()
    
    # Summary
    end_time = time.time()
    duration = end_time - start_time
    
    log_test("=" * 80)
    log_test("🎯 CAMPAIGN ID DEBUG TEST SUMMARY", "INFO")
    log_test(f"Total test duration: {duration:.2f} seconds")
    
    if campaigns:
        log_test(f"✅ Found {len(campaigns)} campaigns in system", "SUCCESS")
        log_test("Campaign IDs and types:")
        for campaign in campaigns:
            campaign_id = campaign.get('id')
            log_test(f"  - ID: {campaign_id} (type: {type(campaign_id).__name__})")
    else:
        log_test("❌ No campaigns found or API error", "ERROR")
    
    log_test("=" * 80)
    log_test("🔍 DEBUGGING RECOMMENDATIONS:")
    log_test("1. Check if campaign IDs are consistently typed (string vs number)")
    log_test("2. Verify the find() logic in frontend matches API response format")
    log_test("3. Test with actual user authentication to access detail pages")
    log_test("4. Check if there are any data transformation issues")
    log_test("5. Verify URL routing is working correctly")

if __name__ == "__main__":
    run_comprehensive_campaign_debug()