import { EventEmitter } from 'eventemitter3';
import { webSocketService, WebSocketMessage } from './webSocketService';
import { logError, logDebug, withErrorHandling } from '@/utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Poll {
  id: string;
  roomId: string;
  streamId?: string;
  type: PollType;
  question: string;
  description?: string;
  options: PollOption[];
  settings: PollSettings;
  createdBy: string;
  createdByUsername: string;
  createdAt: string;
  startsAt: string;
  endsAt: string;
  status: PollStatus;
  statistics: PollStatistics;
  results?: PollResults;
  metadata?: Record<string, any>;
}

export type PollType = 'multiple_choice' | 'single_choice' | 'rating' | 'ranking' | 'text_response' | 'yes_no' | 'scale' | 'image_choice' | 'prediction';

export type PollStatus = 'draft' | 'scheduled' | 'active' | 'ended' | 'cancelled';

export interface PollOption {
  id: string;
  text: string;
  description?: string;
  image?: string;
  emoji?: string;
  votes: number;
  percentage: number;
  isCorrect?: boolean;
  color?: string;
  metadata?: Record<string, any>;
}

export interface PollSettings {
  allowMultipleChoices: boolean;
  allowAnonymousVotes: boolean;
  requireSubscription: boolean;
  requireVerification: boolean;
  showResultsLive: boolean;
  showResultsAfterVote: boolean;
  allowChangeVote: boolean;
  allowAddOptions: boolean;
  maxOptionsPerUser: number;
  maxVotesPerUser: number;
  votingTimeLimit: number;
  hideVoteCount: boolean;
  hideUntilEnd: boolean;
  requireComment: boolean;
  enableNotifications: boolean;
  allowSharing: boolean;
  moderationRequired: boolean;
  randomizeOptions: boolean;
  weightedVoting: boolean;
  minimumVotes: number;
  autoClose: boolean;
  tags: string[];
}

export interface PollStatistics {
  totalVotes: number;
  totalParticipants: number;
  participationRate: number;
  averageVoteTime: number;
  peakVotingTime: string;
  topOption: string;
  engagementScore: number;
  demographicBreakdown: DemographicBreakdown;
  voteDistribution: VoteDistribution[];
  timeBasedStats: TimeBasedStats[];
  geographicStats: GeographicStats[];
}

export interface DemographicBreakdown {
  byAge: Array<{ range: string; count: number }>;
  byGender: Array<{ gender: string; count: number }>;
  byLocation: Array<{ location: string; count: number }>;
  bySubscription: Array<{ tier: string; count: number }>;
  byFollowTime: Array<{ duration: string; count: number }>;
}

export interface VoteDistribution {
  optionId: string;
  votes: number;
  percentage: number;
  demographics: DemographicBreakdown;
}

export interface TimeBasedStats {
  timestamp: string;
  totalVotes: number;
  optionVotes: Array<{ optionId: string; votes: number }>;
}

export interface GeographicStats {
  country: string;
  region: string;
  votes: number;
  percentage: number;
}

export interface PollResults {
  totalVotes: number;
  options: Array<{
    optionId: string;
    text: string;
    votes: number;
    percentage: number;
    isWinner: boolean;
  }>;
  winnerOptionId: string;
  winnerText: string;
  margin: number;
  confidence: number;
  participationRate: number;
  engagementMetrics: EngagementMetrics;
  summary: string;
  insights: string[];
}

export interface EngagementMetrics {
  averageTimeToVote: number;
  voteChangeRate: number;
  commentEngagement: number;
  shareRate: number;
  returnVoterRate: number;
  influencerParticipation: number;
}

