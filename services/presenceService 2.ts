import { EventEmitter } from 'eventemitter3';
import { webSocketService, WebSocketMessage } from './webSocketService';
import { logError, logDebug, withErrorHandling } from '@/utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserPresence {
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  status: PresenceStatus;
  activity: UserActivity;
  location: UserLocation;
  lastSeen: string;
  isOnline: boolean;
  deviceInfo: DeviceInfo;
  preferences: PresencePreferences;
  socialStatus: SocialStatus;
  metadata?: Record<string, any>;
}

export type PresenceStatus = 'online' | 'away' | 'busy' | 'invisible' | 'streaming' | 'watching' | 'offline';

export interface UserActivity {
  type: ActivityType;
  description: string;
  startedAt: string;
  data?: any;
  isPublic: boolean;
  streamId?: string;
  roomId?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export type ActivityType = 
  | 'watching_stream'
  | 'in_chat'
  | 'in_room'
  | 'browsing'
  | 'idle'
  | 'gaming'
  | 'streaming'
  | 'listening_music'
  | 'reading'
  | 'working'
  | 'custom';

export interface UserLocation {
  roomId?: string;
  roomName?: string;
  streamId?: string;
  streamName?: string;
  page?: string;
  coordinates?: {
    x: number;
    y: number;
    screen: string;
  };
  timezone: string;
  country?: string;
  region?: string;
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop' | 'tv' | 'unknown';
  platform: string;
  os: string;
  browser?: string;
  version?: string;
  capabilities: DeviceCapabilities;
  network: NetworkInfo;
}

export interface DeviceCapabilities {
  video: boolean;
  audio: boolean;
  camera: boolean;
  microphone: boolean;
  notifications: boolean;
  fullscreen: boolean;
  pictureinpicture: boolean;
  geolocation: boolean;
}

export interface NetworkInfo {
  type: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  bandwidth: number;
  latency: number;
}

export interface PresencePreferences {
  showOnlineStatus: boolean;
  showActivity: boolean;
  showLocation: boolean;
  allowDirectMessages: boolean;
  autoAwayMinutes: number;
  notifyOnMention: boolean;
  notifyOnFollow: boolean;
  notifyOnStreamStart: boolean;
  shareWatchingStatus: boolean;
  shareListeningStatus: boolean;
  invisibleMode: boolean;
  customStatus?: string;
  statusEmoji?: string;
}

export interface SocialStatus {
  followers: number;
  following: number;
  friends: number;
  mutualFriends: string[];
  relationshipStatus?: 'none' | 'friend' | 'following' | 'follower' | 'mutual' | 'blocked';
  lastInteraction?: string;
  sharedInterests: string[];
}

export interface PresenceEvent {
  id: string;
  type: PresenceEventType;
  userId: string;
  username: string;
  data: any;
  timestamp: string;
  isPublic: boolean;
  priority: 'low' | 'medium' | 'high';
  expiresAt?: string;
}

export type PresenceEventType = 
  | 'user_online'
  | 'user_offline'
  | 'status_change'
  | 'activity_change'
  | 'location_change'
  | 'stream_start'
  | 'stream_end'
  | 'room_join'
  | 'room_leave'
  | 'friend_request'
  | 'follow'
  | 'unfollow'
  | 'achievement'
  | 'milestone'
  | 'custom_event';

export interface LiveNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  image?: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  actions?: NotificationAction[];
  data?: any;
  userId: string;
  fromUserId?: string;
  fromUsername?: string;
  createdAt: string;
  expiresAt?: string;
  isRead: boolean;
  isArchived: boolean;
  isSilent: boolean;
  tags: string[];
  metadata?: Record<string, any>;
}

export type NotificationType = 
  | 'friend_online'
  | 'stream_live'
  | 'stream_end'
  | 'chat_message'
  | 'mention'
  | 'reaction'
  | 'follow'
  | 'friend_request'
  | 'room_invite'
  | 'poll_created'
  | 'achievement'
  | 'milestone'
  | 'system_update'
  | 'promotional'
  | 'security_alert'
  | 'custom';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

export type NotificationCategory = 'social' | 'streaming' | 'system' | 'promotional' | 'security';

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  data?: any;
  style: 'default' | 'primary' | 'destructive';
}

export interface PresenceStatistics {
  totalUsers: number;
  onlineUsers: number;
  byStatus: Record<PresenceStatus, number>;
  byActivity: Record<ActivityType, number>;
  byLocation: Array<{ location: string; count: number }>;
  averageSessionLength: number;
  peakOnlineTime: string;
  retentionRate: number;
  engagementScore: number;
  socialInteractions: number;
}

