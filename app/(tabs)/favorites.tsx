import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EnhancedFavoritesScreen } from '@/components/EnhancedFavoritesScreen';

export default function Favorites() {

  return (
    <SafeAreaView style={styles.container}>
      <EnhancedFavoritesScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});