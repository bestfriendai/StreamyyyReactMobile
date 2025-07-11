import AsyncStorage from '@react-native-async-storage/async-storage';

export type StorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  getAllKeys: () => Promise<string[]>;
  multiGet: (keys: string[]) => Promise<[string, string | null][]>;
  multiSet: (keyValuePairs: [string, string][]) => Promise<void>;
  multiRemove: (keys: string[]) => Promise<void>;
  clear: () => Promise<void>;
};

/**
 * Cross-platform storage adapter that works across mobile, web, and desktop
 * Automatically detects the platform and uses the appropriate storage mechanism
 */
class CrossPlatformStorageAdapter implements StorageAdapter {
  private isWeb: boolean;
  private isElectron: boolean;
  private electronStore: any;

  constructor() {
    this.isWeb = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    this.isElectron = typeof window !== 'undefined' && 
      (window as any).electron !== undefined;
    
    // Initialize Electron store if available
    if (this.isElectron) {
      try {
        this.electronStore = (window as any).electron.store;
      } catch (error) {
        console.warn('Electron store not available, falling back to localStorage');
        this.isElectron = false;
      }
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isElectron && this.electronStore) {
        return this.electronStore.get(key) || null;
      } else if (this.isWeb) {
        return localStorage.getItem(key);
      } else {
        return AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isElectron && this.electronStore) {
        this.electronStore.set(key, value);
      } else if (this.isWeb) {
        localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error setting item in storage:', error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (this.isElectron && this.electronStore) {
        this.electronStore.delete(key);
      } else if (this.isWeb) {
        localStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error removing item from storage:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      if (this.isElectron && this.electronStore) {
        return Object.keys(this.electronStore.store);
      } else if (this.isWeb) {
        return Object.keys(localStorage);
      } else {
        const keys = await AsyncStorage.getAllKeys();
        return [...keys];
      }
    } catch (error) {
      console.error('Error getting all keys from storage:', error);
      return [];
    }
  }

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    try {
      if (this.isElectron && this.electronStore) {
        return keys.map(key => [key, this.electronStore.get(key) || null]);
      } else if (this.isWeb) {
        return keys.map(key => [key, localStorage.getItem(key)]);
      } else {
        const result = await AsyncStorage.multiGet(keys);
        return [...result];
      }
    } catch (error) {
      console.error('Error getting multiple items from storage:', error);
      return keys.map(key => [key, null]);
    }
  }

  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    try {
      if (this.isElectron && this.electronStore) {
        keyValuePairs.forEach(([key, value]) => {
          this.electronStore.set(key, value);
        });
      } else if (this.isWeb) {
        keyValuePairs.forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
      } else {
        await AsyncStorage.multiSet(keyValuePairs);
      }
    } catch (error) {
      console.error('Error setting multiple items in storage:', error);
      throw error;
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    try {
      if (this.isElectron && this.electronStore) {
        keys.forEach(key => {
          this.electronStore.delete(key);
        });
      } else if (this.isWeb) {
        keys.forEach(key => {
          localStorage.removeItem(key);
        });
      } else {
        await AsyncStorage.multiRemove(keys);
      }
    } catch (error) {
      console.error('Error removing multiple items from storage:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      if (this.isElectron && this.electronStore) {
        this.electronStore.clear();
      } else if (this.isWeb) {
        localStorage.clear();
      } else {
        await AsyncStorage.clear();
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  // Additional utility methods for cross-platform compatibility
  getPlatformInfo(): { platform: string; isWeb: boolean; isElectron: boolean; isMobile: boolean } {
    return {
      platform: this.isElectron ? 'electron' : (this.isWeb ? 'web' : 'mobile'),
      isWeb: this.isWeb,
      isElectron: this.isElectron,
      isMobile: !this.isWeb && !this.isElectron,
    };
  }

  async getStorageSize(): Promise<number> {
    try {
      if (this.isWeb) {
        let total = 0;
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length + key.length;
          }
        }
        return total;
      } else if (this.isElectron && this.electronStore) {
        return JSON.stringify(this.electronStore.store).length;
      } else {
        // For mobile, estimate based on key count
        const keys = await this.getAllKeys();
        const values = await this.multiGet(keys);
        return values.reduce((total, [key, value]) => {
          return total + key.length + (value ? value.length : 0);
        }, 0);
      }
    } catch (error) {
      console.error('Error getting storage size:', error);
      return 0;
    }
  }
}

// Create singleton instance
export const crossPlatformStorage = new CrossPlatformStorageAdapter();

// Export for use in Zustand store
export const createCrossPlatformStorage = () => ({
  getItem: (key: string) => crossPlatformStorage.getItem(key),
  setItem: (key: string, value: string) => crossPlatformStorage.setItem(key, value),
  removeItem: (key: string) => crossPlatformStorage.removeItem(key),
});

// Type guard for platform detection
export const platformDetection = {
  isWeb: typeof window !== 'undefined' && typeof window.localStorage !== 'undefined',
  isElectron: typeof window !== 'undefined' && (window as any).electron !== undefined,
  isMobile: typeof window === 'undefined' || (typeof window !== 'undefined' && !window.localStorage),
  isDesktop: typeof window !== 'undefined' && (window as any).electron !== undefined,
  isBrowser: typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && !(window as any).electron,
};

// Platform-specific optimizations
export const platformOptimizations = {
  // Web-specific optimizations
  web: {
    enableServiceWorker: true,
    enableIndexedDB: true,
    enableWebWorkers: true,
    enableWebGL: true,
  },
  
  // Desktop-specific optimizations
  desktop: {
    enableFileSystem: true,
    enableNotifications: true,
    enableShortcuts: true,
    enableSystemTray: true,
  },
  
  // Mobile-specific optimizations
  mobile: {
    enableHaptics: true,
    enableBiometrics: true,
    enableBackground: true,
    enablePushNotifications: true,
  },
};

export default crossPlatformStorage;