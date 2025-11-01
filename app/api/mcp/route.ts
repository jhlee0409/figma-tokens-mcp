/**
 * Vercel MCP Server Route
 *
 * This route wraps the existing Figma Tokens MCP server
 * and makes it accessible via HTTP/SSE transport on Vercel.
 *
 * Users provide their own Figma tokens via Authorization header.
 */

import { createMcpHandler, withMcpAuth } from 'mcp-handler';
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
import type { AuthInfo } from 'mcp-handler';

// Verify Figma token (we just pass it through, Figma API will validate)
const verifyFigmaToken = async (
  req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> => {
  if (!bearerToken) {
    return undefined;
  }

  // Return auth info with the Figma token
  return {
    token: bearerToken,
    scopes: ['figma:read'],
    clientId: 'figma-user',
  };
};

// Create tool context from auth info
const createToolContext = (authInfo?: AuthInfo): ToolContext => ({
  figmaAccessToken: authInfo?.token,
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
    // Register extract_tokens tool
    server.tool(
      'extract_tokens',
      'Extract design tokens (colors, typography) from a Figma file',
      {
        figmaFileUrl: z.string().url(),
        tokenTypes: z.array(z.enum(['colors', 'typography'])).optional(),
        extractionStrategy: z.enum(['auto', 'variables', 'styles', 'mixed']).optional(),
      },
      async (input, extra) => {
        const toolContext = createToolContext(extra.authInfo);
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
      async (input, extra) => {
        const toolContext = createToolContext(extra.authInfo);
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
      async (input, extra) => {
        const toolContext = createToolContext(extra.authInfo);
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
      async (_, extra) => {
        const toolContext = createToolContext(extra.authInfo);
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
      async (_, extra) => {
        const toolContext = createToolContext(extra.authInfo);
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

// Wrap with authentication to get user's Figma token
const authHandler = withMcpAuth(handler, verifyFigmaToken, {
  required: true, // Figma token is required
  requiredScopes: ['figma:read'], // Require read access
});

// Export for Next.js API routes
export { authHandler as GET, authHandler as POST, authHandler as DELETE };
