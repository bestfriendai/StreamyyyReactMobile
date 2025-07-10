import React from 'react';
import { styled, Stack, YStack, XStack, Text, GetProps } from '@tamagui/core';
import { LinearGradient } from 'expo-linear-gradient';

// Modern card component using Tamagui's design system
const BaseCard = styled(Stack, {
  name: 'ModernCard',
  backgroundColor: 'rgba(26, 26, 26, 0.95)',
  borderRadius: '$card',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)',
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: 4 },
  shadowRadius: 8,
  shadowOpacity: 0.1,
  overflow: 'hidden',
  
  pressStyle: {
    scale: 0.98,
    shadowOpacity: 0.15,
  },
  
  hoverStyle: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowOpacity: 0.2,
  },

  variants: {
    variant: {
      default: {
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      elevated: {
        backgroundColor: 'rgba(42, 42, 42, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      active: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
      },
      live: {
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        borderColor: 'rgba(255, 68, 68, 0.3)',
      },
      success: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
      },
    },
    size: {
      small: {
        padding: '$3',
        borderRadius: '$3',
      },
      medium: {
        padding: '$4',
        borderRadius: '$card',
      },
      large: {
        padding: '$5',
        borderRadius: '$5',
      },
    },
    interactive: {
      true: {
        cursor: 'pointer',
      },
      false: {
        cursor: 'default',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
    size: 'medium',
    interactive: false,
  },
});

const CardHeader = styled(XStack, {
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '$3',
  gap: '$2',
});

const CardTitle = styled(Text, {
  color: '#ffffff',
  fontSize: '$5',
  fontWeight: '600',
  letterSpacing: -0.5,
  flex: 1,
});

const CardSubtitle = styled(Text, {
  color: '#666666',
  fontSize: '$3',
  fontWeight: '500',
  marginTop: '$1',
});

const CardContent = styled(YStack, {
  flex: 1,
  gap: '$2',
});

const CardFooter = styled(XStack, {
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: '$3',
  gap: '$2',
});

const CardBadge = styled(Stack, {
  backgroundColor: '$purple500',
  borderRadius: '$2',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    variant: {
      default: {
        backgroundColor: '$purple500',
      },
      live: {
        backgroundColor: '$red500',
      },
      success: {
        backgroundColor: '$green500',
      },
      warning: {
        backgroundColor: '$yellow500',
      },
      secondary: {
        backgroundColor: '$gray600',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
});

const BadgeText = styled(Text, {
  color: '#ffffff',
  fontSize: '$2',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
});

export interface ModernCardProps extends GetProps<typeof BaseCard> {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  headerActions?: React.ReactNode;
  footerContent?: React.ReactNode;
  gradient?: boolean;
  gradientColors?: string[];
}

export const ModernCard: React.FC<ModernCardProps> = ({
  title,
  subtitle,
  children,
  headerActions,
  footerContent,
  gradient = false,
  gradientColors = ['rgba(139, 92, 246, 0.1)', 'rgba(124, 58, 237, 0.05)', 'transparent'],
  variant = 'default',
  ...props
}) => {
  const cardContent = (
    <>
      {(title || subtitle || headerActions) && (
        <CardHeader>
          <YStack flex={1}>
            {title && <CardTitle>{title}</CardTitle>}
            {subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
          </YStack>
          {headerActions}
        </CardHeader>
      )}
      
      <CardContent>
        {children}
      </CardContent>
      
      {footerContent && (
        <CardFooter>
          {footerContent}
        </CardFooter>
      )}
    </>
  );

  if (gradient) {
    return (
      <BaseCard {...props} variant={variant} backgroundColor="transparent">
        <LinearGradient
          colors={gradientColors}
          style={{ flex: 1, padding: variant === 'small' ? 12 : variant === 'large' ? 20 : 16 }}
        >
          {cardContent}
        </LinearGradient>
      </BaseCard>
    );
  }

  return (
    <BaseCard {...props} variant={variant}>
      {cardContent}
    </BaseCard>
  );
};

// Export individual components for composition
export {
  BaseCard,
  CardHeader,
  CardTitle,
  CardSubtitle,
  CardContent,
  CardFooter,
  CardBadge,
  BadgeText,
};