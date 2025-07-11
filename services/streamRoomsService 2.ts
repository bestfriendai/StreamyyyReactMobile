import { EventEmitter } from 'eventemitter3';
import { webSocketService, WebSocketMessage } from './webSocketService';
import { logError, logDebug, withErrorHandling } from '@/utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StreamRoom {
  id: string;
  name: string;
  description?: string;
  type: RoomType;
  visibility: RoomVisibility;
  streamId?: string;
  hostId: string;
  hostUsername: string;
  members: RoomMember[];
  settings: RoomSettings;
  createdAt: string;
  updatedAt: string;
  maxMembers: number;
  currentMemberCount: number;
  isActive: boolean;
  tags: string[];
  category: string;
  thumbnail?: string;
  password?: string;
  expiresAt?: string;
  statistics: RoomStatistics;
  features: RoomFeatures;
}

export type RoomType = 'watch_party' | 'community' | 'gaming' | 'discussion' | 'study' | 'music' | 'art' | 'tech' | 'sports' | 'custom';

export type RoomVisibility = 'public' | 'private' | 'invite_only' | 'password_protected';

export interface RoomMember {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: MemberRole;
  permissions: Permission[];
  joinedAt: string;
  lastActiveAt: string;
  isOnline: boolean;
  isMuted: boolean;
  isBanned: boolean;
  banExpiresAt?: string;
  statistics: MemberStatistics;
  status: MemberStatus;
  customData?: Record<string, any>;
}

export type MemberRole = 'host' | 'co_host' | 'moderator' | 'vip' | 'member' | 'guest';

export type Permission = 
  | 'manage_room'
  | 'invite_users'
  | 'kick_users'
  | 'ban_users'
  | 'mute_users'
  | 'change_stream'
  | 'control_playback'
  | 'moderate_chat'
  | 'create_polls'
  | 'manage_queue'
  | 'share_screen'
  | 'use_voice_chat'
  | 'create_annotations'
  | 'manage_reactions';

