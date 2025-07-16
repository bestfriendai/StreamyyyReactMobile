/**
 * Integration tests for TwitchApi with modern streaming components
 */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { renderHook } from '@testing-library/react-hooks';
import { twitchApi, TwitchStream } from '@/services/twitchApi';
import { useAppStore } from '@/store/useAppStore';

// Mock fetch globally
global.fetch = jest.fn();

// Mock the Twitch API service
jest.mock('@/services/twitchApi', () => ({
  twitchApi: {
    getTopStreams: jest.fn(),
    searchStreams: jest.fn(),
    generateEmbedUrl: jest.fn(),
    getThumbnailUrl: jest.fn(),
    getTotalLiveStreamers: jest.fn(),
  },
}));

const mockTwitchApi = twitchApi as jest.Mocked<typeof twitchApi>;

const mockStreams: TwitchStream[] = [
  {
    id: '1',
    user_id: '123',
    user_login: 'testuser1',
    user_name: 'TestUser1',
    game_id: '456',
    game_name: 'Test Game 1',
    type: 'live',
    title: 'Test Stream 1',
    viewer_count: 1000,
    started_at: '2023-01-01T00:00:00Z',
    language: 'en',
    thumbnail_url: 'https://example.com/thumb-{width}x{height}.jpg',
    tag_ids: [],
    is_mature: false,
  },
  {
    id: '2',
    user_id: '124',
    user_login: 'testuser2',
    user_name: 'TestUser2',
    game_id: '457',
    game_name: 'Test Game 2',
    type: 'live',
    title: 'Test Stream 2',
    viewer_count: 2000,
    started_at: '2023-01-01T01:00:00Z',
    language: 'en',
    thumbnail_url: 'https://example.com/thumb-{width}x{height}.jpg',
    tag_ids: [],
    is_mature: false,
  },
];

