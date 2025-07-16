import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ViewStyle,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ModernTheme } from '@/theme/modernTheme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type LayoutMode = 'grid-2x2' | 'grid-3x1' | 'grid-4x1' | 'grid-1x4' | 'pip' | 'fullscreen' | 'custom';

export interface StreamPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isVisible: boolean;
}

export interface LayoutConfig {
  mode: LayoutMode;
  positions: StreamPosition[];
  containerPadding: number;
  streamSpacing: number;
  animationDuration: number;
}

interface LayoutManagerProps {
  children: React.ReactNode[];
  layoutMode: LayoutMode;
  onLayoutChange?: (mode: LayoutMode) => void;
  onPositionChange?: (positions: StreamPosition[]) => void;
  customPositions?: StreamPosition[];
  containerStyle?: ViewStyle;
  enableGestures?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
}

export const LayoutManager: React.FC<LayoutManagerProps> = ({
  children,
  layoutMode,
  onLayoutChange,
  onPositionChange,
  customPositions,
  containerStyle,
  enableGestures = true,
  snapToGrid = false,
  gridSize = 20,
}) => {
  const [containerDimensions, setContainerDimensions] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });
  
  // Animation values
  const layoutTransition = useSharedValue(0);
  
  // Calculate layout positions based on mode
  const calculateLayout = (mode: LayoutMode, containerWidth: number, containerHeight: number): StreamPosition[] => {
    const padding = ModernTheme.spacing.md;
    const spacing = ModernTheme.spacing.sm;
    const safeAreaTop = StatusBar.currentHeight || 0;
    const availableWidth = containerWidth - (padding * 2);
    const availableHeight = containerHeight - (padding * 2) - safeAreaTop;
    
    const streamCount = children.length;
    if (streamCount === 0) return [];
    
    switch (mode) {
      case 'grid-2x2':
        return calculateGrid2x2(streamCount, availableWidth, availableHeight, padding, spacing);
      
      case 'grid-3x1':
        return calculateGrid3x1(streamCount, availableWidth, availableHeight, padding, spacing);
      
      case 'grid-4x1':
        return calculateGrid4x1(streamCount, availableWidth, availableHeight, padding, spacing);
      
      case 'grid-1x4':
        return calculateGrid1x4(streamCount, availableWidth, availableHeight, padding, spacing);
      
      case 'pip':
        return calculatePiPLayout(streamCount, availableWidth, availableHeight, padding, spacing);
      
      case 'fullscreen':
        return calculateFullscreenLayout(streamCount, availableWidth, availableHeight, padding);
      
      case 'custom':
        return customPositions || calculateGrid2x2(streamCount, availableWidth, availableHeight, padding, spacing);
      
      default:
        return calculateGrid2x2(streamCount, availableWidth, availableHeight, padding, spacing);
    }
  };
  
  // 2x2 Grid Layout
  const calculateGrid2x2 = (
    count: number, 
    width: number, 
    height: number, 
    padding: number, 
    spacing: number
  ): StreamPosition[] => {
    const positions: StreamPosition[] = [];
    const itemWidth = (width - spacing) / 2;
    const itemHeight = (height - spacing) / 2;
    
    for (let i = 0; i < Math.min(count, 4); i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      
      positions.push({
        id: `stream-${i}`,
        x: padding + (col * (itemWidth + spacing)),
        y: padding + (row * (itemHeight + spacing)),
        width: itemWidth,
        height: itemHeight,
        zIndex: 1,
        isVisible: true,
      });
    }
    
    return positions;
  };
  
  // 3x1 Grid Layout (3 horizontal)
  const calculateGrid3x1 = (
    count: number, 
    width: number, 
    height: number, 
    padding: number, 
    spacing: number
  ): StreamPosition[] => {
    const positions: StreamPosition[] = [];
    const itemWidth = (width - (spacing * 2)) / 3;
    const itemHeight = height;
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      positions.push({
        id: `stream-${i}`,
        x: padding + (i * (itemWidth + spacing)),
        y: padding,
        width: itemWidth,
        height: itemHeight,
        zIndex: 1,
        isVisible: true,
      });
    }
    
    return positions;
  };
  
  // 4x1 Grid Layout (4 horizontal)
  const calculateGrid4x1 = (
    count: number, 
    width: number, 
    height: number, 
    padding: number, 
    spacing: number
  ): StreamPosition[] => {
    const positions: StreamPosition[] = [];
    const itemWidth = (width - (spacing * 3)) / 4;
    const itemHeight = height;
    
    for (let i = 0; i < Math.min(count, 4); i++) {
      positions.push({
        id: `stream-${i}`,
        x: padding + (i * (itemWidth + spacing)),
        y: padding,
        width: itemWidth,
        height: itemHeight,
        zIndex: 1,
        isVisible: true,
      });
    }
    
    return positions;
  };
  
  // 1x4 Grid Layout (4 vertical)
  const calculateGrid1x4 = (
    count: number, 
    width: number, 
    height: number, 
    padding: number, 
    spacing: number
  ): StreamPosition[] => {
    const positions: StreamPosition[] = [];
    const itemWidth = width;
    const itemHeight = (height - (spacing * 3)) / 4;
    
    for (let i = 0; i < Math.min(count, 4); i++) {
      positions.push({
        id: `stream-${i}`,
        x: padding,
        y: padding + (i * (itemHeight + spacing)),
        width: itemWidth,
        height: itemHeight,
        zIndex: 1,
        isVisible: true,
      });
    }
    
    return positions;
  };
  
  // Picture-in-Picture Layout
  const calculatePiPLayout = (
    count: number, 
    width: number, 
    height: number, 
    padding: number, 
    spacing: number
  ): StreamPosition[] => {
    const positions: StreamPosition[] = [];
    
    if (count === 0) return positions;
    
    // Main stream (fullscreen)
    positions.push({
      id: 'stream-0',
      x: padding,
      y: padding,
      width: width,
      height: height,
      zIndex: 1,
      isVisible: true,
    });
    
    // PiP streams (small overlays)
    const pipWidth = width * 0.25;
    const pipHeight = height * 0.25;
    const pipSpacing = ModernTheme.spacing.sm;
    
    for (let i = 1; i < count && i < 5; i++) {
      const col = (i - 1) % 2;
      const row = Math.floor((i - 1) / 2);
      
      positions.push({
        id: `stream-${i}`,
        x: width - pipWidth - padding - (col * (pipWidth + pipSpacing)),
        y: padding + pipSpacing + (row * (pipHeight + pipSpacing)),
        width: pipWidth,
        height: pipHeight,
        zIndex: 10 + i,
        isVisible: true,
      });
    }
    
    return positions;
  };
  
  // Fullscreen Layout (single stream)
  const calculateFullscreenLayout = (
    count: number, 
    width: number, 
    height: number, 
    padding: number
  ): StreamPosition[] => {
    const positions: StreamPosition[] = [];
    
    if (count > 0) {
      positions.push({
        id: 'stream-0',
        x: 0,
        y: 0,
        width: width + (padding * 2),
        height: height + (padding * 2),
        zIndex: 1,
        isVisible: true,
      });
    }
    
    // Hide other streams in fullscreen mode
    for (let i = 1; i < count; i++) {
      positions.push({
        id: `stream-${i}`,
        x: -1000, // Move off-screen
        y: -1000,
        width: 0,
        height: 0,
        zIndex: 0,
        isVisible: false,
      });
    }
    
    return positions;
  };
  
  // Get current layout positions
  const getCurrentPositions = (): StreamPosition[] => {
    return calculateLayout(layoutMode, containerDimensions.width, containerDimensions.height);
  };
  
  // Handle container layout
  const handleContainerLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerDimensions({ width, height });
  };
  
  // Animate layout changes
  useEffect(() => {
    layoutTransition.value = withSpring(1, {
      damping: 20,
      stiffness: 150,
    });
    
    const positions = getCurrentPositions();
    onPositionChange?.(positions);
  }, [layoutMode, containerDimensions, children.length]);
  
  // Snap position to grid
  const snapToGridPosition = (value: number): number => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };
  
  // Handle position update for individual streams
  const handleStreamPositionUpdate = (streamIndex: number, x: number, y: number) => {
    const positions = getCurrentPositions();
    if (positions[streamIndex]) {
      positions[streamIndex].x = snapToGridPosition(x);
      positions[streamIndex].y = snapToGridPosition(y);
      onPositionChange?.(positions);
    }
  };
  
  // Handle size update for individual streams
  const handleStreamSizeUpdate = (streamIndex: number, width: number, height: number) => {
    const positions = getCurrentPositions();
    if (positions[streamIndex]) {
      positions[streamIndex].width = snapToGridPosition(width);
      positions[streamIndex].height = snapToGridPosition(height);
      onPositionChange?.(positions);
    }
  };
  
  // Render streams with calculated positions
  const renderStreams = () => {
    const positions = getCurrentPositions();
    
    return children.map((child, index) => {
      const position = positions[index];
      if (!position || !position.isVisible) return null;
      
      const animatedStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        left: withSpring(position.x, { damping: 20 }),
        top: withSpring(position.y, { damping: 20 }),
        width: withSpring(position.width, { damping: 20 }),
        height: withSpring(position.height, { damping: 20 }),
        zIndex: position.zIndex,
        opacity: layoutTransition.value,
        transform: [
          {
            scale: interpolate(
              layoutTransition.value,
              [0, 1],
              [0.8, 1],
              Extrapolate.CLAMP
            ),
          },
        ],
      }));
      
      return (
        <Animated.View key={`stream-${index}`} style={animatedStyle}>
          {React.cloneElement(child as React.ReactElement, {
            width: position.width,
            height: position.height,
            position: { x: position.x, y: position.y },
            layoutMode: getStreamLayoutMode(index),
            onMove: (x: number, y: number) => handleStreamPositionUpdate(index, x, y),
            onResize: (width: number, height: number) => handleStreamSizeUpdate(index, width, height),
            isDraggable: enableGestures && layoutMode === 'custom',
            isResizable: enableGestures && layoutMode === 'custom',
            zIndex: position.zIndex,
          })}
        </Animated.View>
      );
    });
  };
  
  // Get layout mode for individual stream
  const getStreamLayoutMode = (index: number) => {
    switch (layoutMode) {
      case 'fullscreen':
        return index === 0 ? 'fullscreen' : 'grid';
      case 'pip':
        return index === 0 ? 'grid' : 'pip';
      default:
        return 'grid';
    }
  };
  
  // Container animated style
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          layoutTransition.value,
          [0, 1],
          [0.95, 1],
          Extrapolate.CLAMP
        ),
      },
    ],
    opacity: layoutTransition.value,
  }));
  
  return (
    <View
      style={[styles.container, containerStyle]}
      onLayout={handleContainerLayout}
    >
      <Animated.View style={[styles.streamsContainer, containerAnimatedStyle]}>
        {renderStreams()}
      </Animated.View>
      
      {/* Grid lines for custom layout mode */}
      {snapToGrid && layoutMode === 'custom' && (
        <View style={styles.gridOverlay} pointerEvents="none">
          {/* Vertical grid lines */}
          {Array.from({ length: Math.floor(containerDimensions.width / gridSize) }).map((_, i) => (
            <View
              key={`v-${i}`}
              style={[
                styles.gridLine,
                {
                  left: i * gridSize,
                  height: containerDimensions.height,
                  width: 1,
                },
              ]}
            />
          ))}
          
          {/* Horizontal grid lines */}
          {Array.from({ length: Math.floor(containerDimensions.height / gridSize) }).map((_, i) => (
            <View
              key={`h-${i}`}
              style={[
                styles.gridLine,
                {
                  top: i * gridSize,
                  width: containerDimensions.width,
                  height: 1,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernTheme.colors.background.primary,
  } as ViewStyle,
  streamsContainer: {
    flex: 1,
    position: 'relative',
  } as ViewStyle,
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  } as ViewStyle,
  gridLine: {
    position: 'absolute',
    backgroundColor: ModernTheme.colors.border.primary,
  } as ViewStyle,
});

// Export layout calculation utilities
export const LayoutUtils = {
  calculateOptimalLayout: (
    streamCount: number,
    containerWidth: number,
    containerHeight: number
  ): LayoutMode => {
    const aspectRatio = containerWidth / containerHeight;
    
    if (streamCount === 1) {
      return 'fullscreen';
    } else if (streamCount === 2) {
      return aspectRatio > 1.5 ? 'grid-3x1' : 'grid-2x2';
    } else if (streamCount === 3) {
      return aspectRatio > 1.5 ? 'grid-3x1' : 'grid-2x2';
    } else if (streamCount === 4) {
      return aspectRatio > 1.8 ? 'grid-4x1' : 'grid-2x2';
    } else {
      return 'pip';
    }
  },
  
  getLayoutName: (mode: LayoutMode): string => {
    switch (mode) {
      case 'grid-2x2': return '2×2 Grid';
      case 'grid-3x1': return '3×1 Grid';
      case 'grid-4x1': return '4×1 Grid';
      case 'grid-1x4': return '1×4 Grid';
      case 'pip': return 'Picture in Picture';
      case 'fullscreen': return 'Fullscreen';
      case 'custom': return 'Custom Layout';
      default: return 'Grid Layout';
    }
  },
  
  getLayoutIcon: (mode: LayoutMode): string => {
    switch (mode) {
      case 'grid-2x2': return 'grid-3x3';
      case 'grid-3x1': return 'columns';
      case 'grid-4x1': return 'columns';
      case 'grid-1x4': return 'rows';
      case 'pip': return 'picture-in-picture-2';
      case 'fullscreen': return 'maximize-2';
      case 'custom': return 'move';
      default: return 'grid-3x3';
    }
  },
  
  getAvailableLayouts: (streamCount: number): LayoutMode[] => {
    const layouts: LayoutMode[] = ['custom'];
    
    if (streamCount >= 1) {
      layouts.push('fullscreen');
    }
    
    if (streamCount >= 2) {
      layouts.push('grid-2x2', 'pip');
    }
    
    if (streamCount >= 3) {
      layouts.push('grid-3x1', 'grid-1x4');
    }
    
    if (streamCount >= 4) {
      layouts.push('grid-4x1');
    }
    
    return layouts;
  },
};

export default LayoutManager;