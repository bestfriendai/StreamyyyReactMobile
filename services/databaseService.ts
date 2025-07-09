import { supabase } from '@/lib/supabase';
import { TwitchStream } from '@/services/twitchApi';
import { User } from '@/services/authService';

export interface FavoriteStream {
  id: string;
  user_id: string;
  stream_id: string;
  streamer_name: string;
  streamer_login: string;
  game_name: string;
  thumbnail_url: string;
  created_at: string;
  last_seen_live: string;
}

export interface UserStreamLayout {
  id: string;
  user_id: string;
  name: string;
  streams: TwitchStream[];
  layout_type: 'grid' | 'stacked' | 'pip' | 'focus';
  grid_columns: number;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  tier: 'free' | 'pro' | 'premium';
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

class DatabaseService {
  // User Profile Management
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return this.mapDatabaseUserToUser(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  async createUserProfile(userId: string, email: string, name: string, avatar?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          name,
          avatar,
          subscription_tier: 'free',
          subscription_status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating user profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return false;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  private mapDatabaseUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avatar: dbUser.avatar,
      subscription_tier: dbUser.subscription_tier || 'free',
      subscription_status: dbUser.subscription_status || 'active',
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at,
    };
  }

  // Favorite Streams
  async getFavoriteStreams(userId: string): Promise<TwitchStream[]> {
    try {
      const { data, error } = await supabase
        .from('favorite_streams')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching favorite streams:', error);
        return [];
      }

      // Convert FavoriteStream to TwitchStream format
      return (data || []).map(favorite => ({
        id: favorite.stream_id,
        user_id: favorite.user_id,
        user_name: favorite.streamer_name,
        user_login: favorite.streamer_login,
        game_name: favorite.game_name,
        game_id: '', // Not stored in favorites
        type: 'live' as const,
        title: `${favorite.streamer_name}'s Stream`, // Placeholder
        viewer_count: 0, // Not stored in favorites
        started_at: favorite.last_seen_live,
        language: 'en', // Default
        thumbnail_url: favorite.thumbnail_url,
        tag_ids: [], // Not stored in favorites
        is_mature: false, // Default
      }));
    } catch (error) {
      console.error('Error fetching favorite streams:', error);
      return [];
    }
  }

  async addFavoriteStream(userId: string, stream: TwitchStream): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('favorite_streams')
        .insert({
          user_id: userId,
          stream_id: stream.id,
          streamer_name: stream.user_name,
          streamer_login: stream.user_login,
          game_name: stream.game_name,
          thumbnail_url: stream.thumbnail_url,
          last_seen_live: stream.started_at,
        });

      if (error) {
        console.error('Error adding favorite stream:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error adding favorite stream:', error);
      return false;
    }
  }

  async removeFavoriteStream(userId: string, streamId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('favorite_streams')
        .delete()
        .eq('user_id', userId)
        .eq('stream_id', streamId);

      if (error) {
        console.error('Error removing favorite stream:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error removing favorite stream:', error);
      return false;
    }
  }

  async isFavoriteStream(userId: string, streamId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('favorite_streams')
        .select('id')
        .eq('user_id', userId)
        .eq('stream_id', streamId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking favorite stream:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking favorite stream:', error);
      return false;
    }
  }

  // Stream Layouts
  async getUserStreamLayouts(userId: string): Promise<UserStreamLayout[]> {
    try {
      const { data, error } = await supabase
        .from('user_stream_layouts')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching user stream layouts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user stream layouts:', error);
      return [];
    }
  }

  async saveStreamLayout(userId: string, layout: Omit<UserStreamLayout, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<UserStreamLayout | null> {
    try {
      const { data, error } = await supabase
        .from('user_stream_layouts')
        .insert({
          user_id: userId,
          ...layout,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving stream layout:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error saving stream layout:', error);
      return null;
    }
  }

  async updateStreamLayout(userId: string, layoutId: string, updates: Partial<UserStreamLayout>): Promise<UserStreamLayout | null> {
    try {
      const { data, error } = await supabase
        .from('user_stream_layouts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', layoutId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating stream layout:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error updating stream layout:', error);
      return null;
    }
  }

  async deleteStreamLayout(userId: string, layoutId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_stream_layouts')
        .delete()
        .eq('id', layoutId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting stream layout:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting stream layout:', error);
      return false;
    }
  }

  // Subscription Management
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user subscription:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }
  }

  async createUserSubscription(userId: string, tier: 'free' | 'pro' | 'premium'): Promise<UserSubscription | null> {
    try {
      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          tier,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: nextMonth.toISOString(),
          cancel_at_period_end: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user subscription:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating user subscription:', error);
      return null;
    }
  }

  async updateUserSubscription(userId: string, updates: Partial<UserSubscription>): Promise<UserSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user subscription:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error updating user subscription:', error);
      return null;
    }
  }

  // Analytics and Usage
  async recordStreamView(userId: string, streamId: string, streamName: string, duration: number): Promise<void> {
    try {
      await supabase
        .from('stream_views')
        .insert({
          user_id: userId,
          stream_id: streamId,
          stream_name: streamName,
          duration_seconds: duration,
          viewed_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error recording stream view:', error);
    }
  }

  async getUserStreamStats(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('stream_views')
        .select('*')
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching user stream stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user stream stats:', error);
      return null;
    }
  }

  // Real-time subscriptions
  subscribeToFavoriteStreams(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('favorite_streams')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'favorite_streams',
        filter: `user_id=eq.${userId}`,
      }, callback)
      .subscribe();
  }

  subscribeToUserSubscription(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('user_subscriptions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_subscriptions',
        filter: `user_id=eq.${userId}`,
      }, callback)
      .subscribe();
  }
}

export const databaseService = new DatabaseService();
export default databaseService;