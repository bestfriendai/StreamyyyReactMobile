import { LinearGradient } from 'expo-linear-gradient';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Grid,
  RotateCw,
  Settings,
  Eye,
  Maximize2,
  Minimize2,
  Move,
  Zap,
  Target,
  Sparkles,
} from 'lucide-react-native';
import { MotiView, MotiText } from 'moti';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  PanResponder,
  Animated as RNAnimated,
} from 'react-native';
import { PanGestureHandler, PinchGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  withSequence,
  withDelay,
  useAnimatedGestureHandler,
  interpolateColor,
} from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import { useStreamManager } from '@/hooks/useStreamManager';
import { TwitchStream } from '@/services/twitchApi';
import { BlurViewFallback as BlurView } from './BlurViewFallback';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StreamGridProps {
  maxStreams?: number;
  onLayoutChange?: (layout: string) => void;
}

type GridLayout = '1x1' | '2x2' | '3x3' | '4x4' | 'pip' | 'mosaic' | 'focus';

interface StreamCellAnimation {
  scale: Animated.SharedValue<number>;
  opacity: Animated.SharedValue<number>;
  translateX: Animated.SharedValue<number>;
  translateY: Animated.SharedValue<number>;
  rotation: Animated.SharedValue<number>;
}

interface StreamPlayer {
  id: string;
  isPlaying: boolean;
  isMuted: boolean;
  isFullscreen: boolean;
  webViewRef: React.RefObject<WebView>;
}

const AudioManager = {
  activeStreamId: null as string | null,
  players: new Map<string, StreamPlayer>(),

  registerPlayer(id: string, player: StreamPlayer) {
    this.players.set(id, player);
  },

  unregisterPlayer(id: string) {
    this.players.delete(id);
    if (this.activeStreamId === id) {
      this.activeStreamId = null;
    }
  },

  setActiveStream(id: string) {
    // Mute all other streams
    this.players.forEach((player, playerId) => {
      if (playerId !== id && !player.isMuted) {
        this.muteStream(playerId);
      }
    });

    // Unmute the active stream
    this.unmuteStream(id);
    this.activeStreamId = id;
  },

  muteStream(id: string) {
    const player = this.players.get(id);
    if (player && player.webViewRef.current) {
      player.isMuted = true;
      // Send mute command to Twitch embed
      player.webViewRef.current.postMessage(
        JSON.stringify({
          action: 'mute',
          id,
        })
      );
    }
  },

  unmuteStream(id: string) {
    const player = this.players.get(id);
    if (player && player.webViewRef.current) {
      player.isMuted = false;
      // Send unmute command to Twitch embed
      player.webViewRef.current.postMessage(
        JSON.stringify({
          action: 'unmute',
          id,
        })
      );
    }
  },
};

