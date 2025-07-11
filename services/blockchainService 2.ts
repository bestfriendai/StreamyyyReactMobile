// Core Blockchain Service with Multi-Chain Support and Web3 Integration
import { ethers } from 'ethers';
import { analyticsService } from './analyticsService';
import { notificationService } from './notificationService';

export interface BlockchainNetwork {
  chainId: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
  gasEstimate: {
    slow: number;
    standard: number;
    fast: number;
  };
  blockTime: number;
  confirmations: number;
  features: string[];
}

export interface Web3Wallet {
  id: string;
  address: string;
  provider: 'metamask' | 'walletconnect' | 'coinbase' | 'ledger' | 'trezor';
  chainId: number;
  balance: string;
  nonce: number;
  isConnected: boolean;
  lastUsed: string;
  metadata: {
    name?: string;
    icon?: string;
    description?: string;
    version?: string;
  };
}

export interface BlockchainTransaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasLimit: string;
  gasUsed?: string;
  nonce: number;
  chainId: number;
  blockNumber?: number;
  blockHash?: string;
  timestamp?: string;
  status: 'pending' | 'confirmed' | 'failed';
  type: 'transfer' | 'contract' | 'nft' | 'token' | 'defi' | 'dao';
  metadata: {
    purpose: string;
    description?: string;
    relatedEntityId?: string;
    relatedEntityType?: string;
    streamId?: string;
    creatorId?: string;
    amount?: string;
    currency?: string;
    contractAddress?: string;
    tokenId?: string;
    functionName?: string;
    inputData?: string;
    outputData?: string;
  };
  receipt?: {
    transactionHash: string;
    blockNumber: number;
    blockHash: string;
    transactionIndex: number;
    from: string;
    to: string;
    gasUsed: string;
    cumulativeGasUsed: string;
    contractAddress?: string;
    logs: any[];
    logsBloom: string;
    status: number;
  };
}

export interface GasEstimate {
  slow: {
    gasPrice: string;
    estimatedTime: number;
    cost: string;
  };
  standard: {
    gasPrice: string;
    estimatedTime: number;
    cost: string;
  };
  fast: {
    gasPrice: string;
    estimatedTime: number;
    cost: string;
  };
  instant: {
    gasPrice: string;
    estimatedTime: number;
    cost: string;
  };
}

export interface SmartContractABI {
  inputs: { name: string; type: string; indexed?: boolean }[];
  name: string;
  outputs?: { name: string; type: string }[];
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
  type: 'function' | 'constructor' | 'event' | 'fallback' | 'receive';
  anonymous?: boolean;
}

export interface DeployedContract {
  address: string;
  chainId: number;
  name: string;
  abi: SmartContractABI[];
  bytecode: string;
  deployedAt: string;
  deployedBy: string;
  version: string;
  isVerified: boolean;
  metadata: {
    description: string;
    category: string;
    tags: string[];
    permissions: string[];
    gasOptimized: boolean;
    upgradeable: boolean;
  };
}

