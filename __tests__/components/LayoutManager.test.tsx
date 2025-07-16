/**
 * Integration tests for LayoutManager component
 */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { LayoutManager, LayoutUtils, LayoutMode, StreamPosition } from '@/components/modern/LayoutManager';

// Mock theme
jest.mock('@/theme/modernTheme', () => ({
  ModernTheme: {
    colors: {
      background: { primary: '#000000' },
      border: { primary: '#333333' },
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  // Add missing mock functions
  Reanimated.useSharedValue = jest.fn((initial) => ({ value: initial }));
  Reanimated.useAnimatedStyle = jest.fn((fn) => fn());
  Reanimated.withSpring = jest.fn((value) => value);
  Reanimated.withTiming = jest.fn((value) => value);
  Reanimated.interpolate = jest.fn((value, input, output) => output[1]);
  Reanimated.Extrapolate = { CLAMP: 'clamp' };
  Reanimated.runOnJS = jest.fn((fn) => fn);
  
  return Reanimated;
});

// Mock Dimensions
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 667 })),
    },
    StatusBar: {
      currentHeight: 24,
    },
  };
});

describe('LayoutManager', () => {
  const mockChildren = [
    <View key="1" testID="stream-0"><Text>Stream 1</Text></View>,
    <View key="2" testID="stream-1"><Text>Stream 2</Text></View>,
    <View key="3" testID="stream-2"><Text>Stream 3</Text></View>,
    <View key="4" testID="stream-3"><Text>Stream 4</Text></View>,
  ];

  const defaultProps = {
    children: mockChildren.slice(0, 2), // Start with 2 streams
    layoutMode: 'grid-2x2' as LayoutMode,
    onLayoutChange: jest.fn(),
    onPositionChange: jest.fn(),
    enableGestures: true,
    snapToGrid: false,
    gridSize: 20,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Layout Calculations', () => {
    it('should calculate grid-2x2 layout correctly', () => {
      const { getByTestId } = render(<LayoutManager {...defaultProps} />);
      
      expect(getByTestId('stream-0')).toBeTruthy();
      expect(getByTestId('stream-1')).toBeTruthy();
      expect(defaultProps.onPositionChange).toHaveBeenCalled();
      
      const positions = defaultProps.onPositionChange.mock.calls[0][0] as StreamPosition[];
      expect(positions).toHaveLength(2);
      
      // First stream should be at top-left
      expect(positions[0].x).toBeGreaterThanOrEqual(0);
      expect(positions[0].y).toBeGreaterThanOrEqual(0);
      
      // Second stream should be positioned relative to first
      expect(positions[1].x).toBeGreaterThan(positions[0].x);
      expect(positions[1].y).toBeGreaterThanOrEqual(positions[0].y);
    });

    it('should calculate grid-3x1 layout correctly', () => {
      const { rerender } = render(<LayoutManager {...defaultProps} />);
      
      rerender(
        <LayoutManager 
          {...defaultProps} 
          layoutMode="grid-3x1" 
          children={mockChildren.slice(0, 3)}
        />
      );
      
      const positions = defaultProps.onPositionChange.mock.calls[1][0] as StreamPosition[];
      expect(positions).toHaveLength(3);
      
      // All streams should be in horizontal line
      expect(positions[0].y).toBe(positions[1].y);
      expect(positions[1].y).toBe(positions[2].y);
      
      // X positions should increase
      expect(positions[1].x).toBeGreaterThan(positions[0].x);
      expect(positions[2].x).toBeGreaterThan(positions[1].x);
    });

    it('should calculate grid-4x1 layout correctly', () => {
      const { rerender } = render(<LayoutManager {...defaultProps} />);
      
      rerender(
        <LayoutManager 
          {...defaultProps} 
          layoutMode="grid-4x1" 
          children={mockChildren}
        />
      );
      
      const positions = defaultProps.onPositionChange.mock.calls[1][0] as StreamPosition[];
      expect(positions).toHaveLength(4);
      
      // All streams should be in horizontal line
      positions.forEach((pos, index) => {
        if (index > 0) {
          expect(pos.y).toBe(positions[0].y);
          expect(pos.x).toBeGreaterThan(positions[index - 1].x);
        }
      });
    });

    it('should calculate grid-1x4 layout correctly', () => {
      const { rerender } = render(<LayoutManager {...defaultProps} />);
      
      rerender(
        <LayoutManager 
          {...defaultProps} 
          layoutMode="grid-1x4" 
          children={mockChildren}
        />
      );
      
      const positions = defaultProps.onPositionChange.mock.calls[1][0] as StreamPosition[];
      expect(positions).toHaveLength(4);
      
      // All streams should be in vertical line
      positions.forEach((pos, index) => {
        if (index > 0) {
          expect(pos.x).toBe(positions[0].x);
          expect(pos.y).toBeGreaterThan(positions[index - 1].y);
        }
      });
    });

    it('should calculate PiP layout correctly', () => {
      const { rerender } = render(<LayoutManager {...defaultProps} />);
      
      rerender(
        <LayoutManager 
          {...defaultProps} 
          layoutMode="pip" 
          children={mockChildren}
        />
      );
      
      const positions = defaultProps.onPositionChange.mock.calls[1][0] as StreamPosition[];
      expect(positions).toHaveLength(4);
      
      // First stream should be full screen
      expect(positions[0].width).toBeGreaterThan(positions[1].width);
      expect(positions[0].height).toBeGreaterThan(positions[1].height);
      expect(positions[0].zIndex).toBe(1);
      
      // Other streams should be smaller with higher z-index
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i].zIndex).toBeGreaterThan(positions[0].zIndex);
        expect(positions[i].width).toBeLessThan(positions[0].width);
        expect(positions[i].height).toBeLessThan(positions[0].height);
      }
    });

    it('should calculate fullscreen layout correctly', () => {
      const { rerender } = render(<LayoutManager {...defaultProps} />);
      
      rerender(
        <LayoutManager 
          {...defaultProps} 
          layoutMode="fullscreen" 
          children={mockChildren}
        />
      );
      
      const positions = defaultProps.onPositionChange.mock.calls[1][0] as StreamPosition[];
      expect(positions).toHaveLength(4);
      
      // First stream should be fullscreen
      expect(positions[0].isVisible).toBe(true);
      expect(positions[0].width).toBeGreaterThan(0);
      expect(positions[0].height).toBeGreaterThan(0);
      
      // Other streams should be hidden
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i].isVisible).toBe(false);
        expect(positions[i].x).toBe(-1000);
        expect(positions[i].y).toBe(-1000);
      }
    });

    it('should use custom positions when provided', () => {
      const customPositions: StreamPosition[] = [
        { id: 'stream-0', x: 10, y: 20, width: 100, height: 80, zIndex: 1, isVisible: true },
        { id: 'stream-1', x: 120, y: 110, width: 100, height: 80, zIndex: 1, isVisible: true },
      ];
      
      render(
        <LayoutManager 
          {...defaultProps} 
          layoutMode="custom" 
          customPositions={customPositions}
        />
      );
      
      const positions = defaultProps.onPositionChange.mock.calls[0][0] as StreamPosition[];
      expect(positions[0].x).toBe(10);
      expect(positions[0].y).toBe(20);
      expect(positions[1].x).toBe(120);
      expect(positions[1].y).toBe(110);
    });
  });

  describe('Layout Mode Changes', () => {
    it('should update positions when layout mode changes', async () => {
      const { rerender } = render(<LayoutManager {...defaultProps} layoutMode="grid-2x2" />);
      
      rerender(<LayoutManager {...defaultProps} layoutMode="grid-3x1" />);
      
      await waitFor(() => {
        expect(defaultProps.onPositionChange).toHaveBeenCalledTimes(2);
      });
      
      const firstCall = defaultProps.onPositionChange.mock.calls[0][0] as StreamPosition[];
      const secondCall = defaultProps.onPositionChange.mock.calls[1][0] as StreamPosition[];
      
      // Positions should be different after layout change
      expect(firstCall[0].x).not.toBe(secondCall[0].x);
    });

    it('should handle empty children gracefully', () => {
      render(<LayoutManager {...defaultProps} children={[]} />);
      
      const positions = defaultProps.onPositionChange.mock.calls[0][0] as StreamPosition[];
      expect(positions).toHaveLength(0);
    });

    it('should handle single child', () => {
      render(<LayoutManager {...defaultProps} children={[mockChildren[0]]} />);
      
      const positions = defaultProps.onPositionChange.mock.calls[0][0] as StreamPosition[];
      expect(positions).toHaveLength(1);
      expect(positions[0].isVisible).toBe(true);
    });

    it('should limit streams to layout capacity', () => {
      // Grid-2x2 should only show 4 streams max
      render(
        <LayoutManager 
          {...defaultProps} 
          layoutMode="grid-2x2" 
          children={[...mockChildren, ...mockChildren]} // 8 children
        />
      );
      
      const positions = defaultProps.onPositionChange.mock.calls[0][0] as StreamPosition[];
      expect(positions).toHaveLength(4); // Should be limited to 4 for 2x2 grid
    });
  });

  describe('Container Layout', () => {
    it('should handle container layout changes', () => {
      const { getByTestId } = render(<LayoutManager {...defaultProps} />);
      
      const container = getByTestId('layout-container');
      fireEvent(container, 'onLayout', {
        nativeEvent: {
          layout: { width: 400, height: 600 }
        }
      });
      
      // Should recalculate positions with new dimensions
      expect(defaultProps.onPositionChange).toHaveBeenCalledTimes(2);
    });

    it('should apply custom container styles', () => {
      const customStyle = { backgroundColor: 'red' };
      const { getByTestId } = render(
        <LayoutManager {...defaultProps} containerStyle={customStyle} />
      );
      
      const container = getByTestId('layout-container');
      expect(container.props.style).toContainEqual(customStyle);
    });
  });

  describe('Grid Snapping', () => {
    it('should show grid overlay when snap to grid is enabled', () => {
      const { getByTestId } = render(
        <LayoutManager 
          {...defaultProps} 
          layoutMode="custom" 
          snapToGrid={true} 
        />
      );
      
      const gridOverlay = getByTestId('grid-overlay');
      expect(gridOverlay).toBeTruthy();
    });

    it('should hide grid overlay when snap to grid is disabled', () => {
      const { queryByTestId } = render(
        <LayoutManager 
          {...defaultProps} 
          layoutMode="custom" 
          snapToGrid={false} 
        />
      );
      
      const gridOverlay = queryByTestId('grid-overlay');
      expect(gridOverlay).toBeFalsy();
    });

    it('should only show grid overlay in custom mode', () => {
      const { queryByTestId } = render(
        <LayoutManager 
          {...defaultProps} 
          layoutMode="grid-2x2" 
          snapToGrid={true} 
        />
      );
      
      const gridOverlay = queryByTestId('grid-overlay');
      expect(gridOverlay).toBeFalsy();
    });

    it('should snap positions to grid when enabled', () => {
      const layoutManager = new LayoutManager({
        ...defaultProps,
        snapToGrid: true,
        gridSize: 20,
      });
      
      // Test snap function
      const snapToGrid = layoutManager.snapToGridPosition;
      expect(snapToGrid(23)).toBe(20);
      expect(snapToGrid(37)).toBe(40);
      expect(snapToGrid(10)).toBe(20);
    });
  });

  describe('Position and Size Updates', () => {
    it('should handle stream position updates', async () => {
      const { getByTestId } = render(
        <LayoutManager {...defaultProps} layoutMode="custom" enableGestures={true} />
      );
      
      const stream = getByTestId('stream-0');
      
      // Simulate move event
      fireEvent(stream, 'onMove', 50, 100);
      
      await waitFor(() => {
        expect(defaultProps.onPositionChange).toHaveBeenCalled();
      });
      
      const positions = defaultProps.onPositionChange.mock.calls[1][0] as StreamPosition[];
      expect(positions[0].x).toBe(50);
      expect(positions[0].y).toBe(100);
    });

    it('should handle stream size updates', async () => {
      const { getByTestId } = render(
        <LayoutManager {...defaultProps} layoutMode="custom" enableGestures={true} />
      );
      
      const stream = getByTestId('stream-0');
      
      // Simulate resize event
      fireEvent(stream, 'onResize', 200, 150);
      
      await waitFor(() => {
        expect(defaultProps.onPositionChange).toHaveBeenCalled();
      });
      
      const positions = defaultProps.onPositionChange.mock.calls[1][0] as StreamPosition[];
      expect(positions[0].width).toBe(200);
      expect(positions[0].height).toBe(150);
    });

    it('should disable gestures when enableGestures is false', () => {
      const { getByTestId } = render(
        <LayoutManager {...defaultProps} enableGestures={false} />
      );
      
      const stream = getByTestId('stream-0');
      expect(stream.props.isDraggable).toBe(false);
      expect(stream.props.isResizable).toBe(false);
    });

    it('should enable gestures only in custom mode', () => {
      const { getByTestId, rerender } = render(
        <LayoutManager {...defaultProps} layoutMode="grid-2x2" enableGestures={true} />
      );
      
      let stream = getByTestId('stream-0');
      expect(stream.props.isDraggable).toBe(false);
      expect(stream.props.isResizable).toBe(false);
      
      rerender(
        <LayoutManager {...defaultProps} layoutMode="custom" enableGestures={true} />
      );
      
      stream = getByTestId('stream-0');
      expect(stream.props.isDraggable).toBe(true);
      expect(stream.props.isResizable).toBe(true);
    });
  });

  describe('Animation and Transitions', () => {
    it('should animate layout transitions', async () => {
      const { rerender } = render(<LayoutManager {...defaultProps} layoutMode="grid-2x2" />);
      
      rerender(<LayoutManager {...defaultProps} layoutMode="grid-3x1" />);
      
      // Animation values should be called
      const { useSharedValue, withSpring } = require('react-native-reanimated');
      expect(useSharedValue).toHaveBeenCalled();
      expect(withSpring).toHaveBeenCalled();
    });

    it('should apply animated styles to streams', () => {
      render(<LayoutManager {...defaultProps} />);
      
      const { useAnimatedStyle } = require('react-native-reanimated');
      expect(useAnimatedStyle).toHaveBeenCalled();
    });

    it('should handle animation completion', async () => {
      const { rerender } = render(<LayoutManager {...defaultProps} />);
      
      rerender(<LayoutManager {...defaultProps} layoutMode="fullscreen" />);
      
      await act(async () => {
        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(defaultProps.onPositionChange).toHaveBeenCalled();
    });
  });

  describe('Stream Layout Modes', () => {
    it('should set correct layout mode for streams in fullscreen', () => {
      const { getByTestId } = render(
        <LayoutManager {...defaultProps} layoutMode="fullscreen" />
      );
      
      const firstStream = getByTestId('stream-0');
      const secondStream = getByTestId('stream-1');
      
      expect(firstStream.props.layoutMode).toBe('fullscreen');
      expect(secondStream.props.layoutMode).toBe('grid');
    });

    it('should set correct layout mode for streams in PiP', () => {
      const { getByTestId } = render(
        <LayoutManager {...defaultProps} layoutMode="pip" />
      );
      
      const firstStream = getByTestId('stream-0');
      const secondStream = getByTestId('stream-1');
      
      expect(firstStream.props.layoutMode).toBe('grid');
      expect(secondStream.props.layoutMode).toBe('pip');
    });

    it('should set grid layout mode for all streams in grid layouts', () => {
      const { getByTestId } = render(
        <LayoutManager {...defaultProps} layoutMode="grid-2x2" />
      );
      
      const firstStream = getByTestId('stream-0');
      const secondStream = getByTestId('stream-1');
      
      expect(firstStream.props.layoutMode).toBe('grid');
      expect(secondStream.props.layoutMode).toBe('grid');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid layout mode gracefully', () => {
      const { getByTestId } = render(
        <LayoutManager {...defaultProps} layoutMode={'invalid' as LayoutMode} />
      );
      
      // Should fall back to default grid layout
      expect(getByTestId('stream-0')).toBeTruthy();
      expect(defaultProps.onPositionChange).toHaveBeenCalled();
    });

    it('should handle missing children gracefully', () => {
      const { container } = render(
        <LayoutManager {...defaultProps} children={[null, undefined]} />
      );
      
      // Should not crash
      expect(container).toBeTruthy();
    });

    it('should handle position update errors gracefully', () => {
      const errorOnPositionChange = jest.fn(() => {
        throw new Error('Position update error');
      });
      
      expect(() => {
        render(
          <LayoutManager 
            {...defaultProps} 
            onPositionChange={errorOnPositionChange}
          />
        );
      }).not.toThrow();
    });
  });
});

