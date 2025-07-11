// NFT Service for Digital Collectibles, Stream Highlights, and Creator NFTs
import { ethers } from 'ethers';
import { blockchainService } from './blockchainService';
import { analyticsService } from './analyticsService';
import { notificationService } from './notificationService';
import { socialService } from './socialService';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  animation_url?: string;
  background_color?: string;
  attributes: NFTAttribute[];
  properties?: {
    category: string;
    rarity: string;
    collection: string;
    creator: string;
    createdAt: string;
    streamId?: string;
    clipId?: string;
    timestamp?: number;
    platform?: string;
  };
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'number' | 'boost_number' | 'boost_percentage' | 'date';
  max_value?: number;
}

export interface NFTCollection {
  id: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  banner_image?: string;
  featured_image?: string;
  large_image?: string;
  external_url?: string;
  category: 'stream-highlights' | 'creator-cards' | 'achievement-badges' | 'exclusive-content' | 'community-art' | 'event-tickets' | 'virtual-items';
  contractAddress: string;
  chainId: number;
  creatorAddress: string;
  creatorName: string;
  totalSupply: number;
  maxSupply?: number;
  mintPrice: string;
  royaltyPercentage: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalVolume: string;
    floorPrice: string;
    avgPrice: string;
    ownersCount: number;
    listedCount: number;
    totalSales: number;
  };
  socialLinks: {
    website?: string;
    twitter?: string;
    discord?: string;
    telegram?: string;
    instagram?: string;
  };
  metadata: {
    tags: string[];
    theme: string;
    rarity_levels: string[];
    utility: string[];
    perks: string[];
  };
}

export interface NFTToken {
  id: string;
  tokenId: string;
  contractAddress: string;
  chainId: number;
  collectionId: string;
  name: string;
  description: string;
  image: string;
  imageUrl: string;
  animationUrl?: string;
  metadata: NFTMetadata;
  attributes: NFTAttribute[];
  rarity: {
    rank: number;
    score: number;
    level: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  };
  owner: string;
  creator: string;
  createdAt: string;
  mintedAt: string;
  lastSale?: {
    price: string;
    currency: string;
    timestamp: string;
    from: string;
    to: string;
    transactionHash: string;
  };
  currentListing?: {
    price: string;
    currency: string;
    marketplace: string;
    expiresAt: string;
    seller: string;
  };
  priceHistory: {
    price: string;
    currency: string;
    timestamp: string;
    event: 'mint' | 'sale' | 'transfer' | 'list' | 'delist';
  }[];
  transferHistory: {
    from: string;
    to: string;
    timestamp: string;
    transactionHash: string;
    price?: string;
    currency?: string;
  }[];
  streamData?: {
    streamId: string;
    streamTitle: string;
    streamerName: string;
    platform: string;
    timestamp: number;
    duration: number;
    clipUrl?: string;
    thumbnailUrl?: string;
    category: string;
    viewerCount: number;
    highlights: string[];
  };
  utilityFeatures: {
    hasVotingPower: boolean;
    hasExclusiveAccess: boolean;
    hasRewards: boolean;
    hasStaking: boolean;
    hasGovernance: boolean;
    customPerks: string[];
  };
  isVerified: boolean;
  isReported: boolean;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  commentCount: number;
}

export interface NFTMarketplace {
  id: string;
  name: string;
  url: string;
  logo: string;
  description: string;
  supportedChains: number[];
  fees: {
    listing: number;
    transaction: number;
    royalty: number;
  };
  features: string[];
  isActive: boolean;
  apiEndpoint?: string;
  contractAddress?: string;
}

export interface NFTCreationRequest {
  name: string;
  description: string;
  image: File | string;
  animation?: File | string;
  attributes: NFTAttribute[];
  collectionId: string;
  royaltyPercentage: number;
  mintPrice?: string;
  maxSupply?: number;
  unlockableContent?: string;
  streamData?: {
    streamId: string;
    clipId?: string;
    timestamp?: number;
    highlights?: string[];
  };
  utilityFeatures?: {
    votingPower?: boolean;
    exclusiveAccess?: boolean;
    rewards?: boolean;
    staking?: boolean;
    governance?: boolean;
    customPerks?: string[];
  };
}

