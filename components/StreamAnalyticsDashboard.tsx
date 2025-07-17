import { LinearGradient } from 'expo-linear-gradient';
import {
  Activity,
  TrendingUp,
  Users,
  Clock,
  Wifi,
  Zap,
  AlertTriangle,
  CheckCircle,
  Eye,
  MessageCircle,
  Video,
  Gauge,
  Globe,
  Smartphone,
} from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { BarChart, LineChart, PieChart, ProgressChart } from 'react-native-chart-kit';
import { UniversalStream } from '@/services/multiPlatformStreamingApi';
import { ModernTheme } from '@/theme/modernTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const chartConfig = {
  backgroundColor: '#1e1e1e',
  backgroundGradientFrom: '#2a2a2a',
  backgroundGradientTo: '#1a1a1a',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#8B5CF6',
  },
};

interface StreamAnalytics {
  totalWatchTime: number;
  averageViewers: number;
  peakViewers: number;
  chatMessages: number;
  qualitySwitches: number;
  bufferingEvents: number;
  errorCount: number;
  platformBreakdown: { [platform: string]: number };
  viewerCountHistory: number[];
  performanceMetrics: {
    avgLoadTime: number;
    successRate: number;
    retryRate: number;
    bandwidthUsage: number;
  };
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  connectionTypes: {
    wifi: number;
    cellular: number;
    ethernet: number;
  };
}

interface StreamAnalyticsDashboardProps {
  streams: UniversalStream[];
  isVisible: boolean;
  onClose: () => void;
}

