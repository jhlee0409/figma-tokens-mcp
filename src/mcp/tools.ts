/**
 * MCP Tool Implementations
 *
 * Implements the three main tools:
 * 1. extract_tokens - Extract design tokens from Figma
 * 2. convert_to_tailwind - Convert tokens to Tailwind config
 * 3. generate_component - Generate React components from tokens
 */

import { FigmaAPIClient } from '../core/extractors/figma-api.js';
import { createVariablesExtractor } from '../core/extractors/variables-extractor.js';
import { StylesExtractor } from '../core/extractors/styles-extractor.js';
import { mergeTokens } from '../core/extractors/merger.js';
import { convertToTailwindV3 } from '../core/converters/tailwind-v3.js';
import { convertToTailwindV4 } from '../core/converters/tailwind-v4.js';
import { generateComponent as generateReactComponent } from '../core/generators/react-generator.js';
import { parseFigmaUrl } from '../utils/url-parser.js';
import { isValidTokenStructure, countTokens, getAvailableTokenTypes } from '../utils/token-validator.js';
import { MCPToolError, validateRequiredParams, validateParamTypes } from '../utils/mcp-errors.js';
import type {
  ExtractTokensInput,
  ExtractTokensOutput,
  ConvertToTailwindInput,
  ConvertToTailwindOutput,
  GenerateComponentInput,
  GenerateComponentOutput,
  ToolContext,
  ToolResponse,
  TokenWarning,
} from './types.js';

// ============================================================================
// Tool 1: extract_tokens
// ============================================================================

/**
 * Extracts design tokens from a Figma file
 *
 * @param input - Tool input parameters
 * @param context - Tool execution context
 * @returns Extraction result with tokens and metadata
 */
