/**
 * Tailwind v3 Converter
 * Converts normalized design tokens to Tailwind v3 configuration format
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
import { validateTokens, validateJavaScriptSyntax } from './validator';

/**
 * Convert tokens to Tailwind v3 configuration
 */
export function convertToTailwindV3(
  tokens: NormalizedTokens,
  options: Partial<ConversionOptions> = {}
): ConversionResult {
  const opts: ConversionOptions = {
    tailwindVersion: 'v3',
    preset: options.preset || 'merge',
    outputPath: options.outputPath || './tailwind.config.js',
    typescript: options.typescript ?? false,
    dryRun: options.dryRun ?? false,
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

  // Generate config content
  const configContent = generateV3Config(tokens, opts);

  // Validate generated syntax
  const syntaxValidation = validateJavaScriptSyntax(configContent);
  if (!syntaxValidation.valid) {
    warnings.push(
      ...syntaxValidation.errors.map((err) => `Generated config syntax: ${err.message}`)
    );
  }

  // Create file object
  const fileName = opts.typescript ? 'tailwind.config.ts' : 'tailwind.config.js';
  const files: GeneratedFile[] = [
    {
      name: fileName,
      path: opts.outputPath,
      content: configContent,
      language: opts.typescript ? 'typescript' : 'javascript',
    },
  ];

  return {
    files,
    summary: {
      tokensConverted,
      version: 'v3',
      preset: opts.preset,
    },
    warnings,
  };
}

/**
 * Generate Tailwind v3 config file content
 */
function generateV3Config(tokens: NormalizedTokens, options: ConversionOptions): string {
  const timestamp = new Date().toISOString();
  const lines: string[] = [];

  // File header
  if (options.typescript) {
    lines.push(`import type { Config } from 'tailwindcss';`);
    lines.push('');
  }
  lines.push(`/**`);
  lines.push(` * Tailwind CSS v3 Configuration`);
  lines.push(` * Generated from design tokens`);
  lines.push(` * @generated ${timestamp}`);
  lines.push(` */`);
  lines.push('');

  // Start config
  if (options.typescript) {
    lines.push(`const config: Config = {`);
  } else {
    lines.push(`module.exports = {`);
  }

  // Content paths
  lines.push(`  content: [`);
  lines.push(`    './src/**/*.{js,ts,jsx,tsx,mdx}',`);
  lines.push(`    './pages/**/*.{js,ts,jsx,tsx,mdx}',`);
  lines.push(`    './components/**/*.{js,ts,jsx,tsx,mdx}',`);
  lines.push(`  ],`);

  // Theme configuration
  lines.push(`  theme: {`);

  if (options.preset === 'merge') {
    // Use extend to merge with default theme
    lines.push(`    extend: {`);
    lines.push(...generateThemeContent(tokens, 6));
    lines.push(`    },`);
  } else {
    // Replace default theme
    lines.push(...generateThemeContent(tokens, 4));
  }

  lines.push(`  },`);

  // Plugins
  lines.push(`  plugins: [],`);

  // Close config
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
 * Generate theme content
 */
function generateThemeContent(tokens: NormalizedTokens, indentLevel: number): string[] {
  const lines: string[] = [];
  const indent = ' '.repeat(indentLevel);

  // Colors
  if (tokens.colors) {
    lines.push(`${indent}colors: {`);
    lines.push(...generateObjectContent(tokens.colors, indentLevel + 2));
    lines.push(`${indent}},`);
  }

  // Font Size
  if (tokens.fontSize) {
    lines.push(`${indent}fontSize: {`);
    lines.push(...generateFontSizeContent(tokens.fontSize, indentLevel + 2));
    lines.push(`${indent}},`);
  }

  // Font Family
  if (tokens.fontFamily) {
    lines.push(`${indent}fontFamily: {`);
    lines.push(...generateFontFamilyContent(tokens.fontFamily, indentLevel + 2));
    lines.push(`${indent}},`);
  }

  // Font Weight
  if (tokens.fontWeight) {
    lines.push(`${indent}fontWeight: {`);
    lines.push(...generateFontWeightContent(tokens.fontWeight, indentLevel + 2));
    lines.push(`${indent}},`);
  }

  // Other token categories (spacing, borderRadius, etc.)
  const handledCategories = new Set(['colors', 'fontSize', 'fontFamily', 'fontWeight']);
  for (const [category, value] of Object.entries(tokens)) {
    if (!handledCategories.has(category) && value && typeof value === 'object') {
      lines.push(`${indent}${category}: {`);
      lines.push(...generateObjectContent(value as TokenObject, indentLevel + 2));
      lines.push(`${indent}},`);
    }
  }

  return lines;
}

/**
 * Generate generic object content
 */
function generateObjectContent(obj: TokenObject, indentLevel: number): string[] {
  const lines: string[] = [];
  const indent = ' '.repeat(indentLevel);

  for (const [key, value] of Object.entries(obj)) {
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;

    if (typeof value === 'string') {
      lines.push(`${indent}${safeKey}: '${value}',`);
    } else if (typeof value === 'number') {
      lines.push(`${indent}${safeKey}: ${value},`);
    } else if (typeof value === 'object' && value !== null) {
      lines.push(`${indent}${safeKey}: {`);
      lines.push(...generateObjectContent(value, indentLevel + 2));
      lines.push(`${indent}},`);
    }
  }

  return lines;
}

/**
 * Generate font size content
 */
function generateFontSizeContent(
  fontSizes: Record<string, FontSizeValue>,
  indentLevel: number
): string[] {
  const lines: string[] = [];
  const indent = ' '.repeat(indentLevel);

  for (const [key, value] of Object.entries(fontSizes)) {
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;

    if (typeof value === 'string') {
      lines.push(`${indent}${safeKey}: '${value}',`);
    } else if (typeof value === 'object' && value !== null) {
      const config: string[] = [];

      if (value.lineHeight || value.letterSpacing) {
        const props: string[] = [];
        if (value.lineHeight) {
          props.push(`lineHeight: '${value.lineHeight}'`);
        }
        if (value.letterSpacing) {
          props.push(`letterSpacing: '${value.letterSpacing}'`);
        }
        config.push(`'${value.fontSize}'`, `{ ${props.join(', ')} }`);
      } else {
        config.push(`'${value.fontSize}'`);
      }

      lines.push(`${indent}${safeKey}: [${config.join(', ')}],`);
    }
  }

  return lines;
}

/**
 * Generate font family content
 */
function generateFontFamilyContent(
  fontFamilies: Record<string, FontFamilyValue>,
  indentLevel: number
): string[] {
  const lines: string[] = [];
  const indent = ' '.repeat(indentLevel);

  for (const [key, value] of Object.entries(fontFamilies)) {
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;

    if (typeof value === 'string') {
      lines.push(`${indent}${safeKey}: ['${value}'],`);
    } else if (Array.isArray(value)) {
      const families = value.map((f) => `'${f}'`).join(', ');
      lines.push(`${indent}${safeKey}: [${families}],`);
    }
  }

  return lines;
}

/**
 * Generate font weight content
 */
function generateFontWeightContent(
  fontWeights: Record<string, FontWeightValue>,
  indentLevel: number
): string[] {
  const lines: string[] = [];
  const indent = ' '.repeat(indentLevel);

  for (const [key, value] of Object.entries(fontWeights)) {
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;

    if (typeof value === 'number') {
      lines.push(`${indent}${safeKey}: ${value},`);
    } else if (typeof value === 'string') {
      lines.push(`${indent}${safeKey}: '${value}',`);
    }
  }

  return lines;
}
