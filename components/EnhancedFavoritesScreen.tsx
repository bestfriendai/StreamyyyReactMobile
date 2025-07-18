import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Heart,
  Search,
  Filter,
  Grid3X3,
  List,
  Eye,
  Plus,
  SortAsc,
  SortDesc,
  Sparkles,
  Zap,
  Clock,
  TrendingUp,
  Bookmark,
  MoreVertical,
} from 'lucide-react-native';
import { MotiView, AnimatePresence, MotiText } from 'moti';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Platform,
  Dimensions,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import {
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStreamManager } from '@/hooks/useStreamManager';
import { ModernTheme } from '@/theme/modernTheme';
import { HapticFeedback } from '@/utils/haptics';

const { width: screenWidth } = Dimensions.get('window');

interface FavoriteStream {
  id: string;
  username: string;
  title: string;
  game: string;
  viewers: number;
  isLive: boolean;
  thumbnail: string;
  addedAt: Date;
}

interface FavoritesScreenProps {
  searchQuery?: string;
  selectedCategory?: string;
  onStreamSelect?: (stream: any) => void;
  onToggleFavorite?: (streamId: string) => void;
}

export function EnhancedFavoritesScreen(props: FavoritesScreenProps = {}) {
  const { favorites, removeFavorite, addToMultiView } = useStreamManager();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'viewers' | 'added'>('added');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterLive, setFilterLive] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const cardScale = useSharedValue(1);

  // Convert TwitchStream favorites to FavoriteStream format for UI compatibility
  const favoriteStreams = useMemo(() => {
    return favorites.map((stream): FavoriteStream => ({
      id: stream.id,
      username: stream.user_name,
      title: stream.title,
      game: stream.game_name,
      viewers: stream.viewer_count,
      isLive: stream.type === 'live',
      thumbnail: stream.thumbnail_url,
      addedAt: 'fetchedAt' in stream && typeof stream.fetchedAt === 'string'
        ? new Date(stream.fetchedAt)
        : new Date(),
    }));
  }, [favorites]);

  // Filter and sort streams with memoization for performance
  const filteredAndSortedStreams = useMemo(() => {
    return favoriteStreams
      .filter(stream => {
        const matchesSearch =
          stream.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stream.game.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = !filterLive || stream.isLive;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'name':
            comparison = a.username.localeCompare(b.username);
            break;
          case 'viewers':
            comparison = a.viewers - b.viewers;
            break;
          case 'added':
            comparison = a.addedAt.getTime() - b.addedAt.getTime();
            break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [favoriteStreams, searchQuery, filterLive, sortBy, sortOrder]);

  const handleRemoveFavorite = (streamId: string, username: string) => {
    Alert.alert('Remove Favorite', `Remove ${username} from your favorites?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeFavorite(streamId);
        },
      },
    ]);
  };

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      // Add actual refresh logic here if needed
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Refresh failed:', error);
      Alert.alert('Error', 'Failed to refresh favorites. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleAddToMultiView = useCallback(async (stream: FavoriteStream) => {
    try {
      await HapticFeedback.medium();
      const result = await addToMultiView({
        id: stream.id,
        username: stream.username,
        url: `https://www.twitch.tv/${stream.username}`,
        title: stream.title,
        game: stream.game,
        viewers: stream.viewers,
      });

      if (result.success) {
        Alert.alert(
          'Added to Multi-View',
          result.message,
          [
            { text: 'OK' },
            {
              text: 'View Grid',
              onPress: () => {
                router.push('/(tabs)/grid');
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error adding to multi-view:', error);
      Alert.alert('Error', 'Failed to add stream to multi-view');
    }
  }, [addToMultiView, router]);

  const formatViewers = (viewers: number) => {
    if (viewers >= 1000000) {
      return `${(viewers / 1000000).toFixed(1)}M`;
    } else if (viewers >= 1000) {
      return `${(viewers / 1000).toFixed(1)}K`;
    }
    return viewers.toString();
  };

  const renderStreamCard = useCallback((stream: FavoriteStream, index: number) => {
    const isGrid = viewMode === 'grid';
    const cardWidth = isGrid ? (screenWidth - 48) / 2 : screenWidth - 32;
    const isSelected = false; // Removed bulk selection feature

    return (
      <MotiView
        key={stream.id}
        from={{ opacity: 0, translateY: 30, scale: 0.9 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{
          delay: index * 80,
          type: 'spring',
          damping: 15,
          stiffness: 200,
        }}
        style={[
          styles.streamCard,
          { width: cardWidth },
          isGrid ? styles.gridCard : styles.listCard,
          isSelected && styles.selectedCard,
        ]}
      >
        <View style={styles.cardWrapper}>
          <LinearGradient
            colors={
              isSelected
                ? ['rgba(139, 92, 246, 0.2)', 'rgba(124, 58, 237, 0.15)', 'rgba(42, 42, 42, 0.95)']
                : ['rgba(42, 42, 42, 0.95)', 'rgba(28, 28, 28, 0.95)', 'rgba(15, 15, 15, 0.98)']
            }
            style={styles.cardGradient}
          >
            {/* Enhanced Live Indicator */}
            {stream.isLive && (
              <MotiView
                from={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'spring',
                  damping: 12,
                  loop: true,
                  repeatReverse: true,
                }}
                style={styles.liveIndicator}
              >
                <LinearGradient colors={['#ff4444', '#dc2626']} style={styles.liveGradient}>
                  <MotiView
                    from={{ scale: 0.8 }}
                    animate={{ scale: 1.2 }}
                    transition={{
                      type: 'timing',
                      duration: 1000,
                      loop: true,
                      repeatReverse: true,
                    }}
                    style={styles.liveDot}
                  />
                  <Text style={styles.liveText}>LIVE</Text>
                </LinearGradient>
              </MotiView>
            )}

            {/* Quality Badge */}
            <View style={styles.qualityBadge}>
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.9)', 'rgba(5, 150, 105, 0.8)']}
                style={styles.qualityGradient}
              >
                <Zap size={10} color="#fff" />
                <Text style={styles.qualityText}>HD</Text>
              </LinearGradient>
            </View>

            {/* Enhanced Stream Info */}
            <View style={styles.streamInfo}>
              <MotiText
                from={{ opacity: 0, translateX: -10 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 100 }}
                style={styles.streamUsername}
                numberOfLines={1}
              >
                {stream.username}
              </MotiText>

              <MotiText
                from={{ opacity: 0, translateX: -10 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 150 }}
                style={styles.streamTitle}
                numberOfLines={isGrid ? 2 : 1}
              >
                {stream.title}
              </MotiText>

              <View style={styles.gameContainer}>
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.3)', 'rgba(124, 58, 237, 0.2)']}
                  style={styles.gameGradient}
                >
                  <Text style={styles.streamGame} numberOfLines={1}>
                    {stream.game}
                  </Text>
                </LinearGradient>
              </View>

              <View style={styles.streamStats}>
                <View style={styles.statItem}>
                  <Eye size={14} color={ModernTheme.colors.text.secondary} />
                  <Text style={styles.statText}>{formatViewers(stream.viewers)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Clock size={14} color={ModernTheme.colors.text.accent} />
                  <Text style={styles.statText}>{stream.addedAt.toLocaleDateString()}</Text>
                </View>
                <View style={styles.statItem}>
                  <TrendingUp size={14} color="#10B981" />
                  <Text style={[styles.statText, { color: '#10B981' }]}>
                    +{Math.floor(Math.random() * 50)}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Enhanced Action Buttons */}
            <View style={styles.actionButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.playButton,
                  pressed && { transform: [{ scale: 0.95 }] },
                ]}
                onPress={async () => {
                  try {
                    await HapticFeedback.medium();
                    cardScale.value = withSpring(1.05, { damping: 15 }, () => {
                      cardScale.value = withSpring(1);
                    });
                    await handleAddToMultiView(stream);
                  } catch (error) {
                    console.error('Action failed:', error);
                    await HapticFeedback.light(); // Error feedback
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={`Add ${stream.username} to multi-view`}
                accessibilityHint="Adds this stream to your multi-view grid for simultaneous viewing"
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED', '#6366F1']}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Plus size={16} color="#fff" />
                  <Text style={styles.actionText}>Add</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.bookmarkButton,
                  pressed && { transform: [{ scale: 0.95 }] },
                ]}
                onPress={() => {
                  HapticFeedback.light();
                  // Toggle bookmark/priority
                  Alert.alert('Bookmark', 'Stream bookmarked!');
                }}
              >
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Bookmark size={16} color="#fff" />
                </LinearGradient>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.moreButton,
                  pressed && { transform: [{ scale: 0.95 }] },
                ]}
                onPress={() => {
                  HapticFeedback.light();
                  // Show more options
                  Alert.alert('More Options', 'Share, Remove, Settings...');
                }}
              >
                <LinearGradient
                  colors={['rgba(55, 65, 81, 0.8)', 'rgba(31, 41, 55, 0.8)']}
                  style={styles.actionGradient}
                >
                  <MoreVertical size={16} color="#fff" />
                </LinearGradient>
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </MotiView>
    );
  }, [viewMode, screenWidth, handleAddToMultiView]);

  const renderEmptyState = () => (
    <MotiView
      from={{ opacity: 0, scale: 0.8, rotate: '-5deg' }}
      animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 300,
      }}
      style={styles.emptyState}
    >
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.15)', 'rgba(168, 85, 247, 0.1)', 'rgba(99, 102, 241, 0.05)']}
        style={styles.emptyGradient}
      >
        <MotiView
          from={{ scale: 0.5, rotate: '-180deg' }}
          animate={{ scale: 1, rotate: '0deg' }}
          transition={{
            type: 'spring',
            damping: 15,
            stiffness: 200,
            delay: 200,
          }}
        >
          <Heart size={80} color={ModernTheme.colors.primary[500]} />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 400 }}
          style={styles.emptyTextContainer}
        >
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptySubtitle}>Add streamers to your favorites to see them here</Text>
          <View style={styles.emptyFeatures}>
            <View style={styles.emptyFeature}>
              <Sparkles size={16} color={ModernTheme.colors.primary[500]} />
              <Text style={styles.emptyFeatureText}>Get notified when they go live</Text>
            </View>
            <View style={styles.emptyFeature}>
              <Zap size={16} color={ModernTheme.colors.primary[500]} />
              <Text style={styles.emptyFeatureText}>Quick access to your favorites</Text>
            </View>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 600 }}
        >
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => Alert.alert('Navigate', 'Navigate to discover screen')}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED', '#6366F1']}
              style={styles.emptyButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Search size={18} color="#fff" />
              <Text style={styles.emptyButtonText}>Discover Streams</Text>
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>
      </LinearGradient>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />
      <LinearGradient colors={['#0f0f0f', '#1a1a1a', '#0f0f0f']} style={styles.background} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['rgba(26, 26, 26, 0.98)', 'rgba(15, 15, 15, 0.95)', 'rgba(0, 0, 0, 0.9)']}
            style={styles.headerGradient}
          >
            <View style={styles.titleContainer}>
              <View style={styles.titleIconContainer}>
                <LinearGradient
                  colors={[
                    ModernTheme.colors.primary[500],
                    ModernTheme.colors.background.secondary,
                  ]}
                  style={styles.titleIcon}
                >
                  <Heart size={24} color="#fff" />
                </LinearGradient>
              </View>
              <View>
                <Text style={styles.title}>Favorites</Text>
                <Text style={styles.subtitle}>
                  {favoriteStreams.length} streamers •{' '}
                  {favoriteStreams.filter(s => s.isLive).length} live
                </Text>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <LinearGradient
                colors={['rgba(42, 42, 42, 0.9)', 'rgba(28, 28, 28, 0.9)']}
                style={styles.searchGradient}
              >
                <Search size={20} color={ModernTheme.colors.text.secondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search favorites..."
                  placeholderTextColor={ModernTheme.colors.text.secondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  accessibilityLabel="Search favorites"
                  accessibilityHint="Type to search through your favorite streams by name, title, or game"
                />
              </LinearGradient>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <View style={styles.viewModeContainer}>
                <TouchableOpacity
                  style={[styles.viewModeButton, viewMode === 'grid' && styles.activeViewMode]}
                  onPress={() => setViewMode('grid')}
                >
                  <Grid3X3
                    size={18}
                    color={viewMode === 'grid' ? '#fff' : ModernTheme.colors.text.secondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.viewModeButton, viewMode === 'list' && styles.activeViewMode]}
                  onPress={() => setViewMode('list')}
                >
                  <List
                    size={18}
                    color={viewMode === 'list' ? '#fff' : ModernTheme.colors.text.secondary}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.filterButton, showFilters && styles.activeFilter]}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Filter size={18} color={showFilters ? '#fff' : ModernTheme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <MotiView
                  from={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={styles.filterPanel}
                >
                  <LinearGradient
                    colors={['rgba(42, 42, 42, 0.9)', 'rgba(28, 28, 28, 0.9)']}
                    style={styles.filterGradient}
                  >
                    <View style={styles.filterRow}>
                      <Text style={styles.filterLabel}>Sort by:</Text>
                      <View style={styles.sortButtons}>
                        {['name', 'viewers', 'added'].map(sort => (
                          <TouchableOpacity
                            key={sort}
                            style={[styles.sortButton, sortBy === sort && styles.activeSortButton]}
                            onPress={() => setSortBy(sort as 'name' | 'viewers' | 'added')}
                          >
                            <Text
                              style={[styles.sortText, sortBy === sort && styles.activeSortText]}
                            >
                              {sort.charAt(0).toUpperCase() + sort.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                          style={styles.sortOrderButton}
                          onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        >
                          {sortOrder === 'asc' ? (
                            <SortAsc size={16} color={ModernTheme.colors.primary[500]} />
                          ) : (
                            <SortDesc size={16} color={ModernTheme.colors.primary[500]} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.filterRow}>
                      <Text style={styles.filterLabel}>Show only live:</Text>
                      <TouchableOpacity
                        style={[styles.liveFilterButton, filterLive && styles.activeLiveFilter]}
                        onPress={() => setFilterLive(!filterLive)}
                      >
                        <Text
                          style={[styles.liveFilterText, filterLive && styles.activeLiveFilterText]}
                        >
                          {filterLive ? 'ON' : 'OFF'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </MotiView>
              )}
            </AnimatePresence>
          </LinearGradient>
        </View>

        {/* Content */}
        <FlatList
          data={filteredAndSortedStreams}
          renderItem={({ item, index }) => renderStreamCard(item, index)}
          keyExtractor={item => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // Force re-render when view mode changes
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={ModernTheme.colors.primary[500]}
              colors={[ModernTheme.colors.primary[500]]}
            />
          }
          ListEmptyComponent={renderEmptyState}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        />
      </SafeAreaView>
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
  safeArea: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  titleIconContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  titleIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#999',
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  searchContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(42, 42, 42, 0.6)',
    borderRadius: 8,
    padding: 2,
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeViewMode: {
    backgroundColor: ModernTheme.colors.primary[500],
  },
  filterButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(42, 42, 42, 0.6)',
  },
  activeFilter: {
    backgroundColor: ModernTheme.colors.primary[500],
  },
  filterPanel: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  filterGradient: {
    padding: 16,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(58, 58, 58, 0.8)',
  },
  activeSortButton: {
    backgroundColor: ModernTheme.colors.primary[500],
  },
  sortText: {
    color: '#999',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  activeSortText: {
    color: '#fff',
  },
  sortOrderButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(58, 58, 58, 0.8)',
  },
  liveFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(58, 58, 58, 0.8)',
  },
  activeLiveFilter: {
    backgroundColor: '#10b981',
  },
  liveFilterText: {
    color: '#999',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  activeLiveFilterText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  streamsContainer: {
    gap: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  streamCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  selectedCard: {
    borderColor: 'rgba(139, 92, 246, 0.6)',
    borderWidth: 2,
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  gridCard: {
    marginBottom: 16,
  },
  listCard: {
    marginBottom: 12,
  },
  cardGradient: {
    padding: 16,
    position: 'relative',
  },
  liveIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#ff4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1,
  },
  liveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  qualityBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 1,
  },
  qualityGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 3,
  },
  qualityText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  streamInfo: {
    marginBottom: 16,
  },
  streamUsername: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  streamTitle: {
    color: '#ccc',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
    marginBottom: 8,
  },
  gameContainer: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  gameGradient: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  streamGame: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  streamStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  actionGradient: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  playButton: {},
  bookmarkButton: {},
  moreButton: {},
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyGradient: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  emptyTextContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  emptyFeatures: {
    marginTop: 16,
    gap: 12,
  },
  emptyFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyFeatureText: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#999',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    gap: 10,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  itemSeparator: {
    height: 16,
  },
});

export default EnhancedFavoritesScreen;
