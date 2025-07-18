interface KickStream {
  id: string;
  slug: string;
  channel_id: string;
  channel: {
    id: string;
    user_id: string;
    slug: string;
    playback_url: string;
    name_updated_at: string | null;
    vod_enabled: boolean;
    subscription_enabled: boolean;
    can_host: boolean;
    chatroom: {
      id: string;
      chatable_type: string;
      channel_id: string;
      created_at: string;
      updated_at: string;
      chat_mode_old: string;
      chat_mode: string;
      slow_mode: boolean;
      chatable_id: string;
      followers_mode: boolean;
      subscribers_mode: boolean;
      emotes_mode: boolean;
      message_interval: number;
      following_min_duration: number;
    };
    user: {
      id: string;
      username: string;
      agreed_to_terms: boolean;
      email_verified_at: string | null;
      bio: string;
      country: string;
      state: string;
      city: string;
      instagram: string;
      twitter: string;
      youtube: string;
      discord: string;
      tiktok: string;
      facebook: string;
      profile_pic: string;
    };
    livestream: {
      id: string;
      channel_id: string;
      session_title: string;
      source: string | null;
      twitch_channel: string | null;
      duration: number;
      language: string;
      is_live: boolean;
      risk_level_id: string | null;
      start_time: string;
      viewer_count: number;
      thumbnail: {
        src: string;
        srcset: string;
      };
      viewers: number;
    } | null;
    role: string | null;
    muted: boolean;
    follower_badges: boolean;
    offline_banner_image: string | null;
    verified: boolean;
    recent_categories: any[];
    category: {
      id: string;
      name: string;
      slug: string;
      tags: string[];
      description: string | null;
      deleted_at: string | null;
      banner: string | null;
      category_icon: string;
    } | null;
    previous_livestreams: any[];
  };
  created_at: string;
  session_title: string;
  source: string | null;
  twitch_channel: string | null;
  duration: number;
  language: string;
  is_live: boolean;
  risk_level_id: string | null;
  start_time: string;
  viewer_count: number;
  thumbnail: {
    src: string;
    srcset: string;
  };
  viewers: number;
}

interface KickCategory {
  id: string;
  name: string;
  slug: string;
  tags: string[];
  description: string | null;
  deleted_at: string | null;
  banner: string | null;
  category_icon: string;
}

interface KickChannel {
  id: string;
  user_id: string;
  slug: string;
  playback_url: string;
  name_updated_at: string | null;
  vod_enabled: boolean;
  subscription_enabled: boolean;
  can_host: boolean;
  user: {
    id: string;
    username: string;
    bio: string;
    profile_pic: string;
    verified: boolean;
  };
  livestream: KickStream | null;
  verified: boolean;
  follower_count: number;
  category: KickCategory | null;
}

interface KickApiResponse<T> {
  data: T[];
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta?: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

class KickAPI {
  private readonly baseUrl = 'https://kick.com/api/v1';
  private readonly baseUrlV2 = 'https://kick.com/api/v2';

  constructor() {
    console.log('Kick API initialized');
  }

