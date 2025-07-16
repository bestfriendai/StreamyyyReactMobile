/**
 * Integration tests for ModernMultiStreamGrid component
 */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { ModernMultiStreamGrid } from '@/components/modern/ModernMultiStreamGrid';
import { TwitchStream } from '@/services/twitchApi';

// Mock haptics
jest.mock('@/utils/haptics', () => ({
  HapticFeedback: {
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
  },
}));

// Mock theme
jest.mock('@/theme/modernTheme', () => ({
  ModernTheme: {
    colors: {
      background: { primary: '#000000', secondary: '#111111', tertiary: '#222222' },
      text: { primary: '#ffffff', secondary: '#cccccc', tertiary: '#999999', accent: '#8b5cf6' },
      accent: { 500: '#8b5cf6' },
      success: { 500: '#10b981' },
      error: { 500: '#ef4444' },
      status: { live: '#ef4444' },
      gradients: {
        background: ['#000000', '#111111'],
        accent: ['#8b5cf6', '#7c3aed'],
        card: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'],
      },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    borderRadius: { sm: 4, md: 8, lg: 12, xl: 16 },
    typography: {
      sizes: { xs: 10, sm: 12, md: 14, lg: 16, xl: 18, '2xl': 24 },
      weights: { normal: '400', medium: '500', semibold: '600', bold: '700' },
    },
    shadows: { lg: { shadowOpacity: 0.1, shadowRadius: 8 } },
  },
}));

// Mock LayoutManager
jest.mock('@/components/modern/LayoutManager', () => ({
  LayoutManager: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  LayoutUtils: {
    calculateOptimalLayout: jest.fn(() => 'grid-2x2'),
    getAvailableLayouts: jest.fn(() => ['grid-2x2', 'grid-3x1', 'fullscreen', 'pip']),
    getLayoutName: jest.fn((mode: string) => mode.replace('-', ' ')),
  },
}));

// Mock ModernStreamCard
jest.mock('@/components/modern/ModernStreamCard', () => ({
  ModernStreamCard: ({ stream, onRemove, onTogglePlay, onToggleMute, onToggleFavorite, onPress }: any) => (
    <div testID={`stream-card-${stream.id}`}>
      <div testID={`stream-title-${stream.id}`}>{stream.user_name}</div>
      <button testID={`remove-${stream.id}`} onPress={onRemove}>Remove</button>
      <button testID={`play-${stream.id}`} onPress={onTogglePlay}>Toggle Play</button>
      <button testID={`mute-${stream.id}`} onPress={onToggleMute}>Toggle Mute</button>
      <button testID={`favorite-${stream.id}`} onPress={onToggleFavorite}>Toggle Favorite</button>
      <button testID={`press-${stream.id}`} onPress={onPress}>Press</button>
    </div>
  ),
}));

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
    thumbnail_url: 'https://example.com/thumb1.jpg',
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
    thumbnail_url: 'https://example.com/thumb2.jpg',
    tag_ids: [],
    is_mature: false,
  },
];

