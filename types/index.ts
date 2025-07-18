/**
 * Core type definitions for the streaming application
 * This file consolidates all the main types used throughout the app
 */

// Re-export all types from individual modules
export * from './stream';
export * from './api';
export * from './ui';

// Additional core types that extend the base types
export interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  is_mature: boolean;
  // Enhanced properties
  fetchedAt?: string;
  embedUrl?: string;
  searchQuery?: string;
  streamAge?: number;
  minutesLive?: number;
  trendingScore?: number;
  engagementScore?: number;
  isNewStream?: boolean;
  isVeryNew?: boolean;
  isTrending?: boolean;
  isHot?: boolean;
  isRising?: boolean;
}

export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  created_at: string;
}

export interface TwitchGame {
  id: string;
  name: string;
  box_art_url: string;
}

// Layout Types
export interface Layout {
  id: string;
  name: string;
  description?: string;
  type: 'grid' | 'stacked' | 'pip' | 'focus' | 'mosaic';
  columns: number;
  rows?: number;
  streams: string[]; // Array of stream IDs
  settings: LayoutSettings;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  isDefault?: boolean;
}

export interface LayoutSettings {
  autoPlay: boolean;
  muted: boolean;
  quality: 'auto' | 'source' | '720p' | '480p' | '360p' | '160p';
  chatEnabled: boolean;
  showViewerCount: boolean;
  refreshInterval: number;
  showTitles: boolean;
  showStreamers: boolean;
  enableNotifications: boolean;
}

// Application State Types
export interface AppState {
  user: {
    id: string | null;
    preferences: UserPreferences;
    isAuthenticated: boolean;
  };
  streams: {
    active: Stream[];
    favorites: Stream[];
    layouts: Layout[];
    currentLayout: Layout | null;
    loading: boolean;
    error: string | null;
  };
  ui: {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    fullscreen: boolean;
    currentRoute: string;
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  autoPlay: boolean;
  notifications: boolean;
  language: string;
  quality: 'auto' | 'source' | '720p' | '480p' | '360p' | '160p';
  volume: number;
  chatEnabled: boolean;
  preferredPlatforms: StreamPlatform[];
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Event Types
export interface AppEvent {
  type: string;
  payload: unknown;
  timestamp: string;
  source: string;
}

// Configuration Types
export interface AppConfig {
  apiUrl: string;
  version: string;
  buildNumber: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    [key: string]: boolean;
  };
  limits: {
    maxStreams: number;
    maxLayouts: number;
    refreshInterval: number;
  };
}

// Storage Types
export interface StorageItem<T = unknown> {
  key: string;
  value: T;
  timestamp: string;
  expiresAt?: string;
}

export interface CacheItem<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Network Types
export interface NetworkRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
}

export interface NetworkResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  url: string;
  timestamp: string;
}

// Performance Types
export interface PerformanceMetrics {
  renderTime: number;
  loadTime: number;
  memoryUsage: number;
  networkLatency: number;
  timestamp: string;
}

// Analytics Types
export interface AnalyticsEvent {
  name: string;
  properties: Record<string, unknown>;
  userId?: string;
  timestamp: string;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type NonNullable<T> = T extends null | undefined ? never : T;

export type ValueOf<T> = T[keyof T];

export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

// Type Guards
export function isStream(obj: unknown): obj is Stream {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'username' in obj &&
    'platform' in obj &&
    'isLive' in obj
  );
}

export function isTwitchStream(obj: unknown): obj is TwitchStream {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'user_login' in obj &&
    'user_name' in obj &&
    'type' in obj
  );
}

export function isLayout(obj: unknown): obj is Layout {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'type' in obj &&
    'streams' in obj
  );
}

export function isAppError(obj: unknown): obj is AppError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'code' in obj &&
    'message' in obj &&
    'timestamp' in obj
  );
}

// Constants
export const STREAM_PLATFORMS = ['twitch', 'youtube', 'kick'] as const;
export const LAYOUT_TYPES = ['grid', 'stacked', 'pip', 'focus', 'mosaic'] as const;
export const STREAM_QUALITIES = ['auto', 'source', '720p', '480p', '360p', '160p'] as const;
export const THEMES = ['light', 'dark', 'system'] as const;

// Default values
export const DEFAULT_LAYOUT_SETTINGS: LayoutSettings = {
  autoPlay: true,
  muted: true,
  quality: 'auto',
  chatEnabled: true,
  showViewerCount: true,
  refreshInterval: 30000,
  showTitles: true,
  showStreamers: true,
  enableNotifications: true,
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'dark',
  autoPlay: true,
  notifications: true,
  language: 'en',
  quality: 'auto',
  volume: 0.5,
  chatEnabled: true,
  preferredPlatforms: ['twitch'],
};