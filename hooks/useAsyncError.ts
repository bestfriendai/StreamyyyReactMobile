import { useCallback, useRef } from 'react';
import { withErrorHandling, AsyncErrorHandlerOptions } from '@/utils/asyncErrorHandler';

interface UseAsyncErrorOptions extends AsyncErrorHandlerOptions {
  onError?: (error: Error) => void;
  onSuccess?: (result: any) => void;
  onComplete?: () => void;
}

interface UseAsyncErrorReturn {
  execute: <T>(operation: () => Promise<T>, options?: UseAsyncErrorOptions) => Promise<T | null>;
  executeWithRetry: <T>(operation: () => Promise<T>, options?: UseAsyncErrorOptions) => Promise<T | null>;
  isExecuting: boolean;
  lastError: Error | null;
}

export function useAsyncError(): UseAsyncErrorReturn {
  const isExecutingRef = useRef(false);
  const lastErrorRef = useRef<Error | null>(null);

  const execute = useCallback(async <T>(
    operation: () => Promise<T>,
    options: UseAsyncErrorOptions = {}
  ): Promise<T | null> => {
    if (isExecutingRef.current) {
      console.warn('Async operation already in progress');
      return null;
    }

    isExecutingRef.current = true;
    lastErrorRef.current = null;

    try {
      const result = await withErrorHandling(operation, {
        maxRetries: 0, // No retries by default for execute
        ...options,
      });

      if (result && options.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      lastErrorRef.current = errorObj;
      
      if (options.onError) {
        options.onError(errorObj);
      }

      return null;
    } finally {
      isExecutingRef.current = false;
      
      if (options.onComplete) {
        options.onComplete();
      }
    }
  }, []);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    options: UseAsyncErrorOptions = {}
  ): Promise<T | null> => {
    return execute(operation, {
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true,
      ...options,
    });
  }, [execute]);

  return {
    execute,
    executeWithRetry,
    isExecuting: isExecutingRef.current,
    lastError: lastErrorRef.current,
  };
}

// Specialized hooks for different types of operations
export function useApiError() {
  const asyncError = useAsyncError();
  
  const executeApi = useCallback(async <T>(
    operation: () => Promise<T>,
    options: UseAsyncErrorOptions = {}
  ): Promise<T | null> => {
    return asyncError.execute(operation, {
      maxRetries: 2,
      retryDelay: 1500,
      exponentialBackoff: true,
      customErrorMessage: 'API request failed',
      ...options,
      context: {
        component: 'ApiHook',
        ...options.context,
      },
    });
  }, [asyncError]);

  return {
    ...asyncError,
    executeApi,
  };
}

export function useNetworkError() {
  const asyncError = useAsyncError();
  
  const executeNetwork = useCallback(async <T>(
    operation: () => Promise<T>,
    options: UseAsyncErrorOptions = {}
  ): Promise<T | null> => {
    return asyncError.execute(operation, {
      maxRetries: 3,
      retryDelay: 2000,
      exponentialBackoff: true,
      customErrorMessage: 'Network request failed',
      ...options,
      context: {
        component: 'NetworkHook',
        ...options.context,
      },
    });
  }, [asyncError]);

  return {
    ...asyncError,
    executeNetwork,
  };
}

export function useStreamError() {
  const asyncError = useAsyncError();
  
  const executeStream = useCallback(async <T>(
    operation: () => Promise<T>,
    streamId: string,
    options: UseAsyncErrorOptions = {}
  ): Promise<T | null> => {
    return asyncError.execute(operation, {
      maxRetries: 5,
      retryDelay: 3000,
      exponentialBackoff: true,
      customErrorMessage: 'Stream operation failed',
      ...options,
      context: {
        component: 'StreamHook',
        additionalData: {
          streamId,
          ...options.context?.additionalData,
        },
        ...options.context,
      },
    });
  }, [asyncError]);

  return {
    ...asyncError,
    executeStream,
  };
}

// Higher-order hook for creating custom error handlers
export function useCustomAsyncError<T = any>(
  defaultOptions: UseAsyncErrorOptions
) {
  const asyncError = useAsyncError();
  
  const executeCustom = useCallback(async (
    operation: () => Promise<T>,
    options: UseAsyncErrorOptions = {}
  ): Promise<T | null> => {
    return asyncError.execute(operation, {
      ...defaultOptions,
      ...options,
      context: {
        ...defaultOptions.context,
        ...options.context,
      },
    });
  }, [asyncError, defaultOptions]);

  return {
    ...asyncError,
    executeCustom,
  };
}