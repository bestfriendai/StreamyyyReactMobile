import { EventEmitter } from 'eventemitter3';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError, logDebug, withErrorHandling } from '@/utils/errorHandler';

export interface WebSocketMessage {
  id: string;
  type: WebSocketMessageType;
  data: any;
  timestamp: string;
  userId?: string;
  roomId?: string;
}

export type WebSocketMessageType = 
  | 'chat_message'
  | 'user_join'
  | 'user_leave'
  | 'typing_start'
  | 'typing_stop'
  | 'reaction'
  | 'viewer_sync'
  | 'stream_event'
  | 'poll_update'
  | 'annotation'
  | 'presence_update'
  | 'room_state'
  | 'system_message'
  | 'error';

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  timeout: number;
  protocols?: string[];
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  lastConnectedAt: string | null;
  lastDisconnectedAt: string | null;
  latency: number;
  roomId: string | null;
  userId: string | null;
}

export interface UserPresence {
  userId: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
  currentRoom?: string;
  watchingStreams: string[];
  status?: 'watching' | 'away' | 'busy';
}

export interface RealtimeRoom {
  id: string;
  name: string;
  type: 'stream' | 'community' | 'private';
  streamId?: string;
  maxUsers: number;
  currentUsers: number;
  isPrivate: boolean;
  createdAt: string;
  moderators: string[];
  settings: RoomSettings;
}

export interface RoomSettings {
  allowChat: boolean;
  allowReactions: boolean;
  allowAnnotations: boolean;
  requireModeration: boolean;
  slowModeDelay: number;
  maxMessageLength: number;
  allowedFileTypes: string[];
  autoDeleteMessages: boolean;
  messageRetentionHours: number;
}

