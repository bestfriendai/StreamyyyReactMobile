import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { OAuthButton } from './OAuthButton';

interface OAuthButtonsProps {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  style?: any;
  showTwitch?: boolean;
  showDiscord?: boolean;
}

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({
  onSuccess,
  onError,
  style,
  showTwitch = true,
  showDiscord = false, // Default to false per user preference
}) => {
  console.log('🔗 Rendering OAuth buttons:', { showTwitch, showDiscord });

  // Check if Clerk publishable key is available
  const clerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  if (!clerkKey) {
    console.error('❌ EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY not found');
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            OAuth configuration missing. Please check environment variables.
          </Text>
        </View>
      </View>
    );
  }

  // OAuth is now properly configured with custom scheme
  const oauthConfigured = true; // OAuth ready with streamyyy://oauth-callback scheme

  if (!oauthConfigured) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.tempDisabledContainer}>
          <Text style={styles.tempDisabledText}>
            OAuth temporarily disabled - configure redirect URLs in Clerk Dashboard first
          </Text>
          <Text style={styles.tempDisabledSubtext}>
            Use email/password or guest mode for now
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <OAuthButton
        provider="google"
        onSuccess={onSuccess}
        onError={onError}
        style={styles.button}
      />

      {showTwitch && (
        <OAuthButton
          provider="twitch"
          onSuccess={onSuccess}
          onError={onError}
          style={styles.button}
        />
      )}

      {showDiscord && (
        <OAuthButton
          provider="discord"
          onSuccess={onSuccess}
          onError={onError}
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  button: {
    width: '100%',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    fontSize: 14,
  },
  tempDisabledContainer: {
    padding: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  tempDisabledText: {
    color: '#F59E0B',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  tempDisabledSubtext: {
    color: '#D97706',
    textAlign: 'center',
    fontSize: 12,
  },
});
