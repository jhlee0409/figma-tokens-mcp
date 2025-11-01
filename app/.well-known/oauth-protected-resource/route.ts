/**
 * OAuth Protected Resource Metadata Endpoint
 *
 * MCP 2025 specification requires this endpoint for OAuth 2.1 compliance.
 * This endpoint provides information about the MCP server's authentication requirements.
 *
 * @see https://modelcontextprotocol.io/specification/2025-03-26
 * @see https://www.rfc-editor.org/rfc/rfc8414
 */

import {
  protectedResourceHandler,
  metadataCorsOptionsRequestHandler,
} from 'mcp-handler';

// OAuth Protected Resource Metadata
// This tells MCP clients how to authenticate with this server
const handler = protectedResourceHandler({
  // For self-contained Bearer token auth, we don't specify an authorization server
  // Clients provide tokens directly via Authorization header
  //
  // If using an external OAuth provider (e.g., Auth0, WorkOS), specify here:
  // authServerUrls: ['https://your-auth-server.com'],
  authServerUrls: [],

  // Resource scopes supported by this server
  scopes: ['figma:read'],

  // Additional metadata
  resource: 'https://figma-tokens-mcp.vercel.app/api/mcp',
});

// CORS handler for preflight requests
const corsHandler = metadataCorsOptionsRequestHandler();

export { handler as GET, corsHandler as OPTIONS };
