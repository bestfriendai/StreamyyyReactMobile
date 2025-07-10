interface YouTubeStream {
  id: string;
  channelId: string;
  channelTitle: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  viewerCount: number;
  publishedAt: string;
  categoryId: string;
  tags: string[];
  isLive: boolean;
  liveBroadcastContent: 'live' | 'upcoming' | 'none';
  actualStartTime?: string;
  actualEndTime?: string;
  scheduledStartTime?: string;
}

interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  publishedAt: string;
  customUrl?: string;
  country?: string;
  defaultLanguage?: string;
}

interface YouTubeSearchResult {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeStream[];
}

interface YouTubeCategory {
  id: string;
  title: string;
  assignable: boolean;
}

class YouTubeAPI {
  private readonly apiKey = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    if (!this.apiKey) {
      console.error('YouTube API key not found in environment variables');
      console.error('Please ensure EXPO_PUBLIC_YOUTUBE_API_KEY is set in your .env file');
      console.error('You can get an API key from https://console.cloud.google.com/');
    }
  }

  private async makeRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured');
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('key', this.apiKey);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          url.searchParams.append(key, value);
        }
      });
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`YouTube API request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`YouTube API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getLiveStreams(maxResults: number = 20, pageToken?: string): Promise<YouTubeSearchResult> {
    console.log('🔄 Fetching live streams from YouTube API...');
    
    try {
      const params: Record<string, string> = {
        part: 'snippet,liveStreamingDetails',
        type: 'video',
        eventType: 'live',
        maxResults: maxResults.toString(),
        order: 'viewCount',
        q: 'live', // Add search query to get actual live streams
      };

      if (pageToken) {
        params.pageToken = pageToken;
      }

      const response = await this.makeRequest<YouTubeSearchResult>('/search', params);
      
      // Process the streams to match our interface
      const processedStreams = response.items.map(item => ({
        ...item,
        isLive: item.liveBroadcastContent === 'live',
        viewerCount: 0, // YouTube doesn't provide live viewer count in search results
        thumbnailUrl: item.thumbnailUrl || 'https://i.ytimg.com/vi/default/mqdefault.jpg',
      }));

      console.log(`✅ Fetched ${processedStreams.length} live streams from YouTube`);
      
      return {
        ...response,
        items: processedStreams,
      };
    } catch (error) {
      console.error('❌ Failed to fetch YouTube live streams:', error);
      throw error;
    }
  }

  async getStreamsByCategory(categoryId: string, maxResults: number = 20): Promise<YouTubeSearchResult> {
    console.log(`🔄 Fetching YouTube streams for category: ${categoryId}`);
    
    try {
      const params: Record<string, string> = {
        part: 'snippet',
        type: 'video',
        videoCategoryId: categoryId,
        eventType: 'live',
        maxResults: maxResults.toString(),
        order: 'viewCount',
      };

      const response = await this.makeRequest<YouTubeSearchResult>('/search', params);
      
      console.log(`✅ Fetched ${response.items.length} streams for category ${categoryId}`);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch YouTube streams by category:', error);
      throw error;
    }
  }

  async searchStreams(query: string, maxResults: number = 20): Promise<YouTubeSearchResult> {
    console.log(`🔍 Searching YouTube for: "${query}"`);
    
    try {
      const params: Record<string, string> = {
        part: 'snippet',
        type: 'video',
        q: query,
        eventType: 'live',
        maxResults: maxResults.toString(),
        order: 'relevance',
      };

      const response = await this.makeRequest<YouTubeSearchResult>('/search', params);
      
      console.log(`✅ YouTube search returned ${response.items.length} results`);
      return response;
    } catch (error) {
      console.error('❌ YouTube search failed:', error);
      throw error;
    }
  }

  async getChannelInfo(channelId: string): Promise<YouTubeChannel | null> {
    try {
      const params: Record<string, string> = {
        part: 'snippet,statistics',
        id: channelId,
      };

      const response = await this.makeRequest<{items: YouTubeChannel[]}>('/channels', params);
      
      if (response.items && response.items.length > 0) {
        return response.items[0];
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to get YouTube channel info:', error);
      return null;
    }
  }

  async getVideoCategories(): Promise<YouTubeCategory[]> {
    try {
      const params: Record<string, string> = {
        part: 'snippet',
        regionCode: 'US',
      };

      const response = await this.makeRequest<{items: YouTubeCategory[]}>('/videoCategories', params);
      return response.items || [];
    } catch (error) {
      console.error('❌ Failed to get YouTube video categories:', error);
      return [];
    }
  }

  generateEmbedUrl(videoId: string, options: { 
    autoplay?: boolean; 
    mute?: boolean; 
    controls?: boolean;
    start?: number;
  } = {}): string {
    const { autoplay = true, mute = true, controls = false, start = 0 } = options;
    
    if (!videoId) {
      throw new Error('Video ID is required for YouTube embed');
    }

    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      mute: mute ? '1' : '0',
      controls: controls ? '1' : '0',
      start: start.toString(),
      enablejsapi: '1',
      origin: 'https://localhost',
      playsinline: '1',
    });

    const embedUrl = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    console.log(`🔗 Generated YouTube embed URL: ${embedUrl}`);
    
    return embedUrl;
  }

  getThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'high'): string {
    return `https://i.ytimg.com/vi/${videoId}/${quality}default.jpg`;
  }

  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/live\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  async getPopularLiveStreams(maxResults: number = 20): Promise<YouTubeSearchResult> {
    console.log('🔄 Fetching popular live streams from YouTube...');
    
    try {
      // Get gaming live streams as they're typically most popular
      const gamingStreams = await this.searchStreams('gaming live', Math.ceil(maxResults / 2));
      
      // Get general live streams
      const generalStreams = await this.searchStreams('live stream', Math.floor(maxResults / 2));
      
      // Combine and deduplicate
      const allStreams = [...gamingStreams.items, ...generalStreams.items];
      const uniqueStreams = allStreams.filter((stream, index, self) => 
        index === self.findIndex(s => s.id === stream.id)
      );
      
      console.log(`✅ Fetched ${uniqueStreams.length} popular live streams`);
      
      return {
        kind: 'youtube#searchListResponse',
        etag: '',
        pageInfo: {
          totalResults: uniqueStreams.length,
          resultsPerPage: maxResults,
        },
        items: uniqueStreams.slice(0, maxResults),
      };
    } catch (error) {
      console.error('❌ Failed to fetch popular YouTube live streams:', error);
      throw error;
    }
  }
}

export const youtubeApi = new YouTubeAPI();

// Wrapper functions for easier importing
export const fetchYouTubeLiveStreams = async (maxResults: number = 20, pageToken?: string) => {
  const result = await youtubeApi.getLiveStreams(maxResults, pageToken);
  return result.items;
};

export const searchYouTubeStreams = async (query: string, maxResults: number = 20) => {
  const result = await youtubeApi.searchStreams(query, maxResults);
  return result.items;
};

export const fetchYouTubeStreamsByCategory = async (categoryId: string, maxResults: number = 20) => {
  const result = await youtubeApi.getStreamsByCategory(categoryId, maxResults);
  return result.items;
};

export type { YouTubeStream, YouTubeChannel, YouTubeCategory, YouTubeSearchResult };