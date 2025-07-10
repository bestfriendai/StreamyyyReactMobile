// Device Synchronization Service for seamless cross-platform sync
import { crossPlatformStorage, platformDetection } from '@/utils/crossPlatformStorage';
import { crossPlatformAuthService } from './crossPlatformAuthService';
import { notificationService } from './notificationService';

export interface SyncableData {
  layouts: any[];
  settings: any;
  favorites: string[];
  preferences: any;
  watchHistory: any[];
  streamQuality: string;
  theme: string;
  notifications: any;
  customizations: any;
}

export interface SyncConflict {
  field: string;
  localValue: any;
  remoteValue: any;
  localTimestamp: string;
  remoteTimestamp: string;
  resolution?: 'local' | 'remote' | 'merge';
}

export interface SyncStatus {
  isEnabled: boolean;
  lastSyncTime: string | null;
  isSyncing: boolean;
  pendingChanges: string[];
  conflicts: SyncConflict[];
  syncStrategy: 'automatic' | 'manual' | 'conflict-prompt';
  networkStatus: 'online' | 'offline';
}

export interface DeviceSyncEvent {
  type: 'sync-started' | 'sync-completed' | 'sync-failed' | 'conflict-detected' | 'settings-changed';
  data?: any;
  error?: string;
  timestamp: string;
}

class DeviceSyncService {
  private syncStatus: SyncStatus = {
    isEnabled: false,
    lastSyncTime: null,
    isSyncing: false,
    pendingChanges: [],
    conflicts: [],
    syncStrategy: 'automatic',
    networkStatus: 'online',
  };

  private eventListeners: Map<string, Function[]> = new Map();
  private changeQueue: Map<string, { data: any; timestamp: string }> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;
  private conflictResolver: ((conflicts: SyncConflict[]) => Promise<SyncConflict[]>) | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    await this.loadSyncStatus();
    this.setupEventListeners();
    this.setupNetworkMonitoring();
    
    if (this.syncStatus.isEnabled) {
      this.startAutoSync();
    }
    
