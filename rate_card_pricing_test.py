#!/usr/bin/env python3
"""
Rate Card Pricing Issue Investigation
Tests rate card data storage and API responses to identify $0.00 pricing issue
"""

import os
import sys
import json
import requests
from supabase import create_client, Client

def load_env_file():
    """Load environment variables from .env.local"""
    env_vars = {}
    try:
        with open('.env.local', 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
        return env_vars
    except FileNotFoundError:
        print("❌ .env.local file not found")
        return None

def test_rate_cards_database():
    """Test rate cards data directly from database"""
    print("🔍 TESTING RATE CARDS DATABASE")
    print("=" * 50)
    
    # Load environment variables
    env_vars = load_env_file()
    if not env_vars:
        return False
    
    supabase_url = env_vars.get('NEXT_PUBLIC_SUPABASE_URL')
    supabase_service_key = env_vars.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_service_key:
        print("❌ Missing Supabase environment variables")
        return False
    
    try:
        # Create Supabase client
        supabase: Client = create_client(supabase_url, supabase_service_key)
        print("✅ Supabase client created successfully")
        
        # Query rate_cards table directly
        print("\n📋 Querying rate_cards table...")
        result = supabase.table('rate_cards').select('*').execute()
        
        if result.data:
            print(f"✅ Found {len(result.data)} rate cards in database")
            
            for i, card in enumerate(result.data, 1):
                print(f"\n📊 Rate Card #{i}:")
                print(f"   ID: {card.get('id')}")
                print(f"   Creator ID: {card.get('creator_id')}")
                print(f"   Deliverable Type: {card.get('deliverable_type')}")
                print(f"   Base Price Cents: {card.get('base_price_cents')} (type: {type(card.get('base_price_cents'))})")
                print(f"   Currency: {card.get('currency')}")
                print(f"   Rush %: {card.get('rush_pct')}")
                print(f"   Active: {card.get('active')}")
                print(f"   Created: {card.get('created_at')}")
                
                # Test price formatting
                base_price_cents = card.get('base_price_cents')
                if base_price_cents is not None:
                    expected_price = base_price_cents / 100
                    print(f"   Expected Price Display: ${expected_price:.2f}")
                else:
                    print(f"   ⚠️ base_price_cents is None!")
        else:
            print("❌ No rate cards found in database")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

def test_rate_cards_api():
    """Test rate cards API endpoint"""
    print("\n🌐 TESTING RATE CARDS API")
    print("=" * 50)
    
    # Load environment variables
    env_vars = load_env_file()
    if not env_vars:
        return False
    
    base_url = env_vars.get('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000')
    api_url = f"{base_url}/api/rate-cards"
    
    try:
        print(f"📡 Testing API endpoint: {api_url}")
        
        # Test GET request
        response = requests.get(api_url, timeout=10)
        print(f"📊 Response Status: {response.status_code}")
        print(f"📊 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API Response successful")
            print(f"📋 Response structure: {list(data.keys())}")
            
            if 'rateCards' in data and data['rateCards']:
                rate_cards = data['rateCards']
                print(f"✅ Found {len(rate_cards)} rate cards from API")
                
                for i, card in enumerate(rate_cards, 1):
                    print(f"\n📊 API Rate Card #{i}:")
                    print(f"   ID: {card.get('id')}")
                    print(f"   Deliverable Type: {card.get('deliverable_type')}")
                    print(f"   Base Price Cents: {card.get('base_price_cents')} (type: {type(card.get('base_price_cents'))})")
                    print(f"   Currency: {card.get('currency')}")
                    
                    # Test price formatting with different approaches
                    base_price_cents = card.get('base_price_cents')
                    print(f"\n🧪 PRICE FORMATTING TESTS:")
                    
                    # Test 1: Direct conversion
                    if base_price_cents is not None:
                        direct_price = base_price_cents / 100
                        print(f"   Direct conversion: ${direct_price:.2f}")
                    
                    # Test 2: Old formatPrice logic (problematic)
                    if not base_price_cents or base_price_cents < 0:
                        old_result = "$0.00"
                    else:
                        old_result = f"${base_price_cents / 100:.2f}"
                    print(f"   Old formatPrice logic: {old_result}")
                    
                    # Test 3: New formatPrice logic (fixed)
                    if base_price_cents is None or base_price_cents == 0 or base_price_cents < 0:
                        new_result = "$0.00"
                    else:
                        new_result = f"${base_price_cents / 100:.2f}"
                    print(f"   New formatPrice logic: {new_result}")
                    
                    # Test 4: Specific null checks
                    if base_price_cents is None or base_price_cents is False or (isinstance(base_price_cents, (int, float)) and base_price_cents < 0):
                        specific_result = "$0.00"
                    else:
                        specific_result = f"${base_price_cents / 100:.2f}"
                    print(f"   Specific null checks: {specific_result}")
                    
            else:
                print("❌ No rate cards found in API response")
                return False
        else:
            print(f"❌ API request failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"❌ Error details: {error_data}")
            except:
                print(f"❌ Error text: {response.text}")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

def test_format_price_functions():
    """Test different formatPrice function implementations"""
    print("\n🧪 TESTING FORMATPRICE FUNCTIONS")
    print("=" * 50)
    
    # Test values
    test_cases = [
        (7500, "USD", "$75.00"),  # Normal case
        (0, "USD", "$0.00"),      # Zero case
        (None, "USD", "$0.00"),   # None case
        (False, "USD", "$0.00"),  # False case
        (-100, "USD", "$0.00"),   # Negative case
        (12345, "MYR", "RM123.45"), # Different currency
    ]
    
    print("📊 Test Cases:")
    for i, (price_cents, currency, expected) in enumerate(test_cases, 1):
        print(f"\nTest {i}: price_cents={price_cents} ({type(price_cents)}), currency={currency}")
        print(f"Expected: {expected}")
        
        # Old logic (problematic - from rate-cards page)
        if not price_cents or price_cents < 0:
            old_result = "$0.00"
        else:
            old_result = f"${price_cents / 100:.2f}"
        print(f"Old logic result: {old_result}")
        
        # New logic (fixed - from formatters.js)
        if price_cents is None or price_cents is False or (isinstance(price_cents, (int, float)) and (price_cents < 0 or price_cents != price_cents)):  # NaN check
            new_result = "$0.00"
        else:
            price = price_cents / 100
            if currency == "MYR":
                symbol = "RM"
            elif currency == "SGD":
                symbol = "S$"
            else:
                symbol = "$"
            new_result = f"{symbol}{price:.2f}"
        print(f"New logic result: {new_result}")
        
        # Check if old logic is causing the issue
        if old_result != expected and new_result == expected:
            print(f"🚨 OLD LOGIC IS THE PROBLEM! Using !price_cents fails for {price_cents}")
        elif old_result == expected and new_result != expected:
            print(f"🚨 NEW LOGIC HAS ISSUES!")
        elif old_result == new_result == expected:
            print(f"✅ Both logics work correctly")
        else:
            print(f"⚠️ Both logics have issues")

def main():
    """Main test function"""
    print("🎯 RATE CARD PRICING ISSUE INVESTIGATION")
    print("=" * 60)
    print("Testing rate card data and formatting to identify $0.00 pricing issue")
    print("=" * 60)
    
    # Test 1: Database direct query
    db_success = test_rate_cards_database()
    
    # Test 2: API endpoint
    api_success = test_rate_cards_api()
    
    # Test 3: formatPrice function logic
    test_format_price_functions()
    
    # Summary
    print("\n📋 INVESTIGATION SUMMARY")
    print("=" * 50)
    print(f"Database Query: {'✅ Success' if db_success else '❌ Failed'}")
    print(f"API Endpoint: {'✅ Success' if api_success else '❌ Failed'}")
    
    if db_success and api_success:
        print("\n🎯 LIKELY ROOT CAUSE:")
        print("The issue is in the local formatPrice function in /app/app/creator/rate-cards/page.js")
        print("Line 274: if (!priceCents || isNaN(priceCents) || priceCents < 0)")
        print("The !priceCents check returns true for 0, causing valid prices to show as $0.00")
        print("\n🔧 SOLUTION:")
        print("Replace the local formatPrice function with the fixed version from /app/lib/formatters.js")
        print("Or update the condition to: if (priceCents === null || priceCents === undefined || isNaN(priceCents) || priceCents < 0)")
    
    return db_success and api_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)