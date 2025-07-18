import { twitchApi, TwitchStream } from './twitchApi';

// Generic stream interface that works across platforms
export interface UniversalStream {
  id: string;
  platform: 'twitch' | 'youtube' | 'kick' | 'facebook';
  title: string;
  streamerName: string;
  streamerDisplayName: string;
  game: string;
  viewerCount: number;
  isLive: boolean;
  thumbnailUrl: string;
  streamUrl: string;
  embedUrl: string;
  profileImageUrl: string;
  language: string;
  startTime: string;
  tags: string[];
  isMature: boolean;
  // Platform-specific data
  platformData: any;
}

export interface PlatformConfig {
  name: string;
  displayName: string;
  color: string;
  icon: string;
  baseUrl: string;
  apiUrl: string;
  embedTemplate: string;
  chatUrl?: string;
  features: {
    chat: boolean;
    clips: boolean;
    vods: boolean;
    search: boolean;
    categories: boolean;
  };
}

// Platform configurations
export const PLATFORMS: Record<string, PlatformConfig> = {
  twitch: {
    name: 'twitch',
    displayName: 'Twitch',
    color: '#9146FF',
    icon: '🎮',
    baseUrl: 'https://twitch.tv',
    apiUrl: 'https://api.twitch.tv/helix',
    embedTemplate: 'https://player.twitch.tv/?channel={channel}&parent=localhost&parent=127.0.0.1&parent=expo.dev&parent=exp.host&muted={muted}&autoplay={autoplay}',
    chatUrl: 'https://www.twitch.tv/embed/{channel}/chat?parent=localhost',
    features: {
      chat: true,
      clips: true,
      vods: true,
      search: true,
      categories: true,
    },
  },
  youtube: {
    name: 'youtube',
    displayName: 'YouTube',
    color: '#FF0000',
    icon: '📺',
    baseUrl: 'https://youtube.com',
    apiUrl: 'https://www.googleapis.com/youtube/v3',
    embedTemplate: 'https://www.youtube.com/embed/{videoId}?autoplay={autoplay}&mute={muted}',
    features: {
      chat: true,
      clips: false,
      vods: true,
      search: true,
      categories: true,
    },
  },
  kick: {
    name: 'kick',
    displayName: 'Kick',
    color: '#53FC18',
    icon: '⚡',
    baseUrl: 'https://kick.com',
    apiUrl: 'https://kick.com/api/v1',
    embedTemplate: 'https://player.kick.com/{channel}?autoplay={autoplay}&muted={muted}',
    chatUrl: 'https://kick.com/{channel}/chatroom',
    features: {
      chat: true,
      clips: true,
      vods: true,
      search: true,
      categories: true,
    },
  },
  facebook: {
    name: 'facebook',
    displayName: 'Facebook Gaming',
    color: '#1877F2',
    icon: '👥',
    baseUrl: 'https://facebook.com/gaming',
    apiUrl: 'https://graph.facebook.com',
    embedTemplate: 'https://www.facebook.com/plugins/video.php?href={url}&autoplay={autoplay}&muted={muted}',
    features: {
      chat: true,
      clips: false,
      vods: true,
      search: true,
      categories: true,
    },
  },
};

// YouTube Live Streams API (requires API key)
class YouTubeAPI {
  private readonly apiKey = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    if (!this.apiKey) {
      console.warn('YouTube API key not found. YouTube features will be limited.');
    }
  }

  async searchLiveStreams(query?: string, maxResults: number = 20): Promise<UniversalStream[]> {
    if (!this.apiKey) {
      console.warn('YouTube API key required');
      return [];
    }

    try {
      const searchParams = new URLSearchParams({
        part: 'snippet',
        type: 'video',
        eventType: 'live',
        maxResults: maxResults.toString(),
        key: this.apiKey,
      });

      if (query) {
        searchParams.append('q', query);
      }

      const response = await fetch(`${this.baseUrl}/search?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();

      // Get additional details for the videos
      const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
      const detailsResponse = await fetch(
        `${this.baseUrl}/videos?part=snippet,statistics,liveStreamingDetails&id=${videoIds}&key=${this.apiKey}`
      );

      const detailsData = await detailsResponse.json();

      return detailsData.items.map((item: any): UniversalStream => ({
        id: item.id,
        platform: 'youtube',
        title: item.snippet.title,
        streamerName: item.snippet.channelTitle,
        streamerDisplayName: item.snippet.channelTitle,
        game: item.snippet.categoryId || 'Gaming', // Would need category mapping
        viewerCount: parseInt(item.liveStreamingDetails?.concurrentViewers || '0'),
        isLive: true,
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || '',
        streamUrl: `https://youtube.com/watch?v=${item.id}`,
        embedUrl: PLATFORMS.youtube.embedTemplate
          .replace('{videoId}', item.id)
          .replace('{autoplay}', 'true')
          .replace('{muted}', 'true'),
        profileImageUrl: item.snippet.thumbnails.default?.url || '',
        language: item.snippet.defaultLanguage || 'en',
        startTime: item.liveStreamingDetails?.actualStartTime || item.snippet.publishedAt,
        tags: item.snippet.tags || [],
        isMature: false, // YouTube doesn't provide this directly
        platformData: item,
      }));
    } catch (error) {
      console.error('Error fetching YouTube live streams:', error);
      return [];
    }
  }
}

