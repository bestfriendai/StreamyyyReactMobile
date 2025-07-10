import { twitchApi, TwitchStream } from './twitchApi';
import { youtubeApi, YouTubeStream } from './youtubeApi';
import { kickApi, KickStream } from './kickApi';

export type Platform = 'twitch' | 'youtube' | 'kick';

export interface UnifiedStream {
  id: string;
  platform: Platform;
  title: string;
  streamerName: string;
  streamerDisplayName: string;
  viewerCount: number;
  thumbnailUrl: string;
  profileImageUrl: string;
  category: string;
  isLive: boolean;
  startedAt: string;
  embedUrl: string;
  language?: string;
  tags?: string[];
  description?: string;
  originalData: TwitchStream | YouTubeStream | KickStream;
}

export interface PlatformStats {
  platform: Platform;
  totalStreams: number;
  averageViewers: number;
  topCategory: string;
  isOnline: boolean;
}

class PlatformService {
  private platformColors = {
    twitch: '#9146FF',
    youtube: '#FF0000',
    kick: '#53FC18',
  };

  private platformIcons = {
    twitch: 'twitch',
    youtube: 'youtube',
    kick: 'kick',
  };

  constructor() {
    console.log('Platform Service initialized');
  }

  private normalizeTwitchStream(stream: TwitchStream): UnifiedStream {
    return {
      id: `twitch_${stream.id}`,
      platform: 'twitch',
      title: stream.title,
      streamerName: stream.user_login,
      streamerDisplayName: stream.user_name,
      viewerCount: stream.viewer_count,
      thumbnailUrl: twitchApi.getThumbnailUrl(stream.thumbnail_url),
      profileImageUrl: twitchApi.getProfileImageUrl(stream.user_login),
      category: stream.game_name,
      isLive: stream.type === 'live',
      startedAt: stream.started_at,
      embedUrl: twitchApi.generateEmbedUrl(stream.user_login),
      language: stream.language,
      tags: stream.tag_ids,
      originalData: stream,
    };
  }

  private normalizeYouTubeStream(stream: YouTubeStream): UnifiedStream {
    return {
      id: `youtube_${stream.id}`,
      platform: 'youtube',
      title: stream.title,
      streamerName: stream.channelTitle,
      streamerDisplayName: stream.channelTitle,
      viewerCount: stream.viewerCount,
      thumbnailUrl: stream.thumbnailUrl,
      profileImageUrl: youtubeApi.getThumbnailUrl(stream.channelId, 'high'),
      category: stream.categoryId || 'Live',
      isLive: stream.isLive,
      startedAt: stream.publishedAt,
      embedUrl: youtubeApi.generateEmbedUrl(stream.id),
      description: stream.description,
      tags: stream.tags,
      originalData: stream,
    };
  }

  private normalizeKickStream(stream: KickStream): UnifiedStream {
    return {
      id: `kick_${stream.id}`,
      platform: 'kick',
      title: stream.session_title,
      streamerName: stream.channel.slug,
      streamerDisplayName: stream.channel.user.username,
      viewerCount: stream.viewer_count,
      thumbnailUrl: kickApi.getThumbnailUrl(stream),
      profileImageUrl: stream.channel.user.profile_pic,
      category: stream.channel.category?.name || 'Live',
      isLive: stream.is_live,
      startedAt: stream.start_time,
      embedUrl: kickApi.generateEmbedUrl(stream.channel.slug),
      language: stream.language,
      originalData: stream,
    };
  }

  async getAllLiveStreams(limit: number = 20): Promise<UnifiedStream[]> {
    console.log('🔄 Fetching live streams from all platforms...');
    
    try {
      const [twitchStreams, youtubeStreams, kickStreams] = await Promise.allSettled([
        twitchApi.getTopStreams(Math.ceil(limit / 3)),
        youtubeApi.getLiveStreams(Math.ceil(limit / 3)),
        kickApi.getLiveStreams(Math.ceil(limit / 3)),
      ]);

      const allStreams: UnifiedStream[] = [];

      // Process Twitch streams
      if (twitchStreams.status === 'fulfilled') {
        const normalizedTwitch = twitchStreams.value.data.map(stream => 
          this.normalizeTwitchStream(stream)
        );
        allStreams.push(...normalizedTwitch);
      } else {
        console.warn('Failed to fetch Twitch streams:', twitchStreams.reason);
      }

      // Process YouTube streams
      if (youtubeStreams.status === 'fulfilled') {
        const normalizedYouTube = youtubeStreams.value.items.map(stream => 
          this.normalizeYouTubeStream(stream)
        );
        allStreams.push(...normalizedYouTube);
      } else {
        console.warn('Failed to fetch YouTube streams:', youtubeStreams.reason);
      }

      // Process Kick streams
      if (kickStreams.status === 'fulfilled') {
        const normalizedKick = kickStreams.value.data.map(stream => 
          this.normalizeKickStream(stream)
        );
        allStreams.push(...normalizedKick);
      } else {
        console.warn('Failed to fetch Kick streams:', kickStreams.reason);
      }

      // Sort by viewer count and limit results
      const sortedStreams = allStreams
        .sort((a, b) => b.viewerCount - a.viewerCount)
        .slice(0, limit);

      console.log(`✅ Fetched ${sortedStreams.length} streams from all platforms`);
      return sortedStreams;
    } catch (error) {
      console.error('❌ Failed to fetch streams from all platforms:', error);
      throw error;
    }
  }