export interface PollVote {
  id: string;
  pollId: string;
  userId: string;
  username: string;
  optionId: string;
  optionIds: string[];
  comment?: string;
  rating?: number;
  ranking?: number[];
  textResponse?: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface QASession {
  id: string;
  roomId: string;
  streamId?: string;
  title: string;
  description?: string;
  hostId: string;
  hostUsername: string;
  moderators: string[];
  status: QAStatus;
  questions: Question[];
  settings: QASettings;
  createdAt: string;
  startsAt: string;
  endsAt?: string;
  statistics: QAStatistics;
}

export type QAStatus = 'scheduled' | 'active' | 'paused' | 'ended' | 'cancelled';

export interface Question {
  id: string;
  sessionId: string;
  text: string;
  askedBy: string;
  askedByUsername: string;
  askedAt: string;
  status: QuestionStatus;
  priority: QuestionPriority;
  upvotes: number;
  downvotes: number;
  answer?: string;
  answeredBy?: string;
  answeredByUsername?: string;
  answeredAt?: string;
  category: string;
  tags: string[];
  isAnonymous: boolean;
  isFeatured: boolean;
  isPinned: boolean;
  metadata?: Record<string, any>;
}

export type QuestionStatus = 'pending' | 'approved' | 'answered' | 'rejected' | 'hidden';

export type QuestionPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface QASettings {
  allowAnonymousQuestions: boolean;
  requireModeration: boolean;
  allowVoting: boolean;
  maxQuestionsPerUser: number;
  questionTimeLimit: number;
  autoApprove: boolean;
  enableCategories: boolean;
  allowFollowUp: boolean;
  showAskedCount: boolean;
  enablePriority: boolean;
  allowDuplicates: boolean;
  profanityFilter: boolean;
  spamDetection: boolean;
  requireSubscription: boolean;
  minFollowTime: number;
  maxQuestionLength: number;
  tags: string[];
}

export interface QAStatistics {
  totalQuestions: number;
  totalAnswered: number;
  totalPending: number;
  averageResponseTime: number;
  topCategories: Array<{ category: string; count: number }>;
  participationRate: number;
  questionQuality: number;
  engagementScore: number;
  peakQuestionTime: string;
  popularQuestions: Question[];
}

export interface PollTemplate {
  id: string;
  name: string;
  description: string;
  type: PollType;
  category: string;
  question: string;
  options: Omit<PollOption, 'id' | 'votes' | 'percentage'>[];
  settings: Partial<PollSettings>;
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  usageCount: number;
  rating: number;
}

export interface PollAnalytics {
  pollId: string;
  date: string;
  totalVotes: number;
  uniqueVoters: number;
  averageEngagement: number;
  topPerformingOptions: string[];
  demographicInsights: string[];
  timeToComplete: number;
  dropoffRate: number;
  shareRate: number;
  commentCount: number;
  sentimentScore: number;
}

class LivePollsService extends EventEmitter {
  private activePolls: Map<string, Poll> = new Map();
  private activeSessions: Map<string, QASession> = new Map();
  private pollTemplates: Map<string, PollTemplate> = new Map();
  private userVotes: Map<string, PollVote[]> = new Map();
  private pollAnalytics: Map<string, PollAnalytics> = new Map();
  private currentRoomId: string | null = null;
  private currentUserId: string | null = null;
  private currentUsername: string | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private analyticsTimer: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * Initialize live polls service
   */
  async initialize(userId: string, username: string, roomId: string): Promise<void> {
    return withErrorHandling(async () => {
      logDebug('Initializing live polls service', { userId, username, roomId });
      
      this.currentUserId = userId;
      this.currentUsername = username;
      this.currentRoomId = roomId;
      
      // Load cached data
      await this.loadCachedData();
      
      // Start cleanup timer
      this.startCleanupTimer();
      
      // Start analytics collection
      this.startAnalyticsCollection();
      
      this.isInitialized = true;
      this.emit('initialized', { userId, username, roomId });
    }, { component: 'LivePollsService', action: 'initialize' });
  }

