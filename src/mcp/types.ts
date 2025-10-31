/**
 * Type definitions for the MCP server
 */

export interface ServerConfig {
  name?: string;
  version?: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
}
