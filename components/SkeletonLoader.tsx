import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonLoaderProps {
  width?: number;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = SCREEN_WIDTH * 0.46,
  height = 200,
  borderRadius = 12,
  style,
}) => {
  return (
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      <LinearGradient
        colors={['#1F2937', '#374151', '#1F2937']}
        style={[styles.skeleton, { borderRadius }]}
      />
    </View>
  );
};

interface SkeletonStreamCardProps {
  width?: number;
}

export const SkeletonStreamCard: React.FC<SkeletonStreamCardProps> = ({
  width = SCREEN_WIDTH * 0.46,
}) => {
  const cardHeight = width * 0.75;
  const thumbnailHeight = cardHeight * 0.65;
  const contentHeight = cardHeight - thumbnailHeight;

  return (
    <View style={[styles.cardContainer, { width, height: cardHeight }]}>
      {/* Thumbnail Skeleton */}
      <SkeletonLoader
        width={width}
        height={thumbnailHeight}
        borderRadius={12}
        style={styles.thumbnailSkeleton}
      />

      {/* Content Skeleton */}
      <View style={[styles.contentSkeleton, { height: contentHeight }]}>
        {/* Game category */}
        <SkeletonLoader
          width={width * 0.4}
          height={12}
          borderRadius={6}
          style={styles.gameNameSkeleton}
        />

        {/* Title */}
        <SkeletonLoader
          width={width * 0.9}
          height={14}
          borderRadius={7}
          style={styles.titleSkeleton}
        />
        <SkeletonLoader
          width={width * 0.7}
          height={14}
          borderRadius={7}
          style={styles.titleSkeleton}
        />

        {/* Streamer info */}
        <View style={styles.streamerSkeleton}>
          <SkeletonLoader width={width * 0.5} height={10} borderRadius={5} />
          <SkeletonLoader width={24} height={10} borderRadius={5} />
        </View>
      </View>
    </View>
  );
};

interface SkeletonGridProps {
  numColumns?: number;
  numRows?: number;
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({ numColumns = 2, numRows = 3 }) => {
  const cardWidth = (SCREEN_WIDTH - 36) / numColumns; // Account for padding and gaps

  const renderSkeletonCards = () => {
    const cards = [];
    for (let i = 0; i < numColumns * numRows; i++) {
      cards.push(<SkeletonStreamCard key={i} width={cardWidth} />);
    }
    return cards;
  };

  return <View style={styles.gridContainer}>{renderSkeletonCards()}</View>;
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#1F2937',
  },
  skeleton: {
    width: '100%',
    height: '100%',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '50%',
  },
  shimmerGradient: {
    flex: 1,
  },
  cardContainer: {
    margin: 6,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnailSkeleton: {
    marginBottom: 0,
  },
  contentSkeleton: {
    padding: 10,
    justifyContent: 'space-between',
  },
  gameNameSkeleton: {
    marginBottom: 4,
  },
  titleSkeleton: {
    marginBottom: 4,
  },
  streamerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
});

export default SkeletonLoader;