export interface MemberStatistics {
  totalTimeInRoom: number;
  messagesPosted: number;
  reactionsGiven: number;
  pollsCreated: number;
  pollsParticipated: number;
  streamsWatched: number;
  averageViewTime: number;
  reputation: number;
  level: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export type MemberStatus = 'watching' | 'away' | 'busy' | 'presenting' | 'disconnected';

export interface RoomSettings {
  allowGuestJoin: boolean;
  requireApproval: boolean;
  allowVoiceChat: boolean;
  allowScreenShare: boolean;
  allowFileSharing: boolean;
  maxStreamQuality: string;
  autoModeration: boolean;
  slowModeEnabled: boolean;
  slowModeDelay: number;
  allowReactions: boolean;
  allowPolls: boolean;
  allowAnnotations: boolean;
  kickInactiveMembers: boolean;
  inactiveTimeoutMinutes: number;
  saveWatchHistory: boolean;
  recordSession: boolean;
  allowCustomEmotes: boolean;
  customEmoteSlots: number;
  theme: string;
  backgroundMusic: boolean;
  soundEffects: boolean;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  memberJoin: boolean;
  memberLeave: boolean;
  streamChange: boolean;
  pollCreated: boolean;
  hostMessage: boolean;
  mentionAlert: boolean;
  reactionAlert: boolean;
  voiceChatAlert: boolean;
}

export interface RoomStatistics {
  totalMembers: number;
  peakMembers: number;
  totalWatchTime: number;
  averageWatchTime: number;
  totalMessages: number;
  totalReactions: number;
  totalPolls: number;
  totalStreamsWatched: number;
  memberRetentionRate: number;
  activityScore: number;
  popularStreams: Array<{ streamId: string; streamName: string; watchTime: number }>;
  peakActivityTime: string;
  engagementMetrics: EngagementMetrics;
}

export interface EngagementMetrics {
  messagesPerMember: number;
  reactionsPerMember: number;
  pollParticipationRate: number;
  averageSessionLength: number;
  returnVisitorRate: number;
  shareRate: number;
  recommendationScore: number;
}

export interface RoomFeatures {
  chatEnabled: boolean;
  voiceChatEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
  fileUploadEnabled: boolean;
  pollsEnabled: boolean;
  gamesEnabled: boolean;
  musicEnabled: boolean;
  annotationsEnabled: boolean;
  reactionsEnabled: boolean;
  whiteboardEnabled: boolean;
  breakoutRoomsEnabled: boolean;
  recordingEnabled: boolean;
  streamingEnabled: boolean;
  customFeaturesEnabled: boolean;
}

export interface RoomInvitation {
  id: string;
  roomId: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  message?: string;
  expiresAt: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  permissions?: Permission[];
  role?: MemberRole;
}

export interface RoomActivity {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  type: ActivityType;
  description: string;
  data?: any;
  timestamp: string;
  isVisible: boolean;
  priority: 'low' | 'medium' | 'high';
}

export type ActivityType = 
  | 'member_join'
  | 'member_leave'
  | 'stream_change'
  | 'poll_create'
  | 'poll_end'
  | 'message_delete'
  | 'member_promote'
  | 'member_demote'
  | 'member_kick'
  | 'member_ban'
  | 'room_update'
  | 'feature_toggle'
  | 'custom_event';

export interface WatchQueue {
  id: string;
  roomId: string;
  items: QueueItem[];
  currentIndex: number;
  isPlaying: boolean;
  repeat: 'none' | 'one' | 'all';
  shuffle: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueueItem {
  id: string;
  streamId: string;
  streamName: string;
  streamUrl: string;
  thumbnail: string;
  duration?: number;
  addedBy: string;
  addedByUsername: string;
  addedAt: string;
  votes: number;
  isLive: boolean;
  platform: string;
  category: string;
  tags: string[];
}

export interface RoomEvent {
  id: string;
  roomId: string;
  type: RoomEventType;
  data: any;
  timestamp: string;
  userId?: string;
  username?: string;
  isSystemEvent: boolean;
  priority: 'low' | 'medium' | 'high';
  broadcast: boolean;
}

export type RoomEventType = 
  | 'room_created'
  | 'room_updated'
  | 'room_deleted'
  | 'member_joined'
  | 'member_left'
  | 'member_role_changed'
  | 'stream_changed'
  | 'playback_sync'
  | 'feature_enabled'
  | 'feature_disabled'
  | 'poll_created'
  | 'poll_ended'
  | 'message_posted'
  | 'reaction_sent'
  | 'file_shared'
  | 'screen_share_started'
  | 'screen_share_ended'
  | 'voice_chat_started'
  | 'voice_chat_ended'
  | 'custom_event';

class StreamRoomsService extends EventEmitter {
  private currentRoom: StreamRoom | null = null;
  private joinedRooms: Map<string, StreamRoom> = new Map();
  private roomInvitations: Map<string, RoomInvitation> = new Map();
  private roomActivities: Map<string, RoomActivity[]> = new Map();
  private watchQueues: Map<string, WatchQueue> = new Map();
  private currentUserId: string | null = null;
  private currentUsername: string | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private activityTimer: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * Initialize stream rooms service
   */
  async initialize(userId: string, username: string): Promise<void> {
    return withErrorHandling(async () => {
      logDebug('Initializing stream rooms service', { userId, username });
      
      this.currentUserId = userId;
      this.currentUsername = username;
      
      // Load cached data
      await this.loadCachedData();
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Start activity tracking
      this.startActivityTracking();
      
      this.isInitialized = true;
      this.emit('initialized', { userId, username });
    }, { component: 'StreamRoomsService', action: 'initialize' });
  }

