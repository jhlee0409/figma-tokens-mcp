/**
 * Validator for design tokens before conversion
 */

import type { NormalizedTokens, ValidationError, ValidationResult } from '@/core/types/tokens';

/**
 * Valid CSS color formats regex patterns
 */
const COLOR_PATTERNS = {
  hex: /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/,
  rgb: /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/,
  rgba: /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/,
  hsl: /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/,
  hsla: /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)$/,
  named: /^(transparent|currentColor|inherit|current)$/i,
};

/**
 * Valid CSS unit pattern
 */
const CSS_UNIT_PATTERN = /^-?\d*\.?\d+(px|rem|em|%|vh|vw|vmin|vmax|ch|ex)?$/;

/**
 * Valid font weight values
 */
const VALID_FONT_WEIGHTS = new Set([
  100, 200, 300, 400, 500, 600, 700, 800, 900,
  '100', '200', '300', '400', '500', '600', '700', '800', '900',
  'thin', 'extralight', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black',
]);

/**
 * Reserved Tailwind names (DEFAULT is allowed)
 */
const RESERVED_NAMES = new Set(['inherit', 'current', 'transparent']);

/**
 * Validate a color value
 */
function validateColor(value: unknown, path: string): ValidationError | null {
  if (typeof value !== 'string') {
    return {
      path,
      message: `Color value must be a string, got ${typeof value}`,
      suggestion: 'Use a valid CSS color format (hex, rgb, rgba, hsl, hsla)',
    };
  }

  const isValid = Object.values(COLOR_PATTERNS).some(pattern => pattern.test(value));

  if (!isValid) {
    return {
      path,
      message: `Invalid color format: "${value}"`,
      suggestion: 'Use a valid CSS color format (e.g., #3B82F6, rgb(59, 130, 246), hsl(217, 91%, 60%))',
    };
  }

  return null;
}

/**
 * Validate a font size value
 */
function validateFontSize(value: unknown, path: string): ValidationError | null {
  if (typeof value === 'string') {
    if (!CSS_UNIT_PATTERN.test(value)) {
      return {
        path,
        message: `Invalid font size: "${value}"`,
        suggestion: 'Use a valid CSS unit (e.g., 14px, 0.875rem, 1em)',
      };
    }
    return null;
  }

  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;

    if (!obj.fontSize || typeof obj.fontSize !== 'string') {
      return {
        path,
        message: 'Font size object must have a fontSize property',
        suggestion: 'Use format: { fontSize: "14px", lineHeight: "20px" }',
      };
    }

    if (!CSS_UNIT_PATTERN.test(obj.fontSize)) {
      return {
        path: `${path}.fontSize`,
        message: `Invalid font size: "${obj.fontSize}"`,
        suggestion: 'Use a valid CSS unit (e.g., 14px, 0.875rem, 1em)',
      };
    }

    if (obj.lineHeight !== undefined && typeof obj.lineHeight !== 'string') {
      return {
        path: `${path}.lineHeight`,
        message: `Line height must be a string, got ${typeof obj.lineHeight}`,
        suggestion: 'Use a valid CSS unit or unitless number (e.g., "20px", "1.5")',
      };
    }

    if (obj.letterSpacing !== undefined && typeof obj.letterSpacing !== 'string') {
      return {
        path: `${path}.letterSpacing`,
        message: `Letter spacing must be a string, got ${typeof obj.letterSpacing}`,
        suggestion: 'Use a valid CSS unit (e.g., "0.05em", "0.8px")',
      };
    }

    return null;
  }

  return {
    path,
    message: `Invalid font size type: ${typeof value}`,
    suggestion: 'Use a string with CSS unit or an object with fontSize property',
  };
}

/**
 * Validate a font family value
 */
function validateFontFamily(value: unknown, path: string): ValidationError | null {
  if (typeof value === 'string') {
    if (value.trim().length === 0) {
      return {
        path,
        message: 'Font family cannot be empty',
        suggestion: 'Provide a valid font family name',
      };
    }
    return null;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return {
        path,
        message: 'Font family array cannot be empty',
        suggestion: 'Provide at least one font family',
      };
    }

    for (let i = 0; i < value.length; i++) {
      if (typeof value[i] !== 'string' || value[i].trim().length === 0) {
        return {
          path: `${path}[${i}]`,
          message: 'Each font family must be a non-empty string',
          suggestion: 'Use valid font family names',
        };
      }
    }

    return null;
  }

  return {
    path,
    message: `Invalid font family type: ${typeof value}`,
    suggestion: 'Use a string or array of strings',
  };
}

/**
 * Validate a font weight value
 */
function validateFontWeight(value: unknown, path: string): ValidationError | null {
  if (typeof value === 'number') {
    if (!VALID_FONT_WEIGHTS.has(value)) {
      return {
        path,
        message: `Invalid font weight: ${value}`,
        suggestion: 'Use values between 100-900 in increments of 100',
      };
    }
    return null;
  }

  if (typeof value === 'string') {
    if (!VALID_FONT_WEIGHTS.has(value.toLowerCase())) {
      return {
        path,
        message: `Invalid font weight: "${value}"`,
        suggestion: 'Use numeric (100-900) or named values (thin, light, normal, medium, semibold, bold, extrabold, black)',
      };
    }
    return null;
  }

  return {
    path,
    message: `Invalid font weight type: ${typeof value}`,
    suggestion: 'Use a number (100-900) or string name',
  };
}

/**
 * Validate token names for conflicts
 */
