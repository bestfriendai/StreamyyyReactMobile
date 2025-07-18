import { UnifiedStream } from './platformService';

export interface StreamAnalytics {
  streamId: string;
  streamerName: string;
  platform: string;
  title: string;
  category: string;
  startTime: string;
  endTime?: string;
  duration: number; // in minutes
  peakViewers: number;
  averageViewers: number;
  totalViews: number;
  uniqueViewers: number;
  chatMessages: number;
  followerGrowth: number;
  subscriberGrowth: number;
  donationAmount: number;
  donationCount: number;
  clipCount: number;
  highlightCount: number;
  moderatorActions: number;
  viewerRetention: {
    '1min': number;
    '5min': number;
    '15min': number;
    '30min': number;
    '1hour': number;
  };
  viewerDemographics: {
    countries: { [country: string]: number };
    ageGroups: { [ageGroup: string]: number };
    devices: { [device: string]: number };
    platforms: { [platform: string]: number };
  };
  chatAnalytics: {
    messageRate: number;
    emotesUsed: { [emote: string]: number };
    topChatters: { username: string; messageCount: number }[];
    sentiments: {
      positive: number;
      negative: number;
      neutral: number;
    };
    moderatedMessages: number;
    slowModeEnabled: boolean;
  };
  gameMetrics?: {
    gameTitle: string;
    gamePlaytime: number;
    achievements: number;
    deaths: number;
    wins: number;
    losses: number;
    score: number;
  };
  monetization: {
    adRevenue: number;
    subscriptionRevenue: number;
    donationRevenue: number;
    sponsorshipRevenue: number;
    merchandiseRevenue: number;
    totalRevenue: number;
  };
  engagement: {
    likesPerMinute: number;
    sharesPerMinute: number;
    clipsPerMinute: number;
    avgWatchTime: number;
    bounceRate: number;
    returnViewerRate: number;
  };
  technical: {
    avgBitrate: number;
    frameDrops: number;
    disconnections: number;
    quality: string;
    resolution: string;
    fps: number;
    codec: string;
    latency: number;
  };
  timestamp: string;
  metadata: Record<string, any>;
}

export interface ViewerAnalytics {
  userId: string;
  username: string;
  totalWatchTime: number; // in minutes
  streamsWatched: number;
  favoriteStreamers: string[];
  preferredCategories: string[];
  preferredPlatforms: string[];
  averageSessionDuration: number;
  peakConcurrentStreams: number;
  chatActivity: {
    messagesSent: number;
    emotesUsed: number;
    moderatorActions: number;
    bannedCount: number;
    timeoutCount: number;
  };
  socialActivity: {
    clipsCreated: number;
    clipsShared: number;
    postsCreated: number;
    commentsPosted: number;
    likesGiven: number;
    streamersFollowed: number;
  };
  engagement: {
    avgSessionsPerWeek: number;
    avgStreamsPerSession: number;
    peakViewingHours: number[];
    preferredStreamLength: number;
    multiStreamUsage: number;
  };
  demographics: {
    country: string;
    timezone: string;
    age: number;
    gender: string;
    device: string;
    browser: string;
    os: string;
  };
  achievements: {
    badgesEarned: number;
    milestones: string[];
    streakRecord: number;
    loyaltyPoints: number;
    level: number;
  };
  preferences: {
    notificationSettings: Record<string, boolean>;
    autoplay: boolean;
    chatVisible: boolean;
    quality: string;
    volume: number;
    theme: string;
  };
  timestamp: string;
  metadata: Record<string, any>;
}

export interface PlatformAnalytics {
  platform: string;
  totalStreams: number;
  totalStreamers: number;
  totalViewers: number;
  averageViewersPerStream: number;
  topCategories: { category: string; streams: number; viewers: number }[];
  topStreamers: { streamer: string; viewers: number; followers: number }[];
  growth: {
    dailyGrowth: number;
    weeklyGrowth: number;
    monthlyGrowth: number;
  };
  engagement: {
    avgWatchTime: number;
    chatActivity: number;
    clipCreation: number;
    socialSharing: number;
  };
  demographics: {
    countries: { [country: string]: number };
    ageGroups: { [ageGroup: string]: number };
    devices: { [device: string]: number };
  };
  technical: {
    avgBitrate: number;
    avgLatency: number;
    qualityDistribution: { [quality: string]: number };
    connectionIssues: number;
  };
  revenue: {
    adRevenue: number;
    subscriptionRevenue: number;
    donationRevenue: number;
    totalRevenue: number;
  };
  trends: {
    peakHours: number[];
    seasonalTrends: { [month: string]: number };
    categoryTrends: { [category: string]: number };
  };
  timestamp: string;
  metadata: Record<string, any>;
}

