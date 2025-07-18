import { Alert } from 'react-native';

export interface AsyncError {
  message: string;
  type: 'network' | 'auth' | 'validation' | 'timeout' | 'generic';
  code?: string;
  statusCode?: number;
  retry?: boolean;
  retryAfter?: number;
}

export interface AsyncResult<T> {
  data?: T;
  error?: AsyncError;
  loading?: boolean;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  backoffFactor: number;
  maxDelay: number;
}

export class AsyncErrorHandler {
  private static defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    backoffFactor: 2,
    maxDelay: 10000,
  };

  static async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<AsyncResult<T>> {
    const finalConfig = { ...this.defaultRetryConfig, ...config };
    let lastError: AsyncError | null = null;
    let delay = finalConfig.initialDelay;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        const data = await operation();
        return { data, error: undefined, loading: false };
      } catch (error) {
        lastError = this.parseError(error);
        
        // Don't retry on certain error types
        if (
          lastError.type === 'auth' ||
          lastError.type === 'validation' ||
          !lastError.retry
        ) {
          break;
        }

        // Don't retry on last attempt
        if (attempt === finalConfig.maxRetries) {
          break;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * finalConfig.backoffFactor, finalConfig.maxDelay);
      }
    }

    return { data: undefined, error: lastError, loading: false };
  }

  static async execute<T>(
    operation: () => Promise<T>,
    options: {
      showAlert?: boolean;
      alertTitle?: string;
      onError?: (error: AsyncError) => void;
      retry?: boolean;
      retryConfig?: Partial<RetryConfig>;
    } = {}
  ): Promise<AsyncResult<T>> {
    const {
      showAlert = false,
      alertTitle = 'Error',
      onError,
      retry = false,
      retryConfig = {},
    } = options;

    try {
      let result: AsyncResult<T>;

      if (retry) {
        result = await this.withRetry(operation, retryConfig);
      } else {
        try {
          const data = await operation();
          result = { data, error: undefined, loading: false };
        } catch (error) {
          result = { data: undefined, error: this.parseError(error), loading: false };
        }
      }

      if (result.error) {
        if (onError) {
          onError(result.error);
        }

        if (showAlert) {
          this.showErrorAlert(result.error, alertTitle);
        }
      }

      return result;
    } catch (error) {
      const parsedError = this.parseError(error);
      
      if (onError) {
        onError(parsedError);
      }

      if (showAlert) {
        this.showErrorAlert(parsedError, alertTitle);
      }

      return { data: undefined, error: parsedError, loading: false };
    }
  }

  private static parseError(error: any): AsyncError {
    if (error?.response) {
      // HTTP error
      const { status, data } = error.response;
      
      if (status === 401 || status === 403) {
        return {
          message: 'Authentication required. Please sign in again.',
          type: 'auth',
          code: 'AUTH_ERROR',
          statusCode: status,
          retry: false,
        };
      }

      if (status === 400) {
        return {
          message: data?.message || 'Invalid request. Please check your input.',
          type: 'validation',
          code: 'VALIDATION_ERROR',
          statusCode: status,
          retry: false,
        };
      }

      if (status === 404) {
        return {
          message: data?.message || 'Resource not found.',
          type: 'generic',
          code: 'NOT_FOUND',
          statusCode: status,
          retry: false,
        };
      }

      if (status === 429) {
        return {
          message: 'Too many requests. Please try again later.',
          type: 'network',
          code: 'RATE_LIMIT',
          statusCode: status,
          retry: true,
          retryAfter: parseInt(error.response.headers?.['retry-after'] || '60'),
        };
      }

      if (status >= 500) {
        return {
          message: 'Server error. Please try again later.',
          type: 'network',
          code: 'SERVER_ERROR',
          statusCode: status,
          retry: true,
        };
      }

      return {
        message: data?.message || 'An unexpected error occurred.',
        type: 'generic',
        code: 'HTTP_ERROR',
        statusCode: status,
        retry: status >= 500,
      };
    }

    if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network')) {
      return {
        message: 'Network error. Please check your connection and try again.',
        type: 'network',
        code: 'NETWORK_ERROR',
        retry: true,
      };
    }

    if (error?.name === 'TimeoutError' || error?.code === 'TIMEOUT') {
      return {
        message: 'Request timed out. Please try again.',
        type: 'timeout',
        code: 'TIMEOUT',
        retry: true,
      };
    }

    if (error?.name === 'AbortError') {
      return {
        message: 'Request was cancelled.',
        type: 'generic',
        code: 'CANCELLED',
        retry: false,
      };
    }

    // Generic error
    return {
      message: error?.message || 'An unexpected error occurred.',
      type: 'generic',
      code: 'UNKNOWN_ERROR',
      retry: false,
    };
  }

  private static showErrorAlert(error: AsyncError, title: string): void {
    Alert.alert(
      title,
      error.message,
      [
        {
          text: 'OK',
          style: 'default',
        },
      ],
      { cancelable: true }
    );
  }

  static isNetworkError(error: AsyncError): boolean {
    return error.type === 'network' || error.code === 'NETWORK_ERROR';
  }

  static isAuthError(error: AsyncError): boolean {
    return error.type === 'auth' || error.code === 'AUTH_ERROR';
  }

  static isValidationError(error: AsyncError): boolean {
    return error.type === 'validation' || error.code === 'VALIDATION_ERROR';
  }

  static isRetryableError(error: AsyncError): boolean {
    return error.retry === true;
  }

  static getErrorMessage(error: AsyncError): string {
    return error.message;
  }

  static getErrorType(error: AsyncError): string {
    return error.type;
  }
}

// Helper hook for React components
export const useAsyncOperation = <T>() => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<AsyncError | null>(null);

  const execute = React.useCallback(async (
    operation: () => Promise<T>,
    options: {
      showAlert?: boolean;
      alertTitle?: string;
      onSuccess?: (data: T) => void;
      onError?: (error: AsyncError) => void;
      retry?: boolean;
      retryConfig?: Partial<RetryConfig>;
    } = {}
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    const result = await AsyncErrorHandler.execute(operation, {
      ...options,
      onError: (err) => {
        setError(err);
        options.onError?.(err);
      },
    });

    setLoading(false);

    if (result.data && options.onSuccess) {
      options.onSuccess(result.data);
    }

    return result.data || null;
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    clearError,
  };
};

// Export React for the hook
import React from 'react';

export default AsyncErrorHandler;