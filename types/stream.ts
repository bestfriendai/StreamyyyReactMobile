export interface Stream {
  id: string;
  username: string;
  title: string;
  platform: 'twitch' | 'youtube' | 'kick';
  thumbnailUrl: string;
  viewerCount: number;
  isLive: boolean;
  category: string;
  embedUrl: string;
  profileImageUrl: string;
}

export interface StreamLayout {
  id: string;
  type: 'grid' | 'stacked';
  streams: Stream[];
  gridColumns: number;
  createdAt: string;
}

export interface PlatformConfig {
  name: string;
  color: string;
  icon: string;
  baseUrl: string;
  embedUrlTemplate: string;
}