export interface NFTTransferRequest {
  tokenId: string;
  contractAddress: string;
  to: string;
  chainId: number;
  gasLimit?: string;
  gasPrice?: string;
}

export interface NFTListingRequest {
  tokenId: string;
  contractAddress: string;
  price: string;
  currency: 'ETH' | 'MATIC' | 'BNB' | 'AVAX' | 'FTM';
  marketplace: string;
  duration: number; // in days
  chainId: number;
}

export interface StreamHighlightNFT {
  id: string;
  streamId: string;
  clipId: string;
  timestamp: number;
  duration: number;
  title: string;
  description: string;
  streamerName: string;
  platform: string;
  category: string;
  thumbnailUrl: string;
  videoUrl: string;
  viewerCount: number;
  chatHighlights: string[];
  gameData?: {
    title: string;
    achievement?: string;
    score?: number;
    level?: string;
  };
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  rarityFactors: {
    viewerCount: number;
    clipLength: number;
    chatActivity: number;
    gameAchievement: boolean;
    firstTime: boolean;
    specialEvent: boolean;
  };
  mintingOptions: {
    autoMint: boolean;
    threshold: number;
    royaltyToStreamer: number;
    royaltyToViewer: number;
  };
}

class NFTService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.streammulti.com';
  private readonly ipfsGateway = 'https://ipfs.io/ipfs/';
  private readonly pinataApiKey = process.env.EXPO_PUBLIC_PINATA_API_KEY || '';
  private collections: Map<string, NFTCollection> = new Map();
  private tokens: Map<string, NFTToken> = new Map();
  private marketplaces: Map<string, NFTMarketplace> = new Map();
  private streamHighlights: Map<string, StreamHighlightNFT> = new Map();

  // Standard NFT Contract ABIs
  private readonly ERC721_ABI = [
    'function mint(address to, uint256 tokenId, string memory uri) public',
    'function burn(uint256 tokenId) public',
    'function tokenURI(uint256 tokenId) public view returns (string memory)',
    'function ownerOf(uint256 tokenId) public view returns (address)',
    'function balanceOf(address owner) public view returns (uint256)',
    'function transferFrom(address from, address to, uint256 tokenId) public',
    'function safeTransferFrom(address from, address to, uint256 tokenId) public',
    'function approve(address to, uint256 tokenId) public',
    'function setApprovalForAll(address operator, bool approved) public',
    'function getApproved(uint256 tokenId) public view returns (address)',
    'function isApprovedForAll(address owner, address operator) public view returns (bool)',
    'function totalSupply() public view returns (uint256)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256)',
    'function tokenByIndex(uint256 index) public view returns (uint256)',
    'function setTokenRoyalty(uint256 tokenId, address recipient, uint96 feeNumerator) public',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
    'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
  ];

  private readonly ERC1155_ABI = [
    'function mint(address to, uint256 id, uint256 amount, bytes memory data) public',
    'function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public',
    'function burn(address from, uint256 id, uint256 amount) public',
    'function burnBatch(address from, uint256[] memory ids, uint256[] memory amounts) public',
    'function balanceOf(address account, uint256 id) public view returns (uint256)',
    'function balanceOfBatch(address[] memory accounts, uint256[] memory ids) public view returns (uint256[] memory)',
    'function setApprovalForAll(address operator, bool approved) public',
    'function isApprovedForAll(address account, address operator) public view returns (bool)',
    'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) public',
    'function safeBatchTransferFrom(address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public',
    'function uri(uint256 id) public view returns (string memory)',
    'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
    'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
    'event ApprovalForAll(address indexed account, address indexed operator, bool approved)',
    'event URI(string value, uint256 indexed id)',
  ];

  constructor() {
    this.initializeMarketplaces();
    this.setupStreamHighlightMonitoring();
    console.log('🎨 NFT Service initialized with multi-chain support');
  }

  private initializeMarketplaces(): void {
    const supportedMarketplaces: NFTMarketplace[] = [
      {
        id: 'opensea',
        name: 'OpenSea',
        url: 'https://opensea.io',
        logo: '/assets/marketplaces/opensea.png',
        description: 'The largest NFT marketplace',
        supportedChains: [1, 137, 42161, 10],
        fees: { listing: 0, transaction: 2.5, royalty: 10 },
        features: ['auctions', 'fixed-price', 'offers', 'bundles'],
        isActive: true,
        apiEndpoint: 'https://api.opensea.io/api/v1',
      },
      {
        id: 'rarible',
        name: 'Rarible',
        url: 'https://rarible.com',
        logo: '/assets/marketplaces/rarible.png',
        description: 'Community-owned NFT marketplace',
        supportedChains: [1, 137, 43114],
        fees: { listing: 0, transaction: 2.5, royalty: 10 },
        features: ['auctions', 'fixed-price', 'offers', 'lazy-minting'],
        isActive: true,
        apiEndpoint: 'https://api.rarible.org/v0.1',
      },
      {
        id: 'foundation',
        name: 'Foundation',
        url: 'https://foundation.app',
        logo: '/assets/marketplaces/foundation.png',
        description: 'Curated NFT marketplace for creators',
        supportedChains: [1],
        fees: { listing: 0, transaction: 15, royalty: 10 },
        features: ['auctions', 'reserve-auctions', 'curation'],
        isActive: true,
      },
      {
        id: 'superrare',
        name: 'SuperRare',
        url: 'https://superrare.com',
        logo: '/assets/marketplaces/superrare.png',
        description: 'Digital art marketplace',
        supportedChains: [1],
        fees: { listing: 0, transaction: 15, royalty: 10 },
        features: ['auctions', 'fixed-price', 'social-features'],
        isActive: true,
      },
      {
        id: 'streammulti-marketplace',
        name: 'StreamMulti Marketplace',
        url: 'https://marketplace.streammulti.com',
        logo: '/assets/marketplaces/streammulti.png',
        description: 'Dedicated marketplace for stream-related NFTs',
        supportedChains: [1, 137, 56, 43114, 250, 42161, 10],
        fees: { listing: 0, transaction: 2, royalty: 10 },
        features: ['stream-highlights', 'creator-cards', 'exclusive-content', 'staking'],
        isActive: true,
        apiEndpoint: 'https://api.streammulti.com/nft',
        contractAddress: '0x1234567890123456789012345678901234567890',
      },
    ];

    supportedMarketplaces.forEach(marketplace => {
      this.marketplaces.set(marketplace.id, marketplace);
    });
  }

  private setupStreamHighlightMonitoring(): void {
    // Monitor stream analytics for potential NFT-worthy highlights
    setInterval(async () => {
      await this.detectStreamHighlights();
    }, 60000); // Check every minute

    console.log('📺 Stream highlight monitoring initialized');
  }

  // Collection Management
  public async createCollection(params: {
    name: string;
    symbol: string;
    description: string;
    image: File | string;
    banner?: File | string;
    category: NFTCollection['category'];
    maxSupply?: number;
    mintPrice: string;
    royaltyPercentage: number;
    chainId: number;
  }): Promise<NFTCollection | null> {
    console.log(`🔄 Creating NFT collection: ${params.name}`);

    try {
      if (!blockchainService.isWalletConnected()) {
        throw new Error('Wallet not connected');
      }

      const wallet = blockchainService.getCurrentWallet();
      if (!wallet) {
        throw new Error('No wallet available');
      }

      // Upload images to IPFS
      const imageUrl = await this.uploadToIPFS(params.image);
      const bannerUrl = params.banner ? await this.uploadToIPFS(params.banner) : undefined;

      // Deploy NFT contract
      const contractData = await this.deployNFTContract({
        name: params.name,
        symbol: params.symbol,
        maxSupply: params.maxSupply,
        mintPrice: params.mintPrice,
        royaltyPercentage: params.royaltyPercentage,
        chainId: params.chainId,
      });

      if (!contractData) {
        throw new Error('Failed to deploy NFT contract');
      }

      const collection: NFTCollection = {
        id: `collection-${Date.now()}`,
        name: params.name,
        symbol: params.symbol,
        description: params.description,
        image: imageUrl,
        banner_image: bannerUrl,
        category: params.category,
        contractAddress: contractData.address,
        chainId: params.chainId,
        creatorAddress: wallet.address,
        creatorName: wallet.metadata.name || 'Unknown',
        totalSupply: 0,
        maxSupply: params.maxSupply,
        mintPrice: params.mintPrice,
        royaltyPercentage: params.royaltyPercentage,
        isVerified: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          totalVolume: '0',
          floorPrice: '0',
          avgPrice: '0',
          ownersCount: 0,
          listedCount: 0,
          totalSales: 0,
        },
        socialLinks: {},
        metadata: {
          tags: [],
          theme: 'streaming',
          rarity_levels: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
          utility: [],
          perks: [],
        },
      };

      this.collections.set(collection.id, collection);

      // Save to backend
      await this.saveCollection(collection);

      console.log(`✅ NFT collection created: ${collection.name}`);
      
      // Track analytics
      await analyticsService.updateViewerActivity(wallet.address, {
        type: 'nft_collection_created',
        metadata: {
          collectionId: collection.id,
          name: collection.name,
          category: collection.category,
          chainId: collection.chainId,
          contractAddress: collection.contractAddress,
        },
      });

      return collection;
    } catch (error) {
      console.error('❌ Failed to create NFT collection:', error);
      return null;
    }
  }

  public async getCollection(id: string): Promise<NFTCollection | null> {
    const cached = this.collections.get(id);
    if (cached) {
      return cached;
    }

    try {
      const collection = await this.fetchCollection(id);
      if (collection) {
        this.collections.set(id, collection);
      }
      return collection;
    } catch (error) {
      console.error('❌ Failed to fetch collection:', error);
      return null;
    }
  }

  public async getCollections(filters?: {
    creator?: string;
    category?: string;
    chainId?: number;
    limit?: number;
    offset?: number;
  }): Promise<NFTCollection[]> {
    try {
      const collections = await this.fetchCollections(filters);
      collections.forEach(collection => {
        this.collections.set(collection.id, collection);
      });
      return collections;
    } catch (error) {
      console.error('❌ Failed to fetch collections:', error);
      return [];
    }
  }

  // NFT Minting
  public async mintNFT(params: NFTCreationRequest): Promise<NFTToken | null> {
    console.log(`🔄 Minting NFT: ${params.name}`);

    try {
      if (!blockchainService.isWalletConnected()) {
        throw new Error('Wallet not connected');
      }

      const wallet = blockchainService.getCurrentWallet();
      const collection = await this.getCollection(params.collectionId);
      
      if (!wallet || !collection) {
        throw new Error('Wallet or collection not available');
      }

      // Upload image and animation to IPFS
      const imageUrl = await this.uploadToIPFS(params.image);
      const animationUrl = params.animation ? await this.uploadToIPFS(params.animation) : undefined;

      // Create metadata
      const metadata: NFTMetadata = {
        name: params.name,
        description: params.description,
        image: imageUrl,
        animation_url: animationUrl,
        attributes: params.attributes,
        properties: {
          category: collection.category,
          rarity: this.calculateRarity(params.attributes),
          collection: collection.name,
          creator: wallet.address,
          createdAt: new Date().toISOString(),
          streamId: params.streamData?.streamId,
          clipId: params.streamData?.clipId,
          timestamp: params.streamData?.timestamp,
        },
      };

      // Upload metadata to IPFS
      const metadataUrl = await this.uploadToIPFS(JSON.stringify(metadata));

      // Generate token ID
      const tokenId = `${collection.totalSupply + 1}`;

      // Mint NFT on blockchain
      const mintResult = await this.mintOnBlockchain({
        contractAddress: collection.contractAddress,
        tokenId,
        metadataUrl,
        to: wallet.address,
        chainId: collection.chainId,
      });

      if (!mintResult) {
        throw new Error('Failed to mint NFT on blockchain');
      }

      const nftToken: NFTToken = {
        id: `${collection.contractAddress}-${tokenId}`,
        tokenId,
        contractAddress: collection.contractAddress,
        chainId: collection.chainId,
        collectionId: collection.id,
        name: params.name,
        description: params.description,
        image: imageUrl,
        imageUrl,
        animationUrl,
        metadata,
        attributes: params.attributes,
        rarity: {
          rank: 0,
          score: 0,
          level: this.calculateRarity(params.attributes),
        },
        owner: wallet.address,
        creator: wallet.address,
        createdAt: new Date().toISOString(),
        mintedAt: new Date().toISOString(),
        priceHistory: [{
          price: params.mintPrice || '0',
          currency: 'ETH',
          timestamp: new Date().toISOString(),
          event: 'mint',
        }],
        transferHistory: [],
        streamData: params.streamData ? {
          streamId: params.streamData.streamId,
          streamTitle: 'Stream Title',
          streamerName: 'Streamer Name',
          platform: 'twitch',
          timestamp: params.streamData.timestamp || Date.now(),
          duration: 0,
          clipUrl: params.streamData.clipId,
          category: 'gaming',
          viewerCount: 0,
          highlights: params.streamData.highlights || [],
        } : undefined,
        utilityFeatures: {
          hasVotingPower: params.utilityFeatures?.votingPower || false,
          hasExclusiveAccess: params.utilityFeatures?.exclusiveAccess || false,
          hasRewards: params.utilityFeatures?.rewards || false,
          hasStaking: params.utilityFeatures?.staking || false,
          hasGovernance: params.utilityFeatures?.governance || false,
          customPerks: params.utilityFeatures?.customPerks || [],
        },
        isVerified: false,
        isReported: false,
        viewCount: 0,
        likeCount: 0,
        shareCount: 0,
        commentCount: 0,
      };

      this.tokens.set(nftToken.id, nftToken);

      // Update collection stats
      collection.totalSupply++;
      collection.updatedAt = new Date().toISOString();
      this.collections.set(collection.id, collection);

      // Save to backend
      await this.saveNFT(nftToken);

      console.log(`✅ NFT minted: ${nftToken.name}`);

      // Send notification
      await notificationService.showNotification({
        id: `nft-minted-${nftToken.id}`,
        title: 'NFT Minted Successfully',
        body: `Your NFT "${nftToken.name}" has been minted!`,
        category: 'system',
        image: nftToken.imageUrl,
      });

      // Track analytics
      await analyticsService.updateViewerActivity(wallet.address, {
        type: 'nft_minted',
        metadata: {
          tokenId: nftToken.tokenId,
          collectionId: collection.id,
          name: nftToken.name,
          rarity: nftToken.rarity.level,
          chainId: collection.chainId,
          streamId: params.streamData?.streamId,
        },
      });

      return nftToken;
    } catch (error) {
      console.error('❌ Failed to mint NFT:', error);
      return null;
    }
  }

  public async batchMintNFTs(params: {
    collectionId: string;
    nfts: Omit<NFTCreationRequest, 'collectionId'>[];
    chainId: number;
  }): Promise<NFTToken[]> {
    console.log(`🔄 Batch minting ${params.nfts.length} NFTs`);

    const results: NFTToken[] = [];

    for (const nftData of params.nfts) {
      const nft = await this.mintNFT({
        ...nftData,
        collectionId: params.collectionId,
      });

      if (nft) {
        results.push(nft);
      }
    }

    console.log(`✅ Batch minted ${results.length}/${params.nfts.length} NFTs`);
    return results;
  }

  // NFT Transfer and Trading
  public async transferNFT(params: NFTTransferRequest): Promise<boolean> {
    console.log(`🔄 Transferring NFT: ${params.tokenId}`);

    try {
      if (!blockchainService.isWalletConnected()) {
        throw new Error('Wallet not connected');
      }

      const result = await blockchainService.callContract({
        address: params.contractAddress,
        abi: this.ERC721_ABI,
        functionName: 'transferFrom',
        functionParams: [
          blockchainService.getCurrentWallet()?.address,
          params.to,
          params.tokenId,
        ],
        gasLimit: params.gasLimit,
        gasPrice: params.gasPrice,
      });

      if (result) {
        const nft = this.tokens.get(`${params.contractAddress}-${params.tokenId}`);
        if (nft) {
          nft.owner = params.to;
          nft.transferHistory.push({
            from: blockchainService.getCurrentWallet()?.address || '',
            to: params.to,
            timestamp: new Date().toISOString(),
            transactionHash: result.hash || '',
          });
          this.tokens.set(nft.id, nft);
        }

        console.log(`✅ NFT transferred: ${params.tokenId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Failed to transfer NFT:', error);
      return false;
    }
  }

  public async listNFT(params: NFTListingRequest): Promise<boolean> {
    console.log(`🔄 Listing NFT: ${params.tokenId} for ${params.price} ${params.currency}`);

    try {
      const marketplace = this.marketplaces.get(params.marketplace);
      if (!marketplace) {
        throw new Error('Marketplace not supported');
      }

      const nft = this.tokens.get(`${params.contractAddress}-${params.tokenId}`);
      if (!nft) {
        throw new Error('NFT not found');
      }

      // List on marketplace (implementation depends on marketplace)
      const listing = await this.listOnMarketplace(params, marketplace);
      
      if (listing) {
        nft.currentListing = {
          price: params.price,
          currency: params.currency,
          marketplace: params.marketplace,
          expiresAt: new Date(Date.now() + params.duration * 24 * 60 * 60 * 1000).toISOString(),
          seller: blockchainService.getCurrentWallet()?.address || '',
        };
        this.tokens.set(nft.id, nft);

        console.log(`✅ NFT listed: ${params.tokenId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Failed to list NFT:', error);
      return false;
    }
  }

  // Stream Highlight NFTs
  public async detectStreamHighlights(): Promise<void> {
    try {
      // Get current active streams
      const activeStreams = await this.getCurrentActiveStreams();
      
      for (const stream of activeStreams) {
        const metrics = await analyticsService.getRealTimeMetrics(stream.id);
        
        if (metrics && this.isHighlightWorthy(metrics)) {
          await this.createStreamHighlight(stream, metrics);
        }
      }
    } catch (error) {
      console.error('❌ Failed to detect stream highlights:', error);
    }
  }

  private isHighlightWorthy(metrics: any): boolean {
    // Define criteria for highlight-worthy moments
    const criteria = {
      viewerSpike: metrics.currentViewers > metrics.peakViewers * 1.5,
      chatSpike: metrics.chatRate > 100, // messages per minute
      newFollowers: metrics.newFollowers > 50,
      donations: metrics.donationCount > 5,
      clips: metrics.clipCount > 10,
      engagement: metrics.engagement > 0.8,
    };

    // Must meet at least 2 criteria
    const metCriteria = Object.values(criteria).filter(Boolean).length;
    return metCriteria >= 2;
  }

  private async createStreamHighlight(stream: any, metrics: any): Promise<void> {
    const highlight: StreamHighlightNFT = {
      id: `highlight-${stream.id}-${Date.now()}`,
      streamId: stream.id,
      clipId: `clip-${Date.now()}`,
      timestamp: Date.now(),
      duration: 60, // 1 minute highlight
      title: `Epic Moment - ${stream.title}`,
      description: `An epic moment from ${stream.streamerName}'s stream!`,
      streamerName: stream.streamerName,
      platform: stream.platform,
      category: stream.category,
      thumbnailUrl: stream.thumbnailUrl,
      videoUrl: '', // Would be generated from clip
      viewerCount: metrics.currentViewers,
      chatHighlights: [],
      rarity: this.calculateStreamRarity(metrics),
      rarityFactors: {
        viewerCount: metrics.currentViewers,
        clipLength: 60,
        chatActivity: metrics.chatRate,
        gameAchievement: false,
        firstTime: false,
        specialEvent: false,
      },
      mintingOptions: {
        autoMint: true,
        threshold: 1000, // viewer threshold
        royaltyToStreamer: 70,
        royaltyToViewer: 30,
      },
    };

    this.streamHighlights.set(highlight.id, highlight);

    // Auto-mint if enabled and threshold met
    if (highlight.mintingOptions.autoMint && metrics.currentViewers >= highlight.mintingOptions.threshold) {
      await this.autoMintStreamHighlight(highlight);
    }
  }

  private calculateStreamRarity(metrics: any): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' {
    const score = 
      (metrics.currentViewers / 1000) * 0.3 +
      (metrics.chatRate / 100) * 0.2 +
      (metrics.newFollowers / 50) * 0.2 +
      (metrics.donationCount / 10) * 0.2 +
      (metrics.engagement) * 0.1;

    if (score >= 4) return 'legendary';
    if (score >= 3) return 'epic';
    if (score >= 2) return 'rare';
    if (score >= 1) return 'uncommon';
    return 'common';
  }

  private async autoMintStreamHighlight(highlight: StreamHighlightNFT): Promise<void> {
    try {
      console.log(`🔄 Auto-minting stream highlight: ${highlight.title}`);

      // Find or create stream highlights collection
      const collection = await this.getOrCreateStreamHighlightsCollection(highlight.platform);
      
      if (!collection) {
        throw new Error('Failed to get stream highlights collection');
      }

      // Create NFT for highlight
      const nft = await this.mintNFT({
        name: highlight.title,
        description: highlight.description,
        image: highlight.thumbnailUrl,
        animation: highlight.videoUrl,
        attributes: [
          { trait_type: 'Platform', value: highlight.platform },
          { trait_type: 'Streamer', value: highlight.streamerName },
          { trait_type: 'Category', value: highlight.category },
          { trait_type: 'Rarity', value: highlight.rarity },
          { trait_type: 'Viewer Count', value: highlight.viewerCount, display_type: 'number' },
          { trait_type: 'Duration', value: highlight.duration, display_type: 'number' },
          { trait_type: 'Timestamp', value: highlight.timestamp, display_type: 'date' },
        ],
        collectionId: collection.id,
        royaltyPercentage: 10,
        streamData: {
          streamId: highlight.streamId,
          clipId: highlight.clipId,
          timestamp: highlight.timestamp,
          highlights: highlight.chatHighlights,
        },
        utilityFeatures: {
          exclusiveAccess: true,
          rewards: true,
          customPerks: [`Access to ${highlight.streamerName}'s VIP chat`],
        },
      });

      if (nft) {
        console.log(`✅ Stream highlight NFT minted: ${nft.name}`);
        
        // Notify relevant users
        await notificationService.showNotification({
          id: `highlight-minted-${nft.id}`,
          title: 'Epic Moment Captured!',
          body: `A legendary moment from ${highlight.streamerName}'s stream has been immortalized as an NFT!`,
          category: 'stream',
          image: nft.imageUrl,
        });
      }
    } catch (error) {
      console.error('❌ Failed to auto-mint stream highlight:', error);
    }
  }

  private async getOrCreateStreamHighlightsCollection(platform: string): Promise<NFTCollection | null> {
    // Look for existing collection
    const collections = await this.getCollections({
      category: 'stream-highlights',
      limit: 1,
    });

    if (collections.length > 0) {
      return collections[0];
    }

    // Create new collection
    return await this.createCollection({
      name: 'Stream Highlights',
      symbol: 'HIGHLIGHTS',
      description: 'Epic moments from live streams, captured as NFTs',
      image: '/assets/collections/stream-highlights.png',
      banner: '/assets/collections/stream-highlights-banner.png',
      category: 'stream-highlights',
      mintPrice: '0.01',
      royaltyPercentage: 10,
      chainId: 137, // Polygon for low fees
    });
  }

  // Utility Methods
  private async uploadToIPFS(data: File | string): Promise<string> {
    try {
      let formData = new FormData();
      
      if (typeof data === 'string') {
        formData.append('file', new Blob([data], { type: 'application/json' }));
      } else {
        formData.append('file', data);
      }

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.pinataApiKey}`,
        },
        body: formData,
      });

      const result = await response.json();
      return `${this.ipfsGateway}${result.IpfsHash}`;
    } catch (error) {
      console.error('❌ Failed to upload to IPFS:', error);
      throw error;
    }
  }

  private async deployNFTContract(params: {
    name: string;
    symbol: string;
    maxSupply?: number;
    mintPrice: string;
    royaltyPercentage: number;
    chainId: number;
  }): Promise<{ address: string } | null> {
    try {
      // This would deploy a custom NFT contract
      // For now, we'll use a mock deployment
      const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
      
      console.log(`✅ NFT contract deployed: ${mockAddress}`);
      return { address: mockAddress };
    } catch (error) {
      console.error('❌ Failed to deploy NFT contract:', error);
      return null;
    }
  }

  private async mintOnBlockchain(params: {
    contractAddress: string;
    tokenId: string;
    metadataUrl: string;
    to: string;
    chainId: number;
  }): Promise<any> {
    try {
      const result = await blockchainService.callContract({
        address: params.contractAddress,
        abi: this.ERC721_ABI,
        functionName: 'mint',
        functionParams: [params.to, params.tokenId, params.metadataUrl],
      });

      return result;
    } catch (error) {
      console.error('❌ Failed to mint on blockchain:', error);
      return null;
    }
  }

  private calculateRarity(attributes: NFTAttribute[]): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' {
    // Simple rarity calculation based on attribute count and values
    const score = attributes.length * 0.2 + Math.random() * 0.8;
    
    if (score >= 0.9) return 'legendary';
    if (score >= 0.7) return 'epic';
    if (score >= 0.5) return 'rare';
    if (score >= 0.3) return 'uncommon';
    return 'common';
  }

  private async listOnMarketplace(params: NFTListingRequest, marketplace: NFTMarketplace): Promise<any> {
    try {
      // Implementation would depend on specific marketplace API
      // For now, we'll return a mock listing
      return {
        id: `listing-${Date.now()}`,
        tokenId: params.tokenId,
        price: params.price,
        currency: params.currency,
        marketplace: marketplace.name,
        status: 'active',
      };
    } catch (error) {
      console.error('❌ Failed to list on marketplace:', error);
      return null;
    }
  }

  private async getCurrentActiveStreams(): Promise<any[]> {
    // This would integrate with your streaming service
    // For now, return empty array
    return [];
  }

  private async saveCollection(collection: NFTCollection): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/nft/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(collection),
      });
    } catch (error) {
      console.error('❌ Failed to save collection:', error);
    }
  }

  private async saveNFT(nft: NFTToken): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/nft/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nft),
      });
    } catch (error) {
      console.error('❌ Failed to save NFT:', error);
    }
  }

  private async fetchCollection(id: string): Promise<NFTCollection | null> {
    try {
      const response = await fetch(`${this.baseUrl}/nft/collections/${id}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to fetch collection:', error);
      return null;
    }
  }

  private async fetchCollections(filters?: any): Promise<NFTCollection[]> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
      }

      const response = await fetch(`${this.baseUrl}/nft/collections?${params.toString()}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('❌ Failed to fetch collections:', error);
      return [];
    }
  }

  // Public API Methods
  public async getOwnedNFTs(owner: string, chainId?: number): Promise<NFTToken[]> {
    try {
      const params = new URLSearchParams({ owner });
      if (chainId) params.append('chainId', chainId.toString());

      const response = await fetch(`${this.baseUrl}/nft/tokens?${params.toString()}`);
      if (response.ok) {
        const tokens = await response.json();
        tokens.forEach((token: NFTToken) => {
          this.tokens.set(token.id, token);
        });
        return tokens;
      }
      return [];
    } catch (error) {
      console.error('❌ Failed to fetch owned NFTs:', error);
      return [];
    }
  }

  public async searchNFTs(query: string, filters?: {
    category?: string;
    rarity?: string;
    platform?: string;
    priceRange?: { min: string; max: string };
    sortBy?: 'price' | 'rarity' | 'recent' | 'popular';
  }): Promise<NFTToken[]> {
    try {
      const params = new URLSearchParams({ q: query });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            if (key === 'priceRange') {
              params.append('minPrice', (value as any).min);
              params.append('maxPrice', (value as any).max);
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      const response = await fetch(`${this.baseUrl}/nft/search?${params.toString()}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('❌ Failed to search NFTs:', error);
      return [];
    }
  }

  public getSupportedMarketplaces(): NFTMarketplace[] {
    return Array.from(this.marketplaces.values()).filter(m => m.isActive);
  }

  public getStreamHighlights(): StreamHighlightNFT[] {
    return Array.from(this.streamHighlights.values());
  }
}

export const nftService = new NFTService();
export default nftService;