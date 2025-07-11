import { EventEmitter } from 'eventemitter3';
import { webSocketService, WebSocketMessage } from './webSocketService';
import { logError, logDebug, withErrorHandling } from '@/utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VoiceChatRoom {
  id: string;
  name: string;
  description?: string;
  type: RoomType;
  hostId: string;
  hostUsername: string;
  participants: VoiceParticipant[];
  settings: VoiceChatSettings;
  permissions: RoomPermissions;
  status: RoomStatus;
  maxParticipants: number;
  currentParticipants: number;
  quality: AudioQuality;
  bitrate: number;
  isRecording: boolean;
  recordingUrl?: string;
  createdAt: string;
  updatedAt: string;
  statistics: VoiceChatStatistics;
  moderators: string[];
  bannedUsers: string[];
  inviteOnly: boolean;
  password?: string;
  linkedStreamId?: string;
  linkedRoomId?: string;
}

export type RoomType = 'open' | 'private' | 'stream_party' | 'gaming' | 'study' | 'music' | 'conference' | 'casual';

export type RoomStatus = 'active' | 'paused' | 'ended' | 'waiting';

export interface VoiceParticipant {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: ParticipantRole;
  permissions: ParticipantPermissions;
  audioState: AudioState;
  connectionState: ConnectionState;
  joinedAt: string;
  lastActiveAt: string;
  talkTime: number;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  networkQuality: NetworkQuality;
  deviceInfo: AudioDeviceInfo;
  position?: SpatialPosition;
  status: ParticipantStatus;
}

export type ParticipantRole = 'host' | 'co_host' | 'moderator' | 'speaker' | 'listener' | 'guest';

export type ParticipantStatus = 'connected' | 'connecting' | 'disconnecting' | 'reconnecting' | 'away';

export interface ParticipantPermissions {
  canSpeak: boolean;
  canMute: boolean;
  canDeafen: boolean;
  canInvite: boolean;
  canKick: boolean;
  canBan: boolean;
  canRecord: boolean;
  canModerate: boolean;
  canChangeSettings: boolean;
  canManageRoles: boolean;
  canUseSpatialAudio: boolean;
  canShareScreen: boolean;
  canUseEffects: boolean;
}

export interface AudioState {
  isMuted: boolean;
  isDeafened: boolean;
  volume: number;
  inputGain: number;
  outputGain: number;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  sampleRate: number;
  channels: number;
  codec: AudioCodec;
  effects: AudioEffect[];
}

export type AudioCodec = 'opus' | 'aac' | 'mp3' | 'pcm';

export interface AudioEffect {
  id: string;
  type: EffectType;
  name: string;
  isEnabled: boolean;
  parameters: Record<string, number>;
  preset?: string;
}

export type EffectType = 
  | 'reverb'
  | 'echo'
  | 'pitch_shift'
  | 'distortion'
  | 'chorus'
  | 'compressor'
  | 'equalizer'
  | 'noise_gate'
  | 'limiter'
  | 'voice_changer'
  | 'auto_tune'
  | 'custom';

export interface ConnectionState {
  isConnected: boolean;
  connectionQuality: ConnectionQuality;
  latency: number;
  jitter: number;
  packetLoss: number;
  bandwidth: number;
  protocol: 'webrtc' | 'websocket' | 'udp';
  region: string;
  server: string;
  encryption: boolean;
  lastPingTime: number;
  reconnectAttempts: number;
}

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor';

export interface AudioDeviceInfo {
  inputDevice: AudioDevice;
  outputDevice: AudioDevice;
  availableInputDevices: AudioDevice[];
  availableOutputDevices: AudioDevice[];
  supportsEchoCancellation: boolean;
  supportsNoiseSuppression: boolean;
  supportsAutoGainControl: boolean;
  supportsSpatialAudio: boolean;
}

export interface AudioDevice {
  id: string;
  name: string;
  type: 'microphone' | 'speaker' | 'headphones' | 'bluetooth' | 'usb' | 'builtin';
  isDefault: boolean;
  channels: number;
  sampleRates: number[];
  latency: number;
  isWireless: boolean;
  batteryLevel?: number;
}

export interface SpatialPosition {
  x: number;
  y: number;
  z: number;
  orientation: {
    yaw: number;
    pitch: number;
    roll: number;
  };
  distance: number;
  volume: number;
}

