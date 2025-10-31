/**
 * Tailwind v4 Converter
 * Converts normalized design tokens to Tailwind v4 CSS variables format
 */

import type {
  NormalizedTokens,
  ConversionOptions,
  ConversionResult,
  GeneratedFile,
  TokenObject,
  FontSizeValue,
  FontFamilyValue,
  FontWeightValue,
} from '@/core/types/tokens';
import { validateTokens, validateCSSSyntax } from './validator';

/**
 * Convert tokens to Tailwind v4 format
 */
export function convertToTailwindV4(
  tokens: NormalizedTokens,
  options: Partial<ConversionOptions> = {}
): ConversionResult {
  const opts: ConversionOptions = {
    tailwindVersion: 'v4',
    preset: options.preset || 'merge',
    outputPath: options.outputPath || './src/design-tokens.css',
    typescript: options.typescript ?? true,
    dryRun: options.dryRun ?? false,
    cssPrefix: options.cssPrefix || '',
  };

  // Validate tokens first
  const validation = validateTokens(tokens);
  const warnings: string[] = [];

  if (!validation.valid) {
    warnings.push(
      ...validation.errors.map(
        (err) => `${err.path}: ${err.message}${err.suggestion ? ` (${err.suggestion})` : ''}`
      )
    );
  }

  // Count tokens
  let tokensConverted = 0;
  const countTokens = (obj: unknown): number => {
    if (typeof obj !== 'object' || obj === null) return 1;
    let count = 0;
    for (const value of Object.values(obj)) {
      count += countTokens(value);
    }
    return count;
  };

  for (const value of Object.values(tokens)) {
    if (value) {
      tokensConverted += countTokens(value);
    }
  }

  // Generate CSS content
  const cssContent = generateV4CSS(tokens, opts);

  // Generate minimal config
  const configContent = generateV4Config(opts);

  // Validate generated syntax
  const cssValidation = validateCSSSyntax(cssContent);
  if (!cssValidation.valid) {
    warnings.push(...cssValidation.errors.map((err) => `Generated CSS syntax: ${err.message}`));
  }

  // Create file objects
  const files: GeneratedFile[] = [
    {
      name: 'design-tokens.css',
      path: opts.outputPath,
      content: cssContent,
      language: 'css',
    },
    {
      name: opts.typescript ? 'tailwind.config.ts' : 'tailwind.config.js',
      path: opts.typescript ? './tailwind.config.ts' : './tailwind.config.js',
      content: configContent,
      language: opts.typescript ? 'typescript' : 'javascript',
    },
  ];

  return {
    files,
    summary: {
      tokensConverted,
      version: 'v4',
      preset: opts.preset,
    },
    warnings,
  };
}

/**
 * Generate Tailwind v4 CSS file content
 */
function generateV4CSS(tokens: NormalizedTokens, options: ConversionOptions): string {
  const timestamp = new Date().toISOString();
  const lines: string[] = [];

  // File header
  lines.push(`/**`);
  lines.push(` * Tailwind CSS v4 Design Tokens`);
  lines.push(` * Generated from design tokens`);
  lines.push(` * @generated ${timestamp}`);
  lines.push(` */`);
  lines.push('');

  // Import Tailwind directives
  lines.push(`@import "tailwindcss";`);
  lines.push('');

  // @theme directive
  lines.push(`@theme {`);

  // Generate CSS variables
  const variables: string[] = [];

  // Colors
  if (tokens.colors) {
    variables.push(`  /* Colors */`);
    variables.push(...generateColorVariables(tokens.colors, 'color', options.cssPrefix || ''));
    variables.push('');
  }

  // Font Size
  if (tokens.fontSize) {
    variables.push(`  /* Font Sizes */`);
    variables.push(...generateFontSizeVariables(tokens.fontSize, options.cssPrefix || ''));
    variables.push('');
  }

  // Font Family
  if (tokens.fontFamily) {
    variables.push(`  /* Font Families */`);
    variables.push(...generateFontFamilyVariables(tokens.fontFamily, options.cssPrefix || ''));
    variables.push('');
  }

  // Font Weight
  if (tokens.fontWeight) {
    variables.push(`  /* Font Weights */`);
    variables.push(...generateFontWeightVariables(tokens.fontWeight, options.cssPrefix || ''));
    variables.push('');
  }

  // Other categories
  const handledCategories = new Set(['colors', 'fontSize', 'fontFamily', 'fontWeight']);
  for (const [category, value] of Object.entries(tokens)) {
    if (!handledCategories.has(category) && value && typeof value === 'object') {
      variables.push(`  /* ${capitalizeFirst(category)} */`);
      variables.push(
        ...generateGenericVariables(value as TokenObject, category, options.cssPrefix || '')
      );
      variables.push('');
    }
  }

  lines.push(...variables);
  lines.push(`}`);

  return lines.join('\n') + '\n';
}

/**
 * Generate minimal Tailwind v4 config
 */
