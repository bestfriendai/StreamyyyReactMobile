import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  Platform,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Grid3X3,
  Grid2X2,
  Square,
  Plus,
  Settings,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  Shuffle,
  Play,
  Pause,
} from 'lucide-react-native';
import { TwitchStream } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';
import { EnhancedVideoPlayer } from './EnhancedVideoPlayer';
import { logError, logDebug, withSyncErrorHandling } from '@/utils/errorHandler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { FlatGrid } from 'react-native-super-grid';

interface EnhancedMultiStreamViewerProps {
  streams: TwitchStream[];
  onAddStream?: () => void;
  onRemoveStream?: (streamId: string) => void;
  maxStreams?: number;
}

type GridLayout = '1x1' | '2x2' | '3x3' | '4x4';

interface AudioState {
  activeStreamId: string | null;
  globalMute: boolean;
}

export const EnhancedMultiStreamViewer: React.FC<EnhancedMultiStreamViewerProps> = ({
  streams,
  onAddStream,
  onRemoveStream,
  maxStreams = 9,
}) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // State management
  const [gridLayout, setGridLayout] = useState<GridLayout>('2x2');
  const [audioState, setAudioState] = useState<AudioState>({
    activeStreamId: null,
    globalMute: false,
  });
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  
  // Animation values
  const headerOpacity = useSharedValue(1);
  const controlsScale = useSharedValue(1);
  
  // Calculate grid dimensions
  const getGridDimensions = useCallback(() => {
    const padding = ModernTheme.spacing.md;
    const headerHeight = 120;
    const controlsHeight = 80;
    const availableWidth = screenWidth - (padding * 2);
    const availableHeight = screenHeight - headerHeight - controlsHeight - (padding * 2);
    
    let columns: number;
    let rows: number;
    
    switch (gridLayout) {
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
      default:
        columns = 2;
        rows = 2;
    }
    
    const itemSpacing = ModernTheme.spacing.sm;
    const itemWidth = (availableWidth - (itemSpacing * (columns - 1))) / columns;
    const itemHeight = (availableHeight - (itemSpacing * (rows - 1))) / rows;
    
    return {
      itemWidth: Math.floor(itemWidth),
      itemHeight: Math.floor(itemHeight),
      columns,
      rows,
      maxItems: columns * rows,
    };
  }, [gridLayout, screenWidth, screenHeight]);
  
  const gridDimensions = useMemo(() => getGridDimensions(), [getGridDimensions]);
  
  // Handle stream audio toggle
  const handleStreamAudioToggle = useCallback((streamId: string) => {
    withSyncErrorHandling(() => {
      logDebug('Toggling audio for stream', { streamId });
      setAudioState(prev => {
        if (prev.activeStreamId === streamId) {
          // If this stream is currently active, mute it
          return {
            ...prev,
            activeStreamId: null,
          };
        } else {
          // Make this stream the active audio stream
          return {
            ...prev,
            activeStreamId: streamId,
          };
        }
      });
    }, { component: 'EnhancedMultiStreamViewer', action: 'handleStreamAudioToggle' });
  }, []);
  
  // Handle global mute toggle
  const handleGlobalMuteToggle = useCallback(() => {
    setAudioState(prev => ({
      ...prev,
      globalMute: !prev.globalMute,
      activeStreamId: prev.globalMute ? prev.activeStreamId : null,
    }));
  }, []);
  
  // Handle stream selection
  const handleStreamPress = useCallback((streamId: string) => {
    setSelectedStreamId(prev => prev === streamId ? null : streamId);
  }, []);
  
  // Handle stream removal
  const handleStreamRemove = useCallback((streamId: string) => {
    withSyncErrorHandling(() => {
      logDebug('Removing stream', { streamId });
      Alert.alert(
        'Remove Stream',
        'Are you sure you want to remove this stream?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              withSyncErrorHandling(() => {
                onRemoveStream?.(streamId);
                if (audioState.activeStreamId === streamId) {
                  setAudioState(prev => ({ ...prev, activeStreamId: null }));
                }
                if (selectedStreamId === streamId) {
                  setSelectedStreamId(null);
                }
                logDebug('Stream removed successfully', { streamId });
              }, { component: 'EnhancedMultiStreamViewer', action: 'removeStreamConfirm' });
            },
          },
        ]
      );
    }, { component: 'EnhancedMultiStreamViewer', action: 'handleStreamRemove' });
  }, [onRemoveStream, audioState.activeStreamId, selectedStreamId]);
  
  // Handle layout change
  const handleLayoutChange = useCallback((layout: GridLayout) => {
    controlsScale.value = withSpring(0.9, { damping: 15 }, () => {
      controlsScale.value = withSpring(1);
    });
    setGridLayout(layout);
  }, []);
  
  // Handle play/pause all
  const handlePlayPauseAll = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);
  
  // Prepare grid data
  const gridData = useMemo(() => {
    const maxItems = gridDimensions.maxItems;
    const data = [...streams.slice(0, maxItems)];
    
    // Add empty slots for adding new streams
    if (data.length < maxItems && data.length < maxStreams) {
      data.push({
        id: 'add-stream',
        user_name: 'Add Stream',
        game_name: '',
        viewer_count: 0,
        thumbnail_url: '',
        user_login: '',
        type: 'add' as any,
      });
    }
    
    return data;
  }, [streams, gridDimensions.maxItems, maxStreams]);
  
  // Animated styles
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));
  
  const controlsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: controlsScale.value }],
  }));
  
  // Render grid item
  const renderGridItem = useCallback(({ item, index }: { item: any; index: number }) => {
    if (item.type === 'add') {
      return (
        <TouchableOpacity
          style={[
            styles.addStreamContainer,
            {
              width: gridDimensions.itemWidth,
              height: gridDimensions.itemHeight,
            },
          ]}
          onPress={onAddStream}
        >
          <LinearGradient
            colors={ModernTheme.colors.gradients.primary}
            style={styles.addStreamGradient}
          >
            <Plus size={32} color={ModernTheme.colors.text.primary} />
            <Text style={styles.addStreamText}>Add Stream</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }
    
    const isActive = selectedStreamId === item.id;
    const isMuted = audioState.globalMute || audioState.activeStreamId !== item.id;
    
    return (
      <EnhancedVideoPlayer
        key={item.id}
        stream={item}
        width={gridDimensions.itemWidth}
        height={gridDimensions.itemHeight}
        isActive={isActive}
        isMuted={isMuted}
        onPress={() => handleStreamPress(item.id)}
        onMuteToggle={() => handleStreamAudioToggle(item.id)}
        onRemove={() => handleStreamRemove(item.id)}
        showControls={showControls}
      />
    );
  }, [
    gridDimensions,
    selectedStreamId,
    audioState,
    showControls,
    onAddStream,
    handleStreamPress,
    handleStreamAudioToggle,
    handleStreamRemove,
  ]);
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <LinearGradient
          colors={ModernTheme.colors.gradients.background}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Multi-Stream Viewer</Text>
              <Text style={styles.headerSubtitle}>
                {streams.length} of {maxStreams} streams
              </Text>
            </View>
            
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleGlobalMuteToggle}
              >
                <LinearGradient
                  colors={audioState.globalMute 
                    ? ModernTheme.colors.gradients.danger 
                    : ModernTheme.colors.gradients.primary
                  }
                  style={styles.headerButtonGradient}
                >
                  {audioState.globalMute ? (
                    <VolumeX size={20} color="#fff" />
                  ) : (
                    <Volume2 size={20} color="#fff" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handlePlayPauseAll}
              >
                <LinearGradient
                  colors={ModernTheme.colors.gradients.accent}
                  style={styles.headerButtonGradient}
                >
                  {isPlaying ? (
                    <Pause size={20} color="#fff" />
                  ) : (
                    <Play size={20} color="#fff" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
      
      {/* Grid Container */}
      <View style={styles.gridContainer}>
        <FlatGrid
          itemDimension={gridDimensions.itemWidth}
          data={gridData}
          style={styles.grid}
          spacing={ModernTheme.spacing.sm}
          renderItem={renderGridItem}
          maxItemsPerRow={gridDimensions.columns}
          showsVerticalScrollIndicator={false}
        />
      </View>
      
      {/* Controls */}
      <Animated.View style={[styles.controls, controlsStyle]}>
        <LinearGradient
          colors={ModernTheme.colors.gradients.background}
          style={styles.controlsGradient}
        >
          <View style={styles.controlsContent}>
            <Text style={styles.controlsLabel}>Layout</Text>
            <View style={styles.layoutButtons}>
              {(['1x1', '2x2', '3x3', '4x4'] as GridLayout[]).map((layout) => {
                const isActive = gridLayout === layout;
                const IconComponent = {
                  '1x1': Square,
                  '2x2': Grid2X2,
                  '3x3': Grid3X3,
                  '4x4': Grid3X3,
                }[layout];
                
                return (
                  <TouchableOpacity
                    key={layout}
                    style={[
                      styles.layoutButton,
                      isActive && styles.layoutButtonActive,
                    ]}
                    onPress={() => handleLayoutChange(layout)}
                  >
                    <LinearGradient
                      colors={isActive 
                        ? ModernTheme.colors.gradients.primary 
                        : ModernTheme.colors.gradients.secondary
                      }
                      style={styles.layoutButtonGradient}
                    >
                      <IconComponent size={16} color="#fff" />
                      <Text style={styles.layoutButtonText}>{layout}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernTheme.colors.background.primary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  headerGradient: {
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: ModernTheme.typography.sizes.xl,
    fontWeight: ModernTheme.typography.weights.bold,
    color: ModernTheme.colors.text.primary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
  },
  headerRight: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  },
  headerButton: {
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  headerButtonGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gridContainer: {
    flex: 1,
    paddingHorizontal: ModernTheme.spacing.md,
  },
  grid: {
    flex: 1,
  },
  addStreamContainer: {
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
    margin: ModernTheme.spacing.xs,
  },
  addStreamGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
  },
  addStreamText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.semibold,
    marginTop: ModernTheme.spacing.sm,
  },
  controls: {
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  controlsGradient: {
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.md,
  },
  controlsContent: {
    alignItems: 'center',
  },
  controlsLabel: {
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.secondary,
    marginBottom: ModernTheme.spacing.sm,
  },
  layoutButtons: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  },
  layoutButton: {
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  layoutButtonActive: {
    transform: [{ scale: 1.05 }],
  },
  layoutButtonGradient: {
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 60,
  },
  layoutButtonText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.xs,
    fontWeight: ModernTheme.typography.weights.medium,
    marginTop: 2,
  },
});

export default EnhancedMultiStreamViewer;