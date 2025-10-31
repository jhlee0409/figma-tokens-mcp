/**
 * Component Analyzer
 * Analyzes Figma sections to extract component specifications
 * MVP: Returns placeholder structure for future implementation
 */

export interface FigmaSectionURL {
  fileId: string;
  nodeId: string;
  url: string;
}

export interface ComponentLayout {
  display?: 'flex' | 'grid' | 'block';
  flexDirection?: 'row' | 'column';
  justifyContent?: string;
  alignItems?: string;
  gap?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
}

export interface ComponentVariantInfo {
  name: string;
  type: 'variant' | 'size' | 'state';
  values: string[];
}

export interface ComponentSpecification {
  name: string;
  type: 'button' | 'input' | 'card' | 'custom';
  variants: ComponentVariantInfo[];
  layout: ComponentLayout;
  baseElement: 'button' | 'input' | 'div' | 'a';
  hasForwardRef: boolean;
  metadata: {
    analyzed: boolean;
    source: 'figma' | 'template';
    figmaUrl?: string;
  };
}

/**
 * Parse Figma URL to extract file and node IDs
 */
export function parseFigmaURL(url: string): FigmaSectionURL | null {
  try {
    const urlObj = new globalThis.URL(url);
    if (!urlObj.hostname.includes('figma.com')) {
      return null;
    }

    // Extract file ID from path (e.g., /file/ABC123/...)
    const fileMatch = urlObj.pathname.match(/\/file\/([^/]+)/);
    if (!fileMatch || !fileMatch[1]) {
      return null;
    }

    // Extract node ID from query params or hash
    const nodeId =
      urlObj.searchParams.get('node-id') || urlObj.hash.match(/node-id=([^&]+)/)?.[1] || null;

    if (!nodeId) {
      return null;
    }

    return {
      fileId: fileMatch[1],
      nodeId: nodeId.replace(/-/g, ':'), // Convert 123-456 to 123:456
      url,
    };
  } catch {
    return null;
  }
}

/**
 * Analyze Figma section to extract component specification
 * MVP: Returns placeholder structure
 * Future: Use FigmaAPIClient to fetch and analyze actual section data
 */
export async function analyzeFigmaSection(sectionUrl: string): Promise<ComponentSpecification> {
  const parsed = parseFigmaURL(sectionUrl);

  if (!parsed) {
    throw new Error('Invalid Figma URL. Must include file ID and node-id.');
  }

  // MVP: Return placeholder structure
  // Future implementation will:
  // 1. Use FigmaAPIClient to fetch section nodes
  // 2. Analyze component properties (layout, variants, etc.)
  // 3. Detect component type from naming or structure
  // 4. Extract variant information from component sets
  // 5. Return detailed component specification

  return {
    name: 'PlaceholderComponent',
    type: 'custom',
    variants: [],
    layout: {
      display: 'flex',
      flexDirection: 'row',
      gap: 8,
    },
    baseElement: 'div',
    hasForwardRef: true,
    metadata: {
      analyzed: false,
      source: 'figma',
      figmaUrl: sectionUrl,
    },
  };
}

/**
 * Infer variants from token naming patterns
 * Examples:
 * - colors.primary.* → variant: "primary"
 * - colors.secondary.* → variant: "secondary"
 * - fontSize.sm → size: "sm"
 * - fontSize.lg → size: "lg"
 */
export function inferVariantsFromTokens(tokens: Record<string, unknown>): ComponentVariantInfo[] {
  const variants: Map<string, Set<string>> = new Map();

  function traverse(obj: unknown, path: string[] = []) {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key];

      // Detect variant patterns
      if (path[0] === 'colors' && path.length === 1) {
        // colors.primary, colors.secondary, etc.
        if (!variants.has('variant')) {
          variants.set('variant', new Set());
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        variants.get('variant')!.add(key);
      }

      if (path[0] === 'fontSize' && path.length === 1) {
        // fontSize.sm, fontSize.md, fontSize.lg
        const sizePattern = /^(xs|sm|md|lg|xl|2xl|3xl|4xl)$/;
        if (sizePattern.test(key)) {
          if (!variants.has('size')) {
            variants.set('size', new Set());
          }
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          variants.get('size')!.add(key);
        }
      }

      // Recursively traverse
      if (typeof value === 'object' && value !== null) {
        traverse(value, currentPath);
      }
    }
  }

  traverse(tokens);

  // Convert to ComponentVariantInfo[]
  const result: ComponentVariantInfo[] = [];

  for (const [name, values] of variants.entries()) {
    result.push({
      name,
      type: name === 'size' ? 'size' : 'variant',
      values: Array.from(values).sort(),
    });
  }

  return result;
}

/**
 * Get component specification from template type
 */
export function getTemplateSpecification(
  componentType: 'button' | 'input' | 'card'
): ComponentSpecification {
  const specs: Record<string, ComponentSpecification> = {
    button: {
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
    input: {
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
    card: {
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
  };

  const spec = specs[componentType];
  if (!spec) {
    throw new Error(`Unknown component type: ${componentType}`);
  }
  return spec;
}
