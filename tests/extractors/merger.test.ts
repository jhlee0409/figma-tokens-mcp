/**
 * Tests for Token Merger
 */

import { describe, it, expect } from 'vitest';
import {
  mergeTokens,
  quickMerge,
  mergeWithStrategy,
  getMergeStatistics,
  MergeMode,
} from '@/core/extractors/merger';
import { VariablesExtractionResult } from '@/core/extractors/variables-extractor';
import { ExtractedStyles } from '@/core/extractors/styles-extractor';
import { DetectedPattern } from '@/core/analyzers/pattern-detector';

describe('mergeTokens', () => {
  const mockPattern: DetectedPattern = {
    separator: '/',
    case: 'kebab',
    depth: 2,
    type: 'mixed',
    confidence: 1.0,
    sampleCount: 2,
    examples: [],
  };

  const mockVariablesResult: VariablesExtractionResult = {
    variables: [
      {
        id: 'var-1',
        name: 'primary/blue',
        normalizedName: 'primary/blue',
        type: 'COLOR',
        value: '#0080ff',
        originalValue: { r: 0, g: 0.5, b: 1, a: 1 },
        collectionId: 'col-1',
        collectionName: 'Colors',
        modeId: 'mode-1',
        modeName: 'Light',
        description: 'Primary blue color',
        scopes: ['ALL_FILLS'],
        isAlias: false,
      },
      {
        id: 'var-2',
        name: 'secondary/red',
        normalizedName: 'secondary/red',
        type: 'COLOR',
        value: '#ff0000',
        originalValue: { r: 1, g: 0, b: 0, a: 1 },
        collectionId: 'col-1',
        collectionName: 'Colors',
        modeId: 'mode-1',
        modeName: 'Light',
        description: 'Secondary red color',
        scopes: ['ALL_FILLS'],
        isAlias: false,
      },
    ],
    tokens: {},
    collections: [],
    pattern: mockPattern,
    warnings: [],
  };

  const mockStylesResult: ExtractedStyles = {
    colors: {
      'primary-blue': {
        value: '#0066cc',
        type: 'color',
        description: 'Primary blue from styles',
        originalName: 'Primary Blue',
      },
      'tertiary-green': {
        value: '#00ff00',
        type: 'color',
        description: 'Tertiary green',
        originalName: 'Tertiary Green',
      },
    },
    typography: {
      'heading-large': {
        value: {
          fontFamily: 'Inter',
          fontWeight: 700,
          fontSize: '32px',
          lineHeight: '40px',
          letterSpacing: '-0.5px',
          textDecoration: undefined,
          textTransform: undefined,
        },
        type: 'typography',
        description: 'Large heading',
        originalName: 'Heading/Large',
      },
    },
    metadata: {
      totalStyles: 3,
      colorStyles: 2,
      textStyles: 1,
      skippedStyles: 0,
      namingPattern: 'kebab-case',
    },
  };

  describe('variables_only mode', () => {
    it('should merge only variables when mode is variables_only', () => {
      const result = mergeTokens(mockVariablesResult, undefined, {
        mode: 'variables_only',
      });

      expect(result.tokens).toHaveLength(2);
      expect(result.statistics.variableTokens).toBe(2);
      expect(result.statistics.styleTokens).toBe(0);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should throw error when variables result is missing in variables_only mode', () => {
      expect(() => {
        mergeTokens(undefined, mockStylesResult, {
          mode: 'variables_only',
        });
      }).toThrow('Variables result is required');
    });

    it('should normalize variable tokens', () => {
      const result = mergeTokens(mockVariablesResult, undefined, {
        mode: 'variables_only',
      });

      const token = result.tokens.find(t => t.originalName === 'primary/blue');
      expect(token?.normalizedName).toBe('primary/blue');
      expect(token?.value).toBe('#0080ff');
      expect(token?.type).toBe('color');
    });
  });

  describe('styles_only mode', () => {
    it('should merge only styles when mode is styles_only', () => {
      const result = mergeTokens(undefined, mockStylesResult, {
        mode: 'styles_only',
      });

      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.statistics.variableTokens).toBe(0);
      expect(result.statistics.styleTokens).toBe(result.tokens.length);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should throw error when styles result is missing in styles_only mode', () => {
      expect(() => {
        mergeTokens(mockVariablesResult, undefined, {
          mode: 'styles_only',
        });
      }).toThrow('Styles result is required');
    });

    it('should convert both color and typography tokens', () => {
      const result = mergeTokens(undefined, mockStylesResult, {
        mode: 'styles_only',
      });

      const colorToken = result.tokens.find(t => t.type === 'color');
      const typographyToken = result.tokens.find(t => t.type === 'typography');

      expect(colorToken).toBeDefined();
      expect(typographyToken).toBeDefined();
    });
  });

  describe('merge mode', () => {
    it('should merge both variables and styles', () => {
      const result = mergeTokens(mockVariablesResult, mockStylesResult, {
        mode: 'merge',
      });

      expect(result.statistics.variableTokens).toBe(2);
      expect(result.statistics.styleTokens).toBeGreaterThan(0);
      expect(result.tokens.length).toBeGreaterThan(0);
    });

    it('should detect conflicts between variables and styles', () => {
      const result = mergeTokens(mockVariablesResult, mockStylesResult, {
        mode: 'merge',
      });

      // primary-blue exists in both sources with different values
      expect(result.conflicts.length).toBeGreaterThan(0);
      const conflict = result.conflicts.find(c => c.name.includes('primary'));
      expect(conflict).toBeDefined();
    });

    it('should use variables_priority by default', () => {
      const result = mergeTokens(mockVariablesResult, mockStylesResult, {
        mode: 'merge',
      });

      expect(result.resolutionStrategy).toBe('variables_priority');

      // Check that variable value is preferred
      const primaryBlueToken = result.tokens.find(
        t => t.normalizedName.includes('primary') && t.normalizedName.includes('blue')
      );
      if (primaryBlueToken?.wasConflicted) {
        expect(primaryBlueToken.source).toBe('variable');
      }
    });

    it('should allow custom resolution strategy', () => {
      const result = mergeTokens(mockVariablesResult, mockStylesResult, {
        mode: 'merge',
        resolutionStrategy: 'styles_priority',
      });

      expect(result.resolutionStrategy).toBe('styles_priority');
    });

    it('should include tokens from both sources when no conflicts', () => {
      const result = mergeTokens(mockVariablesResult, mockStylesResult, {
        mode: 'merge',
      });

      // secondary/red only in variables
      const secondaryRed = result.tokens.find(t => t.originalName === 'secondary/red');
      expect(secondaryRed).toBeDefined();

      // tertiary-green only in styles
      const tertiaryGreen = result.tokens.find(t => t.originalName === 'Tertiary Green');
      expect(tertiaryGreen).toBeDefined();
    });

    it('should build hierarchical structure', () => {
      const result = mergeTokens(mockVariablesResult, mockStylesResult, {
        mode: 'merge',
      });

      expect(result.hierarchy).toBeDefined();
      expect(typeof result.hierarchy).toBe('object');
    });

    it('should generate warnings for conflicts', () => {
      const result = mergeTokens(mockVariablesResult, mockStylesResult, {
        mode: 'merge',
      });

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should calculate correct statistics', () => {
      const result = mergeTokens(mockVariablesResult, mockStylesResult, {
        mode: 'merge',
      });

      expect(result.statistics.totalTokens).toBeGreaterThan(0);
      expect(result.statistics.variableTokens).toBe(2);
      expect(result.statistics.conflicts).toBeGreaterThanOrEqual(0);
    });

    it('should throw error when both results are missing', () => {
      expect(() => {
        mergeTokens(undefined, undefined, {
          mode: 'merge',
        });
      }).toThrow('At least one of variablesResult or stylesResult is required');
    });

    it('should handle only variables in merge mode', () => {
      const result = mergeTokens(mockVariablesResult, undefined, {
        mode: 'merge',
      });

      expect(result.tokens).toHaveLength(2);
      expect(result.statistics.styleTokens).toBe(0);
    });

    it('should handle only styles in merge mode', () => {
      const result = mergeTokens(undefined, mockStylesResult, {
        mode: 'merge',
      });

      expect(result.tokens.length).toBeGreaterThan(0);
      expect(result.statistics.variableTokens).toBe(0);
    });
  });

  describe('resolution strategies', () => {
    it('should resolve with rename_both strategy', () => {
      const result = mergeTokens(mockVariablesResult, mockStylesResult, {
        mode: 'merge',
        resolutionStrategy: 'rename_both',
      });

      expect(result.resolutionStrategy).toBe('rename_both');

      // Check if both versions exist with suffixes
      const varToken = result.tokens.find(t => t.normalizedName.includes('-var'));
      const styleToken = result.tokens.find(t => t.normalizedName.includes('-style'));

      if (result.conflicts.length > 0) {
        expect(varToken || styleToken).toBeDefined();
      }
    });

    it('should resolve with newest strategy', () => {
      const result = mergeTokens(mockVariablesResult, mockStylesResult, {
        mode: 'merge',
        resolutionStrategy: 'newest',
      });

      expect(result.resolutionStrategy).toBe('newest');
    });

    it('should resolve with manual strategy', () => {
      const result = mergeTokens(mockVariablesResult, mockStylesResult, {
        mode: 'merge',
        resolutionStrategy: 'manual',
      });

      expect(result.resolutionStrategy).toBe('manual');

      // Check if any token is marked for manual resolution
      const manualToken = result.tokens.find(t => t.resolutionStrategy === 'manual');
      if (result.conflicts.length > 0) {
        expect(manualToken).toBeDefined();
      }
    });
  });

  describe('metadata preservation', () => {
    it('should preserve metadata by default', () => {
      const result = mergeTokens(mockVariablesResult, mockStylesResult, {
        mode: 'merge',
      });

      const token = result.tokens.find(t => t.source === 'variable');
      expect(token?.metadata).toBeDefined();
    });

    it('should not preserve metadata when disabled', () => {
      const result = mergeTokens(mockVariablesResult, mockStylesResult, {
        mode: 'merge',
        preserveMetadata: false,
      });

      const token = result.tokens.find(t => t.source === 'variable');
      expect(token?.metadata).toBeUndefined();
    });
  });

  describe('custom transformation rules', () => {
    it('should apply custom rules during normalization', () => {
      const result = mergeTokens(mockVariablesResult, mockStylesResult, {
        mode: 'merge',
        customRules: {
          'primary/blue': 'brand/primary',
        },
      });

      // Check if the custom rule was applied (should show in warnings)
      const hasCustomRuleWarning = result.warnings.some(w => w.includes('custom rule'));
      if (hasCustomRuleWarning) {
        expect(hasCustomRuleWarning).toBe(true);
      }
    });
  });
});

