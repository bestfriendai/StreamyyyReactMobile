import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { MotiView, MotiText } from 'moti';
import { BlurViewFallback as BlurView } from './BlurViewFallback';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Grid,
  Monitor,
  Maximize,
  MoreVertical,
  Settings,
  Eye
} from 'lucide-react-native';
import { useStreamManager } from '@/hooks/useStreamManager';
import { TwitchStream, twitchApi } from '@/services/twitchApi';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StreamCellProps {
  stream: TwitchStream;
  width: number;
  height: number;
  onRemove: () => void;
  isActive?: boolean;
  onPress?: () => void;
}

const StreamCell: React.FC<StreamCellProps> = ({ 
  stream, 
  width, 
  height, 
  onRemove, 
  isActive = false, 
  onPress 
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const webViewRef = useRef<WebView>(null);
  const scale = useSharedValue(1);
  const controlsOpacity = useSharedValue(0);
  const borderGlow = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      borderGlow.value = withTiming(1, { duration: 300 });
    } else {
      borderGlow.value = withTiming(0, { duration: 300 });
    }
  }, [isActive]);

  useEffect(() => {
    controlsOpacity.value = withTiming(showControls ? 1 : 0, { duration: 200 });
    
    let timeout: NodeJS.Timeout;
    if (showControls) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    
    return () => clearTimeout(timeout);
  }, [showControls]);

  const handlePress = () => {
    scale.value = withSpring(0.95, { damping: 15 }, () => {
      scale.value = withSpring(1);
    });
    setShowControls(!showControls);
    onPress?.();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Generate clean Twitch embed HTML that prevents fullscreen
  const embedUrl = `https://player.twitch.tv/?channel=${stream.user_login}&parent=localhost&muted=${isMuted}&autoplay=true&allowfullscreen=false&controls=true&time=0s`;
  
  const twitchEmbedHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
      <style>
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        body { 
          background: #0e0e10;
          overflow: hidden;
          width: 100%;
          height: 100%;
          position: fixed;
        }
        .container {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
        }
        iframe { 
          width: 100% !important; 
          height: 100% !important; 
          border: none !important;
          display: block !important;
          pointer-events: auto;
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
        // Prevent fullscreen completely
        document['addEventListener']('fullscreenchange', function() {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
        });
        
        document['addEventListener']('webkitfullscreenchange', function() {
          if (document.webkitFullscreenElement) {
            document.webkitExitFullscreen();
          }
        });
        
        // Prevent any fullscreen attempts
        document['addEventListener']('keydown', function(e) {
          if (e.key === 'F11' || (e.key === 'f' && e.target.tagName === 'IFRAME')) {
            e.preventDefault();
            return false;
          }
        });
        
        // Override fullscreen API
        Element.prototype.requestFullscreen = function() { return Promise.reject(); };
        Element.prototype.webkitRequestFullscreen = function() { return Promise.reject(); };
      </script>
    </body>
    </html>
  `;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: interpolate(
      borderGlow.value,
      [0, 1],
      [0, 1]
    ) > 0.5 ? '#8B5CF6' : 'rgba(255, 255, 255, 0.1)',
    borderWidth: interpolate(borderGlow.value, [0, 1], [1, 2]),
  }));

  const animatedControlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  return (
    <Animated.View style={[styles.streamCell, { width, height }, animatedStyle]}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        onPress={handlePress}
        activeOpacity={1}
      >
        {/* WebView */}
        <WebView
          ref={webViewRef}
          source={{ html: twitchEmbedHtml }}
          style={StyleSheet.absoluteFill}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          allowsInlineMediaPlayback={true}
          allowsFullscreenVideo={false}
          mediaPlaybackRequiresUserAction={false}
          scrollEnabled={false}
          bounces={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="compatibility"
          startInLoadingState={true}
        />
        
        {/* Loading overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
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
              <Settings size={20} color="#8B5CF6" />
            </MotiView>
          </View>
        )}

        {/* Stream info overlay */}
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent']}
          style={styles.infoOverlay}
        >
          <View style={styles.streamHeader}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text style={styles.viewerCount}>
              {(stream.viewer_count || 0).toLocaleString()}
            </Text>
          </View>
          <Text style={styles.streamTitle} numberOfLines={1}>
            {stream.user_name}
          </Text>
          <Text style={styles.streamGame} numberOfLines={1}>
            {stream.game_name}
          </Text>
        </LinearGradient>

        {/* Controls overlay */}
        <Animated.View style={[styles.controlsOverlay, animatedControlsStyle]}>
          <BlurView style={styles.controlsContainer} blurType="dark" blurAmount={20}>
            <View style={styles.controlsRow}>
              <View style={styles.leftControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={togglePlayPause}
                >
                  {isPlaying ? (
                    <Pause size={14} color="#fff" />
                  ) : (
                    <Play size={14} color="#fff" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX size={14} color="#fff" />
                  ) : (
                    <Volume2 size={14} color="#8B5CF6" />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={onRemove}
              >
                <X size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface MultiViewGridProps {
  layout?: '2x2' | '3x3' | '4x4' | 'auto';
}

export const MultiViewGrid: React.FC<MultiViewGridProps> = ({ 
  layout = 'auto' 
}) => {
  const { activeStreams, removeStream } = useStreamManager();
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);

  const getGridLayout = () => {
    const streamCount = activeStreams.length;
    
    if (layout !== 'auto') {
      const size = parseInt(layout.charAt(0));
      return { columns: size, rows: size };
    }
    
    // Auto layout based on stream count
    if (streamCount <= 1) return { columns: 1, rows: 1 };
    if (streamCount <= 4) return { columns: 2, rows: 2 };
    if (streamCount <= 9) return { columns: 3, rows: 3 };
    return { columns: 4, rows: 4 };
  };

  const { columns, rows } = getGridLayout();
  const maxStreams = columns * rows;
  const displayStreams = activeStreams.slice(0, maxStreams);

  // Calculate cell dimensions with improved sizing
  const padding = 12;
  const gap = 6;
  const availableWidth = SCREEN_WIDTH - padding * 2;
  const availableHeight = SCREEN_HEIGHT - 180; // Reduced reserved space for better stream visibility
  
  const cellWidth = (availableWidth - gap * (columns - 1)) / columns;
  const cellHeight = Math.min(
    (availableHeight - gap * (rows - 1)) / rows,
    (cellWidth * 9) / 16 // Maintain 16:9 aspect ratio
  );

  if (displayStreams.length === 0) {
    return (
      <View style={styles.emptyState}>
        <BlurView style={styles.emptyBlur} blurType="dark" blurAmount={20}>
          <Grid size={64} color="#666" />
          <Text style={styles.emptyTitle}>Multi-View Grid</Text>
          <Text style={styles.emptySubtitle}>
            Add streams from the discover tab to create your multi-view experience
          </Text>
        </BlurView>
      </View>
    );
  }

  // Create proper grid rows
  const createGridRows = () => {
    const rows = [];
    for (let i = 0; i < displayStreams.length; i += columns) {
      const rowStreams = displayStreams.slice(i, i + columns);
      rows.push(rowStreams);
    }
    return rows;
  };

  const gridRows = createGridRows();

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.gridContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.grid}>
        {gridRows.map((rowStreams, rowIndex) => (
          <View key={rowIndex} style={styles.gridRow}>
            {rowStreams.map((stream, columnIndex) => (
              <View
                key={stream.id}
                style={[
                  styles.cellWrapper,
                  {
                    width: cellWidth,
                    height: cellHeight,
                    marginRight: columnIndex < rowStreams.length - 1 ? gap : 0,
                  }
                ]}
              >
                <StreamCell
                  stream={stream}
                  width={cellWidth}
                  height={cellHeight}
                  onRemove={() => removeStream(stream.id)}
                  isActive={activeStreamId === stream.id}
                  onPress={() => setActiveStreamId(stream.id)}
                />
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  gridContainer: {
    padding: 12,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
  },
  cellWrapper: {
    // marginRight is handled dynamically in the component
  },
  streamCell: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)',
      },
    }),
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 10,
  },
  infoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 8,
    zIndex: 5,
  },
  streamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00FF00',
  },
  liveText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  viewerCount: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '500',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  streamTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  streamGame: {
    color: '#8B5CF6',
    fontSize: 10,
    fontWeight: '500',
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    zIndex: 10,
  },
  controlsContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  leftControls: {
    flexDirection: 'row',
    gap: 6,
  },
  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: 'bold',
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