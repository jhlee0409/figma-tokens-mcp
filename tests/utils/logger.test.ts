import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logger, LogLevel } from '../../src/utils/logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger = new Logger({ level: LogLevel.DEBUG, enableTimestamp: false });
  });

  it('should create a logger instance', () => {
    expect(logger).toBeInstanceOf(Logger);
  });

  it('should log debug messages', () => {
    logger.debug('test debug message');
    expect(consoleErrorSpy).toHaveBeenCalledWith('[DEBUG] test debug message');
  });

  it('should log info messages', () => {
    logger.info('test info message');
    expect(consoleErrorSpy).toHaveBeenCalledWith('[INFO] test info message');
  });

  it('should log warn messages', () => {
    logger.warn('test warn message');
    expect(consoleErrorSpy).toHaveBeenCalledWith('[WARN] test warn message');
  });

  it('should log error messages', () => {
    logger.error('test error message');
    expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] test error message');
  });

  it('should respect log level', () => {
    const infoLogger = new Logger({ level: LogLevel.INFO, enableTimestamp: false });
    infoLogger.debug('should not log');
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should include timestamp when enabled', () => {
    const timestampLogger = new Logger({ level: LogLevel.INFO, enableTimestamp: true });
    timestampLogger.info('test message');
    const calls = consoleErrorSpy.mock.calls[0];
    expect(calls?.[0]).toMatch(
      /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] test message/
    );
  });

  it('should log error with stack trace', () => {
    const error = new Error('test error');
    logger.error('error occurred', error);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR] error occurred: test error')
    );
  });
});
