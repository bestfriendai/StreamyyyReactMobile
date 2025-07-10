import { ChatMessage } from './realtimeChatService';

export interface EmotionAnalysis {
  id: string;
  sourceId: string;
  sourceType: 'video' | 'audio' | 'text' | 'image' | 'chat';
  emotions: EmotionScore[];
  dominantEmotion: string;
  emotionIntensity: number;
  confidence: number;
  timestamp: string;
  metadata: {
    processingTime: number;
    modelVersion: string;
    algorithm: string;
    features: Record<string, number>;
  };
}

export interface EmotionScore {
  emotion: EmotionType;
  score: number;
  intensity: 'low' | 'medium' | 'high';
  confidence: number;
  triggers: string[];
  context: string[];
}

export type EmotionType = 
  | 'joy' | 'happiness' | 'excitement' | 'amusement' | 'contentment'
  | 'sadness' | 'melancholy' | 'grief' | 'disappointment' | 'despair'
  | 'anger' | 'rage' | 'frustration' | 'irritation' | 'annoyance'
  | 'fear' | 'anxiety' | 'worry' | 'panic' | 'terror'
  | 'surprise' | 'astonishment' | 'amazement' | 'shock' | 'wonder'
  | 'disgust' | 'revulsion' | 'contempt' | 'aversion' | 'loathing'
  | 'neutral' | 'calm' | 'relaxed' | 'peaceful' | 'serene'
  | 'love' | 'affection' | 'caring' | 'compassion' | 'empathy'
  | 'pride' | 'confidence' | 'satisfaction' | 'achievement' | 'triumph'
  | 'shame' | 'guilt' | 'embarrassment' | 'humiliation' | 'regret'
  | 'curiosity' | 'interest' | 'fascination' | 'engagement' | 'intrigue'
  | 'boredom' | 'indifference' | 'apathy' | 'disinterest' | 'monotony';

export interface VideoEmotionAnalysis {
  videoId: string;
  overallEmotions: EmotionScore[];
  temporalEmotions: TemporalEmotion[];
  facialEmotions: FacialEmotionAnalysis[];
  voiceEmotions: VoiceEmotionAnalysis[];
  emotionalArcs: EmotionalArc[];
  emotionalHighlights: EmotionalHighlight[];
  audienceResponse: AudienceEmotionResponse;
  metadata: {
    duration: number;
    fps: number;
    faceCount: number;
    voiceSegments: number;
    processingTime: number;
  };
}

export interface TemporalEmotion {
  timestamp: number;
  duration: number;
  emotions: EmotionScore[];
  dominantEmotion: string;
  intensity: number;
  context: string;
  triggers: string[];
}

export interface FacialEmotionAnalysis {
  faceId: string;
  person: string;
  emotions: EmotionScore[];
  facialFeatures: FacialFeature[];
  microExpressions: MicroExpression[];
  emotionalState: EmotionalState;
  authenticity: number;
  confidence: number;
}

export interface FacialFeature {
  feature: 'eyebrows' | 'eyes' | 'nose' | 'mouth' | 'jaw' | 'cheeks' | 'forehead';
  position: { x: number; y: number };
  movement: string;
  intensity: number;
  emotion_contribution: number;
}

export interface MicroExpression {
  type: string;
  duration: number;
  intensity: number;
  authenticity: number;
  emotional_leak: string;
  timestamp: number;
}

export interface EmotionalState {
  valence: number; // -1 to 1 (negative to positive)
  arousal: number; // 0 to 1 (calm to excited)
  dominance: number; // 0 to 1 (submissive to dominant)
  consistency: number; // 0 to 1 (inconsistent to consistent)
  genuineness: number; // 0 to 1 (fake to genuine)
}

export interface VoiceEmotionAnalysis {
  segmentId: string;
  speaker: string;
  emotions: EmotionScore[];
  prosody: VoiceProsody;
  speechFeatures: SpeechFeature[];
  emotionalMarkers: EmotionalMarker[];
  confidence: number;
}

export interface VoiceProsody {
  pitch: number;
  volume: number;
  tempo: number;
  rhythm: number;
  intonation: number;
  stress_patterns: number[];
}

export interface SpeechFeature {
  feature: 'pitch_variation' | 'volume_change' | 'pause_duration' | 'speech_rate' | 'tremor' | 'breathiness';
  value: number;
  emotional_significance: number;
}

