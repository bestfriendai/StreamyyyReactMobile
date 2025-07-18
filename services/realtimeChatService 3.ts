import { EventEmitter } from 'eventemitter3';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { webSocketService, WebSocketMessage } from './webSocketService';
import { logError, logDebug, withErrorHandling } from '@/utils/errorHandler';

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  type: ChatMessageType;
  roomId: string;
  replyTo?: string;
  mentions?: string[];
  reactions?: ChatReaction[];
  attachments?: ChatAttachment[];
  isModerated?: boolean;
  isDeleted?: boolean;
  editedAt?: string;
  metadata?: Record<string, any>;
}

export type ChatMessageType = 
  | 'text'
  | 'emoji'
  | 'image'
  | 'gif'
  | 'sticker'
  | 'reply'
  | 'system'
  | 'moderation'
  | 'announcement'
  | 'poll'
  | 'command';

export interface ChatReaction {
  emoji: string;
  userId: string;
  username: string;
  timestamp: string;
}

export interface ChatAttachment {
  id: string;
  type: 'image' | 'gif' | 'video' | 'audio' | 'file';
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
  duration?: number;
  width?: number;
  height?: number;
}

export interface ChatUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  badges: ChatBadge[];
  isOnline: boolean;
  lastSeen: string;
  joinedAt: string;
  isModerator: boolean;
  isSubscriber: boolean;
  isVIP: boolean;
  level: number;
  messageCount: number;
  reputation: number;
  status?: 'active' | 'away' | 'busy' | 'invisible';
}

export interface ChatBadge {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'public' | 'private' | 'stream' | 'group';
  streamId?: string;
  description?: string;
  topic?: string;
  maxUsers: number;
  currentUserCount: number;
  isModerated: boolean;
  settings: ChatRoomSettings;
  moderators: string[];
  subscribers: string[];
  bannedUsers: string[];
  slowModeDelay: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoomSettings {
  allowImages: boolean;
  allowGifs: boolean;
  allowEmojis: boolean;
  allowStickers: boolean;
  allowReplies: boolean;
  allowReactions: boolean;
  allowMentions: boolean;
  requireVerification: boolean;
  slowModeEnabled: boolean;
  autoModerationEnabled: boolean;
  maxMessageLength: number;
  messageRetentionDays: number;
  rateLimitPerMinute: number;
  bannedWords: string[];
  allowedFileTypes: string[];
  maxFileSize: number;
}

export interface TypingIndicator {
  userId: string;
  username: string;
  roomId: string;
  startedAt: string;
  isTyping: boolean;
}

export interface ChatCommand {
  command: string;
  description: string;
  usage: string;
  permissions: string[];
  handler: (args: string[], context: ChatCommandContext) => Promise<void>;
}

export interface ChatCommandContext {
  message: ChatMessage;
  room: ChatRoom;
  user: ChatUser;
  args: string[];
  reply: (message: string) => Promise<void>;
  delete: () => Promise<void>;
  timeout: (duration: number) => Promise<void>;
  ban: (reason?: string) => Promise<void>;
}

export interface ChatEmote {
  id: string;
  name: string;
  url: string;
  category: string;
  isCustom: boolean;
  isAnimated: boolean;
  isSubscriberOnly: boolean;
  createdBy?: string;
  createdAt: string;
  usageCount: number;
  tags: string[];
}

export interface ChatStatistics {
  totalMessages: number;
  activeUsers: number;
  messagesPerHour: number;
  topEmotes: Array<{ emote: string; count: number }>;
  topUsers: Array<{ username: string; messageCount: number }>;
  peakViewers: number;
  averageMessageLength: number;
  messagesByHour: Array<{ hour: number; count: number }>;
  userRetention: number;
}

class RealtimeChatService extends EventEmitter {
  private currentRoom: ChatRoom | null = null;
  private currentUser: ChatUser | null = null;
  private messages: Map<string, ChatMessage[]> = new Map();
  private users: Map<string, ChatUser> = new Map();
  private typingIndicators: Map<string, TypingIndicator> = new Map();
  private chatCommands: Map<string, ChatCommand> = new Map();
  private emotes: Map<string, ChatEmote> = new Map();
  private messageCache: Map<string, ChatMessage> = new Map();
  private rateLimiter: Map<string, number[]> = new Map();
  private typingTimer: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.setupEventHandlers();
    this.initializeCommands();
    this.loadEmotes();
  }

