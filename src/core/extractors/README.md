# Figma API Client

A comprehensive, type-safe TypeScript client for the Figma REST API with authentication, rate limiting, error handling, and caching.

## Features

- **Authentication**: Secure token-based authentication with validation
- **Rate Limiting**: Automatic exponential backoff for rate limit errors (429)
- **Error Handling**: Custom error types for different failure scenarios
- **Caching**: Built-in 5-minute cache for frequently accessed data
- **Type Safety**: Comprehensive TypeScript types for all Figma API responses
- **URL Parsing**: Extract file keys and node IDs from Figma URLs
- **Logging**: Configurable logging with request timing

## Installation

The client is part of the `figma-tokens-mcp` package. Install dependencies:

```bash
pnpm install
```

## Usage

### Basic Setup

```typescript
import { FigmaAPIClient } from '@/core/extractors';

// Initialize with environment variable
const client = new FigmaAPIClient();

// Or pass token explicitly
const client = new FigmaAPIClient({
  accessToken: 'your-figma-token',
});
```

### Configuration Options

```typescript
const client = new FigmaAPIClient({
  accessToken: 'your-token',
  baseUrl: 'https://api.figma.com/v1', // Default
  maxRetries: 3, // Default
  initialRetryDelay: 1000, // Default (ms)
  timeout: 30000, // Default (ms)
  verbose: false, // Default
  cacheTTL: 300000, // Default (5 minutes)
});
```

### Fetching Files

```typescript
// Get complete file data
const file = await client.getFile('ABC123DEF456');
console.log(file.name);
console.log(file.document.children);

// Access components and styles
console.log(Object.values(file.components));
console.log(Object.values(file.styles));
```

### Working with Variables

```typescript
// Get all variables from a file
const response = await client.getFileVariables('ABC123DEF456');

// Access variables and collections
const variables = response.meta.variables;
const collections = response.meta.variableCollections;

// Iterate through variables
for (const [id, variable] of Object.entries(variables)) {
  console.log(`${variable.name}: ${variable.resolvedType}`);
  console.log(variable.valuesByMode);
}
```

### Fetching Specific Nodes

```typescript
// Get specific nodes with full properties
const nodesResponse = await client.getFileNodes('ABC123DEF456', ['1:2', '1:3']);

// Access node data
const node = nodesResponse.nodes['1:2'];
if ('document' in node) {
  console.log(node.document.name);
  if (node.document.type === 'FRAME') {
    console.log(node.document.fills);
    console.log(node.document.effects);
  }
}
```

### Fetching Styles

```typescript
// Get all styles from a file
const styles = await client.getFileStyles('ABC123DEF456');

// Filter by style type
const fillStyles = styles.filter((s) => s.styleType === 'FILL');
const textStyles = styles.filter((s) => s.styleType === 'TEXT');

console.log(fillStyles.map((s) => s.name));
```

### Parsing Figma URLs

```typescript
// Parse file URL
const parsed = client.parseFigmaUrl('https://www.figma.com/file/ABC123/my-design');
console.log(parsed.fileKey); // 'ABC123'

// Parse URL with node ID
const parsed = client.parseFigmaUrl('https://www.figma.com/file/ABC123/my-design?node-id=1-2');
console.log(parsed.fileKey); // 'ABC123'
console.log(parsed.nodeId); // '1:2'

// Then use the parsed data
const file = await client.getFile(parsed.fileKey);
if (parsed.nodeId) {
  const nodes = await client.getFileNodes(parsed.fileKey, [parsed.nodeId]);
}
```

### Error Handling

