import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Grid3X3,
  Layers,
  Monitor,
  Focus,
  Zap,
  Eye,
  Sparkles,
  TrendingUp,
  Activity,
  Volume2,
  Wifi,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  interpolateColor,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  Layout,
  Easing,
} from 'react-native-reanimated';
import { BlurViewFallback as BlurView } from './BlurViewFallback';
import { ModernTheme } from '@/theme/modernTheme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// Floating Action Button with micro-interactions
export const FloatingActionButton: React.FC<{
  onPress: () => void;
  icon: React.ComponentType<any>;
  size?: number;
  color?: string;
  position?: { bottom?: number; right?: number; top?: number; left?: number };
}> = ({ 
  onPress, 
  icon: Icon, 
  size = 56, 
  color = ModernTheme.colors.accent[500],
  position = { bottom: 20, right: 20 }
}) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const glowIntensity = useSharedValue(0);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.9, { damping: 15 }),
      withSpring(1.1, { damping: 12 }),
      withSpring(1, { damping: 20 })
    );
    
    rotation.value = withSpring(360, { damping: 15 }, () => {
      rotation.value = 0;
    });
    
    glowIntensity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 800 })
    );
    
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
    shadowOpacity: interpolate(glowIntensity.value, [0, 1], [0.3, 0.8]),
    shadowRadius: interpolate(glowIntensity.value, [0, 1], [8, 20]),
  }));

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.fab,
        { width: size, height: size, borderRadius: size / 2 },
        position,
        animatedStyle,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[color, ModernTheme.colors.accent[600]]}
        style={[styles.fabGradient, { borderRadius: size / 2 }]}
      >
        <Icon size={size * 0.4} color="#fff" />
      </LinearGradient>
    </AnimatedTouchableOpacity>
  );
};