export async function extractTokens(
  input: ExtractTokensInput,
  context: ToolContext
): Promise<ExtractTokensOutput> {
  const { figmaFileUrl, tokenTypes, extractionStrategy = 'auto' } = input;

  context.logger.info(`Extracting tokens from Figma file: ${figmaFileUrl}`);

  // Validate required parameters
  validateRequiredParams({ figmaFileUrl }, ['figmaFileUrl'], 'extract_tokens');

  // Validate parameter types
  validateParamTypes({ figmaFileUrl }, { figmaFileUrl: 'string' }, 'extract_tokens');

  if (tokenTypes) {
    validateParamTypes({ tokenTypes }, { tokenTypes: 'array' }, 'extract_tokens');
  }

  // Check Figma access token
  if (!context.figmaAccessToken) {
    throw new MCPToolError(
      'Figma access token not configured. Set FIGMA_ACCESS_TOKEN environment variable.',
      'extract_tokens',
      'MISSING_TOKEN'
    );
  }

  // Parse Figma URL
  const parsed = parseFigmaUrl(figmaFileUrl);
  context.logger.debug(`Parsed file key: ${parsed.fileKey}`);

  // Create API client
  const apiClient = new FigmaAPIClient({
    accessToken: context.figmaAccessToken,
  });

  // Determine extraction strategy
  let actualStrategy = extractionStrategy;
  if (actualStrategy === 'auto') {
    // For MVP, we'll use 'mixed' as default auto strategy
    // In future, we could detect based on file metadata
    actualStrategy = 'mixed';
    context.logger.info('Auto-detecting extraction strategy: using mixed mode');
  }

  const warnings: TokenWarning[] = [];
  let mergedResult;

  try {
    // Extract based on strategy
    if (actualStrategy === 'variables' || actualStrategy === 'mixed') {
      context.logger.info('Extracting Variables...');
      const variablesExtractor = createVariablesExtractor(apiClient);
      const variablesResult = await variablesExtractor.extract(parsed.fileKey);

      // Add warnings from variables extraction
      if (variablesResult.warnings.length > 0) {
        warnings.push(
          ...variablesResult.warnings.map((msg) => ({
            type: 'info' as const,
            severity: 'low' as const,
            message: msg,
          }))
        );
      }

      if (actualStrategy === 'variables') {
        // Variables only
        mergedResult = {
          tokens: variablesResult.variables.map((v) => ({
            name: v.normalizedName,
            value: v.value,
            type: v.type.toLowerCase(),
            source: 'variables',
            metadata: {
              variableId: v.id,
              collectionId: v.collectionId,
              description: v.description,
            },
          })),
          hierarchy: variablesResult.tokens,
          conflicts: [],
          warnings: variablesResult.warnings,
          pattern: variablesResult.pattern ?? {
            separator: '/',
            case: 'kebab',
            depth: 3,
            type: 'mixed',
            confidence: 1.0,
            sampleCount: 0,
            examples: [],
          },
          resolutionStrategy: 'variables_priority' as const,
          statistics: {
            totalTokens: variablesResult.variables.length,
            variableTokens: variablesResult.variables.length,
            styleTokens: 0,
            conflicts: 0,
            resolved: 0,
            unresolved: 0,
          },
        };
      } else {
        // Mixed mode - also extract styles
        context.logger.info('Extracting Styles...');
        const stylesExtractor = new StylesExtractor(apiClient);
        const stylesResult = await stylesExtractor.extractStyles(parsed.fileKey);

        // Merge both
        context.logger.info('Merging Variables and Styles...');
        mergedResult = mergeTokens(variablesResult, stylesResult, {
          mode: 'merge',
          resolutionStrategy: 'variables_priority',
        });

        // Add merge warnings
        if (mergedResult.warnings.length > 0) {
          warnings.push(
            ...mergedResult.warnings.map((msg) => ({
              type: 'conflict' as const,
              severity: 'medium' as const,
              message: msg,
            }))
          );
        }
      }
    } else if (actualStrategy === 'styles') {
      context.logger.info('Extracting Styles...');
      const stylesExtractor = new StylesExtractor(apiClient);
      const stylesResult = await stylesExtractor.extractStyles(parsed.fileKey);

      // Convert styles to merged format
      const styleTokens = [
        ...Object.values(stylesResult.colors).map((c) => ({
          name: c.name,
          value: c.value,
          type: 'color',
          source: 'styles',
          metadata: { styleId: c.id, description: c.description },
        })),
        ...Object.values(stylesResult.typography).map((t) => ({
          name: t.name,
          value: t,
          type: 'typography',
          source: 'styles',
          metadata: { styleId: t.id, description: t.description },
        })),
      ];

      mergedResult = {
        tokens: styleTokens,
        hierarchy: { colors: stylesResult.colors, typography: stylesResult.typography },
        conflicts: [],
        warnings: [],
        pattern: {
          separator: '/',
          case: 'kebab',
          depth: 3,
          type: 'mixed',
          confidence: 1.0,
          sampleCount: 0,
          examples: [],
        },
        resolutionStrategy: 'styles_priority' as const,
        statistics: {
          totalTokens: styleTokens.length,
          variableTokens: 0,
          styleTokens: styleTokens.length,
          conflicts: 0,
          resolved: 0,
          unresolved: 0,
        },
      };
    } else {
      throw new MCPToolError(
        `Invalid extraction strategy: ${actualStrategy}`,
        'extract_tokens',
        'INVALID_STRATEGY'
      );
    }

    // Filter by token types if specified
    let filteredHierarchy = mergedResult.hierarchy;
    if (tokenTypes && tokenTypes.length > 0) {
      context.logger.info(`Filtering tokens by types: ${tokenTypes.join(', ')}`);
      filteredHierarchy = {};
      for (const type of tokenTypes) {
        if (type in mergedResult.hierarchy) {
          filteredHierarchy[type] = mergedResult.hierarchy[type];
        }
      }
    }

    // Build statistics
    const tokenCount = countTokens(filteredHierarchy as Record<string, unknown>);
    const tokenTypesList = getAvailableTokenTypes(filteredHierarchy as Record<string, unknown>);

    const statistics = {
      totalTokens: tokenCount,
      byType: tokenTypesList.reduce(
        (acc, type) => {
          acc[type] = countTokens((filteredHierarchy as Record<string, unknown>)[type] as Record<string, unknown>);
          return acc;
        },
        {} as Record<string, number>
      ),
      conflicts: mergedResult.conflicts.length,
      conflictsResolved: mergedResult.statistics.resolved,
    };

    context.logger.info(`Extraction complete: ${statistics.totalTokens} tokens extracted`);

    return {
      success: true,
      tokens: filteredHierarchy as Record<string, unknown>,
      metadata: {
        fileKey: parsed.fileKey,
        extractedAt: new Date().toISOString(),
        extractionStrategy: actualStrategy,
        sources:
          actualStrategy === 'variables'
            ? ['variables']
            : actualStrategy === 'styles'
              ? ['styles']
              : ['variables', 'styles'],
        tokenCounts: statistics.byType,
      },
      warnings,
      statistics,
    };
  } catch (error) {
    context.logger.error('Token extraction failed', error as Error);
    throw error;
  }
}

