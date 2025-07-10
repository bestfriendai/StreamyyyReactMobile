import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ModernMultiStreamGrid } from '@/components/ModernMultiStreamGrid';

export default function GridScreen() {
  const [layout, setLayout] = useState<'1x1' | '2x2' | '3x3' | '4x4'>('2x2');

  const handleLayoutChange = (newLayout: '1x1' | '2x2' | '3x3' | '4x4') => {
    setLayout(newLayout);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ModernMultiStreamGrid
          maxStreams={16}
          onLayoutChange={handleLayoutChange}
        />
      </SafeAreaView>
    </View>
  );
}