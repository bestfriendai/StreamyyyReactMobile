import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  Filter,
  TrendingUp,
  Users,
  Sparkles,
  Settings,
  Bell,
  Heart,
  Share2,
  Calendar,
  BarChart3,
  Globe,
  Zap,
  Award,
  MessageSquare,
  Bookmark,
  Activity,
  X,
  Check,
} from 'lucide-react-native';
import { MotiView, MotiText } from 'moti';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Platform,
  StatusBar,
  RefreshControl,
  Dimensions,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useStreamManagerContext } from '@/contexts/StreamManagerContext';
import {
  discordService,
  sendStreamNotification,
  createStreamCommunity,
} from '@/services/discordService';
import {
  notificationService,
  sendStreamLiveNotification,
  updateNotificationPreferences,
} from '@/services/notificationService';
import {
  platformService,
  UnifiedStream,
  Platform,
  fetchAllLiveStreams,
  fetchStreamsByPlatform,
  searchAllPlatforms,
  fetchPlatformStats,
} from '@/services/platformService';
import { socialService, getUserProfile, followStreamer } from '@/services/socialService';
import { BlurViewFallback as BlurView } from './BlurViewFallback';
import { MultiPlatformStreamCard } from './MultiPlatformStreamCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FilterOptions {
  platforms: Platform[];
  categories: string[];
  languages: string[];
  minViewers: number;
  maxViewers: number;
  sortBy: 'viewers' | 'recent' | 'trending' | 'followed';
  showLiveOnly: boolean;
}

interface CategoryTab {
  id: string;
  name: string;
  icon: React.ReactNode;
  gradient: string[];
  platforms: Platform[];
}

const platformTabs: CategoryTab[] = [
  {
    id: 'all',
    name: 'All Platforms',
    icon: <Globe size={16} color="#fff" />,
    gradient: ['#8B5CF6', '#7C3AED'],
    platforms: ['twitch', 'youtube', 'kick'],
  },
  {
    id: 'twitch',
    name: 'Twitch',
    icon: <Zap size={16} color="#fff" />,
    gradient: ['#9146FF', '#772CE8'],
    platforms: ['twitch'],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: <TrendingUp size={16} color="#fff" />,
    gradient: ['#FF0000', '#CC0000'],
    platforms: ['youtube'],
  },
  {
    id: 'kick',
    name: 'Kick',
    icon: <Activity size={16} color="#fff" />,
    gradient: ['#53FC18', '#3FBF12'],
    platforms: ['kick'],
  },
];

const quickCategories = [
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'just-chatting', name: 'Just Chatting', icon: '💬' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'art', name: 'Art', icon: '🎨' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'irl', name: 'IRL', icon: '🌍' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'cooking', name: 'Cooking', icon: '👨‍🍳' },
];