  private async makeRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          url.searchParams.append(key, value);
        }
      });
    }

    // Add headers to mimic browser request
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://kick.com/',
    };

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Kick API request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Kick API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getLiveStreams(limit: number = 20, page: number = 1): Promise<KickApiResponse<KickStream>> {
    console.log('🔄 Fetching live streams from Kick API...');
    
    try {
      const params: Record<string, string> = {
        limit: limit.toString(),
        page: page.toString(),
      };

      const response = await this.makeRequest<KickApiResponse<KickStream>>('/channels/live', params);
      
      // Filter only live streams
      const liveStreams = response.data.filter(stream => stream.is_live);
      
      console.log(`✅ Fetched ${liveStreams.length} live streams from Kick`);
      
      return {
        ...response,
        data: liveStreams,
      };
    } catch (error) {
      console.error('❌ Failed to fetch Kick live streams:', error);
      throw error;
    }
  }

  async getStreamsByCategory(categorySlug: string, limit: number = 20): Promise<KickStream[]> {
    console.log(`🔄 Fetching Kick streams for category: ${categorySlug}`);
    
    try {
      const params: Record<string, string> = {
        limit: limit.toString(),
      };

      const response = await this.makeRequest<KickApiResponse<KickStream>>(`/channels/live/${categorySlug}`, params);
      
      console.log(`✅ Fetched ${response.data.length} streams for category ${categorySlug}`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch Kick streams by category:', error);
      throw error;
    }
  }

  async searchChannels(query: string, limit: number = 20): Promise<KickChannel[]> {
    console.log(`🔍 Searching Kick channels for: "${query}"`);
    
    try {
      const params: Record<string, string> = {
        q: query,
        limit: limit.toString(),
      };

      const response = await this.makeRequest<KickApiResponse<KickChannel>>('/search/channels', params);
      
      console.log(`✅ Kick channel search returned ${response.data.length} results`);
      return response.data;
    } catch (error) {
      console.error('❌ Kick channel search failed:', error);
      throw error;
    }
  }

  async getChannelInfo(channelSlug: string): Promise<KickChannel | null> {
    try {
      const response = await this.makeRequest<KickChannel>(`/channels/${channelSlug}`);
      return response;
    } catch (error) {
      console.error('❌ Failed to get Kick channel info:', error);
      return null;
    }
  }

  async getCategories(): Promise<KickCategory[]> {
    try {
      const response = await this.makeRequest<KickApiResponse<KickCategory>>('/categories');
      return response.data || [];
    } catch (error) {
      console.error('❌ Failed to get Kick categories:', error);
      return [];
    }
  }

  async getFeaturedStreams(limit: number = 20): Promise<KickStream[]> {
    console.log('🔄 Fetching featured streams from Kick...');
    
    try {
      const params: Record<string, string> = {
        limit: limit.toString(),
      };

      const response = await this.makeRequest<KickApiResponse<KickStream>>('/channels/featured', params);
      
      console.log(`✅ Fetched ${response.data.length} featured streams`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch featured Kick streams:', error);
      throw error;
    }
  }

  generateEmbedUrl(channelSlug: string, options: { 
    autoplay?: boolean; 
    muted?: boolean; 
    controls?: boolean;
  } = {}): string {
    const { autoplay = true, muted = true, controls = false } = options;
    
    if (!channelSlug) {
      throw new Error('Channel slug is required for Kick embed');
    }

    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      muted: muted ? '1' : '0',
      controls: controls ? '1' : '0',
    });

    const embedUrl = `https://player.kick.com/${channelSlug}?${params.toString()}`;
    console.log(`🔗 Generated Kick embed URL: ${embedUrl}`);
    
    return embedUrl;
  }

  getThumbnailUrl(stream: KickStream): string {
    return stream.thumbnail?.src || 'https://kick.com/images/subcategories/placeholder.png';
  }

  async getPopularStreams(limit: number = 20): Promise<KickStream[]> {
    console.log('🔄 Fetching popular streams from Kick...');
    
    try {
      // Get live streams and sort by viewer count
      const liveStreams = await this.getLiveStreams(limit * 2); // Get more to filter
      
      // Sort by viewer count and take top streams
      const popularStreams = liveStreams.data
        .filter(stream => stream.is_live && stream.viewer_count > 0)
        .sort((a, b) => b.viewer_count - a.viewer_count)
        .slice(0, limit);
      
      console.log(`✅ Fetched ${popularStreams.length} popular streams`);
      return popularStreams;
    } catch (error) {
      console.error('❌ Failed to fetch popular Kick streams:', error);
      throw error;
    }
  }

  async getStreamPlaybackUrl(channelSlug: string): Promise<string | null> {
    try {
      const channel = await this.getChannelInfo(channelSlug);
      return channel?.playback_url || null;
    } catch (error) {
      console.error('❌ Failed to get Kick stream playback URL:', error);
      return null;
    }
  }
}

export const kickApi = new KickAPI();

// Wrapper functions for easier importing
export const fetchKickLiveStreams = async (limit: number = 20, page: number = 1) => {
  const result = await kickApi.getLiveStreams(limit, page);
  return result.data;
};

export const searchKickChannels = async (query: string, limit: number = 20) => {
  return kickApi.searchChannels(query, limit);
};

export const fetchKickStreamsByCategory = async (categorySlug: string, limit: number = 20) => {
  return kickApi.getStreamsByCategory(categorySlug, limit);
};

export const fetchKickCategories = async () => {
  return kickApi.getCategories();
};

export type { KickStream, KickChannel, KickCategory, KickApiResponse };