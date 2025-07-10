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
import { Theme } from '@/constants/Theme';

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
        colors={Theme.gradients.card}
        style={styles.headerGradient}
      >
        <View style={styles.titleContainer}>
          <SettingsIcon size={28} color={Theme.colors.accent.primary} />
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
        colors={Theme.gradients.background}
        style={styles.background}
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderHeader()}
        
        {renderSection(
          'Playback',
          <Play size={20} color={Theme.colors.accent.primary} />,
          <>
            {renderSettingRow(
              'Auto Play',
              'Automatically start streams when added',
              <Switch
                value={settings.autoPlay}
                onValueChange={(value) => updateSettings({ autoPlay: value })}
                trackColor={{ false: Theme.colors.background.tertiary, true: Theme.colors.accent.primary }}
                thumbColor={settings.autoPlay ? Theme.colors.text.primary : Theme.colors.text.tertiary}
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
          <Monitor size={20} color={Theme.colors.accent.primary} />,
          <>
            {renderSettingRow(
              'Chat Enabled',
              'Show chat alongside streams',
              <Switch
                value={settings.chatEnabled}
                onValueChange={(value) => updateSettings({ chatEnabled: value })}
                trackColor={{ false: Theme.colors.background.tertiary, true: Theme.colors.accent.primary }}
                thumbColor={settings.chatEnabled ? Theme.colors.text.primary : Theme.colors.text.tertiary}
              />
            )}
          </>
        )}

        {renderSection(
          'Data',
          <Info size={20} color={Theme.colors.accent.primary} />,
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
                    ? Theme.gradients.card
                    : [Theme.colors.accent.red, Theme.colors.functional.error]
                }
                style={styles.dangerGradient}
              >
                <Trash2 size={18} color={Theme.colors.text.primary} />
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
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
    gap: Theme.spacing.sm,
  },
  title: {
    color: Theme.colors.text.primary,
    fontSize: Theme.typography.sizes.title,
    fontWeight: Theme.typography.weights.bold,
  },
  subtitle: {
    color: Theme.colors.text.tertiary,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.regular,
    marginLeft: 40,
  },
  section: {
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
    backgroundColor: Theme.colors.background.card,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.background.tertiary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
    gap: Theme.spacing.sm,
  },
  sectionTitle: {
    color: Theme.colors.text.primary,
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.semibold,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.background.tertiary,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    color: Theme.colors.text.primary,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.regular,
    marginBottom: 2,
  },
  settingSubtitle: {
    color: Theme.colors.text.tertiary,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.regular,
  },
  qualityContainer: {
    marginTop: Theme.spacing.lg,
  },
  qualityLabel: {
    color: Theme.colors.text.primary,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.regular,
    marginBottom: Theme.spacing.sm,
  },
  qualityButtons: {
    flexDirection: 'row',
    gap: Theme.spacing.xs,
  },
  qualityButton: {
    flex: 1,
    paddingVertical: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: Theme.colors.background.tertiary,
    alignItems: 'center',
  },
  activeQualityButton: {
    backgroundColor: Theme.colors.accent.primary,
    borderColor: Theme.colors.accent.secondary,
  },
  qualityText: {
    color: Theme.colors.text.tertiary,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.regular,
  },
  activeQualityText: {
    color: Theme.colors.background.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: Theme.colors.accent.primary,
    fontSize: Theme.typography.sizes.title,
    fontWeight: Theme.typography.weights.bold,
    marginBottom: 4,
  },
  statLabel: {
    color: Theme.colors.text.tertiary,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.regular,
  },
  dangerButton: {
    borderRadius: Theme.radius.md,
    overflow: 'hidden',
    marginTop: Theme.spacing.xs,
  },
  dangerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.sm,
    gap: Theme.spacing.xs,
  },
  dangerText: {
    color: Theme.colors.text.primary,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.medium,
  },
  footer: {
    alignItems: 'center',
    padding: Theme.spacing.xxl,
    marginBottom: 100,
  },
  footerText: {
    color: Theme.colors.accent.primary,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.medium,
    marginBottom: 4,
  },
  footerSubtext: {
    color: Theme.colors.text.tertiary,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.regular,
    textAlign: 'center',
  },
});