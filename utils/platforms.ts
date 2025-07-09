import { PlatformConfig } from '@/types/stream';

export const PLATFORMS: Record<string, PlatformConfig> = {
  twitch: {
    name: 'Twitch',
    color: '#9146FF',
    icon: 'twitch',
    baseUrl: 'https://www.twitch.tv',
    embedUrlTemplate: 'https://player.twitch.tv/?channel={username}&parent=localhost&muted=false',
  },
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    icon: 'youtube',
    baseUrl: 'https://www.youtube.com',
    embedUrlTemplate: 'https://www.youtube.com/embed/{videoId}',
  },
  kick: {
    name: 'Kick',
    color: '#53FC18',
    icon: 'zap',
    baseUrl: 'https://kick.com',
    embedUrlTemplate: 'https://player.kick.com/{username}',
  },
};

export const generateEmbedUrl = (platform: string, username: string): string => {
  const config = PLATFORMS[platform];
  if (!config) return '';
  
  return config.embedUrlTemplate.replace('{username}', username).replace('{videoId}', username);
};

export const getPlatformColor = (platform: string): string => {
  return PLATFORMS[platform]?.color || '#8B5CF6';
};