export interface VoiceChatSettings {
  allowSpatialAudio: boolean;
  enableNoiseSuppression: boolean;
  enableEchoCancellation: boolean;
  enableAutoGainControl: boolean;
  maxParticipants: number;
  defaultVolume: number;
  pushToTalk: boolean;
  voiceActivation: boolean;
  voiceActivationThreshold: number;
  allowRecording: boolean;
  allowEffects: boolean;
  allowScreenShare: boolean;
  moderationMode: ModerationMode;
  autoMuteModerators: boolean;
  autoMuteNewJoins: boolean;
  handRaiseEnabled: boolean;
  timeoutSettings: TimeoutSettings;
  qualitySettings: QualitySettings;
  privacySettings: PrivacySettings;
}

export type ModerationMode = 'open' | 'moderated' | 'strict';

export interface TimeoutSettings {
  maxTalkTime: number; // seconds
  silenceTimeout: number; // seconds
  idleTimeout: number; // seconds
  autoKickTimeout: number; // seconds
}

export interface QualitySettings {
  audioQuality: AudioQuality;
  bitrate: number;
  sampleRate: number;
  adaptiveBitrate: boolean;
  lowLatencyMode: boolean;
  enhancedAudio: boolean;
}

export type AudioQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface PrivacySettings {
  recordConversations: boolean;
  saveAudioData: boolean;
  allowAnalytics: boolean;
  sharePresence: boolean;
  allowInvites: boolean;
  requirePermissionToJoin: boolean;
}

export interface RoomPermissions {
  joinPermission: 'everyone' | 'followers' | 'friends' | 'invited' | 'custom';
  speakPermission: 'everyone' | 'moderators' | 'invited' | 'custom';
  moderatePermission: 'host' | 'co_hosts' | 'moderators' | 'custom';
  recordPermission: 'host' | 'moderators' | 'everyone' | 'none';
  invitePermission: 'everyone' | 'moderators' | 'host' | 'none';
  customPermissions: CustomPermission[];
}

export interface CustomPermission {
  id: string;
  name: string;
  description: string;
  users: string[];
  roles: ParticipantRole[];
  actions: string[];
}

export interface VoiceChatStatistics {
  totalParticipants: number;
  peakParticipants: number;
  totalTalkTime: number;
  averageTalkTime: number;
  totalDuration: number;
  audioQualityScore: number;
  connectionScore: number;
  engagementScore: number;
  participantRetention: number;
  topSpeakers: Array<{ userId: string; username: string; talkTime: number }>;
  qualityMetrics: QualityMetrics;
  networkMetrics: NetworkMetrics;
  userInteractions: number;
  moderationActions: number;
  recordingTime: number;
}

export interface QualityMetrics {
  averageLatency: number;
  averageJitter: number;
  averagePacketLoss: number;
  audioDropouts: number;
  reconnections: number;
  qualityIssues: number;
}

export interface NetworkMetrics {
  averageBandwidth: number;
  peakBandwidth: number;
  dataTransferred: number;
  serverLoad: number;
  regionDistribution: Record<string, number>;
}

export interface VoiceChatEvent {
  id: string;
  type: VoiceChatEventType;
  roomId: string;
  userId?: string;
  username?: string;
  data: any;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
  isPublic: boolean;
}

export type VoiceChatEventType = 
  | 'participant_joined'
  | 'participant_left'
  | 'participant_muted'
  | 'participant_unmuted'
  | 'participant_deafened'
  | 'participant_undeafened'
  | 'participant_started_speaking'
  | 'participant_stopped_speaking'
  | 'participant_role_changed'
  | 'room_settings_changed'
  | 'recording_started'
  | 'recording_stopped'
  | 'room_created'
  | 'room_ended'
  | 'connection_quality_changed'
  | 'audio_device_changed'
  | 'effect_applied'
  | 'moderation_action'
  | 'hand_raised'
  | 'hand_lowered'
  | 'spatial_position_changed';

export interface VoiceRecording {
  id: string;
  roomId: string;
  filename: string;
  duration: number;
  size: number;
  quality: AudioQuality;
  format: 'mp3' | 'wav' | 'ogg' | 'aac';
  participants: string[];
  startedAt: string;
  endedAt: string;
  url?: string;
  isProcessing: boolean;
  isPublic: boolean;
  transcription?: string;
  highlights?: RecordingHighlight[];
  metadata: RecordingMetadata;
}

export interface RecordingHighlight {
  id: string;
  timestamp: number;
  duration: number;
  type: 'funny' | 'important' | 'question' | 'answer' | 'reaction' | 'custom';
  title: string;
  description?: string;
  participants: string[];
  tags: string[];
}

