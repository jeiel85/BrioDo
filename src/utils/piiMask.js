/**
 * PII (Personally Identifiable Information) Masking Utility
 * Masks sensitive personal information before sending to AI servers
 */

/**
 * Patterns for PII detection
 * Order matters - more specific patterns first
 */
const PII_PATTERNS = [
  // Korean phone: 010-1234-5678 or 01012345678
  { regex: /(\d{3})-(\d{3,4})-(\d{4})/g, mask: '***-****-****' },
  { regex: /(\d{3})(\d{3,4})(\d{4})/g, mask: '************' },

  // US/International phone: (123) 456-7890, +1 234 567 8900
  { regex: /\(\d{3}\)\s*\d{3}[-\s]\d{4}/g, mask: '(***) ***-****' },
  { regex: /\+\d{1,3}[\s-]?\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4}/g, mask: '+***-***-****-****' },

  // Korean resident registration number: 123456-1234567
  { regex: /\d{6}[-\s]\d{7}/g, mask: '*****-*******' },

  // Credit card: 1234-5678-9012-3456 or 1234567890123456
  { regex: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, mask: '****-****-****-****' },

  // Email: user@example.com
  { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, mask: '***@***.***' },

  // IP address: 192.168.1.1
  { regex: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, mask: '***.***.***.***' },

  // Korean bank account: 계좌번호 followed by digits
  { regex: /계좌[\s:]*(번호| No\.?)?[\s:]*[\d-]+/gi, mask: '계좌번호 ***' },
  { regex: /통장[\s:]*(번호| No\.?)?[\s:]*[\d-]+/gi, mask: '통장번호 ***' },

  // Korean business registration: 123-45-67890
  { regex: /\d{3}[-\s]\d{2}[-\s]\d{5}/g, mask: '***-**-*****' },

  // Passport numbers (general pattern)
  { regex: /여권[\s:]*번호[\s:]*[A-Z0-9]{8,}/gi, mask: '여권번호 ***' },
  { regex: /passport[\s:]*no\.?[\s:]*[A-Z0-9]{6,}/gi, mask: 'passport no. ***' },
]

/**
 * Mask PII in the given text
 * @param {string} text - Input text that may contain PII
 * @returns {string} - Text with PII masked
 */
export function maskPII(text) {
  if (!text || typeof text !== 'string') return text

  let maskedText = text

  for (const { regex, mask } of PII_PATTERNS) {
    maskedText = maskedText.replace(regex, mask)
  }

  return maskedText
}

/**
 * Check if text contains potential PII (for logging/debugging)
 * @param {string} text - Input text to check
 * @returns {boolean} - True if PII patterns are detected
 */
export function containsPII(text) {
  if (!text || typeof text !== 'string') return false

  for (const { regex } of PII_PATTERNS) {
    if (regex.test(text)) return true
  }
  return false
}

/**
 * Log warning if PII is detected (for security audit)
 * @param {string} text - Input text
 * @param {string} context - Context where PII was detected
 */
export function warnPII(text, context = 'AI prompt') {
  if (containsPII(text)) {
    console.warn(`[Security] Potential PII detected in ${context}. Text will be masked before sending to AI.`)
  }
}
