import React, { useState, useEffect } from 'react';
import { styled, Stack, XStack, YStack, Text, ScrollView } from '@tamagui/core';
import { FlatList, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, TrendingUp, Users, Zap, Star, Filter, Sparkles } from 'lucide-react-native';
import { ModernCard } from './ModernCard';
import { ModernButton } from './ModernButton';
import { ModernInput } from './ModernInput';
import { ModernStreamCard } from './ModernStreamCard';
import { TwitchStream, TwitchGame } from '@/services/twitchApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Styled components using Tamagui
const Container = styled(Stack, {
  flex: 1,
  backgroundColor: '$background',
});

const HeaderContainer = styled(Stack, {
  paddingHorizontal: '$4',
  paddingTop: '$6',
  paddingBottom: '$4',
});

const HeaderTitle = styled(Text, {
  fontSize: '$8',
  fontWeight: '700',
  color: '$color',
  marginBottom: '$2',
});

const HeaderSubtitle = styled(Text, {
  fontSize: '$4',
  color: '$gray500',
  marginBottom: '$4',
});

const CategoryContainer = styled(XStack, {
  gap: '$3',
  paddingHorizontal: '$4',
  marginBottom: '$4',
});

const CategoryButton = styled(Stack, {
  paddingHorizontal: '$4',
  paddingVertical: '$3',
  borderRadius: '$button',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)',
  backgroundColor: 'rgba(42, 42, 42, 0.8)',
  
  pressStyle: {
    scale: 0.95,
  },
  
  variants: {
    active: {
      true: {
        backgroundColor: '$purple500',
        borderColor: '$purple400',
      },
    },
  } as const,
});

const CategoryText = styled(Text, {
  fontSize: '$3',
  fontWeight: '600',
  color: '$gray400',
  
  variants: {
    active: {
      true: {
        color: '$color',
      },
    },
  } as const,
});

const StatsContainer = styled(XStack, {
  justifyContent: 'space-around',
  paddingHorizontal: '$4',
  paddingVertical: '$4',
  marginBottom: '$4',
});

const StatItem = styled(YStack, {
  alignItems: 'center',
  gap: '$2',
});

const StatNumber = styled(Text, {
  fontSize: '$6',
  fontWeight: '700',
  color: '$color',
});

const StatLabel = styled(Text, {
  fontSize: '$3',
  color: '$gray500',
  fontWeight: '500',
});

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
];

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

export const ModernDiscoverScreen: React.FC<ModernDiscoverScreenProps> = ({
  streams,
  games,
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalStreamers, setTotalStreamers] = useState<number | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh?.();
    setIsRefreshing(false);
  };

  const filteredStreams = streams.filter(stream => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        stream.user_name.toLowerCase().includes(query) ||
        stream.game_name.toLowerCase().includes(query) ||
        stream.title.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const renderStreamItem = ({ item, index }: { item: TwitchStream; index: number }) => (
    <ModernStreamCard
      stream={item}
      onAdd={onAddStream}
      onToggleFavorite={onToggleFavorite}
      isFavorite={isFavorite(item.user_id)}
      isActive={isStreamActive(item.id)}
      showAddButton={!isStreamActive(item.id)}
    />
  );

  const renderHeader = () => (
    <YStack>
      {/* Header Section */}
      <HeaderContainer>
        <XStack alignItems="center" gap="$3" marginBottom="$4">
          <Stack 
            backgroundColor="$purple500" 
            padding="$3" 
            borderRadius="$4"
          >
            <Sparkles size={24} color="#fff" />
          </Stack>
          <YStack flex={1}>
            <HeaderTitle>Discover</HeaderTitle>
            <HeaderSubtitle>
              {totalStreamers 
                ? `${totalStreamers.toLocaleString()} people streaming live` 
                : `${streams.length} live streams`}
            </HeaderSubtitle>
          </YStack>
          <ModernButton
            variant="secondary"
            size="small"
            leftIcon={<Filter size={16} color="#8B5CF6" />}
          >
            Filter
          </ModernButton>
        </XStack>

        {/* Search Bar */}
        <ModernInput
          placeholder="Search streams, games, or streamers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color="rgba(255, 255, 255, 0.5)" />}
          variant="rounded"
          gradient
        />
      </HeaderContainer>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12, marginBottom: 16 }}
      >
        {categories.map((category) => (
          <CategoryButton
            key={category.id}
            active={selectedCategory === category.id}
            onPress={() => setSelectedCategory(category.id)}
            overflow="hidden"
          >
            {selectedCategory === category.id ? (
              <LinearGradient
                colors={category.gradient}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
            ) : null}
            <XStack alignItems="center" gap="$2">
              {category.icon}
              <CategoryText active={selectedCategory === category.id}>
                {category.name}
              </CategoryText>
            </XStack>
          </CategoryButton>
        ))}
      </ScrollView>

      {/* Stats Section */}
      <ModernCard
        variant="elevated"
        marginHorizontal="$4"
        marginBottom="$4"
        gradient
        gradientColors={['rgba(139, 92, 246, 0.1)', 'rgba(124, 58, 237, 0.05)', 'transparent']}
      >
        <StatsContainer>
          <StatItem>
            <StatNumber>{streams.length}</StatNumber>
            <StatLabel>Live Streams</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>{games.length}</StatNumber>
            <StatLabel>Categories</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>
              {streams.reduce((total, stream) => total + stream.viewer_count, 0).toLocaleString()}
            </StatNumber>
            <StatLabel>Total Viewers</StatLabel>
          </StatItem>
        </StatsContainer>
      </ModernCard>
    </YStack>
  );

  return (
    <Container>
      <LinearGradient
        colors={['#0a0a0a', '#1a1a1a', '#0f0f0f']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          data={filteredStreams}
          renderItem={renderStreamItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#8B5CF6"
              colors={['#8B5CF6']}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{
            paddingBottom: 100,
          }}
        />
      </SafeAreaView>
    </Container>
  );
};