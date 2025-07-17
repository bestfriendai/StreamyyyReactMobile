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
  Sparkles,
  ArrowRight,
  Play,
  MoreHorizontal,
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
  StatusBar,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  SlideInDown,
  SlideInRight,
  SlideInUp,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { ProfessionalStreamCard } from '@/components/ProfessionalStreamCard';
import { SkeletonGrid, SkeletonStreamCard } from '@/components/SkeletonLoader';
import { TwitchStream, TwitchGame } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';
import { HapticFeedback } from '@/utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ProfessionalDiscoverScreenProps {
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
type CategoryFilter = 'all' | 'gaming' | 'irl' | 'music' | 'art' | 'sports';

interface StreamSection {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  streams: TwitchStream[];
  showAll?: boolean;
  gradient: string[];
  priority: number;
}

const PREMIUM_CATEGORIES = [
  {
    id: 'all' as CategoryFilter,
    name: 'All',
    icon: <Grid3X3 size={16} color="#fff" />,
    gradient: ['#667eea', '#764ba2'],
    count: 0,
  },
  {
    id: 'gaming' as CategoryFilter,
    name: 'Gaming',
    icon: <Gamepad2 size={16} color="#fff" />,
    gradient: ['#f093fb', '#f5576c'],
    count: 0,
  },
  {
    id: 'irl' as CategoryFilter,
    name: 'Just Chatting',
    icon: <Users size={16} color="#fff" />,
    gradient: ['#4facfe', '#00f2fe'],
    count: 0,
  },
  {
    id: 'music' as CategoryFilter,
    name: 'Music',
    icon: <Music size={16} color="#fff" />,
    gradient: ['#43e97b', '#38f9d7'],
    count: 0,
  },
  {
    id: 'art' as CategoryFilter,
    name: 'Creative',
    icon: <Star size={16} color="#fff" />,
    gradient: ['#fa709a', '#fee140'],
    count: 0,
  },
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const ProfessionalDiscoverScreen: React.FC<ProfessionalDiscoverScreenProps> = ({
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
  const headerOpacity = useSharedValue(1);
  const searchBarHeight = useSharedValue(0);
  const filtersHeight = useSharedValue(0);
  const statsScale = useSharedValue(1);
  const floatingButtonScale = useSharedValue(1);
  const scrollY = useSharedValue(0);

  // Calculate responsive dimensions
  const numColumns = viewMode === 'grid' ? 2 : 1;
  const cardPadding = 16;
  const cardWidth =
    viewMode === 'grid' ? (SCREEN_WIDTH - cardPadding * 3) / 2 : SCREEN_WIDTH - cardPadding * 2;

  // Enhanced stream processing with better categorization
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

    // Apply category filter with better logic
    if (selectedCategory !== 'all') {
      switch (selectedCategory) {
        case 'gaming':
          filtered = filtered.filter(
            stream =>
              !stream.game_name.toLowerCase().includes('just chatting') &&
              !stream.game_name.toLowerCase().includes('music') &&
              !stream.game_name.toLowerCase().includes('art') &&
              stream.game_name !== 'Special Events'
          );
          break;
        case 'irl':
          filtered = filtered.filter(
            stream =>
              stream.game_name.toLowerCase().includes('just chatting') ||
              stream.game_name === 'Special Events'
          );
          break;
        case 'music':
          filtered = filtered.filter(stream => stream.game_name.toLowerCase().includes('music'));
          break;
        case 'art':
          filtered = filtered.filter(
            stream =>
              stream.game_name.toLowerCase().includes('art') ||
              stream.game_name.toLowerCase().includes('creative')
          );
          break;
      }
    }

    // Enhanced sorting
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
        filtered.sort((a, b) => {
          const aScore = (a as any).trendingScore || 0;
          const bScore = (b as any).trendingScore || 0;
          return bScore - aScore;
        });
        break;
    }

    return filtered;
  }, [streams, searchQuery, selectedCategory, sortBy]);

  // Create professional stream sections
  const streamSections: StreamSection[] = useMemo(() => {
    const sections: StreamSection[] = [];

    if (processedStreams.length > 0) {
      // Hot Streams Section
      const hotStreams = processedStreams
        .filter(stream => (stream as any).isHot || stream.viewer_count > 15000)
        .slice(0, 4);

      if (hotStreams.length > 0) {
        sections.push({
          id: 'hot',
          title: 'Hottest Right Now',
          subtitle: 'Most popular streams this moment',
          icon: <Fire size={20} color="#fff" />,
          streams: hotStreams,
          gradient: ['#ff416c', '#ff4b2b'],
          priority: 1,
        });
      }

      // Trending Section
      const trendingStreams = processedStreams
        .filter(stream => (stream as any).isTrending && !(stream as any).isHot)
        .sort((a, b) => ((b as any).trendingScore || 0) - ((a as any).trendingScore || 0))
        .slice(0, 6);

      if (trendingStreams.length > 0) {
        sections.push({
          id: 'trending',
          title: 'Trending Up',
          subtitle: 'Gaining momentum fast',
          icon: <TrendingUp size={20} color="#fff" />,
          streams: trendingStreams,
          gradient: ['#ff9a9e', '#fecfef'],
          priority: 2,
        });
      }

      // Fresh Streamers
      const freshStreams = processedStreams
        .filter(stream => (stream as any).isVeryNew || (stream as any).isNewStream)
        .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
        .slice(0, 4);

      if (freshStreams.length > 0) {
        sections.push({
          id: 'fresh',
          title: 'Fresh Content',
          subtitle: 'Just went live',
          icon: <Sparkles size={20} color="#fff" />,
          streams: freshStreams,
          gradient: ['#a8edea', '#fed6e3'],
          priority: 3,
        });
      }

      // Rising Stars
      const risingStreams = processedStreams
        .filter(
          stream =>
            (stream as any).isRising && !(stream as any).isTrending && !(stream as any).isHot
        )
        .slice(0, 4);

      if (risingStreams.length > 0) {
        sections.push({
          id: 'rising',
          title: 'Rising Stars',
          subtitle: 'Growing audiences',
          icon: <Zap size={20} color="#fff" />,
          streams: risingStreams,
          gradient: ['#ffecd2', '#fcb69f'],
          priority: 4,
        });
      }

      // Category-specific section
      if (selectedCategory !== 'all') {
        const categoryStreams = processedStreams.slice(0, 8);
        if (categoryStreams.length > 0) {
          const categoryName =
            PREMIUM_CATEGORIES.find(cat => cat.id === selectedCategory)?.name || 'Category';
          sections.push({
            id: 'category',
            title: `Best in ${categoryName}`,
            subtitle: `Top ${categoryName.toLowerCase()} content`,
            icon: <Star size={20} color="#fff" />,
            streams: categoryStreams,
            gradient: ['#667eea', '#764ba2'],
            priority: 5,
          });
        }
      }

      // All Streams
      sections.push({
        id: 'all',
        title: searchQuery ? 'Search Results' : 'Discover More',
        subtitle: `${processedStreams.length} streams available`,
        icon: <Eye size={20} color="#fff" />,
        streams: processedStreams,
        showAll: true,
        gradient: ['#667eea', '#764ba2'],
        priority: 6,
      });
    }

    return sections.sort((a, b) => a.priority - b.priority);
  }, [processedStreams, selectedCategory, searchQuery]);

  // Enhanced interaction handlers
  const handleAddStream = useCallback(
    async (stream: TwitchStream) => {
      try {
        const result = await onAddStream(stream);
        if (result.success) {
          HapticFeedback.success();
          Alert.alert('✨ Stream Added!', `${stream.user_name} is now in your multi-view`, [
            { text: 'Continue Browsing', style: 'default' },
            { text: 'View Grid', style: 'default', onPress: () => {} },
          ]);
        } else {
          HapticFeedback.error();
          Alert.alert('Unable to Add', result.message);
        }
        return result;
      } catch (error) {
        HapticFeedback.error();
        return { success: false, message: 'Failed to add stream' };
      }
    },
    [onAddStream]
  );

  // Enhanced UI handlers
  const toggleSearch = useCallback(() => {
    HapticFeedback.light();
    const newShowSearch = !showSearch;
    setShowSearch(newShowSearch);

    searchBarHeight.value = withTiming(newShowSearch ? 70 : 0, {
      duration: 400,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });

    if (!newShowSearch) {
      setSearchQuery('');
    }
  }, [showSearch]);

  const toggleFilters = useCallback(() => {
    HapticFeedback.light();
    const newShowFilters = !showFilters;
    setShowFilters(newShowFilters);

    filtersHeight.value = withTiming(newShowFilters ? 160 : 0, {
      duration: 400,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [showFilters]);

  // Floating action button animation
  useEffect(() => {
    floatingButtonScale.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 2000 }), withTiming(1, { duration: 2000 })),
      -1,
      true
    );
  }, []);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const searchBarAnimatedStyle = useAnimatedStyle(() => ({
    height: searchBarHeight.value,
    opacity: interpolate(searchBarHeight.value, [0, 70], [0, 1]),
  }));

  const filtersAnimatedStyle = useAnimatedStyle(() => ({
    height: filtersHeight.value,
    opacity: interpolate(filtersHeight.value, [0, 160], [0, 1]),
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: statsScale.value }],
  }));

  const floatingButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: floatingButtonScale.value }],
  }));

  // Premium Header Component
  const renderPremiumHeader = () => (
    <Animated.View style={[styles.header, headerAnimatedStyle]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Main Header */}
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.95)', 'rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.6)']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.titleSection}>
              <View style={styles.titleContainer}>
                <LinearGradient colors={['#667eea', '#764ba2']} style={styles.titleIcon}>
                  <Sparkles size={28} color="#fff" />
                </LinearGradient>
                <View style={styles.titleText}>
                  <Text style={styles.headerTitle}>Discover</Text>
                  <Text style={styles.headerSubtitle}>Premium Content</Text>
                </View>
              </View>

              <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
                <BlurView intensity={20} style={styles.statsBlur}>
                  <View style={styles.statItem}>
                    <Users size={14} color="#667eea" />
                    <Text style={styles.statText}>{processedStreams.length}</Text>
                    <Text style={styles.statLabel}>streams</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Eye size={14} color="#667eea" />
                    <Text style={styles.statText}>
                      {Math.floor(
                        processedStreams.reduce((acc, stream) => acc + stream.viewer_count, 0) /
                          1000
                      )}
                      K
                    </Text>
                    <Text style={styles.statLabel}>viewers</Text>
                  </View>
                </BlurView>
              </Animated.View>
            </View>
          </View>

          <View style={styles.headerActions}>
            <AnimatedTouchableOpacity
              style={styles.actionButton}
              onPress={toggleSearch}
              entering={SlideInRight.delay(100)}
            >
              <BlurView intensity={80} style={styles.actionBlur}>
                <LinearGradient
                  colors={
                    showSearch
                      ? ['#667eea', '#764ba2']
                      : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']
                  }
                  style={styles.actionGradient}
                >
                  {showSearch ? <X size={22} color="#fff" /> : <Search size={22} color="#fff" />}
                </LinearGradient>
              </BlurView>
            </AnimatedTouchableOpacity>

            <AnimatedTouchableOpacity
              style={styles.actionButton}
              onPress={toggleFilters}
              entering={SlideInRight.delay(200)}
            >
              <BlurView intensity={80} style={styles.actionBlur}>
                <LinearGradient
                  colors={
                    showFilters
                      ? ['#f093fb', '#f5576c']
                      : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']
                  }
                  style={styles.actionGradient}
                >
                  <SlidersHorizontal size={22} color="#fff" />
                </LinearGradient>
              </BlurView>
            </AnimatedTouchableOpacity>

            <AnimatedTouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                HapticFeedback.selection();
                setViewMode(viewMode === 'grid' ? 'list' : 'grid');
              }}
              entering={SlideInRight.delay(300)}
            >
              <BlurView intensity={80} style={styles.actionBlur}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                  style={styles.actionGradient}
                >
                  {viewMode === 'grid' ? (
                    <List size={22} color="#fff" />
                  ) : (
                    <Grid3X3 size={22} color="#fff" />
                  )}
                </LinearGradient>
              </BlurView>
            </AnimatedTouchableOpacity>
          </View>
        </View>

        {/* Premium Search Bar */}
        {showSearch && (
          <Animated.View style={[styles.searchSection, searchBarAnimatedStyle]}>
            <BlurView intensity={40} style={styles.searchBlur}>
              <View style={styles.searchContainer}>
                <Search size={18} color="rgba(255,255,255,0.6)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search streams, games, or creators..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={showSearch}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={18} color="rgba(255,255,255,0.6)" />
                  </TouchableOpacity>
                )}
              </View>
            </BlurView>
          </Animated.View>
        )}

        {/* Premium Filters */}
        {showFilters && (
          <Animated.View style={[styles.filtersSection, filtersAnimatedStyle]}>
            <BlurView intensity={40} style={styles.filtersBlur}>
              <View style={styles.filtersContent}>
                {/* Categories */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupLabel}>Categories</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoriesScroll}
                  >
                    {PREMIUM_CATEGORIES.map(category => (
                      <TouchableOpacity
                        key={category.id}
                        style={styles.categoryChip}
                        onPress={() => {
                          HapticFeedback.selection();
                          setSelectedCategory(category.id);
                        }}
                      >
                        <LinearGradient
                          colors={
                            selectedCategory === category.id
                              ? category.gradient
                              : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                          }
                          style={styles.categoryChipGradient}
                        >
                          {category.icon}
                          <Text
                            style={[
                              styles.categoryChipText,
                              selectedCategory === category.id && styles.categoryChipTextActive,
                            ]}
                          >
                            {category.name}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Sort Options */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupLabel}>Sort By</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.sortScroll}
                  >
                    {(['viewers', 'trending', 'recent', 'alphabetical'] as SortBy[]).map(sort => (
                      <TouchableOpacity
                        key={sort}
                        style={styles.sortChip}
                        onPress={() => {
                          HapticFeedback.selection();
                          setSortBy(sort);
                        }}
                      >
                        <View
                          style={[styles.sortChipContent, sortBy === sort && styles.sortChipActive]}
                        >
                          <Text
                            style={[
                              styles.sortChipText,
                              sortBy === sort && styles.sortChipTextActive,
                            ]}
                          >
                            {sort.charAt(0).toUpperCase() + sort.slice(1)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        )}
      </LinearGradient>
    </Animated.View>
  );

  // Premium Section Header Component
  const renderPremiumSectionHeader = (section: StreamSection) => (
    <Animated.View style={styles.sectionContainer} entering={FadeIn.delay(100)}>
      <LinearGradient
        colors={[...section.gradient, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.sectionWrapper}
      >
        <BlurView intensity={60} style={styles.sectionBlur}>
          <View style={styles.sectionHeaderContent}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionIconContainer}>{section.icon}</View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
              </View>
            </View>
            {!section.showAll && section.streams.length > 4 && (
              <TouchableOpacity style={styles.seeAllButton} onPress={() => HapticFeedback.light()}>
                <Text style={styles.seeAllText}>See All</Text>
                <ArrowRight size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );

  // Enhanced Stream Grid Component
  const renderPremiumStreamGrid = (
    streams: TwitchStream[],
    sectionId: string,
    showAll: boolean = false
  ) => {
    const displayStreams = showAll ? streams : streams.slice(0, 6);

    return (
      <View style={styles.streamGridContainer}>
        <FlatList
          data={displayStreams}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeIn.delay(index * 50)}>
              <ProfessionalStreamCard
                stream={item}
                onPress={() => onStreamSelect(item)}
                onAddToMultiView={() => handleAddStream(item)}
                onToggleFavorite={() => onToggleFavorite(item.user_id)}
                isFavorite={isFavorite(item.user_id)}
                isActive={isStreamActive(item.id)}
                width={cardWidth}
                showTrending={sectionId === 'trending'}
                isNewStreamer={sectionId === 'fresh'}
              />
            </Animated.View>
          )}
          numColumns={numColumns}
          key={`${sectionId}-${viewMode}-${numColumns}`}
          scrollEnabled={false}
          contentContainerStyle={styles.gridContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
        />
      </View>
    );
  };

  // Loading state with premium skeleton
  if (isLoading && streams.length === 0) {
    return (
      <View style={styles.container}>
        {renderPremiumHeader()}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Animated.View entering={FadeIn.delay(200)}>
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.loadingSectionHeader}>
                <BlurView intensity={60} style={styles.loadingSectionBlur}>
                  <View style={styles.loadingSectionContent}>
                    <Sparkles size={20} color="#fff" />
                    <Text style={styles.loadingSectionText}>Discovering Premium Content...</Text>
                  </View>
                </BlurView>
              </LinearGradient>
            </Animated.View>
            <SkeletonGrid numColumns={numColumns} numRows={3} />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderPremiumHeader()}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              HapticFeedback.medium();
              onRefresh?.();
            }}
            tintColor="#667eea"
            colors={['#667eea', '#764ba2']}
            progressBackgroundColor="rgba(255,255,255,0.1)"
          />
        }
        showsVerticalScrollIndicator={false}
        onScroll={event => {
          scrollY.value = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {streamSections.length > 0 ? (
          streamSections.map((section, index) => (
            <Animated.View
              key={section.id}
              style={styles.section}
              entering={FadeIn.delay(index * 100)}
            >
              {renderPremiumSectionHeader(section)}
              {renderPremiumStreamGrid(section.streams, section.id, section.showAll)}
            </Animated.View>
          ))
        ) : (
          <Animated.View style={styles.emptyState} entering={FadeIn.delay(300)}>
            <LinearGradient
              colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)']}
              style={styles.emptyStateGradient}
            >
              <Search size={64} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyTitle}>No Streams Found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search or category filters
              </Text>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Load More Section */}
        {hasMore && streams.length > 0 && (
          <Animated.View entering={FadeIn.delay(400)}>
            <TouchableOpacity style={styles.loadMoreContainer} onPress={onLoadMore}>
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.loadMoreGradient}>
                <BlurView intensity={60} style={styles.loadMoreBlur}>
                  <View style={styles.loadMoreContent}>
                    <Text style={styles.loadMoreText}>Discover More Streams</Text>
                    <TrendingUp size={18} color="#fff" />
                  </View>
                </BlurView>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <Animated.View
        style={[styles.floatingButton, floatingButtonAnimatedStyle]}
        entering={SlideInUp.delay(800)}
      >
        <TouchableOpacity
          onPress={() => {
            HapticFeedback.medium();
            onRefresh?.();
          }}
          style={styles.floatingButtonTouchable}
        >
          <BlurView intensity={80} style={styles.floatingButtonBlur}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.floatingButtonGradient}>
              <Sparkles size={24} color="#fff" />
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    zIndex: 1000,
  },
  headerGradient: {
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  headerLeft: {
    flex: 1,
  },
  titleSection: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  titleText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginTop: 2,
  },
  statsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  statsBlur: {
    borderRadius: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  statText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Platform.OS === 'ios' ? 8 : 0,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionBlur: {
    borderRadius: 16,
  },
  actionGradient: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  searchBlur: {
    borderRadius: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  filtersSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  filtersBlur: {
    borderRadius: 20,
  },
  filtersContent: {
    padding: 20,
    gap: 20,
  },
  filterGroup: {
    gap: 12,
  },
  filterGroupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoriesScroll: {},
  categoryChip: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  sortScroll: {},
  sortChip: {
    marginRight: 12,
  },
  sortChipContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sortChipActive: {
    backgroundColor: '#667eea',
  },
  sortChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  sortChipTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sectionWrapper: {
    borderRadius: 20,
  },
  sectionBlur: {
    borderRadius: 20,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sectionHeaderText: {},
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  streamGridContainer: {
    paddingHorizontal: 8,
  },
  gridContent: {
    paddingHorizontal: 8,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  loadingSectionHeader: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  loadingSectionBlur: {
    borderRadius: 20,
  },
  loadingSectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingSectionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 40,
    borderRadius: 24,
    overflow: 'hidden',
  },
  emptyStateGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadMoreContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  loadMoreGradient: {
    borderRadius: 20,
  },
  loadMoreBlur: {
    borderRadius: 20,
  },
  loadMoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  floatingButtonTouchable: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  floatingButtonBlur: {
    borderRadius: 28,
  },
  floatingButtonGradient: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProfessionalDiscoverScreen;
