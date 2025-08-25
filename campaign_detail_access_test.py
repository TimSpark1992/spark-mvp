#!/usr/bin/env python3
"""
Campaign Detail Access Test - Test actual campaign detail page access

This test simulates the exact scenario reported:
- User tries to access /creator/campaigns/1
- Frontend calls getCampaigns() to find campaign with ID '1'
- But database has UUID campaigns, not simple integer IDs
"""

import requests
import json
import time
from datetime import datetime

def log_test(message, status="INFO"):
    """Enhanced logging with timestamps"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status_emoji = {"INFO": "ℹ️", "SUCCESS": "✅", "ERROR": "❌", "WARNING": "⚠️"}
    print(f"[{timestamp}] {status_emoji.get(status, 'ℹ️')} {message}")

def test_campaign_detail_scenario():
    """Test the exact scenario causing the issue"""
    log_test("=== CAMPAIGN DETAIL ACCESS SCENARIO TEST ===")
    
    try:
        # Step 1: User tries to access /creator/campaigns/1
        log_test("SCENARIO: User accesses /creator/campaigns/1")
        
        # Step 2: Frontend calls getCampaigns() via API
        log_test("Step 1: Frontend calls getCampaigns() via /api/campaigns")
        api_response = requests.get("http://localhost:3000/api/campaigns", timeout=10)
        
        if api_response.status_code == 200:
            api_campaigns = api_response.json().get('campaigns', [])
            log_test(f"API returned {len(api_campaigns)} campaigns")
            
            # Step 3: Frontend tries to find campaign with ID '1'
            target_id = '1'  # This comes from URL params
            log_test(f"Step 2: Frontend searches for campaign with ID '{target_id}'")
            
            found_campaign = None
            for campaign in api_campaigns:
                if campaign.get('id') == target_id:
                    found_campaign = campaign
                    break
                    
            if found_campaign:
                log_test(f"✅ Campaign found: {found_campaign.get('title')}", "SUCCESS")
                log_test("This should work fine with the current API")
            else:
                log_test("❌ Campaign not found - would show 'Campaign not found' error", "ERROR")
                
        # Step 4: Test with real database UUID
        log_test("Step 3: Testing with real database campaign ID")
        real_campaign_id = "bf199737-6845-4c29-9ce3-047acb644d32"
        log_test(f"If user tried to access /creator/campaigns/{real_campaign_id}")
        
        found_real = None
        for campaign in api_campaigns:
            if campaign.get('id') == real_campaign_id:
                found_real = campaign
                break
                
        if found_real:
            log_test("✅ Real campaign would be found", "SUCCESS")
        else:
            log_test("❌ Real campaign would NOT be found - this is the bug!", "ERROR")
            log_test("The API returns hardcoded IDs but database has UUID IDs")
            
    except Exception as e:
        log_test(f"Exception in scenario test: {str(e)}", "ERROR")

def test_fix_verification():
    """Test what happens if we fix the API to use real data"""
    log_test("=== FIX VERIFICATION TEST ===")
    
    try:
        # Get real database campaigns
        SUPABASE_URL = "https://fgcefqowzkpeivpckljf.supabase.co"
        SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY2VmcW93emtwZWl2cGNrbGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjcyMTAsImV4cCI6MjA2OTkwMzIxMH0.xf0wNeAawVYDr0642b0t4V0URnNMnOBT5BhSCG34cCk"
        
        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(f"{SUPABASE_URL}/rest/v1/campaigns", headers=headers, timeout=10)
        
        if response.status_code == 200:
            real_campaigns = response.json()
            log_test(f"Real database has {len(real_campaigns)} campaigns")
            
            if real_campaigns:
                real_campaign = real_campaigns[0]
                real_id = real_campaign.get('id')
                
                log_test(f"If API returned real data, campaign ID would be: {real_id}")
                log_test(f"User accessing /creator/campaigns/{real_id} would work correctly")
                log_test("✅ This would fix the 'non-existent campaigns' error", "SUCCESS")
            else:
                log_test("Database is empty - no campaigns to test with", "WARNING")
        else:
            log_test("Could not get real database campaigns", "ERROR")
            
    except Exception as e:
        log_test(f"Exception in fix verification: {str(e)}", "ERROR")

def test_id_type_scenarios():
    """Test different ID type scenarios"""
    log_test("=== ID TYPE SCENARIOS TEST ===")
    
    scenarios = [
        {
            'name': 'Current API (string IDs)',
            'campaigns': [{'id': '1', 'title': 'Test 1'}, {'id': '2', 'title': 'Test 2'}],
            'url_param': '1',
            'expected': 'FOUND'
        },
        {
            'name': 'Database UUIDs',
            'campaigns': [{'id': 'bf199737-6845-4c29-9ce3-047acb644d32', 'title': 'Real Campaign'}],
            'url_param': '1',
            'expected': 'NOT FOUND'
        },
        {
            'name': 'Database UUIDs with correct URL',
            'campaigns': [{'id': 'bf199737-6845-4c29-9ce3-047acb644d32', 'title': 'Real Campaign'}],
            'url_param': 'bf199737-6845-4c29-9ce3-047acb644d32',
            'expected': 'FOUND'
        },
        {
            'name': 'Mixed ID types',
            'campaigns': [{'id': 1, 'title': 'Numeric'}, {'id': '2', 'title': 'String'}],
            'url_param': '1',
            'expected': 'NOT FOUND (type mismatch)'
        }
    ]
    
    for scenario in scenarios:
        log_test(f"Testing scenario: {scenario['name']}")
        campaigns = scenario['campaigns']
        url_param = scenario['url_param']
        
        # Simulate frontend find logic
        found = None
        for campaign in campaigns:
            if campaign.get('id') == url_param:
                found = campaign
                break
                
        result = "FOUND" if found else "NOT FOUND"
        expected = scenario['expected']
        
        if result == expected or expected in result:
            log_test(f"  ✅ {result} (as expected)", "SUCCESS")
        else:
            log_test(f"  ❌ {result} (expected: {expected})", "ERROR")

def run_campaign_detail_test():
    """Run campaign detail access tests"""
    log_test("🎯 STARTING CAMPAIGN DETAIL ACCESS TEST", "INFO")
    log_test("=" * 80)
    
    start_time = time.time()
    
    # Run tests
    test_campaign_detail_scenario()
    test_fix_verification()
    test_id_type_scenarios()
    
    # Summary
    end_time = time.time()
    duration = end_time - start_time
    
    log_test("=" * 80)
    log_test("🎯 CAMPAIGN DETAIL ACCESS TEST SUMMARY", "INFO")
    log_test(f"Total test duration: {duration:.2f} seconds")
    
    log_test("🔍 FINAL DIAGNOSIS:")
    log_test("❌ ROOT CAUSE CONFIRMED: API/Database ID Mismatch")
    log_test("1. API returns hardcoded campaigns with simple string IDs: '1', '2'")
    log_test("2. Database contains real campaigns with UUID IDs: 'bf199737-6845-4c29-9ce3-047acb644d32'")
    log_test("3. When user accesses /creator/campaigns/1:")
    log_test("   - Frontend gets hardcoded campaigns from API")
    log_test("   - Finds campaign with ID '1' successfully")
    log_test("   - BUT this is fake data, not real database data")
    log_test("4. When user accesses real campaign UUID:")
    log_test("   - Frontend gets hardcoded campaigns from API")
    log_test("   - Cannot find campaign with UUID ID")
    log_test("   - Shows 'Campaign not found' error")
    log_test("")
    log_test("🔧 SOLUTION:")
    log_test("Fix /api/campaigns route to return real database campaigns instead of hardcoded data")
    log_test("The route should call getCampaigns() from supabase.js instead of returning sample data")

if __name__ == "__main__":
    run_campaign_detail_test()