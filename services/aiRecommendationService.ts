import { UnifiedStream } from './platformService';
import { ViewerAnalytics } from './analyticsService';
import { ChatMessage } from './realtimeChatService';

export interface UserProfile {
  id: string;
  username: string;
  preferences: {
    categories: string[];
    platforms: string[];
    languages: string[];
    averageWatchTime: number;
    preferredStreamLength: number;
    favoriteStreamers: string[];
    timeZone: string;
    peakViewingHours: number[];
  };
  behavior: {
    clickThroughRate: number;
    engagementScore: number;
    retentionRate: number;
    socialActivity: number;
    chatActivity: number;
    diversityScore: number;
    newContentOpenness: number;
  };
  demographics: {
    age?: number;
    country?: string;
    language: string;
    device: string;
    subscriptionTier: string;
  };
  contextualFactors: {
    currentMood?: string;
    timeOfDay: string;
    dayOfWeek: string;
    season: string;
    weatherCondition?: string;
    socialContext?: string;
  };
  feedback: {
    explicitRatings: { [streamId: string]: number };
    implicitFeedback: { [streamId: string]: ImplicitFeedback };
    contentReports: string[];
  };
  embeddings: {
    contentEmbedding: number[];
    behaviorEmbedding: number[];
    socialEmbedding: number[];
  };
}

export interface ImplicitFeedback {
  watchDuration: number;
  clickThroughRate: number;
  skipRate: number;
  shareCount: number;
  chatMessages: number;
  reactions: number;
  returnVisits: number;
  bufferTolerance: number;
  qualityChanges: number;
  volumeChanges: number;
  timestamp: string;
}

export interface RecommendationRequest {
  userId: string;
  context: RecommendationContext;
  count: number;
  diversityLevel: number;
  explanationType: 'none' | 'simple' | 'detailed';
  includeNovelty: boolean;
  filterOptions?: {
    excludeCategories?: string[];
    excludeStreamers?: string[];
    minViewerCount?: number;
    maxViewerCount?: number;
    language?: string;
    maturityRating?: string;
  };
}

export interface RecommendationContext {
  currentTime: string;
  deviceType: string;
  location?: string;
  connectionSpeed?: string;
  batteryLevel?: number;
  currentStream?: string;
  sessionDuration: number;
  recentActivity: string[];
  socialContext?: {
    friendsWatching: string[];
    trendingInNetwork: string[];
    groupWatchingSession?: string;
  };
}

export interface Recommendation {
  stream: UnifiedStream;
  score: number;
  confidence: number;
  reasons: RecommendationReason[];
  explanation: string;
  noveltyScore: number;
  diversityContribution: number;
  expectedEngagement: number;
  personalizedRank: number;
  contextualRelevance: number;
  qualityScore: number;
  metadata: {
    algorithm: string;
    modelVersion: string;
    computeTime: number;
    features: { [key: string]: number };
    alternativeOptions: number;
  };
}

export interface RecommendationReason {
  type: 'content_similarity' | 'collaborative_filtering' | 'popularity' | 'trending' | 'contextual' | 'social' | 'seasonal' | 'personal_history';
  strength: number;
  description: string;
  evidence: string[];
}

export interface MLModel {
  id: string;
  name: string;
  version: string;
  type: 'collaborative_filtering' | 'content_based' | 'deep_learning' | 'hybrid' | 'reinforcement_learning';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingDate: string;
  lastUpdated: string;
  parameters: Record<string, any>;
  performance: {
    avgResponseTime: number;
    throughput: number;
    errorRate: number;
    memoryUsage: number;
  };
}

