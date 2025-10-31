/**
 * Tests for URL parser utility
 */

import { describe, it, expect } from 'vitest';
import { parseFigmaUrl, isValidFileKey, extractFileKey } from '../../src/utils/url-parser';
import { FigmaInvalidUrlError } from '../../src/core/extractors/errors';

describe('URL Parser', () => {
  describe('parseFigmaUrl', () => {
    it('should parse file URLs', () => {
      const result = parseFigmaUrl('https://www.figma.com/file/abc123XYZ/My-Design');
      expect(result.fileKey).toBe('abc123XYZ');
      expect(result.nodeId).toBeUndefined();
    });

    it('should parse design URLs', () => {
      const result = parseFigmaUrl('https://www.figma.com/design/xyz789/Test-File');
      expect(result.fileKey).toBe('xyz789');
      expect(result.nodeId).toBeUndefined();
    });

    it('should parse URLs with node IDs', () => {
      const result = parseFigmaUrl('https://www.figma.com/file/abc123/test?node-id=123:456');
      expect(result.fileKey).toBe('abc123');
      expect(result.nodeId).toBe('123:456');
    });

    it('should handle URLs without protocol', () => {
      const result = parseFigmaUrl('figma.com/file/abc123/test');
      expect(result.fileKey).toBe('abc123');
    });

    it('should handle URLs with www', () => {
      const result = parseFigmaUrl('www.figma.com/file/abc123/test');
      expect(result.fileKey).toBe('abc123');
    });

    it('should handle URLs with trailing slashes', () => {
      const result = parseFigmaUrl('https://www.figma.com/file/abc123/test/');
      expect(result.fileKey).toBe('abc123');
    });

    it('should handle URLs with extra whitespace', () => {
      const result = parseFigmaUrl('  https://www.figma.com/file/abc123/test  ');
      expect(result.fileKey).toBe('abc123');
    });

    it('should throw on invalid URL format', () => {
      expect(() => parseFigmaUrl('not a url')).toThrow(FigmaInvalidUrlError);
      expect(() => parseFigmaUrl('https://')).toThrow(FigmaInvalidUrlError);
    });

    it('should throw on non-Figma URLs', () => {
      expect(() => parseFigmaUrl('https://www.example.com')).toThrow(FigmaInvalidUrlError);
      expect(() => parseFigmaUrl('https://www.google.com/file/abc123')).toThrow(
        FigmaInvalidUrlError
      );
    });

    it('should throw on invalid Figma URL paths', () => {
      expect(() => parseFigmaUrl('https://www.figma.com/')).toThrow(FigmaInvalidUrlError);
      expect(() => parseFigmaUrl('https://www.figma.com/invalid/abc123')).toThrow(
        FigmaInvalidUrlError
      );
      expect(() => parseFigmaUrl('https://www.figma.com/file/')).toThrow(FigmaInvalidUrlError);
    });

    it('should handle complex query parameters', () => {
      const result = parseFigmaUrl(
        'https://www.figma.com/file/abc123/test?node-id=1:2&mode=design&t=xyz'
      );
      expect(result.fileKey).toBe('abc123');
      expect(result.nodeId).toBe('1:2');
    });

    it('should handle URLs with fragments', () => {
      const result = parseFigmaUrl('https://www.figma.com/file/abc123/test#section');
      expect(result.fileKey).toBe('abc123');
    });
  });

  describe('isValidFileKey', () => {
    it('should validate alphanumeric file keys', () => {
      expect(isValidFileKey('abc123')).toBe(true);
      expect(isValidFileKey('ABC123xyz')).toBe(true);
      expect(isValidFileKey('123456')).toBe(true);
      expect(isValidFileKey('abcdef')).toBe(true);
    });

    it('should reject invalid file keys', () => {
      expect(isValidFileKey('abc-123')).toBe(false);
      expect(isValidFileKey('abc_123')).toBe(false);
      expect(isValidFileKey('abc 123')).toBe(false);
      expect(isValidFileKey('abc.123')).toBe(false);
      expect(isValidFileKey('abc/123')).toBe(false);
      expect(isValidFileKey('')).toBe(false);
    });

    it('should reject special characters', () => {
      expect(isValidFileKey('abc@123')).toBe(false);
      expect(isValidFileKey('abc#123')).toBe(false);
      expect(isValidFileKey('abc$123')).toBe(false);
      expect(isValidFileKey('abc%123')).toBe(false);
    });
  });

  describe('extractFileKey', () => {
    it('should extract file key from valid URLs', () => {
      expect(extractFileKey('https://www.figma.com/file/abc123/test')).toBe('abc123');
      expect(extractFileKey('https://www.figma.com/design/xyz789/test')).toBe('xyz789');
    });

    it('should return null for invalid URLs', () => {
      expect(extractFileKey('not a url')).toBeNull();
      expect(extractFileKey('https://www.example.com')).toBeNull();
      expect(extractFileKey('https://www.figma.com/invalid')).toBeNull();
    });

    it('should handle edge cases', () => {
      expect(extractFileKey('')).toBeNull();
      expect(extractFileKey('   ')).toBeNull();
    });
  });
});
