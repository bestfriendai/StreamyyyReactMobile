/**
 * Core stream data structure
 */
export interface Stream {
  id: string;
  username: string;
  title: string;
  platform: StreamPlatform;
  thumbnailUrl: string;
  viewerCount: number;
  isLive: boolean;
  category: string;
  embedUrl: string;
  profileImageUrl: string;
  // Enhanced properties for better functionality
  language?: string;
  maturityRating?: 'mature' | 'general';
  tags?: string[];
  startedAt?: string;
  lastUpdated?: string;
  // Performance monitoring
  loadAttempts?: number;
  lastError?: string | null;
  addedAt?: string;
}

/**
 * Supported streaming platforms
 */
export type StreamPlatform = 'twitch' | 'youtube' | 'kick';

/**
 * Stream quality options
 */
export type StreamQuality = 'auto' | 'source' | '720p' | '480p' | '360p' | '160p';

/**
 * Stream layout configuration
 */
export interface StreamLayout {
  id: string;
  type: StreamLayoutType;
  streams: Stream[];
  gridColumns: number;
  createdAt: string;
  updatedAt?: string;
  name?: string;
  description?: string;
  userId?: string;
  isDefault?: boolean;
  // Layout-specific settings
  settings?: LayoutSettings;
}

/**
 * Layout types for multi-stream viewing
 */
export type StreamLayoutType = 'grid' | 'stacked' | 'pip' | 'focus' | 'mosaic';

/**
 * Layout-specific settings
 */
export interface LayoutSettings {
  autoPlay?: boolean;
  muted?: boolean;
  quality?: StreamQuality;
  chatEnabled?: boolean;
  showViewerCount?: boolean;
  refreshInterval?: number;
}

/**
 * Platform configuration
 */
export interface PlatformConfig {
  name: string;
  color: string;
  icon: string;
  baseUrl: string;
  embedUrlTemplate: string;
  // API configuration
  apiEndpoint?: string;
  authRequired?: boolean;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  // Feature support
  features?: {
    search: boolean;
    chat: boolean;
    clips: boolean;
    vod: boolean;
  };
}

/**
 * Stream health status
 */
export interface StreamHealth {
  isHealthy: boolean;
  loadAttempts: number;
  lastError: string | null;
  lastChecked: string;
  responseTime?: number;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: {
    cursor?: string;
    hasMore?: boolean;
    total?: number;
  };
  metadata?: Record<string, any>;
}

/**
 * Error response structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * Stream search filters
 */
export interface StreamSearchFilters {
  platform?: StreamPlatform[];
  category?: string[];
  language?: string[];
  viewerCountMin?: number;
  viewerCountMax?: number;
  isLive?: boolean;
  maturityRating?: 'mature' | 'general';
}

/**
 * Stream statistics
 */
export interface StreamStats {
  totalStreams: number;
  activeViewers: number;
  averageViewTime: number;
  peakViewers: number;
  popularCategories: Array<{
    name: string;
    count: number;
  }>;
}

/**
 * User preferences for stream viewing
 */
export interface StreamPreferences {
  defaultQuality: StreamQuality;
  autoPlay: boolean;
  muteByDefault: boolean;
  showChat: boolean;
  showViewerCount: boolean;
  preferredPlatforms: StreamPlatform[];
  blockedCategories: string[];
  notifications: {
    favoriteStreamLive: boolean;
    newStreamInCategory: boolean;
  };
}

/**
 * Generic repository interface for data operations
 */
export interface Repository<T, K = string> {
  findById(id: K): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<T[]>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: K, data: Partial<T>): Promise<T>;
  delete(id: K): Promise<boolean>;
  count(filters?: Record<string, any>): Promise<number>;
}

/**
 * Query options for data operations
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

/**
 * Service interface for consistent API
 */
export interface Service<T, K = string> {
  get(id: K): Promise<T | null>;
  getAll(options?: QueryOptions): Promise<T[]>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: K, data: Partial<T>): Promise<T>;
  remove(id: K): Promise<boolean>;
}

/**
 * Event emitter interface for stream events
 */
export interface StreamEventEmitter {
  on(event: StreamEventType, listener: (data: any) => void): void;
  off(event: StreamEventType, listener: (data: any) => void): void;
  emit(event: StreamEventType, data: any): void;
}

/**
 * Stream event types
 */
export type StreamEventType = 
  | 'stream-added'
  | 'stream-removed'
  | 'stream-updated'
  | 'stream-error'
  | 'stream-reconnected'
  | 'layout-changed'
  | 'quality-changed'
  | 'favorite-added'
  | 'favorite-removed';

/**
 * Configuration for stream components
 */
export interface StreamComponentConfig {
  enableChat?: boolean;
  enableControls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  quality?: StreamQuality;
  theme?: 'light' | 'dark';
  responsive?: boolean;
  errorRetryCount?: number;
  refreshInterval?: number;
}