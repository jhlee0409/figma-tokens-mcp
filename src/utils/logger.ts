/**
 * Simple logger utility for the MCP server
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LoggerConfig {
  level: LogLevel;
  enableTimestamp: boolean;
}

export class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level ?? LogLevel.INFO,
      enableTimestamp: config.enableTimestamp ?? true,
    };
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = this.config.enableTimestamp ? `[${new Date().toISOString()}] ` : '';
    return `${timestamp}[${level}] ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  debug(message: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.error(this.formatMessage(LogLevel.DEBUG, message));
    }
  }

  info(message: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.error(this.formatMessage(LogLevel.INFO, message));
    }
  }

  warn(message: string): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.error(this.formatMessage(LogLevel.WARN, message));
    }
  }

  error(message: string, error?: Error): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorMessage = error ? `${message}: ${error.message}` : message;
      console.error(this.formatMessage(LogLevel.ERROR, errorMessage));
      if (error?.stack) {
        console.error(error.stack);
      }
    }
  }
}

export const logger = new Logger();
