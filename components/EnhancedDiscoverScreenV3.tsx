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
  ViewStyle,
  TextStyle,
  FlatList,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  Users,
  Clock,
  Star,
  Gamepad2,
  Music,
  Heart,
  ChevronRight,
} from 'lucide-react-native';
import { TwitchStream, TwitchGame, TwitchUser, twitchApi } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';
import { StreamPreviewCard } from '@/components/StreamPreviewCard';
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
// import { HapticFeedback } from '@/utils/haptics';

interface EnhancedDiscoverScreenV3Props {
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
type CategoryFilter = 'all' | 'gaming' | 'irl' | 'music' | 'art' | 'sports';

interface SearchFilters {
  query: string;
  sortBy: SortBy;
  category: CategoryFilter;
  minViewers: number;
}

interface GameCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  gradient: string[];
  gameIds?: string[];
}

interface StreamSection {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  streams: TwitchStream[];
  showAll?: boolean;
}

const GAME_CATEGORIES: GameCategory[] = [
  {
    id: 'all',
    name: 'All',
    icon: <Grid3X3 size={16} color="#fff" />,
    gradient: ['#8B5CF6', '#A855F7'],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: <Gamepad2 size={16} color="#fff" />,
    gradient: ['#EF4444', '#F97316'],
    gameIds: ['32982', '21779', '33214', '511224', '27471', '460630', '18122', '29595', '493057', '516575', '512710', '1469308723', '65632', '138585', '490100', '491931', '506416', '1678052513', '1229128718', '515025'], // Popular games: Fortnite, League of Legends, Valorant, Apex Legends, Minecraft, Call of Duty, etc.
  },
  {
    id: 'irl',
    name: 'Just Chatting',
    icon: <Users size={16} color="#fff" />,
    gradient: ['#06B6D4', '#0891B2'],
    gameIds: ['509658', '509659', '509664', '509663', '509670', '509671', '509672', '509673', '509674', '509675'], // Just Chatting, Travel & Outdoors, Pools Hot Tubs and Beaches, ASMR, Talk Shows, Food & Drink, etc.
  },
  {
    id: 'music',
    name: 'Music',
    icon: <Music size={16} color="#fff" />,
    gradient: ['#10B981', '#059669'],
    gameIds: ['26936', '509662', '417752', '488190', '26936', '509662'], // Music, DJ, Rocksmith 2014, Guitar Hero Live, etc.
  },
  {
    id: 'art',
    name: 'Art',
    icon: <Star size={16} color="#fff" />,
    gradient: ['#F59E0B', '#D97706'],
    gameIds: ['509660', '509661', '1469308723', '488552'], // Art, Makers & Crafting, Software and Game Development, etc.
  },
  {
    id: 'sports',
    name: 'Sports',
    icon: <Play size={16} color="#fff" />,
    gradient: ['#8B5CF6', '#7C3AED'],
    gameIds: ['518203', '512980', '1869092879', '1745202732', '512804', '1158884259'], // Sports, Virtual Casino, FIFA 23, NBA 2K, etc.
  },
];

