import { LinearGradient } from 'expo-linear-gradient';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Music,
  Shuffle,
  SkipForward,
  SkipBack,
  Radio,
  Headphones,
  Speaker,
  Mic,
  Settings,
  BarChart3,
  Equalizer,
} from 'lucide-react-native';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Slider,
  Alert,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { TwitchStream } from '@/services/twitchApi';

interface AudioStreamState {
  streamId: string;
  streamName: string;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  isActive: boolean; // Currently playing audio
  quality: 'auto' | 'source' | '160k' | '128k' | '96k';
  latency: number;
  bitrate: number;
}

interface SynchronizedPlaybackControllerProps {
  streams: TwitchStream[];
  onStreamAudioToggle: (streamId: string, enabled: boolean) => void;
  onStreamVolumeChange: (streamId: string, volume: number) => void;
  onStreamQualityChange: (streamId: string, quality: string) => void;
  onSyncAll: () => void;
  onPauseAll: () => void;
  onPlayAll: () => void;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function SynchronizedPlaybackController({
  streams,
  onStreamAudioToggle,
  onStreamVolumeChange,
  onStreamQualityChange,
  onSyncAll,
  onPauseAll,
  onPlayAll,
}: SynchronizedPlaybackControllerProps) {
  const [audioStreams, setAudioStreams] = useState<AudioStreamState[]>([]);
  const [activeAudioStreamId, setActiveAudioStreamId] = useState<string | null>(null);
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [isAllPaused, setIsAllPaused] = useState(false);
  const [syncMode, setSyncMode] = useState<'single' | 'mixed' | 'crossfade'>('single');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [audioVisualization, setAudioVisualization] = useState<number[]>([]);
  const [crossfadeDuration, setCrossfadeDuration] = useState(2); // seconds

  // Animation values
  const controllerHeight = useSharedValue(80);
  const volumeBarsOpacity = useSharedValue(0);
  const syncIndicatorScale = useSharedValue(1);

  // Audio context simulation (would integrate with actual audio system)
  const audioContextRef = useRef<any>(null);
  const crossfadeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio streams from props
  useEffect(() => {
    const newAudioStreams: AudioStreamState[] = streams.map((stream, index) => ({
      streamId: stream.id,
      streamName: stream.user_name,
      isPlaying: true,
      isMuted: index !== 0, // First stream unmuted by default
      volume: 0.7,
      isActive: index === 0,
      quality: 'auto',
      latency: Math.random() * 100 + 50, // Simulated latency
      bitrate: Math.random() * 128 + 128, // Simulated bitrate
    }));

    setAudioStreams(newAudioStreams);
    setActiveAudioStreamId(newAudioStreams[0]?.streamId || null);
  }, [streams]);

  // Simulate audio visualization
  useEffect(() => {
    const interval = setInterval(() => {
      const newVisualization = Array.from({ length: 10 }, () => Math.random());
      setAudioVisualization(newVisualization);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Update controller height based on advanced view
  useEffect(() => {
    controllerHeight.value = withSpring(showAdvanced ? 280 : 80, {
      damping: 15,
      stiffness: 100,
    });
    volumeBarsOpacity.value = withTiming(showAdvanced ? 1 : 0, { duration: 300 });
  }, [showAdvanced]);

  const handleAudioStreamSwitch = useCallback(
    (streamId: string) => {
      if (syncMode === 'single') {
        // Switch to single stream audio
        setAudioStreams(prev =>
          prev.map(stream => ({
            ...stream,
            isMuted: stream.streamId !== streamId,
            isActive: stream.streamId === streamId,
          }))
        );
        setActiveAudioStreamId(streamId);

        // Notify parent component
        streams.forEach(stream => {
          onStreamAudioToggle(stream.id, stream.id === streamId);
        });

        // Haptic feedback
        syncIndicatorScale.value = withSpring(1.2, {}, () => {
          syncIndicatorScale.value = withSpring(1);
        });
      } else if (syncMode === 'crossfade') {
        // Implement crossfade logic
        handleCrossfade(activeAudioStreamId, streamId);
      }
    },
    [syncMode, activeAudioStreamId, streams, onStreamAudioToggle]
  );

  const handleCrossfade = useCallback(
    (fromStreamId: string | null, toStreamId: string) => {
      if (!fromStreamId || fromStreamId === toStreamId) {
        return;
      }

      const duration = crossfadeDuration * 1000;
      const steps = 20;
      const stepDuration = duration / steps;

      let currentStep = 0;

      const crossfade = () => {
        const progress = currentStep / steps;
        const fromVolume = Math.max(0, 1 - progress);
        const toVolume = Math.min(1, progress);

        setAudioStreams(prev =>
          prev.map(stream => {
            if (stream.streamId === fromStreamId) {
              return { ...stream, volume: fromVolume * masterVolume };
            } else if (stream.streamId === toStreamId) {
              return { ...stream, volume: toVolume * masterVolume, isMuted: false, isActive: true };
            }
            return stream;
          })
        );

        // Notify parent component
        onStreamVolumeChange(fromStreamId, fromVolume * masterVolume);
        onStreamVolumeChange(toStreamId, toVolume * masterVolume);

        currentStep++;

        if (currentStep <= steps) {
          crossfadeTimerRef.current = setTimeout(crossfade, stepDuration);
        } else {
          // Crossfade complete
          setAudioStreams(prev =>
            prev.map(stream => ({
              ...stream,
              isMuted: stream.streamId !== toStreamId,
              isActive: stream.streamId === toStreamId,
              volume: stream.streamId === toStreamId ? masterVolume : 0,
            }))
          );
          setActiveAudioStreamId(toStreamId);
        }
      };

      crossfade();
    },
    [crossfadeDuration, masterVolume, onStreamVolumeChange]
  );

  const handleMasterVolumeChange = useCallback(
    (volume: number) => {
      setMasterVolume(volume);

      // Apply to all active streams
      audioStreams.forEach(stream => {
        if (!stream.isMuted) {
          onStreamVolumeChange(stream.streamId, volume * stream.volume);
        }
      });
    },
    [audioStreams, onStreamVolumeChange]
  );

  const handleStreamVolumeChange = useCallback(
    (streamId: string, volume: number) => {
      setAudioStreams(prev =>
        prev.map(stream => (stream.streamId === streamId ? { ...stream, volume } : stream))
      );

      onStreamVolumeChange(streamId, volume * masterVolume);
    },
    [masterVolume, onStreamVolumeChange]
  );

  const handleToggleStreamMute = useCallback(
    (streamId: string) => {
      setAudioStreams(prev =>
        prev.map(stream =>
          stream.streamId === streamId ? { ...stream, isMuted: !stream.isMuted } : stream
        )
      );

      const stream = audioStreams.find(s => s.streamId === streamId);
      if (stream) {
        onStreamAudioToggle(streamId, stream.isMuted);
      }
    },
    [audioStreams, onStreamAudioToggle]
  );

  const handleSyncModeChange = useCallback(() => {
    const modes: (typeof syncMode)[] = ['single', 'mixed', 'crossfade'];
    const currentIndex = modes.indexOf(syncMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setSyncMode(nextMode);

    Alert.alert('Audio Mode Changed', `Switched to ${nextMode} audio mode`, [{ text: 'OK' }]);
  }, [syncMode]);

  const handleSyncAll = useCallback(() => {
    onSyncAll();
    syncIndicatorScale.value = withSpring(1.3, {}, () => {
      syncIndicatorScale.value = withSpring(1);
    });
  }, [onSyncAll]);

  const handlePauseAll = useCallback(() => {
    setIsAllPaused(true);
    setAudioStreams(prev => prev.map(stream => ({ ...stream, isPlaying: false })));
    onPauseAll();
  }, [onPauseAll]);

  const handlePlayAll = useCallback(() => {
    setIsAllPaused(false);
    setAudioStreams(prev => prev.map(stream => ({ ...stream, isPlaying: true })));
    onPlayAll();
  }, [onPlayAll]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    height: controllerHeight.value,
  }));

  const animatedVolumeBarsStyle = useAnimatedStyle(() => ({
    opacity: volumeBarsOpacity.value,
  }));

  const animatedSyncIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scale: syncIndicatorScale.value }],
  }));

  const renderAudioVisualization = () => (
    <View style={styles.visualizationContainer}>
      {audioVisualization.map((level, index) => (
        <Animated.View
          key={index}
          style={[
            styles.visualizationBar,
            {
              height: interpolate(level, [0, 1], [2, 20]),
              backgroundColor: level > 0.7 ? '#EF4444' : level > 0.4 ? '#F59E0B' : '#22C55E',
            },
          ]}
        />
      ))}
    </View>
  );

  const renderStreamAudioControl = (stream: AudioStreamState) => (
    <View key={stream.streamId} style={styles.streamAudioControl}>
      <TouchableOpacity
        style={[styles.streamAudioButton, stream.isActive && styles.activeStreamAudioButton]}
        onPress={() => handleAudioStreamSwitch(stream.streamId)}
      >
        <LinearGradient
          colors={
            stream.isActive
              ? ['#22C55E', '#16A34A']
              : stream.isMuted
                ? ['#6B7280', '#4B5563']
                : ['#8B5CF6', '#7C3AED']
          }
          style={styles.streamAudioGradient}
        >
          {stream.isActive ? (
            <Radio size={16} color="#fff" />
          ) : stream.isMuted ? (
            <VolumeX size={16} color="#fff" />
          ) : (
            <Volume2 size={16} color="#fff" />
          )}
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.streamAudioInfo}>
        <Text style={styles.streamAudioName} numberOfLines={1}>
          {stream.streamName}
        </Text>
        <Text style={styles.streamAudioStats}>
          {stream.bitrate.toFixed(0)}kbps • {stream.latency.toFixed(0)}ms
        </Text>
      </View>

      {showAdvanced && (
        <View style={styles.streamAudioControls}>
          <TouchableOpacity
            style={styles.muteButton}
            onPress={() => handleToggleStreamMute(stream.streamId)}
          >
            {stream.isMuted ? (
              <VolumeX size={12} color="#666" />
            ) : (
              <Volume2 size={12} color="#8B5CF6" />
            )}
          </TouchableOpacity>

          <View style={styles.volumeSliderContainer}>
            <Slider
              style={styles.volumeSlider}
              minimumValue={0}
              maximumValue={1}
              value={stream.volume}
              onValueChange={value => handleStreamVolumeChange(stream.streamId, value)}
              minimumTrackTintColor="#8B5CF6"
              maximumTrackTintColor="#333"
              thumbTintColor="#8B5CF6"
            />
          </View>
        </View>
      )}
    </View>
  );

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <LinearGradient
        colors={['rgba(26, 26, 26, 0.98)', 'rgba(15, 15, 15, 0.95)']}
        style={styles.background}
      >
        {/* Main playback controls */}
        <View style={styles.mainControls}>
          <View style={styles.playbackControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={isAllPaused ? handlePlayAll : handlePauseAll}
            >
              <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.controlGradient}>
                {isAllPaused ? <Play size={20} color="#fff" /> : <Pause size={20} color="#fff" />}
              </LinearGradient>
            </TouchableOpacity>

            <AnimatedTouchableOpacity
              style={[styles.controlButton, animatedSyncIndicatorStyle]}
              onPress={handleSyncAll}
            >
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.controlGradient}>
                <Shuffle size={20} color="#fff" />
              </LinearGradient>
            </AnimatedTouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={handleSyncModeChange}>
              <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.controlGradient}>
                {syncMode === 'single' && <Headphones size={20} color="#fff" />}
                {syncMode === 'mixed' && <Speaker size={20} color="#fff" />}
                {syncMode === 'crossfade' && <Music size={20} color="#fff" />}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.audioInfo}>
            {renderAudioVisualization()}
            <Text style={styles.audioModeText}>{syncMode.toUpperCase()} MODE</Text>
          </View>

          <View style={styles.masterControls}>
            <TouchableOpacity
              style={styles.advancedToggle}
              onPress={() => setShowAdvanced(!showAdvanced)}
            >
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.2)', 'rgba(124, 58, 237, 0.2)']}
                style={styles.advancedGradient}
              >
                <Settings size={16} color="#8B5CF6" />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.masterVolumeContainer}>
              <Volume1 size={16} color="#8B5CF6" />
              <Slider
                style={styles.masterVolumeSlider}
                minimumValue={0}
                maximumValue={1}
                value={masterVolume}
                onValueChange={handleMasterVolumeChange}
                minimumTrackTintColor="#8B5CF6"
                maximumTrackTintColor="#333"
                thumbTintColor="#8B5CF6"
              />
              <Text style={styles.volumeText}>{Math.round(masterVolume * 100)}%</Text>
            </View>
          </View>
        </View>

        {/* Stream audio controls */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.streamAudioContainer}
          contentContainerStyle={styles.streamAudioContent}
        >
          {audioStreams.map(renderStreamAudioControl)}
        </ScrollView>

        {/* Advanced controls */}
        {showAdvanced && (
          <Animated.View style={[styles.advancedControls, animatedVolumeBarsStyle]}>
            <View style={styles.advancedSection}>
              <Text style={styles.sectionTitle}>Crossfade Duration</Text>
              <Slider
                style={styles.crossfadeSlider}
                minimumValue={1}
                maximumValue={10}
                value={crossfadeDuration}
                onValueChange={setCrossfadeDuration}
                step={1}
                minimumTrackTintColor="#8B5CF6"
                maximumTrackTintColor="#333"
                thumbTintColor="#8B5CF6"
              />
              <Text style={styles.sliderValue}>{crossfadeDuration}s</Text>
            </View>

            <View style={styles.audioStats}>
              <Text style={styles.statsTitle}>Audio Statistics</Text>
              <View style={styles.statsGrid}>
                <Text style={styles.statItem}>
                  Active: {audioStreams.filter(s => s.isActive).length}
                </Text>
                <Text style={styles.statItem}>Total: {audioStreams.length}</Text>
                <Text style={styles.statItem}>
                  Avg Latency:{' '}
                  {Math.round(
                    audioStreams.reduce((acc, s) => acc + s.latency, 0) / audioStreams.length
                  )}
                  ms
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 12,
    marginBottom: 12,
  },
  background: {
    flex: 1,
    padding: 16,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  playbackControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  controlGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  visualizationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 24,
    marginBottom: 4,
  },
  visualizationBar: {
    width: 3,
    borderRadius: 1.5,
    minHeight: 2,
  },
  audioModeText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
    letterSpacing: 0.5,
  },
  masterControls: {
    alignItems: 'center',
    gap: 8,
  },
  advancedToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  advancedGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterVolumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 120,
  },
  masterVolumeSlider: {
    flex: 1,
    height: 20,
  },
  volumeText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
    minWidth: 32,
    textAlign: 'right',
  },
  streamAudioContainer: {
    maxHeight: 60,
  },
  streamAudioContent: {
    gap: 12,
    paddingHorizontal: 4,
  },
  streamAudioControl: {
    alignItems: 'center',
    gap: 6,
    minWidth: 80,
  },
  streamAudioButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  activeStreamAudioButton: {
    // Additional styling for active state
  },
  streamAudioGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamAudioInfo: {
    alignItems: 'center',
  },
  streamAudioName: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    textAlign: 'center',
  },
  streamAudioStats: {
    fontSize: 8,
    fontFamily: 'Inter-Regular',
    color: '#666',
    textAlign: 'center',
  },
  streamAudioControls: {
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  muteButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeSliderContainer: {
    width: 60,
  },
  volumeSlider: {
    width: 60,
    height: 16,
  },
  advancedControls: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  advancedSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  crossfadeSlider: {
    width: '100%',
    height: 20,
  },
  sliderValue: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#fff',
    textAlign: 'center',
    marginTop: 4,
  },
  audioStats: {
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#999',
    marginBottom: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    fontSize: 9,
    fontFamily: 'Inter-Regular',
    color: '#666',
  },
});