  /**
   * Create a new poll
   */
  async createPoll(
    type: PollType,
    question: string,
    options: Omit<PollOption, 'id' | 'votes' | 'percentage'>[],
    settings?: Partial<PollSettings>
  ): Promise<Poll> {
    return withErrorHandling(async () => {
      if (!this.isInitialized || !this.currentUserId || !this.currentUsername || !this.currentRoomId) {
        throw new Error('Service not initialized');
      }

      const pollId = this.generatePollId();
      const now = new Date().toISOString();
      const endsAt = settings?.votingTimeLimit 
        ? new Date(Date.now() + settings.votingTimeLimit * 1000).toISOString()
        : new Date(Date.now() + 5 * 60 * 1000).toISOString(); // Default 5 minutes

      const poll: Poll = {
        id: pollId,
        roomId: this.currentRoomId,
        type,
        question,
        options: options.map((opt, index) => ({
          ...opt,
          id: `option_${index}_${Date.now()}`,
          votes: 0,
          percentage: 0,
        })),
        settings: {
          allowMultipleChoices: type === 'multiple_choice',
          allowAnonymousVotes: true,
          requireSubscription: false,
          requireVerification: false,
          showResultsLive: true,
          showResultsAfterVote: true,
          allowChangeVote: false,
          allowAddOptions: false,
          maxOptionsPerUser: 1,
          maxVotesPerUser: 1,
          votingTimeLimit: 300, // 5 minutes
          hideVoteCount: false,
          hideUntilEnd: false,
          requireComment: false,
          enableNotifications: true,
          allowSharing: true,
          moderationRequired: false,
          randomizeOptions: false,
          weightedVoting: false,
          minimumVotes: 1,
          autoClose: true,
          tags: [],
          ...settings,
        },
        createdBy: this.currentUserId,
        createdByUsername: this.currentUsername,
        createdAt: now,
        startsAt: now,
        endsAt,
        status: 'active',
        statistics: {
          totalVotes: 0,
          totalParticipants: 0,
          participationRate: 0,
          averageVoteTime: 0,
          peakVotingTime: '',
          topOption: '',
          engagementScore: 0,
          demographicBreakdown: {
            byAge: [],
            byGender: [],
            byLocation: [],
            bySubscription: [],
            byFollowTime: [],
          },
          voteDistribution: [],
          timeBasedStats: [],
          geographicStats: [],
        },
      };

      // Send poll creation message
      await webSocketService.sendMessage('poll_create', poll);
      
      // Add to local cache
      this.activePolls.set(pollId, poll);
      
      // Schedule auto-close if enabled
      if (poll.settings.autoClose) {
        setTimeout(() => {
          this.closePoll(pollId);
        }, poll.settings.votingTimeLimit * 1000);
      }
      
      this.emit('poll_created', poll);
      return poll;
    }, { component: 'LivePollsService', action: 'createPoll' });
  }

  /**
   * Vote on a poll
   */
  async votePoll(pollId: string, optionId: string, options?: {
    comment?: string;
    rating?: number;
    ranking?: number[];
    textResponse?: string;
    confidence?: number;
  }): Promise<void> {
    return withErrorHandling(async () => {
      if (!this.currentUserId || !this.currentUsername) {
        throw new Error('User not authenticated');
      }

      const poll = this.activePolls.get(pollId);
      if (!poll) {
        throw new Error('Poll not found');
      }

      if (poll.status !== 'active') {
        throw new Error('Poll is not active');
      }

      // Check if user has already voted
      const existingVote = this.getUserVote(pollId, this.currentUserId);
      if (existingVote && !poll.settings.allowChangeVote) {
        throw new Error('You have already voted on this poll');
      }

      const vote: PollVote = {
        id: this.generateVoteId(),
        pollId,
        userId: this.currentUserId,
        username: this.currentUsername,
        optionId,
        optionIds: [optionId],
        comment: options?.comment,
        rating: options?.rating,
        ranking: options?.ranking,
        textResponse: options?.textResponse,
        timestamp: new Date().toISOString(),
        confidence: options?.confidence,
      };

      // Send vote message
      await webSocketService.sendMessage('poll_vote', vote);
      
      // Update local cache
      this.addVoteToCache(vote);
      this.updatePollStatistics(pollId);
      
      this.emit('vote_cast', { pollId, vote });
    }, { component: 'LivePollsService', action: 'votePoll' });
  }

