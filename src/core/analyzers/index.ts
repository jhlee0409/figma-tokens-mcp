/**
 * Pattern Detector exports
 */

export {
  detectPatterns,
  detectSeparator,
  detectCaseStyle,
  calculateDepth,
  detectNameType,
  normalizeVariableName,
} from './pattern-detector';

export type { DetectedPattern, PatternDetectionResult } from './pattern-detector';

/**
 * Normalizer exports
 */

export {
  normalizeTokens,
  normalizeTokenName,
  buildHierarchy,
  flattenHierarchy,
  transformTokenStructure,
} from './normalizer';

export type {
  GenericToken,
  NormalizedToken,
  TokenHierarchy,
  TokenNode,
  NormalizationOptions,
  NormalizationResult,
} from './normalizer';

/**
 * Conflict Resolver exports
 */

export { detectConflicts, resolveConflicts } from './conflict-resolver';

export type {
  ConflictType,
  ConflictSeverity,
  ConflictSource,
  ConflictReport,
  ResolutionStrategyType,
  ResolvedToken,
  ResolutionStrategy,
  ConflictDetectionResult,
  ConflictResolutionResult,
  ResolutionAudit,
} from './conflict-resolver';
