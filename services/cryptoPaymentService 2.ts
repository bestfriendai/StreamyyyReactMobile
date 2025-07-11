// Cryptocurrency Payment Service with Multi-Chain Support
import { ethers } from 'ethers';
import { blockchainService } from './blockchainService';
import { analyticsService } from './analyticsService';
import { notificationService } from './notificationService';

export interface CryptoCurrency {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  contractAddress?: string;
  chainId: number;
  isNative: boolean;
  isStablecoin: boolean;
  coingeckoId: string;
  currentPrice: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  isActive: boolean;
  minTransactionAmount: string;
  maxTransactionAmount: string;
  transactionFee: string;
  confirmationTime: number; // in seconds
  categories: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'crypto' | 'fiat' | 'card' | 'bank' | 'paypal' | 'apple_pay' | 'google_pay';
  icon: string;
  description: string;
  supportedCurrencies: string[];
  supportedChains: number[];
  fees: {
    percentage: number;
    fixed: string;
    currency: string;
  };
  limits: {
    min: string;
    max: string;
    daily: string;
    monthly: string;
  };
  processingTime: string;
  isActive: boolean;
  requiresKYC: boolean;
  metadata: {
    provider: string;
    apiUrl?: string;
    webhookUrl?: string;
    supportUrl?: string;
  };
}

export interface PaymentRequest {
  id: string;
  type: 'donation' | 'subscription' | 'nft_purchase' | 'tip' | 'merchandise' | 'premium_feature' | 'stream_access';
  amount: string;
  currency: string;
  chainId: number;
  from: string;
  to: string;
  recipient: {
    type: 'streamer' | 'platform' | 'creator' | 'marketplace';
    id: string;
    name: string;
    address: string;
  };
  metadata: {
    streamId?: string;
    streamerName?: string;
    platform?: string;
    message?: string;
    isAnonymous?: boolean;
    isRecurring?: boolean;
    recurringPeriod?: 'daily' | 'weekly' | 'monthly';
    nftId?: string;
    subscriptionTier?: string;
    duration?: number;
    customData?: Record<string, any>;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  transactionHash?: string;
  gasPrice?: string;
  gasUsed?: string;
  networkFee?: string;
  platformFee?: string;
  creatorFee?: string;
  totalFee?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  expiresAt?: string;
  confirmations: number;
  requiredConfirmations: number;
  failureReason?: string;
  refundTransactionHash?: string;
  receipt?: any;
}

export interface Subscription {
  id: string;
  userId: string;
  streamerId: string;
  streamerName: string;
  platform: string;
  tier: string;
  tierName: string;
  amount: string;
  currency: string;
  chainId: number;
  interval: 'monthly' | 'yearly';
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  startDate: string;
  endDate?: string;
  nextPaymentDate: string;
  paymentMethod: string;
  paymentHistory: {
    date: string;
    amount: string;
    currency: string;
    transactionHash: string;
    status: string;
  }[];
  benefits: {
    adFree: boolean;
    exclusiveContent: boolean;
    priorityChat: boolean;
    customEmotes: boolean;
    badgeAccess: boolean;
    nftDrops: boolean;
    discordAccess: boolean;
    merchandiseDiscount: number;
    customPerks: string[];
  };
  autoRenew: boolean;
  gracePeriod: number;
  trialEndDate?: string;
  discountCode?: string;
  discountAmount?: string;
  metadata: Record<string, any>;
}

export interface DonationGoal {
  id: string;
  streamerId: string;
  streamerName: string;
  title: string;
  description: string;
  targetAmount: string;
  currentAmount: string;
  currency: string;
  chainId: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isCompleted: boolean;
  categoryType: 'equipment' | 'charity' | 'event' | 'project' | 'general';
  milestones: {
    amount: string;
    description: string;
    reward?: string;
    isReached: boolean;
  }[];
  contributors: {
    address: string;
    amount: string;
    message?: string;
    timestamp: string;
    isAnonymous: boolean;
  }[];
  rewards: {
    amount: string;
    reward: string;
    type: 'nft' | 'merchandise' | 'access' | 'mention' | 'custom';
  }[];
  socialProof: {
    totalDonors: number;
    averageDonation: string;
    topDonation: string;
    recentDonations: number;
  };
  metadata: Record<string, any>;
}

export interface RevenueShare {
  id: string;
  streamId: string;
  streamerId: string;
  totalRevenue: string;
  currency: string;
  chainId: number;
  distribution: {
    streamer: {
      address: string;
      percentage: number;
      amount: string;
    };
    platform: {
      address: string;
      percentage: number;
      amount: string;
    };
    moderators: {
      address: string;
      percentage: number;
      amount: string;
    }[];
    charity: {
      address: string;
      percentage: number;
      amount: string;
    };
  };
  autoDistribution: boolean;
  distributionFrequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  minimumThreshold: string;
  lastDistributionDate?: string;
  nextDistributionDate?: string;
  pendingAmount: string;
  distributedAmount: string;
  transactionHashes: string[];
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAnalytics {
  totalVolume: string;
  totalTransactions: number;
  averageTransactionValue: string;
  currency: string;
  chainId: number;
  period: {
    start: string;
    end: string;
  };
  breakdown: {
    donations: { count: number; volume: string };
    subscriptions: { count: number; volume: string };
    nftPurchases: { count: number; volume: string };
    tips: { count: number; volume: string };
    other: { count: number; volume: string };
  };
  topCurrencies: {
    currency: string;
    volume: string;
    percentage: number;
  }[];
  topStreamers: {
    streamerId: string;
    streamerName: string;
    volume: string;
    transactions: number;
  }[];
  trends: {
    hourly: { hour: number; volume: string; transactions: number }[];
    daily: { date: string; volume: string; transactions: number }[];
    weekly: { week: string; volume: string; transactions: number }[];
    monthly: { month: string; volume: string; transactions: number }[];
  };
  conversions: {
    fiatToCrypto: number;
    cryptoToFiat: number;
    crossChain: number;
  };
}

class CryptoPaymentService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.streammulti.com';
  private readonly coingeckoApiUrl = 'https://api.coingecko.com/api/v3';
  private supportedCurrencies: Map<string, CryptoCurrency> = new Map();
  private paymentMethods: Map<string, PaymentMethod> = new Map();
  private activePayments: Map<string, PaymentRequest> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private donationGoals: Map<string, DonationGoal> = new Map();
  private revenueShares: Map<string, RevenueShare> = new Map();
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private readonly priceCacheTimeout = 60000; // 1 minute

