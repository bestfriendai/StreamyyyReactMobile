import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  Dimensions,
} from 'react-native';
import { MotiView, MotiText } from 'moti';
import { BlurView } from '@react-native-community/blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Settings,
  Monitor,
  Wifi,
  Zap,
  Check,
  X,
  Gauge,
  Activity,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface QualityOption {
  id: string;
  name: string;
  resolution: string;
  bitrate: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const qualityOptions: QualityOption[] = [
  {
    id: 'source',
    name: 'Source',
    resolution: '1080p60',
    bitrate: '6000 kbps',
    description: 'Best quality, highest bandwidth',
    icon: <Gauge size={20} color="#10B981" />,
    color: '#10B981',
  },
  {
    id: '1080p',
    name: 'Ultra',
    resolution: '1080p30',
    bitrate: '4500 kbps',
    description: 'Ultra high quality, high bandwidth',
    icon: <Gauge size={20} color="#8B5CF6" />,
    color: '#8B5CF6',
  },
  {
    id: '720p60',
    name: 'High',
    resolution: '720p60',
    bitrate: '3000 kbps',
    description: 'High quality, smooth motion',
    icon: <Monitor size={20} color="#8B5CF6" />,
    color: '#8B5CF6',
  },
  {
    id: '720p',
    name: 'Medium',
    resolution: '720p30',
    bitrate: '1500 kbps',
    description: 'Good quality, moderate bandwidth',
    icon: <Wifi size={20} color="#F59E0B" />,
    color: '#F59E0B',
  },
  {
    id: '480p',
    name: 'Low',
    resolution: '480p30',
    bitrate: '800 kbps',
    description: 'Lower quality, minimal bandwidth',
    icon: <Zap size={20} color="#EF4444" />,
    color: '#EF4444',
  },
  {
    id: '360p',
    name: 'Mobile',
    resolution: '360p30',
    bitrate: '400 kbps',
    description: 'Mobile-friendly, very low bandwidth',
    icon: <Zap size={20} color="#EF4444" />,
    color: '#EF4444',
  },
  {
    id: 'auto',
    name: 'Auto',
    resolution: 'Adaptive',
    bitrate: 'Variable',
    description: 'Automatically adjusts based on connection',
    icon: <Activity size={20} color="#6366F1" />,
    color: '#6366F1',
  },
];

interface StreamQualityControllerProps {
  streamId: string;
  currentQuality: string;
  onQualityChange: (streamId: string, quality: string) => void;
  onClose: () => void;
  isVisible: boolean;
  position: { x: number; y: number };
}

export const StreamQualityController: React.FC<StreamQualityControllerProps> = ({
  streamId,
  currentQuality,
  onQualityChange,
  onClose,
  isVisible,
  position,
}) => {
  const [selectedQuality, setSelectedQuality] = useState(currentQuality);
  const [networkSpeed, setNetworkSpeed] = useState<'fast' | 'medium' | 'slow'>('medium');
  const [connectionType, setConnectionType] = useState<'wifi' | 'cellular' | 'ethernet'>('wifi');
  const [bandwidth, setBandwidth] = useState<number>(0);
  const [latency, setLatency] = useState<number>(0);
  const [adaptiveEnabled, setAdaptiveEnabled] = useState(false);
  
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [isVisible]);

  // Enhanced network speed detection with actual measurement
  useEffect(() => {
    const detectNetworkSpeed = async () => {
      try {
        const startTime = Date.now();
        
        // Use a small test image to measure download speed
        const testImage = new Image();
        testImage.crossOrigin = 'anonymous';
        
        const testPromise = new Promise((resolve, reject) => {
          testImage.onload = () => resolve(Date.now() - startTime);
          testImage.onerror = () => reject(new Error('Network test failed'));
          testImage.src = 'https://via.placeholder.com/100x100.jpg?t=' + Date.now();
        });

        const downloadTime = await testPromise as number;
        
        // Calculate approximate bandwidth (very rough estimate)
        const imageSize = 1024; // approximately 1KB
        const speedKbps = (imageSize * 8) / (downloadTime / 1000);
        
        setBandwidth(Math.round(speedKbps));
        setLatency(downloadTime);
        
        // Categorize network speed
        if (speedKbps > 2000) {
          setNetworkSpeed('fast');
          setConnectionType('wifi');
        } else if (speedKbps > 500) {
          setNetworkSpeed('medium');
          setConnectionType('wifi');
        } else {
          setNetworkSpeed('slow');
          setConnectionType('cellular');
        }
        
        console.log(`Network speed: ${speedKbps.toFixed(0)} kbps, Latency: ${downloadTime}ms`);
      } catch (error) {
        console.warn('Network speed detection failed:', error);
        // Fallback to default values
        setNetworkSpeed('medium');
        setConnectionType('wifi');
        setBandwidth(1000);
        setLatency(100);
      }
    };

    detectNetworkSpeed();
    const interval = setInterval(detectNetworkSpeed, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleQualitySelect = (qualityId: string) => {
    setSelectedQuality(qualityId);
    onQualityChange(streamId, qualityId);
    
    // Auto-close after selection with a delay
    setTimeout(onClose, 500);
  };

  const getRecommendedQuality = () => {
    // Consider both bandwidth and connection type for recommendations
    if (bandwidth > 4000 && connectionType === 'wifi') {
      return 'source';
    } else if (bandwidth > 2500 && connectionType === 'wifi') {
      return '720p60';
    } else if (bandwidth > 1200) {
      return '720p';
    } else if (bandwidth > 600) {
      return '480p';
    } else if (bandwidth > 300) {
      return '360p';
    } else {
      return 'auto';
    }
  };

  const getAdaptiveQuality = () => {
    // More sophisticated adaptive logic
    if (latency > 200 || connectionType === 'cellular') {
      // High latency or cellular - prefer lower quality
      return bandwidth > 800 ? '480p' : '360p';
    } else if (networkSpeed === 'fast' && bandwidth > 3000) {
      return 'source';
    } else if (networkSpeed === 'medium' && bandwidth > 1500) {
      return '720p';
    } else {
      return '480p';
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const getNetworkSpeedColor = () => {
    switch (networkSpeed) {
      case 'fast': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'slow': return '#EF4444';
      default: return '#6366F1';
    }
  };

  if (!isVisible) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.controllerContainer,
            {
              left: Math.min(position.x, SCREEN_WIDTH - 320),
              top: position.y,
            },
            animatedStyle,
          ]}
        >
          <TouchableOpacity activeOpacity={1}>
            <BlurView style={styles.controllerBlur} blurType="dark" blurAmount={20}>
              <LinearGradient
                colors={['rgba(26, 26, 26, 0.95)', 'rgba(15, 15, 15, 0.9)']}
                style={styles.controllerGradient}
              >
                {/* Header */}
                <MotiView
                  from={{ opacity: 0, translateY: -10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  style={styles.header}
                >
                  <View style={styles.titleContainer}>
                    <Settings size={20} color="#8B5CF6" />
                    <MotiText style={styles.title}>Stream Quality</MotiText>
                  </View>
                  
                  <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <X size={18} color="#666" />
                  </TouchableOpacity>
                </MotiView>

                {/* Network Status */}
                <MotiView
                  from={{ opacity: 0, translateY: -10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 100 }}
                  style={styles.networkStatus}
                >
                  <BlurView style={styles.networkBlur} blurType="light" blurAmount={5}>
                    <View style={styles.networkInfo}>
                      <View
                        style={[
                          styles.networkDot,
                          { backgroundColor: getNetworkSpeedColor() }
                        ]}
                      />
                      <View style={styles.networkDetails}>
                        <View style={styles.networkRow}>
                          <Text style={styles.networkText}>
                            {connectionType.toUpperCase()} • {networkSpeed.toUpperCase()}
                          </Text>
                          <Text style={styles.networkMetrics}>
                            {bandwidth}kbps • {latency}ms
                          </Text>
                        </View>
                        <Text style={styles.recommendedText}>
                          Recommended: {qualityOptions.find(q => q.id === getRecommendedQuality())?.name}
                        </Text>
                      </View>
                    </View>
                  </BlurView>
                </MotiView>

                {/* Quality Options */}
                <View style={styles.optionsContainer}>
                  {qualityOptions.map((option, index) => {
                    const isSelected = selectedQuality === option.id;
                    const isRecommended = option.id === getRecommendedQuality();
                    
                    return (
                      <MotiView
                        key={option.id}
                        from={{ opacity: 0, translateX: -20 }}
                        animate={{ opacity: 1, translateX: 0 }}
                        transition={{ delay: 200 + index * 50 }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.qualityOption,
                            isSelected && styles.selectedOption,
                            isRecommended && styles.recommendedOption,
                          ]}
                          onPress={() => handleQualitySelect(option.id)}
                        >
                          <LinearGradient
                            colors={
                              isSelected 
                                ? [option.color + '20', option.color + '10']
                                : ['rgba(42, 42, 42, 0.8)', 'rgba(58, 58, 58, 0.6)']
                            }
                            style={styles.optionGradient}
                          >
                            <View style={styles.optionContent}>
                              <View style={styles.optionLeft}>
                                <View
                                  style={[
                                    styles.optionIcon,
                                    { backgroundColor: option.color + '20' }
                                  ]}
                                >
                                  {option.icon}
                                </View>
                                
                                <View style={styles.optionInfo}>
                                  <View style={styles.optionHeader}>
                                    <Text
                                      style={[
                                        styles.optionName,
                                        isSelected && { color: option.color }
                                      ]}
                                    >
                                      {option.name}
                                    </Text>
                                    {isRecommended && (
                                      <View style={styles.recommendedBadge}>
                                        <Text style={styles.recommendedBadgeText}>REC</Text>
                                      </View>
                                    )}
                                  </View>
                                  
                                  <Text style={styles.optionResolution}>
                                    {option.resolution}
                                  </Text>
                                  <Text style={styles.optionDescription}>
                                    {option.description}
                                  </Text>
                                </View>
                              </View>
                              
                              <View style={styles.optionRight}>
                                <Text style={styles.optionBitrate}>
                                  {option.bitrate}
                                </Text>
                                {isSelected && (
                                  <MotiView
                                    from={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', damping: 12 }}
                                    style={[
                                      styles.checkIcon,
                                      { backgroundColor: option.color }
                                    ]}
                                  >
                                    <Check size={14} color="#fff" />
                                  </MotiView>
                                )}
                              </View>
                            </View>
                          </LinearGradient>
                        </TouchableOpacity>
                      </MotiView>
                    );
                  })}
                </View>

                {/* Footer */}
                <MotiView
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 600 }}
                  style={styles.footer}
                >
                  <Text style={styles.footerText}>
                    Higher quality uses more bandwidth
                  </Text>
                </MotiView>
              </LinearGradient>
            </BlurView>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controllerContainer: {
    position: 'absolute',
    width: 300,
    borderRadius: 16,
    overflow: 'hidden',
  },
  controllerBlur: {
    borderRadius: 16,
  },
  controllerGradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  networkStatus: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  networkBlur: {
    padding: 12,
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  networkDetails: {
    flex: 1,
  },
  networkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  networkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  networkMetrics: {
    color: '#ccc',
    fontSize: 10,
    fontWeight: '500',
  },
  recommendedText: {
    color: '#999',
    fontSize: 10,
    marginTop: 2,
  },
  optionsContainer: {
    gap: 8,
  },
  qualityOption: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedOption: {
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  recommendedOption: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  optionGradient: {
    padding: 12,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  optionName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  recommendedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  recommendedBadgeText: {
    color: '#10B981',
    fontSize: 8,
    fontWeight: '700',
  },
  optionResolution: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 1,
  },
  optionDescription: {
    color: '#999',
    fontSize: 10,
    lineHeight: 12,
  },
  optionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  optionBitrate: {
    color: '#999',
    fontSize: 10,
    fontWeight: '500',
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
});