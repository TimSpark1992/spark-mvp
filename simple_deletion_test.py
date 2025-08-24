#!/usr/bin/env python3
"""
Simple Rate Card Deletion Test
Tests the core deletion functionality
"""

import requests
import json
import time

BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"
CREATOR_ID = "5b408260-4d3d-4392-a589-0a485a4152a9"

def test_deletion_issue():
    """Test the core deletion issue"""
    print("🔍 INVESTIGATING RATE CARD DELETION ISSUE")
    
    # Get current rate cards
    response = requests.get(f"{API_BASE}/rate-cards?creator_id={CREATOR_ID}")
    if response.status_code == 200:
        rate_cards = response.json().get('rateCards', [])
        print(f"📊 Current active rate cards: {len(rate_cards)}")
        
        if rate_cards:
            # Pick the first rate card for testing
            test_card = rate_cards[0]
            card_id = test_card['id']
            print(f"🎯 Testing deletion of rate card: {card_id}")
            print(f"   - Type: {test_card['deliverable_type']}")
            print(f"   - Currency: {test_card['currency']}")
            print(f"   - Active: {test_card['active']}")
            
            # Attempt deletion
            print(f"\n🗑️ Attempting deletion...")
            delete_response = requests.delete(f"{API_BASE}/rate-cards/{card_id}")
            print(f"Delete response status: {delete_response.status_code}")
            print(f"Delete response body: {delete_response.text}")
            
            # Check if it's still in active results
            time.sleep(2)
            after_response = requests.get(f"{API_BASE}/rate-cards?creator_id={CREATOR_ID}")
            if after_response.status_code == 200:
                after_cards = after_response.json().get('rateCards', [])
                still_active = any(card['id'] == card_id for card in after_cards)
                
                print(f"\n📊 After deletion:")
                print(f"   - Total active rate cards: {len(after_cards)}")
                print(f"   - Deleted card still active: {still_active}")
                
                if still_active:
                    print("❌ CRITICAL ISSUE: Rate card deletion is not working!")
                    print("   The rate card is still appearing in active results after deletion.")
                    
                    # Check if the card was actually updated
                    deleted_card = next((card for card in after_cards if card['id'] == card_id), None)
                    if deleted_card:
                        print(f"   - Updated timestamp: {deleted_card.get('updated_at')}")
                        print(f"   - Active status: {deleted_card.get('active')}")
                else:
                    print("✅ SUCCESS: Rate card deletion is working correctly!")
                    print("   The rate card was successfully removed from active results.")
            else:
                print(f"❌ Failed to verify deletion: {after_response.status_code}")
        else:
            print("❌ No rate cards found for testing")
    else:
        print(f"❌ Failed to get rate cards: {response.status_code}")

def test_cache_behavior():
    """Test if there are cache-related issues"""
    print(f"\n🧪 TESTING CACHE BEHAVIOR")
    
    # Make multiple rapid requests to see if results are consistent
    results = []
    for i in range(3):
        response = requests.get(f"{API_BASE}/rate-cards?creator_id={CREATOR_ID}")
        if response.status_code == 200:
            count = len(response.json().get('rateCards', []))
            results.append(count)
            print(f"Request {i+1}: {count} rate cards")
        time.sleep(1)
    
    if len(set(results)) == 1:
        print("✅ Cache behavior is consistent")
    else:
        print(f"❌ Cache behavior is inconsistent: {results}")

if __name__ == "__main__":
    test_deletion_issue()
    test_cache_behavior()