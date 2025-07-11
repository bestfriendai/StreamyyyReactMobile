/**
 * Standardized Input Component
 * Uses unified theme system for consistent styling
 */

import React, { useState, useRef } from 'react';
import {
  TextInput,
  View,
  Text,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'filled' | 'glass';
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad';
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  containerStyle?: ViewStyle;
  maxLength?: number;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  size = 'md',
  variant = 'default',
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  onRightIconPress,
  autoCapitalize = 'none',
  autoCorrect = false,
  keyboardType = 'default',
  returnKeyType = 'done',
  onSubmitEditing,
  onFocus,
  onBlur,
  disabled = false,
  style,
  inputStyle,
  containerStyle,
  maxLength,
}) => {
  const { theme, helpers } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  
  // Animation values
  const borderColor = useSharedValue(theme.border.primary);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  // Handle focus events
  const handleFocus = () => {
    setIsFocused(true);
    borderColor.value = withTiming(theme.interactive.primary);
    scale.value = withSpring(1.02, { damping: 15 });
    glowOpacity.value = withTiming(0.3);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderColor.value = withTiming(error ? theme.status.error : theme.border.primary);
    scale.value = withSpring(1, { damping: 15 });
    glowOpacity.value = withTiming(0);
    onBlur?.();
  };

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
    transform: [{ scale: scale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Get input configuration from theme
  const inputConfig = theme.components.input[size];

  // Build styles based on variant and theme
  const getContainerStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      ...inputConfig,
      flexDirection: 'row',
      alignItems: multiline ? 'flex-start' : 'center',
      opacity: disabled ? 0.6 : 1,
    };

    switch (variant) {
      case 'default':
        return {
          ...baseStyles,
          backgroundColor: theme.background.card,
          borderColor: error ? theme.status.error : theme.border.primary,
          borderWidth: 1,
        };
      case 'outlined':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderColor: error ? theme.status.error : theme.border.primary,
          borderWidth: 2,
        };
      case 'filled':
        return {
          ...baseStyles,
          backgroundColor: theme.background.secondary,
          borderWidth: 0,
        };
      case 'glass':
        return {
          ...baseStyles,
          backgroundColor: helpers.getColorWithOpacity(theme.background.card, 0.1),
          borderColor: helpers.getColorWithOpacity(theme.border.primary, 0.3),
          borderWidth: 1,
          ...Platform.select({
            web: {
              backdropFilter: 'blur(10px)',
            },
          }),
        };
      default:
        return baseStyles;
    }
  };

  const getInputStyles = (): TextStyle => {
    return {
      flex: 1,
      fontSize: theme.tokens.typography.sizes[
        size === 'sm' ? 'sm' : size === 'lg' ? 'md' : 'base'
      ],
      fontFamily: theme.tokens.typography.fonts.primary,
      color: theme.text.primary,
      textAlignVertical: multiline ? 'top' : 'center',
      paddingTop: multiline ? theme.tokens.spacing[3] : 0,
      height: multiline ? undefined : '100%',
      minHeight: multiline ? inputConfig.height : undefined,
    };
  };

  const containerStyles = getContainerStyles();
  const textInputStyles = getInputStyles();

  return (
    <View style={[containerStyle]}>
      {/* Label */}
      {label && (
        <Text
          style={{
            fontSize: theme.tokens.typography.sizes.sm,
            fontWeight: theme.tokens.typography.weights.medium,
            color: theme.text.secondary,
            marginBottom: theme.tokens.spacing[1],
          }}
        >
          {label}
        </Text>
      )}

      {/* Input Container */}
      <View style={{ position: 'relative' }}>
        {/* Glow effect for focus */}
        <AnimatedView
          style={[
            {
              position: 'absolute',
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              borderRadius: containerStyles.borderRadius,
              backgroundColor: helpers.getColorWithOpacity(theme.interactive.primary, 0.1),
              ...Platform.select({
                ios: {
                  shadowColor: theme.interactive.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                },
                android: {
                  elevation: 4,
                },
                web: {
                  boxShadow: `0 0 16px ${helpers.getColorWithOpacity(theme.interactive.primary, 0.3)}`,
                },
              }),
            },
            animatedGlowStyle,
          ]}
        />

        {/* Main Input Container */}
        <AnimatedView style={[containerStyles, style, animatedContainerStyle]}>
          {/* Left Icon */}
          {leftIcon && (
            <View
              style={{
                marginRight: theme.tokens.spacing[2],
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {leftIcon}
            </View>
          )}

          {/* Text Input */}
          <TextInput
            ref={inputRef}
            style={[textInputStyles, inputStyle]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.text.tertiary}
            secureTextEntry={secureTextEntry}
            multiline={multiline}
            numberOfLines={numberOfLines}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            keyboardType={keyboardType}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!disabled}
            maxLength={maxLength}
          />

          {/* Right Icon */}
          {rightIcon && (
            <TouchableOpacity
              onPress={onRightIconPress}
              style={{
                marginLeft: theme.tokens.spacing[2],
                justifyContent: 'center',
                alignItems: 'center',
                padding: theme.tokens.spacing[1],
              }}
              disabled={!onRightIconPress}
            >
              {rightIcon}
            </TouchableOpacity>
          )}
        </AnimatedView>
      </View>

      {/* Error Message */}
      {error && (
        <Text
          style={{
            fontSize: theme.tokens.typography.sizes.xs,
            color: theme.status.error,
            marginTop: theme.tokens.spacing[1],
            marginLeft: theme.tokens.spacing[1],
          }}
        >
          {error}
        </Text>
      )}

      {/* Character Counter */}
      {maxLength && (
        <Text
          style={{
            fontSize: theme.tokens.typography.sizes.xs,
            color: theme.text.tertiary,
            textAlign: 'right',
            marginTop: theme.tokens.spacing[1],
          }}
        >
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
};

// Specialized input variants
export const SearchInput: React.FC<Omit<InputProps, 'variant' | 'leftIcon'> & {
  leftIcon?: React.ReactNode;
}> = ({ leftIcon, ...props }) => {
  return (
    <Input
      {...props}
      variant="glass"
      placeholder="Search..."
      leftIcon={leftIcon}
      keyboardType="default"
      returnKeyType="search"
    />
  );
};

export const PasswordInput: React.FC<Omit<InputProps, 'secureTextEntry' | 'rightIcon'>> = ({
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { theme } = useTheme();

  return (
    <Input
      {...props}
      secureTextEntry={!showPassword}
      rightIcon={
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text style={{ color: theme.text.tertiary }}>
            {showPassword ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      }
      onRightIconPress={() => setShowPassword(!showPassword)}
    />
  );
};

export default Input;