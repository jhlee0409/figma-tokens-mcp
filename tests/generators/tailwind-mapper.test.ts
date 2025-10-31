/**
 * Tests for Tailwind Class Mapper
 */

import { describe, it, expect } from 'vitest';
import {
  mapColorToken,
  mapFontSizeToken,
  mapSpacingToken,
  mapBorderRadiusToken,
  mapFontWeightToken,
  mapTokenToTailwind,
  mergeTailwindClasses,
  extractTokens,
  generateStateVariants,
} from '../../src/core/generators/tailwind-mapper';

describe('mapColorToken', () => {
  it('should map color to background class', () => {
    const classes = mapColorToken('colors.primary.500', '#3b82f6', 'background');
    expect(classes).toEqual(['bg-primary-500']);
  });

  it('should map color to text class', () => {
    const classes = mapColorToken('colors.primary.500', '#3b82f6', 'text');
    expect(classes).toEqual(['text-primary-500']);
  });

  it('should map color to border class', () => {
    const classes = mapColorToken('colors.primary.500', '#3b82f6', 'border');
    expect(classes).toEqual(['border-primary-500']);
  });

  it('should handle color without shade', () => {
    const classes = mapColorToken('colors.primary', '#3b82f6', 'background');
    expect(classes).toEqual(['bg-primary']);
  });
});

describe('mapFontSizeToken', () => {
  it('should map fontSize token to text class', () => {
    const classes = mapFontSizeToken('fontSize.sm');
    expect(classes).toEqual(['text-sm']);
  });

  it('should handle base font size', () => {
    const classes = mapFontSizeToken('fontSize.base');
    expect(classes).toEqual(['text-base']);
  });

  it('should handle large font sizes', () => {
    const classes = mapFontSizeToken('fontSize.2xl');
    expect(classes).toEqual(['text-2xl']);
  });
});

describe('mapSpacingToken', () => {
  it('should map spacing to padding class', () => {
    const classes = mapSpacingToken('spacing.4', 'padding');
    expect(classes).toEqual(['p-4']);
  });

  it('should map spacing to margin class', () => {
    const classes = mapSpacingToken('spacing.4', 'margin');
    expect(classes).toEqual(['m-4']);
  });

  it('should map spacing to gap class', () => {
    const classes = mapSpacingToken('spacing.4', 'gap');
    expect(classes).toEqual(['gap-4']);
  });
});

describe('mapBorderRadiusToken', () => {
  it('should map borderRadius to rounded class', () => {
    const classes = mapBorderRadiusToken('borderRadius.md');
    expect(classes).toEqual(['rounded-md']);
  });

  it('should handle full border radius', () => {
    const classes = mapBorderRadiusToken('borderRadius.full');
    expect(classes).toEqual(['rounded-full']);
  });
});

describe('mapFontWeightToken', () => {
  it('should map fontWeight to font class', () => {
    const classes = mapFontWeightToken('fontWeight.bold');
    expect(classes).toEqual(['font-bold']);
  });

  it('should handle normal weight', () => {
    const classes = mapFontWeightToken('fontWeight.normal');
    expect(classes).toEqual(['font-normal']);
  });
});

describe('mapTokenToTailwind', () => {
  it('should map color token', () => {
    const token = {
      name: 'colors.primary.500',
      value: '#3b82f6',
      type: 'color' as const,
    };

    const mapping = mapTokenToTailwind(token);
    expect(mapping.classes.base).toEqual(['bg-primary-500']);
  });

  it('should map fontSize token', () => {
    const token = {
      name: 'fontSize.lg',
      value: '1.125rem',
      type: 'fontSize' as const,
    };

    const mapping = mapTokenToTailwind(token);
    expect(mapping.classes.base).toEqual(['text-lg']);
  });

  it('should map spacing token', () => {
    const token = {
      name: 'spacing.4',
      value: '1rem',
      type: 'spacing' as const,
    };

    const mapping = mapTokenToTailwind(token);
    expect(mapping.classes.base).toEqual(['p-4']);
  });
});

describe('generateStateVariants', () => {
  it('should generate hover, focus, active, and disabled variants', () => {
    const variants = generateStateVariants('bg-primary-500');

    expect(variants).toEqual({
      hover: 'hover:bg-primary-500',
      focus: 'focus:bg-primary-500',
      active: 'active:bg-primary-500',
      disabled: 'disabled:bg-primary-500',
    });
  });
});

describe('mergeTailwindClasses', () => {
  it('should merge multiple classes', () => {
    const result = mergeTailwindClasses('bg-blue-500', 'text-white', 'p-4');
    expect(result).toBe('bg-blue-500 text-white p-4');
  });

  it('should remove duplicates', () => {
    const result = mergeTailwindClasses('bg-blue-500', 'text-white', 'bg-blue-500');
    expect(result).toBe('bg-blue-500 text-white');
  });

  it('should handle undefined values', () => {
    const result = mergeTailwindClasses('bg-blue-500', undefined, 'text-white');
    expect(result).toBe('bg-blue-500 text-white');
  });

  it('should handle empty strings', () => {
    const result = mergeTailwindClasses('bg-blue-500', '', 'text-white');
    expect(result).toBe('bg-blue-500 text-white');
  });

  it('should handle classes with spaces', () => {
    const result = mergeTailwindClasses('bg-blue-500 text-white', 'p-4 m-2');
    expect(result).toBe('bg-blue-500 text-white p-4 m-2');
  });
});

describe('extractTokens', () => {
  it('should extract tokens from flat structure', () => {
    const tokenObj = {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
    };

    const tokens = extractTokens(tokenObj);
    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toMatchObject({
      name: 'primary',
      value: '#3b82f6',
    });
  });

  it('should extract tokens from nested structure', () => {
    const tokenObj = {
      colors: {
        primary: {
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
    };

    const tokens = extractTokens(tokenObj);
    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toMatchObject({
      name: 'colors.primary.500',
      value: '#3b82f6',
    });
  });

  it('should extract tokens with value property', () => {
    const tokenObj = {
      primary: {
        value: '#3b82f6',
      },
    };

    const tokens = extractTokens(tokenObj);
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({
      name: 'primary',
      value: '#3b82f6',
    });
  });

  it('should infer token types correctly', () => {
    const tokenObj = {
      colors: { primary: '#3b82f6' },
      fontSize: { base: '1rem' },
      spacing: { 4: '1rem' },
      borderRadius: { md: '0.375rem' },
      fontWeight: { bold: 700 },
    };

    const tokens = extractTokens(tokenObj);

    expect(tokens.find((t) => t.name === 'colors.primary')?.type).toBe('color');
    expect(tokens.find((t) => t.name === 'fontSize.base')?.type).toBe('fontSize');
    expect(tokens.find((t) => t.name === 'spacing.4')?.type).toBe('spacing');
    expect(tokens.find((t) => t.name === 'borderRadius.md')?.type).toBe('borderRadius');
    expect(tokens.find((t) => t.name === 'fontWeight.bold')?.type).toBe('fontWeight');
  });
});