export interface ContentEmbedding {
  streamId: string;
  embedding: number[];
  features: {
    category: string;
    tags: string[];
    title: string;
    description: string;
    visualFeatures: number[];
    audioFeatures: number[];
    streamQuality: number;
    contentRating: number;
    duration: number;
    language: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DeepLearningPredictor {
  predictEngagement(userProfile: UserProfile, stream: UnifiedStream): Promise<number>;
  predictWatchTime(userProfile: UserProfile, stream: UnifiedStream): Promise<number>;
  predictChurnRisk(userProfile: UserProfile): Promise<number>;
  predictContentTrend(stream: UnifiedStream): Promise<number>;
  predictOptimalSchedule(userProfile: UserProfile): Promise<{ hour: number; day: number; probability: number }[]>;
}

export interface ReinforcementLearningAgent {
  selectAction(state: UserProfile, availableActions: UnifiedStream[]): Promise<UnifiedStream>;
  updatePolicy(state: UserProfile, action: UnifiedStream, reward: number): Promise<void>;
  exploreExploit(explorationRate: number): boolean;
  getOptimalPolicy(state: UserProfile): Promise<UnifiedStream[]>;
}

export interface RecommendationExperiment {
  id: string;
  name: string;
  type: 'a_b_test' | 'multi_armed_bandit' | 'contextual_bandit';
  status: 'active' | 'completed' | 'paused';
  algorithms: string[];
  trafficSplit: number[];
  metrics: {
    clickThroughRate: number;
    engagementRate: number;
    retentionRate: number;
    diversityScore: number;
    noveltyScore: number;
    userSatisfaction: number;
  };
  startDate: string;
  endDate?: string;
  participants: number;
  statisticalSignificance: number;
}

class AIRecommendationService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_AI_API_URL || 'https://api.streammulti.com/ai';
  private readonly apiKey = process.env.EXPO_PUBLIC_AI_API_KEY || '';
  private userProfiles: Map<string, UserProfile> = new Map();
  private contentEmbeddings: Map<string, ContentEmbedding> = new Map();
  private models: Map<string, MLModel> = new Map();
  private experiments: Map<string, RecommendationExperiment> = new Map();
  private deepLearningPredictor: DeepLearningPredictor;
  private reinforcementAgent: ReinforcementLearningAgent;
  private readonly cacheTimeout = 10 * 60 * 1000; // 10 minutes
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor() {
    console.log('AI Recommendation Service initialized');
    this.initializeModels();
    this.initializeDeepLearning();
    this.initializeReinforcementLearning();
    this.startRealTimeUpdates();
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
      throw new Error(`AI API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }

  /**
   * Get personalized recommendations using advanced AI models
   */
  async getRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
    console.log('🧠 Generating AI recommendations for user:', request.userId);
    
    try {
      const startTime = Date.now();
      
      // Get user profile
      const userProfile = await this.getUserProfile(request.userId);
      
      // Get candidate streams
      const candidateStreams = await this.getCandidateStreams(request);
      
      // Generate recommendations using ensemble of models
      const recommendations = await this.generateEnsembleRecommendations(
        userProfile, 
        candidateStreams, 
        request
      );
      
      // Apply diversity and novelty filters
      const diversifiedRecommendations = this.applyDiversityFilter(
        recommendations, 
        request.diversityLevel
      );
      
      // Re-rank based on contextual factors
      const contextualRecommendations = await this.applyContextualReranking(
        diversifiedRecommendations, 
        request.context
      );
      
      // Apply reinforcement learning optimization
      const optimizedRecommendations = await this.applyReinforcementLearning(
        contextualRecommendations, 
        userProfile
      );
      
      // Generate explanations
      const finalRecommendations = await this.generateExplanations(
        optimizedRecommendations, 
        request.explanationType
      );
      
      const computeTime = Date.now() - startTime;
      
      // Update metadata
      finalRecommendations.forEach(rec => {
        rec.metadata.computeTime = computeTime;
        rec.metadata.alternativeOptions = candidateStreams.length;
      });
      
      // Log performance metrics
      await this.logRecommendationMetrics(request.userId, finalRecommendations, computeTime);
      
      console.log('✅ AI recommendations generated:', finalRecommendations.length, 'items in', computeTime, 'ms');
      return finalRecommendations.slice(0, request.count);
      
    } catch (error) {
      console.error('❌ Failed to generate AI recommendations:', error);
      
      // Fallback to basic recommendations
      return this.getFallbackRecommendations(request);
    }
  }

  /**
   * Get or create user profile with advanced behavioral analysis
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!;
    }

    try {
      const profile = await this.makeRequest<UserProfile>(`/users/${userId}/profile`);
      
      // Generate embeddings
      profile.embeddings = await this.generateUserEmbeddings(profile);
      
      this.userProfiles.set(userId, profile);
      return profile;
      
    } catch (error) {
      console.error('Failed to get user profile:', error);
      
      // Create default profile
      const defaultProfile: UserProfile = {
        id: userId,
        username: userId,
        preferences: {
          categories: [],
          platforms: ['twitch'],
          languages: ['en'],
          averageWatchTime: 30,
          preferredStreamLength: 60,
          favoriteStreamers: [],
          timeZone: 'UTC',
          peakViewingHours: [19, 20, 21]
        },
        behavior: {
          clickThroughRate: 0.1,
          engagementScore: 0.5,
          retentionRate: 0.6,
          socialActivity: 0.3,
          chatActivity: 0.2,
          diversityScore: 0.5,
          newContentOpenness: 0.4
        },
        demographics: {
          language: 'en',
          device: 'web',
          subscriptionTier: 'free'
        },
        contextualFactors: {
          timeOfDay: 'evening',
          dayOfWeek: 'weekday',
          season: 'summer'
        },
        feedback: {
          explicitRatings: {},
          implicitFeedback: {},
          contentReports: []
        },
        embeddings: {
          contentEmbedding: new Array(128).fill(0),
          behaviorEmbedding: new Array(64).fill(0),
          socialEmbedding: new Array(32).fill(0)
        }
      };
      
      this.userProfiles.set(userId, defaultProfile);
      return defaultProfile;
    }
  }

  /**
   * Update user profile with real-time behavioral data
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const profile = await this.getUserProfile(userId);
    
    // Merge updates with existing profile
    const updatedProfile = { ...profile, ...updates };
    
    // Regenerate embeddings if behavior changed
    if (updates.behavior || updates.preferences) {
      updatedProfile.embeddings = await this.generateUserEmbeddings(updatedProfile);
    }
    
    this.userProfiles.set(userId, updatedProfile);
    
    // Update remote profile
    await this.makeRequest(`/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(updatedProfile)
    });
  }

