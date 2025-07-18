import { BlurView } from '@react-native-community/blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MessageCircle,
  Users,
  Heart,
  ThumbsUp,
  Smile,
  Settings,
  BarChart3,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Send,
  Plus,
  X,
  Eye,
  Clock,
  Zap,
  Star,
  Award,
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { MotiView, MotiText, AnimatePresence } from 'moti';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

// Import services
import { livePollsService, initializePolls, Poll, QASession } from '@/services/livePollsService';
import {
  realtimeChatService,
  initializeChat,
  ChatMessage,
  ChatUser,
} from '@/services/realtimeChatService';
import {
  realtimeReactionsService,
  initializeReactions,
  ReactionData,
} from '@/services/realtimeReactionsService';
import { streamRoomsService, initializeRooms, StreamRoom } from '@/services/streamRoomsService';
import {
  viewerSyncService,
  initializeViewerSync,
  ViewerSyncState,
} from '@/services/viewerSyncService';
import { webSocketService, connectToRealtime } from '@/services/webSocketService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RealtimeCommunicationHubProps {
  streamId: string;
  userId: string;
  username: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
  position: { x: number; y: number };
  onStreamChange?: (streamId: string) => void;
  onPlaybackControl?: (action: 'play' | 'pause' | 'seek', data?: any) => void;
}

