/**
 * Tests for token validator
 */

import { describe, it, expect } from 'vitest';
import {
  validateTokens,
  validateJavaScriptSyntax,
  validateCSSSyntax,
} from '@/core/converters/validator';
import type { NormalizedTokens } from '@/core/types/tokens';

describe('validateTokens', () => {
  describe('color validation', () => {
    it('should validate valid hex colors', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: '#3B82F6',
          secondary: '#10B981',
        },
      };

      const result = validateTokens(tokens);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate valid rgb colors', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: 'rgb(59, 130, 246)',
          secondary: 'rgba(16, 185, 129, 0.5)',
        },
      };

      const result = validateTokens(tokens);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate valid hsl colors', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: 'hsl(217, 91%, 60%)',
          secondary: 'hsla(160, 84%, 39%, 0.8)',
        },
      };

      const result = validateTokens(tokens);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate special color keywords', () => {
      const tokens: NormalizedTokens = {
        colors: {
          transparent: 'transparent',
          current: 'currentColor',
        },
      };

      const result = validateTokens(tokens);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid color formats', () => {
      const tokens: NormalizedTokens = {
        colors: {
          invalid: 'not-a-color',
        },
      };

      const result = validateTokens(tokens);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.path).toBe('colors.invalid');
    });

    it('should validate nested color objects', () => {
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

      const result = validateTokens(tokens);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('fontSize validation', () => {
    it('should validate valid font size strings', () => {
      const tokens: NormalizedTokens = {
        fontSize: {
          sm: '14px',
          base: '16px',
          lg: '1.125rem',
        },
      };

      const result = validateTokens(tokens);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate font size objects', () => {
      const tokens: NormalizedTokens = {
        fontSize: {
          sm: {
            fontSize: '14px',
            lineHeight: '20px',
            letterSpacing: '0.01em',
          },
        },
      };

      const result = validateTokens(tokens);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid font size units', () => {
      const tokens: NormalizedTokens = {
        fontSize: {
          invalid: 'large',
        },
      };

      const result = validateTokens(tokens);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject font size objects without fontSize property', () => {
      const tokens: NormalizedTokens = {
        fontSize: {
          invalid: {
            lineHeight: '20px',
          } as never,
        },
      };

      const result = validateTokens(tokens);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('fontFamily validation', () => {
    it('should validate string font families', () => {
      const tokens: NormalizedTokens = {
        fontFamily: {
          sans: 'Inter, system-ui, sans-serif',
          mono: 'JetBrains Mono, monospace',
        },
      };

      const result = validateTokens(tokens);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate array font families', () => {
      const tokens: NormalizedTokens = {
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
          mono: ['JetBrains Mono', 'monospace'],
        },
      };

      const result = validateTokens(tokens);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty font families', () => {
      const tokens: NormalizedTokens = {
        fontFamily: {
          empty: '',
        },
      };

      const result = validateTokens(tokens);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject empty font family arrays', () => {
      const tokens: NormalizedTokens = {
        fontFamily: {
          empty: [],
        },
      };

      const result = validateTokens(tokens);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('fontWeight validation', () => {
    it('should validate numeric font weights', () => {
      const tokens: NormalizedTokens = {
        fontWeight: {
          thin: 100,
          normal: 400,
          bold: 700,
          black: 900,
        },
      };

      const result = validateTokens(tokens);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate named font weights', () => {
      const tokens: NormalizedTokens = {
        fontWeight: {
          thin: 'thin',
          normal: 'normal',
          bold: 'bold',
          black: 'black',
        },
      };

      const result = validateTokens(tokens);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid numeric font weights', () => {
      const tokens: NormalizedTokens = {
        fontWeight: {
          invalid: 550,
        },
      };

      const result = validateTokens(tokens);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid named font weights', () => {
      const tokens: NormalizedTokens = {
        fontWeight: {
          invalid: 'super-bold',
        },
      };

      const result = validateTokens(tokens);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('reserved names validation', () => {
    it('should allow DEFAULT as a token name', () => {
      const tokens: NormalizedTokens = {
        colors: {
          primary: {
            DEFAULT: '#3B82F6',
          },
        },
      };

      const result = validateTokens(tokens);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject reserved names', () => {
      const tokens: NormalizedTokens = {
        colors: {
          inherit: '#000000',
        },
      };

      const result = validateTokens(tokens);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.message).toContain('reserved');
    });
  });

  describe('edge cases', () => {
    it('should handle empty tokens object', () => {
      const tokens: NormalizedTokens = {};

      const result = validateTokens(tokens);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle deeply nested token structures', () => {
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

      const result = validateTokens(tokens);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe('validateJavaScriptSyntax', () => {
  it('should validate balanced braces', () => {
    const code = `module.exports = { theme: { colors: { primary: '#3B82F6' } } };`;
    const result = validateJavaScriptSyntax(code);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect unbalanced braces', () => {
    const code = `module.exports = { theme: { colors: { primary: '#3B82F6' } };`;
    const result = validateJavaScriptSyntax(code);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should validate balanced parentheses', () => {
    const code = `const config = (function() { return {}; })();`;
    const result = validateJavaScriptSyntax(code);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect unbalanced parentheses', () => {
    const code = `const config = (function() { return {}; };`;
    const result = validateJavaScriptSyntax(code);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should validate balanced brackets', () => {
    const code = `const config = { fontFamily: ['Inter', 'sans-serif'] };`;
    const result = validateJavaScriptSyntax(code);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect unbalanced brackets', () => {
    const code = `const config = { fontFamily: ['Inter', 'sans-serif' };`;
    const result = validateJavaScriptSyntax(code);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('validateCSSSyntax', () => {
  it('should validate CSS with @theme directive', () => {
    const css = `@theme { --color-primary: #3B82F6; }`;
    const result = validateCSSSyntax(css);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing @theme directive', () => {
    const css = `:root { --color-primary: #3B82F6; }`;
    const result = validateCSSSyntax(css);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]?.message).toContain('@theme');
  });

  it('should validate balanced braces', () => {
    const css = `@theme { --color-primary: #3B82F6; }`;
    const result = validateCSSSyntax(css);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect unbalanced braces', () => {
    const css = `@theme { --color-primary: #3B82F6;`;
    const result = validateCSSSyntax(css);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should validate proper CSS variable syntax', () => {
    const css = `@theme {
      --color-primary: #3B82F6;
      --font-size-sm: 0.875rem;
    }`;
    const result = validateCSSSyntax(css);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