export interface FriendsList {
  friends: UserPresence[];
  onlineFriends: UserPresence[];
  recentlyOnline: UserPresence[];
  mutualFriends: UserPresence[];
  suggestions: UserPresence[];
  blocked: string[];
  pendingRequests: FriendRequest[];
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
  respondedAt?: string;
  mutualFriends: string[];
  commonInterests: string[];
}

class PresenceService extends EventEmitter {
  private currentPresence: UserPresence | null = null;
  private onlineUsers: Map<string, UserPresence> = new Map();
  private friendsList: FriendsList | null = null;
  private notifications: Map<string, LiveNotification> = new Map();
  private presenceEvents: PresenceEvent[] = [];
  private presenceStats: PresenceStatistics | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private activityTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;
  private lastActivity: number = Date.now();
  private awayTimeout: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * Initialize presence service
   */
  async initialize(userId: string, username: string, displayName?: string): Promise<void> {
    return withErrorHandling(async () => {
      logDebug('Initializing presence service', { userId, username });
      
      const deviceInfo = await this.detectDeviceInfo();
      const preferences = await this.loadPreferences(userId);
      
      this.currentPresence = {
        userId,
        username,
        displayName: displayName || username,
        status: 'online',
        activity: {
          type: 'browsing',
          description: 'Browsing streams',
          startedAt: new Date().toISOString(),
          isPublic: true,
        },
        location: {
          page: 'home',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        lastSeen: new Date().toISOString(),
        isOnline: true,
        deviceInfo,
        preferences,
        socialStatus: {
          followers: 0,
          following: 0,
          friends: 0,
          mutualFriends: [],
          sharedInterests: [],
        },
      };

      // Announce presence
      await this.announcePresence();
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Start activity monitoring
      this.startActivityMonitoring();
      
      // Start cleanup timer
      this.startCleanupTimer();
      
      // Load friends list
      await this.loadFriendsList();
      
      // Load cached notifications
      await this.loadNotifications();
      
      this.isInitialized = true;
      this.emit('initialized', this.currentPresence);
    }, { component: 'PresenceService', action: 'initialize' });
  }

  /**
   * Update user status
   */
  async updateStatus(status: PresenceStatus, customMessage?: string): Promise<void> {
    if (!this.currentPresence) return;

    const oldStatus = this.currentPresence.status;
    this.currentPresence.status = status;
    this.currentPresence.lastSeen = new Date().toISOString();
    
    if (customMessage) {
      this.currentPresence.preferences.customStatus = customMessage;
    }

    await webSocketService.sendMessage('presence_update', {
      userId: this.currentPresence.userId,
      status,
      customMessage,
      timestamp: this.currentPresence.lastSeen,
    });

    this.emit('status_changed', { oldStatus, newStatus: status, customMessage });
  }

  /**
   * Update user activity
   */
  async updateActivity(
    type: ActivityType,
    description: string,
    data?: any,
    isPublic: boolean = true
  ): Promise<void> {
    if (!this.currentPresence) return;

    this.currentPresence.activity = {
      type,
      description,
      startedAt: new Date().toISOString(),
      data,
      isPublic,
      streamId: data?.streamId,
      roomId: data?.roomId,
      duration: 0,
      metadata: data?.metadata,
    };

    this.currentPresence.lastSeen = new Date().toISOString();
    this.lastActivity = Date.now();

    // Reset away timer
    this.resetAwayTimer();

    await webSocketService.sendMessage('activity_update', {
      userId: this.currentPresence.userId,
      activity: this.currentPresence.activity,
    });

    this.emit('activity_changed', this.currentPresence.activity);
  }

  /**
   * Update user location
   */
  async updateLocation(location: Partial<UserLocation>): Promise<void> {
    if (!this.currentPresence) return;

    this.currentPresence.location = {
      ...this.currentPresence.location,
      ...location,
    };

    this.currentPresence.lastSeen = new Date().toISOString();

    await webSocketService.sendMessage('location_update', {
      userId: this.currentPresence.userId,
      location: this.currentPresence.location,
    });

    this.emit('location_changed', this.currentPresence.location);
  }

  /**
   * Send friend request
   */
  async sendFriendRequest(userId: string, message?: string): Promise<void> {
    if (!this.currentPresence) return;

    const request: FriendRequest = {
      id: this.generateId(),
      fromUserId: this.currentPresence.userId,
      fromUsername: this.currentPresence.username,
      toUserId: userId,
      toUsername: '', // Will be filled by server
      message,
      status: 'pending',
      createdAt: new Date().toISOString(),
      mutualFriends: [],
      commonInterests: [],
    };

    await webSocketService.sendMessage('friend_request', request);
    
    this.emit('friend_request_sent', request);
  }

  /**
   * Respond to friend request
   */
  async respondToFriendRequest(requestId: string, accept: boolean): Promise<void> {
    const request = this.friendsList?.pendingRequests.find(r => r.id === requestId);
    if (!request) return;

    request.status = accept ? 'accepted' : 'rejected';
    request.respondedAt = new Date().toISOString();

    await webSocketService.sendMessage('friend_request_response', {
      requestId,
      accept,
      respondedAt: request.respondedAt,
    });

    if (accept) {
      // Add to friends list
      const newFriend = this.onlineUsers.get(request.fromUserId);
      if (newFriend && this.friendsList) {
        this.friendsList.friends.push(newFriend);
        if (newFriend.isOnline) {
          this.friendsList.onlineFriends.push(newFriend);
        }
      }
    }

    this.emit('friend_request_responded', { request, accepted: accept });
  }

  /**
   * Follow user
   */
  async followUser(userId: string): Promise<void> {
    if (!this.currentPresence) return;

    await webSocketService.sendMessage('follow_user', {
      fromUserId: this.currentPresence.userId,
      toUserId: userId,
      timestamp: new Date().toISOString(),
    });

    this.emit('user_followed', { userId });
  }

  /**
   * Create live notification
   */
  async createNotification(
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      priority?: NotificationPriority;
      category?: NotificationCategory;
      actions?: NotificationAction[];
      data?: any;
      fromUserId?: string;
      fromUsername?: string;
      expiresAt?: string;
      isSilent?: boolean;
      tags?: string[];
    }
  ): Promise<LiveNotification> {
    if (!this.currentPresence) {
      throw new Error('Presence not initialized');
    }

    const notification: LiveNotification = {
      id: this.generateId(),
      type,
      title,
      message,
      priority: options?.priority || 'medium',
      category: options?.category || 'social',
      actions: options?.actions || [],
      data: options?.data,
      userId: this.currentPresence.userId,
      fromUserId: options?.fromUserId,
      fromUsername: options?.fromUsername,
      createdAt: new Date().toISOString(),
      expiresAt: options?.expiresAt,
      isRead: false,
      isArchived: false,
      isSilent: options?.isSilent || false,
      tags: options?.tags || [],
      metadata: options?.data,
    };

    this.notifications.set(notification.id, notification);

    // Send to other users if applicable
    if (notification.fromUserId && notification.fromUserId !== this.currentPresence.userId) {
      await webSocketService.sendMessage('notification_create', notification);
    }

    this.emit('notification_created', notification);
    return notification;
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.isRead = true;
      this.notifications.set(notificationId, notification);
      
      await webSocketService.sendMessage('notification_read', {
        notificationId,
        userId: this.currentPresence?.userId,
      });
      
      this.emit('notification_read', notification);
    }
  }

  /**
   * Archive notification
   */
  async archiveNotification(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.isArchived = true;
      this.notifications.set(notificationId, notification);
      
      this.emit('notification_archived', notification);
    }
  }

  /**
   * Get online users
   */
  getOnlineUsers(): UserPresence[] {
    return Array.from(this.onlineUsers.values());
  }

  /**
   * Get friends list
   */
  getFriendsList(): FriendsList | null {
    return this.friendsList;
  }

  /**
   * Get notifications
   */
  getNotifications(filters?: {
    unreadOnly?: boolean;
    category?: NotificationCategory;
    priority?: NotificationPriority;
    limit?: number;
  }): LiveNotification[] {
    let notifications = Array.from(this.notifications.values());

    if (filters?.unreadOnly) {
      notifications = notifications.filter(n => !n.isRead && !n.isArchived);
    }

    if (filters?.category) {
      notifications = notifications.filter(n => n.category === filters.category);
    }

    if (filters?.priority) {
      notifications = notifications.filter(n => n.priority === filters.priority);
    }

    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filters?.limit) {
      notifications = notifications.slice(0, filters.limit);
    }

    return notifications;
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): number {
    return Array.from(this.notifications.values()).filter(n => !n.isRead && !n.isArchived).length;
  }

  /**
   * Get current presence
   */
  getCurrentPresence(): UserPresence | null {
    return this.currentPresence;
  }

  /**
   * Get presence statistics
   */
  getPresenceStatistics(): PresenceStatistics | null {
    return this.presenceStats;
  }

  /**
   * Search users
   */
  async searchUsers(query: string, filters?: {
    status?: PresenceStatus[];
    activity?: ActivityType[];
    location?: string;
    onlineOnly?: boolean;
    friendsOnly?: boolean;
    limit?: number;
  }): Promise<UserPresence[]> {
    await webSocketService.sendMessage('user_search', {
      query,
      filters,
      requesterId: this.currentPresence?.userId,
    });

    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve([]), 5000);
      
      const handleResults = (results: UserPresence[]) => {
        clearTimeout(timeout);
        this.off('user_search_results', handleResults);
        resolve(results);
      };
      
      this.once('user_search_results', handleResults);
    });
  }

  /**
   * Dispose service
   */
  dispose(): void {
    this.stopHeartbeat();
    this.stopActivityMonitoring();
    this.stopCleanupTimer();
    this.stopAwayTimer();
    
    if (this.currentPresence) {
      this.announceOffline();
    }
    
    this.onlineUsers.clear();
    this.notifications.clear();
    this.presenceEvents = [];
    this.friendsList = null;
    this.currentPresence = null;
    this.isInitialized = false;
    
    this.emit('disposed');
  }

  // Private methods

  private setupEventHandlers(): void {
    webSocketService.on('message:presence_update', this.handlePresenceUpdate.bind(this));
    webSocketService.on('message:user_online', this.handleUserOnline.bind(this));
    webSocketService.on('message:user_offline', this.handleUserOffline.bind(this));
    webSocketService.on('message:activity_update', this.handleActivityUpdate.bind(this));
    webSocketService.on('message:location_update', this.handleLocationUpdate.bind(this));
    webSocketService.on('message:friend_request', this.handleFriendRequest.bind(this));
    webSocketService.on('message:friend_request_response', this.handleFriendRequestResponse.bind(this));
    webSocketService.on('message:notification_create', this.handleNotificationCreate.bind(this));
    webSocketService.on('message:notification_read', this.handleNotificationRead.bind(this));
    webSocketService.on('message:presence_stats', this.handlePresenceStats.bind(this));
    webSocketService.on('message:user_search_results', this.handleUserSearchResults.bind(this));
    webSocketService.on('disconnected', this.handleDisconnected.bind(this));
  }

  private handlePresenceUpdate(wsMessage: WebSocketMessage): void {
    const { userId, status, customMessage } = wsMessage.data;
    const user = this.onlineUsers.get(userId);
    
    if (user) {
      user.status = status;
      user.lastSeen = new Date().toISOString();
      if (customMessage) {
        user.preferences.customStatus = customMessage;
      }
      
      this.onlineUsers.set(userId, user);
      this.emit('user_presence_updated', user);
    }
  }

  private handleUserOnline(wsMessage: WebSocketMessage): void {
    const user: UserPresence = wsMessage.data;
    this.onlineUsers.set(user.userId, user);
    
    // Add to online friends if applicable
    if (this.friendsList && this.friendsList.friends.some(f => f.userId === user.userId)) {
      this.friendsList.onlineFriends.push(user);
      
      // Create notification for friend coming online
      if (this.currentPresence?.preferences.notifyOnFollow) {
        this.createNotification(
          'friend_online',
          'Friend Online',
          `${user.displayName} is now online`,
          {
            fromUserId: user.userId,
            fromUsername: user.username,
            category: 'social',
            priority: 'low',
          }
        );
      }
    }
    
    this.emit('user_online', user);
  }

  private handleUserOffline(wsMessage: WebSocketMessage): void {
    const { userId, username } = wsMessage.data;
    const user = this.onlineUsers.get(userId);
    
    if (user) {
      user.isOnline = false;
      user.status = 'offline';
      user.lastSeen = new Date().toISOString();
      
      this.onlineUsers.delete(userId);
      
      // Remove from online friends
      if (this.friendsList) {
        this.friendsList.onlineFriends = this.friendsList.onlineFriends.filter(f => f.userId !== userId);
        
        // Add to recently online
        if (!this.friendsList.recentlyOnline.some(f => f.userId === userId)) {
          this.friendsList.recentlyOnline.unshift(user);
          this.friendsList.recentlyOnline = this.friendsList.recentlyOnline.slice(0, 10);
        }
      }
      
      this.emit('user_offline', { userId, username });
    }
  }

  private handleActivityUpdate(wsMessage: WebSocketMessage): void {
    const { userId, activity } = wsMessage.data;
    const user = this.onlineUsers.get(userId);
    
    if (user) {
      user.activity = activity;
      user.lastSeen = new Date().toISOString();
      this.onlineUsers.set(userId, user);
      this.emit('user_activity_updated', { userId, activity });
    }
  }

  private handleLocationUpdate(wsMessage: WebSocketMessage): void {
    const { userId, location } = wsMessage.data;
    const user = this.onlineUsers.get(userId);
    
    if (user) {
      user.location = { ...user.location, ...location };
      user.lastSeen = new Date().toISOString();
      this.onlineUsers.set(userId, user);
      this.emit('user_location_updated', { userId, location });
    }
  }

  private handleFriendRequest(wsMessage: WebSocketMessage): void {
    const request: FriendRequest = wsMessage.data;
    
    if (!this.friendsList) {
      this.friendsList = {
        friends: [],
        onlineFriends: [],
        recentlyOnline: [],
        mutualFriends: [],
        suggestions: [],
        blocked: [],
        pendingRequests: [],
      };
    }
    
    this.friendsList.pendingRequests.push(request);
    
    // Create notification
    this.createNotification(
      'friend_request',
      'Friend Request',
      `${request.fromUsername} sent you a friend request`,
      {
        fromUserId: request.fromUserId,
        fromUsername: request.fromUsername,
        category: 'social',
        priority: 'medium',
        data: { requestId: request.id },
        actions: [
          { id: 'accept', label: 'Accept', action: 'accept_friend', style: 'primary' },
          { id: 'reject', label: 'Reject', action: 'reject_friend', style: 'destructive' },
        ],
      }
    );
    
    this.emit('friend_request_received', request);
  }

  private handleFriendRequestResponse(wsMessage: WebSocketMessage): void {
    const { requestId, accept, respondedAt } = wsMessage.data;
    
    if (this.friendsList) {
      const request = this.friendsList.pendingRequests.find(r => r.id === requestId);
      if (request) {
        request.status = accept ? 'accepted' : 'rejected';
        request.respondedAt = respondedAt;
        
        if (accept) {
          // Notification for accepted request
          this.createNotification(
            'friend_request',
            'Friend Request Accepted',
            `${request.toUsername} accepted your friend request`,
            {
              fromUserId: request.toUserId,
              fromUsername: request.toUsername,
              category: 'social',
              priority: 'medium',
            }
          );
        }
        
        this.emit('friend_request_response_received', { request, accepted: accept });
      }
    }
  }

  private handleNotificationCreate(wsMessage: WebSocketMessage): void {
    const notification: LiveNotification = wsMessage.data;
    this.notifications.set(notification.id, notification);
    this.emit('notification_received', notification);
  }

  private handleNotificationRead(wsMessage: WebSocketMessage): void {
    const { notificationId } = wsMessage.data;
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.isRead = true;
      this.notifications.set(notificationId, notification);
      this.emit('notification_read', notification);
    }
  }

  private handlePresenceStats(wsMessage: WebSocketMessage): void {
    this.presenceStats = wsMessage.data;
    this.emit('presence_stats_updated', this.presenceStats);
  }

  private handleUserSearchResults(wsMessage: WebSocketMessage): void {
    const results: UserPresence[] = wsMessage.data;
    this.emit('user_search_results', results);
  }

  private handleDisconnected(): void {
    if (this.currentPresence) {
      this.currentPresence.isOnline = false;
      this.currentPresence.status = 'offline';
    }
    this.emit('disconnected');
  }

  private async announcePresence(): Promise<void> {
    if (!this.currentPresence) return;
    
    await webSocketService.sendMessage('user_online', this.currentPresence);
  }

  private async announceOffline(): Promise<void> {
    if (!this.currentPresence) return;
    
    await webSocketService.sendMessage('user_offline', {
      userId: this.currentPresence.userId,
      username: this.currentPresence.username,
      timestamp: new Date().toISOString(),
    });
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.currentPresence) {
        this.currentPresence.lastSeen = new Date().toISOString();
        webSocketService.sendMessage('presence_heartbeat', {
          userId: this.currentPresence.userId,
          timestamp: this.currentPresence.lastSeen,
        });
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private startActivityMonitoring(): void {
    this.activityTimer = setInterval(() => {
      this.checkActivityTimeout();
    }, 60000); // 1 minute
  }

  private stopActivityMonitoring(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
  }

  private checkActivityTimeout(): void {
    if (!this.currentPresence) return;
    
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;
    const awayThreshold = this.currentPresence.preferences.autoAwayMinutes * 60 * 1000;
    
    if (timeSinceLastActivity > awayThreshold && this.currentPresence.status === 'online') {
      this.updateStatus('away');
    }
  }

  private resetAwayTimer(): void {
    if (this.awayTimeout) {
      clearTimeout(this.awayTimeout);
    }
    
    if (this.currentPresence?.preferences.autoAwayMinutes > 0) {
      this.awayTimeout = setTimeout(() => {
        if (this.currentPresence?.status === 'online') {
          this.updateStatus('away');
        }
      }, this.currentPresence.preferences.autoAwayMinutes * 60 * 1000);
    }
  }

  private stopAwayTimer(): void {
    if (this.awayTimeout) {
      clearTimeout(this.awayTimeout);
      this.awayTimeout = null;
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredNotifications();
      this.cleanupOldPresenceEvents();
    }, 5 * 60 * 1000); // 5 minutes
  }

  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private cleanupExpiredNotifications(): void {
    const now = new Date();
    const expired: string[] = [];
    
    this.notifications.forEach((notification, id) => {
      if (notification.expiresAt && new Date(notification.expiresAt) < now) {
        expired.push(id);
      }
    });
    
    expired.forEach(id => this.notifications.delete(id));
    
    if (expired.length > 0) {
      this.emit('notifications_expired', expired);
    }
  }

  private cleanupOldPresenceEvents(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    this.presenceEvents = this.presenceEvents.filter(event => 
      new Date(event.timestamp) > oneHourAgo
    );
  }

  private async detectDeviceInfo(): Promise<DeviceInfo> {
    // This would integrate with actual device detection
    return {
      type: 'mobile',
      platform: 'react-native',
      os: 'iOS', // or 'Android'
      capabilities: {
        video: true,
        audio: true,
        camera: true,
        microphone: true,
        notifications: true,
        fullscreen: true,
        pictureinpicture: true,
        geolocation: true,
      },
      network: {
        type: 'wifi',
        quality: 'excellent',
        bandwidth: 100,
        latency: 20,
      },
    };
  }

  private async loadPreferences(userId: string): Promise<PresencePreferences> {
    try {
      const stored = await AsyncStorage.getItem(`presence_preferences_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      logError('Failed to load presence preferences', error);
    }
    
    return {
      showOnlineStatus: true,
      showActivity: true,
      showLocation: false,
      allowDirectMessages: true,
      autoAwayMinutes: 15,
      notifyOnMention: true,
      notifyOnFollow: true,
      notifyOnStreamStart: true,
      shareWatchingStatus: true,
      shareListeningStatus: true,
      invisibleMode: false,
    };
  }

  private async loadFriendsList(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(`friends_list_${this.currentPresence?.userId}`);
      if (stored) {
        this.friendsList = JSON.parse(stored);
      }
    } catch (error) {
      logError('Failed to load friends list', error);
    }
  }

  private async loadNotifications(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(`notifications_${this.currentPresence?.userId}`);
      if (stored) {
        const notifications: LiveNotification[] = JSON.parse(stored);
        notifications.forEach(notification => {
          this.notifications.set(notification.id, notification);
        });
      }
    } catch (error) {
      logError('Failed to load notifications', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const presenceService = new PresenceService();

// Helper functions
export const initializePresence = async (userId: string, username: string, displayName?: string) => {
  return presenceService.initialize(userId, username, displayName);
};

export const updateUserStatus = async (status: PresenceStatus, customMessage?: string) => {
  return presenceService.updateStatus(status, customMessage);
};

export const updateUserActivity = async (
  type: ActivityType,
  description: string,
  data?: any,
  isPublic?: boolean
) => {
  return presenceService.updateActivity(type, description, data, isPublic);
};

export const sendFriendRequest = async (userId: string, message?: string) => {
  return presenceService.sendFriendRequest(userId, message);
};

export const createLiveNotification = async (
  type: NotificationType,
  title: string,
  message: string,
  options?: any
) => {
  return presenceService.createNotification(type, title, message, options);
};