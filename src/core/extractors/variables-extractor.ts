/**
 * Variables Extractor
 * Fetches Figma variables, detects naming patterns, normalizes token structures,
 * and handles variable aliases correctly.
 *
 * Features:
 * - Extracts COLOR and FLOAT variable types
 * - Handles variable modes (light mode, dark mode, etc.)
 * - Resolves variable aliases (including chains and cross-collection)
 * - Converts RGBA to hex format
 * - Groups variables by collection
 * - Transforms flat variables into hierarchical token structure
 */

import { FigmaAPIClient } from './figma-api';
import { Logger, LogLevel } from '@/utils/logger';
import { Variable, VariableAlias, VariableValue, RGBA, FileVariablesResponse } from './types';
import {
  detectPatterns,
  DetectedPattern,
  normalizeVariableName,
} from '../analyzers/pattern-detector';

/**
 * Extracted variable with metadata
 */
export interface ExtractedVariable {
  /** Variable ID */
  id: string;
  /** Variable name */
  name: string;
  /** Normalized name based on detected pattern */
  normalizedName: string;
  /** Variable type */
  type: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  /** Value (resolved if it was an alias) */
  value: string | number | boolean;
  /** Original value before resolution */
  originalValue: VariableValue;
  /** Collection this variable belongs to */
  collectionId: string;
  /** Collection name */
  collectionName: string;
  /** Mode ID this value is for */
  modeId: string;
  /** Mode name */
  modeName: string;
  /** Variable description */
  description: string;
  /** Variable scopes */
  scopes: string[];
  /** Whether this was an alias that got resolved */
  isAlias: boolean;
  /** If alias, the ID of the variable it references */
  aliasId?: string;
}

/**
 * Hierarchical token structure
 */
export interface TokenNode {
  /** Token value (leaf node) or undefined (branch node) */
  value?: string | number | boolean;
  /** Child nodes (for hierarchical structure) */
  children?: Record<string, TokenNode>;
  /** Original variable metadata */
  metadata?: {
    variableId: string;
    collectionId: string;
    modeId: string;
    description: string;
    scopes: string[];
  };
}

/**
 * Variables extraction result
 */
export interface VariablesExtractionResult {
  /** Extracted variables (flat list) */
  variables: ExtractedVariable[];
  /** Hierarchical token structure */
  tokens: Record<string, TokenNode>;
  /** Collections metadata */
  collections: Array<{
    id: string;
    name: string;
    modes: Array<{ id: string; name: string }>;
    defaultModeId: string;
  }>;
  /** Detected naming pattern */
  pattern?: DetectedPattern;
  /** Warnings and issues encountered */
  warnings: string[];
}

/**
 * Variable extraction options
 */
export interface VariableExtractionOptions {
  /** Filter by variable types (default: ['COLOR', 'FLOAT']) */
  types?: Array<'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN'>;
  /** Mode ID to extract (default: default mode of each collection) */
  modeId?: string;
  /** Whether to resolve aliases (default: true) */
  resolveAliases?: boolean;
  /** Override pattern detection with custom pattern */
  pattern?: DetectedPattern;
  /** Convert pixel values to rem (default: false) */
  convertToRem?: boolean;
  /** Base pixel size for rem conversion (default: 16) */
  remBase?: number;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Variables Extractor
 * Main class for extracting and processing Figma variables
 */
export class VariablesExtractor {
  private readonly client: FigmaAPIClient;
  private readonly logger: Logger;
  private cache = new Map<string, FileVariablesResponse>();

  constructor(client: FigmaAPIClient, verbose = false) {
    this.client = client;
    this.logger = new Logger({ level: verbose ? LogLevel.DEBUG : LogLevel.INFO });
  }

