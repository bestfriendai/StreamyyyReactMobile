import React from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EnhancedMultiStreamViewer } from '@/components/EnhancedMultiStreamViewer';
import { useStreamManager } from '@/hooks/useStreamManager';
import { StatusBar } from 'expo-status-bar';

export default function GridScreen() {
  const { activeStreams, removeStream } = useStreamManager();

  const handleAddStream = () => {
    // TODO: Implement stream search and selection
    Alert.alert('Add Stream', 'Stream search functionality coming soon!');
  };

  const handleRemoveStream = (streamId: string) => {
    removeStream(streamId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      <EnhancedMultiStreamViewer
        streams={activeStreams}
        onAddStream={handleAddStream}
        onRemoveStream={handleRemoveStream}
        maxStreams={9}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});