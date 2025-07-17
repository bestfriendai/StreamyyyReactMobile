import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  User,
  CheckCircle,
  ArrowLeft,
  Shield,
  Smartphone,
  Globe,
} from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { navigationService } from '@/services/NavigationService';
import { useGlobalStore } from '@/services/SimpleStateManager';

const { width: screenWidth } = Dimensions.get('window');

type AuthStep =
  | 'welcome'
  | 'sign-in'
  | 'sign-up'
  | 'forgot-password'
  | 'verify-email'
  | 'social-login';

interface SocialProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  enabled: boolean;
}

const socialProviders: SocialProvider[] = [
  {
    id: 'google',
    name: 'Google',
    icon: <Globe size={20} color="#fff" />,
    color: '#4285F4',
    enabled: true,
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: <Smartphone size={20} color="#fff" />,
    color: '#5865F2',
    enabled: true,
  },
  {
    id: 'twitch',
    name: 'Twitch',
    icon: <Sparkles size={20} color="#fff" />,
    color: '#9146FF',
    enabled: true,
  },
];

export const AuthenticationFlow: React.FC = () => {
  const { signIn, signUp, isLoading, continueAsGuest } = useAuth();
  const globalStore = useGlobalStore();

  const [currentStep, setCurrentStep] = useState<AuthStep>('welcome');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Animation values
  const slideX = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const contentOpacity = useSharedValue(0);
  const sparkleRotation = useSharedValue(0);

  useEffect(() => {
    // Initial animations
    logoScale.value = withSpring(1, { damping: 15 });
    contentOpacity.value = withTiming(1, { duration: 800 });

    // Sparkle rotation
    const rotateSparkle = () => {
      sparkleRotation.value = withTiming(360, { duration: 3000 }, () => {
        sparkleRotation.value = 0;
        runOnJS(rotateSparkle)();
      });
    };
    rotateSparkle();
  }, []);

  useEffect(() => {
    // Slide animation for step changes
    slideX.value = withSpring(0, { damping: 20 });
  }, [currentStep]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (currentStep === 'sign-up') {
      if (!formData.name.trim()) {
        errors.name = 'Name is required';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }

      if (!agreedToTerms) {
        errors.terms = 'Please agree to the terms and conditions';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) {
      return;
    }

    const result = await signIn(formData.email, formData.password);

    if (result.error) {
      Alert.alert('Sign In Failed', result.error.message);
    } else {
      navigationService.navigateToIntendedDestination();
    }
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    const result = await signUp(formData.email, formData.password, formData.name);

    if (result.error) {
      Alert.alert('Sign Up Failed', result.error.message);
    } else {
      setCurrentStep('verify-email');
    }
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    if (!provider.enabled) {
      Alert.alert('Coming Soon', `${provider.name} login will be available soon!`);
      return;
    }

    // Implement social login
    Alert.alert('Social Login', `${provider.name} login functionality will be implemented here.`);
  };

  const handleGuestContinue = () => {
    continueAsGuest();
    navigationService.navigate('/(tabs)');
  };

  const navigateToStep = (step: AuthStep) => {
    slideX.value = withTiming(-20, { duration: 150 }, () => {
      runOnJS(() => setCurrentStep(step))();
      slideX.value = withTiming(0, { duration: 200 });
    });
  };

  // Animated styles
  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateX: slideX.value }],
  }));

  const animatedSparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotation.value}deg` }],
  }));

  const renderWelcomeStep = () => (
    <Animated.View style={[styles.stepContainer, animatedContentStyle]}>
      <View style={styles.logoSection}>
        <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
          <LinearGradient colors={['#8B5CF6', '#A855F7', '#C084FC']} style={styles.logo}>
            <Animated.View style={[styles.sparkle, animatedSparkleStyle]}>
              <Sparkles size={32} color="#fff" />
            </Animated.View>
          </LinearGradient>
        </Animated.View>
        <Text style={styles.appName}>Streamyyy</Text>
        <Text style={styles.tagline}>Your ultimate streaming companion</Text>
      </View>

      <View style={styles.welcomeContent}>
        <Text style={styles.welcomeTitle}>Welcome to the Future of Streaming</Text>
        <Text style={styles.welcomeDescription}>
          Experience multiple streams like never before. Create custom layouts, discover new
          content, and enjoy seamless multi-streaming.
        </Text>

        <View style={styles.featuresContainer}>
          {[
            { icon: <Shield size={20} color="#8B5CF6" />, text: 'Secure & Private' },
            { icon: <Sparkles size={20} color="#8B5CF6" />, text: 'AI-Powered Discovery' },
            { icon: <Globe size={20} color="#8B5CF6" />, text: 'Cross-Platform Sync' },
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              {feature.icon}
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => navigateToStep('sign-up')}>
          <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.buttonGradient}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <ArrowRight size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigateToStep('sign-in')}>
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ghostButton} onPress={handleGuestContinue}>
          <Text style={styles.ghostButtonText}>Continue as Guest</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderSignInStep = () => (
    <Animated.View style={[styles.stepContainer, animatedContentStyle]}>
      <View style={styles.headerWithBack}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigateToStep('welcome')}>
          <ArrowLeft size={24} color="#8B5CF6" />
        </TouchableOpacity>
        <Text style={styles.stepTitle}>Welcome Back</Text>
      </View>

      <Text style={styles.stepDescription}>
        Sign in to sync your preferences and continue your streaming journey
      </Text>

      <View style={styles.formContainer}>
        {/* Social Login Options */}
        <View style={styles.socialContainer}>
          {socialProviders.map(provider => (
            <TouchableOpacity
              key={provider.id}
              style={[styles.socialButton, { backgroundColor: provider.color }]}
              onPress={() => handleSocialLogin(provider)}
              disabled={!provider.enabled}
            >
              {provider.icon}
              <Text style={styles.socialButtonText}>{provider.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with email</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Mail size={20} color="#8B5CF6" />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#666"
              value={formData.email}
              onChangeText={email => setFormData({ ...formData, email })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
          {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Lock size={20} color="#8B5CF6" />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666"
              value={formData.password}
              onChangeText={password => setFormData({ ...formData, password })}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              {showPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
            </TouchableOpacity>
          </View>
          {formErrors.password && <Text style={styles.errorText}>{formErrors.password}</Text>}
        </View>

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => navigateToStep('forgot-password')}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSignIn} disabled={isLoading}>
          <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.buttonGradient}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Sign In</Text>
                <ArrowRight size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchAuthButton} onPress={() => navigateToStep('sign-up')}>
          <Text style={styles.switchAuthText}>
            Don't have an account? <Text style={styles.switchAuthLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderSignUpStep = () => (
    <Animated.View style={[styles.stepContainer, animatedContentStyle]}>
      <View style={styles.headerWithBack}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigateToStep('welcome')}>
          <ArrowLeft size={24} color="#8B5CF6" />
        </TouchableOpacity>
        <Text style={styles.stepTitle}>Create Account</Text>
      </View>

      <Text style={styles.stepDescription}>
        Join thousands of streamers and discover amazing content
      </Text>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        {/* Social Signup Options */}
        <View style={styles.socialContainer}>
          {socialProviders.slice(0, 2).map(provider => (
            <TouchableOpacity
              key={provider.id}
              style={[styles.socialButton, { backgroundColor: provider.color }]}
              onPress={() => handleSocialLogin(provider)}
              disabled={!provider.enabled}
            >
              {provider.icon}
              <Text style={styles.socialButtonText}>{provider.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or create with email</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Name Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <User size={20} color="#8B5CF6" />
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="#666"
              value={formData.name}
              onChangeText={name => setFormData({ ...formData, name })}
              autoComplete="name"
            />
          </View>
          {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Mail size={20} color="#8B5CF6" />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#666"
              value={formData.email}
              onChangeText={email => setFormData({ ...formData, email })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
          {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Lock size={20} color="#8B5CF6" />
            <TextInput
              style={styles.input}
              placeholder="Password (8+ characters)"
              placeholderTextColor="#666"
              value={formData.password}
              onChangeText={password => setFormData({ ...formData, password })}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              {showPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
            </TouchableOpacity>
          </View>
          {formErrors.password && <Text style={styles.errorText}>{formErrors.password}</Text>}
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Lock size={20} color="#8B5CF6" />
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#666"
              value={formData.confirmPassword}
              onChangeText={confirmPassword => setFormData({ ...formData, confirmPassword })}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeButton}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color="#666" />
              ) : (
                <Eye size={20} color="#666" />
              )}
            </TouchableOpacity>
          </View>
          {formErrors.confirmPassword && (
            <Text style={styles.errorText}>{formErrors.confirmPassword}</Text>
          )}
        </View>

        {/* Terms Agreement */}
        <TouchableOpacity
          style={styles.termsContainer}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
        >
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
            {agreedToTerms && <CheckCircle size={16} color="#8B5CF6" />}
          </View>
          <Text style={styles.termsText}>
            I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>
        {formErrors.terms && <Text style={styles.errorText}>{formErrors.terms}</Text>}

        <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp} disabled={isLoading}>
          <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.buttonGradient}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Create Account</Text>
                <ArrowRight size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchAuthButton} onPress={() => navigateToStep('sign-in')}>
          <Text style={styles.switchAuthText}>
            Already have an account? <Text style={styles.switchAuthLink}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );

  const renderForgotPasswordStep = () => (
    <Animated.View style={[styles.stepContainer, animatedContentStyle]}>
      <View style={styles.headerWithBack}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigateToStep('sign-in')}>
          <ArrowLeft size={24} color="#8B5CF6" />
        </TouchableOpacity>
        <Text style={styles.stepTitle}>Reset Password</Text>
      </View>

      <Text style={styles.stepDescription}>
        Enter your email address and we'll send you a link to reset your password
      </Text>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Mail size={20} color="#8B5CF6" />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#666"
              value={formData.email}
              onChangeText={email => setFormData({ ...formData, email })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            Alert.alert('Reset Link Sent', 'Check your email for password reset instructions.')
          }
        >
          <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.buttonGradient}>
            <Text style={styles.primaryButtonText}>Send Reset Link</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderVerifyEmailStep = () => (
    <Animated.View style={[styles.stepContainer, animatedContentStyle]}>
      <View style={styles.successContainer}>
        <CheckCircle size={64} color="#10B981" />
        <Text style={styles.successTitle}>Check Your Email</Text>
        <Text style={styles.successDescription}>
          We've sent a verification link to {formData.email}. Click the link to activate your
          account.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigationService.navigate('/(tabs)')}
        >
          <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.buttonGradient}>
            <Text style={styles.primaryButtonText}>Continue to App</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => Alert.alert('Email Resent', 'Verification email sent again.')}
        >
          <Text style={styles.secondaryButtonText}>Resend Email</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'sign-in':
        return renderSignInStep();
      case 'sign-up':
        return renderSignUpStep();
      case 'forgot-password':
        return renderForgotPasswordStep();
      case 'verify-email':
        return renderVerifyEmailStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f0f0f', '#1a1a1a', '#0f0f0f']} style={styles.background} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        {renderCurrentStep()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
  keyboardContainer: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  sparkle: {
    position: 'absolute',
  },
  appName: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#999',
    textAlign: 'center',
  },
  headerWithBack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  stepTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  stepDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#999',
    lineHeight: 22,
    marginBottom: 32,
  },
  welcomeContent: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  welcomeTitle: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  welcomeDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#fff',
    marginLeft: 12,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    flex: 1,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  socialButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
    marginHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 42, 42, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#fff',
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
    marginTop: 8,
    marginLeft: 4,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#999',
    lineHeight: 20,
  },
  termsLink: {
    color: '#8B5CF6',
    fontFamily: 'Inter-SemiBold',
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginBottom: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
  },
  ghostButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  ghostButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#666',
  },
  switchAuthButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  switchAuthText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#999',
  },
  switchAuthLink: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  successTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 16,
  },
  successDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
});

export default AuthenticationFlow;
