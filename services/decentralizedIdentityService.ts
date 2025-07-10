// Decentralized Identity Service with Blockchain-based Reputation System
import { ethers } from 'ethers';
import { blockchainService } from './blockchainService';
import { analyticsService } from './analyticsService';
import { notificationService } from './notificationService';
import { socialService } from './socialService';

export interface DIDDocument {
  '@context': string[];
  id: string;
  controller: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertionMethod: string[];
  keyAgreement: string[];
  capabilityInvocation: string[];
  capabilityDelegation: string[];
  service: ServiceEndpoint[];
  created: string;
  updated: string;
  proof: DIDProof[];
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase?: string;
  publicKeyJwk?: any;
  blockchainAccountId?: string;
  ethereumAddress?: string;
}

export interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string;
  description?: string;
  routingKeys?: string[];
  accept?: string[];
}

export interface DIDProof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  jws: string;
}

export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string | { id: string; name: string };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string;
    [key: string]: any;
  };
  proof: VCProof[];
  credentialStatus?: {
    id: string;
    type: string;
    statusListIndex: string;
    statusListCredential: string;
  };
  refreshService?: {
    id: string;
    type: string;
    url: string;
  };
}

export interface VCProof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  jws: string;
}

export interface VerifiablePresentation {
  '@context': string[];
  id: string;
  type: string[];
  holder: string;
  verifiableCredential: VerifiableCredential[];
  proof: VPProof[];
  created: string;
  challenge?: string;
  domain?: string;
}

export interface VPProof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  challenge?: string;
  domain?: string;
  jws: string;
}

export interface ReputationScore {
  id: string;
  did: string;
  address: string;
  username: string;
  totalScore: number;
  level: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  badges: ReputationBadge[];
  categories: {
    streaming: {
      score: number;
      level: number;
      metrics: {
        totalHours: number;
        avgViewers: number;
        followersGained: number;
        contentQuality: number;
        communityEngagement: number;
        consistency: number;
      };
    };
    community: {
      score: number;
      level: number;
      metrics: {
        helpfulness: number;
        positivity: number;
        moderationActions: number;
        reportAccuracy: number;
        mentorship: number;
        collaboration: number;
      };
    };
    trading: {
      score: number;
      level: number;
      metrics: {
        transactionVolume: number;
        tradingAccuracy: number;
        disputeResolution: number;
        marketMaking: number;
        liquidity: number;
        trustworthiness: number;
      };
    };
    governance: {
      score: number;
      level: number;
      metrics: {
        proposalQuality: number;
        votingParticipation: number;
        delegationTrust: number;
        communitySupport: number;
        decisionImpact: number;
        transparency: number;
      };
    };
  };
  achievements: Achievement[];
  attestations: Attestation[];
  endorsements: Endorsement[];
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  verificationLevel: 'unverified' | 'basic' | 'advanced' | 'expert' | 'master';
  socialProof: {
    twitterVerified: boolean;
    discordVerified: boolean;
    githubVerified: boolean;
    linkedinVerified: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    kycVerified: boolean;
  };
  privacySettings: {
    publicProfile: boolean;
    showScores: boolean;
    showBadges: boolean;
    showAchievements: boolean;
    showAttestations: boolean;
    showEndorsements: boolean;
    allowEndorsements: boolean;
    allowAttestations: boolean;
  };
}

export interface ReputationBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category: 'streaming' | 'community' | 'trading' | 'governance' | 'special';
  requirements: {
    type: string;
    value: number;
    description: string;
  }[];
  earnedAt: string;
  isVisible: boolean;
  nftTokenId?: string;
  metadata: {
    source: string;
    criteria: string;
    validator: string;
    expires?: string;
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'legendary';
  points: number;
  requirements: string[];
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  unlockedAt?: string;
  isUnlocked: boolean;
  isVisible: boolean;
  rewards: {
    type: 'badge' | 'nft' | 'token' | 'access' | 'discount';
    value: string;
    description: string;
  }[];
  metadata: Record<string, any>;
}

export interface Attestation {
  id: string;
  type: 'skill' | 'experience' | 'achievement' | 'identity' | 'reputation';
  claim: string;
  description: string;
  issuer: {
    did: string;
    name: string;
    address: string;
    reputation: number;
  };
  subject: {
    did: string;
    address: string;
  };
  evidence: {
    type: string;
    url: string;
    hash: string;
  }[];
  credentialId: string;
  issuedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  isRevoked: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired';
  trustScore: number;
  endorsements: number;
  challenges: number;
  metadata: Record<string, any>;
}

export interface Endorsement {
  id: string;
  type: 'skill' | 'character' | 'work' | 'collaboration' | 'general';
  message: string;
  category: string;
  rating: number; // 1-5 stars
  endorser: {
    did: string;
    name: string;
    address: string;
    reputation: number;
  };
  subject: {
    did: string;
    address: string;
  };
  createdAt: string;
  isPublic: boolean;
  isVerified: boolean;
  weight: number; // Calculated based on endorser's reputation
  tags: string[];
  metadata: Record<string, any>;
}

