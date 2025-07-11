import { UnifiedStream } from './platformService';
import { analyticsService } from './analyticsService';
import { contentModerationService } from './contentModerationService';

export interface StreamerProfile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  bio: string;
  website?: string;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    discord?: string;
    tiktok?: string;
  };
  platforms: StreamerPlatform[];
  categories: string[];
  languages: string[];
  timezone: string;
  schedule: StreamSchedule[];
  settings: StreamerSettings;
  statistics: StreamerStatistics;
  monetization: MonetizationSettings;
  branding: BrandingSettings;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
}

export interface StreamerPlatform {
  platform: 'twitch' | 'youtube' | 'kick' | 'facebook' | 'tiktok';
  username: string;
  displayName: string;
  isConnected: boolean;
  isVerified: boolean;
  followerCount: number;
  subscriberCount: number;
  lastStreamAt?: string;
  streamKey?: string;
  credentials?: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
  };
}

export interface StreamSchedule {
  id: string;
  streamerId: string;
  title: string;
  description: string;
  category: string;
  platform: string;
  startTime: string;
  endTime: string;
  timezone: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  isPublic: boolean;
  maxViewers?: number;
  tags: string[];
  thumbnail?: string;
  previewUrl?: string;
  isConfirmed: boolean;
  remindersSent: boolean;
  attendees: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StreamerSettings {
  autoModeration: {
    enabled: boolean;
    sensitivity: 'low' | 'medium' | 'high';
    banKeywords: string[];
    allowedDomains: string[];
    maxCapsPercentage: number;
    maxEmoteCount: number;
    slowModeDelay: number;
    followerOnlyMode: boolean;
    subscriberOnlyMode: boolean;
  };
  notifications: {
    newFollower: boolean;
    newSubscriber: boolean;
    donations: boolean;
    raids: boolean;
    hostings: boolean;
    moderatorActions: boolean;
    systemAlerts: boolean;
    emailNotifications: boolean;
    discordWebhook?: string;
    slackWebhook?: string;
  };
  privacy: {
    hideViewerList: boolean;
    hideFollowerCount: boolean;
    hideSubscriberCount: boolean;
    allowClips: boolean;
    allowDownloads: boolean;
    matureContent: boolean;
    geoRestrictions: string[];
  };
  quality: {
    maxBitrate: number;
    maxResolution: string;
    maxFramerate: number;
    encoder: string;
    keyframeInterval: number;
  };
  multiStream: {
    enabled: boolean;
    platforms: string[];
    titleSync: boolean;
    categorySync: boolean;
    chatSync: boolean;
  };
}

export interface StreamerStatistics {
  totalStreams: number;
  totalStreamTime: number;
  averageViewers: number;
  peakViewers: number;
  totalViews: number;
  followerGrowth: number;
  subscriberGrowth: number;
  averageStreamDuration: number;
  streamFrequency: number;
  topCategories: { category: string; hours: number }[];
  topPlatforms: { platform: string; viewers: number }[];
  recentMetrics: {
    date: string;
    viewers: number;
    followers: number;
    subscribers: number;
    streamTime: number;
  }[];
}

export interface MonetizationSettings {
  enabled: boolean;
  methods: {
    subscriptions: boolean;
    donations: boolean;
    sponsorships: boolean;
    merchandise: boolean;
    advertising: boolean;
  };
  subscriptionTiers: SubscriptionTier[];
  donationSettings: {
    minAmount: number;
    maxAmount: number;
    currency: string;
    showGoal: boolean;
    goalAmount: number;
    goalTitle: string;
    allowAnonymous: boolean;
    requireMessage: boolean;
    moderateMessages: boolean;
  };
  sponsorshipRates: {
    perHour: number;
    perThousandViews: number;
    perMonth: number;
    currency: string;
  };
  payoutSettings: {
    method: 'bank' | 'paypal' | 'crypto';
    threshold: number;
    currency: string;
    schedule: 'weekly' | 'monthly';
  };
}

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  benefits: string[];
  isActive: boolean;
  subscriberCount: number;
  color: string;
  emoji: string;
}

