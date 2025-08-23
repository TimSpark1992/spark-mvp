#!/usr/bin/env python3
"""
Media Kit Upload Button Fix Verification Test
===========================================

Quick verification test for the media kit upload button fix as requested in review.
Checks if:
1. The media kit upload button structure has been corrected (no longer wrapped in label with Button inside)
2. The onClick handler is properly implemented to trigger the file input
3. The file input has the correct accept types and onChange handler
4. The upload functionality should now be clickable

CONTEXT: User reported that profile picture upload now works (confirming the "TypeError: r is not a function" 
fix was successful), but media kit upload button wasn't responding to clicks. Applied fix to change from 
label-wrapped Button to direct Button with onClick handler that programmatically triggers the file input.
"""

import re
import sys
import os

def test_media_kit_upload_button_structure():
    """Test the media kit upload button structure and implementation"""
    
    print("🎯 MEDIA KIT UPLOAD BUTTON FIX VERIFICATION")
    print("=" * 60)
    
    # Read the creator profile page
    profile_page_path = "/app/app/creator/profile/page.js"
    
    if not os.path.exists(profile_page_path):
        print("❌ CRITICAL: Creator profile page not found")
        return False
    
    with open(profile_page_path, 'r') as f:
        content = f.read()
    
    print("✅ Creator profile page loaded successfully")
    
    # Test 1: Verify media kit upload button structure is NOT wrapped in label
    print("\n📋 TEST 1: Button Structure Verification")
    print("-" * 40)
    
    # Look for the media kit upload section
    media_kit_section_match = re.search(
        r'<div className="pt-6 border-t border-white/10">(.*?)</div>\s*</div>\s*</Card>',
        content,
        re.DOTALL
    )
    
    if not media_kit_section_match:
        print("❌ Could not find media kit upload section")
        return False
    
    media_kit_section = media_kit_section_match.group(1)
    print("✅ Media kit upload section found")
    
    # Check that there's NO label wrapping the Button (old problematic structure)
    label_wrapped_button = re.search(r'<label[^>]*>.*?<Button[^>]*>.*?</Button>.*?</label>', media_kit_section, re.DOTALL)
    
    if label_wrapped_button:
        print("❌ ISSUE FOUND: Button is still wrapped in label (old problematic structure)")
        print("   This would cause the click responsiveness issue")
        return False
    else:
        print("✅ VERIFIED: Button is NOT wrapped in label (fix applied correctly)")
    
    # Test 2: Verify direct Button with onClick handler
    print("\n📋 TEST 2: Direct Button with onClick Handler")
    print("-" * 40)
    
    # Look for Button with onClick handler
    button_onclick_match = re.search(
        r'<Button[^>]*onClick=\{[^}]*\}[^>]*>(.*?)</Button>',
        media_kit_section,
        re.DOTALL
    )
    
    if not button_onclick_match:
        print("❌ ISSUE: No Button with onClick handler found")
        return False
    
    button_content = button_onclick_match.group(0)
    print("✅ VERIFIED: Direct Button with onClick handler found")
    print(f"   Button structure: {button_content[:100]}...")
    
    # Test 3: Verify onClick handler triggers file input programmatically
    print("\n📋 TEST 3: onClick Handler Implementation")
    print("-" * 40)
    
    # Look for the onClick implementation that triggers file input
    onclick_implementation = re.search(
        r'onClick=\{[^}]*\(\) => \{[^}]*document\.getElementById\([^)]*\)[^}]*\.click\(\)[^}]*\}\}',
        content
    )
    
    if not onclick_implementation:
        print("❌ ISSUE: onClick handler doesn't programmatically trigger file input")
        return False
    
    print("✅ VERIFIED: onClick handler programmatically triggers file input")
    print("   Implementation: document.getElementById().click() pattern found")
    
    # Test 4: Verify file input has correct attributes
    print("\n📋 TEST 4: File Input Configuration")
    print("-" * 40)
    
    # Look for the file input element
    file_input_match = re.search(
        r'<input[^>]*type="file"[^>]*id="media-kit-upload"[^>]*/>',
        content
    )
    
    if not file_input_match:
        print("❌ ISSUE: File input with correct id not found")
        return False
    
    file_input = file_input_match.group(0)
    print("✅ VERIFIED: File input element found")
    
    # Check accept attribute
    if 'accept=".pdf,image/jpeg,image/png,image/webp"' in file_input:
        print("✅ VERIFIED: File input has correct accept types")
    else:
        print("❌ ISSUE: File input missing or has incorrect accept types")
        return False
    
    # Check onChange handler
    if 'onChange={handleMediaKitUpload}' in file_input:
        print("✅ VERIFIED: File input has correct onChange handler")
    else:
        print("❌ ISSUE: File input missing onChange handler")
        return False
    
    # Check hidden attribute
    if 'className="hidden"' in file_input:
        print("✅ VERIFIED: File input is properly hidden")
    else:
        print("❌ ISSUE: File input should be hidden")
        return False
    
    # Test 5: Verify handleMediaKitUpload function exists
    print("\n📋 TEST 5: Upload Handler Function")
    print("-" * 40)
    
    # Look for handleMediaKitUpload function
    upload_handler_match = re.search(
        r'const handleMediaKitUpload = async \(e\) => \{',
        content
    )
    
    if not upload_handler_match:
        print("❌ ISSUE: handleMediaKitUpload function not found")
        return False
    
    print("✅ VERIFIED: handleMediaKitUpload function exists")
    
    # Test 6: Verify the fix addresses the original issue
    print("\n📋 TEST 6: Fix Validation Summary")
    print("-" * 40)
    
    print("✅ ORIGINAL ISSUE: Media kit upload button wasn't responding to clicks")
    print("✅ ROOT CAUSE: Button was wrapped in label with Button inside")
    print("✅ FIX APPLIED: Changed to direct Button with onClick handler")
    print("✅ VERIFICATION: All components properly implemented")
    
    return True

def main():
    """Main test execution"""
    
    try:
        success = test_media_kit_upload_button_structure()
        
        print("\n" + "=" * 60)
        if success:
            print("🎉 MEDIA KIT UPLOAD BUTTON FIX VERIFICATION: SUCCESS")
            print("✅ All tests passed - the fix has been properly applied")
            print("✅ Media kit upload button should now be clickable")
            print("✅ Button structure is correct (no label wrapping)")
            print("✅ onClick handler properly triggers file input")
            print("✅ File input has correct accept types and onChange handler")
        else:
            print("❌ MEDIA KIT UPLOAD BUTTON FIX VERIFICATION: FAILED")
            print("❌ Issues found in the implementation")
        
        return success
        
    except Exception as e:
        print(f"❌ CRITICAL ERROR during verification: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)