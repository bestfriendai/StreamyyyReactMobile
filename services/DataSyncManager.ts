import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { useGlobalStore } from './SimpleStateManager';
import { databaseService } from './databaseService';
import { webSocketService } from './webSocketService';
import { logDebug, logError } from '@/utils/errorHandler';
import { TwitchStream } from '@/services/twitchApi';

export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'stream' | 'layout' | 'user' | 'favorite';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface ConflictResolution {
  strategy: 'client' | 'server' | 'merge' | 'prompt';
  resolver?: (clientData: any, serverData: any) => any;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number;
  pendingItems: number;
  conflictCount: number;
  errorCount: number;
}

class DataSyncManager {
  private syncQueue: SyncQueueItem[] = [];
  private isOnline = true;
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;
  
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  private readonly RETRY_DELAY = 5000; // 5 seconds
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly STORAGE_KEY = 'sync_queue';

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Load pending sync items from storage
      await this.loadSyncQueue();
      
      // Set up network monitoring
      this.setupNetworkMonitoring();
      
      // Set up app state monitoring
      this.setupAppStateMonitoring();
      
      // Set up WebSocket for real-time sync
      this.setupWebSocketSync();
      
      // Start periodic sync
      this.startPeriodicSync();
      
      logDebug('DataSyncManager initialized');
    } catch (error) {
      logError('Failed to initialize DataSyncManager', error);
    }
  }

  /**
   * Add item to sync queue
   */
  async queueSync(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const syncItem: SyncQueueItem = {
        ...item,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
      };

      this.syncQueue.push(syncItem);
      
      // Keep queue size manageable
      if (this.syncQueue.length > this.MAX_QUEUE_SIZE) {
        this.syncQueue = this.syncQueue.slice(-this.MAX_QUEUE_SIZE);
        logDebug('Sync queue trimmed to maximum size');
      }

      await this.saveSyncQueue();
      
      // Try immediate sync if online
      if (this.isOnline && !this.isSyncing) {
        this.processSyncQueue();
      }

      logDebug('Item queued for sync', { type: item.type, entity: item.entity });
    } catch (error) {
      logError('Failed to queue sync item', error);
    }
  }

  /**
   * Process the sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    const store = useGlobalStore.getState();
    
    try {
      logDebug('Processing sync queue', { itemCount: this.syncQueue.length });

      const itemsToProcess = [...this.syncQueue];
      const processedItems: string[] = [];
      const failedItems: SyncQueueItem[] = [];

      for (const item of itemsToProcess) {
        try {
          await this.processSyncItem(item);
          processedItems.push(item.id);
          logDebug('Sync item processed successfully', { id: item.id, type: item.type });
        } catch (error) {
          item.retryCount++;
          
          if (item.retryCount < item.maxRetries) {
            failedItems.push(item);
            logDebug('Sync item failed, will retry', { 
              id: item.id, 
              retryCount: item.retryCount,
              maxRetries: item.maxRetries 
            });
          } else {
            logError('Sync item failed permanently', error, { id: item.id });
          }
        }
      }

      // Remove processed items from queue
      this.syncQueue = this.syncQueue.filter(item => !processedItems.includes(item.id));
      
      // Re-add failed items that can be retried
      this.syncQueue.push(...failedItems);

      await this.saveSyncQueue();
      this.updateSyncStatus();

    } catch (error) {
      logError('Failed to process sync queue', error);
    } finally {
      this.isSyncing = false;
      
      // Schedule retry if there are failed items
      if (this.syncQueue.some(item => item.retryCount > 0)) {
        this.scheduleRetry();
      }
    }
  }

  /**
   * Process individual sync item
   */
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    const store = useGlobalStore.getState();
    
    switch (item.entity) {
      case 'favorite':
        await this.syncFavorite(item);
        break;
      case 'layout':
        await this.syncLayout(item);
        break;
      case 'user':
        await this.syncUser(item);
        break;
      case 'stream':
        await this.syncStream(item);
        break;
      default:
        throw new Error(`Unknown sync entity: ${item.entity}`);
    }
  }

  /**
   * Sync favorite streams
   */
  private async syncFavorite(item: SyncQueueItem): Promise<void> {
    const store = useGlobalStore.getState();
    const userId = store.user.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    switch (item.type) {
      case 'create':
        await databaseService.addFavoriteStream(userId, item.data);
        break;
      case 'delete':
        await databaseService.removeFavoriteStream(userId, item.data.userId);
        break;
      case 'update':
        // Favorites don't typically get updated, but handle if needed
        break;
    }
  }

  /**
   * Sync layouts
   */
  private async syncLayout(item: SyncQueueItem): Promise<void> {
    const store = useGlobalStore.getState();
    const userId = store.user.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    switch (item.type) {
      case 'create':
        await databaseService.saveUserLayout(userId, item.data);
        break;
      case 'update':
        await databaseService.updateUserLayout(userId, item.data.id, item.data);
        break;
      case 'delete':
        await databaseService.deleteUserLayout(userId, item.data.id);
        break;
    }
  }

  /**
   * Sync user data
   */
  private async syncUser(item: SyncQueueItem): Promise<void> {
    const store = useGlobalStore.getState();
    const userId = store.user.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    switch (item.type) {
      case 'update':
        await databaseService.updateUserProfile(userId, item.data);
        break;
    }
  }

  /**
   * Sync stream data (for analytics/usage tracking)
   */
  private async syncStream(item: SyncQueueItem): Promise<void> {
    const store = useGlobalStore.getState();
    const userId = store.user.id;
    
    if (!userId) {
      return; // Stream usage can be tracked anonymously
    }

    switch (item.type) {
      case 'create':
        // Track stream view
        await databaseService.trackStreamView(userId, item.data);
        break;
    }
  }

  /**
   * Sync from server to client
   */
  async syncFromServer(): Promise<void> {
    const store = useGlobalStore.getState();
    const userId = store.user.id;
    
    if (!userId || !this.isOnline) {
      return;
    }

    try {
      logDebug('Syncing from server');

      // Get server state
      const [serverFavorites, serverLayouts, serverProfile] = await Promise.all([
        databaseService.getFavoriteStreams(userId),
        databaseService.getUserLayouts(userId),
        databaseService.getUserProfile(userId),
      ]);

      // Resolve conflicts and update local state
      await this.resolveAndUpdateFavorites(serverFavorites);
      await this.resolveAndUpdateLayouts(serverLayouts);
      await this.resolveAndUpdateProfile(serverProfile);

      this.updateSyncStatus();
      logDebug('Server sync completed');

    } catch (error) {
      logError('Failed to sync from server', error);
      throw error;
    }
  }

  /**
   * Resolve conflicts for favorites
   */
  private async resolveAndUpdateFavorites(serverFavorites: TwitchStream[]): Promise<void> {
    const store = useGlobalStore.getState();
    const clientFavorites = store.streams.favorites;

    // Simple merge strategy: union of client and server favorites
    const mergedFavorites = [...clientFavorites];
    
    for (const serverFav of serverFavorites) {
      if (!mergedFavorites.find(f => f.user_id === serverFav.user_id)) {
        mergedFavorites.push(serverFav);
      }
    }

    // Update store if there are differences
    if (mergedFavorites.length !== clientFavorites.length) {
      store.actions.setUser({ 
        ...store.user,
        // This would be handled by a dedicated favorites action
      });
      
      // Queue sync for any new client favorites not on server
      for (const clientFav of clientFavorites) {
        if (!serverFavorites.find(f => f.user_id === clientFav.user_id)) {
          await this.queueSync({
            type: 'create',
            entity: 'favorite',
            data: clientFav,
            maxRetries: 3,
          });
        }
      }
    }
  }

  /**
   * Resolve conflicts for layouts
   */
  private async resolveAndUpdateLayouts(serverLayouts: any[]): Promise<void> {
    const store = useGlobalStore.getState();
    const clientLayouts = store.layouts.saved;

    // Merge layouts based on timestamp (newer wins)
    const mergedLayouts = [...clientLayouts];
    
    for (const serverLayout of serverLayouts) {
      const clientLayout = mergedLayouts.find(l => l.id === serverLayout.id);
      
      if (!clientLayout) {
        // New layout from server
        mergedLayouts.push(serverLayout);
      } else {
        // Check for conflicts
        const serverTime = new Date(serverLayout.updatedAt || serverLayout.createdAt).getTime();
        const clientTime = new Date(clientLayout.createdAt).getTime();
        
        if (serverTime > clientTime) {
          // Server is newer, replace client version
          const index = mergedLayouts.findIndex(l => l.id === serverLayout.id);
          mergedLayouts[index] = serverLayout;
        }
      }
    }

    // Update store if there are differences
    if (JSON.stringify(mergedLayouts) !== JSON.stringify(clientLayouts)) {
      // This would need to be implemented in the store
      // store.actions.setLayouts(mergedLayouts);
    }
  }

  /**
   * Resolve conflicts for user profile
   */
  private async resolveAndUpdateProfile(serverProfile: any): Promise<void> {
    const store = useGlobalStore.getState();
    
    if (serverProfile) {
      // Server profile takes precedence for most fields
      store.actions.setUser({
        ...store.user,
        ...serverProfile,
        // Keep local preferences unless server has newer ones
        preferences: {
          ...store.user.preferences,
          ...serverProfile.preferences,
        },
      });
    }
  }

  /**
   * Handle real-time updates via WebSocket
   */
  private setupWebSocketSync(): void {
    webSocketService.onMessage('sync', (data) => {
      this.handleRealtimeSync(data);
    });

    webSocketService.onMessage('conflict', (data) => {
      this.handleSyncConflict(data);
    });
  }

  /**
   * Handle real-time sync updates
   */
  private async handleRealtimeSync(data: any): Promise<void> {
    try {
      logDebug('Received real-time sync update', { type: data.type, entity: data.entity });

      const store = useGlobalStore.getState();
      
      switch (data.entity) {
        case 'favorite':
          if (data.type === 'create') {
            // Another device added a favorite
            if (!store.streams.favorites.find(f => f.user_id === data.data.user_id)) {
              store.actions.toggleFavorite(data.data);
            }
          } else if (data.type === 'delete') {
            // Another device removed a favorite
            const existing = store.streams.favorites.find(f => f.user_id === data.data.user_id);
            if (existing) {
              store.actions.toggleFavorite(existing);
            }
          }
          break;

        case 'layout':
          // Handle layout sync
          this.syncFromServer(); // Full sync for now
          break;
      }
    } catch (error) {
      logError('Failed to handle real-time sync', error);
    }
  }

  /**
   * Handle sync conflicts
   */
  private async handleSyncConflict(data: any): Promise<void> {
    logDebug('Sync conflict detected', data);
    
    // For now, use server wins strategy
    // In a full implementation, this could show a UI to let user choose
    await this.syncFromServer();
  }

  /**
   * Network monitoring
   */
  private setupNetworkMonitoring(): void {
    // This would use @react-native-community/netinfo in a real implementation
    // For now, assume we're online
    this.isOnline = true;
  }

  /**
   * App state monitoring
   */
  private setupAppStateMonitoring(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App became active, trigger sync
        this.syncFromServer().catch(error => {
          logError('Failed to sync on app activation', error);
        });
      }
    });
  }

  /**
   * Periodic sync
   */
  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.processSyncQueue();
      }
    }, this.SYNC_INTERVAL);
  }

  /**
   * Schedule retry for failed items
   */
  private scheduleRetry(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.retryTimeout = setTimeout(() => {
      if (this.isOnline && !this.isSyncing) {
        this.processSyncQueue();
      }
    }, this.RETRY_DELAY);
  }

  /**
   * Save sync queue to storage
   */
  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      logError('Failed to save sync queue', error);
    }
  }

  /**
   * Load sync queue from storage
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.syncQueue = JSON.parse(stored);
        logDebug('Sync queue loaded', { itemCount: this.syncQueue.length });
      }
    } catch (error) {
      logError('Failed to load sync queue', error);
    }
  }

  /**
   * Update sync status
   */
  private updateSyncStatus(): void {
    const store = useGlobalStore.getState();
    
    // This would update a sync status in the store
    // store.actions.updateSyncStatus({
    //   isOnline: this.isOnline,
    //   isSyncing: this.isSyncing,
    //   lastSyncTime: Date.now(),
    //   pendingItems: this.syncQueue.length,
    //   conflictCount: 0,
    //   errorCount: this.syncQueue.filter(item => item.retryCount > 0).length,
    // });
  }

  /**
   * Public methods
   */
  getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: Date.now(), // This should be tracked
      pendingItems: this.syncQueue.length,
      conflictCount: 0,
      errorCount: this.syncQueue.filter(item => item.retryCount > 0).length,
    };
  }

  async forcSync(): Promise<void> {
    if (!this.isSyncing) {
      await this.processSyncQueue();
      await this.syncFromServer();
    }
  }

  clearQueue(): void {
    this.syncQueue = [];
    this.saveSyncQueue();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }
}

// Export singleton instance
export const dataSyncManager = new DataSyncManager();
export default dataSyncManager;