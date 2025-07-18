import { UnifiedStream } from './platformService';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  bio: string;
  location: string;
  website: string;
  joinedAt: string;
  lastActiveAt: string;
  preferences: {
    preferredPlatforms: string[];
    preferredCategories: string[];
    notifications: {
      streamGoesLive: boolean;
      newFollower: boolean;
      communityUpdates: boolean;
      streamSchedule: boolean;
    };
    privacy: {
      showEmail: boolean;
      showLocation: boolean;
      showActivity: boolean;
      allowDirectMessages: boolean;
    };
  };
  stats: {
    followingCount: number;
    followersCount: number;
    streamsWatched: number;
    totalWatchTime: number;
    favoriteStreams: number;
    communitiesJoined: number;
  };
  badges: Badge[];
  subscription: {
    tier: 'free' | 'pro' | 'premium';
    status: 'active' | 'inactive' | 'cancelled';
    expiresAt: string | null;
  };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockedAt: string;
  criteria: {
    type: 'watch_time' | 'streams_watched' | 'followers' | 'social' | 'special';
    requirement: number | string;
    description: string;
  };
}

export interface Streamer {
  id: string;
  platform: string;
  username: string;
  displayName: string;
  avatar: string;
  verified: boolean;
  description: string;
  category: string;
  followerCount: number;
  isLive: boolean;
  lastLiveAt: string;
  schedule: StreamSchedule[];
  socialLinks: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    discord?: string;
    website?: string;
  };
  stats: {
    totalViews: number;
    averageViewers: number;
    totalStreams: number;
    hoursStreamed: number;
    peakViewers: number;
    lastStreamTitle: string;
  };
  tags: string[];
  achievements: string[];
}

export interface StreamSchedule {
  id: string;
  streamerId: string;
  title: string;
  description: string;
  category: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  recurrencePattern: string;
  timezone: string;
  isConfirmed: boolean;
  attendees: string[];
  maxViewers?: number;
  tags: string[];
  metadata: Record<string, any>;
}

export interface StreamClip {
  id: string;
  streamId: string;
  streamerId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  clipUrl: string;
  duration: number;
  createdAt: string;
  createdBy: string;
  platform: string;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  tags: string[];
  isPublic: boolean;
  isHighlighted: boolean;
  timestamp: number; // Position in original stream
  metadata: {
    quality: string;
    resolution: string;
    fps: number;
    bitrate: number;
    codec: string;
  };
}

export interface SocialPost {
  id: string;
  authorId: string;
  author: {
    username: string;
    displayName: string;
    avatar: string;
    verified: boolean;
  };
  content: string;
  type: 'text' | 'clip' | 'stream_share' | 'achievement' | 'community_update';
  attachments: {
    type: 'image' | 'video' | 'clip' | 'stream';
    url: string;
    metadata: Record<string, any>;
  }[];
  createdAt: string;
  updatedAt: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isBookmarked: boolean;
  visibility: 'public' | 'followers' | 'private';
  tags: string[];
  mentions: string[];
  location?: string;
  platform?: string;
  streamId?: string;
  clipId?: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: {
    username: string;
    displayName: string;
    avatar: string;
    verified: boolean;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  replies: Comment[];
  parentId?: string;
  isLiked: boolean;
  mentions: string[];
  attachments: {
    type: 'image' | 'gif' | 'emoji';
    url: string;
  }[];
}

export interface Following {
  id: string;
  followerId: string;
  followingId: string;
  followingType: 'user' | 'streamer';
  createdAt: string;
  notifications: {
    streamGoesLive: boolean;
    newPosts: boolean;
    achievements: boolean;
    scheduleUpdates: boolean;
  };
  metadata: {
    platform?: string;
    category?: string;
    source: string;
  };
}

export interface Activity {
  id: string;
  userId: string;
  type: 'stream_watched' | 'streamer_followed' | 'clip_created' | 'post_created' | 'achievement_unlocked' | 'community_joined';
  title: string;
  description: string;
  metadata: Record<string, any>;
  createdAt: string;
  isPublic: boolean;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

class SocialService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.streammulti.com';

