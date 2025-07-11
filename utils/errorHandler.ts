/**
 * Global Error Handler Utility
 * Provides consistent error logging and debugging throughout the app
 * Now integrated with the enhanced error reporting system
 */
import { errorReporter, ErrorSeverity, ErrorCategory } from './errorReporting';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export class ErrorHandler {
  /**
   * Log an error with enhanced debugging information
   */
  static logError(error: Error | string, context?: ErrorContext) {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    console.group('🚨 Application Error');
    console.error('Error:', errorObj);
    console.error('Message:', errorObj.message);
    
    if (errorObj.stack) {
      console.error('Stack Trace:', errorObj.stack);
    }
    
    if (context) {
      console.log('📍 Context:', context);
    }
    
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🌐 Environment:', {
      isDev: __DEV__,
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'N/A',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
    });
    
    console.groupEnd();

    // Report to enhanced error reporting system
    errorReporter.reportError(errorObj, {
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.UNKNOWN,
      context: context || {}
    });
  }
  
  /**
   * Log a warning with context
   */
  static logWarning(message: string, context?: ErrorContext) {
    console.group('⚠️ Application Warning');
    console.warn('Warning:', message);
    
    if (context) {
      console.log('📍 Context:', context);
    }
    
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.groupEnd();

    // Report as low severity error
    errorReporter.reportError(new Error(message), {
      severity: ErrorSeverity.LOW,
      category: ErrorCategory.UNKNOWN,
      context: context || {}
    });
  }
  
  /**
   * Log debug information
   */
  static logDebug(message: string, data?: any) {
    if (__DEV__) {
      console.group('🐛 Debug Info');
      console.log('Message:', message);
      
      if (data) {
        console.log('Data:', data);
      }
      
      console.log('⏰ Timestamp:', new Date().toISOString());
      console.groupEnd();
    }
  }
  
  /**
   * Wrap async functions with error handling
   */
  static async withErrorHandling<T>(
    fn: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.logError(error as Error, context);
      return null;
    }
  }
  
  /**
   * Wrap sync functions with error handling
   */
  static withSyncErrorHandling<T>(
    fn: () => T,
    context?: ErrorContext
  ): T | null {
    try {
      return fn();
    } catch (error) {
      this.logError(error as Error, context);
      return null;
    }
  }

  /**
   * Enhanced error handling with retry logic
   */
  static async withRetryableErrorHandling<T>(
    fn: () => Promise<T>,
    context?: ErrorContext,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<T | null> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          // Final attempt failed
          this.logError(lastError, {
            ...context,
            additionalData: {
              ...context?.additionalData,
              totalAttempts: attempt + 1,
              finalAttempt: true
            }
          });
          return null;
        }
        
        // Log retry attempt
        this.logWarning(`Retry attempt ${attempt + 1} failed: ${lastError.message}`, {
          ...context,
          additionalData: {
            ...context?.additionalData,
            attempt: attempt + 1,
            maxRetries,
            retryDelay
          }
        });
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    return null;
  }

  /**
   * Handle specific error types with appropriate severity
   */
  static handleNetworkError(error: Error, context?: ErrorContext): void {
    errorReporter.reportNetworkError(error, context);
  }

  static handleStreamError(error: Error, streamId: string, context?: ErrorContext): void {
    errorReporter.reportStreamError(error, streamId, context);
  }

  static handleApiError(error: any, context?: ErrorContext): void {
    if (error.response) {
      // API error with response
      errorReporter.reportApiError({
        code: `API_ERROR_${error.response.status}`,
        message: error.message || 'API request failed',
        statusCode: error.response.status,
        details: error.response.data,
        timestamp: new Date().toISOString()
      }, context);
    } else if (error.request) {
      // Network error
      this.handleNetworkError(error, context);
    } else {
      // Other error
      this.logError(error, context);
    }
  }

  /**
   * Performance monitoring helper
   */
  static reportPerformanceIssue(metric: string, value: number, threshold: number, context?: ErrorContext): void {
    errorReporter.reportPerformanceIssue(metric, value, threshold, context);
  }
}

/**
 * Setup global error handlers for unhandled errors
 */
export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('unhandledrejection', (event) => {
      console.group('🚨 Unhandled Promise Rejection');
      console.error('Reason:', event.reason);
      console.error('Promise:', event.promise);
      console.log('⏰ Timestamp:', new Date().toISOString());
      console.groupEnd();
      
      // Prevent the default browser behavior
      event.preventDefault();
    });
    
    // Handle global errors
    window.addEventListener('error', (event) => {
      console.group('🚨 Global JavaScript Error');
      console.error('Error:', event.error);
      console.error('Message:', event.message);
      console.error('Filename:', event.filename);
      console.error('Line:', event.lineno);
      console.error('Column:', event.colno);
      console.log('⏰ Timestamp:', new Date().toISOString());
      console.groupEnd();
    });
  }
  
  // React Native specific error handling
  if (typeof global !== 'undefined' && (global as any).ErrorUtils) {
    const originalHandler = (global as any).ErrorUtils.getGlobalHandler();
    
    (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal: any) => {
      console.group('🚨 React Native Global Error');
      console.error('Error:', error);
      console.error('Is Fatal:', isFatal);
      console.log('⏰ Timestamp:', new Date().toISOString());
      console.groupEnd();
      
      // Call the original handler
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  }
  
  console.log('✅ Global error handlers setup complete');
}

// Export convenience functions
export const logError = ErrorHandler.logError;
export const logWarning = ErrorHandler.logWarning;
export const logDebug = ErrorHandler.logDebug;
export const withErrorHandling = ErrorHandler.withErrorHandling;
export const withSyncErrorHandling = ErrorHandler.withSyncErrorHandling;