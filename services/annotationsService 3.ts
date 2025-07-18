import { EventEmitter } from 'eventemitter3';
import { webSocketService, WebSocketMessage } from './webSocketService';
import { logError, logDebug, withErrorHandling } from '@/utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StreamAnnotation {
  id: string;
  streamId: string;
  userId: string;
  username: string;
  displayName: string;
  type: AnnotationType;
  content: string;
  timestamp: number; // Video timestamp in seconds
  duration?: number; // Duration in seconds for timed annotations
  position: AnnotationPosition;
  style: AnnotationStyle;
  metadata: AnnotationMetadata;
  interactions: AnnotationInteraction[];
  visibility: AnnotationVisibility;
  permissions: AnnotationPermissions;
  status: AnnotationStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export type AnnotationType = 
  | 'text_comment'
  | 'highlight'
  | 'marker'
  | 'timestamp'
  | 'question'
  | 'explanation'
  | 'warning'
  | 'spoiler'
  | 'bookmark'
  | 'reaction_zone'
  | 'poll_trigger'
  | 'chapter_marker'
  | 'advertisement'
  | 'easter_egg'
  | 'trivia'
  | 'behind_scenes'
  | 'technical_note'
  | 'custom';

export interface AnnotationPosition {
  x: number; // X coordinate (0-100% of video width)
  y: number; // Y coordinate (0-100% of video height)
  anchor: AnchorType;
  offset?: { x: number; y: number };
  relativeTo?: 'video' | 'player' | 'screen';
}

export type AnchorType = 
  | 'top_left'
  | 'top_center'
  | 'top_right'
  | 'center_left'
  | 'center'
  | 'center_right'
  | 'bottom_left'
  | 'bottom_center'
  | 'bottom_right'
  | 'custom';

export interface AnnotationStyle {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  padding?: number;
  margin?: number;
  shadow?: ShadowStyle;
  animation?: AnimationStyle;
  icon?: string;
  emoji?: string;
  customCSS?: Record<string, any>;
}

export interface ShadowStyle {
  color: string;
  offset: { x: number; y: number };
  blur: number;
  spread: number;
}

export interface AnimationStyle {
  type: 'none' | 'fade' | 'slide' | 'bounce' | 'pulse' | 'glow' | 'shake';
  duration: number;
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  repeat?: boolean;
  delay?: number;
}

export interface AnnotationMetadata {
  category?: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  confidence?: number; // 0-1 for AI-generated annotations
  source: 'user' | 'ai' | 'moderator' | 'system' | 'import';
  language?: string;
  isEdited?: boolean;
  editHistory?: AnnotationEdit[];
  linkedAnnotations?: string[];
  attachments?: AnnotationAttachment[];
  references?: AnnotationReference[];
  context?: string;
  accuracy?: number;
  relevance?: number;
}

export interface AnnotationEdit {
  id: string;
  editedBy: string;
  editedAt: string;
  previousContent: string;
  reason?: string;
  changes: string[];
}

export interface AnnotationAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'link' | 'code';
  url: string;
  filename?: string;
  size?: number;
  mimeType?: string;
  description?: string;
  thumbnail?: string;
}

export interface AnnotationReference {
  id: string;
  type: 'timestamp' | 'url' | 'annotation' | 'user' | 'stream' | 'topic';
  value: string;
  label?: string;
  description?: string;
}

export interface AnnotationInteraction {
  id: string;
  userId: string;
  username: string;
  type: InteractionType;
  data: any;
  timestamp: string;
  isPublic: boolean;
}

export type InteractionType = 
  | 'like'
  | 'dislike'
  | 'agree'
  | 'disagree'
  | 'helpful'
  | 'report'
  | 'bookmark'
  | 'share'
  | 'reply'
  | 'edit'
  | 'delete'
  | 'moderate'
  | 'verify'
  | 'feature'
  | 'pin';

export interface AnnotationVisibility {
  isPublic: boolean;
  targetAudience: AudienceType[];
  restrictedUsers?: string[];
  allowedUsers?: string[];
  requiresPermission: boolean;
  showToModerators: boolean;
  showToSubscribers: boolean;
  hideFromAuthor: boolean;
  temporaryHide?: {
    until: string;
    reason: string;
  };
}

export type AudienceType = 'everyone' | 'subscribers' | 'followers' | 'friends' | 'moderators' | 'vips' | 'custom';

