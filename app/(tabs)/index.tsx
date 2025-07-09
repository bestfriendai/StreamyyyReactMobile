import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { EnhancedDiscoverScreen } from '@/components/EnhancedDiscoverScreen';
import { Theme } from '@/constants/Theme';

export default function DiscoverScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />
      <LinearGradient
        colors={Theme.gradients.background}
        style={styles.background}
      />
      <EnhancedDiscoverScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});