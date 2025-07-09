import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Grid, 
  List, 
  Maximize2, 
  PictureInPicture, 
  Focus, 
  Settings, 
  RotateCcw,
  Save,
  Eye,
  EyeOff
} from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { StreamViewer } from './StreamViewer';
import { TwitchStream } from '@/services/twitchApi';
import { useAppStore } from '@/store/useAppStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type GridType = 'grid' | 'stacked' | 'pip' | 'focus';

interface EnhancedMultiStreamLayoutProps {
  streams: TwitchStream[];
  onStreamRemove: (streamId: string) => void;
  onSaveLayout: () => void;
  onClearAll: () => void;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function EnhancedMultiStreamLayout({
  streams,
  onStreamRemove,
  onSaveLayout,
  onClearAll,
}: EnhancedMultiStreamLayoutProps) {
  const [gridType, setGridType] = useState<GridType>('grid');
  const [gridColumns, setGridColumns] = useState(2);
  const [showControls, setShowControls] = useState(true);
  const [focusedStreamId, setFocusedStreamId] = useState<string | null>(null);
  const [mutedStreams, setMutedStreams] = useState<Set<string>>(new Set());

  const { settings } = useAppStore();

  // Animation values
  const headerOpacity = useSharedValue(1);
  const layoutScale = useSharedValue(1);

  React.useEffect(() => {
    headerOpacity.value = withTiming(showControls ? 1 : 0, { duration: 300 });
  }, [showControls]);

  const getStreamDimensions = useMemo(() => {
    const headerHeight = 140;
    const containerHeight = screenHeight - headerHeight - 100;
    const containerWidth = screenWidth - 24;

    switch (gridType) {
      case 'grid':
        return {
          width: (containerWidth - (gridColumns - 1) * 12) / gridColumns,
          height: ((containerWidth - (gridColumns - 1) * 12) / gridColumns) * (9 / 16),
        };
      case 'stacked':
        return {
          width: containerWidth,
          height: containerHeight / Math.min(streams.length, 3),
        };
      case 'pip':
        return {
          main: {
            width: containerWidth,
            height: containerHeight * 0.75,
          },
          secondary: {
            width: containerWidth * 0.25,
            height: (containerWidth * 0.25) * (9 / 16),
          },
        };
      case 'focus':
        return {
          main: {
            width: containerWidth,
            height: containerHeight * 0.6,
          },
          secondary: {
            width: containerWidth * 0.3,
            height: (containerWidth * 0.3) * (9 / 16),
          },
        };
      default:
        return {
          width: containerWidth / 2,
          height: (containerWidth / 2) * (9 / 16),
        };
    }
  }, [gridType, gridColumns, streams.length]);

  const handleStreamLongPress = useCallback((stream: TwitchStream) => {
    Alert.alert(
      'Stream Options',
      `${stream.title}\n${stream.user_name}`,
      [
        {
          text: 'Set as Focus',
          onPress: () => {
            setFocusedStreamId(stream.id);
            setGridType('focus');
          },
        },
        {
          text: mutedStreams.has(stream.id) ? 'Unmute' : 'Mute',
          onPress: () => {
            const newMutedStreams = new Set(mutedStreams);
            if (mutedStreams.has(stream.id)) {
              newMutedStreams.delete(stream.id);
            } else {
              newMutedStreams.add(stream.id);
            }
            setMutedStreams(newMutedStreams);
          },
        },
        {
          text: 'Remove',
          onPress: () => onStreamRemove(stream.id),
          style: 'destructive',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }, [mutedStreams, onStreamRemove]);

  const renderGridLayout = () => {
    const rows = [];
    for (let i = 0; i < streams.length; i += gridColumns) {
      const rowStreams = streams.slice(i, i + gridColumns);
      rows.push(
        <View key={i} style={styles.gridRow}>
          {rowStreams.map((stream) => (
            <TouchableOpacity
              key={stream.id}
              onLongPress={() => handleStreamLongPress(stream)}
              style={[
                styles.streamContainer,
                {
                  width: getStreamDimensions.width,
                  height: getStreamDimensions.height,
                },
              ]}
            >
              <StreamViewer
                stream={stream}
                onRemove={onStreamRemove}
                width={getStreamDimensions.width}
                height={getStreamDimensions.height}
                muted={mutedStreams.has(stream.id)}
                showControls={false}
              />
              <View style={styles.streamOverlay}>
                <Text style={styles.streamTitle} numberOfLines={1}>
                  {stream.title}
                </Text>
                <View style={styles.streamControls}>
                  <TouchableOpacity
                    style={styles.muteButton}
                    onPress={() => {
                      const newMutedStreams = new Set(mutedStreams);
                      if (mutedStreams.has(stream.id)) {
                        newMutedStreams.delete(stream.id);
                      } else {
                        newMutedStreams.add(stream.id);
                      }
                      setMutedStreams(newMutedStreams);
                    }}
                  >
                    {mutedStreams.has(stream.id) ? (
                      <EyeOff size={16} color="#fff" />
                    ) : (
                      <Eye size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    return rows;
  };

  const renderPiPLayout = () => {
    const mainStream = focusedStreamId 
      ? streams.find(s => s.id === focusedStreamId) || streams[0]
      : streams[0];
    const secondaryStreams = streams.filter(s => s.id !== mainStream?.id);

    return (
      <View style={styles.pipContainer}>
        {/* Main Stream */}
        {mainStream && (
          <TouchableOpacity
            onLongPress={() => handleStreamLongPress(mainStream)}
            style={[
              styles.streamContainer,
              {
                width: getStreamDimensions.main.width,
                height: getStreamDimensions.main.height,
              },
            ]}
          >
            <StreamViewer
              stream={mainStream}
              onRemove={onStreamRemove}
              width={getStreamDimensions.main.width}
              height={getStreamDimensions.main.height}
              muted={mutedStreams.has(mainStream.id)}
              showControls={true}
            />
          </TouchableOpacity>
        )}

        {/* Secondary Streams */}
        {secondaryStreams.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.secondaryStreams}
            contentContainerStyle={styles.secondaryStreamsContent}
          >
            {secondaryStreams.map((stream) => (
              <TouchableOpacity
                key={stream.id}
                onLongPress={() => handleStreamLongPress(stream)}
                onPress={() => setFocusedStreamId(stream.id)}
                style={[
                  styles.streamContainer,
                  styles.secondaryStreamContainer,
                  {
                    width: getStreamDimensions.secondary.width,
                    height: getStreamDimensions.secondary.height,
                  },
                ]}
              >
                <StreamViewer
                  stream={stream}
                  onRemove={onStreamRemove}
                  width={getStreamDimensions.secondary.width}
                  height={getStreamDimensions.secondary.height}
                  muted={true}
                  showControls={false}
                />
                <View style={styles.streamOverlay}>
                  <Text style={styles.streamTitle} numberOfLines={1}>
                    {stream.user_name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderStackedLayout = () => {
    return (
      <ScrollView
        style={styles.stackedContainer}
        showsVerticalScrollIndicator={false}
      >
        {streams.map((stream) => (
          <TouchableOpacity
            key={stream.id}
            onLongPress={() => handleStreamLongPress(stream)}
            style={[
              styles.streamContainer,
              styles.stackedStreamContainer,
              {
                width: getStreamDimensions.width,
                height: getStreamDimensions.height,
              },
            ]}
          >
            <StreamViewer
              stream={stream}
              onRemove={onStreamRemove}
              width={getStreamDimensions.width}
              height={getStreamDimensions.height}
              muted={mutedStreams.has(stream.id)}
              showControls={false}
            />
            <View style={styles.streamOverlay}>
              <Text style={styles.streamTitle} numberOfLines={1}>
                {stream.title}
              </Text>
              <Text style={styles.streamUsername} numberOfLines={1}>
                {stream.user_name}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderLayout = () => {
    switch (gridType) {
      case 'grid':
        return renderGridLayout();
      case 'pip':
      case 'focus':
        return renderPiPLayout();
      case 'stacked':
        return renderStackedLayout();
      default:
        return renderGridLayout();
    }
  };

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      {
        translateY: interpolate(headerOpacity.value, [0, 1], [-50, 0]),
      },
    ],
  }));

  const layoutOptions = [
    { id: 'grid', name: 'Grid', icon: Grid },
    { id: 'stacked', name: 'Stack', icon: List },
    { id: 'pip', name: 'PiP', icon: PictureInPicture },
    { id: 'focus', name: 'Focus', icon: Focus },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f0f0f', '#1a1a1a', '#0f0f0f']}
        style={styles.background}
      />

      {/* Header Controls */}
      {showControls && (
        <Animated.View style={[styles.header, animatedHeaderStyle]}>
          <LinearGradient
            colors={['rgba(26, 26, 26, 0.98)', 'rgba(15, 15, 15, 0.95)']}
            style={styles.headerGradient}
          >
            <View style={styles.headerTop}>
              <View style={styles.headerTitle}>
                <Text style={styles.title}>Multi-Stream</Text>
                <Text style={styles.subtitle}>
                  {streams.length} stream{streams.length !== 1 ? 's' : ''} active
                </Text>
              </View>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => setShowControls(false)}
              >
                <Settings size={20} color="#8B5CF6" />
              </TouchableOpacity>
            </View>

            <View style={styles.controls}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.layoutControls}
              >
                {layoutOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <AnimatedTouchableOpacity
                      key={option.id}
                      style={[
                        styles.layoutButton,
                        gridType === option.id && styles.activeLayoutButton,
                      ]}
                      onPress={() => setGridType(option.id as GridType)}
                    >
                      <LinearGradient
                        colors={
                          gridType === option.id
                            ? ['#8B5CF6', '#7C3AED']
                            : ['rgba(42, 42, 42, 0.8)', 'rgba(58, 58, 58, 0.8)']
                        }
                        style={styles.layoutGradient}
                      >
                        <IconComponent
                          size={16}
                          color={gridType === option.id ? '#fff' : '#666'}
                        />
                        <Text
                          style={[
                            styles.layoutButtonText,
                            gridType === option.id && styles.activeLayoutButtonText,
                          ]}
                        >
                          {option.name}
                        </Text>
                      </LinearGradient>
                    </AnimatedTouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.actionButtons}>
                {gridType === 'grid' && (
                  <View style={styles.columnControls}>
                    <TouchableOpacity
                      style={styles.columnButton}
                      onPress={() => setGridColumns(Math.max(1, gridColumns - 1))}
                    >
                      <Text style={styles.columnButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.columnText}>{gridColumns}</Text>
                    <TouchableOpacity
                      style={styles.columnButton}
                      onPress={() => setGridColumns(Math.min(4, gridColumns + 1))}
                    >
                      <Text style={styles.columnButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity style={styles.actionButton} onPress={onSaveLayout}>
                  <LinearGradient
                    colors={['#22C55E', '#16A34A']}
                    style={styles.actionGradient}
                  >
                    <Save size={16} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={onClearAll}>
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    style={styles.actionGradient}
                  >
                    <RotateCcw size={16} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Floating Toggle Button */}
      {!showControls && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setShowControls(true)}
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.floatingGradient}
          >
            <Maximize2 size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Stream Layout */}
      <View style={[styles.layoutContainer, { paddingTop: showControls ? 140 : 20 }]}>
        {streams.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Streams Active</Text>
            <Text style={styles.emptySubtitle}>
              Add streams from the discover tab to get started
            </Text>
          </View>
        ) : (
          renderLayout()
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#999',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  layoutControls: {
    flex: 1,
    marginRight: 16,
  },
  layoutButton: {
    marginRight: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  activeLayoutButton: {
    // Additional styling for active state
  },
  layoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  layoutButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#666',
  },
  activeLayoutButtonText: {
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  columnControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 42, 42, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 8,
  },
  columnButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
  },
  columnText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#fff',
    minWidth: 16,
    textAlign: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  actionGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    zIndex: 100,
  },
  floatingGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layoutContainer: {
    flex: 1,
    padding: 12,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  streamContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  streamOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streamTitle: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#fff',
  },
  streamUsername: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#ccc',
  },
  streamControls: {
    flexDirection: 'row',
    gap: 8,
  },
  muteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipContainer: {
    flex: 1,
  },
  secondaryStreams: {
    marginTop: 12,
  },
  secondaryStreamsContent: {
    gap: 12,
  },
  secondaryStreamContainer: {
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  stackedContainer: {
    flex: 1,
  },
  stackedStreamContainer: {
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666',
    textAlign: 'center',
  },
});