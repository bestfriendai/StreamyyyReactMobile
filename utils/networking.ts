/**
 * Comprehensive networking utility for all API requests
 * Provides standardized error handling, retry logic, and request management
 */

export interface NetworkRequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cache?: boolean;
  signal?: AbortSignal;
}

export interface NetworkResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
  success: boolean;
}

export interface NetworkError extends Error {
  status?: number;
  code?: string;
  retryable: boolean;
  response?: Response;
}

interface RequestCache {
  data: any;
  timestamp: number;
  ttl: number;
}

class NetworkManager {
  private cache = new Map<string, RequestCache>();
  private readonly defaultConfig = {
    timeout: 15000,
    retries: 3,
    retryDelay: 1000,
    cache: false,
  };

  // Rate limiting tracking
  private rateLimits = new Map<string, {
    remaining: number;
    reset: number;
    limit: number;
  }>();

  // Request queue for managing concurrent requests
  private requestQueue = new Map<string, Promise<any>>();

  /**
   * Make a network request with comprehensive error handling
   */
  async request<T = any>(config: NetworkRequestConfig): Promise<NetworkResponse<T>> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const cacheKey = this.getCacheKey(config);

    // Check cache first
    if (finalConfig.cache && this.hasValidCache(cacheKey)) {
      console.log(`📋 Cache hit for ${config.url}`);
      const cached = this.getFromCache(cacheKey);
      return {
        data: cached,
        status: 200,
        headers: new Headers(),
        success: true,
      };
    }

    // Check if identical request is already in progress
    if (this.requestQueue.has(cacheKey)) {
      console.log(`⏳ Request already in progress for ${config.url}`);
      return this.requestQueue.get(cacheKey)!;
    }