export const EnhancedDiscoverScreenV3: React.FC<EnhancedDiscoverScreenV3Props> = ({
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
    category: 'all',
    minViewers: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [featuredStreams, setFeaturedStreams] = useState<TwitchStream[]>([]);
  const [trendingGames, setTrendingGames] = useState<TwitchGame[]>([]);
  const [totalViewers, setTotalViewers] = useState(0);
  const [liveStreamers, setLiveStreamers] = useState(0);
  const [categoryStreams, setCategoryStreams] = useState<TwitchStream[]>([]);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  // Animation values
  const searchBarScale = useSharedValue(1);
  const filtersHeight = useSharedValue(0);
  const sparkleRotation = useSharedValue(0);
  const headerOffset = useSharedValue(0);
  const categoryScrollX = useSharedValue(0);

  // Load additional data on mount
  useEffect(() => {
    loadAdditionalData();
  }, []);

  // Load category streams when component mounts with a selected category
  useEffect(() => {
    if (selectedCategory !== 'all') {
      loadCategoryStreams(selectedCategory);
    }
  }, [selectedCategory, loadCategoryStreams]);

  const loadAdditionalData = async () => {
    try {
      // Load trending games
      const gamesResult = await twitchApi.getTopGames(10);
      setTrendingGames(gamesResult.data);

      // Get total live streamers estimate
      const totalStreamers = await twitchApi.getTotalLiveStreamers();
      setLiveStreamers(totalStreamers);

      // Calculate total viewers from current streams
      const viewers = streams.reduce((sum, stream) => sum + stream.viewer_count, 0);
      setTotalViewers(viewers);

      // Set featured streams (top 5 by viewers)
      const featured = [...streams]
        .sort((a, b) => b.viewer_count - a.viewer_count)
        .slice(0, 5);
      setFeaturedStreams(featured);
    } catch (error) {
      console.error('Error loading additional data:', error);
    }
  };

  // Sparkle animation
  useEffect(() => {
    sparkleRotation.value = withRepeat(
      withSequence(
        withTiming(360, { duration: 3000 }),
        withTiming(0, { duration: 0 })
      ),
      -1
    );
  }, []);
  
  // Calculate grid dimensions
  const getGridDimensions = useCallback(() => {
    const padding = ModernTheme.spacing.md;
    const itemSpacing = ModernTheme.spacing.sm;
    const columns = viewMode === 'grid' ? 2 : 1;
    const availableWidth = screenWidth - (padding * 2);
    const itemWidth = (availableWidth - (itemSpacing * (columns - 1))) / columns;
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
    // Use category-specific streams if a category is selected and we have them
    const sourceStreams = searchFilters.category !== 'all' && categoryStreams.length > 0 
      ? categoryStreams 
      : streams;
    
    let filtered = sourceStreams.filter(stream => {
      const matchesQuery = !searchFilters.query || 
        stream.user_name.toLowerCase().includes(searchFilters.query.toLowerCase()) ||
        stream.game_name.toLowerCase().includes(searchFilters.query.toLowerCase());
      
      const matchesViewers = stream.viewer_count >= searchFilters.minViewers;
      
      // If using category streams, they're already filtered by category
      const matchesCategory = searchFilters.category === 'all' || 
        categoryStreams.length > 0 || 
        GAME_CATEGORIES.find(cat => cat.id === searchFilters.category)?.gameIds?.includes(stream.game_id);
      
      return matchesQuery && matchesViewers && matchesCategory;
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
        filtered.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
        break;
    }
    
    return filtered;
  }, [streams, categoryStreams, searchFilters]);

  // Create stream sections
  const streamSections: StreamSection[] = useMemo(() => {
    const sections: StreamSection[] = [];

    // Featured section
    if (featuredStreams.length > 0) {
      sections.push({
        title: 'Featured Live',
        subtitle: 'Top streamers right now',
        icon: <Star size={18} color={ModernTheme.colors.primary[400]} />,
        streams: featuredStreams,
      });
    }

    // Trending section
    const trendingStreams = filteredStreams.slice(0, 8);
    if (trendingStreams.length > 0) {
      sections.push({
        title: 'Trending Now',
        subtitle: 'Most popular streams',
        icon: <TrendingUp size={18} color={ModernTheme.colors.primary[400]} />,
        streams: trendingStreams,
      });
    }

    // Category-specific sections
    if (selectedCategory !== 'all' && categoryStreams.length > 0) {
      const selectedCategoryData = GAME_CATEGORIES.find(cat => cat.id === selectedCategory);
      if (selectedCategoryData) {
        sections.push({
          title: `${selectedCategoryData.name} Streams`,
          subtitle: `${categoryStreams.length} live streams in ${selectedCategoryData.name.toLowerCase()}`,
          icon: selectedCategoryData.icon,
          streams: categoryStreams.slice(0, 50), // Increased from 24 to 50 streams for selected category
        });
      }
    } else if (selectedCategory === 'all') {
      // Show category sections for 'all' view
      GAME_CATEGORIES.slice(1).forEach(category => {
        const catStreams = streams
          .filter(stream => category.gameIds?.includes(stream.game_id))
          .slice(0, 20); // Increased from 12 to 20 streams per category
        
        if (catStreams.length > 0) {
          sections.push({
            title: category.name,
            subtitle: `${catStreams.length}+ live streams`,
            icon: category.icon,
            streams: catStreams,
          });
        }
      });
    }

    return sections;
  }, [featuredStreams, filteredStreams, streams, selectedCategory, categoryStreams]);
  
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh?.();
    await loadAdditionalData();
    setRefreshing(false);
  }, [onRefresh]);
  
  // Handle search
  const handleSearch = useCallback((query: string) => {
    searchBarScale.value = withSpring(0.95, { damping: 15 }, () => {
      searchBarScale.value = withSpring(1);
    });
    
    if (query.length === 1) {
      // HapticFeedback.light();
    }
    
    setSearchFilters(prev => ({ ...prev, query }));
  }, []);
  
  // Toggle filters
  const toggleFilters = useCallback(() => {
    // HapticFeedback.medium();
    setShowFilters(!showFilters);
    filtersHeight.value = withTiming(showFilters ? 0 : 180, { duration: 300 });
  }, [showFilters]);

  // Load category-specific streams
  const loadCategoryStreams = useCallback(async (categoryId: string) => {
    if (categoryId === 'all') {
      setCategoryStreams([]);
      return;
    }

    const category = GAME_CATEGORIES.find(cat => cat.id === categoryId);
    if (!category?.gameIds?.length) {
      setCategoryStreams([]);
      return;
    }

    setLoadingCategory(true);
    try {
      const allCategoryStreams: TwitchStream[] = [];
      
      // Fetch streams for each game ID in the category
      for (const gameId of category.gameIds) {
        try {
          const gameStreams = await twitchApi.getStreamsByGame(gameId, 100); // Increased from 50 to 100
          allCategoryStreams.push(...gameStreams);
        } catch (error) {
          console.warn(`Failed to fetch streams for game ${gameId}:`, error);
        }
      }
      
      // Remove duplicates and sort by viewer count
      const uniqueStreams = allCategoryStreams.filter((stream, index, self) => 
        index === self.findIndex(s => s.id === stream.id)
      );
      
      uniqueStreams.sort((a, b) => b.viewer_count - a.viewer_count);
      setCategoryStreams(uniqueStreams.slice(0, 500)); // Increased from 200 to 500 streams
    } catch (error) {
      console.error('Error loading category streams:', error);
      setCategoryStreams([]);
    } finally {
      setLoadingCategory(false);
    }
  }, []);

  // Handle category selection
  const handleCategorySelect = useCallback(async (categoryId: string) => {
    // HapticFeedback.light();
    setSelectedCategory(categoryId);
    setSearchFilters(prev => ({ ...prev, category: categoryId as CategoryFilter }));
    await loadCategoryStreams(categoryId);
  }, [loadCategoryStreams]);

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    // HapticFeedback.light();
    setViewMode(mode);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((sort: SortBy) => {
    // HapticFeedback.light();
    setSearchFilters(prev => ({ ...prev, sortBy: sort }));
  }, []);
  
  // Animated styles
  const searchBarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchBarScale.value }],
  }));

  const filtersStyle = useAnimatedStyle(() => ({
    height: filtersHeight.value,
    opacity: interpolate(filtersHeight.value, [0, 180], [0, 1]),
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotation.value}deg` }],
  }));

  // Render category item
  const renderCategoryItem = ({ item, index }: { item: GameCategory; index: number }) => {
    const isSelected = selectedCategory === item.id;
    
    return (
      <TouchableOpacity
        onPress={() => handleCategorySelect(item.id)}
        style={[styles.categoryItem, isSelected && styles.categoryItemActive]}
      >
        <LinearGradient
          colors={isSelected ? item.gradient : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
          style={styles.categoryGradient}
        >
          {item.icon}
          <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
            {item.name}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Render game card
  const renderGameCard = ({ item }: { item: TwitchGame }) => (
    <TouchableOpacity style={styles.gameCard}>
      <Image
        source={{ uri: item.box_art_url.replace('{width}', '144').replace('{height}', '192') }}
        style={styles.gameImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gameOverlay}
      >
        <Text style={styles.gameName} numberOfLines={2}>
          {item.name}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  // Handle see all button press
  const handleSeeAll = useCallback((sectionTitle: string) => {
    const newExpanded = new Set(expandedSections);
    if (expandedSections.has(sectionTitle)) {
      newExpanded.delete(sectionTitle);
    } else {
      newExpanded.add(sectionTitle);
    }
    setExpandedSections(newExpanded);
  }, [expandedSections]);

  // Render stream section
  const renderStreamSection = ({ item }: { item: StreamSection }) => {
    const isExpanded = expandedSections.has(item.title);
    const displayStreams = isExpanded ? item.streams : item.streams.slice(0, 6);
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            {item.icon}
            <View style={styles.sectionTextContainer}>
              <Text style={styles.sectionTitle}>{item.title}</Text>
              <Text style={styles.sectionSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
          {item.streams.length > 6 && (
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => handleSeeAll(item.title)}
            >
              <Text style={styles.seeAllText}>
                {isExpanded ? 'Show Less' : 'See All'}
              </Text>
              <ChevronRight 
                size={16} 
                color={ModernTheme.colors.primary[400]} 
                style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
              />
            </TouchableOpacity>
          )}
        </View>
        
        {isExpanded ? (
          <FlatList
            data={displayStreams}
            renderItem={({ item: stream }) => (
              <View style={styles.streamItem}>
                <StreamPreviewCard
                  stream={stream}
                  onPress={() => onStreamSelect(stream)}
                  onAddStream={() => onAddStream(stream)}
                  onToggleFavorite={() => onToggleFavorite(stream.user_id)}
                  isFavorite={isFavorite(stream.user_id)}
                  isActive={isStreamActive(stream.id)}
                  width={gridDimensions.itemWidth}
                  height={gridDimensions.itemHeight}
                />
              </View>
            )}
            keyExtractor={(stream) => stream.id}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.gridList}
          />
        ) : (
          <FlatList
            data={displayStreams}
            renderItem={({ item: stream }) => (
              <View style={styles.streamItem}>
                <StreamPreviewCard
                  stream={stream}
                  onPress={() => onStreamSelect(stream)}
                  onAddStream={() => onAddStream(stream)}
                  onToggleFavorite={() => onToggleFavorite(stream.user_id)}
                  isFavorite={isFavorite(stream.user_id)}
                  isActive={isStreamActive(stream.id)}
                  width={gridDimensions.itemWidth}
                  height={gridDimensions.itemHeight}
                />
              </View>
            )}
            keyExtractor={(stream) => stream.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        )}
      </View>
    );
  };

  if (isLoading && streams.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View entering={FadeIn.duration(600)} style={styles.loadingContent}>
          <Animated.View style={sparkleStyle}>
            <Star size={48} color={ModernTheme.colors.primary[400]} />
          </Animated.View>
          <Text style={styles.loadingText}>Discovering Amazing Streams</Text>
          <Text style={styles.loadingSubtext}>Finding the best content for you...</Text>
          <ActivityIndicator 
            size="large" 
            color={ModernTheme.colors.primary[400]} 
            style={{ marginTop: ModernTheme.spacing.md }}
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={ModernTheme.colors.primary[400]}
            colors={[ModernTheme.colors.primary[400]]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={[
            'rgba(15, 15, 15, 1)',
            'rgba(26, 26, 26, 0.95)',
            'rgba(15, 15, 15, 0.8)'
          ]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <Animated.View style={sparkleStyle}>
                <Star size={24} color={ModernTheme.colors.primary[400]} />
              </Animated.View>
              <Text style={styles.headerTitle}>Discover</Text>
            </View>
            
            {/* Live Stats */}
            <View style={styles.quickStats}>
              <View style={styles.statItem}>
                <Eye size={14} color={ModernTheme.colors.primary[400]} />
                <Text style={styles.statText}>
                  {totalViewers.toLocaleString()} watching
                </Text>
              </View>
              <View style={styles.statItem}>
                <Users size={14} color={ModernTheme.colors.primary[400]} />
                <Text style={styles.statText}>
                  {liveStreamers.toLocaleString()} live
                </Text>
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
                  <Filter size={18} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.controlButton, viewMode === 'grid' && styles.controlButtonActive]}
                  onPress={() => handleViewModeChange('grid')}
                >
                  <Grid3X3 size={18} color="#fff" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.controlButton, viewMode === 'list' && styles.controlButtonActive]}
                  onPress={() => handleViewModeChange('list')}
                >
                  <List size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Filters Panel */}
            <Animated.View style={[styles.filtersPanel, filtersStyle]}>
              <View style={styles.filtersContent}>
                <View style={styles.filterRow}>
                  <Text style={styles.filterLabel}>Sort by</Text>
                  <View style={styles.filterButtons}>
                    {(['viewers', 'recent', 'alphabetical'] as SortBy[]).map((sort) => (
                      <TouchableOpacity
                        key={sort}
                        style={[
                          styles.filterButton,
                          searchFilters.sortBy === sort && styles.filterButtonActive,
                        ]}
                        onPress={() => handleSortChange(sort)}
                      >
                        <View style={styles.filterButtonContent}>
                          {sort === 'viewers' && <Eye size={12} color="#fff" />}
                          {sort === 'recent' && <Clock size={12} color="#fff" />}
                          {sort === 'alphabetical' && <Users size={12} color="#fff" />}
                          <Text
                            style={[
                              styles.filterButtonText,
                              searchFilters.sortBy === sort && styles.filterButtonTextActive,
                            ]}
                          >
                            {sort === 'viewers' ? 'Popular' : sort === 'recent' ? 'Recent' : 'A-Z'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
        </LinearGradient>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <FlatList
            data={GAME_CATEGORIES}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
          {loadingCategory && (
            <View style={styles.categoryLoadingContainer}>
              <ActivityIndicator 
                size="small" 
                color={ModernTheme.colors.primary[400]} 
              />
              <Text style={styles.categoryLoadingText}>Loading streams...</Text>
            </View>
          )}
        </View>

        {/* Trending Games */}
        {trendingGames.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <TrendingUp size={18} color={ModernTheme.colors.primary[400]} />
                <View style={styles.sectionTextContainer}>
                  <Text style={styles.sectionTitle}>Trending Games</Text>
                  <Text style={styles.sectionSubtitle}>Popular categories</Text>
                </View>
              </View>
            </View>
            
            <FlatList
              data={trendingGames}
              renderItem={renderGameCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.gamesList}
            />
          </View>
        )}

        {/* Stream Sections */}
        <FlatList
          data={streamSections}
          renderItem={renderStreamSection}
          keyExtractor={(item) => item.title}
          scrollEnabled={false}
        />

        {/* Load More */}
        {hasMore && (
          <View style={styles.loadMoreContainer}>
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={onLoadMore}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.loadMoreText}>Load More Streams</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
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
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: ModernTheme.spacing.md,
    gap: ModernTheme.spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.sm,
  },
  headerTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes['2xl'],
    fontWeight: ModernTheme.typography.weights.bold,
  },
  quickStats: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.xs,
  },
  statText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  searchContainer: {
    gap: ModernTheme.spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: ModernTheme.borderRadius.lg,
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    gap: ModernTheme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.md,
  },
  controls: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.sm,
  },
  controlButtonActive: {
    backgroundColor: ModernTheme.colors.primary[500],
    shadowColor: ModernTheme.colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  filtersPanel: {
    overflow: 'hidden',
  },
  filtersContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterLabel: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.xs,
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: ModernTheme.borderRadius.sm,
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    minWidth: 80,
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.xs,
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: ModernTheme.colors.primary[500],
  },
  filterButtonText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.xs,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  filterButtonTextActive: {
    color: ModernTheme.colors.text.primary,
  },
  categoriesSection: {
    paddingVertical: ModernTheme.spacing.md,
  },
  categoriesList: {
    paddingHorizontal: ModernTheme.spacing.md,
    gap: ModernTheme.spacing.sm,
  },
  categoryItem: {
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  categoryItemActive: {
    transform: [{ scale: 1.05 }],
  },
  categoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    gap: ModernTheme.spacing.xs,
  },
  categoryText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  categoryTextActive: {
    color: ModernTheme.colors.text.primary,
  },
  categoryLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ModernTheme.spacing.sm,
    gap: ModernTheme.spacing.xs,
  },
  categoryLoadingText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  section: {
    paddingVertical: ModernTheme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ModernTheme.spacing.md,
    marginBottom: ModernTheme.spacing.sm,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.sm,
  },
  sectionTextContainer: {
    gap: 2,
  },
  sectionTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.lg,
    fontWeight: ModernTheme.typography.weights.semibold,
  },
  sectionSubtitle: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.xs,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.xs,
  },
  seeAllText: {
    color: ModernTheme.colors.primary[400],
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  horizontalList: {
    paddingHorizontal: ModernTheme.spacing.md,
    gap: ModernTheme.spacing.sm,
  },
  gridList: {
    paddingHorizontal: ModernTheme.spacing.md,
    gap: ModernTheme.spacing.sm,
  },
  streamItem: {
    marginRight: ModernTheme.spacing.sm,
  },
  gamesList: {
    paddingHorizontal: ModernTheme.spacing.md,
    gap: ModernTheme.spacing.sm,
  },
  gameCard: {
    width: 100,
    height: 140,
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  gameImage: {
    width: '100%',
    height: '100%',
  },
  gameOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: ModernTheme.spacing.xs,
  },
  gameName: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.xs,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ModernTheme.colors.background.primary,
  },
  loadingContent: {
    alignItems: 'center',
    gap: ModernTheme.spacing.md,
  },
  loadingText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.lg,
    fontWeight: ModernTheme.typography.weights.medium,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
    textAlign: 'center',
  },
  loadMoreContainer: {
    padding: ModernTheme.spacing.lg,
    alignItems: 'center',
  },
  loadMoreButton: {
    backgroundColor: ModernTheme.colors.primary[500],
    borderRadius: ModernTheme.borderRadius.md,
    paddingHorizontal: ModernTheme.spacing.xl,
    paddingVertical: ModernTheme.spacing.md,
  },
  loadMoreText: {
    color: '#000',
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.medium,
  },
});

export default EnhancedDiscoverScreenV3;