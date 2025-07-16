import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  ViewStyle,
  TextStyle,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Grid3X3,
  Columns,
  Rows,
  Maximize2,
  PictureInPicture2,
  Move,
  Settings,
  Plus,
  Minus,
  RotateCw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Shuffle,
  ArrowLeft,
  MoreVertical,
  Layers,
  Zap,
  Users,
  Eye,
  TrendingUp,
  Clock,
  Activity,
} from 'lucide-react-native';
import { TwitchStream } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';
import { ModernStreamCard, StreamLayoutMode, StreamQuality } from './ModernStreamCard';
import { LayoutManager, LayoutMode, StreamPosition, LayoutUtils } from './LayoutManager';
import { HapticFeedback } from '@/utils/haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  Extrapolate,
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutUp,
  ZoomIn,
  ZoomOut,
  withRepeat,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StreamState {
  stream: TwitchStream;
  isPlaying: boolean;
  isMuted: boolean;
  isFavorite: boolean;
  quality: StreamQuality;
  position?: { x: number; y: number };
  isSelected: boolean;
}

interface ModernMultiStreamGridProps {
  streams: TwitchStream[];
  onStreamRemove: (streamId: string) => void;
  onStreamAdd?: () => void;
  onStreamToggleFavorite?: (streamId: string) => void;
  isFavorite?: (streamId: string) => boolean;
  onStreamPress?: (stream: TwitchStream) => void;
  maxStreams?: number;
  enableGestures?: boolean;
  showStats?: boolean;
  autoLayout?: boolean;
}

