/**
 * Tests for Component Analyzer
 */

import { describe, it, expect } from 'vitest';
import {
  parseFigmaURL,
  analyzeFigmaSection,
  inferVariantsFromTokens,
  getTemplateSpecification,
} from '../../src/core/generators/component-analyzer';

describe('parseFigmaURL', () => {
  it('should parse valid Figma URL with node-id query param', () => {
    const url = 'https://www.figma.com/file/abc123/Design-System?node-id=123-456';
    const result = parseFigmaURL(url);

    expect(result).toEqual({
      fileId: 'abc123',
      nodeId: '123:456',
      url,
    });
  });

  it('should parse valid Figma URL with node-id in hash', () => {
    const url = 'https://www.figma.com/file/abc123/Design-System#node-id=123-456';
    const result = parseFigmaURL(url);

    expect(result).toEqual({
      fileId: 'abc123',
      nodeId: '123:456',
      url,
    });
  });

  it('should return null for non-Figma URL', () => {
    const url = 'https://example.com/file/abc123?node-id=123-456';
    const result = parseFigmaURL(url);

    expect(result).toBeNull();
  });

  it('should return null for Figma URL without node-id', () => {
    const url = 'https://www.figma.com/file/abc123/Design-System';
    const result = parseFigmaURL(url);

    expect(result).toBeNull();
  });

  it('should return null for invalid URL', () => {
    const url = 'not-a-url';
    const result = parseFigmaURL(url);

    expect(result).toBeNull();
  });
});

describe('analyzeFigmaSection', () => {
  it('should return placeholder structure for MVP', async () => {
    const url = 'https://www.figma.com/file/abc123/Design-System?node-id=123-456';
    const result = await analyzeFigmaSection(url);

    expect(result).toMatchObject({
      name: 'PlaceholderComponent',
      type: 'custom',
      variants: [],
      baseElement: 'div',
      hasForwardRef: true,
      metadata: {
        analyzed: false,
        source: 'figma',
        figmaUrl: url,
      },
    });
  });

  it('should throw error for invalid URL', async () => {
    const url = 'https://example.com/invalid';

    await expect(analyzeFigmaSection(url)).rejects.toThrow('Invalid Figma URL');
  });
});

describe('inferVariantsFromTokens', () => {
  it('should infer color variants from token structure', () => {
    const tokens = {
      colors: {
        primary: {
          500: '#3b82f6',
          600: '#2563eb',
        },
        secondary: {
          500: '#8b5cf6',
          600: '#7c3aed',
        },
      },
    };

    const variants = inferVariantsFromTokens(tokens);

    expect(variants).toContainEqual({
      name: 'variant',
      type: 'variant',
      values: expect.arrayContaining(['primary', 'secondary']),
    });
  });

  it('should infer size variants from fontSize tokens', () => {
    const tokens = {
      fontSize: {
        sm: '0.875rem',
        md: '1rem',
        lg: '1.125rem',
      },
    };

    const variants = inferVariantsFromTokens(tokens);

    expect(variants).toContainEqual({
      name: 'size',
      type: 'size',
      values: expect.arrayContaining(['sm', 'md', 'lg']),
    });
  });

  it('should return empty array for tokens without variants', () => {
    const tokens = {
      spacing: {
        1: '0.25rem',
        2: '0.5rem',
      },
    };

    const variants = inferVariantsFromTokens(tokens);

    expect(variants).toEqual([]);
  });

  it('should handle complex nested token structure', () => {
    const tokens = {
      colors: {
        primary: { 500: '#000' },
        secondary: { 500: '#fff' },
      },
      fontSize: {
        sm: '0.875rem',
        lg: '1.125rem',
      },
    };

    const variants = inferVariantsFromTokens(tokens);

    expect(variants).toHaveLength(2);
    expect(variants.map((v) => v.name)).toContain('variant');
    expect(variants.map((v) => v.name)).toContain('size');
  });
});

describe('getTemplateSpecification', () => {
  it('should return button specification', () => {
    const spec = getTemplateSpecification('button');

    expect(spec).toMatchObject({
      name: 'Button',
      type: 'button',
      baseElement: 'button',
      hasForwardRef: true,
      metadata: {
        analyzed: false,
        source: 'template',
      },
    });

    expect(spec.variants).toContainEqual(
      expect.objectContaining({
        name: 'variant',
        values: expect.arrayContaining(['primary', 'secondary', 'outline']),
      })
    );

    expect(spec.variants).toContainEqual(
      expect.objectContaining({
        name: 'size',
        values: expect.arrayContaining(['sm', 'md', 'lg']),
      })
    );
  });

  it('should return input specification', () => {
    const spec = getTemplateSpecification('input');

    expect(spec).toMatchObject({
      name: 'Input',
      type: 'input',
      baseElement: 'input',
      hasForwardRef: true,
    });
  });

  it('should return card specification', () => {
    const spec = getTemplateSpecification('card');

    expect(spec).toMatchObject({
      name: 'Card',
      type: 'card',
      baseElement: 'div',
      hasForwardRef: false,
    });
  });
});
