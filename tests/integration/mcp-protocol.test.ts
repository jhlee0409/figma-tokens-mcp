/**
 * Integration tests for MCP Protocol Compliance
 *
 * Tests the MCP server's compliance with the Model Context Protocol specification.
 * These tests verify that all tools are properly registered, schemas are correct,
 * and responses follow the MCP format.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createServer } from '../../src/mcp/server';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

describe('MCP Protocol Compliance', () => {
  let server: Server;

  beforeEach(() => {
    server = createServer({
      figmaAccessToken: 'test-token',
    });
  });

  describe('Server Initialization', () => {
    it('should create a valid MCP server instance', () => {
      expect(server).toBeDefined();
      expect(server).toBeInstanceOf(Server);
    });

    it('should register tools capability', () => {
      const serverInfo = (server as any).serverInfo;
      expect(serverInfo).toBeDefined();
      expect(serverInfo.capabilities).toBeDefined();
      expect(serverInfo.capabilities.tools).toBeDefined();
    });
  });

  describe('ListTools Request', () => {
    it('should list all 5 tools', async () => {
      const response = await server.request(
        {
          method: 'tools/list',
          params: {},
        },
        ListToolsRequestSchema
      );

      expect(response.tools).toBeDefined();
      expect(response.tools).toHaveLength(5);
    });

    it('should include extract_tokens tool', async () => {
      const response = await server.request(
        {
          method: 'tools/list',
          params: {},
        },
        ListToolsRequestSchema
      );

      const extractTool = response.tools.find((t) => t.name === 'extract_tokens');
      expect(extractTool).toBeDefined();
      expect(extractTool?.description).toBeTruthy();
      expect(extractTool?.inputSchema).toBeDefined();
      expect(extractTool?.inputSchema.type).toBe('object');
      expect(extractTool?.inputSchema.properties).toBeDefined();
      expect(extractTool?.inputSchema.required).toContain('figmaFileUrl');
    });

    it('should include convert_to_tailwind tool', async () => {
      const response = await server.request(
        {
          method: 'tools/list',
          params: {},
        },
        ListToolsRequestSchema
      );

      const convertTool = response.tools.find((t) => t.name === 'convert_to_tailwind');
      expect(convertTool).toBeDefined();
      expect(convertTool?.description).toBeTruthy();
      expect(convertTool?.inputSchema).toBeDefined();
      expect(convertTool?.inputSchema.required).toContain('tokens');
    });

    it('should include generate_component tool', async () => {
      const response = await server.request(
        {
          method: 'tools/list',
          params: {},
        },
        ListToolsRequestSchema
      );

      const generateTool = response.tools.find((t) => t.name === 'generate_component');
      expect(generateTool).toBeDefined();
      expect(generateTool?.description).toBeTruthy();
      expect(generateTool?.inputSchema).toBeDefined();
      expect(generateTool?.inputSchema.required).toContain('componentName');
      expect(generateTool?.inputSchema.required).toContain('tokens');
    });

    it('should include health_check tool', async () => {
      const response = await server.request(
        {
          method: 'tools/list',
          params: {},
        },
        ListToolsRequestSchema
      );

      const healthTool = response.tools.find((t) => t.name === 'health_check');
      expect(healthTool).toBeDefined();
      expect(healthTool?.description).toBeTruthy();
      expect(healthTool?.inputSchema).toBeDefined();
    });

    it('should include get_server_info tool', async () => {
      const response = await server.request(
        {
          method: 'tools/list',
          params: {},
        },
        ListToolsRequestSchema
      );

      const infoTool = response.tools.find((t) => t.name === 'get_server_info');
      expect(infoTool).toBeDefined();
      expect(infoTool?.description).toBeTruthy();
      expect(infoTool?.inputSchema).toBeDefined();
    });
  });

  describe('Tool Schemas', () => {
    it('extract_tokens should have valid JSON Schema', async () => {
      const response = await server.request(
        {
          method: 'tools/list',
          params: {},
        },
        ListToolsRequestSchema
      );

      const tool = response.tools.find((t) => t.name === 'extract_tokens');
      const schema = tool?.inputSchema;

      expect(schema?.type).toBe('object');
      expect(schema?.properties?.figmaFileUrl).toBeDefined();
      expect(schema?.properties?.figmaFileUrl.type).toBe('string');
      expect(schema?.properties?.tokenTypes).toBeDefined();
      expect(schema?.properties?.tokenTypes.type).toBe('array');
      expect(schema?.properties?.extractionStrategy).toBeDefined();
      expect(schema?.properties?.extractionStrategy.enum).toEqual([
        'auto',
        'variables',
        'styles',
        'mixed',
      ]);
    });

    it('convert_to_tailwind should have valid JSON Schema', async () => {
      const response = await server.request(
        {
          method: 'tools/list',
          params: {},
        },
        ListToolsRequestSchema
      );

      const tool = response.tools.find((t) => t.name === 'convert_to_tailwind');
      const schema = tool?.inputSchema;

      expect(schema?.type).toBe('object');
      expect(schema?.properties?.tokens).toBeDefined();
      expect(schema?.properties?.tokens.type).toBe('object');
      expect(schema?.properties?.tailwindVersion).toBeDefined();
      expect(schema?.properties?.tailwindVersion.enum).toEqual(['v3', 'v4']);
      expect(schema?.properties?.preset).toBeDefined();
      expect(schema?.properties?.preset.enum).toEqual(['merge', 'replace']);
      expect(schema?.properties?.typescript).toBeDefined();
      expect(schema?.properties?.typescript.type).toBe('boolean');
    });

    it('generate_component should have valid JSON Schema', async () => {
      const response = await server.request(
        {
          method: 'tools/list',
          params: {},
        },
        ListToolsRequestSchema
      );

      const tool = response.tools.find((t) => t.name === 'generate_component');
      const schema = tool?.inputSchema;

      expect(schema?.type).toBe('object');
      expect(schema?.properties?.componentName).toBeDefined();
      expect(schema?.properties?.componentName.type).toBe('string');
      expect(schema?.properties?.tokens).toBeDefined();
      expect(schema?.properties?.tokens.type).toBe('object');
      expect(schema?.properties?.framework).toBeDefined();
      expect(schema?.properties?.framework.enum).toEqual(['react']);
      expect(schema?.properties?.typescript).toBeDefined();
      expect(schema?.properties?.typescript.type).toBe('boolean');
    });
  });

  describe('CallTool Requests', () => {
    it('health_check should return valid response', async () => {
      const response = await server.request(
        {
          method: 'tools/call',
          params: {
            name: 'health_check',
            arguments: {},
          },
        },
        CallToolRequestSchema
      );

      expect(response.content).toBeDefined();
      expect(response.content).toHaveLength(1);
      expect(response.content[0].type).toBe('text');

      const result = JSON.parse(response.content[0].text);
      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
      expect(result.version).toBe('0.1.0');
      expect(result.figmaTokenConfigured).toBe(true);
    });

    it('get_server_info should return valid response', async () => {
      const response = await server.request(
        {
          method: 'tools/call',
          params: {
            name: 'get_server_info',
            arguments: {},
          },
        },
        CallToolRequestSchema
      );

      expect(response.content).toBeDefined();
      expect(response.content).toHaveLength(1);
      expect(response.content[0].type).toBe('text');

      const info = JSON.parse(response.content[0].text);
      expect(info.name).toBe('figma-tokens-mcp');
      expect(info.version).toBe('0.1.0');
      expect(info.description).toBeTruthy();
      expect(info.capabilities).toHaveLength(5);
      expect(info.capabilities).toContain('extract_tokens');
      expect(info.capabilities).toContain('convert_to_tailwind');
      expect(info.capabilities).toContain('generate_component');
      expect(info.capabilities).toContain('health_check');
      expect(info.capabilities).toContain('get_server_info');
      expect(info.features).toBeDefined();
      expect(Array.isArray(info.features)).toBe(true);
    });

    it('should return error for unknown tool', async () => {
      const response = await server.request(
        {
          method: 'tools/call',
          params: {
            name: 'unknown_tool',
            arguments: {},
          },
        },
        CallToolRequestSchema
      );

      expect(response.isError).toBe(true);
      expect(response.content).toBeDefined();
      expect(response.content[0].type).toBe('text');
      expect(response.content[0].text).toContain('Unknown tool');
    });

    it('should return error for invalid parameters', async () => {
      const response = await server.request(
        {
          method: 'tools/call',
          params: {
            name: 'extract_tokens',
            arguments: {},
          },
        },
        CallToolRequestSchema
      );

      expect(response.isError).toBe(true);
      expect(response.content).toBeDefined();
      expect(response.content[0].type).toBe('text');
      expect(response.content[0].text).toContain('required');
    });
  });

  describe('Response Format Compliance', () => {
    it('should return responses in MCP format', async () => {
      const response = await server.request(
        {
          method: 'tools/call',
          params: {
            name: 'health_check',
            arguments: {},
          },
        },
        CallToolRequestSchema
      );

      // MCP response must have content array
      expect(response).toHaveProperty('content');
      expect(Array.isArray(response.content)).toBe(true);

      // Each content item must have type
      response.content.forEach((item) => {
        expect(item).toHaveProperty('type');
        expect(item.type).toBe('text');
      });
    });

    it('should return proper JSON in text content', async () => {
      const response = await server.request(
        {
          method: 'tools/call',
          params: {
            name: 'get_server_info',
            arguments: {},
          },
        },
        CallToolRequestSchema
      );

      const text = response.content[0].text;
      expect(() => JSON.parse(text)).not.toThrow();

      const parsed = JSON.parse(text);
      expect(typeof parsed).toBe('object');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing Figma token gracefully', async () => {
      const serverWithoutToken = createServer({
        figmaAccessToken: undefined,
      });

      const response = await serverWithoutToken.request(
        {
          method: 'tools/call',
          params: {
            name: 'extract_tokens',
            arguments: {
              figmaFileUrl: 'https://www.figma.com/file/abc123/test',
            },
          },
        },
        CallToolRequestSchema
      );

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('access token');
    });

    it('should handle invalid URL format', async () => {
      const response = await server.request(
        {
          method: 'tools/call',
          params: {
            name: 'extract_tokens',
            arguments: {
              figmaFileUrl: 'not-a-url',
            },
          },
        },
        CallToolRequestSchema
      );

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Invalid');
    });

    it('should validate token structure in convert_to_tailwind', async () => {
      const response = await server.request(
        {
          method: 'tools/call',
          params: {
            name: 'convert_to_tailwind',
            arguments: {
              tokens: {},
            },
          },
        },
        CallToolRequestSchema
      );

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('token');
    });

    it('should validate component name format', async () => {
      const response = await server.request(
        {
          method: 'tools/call',
          params: {
            name: 'generate_component',
            arguments: {
              componentName: 'invalid-name',
              tokens: { colors: { primary: '#000' } },
            },
          },
        },
        CallToolRequestSchema
      );

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('Component name');
    });
  });

  describe('Configuration', () => {
    it('should accept custom server name', () => {
      const customServer = createServer({
        name: 'custom-figma-tokens',
      });

      expect(customServer).toBeDefined();
    });

    it('should accept custom version', () => {
      const customServer = createServer({
        version: '2.0.0',
      });

      expect(customServer).toBeDefined();
    });

    it('should use environment variable for Figma token', () => {
      const originalEnv = process.env.FIGMA_ACCESS_TOKEN;
      process.env.FIGMA_ACCESS_TOKEN = 'env-token';

      const envServer = createServer();
      expect(envServer).toBeDefined();

      // Restore original
      if (originalEnv) {
        process.env.FIGMA_ACCESS_TOKEN = originalEnv;
      } else {
        delete process.env.FIGMA_ACCESS_TOKEN;
      }
    });
  });
});