export const ModernMultiStreamGrid: React.FC<ModernMultiStreamGridProps> = ({
  streams = [],
  onStreamRemove,
  onStreamAdd,
  onStreamToggleFavorite,
  isFavorite = () => false,
  onStreamPress,
  maxStreams = 6,
  enableGestures = true,
  showStats = true,
  autoLayout = true,
}) => {
  // State management
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid-2x2');
  const [streamStates, setStreamStates] = useState<{ [key: string]: StreamState }>({});
  const [showControls, setShowControls] = useState(true);
  const [showLayoutSelector, setShowLayoutSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [globalMuted, setGlobalMuted] = useState(false);
  const [globalPlaying, setGlobalPlaying] = useState(true);
  const [selectedStreams, setSelectedStreams] = useState<string[]>([]);
  const [customPositions, setCustomPositions] = useState<StreamPosition[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Animation values
  const controlsOpacity = useSharedValue(1);
  const headerOffset = useSharedValue(0);
  const fabScale = useSharedValue(1);
  const statsOpacity = useSharedValue(showStats ? 1 : 0);
  const layoutTransition = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  
  // Auto-hide controls
  const controlsTimeout = useRef<NodeJS.Timeout>();
  
  // Initialize stream states
  useEffect(() => {
    const newStates: { [key: string]: StreamState } = {};
    streams.forEach(stream => {
      if (!streamStates[stream.id]) {
        newStates[stream.id] = {
          stream,
          isPlaying: true,
          isMuted: false,
          isFavorite: isFavorite(stream.id),
          quality: 'auto',
          isSelected: false,
        };
      } else {
        newStates[stream.id] = {
          ...streamStates[stream.id],
          stream,
          isFavorite: isFavorite(stream.id),
        };
      }
    });
    setStreamStates(newStates);
  }, [streams, isFavorite]);
  
  // Auto-layout based on stream count
  useEffect(() => {
    if (autoLayout && streams.length > 0) {
      const optimalLayout = LayoutUtils.calculateOptimalLayout(
        streams.length,
        SCREEN_WIDTH,
        SCREEN_HEIGHT
      );
      setLayoutMode(optimalLayout);
    }
  }, [streams.length, autoLayout]);
  
  // Pulse animation for active streams
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1
    );
  }, []);
  
  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    
    controlsOpacity.value = withTiming(1, { duration: 300 });
    
    controlsTimeout.current = setTimeout(() => {
      if (!showLayoutSelector && !showSettings) {
        controlsOpacity.value = withTiming(0, { duration: 300 });
      }
    }, 4000);
  }, [showLayoutSelector, showSettings]);
  
  // Show controls on interaction
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    resetControlsTimeout();
  }, [resetControlsTimeout]);
  
  useEffect(() => {
    showControlsTemporarily();
  }, []);
  
  // Handle layout change
  const handleLayoutChange = useCallback((mode: LayoutMode) => {
    HapticFeedback.medium();
    layoutTransition.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setLayoutMode)(mode);
      layoutTransition.value = withTiming(1, { duration: 300 });
    });
    setShowLayoutSelector(false);
    showControlsTemporarily();
  }, [showControlsTemporarily]);
  
  // Handle stream actions
  const handleStreamPlay = useCallback((streamId: string) => {
    setStreamStates(prev => ({
      ...prev,
      [streamId]: { ...prev[streamId], isPlaying: !prev[streamId].isPlaying }
    }));
    HapticFeedback.light();
  }, []);
  
  const handleStreamMute = useCallback((streamId: string) => {
    setStreamStates(prev => ({
      ...prev,
      [streamId]: { ...prev[streamId], isMuted: !prev[streamId].isMuted }
    }));
    HapticFeedback.light();
  }, []);
  
  const handleStreamFavorite = useCallback((streamId: string) => {
    onStreamToggleFavorite?.(streamId);
    HapticFeedback.medium();
  }, [onStreamToggleFavorite]);
  
  const handleStreamRemove = useCallback((streamId: string) => {
    HapticFeedback.medium();
    Alert.alert(
      'Remove Stream',
      'Are you sure you want to remove this stream?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => onStreamRemove(streamId)
        }
      ]
    );
  }, [onStreamRemove]);
  
  const handleStreamQualityChange = useCallback((streamId: string, quality: StreamQuality) => {
    setStreamStates(prev => ({
      ...prev,
      [streamId]: { ...prev[streamId], quality }
    }));
    HapticFeedback.light();
  }, []);
  
  // Global controls
  const handleGlobalMute = useCallback(() => {
    const newMuted = !globalMuted;
    setGlobalMuted(newMuted);
    
    setStreamStates(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(id => {
        updated[id] = { ...updated[id], isMuted: newMuted };
      });
      return updated;
    });
    
    HapticFeedback.medium();
  }, [globalMuted]);
  
  const handleGlobalPlay = useCallback(() => {
    const newPlaying = !globalPlaying;
    setGlobalPlaying(newPlaying);
    
    setStreamStates(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(id => {
        updated[id] = { ...updated[id], isPlaying: newPlaying };
      });
      return updated;
    });
    
    HapticFeedback.medium();
  }, [globalPlaying]);
  
  const handleAddStream = useCallback(() => {
    if (streams.length >= maxStreams) {
      Alert.alert(
        'Maximum Streams Reached',
        `You can only have up to ${maxStreams} streams at once.`
      );
      return;
    }
    
    fabScale.value = withSpring(0.9, { damping: 15 }, () => {
      fabScale.value = withSpring(1);
    });
    
    onStreamAdd?.();
    HapticFeedback.medium();
  }, [streams.length, maxStreams, onStreamAdd]);
  
  // Calculate stream statistics
  const streamStats = React.useMemo(() => {
    const totalViewers = streams.reduce((sum, stream) => sum + (stream.viewer_count || 0), 0);
    const averageViewers = streams.length > 0 ? Math.floor(totalViewers / streams.length) : 0;
    const activeStreams = Object.values(streamStates).filter(state => state.isPlaying).length;
    const mutedStreams = Object.values(streamStates).filter(state => state.isMuted).length;
    
    return {
      totalViewers,
      averageViewers,
      activeStreams,
      mutedStreams,
      totalStreams: streams.length,
    };
  }, [streams, streamStates]);
  
  // Available layouts for current stream count
  const availableLayouts = LayoutUtils.getAvailableLayouts(streams.length);
  
  // Animated styles
  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
    transform: [{
      translateY: interpolate(
        controlsOpacity.value,
        [0, 1],
        [-50, 0],
        Extrapolate.CLAMP
      )
    }]
  }));
  
  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerOffset.value }]
  }));
  
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }]
  }));
  
  const statsStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [{
      translateY: interpolate(
        statsOpacity.value,
        [0, 1],
        [20, 0],
        Extrapolate.CLAMP
      )
    }]
  }));
  
  const layoutTransitionStyle = useAnimatedStyle(() => ({
    opacity: layoutTransition.value,
    transform: [{
      scale: interpolate(
        layoutTransition.value,
        [0, 1],
        [0.95, 1],
        Extrapolate.CLAMP
      )
    }]
  }));
  
  // Render layout selector
  const renderLayoutSelector = () => (
    <Animated.View 
      entering={SlideInDown.delay(100)}
      exiting={SlideOutUp}
      style={styles.layoutSelector}
    >
      <BlurView intensity={95} style={styles.selectorBlur}>
        <View style={styles.selectorHeader}>
          <Text style={styles.selectorTitle}>Layout Options</Text>
          <TouchableOpacity
            style={styles.selectorClose}
            onPress={() => setShowLayoutSelector(false)}
          >
            <Text style={styles.selectorCloseText}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.layoutOptions}>
          {availableLayouts.map(mode => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.layoutOption,
                layoutMode === mode && styles.layoutOptionActive
              ]}
              onPress={() => handleLayoutChange(mode)}
            >
              <View style={styles.layoutIcon}>
                {getLayoutIcon(mode)}
              </View>
              <Text style={[
                styles.layoutOptionText,
                layoutMode === mode && styles.layoutOptionTextActive
              ]}>
                {LayoutUtils.getLayoutName(mode)}
              </Text>
              {layoutMode === mode && (
                <View style={styles.activeIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BlurView>
    </Animated.View>
  );
  
  // Get layout icon component
  const getLayoutIcon = (mode: LayoutMode) => {
    const iconSize = 20;
    const iconColor = layoutMode === mode ? ModernTheme.colors.accent[500] : ModernTheme.colors.text.secondary;
    
    switch (mode) {
      case 'grid-2x2':
        return <Grid3X3 size={iconSize} color={iconColor} />;
      case 'grid-3x1':
        return <Columns size={iconSize} color={iconColor} />;
      case 'grid-4x1':
        return <Columns size={iconSize} color={iconColor} />;
      case 'grid-1x4':
        return <Rows size={iconSize} color={iconColor} />;
      case 'pip':
        return <PictureInPicture2 size={iconSize} color={iconColor} />;
      case 'fullscreen':
        return <Maximize2 size={iconSize} color={iconColor} />;
      case 'custom':
        return <Move size={iconSize} color={iconColor} />;
      default:
        return <Grid3X3 size={iconSize} color={iconColor} />;
    }
  };
  
  // Render stream cards
  const renderStreamCards = () => {
    return streams.map((stream, index) => {
      const streamState = streamStates[stream.id];
      if (!streamState) return null;
      
      return (
        <ModernStreamCard
          key={stream.id}
          stream={stream}
          width={200} // Will be overridden by LayoutManager
          height={150} // Will be overridden by LayoutManager
          layoutMode={layoutMode === 'fullscreen' && index === 0 ? 'fullscreen' : 
                     layoutMode === 'pip' && index > 0 ? 'pip' : 'grid'}
          isPlaying={streamState.isPlaying}
          isMuted={streamState.isMuted}
          isFavorite={streamState.isFavorite}
          isSelected={selectedStreams.includes(stream.id)}
          showControls={showControls}
          quality={streamState.quality}
          onPress={() => onStreamPress?.(stream)}
          onRemove={() => handleStreamRemove(stream.id)}
          onTogglePlay={() => handleStreamPlay(stream.id)}
          onToggleMute={() => handleStreamMute(stream.id)}
          onToggleFavorite={() => handleStreamFavorite(stream.id)}
          onQualityChange={(quality) => handleStreamQualityChange(stream.id, quality)}
          onLayoutChange={handleLayoutChange}
          position={streamState.position}
          isDraggable={enableGestures && layoutMode === 'custom'}
          isResizable={enableGestures && layoutMode === 'custom'}
          zIndex={index + 1}
        />
      );
    });
  };
  
  // Render stats panel
  const renderStatsPanel = () => (
    <Animated.View style={[styles.statsPanel, statsStyle]}>
      <View style={styles.statRow}>
        <View style={styles.statItem}>
          <Users size={14} color={ModernTheme.colors.text.secondary} />
          <Text style={styles.statText}>
            {streamStats.totalViewers.toLocaleString()} viewers
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Activity size={14} color={ModernTheme.colors.success[500]} />
          <Text style={styles.statText}>
            {streamStats.activeStreams}/{streamStats.totalStreams} active
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Eye size={14} color={ModernTheme.colors.text.secondary} />
          <Text style={styles.statText}>
            {streamStats.averageViewers.toLocaleString()} avg
          </Text>
        </View>
      </View>
    </Animated.View>
  );
  
  if (streams.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={ModernTheme.colors.gradients.background}
          style={styles.emptyContainer}
        >
          <Animated.View entering={FadeIn.delay(300)} style={styles.emptyContent}>
            <View style={styles.emptyIcon}>
              <Layers size={64} color={ModernTheme.colors.text.secondary} />
            </View>
            <Text style={styles.emptyTitle}>No Active Streams</Text>
            <Text style={styles.emptySubtitle}>
              Add streams from the Discover tab to start your multi-stream experience
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={onStreamAdd}
            >
              <Plus size={20} color="#000" />
              <Text style={styles.emptyButtonText}>Add Your First Stream</Text>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={ModernTheme.colors.gradients.background}
        style={styles.gradient}
      >
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle, controlsStyle]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Multi-Stream</Text>
              <Text style={styles.headerSubtitle}>
                {streams.length} stream{streams.length !== 1 ? 's' : ''} • {LayoutUtils.getLayoutName(layoutMode)}
              </Text>
            </View>
            
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowLayoutSelector(true)}
              >
                {getLayoutIcon(layoutMode)}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowSettings(true)}
              >
                <Settings size={20} color={ModernTheme.colors.text.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
        
        {/* Stats Panel */}
        {showStats && renderStatsPanel()}
        
        {/* Main Content */}
        <Animated.View style={[styles.content, layoutTransitionStyle]}>
          <LayoutManager
            layoutMode={layoutMode}
            customPositions={customPositions}
            onLayoutChange={handleLayoutChange}
            onPositionChange={setCustomPositions}
            enableGestures={enableGestures}
            snapToGrid={layoutMode === 'custom'}
          >
            {renderStreamCards()}
          </LayoutManager>
        </Animated.View>
        
        {/* Global Controls */}
        <Animated.View style={[styles.globalControls, controlsStyle]}>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.globalControlButton, globalMuted && styles.globalControlButtonActive]}
              onPress={handleGlobalMute}
            >
              {globalMuted ? (
                <VolumeX size={20} color={ModernTheme.colors.text.primary} />
              ) : (
                <Volume2 size={20} color={ModernTheme.colors.text.primary} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.globalControlButton, !globalPlaying && styles.globalControlButtonActive]}
              onPress={handleGlobalPlay}
            >
              {globalPlaying ? (
                <Pause size={20} color={ModernTheme.colors.text.primary} />
              ) : (
                <Play size={20} color={ModernTheme.colors.text.primary} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.globalControlButton}
              onPress={() => statsOpacity.value = withTiming(showStats ? 0 : 1)}
            >
              <Activity size={20} color={ModernTheme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {/* Floating Action Button */}
        <Animated.View style={[styles.fab, fabStyle]}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={handleAddStream}
          >
            <LinearGradient
              colors={ModernTheme.colors.gradients.accent}
              style={styles.fabGradient}
            >
              <Plus size={24} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Layout Selector */}
        {showLayoutSelector && renderLayoutSelector()}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernTheme.colors.background.primary,
  } as ViewStyle,
  gradient: {
    flex: 1,
  } as ViewStyle,
  header: {
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  } as ViewStyle,
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  headerLeft: {
    flex: 1,
  } as ViewStyle,
  headerTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes['2xl'],
    fontWeight: ModernTheme.typography.weights.bold,
  } as TextStyle,
  headerSubtitle: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
    marginTop: 2,
  } as TextStyle,
  headerRight: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  } as ViewStyle,
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.sm,
  } as ViewStyle,
  statsPanel: {
    marginHorizontal: ModernTheme.spacing.md,
    marginBottom: ModernTheme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.sm,
  } as ViewStyle,
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  } as ViewStyle,
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.xs,
  } as ViewStyle,
  statText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.xs,
    fontWeight: ModernTheme.typography.weights.medium,
  } as TextStyle,
  content: {
    flex: 1,
  } as ViewStyle,
  globalControls: {
    position: 'absolute',
    bottom: ModernTheme.spacing.xl,
    left: ModernTheme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: ModernTheme.borderRadius.xl,
    padding: ModernTheme.spacing.sm,
  } as ViewStyle,
  controlsRow: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  } as ViewStyle,
  globalControlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.sm,
  } as ViewStyle,
  globalControlButtonActive: {
    backgroundColor: ModernTheme.colors.accent[500],
  } as ViewStyle,
  fab: {
    position: 'absolute',
    bottom: ModernTheme.spacing.xl,
    right: ModernTheme.spacing.md,
  } as ViewStyle,
  fabButton: {
    borderRadius: 28,
    ...ModernTheme.shadows.lg,
  } as ViewStyle,
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  layoutSelector: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.6,
  } as ViewStyle,
  selectorBlur: {
    padding: ModernTheme.spacing.lg,
  } as ViewStyle,
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ModernTheme.spacing.lg,
  } as ViewStyle,
  selectorTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.xl,
    fontWeight: ModernTheme.typography.weights.semibold,
  } as TextStyle,
  selectorClose: {
    backgroundColor: ModernTheme.colors.accent[500],
    borderRadius: ModernTheme.borderRadius.md,
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
  } as ViewStyle,
  selectorCloseText: {
    color: '#ffffff',
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
  } as TextStyle,
  layoutOptions: {
    gap: ModernTheme.spacing.sm,
  } as ViewStyle,
  layoutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,
  layoutOptionActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: ModernTheme.colors.accent[500],
  } as ViewStyle,
  layoutIcon: {
    marginRight: ModernTheme.spacing.md,
  } as ViewStyle,
  layoutOptionText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.medium,
    flex: 1,
  } as TextStyle,
  layoutOptionTextActive: {
    color: ModernTheme.colors.accent[500],
    fontWeight: ModernTheme.typography.weights.semibold,
  } as TextStyle,
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ModernTheme.colors.accent[500],
  } as ViewStyle,
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ModernTheme.spacing.xl,
  } as ViewStyle,
  emptyContent: {
    alignItems: 'center',
    gap: ModernTheme.spacing.lg,
  } as ViewStyle,
  emptyIcon: {
    padding: ModernTheme.spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: ModernTheme.borderRadius.xl,
  } as ViewStyle,
  emptyTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes['2xl'],
    fontWeight: ModernTheme.typography.weights.bold,
    textAlign: 'center',
  } as TextStyle,
  emptySubtitle: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.md,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  } as TextStyle,
  emptyButton: {
    backgroundColor: ModernTheme.colors.accent[500],
    borderRadius: ModernTheme.borderRadius.md,
    paddingHorizontal: ModernTheme.spacing.xl,
    paddingVertical: ModernTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.sm,
    marginTop: ModernTheme.spacing.md,
  } as ViewStyle,
  emptyButtonText: {
    color: '#ffffff',
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.semibold,
  } as TextStyle,
});

export default ModernMultiStreamGrid;