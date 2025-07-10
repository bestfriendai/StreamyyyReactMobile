/**
 * Application configuration management
 * Centralized configuration for all app settings
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Environment types
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * Configuration interface
 */
export interface AppConfig {
  environment: Environment;
  api: {
    baseURL: string;
    timeout: number;
    retries: number;
    retryDelay: number;
  };
  twitch: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  supabase: {
    url: string;
    anonKey: string;
  };
  features: {
    enableAnalytics: boolean;
    enableCrashReporting: boolean;
    enablePushNotifications: boolean;
    enableBiometrics: boolean;
    enableOfflineMode: boolean;
    maxStreams: number;
    cacheTimeout: number;
  };
  ui: {
    theme: 'light' | 'dark' | 'system';
    animationsEnabled: boolean;
    hapticsEnabled: boolean;
    autoPlay: boolean;
    defaultQuality: 'auto' | 'source' | '720p' | '480p' | '360p';
  };
  storage: {
    encryptSensitiveData: boolean;
    maxCacheSize: number;
    cacheCleanupInterval: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsoleLogging: boolean;
    enableRemoteLogging: boolean;
    maxLogSize: number;
  };
  performance: {
    enableProfiling: boolean;
    memoryWarningThreshold: number;
    networkTimeoutThreshold: number;
  };
  security: {
    enablePinning: boolean;
    enableJailbreakDetection: boolean;
    sessionTimeout: number;
    maxFailedAttempts: number;
  };
}\n\n/**\n * Get current environment\n */\nfunction getEnvironment(): Environment {\n  if (__DEV__) {\n    return 'development';\n  }\n  \n  const releaseChannel = Constants.expoConfig?.extra?.releaseChannel;\n  if (releaseChannel === 'staging') {\n    return 'staging';\n  }\n  \n  return 'production';\n}\n\n/**\n * Get environment variable with fallback\n */\nfunction getEnvVar(key: string, fallback?: string): string {\n  const value = process.env[key] || Constants.expoConfig?.extra?.[key];\n  if (!value && fallback === undefined) {\n    throw new Error(`Environment variable ${key} is required but not set`);\n  }\n  return value || fallback || '';\n}\n\n/**\n * Base configuration\n */\nconst baseConfig: AppConfig = {\n  environment: getEnvironment(),\n  api: {\n    baseURL: getEnvVar('API_BASE_URL', 'https://api.streamyyy.com'),\n    timeout: 30000,\n    retries: 3,\n    retryDelay: 1000,\n  },\n  twitch: {\n    clientId: getEnvVar('EXPO_PUBLIC_TWITCH_CLIENT_ID', ''),\n    clientSecret: getEnvVar('EXPO_PUBLIC_TWITCH_CLIENT_SECRET', ''),\n    redirectUri: getEnvVar('TWITCH_REDIRECT_URI', 'https://streamyyy.com/auth/callback'),\n  },\n  supabase: {\n    url: getEnvVar('EXPO_PUBLIC_SUPABASE_URL', ''),\n    anonKey: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY', ''),\n  },\n  features: {\n    enableAnalytics: true,\n    enableCrashReporting: true,\n    enablePushNotifications: true,\n    enableBiometrics: Platform.OS === 'ios',\n    enableOfflineMode: true,\n    maxStreams: 4,\n    cacheTimeout: 300000, // 5 minutes\n  },\n  ui: {\n    theme: 'dark',\n    animationsEnabled: true,\n    hapticsEnabled: true,\n    autoPlay: true,\n    defaultQuality: 'auto',\n  },\n  storage: {\n    encryptSensitiveData: true,\n    maxCacheSize: 100 * 1024 * 1024, // 100MB\n    cacheCleanupInterval: 24 * 60 * 60 * 1000, // 24 hours\n  },\n  logging: {\n    level: 'info',\n    enableConsoleLogging: true,\n    enableRemoteLogging: false,\n    maxLogSize: 10 * 1024 * 1024, // 10MB\n  },\n  performance: {\n    enableProfiling: false,\n    memoryWarningThreshold: 0.8,\n    networkTimeoutThreshold: 5000,\n  },\n  security: {\n    enablePinning: true,\n    enableJailbreakDetection: false,\n    sessionTimeout: 30 * 60 * 1000, // 30 minutes\n    maxFailedAttempts: 5,\n  },\n};\n\n/**\n * Environment-specific overrides\n */\nconst environmentConfigs: Record<Environment, Partial<AppConfig>> = {\n  development: {\n    api: {\n      baseURL: 'http://localhost:3000',\n      timeout: 10000,\n      retries: 1,\n      retryDelay: 500,\n    },\n    features: {\n      enableAnalytics: false,\n      enableCrashReporting: false,\n      cacheTimeout: 60000, // 1 minute\n    },\n    logging: {\n      level: 'debug',\n      enableConsoleLogging: true,\n      enableRemoteLogging: false,\n    },\n    performance: {\n      enableProfiling: true,\n    },\n    security: {\n      enablePinning: false,\n      enableJailbreakDetection: false,\n    },\n  },\n  staging: {\n    api: {\n      baseURL: 'https://staging-api.streamyyy.com',\n      timeout: 20000,\n      retries: 2,\n      retryDelay: 750,\n    },\n    features: {\n      enableAnalytics: true,\n      enableCrashReporting: true,\n      cacheTimeout: 180000, // 3 minutes\n    },\n    logging: {\n      level: 'debug',\n      enableRemoteLogging: true,\n    },\n    performance: {\n      enableProfiling: true,\n    },\n  },\n  production: {\n    logging: {\n      level: 'error',\n      enableConsoleLogging: false,\n      enableRemoteLogging: true,\n    },\n  },\n};\n\n/**\n * Merge configurations\n */\nfunction mergeConfigs(base: AppConfig, override: Partial<AppConfig>): AppConfig {\n  const result = { ...base };\n  \n  Object.keys(override).forEach(key => {\n    const overrideValue = override[key as keyof AppConfig];\n    if (overrideValue && typeof overrideValue === 'object' && !Array.isArray(overrideValue)) {\n      result[key as keyof AppConfig] = {\n        ...result[key as keyof AppConfig],\n        ...overrideValue,\n      } as any;\n    } else {\n      result[key as keyof AppConfig] = overrideValue as any;\n    }\n  });\n  \n  return result;\n}\n\n/**\n * Final configuration\n */\nexport const config: AppConfig = mergeConfigs(\n  baseConfig,\n  environmentConfigs[getEnvironment()]\n);\n\n/**\n * Configuration validation\n */\nfunction validateConfig(): void {\n  const errors: string[] = [];\n  \n  // Validate required Twitch credentials\n  if (!config.twitch.clientId) {\n    errors.push('Twitch Client ID is required');\n  }\n  if (!config.twitch.clientSecret) {\n    errors.push('Twitch Client Secret is required');\n  }\n  \n  // Validate Supabase credentials if using database features\n  if (!config.supabase.url) {\n    errors.push('Supabase URL is required');\n  }\n  if (!config.supabase.anonKey) {\n    errors.push('Supabase Anon Key is required');\n  }\n  \n  // Validate numeric values\n  if (config.api.timeout <= 0) {\n    errors.push('API timeout must be greater than 0');\n  }\n  if (config.features.maxStreams <= 0) {\n    errors.push('Max streams must be greater than 0');\n  }\n  \n  if (errors.length > 0) {\n    console.warn('Configuration validation errors:', errors);\n    if (config.environment === 'production') {\n      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);\n    }\n  }\n}\n\n// Validate configuration on module load\nvalidateConfig();\n\n/**\n * Configuration helpers\n */\nexport const configHelpers = {\n  isDevelopment: () => config.environment === 'development',\n  isStaging: () => config.environment === 'staging',\n  isProduction: () => config.environment === 'production',\n  isDebugMode: () => config.logging.level === 'debug',\n  shouldLogToConsole: () => config.logging.enableConsoleLogging,\n  shouldLogRemotely: () => config.logging.enableRemoteLogging,\n  getApiUrl: (path: string) => `${config.api.baseURL}${path}`,\n  getTwitchEmbedUrl: (channel: string) => \n    `https://player.twitch.tv/?channel=${channel}&parent=${config.twitch.redirectUri}`,\n};\n\n/**\n * Runtime configuration updates\n */\nexport const configUpdater = {\n  updateTheme: (theme: 'light' | 'dark' | 'system') => {\n    config.ui.theme = theme;\n  },\n  updateMaxStreams: (maxStreams: number) => {\n    config.features.maxStreams = Math.max(1, Math.min(20, maxStreams));\n  },\n  updateQuality: (quality: 'auto' | 'source' | '720p' | '480p' | '360p') => {\n    config.ui.defaultQuality = quality;\n  },\n  toggleAnimations: (enabled: boolean) => {\n    config.ui.animationsEnabled = enabled;\n  },\n  toggleHaptics: (enabled: boolean) => {\n    config.ui.hapticsEnabled = enabled;\n  },\n};\n\n/**\n * Export individual config sections for easier imports\n */\nexport const apiConfig = config.api;\nexport const twitchConfig = config.twitch;\nexport const supabaseConfig = config.supabase;\nexport const featuresConfig = config.features;\nexport const uiConfig = config.ui;\nexport const storageConfig = config.storage;\nexport const loggingConfig = config.logging;\nexport const performanceConfig = config.performance;\nexport const securityConfig = config.security;\n\n/**\n * Debug information\n */\nif (config.environment === 'development') {\n  console.log('🔧 App Configuration:', {\n    environment: config.environment,\n    apiBaseURL: config.api.baseURL,\n    features: config.features,\n    ui: config.ui,\n  });\n}\n\nexport default config;