// Decentralized Storage Service with IPFS Integration
import { blockchainService } from './blockchainService';
import { analyticsService } from './analyticsService';
import { notificationService } from './notificationService';

export interface StorageProvider {
  id: string;
  name: string;
  type: 'ipfs' | 'arweave' | 'filecoin' | 'storj' | 'sia' | 'swarm';
  endpoint: string;
  apiKey?: string;
  isActive: boolean;
  features: string[];
  pricing: {
    storage: string; // per GB per month
    bandwidth: string; // per GB
    requests: string; // per 1000 requests
  };
  performance: {
    averageUploadTime: number; // seconds
    averageDownloadTime: number; // seconds
    reliability: number; // percentage
    uptime: number; // percentage
  };
  limits: {
    maxFileSize: string; // in bytes
    maxStoragePerUser: string; // in bytes
    rateLimit: number; // requests per minute
  };
  configuration: {
    encryption: boolean;
    compression: boolean;
    redundancy: number; // number of copies
    pinning: boolean;
    gateway: string;
  };
}

export interface StorageFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  hash: string;
  cid: string; // Content Identifier
  provider: string;
  uploadedBy: string;
  uploadedAt: string;
  lastAccessed: string;
  accessCount: number;
  isPublic: boolean;
  isPinned: boolean;
  isEncrypted: boolean;
  encryptionKey?: string;
  metadata: {
    description?: string;
    tags: string[];
    category: 'video' | 'audio' | 'image' | 'document' | 'nft' | 'stream' | 'other';
    streamId?: string;
    clipId?: string;
    creatorId?: string;
    duration?: number; // for media files
    resolution?: string; // for video/images
    bitrate?: number; // for media files
    codec?: string; // for media files
    thumbnailHash?: string;
    previewHash?: string;
  };
  sharing: {
    isShared: boolean;
    shareKey?: string;
    expiresAt?: string;
    allowedUsers: string[];
    downloadCount: number;
    maxDownloads?: number;
  };
  backup: {
    providers: string[]; // Additional providers for redundancy
    lastBackup: string;
    backupCount: number;
    isVerified: boolean;
  };
  economics: {
    storageCost: string;
    bandwidthCost: string;
    totalCost: string;
    currency: string;
    isPaid: boolean;
  };
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  totalCost: string;
  currency: string;
  breakdown: {
    byType: { [mimeType: string]: { count: number; size: number } };
    byProvider: { [provider: string]: { count: number; size: number; cost: string } };
    byUser: { [userId: string]: { count: number; size: number; cost: string } };
    byCategory: { [category: string]: { count: number; size: number } };
  };
  performance: {
    averageUploadTime: number;
    averageDownloadTime: number;
    successRate: number;
    errorRate: number;
  };
  usage: {
    dailyUploads: number;
    dailyDownloads: number;
    bandwidthUsed: number;
    storageUsed: number;
    activeFiles: number;
  };
}

export interface IPFSNode {
  id: string;
  addresses: string[];
  agentVersion: string;
  protocolVersion: string;
  publicKey: string;
  isOnline: boolean;
  peers: number;
  bandwidth: {
    totalIn: number;
    totalOut: number;
    rateIn: number;
    rateOut: number;
  };
  storage: {
    repoSize: number;
    storageMax: number;
    numObjects: number;
  };
  location?: {
    country: string;
    region: string;
    city: string;
  };
}

export interface PinningService {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  isActive: boolean;
  limits: {
    maxPins: number;
    maxSize: string;
    bandwidth: string;
  };
  pricing: {
    baseFee: string;
    perGB: string;
    currency: string;
  };
  features: string[];
}

export interface BackupStrategy {
  id: string;
  name: string;
  description: string;
  providers: string[];
  redundancy: number;
  isAutomatic: boolean;
  schedule: {
    frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
    time?: string;
    days?: string[];
  };
  rules: {
    minFileSize: number;
    maxFileSize: number;
    categories: string[];
    excludeTemporary: boolean;
    priority: 'low' | 'medium' | 'high';
  };
  verification: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    checksumValidation: boolean;
    contentValidation: boolean;
  };
  costs: {
    estimated: string;
    actual: string;
    currency: string;
  };
}

