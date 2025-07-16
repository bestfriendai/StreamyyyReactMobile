import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Grid3X3, Play } from 'lucide-react-native';
import { useStreamStore } from '@/store/StreamStore';

const { width } = Dimensions.get('window');

export default function StreamsScreen() {
  const { activeStreams, removeStream } = useStreamStore();

  const getGridLayout = () => {
    const count = activeStreams.length;
    if (count <= 1) return { cols: 1, rows: 1 };
    if (count <= 4) return { cols: 2, rows: 2 };
    if (count <= 6) return { cols: 2, rows: 3 };
    return { cols: 3, rows: 3 };
  };

  const { cols, rows } = getGridLayout();
  const streamWidth = (width - 32 - (cols - 1) * 8) / cols;
  const streamHeight = streamWidth * 0.56; // 16:9 aspect ratio

  const renderStream = (stream: any, index: number) => (
    <View
      key={stream.id}
      style={[
        styles.streamContainer,
        {
          width: streamWidth,
          height: streamHeight,
          marginRight: (index + 1) % cols === 0 ? 0 : 8,
          marginBottom: 8,
        },
      ]}
    >
      {/* Stream Player Placeholder */}
      <View style={styles.streamPlayer}>
        <Play size={32} color="#8B5CF6" />
        <Text style={styles.streamPlayerText}>Stream Player</Text>
      </View>

      {/* Stream Info Overlay */}
      <View style={styles.streamOverlay}>
        <View style={styles.streamInfo}>
          <Text style={styles.streamName} numberOfLines={1}>
            {stream.user_name}
          </Text>
          <Text style={styles.streamGame} numberOfLines={1}>
            {stream.game_name}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeStream(stream.id)}
        >
          <X size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (activeStreams.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Multi-Stream</Text>
          <Text style={styles.headerSubtitle}>View multiple streams at once</Text>
        </View>
        
        <View style={styles.emptyState}>
          <Grid3X3 size={64} color="#333" />
          <Text style={styles.emptyTitle}>No Active Streams</Text>
          <Text style={styles.emptySubtitle}>
            Add streams from the Discover tab to start your multi-view experience
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Multi-Stream</Text>
        <Text style={styles.headerSubtitle}>
          {activeStreams.length} stream{activeStreams.length !== 1 ? 's' : ''} active
        </Text>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {activeStreams.map((stream, index) => renderStream(stream, index))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  scrollContainer: {
    flex: 1,
  },
  gridContainer: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  streamContainer: {
    backgroundColor: '#111',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
    position: 'relative',
  },
  streamPlayer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streamPlayerText: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  streamOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  streamInfo: {
    flex: 1,
  },
  streamName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  streamGame: {
    color: '#8B5CF6',
    fontSize: 10,
  },
  removeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});