# Architecture Documentation

System architecture and design decisions for Figma Tokens MCP.

## Table of Contents

- [Overview](#overview)
- [High-Level Architecture](#high-level-architecture)
- [Module Design](#module-design)
- [Data Flow](#data-flow)
- [Design Decisions](#design-decisions)
- [Extension Points](#extension-points)
- [Technology Stack](#technology-stack)

## Overview

Figma Tokens MCP is built as a layered architecture following clean architecture principles. The system is designed to be modular, testable, and extensible.

### Core Principles

1. **Separation of Concerns**: Clear boundaries between layers
2. **Dependency Inversion**: Core logic doesn't depend on external services
3. **Single Responsibility**: Each module has one clear purpose
4. **Open/Closed**: Open for extension, closed for modification
5. **Type Safety**: Full TypeScript strict mode for compile-time guarantees

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Protocol Layer                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           MCP Server (stdio transport)                │  │
│  │  - Tool registration                                  │  │
│  │  - Request/response handling                          │  │
│  │  - Error formatting                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Tool Handlers Layer                      │
│  ┌──────────────┬──────────────┬──────────────────────┐    │
│  │ extract_     │ convert_     │ generate_            │    │
│  │ tokens       │ to_tailwind  │ component            │    │
│  └──────────────┴──────────────┴──────────────────────┘    │
│  ┌──────────────┬──────────────┐                            │
│  │ health_      │ get_server_  │                            │
│  │ check        │ info         │                            │
│  └──────────────┴──────────────┘                            │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Core Business Logic Layer                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Extractors                                           │  │
│  │  ┌──────────────┬────────────────┬─────────────┐    │  │
│  │  │ FigmaAPI     │ Variables      │ Styles      │    │  │
│  │  │ Client       │ Extractor      │ Extractor   │    │  │
│  │  └──────────────┴────────────────┴─────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Analyzers                                            │  │
│  │  ┌──────────────┬────────────────┬─────────────┐    │  │
│  │  │ Pattern      │ Normalizer     │ Conflict    │    │  │
│  │  │ Detector     │                │ Resolver    │    │  │
│  │  └──────────────┴────────────────┴─────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Converters                                           │  │
│  │  ┌──────────────┬────────────────┬─────────────┐    │  │
│  │  │ Tailwind v3  │ Tailwind v4    │ Validator   │    │  │
│  │  │ Converter    │ Converter      │             │    │  │
│  │  └──────────────┴────────────────┴─────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Generators                                           │  │
│  │  ┌──────────────┬────────────────┬─────────────┐    │  │
│  │  │ React        │ Component      │ Tailwind    │    │  │
│  │  │ Generator    │ Analyzer       │ Mapper      │    │  │
│  │  └──────────────┴────────────────┴─────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Utility & Infrastructure                   │
│  ┌──────────────┬──────────────┬──────────────────────┐    │
│  │ Logger       │ URL Parser   │ Token Validator      │    │
│  └──────────────┴──────────────┴──────────────────────┘    │
│  ┌──────────────┬──────────────┐                            │
│  │ MCP Errors   │ Pattern      │                            │
│  │              │ Detector     │                            │
│  └──────────────┴──────────────┘                            │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Figma REST API                           │  │
│  │  - GET /v1/files/:key                                 │  │
│  │  - GET /v1/files/:key/variables/local                 │  │
│  │  - GET /v1/files/:key/styles                          │  │
│  │  - GET /v1/files/:key/nodes                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Module Design

### 1. MCP Server Layer

**Purpose**: Handle MCP protocol communication

**Location**: `src/mcp/server.ts`

**Responsibilities**:
- Initialize MCP server with stdio transport
- Register tool handlers
- Handle tool execution requests
- Format responses according to MCP spec
- Manage server lifecycle (startup, shutdown)

**Key Components**:
```typescript
// Server initialization
const server = new Server({
  name: 'figma-tokens-mcp',
  version: '0.1.0'
}, {
  capabilities: {
    tools: {} // Tool capabilities
  }
});

// Tool registration
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [/* tool definitions */]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Route to appropriate handler
});
```

**Design Decisions**:
- **stdio transport**: Simplest for MCP clients like Claude Desktop
- **Centralized error handling**: All errors formatted consistently
- **Tool context**: Shared context (token, logger) passed to all tools

### 2. Tool Handlers Layer

**Purpose**: Implement MCP tool logic

**Location**: `src/mcp/tools.ts`

**Responsibilities**:
- Validate input parameters
- Call core business logic
- Format responses for MCP
- Handle tool-specific errors

**Tool Implementation Pattern**:
```typescript
async function handleExtractTokens(
  params: ExtractTokensInput,
  context: ToolContext
): Promise<ToolResponse<ExtractTokensOutput>> {
  try {
    // 1. Validate params
    validateRequiredParams(params, ['figmaFileUrl'], 'extract_tokens');

    // 2. Call core logic
    const client = new FigmaAPIClient({ accessToken: context.figmaAccessToken });
    const result = await extractTokensCore(client, params);

    // 3. Format response
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  } catch (error) {
    return createErrorResponse(error, 'extract_tokens');
  }
}
```

**Design Decisions**:
- **Parameter validation first**: Fail fast on invalid input
- **Consistent error handling**: All errors go through `createErrorResponse`
- **Structured responses**: Always return JSON-formatted text
- **Context injection**: Dependencies injected via context

### 3. Core Business Logic

#### 3.1 Extractors Module

**Purpose**: Extract data from Figma API

**Components**:

**FigmaAPIClient** (`figma-api.ts`):
- HTTP client wrapper around Figma REST API
- Exponential backoff retry logic
- Response caching (5 min TTL)
- Type-safe API methods

```typescript
class FigmaAPIClient {
  private cache = new Map<string, CacheEntry>();

  async getFile(fileKey: string): Promise<FigmaFile> {
    // 1. Check cache
    const cached = this.getFromCache(`file:${fileKey}`);
    if (cached) return cached;

    // 2. Make API request with retry
    const response = await this.requestWithRetry('GET', `/files/${fileKey}`);

    // 3. Cache response
    this.setCache(`file:${fileKey}`, response.data);

    return response.data;
  }
}
```

**VariablesExtractor** (`variables-extractor.ts`):
- Extract Variables from Figma
- Resolve variable aliases (including chains)
- Convert RGBA to hex
- Build hierarchical structure

**StylesExtractor** (`styles-extractor.ts`):
- Extract Styles from Figma
- Fetch style nodes in batches
- Convert typography properties
- Normalize style names

**Design Decisions**:
- **Caching**: Reduces API calls and rate limiting
- **Retry logic**: Handles transient failures automatically
- **Factory pattern**: `createVariablesExtractor` for dependency injection
- **Alias resolution**: Recursive resolution with circular detection

#### 3.2 Analyzers Module

**Purpose**: Analyze and normalize tokens

**Components**:

**PatternDetector** (`pattern-detector.ts`):
```typescript
function detectPattern(names: string[]): DetectedPattern {
  // Analyze:
  // - Separator character (/, -, _, .)
  // - Case convention (kebab, camel, snake, pascal)
  // - Hierarchy depth
  // - Naming type (semantic vs literal)
  // - Confidence score

  return {
    separator: '/',
    case: 'kebab',
    depth: 3,
    type: 'semantic',
    confidence: 0.95
  };
}
```

**Normalizer** (`normalizer.ts`):
```typescript
function normalizeTokens(
  tokens: GenericToken[],
  pattern: DetectedPattern
): NormalizedToken[] {
  // Transform token names to match pattern
  // Build hierarchical structure
  // Preserve metadata
}
```

**ConflictResolver** (`conflict-resolver.ts`):
```typescript
function resolveConflicts(
  tokens: ResolvedToken[],
  strategy: ResolutionStrategyType
): ConflictReport[] {
  // Detect conflicts
  // Apply resolution strategy
  // Generate reports
}
```

**Design Decisions**:
- **Pattern detection**: Automatic vs manual configuration
- **Confidence scoring**: Indicates reliability of detected pattern
- **Pluggable strategies**: Different resolution strategies for different needs

#### 3.3 Converters Module

**Purpose**: Convert tokens to target formats

**Components**:

**Tailwind v3 Converter**:
```typescript
function convertToTailwindV3(
  tokens: NormalizedTokens,
  options: ConversionOptions
): ConversionResult {
  // Generate theme config
  // Apply preset (merge or replace)
  // Validate JavaScript syntax
  // Return config file
}
```

**Tailwind v4 Converter**:
```typescript
function convertToTailwindV4(
  tokens: NormalizedTokens,
  options: ConversionOptions
): ConversionResult {
  // Generate CSS variables with @theme
  // Generate minimal config
  // Validate CSS syntax
  // Return both files
}
```

**Design Decisions**:
- **Version-specific converters**: Clean separation of v3 and v4 logic
- **Syntax validation**: Catch errors before file generation
- **Preset system**: Flexible merge vs replace strategies

#### 3.4 Generators Module

**Purpose**: Generate code artifacts

**Components**:

**ReactGenerator** (`react-generator.ts`):
```typescript
function generateReactComponent(
  spec: ComponentSpecification,
  options: GeneratorOptions
): GeneratedComponent {
  // Generate CVA config
  // Generate TypeScript types
  // Generate component code
  // Generate usage example
}
```

**ComponentAnalyzer** (`component-analyzer.ts`):
```typescript
async function analyzeComponent(
  figmaUrl: string,
  client: FigmaAPIClient
): Promise<ComponentSpecification> {
  // Fetch Figma section
  // Analyze component structure
  // Extract variants
  // Detect component type
}
```

**TailwindMapper** (`tailwind-mapper.ts`):
```typescript
function mapTokensToClasses(
  tokens: NormalizedTokens
): Record<string, string> {
  // Map colors to bg-, text-, border- utilities
  // Map spacing to p-, m-, gap- utilities
  // Map typography to text- utilities
}
```

**Design Decisions**:
- **Template-based generation**: Currently uses templates (MVP)
- **Future: Figma analysis**: Will analyze actual Figma components
- **CVA integration**: Industry-standard variant management

## Data Flow

### Token Extraction Flow

```
1. Input: Figma File URL
   │
   ├─> Parse URL → Extract file key
   │
2. Fetch Data from Figma API
   │
   ├─> GET /files/:key → File metadata
   ├─> GET /files/:key/variables/local → Variables
   └─> GET /files/:key/styles → Styles
   │
3. Extract & Transform
   │
   ├─> Variables Extractor
   │   ├─> Resolve aliases
   │   ├─> Convert colors (RGBA → hex)
   │   ├─> Detect naming pattern
   │   └─> Build hierarchy
   │
   └─> Styles Extractor
       ├─> Fetch style nodes
       ├─> Extract properties
       └─> Normalize names
   │
4. Merge & Resolve
   │
   ├─> Detect conflicts
   ├─> Apply resolution strategy
   ├─> Generate warnings
   └─> Build unified hierarchy
   │
5. Output: Hierarchical Tokens
   {
     colors: { primary: { 500: '#0066cc' } },
     fontSize: { base: '16px' }
   }
```

### Tailwind Conversion Flow

```
1. Input: Token Hierarchy
   │
2. Validate Structure
   │
   ├─> Check required fields
   ├─> Validate token values
   └─> Ensure proper nesting
   │
3. Transform to Target Format
   │
   ├─> Tailwind v3
   │   ├─> Build theme config
   │   ├─> Apply preset (extend vs override)
   │   └─> Generate JavaScript/TypeScript
   │
   └─> Tailwind v4
       ├─> Generate CSS variables
       ├─> Apply @theme directive
       └─> Generate minimal config
   │
4. Validate Syntax
   │
   ├─> JavaScript validation
   └─> CSS validation
   │
5. Output: Configuration Files
   - tailwind.config.ts
   - design-tokens.css (v4 only)
```

### Component Generation Flow

```
1. Input: Component Name + Tokens
   │
2. Analyze Tokens
   │
   ├─> Extract color variants
   ├─> Extract size variants
   ├─> Detect states
   └─> Build specification
   │
3. Generate CVA Config
   │
   ├─> Map tokens to variants
   ├─> Generate base classes
   ├─> Define default variants
   └─> Create compound variants
   │
4. Generate Component Code
   │
   ├─> Generate imports
   ├─> Generate CVA definition
   ├─> Generate TypeScript types
   ├─> Generate component function
   └─> Generate usage example
   │
5. Output: Component File
   - Button.tsx
   - Complete with types and examples
```

## Design Decisions

### 1. Why TypeScript Strict Mode?

**Decision**: Use TypeScript with strict mode enabled

**Rationale**:
- Catch errors at compile time
- Better IDE support and autocomplete
- Self-documenting code with types
- Prevents null/undefined bugs
- Forces explicit error handling

**Trade-offs**:
- Longer development time
- Steeper learning curve
- More verbose code

**Verdict**: Benefits outweigh costs for this project

### 2. Why Factory Pattern for Extractors?

**Decision**: Use factory functions instead of direct instantiation

```typescript
// Factory pattern
const extractor = createVariablesExtractor(apiClient, options);

// vs Direct instantiation
const extractor = new VariablesExtractor(apiClient, options);
```

**Rationale**:
- Dependency injection for testing
- Easier to mock in tests
- Can return different implementations
- Cleaner initialization logic

### 3. Why Caching in API Client?

**Decision**: Implement 5-minute TTL cache for API responses

**Rationale**:
- Figma API has rate limits
- File data doesn't change frequently
- Reduces latency for repeated requests
- Improves developer experience

**Implementation**:
```typescript
private cache = new Map<string, CacheEntry>();
private cacheTTL = 5 * 60 * 1000; // 5 minutes
```

### 4. Why Separate v3 and v4 Converters?

**Decision**: Separate converter implementations for Tailwind v3 and v4

**Rationale**:
- Different output formats (JS vs CSS)
- Different configuration structures
- Easier to maintain separately
- Clearer code organization

**Alternative Considered**: Single converter with version flag
**Why Rejected**: Would require too many conditionals

### 5. Why Pattern Detection?

**Decision**: Automatically detect naming patterns

**Rationale**:
- Teams use different conventions
- Manual configuration is tedious
- Pattern detection works 90% of the time
- Can be overridden if needed

**Implementation**:
```typescript
interface DetectedPattern {
  separator: string;     // '/', '-', '_', '.'
  case: CaseStyle;       // 'kebab', 'camel', etc.
  depth: number;         // Hierarchy depth
  confidence: number;    // 0-1
}
```

### 6. Why MCP Protocol?

**Decision**: Use Model Context Protocol for AI integration

**Rationale**:
- Standard protocol for AI tools
- Works with Claude Desktop out of the box
- Growing ecosystem of MCP clients
- Structured tool definitions
- Type-safe communication

**Alternatives Considered**:
- REST API: More complex for AI integration
- CLI only: No AI integration
- Custom protocol: Reinventing the wheel

## Extension Points

### 1. Adding New Token Types

To add support for new token types (e.g., shadows, gradients):

```typescript
// 1. Define type in tokens.ts
interface ShadowToken {
  value: {
    x: number;
    y: number;
    blur: number;
    color: string;
  };
  type: 'shadow';
}

// 2. Add extractor logic
function extractShadows(styles: Style[]): Record<string, ShadowToken> {
  // Implementation
}

// 3. Add to merger
function mergeShadowTokens(...) {
  // Implementation
}

// 4. Add Tailwind converter
function convertShadowsToTailwind(tokens: ShadowToken[]) {
  // Implementation
}
```

### 2. Adding New Frameworks

To add Vue/Svelte/Angular component generation:

```typescript
// 1. Create generator in generators/
export function generateVueComponent(
  spec: ComponentSpecification,
  options: GeneratorOptions
): GeneratedComponent {
  // Vue-specific generation logic
}

// 2. Add to tool handler
if (framework === 'vue') {
  return generateVueComponent(spec, options);
}
```

### 3. Adding New Conversion Targets

To add CSS-in-JS or other format support:

```typescript
// 1. Create converter in converters/
export function convertToStyled(
  tokens: NormalizedTokens
): ConversionResult {
  // Generate styled-components theme
}

// 2. Add to convert_to_tailwind tool
if (targetFormat === 'styled') {
  return convertToStyled(tokens);
}
```

### 4. Custom Resolution Strategies

To add custom conflict resolution:

```typescript
// 1. Define strategy type
type CustomStrategy = (conflict: Conflict) => ResolvedToken;

// 2. Register strategy
const strategies: Record<string, CustomStrategy> = {
  'variables_priority': resolveWithVariablesPriority,
  'my_custom_strategy': resolveMyWay
};

// 3. Use in merger
const resolved = strategies[options.strategy](conflict);
```

## Technology Stack

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@modelcontextprotocol/sdk` | ^1.0.4 | MCP protocol implementation |
| `axios` | ^1.7.9 | HTTP client for Figma API |
| `class-variance-authority` | ^0.7.1 | CVA for React components |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.7.2 | Type system and compiler |
| `tsup` | ^8.3.5 | Fast TypeScript bundler |
| `vitest` | ^2.1.8 | Modern testing framework |
| `eslint` | ^9.17.0 | Code linting |
| `prettier` | ^3.4.2 | Code formatting |

### Build Tools

- **tsup**: Fast bundling with zero config
- **TypeScript**: Compilation and type checking
- **pnpm**: Fast, efficient package management

### Testing

- **Vitest**: Fast unit testing with native ESM support
- **Coverage**: @vitest/coverage-v8 for code coverage

### Code Quality

- **ESLint**: TypeScript-specific rules
- **Prettier**: Consistent formatting
- **Strict TypeScript**: Full strict mode enabled

---

**Related Documentation**:
- [API Reference](API.md) - Complete API docs
- [Usage Guide](USAGE.md) - How to use the tools
- [Contributing](../CONTRIBUTING.md) - How to contribute

**Questions?** [Open a discussion](https://github.com/jhlee0409/figma-tokens-mcp/discussions)
