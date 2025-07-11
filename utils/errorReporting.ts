/**
 * Enhanced error reporting and monitoring system
 */

// Simple mock config since the actual config may not exist
const config = {
  environment: 'development',
  logging: {
    enableConsoleLogging: true,
    enableRemoteLogging: false,
  }
};

// Simple ApiError interface
interface ApiError {
  code: string;
  message: string;
  statusCode?: number;
  details?: any;
  timestamp: string;
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error categories for better organization
 */
export enum ErrorCategory {
  NETWORK = 'network',
  API = 'api',
  UI = 'ui',
  STREAM = 'stream',
  AUTH = 'auth',
  STORAGE = 'storage',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  UNKNOWN = 'unknown'
}

/**
 * Error context interface
 */
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
  additionalData?: Record<string, any>;
  stackTrace?: string;
  userAgent?: string;
  platform?: string;
  version?: string;
}

/**
 * Enhanced error interface
 */
export interface EnhancedError extends Error {
  code?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  retryable: boolean;
  originalError?: Error;
  handled: boolean;
}

/**
 * Error reporting service
 */
export class ErrorReportingService {
  private static instance: ErrorReportingService;
  private errorQueue: EnhancedError[] = [];
  private isOnline = true;
  private reportingEnabled = true;

  private constructor() {
    // Temporarily disable error handlers to prevent crashes
    // this.setupGlobalErrorHandlers();
    this.setupNetworkMonitoring();
  }

  static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // React Native global error handler
    if (typeof global !== 'undefined' && (global as any).ErrorUtils) {
      const originalHandler = (global as any).ErrorUtils.getGlobalHandler();
      
      (global as any).ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
        this.reportError(error, {
          severity: isFatal ? ErrorSeverity.CRITICAL : ErrorSeverity.HIGH,
          category: ErrorCategory.UNKNOWN,
          context: {
            component: 'GlobalErrorHandler',
            action: 'unhandledError',
            additionalData: { isFatal }
          }
        });
        
        // Call original handler
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }

    // Promise rejection handler - only available in web environments
    // React Native doesn't have window object, so we skip this
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    // React Native doesn't have window object for network events
    // Network monitoring would be handled by NetInfo in React Native
    // For now, assume we're always online
    this.isOnline = true;
  }

  /**
   * Report an error with enhanced context
   */
  reportError(error: Error, options: Partial<EnhancedError> = {}): void {
    if (!this.reportingEnabled) return;

    const enhancedError: EnhancedError = {
      ...error,
      code: options.code || 'UNKNOWN_ERROR',
      severity: options.severity || ErrorSeverity.MEDIUM,
      category: options.category || ErrorCategory.UNKNOWN,
      context: {
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
        version: config.environment,
        ...options.context
      },
      retryable: options.retryable || false,
      originalError: error,
      handled: false
    };

    // Log to console in development
    if (config.logging.enableConsoleLogging) {
      this.logToConsole(enhancedError);
    }

    // Add to queue for remote reporting
    this.errorQueue.push(enhancedError);
    
    // Try to send immediately if online
    if (this.isOnline && config.logging.enableRemoteLogging) {
      this.flushErrorQueue();
    }

    // Mark as handled
    enhancedError.handled = true;
  }

  /**
   * Report API errors with specific context
   */
  reportApiError(error: ApiError, context: ErrorContext = {}): void {
    this.reportError(new Error(error.message), {
      code: error.code,
      severity: this.getApiErrorSeverity(error.statusCode),
      category: ErrorCategory.API,
      context: {
        ...context,
        component: 'ApiService',
        additionalData: {
          statusCode: error.statusCode,
          details: error.details
        }
      },
      retryable: this.isApiErrorRetryable(error.statusCode)
    });
  }

  /**
   * Report network errors
   */
  reportNetworkError(error: Error, context: ErrorContext = {}): void {
    this.reportError(error, {
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.NETWORK,
      context: {
        ...context,
        component: 'NetworkService'
      },
      retryable: true
    });
  }

  /**
   * Report stream-related errors
   */
  reportStreamError(error: Error, streamId: string, context: ErrorContext = {}): void {
    this.reportError(error, {
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.STREAM,
      context: {
        ...context,
        component: 'StreamService',
        additionalData: {
          streamId
        }
      },
      retryable: true
    });
  }

  /**
   * Report performance issues
   */
  reportPerformanceIssue(metric: string, value: number, threshold: number, context: ErrorContext = {}): void {
    this.reportError(new Error(`Performance threshold exceeded: ${metric}`), {
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.PERFORMANCE,
      context: {
        ...context,
        component: 'PerformanceMonitor',
        additionalData: {
          metric,
          value,
          threshold
        }
      },
      retryable: false
    });
  }

  /**
   * Log error to console with formatting
   */
  private logToConsole(error: EnhancedError): void {
    const { severity, category, context, message } = error;
    
    console.group(`🚨 ${severity.toUpperCase()} ERROR - ${category.toUpperCase()}`);
    console.error('Message:', message);
    console.error('Code:', error.code);
    console.error('Stack:', error.stack);
    console.log('Context:', context);
    console.log('Timestamp:', context.timestamp);
    console.log('Retryable:', error.retryable);
    console.groupEnd();
  }

  /**
   * Flush error queue to remote service
   */
  private async flushErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0 || !this.isOnline) return;

    const errorsToSend = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // Send to remote logging service
      await this.sendErrorsToRemote(errorsToSend);
    } catch (error) {
      // If sending fails, put errors back in queue
      this.errorQueue.unshift(...errorsToSend);
      console.warn('Failed to send errors to remote service:', error);
    }
  }

  /**
   * Send errors to remote logging service
   */
  private async sendErrorsToRemote(errors: EnhancedError[]): Promise<void> {
    // Implementation would depend on your logging service
    // Example: Sentry, LogRocket, Crashlytics, etc.
    const payload = {
      errors: errors.map(error => ({
        message: error.message,
        code: error.code,
        severity: error.severity,
        category: error.category,
        context: error.context,
        stack: error.stack,
        retryable: error.retryable
      })),
      timestamp: new Date().toISOString(),
      environment: config.environment
    };

    // Mock API call - replace with actual logging service
    if (config.logging.enableRemoteLogging) {
      console.log('Sending errors to remote service:', payload);
    }
  }

  /**
   * Get severity for API errors based on status code
   */
  private getApiErrorSeverity(statusCode?: number): ErrorSeverity {
    if (!statusCode) return ErrorSeverity.MEDIUM;
    
    if (statusCode >= 500) return ErrorSeverity.HIGH;
    if (statusCode >= 400) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  /**
   * Check if API error is retryable
   */
  private isApiErrorRetryable(statusCode?: number): boolean {
    if (!statusCode) return false;
    
    // Retry on server errors and rate limits
    return statusCode >= 500 || statusCode === 429;
  }

  /**
   * Enable/disable error reporting
   */
  setReportingEnabled(enabled: boolean): void {
    this.reportingEnabled = enabled;
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    queueSize: number;
    isOnline: boolean;
    reportingEnabled: boolean;
  } {
    return {
      queueSize: this.errorQueue.length,
      isOnline: this.isOnline,
      reportingEnabled: this.reportingEnabled
    };
  }

  /**
   * Clear error queue
   */
  clearErrorQueue(): void {
    this.errorQueue = [];
  }
}

// Export singleton instance
export const errorReporter = ErrorReportingService.getInstance();

// Export convenience functions
export const reportError = (error: Error, options?: Partial<EnhancedError>) => 
  errorReporter.reportError(error, options);

export const reportApiError = (error: ApiError, context?: ErrorContext) => 
  errorReporter.reportApiError(error, context);

export const reportNetworkError = (error: Error, context?: ErrorContext) => 
  errorReporter.reportNetworkError(error, context);

export const reportStreamError = (error: Error, streamId: string, context?: ErrorContext) => 
  errorReporter.reportStreamError(error, streamId, context);

export const reportPerformanceIssue = (metric: string, value: number, threshold: number, context?: ErrorContext) => 
  errorReporter.reportPerformanceIssue(metric, value, threshold, context);

// Export error creation helpers
export const createError = (message: string, code: string, category: ErrorCategory, severity: ErrorSeverity = ErrorSeverity.MEDIUM): EnhancedError => {
  const error = new Error(message) as EnhancedError;
  error.code = code;
  error.category = category;
  error.severity = severity;
  error.context = {
    timestamp: new Date().toISOString()
  };
  error.retryable = false;
  error.handled = false;
  return error;
};

export const createApiError = (message: string, statusCode: number, details?: any): ApiError => {
  return {
    code: `API_ERROR_${statusCode}`,
    message,
    statusCode,
    details,
    timestamp: new Date().toISOString()
  };
};