// ============================================================================
// Tool 2: convert_to_tailwind
// ============================================================================

/**
 * Converts design tokens to Tailwind CSS configuration
 *
 * @param input - Tool input parameters
 * @param context - Tool execution context
 * @returns Conversion result with generated files
 */
export async function convertToTailwind(
  input: ConvertToTailwindInput,
  context: ToolContext
): Promise<ConvertToTailwindOutput> {
  const {
    tokens,
    tailwindVersion = 'v4',
    preset = 'merge',
    outputPath = './',
    typescript = true,
  } = input;

  context.logger.info(`Converting tokens to Tailwind CSS ${tailwindVersion}`);

  // Validate required parameters
  validateRequiredParams({ tokens }, ['tokens'], 'convert_to_tailwind');

  // Validate token structure
  if (!isValidTokenStructure(tokens)) {
    throw new MCPToolError(
      'Invalid token structure. Expected a non-empty object with token definitions.',
      'convert_to_tailwind',
      'INVALID_TOKENS'
    );
  }

  const warnings: TokenWarning[] = [];
  const availableTypes = getAvailableTokenTypes(tokens);

  if (availableTypes.length === 0) {
    warnings.push({
      type: 'missing',
      severity: 'medium',
      message: 'No recognized token types found in the provided tokens object.',
    });
  }

  try {
    let result;

    if (tailwindVersion === 'v3') {
      context.logger.info(`Converting to Tailwind v3 with preset: ${preset}`);
      result = convertToTailwindV3(tokens, {
        preset,
        typescript,
      });

      // Map files to our format
      const files = result.files.map((file) => ({
        path: outputPath,
        filename: file.filename,
        content: file.content,
        type: file.type as 'config' | 'css' | 'component',
      }));

      return {
        success: true,
        files,
        summary: {
          version: 'v3',
          preset,
          tokenTypes: availableTypes,
          totalTokens: countTokens(tokens),
        },
        warnings: [
          ...warnings,
          ...result.warnings.map((warn) => ({
            type: 'info' as const,
            severity: 'low' as const,
            message: warn,
          })),
        ],
      };
    } else {
      // v4
      context.logger.info('Converting to Tailwind v4 with CSS variables');
      result = convertToTailwindV4(tokens, {
        typescript,
      });

      // Map files to our format
      const files = result.files.map((file) => ({
        path: outputPath,
        filename: file.filename,
        content: file.content,
        type: file.type as 'config' | 'css' | 'component',
      }));

      return {
        success: true,
        files,
        summary: {
          version: 'v4',
          preset: 'css-variables',
          tokenTypes: availableTypes,
          totalTokens: countTokens(tokens),
        },
        warnings: [
          ...warnings,
          ...result.warnings.map((warn) => ({
            type: 'info' as const,
            severity: 'low' as const,
            message: warn,
          })),
        ],
      };
    }
  } catch (error) {
    context.logger.error('Tailwind conversion failed', error as Error);
    throw error;
  }
}

// ============================================================================
// Tool 3: generate_component
// ============================================================================

/**
 * Generates a React component using design tokens
 *
 * @param input - Tool input parameters
 * @param context - Tool execution context
 * @returns Generation result with component code
 */
