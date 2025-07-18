/**
 * Service Container - Dependency Injection Container
 * Manages service lifecycle and dependencies
 */
import { Repository, Service, QueryOptions } from '@/types/stream';
import { ApiClientConfig } from '@/types/api';

/**
 * Service container interface
 */
export interface ServiceContainer {
  register<T>(key: string, factory: () => T): void;
  registerSingleton<T>(key: string, factory: () => T): void;
  resolve<T>(key: string): T;
  has(key: string): boolean;
  remove(key: string): void;
  clear(): void;
}

/**
 * Service lifecycle types
 */
export enum ServiceLifecycle {
  TRANSIENT = 'transient',
  SINGLETON = 'singleton',
  SCOPED = 'scoped'
}

/**
 * Service registration interface
 */
export interface ServiceRegistration<T> {
  key: string;
  factory: () => T;
  lifecycle: ServiceLifecycle;
  dependencies?: string[];
  singleton?: T;
}

/**
 * Dependency injection container implementation
 */
export class DIContainer implements ServiceContainer {
  private static instance: DIContainer;
  private services = new Map<string, ServiceRegistration<any>>();
  private resolving = new Set<string>();

  private constructor() {}

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * Register a transient service
   */
  register<T>(key: string, factory: () => T, dependencies?: string[]): void {
    this.services.set(key, {
      key,
      factory,
      lifecycle: ServiceLifecycle.TRANSIENT,
      dependencies
    });
  }

  /**
   * Register a singleton service
   */
  registerSingleton<T>(key: string, factory: () => T, dependencies?: string[]): void {
    this.services.set(key, {
      key,
      factory,
      lifecycle: ServiceLifecycle.SINGLETON,
      dependencies
    });
  }

  /**
   * Register a scoped service
   */
  registerScoped<T>(key: string, factory: () => T, dependencies?: string[]): void {
    this.services.set(key, {
      key,
      factory,
      lifecycle: ServiceLifecycle.SCOPED,
      dependencies
    });
  }

  /**
   * Resolve a service by key
   */
  resolve<T>(key: string): T {
    const registration = this.services.get(key);
    if (!registration) {
      throw new Error(`Service '${key}' not found. Make sure it's registered.`);
    }

    // Check for circular dependencies
    if (this.resolving.has(key)) {
      throw new Error(`Circular dependency detected for service '${key}'`);
    }

    try {
      this.resolving.add(key);

      // Handle singleton lifecycle
      if (registration.lifecycle === ServiceLifecycle.SINGLETON) {
        if (registration.singleton) {
          return registration.singleton;
        }
        
        const instance = this.createInstance(registration);
        registration.singleton = instance;
        return instance;
      }

      // Handle transient and scoped lifecycles
      return this.createInstance(registration);
    } finally {
      this.resolving.delete(key);
    }
  }

  /**
   * Create service instance with dependency injection
   */
  private createInstance<T>(registration: ServiceRegistration<T>): T {
    // Resolve dependencies first
    const resolvedDependencies: any[] = [];
    if (registration.dependencies) {
      for (const dep of registration.dependencies) {
        resolvedDependencies.push(this.resolve(dep));
      }
    }

    // Create instance
    return registration.factory();
  }

  /**
   * Check if service is registered
   */
  has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * Remove a service registration
   */
  remove(key: string): void {
    this.services.delete(key);
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * Get all registered service keys
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get service info
   */
  getServiceInfo(key: string): ServiceRegistration<any> | undefined {
    return this.services.get(key);
  }
}

/**
 * Service decorator for automatic registration
 */
export function Injectable(key: string, lifecycle: ServiceLifecycle = ServiceLifecycle.TRANSIENT) {
  return function <T extends new (...args: any[]) => any>(constructor: T) {
    const container = DIContainer.getInstance();
    
    switch (lifecycle) {
      case ServiceLifecycle.SINGLETON:
        container.registerSingleton(key, () => new constructor());
        break;
      case ServiceLifecycle.SCOPED:
        container.registerScoped(key, () => new constructor());
        break;
      default:
        container.register(key, () => new constructor());
    }
    
    return constructor;
  };
}

/**
 * Inject decorator for property injection
 */
export function Inject(key: string) {
  return function (target: any, propertyKey: string) {
    const container = DIContainer.getInstance();
    
    Object.defineProperty(target, propertyKey, {
      get: function() {
        return container.resolve(key);
      },
      enumerable: true,
      configurable: true
    });
  };
}

/**
 * Abstract base service class
 */
export abstract class BaseService {
  protected container: DIContainer;

