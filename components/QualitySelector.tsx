/**
 * Quality Selector Component
 * Manual quality selection dropdown with intelligent recommendations
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import {
  ChevronDown,
  ChevronUp,
  Zap,
  Wifi,
  Battery,
  Monitor,
  AlertTriangle,
  CheckCircle,
  Circle,
} from 'lucide-react-native';
import { BlurViewFallback as BlurView } from './BlurViewFallback';
import { ModernTheme } from '@/theme/modernTheme';
import { HapticFeedback } from '@/utils/haptics';
import {
  QualityLevel,
  streamQualityManager,
  getQualityPreset,
} from '@/services/streamQualityManager';
import { bandwidthMonitor, getConnectionQuality } from '@/services/bandwidthMonitor';

interface QualityOption {
  level: QualityLevel;
  label: string;
  description: string;
  bandwidth: number;
  recommended?: boolean;
  disabled?: boolean;
  warning?: string;
}

interface QualitySelectorProps {
  streamId: string;
  currentQuality: QualityLevel;
  onQualityChange: (quality: QualityLevel) => void;
  compact?: boolean;
  showBandwidthInfo?: boolean;
  showRecommendations?: boolean;
  disabled?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

export const QualitySelector: React.FC<QualitySelectorProps> = ({
  streamId,
  currentQuality,
  onQualityChange,
  compact = false,
  showBandwidthInfo = true,
  showRecommendations = true,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableBandwidth, setAvailableBandwidth] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<string>('unknown');

  // Animation values
  const dropdownScale = useSharedValue(0);
  const chevronRotation = useSharedValue(0);
  const indicatorPulse = useSharedValue(1);

  // Update bandwidth information
  useEffect(() => {
    const updateBandwidth = () => {
      const metrics = bandwidthMonitor.getCurrentMetrics();
      if (metrics) {
        setAvailableBandwidth(metrics.downloadSpeed);
        setConnectionQuality(getConnectionQuality());
      }
    };

    updateBandwidth();
    const unsubscribe = bandwidthMonitor.onBandwidthUpdate(updateBandwidth);
    return unsubscribe;
  }, []);

  // Animate quality indicator
  useEffect(() => {
    indicatorPulse.value = withSpring(1.2, { damping: 15 }, () => {
      indicatorPulse.value = withSpring(1);
    });
  }, [currentQuality]);

  // Generate quality options
  const qualityOptions: QualityOption[] = [
    {
      level: 'auto',
      label: 'Auto',
      description: 'Adaptive quality based on connection',
      bandwidth: 0,
      recommended: showRecommendations,
    },
    {
      level: 'source',
      label: 'Source',
      description: '1080p60 • Best quality',
      bandwidth: 8.0,
      disabled: availableBandwidth < 6,
      warning: availableBandwidth < 6 ? 'Insufficient bandwidth' : undefined,
    },
    {
      level: '720p60',
      label: '720p60',
      description: '720p at 60fps • High quality',
      bandwidth: 6.0,
      disabled: availableBandwidth < 4,
      warning: availableBandwidth < 4 ? 'May cause buffering' : undefined,
    },
    {
      level: '720p',
      label: '720p',
      description: '720p at 30fps • Good quality',
      bandwidth: 4.0,
      recommended: connectionQuality === 'good' && !showRecommendations,
    },
    {
      level: '480p',
      label: '480p',
      description: 'Standard definition • Balanced',
      bandwidth: 2.5,
      recommended: connectionQuality === 'fair',
    },
    {
      level: '360p',
      label: '360p',
      description: 'Lower bandwidth usage',
      bandwidth: 1.5,
      recommended: connectionQuality === 'poor',
    },
    {
      level: '160p',
      label: '160p',
      description: 'Minimal bandwidth • Audio focus',
      bandwidth: 0.8,
      recommended: connectionQuality === 'critical',
    },
  ];

  const handleToggleDropdown = useCallback(() => {
    if (disabled) return;

    HapticFeedback.light();
    setIsOpen(!isOpen);
  }, [disabled, isOpen]);

  const handleQualitySelect = useCallback((quality: QualityLevel) => {
    HapticFeedback.medium();
    onQualityChange(quality);
    setIsOpen(false);
  }, [onQualityChange]);

  // Animated styles
  const dropdownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dropdownScale.value }],
    opacity: interpolate(dropdownScale.value, [0, 1], [0, 1]),
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ scale: indicatorPulse.value }],
  }));

  // Handle dropdown animation
  useEffect(() => {
    dropdownScale.value = withSpring(isOpen ? 1 : 0, { damping: 20 });
    chevronRotation.value = withTiming(isOpen ? 180 : 0, { duration: 200 });
  }, [isOpen]);

  const getCurrentOption = () => {
    return qualityOptions.find(opt => opt.level === currentQuality) || qualityOptions[0];
  };

  const getQualityColor = (quality: QualityLevel) => {
    const colors = {
      source: ModernTheme.colors.success[500],
      '720p60': ModernTheme.colors.success[400],
      '720p': ModernTheme.colors.primary[400],
      '480p': ModernTheme.colors.warning[400],
      '360p': ModernTheme.colors.warning[500],
      '160p': ModernTheme.colors.error[400],
      auto: ModernTheme.colors.accent[400],
    };
    return colors[quality] || ModernTheme.colors.text.secondary;
  };

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'excellent':
        return <Wifi size={14} color={ModernTheme.colors.success[400]} />;
      case 'good':
        return <Wifi size={14} color={ModernTheme.colors.primary[400]} />;
      case 'fair':
        return <Wifi size={14} color={ModernTheme.colors.warning[400]} />;
      case 'poor':
        return <Wifi size={14} color={ModernTheme.colors.error[400]} />;
      default:
        return <Wifi size={14} color={ModernTheme.colors.text.secondary} />;
    }
  };

  const currentOption = getCurrentOption();

  return (
    <View style={styles.container}>
      {/* Quality Selector Button */}
      <AnimatedTouchableOpacity
        style={[
          styles.selectorButton,
          compact && styles.compactButton,
          disabled && styles.disabledButton,
        ]}
        onPress={handleToggleDropdown}
        disabled={disabled}
      >
        <View style={styles.buttonContent}>
          <Animated.View style={[styles.qualityIndicator, indicatorStyle]}>
            <View
              style={[
                styles.qualityDot,
                { backgroundColor: getQualityColor(currentQuality) },
              ]}
            />
          </Animated.View>
          
          <View style={styles.qualityInfo}>
            <Text style={[styles.qualityLabel, compact && styles.compactLabel]}>
              {currentOption.label}
            </Text>
            {!compact && showBandwidthInfo && (
              <Text style={styles.bandwidthText}>
                {currentOption.bandwidth > 0 ? `${currentOption.bandwidth} Mbps` : 'Adaptive'}
              </Text>
            )}
          </View>
          
          {showBandwidthInfo && (
            <View style={styles.connectionInfo}>
              {getConnectionIcon()}
            </View>
          )}
          
          <Animated.View style={chevronStyle}>
            {isOpen ? (
              <ChevronUp size={16} color={ModernTheme.colors.text.secondary} />
            ) : (
              <ChevronDown size={16} color={ModernTheme.colors.text.secondary} />
            )}
          </Animated.View>
        </View>
      </AnimatedTouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsOpen(false)}>
          <AnimatedView
            entering={SlideInDown.delay(100)}
            exiting={SlideOutDown}
            style={[styles.dropdown, dropdownStyle]}
          >
            <BlurView style={styles.dropdownBlur} blurType="dark" blurAmount={20}>
              <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                {showBandwidthInfo && (
                  <View style={styles.bandwidthHeader}>
                    <View style={styles.bandwidthInfo}>
                      {getConnectionIcon()}
                      <Text style={styles.bandwidthHeaderText}>
                        {availableBandwidth.toFixed(1)} Mbps available
                      </Text>
                    </View>
                    <Text style={styles.connectionStatus}>
                      {connectionQuality.charAt(0).toUpperCase() + connectionQuality.slice(1)} connection
                    </Text>
                  </View>
                )}

                {qualityOptions.map((option) => (
                  <Animated.View
                    key={option.level}
                    entering={FadeIn.delay(150)}
                    exiting={FadeOut}
                  >
                    <TouchableOpacity
                      style={[
                        styles.option,
                        option.disabled && styles.disabledOption,
                        currentQuality === option.level && styles.selectedOption,
                      ]}
                      onPress={() => !option.disabled && handleQualitySelect(option.level)}
                      disabled={option.disabled}
                    >
                      <View style={styles.optionContent}>
                        <View style={styles.optionLeft}>
                          <View
                            style={[
                              styles.optionDot,
                              { backgroundColor: getQualityColor(option.level) },
                              option.disabled && styles.disabledDot,
                            ]}
                          />
                          <View style={styles.optionText}>
                            <View style={styles.optionHeader}>
                              <Text
                                style={[
                                  styles.optionLabel,
                                  option.disabled && styles.disabledText,
                                ]}
                              >
                                {option.label}
                              </Text>
                              {option.recommended && (
                                <View style={styles.recommendedBadge}>
                                  <Zap size={10} color={ModernTheme.colors.accent[400]} />
                                  <Text style={styles.recommendedText}>Recommended</Text>
                                </View>
                              )}
                            </View>
                            <Text
                              style={[
                                styles.optionDescription,
                                option.disabled && styles.disabledText,
                              ]}
                            >
                              {option.description}
                            </Text>
                            {option.warning && (
                              <View style={styles.warningContainer}>
                                <AlertTriangle size={12} color={ModernTheme.colors.warning[400]} />
                                <Text style={styles.warningText}>{option.warning}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        
                        <View style={styles.optionRight}>
                          {currentQuality === option.level ? (
                            <CheckCircle size={16} color={ModernTheme.colors.primary[400]} />
                          ) : (
                            <Circle size={16} color={ModernTheme.colors.text.secondary} />
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </ScrollView>
            </BlurView>
          </AnimatedView>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  selectorButton: {
    borderRadius: ModernTheme.borderRadius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    minWidth: 100,
  },
  compactButton: {
    paddingHorizontal: ModernTheme.spacing.xs,
    paddingVertical: 4,
    minWidth: 60,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.xs,
  },
  qualityIndicator: {
    position: 'relative',
  },
  qualityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  qualityInfo: {
    flex: 1,
  },
  qualityLabel: {
    color: ModernTheme.colors.text.primary,
    fontSize: 12,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  compactLabel: {
    fontSize: 10,
  },
  bandwidthText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: 10,
    marginTop: 1,
  },
  connectionInfo: {
    marginRight: ModernTheme.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ModernTheme.spacing.lg,
  },
  dropdown: {
    backgroundColor: 'transparent',
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
    minWidth: 280,
    maxWidth: 350,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownBlur: {
    flex: 1,
  },
  optionsList: {
    padding: ModernTheme.spacing.sm,
  },
  bandwidthHeader: {
    padding: ModernTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: ModernTheme.spacing.xs,
  },
  bandwidthInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.xs,
    marginBottom: 4,
  },
  bandwidthHeaderText: {
    color: ModernTheme.colors.text.primary,
    fontSize: 14,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  connectionStatus: {
    color: ModernTheme.colors.text.secondary,
    fontSize: 12,
  },
  option: {
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.sm,
    marginBottom: ModernTheme.spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedOption: {
    backgroundColor: 'rgba(145, 70, 255, 0.2)',
    borderWidth: 1,
    borderColor: ModernTheme.colors.primary[400],
  },
  disabledOption: {
    opacity: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: ModernTheme.spacing.sm,
  },
  optionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  disabledDot: {
    opacity: 0.3,
  },
  optionText: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.xs,
    marginBottom: 2,
  },
  optionLabel: {
    color: ModernTheme.colors.text.primary,
    fontSize: 14,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  optionDescription: {
    color: ModernTheme.colors.text.secondary,
    fontSize: 12,
  },
  disabledText: {
    opacity: 0.5,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: ModernTheme.borderRadius.sm,
  },
  recommendedText: {
    color: ModernTheme.colors.accent[400],
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.medium,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  warningText: {
    color: ModernTheme.colors.warning[400],
    fontSize: 11,
  },
  optionRight: {
    marginLeft: ModernTheme.spacing.sm,
  },
});

export default QualitySelector;