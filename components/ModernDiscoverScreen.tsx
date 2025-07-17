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
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Star,
  Flame,
} from 'lucide-react-native';
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ModernStreamCard } from './ModernStreamCard';
import { TwitchStream, TwitchGame } from '@/services/twitchApi';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ModernDiscoverScreenProps {
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

const CATEGORIES = [
  { id: 'all', name: 'All', icon: Grid3X3 },
  { id: 'gaming', name: 'Gaming', icon: TrendingUp },
  { id: 'irl', name: 'Just Chatting', icon: Users },
  { id: 'creative', name: 'Creative', icon: Star },
];

export const ModernDiscoverScreen: React.FC<ModernDiscoverScreenProps> = ({
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortBy>('viewers');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Animation values
  const searchHeight = useSharedValue(0);
  const filtersHeight = useSharedValue(0);

  // Calculate grid dimensions
  const numColumns = viewMode === 'grid' ? 2 : 1;
  const cardWidth = viewMode === 'grid' ? (SCREEN_WIDTH - 24) / 2 - 8 : SCREEN_WIDTH - 24;

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
            stream => !stream.game_name.toLowerCase().includes('just chatting')
          );
          break;
        case 'irl':
          filtered = filtered.filter(stream =>
            stream.game_name.toLowerCase().includes('just chatting')
          );
          break;
        case 'creative':
          filtered = filtered.filter(stream =>
            stream.game_name.toLowerCase().includes('art') ||
            stream.game_name.toLowerCase().includes('music') ||
            stream.game_name.toLowerCase().includes('creative')
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
        filtered.sort((a, b) => {
          const aScore = a.viewer_count * (Date.now() - new Date(a.started_at).getTime()) / 1000000;
          const bScore = b.viewer_count * (Date.now() - new Date(b.started_at).getTime()) / 1000000;
          return bScore - aScore;
        });
        break;
    }

    return filtered;
  }, [streams, searchQuery, selectedCategory, sortBy]);

  const toggleSearch = useCallback(() => {
    const newShowSearch = !showSearch;
    setShowSearch(newShowSearch);
    searchHeight.value = withTiming(newShowSearch ? 60 : 0, { duration: 300 });
    if (!newShowSearch) setSearchQuery('');
  }, [showSearch]);

  const toggleFilters = useCallback(() => {
    const newShowFilters = !showFilters;
    setShowFilters(newShowFilters);
    filtersHeight.value = withTiming(newShowFilters ? 120 : 0, { duration: 300 });
  }, [showFilters]);

  const searchAnimatedStyle = useAnimatedStyle(() => ({
    height: searchHeight.value,
    opacity: interpolate(searchHeight.value, [0, 60], [0, 1]),
  }));

  const filtersAnimatedStyle = useAnimatedStyle(() => ({
    height: filtersHeight.value,
    opacity: interpolate(filtersHeight.value, [0, 120], [0, 1]),
  }));

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={['#000000', '#0a0a0a']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Main Header */}
        <View style={styles.headerMain}>
          <View style={styles.headerLeft}>
            <View style={styles.titleSection}>
              <View style={styles.iconContainer}>
                <Flame size={22} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.title}>Discover</Text>
                <Text style={styles.subtitle}>
                  {processedStreams.length} streams • {processedStreams.reduce((acc, s) => acc + s.viewer_count, 0).toLocaleString()} viewers
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionButton, showSearch && styles.actionButtonActive]}
              onPress={toggleSearch}
            >
              <LinearGradient
                colors={
                  showSearch 
                    ? ['#3b82f6', '#2563eb'] 
                    : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']
                }
                style={styles.actionButtonGradient}
              >
                {showSearch ? <X size={18} color="#ffffff" /> : <Search size={18} color="#a1a1aa" />}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, showFilters && styles.actionButtonActive]}
              onPress={toggleFilters}
            >
              <LinearGradient
                colors={
                  showFilters 
                    ? ['#3b82f6', '#2563eb'] 
                    : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']
                }
                style={styles.actionButtonGradient}
              >
                <SlidersHorizontal size={18} color={showFilters ? "#ffffff" : "#a1a1aa"} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                style={styles.actionButtonGradient}
              >
                {viewMode === 'grid' ? (
                  <List size={18} color="#a1a1aa" />
                ) : (
                  <Grid3X3 size={18} color="#a1a1aa" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <Animated.View style={[styles.searchContainer, searchAnimatedStyle]}>
          <View style={styles.searchInput}>
            <Search size={16} color="#71717a" />
            <TextInput
              style={styles.searchField}
              placeholder="Search streams, games, or streamers..."
              placeholderTextColor="#71717a"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={showSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#71717a" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Filters */}
        <Animated.View style={[styles.filtersContainer, filtersAnimatedStyle]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
            {CATEGORIES.map(category => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryChip}
                onPress={() => setSelectedCategory(category.id)}
              >
                <LinearGradient
                  colors={selectedCategory === category.id ? ['#3b82f6', '#2563eb'] : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                  style={styles.categoryChipGradient}
                >
                  <category.icon
                    size={14}
                    color={selectedCategory === category.id ? "#fff" : "#71717a"}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category.id && styles.categoryTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow}>
            {(['viewers', 'trending', 'recent', 'alphabetical'] as SortBy[]).map(sort => (
              <TouchableOpacity
                key={sort}
                style={styles.sortChip}
                onPress={() => setSortBy(sort)}
              >
                <LinearGradient
                  colors={sortBy === sort ? ['#3b82f6', '#2563eb'] : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                  style={styles.sortChipGradient}
                >
                  <Text
                    style={[
                      styles.sortText,
                      sortBy === sort && styles.sortTextActive,
                    ]}
                  >
                    {sort.charAt(0).toUpperCase() + sort.slice(1)}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </LinearGradient>
    </View>
  );

  const renderStreamGrid = () => (
    <FlatList
      data={processedStreams}
      renderItem={({ item }) => (
        <ModernStreamCard
          stream={item}
          onPress={() => onStreamSelect(item)}
          onAddToMultiView={async () => await onAddStream(item)}
          onToggleFavorite={() => onToggleFavorite(item.user_id)}
          isFavorite={isFavorite(item.user_id)}
          isActive={isStreamActive(item.id)}
          width={cardWidth}
          showAddButton={true}
        />
      )}
      numColumns={numColumns}
      key={`${viewMode}-${numColumns}`}
      extraData={isStreamActive}
      contentContainerStyle={styles.gridContainer}
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          tintColor="#3b82f6"
          colors={["#3b82f6"]}
        />
      }
      onEndReached={() => {
        if (hasMore && !isLoading && onLoadMore) {
          onLoadMore();
        }
      }}
      onEndReachedThreshold={0.1}
      keyExtractor={item => item.id}
    />
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {renderHeader()}
        <View style={styles.content}>
          {processedStreams.length > 0 ? (
            renderStreamGrid()
          ) : (
            <View style={styles.emptyState}>
              <Search size={48} color="#71717a" />
              <Text style={styles.emptyTitle}>No streams found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerGradient: {
    paddingBottom: 16,
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerLeft: {
    flex: 1,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 12,
    color: '#71717a',
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    transform: [{ scale: 0.95 }],
  },
  searchContainer: {
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  searchField: {
    flex: 1,
    fontSize: 16,
    color: '#f4f4f5',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    overflow: 'hidden',
  },
  categoriesRow: {
    marginBottom: 10,
  },
  categoryChip: {
    borderRadius: 18,
    marginRight: 8,
    overflow: 'hidden',
  },
  categoryChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  sortRow: {},
  sortChip: {
    borderRadius: 16,
    marginRight: 8,
    overflow: 'hidden',
  },
  sortChipGradient: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sortText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
  },
  sortTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  gridContainer: {
    padding: 12,
    paddingTop: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f4f4f5',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center',
  },
});