  /**
   * Initialize chat service
   */
  async initialize(user: ChatUser): Promise<void> {
    return withErrorHandling(async () => {
      logDebug('Initializing realtime chat service', { userId: user.id });
      
      this.currentUser = user;
      this.isInitialized = true;
      
      // Load cached data
      await this.loadCachedData();
      
      this.emit('initialized', { user });
    }, { component: 'RealtimeChatService', action: 'initialize' });
  }

  /**
   * Join a chat room
   */
  async joinRoom(roomId: string): Promise<void> {
    return withErrorHandling(async () => {
      logDebug('Joining chat room', { roomId });
      
      if (!this.isInitialized) {
        throw new Error('Chat service not initialized');
      }

      // Leave current room if any
      if (this.currentRoom) {
        await this.leaveRoom();
      }

      // Join new room
      await webSocketService.joinRoom(roomId);
      
      // Request room info
      await webSocketService.sendMessage('room_info_request', { roomId });
      
      this.emit('room_joining', { roomId });
    }, { component: 'RealtimeChatService', action: 'joinRoom' });
  }

  /**
   * Leave current chat room
   */
  async leaveRoom(): Promise<void> {
    if (!this.currentRoom) return;

    await webSocketService.leaveRoom();
    
    const oldRoom = this.currentRoom;
    this.currentRoom = null;
    this.users.clear();
    this.typingIndicators.clear();
    
    this.emit('room_left', { room: oldRoom });
  }

  /**
   * Send a chat message
   */
  async sendMessage(content: string, type: ChatMessageType = 'text', options?: {
    replyTo?: string;
    mentions?: string[];
    attachments?: ChatAttachment[];
  }): Promise<void> {
    return withErrorHandling(async () => {
      if (!this.currentRoom || !this.currentUser) {
        throw new Error('No active chat room or user');
      }

      // Rate limiting check
      if (!this.checkRateLimit(this.currentUser.id)) {
        throw new Error('Rate limit exceeded');
      }

      // Content validation
      const validatedContent = this.validateMessage(content);
      
      // Check for commands
      if (validatedContent.startsWith('/')) {
        await this.handleCommand(validatedContent);
        return;
      }

      // Create message
      const message: ChatMessage = {
        id: this.generateMessageId(),
        userId: this.currentUser.id,
        username: this.currentUser.username,
        message: validatedContent,
        timestamp: new Date().toISOString(),
        type,
        roomId: this.currentRoom.id,
        replyTo: options?.replyTo,
        mentions: options?.mentions,
        attachments: options?.attachments,
        reactions: [],
      };

      // Send message
      await webSocketService.sendMessage('chat_message', message);
      
      // Add to local cache
      this.addMessageToCache(message);
      
      this.emit('message_sent', message);
    }, { component: 'RealtimeChatService', action: 'sendMessage' });
  }

  /**
   * React to a message
   */
  async reactToMessage(messageId: string, emoji: string): Promise<void> {
    if (!this.currentUser) return;

    const reaction: ChatReaction = {
      emoji,
      userId: this.currentUser.id,
      username: this.currentUser.username,
      timestamp: new Date().toISOString(),
    };

    await webSocketService.sendMessage('message_reaction', {
      messageId,
      reaction,
      action: 'add',
    });
  }

  /**
   * Reply to a message
   */
  async replyToMessage(messageId: string, content: string): Promise<void> {
    await this.sendMessage(content, 'reply', { replyTo: messageId });
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, newContent: string): Promise<void> {
    if (!this.currentUser) return;

    await webSocketService.sendMessage('message_edit', {
      messageId,
      newContent,
      editedAt: new Date().toISOString(),
    });
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    if (!this.currentUser) return;

    await webSocketService.sendMessage('message_delete', {
      messageId,
      deletedBy: this.currentUser.id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Start typing indicator
   */
  async startTyping(): Promise<void> {
    if (!this.currentRoom || !this.currentUser) return;

    await webSocketService.sendTypingIndicator(true);
    
    // Auto-stop typing after 5 seconds
    if (this.typingTimer) clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      this.stopTyping();
    }, 5000);
  }

  /**
   * Stop typing indicator
   */
  async stopTyping(): Promise<void> {
    if (!this.currentRoom || !this.currentUser) return;

    await webSocketService.sendTypingIndicator(false);
    
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
  }

  /**
   * Get room messages
   */
  getRoomMessages(roomId: string, limit: number = 100): ChatMessage[] {
    const messages = this.messages.get(roomId) || [];
    return messages.slice(-limit);
  }

  /**
   * Get room users
   */
  getRoomUsers(): ChatUser[] {
    return Array.from(this.users.values());
  }

  /**
   * Get typing indicators
   */
  getTypingIndicators(): TypingIndicator[] {
    return Array.from(this.typingIndicators.values()).filter(t => t.isTyping);
  }

  /**
   * Get current room
   */
  getCurrentRoom(): ChatRoom | null {
    return this.currentRoom;
  }

  /**
   * Get current user
   */
  getCurrentUser(): ChatUser | null {
    return this.currentUser;
  }

  /**
   * Search messages
   */
  searchMessages(query: string, roomId?: string, limit: number = 50): ChatMessage[] {
    const searchRooms = roomId ? [roomId] : Array.from(this.messages.keys());
    const results: ChatMessage[] = [];

    for (const room of searchRooms) {
      const messages = this.messages.get(room) || [];
      const filtered = messages.filter(msg => 
        msg.message.toLowerCase().includes(query.toLowerCase()) ||
        msg.username.toLowerCase().includes(query.toLowerCase())
      );
      results.push(...filtered);
    }

    return results.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, limit);
  }

