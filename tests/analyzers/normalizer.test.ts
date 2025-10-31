/**
 * Tests for Token Normalizer
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeTokens,
  normalizeTokenName,
  buildHierarchy,
  flattenHierarchy,
  transformTokenStructure,
  GenericToken,
  NormalizedToken,
} from '@/core/analyzers/normalizer';
import { DetectedPattern } from '@/core/analyzers/pattern-detector';

describe('normalizeTokenName', () => {
  it('should normalize slash-separated names to kebab-case', () => {
    const pattern: DetectedPattern = {
      separator: '-',
      case: 'kebab',
      depth: 3,
      type: 'mixed',
      confidence: 1.0,
      sampleCount: 1,
      examples: [],
    };

    expect(normalizeTokenName('Primary/Blue/500', pattern)).toBe('primary-blue-500');
    expect(normalizeTokenName('secondary/red/400', pattern)).toBe('secondary-red-400');
  });

  it('should normalize kebab-case to slash-separated', () => {
    const pattern: DetectedPattern = {
      separator: '/',
      case: 'kebab',
      depth: 3,
      type: 'mixed',
      confidence: 1.0,
      sampleCount: 1,
      examples: [],
    };

    expect(normalizeTokenName('primary-blue-500', pattern)).toBe('primary/blue/500');
    expect(normalizeTokenName('secondary-red-400', pattern)).toBe('secondary/red/400');
  });

  it('should normalize PascalCase to kebab-case', () => {
    const pattern: DetectedPattern = {
      separator: '-',
      case: 'kebab',
      depth: 3,
      type: 'mixed',
      confidence: 1.0,
      sampleCount: 1,
      examples: [],
    };

    expect(normalizeTokenName('PrimaryBlue500', pattern)).toBe('primary-blue-500');
    expect(normalizeTokenName('SecondaryRed400', pattern)).toBe('secondary-red-400');
  });

  it('should normalize camelCase to kebab-case', () => {
    const pattern: DetectedPattern = {
      separator: '-',
      case: 'kebab',
      depth: 3,
      type: 'mixed',
      confidence: 1.0,
      sampleCount: 1,
      examples: [],
    };

    expect(normalizeTokenName('primaryBlue500', pattern)).toBe('primary-blue-500');
    expect(normalizeTokenName('secondaryRed400', pattern)).toBe('secondary-red-400');
  });

  it('should convert to PascalCase when separator is none', () => {
    const pattern: DetectedPattern = {
      separator: 'none',
      case: 'pascal',
      depth: 3,
      type: 'mixed',
      confidence: 1.0,
      sampleCount: 1,
      examples: [],
    };

    expect(normalizeTokenName('primary-blue-500', pattern)).toBe('PrimaryBlue500');
    expect(normalizeTokenName('secondary/red/400', pattern)).toBe('SecondaryRed400');
  });

  it('should convert to camelCase when separator is none', () => {
    const pattern: DetectedPattern = {
      separator: 'none',
      case: 'camel',
      depth: 3,
      type: 'mixed',
      confidence: 1.0,
      sampleCount: 1,
      examples: [],
    };

    expect(normalizeTokenName('primary-blue-500', pattern)).toBe('primaryBlue500');
    expect(normalizeTokenName('secondary/red/400', pattern)).toBe('secondaryRed400');
  });

  it('should handle snake_case to kebab-case', () => {
    const pattern: DetectedPattern = {
      separator: '-',
      case: 'kebab',
      depth: 3,
      type: 'mixed',
      confidence: 1.0,
      sampleCount: 1,
      examples: [],
    };

    expect(normalizeTokenName('primary_blue_500', pattern)).toBe('primary-blue-500');
  });

  it('should handle dot.case to slash/case', () => {
    const pattern: DetectedPattern = {
      separator: '/',
      case: 'kebab',
      depth: 3,
      type: 'mixed',
      confidence: 1.0,
      sampleCount: 1,
      examples: [],
    };

    expect(normalizeTokenName('primary.blue.500', pattern)).toBe('primary/blue/500');
  });
});

describe('normalizeTokens', () => {
  const pattern: DetectedPattern = {
    separator: '/',
    case: 'kebab',
    depth: 3,
    type: 'mixed',
    confidence: 1.0,
    sampleCount: 2,
    examples: [],
  };

  it('should normalize a list of tokens', () => {
    const tokens: GenericToken[] = [
      { name: 'Primary/Blue/500', value: '#0080ff', type: 'color', source: 'variable' },
      { name: 'primary-blue-600', value: '#0066cc', type: 'color', source: 'style' },
    ];

    const result = normalizeTokens(tokens, { targetPattern: pattern });

    expect(result.tokens).toHaveLength(2);
    expect(result.tokens[0].normalizedName).toBe('primary/blue/500');
    expect(result.tokens[1].normalizedName).toBe('primary/blue/600');
  });

  it('should preserve metadata when enabled', () => {
    const tokens: GenericToken[] = [
      {
        name: 'Primary/Blue/500',
        value: '#0080ff',
        type: 'color',
        source: 'variable',
        metadata: { variableId: 'var-123', description: 'Primary blue' },
      },
    ];

    const result = normalizeTokens(tokens, {
      targetPattern: pattern,
      preserveMetadata: true,
    });

    expect(result.tokens[0].metadata).toEqual({
      variableId: 'var-123',
      description: 'Primary blue',
    });
  });

  it('should not preserve metadata when disabled', () => {
    const tokens: GenericToken[] = [
      {
        name: 'Primary/Blue/500',
        value: '#0080ff',
        type: 'color',
        source: 'variable',
        metadata: { variableId: 'var-123' },
      },
    ];

    const result = normalizeTokens(tokens, {
      targetPattern: pattern,
      preserveMetadata: false,
    });

    expect(result.tokens[0].metadata).toBeUndefined();
  });

  it('should apply custom transformation rules', () => {
    const tokens: GenericToken[] = [
      { name: 'OldName/Blue/500', value: '#0080ff', type: 'color', source: 'variable' },
    ];

    const result = normalizeTokens(tokens, {
      targetPattern: pattern,
      customRules: { 'OldName/Blue/500': 'primary/blue/500' },
    });

    expect(result.tokens[0].normalizedName).toBe('primary/blue/500');
    expect(result.warnings).toContain('Applied custom rule: OldName/Blue/500 -> primary/blue/500');
  });

  it('should generate warnings for invalid paths', () => {
    const tokens: GenericToken[] = [
      { name: '', value: '#0080ff', type: 'color', source: 'variable' },
    ];

    const result = normalizeTokens(tokens, { targetPattern: pattern });

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should build hierarchical structure', () => {
    const tokens: GenericToken[] = [
      { name: 'primary/blue/500', value: '#0080ff', type: 'color', source: 'variable' },
      { name: 'primary/blue/600', value: '#0066cc', type: 'color', source: 'variable' },
    ];

    const result = normalizeTokens(tokens, { targetPattern: pattern });

    expect(result.hierarchy.primary).toBeDefined();
    expect(result.hierarchy.primary.children?.blue).toBeDefined();
    expect(result.hierarchy.primary.children?.blue.children?.['500']).toBeDefined();
    expect(result.hierarchy.primary.children?.blue.children?.['600']).toBeDefined();
  });

  it('should handle empty token list', () => {
    const result = normalizeTokens([], { targetPattern: pattern });

    expect(result.tokens).toHaveLength(0);
    expect(result.hierarchy).toEqual({});
    expect(result.warnings).toHaveLength(0);
  });

  it('should extract correct path segments', () => {
    const tokens: GenericToken[] = [
      { name: 'primary/blue/500', value: '#0080ff', type: 'color', source: 'variable' },
    ];

    const result = normalizeTokens(tokens, { targetPattern: pattern });

    expect(result.tokens[0].path).toEqual(['primary', 'blue', '500']);
  });
});

describe('buildHierarchy', () => {
  it('should build a nested hierarchy from flat tokens', () => {
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
        originalName: 'primary/blue/600',
        normalizedName: 'primary/blue/600',
        path: ['primary', 'blue', '600'],
        value: '#0066cc',
        type: 'color',
        source: 'variable',
      },
    ];

    const hierarchy = buildHierarchy(tokens);

    expect(hierarchy.primary).toBeDefined();
    expect(hierarchy.primary.children?.blue).toBeDefined();
    expect(hierarchy.primary.children?.blue.children?.['500']).toBeDefined();
    expect(hierarchy.primary.children?.blue.children?.['500'].value).toBe('#0080ff');
    expect(hierarchy.primary.children?.blue.children?.['600'].value).toBe('#0066cc');
  });

  it('should preserve token metadata in hierarchy', () => {
    const tokens: NormalizedToken[] = [
      {
        originalName: 'primary/blue/500',
        normalizedName: 'primary/blue/500',
        path: ['primary', 'blue', '500'],
        value: '#0080ff',
        type: 'color',
        source: 'variable',
        metadata: { variableId: 'var-123' },
      },
    ];

    const hierarchy = buildHierarchy(tokens);

    expect(hierarchy.primary.children?.blue.children?.['500'].metadata).toEqual({
      variableId: 'var-123',
    });
  });

  it('should handle single-level tokens', () => {
    const tokens: NormalizedToken[] = [
      {
        originalName: 'primary',
        normalizedName: 'primary',
        path: ['primary'],
        value: '#0080ff',
        type: 'color',
        source: 'variable',
      },
    ];

    const hierarchy = buildHierarchy(tokens);

    expect(hierarchy.primary).toBeDefined();
    expect(hierarchy.primary.value).toBe('#0080ff');
  });

  it('should handle deep nesting', () => {
    const tokens: NormalizedToken[] = [
      {
        originalName: 'a/b/c/d/e',
        normalizedName: 'a/b/c/d/e',
        path: ['a', 'b', 'c', 'd', 'e'],
        value: '#0080ff',
        type: 'color',
        source: 'variable',
      },
    ];

    const hierarchy = buildHierarchy(tokens);

    expect(hierarchy.a?.children?.b?.children?.c?.children?.d?.children?.e?.value).toBe('#0080ff');
  });

  it('should handle empty token list', () => {
    const hierarchy = buildHierarchy([]);
    expect(hierarchy).toEqual({});
  });
});

describe('flattenHierarchy', () => {
  it('should flatten a hierarchy back to tokens', () => {
    const hierarchy = {
      primary: {
        children: {
          blue: {
            children: {
              '500': {
                value: '#0080ff',
                type: 'color',
                source: 'variable' as const,
                originalName: 'primary/blue/500',
              },
              '600': {
                value: '#0066cc',
                type: 'color',
                source: 'variable' as const,
                originalName: 'primary/blue/600',
              },
            },
          },
        },
      },
    };

    const tokens = flattenHierarchy(hierarchy);

    expect(tokens).toHaveLength(2);
    expect(tokens[0].normalizedName).toBe('primary/blue/500');
    expect(tokens[0].value).toBe('#0080ff');
    expect(tokens[1].normalizedName).toBe('primary/blue/600');
    expect(tokens[1].value).toBe('#0066cc');
  });

  it('should use custom separator when flattening', () => {
    const hierarchy = {
      primary: {
        children: {
          blue: {
            children: {
              '500': {
                value: '#0080ff',
                type: 'color',
                source: 'variable' as const,
                originalName: 'primary-blue-500',
              },
            },
          },
        },
      },
    };

    const tokens = flattenHierarchy(hierarchy, '-');

    expect(tokens[0].normalizedName).toBe('primary-blue-500');
  });

  it('should preserve metadata when flattening', () => {
    const hierarchy = {
      primary: {
        children: {
          blue: {
            children: {
              '500': {
                value: '#0080ff',
                type: 'color',
                source: 'variable' as const,
                originalName: 'primary/blue/500',
                metadata: { variableId: 'var-123' },
              },
            },
          },
        },
      },
    };

    const tokens = flattenHierarchy(hierarchy);

    expect(tokens[0].metadata).toEqual({ variableId: 'var-123' });
  });

  it('should handle empty hierarchy', () => {
    const tokens = flattenHierarchy({});
    expect(tokens).toHaveLength(0);
  });

  it('should handle single-level hierarchy', () => {
    const hierarchy = {
      primary: {
        value: '#0080ff',
        type: 'color',
        source: 'variable' as const,
        originalName: 'primary',
      },
    };

    const tokens = flattenHierarchy(hierarchy);

    expect(tokens).toHaveLength(1);
    expect(tokens[0].normalizedName).toBe('primary');
    expect(tokens[0].value).toBe('#0080ff');
  });
});

describe('transformTokenStructure', () => {
  it('should transform token name to path segments', () => {
    const pattern: DetectedPattern = {
      separator: '/',
      case: 'kebab',
      depth: 3,
      type: 'mixed',
      confidence: 1.0,
      sampleCount: 1,
      examples: [],
    };

    const path = transformTokenStructure('Primary-Blue-500', pattern);

    expect(path).toEqual(['primary', 'blue', '500']);
  });

  it('should handle various input formats', () => {
    const pattern: DetectedPattern = {
      separator: '/',
      case: 'kebab',
      depth: 3,
      type: 'mixed',
      confidence: 1.0,
      sampleCount: 1,
      examples: [],
    };

    expect(transformTokenStructure('primary/blue/500', pattern)).toEqual(['primary', 'blue', '500']);
    expect(transformTokenStructure('primary-blue-500', pattern)).toEqual(['primary', 'blue', '500']);
    expect(transformTokenStructure('PrimaryBlue500', pattern)).toEqual(['primary', 'blue', '500']);
  });

  it('should normalize to target pattern structure', () => {
    const pattern: DetectedPattern = {
      separator: '-',
      case: 'kebab',
      depth: 2,
      type: 'mixed',
      confidence: 1.0,
      sampleCount: 1,
      examples: [],
    };

    const path = transformTokenStructure('primary/blue', pattern);

    expect(path).toEqual(['primary', 'blue']);
  });
});

describe('Edge Cases', () => {
  const pattern: DetectedPattern = {
    separator: '/',
    case: 'kebab',
    depth: 3,
    type: 'mixed',
    confidence: 1.0,
    sampleCount: 1,
    examples: [],
  };

  it('should handle tokens with special characters', () => {
    const tokens: GenericToken[] = [
      { name: 'primary/blue-500', value: '#0080ff', type: 'color', source: 'variable' },
    ];

    const result = normalizeTokens(tokens, { targetPattern: pattern });

    expect(result.tokens[0].normalizedName).toBe('primary/blue-500');
  });

  it('should handle tokens with numbers', () => {
    const tokens: GenericToken[] = [
      { name: 'primary/500', value: '#0080ff', type: 'color', source: 'variable' },
    ];

    const result = normalizeTokens(tokens, { targetPattern: pattern });

    expect(result.tokens[0].normalizedName).toBe('primary/500');
    expect(result.tokens[0].path).toEqual(['primary', '500']);
  });

  it('should handle mixed case inputs', () => {
    const tokens: GenericToken[] = [
      { name: 'PRIMARY/Blue/500', value: '#0080ff', type: 'color', source: 'variable' },
    ];

    const result = normalizeTokens(tokens, { targetPattern: pattern });

    expect(result.tokens[0].normalizedName).toBe('primary/blue/500');
  });

  it('should skip validation when disabled', () => {
    const tokens: GenericToken[] = [
      { name: '', value: '#0080ff', type: 'color', source: 'variable' },
    ];

    const result = normalizeTokens(tokens, { targetPattern: pattern, validate: false });

    // Should not filter out invalid tokens when validation is disabled
    expect(result.warnings.length).toBe(0);
  });

  it('should handle very long token names', () => {
    const tokens: GenericToken[] = [
      {
        name: 'a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p',
        value: '#0080ff',
        type: 'color',
        source: 'variable',
      },
    ];

    const result = normalizeTokens(tokens, { targetPattern: pattern });

    expect(result.tokens[0].path).toHaveLength(16);
  });
});
