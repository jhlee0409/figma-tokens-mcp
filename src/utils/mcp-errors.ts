/**
 * MCP-specific error handling utilities
 */

import { FigmaAPIError } from '../core/extractors/errors.js';

/**
 * Custom error class for MCP tool errors
 */
export class MCPToolError extends Error {
  constructor(
    message: string,
    public readonly toolName: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MCPToolError';
    Object.setPrototypeOf(this, MCPToolError.prototype);
  }
}

/**
 * Formats an error for MCP protocol response
 *
 * @param error - Error to format
 * @param toolName - Name of the tool that threw the error
 * @returns Formatted error message
 */
export function formatMCPError(error: unknown, toolName: string): string {
  if (error instanceof FigmaAPIError) {
    return JSON.stringify(
      {
        error: error.name,
        message: error.message,
        statusCode: error.statusCode,
        context: error.context,
        toolName,
      },
      null,
      2
    );
  }

  if (error instanceof MCPToolError) {
    return JSON.stringify(
      {
        error: error.name,
        message: error.message,
        code: error.code,
        details: error.details,
        toolName,
      },
      null,
      2
    );
  }

  if (error instanceof Error) {
    return JSON.stringify(
      {
        error: 'ToolError',
        message: error.message,
        toolName,
      },
      null,
      2
    );
  }

  return JSON.stringify(
    {
      error: 'UnknownError',
      message: String(error),
      toolName,
    },
    null,
    2
  );
}

/**
 * Creates a standardized error response for MCP tools
 *
 * @param error - Error that occurred
 * @param toolName - Name of the tool
 * @returns MCP-formatted error response
 */
export function createErrorResponse(error: unknown, toolName: string): {
  content: Array<{ type: string; text: string }>;
  isError: true;
} {
  return {
    content: [
      {
        type: 'text',
        text: formatMCPError(error, toolName),
      },
    ],
    isError: true,
  };
}

/**
 * Validates required parameters for a tool
 *
 * @param params - Parameters object
 * @param required - Array of required parameter names
 * @param toolName - Name of the tool
 * @throws {MCPToolError} If required parameters are missing
 */
export function validateRequiredParams(
  params: Record<string, unknown>,
  required: string[],
  toolName: string
): void {
  const missing = required.filter((param) => !(param in params) || params[param] === undefined);

  if (missing.length > 0) {
    throw new MCPToolError(
      `Missing required parameters: ${missing.join(', ')}`,
      toolName,
      'MISSING_PARAMS',
      { missing }
    );
  }
}

/**
 * Validates parameter types
 *
 * @param params - Parameters object
 * @param schema - Schema object mapping parameter names to expected types
 * @param toolName - Name of the tool
 * @throws {MCPToolError} If parameter types don't match
 */
export function validateParamTypes(
  params: Record<string, unknown>,
  schema: Record<string, string>,
  toolName: string
): void {
  for (const [param, expectedType] of Object.entries(schema)) {
    if (param in params && params[param] !== undefined) {
      const actualType = Array.isArray(params[param]) ? 'array' : typeof params[param];

      if (actualType !== expectedType) {
        throw new MCPToolError(
          `Invalid type for parameter '${param}': expected ${expectedType}, got ${actualType}`,
          toolName,
          'INVALID_PARAM_TYPE',
          { param, expectedType, actualType }
        );
      }
    }
  }
}
