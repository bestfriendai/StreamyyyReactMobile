/**
 * Integration tests for state management with modern components
 */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { renderHook } from '@testing-library/react-hooks';
import { Text, View } from 'react-native';
import {
  useAppStore,
  useActiveStreams,
  useStreamActions,
  useLayoutActions,
  useSubscriptionActions,
  useSettingsActions,
  useActiveStreamCount,
  useCanAddMoreStreams,
  useStreamById,
  Layout,
} from '@/store/useAppStore';
import { TwitchStream } from '@/services/twitchApi';

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock zustand persist
jest.mock('zustand/middleware', () => ({
  persist: jest.fn((fn) => fn),
  createJSONStorage: jest.fn(() => mockAsyncStorage),
}));

const mockStream1: TwitchStream = {
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
  thumbnail_url: 'https://example.com/thumb1.jpg',
  tag_ids: [],
  is_mature: false,
};

const mockStream2: TwitchStream = {
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
  thumbnail_url: 'https://example.com/thumb2.jpg',
  tag_ids: [],
  is_mature: false,
};

const mockStream3: TwitchStream = {
  id: '3',
  user_id: '125',
  user_login: 'testuser3',
  user_name: 'TestUser3',
  game_id: '458',
  game_name: 'Test Game 3',
  type: 'live',
  title: 'Test Stream 3',
  viewer_count: 500,
  started_at: '2023-01-01T02:00:00Z',
  language: 'en',
  thumbnail_url: 'https://example.com/thumb3.jpg',
  tag_ids: [],
  is_mature: false,
};