export const MultiPlatformDiscoveryScreen: React.FC = () => {
  const { user } = useAuth();
  const { addStream, toggleFavorite, isFavorite, isStreamActive } = useStreamManager();

  const [streams, setStreams] = useState<UnifiedStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [platformStats, setPlatformStats] = useState<any[]>([]);
  const [followedStreamers, setFollowedStreamers] = useState<string[]>([]);
  const [totalStreamers, setTotalStreamers] = useState(0);

  const [filters, setFilters] = useState<FilterOptions>({
    platforms: ['twitch', 'youtube', 'kick'],
    categories: [],
    languages: [],
    minViewers: 0,
    maxViewers: 1000000,
    sortBy: 'viewers',
    showLiveOnly: true,
  });

  const flatListRef = useRef<FlatList>(null);
  const searchInputRef = useRef<TextInput>(null);

  // Animation values
  const headerScale = useSharedValue(1);
  const searchOpacity = useSharedValue(0);
  const filterOpacity = useSharedValue(0);
  const scrollY = useSharedValue(0);

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (selectedPlatform || selectedCategory || searchQuery) {
      fetchStreams();
    }
  }, [selectedPlatform, selectedCategory, searchQuery, filters]);

  const initializeData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchStreams(), loadPlatformStats(), loadFollowedStreamers()]);
    } catch (error) {
      console.error('Failed to initialize data:', error);
      setError('Failed to load streams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStreams = async () => {
    try {
      setError(null);

      let result: UnifiedStream[] = [];

      if (searchQuery.trim()) {
        result = await searchAllPlatforms(searchQuery, filters.platforms, 20);
      } else if (selectedPlatform === 'all') {
        result = await fetchAllLiveStreams(20);
      } else {
        result = await fetchStreamsByPlatform(selectedPlatform as Platform, 20);
      }

      // Apply filters
      result = applyFilters(result);

      // Sort streams
      result = sortStreams(result);

      setStreams(result);
      setTotalStreamers(result.length);
    } catch (error) {
      console.error('Failed to fetch streams:', error);
      setError('Failed to load streams. Please try again.');
    }
  };

  const loadPlatformStats = async () => {
    try {
      const stats = await fetchPlatformStats();
      setPlatformStats(stats);
    } catch (error) {
      console.error('Failed to load platform stats:', error);
    }
  };

  const loadFollowedStreamers = async () => {
    if (!user?.id) {
      return;
    }

    try {
      const streamers = await socialService.getFollowedStreamers(user.id);
      setFollowedStreamers(streamers.map(s => s.id));
    } catch (error) {
      console.error('Failed to load followed streamers:', error);
    }
  };

  const applyFilters = (streams: UnifiedStream[]): UnifiedStream[] => {
    return streams.filter(stream => {
      // Platform filter
      if (!filters.platforms.includes(stream.platform)) {
        return false;
      }

      // Category filter
      if (
        selectedCategory &&
        !stream.category.toLowerCase().includes(selectedCategory.toLowerCase())
      ) {
        return false;
      }

      // Language filter
      if (
        filters.languages.length > 0 &&
        stream.language &&
        !filters.languages.includes(stream.language)
      ) {
        return false;
      }

      // Viewer count filter
      if (stream.viewerCount < filters.minViewers || stream.viewerCount > filters.maxViewers) {
        return false;
      }

      // Live only filter
      if (filters.showLiveOnly && !stream.isLive) {
        return false;
      }

      return true;
    });
  };

  const sortStreams = (streams: UnifiedStream[]): UnifiedStream[] => {
    return [...streams].sort((a, b) => {
      switch (filters.sortBy) {
        case 'viewers':
          return b.viewerCount - a.viewerCount;
        case 'recent':
          return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
        case 'trending':
          return (
            b.viewerCount * 0.7 +
            new Date(b.startedAt).getTime() * 0.3 -
            (a.viewerCount * 0.7 + new Date(a.startedAt).getTime() * 0.3)
          );
        case 'followed':
          const aFollowed = followedStreamers.includes(a.streamerName);
          const bFollowed = followedStreamers.includes(b.streamerName);
          if (aFollowed && !bFollowed) {
            return -1;
          }
          if (!aFollowed && bFollowed) {
            return 1;
          }
          return b.viewerCount - a.viewerCount;
        default:
          return 0;
      }
    });
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchStreams(), loadPlatformStats(), loadFollowedStreamers()]);
    setRefreshing(false);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handlePlatformSelect = (platformId: string) => {
    headerScale.value = withSpring(0.95, { damping: 15 }, () => {
      headerScale.value = withSpring(1);
    });

    setSelectedPlatform(platformId);
    setSelectedCategory('');
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? '' : categoryId);
  };

  const toggleSearch = () => {
    const newState = !showSearch;
    setShowSearch(newState);
    searchOpacity.value = withTiming(newState ? 1 : 0, { duration: 300 });

    if (newState) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
      searchInputRef.current?.blur();
    }
  };

  const toggleFilters = () => {
    const newState = !showFilters;
    setShowFilters(newState);
    filterOpacity.value = withTiming(newState ? 1 : 0, { duration: 300 });
  };

  const handleStreamPress = (stream: UnifiedStream) => {
    // Navigate to stream viewer
    console.log('Opening stream:', stream.id);
  };

  const handleAddStream = (stream: UnifiedStream) => {
    addStream(stream);

    // Track activity
    if (user?.id) {
      socialService.trackActivity({
        userId: user.id,
        type: 'stream_watched',
        title: `Started watching ${stream.streamerDisplayName}`,
        description: stream.title,
        metadata: {
          streamId: stream.id,
          platform: stream.platform,
          streamerName: stream.streamerName,
        },
        isPublic: true,
      });
    }
  };

  const handleToggleFavorite = async (stream: UnifiedStream) => {
    toggleFavorite(stream.streamerName);

    if (user?.id) {
      const isCurrentlyFavorite = isFavorite(stream.streamerName);

      if (!isCurrentlyFavorite) {
        try {
          await followStreamer(user.id, stream.streamerName, stream.platform);
          await sendStreamLiveNotification(stream, user.id);
          setFollowedStreamers(prev => [...prev, stream.streamerName]);
        } catch (error) {
          console.error('Failed to follow streamer:', error);
        }
      } else {
        try {
          await socialService.unfollowStreamer(user.id, stream.streamerName);
          setFollowedStreamers(prev => prev.filter(id => id !== stream.streamerName));
        } catch (error) {
          console.error('Failed to unfollow streamer:', error);
        }
      }
    }
  };

  const handleCreateCommunity = async (stream: UnifiedStream) => {
    if (!user?.id) {
      return;
    }

    try {
      await createStreamCommunity({
        name: `${stream.streamerDisplayName} Community`,
        description: `Official community for ${stream.streamerDisplayName} streams`,
        streamer: stream.streamerName,
        platform: stream.platform,
        memberCount: 0,
        isPublic: true,
        tags: [stream.platform, stream.category],
        rules: [
          'Be respectful to all members',
          'No spam or self-promotion',
          'Stay on topic',
          'Follow platform guidelines',
        ],
        moderators: [user.id],
        features: {
          liveNotifications: true,
          streamSchedule: true,
          clipSharing: true,
          chatRelay: false,
          voiceChannels: true,
        },
      });

      Alert.alert('Community Created', `Created community for ${stream.streamerDisplayName}!`);
    } catch (error) {
      console.error('Failed to create community:', error);
      Alert.alert('Error', 'Failed to create community. Please try again.');
    }
  };

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
    opacity: interpolate(scrollY.value, [0, 100], [1, 0.8]),
  }));

  const animatedSearchStyle = useAnimatedStyle(() => ({
    opacity: searchOpacity.value,
    transform: [{ translateY: interpolate(searchOpacity.value, [0, 1], [-20, 0]) }],
  }));

  const animatedFilterStyle = useAnimatedStyle(() => ({
    opacity: filterOpacity.value,
    transform: [{ translateY: interpolate(filterOpacity.value, [0, 1], [-20, 0]) }],
  }));

  const renderHeader = () => (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      style={styles.headerContainer}
    >
      <BlurView style={styles.headerBlur} blurType="dark" blurAmount={20}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.15)', 'rgba(124, 58, 237, 0.1)', 'transparent']}
          style={styles.headerGradient}
        >
          <Animated.View style={[styles.titleContainer, animatedHeaderStyle]}>
            <MotiView
              from={{ scale: 0.5, rotate: '-180deg' }}
              animate={{ scale: 1, rotate: '0deg' }}
              transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 200 }}
            >
              <Sparkles size={28} color="#8B5CF6" />
            </MotiView>

            <View style={styles.titleTextContainer}>
              <MotiText
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 300 }}
                style={styles.title}
              >
                Multi-Platform Discovery
              </MotiText>
              <MotiText
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 400 }}
                style={styles.subtitle}
              >
                {totalStreamers.toLocaleString()} live streams across platforms
              </MotiText>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionButton} onPress={toggleSearch}>
                <BlurView style={styles.actionButtonBlur} blurType="dark" blurAmount={10}>
                  <Search size={20} color="#8B5CF6" />
                </BlurView>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={toggleFilters}>
                <BlurView style={styles.actionButtonBlur} blurType="dark" blurAmount={10}>
                  <Filter size={20} color="#8B5CF6" />
                </BlurView>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <BlurView style={styles.actionButtonBlur} blurType="dark" blurAmount={10}>
                  <Bell size={20} color="#8B5CF6" />
                </BlurView>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Search Bar */}
          <Animated.View style={[styles.searchContainer, animatedSearchStyle]}>
            <BlurView style={styles.searchBlur} blurType="dark" blurAmount={10}>
              <Search size={20} color="#666" />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search streams, streamers, or categories..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <X size={20} color="#666" />
                </TouchableOpacity>
              )}
            </BlurView>
          </Animated.View>

          {/* Platform Tabs */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 500 }}
            style={styles.platformTabs}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsList}
            >
              {platformTabs.map((tab, index) => (
                <MotiView
                  key={tab.id}
                  from={{ opacity: 0, scale: 0.8, translateX: 50 }}
                  animate={{ opacity: 1, scale: 1, translateX: 0 }}
                  transition={{ type: 'spring', damping: 15, delay: 600 + index * 100 }}
                >
                  <TouchableOpacity
                    style={[
                      styles.platformTab,
                      selectedPlatform === tab.id && styles.activePlatformTab,
                    ]}
                    onPress={() => handlePlatformSelect(tab.id)}
                  >
                    <LinearGradient
                      colors={
                        selectedPlatform === tab.id
                          ? tab.gradient
                          : ['rgba(42, 42, 42, 0.8)', 'rgba(58, 58, 58, 0.8)']
                      }
                      style={styles.platformTabGradient}
                    >
                      {tab.icon}
                      <Text
                        style={[
                          styles.platformTabText,
                          selectedPlatform === tab.id && styles.activePlatformTabText,
                        ]}
                      >
                        {tab.name}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </MotiView>
              ))}
            </ScrollView>
          </MotiView>

          {/* Quick Categories */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 700 }}
            style={styles.quickCategories}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            >
              {quickCategories.map((category, index) => (
                <MotiView
                  key={category.id}
                  from={{ opacity: 0, scale: 0.8, translateX: 30 }}
                  animate={{ opacity: 1, scale: 1, translateX: 0 }}
                  transition={{ type: 'spring', damping: 15, delay: 800 + index * 50 }}
                >
                  <TouchableOpacity
                    style={[
                      styles.categoryButton,
                      selectedCategory === category.id && styles.activeCategoryButton,
                    ]}
                    onPress={() => handleCategorySelect(category.id)}
                  >
                    <Text style={styles.categoryEmoji}>{category.icon}</Text>
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === category.id && styles.activeCategoryText,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                </MotiView>
              ))}
            </ScrollView>
          </MotiView>

          {/* Platform Stats */}
          {platformStats.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 900 }}
              style={styles.statsContainer}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statsList}
              >
                {platformStats.map((stat, index) => (
                  <MotiView
                    key={stat.platform}
                    from={{ opacity: 0, scale: 0.8, translateX: 30 }}
                    animate={{ opacity: 1, scale: 1, translateX: 0 }}
                    transition={{ type: 'spring', damping: 15, delay: 1000 + index * 100 }}
                  >
                    <BlurView style={styles.statCard} blurType="dark" blurAmount={10}>
                      <View style={styles.statHeader}>
                        <Text style={styles.statPlatform}>{stat.platform.toUpperCase()}</Text>
                        <View
                          style={[
                            styles.statusIndicator,
                            { backgroundColor: stat.isOnline ? '#22C55E' : '#EF4444' },
                          ]}
                        />
                      </View>
                      <Text style={styles.statValue}>{stat.totalStreams.toLocaleString()}</Text>
                      <Text style={styles.statLabel}>Live Streams</Text>
                      <Text style={styles.statCategory}>{stat.topCategory}</Text>
                    </BlurView>
                  </MotiView>
                ))}
              </ScrollView>
            </MotiView>
          )}
        </LinearGradient>
      </BlurView>
    </MotiView>
  );

  const renderStreamCard = ({ item, index }: { item: UnifiedStream; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 30, scale: 0.9 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 15, stiffness: 100, delay: index * 100 }}
    >
      <MultiPlatformStreamCard
        stream={item}
        onPress={handleStreamPress}
        onAdd={handleAddStream}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={isFavorite(item.streamerName)}
        isActive={isStreamActive(item.id)}
        showAddButton={!isStreamActive(item.id)}
        showSocialFeatures
        userId={user?.id}
      />
    </MotiView>
  );

  const renderEmptyState = () => (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      style={styles.emptyState}
    >
      <BlurView style={styles.emptyBlur} blurType="dark" blurAmount={10}>
        <Globe size={64} color="#666" />
        <MotiText
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200 }}
          style={styles.emptyTitle}
        >
          No Streams Found
        </MotiText>
        <MotiText
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 400 }}
          style={styles.emptySubtitle}
        >
          Try adjusting your search or filters
        </MotiText>
      </BlurView>
    </MotiView>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      {[...Array(6)].map((_, index) => (
        <MotiView
          key={index}
          from={{ opacity: 0.3 }}
          animate={{ opacity: 0.8 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
            repeatReverse: true,
            delay: index * 200,
          }}
          style={styles.loadingSkeleton}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient colors={['#0a0a0a', '#1a1a1a', '#0f0f0f']} style={styles.background} />

      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}

        {loading ? (
          renderLoadingState()
        ) : streams.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            ref={flatListRef}
            data={streams}
            renderItem={renderStreamCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#8B5CF6"
                colors={['#8B5CF6']}
              />
            }
            onScroll={event => {
              scrollY.value = event.nativeEvent.contentOffset.y;
            }}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

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
  headerContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: Platform.OS === 'ios' ? 10 : 20,
  },
  headerBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  titleTextContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#666',
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonBlur: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  platformTabs: {
    marginBottom: 16,
  },
  tabsList: {
    paddingRight: 20,
  },
  platformTab: {
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activePlatformTab: {
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  platformTabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  platformTabText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  activePlatformTabText: {
    color: '#fff',
  },
  quickCategories: {
    marginBottom: 16,
  },
  categoriesList: {
    paddingRight: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    gap: 6,
  },
  activeCategoryButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  activeCategoryText: {
    color: '#fff',
  },
  statsContainer: {
    marginTop: 8,
  },
  statsList: {
    paddingRight: 20,
  },
  statCard: {
    width: 120,
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statPlatform: {
    color: '#8B5CF6',
    fontSize: 10,
    fontWeight: '700',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    color: '#666',
    fontSize: 10,
    marginTop: 2,
  },
  statCategory: {
    color: '#8B5CF6',
    fontSize: 10,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyBlur: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  loadingSkeleton: {
    height: 320,
    backgroundColor: '#333',
    borderRadius: 16,
    marginBottom: 16,
  },
});
