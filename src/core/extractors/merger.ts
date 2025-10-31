/**
 * Token Merger
 *
 * Merges tokens from Variables and Styles extractors into a unified structure.
 * Handles normalization, conflict detection, and resolution.
 *
 * Features:
 * - Accepts tokens from Variables and Styles extractors
 * - Normalizes both token sets to common structure
 * - Detects conflicts between sources
 * - Applies conflict resolution strategy
 * - Merges tokens into single unified structure
 * - Preserves metadata from both sources
 * - Generates comprehensive warnings
 */

import { normalizeTokens, GenericToken, NormalizationResult } from '../analyzers/normalizer';
import {
  detectConflicts,
  resolveConflicts,
  ResolutionStrategyType,
  ConflictReport,
  ResolvedToken,
} from '../analyzers/conflict-resolver';
import { detectPatterns, DetectedPattern } from '../analyzers/pattern-detector';
import { VariablesExtractionResult, ExtractedVariable } from './variables-extractor';
import { ExtractedStyles, ColorToken, TypographyToken } from './styles-extractor';

// ============================================================================
// Types
// ============================================================================

/**
 * Merge mode options
 */
export type MergeMode =
  | 'variables_only' // Only use Variables
  | 'styles_only' // Only use Styles
  | 'merge'; // Combine both with conflict resolution

/**
 * Merger options
 */
export interface MergerOptions {
  /** Merge mode (default: 'merge') */
  mode?: MergeMode;
  /** Conflict resolution strategy (default: 'variables_priority') */
  resolutionStrategy?: ResolutionStrategyType;
  /** Target naming pattern (auto-detected if not provided) */
  targetPattern?: DetectedPattern;
  /** Whether to preserve metadata (default: true) */
  preserveMetadata?: boolean;
  /** Custom transformation rules */
  customRules?: Record<string, string>;
}

/**
 * Merged tokens result
 */
export interface MergedTokensResult {
  /** Resolved tokens (flat list) */
  tokens: ResolvedToken[];
  /** Hierarchical token structure */
  hierarchy: Record<string, unknown>;
  /** Detected conflicts */
  conflicts: ConflictReport[];
  /** Warnings and issues */
  warnings: string[];
  /** Applied naming pattern */
  pattern: DetectedPattern;
  /** Resolution strategy used */
  resolutionStrategy: ResolutionStrategyType;
  /** Merge statistics */
  statistics: {
    totalTokens: number;
    variableTokens: number;
    styleTokens: number;
    conflicts: number;
    resolved: number;
    unresolved: number;
  };
}

// ============================================================================
// Merger
// ============================================================================

/**
 * Merges tokens from Variables and Styles extractors
 *
 * @param variablesResult - Result from Variables extractor (optional)
 * @param stylesResult - Result from Styles extractor (optional)
 * @param options - Merger options
 * @returns Merged tokens result
 *
 * @example
 * ```typescript
 * const variables = await variablesExtractor.extract(fileKey);
 * const styles = await stylesExtractor.extractStyles(fileKey);
 *
 * const merged = mergeTokens(variables, styles, {
 *   mode: 'merge',
 *   resolutionStrategy: 'variables_priority'
 * });
 *
 * console.log(merged.tokens.length);
 * console.log(merged.conflicts.length);
 * ```
 */
export function mergeTokens(
  variablesResult?: VariablesExtractionResult,
  stylesResult?: ExtractedStyles,
  options: MergerOptions = {}
): MergedTokensResult {
  const opts = {
    mode: options.mode ?? 'merge',
    resolutionStrategy: options.resolutionStrategy ?? 'variables_priority',
    preserveMetadata: options.preserveMetadata ?? true,
    customRules: options.customRules ?? {},
  };

  const warnings: string[] = [];

  // Handle different merge modes
  if (opts.mode === 'variables_only') {
    if (!variablesResult) {
      throw new Error('Variables result is required for variables_only mode');
    }
    return mergeVariablesOnly(variablesResult, opts, warnings);
  }

  if (opts.mode === 'styles_only') {
    if (!stylesResult) {
      throw new Error('Styles result is required for styles_only mode');
    }
    return mergeStylesOnly(stylesResult, opts, warnings);
  }

  // Merge mode - combine both sources
  if (!variablesResult && !stylesResult) {
    throw new Error('At least one of variablesResult or stylesResult is required');
  }

  return mergeBothSources(variablesResult, stylesResult, opts, warnings);
}

/**
 * Merges only Variables tokens
 */