export interface BrandingSettings {
  logo?: string;
  banner?: string;
  profileImage?: string;
  overlayAssets: {
    webcamFrame?: string;
    alertBoxes?: string;
    chatBox?: string;
    donationGoal?: string;
    recentFollowers?: string;
    nowPlaying?: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    primary: string;
    secondary: string;
  };
  customCss?: string;
  animations: {
    followAlert?: string;
    subscribeAlert?: string;
    donationAlert?: string;
    raidAlert?: string;
  };
}

export interface StreamSession {
  id: string;
  streamerId: string;
  platform: string;
  title: string;
  category: string;
  startTime: string;
  endTime?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  viewerCount: number;
  peakViewers: number;
  chatMessages: number;
  followers: number;
  subscribers: number;
  donations: number;
  revenue: number;
  quality: StreamQuality;
  metadata: {
    streamKey: string;
    ingestUrl: string;
    previewUrl: string;
    recordingUrl?: string;
    thumbnailUrl?: string;
  };
  analytics: {
    viewerRetention: number[];
    chatActivity: number[];
    qualityChanges: { timestamp: string; quality: string }[];
    disconnections: { timestamp: string; duration: number }[];
  };
  moderationActions: {
    warnings: number;
    timeouts: number;
    bans: number;
    deletedMessages: number;
  };
}

export interface StreamQuality {
  bitrate: number;
  resolution: string;
  framerate: number;
  encoder: string;
  keyframeInterval: number;
  audioCodec: string;
  videCodec: string;
  latency: number;
  stability: number;
  dropFrames: number;
  skippedFrames: number;
}

export interface StreamAlert {
  id: string;
  streamerId: string;
  type: 'follow' | 'subscribe' | 'donation' | 'raid' | 'host' | 'bits' | 'milestone' | 'error';
  message: string;
  data: Record<string, any>;
  timestamp: string;
  isRead: boolean;
  severity: 'info' | 'warning' | 'error' | 'success';
  actionRequired: boolean;
  expiresAt?: string;
}

export interface StreamTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  isPublic: boolean;
  createdBy: string;
  settings: Partial<StreamerSettings>;
  branding: Partial<BrandingSettings>;
  schedule?: Partial<StreamSchedule>;
  tags: string[];
  thumbnail?: string;
  usageCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface StreamMetrics {
  streamId: string;
  timestamp: string;
  viewerCount: number;
  chatRate: number;
  quality: StreamQuality;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    clips: number;
  };
  revenue: {
    subscriptions: number;
    donations: number;
    advertising: number;
    sponsorships: number;
  };
  technical: {
    cpuUsage: number;
    memoryUsage: number;
    networkUsage: number;
    errors: number;
  };
}

