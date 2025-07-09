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
        colors={['#0f0f0f', '#1a1a1a', '#0f0f0f']}
        style={styles.background}
      />
      
      {showControls && (
        <Animated.View style={[styles.header, animatedHeaderStyle]}>
          <LinearGradient
            colors={[
              'rgba(26, 26, 26, 0.98)',
              'rgba(15, 15, 15, 0.95)',
              'rgba(0, 0, 0, 0.9)'
            ]}
            style={styles.headerGradient}
          >
            <View style={styles.titleRow}>
              <View style={styles.titleContainer}>
                <View style={styles.titleIconContainer}>
                  <LinearGradient
                    colors={['#8B5CF6', '#A855F7']}
                    style={styles.titleIcon}
                  >
                    <Grid size={20} color="#fff" />
                  </LinearGradient>
                </View>
                <View>
                  <Text style={styles.title}>Multi-View</Text>
                  <View style={styles.subtitleContainer}>
                    <Animated.View style={animatedPulseStyle}>
                      <Eye size={14} color="#8B5CF6" />
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
                  colors={['rgba(139, 92, 246, 0.2)', 'rgba(124, 58, 237, 0.2)']}
                  style={styles.settingsGradient}
                >
                  <Settings size={18} color="#8B5CF6" />
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
                      ? ['#8B5CF6', '#7C3AED'] 
                      : ['rgba(42, 42, 42, 0.8)', 'rgba(58, 58, 58, 0.8)']
                    }
                    style={styles.controlGradient}
                  >
                    <Grid size={16} color={layoutType === 'grid' ? '#fff' : '#666'} />
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
                      ? ['#8B5CF6', '#7C3AED'] 
                      : ['rgba(42, 42, 42, 0.8)', 'rgba(58, 58, 58, 0.8)']
                    }
                    style={styles.controlGradient}
                  >
                    <List size={16} color={layoutType === 'stacked' ? '#fff' : '#666'} />
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
                      colors={['rgba(239, 68, 68, 0.9)', 'rgba(220, 38, 38, 0.9)']}
                      style={styles.clearGradient}
                    >
                      <RotateCcw size={16} color="#fff" />
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
            colors={['rgba(139, 92, 246, 0.9)', 'rgba(139, 92, 246, 0.7)']}
            style={styles.floatingButton}
          >
            <Maximize size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {activeStreams.length === 0 ? (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.15)', 'rgba(124, 58, 237, 0.1)', 'transparent']}
            style={styles.emptyGradient}
          >
            <Animated.View style={animatedPulseStyle}>
              <Zap size={64} color="#666" />
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleIconContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  titleIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtitle: {
    color: '#999',
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  settingsButton: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
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
    gap: 10,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlButton: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeControlButton: {
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  controlGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  controlButtonText: {
    color: '#666',
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  activeControlButtonText: {
    color: '#fff',
  },
  columnControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(42, 42, 42, 0.9)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  columnButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  columnButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  columnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    minWidth: 24,
    textAlign: 'center',
  },
  clearButton: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
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
    padding: 12,
    paddingBottom: 100,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyGradient: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
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
  },
});