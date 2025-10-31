/**
 * Pattern Detector Utility
 * Detects naming patterns in strings and normalizes them to a consistent format
 */

export type NamingPattern =
  | 'kebab-case'
  | 'camelCase'
  | 'PascalCase'
  | 'snake_case'
  | 'SCREAMING_SNAKE_CASE'
  | 'slash/case'
  | 'dot.case'
  | 'mixed';

export interface PatternDetectionResult {
  pattern: NamingPattern;
  confidence: number; // 0-1
  samples: string[];
}

/**
 * Detect the naming pattern used in a collection of strings
 */
export function detectNamingPattern(names: string[]): PatternDetectionResult {
  if (names.length === 0) {
    return { pattern: 'kebab-case', confidence: 0, samples: [] };
  }

  const patterns: Record<NamingPattern, number> = {
    'kebab-case': 0,
    camelCase: 0,
    PascalCase: 0,
    snake_case: 0,
    SCREAMING_SNAKE_CASE: 0,
    'slash/case': 0,
    'dot.case': 0,
    mixed: 0,
  };

  for (const name of names) {
    const detected = detectSinglePattern(name);
    patterns[detected]++;
  }

  // Find the most common pattern
  let maxCount = 0;
  let dominantPattern: NamingPattern = 'kebab-case';

  for (const [pattern, count] of Object.entries(patterns)) {
    if (count > maxCount) {
      maxCount = count;
      dominantPattern = pattern as NamingPattern;
    }
  }

  const confidence = maxCount / names.length;
  const samples = names.filter((name) => detectSinglePattern(name) === dominantPattern).slice(0, 3);

  return { pattern: dominantPattern, confidence, samples };
}

/**
 * Detect the naming pattern of a single string
 */
function detectSinglePattern(name: string): NamingPattern {
  // Check for slash/case (e.g., "colors/primary/blue")
  if (name.includes('/')) {
    return 'slash/case';
  }

  // Check for dot.case (e.g., "colors.primary.blue")
  if (name.includes('.') && !name.includes(' ')) {
    return 'dot.case';
  }

  // Check for SCREAMING_SNAKE_CASE (e.g., "PRIMARY_BLUE")
  if (/^[A-Z0-9_]+$/.test(name)) {
    return 'SCREAMING_SNAKE_CASE';
  }

  // Check for snake_case (e.g., "primary_blue")
  if (/^[a-z0-9_]+$/.test(name)) {
    return 'snake_case';
  }

  // Check for kebab-case (e.g., "primary-blue")
  if (/^[a-z0-9-]+$/.test(name)) {
    return 'kebab-case';
  }

  // Check for PascalCase (e.g., "PrimaryBlue")
  if (/^[A-Z][a-zA-Z0-9]*$/.test(name) && /[a-z]/.test(name)) {
    return 'PascalCase';
  }

  // Check for camelCase (e.g., "primaryBlue")
  if (/^[a-z][a-zA-Z0-9]*$/.test(name) && /[A-Z]/.test(name)) {
    return 'camelCase';
  }

  // Default to mixed if no clear pattern
  return 'mixed';
}

/**
 * Normalize a name to kebab-case
 */
export function normalizeToKebabCase(name: string): string {
  // First, handle common separators
  let normalized = name
    // Replace slashes, dots, and underscores with spaces
    .replace(/[/._]/g, ' ')
    // Replace special characters with spaces (before other transformations)
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    // Insert space before uppercase letters in camelCase/PascalCase
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Insert space before numbers (letter to number)
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    // Insert space after numbers (number to letter)
    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
    // Multiple spaces to single space
    .replace(/\s+/g, ' ')
    // Trim
    .trim()
    // Convert to lowercase
    .toLowerCase()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');

  return normalized;
}

/**
 * Normalize a name to camelCase
 */
export function normalizeToCamelCase(name: string): string {
  const kebab = normalizeToKebabCase(name);
  const parts = kebab.split('-');

  if (parts.length === 0) return '';

  // First part stays lowercase, rest are capitalized
  return (
    parts[0] +
    parts
      .slice(1)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
  );
}

/**
 * Normalize a name to snake_case
 */
export function normalizeToSnakeCase(name: string): string {
  return normalizeToKebabCase(name).replace(/-/g, '_');
}

/**
 * Normalize a name to dot.case
 */
export function normalizeToDotCase(name: string): string {
  return normalizeToKebabCase(name).replace(/-/g, '.');
}

/**
 * Normalize a name based on the target pattern
 */
export function normalizeToPattern(name: string, pattern: NamingPattern): string {
  switch (pattern) {
    case 'kebab-case':
      return normalizeToKebabCase(name);
    case 'camelCase':
      return normalizeToCamelCase(name);
    case 'snake_case':
      return normalizeToSnakeCase(name);
    case 'dot.case':
      return normalizeToDotCase(name);
    case 'slash/case':
      return normalizeToKebabCase(name).replace(/-/g, '/');
    case 'PascalCase': {
      const camel = normalizeToCamelCase(name);
      return camel.charAt(0).toUpperCase() + camel.slice(1);
    }
    case 'SCREAMING_SNAKE_CASE':
      return normalizeToSnakeCase(name).toUpperCase();
    default:
      return normalizeToKebabCase(name);
  }
}
