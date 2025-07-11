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

  // Enhanced Clerk user sync with our database
  async syncClerkUserWithDatabase(clerkUser: any): Promise<User | null> {
    try {
      console.log('🔄 Syncing Clerk user with database', { userId: clerkUser.id });
      
      // Validate Clerk user data
      if (!clerkUser || !clerkUser.id) {
        console.error('❌ Invalid Clerk user data provided');
        return null;
      }

      const userId = clerkUser.id;
      const email = clerkUser.emailAddresses?.[0]?.emailAddress || clerkUser.emailAddress || '';
      const firstName = clerkUser.firstName || '';
      const lastName = clerkUser.lastName || '';
      const username = clerkUser.username || '';
      
      // Construct name with fallbacks
      const name = firstName && lastName 
        ? `${firstName} ${lastName}`
        : firstName || username || `User ${userId.slice(-4)}`;
      
      const avatar = clerkUser.imageUrl || clerkUser.profileImageUrl || '';

      // Validate required fields
      if (!email) {
        console.warn('⚠️ No email found for Clerk user, using fallback');
      }

      console.log('📋 User data extracted from Clerk', { 
        userId, 
        email: email ? 'present' : 'missing', 
        name, 
        avatar: avatar ? 'present' : 'missing' 
      });

      // Check if user exists in our database with retry logic
      let user = await this.retryDatabaseOperation(() => 
        databaseService.getUserProfile(userId)
      );
      
      if (!user) {
        console.log('👤 Creating new user profile in database');
        
        // Create new user profile in our database
        const success = await this.retryDatabaseOperation(() =>
          databaseService.createUserProfile(userId, email, name, avatar)
        );
        
        if (success) {
          user = await this.retryDatabaseOperation(() =>
            databaseService.getUserProfile(userId)
          );
          
          if (user) {
            console.log('✅ New user profile created successfully');
          } else {
            console.error('❌ Failed to retrieve newly created user profile');
          }
        } else {
          console.error('❌ Failed to create user profile in database');
          return null;
        }
      } else {
        console.log('🔄 Updating existing user profile with latest Clerk data');
        
        // Update existing user profile with latest info from Clerk
        const updateSuccess = await this.retryDatabaseOperation(() =>
          databaseService.updateUserProfile(userId, {
            email,
            name,
            avatar,
            updated_at: new Date().toISOString(),
          })
        );
        
        if (updateSuccess) {
          user = await this.retryDatabaseOperation(() =>
            databaseService.getUserProfile(userId)
          );
          
          if (user) {
            console.log('✅ User profile updated successfully');
          }
        } else {
          console.warn('⚠️ Failed to update user profile, using cached data');
        }
      }

      if (user) {
        // Store user session locally
        await this.storeUserSession(user);
        
        // Validate user data integrity
        if (!this.validateUserData(user)) {
          console.warn('⚠️ User data validation failed, but continuing');
        }
        
        console.log('✅ User sync completed successfully', { 
          userId: user.id, 
          subscription: user.subscription_tier 
        });
        
        return user;
      }

      console.error('❌ Failed to sync user - no user data available');
      return null;
    } catch (error) {
      console.error('❌ Error syncing Clerk user with database:', error);
      
      // Try to recover with cached user data
      try {
        const cachedUser = await this.getCurrentUser();
        if (cachedUser && cachedUser.id === clerkUser.id) {
          console.log('🔄 Using cached user data as fallback');
          return cachedUser;
        }
      } catch (cacheError) {
        console.error('❌ Failed to retrieve cached user data:', cacheError);
      }
      
      return null;
    }
  }

  // Helper method to retry database operations
  private async retryDatabaseOperation<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }
    
    throw lastError;
  }

  // Validate user data integrity
  private validateUserData(user: User): boolean {
    const requiredFields = ['id', 'email', 'name', 'subscription_tier', 'subscription_status'];
    
    for (const field of requiredFields) {
      if (!user[field as keyof User]) {
        console.warn(`⚠️ Missing required user field: ${field}`);
        return false;
      }
    }
    
    // Validate subscription tier
    const validTiers = ['free', 'pro', 'premium'];
    if (!validTiers.includes(user.subscription_tier)) {
      console.warn(`⚠️ Invalid subscription tier: ${user.subscription_tier}`);
      return false;
    }
    
    // Validate subscription status
    const validStatuses = ['active', 'inactive', 'cancelled', 'past_due'];
    if (!validStatuses.includes(user.subscription_status)) {
      console.warn(`⚠️ Invalid subscription status: ${user.subscription_status}`);
      return false;
    }
    
    return true;
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