export interface AnnotationPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canInteract: boolean;
  canReply: boolean;
  canModerate: boolean;
  canFeature: boolean;
  canPin: boolean;
  editableBy: string[];
  moderatableBy: string[];
}

export type AnnotationStatus = 'active' | 'hidden' | 'moderated' | 'reported' | 'deleted' | 'pending' | 'featured';

export interface AnnotationThread {
  id: string;
  parentAnnotationId: string;
  replies: StreamAnnotation[];
  totalReplies: number;
  isCollapsed: boolean;
  lastActivity: string;
  participants: string[];
  moderationStatus: 'clean' | 'flagged' | 'locked';
}

export interface AnnotationFilter {
  types?: AnnotationType[];
  users?: string[];
  timeRange?: {
    start: number;
    end: number;
  };
  tags?: string[];
  categories?: string[];
  minInteractions?: number;
  status?: AnnotationStatus[];
  priority?: ('low' | 'medium' | 'high' | 'urgent')[];
  hasAttachments?: boolean;
  language?: string;
  source?: ('user' | 'ai' | 'moderator' | 'system' | 'import')[];
}

export interface AnnotationLayer {
  id: string;
  name: string;
  description?: string;
  isVisible: boolean;
  opacity: number;
  zIndex: number;
  annotations: string[];
  filters: AnnotationFilter;
  style: LayerStyle;
  permissions: LayerPermissions;
  createdBy: string;
  createdAt: string;
  isDefault: boolean;
}

export interface LayerStyle {
  theme: 'light' | 'dark' | 'auto' | 'custom';
  customColors?: Record<string, string>;
  defaultOpacity: number;
  animationsEnabled: boolean;
  clustering: boolean;
  maxAnnotationsPerCluster: number;
}

export interface LayerPermissions {
  canView: string[];
  canEdit: string[];
  canManage: string[];
  isPublic: boolean;
  requiresSubscription: boolean;
}

export interface AnnotationAnalytics {
  totalAnnotations: number;
  annotationsByType: Record<AnnotationType, number>;
  annotationsByUser: Array<{ userId: string; count: number }>;
  interactionsByType: Record<InteractionType, number>;
  engagementRate: number;
  averageInteractionsPerAnnotation: number;
  hotspots: Array<{ timestamp: number; count: number; engagement: number }>;
  topContributors: Array<{ userId: string; username: string; score: number }>;
  qualityMetrics: {
    averageAccuracy: number;
    averageRelevance: number;
    reportRate: number;
    verificationRate: number;
  };
  timelineActivity: Array<{ hour: number; count: number }>;
  popularTags: Array<{ tag: string; count: number }>;
  languageDistribution: Array<{ language: string; count: number }>;
}

export interface AnnotationTemplate {
  id: string;
  name: string;
  description: string;
  type: AnnotationType;
  content: string;
  style: AnnotationStyle;
  defaultPosition: AnnotationPosition;
  tags: string[];
  category: string;
  isPublic: boolean;
  usageCount: number;
  rating: number;
  createdBy: string;
  createdAt: string;
}

class AnnotationsService extends EventEmitter {
  private annotations: Map<string, StreamAnnotation> = new Map();
  private annotationThreads: Map<string, AnnotationThread> = new Map();
  private annotationLayers: Map<string, AnnotationLayer> = new Map();
  private annotationTemplates: Map<string, AnnotationTemplate> = new Map();
  private currentStreamId: string | null = null;
  private currentUserId: string | null = null;
  private currentUsername: string | null = null;
  private analytics: AnnotationAnalytics | null = null;
  private activeFilters: AnnotationFilter = {};
  private visibleLayers: Set<string> = new Set();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * Initialize annotations service
   */
  async initialize(streamId: string, userId: string, username: string): Promise<void> {
    return withErrorHandling(async () => {
      logDebug('Initializing annotations service', { streamId, userId, username });
      
      this.currentStreamId = streamId;
      this.currentUserId = userId;
      this.currentUsername = username;
      
      // Load existing annotations for stream
      await this.loadStreamAnnotations();
      
      // Load annotation layers
      await this.loadAnnotationLayers();
      
      // Load annotation templates
      await this.loadAnnotationTemplates();
      
      // Start sync timer
      this.startSyncTimer();
      
      // Start cleanup timer
      this.startCleanupTimer();
      
      this.isInitialized = true;
      this.emit('initialized', { streamId, userId, username });
    }, { component: 'AnnotationsService', action: 'initialize' });
  }