  /**
   * Create a new room
   */
  async createRoom(
    name: string,
    type: RoomType,
    options?: {
      description?: string;
      visibility?: RoomVisibility;
      maxMembers?: number;
      streamId?: string;
      tags?: string[];
      category?: string;
      password?: string;
      expiresAt?: string;
      settings?: Partial<RoomSettings>;
      features?: Partial<RoomFeatures>;
    }
  ): Promise<StreamRoom> {
    return withErrorHandling(async () => {
      if (!this.isInitialized || !this.currentUserId || !this.currentUsername) {
        throw new Error('Service not initialized');
      }

      const roomId = this.generateRoomId();
      const now = new Date().toISOString();

      const room: StreamRoom = {
        id: roomId,
        name,
        description: options?.description,
        type,
        visibility: options?.visibility || 'public',
        streamId: options?.streamId,
        hostId: this.currentUserId,
        hostUsername: this.currentUsername,
        members: [
          {
            id: this.generateMemberId(),
            userId: this.currentUserId,
            username: this.currentUsername,
            displayName: this.currentUsername,
            role: 'host',
            permissions: this.getAllPermissions(),
            joinedAt: now,
            lastActiveAt: now,
            isOnline: true,
            isMuted: false,
            isBanned: false,
            statistics: this.createDefaultMemberStatistics(),
            status: 'watching',
          }
        ],
        settings: {
          allowGuestJoin: true,
          requireApproval: false,
          allowVoiceChat: false,
          allowScreenShare: false,
          allowFileSharing: false,
          maxStreamQuality: 'source',
          autoModeration: true,
          slowModeEnabled: false,
          slowModeDelay: 0,
          allowReactions: true,
          allowPolls: true,
          allowAnnotations: true,
          kickInactiveMembers: false,
          inactiveTimeoutMinutes: 30,
          saveWatchHistory: true,
          recordSession: false,
          allowCustomEmotes: false,
          customEmoteSlots: 0,
          theme: 'dark',
          backgroundMusic: false,
          soundEffects: true,
          notifications: {
            memberJoin: true,
            memberLeave: true,
            streamChange: true,
            pollCreated: true,
            hostMessage: true,
            mentionAlert: true,
            reactionAlert: false,
            voiceChatAlert: true,
          },
          ...options?.settings,
        },
        createdAt: now,
        updatedAt: now,
        maxMembers: options?.maxMembers || 50,
        currentMemberCount: 1,
        isActive: true,
        tags: options?.tags || [],
        category: options?.category || 'general',
        thumbnail: options?.streamId ? `https://thumbnail.api/stream/${options.streamId}` : undefined,
        password: options?.password,
        expiresAt: options?.expiresAt,
        statistics: this.createDefaultRoomStatistics(),
        features: {
          chatEnabled: true,
          voiceChatEnabled: false,
          videoEnabled: false,
          screenShareEnabled: false,
          fileUploadEnabled: false,
          pollsEnabled: true,
          gamesEnabled: false,
          musicEnabled: false,
          annotationsEnabled: true,
          reactionsEnabled: true,
          whiteboardEnabled: false,
          breakoutRoomsEnabled: false,
          recordingEnabled: false,
          streamingEnabled: true,
          customFeaturesEnabled: false,
          ...options?.features,
        },
      };

      // Send room creation request
      await webSocketService.sendMessage('room_create', room);
      
      // Add to local cache
      this.joinedRooms.set(roomId, room);
      this.currentRoom = room;
      
      // Create activity
      await this.recordActivity(roomId, 'room_created', 'Room created', { roomName: name }, true);
      
      this.emit('room_created', room);
      return room;
    }, { component: 'StreamRoomsService', action: 'createRoom' });
  }

  /**
   * Join a room
   */
  async joinRoom(roomId: string, password?: string): Promise<void> {
    return withErrorHandling(async () => {
      if (!this.isInitialized || !this.currentUserId || !this.currentUsername) {
        throw new Error('Service not initialized');
      }

      logDebug('Joining room', { roomId });

      await webSocketService.sendMessage('room_join', {
        roomId,
        userId: this.currentUserId,
        username: this.currentUsername,
        password,
      });

      this.emit('room_joining', { roomId });
    }, { component: 'StreamRoomsService', action: 'joinRoom' });
  }

