/**
 * Utility functions for validating token structures
 */

/**
 * Validates if an object has the basic structure of a token collection
 *
 * @param tokens - Object to validate
 * @returns True if valid token structure
 */
export function isValidTokenStructure(tokens: unknown): boolean {
  if (!tokens || typeof tokens !== 'object') {
    return false;
  }

  // Check if it's a non-null object
  if (Array.isArray(tokens)) {
    return false;
  }

  // Valid token structure should have at least some properties
  const obj = tokens as Record<string, unknown>;
  const keys = Object.keys(obj);

  if (keys.length === 0) {
    return false;
  }

  return true;
}

/**
 * Validates if a token collection has specific token types
 *
 * @param tokens - Token collection to validate
 * @param requiredTypes - Array of required token types (e.g., ['colors', 'typography'])
 * @returns True if all required types are present
 */
export function hasRequiredTokenTypes(
  tokens: Record<string, unknown>,
  requiredTypes: string[]
): boolean {
  if (!isValidTokenStructure(tokens)) {
    return false;
  }

  return requiredTypes.every((type) => type in tokens);
}

/**
 * Extracts available token types from a token collection
 *
 * @param tokens - Token collection
 * @returns Array of token type names
 */
export function getAvailableTokenTypes(tokens: Record<string, unknown>): string[] {
  if (!isValidTokenStructure(tokens)) {
    return [];
  }

  return Object.keys(tokens).filter((key) => {
    const value = tokens[key];
    return value && typeof value === 'object';
  });
}

/**
 * Validates if a value looks like a color token
 *
 * @param value - Value to check
 * @returns True if looks like a color value
 */
export function isColorValue(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  // Check for common color formats
  const colorPatterns = [
    /^#[0-9A-Fa-f]{3,8}$/, // Hex colors
    /^rgb\(/i, // RGB colors
    /^rgba\(/i, // RGBA colors
    /^hsl\(/i, // HSL colors
    /^hsla\(/i, // HSLA colors
  ];

  return colorPatterns.some((pattern) => pattern.test(value));
}

/**
 * Validates if an object looks like a typography token
 *
 * @param value - Value to check
 * @returns True if looks like a typography token
 */
export function isTypographyToken(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Should have at least one typography property
  const typographyProps = ['fontSize', 'fontFamily', 'fontWeight', 'lineHeight', 'letterSpacing'];
  return typographyProps.some((prop) => prop in obj);
}

/**
 * Counts the number of tokens in a collection recursively
 *
 * @param tokens - Token collection
 * @returns Number of leaf tokens
 */
export function countTokens(tokens: Record<string, unknown>): number {
  let count = 0;

  for (const value of Object.values(tokens)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively count nested tokens
      count += countTokens(value as Record<string, unknown>);
    } else {
      // Leaf token
      count++;
    }
  }

  return count;
}

/**
 * Sanitizes token data by removing sensitive information
 *
 * @param tokens - Token collection
 * @returns Sanitized token collection
 */
export function sanitizeTokens(tokens: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(tokens)) {
    // Remove any keys that might contain sensitive data
    if (key.toLowerCase().includes('secret') || key.toLowerCase().includes('token')) {
      continue;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeTokens(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
