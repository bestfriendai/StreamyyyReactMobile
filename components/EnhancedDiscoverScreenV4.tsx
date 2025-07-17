import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  Filter,
  TrendingUp,
  Grid3X3,
  List,
  X,
  Users,
  Clock,
  Star,
  Gamepad2,
  Music,
  Heart,
  ChevronRight,
  Zap,
  Fire,
  Eye,
  SlidersHorizontal,
} from 'lucide-react-native';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  ScrollView,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  SlideInDown,
  withRepeat,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { SkeletonGrid, SkeletonStreamCard } from '@/components/SkeletonLoader';
import { TwitchStream, TwitchGame } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';
import { HapticFeedback } from '@/utils/haptics';
import { EnhancedStreamCard } from '@/components/EnhancedStreamCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EnhancedDiscoverScreenV4Props {
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
type SortBy = 'viewers' | 'recent' | 'alphabetical' | 'trending';
type CategoryFilter = 'all' | 'gaming' | 'irl' | 'sports' | 'variety';

interface SearchFilters {
  query: string;
  sortBy: SortBy;
  category: CategoryFilter;
  minViewers: number;
  language: string;
}

interface GameCategory {
  id: CategoryFilter;
  name: string;
  icon: React.ReactNode;
  gradient: string[];
  count?: number;
}

interface StreamSection {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  streams: TwitchStream[];
  showAll?: boolean;
  gradient: string[];
}

const GAME_CATEGORIES: GameCategory[] = [
  {
    id: 'all',
    name: 'All',
    icon: <Grid3X3 size={16} color="#fff" />,
    gradient: ['#4B5563', '#6B7280'],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: <Gamepad2 size={16} color="#fff" />,
    gradient: ['#6B7280', '#9CA3AF'],
  },
  {
    id: 'irl',
    name: 'Just Chatting',
    icon: <Users size={16} color="#fff" />,
    gradient: ['#374151', '#4B5563'],
  },
  {
    id: 'sports',
    name: 'Sports',
    icon: <Zap size={16} color="#fff" />,
    gradient: ['#6B7280', '#9CA3AF'],
  },
  {
    id: 'variety',
    name: 'Variety',
    icon: <Eye size={16} color="#fff" />,
    gradient: ['#4B5563', '#6B7280'],
  },
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const EnhancedDiscoverScreenV4: React.FC<EnhancedDiscoverScreenV4Props> = ({
  streams,
  games,
  onStreamSelect,
  onRefresh,
  isLoading = false,
  onLoadMore,
  hasMore = true,
  onAddStream,
  onToggleFavorite,
  isFavorite,
  isStreamActive,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('viewers');
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Animation values
  const searchBarHeight = useSharedValue(0);
  const filtersOpacity = useSharedValue(0);
  const statsScale = useSharedValue(1);

  // Calculate card dimensions for responsive grid
  const numColumns = viewMode === 'grid' ? 2 : 1;
  const cardPadding = 12;
  const cardWidth =
    viewMode === 'grid' ? (SCREEN_WIDTH - cardPadding * 3) / 2 : SCREEN_WIDTH - cardPadding * 2;

  // Filter and sort streams
  const processedStreams = useMemo(() => {
    let filtered = streams;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        stream =>
          stream.title.toLowerCase().includes(query) ||
          stream.user_name.toLowerCase().includes(query) ||
          stream.game_name.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      switch (selectedCategory) {
        case 'gaming':
          filtered = filtered.filter(
            stream =>
              !stream.game_name.toLowerCase().includes('just chatting') &&
              !stream.game_name.toLowerCase().includes('music') &&
              !stream.game_name.toLowerCase().includes('sports') &&
              !stream.game_name.toLowerCase().includes('travel') &&
              !stream.game_name.toLowerCase().includes('pools')
          );
          break;
        case 'irl':
          filtered = filtered.filter(stream =>
            stream.game_name.toLowerCase().includes('just chatting')
          );
          break;
        case 'sports':
          filtered = filtered.filter(
            stream =>
              stream.game_name.toLowerCase().includes('sports') ||
              stream.game_name.toLowerCase().includes('football') ||
              stream.game_name.toLowerCase().includes('basketball') ||
              stream.game_name.toLowerCase().includes('soccer') ||
              stream.game_name.toLowerCase().includes('tennis') ||
              stream.game_name.toLowerCase().includes('racing')
          );
          break;
        case 'variety':
          filtered = filtered.filter(
            stream =>
              stream.game_name.toLowerCase().includes('variety') ||
              stream.game_name.toLowerCase().includes('talk shows') ||
              stream.game_name.toLowerCase().includes('pools') ||
              stream.game_name.toLowerCase().includes('hot tubs') ||
              stream.game_name.toLowerCase().includes('travel') ||
              stream.game_name.toLowerCase().includes('food') ||
              stream.game_name.toLowerCase().includes('cooking')
          );
          break;
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'viewers':
        filtered.sort((a, b) => b.viewer_count - a.viewer_count);
        break;
      case 'recent':
        filtered.sort(
          (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        );
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'trending':
        // Simple trending algorithm based on viewer count and recency
        filtered.sort((a, b) => {
          const aScore =
            (a.viewer_count * (Date.now() - new Date(a.started_at).getTime())) / 1000000;
          const bScore =
            (b.viewer_count * (Date.now() - new Date(b.started_at).getTime())) / 1000000;
          return bScore - aScore;
        });
        break;
    }

    return filtered;
  }, [streams, searchQuery, selectedCategory, sortBy]);

  // Create stream sections
  const streamSections: StreamSection[] = useMemo(() => {
    const sections: StreamSection[] = [];

    if (processedStreams.length > 0) {
      // Trending section (top streams by growth)
      const trendingStreams = processedStreams
        .filter(
          stream =>
            (stream as any).isTrending || (stream as any).isHot || stream.viewer_count > 2000
        )
        .sort((a, b) => ((b as any).trendingScore || 0) - ((a as any).trendingScore || 0))
        .slice(0, 12);

      if (trendingStreams.length > 0) {
        sections.push({
          id: 'trending',
          title: 'Trending Now',
          subtitle: 'Hot streams gaining viewers',
          icon: <TrendingUp size={18} color="#fff" />,
          streams: trendingStreams,
          gradient: ['#4B5563', '#6B7280'],
        });
      }

      // Recently started streams
      const recentStreams = processedStreams
        .filter(stream => (stream as any).isNewStream || (stream as any).isVeryNew)
        .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
        .slice(0, 8);

      if (recentStreams.length > 0) {
        sections.push({
          id: 'recent',
          title: 'Just Started',
          subtitle: 'Fresh streams to discover',
          icon: <Clock size={18} color="#fff" />,
          streams: recentStreams,
          gradient: ['#374151', '#4B5563'],
        });
      }

      // Popular in category
      if (selectedCategory !== 'all') {
        const categoryStreams = processedStreams.slice(0, 16);
        if (categoryStreams.length > 0) {
          const categoryName =
            GAME_CATEGORIES.find(cat => cat.id === selectedCategory)?.name || 'Category';
          sections.push({
            id: 'category',
            title: `Popular in ${categoryName}`,
            subtitle: 'Top streams in this category',
            icon: <Star size={18} color="#fff" />,
            streams: categoryStreams,
            gradient: ['#4B5563', '#6B7280'],
          });
        }
      }

      // All streams section
      sections.push({
        id: 'all',
        title: searchQuery ? 'Search Results' : 'All Streams',
        subtitle: `${processedStreams.length} streams found`,
        icon: <Eye size={18} color="#fff" />,
        streams: processedStreams,
        showAll: true,
        gradient: ['#374151', '#4B5563'],
      });
    }

    return sections;
  }, [processedStreams, selectedCategory, searchQuery]);

  // Handle stream add with feedback
  const handleAddStream = useCallback(
    async (stream: TwitchStream) => {
      try {
        const result = await onAddStream(stream);
        if (result.success) {
          Alert.alert('Stream Added!', `${stream.user_name} has been added to your multi-view`, [
            { text: 'OK' },
            {
              text: 'View Grid',
              onPress: () => {
                // Navigation would be handled by parent component
              },
            },
          ]);
        } else {
          Alert.alert('Error', result.message);
        }
        return result;
      } catch (error) {
        console.error('Error adding stream:', error);
        return { success: false, message: 'Failed to add stream' };
      }
    },
    [onAddStream]
  );

  // Toggle search bar
  const toggleSearch = useCallback(() => {
    HapticFeedback.light();
    const newShowSearch = !showSearch;
    setShowSearch(newShowSearch);

    searchBarHeight.value = withTiming(newShowSearch ? 60 : 0, { duration: 300 });

    if (!newShowSearch) {
      setSearchQuery('');
    }
  }, [showSearch]);

  // Toggle filters
  const toggleFilters = useCallback(() => {
    HapticFeedback.light();
    const newShowFilters = !showFilters;
    setShowFilters(newShowFilters);

    filtersOpacity.value = withTiming(newShowFilters ? 1 : 0, { duration: 300 });
  }, [showFilters]);

  // Animated styles
  const searchBarAnimatedStyle = useAnimatedStyle(() => ({
    height: searchBarHeight.value,
    opacity: interpolate(searchBarHeight.value, [0, 60], [0, 1]),
  }));

  const filtersAnimatedStyle = useAnimatedStyle(() => ({
    opacity: filtersOpacity.value,
    transform: [{ translateY: interpolate(filtersOpacity.value, [0, 1], [-20, 0]) }],
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: statsScale.value }],
  }));

  // Animate stats on data change
  useEffect(() => {
    statsScale.value = withSpring(1.05, { damping: 15 }, () => {
      statsScale.value = withSpring(1);
    });
  }, [processedStreams.length]);

  // Header Component
  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.7)']}
        style={styles.headerGradient}
      >
        {/* Main Header */}
        <View style={styles.headerMain}>
          <View style={styles.headerLeft}>
            <View style={styles.titleContainer}>
              <Star size={24} color={ModernTheme.colors.primary[400]} />
              <Text style={styles.headerTitle}>Discover</Text>
            </View>
            <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
              <View style={styles.statItem}>
                <Users size={12} color={ModernTheme.colors.text.secondary} />
                <Text style={styles.statText}>{processedStreams.length} streams</Text>
              </View>
              <View style={styles.statItem}>
                <Eye size={12} color={ModernTheme.colors.text.secondary} />
                <Text style={styles.statText}>
                  {processedStreams
                    .reduce((acc, stream) => acc + stream.viewer_count, 0)
                    .toLocaleString()}{' '}
                  viewers
                </Text>
              </View>
            </Animated.View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={toggleSearch}>
              <LinearGradient
                colors={
                  showSearch
                    ? ['#4B5563', '#6B7280']
                    : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                }
                style={styles.headerButtonGradient}
              >
                {showSearch ? <X size={20} color="#fff" /> : <Search size={20} color="#fff" />}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerButton} onPress={toggleFilters}>
              <LinearGradient
                colors={
                  showFilters
                    ? ['#4B5563', '#6B7280']
                    : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                }
                style={styles.headerButtonGradient}
              >
                <SlidersHorizontal size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                style={styles.headerButtonGradient}
              >
                {viewMode === 'grid' ? (
                  <List size={20} color="#fff" />
                ) : (
                  <Grid3X3 size={20} color="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <Animated.View style={[styles.searchContainer, searchBarAnimatedStyle]}>
            <View style={styles.searchInputContainer}>
              <Search size={16} color={ModernTheme.colors.text.tertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search streams, games, or streamers..."
                placeholderTextColor={ModernTheme.colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={showSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color={ModernTheme.colors.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}

        {/* Filters */}
        {showFilters && (
          <Animated.View style={[styles.filtersContainer, filtersAnimatedStyle]}>
            {/* Categories */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
            >
              {GAME_CATEGORIES.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryButton}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <LinearGradient
                    colors={
                      selectedCategory === category.id
                        ? category.gradient
                        : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                    }
                    style={styles.categoryGradient}
                  >
                    {category.icon}
                    <Text style={styles.categoryText}>{category.name}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Sort Options */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
              {(['viewers', 'trending', 'recent', 'alphabetical'] as SortBy[]).map(sort => (
                <TouchableOpacity
                  key={sort}
                  style={styles.sortButton}
                  onPress={() => setSortBy(sort)}
                >
                  <View
                    style={[styles.sortButtonContent, sortBy === sort && styles.sortButtonActive]}
                  >
                    <Text
                      style={[
                        styles.sortButtonText,
                        sortBy === sort && styles.sortButtonTextActive,
                      ]}
                    >
                      {sort.charAt(0).toUpperCase() + sort.slice(1)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}
      </LinearGradient>
    </View>
  );

  // Section Header Component
  const renderSectionHeader = (section: StreamSection) => (
    <View style={styles.sectionHeader}>
      <LinearGradient colors={section.gradient} style={styles.sectionHeaderGradient}>
        <View style={styles.sectionHeaderContent}>
          <View style={styles.sectionHeaderLeft}>
            {section.icon}
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
            </View>
          </View>
          {!section.showAll && section.streams.length > 8 && (
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See All</Text>
              <ChevronRight size={14} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  // Stream Grid Component
  const renderStreamGrid = (
    streams: TwitchStream[],
    sectionId: string,
    showAll: boolean = false
  ) => {
    const displayStreams = showAll ? streams : streams.slice(0, 12);

    return (
      <FlatList
        data={displayStreams}
        renderItem={({ item, index }) => (
          <EnhancedStreamCard
            stream={item}
            onPress={() => onStreamSelect(item)}
            onAddToMultiView={() => handleAddStream(item)}
            onToggleFavorite={() => onToggleFavorite(item.user_id)}
            isFavorite={isFavorite(item.user_id)}
            isActive={isStreamActive(item.id)}
            width={cardWidth}
            showTrending={sectionId === 'trending' && index < 3}
            isNewStreamer={sectionId === 'recent' && index < 2}
          />
        )}
        numColumns={numColumns}
        key={`${sectionId}-${viewMode}-${numColumns}`}
        scrollEnabled={false}
        contentContainerStyle={styles.gridContainer}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
        // Performance optimizations
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={10}
        removeClippedSubviews
        keyExtractor={item => item.id}
      />
    );
  };

  // Loading Component
  if (isLoading && streams.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Loading Section Header */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <LinearGradient colors={['#8B5CF6', '#A855F7']} style={styles.sectionHeaderGradient}>
                <View style={styles.sectionHeaderContent}>
                  <View style={styles.sectionHeaderLeft}>
                    <TrendingUp size={18} color="#fff" />
                    <View style={styles.sectionHeaderText}>
                      <Text style={styles.sectionTitle}>Loading Streams</Text>
                      <Text style={styles.sectionSubtitle}>Discovering amazing content...</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Skeleton Grid */}
            <SkeletonGrid numColumns={numColumns} numRows={3} />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              HapticFeedback.medium();
              onRefresh?.();
            }}
            tintColor={ModernTheme.colors.primary[500]}
            colors={[ModernTheme.colors.primary[500]]}
            progressBackgroundColor={ModernTheme.colors.background.secondary}
          />
        }
        showsVerticalScrollIndicator={false}
        onScroll={event => {
          const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            if (hasMore && !isLoading && onLoadMore) {
              onLoadMore();
            }
          }
        }}
        scrollEventThrottle={200}
      >
        {streamSections.length > 0 ? (
          streamSections.map(section => (
            <View key={section.id} style={styles.section}>
              {renderSectionHeader(section)}
              {renderStreamGrid(section.streams, section.id, section.showAll)}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Search size={48} color={ModernTheme.colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No streams found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
          </View>
        )}

        {/* Load More Button */}
        {hasMore && streams.length > 0 && (
          <TouchableOpacity style={styles.loadMoreButton} onPress={onLoadMore}>
            <LinearGradient colors={['#4B5563', '#6B7280']} style={styles.loadMoreGradient}>
              <Text style={styles.loadMoreText}>Load More Streams</Text>
              <TrendingUp size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernTheme.colors.background.primary,
  },
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: ModernTheme.colors.border.primary,
  },
  headerGradient: {
    paddingBottom: ModernTheme.spacing.sm,
  },
  headerMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.md,
    paddingTop: ModernTheme.spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.xs,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: ModernTheme.typography.sizes['2xl'],
    fontWeight: ModernTheme.typography.weights.bold,
    color: ModernTheme.colors.text.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: ModernTheme.typography.sizes.xs,
    color: ModernTheme.colors.text.secondary,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  headerActions: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.xs,
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
  searchContainer: {
    paddingHorizontal: ModernTheme.spacing.md,
    overflow: 'hidden',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: ModernTheme.borderRadius.lg,
    paddingHorizontal: ModernTheme.spacing.sm,
    gap: ModernTheme.spacing.xs,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: ModernTheme.typography.sizes.md,
    color: ModernTheme.colors.text.primary,
  },
  filtersContainer: {
    paddingHorizontal: ModernTheme.spacing.md,
    paddingTop: ModernTheme.spacing.sm,
    gap: ModernTheme.spacing.sm,
  },
  categoriesScroll: {
    marginBottom: ModernTheme.spacing.xs,
  },
  categoryButton: {
    marginRight: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  categoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    gap: 6,
  },
  categoryText: {
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
    color: '#fff',
  },
  sortScroll: {},
  sortButton: {
    marginRight: ModernTheme.spacing.xs,
  },
  sortButtonContent: {
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sortButtonActive: {
    backgroundColor: ModernTheme.colors.primary[500],
  },
  sortButtonText: {
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
    color: ModernTheme.colors.text.secondary,
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: ModernTheme.spacing.lg,
  },
  sectionHeader: {
    marginHorizontal: ModernTheme.spacing.md,
    marginBottom: ModernTheme.spacing.sm,
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  sectionHeaderGradient: {
    padding: ModernTheme.spacing.sm,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.sm,
    flex: 1,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: ModernTheme.typography.sizes.lg,
    fontWeight: ModernTheme.typography.weights.bold,
    color: '#fff',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
    color: '#fff',
  },
  gridContainer: {
    paddingHorizontal: 6,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: ModernTheme.spacing.md,
  },
  loadingText: {
    fontSize: ModernTheme.typography.sizes.md,
    color: ModernTheme.colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.xl,
    paddingVertical: ModernTheme.spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: ModernTheme.typography.sizes.xl,
    fontWeight: ModernTheme.typography.weights.bold,
    color: ModernTheme.colors.text.primary,
    marginTop: ModernTheme.spacing.md,
    marginBottom: ModernTheme.spacing.xs,
  },
  emptySubtitle: {
    fontSize: ModernTheme.typography.sizes.md,
    color: ModernTheme.colors.text.secondary,
    textAlign: 'center',
  },
  loadMoreButton: {
    marginHorizontal: ModernTheme.spacing.md,
    marginTop: ModernTheme.spacing.lg,
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  loadMoreGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ModernTheme.spacing.md,
    gap: ModernTheme.spacing.xs,
  },
  loadMoreText: {
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: '#fff',
  },
});

export default EnhancedDiscoverScreenV4;