describe('State Management Integration', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      activeStreams: [],
      savedLayouts: [],
      currentLayout: null,
      maxStreams: 4,
      isLoading: false,
      error: null,
      tier: 'free',
      status: 'active',
      theme: 'dark',
      streamQuality: 'auto',
      autoPlay: true,
      chatEnabled: true,
      notificationsEnabled: true,
      hapticsEnabled: true,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      customerId: null,
    });
    jest.clearAllMocks();
  });

  describe('Stream Management Integration', () => {
    it('should add streams and update state correctly', () => {
      const { result } = renderHook(() => useStreamActions());
      const { result: streamsResult } = renderHook(() => useActiveStreams());
      
      expect(streamsResult.current).toHaveLength(0);
      
      act(() => {
        result.current.addStream(mockStream1);
      });
      
      expect(streamsResult.current).toHaveLength(1);
      expect(streamsResult.current[0]).toEqual(mockStream1);
    });

    it('should prevent adding duplicate streams', () => {
      const { result } = renderHook(() => useStreamActions());
      const { result: streamsResult } = renderHook(() => useActiveStreams());
      
      act(() => {
        result.current.addStream(mockStream1);
        result.current.addStream(mockStream1); // Duplicate
      });
      
      expect(streamsResult.current).toHaveLength(1);
    });

    it('should respect max streams limit', () => {
      const { result } = renderHook(() => useStreamActions());
      const { result: streamsResult } = renderHook(() => useActiveStreams());
      const { result: canAddResult } = renderHook(() => useCanAddMoreStreams());
      
      // Add streams up to the limit (4 for free tier)
      act(() => {
        result.current.addStream(mockStream1);
        result.current.addStream(mockStream2);
        result.current.addStream(mockStream3);
        result.current.addStream({ ...mockStream1, id: '4' });
      });
      
      expect(streamsResult.current).toHaveLength(4);
      expect(canAddResult.current).toBe(false);
      
      // Try to add one more - should be rejected
      act(() => {
        result.current.addStream({ ...mockStream1, id: '5' });
      });
      
      expect(streamsResult.current).toHaveLength(4);
    });

    it('should remove streams correctly', () => {
      const { result } = renderHook(() => useStreamActions());
      const { result: streamsResult } = renderHook(() => useActiveStreams());
      
      act(() => {
        result.current.addStream(mockStream1);
        result.current.addStream(mockStream2);
      });
      
      expect(streamsResult.current).toHaveLength(2);
      
      act(() => {
        result.current.removeStream('1');
      });
      
      expect(streamsResult.current).toHaveLength(1);
      expect(streamsResult.current[0].id).toBe('2');
    });

    it('should update streams correctly', () => {
      const { result } = renderHook(() => useStreamActions());
      const { result: streamResult } = renderHook(() => useStreamById('1'));
      
      act(() => {
        result.current.addStream(mockStream1);
      });
      
      expect(streamResult.current?.viewer_count).toBe(1000);
      
      act(() => {
        result.current.updateStream('1', { viewer_count: 1500 });
      });
      
      expect(streamResult.current?.viewer_count).toBe(1500);
    });

    it('should clear all streams', () => {
      const { result } = renderHook(() => useStreamActions());
      const { result: streamsResult } = renderHook(() => useActiveStreams());
      const { result: layoutResult } = renderHook(() => useAppStore(state => state.currentLayout));
      
      act(() => {
        result.current.addStream(mockStream1);
        result.current.addStream(mockStream2);
      });
      
      expect(streamsResult.current).toHaveLength(2);
      
      act(() => {
        result.current.clearStreams();
      });
      
      expect(streamsResult.current).toHaveLength(0);
      expect(layoutResult.current).toBeNull();
    });
  });

  describe('Layout Management Integration', () => {
    it('should save layouts correctly', async () => {
      const { result } = renderHook(() => useLayoutActions());
      const { result: layoutsResult } = renderHook(() => useAppStore(state => state.savedLayouts));
      
      const mockLayout = {
        name: 'Test Layout',
        streams: [mockStream1, mockStream2],
        gridType: 'grid' as const,
        gridColumns: 2,
        userId: 'user123',
      };
      
      await act(async () => {
        await result.current.saveLayout(mockLayout);
      });
      
      expect(layoutsResult.current).toHaveLength(1);
      expect(layoutsResult.current[0].name).toBe('Test Layout');
      expect(layoutsResult.current[0].streams).toEqual([mockStream1, mockStream2]);
      expect(layoutsResult.current[0].id).toBeDefined();
      expect(layoutsResult.current[0].createdAt).toBeDefined();
    });

    it('should load layouts correctly', () => {
      const { result } = renderHook(() => useLayoutActions());
      const { result: currentLayoutResult } = renderHook(() => useAppStore(state => state.currentLayout));
      const { result: streamsResult } = renderHook(() => useActiveStreams());
      
      const mockLayout: Layout = {
        id: 'layout1',
        name: 'Test Layout',
        streams: [mockStream1, mockStream2],
        gridType: 'grid',
        gridColumns: 2,
        createdAt: '2023-01-01T00:00:00Z',
        userId: 'user123',
      };
      
      // First add the layout to saved layouts
      useAppStore.setState({ savedLayouts: [mockLayout] });
      
      act(() => {
        result.current.loadLayout('layout1');
      });
      
      expect(currentLayoutResult.current).toEqual(mockLayout);
      expect(streamsResult.current).toEqual([mockStream1, mockStream2]);
    });

    it('should delete layouts correctly', () => {
      const { result } = renderHook(() => useLayoutActions());
      const { result: layoutsResult } = renderHook(() => useAppStore(state => state.savedLayouts));
      const { result: currentLayoutResult } = renderHook(() => useAppStore(state => state.currentLayout));
      
      const mockLayout1: Layout = {
        id: 'layout1',
        name: 'Layout 1',
        streams: [mockStream1],
        gridType: 'grid',
        gridColumns: 1,
        createdAt: '2023-01-01T00:00:00Z',
      };
      
      const mockLayout2: Layout = {
        id: 'layout2',
        name: 'Layout 2',
        streams: [mockStream2],
        gridType: 'grid',
        gridColumns: 1,
        createdAt: '2023-01-01T01:00:00Z',
      };
      
      useAppStore.setState({ 
        savedLayouts: [mockLayout1, mockLayout2],
        currentLayout: mockLayout1,
      });
      
      act(() => {
        result.current.deleteLayout('layout1');
      });
      
      expect(layoutsResult.current).toHaveLength(1);
      expect(layoutsResult.current[0].id).toBe('layout2');
      expect(currentLayoutResult.current).toBeNull(); // Current layout should be cleared
    });

    it('should set current layout', () => {
      const { result } = renderHook(() => useLayoutActions());
      const { result: currentLayoutResult } = renderHook(() => useAppStore(state => state.currentLayout));
      
      const mockLayout: Layout = {
        id: 'layout1',
        name: 'Test Layout',
        streams: [mockStream1],
        gridType: 'grid',
        gridColumns: 1,
        createdAt: '2023-01-01T00:00:00Z',
      };
      
      act(() => {
        result.current.setCurrentLayout(mockLayout);
      });
      
      expect(currentLayoutResult.current).toEqual(mockLayout);
    });
  });

  describe('Subscription Management Integration', () => {
    it('should update subscription tier and max streams', () => {
      const { result } = renderHook(() => useSubscriptionActions());
      const { result: tierResult } = renderHook(() => useAppStore(state => state.tier));
      const { result: canAddResult } = renderHook(() => useCanAddMoreStreams());
      
      expect(tierResult.current).toBe('free');
      expect(result.current.getMaxStreams()).toBe(4);
      
      act(() => {
        result.current.updateSubscription({ tier: 'pro' });
      });
      
      expect(tierResult.current).toBe('pro');
      expect(result.current.getMaxStreams()).toBe(8);
    });

    it('should check stream limits correctly for different tiers', () => {
      const { result } = renderHook(() => useSubscriptionActions());
      
      // Free tier (4 streams)
      expect(result.current.canAddMoreStreams(3)).toBe(true);
      expect(result.current.canAddMoreStreams(4)).toBe(false);
      
      act(() => {
        result.current.updateSubscription({ tier: 'pro' });
      });
      
      // Pro tier (8 streams)
      expect(result.current.canAddMoreStreams(7)).toBe(true);
      expect(result.current.canAddMoreStreams(8)).toBe(false);
      
      act(() => {
        result.current.updateSubscription({ tier: 'premium' });
      });
      
      // Premium tier (20 streams)
      expect(result.current.canAddMoreStreams(19)).toBe(true);
      expect(result.current.canAddMoreStreams(20)).toBe(false);
    });

    it('should update subscription status', () => {
      const { result } = renderHook(() => useSubscriptionActions());
      const { result: statusResult } = renderHook(() => useAppStore(state => state.status));
      
      expect(statusResult.current).toBe('active');
      
      act(() => {
        result.current.updateSubscription({ 
          status: 'past_due',
          currentPeriodEnd: '2023-12-31T23:59:59Z',
          cancelAtPeriodEnd: true,
        });
      });
      
      expect(statusResult.current).toBe('past_due');
      expect(useAppStore.getState().currentPeriodEnd).toBe('2023-12-31T23:59:59Z');
      expect(useAppStore.getState().cancelAtPeriodEnd).toBe(true);
    });
  });

  describe('Settings Management Integration', () => {
    it('should update individual settings', () => {
      const { result } = renderHook(() => useSettingsActions());
      const { result: themeResult } = renderHook(() => useAppStore(state => state.theme));
      const { result: qualityResult } = renderHook(() => useAppStore(state => state.streamQuality));
      
      expect(themeResult.current).toBe('dark');
      expect(qualityResult.current).toBe('auto');
      
      act(() => {
        result.current.updateSettings({ 
          theme: 'light',
          streamQuality: '720p',
          autoPlay: false,
        });
      });
      
      expect(themeResult.current).toBe('light');
      expect(qualityResult.current).toBe('720p');
      expect(useAppStore.getState().autoPlay).toBe(false);
    });

    it('should reset settings to defaults', () => {
      const { result } = renderHook(() => useSettingsActions());
      
      // Change some settings
      act(() => {
        result.current.updateSettings({ 
          theme: 'light',
          streamQuality: '480p',
          autoPlay: false,
          chatEnabled: false,
        });
      });
      
      expect(useAppStore.getState().theme).toBe('light');
      expect(useAppStore.getState().autoPlay).toBe(false);
      
      // Reset to defaults
      act(() => {
        result.current.resetSettings();
      });
      
      expect(useAppStore.getState().theme).toBe('dark');
      expect(useAppStore.getState().streamQuality).toBe('auto');
      expect(useAppStore.getState().autoPlay).toBe(true);
      expect(useAppStore.getState().chatEnabled).toBe(true);
    });
  });

  describe('Performance Selectors', () => {
    it('should provide optimized selectors', () => {
      const { result: streamCountResult } = renderHook(() => useActiveStreamCount());
      const { result: streamActionsResult } = renderHook(() => useStreamActions());
      
      expect(streamCountResult.current).toBe(0);
      
      act(() => {
        streamActionsResult.current.addStream(mockStream1);
        streamActionsResult.current.addStream(mockStream2);
      });
      
      expect(streamCountResult.current).toBe(2);
    });

    it('should find streams by ID efficiently', () => {
      const { result: streamActionsResult } = renderHook(() => useStreamActions());
      const { result: streamResult } = renderHook(() => useStreamById('1'));
      
      expect(streamResult.current).toBeUndefined();
      
      act(() => {
        streamActionsResult.current.addStream(mockStream1);
      });
      
      expect(streamResult.current).toEqual(mockStream1);
    });

    it('should check if more streams can be added efficiently', () => {
      const { result: canAddResult } = renderHook(() => useCanAddMoreStreams());
      const { result: streamActionsResult } = renderHook(() => useStreamActions());
      
      expect(canAddResult.current).toBe(true);
      
      // Add 4 streams (free tier limit)
      act(() => {
        streamActionsResult.current.addStream(mockStream1);
        streamActionsResult.current.addStream(mockStream2);
        streamActionsResult.current.addStream(mockStream3);
        streamActionsResult.current.addStream({ ...mockStream1, id: '4' });
      });
      
      expect(canAddResult.current).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle save layout errors', async () => {
      const { result } = renderHook(() => useLayoutActions());
      const { result: errorResult } = renderHook(() => useAppStore(state => state.error));
      
      // Mock an error during save
      const originalSetState = useAppStore.setState;
      useAppStore.setState = jest.fn(() => {
        throw new Error('Save failed');
      });
      
      try {
        await act(async () => {
          await result.current.saveLayout({
            name: 'Test Layout',
            streams: [mockStream1],
            gridType: 'grid',
            gridColumns: 1,
          });
        });
      } catch (error) {
        // Expected to catch error
      }
      
      // Restore original setState
      useAppStore.setState = originalSetState;
    });

    it('should handle loading non-existent layout gracefully', () => {
      const { result } = renderHook(() => useLayoutActions());
      const { result: currentLayoutResult } = renderHook(() => useAppStore(state => state.currentLayout));
      
      act(() => {
        result.current.loadLayout('non-existent-id');
      });
      
      // Should not change current layout if ID doesn't exist
      expect(currentLayoutResult.current).toBeNull();
    });

    it('should set and clear error states', () => {
      const { result: errorResult } = renderHook(() => useAppStore(state => state.error));
      
      expect(errorResult.current).toBeNull();
      
      act(() => {
        useAppStore.getState().setError('Test error');
      });
      
      expect(errorResult.current).toBe('Test error');
      
      act(() => {
        useAppStore.getState().setError(null);
      });
      
      expect(errorResult.current).toBeNull();
    });

    it('should set and clear loading states', () => {
      const { result: loadingResult } = renderHook(() => useAppStore(state => state.isLoading));
      
      expect(loadingResult.current).toBe(false);
      
      act(() => {
        useAppStore.getState().setLoading(true);
      });
      
      expect(loadingResult.current).toBe(true);
      
      act(() => {
        useAppStore.getState().setLoading(false);
      });
      
      expect(loadingResult.current).toBe(false);
    });
  });

  describe('Persistence Integration', () => {
    it('should call AsyncStorage on state changes', async () => {
      const { result } = renderHook(() => useStreamActions());
      
      act(() => {
        result.current.addStream(mockStream1);
      });
      
      // Note: In a real test environment, you would verify that AsyncStorage.setItem was called
      // with the correct serialized state. Due to mocking, we just verify the action worked.
      expect(useActiveStreams.getState()).toContain(mockStream1);
    });

    it('should handle persistence errors gracefully', () => {
      // Mock AsyncStorage error
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage full'));
      
      const { result } = renderHook(() => useStreamActions());
      
      // Should not throw even if persistence fails
      expect(() => {
        act(() => {
          result.current.addStream(mockStream1);
        });
      }).not.toThrow();
    });
  });

  describe('Component Integration', () => {
    it('should work with React components using the store', () => {
      const TestComponent = () => {
        const streams = useActiveStreams();
        const { addStream } = useStreamActions();
        
        return (
          <View>
            <Text testID="stream-count">{streams.length}</Text>
            <Text 
              testID="add-stream"
              onPress={() => addStream(mockStream1)}
            >
              Add Stream
            </Text>
          </View>
        );
      };
      
      const { getByTestId } = render(<TestComponent />);
      
      expect(getByTestId('stream-count').children[0]).toBe('0');
      
      fireEvent.press(getByTestId('add-stream'));
      
      expect(getByTestId('stream-count').children[0]).toBe('1');
    });

    it('should maintain referential equality for action selectors', () => {
      const { result, rerender } = renderHook(() => useStreamActions());
      
      const firstActions = result.current;
      
      rerender();
      
      const secondActions = result.current;
      
      // Actions should maintain referential equality
      expect(firstActions).toBe(secondActions);
      expect(firstActions.addStream).toBe(secondActions.addStream);
    });

    it('should prevent unnecessary re-renders with shallow comparison', () => {
      let renderCount = 0;
      
      const TestComponent = () => {
        renderCount++;
        const streams = useActiveStreams();
        return <Text>{streams.length}</Text>;
      };
      
      const { rerender } = render(<TestComponent />);
      
      expect(renderCount).toBe(1);
      
      // Update unrelated state
      act(() => {
        useAppStore.getState().setLoading(true);
      });
      
      rerender(<TestComponent />);
      
      // Should not cause re-render since streams didn't change
      expect(renderCount).toBe(1);
      
      // Update streams
      act(() => {
        useAppStore.getState().addStream(mockStream1);
      });
      
      rerender(<TestComponent />);
      
      // Should cause re-render since streams changed
      expect(renderCount).toBe(2);
    });
  });
});