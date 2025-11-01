# API Reference

Complete API reference for Figma Tokens MCP.

## Table of Contents

- [MCP Tools](#mcp-tools)
- [Core Modules](#core-modules)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)
- [Code Examples](#code-examples)

## MCP Tools

### extract_tokens

Extract design tokens from Figma files.

**Schema:**
```typescript
{
  name: "extract_tokens",
  description: "Extract design tokens (colors, typography) from Figma files",
  inputSchema: {
    type: "object",
    properties: {
      figmaFileUrl: {
        type: "string",
        description: "Full Figma file URL"
      },
      tokenTypes: {
        type: "array",
        items: { type: "string", enum: ["colors", "typography"] },
        description: "Types of tokens to extract (default: all)"
      },
      extractionStrategy: {
        type: "string",
        enum: ["auto", "variables", "styles", "mixed"],
        description: "Extraction strategy (default: auto)"
      }
    },
    required: ["figmaFileUrl"]
  }
}
```

**Input Type:**
```typescript
interface ExtractTokensInput {
  figmaFileUrl: string;
  tokenTypes?: Array<'colors' | 'typography'>;
  extractionStrategy?: 'auto' | 'variables' | 'styles' | 'mixed';
}
```

**Output Type:**
```typescript
interface ExtractTokensOutput {
  success: boolean;
  tokens: Record<string, unknown>;
  metadata: {
    fileKey: string;
    extractedAt: string;
    extractionStrategy: string;
    sources: ('variables' | 'styles')[];
    tokenCounts: Record<string, number>;
  };
  warnings: TokenWarning[];
  statistics: {
    totalTokens: number;
    byType: Record<string, number>;
    conflicts: number;
    conflictsResolved: number;
  };
}
```

---

### convert_to_tailwind

Convert design tokens to Tailwind CSS configuration.

**Schema:**
```typescript
{
  name: "convert_to_tailwind",
  description: "Convert design tokens to Tailwind CSS configuration (v3 or v4)",
  inputSchema: {
    type: "object",
    properties: {
      tokens: {
        type: "object",
        description: "Token object from extract_tokens"
      },
      tailwindVersion: {
        type: "string",
        enum: ["v3", "v4"],
        description: "Tailwind CSS version (default: v4)"
      },
      preset: {
        type: "string",
        enum: ["merge", "replace"],
        description: "For v3: merge extends defaults, replace overrides (default: merge)"
      },
      outputPath: {
        type: "string",
        description: "Output directory path (default: ./)"
      },
      typescript: {
        type: "boolean",
        description: "Generate TypeScript config (default: true)"
      }
    },
    required: ["tokens"]
  }
}
```

**Input Type:**
```typescript
interface ConvertToTailwindInput {
  tokens: Record<string, unknown>;
  tailwindVersion?: 'v3' | 'v4';
  preset?: 'merge' | 'replace';
  outputPath?: string;
  typescript?: boolean;
}
```

**Output Type:**
```typescript
interface ConvertToTailwindOutput {
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

interface GeneratedFile {
  path: string;
  filename: string;
  content: string;
  type: 'config' | 'css';
}
```

---

### generate_component

Generate React component with CVA variants from design tokens.

**Schema:**
```typescript
{
  name: "generate_component",
  description: "Generate React component with CVA variants from design tokens",
  inputSchema: {
    type: "object",
    properties: {
      componentName: {
        type: "string",
        description: "Component name in PascalCase"
      },
      tokens: {
        type: "object",
        description: "Token object from extract_tokens"
      },
      sectionUrl: {
        type: "string",
        description: "Optional Figma section URL for analysis"
      },
      framework: {
        type: "string",
        enum: ["react"],
        description: "Framework (default: react)"
      },
      typescript: {
        type: "boolean",
        description: "Generate TypeScript (default: true)"
      },
      outputPath: {
        type: "string",
        description: "Output directory (default: ./src/components)"
      }
    },
    required: ["componentName", "tokens"]
  }
}
```

**Input Type:**
```typescript
interface GenerateComponentInput {
  componentName: string;
  tokens: Record<string, unknown>;
  sectionUrl?: string;
  framework?: 'react';
  typescript?: boolean;
  outputPath?: string;
}
```

**Output Type:**
```typescript
interface GenerateComponentOutput {
  success: boolean;
  component: {
    path: string;
    filename: string;
    content: string;
    type: 'component';
  };
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
```

---

### health_check

Check server health and configuration.

**Schema:**
```typescript
{
  name: "health_check",
  description: "Check if the MCP server is healthy and properly configured",
  inputSchema: {
    type: "object",
    properties: {}
  }
}
```

**Output Type:**
```typescript
interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  figmaTokenConfigured: boolean;
}
```

---

### get_server_info

Get server capabilities and information.

**Schema:**
```typescript
{
  name: "get_server_info",
  description: "Get information about server capabilities and features",
  inputSchema: {
    type: "object",
    properties: {}
  }
}
```

**Output Type:**
```typescript
interface ServerInfo {
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  features: string[];
  figmaTokenConfigured: boolean;
}
```

---

## Core Modules

### FigmaAPIClient

Figma REST API client with caching and error handling.

**Location:** `src/core/extractors/figma-api.ts`

**Constructor:**
```typescript
class FigmaAPIClient {
  constructor(config: FigmaAPIClientConfig);
}

interface FigmaAPIClientConfig {
  accessToken: string;
  baseUrl?: string;
  maxRetries?: number;
  initialRetryDelay?: number;
  timeout?: number;
  verbose?: boolean;
  cacheTTL?: number;
}
```

**Methods:**

#### getFile()
```typescript
async getFile(fileKey: string): Promise<FigmaFile>
```
Fetch complete Figma file data.

**Parameters:**
- `fileKey` - Figma file key from URL

**Returns:** Complete file data including document structure

**Throws:**
- `FigmaAuthError` - Authentication failed (401/403)
- `FigmaNotFoundError` - File not found (404)
- `FigmaRateLimitError` - Rate limit exceeded (429)
- `FigmaAPIError` - Other API errors

**Example:**
```typescript
const client = new FigmaAPIClient({ accessToken: 'figd_...' });
const file = await client.getFile('abc123');
console.log(file.name);
```

#### getFileVariables()
```typescript
async getFileVariables(fileKey: string): Promise<FileVariablesResponse>
```
Fetch Variables from Figma file.

**Returns:** Variables, collections, and modes

#### getFileStyles()
```typescript
async getFileStyles(fileKey: string): Promise<Style[]>
```
Fetch Styles from Figma file.

**Returns:** Array of color and text styles

#### getFileNodes()
```typescript
async getFileNodes(
  fileKey: string,
  nodeIds: string[]
): Promise<FileNodesResponse>
```
Fetch specific nodes by ID.

**Parameters:**
- `fileKey` - Figma file key
- `nodeIds` - Array of node IDs

#### parseFigmaUrl()
```typescript
parseFigmaUrl(url: string): ParsedFigmaUrl
```
Parse Figma URL to extract file key and node ID.

**Returns:**
```typescript
interface ParsedFigmaUrl {
  fileKey: string;
  nodeId?: string;
  type: 'file' | 'design';
}
```

**Example:**
```typescript
const parsed = client.parseFigmaUrl(
  'https://www.figma.com/file/abc123/My-File'
);
console.log(parsed.fileKey); // 'abc123'
```

#### Cache Methods
```typescript
clearCache(): void
getCacheStats(): { size: number; keys: string[] }
```

---

### Variables Extractor

Extract design tokens from Figma Variables.

**Location:** `src/core/extractors/variables-extractor.ts`

**Factory Function:**
```typescript
function createVariablesExtractor(
  apiClient: FigmaAPIClient,
  options?: Partial<VariablesExtractorOptions>
): VariablesExtractor

interface VariablesExtractorOptions {
  verbose?: boolean;
  includeMetadata?: boolean;
  resolveAliases?: boolean;
}
```

**Extractor Interface:**
```typescript
interface VariablesExtractor {
  extract(fileKey: string): Promise<VariablesExtractionResult>;
}

interface VariablesExtractionResult {
  variables: ExtractedVariable[];
  tokens: Record<string, TokenNode>;
  collections: Array<{
    id: string;
    name: string;
    modes: Array<{ id: string; name: string }>;
    defaultModeId: string;
  }>;
  pattern?: DetectedPattern;
  warnings: string[];
}
```

**Example:**
```typescript
const apiClient = new FigmaAPIClient({ accessToken: 'figd_...' });
const extractor = createVariablesExtractor(apiClient);
const result = await extractor.extract('abc123');

console.log(result.tokens.colors);
```

---

### Styles Extractor

Extract design tokens from Figma Styles (legacy).

**Location:** `src/core/extractors/styles-extractor.ts`

**Constructor:**
```typescript
class StylesExtractor {
  constructor(
    apiClient: FigmaAPIClient,
    config?: Partial<StylesExtractorConfig>
  );
}

interface StylesExtractorConfig {
  useRem?: boolean;
  baseFontSize?: number;
  normalizeNames?: boolean;
  batchSize?: number;
  verbose?: boolean;
}
```

**Methods:**

#### extractStyles()
```typescript
async extractStyles(fileKey: string): Promise<ExtractedStyles>

interface ExtractedStyles {
  colors: Record<string, ColorToken>;
  typography: Record<string, TypographyToken>;
  metadata: {
    totalStyles: number;
    colorStyles: number;
    textStyles: number;
    extractedAt: string;
  };
}
```

**Example:**
```typescript
const extractor = new StylesExtractor(apiClient, {
  useRem: true,
  baseFontSize: 16
});
const styles = await extractor.extractStyles('abc123');
```

---

### Token Merger

Merge tokens from multiple sources with conflict resolution.

**Location:** `src/core/extractors/merger.ts`

**Function:**
```typescript
function mergeTokens(
  variablesResult: VariablesExtractionResult,
  stylesResult: ExtractedStyles,
  options?: Partial<MergerOptions>
): MergedTokensResult

interface MergerOptions {
  mode: 'variables_only' | 'styles_only' | 'merge';
  resolutionStrategy: ResolutionStrategyType;
  normalizeNames: boolean;
  verbose: boolean;
}

type ResolutionStrategyType =
  | 'variables_priority'
  | 'styles_priority'
  | 'newest'
  | 'rename_both'
  | 'manual';
```

**Example:**
```typescript
const merged = mergeTokens(variablesResult, stylesResult, {
  mode: 'merge',
  resolutionStrategy: 'variables_priority'
});

console.log(merged.conflicts); // Conflict reports
console.log(merged.warnings);  // Warnings
```

---

### Tailwind Converters

Convert tokens to Tailwind CSS configurations.

**Location:** `src/core/converters/`

#### Tailwind v3 Converter
```typescript
function convertToTailwindV3(
  tokens: NormalizedTokens,
  options: ConversionOptions
): ConversionResult

interface ConversionOptions {
  preset: 'merge' | 'replace';
  outputPath: string;
  typescript: boolean;
}
```

#### Tailwind v4 Converter
```typescript
function convertToTailwindV4(
  tokens: NormalizedTokens,
  options: ConversionOptions
): ConversionResult

interface ConversionResult {
  files: GeneratedFile[];
  metadata: {
    tokenCount: number;
    version: string;
  };
  warnings: string[];
}
```

---

### Component Generator

Generate React components with CVA variants.

**Location:** `src/core/generators/react-generator.ts`

**Function:**
```typescript
async function generateReactComponent(
  spec: ComponentSpecification,
  options: GeneratorOptions
): Promise<GeneratedComponent>

interface GeneratorOptions {
  typescript: boolean;
  outputPath: string;
  includeForwardRef: boolean;
}

interface ComponentSpecification {
  name: string;
  type: 'button' | 'input' | 'card' | 'custom';
  variants: ComponentVariantInfo[];
  layout: ComponentLayout;
  baseElement: 'button' | 'input' | 'div' | 'a';
  hasForwardRef: boolean;
}
```

---

## Type Definitions

### Token Types

**Location:** `src/core/types/tokens.ts`

```typescript
// Base token types
type TokenValue = string | number | TokenObject;
type TokenObject = Record<string, TokenValue>;

// Color token
interface ColorToken {
  value: string;
  type: 'color';
  description?: string;
  originalName?: string;
}

// Typography token
interface TypographyToken {
  value: {
    fontFamily?: string | string[];
    fontWeight?: number | string;
    fontSize?: string;
    lineHeight?: string;
    letterSpacing?: string;
  };
  type: 'typography';
  description?: string;
}

// Normalized tokens structure
interface NormalizedTokens {
  colors?: TokenObject;
  fontSize?: Record<string, FontSizeValue>;
  fontFamily?: Record<string, FontFamilyValue>;
  fontWeight?: Record<string, FontWeightValue>;
  spacing?: TokenObject;
  borderRadius?: TokenObject;
  [key: string]: unknown;
}

// Font value types
type FontSizeValue = string | { fontSize: string; lineHeight?: string };
type FontFamilyValue = string | string[];
type FontWeightValue = number | string;
```

### Figma API Types

**Location:** `src/core/extractors/figma-api.ts`

```typescript
// Variable types
interface Variable {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  valuesByMode: Record<string, VariableValue>;
  remote: boolean;
  description: string;
  hiddenFromPublishing: boolean;
  scopes: string[];
  codeSyntax: Record<string, string>;
}

type VariableValue =
  | { type: 'VARIABLE_ALIAS'; id: string }
  | RGBA
  | number
  | string
  | boolean;

interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

// Style types
interface Style {
  key: string;
  name: string;
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
  description: string;
  remote: boolean;
}

interface Paint {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL';
  color?: RGBA;
  opacity?: number;
}

interface TypeStyle {
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeightPx: number;
  letterSpacing: number;
  textAlignHorizontal: string;
  textAlignVertical: string;
}
```

### MCP Types

**Location:** `src/mcp/types.ts`

```typescript
// Server configuration
interface ServerConfig {
  name: string;
  version: string;
  figmaAccessToken?: string;
  logLevel?: LogLevel;
}

// Tool context
interface ToolContext {
  figmaAccessToken: string;
  logger: Logger;
}

// Tool response
interface ToolResponse<T = unknown> {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
  _meta?: T;
}

// Warning type
interface TokenWarning {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  details?: Record<string, unknown>;
}
```

---

## Error Handling

### Error Types

**Location:** `src/core/extractors/figma-api.ts` and `src/utils/mcp-errors.ts`

#### FigmaAPIError
```typescript
class FigmaAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  );
}
```

Base error class for all Figma API errors.

#### FigmaAuthError
```typescript
class FigmaAuthError extends FigmaAPIError {
  constructor(message: string = 'Figma API authentication failed');
}
```

Thrown when authentication fails (401/403).

**Common causes:**
- Invalid access token
- Expired access token
- Missing FIGMA_ACCESS_TOKEN

**How to fix:**
- Generate a new token from Figma
- Update configuration
- Restart MCP server

#### FigmaNotFoundError
```typescript
class FigmaNotFoundError extends FigmaAPIError {
  constructor(resource: string);
}
```

Thrown when resource is not found (404).

**Common causes:**
- Invalid file key
- File was deleted
- No access to file

#### FigmaRateLimitError
```typescript
class FigmaRateLimitError extends FigmaAPIError {
  constructor(
    message: string,
    public retryAfter?: number
  );
}
```

Thrown when rate limit is exceeded (429).

**Handling:**
- Client automatically retries with exponential backoff
- Wait time specified in `retryAfter` (seconds)

#### FigmaInvalidUrlError
```typescript
class FigmaInvalidUrlError extends Error {
  constructor(url: string);
}
```

Thrown when Figma URL is invalid.

**Valid formats:**
- `https://www.figma.com/file/{key}/{name}`
- `https://www.figma.com/design/{key}/{name}`

### MCPToolError
```typescript
class MCPToolError extends Error {
  constructor(
    public toolName: string,
    message: string,
    public details?: unknown
  );
}
```

Thrown when MCP tool execution fails.

### Error Response Format

All errors are returned in MCP-compatible format:

```typescript
{
  content: [{
    type: 'text',
    text: JSON.stringify({
      error: {
        message: string;
        type: string;
        details?: unknown;
      }
    })
  }],
  isError: true
}
```

---

## Code Examples

### Complete Extraction Pipeline

```typescript
import { FigmaAPIClient } from './extractors/figma-api.js';
import { createVariablesExtractor } from './extractors/variables-extractor.js';
import { StylesExtractor } from './extractors/styles-extractor.js';
import { mergeTokens } from './extractors/merger.js';

// 1. Create API client
const client = new FigmaAPIClient({
  accessToken: process.env.FIGMA_ACCESS_TOKEN!,
  verbose: true
});

// 2. Create extractors
const variablesExtractor = createVariablesExtractor(client);
const stylesExtractor = new StylesExtractor(client);

// 3. Extract from both sources
const fileKey = 'abc123';
const variablesResult = await variablesExtractor.extract(fileKey);
const stylesResult = await stylesExtractor.extractStyles(fileKey);

// 4. Merge results
const merged = mergeTokens(variablesResult, stylesResult, {
  mode: 'merge',
  resolutionStrategy: 'variables_priority'
});

// 5. Use tokens
console.log(merged.tokens);
console.log(merged.conflicts);
console.log(merged.warnings);
```

### Custom Token Conversion

```typescript
import { convertToTailwindV4 } from './converters/tailwind-v4.js';
import { validateTokens } from './converters/validator.js';

// 1. Validate tokens
const validation = validateTokens(tokens);
if (!validation.valid) {
  console.error('Invalid tokens:', validation.errors);
  return;
}

// 2. Convert to Tailwind v4
const result = convertToTailwindV4(tokens, {
  outputPath: './config',
  typescript: true
});

// 3. Write files
for (const file of result.files) {
  await writeFile(file.path, file.content);
}
```

### Component Generation

```typescript
import { generateReactComponent } from './generators/react-generator.js';
import { analyzeTokens } from './generators/component-analyzer.js';

// 1. Analyze tokens to create spec
const spec = await analyzeTokens(tokens);

// 2. Enhance spec
spec.name = 'Button';
spec.type = 'button';

// 3. Generate component
const component = await generateReactComponent(spec, {
  typescript: true,
  outputPath: './src/components',
  includeForwardRef: true
});

// 4. Write component file
await writeFile(component.path, component.content);

console.log('Usage example:');
console.log(component.usage);
```

### Custom MCP Client

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// 1. Create transport
const transport = new StdioClientTransport({
  command: 'npx',
  args: ['-y', 'figma-tokens-mcp'],
  env: {
    FIGMA_ACCESS_TOKEN: process.env.FIGMA_ACCESS_TOKEN
  }
});

// 2. Create client
const client = new Client({
  name: 'my-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

// 3. Connect
await client.connect(transport);

// 4. Call tools
const result = await client.callTool('extract_tokens', {
  figmaFileUrl: 'https://www.figma.com/file/abc123/Design-System'
});

console.log(result);
```

---

**Next Steps:**
- See [USAGE.md](USAGE.md) for practical usage examples
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- Check [Examples](../examples/) for real-world scenarios

**Questions?** [Open an issue](https://github.com/jhlee0409/figma-tokens-mcp/issues)