  async getStreamsByPlatform(platform: Platform, limit: number = 20): Promise<UnifiedStream[]> {
    console.log(`🔄 Fetching streams from ${platform}...`);
    
    try {
      switch (platform) {
        case 'twitch': {
          const response = await twitchApi.getTopStreams(limit);
          return response.data.map(stream => this.normalizeTwitchStream(stream));
        }
        case 'youtube': {
          const response = await youtubeApi.getLiveStreams(limit);
          return response.items.map(stream => this.normalizeYouTubeStream(stream));
        }
        case 'kick': {
          const response = await kickApi.getLiveStreams(limit);
          return response.data.map(stream => this.normalizeKickStream(stream));
        }
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      console.error(`❌ Failed to fetch streams from ${platform}:`, error);
      throw error;
    }
  }

  async searchStreams(query: string, platforms: Platform[] = ['twitch', 'youtube', 'kick'], limit: number = 20): Promise<UnifiedStream[]> {
    console.log(`🔍 Searching for "${query}" across platforms: ${platforms.join(', ')}`);
    
    try {
      const searchPromises = platforms.map(async (platform) => {
        const perPlatformLimit = Math.ceil(limit / platforms.length);
        
        switch (platform) {
          case 'twitch': {
            const response = await twitchApi.searchStreams(query, perPlatformLimit);
            return response.data.map(stream => this.normalizeTwitchStream(stream));
          }
          case 'youtube': {
            const response = await youtubeApi.searchStreams(query, perPlatformLimit);
            return response.items.map(stream => this.normalizeYouTubeStream(stream));
          }
          case 'kick': {
            const channels = await kickApi.searchChannels(query, perPlatformLimit);
            return channels
              .filter(channel => channel.livestream && channel.livestream.is_live)
              .map(channel => this.normalizeKickStream(channel.livestream!));
          }
          default:
            return [];
        }
      });

      const results = await Promise.allSettled(searchPromises);
      const allStreams: UnifiedStream[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allStreams.push(...result.value);
        } else {
          console.warn(`Search failed for ${platforms[index]}:`, result.reason);
        }
      });

      // Sort by relevance (viewer count) and limit results
      const sortedStreams = allStreams
        .sort((a, b) => b.viewerCount - a.viewerCount)
        .slice(0, limit);

      console.log(`✅ Search returned ${sortedStreams.length} results`);
      return sortedStreams;
    } catch (error) {
      console.error('❌ Multi-platform search failed:', error);
      throw error;
    }
  }

  async getPlatformStats(): Promise<PlatformStats[]> {
    console.log('📊 Fetching platform statistics...');
    
    try {
      const [twitchStreams, youtubeStreams, kickStreams] = await Promise.allSettled([
        twitchApi.getTopStreams(100),
        youtubeApi.getLiveStreams(100),
        kickApi.getLiveStreams(100),
      ]);

      const stats: PlatformStats[] = [];

      // Twitch stats
      if (twitchStreams.status === 'fulfilled') {
        const streams = twitchStreams.value.data;
        const totalViewers = streams.reduce((sum, stream) => sum + stream.viewer_count, 0);
        const categories = streams.map(s => s.game_name);
        const topCategory = this.getMostFrequent(categories);
        
        stats.push({
          platform: 'twitch',
          totalStreams: streams.length,
          averageViewers: Math.round(totalViewers / streams.length),
          topCategory: topCategory || 'Unknown',
          isOnline: true,
        });
      } else {
        stats.push({
          platform: 'twitch',
          totalStreams: 0,
          averageViewers: 0,
          topCategory: 'Unknown',
          isOnline: false,
        });
      }

      // YouTube stats
      if (youtubeStreams.status === 'fulfilled') {
        const streams = youtubeStreams.value.items;
        const totalViewers = streams.reduce((sum, stream) => sum + stream.viewerCount, 0);
        const categories = streams.map(s => s.categoryId || 'Live');
        const topCategory = this.getMostFrequent(categories);
        
        stats.push({
          platform: 'youtube',
          totalStreams: streams.length,
          averageViewers: Math.round(totalViewers / streams.length),
          topCategory: topCategory || 'Live',
          isOnline: true,
        });
      } else {
        stats.push({
          platform: 'youtube',
          totalStreams: 0,
          averageViewers: 0,
          topCategory: 'Live',
          isOnline: false,
        });
      }

      // Kick stats
      if (kickStreams.status === 'fulfilled') {
        const streams = kickStreams.value.data;
        const totalViewers = streams.reduce((sum, stream) => sum + stream.viewer_count, 0);
        const categories = streams.map(s => s.channel.category?.name || 'Live');
        const topCategory = this.getMostFrequent(categories);
        
        stats.push({
          platform: 'kick',
          totalStreams: streams.length,
          averageViewers: Math.round(totalViewers / streams.length),
          topCategory: topCategory || 'Live',
          isOnline: true,
        });
      } else {
        stats.push({
          platform: 'kick',
          totalStreams: 0,
          averageViewers: 0,
          topCategory: 'Live',
          isOnline: false,
        });
      }

      console.log('✅ Platform statistics fetched');
      return stats;
    } catch (error) {
      console.error('❌ Failed to fetch platform statistics:', error);
      throw error;
    }
  }

  private getMostFrequent(arr: string[]): string | null {
    if (arr.length === 0) return null;
    
    const frequency: { [key: string]: number } = {};
    arr.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    
    return Object.keys(frequency).reduce((a, b) => 
      frequency[a] > frequency[b] ? a : b
    );
  }

  getPlatformColor(platform: Platform): string {
    return this.platformColors[platform];
  }

  getPlatformIcon(platform: Platform): string {
    return this.platformIcons[platform];
  }

  generateEmbedUrl(stream: UnifiedStream): string {
    return stream.embedUrl;
  }

  async getRecommendedStreams(userPreferences: {
    platforms?: Platform[];
    categories?: string[];
    languages?: string[];
    minViewers?: number;
    maxViewers?: number;
  } = {}, limit: number = 20): Promise<UnifiedStream[]> {
    console.log('🎯 Fetching recommended streams based on preferences...');
    
    try {
      const platforms = userPreferences.platforms || ['twitch', 'youtube', 'kick'];
      const allStreams = await this.getAllLiveStreams(limit * 2); // Get more to filter
      
      let filteredStreams = allStreams.filter(stream => {
        // Platform filter
        if (!platforms.includes(stream.platform)) return false;
        
        // Category filter
        if (userPreferences.categories && userPreferences.categories.length > 0) {
          const streamCategory = stream.category.toLowerCase();
          const matchesCategory = userPreferences.categories.some(cat => 
            streamCategory.includes(cat.toLowerCase())
          );
          if (!matchesCategory) return false;
        }
        
        // Language filter
        if (userPreferences.languages && userPreferences.languages.length > 0 && stream.language) {
          if (!userPreferences.languages.includes(stream.language)) return false;
        }
        
        // Viewer count filter
        if (userPreferences.minViewers && stream.viewerCount < userPreferences.minViewers) {
          return false;
        }
        
        if (userPreferences.maxViewers && stream.viewerCount > userPreferences.maxViewers) {
          return false;
        }
        
        return true;
      });
      
      // If we don't have enough filtered results, add popular streams
      if (filteredStreams.length < limit) {
        const popularStreams = allStreams
          .filter(stream => !filteredStreams.some(fs => fs.id === stream.id))
          .slice(0, limit - filteredStreams.length);
        
        filteredStreams = [...filteredStreams, ...popularStreams];
      }
      
      console.log(`✅ Fetched ${filteredStreams.length} recommended streams`);
      return filteredStreams.slice(0, limit);
    } catch (error) {
      console.error('❌ Failed to fetch recommended streams:', error);
      throw error;
    }
  }
}

export const platformService = new PlatformService();

// Helper functions for easier importing
export const fetchAllLiveStreams = async (limit: number = 20) => {
  return platformService.getAllLiveStreams(limit);
};

export const fetchStreamsByPlatform = async (platform: Platform, limit: number = 20) => {
  return platformService.getStreamsByPlatform(platform, limit);
};

export const searchAllPlatforms = async (query: string, platforms?: Platform[], limit?: number) => {
  return platformService.searchStreams(query, platforms, limit);
};

export const fetchPlatformStats = async () => {
  return platformService.getPlatformStats();
};

export const fetchRecommendedStreams = async (preferences: any = {}, limit: number = 20) => {
  return platformService.getRecommendedStreams(preferences, limit);
};