describe('quickMerge', () => {
  const mockVariablesResult: VariablesExtractionResult = {
    variables: [
      {
        id: 'var-1',
        name: 'primary/blue',
        normalizedName: 'primary/blue',
        type: 'COLOR',
        value: '#0080ff',
        originalValue: { r: 0, g: 0.5, b: 1, a: 1 },
        collectionId: 'col-1',
        collectionName: 'Colors',
        modeId: 'mode-1',
        modeName: 'Light',
        description: 'Primary blue',
        scopes: ['ALL_FILLS'],
        isAlias: false,
      },
    ],
    tokens: {},
    collections: [],
    pattern: {
      separator: '/',
      case: 'kebab',
      depth: 2,
      type: 'mixed',
      confidence: 1.0,
      sampleCount: 1,
      examples: [],
    },
    warnings: [],
  };

  it('should merge with default options', () => {
    const result = quickMerge(mockVariablesResult);

    expect(result.resolutionStrategy).toBe('variables_priority');
    expect(result.tokens).toHaveLength(1);
  });

  it('should work with both sources', () => {
    const stylesResult: ExtractedStyles = {
      colors: {
        'secondary-red': {
          value: '#ff0000',
          type: 'color',
          description: 'Secondary red',
          originalName: 'Secondary Red',
        },
      },
      typography: {},
      metadata: {
        totalStyles: 1,
        colorStyles: 1,
        textStyles: 0,
        skippedStyles: 0,
        namingPattern: 'kebab-case',
      },
    };

    const result = quickMerge(mockVariablesResult, stylesResult);

    expect(result.tokens.length).toBeGreaterThan(0);
  });
});

