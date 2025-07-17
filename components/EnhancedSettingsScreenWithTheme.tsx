/**
 * Enhanced Settings Screen - Updated with Unified Theme System
 * Demonstrates proper usage of the new theme system and UI components
 */

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
} from 'lucide-react-native';
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
} from 'react-native';

// Import unified theme components
import { AnimatedContainer, StaggeredContainer } from '@/components/ui/AnimatedContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTheme } from '@/contexts/ThemeContext';
import { ColorContrastUtils, ScreenReaderUtils, TouchTargetUtils } from '@/utils/accessibility';

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

export const EnhancedSettingsScreenWithTheme: React.FC = () => {
  const { theme, isDark, toggleTheme, helpers } = useTheme();

  // State management
  const [settings, setSettings] = useState({
    notifications: true,
    autoplay: true,
    darkMode: isDark,
    highQuality: false,
    cellularStreaming: false,
    backgroundAudio: true,
    hapticFeedback: true,
    analytics: false,
  });

  const [expandedSections, setExpandedSections] = useState<string[]>(['account', 'streaming']);
  const [showErrorTesting, setShowErrorTesting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle setting toggle
  const handleToggle = useCallback(
    async (key: string, value: boolean) => {
      setSettings(prev => ({ ...prev, [key]: value }));

      // Handle theme toggle
      if (key === 'darkMode') {
        toggleTheme();
      }

      // Save to AsyncStorage
      try {
        await AsyncStorage.setItem(`setting_${key}`, JSON.stringify(value));

        // Announce change to screen reader
        ScreenReaderUtils.announce(`${key} ${value ? 'enabled' : 'disabled'}`);
      } catch (error) {
        console.warn('Failed to save setting:', error);
      }
    },
    [toggleTheme]
  );

  // Toggle section expansion
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  }, []);

  // Settings sections configuration
  const settingsSections: SettingsSection[] = [
    {
      id: 'account',
      title: 'Account & Profile',
      items: [
        {
          id: 'profile',
          title: 'Profile Settings',
          subtitle: 'Manage your profile information',
          icon: User,
          type: 'navigation',
          onPress: () => Alert.alert('Profile', 'Profile settings would open here'),
        },
        {
          id: 'notifications',
          title: 'Notifications',
          subtitle: 'Push notifications and alerts',
          icon: Bell,
          type: 'toggle',
          value: settings.notifications,
          onToggle: value => handleToggle('notifications', value),
        },
        {
          id: 'privacy',
          title: 'Privacy & Security',
          subtitle: 'Control your privacy settings',
          icon: Shield,
          type: 'navigation',
          onPress: () => Alert.alert('Privacy', 'Privacy settings would open here'),
        },
      ],
    },
    {
      id: 'appearance',
      title: 'Appearance & Display',
      items: [
        {
          id: 'darkMode',
          title: 'Dark Mode',
          subtitle: `Currently using ${isDark ? 'dark' : 'light'} theme`,
          icon: isDark ? Moon : Sun,
          type: 'toggle',
          value: settings.darkMode,
          onToggle: value => handleToggle('darkMode', value),
        },
        {
          id: 'theme',
          title: 'Theme Customization',
          subtitle: 'Customize colors and appearance',
          icon: Palette,
          type: 'navigation',
          onPress: () => Alert.alert('Theme', 'Theme customization would open here'),
        },
      ],
    },
    {
      id: 'streaming',
      title: 'Streaming Preferences',
      items: [
        {
          id: 'autoplay',
          title: 'Auto-play Streams',
          subtitle: 'Automatically start streams when selected',
          icon: Monitor,
          type: 'toggle',
          value: settings.autoplay,
          onToggle: value => handleToggle('autoplay', value),
        },
        {
          id: 'highQuality',
          title: 'High Quality Streams',
          subtitle: 'Prefer higher quality when available',
          icon: Eye,
          type: 'toggle',
          value: settings.highQuality,
          onToggle: value => handleToggle('highQuality', value),
        },
        {
          id: 'cellularStreaming',
          title: 'Cellular Streaming',
          subtitle: 'Allow streaming over cellular data',
          icon: Wifi,
          type: 'toggle',
          value: settings.cellularStreaming,
          onToggle: value => handleToggle('cellularStreaming', value),
        },
        {
          id: 'backgroundAudio',
          title: 'Background Audio',
          subtitle: 'Continue audio when app is minimized',
          icon: Headphones,
          type: 'toggle',
          value: settings.backgroundAudio,
          onToggle: value => handleToggle('backgroundAudio', value),
        },
      ],
    },
    {
      id: 'system',
      title: 'System & Debug',
      items: [
        {
          id: 'hapticFeedback',
          title: 'Haptic Feedback',
          subtitle: 'Vibration feedback for interactions',
          icon: Smartphone,
          type: 'toggle',
          value: settings.hapticFeedback,
          onToggle: value => handleToggle('hapticFeedback', value),
        },
        {
          id: 'analytics',
          title: 'Analytics',
          subtitle: 'Help improve the app with usage data',
          icon: Globe,
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
          onPress: () => {
            setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
              Alert.alert('Success', 'Cache cleared successfully');
            }, 2000);
          },
        },
        {
          id: 'errorTesting',
          title: 'Error Testing',
          subtitle: 'Test error boundaries and reporting',
          icon: Bug,
          type: 'action',
          onPress: () => setShowErrorTesting(true),
        },
      ],
    },
    {
      id: 'support',
      title: 'Help & Support',
      items: [
        {
          id: 'help',
          title: 'Help Center',
          subtitle: 'Get help and find answers',
          icon: HelpCircle,
          type: 'navigation',
          onPress: () => Linking.openURL('https://help.example.com'),
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Share your thoughts and suggestions',
          icon: Star,
          type: 'navigation',
          onPress: () => Alert.alert('Feedback', 'Feedback form would open here'),
        },
        {
          id: 'share',
          title: 'Share App',
          subtitle: 'Tell your friends about this app',
          icon: Share2,
          type: 'action',
          onPress: () => Alert.alert('Share', 'Share sheet would open here'),
        },
      ],
    },
  ];

  // Render settings item
  const renderSettingsItem = (item: SettingsItem) => {
    const IconComponent = item.icon;
    const accessibleLabel = ScreenReaderUtils.generateButtonLabel(
      item.title,
      item.type === 'toggle' ? (item.value ? 'enabled' : 'disabled') : undefined
    );

    return (
      <AnimatedContainer key={item.id} preset="fadeIn" delay={50}>
        <Card
          interactive={item.type !== 'toggle'}
          onPress={item.onPress}
          style={{
            marginBottom: theme.tokens.spacing[3],
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: TouchTargetUtils.ensureMinimumTouchTarget(40),
            }}
          >
            {/* Left content */}
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: theme.tokens.radius.lg,
                  backgroundColor: helpers.getColorWithOpacity(theme.interactive.primary, 0.1),
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: theme.tokens.spacing[3],
                }}
              >
                <IconComponent
                  size={20}
                  color={theme.interactive.primary}
                  accessibilityLabel={`${item.title} icon`}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    ...helpers.getTypography('base', 'medium'),
                    color: theme.text.primary,
                    marginBottom: item.subtitle ? theme.tokens.spacing[0.5] : 0,
                  }}
                >
                  {item.title}
                </Text>
                {item.subtitle && (
                  <Text
                    style={{
                      ...helpers.getTypography('sm'),
                      color: theme.text.secondary,
                    }}
                  >
                    {item.subtitle}
                  </Text>
                )}
              </View>
            </View>

            {/* Right content */}
            <View style={{ marginLeft: theme.tokens.spacing[3] }}>
              {item.type === 'toggle' ? (
                <Switch
                  value={item.value}
                  onValueChange={item.onToggle}
                  trackColor={{
                    false: theme.background.secondary,
                    true: helpers.getColorWithOpacity(theme.interactive.primary, 0.3),
                  }}
                  thumbColor={item.value ? theme.interactive.primary : theme.text.tertiary}
                  accessibilityLabel={accessibleLabel}
                />
              ) : (
                <ChevronRight size={20} color={theme.text.tertiary} accessibilityLabel="Navigate" />
              )}
            </View>
          </View>
        </Card>
      </AnimatedContainer>
    );
  };

  // Render settings section
  const renderSettingsSection = (section: SettingsSection) => {
    const isExpanded = expandedSections.includes(section.id);

    return (
      <AnimatedContainer key={section.id} preset="slideUp" delay={100}>
        <Card
          style={{
            marginBottom: theme.tokens.spacing[6],
          }}
        >
          {/* Section Header */}
          <TouchableOpacity
            onPress={() => toggleSection(section.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: isExpanded ? theme.tokens.spacing[4] : 0,
              borderBottomWidth: isExpanded ? 1 : 0,
              borderBottomColor: theme.border.primary,
            }}
            accessibilityLabel={`${section.title} section, ${isExpanded ? 'expanded' : 'collapsed'}`}
            accessibilityRole="button"
          >
            <Text
              style={{
                ...helpers.getTypography('lg', 'semibold'),
                color: theme.text.primary,
              }}
            >
              {section.title}
            </Text>
            <ChevronRight
              size={20}
              color={theme.text.secondary}
              style={{
                transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
              }}
            />
          </TouchableOpacity>

          {/* Section Content */}
          {isExpanded && (
            <View style={{ paddingTop: theme.tokens.spacing[4] }}>
              <StaggeredContainer staggerDelay={50}>
                {section.items.map(renderSettingsItem)}
              </StaggeredContainer>
            </View>
          )}
        </Card>
      </AnimatedContainer>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background.primary }}>
      {/* Header */}
      <LinearGradient
        colors={theme.gradients.primary}
        style={{
          paddingTop: Platform.OS === 'ios' ? 60 : 40,
          paddingBottom: theme.tokens.spacing[6],
          paddingHorizontal: theme.tokens.spacing[6],
        }}
      >
        <AnimatedContainer preset="slideDown" delay={200}>
          <Text
            style={{
              ...helpers.getTypography('4xl', 'bold'),
              color: theme.text.inverse,
              textAlign: 'center',
            }}
          >
            Settings
          </Text>
          <Text
            style={{
              ...helpers.getTypography('base'),
              color: helpers.getColorWithOpacity(theme.text.inverse, 0.8),
              textAlign: 'center',
              marginTop: theme.tokens.spacing[2],
            }}
          >
            Customize your streaming experience
          </Text>
        </AnimatedContainer>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.tokens.spacing[6],
          paddingBottom: 100, // Account for tab bar
        }}
        showsVerticalScrollIndicator={false}
      >
        <StaggeredContainer staggerDelay={100}>
          {settingsSections.map(renderSettingsSection)}
        </StaggeredContainer>

        {/* Theme Toggle Button */}
        <AnimatedContainer preset="bounce" delay={800}>
          <Button
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            onPress={toggleTheme}
            variant="secondary"
            icon={
              isDark ? (
                <Sun size={20} color={theme.text.primary} />
              ) : (
                <Moon size={20} color={theme.text.primary} />
              )
            }
            style={{ marginBottom: theme.tokens.spacing[4] }}
          />
        </AnimatedContainer>

        {/* Loading Demo */}
        {isLoading && (
          <AnimatedContainer preset="scale">
            <Card style={{ alignItems: 'center', padding: theme.tokens.spacing[8] }}>
              <LoadingSpinner size="lg" variant="gradient" />
              <Text
                style={{
                  ...helpers.getTypography('base', 'medium'),
                  color: theme.text.secondary,
                  marginTop: theme.tokens.spacing[4],
                }}
              >
                Clearing cache...
              </Text>
            </Card>
          </AnimatedContainer>
        )}
      </ScrollView>
    </View>
  );
};

export default EnhancedSettingsScreenWithTheme;
