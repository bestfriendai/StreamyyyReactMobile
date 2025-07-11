import React, { useState, useEffect } from 'react';
import { Alert, FlatList, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EnhancedFavoritesScreen } from '@/components/EnhancedFavoritesScreen';
import { NavigationHeader } from '@/components/NavigationHeader';
import { useStreamManager } from '@/hooks/useStreamManager';
import { Search, SortAsc } from 'lucide-react-native';

export default function Favorites() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { favorites, toggleFavorite } = useStreamManager();

  const handleStreamSelect = (stream: any) => {
    console.log('Selected stream:', stream);
  };

  const handleToggleFavorite = (streamId: string) => {
    // Find the stream in favorites by ID and pass the full stream object
    const stream = favorites.find(fav => fav.id === streamId || fav.user_id === streamId);
    if (stream) {
      toggleFavorite(stream);
    }
  };

  const favoriteCount = favorites.length;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <NavigationHeader
          title="Favorites"
          subtitle={`${favoriteCount} favorite${favoriteCount !== 1 ? 's' : ''}`}
          rightElement={
            <TouchableOpacity style={{ padding: 4 }}>
              <Search size={20} color="#8B5CF6" />
            </TouchableOpacity>
          }
        />
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