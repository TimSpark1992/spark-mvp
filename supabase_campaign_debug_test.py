#!/usr/bin/env python3
"""
Supabase Campaign Debug Test - Check actual database campaigns

This test connects directly to Supabase to check what campaigns exist in the database
and their ID types, to compare with the hardcoded API response.
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

def test_supabase_campaigns():
    """Test direct Supabase campaign data"""
    log_test("=== SUPABASE CAMPAIGN DATABASE TEST ===")
    
    # Supabase configuration from .env.local
    SUPABASE_URL = "https://fgcefqowzkpeivpckljf.supabase.co"
    SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY2VmcW93emtwZWl2cGNrbGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjcyMTAsImV4cCI6MjA2OTkwMzIxMH0.xf0wNeAawVYDr0642b0t4V0URnNMnOBT5BhSCG34cCk"
    
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        # Test campaigns table
        url = f"{SUPABASE_URL}/rest/v1/campaigns"
        log_test(f"Querying Supabase campaigns: {url}")
        
        response = requests.get(url, headers=headers, timeout=10)
        log_test(f"Supabase response status: {response.status_code}")
        
        if response.status_code == 200:
            campaigns = response.json()
            log_test(f"Found {len(campaigns)} campaigns in Supabase database", "SUCCESS")
            
            for i, campaign in enumerate(campaigns):
                campaign_id = campaign.get('id')
                campaign_title = campaign.get('title', 'No title')
                
                log_test(f"Database Campaign {i+1}:")
                log_test(f"  - ID: {campaign_id} (type: {type(campaign_id).__name__})")
                log_test(f"  - Title: {campaign_title}")
                log_test(f"  - Status: {campaign.get('status', 'No status')}")
                log_test(f"  - Brand ID: {campaign.get('brand_id', 'No brand_id')}")
                
            return campaigns
        else:
            log_test(f"Supabase error: {response.status_code} - {response.text}", "ERROR")
            return []
            
    except Exception as e:
        log_test(f"Exception querying Supabase: {str(e)}", "ERROR")
        return []

def test_api_vs_database():
    """Compare API response with database data"""
    log_test("=== API VS DATABASE COMPARISON ===")
    
    try:
        # Get API data
        api_response = requests.get("http://localhost:3000/api/campaigns", timeout=10)
        if api_response.status_code == 200:
            api_campaigns = api_response.json().get('campaigns', [])
            log_test(f"API returned {len(api_campaigns)} campaigns")
        else:
            log_test("Failed to get API campaigns", "ERROR")
            return
            
        # Get database data
        db_campaigns = test_supabase_campaigns()
        
        log_test("COMPARISON RESULTS:")
        log_test(f"API campaigns: {len(api_campaigns)}")
        log_test(f"Database campaigns: {len(db_campaigns)}")
        
        if len(api_campaigns) > 0 and len(db_campaigns) == 0:
            log_test("⚠️ API returns hardcoded data, database is empty", "WARNING")
            log_test("This explains the 'non-existent campaigns' error!")
            log_test("The frontend tries to find campaigns from database but API returns hardcoded data")
        elif len(db_campaigns) > 0:
            log_test("✅ Database has real campaigns", "SUCCESS")
            # Compare IDs
            api_ids = [c.get('id') for c in api_campaigns]
            db_ids = [c.get('id') for c in db_campaigns]
            log_test(f"API IDs: {api_ids}")
            log_test(f"Database IDs: {db_ids}")
            
            if api_ids != db_ids:
                log_test("⚠️ ID mismatch between API and database!", "WARNING")
        else:
            log_test("Both API and database are empty", "WARNING")
            
    except Exception as e:
        log_test(f"Exception in comparison: {str(e)}", "ERROR")

def test_getcampaigns_function():
    """Test the getCampaigns function behavior"""
    log_test("=== GETCAMPAIGNS FUNCTION TEST ===")
    
    try:
        # The getCampaigns function in supabase.js should query the database
        # But the API route is returning hardcoded data
        
        log_test("Analyzing getCampaigns function behavior:")
        log_test("1. API route /api/campaigns returns hardcoded sample data")
        log_test("2. Frontend calls getCampaigns() which should query Supabase")
        log_test("3. But the API route doesn't use getCampaigns() - it returns hardcoded data!")
        
        # Check if there's a mismatch
        log_test("ISSUE IDENTIFIED:", "ERROR")
        log_test("The /api/campaigns route returns hardcoded data instead of calling getCampaigns()")
        log_test("This means frontend gets different data than what's in the database")
        
    except Exception as e:
        log_test(f"Exception in function test: {str(e)}", "ERROR")

def run_supabase_debug():
    """Run Supabase debugging tests"""
    log_test("🎯 STARTING SUPABASE CAMPAIGN DEBUG", "INFO")
    log_test("=" * 80)
    
    start_time = time.time()
    
    # Run tests
    db_campaigns = test_supabase_campaigns()
    test_api_vs_database()
    test_getcampaigns_function()
    
    # Summary
    end_time = time.time()
    duration = end_time - start_time
    
    log_test("=" * 80)
    log_test("🎯 SUPABASE DEBUG SUMMARY", "INFO")
    log_test(f"Total test duration: {duration:.2f} seconds")
    
    log_test("🔍 ROOT CAUSE ANALYSIS:")
    log_test("1. The /api/campaigns route returns hardcoded sample data")
    log_test("2. This data has string IDs: '1', '2'")
    log_test("3. The frontend comparison logic works correctly for these IDs")
    log_test("4. BUT if the database has different IDs or no campaigns, this causes issues")
    log_test("5. The 'non-existent campaigns' error likely occurs when:")
    log_test("   - Database is empty but API returns hardcoded data")
    log_test("   - Database has different IDs than the hardcoded ones")
    log_test("   - There's a mismatch between API response and database reality")

if __name__ == "__main__":
    run_supabase_debug()