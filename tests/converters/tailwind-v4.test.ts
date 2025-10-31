/**
 * Tests for Tailwind v4 converter
 */

import { describe, it, expect } from 'vitest';
import { convertToTailwindV4 } from '@/core/converters/tailwind-v4';
import type { NormalizedTokens } from '@/core/types/tokens';

describe('convertToTailwindV4', () => {
  describe('basic conversion', () => {
    it('should convert simple color tokens to CSS variables', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: '#3B82F6',
          secondary: '#10B981',
        },
      };

      const result = convertToTailwindV4(tokens, { preset: 'merge' });

      expect(result.files).toHaveLength(2);
      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile).toBeDefined();
      expect(cssFile?.content).toContain('@theme');
      expect(cssFile?.content).toContain('--color-primary: #3B82F6;');
      expect(cssFile?.content).toContain('--color-secondary: #10B981;');
      expect(result.summary.version).toBe('v4');
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

      const result = convertToTailwindV4(tokens, { preset: 'merge' });

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('--color-primary-blue-500: #3B82F6;');
      expect(cssFile?.content).toContain('--color-primary-blue-600: #2563EB;');
    });

    it('should convert fontSize tokens and convert px to rem', () => {
      const tokens: NormalizedTokens = {
        fontSize: {
          sm: '14px',
          base: '16px',
          lg: '18px',
        },
      };

      const result = convertToTailwindV4(tokens, { preset: 'merge' });

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('--font-size-sm: 0.875rem;');
      expect(cssFile?.content).toContain('--font-size-base: 1rem;');
      expect(cssFile?.content).toContain('--font-size-lg: 1.125rem;');
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

      const result = convertToTailwindV4(tokens, { preset: 'merge' });

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('--font-size-sm: 0.875rem;');
      expect(cssFile?.content).toContain('--line-height-sm: 1.25rem;');
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

      const result = convertToTailwindV4(tokens, { preset: 'merge' });

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('--font-size-sm: 0.875rem;');
      expect(cssFile?.content).toContain('--line-height-sm: 1.25rem;');
      expect(cssFile?.content).toContain('--letter-spacing-sm: 0.01em;');
    });

    it('should convert fontFamily tokens with strings', () => {
      const tokens: NormalizedTokens = {
        fontFamily: {
          sans: 'Inter, system-ui, sans-serif',
        },
      };

      const result = convertToTailwindV4(tokens, { preset: 'merge' });

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('--font-family-sans: Inter, system-ui, sans-serif;');
    });

    it('should convert fontFamily tokens with arrays', () => {
      const tokens: NormalizedTokens = {
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
        },
      };

      const result = convertToTailwindV4(tokens, { preset: 'merge' });

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('--font-family-sans: Inter, system-ui, sans-serif;');
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

      const result = convertToTailwindV4(tokens, { preset: 'merge' });

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('--font-weight-thin: 100;');
      expect(cssFile?.content).toContain('--font-weight-normal: 400;');
      expect(cssFile?.content).toContain('--font-weight-bold: 700;');
      expect(cssFile?.content).toContain('--font-weight-black: 900;');
    });
  });

  describe('CSS variable naming', () => {
    it('should use correct naming convention for colors', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: {
            blue: {
              500: '#3B82F6',
            },
          },
        },
      };

      const result = convertToTailwindV4(tokens, { preset: 'merge' });

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('--color-primary-blue-500');
    });

    it('should use correct naming convention for typography', () => {
      const tokens: NormalizedTokens = {
        fontSize: {
          'text-sm': '14px',
        },
      };

      const result = convertToTailwindV4(tokens, { preset: 'merge' });

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('--font-size-text-sm');
    });

    it('should support custom CSS prefix', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: '#3B82F6',
        },
      };

      const result = convertToTailwindV4(tokens, { cssPrefix: 'custom-' });

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('--custom-color-primary');
    });
  });

  describe('unit conversion', () => {
    it('should convert px to rem for font sizes', () => {
      const tokens: NormalizedTokens = {
        fontSize: {
          sm: '14px',
          base: '16px',
        },
      };

      const result = convertToTailwindV4(tokens, { preset: 'merge' });

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('0.875rem'); // 14px / 16 = 0.875rem
      expect(cssFile?.content).toContain('1rem'); // 16px / 16 = 1rem
    });

    it('should preserve rem values', () => {
      const tokens: NormalizedTokens = {
        fontSize: {
          sm: '0.875rem',
        },
      };

      const result = convertToTailwindV4(tokens, { preset: 'merge' });

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('0.875rem');
    });

    it('should preserve em values', () => {
      const tokens: NormalizedTokens = {
        fontSize: {
          sm: '1.2em',
        },
      };

      const result = convertToTailwindV4(tokens, { preset: 'merge' });

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('1.2em');
    });

    it('should convert px to rem for spacing values', () => {
      const tokens: NormalizedTokens = {
        spacing: {
          sm: '8px',
          md: '16px',
        },
      };

      const result = convertToTailwindV4(tokens, { preset: 'merge' });

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('0.5rem'); // 8px / 16 = 0.5rem
      expect(cssFile?.content).toContain('1rem'); // 16px / 16 = 1rem
    });
  });

  describe('config file generation', () => {
    it('should generate minimal TypeScript config by default', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: '#3B82F6',
        },
      };

      const result = convertToTailwindV4(tokens);

      const configFile = result.files.find(f => f.name === 'tailwind.config.ts');
      expect(configFile).toBeDefined();
      expect(configFile?.language).toBe('typescript');
      expect(configFile?.content).toContain("import type { Config } from 'tailwindcss'");
      expect(configFile?.content).toContain('const config: Config = {');
      expect(configFile?.content).toContain('export default config;');
    });

    it('should generate JavaScript config when typescript is false', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: '#3B82F6',
        },
      };

      const result = convertToTailwindV4(tokens, { typescript: false });

      const configFile = result.files.find(f => f.name === 'tailwind.config.js');
      expect(configFile).toBeDefined();
      expect(configFile?.language).toBe('javascript');
      expect(configFile?.content).toContain('module.exports = {');
      expect(configFile?.content).not.toContain('import type');
    });

    it('should include content paths in config', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: '#3B82F6',
        },
      };

      const result = convertToTailwindV4(tokens);

      const configFile = result.files.find(f => f.name === 'tailwind.config.ts');
      expect(configFile?.content).toContain('content: [');
      expect(configFile?.content).toContain('./src/**/*.{js,ts,jsx,tsx,mdx}');
    });
  });

  describe('CSS structure', () => {
    it('should include @import directive', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: '#3B82F6',
        },
      };

      const result = convertToTailwindV4(tokens);

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('@import "tailwindcss"');
    });

    it('should include @theme directive', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: '#3B82F6',
        },
      };

      const result = convertToTailwindV4(tokens);

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('@theme {');
    });

    it('should include comments for organization', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: '#3B82F6',
        },
        fontSize: {
          sm: '14px',
        },
      };

      const result = convertToTailwindV4(tokens);

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('/* Colors */');
      expect(cssFile?.content).toContain('/* Font Sizes */');
    });

    it('should include file header with timestamp', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: '#3B82F6',
        },
      };

      const result = convertToTailwindV4(tokens);

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('/**');
      expect(cssFile?.content).toContain('Tailwind CSS v4 Design Tokens');
      expect(cssFile?.content).toContain('@generated');
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

      const result = convertToTailwindV4(tokens);

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('--color-primary');
      expect(cssFile?.content).toContain('--font-size-sm');
      expect(cssFile?.content).toContain('--font-family-sans');
      expect(cssFile?.content).toContain('--font-weight-bold');
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

      const result = convertToTailwindV4(tokens);

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('/* Spacing */');
      expect(cssFile?.content).toContain('--spacing-sm');
      expect(cssFile?.content).toContain('/* BorderRadius */');
      expect(cssFile?.content).toContain('--borderRadius-sm');
    });
  });

  describe('special cases', () => {
    it('should handle empty tokens', () => {
      const tokens: NormalizedTokens = {};

      const result = convertToTailwindV4(tokens);

      expect(result.files).toHaveLength(2);
      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('@theme');
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

      const result = convertToTailwindV4(tokens);

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('--color-level1-level2-level3-level4-level5');
    });

    it('should handle numeric values in spacing', () => {
      const tokens: NormalizedTokens = {
        spacing: {
          0: '0px',
          1: '4px',
          2: '8px',
        },
      };

      const result = convertToTailwindV4(tokens);

      const cssFile = result.files.find(f => f.name === 'design-tokens.css');
      expect(cssFile?.content).toContain('--spacing-0');
      expect(cssFile?.content).toContain('--spacing-1');
      expect(cssFile?.content).toContain('--spacing-2');
    });
  });

  describe('validation and warnings', () => {
    it('should include warnings for invalid tokens', () => {
      const tokens: NormalizedTokens = {
        colors: {
          invalid: 'not-a-color',
        },
      };

      const result = convertToTailwindV4(tokens);

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

      const result = convertToTailwindV4(tokens);

      expect(result.summary.tokensConverted).toBeGreaterThan(0);
    });
  });
});