export const StreamAnalyticsDashboard: React.FC<StreamAnalyticsDashboardProps> = ({
  streams,
  isVisible,
  onClose,
}) => {
  const [analytics, setAnalytics] = useState<StreamAnalytics>({
    totalWatchTime: 0,
    averageViewers: 0,
    peakViewers: 0,
    chatMessages: 0,
    qualitySwitches: 0,
    bufferingEvents: 0,
    errorCount: 0,
    platformBreakdown: {},
    viewerCountHistory: [],
    performanceMetrics: {
      avgLoadTime: 0,
      successRate: 0,
      retryRate: 0,
      bandwidthUsage: 0,
    },
    deviceBreakdown: {
      mobile: 0,
      desktop: 0,
      tablet: 0,
    },
    connectionTypes: {
      wifi: 0,
      cellular: 0,
      ethernet: 0,
    },
  });

  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('6h');
  const [realTimeData, setRealTimeData] = useState(true);

  // Generate mock analytics data based on current streams
  const generateAnalytics = useCallback(() => {
    const totalViewers = streams.reduce((sum, stream) => sum + stream.viewerCount, 0);
    const platforms = streams.reduce(
      (acc, stream) => {
        acc[stream.platform] = (acc[stream.platform] || 0) + stream.viewerCount;
        return acc;
      },
      {} as { [key: string]: number }
    );

    // Generate mock historical data
    const viewerHistory = Array.from({ length: 24 }, (_, i) => {
      const baseViewers = totalViewers;
      const variation = Math.sin(i * 0.2) * 0.3 + Math.random() * 0.2 - 0.1;
      return Math.max(0, Math.floor(baseViewers * (1 + variation)));
    });

    const mockAnalytics: StreamAnalytics = {
      totalWatchTime: Math.floor(totalViewers * 2.5), // Average 2.5 hours per viewer
      averageViewers: Math.floor(totalViewers * 0.85),
      peakViewers: Math.floor(totalViewers * 1.3),
      chatMessages: Math.floor(totalViewers * 0.1), // 10% chat participation
      qualitySwitches: Math.floor(streams.length * 15),
      bufferingEvents: Math.floor(streams.length * 8),
      errorCount: Math.floor(streams.length * 2),
      platformBreakdown: platforms,
      viewerCountHistory: viewerHistory,
      performanceMetrics: {
        avgLoadTime: 2.8 + Math.random() * 1.5, // 2.8-4.3 seconds
        successRate: 0.92 + Math.random() * 0.06, // 92-98%
        retryRate: 0.05 + Math.random() * 0.03, // 5-8%
        bandwidthUsage: totalViewers * 2.5 + Math.random() * 100, // MB
      },
      deviceBreakdown: {
        mobile: Math.floor(totalViewers * 0.6),
        desktop: Math.floor(totalViewers * 0.35),
        tablet: Math.floor(totalViewers * 0.05),
      },
      connectionTypes: {
        wifi: Math.floor(totalViewers * 0.7),
        cellular: Math.floor(totalViewers * 0.25),
        ethernet: Math.floor(totalViewers * 0.05),
      },
    };

    setAnalytics(mockAnalytics);
  }, [streams]);

  // Update analytics data
  useEffect(() => {
    if (isVisible) {
      generateAnalytics();

      if (realTimeData) {
        const interval = setInterval(generateAnalytics, 30000); // Update every 30 seconds
        return () => clearInterval(interval);
      }
    }
  }, [isVisible, generateAnalytics, realTimeData]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    } else if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${bytes} B`;
  };

  // Prepare chart data
  const viewerChartData = {
    labels: Array.from({ length: 6 }, (_, i) => `${6 - i}h`),
    datasets: [
      {
        data: analytics.viewerCountHistory.slice(-6),
      },
    ],
  };

  const platformPieData = Object.entries(analytics.platformBreakdown).map(
    ([platform, viewers], index) => ({
      name: platform.charAt(0).toUpperCase() + platform.slice(1),
      population: viewers,
      color: ['#9146FF', '#FF0000', '#53FC18', '#1877F2'][index % 4],
      legendFontColor: '#fff',
      legendFontSize: 12,
    })
  );

  const performanceData = {
    labels: ['Success', 'Retry', 'Error'],
    data: [
      analytics.performanceMetrics.successRate,
      analytics.performanceMetrics.retryRate,
      1 - analytics.performanceMetrics.successRate - analytics.performanceMetrics.retryRate,
    ],
  };

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[ModernTheme.colors.background.primary, ModernTheme.colors.background.secondary]}
        style={styles.gradient}
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.header}
        >
          <View style={styles.headerLeft}>
            <Activity size={24} color={ModernTheme.colors.primary[500]} />
            <Text style={styles.headerTitle}>Stream Analytics</Text>
            <View style={[styles.liveIndicator, { opacity: realTimeData ? 1 : 0.5 }]}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </MotiView>

        {/* Time Range Selector */}
        <View style={styles.timeRangeSelector}>
          {(['1h', '6h', '24h', '7d'] as const).map(range => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                selectedTimeRange === range && styles.timeRangeButtonActive,
              ]}
              onPress={() => setSelectedTimeRange(range)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  selectedTimeRange === range && styles.timeRangeTextActive,
                ]}
              >
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Key Metrics */}
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 100 }}
            style={styles.metricsGrid}
          >
            <View style={styles.metricCard}>
              <LinearGradient
                colors={[ModernTheme.colors.primary[600], ModernTheme.colors.primary[500]]}
                style={styles.metricGradient}
              >
                <Users size={20} color="#fff" />
                <Text style={styles.metricValue}>{formatNumber(analytics.averageViewers)}</Text>
                <Text style={styles.metricLabel}>Avg Viewers</Text>
              </LinearGradient>
            </View>

            <View style={styles.metricCard}>
              <LinearGradient
                colors={[ModernTheme.colors.success[600], ModernTheme.colors.success[500]]}
                style={styles.metricGradient}
              >
                <TrendingUp size={20} color="#fff" />
                <Text style={styles.metricValue}>{formatNumber(analytics.peakViewers)}</Text>
                <Text style={styles.metricLabel}>Peak Viewers</Text>
              </LinearGradient>
            </View>

            <View style={styles.metricCard}>
              <LinearGradient
                colors={[ModernTheme.colors.accent[600], ModernTheme.colors.accent[500]]}
                style={styles.metricGradient}
              >
                <Clock size={20} color="#fff" />
                <Text style={styles.metricValue}>{formatDuration(analytics.totalWatchTime)}</Text>
                <Text style={styles.metricLabel}>Watch Time</Text>
              </LinearGradient>
            </View>

            <View style={styles.metricCard}>
              <LinearGradient
                colors={[ModernTheme.colors.secondary[600], ModernTheme.colors.secondary[500]]}
                style={styles.metricGradient}
              >
                <MessageCircle size={20} color="#fff" />
                <Text style={styles.metricValue}>{formatNumber(analytics.chatMessages)}</Text>
                <Text style={styles.metricLabel}>Chat Messages</Text>
              </LinearGradient>
            </View>
          </MotiView>

          {/* Viewer Count Chart */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200 }}
            style={styles.chartContainer}
          >
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Viewer Count Over Time</Text>
              <View style={styles.chartLegend}>
                <Eye size={16} color={ModernTheme.colors.primary[500]} />
                <Text style={styles.chartLegendText}>Live Viewers</Text>
              </View>
            </View>
            <LineChart
              data={viewerChartData}
              width={SCREEN_WIDTH - 48}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </MotiView>

          {/* Platform Breakdown */}
          {platformPieData.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 300 }}
              style={styles.chartContainer}
            >
              <Text style={styles.chartTitle}>Platform Distribution</Text>
              <PieChart
                data={platformPieData}
                width={SCREEN_WIDTH - 48}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 10]}
                absolute
                style={styles.chart}
              />
            </MotiView>
          )}

          {/* Performance Metrics */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 400 }}
            style={styles.performanceContainer}
          >
            <Text style={styles.sectionTitle}>Performance Metrics</Text>

            <View style={styles.performanceGrid}>
              <View style={styles.performanceCard}>
                <LinearGradient
                  colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.1)']}
                  style={styles.performanceGradient}
                >
                  <CheckCircle size={20} color="#10B981" />
                  <Text style={styles.performanceValue}>
                    {(analytics.performanceMetrics.successRate * 100).toFixed(1)}%
                  </Text>
                  <Text style={styles.performanceLabel}>Success Rate</Text>
                </LinearGradient>
              </View>

              <View style={styles.performanceCard}>
                <LinearGradient
                  colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.1)']}
                  style={styles.performanceGradient}
                >
                  <Zap size={20} color="#F59E0B" />
                  <Text style={styles.performanceValue}>
                    {analytics.performanceMetrics.avgLoadTime.toFixed(1)}s
                  </Text>
                  <Text style={styles.performanceLabel}>Avg Load Time</Text>
                </LinearGradient>
              </View>

              <View style={styles.performanceCard}>
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.1)']}
                  style={styles.performanceGradient}
                >
                  <Gauge size={20} color="#8B5CF6" />
                  <Text style={styles.performanceValue}>
                    {formatBytes(analytics.performanceMetrics.bandwidthUsage * 1024 * 1024)}
                  </Text>
                  <Text style={styles.performanceLabel}>Bandwidth</Text>
                </LinearGradient>
              </View>

              <View style={styles.performanceCard}>
                <LinearGradient
                  colors={['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.1)']}
                  style={styles.performanceGradient}
                >
                  <AlertTriangle size={20} color="#EF4444" />
                  <Text style={styles.performanceValue}>{analytics.errorCount}</Text>
                  <Text style={styles.performanceLabel}>Errors</Text>
                </LinearGradient>
              </View>
            </View>
          </MotiView>

          {/* Device & Connection Breakdown */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 500 }}
            style={styles.breakdownContainer}
          >
            <Text style={styles.sectionTitle}>Audience Breakdown</Text>

            <View style={styles.breakdownGrid}>
              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>Devices</Text>
                <View style={styles.breakdownItems}>
                  <View style={styles.breakdownItem}>
                    <Smartphone size={16} color="#8B5CF6" />
                    <Text style={styles.breakdownLabel}>Mobile</Text>
                    <Text style={styles.breakdownValue}>
                      {formatNumber(analytics.deviceBreakdown.mobile)}
                    </Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Video size={16} color="#10B981" />
                    <Text style={styles.breakdownLabel}>Desktop</Text>
                    <Text style={styles.breakdownValue}>
                      {formatNumber(analytics.deviceBreakdown.desktop)}
                    </Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Globe size={16} color="#F59E0B" />
                    <Text style={styles.breakdownLabel}>Tablet</Text>
                    <Text style={styles.breakdownValue}>
                      {formatNumber(analytics.deviceBreakdown.tablet)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>Connection</Text>
                <View style={styles.breakdownItems}>
                  <View style={styles.breakdownItem}>
                    <Wifi size={16} color="#10B981" />
                    <Text style={styles.breakdownLabel}>WiFi</Text>
                    <Text style={styles.breakdownValue}>
                      {formatNumber(analytics.connectionTypes.wifi)}
                    </Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Smartphone size={16} color="#F59E0B" />
                    <Text style={styles.breakdownLabel}>Cellular</Text>
                    <Text style={styles.breakdownValue}>
                      {formatNumber(analytics.connectionTypes.cellular)}
                    </Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Globe size={16} color="#8B5CF6" />
                    <Text style={styles.breakdownLabel}>Ethernet</Text>
                    <Text style={styles.breakdownValue}>
                      {formatNumber(analytics.connectionTypes.ethernet)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </MotiView>

          {/* Real-time Toggle */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 600 }}
            style={styles.realTimeToggle}
          >
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setRealTimeData(!realTimeData)}
            >
              <View
                style={[styles.toggleIndicator, realTimeData && styles.toggleIndicatorActive]}
              />
              <Text style={styles.toggleText}>Real-time Updates</Text>
            </TouchableOpacity>
          </MotiView>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: ModernTheme.colors.text.primary,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EF4444',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: ModernTheme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 8,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    flex: 1,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: ModernTheme.colors.primary[500],
  },
  timeRangeText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  timeRangeTextActive: {
    color: ModernTheme.colors.text.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  metricGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ModernTheme.colors.text.primary,
    marginBottom: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartLegendText: {
    fontSize: 12,
    color: ModernTheme.colors.text.secondary,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ModernTheme.colors.text.primary,
    marginBottom: 16,
  },
  performanceContainer: {
    marginBottom: 24,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  performanceCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  performanceGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: ModernTheme.colors.text.primary,
  },
  performanceLabel: {
    fontSize: 12,
    color: ModernTheme.colors.text.secondary,
    textAlign: 'center',
  },
  breakdownContainer: {
    marginBottom: 24,
  },
  breakdownGrid: {
    gap: 16,
  },
  breakdownSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ModernTheme.colors.text.primary,
    marginBottom: 12,
  },
  breakdownItems: {
    gap: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 14,
    color: ModernTheme.colors.text.secondary,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: ModernTheme.colors.text.primary,
  },
  realTimeToggle: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
  },
  toggleIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  toggleIndicatorActive: {
    backgroundColor: '#10B981',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: ModernTheme.colors.text.primary,
  },
});

export default StreamAnalyticsDashboard;
