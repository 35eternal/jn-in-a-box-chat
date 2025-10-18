/**
 * Centralized logging utility
 * Provides consistent logging across the application with environment-aware behavior
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enableDebug: boolean;
  enableInfo: boolean;
  prefix?: string;
}

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enableDebug: import.meta.env.DEV,
      enableInfo: true,
      prefix: '',
      ...config,
    };
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
    const formattedMessage = `${timestamp} ${prefix} [${level.toUpperCase()}]:`;

    switch (level) {
      case 'debug':
        if (this.config.enableDebug) {
          console.debug(formattedMessage, message, ...args);
        }
        break;
      case 'info':
        if (this.config.enableInfo) {
          console.info(formattedMessage, message, ...args);
        }
        break;
      case 'warn':
        console.warn(formattedMessage, message, ...args);
        break;
      case 'error':
        console.error(formattedMessage, message, ...args);
        break;
    }
  }

  debug(message: string, ...args: any[]): void {
    this.formatMessage('debug', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.formatMessage('info', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.formatMessage('warn', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.formatMessage('error', message, ...args);
  }
}

// Export pre-configured logger instances for different modules
export const chatLogger = new Logger({ prefix: 'CHAT' });
export const authLogger = new Logger({ prefix: 'AUTH' });
export const dbLogger = new Logger({ prefix: 'DATABASE' });
export const uiLogger = new Logger({ prefix: 'UI' });

// Export default logger
export default new Logger();