  /**
   * Extracts variables from a Figma file
   *
   * @param fileKey - Figma file key or URL
   * @param options - Extraction options
   * @returns Variables extraction result
   */
  async extract(
    fileKey: string,
    options: VariableExtractionOptions = {}
  ): Promise<VariablesExtractionResult> {
    const startTime = Date.now();

    // Parse file key from URL if needed
    const parsedFileKey = this.parseFileKey(fileKey);

    this.logger.info(`Extracting variables from file: ${parsedFileKey}`);

    // Set default options
    const opts: Required<VariableExtractionOptions> = {
      types: options.types ?? ['COLOR', 'FLOAT'],
      modeId: options.modeId ?? '',
      resolveAliases: options.resolveAliases ?? true,
      pattern: options.pattern ?? ({} as DetectedPattern),
      convertToRem: options.convertToRem ?? false,
      remBase: options.remBase ?? 16,
      verbose: options.verbose ?? false,
    };

    const warnings: string[] = [];

    // Fetch variables from Figma API
    const response = await this.fetchVariables(parsedFileKey);

    if (!response.meta.variables || Object.keys(response.meta.variables).length === 0) {
      this.logger.warn('No variables found in the file');
      return {
        variables: [],
        tokens: {},
        collections: [],
        warnings: ['No variables found in the file'],
      };
    }

    const variables = Object.values(response.meta.variables);
    const collections = Object.values(response.meta.variableCollections);

    this.logger.debug(`Found ${variables.length} variables in ${collections.length} collections`);

    // Detect naming pattern if not provided
    let pattern = opts.pattern;
    if (!pattern.separator) {
      const variableNames = variables.map((v) => v.name);
      const detectionResult = detectPatterns(variableNames);
      pattern =
        detectionResult.recommendedPattern ??
        ({
          separator: '/',
          case: 'kebab',
          depth: 1,
          type: 'mixed',
          confidence: 0,
          sampleCount: 0,
          examples: [],
        } as DetectedPattern);
      this.logger.debug(
        `Detected pattern: ${pattern.separator} separator, ${pattern.case} case, depth ${pattern.depth}`
      );
    }

    // Filter variables by type
    const filteredVariables = variables.filter((v) =>
      opts.types.includes(v.resolvedType as 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN')
    );

    this.logger.debug(
      `Filtered to ${filteredVariables.length} variables of types: ${opts.types.join(', ')}`
    );

    // Build variable lookup map for alias resolution
    const variableMap = new Map<string, Variable>(variables.map((v) => [v.id, v]));

    // Extract variables
    const extractedVariables: ExtractedVariable[] = [];

    for (const variable of filteredVariables) {
      const collection = collections.find((c) => c.id === variable.variableCollectionId);
      if (!collection) {
        warnings.push(`Collection not found for variable: ${variable.name}`);
        continue;
      }

      // Determine which mode to extract
      const modeId = opts.modeId || collection.defaultModeId;
      const mode = collection.modes.find((m) => m.modeId === modeId);
      if (!mode) {
        warnings.push(`Mode not found for variable: ${variable.name}`);
        continue;
      }

      const rawValue = variable.valuesByMode[modeId];
      if (rawValue === undefined) {
        warnings.push(`No value for variable ${variable.name} in mode ${mode.name}`);
        continue;
      }

      // Resolve aliases
      let resolvedValue: string | number | boolean;
      let isAlias = false;
      let aliasId: string | undefined;

      if (this.isVariableAlias(rawValue)) {
        isAlias = true;
        aliasId = rawValue.id;

        if (opts.resolveAliases) {
          try {
            resolvedValue = this.resolveAlias(rawValue, variableMap, modeId, new Set());
          } catch (error) {
            warnings.push(
              `Failed to resolve alias for ${variable.name}: ${(error as Error).message}`
            );
            continue;
          }
        } else {
          // Store alias reference
          const aliasVar = variableMap.get(rawValue.id);
          resolvedValue = aliasVar ? `{${aliasVar.name}}` : `{${rawValue.id}}`;
        }
      } else {
        resolvedValue = this.processValue(
          rawValue,
          variable.resolvedType as 'COLOR' | 'FLOAT',
          opts.convertToRem,
          opts.remBase
        );
      }

      extractedVariables.push({
        id: variable.id,
        name: variable.name,
        normalizedName: normalizeVariableName(variable.name, pattern),
        type: variable.resolvedType as 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN',
        value: resolvedValue,
        originalValue: rawValue,
        collectionId: collection.id,
        collectionName: collection.name,
        modeId,
        modeName: mode.name,
        description: variable.description,
        scopes: variable.scopes,
        isAlias,
        ...(aliasId !== undefined && { aliasId }),
      });
    }

    this.logger.debug(`Extracted ${extractedVariables.length} variables`);

    // Build hierarchical token structure
    const tokens = this.buildTokenHierarchy(extractedVariables, pattern);

    // Build collections metadata
    const collectionsMetadata = collections.map((c) => ({
      id: c.id,
      name: c.name,
      modes: c.modes.map((m) => ({ id: m.modeId, name: m.name })),
      defaultModeId: c.defaultModeId,
    }));

    const duration = Date.now() - startTime;
    this.logger.info(`Extraction completed in ${duration}ms`);

    return {
      variables: extractedVariables,
      tokens,
      collections: collectionsMetadata,
      pattern,
      warnings,
    };
  }

  /**
   * Fetches variables from Figma API with caching
   */
  private async fetchVariables(fileKey: string): Promise<FileVariablesResponse> {
    // Check cache first
    if (this.cache.has(fileKey)) {
      this.logger.debug('Using cached variables response');
      return this.cache.get(fileKey)!;
    }

    const response = await this.client.getFileVariables(fileKey);
    this.cache.set(fileKey, response);
    return response;
  }

  /**
   * Parses file key from URL or returns as-is
   */
  private parseFileKey(fileKeyOrUrl: string): string {
    if (fileKeyOrUrl.startsWith('http')) {
      const parsed = this.client.parseFigmaUrl(fileKeyOrUrl);
      return parsed.fileKey;
    }
    return fileKeyOrUrl;
  }

  /**
   * Type guard for VariableAlias
   */
  private isVariableAlias(value: VariableValue): value is VariableAlias {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      value.type === 'VARIABLE_ALIAS'
    );
  }

