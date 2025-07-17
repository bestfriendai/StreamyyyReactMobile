import { LinearGradient } from 'expo-linear-gradient';
import {
  Loader2,
  Wifi,
  AlertCircle,
  RefreshCw,
  Zap,
  Play,
  Grid,
  Search,
  Download,
  Upload,
  Activity,
  Sparkles,
} from 'lucide-react-native';
import { MotiView, MotiText } from 'moti';
import React from 'react';
import { View, StyleSheet, Text, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  interpolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LoadingProps {
  type?: 'default' | 'streams' | 'search' | 'connection' | 'upload' | 'download';
  title?: string;
  subtitle?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

interface ErrorProps {
  type?: 'network' | 'server' | 'timeout' | 'generic';
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
  retryText?: string;
}

// Enhanced Loading Component
export const EnhancedLoadingState: React.FC<LoadingProps> = ({
  type = 'default',
  title,
  subtitle,
  size = 'medium',
  color = '#8B5CF6',
}) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Start rotation animation
  React.useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 2000 }), -1, false);

    scale.value = withRepeat(
      withSequence(withTiming(1.1, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      true
    );

    opacity.value = withRepeat(
      withSequence(withTiming(0.7, { duration: 1500 }), withTiming(1, { duration: 1500 })),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const getIcon = () => {
    const iconSize = size === 'small' ? 24 : size === 'medium' ? 32 : 48;

    switch (type) {
      case 'streams':
        return <Play size={iconSize} color={color} />;
      case 'search':
        return <Search size={iconSize} color={color} />;
      case 'connection':
        return <Wifi size={iconSize} color={color} />;
      case 'upload':
        return <Upload size={iconSize} color={color} />;
      case 'download':
        return <Download size={iconSize} color={color} />;
      default:
        return <Loader2 size={iconSize} color={color} />;
    }
  };

  const getDefaultMessages = () => {
    switch (type) {
      case 'streams':
        return {
          title: 'Loading Streams',
          subtitle: 'Discovering live content for you...',
        };
      case 'search':
        return {
          title: 'Searching',
          subtitle: 'Finding the best streams...',
        };
      case 'connection':
        return {
          title: 'Connecting',
          subtitle: 'Establishing secure connection...',
        };
      case 'upload':
        return {
          title: 'Uploading',
          subtitle: 'Syncing your data...',
        };
      case 'download':
        return {
          title: 'Downloading',
          subtitle: 'Fetching latest content...',
        };
      default:
        return {
          title: 'Loading',
          subtitle: 'Please wait a moment...',
        };
    }
  };

  const defaultMessages = getDefaultMessages();
  const finalTitle = title || defaultMessages.title;
  const finalSubtitle = subtitle || defaultMessages.subtitle;

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 300,
      }}
      style={[
        styles.loadingContainer,
        size === 'small' && styles.smallContainer,
        size === 'large' && styles.largeContainer,
      ]}
    >
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.1)', 'rgba(124, 58, 237, 0.05)', 'transparent']}
        style={styles.loadingGradient}
      >
        {/* Animated background particles */}
        <View style={styles.particlesContainer}>
          {[...Array(6)].map((_, index) => (
            <MotiView
              key={index}
              from={{
                opacity: 0.3,
                scale: 0.5,
                translateX: Math.random() * 100 - 50,
                translateY: Math.random() * 100 - 50,
              }}
              animate={{
                opacity: 0.8,
                scale: 1,
                translateX: Math.random() * 200 - 100,
                translateY: Math.random() * 200 - 100,
              }}
              transition={{
                type: 'timing',
                duration: 3000 + Math.random() * 2000,
                loop: true,
                repeatReverse: true,
                delay: index * 200,
              }}
              style={[
                styles.particle,
                {
                  left: Math.random() * SCREEN_WIDTH,
                  top: Math.random() * 200,
                },
              ]}
            >
              <Sparkles size={8} color={color} opacity={0.4} />
            </MotiView>
          ))}
        </View>

        {/* Main loading icon */}
        <Animated.View style={[styles.iconContainer, animatedStyle]}>
          <LinearGradient colors={[color, `${color}80`, color]} style={styles.iconGradient}>
            {getIcon()}
          </LinearGradient>
        </Animated.View>

        {/* Loading text */}
        <MotiText
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 300 }}
          style={[
            styles.loadingTitle,
            size === 'small' && styles.smallTitle,
            size === 'large' && styles.largeTitle,
          ]}
        >
          {finalTitle}
        </MotiText>

        <MotiText
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 500 }}
          style={[
            styles.loadingSubtitle,
            size === 'small' && styles.smallSubtitle,
            size === 'large' && styles.largeSubtitle,
          ]}
        >
          {finalSubtitle}
        </MotiText>

        {/* Pulse indicator */}
        <MotiView
          from={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{
            type: 'timing',
            duration: 2000,
            loop: true,
          }}
          style={[styles.pulseIndicator, { borderColor: color }]}
        />
      </LinearGradient>
    </MotiView>
  );
};

