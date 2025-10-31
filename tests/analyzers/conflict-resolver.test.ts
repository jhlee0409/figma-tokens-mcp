/**
 * Tests for Conflict Resolver
 */

import { describe, it, expect } from 'vitest';
import {
  detectConflicts,
  resolveConflicts,
  ConflictReport,
  ConflictType,
  ResolutionStrategyType,
} from '@/core/analyzers/conflict-resolver';
import { NormalizedToken } from '@/core/analyzers/normalizer';

describe('detectConflicts', () => {
  it('should detect duplicate name conflicts with different values', () => {
    const tokens: NormalizedToken[] = [
      {
        originalName: 'primary/blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0080ff',
        type: 'color',
        source: 'variable',
      },
      {
        originalName: 'primary-blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0066cc',
        type: 'color',
        source: 'style',
      },
    ];

    const result = detectConflicts(tokens);

    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].type).toBe('duplicate_name');
    expect(result.conflicts[0].name).toBe('primary/blue');
    expect(result.conflicts[0].severity).toBe('high');
  });

  it('should detect duplicate names with same values (low severity)', () => {
    const tokens: NormalizedToken[] = [
      {
        originalName: 'primary/blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0080ff',
        type: 'color',
        source: 'variable',
      },
      {
        originalName: 'primary-blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0080ff',
        type: 'color',
        source: 'style',
      },
    ];

    const result = detectConflicts(tokens);

    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].severity).toBe('low');
    expect(result.conflicts[0].recommendation).toContain('Same values');
  });

  it('should detect type mismatch conflicts', () => {
    const tokens: NormalizedToken[] = [
      {
        originalName: 'primary/blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0080ff',
        type: 'color',
        source: 'variable',
      },
      {
        originalName: 'primary-blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '16px',
        type: 'spacing',
        source: 'style',
      },
    ];

    const result = detectConflicts(tokens);

    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].type).toBe('type_mismatch');
    expect(result.conflicts[0].severity).toBe('high');
  });

  it('should detect near-duplicate names', () => {
    const tokens: NormalizedToken[] = [
      {
        originalName: 'primary/blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0080ff',
        type: 'color',
        source: 'variable',
      },
      {
        originalName: 'primary/bleu', // typo
        normalizedName: 'primary/bleu',
        path: ['primary', 'bleu'],
        value: '#0080ff',
        type: 'color',
        source: 'variable',
      },
    ];

    const result = detectConflicts(tokens);

    expect(result.conflicts.length).toBeGreaterThan(0);
    const nearDuplicate = result.conflicts.find(c => c.type === 'near_duplicate');
    expect(nearDuplicate).toBeDefined();
    expect(nearDuplicate?.severity).toBe('low');
  });

  it('should calculate correct statistics', () => {
    const tokens: NormalizedToken[] = [
      {
        originalName: 'primary/blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0080ff',
        type: 'color',
        source: 'variable',
      },
      {
        originalName: 'primary-blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0066cc',
        type: 'color',
        source: 'style',
      },
      {
        originalName: 'secondary/red',
        normalizedName: 'secondary/red',
        path: ['secondary', 'red'],
        value: '#ff0000',
        type: 'color',
        source: 'variable',
      },
      {
        originalName: 'secondary-red',
        normalizedName: 'secondary/red',
        path: ['secondary', 'red'],
        value: '16px',
        type: 'spacing',
        source: 'style',
      },
    ];

    const result = detectConflicts(tokens);

    expect(result.totalTokens).toBe(4);
    expect(result.uniqueNames).toBe(2);
    expect(result.statistics.duplicateNames).toBeGreaterThan(0);
    expect(result.statistics.typeMismatches).toBeGreaterThan(0);
  });

  it('should return no conflicts for unique tokens', () => {
    const tokens: NormalizedToken[] = [
      {
        originalName: 'primary/blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0080ff',
        type: 'color',
        source: 'variable',
      },
      {
        originalName: 'secondary/red',
        normalizedName: 'secondary/red',
        path: ['secondary', 'red'],
        value: '#ff0000',
        type: 'color',
        source: 'variable',
      },
    ];

    const result = detectConflicts(tokens);

    expect(result.conflicts).toHaveLength(0);
  });

  it('should handle empty token list', () => {
    const result = detectConflicts([]);

    expect(result.conflicts).toHaveLength(0);
    expect(result.totalTokens).toBe(0);
    expect(result.uniqueNames).toBe(0);
  });

  it('should include source information in conflict reports', () => {
    const tokens: NormalizedToken[] = [
      {
        originalName: 'primary/blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0080ff',
        type: 'color',
        source: 'variable',
      },
      {
        originalName: 'primary-blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0066cc',
        type: 'color',
        source: 'style',
      },
    ];

    const result = detectConflicts(tokens);

    expect(result.conflicts[0].sources).toHaveLength(2);
    expect(result.conflicts[0].sources[0].type).toBe('variable');
    expect(result.conflicts[0].sources[1].type).toBe('style');
    expect(result.conflicts[0].sources[0].value).toBe('#0080ff');
    expect(result.conflicts[0].sources[1].value).toBe('#0066cc');
  });
});