export interface EmotionalMarker {
  type: 'vocal_fry' | 'uptalk' | 'hesitation' | 'emphasis' | 'laughter' | 'sigh' | 'gasp';
  timestamp: number;
  duration: number;
  intensity: number;
  emotion_indicator: string;
}

export interface EmotionalArc {
  startTime: number;
  endTime: number;
  arc_type: 'rise' | 'fall' | 'plateau' | 'valley' | 'peak' | 'cycle';
  emotions: string[];
  intensity_curve: number[];
  narrative_context: string;
  audience_engagement: number;
}

export interface EmotionalHighlight {
  timestamp: number;
  duration: number;
  emotion: string;
  intensity: number;
  significance: number;
  context: string;
  triggers: string[];
  audience_reaction: number;
}

export interface AudienceEmotionResponse {
  chatEmotions: ChatEmotionAnalysis[];
  reactionEmotions: ReactionEmotionAnalysis[];
  engagementCorrelation: number;
  emotionalContagion: number;
  collective_mood: string;
  emotional_synchrony: number;
}

export interface ChatEmotionAnalysis {
  messageId: string;
  userId: string;
  emotions: EmotionScore[];
  sentiment: SentimentAnalysis;
  emotionalIntensity: number;
  contextualEmotions: ContextualEmotion[];
  timestamp: string;
}

export interface SentimentAnalysis {
  polarity: number; // -1 to 1
  subjectivity: number; // 0 to 1
  confidence: number;
  aspects: AspectSentiment[];
}

export interface AspectSentiment {
  aspect: string;
  sentiment: number;
  confidence: number;
  mentions: string[];
}

export interface ContextualEmotion {
  context: string;
  relevance: number;
  emotion: string;
  intensity: number;
}

export interface ReactionEmotionAnalysis {
  userId: string;
  reactionType: string;
  emotion: string;
  intensity: number;
  timestamp: string;
  context: string;
}

export interface EmotionTrend {
  timeframe: string;
  emotions: EmotionTrendData[];
  patterns: EmotionPattern[];
  anomalies: EmotionAnomaly[];
  insights: EmotionInsight[];
}

export interface EmotionTrendData {
  emotion: string;
  values: { timestamp: string; value: number }[];
  trend: 'rising' | 'falling' | 'stable' | 'volatile';
  correlation: number;
}

export interface EmotionPattern {
  pattern_type: 'daily' | 'weekly' | 'event_based' | 'seasonal' | 'contextual';
  description: string;
  frequency: number;
  strength: number;
  predictability: number;
}

export interface EmotionAnomaly {
  timestamp: string;
  emotion: string;
  expected_value: number;
  actual_value: number;
  deviation: number;
  significance: number;
  context: string;
}

export interface EmotionInsight {
  type: 'correlation' | 'causation' | 'pattern' | 'anomaly' | 'trend';
  description: string;
  confidence: number;
  actionable: boolean;
  recommendations: string[];
}

export interface EmotionPrediction {
  targetEmotion: string;
  probability: number;
  confidence: number;
  timeframe: string;
  factors: PredictionFactor[];
  scenarios: EmotionScenario[];
}

export interface PredictionFactor {
  factor: string;
  weight: number;
  description: string;
  impact: number;
}

export interface EmotionScenario {
  scenario: string;
  probability: number;
  emotions: { emotion: string; intensity: number }[];
  triggers: string[];
}

export interface EmotionBasedRecommendation {
  type: 'content' | 'timing' | 'interaction' | 'moderation' | 'engagement';
  recommendation: string;
  reasoning: string;
  confidence: number;
  expected_impact: number;
  target_emotions: string[];
}

export interface RealTimeEmotionFeed {
  streamId: string;
  currentEmotions: EmotionScore[];
  emotionVelocity: number;
  emotionTrend: string;
  audienceSync: number;
  alerts: EmotionAlert[];
  predictions: EmotionPrediction[];
  lastUpdate: string;
}

export interface EmotionAlert {
  type: 'high_intensity' | 'negative_spike' | 'emotional_drop' | 'anomaly' | 'opportunity';
  emotion: string;
  intensity: number;
  description: string;
  actionable: boolean;
  recommendations: string[];
  timestamp: string;
}

export interface EmotionProfile {
  userId: string;
  emotionalTraits: EmotionalTrait[];
  emotionalPreferences: EmotionalPreference[];
  emotionalHistory: EmotionalHistory;
  emotionalResponsiveness: number;
  emotionalIntelligence: number;
  emotionalStability: number;
  socialEmotions: SocialEmotionProfile;
}

