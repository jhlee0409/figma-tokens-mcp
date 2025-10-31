/**
 * Tests for Tailwind v3 converter
 */

import { describe, it, expect } from 'vitest';
import { convertToTailwindV3 } from '@/core/converters/tailwind-v3';
import type { NormalizedTokens } from '@/core/types/tokens';

describe('convertToTailwindV3', () => {
  describe('basic conversion', () => {
    it('should convert simple color tokens', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: '#3B82F6',
          secondary: '#10B981',
        },
      };

      const result = convertToTailwindV3(tokens, { preset: 'merge' });

      expect(result.files).toHaveLength(1);
      expect(result.files[0]?.name).toBe('tailwind.config.js');
      expect(result.files[0]?.content).toContain('module.exports');
      expect(result.files[0]?.content).toContain('extend');
      expect(result.files[0]?.content).toContain('colors');
      expect(result.files[0]?.content).toContain("primary: '#3B82F6'");
      expect(result.files[0]?.content).toContain("secondary: '#10B981'");
      expect(result.summary.version).toBe('v3');
      expect(result.summary.preset).toBe('merge');
    });

    it('should convert nested color tokens', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: {
            blue: {
              500: '#3B82F6',
              600: '#2563EB',
            },
          },
        },
      };

      const result = convertToTailwindV3(tokens, { preset: 'merge' });

      expect(result.files[0]?.content).toContain('primary: {');
      expect(result.files[0]?.content).toContain('blue: {');
      expect(result.files[0]?.content).toContain("500: '#3B82F6'");
      expect(result.files[0]?.content).toContain("600: '#2563EB'");
    });

    it('should convert fontSize tokens with simple values', () => {
      const tokens: NormalizedTokens = {
        fontSize: {
          sm: '14px',
          base: '16px',
          lg: '18px',
        },
      };

      const result = convertToTailwindV3(tokens, { preset: 'merge' });

      expect(result.files[0]?.content).toContain('fontSize: {');
      expect(result.files[0]?.content).toContain("sm: '14px'");
      expect(result.files[0]?.content).toContain("base: '16px'");
      expect(result.files[0]?.content).toContain("lg: '18px'");
    });

    it('should convert fontSize tokens with lineHeight', () => {
      const tokens: NormalizedTokens = {
        fontSize: {
          sm: {
            fontSize: '14px',
            lineHeight: '20px',
          },
        },
      };

      const result = convertToTailwindV3(tokens, { preset: 'merge' });

      expect(result.files[0]?.content).toContain('fontSize: {');
      expect(result.files[0]?.content).toContain("sm: ['14px', { lineHeight: '20px' }]");
    });

    it('should convert fontSize tokens with lineHeight and letterSpacing', () => {
      const tokens: NormalizedTokens = {
        fontSize: {
          sm: {
            fontSize: '14px',
            lineHeight: '20px',
            letterSpacing: '0.01em',
          },
        },
      };

      const result = convertToTailwindV3(tokens, { preset: 'merge' });

      expect(result.files[0]?.content).toContain('fontSize: {');
      expect(result.files[0]?.content).toContain("lineHeight: '20px'");
      expect(result.files[0]?.content).toContain("letterSpacing: '0.01em'");
    });

    it('should convert fontFamily tokens with strings', () => {
      const tokens: NormalizedTokens = {
        fontFamily: {
          sans: 'Inter, system-ui, sans-serif',
        },
      };

      const result = convertToTailwindV3(tokens, { preset: 'merge' });

      expect(result.files[0]?.content).toContain('fontFamily: {');
      expect(result.files[0]?.content).toContain("sans: ['Inter, system-ui, sans-serif']");
    });

    it('should convert fontFamily tokens with arrays', () => {
      const tokens: NormalizedTokens = {
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
        },
      };

      const result = convertToTailwindV3(tokens, { preset: 'merge' });

      expect(result.files[0]?.content).toContain('fontFamily: {');
      expect(result.files[0]?.content).toContain("sans: ['Inter', 'system-ui', 'sans-serif']");
    });

    it('should convert fontWeight tokens', () => {
      const tokens: NormalizedTokens = {
        fontWeight: {
          thin: 100,
          normal: 400,
          bold: 700,
          black: 900,
        },
      };

      const result = convertToTailwindV3(tokens, { preset: 'merge' });

      expect(result.files[0]?.content).toContain('fontWeight: {');
      expect(result.files[0]?.content).toContain('thin: 100');
      expect(result.files[0]?.content).toContain('normal: 400');
      expect(result.files[0]?.content).toContain('bold: 700');
      expect(result.files[0]?.content).toContain('black: 900');
    });
  });

  describe('preset handling', () => {
    it('should use extend for merge preset', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: '#3B82F6',
        },
      };

      const result = convertToTailwindV3(tokens, { preset: 'merge' });

      expect(result.files[0]?.content).toContain('theme: {');
      expect(result.files[0]?.content).toContain('extend: {');
      expect(result.summary.preset).toBe('merge');
    });

    it('should not use extend for replace preset', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: '#3B82F6',
        },
      };

      const result = convertToTailwindV3(tokens, { preset: 'replace' });

      expect(result.files[0]?.content).toContain('theme: {');
      expect(result.files[0]?.content).not.toContain('extend: {');
      expect(result.files[0]?.content).toContain('colors: {');
      expect(result.summary.preset).toBe('replace');
    });
  });

  describe('typescript support', () => {
    it('should generate TypeScript config when typescript option is true', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: '#3B82F6',
        },
      };

      const result = convertToTailwindV3(tokens, { typescript: true });

      expect(result.files[0]?.name).toBe('tailwind.config.ts');
      expect(result.files[0]?.language).toBe('typescript');
      expect(result.files[0]?.content).toContain("import type { Config } from 'tailwindcss'");
      expect(result.files[0]?.content).toContain('const config: Config = {');
      expect(result.files[0]?.content).toContain('export default config;');
    });

    it('should generate JavaScript config by default', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: '#3B82F6',
        },
      };

      const result = convertToTailwindV3(tokens, { typescript: false });

      expect(result.files[0]?.name).toBe('tailwind.config.js');
      expect(result.files[0]?.language).toBe('javascript');
      expect(result.files[0]?.content).toContain('module.exports = {');
      expect(result.files[0]?.content).not.toContain('import type');
    });
  });

  describe('multiple token categories', () => {
    it('should convert multiple token categories', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: '#3B82F6',
        },
        fontSize: {
          sm: '14px',
        },
        fontFamily: {
          sans: ['Inter'],
        },
        fontWeight: {
          bold: 700,
        },
      };

      const result = convertToTailwindV3(tokens, { preset: 'merge' });

      expect(result.files[0]?.content).toContain('colors: {');
      expect(result.files[0]?.content).toContain('fontSize: {');
      expect(result.files[0]?.content).toContain('fontFamily: {');
      expect(result.files[0]?.content).toContain('fontWeight: {');
    });

    it('should convert custom token categories', () => {
      const tokens: NormalizedTokens = {
        spacing: {
          sm: '8px',
          md: '16px',
        },
        borderRadius: {
          sm: '4px',
          md: '8px',
        },
      };

      const result = convertToTailwindV3(tokens, { preset: 'merge' });

      expect(result.files[0]?.content).toContain('spacing: {');
      expect(result.files[0]?.content).toContain('borderRadius: {');
      expect(result.files[0]?.content).toContain("sm: '8px'");
      expect(result.files[0]?.content).toContain("md: '16px'");
    });
  });

  describe('special cases', () => {
    it('should handle keys with special characters', () => {
      const tokens: NormalizedTokens = {
        colors: {
          'primary-blue': '#3B82F6',
          'text-sm': '#000000',
        },
      };

      const result = convertToTailwindV3(tokens, { preset: 'merge' });

      expect(result.files[0]?.content).toContain("'primary-blue'");
      expect(result.files[0]?.content).toContain("'text-sm'");
    });

    it('should handle DEFAULT key', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: {
            DEFAULT: '#3B82F6',
            dark: '#2563EB',
          },
        },
      };

      const result = convertToTailwindV3(tokens, { preset: 'merge' });

      expect(result.files[0]?.content).toContain('DEFAULT');
      expect(result.files[0]?.content).toContain('#3B82F6');
    });

    it('should handle empty tokens', () => {
      const tokens: NormalizedTokens = {};

      const result = convertToTailwindV3(tokens, { preset: 'merge' });

      expect(result.files).toHaveLength(1);
      expect(result.files[0]?.content).toContain('module.exports');
      expect(result.summary.tokensConverted).toBe(0);
    });

    it('should handle deeply nested tokens', () => {
      const tokens: NormalizedTokens = {
        colors: {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: '#3B82F6',
                },
              },
            },
          },
        },
      };

      const result = convertToTailwindV3(tokens, { preset: 'merge' });

      expect(result.files[0]?.content).toContain('level1: {');
      expect(result.files[0]?.content).toContain('level2: {');
      expect(result.files[0]?.content).toContain('level3: {');
      expect(result.files[0]?.content).toContain('level4: {');
      expect(result.files[0]?.content).toContain('level5: {');
      expect(result.files[0]?.content).toContain('#3B82F6');
    });
  });

  describe('content paths', () => {
    it('should include default content paths', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: '#3B82F6',
        },
      };

      const result = convertToTailwindV3(tokens, { preset: 'merge' });

      expect(result.files[0]?.content).toContain('content: [');
      expect(result.files[0]?.content).toContain('./src/**/*.{js,ts,jsx,tsx,mdx}');
      expect(result.files[0]?.content).toContain('./pages/**/*.{js,ts,jsx,tsx,mdx}');
      expect(result.files[0]?.content).toContain('./components/**/*.{js,ts,jsx,tsx,mdx}');
    });
  });

  describe('comments and metadata', () => {
    it('should include file header with generation timestamp', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: '#3B82F6',
        },
      };

      const result = convertToTailwindV3(tokens, { preset: 'merge' });

      expect(result.files[0]?.content).toContain('/**');
      expect(result.files[0]?.content).toContain('Tailwind CSS v3 Configuration');
      expect(result.files[0]?.content).toContain('@generated');
    });
  });

  describe('validation and warnings', () => {
    it('should include warnings for invalid tokens', () => {
      const tokens: NormalizedTokens = {
        colors: {
          invalid: 'not-a-color',
        },
      };

      const result = convertToTailwindV3(tokens, { preset: 'merge' });

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should count converted tokens', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: '#3B82F6',
          secondary: '#10B981',
        },
        fontSize: {
          sm: '14px',
        },
      };

      const result = convertToTailwindV3(tokens, { preset: 'merge' });

      expect(result.summary.tokensConverted).toBeGreaterThan(0);
    });
  });
});
