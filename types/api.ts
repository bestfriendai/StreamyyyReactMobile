/**
 * API types and interfaces for consistent data handling
 */

/**
 * Generic API response structure
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: PaginationInfo;
  metadata?: Record<string, any>;
}

/**
 * Pagination information for API responses
 */
export interface PaginationInfo {
  cursor?: string;
  hasMore?: boolean;
  total?: number;
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Standard API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  statusCode?: number;
}

/**
 * API request options
 */
export interface ApiRequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  cache?: boolean;
  cacheKey?: string;
  cacheTTL?: number;
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
  interceptors?: {
    request?: (config: any) => any;
    response?: (response: any) => any;
    error?: (error: any) => any;
  };
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  requests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'fifo' | 'ttl';
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  type: 'bearer' | 'apiKey' | 'oauth' | 'basic';
  token?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  tokenExpiry?: number;
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
  retries?: number;
  timeout?: number;
}

/**
 * API health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    [key: string]: {
      status: 'up' | 'down' | 'degraded';
      responseTime?: number;
      error?: string;
    };
  };
}

/**
 * API metrics
 */
export interface ApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  errorRate: number;
  rateLimitHits: number;
  cacheHitRate: number;
  lastUpdated: string;
}

/**
 * Search parameters for API requests
 */
export interface SearchParams {
  query: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

/**
 * Batch operation request
 */
export interface BatchRequest<T> {
  operations: Array<{
    type: 'create' | 'update' | 'delete';
    id?: string;
    data: T;
  }>;
}

/**
 * Batch operation response
 */
export interface BatchResponse<T> {
  results: Array<{
    success: boolean;
    data?: T;
    error?: ApiError;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}