function generateV4Config(options: ConversionOptions): string {
  const timestamp = new Date().toISOString();
  const lines: string[] = [];

  // File header
  if (options.typescript) {
    lines.push(`import type { Config } from 'tailwindcss';`);
    lines.push('');
  }
  lines.push(`/**`);
  lines.push(` * Tailwind CSS v4 Configuration`);
  lines.push(` * Design tokens are defined in design-tokens.css`);
  lines.push(` * @generated ${timestamp}`);
  lines.push(` */`);
  lines.push('');

  // Minimal config
  if (options.typescript) {
    lines.push(`const config: Config = {`);
  } else {
    lines.push(`module.exports = {`);
  }

  lines.push(`  content: [`);
  lines.push(`    './src/**/*.{js,ts,jsx,tsx,mdx}',`);
  lines.push(`    './pages/**/*.{js,ts,jsx,tsx,mdx}',`);
  lines.push(`    './components/**/*.{js,ts,jsx,tsx,mdx}',`);
  lines.push(`  ],`);
  lines.push(`  plugins: [],`);

  if (options.typescript) {
    lines.push(`};`);
    lines.push('');
    lines.push(`export default config;`);
  } else {
    lines.push(`};`);
  }

  return lines.join('\n') + '\n';
}

/**
 * Generate CSS variables for colors
 */
function generateColorVariables(
  colors: TokenObject,
  category: string,
  prefix: string,
  path: string[] = []
): string[] {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(colors)) {
    const currentPath = [...path, key];

    if (typeof value === 'string') {
      const varName = `--${prefix}${category}-${currentPath.join('-')}`;
      lines.push(`  ${varName}: ${value};`);
    } else if (typeof value === 'object' && value !== null) {
      lines.push(...generateColorVariables(value, category, prefix, currentPath));
    }
  }

  return lines;
}

/**
 * Generate CSS variables for font sizes
 */
function generateFontSizeVariables(
  fontSizes: Record<string, FontSizeValue>,
  prefix: string
): string[] {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(fontSizes)) {
    if (typeof value === 'string') {
      const convertedValue = convertToRem(value);
      lines.push(`  --${prefix}font-size-${key}: ${convertedValue};`);
    } else if (typeof value === 'object' && value !== null) {
      const convertedSize = convertToRem(value.fontSize);
      lines.push(`  --${prefix}font-size-${key}: ${convertedSize};`);

      if (value.lineHeight) {
        const convertedLineHeight = convertToRem(value.lineHeight);
        lines.push(`  --${prefix}line-height-${key}: ${convertedLineHeight};`);
      }

      if (value.letterSpacing) {
        lines.push(`  --${prefix}letter-spacing-${key}: ${value.letterSpacing};`);
      }
    }
  }

  return lines;
}

/**
 * Generate CSS variables for font families
 */
function generateFontFamilyVariables(
  fontFamilies: Record<string, FontFamilyValue>,
  prefix: string
): string[] {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(fontFamilies)) {
    if (typeof value === 'string') {
      lines.push(`  --${prefix}font-family-${key}: ${value};`);
    } else if (Array.isArray(value)) {
      const families = value.join(', ');
      lines.push(`  --${prefix}font-family-${key}: ${families};`);
    }
  }

  return lines;
}

/**
 * Generate CSS variables for font weights
 */
function generateFontWeightVariables(
  fontWeights: Record<string, FontWeightValue>,
  prefix: string
): string[] {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(fontWeights)) {
    lines.push(`  --${prefix}font-weight-${key}: ${value};`);
  }

  return lines;
}

/**
 * Generate generic CSS variables
 */
function generateGenericVariables(
  obj: TokenObject,
  category: string,
  prefix: string,
  path: string[] = []
): string[] {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = [...path, key];

    if (typeof value === 'string') {
      const convertedValue = convertToRem(value);
      const varName = `--${prefix}${category}-${currentPath.join('-')}`;
      lines.push(`  ${varName}: ${convertedValue};`);
    } else if (typeof value === 'number') {
      const varName = `--${prefix}${category}-${currentPath.join('-')}`;
      lines.push(`  ${varName}: ${value};`);
    } else if (typeof value === 'object' && value !== null) {
      lines.push(...generateGenericVariables(value, category, prefix, currentPath));
    }
  }

  return lines;
}

/**
 * Convert px values to rem
 */
function convertToRem(value: string): string {
  // Check if it's a px value
  const pxMatch = value.match(/^(-?\d*\.?\d+)px$/);
  if (pxMatch && pxMatch[1]) {
    const pxValue = parseFloat(pxMatch[1]);
    const remValue = pxValue / 16;
    return `${remValue}rem`;
  }

  // Check if it's a unitless number that should be converted
  const numberMatch = value.match(/^(-?\d*\.?\d+)$/);
  if (numberMatch && numberMatch[1]) {
    const numValue = parseFloat(numberMatch[1]);
    // If it looks like a line-height (< 10), keep it unitless
    if (numValue < 10) {
      return value;
    }
    // Otherwise assume it's px and convert
    const remValue = numValue / 16;
    return `${remValue}rem`;
  }

  // Return as-is for other units or complex values
  return value;
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
