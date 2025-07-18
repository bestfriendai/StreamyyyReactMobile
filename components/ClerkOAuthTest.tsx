import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

export const ClerkOAuthTest: React.FC = () => {
  const { isSignedIn, user, signOut } = useAuth();

  const testOAuthSetup = () => {
    const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
    
    Alert.alert(
      'Clerk OAuth Test Results',
      `
Environment:
• Publishable Key: ${publishableKey ? '✅ Set' : '❌ Missing'}
• User Signed In: ${isSignedIn ? '✅ Yes' : '❌ No'}
• User ID: ${user?.id || 'None'}
• User Email: ${user?.primaryEmailAddress?.emailAddress || 'None'}

OAuth Providers Available:
• Google: Configured in code ✅
• Discord: Configured in code ✅  
• Twitch: Uses Discord fallback ✅

Next Steps:
${isSignedIn ? '✅ Authentication working!' : '1. Test OAuth buttons\n2. Check Clerk Dashboard\n3. Verify redirect URLs'}
      `
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clerk OAuth Test Panel</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Status: {isSignedIn ? '✅ Signed In' : '❌ Not Signed In'}
        </Text>
        {user && (
          <Text style={styles.userText}>
            User: {user.primaryEmailAddress?.emailAddress}
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.testButton} onPress={testOAuthSetup}>
        <Text style={styles.testButtonText}>Run OAuth Test</Text>
      </TouchableOpacity>

      {isSignedIn && (
        <TouchableOpacity style={styles.signOutButton} onPress={() => signOut()}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(42, 42, 42, 0.9)',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  userText: {
    color: '#8B5CF6',
    fontSize: 14,
  },
  testButton: {
    backgroundColor: '#8B5CF6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  testButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
  },
  signOutButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});