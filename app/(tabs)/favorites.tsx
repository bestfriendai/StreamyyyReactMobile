import React from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Star, Sparkles } from 'lucide-react-native';
import { StreamCard } from '@/components/StreamCard';
import { useStreamManager } from '@/hooks/useStreamManager';
import { router } from 'expo-router';

export default function FavoritesScreen() {
  const { favorites, addStream, toggleFavorite, isFavorite, isStreamActive } = useStreamManager();

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <LinearGradient
        colors={['rgba(255, 68, 68, 0.1)', 'transparent']}
        style={styles.headerGradient}
      >
        <View style={styles.titleContainer}>
          <Heart size={28} color="#FF4444" fill="#FF4444" />
          <Text style={styles.title}>Favorites</Text>
        </View>
        <Text style={styles.subtitle}>
          {favorites.length} favorite streamer{favorites.length !== 1 ? 's' : ''}
        </Text>
      </LinearGradient>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={['rgba(255, 68, 68, 0.1)', 'transparent']}
        style={styles.emptyGradient}
      >
        <Sparkles size={64} color="#666" />
        <Text style={styles.emptyTitle}>No Favorites Yet</Text>
        <Text style={styles.emptySubtitle}>
          Add your favorite streamers to see them here
        </Text>
        <TouchableOpacity style={styles.discoverButton}>
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.discoverGradient}
          >
            <Star size={16} color="#fff" />
            <Text style={styles.discoverText}>Discover Streamers</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#0f0f0f']}
        style={styles.background}
      />
      
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StreamCard
            stream={item}
            onAdd={addStream}
            onToggleFavorite={toggleFavorite}
            isFavorite={isFavorite(item.user_id)}
            isActive={isStreamActive(item.id)}
            showAddButton={!isStreamActive(item.id)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={favorites.length === 0 ? styles.emptyContainer : undefined}
      />
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
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#999',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 40,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyGradient: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    marginHorizontal: 20,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  discoverButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  discoverGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  discoverText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});