  constructor() {
    console.log('Social Service initialized');
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // User Profile Management
  async getUserProfile(userId: string): Promise<UserProfile> {
    console.log(`🔄 Fetching user profile: ${userId}`);
    
    try {
      const profile = await this.makeRequest<UserProfile>(`/users/${userId}`);
      console.log(`✅ User profile fetched: ${profile.username}`);
      return profile;
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    console.log(`🔄 Updating user profile: ${userId}`);
    
    try {
      const profile = await this.makeRequest<UserProfile>(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      console.log(`✅ User profile updated: ${profile.username}`);
      return profile;
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      throw error;
    }
  }

  // Following System
  async followStreamer(userId: string, streamerId: string, platform: string): Promise<Following> {
    console.log(`🔄 Following streamer: ${streamerId} on ${platform}`);
    
    try {
      const following = await this.makeRequest<Following>('/follows', {
        method: 'POST',
        body: JSON.stringify({
          followerId: userId,
          followingId: streamerId,
          followingType: 'streamer',
          metadata: { platform },
        }),
      });
      
      console.log(`✅ Successfully followed streamer: ${streamerId}`);
      return following;
    } catch (error) {
      console.error('❌ Failed to follow streamer:', error);
      throw error;
    }
  }

  async unfollowStreamer(userId: string, streamerId: string): Promise<void> {
    console.log(`🔄 Unfollowing streamer: ${streamerId}`);
    
    try {
      await this.makeRequest(`/follows/${userId}/${streamerId}`, {
        method: 'DELETE',
      });
      
      console.log(`✅ Successfully unfollowed streamer: ${streamerId}`);
    } catch (error) {
      console.error('❌ Failed to unfollow streamer:', error);
      throw error;
    }
  }

  async getFollowedStreamers(userId: string): Promise<Streamer[]> {
    console.log(`🔄 Fetching followed streamers for user: ${userId}`);
    
    try {
      const streamers = await this.makeRequest<Streamer[]>(`/users/${userId}/following/streamers`);
      console.log(`✅ Fetched ${streamers.length} followed streamers`);
      return streamers;
    } catch (error) {
      console.error('❌ Failed to fetch followed streamers:', error);
      throw error;
    }
  }

  async getFollowers(userId: string): Promise<UserProfile[]> {
    console.log(`🔄 Fetching followers for user: ${userId}`);
    
    try {
      const followers = await this.makeRequest<UserProfile[]>(`/users/${userId}/followers`);
      console.log(`✅ Fetched ${followers.length} followers`);
      return followers;
    } catch (error) {
      console.error('❌ Failed to fetch followers:', error);
      throw error;
    }
  }

  // Clip Management
  async createClip(clipData: Omit<StreamClip, 'id' | 'createdAt' | 'viewCount' | 'likeCount' | 'shareCount'>): Promise<StreamClip> {
    console.log(`🔄 Creating clip: ${clipData.title}`);
    
    try {
      const clip = await this.makeRequest<StreamClip>('/clips', {
        method: 'POST',
        body: JSON.stringify(clipData),
      });
      
      console.log(`✅ Clip created: ${clip.title}`);
      return clip;
    } catch (error) {
      console.error('❌ Failed to create clip:', error);
      throw error;
    }
  }

  async getClips(filters: {
    streamerId?: string;
    platform?: string;
    category?: string;
    userId?: string;
    timeRange?: '24h' | '7d' | '30d' | '1y' | 'all';
    sort?: 'newest' | 'oldest' | 'most_viewed' | 'most_liked';
    limit?: number;
  } = {}): Promise<StreamClip[]> {
    console.log('🔄 Fetching clips with filters:', filters);
    
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
      
      const clips = await this.makeRequest<StreamClip[]>(`/clips?${queryParams.toString()}`);
      console.log(`✅ Fetched ${clips.length} clips`);
      return clips;
    } catch (error) {
      console.error('❌ Failed to fetch clips:', error);
      throw error;
    }
  }

  async likeClip(clipId: string, userId: string): Promise<void> {
    console.log(`🔄 Liking clip: ${clipId}`);
    
    try {
      await this.makeRequest(`/clips/${clipId}/like`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      
      console.log(`✅ Clip liked: ${clipId}`);
    } catch (error) {
      console.error('❌ Failed to like clip:', error);
      throw error;
    }
  }

  async shareClip(clipId: string, platform: string, message?: string): Promise<void> {
    console.log(`🔄 Sharing clip ${clipId} to ${platform}`);
    
    try {
      await this.makeRequest(`/clips/${clipId}/share`, {
        method: 'POST',
        body: JSON.stringify({ platform, message }),
      });
      
      console.log(`✅ Clip shared to ${platform}`);
    } catch (error) {
      console.error('❌ Failed to share clip:', error);
      throw error;
    }
  }

  // Social Posts
  async createPost(postData: Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'comments' | 'shares' | 'isLiked' | 'isBookmarked'>): Promise<SocialPost> {
    console.log('🔄 Creating social post');
    
    try {
      const post = await this.makeRequest<SocialPost>('/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      });
      
      console.log(`✅ Post created: ${post.id}`);
      return post;
    } catch (error) {
      console.error('❌ Failed to create post:', error);
      throw error;
    }
  }

  async getFeed(userId: string, limit: number = 20): Promise<SocialPost[]> {
    console.log(`🔄 Fetching feed for user: ${userId}`);
    
    try {
      const posts = await this.makeRequest<SocialPost[]>(`/users/${userId}/feed?limit=${limit}`);
      console.log(`✅ Fetched ${posts.length} posts in feed`);
      return posts;
    } catch (error) {
      console.error('❌ Failed to fetch feed:', error);
      throw error;
    }
  }

  async likePost(postId: string, userId: string): Promise<void> {
    console.log(`🔄 Liking post: ${postId}`);
    
    try {
      await this.makeRequest(`/posts/${postId}/like`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      
      console.log(`✅ Post liked: ${postId}`);
    } catch (error) {
      console.error('❌ Failed to like post:', error);
      throw error;
    }
  }

  async commentOnPost(postId: string, content: string, authorId: string): Promise<Comment> {
    console.log(`🔄 Commenting on post: ${postId}`);
    
    try {
      const comment = await this.makeRequest<Comment>(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content, authorId }),
      });
      
      console.log(`✅ Comment added to post: ${postId}`);
      return comment;
    } catch (error) {
      console.error('❌ Failed to add comment:', error);
      throw error;
    }
  }

  // Activity Tracking
  async trackActivity(activity: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> {
    console.log(`🔄 Tracking activity: ${activity.type}`);
    
    try {
      const trackedActivity = await this.makeRequest<Activity>('/activities', {
        method: 'POST',
        body: JSON.stringify(activity),
      });
      
      console.log(`✅ Activity tracked: ${activity.type}`);
      return trackedActivity;
    } catch (error) {
      console.error('❌ Failed to track activity:', error);
      throw error;
    }
  }

  async getUserActivity(userId: string, limit: number = 50): Promise<Activity[]> {
    console.log(`🔄 Fetching user activity: ${userId}`);
    
    try {
      const activities = await this.makeRequest<Activity[]>(`/users/${userId}/activities?limit=${limit}`);
      console.log(`✅ Fetched ${activities.length} activities`);
      return activities;
    } catch (error) {
      console.error('❌ Failed to fetch user activity:', error);
      throw error;
    }
  }

  // Badge System
  async checkBadgeEligibility(userId: string): Promise<Badge[]> {
    console.log(`🔄 Checking badge eligibility for user: ${userId}`);
    
    try {
      const badges = await this.makeRequest<Badge[]>(`/users/${userId}/badges/check`);
      console.log(`✅ Found ${badges.length} new badge(s) eligible`);
      return badges;
    } catch (error) {
      console.error('❌ Failed to check badge eligibility:', error);
      throw error;
    }
  }

  async awardBadge(userId: string, badgeId: string): Promise<Badge> {
    console.log(`🔄 Awarding badge ${badgeId} to user: ${userId}`);
    
    try {
      const badge = await this.makeRequest<Badge>(`/users/${userId}/badges`, {
        method: 'POST',
        body: JSON.stringify({ badgeId }),
      });
      
      console.log(`✅ Badge awarded: ${badge.name}`);
      return badge;
    } catch (error) {
      console.error('❌ Failed to award badge:', error);
      throw error;
    }
  }

  // Stream Scheduling
  async createStreamSchedule(scheduleData: Omit<StreamSchedule, 'id'>): Promise<StreamSchedule> {
    console.log('🔄 Creating stream schedule');
    
    try {
      const schedule = await this.makeRequest<StreamSchedule>('/schedules', {
        method: 'POST',
        body: JSON.stringify(scheduleData),
      });
      
      console.log(`✅ Stream schedule created: ${schedule.title}`);
      return schedule;
    } catch (error) {
      console.error('❌ Failed to create stream schedule:', error);
      throw error;
    }
  }

  async getStreamerSchedule(streamerId: string): Promise<StreamSchedule[]> {
    console.log(`🔄 Fetching schedule for streamer: ${streamerId}`);
    
    try {
      const schedules = await this.makeRequest<StreamSchedule[]>(`/streamers/${streamerId}/schedule`);
      console.log(`✅ Fetched ${schedules.length} scheduled streams`);
      return schedules;
    } catch (error) {
      console.error('❌ Failed to fetch streamer schedule:', error);
      throw error;
    }
  }

  async shareStream(stream: UnifiedStream, platform: string, message?: string): Promise<void> {
    console.log(`🔄 Sharing stream to ${platform}`);
    
    try {
      await this.makeRequest('/streams/share', {
        method: 'POST',
        body: JSON.stringify({
          streamId: stream.id,
          platform,
          message,
          streamData: {
            title: stream.title,
            streamer: stream.streamerDisplayName,
            platform: stream.platform,
            thumbnailUrl: stream.thumbnailUrl,
            embedUrl: stream.embedUrl,
            viewerCount: stream.viewerCount,
            category: stream.category,
          },
        }),
      });
      
      console.log(`✅ Stream shared to ${platform}`);
    } catch (error) {
      console.error('❌ Failed to share stream:', error);
      throw error;
    }
  }

  // Generate share URLs and content
  generateShareUrl(stream: UnifiedStream): string {
    const baseUrl = 'https://streammulti.com';
    const encodedTitle = encodeURIComponent(stream.title);
    const encodedStreamer = encodeURIComponent(stream.streamerDisplayName);
    
    return `${baseUrl}/stream/${stream.platform}/${stream.streamerName}?title=${encodedTitle}&streamer=${encodedStreamer}`;
  }

  generateShareContent(stream: UnifiedStream, platform: string): string {
    const shareUrl = this.generateShareUrl(stream);
    const streamPlatform = stream.platform.charAt(0).toUpperCase() + stream.platform.slice(1);
    
    switch (platform) {
      case 'twitter':
        return `Check out ${stream.streamerDisplayName} live on ${streamPlatform}! 🎮\n\n"${stream.title}"\n\n${shareUrl}\n\n#${stream.platform} #livestream #gaming`;
      
      case 'discord':
        return `🎮 **${stream.streamerDisplayName}** is live on ${streamPlatform}!\n\n**${stream.title}**\n\n👥 ${stream.viewerCount.toLocaleString()} viewers\n🎯 ${stream.category}\n\n${shareUrl}`;
      
      case 'reddit':
        return `${stream.streamerDisplayName} is live on ${streamPlatform} - ${stream.title}\n\n${shareUrl}`;
      
      case 'telegram':
        return `🎮 **${stream.streamerDisplayName}** is live!\n\n${stream.title}\n\n📺 ${streamPlatform} • 👥 ${stream.viewerCount.toLocaleString()} viewers\n🎯 ${stream.category}\n\n${shareUrl}`;
      
      default:
        return `Check out ${stream.streamerDisplayName} live on ${streamPlatform}: ${stream.title}\n\n${shareUrl}`;
    }
  }
}

export const socialService = new SocialService();

// Helper functions for easier importing
export const followStreamer = async (userId: string, streamerId: string, platform: string) => {
  return socialService.followStreamer(userId, streamerId, platform);
};

export const createClip = async (clipData: Omit<StreamClip, 'id' | 'createdAt' | 'viewCount' | 'likeCount' | 'shareCount'>) => {
  return socialService.createClip(clipData);
};

export const shareStream = async (stream: UnifiedStream, platform: string, message?: string) => {
  return socialService.shareStream(stream, platform, message);
};

export const getUserProfile = async (userId: string) => {
  return socialService.getUserProfile(userId);
};

export const createPost = async (postData: Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'comments' | 'shares' | 'isLiked' | 'isBookmarked'>) => {
  return socialService.createPost(postData);
};