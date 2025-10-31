/**
 * Figma REST API Client
 * Handles authentication, rate limiting, error handling, and provides methods
 * for accessing files, variables, styles, and nodes.
 *
 * Documentation:
 * - Figma REST API: https://www.figma.com/developers/api
 * - Figma Variables API: https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { Logger, LogLevel } from '@/utils/logger';
import {
  FigmaAPIError,
  FigmaAuthError,
  FigmaRateLimitError,
  FigmaNotFoundError,
  FigmaInvalidUrlError,
} from './errors';
import type {
  FigmaFile,
  FileVariablesResponse,
  FileNodesResponse,
  Style,
  ParsedFigmaUrl,
} from './types';

/**
 * Configuration options for the Figma API client
 */
export interface FigmaAPIClientConfig {
  /**
   * Figma Access Token (defaults to FIGMA_ACCESS_TOKEN env var)
   */
  accessToken?: string;

  /**
   * Base URL for Figma API (defaults to https://api.figma.com/v1)
   */
  baseUrl?: string;

  /**
   * Maximum number of retry attempts for transient errors
   */
  maxRetries?: number;

  /**
   * Initial delay in milliseconds for exponential backoff
   */
  initialRetryDelay?: number;

  /**
   * Request timeout in milliseconds
   */
  timeout?: number;

  /**
   * Enable verbose logging
   */
  verbose?: boolean;

  /**
   * Cache TTL in milliseconds (default: 5 minutes)
   */
  cacheTTL?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Figma REST API Client
 *
 * Provides type-safe methods for interacting with the Figma REST API,
 * including authentication, rate limiting, error handling, and response transformation.
 *
 * @example
 * ```typescript
 * const client = new FigmaAPIClient({ accessToken: process.env.FIGMA_ACCESS_TOKEN });
 * const file = await client.getFile('ABC123');
 * const variables = await client.getFileVariables('ABC123');
 * ```
 */
export class FigmaAPIClient {
  private readonly client: AxiosInstance;
  private readonly logger: Logger;
  private readonly config: Required<FigmaAPIClientConfig>;
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  constructor(config: FigmaAPIClientConfig = {}) {
    // Load configuration with defaults
    this.config = {
      accessToken: config.accessToken ?? process.env['FIGMA_ACCESS_TOKEN'] ?? '',
      baseUrl: config.baseUrl ?? 'https://api.figma.com/v1',
      maxRetries: config.maxRetries ?? 3,
      initialRetryDelay: config.initialRetryDelay ?? 1000,
      timeout: config.timeout ?? 30000,
      verbose: config.verbose ?? false,
      cacheTTL: config.cacheTTL ?? 5 * 60 * 1000, // 5 minutes
    };

    // Validate access token
    if (!this.config.accessToken) {
      throw new FigmaAuthError(
        'Figma access token is required. Set FIGMA_ACCESS_TOKEN environment variable or pass accessToken in config.'
      );
    }

    if (!this.isValidToken(this.config.accessToken)) {
      throw new FigmaAuthError(
        'Invalid Figma access token format. Token should be a non-empty string.'
      );
    }

    // Initialize logger
    this.logger = new Logger({
      level: this.config.verbose ? LogLevel.DEBUG : LogLevel.INFO,
    });

    // Create axios instance with auth header
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'X-Figma-Token': this.config.accessToken,
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use((config) => {
      this.logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error: AxiosError) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return this.handleError(error);
      }
    );

    this.logger.info('Figma API Client initialized');
  }

  /**
   * Validates token format
   */
  private isValidToken(token: string): boolean {
    return token.length > 0 && typeof token === 'string';
  }

  /**
   * Gets data from cache if available and not expired
   */
  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    if (age > this.config.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    this.logger.debug(`Cache hit: ${key}`);
    return entry.data;
  }