// Animated Grid Statistics Display
export const GridStats: React.FC<{
  streamCount: number;
  activeStreamName?: string;
  totalViewers: number;
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor';
  isVisible: boolean;
}> = ({ 
  streamCount, 
  activeStreamName, 
  totalViewers, 
  networkQuality,
  isVisible 
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);
  const viewerCountScale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(isVisible ? 1 : 0, { duration: 300 });
    translateY.value = withSpring(isVisible ? 0 : -20);
  }, [isVisible]);

  useEffect(() => {
    // Animate viewer count changes
    viewerCountScale.value = withSequence(
      withSpring(1.2, { damping: 15 }),
      withSpring(1, { damping: 20 })
    );
  }, [totalViewers]);

  const getQualityColor = () => {
    switch (networkQuality) {
      case 'excellent': return ModernTheme.colors.success[400];
      case 'good': return ModernTheme.colors.success[500];
      case 'fair': return ModernTheme.colors.status.loading;
      case 'poor': return ModernTheme.colors.error[400];
      default: return ModernTheme.colors.text.secondary;
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const viewerCountStyle = useAnimatedStyle(() => ({
    transform: [{ scale: viewerCountScale.value }],
  }));

  return (
    <Animated.View style={[styles.gridStats, animatedStyle]}>
      <BlurView style={styles.statsBlur} blurType="dark" blurAmount={20}>
        <View style={styles.statsContent}>
          {/* Stream Count */}
          <View style={styles.statItem}>
            <Grid3X3 size={16} color={ModernTheme.colors.accent[400]} />
            <Text style={styles.statValue}>{streamCount}</Text>
            <Text style={styles.statLabel}>streams</Text>
          </View>

          {/* Active Stream */}
          {activeStreamName && (
            <View style={styles.statItem}>
              <Volume2 size={16} color={ModernTheme.colors.accent[400]} />
              <Text style={styles.statValue} numberOfLines={1}>
                {activeStreamName}
              </Text>
              <Text style={styles.statLabel}>active</Text>
            </View>
          )}

          {/* Total Viewers */}
          <Animated.View style={[styles.statItem, viewerCountStyle]}>
            <Eye size={16} color={ModernTheme.colors.text.secondary} />
            <Text style={styles.statValue}>
              {totalViewers.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>viewers</Text>
          </Animated.View>

          {/* Network Quality */}
          <View style={styles.statItem}>
            <Wifi size={16} color={getQualityColor()} />
            <Text style={[styles.statValue, { color: getQualityColor() }]}>
              {networkQuality}
            </Text>
            <Text style={styles.statLabel}>quality</Text>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
};

// Contextual Toolbar with Smart Suggestions
export const SmartToolbar: React.FC<{
  suggestions: Array<{
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    action: () => void;
    priority: 'high' | 'medium' | 'low';
  }>;
  isVisible: boolean;
}> = ({ suggestions, isVisible }) => {
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(0, { damping: 20 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(100, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return ModernTheme.colors.error[400];
      case 'medium': return ModernTheme.colors.status.loading;
      case 'low': return ModernTheme.colors.success[400];
      default: return ModernTheme.colors.text.secondary;
    }
  };

  return (
    <Animated.View style={[styles.smartToolbar, animatedStyle]}>
      <BlurView style={styles.toolbarBlur} blurType="dark" blurAmount={15}>
        <Text style={styles.toolbarTitle}>Smart Suggestions</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarContent}
        >
          {suggestions.map((suggestion, index) => (
            <Animated.View
              key={suggestion.id}
              entering={SlideInUp.delay(index * 100)}
              exiting={SlideOutDown}
              layout={Layout.springify()}
            >
              <TouchableOpacity
                style={[
                  styles.suggestionItem,
                  { borderLeftColor: getPriorityColor(suggestion.priority) }
                ]}
                onPress={suggestion.action}
              >
                <View style={styles.suggestionIcon}>
                  <suggestion.icon 
                    size={20} 
                    color={ModernTheme.colors.accent[400]} 
                  />
                </View>
                <View style={styles.suggestionText}>
                  <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                  <Text style={styles.suggestionDescription}>
                    {suggestion.description}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </BlurView>
    </Animated.View>
  );
};

// Performance Indicator with Real-time Updates
export const PerformanceIndicator: React.FC<{
  fps: number;
  memoryUsage: number;
  networkLatency: number;
  isVisible: boolean;
}> = ({ fps, memoryUsage, networkLatency, isVisible }) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const fpsColorTransition = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      scale.value = withSpring(1, { damping: 15 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = withSpring(0.8, { damping: 15 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isVisible]);

  useEffect(() => {
    // Animate FPS color based on performance
    fpsColorTransition.value = withTiming(fps < 30 ? 1 : 0, { duration: 500 });
  }, [fps]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const fpsColorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      fpsColorTransition.value,
      [0, 1],
      [ModernTheme.colors.success[400], ModernTheme.colors.error[400]]
    ),
  }));

  return (
    <Animated.View style={[styles.performanceIndicator, animatedStyle]}>
      <BlurView style={styles.performanceBlur} blurType="dark" blurAmount={10}>
        <View style={styles.performanceContent}>
          <View style={styles.performanceItem}>
            <Activity size={12} color={ModernTheme.colors.text.secondary} />
            <Animated.Text style={[styles.performanceValue, fpsColorStyle]}>
              {fps}
            </Animated.Text>
            <Text style={styles.performanceLabel}>FPS</Text>
          </View>
          
          <View style={styles.performanceDivider} />
          
          <View style={styles.performanceItem}>
            <TrendingUp size={12} color={ModernTheme.colors.text.secondary} />
            <Text style={[
              styles.performanceValue,
              { color: memoryUsage > 80 ? ModernTheme.colors.error[400] : ModernTheme.colors.text.primary }
            ]}>
              {memoryUsage}%
            </Text>
            <Text style={styles.performanceLabel}>MEM</Text>
          </View>
          
          <View style={styles.performanceDivider} />
          
          <View style={styles.performanceItem}>
            <Wifi size={12} color={ModernTheme.colors.text.secondary} />
            <Text style={[
              styles.performanceValue,
              { color: networkLatency > 100 ? ModernTheme.colors.status.loading : ModernTheme.colors.success[400] }
            ]}>
              {networkLatency}
            </Text>
            <Text style={styles.performanceLabel}>MS</Text>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
};

// Stream Quality Badge with Animation
export const QualityBadge: React.FC<{
  quality: 'HD' | 'SD' | 'AUTO' | '4K';
  isLive: boolean;
  size?: 'small' | 'medium' | 'large';
}> = ({ quality, isLive, size = 'medium' }) => {
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (isLive) {
      pulse.value = withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) })
      );
    }
  }, [isLive]);

  useEffect(() => {
    glow.value = withTiming(isLive ? 1 : 0, { duration: 300 });
  }, [isLive]);

  const getQualityColor = () => {
    switch (quality) {
      case '4K': return ModernTheme.colors.accent[400];
      case 'HD': return ModernTheme.colors.success[400];
      case 'SD': return ModernTheme.colors.status.loading;
      case 'AUTO': return ModernTheme.colors.text.secondary;
      default: return ModernTheme.colors.text.secondary;
    }
  };

  const getSizeProps = () => {
    switch (size) {
      case 'small': return { fontSize: 8, padding: 3 };
      case 'large': return { fontSize: 12, padding: 6 };
      default: return { fontSize: 10, padding: 4 };
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    shadowOpacity: interpolate(glow.value, [0, 1], [0, 0.6]),
    shadowRadius: interpolate(glow.value, [0, 1], [0, 8]),
  }));

  const sizeProps = getSizeProps();

  return (
    <Animated.View style={[styles.qualityBadge, animatedStyle]}>
      <LinearGradient
        colors={[
          `${getQualityColor()}20`,
          `${getQualityColor()}40`,
        ]}
        style={[styles.qualityGradient, { padding: sizeProps.padding }]}
      >
        <Text style={[
          styles.qualityText,
          { fontSize: sizeProps.fontSize, color: getQualityColor() }
        ]}>
          {quality}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
};