export interface TrendingMetrics {
  id: string;
  type: 'stream' | 'streamer' | 'category' | 'platform';
  name: string;
  score: number;
  change: number; // percentage change
  period: '1h' | '24h' | '7d' | '30d';
  metrics: {
    viewers: number;
    growth: number;
    engagement: number;
    social: number;
    momentum: number;
  };
  factors: {
    viewerGrowth: number;
    newFollowers: number;
    chatActivity: number;
    socialMentions: number;
    clipCreation: number;
    crossPlatformPresence: number;
  };
  predictions: {
    nextHour: number;
    next24Hours: number;
    nextWeek: number;
  };
  timestamp: string;
  metadata: Record<string, any>;
}

export interface InsightReport {
  id: string;
  type: 'stream' | 'viewer' | 'platform' | 'trend' | 'comparative';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'growth' | 'engagement' | 'technical' | 'monetization' | 'social' | 'competitive';
  insights: {
    key: string;
    value: any;
    description: string;
    recommendation: string;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
  recommendations: {
    action: string;
    priority: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    description: string;
    expectedOutcome: string;
  }[];
  charts: {
    type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    data: any[];
    config: Record<string, any>;
  }[];
  timestamp: string;
  metadata: Record<string, any>;
}

class AnalyticsService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.streammulti.com';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    console.log('Analytics Service initialized');
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

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
      console.error(`Analytics API request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Analytics API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }

  // Stream Analytics
  async getStreamAnalytics(streamId: string): Promise<StreamAnalytics | null> {
    console.log(`🔄 Fetching analytics for stream: ${streamId}`);
    
    try {
      const analytics = await this.makeRequest<StreamAnalytics>(`/analytics/streams/${streamId}`);
      console.log(`✅ Stream analytics fetched for ${streamId}`);
      return analytics;
    } catch (error) {
      console.error('❌ Failed to fetch stream analytics:', error);
      return null;
    }
  }

  async getStreamerAnalytics(streamerName: string, platform: string, timeRange: string = '30d'): Promise<StreamAnalytics[]> {
    console.log(`🔄 Fetching streamer analytics: ${streamerName} on ${platform}`);
    
    try {
      const analytics = await this.makeRequest<StreamAnalytics[]>(`/analytics/streamers/${platform}/${streamerName}?timeRange=${timeRange}`);
      console.log(`✅ Streamer analytics fetched: ${analytics.length} streams`);
      return analytics;
    } catch (error) {
      console.error('❌ Failed to fetch streamer analytics:', error);
      return [];
    }
  }

  async recordStreamView(streamId: string, userId: string, viewData: {
    startTime: string;
    endTime?: string;
    quality: string;
    device: string;
    platform: string;
    chatActivity: boolean;
    fullScreen: boolean;
    volume: number;
    bufferEvents: number;
    seekEvents: number;
    pauseEvents: number;
    metadata: Record<string, any>;
  }): Promise<void> {
    console.log(`📊 Recording stream view: ${streamId} by ${userId}`);
    
    try {
      await this.makeRequest('/analytics/views', {
        method: 'POST',
        body: JSON.stringify({
          streamId,
          userId,
          ...viewData,
          timestamp: new Date().toISOString(),
        }),
      });
      
      console.log(`✅ Stream view recorded: ${streamId}`);
    } catch (error) {
      console.error('❌ Failed to record stream view:', error);
    }
  }

  // Viewer Analytics
  async getViewerAnalytics(userId: string): Promise<ViewerAnalytics | null> {
    console.log(`🔄 Fetching viewer analytics: ${userId}`);
    
    try {
      const analytics = await this.makeRequest<ViewerAnalytics>(`/analytics/viewers/${userId}`);
      console.log(`✅ Viewer analytics fetched for ${userId}`);
      return analytics;
    } catch (error) {
      console.error('❌ Failed to fetch viewer analytics:', error);
      return null;
    }
  }

  async updateViewerActivity(userId: string, activity: {
    type: 'stream_view' | 'chat_message' | 'clip_create' | 'social_share' | 'follow' | 'like' | 'comment';
    streamId?: string;
    streamerName?: string;
    platform?: string;
    duration?: number;
    metadata: Record<string, any>;
  }): Promise<void> {
    console.log(`📊 Updating viewer activity: ${userId} - ${activity.type}`);
    
    try {
      await this.makeRequest('/analytics/viewers/activity', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          ...activity,
          timestamp: new Date().toISOString(),
        }),
      });
      
      console.log(`✅ Viewer activity updated: ${userId}`);
    } catch (error) {
      console.error('❌ Failed to update viewer activity:', error);
    }
  }

  // Platform Analytics
  async getPlatformAnalytics(platform?: string): Promise<PlatformAnalytics[]> {
    console.log(`🔄 Fetching platform analytics${platform ? ` for ${platform}` : ''}`);
    
    try {
      const endpoint = platform ? `/analytics/platforms/${platform}` : '/analytics/platforms';
      const analytics = await this.makeRequest<PlatformAnalytics[]>(endpoint);
      console.log(`✅ Platform analytics fetched: ${analytics.length} platforms`);
      return analytics;
    } catch (error) {
      console.error('❌ Failed to fetch platform analytics:', error);
      return [];
    }
  }

  // Trending & Discovery
  async getTrendingMetrics(type?: string, period: string = '24h'): Promise<TrendingMetrics[]> {
    console.log(`🔄 Fetching trending metrics${type ? ` for ${type}` : ''} (${period})`);
    
    try {
      const params = new URLSearchParams({ period });
      if (type) params.append('type', type);
      
      const metrics = await this.makeRequest<TrendingMetrics[]>(`/analytics/trending?${params.toString()}`);
      console.log(`✅ Trending metrics fetched: ${metrics.length} items`);
      return metrics;
    } catch (error) {
      console.error('❌ Failed to fetch trending metrics:', error);
      return [];
    }
  }

  async getRecommendations(userId: string, type: 'streams' | 'streamers' | 'categories' = 'streams'): Promise<UnifiedStream[]> {
    console.log(`🔄 Fetching recommendations for ${userId}: ${type}`);
    
    try {
      const recommendations = await this.makeRequest<UnifiedStream[]>(`/analytics/recommendations/${userId}?type=${type}`);
      console.log(`✅ Recommendations fetched: ${recommendations.length} items`);
      return recommendations;
    } catch (error) {
      console.error('❌ Failed to fetch recommendations:', error);
      return [];
    }
  }

  // Insights & Reports
  async generateInsightReport(params: {
    type: 'stream' | 'viewer' | 'platform' | 'trend' | 'comparative';
    entityId: string;
    timeRange: string;
    metrics: string[];
    includeRecommendations: boolean;
  }): Promise<InsightReport | null> {
    console.log(`🔄 Generating insight report: ${params.type} for ${params.entityId}`);
    
    try {
      const report = await this.makeRequest<InsightReport>('/analytics/insights/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      
      console.log(`✅ Insight report generated: ${report.title}`);
      return report;
    } catch (error) {
      console.error('❌ Failed to generate insight report:', error);
      return null;
    }
  }

  async getInsightReports(userId: string, limit: number = 10): Promise<InsightReport[]> {
    console.log(`🔄 Fetching insight reports for ${userId}`);
    
    try {
      const reports = await this.makeRequest<InsightReport[]>(`/analytics/insights/${userId}?limit=${limit}`);
      console.log(`✅ Insight reports fetched: ${reports.length} reports`);
      return reports;
    } catch (error) {
      console.error('❌ Failed to fetch insight reports:', error);
      return [];
    }
  }

  // Real-time Analytics
  async getRealTimeMetrics(streamId: string): Promise<{
    currentViewers: number;
    peakViewers: number;
    chatRate: number;
    newFollowers: number;
    donationCount: number;
    clipCount: number;
    engagement: number;
    quality: string;
    uptime: number;
    latency: number;
  } | null> {
    console.log(`🔄 Fetching real-time metrics for stream: ${streamId}`);
    
    try {
      const metrics = await this.makeRequest<any>(`/analytics/realtime/${streamId}`);
      console.log(`✅ Real-time metrics fetched for ${streamId}`);
      return metrics;
    } catch (error) {
      console.error('❌ Failed to fetch real-time metrics:', error);
      return null;
    }
  }

  // Comparative Analytics
  async compareStreamers(streamers: { name: string; platform: string }[], timeRange: string = '30d'): Promise<{
    streamers: { name: string; platform: string; metrics: any }[];
    comparison: {
      metric: string;
      values: { streamer: string; value: number }[];
      winner: string;
    }[];
  } | null> {
    console.log(`🔄 Comparing streamers: ${streamers.map(s => s.name).join(', ')}`);
    
    try {
      const comparison = await this.makeRequest<any>('/analytics/compare/streamers', {
        method: 'POST',
        body: JSON.stringify({ streamers, timeRange }),
      });
      
      console.log(`✅ Streamer comparison completed`);
      return comparison;
    } catch (error) {
      console.error('❌ Failed to compare streamers:', error);
      return null;
    }
  }

  async comparePlatforms(platforms: string[], timeRange: string = '30d'): Promise<{
    platforms: { name: string; metrics: any }[];
    comparison: {
      metric: string;
      values: { platform: string; value: number }[];
      winner: string;
    }[];
  } | null> {
    console.log(`🔄 Comparing platforms: ${platforms.join(', ')}`);
    
    try {
      const comparison = await this.makeRequest<any>('/analytics/compare/platforms', {
        method: 'POST',
        body: JSON.stringify({ platforms, timeRange }),
      });
      
      console.log(`✅ Platform comparison completed`);
      return comparison;
    } catch (error) {
      console.error('❌ Failed to compare platforms:', error);
      return null;
    }
  }

  // Predictive Analytics
  async predictViewerGrowth(streamerId: string, platform: string, timeframe: string = '7d'): Promise<{
    current: number;
    predicted: number;
    confidence: number;
    factors: { factor: string; impact: number }[];
    recommendations: string[];
  } | null> {
    console.log(`🔄 Predicting viewer growth for ${streamerId} on ${platform}`);
    
    try {
      const prediction = await this.makeRequest<any>(`/analytics/predict/growth/${platform}/${streamerId}?timeframe=${timeframe}`);
      console.log(`✅ Growth prediction completed for ${streamerId}`);
      return prediction;
    } catch (error) {
      console.error('❌ Failed to predict growth:', error);
      return null;
    }
  }

  // Export & Reporting
  async exportAnalytics(params: {
    type: 'stream' | 'viewer' | 'platform';
    entityId: string;
    timeRange: string;
    format: 'json' | 'csv' | 'pdf';
    metrics: string[];
  }): Promise<string | null> {
    console.log(`🔄 Exporting analytics: ${params.type} for ${params.entityId}`);
    
    try {
      const response = await this.makeRequest<{ downloadUrl: string }>('/analytics/export', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      
      console.log(`✅ Analytics export ready: ${response.downloadUrl}`);
      return response.downloadUrl;
    } catch (error) {
      console.error('❌ Failed to export analytics:', error);
      return null;
    }
  }

  // Utility Methods
  calculateTrendingScore(metrics: {
    viewers: number;
    growth: number;
    engagement: number;
    social: number;
    recency: number;
  }): number {
    const weights = {
      viewers: 0.3,
      growth: 0.25,
      engagement: 0.2,
      social: 0.15,
      recency: 0.1,
    };
    
    return Object.entries(metrics).reduce((score, [key, value]) => {
      const weight = weights[key as keyof typeof weights] || 0;
      return score + (value * weight);
    }, 0);
  }

  formatAnalyticsData(data: any[], chartType: string): any[] {
    switch (chartType) {
      case 'line':
        return data.map(item => ({
          x: item.timestamp,
          y: item.value,
          label: item.label,
        }));
      
      case 'bar':
        return data.map(item => ({
          category: item.category,
          value: item.value,
          color: item.color,
        }));
      
      case 'pie':
        return data.map(item => ({
          label: item.label,
          value: item.value,
          percentage: item.percentage,
          color: item.color,
        }));
      
      default:
        return data;
    }
  }

  clearCache(): void {
    this.cache.clear();
    console.log('✅ Analytics cache cleared');
  }
}

export const analyticsService = new AnalyticsService();

// Helper functions for easier importing
export const getStreamAnalytics = async (streamId: string) => {
  return analyticsService.getStreamAnalytics(streamId);
};

export const getViewerAnalytics = async (userId: string) => {
  return analyticsService.getViewerAnalytics(userId);
};

export const getTrendingMetrics = async (type?: string, period?: string) => {
  return analyticsService.getTrendingMetrics(type, period);
};

export const recordStreamView = async (streamId: string, userId: string, viewData: any) => {
  return analyticsService.recordStreamView(streamId, userId, viewData);
};

export const generateInsightReport = async (params: any) => {
  return analyticsService.generateInsightReport(params);
};