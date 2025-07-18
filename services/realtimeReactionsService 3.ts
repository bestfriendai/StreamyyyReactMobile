import { EventEmitter } from 'eventemitter3';
import { webSocketService, WebSocketMessage } from './webSocketService';
import { logError, logDebug, withErrorHandling } from '@/utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ReactionData {
  id: string;
  userId: string;
  username: string;
  type: ReactionType;
  emoji: string;
  position: Position;
  timestamp: string;
  roomId: string;
  streamId: string;
  targetId?: string;
  targetType?: 'stream' | 'message' | 'moment';
  metadata?: Record<string, any>;
  duration?: number;
  animation?: AnimationType;
  intensity?: number;
  color?: string;
  isCustom?: boolean;
}

export type ReactionType = 
  | 'emoji'
  | 'heart'
  | 'like'
  | 'love'
  | 'laugh'
  | 'wow'
  | 'sad'
  | 'angry'
  | 'fire'
  | 'clap'
  | 'wave'
  | 'thumbs_up'
  | 'thumbs_down'
  | 'custom';

export type AnimationType = 
  | 'float'
  | 'bounce'
  | 'pulse'
  | 'shake'
  | 'spin'
  | 'zoom'
  | 'fade'
  | 'slide'
  | 'burst'
  | 'rain';

export interface Position {
  x: number;
  y: number;
  z?: number;
}

export interface InteractiveElement {
  id: string;
  type: InteractiveType;
  title: string;
  description?: string;
  position: Position;
  size: Size;
  timestamp: string;
  createdBy: string;
  isActive: boolean;
  expiresAt?: string;
  roomId: string;
  streamId: string;
  data: any;
  interactions: ElementInteraction[];
  settings: InteractiveSettings;
}

export type InteractiveType = 
  | 'reaction_zone'
  | 'poll'
  | 'quiz'
  | 'countdown'
  | 'donation_goal'
  | 'word_cloud'
  | 'shout_out'
  | 'celebration'
  | 'mini_game'
  | 'trivia'
  | 'vote'
  | 'survey';

export interface Size {
  width: number;
  height: number;
}

export interface ElementInteraction {
  id: string;
  userId: string;
  username: string;
  type: string;
  data: any;
  timestamp: string;
}

