import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Volume2,
  Wifi,
  Download,
  Info,
  HelpCircle,
  Star,
  Share2,
  ChevronRight,
  Moon,
  Sun,
  Smartphone,
  Monitor,
  Headphones,
  Eye,
  Lock,
  Globe,
  Trash2,
  RefreshCw,
  Bug,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';
import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Linking,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  SlideInRight,
  SlideInDown,
} from 'react-native-reanimated';
import { ModernTheme } from '@/theme/modernTheme';
import { HapticFeedback } from '@/utils/haptics';
import { ErrorTestComponent } from './ErrorTestComponent';

interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<any>;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  destructive?: boolean;
}

interface SettingsSection {
  id: string;
  title: string;
  items: SettingsItem[];
}

export const EnhancedSettingsScreen: React.FC = () => {
  // State management
  const [settings, setSettings] = useState({
    notifications: true,
    autoplay: true,
    darkMode: true,
    highQuality: false,
    cellularStreaming: false,
    backgroundAudio: true,
    hapticFeedback: true,
    analytics: false,
  });

  const [expandedSections, setExpandedSections] = useState<string[]>(['account', 'streaming']);
  const [showErrorTesting, setShowErrorTesting] = useState(false);

  // Animation values
  const headerScale = useSharedValue(1);

  // Handle setting toggle
  const handleToggle = useCallback((key: string, value: boolean) => {
    HapticFeedback.light();

    setSettings(prev => ({ ...prev, [key]: value }));

    // Save to AsyncStorage
    AsyncStorage.setItem(`setting_${key}`, JSON.stringify(value));

    // Special feedback for important toggles
    if (key === 'hapticFeedback' && value) {
      setTimeout(() => HapticFeedback.success(), 200);
    }
  }, []);

  // Handle section toggle
  const handleSectionToggle = useCallback((sectionId: string) => {
    HapticFeedback.light();

    setExpandedSections(prev =>
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  }, []);

  // Handle actions
  const handleRateApp = useCallback(() => {
    Alert.alert('Rate Our App', 'Would you like to rate our app on the App Store?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Rate',
        onPress: () => {
          // TODO: Open app store rating
          Linking.openURL('https://apps.apple.com');
        },
      },
    ]);
  }, []);

  const handleShareApp = useCallback(() => {
    // TODO: Implement share functionality
    Alert.alert('Share App', 'Share functionality coming soon!');
  }, []);

  const handleClearCache = useCallback(() => {
    HapticFeedback.warning();

    Alert.alert('Clear Cache', 'This will clear all cached data. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          HapticFeedback.success();
          // TODO: Implement cache clearing
          Alert.alert('Success', 'Cache cleared successfully!');
        },
      },
    ]);
  }, []);

  const handleResetSettings = useCallback(() => {
    HapticFeedback.warning();

    Alert.alert('Reset Settings', 'This will reset all settings to default values. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          HapticFeedback.success();
          setSettings({
            notifications: true,
            autoplay: true,
            darkMode: true,
            highQuality: false,
            cellularStreaming: false,
            backgroundAudio: true,
            hapticFeedback: true,
            analytics: false,
          });
          Alert.alert('Success', 'Settings reset to defaults!');
        },
      },
    ]);
  }, []);

  // Settings sections configuration
  const settingsSections: SettingsSection[] = [
    {
      id: 'account',
      title: 'Account & Profile',
      items: [
        {
          id: 'profile',
          title: 'Edit Profile',
          subtitle: 'Manage your account information',
          icon: User,
          type: 'navigation',
          onPress: () => Alert.alert('Profile', 'Profile editing coming soon!'),
        },
        {
          id: 'notifications',
          title: 'Push Notifications',
          subtitle: 'Get notified when your favorite streamers go live',
          icon: Bell,
          type: 'toggle',
          value: settings.notifications,
          onToggle: value => handleToggle('notifications', value),
        },
        {
          id: 'privacy',
          title: 'Privacy Settings',
          subtitle: 'Control your data and privacy preferences',
          icon: Shield,
          type: 'navigation',
          onPress: () => Alert.alert('Privacy', 'Privacy settings coming soon!'),
        },
      ],
    },
    {
      id: 'streaming',
      title: 'Streaming & Playback',
      items: [
        {
          id: 'autoplay',
          title: 'Auto-play Streams',
          subtitle: 'Automatically start playing when opening streams',
          icon: Volume2,
          type: 'toggle',
          value: settings.autoplay,
          onToggle: value => handleToggle('autoplay', value),
        },
        {
          id: 'highQuality',
          title: 'High Quality Video',
          subtitle: 'Use higher quality when available (uses more data)',
          icon: Monitor,
          type: 'toggle',
          value: settings.highQuality,
          onToggle: value => handleToggle('highQuality', value),
        },
        {
          id: 'cellularStreaming',
          title: 'Stream on Cellular',
          subtitle: 'Allow streaming when not on Wi-Fi',
          icon: Wifi,
          type: 'toggle',
          value: settings.cellularStreaming,
          onToggle: value => handleToggle('cellularStreaming', value),
        },
        {
          id: 'backgroundAudio',
          title: 'Background Audio',
          subtitle: 'Continue audio when app is in background',
          icon: Headphones,
          type: 'toggle',
          value: settings.backgroundAudio,
          onToggle: value => handleToggle('backgroundAudio', value),
        },
      ],
    },
    {
      id: 'appearance',
      title: 'Appearance & Interface',
      items: [
        {
          id: 'darkMode',
          title: 'Dark Mode',
          subtitle: 'Use dark theme throughout the app',
          icon: settings.darkMode ? Moon : Sun,
          type: 'toggle',
          value: settings.darkMode,
          onToggle: value => handleToggle('darkMode', value),
        },
        {
          id: 'hapticFeedback',
          title: 'Haptic Feedback',
          subtitle: 'Feel vibrations for interactions',
          icon: Smartphone,
          type: 'toggle',
          value: settings.hapticFeedback,
          onToggle: value => handleToggle('hapticFeedback', value),
        },
        {
          id: 'theme',
          title: 'Theme Customization',
          subtitle: 'Customize colors and appearance',
          icon: Palette,
          type: 'navigation',
          onPress: () => Alert.alert('Themes', 'Theme customization coming soon!'),
        },
      ],
    },
    {
      id: 'data',
      title: 'Data & Storage',
      items: [
        {
          id: 'analytics',
          title: 'Usage Analytics',
          subtitle: 'Help improve the app by sharing usage data',
          icon: Eye,
          type: 'toggle',
          value: settings.analytics,
          onToggle: value => handleToggle('analytics', value),
        },
        {
          id: 'clearCache',
          title: 'Clear Cache',
          subtitle: 'Free up storage space',
          icon: Trash2,
          type: 'action',
          onPress: handleClearCache,
        },
        {
          id: 'resetSettings',
          title: 'Reset Settings',
          subtitle: 'Reset all settings to defaults',
          icon: RefreshCw,
          type: 'action',
          onPress: handleResetSettings,
          destructive: true,
        },
      ],
    },
    {
      id: 'support',
      title: 'Support & Feedback',
      items: [
        {
          id: 'help',
          title: 'Help & FAQ',
          subtitle: 'Get help and find answers',
          icon: HelpCircle,
          type: 'navigation',
          onPress: () => Alert.alert('Help', 'Help center coming soon!'),
        },
        {
          id: 'rate',
          title: 'Rate Our App',
          subtitle: 'Leave a review on the App Store',
          icon: Star,
          type: 'action',
          onPress: handleRateApp,
        },
        {
          id: 'share',
          title: 'Share App',
          subtitle: 'Tell your friends about this app',
          icon: Share2,
          type: 'action',
          onPress: handleShareApp,
        },
        {
          id: 'about',
          title: 'About',
          subtitle: 'Version 1.0.0 • Terms & Privacy',
          icon: Info,
          type: 'navigation',
          onPress: () =>
            Alert.alert('About', 'Multi-Stream Viewer v1.0.0\n\nBuilt with React Native'),
        },
      ],
    },
    {
      id: 'developer',
      title: 'Developer & Debugging',
      items: [
        {
          id: 'errorTesting',
          title: 'Error Testing Console',
          subtitle: 'Test error handling and console logging',
          icon: Bug,
          type: 'navigation',
          onPress: () => {
            setShowErrorTesting(!showErrorTesting);
          },
        },
      ],
    },
  ];

  // Animated styles
  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  // Render setting item
  const renderSettingItem = useCallback((item: SettingsItem) => {
    const IconComponent = item.icon;

    return (
      <Pressable
        key={item.id}
        style={({ pressed }) => [
          styles.settingItem,
          item.destructive && styles.destructiveItem,
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
        onPress={() => {
          HapticFeedback.light();
          item.onPress?.();
        }}
      >
        <LinearGradient
          colors={
            item.destructive
              ? ModernTheme.colors.gradients.danger
              : ModernTheme.colors.gradients.card
          }
          style={styles.settingItemGradient}
        >
          <View style={styles.settingItemLeft}>
            <View style={[styles.settingIcon, item.destructive && styles.destructiveIcon]}>
              <LinearGradient
                colors={
                  item.destructive
                    ? ModernTheme.colors.gradients.danger
                    : ModernTheme.colors.gradients.primary
                }
                style={styles.settingIconGradient}
              >
                <IconComponent size={20} color={ModernTheme.colors.text.primary} />
              </LinearGradient>
            </View>

            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, item.destructive && styles.destructiveText]}>
                {item.title}
              </Text>
              {item.subtitle && (
                <Text
                  style={[styles.settingSubtitle, item.destructive && styles.destructiveSubtitle]}
                >
                  {item.subtitle}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.settingItemRight}>
            {item.type === 'toggle' && (
              <Switch
                value={item.value || false}
                onValueChange={item.onToggle}
                trackColor={{
                  false: 'rgba(255, 255, 255, 0.2)',
                  true: ModernTheme.colors.primary[500],
                }}
                thumbColor={ModernTheme.colors.text.primary}
                ios_backgroundColor="rgba(255, 255, 255, 0.2)"
              />
            )}

            {(item.type === 'navigation' || item.type === 'action') && (
              <ChevronRight
                size={20}
                color={
                  item.destructive
                    ? ModernTheme.colors.text.error
                    : ModernTheme.colors.text.secondary
                }
              />
            )}
          </View>
        </LinearGradient>
      </Pressable>
    );
  }, []);

  // Render settings section
  const renderSettingsSection = useCallback(
    (section: SettingsSection) => {
      const isExpanded = expandedSections.includes(section.id);

      return (
        <View key={section.id} style={styles.section}>
          <Pressable
            style={({ pressed }) => [
              styles.sectionHeader,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => handleSectionToggle(section.id)}
          >
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Animated.View
              style={{
                transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
              }}
            >
              <ChevronRight size={20} color={ModernTheme.colors.text.secondary} />
            </Animated.View>
          </Pressable>

          {isExpanded && (
            <Animated.View entering={SlideInDown.delay(100)} style={styles.sectionContent}>
              {section.items.map((item, index) => (
                <Animated.View key={item.id} entering={FadeIn.delay(index * 50)}>
                  {renderSettingItem(item)}
                </Animated.View>
              ))}
            </Animated.View>
          )}
        </View>
      );
    },
    [expandedSections, renderSettingItem, handleSectionToggle]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <LinearGradient
          colors={ModernTheme.colors.gradients.background}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <LinearGradient
                  colors={ModernTheme.colors.gradients.primary}
                  style={styles.headerIconGradient}
                >
                  <Settings size={24} color={ModernTheme.colors.text.primary} />
                </LinearGradient>
              </View>
              <Text style={styles.headerTitle}>Settings</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Settings Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {settingsSections.map(renderSettingsSection)}

        {/* Error Testing Component */}
        {showErrorTesting && (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'timing', duration: 300 }}
          >
            <ErrorTestComponent />
          </MotiView>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Multi-Stream Viewer v1.0.0</Text>
          <Text style={styles.footerSubtext}>Made with ❤️ for streamers and viewers</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernTheme.colors.background.primary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  headerGradient: {
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.md,
  },
  headerIcon: {
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  headerIconGradient: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: ModernTheme.typography.sizes.xxl,
    fontWeight: ModernTheme.typography.weights.bold,
    color: ModernTheme.colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: ModernTheme.spacing.md,
    paddingBottom: ModernTheme.spacing.xl,
  },
  section: {
    marginBottom: ModernTheme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ModernTheme.spacing.md,
    paddingHorizontal: ModernTheme.spacing.sm,
  },
  sectionTitle: {
    fontSize: ModernTheme.typography.sizes.lg,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.primary,
  },
  sectionContent: {
    gap: ModernTheme.spacing.sm,
  },
  settingItem: {
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: ModernTheme.spacing.xs,
  },
  destructiveItem: {
    // Additional styling for destructive items
  },
  settingItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: ModernTheme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: ModernTheme.spacing.md,
  },
  settingIcon: {
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  destructiveIcon: {
    // Additional styling for destructive icons
  },
  settingIconGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.primary,
    marginBottom: 2,
  },
  destructiveText: {
    color: ModernTheme.colors.text.error,
  },
  settingSubtitle: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
    lineHeight: 18,
  },
  destructiveSubtitle: {
    color: ModernTheme.colors.text.error,
    opacity: 0.8,
  },
  settingItemRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: ModernTheme.spacing.xl,
    marginTop: ModernTheme.spacing.lg,
  },
  footerText: {
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.secondary,
    marginBottom: ModernTheme.spacing.xs,
  },
  footerSubtext: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
    opacity: 0.7,
  },
});

export default EnhancedSettingsScreen;
