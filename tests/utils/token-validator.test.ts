/**
 * Tests for token validator utility
 */

import { describe, it, expect } from 'vitest';
import {
  isValidTokenStructure,
  hasRequiredTokenTypes,
  getAvailableTokenTypes,
  isColorValue,
  isTypographyToken,
  countTokens,
  sanitizeTokens,
} from '../../src/utils/token-validator';

describe('Token Validator', () => {
  describe('isValidTokenStructure', () => {
    it('should validate valid token structures', () => {
      expect(isValidTokenStructure({ colors: {} })).toBe(true);
      expect(isValidTokenStructure({ colors: { primary: '#000' } })).toBe(true);
      expect(isValidTokenStructure({ typography: {}, colors: {} })).toBe(true);
    });

    it('should reject invalid structures', () => {
      expect(isValidTokenStructure(null)).toBe(false);
      expect(isValidTokenStructure(undefined)).toBe(false);
      expect(isValidTokenStructure([])).toBe(false);
      expect(isValidTokenStructure({})).toBe(false);
      expect(isValidTokenStructure('string')).toBe(false);
      expect(isValidTokenStructure(123)).toBe(false);
    });
  });

  describe('hasRequiredTokenTypes', () => {
    it('should check for required token types', () => {
      const tokens = {
        colors: { primary: '#000' },
        typography: { heading: {} },
      };

      expect(hasRequiredTokenTypes(tokens, ['colors'])).toBe(true);
      expect(hasRequiredTokenTypes(tokens, ['typography'])).toBe(true);
      expect(hasRequiredTokenTypes(tokens, ['colors', 'typography'])).toBe(true);
    });

    it('should return false for missing types', () => {
      const tokens = { colors: { primary: '#000' } };

      expect(hasRequiredTokenTypes(tokens, ['typography'])).toBe(false);
      expect(hasRequiredTokenTypes(tokens, ['colors', 'typography'])).toBe(false);
    });

    it('should handle empty requirements', () => {
      const tokens = { colors: { primary: '#000' } };
      expect(hasRequiredTokenTypes(tokens, [])).toBe(true);
    });
  });

  describe('getAvailableTokenTypes', () => {
    it('should extract available token types', () => {
      const tokens = {
        colors: { primary: '#000' },
        typography: { heading: {} },
        spacing: { sm: '8px' },
      };

      const types = getAvailableTokenTypes(tokens);
      expect(types).toContain('colors');
      expect(types).toContain('typography');
      expect(types).toContain('spacing');
      expect(types).toHaveLength(3);
    });

    it('should return empty array for empty tokens', () => {
      expect(getAvailableTokenTypes({})).toEqual([]);
    });

    it('should filter out non-object values', () => {
      const tokens = {
        colors: { primary: '#000' },
        version: '1.0.0', // string value
        count: 123, // number value
      };

      const types = getAvailableTokenTypes(tokens);
      expect(types).toContain('colors');
      expect(types).not.toContain('version');
      expect(types).not.toContain('count');
    });
  });

  describe('isColorValue', () => {
    it('should validate hex colors', () => {
      expect(isColorValue('#000')).toBe(true);
      expect(isColorValue('#000000')).toBe(true);
      expect(isColorValue('#00000080')).toBe(true);
      expect(isColorValue('#ABC')).toBe(true);
      expect(isColorValue('#abc123')).toBe(true);
    });

    it('should validate RGB colors', () => {
      expect(isColorValue('rgb(0, 0, 0)')).toBe(true);
      expect(isColorValue('RGB(255, 255, 255)')).toBe(true);
    });

    it('should validate RGBA colors', () => {
      expect(isColorValue('rgba(0, 0, 0, 0.5)')).toBe(true);
      expect(isColorValue('RGBA(255, 255, 255, 1)')).toBe(true);
    });

    it('should validate HSL colors', () => {
      expect(isColorValue('hsl(0, 0%, 0%)')).toBe(true);
      expect(isColorValue('HSL(360, 100%, 50%)')).toBe(true);
    });

    it('should validate HSLA colors', () => {
      expect(isColorValue('hsla(0, 0%, 0%, 0.5)')).toBe(true);
      expect(isColorValue('HSLA(360, 100%, 50%, 1)')).toBe(true);
    });

    it('should reject invalid color values', () => {
      expect(isColorValue('not-a-color')).toBe(false);
      expect(isColorValue('123')).toBe(false);
      expect(isColorValue('')).toBe(false);
      expect(isColorValue('#')).toBe(false);
      expect(isColorValue('#gg0000')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(isColorValue(null)).toBe(false);
      expect(isColorValue(undefined)).toBe(false);
      expect(isColorValue(123)).toBe(false);
      expect(isColorValue({})).toBe(false);
    });
  });

  describe('isTypographyToken', () => {
    it('should validate typography tokens', () => {
      expect(isTypographyToken({ fontSize: '16px' })).toBe(true);
      expect(isTypographyToken({ fontFamily: 'Arial' })).toBe(true);
      expect(isTypographyToken({ fontWeight: 700 })).toBe(true);
      expect(isTypographyToken({ lineHeight: 1.5 })).toBe(true);
      expect(isTypographyToken({ letterSpacing: '0.05em' })).toBe(true);
    });

    it('should validate combined typography properties', () => {
      expect(
        isTypographyToken({
          fontSize: '16px',
          fontFamily: 'Arial',
          fontWeight: 700,
        })
      ).toBe(true);
    });

    it('should reject non-typography objects', () => {
      expect(isTypographyToken({ color: '#000' })).toBe(false);
      expect(isTypographyToken({ spacing: '8px' })).toBe(false);
      expect(isTypographyToken({})).toBe(false);
    });

    it('should reject non-objects', () => {
      expect(isTypographyToken(null)).toBe(false);
      expect(isTypographyToken(undefined)).toBe(false);
      expect(isTypographyToken('16px')).toBe(false);
      expect(isTypographyToken(16)).toBe(false);
    });
  });

  describe('countTokens', () => {
    it('should count flat tokens', () => {
      const tokens = {
        primary: '#000',
        secondary: '#fff',
        tertiary: '#888',
      };

      expect(countTokens(tokens)).toBe(3);
    });

    it('should count nested tokens', () => {
      const tokens = {
        colors: {
          primary: '#000',
          secondary: '#fff',
        },
        spacing: {
          sm: '8px',
          md: '16px',
          lg: '24px',
        },
      };

      expect(countTokens(tokens)).toBe(5);
    });

    it('should count deeply nested tokens', () => {
      const tokens = {
        colors: {
          brand: {
            primary: {
              light: '#000',
              dark: '#fff',
            },
            secondary: {
              light: '#888',
              dark: '#999',
            },
          },
        },
      };

      expect(countTokens(tokens)).toBe(4);
    });

    it('should return 0 for empty objects', () => {
      expect(countTokens({})).toBe(0);
    });

    it('should handle arrays as leaf tokens', () => {
      const tokens = {
        fontFamily: ['Arial', 'sans-serif'],
        colors: {
          primary: '#000',
        },
      };

      expect(countTokens(tokens)).toBe(2);
    });
  });

  describe('sanitizeTokens', () => {
    it('should remove sensitive keys', () => {
      const tokens = {
        colors: { primary: '#000' },
        apiToken: 'secret',
        secretKey: 'hidden',
      };

      const sanitized = sanitizeTokens(tokens);
      expect(sanitized.colors).toBeDefined();
      expect(sanitized.apiToken).toBeUndefined();
      expect(sanitized.secretKey).toBeUndefined();
    });

    it('should sanitize nested objects', () => {
      const tokens = {
        colors: {
          primary: '#000',
          token: 'should-be-removed',
        },
        settings: {
          theme: 'dark',
          secretValue: 'hidden',
        },
      };

      const sanitized = sanitizeTokens(tokens);
      expect((sanitized.colors as any).primary).toBe('#000');
      expect((sanitized.colors as any).token).toBeUndefined();
      expect((sanitized.settings as any).theme).toBe('dark');
      expect((sanitized.settings as any).secretValue).toBeUndefined();
    });

    it('should preserve valid tokens', () => {
      const tokens = {
        colors: {
          primary: '#000',
          secondary: '#fff',
        },
        typography: {
          heading: { fontSize: '24px' },
        },
      };

      const sanitized = sanitizeTokens(tokens);
      expect(sanitized).toEqual(tokens);
    });

    it('should handle empty objects', () => {
      expect(sanitizeTokens({})).toEqual({});
    });
  });
});
