import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, MotiText } from 'moti';
import { BlurViewFallback as BlurView } from './BlurViewFallback';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Heart,
  Calendar,
  Settings,
  Plus,
  Edit3,
  Move,
  Trash2,
  Eye,
  Zap,
  Star,
  Bell,
  Share2,
  Activity,
  Award,
  Target,
  Smartphone,
  Monitor,
  RefreshCw,
  Filter,
  Download,
  Upload,
  Maximize2,
  Minimize2,
} from 'lucide-react-native';
import React, { useState, useEffect, useRef } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { socialService, getUserProfile } from '@/services/socialService';
import { schedulingService, getUpcomingStreams } from '@/services/schedulingService';
import { platformService, fetchPlatformStats } from '@/services/platformService';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsService, getStreamAnalytics, getViewerAnalytics, getTrendingMetrics } from '@/services/analyticsService';
import { useAppStore } from '@/store/useAppStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface DashboardWidget {
  id: string;
  type:
    | 'analytics'
    | 'trending'
    | 'schedule'
    | 'social'
    | 'quick_stats'
    | 'platform_comparison'
    | 'recent_activity'
    | 'recommendations'
    | 'custom';
  title: string;
  subtitle?: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: { x: number; y: number };
  isVisible: boolean;
  refreshInterval?: number; // in seconds
  settings: Record<string, any>;
  data?: any;
  lastUpdated?: string;
  customComponent?: React.ComponentType<any>;
}

export interface DashboardLayout {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  isDefault: boolean;
  device: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
  createdAt: string;
  updatedAt: string;
}

const widgetSizes = {
  small: { width: SCREEN_WIDTH * 0.45, height: 120 },
  medium: { width: SCREEN_WIDTH * 0.45, height: 180 },
  large: { width: SCREEN_WIDTH * 0.95, height: 200 },
  full: { width: SCREEN_WIDTH * 0.95, height: 300 },
};

const defaultWidgets: DashboardWidget[] = [
  {
    id: 'viewer_stats',
    type: 'analytics',
    title: 'Viewer Analytics',
    size: 'medium',
    position: { x: 0, y: 0 },
    isVisible: true,
    refreshInterval: 300,
    settings: { showChart: true, timeRange: '24h' },
  },
  {
    id: 'trending_streams',
    type: 'trending',
    title: 'Trending Now',
    size: 'medium',
    position: { x: 1, y: 0 },
    isVisible: true,
    refreshInterval: 180,
    settings: { limit: 5, platform: 'all' },
  },
  {
    id: 'upcoming_schedule',
    type: 'schedule',
    title: 'Upcoming Streams',
    size: 'large',
    position: { x: 0, y: 1 },
    isVisible: true,
    refreshInterval: 600,
    settings: { limit: 3, showReminders: true },
  },
  {
    id: 'platform_stats',
    type: 'platform_comparison',
    title: 'Platform Overview',
    size: 'large',
    position: { x: 0, y: 2 },
    isVisible: true,
    refreshInterval: 900,
    settings: { showGrowth: true, platforms: ['twitch', 'youtube', 'kick'] },
  },
  {
    id: 'social_activity',
    type: 'social',
    title: 'Social Activity',
    size: 'small',
    position: { x: 0, y: 3 },
    isVisible: true,
    refreshInterval: 240,
    settings: { showLikes: true, showShares: true, showComments: true },
  },
  {
    id: 'quick_actions',
    type: 'quick_stats',
    title: 'Quick Stats',
    size: 'small',
    position: { x: 1, y: 3 },
    isVisible: true,
    refreshInterval: 120,
    settings: { metrics: ['followers', 'watch_time', 'streams_watched'] },
  },
];

interface CustomizableDashboardProps {
  initialLayout?: DashboardLayout;
  onLayoutChange?: (layout: DashboardLayout) => void;
  editMode?: boolean;
}