// Enhanced Error Component
export const EnhancedErrorState: React.FC<ErrorProps> = ({
  type = 'generic',
  title,
  subtitle,
  onRetry,
  retryText = 'Try Again',
}) => {
  const shake = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  React.useEffect(() => {
    shake.value = withSequence(
      withTiming(-5, { duration: 100 }),
      withTiming(5, { duration: 100 }),
      withTiming(-5, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleRetry = () => {
    buttonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    onRetry?.();
  };

  const getIcon = () => {
    switch (type) {
      case 'network':
        return <Wifi size={48} color="#EF4444" />;
      case 'server':
        return <AlertCircle size={48} color="#F59E0B" />;
      case 'timeout':
        return <Activity size={48} color="#F59E0B" />;
      default:
        return <AlertCircle size={48} color="#EF4444" />;
    }
  };

  const getDefaultMessages = () => {
    switch (type) {
      case 'network':
        return {
          title: 'Connection Error',
          subtitle: 'Please check your internet connection and try again.',
        };
      case 'server':
        return {
          title: 'Server Error',
          subtitle: 'Our servers are experiencing issues. Please try again later.',
        };
      case 'timeout':
        return {
          title: 'Request Timeout',
          subtitle: 'The request took too long to complete. Please try again.',
        };
      default:
        return {
          title: 'Something went wrong',
          subtitle: 'An unexpected error occurred. Please try again.',
        };
    }
  };

  const defaultMessages = getDefaultMessages();
  const finalTitle = title || defaultMessages.title;
  const finalSubtitle = subtitle || defaultMessages.subtitle;

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 300,
      }}
      style={styles.errorContainer}
    >
      <LinearGradient
        colors={['rgba(239, 68, 68, 0.1)', 'rgba(220, 38, 38, 0.05)', 'transparent']}
        style={styles.errorGradient}
      >
        <Animated.View style={[styles.errorContent, animatedStyle]}>
          {/* Error icon */}
          <MotiView
            from={{ scale: 0.5, rotate: '-180deg' }}
            animate={{ scale: 1, rotate: '0deg' }}
            transition={{
              type: 'spring',
              damping: 15,
              stiffness: 200,
            }}
            style={styles.errorIconContainer}
          >
            {getIcon()}
          </MotiView>

          {/* Error text */}
          <MotiText
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200 }}
            style={styles.errorTitle}
          >
            {finalTitle}
          </MotiText>

          <MotiText
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 300 }}
            style={styles.errorSubtitle}
          >
            {finalSubtitle}
          </MotiText>

          {/* Retry button */}
          {onRetry && (
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 400 }}
            >
              <Animated.View style={[styles.retryButton, buttonAnimatedStyle]}>
                <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.retryGradient}>
                  <View style={styles.retryButtonContent}>
                    <RefreshCw size={16} color="#fff" />
                    <Text style={styles.retryButtonText}>{retryText}</Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            </MotiView>
          )}
        </Animated.View>
      </LinearGradient>
    </MotiView>
  );
};

// Skeleton Loader Component
export const EnhancedSkeletonLoader: React.FC<{
  type?: 'card' | 'list' | 'grid';
  count?: number;
}> = ({ type = 'card', count = 3 }) => {
  return (
    <View style={styles.skeletonContainer}>
      {[...Array(count)].map((_, index) => (
        <MotiView
          key={index}
          from={{ opacity: 0.3 }}
          animate={{ opacity: 0.7 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
            repeatReverse: true,
            delay: index * 200,
          }}
          style={[
            styles.skeletonItem,
            type === 'card' && styles.skeletonCard,
            type === 'list' && styles.skeletonList,
            type === 'grid' && styles.skeletonGrid,
          ]}
        >
          <LinearGradient
            colors={['rgba(51, 51, 51, 0.8)', 'rgba(68, 68, 68, 0.9)', 'rgba(51, 51, 51, 0.8)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </MotiView>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  smallContainer: {
    padding: 16,
  },
  largeContainer: {
    padding: 48,
  },
  loadingGradient: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    position: 'relative',
    minWidth: 200,
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
  },
  iconContainer: {
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  iconGradient: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  loadingTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  smallTitle: {
    fontSize: 14,
  },
  largeTitle: {
    fontSize: 22,
  },
  loadingSubtitle: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  smallSubtitle: {
    fontSize: 12,
  },
  largeSubtitle: {
    fontSize: 16,
  },
  pulseIndicator: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorGradient: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorContent: {
    alignItems: 'center',
  },
  errorIconContainer: {
    marginBottom: 16,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  retryGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skeletonContainer: {
    padding: 16,
  },
  skeletonItem: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  skeletonCard: {
    height: 200,
  },
  skeletonList: {
    height: 60,
  },
  skeletonGrid: {
    height: 120,
  },
});
