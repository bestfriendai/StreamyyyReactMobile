import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Platform,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  Filter,
  TrendingUp,
  Users,
  Eye,
  Clock,
  Star,
  Play,
  Grid3X3,
  List,
  ChevronDown,
  X,
} from 'lucide-react-native';
import { TwitchStream, TwitchGame } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { FlatGrid } from 'react-native-super-grid';
import { Image } from 'react-native';

interface EnhancedDiscoverScreenV2Props {
  streams: TwitchStream[];
  games: TwitchGame[];
  onStreamSelect: (stream: TwitchStream) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'viewers' | 'recent' | 'alphabetical';
type FilterBy = 'all' | 'gaming' | 'irl' | 'music' | 'art';

interface SearchFilters {
  query: string;
  sortBy: SortBy;
  filterBy: FilterBy;
  minViewers: number;
}

export const EnhancedDiscoverScreenV2: React.FC<EnhancedDiscoverScreenV2Props> = ({
  streams = [],
  games = [],
  onStreamSelect,
  onRefresh,
  isLoading = false,
  onLoadMore,
  hasMore = false,
}) => {
  const { width: screenWidth } = Dimensions.get('window');
  
  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    sortBy: 'viewers',
    filterBy: 'all',
    minViewers: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Animation values
  const searchBarScale = useSharedValue(1);
  const filtersHeight = useSharedValue(0);
  const headerOpacity = useSharedValue(1);
  
  // Calculate grid dimensions
  const getGridDimensions = useCallback(() => {
    const padding = ModernTheme.spacing.md;
    const itemSpacing = ModernTheme.spacing.sm;
    const columns = viewMode === 'grid' ? 2 : 1;
    const availableWidth = screenWidth - (padding * 2);
    const itemWidth = (availableWidth - (itemSpacing * (columns - 1))) / columns;
    const itemHeight = viewMode === 'grid' ? itemWidth * 0.75 : 120;
    
    return {
      itemWidth: Math.floor(itemWidth),
      itemHeight: Math.floor(itemHeight),
      columns,
    };
  }, [viewMode, screenWidth]);
  
  const gridDimensions = useMemo(() => getGridDimensions(), [getGridDimensions]);
  
  // Filter and sort streams
  const filteredStreams = useMemo(() => {
    if (!streams || !Array.isArray(streams)) {
      return [];
    }
    let filtered = [...streams];
    
    // Apply text search
    if (searchFilters.query) {
      const query = searchFilters.query.toLowerCase();
      filtered = filtered.filter(
        stream =>
          stream.user_name.toLowerCase().includes(query) ||
          stream.game_name.toLowerCase().includes(query) ||
          stream.title?.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (searchFilters.filterBy !== 'all') {
      const categoryMap: Record<FilterBy, string[]> = {
        all: [],
        gaming: ['Gaming', 'Esports', 'Strategy Games', 'Action Games'],
        irl: ['Just Chatting', 'Travel & Outdoors', 'Food & Drink'],
        music: ['Music', 'DJ', 'Karaoke'],
        art: ['Art', 'Makers & Crafting', 'Beauty & Body Art'],
      };
      
      const categories = categoryMap[searchFilters.filterBy];
      if (categories.length > 0) {
        filtered = filtered.filter(stream =>
          categories.some(cat => stream.game_name.includes(cat))
        );
      }
    }
    
    // Apply minimum viewers filter
    if (searchFilters.minViewers > 0) {
      filtered = filtered.filter(stream => stream.viewer_count >= searchFilters.minViewers);
    }
    
    // Apply sorting
    switch (searchFilters.sortBy) {
      case 'viewers':
        filtered.sort((a, b) => b.viewer_count - a.viewer_count);
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.started_at || 0).getTime() - new Date(a.started_at || 0).getTime());
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.user_name.localeCompare(b.user_name));
        break;
    }
    
    return filtered;
  }, [streams, searchFilters]);
  
  // Handle search input
  const handleSearchChange = useCallback((query: string) => {
    setSearchFilters(prev => ({ ...prev, query }));
    searchBarScale.value = withSpring(0.98, { damping: 15 }, () => {
      searchBarScale.value = withSpring(1);
    });
  }, []);
  
