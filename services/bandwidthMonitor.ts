/**
 * Simplified Bandwidth Monitor Service
 * Stub implementation to prevent circular dependencies
 */

export interface NetworkConnection {
  effectiveType: '2g' | '3g' | '4g' | 'unknown';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface BandwidthMetrics {
  timestamp: number;
  downloadSpeed: number;
  uploadSpeed: number;
  latency: number;
  jitter: number;
  packetLoss: number;
  connectionType: string;
  isStable: boolean;
}

class BandwidthMonitor {
  constructor() {
    // Simplified - no auto-initialization
  }

  getCurrentMetrics(): BandwidthMetrics | null {
    // Return null to prevent errors in other services
    return null;
  }

  getAvailableBandwidth(): number {
    return 10; // Default 10 Mbps
  }

  startMonitoring() {
    // No-op
  }

  stopMonitoring() {
    // No-op
  }
}

// Export singleton instance
export const bandwidthMonitor = new BandwidthMonitor();
export default BandwidthMonitor;