export interface IdentityVerification {
  id: string;
  did: string;
  verificationType: 'email' | 'phone' | 'kyc' | 'social' | 'biometric' | 'document';
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  provider: string;
  providerData: Record<string, any>;
  verifiedAt?: string;
  expiresAt?: string;
  documentHash?: string;
  evidence: {
    type: string;
    url: string;
    hash: string;
  }[];
  metadata: Record<string, any>;
}

export interface IdentityLink {
  id: string;
  did: string;
  platform: 'twitter' | 'discord' | 'github' | 'linkedin' | 'telegram' | 'reddit' | 'instagram';
  platformId: string;
  platformUsername: string;
  profileUrl: string;
  isVerified: boolean;
  verifiedAt?: string;
  proof: {
    type: string;
    signature: string;
    timestamp: string;
  };
  metadata: Record<string, any>;
}

export interface TrustNetwork {
  id: string;
  did: string;
  trustedConnections: {
    did: string;
    address: string;
    username: string;
    trustLevel: number;
    relationship: 'friend' | 'colleague' | 'mentor' | 'business' | 'community';
    createdAt: string;
    lastInteraction: string;
    mutualTrust: boolean;
  }[];
  trustScore: number;
  networkSize: number;
  trustRadius: number;
  reputation: number;
  endorsementsPower: number;
  governance: {
    votingPower: number;
    delegatedVotes: number;
    proposalCount: number;
    participationRate: number;
  };
  privacy: {
    publicNetwork: boolean;
    showConnections: boolean;
    allowDiscovery: boolean;
  };
}

