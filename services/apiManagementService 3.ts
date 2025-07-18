export interface APIKey {
  id: string;
  name: string;
  description: string;
  key: string;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  permissions: APIPermission[];
  rateLimits: RateLimit[];
  ipWhitelist: string[];
  environment: 'development' | 'staging' | 'production';
  usage: {
    totalRequests: number;
    requestsToday: number;
    requestsThisMonth: number;
    errorRate: number;
    averageResponseTime: number;
  };
}

export interface APIPermission {
  resource: string;
  actions: string[];
  constraints?: {
    timeRange?: { start: string; end: string };
    maxRecords?: number;
    allowedFields?: string[];
    blockedFields?: string[];
  };
}

export interface RateLimit {
  name: string;
  requests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  version: string;
  description: string;
  parameters: APIParameter[];
  responses: APIResponse[];
  authentication: 'none' | 'api_key' | 'bearer' | 'oauth2';
  rateLimits: RateLimit[];
  isDeprecated: boolean;
  deprecationDate?: string;
  documentation: string;
  examples: APIExample[];
  tags: string[];
  isPublic: boolean;
}

export interface APIParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    enum?: any[];
    minimum?: number;
    maximum?: number;
  };
  example?: any;
}

export interface APIResponse {
  statusCode: number;
  description: string;
  schema: any;
  examples: Record<string, any>;
  headers?: Record<string, string>;
}

export interface APIExample {
  name: string;
  description: string;
  request: {
    headers?: Record<string, string>;
    parameters?: Record<string, any>;
    body?: any;
  };
  response: {
    statusCode: number;
    headers?: Record<string, string>;
    body: any;
  };
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  organizationId: string;
  retryPolicy: {
    maxRetries: number;
    backoffStrategy: 'linear' | 'exponential';
    initialDelay: number;
    maxDelay: number;
  };
  headers: Record<string, string>;
  lastDelivery?: {
    timestamp: string;
    statusCode: number;
    success: boolean;
    error?: string;
    responseTime: number;
  };
  deliveryStats: {
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    averageResponseTime: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface APIUsageMetrics {
  apiKeyId: string;
  endpoint: string;
  method: string;
  timestamp: string;
  responseTime: number;
  statusCode: number;
  userAgent: string;
  ipAddress: string;
  errorMessage?: string;
  requestSize: number;
  responseSize: number;
  cacheHit: boolean;
}

export interface APIAnalytics {
  totalRequests: number;
  totalErrors: number;
  averageResponseTime: number;
  requestsByEndpoint: { endpoint: string; count: number }[];
  requestsByStatusCode: { statusCode: number; count: number }[];
  requestsByTime: { timestamp: string; count: number }[];
  topConsumers: { apiKeyId: string; name: string; requests: number }[];
  errorsByEndpoint: { endpoint: string; errors: number }[];
  responseTimesByEndpoint: { endpoint: string; averageTime: number }[];
  rateLimitViolations: { apiKeyId: string; endpoint: string; count: number }[];
  geographicDistribution: { country: string; requests: number }[];
}

export interface APIDocs {
  title: string;
  description: string;
  version: string;
  baseUrl: string;
  authentication: {
    type: 'api_key' | 'bearer' | 'oauth2';
    description: string;
    flows?: any;
  };
  endpoints: APIEndpoint[];
  schemas: Record<string, any>;
  examples: APIExample[];
  changelog: {
    version: string;
    date: string;
    changes: string[];
  }[];
  contact: {
    name: string;
    email: string;
    url: string;
  };
  license: {
    name: string;
    url: string;
  };
}

export interface SDKConfig {
  language: 'javascript' | 'python' | 'php' | 'ruby' | 'java' | 'csharp' | 'go';
  packageName: string;
  version: string;
  endpoints: string[];
  authentication: 'api_key' | 'bearer' | 'oauth2';
  generateExamples: boolean;
  includeTypes: boolean;
  customization: {
    namespace?: string;
    className?: string;
    imports?: string[];
    utilities?: string[];
  };
}

class APIManagementService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.streammulti.com';
  private readonly cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    console.log('API Management Service initialized');
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Management request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`API Management request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // API Key Management
  async createAPIKey(keyData: Omit<APIKey, 'id' | 'key' | 'createdAt' | 'lastUsedAt' | 'usage'>): Promise<APIKey> {
    console.log('🔄 Creating API key:', keyData.name);
    
    try {
      const apiKey = await this.makeRequest<APIKey>('/enterprise/api/keys', {
        method: 'POST',
        body: JSON.stringify(keyData),
      });

      console.log('✅ API key created:', apiKey.name);
      return apiKey;
    } catch (error) {
      console.error('❌ Failed to create API key:', error);
      throw error;
    }
  }

  async getAPIKeys(organizationId: string, filters?: {
    environment?: string;
    isActive?: boolean;
    createdBy?: string;
  }): Promise<APIKey[]> {
    console.log('🔄 Fetching API keys');
    
    try {
      const params = new URLSearchParams({ organizationId });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
      }

      const keys = await this.makeRequest<APIKey[]>(`/enterprise/api/keys?${params.toString()}`);
      console.log('✅ API keys fetched:', keys.length);
      return keys;
    } catch (error) {
      console.error('❌ Failed to fetch API keys:', error);
      throw error;
    }
  }

  async updateAPIKey(keyId: string, updates: Partial<APIKey>): Promise<APIKey> {
    console.log('🔄 Updating API key:', keyId);
    
    try {
      const apiKey = await this.makeRequest<APIKey>(`/enterprise/api/keys/${keyId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      console.log('✅ API key updated');
      return apiKey;
    } catch (error) {
      console.error('❌ Failed to update API key:', error);
      throw error;
    }
  }

