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
              description: 'Figma file URL (e.g., https://www.figma.com/file/{fileKey}/...)',
            },
            tokenTypes: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['colors', 'typography'],
              },
              description:
                'Optional array of token types to extract. If not specified, all types are extracted.',
            },
            extractionStrategy: {
              type: 'string',
              enum: ['auto', 'variables', 'styles', 'mixed'],
              description:
                'Extraction strategy: auto (detect best), variables (Variables only), styles (Styles only), mixed (both with conflict resolution). Default: auto',
            },
          },
          required: ['figmaFileUrl'],
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
              description: 'Design tokens object from extract_tokens',
            },
            tailwindVersion: {
              type: 'string',
              enum: ['v3', 'v4'],
              description: 'Tailwind CSS version. Default: v4',
            },
            preset: {
              type: 'string',
              enum: ['merge', 'replace'],
              description: 'For v3: merge extends defaults, replace overrides them. Default: merge',
            },
            outputPath: {
              type: 'string',
              description: 'Output directory path. Default: ./',
            },
            typescript: {
              type: 'boolean',
              description: 'Generate TypeScript config files. Default: true',
            },
          },
          required: ['tokens'],
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
              description: 'Component name (must start with uppercase, e.g., Button, Card)',
            },
            tokens: {
              type: 'object',
              description: 'Design tokens object from extract_tokens',
            },
            sectionUrl: {
              type: 'string',
              description:
                'Optional Figma section URL for analysis (future enhancement, currently generates template-based component)',
            },
            framework: {
              type: 'string',
              enum: ['react'],
              description: 'Component framework. Default: react',
            },
            typescript: {
              type: 'boolean',
              description: 'Generate TypeScript component. Default: true',
            },
            outputPath: {
              type: 'string',
              description: 'Output directory path. Default: ./src/components',
            },
          },
          required: ['componentName', 'tokens'],
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
      },
      {
        name: 'get_server_info',
        description: 'Get information about the MCP server',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
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
if (import.meta.url === `file://${process.argv[1]}`) {
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
  npx figma-tokens-mcp

Environment Variables:
  FIGMA_ACCESS_TOKEN  Your Figma personal access token (required)
  LOG_LEVEL           Logging level: DEBUG, INFO, WARN, ERROR (default: INFO)

Options:
  --version, -v       Show version number
  --help, -h          Show this help message

For more information, visit: https://github.com/jhlee0409/figma-tokens-mcp
`);
    process.exit(0);
  }

  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