  constructor() {
    this.container = DIContainer.getInstance();
  }

  protected getDependency<T>(key: string): T {
    return this.container.resolve<T>(key);
  }
}

/**
 * Service factory for creating configured services
 */
export class ServiceFactory {
  private static container = DIContainer.getInstance();

  /**
   * Create API client with configuration
   */
  static createApiClient(config: ApiClientConfig) {
    return {
      baseURL: config.baseURL,
      timeout: config.timeout,
      retries: config.retries,
      headers: config.headers,
      
      async request<T>(endpoint: string, options: any = {}): Promise<T> {
        // Implementation would go here
        throw new Error('Not implemented');
      }
    };
  }

  /**
   * Create repository with generic type
   */
  static createRepository<T, K = string>(): Repository<T, K> {
    return {
      async findById(id: K): Promise<T | null> {
        throw new Error('Not implemented');
      },
      
      async findAll(options?: QueryOptions): Promise<T[]> {
        throw new Error('Not implemented');
      },
      
      async create(data: Omit<T, 'id'>): Promise<T> {
        throw new Error('Not implemented');
      },
      
      async update(id: K, data: Partial<T>): Promise<T> {
        throw new Error('Not implemented');
      },
      
      async delete(id: K): Promise<boolean> {
        throw new Error('Not implemented');
      },
      
      async count(filters?: Record<string, any>): Promise<number> {
        throw new Error('Not implemented');
      }
    };
  }

  /**
   * Create service with repository
   */
  static createService<T, K = string>(repository: Repository<T, K>): Service<T, K> {
    return {
      async get(id: K): Promise<T | null> {
        return repository.findById(id);
      },
      
      async getAll(options?: QueryOptions): Promise<T[]> {
        return repository.findAll(options);
      },
      
      async create(data: Omit<T, 'id'>): Promise<T> {
        return repository.create(data);
      },
      
      async update(id: K, data: Partial<T>): Promise<T> {
        return repository.update(id, data);
      },
      
      async remove(id: K): Promise<boolean> {
        return repository.delete(id);
      }
    };
  }
}

// Export singleton container instance
export const serviceContainer = DIContainer.getInstance();

// Service registration helpers
export const registerService = <T>(key: string, factory: () => T, dependencies?: string[]) => {
  serviceContainer.register(key, factory, dependencies);
};

export const registerSingleton = <T>(key: string, factory: () => T, dependencies?: string[]) => {
  serviceContainer.registerSingleton(key, factory, dependencies);
};

export const resolveService = <T>(key: string): T => {
  return serviceContainer.resolve<T>(key);
};

/**
 * Service keys for consistent resolution
 */
export const ServiceKeys = {
  // Core services
  API_CLIENT: 'apiClient',
  ERROR_REPORTER: 'errorReporter',
  STORAGE_SERVICE: 'storageService',
  CACHE_SERVICE: 'cacheService',
  
  // Stream services
  STREAM_SERVICE: 'streamService',
  STREAM_REPOSITORY: 'streamRepository',
  TWITCH_API: 'twitchApi',
  STREAM_MANAGER: 'streamManager',
  
  // Auth services
  AUTH_SERVICE: 'authService',
  AUTH_REPOSITORY: 'authRepository',
  
  // Database services
  DATABASE_SERVICE: 'databaseService',
  SUPABASE_CLIENT: 'supabaseClient',
  
  // UI services
  THEME_SERVICE: 'themeService',
  NAVIGATION_SERVICE: 'navigationService',
  TOAST_SERVICE: 'toastService',
  
  // Analytics services
  ANALYTICS_SERVICE: 'analyticsService',
  PERFORMANCE_MONITOR: 'performanceMonitor',
} as const;

export type ServiceKey = typeof ServiceKeys[keyof typeof ServiceKeys];