export interface RecordingMetadata {
  sampleRate: number;
  bitrate: number;
  channels: number;
  codec: string;
  compression: string;
  checksum: string;
  encryptionKey?: string;
}

class VoiceChatService extends EventEmitter {
  private currentRoom: VoiceChatRoom | null = null;
  private currentParticipant: VoiceParticipant | null = null;
  private audioDevices: AudioDeviceInfo | null = null;
  private connectionState: ConnectionState | null = null;
  private recordings: Map<string, VoiceRecording> = new Map();
  private availableRooms: Map<string, VoiceChatRoom> = new Map();
  private audioStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private currentUserId: string | null = null;
  private currentUsername: string | null = null;
  private isInitialized: boolean = false;
  private qualityMonitorTimer: NodeJS.Timeout | null = null;
  private deviceMonitorTimer: NodeJS.Timeout | null = null;
  private speakingDetectionTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * Initialize voice chat service
   */
  async initialize(userId: string, username: string): Promise<void> {
    return withErrorHandling(async () => {
      logDebug('Initializing voice chat service', { userId, username });
      
      this.currentUserId = userId;
      this.currentUsername = username;
      
      // Check for audio support
      if (!this.isAudioSupported()) {
        throw new Error('Audio is not supported on this device');
      }
      
      // Initialize audio context
      await this.initializeAudioContext();
      
      // Detect audio devices
      await this.detectAudioDevices();
      
      // Load settings
      await this.loadVoiceSettings();
      
      // Start monitoring
      this.startQualityMonitoring();
      this.startDeviceMonitoring();
      
      this.isInitialized = true;
      this.emit('initialized', { userId, username });
    }, { component: 'VoiceChatService', action: 'initialize' });
  }

  /**
   * Create voice chat room
   */
  async createRoom(
    name: string,
    type: RoomType,
    options?: {
      description?: string;
      maxParticipants?: number;
      settings?: Partial<VoiceChatSettings>;
      permissions?: Partial<RoomPermissions>;
      password?: string;
      linkedStreamId?: string;
      linkedRoomId?: string;
    }
  ): Promise<VoiceChatRoom> {
    return withErrorHandling(async () => {
      if (!this.isInitialized || !this.currentUserId || !this.currentUsername) {
        throw new Error('Service not initialized');
      }

      const roomId = this.generateId();
      const now = new Date().toISOString();

      const room: VoiceChatRoom = {
        id: roomId,
        name,
        description: options?.description,
        type,
        hostId: this.currentUserId,
        hostUsername: this.currentUsername,
        participants: [],
        settings: {
          allowSpatialAudio: false,
          enableNoiseSuppression: true,
          enableEchoCancellation: true,
          enableAutoGainControl: true,
          maxParticipants: options?.maxParticipants || 10,
          defaultVolume: 0.8,
          pushToTalk: false,
          voiceActivation: true,
          voiceActivationThreshold: 0.3,
          allowRecording: false,
          allowEffects: true,
          allowScreenShare: false,
          moderationMode: 'open',
          autoMuteModerators: false,
          autoMuteNewJoins: false,
          handRaiseEnabled: true,
          timeoutSettings: {
            maxTalkTime: 300, // 5 minutes
            silenceTimeout: 600, // 10 minutes
            idleTimeout: 1800, // 30 minutes
            autoKickTimeout: 3600, // 1 hour
          },
          qualitySettings: {
            audioQuality: 'medium',
            bitrate: 64000,
            sampleRate: 48000,
            adaptiveBitrate: true,
            lowLatencyMode: false,
            enhancedAudio: false,
          },
          privacySettings: {
            recordConversations: false,
            saveAudioData: false,
            allowAnalytics: true,
            sharePresence: true,
            allowInvites: true,
            requirePermissionToJoin: false,
          },
          ...options?.settings,
        },
        permissions: {
          joinPermission: 'everyone',
          speakPermission: 'everyone',
          moderatePermission: 'host',
          recordPermission: 'host',
          invitePermission: 'everyone',
          customPermissions: [],
          ...options?.permissions,
        },
        status: 'waiting',
        maxParticipants: options?.maxParticipants || 10,
        currentParticipants: 0,
        quality: 'medium',
        bitrate: 64000,
        isRecording: false,
        createdAt: now,
        updatedAt: now,
        statistics: {
          totalParticipants: 0,
          peakParticipants: 0,
          totalTalkTime: 0,
          averageTalkTime: 0,
          totalDuration: 0,
          audioQualityScore: 100,
          connectionScore: 100,
          engagementScore: 0,
          participantRetention: 0,
          topSpeakers: [],
          qualityMetrics: {
            averageLatency: 0,
            averageJitter: 0,
            averagePacketLoss: 0,
            audioDropouts: 0,
            reconnections: 0,
            qualityIssues: 0,
          },
          networkMetrics: {
            averageBandwidth: 0,
            peakBandwidth: 0,
            dataTransferred: 0,
            serverLoad: 0,
            regionDistribution: {},
          },
          userInteractions: 0,
          moderationActions: 0,
          recordingTime: 0,
        },
        moderators: [],
        bannedUsers: [],
        inviteOnly: false,
        password: options?.password,
        linkedStreamId: options?.linkedStreamId,
        linkedRoomId: options?.linkedRoomId,
      };

      // Send room creation request
      await webSocketService.sendMessage('voice_room_create', room);
      
      // Add to local cache
      this.availableRooms.set(roomId, room);
      
      this.emit('room_created', room);
      return room;
    }, { component: 'VoiceChatService', action: 'createRoom' });
  }

