import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Search,
  Filter,
  Grid3X3,
  List,
  Play,
  Users,
  Eye,
  Star,
  Trash2,
  Plus,
  SortAsc,
  SortDesc,
} from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';
import { useStreamManager } from '@/hooks/useStreamManager';
import { ModernTheme } from '@/theme/modernTheme';

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

export function EnhancedFavoritesScreen() {
  const { favorites, removeFavorite, addToMultiView } = useStreamManager();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'viewers' | 'added'>('added');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterLive, setFilterLive] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Mock data for demonstration
  const [favoriteStreams, setFavoriteStreams] = useState<FavoriteStream[]>([
    {
      id: '1',
      username: 'shroud',
      title: 'VALORANT Ranked Grind | !settings !crosshair',
      game: 'VALORANT',
      viewers: 45230,
      isLive: true,
      thumbnail: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_shroud-320x180.jpg',
      addedAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      username: 'pokimane',
      title: 'Cozy morning stream! Chatting and games',
      game: 'Just Chatting',
      viewers: 28450,
      isLive: false,
      thumbnail: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_pokimane-320x180.jpg',
      addedAt: new Date('2024-01-10'),
    },
    {
      id: '3',
      username: 'xqcow',
      title: 'REACT ANDY + VARIETY GAMING | !gfuel !vpn',
      game: 'Variety',
      viewers: 67890,
      isLive: true,
      thumbnail: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_xqcow-320x180.jpg',
      addedAt: new Date('2024-01-12'),
    },
  ]);

  const filteredAndSortedStreams = favoriteStreams
    .filter(stream => {
      const matchesSearch = stream.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const handleRemoveFavorite = (streamId: string, username: string) => {
    Alert.alert(
      'Remove Favorite',
      `Remove ${username} from your favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setFavoriteStreams(prev => prev.filter(s => s.id !== streamId));
            removeFavorite(streamId);
          },
        },
      ]
    );
  };

  const handleAddToMultiView = (stream: FavoriteStream) => {
    addToMultiView({
      id: stream.id,
      username: stream.username,
      url: `https://www.twitch.tv/${stream.username}`,
      title: stream.title,
      game: stream.game,
      viewers: stream.viewers,
    });
    Alert.alert('Added to Multi-View', `${stream.username} has been added to your multi-view grid.`);
  };

  const formatViewers = (viewers: number) => {
    if (viewers >= 1000000) {
      return `${(viewers / 1000000).toFixed(1)}M`;
    } else if (viewers >= 1000) {
      return `${(viewers / 1000).toFixed(1)}K`;
    }
    return viewers.toString();
  };

  const renderStreamCard = (stream: FavoriteStream, index: number) => {
    const isGrid = viewMode === 'grid';
    const cardWidth = isGrid ? (screenWidth - 48) / 2 : screenWidth - 32;

    return (
      <MotiView
        key={stream.id}
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: index * 100 }}
        style={[
          styles.streamCard,
          { width: cardWidth },
          isGrid ? styles.gridCard : styles.listCard,
        ]}
      >
        <LinearGradient
          colors={['rgba(42, 42, 42, 0.95)', 'rgba(28, 28, 28, 0.95)']}
          style={styles.cardGradient}
        >
          {/* Live Indicator */}
          {stream.isLive && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}

          {/* Stream Info */}
          <View style={styles.streamInfo}>
            <Text style={styles.streamUsername} numberOfLines={1}>
              {stream.username}
            </Text>
            <Text style={styles.streamTitle} numberOfLines={isGrid ? 2 : 1}>
              {stream.title}
            </Text>
            <Text style={styles.streamGame} numberOfLines={1}>
              {stream.game}
            </Text>
            
            <View style={styles.streamStats}>
              <View style={styles.statItem}>
                <Eye size={14} color={ModernTheme.colors.textSecondary} />
                <Text style={styles.statText}>
                  {formatViewers(stream.viewers)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Star size={14} color={ModernTheme.colors.accent} />
                <Text style={styles.statText}>
                  {stream.addedAt.toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.playButton]}
              onPress={() => handleAddToMultiView(stream)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[ModernTheme.colors.primary[500], ModernTheme.colors.background.secondary]}
                style={styles.actionGradient}
              >
                <Plus size={16} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.removeButton]}
              onPress={() => handleRemoveFavorite(stream.id, stream.username)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#dc2626', '#b91c1c']}
                style={styles.actionGradient}
              >
                <Trash2 size={16} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </MotiView>
    );
  };

  const renderEmptyState = () => (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={styles.emptyState}
    >
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.1)', 'rgba(168, 85, 247, 0.05)']}
        style={styles.emptyGradient}
      >
        <Heart size={64} color={ModernTheme.colors.primary[500]} />
        <Text style={styles.emptyTitle}>No Favorites Yet</Text>
        <Text style={styles.emptySubtitle}>
          Add streamers to your favorites to see them here
        </Text>
        <TouchableOpacity style={styles.emptyButton}>
          <LinearGradient
            colors={[ModernTheme.colors.primary[500], ModernTheme.colors.background.secondary]}
            style={styles.emptyButtonGradient}
          >
            <Text style={styles.emptyButtonText}>Discover Streams</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />
      <LinearGradient
        colors={['#0f0f0f', '#1a1a1a', '#0f0f0f']}
        style={styles.background}
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={[
              'rgba(26, 26, 26, 0.98)',
              'rgba(15, 15, 15, 0.95)',
              'rgba(0, 0, 0, 0.9)'
            ]}
            style={styles.headerGradient}
          >
            <View style={styles.titleContainer}>
              <View style={styles.titleIconContainer}>
                <LinearGradient
                  colors={[ModernTheme.colors.primary[500], ModernTheme.colors.background.secondary]}
                  style={styles.titleIcon}
                >
                  <Heart size={24} color="#fff" />
                </LinearGradient>
              </View>
              <View>
                <Text style={styles.title}>Favorites</Text>
                <Text style={styles.subtitle}>
                  {favoriteStreams.length} streamers • {favoriteStreams.filter(s => s.isLive).length} live
                </Text>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <LinearGradient
                colors={['rgba(42, 42, 42, 0.9)', 'rgba(28, 28, 28, 0.9)']}
                style={styles.searchGradient}
              >
                <Search size={20} color={ModernTheme.colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search favorites..."
                  placeholderTextColor={ModernTheme.colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
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
                  <Grid3X3 size={18} color={viewMode === 'grid' ? '#fff' : ModernTheme.colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.viewModeButton, viewMode === 'list' && styles.activeViewMode]}
                  onPress={() => setViewMode('list')}
                >
                  <List size={18} color={viewMode === 'list' ? '#fff' : ModernTheme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.filterButton, showFilters && styles.activeFilter]}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Filter size={18} color={showFilters ? '#fff' : ModernTheme.colors.textSecondary} />
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
                        {['name', 'viewers', 'added'].map((sort) => (
                          <TouchableOpacity
                            key={sort}
                            style={[styles.sortButton, sortBy === sort && styles.activeSortButton]}
                            onPress={() => setSortBy(sort as any)}
                          >
                            <Text style={[styles.sortText, sortBy === sort && styles.activeSortText]}>
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
                        <Text style={[styles.liveFilterText, filterLive && styles.activeLiveFilterText]}>
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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredAndSortedStreams.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={[styles.streamsContainer, viewMode === 'grid' && styles.gridContainer]}>
              {filteredAndSortedStreams.map((stream, index) => renderStreamCard(stream, index))}
            </View>
          )}
        </ScrollView>
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
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 1,
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
  streamGame: {
    color: ModernTheme.colors.primary[500],
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginBottom: 12,
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
    color: ModernTheme.colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionGradient: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {},
  removeButton: {},
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyGradient: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
    width: '100%',
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
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});