  /**
   * Close a poll
   */
  async closePoll(pollId: string): Promise<void> {
    const poll = this.activePolls.get(pollId);
    if (!poll) {
      throw new Error('Poll not found');
    }

    if (poll.createdBy !== this.currentUserId) {
      throw new Error('Only poll creator can close the poll');
    }

    poll.status = 'ended';
    poll.endsAt = new Date().toISOString();
    
    // Calculate final results
    poll.results = this.calculatePollResults(poll);
    
    await webSocketService.sendMessage('poll_close', { pollId });
    
    this.emit('poll_closed', { pollId, results: poll.results });
  }

  /**
   * Create Q&A session
   */
  async createQASession(
    title: string,
    options?: {
      description?: string;
      settings?: Partial<QASettings>;
      moderators?: string[];
    }
  ): Promise<QASession> {
    return withErrorHandling(async () => {
      if (!this.isInitialized || !this.currentUserId || !this.currentUsername || !this.currentRoomId) {
        throw new Error('Service not initialized');
      }

      const sessionId = this.generateSessionId();
      const now = new Date().toISOString();

      const session: QASession = {
        id: sessionId,
        roomId: this.currentRoomId,
        title,
        description: options?.description,
        hostId: this.currentUserId,
        hostUsername: this.currentUsername,
        moderators: options?.moderators || [],
        status: 'active',
        questions: [],
        settings: {
          allowAnonymousQuestions: true,
          requireModeration: false,
          allowVoting: true,
          maxQuestionsPerUser: 5,
          questionTimeLimit: 300, // 5 minutes
          autoApprove: true,
          enableCategories: true,
          allowFollowUp: true,
          showAskedCount: true,
          enablePriority: false,
          allowDuplicates: false,
          profanityFilter: true,
          spamDetection: true,
          requireSubscription: false,
          minFollowTime: 0,
          maxQuestionLength: 500,
          tags: [],
          ...options?.settings,
        },
        createdAt: now,
        startsAt: now,
        statistics: {
          totalQuestions: 0,
          totalAnswered: 0,
          totalPending: 0,
          averageResponseTime: 0,
          topCategories: [],
          participationRate: 0,
          questionQuality: 0,
          engagementScore: 0,
          peakQuestionTime: '',
          popularQuestions: [],
        },
      };

      await webSocketService.sendMessage('qa_session_create', session);
      
      this.activeSessions.set(sessionId, session);
      
      this.emit('qa_session_created', session);
      return session;
    }, { component: 'LivePollsService', action: 'createQASession' });
  }

  /**
   * Ask a question in Q&A session
   */
  async askQuestion(
    sessionId: string,
    text: string,
    options?: {
      category?: string;
      isAnonymous?: boolean;
      priority?: QuestionPriority;
      tags?: string[];
    }
  ): Promise<Question> {
    return withErrorHandling(async () => {
      if (!this.currentUserId || !this.currentUsername) {
        throw new Error('User not authenticated');
      }

      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Q&A session not found');
      }

      if (session.status !== 'active') {
        throw new Error('Q&A session is not active');
      }

      // Check user question limit
      const userQuestions = session.questions.filter(q => q.askedBy === this.currentUserId);
      if (userQuestions.length >= session.settings.maxQuestionsPerUser) {
        throw new Error('Maximum questions per user reached');
      }

      const question: Question = {
        id: this.generateQuestionId(),
        sessionId,
        text,
        askedBy: this.currentUserId,
        askedByUsername: this.currentUsername,
        askedAt: new Date().toISOString(),
        status: session.settings.autoApprove ? 'approved' : 'pending',
        priority: options?.priority || 'medium',
        upvotes: 0,
        downvotes: 0,
        category: options?.category || 'general',
        tags: options?.tags || [],
        isAnonymous: options?.isAnonymous || false,
        isFeatured: false,
        isPinned: false,
      };

      await webSocketService.sendMessage('qa_question_ask', question);
      
      // Add to local cache
      session.questions.push(question);
      session.statistics.totalQuestions++;
      
      this.emit('question_asked', { sessionId, question });
      return question;
    }, { component: 'LivePollsService', action: 'askQuestion' });
  }

  /**
   * Answer a question
   */
  async answerQuestion(questionId: string, answer: string): Promise<void> {
    if (!this.currentUserId || !this.currentUsername) {
      throw new Error('User not authenticated');
    }

    const question = this.findQuestion(questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    const session = this.activeSessions.get(question.sessionId);
    if (!session) {
      throw new Error('Q&A session not found');
    }

    // Check if user can answer (host or moderator)
    if (session.hostId !== this.currentUserId && !session.moderators.includes(this.currentUserId)) {
      throw new Error('Only host or moderators can answer questions');
    }

    question.answer = answer;
    question.answeredBy = this.currentUserId;
    question.answeredByUsername = this.currentUsername;
    question.answeredAt = new Date().toISOString();
    question.status = 'answered';

    await webSocketService.sendMessage('qa_question_answer', {
      questionId,
      answer,
      answeredBy: this.currentUserId,
      answeredByUsername: this.currentUsername,
    });

    // Update statistics
    session.statistics.totalAnswered++;
    
    this.emit('question_answered', { questionId, answer });
  }

  /**
   * Vote on a question
   */
  async voteQuestion(questionId: string, vote: 'up' | 'down'): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    const question = this.findQuestion(questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    const session = this.activeSessions.get(question.sessionId);
    if (!session) {
      throw new Error('Q&A session not found');
    }

    if (!session.settings.allowVoting) {
      throw new Error('Voting is not enabled for this session');
    }

    if (vote === 'up') {
      question.upvotes++;
    } else {
      question.downvotes++;
    }

    await webSocketService.sendMessage('qa_question_vote', {
      questionId,
      vote,
      userId: this.currentUserId,
    });

    this.emit('question_voted', { questionId, vote });
  }

  /**
   * Get active polls
   */
  getActivePolls(): Poll[] {
    return Array.from(this.activePolls.values()).filter(poll => poll.status === 'active');
  }

  /**
   * Get active Q&A sessions
   */
  getActiveSessions(): QASession[] {
    return Array.from(this.activeSessions.values()).filter(session => session.status === 'active');
  }

  /**
   * Get poll by ID
   */
  getPoll(pollId: string): Poll | null {
    return this.activePolls.get(pollId) || null;
  }

  /**
   * Get Q&A session by ID
   */
  getQASession(sessionId: string): QASession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get user votes
   */
  getUserVotes(userId: string): PollVote[] {
    return this.userVotes.get(userId) || [];
  }

  /**
   * Get poll templates
   */
  getPollTemplates(): PollTemplate[] {
    return Array.from(this.pollTemplates.values());
  }

  /**
   * Create poll template
   */
  async createPollTemplate(
    name: string,
    type: PollType,
    question: string,
    options: Omit<PollOption, 'id' | 'votes' | 'percentage'>[],
    settings?: Partial<PollSettings>
  ): Promise<PollTemplate> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    const template: PollTemplate = {
      id: this.generateTemplateId(),
      name,
      description: `${type} poll template`,
      type,
      category: 'user',
      question,
      options,
      settings: settings || {},
      tags: [],
      isPublic: false,
      createdBy: this.currentUserId,
      createdAt: new Date().toISOString(),
      usageCount: 0,
      rating: 0,
    };

    this.pollTemplates.set(template.id, template);
    await this.savePollTemplates();

    this.emit('poll_template_created', template);
    return template;
  }