  /**
   * Join voice chat room
   */
  async joinRoom(roomId: string, password?: string): Promise<void> {
    return withErrorHandling(async () => {
      if (!this.isInitialized || !this.currentUserId || !this.currentUsername) {
        throw new Error('Service not initialized');
      }

      logDebug('Joining voice chat room', { roomId });

      // Request microphone permission
      await this.requestMicrophonePermission();
      
      // Get user media
      await this.getUserMedia();
      
      // Create participant object
      const participant: VoiceParticipant = {
        id: this.generateId(),
        userId: this.currentUserId,
        username: this.currentUsername,
        displayName: this.currentUsername,
        role: 'listener',
        permissions: this.getDefaultPermissions('listener'),
        audioState: this.getDefaultAudioState(),
        connectionState: this.getDefaultConnectionState(),
        joinedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        talkTime: 0,
        isMuted: false,
        isDeafened: false,
        isSpeaking: false,
        audioLevel: 0,
        networkQuality: 'excellent',
        deviceInfo: this.audioDevices!,
        status: 'connecting',
      };

      // Send join request
      await webSocketService.sendMessage('voice_room_join', {
        roomId,
        participant,
        password,
      });

      this.currentParticipant = participant;
      this.emit('room_joining', { roomId, participant });
    }, { component: 'VoiceChatService', action: 'joinRoom' });
  }

  /**
   * Leave voice chat room
   */
  async leaveRoom(): Promise<void> {
    if (!this.currentRoom || !this.currentParticipant) return;

    const roomId = this.currentRoom.id;
    
    // Stop audio stream
    this.stopUserMedia();
    
    // Close peer connections
    this.closePeerConnections();
    
    // Send leave message
    await webSocketService.sendMessage('voice_room_leave', {
      roomId,
      participantId: this.currentParticipant.id,
    });

    this.currentRoom = null;
    this.currentParticipant = null;
    
    this.emit('room_left', { roomId });
  }

  /**
   * Toggle mute
   */
  async toggleMute(): Promise<void> {
    if (!this.currentParticipant || !this.audioStream) return;

    const audioTracks = this.audioStream.getAudioTracks();
    const isMuted = !audioTracks[0]?.enabled;
    
    audioTracks.forEach(track => {
      track.enabled = isMuted;
    });

    this.currentParticipant.isMuted = !isMuted;
    this.currentParticipant.audioState.isMuted = !isMuted;

    await webSocketService.sendMessage('voice_participant_mute', {
      roomId: this.currentRoom?.id,
      participantId: this.currentParticipant.id,
      isMuted: !isMuted,
    });

    this.emit('mute_toggled', { isMuted: !isMuted });
  }

  /**
   * Toggle deafen
   */
  async toggleDeafen(): Promise<void> {
    if (!this.currentParticipant) return;

    const isDeafened = !this.currentParticipant.isDeafened;
    
    // Mute all remote audio
    this.peerConnections.forEach(connection => {
      const remoteStream = connection.getRemoteStreams()[0];
      if (remoteStream) {
        remoteStream.getAudioTracks().forEach(track => {
          track.enabled = !isDeafened;
        });
      }
    });

    this.currentParticipant.isDeafened = isDeafened;
    this.currentParticipant.audioState.isDeafened = isDeafened;

    await webSocketService.sendMessage('voice_participant_deafen', {
      roomId: this.currentRoom?.id,
      participantId: this.currentParticipant.id,
      isDeafened,
    });

    this.emit('deafen_toggled', { isDeafened });
  }

