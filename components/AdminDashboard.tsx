import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BarChart3,
  Users,
  Shield,
  Activity,
  TrendingUp,
  AlertTriangle,
  Settings,
  Database,
  Eye,
  MessageSquare,
  Calendar,
  DollarSign,
  Globe,
  Zap,
  ChevronRight,
  Plus,
  Filter,
  Download,
  RefreshCw,
  Bell,
  Search,
  MoreHorizontal,
} from 'lucide-react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { ModernTheme } from '@/theme/modernTheme';
import { contentModerationService, ModerationDashboard } from '@/services/contentModerationService';
import { enterpriseAnalyticsService, BusinessIntelligenceReport } from '@/services/enterpriseAnalyticsService';
import { enterpriseAuthService, EnterpriseUser } from '@/services/enterpriseAuthService';
import { streamManagementService } from '@/services/streamManagementService';

const { width: screenWidth } = Dimensions.get('window');

interface AdminDashboardProps {
  organizationId: string;
  currentUser: EnterpriseUser;
  onNavigate: (screen: string, params?: any) => void;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalStreams: number;
  liveStreams: number;
  totalRevenue: number;
  moderationCases: number;
  systemHealth: 'healthy' | 'degraded' | 'down';
  lastUpdated: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  organizationId,
  currentUser,
  onNavigate,
}) => {
  // State management
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [moderationData, setModerationData] = useState<ModerationDashboard | null>(null);
  const [recentReports, setRecentReports] = useState<BusinessIntelligenceReport[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load system stats
      const systemStats = await enterpriseAuthService.getSystemStats();

      // Load moderation dashboard
      const moderationDashboard = await contentModerationService.getModerationDashboard(
        organizationId,
        selectedTimeRange

      // Load recent reports
      const reports = await enterpriseAnalyticsService.getBusinessIntelligenceReports(
        organizationId,
        {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
      );

      // Mock system health check
      const healthCheck = await enterpriseAuthService.healthCheck();

      setStats({
        totalUsers: systemStats.totalUsers,
        activeUsers: systemStats.activeUsers,
        totalStreams: systemStats.totalUsers * 2, // Mock calculation
        liveStreams: Math.floor(systemStats.activeUsers * 0.1), // Mock calculation
        totalRevenue: systemStats.totalUsers * 50, // Mock calculation
        moderationCases: moderationDashboard.pendingCases,
        systemHealth: healthCheck.status,
        lastUpdated: new Date().toISOString(),
      });

      setModerationData(moderationDashboard);
      setRecentReports(reports.slice(0, 5));

      // Mock alerts
      setAlerts([
        {
          id: '1',
          type: 'warning',
          message: 'High moderation queue volume',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'info',
          message: 'Weekly report generated',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        },
      ]);
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, selectedTimeRange]);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Navigation handlers
  const handleNavigateToUsers = () => onNavigate('UserManagement');
  const handleNavigateToModeration = () => onNavigate('ContentModeration');
  const handleNavigateToAnalytics = () => onNavigate('Analytics');
  const handleNavigateToStreams = () => onNavigate('StreamManagement');
  const handleNavigateToSettings = () => onNavigate('Settings');

  // Render loading state
  if (isLoading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ModernTheme.colors.primary[500]} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // Render stat card
  const renderStatCard = (
    title: string,
    value: string | number,
    icon: React.ComponentType<any>,
    color: string,
    change?: string
  ) => (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 300 }}
      style={styles.statCard}
    >
      <LinearGradient colors={ModernTheme.colors.gradients.card} style={styles.statCardGradient}>
        <View style={styles.statCardContent}>
          <View style={styles.statCardHeader}>
            <View style={[styles.statIcon, { backgroundColor: color }]}>
              {React.createElement(icon, { size: 20, color: ModernTheme.colors.text.primary })}
            </View>
            <Text style={styles.statTitle}>{title}</Text>
          </View>
          <Text style={styles.statValue}>{value}</Text>
          {change && (
            <Text
              style={[
                styles.statChange,
                {
                  color: change.startsWith('+')
                    ? ModernTheme.colors.success[500]
                    : ModernTheme.colors.error[500],
                },
              ]}
            >
              {change}
            </Text>
          )}
        </View>
      </LinearGradient>
    </MotiView>
  );

  // Render quick action
  const renderQuickAction = (
    title: string,
    icon: React.ComponentType<any>,
    onPress: () => void
  ) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient colors={ModernTheme.colors.gradients.card} style={styles.quickActionGradient}>
        <View style={styles.quickActionIcon}>
          <LinearGradient
            colors={ModernTheme.colors.gradients.primary}
            style={styles.quickActionIconGradient}
          >
            {React.createElement(icon, { size: 20, color: ModernTheme.colors.text.primary })}
          </LinearGradient>
        </View>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <ChevronRight size={16} color={ModernTheme.colors.text.secondary} />
      </LinearGradient>
    </TouchableOpacity>
  );

  // Render recent report item
  const renderRecentReport = (report: BusinessIntelligenceReport) => (
    <TouchableOpacity
      key={report.id}
      style={styles.reportItem}
      onPress={() => onNavigate('ReportDetail', { reportId: report.id })}
      activeOpacity={0.7}
    >
      <View style={styles.reportItemContent}>
        <View style={styles.reportItemHeader}>
          <Text style={styles.reportItemTitle}>{report.name}</Text>
          <Text style={styles.reportItemDate}>
            {new Date(report.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.reportItemType}>{report.type}</Text>
        <View style={styles.reportItemStats}>
          <Text style={styles.reportItemStat}>{report.metrics.length} metrics</Text>
          <Text style={styles.reportItemStat}>{report.insights.length} insights</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render alert item
  const renderAlert = (alert: any) => (
    <View key={alert.id} style={styles.alertItem}>
      <View
        style={[
          styles.alertIcon,
          {
            backgroundColor:
              alert.type === 'warning'
                ? ModernTheme.colors.warning[500]
                : ModernTheme.colors.info[500],
          },
        ]}
      >
        <AlertTriangle size={16} color={ModernTheme.colors.text.primary} />
      </View>
      <View style={styles.alertContent}>
        <Text style={styles.alertMessage}>{alert.message}</Text>
        <Text style={styles.alertTime}>{new Date(alert.timestamp).toLocaleTimeString()}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[ModernTheme.colors.primary[500]]}
          tintColor={ModernTheme.colors.primary[500]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>Welcome back, {currentUser.name}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerAction}
              onPress={() => onNavigate('Notifications')}
            >
              <Bell size={20} color={ModernTheme.colors.text.primary} />
              {alerts.length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{alerts.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAction} onPress={() => onNavigate('Search')}>
              <Search size={20} color={ModernTheme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['24h', '7d', '30d', '90d'] as const).map(range => (
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
                  styles.timeRangeButtonText,
                  selectedTimeRange === range && styles.timeRangeButtonTextActive,
                ]}
              >
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {renderStatCard(
          'Total Users',
          stats?.totalUsers.toLocaleString() || '0',
          Users,
          ModernTheme.colors.primary[500],
          '+12%'
        )}
        {renderStatCard(
          'Active Users',
          stats?.activeUsers.toLocaleString() || '0',
          Activity,
          ModernTheme.colors.success[500],
          '+8%'
        )}
        {renderStatCard(
          'Live Streams',
          stats?.liveStreams.toLocaleString() || '0',
          Zap,
          ModernTheme.colors.warning[500],
          '+15%'
        )}
        {renderStatCard(
          'Revenue',
          `$${stats?.totalRevenue.toLocaleString() || '0'}`,
          DollarSign,
          ModernTheme.colors.info[500],
          '+22%'
        )}
      </View>

      {/* System Health */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300 }}
        style={styles.systemHealthCard}
      >
        <LinearGradient
          colors={ModernTheme.colors.gradients.card}
          style={styles.systemHealthGradient}
        >
          <View style={styles.systemHealthContent}>
            <View style={styles.systemHealthHeader}>
              <Text style={styles.systemHealthTitle}>System Health</Text>
              <View
                style={[
                  styles.systemHealthStatus,
                  {
                    backgroundColor:
                      stats?.systemHealth === 'healthy'
                        ? ModernTheme.colors.success[500]
                        : ModernTheme.colors.warning[500],
                  },
                ]}
              >
                <Text style={styles.systemHealthStatusText}>
                  {stats?.systemHealth || 'Unknown'}
                </Text>
              </View>
            </View>
            <Text style={styles.systemHealthTime}>
              Last updated:{' '}
              {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : 'Never'}
            </Text>
          </View>
        </LinearGradient>
      </MotiView>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {renderQuickAction('User Management', Users, handleNavigateToUsers)}
          {renderQuickAction('Content Moderation', Shield, handleNavigateToModeration)}
          {renderQuickAction('Analytics', BarChart3, handleNavigateToAnalytics)}
          {renderQuickAction('Stream Management', Globe, handleNavigateToStreams)}
          {renderQuickAction('System Settings', Settings, handleNavigateToSettings)}
          {renderQuickAction('Database', Database, () => onNavigate('Database'))}
        </View>
      </View>

      {/* Moderation Overview */}
      {moderationData && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Moderation Overview</Text>
            <TouchableOpacity style={styles.sectionAction} onPress={handleNavigateToModeration}>
              <Text style={styles.sectionActionText}>View All</Text>
              <ChevronRight size={16} color={ModernTheme.colors.primary[500]} />
            </TouchableOpacity>
          </View>
          <View style={styles.moderationGrid}>
            <View style={styles.moderationCard}>
              <Text style={styles.moderationCardValue}>{moderationData.pendingCases}</Text>
              <Text style={styles.moderationCardLabel}>Pending Cases</Text>
            </View>
            <View style={styles.moderationCard}>
              <Text style={styles.moderationCardValue}>{moderationData.resolvedCases}</Text>
              <Text style={styles.moderationCardLabel}>Resolved Today</Text>
            </View>
            <View style={styles.moderationCard}>
              <Text style={styles.moderationCardValue}>
                {Math.round(moderationData.accuracyScore * 100)}%
              </Text>
              <Text style={styles.moderationCardLabel}>Accuracy</Text>
            </View>
          </View>
        </View>
      )}

      {/* Recent Reports */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          <TouchableOpacity style={styles.sectionAction} onPress={() => onNavigate('Reports')}>
            <Text style={styles.sectionActionText}>View All</Text>
            <ChevronRight size={16} color={ModernTheme.colors.primary[500]} />
          </TouchableOpacity>
        </View>
        <View style={styles.reportsList}>{recentReports.map(renderRecentReport)}</View>
      </View>

      {/* System Alerts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>System Alerts</Text>
          <TouchableOpacity style={styles.sectionAction} onPress={() => onNavigate('Alerts')}>
            <Text style={styles.sectionActionText}>View All</Text>
            <ChevronRight size={16} color={ModernTheme.colors.primary[500]} />
          </TouchableOpacity>
        </View>
        <View style={styles.alertsList}>{alerts.map(renderAlert)}</View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernTheme.colors.background.primary,
  },
  contentContainer: {
    paddingBottom: ModernTheme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ModernTheme.colors.background.primary,
  },
  loadingText: {
    fontSize: ModernTheme.typography.sizes.md,
    color: ModernTheme.colors.text.secondary,
    marginTop: ModernTheme.spacing.md,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: ModernTheme.spacing.md,
    paddingBottom: ModernTheme.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: ModernTheme.typography.sizes.xxl,
    fontWeight: ModernTheme.typography.weights.bold,
    color: ModernTheme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: ModernTheme.typography.sizes.md,
    color: ModernTheme.colors.text.secondary,
    marginTop: ModernTheme.spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ModernTheme.colors.error[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: ModernTheme.colors.text.primary,
  },
  timeRangeSelector: {
    paddingHorizontal: ModernTheme.spacing.md,
    marginBottom: ModernTheme.spacing.md,
  },
  timeRangeButton: {
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    borderRadius: ModernTheme.borderRadius.md,
    marginRight: ModernTheme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeRangeButtonActive: {
    backgroundColor: ModernTheme.colors.primary[500],
  },
  timeRangeButtonText: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  timeRangeButtonTextActive: {
    color: ModernTheme.colors.text.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: ModernTheme.spacing.md,
    gap: ModernTheme.spacing.sm,
  },
  statCard: {
    width: (screenWidth - ModernTheme.spacing.md * 2 - ModernTheme.spacing.sm) / 2,
    marginBottom: ModernTheme.spacing.sm,
  },
  statCardGradient: {
    borderRadius: ModernTheme.borderRadius.lg,
    padding: ModernTheme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statCardContent: {
    alignItems: 'flex-start',
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ModernTheme.spacing.sm,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ModernTheme.spacing.sm,
  },
  statTitle: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  statValue: {
    fontSize: ModernTheme.typography.sizes.xl,
    fontWeight: ModernTheme.typography.weights.bold,
    color: ModernTheme.colors.text.primary,
    marginBottom: ModernTheme.spacing.xs,
  },
  statChange: {
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  systemHealthCard: {
    marginHorizontal: ModernTheme.spacing.md,
    marginBottom: ModernTheme.spacing.md,
  },
  systemHealthGradient: {
    borderRadius: ModernTheme.borderRadius.lg,
    padding: ModernTheme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  systemHealthContent: {
    flex: 1,
  },
  systemHealthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ModernTheme.spacing.xs,
  },
  systemHealthTitle: {
    fontSize: ModernTheme.typography.sizes.lg,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.primary,
  },
  systemHealthStatus: {
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
  },
  systemHealthStatusText: {
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.medium,
    color: ModernTheme.colors.text.primary,
    textTransform: 'capitalize',
  },
  systemHealthTime: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
  },
  section: {
    marginTop: ModernTheme.spacing.lg,
    paddingHorizontal: ModernTheme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ModernTheme.spacing.md,
  },
  sectionTitle: {
    fontSize: ModernTheme.typography.sizes.lg,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.primary,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.xs,
  },
  sectionActionText: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.primary[500],
    fontWeight: ModernTheme.typography.weights.medium,
  },
  quickActionsGrid: {
    gap: ModernTheme.spacing.sm,
  },
  quickAction: {
    marginBottom: ModernTheme.spacing.sm,
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ModernTheme.spacing.md,
    borderRadius: ModernTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickActionIcon: {
    borderRadius: ModernTheme.borderRadius.sm,
    overflow: 'hidden',
    marginRight: ModernTheme.spacing.md,
  },
  quickActionIconGradient: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionTitle: {
    flex: 1,
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.medium,
    color: ModernTheme.colors.text.primary,
  },
  moderationGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: ModernTheme.spacing.sm,
  },
  moderationCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  moderationCardValue: {
    fontSize: ModernTheme.typography.sizes.xl,
    fontWeight: ModernTheme.typography.weights.bold,
    color: ModernTheme.colors.text.primary,
    marginBottom: ModernTheme.spacing.xs,
  },
  moderationCardLabel: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
    textAlign: 'center',
  },
  reportsList: {
    gap: ModernTheme.spacing.sm,
  },
  reportItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  reportItemContent: {
    flex: 1,
  },
  reportItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ModernTheme.spacing.xs,
  },
  reportItemTitle: {
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.medium,
    color: ModernTheme.colors.text.primary,
    flex: 1,
  },
  reportItemDate: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
  },
  reportItemType: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.primary[500],
    marginBottom: ModernTheme.spacing.xs,
    textTransform: 'capitalize',
  },
  reportItemStats: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.md,
  },
  reportItemStat: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
  },
  alertsList: {
    gap: ModernTheme.spacing.sm,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ModernTheme.spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: ModernTheme.typography.sizes.md,
    color: ModernTheme.colors.text.primary,
    marginBottom: ModernTheme.spacing.xs,
  },
  alertTime: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
  },
});

export default AdminDashboard;
