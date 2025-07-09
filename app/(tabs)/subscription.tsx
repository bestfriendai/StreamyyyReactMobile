import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Crown, 
  Check, 
  X, 
  Star, 
  Zap, 
  Shield, 
  Sparkles,
  TrendingUp,
  Users,
  Grid,
  Settings
} from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  interpolate,
} from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store/useAppStore';

const { width: screenWidth } = Dimensions.get('window');

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  period: 'month' | 'year';
  maxStreams: number;
  features: string[];
  recommended?: boolean;
  icon: React.ComponentType<any>;
  color: string;
  gradient: string[];
}

const plans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'free',
    displayName: 'Free',
    price: 0,
    period: 'month',
    maxStreams: 4,
    features: [
      'Up to 4 streams',
      'Basic layouts',
      'Standard quality',
      'Community support',
    ],
    icon: Users,
    color: '#6B7280',
    gradient: ['#6B7280', '#4B5563'],
  },
  {
    id: 'pro',
    name: 'pro',
    displayName: 'Pro',
    price: 9.99,
    period: 'month',
    maxStreams: 8,
    features: [
      'Up to 8 streams',
      'Advanced layouts',
      'HD quality',
      'Priority support',
      'Custom themes',
      'Layout saving',
    ],
    recommended: true,
    icon: Zap,
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#7C3AED'],
  },
  {
    id: 'premium',
    name: 'premium',
    displayName: 'Premium',
    price: 19.99,
    period: 'month',
    maxStreams: 20,
    features: [
      'Up to 20 streams',
      'All layouts',
      '4K quality',
      'Premium support',
      'Advanced analytics',
      'Custom overlays',
      'Stream recording',
      'Priority features',
    ],
    icon: Crown,
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'],
  },
];

