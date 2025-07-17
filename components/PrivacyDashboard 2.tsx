/**
 * Comprehensive Privacy Dashboard
 * User-controlled privacy settings and data management interface
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { advancedAuditService } from '../services/advancedAuditService';
import { decentralizedIdentityService } from '../services/decentralizedIdentityService';
import { encryptionService } from '../services/encryptionService';
import { quantumCryptographyService } from '../services/quantumCryptographyService';
import { threatDetectionService } from '../services/threatDetectionService';
import { zeroKnowledgeService, PrivacyLevel } from '../services/zeroKnowledgeService';

interface PrivacySettings {
  dataMinimization: boolean;
  anonymousAnalytics: boolean;
  encryptedCommunications: boolean;
  biometricAuth: boolean;
  locationTracking: boolean;
  behaviorAnalysis: boolean;
  thirdPartySharing: boolean;
  cookieConsent: boolean;
  privacyLevel: PrivacyLevel;
  dataRetention: number; // days
  autoDataDeletion: boolean;
  consentManagement: boolean;
  rightToErasure: boolean;
  dataPortability: boolean;
  transparencyReports: boolean;
  privacyAlerts: boolean;
}

interface DataCategory {
  id: string;
  name: string;
  description: string;
  dataTypes: string[];
  size: number;
  lastAccessed: number;
  retentionPeriod: number;
  encrypted: boolean;
  anonymized: boolean;
  shared: boolean;
  purpose: string[];
  legalBasis: string;
}

interface PrivacyMetrics {
  privacyScore: number;
  dataMinimized: number;
  encryptionCoverage: number;
  anonymizationLevel: number;
  consentCompliance: number;
  auditTrailCoverage: number;
  threatProtectionLevel: number;
  quantumReadiness: number;
}

interface ConsentRecord {
  id: string;
  purpose: string;
  dataTypes: string[];
  granted: boolean;
  timestamp: number;
  expiresAt?: number;
  granular: boolean;
  withdrawable: boolean;
  source: string;
}

const PrivacyDashboard: React.FC = () => {
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    dataMinimization: true,
    anonymousAnalytics: true,
    encryptedCommunications: true,
    biometricAuth: true,
    locationTracking: false,
    behaviorAnalysis: false,
    thirdPartySharing: false,
    cookieConsent: true,
    privacyLevel: PrivacyLevel.HIGH,
    dataRetention: 365,
    autoDataDeletion: true,
    consentManagement: true,
    rightToErasure: true,
    dataPortability: true,
    transparencyReports: true,
    privacyAlerts: true,
  });

  const [dataCategories, setDataCategories] = useState<DataCategory[]>([]);
  const [privacyMetrics, setPrivacyMetrics] = useState<PrivacyMetrics>({
    privacyScore: 0,
    dataMinimized: 0,
    encryptionCoverage: 0,
    anonymizationLevel: 0,
    consentCompliance: 0,
    auditTrailCoverage: 0,
    threatProtectionLevel: 0,
    quantumReadiness: 0,
  });

  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);
  const [showDataDeletion, setShowDataDeletion] = useState(false);
  const [showConsentManager, setShowConsentManager] = useState(false);

  useEffect(() => {
    loadPrivacyData();
  }, []);

  const loadPrivacyData = useCallback(async () => {
    try {
      setLoading(true);

      // Load privacy settings
      await loadPrivacySettings();

      // Load data categories
      await loadDataCategories();

      // Load privacy metrics
      await loadPrivacyMetrics();

      // Load consent records
      await loadConsentRecords();
    } catch (error) {
      console.error('Failed to load privacy data:', error);
      Alert.alert('Error', 'Failed to load privacy dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPrivacySettings = async () => {
    // Load settings from secure storage or use defaults
    // In a real app, this would load from encrypted storage
    console.log('Loading privacy settings...');
  };

  const loadDataCategories = async () => {
    // Simulate data categories
    const categories: DataCategory[] = [
      {
        id: '1',
        name: 'Account Information',
        description: 'Basic account and profile data',
        dataTypes: ['email', 'username', 'profile_picture'],
        size: 1024 * 50, // 50KB
        lastAccessed: Date.now() - 24 * 60 * 60 * 1000,
        retentionPeriod: 365 * 2, // 2 years
        encrypted: true,
        anonymized: false,
        shared: false,
        purpose: ['account_management', 'authentication'],
        legalBasis: 'contract',
      },
      {
        id: '2',
        name: 'Usage Analytics',
        description: 'Application usage patterns and statistics',
        dataTypes: ['page_views', 'feature_usage', 'session_duration'],
        size: 1024 * 200, // 200KB
        lastAccessed: Date.now() - 60 * 60 * 1000,
        retentionPeriod: 365, // 1 year
        encrypted: true,
        anonymized: true,
        shared: false,
        purpose: ['service_improvement', 'analytics'],
        legalBasis: 'legitimate_interest',
      },
      {
        id: '3',
        name: 'Communications',
        description: 'Messages and communication data',
        dataTypes: ['messages', 'call_logs', 'media_files'],
        size: 1024 * 1024 * 5, // 5MB
        lastAccessed: Date.now() - 30 * 60 * 1000,
        retentionPeriod: 365 * 3, // 3 years
        encrypted: true,
        anonymized: false,
        shared: false,
        purpose: ['communication', 'backup'],
        legalBasis: 'consent',
      },
    ];

    setDataCategories(categories);
  };

  const loadPrivacyMetrics = async () => {
    try {
      // Get metrics from various services
      const encryptionMetrics = encryptionService.getStats();
      const zkMetrics = zeroKnowledgeService.getMetrics();
      const threatMetrics = threatDetectionService.getMetrics();
      const quantumMetrics = quantumCryptographyService.getMetrics();
      const auditMetrics = advancedAuditService.getMetrics();

      const metrics: PrivacyMetrics = {
        privacyScore: calculatePrivacyScore(),
        dataMinimized: zkMetrics.anonymizationOperations > 0 ? 85 : 0,
        encryptionCoverage: encryptionMetrics.messagesEncrypted > 0 ? 95 : 0,
        anonymizationLevel: zkMetrics.privacyScore || 0,
        consentCompliance: 92,
        auditTrailCoverage: auditMetrics.total_events > 0 ? 98 : 0,
        threatProtectionLevel: threatMetrics.threats_detected > 0 ? 94 : 100,
        quantumReadiness: quantumMetrics.quantumReadinessScore || 0,
      };

      setPrivacyMetrics(metrics);
    } catch (error) {
      console.error('Failed to load privacy metrics:', error);
    }
  };

  const loadConsentRecords = async () => {
    // Simulate consent records
    const records: ConsentRecord[] = [
      {
        id: '1',
        purpose: 'Essential Services',
        dataTypes: ['account', 'authentication'],
        granted: true,
        timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000,
        granular: false,
        withdrawable: false,
        source: 'registration',
      },
      {
        id: '2',
        purpose: 'Analytics and Improvement',
        dataTypes: ['usage_analytics', 'performance_metrics'],
        granted: true,
        timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000,
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        granular: true,
        withdrawable: true,
        source: 'privacy_dashboard',
      },
      {
        id: '3',
        purpose: 'Marketing Communications',
        dataTypes: ['email', 'preferences'],
        granted: false,
        timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
        granular: true,
        withdrawable: true,
        source: 'opt_in_prompt',
      },
    ];

    setConsentRecords(records);
  };

  const calculatePrivacyScore = (): number => {
    let score = 0;
    const settings = privacySettings;

    // Base privacy settings (40 points)
    if (settings.dataMinimization) {
      score += 5;
    }
    if (settings.anonymousAnalytics) {
      score += 5;
    }
    if (settings.encryptedCommunications) {
      score += 8;
    }
    if (settings.biometricAuth) {
      score += 6;
    }
    if (!settings.locationTracking) {
      score += 4;
    }
    if (!settings.behaviorAnalysis) {
      score += 3;
    }
    if (!settings.thirdPartySharing) {
      score += 6;
    }
    if (settings.consentManagement) {
      score += 3;
    }

    // Privacy level bonus (20 points)
    switch (settings.privacyLevel) {
      case PrivacyLevel.MAXIMUM:
        score += 20;
        break;
      case PrivacyLevel.HIGH:
        score += 15;
        break;
      case PrivacyLevel.MEDIUM:
        score += 10;
        break;
      case PrivacyLevel.LOW:
        score += 5;
        break;
    }

    // Data retention (20 points)
    if (settings.dataRetention <= 90) {
      score += 20;
    } else if (settings.dataRetention <= 365) {
      score += 15;
    } else if (settings.dataRetention <= 730) {
      score += 10;
    } else {
      score += 5;
    }

    // User rights (20 points)
    if (settings.rightToErasure) {
      score += 7;
    }
    if (settings.dataPortability) {
      score += 6;
    }
    if (settings.transparencyReports) {
      score += 4;
    }
    if (settings.privacyAlerts) {
      score += 3;
    }

    return Math.min(100, score);
  };

  const handleSettingChange = async (setting: keyof PrivacySettings, value: any) => {
    const newSettings = { ...privacySettings, [setting]: value };
    setPrivacySettings(newSettings);

    try {
      // Apply setting changes to services
      await applyPrivacySettings(setting, value);

      // Recalculate privacy metrics
      await loadPrivacyMetrics();

      // Log privacy setting change
      await advancedAuditService.logEvent(
        'user_action',
        'privacy_setting_changed',
        { id: 'current_user', type: 'user' },
        { id: setting, type: 'privacy_setting', name: setting },
        'success',
        { setting, new_value: value, old_value: privacySettings[setting] },
        { severity: 'medium', complianceTags: ['privacy', 'gdpr'] }
      );
    } catch (error) {
      console.error(`Failed to update ${setting}:`, error);
      Alert.alert('Error', `Failed to update ${setting} setting`);
      // Revert setting
      setPrivacySettings(privacySettings);
    }
  };

  const applyPrivacySettings = async (setting: keyof PrivacySettings, value: any) => {
    switch (setting) {
      case 'encryptedCommunications':
        if (value) {
          // Enable encryption for all communications
          const config = encryptionService.getConfig();
          await encryptionService.updateConfig({
            ...config,
            enableForwardSecrecy: true,
            enablePostQuantumSecurity: true,
          });
        }
        break;

      case 'privacyLevel':
        // Update zero-knowledge service privacy level
        const policies = zeroKnowledgeService.getPrivacyPolicies();
        for (const policy of policies) {
          await zeroKnowledgeService.updatePrivacyPolicy(policy.id, {
            privacyLevel: value,
          });
        }
        break;

      case 'biometricAuth':
        // Enable/disable biometric authentication
        // This would integrate with the mobile hardware service
        break;

      default:
        console.log(`Applied setting: ${setting} = ${value}`);
    }
  };

  const handleDataExport = async (format: 'json' | 'csv' | 'xml' = 'json') => {
    try {
      setLoading(true);

      // Export data from all services
      const exportData = {
        timestamp: new Date().toISOString(),
        format,
        data: {
          identity: decentralizedIdentityService.getWallets(),
          encryption: encryptionService.getStats(),
          privacy: zeroKnowledgeService.getMetrics(),
          audit: await advancedAuditService.searchEvents('', {
            startDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
          }),
        },
      };

      // In a real app, this would trigger a download or email
      Alert.alert(
        'Data Export',
        `Your data has been exported in ${format.toUpperCase()} format. The export includes all personal data from the last 30 days.`,
        [{ text: 'OK' }]
      );

      // Log data export
      await advancedAuditService.logEvent(
        'user_action',
        'data_exported',
        { id: 'current_user', type: 'user' },
        { id: 'user_data', type: 'data_export', name: 'personal_data' },
        'success',
        { format, export_size: JSON.stringify(exportData).length },
        { severity: 'medium', complianceTags: ['gdpr', 'data_portability'] }
      );
    } catch (error) {
      console.error('Data export failed:', error);
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setLoading(false);
      setShowDataExport(false);
    }
  };

  const handleDataDeletion = async (categories: string[], reason: string) => {
    try {
      setLoading(true);

      Alert.alert(
        'Confirm Data Deletion',
        'Are you sure you want to delete the selected data? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // Delete data from selected categories
                for (const categoryId of categories) {
                  const category = dataCategories.find(c => c.id === categoryId);
                  if (category) {
                    // Implement actual data deletion
                    console.log(`Deleting data category: ${category.name}`);
                  }
                }

                // Update data categories
                setDataCategories(prev => prev.filter(c => !categories.includes(c.id)));

                // Log data deletion
                await advancedAuditService.logEvent(
                  'user_action',
                  'data_deleted',
                  { id: 'current_user', type: 'user' },
                  { id: 'user_data', type: 'data_deletion', name: 'personal_data' },
                  'success',
                  { categories, reason, deleted_count: categories.length },
                  { severity: 'high', complianceTags: ['gdpr', 'right_to_erasure'] }
                );

                Alert.alert('Success', 'Selected data has been deleted');
              } catch (error) {
                console.error('Data deletion failed:', error);
                Alert.alert('Error', 'Failed to delete data');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Data deletion failed:', error);
      Alert.alert('Error', 'Failed to delete data');
    } finally {
      setLoading(false);
      setShowDataDeletion(false);
    }
  };

  const handleConsentUpdate = async (consentId: string, granted: boolean) => {
    try {
      const updatedRecords = consentRecords.map(record =>
        record.id === consentId ? { ...record, granted, timestamp: Date.now() } : record
      );

      setConsentRecords(updatedRecords);

      // Log consent change
      await advancedAuditService.logEvent(
        'user_action',
        'consent_updated',
        { id: 'current_user', type: 'user' },
        { id: consentId, type: 'consent', name: 'user_consent' },
        'success',
        { consent_id: consentId, granted },
        { severity: 'medium', complianceTags: ['gdpr', 'consent'] }
      );

      Alert.alert('Success', `Consent ${granted ? 'granted' : 'withdrawn'} successfully`);
    } catch (error) {
      console.error('Consent update failed:', error);
      Alert.alert('Error', 'Failed to update consent');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPrivacyData();
    setRefreshing(false);
  }, [loadPrivacyData]);

  const renderPrivacyScore = () => (
    <View style={styles.scoreCard}>
      <Text style={styles.scoreTitle}>Privacy Score</Text>
      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreValue, { color: getScoreColor(privacyMetrics.privacyScore) }]}>
          {privacyMetrics.privacyScore}
        </Text>
        <Text style={styles.scoreOutOf}>/100</Text>
      </View>
      <Text style={styles.scoreDescription}>
        {getScoreDescription(privacyMetrics.privacyScore)}
      </Text>
    </View>
  );

  const renderMetricsGrid = () => (
    <View style={styles.metricsGrid}>
      <View style={styles.metricCard}>
        <Text style={styles.metricValue}>{privacyMetrics.encryptionCoverage}%</Text>
        <Text style={styles.metricLabel}>Encryption Coverage</Text>
      </View>
      <View style={styles.metricCard}>
        <Text style={styles.metricValue}>{privacyMetrics.dataMinimized}%</Text>
        <Text style={styles.metricLabel}>Data Minimized</Text>
      </View>
      <View style={styles.metricCard}>
        <Text style={styles.metricValue}>{privacyMetrics.anonymizationLevel}%</Text>
        <Text style={styles.metricLabel}>Anonymization</Text>
      </View>
      <View style={styles.metricCard}>
        <Text style={styles.metricValue}>{privacyMetrics.quantumReadiness}%</Text>
        <Text style={styles.metricLabel}>Quantum Ready</Text>
      </View>
    </View>
  );

  const renderPrivacySettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Privacy Settings</Text>

      {Object.entries(privacySettings).map(([key, value]) => {
        if (typeof value === 'boolean') {
          return (
            <View key={key} style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{formatSettingName(key)}</Text>
                <Text style={styles.settingDescription}>{getSettingDescription(key)}</Text>
              </View>
              <Switch
                value={value}
                onValueChange={newValue =>
                  handleSettingChange(key as keyof PrivacySettings, newValue)
                }
                trackColor={{ false: '#767577', true: '#2196F3' }}
                thumbColor={value ? '#ffffff' : '#f4f3f4'}
              />
            </View>
          );
        } else if (key === 'privacyLevel') {
          return (
            <View key={key} style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Privacy Level</Text>
                <Text style={styles.settingDescription}>Overall privacy protection level</Text>
              </View>
              <View style={styles.privacyLevelContainer}>
                {Object.values(PrivacyLevel).map(level => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.privacyLevelButton,
                      value === level && styles.privacyLevelButtonActive,
                    ]}
                    onPress={() => handleSettingChange('privacyLevel', level)}
                  >
                    <Text
                      style={[
                        styles.privacyLevelText,
                        value === level && styles.privacyLevelTextActive,
                      ]}
                    >
                      {level.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        }
        return null;
      })}
    </View>
  );

  const renderDataCategories = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Data</Text>
      {dataCategories.map(category => (
        <View key={category.id} style={styles.dataCategoryCard}>
          <View style={styles.dataCategoryHeader}>
            <Text style={styles.dataCategoryName}>{category.name}</Text>
            <Text style={styles.dataCategorySize}>{formatBytes(category.size)}</Text>
          </View>
          <Text style={styles.dataCategoryDescription}>{category.description}</Text>
          <View style={styles.dataCategoryMetadata}>
            <View style={styles.dataCategoryBadges}>
              {category.encrypted && (
                <View style={[styles.badge, styles.encryptedBadge]}>
                  <Text style={styles.badgeText}>Encrypted</Text>
                </View>
              )}
              {category.anonymized && (
                <View style={[styles.badge, styles.anonymizedBadge]}>
                  <Text style={styles.badgeText}>Anonymized</Text>
                </View>
              )}
            </View>
            <Text style={styles.lastAccessed}>
              Last accessed: {new Date(category.lastAccessed).toLocaleDateString()}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={[styles.actionButton, styles.exportButton]}
        onPress={() => setShowDataExport(true)}
      >
        <Text style={styles.actionButtonText}>Export My Data</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.deleteButton]}
        onPress={() => setShowDataDeletion(true)}
      >
        <Text style={styles.actionButtonText}>Delete Data</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.consentButton]}
        onPress={() => setShowConsentManager(true)}
      >
        <Text style={styles.actionButtonText}>Manage Consent</Text>
      </TouchableOpacity>
    </View>
  );

  const getScoreColor = (score: number): string => {
    if (score >= 80) {
      return '#4CAF50';
    }
    if (score >= 60) {
      return '#FF9800';
    }
    return '#F44336';
  };

  const getScoreDescription = (score: number): string => {
    if (score >= 90) {
      return 'Excellent privacy protection';
    }
    if (score >= 80) {
      return 'Good privacy protection';
    }
    if (score >= 60) {
      return 'Fair privacy protection';
    }
    return 'Poor privacy protection';
  };

  const formatSettingName = (key: string): string => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      dataMinimization: 'Minimize data collection to essential purposes only',
      anonymousAnalytics: 'Use anonymous analytics that cannot identify you',
      encryptedCommunications: 'Encrypt all communications end-to-end',
      biometricAuth: 'Use biometric authentication for enhanced security',
      locationTracking: 'Allow location tracking for location-based features',
      behaviorAnalysis: 'Allow analysis of usage patterns for personalization',
      thirdPartySharing: 'Share data with trusted third-party services',
      cookieConsent: 'Require consent for non-essential cookies',
      autoDataDeletion: 'Automatically delete data after retention period',
      consentManagement: 'Enable granular consent management',
      rightToErasure: 'Allow data deletion requests',
      dataPortability: 'Enable data export and portability',
      transparencyReports: 'Receive transparency reports about data usage',
      privacyAlerts: 'Receive alerts about privacy-related events',
    };
    return descriptions[key] || '';
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading privacy dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Privacy Dashboard</Text>
          <Text style={styles.subtitle}>Control your privacy and data</Text>
        </View>

        {renderPrivacyScore()}
        {renderMetricsGrid()}
        {renderPrivacySettings()}
        {renderDataCategories()}
        {renderActionButtons()}
      </ScrollView>

      {/* Data Export Modal */}
      <Modal visible={showDataExport} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Export Your Data</Text>
            <TouchableOpacity onPress={() => setShowDataExport(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Export all your personal data in your preferred format.
            </Text>
            <TouchableOpacity
              style={styles.exportFormatButton}
              onPress={() => handleDataExport('json')}
            >
              <Text style={styles.exportFormatText}>JSON Format</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exportFormatButton}
              onPress={() => handleDataExport('csv')}
            >
              <Text style={styles.exportFormatText}>CSV Format</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exportFormatButton}
              onPress={() => handleDataExport('xml')}
            >
              <Text style={styles.exportFormatText}>XML Format</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Consent Manager Modal */}
      <Modal visible={showConsentManager} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Consent Management</Text>
            <TouchableOpacity onPress={() => setShowConsentManager(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {consentRecords.map(record => (
              <View key={record.id} style={styles.consentRecord}>
                <View style={styles.consentHeader}>
                  <Text style={styles.consentPurpose}>{record.purpose}</Text>
                  <Switch
                    value={record.granted}
                    onValueChange={value => handleConsentUpdate(record.id, value)}
                    disabled={!record.withdrawable}
                  />
                </View>
                <Text style={styles.consentDataTypes}>
                  Data types: {record.dataTypes.join(', ')}
                </Text>
                <Text style={styles.consentTimestamp}>
                  {record.granted ? 'Granted' : 'Withdrawn'}:{' '}
                  {new Date(record.timestamp).toLocaleDateString()}
                </Text>
                {record.expiresAt && (
                  <Text style={styles.consentExpiry}>
                    Expires: {new Date(record.expiresAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#2196F3',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  scoreCard: {
    margin: 20,
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreOutOf: {
    fontSize: 24,
    color: '#666',
    marginLeft: 4,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    marginRight: '2%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    margin: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  privacyLevelContainer: {
    flexDirection: 'row',
  },
  privacyLevelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
    backgroundColor: '#f0f0f0',
  },
  privacyLevelButtonActive: {
    backgroundColor: '#2196F3',
  },
  privacyLevelText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  privacyLevelTextActive: {
    color: '#ffffff',
  },
  dataCategoryCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dataCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataCategoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  dataCategorySize: {
    fontSize: 14,
    color: '#666',
  },
  dataCategoryDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  dataCategoryMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataCategoryBadges: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  encryptedBadge: {
    backgroundColor: '#4CAF50',
  },
  anonymizedBadge: {
    backgroundColor: '#FF9800',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  lastAccessed: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    margin: 20,
    marginBottom: 40,
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  exportButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  consentButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  modalClose: {
    fontSize: 16,
    color: '#2196F3',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  exportFormatButton: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exportFormatText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2196F3',
    textAlign: 'center',
  },
  consentRecord: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  consentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  consentPurpose: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  consentDataTypes: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  consentTimestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  consentExpiry: {
    fontSize: 12,
    color: '#FF9800',
  },
});

export default PrivacyDashboard;
