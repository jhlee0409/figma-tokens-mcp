/**
 * Type definitions for the MCP server
 */

export interface ServerConfig {
  name?: string;
  version?: string;
  figmaAccessToken?: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  figmaTokenConfigured?: boolean;
}

// ============================================================================
// Tool Input Types
// ============================================================================

/**
 * Input parameters for extract_tokens tool
 */
export interface ExtractTokensInput {
  figmaFileUrl: string;
  tokenTypes?: Array<'colors' | 'typography'>;
  extractionStrategy?: 'auto' | 'variables' | 'styles' | 'mixed';
}

/**
 * Input parameters for convert_to_tailwind tool
 */
export interface ConvertToTailwindInput {
  tokens: Record<string, unknown>;
  tailwindVersion?: 'v3' | 'v4';
  preset?: 'merge' | 'replace';
  outputPath?: string;
  typescript?: boolean;
}

/**
 * Input parameters for generate_component tool
 */
export interface GenerateComponentInput {
  componentName: string;
  tokens: Record<string, unknown>;
  sectionUrl?: string;
  framework?: 'react';
  typescript?: boolean;
  outputPath?: string;
}

// ============================================================================
// Tool Output Types
// ============================================================================

/**
 * Metadata for extracted tokens
 */
export interface TokenMetadata {
  fileKey: string;
  fileName?: string;
  extractedAt: string;
  extractionStrategy: string;
  sources: Array<'variables' | 'styles'>;
  tokenCounts: Record<string, number>;
}

/**
 * Warning message from token extraction
 */
export interface TokenWarning {
  type: 'conflict' | 'missing' | 'invalid' | 'info';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Output from extract_tokens tool
 */
export interface ExtractTokensOutput {
  success: boolean;
  tokens: Record<string, unknown>;
  metadata: TokenMetadata;
  warnings: TokenWarning[];
  statistics: {
    totalTokens: number;
    byType: Record<string, number>;
    conflicts: number;
    conflictsResolved: number;
  };
}

/**
 * Generated file information
 */
export interface GeneratedFile {
  path: string;
  filename: string;
  content: string;
  type: 'config' | 'css' | 'component';
}

/**
 * Output from convert_to_tailwind tool
 */
export interface ConvertToTailwindOutput {
  success: boolean;
  files: GeneratedFile[];
  summary: {
    version: string;
    preset: string;
    tokenTypes: string[];
    totalTokens: number;
  };
  warnings: TokenWarning[];
}

/**
 * Output from generate_component tool
 */
export interface GenerateComponentOutput {
  success: boolean;
  component: GeneratedFile;
  metadata: {
    componentName: string;
    framework: string;
    typescript: boolean;
    variants: string[];
    props: string[];
  };
  usage: string;
  warnings: TokenWarning[];
}

// ============================================================================
// Internal Types
// ============================================================================

/**
 * Context passed to tool handlers
 */
export interface ToolContext {
  figmaAccessToken: string | undefined;
  logger: {
    debug: (message: string) => void;
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string, error?: Error) => void;
  };
}

/**
 * Standard tool response structure
 */
export interface ToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}
