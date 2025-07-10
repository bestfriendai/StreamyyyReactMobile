import React, { useState } from 'react';
import { styled, Stack, XStack, YStack, Text, GetProps } from '@tamagui/core';
import { Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { 
  Play, 
  Heart, 
  Eye, 
  Clock, 
  Gamepad2, 
  Plus, 
  Check, 
  Star 
} from 'lucide-react-native';
import { ModernCard } from './ModernCard';
import { ModernButton } from './ModernButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  is_mature: boolean;
}

// Styled components using Tamagui
const StreamImageContainer = styled(Stack, {
  height: 180,
  position: 'relative',
  borderRadius: '$card',
  overflow: 'hidden',
  backgroundColor: '$gray800',
});

const StreamImage = styled(Image, {
  width: '100%',
  height: '100%',
});

const OverlayContainer = styled(Stack, {
  position: 'absolute',
  borderRadius: '$2',
  overflow: 'hidden',
});

const LiveIndicator = styled(OverlayContainer, {
  top: '$3',
  left: '$3',
});

const ViewerCount = styled(OverlayContainer, {
  top: '$3',
  right: '$3',
});

const Duration = styled(OverlayContainer, {
  bottom: '$3',
  left: '$3',
});

const ActiveIndicator = styled(OverlayContainer, {
  bottom: '$3',
  right: '$3',
  width: 32,
  height: 32,
  borderRadius: '$full',
  alignItems: 'center',
  justifyContent: 'center',
});

const StreamInfo = styled(YStack, {
  padding: '$4',
  gap: '$2',
});

const StreamTitle = styled(Text, {
  color: '$color',
  fontSize: '$4',
  fontWeight: '500',
  lineHeight: 20,
  numberOfLines: 2,
});

const StreamerName = styled(Text, {
  color: '$color',
  fontSize: '$5',
  fontWeight: '600',
  marginBottom: '$1',
});

const GameInfo = styled(XStack, {
  alignItems: 'center',
  gap: '$2',
  marginBottom: '$2',
});

const GameName = styled(Text, {
  color: '$gray500',
  fontSize: '$3',
  flex: 1,
});

const ActionsContainer = styled(XStack, {
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: '$2',
});

const StatContainer = styled(XStack, {
  alignItems: 'center',
  gap: '$1',
  flex: 1,
});

const StatText = styled(Text, {
  color: '#FFD700',
  fontSize: '$3',
  fontWeight: '600',
});

interface ModernStreamCardProps {
  stream: TwitchStream;
  onAdd: (stream: TwitchStream) => Promise<{ success: boolean; message: string }>;
  onToggleFavorite: (userId: string) => void;
  isFavorite: boolean;
  isActive: boolean;
  showAddButton?: boolean;
}

export const ModernStreamCard: React.FC<ModernStreamCardProps> = ({
  stream,
  onAdd,
  onToggleFavorite,
  isFavorite,
  isActive,
  showAddButton = true,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const formatViewerCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getTimeSinceStart = (startedAt: string): string => {
    const now = new Date();
    const start = new Date(startedAt);
    const diffMs = now.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  const handleAddPress = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await onAdd(stream);
    } catch (error) {
      console.error('Error adding stream:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavoritePress = () => {
    onToggleFavorite(stream.user_id);
  };

  return (
    <ModernCard
      variant={isActive ? 'active' : 'default'}
      interactive
      marginBottom="$4"
      gradient
      gradientColors={
        isActive 
          ? ['rgba(139, 92, 246, 0.15)', 'rgba(124, 58, 237, 0.1)', 'transparent']
          : ['rgba(26, 26, 26, 0.95)', 'rgba(15, 15, 15, 0.98)', 'rgba(10, 10, 10, 1)']
      }
    >
      {/* Stream Thumbnail */}
      <StreamImageContainer>
        <StreamImage
          source={{ 
            uri: stream.thumbnail_url
              .replace('{width}', '320')
              .replace('{height}', '180')
          }}
          onLoad={() => setIsImageLoaded(true)}
        />

        {/* Live Indicator */}
        <LiveIndicator>
          <BlurView blurType="dark" blurAmount={10} style={{ flex: 1 }}>
            <XStack 
              alignItems="center" 
              gap="$1" 
              paddingHorizontal="$2" 
              paddingVertical="$1"
            >
              <Stack 
                width={6} 
                height={6} 
                borderRadius="$full" 
                backgroundColor="$red500" 
              />
              <Text color="$color" fontSize="$1" fontWeight="600">
                LIVE
              </Text>
            </XStack>
          </BlurView>
        </LiveIndicator>

        {/* Viewer Count */}
        <ViewerCount>
          <BlurView blurType="dark" blurAmount={10} style={{ flex: 1 }}>
            <XStack 
              alignItems="center" 
              gap="$1" 
              paddingHorizontal="$2" 
              paddingVertical="$1"
            >
              <Eye size={12} color="#fff" />
              <Text color="$color" fontSize="$2" fontWeight="600">
                {formatViewerCount(stream.viewer_count)}
              </Text>
            </XStack>
          </BlurView>
        </ViewerCount>

        {/* Duration */}
        <Duration>
          <BlurView blurType="dark" blurAmount={10} style={{ flex: 1 }}>
            <XStack 
              alignItems="center" 
              gap="$1" 
              paddingHorizontal="$2" 
              paddingVertical="$1"
            >
              <Clock size={12} color="#8B5CF6" />
              <Text color="$purple500" fontSize="$2" fontWeight="600">
                {getTimeSinceStart(stream.started_at)}
              </Text>
            </XStack>
          </BlurView>
        </Duration>

        {/* Active Indicator */}
        {isActive && (
          <ActiveIndicator>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={{ 
                width: 32, 
                height: 32, 
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center' 
              }}
            >
              <Play size={16} color="#fff" fill="#fff" />
            </LinearGradient>
          </ActiveIndicator>
        )}
      </StreamImageContainer>

      {/* Stream Info */}
      <StreamInfo>
        <StreamerName numberOfLines={1}>
          {stream.user_name}
        </StreamerName>
        
        <GameInfo>
          <Gamepad2 size={14} color="#666" />
          <GameName numberOfLines={1}>
            {stream.game_name || 'Just Chatting'}
          </GameName>
        </GameInfo>

        <StreamTitle numberOfLines={2}>
          {stream.title}
        </StreamTitle>

        {/* Actions */}
        <ActionsContainer>
          {/* Favorite Button */}
          <TouchableOpacity onPress={handleFavoritePress}>
            <Stack padding="$2">
              <Heart
                size={20}
                color={isFavorite ? '#FF4444' : '#666'}
                fill={isFavorite ? '#FF4444' : 'transparent'}
              />
            </Stack>
          </TouchableOpacity>

          {/* Rating */}
          <StatContainer marginLeft="$2">
            <Star size={14} color="#FFD700" fill="#FFD700" />
            <StatText>
              {(Math.random() * 2 + 3).toFixed(1)}
            </StatText>
          </StatContainer>

          {/* Add Button */}
          {showAddButton && (
            <ModernButton
              variant={isActive ? 'success' : 'primary'}
              size="small"
              onPress={handleAddPress}
              disabled={isLoading || isActive}
              loading={isLoading}
              leftIcon={
                isActive ? 
                  <Check size={16} color="#fff" /> : 
                  <Plus size={16} color="#fff" />
              }
              gradient
            >
              {isActive ? 'Added' : isLoading ? 'Adding...' : 'Add'}
            </ModernButton>
          )}
        </ActionsContainer>
      </StreamInfo>
    </ModernCard>
  );
};