import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Alert,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Grid3X3,
  Grid2X2,
  Square,
  Plus,
  Settings,
  Volume2,
  VolumeX,
  RotateCcw,
  X,
  Monitor,
} from 'lucide-react-native';
import { TwitchStream } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';
import { DirectTwitchPlayer } from './DirectTwitchPlayer';
import { useStreamManager } from '@/hooks/useStreamManager';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type GridLayout = '1x1' | '2x2' | '3x3' | '4x4';

interface ModernMultiStreamGridProps {
  maxStreams?: number;
  onLayoutChange?: (layout: GridLayout) => void;
}

export const ModernMultiStreamGrid: React.FC<ModernMultiStreamGridProps> = ({
  maxStreams = 4,
  onLayoutChange,
}) => {
  const { activeStreams, removeStream, clearAllStreams } = useStreamManager();
  const [layout, setLayout] = useState<GridLayout>('2x2');
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [globalMute, setGlobalMute] = useState(true);
  const [showControls, setShowControls] = useState(true);
  
  // Animation values
  const gridScale = useSharedValue(1);
  const controlsOpacity = useSharedValue(1);
  
  // Calculate grid dimensions
  const getGridDimensions = useCallback(() => {
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const headerHeight = 140; // Increased for better header
    const controlsHeight = 100; // Increased for better controls
    const padding = ModernTheme.spacing.md;
    const spacing = ModernTheme.spacing.xs; // Reduced spacing for better fit

    const availableWidth = screenWidth - (padding * 2);
    const availableHeight = screenHeight - headerHeight - controlsHeight - (padding * 2);

    let columns = 1;
    let rows = 1;

    switch (layout) {
      case '1x1':
        columns = 1;
        rows = 1;
        break;
      case '2x2':
        columns = 2;
        rows = 2;
        break;
      case '3x3':
        columns = 3;
        rows = 3;
        break;
      case '4x4':
        columns = 4;
        rows = 4;
        break;
    }

    const itemWidth = (availableWidth - (spacing * (columns - 1))) / columns;
    const itemHeight = (availableHeight - (spacing * (rows - 1))) / rows;

    // Ensure minimum dimensions for readability
    const minWidth = Math.max(itemWidth, 120);
    const minHeight = Math.max(itemHeight, 80);

    return {
      itemWidth: minWidth,
      itemHeight: minHeight,
      columns,
      rows,
      spacing,
      totalSlots: columns * rows,
      availableWidth,
      availableHeight,
    };
  }, [layout]);
  
  const gridDimensions = getGridDimensions();
  
  // Handle layout change
  const handleLayoutChange = useCallback((newLayout: GridLayout) => {
    gridScale.value = withSpring(0.95, { damping: 15 }, () => {
      gridScale.value = withSpring(1);
    });
    
    setLayout(newLayout);
    onLayoutChange?.(newLayout);
  }, [onLayoutChange]);
  
  // Handle stream removal
  const handleRemoveStream = useCallback((streamId: string) => {
    Alert.alert(
      'Remove Stream',
      'Are you sure you want to remove this stream?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => removeStream(streamId)
        }
      ]
    );
  }, [removeStream]);
  
  // Handle clear all streams
  const handleClearAll = useCallback(() => {
    if (activeStreams.length === 0) return;
    
    Alert.alert(
      'Clear All Streams',
      'Are you sure you want to remove all streams?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: clearAllStreams
        }
      ]
    );
  }, [activeStreams.length, clearAllStreams]);
  
  // Toggle global mute
  const handleGlobalMuteToggle = useCallback(() => {
    setGlobalMute(!globalMute);
  }, [globalMute]);
  
  // Toggle controls visibility
  const toggleControls = useCallback(() => {
    setShowControls(!showControls);
    controlsOpacity.value = withTiming(showControls ? 0 : 1, { duration: 200 });
  }, [showControls]);
  
  // Animated styles
  const gridStyle = useAnimatedStyle(() => ({
    transform: [{ scale: gridScale.value }],
  }));
  
  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));
  
  // Render empty slot
  const renderEmptySlot = useCallback((index: number) => (
    <TouchableOpacity
      key={`empty-${index}`}
      style={[
        styles.emptySlot,
        {
          width: gridDimensions.itemWidth,
          height: gridDimensions.itemHeight,
        }
      ]}
      onPress={() => {
        // Navigate to discover screen to add streams
        Alert.alert(
          'Add Stream',
          'Go to the Discover tab to find and add streams to your multi-view.',
          [
            { text: 'OK' },
            { text: 'Go to Discover', onPress: () => {
              // TODO: Navigate to discover tab
              console.log('Navigate to discover');
            }}
          ]
        );
      }}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
        style={styles.emptySlotGradient}
      >
        <View style={styles.emptySlotContent}>
          <View style={styles.addIconContainer}>
            <Plus size={24} color={ModernTheme.colors.primary[400]} />
          </View>
          <Text style={styles.emptySlotText}>Add Stream</Text>
          <Text style={styles.emptySlotSubtext}>Tap to browse streams</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  ), [gridDimensions]);
  
  // Render grid items in proper rows and columns
  const renderGridItems = useMemo(() => {
    const { columns, rows, itemWidth, itemHeight, spacing } = gridDimensions;
    const totalSlots = columns * rows;
    const displayStreams = activeStreams.slice(0, totalSlots);

    const gridRows = [];

    // Create rows
    for (let row = 0; row < rows; row++) {
      const rowItems = [];

      // Create columns for this row
      for (let col = 0; col < columns; col++) {
        const streamIndex = row * columns + col;
        const stream = displayStreams[streamIndex];

        if (stream) {
          // Add stream player
          rowItems.push(
            <DirectTwitchPlayer
              key={stream.id}
              stream={stream}
              width={itemWidth}
              height={itemHeight}
              isActive={activeStreamId === stream.id}
              isMuted={globalMute && activeStreamId !== stream.id}
              onPress={() => setActiveStreamId(stream.id)}
              onRemove={() => handleRemoveStream(stream.id)}
              onMuteToggle={() => setActiveStreamId(activeStreamId === stream.id ? null : stream.id)}
              showControls={showControls}
            />
          );
        } else {
          // Add empty slot
          rowItems.push(renderEmptySlot(`${row}-${col}`));
        }
      }

      // Add the row
      gridRows.push(
        <View
          key={`row-${row}`}
          style={[
            styles.gridRow,
            {
              gap: spacing,
            }
          ]}
        >
          {rowItems}
        </View>
      );
    }

    return gridRows;
  }, [
    activeStreams,
    gridDimensions,
    activeStreamId,
    globalMute,
    showControls,
    handleRemoveStream,
    renderEmptySlot,
  ]);
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.95)', 'rgba(0, 0, 0, 0.8)']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.titleContainer}>
                <Monitor size={24} color={ModernTheme.colors.primary[400]} />
                <Text style={styles.headerTitle}>Multi-Stream Viewer</Text>
              </View>
              <View style={styles.streamInfo}>
                <View style={styles.streamCount}>
                  <Text style={styles.streamCountNumber}>{activeStreams.length}</Text>
                  <Text style={styles.streamCountText}>of {gridDimensions.totalSlots} streams</Text>
                </View>
                {activeStreamId && (
                  <View style={styles.activeStreamInfo}>
                    <View style={styles.liveDot} />
                    <Text style={styles.activeStreamText}>
                      {activeStreams.find(s => s.id === activeStreamId)?.user_name || 'Unknown'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={[styles.headerButton, globalMute && styles.headerButtonMuted]}
                onPress={handleGlobalMuteToggle}
              >
                <LinearGradient
                  colors={globalMute ?
                    ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.1)'] :
                    ['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.1)']
                  }
                  style={styles.headerButtonGradient}
                >
                  {globalMute ? (
                    <VolumeX size={18} color={ModernTheme.colors.text.primary} />
                  ) : (
                    <Volume2 size={18} color={ModernTheme.colors.text.primary} />
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerButton}
                onPress={toggleControls}
              >
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.1)']}
                  style={styles.headerButtonGradient}
                >
                  <Settings size={18} color={ModernTheme.colors.text.primary} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Layout Controls */}
          <Animated.View style={[styles.layoutControls, controlsStyle]}>
            <Text style={styles.controlsLabel}>Layout:</Text>
            <View style={styles.layoutButtons}>
              {(['1x1', '2x2', '3x3', '4x4'] as GridLayout[]).map((layoutOption) => {
                const isActive = layout === layoutOption;
                const IconComponent = layoutOption === '1x1' ? Square : 
                                   layoutOption === '2x2' ? Grid2X2 : Grid3X3;
                
                return (
                  <TouchableOpacity
                    key={layoutOption}
                    style={[styles.layoutButton, isActive && styles.layoutButtonActive]}
                    onPress={() => handleLayoutChange(layoutOption)}
                  >
                    <IconComponent size={16} color={ModernTheme.colors.text.primary} />
                    <Text style={[styles.layoutButtonText, isActive && styles.layoutButtonTextActive]}>
                      {layoutOption}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {activeStreams.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearAll}
              >
                <RotateCcw size={16} color={ModernTheme.colors.text.error} />
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </LinearGradient>
      </View>
      
      {/* Grid */}
      <View style={styles.content}>
        <Animated.View style={[styles.grid, gridStyle]}>
          <View
            style={[
              styles.gridContainer,
              {
                gap: gridDimensions.spacing,
              }
            ]}
          >
            {renderGridItems}
          </View>
        </Animated.View>
      </View>
      
      {/* Empty State */}
      {activeStreams.length === 0 && (
        <View style={styles.emptyState}>
          <Monitor size={64} color={ModernTheme.colors.text.secondary} />
          <Text style={styles.emptyStateTitle}>No Active Streams</Text>
          <Text style={styles.emptyStateSubtitle}>
            Go to Discover to add streams to your multi-view
          </Text>
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
  header: {
    paddingTop: 50,
  } as ViewStyle,
  headerGradient: {
    paddingHorizontal: ModernTheme.spacing.md,
    paddingBottom: ModernTheme.spacing.md,
  } as ViewStyle,
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ModernTheme.spacing.md,
  } as ViewStyle,
  headerLeft: {
    flex: 1,
  } as ViewStyle,
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.sm,
    marginBottom: ModernTheme.spacing.xs,
  } as ViewStyle,
  headerTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.lg,
    fontWeight: ModernTheme.typography.weights.bold,
  } as TextStyle,
  streamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.md,
  } as ViewStyle,
  streamCount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: ModernTheme.spacing.xs,
  } as ViewStyle,
  streamCountNumber: {
    color: ModernTheme.colors.primary[400],
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.bold,
  } as TextStyle,
  streamCountText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
  } as TextStyle,
  activeStreamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.xs,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  } as ViewStyle,
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ModernTheme.colors.status.success,
  } as ViewStyle,
  activeStreamText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
  } as TextStyle,
  headerSubtitle: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
  } as TextStyle,
  headerRight: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  } as ViewStyle,
  headerButton: {
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
    marginLeft: ModernTheme.spacing.sm,
  } as ViewStyle,
  headerButtonGradient: {
    padding: ModernTheme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  headerButtonMuted: {
    opacity: 0.8,
  } as ViewStyle,
  layoutControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.md,
  } as ViewStyle,
  controlsLabel: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
  } as TextStyle,
  layoutButtons: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.xs,
  } as ViewStyle,
  layoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: ModernTheme.borderRadius.sm,
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    gap: ModernTheme.spacing.xs,
  } as ViewStyle,
  layoutButtonActive: {
    backgroundColor: ModernTheme.colors.primary[500],
  } as ViewStyle,
  layoutButtonText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.xs,
    fontWeight: ModernTheme.typography.weights.medium,
  } as TextStyle,
  layoutButtonTextActive: {
    color: ModernTheme.colors.text.primary,
  } as TextStyle,
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: ModernTheme.borderRadius.sm,
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    gap: ModernTheme.spacing.xs,
  } as ViewStyle,
  clearButtonText: {
    color: ModernTheme.colors.text.error,
    fontSize: ModernTheme.typography.sizes.xs,
    fontWeight: ModernTheme.typography.weights.medium,
  } as TextStyle,
  content: {
    flex: 1,
    padding: ModernTheme.spacing.md,
  } as ViewStyle,
  grid: {
    flex: 1,
  } as ViewStyle,
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  emptySlot: {
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderStyle: 'dashed',
  } as ViewStyle,
  emptySlotGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ModernTheme.spacing.md,
  } as ViewStyle,
  emptySlotContent: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  addIconContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ModernTheme.spacing.sm,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  } as ViewStyle,
  emptySlotText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.semibold,
    marginBottom: ModernTheme.spacing.xs,
    textAlign: 'center',
  } as TextStyle,
  emptySlotSubtext: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
    textAlign: 'center',
    opacity: 0.8,
  } as TextStyle,
  emptyState: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: ModernTheme.spacing.md,
    paddingHorizontal: ModernTheme.spacing.xl,
  } as ViewStyle,
  emptyStateTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.xl,
    fontWeight: ModernTheme.typography.weights.semibold,
    textAlign: 'center',
  } as TextStyle,
  emptyStateSubtitle: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.md,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
});

export default ModernMultiStreamGrid;
