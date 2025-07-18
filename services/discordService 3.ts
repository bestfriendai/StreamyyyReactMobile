import { UnifiedStream } from './platformService';

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  verified?: boolean;
  email?: string;
  flags?: number;
  premium_type?: number;
  public_flags?: number;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  owner?: boolean;
  permissions?: string;
  features: string[];
  member_count?: number;
  presence_count?: number;
}

export interface DiscordChannel {
  id: string;
  type: number;
  guild_id?: string;
  position?: number;
  name?: string;
  topic?: string;
  nsfw?: boolean;
  parent_id?: string;
  bitrate?: number;
  user_limit?: number;
  rate_limit_per_user?: number;
}

export interface DiscordMessage {
  id: string;
  channel_id: string;
  author: DiscordUser;
  content: string;
  timestamp: string;
  edited_timestamp?: string;
  tts: boolean;
  mention_everyone: boolean;
  mentions: DiscordUser[];
  attachments: any[];
  embeds: DiscordEmbed[];
  reactions?: any[];
  nonce?: string;
  pinned: boolean;
  webhook_id?: string;
  type: number;
  activity?: any;
  application?: any;
  message_reference?: any;
  flags?: number;
  stickers?: any[];
  referenced_message?: DiscordMessage;
}

export interface DiscordEmbed {
  title?: string;
  type?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: {
    text: string;
    icon_url?: string;
    proxy_icon_url?: string;
  };
  image?: {
    url: string;
    proxy_url?: string;
    height?: number;
    width?: number;
  };
  thumbnail?: {
    url: string;
    proxy_url?: string;
    height?: number;
    width?: number;
  };
  video?: {
    url: string;
    proxy_url?: string;
    height?: number;
    width?: number;
  };
  provider?: {
    name?: string;
    url?: string;
  };
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
    proxy_icon_url?: string;
  };
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
}

export interface StreamCommunity {
  id: string;
  name: string;
  description: string;
  streamer: string;
  platform: string;
  discordGuildId?: string;
  memberCount: number;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  rules: string[];
  moderators: string[];
  features: {
    liveNotifications: boolean;
    streamSchedule: boolean;
    clipSharing: boolean;
    chatRelay: boolean;
    voiceChannels: boolean;
  };
}

export interface CommunityEvent {
  id: string;
  communityId: string;
  title: string;
  description: string;
  type: 'stream' | 'tournament' | 'collab' | 'community' | 'announcement';
  startTime: string;
  endTime?: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  attendees: string[];
  maxAttendees?: number;
  location?: string;
  streamUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  tags: string[];
  metadata: Record<string, any>;
}

class DiscordService {
  private readonly clientId = process.env.EXPO_PUBLIC_DISCORD_CLIENT_ID;
  private readonly clientSecret = process.env.EXPO_PUBLIC_DISCORD_CLIENT_SECRET;
  private readonly baseUrl = 'https://discord.com/api/v10';
  private readonly webhookUrl = process.env.EXPO_PUBLIC_DISCORD_WEBHOOK_URL;
  private accessToken: string | null = null;

