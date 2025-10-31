/**
 * Tests for Pattern Detector Utility
 */

import { describe, it, expect } from 'vitest';
import {
  detectNamingPattern,
  normalizeToKebabCase,
  normalizeToCamelCase,
  normalizeToSnakeCase,
  normalizeToDotCase,
  normalizeToPattern,
} from '@/utils/pattern-detector';

describe('Pattern Detector', () => {
  // ============================================================================
  // Pattern Detection Tests
  // ============================================================================

  describe('detectNamingPattern', () => {
    it('should detect kebab-case pattern', () => {
      const names = ['primary-color', 'secondary-color', 'text-heading'];
      const result = detectNamingPattern(names);

      expect(result.pattern).toBe('kebab-case');
      expect(result.confidence).toBe(1);
    });

    it('should detect camelCase pattern', () => {
      const names = ['primaryColor', 'secondaryColor', 'textHeading'];
      const result = detectNamingPattern(names);

      expect(result.pattern).toBe('camelCase');
      expect(result.confidence).toBe(1);
    });

    it('should detect PascalCase pattern', () => {
      const names = ['PrimaryColor', 'SecondaryColor', 'TextHeading'];
      const result = detectNamingPattern(names);

      expect(result.pattern).toBe('PascalCase');
      expect(result.confidence).toBe(1);
    });

    it('should detect snake_case pattern', () => {
      const names = ['primary_color', 'secondary_color', 'text_heading'];
      const result = detectNamingPattern(names);

      expect(result.pattern).toBe('snake_case');
      expect(result.confidence).toBe(1);
    });

    it('should detect SCREAMING_SNAKE_CASE pattern', () => {
      const names = ['PRIMARY_COLOR', 'SECONDARY_COLOR', 'TEXT_HEADING'];
      const result = detectNamingPattern(names);

      expect(result.pattern).toBe('SCREAMING_SNAKE_CASE');
      expect(result.confidence).toBe(1);
    });

    it('should detect slash/case pattern', () => {
      const names = ['colors/primary', 'colors/secondary', 'typography/heading'];
      const result = detectNamingPattern(names);

      expect(result.pattern).toBe('slash/case');
      expect(result.confidence).toBe(1);
    });

    it('should detect dot.case pattern', () => {
      const names = ['colors.primary', 'colors.secondary', 'typography.heading'];
      const result = detectNamingPattern(names);

      expect(result.pattern).toBe('dot.case');
      expect(result.confidence).toBe(1);
    });

    it('should detect mixed patterns', () => {
      const names = ['primary-color', 'SecondaryColor', 'text_heading'];
      const result = detectNamingPattern(names);

      // Should detect the most common pattern or mixed
      expect(result.confidence).toBeLessThan(1);
    });

    it('should handle empty array', () => {
      const result = detectNamingPattern([]);

      expect(result.pattern).toBe('kebab-case'); // Default
      expect(result.confidence).toBe(0);
      expect(result.samples).toEqual([]);
    });

    it('should return samples of detected pattern', () => {
      const names = ['primary-color', 'secondary-color', 'tertiary-color', 'text-heading'];
      const result = detectNamingPattern(names);

      expect(result.samples).toHaveLength(3); // Max 3 samples
      expect(result.samples.every((s) => s.includes('-'))).toBe(true);
    });
  });

  // ============================================================================
  // Kebab-case Normalization Tests
  // ============================================================================

  describe('normalizeToKebabCase', () => {
    it('should convert camelCase to kebab-case', () => {
      expect(normalizeToKebabCase('primaryColor')).toBe('primary-color');
      expect(normalizeToKebabCase('textHeadingLarge')).toBe('text-heading-large');
    });

    it('should convert PascalCase to kebab-case', () => {
      expect(normalizeToKebabCase('PrimaryColor')).toBe('primary-color');
      expect(normalizeToKebabCase('TextHeadingLarge')).toBe('text-heading-large');
    });

    it('should convert snake_case to kebab-case', () => {
      expect(normalizeToKebabCase('primary_color')).toBe('primary-color');
      expect(normalizeToKebabCase('text_heading_large')).toBe('text-heading-large');
    });

    it('should convert slash/case to kebab-case', () => {
      expect(normalizeToKebabCase('colors/primary')).toBe('colors-primary');
      expect(normalizeToKebabCase('typography/heading/large')).toBe('typography-heading-large');
    });

    it('should convert dot.case to kebab-case', () => {
      expect(normalizeToKebabCase('colors.primary')).toBe('colors-primary');
      expect(normalizeToKebabCase('typography.heading.large')).toBe('typography-heading-large');
    });

    it('should handle spaces', () => {
      expect(normalizeToKebabCase('Primary Color')).toBe('primary-color');
      expect(normalizeToKebabCase('Text Heading Large')).toBe('text-heading-large');
    });

    it('should handle numbers', () => {
      expect(normalizeToKebabCase('color100')).toBe('color-100');
      expect(normalizeToKebabCase('heading2xl')).toBe('heading-2-xl');
    });

    it('should remove special characters', () => {
      expect(normalizeToKebabCase('primary@color!')).toBe('primary-color');
      expect(normalizeToKebabCase('text#heading$large')).toBe('text-heading-large');
    });

    it('should handle multiple consecutive separators', () => {
      expect(normalizeToKebabCase('primary--color')).toBe('primary-color');
      expect(normalizeToKebabCase('text___heading')).toBe('text-heading');
    });

    it('should trim leading and trailing separators', () => {
      expect(normalizeToKebabCase('-primary-color-')).toBe('primary-color');
      expect(normalizeToKebabCase('_text_heading_')).toBe('text-heading');
    });

    it('should handle already kebab-case', () => {
      expect(normalizeToKebabCase('primary-color')).toBe('primary-color');
    });

    it('should handle empty string', () => {
      expect(normalizeToKebabCase('')).toBe('');
    });
  });

  // ============================================================================
  // CamelCase Normalization Tests
  // ============================================================================

  describe('normalizeToCamelCase', () => {
    it('should convert kebab-case to camelCase', () => {
      expect(normalizeToCamelCase('primary-color')).toBe('primaryColor');
      expect(normalizeToCamelCase('text-heading-large')).toBe('textHeadingLarge');
    });

    it('should convert PascalCase to camelCase', () => {
      expect(normalizeToCamelCase('PrimaryColor')).toBe('primaryColor');
      expect(normalizeToCamelCase('TextHeadingLarge')).toBe('textHeadingLarge');
    });

    it('should convert snake_case to camelCase', () => {
      expect(normalizeToCamelCase('primary_color')).toBe('primaryColor');
      expect(normalizeToCamelCase('text_heading_large')).toBe('textHeadingLarge');
    });

    it('should handle spaces', () => {
      expect(normalizeToCamelCase('Primary Color')).toBe('primaryColor');
      expect(normalizeToCamelCase('Text Heading Large')).toBe('textHeadingLarge');
    });

    it('should handle already camelCase', () => {
      expect(normalizeToCamelCase('primaryColor')).toBe('primaryColor');
    });

    it('should handle empty string', () => {
      expect(normalizeToCamelCase('')).toBe('');
    });
  });

  // ============================================================================
  // Snake_case Normalization Tests
  // ============================================================================

  describe('normalizeToSnakeCase', () => {
    it('should convert kebab-case to snake_case', () => {
      expect(normalizeToSnakeCase('primary-color')).toBe('primary_color');
      expect(normalizeToSnakeCase('text-heading-large')).toBe('text_heading_large');
    });

    it('should convert camelCase to snake_case', () => {
      expect(normalizeToSnakeCase('primaryColor')).toBe('primary_color');
      expect(normalizeToSnakeCase('textHeadingLarge')).toBe('text_heading_large');
    });

    it('should handle already snake_case', () => {
      expect(normalizeToSnakeCase('primary_color')).toBe('primary_color');
    });
  });

  // ============================================================================
  // Dot.case Normalization Tests
  // ============================================================================

  describe('normalizeToDotCase', () => {
    it('should convert kebab-case to dot.case', () => {
      expect(normalizeToDotCase('primary-color')).toBe('primary.color');
      expect(normalizeToDotCase('text-heading-large')).toBe('text.heading.large');
    });

    it('should convert camelCase to dot.case', () => {
      expect(normalizeToDotCase('primaryColor')).toBe('primary.color');
      expect(normalizeToDotCase('textHeadingLarge')).toBe('text.heading.large');
    });

    it('should handle already dot.case', () => {
      expect(normalizeToDotCase('primary.color')).toBe('primary.color');
    });
  });

  // ============================================================================
  // Pattern-based Normalization Tests
  // ============================================================================

  describe('normalizeToPattern', () => {
    const testName = 'Primary Color';

    it('should normalize to kebab-case', () => {
      expect(normalizeToPattern(testName, 'kebab-case')).toBe('primary-color');
    });

    it('should normalize to camelCase', () => {
      expect(normalizeToPattern(testName, 'camelCase')).toBe('primaryColor');
    });

    it('should normalize to PascalCase', () => {
      expect(normalizeToPattern(testName, 'PascalCase')).toBe('PrimaryColor');
    });

    it('should normalize to snake_case', () => {
      expect(normalizeToPattern(testName, 'snake_case')).toBe('primary_color');
    });

    it('should normalize to SCREAMING_SNAKE_CASE', () => {
      expect(normalizeToPattern(testName, 'SCREAMING_SNAKE_CASE')).toBe('PRIMARY_COLOR');
    });

    it('should normalize to slash/case', () => {
      expect(normalizeToPattern(testName, 'slash/case')).toBe('primary/color');
    });

    it('should normalize to dot.case', () => {
      expect(normalizeToPattern(testName, 'dot.case')).toBe('primary.color');
    });

    it('should default to kebab-case for mixed pattern', () => {
      expect(normalizeToPattern(testName, 'mixed')).toBe('primary-color');
    });
  });
});
