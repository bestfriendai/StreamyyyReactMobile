import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export interface AudioStream {
  id: string;
  streamId: string;
  streamName: string;
  audioUri?: string;
  volume: number;
  isMuted: boolean;
  isActive: boolean;
  quality: 'auto' | 'source' | '160k' | '128k' | '96k';
  bitrate: number;
  latency: number;
  status: 'loading' | 'playing' | 'paused' | 'error';
}

export interface AudioMixingSettings {
  masterVolume: number;
  audioMode: 'single' | 'mixed' | 'crossfade';
  crossfadeDuration: number; // seconds
  enableSpatialAudio: boolean;
  enableAudioVisualization: boolean;
  audioCompressionEnabled: boolean;
  lowLatencyMode: boolean;
  backgroundAudioEnabled: boolean;
}

export interface AudioVisualizationData {
  levels: number[]; // 0-1 range for each frequency band
  peak: number;
  rms: number;
  timestamp: number;
}

export type AudioMixingEventType = 
  | 'streamAdded'
  | 'streamRemoved'
  | 'streamStatusChanged'
  | 'activeStreamChanged'
  | 'volumeChanged'
  | 'visualizationData'
  | 'crossfadeStarted'
  | 'crossfadeCompleted'
  | 'error';

export interface AudioMixingEvent {
  type: AudioMixingEventType;
  streamId?: string;
  data?: any;
  timestamp: number;
}

class AudioMixingService {
  private streams: Map<string, AudioStream> = new Map();
  private activeStreamId: string | null = null;
  private settings: AudioMixingSettings = {
    masterVolume: 0.7,
    audioMode: 'single',
    crossfadeDuration: 2,
    enableSpatialAudio: false,
    enableAudioVisualization: true,
    audioCompressionEnabled: true,
    lowLatencyMode: false,
    backgroundAudioEnabled: false,
  };
  
  private eventListeners: Map<AudioMixingEventType, ((event: AudioMixingEvent) => void)[]> = new Map();
  private crossfadeTimer: NodeJS.Timeout | null = null;
  private visualizationTimer: NodeJS.Timeout | null = null;
  private audioContext: any = null; // Web Audio API context
  private audioNodes: Map<string, any> = new Map(); // Audio nodes for each stream
  
  constructor() {
    this.initializeAudioSystem();
    this.startVisualization();
  }

  private async initializeAudioSystem(): Promise<void> {
    try {
      // Configure audio session for React Native
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: this.settings.backgroundAudioEnabled,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      // Initialize Web Audio API for advanced features (web platform)
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          this.audioContext = new AudioContext();
        }
      }
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
      this.emitEvent('error', undefined, { error: 'Audio system initialization failed' });
    }
  }

  // Event system
  public addEventListener(eventType: AudioMixingEventType, listener: (event: AudioMixingEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  public removeEventListener(eventType: AudioMixingEventType, listener: (event: AudioMixingEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(type: AudioMixingEventType, streamId?: string, data?: any): void {
    const event: AudioMixingEvent = {
      type,
      streamId,
      data,
      timestamp: Date.now(),
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in audio mixing event listener:', error);
        }
      });
    }
  }

  // Stream management
  public async addStream(streamId: string, streamName: string, audioUri?: string): Promise<AudioStream> {
    const audioStream: AudioStream = {
      id: `audio_${streamId}_${Date.now()}`,
      streamId,
      streamName,
      audioUri,
      volume: this.settings.masterVolume,
      isMuted: this.streams.size > 0, // Mute new streams if others exist
      isActive: this.streams.size === 0, // First stream is active
      quality: 'auto',
      bitrate: 128,
      latency: Math.random() * 100 + 50, // Simulated latency
      status: 'loading',
    };

    this.streams.set(streamId, audioStream);

    // Set as active if it's the first stream
    if (this.streams.size === 1) {
      this.activeStreamId = streamId;
    }

    // Create audio node for web
    if (this.audioContext && audioUri) {
      await this.createAudioNode(streamId, audioUri);
    }

    this.emitEvent('streamAdded', streamId, audioStream);
    return audioStream;
  }

  public removeStream(streamId: string): boolean {
    const stream = this.streams.get(streamId);
    if (!stream) return false;

    // Clean up audio node
    this.cleanupAudioNode(streamId);

    this.streams.delete(streamId);

    // Switch active stream if needed
    if (this.activeStreamId === streamId) {
      const remainingStreams = Array.from(this.streams.keys());
      this.activeStreamId = remainingStreams.length > 0 ? remainingStreams[0] : null;
      
      if (this.activeStreamId) {
        this.setStreamActive(this.activeStreamId, true);
      }
    }

    this.emitEvent('streamRemoved', streamId, stream);
    return true;
  }

  public getStream(streamId: string): AudioStream | undefined {
    return this.streams.get(streamId);
  }

  public getAllStreams(): AudioStream[] {
    return Array.from(this.streams.values());
  }

  public getActiveStream(): AudioStream | null {
    return this.activeStreamId ? this.streams.get(this.activeStreamId) || null : null;
  }

  // Audio control methods
  public async setStreamVolume(streamId: string, volume: number): Promise<void> {
    const stream = this.streams.get(streamId);
    if (!stream) return;

    const clampedVolume = Math.max(0, Math.min(1, volume));
    stream.volume = clampedVolume;

    // Apply volume to audio node
    const audioNode = this.audioNodes.get(streamId);
    if (audioNode && audioNode.gainNode) {
      audioNode.gainNode.gain.value = stream.isMuted ? 0 : clampedVolume * this.settings.masterVolume;
    }

    this.emitEvent('volumeChanged', streamId, { volume: clampedVolume });
  }

  public async setStreamMuted(streamId: string, muted: boolean): Promise<void> {
    const stream = this.streams.get(streamId);
    if (!stream) return;

    stream.isMuted = muted;

    // Apply mute to audio node
    const audioNode = this.audioNodes.get(streamId);
    if (audioNode && audioNode.gainNode) {
      audioNode.gainNode.gain.value = muted ? 0 : stream.volume * this.settings.masterVolume;
    }

    this.emitEvent('streamStatusChanged', streamId, { muted });
  }

  public async setStreamActive(streamId: string, active: boolean): Promise<void> {
    const stream = this.streams.get(streamId);
    if (!stream) return;

    if (this.settings.audioMode === 'single') {
      // In single mode, only one stream can be active
      if (active) {
        // Deactivate all other streams
        for (const [id, s] of this.streams) {
          if (id !== streamId) {
            s.isActive = false;
            s.isMuted = true;
            this.applyStreamAudioSettings(id);
          }
        }
        this.activeStreamId = streamId;
      }
    }

    stream.isActive = active;
    if (active && this.settings.audioMode === 'single') {
      stream.isMuted = false;
    }

    this.applyStreamAudioSettings(streamId);
    this.emitEvent('activeStreamChanged', streamId, { active });
  }

  public async switchActiveStream(fromStreamId: string | null, toStreamId: string): Promise<void> {
    if (this.settings.audioMode === 'crossfade' && fromStreamId) {
      await this.performCrossfade(fromStreamId, toStreamId);
    } else {
      await this.setStreamActive(toStreamId, true);
    }
  }

  // Master controls
  public async setMasterVolume(volume: number): Promise<void> {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.settings.masterVolume = clampedVolume;

    // Apply to all active streams
    for (const [streamId, stream] of this.streams) {
      if (!stream.isMuted) {
        this.applyStreamAudioSettings(streamId);
      }
    }

    this.emitEvent('volumeChanged', undefined, { masterVolume: clampedVolume });
  }

  public async pauseAll(): Promise<void> {
    for (const [streamId, stream] of this.streams) {
      stream.status = 'paused';
      const audioNode = this.audioNodes.get(streamId);
      if (audioNode && audioNode.source) {
        try {
          audioNode.source.pause?.();
        } catch (error) {
          console.warn('Error pausing stream:', streamId, error);
        }
      }
    }
  }

  public async playAll(): Promise<void> {
    for (const [streamId, stream] of this.streams) {
      stream.status = 'playing';
      const audioNode = this.audioNodes.get(streamId);
      if (audioNode && audioNode.source) {
        try {
          audioNode.source.play?.();
        } catch (error) {
          console.warn('Error playing stream:', streamId, error);
        }
      }
    }
  }

  public async syncAll(): Promise<void> {
    // Implement synchronization logic
    const activeStream = this.getActiveStream();
    if (!activeStream) return;

    // In a real implementation, this would sync playback positions
    // For now, we'll simulate by restarting all streams
    for (const [streamId, stream] of this.streams) {
      if (stream.isActive) {
        stream.status = 'playing';
        this.emitEvent('streamStatusChanged', streamId, { status: 'synced' });
      }
    }
  }

  // Crossfade functionality
  private async performCrossfade(fromStreamId: string, toStreamId: string): Promise<void> {
    const fromStream = this.streams.get(fromStreamId);
    const toStream = this.streams.get(toStreamId);
    
    if (!fromStream || !toStream) return;

    this.emitEvent('crossfadeStarted', undefined, { fromStreamId, toStreamId });

    const duration = this.settings.crossfadeDuration * 1000;
    const steps = 50;
    const stepDuration = duration / steps;

    let currentStep = 0;

    const crossfadeStep = () => {
      const progress = currentStep / steps;
      const fromVolume = Math.max(0, 1 - progress);
      const toVolume = Math.min(1, progress);

      // Apply crossfade volumes
      this.setStreamVolume(fromStreamId, fromStream.volume * fromVolume);
      this.setStreamVolume(toStreamId, toStream.volume * toVolume);

      // Ensure target stream is unmuted
      if (currentStep === 0) {
        this.setStreamMuted(toStreamId, false);
        toStream.isActive = true;
      }

      currentStep++;

      if (currentStep <= steps) {
        this.crossfadeTimer = setTimeout(crossfadeStep, stepDuration);
      } else {
        // Crossfade complete
        fromStream.isMuted = true;
        fromStream.isActive = false;
        toStream.isActive = true;
        this.activeStreamId = toStreamId;

        this.emitEvent('crossfadeCompleted', undefined, { fromStreamId, toStreamId });
      }
    };

    crossfadeStep();
  }

  // Audio quality management
  public async setStreamQuality(streamId: string, quality: AudioStream['quality']): Promise<void> {
    const stream = this.streams.get(streamId);
    if (!stream) return;

    stream.quality = quality;
    
    // Update bitrate based on quality
    switch (quality) {
      case 'source':
        stream.bitrate = 320;
        break;
      case '160k':
        stream.bitrate = 160;
        break;
      case '128k':
        stream.bitrate = 128;
        break;
      case '96k':
        stream.bitrate = 96;
        break;
      default:
        stream.bitrate = 128;
    }

    this.emitEvent('streamStatusChanged', streamId, { quality, bitrate: stream.bitrate });
  }

  // Audio visualization
  private startVisualization(): void {
    if (!this.settings.enableAudioVisualization) return;

    this.visualizationTimer = setInterval(() => {
      const activeStream = this.getActiveStream();
      if (!activeStream || activeStream.isMuted) return;

      // Generate mock visualization data
      const levels = Array.from({ length: 10 }, () => Math.random() * (activeStream.volume || 0));
      const peak = Math.max(...levels);
      const rms = Math.sqrt(levels.reduce((sum, level) => sum + level * level, 0) / levels.length);

      const visualizationData: AudioVisualizationData = {
        levels,
        peak,
        rms,
        timestamp: Date.now(),
      };

      this.emitEvent('visualizationData', activeStream.streamId, visualizationData);
    }, 100);
  }

  public getVisualizationData(): AudioVisualizationData | null {
    const activeStream = this.getActiveStream();
    if (!activeStream || activeStream.isMuted) return null;

    // Return current visualization data
    const levels = Array.from({ length: 10 }, () => Math.random() * activeStream.volume);
    const peak = Math.max(...levels);
    const rms = Math.sqrt(levels.reduce((sum, level) => sum + level * level, 0) / levels.length);

    return {
      levels,
      peak,
      rms,
      timestamp: Date.now(),
    };
  }

  // Settings management
  public updateSettings(newSettings: Partial<AudioMixingSettings>): void {
    this.settings = { ...this.settings, ...newSettings };

    // Apply settings changes
    if ('enableAudioVisualization' in newSettings) {
      if (newSettings.enableAudioVisualization) {
        this.startVisualization();
      } else if (this.visualizationTimer) {
        clearInterval(this.visualizationTimer);
        this.visualizationTimer = null;
      }
    }

    if ('masterVolume' in newSettings) {
      this.setMasterVolume(newSettings.masterVolume!);
    }
  }

  public getSettings(): AudioMixingSettings {
    return { ...this.settings };
  }

  // Web Audio API helpers
  private async createAudioNode(streamId: string, audioUri: string): Promise<void> {
    if (!this.audioContext) return;

    try {
      const audio = new window.Audio(audioUri);
      const source = this.audioContext.createMediaElementSource(audio);
      const gainNode = this.audioContext.createGain();
      const analyser = this.audioContext.createAnalyser();

      // Connect audio graph
      source.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(this.audioContext.destination);

      // Configure analyser for visualization
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      this.audioNodes.set(streamId, {
        audio,
        source,
        gainNode,
        analyser,
      });

    } catch (error) {
      console.error('Failed to create audio node for stream:', streamId, error);
    }
  }

  private cleanupAudioNode(streamId: string): void {
    const audioNode = this.audioNodes.get(streamId);
    if (audioNode) {
      try {
        audioNode.source?.disconnect();
        audioNode.gainNode?.disconnect();
        audioNode.analyser?.disconnect();
        audioNode.audio?.pause();
      } catch (error) {
        console.warn('Error cleaning up audio node:', error);
      }
      this.audioNodes.delete(streamId);
    }
  }

  private applyStreamAudioSettings(streamId: string): void {
    const stream = this.streams.get(streamId);
    const audioNode = this.audioNodes.get(streamId);
    
    if (!stream || !audioNode) return;

    if (audioNode.gainNode) {
      const finalVolume = stream.isMuted ? 0 : stream.volume * this.settings.masterVolume;
      audioNode.gainNode.gain.value = finalVolume;
    }
  }

  // Cleanup
  public dispose(): void {
    // Clear timers
    if (this.crossfadeTimer) {
      clearTimeout(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }

    if (this.visualizationTimer) {
      clearInterval(this.visualizationTimer);
      this.visualizationTimer = null;
    }

    // Cleanup audio nodes
    for (const streamId of this.audioNodes.keys()) {
      this.cleanupAudioNode(streamId);
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Clear streams and listeners
    this.streams.clear();
    this.eventListeners.clear();
  }

  // Statistics and monitoring
  public getAudioStatistics() {
    const activeStreams = Array.from(this.streams.values()).filter(s => s.isActive);
    const totalStreams = this.streams.size;
    const averageLatency = totalStreams > 0 
      ? Array.from(this.streams.values()).reduce((sum, s) => sum + s.latency, 0) / totalStreams 
      : 0;
    const averageBitrate = totalStreams > 0
      ? Array.from(this.streams.values()).reduce((sum, s) => sum + s.bitrate, 0) / totalStreams
      : 0;

    return {
      totalStreams,
      activeStreams: activeStreams.length,
      averageLatency: Math.round(averageLatency),
      averageBitrate: Math.round(averageBitrate),
      masterVolume: this.settings.masterVolume,
      audioMode: this.settings.audioMode,
      activeStreamId: this.activeStreamId,
    };
  }
}

// Create and export singleton instance
export const audioMixingService = new AudioMixingService();