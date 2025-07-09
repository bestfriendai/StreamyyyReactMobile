import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { EnhancedDiscoverScreen } from '@/components/EnhancedDiscoverScreen';

export default function DiscoverScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f0f0f', '#1a1a1a', '#0f0f0f']}
        style={styles.background}
      />
      <EnhancedDiscoverScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});