/**
 * Integration Tests for Component Generation
 * Tests the full flow from tokens to generated component
 */

import { describe, it, expect } from 'vitest';
import {
  generateButton,
  generateInput,
  generateCard,
  generateComponent,
} from '../../src/core/generators/react-generator';
import { getTemplateSpecification } from '../../src/core/generators/component-analyzer';
import { extractTokens } from '../../src/core/generators/tailwind-mapper';

describe('End-to-End Component Generation', () => {
  const sampleTokens = {
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
    fontSize: {
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
    },
    spacing: {
      2: '0.5rem',
      4: '1rem',
      6: '1.5rem',
    },
  };

  describe('Button Generation', () => {
    it('should generate a complete, valid Button component', () => {
      const result = generateButton(sampleTokens);

      // Verify structure
      expect(result.name).toBe('Button');
      expect(result.content).toBeTruthy();
      expect(result.filePath).toContain('Button.tsx');

      // Verify content includes all required sections
      expect(result.content).toContain(
        "import { cva, type VariantProps } from 'class-variance-authority'"
      );
      expect(result.content).toContain("import { forwardRef } from 'react'");
      expect(result.content).toContain('const buttonVariants = cva');
      expect(result.content).toContain('export interface ButtonProps');
      expect(result.content).toContain('export const Button = forwardRef');
      expect(result.content).toContain('Button.displayName');

      // Verify metadata
      expect(result.metadata.hasForwardRef).toBe(true);
      expect(result.metadata.variants).toHaveLength(1);
      expect(result.metadata.sizes).toHaveLength(3);
      expect(result.metadata.states).toContain('hover');
    });

    it('should generate Button with proper TypeScript types', () => {
      const result = generateButton();

      expect(result.content).toMatch(/export interface ButtonProps/);
      expect(result.content).toMatch(/React\.ButtonHTMLAttributes<HTMLButtonElement>/);
      expect(result.content).toMatch(/VariantProps<typeof buttonVariants>/);
      expect(result.content).toMatch(/forwardRef<HTMLButtonElement, ButtonProps>/);
    });

    it('should generate Button with CVA variants configuration', () => {
      const result = generateButton();

      expect(result.content).toContain('variants:');
      expect(result.content).toContain('defaultVariants:');
      expect(result.content).toMatch(/"variant":\s*\{/);
      expect(result.content).toMatch(/"size":\s*\{/);
    });
  });

  describe('Input Generation', () => {
    it('should generate a complete, valid Input component', () => {
      const result = generateInput(sampleTokens);

      expect(result.name).toBe('Input');
      expect(result.content).toContain('const inputVariants = cva');
      expect(result.content).toContain('export interface InputProps');
      expect(result.content).toContain('export const Input = forwardRef');
      expect(result.content).toContain('Input.displayName');

      expect(result.metadata.hasForwardRef).toBe(true);
    });

    it('should generate Input with proper HTML input element', () => {
      const result = generateInput();

      expect(result.content).toMatch(/React\.InputHTMLAttributes<HTMLInputElement>/);
      expect(result.content).toMatch(/forwardRef<HTMLInputElement, InputProps>/);
      expect(result.content).toContain('<input');
    });
  });

  describe('Card Generation', () => {
    it('should generate a complete, valid Card component', () => {
      const result = generateCard(sampleTokens);

      expect(result.name).toBe('Card');
      expect(result.content).toContain('const cardVariants = cva');
      expect(result.content).toContain('export interface CardProps');
      expect(result.content).toContain('export const Card =');

      // Card should not use forwardRef
      expect(result.metadata.hasForwardRef).toBe(false);
      expect(result.content).not.toContain('forwardRef');
    });

    it('should generate Card with div element', () => {
      const result = generateCard();

      expect(result.content).toContain('<div');
      expect(result.content).toMatch(/React\.HTMLAttributes<HTMLDivElement>/);
    });
  });

  describe('Custom Component Generation', () => {
    it('should generate custom component from specification', () => {
      const spec = getTemplateSpecification('button');
      const result = generateComponent({
        componentName: 'CustomButton',
        spec,
        tokens: sampleTokens,
      });

      expect(result.name).toBe('CustomButton');
      expect(result.content).toContain('export const CustomButton');
      expect(result.metadata.source).toBe('template');
    });

    it('should enhance component with token-based variants', () => {
      const result = generateComponent({
        componentName: 'EnhancedComponent',
        tokens: sampleTokens,
      });

      // Should detect variants from tokens
      expect(result.metadata.variants.length).toBeGreaterThan(0);
      expect(result.metadata.sizes.length).toBeGreaterThan(0);
    });
  });

  describe('Token Integration', () => {
    it('should extract and use design tokens', () => {
      const tokens = extractTokens(sampleTokens);

      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.some((t) => t.type === 'color')).toBe(true);
      expect(tokens.some((t) => t.type === 'fontSize')).toBe(true);
      expect(tokens.some((t) => t.type === 'spacing')).toBe(true);
    });

    it('should generate components that reference design tokens', () => {
      const result = generateButton(sampleTokens);

      // Component should be generated successfully with tokens
      expect(result.content).toBeTruthy();
      expect(result.metadata.variants.length).toBeGreaterThan(0);
    });
  });

  describe('Generated Code Quality', () => {
    it('should generate properly formatted TypeScript', () => {
      const result = generateButton();

      // Check for proper imports
      expect(result.content).toMatch(/^import /m);

      // Check for proper exports
      expect(result.content).toMatch(/export (interface|const)/g);

      // Check for proper JSX (either self-closing or with closing tag)
      expect(result.content).toMatch(/<[a-z]+[\s\S]*?(<\/[a-z]+>|\/>)/);

      // No syntax errors (basic checks)
      expect(result.content).not.toContain('undefined');
      expect(result.content).not.toContain('[object Object]');
    });

    it('should generate components with consistent naming', () => {
      const buttonResult = generateButton();
      const inputResult = generateInput();
      const cardResult = generateCard();

      // Check variant naming convention
      expect(buttonResult.content).toContain('buttonVariants');
      expect(inputResult.content).toContain('inputVariants');
      expect(cardResult.content).toContain('cardVariants');

      // Check props naming convention
      expect(buttonResult.content).toContain('ButtonProps');
      expect(inputResult.content).toContain('InputProps');
      expect(cardResult.content).toContain('CardProps');
    });

    it('should include generation metadata in comments', () => {
      const result = generateButton();

      expect(result.content).toContain('Generated by figma-tokens-mcp');
      expect(result.content).toMatch(/Generated at: \d{4}-\d{2}-\d{2}/);
    });
  });

  describe('Variant System', () => {
    it('should generate components with multiple variant options', () => {
      const result = generateButton();

      expect(result.metadata.variants[0].options.length).toBeGreaterThan(1);
    });

    it('should generate components with size variants', () => {
      const result = generateButton();

      expect(result.metadata.sizes).toContain('sm');
      expect(result.metadata.sizes).toContain('md');
      expect(result.metadata.sizes).toContain('lg');
    });

    it('should include state handling in metadata', () => {
      const result = generateButton();

      expect(result.metadata.states).toContain('hover');
      expect(result.metadata.states).toContain('focus');
      expect(result.metadata.states).toContain('active');
      expect(result.metadata.states).toContain('disabled');
    });
  });
});