  /**
   * Get poll analytics
   */
  getPollAnalytics(pollId: string): PollAnalytics | null {
    return this.pollAnalytics.get(pollId) || null;
  }

  /**
   * Dispose service
   */
  dispose(): void {
    this.stopCleanupTimer();
    this.stopAnalyticsCollection();
    this.activePolls.clear();
    this.activeSessions.clear();
    this.pollTemplates.clear();
    this.userVotes.clear();
    this.pollAnalytics.clear();
    this.isInitialized = false;
    this.emit('disposed');
  }

  // Private methods

  private setupEventHandlers(): void {
    webSocketService.on('message:poll_create', this.handlePollCreate.bind(this));
    webSocketService.on('message:poll_vote', this.handlePollVote.bind(this));
    webSocketService.on('message:poll_close', this.handlePollClose.bind(this));
    webSocketService.on('message:poll_update', this.handlePollUpdate.bind(this));
    webSocketService.on('message:qa_session_create', this.handleQASessionCreate.bind(this));
    webSocketService.on('message:qa_question_ask', this.handleQuestionAsk.bind(this));
    webSocketService.on('message:qa_question_answer', this.handleQuestionAnswer.bind(this));
    webSocketService.on('message:qa_question_vote', this.handleQuestionVote.bind(this));
    webSocketService.on('disconnected', this.handleDisconnected.bind(this));
  }

  private handlePollCreate(wsMessage: WebSocketMessage): void {
    const poll: Poll = wsMessage.data;
    this.activePolls.set(poll.id, poll);
    this.emit('poll_received', poll);
  }

  private handlePollVote(wsMessage: WebSocketMessage): void {
    const vote: PollVote = wsMessage.data;
    this.addVoteToCache(vote);
    this.updatePollStatistics(vote.pollId);
    this.emit('vote_received', vote);
  }

  private handlePollClose(wsMessage: WebSocketMessage): void {
    const { pollId } = wsMessage.data;
    const poll = this.activePolls.get(pollId);
    if (poll) {
      poll.status = 'ended';
      poll.results = this.calculatePollResults(poll);
      this.emit('poll_closed', { pollId, results: poll.results });
    }
  }

  private handlePollUpdate(wsMessage: WebSocketMessage): void {
    const poll: Poll = wsMessage.data;
    this.activePolls.set(poll.id, poll);
    this.emit('poll_updated', poll);
  }

  private handleQASessionCreate(wsMessage: WebSocketMessage): void {
    const session: QASession = wsMessage.data;
    this.activeSessions.set(session.id, session);
    this.emit('qa_session_received', session);
  }

  private handleQuestionAsk(wsMessage: WebSocketMessage): void {
    const question: Question = wsMessage.data;
    const session = this.activeSessions.get(question.sessionId);
    if (session) {
      session.questions.push(question);
      session.statistics.totalQuestions++;
      this.emit('question_received', question);
    }
  }

  private handleQuestionAnswer(wsMessage: WebSocketMessage): void {
    const { questionId, answer, answeredBy, answeredByUsername } = wsMessage.data;
    const question = this.findQuestion(questionId);
    if (question) {
      question.answer = answer;
      question.answeredBy = answeredBy;
      question.answeredByUsername = answeredByUsername;
      question.answeredAt = new Date().toISOString();
      question.status = 'answered';
      this.emit('question_answered', { questionId, answer });
    }
  }

  private handleQuestionVote(wsMessage: WebSocketMessage): void {
    const { questionId, vote } = wsMessage.data;
    const question = this.findQuestion(questionId);
    if (question) {
      if (vote === 'up') {
        question.upvotes++;
      } else {
        question.downvotes++;
      }
      this.emit('question_voted', { questionId, vote });
    }
  }

  private handleDisconnected(): void {
    this.emit('disconnected');
  }