  /**
   * Leave current room
   */
  async leaveRoom(): Promise<void> {
    if (!this.currentRoom) return;

    const roomId = this.currentRoom.id;
    
    await webSocketService.sendMessage('room_leave', {
      roomId,
      userId: this.currentUserId,
    });

    this.joinedRooms.delete(roomId);
    this.currentRoom = null;
    
    this.emit('room_left', { roomId });
  }

  /**
   * Invite user to room
   */
  async inviteUser(
    roomId: string,
    userId: string,
    options?: {
      message?: string;
      role?: MemberRole;
      permissions?: Permission[];
      expiresInHours?: number;
    }
  ): Promise<RoomInvitation> {
    if (!this.currentUserId || !this.currentUsername) {
      throw new Error('User not authenticated');
    }

    const invitation: RoomInvitation = {
      id: this.generateInvitationId(),
      roomId,
      fromUserId: this.currentUserId,
      fromUsername: this.currentUsername,
      toUserId: userId,
      toUsername: '', // Will be filled by server
      message: options?.message,
      expiresAt: new Date(Date.now() + (options?.expiresInHours || 24) * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      permissions: options?.permissions,
      role: options?.role,
    };

    await webSocketService.sendMessage('room_invite', invitation);
    
    this.roomInvitations.set(invitation.id, invitation);
    this.emit('invitation_sent', invitation);
    
    return invitation;
  }

  /**
   * Respond to room invitation
   */
  async respondToInvitation(invitationId: string, accept: boolean): Promise<void> {
    const invitation = this.roomInvitations.get(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    invitation.status = accept ? 'accepted' : 'rejected';
    
    await webSocketService.sendMessage('room_invitation_response', {
      invitationId,
      accept,
      userId: this.currentUserId,
    });

    if (accept) {
      await this.joinRoom(invitation.roomId);
    }

    this.emit('invitation_responded', { invitation, accepted: accept });
  }

  /**
   * Change stream in room
   */
  async changeStream(streamId: string, streamName: string, streamUrl: string): Promise<void> {
    if (!this.currentRoom) {
      throw new Error('No active room');
    }

    if (!this.hasPermission('change_stream')) {
      throw new Error('No permission to change stream');
    }

    await webSocketService.sendMessage('room_stream_change', {
      roomId: this.currentRoom.id,
      streamId,
      streamName,
      streamUrl,
      changedBy: this.currentUserId,
    });

    this.currentRoom.streamId = streamId;
    this.currentRoom.updatedAt = new Date().toISOString();

    await this.recordActivity(
      this.currentRoom.id,
      'stream_change',
      `Stream changed to ${streamName}`,
      { streamId, streamName }
    );

    this.emit('stream_changed', { streamId, streamName, streamUrl });
  }

  /**
   * Manage room queue
   */
  async addToQueue(streamId: string, streamName: string, streamUrl: string): Promise<void> {
    if (!this.currentRoom) {
      throw new Error('No active room');
    }

    if (!this.hasPermission('manage_queue')) {
      throw new Error('No permission to manage queue');
    }

    const queueItem: QueueItem = {
      id: this.generateQueueItemId(),
      streamId,
      streamName,
      streamUrl,
      thumbnail: `https://thumbnail.api/stream/${streamId}`,
      addedBy: this.currentUserId!,
      addedByUsername: this.currentUsername!,
      addedAt: new Date().toISOString(),
      votes: 0,
      isLive: true,
      platform: 'twitch',
      category: 'gaming',
      tags: [],
    };

    await webSocketService.sendMessage('room_queue_add', {
      roomId: this.currentRoom.id,
      item: queueItem,
    });

    this.emit('queue_item_added', queueItem);
  }

  /**
   * Vote on queue item
   */
  async voteOnQueueItem(itemId: string, vote: 'up' | 'down'): Promise<void> {
    if (!this.currentRoom) {
      throw new Error('No active room');
    }

    await webSocketService.sendMessage('room_queue_vote', {
      roomId: this.currentRoom.id,
      itemId,
      vote,
      userId: this.currentUserId,
    });

    this.emit('queue_item_voted', { itemId, vote });
  }

  /**
   * Update room settings
   */
  async updateRoomSettings(settings: Partial<RoomSettings>): Promise<void> {
    if (!this.currentRoom) {
      throw new Error('No active room');
    }

    if (!this.hasPermission('manage_room')) {
      throw new Error('No permission to manage room');
    }

    this.currentRoom.settings = { ...this.currentRoom.settings, ...settings };
    this.currentRoom.updatedAt = new Date().toISOString();

    await webSocketService.sendMessage('room_settings_update', {
      roomId: this.currentRoom.id,
      settings: this.currentRoom.settings,
    });

    this.emit('room_settings_updated', this.currentRoom.settings);
  }

  /**
   * Update member role
   */
  async updateMemberRole(userId: string, role: MemberRole): Promise<void> {
    if (!this.currentRoom) {
      throw new Error('No active room');
    }

    if (!this.hasPermission('manage_room')) {
      throw new Error('No permission to manage room');
    }

    const member = this.currentRoom.members.find(m => m.userId === userId);
    if (!member) {
      throw new Error('Member not found');
    }

    member.role = role;
    member.permissions = this.getPermissionsForRole(role);

    await webSocketService.sendMessage('room_member_role_update', {
      roomId: this.currentRoom.id,
      userId,
      role,
      permissions: member.permissions,
    });

    await this.recordActivity(
      this.currentRoom.id,
      'member_promote',
      `${member.username} promoted to ${role}`,
      { userId, role }
    );

    this.emit('member_role_updated', { userId, role });
  }

  /**
   * Kick member from room
   */
  async kickMember(userId: string, reason?: string): Promise<void> {
    if (!this.currentRoom) {
      throw new Error('No active room');
    }

    if (!this.hasPermission('kick_users')) {
      throw new Error('No permission to kick users');
    }

    await webSocketService.sendMessage('room_member_kick', {
      roomId: this.currentRoom.id,
      userId,
      reason,
      kickedBy: this.currentUserId,
    });

    // Remove from local members
    this.currentRoom.members = this.currentRoom.members.filter(m => m.userId !== userId);
    this.currentRoom.currentMemberCount--;

    this.emit('member_kicked', { userId, reason });
  }

  /**
   * Ban member from room
   */
  async banMember(userId: string, reason?: string, durationHours?: number): Promise<void> {
    if (!this.currentRoom) {
      throw new Error('No active room');
    }

    if (!this.hasPermission('ban_users')) {
      throw new Error('No permission to ban users');
    }

    const banExpiresAt = durationHours 
      ? new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
      : undefined;

    await webSocketService.sendMessage('room_member_ban', {
      roomId: this.currentRoom.id,
      userId,
      reason,
      banExpiresAt,
      bannedBy: this.currentUserId,
    });

    // Update local member
    const member = this.currentRoom.members.find(m => m.userId === userId);
    if (member) {
      member.isBanned = true;
      member.banExpiresAt = banExpiresAt;
    }

    this.emit('member_banned', { userId, reason, banExpiresAt });
  }

  /**
   * Get room statistics
   */
  getRoomStatistics(): RoomStatistics | null {
    return this.currentRoom?.statistics || null;
  }

  /**
   * Get room activities
   */
  getRoomActivities(roomId: string, limit: number = 50): RoomActivity[] {
    const activities = this.roomActivities.get(roomId) || [];
    return activities.slice(-limit);
  }

  /**
   * Get current room
   */
  getCurrentRoom(): StreamRoom | null {
    return this.currentRoom;
  }

  /**
   * Get joined rooms
   */
  getJoinedRooms(): StreamRoom[] {
    return Array.from(this.joinedRooms.values());
  }

  /**
   * Get pending invitations
   */
  getPendingInvitations(): RoomInvitation[] {
    return Array.from(this.roomInvitations.values())
      .filter(inv => inv.status === 'pending' && inv.toUserId === this.currentUserId);
  }

  /**
   * Search public rooms
   */
  async searchRooms(query: string, filters?: {
    type?: RoomType;
    category?: string;
    tags?: string[];
    minMembers?: number;
    maxMembers?: number;
    hasStream?: boolean;
  }): Promise<StreamRoom[]> {
    await webSocketService.sendMessage('room_search', {
      query,
      filters,
      userId: this.currentUserId,
    });

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve([]);
      }, 5000);

      const handleSearchResults = (results: StreamRoom[]) => {
        clearTimeout(timeout);
        this.off('room_search_results', handleSearchResults);
        resolve(results);
      };

      this.once('room_search_results', handleSearchResults);
    });
  }

