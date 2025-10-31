/**
 * React Component Generator
 * Generates TypeScript React components with CVA variants from design tokens
 */

import type { ComponentSpecification } from './component-analyzer';
import { generateCompleteComponent, generateBaseClasses } from '../templates/component-templates';
import { extractTokens, mapTokenToTailwind } from './tailwind-mapper';

export interface GenerateComponentOptions {
  componentName: string;
  tokens?: Record<string, unknown>;
  spec?: ComponentSpecification;
  customBaseClasses?: string;
  outputPath?: string;
}

export interface GeneratedComponent {
  name: string;
  content: string;
  filePath: string;
  metadata: ComponentMetadata;
}

export interface ComponentMetadata {
  variants: Array<{
    name: string;
    options: string[];
  }>;
  sizes: string[];
  states: string[];
  hasForwardRef: boolean;
  analyzed: boolean;
  source: 'figma' | 'template';
}

/**
 * Generate a React component from specification and tokens
 */
export function generateComponent(options: GenerateComponentOptions): GeneratedComponent {
  const { componentName, tokens, spec, customBaseClasses, outputPath } = options;

  // Use provided spec or create default, ensuring component name is used
  const componentSpec: ComponentSpecification = spec
    ? { ...spec, name: componentName }
    : {
        name: componentName,
        type: 'custom',
        variants: [],
        layout: { display: 'flex' },
        baseElement: 'div',
        hasForwardRef: true,
        metadata: {
          analyzed: false,
          source: 'template',
        },
      };

  // If tokens provided, enhance spec with token-based variants
  if (tokens) {
    const tokenList = extractTokens(tokens);
    const enhancedSpec = enhanceSpecWithTokens(componentSpec, tokenList);
    return generateFromSpec(enhancedSpec, tokens, customBaseClasses, outputPath);
  }

  return generateFromSpec(componentSpec, undefined, customBaseClasses, outputPath);
}

/**
 * Generate component from specification
 */
function generateFromSpec(
  spec: ComponentSpecification,
  tokens?: Record<string, unknown>,
  customBaseClasses?: string,
  outputPath?: string
): GeneratedComponent {
  // Generate base classes if not provided
  const baseClasses = customBaseClasses || generateBaseClasses(spec);

  // If tokens provided, customize variant classes with token values
  let customizedSpec = spec;
  if (tokens) {
    customizedSpec = customizeVariantClasses(spec, tokens);
  }

  // Generate component content
  const content = generateCompleteComponent(customizedSpec, baseClasses);

  // Determine output path
  const filePath = outputPath || `./components/${spec.name}.tsx`;

  // Extract metadata
  const metadata = extractMetadata(customizedSpec);

  return {
    name: spec.name,
    content,
    filePath,
    metadata,
  };
}

/**
 * Enhance component specification with token-based variants
 */
function enhanceSpecWithTokens(
  spec: ComponentSpecification,
  tokens: ReturnType<typeof extractTokens>
): ComponentSpecification {
  const colorTokens = tokens.filter((t) => t.type === 'color');
  const sizeTokens = tokens.filter((t) => t.type === 'fontSize');

  // Extract unique variant names from color tokens
  const variantNames = new Set<string>();
  colorTokens.forEach((token) => {
    const parts = token.name.split('.');
    if (parts.length >= 2) {
      variantNames.add(parts[1]); // e.g., colors.primary -> "primary"
    }
  });

  // Extract size names from fontSize tokens
  const sizeNames = new Set<string>();
  sizeTokens.forEach((token) => {
    const parts = token.name.split('.');
    const sizeName = parts[parts.length - 1];
    if (/^(xs|sm|md|lg|xl|2xl|3xl|4xl)$/.test(sizeName)) {
      sizeNames.add(sizeName);
    }
  });

  // Add variant info to spec if not already present
  const hasVariant = spec.variants.some((v) => v.name === 'variant');
  const hasSize = spec.variants.some((v) => v.name === 'size');

  const newVariants = [...spec.variants];

  if (!hasVariant && variantNames.size > 0) {
    newVariants.push({
      name: 'variant',
      type: 'variant',
      values: Array.from(variantNames).sort(),
    });
  }

  if (!hasSize && sizeNames.size > 0) {
    newVariants.push({
      name: 'size',
      type: 'size',
      values: Array.from(sizeNames).sort(),
    });
  }

  return {
    ...spec,
    variants: newVariants,
  };
}

