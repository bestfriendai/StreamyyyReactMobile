import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function OAuthCallbackScreen() {
  const { isSignedIn, isLoading } = useAuth();

  useEffect(() => {
    // Wait for auth state to settle
    const timer = setTimeout(() => {
      if (isSignedIn) {
        // Successfully signed in, redirect to main app
        router.replace('/(tabs)');
      } else if (!isLoading) {
        // Sign in failed, redirect back to sign in
        router.replace('/(auth)/sign-in');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isSignedIn, isLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#8B5CF6" />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
    gap: 16,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});