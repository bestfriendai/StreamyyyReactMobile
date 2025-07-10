/**
 * Global Error Handler Utility
 * Provides consistent error logging and debugging throughout the app
 */

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
  if (typeof global !== 'undefined' && global.ErrorUtils) {
    const originalHandler = global.ErrorUtils.getGlobalHandler();
    
    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
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