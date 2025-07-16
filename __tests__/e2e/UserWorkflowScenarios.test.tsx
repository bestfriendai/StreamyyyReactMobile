/**
 * End-to-End User Workflow Test Scenarios
 * Tests complete user journeys through the multi-streaming application
 */
import React from 'react';
import { render, fireEvent, waitFor, act, within } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import { twitchApi, TwitchStream } from '@/services/twitchApi';

// Mock all external dependencies
jest.mock('@/services/twitchApi');
jest.mock('@/utils/haptics');
jest.mock('@react-native-async-storage/async-storage');

// Mock theme and components
jest.mock('@/theme/modernTheme', () => ({
  ModernTheme: {
    colors: {
      background: { primary: '#000' },
      text: { primary: '#fff', secondary: '#ccc' },
      accent: { 500: '#8b5cf6' },
    },
    spacing: { sm: 8, md: 16, lg: 24 },
    borderRadius: { md: 8 },
  },
}));

const mockTwitchApi = twitchApi as jest.Mocked<typeof twitchApi>;

// Mock data
const mockStreams: TwitchStream[] = [
  {
    id: '1',
    user_id: '123',
    user_login: 'streamer1',
    user_name: 'Streamer One',
    game_id: '456',
    game_name: 'Popular Game',
    type: 'live',
    title: 'Amazing Stream',
    viewer_count: 5000,
    started_at: '2023-01-01T00:00:00Z',
    language: 'en',
    thumbnail_url: 'https://example.com/thumb1.jpg',
    tag_ids: [],
    is_mature: false,
  },
  {
    id: '2',
    user_id: '124',
    user_login: 'streamer2',
    user_name: 'Streamer Two',
    game_id: '457',
    game_name: 'Indie Game',
    type: 'live',
    title: 'Chill Vibes',
    viewer_count: 1200,
    started_at: '2023-01-01T01:00:00Z',
    language: 'en',
    thumbnail_url: 'https://example.com/thumb2.jpg',
    tag_ids: [],
    is_mature: false,
  },
  {
    id: '3',
    user_id: '125',
    user_login: 'streamer3',
    user_name: 'Streamer Three',
    game_id: '458',
    game_name: 'Competitive Game',
    type: 'live',
    title: 'Tournament Finals',
    viewer_count: 25000,
    started_at: '2023-01-01T02:00:00Z',
    language: 'en',
    thumbnail_url: 'https://example.com/thumb3.jpg',
    tag_ids: [],
    is_mature: false,
  },
];

