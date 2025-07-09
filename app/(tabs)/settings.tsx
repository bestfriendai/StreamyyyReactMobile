import React from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  Switch, 
  ScrollView,
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Settings as SettingsIcon, 
  Volume2, 
  Play, 
  MessageCircle, 
  Monitor,
  Info,
  Trash2,
  Star
} from 'lucide-react-native';
import { useStreamManager } from '@/hooks/useStreamManager';

export default function SettingsScreen() {
  const { settings, updateSettings, clearAllStreams, activeStreams, favorites } = useStreamManager();

  const handleVolumeChange = (volume: number) => {
    updateSettings({ defaultVolume: volume });
  };

  const handleQualityChange = (quality: 'auto' | 'source' | '720p' | '480p') => {
    updateSettings({ qualityPreference: quality });
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.1)', 'transparent']}
        style={styles.headerGradient}
      >
        <View style={styles.titleContainer}>
          <SettingsIcon size={28} color="#8B5CF6" />
          <Text style={styles.title}>Settings</Text>
        </View>
        <Text style={styles.subtitle}>
          Customize your streaming experience
        </Text>
      </LinearGradient>
    </View>
  );

  const renderSection = (title: string, icon: React.ReactNode, children: React.ReactNode) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const renderSettingRow = (
    title: string, 
    subtitle: string, 
    control: React.ReactNode
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      {control}
    </View>
  );

  const renderQualityButton = (quality: 'auto' | 'source' | '720p' | '480p', label: string) => (
    <TouchableOpacity
      style={[
        styles.qualityButton,
        settings.qualityPreference === quality && styles.activeQualityButton
      ]}
      onPress={() => handleQualityChange(quality)}
    >
      <Text style={[
        styles.qualityText,
        settings.qualityPreference === quality && styles.activeQualityText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#0f0f0f']}
        style={styles.background}
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderHeader()}
        
        {renderSection(
          'Playback',
          <Play size={20} color="#8B5CF6" />,
          <>
            {renderSettingRow(
              'Auto Play',
              'Automatically start streams when added',
              <Switch
                value={settings.autoPlay}
                onValueChange={(value) => updateSettings({ autoPlay: value })}
                trackColor={{ false: '#333', true: '#8B5CF6' }}
                thumbColor={settings.autoPlay ? '#fff' : '#666'}
              />
            )}
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Default Volume</Text>
                <Text style={styles.settingSubtitle}>
                  {Math.round(settings.defaultVolume * 100)}%
                </Text>
              </View>
            </View>
            
            <View style={styles.qualityContainer}>
              <Text style={styles.qualityLabel}>Stream Quality</Text>
              <View style={styles.qualityButtons}>
                {renderQualityButton('auto', 'Auto')}
                {renderQualityButton('source', 'Source')}
                {renderQualityButton('720p', '720p')}
                {renderQualityButton('480p', '480p')}
              </View>
            </View>
          </>
        )}

        {renderSection(
          'Interface',
          <Monitor size={20} color="#8B5CF6" />,
          <>
            {renderSettingRow(
              'Chat Enabled',
              'Show chat alongside streams',
              <Switch
                value={settings.chatEnabled}
                onValueChange={(value) => updateSettings({ chatEnabled: value })}
                trackColor={{ false: '#333', true: '#8B5CF6' }}
                thumbColor={settings.chatEnabled ? '#fff' : '#666'}
              />
            )}
          </>
        )}

        {renderSection(
          'Data',
          <Info size={20} color="#8B5CF6" />,
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{activeStreams.length}</Text>
                <Text style={styles.statLabel}>Active Streams</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{favorites.length}</Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={clearAllStreams}
              disabled={activeStreams.length === 0}
            >
              <LinearGradient
                colors={
                  activeStreams.length === 0 
                    ? ['rgba(107, 114, 128, 0.5)', 'rgba(75, 85, 99, 0.5)']
                    : ['rgba(239, 68, 68, 0.9)', 'rgba(220, 38, 38, 0.9)']
                }
                style={styles.dangerGradient}
              >
                <Trash2 size={18} color="#fff" />
                <Text style={[
                  styles.dangerText,
                  activeStreams.length === 0 && { opacity: 0.5 }
                ]}>
                  Clear All Streams
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Streamyyy v1.0.0</Text>
          <Text style={styles.footerSubtext}>
            Built with ❤️ for streamers and viewers
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#999',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 40,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: 'rgba(42, 42, 42, 0.6)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  settingSubtitle: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  qualityContainer: {
    marginTop: 16,
  },
  qualityLabel: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 12,
  },
  qualityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  qualityButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(58, 58, 58, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  activeQualityButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  qualityText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  activeQualityText: {
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#8B5CF6',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#999',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  dangerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  dangerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  dangerText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  footer: {
    alignItems: 'center',
    padding: 32,
    marginBottom: 100,
  },
  footerText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  footerSubtext: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});