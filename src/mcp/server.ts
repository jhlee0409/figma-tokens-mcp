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
import type { ServerConfig, HealthCheckResult } from './types.js';

const SERVER_NAME = 'figma-tokens-mcp';
const SERVER_VERSION = '0.1.0';

/**
 * Creates and configures the MCP server
 */
export function createServer(config: ServerConfig = {}): Server {
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

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, () => {
    const tools: Tool[] = [
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
  server.setRequestHandler(CallToolRequestSchema, (request) => {
    const { name, arguments: _args } = request.params;

    switch (name) {
      case 'health_check': {
        const result: HealthCheckResult = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: SERVER_VERSION,
        };

        return {
          content: [
            {
              type: 'text',
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
          capabilities: ['health_check', 'get_server_info'],
          plannedFeatures: [
            'Extract Figma design tokens',
            'Generate Tailwind CSS config',
            'Support colors, typography, spacing',
          ],
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
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
}

// Run the server if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
