import { 
  Grid3X3, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw,
  Monitor,
  PictureInPicture,
  Layers,
  Activity,
  Wifi,
  Battery,
} from 'lucide-react-native';
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ViewStyle,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { TwitchStream } from '@/services/twitchApi';
import { UniversalStream } from '@/services/multiPlatformStreamingApi';
import { ModernTheme } from '@/theme/modernTheme';
import { streamQualityManager, QualityLevel } from '@/services/streamQualityManager';
import { streamHealthMonitor } from '@/services/streamHealthMonitor';
import { performanceOptimizer } from '@/services/performanceOptimizer';
import { bandwidthMonitor } from '@/services/bandwidthMonitor';

// Import enhanced players
import EnhancedKickPlayer from './EnhancedKickPlayer';
import EnhancedTwitchPlayer from './EnhancedTwitchPlayer';
import EnhancedYouTubePlayer from './EnhancedYouTubePlayer';

interface StreamInstance {
  id: string;
  stream: TwitchStream | UniversalStream;
  platform: 'twitch' | 'youtube' | 'kick' | 'facebook';
  isActive: boolean;
  isMuted: boolean;
  isPlaying: boolean;
  quality: QualityLevel;
  priority: 'high' | 'medium' | 'low';
  position: { x: number; y: number; width: number; height: number };
  fullscreen: boolean;
  pictureInPicture: boolean;
  showChat: boolean;
}

interface UniversalStreamControllerProps {
  streams: (TwitchStream | UniversalStream)[];
  onStreamsChange?: (streams: (TwitchStream | UniversalStream)[]) => void;
  maxStreams?: number;
  defaultLayout?: 'grid' | 'focus' | 'pip' | 'theater';
  enablePerformanceMonitoring?: boolean;
  enableQualityManagement?: boolean;
  enableStreamSync?: boolean;
}

type LayoutMode = 'grid' | 'focus' | 'pip' | 'theater';

