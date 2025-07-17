import { Tabs } from 'expo-router';
import { Compass, Grid3X3, Heart, Settings, Crown, User, Sparkles, Zap } from 'lucide-react-native';
import React from 'react';
import { View, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useInterstitialAd } from '@/hooks/useInterstitialAd';
import { HapticFeedback } from '@/utils/haptics';

interface TabIconProps {
  icon: React.ComponentType<any>;
  size: number;
  color: string;
  focused: boolean;
  label: string;
}

function TabIcon({ icon: Icon, size, color, focused, label }: TabIconProps) {
  // Simplified version without complex animations for faster navigation
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {focused && (
        <View
          style={{
            position: 'absolute',
            width: size + 8,
            height: size + 8,
            borderRadius: (size + 8) / 2,
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
          }}
        />
      )}
      <Icon
        size={focused ? size + 1 : size}
        color={color}
        strokeWidth={focused ? 2.2 : 2}
        fill={focused && (label === 'Favorites' || label === 'Premium') ? color : 'transparent'}
      />
    </View>
  );
}

export default function TabLayout() {
  const { theme, isDark } = useTheme();
  const { showAd, canShow } = useInterstitialAd();

  const handleTabPress = (tabName: string) => {
    // Remove blocking operations for faster navigation
    // Haptic feedback and ads run asynchronously
    setTimeout(() => {
      HapticFeedback.light();

      // Show ads less frequently and asynchronously
      if (canShow && Math.random() < 0.1) {
        // Reduced to 10% chance
        showAd(`tab_${tabName}`);
      }
    }, 0);
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: Platform.OS === 'ios' ? 95 : 90,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            paddingBottom: Platform.OS === 'ios' ? 8 : 5,
            paddingTop: 8,
          },
        ],
        tabBarBackground: () => (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: Platform.OS === 'ios' ? 95 : 90,
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              borderTopWidth: 1,
              borderTopColor: 'rgba(139, 92, 246, 0.2)',
            }}
          />
        ),
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        tabBarLabelStyle: {
          fontFamily: theme.tokens.typography.fonts.primary,
          fontSize: theme.tokens.typography.sizes.xs,
          fontWeight: '700' as const,
          marginBottom: Platform.OS === 'ios' ? 5 : 3,
          letterSpacing: 0.8,
          textShadowColor: 'rgba(0, 0, 0, 0.5)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === 'ios' ? 3 : 2,
        },
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ size, color, focused }) => (
            <TabIcon icon={Compass} size={size} color={color} focused={focused} label="Discover" />
          ),
          tabBarAccessibilityLabel: 'Discover streams and games',
          // tabBarTestID: 'discover-tab',
        }}
        listeners={{
          tabPress: () => handleTabPress('discover'),
        }}
      />
      <Tabs.Screen
        name="grid"
        options={{
          title: 'Multi-View',
          tabBarIcon: ({ size, color, focused }) => (
            <TabIcon
              icon={Grid3X3}
              size={size}
              color={color}
              focused={focused}
              label="Multi-View"
            />
          ),
          tabBarAccessibilityLabel: 'Multi-view streaming grid',
          // tabBarTestID: 'multiview-tab',
        }}
        listeners={{
          tabPress: () => handleTabPress('grid'),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ size, color, focused }) => (
            <TabIcon icon={Heart} size={size} color={color} focused={focused} label="Favorites" />
          ),
          tabBarAccessibilityLabel: 'Your favorite streamers',
          // tabBarTestID: 'favorites-tab',
        }}
        listeners={{
          tabPress: () => handleTabPress('favorites'),
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: 'Premium',
          tabBarIcon: ({ size, color, focused }) => (
            <TabIcon icon={Crown} size={size} color={color} focused={focused} label="Premium" />
          ),
          tabBarAccessibilityLabel: 'Subscription and premium features',
          // tabBarTestID: 'premium-tab',
        }}
        listeners={{
          tabPress: () => handleTabPress('premium'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color, focused }) => (
            <TabIcon icon={Settings} size={size} color={color} focused={focused} label="Settings" />
          ),
          tabBarAccessibilityLabel: 'App settings and preferences',
          // tabBarTestID: 'settings-tab',
        }}
        listeners={{
          tabPress: () => handleTabPress('settings'),
        }}
      />
    </Tabs>
  );
}