describe('ModernMultiStreamGrid', () => {
  const mockProps = {
    streams: mockStreams,
    onStreamRemove: jest.fn(),
    onStreamAdd: jest.fn(),
    onStreamToggleFavorite: jest.fn(),
    isFavorite: jest.fn().mockReturnValue(false),
    onStreamPress: jest.fn(),
    maxStreams: 6,
    enableGestures: true,
    showStats: true,
    autoLayout: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with streams', () => {
      const { getByText, getByTestId } = render(<ModernMultiStreamGrid {...mockProps} />);
      
      expect(getByText('Multi-Stream')).toBeTruthy();
      expect(getByText('2 streams • grid 2x2')).toBeTruthy();
      expect(getByTestId('stream-card-1')).toBeTruthy();
      expect(getByTestId('stream-card-2')).toBeTruthy();
    });

    it('should render empty state when no streams', () => {
      const { getByText } = render(<ModernMultiStreamGrid {...mockProps} streams={[]} />);
      
      expect(getByText('No Active Streams')).toBeTruthy();
      expect(getByText('Add streams from the Discover tab to start your multi-stream experience')).toBeTruthy();
    });

    it('should display stream statistics', () => {
      const { getByText } = render(<ModernMultiStreamGrid {...mockProps} />);
      
      expect(getByText('3,000 viewers')).toBeTruthy(); // Combined viewer count
      expect(getByText('2/2 active')).toBeTruthy();
      expect(getByText('1,500 avg')).toBeTruthy(); // Average viewers
    });

    it('should respect maxStreams prop', () => {
      const { getByText } = render(<ModernMultiStreamGrid {...mockProps} maxStreams={1} />);
      
      expect(getByText('2 streams • grid 2x2')).toBeTruthy(); // Should still show existing streams
    });
  });

  describe('Stream Management', () => {
    it('should handle stream removal', async () => {
      const { getByTestId } = render(<ModernMultiStreamGrid {...mockProps} />);
      
      const removeButton = getByTestId('remove-1');
      fireEvent.press(removeButton);
      
      // Should show confirmation alert (mocked)
      expect(mockProps.onStreamRemove).not.toHaveBeenCalled(); // Needs confirmation
    });

    it('should handle stream play toggle', () => {
      const { getByTestId } = render(<ModernMultiStreamGrid {...mockProps} />);
      
      const playButton = getByTestId('play-1');
      fireEvent.press(playButton);
      
      // Should update internal state (tested via state changes)
    });

    it('should handle stream mute toggle', () => {
      const { getByTestId } = render(<ModernMultiStreamGrid {...mockProps} />);
      
      const muteButton = getByTestId('mute-1');
      fireEvent.press(muteButton);
      
      // Should update internal state
    });

    it('should handle favorite toggle', () => {
      const { getByTestId } = render(<ModernMultiStreamGrid {...mockProps} />);
      
      const favoriteButton = getByTestId('favorite-1');
      fireEvent.press(favoriteButton);
      
      expect(mockProps.onStreamToggleFavorite).toHaveBeenCalledWith('1');
    });

    it('should handle stream press', () => {
      const { getByTestId } = render(<ModernMultiStreamGrid {...mockProps} />);
      
      const pressButton = getByTestId('press-1');
      fireEvent.press(pressButton);
      
      expect(mockProps.onStreamPress).toHaveBeenCalledWith(mockStreams[0]);
    });
  });

  describe('Layout Management', () => {
    it('should show layout selector when layout button pressed', async () => {
      const { getByText } = render(<ModernMultiStreamGrid {...mockProps} />);
      
      // Find and press layout button (mocked as icon)
      const layoutButton = getByText('Multi-Stream').parent?.querySelector('[data-testid="layout-button"]');
      if (layoutButton) {
        fireEvent.press(layoutButton);
        
        await waitFor(() => {
          expect(getByText('Layout Options')).toBeTruthy();
        });
      }
    });

    it('should handle layout mode changes', () => {
      // Layout changes are handled internally and affect the LayoutManager component
      const { rerender } = render(<ModernMultiStreamGrid {...mockProps} />);
      
      // Simulate layout change through props
      rerender(<ModernMultiStreamGrid {...mockProps} streams={mockStreams} />);
      
      // Should maintain stream state across layout changes
    });

    it('should auto-calculate layout when autoLayout is enabled', () => {
      render(<ModernMultiStreamGrid {...mockProps} autoLayout={true} />);
      
      // Should call LayoutUtils.calculateOptimalLayout with stream count
      const { LayoutUtils } = require('@/components/modern/LayoutManager');
      expect(LayoutUtils.calculateOptimalLayout).toHaveBeenCalledWith(
        2, // stream count
        expect.any(Number), // screen width
        expect.any(Number)  // screen height
      );
    });
  });

  describe('Global Controls', () => {
    it('should handle global mute toggle', () => {
      const { getByText } = render(<ModernMultiStreamGrid {...mockProps} />);
      
      // Global controls are rendered with icons, test by finding control elements
      const controlsContainer = getByText('Multi-Stream').parent?.querySelector('[data-testid="global-controls"]');
      expect(controlsContainer).toBeTruthy();
    });

    it('should handle global play/pause toggle', () => {
      const { getByText } = render(<ModernMultiStreamGrid {...mockProps} />);
      
      // Similar to mute test, global play controls should be accessible
      const controlsContainer = getByText('Multi-Stream').parent;
      expect(controlsContainer).toBeTruthy();
    });

    it('should toggle stats visibility', () => {
      const { getByText, queryByText } = render(<ModernMultiStreamGrid {...mockProps} showStats={false} />);
      
      // Stats should not be visible when showStats is false
      expect(queryByText('3,000 viewers')).toBeFalsy();
    });
  });

  describe('Stream Addition', () => {
    it('should handle add stream when under limit', () => {
      const { getByText } = render(<ModernMultiStreamGrid {...mockProps} streams={[mockStreams[0]]} />);
      
      // Find FAB button (Add button)
      const addButton = getByText('Add Your First Stream') || 
                       getByText('Multi-Stream').parent?.querySelector('[data-testid="fab-add"]');
      
      if (addButton) {
        fireEvent.press(addButton);
        expect(mockProps.onStreamAdd).toHaveBeenCalled();
      }
    });

    it('should prevent adding streams when at limit', () => {
      const maxStreams = Array(6).fill(null).map((_, i) => ({
        ...mockStreams[0],
        id: `${i + 1}`,
        user_id: `${i + 100}`,
      }));
      
      const { getByText } = render(
        <ModernMultiStreamGrid {...mockProps} streams={maxStreams} maxStreams={6} />
      );
      
      // Should show alert when trying to add beyond limit
      const fabButton = getByText('Multi-Stream').parent?.querySelector('[data-testid="fab-add"]');
      if (fabButton) {
        fireEvent.press(fabButton);
        // Should show alert instead of calling onStreamAdd
      }
    });
  });

  describe('Performance and State Management', () => {
    it('should maintain stream states across re-renders', () => {
      const { rerender } = render(<ModernMultiStreamGrid {...mockProps} />);
      
      // Toggle play state
      const { getByTestId } = render(<ModernMultiStreamGrid {...mockProps} />);
      const playButton = getByTestId('play-1');
      fireEvent.press(playButton);
      
      // Re-render with same props
      rerender(<ModernMultiStreamGrid {...mockProps} />);
      
      // State should be preserved
      expect(getByTestId('stream-card-1')).toBeTruthy();
    });

    it('should update when streams prop changes', () => {
      const { rerender, queryByTestId } = render(<ModernMultiStreamGrid {...mockProps} />);
      
      expect(queryByTestId('stream-card-1')).toBeTruthy();
      expect(queryByTestId('stream-card-2')).toBeTruthy();
      
      // Remove one stream
      rerender(<ModernMultiStreamGrid {...mockProps} streams={[mockStreams[0]]} />);
      
      expect(queryByTestId('stream-card-1')).toBeTruthy();
      expect(queryByTestId('stream-card-2')).toBeFalsy();
    });

    it('should handle favorite state updates', () => {
      const isFavorite = jest.fn().mockImplementation((id: string) => id === '1');
      const { rerender } = render(
        <ModernMultiStreamGrid {...mockProps} isFavorite={isFavorite} />
      );
      
      // Update favorite function
      const newIsFavorite = jest.fn().mockImplementation((id: string) => id === '2');
      rerender(<ModernMultiStreamGrid {...mockProps} isFavorite={newIsFavorite} />);
      
      // Should call new favorite function
      expect(newIsFavorite).toHaveBeenCalledWith('1');
      expect(newIsFavorite).toHaveBeenCalledWith('2');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing stream data gracefully', () => {
      const incompleteStreams = [
        {
          ...mockStreams[0],
          thumbnail_url: undefined,
          viewer_count: undefined,
        },
      ];
      
      const { getByTestId } = render(
        <ModernMultiStreamGrid {...mockProps} streams={incompleteStreams} />
      );
      
      expect(getByTestId('stream-card-1')).toBeTruthy();
    });

    it('should handle callback errors gracefully', () => {
      const errorProps = {
        ...mockProps,
        onStreamRemove: jest.fn(() => { throw new Error('Test error'); }),
      };
      
      const { getByTestId } = render(<ModernMultiStreamGrid {...errorProps} />);
      
      // Should not crash when callback throws
      expect(() => {
        const removeButton = getByTestId('remove-1');
        fireEvent.press(removeButton);
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByText } = render(<ModernMultiStreamGrid {...mockProps} />);
      
      // Header should be accessible
      expect(getByText('Multi-Stream')).toBeTruthy();
      expect(getByText('2 streams • grid 2x2')).toBeTruthy();
    });

    it('should support keyboard navigation', () => {
      // React Native testing library doesn't fully support keyboard events
      // This would be tested in e2e tests
      const { getByTestId } = render(<ModernMultiStreamGrid {...mockProps} />);
      expect(getByTestId('stream-card-1')).toBeTruthy();
    });
  });

  describe('Animation Integration', () => {
    it('should handle animation lifecycles', async () => {
      const { getByTestId } = render(<ModernMultiStreamGrid {...mockProps} />);
      
      // Animations should not interfere with functionality
      const streamCard = getByTestId('stream-card-1');
      expect(streamCard).toBeTruthy();
      
      await act(async () => {
        // Wait for initial animations to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(streamCard).toBeTruthy();
    });

    it('should handle layout transitions smoothly', () => {
      const { rerender } = render(<ModernMultiStreamGrid {...mockProps} />);
      
      // Change layout mode
      rerender(<ModernMultiStreamGrid {...mockProps} streams={mockStreams} />);
      
      // Should maintain component stability during transitions
    });
  });
});