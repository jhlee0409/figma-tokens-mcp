/**
 * Token Normalizer
 *
 * Standardizes token names and structures to a unified format.
 * Accepts tokens from Variables or Styles extractors and normalizes them
 * based on a target naming pattern.
 *
 * Features:
 * - Converts various naming conventions to target pattern
 * - Transforms flat names to hierarchical structures
 * - Preserves token values and metadata
 * - Supports custom transformation rules
 * - Validates normalized output
 */

import { DetectedPattern } from './pattern-detector';

// ============================================================================
// Types
// ============================================================================

/**
 * Generic token representation (from Variables or Styles)
 */
export interface GenericToken {
  /** Original token name */
  name: string;
  /** Token value (can be any type) */
  value: unknown;
  /** Token type (color, typography, spacing, etc.) */
  type: string;
  /** Source of the token (variable or style) */
  source: 'variable' | 'style';
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Normalized token with standardized structure
 */
export interface NormalizedToken {
  /** Original token name */
  originalName: string;
  /** Normalized name */
  normalizedName: string;
  /** Path segments (e.g., ['primary', 'blue', '500']) */
  path: string[];
  /** Token value */
  value: unknown;
  /** Token type */
  type: string;
  /** Source of the token */
  source: 'variable' | 'style';
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Hierarchical token structure (nested)
 */
export interface TokenHierarchy {
  /** Child tokens or nested structure */
  [key: string]: TokenNode;
}

/**
 * Token node in hierarchy (can be a leaf or branch)
 */
export interface TokenNode {
  /** Token value (leaf node) or undefined (branch node) */
  value?: unknown;
  /** Token type (leaf node) */
  type?: string;
  /** Source (leaf node) */
  source?: 'variable' | 'style';
  /** Metadata (leaf node) */
  metadata?: Record<string, unknown>;
  /** Original name (leaf node) */
  originalName?: string;
  /** Child nodes (branch node) */
  children?: TokenHierarchy;
}

/**
 * Normalization options
 */
export interface NormalizationOptions {
  /** Target naming pattern to normalize to */
  targetPattern: DetectedPattern;
  /** Whether to preserve metadata (default: true) */
  preserveMetadata?: boolean;
  /** Custom transformation rules (originalName -> newName) */
  customRules?: Record<string, string>;
  /** Whether to validate output (default: true) */
  validate?: boolean;
}

/**
 * Normalization result
 */
export interface NormalizationResult {
  /** Flat list of normalized tokens */
  tokens: NormalizedToken[];
  /** Hierarchical token structure */
  hierarchy: TokenHierarchy;
  /** Warnings encountered during normalization */
  warnings: string[];
  /** Applied pattern */
  pattern: DetectedPattern;
}

// ============================================================================
// Normalizer
// ============================================================================

/**
 * Normalizes tokens to a unified naming structure
 *
 * @param tokens - Input tokens from Variables or Styles extractor
 * @param options - Normalization options
 * @returns Normalized tokens and hierarchy
 *
 * @example
 * ```typescript
 * const tokens = [
 *   { name: 'Primary/Blue/500', value: '#0080ff', type: 'color', source: 'variable' },
 *   { name: 'primary-blue-600', value: '#0066cc', type: 'color', source: 'style' }
 * ];
 *
 * const result = normalizeTokens(tokens, {
 *   targetPattern: { separator: '/', case: 'kebab', depth: 3, type: 'mixed', confidence: 1.0, sampleCount: 2, examples: [] }
 * });
 *
 * console.log(result.tokens[0].normalizedName); // 'primary/blue/500'
 * console.log(result.tokens[1].normalizedName); // 'primary/blue/600'
 * ```
 */
export function normalizeTokens(
  tokens: GenericToken[],
  options: NormalizationOptions
): NormalizationResult {
  const opts = {
    preserveMetadata: options.preserveMetadata ?? true,
    validate: options.validate ?? true,
    customRules: options.customRules ?? {},
  };

  const warnings: string[] = [];
  const normalizedTokens: NormalizedToken[] = [];

  // Normalize each token
  for (const token of tokens) {
    try {
      // Apply custom rule if exists
      let name = token.name;
      if (opts.customRules[name]) {
        name = opts.customRules[name];
        warnings.push(`Applied custom rule: ${token.name} -> ${name}`);
      }

      // Normalize the name
      const normalizedName = normalizeTokenName(name, options.targetPattern);

      // Get path segments
      const path = getPathSegments(normalizedName, options.targetPattern);

      // Validate path if enabled
      if (opts.validate && !validatePath(path)) {
        warnings.push(`Invalid path for token: ${token.name} -> ${path.join('/')}`);
        continue;
      }

      normalizedTokens.push({
        originalName: token.name,
        normalizedName,
        path,
        value: token.value,
        type: token.type,
        source: token.source,
        ...(opts.preserveMetadata && token.metadata && { metadata: token.metadata }),
      });
    } catch (error) {
      warnings.push(`Failed to normalize token ${token.name}: ${(error as Error).message}`);
    }
  }

  // Build hierarchical structure
  const hierarchy = buildHierarchy(normalizedTokens);

  return {
    tokens: normalizedTokens,
    hierarchy,
    warnings,
    pattern: options.targetPattern,
  };
}

/**
 * Normalizes a single token name to match the target pattern
 *
 * @param name - Original token name
 * @param pattern - Target pattern
 * @returns Normalized name
 *
 * @example
 * ```typescript
 * normalizeTokenName('Primary/Blue/500', { separator: '-', case: 'kebab', ... })
 * // returns 'primary-blue-500'
 * ```
 */
export function normalizeTokenName(name: string, pattern: DetectedPattern): string {
  // Detect current separator
  const currentSeparator = detectCurrentSeparator(name);

  // Split by current separator
  let segments: string[] = [];

  if (currentSeparator === 'none') {
    // Handle camelCase/PascalCase
    segments = splitCamelCase(name);
  } else {
    segments = name.split(currentSeparator).filter(s => s.length > 0);
  }

  // Apply case transformation
  segments = segments.map(segment => applyCaseStyle(segment, pattern.case));

  // Join with target separator
  if (pattern.separator === 'none') {
    // Convert to camelCase/PascalCase
    return joinToCamelCase(segments, pattern.case);
  } else {
    return segments.join(pattern.separator);
  }
}

/**
 * Detects the separator used in a name
 */
function detectCurrentSeparator(name: string): string {
  const separators = ['/', '-', '_', '.'];

  for (const sep of separators) {
    if (name.includes(sep)) {
      return sep;
    }
  }

  return 'none';
}

/**
 * Splits a camelCase or PascalCase string into segments
 */
function splitCamelCase(name: string): string[] {
  // Insert space before capital letters and before numbers that follow letters
  const withSpaces = name
    .replace(/([A-Z])/g, ' $1')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .trim();
  return withSpaces.split(/\s+/).filter(s => s.length > 0);
}

/**
 * Applies case style to a segment
 */
function applyCaseStyle(segment: string, caseStyle: DetectedPattern['case']): string {
  switch (caseStyle) {
    case 'kebab':
    case 'snake':
      return segment.toLowerCase();
    case 'pascal':
      return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
    case 'camel':
      return segment.toLowerCase();
    case 'none':
      return segment;
    default:
      return segment.toLowerCase();
  }
}

/**
 * Joins segments into camelCase or PascalCase
 */
function joinToCamelCase(segments: string[], caseStyle: DetectedPattern['case']): string {
  if (segments.length === 0) return '';

  if (caseStyle === 'pascal') {
    return segments
      .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .join('');
  } else {
    // camelCase
    return segments[0].toLowerCase() +
      segments
        .slice(1)
        .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
        .join('');
  }
}

/**
 * Extracts path segments from a normalized name
 */
function getPathSegments(normalizedName: string, pattern: DetectedPattern): string[] {
  if (pattern.separator === 'none') {
    return splitCamelCase(normalizedName);
  }

  return normalizedName.split(pattern.separator).filter(s => s.length > 0);
}

/**
 * Validates a path (checks for empty segments, invalid characters, etc.)
 */
function validatePath(path: string[]): boolean {
  if (path.length === 0) return false;

  for (const segment of path) {
    // Check for empty segments
    if (segment.length === 0) return false;

    // Check for invalid characters (only allow alphanumeric, dash, underscore)
    if (!/^[a-zA-Z0-9_-]+$/.test(segment)) return false;
  }

  return true;
}

/**
 * Builds a hierarchical token structure from flat normalized tokens
 *
 * @param tokens - Normalized tokens
 * @returns Hierarchical structure
 *
 * @example
 * ```typescript
 * const tokens = [
 *   { path: ['primary', 'blue', '500'], value: '#0080ff', ... },
 *   { path: ['primary', 'blue', '600'], value: '#0066cc', ... }
 * ];
 *
 * const hierarchy = buildHierarchy(tokens);
 * // {
 * //   primary: {
 * //     children: {
 * //       blue: {
 * //         children: {
 * //           '500': { value: '#0080ff', ... },
 * //           '600': { value: '#0066cc', ... }
 * //         }
 * //       }
 * //     }
 * //   }
 * // }
 * ```
 */
export function buildHierarchy(tokens: NormalizedToken[]): TokenHierarchy {
  const root: TokenHierarchy = {};

  for (const token of tokens) {
    let current = root;

    // Navigate/create the hierarchy
    for (let i = 0; i < token.path.length - 1; i++) {
      const segment = token.path[i];

      if (!current[segment]) {
        current[segment] = { children: {} };
      }

      if (!current[segment].children) {
        current[segment].children = {};
      }

      current = current[segment].children!;
    }

    // Set the leaf value
    const leafKey = token.path[token.path.length - 1];
    current[leafKey] = {
      value: token.value,
      type: token.type,
      source: token.source,
      originalName: token.originalName,
      ...(token.metadata && { metadata: token.metadata }),
    };
  }

  return root;
}

/**
 * Flattens a hierarchical token structure back to a flat list
 *
 * @param hierarchy - Hierarchical token structure
 * @param separator - Separator to use when joining path segments (default: '/')
 * @returns Flat list of tokens
 */
export function flattenHierarchy(
  hierarchy: TokenHierarchy,
  separator = '/'
): NormalizedToken[] {
  const tokens: NormalizedToken[] = [];

  function traverse(node: TokenHierarchy, path: string[] = []): void {
    for (const [key, value] of Object.entries(node)) {
      const currentPath = [...path, key];

      if (value.value !== undefined) {
        // Leaf node
        tokens.push({
          originalName: value.originalName ?? currentPath.join(separator),
          normalizedName: currentPath.join(separator),
          path: currentPath,
          value: value.value,
          type: value.type ?? 'unknown',
          source: value.source ?? 'variable',
          ...(value.metadata && { metadata: value.metadata }),
        });
      } else if (value.children) {
        // Branch node - recurse
        traverse(value.children, currentPath);
      }
    }
  }

  traverse(hierarchy);
  return tokens;
}

/**
 * Transforms token name structure from one format to another
 *
 * This is a more advanced version that handles complex transformations:
 * - "primary/blue/500" → { primary: { blue: { 500: value } } }
 * - "primary-blue-500" → { primary: { blue: { 500: value } } }
 * - "PrimaryBlue500" → { primary: { blue: { 500: value } } }
 *
 * @param name - Original token name
 * @param targetPattern - Target pattern to transform to
 * @returns Transformed structure as array of path segments
 */
export function transformTokenStructure(
  name: string,
  targetPattern: DetectedPattern
): string[] {
  const normalizedName = normalizeTokenName(name, targetPattern);
  return getPathSegments(normalizedName, targetPattern);
}