describe('LayoutUtils', () => {
  describe('calculateOptimalLayout', () => {
    it('should return fullscreen for single stream', () => {
      const layout = LayoutUtils.calculateOptimalLayout(1, 375, 667);
      expect(layout).toBe('fullscreen');
    });

    it('should return appropriate layout for 2 streams based on aspect ratio', () => {
      // Wide screen - should prefer horizontal layout
      const wideLayout = LayoutUtils.calculateOptimalLayout(2, 800, 400);
      expect(wideLayout).toBe('grid-3x1');
      
      // Tall screen - should prefer grid layout
      const tallLayout = LayoutUtils.calculateOptimalLayout(2, 400, 800);
      expect(tallLayout).toBe('grid-2x2');
    });

    it('should return appropriate layout for 3 streams', () => {
      const layout = LayoutUtils.calculateOptimalLayout(3, 800, 400);
      expect(layout).toBe('grid-3x1');
    });

    it('should return grid-4x1 for 4 streams on wide screens', () => {
      const layout = LayoutUtils.calculateOptimalLayout(4, 1200, 600);
      expect(layout).toBe('grid-4x1');
    });

    it('should return pip for more than 4 streams', () => {
      const layout = LayoutUtils.calculateOptimalLayout(6, 375, 667);
      expect(layout).toBe('pip');
    });
  });

  describe('getLayoutName', () => {
    it('should return correct display names', () => {
      expect(LayoutUtils.getLayoutName('grid-2x2')).toBe('2×2 Grid');
      expect(LayoutUtils.getLayoutName('grid-3x1')).toBe('3×1 Grid');
      expect(LayoutUtils.getLayoutName('grid-4x1')).toBe('4×1 Grid');
      expect(LayoutUtils.getLayoutName('grid-1x4')).toBe('1×4 Grid');
      expect(LayoutUtils.getLayoutName('pip')).toBe('Picture in Picture');
      expect(LayoutUtils.getLayoutName('fullscreen')).toBe('Fullscreen');
      expect(LayoutUtils.getLayoutName('custom')).toBe('Custom Layout');
    });

    it('should return default name for unknown layout', () => {
      expect(LayoutUtils.getLayoutName('unknown' as LayoutMode)).toBe('Grid Layout');
    });
  });

  describe('getLayoutIcon', () => {
    it('should return correct icon names', () => {
      expect(LayoutUtils.getLayoutIcon('grid-2x2')).toBe('grid-3x3');
      expect(LayoutUtils.getLayoutIcon('grid-3x1')).toBe('columns');
      expect(LayoutUtils.getLayoutIcon('grid-4x1')).toBe('columns');
      expect(LayoutUtils.getLayoutIcon('grid-1x4')).toBe('rows');
      expect(LayoutUtils.getLayoutIcon('pip')).toBe('picture-in-picture-2');
      expect(LayoutUtils.getLayoutIcon('fullscreen')).toBe('maximize-2');
      expect(LayoutUtils.getLayoutIcon('custom')).toBe('move');
    });
  });

  describe('getAvailableLayouts', () => {
    it('should return correct layouts for different stream counts', () => {
      const oneStream = LayoutUtils.getAvailableLayouts(1);
      expect(oneStream).toContain('fullscreen');
      expect(oneStream).toContain('custom');
      expect(oneStream).not.toContain('grid-2x2');
      
      const twoStreams = LayoutUtils.getAvailableLayouts(2);
      expect(twoStreams).toContain('fullscreen');
      expect(twoStreams).toContain('grid-2x2');
      expect(twoStreams).toContain('pip');
      expect(twoStreams).not.toContain('grid-3x1');
      
      const threeStreams = LayoutUtils.getAvailableLayouts(3);
      expect(threeStreams).toContain('grid-3x1');
      expect(threeStreams).toContain('grid-1x4');
      
      const fourStreams = LayoutUtils.getAvailableLayouts(4);
      expect(fourStreams).toContain('grid-4x1');
    });

    it('should always include custom layout', () => {
      for (let i = 0; i <= 6; i++) {
        const layouts = LayoutUtils.getAvailableLayouts(i);
        expect(layouts).toContain('custom');
      }
    });
  });
});