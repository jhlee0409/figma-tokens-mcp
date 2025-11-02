/**
 * MCP Server for Figma Tokens
 *
 * This server provides Model Context Protocol (MCP) interface for extracting
 * design tokens from Figma and generating Tailwind CSS configurations.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import type {
  ServerConfig,
  HealthCheckResult,
  ToolContext,
  ExtractTokensInput,
  ConvertToTailwindInput,
  GenerateComponentInput,
} from './types.js';
import {
  extractTokens,
  convertToTailwind,
  generateComponent,
  formatToolResponse,
} from './tools.js';
import { createErrorResponse } from '../utils/mcp-errors.js';
import { Logger, LogLevel } from '../utils/logger.js';
import { fileURLToPath } from 'url';
import { realpathSync } from 'fs';

const SERVER_NAME = 'figma-tokens-mcp';
const SERVER_VERSION = '0.1.0';

/**
 * Creates and configures the MCP server
 */
export function createServer(config: ServerConfig = {}): Server {
  // Initialize logger
  const logger = new Logger({
    level: process.env.LOG_LEVEL === 'DEBUG' ? LogLevel.DEBUG : LogLevel.INFO,
  });

  const server = new Server(
    {
      name: config.name ?? SERVER_NAME,
      version: config.version ?? SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
      },
    }
  );

  // Create tool context
  const toolContext: ToolContext = {
    figmaAccessToken: config.figmaAccessToken ?? process.env.FIGMA_ACCESS_TOKEN,
    logger: {
      debug: (msg) => logger.debug(msg),
      info: (msg) => logger.info(msg),
      warn: (msg) => logger.warn(msg),
      error: (msg, err?) => logger.error(msg, err),
    },
  };

  // Debug: Log token configuration
  logger.info(
    `Figma token configured: ${toolContext.figmaAccessToken ? 'Yes (length: ' + toolContext.figmaAccessToken.length + ')' : 'No'}`
  );

  // List available resources
  server.setRequestHandler(ListResourcesRequestSchema, () => {
    return {
      resources: [
        {
          uri: 'figma-tokens://setup-guide',
          name: 'Setup Guide',
          description: 'Step-by-step guide to set up and use Figma Tokens MCP',
          mimeType: 'text/markdown',
        },
        {
          uri: 'figma-tokens://api-reference',
          name: 'API Reference',
          description: 'Complete reference for all available tools and their parameters',
          mimeType: 'text/markdown',
        },
        {
          uri: 'figma-tokens://examples',
          name: 'Usage Examples',
          description: 'Common usage examples and workflows',
          mimeType: 'text/markdown',
        },
      ],
    };
  });

  // Read resource content
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    switch (uri) {
      case 'figma-tokens://setup-guide':
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: `# Figma Tokens MCP Setup Guide

## Prerequisites
- Figma account
- Figma Personal Access Token

## Getting Your Figma Access Token
1. Go to https://www.figma.com/developers/api#access-tokens
2. Click "Get personal access token"
3. Copy the token (it starts with \`figd_\`)

## Configuration
Set your Figma access token in one of two ways:

### Option 1: Environment Variable
\`\`\`bash
export FIGMA_ACCESS_TOKEN="your_token_here"
\`\`\`

### Option 2: MCP Configuration
Add to your MCP settings:
\`\`\`json
{
  "figmaAccessToken": "your_token_here"
}
\`\`\`

## Basic Workflow
1. **Extract tokens** from a Figma file using \`extract_tokens\`
2. **Convert to Tailwind** using \`convert_to_tailwind\`
3. **Generate components** using \`generate_component\`

## Need Help?
Visit: https://github.com/jhlee0409/figma-tokens-mcp
`,
            },
          ],
        };

      case 'figma-tokens://api-reference':
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: `# Figma Tokens MCP API Reference

## Tools

### extract_tokens
Extract design tokens from a Figma file.

**Parameters:**
- \`figmaFileUrl\` (required): Figma file URL
- \`tokenTypes\` (optional): Array of token types to extract [\`colors\`, \`typography\`]
- \`extractionStrategy\` (optional): \`auto\`, \`variables\`, \`styles\`, or \`mixed\`

**Returns:**
- \`tokens\`: Extracted design tokens hierarchy
- \`metadata\`: Extraction information
- \`statistics\`: Token counts and conflicts

### convert_to_tailwind
Convert design tokens to Tailwind CSS configuration.

**Parameters:**
- \`tokens\` (required): Design tokens object from extract_tokens
- \`tailwindVersion\` (optional): \`v3\` or \`v4\` (default: v4)
- \`preset\` (optional): \`merge\` or \`replace\` (v3 only)
- \`typescript\` (optional): Generate TypeScript files (default: true)

**Returns:**
- \`files\`: Generated configuration files
- \`summary\`: Conversion summary

### generate_component
Generate a React component with CVA variants.

**Parameters:**
- \`componentName\` (required): Component name (PascalCase)
- \`tokens\` (required): Design tokens object
- \`framework\` (optional): \`react\` (default)
- \`typescript\` (optional): Generate TypeScript (default: true)
- \`outputPath\` (optional): Output directory (default: ./src/components)

**Returns:**
- \`component\`: Generated component code
- \`metadata\`: Component metadata
- \`usage\`: Usage example
`,
            },
          ],
        };

      case 'figma-tokens://examples':
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: `# Figma Tokens MCP Usage Examples

## Example 1: Extract and Convert to Tailwind v4

\`\`\`javascript
// Step 1: Extract tokens
const result = await extract_tokens({
  figmaFileUrl: "https://www.figma.com/file/abc123/MyDesign",
  extractionStrategy: "auto"
});

// Step 2: Convert to Tailwind v4
const tailwind = await convert_to_tailwind({
  tokens: result.tokens,
  tailwindVersion: "v4",
  typescript: true
});
\`\`\`

## Example 2: Generate Button Component

\`\`\`javascript
// Extract tokens first
const tokens = await extract_tokens({
  figmaFileUrl: "https://www.figma.com/file/abc123/MyDesign"
});

// Generate component
const component = await generate_component({
  componentName: "Button",
  tokens: tokens.tokens,
  typescript: true
});
\`\`\`

## Example 3: Extract Only Colors

\`\`\`javascript
const result = await extract_tokens({
  figmaFileUrl: "https://www.figma.com/file/abc123/MyDesign",
  tokenTypes: ["colors"],
  extractionStrategy: "variables"
});
\`\`\`
`,
            },
          ],
        };

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  });

  // List available prompts
  server.setRequestHandler(ListPromptsRequestSchema, () => {
    return {
      prompts: [
        {
          name: 'extract-figma-tokens',
          description: 'Extract design tokens from a Figma file',
          arguments: [
            {
              name: 'fileUrl',
              description: 'Figma file URL',
              required: true,
            },
          ],
        },
        {
          name: 'generate-tailwind-v4',
          description: 'Generate Tailwind CSS v4 configuration from tokens',
          arguments: [
            {
              name: 'tokensJson',
              description: 'Design tokens in JSON format (from extract_tokens)',
              required: true,
            },
          ],
        },
      ],
    };
  });

  // Get prompt content
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'extract-figma-tokens': {
        const fileUrl = args?.fileUrl as string;
        return {
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: `Please extract design tokens from this Figma file: ${fileUrl}\n\nUse the extract_tokens tool with the following parameters:\n- figmaFileUrl: ${fileUrl}\n- extractionStrategy: auto (to automatically detect the best extraction method)\n\nThis will extract colors, typography, and other design tokens from the Figma file.`,
              },
            },
          ],
        };
      }

      case 'generate-tailwind-v4': {
        const tokensJson = args?.tokensJson as string;
        return {
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: `Please convert these design tokens to Tailwind CSS v4 configuration:\n\n${tokensJson}\n\nUse the convert_to_tailwind tool with:\n- tokens: (the tokens object above)\n- tailwindVersion: v4\n- typescript: true\n\nThis will generate a modern Tailwind v4 configuration with CSS variables.`,
              },
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  });

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, () => {
    const tools: Tool[] = [
      {
        name: 'extract_tokens',
        description:
          'Extract design tokens (colors, typography) from a Figma file. Supports Variables, Styles, or mixed extraction.',
        inputSchema: {
          type: 'object',
          properties: {
            figmaFileUrl: {
              type: 'string',
              description:
                'Full Figma file URL containing the file key. The URL must be in the format: https://www.figma.com/file/{fileKey}/... or https://www.figma.com/design/{fileKey}/... Example: https://www.figma.com/file/abc123def456/MyDesignSystem',
              pattern: '^https://www\\.figma\\.com/(file|design)/[a-zA-Z0-9]+/',
            },
            tokenTypes: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['colors', 'typography'],
              },
              description:
                'Optional array of specific token types to extract. Available types: "colors" (color tokens from Variables or Styles), "typography" (text styles and font definitions). If omitted or empty, all available token types will be extracted.',
              default: [],
              examples: [['colors'], ['typography'], ['colors', 'typography']],
            },
            extractionStrategy: {
              type: 'string',
              enum: ['auto', 'variables', 'styles', 'mixed'],
              description:
                'Strategy for extracting tokens from Figma: "auto" (automatically detect best method based on file content, recommended), "variables" (extract only from Figma Variables - modern approach), "styles" (extract only from Figma Styles - legacy approach), "mixed" (extract from both and resolve conflicts with priority to Variables). Default: "auto"',
              default: 'auto',
            },
          },
          required: ['figmaFileUrl'],
        },
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
        },
      },
      {
        name: 'convert_to_tailwind',
        description:
          'Convert design tokens to Tailwind CSS configuration files (v3 or v4). Generates JavaScript/TypeScript config or CSS with @theme directive.',
        inputSchema: {
          type: 'object',
          properties: {
            tokens: {
              type: 'object',
              description:
                'Design tokens object obtained from the extract_tokens tool. Must be a valid token hierarchy containing token definitions grouped by type (e.g., colors, typography). The object structure should match the output format from extract_tokens.',
              additionalProperties: true,
            },
            tailwindVersion: {
              type: 'string',
              enum: ['v3', 'v4'],
              description:
                'Target Tailwind CSS version for generated configuration. "v3" generates a JavaScript/TypeScript configuration file compatible with Tailwind CSS v3.x (uses module.exports or ESM). "v4" generates CSS files with @theme directive for Tailwind CSS v4.x (modern CSS-based configuration). Default: "v4"',
              default: 'v4',
            },
            preset: {
              type: 'string',
              enum: ['merge', 'replace'],
              description:
                'Configuration strategy for Tailwind v3 only (ignored for v4). "merge" extends Tailwind\'s default theme (recommended for adding custom tokens), "replace" completely overrides the default theme (use when you want full control). Default: "merge"',
              default: 'merge',
            },
            outputPath: {
              type: 'string',
              description:
                'Relative directory path where generated files will be placed. Must be a relative path (absolute paths are not allowed). Default: "./" (current directory). Example: "./config" or "./src/styles"',
              default: './',
              pattern: '^[^/].*',
            },
            typescript: {
              type: 'boolean',
              description:
                'Whether to generate TypeScript files (.ts) instead of JavaScript (.js) for v3 configuration. For v4, this affects type definition generation. Default: true',
              default: true,
            },
          },
          required: ['tokens'],
        },
        annotations: {
          readOnlyHint: false,
          idempotentHint: true,
        },
      },
      {
        name: 'generate_component',
        description:
          'Generate a React component with class-variance-authority (CVA) variants based on design tokens. Supports TypeScript.',
        inputSchema: {
          type: 'object',
          properties: {
            componentName: {
              type: 'string',
              description:
                'Name of the component to generate. Must follow PascalCase convention (start with uppercase letter, only alphanumeric characters). Maximum length: 100 characters. Examples: "Button", "Card", "AlertDialog", "NavigationMenu"',
              pattern: '^[A-Z][a-zA-Z0-9]*$',
              minLength: 1,
              maxLength: 100,
            },
            tokens: {
              type: 'object',
              description:
                'Design tokens object obtained from the extract_tokens tool. The tokens will be used to generate component variants with appropriate styling based on color, typography, and other design token values.',
              additionalProperties: true,
            },
            sectionUrl: {
              type: 'string',
              description:
                'Optional Figma section/frame URL for visual analysis. Format: https://www.figma.com/file/{fileKey}/...?node-id=... Note: This is a future enhancement - currently, the tool generates a template-based component regardless of this parameter. In future versions, this will enable AI-powered component generation based on the actual Figma design.',
              pattern: '^https://www\\.figma\\.com/(file|design)/[a-zA-Z0-9]+/.*\\?node-id=',
            },
            framework: {
              type: 'string',
              enum: ['react'],
              description:
                'Target component framework. Currently only "react" is supported. The generated component will use React functional component syntax with hooks. Default: "react"',
              default: 'react',
            },
            typescript: {
              type: 'boolean',
              description:
                'Whether to generate a TypeScript component (.tsx) with full type definitions, or a JavaScript component (.jsx). TypeScript provides better type safety and IDE support. Default: true',
              default: true,
            },
            outputPath: {
              type: 'string',
              description:
                'Relative directory path where the component file will be created. Must be a relative path (absolute paths and path traversal are not allowed for security). Default: "./src/components". Example: "./components" or "./src/ui"',
              default: './src/components',
              pattern: '^[^/].*',
            },
          },
          required: ['componentName', 'tokens'],
        },
        annotations: {
          readOnlyHint: false,
          idempotentHint: true,
        },
      },
      {
        name: 'health_check',
        description: 'Check if the MCP server is running and healthy',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
        },
      },
      {
        name: 'get_server_info',
        description: 'Get information about the MCP server',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
        },
      },
    ];

    return { tools };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    logger.info(`Tool called: ${name}`);

    try {
      switch (name) {
        case 'extract_tokens': {
          const input = args as unknown as ExtractTokensInput;
          const result = await extractTokens(input, toolContext);
          return formatToolResponse(result);
        }

        case 'convert_to_tailwind': {
          const input = args as unknown as ConvertToTailwindInput;
          const result = await convertToTailwind(input, toolContext);
          return formatToolResponse(result);
        }

        case 'generate_component': {
          const input = args as unknown as GenerateComponentInput;
          const result = await generateComponent(input, toolContext);
          return formatToolResponse(result);
        }

        case 'health_check': {
          const result: HealthCheckResult = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: SERVER_VERSION,
            figmaTokenConfigured: !!toolContext.figmaAccessToken,
          };

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'get_server_info': {
          const info = {
            name: SERVER_NAME,
            version: SERVER_VERSION,
            description:
              'MCP server for extracting design tokens from Figma and generating Tailwind CSS configurations',
            capabilities: [
              'extract_tokens',
              'convert_to_tailwind',
              'generate_component',
              'health_check',
              'get_server_info',
            ],
            features: [
              'Extract design tokens from Figma (Variables and Styles)',
              'Convert tokens to Tailwind CSS v3 and v4',
              'Generate React components with CVA variants',
              'Automatic conflict resolution',
              'TypeScript support',
            ],
            figmaTokenConfigured: !!toolContext.figmaAccessToken,
          };

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(info, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      logger.error(`Tool execution failed: ${name}`, error as Error);
      return createErrorResponse(error, name);
    }
  });

  return server;
}