export const RealtimeCommunicationHub: React.FC<RealtimeCommunicationHubProps> = ({
  streamId,
  userId,
  username,
  isVisible,
  onToggleVisibility,
  position,
  onStreamChange,
  onPlaybackControl,
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'chat' | 'viewers' | 'reactions' | 'polls' | 'room'>(
    'chat'
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');
  const [currentRoom, setCurrentRoom] = useState<StreamRoom | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);

  // Reactions state
  const [activeReactions, setActiveReactions] = useState<ReactionData[]>([]);
  const [reactionStats, setReactionStats] = useState<any>(null);

  // Viewer sync state
  const [syncedViewers, setSyncedViewers] = useState<ViewerSyncState[]>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'out_of_sync'>('synced');

  // Polls state
  const [activePolls, setActivePolls] = useState<Poll[]>([]);
  const [activeQASessions, setActiveQASessions] = useState<QASession[]>([]);

  // UI state
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Animation values
  const hubScale = useSharedValue(isVisible ? 1 : 0);
  const hubOpacity = useSharedValue(isVisible ? 1 : 0);
  const hubHeight = useSharedValue(isMinimized ? 80 : 500);

  // Refs
  const chatListRef = useRef<FlatList>(null);
  const reactionTimeout = useRef<NodeJS.Timeout>();

  // Initialize services
  useEffect(() => {
    if (isVisible && !isInitialized) {
      initializeServices();
    }
  }, [isVisible, isInitialized]);

  const initializeServices = async () => {
    try {
      setConnectionStatus('connecting');

      // Connect to WebSocket
      await connectToRealtime(userId, `stream_${streamId}`);

      // Initialize all services
      await Promise.all([
        initializeChat({
          id: userId,
          username,
          displayName: username,
          role: 'member',
          permissions: [],
          joinedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          isOnline: true,
          isMuted: false,
          isBanned: false,
          statistics: {
            totalTimeInRoom: 0,
            messagesPosted: 0,
            reactionsGiven: 0,
            pollsCreated: 0,
            pollsParticipated: 0,
            streamsWatched: 1,
            averageViewTime: 0,
            reputation: 100,
            level: 1,
            badges: [],
          },
          status: 'watching',
          avatar: undefined,
          isVIP: false,
          isModerator: false,
          isSubscriber: false,
        }),
        initializeViewerSync(userId, username),
        initializeReactions(userId, `stream_${streamId}`, streamId),
        initializeRooms(userId, username),
        initializePolls(userId, username, `stream_${streamId}`),
      ]);

      // Set up event listeners
      setupEventListeners();

      setIsInitialized(true);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Failed to initialize realtime services:', error);
      setConnectionStatus('disconnected');
      Alert.alert('Connection Error', 'Failed to connect to realtime services');
    }
  };

  const setupEventListeners = () => {
    // Chat events
    realtimeChatService.on('message_received', (message: ChatMessage) => {
      setChatMessages(prev => [...prev.slice(-99), message]);
      scrollChatToBottom();
    });

    realtimeChatService.on('typing_start', indicator => {
      setTypingUsers(prev => [...prev.filter(u => u !== indicator.username), indicator.username]);
    });

    realtimeChatService.on('typing_stop', indicator => {
      setTypingUsers(prev => prev.filter(u => u !== indicator.username));
    });

    realtimeChatService.on('user_joined', (user: ChatUser) => {
      setChatUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
    });

    realtimeChatService.on('user_left', (user: ChatUser) => {
      setChatUsers(prev => prev.filter(u => u.id !== user.id));
    });

    // Reactions events
    realtimeReactionsService.on('reaction_received', (reaction: ReactionData) => {
      setActiveReactions(prev => [...prev.slice(-49), reaction]);
      if (reactionTimeout.current) {
        clearTimeout(reactionTimeout.current);
      }
      reactionTimeout.current = setTimeout(() => {
        setActiveReactions(prev => prev.filter(r => r.id !== reaction.id));
      }, 5000);
    });

    realtimeReactionsService.on('reaction_stats_updated', stats => {
      setReactionStats(stats);
    });

    // Viewer sync events
    viewerSyncService.on('room_state_updated', roomState => {
      setSyncedViewers(roomState.viewers);
    });

    viewerSyncService.on('sync_applied', syncData => {
      setSyncStatus('synced');
      if (onPlaybackControl) {
        onPlaybackControl('seek', { time: syncData.masterTime });
      }
    });

    viewerSyncService.on('sync_drift_detected', () => {
      setSyncStatus('out_of_sync');
    });

    // Room events
    streamRoomsService.on('room_state_updated', (room: StreamRoom) => {
      setCurrentRoom(room);
    });

    // Polls events
    livePollsService.on('poll_received', (poll: Poll) => {
      setActivePolls(prev => [...prev.filter(p => p.id !== poll.id), poll]);
    });

    livePollsService.on('qa_session_received', (session: QASession) => {
      setActiveQASessions(prev => [...prev.filter(s => s.id !== session.id), session]);
    });

    // Connection events
    webSocketService.on('connection_state_changed', state => {
      setConnectionStatus(state.isConnected ? 'connected' : 'disconnected');
    });
  };

  // Animation effects
  useEffect(() => {
    if (isVisible) {
      hubScale.value = withSpring(1, { damping: 15, stiffness: 200 });
      hubOpacity.value = withTiming(1, { duration: 200 });
    } else {
      hubScale.value = withTiming(0, { duration: 150 });
      hubOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [isVisible]);

  useEffect(() => {
    hubHeight.value = withSpring(isMinimized ? 80 : 500, { damping: 15 });
  }, [isMinimized]);

  // Handler functions
  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      return;
    }

    try {
      await realtimeChatService.sendMessage(newMessage.trim());
      setNewMessage('');
      await realtimeChatService.stopTyping();
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleSendReaction = async (emoji: string) => {
    try {
      const position = {
        x: Math.random() * 300,
        y: Math.random() * 200,
      };

      await realtimeReactionsService.sendReaction('emoji', emoji, position);
      setShowReactionPicker(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to send reaction');
    }
  };

  const handleCreatePoll = async (question: string, options: string[]) => {
    try {
      const pollOptions = options.map(opt => ({
        text: opt,
        description: '',
      }));

      await livePollsService.createPoll('single_choice', question, pollOptions);
      setShowCreatePoll(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to create poll');
    }
  };

  const handleVotePoll = async (pollId: string, optionId: string) => {
    try {
      await livePollsService.votePoll(pollId, optionId);
    } catch (error) {
      Alert.alert('Error', 'Failed to vote on poll');
    }
  };

  const handleSyncRequest = async () => {
    try {
      await viewerSyncService.requestSync();
      setSyncStatus('syncing');
    } catch (error) {
      Alert.alert('Error', 'Failed to request sync');
    }
  };

  const scrollChatToBottom = () => {
    setTimeout(() => {
      chatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={styles.messageContainer}
    >
      <View style={styles.messageHeader}>
        <Text style={[styles.username, { color: '#8B5CF6' }]}>{item.username}</Text>
        <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
      </View>
      <Text style={styles.messageText}>{item.message}</Text>
      {item.reactions && item.reactions.length > 0 && (
        <View style={styles.messageReactions}>
          {item.reactions.slice(0, 3).map((reaction, index) => (
            <View key={index} style={styles.reactionBadge}>
              <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
              <Text style={styles.reactionCount}>1</Text>
            </View>
          ))}
        </View>
      )}
    </MotiView>
  );

  const renderReaction = ({ item }: { item: ReactionData }) => (
    <MotiView
      from={{ opacity: 0, scale: 0, translateY: 50 }}
      animate={{ opacity: 1, scale: 1, translateY: -100 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ type: 'spring', duration: 2000 }}
      style={[
        styles.floatingReaction,
        {
          left: item.position.x,
          top: item.position.y,
        },
      ]}
    >
      <Text style={styles.reactionEmoji}>{item.emoji}</Text>
    </MotiView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <View style={styles.chatContainer}>
            <FlatList
              ref={chatListRef}
              data={chatMessages}
              renderItem={renderMessage}
              keyExtractor={item => item.id}
              style={styles.messagesList}
              showsVerticalScrollIndicator={false}
            />

            {typingUsers.length > 0 && (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={styles.typingIndicator}
              >
                <Text style={styles.typingText}>
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </Text>
              </MotiView>
            )}

            <View style={styles.chatInput}>
              <TextInput
                style={styles.textInput}
                value={newMessage}
                onChangeText={text => {
                  setNewMessage(text);
                  if (text.length > 0) {
                    realtimeChatService.startTyping();
                  } else {
                    realtimeChatService.stopTyping();
                  }
                }}
                placeholder="Type a message..."
                placeholderTextColor="#666"
                multiline
                maxLength={500}
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity
                style={[styles.sendButton, newMessage.trim() && styles.sendButtonActive]}
                onPress={handleSendMessage}
              >
                <Send size={16} color={newMessage.trim() ? '#8B5CF6' : '#666'} />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'viewers':
        return (
          <View style={styles.viewersContainer}>
            <View style={styles.syncStatus}>
              <View style={[styles.syncIndicator, { backgroundColor: getSyncColor() }]} />
              <Text style={styles.syncText}>
                {syncStatus === 'synced'
                  ? 'Synced'
                  : syncStatus === 'syncing'
                    ? 'Syncing...'
                    : 'Out of sync'}
              </Text>
              {syncStatus !== 'synced' && (
                <TouchableOpacity style={styles.syncButton} onPress={handleSyncRequest}>
                  <Text style={styles.syncButtonText}>Sync</Text>
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={syncedViewers}
              renderItem={({ item }) => (
                <View style={styles.viewerItem}>
                  <View style={styles.viewerInfo}>
                    <Text style={styles.viewerName}>{item.username}</Text>
                    <Text style={styles.viewerStatus}>{item.playbackState}</Text>
                  </View>
                  <View style={styles.viewerStats}>
                    <Text style={styles.viewerLatency}>{item.latency}ms</Text>
                    <View
                      style={[
                        styles.connectionQuality,
                        { backgroundColor: getConnectionColor(item.connectionQuality) },
                      ]}
                    />
                  </View>
                </View>
              )}
              keyExtractor={item => item.userId}
              showsVerticalScrollIndicator={false}
            />
          </View>
        );

      case 'reactions':
        return (
          <View style={styles.reactionsContainer}>
            <View style={styles.reactionControls}>
              <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => setShowReactionPicker(true)}
              >
                <Smile size={20} color="#8B5CF6" />
                <Text style={styles.reactionButtonText}>React</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => handleSendReaction('❤️')}
              >
                <Heart size={20} color="#FF6B6B" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => handleSendReaction('👍')}
              >
                <ThumbsUp size={20} color="#10B981" />
              </TouchableOpacity>
            </View>

            {reactionStats && (
              <View style={styles.reactionStats}>
                <Text style={styles.statsTitle}>Live Reactions</Text>
                <Text style={styles.statsText}>Total: {reactionStats.totalReactions}</Text>
                <Text style={styles.statsText}>Active: {activeReactions.length}</Text>
              </View>
            )}
          </View>
        );

      case 'polls':
        return (
          <View style={styles.pollsContainer}>
            <View style={styles.pollsHeader}>
              <TouchableOpacity
                style={styles.createPollButton}
                onPress={() => setShowCreatePoll(true)}
              >
                <Plus size={16} color="#8B5CF6" />
                <Text style={styles.createPollText}>Create Poll</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={activePolls}
              renderItem={({ item }) => (
                <View style={styles.pollItem}>
                  <Text style={styles.pollQuestion}>{item.question}</Text>
                  {item.options.map(option => (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.pollOption}
                      onPress={() => handleVotePoll(item.id, option.id)}
                    >
                      <Text style={styles.pollOptionText}>{option.text}</Text>
                      <View style={styles.pollVotes}>
                        <Text style={styles.pollVoteCount}>{option.votes}</Text>
                        <Text style={styles.pollPercentage}>{option.percentage.toFixed(1)}%</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
            />
          </View>
        );

      case 'room':
        return (
          <View style={styles.roomContainer}>
            {currentRoom ? (
              <View>
                <Text style={styles.roomName}>{currentRoom.name}</Text>
                <Text style={styles.roomMembers}>{currentRoom.currentMemberCount} members</Text>
                <TouchableOpacity
                  style={styles.roomSettingsButton}
                  onPress={() => setShowRoomSettings(true)}
                >
                  <Settings size={16} color="#8B5CF6" />
                  <Text style={styles.roomSettingsText}>Settings</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.noRoomText}>No active room</Text>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  const getSyncColor = () => {
    switch (syncStatus) {
      case 'synced':
        return '#10B981';
      case 'syncing':
        return '#F59E0B';
      case 'out_of_sync':
        return '#EF4444';
      default:
        return '#666';
    }
  };

  const getConnectionColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return '#10B981';
      case 'good':
        return '#10B981';
      case 'fair':
        return '#F59E0B';
      case 'poor':
        return '#EF4444';
      default:
        return '#666';
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hubScale.value }],
    opacity: hubOpacity.value,
    height: hubHeight.value,
  }));

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <Animated.View
        style={[
          styles.hubContainer,
          {
            left: position.x,
            top: position.y,
          },
          animatedStyle,
        ]}
      >
        <BlurView style={styles.hubBlur} blurType="dark" blurAmount={20}>
          <LinearGradient
            colors={['rgba(26, 26, 26, 0.95)', 'rgba(15, 15, 15, 0.9)']}
            style={styles.hubGradient}
          >
            {/* Header */}
            <View style={styles.hubHeader}>
              <View style={styles.headerLeft}>
                <View
                  style={[
                    styles.connectionIndicator,
                    { backgroundColor: connectionStatus === 'connected' ? '#10B981' : '#EF4444' },
                  ]}
                />
                <Text style={styles.hubTitle}>Live Hub</Text>
              </View>

              <View style={styles.headerControls}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => setIsMinimized(!isMinimized)}
                >
                  <Text style={styles.headerButtonText}>{isMinimized ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.headerButton} onPress={onToggleVisibility}>
                  <X size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {!isMinimized && (
              <>
                {/* Tab Bar */}
                <View style={styles.tabBar}>
                  {[
                    { key: 'chat', icon: MessageCircle, label: 'Chat' },
                    { key: 'viewers', icon: Users, label: 'Viewers' },
                    { key: 'reactions', icon: Heart, label: 'Reactions' },
                    { key: 'polls', icon: BarChart3, label: 'Polls' },
                    { key: 'room', icon: Video, label: 'Room' },
                  ].map(tab => (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                      onPress={() => setActiveTab(tab.key as any)}
                    >
                      <tab.icon size={16} color={activeTab === tab.key ? '#8B5CF6' : '#666'} />
                      <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Tab Content */}
                <View style={styles.tabContent}>{renderTabContent()}</View>
              </>
            )}
          </LinearGradient>
        </BlurView>
      </Animated.View>

      {/* Floating Reactions */}
      <View style={styles.reactionsOverlay} pointerEvents="none">
        <AnimatePresence>
          {activeReactions.map(reaction => (
            <MotiView
              key={reaction.id}
              from={{ opacity: 0, scale: 0, translateY: 0 }}
              animate={{ opacity: 1, scale: 1, translateY: -100 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', duration: 3000 }}
              style={[
                styles.floatingReaction,
                {
                  left: reaction.position.x,
                  top: reaction.position.y,
                },
              ]}
            >
              <Text style={styles.floatingReactionEmoji}>{reaction.emoji}</Text>
            </MotiView>
          ))}
        </AnimatePresence>
      </View>

      {/* Reaction Picker Modal */}
      <Modal
        visible={showReactionPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReactionPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView style={styles.modalBlur} blurType="dark" blurAmount={10}>
            <View style={styles.reactionPicker}>
              <Text style={styles.pickerTitle}>Choose Reaction</Text>
              <View style={styles.emojiGrid}>
                {['❤️', '👍', '👏', '😂', '😍', '🔥', '💯', '⭐'].map(emoji => (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.emojiButton}
                    onPress={() => handleSendReaction(emoji)}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowReactionPicker(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  hubContainer: {
    position: 'absolute',
    width: 350,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 1000,
  },
  hubBlur: {
    borderRadius: 16,
  },
  hubGradient: {
    flex: 1,
    borderRadius: 16,
  },
  hubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  connectionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  hubTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerControls: {
    flexDirection: 'row',
    gap: 4,
  },
  headerButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 28,
    alignItems: 'center',
  },
  headerButtonText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    padding: 8,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeTab: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  tabText: {
    color: '#666',
    fontSize: 10,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#8B5CF6',
  },
  tabContent: {
    flex: 1,
    padding: 12,
  },
  // Chat styles
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    maxHeight: 300,
  },
  messageContainer: {
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    color: '#666',
    fontSize: 10,
  },
  messageText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
  },
  messageReactions: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    color: '#8B5CF6',
    fontSize: 10,
    fontWeight: '600',
  },
  typingIndicator: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    marginBottom: 8,
  },
  typingText: {
    color: '#666',
    fontSize: 10,
    fontStyle: 'italic',
  },
  chatInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 80,
    textAlignVertical: 'top',
  },
  sendButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  // Viewers styles
  viewersContainer: {
    flex: 1,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 12,
  },
  syncIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncText: {
    color: '#fff',
    fontSize: 12,
    flex: 1,
  },
  syncButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  syncButtonText: {
    color: '#8B5CF6',
    fontSize: 10,
    fontWeight: '600',
  },
  viewerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  viewerInfo: {
    flex: 1,
  },
  viewerName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  viewerStatus: {
    color: '#666',
    fontSize: 10,
  },
  viewerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewerLatency: {
    color: '#666',
    fontSize: 10,
  },
  connectionQuality: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Reactions styles
  reactionsContainer: {
    flex: 1,
  },
  reactionControls: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reactionButtonText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '500',
  },
  reactionStats: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  statsTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  statsText: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  // Polls styles
  pollsContainer: {
    flex: 1,
  },
  pollsHeader: {
    marginBottom: 16,
  },
  createPollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  createPollText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '500',
  },
  pollItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  pollQuestion: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pollOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    padding: 8,
    marginBottom: 4,
  },
  pollOptionText: {
    color: '#fff',
    fontSize: 12,
    flex: 1,
  },
  pollVotes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pollVoteCount: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '600',
  },
  pollPercentage: {
    color: '#666',
    fontSize: 10,
  },
  // Room styles
  roomContainer: {
    flex: 1,
  },
  roomName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  roomMembers: {
    color: '#666',
    fontSize: 12,
    marginBottom: 16,
  },
  roomSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roomSettingsText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '500',
  },
  noRoomText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  // Floating reactions
  reactionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  floatingReaction: {
    position: 'absolute',
    zIndex: 1000,
  },
  floatingReactionEmoji: {
    fontSize: 24,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBlur: {
    borderRadius: 16,
  },
  reactionPicker: {
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderRadius: 16,
    padding: 20,
    width: 280,
  },
  pickerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 16,
  },
  emojiButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  emojiText: {
    fontSize: 24,
  },
  modalCloseButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
});
