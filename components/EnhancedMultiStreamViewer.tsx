import { MotiView, AnimatePresence } from 'moti';
import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  Platform,
  TextInput,
  Modal,
  FlatList,
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
  Maximize,
  RotateCcw,
  Shuffle,
  Play,
  Pause,
  Search,
  X,
  Monitor,
  Minimize,
  MoreHorizontal,
  Headphones,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { TwitchStream, searchStreams, fetchTopStreams } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';
import { WorkingTwitchPlayer } from './WorkingTwitchPlayer';
import { logError, logDebug, withSyncErrorHandling } from '@/utils/errorHandler';
import { FlatGrid } from 'react-native-super-grid';

interface EnhancedMultiStreamViewerProps {
  streams: TwitchStream[];
  onAddStream?: (stream: TwitchStream) => void;
  onRemoveStream?: (streamId: string) => void;
  maxStreams?: number;
}

type GridLayout = '1x1' | '2x2' | '3x3' | '4x4';
type ViewMode = 'grid' | 'pip' | 'focus';

interface AudioState {
  activeStreamId: string | null;
  globalMute: boolean;
  volume: number;
}

interface StreamSearchResult {
  streams: TwitchStream[];
  loading: boolean;
  error: string | null;
}

const EnhancedMultiStreamViewerComponent: React.FC<EnhancedMultiStreamViewerProps> = ({
  streams,
  onAddStream,
  onRemoveStream,
  maxStreams = 9,
}) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // State management
  const [gridLayout, setGridLayout] = useState<GridLayout>('2x2');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [audioState, setAudioState] = useState<AudioState>({
    activeStreamId: null,
    globalMute: false,
    volume: 0.8,
  });
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [focusedStreamId, setFocusedStreamId] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StreamSearchResult>({
    streams: [],
    loading: false,
    error: null,
  });
  const [pipStream, setPipStream] = useState<TwitchStream | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(1);
  const controlsScale = useSharedValue(1);

  // Calculate grid dimensions with memoization
  const gridDimensions = useMemo(() => {
    const padding = ModernTheme.spacing.md;
    const headerHeight = viewMode === 'focus' ? 80 : 120;
    const controlsHeight = viewMode === 'focus' ? 60 : 80;
    const availableWidth = screenWidth - padding * 2;
    const availableHeight = screenHeight - headerHeight - controlsHeight - padding * 2;

    let columns: number;
    let rows: number;

    if (viewMode === 'focus' && focusedStreamId) {
      columns = 1;
      rows = 1;
    } else {
      switch (gridLayout) {
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
        case '4x4':
          columns = 4;
          rows = 4;
          break;
        default:
          columns = 2;
          rows = 2;
      }
    }

    const itemSpacing = ModernTheme.spacing.sm;
    const itemWidth = (availableWidth - itemSpacing * (columns - 1)) / columns;
    const itemHeight = (availableHeight - itemSpacing * (rows - 1)) / rows;

    return {
      itemWidth: Math.floor(itemWidth),
      itemHeight: Math.floor(itemHeight),
      columns,
      rows,
      maxItems: columns * rows,
    };
  }, [gridLayout, viewMode, focusedStreamId, screenWidth, screenHeight]);

  // Handle stream audio toggle
  const handleStreamAudioToggle = useCallback((streamId: string) => {
    withSyncErrorHandling(
      () => {
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
      },
      { component: 'EnhancedMultiStreamViewer', action: 'handleStreamAudioToggle' }
    );
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
    setSelectedStreamId(prev => (prev === streamId ? null : streamId));
  }, []);

  // Handle stream removal
  const handleStreamRemove = useCallback(
    (streamId: string) => {
      withSyncErrorHandling(
        () => {
          logDebug('Removing stream', { streamId });
          Alert.alert('Remove Stream', 'Are you sure you want to remove this stream?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: () => {
                withSyncErrorHandling(
                  () => {
                    onRemoveStream?.(streamId);
                    if (audioState.activeStreamId === streamId) {
                      setAudioState(prev => ({ ...prev, activeStreamId: null }));
                    }
                    if (selectedStreamId === streamId) {
                      setSelectedStreamId(null);
                    }
                    logDebug('Stream removed successfully', { streamId });
                  },
                  { component: 'EnhancedMultiStreamViewer', action: 'removeStreamConfirm' }
                );
              },
            },
          ]);
        },
        { component: 'EnhancedMultiStreamViewer', action: 'handleStreamRemove' }
      );
    },
    [onRemoveStream, audioState.activeStreamId, selectedStreamId]

  // Handle layout change
  const handleLayoutChange = useCallback((layout: GridLayout) => {
    controlsScale.value = withSpring(0.9, { damping: 15 }, () => {
      controlsScale.value = withSpring(1);
    });
    setGridLayout(layout);
  }, []);

  // Handle stream search
  const handleStreamSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ streams: [], loading: false, error: null });
      return;
    }

    setSearchResults(prev => ({ ...prev, loading: true, error: null }));

    try {
      const results = await searchStreams(query, 20);
      setSearchResults({
        streams: results.data,
        loading: false,
        error: null,
      });
    } catch (error) {
      setSearchResults({
        streams: [],
        loading: false,
        error: 'Failed to search streams',
      });
    }
  }, []);

  // Handle add stream from search
  const handleAddStreamFromSearch = useCallback(
    (stream: TwitchStream) => {
      if (streams.length >= maxStreams) {
        Alert.alert('Maximum Streams', `You can only have ${maxStreams} streams at once.`);
        return;
      }

    onAddStream?.(stream);
      setShowSearchModal(false);
      setSearchQuery('');
      setSearchResults({ streams: [], loading: false, error: null });
    },
    [streams.length, maxStreams, onAddStream]
  );

  // Handle focus mode
  const handleFocusStream = useCallback(
    (streamId: string) => {
      if (viewMode === 'focus' && focusedStreamId === streamId) {
        setViewMode('grid');
        setFocusedStreamId(null);
      } else {
        setViewMode('focus');
        setFocusedStreamId(streamId);
      }
    },
    [viewMode, focusedStreamId]
  );

  // Handle picture-in-picture
  const handleTogglePiP = useCallback(
    (stream: TwitchStream) => {
      if (pipStream?.id === stream.id) {
        setPipStream(null);
        setViewMode('grid');
      } else {
        setPipStream(stream);
        setViewMode('pip');
      }
    },
    [pipStream]
  );

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    if (mode !== 'focus') {
      setFocusedStreamId(null);
    }
    if (mode !== 'pip') {
      setPipStream(null);
    }
  }, []);

  // Handle volume change
  const handleVolumeChange = useCallback((volume: number) => {
    setAudioState(prev => ({ ...prev, volume }));
  }, []);

  // Handle play/pause all
  const handlePlayPauseAll = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Get streams to display based on view mode with memoization
  const displayStreams = useMemo(() => {
    if (viewMode === 'focus' && focusedStreamId) {
      const focusedStream = streams.find(s => s.id === focusedStreamId);
      return focusedStream ? [focusedStream] : [];
    }
    return streams;
  }, [streams, viewMode, focusedStreamId]);

  // Memoize total viewers calculation
  const totalViewers = useMemo(() => {
    return streams.reduce((sum, stream) => sum + (stream.viewer_count || 0), 0);
  }, [streams]);

  // Prepare grid data with memoization
  const gridData = useMemo(() => {
    const maxItems = gridDimensions.maxItems;
    const data = [...displayStreams.slice(0, maxItems)];

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
  }, [displayStreams, gridDimensions.maxItems, maxStreams]);

  // Animated styles
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const controlsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: controlsScale.value }],
  }));

  // Render grid item with memoization
  const renderGridItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      if (item.type === 'add') {
        return (
          <AddStreamButton
            width={gridDimensions.itemWidth}
            height={gridDimensions.itemHeight}
            onPress={() => setShowSearchModal(true)}
          />
        );
      }

      const isActive = selectedStreamId === item.id;
      const isMuted = audioState.globalMute || audioState.activeStreamId !== item.id;

    return (
        <MemoizedWorkingTwitchPlayer
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
    },
    [
      gridDimensions.itemWidth,
      gridDimensions.itemHeight,
      selectedStreamId,
      audioState.globalMute,
      audioState.activeStreamId,
      showControls,
      handleStreamPress,
      handleStreamAudioToggle,
      handleStreamRemove,
    ]

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.95)', 'rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.4)']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>
                {viewMode === 'focus'
                  ? '🎯 Focus Mode'
                  : viewMode === 'pip'
                    ? '📺 Picture-in-Picture'
                    : '🎮 Multi-Stream Viewer'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {streams.length} of {maxStreams} streams • {totalViewers.toLocaleString()} viewers
                {audioState.activeStreamId &&
                  ` • 🔊 ${streams.find(s => s.id === audioState.activeStreamId)?.user_name || 'Unknown'}`}
              </Text>
            </View>

            <View style={styles.headerRight}>
              {/* View Mode Toggle */}
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowSettings(!showSettings)}
              >
                <LinearGradient
                  colors={[ModernTheme.colors.secondary[600], ModernTheme.colors.secondary[500]]}
                  style={styles.headerButtonGradient}
                >
                  <Settings size={18} color={ModernTheme.colors.text.primary} />
                </LinearGradient>
              </TouchableOpacity>

              {/* Audio Control */}
              <TouchableOpacity style={styles.headerButton} onPress={handleGlobalMuteToggle}>
                <LinearGradient
                  colors={
                    audioState.globalMute
                      ? [ModernTheme.colors.error[600], ModernTheme.colors.error[500]]
                      : [ModernTheme.colors.primary[600], ModernTheme.colors.primary[500]]
                  }
                  style={styles.headerButtonGradient}
                >
                  {audioState.globalMute ? (
                    <VolumeX size={18} color={ModernTheme.colors.text.primary} />
                  ) : (
                    <Headphones size={18} color={ModernTheme.colors.text.primary} />
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Add Stream */}
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowSearchModal(true)}
              >
                <LinearGradient
                  colors={[ModernTheme.colors.success[600], ModernTheme.colors.success[500]]}
                  style={styles.headerButtonGradient}
                >
                  <Search size={18} color={ModernTheme.colors.text.primary} />
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

      {/* Picture-in-Picture */}
      {viewMode === 'pip' && pipStream && (
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          style={styles.pipContainer}
        >
          <WorkingTwitchPlayer
            stream={pipStream}
            width={200}
            height={120}
            isActive
            isMuted={audioState.globalMute || audioState.activeStreamId !== pipStream.id}
            onPress={() => handleTogglePiP(pipStream)}
            onMuteToggle={() => handleStreamAudioToggle(pipStream.id)}
            onRemove={() => handleStreamRemove(pipStream.id)}
            showControls
          />
        </MotiView>
      )}

      {/* Controls */}
      <Animated.View style={[styles.controls, controlsStyle]}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.7)']}
          style={styles.controlsGradient}
        >
          <View style={styles.controlsContent}>
            {/* Layout Controls */}
            <View style={styles.controlSection}>
              <Text style={styles.controlsLabel}>📐 Layout Grid</Text>
              <View style={styles.layoutButtons}>
                {(['1x1', '2x2', '3x3', '4x4'] as GridLayout[]).map(layout => {
                  const isActive = gridLayout === layout;
                  const IconComponent = {
                    '1x1': Square,
                    '2x2': Grid2X2,
                    '3x3': Grid3X3,
                    '4x4': Grid3X3,
                  }[layout];

                  return (
                    <MotiView
                      key={layout}
                      animate={{
                        scale: isActive ? 1.05 : 1,
                        opacity: isActive ? 1 : 0.8,
                      }}
                      transition={{
                        type: 'spring',
                        damping: 15,
                        stiffness: 150,
                      }}
                    >
                      <TouchableOpacity
                        style={[styles.layoutButton, isActive && styles.layoutButtonActive]}
                        onPress={() => handleLayoutChange(layout)}
                      >
                        <LinearGradient
                          colors={
                            isActive
                              ? [ModernTheme.colors.primary[600], ModernTheme.colors.primary[500]]
                              : [ModernTheme.colors.gray[700], ModernTheme.colors.gray[600]]
                          }
                          style={[
                            styles.layoutButtonGradient,
                            isActive && { borderColor: ModernTheme.colors.primary[400] },
                          ]}
                        >
                          <IconComponent size={18} color={ModernTheme.colors.text.primary} />
                          <Text
                            style={[styles.layoutButtonText, isActive && { fontWeight: '700' }]}
                          >
                            {layout}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </MotiView>
                  );
                })}
              </View>
            </View>

            {/* View Mode Controls */}
            <View style={styles.controlSection}>
              <Text style={styles.controlsLabel}>👁️ View Mode</Text>
              <View style={styles.viewModeButtons}>
                {(['grid', 'focus', 'pip'] as ViewMode[]).map(mode => {
                  const isActive = viewMode === mode;
                  const IconComponent = {
                    grid: Grid3X3,
                    focus: Maximize,
                    pip: Monitor,
                  }[mode];
                  const modeLabels = {
                    grid: 'Grid',
                    focus: 'Focus',
                    pip: 'PiP',
                  };

                  return (
                    <MotiView
                      key={mode}
                      animate={{
                        scale: isActive ? 1.05 : 1,
                        opacity: isActive ? 1 : 0.8,
                      }}
                      transition={{
                        type: 'spring',
                        damping: 15,
                        stiffness: 150,
                      }}
                    >
                      <TouchableOpacity
                        style={[styles.viewModeButton, isActive && styles.viewModeButtonActive]}
                        onPress={() => handleViewModeChange(mode)}
                      >
                        <LinearGradient
                          colors={
                            isActive
                              ? [ModernTheme.colors.accent[600], ModernTheme.colors.accent[500]]
                              : [ModernTheme.colors.gray[700], ModernTheme.colors.gray[600]]
                          }
                          style={[
                            styles.viewModeButtonGradient,
                            isActive && { borderColor: ModernTheme.colors.accent[400] },
                          ]}
                        >
                          <IconComponent size={18} color={ModernTheme.colors.text.primary} />
                          <Text
                            style={[styles.viewModeButtonText, isActive && { fontWeight: '700' }]}
                          >
                            {modeLabels[mode]}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </MotiView>
                  );
                })}
              </View>
            </View>

            {/* Playback Controls */}
            <View style={styles.controlSection}>
              <Text style={styles.controlsLabel}>🎮 Controls</Text>
              <View style={styles.playbackControls}>
                <MotiView
                  animate={{
                    scale: isPlaying ? 1.05 : 1,
                  }}
                  transition={{
                    type: 'spring',
                    damping: 15,
                  }}
                >
                  <TouchableOpacity style={styles.playbackButton} onPress={handlePlayPauseAll}>
                    <LinearGradient
                      colors={
                        isPlaying
                          ? [ModernTheme.colors.success[600], ModernTheme.colors.success[500]]
                          : [ModernTheme.colors.error[600], ModernTheme.colors.error[500]]
                      }
                      style={styles.playbackButtonGradient}
                    >
                      {isPlaying ? (
                        <Pause size={22} color={ModernTheme.colors.text.primary} />
                      ) : (
                        <Play size={22} color={ModernTheme.colors.text.primary} />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </MotiView>

                <MotiView
                  animate={{
                    scale: showControls ? 1.05 : 1,
                    opacity: showControls ? 1 : 0.8,
                  }}
                  transition={{
                    type: 'spring',
                    damping: 15,
                  }}
                >
                  <TouchableOpacity
                    style={styles.playbackButton}
                    onPress={() => setShowControls(!showControls)}
                  >
                    <LinearGradient
                      colors={
                        showControls
                          ? [ModernTheme.colors.primary[600], ModernTheme.colors.primary[500]]
                          : [ModernTheme.colors.gray[700], ModernTheme.colors.gray[600]]
                      }
                      style={styles.playbackButtonGradient}
                    >
                      <MoreHorizontal size={20} color={ModernTheme.colors.text.primary} />
                    </LinearGradient>
                  </TouchableOpacity>
                </MotiView>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[
              ModernTheme.colors.background.primary,
              ModernTheme.colors.background.secondary,
            ]}
            style={styles.modalGradient}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={[ModernTheme.colors.primary[900], ModernTheme.colors.background.primary]}
                style={styles.modalHeaderGradient}
              >
                <Text style={styles.modalTitle}>🔍 Add New Stream</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowSearchModal(false)}
                >
                  <LinearGradient
                    colors={[ModernTheme.colors.error[600], ModernTheme.colors.error[500]]}
                    style={styles.closeButtonGradient}
                  >
                    <X size={20} color={ModernTheme.colors.text.primary} />
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputWrapper}>
                <Search
                  size={18}
                  color={ModernTheme.colors.text.secondary}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for streams, games, or streamers..."
                  placeholderTextColor={ModernTheme.colors.text.secondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={() => handleStreamSearch(searchQuery)}
                  autoFocus
                />
              </View>
              <MotiView
                animate={{
                  scale: searchQuery.trim() ? 1 : 0.95,
                  opacity: searchQuery.trim() ? 1 : 0.6,
                }}
                transition={{
                  type: 'spring',
                  damping: 15,
                }}
              >
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={() => handleStreamSearch(searchQuery)}
                  disabled={!searchQuery.trim() || searchResults.loading}
                >
                  <LinearGradient
                    colors={
                      searchQuery.trim()
                        ? [ModernTheme.colors.primary[600], ModernTheme.colors.primary[500]]
                        : [ModernTheme.colors.gray[700], ModernTheme.colors.gray[600]]
                    }
                    style={styles.searchButtonGradient}
                  >
                    <Search size={20} color={ModernTheme.colors.text.primary} />
                  </LinearGradient>
                </TouchableOpacity>
              </MotiView>
            </View>

            {/* Search Results */}
            <View style={styles.searchResults}>
              {searchResults.loading ? (
                <MotiView
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                >
                  <View style={styles.searchLoading}>
                    <Text style={styles.searchLoadingText}>🔍 Searching streams...</Text>
                  </View>
                </MotiView>
              ) : searchResults.error ? (
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'spring', damping: 15 }}
                >
                  <View style={styles.searchError}>
                    <Text style={styles.searchErrorText}>❌ {searchResults.error}</Text>
                  </View>
                </MotiView>
              ) : (
                <FlatList
                  data={searchResults.streams}
                  keyExtractor={item => item.id}
                  renderItem={({ item, index }) => (
                    <MotiView
                      from={{ opacity: 0, translateX: -50 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{
                        type: 'spring',
                        damping: 15,
                        delay: index * 100
                      }}
                    >
                      <TouchableOpacity
                        style={styles.searchResultItem}
                        onPress={() => handleAddStreamFromSearch(item)}
                      >
                        <LinearGradient
                          colors={[
                            ModernTheme.colors.background.secondary,
                            ModernTheme.colors.background.primary,
                          ]}
                          style={styles.searchResultGradient}
                        >
                          <View style={styles.searchResultContent}>
                            <Text style={styles.searchResultTitle}>📺 {item.user_name}</Text>
                            <Text style={styles.searchResultSubtitle}>
                              🎮 {item.game_name} • 👥 {item.viewer_count?.toLocaleString()} viewers
                            </Text>
                          </View>
                          <Plus size={20} color={ModernTheme.colors.primary[500]} />
                        </LinearGradient>
                      </TouchableOpacity>
                    </MotiView>
                  )}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          </LinearGradient>
        </View>
      </Modal>
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
  pipContainer: {
    position: 'absolute',
    top: 120,
    right: 20,
    zIndex: 999,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  controls: {
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  controlsGradient: {
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.md,
  },
  controlsContent: {
    gap: ModernTheme.spacing.lg,
  },
  controlSection: {
    alignItems: 'center',
  },
  controlsLabel: {
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.secondary,
    marginBottom: ModernTheme.spacing.sm,
  },
  layoutLabel: {
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.secondary,
    marginBottom: ModernTheme.spacing.sm,
    textAlign: 'center',
  },
  viewModeLabel: {
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.secondary,
    marginBottom: ModernTheme.spacing.sm,
    textAlign: 'center',
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
  viewModeButtons: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  },
  viewModeButton: {
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  viewModeButtonActive: {
    transform: [{ scale: 1.05 }],
  },
  viewModeButtonGradient: {
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 60,
  },
  viewModeButtonText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.xs,
    fontWeight: ModernTheme.typography.weights.medium,
    marginTop: 2,
  },
  playbackControls: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.md,
  },
  playbackButton: {
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  playbackButtonGradient: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  modalHeader: {
    borderBottomWidth: 1,
    borderBottomColor: ModernTheme.colors.border.primary,
  },
  modalHeaderGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.lg,
    paddingVertical: ModernTheme.spacing.md,
  },
  closeButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: ModernTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: ModernTheme.typography.sizes.xl,
    fontWeight: ModernTheme.typography.weights.bold,
    color: ModernTheme.colors.text.primary,
  },
  modalCloseButton: {
    padding: ModernTheme.spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: ModernTheme.spacing.lg,
    paddingVertical: ModernTheme.spacing.md,
    gap: ModernTheme.spacing.md,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ModernTheme.colors.background.secondary,
    borderRadius: ModernTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: ModernTheme.colors.border.primary,
    paddingHorizontal: ModernTheme.spacing.md,
  },
  searchIcon: {
    marginRight: ModernTheme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: ModernTheme.spacing.md,
    fontSize: ModernTheme.typography.sizes.md,
    color: ModernTheme.colors.text.primary,
  },
  searchButton: {
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  searchButtonGradient: {
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: ModernTheme.spacing.lg,
  },
  searchLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchLoadingText: {
    fontSize: ModernTheme.typography.sizes.md,
    color: ModernTheme.colors.text.secondary,
  },
  searchError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchErrorText: {
    fontSize: ModernTheme.typography.sizes.md,
    color: ModernTheme.colors.error[500],
    textAlign: 'center',
  },
  searchResultItem: {
    borderRadius: ModernTheme.borderRadius.md,
    marginBottom: ModernTheme.spacing.sm,
    overflow: 'hidden',
  },
  searchResultGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ModernTheme.spacing.md,
    paddingHorizontal: ModernTheme.spacing.md,
    borderWidth: 1,
    borderColor: ModernTheme.colors.border.primary,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.primary,
    marginBottom: 4,
  },
  searchResultSubtitle: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
  },
});

// Memoized components for performance
const MemoizedWorkingTwitchPlayer = memo(WorkingTwitchPlayer);

const AddStreamButton = memo(
  ({ width, height, onPress }: { width: number; height: number; onPress: () => void }) => (
    <TouchableOpacity style={[styles.addStreamContainer, { width, height }]} onPress={onPress}>
      <LinearGradient
        colors={ModernTheme.colors.gradients.primary}
        style={styles.addStreamGradient}
      >
        <Plus size={32} color={ModernTheme.colors.text.primary} />
        <Text style={styles.addStreamText}>Add Stream</Text>
      </LinearGradient>
    </TouchableOpacity>
  )
);

// Memoize the main component
export const EnhancedMultiStreamViewer = memo(EnhancedMultiStreamViewerComponent);

export default EnhancedMultiStreamViewer;
