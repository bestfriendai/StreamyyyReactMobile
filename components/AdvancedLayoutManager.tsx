import { LinearGradient } from 'expo-linear-gradient';
import {
  Grid,
  List,
  PictureInPicture,
  Focus,
  Layers,
  Columns,
  Grid3X3,
  Split,
  Layout,
  RotateCcw,
  Settings,
} from 'lucide-react-native';
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { TwitchStream } from '@/services/twitchApi';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export type LayoutType =
  | 'grid_1x1'
  | 'grid_2x2'
  | 'grid_3x3'
  | 'grid_4x4'
  | 'linear_2x1'
  | 'linear_3x1'
  | 'linear_4x1'
  | 'pip'
  | 'focus'
  | 'stacked'
  | 'mosaic'
  | 'split_horizontal'
  | 'split_vertical'
  | 'floating'
  | 'custom';

export interface StreamPosition {
  streamId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  scale: number;
  opacity: number;
}

export interface LayoutConfiguration {
  id: string;
  name: string;
  type: LayoutType;
  positions: StreamPosition[];
  isCustom?: boolean;
  description?: string;
  thumbnail?: string;
}

interface AdvancedLayoutManagerProps {
  streams: TwitchStream[];
  currentLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  onCustomLayout: (config: LayoutConfiguration) => void;
  onStreamReorder: (streamId: string, newPosition: number) => void;
  customLayouts?: LayoutConfiguration[];
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function AdvancedLayoutManager({
  streams,
  currentLayout,
  onLayoutChange,
  onCustomLayout,
  onStreamReorder,
  customLayouts = [],
}: AdvancedLayoutManagerProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'basic' | 'advanced' | 'custom'>(
    'basic'
  );

  // Animation values
  const expandedHeight = useSharedValue(0);
  const categoryOpacity = useSharedValue(1);

  React.useEffect(() => {
    expandedHeight.value = withSpring(showAdvanced ? 300 : 120, {
      damping: 15,
      stiffness: 100,
    });
  }, [showAdvanced]);

  React.useEffect(() => {
    categoryOpacity.value = withTiming(1, { duration: 200 });
  }, [selectedCategory]);

  const calculateStreamDimensions = useCallback(
    (
      layout: LayoutType,
      streamIndex: number,
      totalStreams: number
    ): { width: number; height: number; x: number; y: number } => {
      const containerWidth = screenWidth - 24;
      const containerHeight = screenHeight - 200;
      const aspectRatio = 16 / 9;

      switch (layout) {
        case 'grid_1x1':
          return {
            width: containerWidth,
            height: containerWidth / aspectRatio,
            x: 0,
            y: 0,
          };

        case 'grid_2x2':
          const grid2Size = (containerWidth - 12) / 2;
          return {
            width: grid2Size,
            height: grid2Size / aspectRatio,
            x: (streamIndex % 2) * (grid2Size + 12),
            y: Math.floor(streamIndex / 2) * (grid2Size / aspectRatio + 12),
          };

        case 'grid_3x3':
          const grid3Size = (containerWidth - 24) / 3;
          return {
            width: grid3Size,
            height: grid3Size / aspectRatio,
            x: (streamIndex % 3) * (grid3Size + 12),
            y: Math.floor(streamIndex / 3) * (grid3Size / aspectRatio + 12),
          };

        case 'grid_4x4':
          const grid4Size = (containerWidth - 36) / 4;
          return {
            width: grid4Size,
            height: grid4Size / aspectRatio,
            x: (streamIndex % 4) * (grid4Size + 9),
            y: Math.floor(streamIndex / 4) * (grid4Size / aspectRatio + 9),
          };

        case 'linear_2x1':
          return {
            width: (containerWidth - 12) / 2,
            height: containerHeight,
            x: streamIndex * ((containerWidth - 12) / 2 + 12),
            y: 0,
          };

        case 'linear_3x1':
          return {
            width: (containerWidth - 24) / 3,
            height: containerHeight,
            x: streamIndex * ((containerWidth - 24) / 3 + 12),
            y: 0,
          };

        case 'linear_4x1':
          return {
            width: (containerWidth - 36) / 4,
            height: containerHeight,
            x: streamIndex * ((containerWidth - 36) / 4 + 9),
            y: 0,
          };

        case 'split_horizontal':
          return {
            width: containerWidth,
            height: (containerHeight - 12) / 2,
            x: 0,
            y: streamIndex * ((containerHeight - 12) / 2 + 12),
          };

        case 'split_vertical':
          return {
            width: (containerWidth - 12) / 2,
            height: containerHeight,
            x: streamIndex * ((containerWidth - 12) / 2 + 12),
            y: 0,
          };

        case 'pip':
          if (streamIndex === 0) {
            return {
              width: containerWidth,
              height: containerHeight * 0.75,
              x: 0,
              y: 0,
            };
          } else {
            const pipSize = containerWidth * 0.25;
            return {
              width: pipSize,
              height: pipSize / aspectRatio,
              x: containerWidth - pipSize - 12,
              y: 12 + (streamIndex - 1) * (pipSize / aspectRatio + 12),
            };
          }

        case 'focus':
          if (streamIndex === 0) {
            return {
              width: containerWidth,
              height: containerHeight * 0.7,
              x: 0,
              y: 0,
            };
          } else {
            const thumbSize = (containerWidth - 24) / 3;
            return {
              width: thumbSize,
              height: thumbSize / aspectRatio,
              x: ((streamIndex - 1) % 3) * (thumbSize + 12),
              y: containerHeight * 0.7 + 12,
            };
          }

        case 'mosaic':
          // Dynamic mosaic based on stream count
          if (totalStreams <= 2) {
            return calculateStreamDimensions('split_horizontal', streamIndex, totalStreams);
          } else if (totalStreams <= 4) {
            return calculateStreamDimensions('grid_2x2', streamIndex, totalStreams);
          } else if (totalStreams <= 9) {
            return calculateStreamDimensions('grid_3x3', streamIndex, totalStreams);
          } else {
            return calculateStreamDimensions('grid_4x4', streamIndex, totalStreams);
          }

        case 'floating':
          const floatingSize = containerWidth * 0.3;
          const margin = 20;
          return {
            width: floatingSize,
            height: floatingSize / aspectRatio,
            x: margin + (streamIndex % 2) * (floatingSize + margin),
            y: margin + Math.floor(streamIndex / 2) * (floatingSize / aspectRatio + margin),
          };

        case 'stacked':
          return {
            width: containerWidth,
            height: containerHeight / Math.min(totalStreams, 4),
            x: 0,
            y: streamIndex * (containerHeight / Math.min(totalStreams, 4)),
          };

        default:
          return calculateStreamDimensions('grid_2x2', streamIndex, totalStreams);
      }
    },
    []
  );

  const basicLayouts = useMemo(
    () => [
      { id: 'grid_2x2', name: '2×2 Grid', icon: Grid, description: 'Classic 4-stream grid' },
      { id: 'grid_3x3', name: '3×3 Grid', icon: Grid3X3, description: 'Up to 9 streams' },
      {
        id: 'pip',
        name: 'Picture-in-Picture',
        icon: PictureInPicture,
        description: 'Main + thumbnails',
      },
      { id: 'focus', name: 'Focus Mode', icon: Focus, description: 'Featured stream' },
    ],
    []
  );

  const advancedLayouts = useMemo(
    () => [
      { id: 'linear_2x1', name: '2×1 Linear', icon: Columns, description: 'Side by side' },
      { id: 'linear_3x1', name: '3×1 Linear', icon: Columns, description: 'Three columns' },
      { id: 'linear_4x1', name: '4×1 Linear', icon: Columns, description: 'Four columns' },
      {
        id: 'split_horizontal',
        name: 'Horizontal Split',
        icon: Split,
        description: 'Top/bottom split',
      },
      {
        id: 'split_vertical',
        name: 'Vertical Split',
        icon: Split,
        description: 'Left/right split',
      },
      { id: 'mosaic', name: 'Auto Mosaic', icon: Layout, description: 'Adaptive layout' },
      { id: 'floating', name: 'Floating Windows', icon: Layers, description: 'Moveable streams' },
      { id: 'stacked', name: 'Stacked View', icon: List, description: 'Vertical stack' },
    ],
    []
  );

  const getCurrentLayouts = () => {
    switch (selectedCategory) {
      case 'basic':
        return basicLayouts;
      case 'advanced':
        return advancedLayouts;
      case 'custom':
        return customLayouts.map(layout => ({
          id: layout.id,
          name: layout.name,
          icon: Layout,
          description: layout.description || 'Custom layout',
        }));
      default:
        return basicLayouts;
    }
  };

  const getOptimalLayoutForStreamCount = (count: number): LayoutType => {
    if (count === 1) {
      return 'grid_1x1';
    }
    if (count === 2) {
      return 'split_horizontal';
    }
    if (count <= 4) {
      return 'grid_2x2';
    }
    if (count <= 6) {
      return 'linear_3x1';
    }
    if (count <= 9) {
      return 'grid_3x3';
    }
    return 'mosaic';
  };

  const handleAutoLayout = () => {
    const optimal = getOptimalLayoutForStreamCount(streams.length);
    onLayoutChange(optimal);
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    height: expandedHeight.value,
  }));

  const animatedCategoryStyle = useAnimatedStyle(() => ({
    opacity: categoryOpacity.value,
  }));

  const renderLayoutOption = (layout: any) => {
    const IconComponent = layout.icon;
    const isActive = currentLayout === layout.id;

    return (
      <AnimatedTouchableOpacity
        key={layout.id}
        style={[styles.layoutOption, isActive && styles.activeLayoutOption]}
        onPress={() => onLayoutChange(layout.id as LayoutType)}
      >
        <LinearGradient
          colors={
            isActive ? ['#8B5CF6', '#7C3AED'] : ['rgba(42, 42, 42, 0.8)', 'rgba(58, 58, 58, 0.8)']
          }
          style={styles.layoutGradient}
        >
          <View style={styles.layoutIconContainer}>
            <IconComponent size={20} color={isActive ? '#fff' : '#666'} />
          </View>
          <View style={styles.layoutInfo}>
            <Text style={[styles.layoutName, isActive && styles.activeLayoutName]}>
              {layout.name}
            </Text>
            <Text style={[styles.layoutDescription, isActive && styles.activeLayoutDescription]}>
              {layout.description}
            </Text>
          </View>
        </LinearGradient>
      </AnimatedTouchableOpacity>
    );
  };

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <LinearGradient
        colors={['rgba(26, 26, 26, 0.98)', 'rgba(15, 15, 15, 0.95)']}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Layout Manager</Text>
            <Text style={styles.subtitle}>
              {streams.length} stream{streams.length !== 1 ? 's' : ''} • {currentLayout}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.autoButton} onPress={handleAutoLayout}>
              <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.autoGradient}>
                <RotateCcw size={16} color="#fff" />
                <Text style={styles.autoText}>Auto</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setShowAdvanced(!showAdvanced)}
            >
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.expandGradient}>
                <Settings size={16} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Tabs */}
        {showAdvanced && (
          <Animated.View style={[styles.categoryTabs, animatedCategoryStyle]}>
            {(['basic', 'advanced', 'custom'] as const).map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  selectedCategory === category && styles.activeCategoryTab,
                ]}
                onPress={() => {
                  categoryOpacity.value = 0;
                  setTimeout(() => {
                    setSelectedCategory(category);
                  }, 100);
                }}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    selectedCategory === category && styles.activeCategoryTabText,
                  ]}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Layout Options */}
        <ScrollView
          style={styles.layoutsContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.layoutsContent}
        >
          <Animated.View style={animatedCategoryStyle}>
            {getCurrentLayouts().map(renderLayoutOption)}
          </Animated.View>
        </ScrollView>

        {/* Stream Count Optimization */}
        {showAdvanced && (
          <Animated.View style={[styles.optimizationSection, animatedCategoryStyle]}>
            <Text style={styles.optimizationTitle}>Stream Optimization</Text>
            <View style={styles.optimizationInfo}>
              <Text style={styles.optimizationText}>
                Recommended: {getOptimalLayoutForStreamCount(streams.length)}
              </Text>
              <Text style={styles.optimizationSubtext}>
                Based on {streams.length} active streams
              </Text>
            </View>
          </Animated.View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 12,
    marginBottom: 12,
  },
  background: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#999',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  autoButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  autoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  autoText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  expandButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  expandGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(42, 42, 42, 0.3)',
    borderRadius: 8,
    padding: 2,
    marginBottom: 12,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeCategoryTab: {
    backgroundColor: '#8B5CF6',
  },
  categoryTabText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#666',
  },
  activeCategoryTabText: {
    color: '#fff',
  },
  layoutsContainer: {
    flex: 1,
  },
  layoutsContent: {
    gap: 8,
  },
  layoutOption: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  activeLayoutOption: {
    // Additional styling for active state
  },
  layoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  layoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layoutInfo: {
    flex: 1,
  },
  layoutName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#666',
    marginBottom: 2,
  },
  activeLayoutName: {
    color: '#fff',
  },
  layoutDescription: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#555',
  },
  activeLayoutDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  optimizationSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  optimizationTitle: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  optimizationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optimizationText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#fff',
  },
  optimizationSubtext: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#999',
  },
});
