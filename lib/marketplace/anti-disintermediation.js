// lib/marketplace/anti-disintermediation.js
// Advanced anti-disintermediation system for marketplace protection

import { supabase } from '../supabase.js'

// Comprehensive patterns for detecting contact information
const CONTACT_PATTERNS = {
  // Email patterns - various formats and obfuscation attempts
  email: [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
    /\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*[A-Z|a-z]{2,}\b/gi,
    /\b[A-Za-z0-9._%+-]+\s*\[\s*at\s*\]\s*[A-Za-z0-9.-]+\s*\[\s*dot\s*\]\s*[A-Z|a-z]{2,}\b/gi,
    /\b[A-Za-z0-9._%+-]+\s*\(\s*at\s*\)\s*[A-Za-z0-9.-]+\s*\(\s*dot\s*\)\s*[A-Z|a-z]{2,}\b/gi,
    /\bemail\s*[:=]\s*[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
    /\bcontact\s*[:=]\s*[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  ],
  
  // Phone patterns - international and US formats
  phone: [
    /\b\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/gi,
    /\b\+?[1-9][0-9]{0,3}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}\b/gi,
    /\bphone\s*[:=]\s*[+]?[0-9\s\-\(\)\.]{10,}/gi,
    /\bcall\s*[:=]\s*[+]?[0-9\s\-\(\)\.]{10,}/gi,
    /\bmobile\s*[:=]\s*[+]?[0-9\s\-\(\)\.]{10,}/gi,
    /\bwhatsapp\s*[:=]\s*[+]?[0-9\s\-\(\)\.]{10,}/gi,
  ],
  
  // Social media handles and platforms
  social: [
    /@[A-Za-z0-9_]+\b/gi,
    /\binstagram\.com\/[A-Za-z0-9_.]+/gi,
    /\btiktok\.com\/@[A-Za-z0-9_.]+/gi,
    /\byoutube\.com\/(@|c\/|channel\/|user\/)[A-Za-z0-9_-]+/gi,
    /\btwitter\.com\/[A-Za-z0-9_]+/gi,
    /\blinkedin\.com\/in\/[A-Za-z0-9_-]+/gi,
    /\bfacebook\.com\/[A-Za-z0-9_.]+/gi,
    /\bmy\s*(ig|instagram|tiktok|youtube|twitter)\s*(is|handle|account)\s*[:=]?\s*@?[A-Za-z0-9_.]+/gi,
    /\bfollow\s*me\s*(on|at)\s*@[A-Za-z0-9_.]+/gi,
    /\bdm\s*me\s*(on|at)\s*@[A-Za-z0-9_.]+/gi,
  ],
  
  // Website URLs
  website: [
    /\bhttps?:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}[\/\w\-._~:?#[\]@!$&'()*+,;=%]*/gi,
    /\bwww\.[A-Za-z0-9.-]+\.[A-Za-z]{2,}[\/\w\-._~:?#[\]@!$&'()*+,;=%]*/gi,
    /\b[A-Za-z0-9.-]+\.(com|org|net|edu|gov|io|co|uk|au|ca)\b/gi,
    /\bwebsite\s*[:=]\s*[A-Za-z0-9.-]+\.[A-Za-z]{2,}/gi,
    /\blink\s*[:=]\s*[A-Za-z0-9.-]+\.[A-Za-z]{2,}/gi,
  ],
  
  // Messaging platforms
  messaging: [
    /\bskype\s*[:=]\s*[A-Za-z0-9_.@-]+/gi,
    /\btelegram\s*[:=]\s*@?[A-Za-z0-9_]+/gi,
    /\bdiscord\s*[:=]\s*[A-Za-z0-9_#]+/gi,
    /\bslack\s*[:=]\s*[A-Za-z0-9_.@-]+/gi,
    /\bzoom\s*[:=]\s*[A-Za-z0-9_.@-]+/gi,
    /\bmeet\s*[:=]\s*[A-Za-z0-9_.@-]+/gi,
  ],
  
  // Common bypass attempts
  bypass: [
    /\blet's\s*(take\s*this|move\s*this|continue\s*this)\s*(off|outside)\s*(platform|here)/gi,
    /\bcontact\s*me\s*(direct|directly|outside|off\s*platform)/gi,
    /\beach\s*out\s*(direct|directly|outside|off\s*platform)/gi,
    /\bsend\s*me\s*(your|ur)\s*(email|phone|contact|details)/gi,
    /\bshare\s*(your|ur)\s*(email|phone|contact|details)/gi,
    /\bgive\s*me\s*(your|ur)\s*(email|phone|contact|details)/gi,
    /\bmy\s*(email|phone|contact)\s*(is|:)/gi,
    /\breply\s*(directly|direct|outside|off\s*platform)/gi,
  ]
}

// Risk levels for different types of violations
const RISK_LEVELS = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
}

// Scoring system for violations
const VIOLATION_SCORES = {
  email: RISK_LEVELS.HIGH,
  phone: RISK_LEVELS.HIGH,
  social: RISK_LEVELS.MEDIUM,
  website: RISK_LEVELS.MEDIUM,
  messaging: RISK_LEVELS.HIGH,
  bypass: RISK_LEVELS.CRITICAL
}

/**
 * Analyze text content for contact information and bypass attempts
 * @param {string} content - The text content to analyze
 * @returns {Object} Analysis results with detected violations
 */
export function analyzeContent(content) {
  if (!content || typeof content !== 'string') {
    return {
      isClean: true,
      riskScore: 0,
      violations: [],
      redactedContent: content
    }
  }

  const violations = []
  let riskScore = 0
  let redactedContent = content

  // Check each pattern category
  for (const [category, patterns] of Object.entries(CONTACT_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = content.match(pattern)
      if (matches) {
        violations.push({
          category,
          pattern: pattern.toString(),
          matches: matches.map(match => ({
            text: match,
            index: content.indexOf(match)
          })),
          riskLevel: VIOLATION_SCORES[category] || RISK_LEVELS.LOW
        })
        
        riskScore += (VIOLATION_SCORES[category] || RISK_LEVELS.LOW) * matches.length
        
        // Redact the matches
        redactedContent = redactedContent.replace(pattern, (match) => {
          return '[REDACTED]'
        })
      }
    }
  }

  return {
    isClean: violations.length === 0,
    riskScore,
    violations,
    redactedContent,
    requiresModeration: riskScore >= RISK_LEVELS.MEDIUM,
    shouldBlock: riskScore >= RISK_LEVELS.CRITICAL
  }
}

/**
 * Sanitize message content and store original if violations found
 * @param {string} content - Original message content
 * @param {string} senderId - ID of the message sender
 * @param {string} conversationId - ID of the conversation
 * @returns {Object} Sanitization results
 */
export function sanitizeMessage(content, senderId, conversationId) {
  const analysis = analyzeContent(content)
  
  const result = {
    originalContent: content,
    sanitizedContent: analysis.redactedContent,
    isRedacted: !analysis.isClean,
    riskScore: analysis.riskScore,
    violations: analysis.violations,
    shouldBlock: analysis.shouldBlock,
    requiresReview: analysis.requiresModeration
  }
  
  // Log violation for admin review if needed
  if (analysis.violations.length > 0) {
    logViolation(senderId, conversationId, analysis)
  }
  
  return result
}

/**
 * Log violation for admin review
 * @param {string} senderId - ID of the sender
 * @param {string} conversationId - ID of the conversation
 * @param {Object} analysis - Analysis results
 */
async function logViolation(senderId, conversationId, analysis) {
  try {
    // Store violation log in database for admin review
    const { error } = await supabase
      .from('violation_logs')
      .insert({
        sender_id: senderId,
        conversation_id: conversationId,
        risk_score: analysis.riskScore,
        violations: analysis.violations,
        content_snippet: analysis.redactedContent.substring(0, 200),
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('❌ Error logging violation:', error)
    }
    
    // Send alert if high risk
    if (analysis.riskScore >= RISK_LEVELS.HIGH) {
      console.log('🚨 High-risk violation detected:', {
        senderId,
        conversationId,
        riskScore: analysis.riskScore,
        violationCount: analysis.violations.length
      })
    }
    
  } catch (error) {
    console.error('❌ Error in violation logging:', error)
  }
}

/**
 * Mask contact information in profile data
 * @param {Object} profile - User profile data
 * @param {string} viewerId - ID of the viewer (to determine what to show)
 * @returns {Object} Profile with masked contact information
 */
export function maskProfileContacts(profile, viewerId = null) {
  if (!profile) return profile

  const maskedProfile = { ...profile }
  
  // Always mask email for non-self views
  if (profile.id !== viewerId && profile.email) {
    const emailParts = profile.email.split('@')
    if (emailParts.length === 2) {
      const username = emailParts[0]
      const domain = emailParts[1]
      maskedProfile.email = `${username.substring(0, 2)}***@${domain}`
    }
  }
  
  // Mask social media URLs if they contain direct contact info
  const socialFields = ['instagram_url', 'tiktok_url', 'youtube_url', 'twitter_url', 'linkedin_url']
  socialFields.forEach(field => {
    if (maskedProfile[field]) {
      const analysis = analyzeContent(maskedProfile[field])
      if (!analysis.isClean) {
        maskedProfile[field] = '[Contact info hidden - Connect through platform]'
      }
    }
  })
  
  // Clean bio and description of contact info
  if (maskedProfile.bio) {
    const analysis = analyzeContent(maskedProfile.bio)
    if (!analysis.isClean) {
      maskedProfile.bio = analysis.redactedContent
    }
  }
  
  if (maskedProfile.description) {
    const analysis = analyzeContent(maskedProfile.description)
    if (!analysis.isClean) {
      maskedProfile.description = analysis.redactedContent
    }
  }
  
  return maskedProfile
}

/**
 * Check if file sharing should be gated
 * @param {string} fileName - Name of the file
 * @param {string} fileType - MIME type of the file
 * @param {Object} context - Context about the sharing (offer status, etc.)
 * @returns {Object} Gating decision
 */
export function shouldGateFileSharing(fileName, fileType, context = {}) {
  const suspiciousExtensions = ['.txt', '.doc', '.docx', '.pdf', '.rtf']
  const suspiciousKeywords = ['contact', 'email', 'phone', 'social', 'external', 'direct']
  
  let riskScore = 0
  const risks = []
  
  // Check file extension
  const extension = fileName.split('.').pop()?.toLowerCase()
  if (suspiciousExtensions.includes(`.${extension}`)) {
    riskScore += RISK_LEVELS.LOW
    risks.push('Suspicious file type for potential contact sharing')
  }
  
  // Check filename for suspicious keywords
  const lowerFileName = fileName.toLowerCase()
  suspiciousKeywords.forEach(keyword => {
    if (lowerFileName.includes(keyword)) {
      riskScore += RISK_LEVELS.LOW
      risks.push(`Filename contains suspicious keyword: ${keyword}`)
    }
  })
  
  // Check context - only allow file sharing after payment
  if (context.offerStatus !== 'paid_escrow' && context.offerStatus !== 'in_progress') {
    riskScore += RISK_LEVELS.MEDIUM
    risks.push('File sharing not allowed before payment')
  }
  
  return {
    shouldGate: riskScore >= RISK_LEVELS.MEDIUM,
    riskScore,
    risks,
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    requiresApproval: riskScore >= RISK_LEVELS.HIGH
  }
}

/**
 * Generate masked contact card for platform communication
 * @param {Object} user - User data
 * @returns {Object} Masked contact information
 */
export function generateMaskedContact(user) {
  return {
    id: user.id,
    name: user.full_name || 'Platform User',
    avatar: user.avatar_url,
    platformHandle: `@${user.id.substring(0, 8)}`,
    communicationNotice: 'All communication must go through the platform messaging system.',
    directContactBlocked: true,
    lastSeen: user.last_seen_at
  }
}

/**
 * Validate external link sharing
 * @param {string} url - URL to validate
 * @param {Object} context - Context about the sharing
 * @returns {Object} Validation results
 */
export function validateExternalLink(url, context = {}) {
  if (!url) return { isValid: false, reason: 'No URL provided' }
  
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    
    // Allowed domains for legitimate business purposes
    const allowedDomains = [
      'google.com', 'drive.google.com', 'docs.google.com',
      'dropbox.com', 'onedrive.live.com',
      'figma.com', 'canva.com', 'adobe.com'
    ]
    
    // Blocked domains that could facilitate bypass
    const blockedDomains = [
      'whatsapp.com', 'telegram.org', 'discord.com',
      'zoom.us', 'meet.google.com', 'skype.com'
    ]
    
    if (blockedDomains.some(domain => hostname.includes(domain))) {
      return {
        isValid: false,
        reason: 'External communication platforms are not allowed',
        riskLevel: RISK_LEVELS.CRITICAL
      }
    }
    
    if (allowedDomains.some(domain => hostname.includes(domain))) {
      return {
        isValid: true,
        reason: 'Approved business domain',
        riskLevel: RISK_LEVELS.LOW
      }
    }
    
    // Default to moderate risk for unknown domains
    return {
      isValid: context.offerStatus === 'paid_escrow' || context.offerStatus === 'in_progress',
      reason: 'External links allowed only after payment',
      riskLevel: RISK_LEVELS.MEDIUM,
      requiresReview: true
    }
    
  } catch (error) {
    return {
      isValid: false,
      reason: 'Invalid URL format',
      riskLevel: RISK_LEVELS.LOW
    }
  }
}

// Export all anti-disintermediation functions
export default {
  analyzeContent,
  sanitizeMessage,
  maskProfileContacts,
  shouldGateFileSharing,
  generateMaskedContact,
  validateExternalLink,
  RISK_LEVELS,
  VIOLATION_SCORES
}