function mergeVariablesOnly(
  variablesResult: VariablesExtractionResult,
  options: Required<Omit<MergerOptions, 'targetPattern'>>,
  warnings: string[]
): MergedTokensResult {
  // Convert Variables to GenericTokens
  const genericTokens = convertVariablesToGeneric(variablesResult.variables);

  // Use the pattern from Variables result or detect it
  const pattern = variablesResult.pattern ?? detectPatterns(genericTokens.map(t => t.name)).recommendedPattern!;

  // Normalize tokens
  const normalized = normalizeTokens(genericTokens, {
    targetPattern: pattern,
    preserveMetadata: options.preserveMetadata,
    customRules: options.customRules,
  });

  warnings.push(...normalized.warnings);

  // No conflicts in single-source mode
  const resolvedTokens: ResolvedToken[] = normalized.tokens.map(t => ({
    ...t,
    wasConflicted: false,
  }));

  return {
    tokens: resolvedTokens,
    hierarchy: normalized.hierarchy,
    conflicts: [],
    warnings,
    pattern,
    resolutionStrategy: options.resolutionStrategy,
    statistics: {
      totalTokens: resolvedTokens.length,
      variableTokens: resolvedTokens.length,
      styleTokens: 0,
      conflicts: 0,
      resolved: 0,
      unresolved: 0,
    },
  };
}

/**
 * Merges only Styles tokens
 */
function mergeStylesOnly(
  stylesResult: ExtractedStyles,
  options: Required<Omit<MergerOptions, 'targetPattern'>>,
  warnings: string[]
): MergedTokensResult {
  // Convert Styles to GenericTokens
  const genericTokens = convertStylesToGeneric(stylesResult);

  // Detect pattern from style names
  const pattern = detectPatterns(genericTokens.map(t => t.name)).recommendedPattern!;

  // Normalize tokens
  const normalized = normalizeTokens(genericTokens, {
    targetPattern: pattern,
    preserveMetadata: options.preserveMetadata,
    customRules: options.customRules,
  });

  warnings.push(...normalized.warnings);

  // No conflicts in single-source mode
  const resolvedTokens: ResolvedToken[] = normalized.tokens.map(t => ({
    ...t,
    wasConflicted: false,
  }));

  return {
    tokens: resolvedTokens,
    hierarchy: normalized.hierarchy,
    conflicts: [],
    warnings,
    pattern,
    resolutionStrategy: options.resolutionStrategy,
    statistics: {
      totalTokens: resolvedTokens.length,
      variableTokens: 0,
      styleTokens: resolvedTokens.length,
      conflicts: 0,
      resolved: 0,
      unresolved: 0,
    },
  };
}

/**
 * Merges tokens from both Variables and Styles sources
 */
function mergeBothSources(
  variablesResult: VariablesExtractionResult | undefined,
  stylesResult: ExtractedStyles | undefined,
  options: Required<Omit<MergerOptions, 'targetPattern'>>,
  warnings: string[]
): MergedTokensResult {
  const genericTokens: GenericToken[] = [];
  let variableCount = 0;
  let styleCount = 0;

  // Convert Variables to GenericTokens
  if (variablesResult) {
    const variableTokens = convertVariablesToGeneric(variablesResult.variables);
    genericTokens.push(...variableTokens);
    variableCount = variableTokens.length;
  }

  // Convert Styles to GenericTokens
  if (stylesResult) {
    const styleTokens = convertStylesToGeneric(stylesResult);
    genericTokens.push(...styleTokens);
    styleCount = styleTokens.length;
  }

  if (genericTokens.length === 0) {
    warnings.push('No tokens found in either source');
    return {
      tokens: [],
      hierarchy: {},
      conflicts: [],
      warnings,
      pattern: {
        separator: '/',
        case: 'kebab',
        depth: 1,
        type: 'mixed',
        confidence: 0,
        sampleCount: 0,
        examples: [],
      },
      resolutionStrategy: options.resolutionStrategy,
      statistics: {
        totalTokens: 0,
        variableTokens: 0,
        styleTokens: 0,
        conflicts: 0,
        resolved: 0,
        unresolved: 0,
      },
    };
  }

  // Detect pattern from all token names
  const pattern =
    variablesResult?.pattern ??
    detectPatterns(genericTokens.map(t => t.name)).recommendedPattern!;

  // Normalize all tokens
  const normalized = normalizeTokens(genericTokens, {
    targetPattern: pattern,
    preserveMetadata: options.preserveMetadata,
    customRules: options.customRules,
  });

  warnings.push(...normalized.warnings);

  // Detect conflicts
  const conflictDetection = detectConflicts(normalized.tokens);
  warnings.push(`Detected ${conflictDetection.conflicts.length} conflicts`);

  // Resolve conflicts
  const resolution = resolveConflicts(
    normalized.tokens,
    conflictDetection.conflicts,
    options.resolutionStrategy
  );

  warnings.push(...resolution.warnings);

  // Build final hierarchy from resolved tokens
  const hierarchy = buildFinalHierarchy(resolution.tokens);

  return {
    tokens: resolution.tokens,
    hierarchy,
    conflicts: conflictDetection.conflicts,
    warnings,
    pattern,
    resolutionStrategy: options.resolutionStrategy,
    statistics: {
      totalTokens: resolution.tokens.length,
      variableTokens: variableCount,
      styleTokens: styleCount,
      conflicts: conflictDetection.conflicts.length,
      resolved: resolution.auditTrail.filter(a => a.result !== 'manual_required').length,
      unresolved: resolution.auditTrail.filter(a => a.result === 'manual_required').length,
    },
  };
}