    // Create request promise
    const requestPromise = this.executeRequest<T>(finalConfig, cacheKey);
    this.requestQueue.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  /**
   * Execute the actual network request with retry logic
   */
  private async executeRequest<T>(
    config: NetworkRequestConfig, 
    cacheKey: string
  ): Promise<NetworkResponse<T>> {
    let lastError: NetworkError | null = null;

    for (let attempt = 0; attempt <= config.retries!; attempt++) {
      try {
        // Check rate limiting
        if (this.isRateLimited(config.url)) {
          const rateLimitInfo = this.getRateLimitInfo(config.url);
          const waitTime = rateLimitInfo.reset - Date.now();
          
          if (waitTime > 0 && waitTime < 60000) { // Max 1 minute wait
            console.log(`🚫 Rate limited, waiting ${waitTime}ms`);
            await this.delay(waitTime);
          } else {
            throw this.createNetworkError(
              'Rate limit exceeded',
              429,
              'RATE_LIMITED',
              false
            );
          }
        }

        const response = await this.fetchWithTimeout(config);
        
        // Update rate limit info
        this.updateRateLimitInfo(config.url, response);

        if (!response.ok) {
          throw await this.handleErrorResponse(response, attempt, config.retries!);
        }

        const data = await this.parseResponse<T>(response);
        
        // Cache successful response
        if (config.cache) {
          this.setCache(cacheKey, data);
        }

        console.log(`✅ Request successful: ${config.method || 'GET'} ${config.url}`);
        
        return {
          data,
          status: response.status,
          headers: response.headers,
          success: true,
        };

      } catch (error) {
        lastError = error instanceof Error ? 
          this.normalizeError(error, config.url) : 
          this.createNetworkError('Unknown error', 0, 'UNKNOWN', false);

        console.warn(`🔄 Request failed (attempt ${attempt + 1}/${config.retries! + 1}):`, {
          url: config.url,
          error: lastError.message,
          retryable: lastError.retryable
        });

        // Don't retry if error is not retryable or it's the last attempt
        if (!lastError.retryable || attempt === config.retries) {
          break;
        }

        // Calculate backoff delay
        const delay = this.calculateBackoffDelay(attempt, config.retryDelay!);
        await this.delay(delay);
      }
    }

    console.error(`❌ Request failed after ${config.retries! + 1} attempts:`, {
      url: config.url,
      error: lastError?.message
    });

    throw lastError || this.createNetworkError('Request failed', 0, 'REQUEST_FAILED', false);
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(config: NetworkRequestConfig): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    // Use provided signal or create new one
    const signal = config.signal || controller.signal;

    try {
      const response = await fetch(config.url, {
        method: config.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'StreamYYY/1.0 (Multi-Platform Streaming App)',
          ...config.headers,
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Parse response based on content type
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return response.json();
    } else if (contentType.includes('text/')) {
      return response.text() as unknown as T;
    } else {
      return response.blob() as unknown as T;
    }
  }

  /**
   * Handle error responses with specific status code logic
   */
  private async handleErrorResponse(
    response: Response, 
    attempt: number, 
    maxRetries: number
  ): Promise<never> {
    let errorData: any = {};
    
    try {
      const text = await response.text();
      if (text) {
        errorData = JSON.parse(text);
      }
    } catch {
      // Ignore parse errors
    }

    const message = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
    
    // Determine if error is retryable
    const retryable = this.isRetryableError(response.status, attempt, maxRetries);
    
    throw this.createNetworkError(
      message,
      response.status,
      this.getErrorCode(response.status),
      retryable,
      response
    );
  }

  /**
   * Determine if an error should be retried
   */
  private isRetryableError(status: number, attempt: number, maxRetries: number): boolean {
    if (attempt >= maxRetries) return false;

    // Retry on server errors and rate limits
    if (status >= 500) return true;
    if (status === 429) return true;
    if (status === 408) return true; // Request timeout
    if (status === 502) return true; // Bad gateway
    if (status === 503) return true; // Service unavailable
    if (status === 504) return true; // Gateway timeout

    return false;
  }

  /**
   * Get error code for status
   */
  private getErrorCode(status: number): string {
    switch (status) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 429: return 'RATE_LIMITED';
      case 500: return 'INTERNAL_SERVER_ERROR';
      case 502: return 'BAD_GATEWAY';
      case 503: return 'SERVICE_UNAVAILABLE';
      case 504: return 'GATEWAY_TIMEOUT';
      default: return 'UNKNOWN_ERROR';
    }
  }

  /**
   * Create standardized network error
   */
  private createNetworkError(
    message: string,
    status: number,
    code: string,
    retryable: boolean,
    response?: Response
  ): NetworkError {
    const error = new Error(message) as NetworkError;
    error.status = status;
    error.code = code;
    error.retryable = retryable;
    error.response = response;
    return error;
  }

  /**
   * Normalize different error types
   */
  private normalizeError(error: Error, url: string): NetworkError {
    if (error.name === 'AbortError') {
      return this.createNetworkError(
        'Request timeout',
        408,
        'TIMEOUT',
        true
      );
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return this.createNetworkError(
        'Network error - check your internet connection',
        0,
        'NETWORK_ERROR',
        true
      );
    }

    return this.createNetworkError(
      error.message,
      0,
      'UNKNOWN',
      false
    );
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(attempt: number, baseDelay: number): number {
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cache management
   */
  private getCacheKey(config: NetworkRequestConfig): string {
    const parts = [
      config.method || 'GET',
      config.url,
      config.body ? JSON.stringify(config.body) : ''
    ];
    return parts.join('|');
  }

  private hasValidCache(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    return Date.now() - cached.timestamp < cached.ttl;
  }

  private getFromCache(key: string): any {
    return this.cache.get(key)?.data;
  }

  private setCache(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Clean up old cache entries
    if (this.cache.size > 100) {
      const entries = Array.from(this.cache.entries());
      const oldest = entries
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 20);
      
      oldest.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Rate limiting management
   */
  private updateRateLimitInfo(url: string, response: Response): void {
    const remaining = response.headers.get('x-ratelimit-remaining') || 
                     response.headers.get('ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset') || 
                  response.headers.get('ratelimit-reset');
    const limit = response.headers.get('x-ratelimit-limit') || 
                  response.headers.get('ratelimit-limit');

    if (remaining && reset && limit) {
      const domain = new URL(url).hostname;
      this.rateLimits.set(domain, {
        remaining: parseInt(remaining),
        reset: parseInt(reset) * 1000, // Convert to milliseconds
        limit: parseInt(limit),
      });
    }
  }

  private isRateLimited(url: string): boolean {
    const domain = new URL(url).hostname;
    const rateLimit = this.rateLimits.get(domain);
    
    if (!rateLimit) return false;
    
    return rateLimit.remaining <= 0 && Date.now() < rateLimit.reset;
  }

  private getRateLimitInfo(url: string) {
    const domain = new URL(url).hostname;
    return this.rateLimits.get(domain) || {
      remaining: 0,
      reset: Date.now() + 60000,
      limit: 100,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Network cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses to calculate
    };
  }

  /**
   * Get rate limit status for a domain
   */
  getRateLimitStatus(url: string) {
    const domain = new URL(url).hostname;
    return this.rateLimits.get(domain) || null;
  }
}

// Export singleton instance
export const networkManager = new NetworkManager();

// Convenience functions
export const get = <T = any>(url: string, config?: Partial<NetworkRequestConfig>) =>
  networkManager.request<T>({ ...config, url, method: 'GET' });

export const post = <T = any>(url: string, body?: any, config?: Partial<NetworkRequestConfig>) =>
  networkManager.request<T>({ ...config, url, method: 'POST', body });

export const put = <T = any>(url: string, body?: any, config?: Partial<NetworkRequestConfig>) =>
  networkManager.request<T>({ ...config, url, method: 'PUT', body });

export const del = <T = any>(url: string, config?: Partial<NetworkRequestConfig>) =>
  networkManager.request<T>({ ...config, url, method: 'DELETE' });

export const patch = <T = any>(url: string, body?: any, config?: Partial<NetworkRequestConfig>) =>
  networkManager.request<T>({ ...config, url, method: 'PATCH', body });

// Error handling utilities
export const isNetworkError = (error: any): error is NetworkError => {
  return error && typeof error.retryable === 'boolean';
};

export const shouldRetryError = (error: any): boolean => {
  return isNetworkError(error) && error.retryable;
};

export const getErrorMessage = (error: any): string => {
  if (isNetworkError(error)) {
    switch (error.code) {
      case 'TIMEOUT':
        return 'Request timed out. Please try again.';
      case 'NETWORK_ERROR':
        return 'Network error. Please check your internet connection.';
      case 'RATE_LIMITED':
        return 'Too many requests. Please wait a moment and try again.';
      case 'UNAUTHORIZED':
        return 'Authentication failed. Please sign in again.';
      case 'FORBIDDEN':
        return 'Access denied. You may not have permission for this action.';
      case 'NOT_FOUND':
        return 'The requested resource was not found.';
      case 'SERVICE_UNAVAILABLE':
        return 'Service is temporarily unavailable. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
  
  return error?.message || 'An unexpected error occurred.';
};