import React, { useState } from 'react';
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { useOAuth } from '@clerk/clerk-expo';

const { width: screenWidth } = Dimensions.get('window');

export default function SignInSignUpPage() {
  const { signIn, signUp, isLoading, continueAsGuest } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // OAuth hooks
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startTwitchOAuth } = useOAuth({ strategy: 'oauth_twitch' });

  // Animation values
  const logoScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const sparkleRotation = useSharedValue(0);

  React.useEffect(() => {
    logoScale.value = withSpring(1, { damping: 15 });
    sparkleRotation.value = withTiming(360, { duration: 3000 });
  }, []);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (isSignUp && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEmailAuth = async () => {
    if (!validateForm()) return;

    const result = isSignUp 
      ? await signUp(email, password)
      : await signIn(email, password);
    
    if (result.error) {
      Alert.alert(
        isSignUp ? 'Sign Up Failed' : 'Sign In Failed',
        result.error.message || 'Please check your credentials and try again.'
      );
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { createdSessionId, setActive } = await startGoogleOAuth();
      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err) {
      Alert.alert('Google Sign In Failed', 'Please try again.');
    }
  };

  const handleTwitchAuth = async () => {
    try {
      const { createdSessionId, setActive } = await startTwitchOAuth();
      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err) {
      Alert.alert('Twitch Sign In Failed', 'Please try again.');
    }
  };

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const animatedSparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotation.value}deg` }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#0f0f0f', '#1a1a1a', '#0f0f0f']}
        style={styles.background}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section */}
          <Animated.View style={[styles.logoSection, animatedLogoStyle]}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#8B5CF6', '#A855F7', '#C084FC']}
                style={styles.logo}
              >
                <Animated.View style={[styles.sparkle, animatedSparkleStyle]}>
                  <Sparkles size={32} color="#fff" />
                </Animated.View>
              </LinearGradient>
            </View>
            <Text style={styles.appName}>Streamyyy</Text>
            <Text style={styles.tagline}>Your ultimate streaming companion</Text>
          </Animated.View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.formSubtitle}>
              {isSignUp 
                ? 'Join the multi-stream experience' 
                : 'Sign in to continue to your multi-stream experience'
              }
            </Text>

            {/* OAuth Buttons */}
            <View style={styles.oauthSection}>
              <TouchableOpacity style={styles.oauthIconButton} onPress={handleGoogleAuth}>
                <View style={styles.googleButton}>
                  <Image 
                    source={require('../../assets/images/google-icon.png')}
                    style={styles.googleLogo}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.oauthIconButton} onPress={handleTwitchAuth}>
                <View style={styles.twitchButton}>
                  <Image 
                    source={require('../../assets/images/twitch-icon.svg')}
                    style={styles.twitchLogo}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* Divider */}
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
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              {formErrors.email && (
                <Text style={styles.errorText}>{formErrors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#8B5CF6" />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#666" />
                  ) : (
                    <Eye size={20} color="#666" />
                  )}
                </TouchableOpacity>
              </View>
              {formErrors.password && (
                <Text style={styles.errorText}>{formErrors.password}</Text>
              )}
            </View>

            {/* Confirm Password Input (Sign Up only) */}
            {isSignUp && (
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#8B5CF6" />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="#666"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="password"
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
            )}

            {/* Forgot Password (Sign In only) */}
            {!isSignUp && (
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Main Action Button */}
            <Animated.View style={animatedButtonStyle}>
              <TouchableOpacity
                style={styles.mainButton}
                onPress={handleEmailAuth}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.mainGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.mainButtonText}>
                        {isSignUp ? 'Create Account' : 'Sign In'}
                      </Text>
                      <ArrowRight size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Guest Mode */}
            <TouchableOpacity
              style={styles.guestButton}
              onPress={() => {
                continueAsGuest();
                router.replace('/(tabs)');
              }}
            >
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>

            {/* Toggle Sign In/Sign Up */}
            <TouchableOpacity 
              style={styles.toggleContainer}
              onPress={() => setIsSignUp(!isSignUp)}
              activeOpacity={0.8}
            >
              <Text style={styles.toggleText}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              </Text>
              <Text style={styles.toggleLink}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 120,
    justifyContent: 'center',
    minHeight: Dimensions.get('window').height,
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
  formSection: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  formTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  oauthSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 24,
  },
  oauthIconButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  googleButton: {
    width: 64,
    height: 64,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  googleLogo: {
    width: 32,
    height: 32,
  },
  twitchButton: {
    width: 64,
    height: 64,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  twitchLogo: {
    width: 28,
    height: 28,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  dividerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666',
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
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
  },
  mainButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mainGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  mainButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  guestButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginBottom: 32,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  guestButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  toggleText: {
    fontSize: 17,
    fontFamily: 'Inter-Medium',
    color: '#fff',
  },
  toggleLink: {
    fontSize: 18,
    fontFamily: 'Inter-ExtraBold',
    color: '#8B5CF6',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});