/**
 * Utility functions for generating and managing short codes
 */

/**
 * Generate a random short code (6-8 characters)
 * Uses base62 encoding (0-9, a-z, A-Z)
 */
export function generateShortCode(length: number = 6): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  
  // Node.js: use crypto.randomBytes
  const crypto = require('crypto');
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  
  return code;
}

/**
 * Validate short code format
 */
export function isValidShortCode(code: string): boolean {
  return /^[0-9a-zA-Z]{4,10}$/.test(code);
}
