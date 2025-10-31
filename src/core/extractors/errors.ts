/**
 * Custom error classes for Figma API client
 */

/**
 * Base error class for all Figma API errors
 */
export class FigmaAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'FigmaAPIError';
    Object.setPrototypeOf(this, FigmaAPIError.prototype);
  }
}

/**
 * Authentication error - invalid or missing token
 */
export class FigmaAuthError extends FigmaAPIError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 401, context);
    this.name = 'FigmaAuthError';
    Object.setPrototypeOf(this, FigmaAuthError.prototype);
  }
}

/**
 * Rate limit error - too many requests
 */
export class FigmaRateLimitError extends FigmaAPIError {
  constructor(
    message: string,
    public retryAfter?: number,
    context?: Record<string, unknown>
  ) {
    super(message, 429, context);
    this.name = 'FigmaRateLimitError';
    Object.setPrototypeOf(this, FigmaRateLimitError.prototype);
  }
}

/**
 * Not found error - resource doesn't exist or no access
 */
export class FigmaNotFoundError extends FigmaAPIError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 404, context);
    this.name = 'FigmaNotFoundError';
    Object.setPrototypeOf(this, FigmaNotFoundError.prototype);
  }
}

/**
 * Invalid URL error - malformed Figma URL
 */
export class FigmaInvalidUrlError extends FigmaAPIError {
  constructor(
    message: string,
    public url: string
  ) {
    super(message, undefined, { url });
    this.name = 'FigmaInvalidUrlError';
    Object.setPrototypeOf(this, FigmaInvalidUrlError.prototype);
  }
}
