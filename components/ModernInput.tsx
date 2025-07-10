import React, { useState } from 'react';
import { styled, Stack, XStack, Text, GetProps } from '@tamagui/core';
import { TextInput, TextInputProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Modern input component with enhanced styling
const InputContainer = styled(Stack, {
  position: 'relative',
  width: '100%',

  variants: {
    variant: {
      default: {
        borderRadius: '$input',
      },
      rounded: {
        borderRadius: '$full',
      },
    },
    size: {
      small: {
        height: 40,
      },
      medium: {
        height: 48,
      },
      large: {
        height: 56,
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
    size: 'medium',
  },
});

const InputWrapper = styled(Stack, {
  backgroundColor: 'rgba(42, 42, 42, 0.8)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '$input',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$2',

  variants: {
    focused: {
      true: {
        borderColor: '$purple500',
        backgroundColor: 'rgba(42, 42, 42, 0.95)',
      },
    },
    error: {
      true: {
        borderColor: '$red500',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        backgroundColor: 'rgba(42, 42, 42, 0.5)',
      },
    },
    variant: {
      default: {
        borderRadius: '$input',
      },
      rounded: {
        borderRadius: '$full',
      },
    },
  } as const,
});

const StyledTextInput = styled(TextInput, {
  flex: 1,
  color: '#ffffff',
  fontSize: '$4',
  fontWeight: '400',
  placeholderTextColor: '$placeholderColor',
  outlineStyle: 'none', // Remove web outline
  
  variants: {
    size: {
      small: {
        fontSize: '$3',
        height: 32,
      },
      medium: {
        fontSize: '$4',
        height: 40,
      },
      large: {
        fontSize: '$5',
        height: 48,
      },
    },
  } as const,
});

const InputLabel = styled(Text, {
  color: '#ffffff',
  fontSize: '$3',
  fontWeight: '500',
  marginBottom: '$2',

  variants: {
    required: {
      true: {
        '::after': {
          content: ' *',
          color: '$red500',
        },
      },
    },
    error: {
      true: {
        color: '$red500',
      },
    },
  } as const,
});

const InputError = styled(Text, {
  color: '$red500',
  fontSize: '$2',
  fontWeight: '400',
  marginTop: '$1',
});

const InputHelper = styled(Text, {
  color: '$placeholderColor',
  fontSize: '$2',
  fontWeight: '400',
  marginTop: '$1',
});

export interface ModernInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
  variant?: 'default' | 'rounded';
  size?: 'small' | 'medium' | 'large';
  gradient?: boolean;
  containerStyle?: GetProps<typeof InputContainer>;
}

export const ModernInput: React.FC<ModernInputProps> = ({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  required = false,
  variant = 'default',
  size = 'medium',
  gradient = false,
  containerStyle,
  onFocus,
  onBlur,
  editable = true,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const inputContent = (
    <>
      {leftIcon}
      <StyledTextInput
        {...textInputProps}
        size={size}
        onFocus={handleFocus}
        onBlur={handleBlur}
        editable={editable}
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
      />
      {rightIcon}
    </>
  );

  const getGradientColors = () => {
    if (error) return ['rgba(239, 68, 68, 0.1)', 'rgba(220, 38, 38, 0.05)'];
    if (isFocused) return ['rgba(139, 92, 246, 0.1)', 'rgba(124, 58, 237, 0.05)'];
    return ['rgba(42, 42, 42, 0.8)', 'rgba(58, 58, 58, 0.8)'];
  };

  return (
    <InputContainer {...containerStyle} variant={variant} size={size}>
      {label && (
        <InputLabel required={required} error={!!error}>
          {label}
        </InputLabel>
      )}
      
      {gradient ? (
        <InputWrapper 
          focused={isFocused} 
          error={!!error} 
          disabled={!editable}
          variant={variant}
          backgroundColor="transparent"
          borderWidth={0}
        >
          <LinearGradient
            colors={getGradientColors()}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: variant === 'rounded' ? 999 : 8,
              borderWidth: 1,
              borderColor: error ? '#EF4444' : isFocused ? '#8B5CF6' : 'rgba(255, 255, 255, 0.1)',
            }}
          >
            {inputContent}
          </LinearGradient>
        </InputWrapper>
      ) : (
        <InputWrapper 
          focused={isFocused} 
          error={!!error} 
          disabled={!editable}
          variant={variant}
        >
          {inputContent}
        </InputWrapper>
      )}
      
      {error && <InputError>{error}</InputError>}
      {helper && !error && <InputHelper>{helper}</InputHelper>}
    </InputContainer>
  );
};

// Export individual components for composition
export {
  InputContainer,
  InputWrapper,
  StyledTextInput,
  InputLabel,
  InputError,
  InputHelper,
};