/**
 * Conflict Resolver
 *
 * Detects and resolves conflicts between tokens from different sources
 * (Variables vs Styles). Provides multiple resolution strategies and
 * detailed conflict reporting.
 *
 * Features:
 * - Detects naming conflicts (same name, different values)
 * - Detects duplicate definitions within same source
 * - Categorizes conflict types and severity
 * - Implements multiple resolution strategies
 * - Maintains audit trail of resolution decisions
 */

import { NormalizedToken } from './normalizer';

// ============================================================================
// Types
// ============================================================================

/**
 * Types of conflicts that can occur
 */
export type ConflictType =
  | 'duplicate_name' // Same normalized name, different values
  | 'near_duplicate' // Similar names (typos/variations)
  | 'type_mismatch'; // Same name, different token types

/**
 * Severity levels for conflicts
 */
export type ConflictSeverity = 'low' | 'medium' | 'high';

/**
 * Token source information for conflict reporting
 */
export interface ConflictSource {
  /** Source type (variable or style) */
  type: 'variable' | 'style';
  /** Token value */
  value: unknown;
  /** Token type */
  tokenType: string;
  /** Original token name */
  originalName: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Conflict report for a single conflict
 */
export interface ConflictReport {
  /** Type of conflict */
  type: ConflictType;
  /** Normalized token name */
  name: string;
  /** Sources involved in the conflict */
  sources: ConflictSource[];
  /** Severity of the conflict */
  severity: ConflictSeverity;
  /** Recommendation for resolution */
  recommendation: string;
}

/**
 * Resolution strategy types
 */
export type ResolutionStrategyType =
  | 'variables_priority' // Prefer Variables over Styles (Figma recommended)
  | 'styles_priority' // Prefer Styles over Variables (legacy support)
  | 'newest' // Use most recently modified (requires timestamp)
  | 'rename_both' // Keep both with suffixes (-var, -style)
  | 'manual'; // Present conflicts to user for decision

/**
 * Resolved token after conflict resolution
 */
export interface ResolvedToken extends NormalizedToken {
  /** Whether this token was involved in a conflict */
  wasConflicted: boolean;
  /** Original name before conflict resolution (if renamed) */
  preResolutionName?: string;
  /** Resolution strategy applied */
  resolutionStrategy?: ResolutionStrategyType;
  /** Conflict details if applicable */
  conflictDetails?: ConflictReport;
}

/**
 * Resolution strategy interface
 */
export interface ResolutionStrategy {
  /** Strategy type */
  strategy: ResolutionStrategyType;
  /** Apply the strategy to resolve a conflict */
  apply: (conflict: ConflictReport) => ResolvedToken | ResolvedToken[];
}

/**
 * Conflict detection result
 */
export interface ConflictDetectionResult {
  /** List of detected conflicts */
  conflicts: ConflictReport[];
  /** Total number of tokens analyzed */
  totalTokens: number;
  /** Number of unique token names */
  uniqueNames: number;
  /** Conflict statistics */
  statistics: {
    duplicateNames: number;
    nearDuplicates: number;
    typeMismatches: number;
    lowSeverity: number;
    mediumSeverity: number;
    highSeverity: number;
  };
}

/**
 * Conflict resolution result
 */
export interface ConflictResolutionResult {
  /** Resolved tokens */
  tokens: ResolvedToken[];
  /** Original conflicts detected */
  conflicts: ConflictReport[];
  /** Warnings generated during resolution */
  warnings: string[];
  /** Strategy used for resolution */
  strategy: ResolutionStrategyType;
  /** Audit trail of resolution decisions */
  auditTrail: ResolutionAudit[];
}

/**
 * Audit entry for resolution decisions
 */
export interface ResolutionAudit {
  /** Conflict that was resolved */
  conflict: ConflictReport;
  /** Strategy applied */
  strategy: ResolutionStrategyType;
  /** Action taken */
  action: string;
  /** Result of the resolution */
  result: 'kept_variable' | 'kept_style' | 'kept_both' | 'kept_newest' | 'manual_required';
  /** Timestamp of resolution */
  timestamp: number;
}

// ============================================================================
// Conflict Detection
// ============================================================================

/**
 * Detects conflicts between normalized tokens
 *
 * @param tokens - Normalized tokens to analyze
 * @returns Conflict detection result
 *
 * @example
 * ```typescript
 * const tokens = [
 *   { normalizedName: 'primary-blue', value: '#0080ff', source: 'variable', ... },
 *   { normalizedName: 'primary-blue', value: '#0066cc', source: 'style', ... }
 * ];
 *
 * const result = detectConflicts(tokens);
 * console.log(result.conflicts.length); // 1
 * console.log(result.conflicts[0].type); // 'duplicate_name'
 * ```
 */
export function detectConflicts(tokens: NormalizedToken[]): ConflictDetectionResult {
  const conflicts: ConflictReport[] = [];
  const nameMap = new Map<string, NormalizedToken[]>();

  // Group tokens by normalized name
  for (const token of tokens) {
    if (!nameMap.has(token.normalizedName)) {
      nameMap.set(token.normalizedName, []);
    }
    nameMap.get(token.normalizedName)!.push(token);
  }

  // Check for conflicts in each group
  for (const [name, groupTokens] of nameMap.entries()) {
    if (groupTokens.length > 1) {
      const conflict = analyzeConflict(name, groupTokens);
      if (conflict) {
        conflicts.push(conflict);
      }
    }
  }

  // Check for near duplicates
  const nearDuplicates = findNearDuplicates(tokens);
  conflicts.push(...nearDuplicates);

  // Calculate statistics
  const statistics = calculateStatistics(conflicts);

  return {
    conflicts,
    totalTokens: tokens.length,
    uniqueNames: nameMap.size,
    statistics,
  };
}

/**
 * Analyzes a group of tokens with the same name to determine conflict type
 */
function analyzeConflict(name: string, tokens: NormalizedToken[]): ConflictReport | null {
  if (tokens.length < 2) return null;

  const sources: ConflictSource[] = tokens.map((t) => {
    const source: ConflictSource = {
      type: t.source,
      value: t.value,
      tokenType: t.type,
      originalName: t.originalName,
    };
    if (t.metadata !== undefined) {
      source.metadata = t.metadata;
    }
    return source;
  });

  // Check for type mismatch
  const types = new Set(tokens.map((t) => t.type));
  if (types.size > 1) {
    return {
      type: 'type_mismatch',
      name,
      sources,
      severity: 'high',
      recommendation: 'These tokens have different types. Review and decide which type is correct.',
    };
  }

  // Check if values are different
  const values = tokens.map((t) => JSON.stringify(t.value));
  const uniqueValues = new Set(values);

  if (uniqueValues.size > 1) {
    // Different values - this is a duplicate name conflict
    const hasVariableSource = tokens.some((t) => t.source === 'variable');
    const hasStyleSource = tokens.some((t) => t.source === 'style');

    let severity: ConflictSeverity = 'medium';
    let recommendation = 'Values differ. ';

    if (hasVariableSource && hasStyleSource) {
      severity = 'high';
      recommendation +=
        'Figma recommends using Variables. Consider using "variables_priority" strategy.';
    } else {
      recommendation +=
        'Both tokens are from the same source. This may indicate a normalization issue.';
    }

    return {
      type: 'duplicate_name',
      name,
      sources,
      severity,
      recommendation,
    };
  }

  // Same values - low severity, but still worth noting
  return {
    type: 'duplicate_name',
    name,
    sources,
    severity: 'low',
    recommendation: 'Same values from different sources. Safe to use either one.',
  };
}

/**
 * Finds near-duplicate token names (typos, variations)
 */
function findNearDuplicates(tokens: NormalizedToken[]): ConflictReport[] {
  const conflicts: ConflictReport[] = [];
  const names = tokens.map((t) => t.normalizedName);

  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const name1 = names[i];
      const name2 = names[j];
      if (!name1 || !name2) continue;

      const similarity = calculateSimilarity(name1, name2);

      // If names are very similar (>80% match), flag as near duplicate
      if (similarity > 0.8 && similarity < 1.0) {
        const token1 = tokens[i];
        const token2 = tokens[j];

        if (!token1 || !token2) continue;

        const source1: ConflictSource = {
          type: token1.source,
          value: token1.value,
          tokenType: token1.type,
          originalName: token1.originalName,
        };
        if (token1.metadata !== undefined) {
          source1.metadata = token1.metadata;
        }

        const source2: ConflictSource = {
          type: token2.source,
          value: token2.value,
          tokenType: token2.type,
          originalName: token2.originalName,
        };
        if (token2.metadata !== undefined) {
          source2.metadata = token2.metadata;
        }

        conflicts.push({
          type: 'near_duplicate',
          name: `${name1} / ${name2}`,
          sources: [source1, source2],
          severity: 'low',
          recommendation: `These names are very similar (${Math.round(similarity * 100)}% match). Check if one is a typo.`,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Calculates similarity between two strings (Levenshtein distance based)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1, // substitution
          matrix[i]![j - 1]! + 1, // insertion
          matrix[i - 1]![j]! + 1 // deletion
        );
      }
    }
  }