  /**
   * Get chat statistics
   */
  getChatStatistics(roomId: string): ChatStatistics {
    const messages = this.messages.get(roomId) || [];
    const users = this.getRoomUsers();
    
    const totalMessages = messages.length;
    const activeUsers = users.filter(u => u.isOnline).length;
    
    // Calculate messages per hour
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentMessages = messages.filter(m => new Date(m.timestamp) > hourAgo);
    
    // Get emote usage
    const emoteUsage = new Map<string, number>();
    messages.forEach(msg => {
      const emotes = this.extractEmotes(msg.message);
      emotes.forEach(emote => {
        emoteUsage.set(emote, (emoteUsage.get(emote) || 0) + 1);
      });
    });

    const topEmotes = Array.from(emoteUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([emote, count]) => ({ emote, count }));

    // Get user message counts
    const userMessageCounts = new Map<string, number>();
    messages.forEach(msg => {
      userMessageCounts.set(msg.username, (userMessageCounts.get(msg.username) || 0) + 1);
    });

    const topUsers = Array.from(userMessageCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([username, messageCount]) => ({ username, messageCount }));

    return {
      totalMessages,
      activeUsers,
      messagesPerHour: recentMessages.length,
      topEmotes,
      topUsers,
      peakViewers: Math.max(...users.map(u => u.level), 0),
      averageMessageLength: messages.reduce((sum, msg) => sum + msg.message.length, 0) / totalMessages || 0,
      messagesByHour: this.getMessagesByHour(messages),
      userRetention: this.calculateUserRetention(users),
    };
  }

  // Private methods

  private setupEventHandlers(): void {
    webSocketService.on('message:chat_message', this.handleChatMessage.bind(this));
    webSocketService.on('message:message_reaction', this.handleMessageReaction.bind(this));
    webSocketService.on('message:message_edit', this.handleMessageEdit.bind(this));
    webSocketService.on('message:message_delete', this.handleMessageDelete.bind(this));
    webSocketService.on('message:typing_start', this.handleTypingStart.bind(this));
    webSocketService.on('message:typing_stop', this.handleTypingStop.bind(this));
    webSocketService.on('message:user_join', this.handleUserJoin.bind(this));
    webSocketService.on('message:user_leave', this.handleUserLeave.bind(this));
    webSocketService.on('room_state', this.handleRoomState.bind(this));
    webSocketService.on('disconnected', this.handleDisconnected.bind(this));
  }

  private handleChatMessage(wsMessage: WebSocketMessage): void {
    const message: ChatMessage = wsMessage.data;
    this.addMessageToCache(message);
    this.emit('message_received', message);
  }

  private handleMessageReaction(wsMessage: WebSocketMessage): void {
    const { messageId, reaction, action } = wsMessage.data;
    const message = this.messageCache.get(messageId);
    
    if (message) {
      if (action === 'add') {
        message.reactions = message.reactions || [];
        message.reactions.push(reaction);
      } else if (action === 'remove') {
        message.reactions = message.reactions?.filter(r => 
          r.userId !== reaction.userId || r.emoji !== reaction.emoji
        ) || [];
      }
      
      this.messageCache.set(messageId, message);
      this.emit('message_reaction', { messageId, reaction, action });
    }
  }

  private handleMessageEdit(wsMessage: WebSocketMessage): void {
    const { messageId, newContent, editedAt } = wsMessage.data;
    const message = this.messageCache.get(messageId);
    
    if (message) {
      message.message = newContent;
      message.editedAt = editedAt;
      this.messageCache.set(messageId, message);
      this.emit('message_edited', { messageId, newContent, editedAt });
    }
  }

