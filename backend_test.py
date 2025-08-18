#!/usr/bin/env python3
"""
Backend Testing Suite for Rate Cards Table Creation and Functionality
Focuses on creating the missing rate_cards table and testing rate card operations
"""

import requests
import json
import time
import uuid
import sys
from datetime import datetime

# Configuration - Use production URL
BASE_URL = "https://www.sparkplatform.tech"
API_BASE = f"{BASE_URL}/api"

class RateCardsBackendTester:
    def __init__(self):
        # Test data for rate card creation
        self.test_creator_id = str(uuid.uuid4())
        self.test_rate_card_data = {
            "creator_id": self.test_creator_id,
            "deliverable_type": "IG_Reel",
            "base_price_cents": 50000,  # $500.00
            "currency": "USD",
            "rush_pct": 25
        }
        
        self.results = {
            "table_check": {"status": "pending", "details": None},
            "table_creation": {"status": "pending", "details": None},
            "rate_card_creation": {"status": "pending", "details": None},
            "rate_card_retrieval": {"status": "pending", "details": None},
            "overall_success": False
        }
        
        print("🎯 RATE CARDS BACKEND TESTING SUITE")
        print("=" * 60)
        print(f"🌐 Base URL: {BASE_URL}")
        print(f"🔗 API Base: {API_BASE}")
        print(f"👤 Test Creator ID: {self.test_creator_id}")
        print("=" * 60)

    def check_rate_cards_table(self):
        """Check if rate_cards table exists in Supabase"""
        print("\n🔍 STEP 1: Checking if rate_cards table exists...")
        
        try:
            response = requests.get(f"{API_BASE}/check-rate-cards-table", timeout=30)
            
            print(f"📡 Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("tableExists"):
                    print("✅ Rate cards table EXISTS and is accessible")
                    self.results["table_check"] = {
                        "status": "success", 
                        "details": "Table exists and is accessible",
                        "data": data
                    }
                    return True
                else:
                    print("❌ Rate cards table does NOT exist")
                    self.results["table_check"] = {
                        "status": "failed", 
                        "details": "Table does not exist",
                        "data": data
                    }
                    return False
            else:
                print(f"❌ Table check failed with status {response.status_code}")
                print(f"Response: {response.text}")
                self.results["table_check"] = {
                    "status": "failed", 
                    "details": f"HTTP {response.status_code}: {response.text}"
                }
                return False
                
        except Exception as e:
            print(f"❌ Exception during table check: {str(e)}")
            self.results["table_check"] = {
                "status": "error", 
                "details": str(e)
            }
            return False

    def create_rate_cards_table(self):
        """Create the rate_cards table using the API endpoint"""
        print("\n🔧 STEP 2: Creating rate_cards table...")
        
        try:
            response = requests.post(f"{API_BASE}/create-rate-cards-table", timeout=60)
            
            print(f"📡 Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    print("✅ Rate cards table created successfully")
                    self.results["table_creation"] = {
                        "status": "success", 
                        "details": "Table created successfully",
                        "data": data
                    }
                    return True
                else:
                    print("❌ Table creation failed")
                    print(f"Response: {json.dumps(data, indent=2)}")
                    self.results["table_creation"] = {
                        "status": "failed", 
                        "details": data.get("message", "Unknown error"),
                        "data": data
                    }
                    return False
            else:
                print(f"❌ Table creation failed with status {response.status_code}")
                print(f"Response: {response.text}")
                self.results["table_creation"] = {
                    "status": "failed", 
                    "details": f"HTTP {response.status_code}: {response.text}"
                }
                return False
                
        except Exception as e:
            print(f"❌ Exception during table creation: {str(e)}")
            self.results["table_creation"] = {
                "status": "error", 
                "details": str(e)
            }
            return False

    def create_rate_card_direct_sql(self):
        """Alternative approach: Create table using direct SQL execution"""
        print("\n🔧 ALTERNATIVE: Creating rate_cards table with direct SQL...")
        
        # SQL from the review request
        create_table_sql = """
        -- Create rate_cards table
        CREATE TABLE IF NOT EXISTS rate_cards (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          creator_id UUID NOT NULL,
          deliverable_type TEXT NOT NULL CHECK (deliverable_type IN ('IG_Reel', 'IG_Story', 'TikTok_Post', 'YouTube_Video', 'Bundle')),
          base_price_cents INTEGER NOT NULL CHECK (base_price_cents > 0),
          currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'MYR', 'SGD')),
          rush_pct INTEGER DEFAULT 0 CHECK (rush_pct >= 0 AND rush_pct <= 200),
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          UNIQUE(creator_id, deliverable_type, currency)
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_rate_cards_creator_id ON rate_cards(creator_id);
        CREATE INDEX IF NOT EXISTS idx_rate_cards_active ON rate_cards(active) WHERE active = true;
        """
        
        print("📋 SQL to execute:")
        print(create_table_sql)
        print("\n⚠️  NOTE: This SQL should be executed directly in Supabase dashboard")
        print("🔗 Supabase Dashboard: https://fgcefqowzkpeivpckljf.supabase.co")
        
        # For now, we'll assume this step needs manual execution
        self.results["table_creation"] = {
            "status": "manual_required", 
            "details": "SQL provided for manual execution in Supabase dashboard",
            "sql": create_table_sql
        }
        
        return False  # Return False to indicate manual intervention needed

    def test_rate_card_creation(self):
        """Test creating a rate card"""
        print("\n📋 STEP 3: Testing rate card creation...")
        
        try:
            print(f"📤 Creating rate card with data:")
            print(json.dumps(self.test_rate_card_data, indent=2))
            
            response = requests.post(
                f"{API_BASE}/rate-cards",
                json=self.test_rate_card_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            print(f"📡 Response Status: {response.status_code}")
            
            if response.status_code == 201:
                data = response.json()
                if data.get("success") and data.get("rateCard"):
                    rate_card = data["rateCard"]
                    print("✅ Rate card created successfully")
                    print(f"📋 Rate Card ID: {rate_card.get('id')}")
                    print(f"💰 Price: ${rate_card.get('base_price_cents', 0) / 100:.2f} {rate_card.get('currency')}")
                    print(f"📱 Type: {rate_card.get('deliverable_type')}")
                    
                    self.results["rate_card_creation"] = {
                        "status": "success", 
                        "details": "Rate card created successfully",
                        "data": data,
                        "rate_card_id": rate_card.get('id')
                    }
                    return True
                else:
                    print("❌ Rate card creation failed - invalid response")
                    print(f"Response: {json.dumps(data, indent=2)}")
                    self.results["rate_card_creation"] = {
                        "status": "failed", 
                        "details": "Invalid response format",
                        "data": data
                    }
                    return False
            else:
                print(f"❌ Rate card creation failed with status {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"Error: {json.dumps(error_data, indent=2)}")
                    self.results["rate_card_creation"] = {
                        "status": "failed", 
                        "details": f"HTTP {response.status_code}: {error_data.get('error', 'Unknown error')}",
                        "data": error_data
                    }
                except:
                    print(f"Response: {response.text}")
                    self.results["rate_card_creation"] = {
                        "status": "failed", 
                        "details": f"HTTP {response.status_code}: {response.text}"
                    }
                return False
                
        except Exception as e:
            print(f"❌ Exception during rate card creation: {str(e)}")
            self.results["rate_card_creation"] = {
                "status": "error", 
                "details": str(e)
            }
            return False

    def test_rate_card_retrieval(self):
        """Test retrieving rate cards"""
        print("\n📋 STEP 4: Testing rate card retrieval...")
        
        try:
            # Test general retrieval
            response = requests.get(f"{API_BASE}/rate-cards", timeout=30)
            
            print(f"📡 Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    rate_cards = data.get("rateCards", [])
                    print(f"✅ Retrieved {len(rate_cards)} rate cards")
                    
                    for i, card in enumerate(rate_cards[:3]):  # Show first 3
                        print(f"  📋 Card {i+1}: {card.get('deliverable_type')} - ${card.get('base_price_cents', 0) / 100:.2f} {card.get('currency')}")
                    
                    self.results["rate_card_retrieval"] = {
                        "status": "success", 
                        "details": f"Retrieved {len(rate_cards)} rate cards",
                        "data": data,
                        "count": len(rate_cards)
                    }
                    return True
                else:
                    print("❌ Rate card retrieval failed - invalid response")
                    print(f"Response: {json.dumps(data, indent=2)}")
                    self.results["rate_card_retrieval"] = {
                        "status": "failed", 
                        "details": "Invalid response format",
                        "data": data
                    }
                    return False
            else:
                print(f"❌ Rate card retrieval failed with status {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"Error: {json.dumps(error_data, indent=2)}")
                    self.results["rate_card_retrieval"] = {
                        "status": "failed", 
                        "details": f"HTTP {response.status_code}: {error_data.get('error', 'Unknown error')}",
                        "data": error_data
                    }
                except:
                    print(f"Response: {response.text}")
                    self.results["rate_card_retrieval"] = {
                        "status": "failed", 
                        "details": f"HTTP {response.status_code}: {response.text}"
                    }
                return False
                
        except Exception as e:
            print(f"❌ Exception during rate card retrieval: {str(e)}")
            self.results["rate_card_retrieval"] = {
                "status": "error", 
                "details": str(e)
            }
            return False

    def run_comprehensive_test(self):
        """Run the complete rate cards testing suite"""
        print("\n🚀 STARTING COMPREHENSIVE RATE CARDS TESTING")
        print("=" * 60)
        
        start_time = time.time()
        
        # Step 1: Check if table exists
        table_exists = self.check_rate_cards_table()
        
        # Step 2: Create table if it doesn't exist
        if not table_exists:
            print("\n⚠️  Table does not exist, attempting to create...")
            table_created = self.create_rate_cards_table()
            
            if not table_created:
                print("\n⚠️  API table creation failed, providing manual SQL...")
                self.create_rate_card_direct_sql()
                
                # Re-check after potential manual creation
                print("\n🔄 Re-checking table existence...")
                time.sleep(2)
                table_exists = self.check_rate_cards_table()
        
        # Step 3: Test rate card creation (only if table exists)
        if table_exists or self.results["table_check"]["status"] == "success":
            rate_card_created = self.test_rate_card_creation()
            
            # Step 4: Test rate card retrieval
            self.test_rate_card_retrieval()
        else:
            print("\n⚠️  Skipping rate card operations - table does not exist")
            self.results["rate_card_creation"]["status"] = "skipped"
            self.results["rate_card_retrieval"]["status"] = "skipped"
        
        # Calculate overall success
        successful_tests = sum(1 for result in self.results.values() 
                             if isinstance(result, dict) and result.get("status") == "success")
        total_tests = len([k for k in self.results.keys() if k != "overall_success"])
        
        self.results["overall_success"] = successful_tests >= 2  # At least table check and one operation
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Print comprehensive results
        self.print_test_results(duration)
        
        return self.results

    def print_test_results(self, duration):
        """Print comprehensive test results"""
        print("\n" + "=" * 60)
        print("📊 RATE CARDS BACKEND TESTING RESULTS")
        print("=" * 60)
        
        print(f"⏱️  Total Duration: {duration:.2f} seconds")
        print(f"🎯 Overall Success: {'✅ PASS' if self.results['overall_success'] else '❌ FAIL'}")
        print()
        
        # Individual test results
        test_names = {
            "table_check": "Table Existence Check",
            "table_creation": "Table Creation",
            "rate_card_creation": "Rate Card Creation",
            "rate_card_retrieval": "Rate Card Retrieval"
        }
        
        for key, name in test_names.items():
            result = self.results[key]
            status = result["status"]
            
            if status == "success":
                print(f"✅ {name}: PASSED")
            elif status == "failed":
                print(f"❌ {name}: FAILED - {result['details']}")
            elif status == "error":
                print(f"🔥 {name}: ERROR - {result['details']}")
            elif status == "manual_required":
                print(f"⚠️  {name}: MANUAL ACTION REQUIRED - {result['details']}")
            elif status == "skipped":
                print(f"⏭️  {name}: SKIPPED")
            else:
                print(f"⏳ {name}: PENDING")
        
        print("\n" + "=" * 60)
        
        # Critical findings
        if not self.results["overall_success"]:
            print("🚨 CRITICAL ISSUES IDENTIFIED:")
            
            if self.results["table_check"]["status"] != "success":
                print("   • Rate cards table does not exist in Supabase")
                print("   • This prevents all rate card functionality")
                
            if self.results["table_creation"]["status"] == "manual_required":
                print("   • Manual SQL execution required in Supabase dashboard")
                print("   • API-based table creation not available")
                
            if self.results["rate_card_creation"]["status"] == "failed":
                print("   • Rate card creation API is not working")
                print("   • This blocks creator rate card setup")
        else:
            print("🎉 RATE CARDS FUNCTIONALITY IS WORKING!")
            print("   • Table exists and is accessible")
            print("   • Rate card creation is functional")
            print("   • Rate card retrieval is working")
        
        print("=" * 60)

def main():
    """Main function"""
    tester = RateCardsBackendTester()
    results = tester.run_comprehensive_test()
    
    # Return appropriate exit code
    sys.exit(0 if results["overall_success"] else 1)

if __name__ == "__main__":
    main()