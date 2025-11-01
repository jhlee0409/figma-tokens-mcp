/**
 * Vercel MCP Server Route
 *
 * This route wraps the existing Figma Tokens MCP server
 * and makes it accessible via HTTP/SSE transport on Vercel.
 */

import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import {
  extractTokens,
  convertToTailwind,
  generateComponent,
} from '../../../src/mcp/tools.js';
import type {
  ExtractTokensInput,
  ConvertToTailwindInput,
  GenerateComponentInput,
  ToolContext,
} from '../../../src/mcp/types.js';

// Create tool context with Figma token from environment
const createToolContext = (): ToolContext => ({
  figmaAccessToken: process.env.FIGMA_ACCESS_TOKEN,
  logger: {
    debug: (msg) => console.debug('[MCP]', msg),
    info: (msg) => console.log('[MCP]', msg),
    warn: (msg) => console.warn('[MCP]', msg),
    error: (msg, err?) => console.error('[MCP]', msg, err),
  },
});

// Create MCP handler
const handler = createMcpHandler(
  async (server) => {
    const toolContext = createToolContext();

    // Register extract_tokens tool
    server.tool(
      'extract_tokens',
      'Extract design tokens (colors, typography) from a Figma file',
      {
        figmaFileUrl: z.string().url(),
        tokenTypes: z.array(z.enum(['colors', 'typography'])).optional(),
        extractionStrategy: z.enum(['auto', 'variables', 'styles', 'mixed']).optional(),
      },
      async (input) => {
        const result = await extractTokens(input as ExtractTokensInput, toolContext);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    // Register convert_to_tailwind tool
    server.tool(
      'convert_to_tailwind',
      'Convert design tokens to Tailwind CSS configuration',
      {
        tokens: z.object({}).passthrough(),
        tailwindVersion: z.enum(['v3', 'v4']).optional(),
        preset: z.enum(['merge', 'replace']).optional(),
        outputPath: z.string().optional(),
        typescript: z.boolean().optional(),
      },
      async (input) => {
        const result = await convertToTailwind(input as ConvertToTailwindInput, toolContext);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    // Register generate_component tool
    server.tool(
      'generate_component',
      'Generate a React component with CVA variants',
      {
        componentName: z.string(),
        tokens: z.object({}).passthrough(),
        sectionUrl: z.string().url().optional(),
        framework: z.enum(['react']).optional(),
        typescript: z.boolean().optional(),
        outputPath: z.string().optional(),
      },
      async (input) => {
        const result = await generateComponent(input as GenerateComponentInput, toolContext);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    // Register health_check tool
    server.tool(
      'health_check',
      'Check if the MCP server is running and healthy',
      {},
      async () => {
        const result = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '0.1.0',
          figmaTokenConfigured: !!toolContext.figmaAccessToken,
        };
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }
    );

    // Register get_server_info tool
    server.tool(
      'get_server_info',
      'Get information about the MCP server',
      {},
      async () => {
        const info = {
          name: 'figma-tokens-mcp',
          version: '0.1.0',
          description: 'MCP server for extracting design tokens from Figma and generating Tailwind CSS configurations',
          capabilities: ['extract_tokens', 'convert_to_tailwind', 'generate_component'],
          figmaTokenConfigured: !!toolContext.figmaAccessToken,
        };
        return {
          content: [{ type: 'text', text: JSON.stringify(info, null, 2) }],
        };
      }
    );
  },
  {}, // Server options
  {
    basePath: '/api',
    verboseLogs: process.env.NODE_ENV === 'development',
  }
);

// Export for Next.js API routes
export { handler as GET, handler as POST, handler as DELETE };