function validateTokenNames(tokens: NormalizedTokens): ValidationError[] {
  const errors: ValidationError[] = [];
  const checkNames = (obj: unknown, basePath: string) => {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      const path = basePath ? `${basePath}.${key}` : key;

      // Check for reserved names (excluding DEFAULT which is allowed)
      if (RESERVED_NAMES.has(key)) {
        errors.push({
          path,
          message: `"${key}" is a reserved Tailwind name`,
          suggestion: 'Use a different token name',
        });
      }

      // Recursively check nested objects
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        checkNames(value, path);
      }
    }
  };

  Object.entries(tokens).forEach(([category, value]) => {
    if (typeof value === 'object' && value !== null) {
      checkNames(value, category);
    }
  });

  return errors;
}

/**
 * Validate colors token category
 */
function validateColors(colors: unknown, basePath = 'colors'): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof colors !== 'object' || colors === null) {
    return errors;
  }

  const validateColorObject = (obj: unknown, path: string) => {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = `${path}.${key}`;

      if (typeof value === 'string') {
        const error = validateColor(value, currentPath);
        if (error) {
          errors.push(error);
        }
      } else if (typeof value === 'object' && value !== null) {
        validateColorObject(value, currentPath);
      }
    }
  };

  validateColorObject(colors, basePath);
  return errors;
}

/**
 * Validate fontSize token category
 */
function validateFontSizes(fontSizes: unknown, basePath = 'fontSize'): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof fontSizes !== 'object' || fontSizes === null) {
    return errors;
  }

  for (const [key, value] of Object.entries(fontSizes)) {
    const path = `${basePath}.${key}`;
    const error = validateFontSize(value, path);
    if (error) {
      errors.push(error);
    }
  }

  return errors;
}

/**
 * Validate fontFamily token category
 */
function validateFontFamilies(fontFamilies: unknown, basePath = 'fontFamily'): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof fontFamilies !== 'object' || fontFamilies === null) {
    return errors;
  }

  for (const [key, value] of Object.entries(fontFamilies)) {
    const path = `${basePath}.${key}`;
    const error = validateFontFamily(value, path);
    if (error) {
      errors.push(error);
    }
  }

  return errors;
}

/**
 * Validate fontWeight token category
 */
function validateFontWeights(fontWeights: unknown, basePath = 'fontWeight'): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof fontWeights !== 'object' || fontWeights === null) {
    return errors;
  }

  for (const [key, value] of Object.entries(fontWeights)) {
    const path = `${basePath}.${key}`;
    const error = validateFontWeight(value, path);
    if (error) {
      errors.push(error);
    }
  }

  return errors;
}

/**
 * Validate normalized tokens
 */
export function validateTokens(tokens: NormalizedTokens): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate token structure
  if (typeof tokens !== 'object' || tokens === null) {
    return {
      valid: false,
      errors: [{
        path: 'root',
        message: 'Tokens must be an object',
        suggestion: 'Provide a valid token object',
      }],
    };
  }

  // Validate token names
  errors.push(...validateTokenNames(tokens));

  // Validate each category
  if (tokens.colors) {
    errors.push(...validateColors(tokens.colors));
  }

  if (tokens.fontSize) {
    errors.push(...validateFontSizes(tokens.fontSize));
  }

  if (tokens.fontFamily) {
    errors.push(...validateFontFamilies(tokens.fontFamily));
  }

  if (tokens.fontWeight) {
    errors.push(...validateFontWeights(tokens.fontWeight));
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate generated JavaScript config syntax (basic validation)
 */
export function validateJavaScriptSyntax(code: string): ValidationResult {
  const errors: ValidationError[] = [];

  // Basic syntax checks
  const braceBalance = (code.match(/{/g) || []).length - (code.match(/}/g) || []).length;
  if (braceBalance !== 0) {
    errors.push({
      path: 'syntax',
      message: 'Unbalanced braces in generated JavaScript',
      suggestion: 'Check the generated code for missing or extra braces',
    });
  }

  const parenBalance = (code.match(/\(/g) || []).length - (code.match(/\)/g) || []).length;
  if (parenBalance !== 0) {
    errors.push({
      path: 'syntax',
      message: 'Unbalanced parentheses in generated JavaScript',
      suggestion: 'Check the generated code for missing or extra parentheses',
    });
  }

  const bracketBalance = (code.match(/\[/g) || []).length - (code.match(/\]/g) || []).length;
  if (bracketBalance !== 0) {
    errors.push({
      path: 'syntax',
      message: 'Unbalanced brackets in generated JavaScript',
      suggestion: 'Check the generated code for missing or extra brackets',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate generated CSS syntax (basic validation)
 */
export function validateCSSSyntax(code: string): ValidationResult {
  const errors: ValidationError[] = [];

  // Check for @theme directive
  if (!code.includes('@theme')) {
    errors.push({
      path: 'syntax',
      message: 'Missing @theme directive in Tailwind v4 CSS',
      suggestion: 'Generated CSS should contain @theme directive',
    });
  }

  // Basic syntax checks
  const braceBalance = (code.match(/{/g) || []).length - (code.match(/}/g) || []).length;
  if (braceBalance !== 0) {
    errors.push({
      path: 'syntax',
      message: 'Unbalanced braces in generated CSS',
      suggestion: 'Check the generated CSS for missing or extra braces',
    });
  }

  // Check for valid CSS variable format
  const cssVarPattern = /--[\w-]+:\s*[^;]+;/g;
  const variables = code.match(cssVarPattern);
  if (code.includes('--') && !variables) {
    errors.push({
      path: 'syntax',
      message: 'Invalid CSS variable syntax',
      suggestion: 'CSS variables should follow format: --variable-name: value;',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