  /**
   * Dispose service
   */
  dispose(): void {
    this.stopHeartbeat();
    this.stopActivityTracking();
    this.currentRoom = null;
    this.joinedRooms.clear();
    this.roomInvitations.clear();
    this.roomActivities.clear();
    this.watchQueues.clear();
    this.isInitialized = false;
    this.emit('disposed');
  }

  // Private methods

  private setupEventHandlers(): void {
    webSocketService.on('message:room_state', this.handleRoomState.bind(this));
    webSocketService.on('message:room_member_join', this.handleMemberJoin.bind(this));
    webSocketService.on('message:room_member_leave', this.handleMemberLeave.bind(this));
    webSocketService.on('message:room_stream_change', this.handleStreamChange.bind(this));
    webSocketService.on('message:room_settings_update', this.handleSettingsUpdate.bind(this));
    webSocketService.on('message:room_member_role_update', this.handleMemberRoleUpdate.bind(this));
    webSocketService.on('message:room_invitation', this.handleInvitation.bind(this));
    webSocketService.on('message:room_queue_update', this.handleQueueUpdate.bind(this));
    webSocketService.on('message:room_activity', this.handleActivity.bind(this));
    webSocketService.on('message:room_search_results', this.handleSearchResults.bind(this));
    webSocketService.on('disconnected', this.handleDisconnected.bind(this));
  }