describe('TwitchApi Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useAppStore.setState({
      activeStreams: [],
      savedLayouts: [],
      currentLayout: null,
      isLoading: false,
      error: null,
    });
  });

  describe('Stream Discovery Integration', () => {
    it('should fetch top streams and integrate with store', async () => {
      mockTwitchApi.getTopStreams.mockResolvedValue({
        data: mockStreams,
        pagination: {},
      });

      const StreamDiscoveryComponent = () => {
        const [streams, setStreams] = React.useState<TwitchStream[]>([]);
        const [isLoading, setIsLoading] = React.useState(false);
        const { addStream } = useAppStore();

        const loadStreams = async () => {
          setIsLoading(true);
          try {
            const result = await twitchApi.getTopStreams(10);
            setStreams(result.data);
          } catch (error) {
            console.error('Failed to load streams:', error);
          } finally {
            setIsLoading(false);
          }
        };

        React.useEffect(() => {
          loadStreams();
        }, []);

        return (
          <div>
            <div testID="loading">{isLoading ? 'Loading...' : 'Loaded'}</div>
            <div testID="stream-count">{streams.length}</div>
            {streams.map(stream => (
              <div
                key={stream.id}
                testID={`stream-${stream.id}`}
                onPress={() => addStream(stream)}
              >
                {stream.user_name}
              </div>
            ))}
          </div>
        );
      };

      const { getByTestId } = render(<StreamDiscoveryComponent />);

      await waitFor(() => {
        expect(getByTestId('loading')).toHaveTextContent('Loaded');
      });

      expect(getByTestId('stream-count')).toHaveTextContent('2');
      expect(getByTestId('stream-1')).toHaveTextContent('TestUser1');
      expect(getByTestId('stream-2')).toHaveTextContent('TestUser2');
      expect(mockTwitchApi.getTopStreams).toHaveBeenCalledWith(10);
    });

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'Network error';
      mockTwitchApi.getTopStreams.mockRejectedValue(new Error(errorMessage));

      const StreamDiscoveryComponent = () => {
        const [error, setError] = React.useState<string | null>(null);
        const [isLoading, setIsLoading] = React.useState(false);

        const loadStreams = async () => {
          setIsLoading(true);
          setError(null);
          try {
            await twitchApi.getTopStreams(10);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
          } finally {
            setIsLoading(false);
          }
        };

        React.useEffect(() => {
          loadStreams();
        }, []);

        return (
          <div>
            <div testID="loading">{isLoading ? 'Loading...' : 'Loaded'}</div>
            <div testID="error">{error || 'No error'}</div>
          </div>
        );
      };

      const { getByTestId } = render(<StreamDiscoveryComponent />);

      await waitFor(() => {
        expect(getByTestId('error')).toHaveTextContent(errorMessage);
      });

      expect(getByTestId('loading')).toHaveTextContent('Loaded');
    });

    it('should integrate search functionality with components', async () => {
      const searchQuery = 'test game';
      mockTwitchApi.searchStreams.mockResolvedValue({
        data: [mockStreams[0]], // Return only first stream for search
        pagination: {},
      });

      const StreamSearchComponent = () => {
        const [query, setQuery] = React.useState('');
        const [streams, setStreams] = React.useState<TwitchStream[]>([]);
        const [isSearching, setIsSearching] = React.useState(false);

        const handleSearch = async (searchQuery: string) => {
          if (!searchQuery.trim()) return;

          setIsSearching(true);
          try {
            const result = await twitchApi.searchStreams(searchQuery);
            setStreams(result.data);
          } catch (error) {
            console.error('Search failed:', error);
          } finally {
            setIsSearching(false);
          }
        };

        return (
          <div>
            <input
              testID="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search streams..."
            />
            <button
              testID="search-button"
              onPress={() => handleSearch(query)}
              disabled={isSearching}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
            <div testID="results-count">{streams.length}</div>
            {streams.map(stream => (
              <div key={stream.id} testID={`result-${stream.id}`}>
                {stream.user_name}
              </div>
            ))}
          </div>
        );
      };

      const { getByTestId } = render(<StreamSearchComponent />);

      const searchInput = getByTestId('search-input');
      const searchButton = getByTestId('search-button');

      fireEvent.changeText(searchInput, searchQuery);
      fireEvent.press(searchButton);

      await waitFor(() => {
        expect(getByTestId('results-count')).toHaveTextContent('1');
      });

      expect(getByTestId('result-1')).toHaveTextContent('TestUser1');
      expect(mockTwitchApi.searchStreams).toHaveBeenCalledWith(searchQuery);
    });
  });

  describe('Embed URL Generation Integration', () => {
    it('should generate proper embed URLs for stream players', () => {
      const username = 'testuser';
      const mockEmbedUrl = 'https://player.twitch.tv/?channel=testuser&autoplay=true&muted=true';
      
      mockTwitchApi.generateEmbedUrl.mockReturnValue(mockEmbedUrl);

      const StreamPlayerComponent = ({ stream }: { stream: TwitchStream }) => {
        const embedUrl = twitchApi.generateEmbedUrl(stream.user_login);
        
        return (
          <div>
            <div testID="embed-url">{embedUrl}</div>
            <div testID="stream-name">{stream.user_name}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <StreamPlayerComponent stream={mockStreams[0]} />
      );

      expect(getByTestId('embed-url')).toHaveTextContent(mockEmbedUrl);
      expect(mockTwitchApi.generateEmbedUrl).toHaveBeenCalledWith('testuser1');
    });

    it('should handle custom embed options', () => {
      const customOptions = {
        muted: false,
        autoplay: false,
        quality: '720p' as const,
      };
      
      const mockEmbedUrl = 'https://player.twitch.tv/?channel=testuser&autoplay=false&muted=false&quality=720p';
      mockTwitchApi.generateEmbedUrl.mockReturnValue(mockEmbedUrl);

      const StreamPlayerComponent = ({ stream }: { stream: TwitchStream }) => {
        const embedUrl = twitchApi.generateEmbedUrl(stream.user_login, customOptions);
        
        return <div testID="embed-url">{embedUrl}</div>;
      };

      const { getByTestId } = render(
        <StreamPlayerComponent stream={mockStreams[0]} />
      );

      expect(getByTestId('embed-url')).toHaveTextContent(mockEmbedUrl);
      expect(mockTwitchApi.generateEmbedUrl).toHaveBeenCalledWith('testuser1', customOptions);
    });
  });

  describe('Thumbnail URL Integration', () => {
    it('should generate correct thumbnail URLs for different sizes', () => {
      const thumbnailTemplate = 'https://example.com/thumb-{width}x{height}.jpg';
      const expectedUrl = 'https://example.com/thumb-320x180.jpg';
      
      mockTwitchApi.getThumbnailUrl.mockReturnValue(expectedUrl);

      const StreamThumbnailComponent = ({ stream }: { stream: TwitchStream }) => {
        const thumbnailUrl = twitchApi.getThumbnailUrl(stream.thumbnail_url);
        
        return (
          <div>
            <img testID="thumbnail" src={thumbnailUrl} alt={stream.user_name} />
            <div testID="thumbnail-url">{thumbnailUrl}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <StreamThumbnailComponent stream={mockStreams[0]} />
      );

      expect(getByTestId('thumbnail-url')).toHaveTextContent(expectedUrl);
      expect(mockTwitchApi.getThumbnailUrl).toHaveBeenCalledWith(thumbnailTemplate);
    });

    it('should handle custom thumbnail dimensions', () => {
      const width = 640;
      const height = 360;
      const expectedUrl = 'https://example.com/thumb-640x360.jpg';
      
      mockTwitchApi.getThumbnailUrl.mockReturnValue(expectedUrl);

      const StreamThumbnailComponent = ({ stream }: { stream: TwitchStream }) => {
        const thumbnailUrl = twitchApi.getThumbnailUrl(stream.thumbnail_url, width, height);
        
        return <div testID="thumbnail-url">{thumbnailUrl}</div>;
      };

      const { getByTestId } = render(
        <StreamThumbnailComponent stream={mockStreams[0]} />
      );

      expect(getByTestId('thumbnail-url')).toHaveTextContent(expectedUrl);
      expect(mockTwitchApi.getThumbnailUrl).toHaveBeenCalledWith(
        mockStreams[0].thumbnail_url,
        width,
        height
      );
    });
  });

  describe('Live Stream Statistics Integration', () => {
    it('should fetch and display total live streamers', async () => {
      const totalStreamers = 45000;
      mockTwitchApi.getTotalLiveStreamers.mockResolvedValue(totalStreamers);

      const LiveStatsComponent = () => {
        const [totalLive, setTotalLive] = React.useState<number>(0);
        const [isLoading, setIsLoading] = React.useState(true);

        React.useEffect(() => {
          const fetchStats = async () => {
            try {
              const total = await twitchApi.getTotalLiveStreamers();
              setTotalLive(total);
            } catch (error) {
              console.error('Failed to fetch live stats:', error);
            } finally {
              setIsLoading(false);
            }
          };

          fetchStats();
        }, []);

        return (
          <div>
            <div testID="loading">{isLoading ? 'Loading...' : 'Loaded'}</div>
            <div testID="total-live">{totalLive.toLocaleString()}</div>
          </div>
        );
      };

      const { getByTestId } = render(<LiveStatsComponent />);

      await waitFor(() => {
        expect(getByTestId('loading')).toHaveTextContent('Loaded');
      });

      expect(getByTestId('total-live')).toHaveTextContent('45,000');
      expect(mockTwitchApi.getTotalLiveStreamers).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle API rate limiting gracefully', async () => {
      const rateLimitError = new Error('Too Many Requests');
      mockTwitchApi.getTopStreams.mockRejectedValueOnce(rateLimitError);
      mockTwitchApi.getTopStreams.mockResolvedValueOnce({
        data: mockStreams,
        pagination: {},
      });

      const ResilientStreamComponent = () => {
        const [streams, setStreams] = React.useState<TwitchStream[]>([]);
        const [retryCount, setRetryCount] = React.useState(0);
        const [isLoading, setIsLoading] = React.useState(false);

        const loadStreamsWithRetry = async (retries = 1) => {
          setIsLoading(true);
          try {
            const result = await twitchApi.getTopStreams(10);
            setStreams(result.data);
          } catch (error) {
            if (retries > 0) {
              setRetryCount(prev => prev + 1);
              setTimeout(() => loadStreamsWithRetry(retries - 1), 1000);
            }
          } finally {
            setIsLoading(false);
          }
        };

        React.useEffect(() => {
          loadStreamsWithRetry();
        }, []);

        return (
          <div>
            <div testID="retry-count">{retryCount}</div>
            <div testID="stream-count">{streams.length}</div>
            <div testID="loading">{isLoading ? 'Loading...' : 'Loaded'}</div>
          </div>
        );
      };

      const { getByTestId } = render(<ResilientStreamComponent />);

      await waitFor(() => {
        expect(getByTestId('loading')).toHaveTextContent('Loaded');
      });

      expect(getByTestId('retry-count')).toHaveTextContent('1');
      expect(getByTestId('stream-count')).toHaveTextContent('2');
      expect(mockTwitchApi.getTopStreams).toHaveBeenCalledTimes(2);
    });

    it('should handle network connectivity issues', async () => {
      const networkError = new Error('Network request failed');
      mockTwitchApi.getTopStreams.mockRejectedValue(networkError);

      const NetworkAwareComponent = () => {
        const [isOnline, setIsOnline] = React.useState(true);
        const [error, setError] = React.useState<string | null>(null);

        const checkConnection = async () => {
          try {
            await twitchApi.getTopStreams(1);
            setIsOnline(true);
            setError(null);
          } catch (err) {
            setIsOnline(false);
            setError(err instanceof Error ? err.message : 'Network error');
          }
        };

        React.useEffect(() => {
          checkConnection();
        }, []);

        return (
          <div>
            <div testID="online-status">{isOnline ? 'Online' : 'Offline'}</div>
            <div testID="error-message">{error || 'No error'}</div>
          </div>
        );
      };

      const { getByTestId } = render(<NetworkAwareComponent />);

      await waitFor(() => {
        expect(getByTestId('online-status')).toHaveTextContent('Offline');
      });

      expect(getByTestId('error-message')).toHaveTextContent('Network request failed');
    });

    it('should handle malformed API responses', async () => {
      const malformedResponse = {
        data: [
          {
            id: '1',
            // Missing required fields
            user_login: null,
            user_name: '',
          },
          mockStreams[1], // Valid stream
        ],
        pagination: {},
      };

      mockTwitchApi.getTopStreams.mockResolvedValue(malformedResponse as any);

      const DataValidationComponent = () => {
        const [validStreams, setValidStreams] = React.useState<TwitchStream[]>([]);

        const loadAndValidateStreams = async () => {
          try {
            const result = await twitchApi.getTopStreams(10);
            
            // Filter out invalid streams
            const valid = result.data.filter(stream => 
              stream.id && 
              stream.user_login && 
              stream.user_name &&
              stream.user_login.trim() !== '' &&
              stream.user_name.trim() !== ''
            );
            
            setValidStreams(valid);
          } catch (error) {
            console.error('Failed to load streams:', error);
          }
        };

        React.useEffect(() => {
          loadAndValidateStreams();
        }, []);

        return (
          <div>
            <div testID="valid-count">{validStreams.length}</div>
            {validStreams.map(stream => (
              <div key={stream.id} testID={`valid-stream-${stream.id}`}>
                {stream.user_name}
              </div>
            ))}
          </div>
        );
      };

      const { getByTestId, queryByTestId } = render(<DataValidationComponent />);

      await waitFor(() => {
        expect(getByTestId('valid-count')).toHaveTextContent('1');
      });

      expect(queryByTestId('valid-stream-1')).toBeFalsy(); // Invalid stream filtered out
      expect(getByTestId('valid-stream-2')).toHaveTextContent('TestUser2');
    });
  });

  describe('Performance and Caching', () => {
    it('should implement caching for repeated requests', async () => {
      let callCount = 0;
      mockTwitchApi.getTopStreams.mockImplementation(async () => {
        callCount++;
        return { data: mockStreams, pagination: {} };
      });

      const CachedStreamComponent = () => {
        const [streams, setStreams] = React.useState<TwitchStream[]>([]);
        const [cache, setCache] = React.useState<Map<string, any>>(new Map());

        const loadStreamsWithCache = async (limit: number) => {
          const cacheKey = `top-streams-${limit}`;
          
          if (cache.has(cacheKey)) {
            setStreams(cache.get(cacheKey));
            return;
          }

          const result = await twitchApi.getTopStreams(limit);
          setCache(prev => new Map(prev).set(cacheKey, result.data));
          setStreams(result.data);
        };

        const loadStreams = () => loadStreamsWithCache(10);

        return (
          <div>
            <button testID="load-button" onPress={loadStreams}>
              Load Streams
            </button>
            <div testID="stream-count">{streams.length}</div>
            <div testID="call-count">{callCount}</div>
          </div>
        );
      };

      const { getByTestId } = render(<CachedStreamComponent />);

      const loadButton = getByTestId('load-button');

      // First load
      fireEvent.press(loadButton);
      await waitFor(() => {
        expect(getByTestId('stream-count')).toHaveTextContent('2');
      });
      expect(getByTestId('call-count')).toHaveTextContent('1');

      // Second load (should use cache)
      fireEvent.press(loadButton);
      await waitFor(() => {
        expect(getByTestId('stream-count')).toHaveTextContent('2');
      });
      expect(getByTestId('call-count')).toHaveTextContent('1'); // No additional API call
    });

    it('should handle concurrent requests efficiently', async () => {
      let resolveCount = 0;
      mockTwitchApi.getTopStreams.mockImplementation(async () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolveCount++;
            resolve({ data: mockStreams, pagination: {} });
          }, 100);
        });
      });

      const ConcurrentRequestComponent = () => {
        const [results, setResults] = React.useState<TwitchStream[][]>([]);

        const makeConcurrentRequests = async () => {
          const promises = [
            twitchApi.getTopStreams(5),
            twitchApi.getTopStreams(10),
            twitchApi.getTopStreams(15),
          ];

          const responses = await Promise.all(promises);
          setResults(responses.map(r => r.data));
        };

        React.useEffect(() => {
          makeConcurrentRequests();
        }, []);

        return (
          <div>
            <div testID="request-count">{results.length}</div>
            <div testID="resolve-count">{resolveCount}</div>
          </div>
        );
      };

      const { getByTestId } = render(<ConcurrentRequestComponent />);

      await waitFor(() => {
        expect(getByTestId('request-count')).toHaveTextContent('3');
      });

      expect(getByTestId('resolve-count')).toHaveTextContent('3');
      expect(mockTwitchApi.getTopStreams).toHaveBeenCalledTimes(3);
    });
  });

  describe('Integration with Store State', () => {
    it('should sync API data with store state', async () => {
      mockTwitchApi.getTopStreams.mockResolvedValue({
        data: mockStreams,
        pagination: {},
      });

      const StoreIntegrationComponent = () => {
        const { activeStreams, addStream, setLoading, setError } = useAppStore();

        const loadAndAddStreams = async () => {
          setLoading(true);
          setError(null);
          
          try {
            const result = await twitchApi.getTopStreams(10);
            result.data.forEach(stream => addStream(stream));
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to load streams');
          } finally {
            setLoading(false);
          }
        };

        React.useEffect(() => {
          loadAndAddStreams();
        }, []);

        return (
          <div>
            <div testID="store-stream-count">{activeStreams.length}</div>
            {activeStreams.map(stream => (
              <div key={stream.id} testID={`store-stream-${stream.id}`}>
                {stream.user_name}
              </div>
            ))}
          </div>
        );
      };

      const { getByTestId } = render(<StoreIntegrationComponent />);

      await waitFor(() => {
        expect(getByTestId('store-stream-count')).toHaveTextContent('2');
      });

      expect(getByTestId('store-stream-1')).toHaveTextContent('TestUser1');
      expect(getByTestId('store-stream-2')).toHaveTextContent('TestUser2');
      
      // Verify store state
      const storeState = useAppStore.getState();
      expect(storeState.activeStreams).toHaveLength(2);
      expect(storeState.isLoading).toBe(false);
      expect(storeState.error).toBeNull();
    });

    it('should handle store limits when adding streams from API', async () => {
      mockTwitchApi.getTopStreams.mockResolvedValue({
        data: Array(10).fill(null).map((_, i) => ({
          ...mockStreams[0],
          id: `${i + 1}`,
          user_id: `${i + 100}`,
          user_login: `user${i + 1}`,
          user_name: `User${i + 1}`,
        })),
        pagination: {},
      });

      // Set free tier limit (4 streams)
      useAppStore.setState({ tier: 'free' });

      const LimitedStoreComponent = () => {
        const { activeStreams, addStream, canAddMoreStreams, getMaxStreams } = useAppStore();

        const loadStreamsRespectingLimit = async () => {
          const result = await twitchApi.getTopStreams(10);
          const maxStreams = getMaxStreams();
          
          result.data.slice(0, maxStreams).forEach(stream => {
            if (canAddMoreStreams(activeStreams.length)) {
              addStream(stream);
            }
          });
        };

        React.useEffect(() => {
          loadStreamsRespectingLimit();
        }, []);

        return (
          <div>
            <div testID="limited-count">{activeStreams.length}</div>
            <div testID="can-add-more">{canAddMoreStreams(activeStreams.length) ? 'Yes' : 'No'}</div>
          </div>
        );
      };

      const { getByTestId } = render(<LimitedStoreComponent />);

      await waitFor(() => {
        expect(getByTestId('limited-count')).toHaveTextContent('4');
      });

      expect(getByTestId('can-add-more')).toHaveTextContent('No');
    });
  });
});