  /**
   * Change audio device
   */
  async changeAudioDevice(deviceId: string, type: 'input' | 'output'): Promise<void> {
    if (!this.audioDevices) return;

    if (type === 'input') {
      // Change microphone
      const device = this.audioDevices.availableInputDevices.find(d => d.id === deviceId);
      if (device) {
        this.audioDevices.inputDevice = device;
        await this.recreateUserMedia();
      }
    } else {
      // Change speakers/headphones
      const device = this.audioDevices.availableOutputDevices.find(d => d.id === deviceId);
      if (device) {
        this.audioDevices.outputDevice = device;
        // Apply to audio elements
        await this.updateOutputDevice(deviceId);
      }
    }

    this.emit('audio_device_changed', { deviceId, type });
  }

  /**
   * Set audio volume
   */
  setVolume(volume: number): void {
    if (!this.gainNode) return;

    const normalizedVolume = Math.max(0, Math.min(1, volume));
    this.gainNode.gain.value = normalizedVolume;

    if (this.currentParticipant) {
      this.currentParticipant.audioState.volume = normalizedVolume;
    }

    this.emit('volume_changed', { volume: normalizedVolume });
  }

  /**
   * Apply audio effect
   */
  async applyAudioEffect(effect: AudioEffect): Promise<void> {
    if (!this.audioContext || !this.currentParticipant) return;

    // Add effect to participant state
    const existingEffectIndex = this.currentParticipant.audioState.effects.findIndex(e => e.id === effect.id);
    
    if (existingEffectIndex >= 0) {
      this.currentParticipant.audioState.effects[existingEffectIndex] = effect;
    } else {
      this.currentParticipant.audioState.effects.push(effect);
    }

    // Apply effect to audio processing chain
    await this.updateAudioProcessing();

    this.emit('audio_effect_applied', effect);
  }

  /**
   * Start recording
   */
  async startRecording(): Promise<string> {
    if (!this.currentRoom || !this.canRecord()) {
      throw new Error('Cannot start recording');
    }

    const recordingId = this.generateId();
    const recording: VoiceRecording = {
      id: recordingId,
      roomId: this.currentRoom.id,
      filename: `voice_chat_${recordingId}.mp3`,
      duration: 0,
      size: 0,
      quality: this.currentRoom.quality,
      format: 'mp3',
      participants: this.currentRoom.participants.map(p => p.userId),
      startedAt: new Date().toISOString(),
      endedAt: '',
      isProcessing: false,
      isPublic: false,
      highlights: [],
      metadata: {
        sampleRate: this.currentRoom.settings.qualitySettings.sampleRate,
        bitrate: this.currentRoom.settings.qualitySettings.bitrate,
        channels: 2,
        codec: 'mp3',
        compression: 'standard',
        checksum: '',
      },
    };

    this.recordings.set(recordingId, recording);
    this.currentRoom.isRecording = true;

    await webSocketService.sendMessage('voice_recording_start', {
      roomId: this.currentRoom.id,
      recordingId,
      recording,
    });

    this.emit('recording_started', recording);
    return recordingId;
  }

  /**
   * Stop recording
   */
  async stopRecording(recordingId: string): Promise<VoiceRecording | null> {
    const recording = this.recordings.get(recordingId);
    if (!recording) return null;

    recording.endedAt = new Date().toISOString();
    recording.duration = (new Date(recording.endedAt).getTime() - new Date(recording.startedAt).getTime()) / 1000;
    recording.isProcessing = true;

    if (this.currentRoom) {
      this.currentRoom.isRecording = false;
    }

    await webSocketService.sendMessage('voice_recording_stop', {
      roomId: recording.roomId,
      recordingId,
    });

    this.emit('recording_stopped', recording);
    return recording;
  }

  /**
   * Raise hand
   */
  async raiseHand(): Promise<void> {
    if (!this.currentRoom || !this.currentParticipant) return;

    await webSocketService.sendMessage('voice_hand_raise', {
      roomId: this.currentRoom.id,
      participantId: this.currentParticipant.id,
    });

    this.emit('hand_raised', { participantId: this.currentParticipant.id });
  }