// Viewer Count with Growth Animation
export const ViewerCounter: React.FC<{
  count: number;
  trend?: 'up' | 'down' | 'stable';
  showTrend?: boolean;
}> = ({ count, trend = 'stable', showTrend = true }) => {
  const scale = useSharedValue(1);
  const trendOpacity = useSharedValue(0);
  const [displayCount, setDisplayCount] = useState(count);

  useEffect(() => {
    // Animate count changes
    scale.value = withSequence(
      withSpring(1.2, { damping: 15 }),
      withSpring(1, { damping: 20 })
    );
    
    // Animate to new count
    const duration = 1000;
    const startCount = displayCount;
    const diff = count - startCount;
    
    if (diff !== 0) {
      const startTime = Date.now();
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentCount = Math.floor(startCount + (diff * progress));
        setDisplayCount(currentCount);
        
        if (progress >= 1) {
          clearInterval(timer);
          setDisplayCount(count);
        }
      }, 16);
      
      return () => clearInterval(timer);
    }
  }, [count]);

  useEffect(() => {
    if (showTrend && trend !== 'stable') {
      trendOpacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(2000, withTiming(0, { duration: 300 }))
      );
    }
  }, [trend, showTrend]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const trendStyle = useAnimatedStyle(() => ({
    opacity: trendOpacity.value,
  }));

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return ModernTheme.colors.success[400];
      case 'down': return ModernTheme.colors.error[400];
      default: return ModernTheme.colors.text.secondary;
    }
  };

  return (
    <View style={styles.viewerCounter}>
      <Animated.Text style={[styles.viewerCount, animatedStyle]}>
        {displayCount.toLocaleString()}
      </Animated.Text>
      {showTrend && trend !== 'stable' && (
        <Animated.View style={[styles.trendIndicator, trendStyle]}>
          <TrendingUp 
            size={12} 
            color={getTrendColor()}
            style={{
              transform: [{ rotate: trend === 'down' ? '180deg' : '0deg' }]
            }}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    shadowColor: ModernTheme.colors.accent[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridStats: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  statsBlur: {
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: ModernTheme.spacing.sm,
    paddingHorizontal: ModernTheme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  statValue: {
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.primary,
  },
  statLabel: {
    fontSize: ModernTheme.typography.sizes.xs,
    color: ModernTheme.colors.text.tertiary,
  },
  smartToolbar: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
  },
  toolbarBlur: {
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  toolbarTitle: {
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.primary,
    paddingHorizontal: ModernTheme.spacing.md,
    paddingTop: ModernTheme.spacing.sm,
    paddingBottom: ModernTheme.spacing.xs,
  },
  toolbarContent: {
    paddingHorizontal: ModernTheme.spacing.md,
    paddingBottom: ModernTheme.spacing.sm,
    gap: ModernTheme.spacing.sm,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.sm,
    borderLeftWidth: 3,
    gap: ModernTheme.spacing.sm,
    minWidth: 180,
  },
  suggestionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
    color: ModernTheme.colors.text.primary,
    marginBottom: 2,
  },
  suggestionDescription: {
    fontSize: ModernTheme.typography.sizes.xs,
    color: ModernTheme.colors.text.secondary,
  },
  performanceIndicator: {
    position: 'absolute',
    top: 140,
    right: 16,
  },
  performanceBlur: {
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  performanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: ModernTheme.spacing.sm,
    gap: 6,
  },
  performanceItem: {
    alignItems: 'center',
    gap: 2,
  },
  performanceValue: {
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.bold,
    color: ModernTheme.colors.text.primary,
  },
  performanceLabel: {
    fontSize: 8,
    color: ModernTheme.colors.text.tertiary,
  },
  performanceDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  qualityBadge: {
    borderRadius: ModernTheme.borderRadius.sm,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  qualityGradient: {
    borderRadius: ModernTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  qualityText: {
    fontWeight: ModernTheme.typography.weights.bold,
    textAlign: 'center',
  },
  viewerCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewerCount: {
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.primary,
  },
  trendIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default {
  FloatingActionButton,
  GridStats,
  SmartToolbar,
  PerformanceIndicator,
  QualityBadge,
  ViewerCounter,
};