    console.log('Device Sync Service initialized');
  }

  private async loadSyncStatus() {
    try {
      const stored = await crossPlatformStorage.getItem('sync-status');
      if (stored) {
        this.syncStatus = { ...this.syncStatus, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  }

  private async saveSyncStatus() {
    try {
      await crossPlatformStorage.setItem('sync-status', JSON.stringify(this.syncStatus));
    } catch (error) {
      console.error('Error saving sync status:', error);
    }
  }

  private setupEventListeners() {
    // Listen for auth state changes
    if (typeof window !== 'undefined') {
      window.addEventListener('auth-sync-complete', (event: any) => {
        this.handleAuthSyncComplete(event.detail);
      });

      // Listen for storage changes from other tabs/windows
      window.addEventListener('storage', (event) => {
        this.handleStorageChange(event);
      });

      // Listen for app visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.syncStatus.isEnabled) {
          this.syncNow();
        }
      });
    }
  }

  private setupNetworkMonitoring() {
    if (typeof window !== 'undefined') {
      const updateNetworkStatus = () => {
        this.syncStatus.networkStatus = navigator.onLine ? 'online' : 'offline';
        
        if (navigator.onLine && this.syncStatus.pendingChanges.length > 0) {
          // Sync when back online
          this.syncNow();
        }
      };

      window.addEventListener('online', updateNetworkStatus);
      window.addEventListener('offline', updateNetworkStatus);
      
      // Initial status
      updateNetworkStatus();
    }
  }

  // Public API

  public async enableSync(strategy: 'automatic' | 'manual' | 'conflict-prompt' = 'automatic'): Promise<boolean> {
    if (!crossPlatformAuthService.isSignedIn()) {
      console.log('Cannot enable sync: user not signed in');
      return false;
    }

    this.syncStatus.isEnabled = true;
    this.syncStatus.syncStrategy = strategy;
    await this.saveSyncStatus();

    // Perform initial sync
    const success = await this.syncNow();
    
    if (success && strategy === 'automatic') {
      this.startAutoSync();
    }

    this.emitEvent('sync-settings-changed', { enabled: true, strategy });
    return success;
  }

  public async disableSync(): Promise<void> {
    this.syncStatus.isEnabled = false;
    await this.saveSyncStatus();
    
    this.stopAutoSync();
    this.clearPendingChanges();
    
    this.emitEvent('sync-settings-changed', { enabled: false });
  }

  public async syncNow(): Promise<boolean> {
    if (!this.syncStatus.isEnabled || !crossPlatformAuthService.isSignedIn()) {
      return false;
    }

    if (this.syncStatus.isSyncing) {
      console.log('Sync already in progress');
      return false;
    }

    this.syncStatus.isSyncing = true;
    this.emitEvent('sync-started');

    try {
      const localData = await this.gatherLocalData();
      const conflicts = await this.performSync(localData);

      if (conflicts.length > 0) {
        await this.handleConflicts(conflicts);
      }

      this.syncStatus.lastSyncTime = new Date().toISOString();
      this.clearPendingChanges();
      await this.saveSyncStatus();

      this.emitEvent('sync-completed', { 
        syncTime: this.syncStatus.lastSyncTime,
        conflicts: conflicts.length 
      });

      return true;

    } catch (error) {
      console.error('Sync failed:', error);
      this.emitEvent('sync-failed', { error: error.message });
      
      // Schedule retry
      this.scheduleRetry();
      return false;

    } finally {
      this.syncStatus.isSyncing = false;
    }
  }

  public async trackChange(key: string, data: any): Promise<void> {
    if (!this.syncStatus.isEnabled) {
      return;
    }

    const timestamp = new Date().toISOString();
    this.changeQueue.set(key, { data, timestamp });
    
    if (!this.syncStatus.pendingChanges.includes(key)) {
      this.syncStatus.pendingChanges.push(key);
    }

    await this.saveSyncStatus();

    // Auto-sync if strategy is automatic and not already syncing
    if (this.syncStatus.syncStrategy === 'automatic' && 
        !this.syncStatus.isSyncing && 
        this.syncStatus.networkStatus === 'online') {
      
      // Debounce rapid changes
      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
      }
      
      this.retryTimeout = setTimeout(() => {
        this.syncNow();
      }, 2000); // 2 second debounce
    }
  }

  public setConflictResolver(resolver: (conflicts: SyncConflict[]) => Promise<SyncConflict[]>): void {
    this.conflictResolver = resolver;
  }

  public getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  public getPendingChanges(): string[] {
    return [...this.syncStatus.pendingChanges];
  }

  public async forcePushLocal(): Promise<boolean> {
    if (!this.syncStatus.isEnabled || !crossPlatformAuthService.isSignedIn()) {
      return false;
    }

    try {
      const localData = await this.gatherLocalData();
      const success = await this.uploadToServer(localData, true); // force upload
      
      if (success) {
        this.syncStatus.lastSyncTime = new Date().toISOString();
        this.clearPendingChanges();
        await this.saveSyncStatus();
        
        this.emitEvent('sync-completed', { 
          syncTime: this.syncStatus.lastSyncTime,
          forced: true 
        });
      }
      
      return success;
    } catch (error) {
      console.error('Force push failed:', error);
      return false;
    }
  }

  public async forcePullRemote(): Promise<boolean> {
    if (!this.syncStatus.isEnabled || !crossPlatformAuthService.isSignedIn()) {
      return false;
    }

    try {
      const remoteData = await this.downloadFromServer();
      if (remoteData) {
        await this.applyRemoteData(remoteData, true); // force apply
        
        this.syncStatus.lastSyncTime = new Date().toISOString();
        this.clearPendingChanges();
        await this.saveSyncStatus();
        
        this.emitEvent('sync-completed', { 
          syncTime: this.syncStatus.lastSyncTime,
          forced: true 
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Force pull failed:', error);
      return false;
    }
  }

  // Event system
  public addEventListener(type: string, listener: Function): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(listener);
  }

  public removeEventListener(type: string, listener: Function): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Private methods

  private async gatherLocalData(): Promise<SyncableData> {
    try {
      const [store, layouts, favorites, preferences, history] = await Promise.all([
        crossPlatformStorage.getItem('streamyyy-cross-platform-storage'),
        crossPlatformStorage.getItem('saved-layouts'),
        crossPlatformStorage.getItem('favorites'),
        crossPlatformStorage.getItem('user-preferences'),
        crossPlatformStorage.getItem('watch-history'),
      ]);

      const storeData = store ? JSON.parse(store) : {};
      
      return {
        layouts: layouts ? JSON.parse(layouts) : [],
        settings: storeData.settings || {},
        favorites: favorites ? JSON.parse(favorites) : [],
        preferences: preferences ? JSON.parse(preferences) : {},
        watchHistory: history ? JSON.parse(history) : [],
        streamQuality: storeData.streamQuality || 'auto',
        theme: storeData.theme || 'dark',
        notifications: storeData.notifications || {},
        customizations: storeData.customizations || {},
      };
    } catch (error) {
      console.error('Error gathering local data:', error);
      return {
        layouts: [],
        settings: {},
        favorites: [],
        preferences: {},
        watchHistory: [],
        streamQuality: 'auto',
        theme: 'dark',
        notifications: {},
        customizations: {},
      };
    }
  }

  private async performSync(localData: SyncableData): Promise<SyncConflict[]> {
    // Upload local changes
    const uploadSuccess = await this.uploadToServer(localData);
    if (!uploadSuccess) {
      throw new Error('Failed to upload local changes');
    }

    // Download remote data
    const remoteData = await this.downloadFromServer();
    if (!remoteData) {
      throw new Error('Failed to download remote data');
    }

    // Detect conflicts
    const conflicts = this.detectConflicts(localData, remoteData);
    
    if (conflicts.length === 0) {
      // No conflicts, apply remote data
      await this.applyRemoteData(remoteData);
    }

    return conflicts;
  }

  private async uploadToServer(data: SyncableData, force: boolean = false): Promise<boolean> {
    const session = crossPlatformAuthService.getCurrentSession();
    if (!session) {
      return false;
    }

    try {
      const response = await fetch('/api/sync/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          data,
          deviceId: crossPlatformAuthService.getDeviceInfo().deviceId,
          platform: platformDetection.isWeb ? 'web' : 
                   platformDetection.isElectron ? 'desktop' : 'mobile',
          timestamp: new Date().toISOString(),
          force,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error uploading to server:', error);
      return false;
    }
  }

  private async downloadFromServer(): Promise<SyncableData | null> {
    const session = crossPlatformAuthService.getCurrentSession();
    if (!session) {
      return null;
    }

    try {
      const response = await fetch('/api/sync/download', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
    } catch (error) {
      console.error('Error downloading from server:', error);
    }

    return null;
  }

  private detectConflicts(local: SyncableData, remote: SyncableData): SyncConflict[] {
    const conflicts: SyncConflict[] = [];
    const now = new Date().toISOString();

    // Compare each field
    const fields: (keyof SyncableData)[] = [
      'layouts', 'settings', 'favorites', 'preferences', 
      'streamQuality', 'theme', 'notifications', 'customizations'
    ];

    fields.forEach(field => {
      if (this.hasConflict(local[field], remote[field])) {
        conflicts.push({
          field,
          localValue: local[field],
          remoteValue: remote[field],
          localTimestamp: now, // In a real app, you'd track actual timestamps
          remoteTimestamp: now,
        });
      }
    });

    return conflicts;
  }

  private hasConflict(localValue: any, remoteValue: any): boolean {
    // Simple conflict detection - in reality you'd compare timestamps
    return JSON.stringify(localValue) !== JSON.stringify(remoteValue);
  }

  private async handleConflicts(conflicts: SyncConflict[]): Promise<void> {
    this.syncStatus.conflicts = conflicts;
    this.emitEvent('conflict-detected', { conflicts });

    let resolvedConflicts: SyncConflict[] = [];

    if (this.syncStatus.syncStrategy === 'conflict-prompt' && this.conflictResolver) {
      // Use custom conflict resolver
      resolvedConflicts = await this.conflictResolver(conflicts);
    } else {
      // Auto-resolve based on strategy
      resolvedConflicts = this.autoResolveConflicts(conflicts);
    }

    // Apply resolved conflicts
    await this.applyResolvedConflicts(resolvedConflicts);
    this.syncStatus.conflicts = [];
  }

  private autoResolveConflicts(conflicts: SyncConflict[]): SyncConflict[] {
    return conflicts.map(conflict => ({
      ...conflict,
      resolution: this.syncStatus.syncStrategy === 'automatic' ? 'remote' : 'local',
    }));
  }

  private async applyResolvedConflicts(conflicts: SyncConflict[]): Promise<void> {
    for (const conflict of conflicts) {
      if (conflict.resolution === 'remote') {
        await this.applyFieldValue(conflict.field, conflict.remoteValue);
      } else if (conflict.resolution === 'local') {
        await this.applyFieldValue(conflict.field, conflict.localValue);
      } else if (conflict.resolution === 'merge') {
        const mergedValue = this.mergeValues(conflict.localValue, conflict.remoteValue);
        await this.applyFieldValue(conflict.field, mergedValue);
      }
    }
  }

  private async applyRemoteData(data: SyncableData, force: boolean = false): Promise<void> {
    try {
      // Apply data to storage
      const storeData = {
        settings: data.settings,
        streamQuality: data.streamQuality,
        theme: data.theme,
        notifications: data.notifications,
        customizations: data.customizations,
      };

      await Promise.all([
        crossPlatformStorage.setItem('streamyyy-cross-platform-storage', JSON.stringify(storeData)),
        crossPlatformStorage.setItem('saved-layouts', JSON.stringify(data.layouts)),
        crossPlatformStorage.setItem('favorites', JSON.stringify(data.favorites)),
        crossPlatformStorage.setItem('user-preferences', JSON.stringify(data.preferences)),
        crossPlatformStorage.setItem('watch-history', JSON.stringify(data.watchHistory)),
      ]);

      // Notify UI components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sync-data-updated', {
          detail: { data, forced: force }
        }));
      }

    } catch (error) {
      console.error('Error applying remote data:', error);
      throw error;
    }
  }

  private async applyFieldValue(field: string, value: any): Promise<void> {
    // Apply specific field value to storage
    switch (field) {
      case 'layouts':
        await crossPlatformStorage.setItem('saved-layouts', JSON.stringify(value));
        break;
      case 'favorites':
        await crossPlatformStorage.setItem('favorites', JSON.stringify(value));
        break;
      case 'preferences':
        await crossPlatformStorage.setItem('user-preferences', JSON.stringify(value));
        break;
      default:
        // For other fields, update the main store
        const store = await crossPlatformStorage.getItem('streamyyy-cross-platform-storage');
        const storeData = store ? JSON.parse(store) : {};
        storeData[field] = value;
        await crossPlatformStorage.setItem('streamyyy-cross-platform-storage', JSON.stringify(storeData));
    }
  }

  private mergeValues(local: any, remote: any): any {
    // Simple merge strategy - in reality you'd have more sophisticated merging
    if (Array.isArray(local) && Array.isArray(remote)) {
      // Merge arrays by combining unique items
      const combined = [...local, ...remote];
      return combined.filter((item, index, array) => 
        array.findIndex(i => JSON.stringify(i) === JSON.stringify(item)) === index
      );
    } else if (typeof local === 'object' && typeof remote === 'object') {
      // Merge objects
      return { ...local, ...remote };
    } else {
      // For primitives, prefer remote
      return remote;
    }
  }

  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Sync every 10 minutes
    this.syncInterval = setInterval(() => {
      if (this.syncStatus.isEnabled && 
          this.syncStatus.networkStatus === 'online' && 
          !this.syncStatus.isSyncing) {
        this.syncNow();
      }
    }, 10 * 60 * 1000);
  }

  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  private scheduleRetry(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    // Exponential backoff
    const retryDelay = Math.min(30000, 5000 * Math.pow(2, this.syncStatus.pendingChanges.length));
    
    this.retryTimeout = setTimeout(() => {
      if (this.syncStatus.isEnabled && this.syncStatus.networkStatus === 'online') {
        this.syncNow();
      }
    }, retryDelay);
  }

  private clearPendingChanges(): void {
    this.syncStatus.pendingChanges = [];
    this.changeQueue.clear();
  }

  private emitEvent(type: string, data?: any): void {
    const event: DeviceSyncEvent = {
      type: type as any,
      data,
      timestamp: new Date().toISOString(),
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in sync event listener:', error);
        }
      });
    }

    // Also emit as window event for components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`device-sync-${type}`, {
        detail: event
      }));
    }
  }

  private handleAuthSyncComplete(detail: any): void {
    // Auth service completed sync, check if we need to sync our data
    if (this.syncStatus.isEnabled) {
      setTimeout(() => this.syncNow(), 1000);
    }
  }

  private handleStorageChange(event: StorageEvent): void {
    // Another tab/window updated storage
    if (event.key && event.key.startsWith('streamyyy-') && this.syncStatus.isEnabled) {
      this.trackChange(event.key, event.newValue);
    }
  }

  // Cleanup
  public cleanup(): void {
    this.stopAutoSync();
    this.eventListeners.clear();
  }
}

export const deviceSyncService = new DeviceSyncService();
export default deviceSyncService;