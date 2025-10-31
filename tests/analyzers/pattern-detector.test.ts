/**
 * Tests for Pattern Detector
 */

import { describe, it, expect } from 'vitest';
import {
  detectPatterns,
  detectSeparator,
  detectCaseStyle,
  calculateDepth,
  detectNameType,
  normalizeVariableName,
  type DetectedPattern,
} from '@/core/analyzers/pattern-detector';

describe('Pattern Detector', () => {
  describe('detectSeparator', () => {
    it('should detect slash separator', () => {
      expect(detectSeparator('primary/blue/500')).toBe('/');
    });

    it('should detect dash separator', () => {
      expect(detectSeparator('primary-blue-500')).toBe('-');
    });

    it('should detect underscore separator', () => {
      expect(detectSeparator('primary_blue_500')).toBe('_');
    });

    it('should detect dot separator', () => {
      expect(detectSeparator('primary.blue.500')).toBe('.');
    });

    it('should return "none" for no separator (camelCase)', () => {
      expect(detectSeparator('primaryBlue500')).toBe('none');
    });

    it('should prioritize slash over dash', () => {
      expect(detectSeparator('primary/blue-500')).toBe('/');
    });
  });

  describe('detectCaseStyle', () => {
    it('should detect kebab-case', () => {
      expect(detectCaseStyle('primary-blue-500', '-')).toBe('kebab');
    });

    it('should detect snake_case', () => {
      expect(detectCaseStyle('primary_blue_500', '_')).toBe('snake');
    });

    it('should detect PascalCase with separator', () => {
      expect(detectCaseStyle('Primary/Blue/500', '/')).toBe('pascal');
    });

    it('should detect camelCase without separator', () => {
      expect(detectCaseStyle('primaryBlue500', 'none')).toBe('camel');
    });

    it('should detect PascalCase without separator', () => {
      expect(detectCaseStyle('PrimaryBlue500', 'none')).toBe('pascal');
    });

    it('should return "none" for all lowercase with separator', () => {
      expect(detectCaseStyle('primary/blue/500', '/')).toBe('none');
    });

    it('should return "none" for single word', () => {
      expect(detectCaseStyle('primary', 'none')).toBe('none');
    });
  });

  describe('calculateDepth', () => {
    it('should calculate depth with slash separator', () => {
      expect(calculateDepth('primary/blue/500', '/')).toBe(3);
    });

    it('should calculate depth with dash separator', () => {
      expect(calculateDepth('primary-blue-500', '-')).toBe(3);
    });

    it('should calculate depth for single segment', () => {
      expect(calculateDepth('primary', '-')).toBe(1);
    });

    it('should calculate depth for camelCase', () => {
      expect(calculateDepth('primaryBlue', 'none')).toBe(2);
    });

    it('should calculate depth for PascalCase', () => {
      expect(calculateDepth('PrimaryBlueShade', 'none')).toBe(4);
    });

    it('should return 1 for flat name without separator', () => {
      expect(calculateDepth('primary', 'none')).toBe(1);
    });

    it('should handle empty segments', () => {
      expect(calculateDepth('primary//blue', '/')).toBe(2);
    });
  });

  describe('detectNameType', () => {
    it('should detect semantic naming', () => {
      expect(detectNameType('primary/brand/accent', '/')).toBe('semantic');
    });

    it('should detect literal naming', () => {
      expect(detectNameType('blue/500', '/')).toBe('literal');
    });

    it('should detect mixed naming', () => {
      expect(detectNameType('primary/blue/500', '/')).toBe('mixed');
    });

    it('should detect semantic keywords', () => {
      expect(detectNameType('text-primary', '-')).toBe('semantic');
      expect(detectNameType('background-surface', '-')).toBe('semantic');
      expect(detectNameType('border-warning', '-')).toBe('semantic');
    });

    it('should detect literal color names', () => {
      expect(detectNameType('red-500', '-')).toBe('literal');
      expect(detectNameType('blue-600', '-')).toBe('literal');
      expect(detectNameType('gray-100', '-')).toBe('literal');
    });

    it('should detect pure numbers as literal', () => {
      expect(detectNameType('500', 'none')).toBe('literal');
    });

    it('should handle camelCase names', () => {
      expect(detectNameType('primaryBlue', 'none')).toBe('semantic');
    });

    it('should default to semantic for unclear patterns', () => {
      expect(detectNameType('foo-bar', '-')).toBe('semantic');
    });
  });

  describe('detectPatterns', () => {
    it('should detect pattern from homogeneous slash-separated names', () => {
      const names = [
        'primary/blue/500',
        'primary/blue/600',
        'secondary/red/400',
        'secondary/red/500',
      ];
      const result = detectPatterns(names);

      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0]?.separator).toBe('/');
      expect(result.patterns[0]?.depth).toBe(3);
      expect(result.patterns[0]?.confidence).toBe(1.0);
      expect(result.patterns[0]?.type).toBe('mixed');
      expect(result.recommendedPattern).toBeDefined();
    });

    it('should detect pattern from kebab-case names', () => {
      const names = ['color-primary-500', 'color-secondary-600', 'color-accent-700'];
      const result = detectPatterns(names);

      expect(result.patterns[0]?.separator).toBe('-');
      expect(result.patterns[0]?.case).toBe('kebab');
      expect(result.patterns[0]?.confidence).toBe(1.0);
    });

    it('should detect pattern from snake_case names', () => {
      const names = ['color_primary_500', 'color_secondary_600', 'color_accent_700'];
      const result = detectPatterns(names);

      expect(result.patterns[0]?.separator).toBe('_');
      expect(result.patterns[0]?.case).toBe('snake');
    });

    it('should detect pattern from dot-separated names', () => {
      const names = ['color.primary.500', 'color.secondary.600', 'color.accent.700'];
      const result = detectPatterns(names);

      expect(result.patterns[0]?.separator).toBe('.');
      expect(result.patterns[0]?.depth).toBe(3);
    });

    it('should detect pattern from camelCase names', () => {
      const names = ['colorPrimary500', 'colorSecondary600', 'colorAccent700'];
      const result = detectPatterns(names);

      expect(result.patterns[0]?.separator).toBe('none');
      expect(result.patterns[0]?.case).toBe('camel');
    });

    it('should detect pattern from PascalCase names', () => {
      const names = ['ColorPrimary500', 'ColorSecondary600', 'ColorAccent700'];
      const result = detectPatterns(names);

      expect(result.patterns[0]?.separator).toBe('none');
      expect(result.patterns[0]?.case).toBe('pascal');
    });

    it('should handle mixed patterns', () => {
      const names = ['primary/blue/500', 'primary/blue/600', 'color-red-400', 'color-red-500'];
      const result = detectPatterns(names);

      expect(result.patterns).toHaveLength(2);
      expect(result.patterns[0]?.confidence).toBe(0.5);
      expect(result.patterns[1]?.confidence).toBe(0.5);
    });

    it('should sort patterns by confidence', () => {
      const names = ['primary/blue/500', 'primary/blue/600', 'primary/blue/700', 'color-red-400'];
      const result = detectPatterns(names);

      expect(result.patterns[0]?.confidence).toBeGreaterThan(result.patterns[1]?.confidence || 0);
    });

    it('should provide examples', () => {
      const names = ['primary/blue/500', 'primary/blue/600', 'secondary/red/400'];
      const result = detectPatterns(names);

      expect(result.patterns[0]?.examples).toHaveLength(3);
      expect(result.patterns[0]?.examples[0]).toBe('primary/blue/500');
    });

    it('should handle empty input', () => {
      const result = detectPatterns([]);

      expect(result.patterns).toHaveLength(0);
      expect(result.totalVariables).toBe(0);
      expect(result.recommendedPattern).toBeUndefined();
    });

    it('should handle single variable', () => {
      const names = ['primary/blue/500'];
      const result = detectPatterns(names);

      expect(result.patterns).toHaveLength(1);
      expect(result.totalVariables).toBe(1);
      expect(result.recommendedPattern).toBeDefined();
    });

    it('should detect semantic type', () => {
      const names = ['primary-brand', 'secondary-accent', 'tertiary-surface'];
      const result = detectPatterns(names);

      expect(result.patterns[0]?.type).toBe('semantic');
    });

    it('should detect literal type', () => {
      const names = ['blue-500', 'red-600', 'green-700'];
      const result = detectPatterns(names);

      expect(result.patterns[0]?.type).toBe('literal');
    });

    it('should calculate average depth correctly', () => {
      const names = ['a/b', 'a/b/c', 'a/b/c/d'];
      const result = detectPatterns(names);

      expect(result.patterns[0]?.depth).toBe(3); // Average of 2, 3, 4
    });
  });

  describe('normalizeVariableName', () => {
    const slashKebabPattern: DetectedPattern = {
      separator: '/',
      case: 'kebab',
      depth: 3,
      type: 'mixed',
      confidence: 1.0,
      sampleCount: 10,
      examples: [],
    };

    const dashKebabPattern: DetectedPattern = {
      separator: '-',
      case: 'kebab',
      depth: 3,
      type: 'mixed',
      confidence: 1.0,
      sampleCount: 10,
      examples: [],
    };

    const camelPattern: DetectedPattern = {
      separator: 'none',
      case: 'camel',
      depth: 2,
      type: 'mixed',
      confidence: 1.0,
      sampleCount: 10,
      examples: [],
    };

    it('should normalize to lowercase with slash separator', () => {
      expect(normalizeVariableName('Primary/Blue/500', slashKebabPattern)).toBe('primary/blue/500');
    });

    it('should convert dash to slash separator', () => {
      expect(normalizeVariableName('primary-blue-500', slashKebabPattern)).toBe('primary/blue/500');
    });

    it('should convert slash to dash separator', () => {
      expect(normalizeVariableName('primary/blue/500', dashKebabPattern)).toBe('primary-blue-500');
    });

    it('should convert camelCase to kebab-case', () => {
      expect(normalizeVariableName('primaryBlue500', dashKebabPattern)).toBe('primary-blue500');
    });

    it('should convert PascalCase to kebab-case', () => {
      expect(normalizeVariableName('PrimaryBlue500', dashKebabPattern)).toBe('primary-blue500');
    });

    it('should convert slash-separated to camelCase', () => {
      expect(normalizeVariableName('primary/blue/500', camelPattern)).toBe('primaryBlue500');
    });

    it('should handle already normalized names', () => {
      expect(normalizeVariableName('primary/blue/500', slashKebabPattern)).toBe('primary/blue/500');
    });

    it('should handle snake_case conversion', () => {
      const snakePattern: DetectedPattern = {
        separator: '_',
        case: 'snake',
        depth: 3,
        type: 'mixed',
        confidence: 1.0,
        sampleCount: 10,
        examples: [],
      };
      expect(normalizeVariableName('primary-blue-500', snakePattern)).toBe('primary_blue_500');
    });

    it('should handle pascal case conversion with separator', () => {
      const pascalPattern: DetectedPattern = {
        separator: '/',
        case: 'pascal',
        depth: 3,
        type: 'mixed',
        confidence: 1.0,
        sampleCount: 10,
        examples: [],
      };
      expect(normalizeVariableName('primary/blue/500', pascalPattern)).toBe('Primary/Blue/500');
    });
  });

  describe('edge cases', () => {
    it('should handle names with numbers', () => {
      const names = ['color-blue-500', 'color-blue-600', 'color-red-700'];
      const result = detectPatterns(names);

      expect(result.patterns[0]?.separator).toBe('-');
      expect(result.patterns[0]?.case).toBe('kebab');
    });

    it('should handle very deep hierarchies', () => {
      const names = ['a/b/c/d/e/f', 'a/b/c/d/e/g', 'a/b/c/d/e/h'];
      const result = detectPatterns(names);

      expect(result.patterns[0]?.depth).toBe(6);
    });

    it('should handle flat single-word names', () => {
      const names = ['primary', 'secondary', 'tertiary'];
      const result = detectPatterns(names);

      expect(result.patterns[0]?.depth).toBe(1);
    });

    it('should handle names with mixed capitalization', () => {
      const names = ['Primary/blue/500', 'SECONDARY/RED/600', 'Tertiary/Green/700'];
      const result = detectPatterns(names);

      expect(result.patterns).toBeDefined();
      expect(result.recommendedPattern).toBeDefined();
    });

    it('should handle empty string segments', () => {
      expect(detectSeparator('')).toBe('none');
      expect(detectCaseStyle('', 'none')).toBe('none');
      expect(calculateDepth('', '/')).toBe(0);
    });
  });
});
