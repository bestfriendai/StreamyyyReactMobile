import React, { useState, useEffect } from 'react';
import { platformDetection } from '@/utils/crossPlatformStorage';
import { useCrossPlatformStore } from '@/store/useCrossPlatformStore';
import { pwaService } from '@/services/pwaService';
import { notificationService } from '@/services/notificationService';
import { deviceSyncService } from '@/services/deviceSyncService';

interface CrossPlatformIntegrationGuideProps {
  className?: string;
}

const CrossPlatformIntegrationGuide: React.FC<CrossPlatformIntegrationGuideProps> = ({
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [pwaFeatures, setPWAFeatures] = useState<any>({});
  const [syncStatus, setSyncStatus] = useState<any>({});
  const [notificationSettings, setNotificationSettings] = useState<any>({});
  
  const { platform, deviceId } = useCrossPlatformStore();

  useEffect(() => {
    loadFeatureStatus();
  }, []);

  const loadFeatureStatus = async () => {
    try {
      setPWAFeatures(pwaService.getPWAFeatures());
      setSyncStatus(deviceSyncService.getSyncStatus());
      setNotificationSettings(notificationService.getSettings());
    } catch (error) {
      console.error('Error loading feature status:', error);
    }
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-blue-300 mb-4">
          🚀 Cross-Platform Integration Complete
        </h3>
        <p className="text-gray-300 mb-4">
          Streamyyy now works seamlessly across web, desktop, and mobile platforms with advanced 
          synchronization and integration features.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-green-400 text-2xl mb-2">🌐</div>
            <h4 className="font-semibold text-white">Web (PWA)</h4>
            <p className="text-sm text-gray-400">Responsive web app with offline support</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-blue-400 text-2xl mb-2">🖥️</div>
            <h4 className="font-semibold text-white">Desktop (Electron)</h4>
            <p className="text-sm text-gray-400">Native desktop app with system integration</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-purple-400 text-2xl mb-2">🔌</div>
            <h4 className="font-semibold text-white">Browser Extension</h4>
            <p className="text-sm text-gray-400">Collect streams from any platform</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Current Platform</h3>
        <div className="flex items-center space-x-4">
          <div className="bg-blue-600 rounded-full w-3 h-3"></div>
          <div>
            <p className="text-white font-medium">
              {platform === 'web' ? '🌐 Web Browser' : 
               platform === 'desktop' ? '🖥️ Desktop App' : '📱 Mobile App'}
            </p>
            <p className="text-sm text-gray-400">Device ID: {deviceId}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">🔄 Sync Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Enabled:</span>
              <span className={syncStatus.isEnabled ? 'text-green-400' : 'text-red-400'}>
                {syncStatus.isEnabled ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Sync:</span>
              <span className="text-gray-300">
                {syncStatus.lastSyncTime ? 
                  new Date(syncStatus.lastSyncTime).toLocaleString() : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pending:</span>
              <span className="text-yellow-400">{syncStatus.pendingChanges?.length || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">🔔 Notifications</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Enabled:</span>
              <span className={notificationSettings.enabled ? 'text-green-400' : 'text-red-400'}>
                {notificationSettings.enabled ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Web:</span>
              <span className={notificationSettings.web ? 'text-green-400' : 'text-gray-500'}>
                {notificationSettings.web ? 'On' : 'Off'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Desktop:</span>
              <span className={notificationSettings.desktop ? 'text-green-400' : 'text-gray-500'}>
                {notificationSettings.desktop ? 'On' : 'Off'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const FeaturesTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🌟 Available Features</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureCard
            title="Cross-Platform Storage"
            description="Unified storage that works across all platforms"
            status="enabled"
            icon="💾"
          />
          
          <FeatureCard
            title="Device Synchronization"
            description="Sync layouts and settings across devices"
            status={syncStatus.isEnabled ? "enabled" : "disabled"}
            icon="🔄"
          />
          
          <FeatureCard
            title="Progressive Web App"
            description="Install as native app on any platform"
            status={pwaFeatures.installable ? "available" : "not-available"}
            icon="📱"
          />
          
          <FeatureCard
            title="Push Notifications"
            description="Real-time notifications across platforms"
            status={notificationSettings.enabled ? "enabled" : "disabled"}
            icon="🔔"
          />
          
          <FeatureCard
            title="Browser Extension"
            description="Collect streams from any website"
            status="available"
            icon="🔌"
          />
          
          <FeatureCard
            title="Desktop Integration"
            description="System tray, shortcuts, and native features"
            status={platform === 'desktop' ? "enabled" : "not-applicable"}
            icon="🖥️"
          />
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🎯 Platform-Specific Features</h3>
        
        {platform === 'web' && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-blue-300">Web Features</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Responsive multi-stream grid</li>
              <li>• Keyboard shortcuts</li>
              <li>• Full-screen mode</li>
              <li>• Service worker caching</li>
              <li>• Share API integration</li>
            </ul>
          </div>
        )}

        {platform === 'desktop' && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-blue-300">Desktop Features</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• System tray integration</li>
              <li>• Global keyboard shortcuts</li>
              <li>• Auto-start on boot</li>
              <li>• Native notifications</li>
              <li>• Picture-in-picture mode</li>
              <li>• Hardware acceleration</li>
            </ul>
          </div>
        )}

        {platform === 'mobile' && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-blue-300">Mobile Features</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Touch gestures</li>
              <li>• Haptic feedback</li>
              <li>• Background playback</li>
              <li>• Push notifications</li>
              <li>• Biometric authentication</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  const SetupTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">⚙️ Setup Guide</h3>
        
        <div className="space-y-6">
          <SetupStep
            number={1}
            title="Enable Cross-Platform Sync"
            description="Sync your layouts and settings across all devices"
            action={
              <button
                onClick={() => deviceSyncService.enableSync()}
                className={`px-4 py-2 rounded ${
                  syncStatus.isEnabled 
                    ? 'bg-green-600 text-white' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                disabled={syncStatus.isEnabled}
              >
                {syncStatus.isEnabled ? 'Enabled' : 'Enable Sync'}
              </button>
            }
          />

          <SetupStep
            number={2}
            title="Configure Notifications"
            description="Get notified when your favorite streamers go live"
            action={
              <button
                onClick={() => notificationService.requestPermission()}
                className={`px-4 py-2 rounded ${
                  notificationSettings.enabled 
                    ? 'bg-green-600 text-white' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {notificationSettings.enabled ? 'Enabled' : 'Enable Notifications'}
              </button>
            }
          />

          {pwaFeatures.installable && (
            <SetupStep
              number={3}
              title="Install as App"
              description="Install Streamyyy as a native app for better experience"
              action={
                <button
                  onClick={() => pwaService.installApp()}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Install App
                </button>
              }
            />
          )}

          <SetupStep
            number={platform === 'web' && pwaFeatures.installable ? 4 : 3}
            title="Browser Extension"
            description="Install the browser extension to collect streams from any platform"
            action={
              <a
                href="/browser-extension"
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 inline-block"
              >
                Download Extension
              </a>
            }
          />
        </div>
      </div>

      {platform === 'desktop' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">🖥️ Desktop Setup</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white">System Tray</h4>
                <p className="text-sm text-gray-400">Show app in system tray</p>
              </div>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                Enable
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white">Auto Start</h4>
                <p className="text-sm text-gray-400">Start app when computer boots</p>
              </div>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                Enable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const FeatureCard: React.FC<{
    title: string;
    description: string;
    status: 'enabled' | 'disabled' | 'available' | 'not-available' | 'not-applicable';
    icon: string;
  }> = ({ title, description, status, icon }) => (
    <div className="bg-gray-700 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1">
          <h4 className="font-medium text-white">{title}</h4>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
          <div className="mt-2">
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              status === 'enabled' ? 'bg-green-600 text-white' :
              status === 'available' ? 'bg-blue-600 text-white' :
              status === 'disabled' ? 'bg-red-600 text-white' :
              status === 'not-available' ? 'bg-gray-600 text-white' :
              'bg-gray-500 text-white'
            }`}>
              {status === 'enabled' ? 'Enabled' :
               status === 'available' ? 'Available' :
               status === 'disabled' ? 'Disabled' :
               status === 'not-available' ? 'Not Available' :
               'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const SetupStep: React.FC<{
    number: number;
    title: string;
    description: string;
    action: React.ReactNode;
  }> = ({ number, title, description, action }) => (
    <div className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
        {number}
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-white">{title}</h4>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <div className="flex-shrink-0">
        {action}
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'features', label: 'Features', icon: '🌟' },
    { id: 'setup', label: 'Setup', icon: '⚙️' },
  ];

  return (
    <div className={`bg-gray-900 text-white ${className}`}>
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Cross-Platform Integration
        </h2>
        <p className="text-gray-400">
          Manage your multi-streaming experience across all platforms
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="flex space-x-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400 bg-gray-700'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'features' && <FeaturesTab />}
        {activeTab === 'setup' && <SetupTab />}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Cross-platform integration powered by modern web technologies
          </div>
          <button
            onClick={loadFeatureStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrossPlatformIntegrationGuide;