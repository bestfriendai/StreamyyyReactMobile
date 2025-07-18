import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UnifiedStream } from './platformService';

export interface VoiceCommand {
  id: string;
  phrase: string[];
  action: string;
  parameters?: Record<string, any>;
  confidence: number;
  category: 'navigation' | 'playback' | 'search' | 'social' | 'accessibility' | 'system';
  description: string;
  examples: string[];
  isEnabled: boolean;
  customizable: boolean;
}

export interface VoiceSettings {
  enabled: boolean;
  language: string;
  sensitivity: 'low' | 'medium' | 'high';
  continuousListening: boolean;
  wakeWord: string;
  confirmationRequired: boolean;
  speechFeedback: boolean;
  hapticFeedback: boolean;
  voiceSpeed: number; // 0.5 - 2.0
  voicePitch: number; // 0.5 - 2.0
  volume: number; // 0.0 - 1.0
  timeout: number; // seconds
  customCommands: VoiceCommand[];
}

export interface AccessibilitySettings {
  screenReaderEnabled: boolean;
  highContrastMode: boolean;
  largeText: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  boldText: boolean;
  reduceMotion: boolean;
  colorBlindSupport: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  voiceGuidance: boolean;
  keyboardNavigation: boolean;
  gestureNavigation: boolean;
  autoPlayDescriptions: boolean;
  skipNonEssentialAnimations: boolean;
  simplifiedInterface: boolean;
  audioDescriptions: boolean;
  subtitlesEnabled: boolean;
  subtitleSize: 'small' | 'medium' | 'large';
  subtitleContrast: 'low' | 'medium' | 'high';
  focusIndicatorEnhanced: boolean;
  oneHandedMode: boolean;
  hapticIntensity: 'low' | 'medium' | 'high' | 'off';
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  language: string;
  timestamp: string;
  processedCommand?: VoiceCommand;
  actionExecuted: boolean;
  error?: string;
}

export interface AccessibilityAnnouncement {
  id: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'navigation' | 'status' | 'error' | 'completion' | 'notification';
  timestamp: string;
  spoken: boolean;
  interrupted: boolean;
}

const defaultVoiceCommands: VoiceCommand[] = [
  // Navigation Commands
  {
    id: 'nav_home',
    phrase: ['go home', 'navigate home', 'home screen'],
    action: 'navigate',
    parameters: { screen: 'home' },
    confidence: 0.8,
    category: 'navigation',
    description: 'Navigate to home screen',
    examples: ['Go home', 'Take me home', 'Navigate to home'],
    isEnabled: true,
    customizable: false,
  },
  {
    id: 'nav_discover',
    phrase: ['discover', 'find streams', 'browse streams'],
    action: 'navigate',
    parameters: { screen: 'discover' },
    confidence: 0.8,
    category: 'navigation',
    description: 'Open discovery screen',
    examples: ['Discover streams', 'Find new streams', 'Browse'],
    isEnabled: true,
    customizable: false,
  },
  {
    id: 'nav_favorites',
    phrase: ['favorites', 'my favorites', 'followed streams'],
    action: 'navigate',
    parameters: { screen: 'favorites' },
    confidence: 0.8,
    category: 'navigation',
    description: 'Open favorites screen',
    examples: ['Show favorites', 'My followed streams'],
    isEnabled: true,
    customizable: false,
  },

  // Playback Commands
  {
    id: 'play_pause',
    phrase: ['play', 'pause', 'play pause', 'toggle playback'],
    action: 'playback_toggle',
    confidence: 0.9,
    category: 'playback',
    description: 'Toggle play/pause',
    examples: ['Play', 'Pause', 'Toggle playback'],
    isEnabled: true,
    customizable: false,
  },
  {
    id: 'volume_up',
    phrase: ['volume up', 'louder', 'increase volume'],
    action: 'volume_change',
    parameters: { direction: 'up', amount: 0.1 },
    confidence: 0.8,
    category: 'playback',
    description: 'Increase volume',
    examples: ['Volume up', 'Make it louder', 'Turn up'],
    isEnabled: true,
    customizable: false,
  },
  {
    id: 'volume_down',
    phrase: ['volume down', 'quieter', 'decrease volume'],
    action: 'volume_change',
    parameters: { direction: 'down', amount: 0.1 },
    confidence: 0.8,
    category: 'playback',
    description: 'Decrease volume',
    examples: ['Volume down', 'Make it quieter', 'Turn down'],
    isEnabled: true,
    customizable: false,
  },
  {
    id: 'mute',
    phrase: ['mute', 'silence', 'turn off sound'],
    action: 'mute_toggle',
    confidence: 0.9,
    category: 'playback',
    description: 'Toggle mute',
    examples: ['Mute', 'Silence', 'Turn off sound'],
    isEnabled: true,
    customizable: false,
  },

  // Search Commands
  {
    id: 'search_stream',
    phrase: ['search for', 'find streamer', 'look for'],
    action: 'search',
    confidence: 0.7,
    category: 'search',
    description: 'Search for streams or streamers',
    examples: ['Search for gaming streams', 'Find streamer pokimane'],
    isEnabled: true,
    customizable: false,
  },

  // Social Commands
  {
    id: 'follow_streamer',
    phrase: ['follow', 'follow streamer', 'add to favorites'],
    action: 'follow',
    confidence: 0.8,
    category: 'social',
    description: 'Follow current streamer',
    examples: ['Follow this streamer', 'Add to favorites'],
    isEnabled: true,
    customizable: false,
  },
  {
    id: 'share_stream',
    phrase: ['share', 'share stream', 'send to friend'],
    action: 'share',
    confidence: 0.8,
    category: 'social',
    description: 'Share current stream',
    examples: ['Share this stream', 'Send to friend'],
    isEnabled: true,
    customizable: false,
  },

  // Accessibility Commands
  {
    id: 'read_screen',
    phrase: ['read screen', 'what\'s on screen', 'describe screen'],
    action: 'screen_reader',
    confidence: 0.8,
    category: 'accessibility',
    description: 'Read screen content aloud',
    examples: ['Read screen', 'What\'s on screen', 'Describe what I see'],
    isEnabled: true,
    customizable: false,
  },
  {
    id: 'next_element',
    phrase: ['next', 'next item', 'move forward'],
    action: 'navigation_next',
    confidence: 0.8,
    category: 'accessibility',
    description: 'Move to next element',
    examples: ['Next', 'Next item', 'Move forward'],
    isEnabled: true,
    customizable: false,
  },
  {
    id: 'previous_element',
    phrase: ['previous', 'previous item', 'move back'],
    action: 'navigation_previous',
    confidence: 0.8,
    category: 'accessibility',
    description: 'Move to previous element',
    examples: ['Previous', 'Previous item', 'Go back'],
    isEnabled: true,
    customizable: false,
  },

  // System Commands
  {
    id: 'help',
    phrase: ['help', 'what can I say', 'voice commands'],
    action: 'show_help',
    confidence: 0.9,
    category: 'system',
    description: 'Show available voice commands',
    examples: ['Help', 'What can I say', 'Show voice commands'],
    isEnabled: true,
    customizable: false,
  },
  {
    id: 'settings',
    phrase: ['settings', 'preferences', 'options'],
    action: 'navigate',
    parameters: { screen: 'settings' },
    confidence: 0.8,
    category: 'system',
    description: 'Open settings',
    examples: ['Open settings', 'Show preferences'],
    isEnabled: true,
    customizable: false,
  },
];

class VoiceAccessibilityService {
  private recording: Audio.Recording | null = null;
  private isListening = false;
  private currentFocusElement: any = null;
  private announcementQueue: AccessibilityAnnouncement[] = [];
  private isAnnouncing = false;
  
  private voiceSettings: VoiceSettings = {
    enabled: false,
    language: 'en-US',
    sensitivity: 'medium',
    continuousListening: false,
    wakeWord: 'hey stream',
    confirmationRequired: false,
    speechFeedback: true,
    hapticFeedback: true,
    voiceSpeed: 1.0,
    voicePitch: 1.0,
    volume: 0.8,
    timeout: 5,
    customCommands: [],
  };

