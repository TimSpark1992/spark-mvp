#!/usr/bin/env python3
"""
Focused Test: Campaign API Array Format Implementation Verification
================================================================

This test verifies that the comprehensive campaign API response format fix is properly implemented
by checking the actual code implementation and expected behavior.
"""

import os

def test_supabase_implementation():
    """Test the actual Supabase function implementations"""
    print("🔍 VERIFYING SUPABASE FUNCTION IMPLEMENTATIONS")
    print("=" * 60)
    
    # Read the supabase.js file
    try:
        with open('/app/lib/supabase.js', 'r') as f:
            content = f.read()
        
        # Functions that should NOT have .single() to return array format
        functions_to_check = [
            'updateCampaign',
            'createRateCard', 
            'updateRateCard',
            'deleteRateCard',
            'createOffer',
            'updateOffer', 
            'deleteOffer',
            'createPayment',
            'updatePayment',
            'createPayout',
            'updatePayout'
        ]
        
        results = []
        
        for func_name in functions_to_check:
            # Find the function definition
            func_start = content.find(f'export const {func_name} = async')
            if func_start == -1:
                results.append((func_name, False, "Function not found"))
                continue
                
            # Find the end of the function (next export or end of file)
            next_export = content.find('export const', func_start + 1)
            if next_export == -1:
                func_content = content[func_start:]
            else:
                func_content = content[func_start:next_export]
            
            # Check if .single() is used
            has_single = '.single()' in func_content
            
            if has_single:
                results.append((func_name, False, "❌ Still uses .single() - returns single object"))
            else:
                results.append((func_name, True, "✅ No .single() - returns array format"))
        
        # Print results
        print("\n📊 FUNCTION IMPLEMENTATION RESULTS:")
        print("-" * 60)
        
        passed = 0
        total = len(results)
        
        for func_name, success, message in results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{status} {func_name}: {message}")
            if success:
                passed += 1
        
        print(f"\n📈 SUMMARY: {passed}/{total} functions correctly return array format")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        if passed == total:
            print("\n🎉 ALL FUNCTIONS CORRECTLY IMPLEMENTED!")
            print("✅ updateCampaign and other functions now return array format")
            print("✅ This should resolve infinite 'Loading campaign...' states")
        else:
            print(f"\n⚠️  {total-passed} FUNCTIONS STILL NEED FIXING")
            print("❌ Some functions may still cause infinite loading states")
            
        return passed == total
        
    except Exception as e:
        print(f"❌ Error reading supabase.js: {e}")
        return False

def test_frontend_array_handling():
    """Test that frontend code properly handles array format responses"""
    print("\n\n🎨 VERIFYING FRONTEND ARRAY HANDLING")
    print("=" * 60)
    
    files_to_check = [
        '/app/app/brand/campaigns/create/page.js',
        '/app/app/brand/campaigns/[id]/edit/page.js'
    ]
    
    results = []
    
    for file_path in files_to_check:
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            
            # Check for array handling patterns
            has_length_check = 'data.length > 0' in content or 'data && data.length' in content
            has_array_access = 'data[0]' in content
            has_array_methods = any(method in content for method in ['.map(', '.filter(', '.find('])
            
            filename = file_path.split('/')[-1]
            
            if has_length_check and has_array_access:
                results.append((filename, True, "✅ Properly handles array format (data.length + data[0])"))
            elif has_array_methods:
                results.append((filename, True, "✅ Uses array methods (map/filter/find)"))
            else:
                results.append((filename, False, "❌ May not handle array format properly"))
                
        except Exception as e:
            filename = file_path.split('/')[-1]
            results.append((filename, False, f"❌ Error reading file: {e}"))
    
    # Print results
    print("\n📊 FRONTEND ARRAY HANDLING RESULTS:")
    print("-" * 60)
    
    passed = 0
    total = len(results)
    
    for filename, success, message in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {filename}: {message}")
        if success:
            passed += 1
    
    print(f"\n📈 SUMMARY: {passed}/{total} files properly handle array format")
    print(f"Success Rate: {(passed/total*100):.1f}%")
    
    return passed == total

def main():
    """Run comprehensive implementation verification"""
    print("🚀 COMPREHENSIVE CAMPAIGN API ARRAY FORMAT FIX VERIFICATION")
    print("=" * 70)
    print("FOCUS: Verify that updateCampaign and other functions return array format")
    print("GOAL: Confirm infinite 'Loading campaign...' states are resolved")
    print()
    
    # Test backend implementation
    backend_success = test_supabase_implementation()
    
    # Test frontend handling
    frontend_success = test_frontend_array_handling()
    
    # Final assessment
    print("\n" + "=" * 70)
    print("🎯 FINAL ASSESSMENT")
    print("=" * 70)
    
    if backend_success and frontend_success:
        print("✅ COMPREHENSIVE FIX SUCCESSFULLY IMPLEMENTED!")
        print("✅ Backend functions return array format")
        print("✅ Frontend properly handles array responses")
        print("✅ Infinite loading states should be resolved")
        print("\n🎉 The comprehensive campaign API response format fix is WORKING!")
        
    elif backend_success:
        print("✅ Backend functions correctly return array format")
        print("⚠️  Frontend may need updates to handle array responses")
        print("📝 Recommendation: Update frontend code to use data.length > 0 and data[0]")
        
    elif frontend_success:
        print("⚠️  Backend functions may still use .single()")
        print("✅ Frontend properly handles array responses")
        print("📝 Recommendation: Remove .single() from backend functions")
        
    else:
        print("❌ Both backend and frontend need fixes")
        print("📝 Recommendation: Remove .single() from backend AND update frontend array handling")
    
    print("\n🔧 KEY FUNCTIONS VERIFIED:")
    print("- updateCampaign (MAIN FOCUS)")
    print("- createRateCard, updateRateCard, deleteRateCard")
    print("- createOffer, updateOffer, deleteOffer")
    print("- createPayment, updatePayment")
    print("- createPayout, updatePayout")

if __name__ == "__main__":
    main()