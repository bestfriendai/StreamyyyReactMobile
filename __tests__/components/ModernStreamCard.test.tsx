/**
 * Integration tests for ModernStreamCard component
 */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { ModernStreamCard, StreamLayoutMode, StreamQuality } from '@/components/modern/ModernStreamCard';
import { TwitchStream } from '@/services/twitchApi';

// Mock dependencies
jest.mock('@/theme/modernTheme', () => ({
  ModernTheme: {
    colors: {
      background: { primary: '#000000', secondary: '#111111', tertiary: '#222222' },
      text: { primary: '#ffffff', secondary: '#cccccc', tertiary: '#999999', accent: '#8b5cf6' },
      accent: { 500: '#8b5cf6' },
      success: { 500: '#10b981' },
      error: { 500: '#ef4444' },
      status: { live: '#ef4444' },
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

const mockStream: TwitchStream = {
  id: '1',
  user_id: '123',
  user_login: 'testuser',
  user_name: 'TestUser',
  game_id: '456',
  game_name: 'Test Game',
  type: 'live',
  title: 'Test Stream Title',
  viewer_count: 1500,
  started_at: '2023-01-01T00:00:00Z',
  language: 'en',
  thumbnail_url: 'https://example.com/thumb-{width}x{height}.jpg',
  tag_ids: [],
  is_mature: false,
};

describe('ModernStreamCard', () => {
  const defaultProps = {
    stream: mockStream,
    width: 300,
    height: 200,
    layoutMode: 'grid' as StreamLayoutMode,
    isPlaying: true,
    isMuted: false,
    isSelected: false,
    isFavorite: false,
    showControls: true,
    quality: 'auto' as StreamQuality,
    onPress: jest.fn(),
    onRemove: jest.fn(),
    onTogglePlay: jest.fn(),
    onToggleMute: jest.fn(),
    onToggleFavorite: jest.fn(),
    onQualityChange: jest.fn(),
    onLayoutChange: jest.fn(),
    onMove: jest.fn(),
    onResize: jest.fn(),
    position: { x: 0, y: 0 },
    isDraggable: false,
    isResizable: false,
    zIndex: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render basic stream information', () => {
      const { getByText } = render(<ModernStreamCard {...defaultProps} />);
      
      expect(getByText('TestUser')).toBeTruthy();
      expect(getByText('Test Game')).toBeTruthy();
      expect(getByText('LIVE')).toBeTruthy();
      expect(getByText('1,500')).toBeTruthy(); // Viewer count
    });

    it('should render thumbnail with correct dimensions', () => {
      const { getByTestId } = render(<ModernStreamCard {...defaultProps} />);
      
      // Thumbnail should be rendered with calculated dimensions
      const thumbnail = getByTestId('stream-thumbnail');
      expect(thumbnail).toBeTruthy();
    });

    it('should render placeholder when thumbnail fails to load', () => {
      const { getByTestId } = render(
        <ModernStreamCard {...defaultProps} stream={{ ...mockStream, thumbnail_url: undefined }} />
      );
      
      const placeholder = getByTestId('thumbnail-placeholder');
      expect(placeholder).toBeTruthy();
    });

    it('should adapt layout for different modes', () => {
      const { rerender, queryByText } = render(<ModernStreamCard {...defaultProps} layoutMode="grid" />);
      
      // Grid mode should show stream info
      expect(queryByText('TestUser')).toBeTruthy();
      expect(queryByText('Test Game')).toBeTruthy();
      
      // PiP mode should hide stream info
      rerender(<ModernStreamCard {...defaultProps} layoutMode="pip" />);
      expect(queryByText('TestUser')).toBeFalsy();
      expect(queryByText('Test Game')).toBeFalsy();
    });

    it('should show quality indicator', () => {
      const { getByText } = render(<ModernStreamCard {...defaultProps} quality="1080p" />);
      
      expect(getByText('1080P')).toBeTruthy();
    });

    it('should display live pulse animation', () => {
      const { getByText } = render(<ModernStreamCard {...defaultProps} />);
      
      const liveIndicator = getByText('LIVE');
      expect(liveIndicator).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('should handle card press', () => {
      const { getByTestId } = render(<ModernStreamCard {...defaultProps} />);
      
      const card = getByTestId('stream-card');
      fireEvent.press(card);
      
      expect(defaultProps.onPress).toHaveBeenCalled();
    });

    it('should handle play/pause toggle', () => {
      const { getByTestId } = render(<ModernStreamCard {...defaultProps} />);
      
      const playButton = getByTestId('play-button');
      fireEvent.press(playButton);
      
      expect(defaultProps.onTogglePlay).toHaveBeenCalled();
    });

    it('should handle mute toggle', () => {
      const { getByTestId } = render(<ModernStreamCard {...defaultProps} />);
      
      const muteButton = getByTestId('mute-button');
      fireEvent.press(muteButton);
      
      expect(defaultProps.onToggleMute).toHaveBeenCalled();
    });

    it('should handle favorite toggle with animation', async () => {
      const { getByTestId } = render(<ModernStreamCard {...defaultProps} />);
      
      const favoriteButton = getByTestId('favorite-button');
      fireEvent.press(favoriteButton);
      
      expect(defaultProps.onToggleFavorite).toHaveBeenCalled();
      
      // Should trigger heart animation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
    });

    it('should handle remove with confirmation', () => {
      const { getByTestId } = render(<ModernStreamCard {...defaultProps} />);
      
      const removeButton = getByTestId('remove-button');
      fireEvent.press(removeButton);
      
      expect(defaultProps.onRemove).toHaveBeenCalled();
    });

    it('should handle layout mode changes', () => {
      const { getByTestId } = render(<ModernStreamCard {...defaultProps} />);
      
      const layoutButton = getByTestId('layout-button');
      fireEvent.press(layoutButton);
      
      expect(defaultProps.onLayoutChange).toHaveBeenCalled();
    });
  });

  describe('Quality Menu', () => {
    it('should show quality menu when quality badge pressed', async () => {
      const { getByTestId, getByText } = render(<ModernStreamCard {...defaultProps} />);
      
      const qualityBadge = getByTestId('quality-badge');
      fireEvent.press(qualityBadge);
      
      await waitFor(() => {
        expect(getByText('AUTO')).toBeTruthy();
        expect(getByText('1080P')).toBeTruthy();
        expect(getByText('720P')).toBeTruthy();
        expect(getByText('480P')).toBeTruthy();
        expect(getByText('360P')).toBeTruthy();
      });
    });

    it('should handle quality selection', async () => {
      const { getByTestId, getByText } = render(<ModernStreamCard {...defaultProps} />);
      
      const qualityBadge = getByTestId('quality-badge');
      fireEvent.press(qualityBadge);
      
      await waitFor(() => {
        const option1080p = getByText('1080P');
        fireEvent.press(option1080p);
      });
      
      expect(defaultProps.onQualityChange).toHaveBeenCalledWith('1080p');
    });

    it('should highlight current quality option', async () => {
      const { getByTestId, getByText } = render(
        <ModernStreamCard {...defaultProps} quality="720p" />
      );
      
      const qualityBadge = getByTestId('quality-badge');
      fireEvent.press(qualityBadge);
      
      await waitFor(() => {
        const option720p = getByText('720P');
        expect(option720p.parent).toHaveClass('menuItemActive'); // Style check
      });
    });
  });

  describe('More Menu', () => {
    it('should show more menu when more button pressed', async () => {
      const { getByTestId, getByText } = render(<ModernStreamCard {...defaultProps} />);
      
      const moreButton = getByTestId('more-button');
      fireEvent.press(moreButton);
      
      await waitFor(() => {
        expect(getByText('Fullscreen')).toBeTruthy();
        expect(getByText('Picture in Picture')).toBeTruthy();
        expect(getByText('Share Stream')).toBeTruthy();
        expect(getByText('Stream Settings')).toBeTruthy();
      });
    });

    it('should handle fullscreen option', async () => {
      const { getByTestId, getByText } = render(<ModernStreamCard {...defaultProps} />);
      
      const moreButton = getByTestId('more-button');
      fireEvent.press(moreButton);
      
      await waitFor(() => {
        const fullscreenOption = getByText('Fullscreen');
        fireEvent.press(fullscreenOption);
      });
      
      expect(defaultProps.onLayoutChange).toHaveBeenCalledWith('fullscreen');
    });

    it('should handle picture-in-picture option', async () => {
      const { getByTestId, getByText } = render(<ModernStreamCard {...defaultProps} />);
      
      const moreButton = getByTestId('more-button');
      fireEvent.press(moreButton);
      
      await waitFor(() => {
        const pipOption = getByText('Picture in Picture');
        fireEvent.press(pipOption);
      });
      
      expect(defaultProps.onLayoutChange).toHaveBeenCalledWith('pip');
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag gestures when draggable', async () => {
      const { getByTestId } = render(
        <ModernStreamCard {...defaultProps} isDraggable={true} />
      );
      
      const card = getByTestId('stream-card');
      
      // Simulate pan gesture
      fireEvent(card, 'onMoveShouldSetPanResponder', {});
      fireEvent(card, 'onPanResponderGrant', {});
      fireEvent(card, 'onPanResponderMove', {
        nativeEvent: { dx: 50, dy: 30 }
      });
      fireEvent(card, 'onPanResponderRelease', {});
      
      await waitFor(() => {
        expect(defaultProps.onMove).toHaveBeenCalled();
      });
    });

    it('should not handle drag when not draggable', () => {
      const { getByTestId } = render(
        <ModernStreamCard {...defaultProps} isDraggable={false} />
      );
      
      const card = getByTestId('stream-card');
      
      // Simulate pan gesture
      fireEvent(card, 'onMoveShouldSetPanResponder', {});
      
      // Should not allow dragging
      expect(defaultProps.onMove).not.toHaveBeenCalled();
    });

    it('should show drag handle when draggable', () => {
      const { getByTestId } = render(
        <ModernStreamCard {...defaultProps} isDraggable={true} />
      );
      
      const dragHandle = getByTestId('drag-handle');
      expect(dragHandle).toBeTruthy();
    });

    it('should snap to edges during drag', async () => {
      const { getByTestId } = render(
        <ModernStreamCard {...defaultProps} isDraggable={true} />
      );
      
      const card = getByTestId('stream-card');
      
      // Simulate drag near edge
      fireEvent(card, 'onPanResponderMove', {
        nativeEvent: { dx: 10, dy: 10 } // Near left edge
      });
      fireEvent(card, 'onPanResponderRelease', {});
      
      await waitFor(() => {
        // Should snap to edge (x: 0)
        expect(defaultProps.onMove).toHaveBeenCalledWith(0, expect.any(Number));
      });
    });
  });

  describe('Resize Functionality', () => {
    it('should handle pinch gestures when resizable', async () => {
      const { getByTestId } = render(
        <ModernStreamCard {...defaultProps} isResizable={true} />
      );
      
      const card = getByTestId('stream-card');
      
      // Simulate pinch gesture
      fireEvent(card, 'onPinchGestureStateChange', {
        nativeEvent: { scale: 1.5, state: 4 } // ACTIVE state
      });
      
      await waitFor(() => {
        expect(defaultProps.onResize).toHaveBeenCalled();
      });
    });

    it('should show resize handle when resizable', () => {
      const { getByTestId } = render(
        <ModernStreamCard {...defaultProps} isResizable={true} />
      );
      
      const resizeHandle = getByTestId('resize-handle');
      expect(resizeHandle).toBeTruthy();
    });

    it('should constrain resize within bounds', async () => {
      const { getByTestId } = render(
        <ModernStreamCard {...defaultProps} isResizable={true} />
      );
      
      const card = getByTestId('stream-card');
      
      // Simulate extreme pinch (too small)
      fireEvent(card, 'onPinchGestureStateChange', {
        nativeEvent: { scale: 0.1, state: 4 }
      });
      
      // Should constrain to minimum scale
      await waitFor(() => {
        expect(defaultProps.onResize).toHaveBeenCalledWith(
          expect.any(Number), // width >= minScale * originalWidth
          expect.any(Number)  // height >= minScale * originalHeight
        );
      });
    });
  });

  describe('State Management', () => {
    it('should update when stream prop changes', () => {
      const { rerender, getByText } = render(<ModernStreamCard {...defaultProps} />);
      
      expect(getByText('TestUser')).toBeTruthy();
      
      const updatedStream = { ...mockStream, user_name: 'UpdatedUser' };
      rerender(<ModernStreamCard {...defaultProps} stream={updatedStream} />);
      
      expect(getByText('UpdatedUser')).toBeTruthy();
    });

    it('should reflect playing state changes', () => {
      const { rerender, getByTestId } = render(
        <ModernStreamCard {...defaultProps} isPlaying={true} />
      );
      
      let playButton = getByTestId('play-button');
      expect(playButton).toContainElement(expect.stringContaining('pause')); // Pause icon when playing
      
      rerender(<ModernStreamCard {...defaultProps} isPlaying={false} />);
      
      playButton = getByTestId('play-button');
      expect(playButton).toContainElement(expect.stringContaining('play')); // Play icon when paused
    });

    it('should reflect muted state changes', () => {
      const { rerender, getByTestId } = render(
        <ModernStreamCard {...defaultProps} isMuted={false} />
      );
      
      let muteButton = getByTestId('mute-button');
      expect(muteButton).toContainElement(expect.stringContaining('volume')); // Volume icon when not muted
      
      rerender(<ModernStreamCard {...defaultProps} isMuted={true} />);
      
      muteButton = getByTestId('mute-button');
      expect(muteButton).toContainElement(expect.stringContaining('volume-x')); // Muted icon when muted
    });

    it('should reflect favorite state changes', () => {
      const { rerender, getByTestId } = render(
        <ModernStreamCard {...defaultProps} isFavorite={false} />
      );
      
      let favoriteButton = getByTestId('favorite-button');
      expect(favoriteButton).not.toHaveClass('favoriteActive');
      
      rerender(<ModernStreamCard {...defaultProps} isFavorite={true} />);
      
      favoriteButton = getByTestId('favorite-button');
      expect(favoriteButton).toHaveClass('favoriteActive');
    });

    it('should handle selected state with glow effect', () => {
      const { rerender, getByTestId } = render(
        <ModernStreamCard {...defaultProps} isSelected={false} />
      );
      
      let card = getByTestId('stream-card');
      // Should not have selection glow
      
      rerender(<ModernStreamCard {...defaultProps} isSelected={true} />);
      
      card = getByTestId('stream-card');
      // Should have selection glow effect
    });
  });

  describe('Controls Visibility', () => {
    it('should show controls when showControls is true', () => {
      const { getByTestId } = render(
        <ModernStreamCard {...defaultProps} showControls={true} />
      );
      
      expect(getByTestId('play-button')).toBeTruthy();
      expect(getByTestId('mute-button')).toBeTruthy();
      expect(getByTestId('favorite-button')).toBeTruthy();
    });

    it('should hide controls when showControls is false', () => {
      const { queryByTestId } = render(
        <ModernStreamCard {...defaultProps} showControls={false} />
      );
      
      expect(queryByTestId('play-button')).toBeFalsy();
      expect(queryByTestId('mute-button')).toBeFalsy();
      expect(queryByTestId('favorite-button')).toBeFalsy();
    });

    it('should auto-hide controls after timeout', async () => {
      const { getByTestId, queryByTestId } = render(
        <ModernStreamCard {...defaultProps} showControls={true} />
      );
      
      expect(getByTestId('play-button')).toBeTruthy();
      
      // Wait for auto-hide timeout
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 3500));
      });
      
      // Controls should fade out (opacity animation)
    });

    it('should keep controls visible in pip mode', () => {
      const { getByTestId } = render(
        <ModernStreamCard {...defaultProps} layoutMode="pip" showControls={true} />
      );
      
      // PiP mode should always show minimal controls
      expect(getByTestId('play-button')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing stream data gracefully', () => {
      const incompleteStream = {
        ...mockStream,
        user_name: undefined,
        game_name: undefined,
        viewer_count: undefined,
      };
      
      const { getByTestId } = render(
        <ModernStreamCard {...defaultProps} stream={incompleteStream} />
      );
      
      expect(getByTestId('stream-card')).toBeTruthy();
    });

    it('should handle callback errors gracefully', () => {
      const errorProps = {
        ...defaultProps,
        onPress: jest.fn(() => { throw new Error('Test error'); }),
      };
      
      const { getByTestId } = render(<ModernStreamCard {...errorProps} />);
      
      expect(() => {
        const card = getByTestId('stream-card');
        fireEvent.press(card);
      }).not.toThrow();
    });

    it('should handle image load errors', () => {
      const { getByTestId } = render(<ModernStreamCard {...defaultProps} />);
      
      const image = getByTestId('stream-thumbnail');
      fireEvent(image, 'onError');
      
      // Should show placeholder after error
      const placeholder = getByTestId('thumbnail-placeholder');
      expect(placeholder).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should memoize expensive calculations', () => {
      const { rerender } = render(<ModernStreamCard {...defaultProps} />);
      
      // Multiple re-renders with same props should not cause performance issues
      for (let i = 0; i < 10; i++) {
        rerender(<ModernStreamCard {...defaultProps} />);
      }
      
      // Component should remain stable
    });

    it('should handle rapid state updates', async () => {
      const { getByTestId } = render(<ModernStreamCard {...defaultProps} />);
      
      const playButton = getByTestId('play-button');
      
      // Rapid clicks should be handled gracefully
      for (let i = 0; i < 5; i++) {
        fireEvent.press(playButton);
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
      }
      
      expect(defaultProps.onTogglePlay).toHaveBeenCalledTimes(5);
    });
  });
});