  private addVoteToCache(vote: PollVote): void {
    if (!this.userVotes.has(vote.userId)) {
      this.userVotes.set(vote.userId, []);
    }
    
    const userVotes = this.userVotes.get(vote.userId)!;
    
    // Remove existing vote for this poll if changing vote
    const existingVoteIndex = userVotes.findIndex(v => v.pollId === vote.pollId);
    if (existingVoteIndex >= 0) {
      userVotes.splice(existingVoteIndex, 1);
    }
    
    userVotes.push(vote);
  }

  private updatePollStatistics(pollId: string): void {
    const poll = this.activePolls.get(pollId);
    if (!poll) return;

    const allVotes = Array.from(this.userVotes.values()).flat().filter(v => v.pollId === pollId);
    
    poll.statistics.totalVotes = allVotes.length;
    poll.statistics.totalParticipants = new Set(allVotes.map(v => v.userId)).size;
    
    // Update option vote counts
    poll.options.forEach(option => {
      option.votes = allVotes.filter(v => v.optionId === option.id).length;
      option.percentage = poll.statistics.totalVotes > 0 
        ? (option.votes / poll.statistics.totalVotes) * 100 
        : 0;
    });
    
    // Find top option
    const topOption = poll.options.reduce((max, option) => 
      option.votes > max.votes ? option : max
    );
    poll.statistics.topOption = topOption.text;
    
    // Update vote distribution
    poll.statistics.voteDistribution = poll.options.map(option => ({
      optionId: option.id,
      votes: option.votes,
      percentage: option.percentage,
      demographics: {
        byAge: [],
        byGender: [],
        byLocation: [],
        bySubscription: [],
        byFollowTime: [],
      },
    }));
  }

  private calculatePollResults(poll: Poll): PollResults {
    const totalVotes = poll.statistics.totalVotes;
    const winnerOption = poll.options.reduce((max, option) => 
      option.votes > max.votes ? option : max
    );
    
    const secondPlace = poll.options.filter(o => o.id !== winnerOption.id)
      .reduce((max, option) => option.votes > max.votes ? option : max);
    
    const margin = totalVotes > 0 ? 
      ((winnerOption.votes - secondPlace.votes) / totalVotes) * 100 : 0;
    
    return {
      totalVotes,
      options: poll.options.map(option => ({
        optionId: option.id,
        text: option.text,
        votes: option.votes,
        percentage: option.percentage,
        isWinner: option.id === winnerOption.id,
      })),
      winnerOptionId: winnerOption.id,
      winnerText: winnerOption.text,
      margin,
      confidence: Math.min(95, Math.max(50, 50 + margin)),
      participationRate: poll.statistics.participationRate,
      engagementMetrics: {
        averageTimeToVote: poll.statistics.averageVoteTime,
        voteChangeRate: 0,
        commentEngagement: 0,
        shareRate: 0,
        returnVoterRate: 0,
        influencerParticipation: 0,
      },
      summary: `${winnerOption.text} won with ${winnerOption.votes} votes (${winnerOption.percentage.toFixed(1)}%)`,
      insights: this.generateInsights(poll),
    };
  }

  private generateInsights(poll: Poll): string[] {
    const insights: string[] = [];
    
    const totalVotes = poll.statistics.totalVotes;
    const winnerOption = poll.options.reduce((max, option) => 
      option.votes > max.votes ? option : max
    );
    
    if (totalVotes > 0) {
      insights.push(`Total of ${totalVotes} votes cast`);
      
      if (winnerOption.percentage > 50) {
        insights.push('Clear majority preference');
      } else if (winnerOption.percentage > 40) {
        insights.push('Strong preference with no clear majority');
      } else {
        insights.push('Close competition between options');
      }
      
      const evenDistribution = poll.options.every(option => 
        Math.abs(option.percentage - (100 / poll.options.length)) < 10
      );
      
      if (evenDistribution) {
        insights.push('Votes were evenly distributed among options');
      }
    }
    
    return insights;
  }

  private getUserVote(pollId: string, userId: string): PollVote | null {
    const userVotes = this.userVotes.get(userId);
    return userVotes?.find(v => v.pollId === pollId) || null;
  }

