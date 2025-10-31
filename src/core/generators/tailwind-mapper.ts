/**
 * Tailwind Class Mapper
 * Maps design tokens to Tailwind utility classes
 */

export interface DesignToken {
  name: string;
  value: string | number;
  type: 'color' | 'fontSize' | 'spacing' | 'borderRadius' | 'fontWeight' | 'other';
}

export interface TailwindClassMapping {
  token: DesignToken;
  classes: {
    base?: string[];
    hover?: string[];
    focus?: string[];
    active?: string[];
    disabled?: string[];
  };
}

/**
 * Map a color token to Tailwind classes
 * Examples:
 * - colors.primary.500 → bg-primary-500, text-primary-500, border-primary-500
 */
export function mapColorToken(
  tokenName: string,
  _tokenValue: string,
  context: 'background' | 'text' | 'border' = 'background'
): string[] {
  const parts = tokenName.split('.');
  const classes: string[] = [];

  // Extract color name and shade
  let colorName = '';
  let shade = '';

  // Skip 'colors' prefix if present
  const relevantParts = parts[0] === 'colors' ? parts.slice(1) : parts;

  if (relevantParts.length >= 2) {
    colorName = relevantParts[relevantParts.length - 2] ?? '';
    shade = relevantParts[relevantParts.length - 1] ?? '';
  } else {
    colorName = relevantParts[relevantParts.length - 1] ?? '';
  }

  // Generate Tailwind classes
  const colorClass = shade ? `${colorName}-${shade}` : colorName;

  switch (context) {
    case 'background':
      classes.push(`bg-${colorClass}`);
      break;
    case 'text':
      classes.push(`text-${colorClass}`);
      break;
    case 'border':
      classes.push(`border-${colorClass}`);
      break;
  }

  return classes;
}

/**
 * Map a fontSize token to Tailwind classes
 * Examples:
 * - fontSize.sm → text-sm
 * - fontSize.base → text-base
 * - fontSize.lg → text-lg
 */
export function mapFontSizeToken(tokenName: string): string[] {
  const parts = tokenName.split('.');
  const size = parts[parts.length - 1];

  return [`text-${size}`];
}

/**
 * Map a spacing token to Tailwind classes
 * Examples:
 * - spacing.4 → p-4, m-4, gap-4, space-x-4, space-y-4
 */
export function mapSpacingToken(
  tokenName: string,
  context: 'padding' | 'margin' | 'gap' = 'padding'
): string[] {
  const parts = tokenName.split('.');
  const value = parts[parts.length - 1];

  switch (context) {
    case 'padding':
      return [`p-${value}`];
    case 'margin':
      return [`m-${value}`];
    case 'gap':
      return [`gap-${value}`];
  }
}

/**
 * Map a borderRadius token to Tailwind classes
 * Examples:
 * - borderRadius.md → rounded-md
 * - borderRadius.full → rounded-full
 */
export function mapBorderRadiusToken(tokenName: string): string[] {
  const parts = tokenName.split('.');
  const size = parts[parts.length - 1];

  return [`rounded-${size}`];
}

/**
 * Map a fontWeight token to Tailwind classes
 * Examples:
 * - fontWeight.normal → font-normal
 * - fontWeight.bold → font-bold
 */
export function mapFontWeightToken(tokenName: string): string[] {
  const parts = tokenName.split('.');
  const weight = parts[parts.length - 1];

  return [`font-${weight}`];
}

/**
 * Map design tokens to Tailwind classes based on token type
 */
export function mapTokenToTailwind(token: DesignToken): TailwindClassMapping {
  const mapping: TailwindClassMapping = {
    token,
    classes: {},
  };

  switch (token.type) {
    case 'color':
      mapping.classes.base = mapColorToken(token.name, token.value as string);
      break;
    case 'fontSize':
      mapping.classes.base = mapFontSizeToken(token.name);
      break;
    case 'spacing':
      mapping.classes.base = mapSpacingToken(token.name);
      break;
    case 'borderRadius':
      mapping.classes.base = mapBorderRadiusToken(token.name);
      break;
    case 'fontWeight':
      mapping.classes.base = mapFontWeightToken(token.name);
      break;
    default:
      mapping.classes.base = [];
  }

  return mapping;
}

/**
 * Generate state variant classes (hover, focus, active, disabled)
 */
export function generateStateVariants(baseClass: string): {
  hover?: string;
  focus?: string;
  active?: string;
  disabled?: string;
} {
  return {
    hover: `hover:${baseClass}`,
    focus: `focus:${baseClass}`,
    active: `active:${baseClass}`,
    disabled: `disabled:${baseClass}`,
  };
}

/**
 * Merge Tailwind classes, avoiding duplicates
 * Uses simple deduplication - in production, consider using clsx or cn utility
 */
export function mergeTailwindClasses(...classes: (string | undefined)[]): string {
  const classArray = classes
    .filter((c): c is string => !!c)
    .flatMap((c) => c.split(' '))
    .filter((c) => c.trim().length > 0);

  return Array.from(new Set(classArray)).join(' ');
}

/**
 * Extract tokens from a token object structure
 */
export function extractTokens(tokenObj: Record<string, unknown>, prefix = ''): DesignToken[] {
  const tokens: DesignToken[] = [];

  for (const [key, value] of Object.entries(tokenObj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !('value' in value)) {
      // Recurse into nested objects
      tokens.push(...extractTokens(value as Record<string, unknown>, fullPath));
    } else if (typeof value === 'object' && value !== null && 'value' in value) {
      // Token object with value
      const tokenValue = (value as { value: string | number }).value;
      tokens.push({
        name: fullPath,
        value: tokenValue,
        type: inferTokenType(fullPath),
      });
    } else if (typeof value === 'string' || typeof value === 'number') {
      // Direct value
      tokens.push({
        name: fullPath,
        value,
        type: inferTokenType(fullPath),
      });
    }
  }

  return tokens;
}

/**
 * Infer token type from token name
 */
function inferTokenType(tokenName: string): DesignToken['type'] {
  const lowerName = tokenName.toLowerCase();

  if (lowerName.includes('color') || lowerName.includes('colours')) {
    return 'color';
  }
  if (lowerName.includes('fontsize') || lowerName.includes('font-size')) {
    return 'fontSize';
  }
  if (
    lowerName.includes('spacing') ||
    lowerName.includes('space') ||
    lowerName.includes('padding') ||
    lowerName.includes('margin')
  ) {
    return 'spacing';
  }
  if (lowerName.includes('radius') || lowerName.includes('rounded')) {
    return 'borderRadius';
  }
  if (lowerName.includes('fontweight') || lowerName.includes('font-weight')) {
    return 'fontWeight';
  }

  return 'other';
}
