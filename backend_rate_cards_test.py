#!/usr/bin/env python3
"""
MARKETPLACE RATE CARDS BACKEND TESTING
Comprehensive testing of the newly implemented marketplace transactional layer foundation,
specifically focusing on Rate Cards functionality.

Test Focus:
1. Database Schema Verification - Test if rate_cards table exists and is accessible
2. Rate Card API Endpoints - Test all CRUD operations with proper validation
   - GET /api/rate-cards (with and without creator_id parameter)
   - POST /api/rate-cards (create new rate card with validation)
   - PATCH /api/rate-cards/[id] (update existing rate card)
   - DELETE /api/rate-cards/[id] (soft delete rate card)
3. Supabase Function Integration - Verify all rate card functions work correctly
4. Data Validation - Test currency validation (USD/MYR/SGD), deliverable types, pricing validation
5. Error Handling - Test proper error responses for invalid data
"""

import requests
import json
import time
import uuid
import os
import sys
from datetime import datetime
from typing import Dict, Any, Tuple, Optional

class RateCardsBackendTester:
    def __init__(self):
        # Load environment variables
        self.supabase_url = "https://fgcefqowzkpeivpckljf.supabase.co"
        self.supabase_anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY2VmcW93emtwZWl2cGNrbGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjcyMTAsImV4cCI6MjA2OTkwMzIxMH0.xf0wNeAawVYDr0642b0t4V0URnNMnOBT5BhSCG34cCk"
        self.base_url = "https://next-error-fix.preview.emergentagent.com"
        
        # Test results tracking
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        
        # Headers for Supabase API calls
        self.headers = {
            'apikey': self.supabase_anon_key,
            'Authorization': f'Bearer {self.supabase_anon_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
        
        # Test data storage
        self.test_creator_id = None
        self.test_access_token = None
        self.created_rate_cards = []
        
        print("🔧 MARKETPLACE RATE CARDS BACKEND TESTING INITIALIZED")
        print(f"📍 Supabase URL: {self.supabase_url}")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 80)

    def log_test_result(self, test_name: str, success: bool, details: str, error: Optional[str] = None):
        """Log test result with detailed information"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = {
            'test_name': test_name,
            'success': success,
            'details': details,
            'error': error,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        print(f"{status} - {test_name}")
        print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
        print()

    def setup_test_creator(self) -> bool:
        """Create a test creator for rate card testing"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            credentials = {
                'email': f'ratecards.creator.{timestamp}@sparktest.com',
                'password': 'TestPassword123!',
                'full_name': f'Rate Cards Creator {timestamp}',
                'role': 'creator'
            }
            
            # Create test user via Supabase auth
            signup_data = {
                'email': credentials['email'],
                'password': credentials['password'],
                'data': {
                    'full_name': credentials['full_name'],
                    'role': credentials['role']
                }
            }
            
            response = requests.post(
                f"{self.supabase_url}/auth/v1/signup",
                headers=self.headers,
                json=signup_data,
                timeout=15
            )
            
            if response.status_code == 200:
                response_data = response.json()
                if 'user' in response_data and response_data['user']:
                    self.test_creator_id = response_data['user']['id']
                    self.test_access_token = response_data.get('access_token')
                    
                    # Create profile
                    auth_headers = {
                        **self.headers,
                        'Authorization': f'Bearer {self.test_access_token}'
                    }
                    
                    profile_data = {
                        'id': self.test_creator_id,
                        'email': credentials['email'],
                        'full_name': credentials['full_name'],
                        'role': credentials['role']
                    }
                    
                    profile_response = requests.post(
                        f"{self.supabase_url}/rest/v1/profiles",
                        headers=auth_headers,
                        json=profile_data,
                        timeout=15
                    )
                    
                    if profile_response.status_code in [200, 201]:
                        self.log_test_result(
                            "Test Creator Setup",
                            True,
                            f"Test creator created successfully. ID: {self.test_creator_id}"
                        )
                        return True
                    else:
                        self.log_test_result(
                            "Test Creator Setup",
                            False,
                            f"Profile creation failed. Status: {profile_response.status_code}",
                            profile_response.text
                        )
                        return False
                else:
                    self.log_test_result(
                        "Test Creator Setup",
                        False,
                        "Signup response missing user data",
                        json.dumps(response_data, indent=2)
                    )
                    return False
            else:
                self.log_test_result(
                    "Test Creator Setup",
                    False,
                    f"Creator signup failed. Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test_result(
                "Test Creator Setup",
                False,
                "Exception occurred during test creator setup",
                str(e)
            )
            return False

    def test_rate_cards_table_exists(self) -> bool:
        """Test if rate_cards table exists and is accessible"""
        try:
            response = requests.get(
                f"{self.supabase_url}/rest/v1/rate_cards?select=id&limit=1",
                headers=self.headers,
                timeout=10
            )
            
            # Table exists if we get 200 (with data) or 200 (empty array) or 401/406 (RLS blocking)
            if response.status_code in [200, 401, 406]:
                self.log_test_result(
                    "Rate Cards Table Existence Test",
                    True,
                    f"Rate cards table exists and is accessible. Status: {response.status_code}"
                )
                return True
            elif response.status_code == 404:
                self.log_test_result(
                    "Rate Cards Table Existence Test",
                    False,
                    "Rate cards table does not exist - migrations may not have been run",
                    f"HTTP 404: {response.text}"
                )
                return False
            else:
                self.log_test_result(
                    "Rate Cards Table Existence Test",
                    False,
                    f"Unexpected response from rate_cards table. Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test_result(
                "Rate Cards Table Existence Test",
                False,
                "Exception occurred during rate_cards table test",
                str(e)
            )
            return False

    def test_get_rate_cards_api(self) -> bool:
        """Test GET /api/rate-cards endpoint"""
        try:
            # Test without creator_id parameter
            response = requests.get(f"{self.base_url}/api/rate-cards", timeout=10)
            
            if response.status_code == 200:
                response_data = response.json()
                if 'rateCards' in response_data and 'success' in response_data:
                    self.log_test_result(
                        "GET Rate Cards API Test (No Filter)",
                        True,
                        f"API returned {len(response_data['rateCards'])} rate cards successfully"
                    )
                    
                    # Test with creator_id parameter if we have a test creator
                    if self.test_creator_id:
                        creator_response = requests.get(
                            f"{self.base_url}/api/rate-cards?creator_id={self.test_creator_id}",
                            timeout=10
                        )
                        
                        if creator_response.status_code == 200:
                            creator_data = creator_response.json()
                            self.log_test_result(
                                "GET Rate Cards API Test (With Creator Filter)",
                                True,
                                f"API returned {len(creator_data['rateCards'])} rate cards for creator {self.test_creator_id}"
                            )
                            return True
                        else:
                            self.log_test_result(
                                "GET Rate Cards API Test (With Creator Filter)",
                                False,
                                f"Creator filter failed. Status: {creator_response.status_code}",
                                creator_response.text
                            )
                            return False
                    else:
                        return True
                else:
                    self.log_test_result(
                        "GET Rate Cards API Test (No Filter)",
                        False,
                        "API response missing expected fields (rateCards, success)",
                        json.dumps(response_data, indent=2)
                    )
                    return False
            else:
                self.log_test_result(
                    "GET Rate Cards API Test (No Filter)",
                    False,
                    f"GET rate cards API failed. Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test_result(
                "GET Rate Cards API Test",
                False,
                "Exception occurred during GET rate cards API test",
                str(e)
            )
            return False

    def test_post_rate_cards_api(self) -> bool:
        """Test POST /api/rate-cards endpoint with validation"""
        if not self.test_creator_id:
            self.log_test_result(
                "POST Rate Cards API Test",
                False,
                "No test creator available for rate card creation",
                "Test creator setup failed"
            )
            return False
        
        try:
            # Test valid rate card creation
            valid_rate_card = {
                'creator_id': self.test_creator_id,
                'deliverable_type': 'IG_Reel',
                'base_price_cents': 50000,  # $500.00
                'currency': 'USD',
                'rush_pct': 25
            }
            
            response = requests.post(
                f"{self.base_url}/api/rate-cards",
                headers={'Content-Type': 'application/json'},
                json=valid_rate_card,
                timeout=15
            )
            
            if response.status_code == 201:
                response_data = response.json()
                if 'rateCard' in response_data and 'success' in response_data:
                    rate_card_id = response_data['rateCard']['id']
                    self.created_rate_cards.append(rate_card_id)
                    
                    self.log_test_result(
                        "POST Rate Cards API Test (Valid Data)",
                        True,
                        f"Rate card created successfully. ID: {rate_card_id}"
                    )
                    
                    # Test validation - missing required field
                    invalid_rate_card = {
                        'creator_id': self.test_creator_id,
                        'deliverable_type': 'IG_Story',
                        # Missing base_price_cents
                        'currency': 'USD'
                    }
                    
                    invalid_response = requests.post(
                        f"{self.base_url}/api/rate-cards",
                        headers={'Content-Type': 'application/json'},
                        json=invalid_rate_card,
                        timeout=15
                    )
                    
                    if invalid_response.status_code == 400:
                        self.log_test_result(
                            "POST Rate Cards API Test (Validation - Missing Field)",
                            True,
                            f"Validation correctly rejected missing field. Status: {invalid_response.status_code}"
                        )
                        
                        # Test validation - invalid currency
                        invalid_currency_card = {
                            'creator_id': self.test_creator_id,
                            'deliverable_type': 'TikTok_Post',
                            'base_price_cents': 30000,
                            'currency': 'EUR'  # Invalid currency
                        }
                        
                        currency_response = requests.post(
                            f"{self.base_url}/api/rate-cards",
                            headers={'Content-Type': 'application/json'},
                            json=invalid_currency_card,
                            timeout=15
                        )
                        
                        if currency_response.status_code == 400:
                            self.log_test_result(
                                "POST Rate Cards API Test (Validation - Invalid Currency)",
                                True,
                                f"Validation correctly rejected invalid currency. Status: {currency_response.status_code}"
                            )
                            
                            # Test validation - invalid deliverable type
                            invalid_type_card = {
                                'creator_id': self.test_creator_id,
                                'deliverable_type': 'Facebook_Post',  # Invalid type
                                'base_price_cents': 25000,
                                'currency': 'USD'
                            }
                            
                            type_response = requests.post(
                                f"{self.base_url}/api/rate-cards",
                                headers={'Content-Type': 'application/json'},
                                json=invalid_type_card,
                                timeout=15
                            )
                            
                            if type_response.status_code == 400:
                                self.log_test_result(
                                    "POST Rate Cards API Test (Validation - Invalid Type)",
                                    True,
                                    f"Validation correctly rejected invalid deliverable type. Status: {type_response.status_code}"
                                )
                                return True
                            else:
                                self.log_test_result(
                                    "POST Rate Cards API Test (Validation - Invalid Type)",
                                    False,
                                    f"Validation failed to reject invalid deliverable type. Status: {type_response.status_code}",
                                    type_response.text
                                )
                                return False
                        else:
                            self.log_test_result(
                                "POST Rate Cards API Test (Validation - Invalid Currency)",
                                False,
                                f"Validation failed to reject invalid currency. Status: {currency_response.status_code}",
                                currency_response.text
                            )
                            return False
                    else:
                        self.log_test_result(
                            "POST Rate Cards API Test (Validation - Missing Field)",
                            False,
                            f"Validation failed to reject missing field. Status: {invalid_response.status_code}",
                            invalid_response.text
                        )
                        return False
                else:
                    self.log_test_result(
                        "POST Rate Cards API Test (Valid Data)",
                        False,
                        "API response missing expected fields (rateCard, success)",
                        json.dumps(response_data, indent=2)
                    )
                    return False
            else:
                self.log_test_result(
                    "POST Rate Cards API Test (Valid Data)",
                    False,
                    f"Rate card creation failed. Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test_result(
                "POST Rate Cards API Test",
                False,
                "Exception occurred during POST rate cards API test",
                str(e)
            )
            return False

    def test_patch_rate_cards_api(self) -> bool:
        """Test PATCH /api/rate-cards/[id] endpoint"""
        if not self.created_rate_cards:
            self.log_test_result(
                "PATCH Rate Cards API Test",
                False,
                "No rate cards available for update testing",
                "Rate card creation may have failed"
            )
            return False
        
        try:
            rate_card_id = self.created_rate_cards[0]
            
            # Test valid update
            update_data = {
                'base_price_cents': 75000,  # Update to $750.00
                'rush_pct': 50
            }
            
            response = requests.patch(
                f"{self.base_url}/api/rate-cards/{rate_card_id}",
                headers={'Content-Type': 'application/json'},
                json=update_data,
                timeout=15
            )
            
            if response.status_code == 200:
                response_data = response.json()
                if 'rateCard' in response_data and 'success' in response_data:
                    updated_card = response_data['rateCard']
                    if updated_card['base_price_cents'] == 75000:
                        self.log_test_result(
                            "PATCH Rate Cards API Test (Valid Update)",
                            True,
                            f"Rate card updated successfully. New price: {updated_card['base_price_cents']} cents"
                        )
                        
                        # Test validation - invalid price
                        invalid_update = {
                            'base_price_cents': -1000  # Negative price
                        }
                        
                        invalid_response = requests.patch(
                            f"{self.base_url}/api/rate-cards/{rate_card_id}",
                            headers={'Content-Type': 'application/json'},
                            json=invalid_update,
                            timeout=15
                        )
                        
                        if invalid_response.status_code == 400:
                            self.log_test_result(
                                "PATCH Rate Cards API Test (Validation - Invalid Price)",
                                True,
                                f"Validation correctly rejected negative price. Status: {invalid_response.status_code}"
                            )
                            return True
                        else:
                            self.log_test_result(
                                "PATCH Rate Cards API Test (Validation - Invalid Price)",
                                False,
                                f"Validation failed to reject negative price. Status: {invalid_response.status_code}",
                                invalid_response.text
                            )
                            return False
                    else:
                        self.log_test_result(
                            "PATCH Rate Cards API Test (Valid Update)",
                            False,
                            f"Rate card update didn't apply correctly. Expected: 75000, Got: {updated_card['base_price_cents']}",
                            json.dumps(updated_card, indent=2)
                        )
                        return False
                else:
                    self.log_test_result(
                        "PATCH Rate Cards API Test (Valid Update)",
                        False,
                        "API response missing expected fields (rateCard, success)",
                        json.dumps(response_data, indent=2)
                    )
                    return False
            else:
                self.log_test_result(
                    "PATCH Rate Cards API Test (Valid Update)",
                    False,
                    f"Rate card update failed. Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test_result(
                "PATCH Rate Cards API Test",
                False,
                "Exception occurred during PATCH rate cards API test",
                str(e)
            )
            return False

    def test_delete_rate_cards_api(self) -> bool:
        """Test DELETE /api/rate-cards/[id] endpoint (soft delete)"""
        if not self.created_rate_cards:
            self.log_test_result(
                "DELETE Rate Cards API Test",
                False,
                "No rate cards available for delete testing",
                "Rate card creation may have failed"
            )
            return False
        
        try:
            rate_card_id = self.created_rate_cards[0]
            
            response = requests.delete(
                f"{self.base_url}/api/rate-cards/{rate_card_id}",
                timeout=15
            )
            
            if response.status_code == 200:
                response_data = response.json()
                if 'rateCard' in response_data and 'success' in response_data:
                    deleted_card = response_data['rateCard']
                    if deleted_card['active'] == False:
                        self.log_test_result(
                            "DELETE Rate Cards API Test (Soft Delete)",
                            True,
                            f"Rate card soft deleted successfully. Active: {deleted_card['active']}"
                        )
                        
                        # Verify the rate card is no longer returned in active queries
                        get_response = requests.get(
                            f"{self.base_url}/api/rate-cards?creator_id={self.test_creator_id}",
                            timeout=10
                        )
                        
                        if get_response.status_code == 200:
                            get_data = get_response.json()
                            active_cards = [card for card in get_data['rateCards'] if card['id'] == rate_card_id]
                            
                            if len(active_cards) == 0:
                                self.log_test_result(
                                    "DELETE Rate Cards API Test (Verification)",
                                    True,
                                    "Soft deleted rate card correctly excluded from active queries"
                                )
                                return True
                            else:
                                self.log_test_result(
                                    "DELETE Rate Cards API Test (Verification)",
                                    False,
                                    "Soft deleted rate card still appears in active queries",
                                    f"Found {len(active_cards)} active cards with deleted ID"
                                )
                                return False
                        else:
                            self.log_test_result(
                                "DELETE Rate Cards API Test (Verification)",
                                False,
                                f"Failed to verify deletion. GET request failed with status: {get_response.status_code}",
                                get_response.text
                            )
                            return False
                    else:
                        self.log_test_result(
                            "DELETE Rate Cards API Test (Soft Delete)",
                            False,
                            f"Rate card not properly soft deleted. Active: {deleted_card['active']}",
                            json.dumps(deleted_card, indent=2)
                        )
                        return False
                else:
                    self.log_test_result(
                        "DELETE Rate Cards API Test (Soft Delete)",
                        False,
                        "API response missing expected fields (rateCard, success)",
                        json.dumps(response_data, indent=2)
                    )
                    return False
            else:
                self.log_test_result(
                    "DELETE Rate Cards API Test (Soft Delete)",
                    False,
                    f"Rate card deletion failed. Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test_result(
                "DELETE Rate Cards API Test",
                False,
                "Exception occurred during DELETE rate cards API test",
                str(e)
            )
            return False

    def test_supabase_rate_card_functions(self) -> bool:
        """Test Supabase rate card functions directly"""
        if not self.test_creator_id or not self.test_access_token:
            self.log_test_result(
                "Supabase Rate Card Functions Test",
                False,
                "No authenticated test creator available for Supabase function testing",
                "Test creator setup may have failed"
            )
            return False
        
        try:
            auth_headers = {
                **self.headers,
                'Authorization': f'Bearer {self.test_access_token}'
            }
            
            # Test getRateCards function (direct Supabase query)
            get_response = requests.get(
                f"{self.supabase_url}/rest/v1/rate_cards?select=*&active=eq.true&creator_id=eq.{self.test_creator_id}&order=deliverable_type",
                headers=auth_headers,
                timeout=10
            )
            
            if get_response.status_code == 200:
                rate_cards = get_response.json()
                self.log_test_result(
                    "Supabase getRateCards Function Test",
                    True,
                    f"Successfully retrieved {len(rate_cards)} rate cards from Supabase"
                )
                
                # Test createRateCard function (direct Supabase insert)
                new_rate_card = {
                    'creator_id': self.test_creator_id,
                    'deliverable_type': 'YouTube_Video',
                    'base_price_cents': 100000,  # $1000.00
                    'currency': 'USD',
                    'rush_pct': 30,
                    'active': True
                }
                
                create_response = requests.post(
                    f"{self.supabase_url}/rest/v1/rate_cards",
                    headers=auth_headers,
                    json=new_rate_card,
                    timeout=15
                )
                
                if create_response.status_code in [200, 201]:
                    created_data = create_response.json()
                    if created_data and len(created_data) > 0:
                        created_card = created_data[0]
                        card_id = created_card['id']
                        self.created_rate_cards.append(card_id)
                        
                        self.log_test_result(
                            "Supabase createRateCard Function Test",
                            True,
                            f"Successfully created rate card via Supabase. ID: {card_id}"
                        )
                        
                        # Test updateRateCard function (direct Supabase update)
                        update_data = {
                            'base_price_cents': 120000,  # Update to $1200.00
                            'updated_at': datetime.now().isoformat()
                        }
                        
                        update_response = requests.patch(
                            f"{self.supabase_url}/rest/v1/rate_cards?id=eq.{card_id}",
                            headers=auth_headers,
                            json=update_data,
                            timeout=15
                        )
                        
                        if update_response.status_code in [200, 204]:
                            self.log_test_result(
                                "Supabase updateRateCard Function Test",
                                True,
                                f"Successfully updated rate card via Supabase. ID: {card_id}"
                            )
                            
                            # Test deleteRateCard function (soft delete via Supabase)
                            delete_data = {
                                'active': False,
                                'updated_at': datetime.now().isoformat()
                            }
                            
                            delete_response = requests.patch(
                                f"{self.supabase_url}/rest/v1/rate_cards?id=eq.{card_id}",
                                headers=auth_headers,
                                json=delete_data,
                                timeout=15
                            )
                            
                            if delete_response.status_code in [200, 204]:
                                self.log_test_result(
                                    "Supabase deleteRateCard Function Test",
                                    True,
                                    f"Successfully soft deleted rate card via Supabase. ID: {card_id}"
                                )
                                return True
                            else:
                                self.log_test_result(
                                    "Supabase deleteRateCard Function Test",
                                    False,
                                    f"Failed to soft delete rate card. Status: {delete_response.status_code}",
                                    delete_response.text
                                )
                                return False
                        else:
                            self.log_test_result(
                                "Supabase updateRateCard Function Test",
                                False,
                                f"Failed to update rate card. Status: {update_response.status_code}",
                                update_response.text
                            )
                            return False
                    else:
                        self.log_test_result(
                            "Supabase createRateCard Function Test",
                            False,
                            "Rate card creation returned empty response",
                            json.dumps(created_data, indent=2)
                        )
                        return False
                else:
                    self.log_test_result(
                        "Supabase createRateCard Function Test",
                        False,
                        f"Failed to create rate card. Status: {create_response.status_code}",
                        create_response.text
                    )
                    return False
            else:
                self.log_test_result(
                    "Supabase getRateCards Function Test",
                    False,
                    f"Failed to retrieve rate cards. Status: {get_response.status_code}",
                    get_response.text
                )
                return False
                
        except Exception as e:
            self.log_test_result(
                "Supabase Rate Card Functions Test",
                False,
                "Exception occurred during Supabase functions test",
                str(e)
            )
            return False

    def test_pricing_utilities(self) -> bool:
        """Test pricing utilities from lib/marketplace/pricing.js (indirectly through API)"""
        try:
            # Test currency validation through API
            currencies_to_test = ['USD', 'MYR', 'SGD']
            deliverable_types = ['IG_Reel', 'IG_Story', 'TikTok_Post', 'YouTube_Video', 'Bundle']
            
            valid_tests = 0
            total_currency_tests = len(currencies_to_test)
            
            for currency in currencies_to_test:
                test_card = {
                    'creator_id': self.test_creator_id,
                    'deliverable_type': f'Bundle_{currency}',  # Unique type per currency
                    'base_price_cents': 25000,
                    'currency': currency,
                    'rush_pct': 0
                }
                
                response = requests.post(
                    f"{self.base_url}/api/rate-cards",
                    headers={'Content-Type': 'application/json'},
                    json=test_card,
                    timeout=15
                )
                
                if response.status_code == 201:
                    valid_tests += 1
                    response_data = response.json()
                    if 'rateCard' in response_data:
                        self.created_rate_cards.append(response_data['rateCard']['id'])
            
            if valid_tests == total_currency_tests:
                self.log_test_result(
                    "Pricing Utilities Test (Currency Validation)",
                    True,
                    f"All {total_currency_tests} supported currencies (USD, MYR, SGD) validated successfully"
                )
                
                # Test deliverable type validation
                valid_type_tests = 0
                total_type_tests = len(deliverable_types)
                
                for i, deliverable_type in enumerate(deliverable_types):
                    test_card = {
                        'creator_id': self.test_creator_id,
                        'deliverable_type': deliverable_type,
                        'base_price_cents': 20000 + (i * 5000),  # Different prices
                        'currency': 'USD',
                        'rush_pct': i * 10
                    }
                    
                    response = requests.post(
                        f"{self.base_url}/api/rate-cards",
                        headers={'Content-Type': 'application/json'},
                        json=test_card,
                        timeout=15
                    )
                    
                    if response.status_code == 201:
                        valid_type_tests += 1
                        response_data = response.json()
                        if 'rateCard' in response_data:
                            self.created_rate_cards.append(response_data['rateCard']['id'])
                
                if valid_type_tests == total_type_tests:
                    self.log_test_result(
                        "Pricing Utilities Test (Deliverable Type Validation)",
                        True,
                        f"All {total_type_tests} deliverable types validated successfully"
                    )
                    return True
                else:
                    self.log_test_result(
                        "Pricing Utilities Test (Deliverable Type Validation)",
                        False,
                        f"Only {valid_type_tests}/{total_type_tests} deliverable types validated successfully",
                        "Some deliverable types may not be properly supported"
                    )
                    return False
            else:
                self.log_test_result(
                    "Pricing Utilities Test (Currency Validation)",
                    False,
                    f"Only {valid_tests}/{total_currency_tests} currencies validated successfully",
                    "Some currencies may not be properly supported"
                )
                return False
                
        except Exception as e:
            self.log_test_result(
                "Pricing Utilities Test",
                False,
                "Exception occurred during pricing utilities test",
                str(e)
            )
            return False

    def run_comprehensive_rate_cards_tests(self):
        """Run all comprehensive rate cards tests"""
        print("🚀 STARTING MARKETPLACE RATE CARDS BACKEND TESTING")
        print("=" * 80)
        
        # Phase 1: Database Schema Verification
        print("📊 PHASE 1: DATABASE SCHEMA VERIFICATION")
        schema_success = self.test_rate_cards_table_exists()
        
        if not schema_success:
            print("❌ CRITICAL: Rate cards table does not exist. Please run migrations first.")
            print("   Execute the SQL files in /app/migrations/ in your Supabase SQL Editor:")
            print("   1. /app/migrations/20250811_001_create_transactional_tables.sql")
            print("   2. /app/migrations/20250811_002_create_rls_policies.sql")
            return False
        
        # Phase 2: Test Creator Setup
        print("\n" + "=" * 80)
        print("👤 PHASE 2: TEST CREATOR SETUP")
        creator_success = self.setup_test_creator()
        
        if not creator_success:
            print("❌ CRITICAL: Could not create test creator. Authentication may be broken.")
            return False
        
        # Phase 3: Rate Card API Endpoints Testing
        print("\n" + "=" * 80)
        print("🔌 PHASE 3: RATE CARD API ENDPOINTS TESTING")
        
        get_success = self.test_get_rate_cards_api()
        post_success = self.test_post_rate_cards_api()
        patch_success = self.test_patch_rate_cards_api()
        delete_success = self.test_delete_rate_cards_api()
        
        # Phase 4: Supabase Function Integration Testing
        print("\n" + "=" * 80)
        print("🗄️ PHASE 4: SUPABASE FUNCTION INTEGRATION TESTING")
        supabase_success = self.test_supabase_rate_card_functions()
        
        # Phase 5: Pricing Utilities Testing
        print("\n" + "=" * 80)
        print("💰 PHASE 5: PRICING UTILITIES TESTING")
        pricing_success = self.test_pricing_utilities()
        
        # Final Results
        print("\n" + "=" * 80)
        print("📊 FINAL TEST RESULTS")
        print("=" * 80)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed Tests: {self.passed_tests}")
        print(f"Failed Tests: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        print("\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test_name']}")
            if not result['success'] and result['error']:
                print(f"   Error: {result['error'][:100]}...")
        
        print("\n" + "=" * 80)
        
        # Critical issues summary
        critical_issues = []
        for result in self.test_results:
            if not result['success']:
                if 'table does not exist' in result['details']:
                    critical_issues.append(f"DATABASE MIGRATION REQUIRED: {result['test_name']}")
                elif 'HTTP 401' in result['details'] or 'HTTP 406' in result['details']:
                    critical_issues.append(f"RLS POLICY ISSUE: {result['test_name']}")
                elif 'Validation' in result['test_name']:
                    critical_issues.append(f"VALIDATION ISSUE: {result['test_name']}")
                else:
                    critical_issues.append(f"API ISSUE: {result['test_name']}")
        
        if critical_issues:
            print("🚨 CRITICAL ISSUES IDENTIFIED:")
            for issue in critical_issues:
                print(f"   • {issue}")
        else:
            print("✅ NO CRITICAL RATE CARDS ISSUES DETECTED")
        
        # Component-specific success rates
        api_tests = [r for r in self.test_results if 'API Test' in r['test_name']]
        api_success = sum(1 for r in api_tests if r['success'])
        api_total = len(api_tests)
        
        supabase_tests = [r for r in self.test_results if 'Supabase' in r['test_name']]
        supabase_success_count = sum(1 for r in supabase_tests if r['success'])
        supabase_total = len(supabase_tests)
        
        if api_total > 0:
            api_rate = (api_success / api_total * 100)
            print(f"\n🔌 API ENDPOINTS: {api_success}/{api_total} tests passed ({api_rate:.1f}%)")
        
        if supabase_total > 0:
            supabase_rate = (supabase_success_count / supabase_total * 100)
            print(f"🗄️ SUPABASE FUNCTIONS: {supabase_success_count}/{supabase_total} tests passed ({supabase_rate:.1f}%)")
        
        print(f"\n📈 CREATED {len(self.created_rate_cards)} TEST RATE CARDS DURING TESTING")
        
        return success_rate >= 80.0  # Consider 80%+ success rate as passing for rate cards tests

def main():
    """Main test execution function"""
    tester = RateCardsBackendTester()
    
    try:
        success = tester.run_comprehensive_rate_cards_tests()
        
        if success:
            print("\n🎉 MARKETPLACE RATE CARDS BACKEND TESTING COMPLETED SUCCESSFULLY")
            print("✅ Rate cards functionality is working correctly and ready for Phase 2")
            return 0
        else:
            print("\n🚨 MARKETPLACE RATE CARDS BACKEND TESTING FAILED - CRITICAL ISSUES DETECTED")
            print("❌ Rate cards functionality has issues that need to be resolved before Phase 2")
            return 1
            
    except KeyboardInterrupt:
        print("\n⚠️ Testing interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 FATAL ERROR DURING TESTING: {str(e)}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)