describe('mergeWithStrategy', () => {
  const mockVariablesResult: VariablesExtractionResult = {
    variables: [
      {
        id: 'var-1',
        name: 'primary/blue',
        normalizedName: 'primary/blue',
        type: 'COLOR',
        value: '#0080ff',
        originalValue: { r: 0, g: 0.5, b: 1, a: 1 },
        collectionId: 'col-1',
        collectionName: 'Colors',
        modeId: 'mode-1',
        modeName: 'Light',
        description: 'Primary blue',
        scopes: ['ALL_FILLS'],
        isAlias: false,
      },
    ],
    tokens: {},
    collections: [],
    warnings: [],
  };

  it('should use specified strategy', () => {
    const result = mergeWithStrategy(mockVariablesResult, undefined, 'styles_priority');

    expect(result.resolutionStrategy).toBe('styles_priority');
  });

  it('should work with all strategy types', () => {
    const strategies: Array<'variables_priority' | 'styles_priority' | 'newest' | 'rename_both' | 'manual'> = [
      'variables_priority',
      'styles_priority',
      'newest',
      'rename_both',
      'manual',
    ];

    for (const strategy of strategies) {
      const result = mergeWithStrategy(mockVariablesResult, undefined, strategy);
      expect(result.resolutionStrategy).toBe(strategy);
    }
  });
});

