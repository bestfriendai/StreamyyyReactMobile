import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Grid,
  Layers,
  Settings,
  Music,
  Layout as LayoutIcon,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Maximize,
  MoreVertical,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import our new components
import { AdvancedLayoutManager, LayoutType, LayoutConfiguration } from './AdvancedLayoutManager';
import { GestureEnabledStreamCard } from './GestureEnabledStreamCard';
import { SynchronizedPlaybackController } from './SynchronizedPlaybackController';
import { FloatingStreamControls } from './FloatingStreamControls';
import { CustomLayoutBuilder } from './CustomLayoutBuilder';

// Import services
import { audioMixingService } from '../services/audioMixingService';
import { gestureManager } from '../services/gestureManager';

// Import existing components and hooks
import { TwitchStream } from '@/services/twitchApi';
import { useStreamManagerContext } from '@/contexts/StreamManagerContext';
import { HapticFeedback } from '@/utils/haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface StreamPosition {
  streamId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  scale: number;
  opacity: number;
}

interface EnhancedMultiStreamExperienceProps {
  maxStreams?: number;
  enableAdvancedGestures?: boolean;
  enableAudioMixing?: boolean;
  enableCustomLayouts?: boolean;
}

export function EnhancedMultiStreamExperience({
  maxStreams = 9,
  enableAdvancedGestures = true,
  enableAudioMixing = true,
  enableCustomLayouts = true,
}: EnhancedMultiStreamExperienceProps) {
  const { activeStreams, removeStream, clearAllStreams } = useStreamManagerContext();
  const insets = useSafeAreaInsets();

  // State management
  const [currentLayout, setCurrentLayout] = useState<LayoutType>('grid_2x2');
  const [streamPositions, setStreamPositions] = useState<Map<string, StreamPosition>>(new Map());
  const [focusedStreamId, setFocusedStreamId] = useState<string | null>(null);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [showLayoutManager, setShowLayoutManager] = useState(false);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [floatingControlsVisible, setFloatingControlsVisible] = useState(false);
  const [floatingControlsPosition, setFloatingControlsPosition] = useState({ x: 0, y: 0 });
  const [selectedStreamForControls, setSelectedStreamForControls] = useState<TwitchStream | null>(null);
  const [customLayouts, setCustomLayouts] = useState<LayoutConfiguration[]>([]);

  // Audio state
  const [audioStreams, setAudioStreams] = useState<Map<string, boolean>>(new Map());
  const [masterMuted, setMasterMuted] = useState(true);

  // Animation values
  const controlsOpacity = useSharedValue(1);
  const contentScale = useSharedValue(1);

  // Initialize audio mixing service
  useEffect(() => {
    if (enableAudioMixing) {
      // Initialize audio streams
      activeStreams.forEach(stream => {
        audioMixingService.addStream(stream.id, stream.user_name);
      });

      // Set up audio event listeners
      const handleAudioEvent = (event: any) => {
        console.log('Audio event:', event);
      };

      audioMixingService.addEventListener('streamStatusChanged', handleAudioEvent);
      audioMixingService.addEventListener('activeStreamChanged', handleAudioEvent);

      return () => {
        audioMixingService.removeEventListener('streamStatusChanged', handleAudioEvent);
        audioMixingService.removeEventListener('activeStreamChanged', handleAudioEvent);
      };
    }
  }, [activeStreams, enableAudioMixing]);

  // Initialize gesture manager
  useEffect(() => {
    if (enableAdvancedGestures) {
      // Register global gesture handlers
      const globalHandlers = {
        onStart: (event: any) => {
          console.log('Global gesture started:', event);
        },
        onActive: (event: any) => {
          console.log('Global gesture active:', event);
        },
        onEnd: (event: any) => {
          console.log('Global gesture ended:', event);
        },
      };

      gestureManager.registerGlobalGestureHandler('tap', globalHandlers);
      gestureManager.registerGlobalGestureHandler('longPress', globalHandlers);

      return () => {
        gestureManager.unregisterGlobalGestureHandler('tap', globalHandlers);
        gestureManager.unregisterGlobalGestureHandler('longPress', globalHandlers);
      };
    }
  }, [enableAdvancedGestures]);

  // Initialize stream positions based on layout
  useEffect(() => {
    if (activeStreams.length === 0) return;

    const newPositions = new Map<string, StreamPosition>();
    const containerWidth = screenWidth - 40;
    const containerHeight = screenHeight - 200;

    activeStreams.forEach((stream, index) => {
      const position = calculateStreamPosition(currentLayout, index, activeStreams.length, containerWidth, containerHeight);
      newPositions.set(stream.id, {
        streamId: stream.id,
        ...position,
        zIndex: index + 1,
        scale: 1,
        opacity: 1,
      });
    });

    setStreamPositions(newPositions);
  }, [activeStreams, currentLayout]);

  const calculateStreamPosition = (
    layout: LayoutType,
    index: number,
    totalStreams: number,
    containerWidth: number,
    containerHeight: number
  ) => {
    // This would contain the same logic as in AdvancedLayoutManager
    // For simplicity, I'll implement a basic 2x2 grid
    const cols = Math.min(2, Math.ceil(Math.sqrt(totalStreams)));
    const rows = Math.ceil(totalStreams / cols);
    
    const cellWidth = (containerWidth - 20) / cols;
    const cellHeight = cellWidth * (9 / 16);
    
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    return {
      x: col * (cellWidth + 10) + 20,
      y: row * (cellHeight + 10) + 20,
      width: cellWidth,
      height: cellHeight,
    };
  };

  // Gesture handlers
  const handleStreamReorder = useCallback((streamId: string, newPosition: { x: number; y: number }) => {
    setStreamPositions(prev => {
      const newMap = new Map(prev);
      const currentPosition = newMap.get(streamId);
      if (currentPosition) {
        newMap.set(streamId, {
          ...currentPosition,
          x: newPosition.x,
          y: newPosition.y,
        });
      }
      return newMap;
    });
  }, []);

  const handleStreamFocus = useCallback((streamId: string) => {
    setFocusedStreamId(streamId);
    if (enableAudioMixing) {
      audioMixingService.setStreamActive(streamId, true);
    }
    HapticFeedback.medium();
  }, [enableAudioMixing]);

  const handleStreamVolumeToggle = useCallback((streamId: string, muted: boolean) => {
    setAudioStreams(prev => new Map(prev.set(streamId, !muted)));
    if (enableAudioMixing) {
      audioMixingService.setStreamMuted(streamId, muted);
    }
    HapticFeedback.light();
  }, [enableAudioMixing]);

  const handleStreamQualityChange = useCallback((streamId: string, quality: string) => {
    if (enableAudioMixing) {
      audioMixingService.setStreamQuality(streamId, quality as any);
    }
  }, [enableAudioMixing]);

  // Layout management
  const handleLayoutChange = useCallback((layout: LayoutType) => {
    setCurrentLayout(layout);
    contentScale.value = withSpring(0.95, {}, () => {
      contentScale.value = withSpring(1);
    });
    HapticFeedback.medium();
  }, []);

  const handleCustomLayoutSave = useCallback((layout: LayoutConfiguration) => {
    setCustomLayouts(prev => [...prev.filter(l => l.id !== layout.id), layout]);
    HapticFeedback.success();
  }, []);

  const handleCustomLayoutDelete = useCallback((layoutId: string) => {
    setCustomLayouts(prev => prev.filter(l => l.id !== layoutId));
    HapticFeedback.warning();
  }, []);

  // Audio controls
  const handleSyncAll = useCallback(() => {
    if (enableAudioMixing) {
      audioMixingService.syncAll();
    }
    HapticFeedback.heavy();
  }, [enableAudioMixing]);

  const handlePauseAll = useCallback(() => {
    if (enableAudioMixing) {
      audioMixingService.pauseAll();
    }
    HapticFeedback.medium();
  }, [enableAudioMixing]);

  const handlePlayAll = useCallback(() => {
    if (enableAudioMixing) {
      audioMixingService.playAll();
    }
    HapticFeedback.medium();
  }, [enableAudioMixing]);

  // Floating controls
  const handleStreamLongPress = useCallback((stream: TwitchStream, position: { x: number; y: number }) => {
    setSelectedStreamForControls(stream);
    setFloatingControlsPosition(position);
    setFloatingControlsVisible(true);
    HapticFeedback.heavy();
  }, []);

  const handleFloatingControlsClose = useCallback(() => {
    setFloatingControlsVisible(false);
    setSelectedStreamForControls(null);
  }, []);

  // Control panel animation
  const handleControlsToggle = useCallback(() => {
    const newVisible = !showAdvancedControls;
    setShowAdvancedControls(newVisible);
    controlsOpacity.value = withTiming(newVisible ? 1 : 0, { duration: 300 });
    HapticFeedback.light();
  }, [showAdvancedControls]);

  // Animated styles
  const controlsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
    transform: [{ translateY: controlsOpacity.value === 0 ? -50 : 0 }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
  }));

  const renderStreamCard = (stream: TwitchStream) => {
    const position = streamPositions.get(stream.id);
    if (!position) return null;

    if (enableAdvancedGestures) {
      return (
        <GestureEnabledStreamCard
          key={stream.id}
          stream={stream}
          onRemove={removeStream}
          onReorder={handleStreamReorder}
          onFocus={handleStreamFocus}
          onVolumeToggle={handleStreamVolumeToggle}
          onQualityChange={handleStreamQualityChange}
          initialPosition={{ x: position.x, y: position.y }}
          initialSize={{ width: position.width, height: position.height }}
          isFloating={currentLayout === 'floating'}
          isFocused={focusedStreamId === stream.id}
          muted={audioStreams.get(stream.id) || masterMuted}
          zIndex={position.zIndex}
          onGestureStart={() => {
            gestureManager.startGesture(`stream_${stream.id}`);
          }}
          onGestureEnd={() => {
            gestureManager.endGesture(`stream_${stream.id}`);
          }}
        />
      );
    }

    // Fallback to basic stream card without advanced gestures
    return (
      <View
        key={stream.id}
        style={[
          styles.basicStreamCard,
          {
            left: position.x,
            top: position.y,
            width: position.width,
            height: position.height,
            zIndex: position.zIndex,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => handleStreamFocus(stream.id)}
          onLongPress={() => handleStreamLongPress(stream, { x: position.x, y: position.y })}
          style={styles.basicStreamCardContent}
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.basicStreamGradient}
          >
            <Text style={styles.basicStreamText} numberOfLines={1}>
              {stream.user_name}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Enhanced Multi-Stream</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowLayoutManager(!showLayoutManager)}
            >
              <LayoutIcon size={20} color="#8B5CF6" />
            </TouchableOpacity>
            
            {enableCustomLayouts && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowCustomBuilder(!showCustomBuilder)}
              >
                <Grid size={20} color="#8B5CF6" />
              </TouchableOpacity>
            )}
            
            {enableAudioMixing && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setMasterMuted(!masterMuted)}
              >
                {masterMuted ? (
                  <VolumeX size={20} color="#EF4444" />
                ) : (
                  <Volume2 size={20} color="#22C55E" />
                )}
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleControlsToggle}
            >
              {showAdvancedControls ? (
                <EyeOff size={20} color="#8B5CF6" />
              ) : (
                <Eye size={20} color="#8B5CF6" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Advanced Layout Manager */}
      {showLayoutManager && (
        <AdvancedLayoutManager
          streams={activeStreams}
          currentLayout={currentLayout}
          onLayoutChange={handleLayoutChange}
          onCustomLayout={handleCustomLayoutSave}
          onStreamReorder={handleStreamReorder}
          customLayouts={customLayouts}
        />
      )}

      {/* Synchronized Playback Controller */}
      {enableAudioMixing && showAdvancedControls && (
        <Animated.View style={controlsAnimatedStyle}>
          <SynchronizedPlaybackController
            streams={activeStreams}
            onStreamAudioToggle={handleStreamVolumeToggle}
            onStreamVolumeChange={(streamId, volume) => {
              if (enableAudioMixing) {
                audioMixingService.setStreamVolume(streamId, volume);
              }
            }}
            onStreamQualityChange={handleStreamQualityChange}
            onSyncAll={handleSyncAll}
            onPauseAll={handlePauseAll}
            onPlayAll={handlePlayAll}
          />
        </Animated.View>
      )}

      {/* Main content area */}
      <Animated.View style={[styles.content, contentAnimatedStyle]}>
        {activeStreams.length === 0 ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.05)']}
              style={styles.emptyStateGradient}
            >
              <Layers size={64} color="#8B5CF6" />
              <Text style={styles.emptyStateTitle}>Enhanced Multi-Stream Experience</Text>
              <Text style={styles.emptyStateSubtitle}>
                Add streams to experience advanced layouts, gesture controls, and synchronized playback
              </Text>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.streamContainer}>
            {activeStreams.map(renderStreamCard)}
          </View>
        )}
      </Animated.View>

      {/* Custom Layout Builder */}
      {enableCustomLayouts && (
        <CustomLayoutBuilder
          streams={activeStreams}
          existingLayouts={customLayouts}
          onSaveLayout={handleCustomLayoutSave}
          onDeleteLayout={handleCustomLayoutDelete}
          onClose={() => setShowCustomBuilder(false)}
          isVisible={showCustomBuilder}
        />
      )}

      {/* Floating Stream Controls */}
      {selectedStreamForControls && (
        <FloatingStreamControls
          stream={selectedStreamForControls}
          isVisible={floatingControlsVisible}
          position={floatingControlsPosition}
          onClose={handleFloatingControlsClose}
          onVolumeToggle={(muted) => handleStreamVolumeToggle(selectedStreamForControls.id, muted)}
          onQualityChange={(quality) => handleStreamQualityChange(selectedStreamForControls.id, quality)}
          onScreenshot={() => {
            Alert.alert('Screenshot', `Screenshot taken of ${selectedStreamForControls.user_name}`);
            handleFloatingControlsClose();
          }}
          onRecord={(recording) => {
            Alert.alert(
              recording ? 'Recording Started' : 'Recording Stopped',
              recording 
                ? `Started recording ${selectedStreamForControls.user_name}` 
                : 'Recording saved'
            );
          }}
          onShare={() => {
            handleFloatingControlsClose();
          }}
          onFavorite={(favorited) => {
            console.log('Favorite toggled:', favorited);
          }}
          onBookmark={(bookmarked) => {
            console.log('Bookmark toggled:', bookmarked);
          }}
          onFullscreen={() => {
            handleStreamFocus(selectedStreamForControls.id);
            handleFloatingControlsClose();
          }}
          onPictureInPicture={() => {
            setCurrentLayout('pip');
            handleStreamFocus(selectedStreamForControls.id);
            handleFloatingControlsClose();
          }}
          onCast={() => {
            Alert.alert('Cast', 'Casting feature coming soon!');
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  streamContainer: {
    flex: 1,
    position: 'relative',
  },
  basicStreamCard: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
  },
  basicStreamCardContent: {
    flex: 1,
  },
  basicStreamGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basicStreamText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateGradient: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    maxWidth: 400,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
});