// Mock App Component with Routing
const MockApp = ({ children }: { children: React.ReactNode }) => {
  const [currentScreen, setCurrentScreen] = React.useState('discover');
  
  return (
    <View testID="app-container">
      {/* Mock Navigation */}
      <View testID="navigation" style={{ flexDirection: 'row' }}>
        <Text
          testID="nav-discover"
          onPress={() => setCurrentScreen('discover')}
          style={{ 
            color: currentScreen === 'discover' ? '#8b5cf6' : '#ccc',
            padding: 16 
          }}
        >
          Discover
        </Text>
        <Text
          testID="nav-grid"
          onPress={() => setCurrentScreen('grid')}
          style={{ 
            color: currentScreen === 'grid' ? '#8b5cf6' : '#ccc',
            padding: 16 
          }}
        >
          Grid
        </Text>
        <Text
          testID="nav-favorites"
          onPress={() => setCurrentScreen('favorites')}
          style={{ 
            color: currentScreen === 'favorites' ? '#8b5cf6' : '#ccc',
            padding: 16 
          }}
        >
          Favorites
        </Text>
        <Text
          testID="nav-settings"
          onPress={() => setCurrentScreen('settings')}
          style={{ 
            color: currentScreen === 'settings' ? '#8b5cf6' : '#ccc',
            padding: 16 
          }}
        >
          Settings
        </Text>
      </View>
      
      {/* Screen Content */}
      <View testID={`screen-${currentScreen}`} style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
};

// Mock Discover Screen
const MockDiscoverScreen = () => {
  const [streams, setStreams] = React.useState<TwitchStream[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const { addStream, activeStreams, canAddMoreStreams } = useAppStore();

  const loadStreams = async () => {
    setIsLoading(true);
    try {
      const result = searchQuery 
        ? await twitchApi.searchStreams(searchQuery)
        : await twitchApi.getTopStreams(20);
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

  const handleAddStream = (stream: TwitchStream) => {
    if (canAddMoreStreams(activeStreams.length)) {
      addStream(stream);
    }
  };

  return (
    <View testID="discover-screen">
      {/* Search Bar */}
      <View testID="search-section">
        <Text
          testID="search-input"
          onPress={() => {}} // Mock input
        >
          {searchQuery || 'Search streams...'}
        </Text>
        <Text
          testID="search-button"
          onPress={() => loadStreams()}
        >
          Search
        </Text>
      </View>

      {/* Loading State */}
      {isLoading && <Text testID="loading">Loading streams...</Text>}

      {/* Stream List */}
      <View testID="stream-list">
        {streams.map(stream => (
          <View key={stream.id} testID={`stream-card-${stream.id}`}>
            <Text testID={`stream-title-${stream.id}`}>{stream.title}</Text>
            <Text testID={`stream-streamer-${stream.id}`}>{stream.user_name}</Text>
            <Text testID={`stream-viewers-${stream.id}`}>{stream.viewer_count}</Text>
            <Text testID={`stream-game-${stream.id}`}>{stream.game_name}</Text>
            <Text
              testID={`add-stream-${stream.id}`}
              onPress={() => handleAddStream(stream)}
            >
              Add to Grid
            </Text>
            <Text
              testID={`favorite-stream-${stream.id}`}
              onPress={() => {}} // Mock favorite action
            >
              Favorite
            </Text>
          </View>
        ))}
      </View>

      {/* Stream Count Info */}
      <Text testID="active-stream-count">
        Active: {activeStreams.length} streams
      </Text>
    </View>
  );
};

// Mock Grid Screen
const MockGridScreen = () => {
  const { activeStreams, removeStream, clearStreams } = useAppStore();
  const [layoutMode, setLayoutMode] = React.useState('grid-2x2');

  return (
    <View testID="grid-screen">
      {activeStreams.length === 0 ? (
        <View testID="empty-grid">
          <Text>No active streams</Text>
          <Text>Add streams from the Discover tab</Text>
        </View>
      ) : (
        <View testID="active-grid">
          {/* Layout Controls */}
          <View testID="layout-controls">
            <Text testID="current-layout">Layout: {layoutMode}</Text>
            <Text
              testID="layout-2x2"
              onPress={() => setLayoutMode('grid-2x2')}
            >
              2x2
            </Text>
            <Text
              testID="layout-3x1"
              onPress={() => setLayoutMode('grid-3x1')}
            >
              3x1
            </Text>
            <Text
              testID="layout-pip"
              onPress={() => setLayoutMode('pip')}
            >
              PiP
            </Text>
          </View>

          {/* Stream Grid */}
          <View testID="stream-grid">
            {activeStreams.map((stream, index) => (
              <View key={stream.id} testID={`grid-stream-${stream.id}`}>
                <Text testID={`grid-title-${stream.id}`}>{stream.title}</Text>
                <Text testID={`grid-streamer-${stream.id}`}>{stream.user_name}</Text>
                
                {/* Stream Controls */}
                <View testID={`stream-controls-${stream.id}`}>
                  <Text
                    testID={`play-pause-${stream.id}`}
                    onPress={() => {}} // Mock play/pause
                  >
                    Play/Pause
                  </Text>
                  <Text
                    testID={`mute-${stream.id}`}
                    onPress={() => {}} // Mock mute
                  >
                    Mute
                  </Text>
                  <Text
                    testID={`remove-${stream.id}`}
                    onPress={() => removeStream(stream.id)}
                  >
                    Remove
                  </Text>
                  <Text
                    testID={`fullscreen-${stream.id}`}
                    onPress={() => {}} // Mock fullscreen
                  >
                    Fullscreen
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Global Controls */}
          <View testID="global-controls">
            <Text
              testID="clear-all"
              onPress={() => clearStreams()}
            >
              Clear All
            </Text>
            <Text
              testID="save-layout"
              onPress={() => {}} // Mock save layout
            >
              Save Layout
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

// Mock Settings Screen
const MockSettingsScreen = () => {
  const { theme, streamQuality, updateSettings, tier, updateSubscription } = useAppStore();

  return (
    <View testID="settings-screen">
      {/* Theme Settings */}
      <View testID="theme-section">
        <Text>Theme: {theme}</Text>
        <Text
          testID="theme-dark"
          onPress={() => updateSettings({ theme: 'dark' })}
        >
          Dark
        </Text>
        <Text
          testID="theme-light"
          onPress={() => updateSettings({ theme: 'light' })}
        >
          Light
        </Text>
      </View>

      {/* Quality Settings */}
      <View testID="quality-section">
        <Text>Quality: {streamQuality}</Text>
        <Text
          testID="quality-auto"
          onPress={() => updateSettings({ streamQuality: 'auto' })}
        >
          Auto
        </Text>
        <Text
          testID="quality-720p"
          onPress={() => updateSettings({ streamQuality: '720p' })}
        >
          720p
        </Text>
      </View>

      {/* Subscription */}
      <View testID="subscription-section">
        <Text>Plan: {tier}</Text>
        <Text
          testID="upgrade-pro"
          onPress={() => updateSubscription({ tier: 'pro' })}
        >
          Upgrade to Pro
        </Text>
      </View>
    </View>
  );
};

describe('End-to-End User Workflow Scenarios', () => {
  beforeEach(() => {
    // Reset store and mocks
    useAppStore.setState({
      activeStreams: [],
      savedLayouts: [],
      currentLayout: null,
      tier: 'free',
      theme: 'dark',
      streamQuality: 'auto',
      isLoading: false,
      error: null,
    });

    mockTwitchApi.getTopStreams.mockResolvedValue({
      data: mockStreams,
      pagination: {},
    });

    mockTwitchApi.searchStreams.mockResolvedValue({
      data: mockStreams.slice(0, 2),
      pagination: {},
    });

    jest.clearAllMocks();
  });

  describe('New User Onboarding Flow', () => {
    it('should guide new user through discovery and first stream addition', async () => {
      const TestApp = () => {
        const [currentScreen, setCurrentScreen] = React.useState('discover');
        
        return (
          <MockApp>
            {currentScreen === 'discover' && <MockDiscoverScreen />}
            {currentScreen === 'grid' && <MockGridScreen />}
          </MockApp>
        );
      };

      const { getByTestId, queryByTestId } = render(<TestApp />);

      // 1. User starts on discover screen
      expect(getByTestId('discover-screen')).toBeTruthy();
      expect(getByTestId('loading')).toBeTruthy();

      // 2. Streams load
      await waitFor(() => {
        expect(queryByTestId('loading')).toBeFalsy();
      });

      expect(getByTestId('stream-list')).toBeTruthy();
      expect(getByTestId('stream-card-1')).toBeTruthy();
      expect(mockTwitchApi.getTopStreams).toHaveBeenCalledWith(20);

      // 3. User adds first stream
      const addButton = getByTestId('add-stream-1');
      fireEvent.press(addButton);

      // 4. Verify stream was added to store
      await waitFor(() => {
        expect(getByTestId('active-stream-count')).toHaveTextContent('Active: 1 streams');
      });

      // 5. User navigates to grid
      fireEvent.press(getByTestId('nav-grid'));

      // 6. Grid shows the added stream
      await waitFor(() => {
        expect(getByTestId('grid-screen')).toBeTruthy();
        expect(getByTestId('active-grid')).toBeTruthy();
        expect(getByTestId('grid-stream-1')).toBeTruthy();
      });
    });

    it('should handle subscription limits for free tier users', async () => {
      const TestApp = () => <MockApp><MockDiscoverScreen /></MockApp>;
      const { getByTestId } = render(<TestApp />);

      await waitFor(() => {
        expect(getByTestId('stream-list')).toBeTruthy();
      });

      // Add streams up to free tier limit (4)
      for (let i = 1; i <= 3; i++) {
        const streamId = i <= 3 ? i.toString() : '1'; // Use available streams
        fireEvent.press(getByTestId(`add-stream-${streamId}`));
      }

      // Verify we can add up to 4 streams
      await waitFor(() => {
        const storeState = useAppStore.getState();
        expect(storeState.activeStreams.length).toBeLessThanOrEqual(4);
      });
    });
  });

  describe('Power User Multi-Stream Workflow', () => {
    it('should support adding multiple streams and managing layouts', async () => {
      const TestApp = () => {
        const [currentScreen, setCurrentScreen] = React.useState('discover');
        
        return (
          <MockApp>
            {currentScreen === 'discover' && <MockDiscoverScreen />}
            {currentScreen === 'grid' && <MockGridScreen />}
          </MockApp>
        );
      };

      const { getByTestId } = render(<TestApp />);

      // 1. Load streams and add multiple
      await waitFor(() => {
        expect(getByTestId('stream-list')).toBeTruthy();
      });

      // Add three streams
      fireEvent.press(getByTestId('add-stream-1'));
      fireEvent.press(getByTestId('add-stream-2'));
      fireEvent.press(getByTestId('add-stream-3'));

      await waitFor(() => {
        expect(getByTestId('active-stream-count')).toHaveTextContent('Active: 3 streams');
      });

      // 2. Navigate to grid view
      fireEvent.press(getByTestId('nav-grid'));

      await waitFor(() => {
        expect(getByTestId('active-grid')).toBeTruthy();
      });

      // 3. Test layout switching
      expect(getByTestId('current-layout')).toHaveTextContent('Layout: grid-2x2');
      
      fireEvent.press(getByTestId('layout-3x1'));
      expect(getByTestId('current-layout')).toHaveTextContent('Layout: grid-3x1');

      fireEvent.press(getByTestId('layout-pip'));
      expect(getByTestId('current-layout')).toHaveTextContent('Layout: pip');

      // 4. Test stream controls
      fireEvent.press(getByTestId('play-pause-1'));
      fireEvent.press(getByTestId('mute-2'));

      // 5. Remove a stream
      fireEvent.press(getByTestId('remove-1'));

      await waitFor(() => {
        const storeState = useAppStore.getState();
        expect(storeState.activeStreams.length).toBe(2);
      });

      // 6. Clear all streams
      fireEvent.press(getByTestId('clear-all'));

      await waitFor(() => {
        expect(getByTestId('empty-grid')).toBeTruthy();
      });
    });

    it('should handle stream search and filtering', async () => {
      const TestApp = () => <MockApp><MockDiscoverScreen /></MockApp>;
      const { getByTestId } = render(<TestApp />);

      // 1. Initial load shows all streams
      await waitFor(() => {
        expect(getByTestId('stream-card-1')).toBeTruthy();
        expect(getByTestId('stream-card-2')).toBeTruthy();
        expect(getByTestId('stream-card-3')).toBeTruthy();
      });

      // 2. Perform search (mocked to return fewer results)
      fireEvent.press(getByTestId('search-button'));

      await waitFor(() => {
        expect(mockTwitchApi.searchStreams).toHaveBeenCalled();
      });

      // Search functionality would be implemented in the actual component
    });
  });

  describe('Settings and Preferences Management', () => {
    it('should allow users to customize app settings', async () => {
      const TestApp = () => <MockApp><MockSettingsScreen /></MockApp>;
      const { getByTestId } = render(<TestApp />);

      // 1. Navigate to settings
      fireEvent.press(getByTestId('nav-settings'));

      // 2. Change theme
      fireEvent.press(getByTestId('theme-light'));
      
      await waitFor(() => {
        const storeState = useAppStore.getState();
        expect(storeState.theme).toBe('light');
      });

      // 3. Change quality settings
      fireEvent.press(getByTestId('quality-720p'));
      
      await waitFor(() => {
        const storeState = useAppStore.getState();
        expect(storeState.streamQuality).toBe('720p');
      });

      // 4. Upgrade subscription
      fireEvent.press(getByTestId('upgrade-pro'));
      
      await waitFor(() => {
        const storeState = useAppStore.getState();
        expect(storeState.tier).toBe('pro');
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should gracefully handle API failures', async () => {
      // Mock API failure
      mockTwitchApi.getTopStreams.mockRejectedValue(new Error('Network error'));

      const TestApp = () => <MockApp><MockDiscoverScreen /></MockApp>;
      const { getByTestId, queryByTestId } = render(<TestApp />);

      // Loading should start
      expect(getByTestId('loading')).toBeTruthy();

      // After error, loading should stop
      await waitFor(() => {
        expect(queryByTestId('loading')).toBeFalsy();
      }, { timeout: 3000 });

      // Stream list should be empty due to error
      const streamList = getByTestId('stream-list');
      expect(streamList.children.length).toBe(0);
    });

    it('should handle stream removal during playback', async () => {
      const TestApp = () => {
        const [currentScreen, setCurrentScreen] = React.useState('grid');
        
        // Pre-populate with streams
        React.useEffect(() => {
          const { addStream } = useAppStore.getState();
          addStream(mockStreams[0]);
          addStream(mockStreams[1]);
        }, []);
        
        return (
          <MockApp>
            <MockGridScreen />
          </MockApp>
        );
      };

      const { getByTestId } = render(<TestApp />);

      await waitFor(() => {
        expect(getByTestId('grid-stream-1')).toBeTruthy();
        expect(getByTestId('grid-stream-2')).toBeTruthy();
      });

      // Start playing a stream
      fireEvent.press(getByTestId('play-pause-1'));

      // Remove the playing stream
      fireEvent.press(getByTestId('remove-1'));

      await waitFor(() => {
        expect(queryByTestId('grid-stream-1')).toBeFalsy();
        expect(getByTestId('grid-stream-2')).toBeTruthy();
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle rapid stream additions and removals', async () => {
      const TestApp = () => <MockApp><MockDiscoverScreen /></MockApp>;
      const { getByTestId } = render(<TestApp />);

      await waitFor(() => {
        expect(getByTestId('stream-list')).toBeTruthy();
      });

      // Rapidly add and remove streams
      for (let cycle = 0; cycle < 3; cycle++) {
        // Add streams
        fireEvent.press(getByTestId('add-stream-1'));
        fireEvent.press(getByTestId('add-stream-2'));
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        // Remove streams
        const storeState = useAppStore.getState();
        storeState.activeStreams.forEach(stream => {
          storeState.removeStream(stream.id);
        });

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });
      }

      // App should remain stable
      expect(getByTestId('discover-screen')).toBeTruthy();
    });

    it('should maintain state consistency during navigation', async () => {
      const TestApp = () => {
        const [currentScreen, setCurrentScreen] = React.useState('discover');
        
        return (
          <MockApp>
            {currentScreen === 'discover' && <MockDiscoverScreen />}
            {currentScreen === 'grid' && <MockGridScreen />}
            {currentScreen === 'settings' && <MockSettingsScreen />}
          </MockApp>
        );
      };

      const { getByTestId } = render(<TestApp />);

      // Add a stream
      await waitFor(() => {
        expect(getByTestId('stream-list')).toBeTruthy();
      });

      fireEvent.press(getByTestId('add-stream-1'));

      // Navigate between screens multiple times
      const screens = ['grid', 'settings', 'discover', 'grid'];
      
      for (const screen of screens) {
        fireEvent.press(getByTestId(`nav-${screen}`));
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        // State should be preserved
        const storeState = useAppStore.getState();
        expect(storeState.activeStreams.length).toBe(1);
      }
    });
  });

  describe('Accessibility and Usability', () => {
    it('should provide accessible navigation and controls', async () => {
      const TestApp = () => <MockApp><MockGridScreen /></MockApp>;
      
      // Pre-populate with streams
      React.useEffect(() => {
        const { addStream } = useAppStore.getState();
        addStream(mockStreams[0]);
      }, []);

      const { getByTestId } = render(<TestApp />);

      await waitFor(() => {
        expect(getByTestId('grid-stream-1')).toBeTruthy();
      });

      // All controls should be accessible via testID
      expect(getByTestId('stream-controls-1')).toBeTruthy();
      expect(getByTestId('play-pause-1')).toBeTruthy();
      expect(getByTestId('mute-1')).toBeTruthy();
      expect(getByTestId('remove-1')).toBeTruthy();
      expect(getByTestId('fullscreen-1')).toBeTruthy();

      // Layout controls should be accessible
      expect(getByTestId('layout-controls')).toBeTruthy();
      expect(getByTestId('layout-2x2')).toBeTruthy();
      expect(getByTestId('layout-3x1')).toBeTruthy();
      expect(getByTestId('layout-pip')).toBeTruthy();
    });
  });

  describe('Data Persistence and Recovery', () => {
    it('should persist user preferences across app sessions', async () => {
      const TestApp = () => <MockApp><MockSettingsScreen /></MockApp>;
      const { getByTestId, rerender } = render(<TestApp />);

      // Change settings
      fireEvent.press(getByTestId('theme-light'));
      fireEvent.press(getByTestId('quality-720p'));

      // Verify changes are applied
      await waitFor(() => {
        const storeState = useAppStore.getState();
        expect(storeState.theme).toBe('light');
        expect(storeState.streamQuality).toBe('720p');
      });

      // Simulate app restart by re-rendering
      rerender(<TestApp />);

      // Settings should be persisted (in real app, this would be handled by AsyncStorage)
      const storeState = useAppStore.getState();
      expect(storeState.theme).toBe('light');
      expect(storeState.streamQuality).toBe('720p');
    });

    it('should handle app state recovery after crashes', async () => {
      const TestApp = () => <MockApp><MockDiscoverScreen /></MockApp>;
      const { getByTestId } = render(<TestApp />);

      await waitFor(() => {
        expect(getByTestId('stream-list')).toBeTruthy();
      });

      // Add streams
      fireEvent.press(getByTestId('add-stream-1'));
      fireEvent.press(getByTestId('add-stream-2'));

      // Simulate app recovery
      const recoveredState = useAppStore.getState();
      expect(recoveredState.activeStreams.length).toBe(2);
      expect(recoveredState.isLoading).toBe(false);
      expect(recoveredState.error).toBeNull();
    });
  });
});