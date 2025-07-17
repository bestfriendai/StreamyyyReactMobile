import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TwitchStream } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';

interface StreamDebugInfoProps {
  stream: TwitchStream;
}

export const StreamDebugInfo: React.FC<StreamDebugInfoProps> = ({ stream }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stream Debug Info</Text>
      <Text style={styles.info}>ID: {stream.id}</Text>
      <Text style={styles.info}>User Login: {stream.user_login}</Text>
      <Text style={styles.info}>User Name: {stream.user_name}</Text>
      <Text style={styles.info}>Game: {stream.game_name}</Text>
      <Text style={styles.info}>Viewers: {stream.viewer_count}</Text>
      <Text style={styles.info}>Type: {stream.type}</Text>
      <Text style={styles.url}>
        URL: https://player.twitch.tv/?channel={stream.user_login}
        &parent=localhost&autoplay=true&muted=true&controls=false
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    margin: 5,
    borderRadius: 8,
  },
  title: {
    color: ModernTheme.colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  info: {
    color: ModernTheme.colors.text.secondary,
    fontSize: 12,
    marginBottom: 3,
  },
  url: {
    color: ModernTheme.colors.primary[400],
    fontSize: 10,
    marginTop: 5,
  },
});

export default StreamDebugInfo;
