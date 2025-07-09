import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  PanResponder,
  LayoutAnimation,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { MotiView, MotiText } from 'moti';
import { BlurView } from '@react-native-community/blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Grid,
  RotateCw,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Stream {
  id: string;
  username: string;
  title: string;
  viewerCount: number;
  thumbnailUrl: string;
  embedUrl: string;
  isLive: boolean;
}

interface StreamGridProps {
  streams: Stream[];
  maxStreams?: number;
  onStreamRemove?: (streamId: string) => void;
  onLayoutChange?: (layout: string) => void;
}

type GridLayout = '1x1' | '2x2' | '3x3' | '4x4' | 'pip' | 'mosaic';

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
      player.webViewRef.current.postMessage(JSON.stringify({
        action: 'mute',
        id: id
      }));
    }
  },

  unmuteStream(id: string) {
    const player = this.players.get(id);
    if (player && player.webViewRef.current) {
      player.isMuted = false;
      // Send unmute command to Twitch embed
      player.webViewRef.current.postMessage(JSON.stringify({
        action: 'unmute',
        id: id
      }));
    }
  },
};

const StreamCell: React.FC<{
  stream: Stream;
  width: number;
  height: number;
  isActive: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onRemove: () => void;
}> = ({ stream, width, height, isActive, onPress, onLongPress, onRemove }) => {
  const webViewRef = useRef<WebView>(null);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const player: StreamPlayer = {
      id: stream.id,
      isPlaying,
      isMuted,
      isFullscreen: false,
      webViewRef,
    };
    
    AudioManager.registerPlayer(stream.id, player);
    
    return () => {
      AudioManager.unregisterPlayer(stream.id);
    };
  }, [stream.id, isPlaying, isMuted]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    scale.value = withSpring(0.95, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });
    AudioManager.setActiveStream(stream.id);
    onPress();
  };

  const handleLongPress = () => {
    scale.value = withSpring(1.05, { damping: 12 }, () => {
      scale.value = withSpring(1);
    });
    onLongPress();
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
      webViewRef.current.postMessage(JSON.stringify({
        action: isPlaying ? 'pause' : 'play',
        id: stream.id
      }));
    }
  };

  // Generate Twitch embed HTML with better controls
  const twitchEmbedHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          background: #0e0e10;
          overflow: hidden;
        }
        iframe { 
          width: 100vw; 
          height: 100vh; 
          border: none;
        }
      </style>
    </head>
    <body>
      <iframe
        src="${stream.embedUrl}&muted=true&autoplay=true&time=0s"
        frameborder="0"
        allowfullscreen="true"
        scrolling="no">
      </iframe>
      <script>
        window.addEventListener('message', function(event) {
          const data = JSON.parse(event.data);
          if (data.action === 'mute') {
            // Implement mute logic
          } else if (data.action === 'unmute') {
            // Implement unmute logic
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
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handlePress}
          onLongPress={handleLongPress}
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.streamContainer}>
            <WebView
              ref={webViewRef}
              source={{ html: twitchEmbedHtml }}
              style={StyleSheet.absoluteFill}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              scrollEnabled={false}
              bounces={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
            />
            
            {/* Loading overlay */}
            {isLoading && (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={[StyleSheet.absoluteFill, styles.loadingOverlay]}
              >
                <BlurView
                  style={StyleSheet.absoluteFill}
                  blurType="dark"
                  blurAmount={20}
                />
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
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'transparent']}
              style={styles.infoOverlay}
            >
              <View style={styles.streamInfo}>
                <MotiText
                  style={styles.streamTitle}
                  numberOfLines={1}
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 300 }}
                >
                  {stream.username}
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
                    style={[
                      styles.liveDot,
                      { backgroundColor: stream.isLive ? '#ff4444' : '#666' }
                    ]}
                  />
                  <Text style={styles.liveText}>
                    {stream.isLive ? 'LIVE' : 'OFFLINE'}
                  </Text>
                  <Text style={styles.viewerCount}>
                    {stream.viewerCount.toLocaleString()}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* Control overlay */}
            <View style={styles.controlsOverlay}>
              <BlurView
                style={styles.controlsContainer}
                blurType="dark"
                blurAmount={10}
              >
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={togglePlayPause}
                >
                  {isPlaying ? (
                    <Pause size={16} color="#fff" />
                  ) : (
                    <Play size={16} color="#fff" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX size={16} color="#fff" />
                  ) : (
                    <Volume2 size={16} color="#8B5CF6" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={onRemove}
                >
                  <Text style={styles.removeText}>×</Text>
                </TouchableOpacity>
              </BlurView>
            </View>

            {/* Active stream indicator */}
            {isActive && (
              <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={styles.activeIndicator}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.activeGradient}
                />
              </MotiView>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </MotiView>
  );
};

export const EnhancedMultiStreamGrid: React.FC<StreamGridProps> = ({
  streams,
  maxStreams = 4,
  onStreamRemove,
  onLayoutChange,
}) => {
  const [layout, setLayout] = useState<GridLayout>('2x2');
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const gridScale = useSharedValue(1);

  const getGridDimensions = (layout: GridLayout, streamCount: number) => {
    const padding = 8;
    const gap = 4;
    
    switch (layout) {
      case '1x1':
        return {
          columns: 1,
          rows: 1,
          cellWidth: SCREEN_WIDTH - padding * 2,
          cellHeight: (SCREEN_HEIGHT * 0.7) - padding * 2,
        };
      case '2x2':
        return {
          columns: 2,
          rows: 2,
          cellWidth: (SCREEN_WIDTH - padding * 2 - gap) / 2,
          cellHeight: ((SCREEN_HEIGHT * 0.7) - padding * 2 - gap) / 2,
        };
      case '3x3':
        return {
          columns: 3,
          rows: 3,
          cellWidth: (SCREEN_WIDTH - padding * 2 - gap * 2) / 3,
          cellHeight: ((SCREEN_HEIGHT * 0.7) - padding * 2 - gap * 2) / 3,
        };
      case '4x4':
        return {
          columns: 4,
          rows: 4,
          cellWidth: (SCREEN_WIDTH - padding * 2 - gap * 3) / 4,
          cellHeight: ((SCREEN_HEIGHT * 0.7) - padding * 2 - gap * 3) / 4,
        };
      default:
        return {
          columns: 2,
          rows: 2,
          cellWidth: (SCREEN_WIDTH - padding * 2 - gap) / 2,
          cellHeight: ((SCREEN_HEIGHT * 0.7) - padding * 2 - gap) / 2,
        };
    }
  };

  const { columns, rows, cellWidth, cellHeight } = getGridDimensions(layout, streams.length);

  const handleLayoutChange = (newLayout: GridLayout) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLayout(newLayout);
    onLayoutChange?.(newLayout);
  };

  const animatedGridStyle = useAnimatedStyle(() => ({
    transform: [{ scale: gridScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Layout Controls */}
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
            <Grid size={20} color={layout === '2x2' ? '#8B5CF6' : '#fff'} />
            <Text style={[styles.layoutText, layout === '2x2' && styles.activeLayoutText]}>
              2×2
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.layoutButton, layout === '3x3' && styles.activeLayoutButton]}
            onPress={() => handleLayoutChange('3x3')}
          >
            <Grid size={20} color={layout === '3x3' ? '#8B5CF6' : '#fff'} />
            <Text style={[styles.layoutText, layout === '3x3' && styles.activeLayoutText]}>
              3×3
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.layoutButton, layout === '1x1' && styles.activeLayoutButton]}
            onPress={() => handleLayoutChange('1x1')}
          >
            <Maximize size={20} color={layout === '1x1' ? '#8B5CF6' : '#fff'} />
            <Text style={[styles.layoutText, layout === '1x1' && styles.activeLayoutText]}>
              Full
            </Text>
          </TouchableOpacity>
        </BlurView>
      </MotiView>

      {/* Stream Grid */}
      <Animated.View style={[styles.gridContainer, animatedGridStyle]}>
        {streams.slice(0, maxStreams).map((stream, index) => {
          const row = Math.floor(index / columns);
          const col = index % columns;
          
          return (
            <StreamCell
              key={stream.id}
              stream={stream}
              width={cellWidth}
              height={cellHeight}
              isActive={activeStreamId === stream.id}
              onPress={() => setActiveStreamId(stream.id)}
              onLongPress={() => {
                gridScale.value = withSpring(1.05, { damping: 15 }, () => {
                  gridScale.value = withSpring(1);
                });
              }}
              onRemove={() => onStreamRemove?.(stream.id)}
            />
          );
        })}
      </Animated.View>

      {/* Empty state */}
      {streams.length === 0 && (
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={styles.emptyState}
        >
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
        </MotiView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  layoutControls: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  controlsBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 4,
  },
  streamCell: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
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
});