// Kick API (unofficial/limited)
class KickAPI {
  private readonly baseUrl = 'https://kick.com/api/v1';

  async getTopStreams(limit: number = 20): Promise<UniversalStream[]> {
    try {
      // Note: This is a simplified example. Kick's API is not officially documented
      const response = await fetch(`${this.baseUrl}/channels?limit=${limit}&live=true`);
      
      if (!response.ok) {
        throw new Error(`Kick API error: ${response.status}`);
      }

      const data = await response.json();

      return data.map((channel: any): UniversalStream => ({
        id: channel.id.toString(),
        platform: 'kick',
        title: channel.session_title || 'Live Stream',
        streamerName: channel.slug,
        streamerDisplayName: channel.user?.username || channel.slug,
        game: channel.category?.name || 'Gaming',
        viewerCount: channel.viewers_count || 0,
        isLive: channel.is_live,
        thumbnailUrl: channel.thumbnail || '',
        streamUrl: `https://kick.com/${channel.slug}`,
        embedUrl: PLATFORMS.kick.embedTemplate
          .replace('{channel}', channel.slug)
          .replace('{autoplay}', 'true')
          .replace('{muted}', 'true'),
        profileImageUrl: channel.user?.profile_pic || '',
        language: 'en', // Kick doesn't provide language info
        startTime: channel.created_at,
        tags: [],
        isMature: false,
        platformData: channel,
      }));
    } catch (error) {
      console.error('Error fetching Kick streams:', error);
      return [];
    }
  }
}

// Multi-Platform Streaming API
class MultiPlatformStreamingAPI {
  private youtubeApi = new YouTubeAPI();
  private kickApi = new KickAPI();

  // Convert Twitch stream to universal format
  private convertTwitchStream(stream: TwitchStream): UniversalStream {
    return {
      id: stream.id,
      platform: 'twitch',
      title: stream.title,
      streamerName: stream.user_login,
      streamerDisplayName: stream.user_name,
      game: stream.game_name,
      viewerCount: stream.viewer_count,
      isLive: stream.type === 'live',
      thumbnailUrl: twitchApi.getThumbnailUrl(stream.thumbnail_url, 320, 180),
      streamUrl: `https://twitch.tv/${stream.user_login}`,
      embedUrl: twitchApi.generateEmbedUrl(stream.user_login),
      profileImageUrl: twitchApi.getProfileImageUrl(stream.user_login),
      language: stream.language,
      startTime: stream.started_at,
      tags: stream.tag_ids || [],
      isMature: stream.is_mature,
      platformData: stream,
    };
  }

