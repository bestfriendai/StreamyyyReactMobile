import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { databaseService } from './databaseService';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription_tier: 'free' | 'pro' | 'premium';
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  created_at: string;
  updated_at: string;
}

export interface AuthError {
  message: string;
  type: 'auth' | 'network' | 'validation';
}

class AuthService {
  private readonly STORAGE_KEYS = {
    USER: 'streamyyy_user',
    SESSION: 'streamyyy_session',
    GUEST_MODE: 'streamyyy_guest_mode',
  };

  // Note: Clerk methods are primarily used through hooks in React components
  // This service provides utility methods for data synchronization and local storage

  async signInWithEmail(email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      // This method will be called from the component using Clerk's signIn
      // Here we handle the post-authentication user profile sync
      return {
        user: null,
        error: {
          message: 'Use Clerk signIn hook in React component',
          type: 'auth',
        },
      };
    } catch (error) {
      return {
        user: null,
        error: {
          message: 'Network error occurred',
          type: 'network',
        },
      };
    }
  }

  async signUpWithEmail(email: string, password: string, name: string): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      // This method will be called from the component using Clerk's signUp
      // Here we handle the post-authentication user profile creation
      return {
        user: null,
        error: {
          message: 'Use Clerk signUp hook in React component',
          type: 'auth',
        },
      };
    } catch (error) {
      return {
        user: null,
        error: {
          message: 'Network error occurred',
          type: 'network',
        },
      };
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      // Clear local storage
      await Promise.all([
        AsyncStorage.removeItem(this.STORAGE_KEYS.USER),
        AsyncStorage.removeItem(this.STORAGE_KEYS.SESSION),
        AsyncStorage.removeItem(this.STORAGE_KEYS.GUEST_MODE),
      ]);

      return { error: null };
    } catch (error) {
      return {
        error: {
          message: 'Network error occurred',
          type: 'network',
        },
      };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // First check local storage
      const storedUser = await AsyncStorage.getItem(this.STORAGE_KEYS.USER);
      if (storedUser) {
        return JSON.parse(storedUser);
      }

      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async isGuestMode(): Promise<boolean> {
    try {
      const guestMode = await AsyncStorage.getItem(this.STORAGE_KEYS.GUEST_MODE);
      return guestMode === 'true';
    } catch (error) {
      return false;
    }
  }

  async enableGuestMode(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.GUEST_MODE, 'true');
    } catch (error) {
      console.error('Error enabling guest mode:', error);
    }
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const success = await databaseService.updateUserProfile(userId, updates);
      
      if (!success) {
        return {
          user: null,
          error: {
            message: 'Failed to update user profile',
            type: 'auth',
          },
        };
      }

      const user = await databaseService.getUserProfile(userId);
      if (user) {
        await this.storeUserSession(user);
        return { user, error: null };
      }

      return {
        user: null,
        error: {
          message: 'Failed to retrieve updated user profile',
          type: 'auth',
        },
      };
    } catch (error) {
      return {
        user: null,
        error: {
          message: 'Network error occurred',
          type: 'network',
        },
      };
    }
  }

  async updateSubscription(userId: string, tier: 'free' | 'pro' | 'premium', status: 'active' | 'inactive' | 'cancelled' | 'past_due'): Promise<{ user: User | null; error: AuthError | null }> {
    return this.updateUserProfile(userId, {
      subscription_tier: tier,
      subscription_status: status,
    });
  }

  // Sync Clerk user with our database
  async syncClerkUserWithDatabase(clerkUser: any): Promise<User | null> {
    try {
      const userId = clerkUser.id;
      const email = clerkUser.emailAddresses[0]?.emailAddress || '';
      const name = clerkUser.firstName && clerkUser.lastName 
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser.firstName || clerkUser.username || 'User';
      const avatar = clerkUser.imageUrl;

      // Check if user exists in our database
      let user = await databaseService.getUserProfile(userId);
      
      if (!user) {
        // Create new user profile in our database
        const success = await databaseService.createUserProfile(userId, email, name, avatar);
        if (success) {
          user = await databaseService.getUserProfile(userId);
        }
      } else {
        // Update existing user profile with latest info from Clerk
        await databaseService.updateUserProfile(userId, {
          email,
          name,
          avatar,
          updated_at: new Date().toISOString(),
        });
        user = await databaseService.getUserProfile(userId);
      }

      if (user) {
        await this.storeUserSession(user);
        return user;
      }

      return null;
    } catch (error) {
      console.error('Error syncing Clerk user with database:', error);
      return null;
    }
  }

  private async storeUserSession(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user session:', error);
    }
  }

  // Clear local storage when user signs out
  async clearLocalStorage(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.STORAGE_KEYS.USER),
        AsyncStorage.removeItem(this.STORAGE_KEYS.SESSION),
        AsyncStorage.removeItem(this.STORAGE_KEYS.GUEST_MODE),
      ]);
    } catch (error) {
      console.error('Error clearing local storage:', error);
    }
  }
}

export const authService = new AuthService();
export default authService;