export const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({
  initialLayout,
  onLayoutChange,
  editMode: initialEditMode = false,
}) => {
  const { user } = useAuth();
  const { settings } = useAppStore();

  const [widgets, setWidgets] = useState<DashboardWidget[]>(defaultWidgets);
  const [editMode, setEditMode] = useState(initialEditMode);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [layoutName, setLayoutName] = useState('Default Layout');

  const gridSize = 10;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (initialLayout) {
      setWidgets(initialLayout.widgets);
      setLayoutName(initialLayout.name);
    }
  }, [initialLayout]);

  useEffect(() => {
    if (!editMode) {
      refreshAllWidgets();

      // Set up auto-refresh
      const interval = setInterval(() => {
        refreshAllWidgets();
      }, 60000); // Refresh every minute

      return () => clearInterval(interval);
    }
  }, [editMode]);

  const refreshAllWidgets = async () => {
    if (!user?.id) {return;}

    try {
      setRefreshing(true);

      const updatedWidgets = await Promise.all(
        widgets.map(async widget => {
          const shouldRefresh =
            widget.refreshInterval &&
            (!widget.lastUpdated ||
              Date.now() - new Date(widget.lastUpdated).getTime() > widget.refreshInterval * 1000);

          if (shouldRefresh) {
            const data = await fetchWidgetData(widget, user.id);
            return {
              ...widget,
              data,
              lastUpdated: new Date().toISOString(),
            };
          }

          return widget;
        })
      );

      setWidgets(updatedWidgets);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh widgets:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchWidgetData = async (widget: DashboardWidget, userId: string): Promise<any> => {
    try {
      switch (widget.type) {
        case 'analytics':
          return await getViewerAnalytics(userId);

        case 'trending':
          return await getTrendingMetrics('stream', '24h');

        case 'schedule':
          return await getUpcomingStreams(widget.settings.limit || 5);

        case 'platform_comparison':
          return await fetchPlatformStats();

        case 'social':
          const profile = await getUserProfile(userId);
          return {
            followers: profile?.stats.followersCount || 0,
            following: profile?.stats.followingCount || 0,
            posts: 0, // Would come from social service
            likes: 0, // Would come from social service
          };

        case 'quick_stats':
          const analytics = await getViewerAnalytics(userId);
          return {
            totalWatchTime: analytics?.totalWatchTime || 0,
            streamsWatched: analytics?.streamsWatched || 0,
            favoriteStreamers: analytics?.favoriteStreamers.length || 0,
          };

        default:
          return null;
      }
    } catch (error) {
      console.error(`Failed to fetch data for widget ${widget.id}:`, error);
      return null;
    }
  };

  const moveWidget = (widgetId: string, newPosition: { x: number; y: number }) => {
    setWidgets(prev =>
      prev.map(widget =>
        widget.id === widgetId
          ? { ...widget, position: newPosition }
          : widget
      )
    );
  };

  const resizeWidget = (widgetId: string, newSize: DashboardWidget['size']) => {
    setWidgets(prev =>
      prev.map(widget =>
        widget.id === widgetId
          ? { ...widget, size: newSize }
          : widget
      )
    );
  };

  const toggleWidget = (widgetId: string) => {
    setWidgets(prev =>
      prev.map(widget =>
        widget.id === widgetId
          ? { ...widget, isVisible: !widget.isVisible }
          : widget
      )
    );
  };

  const removeWidget = (widgetId: string) => {
    Alert.alert('Remove Widget', 'Are you sure you want to remove this widget?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setWidgets(prev => prev.filter(w => w.id !== widgetId));
        },
      },
    ]);
  };

  const addWidget = (widgetType: DashboardWidget['type']) => {
    const newWidget: DashboardWidget = {
      id: `widget_${Date.now()}`,
      type: widgetType,
      title: `New ${widgetType} Widget`,
      size: 'medium',
      position: { x: 0, y: Math.max(...widgets.map(w => w.position.y)) + 1 },
      isVisible: true,
      settings: {},
    };

    setWidgets(prev => [...prev, newWidget]);
    setShowWidgetPicker(false);
  };

  const saveLayout = () => {
    const layout: DashboardLayout = {
      id: Date.now().toString(),
      name: layoutName,
      description: `Custom dashboard layout with ${widgets.length} widgets`,
      widgets,
      isDefault: false,
      device: Platform.OS === 'ios' || Platform.OS === 'android' ? 'mobile' : 'desktop',
      orientation: SCREEN_WIDTH > SCREEN_HEIGHT ? 'landscape' : 'portrait',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onLayoutChange?.(layout);
    setEditMode(false);
  };

  const renderWidget = (widget: DashboardWidget) => {
    if (!widget.isVisible) {return null;}

    const size = widgetSizes[widget.size];

    return (
      <DraggableWidget
        key={widget.id}
        widget={widget}
        size={size}
        editMode={editMode}
        selected={selectedWidget === widget.id}
        onSelect={() => setSelectedWidget(widget.id)}
        onMove={moveWidget}
        onResize={resizeWidget}
        onRemove={() => removeWidget(widget.id)}
      >
        <WidgetContent widget={widget} />
      </DraggableWidget>
    );
  };

  const renderEditToolbar = () => {
    if (!editMode) {return null;}

    return (
      <BlurView style={styles.editToolbar} blurType="dark" blurAmount={20}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarContent}
        >
          <TouchableOpacity style={styles.toolbarButton} onPress={() => setShowWidgetPicker(true)}>
            <Plus size={20} color="#8B5CF6" />
            <Text style={styles.toolbarButtonText}>Add Widget</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolbarButton} onPress={() => setEditMode(false)}>
            <Eye size={20} color="#22C55E" />
            <Text style={styles.toolbarButtonText}>Preview</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolbarButton} onPress={saveLayout}>
            <Download size={20} color="#3B82F6" />
            <Text style={styles.toolbarButtonText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => {
              Alert.alert(
                'Reset Layout',
                'Reset to default layout? This will remove all customizations.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => setWidgets(defaultWidgets),
                  },
                ]
              );
            }}
          >
            <RefreshCw size={20} color="#EF4444" />
            <Text style={styles.toolbarButtonText}>Reset</Text>
          </TouchableOpacity>
        </ScrollView>
      </BlurView>
    );
  };

  const renderWidgetPicker = () => {
    const widgetTypes = [
      {
        type: 'analytics',
        title: 'Analytics',
        icon: BarChart3,
        description: 'View detailed analytics',
      },
      {
        type: 'trending',
        title: 'Trending',
        icon: TrendingUp,
        description: 'See trending content',
      },
      { type: 'schedule', title: 'Schedule', icon: Calendar, description: 'Upcoming streams' },
      { type: 'social', title: 'Social', icon: Users, description: 'Social activity' },
      {
        type: 'quick_stats',
        title: 'Quick Stats',
        icon: Zap,
        description: 'Key metrics at a glance',
      },
      {
        type: 'platform_comparison',
        title: 'Platforms',
        icon: Monitor,
        description: 'Compare platforms',
      },

    return (
      <Modal
        visible={showWidgetPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWidgetPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView style={styles.widgetPickerModal} blurType="dark" blurAmount={20}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Widget</Text>
              <TouchableOpacity onPress={() => setShowWidgetPicker(false)}>
                <Trash2 size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.widgetTypesList}>
              {widgetTypes.map(type => (
                <TouchableOpacity
                  key={type.type}
                  style={styles.widgetTypeItem}
                  onPress={() => addWidget(type.type as DashboardWidget['type'])}
                >
                  <type.icon size={24} color="#8B5CF6" />
                  <View style={styles.widgetTypeInfo}>
                    <Text style={styles.widgetTypeTitle}>{type.title}</Text>
                    <Text style={styles.widgetTypeDescription}>{type.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </BlurView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a0a', '#1a1a1a', '#0f0f0f']} style={styles.background} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{layoutName}</Text>
            <Text style={styles.headerSubtitle}>
              Last updated: {lastRefresh.toLocaleTimeString()}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={refreshAllWidgets}
              disabled={refreshing}
            >
              <RefreshCw
                size={20}
                color={refreshing ? '#666' : '#8B5CF6'}
                style={refreshing ? { transform: [{ rotate: '180deg' }] } : {}}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerButton, editMode && styles.headerButtonActive]}
              onPress={() => setEditMode(!editMode)}
            >
              <Edit3 size={20} color={editMode ? '#fff' : '#8B5CF6'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dashboard Content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.dashboardContainer}
          contentContainerStyle={styles.dashboardContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.widgetsGrid}>{widgets.map(renderWidget)}</View>
        </ScrollView>

        {/* Edit Toolbar */}
        {renderEditToolbar()}

        {/* Widget Picker Modal */}
        {renderWidgetPicker()}
      </SafeAreaView>
    </View>
  );
};

// Draggable Widget Component
interface DraggableWidgetProps {
  widget: DashboardWidget;
  size: { width: number; height: number };
  editMode: boolean;
  selected: boolean;
  onSelect: () => void;
  onMove: (widgetId: string, position: { x: number; y: number }) => void;
  onResize: (widgetId: string, size: DashboardWidget['size']) => void;
  onRemove: () => void;
  children: React.ReactNode;
}

const DraggableWidget: React.FC<DraggableWidgetProps> = ({
  widget,
  size,
  editMode,
  selected,
  onSelect,
  onMove,
  onResize,
  onRemove,
  children,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      if (editMode) {
        context.startX = translateX.value;
        context.startY = translateY.value;
        scale.value = withSpring(1.05);
        runOnJS(onSelect)();
      }
    },
    onActive: (event, context: any) => {
      if (editMode) {
        translateX.value = context.startX + event.translationX;
        translateY.value = context.startY + event.translationY;
      }
    },
    onEnd: () => {
      if (editMode) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <PanGestureHandler onGestureEvent={gestureHandler} enabled={editMode}>
      <Animated.View
        style={[
          styles.widget,
          {
            width: size.width,
            height: size.height,
            left: widget.position.x * (SCREEN_WIDTH * 0.5),
            top: widget.position.y * 200,
          },
          selected && editMode && styles.selectedWidget,
          animatedStyle,
        ]}
      >
        <BlurView style={styles.widgetContainer} blurType="dark" blurAmount={10}>
          {editMode && (
            <View style={styles.widgetEditOverlay}>
              <TouchableOpacity style={styles.widgetEditButton} onPress={onRemove}>
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.widgetEditButton}>
                <Settings size={16} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
          )}

          {children}
        </BlurView>
      </Animated.View>
    </PanGestureHandler>
  );
};

// Widget Content Component
interface WidgetContentProps {
  widget: DashboardWidget;
}

const WidgetContent: React.FC<WidgetContentProps> = ({ widget }) => {
  const renderContent = () => {
    switch (widget.type) {
      case 'analytics':
        return (
          <View style={styles.widgetContent}>
            <View style={styles.widgetHeader}>
              <BarChart3 size={20} color="#8B5CF6" />
              <Text style={styles.widgetTitle}>{widget.title}</Text>
            </View>
            <View style={styles.analyticsContent}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {widget.data?.totalWatchTime
                    ? `${Math.round(widget.data.totalWatchTime / 60)}h`
                    : '0h'}
                </Text>
                <Text style={styles.statLabel}>Watch Time</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{widget.data?.streamsWatched || 0}</Text>
                <Text style={styles.statLabel}>Streams</Text>
              </View>
            </View>
          </View>
        );

      case 'trending':
        return (
          <View style={styles.widgetContent}>
            <View style={styles.widgetHeader}>
              <TrendingUp size={20} color="#22C55E" />
              <Text style={styles.widgetTitle}>{widget.title}</Text>
            </View>
            <ScrollView style={styles.trendingList}>
              {(widget.data || []).slice(0, 3).map((item: any, index: number) => (
                <View key={index} style={styles.trendingItem}>
                  <Text style={styles.trendingName}>{item.name}</Text>
                  <Text style={styles.trendingScore}>#{index + 1}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        );

      case 'schedule':
        return (
          <View style={styles.widgetContent}>
            <View style={styles.widgetHeader}>
              <Calendar size={20} color="#F59E0B" />
              <Text style={styles.widgetTitle}>{widget.title}</Text>
            </View>
            <ScrollView style={styles.scheduleList}>
              {(widget.data || []).slice(0, 2).map((stream: any, index: number) => (
                <View key={index} style={styles.scheduleItem}>
                  <Text style={styles.scheduleTitle}>{stream.title}</Text>
                  <Text style={styles.scheduleTime}>
                    {new Date(stream.scheduledStartTime).toLocaleTimeString()}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        );

      case 'social':
        return (
          <View style={styles.widgetContent}>
            <View style={styles.widgetHeader}>
              <Users size={20} color="#3B82F6" />
              <Text style={styles.widgetTitle}>{widget.title}</Text>
            </View>
            <View style={styles.socialStats}>
              <View style={styles.socialStat}>
                <Text style={styles.socialValue}>{widget.data?.followers || 0}</Text>
                <Text style={styles.socialLabel}>Followers</Text>
              </View>
              <View style={styles.socialStat}>
                <Text style={styles.socialValue}>{widget.data?.following || 0}</Text>
                <Text style={styles.socialLabel}>Following</Text>
              </View>
            </View>
          </View>
        );

      case 'quick_stats':
        return (
          <View style={styles.widgetContent}>
            <View style={styles.widgetHeader}>
              <Zap size={20} color="#EF4444" />
              <Text style={styles.widgetTitle}>{widget.title}</Text>
            </View>
            <View style={styles.quickStats}>
              <Text style={styles.quickStatValue}>{widget.data?.favoriteStreamers || 0}</Text>
              <Text style={styles.quickStatLabel}>Favorites</Text>
            </View>
          </View>
        );

      case 'platform_comparison':
        return (
          <View style={styles.widgetContent}>
            <View style={styles.widgetHeader}>
              <Monitor size={20} color="#8B5CF6" />
              <Text style={styles.widgetTitle}>{widget.title}</Text>
            </View>
            <View style={styles.platformStats}>
              {(widget.data || []).map((platform: any, index: number) => (
                <View key={index} style={styles.platformStat}>
                  <Text style={styles.platformName}>{platform.platform}</Text>
                  <Text style={styles.platformValue}>{platform.totalStreams}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.widgetContent}>
            <Text style={styles.widgetTitle}>{widget.title}</Text>
            <Text style={styles.widgetPlaceholder}>Widget content</Text>
          </View>
        );
    }
  };

  return renderContent();
};

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
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  dashboardContainer: {
    flex: 1,
  },
  dashboardContent: {
    padding: 16,
    minHeight: SCREEN_HEIGHT,
  },
  widgetsGrid: {
    position: 'relative',
    minHeight: SCREEN_HEIGHT - 200,
  },
  widget: {
    position: 'absolute',
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectedWidget: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  widgetContainer: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  widgetEditOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  widgetEditButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetContent: {
    flex: 1,
    padding: 16,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  widgetTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  widgetPlaceholder: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
  analyticsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#666',
    fontSize: 10,
    marginTop: 2,
  },
  trendingList: {
    flex: 1,
  },
  trendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  trendingName: {
    color: '#fff',
    fontSize: 12,
  },
  trendingScore: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scheduleList: {
    flex: 1,
  },
  scheduleItem: {
    marginBottom: 8,
  },
  scheduleTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  scheduleTime: {
    color: '#F59E0B',
    fontSize: 10,
    marginTop: 2,
  },
  socialStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  socialStat: {
    alignItems: 'center',
  },
  socialValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  socialLabel: {
    color: '#666',
    fontSize: 10,
    marginTop: 2,
  },
  quickStats: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  quickStatValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  quickStatLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  platformStats: {
    gap: 8,
  },
  platformStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  platformValue: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: 'bold',
  },
  editToolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  toolbarContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  toolbarButton: {
    alignItems: 'center',
    gap: 4,
  },
  toolbarButtonText: {
    color: '#fff',
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  widgetPickerModal: {
    width: SCREEN_WIDTH * 0.9,
    maxHeight: SCREEN_HEIGHT * 0.7,
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  widgetTypesList: {
    flex: 1,
  },
  widgetTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
    gap: 16,
  },
  widgetTypeInfo: {
    flex: 1,
  },
  widgetTypeTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  widgetTypeDescription: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
});