class BlockchainService {
  private networks: Map<number, BlockchainNetwork> = new Map();
  private providers: Map<number, ethers.providers.JsonRpcProvider> = new Map();
  private wallets: Map<string, Web3Wallet> = new Map();
  private contracts: Map<string, DeployedContract> = new Map();
  private currentWallet: Web3Wallet | null = null;
  private currentNetwork: BlockchainNetwork | null = null;
  private transactionHistory: BlockchainTransaction[] = [];
  private gasTracker: Map<number, GasEstimate> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeNetworks();
    this.initializeProviders();
    this.setupEventListeners();
    console.log('🔗 Blockchain Service initialized with multi-chain support');
  }

  private initializeNetworks(): void {
    const supportedNetworks: BlockchainNetwork[] = [
      {
        chainId: 1,
        name: 'Ethereum Mainnet',
        symbol: 'ETH',
        rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
        explorerUrl: 'https://etherscan.io',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        isTestnet: false,
        gasEstimate: { slow: 20, standard: 30, fast: 50 },
        blockTime: 13,
        confirmations: 12,
        features: ['eip1559', 'smart-contracts', 'nft', 'defi', 'dao'],
      },
      {
        chainId: 137,
        name: 'Polygon',
        symbol: 'MATIC',
        rpcUrl: 'https://polygon-rpc.com',
        explorerUrl: 'https://polygonscan.com',
        nativeCurrency: { name: 'Matic', symbol: 'MATIC', decimals: 18 },
        isTestnet: false,
        gasEstimate: { slow: 1, standard: 2, fast: 5 },
        blockTime: 2,
        confirmations: 10,
        features: ['eip1559', 'smart-contracts', 'nft', 'defi', 'dao', 'low-cost'],
      },
      {
        chainId: 56,
        name: 'BNB Smart Chain',
        symbol: 'BNB',
        rpcUrl: 'https://bsc-dataseed.binance.org',
        explorerUrl: 'https://bscscan.com',
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
        isTestnet: false,
        gasEstimate: { slow: 3, standard: 5, fast: 10 },
        blockTime: 3,
        confirmations: 15,
        features: ['smart-contracts', 'nft', 'defi', 'dao', 'low-cost'],
      },
      {
        chainId: 43114,
        name: 'Avalanche C-Chain',
        symbol: 'AVAX',
        rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
        explorerUrl: 'https://snowtrace.io',
        nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
        isTestnet: false,
        gasEstimate: { slow: 25, standard: 30, fast: 40 },
        blockTime: 2,
        confirmations: 10,
        features: ['smart-contracts', 'nft', 'defi', 'dao', 'high-speed'],
      },
      {
        chainId: 250,
        name: 'Fantom Opera',
        symbol: 'FTM',
        rpcUrl: 'https://rpc.ftm.tools',
        explorerUrl: 'https://ftmscan.com',
        nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
        isTestnet: false,
        gasEstimate: { slow: 1, standard: 2, fast: 5 },
        blockTime: 1,
        confirmations: 5,
        features: ['smart-contracts', 'nft', 'defi', 'dao', 'ultra-fast'],
      },
      {
        chainId: 42161,
        name: 'Arbitrum One',
        symbol: 'ETH',
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        explorerUrl: 'https://arbiscan.io',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        isTestnet: false,
        gasEstimate: { slow: 0.1, standard: 0.2, fast: 0.5 },
        blockTime: 0.25,
        confirmations: 3,
        features: ['eip1559', 'smart-contracts', 'nft', 'defi', 'dao', 'layer2'],
      },
      {
        chainId: 10,
        name: 'Optimism',
        symbol: 'ETH',
        rpcUrl: 'https://mainnet.optimism.io',
        explorerUrl: 'https://optimistic.etherscan.io',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        isTestnet: false,
        gasEstimate: { slow: 0.1, standard: 0.2, fast: 0.5 },
        blockTime: 2,
        confirmations: 3,
        features: ['eip1559', 'smart-contracts', 'nft', 'defi', 'dao', 'layer2'],
      },
      // Testnets
      {
        chainId: 11155111,
        name: 'Sepolia',
        symbol: 'ETH',
        rpcUrl: 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
        explorerUrl: 'https://sepolia.etherscan.io',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        isTestnet: true,
        gasEstimate: { slow: 1, standard: 2, fast: 5 },
        blockTime: 13,
        confirmations: 3,
        features: ['eip1559', 'smart-contracts', 'nft', 'defi', 'dao', 'testnet'],
      },
    ];

    supportedNetworks.forEach(network => {
      this.networks.set(network.chainId, network);
    });
  }

  private initializeProviders(): void {
    for (const [chainId, network] of this.networks) {
      try {
        const provider = new ethers.providers.JsonRpcProvider(network.rpcUrl);
        this.providers.set(chainId, provider);
        console.log(`✅ Provider initialized for ${network.name}`);
      } catch (error) {
        console.error(`❌ Failed to initialize provider for ${network.name}:`, error);
      }
    }
  }

  private setupEventListeners(): void {
    // Listen for wallet events
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
        this.handleAccountsChanged(accounts);
      });

      (window as any).ethereum.on('chainChanged', (chainId: string) => {
        this.handleChainChanged(parseInt(chainId, 16));
      });

      (window as any).ethereum.on('disconnect', () => {
        this.handleDisconnect();
      });
    }

    // Listen for transaction events
    this.addEventListener('transaction:pending', (transaction: BlockchainTransaction) => {
      this.trackTransaction(transaction);
    });

    this.addEventListener('transaction:confirmed', (transaction: BlockchainTransaction) => {
      this.handleTransactionConfirmed(transaction);
    });

    this.addEventListener('transaction:failed', (transaction: BlockchainTransaction) => {
      this.handleTransactionFailed(transaction);
    });
  }

  // Wallet Management
  public async connectWallet(provider: Web3Wallet['provider'] = 'metamask'): Promise<Web3Wallet | null> {
    console.log(`🔄 Connecting to ${provider} wallet...`);

    try {
      let ethereum: any;

      switch (provider) {
        case 'metamask':
          if (typeof window !== 'undefined' && (window as any).ethereum) {
            ethereum = (window as any).ethereum;
          } else {
            throw new Error('MetaMask not installed');
          }
          break;
        case 'walletconnect':
          // WalletConnect integration would go here
          throw new Error('WalletConnect integration not implemented');
        case 'coinbase':
          // Coinbase Wallet integration would go here
          throw new Error('Coinbase Wallet integration not implemented');
        default:
          throw new Error(`Unsupported wallet provider: ${provider}`);
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      const chainId = parseInt(await ethereum.request({ method: 'eth_chainId' }), 16);
      const balance = await ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });

      const wallet: Web3Wallet = {
        id: `${provider}-${address}`,
        address,
        provider,
        chainId,
        balance: ethers.utils.formatEther(balance),
        nonce: 0,
        isConnected: true,
        lastUsed: new Date().toISOString(),
        metadata: {
          name: `${provider} Wallet`,
          icon: `/assets/wallets/${provider}.png`,
          description: `Connected ${provider} wallet`,
        },
      };

      this.wallets.set(wallet.id, wallet);
      this.currentWallet = wallet;
      this.currentNetwork = this.networks.get(chainId) || null;

      console.log(`✅ Connected to ${provider} wallet: ${address}`);
      this.emitEvent('wallet:connected', wallet);

      // Track wallet connection
      await analyticsService.updateViewerActivity('current-user', {
        type: 'wallet_connected',
        metadata: {
          provider,
          address,
          chainId,
          balance: wallet.balance,
        },
      });

      return wallet;
    } catch (error) {
      console.error(`❌ Failed to connect ${provider} wallet:`, error);
      this.emitEvent('wallet:error', { provider, error });
      return null;
    }
  }

  public async disconnectWallet(): Promise<void> {
    console.log('🔄 Disconnecting wallet...');

    if (this.currentWallet) {
      this.currentWallet.isConnected = false;
      this.emitEvent('wallet:disconnected', this.currentWallet);

      // Track wallet disconnection
      await analyticsService.updateViewerActivity('current-user', {
        type: 'wallet_disconnected',
        metadata: {
          provider: this.currentWallet.provider,
          address: this.currentWallet.address,
        },
      });
    }

    this.currentWallet = null;
    this.currentNetwork = null;
    
    console.log('✅ Wallet disconnected');
  }

  public async switchNetwork(chainId: number): Promise<boolean> {
    console.log(`🔄 Switching to network: ${chainId}`);

    if (!this.currentWallet) {
      throw new Error('No wallet connected');
    }

    const network = this.networks.get(chainId);
    if (!network) {
      throw new Error(`Unsupported network: ${chainId}`);
    }

    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
      }

      this.currentNetwork = network;
      this.currentWallet.chainId = chainId;
      
      console.log(`✅ Switched to ${network.name}`);
      this.emitEvent('network:switched', network);
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to switch network:`, error);
      
      // Try to add the network if it doesn't exist
      try {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${chainId.toString(16)}`,
              chainName: network.name,
              nativeCurrency: network.nativeCurrency,
              rpcUrls: [network.rpcUrl],
              blockExplorerUrls: [network.explorerUrl],
            }],
          });
          
          this.currentNetwork = network;
          this.currentWallet.chainId = chainId;
          
          console.log(`✅ Added and switched to ${network.name}`);
          this.emitEvent('network:added', network);
          
          return true;
        }
      } catch (addError) {
        console.error(`❌ Failed to add network:`, addError);
      }
      
      return false;
    }
  }

  // Transaction Management
  public async sendTransaction(params: {
    to: string;
    value?: string;
    data?: string;
    gasLimit?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    type?: 'transfer' | 'contract' | 'nft' | 'token' | 'defi' | 'dao';
    metadata?: any;
  }): Promise<BlockchainTransaction | null> {
    console.log('🔄 Sending transaction...');

    if (!this.currentWallet || !this.currentNetwork) {
      throw new Error('No wallet or network connected');
    }

    try {
      const provider = this.providers.get(this.currentNetwork.chainId);
      if (!provider) {
        throw new Error('Provider not available');
      }

      const signer = new ethers.providers.Web3Provider((window as any).ethereum).getSigner();
      
      const transaction = await signer.sendTransaction({
        to: params.to,
        value: params.value || '0',
        data: params.data || '0x',
        gasLimit: params.gasLimit,
        gasPrice: params.gasPrice,
        maxFeePerGas: params.maxFeePerGas,
        maxPriorityFeePerGas: params.maxPriorityFeePerGas,
      });

      const blockchainTransaction: BlockchainTransaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        hash: transaction.hash,
        from: this.currentWallet.address,
        to: params.to,
        value: params.value || '0',
        gasPrice: transaction.gasPrice?.toString() || '0',
        gasLimit: transaction.gasLimit.toString(),
        nonce: transaction.nonce,
        chainId: this.currentNetwork.chainId,
        status: 'pending',
        type: params.type || 'transfer',
        metadata: {
          purpose: 'User transaction',
          ...params.metadata,
        },
      };

      this.transactionHistory.push(blockchainTransaction);
      this.emitEvent('transaction:pending', blockchainTransaction);

      console.log(`✅ Transaction sent: ${transaction.hash}`);
      
      // Wait for confirmation
      const receipt = await transaction.wait();
      blockchainTransaction.status = 'confirmed';
      blockchainTransaction.blockNumber = receipt.blockNumber;
      blockchainTransaction.blockHash = receipt.blockHash;
      blockchainTransaction.gasUsed = receipt.gasUsed.toString();
      blockchainTransaction.receipt = receipt;
      blockchainTransaction.timestamp = new Date().toISOString();

      this.emitEvent('transaction:confirmed', blockchainTransaction);
      
      return blockchainTransaction;
    } catch (error) {
      console.error('❌ Transaction failed:', error);
      this.emitEvent('transaction:failed', { error, params });
      return null;
    }
  }

  public async getTransactionHistory(address?: string): Promise<BlockchainTransaction[]> {
    const targetAddress = address || this.currentWallet?.address;
    if (!targetAddress) {
      return [];
    }

    return this.transactionHistory.filter(tx => 
      tx.from.toLowerCase() === targetAddress.toLowerCase() || 
      tx.to.toLowerCase() === targetAddress.toLowerCase()
    );
  }

  public async getTransactionStatus(hash: string): Promise<BlockchainTransaction | null> {
    return this.transactionHistory.find(tx => tx.hash === hash) || null;
  }

  // Gas Management
  public async estimateGas(chainId: number): Promise<GasEstimate> {
    console.log(`🔄 Estimating gas for chain: ${chainId}`);

    const cached = this.gasTracker.get(chainId);
    if (cached) {
      return cached;
    }

    try {
      const provider = this.providers.get(chainId);
      if (!provider) {
        throw new Error('Provider not available');
      }

      const gasPrice = await provider.getGasPrice();
      const gasPriceGwei = ethers.utils.formatUnits(gasPrice, 'gwei');
      const gasPriceNumber = parseFloat(gasPriceGwei);

      const estimate: GasEstimate = {
        slow: {
          gasPrice: ethers.utils.parseUnits((gasPriceNumber * 0.8).toString(), 'gwei').toString(),
          estimatedTime: 300, // 5 minutes
          cost: ethers.utils.formatEther(gasPrice.mul(21000).mul(80).div(100)),
        },
        standard: {
          gasPrice: gasPrice.toString(),
          estimatedTime: 180, // 3 minutes
          cost: ethers.utils.formatEther(gasPrice.mul(21000)),
        },
        fast: {
          gasPrice: ethers.utils.parseUnits((gasPriceNumber * 1.2).toString(), 'gwei').toString(),
          estimatedTime: 60, // 1 minute
          cost: ethers.utils.formatEther(gasPrice.mul(21000).mul(120).div(100)),
        },
        instant: {
          gasPrice: ethers.utils.parseUnits((gasPriceNumber * 1.5).toString(), 'gwei').toString(),
          estimatedTime: 30, // 30 seconds
          cost: ethers.utils.formatEther(gasPrice.mul(21000).mul(150).div(100)),
        },
      };

      this.gasTracker.set(chainId, estimate);
      
      console.log(`✅ Gas estimated for chain ${chainId}`);
      return estimate;
    } catch (error) {
      console.error(`❌ Failed to estimate gas:`, error);
      throw error;
    }
  }

  // Smart Contract Management
  public async deployContract(params: {
    bytecode: string;
    abi: SmartContractABI[];
    constructorParams?: any[];
    gasLimit?: string;
    gasPrice?: string;
    metadata: {
      name: string;
      description: string;
      category: string;
      tags: string[];
    };
  }): Promise<DeployedContract | null> {
    console.log(`🔄 Deploying contract: ${params.metadata.name}`);

    if (!this.currentWallet || !this.currentNetwork) {
      throw new Error('No wallet or network connected');
    }

    try {
      const signer = new ethers.providers.Web3Provider((window as any).ethereum).getSigner();
      const factory = new ethers.ContractFactory(params.abi, params.bytecode, signer);
      
      const contract = await factory.deploy(...(params.constructorParams || []), {
        gasLimit: params.gasLimit,
        gasPrice: params.gasPrice,
      });

      await contract.deployed();

      const deployedContract: DeployedContract = {
        address: contract.address,
        chainId: this.currentNetwork.chainId,
        name: params.metadata.name,
        abi: params.abi,
        bytecode: params.bytecode,
        deployedAt: new Date().toISOString(),
        deployedBy: this.currentWallet.address,
        version: '1.0.0',
        isVerified: false,
        metadata: {
          description: params.metadata.description,
          category: params.metadata.category,
          tags: params.metadata.tags,
          permissions: [],
          gasOptimized: false,
          upgradeable: false,
        },
      };

      this.contracts.set(`${this.currentNetwork.chainId}-${contract.address}`, deployedContract);
      
      console.log(`✅ Contract deployed: ${contract.address}`);
      this.emitEvent('contract:deployed', deployedContract);
      
      return deployedContract;
    } catch (error) {
      console.error('❌ Contract deployment failed:', error);
      return null;
    }
  }

  public async callContract(params: {
    address: string;
    abi: SmartContractABI[];
    functionName: string;
    functionParams?: any[];
    value?: string;
    gasLimit?: string;
    gasPrice?: string;
  }): Promise<any> {
    console.log(`🔄 Calling contract function: ${params.functionName}`);

    if (!this.currentWallet || !this.currentNetwork) {
      throw new Error('No wallet or network connected');
    }

    try {
      const signer = new ethers.providers.Web3Provider((window as any).ethereum).getSigner();
      const contract = new ethers.Contract(params.address, params.abi, signer);

      const result = await contract[params.functionName](...(params.functionParams || []), {
        value: params.value || '0',
        gasLimit: params.gasLimit,
        gasPrice: params.gasPrice,
      });

      console.log(`✅ Contract function called: ${params.functionName}`);
      this.emitEvent('contract:called', { address: params.address, functionName: params.functionName, result });
      
      return result;
    } catch (error) {
      console.error(`❌ Contract call failed:`, error);
      throw error;
    }
  }

  public async readContract(params: {
    address: string;
    abi: SmartContractABI[];
    functionName: string;
    functionParams?: any[];
  }): Promise<any> {
    console.log(`🔄 Reading contract: ${params.functionName}`);

    if (!this.currentNetwork) {
      throw new Error('No network connected');
    }

    try {
      const provider = this.providers.get(this.currentNetwork.chainId);
      if (!provider) {
        throw new Error('Provider not available');
      }

      const contract = new ethers.Contract(params.address, params.abi, provider);
      const result = await contract[params.functionName](...(params.functionParams || []));

      console.log(`✅ Contract read: ${params.functionName}`);
      return result;
    } catch (error) {
      console.error(`❌ Contract read failed:`, error);
      throw error;
    }
  }

  // Utility Methods
  public getSupportedNetworks(): BlockchainNetwork[] {
    return Array.from(this.networks.values());
  }

  public getNetworkById(chainId: number): BlockchainNetwork | null {
    return this.networks.get(chainId) || null;
  }

  public getCurrentWallet(): Web3Wallet | null {
    return this.currentWallet;
  }

  public getCurrentNetwork(): BlockchainNetwork | null {
    return this.currentNetwork;
  }

  public isWalletConnected(): boolean {
    return this.currentWallet?.isConnected || false;
  }

  public async getBalance(address?: string): Promise<string> {
    const targetAddress = address || this.currentWallet?.address;
    if (!targetAddress || !this.currentNetwork) {
      return '0';
    }

    try {
      const provider = this.providers.get(this.currentNetwork.chainId);
      if (!provider) {
        throw new Error('Provider not available');
      }

      const balance = await provider.getBalance(targetAddress);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('❌ Failed to get balance:', error);
      return '0';
    }
  }

  public async getNonce(address?: string): Promise<number> {
    const targetAddress = address || this.currentWallet?.address;
    if (!targetAddress || !this.currentNetwork) {
      return 0;
    }

    try {
      const provider = this.providers.get(this.currentNetwork.chainId);
      if (!provider) {
        throw new Error('Provider not available');
      }

      return await provider.getTransactionCount(targetAddress);
    } catch (error) {
      console.error('❌ Failed to get nonce:', error);
      return 0;
    }
  }

  // Event System
  public addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Event listener error for ${event}:`, error);
        }
      });
    }
  }

  // Event Handlers
  private handleAccountsChanged(accounts: string[]): void {
    console.log('🔄 Accounts changed:', accounts);
    if (accounts.length === 0) {
      this.disconnectWallet();
    } else if (this.currentWallet && accounts[0] !== this.currentWallet.address) {
      this.currentWallet.address = accounts[0];
      this.emitEvent('wallet:changed', this.currentWallet);
    }
  }

  private handleChainChanged(chainId: number): void {
    console.log('🔄 Chain changed:', chainId);
    if (this.currentWallet) {
      this.currentWallet.chainId = chainId;
      this.currentNetwork = this.networks.get(chainId) || null;
      this.emitEvent('network:changed', this.currentNetwork);
    }
  }

  private handleDisconnect(): void {
    console.log('🔄 Wallet disconnected');
    this.disconnectWallet();
  }

  private async trackTransaction(transaction: BlockchainTransaction): Promise<void> {
    try {
      const provider = this.providers.get(transaction.chainId);
      if (!provider) {
        return;
      }

      const receipt = await provider.waitForTransaction(transaction.hash);
      
      if (receipt.status === 1) {
        transaction.status = 'confirmed';
        transaction.receipt = receipt;
        this.emitEvent('transaction:confirmed', transaction);
      } else {
        transaction.status = 'failed';
        this.emitEvent('transaction:failed', transaction);
      }
    } catch (error) {
      console.error('❌ Transaction tracking failed:', error);
      transaction.status = 'failed';
      this.emitEvent('transaction:failed', transaction);
    }
  }

  private async handleTransactionConfirmed(transaction: BlockchainTransaction): Promise<void> {
    console.log(`✅ Transaction confirmed: ${transaction.hash}`);
    
    // Send notification
    await notificationService.showNotification({
      id: `tx-confirmed-${transaction.id}`,
      title: 'Transaction Confirmed',
      body: `Your ${transaction.type} transaction has been confirmed`,
      category: 'system',
      url: `${this.currentNetwork?.explorerUrl}/tx/${transaction.hash}`,
    });

    // Track analytics
    await analyticsService.updateViewerActivity('current-user', {
      type: 'transaction_confirmed',
      metadata: {
        hash: transaction.hash,
        type: transaction.type,
        chainId: transaction.chainId,
        value: transaction.value,
        gasUsed: transaction.gasUsed,
      },
    });
  }

  private async handleTransactionFailed(transaction: BlockchainTransaction): Promise<void> {
    console.log(`❌ Transaction failed: ${transaction.hash}`);
    
    // Send notification
    await notificationService.showNotification({
      id: `tx-failed-${transaction.id}`,
      title: 'Transaction Failed',
      body: `Your ${transaction.type} transaction has failed`,
      category: 'system',
      priority: 'high',
    });

    // Track analytics
    await analyticsService.updateViewerActivity('current-user', {
      type: 'transaction_failed',
      metadata: {
        hash: transaction.hash,
        type: transaction.type,
        chainId: transaction.chainId,
        value: transaction.value,
        error: 'Transaction failed',
      },
    });
  }
}

export const blockchainService = new BlockchainService();
export default blockchainService;