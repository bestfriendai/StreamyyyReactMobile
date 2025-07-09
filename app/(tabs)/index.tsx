import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Text, 
  TouchableOpacity, 
  RefreshControl,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, TrendingUp, Filter, Sparkles, Play } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { StreamCard } from '@/components/StreamCard';
import { SearchBar } from '@/components/SearchBar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Toast } from '@/components/Toast';
import { useTwitchStreams, useTopGames } from '@/hooks/useTwitchStreams';
import { useStreamManager } from '@/hooks/useStreamManager';

const { width: screenWidth } = Dimensions.get('window');
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function DiscoverScreen() {
  const { 
    streams, 
    loading, 
    error, 
    refreshing, 
    hasMore, 
    refresh, 
    loadMore, 
    searchStreams, 
    filterByGame,
    clearSearch 
  } = useTwitchStreams();
  
  const { games } = useTopGames();
  const { addStream, toggleFavorite, isFavorite, isStreamActive } = useStreamManager();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  // Animation values
  const headerScale = useSharedValue(1);
  const sparkleRotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    // Continuous sparkle rotation
    sparkleRotation.value = withRepeat(
      withTiming(360, { duration: 3000 }),
      -1,
      false
    );
    
    // Subtle pulse animation
    pulseScale.value = withRepeat(
      withTiming(1.05, { duration: 2000 }),
      -1,
      true
    );
  }, []);

  const handleSearch = async (query: string) => {
    await searchStreams(query);
    setSelectedCategory('all');
  };

  const handleClearSearch = () => {
    clearSearch();
    setSelectedCategory('all');
  };

  const handleCategoryFilter = async (gameId: string) => {
    setSelectedCategory(gameId);
    if (gameId === 'all') {
      clearSearch();
    } else {
      await filterByGame(gameId);
    }
  };

  const handleAddStream = async (stream: any) => {
    try {
      const result = await addStream(stream);
      if (result.success) {
        setToastMessage(`${stream.user_name} added to multi-view!`);
        setToastType('success');
        setToastVisible(true);
      } else {
        setToastMessage(result.message || 'Failed to add stream');
        setToastType('error');
        setToastVisible(true);
      }
    } catch (error) {
      setToastMessage('Failed to add stream');
      setToastType('error');
      setToastVisible(true);
    }
  };

  const handleToastHide = () => {
    setToastVisible(false);
  };

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  const animatedSparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotation.value}deg` }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <LinearGradient
        colors={[
          'rgba(139, 92, 246, 0.15)',
          'rgba(124, 58, 237, 0.1)',
          'rgba(168, 85, 247, 0.05)',
          'transparent'
        ]}
        style={styles.headerGradient}
      >
        <Animated.View style={[styles.titleContainer, animatedHeaderStyle]}>
          <View style={styles.logoContainer}>
            <Animated.View style={[styles.sparkleIcon, animatedSparkleStyle]}>
              <Sparkles size={24} color="#8B5CF6" />
            </Animated.View>
            <LinearGradient
              colors={['#8B5CF6', '#A855F7', '#C084FC']}
              style={styles.logoGradient}
            >
              <Play size={20} color="#fff" />
            </LinearGradient>
          </View>
          <View style={styles.titleTextContainer}>
            <Text style={styles.title}>Streamyyy</Text>
            <View style={styles.titleUnderline} />
          </View>
        </Animated.View>
        <Text style={styles.subtitle}>
          Discover amazing live streams from around the world
        </Text>
        
        <View style={styles.statsContainer}>
          <Animated.View style={[styles.statBadge, animatedPulseStyle]}>
            <Text style={styles.statNumber}>{streams.length}</Text>
            <Text style={styles.statLabel}>Live Now</Text>
          </Animated.View>
          <View style={styles.statBadge}>
            <Text style={styles.statNumber}>{games.length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>
      </LinearGradient>
      
      <SearchBar 
        onSearch={handleSearch} 
        onClear={handleClearSearch}
        loading={loading}
      />
      
      <View style={styles.categoryFilter}>
        <Text style={styles.categoryTitle}>Popular Categories</Text>
        <View style={styles.categoryButtons}>
          <AnimatedTouchableOpacity
            style={[
              styles.categoryButton, 
              selectedCategory === 'all' && styles.activeCategoryButton
            ]}
            onPress={() => handleCategoryFilter('all')}
          >
            <LinearGradient
              colors={selectedCategory === 'all' 
                ? ['#8B5CF6', '#7C3AED'] 
                : ['rgba(42, 42, 42, 0.8)', 'rgba(58, 58, 58, 0.8)']
              }
              style={styles.categoryGradient}
            >
              <TrendingUp size={16} color={selectedCategory === 'all' ? '#fff' : '#666'} />
              <Text style={[
                styles.categoryText,
                selectedCategory === 'all' && styles.activeCategoryText
              ]}>
                Trending
              </Text>
            </LinearGradient>
          </AnimatedTouchableOpacity>
          
          {games.slice(0, 3).map((game) => (
            <AnimatedTouchableOpacity
              key={game.id}
              style={[
                styles.categoryButton,
                selectedCategory === game.id && styles.activeCategoryButton
              ]}
              onPress={() => handleCategoryFilter(game.id)}
            >
              <LinearGradient
                colors={selectedCategory === game.id 
                  ? ['#8B5CF6', '#7C3AED'] 
                  : ['rgba(42, 42, 42, 0.8)', 'rgba(58, 58, 58, 0.8)']
                }
                style={styles.categoryGradient}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === game.id && styles.activeCategoryText
                ]}>
                  {game.name.length > 10 ? `${game.name.substring(0, 10)}...` : game.name}
                </Text>
              </LinearGradient>
            </AnimatedTouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.1)', 'transparent']}
        style={styles.emptyGradient}
      >
        <Animated.View style={animatedSparkleStyle}>
          <Zap size={64} color="#666" />
        </Animated.View>
        <Text style={styles.emptyTitle}>
          {error ? 'Something went wrong' : 'No streams found'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {error ? error : 'Try adjusting your search or check back later'}
        </Text>
        {error && (
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.retryGradient}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );

  const renderFooter = () => {
    if (!loading || streams.length === 0) return null;
    return (
      <View style={styles.loadingFooter}>
        <LoadingSpinner size={32} />
        <Text style={styles.loadingFooterText}>Loading more streams...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f0f0f', '#1a1a1a', '#0f0f0f']}
        style={styles.background}
      />
      
      {loading && streams.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Animated.View style={animatedPulseStyle}>
            <LoadingSpinner size={48} />
          </Animated.View>
          <Text style={styles.loadingText}>Discovering amazing streams...</Text>
        </View>
      ) : (
        <FlatList
          data={streams}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StreamCard
              stream={item}
              onAdd={handleAddStream}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite(item.user_id)}
              isActive={isStreamActive(item.id)}
              showAddButton={!isStreamActive(item.id)}
            />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={!loading ? renderEmptyState : null}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor="#8B5CF6"
              colors={['#8B5CF6']}
              progressBackgroundColor="#1a1a1a"
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={streams.length === 0 ? styles.emptyContainer : styles.contentContainer}
        />
      )}
      
      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onHide={handleToastHide}
      />
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
  contentContainer: {
    paddingBottom: 120,
  },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 2,
  },
  logoGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
      },
    }),
  },
  titleTextContainer: {
    alignItems: 'flex-start',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    letterSpacing: -1,
  },
  titleUnderline: {
    width: 40,
    height: 3,
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
    marginTop: 4,
  },
  subtitle: {
    color: '#999',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 60,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginLeft: 60,
    gap: 16,
  },
  statBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
  },
  statNumber: {
    color: '#8B5CF6',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    color: '#999',
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    marginTop: 2,
  },
  categoryFilter: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  categoryTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  categoryButton: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeCategoryButton: {
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
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  activeCategoryText: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  loadingText: {
    color: '#999',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  loadingFooter: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 12,
  },
  loadingFooterText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyGradient: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Inter-SemiBold',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  retryGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});