export const UniversalStreamController: React.FC<UniversalStreamControllerProps> = ({
  streams = [],
  onStreamsChange,
  maxStreams = 6,
  defaultLayout = 'grid',
  enablePerformanceMonitoring = true,
  enableQualityManagement = true,
  enableStreamSync = false,
}) => {
  const [streamInstances, setStreamInstances] = useState<Map<string, StreamInstance>>(new Map());
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(defaultLayout);
  const [focusedStreamId, setFocusedStreamId] = useState<string | null>(null);
  const [globalMuted, setGlobalMuted] = useState(false);
  const [globalPaused, setGlobalPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  const screenDimensions = Dimensions.get('window');
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize streams as instances
  useEffect(() => {
    const newInstances = new Map<string, StreamInstance>();

    streams.forEach((stream, index) => {
      const streamId = 'id' in stream ? stream.id : stream.id;
      const platform = 'platform' in stream ? stream.platform : 'twitch';

      if (!streamInstances.has(streamId)) {
        const instance: StreamInstance = {
          id: streamId,
          stream,
          platform,
          isActive: index === 0,
          isMuted: index > 0, // Mute all except first stream
          isPlaying: true,
          quality: 'auto',
          priority: index === 0 ? 'high' : 'medium',
          position: calculateStreamPosition(index, streams.length, layoutMode),
          fullscreen: false,
          pictureInPicture: false,
          showChat: false,
        };
        newInstances.set(streamId, instance);
      } else {
        // Update existing instance
        const existing = streamInstances.get(streamId)!;
        existing.position = calculateStreamPosition(index, streams.length, layoutMode);
        newInstances.set(streamId, existing);
      }
    });

    setStreamInstances(newInstances);

    // Auto-focus first stream in focus mode
    if (layoutMode === 'focus' && streams.length > 0) {
      const firstStreamId = 'id' in streams[0] ? streams[0].id : streams[0].id;
      setFocusedStreamId(firstStreamId);
    }
  }, [streams, layoutMode]);

  // Performance monitoring
  useEffect(() => {
    if (enablePerformanceMonitoring) {
      const interval = setInterval(() => {
        const metrics = performanceOptimizer.getCurrentPerformance();
        const bandwidth = bandwidthMonitor.getCurrentBandwidth();
        const health = {
          cpu: metrics?.cpuUsage || 0,
          memory: metrics?.memoryUsage || 0,
          battery: metrics?.batteryLevel || 100,
          network: bandwidth?.downloadSpeed || 0,
          streamCount: streamInstances.size,
        };

        setPerformanceMetrics(metrics);
        setSystemHealth(health);

        // Auto-adjust quality based on performance
        if (enableQualityManagement) {
          adjustQualityBasedOnPerformance(health);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [enablePerformanceMonitoring, enableQualityManagement, streamInstances.size]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls) {
      if (controlsTimer.current) {clearTimeout(controlsTimer.current);}
      controlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 4000);
    }

    return () => {
      if (controlsTimer.current) {clearTimeout(controlsTimer.current);}
    };
  }, [showControls]);

  // Calculate stream positions based on layout
  const calculateStreamPosition = useCallback(
    (
      index: number,
      totalStreams: number,
      layout: LayoutMode
    ): { x: number; y: number; width: number; height: number } => {
      const { width: screenWidth, height: screenHeight } = screenDimensions;
      const controlsHeight = 60;
      const availableHeight = screenHeight - controlsHeight;

      switch (layout) {
        case 'grid': {
          const cols = Math.ceil(Math.sqrt(totalStreams));
          const rows = Math.ceil(totalStreams / cols);
          const streamWidth = screenWidth / cols;
          const streamHeight = availableHeight / rows;
          const col = index % cols;
          const row = Math.floor(index / cols);

        return {
            x: col * streamWidth,
            y: row * streamHeight,
            width: streamWidth,
            height: streamHeight,
          };
        }

      case 'focus': {
          if (index === 0) {
            // Main stream takes 75% of screen
            return {
              x: 0,
              y: 0,
              width: screenWidth * 0.75,
              height: availableHeight,
            };
          } else {
            // Secondary streams on the side
            const sideWidth = screenWidth * 0.25;
            const sideHeight = availableHeight / (totalStreams - 1);
            return {
              x: screenWidth * 0.75,
              y: (index - 1) * sideHeight,
              width: sideWidth,
              height: sideHeight,
            };
          }


        case 'theater': {
          if (index === 0) {
            // Main stream takes full width, 70% height
            return {
              x: 0,
              y: 0,
              width: screenWidth,
              height: availableHeight * 0.7,
            };
          } else {
            // Secondary streams at bottom
            const bottomHeight = availableHeight * 0.3;
            const bottomWidth = screenWidth / (totalStreams - 1);
            return {
              x: (index - 1) * bottomWidth,
              y: availableHeight * 0.7,
              width: bottomWidth,
              height: bottomHeight,
            };
          }
        }

        case 'pip': {
          if (index === 0) {
            // Main stream takes most of screen
            return {
              x: 0,
              y: 0,
              width: screenWidth,
              height: availableHeight,
            };
          } else {
            // PiP streams in corners
            const pipSize = Math.min(screenWidth * 0.3, 200);
            const margin = 20;
            const pipRow = Math.floor((index - 1) / 2);
            const pipCol = (index - 1) % 2;

          return {
              x: pipCol === 0 ? margin : screenWidth - pipSize - margin,
              y: pipRow * (pipSize + margin) + margin,
              width: pipSize,
              height: pipSize * 0.56, // 16:9 aspect ratio
            };
          }
        }


      default:
          return { x: 0, y: 0, width: screenWidth, height: availableHeight };
      }
    },
    [screenDimensions]
  );

  // Quality adjustment based on performance
  const adjustQualityBasedOnPerformance = useCallback(
    (health: any) => {
      const instances = Array.from(streamInstances.values());

    if (health.cpu > 80 || health.memory > 85) {
        // High system load - reduce quality
        instances.forEach(instance => {
          if (instance.quality !== '360p') {
            updateStreamInstance(instance.id, { quality: '360p' });
          }
        });
      } else if (health.cpu < 50 && health.memory < 60 && health.network > 10) {
        // Good performance - can increase quality
        instances.forEach(instance => {
          if (instance.priority === 'high' && instance.quality !== 'auto') {
            updateStreamInstance(instance.id, { quality: 'auto' });
          }
        });
      }
    },
    [streamInstances]
  );

  // Update stream instance
  const updateStreamInstance = useCallback((streamId: string, updates: Partial<StreamInstance>) => {
    setStreamInstances(prev => {
      const newInstances = new Map(prev);
      const instance = newInstances.get(streamId);
      if (instance) {
        newInstances.set(streamId, { ...instance, ...updates });
      }
      return newInstances;
    });
  }, []);

  // Stream event handlers
  const handleStreamPress = useCallback(
    (streamId: string) => {
      setShowControls(true);

    if (layoutMode === 'focus') {
        setFocusedStreamId(streamId);
        // Unmute focused stream, mute others
        streamInstances.forEach((instance, id) => {
          updateStreamInstance(id, {
            isMuted: id !== streamId,
            isActive: id === streamId,
            priority: id === streamId ? 'high' : 'medium',
          });
        });
      } else {
        // Toggle active state
        const instance = streamInstances.get(streamId);
        if (instance) {
          updateStreamInstance(streamId, { isActive: !instance.isActive });
        }
      }
    },
    [layoutMode, streamInstances, updateStreamInstance]
  );

  const handleStreamRemove = useCallback(
    (streamId: string) => {
      const updatedStreams = streams.filter(stream => {
        const id = 'id' in stream ? stream.id : stream.id;
        return id !== streamId;
      });
      onStreamsChange?.(updatedStreams);
    },
    [streams, onStreamsChange]
  );

  const handleMuteToggle = useCallback(
    (streamId: string) => {
      const instance = streamInstances.get(streamId);
      if (instance) {
        updateStreamInstance(streamId, { isMuted: !instance.isMuted });
      }
    },
    [streamInstances, updateStreamInstance]
  );

  const handlePlayToggle = useCallback(
    (streamId: string) => {
      const instance = streamInstances.get(streamId);
      if (instance) {
        updateStreamInstance(streamId, { isPlaying: !instance.isPlaying });
      }
    },
    [streamInstances, updateStreamInstance]
  );

  const handleQualityChange = useCallback(
    (streamId: string, quality: QualityLevel) => {
      updateStreamInstance(streamId, { quality });
    },
    [updateStreamInstance]
  );

  const handleFullscreen = useCallback(
    (streamId: string) => {
      updateStreamInstance(streamId, { fullscreen: true });
      setLayoutMode('theater');
      setFocusedStreamId(streamId);
    },
    [updateStreamInstance]
  );

  const handlePictureInPicture = useCallback(
    (streamId: string) => {
      updateStreamInstance(streamId, { pictureInPicture: true });
      setLayoutMode('pip');
    },
    [updateStreamInstance]
  );

  // Global controls
  const handleGlobalMute = useCallback(() => {
    setGlobalMuted(!globalMuted);
    streamInstances.forEach((instance, id) => {
      updateStreamInstance(id, { isMuted: !globalMuted });
    });
  }, [globalMuted, streamInstances, updateStreamInstance]);

  const handleGlobalPause = useCallback(() => {
    setGlobalPaused(!globalPaused);
    streamInstances.forEach((instance, id) => {
      updateStreamInstance(id, { isPlaying: globalPaused });
    });
  }, [globalPaused, streamInstances, updateStreamInstance]);

  const handleLayoutChange = useCallback(() => {
    const layouts: LayoutMode[] = ['grid', 'focus', 'theater', 'pip'];
    const currentIndex = layouts.indexOf(layoutMode);
    const nextLayout = layouts[(currentIndex + 1) % layouts.length];
    setLayoutMode(nextLayout);
  }, [layoutMode]);

  // Render stream player based on platform
  const renderStreamPlayer = useCallback(
    (instance: StreamInstance) => {
      const commonProps = {
        stream: instance.stream,
        width: instance.position.width,
        height: instance.position.height,
        isActive: instance.isActive,
        isMuted: instance.isMuted,
        isPlaying: instance.isPlaying,
        quality: instance.quality,
        onPress: () => handleStreamPress(instance.id),
        onRemove: () => handleStreamRemove(instance.id),
        onMuteToggle: () => handleMuteToggle(instance.id),
        onPlayToggle: () => handlePlayToggle(instance.id),
        onQualityChange: (quality: QualityLevel) => handleQualityChange(instance.id, quality),
        onFullscreen: () => handleFullscreen(instance.id),
        onPictureInPicture: () => handlePictureInPicture(instance.id),
        showControls: showControls,
        autoplay: true,
      };

      const containerStyle = {
        position: 'absolute' as const,
        left: instance.position.x,
        top: instance.position.y,
        width: instance.position.width,
        height: instance.position.height,
        zIndex: instance.isActive ? 10 : 1,
      };

      switch (instance.platform) {
        case 'twitch':
          return (
            <View key={instance.id} style={containerStyle}>
              <EnhancedTwitchPlayer
                {...commonProps}
                stream={instance.stream as TwitchStream}
                priority={instance.priority}
                showChat={instance.showChat}
              />
            </View>
          );


      case 'youtube':
          return (
            <View key={instance.id} style={containerStyle}>
              <EnhancedYouTubePlayer
                {...commonProps}
                stream={instance.stream as UniversalStream}
                showSuperChat={instance.showChat}
              />
            </View>
          );

      case 'kick':
          return (
            <View key={instance.id} style={containerStyle}>
              <EnhancedKickPlayer
                {...commonProps}
                stream={instance.stream as UniversalStream}
                showChat={instance.showChat}
              />
            </View>
          );

      default:
          return null;
      }
    },
    [
      showControls,
      handleStreamPress,
      handleStreamRemove,
      handleMuteToggle,
      handlePlayToggle,
      handleQualityChange,
      handleFullscreen,
      handlePictureInPicture,
    ]
  );

  // Performance panel
  const renderPerformancePanel = useCallback(() => {
    if (!showPerformancePanel || !systemHealth) {return null;}

    return (
      <View style={styles.performancePanel}>
        <Text style={styles.performancePanelTitle}>System Performance</Text>
        <View style={styles.performanceMetrics}>
          <View style={styles.performanceMetric}>
            <Text style={styles.metricLabel}>CPU</Text>
            <Text
              style={[styles.metricValue, { color: systemHealth.cpu > 80 ? '#ff6b6b' : '#53FC18' }]}
            >
              {systemHealth.cpu.toFixed(0)}%
            </Text>
          </View>
          <View style={styles.performanceMetric}>
            <Text style={styles.metricLabel}>Memory</Text>
            <Text
              style={[
                styles.metricValue,
                { color: systemHealth.memory > 85 ? '#ff6b6b' : '#53FC18' },
              ]}
            >
              {systemHealth.memory.toFixed(0)}%
            </Text>
          </View>
          <View style={styles.performanceMetric}>
            <Text style={styles.metricLabel}>Network</Text>
            <Text style={styles.metricValue}>{systemHealth.network.toFixed(1)} Mbps</Text>
          </View>
          <View style={styles.performanceMetric}>
            <Text style={styles.metricLabel}>Streams</Text>
            <Text style={styles.metricValue}>{systemHealth.streamCount}</Text>
          </View>
        </View>
      </View>
    );
  }, [showPerformancePanel, systemHealth]);

  return (
    <View style={styles.container}>
      {/* Stream Players */}
      <View style={styles.streamContainer}>
        {Array.from(streamInstances.values()).map(renderStreamPlayer)}
      </View>

      {/* Performance Panel */}
      {renderPerformancePanel()}

      {/* Global Controls */}
      {showControls && (
        <View style={styles.globalControls}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.controlsScroll}
          >
            <TouchableOpacity style={styles.controlButton} onPress={handleGlobalMute}>
              {globalMuted ? (
                <VolumeX size={20} color="#fff" />
              ) : (
                <Volume2 size={20} color="#fff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={handleGlobalPause}>
              {globalPaused ? <Play size={20} color="#fff" /> : <Pause size={20} color="#fff" />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={handleLayoutChange}>
              <Grid3X3 size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowPerformancePanel(!showPerformancePanel)}
            >
              <Monitor size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton}>
              <Settings size={20} color="#fff" />
            </TouchableOpacity>

            <View style={styles.layoutIndicator}>
              <Text style={styles.layoutText}>{layoutMode.toUpperCase()}</Text>
            </View>

            <View style={styles.streamCounter}>
              <Layers size={16} color="#fff" />
              <Text style={styles.counterText}>
                {streamInstances.size}/{maxStreams}
              </Text>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Touch area to show controls */}
      <TouchableOpacity
        style={styles.touchArea}
        onPress={() => setShowControls(true)}
        activeOpacity={1}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernTheme.colors.background.primary,
  } as ViewStyle,

  streamContainer: {
    flex: 1,
    position: 'relative',
  } as ViewStyle,

  globalControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingVertical: ModernTheme.spacing.sm,
    paddingHorizontal: ModernTheme.spacing.md,
  } as ViewStyle,

  controlsScroll: {
    flexDirection: 'row',
  } as ViewStyle,

  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ModernTheme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,

  layoutIndicator: {
    backgroundColor: ModernTheme.colors.primary[500],
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
    marginRight: ModernTheme.spacing.sm,
    alignSelf: 'center',
  } as ViewStyle,

  layoutText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.xs,
    fontWeight: ModernTheme.typography.weights.bold,
  },

  streamCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
    gap: ModernTheme.spacing.xs,
    alignSelf: 'center',
  } as ViewStyle,

  counterText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.xs,
    fontWeight: ModernTheme.typography.weights.semibold,
  },

  performancePanel: {
    position: 'absolute',
    top: ModernTheme.spacing.md,
    right: ModernTheme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.md,
    minWidth: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,

  performancePanelTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
    marginBottom: ModernTheme.spacing.sm,
  },

  performanceMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ModernTheme.spacing.sm,
  } as ViewStyle,

  performanceMetric: {
    width: '48%',
    alignItems: 'center',
  } as ViewStyle,

  metricLabel: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.xs,
    marginBottom: 2,
  },

  metricValue: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
    fontFamily: 'monospace',
  },

  touchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 60,
  } as ViewStyle,
});

export default UniversalStreamController;
