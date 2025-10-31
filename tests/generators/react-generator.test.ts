/**
 * Tests for React Component Generator
 */

import { describe, it, expect } from 'vitest';
import {
  generateComponent,
  generateButton,
  generateInput,
  generateCard,
} from '../../src/core/generators/react-generator';

describe('generateComponent', () => {
  it('should generate a basic component with default spec', () => {
    const result = generateComponent({
      componentName: 'CustomComponent',
    });

    expect(result.name).toBe('CustomComponent');
    expect(result.content).toContain(
      "import { cva, type VariantProps } from 'class-variance-authority'"
    );
    expect(result.content).toContain("import { forwardRef } from 'react'");
    expect(result.content).toContain('export const CustomComponent =');
    expect(result.content).toContain('CustomComponent.displayName');
    expect(result.filePath).toBe('./components/CustomComponent.tsx');
  });

  it('should include component metadata', () => {
    const result = generateComponent({
      componentName: 'TestComponent',
    });

    expect(result.metadata).toMatchObject({
      variants: [],
      sizes: [],
      states: ['hover', 'focus', 'active', 'disabled'],
      hasForwardRef: true,
      analyzed: false,
      source: 'template',
    });
  });

  it('should generate component with custom output path', () => {
    const result = generateComponent({
      componentName: 'CustomPath',
      outputPath: './custom/path/Component.tsx',
    });

    expect(result.filePath).toBe('./custom/path/Component.tsx');
  });

  it('should enhance spec with tokens when provided', () => {
    const tokens = {
      colors: {
        primary: { 500: '#3b82f6' },
        secondary: { 500: '#8b5cf6' },
      },
      fontSize: {
        sm: '0.875rem',
        md: '1rem',
        lg: '1.125rem',
      },
    };

    const result = generateComponent({
      componentName: 'EnhancedComponent',
      tokens,
    });

    expect(result.metadata.variants.length).toBeGreaterThan(0);
    expect(result.metadata.sizes.length).toBeGreaterThan(0);
  });
});

describe('generateButton', () => {
  it('should generate Button component with variants', () => {
    const result = generateButton();

    expect(result.name).toBe('Button');
    expect(result.content).toContain('const buttonVariants = cva');
    expect(result.content).toContain('export const Button = forwardRef');
    expect(result.content).toContain('HTMLButtonElement');
    expect(result.content).toContain('Button.displayName');
  });

  it('should include button variants in metadata', () => {
    const result = generateButton();

    expect(result.metadata.variants).toContainEqual({
      name: 'variant',
      options: expect.arrayContaining(['primary', 'secondary', 'outline', 'ghost']),
    });

    expect(result.metadata.sizes).toEqual(['sm', 'md', 'lg']);
    expect(result.metadata.hasForwardRef).toBe(true);
  });

  it('should generate valid TypeScript code', () => {
    const result = generateButton();

    // Check for valid TypeScript patterns
    expect(result.content).toContain('export interface ButtonProps');
    expect(result.content).toContain('extends');
    expect(result.content).toContain('VariantProps<typeof buttonVariants>');
  });

  it('should include common button classes', () => {
    const result = generateButton();

    expect(result.content).toContain('inline-flex');
    expect(result.content).toContain('items-center');
    expect(result.content).toContain('justify-center');
    expect(result.content).toContain('rounded-md');
    expect(result.content).toContain('disabled:pointer-events-none');
  });
});

describe('generateInput', () => {
  it('should generate Input component with variants', () => {
    const result = generateInput();

    expect(result.name).toBe('Input');
    expect(result.content).toContain('const inputVariants = cva');
    expect(result.content).toContain('export const Input = forwardRef');
    expect(result.content).toContain('HTMLInputElement');
    expect(result.content).toContain('Input.displayName');
  });

  it('should include input variants in metadata', () => {
    const result = generateInput();

    expect(result.metadata.variants).toContainEqual({
      name: 'variant',
      options: expect.arrayContaining(['default', 'filled', 'outlined']),
    });

    expect(result.metadata.sizes).toEqual(['sm', 'md', 'lg']);
    expect(result.metadata.hasForwardRef).toBe(true);
  });

  it('should include common input classes', () => {
    const result = generateInput();

    expect(result.content).toContain('border');
    expect(result.content).toContain('rounded-md');
    expect(result.content).toContain('focus-visible:outline-none');
    expect(result.content).toContain('disabled:cursor-not-allowed');
  });
});

describe('generateCard', () => {
  it('should generate Card component', () => {
    const result = generateCard();

    expect(result.name).toBe('Card');
    expect(result.content).toContain('const cardVariants = cva');
    expect(result.content).toContain('export const Card =');
  });

  it('should include card variants in metadata', () => {
    const result = generateCard();

    expect(result.metadata.variants).toContainEqual({
      name: 'variant',
      options: expect.arrayContaining(['default', 'bordered', 'elevated']),
    });

    expect(result.metadata.hasForwardRef).toBe(false);
  });

  it('should not use forwardRef for Card', () => {
    const result = generateCard();

    // Card should not use forwardRef
    expect(result.content).not.toContain('forwardRef');
    expect(result.content).toContain('export const Card = ({');
  });

  it('should include card-specific classes', () => {
    const result = generateCard();

    expect(result.content).toContain('rounded-lg');
    expect(result.content).toContain('border');
    expect(result.content).toContain('shadow-sm');
  });
});

describe('Generated component structure', () => {
  it('should include file header with generation info', () => {
    const result = generateButton();

    expect(result.content).toContain('/**');
    expect(result.content).toContain('Generated by figma-tokens-mcp');
    expect(result.content).toContain('Button Component');
  });

  it('should have proper section ordering', () => {
    const result = generateButton();

    const importIndex = result.content.indexOf('import');
    const cvaIndex = result.content.indexOf('const buttonVariants = cva');
    const interfaceIndex = result.content.indexOf('export interface');
    const componentIndex = result.content.indexOf('export const Button');

    expect(importIndex).toBeLessThan(cvaIndex);
    expect(cvaIndex).toBeLessThan(interfaceIndex);
    expect(interfaceIndex).toBeLessThan(componentIndex);
  });

  it('should generate valid JSX structure', () => {
    const result = generateButton();

    expect(result.content).toContain('<button');
    expect(result.content).toContain('ref={ref}');
    expect(result.content).toContain('className={');
    expect(result.content).toContain('{...props}');
    expect(result.content).toContain('</button>');
  });
});
