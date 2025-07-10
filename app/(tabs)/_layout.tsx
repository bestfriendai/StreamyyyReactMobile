import { Tabs } from 'expo-router';
import { 
  Compass, 
  Grid3X3, 
  Heart, 
  Settings, 
  Crown,
  User
} from 'lucide-react-native';
import { View, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { HapticFeedback } from '@/utils/haptics';

export default function TabLayout() {
  const { theme, isDark } = useTheme();

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
            height: Platform.OS === 'ios' ? 90 : 85,
            backgroundColor: '#000000',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
            elevation: 0,
            shadowOpacity: 0,
            paddingBottom: Platform.OS === 'ios' ? 5 : 0,
          },
        ],
        tabBarBackground: () => (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: Platform.OS === 'ios' ? 90 : 85,
              backgroundColor: '#000000',
              borderTopWidth: 1,
              borderTopColor: 'rgba(255, 255, 255, 0.1)',
            }}
          />
        ),
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        tabBarLabelStyle: {
          fontFamily: theme.tokens.typography.fonts.primary,
          fontSize: theme.tokens.typography.sizes.xs,
          fontWeight: theme.tokens.typography.weights.semibold,
          marginBottom: Platform.OS === 'ios' ? 12 : 8,
          letterSpacing: 0.5,
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === 'ios' ? 8 : 6,
        },
        tabBarHideOnKeyboard: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ size, color, focused }) => (
            <Compass 
              size={focused ? size + 2 : size} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
          tabBarAccessibilityLabel: 'Discover streams and games',
          tabBarTestID: 'discover-tab',
        }}
      />
      <Tabs.Screen
        name="grid"
        options={{
          title: 'Multi-View',
          tabBarIcon: ({ size, color, focused }) => (
            <Grid3X3 
              size={focused ? size + 2 : size} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
          tabBarAccessibilityLabel: 'Multi-view streaming grid',
          tabBarTestID: 'multiview-tab',
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ size, color, focused }) => (
            <Heart 
              size={focused ? size + 2 : size} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
              fill={focused ? color : 'transparent'}
            />
          ),
          tabBarAccessibilityLabel: 'Your favorite streamers',
          tabBarTestID: 'favorites-tab',
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: 'Premium',
          tabBarIcon: ({ size, color, focused }) => (
            <Crown 
              size={focused ? size + 2 : size} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
              fill={focused ? color : 'transparent'}
            />
          ),
          tabBarAccessibilityLabel: 'Subscription and premium features',
          tabBarTestID: 'premium-tab',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color, focused }) => (
            <Settings 
              size={focused ? size + 2 : size} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
          tabBarAccessibilityLabel: 'App settings and preferences',
          tabBarTestID: 'settings-tab',
        }}
      />
    </Tabs>
  );
}