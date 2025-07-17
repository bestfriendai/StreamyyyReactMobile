import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticFeedback } from '@/utils/haptics';

interface TabItem {
  key: string;
  title: string;
  icon: React.ComponentType<any>;
  accessibilityLabel: string;
}

interface EnhancedTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (key: string) => void;
}

export function EnhancedTabBar({ tabs, activeTab, onTabPress }: EnhancedTabBarProps) {
  const insets = useSafeAreaInsets();

  const TabButton = ({ tab, isActive }: { tab: TabItem; isActive: boolean }) => {
    const scale = useSharedValue(1);
    const IconComponent = tab.icon;

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const iconAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        {
          translateY: withSpring(isActive ? -2 : 0, { damping: 15, stiffness: 300 }),
        },
      ],
    }));

    const labelAnimatedStyle = useAnimatedStyle(() => ({
      opacity: withTiming(isActive ? 1 : 0.7, { duration: 200 }),
      transform: [
        {
          scale: withSpring(isActive ? 1.05 : 1, { damping: 15, stiffness: 300 }),
        },
      ],
    }));

    const handlePress = async () => {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }, () => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      });

      await HapticFeedback.light();
      onTabPress(tab.key);
    };

    return (
      <Animated.View style={[styles.tabButton, animatedStyle]}>
        <TouchableOpacity
          onPress={handlePress}
          style={styles.tabTouchable}
          accessibilityRole="tab"
          accessibilityLabel={tab.accessibilityLabel}
          accessibilityState={{ selected: isActive }}
        >
          <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
            <IconComponent
              size={22}
              color={isActive ? '#8B5CF6' : '#9CA3AF'}
              strokeWidth={isActive ? 2.5 : 2}
              fill={
                isActive && (tab.key === 'favorites' || tab.key === 'subscription')
                  ? '#8B5CF6'
                  : 'transparent'
              }
            />
          </Animated.View>
          <Animated.Text
            style={[
              styles.tabLabel,
              labelAnimatedStyle,
              { color: isActive ? '#8B5CF6' : '#9CA3AF' },
            ]}
          >
            {tab.title}
          </Animated.Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={['rgba(15, 15, 15, 0.98)', 'rgba(26, 26, 26, 0.95)', 'rgba(139, 92, 246, 0.1)']}
        style={styles.gradient}
      >
        <View style={styles.tabRow}>
          {tabs.map(tab => (
            <TabButton key={tab.key} tab={tab} isActive={activeTab === tab.key} />
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 85,
  },
  gradient: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.2)',
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 50,
  },
  iconContainer: {
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.5,
  },
});