describe('resolveConflicts', () => {
  describe('variables_priority strategy', () => {
    it('should prefer variable over style', () => {
      const tokens: NormalizedToken[] = [
        {
          originalName: 'primary/blue',
          normalizedName: 'primary/blue',
          path: ['primary', 'blue'],
          value: '#0080ff',
          type: 'color',
          source: 'variable',
        },
        {
          originalName: 'primary-blue',
          normalizedName: 'primary/blue',
          path: ['primary', 'blue'],
          value: '#0066cc',
          type: 'color',
          source: 'style',
        },
      ];

      const conflicts = detectConflicts(tokens).conflicts;
      const result = resolveConflicts(tokens, conflicts, 'variables_priority');

      const resolvedToken = result.tokens.find(t => t.normalizedName === 'primary/blue');
      expect(resolvedToken?.source).toBe('variable');
      expect(resolvedToken?.value).toBe('#0080ff');
      expect(resolvedToken?.wasConflicted).toBe(true);
    });

    it('should include non-conflicted tokens', () => {
      const tokens: NormalizedToken[] = [
        {
          originalName: 'primary/blue',
          normalizedName: 'primary/blue',
          path: ['primary', 'blue'],
          value: '#0080ff',
          type: 'color',
          source: 'variable',
        },
        {
          originalName: 'primary-blue',
          normalizedName: 'primary/blue',
          path: ['primary', 'blue'],
          value: '#0066cc',
          type: 'color',
          source: 'style',
        },
        {
          originalName: 'secondary/red',
          normalizedName: 'secondary/red',
          path: ['secondary', 'red'],
          value: '#ff0000',
          type: 'color',
          source: 'variable',
        },
      ];

      const conflicts = detectConflicts(tokens).conflicts;
      const result = resolveConflicts(tokens, conflicts, 'variables_priority');

      const nonConflictedToken = result.tokens.find(t => t.normalizedName === 'secondary/red');
      expect(nonConflictedToken?.wasConflicted).toBe(false);
    });
  });

  describe('styles_priority strategy', () => {
    it('should prefer style over variable', () => {
      const tokens: NormalizedToken[] = [
        {
          originalName: 'primary/blue',
          normalizedName: 'primary/blue',
          path: ['primary', 'blue'],
          value: '#0080ff',
          type: 'color',
          source: 'variable',
        },
        {
          originalName: 'primary-blue',
          normalizedName: 'primary/blue',
          path: ['primary', 'blue'],
          value: '#0066cc',
          type: 'color',
          source: 'style',
        },
      ];

      const conflicts = detectConflicts(tokens).conflicts;
      const result = resolveConflicts(tokens, conflicts, 'styles_priority');

      const resolvedToken = result.tokens.find(t => t.normalizedName === 'primary/blue');
      expect(resolvedToken?.source).toBe('style');
      expect(resolvedToken?.value).toBe('#0066cc');
    });
  });

  describe('newest strategy', () => {
    it('should prefer token with newest timestamp', () => {
      const tokens: NormalizedToken[] = [
        {
          originalName: 'primary/blue',
          normalizedName: 'primary/blue',
          path: ['primary', 'blue'],
          value: '#0080ff',
          type: 'color',
          source: 'variable',
          metadata: { timestamp: 1000 },
        },
        {
          originalName: 'primary-blue',
          normalizedName: 'primary/blue',
          path: ['primary', 'blue'],
          value: '#0066cc',
          type: 'color',
          source: 'style',
          metadata: { timestamp: 2000 },
        },
      ];

      const conflicts = detectConflicts(tokens).conflicts;
      const result = resolveConflicts(tokens, conflicts, 'newest');

      const resolvedToken = result.tokens.find(t => t.normalizedName === 'primary/blue');
      expect(resolvedToken?.value).toBe('#0066cc'); // Newer timestamp
      expect(resolvedToken?.resolutionStrategy).toBe('newest');
    });

    it('should handle tokens without timestamps', () => {
      const tokens: NormalizedToken[] = [
        {
          originalName: 'primary/blue',
          normalizedName: 'primary/blue',
          path: ['primary', 'blue'],
          value: '#0080ff',
          type: 'color',
          source: 'variable',
        },
        {
          originalName: 'primary-blue',
          normalizedName: 'primary/blue',
          path: ['primary', 'blue'],
          value: '#0066cc',
          type: 'color',
          source: 'style',
        },
      ];

      const conflicts = detectConflicts(tokens).conflicts;
      const result = resolveConflicts(tokens, conflicts, 'newest');

      // Should pick first token when timestamps are missing
      expect(result.tokens.find(t => t.normalizedName === 'primary/blue')).toBeDefined();
    });
  });

  describe('rename_both strategy', () => {
    it('should keep both tokens with suffixes', () => {
      const tokens: NormalizedToken[] = [
        {
          originalName: 'primary/blue',
          normalizedName: 'primary/blue',
          path: ['primary', 'blue'],
          value: '#0080ff',
          type: 'color',
          source: 'variable',
        },
        {
          originalName: 'primary-blue',
          normalizedName: 'primary/blue',
          path: ['primary', 'blue'],
          value: '#0066cc',
          type: 'color',
          source: 'style',
        },
      ];

      const conflicts = detectConflicts(tokens).conflicts;
      const result = resolveConflicts(tokens, conflicts, 'rename_both');

      const varToken = result.tokens.find(t => t.normalizedName === 'primary/blue-var');
      const styleToken = result.tokens.find(t => t.normalizedName === 'primary/blue-style');

      expect(varToken).toBeDefined();
      expect(styleToken).toBeDefined();
      expect(varToken?.source).toBe('variable');
      expect(styleToken?.source).toBe('style');
      expect(varToken?.preResolutionName).toBe('primary/blue');
      expect(styleToken?.preResolutionName).toBe('primary/blue');
    });

    it('should update path for renamed tokens', () => {
      const tokens: NormalizedToken[] = [
        {
          originalName: 'primary/blue',
          normalizedName: 'primary/blue',
          path: ['primary', 'blue'],
          value: '#0080ff',
          type: 'color',
          source: 'variable',
        },
        {
          originalName: 'primary-blue',
          normalizedName: 'primary/blue',
          path: ['primary', 'blue'],
          value: '#0066cc',
          type: 'color',
          source: 'style',
        },
      ];

      const conflicts = detectConflicts(tokens).conflicts;
      const result = resolveConflicts(tokens, conflicts, 'rename_both');

      const varToken = result.tokens.find(t => t.normalizedName === 'primary/blue-var');
      expect(varToken?.path).toEqual(['primary', 'blue-var']);
    });
  });

  describe('manual strategy', () => {
    it('should mark conflict as requiring manual resolution', () => {
      const tokens: NormalizedToken[] = [
        {
          originalName: 'primary/blue',
          normalizedName: 'primary/blue',
          path: ['primary', 'blue'],
          value: '#0080ff',
          type: 'color',
          source: 'variable',
        },
        {
          originalName: 'primary-blue',
          normalizedName: 'primary/blue',
          path: ['primary', 'blue'],
          value: '#0066cc',
          type: 'color',
          source: 'style',
        },
      ];

      const conflicts = detectConflicts(tokens).conflicts;
      const result = resolveConflicts(tokens, conflicts, 'manual');

      const resolvedToken = result.tokens.find(t => t.normalizedName === 'primary/blue');
      expect(resolvedToken?.resolutionStrategy).toBe('manual');
      expect(resolvedToken?.wasConflicted).toBe(true);
    });
  });

  it('should generate warnings for each resolution', () => {
    const tokens: NormalizedToken[] = [
      {
        originalName: 'primary/blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0080ff',
        type: 'color',
        source: 'variable',
      },
      {
        originalName: 'primary-blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0066cc',
        type: 'color',
        source: 'style',
      },
    ];

    const conflicts = detectConflicts(tokens).conflicts;
    const result = resolveConflicts(tokens, conflicts, 'variables_priority');

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some(w => w.includes('Resolved conflict'))).toBe(true);
  });

  it('should create audit trail for resolutions', () => {
    const tokens: NormalizedToken[] = [
      {
        originalName: 'primary/blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0080ff',
        type: 'color',
        source: 'variable',
      },
      {
        originalName: 'primary-blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0066cc',
        type: 'color',
        source: 'style',
      },
    ];

    const conflicts = detectConflicts(tokens).conflicts;
    const result = resolveConflicts(tokens, conflicts, 'variables_priority');

    expect(result.auditTrail).toHaveLength(1);
    expect(result.auditTrail[0].strategy).toBe('variables_priority');
    expect(result.auditTrail[0].result).toBe('kept_variable');
    expect(result.auditTrail[0].timestamp).toBeDefined();
  });

  it('should include conflict details in resolved tokens', () => {
    const tokens: NormalizedToken[] = [
      {
        originalName: 'primary/blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0080ff',
        type: 'color',
        source: 'variable',
      },
      {
        originalName: 'primary-blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0066cc',
        type: 'color',
        source: 'style',
      },
    ];

    const conflicts = detectConflicts(tokens).conflicts;
    const result = resolveConflicts(tokens, conflicts, 'variables_priority');

    const resolvedToken = result.tokens.find(t => t.wasConflicted);
    expect(resolvedToken?.conflictDetails).toBeDefined();
    expect(resolvedToken?.conflictDetails?.name).toBe('primary/blue');
  });

  it('should handle multiple conflicts', () => {
    const tokens: NormalizedToken[] = [
      {
        originalName: 'primary/blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0080ff',
        type: 'color',
        source: 'variable',
      },
      {
        originalName: 'primary-blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0066cc',
        type: 'color',
        source: 'style',
      },
      {
        originalName: 'secondary/red',
        normalizedName: 'secondary/red',
        path: ['secondary', 'red'],
        value: '#ff0000',
        type: 'color',
        source: 'variable',
      },
      {
        originalName: 'secondary-red',
        normalizedName: 'secondary/red',
        path: ['secondary', 'red'],
        value: '#cc0000',
        type: 'color',
        source: 'style',
      },
    ];

    const conflicts = detectConflicts(tokens).conflicts;
    const result = resolveConflicts(tokens, conflicts, 'variables_priority');

    expect(result.auditTrail.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle empty conflicts list', () => {
    const tokens: NormalizedToken[] = [
      {
        originalName: 'primary/blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0080ff',
        type: 'color',
        source: 'variable',
      },
    ];

    const result = resolveConflicts(tokens, [], 'variables_priority');

    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0].wasConflicted).toBe(false);
    expect(result.auditTrail).toHaveLength(0);
  });
});