  constructor() {
    if (!this.clientId || !this.clientSecret) {
      console.warn('Discord API credentials not found in environment variables');
      console.warn('Please set EXPO_PUBLIC_DISCORD_CLIENT_ID and EXPO_PUBLIC_DISCORD_CLIENT_SECRET');
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Discord API request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Discord API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async sendStreamNotification(stream: UnifiedStream, webhookUrl?: string): Promise<void> {
    const url = webhookUrl || this.webhookUrl;
    
    if (!url) {
      console.warn('No Discord webhook URL configured');
      return;
    }

    try {
      const embed: DiscordEmbed = {
        title: `${stream.streamerDisplayName} is now live!`,
        description: stream.title,
        url: stream.embedUrl,
        color: this.getPlatformColor(stream.platform),
        thumbnail: {
          url: stream.profileImageUrl,
        },
        image: {
          url: stream.thumbnailUrl,
        },
        fields: [
          {
            name: 'Platform',
            value: stream.platform.charAt(0).toUpperCase() + stream.platform.slice(1),
            inline: true,
          },
          {
            name: 'Category',
            value: stream.category || 'Just Chatting',
            inline: true,
          },
          {
            name: 'Viewers',
            value: stream.viewerCount.toLocaleString(),
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'StreamMulti',
          icon_url: 'https://your-app-icon-url.com/icon.png',
        },
      };

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeds: [embed],
        }),
      });

      console.log(`✅ Discord notification sent for ${stream.streamerDisplayName}`);
    } catch (error) {
      console.error('❌ Failed to send Discord notification:', error);
    }
  }

  async createStreamCommunity(communityData: Omit<StreamCommunity, 'id' | 'createdAt' | 'updatedAt'>): Promise<StreamCommunity> {
    // This would typically integrate with your backend database
    const community: StreamCommunity = {
      id: Date.now().toString(),
      ...communityData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('✅ Stream community created:', community.name);
    return community;
  }

  async createCommunityEvent(eventData: Omit<CommunityEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommunityEvent> {
    const event: CommunityEvent = {
      id: Date.now().toString(),
      ...eventData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('✅ Community event created:', event.title);
    return event;
  }

  async shareStreamToDiscord(stream: UnifiedStream, channelId: string): Promise<void> {
    try {
      const embed: DiscordEmbed = {
        title: `Check out ${stream.streamerDisplayName}'s stream!`,
        description: stream.title,
        url: stream.embedUrl,
        color: this.getPlatformColor(stream.platform),
        thumbnail: {
          url: stream.profileImageUrl,
        },
        image: {
          url: stream.thumbnailUrl,
        },
        fields: [
          {
            name: 'Platform',
            value: stream.platform.charAt(0).toUpperCase() + stream.platform.slice(1),
            inline: true,
          },
          {
            name: 'Category',
            value: stream.category || 'Just Chatting',
            inline: true,
          },
          {
            name: 'Viewers',
            value: stream.viewerCount.toLocaleString(),
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      await this.makeRequest(`/channels/${channelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          embeds: [embed],
        }),
      });

      console.log(`✅ Stream shared to Discord channel ${channelId}`);
    } catch (error) {
      console.error('❌ Failed to share stream to Discord:', error);
    }
  }

  async sendCommunityAnnouncement(
    communityId: string,
    title: string,
    content: string,
    type: 'info' | 'warning' | 'success' | 'error' = 'info'
  ): Promise<void> {
    if (!this.webhookUrl) {
      console.warn('No Discord webhook URL configured for announcements');
      return;
    }

    try {
      const embed: DiscordEmbed = {
        title: title,
        description: content,
        color: this.getAnnouncementColor(type),
        timestamp: new Date().toISOString(),
        footer: {
          text: 'StreamMulti Community',
        },
      };

      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeds: [embed],
        }),
      });

      console.log(`✅ Community announcement sent: ${title}`);
    } catch (error) {
      console.error('❌ Failed to send community announcement:', error);
    }
  }

  async createInviteLink(guildId: string, channelId: string): Promise<string | null> {
    try {
      const response = await this.makeRequest<{ code: string }>(`/channels/${channelId}/invites`, {
        method: 'POST',
        body: JSON.stringify({
          max_age: 86400, // 24 hours
          max_uses: 0, // unlimited
          temporary: false,
          unique: true,
        }),
      });

      const inviteLink = `https://discord.gg/${response.code}`;
      console.log(`✅ Discord invite created: ${inviteLink}`);
      return inviteLink;
    } catch (error) {
      console.error('❌ Failed to create Discord invite:', error);
      return null;
    }
  }

  async scheduleStreamReminder(event: CommunityEvent): Promise<void> {
    if (!this.webhookUrl) {
      console.warn('No Discord webhook URL configured for reminders');
      return;
    }

    try {
      const embed: DiscordEmbed = {
        title: `📅 Stream Reminder: ${event.title}`,
        description: event.description,
        color: 0x7289DA,
        fields: [
          {
            name: 'Starting in',
            value: this.getTimeUntil(event.startTime),
            inline: true,
          },
          {
            name: 'Duration',
            value: event.endTime ? this.getDuration(event.startTime, event.endTime) : 'TBD',
            inline: true,
          },
          {
            name: 'Type',
            value: event.type.charAt(0).toUpperCase() + event.type.slice(1),
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'StreamMulti Scheduler',
        },
      };

      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `@everyone`,
          embeds: [embed],
        }),
      });

      console.log(`✅ Stream reminder sent for: ${event.title}`);
    } catch (error) {
      console.error('❌ Failed to send stream reminder:', error);
    }
  }

  private getPlatformColor(platform: string): number {
    switch (platform) {
      case 'twitch':
        return 0x9146FF;
      case 'youtube':
        return 0xFF0000;
      case 'kick':
        return 0x53FC18;
      default:
        return 0x7289DA;
    }
  }

  private getAnnouncementColor(type: string): number {
    switch (type) {
      case 'success':
        return 0x00FF00;
      case 'warning':
        return 0xFFFF00;
      case 'error':
        return 0xFF0000;
      default:
        return 0x7289DA;
    }
  }

  private getTimeUntil(targetTime: string): string {
    const now = new Date();
    const target = new Date(targetTime);
    const diffMs = target.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Now';
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  }

  private getDuration(startTime: string, endTime: string): string {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  }

  async getGuildChannels(guildId: string): Promise<DiscordChannel[]> {
    try {
      const channels = await this.makeRequest<DiscordChannel[]>(`/guilds/${guildId}/channels`);
      return channels;
    } catch (error) {
      console.error('❌ Failed to get guild channels:', error);
      return [];
    }
  }

  async getCurrentUser(): Promise<DiscordUser | null> {
    try {
      const user = await this.makeRequest<DiscordUser>('/users/@me');
      return user;
    } catch (error) {
      console.error('❌ Failed to get current Discord user:', error);
      return null;
    }
  }

  async getUserGuilds(): Promise<DiscordGuild[]> {
    try {
      const guilds = await this.makeRequest<DiscordGuild[]>('/users/@me/guilds');
      return guilds;
    } catch (error) {
      console.error('❌ Failed to get user guilds:', error);
      return [];
    }
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  clearAccessToken(): void {
    this.accessToken = null;
  }
}

export const discordService = new DiscordService();

// Helper functions for easier importing
export const sendStreamNotification = async (stream: UnifiedStream, webhookUrl?: string) => {
  return discordService.sendStreamNotification(stream, webhookUrl);
};

export const shareStreamToDiscord = async (stream: UnifiedStream, channelId: string) => {
  return discordService.shareStreamToDiscord(stream, channelId);
};

export const createStreamCommunity = async (communityData: Omit<StreamCommunity, 'id' | 'createdAt' | 'updatedAt'>) => {
  return discordService.createStreamCommunity(communityData);
};

export const scheduleStreamReminder = async (event: CommunityEvent) => {
  return discordService.scheduleStreamReminder(event);
};