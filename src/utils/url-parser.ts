/**
 * Utility functions for parsing Figma URLs
 */

import { FigmaInvalidUrlError } from '../core/extractors/errors.js';

export interface ParsedFigmaUrl {
  fileKey: string;
  nodeId?: string;
}

/**
 * Parses a Figma URL to extract the file key and optional node ID
 *
 * Supported formats:
 * - https://www.figma.com/file/{fileKey}/{title}
 * - https://www.figma.com/file/{fileKey}/{title}?node-id={nodeId}
 * - https://www.figma.com/design/{fileKey}/{title}
 * - figma.com/file/{fileKey}
 *
 * @param url - Figma URL to parse
 * @returns Parsed file key and optional node ID
 * @throws {FigmaInvalidUrlError} If URL format is invalid
 */
export function parseFigmaUrl(url: string): ParsedFigmaUrl {
  // Remove trailing slashes and whitespace
  const cleanUrl = url.trim().replace(/\/$/, '');

  // Try to parse as URL
  let urlObj: URL;
  try {
    // Add protocol if missing
    const urlWithProtocol = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
    urlObj = new URL(urlWithProtocol);
  } catch (error) {
    throw new FigmaInvalidUrlError(
      `Invalid URL format: ${url}`,
      url
    );
  }

  // Check if it's a Figma URL
  if (!urlObj.hostname.includes('figma.com')) {
    throw new FigmaInvalidUrlError(
      `URL must be from figma.com domain: ${url}`,
      url
    );
  }

  // Extract file key from path
  // Patterns: /file/{fileKey}/... or /design/{fileKey}/...
  const pathMatch = urlObj.pathname.match(/^\/(file|design)\/([a-zA-Z0-9]+)/);

  if (!pathMatch || !pathMatch[2]) {
    throw new FigmaInvalidUrlError(
      `Could not extract file key from URL: ${url}. Expected format: figma.com/file/{fileKey} or figma.com/design/{fileKey}`,
      url
    );
  }

  const fileKey = pathMatch[2];

  // Extract node ID from query parameter if present
  const nodeId = urlObj.searchParams.get('node-id') ?? undefined;

  return {
    fileKey,
    nodeId,
  };
}

/**
 * Validates a Figma file key format
 *
 * @param fileKey - File key to validate
 * @returns True if valid, false otherwise
 */
export function isValidFileKey(fileKey: string): boolean {
  // Figma file keys are alphanumeric strings
  return /^[a-zA-Z0-9]+$/.test(fileKey);
}

/**
 * Extracts the file key from a URL without full validation
 *
 * @param url - Figma URL
 * @returns File key or null if not found
 */
export function extractFileKey(url: string): string | null {
  try {
    const parsed = parseFigmaUrl(url);
    return parsed.fileKey;
  } catch {
    return null;
  }
}
