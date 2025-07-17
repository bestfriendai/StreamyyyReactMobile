import { LinearGradient } from 'expo-linear-gradient';
import { Search, TrendingUp, Filter, Grid, Sparkles, Zap, Users, Star } from 'lucide-react-native';
import { MotiView, MotiText } from 'moti';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Platform,
  StatusBar,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStreamManager } from '@/hooks/useStreamManager';
import { useTwitchStreams } from '@/hooks/useTwitchStreams';
import { twitchApi } from '@/services/twitchApi';
import { BlurViewFallback as BlurView } from './BlurViewFallback';
import { EnhancedStreamCard } from './EnhancedStreamCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CategoryTab {
  id: string;
  name: string;
  icon: React.ReactNode;
  gradient: string[];
}

const categories: CategoryTab[] = [
  {
    id: 'all',
    name: 'Trending',
    icon: <TrendingUp size={16} color="#fff" />,
    gradient: ['#8B5CF6', '#7C3AED'],
  },
  {
    id: '509658',
    name: 'Just Chatting',
    icon: <Users size={16} color="#fff" />,
    gradient: ['#10B981', '#059669'],
  },
  {
    id: '21779',
    name: 'League of Legends',
    icon: <Zap size={16} color="#fff" />,
    gradient: ['#F59E0B', '#D97706'],
  },
  {
    id: '32982',
    name: 'Grand Theft Auto V',
    icon: <Star size={16} color="#fff" />,
    gradient: ['#EF4444', '#DC2626'],
  },
  {
    id: '516575',
    name: 'VALORANT',
    icon: <Filter size={16} color="#fff" />,
    gradient: ['#6366F1', '#4F46E5'],
  },
];

export const EnhancedDiscoverScreen: React.FC = () => {
  const {
    streams,
    loading,
    error,
    hasMore,
    loadMore,
    searchStreams,
    filterByGame,
    clearSearch,
    refresh,
  } = useTwitchStreams();

  const { addStream, toggleFavorite, isFavorite, isStreamActive } = useStreamManager();

  const [showSearchBar, setShowSearchBar] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [totalStreamers, setTotalStreamers] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Animation values
  const headerScale = useSharedValue(1);
  const searchBarOpacity = useSharedValue(0);
  const scrollY = useSharedValue(0);

  const loadTotalStreamers = async () => {
    try {
      const streamers = await twitchApi.getTotalLiveStreamers();
      setTotalStreamers(streamers);
    } catch (error) {
      console.error('Failed to load total streamers:', error);
    }
  };

  useEffect(() => {
    refresh();
    loadTotalStreamers();
  }, []);

  const handleCategoryPress = async (categoryId: string) => {
    headerScale.value = withSpring(0.95, { damping: 15 }, () => {
      headerScale.value = withSpring(1);
    });

    setSelectedCategory(categoryId);

    if (categoryId === 'all') {
      clearSearch();
    } else {
      await filterByGame(categoryId);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refresh(), loadTotalStreamers()]);
    setIsRefreshing(false);
  };

  const toggleSearchBar = () => {
    const newState = !showSearchBar;
    setShowSearchBar(newState);
    searchBarOpacity.value = withTiming(newState ? 1 : 0, { duration: 300 });

    if (!newState) {
      clearSearch();
    }
  };

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
    opacity: interpolate(scrollY.value, [0, 100], [1, 0.8]),
  }));

  const animatedSearchStyle = useAnimatedStyle(() => ({
    opacity: searchBarOpacity.value,
    transform: [
      {
        translateY: interpolate(searchBarOpacity.value, [0, 1], [-20, 0]),
      },
    ],
  }));

  const renderHeader = () => (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 200,
      }}
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
              transition={{
                type: 'spring',
                damping: 15,
                stiffness: 200,
                delay: 200,
              }}
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
                Discover
              </MotiText>
              <MotiText
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 400 }}
                style={styles.subtitle}
              >
                {totalStreamers
                  ? `${totalStreamers.toLocaleString()} people are streaming on Twitch right now`
                  : `${streams.length} live streams`}
              </MotiText>
            </View>

            <TouchableOpacity style={styles.searchButton} onPress={toggleSearchBar}>
              <BlurView style={styles.searchButtonBlur} blurType="dark" blurAmount={10}>
                <Search size={20} color="#8B5CF6" />
              </BlurView>
            </TouchableOpacity>
          </Animated.View>

          {/* Search Bar */}
          <Animated.View style={[styles.searchContainer, animatedSearchStyle]}>
            {/* Implement search input here */}
          </Animated.View>

          {/* Categories */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 500 }}
            style={styles.categoriesContainer}
          >
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.categoriesList}
              renderItem={({ item, index }) => (
                <MotiView
                  from={{
                    opacity: 0,
                    scale: 0.8,
                    translateX: 50,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    translateX: 0,
                  }}
                  transition={{
                    type: 'spring',
                    damping: 15,
                    delay: 600 + index * 100,
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.categoryTab,
                      selectedCategory === item.id && styles.activeCategoryTab,
                    ]}
                    onPress={() => handleCategoryPress(item.id)}
                  >
                    <LinearGradient
                      colors={
                        selectedCategory === item.id
                          ? item.gradient
                          : ['rgba(42, 42, 42, 0.8)', 'rgba(58, 58, 58, 0.8)']
                      }
                      style={styles.categoryGradient}
                    >
                      {item.icon}
                      <MotiText
                        style={[
                          styles.categoryText,
                          selectedCategory === item.id && styles.activeCategoryText,
                        ]}
                      >
                        {item.name}
                      </MotiText>
                    </LinearGradient>
                  </TouchableOpacity>
                </MotiView>
              )}
            />
          </MotiView>
        </LinearGradient>
      </BlurView>
    </MotiView>
  );

  const renderStreamCard = ({ item, index }: { item: any; index: number }) => (
    <MotiView
      from={{
        opacity: 0,
        translateY: 30,
        scale: 0.9,
      }}
      animate={{
        opacity: 1,
        translateY: 0,
        scale: 1,
      }}
      transition={{
        type: 'spring',
        damping: 15,
        stiffness: 100,
        delay: index * 100,
      }}
    >
      <EnhancedStreamCard
        stream={item}
        onAdd={addStream}
        onToggleFavorite={toggleFavorite}
        isFavorite={isFavorite(item.user_id)}
        isActive={isStreamActive(item.id)}
        showAddButton={!isStreamActive(item.id)}
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
        <Grid size={64} color="#666" />
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
          Try adjusting your search or category filter
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

      {/* Animated background */}
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
                refreshing={isRefreshing}
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
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#666',
    fontSize: 14,
    marginTop: 2,
  },
  searchButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchButtonBlur: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    marginBottom: 16,
  },
  categoriesContainer: {
    marginTop: 4,
  },
  categoriesList: {
    paddingRight: 20,
  },
  categoryTab: {
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeCategoryTab: {
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  categoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  categoryText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  activeCategoryText: {
    color: '#fff',
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
    height: 280,
    backgroundColor: '#333',
    borderRadius: 16,
    marginBottom: 16,
  },
});