  return matrix[str2.length]![str1.length]!;
}

/**
 * Calculates statistics from conflicts
 */
function calculateStatistics(conflicts: ConflictReport[]): ConflictDetectionResult['statistics'] {
  return {
    duplicateNames: conflicts.filter((c) => c.type === 'duplicate_name').length,
    nearDuplicates: conflicts.filter((c) => c.type === 'near_duplicate').length,
    typeMismatches: conflicts.filter((c) => c.type === 'type_mismatch').length,
    lowSeverity: conflicts.filter((c) => c.severity === 'low').length,
    mediumSeverity: conflicts.filter((c) => c.severity === 'medium').length,
    highSeverity: conflicts.filter((c) => c.severity === 'high').length,
  };
}

// ============================================================================
// Conflict Resolution
// ============================================================================

/**
 * Resolves conflicts using the specified strategy
 *
 * @param tokens - Normalized tokens with potential conflicts
 * @param conflicts - Detected conflicts
 * @param strategy - Resolution strategy to apply
 * @returns Resolved tokens and audit trail
 *
 * @example
 * ```typescript
 * const result = resolveConflicts(tokens, conflicts, 'variables_priority');
 * console.log(result.tokens.length); // Resolved tokens
 * console.log(result.auditTrail); // Resolution decisions
 * ```
 */