  private findQuestion(questionId: string): Question | null {
    for (const session of this.activeSessions.values()) {
      const question = session.questions.find(q => q.id === questionId);
      if (question) return question;
    }
    return null;
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredPolls();
      this.cleanupExpiredSessions();
    }, 60000); // 1 minute
  }

  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private cleanupExpiredPolls(): void {
    const now = new Date();
    const expired: string[] = [];

    this.activePolls.forEach((poll, id) => {
      if (new Date(poll.endsAt) < now && poll.status === 'active') {
        poll.status = 'ended';
        poll.results = this.calculatePollResults(poll);
        expired.push(id);
      }
    });

    if (expired.length > 0) {
      this.emit('polls_expired', expired);
    }
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expired: string[] = [];

    this.activeSessions.forEach((session, id) => {
      if (session.endsAt && new Date(session.endsAt) < now && session.status === 'active') {
        session.status = 'ended';
        expired.push(id);
      }
    });

    if (expired.length > 0) {
      this.emit('sessions_expired', expired);
    }
  }

  private startAnalyticsCollection(): void {
    this.analyticsTimer = setInterval(() => {
      this.collectAnalytics();
    }, 60000); // 1 minute
  }

  private stopAnalyticsCollection(): void {
    if (this.analyticsTimer) {
      clearInterval(this.analyticsTimer);
      this.analyticsTimer = null;
    }
  }

  private collectAnalytics(): void {
    const now = new Date().toISOString();
    const date = now.split('T')[0];

    this.activePolls.forEach((poll, pollId) => {
      const analytics: PollAnalytics = {
        pollId,
        date,
        totalVotes: poll.statistics.totalVotes,
        uniqueVoters: poll.statistics.totalParticipants,
        averageEngagement: poll.statistics.engagementScore,
        topPerformingOptions: poll.options
          .sort((a, b) => b.votes - a.votes)
          .slice(0, 3)
          .map(o => o.text),
        demographicInsights: [],
        timeToComplete: poll.statistics.averageVoteTime,
        dropoffRate: 0,
        shareRate: 0,
        commentCount: 0,
        sentimentScore: 0,
      };

      this.pollAnalytics.set(`${pollId}_${date}`, analytics);
    });
  }

  private async loadCachedData(): Promise<void> {
    try {
      const cachedTemplates = await AsyncStorage.getItem('poll_templates');
      if (cachedTemplates) {
        const templates: PollTemplate[] = JSON.parse(cachedTemplates);
        templates.forEach(template => {
          this.pollTemplates.set(template.id, template);
        });
      }
    } catch (error) {
      logError('Failed to load cached poll data', error);
    }
  }

  private async savePollTemplates(): Promise<void> {
    try {
      const templates = Array.from(this.pollTemplates.values());
      await AsyncStorage.setItem('poll_templates', JSON.stringify(templates));
    } catch (error) {
      logError('Failed to save poll templates', error);
    }
  }

  private generatePollId(): string {
    return `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVoteId(): string {
    return `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateQuestionId(): string {
    return `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const livePollsService = new LivePollsService();

// Helper functions
export const initializePolls = async (userId: string, username: string, roomId: string) => {
  return livePollsService.initialize(userId, username, roomId);
};

export const createPoll = async (
  type: PollType,
  question: string,
  options: Omit<PollOption, 'id' | 'votes' | 'percentage'>[],
  settings?: Partial<PollSettings>
) => {
  return livePollsService.createPoll(type, question, options, settings);
};

export const votePoll = async (pollId: string, optionId: string, options?: any) => {
  return livePollsService.votePoll(pollId, optionId, options);
};

export const createQASession = async (title: string, options?: any) => {
  return livePollsService.createQASession(title, options);
};

export const askQuestion = async (sessionId: string, text: string, options?: any) => {
  return livePollsService.askQuestion(sessionId, text, options);
};