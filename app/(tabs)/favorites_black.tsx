import React from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Star, Sparkles } from 'lucide-react-native';
import { StreamCard } from '@/components/StreamCard';
import { useStreamManager } from '@/hooks/useStreamManager';
import { router } from 'expo-router';
import { Theme } from '@/constants/Theme';

export default function FavoritesScreen() {
  const { favorites, addStream, toggleFavorite, isFavorite, isStreamActive } = useStreamManager();

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <LinearGradient
        colors={Theme.gradients.header}
        style={styles.headerGradient}
      >
        <View style={styles.titleContainer}>
          <Heart size={28} color={Theme.colors.accent.red} fill={Theme.colors.accent.red} />
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
        colors={Theme.gradients.card}
        style={styles.emptyGradient}
      >
        <Sparkles size={64} color={Theme.colors.text.tertiary} />
        <Text style={styles.emptyTitle}>No Favorites Yet</Text>
        <Text style={styles.emptySubtitle}>
          Add your favorite streamers to see them here
        </Text>
        <TouchableOpacity style={styles.discoverButton} onPress={() => router.push('/')}>
          <LinearGradient
            colors={Theme.gradients.primary}
            style={styles.discoverGradient}
          >
            <Star size={16} color={Theme.colors.text.primary} />
            <Text style={styles.discoverText}>Discover Streamers</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Theme.gradients.background}
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
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
    gap: Theme.spacing.sm,
  },
  title: {
    color: Theme.colors.text.primary,
    fontSize: Theme.typography.title.fontSize,
    fontFamily: Theme.typography.title.fontFamily,
    letterSpacing: Theme.typography.title.letterSpacing,
  },
  subtitle: {
    color: Theme.colors.text.tertiary,
    fontSize: Theme.typography.body.fontSize,
    fontFamily: Theme.typography.body.fontFamily,
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
    padding: Theme.spacing.xxl,
    borderRadius: Theme.borderRadius.lg,
    marginHorizontal: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.background.tertiary,
  },
  emptyTitle: {
    color: Theme.colors.text.primary,
    fontSize: Theme.typography.subtitle.fontSize,
    fontFamily: Theme.typography.subtitle.fontFamily,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Theme.colors.text.tertiary,
    fontSize: Theme.typography.caption.fontSize,
    fontFamily: Theme.typography.caption.fontFamily,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Theme.spacing.xl,
  },
  discoverButton: {
    borderRadius: Theme.borderRadius.md,
    overflow: 'hidden',
  },
  discoverGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    gap: Theme.spacing.xs,
  },
  discoverText: {
    color: Theme.colors.text.primary,
    fontSize: Theme.typography.body.fontSize,
    fontFamily: Theme.typography.subtitle.fontFamily,
  },
});