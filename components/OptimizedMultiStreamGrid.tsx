import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  LayoutAnimation,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  Grid3X3,
  Grid2X2,
  Square,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  RotateCcw,
  Settings,
  Eye,
  EyeOff,
  Monitor,
  Layers,
  Focus,
  MoreHorizontal,
  Sparkles,
  Users,
  Clock,
  Zap,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  FadeIn,
  FadeOut,
  Layout,
  SlideInUp,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
  BounceIn,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStreamManagerContext } from '@/contexts/StreamManagerContext';
import { TwitchStream } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';
import { StreamPlayerCard } from './StreamPlayerCard';
import { HapticFeedback } from '@/utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type GridLayout = '1x1' | '2x2' | '3x3' | '2x1' | '1x2' | 'adaptive';
type ViewMode = 'grid' | 'stack' | 'pip' | 'focus';

interface GridDimensions {
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  gap: number;
  padding: number;
}

interface OptimizedMultiStreamGridProps {
  maxStreams?: number;
  initialLayout?: GridLayout;
  initialViewMode?: ViewMode;
  onLayoutChange?: (layout: GridLayout) => void;
  onViewModeChange?: (mode: ViewMode) => void;
  showControls?: boolean;
  enableGestures?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const OptimizedMultiStreamGrid: React.FC<OptimizedMultiStreamGridProps> = React.memo(
  ({
    maxStreams = 9,
    initialLayout = 'adaptive',
    initialViewMode = 'grid',
    onLayoutChange,
    onViewModeChange,
    showControls = true,
    enableGestures = true,
  }) => {
    const { activeStreams, removeStream, clearAllStreams } = useStreamManagerContext();

  // Debug logging for grid component
  useEffect(() => {
    console.log('📺 GRID COMPONENT - Active streams changed:', activeStreams.length, 'streams:', activeStreams.map(s => s.user_name));
  }, [activeStreams]);
    const insets = useSafeAreaInsets();


  const [layout, setLayout] = useState<GridLayout>(initialLayout);
    const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
    const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
    const [globalMute, setGlobalMute] = useState(true);
    const [controlsVisible, setControlsVisible] = useState(showControls);
    const [isLandscape, setIsLandscape] = useState(false);

  // Animation values
    const gridScale = useSharedValue(1);
    const controlsOpacity = useSharedValue(showControls ? 1 : 0);
    const headerTranslateY = useSharedValue(0);
    const sparkleRotation = useSharedValue(0);
    const statsScale = useSharedValue(1);
    const quickTogglePulse = useSharedValue(1);

    // Initialize animations (performance optimized)
    useEffect(() => {
      // Sparkle rotation animation (much slower for better performance)
      sparkleRotation.value = withRepeat(
        withTiming(360, { duration: 8000, easing: Easing.linear }),
        -1
      );
    }, []);

    // Quick toggle pulse only when needed
    useEffect(() => {
      if (!controlsVisible) {
        quickTogglePulse.value = withRepeat(
          withSequence(withTiming(1.05, { duration: 1500 }), withTiming(1, { duration: 1500 })),
          -1
        );
      } else {
        quickTogglePulse.value = 1;
      }
    }, [controlsVisible]);

    // Orientation detection
    useEffect(() => {
      const checkOrientation = () => {
        const { width, height } = Dimensions.get('window');
        setIsLandscape(width > height);
      };

      const subscription = Dimensions.addEventListener('change', checkOrientation);
      checkOrientation();

      return () => subscription?.remove();
    }, []);

    // Optimized grid dimension calculations with orientation awareness
    const gridDimensions = useMemo((): GridDimensions => {
      const streamCount = activeStreams.length;
      const availableWidth = SCREEN_WIDTH;
      const headerHeight = controlsVisible ? (isLandscape ? 80 : 120) : 60;
      const bottomTabHeight = 100; // Tab bar space
      const availableHeight =
        SCREEN_HEIGHT - headerHeight - bottomTabHeight - insets.top - insets.bottom;

    // Responsive padding and gap based on screen size
      const padding = SCREEN_WIDTH < 400 ? 4 : 8; // More padding on larger screens
      const gap = SCREEN_WIDTH < 400 ? 2 : 4; // Smaller gap on small screens

    const containerWidth = availableWidth - (padding * 2);
      const containerHeight = availableHeight - padding * 2;

      let columns = 1;
      let rows = 1;

      // Intelligent layout selection
      if (layout === 'adaptive') {
        if (streamCount <= 1) {
          columns = 1;
          rows = 1;
        } else if (streamCount <= 2) {
          columns = isLandscape ? 2 : 1;
          rows = isLandscape ? 1 : 2;
        } else if (streamCount <= 4) {
          columns = 2;
          rows = 2;
        } else if (streamCount <= 6) {
          columns = isLandscape ? 3 : 2;
          rows = isLandscape ? 2 : 3;
        } else {
          columns = 3;
          rows = 3;
        }
      } else {
        // Fixed layouts
        switch (layout) {
          case '1x1':
            columns = 1;
            rows = 1;
            break;
          case '2x1':
            columns = 2;
            rows = 1;
            break;
          case '1x2':
            columns = 1;
            rows = 2;
            break;
          case '2x2':
            columns = 2;
            rows = 2;
            break;
          case '3x3':
            columns = 3;
            rows = 3;
            break;
        }
      }

      // Calculate cell dimensions properly accounting for gaps
      let cellWidth = (containerWidth - gap * (columns - 1)) / columns;
      let cellHeight = (containerHeight - gap * (rows - 1)) / rows;

    // Ensure cells don't exceed reasonable bounds for responsive design
      const maxCellWidth = containerWidth / columns - gap;
      const maxCellHeight = containerHeight / rows - gap;

    cellWidth = Math.min(cellWidth, maxCellWidth);
      cellHeight = Math.min(cellHeight, maxCellHeight);

    // For 2x2 grid, ensure cells are properly sized for side-by-side display
      if (columns === 2 && rows === 2) {
        // Calculate available width after padding
        const paddingHorizontal = SCREEN_WIDTH < 400 ? 4 : 8;
        const availableWidth = SCREEN_WIDTH - paddingHorizontal * 2;

      // Force exact calculation for 2x2 layout: (available width - gap between columns) / 2
        cellWidth = Math.floor((availableWidth - gap) / 2);
        // For 2x2, also ensure height accounts for gap between rows
        cellHeight = Math.floor((containerHeight - gap) / 2);

      // Ensure minimum viable size but don't exceed calculated size
        const minSize = 100;
        cellWidth = Math.max(cellWidth, minSize);
        cellHeight = Math.max(cellHeight, minSize);
      }

      return {
        columns,
        rows,
        cellWidth: Math.floor(cellWidth),
        cellHeight: Math.floor(cellHeight),
        gap,
        padding,
      };
    }, [activeStreams.length, layout, controlsVisible, isLandscape]);

    // Layout handlers with optimized animations
    const handleLayoutChange = useCallback(
      (newLayout: GridLayout) => {
        if (newLayout === layout) {return;}

    HapticFeedback.medium();

    // Simplified layout animation
        LayoutAnimation.configureNext({
          duration: 250,
          update: { type: 'easeInEaseOut' },
        });


    setLayout(newLayout);
        onLayoutChange?.(newLayout);
      },
      [layout, onLayoutChange]
    );

    const handleViewModeChange = useCallback(
      (newMode: ViewMode) => {
        if (newMode === viewMode) return;


    HapticFeedback.light();

    // Simplified view mode animation
        LayoutAnimation.configureNext({
          duration: 200,
          update: { type: 'easeInEaseOut' },
        });

    setViewMode(newMode);
        onViewModeChange?.(newMode);
      },
      [viewMode, onViewModeChange]
    );

    // Stream interaction handlers
    const handleStreamPress = useCallback(
      (stream: TwitchStream) => {
        HapticFeedback.light();

    if (viewMode === 'focus' || viewMode === 'pip') {
          setActiveStreamId(stream.id);
          if (globalMute) {
            setGlobalMute(false);
            HapticFeedback.success();
          }
        }
      },
      [viewMode, globalMute]
    );

    const handleStreamLongPress = useCallback(
      (stream: TwitchStream) => {
        HapticFeedback.medium();


    Alert.alert(
      'Stream Options',
      `${stream.user_name}\n${stream.title}`,
      [
          {
            text: 'Set as Main',
            onPress: () => {
              setActiveStreamId(stream.id);
              HapticFeedback.success();
            },
          },
          {
            text: globalMute ? 'Unmute All' : 'Mute All',
            onPress: () => {
              setGlobalMute(!globalMute);
              HapticFeedback.medium();
            },
          },
          {
            text: 'Remove',
            onPress: () => {
              removeStream(stream.id);
              HapticFeedback.warning();
            },
            style: 'destructive',
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]);
      },
      [globalMute, removeStream]
    );

    // Controls toggle
    const toggleControls = useCallback(() => {
      HapticFeedback.light();

    const newVisible = !controlsVisible;
      setControlsVisible(newVisible);

    controlsOpacity.value = withTiming(newVisible ? 1 : 0, {
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1)
      });
      headerTranslateY.value = withTiming(newVisible ? 0 : -80, {
        duration: 300,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });

    // Reset quick toggle pulse when showing controls
      if (newVisible) {
        quickTogglePulse.value = 1;
      }
    }, [controlsVisible]);

    // Animated styles
    const gridAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: gridScale.value }],
    }));

    const controlsAnimatedStyle = useAnimatedStyle(() => ({
      opacity: controlsOpacity.value,
      transform: [{ translateY: headerTranslateY.value }],
    }));

    const sparkleAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${sparkleRotation.value}deg` }],
    }));

    const statsAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: statsScale.value }],
    }));

    const quickToggleAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: quickTogglePulse.value }],
    }));

    // Layout controls component
    const LayoutControls = () => (
      <Animated.View style={[styles.layoutControls, controlsAnimatedStyle]}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.7)']}
          style={styles.controlsGradient}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.controlsContent}
          >
            {/* View Mode Controls */}
            <View style={styles.controlGroup}>
              <Text style={styles.controlGroupLabel}>View</Text>
              <View style={styles.controlRow}>
                <ControlButton
                  onPress={() => handleViewModeChange('grid')}
                  active={viewMode === 'grid'}
                  icon={Grid3X3}
                  label="Grid"
                />
                <ControlButton
                  onPress={() => handleViewModeChange('stack')}
                  active={viewMode === 'stack'}
                  icon={Layers}
                  label="Stack"
                />
                <ControlButton
                  onPress={() => handleViewModeChange('pip')}
                  active={viewMode === 'pip'}
                  icon={Monitor}
                  label="PiP"
                />
                <ControlButton
                  onPress={() => handleViewModeChange('focus')}
                  active={viewMode === 'focus'}
                  icon={Focus}
                  label="Focus"
                />
              </View>
            </View>

            {/* Layout Controls (only for grid mode) */}
            {viewMode === 'grid' && (
              <View style={styles.controlGroup}>
                <Text style={styles.controlGroupLabel}>Layout</Text>
                <View style={styles.controlRow}>
                  <ControlButton
                    onPress={() => handleLayoutChange('adaptive')}
                    active={layout === 'adaptive'}
                    icon={Square}
                    label="Auto"
                  />
                  <ControlButton
                    onPress={() => handleLayoutChange('2x2')}
                    active={layout === '2x2'}
                    icon={Grid2X2}
                    label="2×2"
                  />
                  <ControlButton
                    onPress={() => handleLayoutChange('3x3')}
                    active={layout === '3x3'}
                    icon={Grid3X3}
                    label="3×3"
                  />
                  {isLandscape && (
                    <>
                      <ControlButton
                        onPress={() => handleLayoutChange('2x1')}
                        active={layout === '2x1'}
                        icon={Minimize2}
                        label="2×1"
                      />
                    </>
                  )}
                </View>
              </View>
            )}

            {/* Action Controls */}
            <View style={styles.controlGroup}>
              <Text style={styles.controlGroupLabel}>Audio</Text>
              <View style={styles.controlRow}>
                <ControlButton
                  onPress={() => setGlobalMute(!globalMute)}
                  active={!globalMute}
                  icon={globalMute ? VolumeX : Volume2}
                  label={globalMute ? 'Muted' : 'Audio'}
                />
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    );

    // Render different view modes
    const renderContent = () => {
      if (activeStreams.length === 0) {
        return (
          <Animated.View entering={BounceIn.delay(300)} style={styles.emptyState}>
            <BlurView intensity={20} style={styles.emptyStateBlur}>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.05)']}
                style={styles.emptyStateGradient}
              >
                <Animated.View entering={SlideInDown.delay(400)}>
                  <Grid3X3 size={72} color="#38bdf8" />
                </Animated.View>
                <Animated.View entering={SlideInUp.delay(500)}>
                  <Text style={styles.emptyStateTitle}>Multi-Stream Grid</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    Add streams from the discover tab to start watching multiple streams
                    simultaneously
                  </Text>
                </Animated.View>
                <Animated.View entering={FadeIn.delay(600)} style={styles.emptyStateFeatures}>
                  <View style={styles.featureItem}>
                    <Sparkles size={16} color="#38bdf8" />
                    <Text style={styles.featureText}>Adaptive layouts for any screen size</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Monitor size={16} color="#38bdf8" />
                    <Text style={styles.featureText}>Picture-in-Picture mode</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Volume2 size={16} color="#38bdf8" />
                    <Text style={styles.featureText}>Synchronized audio control</Text>
                  </View>
                </Animated.View>
              </LinearGradient>
            </BlurView>
          </Animated.View>
        );
      }

      // Limit streams for better performance
      const visibleStreams = activeStreams.slice(0, Math.min(maxStreams, 6));

      switch (viewMode) {
        case 'stack':
          return renderStackView(visibleStreams);
        case 'pip':
          return renderPiPView(visibleStreams);
        case 'focus':
          return renderFocusView(visibleStreams);
        default:
          return renderGridView(visibleStreams);
      }
    };

    const renderGridView = (streams: TwitchStream[]) => {
      // Special handling for 2x2 grid to ensure side-by-side layout
      if (layout === '2x2' && gridDimensions.columns === 2) {
        const paddingHorizontal = SCREEN_WIDTH < 400 ? 4 : 8;
        const availableWidth = SCREEN_WIDTH - paddingHorizontal * 2;
        const gap = gridDimensions.gap;
        // Calculate cell width to ensure two cells fit side-by-side
        const cellWidth = Math.floor((availableWidth - gap) / 2);

      // Create rows explicitly for 2x2 layout
        const topRow = streams.slice(0, 2);
        const bottomRow = streams.slice(2, 4);


      return (
          <Animated.View
            style={[
              gridAnimatedStyle,
              {
                paddingHorizontal,
                width: SCREEN_WIDTH,
              },
            ]}
          >
            {/* Top Row */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: gap,
              }}
            >
              {topRow.map((stream, index) => (
                <Animated.View
                  key={stream.id}
                  layout={Layout.springify()}
                  entering={FadeIn.delay(index * 50)}
                  exiting={FadeOut}
                  style={[
                    styles.streamCell,
                    {
                      width: cellWidth,
                      height: gridDimensions.cellHeight,
                    },
                  ]}
                >
                  <StreamPlayerCard
                    stream={stream}
                    width={cellWidth}
                    height={gridDimensions.cellHeight}
                    isActive={activeStreamId === stream.id}
                    isMuted={globalMute || activeStreamId !== stream.id}
                    onPress={() => handleStreamPress(stream)}
                    onLongPress={() => handleStreamLongPress(stream)}
                    onRemove={() => removeStream(stream.id)}
                    onMuteToggle={() => {
                      // If this is the active stream, toggle global mute
                      if (activeStreamId === stream.id) {
                        setGlobalMute(!globalMute);
                      } else {
                        // Make this stream active and unmute
                        setActiveStreamId(stream.id);
                        setGlobalMute(false);
                      }
                      HapticFeedback.light();
                    }}
                    showQuality
                    showViewers
                    compact={cellWidth < 200}
                  />
                </Animated.View>
              ))}
            </View>

          {/* Bottom Row */}
            {bottomRow.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                {bottomRow.map((stream, index) => (
                  <Animated.View
                    key={stream.id}
                    layout={Layout.springify()}
                    entering={FadeIn.delay((index + 2) * 50)}
                    exiting={FadeOut}
                    style={[
                      styles.streamCell,
                      {
                        width: cellWidth,
                        height: gridDimensions.cellHeight,
                      },
                    ]}
                  >
                    <StreamPlayerCard
                      stream={stream}
                      width={cellWidth}
                      height={gridDimensions.cellHeight}
                      isActive={activeStreamId === stream.id}
                      isMuted={globalMute || activeStreamId !== stream.id}
                      onPress={() => handleStreamPress(stream)}
                      onLongPress={() => handleStreamLongPress(stream)}
                      onRemove={() => removeStream(stream.id)}
                      showQuality
                      showViewers
                      compact={cellWidth < 200}
                    />
                  </Animated.View>
                ))}
              </View>
            )}
          </Animated.View>
        );
      }

      // Default grid layout for other configurations - organize into proper rows
      const rows = [];
      for (let i = 0; i < streams.length; i += gridDimensions.columns) {
        rows.push(streams.slice(i, i + gridDimensions.columns));
      }


    return (
        <Animated.View
          style={[
            gridAnimatedStyle,
            {
              paddingHorizontal: gridDimensions.padding,
              width: SCREEN_WIDTH,
            },
          ]}
        >
          {rows.map((rowStreams, rowIndex) => (
            <View
              key={`row-${rowIndex}`}
              style={{
                flexDirection: 'row',
                justifyContent:
                  rowStreams.length < gridDimensions.columns ? 'flex-start' : 'space-between',
                marginBottom: rowIndex < rows.length - 1 ? gridDimensions.gap : 0,
              }}
            >
              {rowStreams.map((stream, colIndex) => (
                <Animated.View
                  key={stream.id}
                  layout={Layout.springify()}
                  entering={FadeIn.delay((rowIndex * gridDimensions.columns + colIndex) * 50)}
                  exiting={FadeOut}
                  style={[
                    styles.streamCell,
                    {
                      width: gridDimensions.cellWidth,
                      height: gridDimensions.cellHeight,
                      marginRight:
                        colIndex < rowStreams.length - 1 &&
                        rowStreams.length === gridDimensions.columns
                          ? gridDimensions.gap
                          : 0,
                    },
                  ]}
                >
                  <StreamPlayerCard
                    stream={stream}
                    width={gridDimensions.cellWidth}
                    height={gridDimensions.cellHeight}
                    isActive={activeStreamId === stream.id}
                    isMuted={globalMute || activeStreamId !== stream.id}
                    onPress={() => handleStreamPress(stream)}
                    onLongPress={() => handleStreamLongPress(stream)}
                    onRemove={() => removeStream(stream.id)}
                    onMuteToggle={() => {
                      // If this is the active stream, toggle global mute
                      if (activeStreamId === stream.id) {
                        setGlobalMute(!globalMute);
                      } else {
                        // Make this stream active and unmute
                        setActiveStreamId(stream.id);
                        setGlobalMute(false);
                      }
                      HapticFeedback.light();
                    }}
                    showQuality
                    showViewers
                    compact={gridDimensions.cellWidth < 200}
                  />
                </Animated.View>
              ))}
            </View>
          ))}
        </Animated.View>
      );
    };

    const renderStackView = (streams: TwitchStream[]) => (
      <ScrollView
        style={styles.stackContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.stackContent}
      >
        {streams.map((stream, index) => (
          <Animated.View
            key={stream.id}
            layout={Layout.springify()}
            entering={FadeIn.delay(index * 150)}
            style={[
              styles.stackItem,
              { marginBottom: index < streams.length - 1 ? ModernTheme.spacing.sm : 0 },
            ]}
          >
            <StreamPlayerCard
              stream={stream}
              width={SCREEN_WIDTH - ModernTheme.spacing.md * 2}
              height={Math.floor((SCREEN_WIDTH - ModernTheme.spacing.md * 2) / 1.6)}
              isActive={activeStreamId === stream.id}
              isMuted={globalMute || activeStreamId !== stream.id}
              onPress={() => handleStreamPress(stream)}
              onLongPress={() => handleStreamLongPress(stream)}
              onRemove={() => removeStream(stream.id)}
              onMuteToggle={() => {
                // If this is the active stream, toggle global mute
                if (activeStreamId === stream.id) {
                  setGlobalMute(!globalMute);
                } else {
                  // Make this stream active and unmute
                  setActiveStreamId(stream.id);
                  setGlobalMute(false);
                }
                HapticFeedback.light();
              }}
              showQuality
              showViewers
              expanded
            />
          </Animated.View>
        ))}
      </ScrollView>
    );

    const renderPiPView = (streams: TwitchStream[]) => {
      const mainStream = streams.find(s => s.id === activeStreamId) || streams[0];
      const secondaryStreams = streams.filter(s => s.id !== mainStream?.id);

    return (
        <View style={styles.pipContainer}>
          {/* Main stream */}
          {mainStream && (
            <Animated.View style={styles.pipMain} layout={Layout.springify()}>
              <StreamPlayerCard
                stream={mainStream}
                width={SCREEN_WIDTH - ModernTheme.spacing.md * 2}
                height={Math.floor((SCREEN_WIDTH - ModernTheme.spacing.md * 2) * 0.6)}
                isActive
                isMuted={globalMute}
                onPress={() => handleStreamPress(mainStream)}
                onLongPress={() => handleStreamLongPress(mainStream)}
                onRemove={() => removeStream(mainStream.id)}
                onMuteToggle={() => {
                  setGlobalMute(!globalMute);
                  HapticFeedback.light();
                }}
                showQuality
                showViewers
                expanded
              />
            </Animated.View>
          )}

        {/* Secondary streams */}
          {secondaryStreams.length > 0 && (
            <ScrollView
              horizontal
              style={styles.pipSecondary}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pipSecondaryContent}
            >
              {secondaryStreams.map((stream, index) => {
                // Calculate responsive size that fits properly in view
                const containerPadding = ModernTheme.spacing.md * 2;
                const gapBetweenStreams = ModernTheme.spacing.sm;
                const availableWidth = SCREEN_WIDTH - containerPadding;
                const maxStreamsVisible = 3; // Show max 3 streams before scrolling
                const streamWidth = Math.min(
                  140,
                  Math.floor(
                    (availableWidth - gapBetweenStreams * (maxStreamsVisible - 1)) /
                      maxStreamsVisible
                  )
                );
                const streamHeight = Math.floor(streamWidth * 0.5625); // 16:9 aspect ratio

              return (
                  <Animated.View
                    key={stream.id}
                    layout={Layout.springify()}
                    entering={FadeIn.delay(index * 100)}
                    style={[
                      styles.pipSecondaryItem,
                      {
                        marginRight:
                          index < secondaryStreams.length - 1 ? ModernTheme.spacing.sm : 0,
                      },
                    ]}
                  >
                    <StreamPlayerCard
                      stream={stream}
                      width={streamWidth}
                      height={streamHeight}
                      isActive={false}
                      isMuted
                      onPress={() => setActiveStreamId(stream.id)}
                      onLongPress={() => handleStreamLongPress(stream)}
                      onRemove={() => removeStream(stream.id)}
                      onMuteToggle={() => {
                        // Make this stream active and unmute
                        setActiveStreamId(stream.id);
                        setGlobalMute(false);
                        HapticFeedback.light();
                      }}
                      compact
                    />
                  </Animated.View>
                );
              })}
            </ScrollView>
          )}
        </View>
      );
    };

    const renderFocusView = (streams: TwitchStream[]) => {
      const focusedStream = streams.find(s => s.id === activeStreamId) || streams[0];
      const otherStreams = streams.filter(s => s.id !== focusedStream?.id);

    return (
        <View style={styles.focusContainer}>
          {/* Focused stream */}
          {focusedStream && (
            <Animated.View style={styles.focusMain} layout={Layout.springify()}>
              <StreamPlayerCard
                stream={focusedStream}
                width={SCREEN_WIDTH - ModernTheme.spacing.md * 2}
                height={Math.floor((SCREEN_WIDTH - ModernTheme.spacing.md * 2) * 0.56)}
                isActive
                isMuted={globalMute}
                onPress={() => handleStreamPress(focusedStream)}
                onLongPress={() => handleStreamLongPress(focusedStream)}
                onRemove={() => removeStream(focusedStream.id)}
                onMuteToggle={() => {
                  setGlobalMute(!globalMute);
                  HapticFeedback.light();
                }}
                showQuality
                showViewers
                expanded
              />
            </Animated.View>
          )}

        {/* Other streams grid */}
          {otherStreams.length > 0 && (
            <View style={styles.focusGrid}>
              <Text style={styles.focusGridTitle}>Other Streams</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.focusGridContent}
              >
                {otherStreams.map((stream, index) => (
                  <Animated.View
                    key={stream.id}
                    layout={Layout.springify()}
                    entering={FadeIn.delay(index * 100)}
                    style={[
                      styles.focusGridItem,
                      { marginRight: index < otherStreams.length - 1 ? ModernTheme.spacing.xs : 0 },
                    ]}
                  >
                    <StreamPlayerCard
                      stream={stream}
                      width={100}
                      height={56}
                      isActive={false}
                      isMuted
                      onPress={() => setActiveStreamId(stream.id)}
                      onLongPress={() => handleStreamLongPress(stream)}
                      onRemove={() => removeStream(stream.id)}
                      onMuteToggle={() => {
                        // Make this stream active and unmute
                        setActiveStreamId(stream.id);
                        setGlobalMute(false);
                        HapticFeedback.light();
                      }}
                      compact
                    />
                  </Animated.View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      );
    };

    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Multi-Stream</Text>
                <Animated.View style={sparkleAnimatedStyle}>
                  <Sparkles size={20} color="#38bdf8" />
                </Animated.View>
              </View>
              <Animated.View style={statsAnimatedStyle}>
                <View style={styles.headerStats}>
                  <View style={styles.statBadge}>
                    <Users size={12} color={ModernTheme.colors.text.secondary} />
                    <Text style={styles.statText}>
                      {activeStreams.length} stream{activeStreams.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.statBadge}>
                    <Zap size={12} color="#10b981" />
                    <Text style={styles.statText}>{viewMode} mode</Text>
                  </View>
                </View>
              </Animated.View>
            </View>

          <View style={styles.headerButtons}>
              {activeStreams.length > 0 && (
                <TouchableOpacity style={styles.headerButton} onPress={clearAllStreams}>
                  <LinearGradient
                    colors={['#ef4444', '#dc2626']}
                    style={styles.headerButtonGradient}
                  >
                    <RotateCcw size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              )}


            <TouchableOpacity
              style={styles.headerButton}
              onPress={toggleControls}
            >
                <LinearGradient colors={['#a855f7', '#9333ea']} style={styles.headerButtonGradient}>
                  {controlsVisible ? (
                    <EyeOff size={20} color="#fff" />
                  ) : (
                    <Eye size={20} color="#fff" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Controls */}
        {controlsVisible && <LayoutControls />}

        {/* Content */}
        <View style={[styles.content, { paddingHorizontal: gridDimensions.padding }]}>
          {renderContent()}
        </View>

        {/* Quick toggle (when controls hidden) */}
        {!controlsVisible && (
          <Animated.View
            style={[styles.quickToggle, { top: insets.top + 60 }, quickToggleAnimatedStyle]}
            entering={SlideInRight.delay(200)}
          >
            <Pressable
              onPress={toggleControls}
              style={({ pressed }) => [
                styles.quickTogglePressable,
                pressed && { transform: [{ scale: 0.9 }] },
              ]}
            >
              <BlurView intensity={80} style={styles.quickToggleBlur}>
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.8)', 'rgba(139, 92, 246, 0.6)']}
                  style={styles.quickToggleGradient}
                >
                  <MoreHorizontal size={16} color="#fff" />
                </LinearGradient>
              </BlurView>
            </Pressable>
          </Animated.View>
        )}
      </View>
    );
  }
);

OptimizedMultiStreamGrid.displayName = 'OptimizedMultiStreamGrid';

interface ControlButtonProps {
  onPress: () => void;
  active?: boolean;
  icon: React.ComponentType<any>;
  label: string;
  destructive?: boolean;
}

const ControlButton: React.FC<ControlButtonProps> = ({
  onPress,
  active,
  icon: Icon,
  label,
  destructive
}) => {
  const buttonScale = useSharedValue(1);

  const handlePress = useCallback(() => {
    HapticFeedback.light();

    // Button press animation
    buttonScale.value = withSpring(0.95, { damping: 20 }, () => {
      buttonScale.value = withSpring(1);
    });

    onPress();
  }, [onPress]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.controlButton,
        active && styles.controlButtonActive,
        destructive && styles.controlButtonDestructive,
        buttonAnimatedStyle,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Icon
        size={16}
        color={
          destructive ? '#f87171' :
            active ? '#fff' : '#b3b3b3'
        }
      />
      <Text
        style={[
          styles.controlButtonText,
          active && styles.controlButtonTextActive,
          destructive && styles.controlButtonTextDestructive,
        ]}
      >
        {label}
      </Text>
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernTheme.colors.background.primary,
  },
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: ModernTheme.colors.border.primary,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.xs,
    marginBottom: 4,
  },
  headerStats: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: ModernTheme.spacing.xs,
    paddingVertical: 2,
    borderRadius: ModernTheme.borderRadius.sm,
  },
  statText: {
    fontSize: ModernTheme.typography.sizes.xs,
    color: ModernTheme.colors.text.secondary,
    fontWeight: ModernTheme.typography.weights.medium,
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
  headerButtons: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  },
  headerButton: {
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  headerButtonGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layoutControls: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: ModernTheme.colors.border.primary,
  },
  controlsGradient: {
    paddingVertical: ModernTheme.spacing.md,
  },
  controlsContent: {
    paddingHorizontal: ModernTheme.spacing.md,
    gap: ModernTheme.spacing.lg,
  },
  controlGroup: {
    minWidth: 100,
  },
  controlGroupLabel: {
    fontSize: ModernTheme.typography.sizes.xs,
    fontWeight: ModernTheme.typography.weights.medium,
    color: ModernTheme.colors.text.tertiary,
    marginBottom: ModernTheme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  controlRow: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.xs,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: ModernTheme.spacing.xs,
  },
  controlButtonActive: {
    backgroundColor: ModernTheme.colors.accent[500],
  },
  controlButtonDestructive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  controlButtonText: {
    fontSize: ModernTheme.typography.sizes.xs,
    fontWeight: ModernTheme.typography.weights.medium,
    color: ModernTheme.colors.text.secondary,
  },
  controlButtonTextActive: {
    color: '#fff',
  },
  controlButtonTextDestructive: {
    color: ModernTheme.colors.error[400],
  },
  content: {
    flex: 1,
    paddingVertical: 2, // Minimal padding
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between', // Distribute streams evenly
    paddingHorizontal: SCREEN_WIDTH < 400 ? 4 : 8, // Responsive padding
  },
  streamCell: {
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  stackContainer: {
    flex: 1,
  },
  stackContent: {
    paddingBottom: ModernTheme.spacing.xl * 4,
    paddingTop: ModernTheme.spacing.sm,
  },
  stackItem: {
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  pipContainer: {
    flex: 1,
  },
  pipMain: {
    marginBottom: ModernTheme.spacing.md,
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  pipSecondary: {
    flexGrow: 0,
  },
  pipSecondaryContent: {
    paddingBottom: ModernTheme.spacing.md,
    paddingHorizontal: ModernTheme.spacing.md,
  },
  pipSecondaryItem: {
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  focusContainer: {
    flex: 1,
  },
  focusMain: {
    marginBottom: ModernTheme.spacing.lg,
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  focusGrid: {
    flexGrow: 0,
  },
  focusGridTitle: {
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.primary,
    marginBottom: ModernTheme.spacing.sm,
  },
  focusGridContent: {
    paddingBottom: ModernTheme.spacing.md,
  },
  focusGridItem: {
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.xl,
  },
  emptyStateBlur: {
    width: '100%',
    maxWidth: 420,
    borderRadius: ModernTheme.borderRadius.xl,
    overflow: 'hidden',
  },
  emptyStateGradient: {
    alignItems: 'center',
    padding: ModernTheme.spacing.xl,
    borderRadius: ModernTheme.borderRadius.xl,
    borderWidth: 1,
    borderColor: ModernTheme.colors.border.secondary,
    width: '100%',
    maxWidth: 400,
  },
  emptyStateTitle: {
    fontSize: ModernTheme.typography.sizes['2xl'],
    fontWeight: ModernTheme.typography.weights.bold,
    color: ModernTheme.colors.text.primary,
    marginTop: ModernTheme.spacing.md,
    marginBottom: ModernTheme.spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: ModernTheme.typography.sizes.md,
    color: ModernTheme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: ModernTheme.spacing.lg,
  },
  emptyStateFeatures: {
    alignItems: 'flex-start',
    gap: ModernTheme.spacing.sm,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
  },
  featureText: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
    fontWeight: ModernTheme.typography.weights.medium,
    flex: 1,
  },
  quickToggle: {
    position: 'absolute',
    right: ModernTheme.spacing.md,
    borderRadius: ModernTheme.borderRadius.full,
    overflow: 'hidden',
    shadowColor: ModernTheme.colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  quickTogglePressable: {
    borderRadius: ModernTheme.borderRadius.full,
    overflow: 'hidden',
  },
  quickToggleBlur: {
    borderRadius: ModernTheme.borderRadius.full,
    overflow: 'hidden',
  },
  quickToggleGradient: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default OptimizedMultiStreamGrid;
