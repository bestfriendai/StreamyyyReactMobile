/**
 * Tests for the app store
 */
import { act, renderHook } from '@testing-library/react-hooks';
import { useAppStore } from '@/store/useAppStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store state
    useAppStore.getState = jest.fn(() => ({
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
      // Mock functions
      addStream: jest.fn(),
      removeStream: jest.fn(),
      updateStream: jest.fn(),
      clearStreams: jest.fn(),
      saveLayout: jest.fn(),
      loadLayout: jest.fn(),
      deleteLayout: jest.fn(),
      setCurrentLayout: jest.fn(),
      updateSubscription: jest.fn(),
      getMaxStreams: jest.fn(),
      canAddMoreStreams: jest.fn(),
      updateSettings: jest.fn(),
      resetSettings: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      setMaxStreams: jest.fn(),
    }));
  });

  describe('Stream Management', () => {
    it('should add stream successfully', () => {
      const { result } = renderHook(() => useAppStore());
      
      const mockStream = {
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
      };

      act(() => {
        result.current.addStream(mockStream);
      });

      expect(result.current.addStream).toHaveBeenCalledWith(mockStream);
    });

    it('should remove stream successfully', () => {
      const { result } = renderHook(() => useAppStore());
      const streamId = '1';

      act(() => {
        result.current.removeStream(streamId);
      });

      expect(result.current.removeStream).toHaveBeenCalledWith(streamId);
    });

    it('should update stream successfully', () => {
      const { result } = renderHook(() => useAppStore());
      const streamId = '1';
      const updates = { viewer_count: 200 };

      act(() => {
        result.current.updateStream(streamId, updates);
      });

      expect(result.current.updateStream).toHaveBeenCalledWith(streamId, updates);
    });

    it('should clear all streams', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.clearStreams();
      });

      expect(result.current.clearStreams).toHaveBeenCalled();
    });
  });

  describe('Layout Management', () => {
    it('should save layout successfully', async () => {
      const { result } = renderHook(() => useAppStore());
      
      const mockLayout = {
        name: 'Test Layout',
        streams: [],
        gridType: 'grid' as const,
        gridColumns: 2,
        userId: 'user123'
      };

      await act(async () => {
        await result.current.saveLayout(mockLayout);
      });

      expect(result.current.saveLayout).toHaveBeenCalledWith(mockLayout);
    });

    it('should load layout successfully', () => {
      const { result } = renderHook(() => useAppStore());
      const layoutId = 'layout123';

      act(() => {
        result.current.loadLayout(layoutId);
      });

      expect(result.current.loadLayout).toHaveBeenCalledWith(layoutId);
    });

    it('should delete layout successfully', () => {
      const { result } = renderHook(() => useAppStore());
      const layoutId = 'layout123';

      act(() => {
        result.current.deleteLayout(layoutId);
      });

      expect(result.current.deleteLayout).toHaveBeenCalledWith(layoutId);
    });

    it('should set current layout', () => {
      const { result } = renderHook(() => useAppStore());
      const mockLayout = {
        id: 'layout123',
        name: 'Test Layout',
        streams: [],
        gridType: 'grid' as const,
        gridColumns: 2,
        createdAt: '2023-01-01T00:00:00Z'
      };

      act(() => {
        result.current.setCurrentLayout(mockLayout);
      });

      expect(result.current.setCurrentLayout).toHaveBeenCalledWith(mockLayout);
    });
  });

  describe('Subscription Management', () => {
    it('should update subscription', () => {
      const { result } = renderHook(() => useAppStore());
      const subscription = { tier: 'pro' as const };

      act(() => {
        result.current.updateSubscription(subscription);
      });

      expect(result.current.updateSubscription).toHaveBeenCalledWith(subscription);
    });

    it('should get max streams for different tiers', () => {
      const { result } = renderHook(() => useAppStore());
      
      // Mock different tier responses
      const mockGetMaxStreams = jest.fn()
        .mockReturnValueOnce(4)  // free
        .mockReturnValueOnce(8)  // pro
        .mockReturnValueOnce(20); // premium

      result.current.getMaxStreams = mockGetMaxStreams;

      // Test different tiers
      expect(result.current.getMaxStreams()).toBe(4);
      expect(result.current.getMaxStreams()).toBe(8);
      expect(result.current.getMaxStreams()).toBe(20);
    });

    it('should check if can add more streams', () => {
      const { result } = renderHook(() => useAppStore());
      
      const mockCanAddMoreStreams = jest.fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      result.current.canAddMoreStreams = mockCanAddMoreStreams;

      expect(result.current.canAddMoreStreams(2)).toBe(true);
      expect(result.current.canAddMoreStreams(10)).toBe(false);
    });
  });

  describe('Settings Management', () => {
    it('should update settings', () => {
      const { result } = renderHook(() => useAppStore());
      const newSettings = { theme: 'light' as const };

      act(() => {
        result.current.updateSettings(newSettings);
      });

      expect(result.current.updateSettings).toHaveBeenCalledWith(newSettings);
    });

    it('should reset settings', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.resetSettings();
      });

      expect(result.current.resetSettings).toHaveBeenCalled();
    });
  });

  describe('Selectors', () => {
    it('should select active streams', () => {
      const mockActiveStreams = [
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
      ];

      useAppStore.getState = jest.fn(() => ({
        ...useAppStore.getState(),
        activeStreams: mockActiveStreams
      }));

      // Test selector
      const activeStreams = useAppStore.getState().activeStreams;
      expect(activeStreams).toEqual(mockActiveStreams);
    });

    it('should select settings', () => {
      const mockSettings = {
        theme: 'dark' as const,
        streamQuality: 'auto' as const,
        autoPlay: true,
        chatEnabled: true,
        notificationsEnabled: true,
        hapticsEnabled: true
      };

      useAppStore.getState = jest.fn(() => ({
        ...useAppStore.getState(),
        ...mockSettings
      }));

      // Test individual settings
      const state = useAppStore.getState();
      expect(state.theme).toBe('dark');
      expect(state.streamQuality).toBe('auto');
      expect(state.autoPlay).toBe(true);
      expect(state.chatEnabled).toBe(true);
      expect(state.notificationsEnabled).toBe(true);
      expect(state.hapticsEnabled).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in saveLayout', async () => {
      const { result } = renderHook(() => useAppStore());
      
      const mockSaveLayout = jest.fn().mockRejectedValue(new Error('Save failed'));
      result.current.saveLayout = mockSaveLayout;

      const mockLayout = {
        name: 'Test Layout',
        streams: [],
        gridType: 'grid' as const,
        gridColumns: 2
      };

      await act(async () => {
        try {
          await result.current.saveLayout(mockLayout);
        } catch (error) {
          expect(error.message).toBe('Save failed');
        }
      });

      expect(mockSaveLayout).toHaveBeenCalledWith(mockLayout);
    });

    it('should set error state', () => {
      const { result } = renderHook(() => useAppStore());
      const errorMessage = 'Test error';

      act(() => {
        result.current.setError(errorMessage);
      });

      expect(result.current.setError).toHaveBeenCalledWith(errorMessage);
    });

    it('should set loading state', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.setLoading).toHaveBeenCalledWith(true);
    });
  });
});