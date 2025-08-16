'use client'

import { useEffect } from 'react'
import { runComprehensiveXSSTests } from '@/lib/xss-test-suite'
import { sanitizeInput, sanitizeFieldValue, testXSSProtection } from '@/lib/xss-protection'
import { runXSSProtectionTest } from '@/lib/validation-enhanced'

export default function XSSTestingProvider({ children }) {
  useEffect(() => {
    // Make XSS testing functions available in browser console for debugging
    if (typeof window !== 'undefined') {
      window.runXSSTests = runComprehensiveXSSTests
      window.sanitizeInput = sanitizeInput
      window.sanitizeFieldValue = sanitizeFieldValue
      window.testXSSProtection = testXSSProtection
      window.runXSSProtectionTest = runXSSProtectionTest
      
      // Log available testing functions
      console.log(`
🔒 XSS Testing Functions Available:
- window.runXSSTests() - Run comprehensive XSS protection tests
- window.sanitizeFieldValue(fieldName, value) - Test field sanitization
- window.testXSSProtection(input) - Test XSS protection on input
- window.runXSSProtectionTest() - Run validation schema tests

Example: window.runXSSTests()
      `)
    }
  }, [])

  return children
}