export interface InteractiveSettings {
  allowAnonymous: boolean;
  requireSubscription: boolean;
  maxInteractions: number;
  cooldownMs: number;
  autoExpire: boolean;
  showResults: boolean;
  enableAnimations: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface ReactionBurst {
  id: string;
  centerPosition: Position;
  reactions: ReactionData[];
  intensity: number;
  duration: number;
  timestamp: string;
  roomId: string;
  streamId: string;
}

export interface ReactionStats {
  totalReactions: number;
  reactionsPerMinute: number;
  topReactions: Array<{ emoji: string; count: number; percentage: number }>;
  reactionsByUser: Array<{ userId: string; username: string; count: number }>;
  reactionHeatmap: Array<{ x: number; y: number; intensity: number }>;
  peakReactionTime: string;
  averageReactionIntensity: number;
  uniqueReactors: number;
  reactionTrends: Array<{ time: string; count: number }>;
}

export interface ReactionConfig {
  maxReactionsPerSecond: number;
  maxConcurrentReactions: number;
  reactionLifetime: number;
  animationDuration: number;
  burstThreshold: number;
  heatmapResolution: number;
  cooldownPeriod: number;
  enableBatching: boolean;
  batchSize: number;
  batchInterval: number;
}

export interface CustomReaction {
  id: string;
  name: string;
  emoji: string;
  image?: string;
  animation?: string;
  sound?: string;
  category: string;
  isUnlocked: boolean;
  unlockCriteria?: string;
  cost?: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  createdBy?: string;
  createdAt: string;
  usageCount: number;
  tags: string[];
}

export interface ReactionEffect {
  id: string;
  name: string;
  type: 'particle' | 'shader' | 'animation' | 'sound' | 'haptic';
  config: any;
  duration: number;
  intensity: number;
  isEnabled: boolean;
}

class RealtimeReactionsService extends EventEmitter {
  private activeReactions: Map<string, ReactionData> = new Map();
  private interactiveElements: Map<string, InteractiveElement> = new Map();
  private reactionBursts: Map<string, ReactionBurst> = new Map();
  private customReactions: Map<string, CustomReaction> = new Map();
  private reactionEffects: Map<string, ReactionEffect> = new Map();
  private reactionStats: ReactionStats | null = null;
  private config: ReactionConfig;
  private currentRoomId: string | null = null;
  private currentStreamId: string | null = null;
  private currentUserId: string | null = null;
  private reactionQueue: ReactionData[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private rateLimiter: Map<string, number[]> = new Map();
  private isInitialized: boolean = false;

  private readonly defaultConfig: ReactionConfig = {
    maxReactionsPerSecond: 50,
    maxConcurrentReactions: 200,
    reactionLifetime: 5000,
    animationDuration: 2000,
    burstThreshold: 10,
    heatmapResolution: 20,
    cooldownPeriod: 100,
    enableBatching: true,
    batchSize: 10,
    batchInterval: 100,
  };

  constructor(config?: Partial<ReactionConfig>) {
    super();
    this.config = { ...this.defaultConfig, ...config };
    this.setupEventHandlers();
    this.loadCustomReactions();
  }

  /**
   * Initialize reactions service
   */
  async initialize(userId: string, roomId: string, streamId: string): Promise<void> {
    return withErrorHandling(async () => {
      logDebug('Initializing realtime reactions service', { userId, roomId, streamId });
      
      this.currentUserId = userId;
      this.currentRoomId = roomId;
      this.currentStreamId = streamId;
      
      // Initialize reaction stats
      this.reactionStats = {
        totalReactions: 0,
        reactionsPerMinute: 0,
        topReactions: [],
        reactionsByUser: [],
        reactionHeatmap: [],
        peakReactionTime: '',
        averageReactionIntensity: 0,
        uniqueReactors: 0,
        reactionTrends: [],
      };
      
      // Start cleanup timer
      this.startCleanupTimer();
      
      // Start batch processing if enabled
      if (this.config.enableBatching) {
        this.startBatchProcessing();
      }
      
      this.isInitialized = true;
      this.emit('initialized', { userId, roomId, streamId });
    }, { component: 'RealtimeReactionsService', action: 'initialize' });
  }

  /**
   * Send a reaction
   */
  async sendReaction(
    type: ReactionType,
    emoji: string,
    position: Position,
    options?: {
      intensity?: number;
      animation?: AnimationType;
      color?: string;
      duration?: number;
      targetId?: string;
      targetType?: 'stream' | 'message' | 'moment';
    }
  ): Promise<void> {
    return withErrorHandling(async () => {
      if (!this.isInitialized || !this.currentUserId || !this.currentRoomId || !this.currentStreamId) {
        throw new Error('Service not initialized');
      }

      // Check rate limiting
      if (!this.checkRateLimit(this.currentUserId)) {
        throw new Error('Rate limit exceeded');
      }

      const reaction: ReactionData = {
        id: this.generateReactionId(),
        userId: this.currentUserId,
        username: '', // Will be filled by server
        type,
        emoji,
        position,
        timestamp: new Date().toISOString(),
        roomId: this.currentRoomId,
        streamId: this.currentStreamId,
        targetId: options?.targetId,
        targetType: options?.targetType || 'stream',
        duration: options?.duration || this.config.animationDuration,
        animation: options?.animation || 'float',
        intensity: options?.intensity || 1,
        color: options?.color,
        isCustom: this.customReactions.has(emoji),
      };

      // Add to queue for batching or send immediately
      if (this.config.enableBatching) {
        this.reactionQueue.push(reaction);
      } else {
        await this.sendReactionMessage(reaction);
      }
      
      // Add to local active reactions
      this.activeReactions.set(reaction.id, reaction);
      
      // Update stats
      this.updateStats(reaction);
      
      // Check for burst
      this.checkForBurst(reaction);
      
      this.emit('reaction_sent', reaction);
    }, { component: 'RealtimeReactionsService', action: 'sendReaction' });
  }

  /**
   * Send multiple reactions at once
   */
  async sendReactionBurst(
    reactions: Array<{
      type: ReactionType;
      emoji: string;
      position: Position;
      intensity?: number;
    }>,
    centerPosition: Position
  ): Promise<void> {
    if (!this.isInitialized) return;

    const burstId = this.generateBurstId();
    const timestamp = new Date().toISOString();
    const reactionData: ReactionData[] = [];

    for (const r of reactions) {
      const reaction: ReactionData = {
        id: this.generateReactionId(),
        userId: this.currentUserId!,
        username: '',
        type: r.type,
        emoji: r.emoji,
        position: r.position,
        timestamp,
        roomId: this.currentRoomId!,
        streamId: this.currentStreamId!,
        targetType: 'stream',
        duration: this.config.animationDuration,
        animation: 'burst',
        intensity: r.intensity || 1,
        metadata: { burstId },
      };
      
      reactionData.push(reaction);
      this.activeReactions.set(reaction.id, reaction);
    }

    const burst: ReactionBurst = {
      id: burstId,
      centerPosition,
      reactions: reactionData,
      intensity: reactions.length,
      duration: this.config.animationDuration * 1.5,
      timestamp,
      roomId: this.currentRoomId!,
      streamId: this.currentStreamId!,
    };

    this.reactionBursts.set(burstId, burst);

    await webSocketService.sendMessage('reaction_burst', {
      burst,
      reactions: reactionData,
    });

    this.emit('reaction_burst_sent', burst);
  }

  /**
   * Create interactive element
   */
  async createInteractiveElement(
    type: InteractiveType,
    title: string,
    position: Position,
    size: Size,
    data: any,
    options?: {
      description?: string;
      expiresAt?: string;
      settings?: Partial<InteractiveSettings>;
    }
  ): Promise<InteractiveElement> {
    if (!this.isInitialized || !this.currentUserId || !this.currentRoomId) {
      throw new Error('Service not initialized');
    }

    const element: InteractiveElement = {
      id: this.generateElementId(),
      type,
      title,
      description: options?.description,
      position,
      size,
      timestamp: new Date().toISOString(),
      createdBy: this.currentUserId,
      isActive: true,
      expiresAt: options?.expiresAt,
      roomId: this.currentRoomId,
      streamId: this.currentStreamId!,
      data,
      interactions: [],
      settings: {
        allowAnonymous: true,
        requireSubscription: false,
        maxInteractions: 1000,
        cooldownMs: 0,
        autoExpire: false,
        showResults: true,
        enableAnimations: true,
        soundEnabled: true,
        vibrationEnabled: true,
        ...options?.settings,
      },
    };

    this.interactiveElements.set(element.id, element);

    await webSocketService.sendMessage('interactive_element_create', element);

    this.emit('interactive_element_created', element);
    return element;
  }

  /**
   * Interact with element
   */
  async interactWithElement(
    elementId: string,
    interactionType: string,
    data: any
  ): Promise<void> {
    const element = this.interactiveElements.get(elementId);
    if (!element || !element.isActive) {
      throw new Error('Element not found or inactive');
    }

    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    // Check cooldown
    const lastInteraction = element.interactions
      .filter(i => i.userId === this.currentUserId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    if (lastInteraction && element.settings.cooldownMs > 0) {
      const timeSinceLastInteraction = Date.now() - new Date(lastInteraction.timestamp).getTime();
      if (timeSinceLastInteraction < element.settings.cooldownMs) {
        throw new Error('Interaction cooldown active');
      }
    }

    const interaction: ElementInteraction = {
      id: this.generateInteractionId(),
      userId: this.currentUserId,
      username: '', // Will be filled by server
      type: interactionType,
      data,
      timestamp: new Date().toISOString(),
    };

    element.interactions.push(interaction);

    await webSocketService.sendMessage('interactive_element_interact', {
      elementId,
      interaction,
    });

    this.emit('element_interaction_sent', { elementId, interaction });
  }

  /**
   * Get active reactions in area
   */
  getActiveReactionsInArea(
    topLeft: Position,
    bottomRight: Position
  ): ReactionData[] {
    return Array.from(this.activeReactions.values()).filter(reaction => {
      const { x, y } = reaction.position;
      return x >= topLeft.x && x <= bottomRight.x && y >= topLeft.y && y <= bottomRight.y;
    });
  }

  /**
   * Get interactive elements
   */
  getInteractiveElements(): InteractiveElement[] {
    return Array.from(this.interactiveElements.values()).filter(el => el.isActive);
  }

  /**
   * Get reaction statistics
   */
  getReactionStats(): ReactionStats | null {
    return this.reactionStats;
  }

  /**
   * Get reaction heatmap
   */
  generateReactionHeatmap(): Array<{ x: number; y: number; intensity: number }> {
    if (!this.reactionStats) return [];

    const heatmap = new Map<string, number>();
    const resolution = this.config.heatmapResolution;

    Array.from(this.activeReactions.values()).forEach(reaction => {
      const gridX = Math.floor(reaction.position.x / resolution) * resolution;
      const gridY = Math.floor(reaction.position.y / resolution) * resolution;
      const key = `${gridX},${gridY}`;
      
      heatmap.set(key, (heatmap.get(key) || 0) + (reaction.intensity || 1));
    });

    return Array.from(heatmap.entries()).map(([key, intensity]) => {
      const [x, y] = key.split(',').map(Number);
      return { x, y, intensity };
    });
  }

  /**
   * Create custom reaction
   */
  async createCustomReaction(
    name: string,
    emoji: string,
    options?: {
      image?: string;
      animation?: string;
      sound?: string;
      category?: string;
      cost?: number;
      rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    }
  ): Promise<CustomReaction> {
    const customReaction: CustomReaction = {
      id: this.generateCustomReactionId(),
      name,
      emoji,
      image: options?.image,
      animation: options?.animation,
      sound: options?.sound,
      category: options?.category || 'user',
      isUnlocked: true,
      cost: options?.cost || 0,
      rarity: options?.rarity || 'common',
      createdBy: this.currentUserId,
      createdAt: new Date().toISOString(),
      usageCount: 0,
      tags: [],
    };

    this.customReactions.set(customReaction.id, customReaction);
    await this.saveCustomReactions();

    this.emit('custom_reaction_created', customReaction);
    return customReaction;
  }

  /**
   * Get custom reactions
   */
  getCustomReactions(): CustomReaction[] {
    return Array.from(this.customReactions.values());
  }

  /**
   * Clear all reactions
   */
  clearReactions(): void {
    this.activeReactions.clear();
    this.reactionBursts.clear();
    this.emit('reactions_cleared');
  }

  /**
   * Dispose service
   */
  dispose(): void {
    this.stopCleanupTimer();
    this.stopBatchProcessing();
    this.clearReactions();
    this.interactiveElements.clear();
    this.customReactions.clear();
    this.reactionEffects.clear();
    this.isInitialized = false;
    this.emit('disposed');
  }

  // Private methods

  private setupEventHandlers(): void {
    webSocketService.on('message:reaction', this.handleReactionReceived.bind(this));
    webSocketService.on('message:reaction_burst', this.handleReactionBurst.bind(this));
    webSocketService.on('message:interactive_element_create', this.handleInteractiveElementCreate.bind(this));
    webSocketService.on('message:interactive_element_interact', this.handleInteractiveElementInteract.bind(this));
    webSocketService.on('message:interactive_element_update', this.handleInteractiveElementUpdate.bind(this));
    webSocketService.on('message:reaction_stats', this.handleReactionStats.bind(this));
    webSocketService.on('disconnected', this.handleDisconnected.bind(this));
  }

  private handleReactionReceived(wsMessage: WebSocketMessage): void {
    const reaction: ReactionData = wsMessage.data;
    
    this.activeReactions.set(reaction.id, reaction);
    this.updateStats(reaction);
    
    this.emit('reaction_received', reaction);
  }

  private handleReactionBurst(wsMessage: WebSocketMessage): void {
    const { burst, reactions } = wsMessage.data;
    
    this.reactionBursts.set(burst.id, burst);
    
    reactions.forEach((reaction: ReactionData) => {
      this.activeReactions.set(reaction.id, reaction);
      this.updateStats(reaction);
    });
    
    this.emit('reaction_burst_received', { burst, reactions });
  }

  private handleInteractiveElementCreate(wsMessage: WebSocketMessage): void {
    const element: InteractiveElement = wsMessage.data;
    this.interactiveElements.set(element.id, element);
    this.emit('interactive_element_received', element);
  }

  private handleInteractiveElementInteract(wsMessage: WebSocketMessage): void {
    const { elementId, interaction } = wsMessage.data;
    const element = this.interactiveElements.get(elementId);
    
    if (element) {
      element.interactions.push(interaction);
      this.emit('element_interaction_received', { elementId, interaction });
    }
  }

  private handleInteractiveElementUpdate(wsMessage: WebSocketMessage): void {
    const element: InteractiveElement = wsMessage.data;
    this.interactiveElements.set(element.id, element);
    this.emit('interactive_element_updated', element);
  }

  private handleReactionStats(wsMessage: WebSocketMessage): void {
    this.reactionStats = wsMessage.data;
    this.emit('reaction_stats_updated', this.reactionStats);
  }

  private handleDisconnected(): void {
    this.emit('disconnected');
  }

  private async sendReactionMessage(reaction: ReactionData): Promise<void> {
    await webSocketService.sendMessage('reaction', reaction);
  }

  private startBatchProcessing(): void {
    this.batchTimer = setInterval(() => {
      if (this.reactionQueue.length > 0) {
        this.processBatch();
      }
    }, this.config.batchInterval);
  }

  private stopBatchProcessing(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
  }

  private processBatch(): void {
    if (this.reactionQueue.length === 0) return;

    const batch = this.reactionQueue.splice(0, this.config.batchSize);
    
    webSocketService.sendMessage('reaction_batch', {
      reactions: batch,
      timestamp: new Date().toISOString(),
    });

    this.emit('reaction_batch_sent', batch);
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredReactions();
      this.cleanupExpiredElements();
    }, 1000);
  }

  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private cleanupExpiredReactions(): void {
    const now = Date.now();
    const expired: string[] = [];

    this.activeReactions.forEach((reaction, id) => {
      const age = now - new Date(reaction.timestamp).getTime();
      if (age > this.config.reactionLifetime) {
        expired.push(id);
      }
    });

    expired.forEach(id => {
      this.activeReactions.delete(id);
    });

    if (expired.length > 0) {
      this.emit('reactions_expired', expired);
    }
  }