/**
 * Customize variant classes with actual token values
 */
function customizeVariantClasses(
  spec: ComponentSpecification,
  tokens: Record<string, unknown>
): ComponentSpecification {
  const tokenList = extractTokens(tokens);

  // Create a map of token names to Tailwind classes
  const tokenClassMap = new Map<string, string[]>();
  tokenList.forEach((token) => {
    const mapping = mapTokenToTailwind(token);
    if (mapping.classes.base && mapping.classes.base.length > 0) {
      tokenClassMap.set(token.name, mapping.classes.base);
    }
  });

  // Customize each variant with token-based classes
  const customizedVariants = spec.variants.map((variant) => {
    // For now, return as-is
    // Future: Map variant values to specific token classes
    return variant;
  });

  return {
    ...spec,
    variants: customizedVariants,
  };
}

/**
 * Extract metadata from component specification
 */
function extractMetadata(spec: ComponentSpecification): ComponentMetadata {
  const variants = spec.variants
    .filter((v) => v.type === 'variant')
    .map((v) => ({
      name: v.name,
      options: v.values,
    }));

  const sizes = spec.variants.find((v) => v.type === 'size')?.values || [];

  // Common states for interactive components
  const states = ['hover', 'focus', 'active', 'disabled'];

  return {
    variants,
    sizes,
    states,
    hasForwardRef: spec.hasForwardRef,
    analyzed: spec.metadata.analyzed,
    source: spec.metadata.source,
  };
}

/**
 * Generate Button component with CVA
 */
export function generateButton(tokens?: Record<string, unknown>): GeneratedComponent {
  return generateComponent({
    componentName: 'Button',
    tokens,
    spec: {
      name: 'Button',
      type: 'button',
      variants: [
        {
          name: 'variant',
          type: 'variant',
          values: ['primary', 'secondary', 'outline', 'ghost'],
        },
        {
          name: 'size',
          type: 'size',
          values: ['sm', 'md', 'lg'],
        },
      ],
      layout: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
      },
      baseElement: 'button',
      hasForwardRef: true,
      metadata: {
        analyzed: false,
        source: 'template',
      },
    },
  });
}

/**
 * Generate Input component with CVA
 */
export function generateInput(tokens?: Record<string, unknown>): GeneratedComponent {
  return generateComponent({
    componentName: 'Input',
    tokens,
    spec: {
      name: 'Input',
      type: 'input',
      variants: [
        {
          name: 'variant',
          type: 'variant',
          values: ['default', 'filled', 'outlined'],
        },
        {
          name: 'size',
          type: 'size',
          values: ['sm', 'md', 'lg'],
        },
      ],
      layout: {
        display: 'block',
      },
      baseElement: 'input',
      hasForwardRef: true,
      metadata: {
        analyzed: false,
        source: 'template',
      },
    },
  });
}

/**
 * Generate Card component with CVA
 */
export function generateCard(tokens?: Record<string, unknown>): GeneratedComponent {
  return generateComponent({
    componentName: 'Card',
    tokens,
    spec: {
      name: 'Card',
      type: 'card',
      variants: [
        {
          name: 'variant',
          type: 'variant',
          values: ['default', 'bordered', 'elevated'],
        },
      ],
      layout: {
        display: 'block',
        padding: { top: 16, right: 16, bottom: 16, left: 16 },
      },
      baseElement: 'div',
      hasForwardRef: false,
      metadata: {
        analyzed: false,
        source: 'template',
      },
    },
  });
}

/**
 * Save generated component to file system
 */
export async function saveComponent(
  component: GeneratedComponent,
  basePath: string = './components'
): Promise<string> {
  // In a real implementation, this would write to the file system
  // For now, return the intended path
  const fullPath = `${basePath}/${component.name}.tsx`;
  return fullPath;
}