  private handleRoomState(wsMessage: WebSocketMessage): void {
    const room: StreamRoom = wsMessage.data;
    
    this.joinedRooms.set(room.id, room);
    if (room.members.some(m => m.userId === this.currentUserId)) {
      this.currentRoom = room;
    }
    
    this.emit('room_state_updated', room);
  }

  private handleMemberJoin(wsMessage: WebSocketMessage): void {
    const { roomId, member } = wsMessage.data;
    
    const room = this.joinedRooms.get(roomId);
    if (room) {
      room.members.push(member);
      room.currentMemberCount++;
      
      if (room.id === this.currentRoom?.id) {
        this.currentRoom = room;
      }
    }
    
    this.recordActivity(roomId, 'member_join', `${member.username} joined the room`, { userId: member.userId });
    this.emit('member_joined', { roomId, member });
  }

  private handleMemberLeave(wsMessage: WebSocketMessage): void {
    const { roomId, userId, username } = wsMessage.data;
    
    const room = this.joinedRooms.get(roomId);
    if (room) {
      room.members = room.members.filter(m => m.userId !== userId);
      room.currentMemberCount--;
      
      if (room.id === this.currentRoom?.id) {
        this.currentRoom = room;
      }
    }
    
    this.recordActivity(roomId, 'member_leave', `${username} left the room`, { userId });
    this.emit('member_left', { roomId, userId, username });
  }