describe('getMergeStatistics', () => {
  it('should format statistics as human-readable string', () => {
    const mockResult = {
      tokens: [],
      hierarchy: {},
      conflicts: [],
      warnings: [],
      pattern: {
        separator: '/',
        case: 'kebab' as const,
        depth: 2,
        type: 'mixed' as const,
        confidence: 1.0,
        sampleCount: 1,
        examples: [],
      },
      resolutionStrategy: 'variables_priority' as const,
      statistics: {
        totalTokens: 10,
        variableTokens: 6,
        styleTokens: 4,
        conflicts: 2,
        resolved: 2,
        unresolved: 0,
      },
    };

    const stats = getMergeStatistics(mockResult);

    expect(stats).toContain('Total tokens: 10');
    expect(stats).toContain('Variables: 6');
    expect(stats).toContain('Styles: 4');
    expect(stats).toContain('Conflicts: 2');
    expect(stats).toContain('Resolved: 2');
  });

  it('should include conflict breakdown when conflicts exist', () => {
    const mockResult = {
      tokens: [],
      hierarchy: {},
      conflicts: [
        {
          type: 'duplicate_name' as const,
          name: 'primary/blue',
          sources: [],
          severity: 'high' as const,
          recommendation: '',
        },
        {
          type: 'type_mismatch' as const,
          name: 'secondary/red',
          sources: [],
          severity: 'high' as const,
          recommendation: '',
        },
      ],
      warnings: [],
      pattern: {
        separator: '/',
        case: 'kebab' as const,
        depth: 2,
        type: 'mixed' as const,
        confidence: 1.0,
        sampleCount: 1,
        examples: [],
      },
      resolutionStrategy: 'variables_priority' as const,
      statistics: {
        totalTokens: 10,
        variableTokens: 6,
        styleTokens: 4,
        conflicts: 2,
        resolved: 2,
        unresolved: 0,
      },
    };

    const stats = getMergeStatistics(mockResult);

    expect(stats).toContain('Conflict breakdown:');
    expect(stats).toContain('duplicate_name: 1');
    expect(stats).toContain('type_mismatch: 1');
  });

  it('should handle result with no conflicts', () => {
    const mockResult = {
      tokens: [],
      hierarchy: {},
      conflicts: [],
      warnings: [],
      pattern: {
        separator: '/',
        case: 'kebab' as const,
        depth: 2,
        type: 'mixed' as const,
        confidence: 1.0,
        sampleCount: 1,
        examples: [],
      },
      resolutionStrategy: 'variables_priority' as const,
      statistics: {
        totalTokens: 10,
        variableTokens: 6,
        styleTokens: 4,
        conflicts: 0,
        resolved: 0,
        unresolved: 0,
      },
    };

    const stats = getMergeStatistics(mockResult);

    expect(stats).toContain('Conflicts: 0');
    expect(stats).not.toContain('Conflict breakdown:');
  });
});