  /**
   * Lower hand
   */
  async lowerHand(): Promise<void> {
    if (!this.currentRoom || !this.currentParticipant) return;

    await webSocketService.sendMessage('voice_hand_lower', {
      roomId: this.currentRoom.id,
      participantId: this.currentParticipant.id,
    });

    this.emit('hand_lowered', { participantId: this.currentParticipant.id });
  }

  /**
   * Get current room
   */
  getCurrentRoom(): VoiceChatRoom | null {
    return this.currentRoom;
  }

  /**
   * Get current participant
   */
  getCurrentParticipant(): VoiceParticipant | null {
    return this.currentParticipant;
  }

  /**
   * Get audio devices
   */
  getAudioDevices(): AudioDeviceInfo | null {
    return this.audioDevices;
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState | null {
    return this.connectionState;
  }

  /**
   * Get available rooms
   */
  getAvailableRooms(): VoiceChatRoom[] {
    return Array.from(this.availableRooms.values());
  }

  /**
   * Get recordings
   */
  getRecordings(): VoiceRecording[] {
    return Array.from(this.recordings.values());
  }

  /**
   * Test audio devices
   */
  async testAudioDevices(): Promise<{ microphone: boolean; speakers: boolean }> {
    const micTest = await this.testMicrophone();
    const speakerTest = await this.testSpeakers();
    
    return {
      microphone: micTest,
      speakers: speakerTest,
    };
  }

  /**
   * Dispose service
   */
  dispose(): void {
    this.stopQualityMonitoring();
    this.stopDeviceMonitoring();
    this.stopSpeakingDetection();
    this.stopReconnectTimer();
    
    this.stopUserMedia();
    this.closePeerConnections();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.currentRoom = null;
    this.currentParticipant = null;
    this.audioDevices = null;
    this.connectionState = null;
    this.recordings.clear();
    this.availableRooms.clear();
    this.isInitialized = false;
    
    this.emit('disposed');
  }

  // Private methods

  private setupEventHandlers(): void {
    webSocketService.on('message:voice_room_state', this.handleRoomState.bind(this));
    webSocketService.on('message:voice_participant_joined', this.handleParticipantJoined.bind(this));
    webSocketService.on('message:voice_participant_left', this.handleParticipantLeft.bind(this));
    webSocketService.on('message:voice_participant_muted', this.handleParticipantMuted.bind(this));
    webSocketService.on('message:voice_participant_speaking', this.handleParticipantSpeaking.bind(this));
    webSocketService.on('message:voice_recording_started', this.handleRecordingStarted.bind(this));
    webSocketService.on('message:voice_recording_stopped', this.handleRecordingStopped.bind(this));
    webSocketService.on('disconnected', this.handleDisconnected.bind(this));
  }

  private handleRoomState(wsMessage: WebSocketMessage): void {
    const room: VoiceChatRoom = wsMessage.data;
    this.availableRooms.set(room.id, room);
    
    if (this.currentParticipant && room.participants.some(p => p.userId === this.currentParticipant?.userId)) {
      this.currentRoom = room;
    }
    
    this.emit('room_state_updated', room);
  }

  private handleParticipantJoined(wsMessage: WebSocketMessage): void {
    const { roomId, participant } = wsMessage.data;
    const room = this.availableRooms.get(roomId);
    
    if (room) {
      room.participants.push(participant);
      room.currentParticipants++;
    }
    
    this.emit('participant_joined', { roomId, participant });
  }

  private handleParticipantLeft(wsMessage: WebSocketMessage): void {
    const { roomId, participantId } = wsMessage.data;
    const room = this.availableRooms.get(roomId);
    
    if (room) {
      room.participants = room.participants.filter(p => p.id !== participantId);
      room.currentParticipants--;
      
      // Close peer connection if exists
      const peerConnection = this.peerConnections.get(participantId);
      if (peerConnection) {
        peerConnection.close();
        this.peerConnections.delete(participantId);
      }
    }
    
    this.emit('participant_left', { roomId, participantId });
  }

  private handleParticipantMuted(wsMessage: WebSocketMessage): void {
    const { roomId, participantId, isMuted } = wsMessage.data;
    this.emit('participant_muted', { roomId, participantId, isMuted });
  }

  private handleParticipantSpeaking(wsMessage: WebSocketMessage): void {
    const { roomId, participantId, isSpeaking, audioLevel } = wsMessage.data;
    this.emit('participant_speaking', { roomId, participantId, isSpeaking, audioLevel });
  }

  private handleRecordingStarted(wsMessage: WebSocketMessage): void {
    const recording: VoiceRecording = wsMessage.data;
    this.recordings.set(recording.id, recording);
    this.emit('recording_started', recording);
  }

  private handleRecordingStopped(wsMessage: WebSocketMessage): void {
    const { recordingId } = wsMessage.data;
    const recording = this.recordings.get(recordingId);
    if (recording) {
      this.emit('recording_stopped', recording);
    }
  }

  private handleDisconnected(): void {
    this.currentRoom = null;
    this.currentParticipant = null;
    this.stopUserMedia();
    this.closePeerConnections();
    this.emit('disconnected');
  }

  private isAudioSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  private async initializeAudioContext(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    }
  }

