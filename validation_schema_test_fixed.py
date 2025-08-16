#!/usr/bin/env python3
"""
Enhanced Validation Schema XSS Protection Testing (Fixed)
Tests the enhanced validation schemas with XSS attack vectors
"""

import subprocess
import json
import os

def test_validation_schemas():
    """Test enhanced validation schemas with XSS vectors"""
    print("🔒 Testing Enhanced Validation Schemas with XSS Protection")
    print("=" * 70)
    
    # Create a Node.js test script to test the validation schemas
    test_script = """
const { enhancedSignUpSchema, enhancedCampaignSchema, enhancedProfileUpdateSchema, enhancedApplicationSchema, runXSSProtectionTest } = require('./lib/validation-enhanced.js');

const xssVectors = [
    '<script>alert("xss")</script>',
    '<img src="x" onerror="alert(1)">',
    'javascript:alert("xss")',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<svg onload="alert(1)">',
    '<body onload="alert(1)">',
    '<div onclick="alert(1)">Click me</div>',
    '<a href="javascript:alert(1)">Link</a>',
    '"><script>alert(1)</script>',
    '<script>document.cookie</script>',
    '<img src="" onerror="window.location=\\'http://evil.com\\'">',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox("xss")',
    '<style>@import "javascript:alert(1)"</style>'
];

console.log('\\n=== Testing Enhanced SignUp Schema ===');
let signupResults = { passed: 0, total: 0 };

xssVectors.forEach((vector, index) => {
    signupResults.total++;
    try {
        const testData = {
            email: `test${index}@example.com`,
            password: 'ValidPass123',
            confirmPassword: 'ValidPass123',
            fullName: `John Doe ${vector}`,
            role: 'creator'
        };
        
        const result = enhancedSignUpSchema.safeParse(testData);
        
        if (result.success) {
            const sanitizedName = result.data.fullName;
            const hasDangerous = sanitizedName.toLowerCase().includes('script') || 
                               sanitizedName.toLowerCase().includes('javascript:') ||
                               /on\\w+\\s*=/i.test(sanitizedName);
            
            if (!hasDangerous) {
                console.log(`✅ Vector ${index + 1}: Sanitized successfully`);
                console.log(`   Original: "${vector}"`);
                console.log(`   Sanitized: "${sanitizedName}"`);
                signupResults.passed++;
            } else {
                console.log(`❌ Vector ${index + 1}: Dangerous content not removed`);
                console.log(`   Original: "${vector}"`);
                console.log(`   Result: "${sanitizedName}"`);
            }
        } else {
            console.log(`✅ Vector ${index + 1}: Schema rejected malicious input`);
            console.log(`   Error: ${result.error.errors[0]?.message}`);
            signupResults.passed++;
        }
    } catch (error) {
        console.log(`❌ Vector ${index + 1}: Schema error - ${error.message}`);
    }
});

console.log(`\\nSignUp Schema Results: ${signupResults.passed}/${signupResults.total} passed (${(signupResults.passed/signupResults.total*100).toFixed(1)}%)`);

console.log('\\n=== Testing Enhanced Campaign Schema ===');
let campaignResults = { passed: 0, total: 0 };

xssVectors.slice(0, 5).forEach((vector, index) => {
    campaignResults.total++;
    try {
        const testData = {
            title: `Campaign Title ${vector}`,
            description: `Campaign description with safe content. ${vector}`,
            category: 'Technology',
            budget_range: '$1000-$5000'
        };
        
        const result = enhancedCampaignSchema.safeParse(testData);
        
        if (result.success) {
            const sanitizedTitle = result.data.title;
            const sanitizedDesc = result.data.description;
            
            const titleSafe = !sanitizedTitle.toLowerCase().includes('script') && 
                            !sanitizedTitle.toLowerCase().includes('javascript:') &&
                            !/on\\w+\\s*=/i.test(sanitizedTitle);
            
            const descSafe = !sanitizedDesc.toLowerCase().includes('script') && 
                           !sanitizedDesc.toLowerCase().includes('javascript:') &&
                           !/on\\w+\\s*=/i.test(sanitizedDesc);
            
            if (titleSafe && descSafe) {
                console.log(`✅ Campaign Vector ${index + 1}: Sanitized successfully`);
                campaignResults.passed++;
            } else {
                console.log(`❌ Campaign Vector ${index + 1}: Dangerous content not removed`);
                console.log(`   Title: "${sanitizedTitle}"`);
                console.log(`   Description: "${sanitizedDesc}"`);
            }
        } else {
            console.log(`✅ Campaign Vector ${index + 1}: Schema rejected malicious input`);
            campaignResults.passed++;
        }
    } catch (error) {
        console.log(`❌ Campaign Vector ${index + 1}: Schema error - ${error.message}`);
    }
});

console.log(`\\nCampaign Schema Results: ${campaignResults.passed}/${campaignResults.total} passed (${(campaignResults.passed/campaignResults.total*100).toFixed(1)}%)`);

console.log('\\n=== Running XSS Protection Test Suite ===');
try {
    const xssTestResult = runXSSProtectionTest();
    console.log(`XSS Test Suite Results: ${xssTestResult.safeResults}/${xssTestResult.totalTests} safe (${xssTestResult.successRate.toFixed(1)}%)`);
    console.log(`All Safe: ${xssTestResult.allSafe}`);
    
    if (!xssTestResult.allSafe) {
        console.log('\\n⚠️ Unsafe Results:');
        xssTestResult.results
            .filter(r => !r.safe && !r.blocked)
            .forEach(r => console.log(`  - "${r.original}" → "${r.sanitized}"`));
    }
} catch (error) {
    console.log(`❌ XSS Test Suite Error: ${error.message}`);
}

console.log('\\n=== Testing XSS Protection Functions ===');
try {
    const { sanitizeInput, sanitizeText, sanitizeHTML, sanitizeFieldValue } = require('./lib/xss-protection.js');
    
    let xssFunctionResults = { passed: 0, total: 0 };
    
    xssVectors.slice(0, 5).forEach((vector, index) => {
        xssFunctionResults.total++;
        
        const sanitized = sanitizeText(vector);
        const safe = !sanitized.toLowerCase().includes('script') && 
                    !sanitized.toLowerCase().includes('javascript:') &&
                    !/on\\w+\\s*=/i.test(sanitized);
        
        if (safe) {
            console.log(`✅ XSS Function ${index + 1}: "${vector}" → "${sanitized}"`);
            xssFunctionResults.passed++;
        } else {
            console.log(`❌ XSS Function ${index + 1}: "${vector}" → "${sanitized}"`);
        }
    });
    
    console.log(`\\nXSS Function Results: ${xssFunctionResults.passed}/${xssFunctionResults.total} passed (${(xssFunctionResults.passed/xssFunctionResults.total*100).toFixed(1)}%)`);
    
} catch (error) {
    console.log(`❌ XSS Protection Functions Error: ${error.message}`);
}

console.log('\\n=== SUMMARY ===');
console.log(`SignUp Schema: ${signupResults.passed}/${signupResults.total} (${(signupResults.passed/signupResults.total*100).toFixed(1)}%)`);
console.log(`Campaign Schema: ${campaignResults.passed}/${campaignResults.total} (${(campaignResults.passed/campaignResults.total*100).toFixed(1)}%)`);

const overallPassed = signupResults.passed + campaignResults.passed;
const overallTotal = signupResults.total + campaignResults.total;
const overallRate = (overallPassed / overallTotal * 100).toFixed(1);

console.log(`Overall Schema Protection: ${overallPassed}/${overallTotal} (${overallRate}%)`);

if (overallRate >= 95) {
    console.log('🎉 EXCELLENT: Enhanced validation schemas provide strong XSS protection');
} else if (overallRate >= 85) {
    console.log('✅ GOOD: Enhanced validation schemas provide adequate XSS protection');
} else if (overallRate >= 70) {
    console.log('⚠️ FAIR: Enhanced validation schemas provide basic XSS protection');
} else {
    console.log('❌ POOR: Enhanced validation schemas need improvement');
}
"""
    
    # Write the test script to a temporary file
    with open('/app/test_validation_schemas_fixed.js', 'w') as f:
        f.write(test_script)
    
    try:
        # Run the Node.js test script
        result = subprocess.run(
            ['node', 'test_validation_schemas_fixed.js'],
            cwd='/app',
            capture_output=True,
            text=True,
            timeout=30
        )
        
        print("STDOUT:")
        print(result.stdout)
        
        if result.stderr:
            print("\nSTDERR:")
            print(result.stderr)
        
        print(f"\nReturn Code: {result.returncode}")
        
        # Clean up
        if os.path.exists('/app/test_validation_schemas_fixed.js'):
            os.remove('/app/test_validation_schemas_fixed.js')
        
        return result.returncode == 0
        
    except subprocess.TimeoutExpired:
        print("❌ Test timed out after 30 seconds")
        return False
    except Exception as e:
        print(f"❌ Error running validation schema tests: {e}")
        return False

if __name__ == "__main__":
    success = test_validation_schemas()
    exit(0 if success else 1)