  /**
   * Stores data in cache
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Handles API errors and converts them to custom error types
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleError(error: AxiosError): Promise<any> {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as { status?: number; err?: string; message?: string };
      const message = data.err ?? data.message ?? error.message;

      // Handle specific error types
      switch (status) {
        case 401:
        case 403:
          throw new FigmaAuthError(`Authentication failed: ${message}`, {
            status,
            url: error.config?.url,
          });

        case 404:
          throw new FigmaNotFoundError(`Resource not found: ${message}`, {
            status,
            url: error.config?.url,
          });

        case 429: {
          const retryAfter = this.getRetryAfter(error.response);
          this.logger.warn(`Rate limit exceeded. Retry after ${retryAfter}ms`);
          throw new FigmaRateLimitError(`Rate limit exceeded: ${message}`, retryAfter, {
            status,
            url: error.config?.url,
          });
        }

        case 500:
        case 502:
        case 503:
        case 504:
          // Retry transient server errors
          if (error.config && this.shouldRetry(error)) {
            return this.retryRequest(error);
          }
          throw new FigmaAPIError(`Server error: ${message}`, status, {
            url: error.config?.url,
          });

        default:
          throw new FigmaAPIError(`API error: ${message}`, status, {
            url: error.config?.url,
          });
      }
    }

    // Network or timeout error
    if (error.code === 'ECONNABORTED') {
      throw new FigmaAPIError('Request timeout', undefined, {
        timeout: this.config.timeout,
      });
    }

    throw new FigmaAPIError(`Network error: ${error.message}`);
  }

  /**
   * Extracts retry-after header value in milliseconds
   */
  private getRetryAfter(response: AxiosResponse): number {
    const retryAfter = response.headers['retry-after'] as string | undefined;
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) {
        return seconds * 1000;
      }
    }
    return this.config.initialRetryDelay;
  }

  /**
   * Determines if a request should be retried
   */
  private shouldRetry(error: AxiosError): boolean {
    if (!error.config) {
      return false;
    }

    const retryCount = (error.config as { retryCount?: number }).retryCount ?? 0;
    return retryCount < this.config.maxRetries;
  }

  /**
   * Retries a failed request with exponential backoff
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async retryRequest(error: AxiosError): Promise<any> {
    if (!error.config) {
      throw error;
    }

    // Store retry count separately to avoid modifying config
    const configWithRetry = error.config as typeof error.config & { retryCount?: number };
    const retryCount = configWithRetry.retryCount ?? 0;
    const newRetryCount = retryCount + 1;

    const delay = this.config.initialRetryDelay * Math.pow(2, retryCount);
    this.logger.debug(
      `Retrying request (attempt ${newRetryCount}/${this.config.maxRetries}) after ${delay}ms`
    );

    await this.sleep(delay);

    try {
      // Create a new config object without retryCount for the actual request
      const { retryCount: _, ...cleanConfig } = configWithRetry;
      const response = await this.client.request(cleanConfig);
      // Update retry count for potential future retries
      (response.config as typeof configWithRetry).retryCount = newRetryCount;
      return response.data;
    } catch (retryError) {
      if (axios.isAxiosError(retryError)) {
        // Pass the retry count to the error config
        if (retryError.config) {
          (retryError.config as typeof configWithRetry).retryCount = newRetryCount;
        }
        return this.handleError(retryError);
      }
      throw retryError;
    }
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Parse a Figma URL to extract file key and optional node ID
   *
   * Supports various Figma URL formats:
   * - https://www.figma.com/file/ABC123/name
   * - https://www.figma.com/design/ABC123/name
   * - https://www.figma.com/file/ABC123/name?node-id=1-2
   *
   * @param url - Figma file URL
   * @returns Parsed file key and optional node ID
   * @throws {FigmaInvalidUrlError} If URL is invalid
   *
   * @example
   * ```typescript
   * const parsed = client.parseFigmaUrl('https://www.figma.com/file/ABC123/name?node-id=1-2');
   * console.log(parsed.fileKey); // 'ABC123'
   * console.log(parsed.nodeId); // '1:2'
   * ```
   */
  parseFigmaUrl(url: string): ParsedFigmaUrl {
    try {
      const urlObj = new globalThis.URL(url);

      // Extract file key from path
      const pathMatch = urlObj.pathname.match(/\/(file|design)\/([a-zA-Z0-9]+)/);
      if (!pathMatch?.[2]) {
        throw new FigmaInvalidUrlError('Invalid Figma URL: file key not found', url);
      }

      const fileKey = pathMatch[2];

      // Extract node ID from query params
      const nodeIdParam = urlObj.searchParams.get('node-id');

      if (nodeIdParam) {
        const nodeId = nodeIdParam.replace(/-/g, ':');
        return { fileKey, nodeId };
      }

      return { fileKey };
    } catch (error) {
      if (error instanceof FigmaInvalidUrlError) {
        throw error;
      }
      throw new FigmaInvalidUrlError(`Failed to parse Figma URL: ${(error as Error).message}`, url);
    }
  }

  /**
   * Get complete file data including document structure, components, and styles
   *
   * @param fileKey - Figma file key (from URL or parseFigmaUrl)
   * @returns Complete file data
   * @throws {FigmaAuthError} If authentication fails
   * @throws {FigmaNotFoundError} If file is not found or no access
   * @throws {FigmaRateLimitError} If rate limit is exceeded
   *
   * @example
   * ```typescript
   * const file = await client.getFile('ABC123');
   * console.log(file.name);
   * console.log(file.document.children);
   * ```
   */
  async getFile(fileKey: string): Promise<FigmaFile> {
    const cacheKey = `file:${fileKey}`;
    const cached = this.getCached<FigmaFile>(cacheKey);
    if (cached) {
      return cached;
    }

    this.logger.info(`Fetching file: ${fileKey}`);
    const startTime = Date.now();

    try {
      const response = await this.client.get<FigmaFile>(`/files/${fileKey}`);
      const duration = Date.now() - startTime;
      this.logger.info(`File fetched successfully in ${duration}ms`);

      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch file: ${fileKey}`, error as Error);
      throw error;
    }
  }

  /**
   * Get local variables from a file
   *
   * Retrieves all variables and variable collections defined in the file.
   * Variables can include colors, numbers, strings, and booleans.
   *
   * @param fileKey - Figma file key
   * @returns Variables and variable collections
   * @throws {FigmaAuthError} If authentication fails
   * @throws {FigmaNotFoundError} If file is not found or no access
   * @throws {FigmaRateLimitError} If rate limit is exceeded
   *
   * @example
   * ```typescript
   * const response = await client.getFileVariables('ABC123');
   * const variables = response.meta.variables;
   * const collections = response.meta.variableCollections;
   * ```
   */
  async getFileVariables(fileKey: string): Promise<FileVariablesResponse> {
    const cacheKey = `variables:${fileKey}`;
    const cached = this.getCached<FileVariablesResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    this.logger.info(`Fetching variables for file: ${fileKey}`);
    const startTime = Date.now();

    try {
      const response = await this.client.get<FileVariablesResponse>(
        `/files/${fileKey}/variables/local`
      );
      const duration = Date.now() - startTime;
      const variableCount = Object.keys(response.data.meta.variables).length;
      this.logger.info(`Fetched ${variableCount} variables in ${duration}ms`);

      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch variables for file: ${fileKey}`, error as Error);
      throw error;
    }
  }

  /**
   * Get all styles metadata from a file
   *
   * Returns metadata about all styles (fill, text, effect, grid) defined in the file.
   * To get the actual style values, use getStyleNodes with the style keys.
   *
   * @param fileKey - Figma file key
   * @returns Array of style metadata
   * @throws {FigmaAuthError} If authentication fails
   * @throws {FigmaNotFoundError} If file is not found or no access
   * @throws {FigmaRateLimitError} If rate limit is exceeded
   *
   * @example
   * ```typescript
   * const file = await client.getFile('ABC123');
   * const styles = Object.values(file.styles);
   * console.log(styles.map(s => s.name));
   * ```
   */
  async getFileStyles(fileKey: string): Promise<Style[]> {
    this.logger.info(`Fetching styles for file: ${fileKey}`);

    try {
      const file = await this.getFile(fileKey);
      const styles = Object.values(file.styles);
      this.logger.info(`Fetched ${styles.length} styles`);
      return styles;
    } catch (error) {
      this.logger.error(`Failed to fetch styles for file: ${fileKey}`, error as Error);
      throw error;
    }
  }

  /**
   * Get specific nodes with full properties
   *
   * Retrieves complete node data including fills, effects, typography, and more.
   * This is useful for getting detailed information about specific elements.
   *
   * @param fileKey - Figma file key
   * @param nodeIds - Array of node IDs to fetch
   * @returns Node data mapped by node ID
   * @throws {FigmaAuthError} If authentication fails
   * @throws {FigmaNotFoundError} If file is not found or no access
   * @throws {FigmaRateLimitError} If rate limit is exceeded
   *
   * @example
   * ```typescript
   * const nodes = await client.getFileNodes('ABC123', ['1:2', '1:3']);
   * const node = nodes.nodes['1:2'];
   * if ('document' in node) {
   *   console.log(node.document.name);
   * }
   * ```
   */
  async getFileNodes(fileKey: string, nodeIds: string[]): Promise<FileNodesResponse> {
    if (nodeIds.length === 0) {
      throw new FigmaAPIError('nodeIds array cannot be empty');
    }

    const cacheKey = `nodes:${fileKey}:${nodeIds.join(',')}`;
    const cached = this.getCached<FileNodesResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    this.logger.info(`Fetching ${nodeIds.length} nodes for file: ${fileKey}`);
    const startTime = Date.now();

    try {
      const ids = nodeIds.join(',');
      const response = await this.client.get<FileNodesResponse>(`/files/${fileKey}/nodes`, {
        params: { ids },
      });
      const duration = Date.now() - startTime;
      this.logger.info(`Fetched nodes in ${duration}ms`);

      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch nodes for file: ${fileKey}`, error as Error);
      throw error;
    }
  }

  /**
   * Get node data for styles
   *
   * Styles are stored as metadata with references to nodes that contain the actual
   * style values. This method fetches the node data for style IDs to extract
   * fills, effects, and typography properties.
   *
   * Note: This uses the file's styles to find corresponding nodes. For fill and text styles,
   * the style metadata doesn't include node IDs, so you'll need to search the document tree
   * or use component inspection to find where styles are applied.
   *
   * @param fileKey - Figma file key
   * @param styleIds - Array of style keys
   * @returns Node data for styles
   * @throws {FigmaAuthError} If authentication fails
   * @throws {FigmaNotFoundError} If file is not found or no access
   *
   * @example
   * ```typescript
   * const file = await client.getFile('ABC123');
   * const styleKeys = Object.keys(file.styles).slice(0, 5);
   * // Note: You would need to find node IDs that use these styles
   * ```
   */
  async getStyleNodes(fileKey: string, styleIds: string[]): Promise<FileNodesResponse> {
    this.logger.info(`Fetching style nodes for ${styleIds.length} styles`);

    try {
      // For now, this is a wrapper around getFileNodes
      // In practice, you'd need to find node IDs that use these styles
      // by traversing the document tree or using the file's component metadata
      return await this.getFileNodes(fileKey, styleIds);
    } catch (error) {
      this.logger.error(`Failed to fetch style nodes`, error as Error);
      throw error;
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.debug('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