  /**
   * Record user interaction for learning
   */
  async recordInteraction(userId: string, streamId: string, interaction: {
    type: 'view' | 'click' | 'share' | 'like' | 'skip' | 'chat' | 'follow';
    duration?: number;
    engagement?: number;
    context?: Record<string, any>;
  }): Promise<void> {
    try {
      // Update user profile
      const profile = await this.getUserProfile(userId);
      
      // Record implicit feedback
      const feedback: ImplicitFeedback = {
        watchDuration: interaction.duration || 0,
        clickThroughRate: interaction.type === 'click' ? 1 : 0,
        skipRate: interaction.type === 'skip' ? 1 : 0,
        shareCount: interaction.type === 'share' ? 1 : 0,
        chatMessages: interaction.type === 'chat' ? 1 : 0,
        reactions: interaction.type === 'like' ? 1 : 0,
        returnVisits: 0,
        bufferTolerance: 0,
        qualityChanges: 0,
        volumeChanges: 0,
        timestamp: new Date().toISOString()
      };
      
      profile.feedback.implicitFeedback[streamId] = feedback;
      
      // Update behavioral scores
      this.updateBehavioralScores(profile, interaction);
      
      // Update reinforcement learning agent
      await this.updateReinforcementLearning(profile, streamId, interaction);
      
      // Store updated profile
      this.userProfiles.set(userId, profile);
      
      // Send to analytics service
      await this.makeRequest('/interactions', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          streamId,
          interaction,
          timestamp: new Date().toISOString()
        })
      });
      
    } catch (error) {
      console.error('Failed to record interaction:', error);
    }
  }

  /**
   * Get content similarity recommendations
   */
  async getContentSimilarRecommendations(
    baseStreamId: string, 
    userId: string, 
    count: number = 10
  ): Promise<Recommendation[]> {
    try {
      const baseEmbedding = await this.getContentEmbedding(baseStreamId);
      if (!baseEmbedding) {
        throw new Error('Base content embedding not found');
      }

      const similarities = await this.makeRequest<{
        streamId: string;
        similarity: number;
        stream: UnifiedStream;
      }[]>('/content/similar', {
        method: 'POST',
        body: JSON.stringify({
          embedding: baseEmbedding.embedding,
          count: count * 2 // Get more for filtering
        })
      });

      const userProfile = await this.getUserProfile(userId);
      
      const recommendations: Recommendation[] = [];
      for (const similar of similarities) {
        const score = await this.calculatePersonalizedScore(userProfile, similar.stream);
        
        recommendations.push({
          stream: similar.stream,
          score: score * similar.similarity,
          confidence: similar.similarity,
          reasons: [{
            type: 'content_similarity',
            strength: similar.similarity,
            description: `Similar to content you've watched before`,
            evidence: [`Content similarity: ${(similar.similarity * 100).toFixed(1)}%`]
          }],
          explanation: `Recommended because it's similar to content you've enjoyed`,
          noveltyScore: await this.calculateNoveltyScore(userProfile, similar.stream),
          diversityContribution: 0,
          expectedEngagement: score,
          personalizedRank: 0,
          contextualRelevance: 0.5,
          qualityScore: similar.stream.viewerCount / 1000,
          metadata: {
            algorithm: 'content_similarity',
            modelVersion: '1.0',
            computeTime: 0,
            features: { similarity: similar.similarity },
            alternativeOptions: 0
          }
        });
      }

      return recommendations.slice(0, count);
      
    } catch (error) {
      console.error('Failed to get content similar recommendations:', error);
      return [];
    }
  }

  /**
   * Get collaborative filtering recommendations
   */
  async getCollaborativeFilteringRecommendations(
    userId: string, 
    count: number = 10
  ): Promise<Recommendation[]> {
    try {
      const userProfile = await this.getUserProfile(userId);
      
      const recommendations = await this.makeRequest<{
        streamId: string;
        score: number;
        stream: UnifiedStream;
        similarUsers: string[];
      }[]>('/collaborative/recommendations', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          userEmbedding: userProfile.embeddings.behaviorEmbedding,
          count: count * 2
        })
      });

      const results: Recommendation[] = [];
      for (const rec of recommendations) {
        const personalizedScore = await this.calculatePersonalizedScore(userProfile, rec.stream);
        
        results.push({
          stream: rec.stream,
          score: personalizedScore * rec.score,
          confidence: rec.score,
          reasons: [{
            type: 'collaborative_filtering',
            strength: rec.score,
            description: `Users with similar preferences enjoyed this`,
            evidence: [`${rec.similarUsers.length} similar users watched this`]
          }],
          explanation: `Recommended because users with similar taste enjoyed it`,
          noveltyScore: await this.calculateNoveltyScore(userProfile, rec.stream),
          diversityContribution: 0,
          expectedEngagement: personalizedScore,
          personalizedRank: 0,
          contextualRelevance: 0.5,
          qualityScore: rec.stream.viewerCount / 1000,
          metadata: {
            algorithm: 'collaborative_filtering',
            modelVersion: '1.0',
            computeTime: 0,
            features: { collaborative_score: rec.score },
            alternativeOptions: 0
          }
        });
      }

      return results.slice(0, count);
      
    } catch (error) {
      console.error('Failed to get collaborative filtering recommendations:', error);
      return [];
    }
  }

  /**
   * Get trending recommendations with personalization
   */
  async getTrendingRecommendations(
    userId: string, 
    count: number = 10
  ): Promise<Recommendation[]> {
    try {
      const userProfile = await this.getUserProfile(userId);
      
      const trending = await this.makeRequest<{
        streamId: string;
        trendingScore: number;
        stream: UnifiedStream;
        trendingFactors: string[];
      }[]>('/trending/personalized', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          preferences: userProfile.preferences,
          count: count * 2
        })
      });

      const recommendations: Recommendation[] = [];
      for (const trend of trending) {
        const personalizedScore = await this.calculatePersonalizedScore(userProfile, trend.stream);
        
        recommendations.push({
          stream: trend.stream,
          score: personalizedScore * trend.trendingScore,
          confidence: trend.trendingScore,
          reasons: [{
            type: 'trending',
            strength: trend.trendingScore,
            description: `Currently trending and matches your interests`,
            evidence: trend.trendingFactors
          }],
          explanation: `Trending now and aligned with your preferences`,
          noveltyScore: await this.calculateNoveltyScore(userProfile, trend.stream),
          diversityContribution: 0,
          expectedEngagement: personalizedScore,
          personalizedRank: 0,
          contextualRelevance: 0.7,
          qualityScore: trend.stream.viewerCount / 1000,
          metadata: {
            algorithm: 'trending_personalized',
            modelVersion: '1.0',
            computeTime: 0,
            features: { trending_score: trend.trendingScore },
            alternativeOptions: 0
          }
        });
      }

      return recommendations.slice(0, count);
      
    } catch (error) {
      console.error('Failed to get trending recommendations:', error);
      return [];
    }
  }

  /**
   * Deep learning predictions for engagement
   */
  async predictEngagement(userId: string, streamId: string): Promise<{
    engagementScore: number;
    watchTimeMinutes: number;
    churnRisk: number;
    factors: { [key: string]: number };
  }> {
    try {
      const userProfile = await this.getUserProfile(userId);
      const stream = await this.getStreamById(streamId);
      
      if (!stream) {
        throw new Error('Stream not found');
      }

      const predictions = await this.makeRequest<{
        engagementScore: number;
        watchTimeMinutes: number;
        churnRisk: number;
        factors: { [key: string]: number };
      }>('/predictions/engagement', {
        method: 'POST',
        body: JSON.stringify({
          userProfile,
          stream,
          context: {
            timeOfDay: new Date().getHours(),
            dayOfWeek: new Date().getDay(),
            deviceType: userProfile.demographics.device
          }
        })
      });

      return predictions;
      
    } catch (error) {
      console.error('Failed to predict engagement:', error);
      return {
        engagementScore: 0.5,
        watchTimeMinutes: 15,
        churnRisk: 0.3,
        factors: {}
      };
    }
  }

  /**
   * A/B test different recommendation algorithms
   */
  async runRecommendationExperiment(
    userId: string, 
    experimentId: string,
    request: RecommendationRequest
  ): Promise<Recommendation[]> {
    try {
      const experiment = this.experiments.get(experimentId);
      if (!experiment || experiment.status !== 'active') {
        return this.getRecommendations(request);
      }

      // Determine which algorithm to use based on traffic split
      const rand = Math.random();
      let algorithmIndex = 0;
      let cumulative = 0;
      
      for (let i = 0; i < experiment.trafficSplit.length; i++) {
        cumulative += experiment.trafficSplit[i];
        if (rand < cumulative) {
          algorithmIndex = i;
          break;
        }
      }

      const algorithm = experiment.algorithms[algorithmIndex];
      
      // Get recommendations using selected algorithm
      const recommendations = await this.getRecommendationsByAlgorithm(
        algorithm, 
        request
      );

      // Log experiment participation
      await this.logExperimentParticipation(userId, experimentId, algorithm);

      return recommendations;
      
    } catch (error) {
      console.error('Failed to run recommendation experiment:', error);
      return this.getRecommendations(request);
    }
  }

  // Private helper methods

  private async initializeModels(): Promise<void> {
    try {
      const models = await this.makeRequest<MLModel[]>('/models');
      models.forEach(model => {
        this.models.set(model.id, model);
      });
      console.log('✅ ML models initialized:', models.length);
    } catch (error) {
      console.error('Failed to initialize ML models:', error);
    }
  }

  private initializeDeepLearning(): void {
    this.deepLearningPredictor = {
      predictEngagement: async (userProfile: UserProfile, stream: UnifiedStream) => {
        // Simplified deep learning prediction
        const categoryMatch = userProfile.preferences.categories.includes(stream.category) ? 0.3 : 0;
        const platformMatch = userProfile.preferences.platforms.includes(stream.platform) ? 0.2 : 0;
        const viewerPopularity = Math.min(stream.viewerCount / 10000, 0.3);
        const behaviorScore = userProfile.behavior.engagementScore * 0.2;
        
        return Math.min(categoryMatch + platformMatch + viewerPopularity + behaviorScore, 1);
      },
      
      predictWatchTime: async (userProfile: UserProfile, stream: UnifiedStream) => {
        const baseWatchTime = userProfile.preferences.averageWatchTime;
        const engagementMultiplier = userProfile.behavior.engagementScore;
        const categoryMultiplier = userProfile.preferences.categories.includes(stream.category) ? 1.5 : 1;
        
        return baseWatchTime * engagementMultiplier * categoryMultiplier;
      },
      
      predictChurnRisk: async (userProfile: UserProfile) => {
        const retentionScore = userProfile.behavior.retentionRate;
        const engagementScore = userProfile.behavior.engagementScore;
        const socialScore = userProfile.behavior.socialActivity;
        
        return 1 - (retentionScore * 0.4 + engagementScore * 0.4 + socialScore * 0.2);
      },
      
      predictContentTrend: async (stream: UnifiedStream) => {
        // Simplified trend prediction
        const viewerGrowth = stream.viewerCount > 1000 ? 0.3 : 0.1;
        const categoryPopularity = 0.2; // Would be calculated from historical data
        const timeRelevance = 0.3;
        
        return viewerGrowth + categoryPopularity + timeRelevance;
      },
      
      predictOptimalSchedule: async (userProfile: UserProfile) => {
        const schedule = [];
        for (let day = 0; day < 7; day++) {
          for (let hour = 0; hour < 24; hour++) {
            const probability = userProfile.preferences.peakViewingHours.includes(hour) ? 0.8 : 0.2;
            schedule.push({ hour, day, probability });
          }
        }
        return schedule;
      }
    };
  }

  private initializeReinforcementLearning(): void {
    this.reinforcementAgent = {
      selectAction: async (state: UserProfile, availableActions: UnifiedStream[]) => {
        // Epsilon-greedy action selection
        const epsilon = 0.1;
        
        if (Math.random() < epsilon) {
          // Explore: random action
          return availableActions[Math.floor(Math.random() * availableActions.length)];
        } else {
          // Exploit: best action based on current policy
          const scores = await Promise.all(
            availableActions.map(stream => this.calculatePersonalizedScore(state, stream))
          );
          const bestIndex = scores.indexOf(Math.max(...scores));
          return availableActions[bestIndex];
        }
      },
      
      updatePolicy: async (state: UserProfile, action: UnifiedStream, reward: number) => {
        // Simplified policy update
        const learningRate = 0.1;
        const oldScore = state.feedback.explicitRatings[action.id] || 0;
        const newScore = oldScore + learningRate * (reward - oldScore);
        
        state.feedback.explicitRatings[action.id] = newScore;
      },
      
      exploreExploit: (explorationRate: number) => {
        return Math.random() < explorationRate;
      },
      
      getOptimalPolicy: async (state: UserProfile) => {
        // Return top-rated streams for this user
        const ratedStreams = Object.entries(state.feedback.explicitRatings)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10);
        
        const streams = await Promise.all(
          ratedStreams.map(([streamId]) => this.getStreamById(streamId))
        );
        
        return streams.filter(stream => stream !== null) as UnifiedStream[];
      }
    };
  }

  private startRealTimeUpdates(): void {
    // Update user embeddings periodically
    setInterval(async () => {
      for (const [userId, profile] of this.userProfiles) {
        try {
          const updatedEmbeddings = await this.generateUserEmbeddings(profile);
          profile.embeddings = updatedEmbeddings;
          this.userProfiles.set(userId, profile);
        } catch (error) {
          console.error('Failed to update user embeddings:', error);
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async generateEnsembleRecommendations(
    userProfile: UserProfile,
    candidateStreams: UnifiedStream[],
    request: RecommendationRequest
  ): Promise<Recommendation[]> {
    const ensembleResults: Recommendation[] = [];
    
    // Get recommendations from multiple algorithms
    const contentBased = await this.getContentBasedRecommendations(userProfile, candidateStreams);
    const collaborative = await this.getCollaborativeRecommendations(userProfile, candidateStreams);
    const trending = await this.getTrendingBasedRecommendations(userProfile, candidateStreams);
    const deepLearning = await this.getDeepLearningRecommendations(userProfile, candidateStreams);
    
    // Combine results with weighted ensemble
    const weights = { contentBased: 0.25, collaborative: 0.30, trending: 0.20, deepLearning: 0.25 };
    const streamScores = new Map<string, number>();
    
    [contentBased, collaborative, trending, deepLearning].forEach((recs, index) => {
      const algorithmWeight = Object.values(weights)[index];
      recs.forEach(rec => {
        const currentScore = streamScores.get(rec.stream.id) || 0;
        streamScores.set(rec.stream.id, currentScore + (rec.score * algorithmWeight));
      });
    });
    
    // Create final recommendations
    for (const [streamId, score] of streamScores) {
      const stream = candidateStreams.find(s => s.id === streamId);
      if (stream) {
        ensembleResults.push({
          stream,
          score,
          confidence: score,
          reasons: [],
          explanation: '',
          noveltyScore: 0,
          diversityContribution: 0,
          expectedEngagement: score,
          personalizedRank: 0,
          contextualRelevance: 0,
          qualityScore: stream.viewerCount / 1000,
          metadata: {
            algorithm: 'ensemble',
            modelVersion: '1.0',
            computeTime: 0,
            features: { ensemble_score: score },
            alternativeOptions: 0
          }
        });
      }
    }
    
    return ensembleResults.sort((a, b) => b.score - a.score);
  }

  private async getCandidateStreams(request: RecommendationRequest): Promise<UnifiedStream[]> {
    // Get streams from multiple sources
    const streams = await this.makeRequest<UnifiedStream[]>('/streams/candidates', {
      method: 'POST',
      body: JSON.stringify({
        filters: request.filterOptions,
        count: request.count * 5, // Get more candidates for better selection
        context: request.context
      })
    });
    
    return streams;
  }

  private async generateUserEmbeddings(profile: UserProfile): Promise<UserProfile['embeddings']> {
    try {
      const embeddings = await this.makeRequest<UserProfile['embeddings']>('/embeddings/user', {
        method: 'POST',
        body: JSON.stringify({
          preferences: profile.preferences,
          behavior: profile.behavior,
          demographics: profile.demographics,
          feedback: profile.feedback
        })
      });
      
      return embeddings;
    } catch (error) {
      console.error('Failed to generate user embeddings:', error);
      return profile.embeddings;
    }
  }

  private async getContentEmbedding(streamId: string): Promise<ContentEmbedding | null> {
    if (this.contentEmbeddings.has(streamId)) {
      return this.contentEmbeddings.get(streamId)!;
    }
    
    try {
      const embedding = await this.makeRequest<ContentEmbedding>(`/embeddings/content/${streamId}`);
      this.contentEmbeddings.set(streamId, embedding);
      return embedding;
    } catch (error) {
      console.error('Failed to get content embedding:', error);
      return null;
    }
  }

  private async calculatePersonalizedScore(userProfile: UserProfile, stream: UnifiedStream): Promise<number> {
    let score = 0;
    
    // Category preference
    if (userProfile.preferences.categories.includes(stream.category)) {
      score += 0.3;
    }
    
    // Platform preference
    if (userProfile.preferences.platforms.includes(stream.platform)) {
      score += 0.2;
    }
    
    // Viewer count factor
    score += Math.min(stream.viewerCount / 10000, 0.2);
    
    // Behavioral factors
    score += userProfile.behavior.engagementScore * 0.2;
    score += userProfile.behavior.diversityScore * 0.1;
    
    return Math.min(score, 1);
  }

  private async calculateNoveltyScore(userProfile: UserProfile, stream: UnifiedStream): Promise<number> {
    // Check if user has seen this content before
    const hasWatched = !!userProfile.feedback.implicitFeedback[stream.id];
    if (hasWatched) return 0;
    
    // Check if it's a new category for the user
    const isNewCategory = !userProfile.preferences.categories.includes(stream.category);
    const isNewStreamer = !userProfile.preferences.favoriteStreamers.includes(stream.username);
    
    return (isNewCategory ? 0.5 : 0) + (isNewStreamer ? 0.3 : 0) + 0.2;
  }

  private applyDiversityFilter(recommendations: Recommendation[], diversityLevel: number): Recommendation[] {
    if (diversityLevel === 0) return recommendations;
    
    const diversified: Recommendation[] = [];
    const usedCategories = new Set<string>();
    const usedStreamers = new Set<string>();
    
    for (const rec of recommendations) {
      const categoryDiversity = usedCategories.has(rec.stream.category) ? 0 : 1;
      const streamerDiversity = usedStreamers.has(rec.stream.username) ? 0 : 1;
      
      rec.diversityContribution = (categoryDiversity + streamerDiversity) / 2;
      
      if (diversityLevel > 0.5 && rec.diversityContribution > 0) {
        diversified.push(rec);
        usedCategories.add(rec.stream.category);
        usedStreamers.add(rec.stream.username);
      } else if (diversityLevel <= 0.5) {
        diversified.push(rec);
      }
    }
    
    return diversified;
  }

  private async applyContextualReranking(
    recommendations: Recommendation[],
    context: RecommendationContext
  ): Promise<Recommendation[]> {
    for (const rec of recommendations) {
      let contextualBoost = 0;
      
      // Time-based relevance
      const hour = new Date(context.currentTime).getHours();
      if (hour >= 18 && hour <= 23) {
        contextualBoost += 0.2; // Evening boost
      }
      
      // Device-based relevance
      if (context.deviceType === 'mobile' && rec.stream.platform === 'twitch') {
        contextualBoost += 0.1; // Mobile-friendly platform
      }
      
      // Social context
      if (context.socialContext?.friendsWatching?.includes(rec.stream.id)) {
        contextualBoost += 0.3; // Friends watching boost
      }
      
      rec.contextualRelevance = contextualBoost;
      rec.score += contextualBoost;
    }
    
    return recommendations.sort((a, b) => b.score - a.score);
  }

  private async applyReinforcementLearning(
    recommendations: Recommendation[],
    userProfile: UserProfile
  ): Promise<Recommendation[]> {
    // Use reinforcement learning to optimize recommendations
    const optimizedRecs = [];
    
    for (const rec of recommendations) {
      // Check if this is a good action based on historical rewards
      const historicalReward = userProfile.feedback.explicitRatings[rec.stream.id] || 0;
      
      if (historicalReward > 0.5 || this.reinforcementAgent.exploreExploit(0.1)) {
        optimizedRecs.push(rec);
      }
    }
    
    return optimizedRecs;
  }

  private async generateExplanations(
    recommendations: Recommendation[],
    explanationType: 'none' | 'simple' | 'detailed'
  ): Promise<Recommendation[]> {
    if (explanationType === 'none') return recommendations;
    
    for (const rec of recommendations) {
      if (explanationType === 'simple') {
        rec.explanation = `Recommended because you enjoy ${rec.stream.category} content`;
      } else {
        rec.explanation = `This ${rec.stream.category} stream is recommended based on your viewing history, current trending content, and similar users' preferences. We predict you'll watch for ${Math.round(rec.expectedEngagement * 30)} minutes.`;
      }
    }
    
    return recommendations;
  }

  private async getFallbackRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
    // Simple fallback based on popularity
    const popularStreams = await this.makeRequest<UnifiedStream[]>('/streams/popular');
    
    return popularStreams.slice(0, request.count).map(stream => ({
      stream,
      score: 0.5,
      confidence: 0.5,
      reasons: [{
        type: 'popularity',
        strength: 0.5,
        description: 'Popular content',
        evidence: ['High viewer count']
      }],
      explanation: 'Popular content that many users enjoy',
      noveltyScore: 0.5,
      diversityContribution: 0,
      expectedEngagement: 0.5,
      personalizedRank: 0,
      contextualRelevance: 0,
      qualityScore: stream.viewerCount / 1000,
      metadata: {
        algorithm: 'fallback',
        modelVersion: '1.0',
        computeTime: 0,
        features: {},
        alternativeOptions: 0
      }
    }));
  }

  private async getStreamById(streamId: string): Promise<UnifiedStream | null> {
    try {
      return await this.makeRequest<UnifiedStream>(`/streams/${streamId}`);
    } catch (error) {
      console.error('Failed to get stream:', error);
      return null;
    }
  }

  private updateBehavioralScores(profile: UserProfile, interaction: any): void {
    // Update engagement score
    if (interaction.type === 'view' && interaction.duration > 300) {
      profile.behavior.engagementScore = Math.min(profile.behavior.engagementScore + 0.01, 1);
    }
    
    // Update social activity
    if (['share', 'like', 'chat'].includes(interaction.type)) {
      profile.behavior.socialActivity = Math.min(profile.behavior.socialActivity + 0.005, 1);
    }
    
    // Update retention rate
    if (interaction.type === 'view') {
      profile.behavior.retentionRate = Math.min(profile.behavior.retentionRate + 0.002, 1);
    }
  }

  private async updateReinforcementLearning(
    profile: UserProfile,
    streamId: string,
    interaction: any
  ): Promise<void> {
    // Calculate reward based on interaction
    let reward = 0;
    
    switch (interaction.type) {
      case 'view':
        reward = Math.min((interaction.duration || 0) / 1800, 1); // Max 30 minutes
        break;
      case 'like':
        reward = 0.8;
        break;
      case 'share':
        reward = 0.9;
        break;
      case 'skip':
        reward = -0.3;
        break;
      default:
        reward = 0.1;
    }
    
    // Update policy
    const stream = await this.getStreamById(streamId);
    if (stream) {
      await this.reinforcementAgent.updatePolicy(profile, stream, reward);
    }
  }

  private async logRecommendationMetrics(
    userId: string,
    recommendations: Recommendation[],
    computeTime: number
  ): Promise<void> {
    try {
      await this.makeRequest('/metrics/recommendations', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          recommendationCount: recommendations.length,
          computeTime,
          algorithms: recommendations.map(r => r.metadata.algorithm),
          averageScore: recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to log recommendation metrics:', error);
    }
  }

  private async getContentBasedRecommendations(
    userProfile: UserProfile,
    candidateStreams: UnifiedStream[]
  ): Promise<Recommendation[]> {
    // Simplified content-based filtering
    return candidateStreams
      .filter(stream => userProfile.preferences.categories.includes(stream.category))
      .map(stream => ({
        stream,
        score: 0.7,
        confidence: 0.7,
        reasons: [],
        explanation: '',
        noveltyScore: 0,
        diversityContribution: 0,
        expectedEngagement: 0.7,
        personalizedRank: 0,
        contextualRelevance: 0,
        qualityScore: stream.viewerCount / 1000,
        metadata: {
          algorithm: 'content_based',
          modelVersion: '1.0',
          computeTime: 0,
          features: {},
          alternativeOptions: 0
        }
      }));
  }

  private async getCollaborativeRecommendations(
    userProfile: UserProfile,
    candidateStreams: UnifiedStream[]
  ): Promise<Recommendation[]> {
    // Simplified collaborative filtering
    return candidateStreams
      .slice(0, 10)
      .map(stream => ({
        stream,
        score: 0.6,
        confidence: 0.6,
        reasons: [],
        explanation: '',
        noveltyScore: 0,
        diversityContribution: 0,
        expectedEngagement: 0.6,
        personalizedRank: 0,
        contextualRelevance: 0,
        qualityScore: stream.viewerCount / 1000,
        metadata: {
          algorithm: 'collaborative',
          modelVersion: '1.0',
          computeTime: 0,
          features: {},
          alternativeOptions: 0
        }
      }));
  }

  private async getTrendingBasedRecommendations(
    userProfile: UserProfile,
    candidateStreams: UnifiedStream[]
  ): Promise<Recommendation[]> {
    // Simplified trending-based recommendations
    return candidateStreams
      .sort((a, b) => b.viewerCount - a.viewerCount)
      .slice(0, 10)
      .map(stream => ({
        stream,
        score: 0.8,
        confidence: 0.8,
        reasons: [],
        explanation: '',
        noveltyScore: 0,
        diversityContribution: 0,
        expectedEngagement: 0.8,
        personalizedRank: 0,
        contextualRelevance: 0,
        qualityScore: stream.viewerCount / 1000,
        metadata: {
          algorithm: 'trending',
          modelVersion: '1.0',
          computeTime: 0,
          features: {},
          alternativeOptions: 0
        }
      }));
  }

  private async getDeepLearningRecommendations(
    userProfile: UserProfile,
    candidateStreams: UnifiedStream[]
  ): Promise<Recommendation[]> {
    // Use deep learning predictor
    const recommendations = [];
    
    for (const stream of candidateStreams.slice(0, 15)) {
      const engagement = await this.deepLearningPredictor.predictEngagement(userProfile, stream);
      
      recommendations.push({
        stream,
        score: engagement,
        confidence: engagement,
        reasons: [],
        explanation: '',
        noveltyScore: 0,
        diversityContribution: 0,
        expectedEngagement: engagement,
        personalizedRank: 0,
        contextualRelevance: 0,
        qualityScore: stream.viewerCount / 1000,
        metadata: {
          algorithm: 'deep_learning',
          modelVersion: '1.0',
          computeTime: 0,
          features: { engagement },
          alternativeOptions: 0
        }
      });
    }
    
    return recommendations.sort((a, b) => b.score - a.score);
  }

  private async getRecommendationsByAlgorithm(
    algorithm: string,
    request: RecommendationRequest
  ): Promise<Recommendation[]> {
    switch (algorithm) {
      case 'content_based':
        return this.getContentSimilarRecommendations('', request.userId, request.count);
      case 'collaborative':
        return this.getCollaborativeFilteringRecommendations(request.userId, request.count);
      case 'trending':
        return this.getTrendingRecommendations(request.userId, request.count);
      default:
        return this.getRecommendations(request);
    }
  }

  private async logExperimentParticipation(
    userId: string,
    experimentId: string,
    algorithm: string
  ): Promise<void> {
    try {
      await this.makeRequest('/experiments/participation', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          experimentId,
          algorithm,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to log experiment participation:', error);
    }
  }
}

export const aiRecommendationService = new AIRecommendationService();
export default aiRecommendationService;