  // Standard ERC20 Token ABI
  private readonly ERC20_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address, uint256) returns (bool)',
    'function transferFrom(address, address, uint256) returns (bool)',
    'function approve(address, uint256) returns (bool)',
    'function allowance(address, address) view returns (uint256)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
  ];

  constructor() {
    this.initializeSupportedCurrencies();
    this.initializePaymentMethods();
    this.startPriceUpdates();
    this.startPaymentProcessing();
    console.log('💰 Crypto Payment Service initialized with multi-chain support');
  }

  private initializeSupportedCurrencies(): void {
    const currencies: CryptoCurrency[] = [
      // Native currencies
      {
        id: 'ethereum',
        name: 'Ethereum',
        symbol: 'ETH',
        icon: '/assets/tokens/eth.png',
        decimals: 18,
        chainId: 1,
        isNative: true,
        isStablecoin: false,
        coingeckoId: 'ethereum',
        currentPrice: 0,
        priceChange24h: 0,
        marketCap: 0,
        volume24h: 0,
        isActive: true,
        minTransactionAmount: '0.001',
        maxTransactionAmount: '100',
        transactionFee: '0.01',
        confirmationTime: 180,
        categories: ['native', 'popular'],
        riskLevel: 'low',
      },
      {
        id: 'polygon',
        name: 'Polygon',
        symbol: 'MATIC',
        icon: '/assets/tokens/matic.png',
        decimals: 18,
        chainId: 137,
        isNative: true,
        isStablecoin: false,
        coingeckoId: 'matic-network',
        currentPrice: 0,
        priceChange24h: 0,
        marketCap: 0,
        volume24h: 0,
        isActive: true,
        minTransactionAmount: '1',
        maxTransactionAmount: '10000',
        transactionFee: '0.1',
        confirmationTime: 30,
        categories: ['native', 'low-fee'],
        riskLevel: 'low',
      },
      {
        id: 'binance-coin',
        name: 'BNB',
        symbol: 'BNB',
        icon: '/assets/tokens/bnb.png',
        decimals: 18,
        chainId: 56,
        isNative: true,
        isStablecoin: false,
        coingeckoId: 'binancecoin',
        currentPrice: 0,
        priceChange24h: 0,
        marketCap: 0,
        volume24h: 0,
        isActive: true,
        minTransactionAmount: '0.01',
        maxTransactionAmount: '1000',
        transactionFee: '0.005',
        confirmationTime: 15,
        categories: ['native', 'popular'],
        riskLevel: 'low',
      },
      // Stablecoins
      {
        id: 'usdc',
        name: 'USD Coin',
        symbol: 'USDC',
        icon: '/assets/tokens/usdc.png',
        decimals: 6,
        contractAddress: '0xA0b86a33E6442f05f23e3A1d8e1AD2b9e4b5A1dF',
        chainId: 1,
        isNative: false,
        isStablecoin: true,
        coingeckoId: 'usd-coin',
        currentPrice: 1,
        priceChange24h: 0,
        marketCap: 0,
        volume24h: 0,
        isActive: true,
        minTransactionAmount: '1',
        maxTransactionAmount: '100000',
        transactionFee: '0.5',
        confirmationTime: 180,
        categories: ['stablecoin', 'popular'],
        riskLevel: 'low',
      },
      {
        id: 'usdt',
        name: 'Tether',
        symbol: 'USDT',
        icon: '/assets/tokens/usdt.png',
        decimals: 6,
        contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        chainId: 1,
        isNative: false,
        isStablecoin: true,
        coingeckoId: 'tether',
        currentPrice: 1,
        priceChange24h: 0,
        marketCap: 0,
        volume24h: 0,
        isActive: true,
        minTransactionAmount: '1',
        maxTransactionAmount: '100000',
        transactionFee: '1',
        confirmationTime: 180,
        categories: ['stablecoin', 'popular'],
        riskLevel: 'low',
      },
      // Popular tokens
      {
        id: 'wrapped-bitcoin',
        name: 'Wrapped Bitcoin',
        symbol: 'WBTC',
        icon: '/assets/tokens/wbtc.png',
        decimals: 8,
        contractAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        chainId: 1,
        isNative: false,
        isStablecoin: false,
        coingeckoId: 'wrapped-bitcoin',
        currentPrice: 0,
        priceChange24h: 0,
        marketCap: 0,
        volume24h: 0,
        isActive: true,
        minTransactionAmount: '0.0001',
        maxTransactionAmount: '10',
        transactionFee: '0.0001',
        confirmationTime: 180,
        categories: ['bitcoin', 'popular'],
        riskLevel: 'low',
      },
    ];

    currencies.forEach(currency => {
      this.supportedCurrencies.set(currency.id, currency);
    });
  }

  private initializePaymentMethods(): void {
    const methods: PaymentMethod[] = [
      {
        id: 'crypto-wallet',
        name: 'Crypto Wallet',
        type: 'crypto',
        icon: '/assets/payments/crypto-wallet.png',
        description: 'Pay directly from your crypto wallet',
        supportedCurrencies: ['ETH', 'MATIC', 'BNB', 'USDC', 'USDT', 'WBTC'],
        supportedChains: [1, 137, 56, 43114, 250, 42161, 10],
        fees: { percentage: 0, fixed: '0', currency: 'ETH' },
        limits: { min: '0.001', max: '1000', daily: '10000', monthly: '100000' },
        processingTime: '1-5 minutes',
        isActive: true,
        requiresKYC: false,
        metadata: {
          provider: 'Web3',
          supportUrl: 'https://help.streammulti.com/crypto-payments',
        },
      },
      {
        id: 'card-payment',
        name: 'Credit/Debit Card',
        type: 'card',
        icon: '/assets/payments/card.png',
        description: 'Pay with your credit or debit card',
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY'],
        supportedChains: [1, 137, 56],
        fees: { percentage: 2.9, fixed: '0.30', currency: 'USD' },
        limits: { min: '1', max: '5000', daily: '10000', monthly: '50000' },
        processingTime: 'Instant',
        isActive: true,
        requiresKYC: true,
        metadata: {
          provider: 'Stripe',
          apiUrl: 'https://api.stripe.com/v1',
          supportUrl: 'https://help.streammulti.com/card-payments',
        },
      },
      {
        id: 'paypal',
        name: 'PayPal',
        type: 'paypal',
        icon: '/assets/payments/paypal.png',
        description: 'Pay with your PayPal account',
        supportedCurrencies: ['USD', 'EUR', 'GBP'],
        supportedChains: [1, 137],
        fees: { percentage: 3.5, fixed: '0.49', currency: 'USD' },
        limits: { min: '1', max: '10000', daily: '25000', monthly: '100000' },
        processingTime: 'Instant',
        isActive: true,
        requiresKYC: false,
        metadata: {
          provider: 'PayPal',
          apiUrl: 'https://api.paypal.com/v2',
          supportUrl: 'https://help.streammulti.com/paypal-payments',
        },
      },
      {
        id: 'apple-pay',
        name: 'Apple Pay',
        type: 'apple_pay',
        icon: '/assets/payments/apple-pay.png',
        description: 'Pay with Apple Pay',
        supportedCurrencies: ['USD', 'EUR', 'GBP'],
        supportedChains: [1, 137],
        fees: { percentage: 2.9, fixed: '0.30', currency: 'USD' },
        limits: { min: '1', max: '3000', daily: '10000', monthly: '50000' },
        processingTime: 'Instant',
        isActive: true,
        requiresKYC: false,
        metadata: {
          provider: 'Apple',
          supportUrl: 'https://help.streammulti.com/apple-pay',
        },
      },
      {
        id: 'google-pay',
        name: 'Google Pay',
        type: 'google_pay',
        icon: '/assets/payments/google-pay.png',
        description: 'Pay with Google Pay',
        supportedCurrencies: ['USD', 'EUR', 'GBP'],
        supportedChains: [1, 137],
        fees: { percentage: 2.9, fixed: '0.30', currency: 'USD' },
        limits: { min: '1', max: '3000', daily: '10000', monthly: '50000' },
        processingTime: 'Instant',
        isActive: true,
        requiresKYC: false,
        metadata: {
          provider: 'Google',
          supportUrl: 'https://help.streammulti.com/google-pay',
        },
      },
    ];

    methods.forEach(method => {
      this.paymentMethods.set(method.id, method);
    });
  }

  private startPriceUpdates(): void {
    // Update prices every minute
    setInterval(async () => {
      await this.updateCryptoPrices();
    }, 60000);

    // Initial price update
    this.updateCryptoPrices();
  }

  private startPaymentProcessing(): void {
    // Process pending payments every 30 seconds
    setInterval(async () => {
      await this.processPendingPayments();
    }, 30000);

    // Process subscriptions every hour
    setInterval(async () => {
      await this.processSubscriptions();
    }, 3600000);
  }

  // Price Management
  private async updateCryptoPrices(): Promise<void> {
    try {
      const coins = Array.from(this.supportedCurrencies.values())
        .filter(c => c.isActive && c.coingeckoId)
        .map(c => c.coingeckoId);

      if (coins.length === 0) return;

      const response = await fetch(
        `${this.coingeckoApiUrl}/simple/price?ids=${coins.join(',')}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }

      const prices = await response.json();

      for (const [id, currency] of this.supportedCurrencies) {
        const priceData = prices[currency.coingeckoId];
        if (priceData) {
          currency.currentPrice = priceData.usd;
          currency.priceChange24h = priceData.usd_24h_change || 0;
          currency.marketCap = priceData.usd_market_cap || 0;
          currency.volume24h = priceData.usd_24h_vol || 0;
          
          this.priceCache.set(id, {
            price: priceData.usd,
            timestamp: Date.now(),
          });
        }
      }

      console.log('✅ Crypto prices updated');
    } catch (error) {
      console.error('❌ Failed to update crypto prices:', error);
    }
  }

  public async getPrice(currencyId: string): Promise<number> {
    const cached = this.priceCache.get(currencyId);
    if (cached && Date.now() - cached.timestamp < this.priceCacheTimeout) {
      return cached.price;
    }

    const currency = this.supportedCurrencies.get(currencyId);
    if (!currency) {
      throw new Error(`Currency not supported: ${currencyId}`);
    }

    return currency.currentPrice;
  }

  public async convertCurrency(amount: string, fromCurrency: string, toCurrency: string): Promise<string> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const fromPrice = await this.getPrice(fromCurrency);
    const toPrice = await this.getPrice(toCurrency);

    if (fromPrice === 0 || toPrice === 0) {
      throw new Error('Price not available for conversion');
    }

    const amountNumber = parseFloat(amount);
    const convertedAmount = (amountNumber * fromPrice) / toPrice;

    return convertedAmount.toFixed(8);
  }

  // Payment Processing
  public async createPayment(params: {
    type: PaymentRequest['type'];
    amount: string;
    currency: string;
    chainId: number;
    to: string;
    recipientType: 'streamer' | 'platform' | 'creator' | 'marketplace';
    recipientId: string;
    recipientName: string;
    paymentMethod: string;
    metadata?: any;
  }): Promise<PaymentRequest | null> {
    console.log(`🔄 Creating payment: ${params.amount} ${params.currency}`);

    try {
      if (!blockchainService.isWalletConnected()) {
        throw new Error('Wallet not connected');
      }

      const wallet = blockchainService.getCurrentWallet();
      if (!wallet) {
        throw new Error('No wallet available');
      }

      const currency = this.supportedCurrencies.get(params.currency.toLowerCase());
      if (!currency) {
        throw new Error(`Currency not supported: ${params.currency}`);
      }

      const paymentMethod = this.paymentMethods.get(params.paymentMethod);
      if (!paymentMethod) {
        throw new Error(`Payment method not supported: ${params.paymentMethod}`);
      }

      const payment: PaymentRequest = {
        id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: params.type,
        amount: params.amount,
        currency: params.currency,
        chainId: params.chainId,
        from: wallet.address,
        to: params.to,
        recipient: {
          type: params.recipientType,
          id: params.recipientId,
          name: params.recipientName,
          address: params.to,
        },
        metadata: params.metadata || {},
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        confirmations: 0,
        requiredConfirmations: this.getRequiredConfirmations(params.chainId),
      };

      this.activePayments.set(payment.id, payment);

      // Calculate fees
      await this.calculateFees(payment);

      // Process payment based on method
      if (paymentMethod.type === 'crypto') {
        await this.processCryptoPayment(payment);
      } else {
        await this.processFiatPayment(payment, paymentMethod);
      }

      console.log(`✅ Payment created: ${payment.id}`);
      return payment;
    } catch (error) {
      console.error('❌ Failed to create payment:', error);
      return null;
    }
  }

  private async processCryptoPayment(payment: PaymentRequest): Promise<void> {
    try {
      payment.status = 'processing';
      payment.updatedAt = new Date().toISOString();

      const currency = this.supportedCurrencies.get(payment.currency.toLowerCase());
      if (!currency) {
        throw new Error('Currency not found');
      }

      let transactionHash: string;

      if (currency.isNative) {
        // Send native currency
        const transaction = await blockchainService.sendTransaction({
          to: payment.to,
          value: ethers.utils.parseEther(payment.amount).toString(),
          type: payment.type,
          metadata: {
            paymentId: payment.id,
            recipientType: payment.recipient.type,
            recipientId: payment.recipient.id,
          },
        });

        if (!transaction) {
          throw new Error('Transaction failed');
        }

        transactionHash = transaction.hash;
      } else {
        // Send ERC20 token
        const tokenAmount = ethers.utils.parseUnits(payment.amount, currency.decimals);
        
        const transaction = await blockchainService.callContract({
          address: currency.contractAddress!,
          abi: this.ERC20_ABI,
          functionName: 'transfer',
          functionParams: [payment.to, tokenAmount],
        });

        if (!transaction) {
          throw new Error('Token transfer failed');
        }

        transactionHash = transaction.hash;
      }

      payment.transactionHash = transactionHash;
      payment.status = 'processing';
      payment.updatedAt = new Date().toISOString();

      this.activePayments.set(payment.id, payment);

      // Send notification
      await notificationService.showNotification({
        id: `payment-sent-${payment.id}`,
        title: 'Payment Sent',
        body: `Your ${payment.amount} ${payment.currency} payment has been sent`,
        category: 'system',
      });

      console.log(`✅ Crypto payment processed: ${payment.id}`);
    } catch (error) {
      console.error('❌ Failed to process crypto payment:', error);
      payment.status = 'failed';
      payment.failureReason = error.message;
      payment.updatedAt = new Date().toISOString();
    }
  }

  private async processFiatPayment(payment: PaymentRequest, paymentMethod: PaymentMethod): Promise<void> {
    try {
      payment.status = 'processing';
      payment.updatedAt = new Date().toISOString();

      // Process fiat payment through payment processor
      const result = await this.processWithPaymentProcessor(payment, paymentMethod);
      
      if (result.success) {
        payment.status = 'completed';
        payment.transactionHash = result.transactionId;
        payment.completedAt = new Date().toISOString();
        payment.receipt = result.receipt;
        
        // Send notification
        await notificationService.showNotification({
          id: `payment-completed-${payment.id}`,
          title: 'Payment Completed',
          body: `Your ${payment.amount} ${payment.currency} payment has been completed`,
          category: 'system',
        });
      } else {
        payment.status = 'failed';
        payment.failureReason = result.error;
      }

      payment.updatedAt = new Date().toISOString();
      this.activePayments.set(payment.id, payment);

      console.log(`✅ Fiat payment processed: ${payment.id}`);
    } catch (error) {
      console.error('❌ Failed to process fiat payment:', error);
      payment.status = 'failed';
      payment.failureReason = error.message;
      payment.updatedAt = new Date().toISOString();
    }
  }

  private async processWithPaymentProcessor(payment: PaymentRequest, paymentMethod: PaymentMethod): Promise<any> {
    // Mock payment processor integration
    // In real implementation, this would integrate with Stripe, PayPal, etc.
    return {
      success: true,
      transactionId: `tx-${Date.now()}`,
      receipt: {
        id: `receipt-${Date.now()}`,
        amount: payment.amount,
        currency: payment.currency,
        status: 'completed',
        timestamp: new Date().toISOString(),
      },
    };
  }

  private async processPendingPayments(): Promise<void> {
    const pendingPayments = Array.from(this.activePayments.values())
      .filter(p => p.status === 'processing' && p.transactionHash);

    for (const payment of pendingPayments) {
      try {
        await this.checkPaymentStatus(payment);
      } catch (error) {
        console.error(`❌ Failed to check payment status: ${payment.id}`, error);
      }
    }
  }

  private async checkPaymentStatus(payment: PaymentRequest): Promise<void> {
    if (!payment.transactionHash) {
      return;
    }

    try {
      const transaction = await blockchainService.getTransactionStatus(payment.transactionHash);
      
      if (transaction) {
        if (transaction.status === 'confirmed') {
          payment.status = 'completed';
          payment.completedAt = new Date().toISOString();
          payment.confirmations = transaction.receipt?.blockNumber || 0;
          payment.gasUsed = transaction.receipt?.gasUsed || '0';
          payment.receipt = transaction.receipt;
          
          // Send completion notification
          await notificationService.showNotification({
            id: `payment-confirmed-${payment.id}`,
            title: 'Payment Confirmed',
            body: `Your ${payment.amount} ${payment.currency} payment has been confirmed`,
            category: 'system',
          });

          // Process revenue share if applicable
          if (payment.type === 'donation' || payment.type === 'tip') {
            await this.processRevenueShare(payment);
          }

          // Track analytics
          await analyticsService.updateViewerActivity(payment.from, {
            type: 'payment_completed',
            metadata: {
              paymentId: payment.id,
              amount: payment.amount,
              currency: payment.currency,
              type: payment.type,
              recipientType: payment.recipient.type,
              recipientId: payment.recipient.id,
            },
          });
        } else if (transaction.status === 'failed') {
          payment.status = 'failed';
          payment.failureReason = 'Transaction failed on blockchain';
          
          // Send failure notification
          await notificationService.showNotification({
            id: `payment-failed-${payment.id}`,
            title: 'Payment Failed',
            body: `Your ${payment.amount} ${payment.currency} payment has failed`,
            category: 'system',
            priority: 'high',
          });
        }

        payment.updatedAt = new Date().toISOString();
        this.activePayments.set(payment.id, payment);
      }
    } catch (error) {
      console.error('❌ Failed to check payment status:', error);
    }
  }

  // Subscription Management
  public async createSubscription(params: {
    streamerId: string;
    streamerName: string;
    platform: string;
    tier: string;
    tierName: string;
    amount: string;
    currency: string;
    chainId: number;
    interval: 'monthly' | 'yearly';
    paymentMethod: string;
    autoRenew: boolean;
    benefits: Subscription['benefits'];
  }): Promise<Subscription | null> {
    console.log(`🔄 Creating subscription: ${params.tierName} for ${params.streamerName}`);

    try {
      if (!blockchainService.isWalletConnected()) {
        throw new Error('Wallet not connected');
      }

      const wallet = blockchainService.getCurrentWallet();
      if (!wallet) {
        throw new Error('No wallet available');
      }

      const subscription: Subscription = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: wallet.address,
        streamerId: params.streamerId,
        streamerName: params.streamerName,
        platform: params.platform,
        tier: params.tier,
        tierName: params.tierName,
        amount: params.amount,
        currency: params.currency,
        chainId: params.chainId,
        interval: params.interval,
        status: 'active',
        startDate: new Date().toISOString(),
        nextPaymentDate: new Date(
          Date.now() + (params.interval === 'monthly' ? 30 * 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000)
        ).toISOString(),
        paymentMethod: params.paymentMethod,
        paymentHistory: [],
        benefits: params.benefits,
        autoRenew: params.autoRenew,
        gracePeriod: 7, // 7 days
        metadata: {},
      };

      // Process initial payment
      const payment = await this.createPayment({
        type: 'subscription',
        amount: params.amount,
        currency: params.currency,
        chainId: params.chainId,
        to: params.streamerId, // Streamer's wallet address
        recipientType: 'streamer',
        recipientId: params.streamerId,
        recipientName: params.streamerName,
        paymentMethod: params.paymentMethod,
        metadata: {
          subscriptionId: subscription.id,
          tier: params.tier,
          interval: params.interval,
        },
      });

      if (!payment) {
        throw new Error('Failed to process initial payment');
      }

      subscription.paymentHistory.push({
        date: new Date().toISOString(),
        amount: params.amount,
        currency: params.currency,
        transactionHash: payment.transactionHash || '',
        status: 'pending',
      });

      this.subscriptions.set(subscription.id, subscription);

      console.log(`✅ Subscription created: ${subscription.id}`);
      return subscription;
    } catch (error) {
      console.error('❌ Failed to create subscription:', error);
      return null;
    }
  }

  public async cancelSubscription(subscriptionId: string): Promise<boolean> {
    console.log(`🔄 Cancelling subscription: ${subscriptionId}`);

    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      subscription.status = 'cancelled';
      subscription.endDate = new Date().toISOString();
      subscription.autoRenew = false;

      this.subscriptions.set(subscriptionId, subscription);

      // Send notification
      await notificationService.showNotification({
        id: `subscription-cancelled-${subscriptionId}`,
        title: 'Subscription Cancelled',
        body: `Your subscription to ${subscription.streamerName} has been cancelled`,
        category: 'system',
      });

      console.log(`✅ Subscription cancelled: ${subscriptionId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to cancel subscription:', error);
      return false;
    }
  }

  private async processSubscriptions(): Promise<void> {
    const activeSubscriptions = Array.from(this.subscriptions.values())
      .filter(s => s.status === 'active' && s.autoRenew && new Date(s.nextPaymentDate) <= new Date());

    for (const subscription of activeSubscriptions) {
      try {
        await this.processSubscriptionRenewal(subscription);
      } catch (error) {
        console.error(`❌ Failed to process subscription renewal: ${subscription.id}`, error);
      }
    }
  }

  private async processSubscriptionRenewal(subscription: Subscription): Promise<void> {
    console.log(`🔄 Processing subscription renewal: ${subscription.id}`);

    try {
      const payment = await this.createPayment({
        type: 'subscription',
        amount: subscription.amount,
        currency: subscription.currency,
        chainId: subscription.chainId,
        to: subscription.streamerId,
        recipientType: 'streamer',
        recipientId: subscription.streamerId,
        recipientName: subscription.streamerName,
        paymentMethod: subscription.paymentMethod,
        metadata: {
          subscriptionId: subscription.id,
          tier: subscription.tier,
          interval: subscription.interval,
          renewal: true,
        },
      });

      if (payment) {
        subscription.paymentHistory.push({
          date: new Date().toISOString(),
          amount: subscription.amount,
          currency: subscription.currency,
          transactionHash: payment.transactionHash || '',
          status: 'pending',
        });

        // Update next payment date
        subscription.nextPaymentDate = new Date(
          Date.now() + (subscription.interval === 'monthly' ? 30 * 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000)
        ).toISOString();

        this.subscriptions.set(subscription.id, subscription);

        console.log(`✅ Subscription renewed: ${subscription.id}`);
      } else {
        // Payment failed, set grace period
        subscription.status = 'paused';
        subscription.endDate = new Date(Date.now() + subscription.gracePeriod * 24 * 60 * 60 * 1000).toISOString();
        this.subscriptions.set(subscription.id, subscription);

        // Send notification
        await notificationService.showNotification({
          id: `subscription-payment-failed-${subscription.id}`,
          title: 'Subscription Payment Failed',
          body: `Your subscription to ${subscription.streamerName} payment failed. Please update your payment method.`,
          category: 'system',
          priority: 'high',
        });
      }
    } catch (error) {
      console.error('❌ Failed to process subscription renewal:', error);
    }
  }

  // Revenue Share Management
  private async processRevenueShare(payment: PaymentRequest): Promise<void> {
    console.log(`🔄 Processing revenue share for payment: ${payment.id}`);

    try {
      // Get or create revenue share configuration
      const revenueShare = await this.getOrCreateRevenueShare(payment);
      
      if (!revenueShare) {
        console.log('No revenue share configuration found');
        return;
      }

      // Add payment to revenue share
      const paymentAmount = parseFloat(payment.amount);
      const pendingAmount = parseFloat(revenueShare.pendingAmount);
      revenueShare.pendingAmount = (pendingAmount + paymentAmount).toString();
      revenueShare.totalRevenue = (parseFloat(revenueShare.totalRevenue) + paymentAmount).toString();
      revenueShare.updatedAt = new Date().toISOString();

      this.revenueShares.set(revenueShare.id, revenueShare);

      // Check if auto-distribution is enabled and threshold is met
      if (revenueShare.autoDistribution && 
          parseFloat(revenueShare.pendingAmount) >= parseFloat(revenueShare.minimumThreshold)) {
        await this.distributeRevenue(revenueShare);
      }

      console.log(`✅ Revenue share updated: ${revenueShare.id}`);
    } catch (error) {
      console.error('❌ Failed to process revenue share:', error);
    }
  }

  private async getOrCreateRevenueShare(payment: PaymentRequest): Promise<RevenueShare | null> {
    // Look for existing revenue share
    const existing = Array.from(this.revenueShares.values())
      .find(rs => rs.streamerId === payment.recipient.id);

    if (existing) {
      return existing;
    }

    // Create new revenue share
    const revenueShare: RevenueShare = {
      id: `revenue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      streamId: payment.metadata.streamId || 'unknown',
      streamerId: payment.recipient.id,
      totalRevenue: '0',
      currency: payment.currency,
      chainId: payment.chainId,
      distribution: {
        streamer: {
          address: payment.recipient.address,
          percentage: 70,
          amount: '0',
        },
        platform: {
          address: '0x1234567890123456789012345678901234567890', // Platform address
          percentage: 25,
          amount: '0',
        },
        moderators: [],
        charity: {
          address: '0x0987654321098765432109876543210987654321', // Charity address
          percentage: 5,
          amount: '0',
        },
      },
      autoDistribution: true,
      distributionFrequency: 'weekly',
      minimumThreshold: '100', // $100 threshold
      pendingAmount: '0',
      distributedAmount: '0',
      transactionHashes: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.revenueShares.set(revenueShare.id, revenueShare);
    return revenueShare;
  }

  private async distributeRevenue(revenueShare: RevenueShare): Promise<void> {
    console.log(`🔄 Distributing revenue: ${revenueShare.id}`);

    try {
      const pendingAmount = parseFloat(revenueShare.pendingAmount);
      
      // Calculate distribution amounts
      const streamerAmount = (pendingAmount * revenueShare.distribution.streamer.percentage / 100);
      const platformAmount = (pendingAmount * revenueShare.distribution.platform.percentage / 100);
      const charityAmount = (pendingAmount * revenueShare.distribution.charity.percentage / 100);

      // Send payments
      const transactions = [];

      // Pay streamer
      if (streamerAmount > 0) {
        const streamerPayment = await this.createPayment({
          type: 'revenue_share',
          amount: streamerAmount.toString(),
          currency: revenueShare.currency,
          chainId: revenueShare.chainId,
          to: revenueShare.distribution.streamer.address,
          recipientType: 'streamer',
          recipientId: revenueShare.streamerId,
          recipientName: 'Streamer',
          paymentMethod: 'crypto-wallet',
          metadata: {
            revenueShareId: revenueShare.id,
            distributionType: 'streamer',
            percentage: revenueShare.distribution.streamer.percentage,
          },
        });

        if (streamerPayment) {
          transactions.push(streamerPayment.transactionHash);
        }
      }

      // Pay platform
      if (platformAmount > 0) {
        const platformPayment = await this.createPayment({
          type: 'revenue_share',
          amount: platformAmount.toString(),
          currency: revenueShare.currency,
          chainId: revenueShare.chainId,
          to: revenueShare.distribution.platform.address,
          recipientType: 'platform',
          recipientId: 'platform',
          recipientName: 'Platform',
          paymentMethod: 'crypto-wallet',
          metadata: {
            revenueShareId: revenueShare.id,
            distributionType: 'platform',
            percentage: revenueShare.distribution.platform.percentage,
          },
        });

        if (platformPayment) {
          transactions.push(platformPayment.transactionHash);
        }
      }

      // Pay charity
      if (charityAmount > 0) {
        const charityPayment = await this.createPayment({
          type: 'revenue_share',
          amount: charityAmount.toString(),
          currency: revenueShare.currency,
          chainId: revenueShare.chainId,
          to: revenueShare.distribution.charity.address,
          recipientType: 'charity',
          recipientId: 'charity',
          recipientName: 'Charity',
          paymentMethod: 'crypto-wallet',
          metadata: {
            revenueShareId: revenueShare.id,
            distributionType: 'charity',
            percentage: revenueShare.distribution.charity.percentage,
          },
        });

        if (charityPayment) {
          transactions.push(charityPayment.transactionHash);
        }
      }

      // Update revenue share
      revenueShare.distributedAmount = (parseFloat(revenueShare.distributedAmount) + pendingAmount).toString();
      revenueShare.pendingAmount = '0';
      revenueShare.lastDistributionDate = new Date().toISOString();
      revenueShare.transactionHashes.push(...transactions.filter(tx => tx));
      revenueShare.updatedAt = new Date().toISOString();

      this.revenueShares.set(revenueShare.id, revenueShare);

      console.log(`✅ Revenue distributed: ${revenueShare.id}`);
    } catch (error) {
      console.error('❌ Failed to distribute revenue:', error);
    }
  }

  // Utility Methods
  private calculateFees(payment: PaymentRequest): void {
    const paymentMethod = this.paymentMethods.get(payment.metadata.paymentMethod);
    if (!paymentMethod) {
      return;
    }

    const amount = parseFloat(payment.amount);
    const percentageFee = (amount * paymentMethod.fees.percentage / 100);
    const fixedFee = parseFloat(paymentMethod.fees.fixed);
    const totalFee = percentageFee + fixedFee;

    payment.platformFee = totalFee.toString();
    payment.networkFee = '0'; // Will be calculated based on gas
    payment.totalFee = totalFee.toString();
  }

  private getRequiredConfirmations(chainId: number): number {
    const network = blockchainService.getNetworkById(chainId);
    return network?.confirmations || 12;
  }

  // Public API Methods
  public getSupportedCurrencies(): CryptoCurrency[] {
    return Array.from(this.supportedCurrencies.values()).filter(c => c.isActive);
  }

  public getSupportedPaymentMethods(): PaymentMethod[] {
    return Array.from(this.paymentMethods.values()).filter(m => m.isActive);
  }

  public async getPayment(paymentId: string): Promise<PaymentRequest | null> {
    return this.activePayments.get(paymentId) || null;
  }

  public async getPaymentHistory(userId: string): Promise<PaymentRequest[]> {
    return Array.from(this.activePayments.values())
      .filter(p => p.from === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }

  public async getStreamingRevenue(streamerId: string): Promise<RevenueShare[]> {
    return Array.from(this.revenueShares.values())
      .filter(rs => rs.streamerId === streamerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getPaymentAnalytics(params: {
    userId?: string;
    streamerId?: string;
    startDate: string;
    endDate: string;
    currency?: string;
    chainId?: number;
  }): Promise<PaymentAnalytics | null> {
    try {
      const payments = Array.from(this.activePayments.values())
        .filter(p => {
          const paymentDate = new Date(p.createdAt);
          const startDate = new Date(params.startDate);
          const endDate = new Date(params.endDate);
          
          return paymentDate >= startDate && paymentDate <= endDate &&
                 (!params.userId || p.from === params.userId) &&
                 (!params.streamerId || p.recipient.id === params.streamerId) &&
                 (!params.currency || p.currency === params.currency) &&
                 (!params.chainId || p.chainId === params.chainId);
        });

      if (payments.length === 0) {
        return null;
      }

      const totalVolume = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const totalTransactions = payments.length;
      const averageTransactionValue = totalVolume / totalTransactions;

      const analytics: PaymentAnalytics = {
        totalVolume: totalVolume.toString(),
        totalTransactions,
        averageTransactionValue: averageTransactionValue.toString(),
        currency: params.currency || 'USD',
        chainId: params.chainId || 1,
        period: {
          start: params.startDate,
          end: params.endDate,
        },
        breakdown: {
          donations: { count: 0, volume: '0' },
          subscriptions: { count: 0, volume: '0' },
          nftPurchases: { count: 0, volume: '0' },
          tips: { count: 0, volume: '0' },
          other: { count: 0, volume: '0' },
        },
        topCurrencies: [],
        topStreamers: [],
        trends: {
          hourly: [],
          daily: [],
          weekly: [],
          monthly: [],
        },
        conversions: {
          fiatToCrypto: 0,
          cryptoToFiat: 0,
          crossChain: 0,
        },
      };

      // Calculate breakdown by type
      payments.forEach(payment => {
        const amount = parseFloat(payment.amount);
        switch (payment.type) {
          case 'donation':
            analytics.breakdown.donations.count++;
            analytics.breakdown.donations.volume = (parseFloat(analytics.breakdown.donations.volume) + amount).toString();
            break;
          case 'subscription':
            analytics.breakdown.subscriptions.count++;
            analytics.breakdown.subscriptions.volume = (parseFloat(analytics.breakdown.subscriptions.volume) + amount).toString();
            break;
          case 'nft_purchase':
            analytics.breakdown.nftPurchases.count++;
            analytics.breakdown.nftPurchases.volume = (parseFloat(analytics.breakdown.nftPurchases.volume) + amount).toString();
            break;
          case 'tip':
            analytics.breakdown.tips.count++;
            analytics.breakdown.tips.volume = (parseFloat(analytics.breakdown.tips.volume) + amount).toString();
            break;
          default:
            analytics.breakdown.other.count++;
            analytics.breakdown.other.volume = (parseFloat(analytics.breakdown.other.volume) + amount).toString();
            break;
        }
      });

      return analytics;
    } catch (error) {
      console.error('❌ Failed to get payment analytics:', error);
      return null;
    }
  }
}

export const cryptoPaymentService = new CryptoPaymentService();
export default cryptoPaymentService;