/**
 * Type definitions for design tokens
 */

/**
 * Base token value types
 */
export type TokenValue = string | number | TokenObject;

export interface TokenObject {
  [key: string]: TokenValue;
}

/**
 * Typography token definition
 */
export interface TypographyToken {
  fontSize: string;
  lineHeight?: string;
  letterSpacing?: string;
  fontWeight?: string | number;
  fontFamily?: string | string[];
}

/**
 * Color token type
 */
export type ColorValue = string;

/**
 * Font family token type
 */
export type FontFamilyValue = string | string[];

/**
 * Font weight token type
 */
export type FontWeightValue = number | string;

/**
 * Font size token type
 */
export type FontSizeValue = string | { fontSize: string; lineHeight?: string; letterSpacing?: string };

/**
 * Normalized token structure
 */
export interface NormalizedTokens {
  colors?: TokenObject;
  fontSize?: Record<string, FontSizeValue>;
  fontFamily?: Record<string, FontFamilyValue>;
  fontWeight?: Record<string, FontWeightValue>;
  spacing?: TokenObject;
  borderRadius?: TokenObject;
  [key: string]: unknown;
}

/**
 * Conversion preset types
 */
export type ConversionPreset = 'merge' | 'replace';

/**
 * Tailwind version
 */
export type TailwindVersion = 'v3' | 'v4';

/**
 * Conversion options
 */
export interface ConversionOptions {
  tailwindVersion: TailwindVersion;
  preset: ConversionPreset;
  outputPath: string;
  typescript: boolean;
  dryRun: boolean;
  cssPrefix?: string;
}

/**
 * Generated file information
 */
export interface GeneratedFile {
  name: string;
  path: string;
  content: string;
  language: 'typescript' | 'javascript' | 'css';
}

/**
 * Conversion result
 */
export interface ConversionResult {
  files: GeneratedFile[];
  summary: {
    tokensConverted: number;
    version: TailwindVersion;
    preset: ConversionPreset;
  };
  warnings: string[];
}

/**
 * Validation error
 */
export interface ValidationError {
  path: string;
  message: string;
  suggestion?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
