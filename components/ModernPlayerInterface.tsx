/**
 * Modern Player Interface Component
 * Provides a modern, interactive interface for stream players
 */

import { Play, Pause, Volume2, Settings, Maximize } from 'lucide-react-native';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ModernPlayerInterfaceProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onVolumeToggle: () => void;
  onSettings: () => void;
  onFullscreen: () => void;
  streamTitle?: string;
  viewerCount?: number;
}

export const ModernPlayerInterface: React.FC<ModernPlayerInterfaceProps> = ({
  isPlaying,
  onPlayPause,
  onVolumeToggle,
  onSettings,
  onFullscreen,
  streamTitle,
  viewerCount,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <Text style={styles.title}>{streamTitle || 'Live Stream'}</Text>
          <Text style={styles.viewers}>{viewerCount?.toLocaleString() || '0'} viewers</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={onPlayPause}>
            {isPlaying ? <Pause size={24} color="#fff" /> : <Play size={24} color="#fff" />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={onVolumeToggle}>
            <Volume2 size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={onSettings}>
            <Settings size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={onFullscreen}>
            <Maximize size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
    padding: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  viewers: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ModernPlayerInterface;