// ============================================================================
// Conversion Helpers
// ============================================================================

/**
 * Converts Variables to GenericTokens
 */
function convertVariablesToGeneric(variables: ExtractedVariable[]): GenericToken[] {
  return variables.map(v => ({
    name: v.name,
    value: v.value,
    type: v.type.toLowerCase(),
    source: 'variable' as const,
    metadata: {
      variableId: v.id,
      collectionId: v.collectionId,
      collectionName: v.collectionName,
      modeId: v.modeId,
      modeName: v.modeName,
      description: v.description,
      scopes: v.scopes,
      isAlias: v.isAlias,
      ...(v.aliasId && { aliasId: v.aliasId }),
    },
  }));
}

/**
 * Converts Styles to GenericTokens
 */
function convertStylesToGeneric(styles: ExtractedStyles): GenericToken[] {
  const tokens: GenericToken[] = [];

  // Convert color styles
  for (const [name, colorToken] of Object.entries(styles.colors)) {
    tokens.push({
      name: colorToken.originalName ?? name,
      value: colorToken.value,
      type: 'color',
      source: 'style' as const,
      metadata: {
        description: colorToken.description,
        styleType: 'FILL',
      },
    });
  }

  // Convert typography styles
  for (const [name, typographyToken] of Object.entries(styles.typography)) {
    tokens.push({
      name: typographyToken.originalName ?? name,
      value: typographyToken.value,
      type: 'typography',
      source: 'style' as const,
      metadata: {
        description: typographyToken.description,
        styleType: 'TEXT',
      },
    });
  }

  return tokens;
}

/**
 * Builds final hierarchy from resolved tokens
 */
function buildFinalHierarchy(tokens: ResolvedToken[]): Record<string, unknown> {
  const root: Record<string, unknown> = {};

  for (const token of tokens) {
    let current: Record<string, unknown> = root;

    // Navigate/create the hierarchy
    for (let i = 0; i < token.path.length - 1; i++) {
      const segment = token.path[i];

      if (!current[segment]) {
        current[segment] = {};
      }

      current = current[segment] as Record<string, unknown>;
    }

    // Set the leaf value
    const leafKey = token.path[token.path.length - 1];
    current[leafKey] = {
      value: token.value,
      type: token.type,
      source: token.source,
      originalName: token.originalName,
      ...(token.wasConflicted && {
        wasConflicted: true,
        resolutionStrategy: token.resolutionStrategy,
      }),
      ...(token.metadata && { metadata: token.metadata }),
    };
  }

  return root;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick merge with default options (Variables priority)
 *
 * @param variablesResult - Variables extraction result
 * @param stylesResult - Styles extraction result
 * @returns Merged tokens
 */
export function quickMerge(
  variablesResult?: VariablesExtractionResult,
  stylesResult?: ExtractedStyles
): MergedTokensResult {
  return mergeTokens(variablesResult, stylesResult, {
    mode: 'merge',
    resolutionStrategy: 'variables_priority',
  });
}

/**
 * Merge with custom strategy
 *
 * @param variablesResult - Variables extraction result
 * @param stylesResult - Styles extraction result
 * @param strategy - Resolution strategy
 * @returns Merged tokens
 */
export function mergeWithStrategy(
  variablesResult: VariablesExtractionResult | undefined,
  stylesResult: ExtractedStyles | undefined,
  strategy: ResolutionStrategyType
): MergedTokensResult {
  return mergeTokens(variablesResult, stylesResult, {
    mode: 'merge',
    resolutionStrategy: strategy,
  });
}

/**
 * Extract statistics from merge result
 *
 * @param result - Merge result
 * @returns Human-readable statistics
 */
export function getMergeStatistics(result: MergedTokensResult): string {
  const { statistics, conflicts } = result;

  const lines = [
    `Total tokens: ${statistics.totalTokens}`,
    `  Variables: ${statistics.variableTokens}`,
    `  Styles: ${statistics.styleTokens}`,
    '',
    `Conflicts: ${statistics.conflicts}`,
    `  Resolved: ${statistics.resolved}`,
    `  Unresolved: ${statistics.unresolved}`,
  ];

  if (conflicts.length > 0) {
    lines.push('');
    lines.push('Conflict breakdown:');
    const byType = conflicts.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    for (const [type, count] of Object.entries(byType)) {
      lines.push(`  ${type}: ${count}`);
    }
  }

  return lines.join('\n');
}
