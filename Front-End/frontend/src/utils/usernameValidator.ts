/**
 * Username Validation Utility for Frontend
 * 
 * Best practices for username validation:
 * - Length: 3-20 characters
 * - Alphanumeric with underscores and hyphens only
 * - Must start with a letter
 * - Cannot end with special characters
 * - No consecutive special characters
 * - Case insensitive (stored in lowercase)
 * - Reserved words and profanity filtering
 */

export interface UsernameValidationResult {
  valid: boolean;
  errors: string[];
}

export class UsernameValidator {
  // Reserved/system usernames that cannot be used
  private static readonly RESERVED_USERNAMES = [
    'admin', 'administrator', 'root', 'system', 'moderator', 'mod',
    'support', 'help', 'info', 'api', 'www', 'mail', 'ftp',
    'localhost', 'null', 'undefined', 'anonymous', 'guest', 'user',
    'test', 'demo', 'official', 'staff', 'bot', 'service'
  ];

  // Common profanity/offensive words (add more as needed)
  private static readonly BLOCKED_WORDS = [
    'fuck', 'shit', 'damn', 'bitch', 'ass', 'nigger', 'nigga',
    'cunt', 'dick', 'cock', 'pussy', 'whore', 'slut', 'fag',
    'bastard', 'piss', 'nazi', 'hitler', 'kill', 'die', 'hate'
  ];

  /**
   * Validate username against all rules
   */
  static validate(username: string): UsernameValidationResult {
    const errors: string[] = [];

    // Check if username exists
    if (!username || username.trim().length === 0) {
      errors.push('Username is required');
      return { valid: false, errors };
    }

    // Trim and normalize
    const normalized = username.trim();

    // Length validation
    if (normalized.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    if (normalized.length > 20) {
      errors.push('Username must not exceed 20 characters');
    }

    // Character validation - only alphanumeric, underscores, and hyphens
    const validCharactersRegex = /^[a-z0-9_-]+$/;
    if (!validCharactersRegex.test(normalized)) {
      errors.push('Username can only contain lower case letters, numbers, underscores, and hyphens');
    }

    // Must start with a letter
    const startsWithLetterRegex = /^[a-z]/;
    if (!startsWithLetterRegex.test(normalized)) {
      errors.push('Username must start with a letter');
    }

    // Cannot end with underscore or hyphen
    if (normalized.endsWith('_') || normalized.endsWith('-')) {
      errors.push('Username cannot end with a special character');
    }

    // No consecutive special characters
    const consecutiveSpecialCharsRegex = /[_-]{2,}/;
    if (consecutiveSpecialCharsRegex.test(normalized)) {
      errors.push('Username cannot contain consecutive special characters');
    }

    // Check for reserved usernames
    const lowerUsername = normalized.toLowerCase();
    if (this.RESERVED_USERNAMES.includes(lowerUsername)) {
      errors.push('This username is reserved and cannot be used');
    }

    // Check for blocked words
    for (const word of this.BLOCKED_WORDS) {
      if (lowerUsername.includes(word)) {
        errors.push('Username contains inappropriate content');
        break; // Only report once
      }
    }

    // No all numbers
    if (/^\d+$/.test(normalized)) {
      errors.push('Username cannot consist of only numbers');
    }

    // No all special characters
    if (/^[_-]+$/.test(normalized)) {
      errors.push('Username must contain at least one letter or number');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize username by removing invalid characters
   */
  static sanitize(username: string): string {
    return username
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '') // Remove invalid characters
      .replace(/^[^a-zA-Z]+/, '') // Remove non-letters from start
      .replace(/[_-]+$/, '') // Remove trailing special chars
      .replace(/[_-]{2,}/g, '_') // Replace consecutive special chars
      .substring(0, 20); // Limit length
  }

  /**
   * Normalize username to lowercase for storage
   */
  static normalize(username: string): string {
    return username.trim().toLowerCase();
  }

  /**
   * Get friendly error message from validation result
   */
  static getErrorMessage(result: UsernameValidationResult): string {
    if (result.valid) return '';
    return result.errors[0]; // Return first error
  }

  /**
   * Get all error messages as a formatted string
   */
  static getAllErrorMessages(result: UsernameValidationResult): string {
    if (result.valid) return '';
    return result.errors.join('. ');
  }
}
