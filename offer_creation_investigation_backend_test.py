#!/usr/bin/env python3
"""
🔍 OFFER CREATION INVESTIGATION BACKEND TEST
Investigating why no creators are showing in the offer creation page

Test Areas:
1. Campaign Applications Check - /api/campaigns/be9e2307-d8bc-4292-b6f7-17ddcd0b07ca/applications
2. All Creators Check - /api/profiles?role=creator  
3. Creator Profiles Verification
4. Data Structure Analysis
5. Workflow Clarification

Expected: Determine why "No Creators Available" appears in offer creation
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://www.sparkplatform.tech"
API_BASE = f"{BASE_URL}/api"
CAMPAIGN_ID = "be9e2307-d8bc-4292-b6f7-17ddcd0b07ca"

def log_test(message, status="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {status}: {message}")

def test_campaign_applications():
    """Test 1: Check if creators have applied to the specific campaign"""
    log_test("🎯 TEST 1: Campaign Applications Check", "START")
    
    try:
        url = f"{API_BASE}/campaigns/{CAMPAIGN_ID}/applications"
        log_test(f"Testing URL: {url}")
        
        response = requests.get(url, timeout=30)
        log_test(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            applications = data.get('applications', [])
            count = data.get('count', 0)
            
            log_test(f"✅ Applications API Working - Found {count} applications")
            
            if applications:
                log_test("📋 Application Details:")
                for i, app in enumerate(applications[:3]):  # Show first 3
                    log_test(f"  App {i+1}: Creator ID: {app.get('creator_id', 'N/A')}, Status: {app.get('status', 'N/A')}")
            else:
                log_test("⚠️ NO APPLICATIONS FOUND for this campaign")
                
            return {"success": True, "count": count, "applications": applications}
            
        else:
            log_test(f"❌ Applications API Failed: {response.status_code}")
            try:
                error_data = response.json()
                log_test(f"Error Details: {error_data}")
            except:
                log_test(f"Error Text: {response.text}")
            return {"success": False, "error": f"HTTP {response.status_code}"}
            
    except Exception as e:
        log_test(f"❌ Applications API Exception: {str(e)}", "ERROR")
        return {"success": False, "error": str(e)}

def test_all_creators():
    """Test 2: Check if there are any creators in the system"""
    log_test("🎯 TEST 2: All Creators Check", "START")
    
    try:
        url = f"{API_BASE}/profiles?role=creator"
        log_test(f"Testing URL: {url}")
        
        response = requests.get(url, timeout=30)
        log_test(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            profiles = data.get('profiles', [])
            count = data.get('count', 0)
            role_filter = data.get('role_filter')
            
            log_test(f"✅ Profiles API Working - Found {count} creators (filter: {role_filter})")
            
            if profiles:
                log_test("👥 Creator Profiles Found:")
                for i, profile in enumerate(profiles[:5]):  # Show first 5
                    log_test(f"  Creator {i+1}: ID: {profile.get('id', 'N/A')}, Name: {profile.get('full_name', 'N/A')}, Role: {profile.get('role', 'N/A')}")
            else:
                log_test("⚠️ NO CREATORS FOUND in the system")
                
            return {"success": True, "count": count, "profiles": profiles}
            
        else:
            log_test(f"❌ Profiles API Failed: {response.status_code}")
            try:
                error_data = response.json()
                log_test(f"Error Details: {error_data}")
            except:
                log_test(f"Error Text: {response.text}")
            return {"success": False, "error": f"HTTP {response.status_code}"}
            
    except Exception as e:
        log_test(f"❌ Profiles API Exception: {str(e)}", "ERROR")
        return {"success": False, "error": str(e)}

def test_all_profiles():
    """Test 3: Check all profiles to understand role distribution"""
    log_test("🎯 TEST 3: All Profiles Analysis", "START")
    
    try:
        url = f"{API_BASE}/profiles"
        log_test(f"Testing URL: {url}")
        
        response = requests.get(url, timeout=30)
        log_test(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            profiles = data.get('profiles', [])
            count = data.get('count', 0)
            
            log_test(f"✅ All Profiles API Working - Found {count} total profiles")
            
            # Analyze role distribution
            role_counts = {}
            for profile in profiles:
                role = profile.get('role', 'unknown')
                role_counts[role] = role_counts.get(role, 0) + 1
            
            log_test("📊 Role Distribution:")
            for role, count in role_counts.items():
                log_test(f"  {role}: {count} users")
                
            # Show sample profiles
            if profiles:
                log_test("👤 Sample Profiles:")
                for i, profile in enumerate(profiles[:3]):
                    log_test(f"  Profile {i+1}: ID: {profile.get('id', 'N/A')}, Name: {profile.get('full_name', 'N/A')}, Role: {profile.get('role', 'N/A')}")
                    
            return {"success": True, "count": count, "role_counts": role_counts, "profiles": profiles}
            
        else:
            log_test(f"❌ All Profiles API Failed: {response.status_code}")
            return {"success": False, "error": f"HTTP {response.status_code}"}
            
    except Exception as e:
        log_test(f"❌ All Profiles API Exception: {str(e)}", "ERROR")
        return {"success": False, "error": str(e)}

def test_campaign_exists():
    """Test 4: Verify the campaign exists"""
    log_test("🎯 TEST 4: Campaign Existence Check", "START")
    
    try:
        url = f"{API_BASE}/campaigns/{CAMPAIGN_ID}"
        log_test(f"Testing URL: {url}")
        
        response = requests.get(url, timeout=30)
        log_test(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            campaign = data.get('campaign')
            
            if campaign:
                log_test(f"✅ Campaign Found: {campaign.get('title', 'N/A')}")
                log_test(f"  Status: {campaign.get('status', 'N/A')}")
                log_test(f"  Brand ID: {campaign.get('brand_id', 'N/A')}")
                log_test(f"  Created: {campaign.get('created_at', 'N/A')}")
                return {"success": True, "campaign": campaign}
            else:
                log_test("❌ Campaign data not found in response")
                return {"success": False, "error": "No campaign data"}
                
        else:
            log_test(f"❌ Campaign API Failed: {response.status_code}")
            return {"success": False, "error": f"HTTP {response.status_code}"}
            
    except Exception as e:
        log_test(f"❌ Campaign API Exception: {str(e)}", "ERROR")
        return {"success": False, "error": str(e)}

def test_offers_api():
    """Test 5: Check offers API functionality"""
    log_test("🎯 TEST 5: Offers API Check", "START")
    
    try:
        url = f"{API_BASE}/offers"
        log_test(f"Testing URL: {url}")
        
        response = requests.get(url, timeout=30)
        log_test(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            offers = data.get('offers', [])
            
            log_test(f"✅ Offers API Working - Found {len(offers)} offers")
            
            if offers:
                log_test("💼 Sample Offers:")
                for i, offer in enumerate(offers[:3]):
                    log_test(f"  Offer {i+1}: Campaign: {offer.get('campaign_id', 'N/A')}, Creator: {offer.get('creator_id', 'N/A')}, Status: {offer.get('status', 'N/A')}")
                    
            return {"success": True, "count": len(offers), "offers": offers}
            
        else:
            log_test(f"❌ Offers API Failed: {response.status_code}")
            return {"success": False, "error": f"HTTP {response.status_code}"}
            
    except Exception as e:
        log_test(f"❌ Offers API Exception: {str(e)}", "ERROR")
        return {"success": False, "error": str(e)}

def analyze_data_structure(creators_data, applications_data):
    """Test 6: Analyze data structure compatibility"""
    log_test("🎯 TEST 6: Data Structure Analysis", "START")
    
    try:
        # Check creator data structure
        if creators_data.get("success") and creators_data.get("profiles"):
            sample_creator = creators_data["profiles"][0]
            log_test("👤 Creator Data Structure:")
            for key in sample_creator.keys():
                log_test(f"  {key}: {type(sample_creator[key]).__name__}")
        
        # Check applications data structure  
        if applications_data.get("success") and applications_data.get("applications"):
            sample_app = applications_data["applications"][0]
            log_test("📋 Application Data Structure:")
            for key in sample_app.keys():
                log_test(f"  {key}: {type(sample_app[key]).__name__}")
        
        # Analyze workflow implications
        creators_count = creators_data.get("count", 0)
        applications_count = applications_data.get("count", 0)
        
        log_test("🔍 Workflow Analysis:")
        log_test(f"  Total Creators in System: {creators_count}")
        log_test(f"  Applications for Campaign: {applications_count}")
        
        if creators_count == 0:
            log_test("  ❌ ROOT CAUSE: No creators exist in the system")
            return {"issue": "no_creators", "recommendation": "Create creator profiles first"}
        elif applications_count == 0:
            log_test("  ⚠️ ISSUE: Creators exist but none applied to this campaign")
            return {"issue": "no_applications", "recommendation": "Check if workflow should show all creators or only applicants"}
        else:
            log_test("  ✅ Both creators and applications exist")
            return {"issue": "none", "recommendation": "Check frontend logic for displaying creators"}
            
    except Exception as e:
        log_test(f"❌ Data Structure Analysis Exception: {str(e)}", "ERROR")
        return {"issue": "analysis_error", "error": str(e)}

def main():
    """Main test execution"""
    log_test("🚀 OFFER CREATION INVESTIGATION BACKEND TEST STARTED", "START")
    log_test(f"Target Campaign ID: {CAMPAIGN_ID}")
    log_test(f"API Base URL: {API_BASE}")
    
    results = {}
    
    # Test 1: Campaign Applications
    results["applications"] = test_campaign_applications()
    time.sleep(1)
    
    # Test 2: All Creators
    results["creators"] = test_all_creators()
    time.sleep(1)
    
    # Test 3: All Profiles
    results["all_profiles"] = test_all_profiles()
    time.sleep(1)
    
    # Test 4: Campaign Exists
    results["campaign"] = test_campaign_exists()
    time.sleep(1)
    
    # Test 5: Offers API
    results["offers"] = test_offers_api()
    time.sleep(1)
    
    # Test 6: Data Structure Analysis
    results["analysis"] = analyze_data_structure(results["creators"], results["applications"])
    
    # Summary
    log_test("📊 INVESTIGATION SUMMARY", "SUMMARY")
    
    success_count = sum(1 for result in results.values() if isinstance(result, dict) and result.get("success"))
    total_tests = len([k for k in results.keys() if k != "analysis"])
    
    log_test(f"Tests Passed: {success_count}/{total_tests}")
    
    # Key Findings
    log_test("🔍 KEY FINDINGS:")
    
    creators_count = results["creators"].get("count", 0) if results["creators"].get("success") else 0
    applications_count = results["applications"].get("count", 0) if results["applications"].get("success") else 0
    
    log_test(f"  • Creators in System: {creators_count}")
    log_test(f"  • Applications for Campaign: {applications_count}")
    
    if "analysis" in results and "issue" in results["analysis"]:
        issue = results["analysis"]["issue"]
        recommendation = results["analysis"].get("recommendation", "No recommendation")
        
        if issue == "no_creators":
            log_test("  ❌ CRITICAL: No creators exist in the system")
            log_test(f"  💡 RECOMMENDATION: {recommendation}")
        elif issue == "no_applications":
            log_test("  ⚠️ ISSUE: No applications for this specific campaign")
            log_test(f"  💡 RECOMMENDATION: {recommendation}")
        elif issue == "none":
            log_test("  ✅ Data exists - likely frontend display issue")
            log_test(f"  💡 RECOMMENDATION: {recommendation}")
    
    # Workflow Clarification
    log_test("🎯 WORKFLOW CLARIFICATION:")
    if creators_count > 0 and applications_count == 0:
        log_test("  • Brands should be able to create offers for ANY creator")
        log_test("  • Current logic may be incorrectly filtering to only applicants")
        log_test("  • Frontend should show all creators as fallback when no applications exist")
    elif creators_count > 0 and applications_count > 0:
        log_test("  • Brands can create offers for applicants (priority) or all creators (fallback)")
        log_test("  • Check frontend logic for proper creator list display")
    else:
        log_test("  • System needs creator profiles before offer creation can work")
    
    log_test("🏁 OFFER CREATION INVESTIGATION COMPLETE", "END")
    return results

if __name__ == "__main__":
    main()