export default function SubscriptionScreen() {
  const { user, isSignedIn } = useAuth();
  const { tier, status, updateSubscription } = useAppStore();
  const [selectedPlan, setSelectedPlan] = useState<string>(tier);
  const [isProcessing, setIsProcessing] = useState(false);

  // Animation values
  const sparkleRotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const slideIn = useSharedValue(0);

  React.useEffect(() => {
    // Entrance animation
    slideIn.value = withSpring(1, { damping: 15 });
    
    // Continuous animations
    sparkleRotation.value = withRepeat(
      withTiming(360, { duration: 4000 }),
      -1,
      false
    );
    
    pulseScale.value = withRepeat(
      withTiming(1.05, { duration: 2000 }),
      -1,
      true
    );
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (!isSignedIn) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to subscribe to a plan.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => console.log('Navigate to sign in') },
        ]
      );
      return;
    }

    setIsProcessing(true);
    
    try {
      // Mock subscription process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      updateSubscription({
        tier: planId as any,
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
      });
      
      Alert.alert(
        'Success!',
        `You've successfully subscribed to ${plans.find(p => p.id === planId)?.displayName}!`
      );
    } catch (error) {
      Alert.alert(
        'Subscription Failed',
        'There was an error processing your subscription. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const animatedSparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotation.value}deg` }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const animatedSlideStyle = useAnimatedStyle(() => {
    const translateY = interpolate(slideIn.value, [0, 1], [50, 0]);
    const opacity = interpolate(slideIn.value, [0, 1], [0, 1]);
    
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  const PlanCard = ({ plan, index }: { plan: SubscriptionPlan; index: number }) => {
    const cardScale = useSharedValue(1);
    const IconComponent = plan.icon;
    
    const animatedCardStyle = useAnimatedStyle(() => ({
      transform: [{ scale: cardScale.value }],
    }));

    const handlePressIn = () => {
      cardScale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
      cardScale.value = withSpring(1);
    };

    const isCurrentPlan = tier === plan.id;
    const isSelected = selectedPlan === plan.id;

    return (
      <Animated.View
        style={[
          animatedCardStyle,
          {
            transform: [{ translateY: slideIn.value }],
            opacity: slideIn.value,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.planCard,
            isCurrentPlan && styles.currentPlanCard,
            isSelected && styles.selectedPlanCard,
          ]}
          onPress={() => setSelectedPlan(plan.id)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <LinearGradient
            colors={isCurrentPlan ? plan.gradient : ['rgba(42, 42, 42, 0.8)', 'rgba(58, 58, 58, 0.8)']}
            style={styles.planGradient}
          >
            {plan.recommended && (
              <View style={styles.recommendedBadge}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={styles.recommendedGradient}
                >
                  <Star size={12} color="#fff" />
                  <Text style={styles.recommendedText}>RECOMMENDED</Text>
                </LinearGradient>
              </View>
            )}

            <View style={styles.planHeader}>
              <View style={styles.planIconContainer}>
                <LinearGradient
                  colors={plan.gradient}
                  style={styles.planIcon}
                >
                  <IconComponent size={24} color="#fff" />
                </LinearGradient>
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{plan.displayName}</Text>
                <View style={styles.planPriceContainer}>
                  <Text style={styles.planPrice}>
                    ${plan.price === 0 ? 'Free' : plan.price.toFixed(2)}
                  </Text>
                  {plan.price > 0 && (
                    <Text style={styles.planPeriod}>/{plan.period}</Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.planFeatures}>
              {plan.features.map((feature, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <Check size={16} color="#22C55E" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <View style={styles.planFooter}>
              <View style={styles.streamLimit}>
                <Grid size={16} color={plan.color} />
                <Text style={styles.streamLimitText}>
                  {plan.maxStreams} streams max
                </Text>
              </View>
              
              {isCurrentPlan ? (
                <View style={styles.currentPlanButton}>
                  <LinearGradient
                    colors={['#22C55E', '#16A34A']}
                    style={styles.currentPlanGradient}
                  >
                    <Check size={16} color="#fff" />
                    <Text style={styles.currentPlanText}>Current Plan</Text>
                  </LinearGradient>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.subscribeButton}
                  onPress={() => handleSubscribe(plan.id)}
                  disabled={isProcessing}
                >
                  <LinearGradient
                    colors={plan.gradient}
                    style={styles.subscribeGradient}
                  >
                    <Text style={styles.subscribeText}>
                      {plan.price === 0 ? 'Downgrade' : 'Subscribe'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0f0f0f', '#1a1a1a', '#0f0f0f']}
        style={styles.background}
      />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View style={[styles.header, animatedSlideStyle]}>
          <View style={styles.headerContent}>
            <Animated.View style={[styles.headerIcon, animatedSparkleStyle]}>
              <Sparkles size={32} color="#8B5CF6" />
            </Animated.View>
            <Text style={styles.headerTitle}>Choose Your Plan</Text>
            <Text style={styles.headerSubtitle}>
              Unlock the full potential of multi-stream viewing
            </Text>
          </View>
        </Animated.View>

        {/* Current Status */}
        {isSignedIn && (
          <Animated.View style={[styles.statusCard, animatedPulseStyle]}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.1)', 'rgba(124, 58, 237, 0.1)']}
              style={styles.statusGradient}
            >
              <View style={styles.statusContent}>
                <View style={styles.statusInfo}>
                  <Text style={styles.statusTitle}>Current Plan</Text>
                  <Text style={styles.statusPlan}>
                    {plans.find(p => p.id === tier)?.displayName} • {status}
                  </Text>
                </View>
                <View style={styles.statusActions}>
                  <TouchableOpacity style={styles.manageButton}>
                    <Settings size={16} color="#8B5CF6" />
                    <Text style={styles.manageText}>Manage</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Plans */}
        <View style={styles.plansContainer}>
          {plans.map((plan, index) => (
            <PlanCard key={plan.id} plan={plan} index={index} />
          ))}
        </View>

        {/* Features Comparison */}
        <Animated.View style={[styles.comparisonSection, animatedSlideStyle]}>
          <Text style={styles.comparisonTitle}>Why Upgrade?</Text>
          
          <View style={styles.comparisonGrid}>
            <View style={styles.comparisonItem}>
              <TrendingUp size={24} color="#22C55E" />
              <Text style={styles.comparisonItemTitle}>More Streams</Text>
              <Text style={styles.comparisonItemText}>
                Watch more streams simultaneously with higher tier plans
              </Text>
            </View>
            
            <View style={styles.comparisonItem}>
              <Shield size={24} color="#3B82F6" />
              <Text style={styles.comparisonItemTitle}>Better Quality</Text>
              <Text style={styles.comparisonItemText}>
                Enjoy HD and 4K streaming with premium plans
              </Text>
            </View>
            
            <View style={styles.comparisonItem}>
              <Zap size={24} color="#F59E0B" />
              <Text style={styles.comparisonItemTitle}>Advanced Features</Text>
              <Text style={styles.comparisonItemText}>
                Get access to custom themes, layouts, and analytics
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* FAQ */}
        <Animated.View style={[styles.faqSection, animatedSlideStyle]}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I change my plan anytime?</Text>
            <Text style={styles.faqAnswer}>
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What happens to my streams when I downgrade?</Text>
            <Text style={styles.faqAnswer}>
              Your active streams will be reduced to match your new plan limits. You can choose which streams to keep.
            </Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Is there a free trial?</Text>
            <Text style={styles.faqAnswer}>
              Yes! All paid plans come with a 7-day free trial. Cancel anytime during the trial period.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  statusCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statusGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  statusContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#999',
    marginBottom: 4,
  },
  statusPlan: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  statusActions: {
    flexDirection: 'row',
    gap: 8,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  manageText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
  },
  plansContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  planCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  currentPlanCard: {
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  selectedPlanCard: {
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  planGradient: {
    padding: 20,
    position: 'relative',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  recommendedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  recommendedText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planIconContainer: {
    marginRight: 12,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 4,
  },
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  planPeriod: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#999',
    marginLeft: 2,
  },
  planFeatures: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#fff',
    marginLeft: 8,
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streamLimit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streamLimitText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#999',
  },
  currentPlanButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  currentPlanGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  currentPlanText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  subscribeButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  subscribeGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  subscribeText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  comparisonSection: {
    padding: 24,
  },
  comparisonTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  comparisonGrid: {
    gap: 16,
  },
  comparisonItem: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(42, 42, 42, 0.5)',
    borderRadius: 12,
  },
  comparisonItemTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  comparisonItemText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  faqSection: {
    padding: 24,
  },
  faqTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  faqItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(42, 42, 42, 0.5)',
    borderRadius: 12,
  },
  faqQuestion: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#999',
    lineHeight: 20,
  },
});