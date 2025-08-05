import { runXSSProtectionTest, testXSSProtection, XSS_TEST_VECTORS } from './validation-enhanced'
import { sanitizeInput, sanitizeText, sanitizeHTML, sanitizeFieldValue } from './xss-protection'

/**
 * Comprehensive XSS protection testing suite
 */
export const runComprehensiveXSSTests = () => {
  console.log('🔒 Running Comprehensive XSS Protection Tests...')
  
  // Test 1: Basic sanitization functions
  console.log('\n1. Testing Basic Sanitization Functions:')
  const basicTests = [
    '<script>alert("xss")</script>',
    '<img src="x" onerror="alert(1)">',
    'javascript:alert("xss")',
    '<iframe src="javascript:alert(1)"></iframe>',
    'normal text content',
    '<b>bold text</b>',
    '<p>paragraph text</p>'
  ]
  
  basicTests.forEach(test => {
    const result = sanitizeText(test)
    console.log(`Input: "${test}" → Output: "${result}"`)
  })
  
  // Test 2: Field-specific sanitization
  console.log('\n2. Testing Field-Specific Sanitization:')
  const fieldTests = [
    { field: 'title', value: '<script>alert("Campaign XSS")</script>Amazing Campaign' },
    { field: 'description', value: '<p>Great campaign</p><script>alert("desc")</script>' },
    { field: 'bio', value: '<strong>Creator</strong><script>steal_data()</script>' },
    { field: 'website_url', value: 'javascript:alert("url")' },
    { field: 'note', value: '<em>Interested!</em><img src=x onerror=alert(1)>' }
  ]
  
  fieldTests.forEach(test => {
    const result = sanitizeFieldValue(test.field, test.value)
    console.log(`Field "${test.field}": "${test.value}" → "${result}"`)
  })
  
  // Test 3: Enhanced validation schema tests
  console.log('\n3. Testing Enhanced Validation Schemas:')
  const schemaTestResult = runXSSProtectionTest()
  console.log(`Schema Tests: ${schemaTestResult.safeResults}/${schemaTestResult.totalTests} safe (${schemaTestResult.successRate.toFixed(1)}%)`)
  
  if (!schemaTestResult.allSafe) {
    console.log('⚠️  Some XSS vectors not fully blocked:')
    schemaTestResult.results
      .filter(r => !r.safe && !r.blocked)
      .forEach(r => console.log(`  - "${r.original}" → "${r.sanitized}"`))
  }
  
  // Test 4: Real-world attack scenarios
  console.log('\n4. Testing Real-World Attack Scenarios:')
  const realWorldTests = [
    // SQL injection attempts
    '\'; DROP TABLE users; --',
    'admin\' OR \'1\'=\'1',
    
    // XSS with encoding
    '&lt;script&gt;alert(1)&lt;/script&gt;',
    '%3Cscript%3Ealert(1)%3C/script%3E',
    
    // Event handler injection
    '" onmouseover="alert(1)"',
    '\' onclick=\'alert(1)\'',
    
    // CSS injection
    'expression(alert(1))',
    'background:url(javascript:alert(1))',
    
    // Protocol confusion
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox("xss")'
  ]
  
  realWorldTests.forEach(attack => {
    const result = sanitizeText(attack)
    const safe = !result.toLowerCase().includes('script') && 
                 !result.toLowerCase().includes('javascript:') &&
                 !/on\w+\s*=/i.test(result)
    console.log(`${safe ? '✅' : '❌'} "${attack}" → "${result}"`)
  })
  
  // Test 5: Performance test with large inputs
  console.log('\n5. Testing Performance with Large Inputs:')
  const largeInput = '<script>alert("xss")</script>'.repeat(1000)
  const startTime = performance.now()
  const sanitized = sanitizeText(largeInput)
  const endTime = performance.now()
  console.log(`Large input (${largeInput.length} chars) sanitized in ${(endTime - startTime).toFixed(2)}ms`)
  console.log(`Output length: ${sanitized.length} chars`)
  
  // Final summary
  console.log('\n📊 XSS Protection Test Summary:')
  const overallTests = basicTests.length + fieldTests.length + realWorldTests.length
  let passedTests = 0
  
  // Count successful sanitizations
  basicTests.forEach(test => {
    const result = sanitizeText(test)
    if (!result.toLowerCase().includes('script') && 
        !result.toLowerCase().includes('javascript:') &&
        !/on\w+\s*=/i.test(result)) {
      passedTests++
    }
  })
  
  realWorldTests.forEach(test => {
    const result = sanitizeText(test)
    if (!result.toLowerCase().includes('script') && 
        !result.toLowerCase().includes('javascript:') &&
        !/on\w+\s*=/i.test(result)) {
      passedTests++
    }
  })
  
  const successRate = (passedTests / (basicTests.length + realWorldTests.length)) * 100
  
  console.log(`✅ ${passedTests}/${basicTests.length + realWorldTests.length} basic tests passed (${successRate.toFixed(1)}%)`)
  console.log(`✅ ${schemaTestResult.safeResults}/${schemaTestResult.totalTests} schema tests passed (${schemaTestResult.successRate.toFixed(1)}%)`)
  console.log(`🔒 XSS Protection Status: ${successRate > 95 ? 'EXCELLENT' : successRate > 85 ? 'GOOD' : 'NEEDS IMPROVEMENT'}`)
  
  return {
    basicTestsPassRate: successRate,
    schemaTestsPassRate: schemaTestResult.successRate,
    overallSafe: successRate > 95 && schemaTestResult.successRate > 95,
    performanceMs: endTime - startTime
  }
}

// Export for use in tests
if (typeof window !== 'undefined') {
  window.runXSSTests = runComprehensiveXSSTests
}