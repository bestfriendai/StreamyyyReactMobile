/**
 * Stream Health Indicator Component
 * Real-time visualization of stream health, performance metrics, and connection status
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  interpolateColor,
  FadeIn,
  FadeOut,
  SlideInRight,
  BounceIn,
} from 'react-native-reanimated';
import {
  Wifi,
  WifiOff,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Signal,
  Eye,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurViewFallback as BlurView } from './BlurViewFallback';
import { ModernTheme } from '@/theme/modernTheme';
import { HapticFeedback } from '@/utils/haptics';
import {
  streamQualityManager,
  StreamQualityState,
  QualityLevel,
} from '@/services/streamQualityManager';
import {
  bandwidthMonitor,
  BandwidthMetrics,
  getConnectionQuality,
} from '@/services/bandwidthMonitor';
import {
  streamHealthMonitor,
  StreamHealthMetrics,
  getStreamHealthStatus,
} from '@/services/streamHealthMonitor';

interface StreamHealthIndicatorProps {
  streamId: string;
  compact?: boolean;
  showDetails?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onPress?: () => void;
}

interface HealthStatus {
  overall: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  connection: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  quality: QualityLevel;
  latency: number;
  bandwidth: number;
  errors: number;
  isStable: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

export const StreamHealthIndicator: React.FC<StreamHealthIndicatorProps> = ({
  streamId,
  compact = false,
  showDetails = false,
  position = 'top-right',
  onPress,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    overall: 'good',
    connection: 'good',
    quality: '720p',
    latency: 0,
    bandwidth: 0,
    errors: 0,
    isStable: true,
  });

  // Animation values
  const pulseAnimation = useSharedValue(1);
  const connectionPulse = useSharedValue(1);
  const warningFlash = useSharedValue(0);
  const detailsScale = useSharedValue(0);

  // Update health status
  useEffect(() => {
    const updateHealthStatus = () => {
      const qualityState = streamQualityManager.getStreamQuality(streamId);
      const healthMetrics = getStreamHealthStatus(streamId);
      const bandwidthMetrics = bandwidthMonitor.getCurrentMetrics();
      const connectionQuality = getConnectionQuality();

      if (qualityState && bandwidthMetrics) {
        const newStatus: HealthStatus = {
          overall: calculateOverallHealth(qualityState, healthMetrics, bandwidthMetrics),
          connection: connectionQuality as any,
          quality: qualityState.currentQuality,
          latency: qualityState.latency || bandwidthMetrics.latency,
          bandwidth: bandwidthMetrics.downloadSpeed,
          errors: healthMetrics?.errorCount || 0,
          isStable: bandwidthMetrics.isStable && (healthMetrics?.isHealthy ?? true),
        };

        setHealthStatus(newStatus);
      }
    };

    updateHealthStatus();

    // Subscribe to updates
    const unsubscribeQuality = streamQualityManager.onQualityChange(() => updateHealthStatus());
    const unsubscribeBandwidth = bandwidthMonitor.onBandwidthUpdate(() => updateHealthStatus());

    return () => {
      unsubscribeQuality();
      unsubscribeBandwidth();
    };
  }, [streamId]);

  // Animate based on health status
  useEffect(() => {
    const animateForHealth = (status: string) => {
      switch (status) {
        case 'excellent':
        case 'good':
          pulseAnimation.value = withRepeat(
            withSequence(
              withTiming(1.2, { duration: 1500 }),
              withTiming(1, { duration: 1500 })
            ),
            -1
          );
          warningFlash.value = 0;
          break;
        case 'fair':
          pulseAnimation.value = withRepeat(
            withSequence(
              withTiming(1.3, { duration: 1000 }),
              withTiming(1, { duration: 1000 })
            ),
            -1
          );
          warningFlash.value = withRepeat(
            withSequence(
              withTiming(0.5, { duration: 1000 }),
              withTiming(0, { duration: 1000 })
            ),
            -1
          );
          break;
        case 'poor':
        case 'critical':
          pulseAnimation.value = withRepeat(
            withSequence(
              withTiming(1.4, { duration: 600 }),
              withTiming(1, { duration: 600 })
            ),
            -1
          );
          warningFlash.value = withRepeat(
            withSequence(
              withTiming(1, { duration: 600 }),
              withTiming(0, { duration: 600 })
            ),
            -1
          );
          break;
      }
    };

    animateForHealth(healthStatus.overall);
  }, [healthStatus.overall]);

  // Connection stability animation
  useEffect(() => {
    if (healthStatus.isStable) {
      connectionPulse.value = withSpring(1);
    } else {
      connectionPulse.value = withRepeat(
        withSequence(
          withSpring(1.2),
          withSpring(0.8)
        ),
        -1
      );
    }
  }, [healthStatus.isStable]);

  const calculateOverallHealth = (
    quality: StreamQualityState,
    health: StreamHealthMetrics | null,
    bandwidth: BandwidthMetrics
  ): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' => {
    let score = 100;

    // Deduct for errors
    if (health) {
      score -= health.errorCount * 10;
      score -= health.consecutiveFailures * 15;
      if (!health.isHealthy) score -= 20;
    }

    // Deduct for performance issues
    if (quality.frameDrops > 5) score -= 20;
    if (quality.latency > 300) score -= 15;
    if (quality.bufferHealth < 50) score -= 15;

    // Deduct for bandwidth issues
    if (!bandwidth.isStable) score -= 10;
    if (bandwidth.latency > 300) score -= 10;
    if (bandwidth.jitter > 50) score -= 10;

    // Convert score to rating
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  };

  const getHealthColor = (status: string) => {
    const colors = {
      excellent: ModernTheme.colors.success[500],
      good: ModernTheme.colors.success[400],
      fair: ModernTheme.colors.warning[400],
      poor: ModernTheme.colors.error[400],
      critical: ModernTheme.colors.error[500],
    };
    return colors[status as keyof typeof colors] || ModernTheme.colors.text.secondary;
  };

  const getHealthIcon = (status: string, size: number = 16) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle size={size} color={getHealthColor(status)} />;
      case 'good':
        return <CheckCircle size={size} color={getHealthColor(status)} />;
      case 'fair':
        return <Minus size={size} color={getHealthColor(status)} />;
      case 'poor':
        return <AlertTriangle size={size} color={getHealthColor(status)} />;
      case 'critical':
        return <XCircle size={size} color={getHealthColor(status)} />;
      default:
        return <Activity size={size} color={ModernTheme.colors.text.secondary} />;
    }
  };

  const getConnectionIcon = (status: string, size: number = 16) => {
    const iconProps = {
      size,
      color: getHealthColor(status),
    };

    if (status === 'critical' || status === 'poor') {
      return <WifiOff {...iconProps} />;
    }
    return <Wifi {...iconProps} />;
  };

  const handlePress = useCallback(() => {
    HapticFeedback.light();
    if (onPress) {
      onPress();
    } else {
      setShowModal(true);
    }
  }, [onPress]);

  const getLatencyStatus = (latency: number) => {
    if (latency < 100) return 'excellent';
    if (latency < 200) return 'good';
    if (latency < 300) return 'fair';
    if (latency < 500) return 'poor';
    return 'critical';
  };

  const getBandwidthStatus = (bandwidth: number) => {
    if (bandwidth >= 10) return 'excellent';
    if (bandwidth >= 5) return 'good';
    if (bandwidth >= 2) return 'fair';
    if (bandwidth >= 1) return 'poor';
    return 'critical';
  };

  // Animated styles
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const connectionStyle = useAnimatedStyle(() => ({
    transform: [{ scale: connectionPulse.value }],
  }));

  const warningStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      warningFlash.value,
      [0, 1],
      ['transparent', 'rgba(239, 68, 68, 0.2)']
    ),
  }));

  const detailsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: detailsScale.value }],
    opacity: interpolate(detailsScale.value, [0, 1], [0, 1]),
  }));

  const positionStyles = {
    'top-left': { top: 8, left: 8 },
    'top-right': { top: 8, right: 8 },
    'bottom-left': { bottom: 8, left: 8 },
    'bottom-right': { bottom: 8, right: 8 },
  };

  return (
    <>
      <AnimatedTouchableOpacity
        style={[
          styles.indicator,
          positionStyles[position],
          compact && styles.compactIndicator,
          warningStyle,
        ]}
        onPress={handlePress}
      >
        <BlurView style={styles.indicatorBlur} blurType="dark" blurAmount={15}>
          <View style={styles.indicatorContent}>
            {/* Main Health Status */}
            <Animated.View style={[styles.healthIcon, pulseStyle]}>
              {getHealthIcon(healthStatus.overall, compact ? 12 : 16)}
            </Animated.View>

            {!compact && (
              <>
                {/* Connection Status */}
                <Animated.View style={[styles.connectionIcon, connectionStyle]}>
                  {getConnectionIcon(healthStatus.connection, 12)}
                </Animated.View>

                {showDetails && (
                  <AnimatedView style={[styles.detailsContainer, detailsStyle]}>
                    <Text style={styles.detailText}>
                      {healthStatus.latency}ms • {healthStatus.bandwidth.toFixed(1)}Mbps
                    </Text>
                  </AnimatedView>
                )}
              </>
            )}
          </View>
        </BlurView>
      </AnimatedTouchableOpacity>

      {/* Health Details Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <AnimatedView
            entering={SlideInRight.delay(100)}
            exiting={FadeOut}
            style={styles.modalContent}
          >
            <BlurView style={styles.modalBlur} blurType="dark" blurAmount={20}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Stream Health</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <XCircle size={20} color={ModernTheme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.healthSections}>
                {/* Overall Health */}
                <View style={styles.healthSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Overall Status</Text>
                    <View style={styles.statusBadge}>
                      {getHealthIcon(healthStatus.overall, 16)}
                      <Text style={[styles.statusText, { color: getHealthColor(healthStatus.overall) }]}>
                        {healthStatus.overall.charAt(0).toUpperCase() + healthStatus.overall.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Connection Metrics */}
                <View style={styles.healthSection}>
                  <Text style={styles.sectionTitle}>Connection</Text>
                  <View style={styles.metricsGrid}>
                    <View style={styles.metric}>
                      <View style={styles.metricHeader}>
                        <Signal size={14} color={getHealthColor(getLatencyStatus(healthStatus.latency))} />
                        <Text style={styles.metricLabel}>Latency</Text>
                      </View>
                      <Text style={styles.metricValue}>{healthStatus.latency}ms</Text>
                      <Text style={[styles.metricStatus, { color: getHealthColor(getLatencyStatus(healthStatus.latency)) }]}>
                        {getLatencyStatus(healthStatus.latency)}
                      </Text>
                    </View>

                    <View style={styles.metric}>
                      <View style={styles.metricHeader}>
                        <Activity size={14} color={getHealthColor(getBandwidthStatus(healthStatus.bandwidth))} />
                        <Text style={styles.metricLabel}>Bandwidth</Text>
                      </View>
                      <Text style={styles.metricValue}>{healthStatus.bandwidth.toFixed(1)} Mbps</Text>
                      <Text style={[styles.metricStatus, { color: getHealthColor(getBandwidthStatus(healthStatus.bandwidth)) }]}>
                        {getBandwidthStatus(healthStatus.bandwidth)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Quality Metrics */}
                <View style={styles.healthSection}>
                  <Text style={styles.sectionTitle}>Stream Quality</Text>
                  <View style={styles.metricsGrid}>
                    <View style={styles.metric}>
                      <View style={styles.metricHeader}>
                        <Eye size={14} color={ModernTheme.colors.primary[400]} />
                        <Text style={styles.metricLabel}>Current Quality</Text>
                      </View>
                      <Text style={styles.metricValue}>{healthStatus.quality}</Text>
                    </View>

                    <View style={styles.metric}>
                      <View style={styles.metricHeader}>
                        <AlertTriangle size={14} color={healthStatus.errors > 0 ? ModernTheme.colors.error[400] : ModernTheme.colors.success[400]} />
                        <Text style={styles.metricLabel}>Errors</Text>
                      </View>
                      <Text style={styles.metricValue}>{healthStatus.errors}</Text>
                    </View>
                  </View>
                </View>

                {/* Stability Indicator */}
                <View style={styles.stabilitySection}>
                  <View style={styles.stabilityHeader}>
                    <Zap size={16} color={healthStatus.isStable ? ModernTheme.colors.success[400] : ModernTheme.colors.warning[400]} />
                    <Text style={styles.stabilityText}>
                      {healthStatus.isStable ? 'Connection Stable' : 'Connection Unstable'}
                    </Text>
                  </View>
                  
                  <View style={styles.stabilityBar}>
                    <LinearGradient
                      colors={
                        healthStatus.isStable
                          ? [ModernTheme.colors.success[400], ModernTheme.colors.success[500]]
                          : [ModernTheme.colors.warning[400], ModernTheme.colors.error[400]]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.stabilityFill,
                        { width: healthStatus.isStable ? '100%' : '60%' }
                      ]}
                    />
                  </View>
                </View>
              </View>
            </BlurView>
          </AnimatedView>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
    minWidth: 60,
    minHeight: 32,
  },
  compactIndicator: {
    minWidth: 40,
    minHeight: 24,
  },
  indicatorBlur: {
    flex: 1,
  },
  indicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: ModernTheme.spacing.xs,
    gap: 4,
  },
  healthIcon: {
    position: 'relative',
  },
  connectionIcon: {
    position: 'relative',
  },
  detailsContainer: {
    marginLeft: 4,
  },
  detailText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ModernTheme.spacing.lg,
  },
  modalContent: {
    backgroundColor: 'transparent',
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalBlur: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ModernTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: 18,
    fontWeight: ModernTheme.typography.weights.semibold,
  },
  healthSections: {
    padding: ModernTheme.spacing.md,
    gap: ModernTheme.spacing.md,
  },
  healthSection: {
    gap: ModernTheme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: 14,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: ModernTheme.borderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  },
  metric: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: ModernTheme.spacing.sm,
    borderRadius: ModernTheme.borderRadius.md,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metricLabel: {
    color: ModernTheme.colors.text.secondary,
    fontSize: 11,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  metricValue: {
    color: ModernTheme.colors.text.primary,
    fontSize: 16,
    fontWeight: ModernTheme.typography.weights.semibold,
    marginBottom: 2,
  },
  metricStatus: {
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  stabilitySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: ModernTheme.spacing.sm,
    borderRadius: ModernTheme.borderRadius.md,
  },
  stabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  stabilityText: {
    color: ModernTheme.colors.text.primary,
    fontSize: 12,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  stabilityBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  stabilityFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default StreamHealthIndicator;