  private cleanupExpiredElements(): void {
    const now = new Date().toISOString();
    const expired: string[] = [];

    this.interactiveElements.forEach((element, id) => {
      if (element.expiresAt && element.expiresAt < now) {
        element.isActive = false;
        expired.push(id);
      }
    });

    if (expired.length > 0) {
      this.emit('interactive_elements_expired', expired);
    }
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const windowMs = 1000; // 1 second
    const limit = this.config.maxReactionsPerSecond;

    if (!this.rateLimiter.has(userId)) {
      this.rateLimiter.set(userId, []);
    }

    const timestamps = this.rateLimiter.get(userId)!;
    const cutoff = now - windowMs;
    const filtered = timestamps.filter(t => t > cutoff);

    if (filtered.length >= limit) {
      return false;
    }

    filtered.push(now);
    this.rateLimiter.set(userId, filtered);

    return true;
  }

  private updateStats(reaction: ReactionData): void {
    if (!this.reactionStats) return;

    this.reactionStats.totalReactions++;
    this.reactionStats.uniqueReactors = new Set(
      Array.from(this.activeReactions.values()).map(r => r.userId)
    ).size;

    // Update top reactions
    const emojiCount = new Map<string, number>();
    Array.from(this.activeReactions.values()).forEach(r => {
      emojiCount.set(r.emoji, (emojiCount.get(r.emoji) || 0) + 1);
    });

    this.reactionStats.topReactions = Array.from(emojiCount.entries())
      .map(([emoji, count]) => ({
        emoji,
        count,
        percentage: (count / this.reactionStats!.totalReactions) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Update heatmap
    this.reactionStats.reactionHeatmap = this.generateReactionHeatmap();

    this.emit('reaction_stats_changed', this.reactionStats);
  }

  private checkForBurst(reaction: ReactionData): void {
    const now = Date.now();
    const burstWindow = 2000; // 2 seconds
    const recentReactions = Array.from(this.activeReactions.values())
      .filter(r => {
        const age = now - new Date(r.timestamp).getTime();
        return age < burstWindow;
      });

    if (recentReactions.length >= this.config.burstThreshold) {
      const centerPosition = this.calculateCenterPosition(recentReactions);
      this.emit('reaction_burst_detected', {
        reactions: recentReactions,
        centerPosition,
        intensity: recentReactions.length
      });
    }
  }

  private calculateCenterPosition(reactions: ReactionData[]): Position {
    const totalX = reactions.reduce((sum, r) => sum + r.position.x, 0);
    const totalY = reactions.reduce((sum, r) => sum + r.position.y, 0);
    
    return {
      x: totalX / reactions.length,
      y: totalY / reactions.length
    };
  }

  private async loadCustomReactions(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('custom_reactions');
      if (stored) {
        const reactions: CustomReaction[] = JSON.parse(stored);
        reactions.forEach(reaction => {
          this.customReactions.set(reaction.id, reaction);
        });
      }
    } catch (error) {
      logError('Failed to load custom reactions', error);
    }
  }

  private async saveCustomReactions(): Promise<void> {
    try {
      const reactions = Array.from(this.customReactions.values());
      await AsyncStorage.setItem('custom_reactions', JSON.stringify(reactions));
    } catch (error) {
      logError('Failed to save custom reactions', error);
    }
  }

  private generateReactionId(): string {
    return `reaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBurstId(): string {
    return `burst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateElementId(): string {
    return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateInteractionId(): string {
    return `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCustomReactionId(): string {
    return `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const realtimeReactionsService = new RealtimeReactionsService();

// Helper functions
export const initializeReactions = async (userId: string, roomId: string, streamId: string) => {
  return realtimeReactionsService.initialize(userId, roomId, streamId);
};

export const sendReaction = async (
  type: ReactionType,
  emoji: string,
  position: Position,
  options?: any
) => {
  return realtimeReactionsService.sendReaction(type, emoji, position, options);
};

export const createInteractiveElement = async (
  type: InteractiveType,
  title: string,
  position: Position,
  size: Size,
  data: any,
  options?: any
) => {
  return realtimeReactionsService.createInteractiveElement(type, title, position, size, data, options);
};

export const interactWithElement = async (elementId: string, type: string, data: any) => {
  return realtimeReactionsService.interactWithElement(elementId, type, data);
};