import { Tabs } from 'expo-router';
import { Search, Grid2x2 as Grid, Heart, Settings } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import { Theme } from '@/constants/Theme';

export default function TabLayout() {
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
            height: 85,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
        ],
        tabBarBackground: () => (
          <LinearGradient
            colors={Theme.gradients.bottomSheet}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: 85,
            }}
          />
        ),
        tabBarActiveTintColor: Theme.colors.accent.primary,
        tabBarInactiveTintColor: Theme.colors.text.tertiary,
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
          marginBottom: 8,
        },
        tabBarIconStyle: {
          marginTop: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ size, color }) => (
            <Search size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="grid"
        options={{
          title: 'Multi-View',
          tabBarIcon: ({ size, color }) => (
            <Grid size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ size, color }) => (
            <Heart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}