  private handleStreamChange(wsMessage: WebSocketMessage): void {
    const { roomId, streamId, streamName, streamUrl } = wsMessage.data;
    
    const room = this.joinedRooms.get(roomId);
    if (room) {
      room.streamId = streamId;
      room.updatedAt = new Date().toISOString();
      
      if (room.id === this.currentRoom?.id) {
        this.currentRoom = room;
      }
    }
    
    this.emit('stream_changed', { roomId, streamId, streamName, streamUrl });
  }

  private handleSettingsUpdate(wsMessage: WebSocketMessage): void {
    const { roomId, settings } = wsMessage.data;
    
    const room = this.joinedRooms.get(roomId);
    if (room) {
      room.settings = settings;
      room.updatedAt = new Date().toISOString();
      
      if (room.id === this.currentRoom?.id) {
        this.currentRoom = room;
      }
    }
    
    this.emit('room_settings_updated', { roomId, settings });
  }

  private handleMemberRoleUpdate(wsMessage: WebSocketMessage): void {
    const { roomId, userId, role, permissions } = wsMessage.data;
    
    const room = this.joinedRooms.get(roomId);
    if (room) {
      const member = room.members.find(m => m.userId === userId);
      if (member) {
        member.role = role;
        member.permissions = permissions;
      }
      
      if (room.id === this.currentRoom?.id) {
        this.currentRoom = room;
      }
    }
    
    this.emit('member_role_updated', { roomId, userId, role });
  }

  private handleInvitation(wsMessage: WebSocketMessage): void {
    const invitation: RoomInvitation = wsMessage.data;
    this.roomInvitations.set(invitation.id, invitation);
    this.emit('invitation_received', invitation);
  }

  private handleQueueUpdate(wsMessage: WebSocketMessage): void {
    const { roomId, queue } = wsMessage.data;
    this.watchQueues.set(roomId, queue);
    this.emit('queue_updated', { roomId, queue });
  }

  private handleActivity(wsMessage: WebSocketMessage): void {
    const activity: RoomActivity = wsMessage.data;
    
    if (!this.roomActivities.has(activity.roomId)) {
      this.roomActivities.set(activity.roomId, []);
    }
    
    const activities = this.roomActivities.get(activity.roomId)!;
    activities.push(activity);
    
    // Keep only last 100 activities
    if (activities.length > 100) {
      activities.shift();
    }
    
    this.emit('activity_received', activity);
  }

  private handleSearchResults(wsMessage: WebSocketMessage): void {
    const results: StreamRoom[] = wsMessage.data;
    this.emit('room_search_results', results);
  }

  private handleDisconnected(): void {
    this.emit('disconnected');
  }

  private async recordActivity(
    roomId: string,
    type: ActivityType,
    description: string,
    data?: any,
    isSystemEvent: boolean = false
  ): Promise<void> {
    const activity: RoomActivity = {
      id: this.generateActivityId(),
      roomId,
      userId: this.currentUserId!,
      username: this.currentUsername!,
      type,
      description,
      data,
      timestamp: new Date().toISOString(),
      isVisible: true,
      priority: 'medium',
    };

    if (!this.roomActivities.has(roomId)) {
      this.roomActivities.set(roomId, []);
    }

    const activities = this.roomActivities.get(roomId)!;
    activities.push(activity);

    await webSocketService.sendMessage('room_activity', activity);
  }

  private hasPermission(permission: Permission): boolean {
    if (!this.currentRoom || !this.currentUserId) return false;
    
    const member = this.currentRoom.members.find(m => m.userId === this.currentUserId);
    return member ? member.permissions.includes(permission) : false;
  }

  private getAllPermissions(): Permission[] {
    return [
      'manage_room',
      'invite_users',
      'kick_users',
      'ban_users',
      'mute_users',
      'change_stream',
      'control_playback',
      'moderate_chat',
      'create_polls',
      'manage_queue',
      'share_screen',
      'use_voice_chat',
      'create_annotations',
      'manage_reactions',
    ];
  }

