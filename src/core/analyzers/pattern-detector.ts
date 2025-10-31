/**
 * Pattern Detector
 * Analyzes variable names to detect common naming patterns, separators,
 * case styles, depth/hierarchy levels, and semantic vs literal naming.
 *
 * This helps normalize variable names into consistent token structures.
 */

/**
 * Detected naming pattern with confidence score
 */
export interface DetectedPattern {
  /** Separator character used in naming (e.g., '/', '-', '_', '.') */
  separator: string;
  /** Case style used (kebab-case, camelCase, snake_case, PascalCase) */
  case: 'kebab' | 'camel' | 'snake' | 'pascal' | 'none';
  /** Average depth/hierarchy level (e.g., "primary/blue/500" = 3) */
  depth: number;
  /** Naming type: semantic (primary, secondary) vs literal (blue-500) */
  type: 'semantic' | 'literal' | 'mixed';
  /** Confidence score (0-1) based on frequency and consistency */
  confidence: number;
  /** Number of samples that match this pattern */
  sampleCount: number;
  /** Example variable names that match this pattern */
  examples: string[];
}

/**
 * Pattern detection result with sorted patterns
 */
export interface PatternDetectionResult {
  /** Detected patterns sorted by confidence (highest first) */
  patterns: DetectedPattern[];
  /** Total number of variables analyzed */
  totalVariables: number;
  /** Most confident pattern (if any) */
  recommendedPattern: DetectedPattern | undefined;
}

/**
 * Pattern statistics for analysis
 */
interface PatternStats {
  separator: string;
  caseStyle: 'kebab' | 'camel' | 'snake' | 'pascal' | 'none';
  depths: number[];
  semanticCount: number;
  literalCount: number;
  examples: string[];
  count: number;
}

/**
 * Detects naming patterns in a list of variable names
 *
 * @param variableNames - Array of variable names to analyze
 * @returns Pattern detection result with sorted patterns
 *
 * @example
 * ```typescript
 * const names = ['primary/blue/500', 'primary/blue/600', 'secondary/red/400'];
 * const result = detectPatterns(names);
 * console.log(result.recommendedPattern);
 * // { separator: '/', case: 'kebab', depth: 3, type: 'mixed', confidence: 1.0, ... }
 * ```
 */
export function detectPatterns(variableNames: string[]): PatternDetectionResult {
  if (variableNames.length === 0) {
    return {
      patterns: [],
      totalVariables: 0,
      recommendedPattern: undefined,
    };
  }

  // Collect statistics for each pattern variant
  const statsMap = new Map<string, PatternStats>();

  for (const name of variableNames) {
    const separator = detectSeparator(name);
    const caseStyle = detectCaseStyle(name, separator);
    const depth = calculateDepth(name, separator);
    const nameType = detectNameType(name, separator);

    // Create a unique key for this pattern combination
    const key = `${separator}|${caseStyle}`;

    if (!statsMap.has(key)) {
      statsMap.set(key, {
        separator,
        caseStyle,
        depths: [],
        semanticCount: 0,
        literalCount: 0,
        examples: [],
        count: 0,
      });
    }

    const stats = statsMap.get(key)!;
    stats.count++;
    stats.depths.push(depth);

    if (nameType === 'semantic') {
      stats.semanticCount++;
    } else if (nameType === 'literal') {
      stats.literalCount++;
    }

    // Keep up to 3 examples
    if (stats.examples.length < 3) {
      stats.examples.push(name);
    }
  }

  // Convert statistics to detected patterns
  const patterns: DetectedPattern[] = [];

  for (const stats of statsMap.values()) {
    const avgDepth = Math.round(stats.depths.reduce((sum, d) => sum + d, 0) / stats.depths.length);
    const confidence = stats.count / variableNames.length;

    // Determine type based on semantic vs literal counts
    let type: 'semantic' | 'literal' | 'mixed' = 'mixed';
    if (stats.semanticCount > stats.literalCount * 2) {
      type = 'semantic';
    } else if (stats.literalCount > stats.semanticCount * 2) {
      type = 'literal';
    }

    patterns.push({
      separator: stats.separator,
      case: stats.caseStyle,
      depth: avgDepth,
      type,
      confidence,
      sampleCount: stats.count,
      examples: stats.examples,
    });
  }

  // Sort by confidence (highest first)
  patterns.sort((a, b) => b.confidence - a.confidence);

  return {
    patterns,
    totalVariables: variableNames.length,
    recommendedPattern: patterns.length > 0 ? patterns[0] : undefined,
  };
}

