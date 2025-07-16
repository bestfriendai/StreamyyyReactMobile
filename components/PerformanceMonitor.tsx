/**
 * Performance Monitor Component
 * Real-time dashboard for system performance, stream metrics, and optimization recommendations
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
} from 'react-native-reanimated';
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Battery,
  Zap,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  RefreshCw,
  X,
  Eye,
  Clock,
  Signal,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurViewFallback as BlurView } from './BlurViewFallback';
import { ModernTheme } from '@/theme/modernTheme';
import { HapticFeedback } from '@/utils/haptics';
import {
  performanceOptimizer,
  PerformanceMetrics,
  OptimizationRecommendation,
  getCurrentPerformance,
  getOptimizationRecommendations,
} from '@/services/performanceOptimizer';
import {
  bandwidthMonitor,
  BandwidthMetrics,
  getCurrentBandwidth,
} from '@/services/bandwidthMonitor';
import {
  streamQualityManager,
  getOptimalQuality,
} from '@/services/streamQualityManager';

interface PerformanceMonitorProps {
  visible?: boolean;
  onClose?: () => void;
  compact?: boolean;
  showRecommendations?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
}

const { width: screenWidth } = Dimensions.get('window');
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  status,
  icon,
  trend,
  subtitle,
}) => {
  const cardScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  const getStatusColor = (status: string) => {
    const colors = {
      excellent: ModernTheme.colors.success[500],
      good: ModernTheme.colors.success[400],
      fair: ModernTheme.colors.warning[400],
      poor: ModernTheme.colors.error[400],
      critical: ModernTheme.colors.error[500],
    };
    return colors[status as keyof typeof colors] || ModernTheme.colors.text.secondary;
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp size={12} color={ModernTheme.colors.success[400]} />;
    if (trend === 'down') return <TrendingDown size={12} color={ModernTheme.colors.error[400]} />;
    return null;
  };

  const getProgressPercentage = () => {
    if (typeof value === 'number') {
      return Math.min(value, 100);
    }
    return 0;
  };

  useEffect(() => {
    progressWidth.value = withTiming(getProgressPercentage(), { duration: 1000 });
  }, [value]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <AnimatedView entering={FadeIn.delay(200)} style={[styles.metricCard, cardStyle]}>
      <BlurView style={styles.cardBlur} blurType="dark" blurAmount={15}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.iconContainer, { backgroundColor: `${getStatusColor(status)}20` }]}>
              {React.cloneElement(icon as React.ReactElement, {
                color: getStatusColor(status),
                size: 16,
              })}
            </View>
            <Text style={styles.cardTitle}>{title}</Text>
            {getTrendIcon()}
          </View>
          <View style={styles.cardValue}>
            <Text style={[styles.valueText, { color: getStatusColor(status) }]}>
              {value}
            </Text>
            {unit && <Text style={styles.unitText}>{unit}</Text>}
          </View>
        </View>
        
        {subtitle && (
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        )}
        
        {typeof value === 'number' && value <= 100 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, progressStyle]}>
                <LinearGradient
                  colors={[getStatusColor(status), `${getStatusColor(status)}80`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </Animated.View>
            </View>
          </View>
        )}
      </BlurView>
    </AnimatedView>
  );
};

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  visible = false,
  onClose,
  compact = false,
  showRecommendations = true,
}) => {
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [bandwidthMetrics, setBandwidthMetrics] = useState<BandwidthMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const contentScale = useSharedValue(0);
  const refreshRotation = useSharedValue(0);

  // Update metrics
  const updateMetrics = useCallback(async () => {
    const perfMetrics = getCurrentPerformance();
    const bwMetrics = getCurrentBandwidth();
    const recs = getOptimizationRecommendations();

    setPerformanceMetrics(perfMetrics);
    setBandwidthMetrics(bwMetrics);
    setRecommendations(recs);
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!visible) return;

    updateMetrics();

    const unsubscribePerf = performanceOptimizer.onPerformanceUpdate((metrics) => {
      setPerformanceMetrics(metrics);
    });

    const unsubscribeBandwidth = bandwidthMonitor.onBandwidthUpdate((metrics) => {
      setBandwidthMetrics(metrics);
    });

    const unsubscribeRecs = performanceOptimizer.onRecommendations((recs) => {
      setRecommendations(recs);
    });

    return () => {
      unsubscribePerf();
      unsubscribeBandwidth();
      unsubscribeRecs();
    };
  }, [visible, updateMetrics]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    HapticFeedback.medium();
    
    refreshRotation.value = withTiming(360, { duration: 1000 });
    
    await updateMetrics();
    
    setTimeout(() => {
      setRefreshing(false);
      refreshRotation.value = 0;
    }, 1000);
  }, [updateMetrics]);

  // Animate content
  useEffect(() => {
    if (visible) {
      contentScale.value = withSpring(1, { damping: 20 });
    } else {
      contentScale.value = withSpring(0, { damping: 20 });
    }
  }, [visible]);

  const getMemoryStatus = (usage: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' => {
    const percentage = (usage / 1024) * 100; // Assuming 1GB total as baseline
    if (percentage < 30) return 'excellent';
    if (percentage < 50) return 'good';
    if (percentage < 70) return 'fair';
    if (percentage < 90) return 'poor';
    return 'critical';
  };

  const getCPUStatus = (usage: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' => {
    if (usage < 30) return 'excellent';
    if (usage < 50) return 'good';
    if (usage < 70) return 'fair';
    if (usage < 90) return 'poor';
    return 'critical';
  };

  const getBandwidthStatus = (speed: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' => {
    if (speed >= 10) return 'excellent';
    if (speed >= 5) return 'good';
    if (speed >= 2) return 'fair';
    if (speed >= 1) return 'poor';
    return 'critical';
  };

  const getLatencyStatus = (latency: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' => {
    if (latency < 50) return 'excellent';
    if (latency < 100) return 'good';
    if (latency < 200) return 'fair';
    if (latency < 300) return 'poor';
    return 'critical';
  };

  const getBatteryStatus = (level?: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' => {
    if (!level) return 'good';
    if (level > 80) return 'excellent';
    if (level > 60) return 'good';
    if (level > 40) return 'fair';
    if (level > 20) return 'poor';
    return 'critical';
  };

  // Animated styles
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
    opacity: interpolate(contentScale.value, [0, 1], [0, 1]),
  }));

  const refreshStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${refreshRotation.value}deg` }],
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <AnimatedView
          entering={SlideInUp.delay(100)}
          exiting={SlideOutDown}
          style={[styles.modalContent, compact && styles.compactModal, contentStyle]}
        >
          <BlurView style={styles.modalBlur} blurType="dark" blurAmount={20}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <BarChart3 size={20} color={ModernTheme.colors.primary[400]} />
                <Text style={styles.headerTitle}>Performance Monitor</Text>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
                  <Animated.View style={refreshStyle}>
                    <RefreshCw size={18} color={ModernTheme.colors.text.secondary} />
                  </Animated.View>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose}>
                  <X size={18} color={ModernTheme.colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* System Metrics */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>System Performance</Text>
                <View style={styles.metricsGrid}>
                  <MetricCard
                    title="CPU Usage"
                    value={performanceMetrics?.cpuUsage || 0}
                    unit="%"
                    status={getCPUStatus(performanceMetrics?.cpuUsage || 0)}
                    icon={<Cpu />}
                    trend={performanceMetrics?.cpuUsage && performanceMetrics.cpuUsage > 70 ? 'up' : 'stable'}
                  />
                  <MetricCard
                    title="Memory"
                    value={performanceMetrics?.memoryUsage || 0}
                    unit="MB"
                    status={getMemoryStatus(performanceMetrics?.memoryUsage || 0)}
                    icon={<HardDrive />}
                    subtitle={performanceMetrics?.memoryPressure || 'Normal'}
                  />
                </View>
                
                <View style={styles.metricsGrid}>
                  <MetricCard
                    title="Frame Rate"
                    value={performanceMetrics?.frameRate || 60}
                    unit="fps"
                    status={performanceMetrics?.frameRate && performanceMetrics.frameRate < 30 ? 'poor' : 'good'}
                    icon={<Eye />}
                  />
                  {performanceMetrics?.batteryLevel && (
                    <MetricCard
                      title="Battery"
                      value={performanceMetrics.batteryLevel}
                      unit="%"
                      status={getBatteryStatus(performanceMetrics.batteryLevel)}
                      icon={<Battery />}
                      subtitle={performanceMetrics.isCharging ? 'Charging' : 'Not charging'}
                    />
                  )}
                </View>
              </View>

              {/* Network Metrics */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Network Performance</Text>
                <View style={styles.metricsGrid}>
                  <MetricCard
                    title="Download"
                    value={bandwidthMetrics?.downloadSpeed.toFixed(1) || '0'}
                    unit="Mbps"
                    status={getBandwidthStatus(bandwidthMetrics?.downloadSpeed || 0)}
                    icon={<Wifi />}
                    trend={bandwidthMetrics?.isStable ? 'stable' : 'down'}
                  />
                  <MetricCard
                    title="Latency"
                    value={bandwidthMetrics?.latency || 0}
                    unit="ms"
                    status={getLatencyStatus(bandwidthMetrics?.latency || 0)}
                    icon={<Signal />}
                  />
                </View>
                
                <View style={styles.metricsGrid}>
                  <MetricCard
                    title="Jitter"
                    value={bandwidthMetrics?.jitter || 0}
                    unit="ms"
                    status={bandwidthMetrics?.jitter && bandwidthMetrics.jitter > 50 ? 'poor' : 'good'}
                    icon={<Activity />}
                  />
                  <MetricCard
                    title="Connection"
                    value={bandwidthMetrics?.connectionType || 'Unknown'}
                    status={bandwidthMetrics?.isStable ? 'good' : 'poor'}
                    icon={<Zap />}
                    subtitle={bandwidthMetrics?.isStable ? 'Stable' : 'Unstable'}
                  />
                </View>
              </View>

              {/* Recommendations */}
              {showRecommendations && recommendations.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Optimization Recommendations</Text>
                  {recommendations.map((rec, index) => (
                    <Animated.View
                      key={index}
                      entering={FadeIn.delay(300 + index * 100)}
                      style={styles.recommendationCard}
                    >
                      <BlurView style={styles.recommendationBlur} blurType="dark" blurAmount={10}>
                        <View style={styles.recommendationHeader}>
                          <View style={styles.recommendationIcon}>
                            {rec.severity === 'critical' ? (
                              <AlertTriangle size={16} color={ModernTheme.colors.error[400]} />
                            ) : rec.severity === 'warning' ? (
                              <AlertTriangle size={16} color={ModernTheme.colors.warning[400]} />
                            ) : (
                              <CheckCircle size={16} color={ModernTheme.colors.primary[400]} />
                            )}
                          </View>
                          <View style={styles.recommendationContent}>
                            <Text style={styles.recommendationTitle}>{rec.message}</Text>
                            <Text style={styles.recommendationAction}>{rec.action}</Text>
                            <Text style={styles.recommendationImpact}>{rec.impact}</Text>
                          </View>
                          {rec.autoApply && (
                            <View style={styles.autoApplyBadge}>
                              <Text style={styles.autoApplyText}>Auto</Text>
                            </View>
                          )}
                        </View>
                      </BlurView>
                    </Animated.View>
                  ))}
                </View>
              )}

              {/* Quick Actions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => {
                    HapticFeedback.medium();
                    // Implement optimization actions
                  }}>
                    <LinearGradient
                      colors={[ModernTheme.colors.primary[500], ModernTheme.colors.primary[600]]}
                      style={styles.actionGradient}
                    >
                      <Zap size={16} color="#fff" />
                      <Text style={styles.actionText}>Optimize Now</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.actionButton} onPress={() => {
                    HapticFeedback.light();
                    // Open settings
                  }}>
                    <View style={styles.actionSecondary}>
                      <Settings size={16} color={ModernTheme.colors.text.primary} />
                      <Text style={styles.actionSecondaryText}>Settings</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </BlurView>
        </AnimatedView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ModernTheme.spacing.md,
  },
  modalContent: {
    backgroundColor: 'transparent',
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  compactModal: {
    maxWidth: 350,
    maxHeight: '80%',
  },
  modalBlur: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ModernTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.sm,
  },
  headerTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: 18,
    fontWeight: ModernTheme.typography.weights.semibold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.md,
  },
  content: {
    flex: 1,
    padding: ModernTheme.spacing.md,
  },
  section: {
    marginBottom: ModernTheme.spacing.lg,
  },
  sectionTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: 16,
    fontWeight: ModernTheme.typography.weights.semibold,
    marginBottom: ModernTheme.spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
    marginBottom: ModernTheme.spacing.sm,
  },
  metricCard: {
    flex: 1,
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
    minHeight: 80,
  },
  cardBlur: {
    flex: 1,
    padding: ModernTheme.spacing.sm,
  },
  cardHeader: {
    marginBottom: ModernTheme.spacing.xs,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  iconContainer: {
    padding: 4,
    borderRadius: ModernTheme.borderRadius.sm,
  },
  cardTitle: {
    color: ModernTheme.colors.text.secondary,
    fontSize: 11,
    fontWeight: ModernTheme.typography.weights.medium,
    flex: 1,
  },
  cardValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  valueText: {
    fontSize: 18,
    fontWeight: ModernTheme.typography.weights.bold,
  },
  unitText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: 12,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  cardSubtitle: {
    color: ModernTheme.colors.text.secondary,
    fontSize: 10,
    marginBottom: 6,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  recommendationCard: {
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
    marginBottom: ModernTheme.spacing.sm,
  },
  recommendationBlur: {
    padding: ModernTheme.spacing.sm,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ModernTheme.spacing.sm,
  },
  recommendationIcon: {
    marginTop: 2,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: 13,
    fontWeight: ModernTheme.typography.weights.medium,
    marginBottom: 2,
  },
  recommendationAction: {
    color: ModernTheme.colors.primary[400],
    fontSize: 12,
    fontWeight: ModernTheme.typography.weights.medium,
    marginBottom: 2,
  },
  recommendationImpact: {
    color: ModernTheme.colors.text.secondary,
    fontSize: 11,
  },
  autoApplyBadge: {
    backgroundColor: ModernTheme.colors.accent[400],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: ModernTheme.borderRadius.sm,
  },
  autoApplyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.bold,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: ModernTheme.spacing.sm,
  },
  actionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  actionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: ModernTheme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionSecondaryText: {
    color: ModernTheme.colors.text.primary,
    fontSize: 13,
    fontWeight: ModernTheme.typography.weights.medium,
  },
});

export default PerformanceMonitor;