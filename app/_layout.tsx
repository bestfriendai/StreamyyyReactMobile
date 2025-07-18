import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import '../debug-env'; // Temporary debug import
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider } from '@clerk/clerk-expo';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { StreamManagerProvider } from '@/contexts/StreamManagerContext';
import { adMobService } from '@/services/adMobService';
import { interstitialAdService } from '@/services/interstitialAdService';
import { setupGlobalErrorHandlers } from '@/utils/errorHandler';
import { TamaguiProvider } from '@tamagui/core';
import config from '../tamagui.config';
import '@/utils/adDebugUtils'; // Load debug utilities

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    // Setup global error handlers for better debugging
    setupGlobalErrorHandlers();

    // Initialize AdMob service and interstitial ads
    adMobService
      .initialize()
      .then(() => {
        // Initialize interstitial ads after main SDK is ready
        return interstitialAdService.initialize();
      })
      .catch(console.error);

    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary>
      <TamaguiProvider config={config}>
        <ThemeProvider defaultMode="dark">
          <ClerkProvider publishableKey={clerkPublishableKey}>
            <AuthProvider>
              <StreamManagerProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="light" backgroundColor="#000" />
              </StreamManagerProvider>
            </AuthProvider>
          </ClerkProvider>
        </ThemeProvider>
      </TamaguiProvider>
    </ErrorBoundary>
  );
}
