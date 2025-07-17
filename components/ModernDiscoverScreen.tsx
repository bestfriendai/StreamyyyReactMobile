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
      <BlurView intensity={100} style={styles.headerBlur}>
        {/* Main Header */}
        <View style={styles.headerMain}>
          <View style={styles.headerLeft}>
            <View style={styles.titleSection}>
              <View style={styles.iconContainer}>
                <Flame size={24} color="#3b82f6" />
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
              {showSearch ? <X size={20} color="#3b82f6" /> : <Search size={20} color="#a1a1aa" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, showFilters && styles.actionButtonActive]}
              onPress={toggleFilters}
            >
              <SlidersHorizontal size={20} color={showFilters ? "#3b82f6" : "#a1a1aa"} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? (
                <List size={20} color="#a1a1aa" />
              ) : (
                <Grid3X3 size={20} color="#a1a1aa" />
              )}
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
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
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
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow}>
            {(['viewers', 'trending', 'recent', 'alphabetical'] as SortBy[]).map(sort => (
              <TouchableOpacity
                key={sort}
                style={[
                  styles.sortChip,
                  sortBy === sort && styles.sortChipActive,
                ]}
                onPress={() => setSortBy(sort)}
              >
                <Text
                  style={[
                    styles.sortText,
                    sortBy === sort && styles.sortTextActive,
                  ]}
                >
                  {sort.charAt(0).toUpperCase() + sort.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </BlurView>
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
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerBlur: {
    paddingBottom: 16,
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f4f4f5',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#71717a',
    fontWeight: '500',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  searchContainer: {
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    marginTop: 8,
  },
  searchField: {
    flex: 1,
    fontSize: 16,
    color: '#f4f4f5',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    overflow: 'hidden',
  },
  categoriesRow: {
    marginBottom: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
    gap: 4,
  },
  categoryChipActive: {
    backgroundColor: '#3b82f6',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#71717a',
  },
  categoryTextActive: {
    color: '#fff',
  },
  sortRow: {},
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
  },
  sortChipActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  sortText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#71717a',
  },
  sortTextActive: {
    color: '#3b82f6',
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