  // Handle filter toggle
  const handleFilterToggle = useCallback(() => {
    setShowFilters(!showFilters);
    filtersHeight.value = withTiming(showFilters ? 0 : 200, { duration: 300 });
  }, [showFilters]);
  
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh?.();
    setRefreshing(false);
  }, [onRefresh]);
  
  // Handle view mode change
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);
  
  // Animated styles
  const searchBarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchBarScale.value }],
  }));
  
  const filtersStyle = useAnimatedStyle(() => ({
    height: filtersHeight.value,
    opacity: interpolate(filtersHeight.value, [0, 200], [0, 1]),
  }));
  
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));
  
  // Render stream item
  const renderStreamItem = useCallback(({ item, index }: { item: TwitchStream; index: number }) => {
    const isGrid = viewMode === 'grid';
    
    return (
      <Animated.View
        entering={FadeIn.delay(index * 100)}
        exiting={FadeOut}
        style={[
          isGrid ? styles.gridItem : styles.listItem,
          {
            width: gridDimensions.itemWidth,
            height: gridDimensions.itemHeight,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.streamContainer}
          onPress={() => item && onStreamSelect?.(item)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={ModernTheme.colors.gradients.card}
            style={styles.streamGradient}
          >
            {/* Thumbnail */}
            <View style={[styles.thumbnailContainer, isGrid && styles.thumbnailGrid]}>
              <Image
                source={{
                  uri: item?.thumbnail_url?.replace('{width}', '320').replace('{height}', '180') || '',
                }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              
              {/* Live indicator */}
              <View style={styles.liveIndicator}>
                <View style={[styles.liveDot, { backgroundColor: ModernTheme.colors.status.live }]} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              
              {/* Viewer count */}
              <View style={styles.viewerBadge}>
                <Eye size={12} color={ModernTheme.colors.text.primary} />
                <Text style={styles.viewerText}>
                  {(item?.viewer_count || 0).toLocaleString()}
                </Text>
              </View>
              
              {/* Play overlay */}
              <View style={styles.playOverlay}>
                <LinearGradient
                  colors={ModernTheme.colors.gradients.primary}
                  style={styles.playButton}
                >
                  <Play size={isGrid ? 24 : 16} color="#fff" fill="#fff" />
                </LinearGradient>
              </View>
            </View>
            
            {/* Stream info */}
            <View style={[styles.streamInfo, isGrid && styles.streamInfoGrid]}>
              <Text style={[styles.streamTitle, isGrid && styles.streamTitleGrid]} numberOfLines={isGrid ? 2 : 1}>
                {item?.user_name || 'Unknown Streamer'}
              </Text>
              <Text style={[styles.streamGame, isGrid && styles.streamGameGrid]} numberOfLines={1}>
                {item?.game_name || 'Unknown Game'}
              </Text>
              {item?.title && (
                <Text style={[styles.streamDescription, isGrid && styles.streamDescriptionGrid]} numberOfLines={isGrid ? 2 : 1}>
                  {item.title}
                </Text>
              )}
              
              {/* Tags */}
              {item?.tag_ids && Array.isArray(item.tag_ids) && item.tag_ids.length > 0 && (
                <View style={styles.tagsContainer}>
                  {item.tag_ids.slice(0, isGrid ? 2 : 3).map((tag, tagIndex) => (
                    <View key={tagIndex} style={styles.tag}>
                      <Text style={styles.tagText}>{tag || ''}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [viewMode, gridDimensions, onStreamSelect]);
  
  // Render category chip
  const renderCategoryChip = useCallback((category: FilterBy, label: string) => {
    const isSelected = searchFilters.filterBy === category;
    
    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.categoryChip,
          isSelected && styles.categoryChipSelected,
        ]}
        onPress={() => setSearchFilters(prev => ({ ...prev, filterBy: category }))}
      >
        <LinearGradient
          colors={isSelected 
            ? ModernTheme.colors.gradients.primary 
            : ModernTheme.colors.gradients.secondary
          }
          style={styles.categoryChipGradient}
        >
          <Text style={[
            styles.categoryChipText,
            isSelected && styles.categoryChipTextSelected,
          ]}>
            {label}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }, [searchFilters.filterBy]);
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <LinearGradient
          colors={ModernTheme.colors.gradients.background}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>Discover</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.viewModeButton}
                  onPress={() => handleViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  <LinearGradient
                    colors={ModernTheme.colors.gradients.primary}
                    style={styles.viewModeGradient}
                  >
                    {viewMode === 'grid' ? (
                      <List size={20} color="#fff" />
                    ) : (
                      <Grid3X3 size={20} color="#fff" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={handleFilterToggle}
                >
                  <LinearGradient
                    colors={showFilters 
                      ? ModernTheme.colors.gradients.accent 
                      : ModernTheme.colors.gradients.secondary
                    }
                    style={styles.filterGradient}
                  >
                    <Filter size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Search Bar */}
            <Animated.View style={[styles.searchContainer, searchBarStyle]}>
              <LinearGradient
                colors={ModernTheme.colors.gradients.card}
                style={styles.searchGradient}
              >
                <Search size={20} color={ModernTheme.colors.text.secondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search streams, games, or streamers..."
                  placeholderTextColor={ModernTheme.colors.text.secondary}
                  value={searchFilters.query}
                  onChangeText={handleSearchChange}
                  returnKeyType="search"
                />
                {searchFilters.query.length > 0 && (
                  <TouchableOpacity
                    onPress={() => handleSearchChange('')}
                    style={styles.clearButton}
                  >
                    <X size={16} color={ModernTheme.colors.text.secondary} />
                  </TouchableOpacity>
                )}
              </LinearGradient>
            </Animated.View>
            
            {/* Category Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
              contentContainerStyle={styles.categoriesContent}
            >
              {renderCategoryChip('all', 'All')}
              {renderCategoryChip('gaming', 'Gaming')}
              {renderCategoryChip('irl', 'IRL')}
              {renderCategoryChip('music', 'Music')}
              {renderCategoryChip('art', 'Art')}
            </ScrollView>
          </View>
        </LinearGradient>
      </Animated.View>
      
      {/* Filters Panel */}
      <Animated.View style={[styles.filtersPanel, filtersStyle]}>
        <LinearGradient
          colors={ModernTheme.colors.gradients.card}
          style={styles.filtersPanelGradient}
        >
          <View style={styles.filtersContent}>
            <Text style={styles.filtersTitle}>Sort & Filter</Text>
            
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Sort by:</Text>
              <View style={styles.sortButtons}>
                {(['viewers', 'recent', 'alphabetical'] as SortBy[]).map((sort) => {
                  const isSelected = searchFilters.sortBy === sort;
                  const labels = {
                    viewers: 'Viewers',
                    recent: 'Recent',
                    alphabetical: 'A-Z',
                  };
                  
                  return (
                    <TouchableOpacity
                      key={sort}
                      style={[
                        styles.sortButton,
                        isSelected && styles.sortButtonSelected,
                      ]}
                      onPress={() => setSearchFilters(prev => ({ ...prev, sortBy: sort }))}
                    >
                      <Text style={[
                        styles.sortButtonText,
                        isSelected && styles.sortButtonTextSelected,
                      ]}>
                        {labels[sort]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
      
      {/* Results Info */}
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsText}>
          {filteredStreams.length} streams found
        </Text>
        {isLoading && (
          <ActivityIndicator size="small" color={ModernTheme.colors.primary[500]} />
        )}
      </View>
      
      {/* Streams Grid */}
      <FlatGrid
        itemDimension={gridDimensions.itemWidth}
        data={filteredStreams}
        style={styles.grid}
        spacing={ModernTheme.spacing.sm}
        renderItem={renderStreamItem}
        maxItemsPerRow={gridDimensions.columns}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[ModernTheme.colors.primary[500]]}
            tintColor={ModernTheme.colors.primary[500]}
          />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasMore ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="large" color={ModernTheme.colors.primary[500]} />
            </View>
          ) : null
        }
      />
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
    paddingBottom: ModernTheme.spacing.md,
  },
  headerContent: {
    gap: ModernTheme.spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: ModernTheme.typography.sizes.xxl,
    fontWeight: ModernTheme.typography.weights.bold,
    color: ModernTheme.colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  },
  viewModeButton: {
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  viewModeGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterButton: {
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  filterGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchContainer: {
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    fontSize: ModernTheme.typography.sizes.md,
    color: ModernTheme.colors.text.primary,
    marginLeft: ModernTheme.spacing.sm,
  },
  clearButton: {
    padding: ModernTheme.spacing.xs,
  },
  categoriesContainer: {
    marginTop: ModernTheme.spacing.sm,
  },
  categoriesContent: {
    paddingRight: ModernTheme.spacing.md,
    gap: ModernTheme.spacing.sm,
  },
  categoryChip: {
    borderRadius: ModernTheme.borderRadius.full,
    overflow: 'hidden',
  },
  categoryChipSelected: {
    transform: [{ scale: 1.05 }],
  },
  categoryChipGradient: {
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryChipText: {
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
    color: ModernTheme.colors.text.secondary,
  },
  categoryChipTextSelected: {
    color: ModernTheme.colors.text.primary,
    fontWeight: ModernTheme.typography.weights.semibold,
  },
  filtersPanel: {
    overflow: 'hidden',
  },
  filtersPanelGradient: {
    flex: 1,
    marginHorizontal: ModernTheme.spacing.md,
    borderRadius: ModernTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filtersContent: {
    padding: ModernTheme.spacing.md,
  },
  filtersTitle: {
    fontSize: ModernTheme.typography.sizes.lg,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.primary,
    marginBottom: ModernTheme.spacing.md,
  },
  filterRow: {
    marginBottom: ModernTheme.spacing.md,
  },
  filterLabel: {
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
    color: ModernTheme.colors.text.secondary,
    marginBottom: ModernTheme.spacing.sm,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  },
  sortButton: {
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    borderRadius: ModernTheme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sortButtonSelected: {
    backgroundColor: ModernTheme.colors.primary[500],
  },
  sortButtonText: {
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
    color: ModernTheme.colors.text.secondary,
  },
  sortButtonTextSelected: {
    color: ModernTheme.colors.text.primary,
    fontWeight: ModernTheme.typography.weights.semibold,
  },
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
  },
  resultsText: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
  },
  grid: {
    flex: 1,
    paddingHorizontal: ModernTheme.spacing.md,
  },
  gridItem: {
    margin: ModernTheme.spacing.xs,
  },
  listItem: {
    margin: ModernTheme.spacing.xs,
  },
  streamContainer: {
    flex: 1,
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  streamGradient: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  thumbnailContainer: {
    position: 'relative',
    height: 80,
  },
  thumbnailGrid: {
    height: 120,
  },
  thumbnail: {
    flex: 1,
    backgroundColor: ModernTheme.colors.background.secondary,
  },
  liveIndicator: {
    position: 'absolute',
    top: ModernTheme.spacing.sm,
    left: ModernTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
    gap: ModernTheme.spacing.xs,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    color: ModernTheme.colors.text.primary,
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.semibold,
    letterSpacing: 0.5,
  },
  viewerBadge: {
    position: 'absolute',
    top: ModernTheme.spacing.sm,
    right: ModernTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
    gap: ModernTheme.spacing.xs,
  },
  viewerText: {
    color: ModernTheme.colors.text.primary,
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  playOverlay: {
    position: 'absolute',
    bottom: ModernTheme.spacing.sm,
    right: ModernTheme.spacing.sm,
    borderRadius: ModernTheme.borderRadius.full,
    overflow: 'hidden',
  },
  playButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  streamInfo: {
    padding: ModernTheme.spacing.sm,
    flex: 1,
  },
  streamInfoGrid: {
    padding: ModernTheme.spacing.md,
  },
  streamTitle: {
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.primary,
    marginBottom: 2,
  },
  streamTitleGrid: {
    fontSize: ModernTheme.typography.sizes.lg,
  },
  streamGame: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.accent,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  streamGameGrid: {
    fontSize: ModernTheme.typography.sizes.md,
  },
  streamDescription: {
    fontSize: ModernTheme.typography.sizes.xs,
    color: ModernTheme.colors.text.secondary,
    marginTop: ModernTheme.spacing.xs,
  },
  streamDescriptionGrid: {
    fontSize: ModernTheme.typography.sizes.sm,
    marginTop: ModernTheme.spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ModernTheme.spacing.xs,
    marginTop: ModernTheme.spacing.sm,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
  },
  tagText: {
    fontSize: 10,
    color: ModernTheme.colors.text.secondary,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  loadingFooter: {
    padding: ModernTheme.spacing.xl,
    alignItems: 'center',
  },
});

export default EnhancedDiscoverScreenV2;