import { describe, it, expect } from 'vitest';
import { createServer } from '../../src/mcp/server';

describe('MCP Server', () => {
  it('should create a server instance', () => {
    const server = createServer();
    expect(server).toBeDefined();
  });

  it('should create server with custom config', () => {
    const server = createServer({
      name: 'custom-server',
      version: '1.0.0',
    });
    expect(server).toBeDefined();
  });

  it('should create server with default config', () => {
    const server = createServer();
    expect(server).toBeDefined();
  });
});
