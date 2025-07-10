import React, { useState, useEffect } from 'react';
import { Alert, FlatList, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EnhancedFavoritesScreen } from '@/components/EnhancedFavoritesScreen';
import { useStreamManager } from '@/hooks/useStreamManager';

export default function Favorites() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { favoriteStreamers, toggleFavorite } = useStreamManager();

  const handleStreamSelect = (stream) => {
    console.log('Selected stream:', stream);
  };

  const handleToggleFavorite = (streamId) => {
    toggleFavorite(streamId);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <EnhancedFavoritesScreen
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          onStreamSelect={handleStreamSelect}
          onToggleFavorite={handleToggleFavorite}
        />
      </SafeAreaView>
    </View>
  );
}