  private getPermissionsForRole(role: MemberRole): Permission[] {
    const permissions: Record<MemberRole, Permission[]> = {
      host: this.getAllPermissions(),
      co_host: [
        'invite_users',
        'kick_users',
        'mute_users',
        'change_stream',
        'control_playback',
        'moderate_chat',
        'create_polls',
        'manage_queue',
        'share_screen',
        'use_voice_chat',
        'create_annotations',
        'manage_reactions',
      ],
      moderator: [
        'kick_users',
        'mute_users',
        'moderate_chat',
        'create_polls',
        'manage_queue',
        'use_voice_chat',
        'create_annotations',
        'manage_reactions',
      ],
      vip: [
        'create_polls',
        'manage_queue',
        'use_voice_chat',
        'create_annotations',
        'manage_reactions',
      ],
      member: [
        'use_voice_chat',
        'create_annotations',
        'manage_reactions',
      ],
      guest: [],
    };

    return permissions[role] || [];
  }

  private createDefaultMemberStatistics(): MemberStatistics {
    return {
      totalTimeInRoom: 0,
      messagesPosted: 0,
      reactionsGiven: 0,
      pollsCreated: 0,
      pollsParticipated: 0,
      streamsWatched: 0,
      averageViewTime: 0,
      reputation: 0,
      level: 1,
      badges: [],
    };
  }

  private createDefaultRoomStatistics(): RoomStatistics {
    return {
      totalMembers: 1,
      peakMembers: 1,
      totalWatchTime: 0,
      averageWatchTime: 0,
      totalMessages: 0,
      totalReactions: 0,
      totalPolls: 0,
      totalStreamsWatched: 0,
      memberRetentionRate: 0,
      activityScore: 0,
      popularStreams: [],
      peakActivityTime: '',
      engagementMetrics: {
        messagesPerMember: 0,
        reactionsPerMember: 0,
        pollParticipationRate: 0,
        averageSessionLength: 0,
        returnVisitorRate: 0,
        shareRate: 0,
        recommendationScore: 0,
      },
    };
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.currentRoom) {
        webSocketService.sendMessage('room_heartbeat', {
          roomId: this.currentRoom.id,
          userId: this.currentUserId,
          timestamp: new Date().toISOString(),
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

  private startActivityTracking(): void {
    this.activityTimer = setInterval(() => {
      if (this.currentRoom && this.currentUserId) {
        const member = this.currentRoom.members.find(m => m.userId === this.currentUserId);
        if (member) {
          member.lastActiveAt = new Date().toISOString();
        }
      }
    }, 60000); // 1 minute
  }

  private stopActivityTracking(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
  }

  private async loadCachedData(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem('stream_rooms_data');
      if (cached) {
        const data = JSON.parse(cached);
        // Restore cached rooms, invitations, etc.
        logDebug('Loaded cached stream rooms data');
      }
    } catch (error) {
      logError('Failed to load cached stream rooms data', error);
    }
  }

  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMemberId(): string {
    return `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateInvitationId(): string {
    return `invitation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateActivityId(): string {
    return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateQueueItemId(): string {
    return `queue_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const streamRoomsService = new StreamRoomsService();

// Helper functions
export const initializeRooms = async (userId: string, username: string) => {
  return streamRoomsService.initialize(userId, username);
};

export const createRoom = async (name: string, type: RoomType, options?: any) => {
  return streamRoomsService.createRoom(name, type, options);
};

export const joinRoom = async (roomId: string, password?: string) => {
  return streamRoomsService.joinRoom(roomId, password);
};

export const inviteUser = async (roomId: string, userId: string, options?: any) => {
  return streamRoomsService.inviteUser(roomId, userId, options);
};

export const changeRoomStream = async (streamId: string, streamName: string, streamUrl: string) => {
  return streamRoomsService.changeStream(streamId, streamName, streamUrl);
};