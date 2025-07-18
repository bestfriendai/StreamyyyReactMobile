import { useSSO } from '@clerk/clerk-expo';
import React from 'react';
import {
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

interface OAuthButtonProps {
  provider: 'google' | 'discord' | 'twitch';
  onSuccess?: () => void;
  onError?: (error: any) => void;
  style?: any;
  disabled?: boolean;
}

const providerConfig = {
  google: {
    name: 'Google',
    strategy: 'oauth_google' as const,
    color: '#4285F4',
    logo: null, // Will use text fallback
  },
  discord: {
    name: 'Discord',
    strategy: 'oauth_discord' as const,
    color: '#5865F2',
    logo: null, // Will use text fallback
  },
  twitch: {
    name: 'Twitch (via Discord)',
    strategy: 'oauth_discord' as const, // Use Discord since Twitch isn't supported by Clerk
    color: '#9146FF',
    logo: null, // Will use text fallback
  },
};

// Ensure WebBrowser finishes properly before starting OAuth
WebBrowser.maybeCompleteAuthSession();

// Warm up browser for smoother OAuth experience
const useWarmUpBrowser = () => {
  React.useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);
};

export const OAuthButton: React.FC<OAuthButtonProps> = ({
  provider,
  onSuccess,
  onError,
  style,
  disabled = false,
}) => {
  useWarmUpBrowser();
  const config = providerConfig[provider];
  const { startSSOFlow } = useSSO();
  const [isLoading, setIsLoading] = React.useState(false);

  const handlePress = async () => {
    if (disabled || isLoading) return;

    // Special handling for Twitch (which uses Discord)
    if (provider === 'twitch') {
      Alert.alert(
        'Twitch Login',
        'Twitch login will use Discord authentication. Gaming streamers often use Discord for community management.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue with Discord', onPress: () => proceedWithOAuth() }
        ]
      );
      return;
    }

    proceedWithOAuth();
  };

  const proceedWithOAuth = async () => {
    console.log(`🔐 Starting ${config.name} native OAuth flow...`);
    setIsLoading(true);

    try {
      // Check if SSO flow is available
      if (!startSSOFlow) {
        throw new Error(`SSO strategy ${config.strategy} not available`);
      }

      console.log(`📱 Initiating ${config.name} native OAuth with strategy: ${config.strategy}`);
      const result = await startSSOFlow({
        strategy: config.strategy,
        redirectUrl: AuthSession.makeRedirectUri()
      });

      console.log(`✅ ${config.name} native OAuth result:`, {
        hasCreatedSessionId: !!result?.createdSessionId,
        hasSetActive: !!result?.setActive,
        hasSignIn: !!result?.signIn,
        hasSignUp: !!result?.signUp,
        resultKeys: result ? Object.keys(result) : 'no result'
      });

      if (result?.createdSessionId && result?.setActive) {
        console.log(`🔄 Setting active session for ${config.name}...`);
        await result.setActive({ session: result.createdSessionId });
        console.log(`✅ ${config.name} session activated successfully`);
        onSuccess?.();
        router.replace('/(tabs)');
      } else if (result?.signIn || result?.signUp) {
        console.log(`⚠️ ${config.name} OAuth requires additional steps`);
        // Handle additional authentication requirements if needed
        Alert.alert(
          `${config.name} Login`,
          'Additional verification may be required. Please complete the process.'
        );
      } else {
        console.warn(`⚠️ ${config.name} OAuth completed but no session created`);
        Alert.alert(
          `${config.name} Login Issue`,
          'Login completed but no session was created. Please check your Clerk dashboard configuration and try again.'
        );
      }
    } catch (error: any) {
      console.error(`❌ ${config.name} OAuth error:`, error);
      
      let errorMessage = 'An unexpected error occurred.';
      let helpText = '\n\nYou can try:\n• Email/password login\n• Guest mode\n• Contact support if the issue persists';
      
      if (error?.message?.includes('redirect') || error?.message?.includes('URI')) {
        errorMessage = 'OAuth redirect configuration issue detected.';
        helpText = '\n\n🔧 Quick Fix:\n1. The app redirect URL needs to be added to Clerk Dashboard\n2. Check OAUTH_REDIRECT_FIX.md for instructions\n3. Try again after configuration\n\nAlternatively:\n• Use email/password login\n• Continue as guest';
      } else if (error?.message?.includes('not found')) {
        errorMessage = `${config.name} login is not configured in Clerk Dashboard.`;
      } else if (error?.message?.includes('cancelled')) {
        errorMessage = 'Login was cancelled.';
        helpText = '\n\nYou can try again or use:\n• Email/password login\n• Guest mode';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      onError?.(error);
      Alert.alert(
        `${config.name} Login Failed`,
        errorMessage + helpText
      );
    } finally {
      setIsLoading(false);
      console.log(`🏁 ${config.name} OAuth flow completed`);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: config.color },
        disabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <View style={styles.content}>
          {config.logo ? (
            <Image
              source={config.logo}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>
                {provider === 'google' ? 'G' : provider === 'discord' ? 'D' : 'T'}
              </Text>
            </View>
          )}
          <Text style={styles.text}>Continue with {config.name}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 48,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 20,
    height: 20,
  },
  logoPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});
