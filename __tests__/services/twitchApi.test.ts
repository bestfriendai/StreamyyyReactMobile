/**
 * Tests for Twitch API service
 */
import { twitchApi } from '@/services/twitchApi';

// Mock fetch
global.fetch = jest.fn();

describe('TwitchAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful token response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        access_token: 'test-token',
        expires_in: 3600,
        token_type: 'bearer'
      })
    });
  });

  describe('getAccessToken', () => {
    it('should fetch and return access token', async () => {
      const result = await twitchApi.getTopStreams(1);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://id.twitch.tv/oauth2/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: expect.stringContaining('grant_type=client_credentials')
        })
      );
    });

    it('should cache access token', async () => {
      // First call
      await twitchApi.getTopStreams(1);
      
      // Second call should use cached token
      await twitchApi.getTopStreams(1);
      
      // Should only call token endpoint once
      expect(global.fetch).toHaveBeenCalledTimes(2); // Once for token, once for streams
    });
  });

  describe('getTopStreams', () => {
    it('should fetch top streams successfully', async () => {
      const mockStreams = {
        data: [
          {
            id: '1',
            user_id: '123',
            user_login: 'testuser',
            user_name: 'TestUser',
            game_id: '456',
            game_name: 'Test Game',
            type: 'live',
            title: 'Test Stream',
            viewer_count: 100,
            started_at: '2023-01-01T00:00:00Z',
            language: 'en',
            thumbnail_url: 'https://example.com/thumb.jpg',
            tag_ids: [],
            is_mature: false
          }
        ],
        pagination: {}
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test-token', expires_in: 3600 })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStreams)
        });

      const result = await twitchApi.getTopStreams(1);
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].user_login).toBe('testuser');
    });

    it('should filter out invalid streams', async () => {
      const mockStreams = {
        data: [
          {
            id: '1',
            user_id: '123',
            user_login: 'validuser',
            user_name: 'ValidUser',
            game_id: '456',
            game_name: 'Test Game',
            type: 'live',
            title: 'Valid Stream',
            viewer_count: 100,
            started_at: '2023-01-01T00:00:00Z',
            language: 'en',
            thumbnail_url: 'https://example.com/thumb.jpg',
            tag_ids: [],
            is_mature: false
          },
          {
            id: '2',
            user_id: '124',
            user_login: '', // Invalid - empty username
            user_name: 'InvalidUser',
            game_id: '456',
            game_name: 'Test Game',
            type: 'live',
            title: 'Invalid Stream',
            viewer_count: 50,
            started_at: '2023-01-01T00:00:00Z',
            language: 'en',
            thumbnail_url: 'https://example.com/thumb.jpg',
            tag_ids: [],
            is_mature: false
          }
        ],
        pagination: {}
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test-token', expires_in: 3600 })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStreams)
        });

      const result = await twitchApi.getTopStreams(2);
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].user_login).toBe('validuser');
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test-token', expires_in: 3600 })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('Server Error')
        });

      await expect(twitchApi.getTopStreams(1)).rejects.toThrow('Twitch API request failed');
    });
  });

  describe('generateEmbedUrl', () => {
    it('should generate valid embed URL', () => {
      const username = 'testuser';
      const url = twitchApi.generateEmbedUrl(username);
      
      expect(url).toContain('https://player.twitch.tv/');
      expect(url).toContain('channel=testuser');
      expect(url).toContain('autoplay=true');
      expect(url).toContain('muted=true');
    });

    it('should handle custom options', () => {
      const username = 'testuser';
      const url = twitchApi.generateEmbedUrl(username, {
        muted: false,
        autoplay: false,
        quality: '720p'
      });
      
      expect(url).toContain('muted=false');
      expect(url).toContain('autoplay=false');
      expect(url).toContain('quality=720p');
    });

    it('should throw error for invalid username', () => {
      expect(() => {
        twitchApi.generateEmbedUrl('');
      }).toThrow('Invalid username provided');
    });
  });

  describe('searchStreams', () => {
    it('should search streams successfully', async () => {
      const mockUsers = {
        data: [
          {
            id: '123',
            login: 'testuser',
            display_name: 'TestUser',
            type: '',
            broadcaster_type: '',
            description: 'Test user',
            profile_image_url: 'https://example.com/profile.jpg',
            offline_image_url: 'https://example.com/offline.jpg',
            view_count: 1000,
            created_at: '2023-01-01T00:00:00Z'
          }
        ]
      };

      const mockStreams = {
        data: [
          {
            id: '1',
            user_id: '123',
            user_login: 'testuser',
            user_name: 'TestUser',
            game_id: '456',
            game_name: 'Test Game',
            type: 'live',
            title: 'Test Stream',
            viewer_count: 100,
            started_at: '2023-01-01T00:00:00Z',
            language: 'en',
            thumbnail_url: 'https://example.com/thumb.jpg',
            tag_ids: [],
            is_mature: false
          }
        ]
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test-token', expires_in: 3600 })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUsers)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStreams)
        });

      const result = await twitchApi.searchStreams('test');
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].user_login).toBe('testuser');
    });

    it('should return empty array when no users found', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test-token', expires_in: 3600 })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [] })
        });

      const result = await twitchApi.searchStreams('nonexistent');
      
      expect(result.data).toHaveLength(0);
    });
  });

  describe('getThumbnailUrl', () => {
    it('should replace template variables', () => {
      const template = 'https://example.com/thumb-{width}x{height}.jpg';
      const result = twitchApi.getThumbnailUrl(template, 640, 360);
      
      expect(result).toBe('https://example.com/thumb-640x360.jpg');
    });

    it('should use default dimensions', () => {
      const template = 'https://example.com/thumb-{width}x{height}.jpg';
      const result = twitchApi.getThumbnailUrl(template);
      
      expect(result).toBe('https://example.com/thumb-320x180.jpg');
    });
  });

  describe('getTotalLiveStreamers', () => {
    it('should return estimated number of live streamers', async () => {
      const mockStreams = {
        data: Array(100).fill({}).map((_, i) => ({
          id: i.toString(),
          user_id: i.toString(),
          user_login: `user${i}`,
          user_name: `User${i}`,
          game_id: '456',
          game_name: 'Test Game',
          type: 'live',
          title: `Stream ${i}`,
          viewer_count: 100,
          started_at: '2023-01-01T00:00:00Z',
          language: 'en',
          thumbnail_url: 'https://example.com/thumb.jpg',
          tag_ids: [],
          is_mature: false
        })),
        pagination: {}
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test-token', expires_in: 3600 })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStreams)
        });

      const result = await twitchApi.getTotalLiveStreamers();
      
      expect(result).toBeGreaterThan(30000);
      expect(result).toBeLessThan(70000);
    });

    it('should return fallback number on error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access_token: 'test-token', expires_in: 3600 })
        })
        .mockRejectedValueOnce(new Error('API Error'));

      const result = await twitchApi.getTotalLiveStreamers();
      
      expect(result).toBe(45000);
    });
  });
});