const StreamCell: React.FC<{
  stream: TwitchStream;
  width: number;
  height: number;
  isActive: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onRemove: () => void;
  index: number;
  totalStreams: number;
}> = ({ stream, width, height, isActive, onPress, onLongPress, onRemove, index, totalStreams }) => {
  const webViewRef = useRef<WebView>(null);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const borderGlow = useSharedValue(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);

  // Enhanced animation entrance
  const entranceDelay = index * 150;
  const entranceScale = useSharedValue(0.3);
  const entranceOpacity = useSharedValue(0);
  const entranceRotation = useSharedValue(-180);

  useEffect(() => {
    const player: StreamPlayer = {
      id: stream.id,
      isPlaying,
      isMuted,
      isFullscreen: false,
      webViewRef,
    };

    AudioManager.registerPlayer(stream.id, player);

    // Enhanced entrance animation
    entranceScale.value = withDelay(entranceDelay, withSpring(1, { damping: 20, stiffness: 300 }));
    entranceOpacity.value = withDelay(entranceDelay, withTiming(1, { duration: 800 }));
    entranceRotation.value = withDelay(
      entranceDelay,
      withSpring(0, { damping: 15, stiffness: 200 })
    );

    return () => {
      AudioManager.unregisterPlayer(stream.id);
    };
  }, [stream.id, isPlaying, isMuted, entranceDelay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * entranceScale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value + entranceRotation.value}deg` },
    ],
    opacity: opacity.value * entranceOpacity.value,
  }));

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderWidth: interpolate(borderGlow.value, [0, 1], [1, 3]),
    borderColor: interpolateColor(
      borderGlow.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.1)', 'rgba(139, 92, 246, 0.8)']
    ),
    shadowOpacity: interpolate(borderGlow.value, [0, 1], [0.2, 0.8]),
    shadowRadius: interpolate(borderGlow.value, [0, 1], [4, 20]),
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.92, { damping: 20 }),
      withSpring(1.02, { damping: 15 }),
      withSpring(1, { damping: 20 })
    );

    // Enhanced visual feedback
    borderGlow.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 800 })
    );

    AudioManager.setActiveStream(stream.id);
    onPress();
  };

  const handleLongPress = () => {
    scale.value = withSpring(1.08, { damping: 12 });
    rotation.value = withSequence(
      withSpring(-2, { damping: 20 }),
      withSpring(2, { damping: 20 }),
      withSpring(0, { damping: 20 })
    );

    // Show controls on long press
    setShowControls(true);
    setTimeout(() => setShowControls(false), 3000);

    onLongPress();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20 });
    rotation.value = withSpring(0, { damping: 20 });
  };

  const toggleMute = () => {
    if (isMuted) {
      AudioManager.setActiveStream(stream.id);
      setIsMuted(false);
    } else {
      AudioManager.muteStream(stream.id);
      setIsMuted(true);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          action: isPlaying ? 'pause' : 'play',
          id: stream.id,
        })
      );
    }
  };

  // Generate Twitch embed HTML with constrained dimensions - THIS FIXES THE FULLSCREEN ISSUE
  const embedUrl = `https://player.twitch.tv/?channel=${stream.user_name}&parent=localhost&muted=true&autoplay=true`;

  const twitchEmbedHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          background: #0e0e10;
          overflow: hidden;
          width: 100%;
          height: 100%;
        }
        iframe { 
          width: 100% !important; 
          height: 100% !important; 
          border: none !important;
          display: block !important;
        }
        .container {
          width: 100%;
          height: 100%;
          position: relative;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <iframe
          src="${embedUrl}"
          frameborder="0"
          allowfullscreen="false"
          scrolling="no"
          allow="autoplay; encrypted-media">
        </iframe>
      </div>
      <script>
        // Disable fullscreen attempts
        document['addEventListener']('fullscreenchange', function() {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
        });
        
        window['addEventListener']('message', function(event) {
          try {
            const data = JSON.parse(event.data);
            if (data.action === 'mute' || data.action === 'unmute') {
              // Audio control handled by parent
            }
          } catch (e) {
            // Ignore parsing errors
          }
        });
      </script>
    </body>
    </html>
  `;

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        damping: 15,
        stiffness: 150,
      }}
      style={[styles.streamCell, { width, height }]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle, animatedBorderStyle]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handlePress}
          onLongPress={handleLongPress}
          onPressOut={handlePressOut}
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.streamContainer}>
            <WebView
              ref={webViewRef}
              source={{ html: twitchEmbedHtml }}
              style={StyleSheet.absoluteFill}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              scrollEnabled={false}
              bounces={false}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
            />

            {/* Loading overlay */}
            {isLoading && (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={[StyleSheet.absoluteFill, styles.loadingOverlay]}
              >
                <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={20} />
                <MotiView
                  from={{ rotate: '0deg' }}
                  animate={{ rotate: '360deg' }}
                  transition={{
                    type: 'timing',
                    duration: 1000,
                    loop: true,
                  }}
                >
                  <RotateCw size={24} color="#8B5CF6" />
                </MotiView>
              </MotiView>
            )}

            {/* Stream info overlay */}
            <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={styles.infoOverlay}>
              <View style={styles.streamInfo}>
                <MotiText
                  style={styles.streamTitle}
                  numberOfLines={1}
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 300 }}
                >
                  {stream.user_name}
                </MotiText>
                <View style={styles.liveIndicator}>
                  <MotiView
                    from={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      damping: 12,
                      loop: true,
                      repeatReverse: true,
                    }}
                    style={[styles.liveDot, { backgroundColor: '#ff4444' }]}
                  />
                  <Text style={styles.liveText}>LIVE</Text>
                  <Text style={styles.viewerCount}>
                    {stream.viewer_count?.toLocaleString() || '0'}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* Control overlay */}
            <View style={styles.controlsOverlay}>
              <BlurView style={styles.controlsContainer} blurType="dark" blurAmount={10}>
                <TouchableOpacity style={styles.controlButton} onPress={togglePlayPause}>
                  {isPlaying ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" />}
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
                  {isMuted ? (
                    <VolumeX size={16} color="#fff" />
                  ) : (
                    <Volume2 size={16} color="#8B5CF6" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={onRemove}>
                  <Text style={styles.removeText}>×</Text>
                </TouchableOpacity>
              </BlurView>
            </View>

            {/* Enhanced active stream indicator */}
            {isActive && (
              <MotiView
                from={{ opacity: 0, scale: 0.5, rotate: '-180deg' }}
                animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
                transition={{
                  type: 'spring',
                  damping: 15,
                  stiffness: 200,
                }}
                style={styles.activeIndicator}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED', '#A855F7']}
                  style={styles.activeGradient}
                >
                  <MotiView
                    from={{ scale: 0.8 }}
                    animate={{ scale: 1.2 }}
                    transition={{
                      type: 'timing',
                      duration: 1000,
                      loop: true,
                      repeatReverse: true,
                    }}
                  >
                    <Zap size={16} color="#fff" fill="#fff" />
                  </MotiView>
                </LinearGradient>
              </MotiView>
            )}

            {/* Stream quality indicator */}
            <View style={styles.qualityIndicator}>
              <BlurView blurType="dark" blurAmount={10} style={styles.qualityBlur}>
                <Target size={10} color="#10B981" />
                <Text style={styles.qualityText}>HD</Text>
              </BlurView>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </MotiView>
  );
};

export const EnhancedMultiStreamGrid: React.FC<StreamGridProps> = ({
  maxStreams = 4,
  onLayoutChange,
}) => {
  const { activeStreams, removeStream, clearAllStreams } = useStreamManager();
  const [layout, setLayout] = useState<GridLayout>('2x2');
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const gridScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (activeStreams.length > 0) {
      pulseScale.value = withSpring(1.02, { damping: 15 }, () => {
        pulseScale.value = withSpring(1);
      });
    }
  }, [activeStreams.length]);

  const getGridDimensions = (layout: GridLayout, streamCount: number) => {
    const padding = 16;
    const gap = 8;
    // Reserve space for header (~120px) and bottom tab bar (~100px) and safe areas
    const availableHeight = SCREEN_HEIGHT - 200;
    const availableWidth = SCREEN_WIDTH - padding * 2;

    switch (layout) {
      case '1x1':
        return {
          columns: 1,
          rows: 1,
          cellWidth: availableWidth,
          cellHeight: Math.min(availableHeight, (availableWidth * 9) / 16), // 16:9 aspect ratio
        };
      case '2x2':
        const width2x2 = (availableWidth - gap) / 2;
        return {
          columns: 2,
          rows: 2,
          cellWidth: width2x2,
          cellHeight: Math.min((availableHeight - gap) / 2, (width2x2 * 9) / 16),
        };
      case '3x3':
        const width3x3 = (availableWidth - gap * 2) / 3;
        return {
          columns: 3,
          rows: 3,
          cellWidth: width3x3,
          cellHeight: Math.min((availableHeight - gap * 2) / 3, (width3x3 * 9) / 16),
        };
      case '4x4':
        const width4x4 = (availableWidth - gap * 3) / 4;
        return {
          columns: 4,
          rows: 4,
          cellWidth: width4x4,
          cellHeight: Math.min((availableHeight - gap * 3) / 4, (width4x4 * 9) / 16),
        };
      default:
        const widthDefault = (availableWidth - gap) / 2;
        return {
          columns: 2,
          rows: 2,
          cellWidth: widthDefault,
          cellHeight: Math.min((availableHeight - gap) / 2, (widthDefault * 9) / 16),
        };
    }
  };

  const { columns, rows, cellWidth, cellHeight } = getGridDimensions(layout, activeStreams.length);

  const handleLayoutChange = (newLayout: GridLayout) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLayout(newLayout);
    onLayoutChange?.(newLayout);
  };

  const animatedGridStyle = useAnimatedStyle(() => ({
    transform: [{ scale: gridScale.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header */}
      <MotiView
        from={{ opacity: 0, translateY: -30 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={styles.header}
      >
        <BlurView style={styles.headerBlur} blurType="dark" blurAmount={20}>
          <LinearGradient
            colors={[
              'rgba(139, 92, 246, 0.2)',
              'rgba(124, 58, 237, 0.15)',
              'rgba(99, 102, 241, 0.1)',
              'transparent',
            ]}
            style={styles.headerGradient}
          >
            <View style={styles.titleRow}>
              <View style={styles.titleContainer}>
                <LinearGradient
                  colors={['#8B5CF6', '#A855F7', '#7C3AED']}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MotiView
                    from={{ scale: 0.8, rotate: '-45deg' }}
                    animate={{ scale: 1, rotate: '0deg' }}
                    transition={{
                      type: 'spring',
                      damping: 15,
                      delay: 200,
                    }}
                  >
                    <Sparkles size={16} color="#fff" />
                  </MotiView>
                </LinearGradient>
                <View>
                  <MotiText style={styles.title}>Multi-View</MotiText>
                  <View style={styles.subtitleContainer}>
                    <Animated.View style={animatedPulseStyle}>
                      <Eye size={14} color="#8B5CF6" />
                    </Animated.View>
                    <Text style={styles.subtitle}>
                      {activeStreams.length} active stream{activeStreams.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => setShowControls(!showControls)}
              >
                <BlurView style={styles.settingsBlur} blurType="dark" blurAmount={10}>
                  <Settings size={18} color="#8B5CF6" />
                </BlurView>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </BlurView>
      </MotiView>

      {showControls && (
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.layoutControls}
        >
          <BlurView style={styles.controlsBlur} blurType="dark" blurAmount={20}>
            <TouchableOpacity
              style={[styles.layoutButton, layout === '2x2' && styles.activeLayoutButton]}
              onPress={() => handleLayoutChange('2x2')}
            >
              <Grid size={18} color={layout === '2x2' ? '#8B5CF6' : '#fff'} />
              <Text style={[styles.layoutText, layout === '2x2' && styles.activeLayoutText]}>
                2×2
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.layoutButton, layout === '3x3' && styles.activeLayoutButton]}
              onPress={() => handleLayoutChange('3x3')}
            >
              <Grid size={18} color={layout === '3x3' ? '#8B5CF6' : '#fff'} />
              <Text style={[styles.layoutText, layout === '3x3' && styles.activeLayoutText]}>
                3×3
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.layoutButton, layout === '1x1' && styles.activeLayoutButton]}
              onPress={() => handleLayoutChange('1x1')}
            >
              <Maximize size={18} color={layout === '1x1' ? '#8B5CF6' : '#fff'} />
              <Text style={[styles.layoutText, layout === '1x1' && styles.activeLayoutText]}>
                Full
              </Text>
            </TouchableOpacity>

            {activeStreams.length > 0 && (
              <TouchableOpacity style={styles.clearAllButton} onPress={clearAllStreams}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </BlurView>
        </MotiView>
      )}

      {/* Stream Grid */}
      <Animated.View style={[styles.gridContainer, animatedGridStyle]}>
        {activeStreams.slice(0, maxStreams).map((stream, index) => {
          const row = Math.floor(index / columns);
          const col = index % columns;
          const marginRight = col < columns - 1 ? 8 : 0;
          const marginBottom = row < Math.ceil(activeStreams.length / columns) - 1 ? 8 : 0;

          return (
            <View
              key={stream.id}
              style={[
                styles.streamCellWrapper,
                {
                  width: cellWidth,
                  height: cellHeight,
                  marginRight,
                  marginBottom,
                },
              ]}
            >
              <StreamCell
                stream={stream}
                width={cellWidth}
                height={cellHeight}
                isActive={activeStreamId === stream.id}
                index={index}
                totalStreams={activeStreams.length}
                onPress={() => setActiveStreamId(stream.id)}
                onLongPress={() => {
                  gridScale.value = withSpring(1.05, { damping: 15 }, () => {
                    gridScale.value = withSpring(1);
                  });
                }}
                onRemove={() => removeStream(stream.id)}
              />
            </View>
          );
        })}
      </Animated.View>

      {/* Empty state */}
      {activeStreams.length === 0 && (
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={styles.emptyState}
        >
          <BlurView style={styles.emptyBlur} blurType="dark" blurAmount={10}>
            <Grid size={64} color="#666" />
            <MotiText
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200 }}
              style={styles.emptyTitle}
            >
              No Streams Added
            </MotiText>
            <MotiText
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 400 }}
              style={styles.emptySubtitle}
            >
              Add streams from the discover tab to start watching
            </MotiText>
          </BlurView>
        </MotiView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: Platform.OS === 'ios' ? 0 : 8,
  },
  headerBlur: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subtitle: {
    color: '#999',
    fontSize: 14,
  },
  settingsButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingsBlur: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layoutControls: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  controlsBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  layoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  activeLayoutButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  layoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  activeLayoutText: {
    color: '#8B5CF6',
  },
  clearAllButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 12,
  },
  clearAllText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '600',
  },
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
  },
  streamCellWrapper: {
    // Empty style - dimensions handled inline
  },
  streamCell: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  streamContainer: {
    flex: 1,
    position: 'relative',
  },
  loadingOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  infoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  streamInfo: {
    gap: 4,
  },
  streamTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  viewerCount: {
    color: '#999',
    fontSize: 10,
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  controlsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  controlButton: {
    padding: 6,
    marginHorizontal: 2,
    borderRadius: 6,
  },
  removeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  activeGradient: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyBlur: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  qualityIndicator: {
    position: 'absolute',
    top: 12,
    right: 60,
    borderRadius: 6,
    overflow: 'hidden',
  },
  qualityBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 3,
  },
  qualityText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '700',
  },
});
