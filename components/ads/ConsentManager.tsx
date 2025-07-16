/**
 * GDPR Consent Manager Component
 * Handles user consent for ads and privacy compliance
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Settings, Check, X } from 'lucide-react-native';

import { adMobService } from '@/services/adMobService';
import { logDebug, logError } from '@/utils/errorHandler';

interface ConsentManagerProps {
  visible: boolean;
  onConsentGiven: (canRequestAds: boolean) => void;
  onClose: () => void;
  mode: 'initial' | 'settings'; // Initial consent vs privacy settings
}

export const ConsentManager: React.FC<ConsentManagerProps> = ({
  visible,
  onConsentGiven,
  onClose,
  mode = 'initial',
}) => {
  const [loading, setLoading] = useState(false);
  const [consentChoice, setConsentChoice] = useState<'accept' | 'reject' | null>(null);

  const handleConsentChoice = async (choice: 'accept' | 'reject') => {
    try {
      setLoading(true);
      setConsentChoice(choice);

      // In real implementation, this would interact with UMP SDK
      const canRequestAds = choice === 'accept';
      
      logDebug('User consent choice', { choice, canRequestAds });
      
      // Simulate consent processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onConsentGiven(canRequestAds);
      onClose();
    } catch (error) {
      logError('Error processing consent', { error: error.message });
      Alert.alert('Error', 'Failed to process consent. Please try again.');
    } finally {
      setLoading(false);
      setConsentChoice(null);
    }
  };

  const handleLearnMore = () => {
    Alert.alert(
      'Privacy Information',
      'We use Google AdMob to show you relevant ads. This helps us keep the app free. You can change your preferences at any time in the app settings.\n\nPersonalized ads use your app activity to show more relevant advertisements. Non-personalized ads are still relevant but don\'t use your personal information.',
      [{ text: 'Got it' }]
    );
  };

  const handleManageSettings = async () => {
    try {
      await adMobService.showPrivacyOptionsForm();
    } catch (error) {
      Alert.alert('Error', 'Unable to open privacy settings at this time.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#0f0f0f', '#1a1a1a', '#0f0f0f']}
        style={styles.container}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Shield size={32} color="#8B5CF6" />
            </View>
            <Text style={styles.title}>
              {mode === 'initial' ? 'Privacy & Ads' : 'Privacy Settings'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'initial'
                ? 'Help us keep Streamyyy free by allowing relevant ads'
                : 'Manage your advertising preferences'
              }
            </Text>
          </View>

          {/* Content */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>How we use ads</Text>
            <Text style={styles.description}>
              Streamyyy shows ads to keep the app free for everyone. We partner with Google AdMob to display relevant advertisements.
            </Text>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Check size={16} color="#10B981" />
                <Text style={styles.featureText}>
                  Supports free app development
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={16} color="#10B981" />
                <Text style={styles.featureText}>
                  Non-intrusive ad placement
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={16} color="#10B981" />
                <Text style={styles.featureText}>
                  Respects your privacy choices
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Your choices</Text>
            <Text style={styles.description}>
              • <Text style={styles.bold}>Accept:</Text> See personalized ads based on your interests{'\n'}
              • <Text style={styles.bold}>Reject:</Text> See generic ads not based on your personal data{'\n'}
              • You can change this anytime in Settings
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {mode === 'initial' && (
              <>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleConsentChoice('accept')}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.buttonGradient}
                  >
                    {loading && consentChoice === 'accept' ? (
                      <Text style={styles.buttonText}>Processing...</Text>
                    ) : (
                      <>
                        <Check size={20} color="#fff" />
                        <Text style={styles.buttonText}>Accept & Continue</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleConsentChoice('reject')}
                  disabled={loading}
                >
                  <View style={styles.rejectButtonContent}>
                    {loading && consentChoice === 'reject' ? (
                      <Text style={styles.rejectButtonText}>Processing...</Text>
                    ) : (
                      <>
                        <X size={20} color="#6B7280" />
                        <Text style={styles.rejectButtonText}>Show Generic Ads</Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              </>
            )}

            {mode === 'settings' && (
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={handleManageSettings}
              >
                <View style={styles.settingsButtonContent}>
                  <Settings size={20} color="#8B5CF6" />
                  <Text style={styles.settingsButtonText}>Manage Ad Preferences</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.learnMoreButton}
              onPress={handleLearnMore}
            >
              <Text style={styles.learnMoreText}>Learn More About Privacy</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Close button for settings mode */}
        {mode === 'settings' && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        )}
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  infoSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    marginBottom: 12,
    marginTop: 24,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    lineHeight: 24,
    marginBottom: 16,
  },
  bold: {
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  featureList: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    marginLeft: 12,
  },
  actions: {
    paddingBottom: 40,
  },
  acceptButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  rejectButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
  },
  rejectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  rejectButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  settingsButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8B5CF6',
    marginBottom: 12,
  },
  settingsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  settingsButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
  },
  learnMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  learnMoreText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
    textDecorationLine: 'underline',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ConsentManager;