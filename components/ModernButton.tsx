import React from 'react';
import { styled, Stack, Text, GetProps } from '@tamagui/core';
import { createAnimations } from '@tamagui/animations-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Enhanced button variants using Tamagui's styled system
const BaseButton = styled(Stack, {
  name: 'ModernButton',
  borderRadius: '$button',
  paddingHorizontal: '$4',
  paddingVertical: '$3',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  gap: '$2',
  backgroundColor: '$purple500',
  borderColor: '$purple600',
  borderWidth: 1,
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 4,
  shadowOpacity: 0.1,
  pressStyle: {
    scale: 0.95,
    backgroundColor: '$purple600',
  },
  hoverStyle: {
    backgroundColor: '$purple400',
    shadowOpacity: 0.2,
  },
  focusStyle: {
    backgroundColor: '$purple600',
    borderColor: '$purple400',
    shadowOpacity: 0.3,
  },

  variants: {
    variant: {
      primary: {
        backgroundColor: '$purple500',
        borderColor: '$purple600',
      },
      secondary: {
        backgroundColor: 'transparent',
        borderColor: '$purple500',
      },
      success: {
        backgroundColor: '$green500',
        borderColor: '$green600',
      },
      danger: {
        backgroundColor: '$red500',
        borderColor: '$red600',
      },
      live: {
        backgroundColor: '$red500',
        borderColor: '$red500',
      },
    },
    size: {
      small: {
        paddingHorizontal: '$3',
        paddingVertical: '$2',
        borderRadius: '$2',
      },
      medium: {
        paddingHorizontal: '$4',
        paddingVertical: '$3',
        borderRadius: '$button',
      },
      large: {
        paddingHorizontal: '$5',
        paddingVertical: '$4',
        borderRadius: '$4',
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        pointerEvents: 'none',
      },
    },
    loading: {
      true: {
        opacity: 0.7,
      },
    },
  } as const,

  defaultVariants: {
    variant: 'primary',
    size: 'medium',
  },
});

const ButtonText = styled(Text, {
  color: '$color',
  fontSize: '$4',
  fontWeight: '600',
  textAlign: 'center',

  variants: {
    size: {
      small: {
        fontSize: '$3',
      },
      medium: {
        fontSize: '$4',
      },
      large: {
        fontSize: '$5',
      },
    },
    variant: {
      primary: {
        color: '#ffffff',
      },
      secondary: {
        color: '$purple500',
      },
      success: {
        color: '#ffffff',
      },
      danger: {
        color: '#ffffff',
      },
      live: {
        color: '#ffffff',
      },
    },
  } as const,
});

export interface ModernButtonProps extends GetProps<typeof BaseButton> {
  children?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress?: () => void;
  gradient?: boolean;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  children,
  leftIcon,
  rightIcon,
  gradient = false,
  variant = 'primary',
  size = 'medium',
  ...props
}) => {
  const getGradientColors = () => {
    switch (variant) {
      case 'success':
        return ['#10B981', '#059669'];
      case 'danger':
        return ['#EF4444', '#DC2626'];
      case 'live':
        return ['#ff4444', '#ff0000'];
      case 'secondary':
        return ['transparent', 'transparent'];
      default:
        return ['#8B5CF6', '#7C3AED'];
    }
  };

  const buttonContent = (
    <>
      {leftIcon}
      {typeof children === 'string' ? (
        <ButtonText variant={variant} size={size}>
          {children}
        </ButtonText>
      ) : (
        children
      )}
      {rightIcon}
    </>
  );

  if (gradient && variant !== 'secondary') {
    return (
      <BaseButton {...props} variant={variant} size={size} backgroundColor="transparent" borderWidth={0}>
        <LinearGradient
          colors={getGradientColors()}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            paddingHorizontal: size === 'small' ? 12 : size === 'large' ? 20 : 16,
            paddingVertical: size === 'small' ? 8 : size === 'large' ? 16 : 12,
            borderRadius: size === 'small' ? 8 : 12,
          }}
        >
          {buttonContent}
        </LinearGradient>
      </BaseButton>
    );
  }

  return (
    <BaseButton {...props} variant={variant} size={size}>
      {buttonContent}
    </BaseButton>
  );
};

// Export styled components for direct use
export { BaseButton, ButtonText };