export interface EmotionalTrait {
  trait: string;
  score: number;
  consistency: number;
  contexts: string[];
  development: number;
}

export interface EmotionalPreference {
  emotion: string;
  preference: number;
  context: string;
  triggers: string[];
  avoidance: number;
}

export interface EmotionalHistory {
  dominantEmotions: string[];
  emotionalEvolution: { period: string; emotions: string[] }[];
  significantEvents: EmotionalEvent[];
  patterns: EmotionPattern[];
}

export interface EmotionalEvent {
  timestamp: string;
  event: string;
  emotions: string[];
  intensity: number;
  impact: number;
  context: string;
}

export interface SocialEmotionProfile {
  empathy: number;
  emotional_contagion: number;
  social_influence: number;
  group_dynamics: number;
  leadership_emotions: number;
}

class EmotionRecognitionService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_AI_API_URL || 'https://api.streammulti.com/emotion';
  private readonly apiKey = process.env.EXPO_PUBLIC_AI_API_KEY || '';
  private readonly cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTimeout = 2 * 60 * 1000; // 2 minutes for real-time data
  private activeStreams: Map<string, RealTimeEmotionFeed> = new Map();
  private emotionProfiles: Map<string, EmotionProfile> = new Map();

  constructor() {
    console.log('Emotion Recognition Service initialized');
    this.startRealTimeProcessing();
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Emotion API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }

  /**
   * Analyze emotions in video stream
   */
  async analyzeVideoEmotions(videoId: string, options?: {
    realTime?: boolean;
    includeFacial?: boolean;
    includeVoice?: boolean;
    includeAudience?: boolean;
  }): Promise<VideoEmotionAnalysis> {
    console.log('🎭 Analyzing video emotions:', videoId);
    
    try {
      const startTime = Date.now();
      
      const analysis = await this.makeRequest<VideoEmotionAnalysis>('/analyze/video', {
        method: 'POST',
        body: JSON.stringify({
          videoId,
          options: {
            realTime: options?.realTime ?? false,
            includeFacial: options?.includeFacial ?? true,
            includeVoice: options?.includeVoice ?? true,
            includeAudience: options?.includeAudience ?? true,
          }
        })
      });

      analysis.metadata.processingTime = Date.now() - startTime;
      
      console.log('✅ Video emotion analysis completed:', analysis.overallEmotions.length, 'emotions detected');
      return analysis;
      
    } catch (error) {
      console.error('❌ Failed to analyze video emotions:', error);
      throw error;
    }
  }

  /**
   * Analyze emotions in chat messages
   */
  async analyzeChatEmotions(messages: ChatMessage[]): Promise<ChatEmotionAnalysis[]> {
    console.log('💬 Analyzing chat emotions:', messages.length, 'messages');
    
    try {
      const analyses = await this.makeRequest<ChatEmotionAnalysis[]>('/analyze/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: messages.map(msg => ({
            id: msg.id,
            text: msg.message,
            userId: msg.userId,
            username: msg.username,
            timestamp: msg.timestamp,
            context: {
              roomId: msg.roomId,
              replyTo: msg.replyTo,
              mentions: msg.mentions
            }
          }))
        })
      });
      
      console.log('✅ Chat emotion analysis completed:', analyses.length, 'analyses');
      return analyses;
      
    } catch (error) {
      console.error('❌ Failed to analyze chat emotions:', error);
      throw error;
    }
  }

  /**
   * Analyze single text for emotions
   */
  async analyzeTextEmotions(text: string, context?: {
    userId?: string;
    conversationId?: string;
    timestamp?: string;
  }): Promise<EmotionAnalysis> {
    console.log('📝 Analyzing text emotions:', text.substring(0, 50) + '...');
    
    try {
      const startTime = Date.now();
      
      const analysis = await this.makeRequest<EmotionAnalysis>('/analyze/text', {
        method: 'POST',
        body: JSON.stringify({
          text,
          context: context || {},
          timestamp: new Date().toISOString()
        })
      });

      analysis.metadata.processingTime = Date.now() - startTime;
      
      console.log('✅ Text emotion analysis completed:', analysis.dominantEmotion);
      return analysis;
      
    } catch (error) {
      console.error('❌ Failed to analyze text emotions:', error);
      throw error;
    }
  }

  /**
   * Get real-time emotion feed for a stream
   */
  async getRealTimeEmotionFeed(streamId: string): Promise<RealTimeEmotionFeed> {
    console.log('⚡ Getting real-time emotion feed:', streamId);
    
    try {
      const feed = await this.makeRequest<RealTimeEmotionFeed>(`/realtime/${streamId}`);
      
      this.activeStreams.set(streamId, feed);
      console.log('✅ Real-time emotion feed retrieved:', feed.currentEmotions.length, 'emotions');
      return feed;
      
    } catch (error) {
      console.error('❌ Failed to get real-time emotion feed:', error);
      throw error;
    }
  }

  /**
   * Predict future emotions based on current patterns
   */
  async predictEmotions(streamId: string, targetEmotion: string, timeframe: string): Promise<EmotionPrediction> {
    console.log('🔮 Predicting emotions:', targetEmotion, 'for', timeframe);
    
    try {
      const prediction = await this.makeRequest<EmotionPrediction>('/predict/emotions', {
        method: 'POST',
        body: JSON.stringify({
          streamId,
          targetEmotion,
          timeframe,
          context: {
            currentTime: new Date().toISOString(),
            activeViewers: 0, // Would get from analytics
            recentTrends: []
          }
        })
      });
      
      console.log('✅ Emotion prediction completed:', prediction.probability);
      return prediction;
      
    } catch (error) {
      console.error('❌ Failed to predict emotions:', error);
      throw error;
    }
  }

  /**
   * Get emotion trends over time
   */
  async getEmotionTrends(streamId: string, timeframe: string): Promise<EmotionTrend> {
    console.log('📊 Getting emotion trends:', streamId, 'for', timeframe);
    
    try {
      const trends = await this.makeRequest<EmotionTrend>(`/trends/${streamId}`, {
        method: 'POST',
        body: JSON.stringify({ timeframe })
      });
      
      console.log('✅ Emotion trends retrieved:', trends.emotions.length, 'emotion types');
      return trends;
      
    } catch (error) {
      console.error('❌ Failed to get emotion trends:', error);
      throw error;
    }
  }

  /**
   * Get emotion-based recommendations
   */
  async getEmotionBasedRecommendations(streamId: string, currentEmotions: EmotionScore[]): Promise<EmotionBasedRecommendation[]> {
    console.log('💡 Getting emotion-based recommendations:', streamId);
    
    try {
      const recommendations = await this.makeRequest<EmotionBasedRecommendation[]>('/recommendations', {
        method: 'POST',
        body: JSON.stringify({
          streamId,
          currentEmotions,
          context: {
            timestamp: new Date().toISOString(),
            viewerCount: 0, // Would get from analytics
            chatActivity: 0
          }
        })
      });
      
      console.log('✅ Emotion-based recommendations retrieved:', recommendations.length, 'recommendations');
      return recommendations;
      
    } catch (error) {
      console.error('❌ Failed to get emotion-based recommendations:', error);
      throw error;
    }
  }

  /**
   * Get or create emotion profile for user
   */
  async getEmotionProfile(userId: string): Promise<EmotionProfile> {
    if (this.emotionProfiles.has(userId)) {
      return this.emotionProfiles.get(userId)!;
    }

    console.log('👤 Getting emotion profile:', userId);
    
    try {
      const profile = await this.makeRequest<EmotionProfile>(`/profile/${userId}`);
      
      this.emotionProfiles.set(userId, profile);
      console.log('✅ Emotion profile retrieved');
      return profile;
      
    } catch (error) {
      console.error('❌ Failed to get emotion profile:', error);
      
      // Create default profile
      const defaultProfile: EmotionProfile = {
        userId,
        emotionalTraits: [],
        emotionalPreferences: [],
        emotionalHistory: {
          dominantEmotions: ['neutral'],
          emotionalEvolution: [],
          significantEvents: [],
          patterns: []
        },
        emotionalResponsiveness: 0.5,
        emotionalIntelligence: 0.5,
        emotionalStability: 0.5,
        socialEmotions: {
          empathy: 0.5,
          emotional_contagion: 0.5,
          social_influence: 0.5,
          group_dynamics: 0.5,
          leadership_emotions: 0.5
        }
      };
      
      this.emotionProfiles.set(userId, defaultProfile);
      return defaultProfile;
    }
  }

  /**
   * Update emotion profile based on new data
   */
  async updateEmotionProfile(userId: string, emotionData: {
    emotions: EmotionScore[];
    context: string;
    timestamp: string;
  }): Promise<void> {
    console.log('🔄 Updating emotion profile:', userId);
    
    try {
      const profile = await this.getEmotionProfile(userId);
      
      // Update with new emotion data
      await this.makeRequest(`/profile/${userId}/update`, {
        method: 'POST',
        body: JSON.stringify({
          emotionData,
          currentProfile: profile
        })
      });
      
      // Refresh cached profile
      this.emotionProfiles.delete(userId);
      
      console.log('✅ Emotion profile updated');
      
    } catch (error) {
      console.error('❌ Failed to update emotion profile:', error);
    }
  }

  /**
   * Analyze emotional synchrony between users
   */
  async analyzeEmotionalSynchrony(userIds: string[], timeframe: string): Promise<{
    synchrony: number;
    patterns: EmotionPattern[];
    influences: { userId: string; influence: number }[];
    clusters: { users: string[]; emotion: string; strength: number }[];
  }> {
    console.log('🤝 Analyzing emotional synchrony:', userIds.length, 'users');
    
    try {
      const synchrony = await this.makeRequest<{
        synchrony: number;
        patterns: EmotionPattern[];
        influences: { userId: string; influence: number }[];
        clusters: { users: string[]; emotion: string; strength: number }[];
      }>('/analyze/synchrony', {
        method: 'POST',
        body: JSON.stringify({
          userIds,
          timeframe,
          analysisType: 'group_dynamics'
        })
      });
      
      console.log('✅ Emotional synchrony analysis completed');
      return synchrony;
      
    } catch (error) {
      console.error('❌ Failed to analyze emotional synchrony:', error);
      throw error;
    }
  }

  /**
   * Detect emotional anomalies in stream
   */
  async detectEmotionalAnomalies(streamId: string, timeframe: string): Promise<EmotionAnomaly[]> {
    console.log('🚨 Detecting emotional anomalies:', streamId);
    
    try {
      const anomalies = await this.makeRequest<EmotionAnomaly[]>(`/anomalies/${streamId}`, {
        method: 'POST',
        body: JSON.stringify({
          timeframe,
          sensitivity: 0.8,
          includeContext: true
        })
      });
      
      console.log('✅ Emotional anomaly detection completed:', anomalies.length, 'anomalies');
      return anomalies;
      
    } catch (error) {
      console.error('❌ Failed to detect emotional anomalies:', error);
      throw error;
    }
  }

  /**
   * Generate emotional insights for content creator
   */
  async generateEmotionalInsights(streamId: string, period: string): Promise<EmotionInsight[]> {
    console.log('💡 Generating emotional insights:', streamId);
    
    try {
      const insights = await this.makeRequest<EmotionInsight[]>(`/insights/${streamId}`, {
        method: 'POST',
        body: JSON.stringify({
          period,
          includeRecommendations: true,
          includeComparisons: true,
          includeProjections: true
        })
      });
      
      console.log('✅ Emotional insights generated:', insights.length, 'insights');
      return insights;
      
    } catch (error) {
      console.error('❌ Failed to generate emotional insights:', error);
      throw error;
    }
  }

  /**
   * Analyze emotional contagion in community
   */
  async analyzeEmotionalContagion(streamId: string, timeframe: string): Promise<{
    contagion_strength: number;
    propagation_patterns: { emotion: string; speed: number; reach: number }[];
    influence_network: { userId: string; influence: number; influenced_by: string[] }[];
    emotion_clusters: { emotion: string; users: string[]; strength: number }[];
  }> {
    console.log('🔗 Analyzing emotional contagion:', streamId);
    
    try {
      const contagion = await this.makeRequest<{
        contagion_strength: number;
        propagation_patterns: { emotion: string; speed: number; reach: number }[];
        influence_network: { userId: string; influence: number; influenced_by: string[] }[];
        emotion_clusters: { emotion: string; users: string[]; strength: number }[];
      }>('/analyze/contagion', {
        method: 'POST',
        body: JSON.stringify({
          streamId,
          timeframe,
          includeNetwork: true,
          includeClusters: true
        })
      });
      
      console.log('✅ Emotional contagion analysis completed');
      return contagion;
      
    } catch (error) {
      console.error('❌ Failed to analyze emotional contagion:', error);
      throw error;
    }
  }

  /**
   * Create emotional heatmap for content
   */
  async createEmotionalHeatmap(streamId: string, duration: number): Promise<{
    heatmap: { timestamp: number; emotions: { emotion: string; intensity: number }[] }[];
    peaks: { timestamp: number; emotion: string; intensity: number }[];
    valleys: { timestamp: number; emotion: string; intensity: number }[];
    transitions: { from: string; to: string; timestamp: number; smoothness: number }[];
  }> {
    console.log('🗺️ Creating emotional heatmap:', streamId);
    
    try {
      const heatmap = await this.makeRequest<{
        heatmap: { timestamp: number; emotions: { emotion: string; intensity: number }[] }[];
        peaks: { timestamp: number; emotion: string; intensity: number }[];
        valleys: { timestamp: number; emotion: string; intensity: number }[];
        transitions: { from: string; to: string; timestamp: number; smoothness: number }[];
      }>('/heatmap', {
        method: 'POST',
        body: JSON.stringify({
          streamId,
          duration,
          resolution: 'high',
          includeTransitions: true
        })
      });
      
      console.log('✅ Emotional heatmap created');
      return heatmap;
      
    } catch (error) {
      console.error('❌ Failed to create emotional heatmap:', error);
      throw error;
    }
  }

  /**
   * Start real-time emotion processing
   */
  private startRealTimeProcessing(): void {
    console.log('🔄 Starting real-time emotion processing');
    
    // Update active streams every 30 seconds
    setInterval(async () => {
      for (const [streamId, feed] of this.activeStreams) {
        try {
          const updatedFeed = await this.getRealTimeEmotionFeed(streamId);
          this.activeStreams.set(streamId, updatedFeed);
          
          // Check for alerts
          if (updatedFeed.alerts.length > 0) {
            console.log('⚠️ Emotion alerts for stream:', streamId, updatedFeed.alerts.length);
            // Could emit events here for UI updates
          }
        } catch (error) {
          console.error('Failed to update real-time emotion feed:', error);
        }
      }
    }, 30000);
  }

  /**
   * Subscribe to emotion alerts for a stream
   */
  subscribeToEmotionAlerts(streamId: string, callback: (alerts: EmotionAlert[]) => void): () => void {
    console.log('🔔 Subscribing to emotion alerts:', streamId);
    
    const intervalId = setInterval(async () => {
      try {
        const feed = await this.getRealTimeEmotionFeed(streamId);
        if (feed.alerts.length > 0) {
          callback(feed.alerts);
        }
      } catch (error) {
        console.error('Failed to check emotion alerts:', error);
      }
    }, 10000); // Check every 10 seconds
    
    return () => {
      clearInterval(intervalId);
      console.log('🔕 Unsubscribed from emotion alerts:', streamId);
    };
  }

  /**
   * Get emotion statistics for dashboard
   */
  async getEmotionStatistics(streamId: string, timeframe: string): Promise<{
    totalEmotions: number;
    dominantEmotions: { emotion: string; percentage: number }[];
    intensityAverage: number;
    emotionalVolatility: number;
    positiveRatio: number;
    engagementCorrelation: number;
    peakEmotions: { emotion: string; timestamp: string; intensity: number }[];
  }> {
    console.log('📊 Getting emotion statistics:', streamId);
    
    try {
      const stats = await this.makeRequest<{
        totalEmotions: number;
        dominantEmotions: { emotion: string; percentage: number }[];
        intensityAverage: number;
        emotionalVolatility: number;
        positiveRatio: number;
        engagementCorrelation: number;
        peakEmotions: { emotion: string; timestamp: string; intensity: number }[];
      }>(`/statistics/${streamId}`, {
        method: 'POST',
        body: JSON.stringify({ timeframe })
      });
      
      console.log('✅ Emotion statistics retrieved');
      return stats;
      
    } catch (error) {
      console.error('❌ Failed to get emotion statistics:', error);
      throw error;
    }
  }

  /**
   * Clear emotion cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('✅ Emotion recognition cache cleared');
  }

  /**
   * Stop real-time processing for a stream
   */
  stopRealTimeProcessing(streamId: string): void {
    this.activeStreams.delete(streamId);
    console.log('⏹️ Stopped real-time emotion processing for:', streamId);
  }

  /**
   * Get active emotion streams
   */
  getActiveEmotionStreams(): string[] {
    return Array.from(this.activeStreams.keys());
  }
}

export const emotionRecognitionService = new EmotionRecognitionService();
export default emotionRecognitionService;