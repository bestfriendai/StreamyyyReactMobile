import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-expo';
import { authService, User, AuthError } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  isGuestMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  continueAsGuest: () => void;
  updateProfile: (updates: Partial<User>) => Promise<{ error: AuthError | null }>;
  updateSubscription: (tier: 'free' | 'pro' | 'premium', status: 'active' | 'inactive' | 'cancelled' | 'past_due') => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isSignedIn: clerkIsSignedIn, signOut: clerkSignOut, signIn: clerkSignIn, signUp: clerkSignUp, isLoaded: clerkIsLoaded } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    if (clerkIsLoaded) {
      initializeAuth();
    }
  }, [clerkIsLoaded, clerkIsSignedIn, clerkUser]);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      if (clerkIsSignedIn && clerkUser) {
        // User is signed in with Clerk, sync with our database
        const syncedUser = await authService.syncClerkUserWithDatabase(clerkUser);
        setUser(syncedUser);
        setIsGuestMode(false);
      } else {
        // Check if user is in guest mode
        const guestMode = await authService.isGuestMode();
        setIsGuestMode(guestMode);
        setUser(null);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    try {
      setIsLoading(true);
      
      const result = await clerkSignIn?.create({
        identifier: email,
        password,
      });

      if (result?.status === 'complete') {
        // Clerk sign in successful, but we need to wait for the user state to update
        // The useEffect will handle the sync when clerkUser updates
        return { error: null };
      } else {
        return {
          error: {
            message: 'Sign in failed. Please check your credentials.',
            type: 'auth',
          },
        };
      }
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Sign in failed',
          type: 'auth',
        },
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ error: AuthError | null }> => {
    try {
      setIsLoading(true);
      
      const result = await clerkSignUp?.create({
        emailAddress: email,
        password,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
      });

      if (result?.status === 'complete') {
        // Clerk sign up successful, the useEffect will handle the sync when clerkUser updates
        return { error: null };
      } else {
        return {
          error: {
            message: 'Sign up failed. Please try again.',
            type: 'auth',
          },
        };
      }
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Sign up failed',
          type: 'auth',
        },
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    try {
      setIsLoading(true);
      
      await clerkSignOut();
      await authService.clearLocalStorage();
      
      setUser(null);
      setIsGuestMode(false);
      
      return { error: null };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Sign out failed',
          type: 'auth',
        },
      };
    } finally {
      setIsLoading(false);
    }
  };

  const continueAsGuest = async () => {
    try {
      await authService.enableGuestMode();
      setIsGuestMode(true);
      setUser(null);
    } catch (error) {
      console.error('Error enabling guest mode:', error);
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<{ error: AuthError | null }> => {
    if (!user) {
      return {
        error: {
          message: 'User not authenticated',
          type: 'auth',
        },
      };
    }

    try {
      const result = await authService.updateUserProfile(user.id, updates);
      if (result.user) {
        setUser(result.user);
        return { error: null };
      }
      return { error: result.error };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Failed to update profile',
          type: 'network',
        },
      };
    }
  };

  const updateSubscription = async (
    tier: 'free' | 'pro' | 'premium',
    status: 'active' | 'inactive' | 'cancelled' | 'past_due'
  ): Promise<{ error: AuthError | null }> => {
    if (!user) {
      return {
        error: {
          message: 'User not authenticated',
          type: 'auth',
        },
      };
    }

    try {
      const result = await authService.updateSubscription(user.id, tier, status);
      if (result.user) {
        setUser(result.user);
        return { error: null };
      }
      return { error: result.error };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Failed to update subscription',
          type: 'network',
        },
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSignedIn: clerkIsSignedIn,
        isGuestMode,
        signIn,
        signUp,
        signOut,
        continueAsGuest,
        updateProfile,
        updateSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}