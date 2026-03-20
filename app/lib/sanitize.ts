/**
 * Input sanitization utilities.
 */

/**
 * Sanitize a string input: trim whitespace, strip HTML tags, limit length.
 */
export function sanitizeInput(str: string, maxLen = 256): string {
  if (typeof str !== 'string') return ''
  return str
    .trim()
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[<>"'&]/g, '') // Remove special HTML characters
    .slice(0, maxLen)
}

/**
 * Validate that a string looks like a MetaApi token (alphanumeric + common chars).
 */
export function isValidToken(token: string): boolean {
  if (!token || token.length < 10 || token.length > 512) return false
  return /^[a-zA-Z0-9_\-.:]+$/.test(token)
}

/**
 * Validate that a string looks like a MetaApi account ID.
 */
export function isValidAccountId(accountId: string): boolean {
  if (!accountId || accountId.length < 5 || accountId.length > 128) return false
  return /^[a-zA-Z0-9_\-.]+$/.test(accountId)
}
