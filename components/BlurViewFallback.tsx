import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BlurViewFallbackProps {
  style?: ViewStyle;
  blurType?: 'light' | 'dark' | 'prominent';
  blurAmount?: number;
  children?: React.ReactNode;
}

export const BlurViewFallback: React.FC<BlurViewFallbackProps> = ({
  style,
  blurType = 'dark',
  blurAmount = 10,
  children,
}) => {
  // Create gradient colors based on blur type and amount
  const getGradientColors = () => {
    const opacity = Math.min(blurAmount / 20, 0.9); // Convert blur amount to opacity
    
    switch (blurType) {
      case 'light':
        return [
          `rgba(255, 255, 255, ${opacity * 0.8})`,
          `rgba(240, 240, 240, ${opacity * 0.6})`,
          `rgba(255, 255, 255, ${opacity * 0.4})`,
        ];
      case 'prominent':
        return [
          `rgba(128, 128, 128, ${opacity * 0.9})`,
          `rgba(100, 100, 100, ${opacity * 0.7})`,
          `rgba(80, 80, 80, ${opacity * 0.5})`,
        ];
      case 'dark':
      default:
        return [
          `rgba(0, 0, 0, ${opacity * 0.8})`,
          `rgba(20, 20, 20, ${opacity * 0.6})`,
          `rgba(0, 0, 0, ${opacity * 0.4})`,
        ];
    }
  };

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={getGradientColors()}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

// Export as default for easy replacement
export default BlurViewFallback;