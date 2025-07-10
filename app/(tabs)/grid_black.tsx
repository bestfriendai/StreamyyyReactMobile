import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Grid2x2 as Grid, List, RotateCcw, Maximize, Settings, Zap, Eye } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { StreamViewer } from '@/components/StreamViewer';
import { useStreamManager } from '@/hooks/useStreamManager';
import { Theme } from '@/constants/Theme';

type LayoutType = 'grid' | 'stacked';
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function MultiViewScreen() {
  const { activeStreams, removeStream, clearAllStreams } = useStreamManager();
  const [layoutType, setLayoutType] = useState<LayoutType>('grid');
  const [gridColumns, setGridColumns] = useState(2);
  const [showControls, setShowControls] = useState(true);

  // Animation values
  const pulseScale = useSharedValue(1);
  const headerOpacity = useSharedValue(1);

  React.useEffect(() => {
    // Pulse animation for active streams count
    if (activeStreams.length > 0) {
      pulseScale.value = withRepeat(
        withTiming(1.1, { duration: 1500 }),
        -1,
        true
      );
    }
  }, [activeStreams.length]);

  React.useEffect(() => {
    headerOpacity.value = withTiming(showControls ? 1 : 0, { duration: 300 });
  }, [showControls]);

  const screenWidth = Dimensions.get('window').width;
  const streamWidth = layoutType === 'grid' 
    ? (screenWidth - 24 - (gridColumns - 1) * 8) / gridColumns 
    : screenWidth - 32;

  const streamHeight = layoutType === 'grid' 
    ? (streamWidth * 9) / 16
    : (streamWidth * 9) / 16;

  const renderGridView = () => {
    const rows = [];
    for (let i = 0; i < activeStreams.length; i += gridColumns) {
      const rowStreams = activeStreams.slice(i, i + gridColumns);
      rows.push(
        <View key={i} style={styles.gridRow}>
          {rowStreams.map((stream) => (
            <StreamViewer
              key={stream.id}
              stream={stream}
              onRemove={removeStream}
              width={streamWidth}
              height={streamHeight}
            />
          ))}
        </View>
      );
    }
    return rows;
  };

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const renderStackedView = () => {
    return activeStreams.map((stream) => (
      <StreamViewer
        key={stream.id}
        stream={stream}
        onRemove={removeStream}
        width={streamWidth}
        height={streamHeight}
      />
    ));
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Theme.gradients.background}
        style={styles.background}
      />
      
      {showControls && (
        <Animated.View style={[styles.header, animatedHeaderStyle]}>
          <LinearGradient
            colors={Theme.gradients.card}
            style={styles.headerGradient}
          >
            <View style={styles.titleRow}>
              <View style={styles.titleContainer}>
                <View style={styles.titleIconContainer}>
                  <LinearGradient
                    colors={Theme.gradients.buttonActive}
                    style={styles.titleIcon}
                  >
                    <Grid size={20} color={Theme.colors.background.primary} />
                  </LinearGradient>
                </View>
                <View>
                  <Text style={styles.title}>Multi-View</Text>
                  <View style={styles.subtitleContainer}>
                    <Animated.View style={animatedPulseStyle}>
                      <Eye size={14} color={Theme.colors.accent.primary} />
                    </Animated.View>
                    <Text style={styles.subtitle}>
                      {activeStreams.length} active stream{activeStreams.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              </View>
              
              <AnimatedTouchableOpacity
                style={styles.settingsButton}
                onPress={() => setShowControls(!showControls)}
              >
                <LinearGradient
                  colors={Theme.gradients.buttonActive}
                  style={styles.settingsGradient}
                >
                  <Settings size={18} color={Theme.colors.background.primary} />
                </LinearGradient>
              </AnimatedTouchableOpacity>
            </View>
            
            <View style={styles.controls}>
              <View style={styles.layoutControls}>
                <AnimatedTouchableOpacity
                  style={[
                    styles.controlButton,
                    layoutType === 'grid' && styles.activeControlButton
                  ]}
                  onPress={() => setLayoutType('grid')}
                >
                  <LinearGradient
                    colors={layoutType === 'grid' 
                      ? Theme.gradients.buttonActive 
                      : Theme.gradients.card
                    }
                    style={styles.controlGradient}
                  >
                    <Grid size={16} color={layoutType === 'grid' ? Theme.colors.background.primary : Theme.colors.text.tertiary} />
                    <Text style={[
                      styles.controlButtonText,
                      layoutType === 'grid' && styles.activeControlButtonText
                    ]}>
                      Grid
                    </Text>
                  </LinearGradient>
                </AnimatedTouchableOpacity>
                
                <AnimatedTouchableOpacity
                  style={[
                    styles.controlButton,
                    layoutType === 'stacked' && styles.activeControlButton
                  ]}
                  onPress={() => setLayoutType('stacked')}
                >
                  <LinearGradient
                    colors={layoutType === 'stacked' 
                      ? Theme.gradients.buttonActive 
                      : Theme.gradients.card
                    }
                    style={styles.controlGradient}
                  >
                    <List size={16} color={layoutType === 'stacked' ? Theme.colors.background.primary : Theme.colors.text.tertiary} />
                    <Text style={[
                      styles.controlButtonText,
                      layoutType === 'stacked' && styles.activeControlButtonText
                    ]}>
                      Stack
                    </Text>
                  </LinearGradient>
                </AnimatedTouchableOpacity>
              </View>
              
              <View style={styles.rightControls}>
                {layoutType === 'grid' && (
                  <View style={styles.columnControls}>
                    <>
                      <TouchableOpacity
                        style={styles.columnButton}
                        onPress={() => setGridColumns(Math.max(1, gridColumns - 1))}
                      >
                        <Text style={styles.columnButtonText}>-</Text>
                      </TouchableOpacity>
                      
                      <Text style={styles.columnText}>{gridColumns}</Text>
                      
                      <TouchableOpacity
                        style={styles.columnButton}
                        onPress={() => setGridColumns(Math.min(4, gridColumns + 1))}
                      >
                        <Text style={styles.columnButtonText}>+</Text>
                      </TouchableOpacity>
                    </>
                  </View>
                )}
                
                {activeStreams.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={clearAllStreams}
                  >
                    <LinearGradient
                      colors={Theme.gradients.danger}
                      style={styles.clearGradient}
                    >
                      <RotateCcw size={16} color={Theme.colors.text.primary} />
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      )}
      
      {!showControls && (
        <TouchableOpacity
          style={styles.floatingControls}
          onPress={() => setShowControls(true)}
        >
          <LinearGradient
            colors={Theme.gradients.primary}
            style={styles.floatingButton}
          >
            <Maximize size={20} color={Theme.colors.background.primary} />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {activeStreams.length === 0 ? (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={Theme.gradients.card}
            style={styles.emptyGradient}
          >
            <Animated.View style={animatedPulseStyle}>
              <Zap size={64} color={Theme.colors.text.tertiary} />
            </Animated.View>
            <Text style={styles.emptyTitle}>No Active Streams</Text>
            <Text style={styles.emptySubtitle}>
              Browse streamers and add them to your multi-view
            </Text>
          </LinearGradient>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {layoutType === 'grid' ? renderGridView() : renderStackedView()}
        </ScrollView>
      )}
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
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
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
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
      },
    }),
  },
  headerGradient: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  titleIconContainer: {
    borderRadius: Theme.radius.sm,
    overflow: 'hidden',
  },
  titleIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Theme.colors.text.primary,
    fontSize: Theme.typography.sizes.heading,
    fontWeight: Theme.typography.weights.bold,
    marginBottom: 6,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  subtitle: {
    color: Theme.colors.text.tertiary,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.regular,
  },
  settingsButton: {
    borderRadius: Theme.radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.background.tertiary,
  },
  settingsGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  layoutControls: {
    flexDirection: 'row',
    gap: Theme.spacing.xs,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  controlButton: {
    borderRadius: Theme.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.background.tertiary,
  },
  activeControlButton: {
    borderColor: Theme.colors.accent.primary,
  },
  controlGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    gap: Theme.spacing.xs,
  },
  controlButtonText: {
    color: Theme.colors.text.tertiary,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.regular,
  },
  activeControlButtonText: {
    color: Theme.colors.background.primary,
  },
  columnControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    backgroundColor: Theme.colors.background.card,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderWidth: 1,
    borderColor: Theme.colors.background.tertiary,
  },
  columnButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.accent.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.accent.primary + '30',
  },
  columnButtonText: {
    color: Theme.colors.accent.primary,
    fontSize: 16,
    fontWeight: Theme.typography.weights.medium,
  },
  columnText: {
    color: Theme.colors.text.primary,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.regular,
    minWidth: 24,
    textAlign: 'center',
  },
  clearButton: {
    borderRadius: Theme.radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.accent.red + '30',
  },
  clearGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    right: 16,
    zIndex: 1000,
  },
  floatingButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  scrollView: {
    flex: 1,
    paddingTop: 160,
  },
  scrollContent: {
    padding: Theme.spacing.sm,
    paddingBottom: 100,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyGradient: {
    alignItems: 'center',
    padding: Theme.spacing.xxl,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.background.tertiary,
  },
  emptyTitle: {
    color: Theme.colors.text.primary,
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.semibold,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Theme.colors.text.tertiary,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
});