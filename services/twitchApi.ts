interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  is_mature: boolean;
}

interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  created_at: string;
}

interface TwitchGame {
  id: string;
  name: string;
  box_art_url: string;
}

class TwitchAPI {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private readonly clientId = process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID;
  private readonly clientSecret = process.env.EXPO_PUBLIC_TWITCH_CLIENT_SECRET;
  private readonly baseUrl = 'https://api.twitch.tv/helix';

  constructor() {
    if (!this.clientId || !this.clientSecret) {
      console.error('Twitch API credentials not found in environment variables');
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Twitch API credentials not configured');
    }

    try {
      const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token request failed: ${response.status} - ${errorText}`);
      }

      const data: TwitchTokenResponse = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early

      console.log('Successfully obtained Twitch access token');
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Twitch access token:', error);
      throw new Error('Failed to authenticate with Twitch API');
    }
  }

  private async makeRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const token = await this.getAccessToken();
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          url.searchParams.append(key, value);
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': this.clientId!,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Twitch API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  async getTopStreams(first: number = 20, after?: string): Promise<{ data: TwitchStream[]; pagination: { cursor?: string } }> {
    const params: Record<string, string> = { first: first.toString() };
    if (after) params.after = after;
    
    console.log('Fetching top streams from Twitch API...');
    const result = await this.makeRequest<{ data: TwitchStream[]; pagination: { cursor?: string } }>('/streams', params);
    console.log(`Fetched ${result.data.length} streams`);
    return result;
  }

  async getStreamsByGame(gameId: string, first: number = 20): Promise<{ data: TwitchStream[] }> {
    console.log(`Fetching streams for game ID: ${gameId}`);
    return this.makeRequest('/streams', {
      game_id: gameId,
      first: first.toString(),
    });
  }

  async searchStreams(query: string, first: number = 20): Promise<{ data: TwitchStream[] }> {
    console.log(`Searching for streams with query: ${query}`);
    
    // First search for channels/users
    const users = await this.searchChannels(query, first);
    if (users.data.length === 0) {
      console.log('No users found for search query');
      return { data: [] };
    }

    // Then get streams for those users
    const userIds = users.data.map(user => user.id);
    const params: Record<string, string> = {
      first: first.toString(),
    };
    
    // Add multiple user_id parameters
    userIds.forEach(id => {
      params[`user_id`] = id;
    });

    try {
      const result = await this.makeRequest<{ data: TwitchStream[] }>('/streams', {
        user_id: userIds.join(','),
        first: first.toString(),
      });
      console.log(`Found ${result.data.length} live streams for search`);
      return result;
    } catch (error) {
      console.error('Error fetching streams for users:', error);
      return { data: [] };
    }
  }

  async searchChannels(query: string, first: number = 20): Promise<{ data: TwitchUser[] }> {
    console.log(`Searching for channels with query: ${query}`);
    const result = await this.makeRequest<{ data: TwitchUser[] }>('/search/channels', {
      query: query.trim(),
      first: first.toString(),
    });
    console.log(`Found ${result.data.length} channels`);
    return result;
  }

  async getUsers(userIds?: string[], userLogins?: string[]): Promise<{ data: TwitchUser[] }> {
    const params: Record<string, string> = {};
    if (userIds && userIds.length > 0) {
      params.id = userIds.join(',');
    }
    if (userLogins && userLogins.length > 0) {
      params.login = userLogins.join(',');
    }
    
    return this.makeRequest('/users', params);
  }

  async getTopGames(first: number = 20): Promise<{ data: TwitchGame[] }> {
    console.log('Fetching top games from Twitch API...');
    const result = await this.makeRequest<{ data: TwitchGame[] }>('/games/top', { 
      first: first.toString() 
    });
    console.log(`Fetched ${result.data.length} games`);
    return result;
  }

  async getGames(gameIds: string[]): Promise<{ data: TwitchGame[] }> {
    if (gameIds.length === 0) return { data: [] };
    
    return this.makeRequest('/games', {
      id: gameIds.join(','),
    });
  }

  generateEmbedUrl(username: string): string {
    // For web deployment, we need to handle multiple possible domains
    const possibleParents = ['streamyyy.com', 'localhost', 'bolt.new'];
    const parentParam = possibleParents.join('&parent=');
    return `https://player.twitch.tv/?channel=${username}&parent=${parentParam}&muted=false&autoplay=true`;
  }

  getThumbnailUrl(templateUrl: string, width: number = 320, height: number = 180): string {
    return templateUrl.replace('{width}', width.toString()).replace('{height}', height.toString());
  }

  getProfileImageUrl(username: string): string {
    // Fallback profile image URL structure
    return `https://static-cdn.jtvnw.net/jtv_user_pictures/${username}-profile_image-70x70.png`;
  }
}

export const twitchApi = new TwitchAPI();
export type { TwitchStream, TwitchUser, TwitchGame };