  private accessibilitySettings: AccessibilitySettings = {
    screenReaderEnabled: false,
    highContrastMode: false,
    largeText: false,
    fontSize: 'medium',
    boldText: false,
    reduceMotion: false,
    colorBlindSupport: 'none',
    voiceGuidance: false,
    keyboardNavigation: false,
    gestureNavigation: true,
    autoPlayDescriptions: false,
    skipNonEssentialAnimations: false,
    simplifiedInterface: false,
    audioDescriptions: false,
    subtitlesEnabled: false,
    subtitleSize: 'medium',
    subtitleContrast: 'medium',
    focusIndicatorEnhanced: false,
    oneHandedMode: false,
    hapticIntensity: 'medium',
  };

  private commands: VoiceCommand[] = defaultVoiceCommands;
  private navigationCallbacks: Map<string, Function> = new Map();
  private playbackCallbacks: Map<string, Function> = new Map();

  constructor() {
    console.log('Voice & Accessibility Service initialized');
    this.initializeService();
  }

  private async initializeService() {
    await this.loadSettings();
    await this.requestPermissions();
    this.setupAudio();
    this.startAnnouncementProcessor();
  }

  private async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Audio permissions not granted');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }

  private async setupAudio(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Failed to setup audio:', error);
    }
  }

  // Voice Commands
  async startListening(): Promise<void> {
    if (!this.voiceSettings.enabled || this.isListening) return;

    console.log('🎤 Starting voice recognition...');
    
    try {
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MIN,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsSigned: false,
          linearPCMIsFloat: false,
        },
      });

      await this.recording.startAsync();
      this.isListening = true;

      // Provide haptic feedback
      if (this.voiceSettings.hapticFeedback) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Announce listening state
      if (this.voiceSettings.speechFeedback) {
        await this.speak('Listening for command', 'low');
      }

      // Set timeout
      setTimeout(() => {
        if (this.isListening) {
          this.stopListening();
        }
      }, this.voiceSettings.timeout * 1000);

    } catch (error) {
      console.error('❌ Failed to start listening:', error);
      this.isListening = false;
    }
  }

  async stopListening(): Promise<SpeechRecognitionResult | null> {
    if (!this.isListening || !this.recording) return null;

    console.log('🛑 Stopping voice recognition...');
    
    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.isListening = false;
      this.recording = null;

      if (uri) {
        // In a real implementation, you would send the audio to a speech recognition service
        // For now, we'll simulate recognition
        const result = await this.simulateSpeechRecognition(uri);
        
        if (result) {
          await this.processVoiceCommand(result);
        }
        
        return result;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to stop listening:', error);
      this.isListening = false;
      return null;
    }
  }

  private async simulateSpeechRecognition(audioUri: string): Promise<SpeechRecognitionResult | null> {
    // Simulate speech recognition - in production, integrate with Google Speech-to-Text, Azure, etc.
    const simulatedTranscripts = [
      'play',
      'pause',
      'go home',
      'search for gaming streams',
      'volume up',
      'mute',
      'help',
      'what\'s on screen',
    ];

    const randomTranscript = simulatedTranscripts[Math.floor(Math.random() * simulatedTranscripts.length)];
    
    return {
      transcript: randomTranscript,
      confidence: 0.85,
      language: this.voiceSettings.language,
      timestamp: new Date().toISOString(),
      actionExecuted: false,
    };
  }

  private async processVoiceCommand(result: SpeechRecognitionResult): Promise<void> {
    console.log(`🗣️ Processing voice command: "${result.transcript}"`);
    
    try {
      const matchedCommand = this.findMatchingCommand(result.transcript);
      
      if (matchedCommand) {
        result.processedCommand = matchedCommand;
        
        // Confirm command if required
        if (this.voiceSettings.confirmationRequired) {
          await this.speak(`Executing ${matchedCommand.description}`, 'medium');
        }

        // Execute command
        await this.executeCommand(matchedCommand);
        result.actionExecuted = true;

        // Provide feedback
        if (this.voiceSettings.speechFeedback) {
          await this.speak('Command executed', 'low');
        }

        if (this.voiceSettings.hapticFeedback) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        // Command not recognized
        result.error = 'Command not recognized';
        
        if (this.voiceSettings.speechFeedback) {
          await this.speak('Sorry, I didn\'t understand that command', 'medium');
        }

        if (this.voiceSettings.hapticFeedback) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (error) {
      console.error('❌ Failed to process voice command:', error);
      result.error = error.message;
    }
  }

  private findMatchingCommand(transcript: string): VoiceCommand | null {
    const lowerTranscript = transcript.toLowerCase();
    
    // Find exact phrase matches first
    for (const command of this.commands) {
      if (!command.isEnabled) continue;
      
      for (const phrase of command.phrase) {
        if (lowerTranscript.includes(phrase.toLowerCase())) {
          return command;
        }
      }
    }

    // Then try partial matches with fuzzy matching
    for (const command of this.commands) {
      if (!command.isEnabled) continue;
      
      for (const phrase of command.phrase) {
        const similarity = this.calculateSimilarity(lowerTranscript, phrase.toLowerCase());
        if (similarity > 0.7) {
          return command;
        }
      }
    }

    return null;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private async executeCommand(command: VoiceCommand): Promise<void> {
    console.log(`⚡ Executing command: ${command.action}`);
    
    try {
      switch (command.action) {
        case 'navigate':
          const screen = command.parameters?.screen;
          if (screen && this.navigationCallbacks.has('navigate')) {
            this.navigationCallbacks.get('navigate')!(screen);
          }
          break;

        case 'playback_toggle':
          if (this.playbackCallbacks.has('toggle')) {
            this.playbackCallbacks.get('toggle')!();
          }
          break;

        case 'volume_change':
          const direction = command.parameters?.direction;
          const amount = command.parameters?.amount || 0.1;
          if (this.playbackCallbacks.has('volume')) {
            this.playbackCallbacks.get('volume')!(direction, amount);
          }
          break;

        case 'mute_toggle':
          if (this.playbackCallbacks.has('mute')) {
            this.playbackCallbacks.get('mute')!();
          }
          break;

        case 'search':
          // Extract search query from the transcript
          const searchQuery = this.extractSearchQuery(command);
          if (searchQuery && this.navigationCallbacks.has('search')) {
            this.navigationCallbacks.get('search')!(searchQuery);
          }
          break;

        case 'follow':
          if (this.playbackCallbacks.has('follow')) {
            this.playbackCallbacks.get('follow')!();
          }
          break;

        case 'share':
          if (this.playbackCallbacks.has('share')) {
            this.playbackCallbacks.get('share')!();
          }
          break;

        case 'screen_reader':
          await this.readScreen();
          break;

        case 'navigation_next':
          this.focusNext();
          break;

        case 'navigation_previous':
          this.focusPrevious();
          break;

        case 'show_help':
          await this.showVoiceHelp();
          break;

        default:
          console.warn(`Unknown command action: ${command.action}`);
          break;
      }
    } catch (error) {
      console.error(`❌ Failed to execute command: ${command.action}`, error);
    }
  }

  private extractSearchQuery(command: VoiceCommand): string | null {
    // This would extract the search query from the full transcript
    // For now, return a placeholder
    return 'gaming streams';
  }

  // Text-to-Speech
  async speak(text: string, priority: AccessibilityAnnouncement['priority'] = 'medium'): Promise<void> {
    if (!this.voiceSettings.speechFeedback && !this.accessibilitySettings.screenReaderEnabled) {
      return;
    }

    const announcement: AccessibilityAnnouncement = {
      id: Date.now().toString(),
      message: text,
      priority,
      type: 'status',
      timestamp: new Date().toISOString(),
      spoken: false,
      interrupted: false,
    };

    this.announcementQueue.push(announcement);
    this.processAnnouncementQueue();
  }

  private async processAnnouncementQueue(): Promise<void> {
    if (this.isAnnouncing || this.announcementQueue.length === 0) return;

    this.isAnnouncing = true;
    
    // Sort by priority
    this.announcementQueue.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    const announcement = this.announcementQueue.shift()!;
    
    try {
      await Speech.speak(announcement.message, {
        language: this.voiceSettings.language,
        pitch: this.voiceSettings.voicePitch,
        rate: this.voiceSettings.voiceSpeed,
        volume: this.voiceSettings.volume,
      });
      
      announcement.spoken = true;
    } catch (error) {
      console.error('❌ Failed to speak announcement:', error);
    }

    this.isAnnouncing = false;
    
    // Process next announcement
    if (this.announcementQueue.length > 0) {
      setTimeout(() => this.processAnnouncementQueue(), 500);
    }
  }

  private startAnnouncementProcessor(): void {
    setInterval(() => {
      this.processAnnouncementQueue();
    }, 1000);
  }

  // Screen Reader
  async readScreen(): Promise<void> {
    if (!this.accessibilitySettings.screenReaderEnabled) return;

    // This would analyze the current screen and read its content
    // For now, provide a generic description
    const screenDescription = this.getScreenDescription();
    await this.speak(screenDescription, 'high');
  }

  private getScreenDescription(): string {
    // In a real implementation, this would traverse the UI hierarchy
    // and generate a meaningful description
    return 'You are on the streams discovery screen. There are multiple stream cards displayed with streamer names, viewer counts, and thumbnail images.';
  }

  async describeElement(element: any): Promise<void> {
    if (!this.accessibilitySettings.screenReaderEnabled) return;

    const description = this.generateElementDescription(element);
    await this.speak(description, 'medium');
  }

  private generateElementDescription(element: any): string {
    // Generate description based on element type and properties
    if (element.type === 'stream_card') {
      return `Stream by ${element.streamerName}, ${element.title}, ${element.viewerCount} viewers`;
    } else if (element.type === 'button') {
      return `${element.label} button`;
    } else if (element.type === 'text_input') {
      return `Text input, ${element.placeholder || 'no placeholder'}`;
    }
    
    return 'Interactive element';
  }

  // Focus Management
  focusNext(): void {
    // Move focus to next focusable element
    console.log('Moving focus to next element');
    if (this.accessibilitySettings.screenReaderEnabled) {
      this.speak('Next element', 'low');
    }
  }

  focusPrevious(): void {
    // Move focus to previous focusable element
    console.log('Moving focus to previous element');
    if (this.accessibilitySettings.screenReaderEnabled) {
      this.speak('Previous element', 'low');
    }
  }

  setFocus(element: any): void {
    this.currentFocusElement = element;
    
    if (this.accessibilitySettings.screenReaderEnabled) {
      this.describeElement(element);
    }

    if (this.accessibilitySettings.focusIndicatorEnhanced) {
      // Enhance focus indicator visually
      this.enhanceFocusIndicator(element);
    }
  }

  private enhanceFocusIndicator(element: any): void {
    // Visual enhancements for focus indicator
    console.log('Enhancing focus indicator for element');
  }

  // Gesture Navigation
  handleGesture(gesture: string): void {
    if (!this.accessibilitySettings.gestureNavigation) return;

    switch (gesture) {
      case 'swipe_right':
        this.focusNext();
        break;
      case 'swipe_left':
        this.focusPrevious();
        break;
      case 'double_tap':
        this.activateCurrentElement();
        break;
      case 'triple_tap':
        this.readScreen();
        break;
    }
  }

  private activateCurrentElement(): void {
    if (this.currentFocusElement) {
      console.log('Activating current element');
      // Trigger element action
    }
  }

  // Voice Help
  private async showVoiceHelp(): Promise<void> {
    const helpText = this.generateHelpText();
    await this.speak(helpText, 'high');
  }

  private generateHelpText(): string {
    const enabledCommands = this.commands
      .filter(cmd => cmd.isEnabled)
      .slice(0, 5) // Limit to first 5 commands
      .map(cmd => cmd.examples[0])
      .join(', ');

    return `Available voice commands include: ${enabledCommands}. Say "help" for more commands.`;
  }

  // Custom Commands
  async addCustomCommand(command: Omit<VoiceCommand, 'id' | 'customizable'>): Promise<void> {
    const customCommand: VoiceCommand = {
      ...command,
      id: `custom_${Date.now()}`,
      customizable: true,
    };

    this.voiceSettings.customCommands.push(customCommand);
    this.commands.push(customCommand);
    await this.saveSettings();

    console.log(`✅ Custom command added: ${command.phrase[0]}`);
  }

  async removeCustomCommand(commandId: string): Promise<void> {
    this.voiceSettings.customCommands = this.voiceSettings.customCommands.filter(cmd => cmd.id !== commandId);
    this.commands = this.commands.filter(cmd => cmd.id !== commandId);
    await this.saveSettings();

    console.log(`✅ Custom command removed: ${commandId}`);
  }

  // Settings Management
  async updateVoiceSettings(updates: Partial<VoiceSettings>): Promise<void> {
    this.voiceSettings = { ...this.voiceSettings, ...updates };
    await this.saveSettings();
    console.log('✅ Voice settings updated');
  }

  async updateAccessibilitySettings(updates: Partial<AccessibilitySettings>): Promise<void> {
    this.accessibilitySettings = { ...this.accessibilitySettings, ...updates };
    await this.saveSettings();
    this.applyAccessibilitySettings();
    console.log('✅ Accessibility settings updated');
  }

  private applyAccessibilitySettings(): void {
    // Apply accessibility settings to the UI
    if (this.accessibilitySettings.reduceMotion) {
      // Disable animations
    }

    if (this.accessibilitySettings.highContrastMode) {
      // Apply high contrast theme
    }

    if (this.accessibilitySettings.largeText) {
      // Increase text size
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const voiceSettings = await AsyncStorage.getItem('voice_settings');
      if (voiceSettings) {
        this.voiceSettings = { ...this.voiceSettings, ...JSON.parse(voiceSettings) };
      }

      const accessibilitySettings = await AsyncStorage.getItem('accessibility_settings');
      if (accessibilitySettings) {
        this.accessibilitySettings = { ...this.accessibilitySettings, ...JSON.parse(accessibilitySettings) };
      }

      // Merge custom commands
      this.commands = [...defaultVoiceCommands, ...this.voiceSettings.customCommands];
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem('voice_settings', JSON.stringify(this.voiceSettings));
      await AsyncStorage.setItem('accessibility_settings', JSON.stringify(this.accessibilitySettings));
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
    }
  }

  // Callback Registration
  registerNavigationCallback(action: string, callback: Function): void {
    this.navigationCallbacks.set(action, callback);
  }

  registerPlaybackCallback(action: string, callback: Function): void {
    this.playbackCallbacks.set(action, callback);
  }

  // Public API
  getVoiceSettings(): VoiceSettings {
    return { ...this.voiceSettings };
  }

  getAccessibilitySettings(): AccessibilitySettings {
    return { ...this.accessibilitySettings };
  }

  getAvailableCommands(): VoiceCommand[] {
    return this.commands.filter(cmd => cmd.isEnabled);
  }

  isListeningActive(): boolean {
    return this.isListening;
  }

  async provideFeedback(type: 'success' | 'error' | 'info', message: string): Promise<void> {
    if (this.voiceSettings.speechFeedback || this.accessibilitySettings.voiceGuidance) {
      await this.speak(message, type === 'error' ? 'high' : 'medium');
    }

    if (this.voiceSettings.hapticFeedback) {
      const feedbackType = type === 'success' 
        ? Haptics.NotificationFeedbackType.Success
        : type === 'error'
        ? Haptics.NotificationFeedbackType.Error
        : Haptics.NotificationFeedbackType.Warning;
        
      await Haptics.notificationAsync(feedbackType);
    }
  }
}

export const voiceAccessibilityService = new VoiceAccessibilityService();

// Helper functions for easier importing
export const startVoiceRecognition = async () => {
  return voiceAccessibilityService.startListening();
};

export const stopVoiceRecognition = async () => {
  return voiceAccessibilityService.stopListening();
};

export const speak = async (text: string, priority?: AccessibilityAnnouncement['priority']) => {
  return voiceAccessibilityService.speak(text, priority);
};

export const updateVoiceSettings = async (settings: Partial<VoiceSettings>) => {
  return voiceAccessibilityService.updateVoiceSettings(settings);
};

export const updateAccessibilitySettings = async (settings: Partial<AccessibilitySettings>) => {
  return voiceAccessibilityService.updateAccessibilitySettings(settings);
};