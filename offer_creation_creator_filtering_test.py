#!/usr/bin/env python3
"""
Offer Creation Creator Filtering Test
====================================

This test investigates why the creator "test.creator@example.com" might not be 
appearing in the offer creation page despite existing in the system.

Focus Areas:
1. Test offer creation API endpoints
2. Check creator filtering logic
3. Verify rate cards requirement
4. Test creator availability for offers
5. Check any business logic that might filter creators
"""

import requests
import json
import time
from datetime import datetime

class OfferCreationFilteringTester:
    def __init__(self):
        self.base_url = "https://www.sparkplatform.tech"
        self.api_base = f"{self.base_url}/api"
        self.target_creator_id = "5b408260-4d3d-4392-a589-0a485a4152a9"
        self.target_email = "test.creator@example.com"
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def test_rate_cards_api(self):
        """Test if the creator has rate cards which might be required for offers"""
        self.log("💰 Testing Rate Cards API for target creator...")
        
        try:
            # Test general rate cards endpoint
            response = requests.get(f"{self.api_base}/rate-cards", timeout=30)
            self.log(f"Rate Cards API Response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                rate_cards = data.get('rateCards', [])
                self.log(f"✅ Found {len(rate_cards)} total rate cards in system")
                
                # Filter for target creator
                creator_rate_cards = [rc for rc in rate_cards if rc.get('creator_id') == self.target_creator_id]
                self.log(f"🎯 Target creator has {len(creator_rate_cards)} rate cards")
                
                if creator_rate_cards:
                    self.log("✅ Target creator HAS rate cards:")
                    for rc in creator_rate_cards:
                        self.log(f"   - {rc.get('deliverable_type')}: ${rc.get('base_price_cents', 0)/100:.2f} {rc.get('currency')}")
                    return True
                else:
                    self.log("❌ Target creator has NO rate cards - this might prevent offer creation")
                    return False
            else:
                self.log(f"❌ Rate Cards API failed: {response.status_code}")
                return None
                
        except Exception as e:
            self.log(f"❌ Rate Cards API error: {str(e)}")
            return None
    
    def test_creator_specific_rate_cards(self):
        """Test creator-specific rate cards endpoint"""
        self.log("🎯 Testing Creator-Specific Rate Cards...")
        
        try:
            response = requests.get(
                f"{self.api_base}/rate-cards?creator_id={self.target_creator_id}", 
                timeout=30
            )
            self.log(f"Creator Rate Cards Response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                rate_cards = data.get('rateCards', [])
                self.log(f"✅ Creator-specific query returned {len(rate_cards)} rate cards")
                
                if rate_cards:
                    for rc in rate_cards:
                        active = rc.get('active', False)
                        status = "✅ Active" if active else "❌ Inactive"
                        self.log(f"   - {rc.get('deliverable_type')}: ${rc.get('base_price_cents', 0)/100:.2f} {rc.get('currency')} ({status})")
                
                return len(rate_cards) > 0
            else:
                self.log(f"❌ Creator Rate Cards failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Creator Rate Cards error: {str(e)}")
            return False
    
    def test_offers_api(self):
        """Test offers API to see if creator can be found there"""
        self.log("📋 Testing Offers API...")
        
        try:
            response = requests.get(f"{self.api_base}/offers", timeout=30)
            self.log(f"Offers API Response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                offers = data.get('offers', [])
                self.log(f"✅ Found {len(offers)} total offers in system")
                
                # Look for offers involving target creator
                creator_offers = []
                for offer in offers:
                    if (offer.get('creator_id') == self.target_creator_id or 
                        (offer.get('creator') and offer.get('creator', {}).get('id') == self.target_creator_id)):
                        creator_offers.append(offer)
                
                self.log(f"🎯 Target creator involved in {len(creator_offers)} offers")
                
                if creator_offers:
                    self.log("✅ Target creator HAS existing offers:")
                    for offer in creator_offers[:3]:  # Show first 3
                        status = offer.get('status', 'unknown')
                        campaign_title = offer.get('campaign', {}).get('title', 'Unknown Campaign')
                        self.log(f"   - {campaign_title}: {status}")
                
                return len(creator_offers) > 0
            else:
                self.log(f"❌ Offers API failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Offers API error: {str(e)}")
            return False
    
    def test_campaigns_api_for_creator_visibility(self):
        """Test campaigns API to see how creators are presented"""
        self.log("🎪 Testing Campaigns API for Creator Visibility...")
        
        try:
            response = requests.get(f"{self.api_base}/campaigns", timeout=30)
            self.log(f"Campaigns API Response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                campaigns = data.get('campaigns', [])
                self.log(f"✅ Found {len(campaigns)} campaigns")
                
                # Check if campaigns have creator-related fields
                for campaign in campaigns[:3]:  # Check first 3 campaigns
                    campaign_id = campaign.get('id')
                    title = campaign.get('title', 'Untitled')
                    status = campaign.get('status', 'unknown')
                    self.log(f"   Campaign: {title} (Status: {status})")
                
                return True
            else:
                self.log(f"❌ Campaigns API failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Campaigns API error: {str(e)}")
            return False
    
    def test_profile_completeness_requirements(self):
        """Test if profile completeness affects creator visibility"""
        self.log("📋 Testing Profile Completeness Requirements...")
        
        try:
            response = requests.get(f"{self.api_base}/profiles", timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                profiles = data.get('profiles', [])
                
                # Find target creator
                target_creator = None
                for profile in profiles:
                    if profile.get('id') == self.target_creator_id:
                        target_creator = profile
                        break
                
                if target_creator:
                    self.log("✅ Found target creator profile")
                    
                    # Check completeness factors that might affect visibility
                    completeness_factors = {
                        'bio': target_creator.get('bio'),
                        'profile_picture': target_creator.get('profile_picture'),
                        'social_links': target_creator.get('social_links'),
                        'category_tags': target_creator.get('category_tags'),
                        'website_url': target_creator.get('website_url'),
                        'media_kit_url': target_creator.get('media_kit_url')
                    }
                    
                    complete_fields = 0
                    total_fields = len(completeness_factors)
                    
                    for field, value in completeness_factors.items():
                        if value:
                            complete_fields += 1
                            self.log(f"   ✅ {field}: Present")
                        else:
                            self.log(f"   ❌ {field}: Missing")
                    
                    completeness_percentage = (complete_fields / total_fields) * 100
                    self.log(f"📊 Profile Completeness: {completeness_percentage:.1f}% ({complete_fields}/{total_fields})")
                    
                    # Check if low completeness might affect visibility
                    if completeness_percentage < 50:
                        self.log("⚠️ Low profile completeness might affect creator visibility in offers")
                        return False
                    else:
                        self.log("✅ Profile completeness should not affect visibility")
                        return True
                else:
                    self.log("❌ Target creator profile not found")
                    return False
            else:
                self.log(f"❌ Profiles API failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Profile completeness check error: {str(e)}")
            return False
    
    def test_creator_availability_status(self):
        """Test if creator has any availability status that might affect visibility"""
        self.log("🟢 Testing Creator Availability Status...")
        
        try:
            # Check if there's an availability or status field
            response = requests.get(f"{self.api_base}/profiles", timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                profiles = data.get('profiles', [])
                
                target_creator = None
                for profile in profiles:
                    if profile.get('id') == self.target_creator_id:
                        target_creator = profile
                        break
                
                if target_creator:
                    # Check for status-related fields
                    status_fields = {
                        'status': target_creator.get('status'),
                        'active': target_creator.get('active'),
                        'available': target_creator.get('available'),
                        'verified': target_creator.get('verified'),
                        'onboarding_completed': target_creator.get('onboarding_completed')
                    }
                    
                    self.log("Creator Status Fields:")
                    for field, value in status_fields.items():
                        if value is not None:
                            self.log(f"   {field}: {value}")
                        else:
                            self.log(f"   {field}: Not set")
                    
                    # Check for potential blocking conditions
                    if target_creator.get('active') is False:
                        self.log("❌ Creator is marked as inactive")
                        return False
                    
                    if target_creator.get('status') in ['suspended', 'banned', 'inactive']:
                        self.log(f"❌ Creator has blocking status: {target_creator.get('status')}")
                        return False
                    
                    if target_creator.get('onboarding_completed') is False:
                        self.log("⚠️ Creator onboarding not completed - might affect visibility")
                        return False
                    
                    self.log("✅ No blocking status conditions found")
                    return True
                else:
                    self.log("❌ Target creator not found for status check")
                    return False
            else:
                self.log(f"❌ Status check failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Availability status check error: {str(e)}")
            return False
    
    def run_comprehensive_filtering_test(self):
        """Run comprehensive filtering test"""
        self.log("🚀 Starting Comprehensive Offer Creation Filtering Test")
        self.log("=" * 70)
        
        start_time = time.time()
        test_results = {}
        
        try:
            # Test 1: Rate Cards
            self.log("\n1️⃣ RATE CARDS TEST")
            test_results['has_rate_cards'] = self.test_rate_cards_api()
            test_results['creator_specific_rate_cards'] = self.test_creator_specific_rate_cards()
            
            # Test 2: Existing Offers
            self.log("\n2️⃣ EXISTING OFFERS TEST")
            test_results['has_existing_offers'] = self.test_offers_api()
            
            # Test 3: Campaign Visibility
            self.log("\n3️⃣ CAMPAIGN VISIBILITY TEST")
            test_results['campaigns_accessible'] = self.test_campaigns_api_for_creator_visibility()
            
            # Test 4: Profile Completeness
            self.log("\n4️⃣ PROFILE COMPLETENESS TEST")
            test_results['profile_complete'] = self.test_profile_completeness_requirements()
            
            # Test 5: Availability Status
            self.log("\n5️⃣ AVAILABILITY STATUS TEST")
            test_results['availability_ok'] = self.test_creator_availability_status()
            
        except Exception as e:
            self.log(f"❌ Test suite failed: {str(e)}")
        
        end_time = time.time()
        duration = end_time - start_time
        
        self.log("\n" + "=" * 70)
        self.log(f"🏁 Filtering test completed in {duration:.2f} seconds")
        
        return test_results
    
    def print_filtering_analysis(self, results):
        """Print analysis of filtering test results"""
        self.log("\n" + "=" * 70)
        self.log("📊 OFFER CREATION FILTERING ANALYSIS")
        self.log("=" * 70)
        
        # Analyze potential blocking factors
        blocking_factors = []
        
        if results.get('has_rate_cards') is False:
            blocking_factors.append("❌ No rate cards - creators might need rate cards to appear in offers")
        
        if results.get('creator_specific_rate_cards') is False:
            blocking_factors.append("❌ Creator-specific rate cards query failed")
        
        if results.get('profile_complete') is False:
            blocking_factors.append("❌ Incomplete profile - might be filtered out")
        
        if results.get('availability_ok') is False:
            blocking_factors.append("❌ Availability issues - creator might be inactive/suspended")
        
        # Print results summary
        self.log("🎯 TEST RESULTS SUMMARY:")
        for test_name, result in results.items():
            if result is True:
                self.log(f"   ✅ {test_name}: PASS")
            elif result is False:
                self.log(f"   ❌ {test_name}: FAIL")
            else:
                self.log(f"   ⚠️ {test_name}: UNKNOWN")
        
        # Print blocking factors
        if blocking_factors:
            self.log(f"\n⚠️ POTENTIAL BLOCKING FACTORS ({len(blocking_factors)}):")
            for i, factor in enumerate(blocking_factors, 1):
                self.log(f"   {i}. {factor}")
        else:
            self.log("\n✅ NO OBVIOUS BLOCKING FACTORS IDENTIFIED")
        
        # Recommendations
        self.log("\n💡 RECOMMENDATIONS:")
        
        if results.get('has_rate_cards') is False:
            self.log("   1. Create rate cards for the creator to enable offer creation")
            self.log("   2. Check if rate cards are required for creator visibility")
        
        if results.get('profile_complete') is False:
            self.log("   3. Complete creator profile (bio, profile picture, etc.)")
        
        if results.get('availability_ok') is False:
            self.log("   4. Check creator status and onboarding completion")
        
        self.log("   5. Test offer creation page with browser developer tools")
        self.log("   6. Check frontend filtering logic in offer creation component")
        self.log("   7. Verify API endpoints used by offer creation page")
        
        self.log("\n" + "=" * 70)

def main():
    """Main function to run the offer creation filtering test"""
    print("🔍 Offer Creation Creator Filtering Test")
    print("=" * 50)
    print("Investigating why test.creator@example.com might not appear in offer creation")
    print("=" * 50)
    
    tester = OfferCreationFilteringTester()
    
    try:
        # Run comprehensive test
        results = tester.run_comprehensive_filtering_test()
        
        # Print analysis
        tester.print_filtering_analysis(results)
        
        return results
        
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user")
        return None
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        return None

if __name__ == "__main__":
    results = main()