/**
 * Detects the separator character used in a variable name
 *
 * @param name - Variable name to analyze
 * @returns Detected separator character ('/', '-', '_', '.', 'none')
 */
export function detectSeparator(name: string): string {
  // Check for common separators in order of precedence
  const separators = ['/', '-', '_', '.'];

  for (const sep of separators) {
    if (name.includes(sep)) {
      return sep;
    }
  }

  // No separator found (might be camelCase or PascalCase)
  return 'none';
}

/**
 * Detects the case style used in a variable name
 *
 * @param name - Variable name to analyze
 * @param separator - The detected separator (or 'none')
 * @returns Case style ('kebab', 'camel', 'snake', 'pascal', 'none')
 */
export function detectCaseStyle(
  name: string,
  separator: string
): 'kebab' | 'camel' | 'snake' | 'pascal' | 'none' {
  // If there's a separator, check the segments
  if (separator !== 'none') {
    const segments = name.split(separator);
    const firstSegment = segments[0] || '';

    // Check first segment for case style
    if (firstSegment.length > 0) {
      const firstChar = firstSegment.charAt(0);
      if (firstChar === firstChar.toUpperCase() && /[A-Z]/.test(firstChar)) {
        return 'pascal';
      }
    }

    // Check if segments contain uppercase letters (not numbers)
    const hasUpperCase = segments.some(
      (seg) => seg.length > 0 && /[A-Z]/.test(seg) && !/^\d+$/.test(seg)
    );

    if (separator === '-' && !hasUpperCase) {
      return 'kebab';
    } else if (separator === '_' && !hasUpperCase) {
      return 'snake';
    }

    return 'none';
  }

  // No separator - check for camelCase or PascalCase
  if (name.length === 0) {
    return 'none';
  }

  const firstChar = name.charAt(0);
  const hasUpperCase = /[A-Z]/.test(name.slice(1));

  if (firstChar === firstChar.toUpperCase() && /[A-Z]/.test(firstChar) && hasUpperCase) {
    return 'pascal';
  } else if (firstChar === firstChar.toLowerCase() && hasUpperCase) {
    return 'camel';
  }

  return 'none';
}

/**
 * Calculates the depth/hierarchy level of a variable name
 *
 * @param name - Variable name to analyze
 * @param separator - The detected separator (or 'none')
 * @returns Depth level (1 for flat names, 2+ for hierarchical)
 *
 * @example
 * calculateDepth('primary/blue/500', '/') // returns 3
 * calculateDepth('primary-blue', '-') // returns 2
 * calculateDepth('primaryBlue', 'none') // returns 1
 */
export function calculateDepth(name: string, separator: string): number {
  if (separator === 'none') {
    // For camelCase/PascalCase, count capital letters + 1
    const capitals = (name.match(/[A-Z]/g) || []).length;
    return capitals > 0 ? capitals + 1 : 1;
  }

  // Count segments separated by the separator
  return name.split(separator).filter((seg) => seg.length > 0).length;
}

