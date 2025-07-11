import React from 'react';
import { Tabs } from 'expo-router';
import { 
  Compass, 
  Grid3X3, 
  Heart, 
  Settings, 
  Crown,
  User,
  Sparkles,
  Zap
} from 'lucide-react-native';
import { View, Platform, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { HapticFeedback } from '@/utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TabIconProps {
  icon: React.ComponentType<any>;
  size: number;
  color: string;
  focused: boolean;
  label: string;
}

function TabIcon({ icon: Icon, size, color, focused, label }: TabIconProps) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  
  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, { damping: 20 });
    glow.value = withTiming(focused ? 1 : 0, { duration: 200 });
  }, [focused]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.8, 1.2]) }],
  }));
  
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {focused && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: size + 12,
              height: size + 12,
              borderRadius: (size + 12) / 2,
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
            },
            glowStyle,
          ]}
        />
      )}
      <Animated.View style={animatedStyle}>
        <Icon 
          size={focused ? size + 2 : size} 
          color={color} 
          strokeWidth={focused ? 2.5 : 2}
          fill={focused && (label === 'Favorites' || label === 'Premium') ? color : 'transparent'}
        />
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const { theme, isDark } = useTheme();

  const handleTabPress = (tabName: string) => {
    HapticFeedback.light();
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
              overflow: 'hidden',
            }}
          >
            <BlurView
              intensity={95}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <LinearGradient
              colors={[
                'rgba(0, 0, 0, 0.95)',
                'rgba(0, 0, 0, 0.9)',
                'rgba(0, 0, 0, 0.95)',
              ]}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: 'rgba(139, 92, 246, 0.3)',
                shadowColor: '#8B5CF6',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 3,
                elevation: 5,
              }}
            />
          </View>
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
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ size, color, focused }) => (
            <TabIcon
              icon={Compass}
              size={size}
              color={color}
              focused={focused}
              label="Discover"
            />
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
            <TabIcon
              icon={Heart}
              size={size}
              color={color}
              focused={focused}
              label="Favorites"
            />
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
            <TabIcon
              icon={Crown}
              size={size}
              color={color}
              focused={focused}
              label="Premium"
            />
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
            <TabIcon
              icon={Settings}
              size={size}
              color={color}
              focused={focused}
              label="Settings"
            />
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