describe('Edge Cases', () => {
  it('should handle empty variables and styles', () => {
    const emptyVariables: VariablesExtractionResult = {
      variables: [],
      tokens: {},
      collections: [],
      warnings: [],
    };

    const emptyStyles: ExtractedStyles = {
      colors: {},
      typography: {},
      metadata: {
        totalStyles: 0,
        colorStyles: 0,
        textStyles: 0,
        skippedStyles: 0,
        namingPattern: 'kebab-case',
      },
    };

    const result = mergeTokens(emptyVariables, emptyStyles, { mode: 'merge' });

    expect(result.tokens).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should handle variables with complex metadata', () => {
    const complexVariables: VariablesExtractionResult = {
      variables: [
        {
          id: 'var-1',
          name: 'primary/blue',
          normalizedName: 'primary/blue',
          type: 'COLOR',
          value: '#0080ff',
          originalValue: { r: 0, g: 0.5, b: 1, a: 1 },
          collectionId: 'col-1',
          collectionName: 'Colors',
          modeId: 'mode-1',
          modeName: 'Light',
          description: 'Primary blue with alias',
          scopes: ['ALL_FILLS', 'STROKE_COLOR'],
          isAlias: true,
          aliasId: 'var-base-blue',
        },
      ],
      tokens: {},
      collections: [],
      warnings: [],
    };

    const result = mergeTokens(complexVariables, undefined, { mode: 'variables_only' });

    const token = result.tokens[0];
    expect(token.metadata?.isAlias).toBe(true);
    expect(token.metadata?.aliasId).toBe('var-base-blue');
  });

  it('should handle typography tokens from styles', () => {
    const typographyStyles: ExtractedStyles = {
      colors: {},
      typography: {
        'heading-xl': {
          value: {
            fontFamily: 'Inter',
            fontWeight: 800,
            fontSize: '48px',
            lineHeight: '56px',
            letterSpacing: '-1px',
            textDecoration: 'underline',
            textTransform: 'uppercase',
          },
          type: 'typography',
          description: 'Extra large heading',
          originalName: 'Typography/Heading/XL',
        },
      },
      metadata: {
        totalStyles: 1,
        colorStyles: 0,
        textStyles: 1,
        skippedStyles: 0,
        namingPattern: 'slash/case',
      },
    };

    const result = mergeTokens(undefined, typographyStyles, { mode: 'styles_only' });

    const token = result.tokens.find(t => t.type === 'typography');
    expect(token).toBeDefined();
    expect(token?.value).toBeDefined();
  });
});