export function resolveConflicts(
  tokens: NormalizedToken[],
  conflicts: ConflictReport[],
  strategy: ResolutionStrategyType = 'variables_priority'
): ConflictResolutionResult {
  const warnings: string[] = [];
  const auditTrail: ResolutionAudit[] = [];
  const resolvedTokens: ResolvedToken[] = [];

  // Create a map of conflicted names
  const conflictedNames = new Set(conflicts.map((c) => c.name));

  // Separate conflicted and non-conflicted tokens
  const nonConflictedTokens = tokens.filter((t) => !conflictedNames.has(t.normalizedName));
  const conflictedTokens = tokens.filter((t) => conflictedNames.has(t.normalizedName));

  // Add non-conflicted tokens as-is
  for (const token of nonConflictedTokens) {
    resolvedTokens.push({
      ...token,
      wasConflicted: false,
    });
  }

  // Resolve each conflict
  for (const conflict of conflicts) {
    try {
      const resolution = applyResolutionStrategy(conflict, strategy, conflictedTokens);

      // Add resolved tokens
      if (Array.isArray(resolution)) {
        resolvedTokens.push(...resolution);
      } else {
        resolvedTokens.push(resolution);
      }

      // Add to audit trail
      auditTrail.push({
        conflict,
        strategy,
        action: getResolutionAction(strategy, conflict),
        result: getResolutionResult(strategy, conflict),
        timestamp: Date.now(),
      });

      warnings.push(`Resolved conflict for "${conflict.name}" using ${strategy} strategy`);
    } catch (error) {
      warnings.push(
        `Failed to resolve conflict for "${conflict.name}": ${(error as Error).message}`
      );
    }
  }

  return {
    tokens: resolvedTokens,
    conflicts,
    warnings,
    strategy,
    auditTrail,
  };
}

/**
 * Applies a resolution strategy to a conflict
 */
function applyResolutionStrategy(
  conflict: ConflictReport,
  strategy: ResolutionStrategyType,
  allTokens: NormalizedToken[]
): ResolvedToken | ResolvedToken[] {
  // Get all tokens involved in this conflict
  const conflictTokens = allTokens.filter((t) => t.normalizedName === conflict.name);

  switch (strategy) {
    case 'variables_priority':
      return resolveWithVariablesPriority(conflict, conflictTokens);

    case 'styles_priority':
      return resolveWithStylesPriority(conflict, conflictTokens);

    case 'newest':
      return resolveWithNewest(conflict, conflictTokens);

    case 'rename_both':
      return resolveWithRenameBoth(conflict, conflictTokens);

    case 'manual':
      return resolveManual(conflict, conflictTokens);

    default:
      throw new Error(`Unknown resolution strategy: ${strategy as string}`);
  }
}

/**
 * Resolves conflict by preferring Variables over Styles
 */