  private async detectAudioDevices(): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const inputDevices = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          id: device.deviceId,
          name: device.label || 'Microphone',
          type: 'microphone' as const,
          isDefault: device.deviceId === 'default',
          channels: 1,
          sampleRates: [48000, 44100, 22050],
          latency: 20,
          isWireless: device.label.toLowerCase().includes('bluetooth'),
        }));

      const outputDevices = devices
        .filter(device => device.kind === 'audiooutput')
        .map(device => ({
          id: device.deviceId,
          name: device.label || 'Speaker',
          type: 'speaker' as const,
          isDefault: device.deviceId === 'default',
          channels: 2,
          sampleRates: [48000, 44100, 22050],
          latency: 20,
          isWireless: device.label.toLowerCase().includes('bluetooth'),
        }));

      this.audioDevices = {
        inputDevice: inputDevices[0] || null,
        outputDevice: outputDevices[0] || null,
        availableInputDevices: inputDevices,
        availableOutputDevices: outputDevices,
        supportsEchoCancellation: true,
        supportsNoiseSuppression: true,
        supportsAutoGainControl: true,
        supportsSpatialAudio: false,
      };
    } catch (error) {
      logError('Failed to detect audio devices', error);
    }
  }

  private async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      logError('Microphone permission denied', error);
      return false;
    }
  }

  private async getUserMedia(): Promise<void> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: this.audioDevices?.inputDevice?.id,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        },
      };

      this.audioStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.setupAudioProcessing();
    } catch (error) {
      logError('Failed to get user media', error);
      throw new Error('Failed to access microphone');
    }
  }

  private setupAudioProcessing(): void {
    if (!this.audioContext || !this.audioStream) return;

    const source = this.audioContext.createMediaStreamSource(this.audioStream);
    this.analyserNode = this.audioContext.createAnalyser();
    this.gainNode = this.audioContext.createGain();

    source.connect(this.analyserNode);
    this.analyserNode.connect(this.gainNode);

    // Start speaking detection
    this.startSpeakingDetection();
  }

  private async updateAudioProcessing(): Promise<void> {
    // Recreate audio processing chain with effects
    this.setupAudioProcessing();
  }

  private async recreateUserMedia(): Promise<void> {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
    }
    await this.getUserMedia();
  }

  private async updateOutputDevice(deviceId: string): Promise<void> {
    // This would require setting the output device on audio elements
    // Implementation depends on how audio playback is handled
  }

  private stopUserMedia(): void {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
  }

  private closePeerConnections(): void {
    this.peerConnections.forEach(connection => connection.close());
    this.peerConnections.clear();
  }

  private getDefaultPermissions(role: ParticipantRole): ParticipantPermissions {
    const basePermissions = {
      canSpeak: false,
      canMute: true,
      canDeafen: true,
      canInvite: false,
      canKick: false,
      canBan: false,
      canRecord: false,
      canModerate: false,
      canChangeSettings: false,
      canManageRoles: false,
      canUseSpatialAudio: false,
      canShareScreen: false,
      canUseEffects: true,
    };

    switch (role) {
      case 'host':
        return { ...basePermissions, canSpeak: true, canInvite: true, canKick: true, canBan: true, canRecord: true, canModerate: true, canChangeSettings: true, canManageRoles: true };
      case 'co_host':
        return { ...basePermissions, canSpeak: true, canInvite: true, canKick: true, canModerate: true };
      case 'moderator':
        return { ...basePermissions, canSpeak: true, canInvite: true, canModerate: true };
      case 'speaker':
        return { ...basePermissions, canSpeak: true };
      default:
        return basePermissions;
    }
  }

  private getDefaultAudioState(): AudioState {
    return {
      isMuted: false,
      isDeafened: false,
      volume: 0.8,
      inputGain: 1.0,
      outputGain: 1.0,
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true,
      sampleRate: 48000,
      channels: 1,
      codec: 'opus',
      effects: [],
    };
  }

  private getDefaultConnectionState(): ConnectionState {
    return {
      isConnected: false,
      connectionQuality: 'excellent',
      latency: 0,
      jitter: 0,
      packetLoss: 0,
      bandwidth: 0,
      protocol: 'webrtc',
      region: 'us-east',
      server: 'voice-server-1',
      encryption: true,
      lastPingTime: 0,
      reconnectAttempts: 0,
    };
  }

  private canRecord(): boolean {
    return this.currentParticipant?.permissions.canRecord || false;
  }

  private async testMicrophone(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const hasAudio = stream.getAudioTracks().length > 0;
      stream.getTracks().forEach(track => track.stop());
      return hasAudio;
    } catch {
      return false;
    }
  }

  private async testSpeakers(): Promise<boolean> {
    try {
      // Create a short audio tone to test speakers
      if (!this.audioContext) return false;
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = 440; // A4 note
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.1);
      
      return true;
    } catch {
      return false;
    }
  }

  private startQualityMonitoring(): void {
    this.qualityMonitorTimer = setInterval(() => {
      this.monitorConnectionQuality();
    }, 5000);
  }

  private stopQualityMonitoring(): void {
    if (this.qualityMonitorTimer) {
      clearInterval(this.qualityMonitorTimer);
      this.qualityMonitorTimer = null;
    }
  }

  private startDeviceMonitoring(): void {
    this.deviceMonitorTimer = setInterval(() => {
      this.detectAudioDevices();
    }, 30000);
  }

  private stopDeviceMonitoring(): void {
    if (this.deviceMonitorTimer) {
      clearInterval(this.deviceMonitorTimer);
      this.deviceMonitorTimer = null;
    }
  }

  private startSpeakingDetection(): void {
    if (!this.analyserNode) return;

    this.speakingDetectionTimer = setInterval(() => {
      const bufferLength = this.analyserNode!.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyserNode!.getByteFrequencyData(dataArray);

      // Calculate audio level
      const audioLevel = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength / 255;
      
      const isSpeaking = audioLevel > 0.1; // Threshold for speaking detection
      
      if (this.currentParticipant && this.currentParticipant.isSpeaking !== isSpeaking) {
        this.currentParticipant.isSpeaking = isSpeaking;
        this.currentParticipant.audioLevel = audioLevel;
        
        this.emit('speaking_changed', { isSpeaking, audioLevel });
        
        if (this.currentRoom) {
          webSocketService.sendMessage('voice_participant_speaking', {
            roomId: this.currentRoom.id,
            participantId: this.currentParticipant.id,
            isSpeaking,
            audioLevel,
          });
        }
      }
    }, 100);
  }

  private stopSpeakingDetection(): void {
    if (this.speakingDetectionTimer) {
      clearInterval(this.speakingDetectionTimer);
      this.speakingDetectionTimer = null;
    }
  }

  private stopReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private monitorConnectionQuality(): void {
    // Monitor WebRTC connection quality
    this.peerConnections.forEach(async (connection, participantId) => {
      try {
        const stats = await connection.getStats();
        // Process stats to determine connection quality
        // Update connection state accordingly
      } catch (error) {
        logError('Failed to get connection stats', error);
      }
    });
  }

  private async loadVoiceSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(`voice_settings_${this.currentUserId}`);
      if (stored) {
        const settings = JSON.parse(stored);
        // Apply stored settings
        logDebug('Loaded voice settings', settings);
      }
    } catch (error) {
      logError('Failed to load voice settings', error);
    }
  }

  private generateId(): string {
    return `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const voiceChatService = new VoiceChatService();

// Helper functions
export const initializeVoiceChat = async (userId: string, username: string) => {
  return voiceChatService.initialize(userId, username);
};

export const createVoiceRoom = async (name: string, type: RoomType, options?: any) => {
  return voiceChatService.createRoom(name, type, options);
};

export const joinVoiceRoom = async (roomId: string, password?: string) => {
  return voiceChatService.joinRoom(roomId, password);
};

export const toggleMute = async () => {
  return voiceChatService.toggleMute();
};

export const toggleDeafen = async () => {
  return voiceChatService.toggleDeafen();
};