class DecentralizedIdentityService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.streammulti.com';
  private readonly didRegistry = '0x1234567890123456789012345678901234567890'; // DID Registry contract
  private readonly reputationContract = '0x0987654321098765432109876543210987654321'; // Reputation contract
  private didDocuments: Map<string, DIDDocument> = new Map();
  private reputationScores: Map<string, ReputationScore> = new Map();
  private credentials: Map<string, VerifiableCredential> = new Map();
  private attestations: Map<string, Attestation> = new Map();
  private endorsements: Map<string, Endorsement> = new Map();
  private identityLinks: Map<string, IdentityLink[]> = new Map();
  private trustNetworks: Map<string, TrustNetwork> = new Map();
  private verificationQueue: Map<string, IdentityVerification> = new Map();

  constructor() {
    this.initializeReputationSystem();
    this.startReputationUpdates();
    this.startAttestationVerification();
    console.log('🆔 Decentralized Identity Service initialized');
  }

  private initializeReputationSystem(): void {
    // Initialize reputation scoring algorithms and badge systems
    console.log('📊 Reputation system initialized');
  }

  private startReputationUpdates(): void {
    // Update reputation scores every hour
    setInterval(async () => {
      await this.updateReputationScores();
    }, 3600000);
  }

  private startAttestationVerification(): void {
    // Verify pending attestations every 5 minutes
    setInterval(async () => {
      await this.verifyPendingAttestations();
    }, 300000);
  }

  // DID Management
  public async createDID(params: {
    controller?: string;
    verificationMethods?: Partial<VerificationMethod>[];
    services?: Partial<ServiceEndpoint>[];
  }): Promise<DIDDocument | null> {
    console.log('🔄 Creating DID...');

    try {
      if (!blockchainService.isWalletConnected()) {
        throw new Error('Wallet not connected');
      }

      const wallet = blockchainService.getCurrentWallet();
      if (!wallet) {
        throw new Error('No wallet available');
      }

      const did = `did:eth:${wallet.address}`;
      const controller = params.controller || wallet.address;

      // Create default verification method
      const defaultVerificationMethod: VerificationMethod = {
        id: `${did}#controller`,
        type: 'EcdsaSecp256k1RecoveryMethod2020',
        controller: did,
        blockchainAccountId: `${wallet.address}@eip155:${blockchainService.getCurrentNetwork()?.chainId}`,
        ethereumAddress: wallet.address,
      };

      // Create default service endpoints
      const defaultService: ServiceEndpoint = {
        id: `${did}#streammulti`,
        type: 'StreamMultiProfile',
        serviceEndpoint: `https://streammulti.com/profile/${wallet.address}`,
        description: 'StreamMulti decentralized streaming profile',
      };

      const didDocument: DIDDocument = {
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/v1',
          'https://streammulti.com/contexts/identity/v1',
        ],
        id: did,
        controller,
        verificationMethod: [defaultVerificationMethod, ...(params.verificationMethods || [])],
        authentication: [`${did}#controller`],
        assertionMethod: [`${did}#controller`],
        keyAgreement: [`${did}#controller`],
        capabilityInvocation: [`${did}#controller`],
        capabilityDelegation: [`${did}#controller`],
        service: [defaultService, ...(params.services || [])],
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        proof: [],
      };

      // Sign the DID document
      const proof = await this.signDIDDocument(didDocument);
      didDocument.proof = [proof];

      // Store on blockchain
      await this.registerDIDOnChain(didDocument);

      // Cache locally
      this.didDocuments.set(did, didDocument);

      // Create initial reputation score
      await this.initializeReputationScore(did, wallet.address);

      console.log(`✅ DID created: ${did}`);
      return didDocument;
    } catch (error) {
      console.error('❌ Failed to create DID:', error);
      return null;
    }
  }

  public async resolveDID(did: string): Promise<DIDDocument | null> {
    console.log(`🔄 Resolving DID: ${did}`);

    try {
      // Check cache first
      const cached = this.didDocuments.get(did);
      if (cached) {
        return cached;
      }

      // Resolve from blockchain
      const didDocument = await this.resolveDIDFromChain(did);
      if (didDocument) {
        this.didDocuments.set(did, didDocument);
        return didDocument;
      }

      // Resolve from remote registry
      const remoteDID = await this.resolveDIDFromRegistry(did);
      if (remoteDID) {
        this.didDocuments.set(did, remoteDID);
        return remoteDID;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to resolve DID:', error);
      return null;
    }
  }

  public async updateDID(did: string, updates: Partial<DIDDocument>): Promise<DIDDocument | null> {
    console.log(`🔄 Updating DID: ${did}`);

    try {
      const existingDID = await this.resolveDID(did);
      if (!existingDID) {
        throw new Error('DID not found');
      }

      // Verify authorization
      if (!await this.verifyDIDController(did)) {
        throw new Error('Not authorized to update this DID');
      }

      const updatedDID: DIDDocument = {
        ...existingDID,
        ...updates,
        updated: new Date().toISOString(),
      };

      // Re-sign the document
      const proof = await this.signDIDDocument(updatedDID);
      updatedDID.proof = [proof];

      // Update on blockchain
      await this.updateDIDOnChain(updatedDID);

      // Update cache
      this.didDocuments.set(did, updatedDID);

      console.log(`✅ DID updated: ${did}`);
      return updatedDID;
    } catch (error) {
      console.error('❌ Failed to update DID:', error);
      return null;
    }
  }

  // Verifiable Credentials
  public async issueCredential(params: {
    subjectDID: string;
    type: string;
    claims: Record<string, any>;
    expirationDate?: string;
    evidence?: any[];
  }): Promise<VerifiableCredential | null> {
    console.log(`🔄 Issuing credential: ${params.type}`);

    try {
      if (!blockchainService.isWalletConnected()) {
        throw new Error('Wallet not connected');
      }

      const wallet = blockchainService.getCurrentWallet();
      if (!wallet) {
        throw new Error('No wallet available');
      }

      const issuerDID = `did:eth:${wallet.address}`;
      const credentialId = `urn:uuid:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const credential: VerifiableCredential = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://streammulti.com/contexts/credentials/v1',
        ],
        id: credentialId,
        type: ['VerifiableCredential', params.type],
        issuer: {
          id: issuerDID,
          name: 'StreamMulti Platform',
        },
        issuanceDate: new Date().toISOString(),
        expirationDate: params.expirationDate,
        credentialSubject: {
          id: params.subjectDID,
          ...params.claims,
        },
        proof: [],
      };

      // Sign the credential
      const proof = await this.signCredential(credential);
      credential.proof = [proof];

      // Store credential
      this.credentials.set(credentialId, credential);

      // Create attestation
      await this.createAttestationFromCredential(credential);

      console.log(`✅ Credential issued: ${credentialId}`);
      return credential;
    } catch (error) {
      console.error('❌ Failed to issue credential:', error);
      return null;
    }
  }

  public async verifyCredential(credential: VerifiableCredential): Promise<boolean> {
    console.log(`🔄 Verifying credential: ${credential.id}`);

    try {
      // Verify signature
      const isValidSignature = await this.verifyCredentialSignature(credential);
      if (!isValidSignature) {
        console.log('❌ Invalid credential signature');
        return false;
      }

      // Check expiration
      if (credential.expirationDate && new Date(credential.expirationDate) < new Date()) {
        console.log('❌ Credential expired');
        return false;
      }

      // Check revocation status
      if (credential.credentialStatus) {
        const isRevoked = await this.checkCredentialRevocation(credential);
        if (isRevoked) {
          console.log('❌ Credential revoked');
          return false;
        }
      }

      // Verify issuer
      const issuerDID = typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id;
      const isValidIssuer = await this.verifyIssuer(issuerDID, credential.type);
      if (!isValidIssuer) {
        console.log('❌ Invalid issuer');
        return false;
      }

      console.log(`✅ Credential verified: ${credential.id}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to verify credential:', error);
      return false;
    }
  }

  public async createPresentation(params: {
    credentials: VerifiableCredential[];
    challenge?: string;
    domain?: string;
  }): Promise<VerifiablePresentation | null> {
    console.log(`🔄 Creating presentation with ${params.credentials.length} credentials`);

    try {
      if (!blockchainService.isWalletConnected()) {
        throw new Error('Wallet not connected');
      }

      const wallet = blockchainService.getCurrentWallet();
      if (!wallet) {
        throw new Error('No wallet available');
      }

      const holderDID = `did:eth:${wallet.address}`;
      const presentationId = `urn:uuid:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const presentation: VerifiablePresentation = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://streammulti.com/contexts/presentations/v1',
        ],
        id: presentationId,
        type: ['VerifiablePresentation'],
        holder: holderDID,
        verifiableCredential: params.credentials,
        created: new Date().toISOString(),
        challenge: params.challenge,
        domain: params.domain,
        proof: [],
      };

      // Sign the presentation
      const proof = await this.signPresentation(presentation);
      presentation.proof = [proof];

      console.log(`✅ Presentation created: ${presentationId}`);
      return presentation;
    } catch (error) {
      console.error('❌ Failed to create presentation:', error);
      return null;
    }
  }

  // Reputation System
  public async getReputationScore(did: string): Promise<ReputationScore | null> {
    const cached = this.reputationScores.get(did);
    if (cached) {
      return cached;
    }

    try {
      const score = await this.fetchReputationScore(did);
      if (score) {
        this.reputationScores.set(did, score);
      }
      return score;
    } catch (error) {
      console.error('❌ Failed to get reputation score:', error);
      return null;
    }
  }

  private async initializeReputationScore(did: string, address: string): Promise<ReputationScore> {
    const reputationScore: ReputationScore = {
      id: `reputation-${did}`,
      did,
      address,
      username: 'Anonymous',
      totalScore: 0,
      level: 1,
      tier: 'bronze',
      badges: [],
      categories: {
        streaming: {
          score: 0,
          level: 1,
          metrics: {
            totalHours: 0,
            avgViewers: 0,
            followersGained: 0,
            contentQuality: 0,
            communityEngagement: 0,
            consistency: 0,
          },
        },
        community: {
          score: 0,
          level: 1,
          metrics: {
            helpfulness: 0,
            positivity: 0,
            moderationActions: 0,
            reportAccuracy: 0,
            mentorship: 0,
            collaboration: 0,
          },
        },
        trading: {
          score: 0,
          level: 1,
          metrics: {
            transactionVolume: 0,
            tradingAccuracy: 0,
            disputeResolution: 0,
            marketMaking: 0,
            liquidity: 0,
            trustworthiness: 0,
          },
        },
        governance: {
          score: 0,
          level: 1,
          metrics: {
            proposalQuality: 0,
            votingParticipation: 0,
            delegationTrust: 0,
            communitySupport: 0,
            decisionImpact: 0,
            transparency: 0,
          },
        },
      },
      achievements: [],
      attestations: [],
      endorsements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      verificationLevel: 'unverified',
      socialProof: {
        twitterVerified: false,
        discordVerified: false,
        githubVerified: false,
        linkedinVerified: false,
        emailVerified: false,
        phoneVerified: false,
        kycVerified: false,
      },
      privacySettings: {
        publicProfile: true,
        showScores: true,
        showBadges: true,
        showAchievements: true,
        showAttestations: true,
        showEndorsements: true,
        allowEndorsements: true,
        allowAttestations: true,
      },
    };

    this.reputationScores.set(did, reputationScore);
    return reputationScore;
  }

  private async updateReputationScores(): Promise<void> {
    console.log('🔄 Updating reputation scores...');

    try {
      for (const [did, score] of this.reputationScores) {
        await this.calculateReputationScore(did, score);
      }
      console.log('✅ Reputation scores updated');
    } catch (error) {
      console.error('❌ Failed to update reputation scores:', error);
    }
  }

  private async calculateReputationScore(did: string, score: ReputationScore): Promise<void> {
    try {
      // Get user analytics
      const userAnalytics = await analyticsService.getViewerAnalytics(score.address);
      
      if (userAnalytics) {
        // Update streaming metrics
        score.categories.streaming.metrics = {
          totalHours: userAnalytics.totalWatchTime / 60, // Convert to hours
          avgViewers: userAnalytics.averageSessionDuration,
          followersGained: userAnalytics.socialActivity.streamersFollowed,
          contentQuality: this.calculateContentQuality(userAnalytics),
          communityEngagement: this.calculateCommunityEngagement(userAnalytics),
          consistency: this.calculateConsistency(userAnalytics),
        };

        // Update community metrics
        score.categories.community.metrics = {
          helpfulness: this.calculateHelpfulness(userAnalytics),
          positivity: this.calculatePositivity(userAnalytics),
          moderationActions: userAnalytics.chatActivity.moderatorActions,
          reportAccuracy: this.calculateReportAccuracy(userAnalytics),
          mentorship: this.calculateMentorship(userAnalytics),
          collaboration: this.calculateCollaboration(userAnalytics),
        };

        // Calculate category scores
        score.categories.streaming.score = this.calculateCategoryScore(score.categories.streaming.metrics);
        score.categories.community.score = this.calculateCategoryScore(score.categories.community.metrics);
        score.categories.trading.score = this.calculateCategoryScore(score.categories.trading.metrics);
        score.categories.governance.score = this.calculateCategoryScore(score.categories.governance.metrics);

        // Calculate total score
        score.totalScore = 
          score.categories.streaming.score * 0.3 +
          score.categories.community.score * 0.25 +
          score.categories.trading.score * 0.25 +
          score.categories.governance.score * 0.2;

        // Update level and tier
        score.level = Math.floor(score.totalScore / 100) + 1;
        score.tier = this.calculateTier(score.totalScore);

        // Check for new badges
        await this.checkForNewBadges(score);

        // Update timestamps
        score.updatedAt = new Date().toISOString();
        score.lastActivityAt = new Date().toISOString();

        this.reputationScores.set(did, score);
      }
    } catch (error) {
      console.error('❌ Failed to calculate reputation score:', error);
    }
  }

  private calculateContentQuality(analytics: any): number {
    // Calculate content quality based on various factors
    const factors = [
      analytics.engagement.avgWatchTime / 60, // Watch time in minutes
      analytics.socialActivity.clipsCreated,
      analytics.socialActivity.likesGiven,
      analytics.socialActivity.commentsPosted,
    ];

    return factors.reduce((sum, factor) => sum + Math.min(factor, 100), 0) / factors.length;
  }

  private calculateCommunityEngagement(analytics: any): number {
    // Calculate community engagement
    const factors = [
      analytics.chatActivity.messagesSent / 10,
      analytics.socialActivity.streamersFollowed,
      analytics.socialActivity.postsCreated,
      analytics.socialActivity.commentsPosted,
    ];

    return factors.reduce((sum, factor) => sum + Math.min(factor, 100), 0) / factors.length;
  }

  private calculateConsistency(analytics: any): number {
    // Calculate streaming consistency
    return Math.min(analytics.engagement.avgSessionsPerWeek * 10, 100);
  }

  private calculateHelpfulness(analytics: any): number {
    // Calculate helpfulness score
    return Math.min(analytics.chatActivity.messagesSent / 100, 100);
  }

  private calculatePositivity(analytics: any): number {
    // Calculate positivity score based on chat sentiment
    return Math.random() * 100; // Placeholder
  }

  private calculateReportAccuracy(analytics: any): number {
    // Calculate report accuracy
    return Math.random() * 100; // Placeholder
  }

  private calculateMentorship(analytics: any): number {
    // Calculate mentorship score
    return Math.min(analytics.socialActivity.commentsPosted / 50, 100);
  }

  private calculateCollaboration(analytics: any): number {
    // Calculate collaboration score
    return Math.min(analytics.socialActivity.streamersFollowed / 10, 100);
  }

  private calculateCategoryScore(metrics: any): number {
    const values = Object.values(metrics) as number[];
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private calculateTier(score: number): ReputationScore['tier'] {
    if (score >= 800) return 'diamond';
    if (score >= 600) return 'platinum';
    if (score >= 400) return 'gold';
    if (score >= 200) return 'silver';
    return 'bronze';
  }

  private async checkForNewBadges(score: ReputationScore): Promise<void> {
    const availableBadges = await this.getAvailableBadges();
    
    for (const badge of availableBadges) {
      if (this.meetsRequirements(score, badge) && !score.badges.find(b => b.id === badge.id)) {
        const earnedBadge: ReputationBadge = {
          ...badge,
          earnedAt: new Date().toISOString(),
          isVisible: true,
        };

        score.badges.push(earnedBadge);

        // Send notification
        await notificationService.showNotification({
          id: `badge-earned-${badge.id}`,
          title: 'Badge Earned!',
          body: `You earned the "${badge.name}" badge!`,
          category: 'system',
          image: badge.icon,
        });
      }
    }
  }

  private meetsRequirements(score: ReputationScore, badge: ReputationBadge): boolean {
    // Check if user meets badge requirements
    return badge.requirements.every(req => {
      switch (req.type) {
        case 'total_score':
          return score.totalScore >= req.value;
        case 'streaming_hours':
          return score.categories.streaming.metrics.totalHours >= req.value;
        case 'community_score':
          return score.categories.community.score >= req.value;
        default:
          return false;
      }
    });
  }

  private async getAvailableBadges(): Promise<ReputationBadge[]> {
    // Return available badges
    return [
      {
        id: 'first-stream',
        name: 'First Stream',
        description: 'Watched your first stream',
        icon: '/assets/badges/first-stream.png',
        color: '#4CAF50',
        rarity: 'common',
        category: 'streaming',
        requirements: [
          { type: 'streaming_hours', value: 1, description: 'Watch 1 hour of content' },
        ],
        earnedAt: '',
        isVisible: true,
        metadata: {
          source: 'system',
          criteria: 'automated',
          validator: 'reputation_system',
        },
      },
      {
        id: 'community-helper',
        name: 'Community Helper',
        description: 'Helped other community members',
        icon: '/assets/badges/community-helper.png',
        color: '#2196F3',
        rarity: 'uncommon',
        category: 'community',
        requirements: [
          { type: 'community_score', value: 100, description: 'Reach 100 community score' },
        ],
        earnedAt: '',
        isVisible: true,
        metadata: {
          source: 'system',
          criteria: 'automated',
          validator: 'reputation_system',
        },
      },
    ];
  }

  // Attestation System
  public async createAttestation(params: {
    type: Attestation['type'];
    claim: string;
    description: string;
    subjectDID: string;
    evidence?: { type: string; url: string; hash: string }[];
    expiresAt?: string;
  }): Promise<Attestation | null> {
    console.log(`🔄 Creating attestation: ${params.claim}`);

    try {
      if (!blockchainService.isWalletConnected()) {
        throw new Error('Wallet not connected');
      }

      const wallet = blockchainService.getCurrentWallet();
      if (!wallet) {
        throw new Error('No wallet available');
      }

      const issuerDID = `did:eth:${wallet.address}`;
      const issuerScore = await this.getReputationScore(issuerDID);

      const attestation: Attestation = {
        id: `attestation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: params.type,
        claim: params.claim,
        description: params.description,
        issuer: {
          did: issuerDID,
          name: issuerScore?.username || 'Anonymous',
          address: wallet.address,
          reputation: issuerScore?.totalScore || 0,
        },
        subject: {
          did: params.subjectDID,
          address: params.subjectDID.split(':')[2] || '',
        },
        evidence: params.evidence || [],
        credentialId: `urn:uuid:${Date.now()}`,
        issuedAt: new Date().toISOString(),
        expiresAt: params.expiresAt,
        isRevoked: false,
        verificationStatus: 'pending',
        trustScore: 0,
        endorsements: 0,
        challenges: 0,
        metadata: {},
      };

      this.attestations.set(attestation.id, attestation);

      // Queue for verification
      this.verificationQueue.set(attestation.id, {
        id: attestation.id,
        did: params.subjectDID,
        verificationType: 'attestation',
        status: 'pending',
        provider: 'reputation_system',
        providerData: { attestationId: attestation.id },
        evidence: params.evidence || [],
        metadata: {},
      });

      console.log(`✅ Attestation created: ${attestation.id}`);
      return attestation;
    } catch (error) {
      console.error('❌ Failed to create attestation:', error);
      return null;
    }
  }

  public async endorseAttestation(attestationId: string): Promise<boolean> {
    console.log(`🔄 Endorsing attestation: ${attestationId}`);

    try {
      const attestation = this.attestations.get(attestationId);
      if (!attestation) {
        throw new Error('Attestation not found');
      }

      attestation.endorsements++;
      attestation.trustScore = this.calculateTrustScore(attestation);

      this.attestations.set(attestationId, attestation);

      console.log(`✅ Attestation endorsed: ${attestationId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to endorse attestation:', error);
      return false;
    }
  }

  public async challengeAttestation(attestationId: string, reason: string): Promise<boolean> {
    console.log(`🔄 Challenging attestation: ${attestationId}`);

    try {
      const attestation = this.attestations.get(attestationId);
      if (!attestation) {
        throw new Error('Attestation not found');
      }

      attestation.challenges++;
      attestation.trustScore = this.calculateTrustScore(attestation);

      // If challenges exceed threshold, mark for review
      if (attestation.challenges >= 3) {
        attestation.verificationStatus = 'pending';
      }

      this.attestations.set(attestationId, attestation);

      console.log(`✅ Attestation challenged: ${attestationId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to challenge attestation:', error);
      return false;
    }
  }

  private async verifyPendingAttestations(): Promise<void> {
    console.log('🔄 Verifying pending attestations...');

    try {
      const pendingAttestations = Array.from(this.attestations.values())
        .filter(a => a.verificationStatus === 'pending');

      for (const attestation of pendingAttestations) {
        await this.verifyAttestation(attestation);
      }

      console.log('✅ Pending attestations verified');
    } catch (error) {
      console.error('❌ Failed to verify pending attestations:', error);
    }
  }

  private async verifyAttestation(attestation: Attestation): Promise<void> {
    try {
      // Verify evidence
      const evidenceValid = await this.verifyEvidence(attestation.evidence);
      
      // Check issuer reputation
      const issuerScore = await this.getReputationScore(attestation.issuer.did);
      const issuerTrustworthy = issuerScore ? issuerScore.totalScore >= 100 : false;

      // Calculate trust score
      const trustScore = this.calculateTrustScore(attestation);

      if (evidenceValid && issuerTrustworthy && trustScore >= 70) {
        attestation.verificationStatus = 'verified';
        attestation.trustScore = trustScore;
      } else if (trustScore < 30) {
        attestation.verificationStatus = 'rejected';
      } else {
        // Keep pending for manual review
        attestation.verificationStatus = 'pending';
      }

      this.attestations.set(attestation.id, attestation);
    } catch (error) {
      console.error('❌ Failed to verify attestation:', error);
    }
  }

  private async verifyEvidence(evidence: { type: string; url: string; hash: string }[]): Promise<boolean> {
    // Verify evidence integrity
    for (const item of evidence) {
      try {
        const response = await fetch(item.url);
        const data = await response.arrayBuffer();
        const hash = await crypto.subtle.digest('SHA-256', data);
        const hashHex = Array.from(new Uint8Array(hash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        if (hashHex !== item.hash) {
          return false;
        }
      } catch (error) {
        console.error('❌ Failed to verify evidence:', error);
        return false;
      }
    }

    return true;
  }

  private calculateTrustScore(attestation: Attestation): number {
    const issuerWeight = Math.min(attestation.issuer.reputation / 10, 50);
    const endorsementWeight = Math.min(attestation.endorsements * 5, 30);
    const challengePenalty = Math.max(attestation.challenges * 10, 0);
    const evidenceWeight = Math.min(attestation.evidence.length * 5, 20);

    return Math.max(issuerWeight + endorsementWeight + evidenceWeight - challengePenalty, 0);
  }

  // Endorsement System
  public async createEndorsement(params: {
    type: Endorsement['type'];
    message: string;
    category: string;
    rating: number;
    subjectDID: string;
    isPublic: boolean;
    tags: string[];
  }): Promise<Endorsement | null> {
    console.log(`🔄 Creating endorsement for: ${params.subjectDID}`);

    try {
      if (!blockchainService.isWalletConnected()) {
        throw new Error('Wallet not connected');
      }

      const wallet = blockchainService.getCurrentWallet();
      if (!wallet) {
        throw new Error('No wallet available');
      }

      const endorserDID = `did:eth:${wallet.address}`;
      const endorserScore = await this.getReputationScore(endorserDID);

      const endorsement: Endorsement = {
        id: `endorsement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: params.type,
        message: params.message,
        category: params.category,
        rating: params.rating,
        endorser: {
          did: endorserDID,
          name: endorserScore?.username || 'Anonymous',
          address: wallet.address,
          reputation: endorserScore?.totalScore || 0,
        },
        subject: {
          did: params.subjectDID,
          address: params.subjectDID.split(':')[2] || '',
        },
        createdAt: new Date().toISOString(),
        isPublic: params.isPublic,
        isVerified: false,
        weight: this.calculateEndorsementWeight(endorserScore?.totalScore || 0),
        tags: params.tags,
        metadata: {},
      };

      this.endorsements.set(endorsement.id, endorsement);

      // Update subject's reputation
      await this.updateSubjectReputation(params.subjectDID, endorsement);

      console.log(`✅ Endorsement created: ${endorsement.id}`);
      return endorsement;
    } catch (error) {
      console.error('❌ Failed to create endorsement:', error);
      return null;
    }
  }

  private calculateEndorsementWeight(endorserReputation: number): number {
    // Higher reputation endorsers have more weight
    return Math.min(endorserReputation / 100, 10);
  }

  private async updateSubjectReputation(subjectDID: string, endorsement: Endorsement): Promise<void> {
    const subjectScore = await this.getReputationScore(subjectDID);
    if (subjectScore) {
      subjectScore.endorsements.push(endorsement);
      
      // Update relevant category score based on endorsement
      const categoryBonus = endorsement.weight * endorsement.rating;
      switch (endorsement.category) {
        case 'streaming':
          subjectScore.categories.streaming.score += categoryBonus;
          break;
        case 'community':
          subjectScore.categories.community.score += categoryBonus;
          break;
        case 'trading':
          subjectScore.categories.trading.score += categoryBonus;
          break;
        case 'governance':
          subjectScore.categories.governance.score += categoryBonus;
          break;
      }

      // Recalculate total score
      subjectScore.totalScore = 
        subjectScore.categories.streaming.score * 0.3 +
        subjectScore.categories.community.score * 0.25 +
        subjectScore.categories.trading.score * 0.25 +
        subjectScore.categories.governance.score * 0.2;

      subjectScore.updatedAt = new Date().toISOString();
      this.reputationScores.set(subjectDID, subjectScore);
    }
  }

  // Blockchain Integration
  private async signDIDDocument(didDocument: DIDDocument): Promise<DIDProof> {
    const message = JSON.stringify(didDocument);
    const signature = await blockchainService.signMessage(message);
    
    return {
      type: 'EcdsaSecp256k1Signature2019',
      created: new Date().toISOString(),
      verificationMethod: `${didDocument.id}#controller`,
      proofPurpose: 'assertionMethod',
      jws: signature,
    };
  }

  private async signCredential(credential: VerifiableCredential): Promise<VCProof> {
    const message = JSON.stringify(credential);
    const signature = await blockchainService.signMessage(message);
    
    return {
      type: 'EcdsaSecp256k1Signature2019',
      created: new Date().toISOString(),
      verificationMethod: `${credential.issuer}#controller`,
      proofPurpose: 'assertionMethod',
      jws: signature,
    };
  }

  private async signPresentation(presentation: VerifiablePresentation): Promise<VPProof> {
    const message = JSON.stringify(presentation);
    const signature = await blockchainService.signMessage(message);
    
    return {
      type: 'EcdsaSecp256k1Signature2019',
      created: new Date().toISOString(),
      verificationMethod: `${presentation.holder}#controller`,
      proofPurpose: 'authentication',
      challenge: presentation.challenge,
      domain: presentation.domain,
      jws: signature,
    };
  }

  private async registerDIDOnChain(didDocument: DIDDocument): Promise<void> {
    // Register DID on blockchain
    console.log('📝 Registering DID on blockchain...');
    // Implementation would use DID registry contract
  }

  private async updateDIDOnChain(didDocument: DIDDocument): Promise<void> {
    // Update DID on blockchain
    console.log('📝 Updating DID on blockchain...');
    // Implementation would use DID registry contract
  }

  private async resolveDIDFromChain(did: string): Promise<DIDDocument | null> {
    // Resolve DID from blockchain
    console.log('🔍 Resolving DID from blockchain...');
    // Implementation would query DID registry contract
    return null;
  }

  private async resolveDIDFromRegistry(did: string): Promise<DIDDocument | null> {
    // Resolve DID from remote registry
    try {
      const response = await fetch(`${this.baseUrl}/did/resolve/${encodeURIComponent(did)}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to resolve DID from registry:', error);
      return null;
    }
  }

  private async verifyDIDController(did: string): Promise<boolean> {
    // Verify if current wallet controls the DID
    const wallet = blockchainService.getCurrentWallet();
    if (!wallet) {
      return false;
    }

    const didDocument = await this.resolveDID(did);
    if (!didDocument) {
      return false;
    }

    return didDocument.controller === wallet.address || didDocument.id === `did:eth:${wallet.address}`;
  }

  private async verifyCredentialSignature(credential: VerifiableCredential): Promise<boolean> {
    // Verify credential signature
    // Implementation would verify the JWS signature
    return true; // Placeholder
  }

  private async checkCredentialRevocation(credential: VerifiableCredential): Promise<boolean> {
    // Check if credential is revoked
    if (!credential.credentialStatus) {
      return false;
    }

    try {
      const response = await fetch(credential.credentialStatus.statusListCredential);
      const statusList = await response.json();
      
      // Check status in the list
      const index = parseInt(credential.credentialStatus.statusListIndex);
      return statusList.revoked.includes(index);
    } catch (error) {
      console.error('❌ Failed to check credential revocation:', error);
      return false;
    }
  }

  private async verifyIssuer(issuerDID: string, credentialTypes: string[]): Promise<boolean> {
    // Verify if issuer is authorized to issue this type of credential
    const issuerScore = await this.getReputationScore(issuerDID);
    return issuerScore ? issuerScore.totalScore >= 100 : false;
  }

  private async fetchReputationScore(did: string): Promise<ReputationScore | null> {
    try {
      const response = await fetch(`${this.baseUrl}/identity/reputation/${encodeURIComponent(did)}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to fetch reputation score:', error);
      return null;
    }
  }

  private async createAttestationFromCredential(credential: VerifiableCredential): Promise<void> {
    // Create attestation from issued credential
    const attestation = await this.createAttestation({
      type: 'achievement',
      claim: credential.type.join(', '),
      description: `Verified credential: ${credential.type.join(', ')}`,
      subjectDID: credential.credentialSubject.id,
      evidence: [],
    });

    if (attestation) {
      attestation.credentialId = credential.id;
      attestation.verificationStatus = 'verified';
      attestation.trustScore = 100;
      this.attestations.set(attestation.id, attestation);
    }
  }

  // Public API Methods
  public async getIdentityProfile(did: string): Promise<{
    didDocument: DIDDocument | null;
    reputationScore: ReputationScore | null;
    attestations: Attestation[];
    endorsements: Endorsement[];
    credentials: VerifiableCredential[];
  }> {
    const didDocument = await this.resolveDID(did);
    const reputationScore = await this.getReputationScore(did);
    const attestations = Array.from(this.attestations.values())
      .filter(a => a.subject.did === did);
    const endorsements = Array.from(this.endorsements.values())
      .filter(e => e.subject.did === did);
    const credentials = Array.from(this.credentials.values())
      .filter(c => c.credentialSubject.id === did);

    return {
      didDocument,
      reputationScore,
      attestations,
      endorsements,
      credentials,
    };
  }

  public async searchIdentities(query: string, filters?: {
    minReputation?: number;
    categories?: string[];
    verificationLevel?: string;
    location?: string;
  }): Promise<ReputationScore[]> {
    const results = Array.from(this.reputationScores.values())
      .filter(score => {
        const matchesQuery = score.username.toLowerCase().includes(query.toLowerCase()) ||
                           score.address.toLowerCase().includes(query.toLowerCase());
        
        const matchesFilters = (!filters?.minReputation || score.totalScore >= filters.minReputation) &&
                              (!filters?.verificationLevel || score.verificationLevel === filters.verificationLevel);

        return matchesQuery && matchesFilters;
      })
      .sort((a, b) => b.totalScore - a.totalScore);

    return results;
  }

  public async getLeaderboard(category?: string, limit: number = 50): Promise<ReputationScore[]> {
    const scores = Array.from(this.reputationScores.values())
      .filter(score => score.privacySettings.publicProfile)
      .sort((a, b) => {
        if (category) {
          const categoryA = a.categories[category as keyof typeof a.categories];
          const categoryB = b.categories[category as keyof typeof b.categories];
          return categoryB ? categoryB.score - (categoryA ? categoryA.score : 0) : 0;
        }
        return b.totalScore - a.totalScore;
      })
      .slice(0, limit);

    return scores;
  }

  public getSupportedCredentialTypes(): string[] {
    return [
      'StreamingExpertCredential',
      'CommunityModeratorCredential',
      'ContentCreatorCredential',
      'TradingExpertCredential',
      'GovernanceParticipantCredential',
      'IdentityVerificationCredential',
      'SkillAssessmentCredential',
      'AchievementCredential',
    ];
  }
}

export const decentralizedIdentityService = new DecentralizedIdentityService();
export default decentralizedIdentityService;