function resolveWithVariablesPriority(
  conflict: ConflictReport,
  tokens: NormalizedToken[]
): ResolvedToken {
  const variableToken = tokens.find((t) => t.source === 'variable');

  if (variableToken) {
    return {
      ...variableToken,
      wasConflicted: true,
      resolutionStrategy: 'variables_priority',
      conflictDetails: conflict,
    };
  }

  // Fallback to first token if no variable source
  const firstToken = tokens[0];
  if (!firstToken) {
    throw new Error(`Cannot resolve conflict: no tokens provided for "${conflict.name}"`);
  }

  return {
    ...firstToken,
    wasConflicted: true,
    resolutionStrategy: 'variables_priority',
    conflictDetails: conflict,
  };
}

/**
 * Resolves conflict by preferring Styles over Variables
 */
function resolveWithStylesPriority(
  conflict: ConflictReport,
  tokens: NormalizedToken[]
): ResolvedToken {
  const styleToken = tokens.find((t) => t.source === 'style');

  if (styleToken) {
    return {
      ...styleToken,
      wasConflicted: true,
      resolutionStrategy: 'styles_priority',
      conflictDetails: conflict,
    };
  }

  // Fallback to first token if no style source
  const firstToken = tokens[0];
  if (!firstToken) {
    throw new Error(`Cannot resolve conflict: no tokens provided for "${conflict.name}"`);
  }

  return {
    ...firstToken,
    wasConflicted: true,
    resolutionStrategy: 'styles_priority',
    conflictDetails: conflict,
  };
}

/**
 * Resolves conflict by using the newest token (requires timestamp in metadata)
 */
function resolveWithNewest(conflict: ConflictReport, tokens: NormalizedToken[]): ResolvedToken {
  // Sort by timestamp if available in metadata
  const sorted = [...tokens].sort((a, b) => {
    const timeA = (a.metadata?.timestamp as number) ?? 0;
    const timeB = (b.metadata?.timestamp as number) ?? 0;
    return timeB - timeA;
  });

  const newestToken = sorted[0];
  if (!newestToken) {
    throw new Error(`Cannot resolve conflict: no tokens provided for "${conflict.name}"`);
  }

  return {
    ...newestToken,
    wasConflicted: true,
    resolutionStrategy: 'newest',
    conflictDetails: conflict,
  };
}

/**
 * Resolves conflict by keeping both tokens with suffixes
 */
function resolveWithRenameBoth(
  conflict: ConflictReport,
  tokens: NormalizedToken[]
): ResolvedToken[] {
  return tokens.map((token) => {
    const suffix = token.source === 'variable' ? '-var' : '-style';
    return {
      ...token,
      preResolutionName: token.normalizedName,
      normalizedName: token.normalizedName + suffix,
      path: [...token.path.slice(0, -1), token.path[token.path.length - 1] + suffix],
      wasConflicted: true,
      resolutionStrategy: 'rename_both',
      conflictDetails: conflict,
    };
  });
}

/**
 * Manual resolution (requires user intervention)
 */
function resolveManual(conflict: ConflictReport, tokens: NormalizedToken[]): ResolvedToken {
  // For now, return the first token and mark it as requiring manual resolution
  const firstToken = tokens[0];
  if (!firstToken) {
    throw new Error(`Cannot resolve conflict: no tokens provided for "${conflict.name}"`);
  }

  return {
    ...firstToken,
    wasConflicted: true,
    resolutionStrategy: 'manual',
    conflictDetails: conflict,
  };
}

/**
 * Gets a description of the resolution action taken
 */
function getResolutionAction(strategy: ResolutionStrategyType, conflict: ConflictReport): string {
  switch (strategy) {
    case 'variables_priority':
      return `Kept Variable source for "${conflict.name}"`;
    case 'styles_priority':
      return `Kept Style source for "${conflict.name}"`;
    case 'newest':
      return `Kept newest token for "${conflict.name}"`;
    case 'rename_both':
      return `Renamed both tokens with suffixes for "${conflict.name}"`;
    case 'manual':
      return `Marked "${conflict.name}" for manual resolution`;
    default:
      return `Applied ${strategy as string} strategy to "${conflict.name}"`;
  }
}

/**
 * Gets the result type of the resolution
 */
function getResolutionResult(
  strategy: ResolutionStrategyType,
  _conflict: ConflictReport
): ResolutionAudit['result'] {
  switch (strategy) {
    case 'variables_priority':
      return 'kept_variable';
    case 'styles_priority':
      return 'kept_style';
    case 'newest':
      return 'kept_newest';
    case 'rename_both':
      return 'kept_both';
    case 'manual':
      return 'manual_required';
    default:
      return 'kept_variable';
  }
}