class DecentralizedStorageService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.streammulti.com';
  private readonly ipfsApiUrl = process.env.EXPO_PUBLIC_IPFS_API_URL || 'https://ipfs.infura.io:5001/api/v0';
  private readonly ipfsGateway = process.env.EXPO_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
  private readonly pinataApiKey = process.env.EXPO_PUBLIC_PINATA_API_KEY || '';
  private readonly pinataSecretKey = process.env.EXPO_PUBLIC_PINATA_SECRET_KEY || '';
  
  private providers: Map<string, StorageProvider> = new Map();
  private files: Map<string, StorageFile> = new Map();
  private nodes: Map<string, IPFSNode> = new Map();
  private pinningServices: Map<string, PinningService> = new Map();
  private backupStrategies: Map<string, BackupStrategy> = new Map();
  private uploadQueue: StorageFile[] = [];
  private downloadCache: Map<string, { data: Blob; timestamp: number }> = new Map();
  private readonly cacheTimeout = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.initializeProviders();
    this.initializePinningServices();
    this.initializeBackupStrategies();
    this.startBackgroundTasks();
    console.log('📁 Decentralized Storage Service initialized');
  }

  private initializeProviders(): void {
    const providers: StorageProvider[] = [
      {
        id: 'ipfs-pinata',
        name: 'Pinata (IPFS)',
        type: 'ipfs',
        endpoint: 'https://api.pinata.cloud',
        apiKey: this.pinataApiKey,
        isActive: true,
        features: ['Pinning', 'Gateway', 'Analytics', 'Metadata'],
        pricing: {
          storage: '0.20', // $0.20 per GB per month
          bandwidth: '0.10', // $0.10 per GB
          requests: '0.001', // $0.001 per 1000 requests
        },
        performance: {
          averageUploadTime: 5,
          averageDownloadTime: 2,
          reliability: 99.9,
          uptime: 99.95,
        },
        limits: {
          maxFileSize: '104857600', // 100MB
          maxStoragePerUser: '10737418240', // 10GB
          rateLimit: 180, // 180 requests per minute
        },
        configuration: {
          encryption: false,
          compression: true,
          redundancy: 3,
          pinning: true,
          gateway: this.ipfsGateway,
        },
      },
      {
        id: 'ipfs-infura',
        name: 'Infura (IPFS)',
        type: 'ipfs',
        endpoint: 'https://ipfs.infura.io:5001',
        isActive: true,
        features: ['API Access', 'Gateway', 'Dedicated Nodes'],
        pricing: {
          storage: '0.00', // Free tier
          bandwidth: '0.00',
          requests: '0.00',
        },
        performance: {
          averageUploadTime: 3,
          averageDownloadTime: 1,
          reliability: 99.8,
          uptime: 99.9,
        },
        limits: {
          maxFileSize: '52428800', // 50MB
          maxStoragePerUser: '5368709120', // 5GB
          rateLimit: 100,
        },
        configuration: {
          encryption: false,
          compression: false,
          redundancy: 1,
          pinning: false,
          gateway: 'https://infura-ipfs.io/ipfs/',
        },
      },
      {
        id: 'arweave',
        name: 'Arweave',
        type: 'arweave',
        endpoint: 'https://arweave.net',
        isActive: true,
        features: ['Permanent Storage', 'SmartWeave', 'GraphQL', 'Atomic NFTs'],
        pricing: {
          storage: '2.50', // One-time fee per MB
          bandwidth: '0.00',
          requests: '0.00',
        },
        performance: {
          averageUploadTime: 10,
          averageDownloadTime: 3,
          reliability: 99.5,
          uptime: 99.8,
        },
        limits: {
          maxFileSize: '10485760000', // 10GB
          maxStoragePerUser: '1099511627776', // 1TB
          rateLimit: 60,
        },
        configuration: {
          encryption: true,
          compression: true,
          redundancy: 200, // Arweave's high redundancy
          pinning: true,
          gateway: 'https://arweave.net/',
        },
      },
      {
        id: 'filecoin',
        name: 'Filecoin',
        type: 'filecoin',
        endpoint: 'https://api.filecoin.io',
        isActive: true,
        features: ['Decentralized Market', 'Proof of Storage', 'Retrieval Market'],
        pricing: {
          storage: '0.05', // Variable market pricing
          bandwidth: '0.02',
          requests: '0.0001',
        },
        performance: {
          averageUploadTime: 30,
          averageDownloadTime: 10,
          reliability: 99.0,
          uptime: 98.5,
        },
        limits: {
          maxFileSize: '1073741824000', // 1TB
          maxStoragePerUser: '107374182400000', // 100TB
          rateLimit: 30,
        },
        configuration: {
          encryption: true,
          compression: true,
          redundancy: 5,
          pinning: true,
          gateway: 'https://filecoin.io/gateway/',
        },
      },
    ];

    providers.forEach(provider => {
      this.providers.set(provider.id, provider);
    });
  }

  private initializePinningServices(): void {
    const services: PinningService[] = [
      {
        id: 'pinata',
        name: 'Pinata',
        endpoint: 'https://api.pinata.cloud',
        apiKey: this.pinataApiKey,
        isActive: true,
        limits: {
          maxPins: 1000,
          maxSize: '10737418240', // 10GB
          bandwidth: '107374182400', // 100GB per month
        },
        pricing: {
          baseFee: '20.00', // $20/month
          perGB: '0.20',
          currency: 'USD',
        },
        features: ['Dedicated Gateway', 'Analytics', 'Team Management', 'API'],
      },
      {
        id: 'temporal',
        name: 'Temporal Cloud',
        endpoint: 'https://api.temporal.cloud',
        apiKey: '',
        isActive: false,
        limits: {
          maxPins: 10000,
          maxSize: '1073741824000', // 1TB
          bandwidth: '10737418240000', // 10TB per month
        },
        pricing: {
          baseFee: '50.00',
          perGB: '0.15',
          currency: 'USD',
        },
        features: ['Enterprise Grade', 'Custom Gateways', 'SLA', 'Support'],
      },
    ];

    services.forEach(service => {
      this.pinningServices.set(service.id, service);
    });
  }

  private initializeBackupStrategies(): void {
    const strategies: BackupStrategy[] = [
      {
        id: 'basic-redundancy',
        name: 'Basic Redundancy',
        description: 'Store files on 2 different providers for basic redundancy',
        providers: ['ipfs-pinata', 'ipfs-infura'],
        redundancy: 2,
        isAutomatic: true,
        schedule: {
          frequency: 'realtime',
        },
        rules: {
          minFileSize: 0,
          maxFileSize: 52428800, // 50MB
          categories: ['image', 'document', 'nft'],
          excludeTemporary: true,
          priority: 'medium',
        },
        verification: {
          enabled: true,
          frequency: 'weekly',
          checksumValidation: true,
          contentValidation: false,
        },
        costs: {
          estimated: '0.50',
          actual: '0.00',
          currency: 'USD',
        },
      },
      {
        id: 'premium-backup',
        name: 'Premium Backup',
        description: 'Multi-provider backup with permanent storage option',
        providers: ['ipfs-pinata', 'arweave', 'filecoin'],
        redundancy: 3,
        isAutomatic: true,
        schedule: {
          frequency: 'realtime',
        },
        rules: {
          minFileSize: 1048576, // 1MB
          maxFileSize: 1073741824, // 1GB
          categories: ['video', 'audio', 'stream', 'nft'],
          excludeTemporary: false,
          priority: 'high',
        },
        verification: {
          enabled: true,
          frequency: 'daily',
          checksumValidation: true,
          contentValidation: true,
        },
        costs: {
          estimated: '5.00',
          actual: '0.00',
          currency: 'USD',
        },
      },
    ];

    strategies.forEach(strategy => {
      this.backupStrategies.set(strategy.id, strategy);
    });
  }

  private startBackgroundTasks(): void {
    // Process upload queue every 30 seconds
    setInterval(async () => {
      await this.processUploadQueue();
    }, 30000);

    // Verify file integrity every hour
    setInterval(async () => {
      await this.verifyFileIntegrity();
    }, 3600000);

    // Clean up cache every 10 minutes
    setInterval(() => {
      this.cleanupCache();
    }, 600000);

    // Update node information every 5 minutes
    setInterval(async () => {
      await this.updateNodeInformation();
    }, 300000);
  }

  // File Upload
  public async uploadFile(params: {
    file: File | Blob;
    filename: string;
    category: StorageFile['metadata']['category'];
    isPublic: boolean;
    encrypt?: boolean;
    providers?: string[];
    metadata?: Partial<StorageFile['metadata']>;
  }): Promise<StorageFile | null> {
    console.log(`🔄 Uploading file: ${params.filename}`);

    try {
      if (!blockchainService.isWalletConnected()) {
        throw new Error('Wallet not connected');
      }

      const wallet = blockchainService.getCurrentWallet();
      if (!wallet) {
        throw new Error('No wallet available');
      }

      // Validate file
      if (params.file.size === 0) {
        throw new Error('File is empty');
      }

      // Select providers
      const selectedProviders = params.providers || this.selectOptimalProviders(params.file.size, params.category);
      if (selectedProviders.length === 0) {
        throw new Error('No suitable providers available');
      }

      // Generate file hash
      const arrayBuffer = await params.file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Upload to primary provider
      const primaryProvider = selectedProviders[0];
      const uploadResult = await this.uploadToProvider(params.file, primaryProvider, {
        filename: params.filename,
        encrypt: params.encrypt || false,
      });

      if (!uploadResult) {
        throw new Error('Upload to primary provider failed');
      }

      const storageFile: StorageFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        filename: params.filename,
        originalName: params.filename,
        mimeType: params.file.type || 'application/octet-stream',
        size: params.file.size,
        hash,
        cid: uploadResult.cid,
        provider: primaryProvider,
        uploadedBy: wallet.address,
        uploadedAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        accessCount: 0,
        isPublic: params.isPublic,
        isPinned: true,
        isEncrypted: params.encrypt || false,
        encryptionKey: uploadResult.encryptionKey,
        metadata: {
          description: params.metadata?.description,
          tags: params.metadata?.tags || [],
          category: params.category,
          streamId: params.metadata?.streamId,
          clipId: params.metadata?.clipId,
          creatorId: params.metadata?.creatorId,
          duration: params.metadata?.duration,
          resolution: params.metadata?.resolution,
          bitrate: params.metadata?.bitrate,
          codec: params.metadata?.codec,
        },
        sharing: {
          isShared: params.isPublic,
          allowedUsers: [],
          downloadCount: 0,
        },
        backup: {
          providers: [primaryProvider],
          lastBackup: new Date().toISOString(),
          backupCount: 1,
          isVerified: false,
        },
        economics: {
          storageCost: '0',
          bandwidthCost: '0',
          totalCost: '0',
          currency: 'USD',
          isPaid: false,
        },
      };

      // Calculate costs
      const provider = this.providers.get(primaryProvider);
      if (provider) {
        const sizeGB = params.file.size / (1024 * 1024 * 1024);
        storageFile.economics.storageCost = (sizeGB * parseFloat(provider.pricing.storage)).toFixed(6);
        storageFile.economics.totalCost = storageFile.economics.storageCost;
      }

      this.files.set(storageFile.id, storageFile);

      // Queue for backup to additional providers
      if (selectedProviders.length > 1) {
        this.uploadQueue.push(storageFile);
      }

      // Generate thumbnail for images/videos
      if (params.category === 'image' || params.category === 'video') {
        await this.generateThumbnail(storageFile, params.file);
      }

      console.log(`✅ File uploaded: ${params.filename} (${uploadResult.cid})`);

      // Send notification
      await notificationService.showNotification({
        id: `file-uploaded-${storageFile.id}`,
        title: 'File Uploaded',
        body: `Your file "${params.filename}" has been uploaded to decentralized storage`,
        category: 'system',
      });

      // Track analytics
      await analyticsService.updateViewerActivity(wallet.address, {
        type: 'file_uploaded',
        metadata: {
          fileId: storageFile.id,
          filename: params.filename,
          size: params.file.size,
          category: params.category,
          provider: primaryProvider,
          cid: uploadResult.cid,
        },
      });

      return storageFile;
    } catch (error) {
      console.error('❌ Failed to upload file:', error);
      return null;
    }
  }

  private selectOptimalProviders(fileSize: number, category: string): string[] {
    const availableProviders = Array.from(this.providers.values())
      .filter(provider => {
        return provider.isActive &&
               fileSize <= parseInt(provider.limits.maxFileSize) &&
               this.isCategorySupported(provider, category);
      })
      .sort((a, b) => {
        // Sort by reliability and cost
        const scoreA = a.performance.reliability - parseFloat(a.pricing.storage);
        const scoreB = b.performance.reliability - parseFloat(b.pricing.storage);
        return scoreB - scoreA;
      });

    return availableProviders.slice(0, 3).map(p => p.id);
  }

  private isCategorySupported(provider: StorageProvider, category: string): boolean {
    // All providers support basic categories
    if (['image', 'document', 'nft'].includes(category)) {
      return true;
    }

    // Video/audio requires higher limits and performance
    if (['video', 'audio', 'stream'].includes(category)) {
      return parseInt(provider.limits.maxFileSize) >= 104857600 && // 100MB
             provider.performance.reliability >= 99.0;
    }

    return true;
  }

  private async uploadToProvider(file: File | Blob, providerId: string, options: {
    filename: string;
    encrypt: boolean;
  }): Promise<{ cid: string; encryptionKey?: string } | null> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error('Provider not found');
    }

    try {
      switch (provider.type) {
        case 'ipfs':
          return await this.uploadToIPFS(file, provider, options);
        case 'arweave':
          return await this.uploadToArweave(file, provider, options);
        case 'filecoin':
          return await this.uploadToFilecoin(file, provider, options);
        default:
          throw new Error(`Unsupported provider type: ${provider.type}`);
      }
    } catch (error) {
      console.error(`❌ Failed to upload to ${provider.name}:`, error);
      return null;
    }
  }

  private async uploadToIPFS(file: File | Blob, provider: StorageProvider, options: {
    filename: string;
    encrypt: boolean;
  }): Promise<{ cid: string; encryptionKey?: string }> {
    const formData = new FormData();
    
    let fileToUpload = file;
    let encryptionKey: string | undefined;

    // Encrypt file if requested
    if (options.encrypt) {
      const encrypted = await this.encryptFile(file);
      fileToUpload = new Blob([encrypted.encryptedData]);
      encryptionKey = encrypted.key;
    }

    formData.append('file', fileToUpload, options.filename);

    // Add metadata
    const metadata = {
      name: options.filename,
      description: `Uploaded via StreamMulti at ${new Date().toISOString()}`,
      encrypted: options.encrypt,
    };
    formData.append('pinataMetadata', JSON.stringify(metadata));

    const response = await fetch(`${provider.endpoint}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return {
      cid: result.IpfsHash,
      encryptionKey,
    };
  }

  private async uploadToArweave(file: File | Blob, provider: StorageProvider, options: {
    filename: string;
    encrypt: boolean;
  }): Promise<{ cid: string; encryptionKey?: string }> {
    // Arweave upload implementation
    // This would require Arweave SDK integration
    throw new Error('Arweave upload not implemented');
  }

  private async uploadToFilecoin(file: File | Blob, provider: StorageProvider, options: {
    filename: string;
    encrypt: boolean;
  }): Promise<{ cid: string; encryptionKey?: string }> {
    // Filecoin upload implementation
    // This would require Filecoin/Lotus API integration
    throw new Error('Filecoin upload not implemented');
  }

  // File Download
  public async downloadFile(fileId: string): Promise<Blob | null> {
    console.log(`🔄 Downloading file: ${fileId}`);

    try {
      const file = this.files.get(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      // Check cache first
      const cached = this.downloadCache.get(file.cid);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('✅ File served from cache');
        return cached.data;
      }

      // Download from provider
      const data = await this.downloadFromProvider(file.cid, file.provider);
      if (!data) {
        throw new Error('Download failed');
      }

      let finalData = data;

      // Decrypt if necessary
      if (file.isEncrypted && file.encryptionKey) {
        finalData = await this.decryptFile(data, file.encryptionKey);
      }

      // Cache the result
      this.downloadCache.set(file.cid, {
        data: finalData,
        timestamp: Date.now(),
      });

      // Update file stats
      file.accessCount++;
      file.lastAccessed = new Date().toISOString();
      this.files.set(fileId, file);

      // Update economics
      const provider = this.providers.get(file.provider);
      if (provider) {
        const bandwidthCost = (finalData.size / (1024 * 1024 * 1024)) * parseFloat(provider.pricing.bandwidth);
        file.economics.bandwidthCost = (parseFloat(file.economics.bandwidthCost) + bandwidthCost).toFixed(6);
        file.economics.totalCost = (parseFloat(file.economics.storageCost) + parseFloat(file.economics.bandwidthCost)).toFixed(6);
      }

      console.log(`✅ File downloaded: ${file.filename}`);
      return finalData;
    } catch (error) {
      console.error('❌ Failed to download file:', error);
      return null;
    }
  }

  private async downloadFromProvider(cid: string, providerId: string): Promise<Blob | null> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error('Provider not found');
    }

    try {
      const url = `${provider.configuration.gateway}${cid}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error(`❌ Failed to download from ${provider.name}:`, error);
      return null;
    }
  }

  // File Management
  public async deleteFile(fileId: string): Promise<boolean> {
    console.log(`🔄 Deleting file: ${fileId}`);

    try {
      const file = this.files.get(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      // Check ownership
      const wallet = blockchainService.getCurrentWallet();
      if (!wallet || file.uploadedBy !== wallet.address) {
        throw new Error('Not authorized to delete this file');
      }

      // Remove from all providers
      for (const providerId of file.backup.providers) {
        await this.deleteFromProvider(file.cid, providerId);
      }

      // Remove from local storage
      this.files.delete(fileId);

      // Clear from cache
      this.downloadCache.delete(file.cid);

      console.log(`✅ File deleted: ${file.filename}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete file:', error);
      return false;
    }
  }

  private async deleteFromProvider(cid: string, providerId: string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return;
    }

    try {
      if (provider.type === 'ipfs' && provider.id === 'ipfs-pinata') {
        await fetch(`${provider.endpoint}/pinning/unpin/${cid}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
          },
        });
      }
      // Other providers would have their own deletion methods
    } catch (error) {
      console.error(`❌ Failed to delete from ${provider.name}:`, error);
    }
  }

  public async shareFile(fileId: string, options: {
    expiresAt?: string;
    allowedUsers?: string[];
    maxDownloads?: number;
    requireAuth?: boolean;
  }): Promise<{ shareKey: string; shareUrl: string } | null> {
    console.log(`🔄 Sharing file: ${fileId}`);

    try {
      const file = this.files.get(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      // Check ownership
      const wallet = blockchainService.getCurrentWallet();
      if (!wallet || file.uploadedBy !== wallet.address) {
        throw new Error('Not authorized to share this file');
      }

      const shareKey = `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const shareUrl = `${this.baseUrl}/storage/shared/${shareKey}`;

      // Update file sharing settings
      file.sharing = {
        isShared: true,
        shareKey,
        expiresAt: options.expiresAt,
        allowedUsers: options.allowedUsers || [],
        downloadCount: 0,
        maxDownloads: options.maxDownloads,
      };

      this.files.set(fileId, file);

      console.log(`✅ File shared: ${shareKey}`);
      return { shareKey, shareUrl };
    } catch (error) {
      console.error('❌ Failed to share file:', error);
      return null;
    }
  }

  // Encryption/Decryption
  private async encryptFile(file: File | Blob): Promise<{ encryptedData: ArrayBuffer; key: string }> {
    // Generate encryption key
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Export key for storage
    const exportedKey = await crypto.subtle.exportKey('jwk', key);
    const keyString = JSON.stringify(exportedKey);

    // Encrypt file data
    const fileData = await file.arrayBuffer();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      fileData
    );

    // Combine IV and encrypted data
    const combined = new ArrayBuffer(iv.length + encryptedData.byteLength);
    const combinedView = new Uint8Array(combined);
    combinedView.set(iv);
    combinedView.set(new Uint8Array(encryptedData), iv.length);

    return {
      encryptedData: combined,
      key: keyString,
    };
  }

  private async decryptFile(encryptedData: Blob, keyString: string): Promise<Blob> {
    // Import key
    const keyData = JSON.parse(keyString);
    const key = await crypto.subtle.importKey(
      'jwk',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Extract IV and encrypted data
    const dataBuffer = await encryptedData.arrayBuffer();
    const iv = new Uint8Array(dataBuffer.slice(0, 12));
    const encrypted = dataBuffer.slice(12);

    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    return new Blob([decryptedData]);
  }

  // Background Tasks
  private async processUploadQueue(): Promise<void> {
    if (this.uploadQueue.length === 0) return;

    console.log(`🔄 Processing upload queue: ${this.uploadQueue.length} files`);

    const filesToProcess = this.uploadQueue.splice(0, 5); // Process 5 files at a time

    for (const file of filesToProcess) {
      try {
        await this.backupFileToAdditionalProviders(file);
      } catch (error) {
        console.error(`❌ Failed to backup file ${file.id}:`, error);
        // Re-queue the file for retry
        this.uploadQueue.push(file);
      }
    }
  }

  private async backupFileToAdditionalProviders(file: StorageFile): Promise<void> {
    const strategy = this.selectBackupStrategy(file);
    if (!strategy) return;

    const additionalProviders = strategy.providers.filter(p => !file.backup.providers.includes(p));
    
    for (const providerId of additionalProviders) {
      try {
        // Download original file
        const originalData = await this.downloadFromProvider(file.cid, file.provider);
        if (!originalData) continue;

        // Upload to additional provider
        const result = await this.uploadToProvider(originalData, providerId, {
          filename: file.filename,
          encrypt: file.isEncrypted,
        });

        if (result) {
          file.backup.providers.push(providerId);
          file.backup.backupCount++;
          file.backup.lastBackup = new Date().toISOString();
        }
      } catch (error) {
        console.error(`❌ Failed to backup to provider ${providerId}:`, error);
      }
    }

    this.files.set(file.id, file);
  }

  private selectBackupStrategy(file: StorageFile): BackupStrategy | null {
    for (const strategy of this.backupStrategies.values()) {
      if (!strategy.isAutomatic) continue;

      const meetsRules = 
        file.size >= strategy.rules.minFileSize &&
        file.size <= strategy.rules.maxFileSize &&
        strategy.rules.categories.includes(file.metadata.category);

      if (meetsRules) {
        return strategy;
      }
    }

    return null;
  }

  private async verifyFileIntegrity(): Promise<void> {
    console.log('🔄 Verifying file integrity...');

    const filesToVerify = Array.from(this.files.values())
      .filter(file => !file.backup.isVerified)
      .slice(0, 10); // Verify 10 files at a time

    for (const file of filesToVerify) {
      try {
        const isValid = await this.verifyFile(file);
        file.backup.isVerified = isValid;
        this.files.set(file.id, file);
      } catch (error) {
        console.error(`❌ Failed to verify file ${file.id}:`, error);
      }
    }

    console.log(`✅ Verified ${filesToVerify.length} files`);
  }

  private async verifyFile(file: StorageFile): Promise<boolean> {
    try {
      // Download file from primary provider
      const data = await this.downloadFromProvider(file.cid, file.provider);
      if (!data) return false;

      // Verify file hash
      const arrayBuffer = await data.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return hash === file.hash;
    } catch (error) {
      console.error('❌ File verification failed:', error);
      return false;
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [cid, cached] of this.downloadCache) {
      if (now - cached.timestamp > this.cacheTimeout) {
        this.downloadCache.delete(cid);
      }
    }
  }

  private async updateNodeInformation(): Promise<void> {
    // Update IPFS node information
    try {
      if (this.providers.has('ipfs-infura')) {
        const response = await fetch(`${this.ipfsApiUrl}/id`, {
          method: 'POST',
        });

        if (response.ok) {
          const nodeInfo = await response.json();
          const node: IPFSNode = {
            id: nodeInfo.ID,
            addresses: nodeInfo.Addresses || [],
            agentVersion: nodeInfo.AgentVersion,
            protocolVersion: nodeInfo.ProtocolVersion,
            publicKey: nodeInfo.PublicKey,
            isOnline: true,
            peers: 0,
            bandwidth: {
              totalIn: 0,
              totalOut: 0,
              rateIn: 0,
              rateOut: 0,
            },
            storage: {
              repoSize: 0,
              storageMax: 0,
              numObjects: 0,
            },
          };

          this.nodes.set(nodeInfo.ID, node);
        }
      }
    } catch (error) {
      console.error('❌ Failed to update node information:', error);
    }
  }

  // Thumbnail Generation
  private async generateThumbnail(file: StorageFile, originalFile: File | Blob): Promise<void> {
    try {
      if (file.metadata.category === 'image') {
        const thumbnail = await this.createImageThumbnail(originalFile);
        if (thumbnail) {
          const result = await this.uploadToProvider(thumbnail, file.provider, {
            filename: `thumb_${file.filename}`,
            encrypt: false,
          });
          if (result) {
            file.metadata.thumbnailHash = result.cid;
            this.files.set(file.id, file);
          }
        }
      } else if (file.metadata.category === 'video') {
        // Video thumbnail generation would require additional libraries
        console.log('Video thumbnail generation not implemented');
      }
    } catch (error) {
      console.error('❌ Failed to generate thumbnail:', error);
    }
  }

  private async createImageThumbnail(file: File | Blob): Promise<Blob | null> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const img = new Image();
      const url = URL.createObjectURL(file);

      return new Promise((resolve) => {
        img.onload = () => {
          const maxSize = 200;
          let { width, height } = img;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url);
            resolve(blob);
          }, 'image/jpeg', 0.8);
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(null);
        };

        img.src = url;
      });
    } catch (error) {
      console.error('❌ Failed to create image thumbnail:', error);
      return null;
    }
  }

  // Public API Methods
  public getFile(fileId: string): StorageFile | null {
    return this.files.get(fileId) || null;
  }

  public getUserFiles(userId: string): StorageFile[] {
    return Array.from(this.files.values())
      .filter(file => file.uploadedBy === userId)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  public getPublicFiles(): StorageFile[] {
    return Array.from(this.files.values())
      .filter(file => file.isPublic)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  public getFilesByCategory(category: string): StorageFile[] {
    return Array.from(this.files.values())
      .filter(file => file.metadata.category === category)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  public getStorageStats(): StorageStats {
    const files = Array.from(this.files.values());
    
    return {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      totalCost: files.reduce((sum, file) => sum + parseFloat(file.economics.totalCost), 0).toFixed(6),
      currency: 'USD',
      breakdown: {
        byType: this.calculateBreakdownByType(files),
        byProvider: this.calculateBreakdownByProvider(files),
        byUser: this.calculateBreakdownByUser(files),
        byCategory: this.calculateBreakdownByCategory(files),
      },
      performance: {
        averageUploadTime: 5,
        averageDownloadTime: 2,
        successRate: 99.5,
        errorRate: 0.5,
      },
      usage: {
        dailyUploads: files.filter(f => 
          new Date(f.uploadedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
        dailyDownloads: files.reduce((sum, f) => sum + f.accessCount, 0),
        bandwidthUsed: files.reduce((sum, f) => sum + parseFloat(f.economics.bandwidthCost), 0),
        storageUsed: files.reduce((sum, file) => sum + file.size, 0),
        activeFiles: files.filter(f => f.accessCount > 0).length,
      },
    };
  }

  private calculateBreakdownByType(files: StorageFile[]): { [mimeType: string]: { count: number; size: number } } {
    const breakdown: { [mimeType: string]: { count: number; size: number } } = {};
    
    files.forEach(file => {
      if (!breakdown[file.mimeType]) {
        breakdown[file.mimeType] = { count: 0, size: 0 };
      }
      breakdown[file.mimeType].count++;
      breakdown[file.mimeType].size += file.size;
    });

    return breakdown;
  }

  private calculateBreakdownByProvider(files: StorageFile[]): { [provider: string]: { count: number; size: number; cost: string } } {
    const breakdown: { [provider: string]: { count: number; size: number; cost: string } } = {};
    
    files.forEach(file => {
      if (!breakdown[file.provider]) {
        breakdown[file.provider] = { count: 0, size: 0, cost: '0' };
      }
      breakdown[file.provider].count++;
      breakdown[file.provider].size += file.size;
      breakdown[file.provider].cost = (parseFloat(breakdown[file.provider].cost) + parseFloat(file.economics.totalCost)).toFixed(6);
    });

    return breakdown;
  }

  private calculateBreakdownByUser(files: StorageFile[]): { [userId: string]: { count: number; size: number; cost: string } } {
    const breakdown: { [userId: string]: { count: number; size: number; cost: string } } = {};
    
    files.forEach(file => {
      if (!breakdown[file.uploadedBy]) {
        breakdown[file.uploadedBy] = { count: 0, size: 0, cost: '0' };
      }
      breakdown[file.uploadedBy].count++;
      breakdown[file.uploadedBy].size += file.size;
      breakdown[file.uploadedBy].cost = (parseFloat(breakdown[file.uploadedBy].cost) + parseFloat(file.economics.totalCost)).toFixed(6);
    });

    return breakdown;
  }

  private calculateBreakdownByCategory(files: StorageFile[]): { [category: string]: { count: number; size: number } } {
    const breakdown: { [category: string]: { count: number; size: number } } = {};
    
    files.forEach(file => {
      const category = file.metadata.category;
      if (!breakdown[category]) {
        breakdown[category] = { count: 0, size: 0 };
      }
      breakdown[category].count++;
      breakdown[category].size += file.size;
    });

    return breakdown;
  }

  public getSupportedProviders(): StorageProvider[] {
    return Array.from(this.providers.values()).filter(p => p.isActive);
  }

  public getPinningServices(): PinningService[] {
    return Array.from(this.pinningServices.values()).filter(p => p.isActive);
  }

  public getBackupStrategies(): BackupStrategy[] {
    return Array.from(this.backupStrategies.values());
  }

  public getIPFSNodes(): IPFSNode[] {
    return Array.from(this.nodes.values());
  }
}

export const decentralizedStorageService = new DecentralizedStorageService();
export default decentralizedStorageService;