  // Get top streams from all platforms
  async getTopStreams(platforms: string[] = ['twitch'], limit: number = 20): Promise<{
    streams: UniversalStream[];
    errors: { platform: string; error: string }[];
  }> {
    const results: UniversalStream[] = [];
    const errors: { platform: string; error: string }[] = [];

    const promises = platforms.map(async (platform) => {
      try {
        switch (platform) {
          case 'twitch': {
            const response = await twitchApi.getTopStreams(limit);
            return response.data.map(stream => this.convertTwitchStream(stream));
          }
          case 'youtube': {
            return await this.youtubeApi.searchLiveStreams(undefined, limit);
          }
          case 'kick': {
            return await this.kickApi.getTopStreams(limit);
          }
          default:
            throw new Error(`Unsupported platform: ${platform}`);
        }
      } catch (error) {
        console.error(`Error fetching streams from ${platform}:`, error);
        errors.push({
          platform,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return [];
      }
    });

    const platformResults = await Promise.all(promises);
    platformResults.forEach(streams => results.push(...streams));

    // Sort by viewer count
    results.sort((a, b) => b.viewerCount - a.viewerCount);

    return {
      streams: results.slice(0, limit),
      errors,
    };
  }

  // Search streams across platforms
  async searchStreams(
    query: string,
    platforms: string[] = ['twitch'],
    limit: number = 20
  ): Promise<{
    streams: UniversalStream[];
    errors: { platform: string; error: string }[];
  }> {
    const results: UniversalStream[] = [];
    const errors: { platform: string; error: string }[] = [];

    const promises = platforms.map(async (platform) => {
      try {
        switch (platform) {
          case 'twitch': {
            const response = await twitchApi.searchStreams(query, limit);
            return response.data.map(stream => this.convertTwitchStream(stream));
          }
          case 'youtube': {
            return await this.youtubeApi.searchLiveStreams(query, limit);
          }
          case 'kick': {
            // Kick doesn't have a search API, return empty for now
            return [];
          }
          default:
            throw new Error(`Unsupported platform: ${platform}`);
        }
      } catch (error) {
        console.error(`Error searching streams on ${platform}:`, error);
        errors.push({
          platform,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return [];
      }
    });

    const platformResults = await Promise.all(promises);
    platformResults.forEach(streams => results.push(...streams));

    // Sort by relevance (viewer count for now)
    results.sort((a, b) => b.viewerCount - a.viewerCount);

    return {
      streams: results.slice(0, limit),
      errors,
    };
  }

  // Get platform configuration
  getPlatformConfig(platform: string): PlatformConfig | null {
    return PLATFORMS[platform] || null;
  }

  // Get all supported platforms
  getSupportedPlatforms(): PlatformConfig[] {
    return Object.values(PLATFORMS);
  }

  // Generate embed URL for any platform
  generateEmbedUrl(stream: UniversalStream, options: {
    autoplay?: boolean;
    muted?: boolean;
  } = {}): string {
    const { autoplay = true, muted = true } = options;
    const config = this.getPlatformConfig(stream.platform);
    
    if (!config) {
      return stream.embedUrl;
    }

    let embedUrl = config.embedTemplate;
    
    switch (stream.platform) {
      case 'twitch':
        embedUrl = embedUrl
          .replace('{channel}', stream.streamerName)
          .replace('{autoplay}', autoplay.toString())
          .replace('{muted}', muted.toString());
        break;
      case 'youtube':
        embedUrl = embedUrl
          .replace('{videoId}', stream.id)
          .replace('{autoplay}', autoplay ? '1' : '0')
          .replace('{muted}', muted ? '1' : '0');
        break;
      case 'kick':
        embedUrl = embedUrl
          .replace('{channel}', stream.streamerName)
          .replace('{autoplay}', autoplay.toString())
          .replace('{muted}', muted.toString());
        break;
      case 'facebook':
        embedUrl = embedUrl
          .replace('{url}', encodeURIComponent(stream.streamUrl))
          .replace('{autoplay}', autoplay.toString())
          .replace('{muted}', muted.toString());
        break;
    }

    return embedUrl;
  }

  // Get chat URL for platforms that support it
  getChatUrl(stream: UniversalStream): string | null {
    const config = this.getPlatformConfig(stream.platform);
    
    if (!config || !config.chatUrl || !config.features.chat) {
      return null;
    }

    return config.chatUrl.replace('{channel}', stream.streamerName);
  }

  // Check if platform supports feature
  platformSupports(platform: string, feature: keyof PlatformConfig['features']): boolean {
    const config = this.getPlatformConfig(platform);
    return config?.features[feature] || false;
  }
}

export const multiPlatformApi = new MultiPlatformStreamingAPI();

// Export helper functions
export const getPlatformColor = (platform: string): string => {
  return PLATFORMS[platform]?.color || '#6366F1';
};

export const getPlatformIcon = (platform: string): string => {
  return PLATFORMS[platform]?.icon || '📺';
};

export const getPlatformDisplayName = (platform: string): string => {
  return PLATFORMS[platform]?.displayName || platform.charAt(0).toUpperCase() + platform.slice(1);
};

export type { UniversalStream, PlatformConfig };