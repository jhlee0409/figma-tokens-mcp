/**
 * Tests for MCP error utilities
 */

import { describe, it, expect } from 'vitest';
import {
  MCPToolError,
  formatMCPError,
  createErrorResponse,
  validateRequiredParams,
  validateParamTypes,
} from '../../src/utils/mcp-errors';
import {
  FigmaAPIError,
  FigmaAuthError,
  FigmaInvalidUrlError,
} from '../../src/core/extractors/errors';

describe('MCP Errors', () => {
  describe('MCPToolError', () => {
    it('should create error with all properties', () => {
      const error = new MCPToolError(
        'Test error',
        'test_tool',
        'TEST_CODE',
        { detail: 'value' }
      );

      expect(error.message).toBe('Test error');
      expect(error.toolName).toBe('test_tool');
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual({ detail: 'value' });
      expect(error.name).toBe('MCPToolError');
    });

    it('should create error without details', () => {
      const error = new MCPToolError('Test error', 'test_tool', 'TEST_CODE');

      expect(error.message).toBe('Test error');
      expect(error.toolName).toBe('test_tool');
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toBeUndefined();
    });
  });

  describe('formatMCPError', () => {
    it('should format FigmaAPIError', () => {
      const error = new FigmaAPIError('API error', 404, { fileKey: 'abc123' });
      const formatted = formatMCPError(error, 'test_tool');

      expect(formatted).toContain('FigmaAPIError');
      expect(formatted).toContain('API error');
      expect(formatted).toContain('404');
      expect(formatted).toContain('abc123');
      expect(formatted).toContain('test_tool');
    });

    it('should format FigmaAuthError', () => {
      const error = new FigmaAuthError('Auth failed');
      const formatted = formatMCPError(error, 'test_tool');

      expect(formatted).toContain('FigmaAuthError');
      expect(formatted).toContain('Auth failed');
      expect(formatted).toContain('401');
    });

    it('should format FigmaInvalidUrlError', () => {
      const error = new FigmaInvalidUrlError('Invalid URL', 'bad-url');
      const formatted = formatMCPError(error, 'test_tool');

      expect(formatted).toContain('FigmaInvalidUrlError');
      expect(formatted).toContain('Invalid URL');
      expect(formatted).toContain('bad-url');
    });

    it('should format MCPToolError', () => {
      const error = new MCPToolError(
        'Tool error',
        'test_tool',
        'ERROR_CODE',
        { detail: 'info' }
      );
      const formatted = formatMCPError(error, 'test_tool');

      expect(formatted).toContain('MCPToolError');
      expect(formatted).toContain('Tool error');
      expect(formatted).toContain('ERROR_CODE');
      expect(formatted).toContain('info');
    });

    it('should format generic Error', () => {
      const error = new Error('Generic error');
      const formatted = formatMCPError(error, 'test_tool');

      expect(formatted).toContain('ToolError');
      expect(formatted).toContain('Generic error');
      expect(formatted).toContain('test_tool');
    });

    it('should format unknown errors', () => {
      const formatted = formatMCPError('string error', 'test_tool');

      expect(formatted).toContain('UnknownError');
      expect(formatted).toContain('string error');
      expect(formatted).toContain('test_tool');
    });

    it('should return valid JSON', () => {
      const error = new Error('Test error');
      const formatted = formatMCPError(error, 'test_tool');

      expect(() => JSON.parse(formatted)).not.toThrow();
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response structure', () => {
      const error = new Error('Test error');
      const response = createErrorResponse(error, 'test_tool');

      expect(response.isError).toBe(true);
      expect(response.content).toHaveLength(1);
      expect(response.content[0].type).toBe('text');
    });

    it('should include formatted error in content', () => {
      const error = new MCPToolError('Tool error', 'test_tool', 'CODE');
      const response = createErrorResponse(error, 'test_tool');

      const content = response.content[0].text;
      expect(content).toContain('MCPToolError');
      expect(content).toContain('Tool error');
      expect(content).toContain('CODE');
    });

    it('should handle various error types', () => {
      const errors = [
        new Error('Generic'),
        new FigmaAPIError('API'),
        new MCPToolError('MCP', 'tool', 'code'),
        'string error',
      ];

      for (const error of errors) {
        const response = createErrorResponse(error, 'test_tool');
        expect(response.isError).toBe(true);
        expect(response.content).toHaveLength(1);
      }
    });
  });

  describe('validateRequiredParams', () => {
    it('should pass when all required params are present', () => {
      const params = { param1: 'value1', param2: 'value2' };
      expect(() =>
        validateRequiredParams(params, ['param1', 'param2'], 'test_tool')
      ).not.toThrow();
    });

    it('should throw when required param is missing', () => {
      const params = { param1: 'value1' };
      expect(() =>
        validateRequiredParams(params, ['param1', 'param2'], 'test_tool')
      ).toThrow(MCPToolError);
    });

    it('should throw when required param is undefined', () => {
      const params = { param1: 'value1', param2: undefined };
      expect(() =>
        validateRequiredParams(params, ['param1', 'param2'], 'test_tool')
      ).toThrow(MCPToolError);
    });

    it('should include missing params in error', () => {
      const params = { param1: 'value1' };
      try {
        validateRequiredParams(params, ['param1', 'param2', 'param3'], 'test_tool');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(MCPToolError);
        expect((error as MCPToolError).message).toContain('param2');
        expect((error as MCPToolError).message).toContain('param3');
      }
    });

    it('should pass with empty required array', () => {
      const params = {};
      expect(() =>
        validateRequiredParams(params, [], 'test_tool')
      ).not.toThrow();
    });

    it('should accept falsy values except undefined', () => {
      const params = { param1: null, param2: false, param3: 0, param4: '' };
      expect(() =>
        validateRequiredParams(
          params,
          ['param1', 'param2', 'param3', 'param4'],
          'test_tool'
        )
      ).not.toThrow();
    });
  });

  describe('validateParamTypes', () => {
    it('should pass when types match', () => {
      const params = {
        str: 'string',
        num: 123,
        bool: true,
        arr: [1, 2, 3],
        obj: { key: 'value' },
      };

      const schema = {
        str: 'string',
        num: 'number',
        bool: 'boolean',
        arr: 'array',
        obj: 'object',
      };

      expect(() =>
        validateParamTypes(params, schema, 'test_tool')
      ).not.toThrow();
    });

    it('should throw when type does not match', () => {
      const params = { param: 'string' };
      const schema = { param: 'number' };

      expect(() =>
        validateParamTypes(params, schema, 'test_tool')
      ).toThrow(MCPToolError);
    });

    it('should include type info in error', () => {
      const params = { param: 123 };
      const schema = { param: 'string' };

      try {
        validateParamTypes(params, schema, 'test_tool');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(MCPToolError);
        expect((error as MCPToolError).message).toContain('param');
        expect((error as MCPToolError).message).toContain('string');
        expect((error as MCPToolError).message).toContain('number');
      }
    });

    it('should skip validation for missing params', () => {
      const params = { param1: 'string' };
      const schema = { param1: 'string', param2: 'number' };

      expect(() =>
        validateParamTypes(params, schema, 'test_tool')
      ).not.toThrow();
    });

    it('should skip validation for undefined params', () => {
      const params = { param1: 'string', param2: undefined };
      const schema = { param1: 'string', param2: 'number' };

      expect(() =>
        validateParamTypes(params, schema, 'test_tool')
      ).not.toThrow();
    });

    it('should correctly identify array type', () => {
      const params = { arr: [1, 2, 3] };
      const schema = { arr: 'array' };

      expect(() =>
        validateParamTypes(params, schema, 'test_tool')
      ).not.toThrow();
    });

    it('should distinguish between array and object', () => {
      const params = { arr: [1, 2], obj: { key: 'value' } };
      const schema = { arr: 'array', obj: 'object' };

      expect(() =>
        validateParamTypes(params, schema, 'test_tool')
      ).not.toThrow();
    });

    it('should throw when array is expected but object is provided', () => {
      const params = { param: { key: 'value' } };
      const schema = { param: 'array' };

      expect(() =>
        validateParamTypes(params, schema, 'test_tool')
      ).toThrow(MCPToolError);
    });
  });
});