class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private connectionState: ConnectionState;
  private messageQueue: WebSocketMessage[] = [];
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private lastHeartbeat: number = 0;
  private isDestroyed: boolean = false;

  private readonly defaultConfig: WebSocketConfig = {
    url: process.env.EXPO_PUBLIC_WS_URL || 'wss://api.streamyyy.com/ws',
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
    timeout: 10000,
    protocols: ['streamyyy-realtime-v1'],
  };

  constructor(config?: Partial<WebSocketConfig>) {
    super();
    this.config = { ...this.defaultConfig, ...config };
    this.connectionState = {
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      lastConnectedAt: null,
      lastDisconnectedAt: null,
      latency: 0,
      roomId: null,
      userId: null,
    };
  }

  /**
   * Connect to WebSocket server
   */
  async connect(userId: string, roomId?: string): Promise<void> {
    if (this.isDestroyed) return;

    return withErrorHandling(async () => {
      logDebug('WebSocket connecting', { userId, roomId });
      
      this.connectionState.userId = userId;
      this.connectionState.roomId = roomId;
      this.connectionState.isConnecting = true;
      
      this.emit('connecting', this.connectionState);

      // Build connection URL with auth params
      const url = new URL(this.config.url);
      url.searchParams.set('userId', userId);
      if (roomId) url.searchParams.set('roomId', roomId);

      // Add auth token if available
      const authToken = await AsyncStorage.getItem('auth_token');
      if (authToken) {
        url.searchParams.set('token', authToken);
      }

      this.ws = new WebSocket(url.toString(), this.config.protocols);
      
      // Set up event handlers
      this.setupEventHandlers();

      // Start connection timeout
      const timeout = setTimeout(() => {
        if (this.connectionState.isConnecting) {
          this.handleConnectionError(new Error('Connection timeout'));
        }
      }, this.config.timeout);

      // Wait for connection to establish
      return new Promise<void>((resolve, reject) => {
        const onOpen = () => {
          clearTimeout(timeout);
          resolve();
        };

        const onError = (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        };

        this.once('connected', onOpen);
        this.once('error', onError);
      });

    }, { component: 'WebSocketService', action: 'connect' });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    logDebug('WebSocket disconnecting');
    
    this.isDestroyed = true;
    this.stopHeartbeat();
    this.stopReconnect();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      lastDisconnectedAt: new Date().toISOString(),
    });
    
    this.emit('disconnected', this.connectionState);
  }

  /**
   * Send message to WebSocket server
   */
  async sendMessage(type: WebSocketMessageType, data: any, targetRoomId?: string): Promise<void> {
    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type,
      data,
      timestamp: new Date().toISOString(),
      userId: this.connectionState.userId,
      roomId: targetRoomId || this.connectionState.roomId,
    };

    if (this.connectionState.isConnected && this.ws) {
      try {
        this.ws.send(JSON.stringify(message));
        logDebug('WebSocket message sent', { type, messageId: message.id });
        this.emit('message_sent', message);
      } catch (error) {
        logError('Failed to send WebSocket message', error);
        this.queueMessage(message);
      }
    } else {
      this.queueMessage(message);
    }
  }

  /**
   * Join a room
   */
  async joinRoom(roomId: string): Promise<void> {
    await this.sendMessage('user_join', { roomId });
    this.connectionState.roomId = roomId;
    this.emit('room_joined', { roomId });
  }

  /**
   * Leave a room
   */
  async leaveRoom(): Promise<void> {
    if (this.connectionState.roomId) {
      await this.sendMessage('user_leave', { roomId: this.connectionState.roomId });
      const oldRoomId = this.connectionState.roomId;
      this.connectionState.roomId = null;
      this.emit('room_left', { roomId: oldRoomId });
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(isTyping: boolean): Promise<void> {
    await this.sendMessage(
      isTyping ? 'typing_start' : 'typing_stop',
      { isTyping }
    );
  }

  /**
   * Send reaction
   */
  async sendReaction(emoji: string, targetId?: string): Promise<void> {
    await this.sendMessage('reaction', {
      emoji,
      targetId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send viewer sync data
   */
  async sendViewerSync(syncData: any): Promise<void> {
    await this.sendMessage('viewer_sync', syncData);
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Get connection latency
   */
  getLatency(): number {
    return this.connectionState.latency;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState.isConnected;
  }

  /**
   * Get queued messages count
   */
  getQueuedMessageCount(): number {
    return this.messageQueue.length;
  }

  // Private methods

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      logDebug('WebSocket connected');
      
      this.updateConnectionState({
        isConnected: true,
        isConnecting: false,
        isReconnecting: false,
        reconnectAttempts: 0,
        lastConnectedAt: new Date().toISOString(),
      });
      
      this.startHeartbeat();
      this.flushMessageQueue();
      this.emit('connected', this.connectionState);
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        logError('Failed to parse WebSocket message', error);
      }
    };

    this.ws.onclose = (event) => {
      logDebug('WebSocket closed', { code: event.code, reason: event.reason });
      
      this.updateConnectionState({
        isConnected: false,
        isConnecting: false,
        lastDisconnectedAt: new Date().toISOString(),
      });
      
      this.stopHeartbeat();
      this.emit('disconnected', { ...this.connectionState, code: event.code, reason: event.reason });
      
      // Auto-reconnect if not intentionally closed
      if (!this.isDestroyed && event.code !== 1000) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      logError('WebSocket error', error);
      this.handleConnectionError(error);
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    logDebug('WebSocket message received', { type: message.type, id: message.id });
    
    // Handle system messages
    if (message.type === 'system_message') {
      this.handleSystemMessage(message);
      return;
    }

    // Handle heartbeat responses
    if (message.type === 'heartbeat_response') {
      this.handleHeartbeatResponse(message);
      return;
    }

    // Emit message for other handlers
    this.emit('message', message);
    this.emit(`message:${message.type}`, message);
  }

  private handleSystemMessage(message: WebSocketMessage): void {
    const { data } = message;
    
    switch (data.event) {
      case 'room_state':
        this.emit('room_state', data.roomState);
        break;
      case 'user_count_update':
        this.emit('user_count_update', data.count);
        break;
      case 'presence_update':
        this.emit('presence_update', data.presence);
        break;
      default:
        logDebug('Unknown system message', data);
    }
  }

  private handleHeartbeatResponse(message: WebSocketMessage): void {
    const now = Date.now();
    const latency = now - this.lastHeartbeat;
    
    this.updateConnectionState({ latency });
    
    logDebug('Heartbeat latency', { latency });
  }

  private handleConnectionError(error: any): void {
    logError('WebSocket connection error', error);
    
    this.updateConnectionState({
      isConnected: false,
      isConnecting: false,
    });
    
    this.emit('error', error);
    
    if (!this.isDestroyed) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.connectionState.reconnectAttempts >= this.config.maxReconnectAttempts) {
      logError('Max reconnect attempts reached');
      this.emit('reconnect_failed', this.connectionState);
      return;
    }

    this.updateConnectionState({
      isReconnecting: true,
      reconnectAttempts: this.connectionState.reconnectAttempts + 1,
    });

    const delay = this.config.reconnectInterval * Math.pow(2, this.connectionState.reconnectAttempts - 1);
    
    logDebug('Scheduling reconnect', { attempt: this.connectionState.reconnectAttempts, delay });
    
    this.reconnectTimer = setTimeout(() => {
      if (!this.isDestroyed) {
        this.reconnect();
      }
    }, delay);
  }

  private async reconnect(): Promise<void> {
    if (this.isDestroyed) return;

    try {
      await this.connect(this.connectionState.userId!, this.connectionState.roomId!);
      this.emit('reconnected', this.connectionState);
    } catch (error) {
      logError('Reconnection failed', error);
      this.scheduleReconnect();
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.connectionState.isConnected && this.ws) {
        this.lastHeartbeat = Date.now();
        this.sendMessage('heartbeat', { timestamp: this.lastHeartbeat });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private queueMessage(message: WebSocketMessage): void {
    this.messageQueue.push(message);
    
    // Limit queue size
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift();
    }
    
    logDebug('Message queued', { messageId: message.id, queueSize: this.messageQueue.length });
  }

  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return;
    
    logDebug('Flushing message queue', { messageCount: this.messageQueue.length });
    
    const messages = [...this.messageQueue];
    this.messageQueue = [];
    
    messages.forEach(message => {
      if (this.ws && this.connectionState.isConnected) {
        try {
          this.ws.send(JSON.stringify(message));
        } catch (error) {
          logError('Failed to send queued message', error);
          this.queueMessage(message);
        }
      }
    });
  }

  private updateConnectionState(updates: Partial<ConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates };
    this.emit('connection_state_changed', this.connectionState);
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();

// Helper functions
export const connectToRealtime = async (userId: string, roomId?: string) => {
  return webSocketService.connect(userId, roomId);
};

export const disconnectFromRealtime = () => {
  webSocketService.disconnect();
};

export const sendRealtimeMessage = async (type: WebSocketMessageType, data: any) => {
  return webSocketService.sendMessage(type, data);
};

export const joinRealtimeRoom = async (roomId: string) => {
  return webSocketService.joinRoom(roomId);
};

export const leaveRealtimeRoom = async () => {
  return webSocketService.leaveRoom();
};