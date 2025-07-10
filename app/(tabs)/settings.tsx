import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EnhancedSettingsScreen } from '@/components/EnhancedSettingsScreen';

export default function Settings() {

  return (
    <SafeAreaView style={styles.container}>
      <EnhancedSettingsScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});