```typescript
import {
  FigmaAPIError,
  FigmaAuthError,
  FigmaRateLimitError,
  FigmaNotFoundError,
  FigmaInvalidUrlError,
} from '@/core/extractors';

try {
  const file = await client.getFile('ABC123');
} catch (error) {
  if (error instanceof FigmaAuthError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof FigmaRateLimitError) {
    console.error('Rate limit exceeded. Retry after:', error.retryAfter);
  } else if (error instanceof FigmaNotFoundError) {
    console.error('File not found:', error.message);
  } else if (error instanceof FigmaInvalidUrlError) {
    console.error('Invalid URL:', error.url);
  } else if (error instanceof FigmaAPIError) {
    console.error('API error:', error.message, error.statusCode);
  }
}
```

### Cache Management

```typescript
// Get cache statistics
const stats = client.getCacheStats();
console.log(`Cache size: ${stats.size}`);
console.log(`Cached keys: ${stats.keys.join(', ')}`);

// Clear cache manually
client.clearCache();
```

## Environment Variables

Set your Figma access token as an environment variable:

```bash
export FIGMA_ACCESS_TOKEN=your-figma-token
```

Or create a `.env` file:

```env
FIGMA_ACCESS_TOKEN=your-figma-token
```

## Getting a Figma Access Token

1. Log in to your Figma account
2. Go to Settings → Account → Personal Access Tokens
3. Generate a new token
4. Copy the token and store it securely

## API Reference

### Methods

#### `getFile(fileKey: string): Promise<FigmaFile>`

Get complete file data including document structure, components, and styles.

#### `getFileVariables(fileKey: string): Promise<FileVariablesResponse>`

Get all local variables and variable collections from a file.

#### `getFileStyles(fileKey: string): Promise<Style[]>`

Get all styles metadata from a file.

#### `getFileNodes(fileKey: string, nodeIds: string[]): Promise<FileNodesResponse>`

Get specific nodes with full properties (fills, effects, typography, etc.).

#### `getStyleNodes(fileKey: string, styleIds: string[]): Promise<FileNodesResponse>`

Get node data for styles to extract fills, effects, and typography properties.

#### `parseFigmaUrl(url: string): ParsedFigmaUrl`

Parse a Figma URL to extract file key and optional node ID.

#### `clearCache(): void`

Clear all cached data.

#### `getCacheStats(): { size: number; keys: string[] }`

Get cache statistics.

## TypeScript Types

The client includes comprehensive TypeScript types for all Figma API responses:

- **Paint & Effect Types**: `Paint`, `Effect`, `RGBA`, `ColorStop`
- **Typography Types**: `TypeStyle`
- **Variable Types**: `Variable`, `VariableCollection`, `VariableAlias`
- **Style Types**: `Style`, `PaintStyle`, `TextStyle`, `EffectStyle`
- **Node Types**: `Node`, `FrameNode`, `TextNode`, `ComponentNode`, etc.

All types are exported from `@/core/extractors`.

## Error Types

- `FigmaAPIError`: Base error class for all API errors
- `FigmaAuthError`: Authentication failed (401, 403)
- `FigmaRateLimitError`: Rate limit exceeded (429)
- `FigmaNotFoundError`: Resource not found (404)
- `FigmaInvalidUrlError`: Invalid Figma URL format

## Rate Limiting

The client automatically handles rate limiting:

- Detects 429 responses
- Implements exponential backoff
- Respects `Retry-After` headers
- Configurable retry attempts and delays

## Caching

Built-in caching reduces API calls:

- Default TTL: 5 minutes
- Caches file data and variables
- Cache keys based on request parameters
- Manual cache clearing available

## Testing

Run tests:

```bash
pnpm test
```

Run tests with coverage:

```bash
pnpm test:coverage
```

## Contributing

When adding new API methods:

1. Add types to `types.ts`
2. Implement method in `figma-api.ts`
3. Add comprehensive tests in `tests/extractors/figma-api.test.ts`
4. Update this README

## Resources

- [Figma REST API Documentation](https://www.figma.com/developers/api)
- [Figma Variables API Guide](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma)
- [Figma REST API OpenAPI Spec](https://github.com/figma/rest-api-spec)
- [Figma Plugin API](https://www.figma.com/plugin-docs/api/properties/)