/**
 * Detects whether a variable name uses semantic or literal naming
 *
 * @param name - Variable name to analyze
 * @param separator - The detected separator (or 'none')
 * @returns Name type ('semantic', 'literal', or 'mixed')
 *
 * @example
 * detectNameType('primary/blue/500', '/') // returns 'mixed' (primary=semantic, blue/500=literal)
 * detectNameType('brand-primary', '-') // returns 'semantic'
 * detectNameType('blue-500', '-') // returns 'literal'
 */
export function detectNameType(name: string, separator: string): 'semantic' | 'literal' | 'mixed' {
  const segments =
    separator !== 'none' ? name.split(separator) : [name.replace(/[A-Z]/g, (m) => `-${m}`)];

  // Common semantic keywords
  const semanticKeywords = new Set([
    'primary',
    'secondary',
    'tertiary',
    'success',
    'warning',
    'error',
    'danger',
    'info',
    'brand',
    'accent',
    'neutral',
    'base',
    'surface',
    'background',
    'foreground',
    'border',
    'text',
    'heading',
    'body',
    'small',
    'large',
    'medium',
  ]);

  // Common literal patterns
  const literalPatterns = [
    /^(red|blue|green|yellow|purple|pink|orange|gray|grey|black|white|cyan|magenta|indigo|teal|lime|amber|rose|sky|violet|fuchsia|emerald|slate|zinc|neutral|stone)$/i,
    /^\d+$/, // Pure numbers like "500", "600"
    /^[a-z]+-\d+$/i, // Color scale like "blue-500"
  ];

  let semanticCount = 0;
  let literalCount = 0;

  for (const segment of segments) {
    const lowerSegment = segment.toLowerCase();

    // Check if semantic
    if (semanticKeywords.has(lowerSegment)) {
      semanticCount++;
      continue;
    }

    // Check if literal
    const isLiteral = literalPatterns.some((pattern) => pattern.test(segment));
    if (isLiteral) {
      literalCount++;
    }
  }

  // Determine type based on counts
  if (semanticCount > 0 && literalCount === 0) {
    return 'semantic';
  } else if (literalCount > 0 && semanticCount === 0) {
    return 'literal';
  } else if (semanticCount > 0 && literalCount > 0) {
    return 'mixed';
  }

  // Default to semantic if unclear
  return 'semantic';
}

/**
 * Normalizes a variable name based on a detected pattern
 *
 * @param name - Variable name to normalize
 * @param pattern - The pattern to apply for normalization
 * @returns Normalized variable name
 *
 * @example
 * normalizeVariableName('Primary/Blue/500', { separator: '/', case: 'kebab', ... })
 * // returns 'primary/blue/500'
 */
export function normalizeVariableName(name: string, pattern: DetectedPattern): string {
  const currentSeparator = detectSeparator(name);
  let normalized = name;

  // Convert separator if needed
  if (currentSeparator !== pattern.separator) {
    if (currentSeparator === 'none') {
      // Convert from camelCase/PascalCase to separator-based
      normalized = name.replace(/[A-Z]/g, (match, offset) =>
        offset > 0 ? `${pattern.separator}${match.toLowerCase()}` : match.toLowerCase()
      );
    } else if (pattern.separator === 'none') {
      // Convert from separator-based to camelCase
      const parts = name.split(currentSeparator);
      normalized =
        parts[0]?.toLowerCase() +
        parts
          .slice(1)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join('');
    } else {
      // Convert between different separators
      normalized = name.split(currentSeparator).join(pattern.separator);
    }
  }

  // Apply case style
  if (pattern.separator !== 'none') {
    const parts = normalized.split(pattern.separator);
    switch (pattern.case) {
      case 'kebab':
      case 'snake':
        normalized = parts.map((p) => p.toLowerCase()).join(pattern.separator);
        break;
      case 'pascal':
        normalized = parts
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
          .join(pattern.separator);
        break;
      case 'camel':
        // First part lowercase, rest capitalized
        normalized =
          parts[0]?.toLowerCase() +
          parts
            .slice(1)
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
            .join('');
        break;
    }
  }

  return normalized;
}