export async function generateComponent(
  input: GenerateComponentInput,
  context: ToolContext
): Promise<GenerateComponentOutput> {
  const {
    componentName,
    tokens,
    sectionUrl,
    framework = 'react',
    typescript = true,
    outputPath = './src/components',
  } = input;

  context.logger.info(`Generating ${framework} component: ${componentName}`);

  // Validate required parameters
  validateRequiredParams({ componentName, tokens }, ['componentName', 'tokens'], 'generate_component');

  // Validate token structure
  if (!isValidTokenStructure(tokens)) {
    throw new MCPToolError(
      'Invalid token structure. Expected a non-empty object with token definitions.',
      'generate_component',
      'INVALID_TOKENS'
    );
  }

  // Validate component name
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(componentName)) {
    throw new MCPToolError(
      'Component name must start with uppercase letter and contain only alphanumeric characters.',
      'generate_component',
      'INVALID_COMPONENT_NAME',
      { componentName }
    );
  }

  if (framework !== 'react') {
    throw new MCPToolError(
      `Unsupported framework: ${framework}. Only 'react' is currently supported.`,
      'generate_component',
      'UNSUPPORTED_FRAMEWORK',
      { framework }
    );
  }

  const warnings: TokenWarning[] = [];

  // Handle section URL if provided (future enhancement)
  if (sectionUrl) {
    warnings.push({
      type: 'info',
      severity: 'low',
      message: 'Section URL analysis is not yet implemented. Generating template-based component.',
    });
    context.logger.info(`Section URL provided but not analyzed: ${sectionUrl}`);
  }

  try {
    // Generate component
    context.logger.info('Generating React component with CVA variants');
    const result = generateReactComponent({
      componentName,
      componentType: 'Button', // Default to Button for MVP
      tokens,
      typescript,
    });

    const filename = typescript ? `${componentName}.tsx` : `${componentName}.jsx`;

    // Extract metadata from generated component
    const variants = extractVariantsFromCode(result.code);
    const props = extractPropsFromCode(result.code);

    const component = {
      path: outputPath,
      filename,
      content: result.code,
      type: 'component' as const,
    };

    // Generate usage example
    const usage = generateUsageExample(componentName, variants, typescript);

    context.logger.info(`Component generated successfully: ${filename}`);

    return {
      success: true,
      component,
      metadata: {
        componentName,
        framework,
        typescript,
        variants,
        props,
      },
      usage,
      warnings,
    };
  } catch (error) {
    context.logger.error('Component generation failed', error as Error);
    throw error;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extracts variant names from generated component code
 */
function extractVariantsFromCode(code: string): string[] {
  const variants: string[] = [];
  const variantsMatch = code.match(/variants:\s*\{([^}]+)\}/s);

  if (variantsMatch && variantsMatch[1]) {
    const variantsBlock = variantsMatch[1];
    const variantNames = variantsBlock.match(/(\w+):/g);

    if (variantNames) {
      variants.push(...variantNames.map((v) => v.replace(':', '')));
    }
  }

  return variants;
}

/**
 * Extracts prop names from generated component code
 */
function extractPropsFromCode(code: string): string[] {
  const props: string[] = ['className', 'children'];
  const propsMatch = code.match(/interface\s+\w+Props[^{]*\{([^}]+)\}/s);

  if (propsMatch && propsMatch[1]) {
    const propsBlock = propsMatch[1];
    const propNames = propsBlock.match(/(\w+)[\?:]:/g);

    if (propNames) {
      props.push(
        ...propNames
          .map((p) => p.replace(/[\?:]/g, '').trim())
          .filter((p) => p !== 'className' && p !== 'children')
      );
    }
  }

  return [...new Set(props)];
}

/**
 * Generates a usage example for the component
 */
function generateUsageExample(
  componentName: string,
  variants: string[],
  typescript: boolean
): string {
  const fileExt = typescript ? 'tsx' : 'jsx';
  const variantExample = variants.length > 0 ? ` ${variants[0]}="primary"` : '';

  return `\`\`\`${fileExt}
import { ${componentName} } from './components/${componentName}';

function Example() {
  return (
    <${componentName}${variantExample}>
      Click me
    </${componentName}>
  );
}
\`\`\``;
}

// ============================================================================
// Tool Response Formatters
// ============================================================================

/**
 * Formats tool output as MCP response
 */
export function formatToolResponse(output: unknown): { content: Array<{ type: 'text'; text: string }> } {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(output, null, 2),
      },
    ],
  };
}