class StreamManagementService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.streammulti.com';
  private readonly wsUrl = process.env.EXPO_PUBLIC_WS_URL || 'wss://ws.streammulti.com';
  private websocket: WebSocket | null = null;
  private alertHandlers: Map<string, (alert: StreamAlert) => void> = new Map();

  constructor() {
    console.log('Stream Management Service initialized');
    this.initializeWebSocket();
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Stream Management API request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Stream Management API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private initializeWebSocket(): void {
    try {
      this.websocket = new WebSocket(this.wsUrl);
      
      this.websocket.onopen = () => {
        console.log('✅ WebSocket connected');
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('🔄 WebSocket disconnected, attempting to reconnect...');
        setTimeout(() => this.initializeWebSocket(), 5000);
      };

      this.websocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error);
    }
  }

  private handleWebSocketMessage(data: any): void {
    switch (data.type) {
      case 'stream_alert':
        this.handleStreamAlert(data.alert);
        break;
      case 'stream_metrics':
        this.handleStreamMetrics(data.metrics);
        break;
      case 'viewer_update':
        this.handleViewerUpdate(data.update);
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }

  private handleStreamAlert(alert: StreamAlert): void {
    const handler = this.alertHandlers.get(alert.streamerId);
    if (handler) {
      handler(alert);
    }
  }

  private handleStreamMetrics(metrics: StreamMetrics): void {
    // Update real-time metrics
    console.log('📊 Real-time metrics update:', metrics.streamId);
  }

  private handleViewerUpdate(update: { streamId: string; viewerCount: number }): void {
    console.log('👥 Viewer count update:', update.streamId, update.viewerCount);
  }

  // Streamer Profile Management
  async createStreamerProfile(profileData: Omit<StreamerProfile, 'id' | 'createdAt' | 'updatedAt' | 'statistics'>): Promise<StreamerProfile> {
    console.log('🔄 Creating streamer profile:', profileData.username);
    
    try {
      const profile = await this.makeRequest<StreamerProfile>('/streamers', {
        method: 'POST',
        body: JSON.stringify(profileData),
      });

      console.log('✅ Streamer profile created:', profile.username);
      return profile;
    } catch (error) {
      console.error('❌ Failed to create streamer profile:', error);
      throw error;
    }
  }

  async getStreamerProfile(streamerId: string): Promise<StreamerProfile> {
    console.log('🔄 Fetching streamer profile:', streamerId);
    
    try {
      const profile = await this.makeRequest<StreamerProfile>(`/streamers/${streamerId}`);
      console.log('✅ Streamer profile fetched:', profile.username);
      return profile;
    } catch (error) {
      console.error('❌ Failed to fetch streamer profile:', error);
      throw error;
    }
  }

  async updateStreamerProfile(streamerId: string, updates: Partial<StreamerProfile>): Promise<StreamerProfile> {
    console.log('🔄 Updating streamer profile:', streamerId);
    
    try {
      const profile = await this.makeRequest<StreamerProfile>(`/streamers/${streamerId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      console.log('✅ Streamer profile updated:', streamerId);
      return profile;
    } catch (error) {
      console.error('❌ Failed to update streamer profile:', error);
      throw error;
    }
  }

  // Platform Integration
  async connectPlatform(streamerId: string, platform: string, credentials: {
    accessToken?: string;
    refreshToken?: string;
    username?: string;
    streamKey?: string;
  }): Promise<StreamerPlatform> {
    console.log('🔄 Connecting platform:', platform, 'for streamer:', streamerId);
    
    try {
      const platformData = await this.makeRequest<StreamerPlatform>(`/streamers/${streamerId}/platforms`, {
        method: 'POST',
        body: JSON.stringify({ platform, credentials }),
      });

      console.log('✅ Platform connected:', platform);
      return platformData;
    } catch (error) {
      console.error('❌ Failed to connect platform:', error);
      throw error;
    }
  }

  async disconnectPlatform(streamerId: string, platform: string): Promise<void> {
    console.log('🔄 Disconnecting platform:', platform, 'for streamer:', streamerId);
    
    try {
      await this.makeRequest(`/streamers/${streamerId}/platforms/${platform}`, {
        method: 'DELETE',
      });

      console.log('✅ Platform disconnected:', platform);
    } catch (error) {
      console.error('❌ Failed to disconnect platform:', error);
      throw error;
    }
  }

  async syncPlatformData(streamerId: string, platform: string): Promise<StreamerPlatform> {
    console.log('🔄 Syncing platform data:', platform, 'for streamer:', streamerId);
    
    try {
      const platformData = await this.makeRequest<StreamerPlatform>(`/streamers/${streamerId}/platforms/${platform}/sync`, {
        method: 'POST',
      });

      console.log('✅ Platform data synced:', platform);
      return platformData;
    } catch (error) {
      console.error('❌ Failed to sync platform data:', error);
      throw error;
    }
  }

  // Stream Scheduling
  async createStreamSchedule(scheduleData: Omit<StreamSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<StreamSchedule> {
    console.log('🔄 Creating stream schedule:', scheduleData.title);
    
    try {
      const schedule = await this.makeRequest<StreamSchedule>('/streamers/schedules', {
        method: 'POST',
        body: JSON.stringify(scheduleData),
      });

      console.log('✅ Stream schedule created:', schedule.title);
      return schedule;
    } catch (error) {
      console.error('❌ Failed to create stream schedule:', error);
      throw error;
    }
  }

  async getStreamerSchedule(streamerId: string, startDate?: string, endDate?: string): Promise<StreamSchedule[]> {
    console.log('🔄 Fetching streamer schedule:', streamerId);
    
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const schedules = await this.makeRequest<StreamSchedule[]>(`/streamers/${streamerId}/schedules?${params.toString()}`);
      console.log('✅ Streamer schedule fetched:', schedules.length);
      return schedules;
    } catch (error) {
      console.error('❌ Failed to fetch streamer schedule:', error);
      throw error;
    }
  }

  async updateStreamSchedule(scheduleId: string, updates: Partial<StreamSchedule>): Promise<StreamSchedule> {
    console.log('🔄 Updating stream schedule:', scheduleId);
    
    try {
      const schedule = await this.makeRequest<StreamSchedule>(`/streamers/schedules/${scheduleId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      console.log('✅ Stream schedule updated:', scheduleId);
      return schedule;
    } catch (error) {
      console.error('❌ Failed to update stream schedule:', error);
      throw error;
    }
  }

  async cancelStreamSchedule(scheduleId: string, reason?: string): Promise<void> {
    console.log('🔄 Cancelling stream schedule:', scheduleId);
    
    try {
      await this.makeRequest(`/streamers/schedules/${scheduleId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });

      console.log('✅ Stream schedule cancelled:', scheduleId);
    } catch (error) {
      console.error('❌ Failed to cancel stream schedule:', error);
      throw error;
    }
  }

  // Stream Session Management
  async startStream(streamerId: string, sessionData: {
    title: string;
    category: string;
    platform: string;
    quality: Partial<StreamQuality>;
    settings?: Partial<StreamerSettings>;
  }): Promise<StreamSession> {
    console.log('🔄 Starting stream:', sessionData.title);
    
    try {
      const session = await this.makeRequest<StreamSession>(`/streamers/${streamerId}/stream/start`, {
        method: 'POST',
        body: JSON.stringify(sessionData),
      });

      console.log('✅ Stream started:', session.id);
      return session;
    } catch (error) {
      console.error('❌ Failed to start stream:', error);
      throw error;
    }
  }

  async endStream(streamerId: string, sessionId: string): Promise<StreamSession> {
    console.log('🔄 Ending stream:', sessionId);
    
    try {
      const session = await this.makeRequest<StreamSession>(`/streamers/${streamerId}/stream/${sessionId}/end`, {
        method: 'POST',
      });

      console.log('✅ Stream ended:', sessionId);
      return session;
    } catch (error) {
      console.error('❌ Failed to end stream:', error);
      throw error;
    }
  }

  async getStreamSession(streamerId: string, sessionId: string): Promise<StreamSession> {
    console.log('🔄 Fetching stream session:', sessionId);
    
    try {
      const session = await this.makeRequest<StreamSession>(`/streamers/${streamerId}/stream/${sessionId}`);
      console.log('✅ Stream session fetched:', sessionId);
      return session;
    } catch (error) {
      console.error('❌ Failed to fetch stream session:', error);
      throw error;
    }
  }

  async updateStreamSettings(streamerId: string, sessionId: string, settings: Partial<StreamerSettings>): Promise<StreamSession> {
    console.log('🔄 Updating stream settings:', sessionId);
    
    try {
      const session = await this.makeRequest<StreamSession>(`/streamers/${streamerId}/stream/${sessionId}/settings`, {
        method: 'PUT',
        body: JSON.stringify(settings),
      });

      console.log('✅ Stream settings updated:', sessionId);
      return session;
    } catch (error) {
      console.error('❌ Failed to update stream settings:', error);
      throw error;
    }
  }

  // Multi-Platform Streaming
  async startMultiPlatformStream(streamerId: string, platforms: string[], sessionData: {
    title: string;
    category: string;
    quality: Partial<StreamQuality>;
    settings?: Partial<StreamerSettings>;
  }): Promise<StreamSession[]> {
    console.log('🔄 Starting multi-platform stream:', platforms.join(', '));
    
    try {
      const sessions = await this.makeRequest<StreamSession[]>(`/streamers/${streamerId}/stream/multi/start`, {
        method: 'POST',
        body: JSON.stringify({ platforms, ...sessionData }),
      });

      console.log('✅ Multi-platform stream started:', sessions.length, 'sessions');
      return sessions;
    } catch (error) {
      console.error('❌ Failed to start multi-platform stream:', error);
      throw error;
    }
  }

  async syncMultiPlatformTitle(streamerId: string, sessionIds: string[], title: string): Promise<void> {
    console.log('🔄 Syncing multi-platform title:', title);
    
    try {
      await this.makeRequest(`/streamers/${streamerId}/stream/multi/sync/title`, {
        method: 'POST',
        body: JSON.stringify({ sessionIds, title }),
      });

      console.log('✅ Multi-platform title synced');
    } catch (error) {
      console.error('❌ Failed to sync multi-platform title:', error);
      throw error;
    }
  }

  // Analytics and Insights
  async getStreamerAnalytics(streamerId: string, timeRange: string = '30d'): Promise<StreamerStatistics> {
    console.log('🔄 Fetching streamer analytics:', streamerId);
    
    try {
      const analytics = await this.makeRequest<StreamerStatistics>(`/streamers/${streamerId}/analytics?timeRange=${timeRange}`);
      console.log('✅ Streamer analytics fetched');
      return analytics;
    } catch (error) {
      console.error('❌ Failed to fetch streamer analytics:', error);
      throw error;
    }
  }

  async getStreamInsights(streamerId: string, sessionId: string): Promise<{
    viewerJourney: { timestamp: string; action: string; count: number }[];
    engagementHeatmap: { timestamp: string; engagement: number }[];
    chatAnalysis: { sentiment: number; topics: string[]; activity: number[] };
    recommendations: { category: string; suggestion: string; impact: string }[];
  }> {
    console.log('🔄 Fetching stream insights:', sessionId);
    
    try {
      const insights = await this.makeRequest<any>(`/streamers/${streamerId}/stream/${sessionId}/insights`);
      console.log('✅ Stream insights fetched');
      return insights;
    } catch (error) {
      console.error('❌ Failed to fetch stream insights:', error);
      throw error;
    }
  }

  // Stream Templates
  async createStreamTemplate(templateData: Omit<StreamTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'rating'>): Promise<StreamTemplate> {
    console.log('🔄 Creating stream template:', templateData.name);
    
    try {
      const template = await this.makeRequest<StreamTemplate>('/streamers/templates', {
        method: 'POST',
        body: JSON.stringify(templateData),
      });

      console.log('✅ Stream template created:', template.name);
      return template;
    } catch (error) {
      console.error('❌ Failed to create stream template:', error);
      throw error;
    }
  }

  async getStreamTemplates(filters?: {
    category?: string;
    isPublic?: boolean;
    createdBy?: string;
    tags?: string[];
  }): Promise<StreamTemplate[]> {
    console.log('🔄 Fetching stream templates');
    
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            if (Array.isArray(value)) {
              value.forEach(v => params.append(key, v));
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      const templates = await this.makeRequest<StreamTemplate[]>(`/streamers/templates?${params.toString()}`);
      console.log('✅ Stream templates fetched:', templates.length);
      return templates;
    } catch (error) {
      console.error('❌ Failed to fetch stream templates:', error);
      throw error;
    }
  }

  async applyStreamTemplate(streamerId: string, templateId: string): Promise<StreamerProfile> {
    console.log('🔄 Applying stream template:', templateId);
    
    try {
      const profile = await this.makeRequest<StreamerProfile>(`/streamers/${streamerId}/templates/${templateId}/apply`, {
        method: 'POST',
      });

      console.log('✅ Stream template applied:', templateId);
      return profile;
    } catch (error) {
      console.error('❌ Failed to apply stream template:', error);
      throw error;
    }
  }

  // Alert System
  subscribeToAlerts(streamerId: string, handler: (alert: StreamAlert) => void): void {
    console.log('🔄 Subscribing to alerts for streamer:', streamerId);
    this.alertHandlers.set(streamerId, handler);
    
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'subscribe_alerts',
        streamerId,
      }));
    }
  }

  unsubscribeFromAlerts(streamerId: string): void {
    console.log('🔄 Unsubscribing from alerts for streamer:', streamerId);
    this.alertHandlers.delete(streamerId);
    
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'unsubscribe_alerts',
        streamerId,
      }));
    }
  }

  async getStreamAlerts(streamerId: string, limit: number = 50): Promise<StreamAlert[]> {
    console.log('🔄 Fetching stream alerts:', streamerId);
    
    try {
      const alerts = await this.makeRequest<StreamAlert[]>(`/streamers/${streamerId}/alerts?limit=${limit}`);
      console.log('✅ Stream alerts fetched:', alerts.length);
      return alerts;
    } catch (error) {
      console.error('❌ Failed to fetch stream alerts:', error);
      throw error;
    }
  }

  async markAlertAsRead(streamerId: string, alertId: string): Promise<void> {
    console.log('🔄 Marking alert as read:', alertId);
    
    try {
      await this.makeRequest(`/streamers/${streamerId}/alerts/${alertId}/read`, {
        method: 'POST',
      });

      console.log('✅ Alert marked as read:', alertId);
    } catch (error) {
      console.error('❌ Failed to mark alert as read:', error);
      throw error;
    }
  }

  // Utility Methods
  async generateStreamKey(streamerId: string, platform: string): Promise<string> {
    console.log('🔄 Generating stream key for:', platform);
    
    try {
      const result = await this.makeRequest<{ streamKey: string }>(`/streamers/${streamerId}/stream-key/${platform}`, {
        method: 'POST',
      });

      console.log('✅ Stream key generated for:', platform);
      return result.streamKey;
    } catch (error) {
      console.error('❌ Failed to generate stream key:', error);
      throw error;
    }
  }

  async testStreamConnection(streamerId: string, platform: string): Promise<{
    success: boolean;
    latency: number;
    quality: string;
    errors: string[];
  }> {
    console.log('🔄 Testing stream connection:', platform);
    
    try {
      const result = await this.makeRequest<{
        success: boolean;
        latency: number;
        quality: string;
        errors: string[];
      }>(`/streamers/${streamerId}/test-connection/${platform}`, {
        method: 'POST',
      });

      console.log('✅ Stream connection test completed:', result.success);
      return result;
    } catch (error) {
      console.error('❌ Failed to test stream connection:', error);
      throw error;
    }
  }

  async optimizeStreamSettings(streamerId: string, currentSettings: StreamerSettings): Promise<{
    recommendations: { setting: string; current: any; recommended: any; reason: string }[];
    estimatedImprovement: { metric: string; improvement: string }[];
  }> {
    console.log('🔄 Optimizing stream settings for:', streamerId);
    
    try {
      const result = await this.makeRequest<any>(`/streamers/${streamerId}/optimize-settings`, {
        method: 'POST',
        body: JSON.stringify(currentSettings),
      });

      console.log('✅ Stream settings optimized');
      return result;
    } catch (error) {
      console.error('❌ Failed to optimize stream settings:', error);
      throw error;
    }
  }

  // Cleanup
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.alertHandlers.clear();
    console.log('✅ Stream Management Service disconnected');
  }
}

export const streamManagementService = new StreamManagementService();
export default streamManagementService;