describe('Edge Cases', () => {
  it('should handle tokens with metadata', () => {
    const tokens: NormalizedToken[] = [
      {
        originalName: 'primary/blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0080ff',
        type: 'color',
        source: 'variable',
        metadata: { variableId: 'var-123', description: 'Primary blue' },
      },
      {
        originalName: 'primary-blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0066cc',
        type: 'color',
        source: 'style',
        metadata: { styleId: 'style-456', description: 'Primary blue style' },
      },
    ];

    const conflicts = detectConflicts(tokens).conflicts;

    expect(conflicts[0].sources[0].metadata).toEqual({
      variableId: 'var-123',
      description: 'Primary blue',
    });
    expect(conflicts[0].sources[1].metadata).toEqual({
      styleId: 'style-456',
      description: 'Primary blue style',
    });
  });

  it('should handle very similar names (95% match)', () => {
    const tokens: NormalizedToken[] = [
      {
        originalName: 'primary/blue/500',
        normalizedName: 'primary/blue/500',
        path: ['primary', 'blue', '500'],
        value: '#0080ff',
        type: 'color',
        source: 'variable',
      },
      {
        originalName: 'primary/blue/50',
        normalizedName: 'primary/blue/50',
        path: ['primary', 'blue', '50'],
        value: '#e6f2ff',
        type: 'color',
        source: 'variable',
      },
    ];

    const result = detectConflicts(tokens);

    // Should find near duplicate
    const nearDuplicate = result.conflicts.find(c => c.type === 'near_duplicate');
    expect(nearDuplicate).toBeDefined();
  });

  it('should not flag completely different names as near duplicates', () => {
    const tokens: NormalizedToken[] = [
      {
        originalName: 'primary/blue',
        normalizedName: 'primary/blue',
        path: ['primary', 'blue'],
        value: '#0080ff',
        type: 'color',
        source: 'variable',
      },
      {
        originalName: 'secondary/red',
        normalizedName: 'secondary/red',
        path: ['secondary', 'red'],
        value: '#ff0000',
        type: 'color',
        source: 'variable',
      },
    ];

    const result = detectConflicts(tokens);

    const nearDuplicates = result.conflicts.filter(c => c.type === 'near_duplicate');
    expect(nearDuplicates).toHaveLength(0);
  });
});
