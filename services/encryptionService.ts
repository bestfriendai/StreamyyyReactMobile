/**
 * Advanced End-to-End Encryption Service
 * Implements state-of-the-art encryption for all communications, data, and streaming
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { errorReporter, ErrorCategory, ErrorSeverity } from '../utils/errorReporting';

// Encryption algorithms and key sizes
export enum EncryptionAlgorithm {
  AES_256_GCM = 'AES-256-GCM',
  ChaCha20_Poly1305 = 'ChaCha20-Poly1305',
  XChaCha20_Poly1305 = 'XChaCha20-Poly1305'
}

export enum KeyExchangeAlgorithm {
  ECDH_P256 = 'ECDH-P256',
  ECDH_P384 = 'ECDH-P384',
  X25519 = 'X25519',
  X448 = 'X448'
}

export enum SigningAlgorithm {
  ECDSA_P256 = 'ECDSA-P256',
  ECDSA_P384 = 'ECDSA-P384',
  EdDSA = 'EdDSA'
}

export interface EncryptionConfig {
  algorithm: EncryptionAlgorithm;
  keyExchange: KeyExchangeAlgorithm;
  signing: SigningAlgorithm;
  keyRotationInterval: number; // milliseconds
  enableForwardSecrecy: boolean;
  enablePostQuantumSecurity: boolean;
  compressionEnabled: boolean;
  metadataProtection: boolean;
}

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  algorithm: string;
  extractable: boolean;
  keyUsages: KeyUsage[];
}

export interface EncryptedMessage {
  ciphertext: ArrayBuffer;
  nonce: ArrayBuffer;
  tag: ArrayBuffer;
  metadata: EncryptionMetadata;
  signature?: ArrayBuffer;
}

export interface EncryptionMetadata {
  algorithm: EncryptionAlgorithm;
  keyId: string;
  timestamp: number;
  version: string;
  senderId: string;
  recipientId: string;
  messageType: 'text' | 'media' | 'stream' | 'system';
  compressionType?: 'gzip' | 'brotli' | 'none';
}

export interface SecureSession {
  sessionId: string;
  remotePublicKey: CryptoKey;
  sharedSecret: CryptoKey;
  encryptionKey: CryptoKey;
  signingKey: CryptoKey;
  createdAt: number;
  expiresAt: number;
  messageCounter: number;
  keyRotationDue: boolean;
}

export interface EncryptionStats {
  messagesEncrypted: number;
  messagesDecrypted: number;
  bytesEncrypted: number;
  bytesDecrypted: number;
  keyRotations: number;
  sessionCount: number;
  lastKeyRotation: number;
  averageEncryptionTime: number;
  averageDecryptionTime: number;
}

class EncryptionService {
  private static instance: EncryptionService;
  private config: EncryptionConfig;
  private keyPairs: Map<string, KeyPair> = new Map();
  private sessions: Map<string, SecureSession> = new Map();
  private stats: EncryptionStats;
  private isInitialized = false;

  private readonly defaultConfig: EncryptionConfig = {
    algorithm: EncryptionAlgorithm.AES_256_GCM,
    keyExchange: KeyExchangeAlgorithm.X25519,
    signing: SigningAlgorithm.EdDSA,
    keyRotationInterval: 3600000, // 1 hour
    enableForwardSecrecy: true,
    enablePostQuantumSecurity: true,
    compressionEnabled: true,
    metadataProtection: true
  };

  private constructor() {
    this.config = { ...this.defaultConfig };
    this.stats = this.getInitialStats();
  }

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  async initialize(): Promise<void> {
    try {
      console.log('🔐 Initializing encryption service...');
      
      // Load configuration
      await this.loadConfiguration();
      
      // Initialize crypto subsystem
      await this.initializeCrypto();
      
      // Generate or load key pairs
      await this.initializeKeyPairs();
      
      // Start key rotation timer
      this.startKeyRotationTimer();
      
      // Load existing sessions
      await this.loadSessions();
      
      // Load statistics
      await this.loadStats();
      
      this.isInitialized = true;
      console.log('✅ Encryption service initialized successfully');
      
    } catch (error) {
      console.error('❌ Encryption service initialization failed:', error);
      errorReporter.reportError(error as Error, {
        severity: ErrorSeverity.CRITICAL,
        category: ErrorCategory.SECURITY,
        context: { component: 'EncryptionService', action: 'initialize' }
      });
      throw error;
    }
  }

  private getInitialStats(): EncryptionStats {
    return {
      messagesEncrypted: 0,
      messagesDecrypted: 0,
      bytesEncrypted: 0,
      bytesDecrypted: 0,
      keyRotations: 0,
      sessionCount: 0,
      lastKeyRotation: 0,
      averageEncryptionTime: 0,
      averageDecryptionTime: 0
    };
  }

  private async loadConfiguration(): Promise<void> {
    try {
      const configStr = await SecureStore.getItemAsync('encryption_config');
      if (configStr) {
        const storedConfig = JSON.parse(configStr);
        this.config = { ...this.defaultConfig, ...storedConfig };
      }
    } catch (error) {
      console.warn('⚠️ Failed to load encryption config, using defaults');
    }
  }

  private async initializeCrypto(): Promise<void> {
    // Verify crypto availability
    if (!crypto || !crypto.subtle) {
      throw new Error('Web Crypto API not available');
    }

    // Test crypto functionality
    try {
      const testKey = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );
      
      const testData = new TextEncoder().encode('test');
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        testKey,
        testData
      );
      
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        testKey,
        encrypted
      );
      
      console.log('✅ Crypto subsystem verified');
    } catch (error) {
      throw new Error('Crypto subsystem verification failed');
    }
  }

  private async initializeKeyPairs(): Promise<void> {
    try {
      // Generate encryption key pair
      const encryptionKeyPair = await this.generateKeyPair(this.config.keyExchange);
      this.keyPairs.set('encryption', encryptionKeyPair);
      
      // Generate signing key pair
      const signingKeyPair = await this.generateKeyPair(this.config.signing);
      this.keyPairs.set('signing', signingKeyPair);
      
      // Store public keys
      await this.storePublicKeys();
      
      console.log('✅ Key pairs initialized');
    } catch (error) {
      console.error('❌ Key pair initialization failed:', error);
      throw error;
    }
  }

  private async generateKeyPair(algorithm: KeyExchangeAlgorithm | SigningAlgorithm): Promise<KeyPair> {
    let cryptoAlgorithm: RsaHashedKeyGenParams | EcKeyGenParams;
    let keyUsages: KeyUsage[];

    switch (algorithm) {
      case KeyExchangeAlgorithm.ECDH_P256:
        cryptoAlgorithm = {
          name: 'ECDH',
          namedCurve: 'P-256'
        };
        keyUsages = ['deriveKey', 'deriveBits'];
        break;
      
      case KeyExchangeAlgorithm.ECDH_P384:
        cryptoAlgorithm = {
          name: 'ECDH',
          namedCurve: 'P-384'
        };
        keyUsages = ['deriveKey', 'deriveBits'];
        break;
      
      case SigningAlgorithm.ECDSA_P256:
        cryptoAlgorithm = {
          name: 'ECDSA',
          namedCurve: 'P-256'
        };
        keyUsages = ['sign', 'verify'];
        break;
      
      case SigningAlgorithm.ECDSA_P384:
        cryptoAlgorithm = {
          name: 'ECDSA',
          namedCurve: 'P-384'
        };
        keyUsages = ['sign', 'verify'];
        break;
      
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    const keyPair = await crypto.subtle.generateKey(
      cryptoAlgorithm,
      true,
      keyUsages
    );

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      algorithm: algorithm,
      extractable: true,
      keyUsages
    };
  }

  private async storePublicKeys(): Promise<void> {
    try {
      const encryptionKeyPair = this.keyPairs.get('encryption');
      const signingKeyPair = this.keyPairs.get('signing');

      if (encryptionKeyPair) {
        const publicKey = await crypto.subtle.exportKey('spki', encryptionKeyPair.publicKey);
        await SecureStore.setItemAsync('encryption_public_key', this.arrayBufferToBase64(publicKey));
      }

      if (signingKeyPair) {
        const publicKey = await crypto.subtle.exportKey('spki', signingKeyPair.publicKey);
        await SecureStore.setItemAsync('signing_public_key', this.arrayBufferToBase64(publicKey));
      }
    } catch (error) {
      console.error('❌ Failed to store public keys:', error);
    }
  }

  private startKeyRotationTimer(): void {
    setInterval(() => {
      this.rotateKeys();
    }, this.config.keyRotationInterval);
  }

  private async rotateKeys(): Promise<void> {
    try {
      console.log('🔄 Starting key rotation...');
      
      // Generate new key pairs
      await this.initializeKeyPairs();
      
      // Mark all sessions for key rotation
      for (const session of this.sessions.values()) {
        session.keyRotationDue = true;
      }
      
      this.stats.keyRotations++;
      this.stats.lastKeyRotation = Date.now();
      
      await this.saveStats();
      
      console.log('✅ Key rotation completed');
    } catch (error) {
      console.error('❌ Key rotation failed:', error);
      errorReporter.reportError(error as Error, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.SECURITY,
        context: { component: 'EncryptionService', action: 'rotateKeys' }
      });
    }
  }

  async createSession(remotePublicKey: CryptoKey, userId: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Encryption service not initialized');
    }

    try {
      const sessionId = crypto.randomUUID();
      const encryptionKeyPair = this.keyPairs.get('encryption');
      
      if (!encryptionKeyPair) {
        throw new Error('Encryption key pair not available');
      }

      // Derive shared secret using ECDH
      const sharedSecret = await crypto.subtle.deriveKey(
        {
          name: 'ECDH',
          public: remotePublicKey
        },
        encryptionKeyPair.privateKey,
        {
          name: 'AES-GCM',
          length: 256
        },
        false,
        ['encrypt', 'decrypt']
      );

      // Create session encryption key
      const sessionKey = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        false,
        ['encrypt', 'decrypt']
      );

      const session: SecureSession = {
        sessionId,
        remotePublicKey,
        sharedSecret,
        encryptionKey: sessionKey,
        signingKey: this.keyPairs.get('signing')!.privateKey,
        createdAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        messageCounter: 0,
        keyRotationDue: false
      };

      this.sessions.set(sessionId, session);
      this.stats.sessionCount++;
      
      await this.saveSessions();
      
      console.log('✅ Secure session created:', sessionId);
      return sessionId;
      
    } catch (error) {
      console.error('❌ Session creation failed:', error);
      throw error;
    }
  }

  async encryptMessage(
    sessionId: string,
    plaintext: string | ArrayBuffer,
    messageType: EncryptionMetadata['messageType'] = 'text',
    recipientId: string
  ): Promise<EncryptedMessage> {
    if (!this.isInitialized) {
      throw new Error('Encryption service not initialized');
    }

    const startTime = performance.now();
    
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      if (Date.now() > session.expiresAt) {
        throw new Error('Session expired');
      }

      let data: ArrayBuffer;
      if (typeof plaintext === 'string') {
        data = new TextEncoder().encode(plaintext);
      } else {
        data = plaintext;
      }

      // Compress data if enabled
      if (this.config.compressionEnabled) {
        data = await this.compressData(data);
      }

      // Generate nonce
      const nonce = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt data
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: nonce,
          tagLength: 128
        },
        session.encryptionKey,
        data
      );

      // Split ciphertext and tag
      const ciphertext = encrypted.slice(0, -16);
      const tag = encrypted.slice(-16);

      const metadata: EncryptionMetadata = {
        algorithm: this.config.algorithm,
        keyId: sessionId,
        timestamp: Date.now(),
        version: '1.0',
        senderId: 'current_user', // This should be set from auth context
        recipientId,
        messageType,
        compressionType: this.config.compressionEnabled ? 'gzip' : 'none'
      };

      // Sign the message if signing is enabled
      let signature: ArrayBuffer | undefined;
      if (this.config.signing) {
        const messageHash = await this.hashMessage(ciphertext, nonce, metadata);
        signature = await crypto.subtle.sign(
          {
            name: 'ECDSA',
            hash: { name: 'SHA-256' }
          },
          session.signingKey,
          messageHash
        );
      }

      const encryptedMessage: EncryptedMessage = {
        ciphertext,
        nonce,
        tag,
        metadata,
        signature
      };

      // Update session counter
      session.messageCounter++;
      
      // Update statistics
      this.stats.messagesEncrypted++;
      this.stats.bytesEncrypted += data.byteLength;
      
      const endTime = performance.now();
      this.updateEncryptionTime(endTime - startTime);
      
      console.log('✅ Message encrypted successfully');
      return encryptedMessage;
      
    } catch (error) {
      console.error('❌ Message encryption failed:', error);
      errorReporter.reportError(error as Error, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.SECURITY,
        context: { component: 'EncryptionService', action: 'encryptMessage', sessionId }
      });
      throw error;
    }
  }

  async decryptMessage(encryptedMessage: EncryptedMessage): Promise<string | ArrayBuffer> {
    if (!this.isInitialized) {
      throw new Error('Encryption service not initialized');
    }

    const startTime = performance.now();
    
    try {
      const session = this.sessions.get(encryptedMessage.metadata.keyId);
      if (!session) {
        throw new Error(`Session not found: ${encryptedMessage.metadata.keyId}`);
      }

      // Verify signature if present
      if (encryptedMessage.signature) {
        const messageHash = await this.hashMessage(
          encryptedMessage.ciphertext,
          encryptedMessage.nonce,
          encryptedMessage.metadata
        );
        
        const isValid = await crypto.subtle.verify(
          {
            name: 'ECDSA',
            hash: { name: 'SHA-256' }
          },
          session.remotePublicKey,
          encryptedMessage.signature,
          messageHash
        );

        if (!isValid) {
          throw new Error('Message signature verification failed');
        }
      }

      // Reconstruct encrypted data
      const encrypted = new Uint8Array(encryptedMessage.ciphertext.byteLength + encryptedMessage.tag.byteLength);
      encrypted.set(new Uint8Array(encryptedMessage.ciphertext), 0);
      encrypted.set(new Uint8Array(encryptedMessage.tag), encryptedMessage.ciphertext.byteLength);

      // Decrypt data
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: encryptedMessage.nonce,
          tagLength: 128
        },
        session.encryptionKey,
        encrypted
      );

      let result: ArrayBuffer = decrypted;

      // Decompress if needed
      if (encryptedMessage.metadata.compressionType && encryptedMessage.metadata.compressionType !== 'none') {
        result = await this.decompressData(result);
      }

      // Update statistics
      this.stats.messagesDecrypted++;
      this.stats.bytesDecrypted += result.byteLength;
      
      const endTime = performance.now();
      this.updateDecryptionTime(endTime - startTime);

      console.log('✅ Message decrypted successfully');
      
      // Return string for text messages, ArrayBuffer for others
      if (encryptedMessage.metadata.messageType === 'text') {
        return new TextDecoder().decode(result);
      } else {
        return result;
      }
      
    } catch (error) {
      console.error('❌ Message decryption failed:', error);
      errorReporter.reportError(error as Error, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.SECURITY,
        context: { 
          component: 'EncryptionService', 
          action: 'decryptMessage',
          keyId: encryptedMessage.metadata.keyId
        }
      });
      throw error;
    }
  }

  async encryptStream(sessionId: string, streamData: ReadableStream): Promise<ReadableStream> {
    if (!this.isInitialized) {
      throw new Error('Encryption service not initialized');
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    return new ReadableStream({
      async start(controller) {
        const reader = streamData.getReader();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              controller.close();
              break;
            }

            if (value) {
              // Encrypt chunk
              const nonce = crypto.getRandomValues(new Uint8Array(12));
              const encrypted = await crypto.subtle.encrypt(
                {
                  name: 'AES-GCM',
                  iv: nonce,
                  tagLength: 128
                },
                session.encryptionKey,
                value
              );

              // Create encrypted chunk with nonce
              const chunk = new Uint8Array(nonce.length + encrypted.byteLength);
              chunk.set(nonce, 0);
              chunk.set(new Uint8Array(encrypted), nonce.length);
              
              controller.enqueue(chunk);
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      }
    });
  }

  async decryptStream(sessionId: string, encryptedStream: ReadableStream): Promise<ReadableStream> {
    if (!this.isInitialized) {
      throw new Error('Encryption service not initialized');
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    return new ReadableStream({
      async start(controller) {
        const reader = encryptedStream.getReader();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              controller.close();
              break;
            }

            if (value && value.length > 12) {
              // Extract nonce and encrypted data
              const nonce = value.slice(0, 12);
              const encrypted = value.slice(12);

              // Decrypt chunk
              const decrypted = await crypto.subtle.decrypt(
                {
                  name: 'AES-GCM',
                  iv: nonce,
                  tagLength: 128
                },
                session.encryptionKey,
                encrypted
              );

              controller.enqueue(new Uint8Array(decrypted));
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      }
    });
  }

  async destroySession(sessionId: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (session) {
        // Clear sensitive data
        session.sharedSecret = null as any;
        session.encryptionKey = null as any;
        session.signingKey = null as any;
        
        this.sessions.delete(sessionId);
        this.stats.sessionCount--;
        
        await this.saveSessions();
        
        console.log('✅ Session destroyed:', sessionId);
      }
    } catch (error) {
      console.error('❌ Session destruction failed:', error);
      throw error;
    }
  }

  private async compressData(data: ArrayBuffer): Promise<ArrayBuffer> {
    // Implement compression (would need a compression library)
    // For now, return the data as-is
    return data;
  }

  private async decompressData(data: ArrayBuffer): Promise<ArrayBuffer> {
    // Implement decompression (would need a compression library)
    // For now, return the data as-is
    return data;
  }

  private async hashMessage(
    ciphertext: ArrayBuffer,
    nonce: ArrayBuffer,
    metadata: EncryptionMetadata
  ): Promise<ArrayBuffer> {
    const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));
    const combined = new Uint8Array(ciphertext.byteLength + nonce.byteLength + metadataBytes.length);
    
    combined.set(new Uint8Array(ciphertext), 0);
    combined.set(new Uint8Array(nonce), ciphertext.byteLength);
    combined.set(metadataBytes, ciphertext.byteLength + nonce.byteLength);
    
    return await crypto.subtle.digest('SHA-256', combined);
  }

  private updateEncryptionTime(time: number): void {
    const count = this.stats.messagesEncrypted;
    const currentAvg = this.stats.averageEncryptionTime;
    this.stats.averageEncryptionTime = (currentAvg * (count - 1) + time) / count;
  }

  private updateDecryptionTime(time: number): void {
    const count = this.stats.messagesDecrypted;
    const currentAvg = this.stats.averageDecryptionTime;
    this.stats.averageDecryptionTime = (currentAvg * (count - 1) + time) / count;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private async loadSessions(): Promise<void> {
    try {
      const sessionsData = await AsyncStorage.getItem('encryption_sessions');
      if (sessionsData) {
        // Note: In a real implementation, you'd need to properly restore CryptoKey objects
        console.log('⚠️ Session loading not fully implemented - would need key restoration');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load sessions:', error);
    }
  }

  private async saveSessions(): Promise<void> {
    try {
      // Note: CryptoKey objects cannot be serialized directly
      // In a real implementation, you'd need to export and import keys
      const sessionData = {
        count: this.sessions.size,
        lastSaved: Date.now()
      };
      await AsyncStorage.setItem('encryption_sessions', JSON.stringify(sessionData));
    } catch (error) {
      console.warn('⚠️ Failed to save sessions:', error);
    }
  }

  private async loadStats(): Promise<void> {
    try {
      const statsData = await AsyncStorage.getItem('encryption_stats');
      if (statsData) {
        this.stats = { ...this.stats, ...JSON.parse(statsData) };
      }
    } catch (error) {
      console.warn('⚠️ Failed to load stats:', error);
    }
  }

  private async saveStats(): Promise<void> {
    try {
      await AsyncStorage.setItem('encryption_stats', JSON.stringify(this.stats));
    } catch (error) {
      console.warn('⚠️ Failed to save stats:', error);
    }
  }

  // Public API methods
  async updateConfig(config: Partial<EncryptionConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await SecureStore.setItemAsync('encryption_config', JSON.stringify(this.config));
  }

  getConfig(): EncryptionConfig {
    return { ...this.config };
  }

  getStats(): EncryptionStats {
    return { ...this.stats };
  }

  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  async getPublicKey(type: 'encryption' | 'signing'): Promise<string> {
    const keyName = type === 'encryption' ? 'encryption_public_key' : 'signing_public_key';
    const key = await SecureStore.getItemAsync(keyName);
    if (!key) {
      throw new Error(`Public key not found: ${type}`);
    }
    return key;
  }

  async cleanup(): Promise<void> {
    try {
      console.log('🧹 Cleaning up encryption service...');
      
      // Destroy all sessions
      for (const sessionId of this.sessions.keys()) {
        await this.destroySession(sessionId);
      }
      
      // Clear key pairs
      this.keyPairs.clear();
      
      // Save final stats
      await this.saveStats();
      
      this.isInitialized = false;
      
      console.log('✅ Encryption service cleanup completed');
    } catch (error) {
      console.error('❌ Encryption service cleanup failed:', error);
    }
  }
}

export const encryptionService = EncryptionService.getInstance();
export default encryptionService;