  private handleMessageDelete(wsMessage: WebSocketMessage): void {
    const { messageId } = wsMessage.data;
    const message = this.messageCache.get(messageId);
    
    if (message) {
      message.isDeleted = true;
      this.messageCache.set(messageId, message);
      this.emit('message_deleted', { messageId });
    }
  }

  private handleTypingStart(wsMessage: WebSocketMessage): void {
    const { userId, username, roomId } = wsMessage.data;
    
    if (userId === this.currentUser?.id) return;
    
    const indicator: TypingIndicator = {
      userId,
      username,
      roomId,
      startedAt: new Date().toISOString(),
      isTyping: true,
    };
    
    this.typingIndicators.set(userId, indicator);
    this.emit('typing_start', indicator);
  }

  private handleTypingStop(wsMessage: WebSocketMessage): void {
    const { userId } = wsMessage.data;
    
    if (userId === this.currentUser?.id) return;
    
    const indicator = this.typingIndicators.get(userId);
    if (indicator) {
      indicator.isTyping = false;
      this.typingIndicators.set(userId, indicator);
      this.emit('typing_stop', indicator);
    }
  }

  private handleUserJoin(wsMessage: WebSocketMessage): void {
    const user: ChatUser = wsMessage.data;
    this.users.set(user.id, user);
    this.emit('user_joined', user);
  }

  private handleUserLeave(wsMessage: WebSocketMessage): void {
    const { userId } = wsMessage.data;
    const user = this.users.get(userId);
    
    if (user) {
      this.users.delete(userId);
      this.typingIndicators.delete(userId);
      this.emit('user_left', user);
    }
  }

  private handleRoomState(roomState: any): void {
    this.currentRoom = roomState.room;
    
    // Update users
    roomState.users.forEach((user: ChatUser) => {
      this.users.set(user.id, user);
    });
    
    // Load recent messages
    if (roomState.messages) {
      roomState.messages.forEach((message: ChatMessage) => {
        this.addMessageToCache(message);
      });
    }
    
    this.emit('room_joined', { room: this.currentRoom, users: roomState.users });
  }

  private handleDisconnected(): void {
    this.currentRoom = null;
    this.users.clear();
    this.typingIndicators.clear();
    this.emit('disconnected');
  }

  private addMessageToCache(message: ChatMessage): void {
    // Add to room messages
    if (!this.messages.has(message.roomId)) {
      this.messages.set(message.roomId, []);
    }
    
    const roomMessages = this.messages.get(message.roomId)!;
    roomMessages.push(message);
    
    // Keep only last 1000 messages per room
    if (roomMessages.length > 1000) {
      roomMessages.shift();
    }
    
    // Add to message cache
    this.messageCache.set(message.id, message);
  }

  private validateMessage(content: string): string {
    if (!content.trim()) {
      throw new Error('Message cannot be empty');
    }
    
    if (!this.currentRoom) {
      throw new Error('No active room');
    }
    
    if (content.length > this.currentRoom.settings.maxMessageLength) {
      throw new Error(`Message too long (max ${this.currentRoom.settings.maxMessageLength} characters)`);
    }
    
    // Check for banned words
    const lowerContent = content.toLowerCase();
    const bannedWords = this.currentRoom.settings.bannedWords || [];
    
    for (const word of bannedWords) {
      if (lowerContent.includes(word.toLowerCase())) {
        throw new Error('Message contains inappropriate content');
      }
    }
    
    return content.trim();
  }

  private checkRateLimit(userId: string): boolean {
    if (!this.currentRoom) return false;
    
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const limit = this.currentRoom.settings.rateLimitPerMinute || 60;
    
    if (!this.rateLimiter.has(userId)) {
      this.rateLimiter.set(userId, []);
    }
    
    const timestamps = this.rateLimiter.get(userId)!;
    
    // Remove old timestamps
    const cutoff = now - windowMs;
    const filtered = timestamps.filter(t => t > cutoff);
    
    if (filtered.length >= limit) {
      return false;
    }
    
    filtered.push(now);
    this.rateLimiter.set(userId, filtered);
    
    return true;
  }