  async revokeAPIKey(keyId: string, reason?: string): Promise<void> {
    console.log('🔄 Revoking API key:', keyId);
    
    try {
      await this.makeRequest(`/enterprise/api/keys/${keyId}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });

      console.log('✅ API key revoked');
    } catch (error) {
      console.error('❌ Failed to revoke API key:', error);
      throw error;
    }
  }

  async regenerateAPIKey(keyId: string): Promise<APIKey> {
    console.log('🔄 Regenerating API key:', keyId);
    
    try {
      const apiKey = await this.makeRequest<APIKey>(`/enterprise/api/keys/${keyId}/regenerate`, {
        method: 'POST',
      });

      console.log('✅ API key regenerated');
      return apiKey;
    } catch (error) {
      console.error('❌ Failed to regenerate API key:', error);
      throw error;
    }
  }

  // Endpoint Management
  async getAPIEndpoints(version?: string, tags?: string[]): Promise<APIEndpoint[]> {
    console.log('🔄 Fetching API endpoints');
    
    try {
      const params = new URLSearchParams();
      if (version) params.append('version', version);
      if (tags) tags.forEach(tag => params.append('tags', tag));

      const endpoints = await this.makeRequest<APIEndpoint[]>(`/enterprise/api/endpoints?${params.toString()}`);
      console.log('✅ API endpoints fetched:', endpoints.length);
      return endpoints;
    } catch (error) {
      console.error('❌ Failed to fetch API endpoints:', error);
      throw error;
    }
  }

  async getAPIEndpoint(endpointId: string): Promise<APIEndpoint> {
    console.log('🔄 Fetching API endpoint:', endpointId);
    
    try {
      const endpoint = await this.makeRequest<APIEndpoint>(`/enterprise/api/endpoints/${endpointId}`);
      console.log('✅ API endpoint fetched');
      return endpoint;
    } catch (error) {
      console.error('❌ Failed to fetch API endpoint:', error);
      throw error;
    }
  }

  async testAPIEndpoint(endpointId: string, testData: {
    parameters?: Record<string, any>;
    headers?: Record<string, string>;
    body?: any;
  }): Promise<{
    statusCode: number;
    headers: Record<string, string>;
    body: any;
    responseTime: number;
    success: boolean;
    error?: string;
  }> {
    console.log('🔄 Testing API endpoint:', endpointId);
    
    try {
      const result = await this.makeRequest<any>(`/enterprise/api/endpoints/${endpointId}/test`, {
        method: 'POST',
        body: JSON.stringify(testData),
      });

      console.log('✅ API endpoint test completed');
      return result;
    } catch (error) {
      console.error('❌ Failed to test API endpoint:', error);
      throw error;
    }
  }

  // Webhook Management
  async createWebhookEndpoint(webhookData: Omit<WebhookEndpoint, 'id' | 'secret' | 'lastDelivery' | 'deliveryStats' | 'createdAt' | 'updatedAt'>): Promise<WebhookEndpoint> {
    console.log('🔄 Creating webhook endpoint:', webhookData.url);
    
    try {
      const webhook = await this.makeRequest<WebhookEndpoint>('/enterprise/api/webhooks', {
        method: 'POST',
        body: JSON.stringify(webhookData),
      });

      console.log('✅ Webhook endpoint created');
      return webhook;
    } catch (error) {
      console.error('❌ Failed to create webhook endpoint:', error);
      throw error;
    }
  }

  async getWebhookEndpoints(organizationId: string): Promise<WebhookEndpoint[]> {
    console.log('🔄 Fetching webhook endpoints');
    
    try {
      const webhooks = await this.makeRequest<WebhookEndpoint[]>(`/enterprise/api/webhooks?organizationId=${organizationId}`);
      console.log('✅ Webhook endpoints fetched:', webhooks.length);
      return webhooks;
    } catch (error) {
      console.error('❌ Failed to fetch webhook endpoints:', error);
      throw error;
    }
  }

  async updateWebhookEndpoint(webhookId: string, updates: Partial<WebhookEndpoint>): Promise<WebhookEndpoint> {
    console.log('🔄 Updating webhook endpoint:', webhookId);
    
    try {
      const webhook = await this.makeRequest<WebhookEndpoint>(`/enterprise/api/webhooks/${webhookId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      console.log('✅ Webhook endpoint updated');
      return webhook;
    } catch (error) {
      console.error('❌ Failed to update webhook endpoint:', error);
      throw error;
    }
  }

  async testWebhookEndpoint(webhookId: string, eventData: any): Promise<{
    success: boolean;
    statusCode: number;
    responseTime: number;
    error?: string;
  }> {
    console.log('🔄 Testing webhook endpoint:', webhookId);
    
    try {
      const result = await this.makeRequest<any>(`/enterprise/api/webhooks/${webhookId}/test`, {
        method: 'POST',
        body: JSON.stringify({ eventData }),
      });

      console.log('✅ Webhook endpoint test completed');
      return result;
    } catch (error) {
      console.error('❌ Failed to test webhook endpoint:', error);
      throw error;
    }
  }

  async getWebhookDeliveries(webhookId: string, limit: number = 50): Promise<{
    deliveries: {
      id: string;
      timestamp: string;
      event: string;
      statusCode: number;
      responseTime: number;
      success: boolean;
      attempts: number;
      nextRetry?: string;
      error?: string;
    }[];
    totalDeliveries: number;
  }> {
    console.log('🔄 Fetching webhook deliveries:', webhookId);
    
    try {
      const deliveries = await this.makeRequest<any>(`/enterprise/api/webhooks/${webhookId}/deliveries?limit=${limit}`);
      console.log('✅ Webhook deliveries fetched');
      return deliveries;
    } catch (error) {
      console.error('❌ Failed to fetch webhook deliveries:', error);
      throw error;
    }
  }

  // Analytics & Monitoring
  async getAPIAnalytics(organizationId: string, params: {
    startDate: string;
    endDate: string;
    apiKeyId?: string;
    endpoint?: string;
    granularity?: 'hour' | 'day' | 'week';
  }): Promise<APIAnalytics> {
    console.log('🔄 Fetching API analytics');
    
    try {
      const analytics = await this.makeRequest<APIAnalytics>('/enterprise/api/analytics', {
        method: 'POST',
        body: JSON.stringify({ organizationId, ...params }),
      });

      console.log('✅ API analytics fetched');
      return analytics;
    } catch (error) {
      console.error('❌ Failed to fetch API analytics:', error);
      throw error;
    }
  }

  async getAPIUsageLogs(organizationId: string, filters?: {
    apiKeyId?: string;
    endpoint?: string;
    statusCode?: number;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<APIUsageMetrics[]> {
    console.log('🔄 Fetching API usage logs');
    
    try {
      const params = new URLSearchParams({ organizationId });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
      }

      const logs = await this.makeRequest<APIUsageMetrics[]>(`/enterprise/api/usage?${params.toString()}`);
      console.log('✅ API usage logs fetched:', logs.length);
      return logs;
    } catch (error) {
      console.error('❌ Failed to fetch API usage logs:', error);
      throw error;
    }
  }

  async getAPIHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
    responseTime: number;
    endpoints: {
      path: string;
      status: 'up' | 'down';
      responseTime: number;
      lastCheck: string;
    }[];
    incidents: {
      id: string;
      title: string;
      status: 'open' | 'investigating' | 'resolved';
      severity: 'low' | 'medium' | 'high' | 'critical';
      startTime: string;
      endTime?: string;
    }[];
  }> {
    console.log('🔄 Checking API health');
    
    try {
      const health = await this.makeRequest<any>('/enterprise/api/health');
      console.log('✅ API health check completed');
      return health;
    } catch (error) {
      console.error('❌ Failed to check API health:', error);
      throw error;
    }
  }

  // Documentation & SDK Generation
  async generateAPIDocs(organizationId: string, config?: {
    title?: string;
    description?: string;
    version?: string;
    includeExamples?: boolean;
    includeSchemas?: boolean;
    format?: 'openapi' | 'postman' | 'insomnia';
  }): Promise<APIDocs> {
    console.log('🔄 Generating API documentation');
    
    try {
      const docs = await this.makeRequest<APIDocs>('/enterprise/api/docs/generate', {
        method: 'POST',
        body: JSON.stringify({ organizationId, ...config }),
      });

      console.log('✅ API documentation generated');
      return docs;
    } catch (error) {
      console.error('❌ Failed to generate API documentation:', error);
      throw error;
    }
  }

  async generateSDK(organizationId: string, config: SDKConfig): Promise<{
    downloadUrl: string;
    packageName: string;
    version: string;
    documentation: string;
    examples: string[];
  }> {
    console.log('🔄 Generating SDK for:', config.language);
    
    try {
      const sdk = await this.makeRequest<any>('/enterprise/api/sdk/generate', {
        method: 'POST',
        body: JSON.stringify({ organizationId, ...config }),
      });

      console.log('✅ SDK generated:', config.language);
      return sdk;
    } catch (error) {
      console.error('❌ Failed to generate SDK:', error);
      throw error;
    }
  }

  async getAPIDocumentation(organizationId: string, version?: string): Promise<APIDocs> {
    console.log('🔄 Fetching API documentation');
    
    try {
      const params = version ? `?version=${version}` : '';
      const docs = await this.makeRequest<APIDocs>(`/enterprise/api/docs/${organizationId}${params}`);
      console.log('✅ API documentation fetched');
      return docs;
    } catch (error) {
      console.error('❌ Failed to fetch API documentation:', error);
      throw error;
    }
  }

  // Rate Limiting & Security
  async updateRateLimits(organizationId: string, limits: {
    global?: RateLimit[];
    perEndpoint?: { endpoint: string; limits: RateLimit[] }[];
    perApiKey?: { apiKeyId: string; limits: RateLimit[] }[];
  }): Promise<void> {
    console.log('🔄 Updating rate limits');
    
    try {
      await this.makeRequest('/enterprise/api/rate-limits', {
        method: 'PUT',
        body: JSON.stringify({ organizationId, ...limits }),
      });

      console.log('✅ Rate limits updated');
    } catch (error) {
      console.error('❌ Failed to update rate limits:', error);
      throw error;
    }
  }

  async getRateLimitStatus(apiKeyId: string): Promise<{
    remaining: number;
    resetTime: string;
    limit: number;
    windowMs: number;
    violations: {
      timestamp: string;
      endpoint: string;
      requestsAttempted: number;
    }[];
  }> {
    console.log('🔄 Checking rate limit status:', apiKeyId);
    
    try {
      const status = await this.makeRequest<any>(`/enterprise/api/rate-limits/${apiKeyId}/status`);
      console.log('✅ Rate limit status fetched');
      return status;
    } catch (error) {
      console.error('❌ Failed to check rate limit status:', error);
      throw error;
    }
  }

  async validateAPIKey(key: string): Promise<{
    valid: boolean;
    keyId?: string;
    organizationId?: string;
    permissions?: APIPermission[];
    rateLimits?: RateLimit[];
    expiresAt?: string;
    lastUsed?: string;
  }> {
    console.log('🔄 Validating API key');
    
    try {
      const validation = await this.makeRequest<any>('/enterprise/api/keys/validate', {
        method: 'POST',
        body: JSON.stringify({ key }),
      });

      console.log('✅ API key validation completed');
      return validation;
    } catch (error) {
      console.error('❌ Failed to validate API key:', error);
      throw error;
    }
  }

  // Utility Methods
  async exportAPIUsage(organizationId: string, format: 'csv' | 'json' | 'excel', filters?: {
    startDate?: string;
    endDate?: string;
    apiKeyId?: string;
    endpoint?: string;
  }): Promise<string> {
    console.log('🔄 Exporting API usage data');
    
    try {
      const result = await this.makeRequest<{ downloadUrl: string }>('/enterprise/api/usage/export', {
        method: 'POST',
        body: JSON.stringify({ organizationId, format, ...filters }),
      });

      console.log('✅ API usage export ready');
      return result.downloadUrl;
    } catch (error) {
      console.error('❌ Failed to export API usage:', error);
      throw error;
    }
  }

  async archiveOldLogs(organizationId: string, beforeDate: string): Promise<{
    archivedCount: number;
    archiveUrl: string;
  }> {
    console.log('🔄 Archiving old API logs');
    
    try {
      const result = await this.makeRequest<any>('/enterprise/api/logs/archive', {
        method: 'POST',
        body: JSON.stringify({ organizationId, beforeDate }),
      });

      console.log('✅ API logs archived:', result.archivedCount);
      return result;
    } catch (error) {
      console.error('❌ Failed to archive API logs:', error);
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
    console.log('✅ API Management cache cleared');
  }
}

export const apiManagementService = new APIManagementService();
export default apiManagementService;