  /**
   * Resolves a variable alias recursively
   *
   * @param alias - The alias to resolve
   * @param variableMap - Map of all variables
   * @param modeId - Mode ID to extract value from
   * @param visited - Set of visited IDs to detect circular references
   * @returns Resolved value
   * @throws Error if circular reference detected or variable not found
   */
  private resolveAlias(
    alias: VariableAlias,
    variableMap: Map<string, Variable>,
    modeId: string,
    visited: Set<string>
  ): string | number | boolean {
    if (visited.has(alias.id)) {
      throw new Error(
        `Circular reference detected: ${Array.from(visited).join(' -> ')} -> ${alias.id}`
      );
    }

    const targetVariable = variableMap.get(alias.id);
    if (!targetVariable) {
      throw new Error(`Variable not found: ${alias.id}`);
    }

    visited.add(alias.id);

    const value = targetVariable.valuesByMode[modeId];
    if (value === undefined) {
      throw new Error(`No value for variable ${targetVariable.name} in mode ${modeId}`);
    }

    // Recursively resolve if the target is also an alias
    if (this.isVariableAlias(value)) {
      return this.resolveAlias(value, variableMap, modeId, visited);
    }

    // Process the final value
    return this.processValue(value, targetVariable.resolvedType as 'COLOR' | 'FLOAT', false, 16);
  }

  /**
   * Processes a raw variable value into a usable format
   */
  private processValue(
    value: VariableValue,
    type: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN',
    convertToRem: boolean,
    remBase: number
  ): string | number | boolean {
    if (type === 'COLOR' && typeof value === 'object' && 'r' in value) {
      return this.rgbaToHex(value);
    }

    if (type === 'FLOAT' && typeof value === 'number') {
      if (convertToRem) {
        return `${(value / remBase).toFixed(4)}rem`;
      }
      return value;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    throw new Error(`Unsupported value type: ${JSON.stringify(value)}`);
  }

  /**
   * Converts RGBA color to hex format
   *
   * @param rgba - RGBA color object (values 0-1)
   * @returns Hex color string (#RRGGBB or #RRGGBBAA)
   */
  private rgbaToHex(rgba: RGBA): string {
    const r = Math.round(rgba.r * 255);
    const g = Math.round(rgba.g * 255);
    const b = Math.round(rgba.b * 255);
    const a = Math.round(rgba.a * 255);

    const toHex = (n: number) => n.toString(16).padStart(2, '0');

    if (rgba.a < 1) {
      return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
    }

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Builds hierarchical token structure from flat variables list
   */
  private buildTokenHierarchy(
    variables: ExtractedVariable[],
    pattern: DetectedPattern
  ): Record<string, TokenNode> {
    const root: Record<string, TokenNode> = {};

    for (const variable of variables) {
      const path = this.getTokenPath(variable.normalizedName, pattern);

      // Navigate/create the hierarchy
      let current = root;
      for (let i = 0; i < path.length - 1; i++) {
        const segment = path[i];
        if (!segment) continue;

        if (!current[segment]) {
          current[segment] = { children: {} };
        }

        if (!current[segment].children) {
          current[segment].children = {};
        }

        current = current[segment].children!;
      }

      // Set the leaf value
      const leafKey = path[path.length - 1];
      if (leafKey) {
        current[leafKey] = {
          value: variable.value,
          metadata: {
            variableId: variable.id,
            collectionId: variable.collectionId,
            modeId: variable.modeId,
            description: variable.description,
            scopes: variable.scopes,
          },
        };
      }
    }

    return root;
  }

  /**
   * Converts a variable name to a token path
   */
  private getTokenPath(name: string, pattern: DetectedPattern): string[] {
    if (pattern.separator === 'none') {
      // Split camelCase/PascalCase
      return name
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toLowerCase()
        .split(/\s+/);
    }

    return name.split(pattern.separator).filter((s) => s.length > 0);
  }

  /**
   * Clears the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Creates a variables extractor instance
 *
 * @param client - Figma API client
 * @param verbose - Enable verbose logging
 * @returns Variables extractor instance
 */
export function createVariablesExtractor(
  client: FigmaAPIClient,
  verbose = false
): VariablesExtractor {
  return new VariablesExtractor(client, verbose);
}
