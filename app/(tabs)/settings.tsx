import { useOAuth } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  User,
  LogOut,
  Shield,
  Bell,
  Palette,
  HelpCircle,
  Star,
  Crown,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Switch,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  SlideInRight,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

// Settings item component - will be defined after styles

export default function SettingsPage() {
  const { user, isSignedIn, isLoading, signOut, continueAsGuest, signIn, signUp } = useAuth();

  // OAuth hooks - Google and Twitch
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startTwitchOAuth } = useOAuth({ strategy: 'oauth_twitch' });

  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  // Email auth state
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Animation values
  const buttonScale = useSharedValue(1);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (isSignUp && !confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (isSignUp && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleButtonPress = (callback: () => void) => {
    buttonScale.value = withSpring(0.95, { damping: 15 }, () => {
      buttonScale.value = withSpring(1, { damping: 15 });
    });
    callback();
  };

  const handleEmailAuth = async () => {
    if (!validateForm()) {
      return;
    }

    const result = isSignUp ? await signUp(email, password, '') : await signIn(email, password);

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
    console.log('🔐 Starting Google OAuth from settings...');
    try {
      const result = await startGoogleOAuth();
      console.log('✅ Google OAuth result:', {
        hasCreatedSessionId: !!result?.createdSessionId,
        hasSetActive: !!result?.setActive,
        resultKeys: result ? Object.keys(result) : 'no result'
      });

      if (result?.createdSessionId && result?.setActive) {
        console.log('🔄 Setting active Google session...');
        await result.setActive({ session: result.createdSessionId });
        console.log('✅ Google session activated, redirecting...');
        router.replace('/(tabs)');
      } else {
        console.warn('⚠️ Google OAuth completed but missing session or setActive');
        Alert.alert(
          'Google Sign In Issue',
          'Login completed but session setup failed. Please try again.'
        );
      }
    } catch (error) {
      console.error('❌ Google OAuth error:', {
        error: error,
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });
      Alert.alert(
        'Google Sign In Failed',
        `Error: ${error?.message || 'Unknown error'}. Please check your internet connection and try again, or use email sign-in instead.`
      );
    }
  };

  const handleTwitchAuth = async () => {
    console.log('🔐 Starting Twitch OAuth from settings...');
    try {
      const result = await startTwitchOAuth();
      console.log('✅ Twitch OAuth result:', {
        hasCreatedSessionId: !!result?.createdSessionId,
        hasSetActive: !!result?.setActive,
        resultKeys: result ? Object.keys(result) : 'no result'
      });

      if (result?.createdSessionId && result?.setActive) {
        console.log('🔄 Setting active Twitch session...');
        await result.setActive({ session: result.createdSessionId });
        console.log('✅ Twitch session activated, redirecting...');
        router.replace('/(tabs)');
      } else {
        console.warn('⚠️ Twitch OAuth completed but missing session or setActive');
        Alert.alert(
          'Twitch Sign In Issue',
          'Login completed but session setup failed. Please try again.'
        );
      }
    } catch (error) {
      console.error('❌ Twitch OAuth error:', {
        error: error,
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });
      Alert.alert(
        'Twitch Sign In Failed',
        `Error: ${error?.message || 'Unknown error'}. Please try again or use Google sign-in instead.`
      );
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const result = await signOut();
            if (result.error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };



  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isSignedIn) {
    // Sign-in UI for non-authenticated users
    return (
      <SafeAreaView style={styles.container}>
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
            {/* Header */}
            <Animated.View entering={FadeIn.delay(200)} style={styles.header}>
              <View style={styles.logoContainer}>
                <LinearGradient colors={['#8B5CF6', '#A855F7', '#C084FC']} style={styles.logo}>
                  <Sparkles size={32} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.appName}>Streamyyy</Text>
              <Text style={styles.tagline}>
                {isSignUp ? 'Create your account' : 'Sign in to access your streaming dashboard'}
              </Text>
            </Animated.View>

            {/* OAuth Buttons */}
            <Animated.View entering={SlideInRight.delay(400)} style={styles.authSection}>
              <Text style={styles.authTitle}>Choose your sign-in method</Text>

              <TouchableOpacity
                style={styles.oauthButton}
                onPress={() => handleButtonPress(handleGoogleAuth)}
              >
                <LinearGradient
                  colors={['rgba(66, 133, 244, 0.1)', 'rgba(66, 133, 244, 0.05)']}
                  style={styles.oauthButtonGradient}
                >
                  <Image
                    source={require('@/assets/images/google-logo-official.png')}
                    style={styles.oauthLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.oauthButtonText}>Continue with Google</Text>
                  <ExternalLink size={20} color="#4285F4" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.oauthButton}
                onPress={() => handleButtonPress(handleTwitchAuth)}
              >
                <LinearGradient
                  colors={['rgba(145, 70, 255, 0.15)', 'rgba(145, 70, 255, 0.05)']}
                  style={styles.oauthButtonGradient}
                >
                  <Image
                    source={require('@/assets/images/twitch-logo-official.png')}
                    style={styles.oauthLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.oauthButtonText}>
                    Twitch (via Discord)
                  </Text>
                  <ExternalLink size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email Form */}
            <Animated.View entering={FadeIn.delay(800)} style={styles.emailSection}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#666" />
                    ) : (
                      <Eye size={20} color="#666" />
                    )}
                  </TouchableOpacity>
                </View>
                {formErrors.password && <Text style={styles.errorText}>{formErrors.password}</Text>}
              </View>

              {/* Confirm Password Input (Sign Up only) */}
              {isSignUp && (
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Lock size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm password"
                      placeholderTextColor="#666"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeIcon}
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

              {/* Email Auth Button */}
              <TouchableOpacity
                style={[styles.emailAuthButton, isLoading && styles.emailAuthButtonDisabled]}
                onPress={() => handleButtonPress(handleEmailAuth)}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#A855F7', '#C084FC']}
                  style={styles.emailAuthButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.emailAuthButtonText}>
                        {isSignUp ? 'Create Account' : 'Sign In'}
                      </Text>
                      <ArrowRight size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Toggle Sign In/Up */}
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setIsSignUp(!isSignUp)}
              >
                <Text style={styles.toggleText}>
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                  <Text style={styles.toggleTextBold}>
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Guest Mode */}
            <Animated.View entering={FadeIn.delay(1000)} style={styles.guestSection}>
              <TouchableOpacity
                style={styles.guestButton}
                onPress={() => {
                  continueAsGuest();
                  router.replace('/(tabs)');
                }}
              >
                <Text style={styles.guestButtonText}>Continue as Guest</Text>
              </TouchableOpacity>
              <Text style={styles.guestNote}>
                Limited features available in guest mode
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Settings UI for authenticated users
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <User size={24} color="#8B5CF6" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name || user?.email || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
            {/* Premium badge - would be shown for premium users */}
            {false && (
              <View style={styles.premiumBadge}>
                <Crown size={16} color="#FFD700" />
                <Text style={styles.premiumText}>
                  PREMIUM
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Settings Sections */}
        <Animated.View entering={SlideInRight.delay(400)} style={styles.settingsContainer}>

          {/* Account Section */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Account</Text>

            <SettingsItem
              icon={<User size={20} color="#8B5CF6" />}
              title="Profile"
              subtitle="Manage your profile information"
              onPress={() => {
                // Navigate to profile screen
                Alert.alert('Profile', 'Profile settings coming soon!');
              }}
            />

            <SettingsItem
              icon={<Shield size={20} color="#10B981" />}
              title="Privacy & Security"
              subtitle="Manage your privacy settings"
              onPress={() => {
                Alert.alert('Privacy', 'Privacy settings coming soon!');
              }}
            />
          </View>

          {/* Preferences Section */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Preferences</Text>

            <SettingsItem
              icon={<Bell size={20} color="#F59E0B" />}
              title="Notifications"
              subtitle="Push notifications and alerts"
              rightElement={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#374151', true: '#8B5CF6' }}
                  thumbColor={notifications ? '#fff' : '#9CA3AF'}
                />
              }
              showChevron={false}
            />

            <SettingsItem
              icon={<Palette size={20} color="#EC4899" />}
              title="Dark Mode"
              subtitle="Toggle dark/light theme"
              rightElement={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#374151', true: '#8B5CF6' }}
                  thumbColor={darkMode ? '#fff' : '#9CA3AF'}
                />
              }
              showChevron={false}
            />
          </View>

          {/* Premium Section */}
          {true && (
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>Upgrade</Text>

              <SettingsItem
                icon={<Star size={20} color="#FFD700" />}
                title="Go Premium"
                subtitle="Unlock unlimited streams and features"
                onPress={() => {
                  Alert.alert('Premium', 'Premium upgrade coming soon!');
                }}
              />
            </View>
          )}

          {/* Support Section */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Support</Text>

            <SettingsItem
              icon={<HelpCircle size={20} color="#6366F1" />}
              title="Help & Support"
              subtitle="Get help and contact support"
              onPress={() => {
                Alert.alert('Support', 'Support page coming soon!');
              }}
            />
          </View>

          {/* Sign Out */}
          <View style={styles.settingsSection}>
            <SettingsItem
              icon={<LogOut size={20} color="#EF4444" />}
              title="Sign Out"
              subtitle="Sign out of your account"
              onPress={handleSignOut}
              showChevron={false}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
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
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  authSection: {
    marginBottom: 40,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 32,
  },
  oauthButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  oauthButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 16,
  },
  oauthLogo: {
    width: 24,
    height: 24,
  },
  oauthButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  oauthButtonDisabled: {
    opacity: 0.6,
  },
  oauthLogoDisabled: {
    opacity: 0.5,
  },
  oauthButtonTextDisabled: {
    color: '#666',
  },
  guestSection: {
    alignItems: 'center',
  },
  guestButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginBottom: 12,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  guestNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  // Signed-in user styles
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  settingsContainer: {
    flex: 1,
  },
  settingsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    marginLeft: 4,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingsItemText: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyboardContainer: {
    flex: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    fontSize: 14,
    marginHorizontal: 16,
  },
  emailSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  emailAuthButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  emailAuthButtonDisabled: {
    opacity: 0.6,
  },
  emailAuthButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  emailAuthButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleText: {
    color: '#666',
    fontSize: 14,
  },
  toggleTextBold: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
});

// Settings item component
const SettingsItem = ({ icon, title, subtitle, onPress, rightElement, showChevron = true }: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}) => (
  <TouchableOpacity
    style={styles.settingsItem}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={styles.settingsItemLeft}>
      <View style={styles.settingsItemIcon}>
        {icon}
      </View>
      <View style={styles.settingsItemText}>
        <Text style={styles.settingsItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    <View style={styles.settingsItemRight}>
      {rightElement}
      {showChevron && onPress && (
        <ChevronRight size={20} color="#666" style={{ marginLeft: 8 }} />
      )}
    </View>
  </TouchableOpacity>
);