  /**
   * Create a new annotation
   */
  async createAnnotation(
    type: AnnotationType,
    content: string,
    timestamp: number,
    position: AnnotationPosition,
    options?: {
      duration?: number;
      style?: Partial<AnnotationStyle>;
      metadata?: Partial<AnnotationMetadata>;
      visibility?: Partial<AnnotationVisibility>;
      attachments?: AnnotationAttachment[];
      references?: AnnotationReference[];
    }
  ): Promise<StreamAnnotation> {
    return withErrorHandling(async () => {
      if (!this.isInitialized || !this.currentStreamId || !this.currentUserId || !this.currentUsername) {
        throw new Error('Service not initialized');
      }

      const annotationId = this.generateId();
      const now = new Date().toISOString();

      const annotation: StreamAnnotation = {
        id: annotationId,
        streamId: this.currentStreamId,
        userId: this.currentUserId,
        username: this.currentUsername,
        displayName: this.currentUsername,
        type,
        content,
        timestamp,
        duration: options?.duration,
        position,
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          textColor: '#ffffff',
          borderRadius: 8,
          opacity: 0.9,
          fontSize: 14,
          fontWeight: 'normal',
          padding: 8,
          animation: {
            type: 'fade',
            duration: 300,
            easing: 'ease-in-out',
          },
          ...options?.style,
        },
        metadata: {
          tags: [],
          priority: 'medium',
          source: 'user',
          isEdited: false,
          editHistory: [],
          linkedAnnotations: [],
          attachments: options?.attachments || [],
          references: options?.references || [],
          ...options?.metadata,
        },
        interactions: [],
        visibility: {
          isPublic: true,
          targetAudience: ['everyone'],
          requiresPermission: false,
          showToModerators: true,
          showToSubscribers: true,
          hideFromAuthor: false,
          ...options?.visibility,
        },
        permissions: {
          canEdit: true,
          canDelete: true,
          canInteract: true,
          canReply: true,
          canModerate: false,
          canFeature: false,
          canPin: false,
          editableBy: [this.currentUserId],
          moderatableBy: [],
        },
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };

      // Send annotation to server
      await webSocketService.sendMessage('annotation_create', annotation);
      
      // Add to local cache
      this.annotations.set(annotationId, annotation);
      
      // Update analytics
      this.updateAnalytics('create', annotation);
      
      this.emit('annotation_created', annotation);
      return annotation;
    }, { component: 'AnnotationsService', action: 'createAnnotation' });
  }

  /**
   * Update existing annotation
   */
  async updateAnnotation(
    annotationId: string,
    updates: {
      content?: string;
      position?: AnnotationPosition;
      style?: Partial<AnnotationStyle>;
      metadata?: Partial<AnnotationMetadata>;
      visibility?: Partial<AnnotationVisibility>;
    }
  ): Promise<void> {
    const annotation = this.annotations.get(annotationId);
    if (!annotation) {
      throw new Error('Annotation not found');
    }

    if (!this.canEdit(annotation)) {
      throw new Error('No permission to edit this annotation');
    }

    // Create edit history entry
    const edit: AnnotationEdit = {
      id: this.generateId(),
      editedBy: this.currentUserId!,
      editedAt: new Date().toISOString(),
      previousContent: annotation.content,
      reason: 'User edit',
      changes: Object.keys(updates),
    };

    // Update annotation
    const updatedAnnotation: StreamAnnotation = {
      ...annotation,
      ...updates,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...annotation.metadata,
        ...updates.metadata,
        isEdited: true,
        editHistory: [...annotation.metadata.editHistory!, edit],
      },
      style: {
        ...annotation.style,
        ...updates.style,
      },
      visibility: {
        ...annotation.visibility,
        ...updates.visibility,
      },
    };

    await webSocketService.sendMessage('annotation_update', {
      annotationId,
      updates: updatedAnnotation,
      editedBy: this.currentUserId,
    });

    this.annotations.set(annotationId, updatedAnnotation);
    this.emit('annotation_updated', { annotationId, annotation: updatedAnnotation });
  }

  /**
   * Delete annotation
   */
  async deleteAnnotation(annotationId: string): Promise<void> {
    const annotation = this.annotations.get(annotationId);
    if (!annotation) {
      throw new Error('Annotation not found');
    }

    if (!this.canDelete(annotation)) {
      throw new Error('No permission to delete this annotation');
    }

    await webSocketService.sendMessage('annotation_delete', {
      annotationId,
      deletedBy: this.currentUserId,
    });

    this.annotations.delete(annotationId);
    this.emit('annotation_deleted', { annotationId });
  }

  /**
   * Add interaction to annotation
   */
  async interactWithAnnotation(
    annotationId: string,
    type: InteractionType,
    data?: any
  ): Promise<void> {
    const annotation = this.annotations.get(annotationId);
    if (!annotation) {
      throw new Error('Annotation not found');
    }

    if (!annotation.permissions.canInteract) {
      throw new Error('No permission to interact with this annotation');
    }

    const interaction: AnnotationInteraction = {
      id: this.generateId(),
      userId: this.currentUserId!,
      username: this.currentUsername!,
      type,
      data,
      timestamp: new Date().toISOString(),
      isPublic: true,
    };

    annotation.interactions.push(interaction);
    annotation.updatedAt = new Date().toISOString();

    await webSocketService.sendMessage('annotation_interact', {
      annotationId,
      interaction,
    });

    this.annotations.set(annotationId, annotation);
    this.emit('annotation_interaction', { annotationId, interaction });
  }

  /**
   * Reply to annotation
   */
  async replyToAnnotation(
    parentAnnotationId: string,
    content: string,
    options?: {
      style?: Partial<AnnotationStyle>;
      metadata?: Partial<AnnotationMetadata>;
    }
  ): Promise<StreamAnnotation> {
    const parentAnnotation = this.annotations.get(parentAnnotationId);
    if (!parentAnnotation) {
      throw new Error('Parent annotation not found');
    }

    if (!parentAnnotation.permissions.canReply) {
      throw new Error('No permission to reply to this annotation');
    }

    // Create reply annotation at same position and timestamp
    const reply = await this.createAnnotation(
      'text_comment',
      content,
      parentAnnotation.timestamp,
      parentAnnotation.position,
      {
        style: {
          ...parentAnnotation.style,
          backgroundColor: 'rgba(139, 92, 246, 0.8)',
          ...options?.style,
        },
        metadata: {
          ...options?.metadata,
          tags: ['reply'],
          linkedAnnotations: [parentAnnotationId],
        },
      }
    );

    // Update or create thread
    let thread = this.annotationThreads.get(parentAnnotationId);
    if (!thread) {
      thread = {
        id: this.generateId(),
        parentAnnotationId,
        replies: [],
        totalReplies: 0,
        isCollapsed: false,
        lastActivity: new Date().toISOString(),
        participants: [parentAnnotation.userId],
        moderationStatus: 'clean',
      };
      this.annotationThreads.set(parentAnnotationId, thread);
    }

    thread.replies.push(reply);
    thread.totalReplies++;
    thread.lastActivity = new Date().toISOString();
    
    if (!thread.participants.includes(this.currentUserId!)) {
      thread.participants.push(this.currentUserId!);
    }

    this.emit('annotation_reply_created', { parentAnnotationId, reply, thread });
    return reply;
  }

  /**
   * Get annotations for timestamp range
   */
  getAnnotationsForTimeRange(startTime: number, endTime: number): StreamAnnotation[] {
    return Array.from(this.annotations.values()).filter(annotation => {
      const annotationEnd = annotation.timestamp + (annotation.duration || 0);
      return (
        annotation.status === 'active' &&
        this.isVisible(annotation) &&
        ((annotation.timestamp >= startTime && annotation.timestamp <= endTime) ||
         (annotationEnd >= startTime && annotationEnd <= endTime) ||
         (annotation.timestamp <= startTime && annotationEnd >= endTime))
      );
    });
  }

  /**
   * Get annotations at specific timestamp
   */
  getAnnotationsAtTimestamp(timestamp: number): StreamAnnotation[] {
    return Array.from(this.annotations.values()).filter(annotation => {
      const annotationEnd = annotation.timestamp + (annotation.duration || 0);
      return (
        annotation.status === 'active' &&
        this.isVisible(annotation) &&
        timestamp >= annotation.timestamp &&
        (annotation.duration === undefined || timestamp <= annotationEnd)
      );
    });
  }

  /**
   * Search annotations
   */
  searchAnnotations(query: string, filters?: AnnotationFilter): StreamAnnotation[] {
    const lowerQuery = query.toLowerCase();
    
    return Array.from(this.annotations.values()).filter(annotation => {
      // Text search
      const matchesQuery = annotation.content.toLowerCase().includes(lowerQuery) ||
                          annotation.username.toLowerCase().includes(lowerQuery) ||
                          annotation.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
      
      if (!matchesQuery) return false;
      
      // Apply filters
      return this.matchesFilters(annotation, filters);
    });
  }

  /**
   * Filter annotations
   */
  filterAnnotations(filters: AnnotationFilter): StreamAnnotation[] {
    this.activeFilters = filters;
    
    return Array.from(this.annotations.values()).filter(annotation => 
      this.matchesFilters(annotation, filters)
    );
  }

  /**
   * Create annotation layer
   */
  async createAnnotationLayer(
    name: string,
    options?: {
      description?: string;
      filters?: AnnotationFilter;
      style?: Partial<LayerStyle>;
      permissions?: Partial<LayerPermissions>;
    }
  ): Promise<AnnotationLayer> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    const layer: AnnotationLayer = {
      id: this.generateId(),
      name,
      description: options?.description,
      isVisible: true,
      opacity: 1,
      zIndex: this.annotationLayers.size,
      annotations: [],
      filters: options?.filters || {},
      style: {
        theme: 'auto',
        defaultOpacity: 0.9,
        animationsEnabled: true,
        clustering: false,
        maxAnnotationsPerCluster: 5,
        ...options?.style,
      },
      permissions: {
        canView: [],
        canEdit: [this.currentUserId],
        canManage: [this.currentUserId],
        isPublic: false,
        requiresSubscription: false,
        ...options?.permissions,
      },
      createdBy: this.currentUserId,
      createdAt: new Date().toISOString(),
      isDefault: false,
    };

    this.annotationLayers.set(layer.id, layer);
    this.visibleLayers.add(layer.id);
    
    this.emit('annotation_layer_created', layer);
    return layer;
  }

  /**
   * Toggle layer visibility
   */
  toggleLayerVisibility(layerId: string): void {
    const layer = this.annotationLayers.get(layerId);
    if (!layer) return;

    layer.isVisible = !layer.isVisible;
    
    if (layer.isVisible) {
      this.visibleLayers.add(layerId);
    } else {
      this.visibleLayers.delete(layerId);
    }
    
    this.emit('annotation_layer_visibility_changed', { layerId, isVisible: layer.isVisible });
  }

  /**
   * Get annotation analytics
   */
  getAnalytics(): AnnotationAnalytics | null {
    return this.analytics;
  }

  /**
   * Export annotations
   */
  exportAnnotations(format: 'json' | 'csv' | 'srt' | 'vtt', filters?: AnnotationFilter): string {
    const annotations = filters ? this.filterAnnotations(filters) : Array.from(this.annotations.values());
    
    switch (format) {
      case 'json':
        return JSON.stringify(annotations, null, 2);
      
      case 'csv':
        return this.exportToCSV(annotations);
      
      case 'srt':
        return this.exportToSRT(annotations);
      
      case 'vtt':
        return this.exportToVTT(annotations);
      
      default:
        throw new Error('Unsupported export format');
    }
  }

  /**
   * Import annotations
   */
  async importAnnotations(data: string, format: 'json' | 'csv' | 'srt' | 'vtt'): Promise<number> {
    let annotations: Partial<StreamAnnotation>[] = [];
    
    switch (format) {
      case 'json':
        annotations = JSON.parse(data);
        break;
      
      case 'srt':
        annotations = this.parseFromSRT(data);
        break;
      
      case 'vtt':
        annotations = this.parseFromVTT(data);
        break;
      
      default:
        throw new Error('Unsupported import format');
    }
    
    let importedCount = 0;
    
    for (const annotationData of annotations) {
      try {
        if (annotationData.content && annotationData.timestamp !== undefined && annotationData.position) {
          await this.createAnnotation(
            annotationData.type || 'text_comment',
            annotationData.content,
            annotationData.timestamp,
            annotationData.position,
            {
              style: annotationData.style,
              metadata: {
                ...annotationData.metadata,
                source: 'import',
              },
            }
          );
          importedCount++;
        }
      } catch (error) {
        logError('Failed to import annotation', error);
      }
    }
    
    this.emit('annotations_imported', { count: importedCount, total: annotations.length });
    return importedCount;
  }

  /**
   * Get annotation templates
   */
  getAnnotationTemplates(): AnnotationTemplate[] {
    return Array.from(this.annotationTemplates.values());
  }

  /**
   * Create annotation from template
   */
  async createFromTemplate(templateId: string, timestamp: number, position?: AnnotationPosition): Promise<StreamAnnotation> {
    const template = this.annotationTemplates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const annotation = await this.createAnnotation(
      template.type,
      template.content,
      timestamp,
      position || template.defaultPosition,
      {
        style: template.style,
        metadata: {
          tags: template.tags,
          source: 'user',
        },
      }
    );

    // Update template usage
    template.usageCount++;
    this.annotationTemplates.set(templateId, template);

    return annotation;
  }

  /**
   * Dispose service
   */
  dispose(): void {
    this.stopSyncTimer();
    this.stopCleanupTimer();
    
    this.annotations.clear();
    this.annotationThreads.clear();
    this.annotationLayers.clear();
    this.annotationTemplates.clear();
    this.visibleLayers.clear();
    
    this.currentStreamId = null;
    this.currentUserId = null;
    this.currentUsername = null;
    this.analytics = null;
    this.activeFilters = {};
    this.isInitialized = false;
    
    this.emit('disposed');
  }

  // Private methods

  private setupEventHandlers(): void {
    webSocketService.on('message:annotation_create', this.handleAnnotationCreate.bind(this));
    webSocketService.on('message:annotation_update', this.handleAnnotationUpdate.bind(this));
    webSocketService.on('message:annotation_delete', this.handleAnnotationDelete.bind(this));
    webSocketService.on('message:annotation_interact', this.handleAnnotationInteract.bind(this));
    webSocketService.on('message:annotation_analytics', this.handleAnnotationAnalytics.bind(this));
    webSocketService.on('disconnected', this.handleDisconnected.bind(this));
  }

  private handleAnnotationCreate(wsMessage: WebSocketMessage): void {
    const annotation: StreamAnnotation = wsMessage.data;
    this.annotations.set(annotation.id, annotation);
    this.updateAnalytics('create', annotation);
    this.emit('annotation_received', annotation);
  }

  private handleAnnotationUpdate(wsMessage: WebSocketMessage): void {
    const { annotationId, updates } = wsMessage.data;
    const annotation = this.annotations.get(annotationId);
    
    if (annotation) {
      const updatedAnnotation = { ...annotation, ...updates };
      this.annotations.set(annotationId, updatedAnnotation);
      this.emit('annotation_updated', { annotationId, annotation: updatedAnnotation });
    }
  }

  private handleAnnotationDelete(wsMessage: WebSocketMessage): void {
    const { annotationId } = wsMessage.data;
    this.annotations.delete(annotationId);
    this.emit('annotation_deleted', { annotationId });
  }

  private handleAnnotationInteract(wsMessage: WebSocketMessage): void {
    const { annotationId, interaction } = wsMessage.data;
    const annotation = this.annotations.get(annotationId);
    
    if (annotation) {
      annotation.interactions.push(interaction);
      annotation.updatedAt = new Date().toISOString();
      this.annotations.set(annotationId, annotation);
      this.emit('annotation_interaction', { annotationId, interaction });
    }
  }

  private handleAnnotationAnalytics(wsMessage: WebSocketMessage): void {
    this.analytics = wsMessage.data;
    this.emit('annotation_analytics_updated', this.analytics);
  }

  private handleDisconnected(): void {
    this.emit('disconnected');
  }

  private canEdit(annotation: StreamAnnotation): boolean {
    if (!this.currentUserId) return false;
    
    return annotation.permissions.canEdit && 
           (annotation.userId === this.currentUserId || 
            annotation.permissions.editableBy.includes(this.currentUserId));
  }

  private canDelete(annotation: StreamAnnotation): boolean {
    if (!this.currentUserId) return false;
    
    return annotation.permissions.canDelete && 
           (annotation.userId === this.currentUserId || 
            annotation.permissions.moderatableBy.includes(this.currentUserId));
  }

  private isVisible(annotation: StreamAnnotation): boolean {
    if (!annotation.visibility.isPublic) {
      if (annotation.visibility.allowedUsers && 
          !annotation.visibility.allowedUsers.includes(this.currentUserId!)) {
        return false;
      }
    }
    
    if (annotation.visibility.restrictedUsers && 
        annotation.visibility.restrictedUsers.includes(this.currentUserId!)) {
      return false;
    }
    
    return true;
  }

  private matchesFilters(annotation: StreamAnnotation, filters?: AnnotationFilter): boolean {
    if (!filters) return true;
    
    if (filters.types && !filters.types.includes(annotation.type)) {
      return false;
    }
    
    if (filters.users && !filters.users.includes(annotation.userId)) {
      return false;
    }
    
    if (filters.timeRange) {
      if (annotation.timestamp < filters.timeRange.start || 
          annotation.timestamp > filters.timeRange.end) {
        return false;
      }
    }
    
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => 
        annotation.metadata.tags.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }
    
    if (filters.status && !filters.status.includes(annotation.status)) {
      return false;
    }
    
    if (filters.priority && !filters.priority.includes(annotation.metadata.priority)) {
      return false;
    }
    
    if (filters.source && !filters.source.includes(annotation.metadata.source)) {
      return false;
    }
    
    return true;
  }

  private updateAnalytics(action: 'create' | 'update' | 'delete' | 'interact', annotation: StreamAnnotation): void {
    if (!this.analytics) {
      this.analytics = {
        totalAnnotations: 0,
        annotationsByType: {} as Record<AnnotationType, number>,
        annotationsByUser: [],
        interactionsByType: {} as Record<InteractionType, number>,
        engagementRate: 0,
        averageInteractionsPerAnnotation: 0,
        hotspots: [],
        topContributors: [],
        qualityMetrics: {
          averageAccuracy: 0,
          averageRelevance: 0,
          reportRate: 0,
          verificationRate: 0,
        },
        timelineActivity: [],
        popularTags: [],
        languageDistribution: [],
      };
    }
    
    if (action === 'create') {
      this.analytics.totalAnnotations++;
      this.analytics.annotationsByType[annotation.type] = 
        (this.analytics.annotationsByType[annotation.type] || 0) + 1;
    }
    
    // Update user stats
    const userStat = this.analytics.annotationsByUser.find(u => u.userId === annotation.userId);
    if (userStat) {
      if (action === 'create') userStat.count++;
    } else if (action === 'create') {
      this.analytics.annotationsByUser.push({ userId: annotation.userId, count: 1 });
    }
  }

  private exportToCSV(annotations: StreamAnnotation[]): string {
    const headers = ['ID', 'Type', 'Content', 'Timestamp', 'User', 'Created At', 'Status'];
    const rows = annotations.map(annotation => [
      annotation.id,
      annotation.type,
      annotation.content.replace(/"/g, '""'),
      annotation.timestamp.toString(),
      annotation.username,
      annotation.createdAt,
      annotation.status,
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  private exportToSRT(annotations: StreamAnnotation[]): string {
    return annotations
      .filter(a => a.type === 'text_comment' || a.type === 'highlight')
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((annotation, index) => {
        const start = this.formatSRTTime(annotation.timestamp);
        const end = this.formatSRTTime(annotation.timestamp + (annotation.duration || 3));
        
        return `${index + 1}\n${start} --> ${end}\n${annotation.content}\n`;
      })
      .join('\n');
  }

  private exportToVTT(annotations: StreamAnnotation[]): string {
    const header = 'WEBVTT\n\n';
    const cues = annotations
      .filter(a => a.type === 'text_comment' || a.type === 'highlight')
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(annotation => {
        const start = this.formatVTTTime(annotation.timestamp);
        const end = this.formatVTTTime(annotation.timestamp + (annotation.duration || 3));
        
        return `${start} --> ${end}\n${annotation.content}\n`;
      })
      .join('\n');
    
    return header + cues;
  }

  private parseFromSRT(data: string): Partial<StreamAnnotation>[] {
    const annotations: Partial<StreamAnnotation>[] = [];
    const blocks = data.split('\n\n').filter(block => block.trim());
    
    for (const block of blocks) {
      const lines = block.split('\n');
      if (lines.length >= 3) {
        const timeLine = lines[1];
        const content = lines.slice(2).join('\n');
        const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
        
        if (timeMatch) {
          const startTime = this.parseSRTTime(timeMatch[1]);
          const endTime = this.parseSRTTime(timeMatch[2]);
          
          annotations.push({
            type: 'text_comment',
            content,
            timestamp: startTime,
            duration: endTime - startTime,
            position: { x: 50, y: 80, anchor: 'bottom_center' },
          });
        }
      }
    }
    
    return annotations;
  }

  private parseFromVTT(data: string): Partial<StreamAnnotation>[] {
    const annotations: Partial<StreamAnnotation>[] = [];
    const lines = data.split('\n');
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (line.includes(' --> ')) {
        const timeMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/);
        if (timeMatch) {
          const startTime = this.parseVTTTime(timeMatch[1]);
          const endTime = this.parseVTTTime(timeMatch[2]);
          
          i++;
          const contentLines = [];
          while (i < lines.length && lines[i].trim() !== '') {
            contentLines.push(lines[i]);
            i++;
          }
          
          if (contentLines.length > 0) {
            annotations.push({
              type: 'text_comment',
              content: contentLines.join('\n'),
              timestamp: startTime,
              duration: endTime - startTime,
              position: { x: 50, y: 80, anchor: 'bottom_center' },
            });
          }
        }
      }
      i++;
    }
    
    return annotations;
  }

  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  private formatVTTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  private parseSRTTime(timeString: string): number {
    const [time, ms] = timeString.split(',');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + Number(ms) / 1000;
  }

  private parseVTTTime(timeString: string): number {
    const [time, ms] = timeString.split('.');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + Number(ms) / 1000;
  }

  private async loadStreamAnnotations(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(`annotations_${this.currentStreamId}`);
      if (cached) {
        const annotations: StreamAnnotation[] = JSON.parse(cached);
        annotations.forEach(annotation => {
          this.annotations.set(annotation.id, annotation);
        });
        logDebug('Loaded cached annotations', { count: annotations.length });
      }
    } catch (error) {
      logError('Failed to load cached annotations', error);
    }
  }

  private async loadAnnotationLayers(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(`annotation_layers_${this.currentUserId}`);
      if (cached) {
        const layers: AnnotationLayer[] = JSON.parse(cached);
        layers.forEach(layer => {
          this.annotationLayers.set(layer.id, layer);
          if (layer.isVisible) {
            this.visibleLayers.add(layer.id);
          }
        });
      }
    } catch (error) {
      logError('Failed to load annotation layers', error);
    }
  }

  private async loadAnnotationTemplates(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem('annotation_templates');
      if (cached) {
        const templates: AnnotationTemplate[] = JSON.parse(cached);
        templates.forEach(template => {
          this.annotationTemplates.set(template.id, template);
        });
      }
    } catch (error) {
      logError('Failed to load annotation templates', error);
    }
  }

  private startSyncTimer(): void {
    this.syncTimer = setInterval(() => {
      this.syncAnnotations();
    }, 30000); // 30 seconds
  }

  private stopSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredAnnotations();
    }, 60000); // 1 minute
  }

  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private async syncAnnotations(): void {
    // Request latest annotations from server
    await webSocketService.sendMessage('annotation_sync_request', {
      streamId: this.currentStreamId,
      lastSyncTime: new Date().toISOString(),
    });
  }

  private cleanupExpiredAnnotations(): void {
    const now = new Date();
    const expired: string[] = [];
    
    this.annotations.forEach((annotation, id) => {
      if (annotation.expiresAt && new Date(annotation.expiresAt) < now) {
        expired.push(id);
      }
    });
    
    expired.forEach(id => this.annotations.delete(id));
    
    if (expired.length > 0) {
      this.emit('annotations_expired', expired);
    }
  }

  private generateId(): string {
    return `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const annotationsService = new AnnotationsService();

// Helper functions
export const initializeAnnotations = async (streamId: string, userId: string, username: string) => {
  return annotationsService.initialize(streamId, userId, username);
};

export const createAnnotation = async (
  type: AnnotationType,
  content: string,
  timestamp: number,
  position: AnnotationPosition,
  options?: any
) => {
  return annotationsService.createAnnotation(type, content, timestamp, position, options);
};

export const getAnnotationsAtTime = (timestamp: number) => {
  return annotationsService.getAnnotationsAtTimestamp(timestamp);
};

export const searchAnnotations = (query: string, filters?: AnnotationFilter) => {
  return annotationsService.searchAnnotations(query, filters);
};