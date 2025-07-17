/**
 * Enhanced Tab Bar Component
 * Uses unified theme system for consistent styling
 */

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, TouchableOpacity, Text, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

interface TabBarItem {
  key: string;
  title: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
}

interface TabBarProps {
  items: TabBarItem[];
  activeKey: string;
  onTabPress: (key: string) => void;
  style?: ViewStyle;
  showLabels?: boolean;
  variant?: 'default' | 'floating' | 'minimal';
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const TabBar: React.FC<TabBarProps> = ({
  items,
  activeKey,
  onTabPress,
  style,
  showLabels = true,
  variant = 'default',
}) => {
  const { theme, helpers } = useTheme();

  const getTabBarStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      flexDirection: 'row',
      height: 85,
      paddingBottom: Platform.OS === 'ios' ? 20 : 10,
      paddingTop: 10,
      paddingHorizontal: theme.tokens.spacing[4],
    };

    switch (variant) {
      case 'default':
        return {
          ...baseStyles,
          backgroundColor: helpers.getColorWithOpacity(theme.background.card, 0.95),
          borderTopWidth: 1,
          borderTopColor: theme.border.primary,
        };

      case 'floating':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          marginHorizontal: theme.tokens.spacing[4],
          marginBottom: theme.tokens.spacing[6],
          borderRadius: theme.tokens.radius.xl,
          ...theme.tokens.shadows.lg,
        };

      case 'minimal':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
        };

      default:
        return baseStyles;
    }
  };

  const tabBarStyles = getTabBarStyles();

  const renderTabItem = (item: TabBarItem, index: number) => {
    const isActive = item.key === activeKey;
    const scale = useSharedValue(1);
    const opacity = useSharedValue(isActive ? 1 : 0.7);

    // Update opacity when active state changes
    React.useEffect(() => {
      opacity.value = withTiming(isActive ? 1 : 0.7, { duration: 200 });
    }, [isActive, opacity]);

    const handlePressIn = () => {
      scale.value = withSpring(0.95, { damping: 15 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 15 });
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));

    const getItemStyles = (): ViewStyle => {
      return {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.tokens.spacing[2],
        borderRadius: theme.tokens.radius.lg,
        backgroundColor:
          isActive && variant === 'floating'
            ? helpers.getColorWithOpacity(theme.interactive.primary, 0.1)
            : 'transparent',
      };
    };

    return (
      <AnimatedTouchableOpacity
        key={item.key}
        style={[getItemStyles(), animatedStyle]}
        onPress={() => onTabPress(item.key)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        {/* Icon Container */}
        <View
          style={{
            marginBottom: showLabels ? theme.tokens.spacing[1] : 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Active indicator */}
          {isActive && variant !== 'minimal' && (
            <View
              style={{
                position: 'absolute',
                top: -theme.tokens.spacing[1],
                width: theme.tokens.spacing[6],
                height: theme.tokens.spacing[0.5],
                backgroundColor: theme.interactive.primary,
                borderRadius: theme.tokens.radius.full,
              }}
            />
          )}

          {/* Icon */}
          <View
            style={{
              tintColor: isActive ? theme.interactive.primary : theme.text.tertiary,
            }}
          >
            {isActive && item.activeIcon ? item.activeIcon : item.icon}
          </View>
        </View>

        {/* Label */}
        {showLabels && (
          <Text
            style={{
              fontSize: theme.tokens.typography.sizes.xs,
              fontWeight: isActive
                ? theme.tokens.typography.weights.semibold
                : theme.tokens.typography.weights.medium,
              color: isActive ? theme.interactive.primary : theme.text.tertiary,
              textAlign: 'center',
            }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
        )}

        {/* Minimal variant active indicator */}
        {isActive && variant === 'minimal' && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: '25%',
              right: '25%',
              height: 2,
              backgroundColor: theme.interactive.primary,
              borderRadius: theme.tokens.radius.full,
            }}
          />
        )}
      </AnimatedTouchableOpacity>
    );
  };

  const TabBarContent = () => (
    <View style={tabBarStyles}>{items.map((item, index) => renderTabItem(item, index))}</View>
  );

  // Render different variants
  switch (variant) {
    case 'floating':
      return (
        <View style={[{ position: 'absolute', bottom: 0, left: 0, right: 0 }, style]}>
          <LinearGradient colors={theme.gradients.card} style={tabBarStyles}>
            {items.map((item, index) => renderTabItem(item, index))}
          </LinearGradient>
        </View>
      );

    case 'minimal':
      return (
        <View style={[tabBarStyles, style]}>
          {items.map((item, index) => renderTabItem(item, index))}
        </View>
      );

    default:
      if (Platform.OS === 'ios' && theme.tokens) {
        return (
          <BlurView
            intensity={90}
            tint={theme.isDark ? 'dark' : 'light'}
            style={[tabBarStyles, style]}
          >
            {items.map((item, index) => renderTabItem(item, index))}
          </BlurView>
        );
      }

      return (
        <LinearGradient colors={theme.gradients.card} style={[tabBarStyles, style]}>
          {items.map((item, index) => renderTabItem(item, index))}
        </LinearGradient>
      );
  }
};

export default TabBar;
