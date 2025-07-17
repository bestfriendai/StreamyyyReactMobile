import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  FlatList,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  Search,
  Filter,
  TrendingUp,
  Eye,
  Play,
  Grid3X3,
  List,
  X,
  Sparkles,
  Users,
  Clock,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  SlideInDown,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { TwitchStream, TwitchGame } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';
import { StreamPreviewCard } from './StreamPreviewCard';
import { HapticFeedback } from '@/utils/haptics';

interface CleanDiscoverScreenProps {
  streams: TwitchStream[];
  games: TwitchGame[];
  onStreamSelect: (stream: TwitchStream) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  onAddStream: (stream: TwitchStream) => Promise<{ success: boolean; message: string }>;
  onToggleFavorite: (userId: string) => void;
  isFavorite: (userId: string) => boolean;
  isStreamActive: (streamId: string) => boolean;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'viewers' | 'recent' | 'alphabetical';

interface SearchFilters {
  query: string;
  sortBy: SortBy;
  minViewers: number;
}

export const CleanDiscoverScreen: React.FC<CleanDiscoverScreenProps> = ({
  streams = [],
  games = [],
  onStreamSelect,
  onRefresh,
  isLoading = false,
  onLoadMore,
  hasMore = false,
  onAddStream,
  onToggleFavorite,
  isFavorite,
  isStreamActive,
}) => {
  const { width: screenWidth } = Dimensions.get('window');

  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    sortBy: 'viewers',
    minViewers: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const searchBarScale = useSharedValue(1);
  const filtersHeight = useSharedValue(0);
  const sparkleRotation = useSharedValue(0);
  const headerOffset = useSharedValue(0);

  // Sparkle animation
  React.useEffect(() => {
    sparkleRotation.value = withRepeat(
      withSequence(withTiming(360, { duration: 2000 }), withTiming(0, { duration: 0 })),
      -1
    );
  }, []);

  // Calculate grid dimensions
  const getGridDimensions = useCallback(() => {
    const padding = ModernTheme.spacing.md;
    const itemSpacing = ModernTheme.spacing.sm;
    const columns = viewMode === 'grid' ? 2 : 1;
    const availableWidth = screenWidth - padding * 2;
    const itemWidth = (availableWidth - itemSpacing * (columns - 1)) / columns;
    const itemHeight = viewMode === 'grid' ? itemWidth * 0.75 : itemWidth * 0.4;

    return {
      itemWidth,
      itemHeight,
      columns,
      spacing: itemSpacing,
    };
  }, [screenWidth, viewMode]);

  const gridDimensions = getGridDimensions();

  // Filter and sort streams
  const filteredStreams = useMemo(() => {
    const filtered = streams.filter(stream => {
      const matchesQuery = !searchFilters.query || 
        stream.user_name.toLowerCase().includes(searchFilters.query.toLowerCase()) ||
        stream.game_name.toLowerCase().includes(searchFilters.query.toLowerCase());
      
      const matchesViewers = stream.viewer_count >= searchFilters.minViewers;
      
      return matchesQuery && matchesViewers;
    });

    // Sort streams
    switch (searchFilters.sortBy) {
      case 'viewers':
        filtered.sort((a, b) => b.viewer_count - a.viewer_count);
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.user_name.localeCompare(b.user_name));
        break;
      case 'recent':
        filtered.sort(
          (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        );
        break;
    }

    return filtered;
  }, [streams, searchFilters]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  }, [onRefresh]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    searchBarScale.value = withSpring(0.95, { damping: 15 }, () => {
      searchBarScale.value = withSpring(1);
    });

    // Haptic feedback for search
    if (query.length === 1) {
      HapticFeedback.light();
    }

    setSearchFilters(prev => ({ ...prev, query }));
  }, []);

  // Toggle filters
  const toggleFilters = useCallback(() => {
    HapticFeedback.medium();
    setShowFilters(!showFilters);
    filtersHeight.value = withTiming(showFilters ? 0 : 140, { duration: 300 });
  }, [showFilters]);

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    HapticFeedback.light();
    setViewMode(mode);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((sort: SortBy) => {
    HapticFeedback.light();
    setSearchFilters(prev => ({ ...prev, sortBy: sort }));
  }, []);

  // Animated styles
  const searchBarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchBarScale.value }],
  }));

  const filtersStyle = useAnimatedStyle(() => ({
    height: filtersHeight.value,
    opacity: filtersHeight.value / 140,
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotation.value}deg` }],
  }));

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerOffset.value }],
  }));

  // Render stream item
  const renderStreamItem = useCallback(
    ({ item: stream, index }: { item: TwitchStream; index: number }) => {
      return (
        <Animated.View
          entering={FadeIn.delay(index * 50)}
          style={[
            styles.streamItem,
            {
              width: gridDimensions.itemWidth,
              height: gridDimensions.itemHeight,
              marginBottom: gridDimensions.spacing,
              marginRight: viewMode === 'grid' && index % 2 === 0 ? gridDimensions.spacing : 0,
            },
          ]}
        >
          <StreamPreviewCard
            stream={stream}
            width={gridDimensions.itemWidth}
            height={gridDimensions.itemHeight}
            onPress={() => onStreamSelect(stream)}
            onAddStream={async () => {
              const result = await onAddStream(stream);
              // Could show a toast or alert here based on result
            }}
            onToggleFavorite={() => onToggleFavorite(stream.user_id)}
            isFavorite={isFavorite(stream.user_id)}
            isActive={isStreamActive(stream.id)}
          />
        </Animated.View>
      );
    },
    [
      gridDimensions,
      viewMode,
      onStreamSelect,
      onAddStream,
      onToggleFavorite,
      isFavorite,
      isStreamActive,
    ]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.95)', 'rgba(0, 0, 0, 0.8)']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Discover</Text>
              <Animated.View style={sparkleStyle}>
                <Sparkles size={24} color={ModernTheme.colors.primary[400]} />
              </Animated.View>
            </View>
            <Text style={styles.headerSubtitle}>
              {filteredStreams.length} live streams • {games.length} trending games
            </Text>

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <View style={styles.statItem}>
                <Users size={14} color={ModernTheme.colors.text.secondary} />
                <Text style={styles.statText}>
                  {filteredStreams
                    .reduce((sum, stream) => sum + stream.viewer_count, 0)
                    .toLocaleString()}{' '}
                  viewers
                </Text>
              </View>
              <View style={styles.statItem}>
                <TrendingUp size={14} color={ModernTheme.colors.success[500]} />
                <Text style={styles.statText}>Live now</Text>
              </View>
            </View>
          </View>

          {/* Search Bar */}
          <Animated.View style={[styles.searchContainer, searchBarStyle]}>
            <View style={styles.searchBar}>
              <Search size={20} color={ModernTheme.colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search streams or games..."
                placeholderTextColor={ModernTheme.colors.text.secondary}
                value={searchFilters.query}
                onChangeText={handleSearch}
              />
              {searchFilters.query.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <X size={20} color={ModernTheme.colors.text.secondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <TouchableOpacity
                style={[styles.controlButton, showFilters && styles.controlButtonActive]}
                onPress={toggleFilters}
              >
                <Filter size={18} color={ModernTheme.colors.text.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlButton, viewMode === 'grid' && styles.controlButtonActive]}
                onPress={() => handleViewModeChange('grid')}
                accessibilityLabel="Grid view"
                accessibilityRole="button"
              >
                <Grid3X3
                  size={18}
                  color={viewMode === 'grid' ? '#000' : ModernTheme.colors.text.primary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlButton, viewMode === 'list' && styles.controlButtonActive]}
                onPress={() => handleViewModeChange('list')}
                accessibilityLabel="List view"
                accessibilityRole="button"
              >
                <List
                  size={18}
                  color={viewMode === 'list' ? '#000' : ModernTheme.colors.text.primary}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Filters Panel */}
          <Animated.View style={[styles.filtersPanel, filtersStyle]}>
            <View style={styles.filtersContent}>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Sort by:</Text>
                <View style={styles.filterButtons}>
                  {(['viewers', 'recent', 'alphabetical'] as SortBy[]).map(sort => {
                    const isActive = searchFilters.sortBy === sort;
                    const icon =
                      sort === 'viewers' ? (
                        <Eye
                          size={12}
                          color={isActive ? '#000' : ModernTheme.colors.text.secondary}
                        />
                      sort === 'recent' ? <Clock size={12} color={isActive ? '#000' : ModernTheme.colors.text.secondary} /> :
                        <TrendingUp size={12} color={isActive ? '#000' : ModernTheme.colors.text.secondary} />;

                    return (
                      <TouchableOpacity
                        key={sort}
                        style={[styles.filterButton, isActive && styles.filterButtonActive]}
                        onPress={() => handleSortChange(sort)}
                        accessibilityLabel={`Sort by ${sort}`}
                        accessibilityRole="button"
                      >
                        <View style={styles.filterButtonContent}>
                          {icon}
                          <Text
                            style={[
                              styles.filterButtonText,
                              isActive && styles.filterButtonTextActive,
                            ]}
                          >
                            {sort === 'viewers' ? 'Viewers' : sort === 'recent' ? 'Recent' : 'A-Z'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isLoading && filteredStreams.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Animated.View entering={SlideInDown.delay(200)}>
              <ActivityIndicator size="large" color={ModernTheme.colors.primary[500]} />
              <Text style={styles.loadingText}>Discovering amazing streams...</Text>
              <Text style={styles.loadingSubtext}>Hang tight while we find the best content</Text>
            </Animated.View>
          </View>
        ) : filteredStreams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Animated.View entering={SlideInDown.delay(200)} style={styles.emptyContent}>
              <Search size={48} color={ModernTheme.colors.text.secondary} />
              <Text style={styles.emptyTitle}>No streams found</Text>
              <Text style={styles.emptySubtitle}>
                {searchFilters.query
                  ? `No results for "${searchFilters.query}"`
                  : 'Try adjusting your filters or refreshing'}
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => {
                  setSearchFilters({ query: '', sortBy: 'viewers', minViewers: 0 });
                  handleRefresh();
                }}
              >
                <Text style={styles.emptyButtonText}>Clear filters & refresh</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        ) : (
          <FlatList
            data={filteredStreams}
            renderItem={renderStreamItem}
            keyExtractor={item => item.id}
            numColumns={gridDimensions.columns}
            key={`${viewMode}-${gridDimensions.columns}`}
            contentContainerStyle={styles.streamsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={ModernTheme.colors.primary[500]}
                colors={[ModernTheme.colors.primary[500]]}
              />
            }
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              hasMore ? (
                <View style={styles.loadMoreContainer}>
                  <ActivityIndicator size="small" color={ModernTheme.colors.primary[500]} />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernTheme.colors.background.primary,
  } as ViewStyle,
  header: {
    paddingTop: 50,
    paddingBottom: 20,
  } as ViewStyle,
  headerGradient: {
    paddingHorizontal: ModernTheme.spacing.md,
  } as ViewStyle,
  headerContent: {
    marginBottom: ModernTheme.spacing.md,
  } as ViewStyle,
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.sm,
    marginBottom: 4,
  } as ViewStyle,
  quickStats: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.md,
    marginTop: ModernTheme.spacing.sm,
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
  headerTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes['2xl'],
    fontWeight: ModernTheme.typography.weights.bold,
    marginBottom: 4,
  } as TextStyle,
  headerSubtitle: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
  } as TextStyle,
  searchContainer: {
    gap: ModernTheme.spacing.sm,
  } as ViewStyle,
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: ModernTheme.borderRadius.lg,
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    gap: ModernTheme.spacing.sm,
  } as ViewStyle,
  searchInput: {
    flex: 1,
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.md,
  } as TextStyle,
  controls: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  } as ViewStyle,
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.sm,
  } as ViewStyle,
  controlButtonActive: {
    backgroundColor: ModernTheme.colors.primary[500],
    shadowColor: ModernTheme.colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  } as ViewStyle,
  filtersPanel: {
    overflow: 'hidden',
    marginTop: ModernTheme.spacing.sm,
  } as ViewStyle,
  filtersContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.md,
  } as ViewStyle,
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  filterLabel: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
  } as TextStyle,
  filterButtons: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.xs,
  } as ViewStyle,
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: ModernTheme.borderRadius.sm,
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    minWidth: 80,
  } as ViewStyle,
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.xs,
    justifyContent: 'center',
  } as ViewStyle,
  filterButtonActive: {
    backgroundColor: ModernTheme.colors.primary[500],
    shadowColor: ModernTheme.colors.primary[500],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  } as ViewStyle,
  filterButtonText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.xs,
    fontWeight: ModernTheme.typography.weights.medium,
  } as TextStyle,
  filterButtonTextActive: {
    color: ModernTheme.colors.text.primary,
  } as TextStyle,
  content: {
    flex: 1,
  } as ViewStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: ModernTheme.spacing.md,
  } as ViewStyle,
  loadingText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.lg,
    fontWeight: ModernTheme.typography.weights.medium,
    textAlign: 'center',
    marginTop: ModernTheme.spacing.md,
  } as TextStyle,
  loadingSubtext: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
    textAlign: 'center',
    marginTop: ModernTheme.spacing.xs,
  } as TextStyle,
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.xl,
  } as ViewStyle,
  emptyContent: {
    alignItems: 'center',
    gap: ModernTheme.spacing.md,
  } as ViewStyle,
  emptyTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.xl,
    fontWeight: ModernTheme.typography.weights.semibold,
    textAlign: 'center',
  } as TextStyle,
  emptySubtitle: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.md,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
  emptyButton: {
    backgroundColor: ModernTheme.colors.primary[500],
    borderRadius: ModernTheme.borderRadius.md,
    paddingHorizontal: ModernTheme.spacing.lg,
    paddingVertical: ModernTheme.spacing.sm,
    marginTop: ModernTheme.spacing.sm,
  } as ViewStyle,
  emptyButtonText: {
    color: '#000',
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.medium,
  } as TextStyle,
  streamsList: {
    padding: ModernTheme.spacing.md,
  } as ViewStyle,
  streamItem: {
    marginBottom: ModernTheme.spacing.sm,
  } as ViewStyle,
  loadMoreContainer: {
    padding: ModernTheme.spacing.lg,
    alignItems: 'center',
  } as ViewStyle,
});

export default CleanDiscoverScreen;