/**
 * Starts the MCP server with stdio transport
 */
export async function startServer(config: ServerConfig = {}): Promise<void> {
  const server = createServer(config);
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Log to stderr (stdout is used for MCP communication)
  console.error(`${SERVER_NAME} v${SERVER_VERSION} started`);

  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    console.error(`\nReceived ${signal}, shutting down gracefully...`);

    try {
      await server.close();
      console.error('Server closed successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Register shutdown handlers
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

// Run the server if this is the main module
// Support both ESM (import.meta) and CJS (require.main) contexts
let isMainModule = false;
try {
  // ESM check - resolve real paths to handle symlinks
  if (
    typeof import.meta !== 'undefined' &&
    typeof import.meta.url === 'string' &&
    process.argv[1]
  ) {
    const scriptPath = fileURLToPath(import.meta.url);
    const argPath = realpathSync(process.argv[1]);
    isMainModule = scriptPath === argPath;
  }
} catch {
  // Fallback for CJS
  // eslint-disable-next-line no-undef
  isMainModule = typeof require !== 'undefined' && require.main === module;
}

if (isMainModule) {
  // Check for --version flag
  if (process.argv.includes('--version') || process.argv.includes('-v')) {
    console.log(`${SERVER_NAME} v${SERVER_VERSION}`);
    process.exit(0);
  }

  // Check for --help flag
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
${SERVER_NAME} v${SERVER_VERSION}

MCP server for extracting design tokens from Figma and generating Tailwind CSS configurations.

Usage:
  npx figma-tokens-mcp --figma-api-key=YOUR_KEY --stdio

Options:
  --figma-api-key=KEY Your Figma personal access token (required)
  --stdio             Run in stdio mode for MCP (default)
  --version, -v       Show version number
  --help, -h          Show this help message

Environment Variables (alternative to --figma-api-key):
  FIGMA_ACCESS_TOKEN  Your Figma personal access token
  LOG_LEVEL           Logging level: DEBUG, INFO, WARN, ERROR (default: INFO)

For more information, visit: https://github.com/jhlee0409/figma-tokens-mcp
`);
    process.exit(0);
  }

  // Parse CLI arguments for Figma API key
  let figmaApiKey: string | undefined;

  for (const arg of process.argv) {
    if (arg.startsWith('--figma-api-key=')) {
      figmaApiKey = arg.split('=')[1];
      break;
    }
  }

  // Start server with CLI arg or environment variable
  const token = figmaApiKey || process.env.FIGMA_ACCESS_TOKEN;
  const config: ServerConfig = token ? { figmaAccessToken: token } : {};

  startServer(config).catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

// Default export for backward compatibility
export default createServer;