  private async handleCommand(content: string): Promise<void> {
    const parts = content.slice(1).split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    const chatCommand = this.chatCommands.get(command);
    if (!chatCommand) {
      throw new Error(`Unknown command: /${command}`);
    }
    
    // Check permissions
    if (!this.hasPermission(chatCommand.permissions)) {
      throw new Error('You do not have permission to use this command');
    }
    
    // Execute command
    const context: ChatCommandContext = {
      message: {
        id: this.generateMessageId(),
        userId: this.currentUser!.id,
        username: this.currentUser!.username,
        message: content,
        timestamp: new Date().toISOString(),
        type: 'command',
        roomId: this.currentRoom!.id,
        reactions: [],
      },
      room: this.currentRoom!,
      user: this.currentUser!,
      args,
      reply: async (message: string) => {
        await this.sendMessage(message, 'system');
      },
      delete: async () => {
        // Implementation for message deletion
      },
      timeout: async (duration: number) => {
        // Implementation for user timeout
      },
      ban: async (reason?: string) => {
        // Implementation for user ban
      },
    };
    
    await chatCommand.handler(args, context);
  }

  private hasPermission(permissions: string[]): boolean {
    if (!this.currentUser) return false;
    
    if (permissions.includes('moderator') && !this.currentUser.isModerator) {
      return false;
    }
    
    if (permissions.includes('subscriber') && !this.currentUser.isSubscriber) {
      return false;
    }
    
    if (permissions.includes('vip') && !this.currentUser.isVIP) {
      return false;
    }
    
    return true;
  }

  private initializeCommands(): void {
    // Basic commands
    this.chatCommands.set('help', {
      command: 'help',
      description: 'Show available commands',
      usage: '/help [command]',
      permissions: [],
      handler: async (args, context) => {
        const commands = Array.from(this.chatCommands.values())
          .filter(cmd => this.hasPermission(cmd.permissions))
          .map(cmd => `/${cmd.command} - ${cmd.description}`)
          .join('\n');
        
        await context.reply(`Available commands:\n${commands}`);
      },
    });
    
    // Moderation commands
    this.chatCommands.set('clear', {
      command: 'clear',
      description: 'Clear chat messages',
      usage: '/clear [count]',
      permissions: ['moderator'],
      handler: async (args, context) => {
        const count = parseInt(args[0]) || 50;
        await webSocketService.sendMessage('clear_chat', { count });
        await context.reply(`Cleared ${count} messages`);
      },
    });
    
    this.chatCommands.set('timeout', {
      command: 'timeout',
      description: 'Timeout a user',
      usage: '/timeout <username> [duration] [reason]',
      permissions: ['moderator'],
      handler: async (args, context) => {
        const username = args[0];
        const duration = parseInt(args[1]) || 600; // 10 minutes default
        const reason = args.slice(2).join(' ') || 'No reason provided';
        
        await webSocketService.sendMessage('timeout_user', { username, duration, reason });
        await context.reply(`${username} has been timed out for ${duration} seconds`);
      },
    });
  }

  private async loadEmotes(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem('chat_emotes');
      if (cached) {
        const emotes: ChatEmote[] = JSON.parse(cached);
        emotes.forEach(emote => this.emotes.set(emote.name, emote));
      }
    } catch (error) {
      logError('Failed to load emotes', error);
    }
  }

  private async loadCachedData(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem('chat_data');
      if (cached) {
        const data = JSON.parse(cached);
        // Restore cached messages, users, etc.
        logDebug('Loaded cached chat data');
      }
    } catch (error) {
      logError('Failed to load cached chat data', error);
    }
  }

  private extractEmotes(message: string): string[] {
    const emotePattern = /:[a-zA-Z0-9_]+:/g;
    const matches = message.match(emotePattern);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  }

  private getMessagesByHour(messages: ChatMessage[]): Array<{ hour: number; count: number }> {
    const hourCounts = new Map<number, number>();
    
    messages.forEach(msg => {
      const hour = new Date(msg.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    
    const result = [];
    for (let hour = 0; hour < 24; hour++) {
      result.push({ hour, count: hourCounts.get(hour) || 0 });
    }
    
    return result;
  }

  private calculateUserRetention(users: ChatUser[]): number {
    if (users.length === 0) return 0;
    
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const activeUsers = users.filter(user => 
      new Date(user.lastSeen) > dayAgo
    ).length;
    
    return (activeUsers / users.length) * 100;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const realtimeChatService = new RealtimeChatService();

// Helper functions
export const initializeChat = async (user: ChatUser) => {
  return realtimeChatService.initialize(user);
};

export const joinChatRoom = async (roomId: string) => {
  return realtimeChatService.joinRoom(roomId);
};

export const sendChatMessage = async (message: string, type?: ChatMessageType) => {
  return realtimeChatService.sendMessage(message, type);
};

export const reactToMessage = async (messageId: string, emoji: string) => {
  return realtimeChatService.reactToMessage(messageId, emoji);
};

export const startTyping = async () => {
  return realtimeChatService.startTyping();
};

export const stopTyping = async () => {
  return realtimeChatService.stopTyping();
};