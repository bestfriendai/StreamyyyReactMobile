import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MotiView, MotiText } from 'moti';
import { BlurView } from '@react-native-community/blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MessageCircle,
  Send,
  X,
  Users,
  Crown,
  Heart,
  Smile,
  Settings,
  Minimize2,
  Maximize2,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'normal' | 'subscription' | 'donation' | 'system';
  badges?: string[];
  color?: string;
}

interface ChatOverlayProps {
  streamId: string;
  streamName: string;
  isVisible: boolean;
  isMinimized: boolean;
  onToggleVisibility: () => void;
  onToggleMinimize: () => void;
  position: { x: number; y: number };
  enableRealTimeChat?: boolean;
  onChatMessage?: (message: ChatMessage) => void;
}

const mockMessages: ChatMessage[] = [
  {
    id: '1',
    username: 'StreamFan123',
    message: 'Amazing gameplay! 🔥',
    timestamp: new Date(),
    type: 'normal',
    color: '#FF6B6B',
  },
  {
    id: '2',
    username: 'ProGamer',
    message: 'Just subscribed for 6 months! PogChamp',
    timestamp: new Date(),
    type: 'subscription',
    badges: ['subscriber'],
    color: '#4ECDC4',
  },
  {
    id: '3',
    username: 'ChatMod',
    message: 'Welcome to the stream everyone!',
    timestamp: new Date(),
    type: 'normal',
    badges: ['moderator'],
    color: '#45B7D1',
  },
];

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  streamId,
  streamName,
  isVisible,
  isMinimized,
  onToggleVisibility,
  onToggleMinimize,
  position,
  enableRealTimeChat = false,
  onChatMessage,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [viewerCount, setViewerCount] = useState(1247);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [chatModerators, setChatModerators] = useState<string[]>(['ChatMod']);
  const [bannedWords, setBannedWords] = useState<string[]>(['spam', 'hate']);
  const [slowMode, setSlowMode] = useState(false);
  const [slowModeDelay, setSlowModeDelay] = useState(0);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  
  const chatListRef = useRef<FlatList>(null);
  const scale = useSharedValue(isVisible ? 1 : 0);
  const opacity = useSharedValue(isVisible ? 1 : 0);
  const chatHeight = useSharedValue(isMinimized ? 60 : 400);

  useEffect(() => {
    if (isVisible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [isVisible]);

  useEffect(() => {
    chatHeight.value = withSpring(isMinimized ? 60 : 400, { damping: 15 });
  }, [isMinimized]);

  // Real-time chat connection simulation
  useEffect(() => {
    if (!isVisible || !enableRealTimeChat) return;
    
    // Simulate connection
    setConnectionStatus('connecting');
    const connectTimeout = setTimeout(() => {
      setConnectionStatus('connected');
      setIsConnected(true);
    }, 1000);
    
    // Simulate new messages with more realistic patterns
    const messageInterval = setInterval(() => {
      const messageTemplates = [
        'Nice stream!',
        'PogChamp',
        'Amazing play!',
        'KEKW',
        '5Head move',
        'EZ Clap',
        'LUL',
        'Kreygasm',
        'MonkaS',
        'That was insane!',
        'GG',
        'What game is this?',
        'First time here!',
        'Followed!',
        'Sub hype!',
      ];
      
      const randomTemplate = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
      const username = `User${Math.floor(Math.random() * 1000)}`;
      
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        username,
        message: randomTemplate,
        timestamp: new Date(),
        type: Math.random() < 0.05 ? 'subscription' : 'normal',
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
        badges: Math.random() < 0.1 ? ['subscriber'] : undefined,
      };
      
      setMessages(prev => [...prev.slice(-49), newMsg]);
      
      // Simulate typing indicator
      if (Math.random() < 0.3) {
        const typingUser = `User${Math.floor(Math.random() * 100)}`;
        setTypingUsers(prev => [...prev, typingUser]);
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u !== typingUser));
        }, 2000);
      }
      
      // Auto-scroll to bottom
      setTimeout(() => {
        chatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 2000 + Math.random() * 4000);

    // Simulate viewer count changes
    const viewerInterval = setInterval(() => {
      setViewerCount(prev => {
        const change = Math.floor(Math.random() * 20) - 10; // ±10
        return Math.max(1000, prev + change);
      });
    }, 10000);

    return () => {
      clearTimeout(connectTimeout);
      clearInterval(messageInterval);
      clearInterval(viewerInterval);
      setConnectionStatus('disconnected');
      setIsConnected(false);
    };
  }, [isVisible, enableRealTimeChat]);

  // Enhanced message validation and moderation
  const validateMessage = (messageText: string): { isValid: boolean; reason?: string } => {
    const trimmedMessage = messageText.trim();
    
    if (!trimmedMessage) {
      return { isValid: false, reason: 'Message cannot be empty' };
    }
    
    if (trimmedMessage.length > 500) {
      return { isValid: false, reason: 'Message too long (max 500 characters)' };
    }
    
    // Check for banned words
    const lowerMessage = trimmedMessage.toLowerCase();
    const containsBannedWord = bannedWords.some(word => lowerMessage.includes(word.toLowerCase()));
    if (containsBannedWord) {
      return { isValid: false, reason: 'Message contains inappropriate content' };
    }
    
    // Check slow mode
    if (slowMode) {
      const now = Date.now();
      if (now - lastMessageTime < slowModeDelay * 1000) {
        const remaining = Math.ceil((slowModeDelay * 1000 - (now - lastMessageTime)) / 1000);
        return { isValid: false, reason: `Slow mode: wait ${remaining}s` };
      }
    }
    
    return { isValid: true };
  };

  const handleSendMessage = () => {
    const validation = validateMessage(newMessage);
    
    if (!validation.isValid) {
      Alert.alert('Cannot Send Message', validation.reason);
      return;
    }
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      username: 'You',
      message: newMessage.trim(),
      timestamp: new Date(),
      type: 'normal',
      color: '#8B5CF6',
    };
    
    setMessages(prev => [...prev.slice(-49), message]);
    setNewMessage('');
    setIsTyping(false);
    setLastMessageTime(Date.now());
    
    // Notify parent component
    onChatMessage?.(message);
    
    setTimeout(() => {
      chatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isSubscription = item.type === 'subscription';
    const isSystem = item.type === 'system';
    
    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={[
          styles.messageContainer,
          isSubscription && styles.subscriptionMessage,
          isSystem && styles.systemMessage,
        ]}
      >
        {isSubscription && (
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.2)', 'transparent']}
            style={styles.subscriptionGradient}
          />
        )}
        
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <View style={styles.userInfo}>
              {item.badges?.includes('moderator') && (
                <Crown size={12} color="#FFD700" />
              )}
              {item.badges?.includes('subscriber') && (
                <Heart size={12} color="#FF6B6B" />
              )}
              <Text
                style={[
                  styles.username,
                  { color: item.color || '#999' }
                ]}
              >
                {item.username}
              </Text>
            </View>
            <Text style={styles.timestamp}>
              {item.timestamp.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
          
          <Text style={styles.messageText}>{item.message}</Text>
        </View>
      </MotiView>
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    height: chatHeight.value,
  }));

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.chatContainer,
        {
          left: position.x,
          top: position.y,
        },
        animatedStyle,
      ]}
    >
      <BlurView style={styles.chatBlur} blurType="dark" blurAmount={20}>
        <LinearGradient
          colors={['rgba(26, 26, 26, 0.95)', 'rgba(15, 15, 15, 0.9)']}
          style={styles.chatGradient}
        >
          {/* Header */}
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={styles.chatHeader}
          >
            <View style={styles.headerLeft}>
              <MessageCircle size={18} color="#8B5CF6" />
              <Text style={styles.chatTitle}>Chat</Text>
              
              {/* Connection Status */}
              <View style={[
                styles.connectionStatus,
                { backgroundColor: connectionStatus === 'connected' ? '#10B981' : 
                  connectionStatus === 'connecting' ? '#F59E0B' : '#EF4444' }
              ]} />
              
              <View style={styles.viewerBadge}>
                <Users size={12} color="#10B981" />
                <Text style={styles.viewerCount}>
                  {viewerCount.toLocaleString()}
                </Text>
              </View>
            </View>
            
            <View style={styles.headerControls}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={onToggleMinimize}
              >
                {isMinimized ? (
                  <Maximize2 size={16} color="#666" />
                ) : (
                  <Minimize2 size={16} color="#666" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={onToggleVisibility}
              >
                <X size={16} color="#666" />
              </TouchableOpacity>
            </View>
          </MotiView>

          {!isMinimized && (
            <>
              {/* Messages */}
              <View style={styles.messagesContainer}>
                <FlatList
                  ref={chatListRef}
                  data={messages}
                  renderItem={renderMessage}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  style={styles.messagesList}
                  contentContainerStyle={styles.messagesContent}
                  onContentSizeChange={() => {
                    chatListRef.current?.scrollToEnd({ animated: true });
                  }}
                />
                
                {/* Typing Indicators */}
                {typingUsers.length > 0 && (
                  <MotiView
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    exit={{ opacity: 0, translateY: 10 }}
                    style={styles.typingIndicators}
                  >
                    <View style={styles.typingDots}>
                      <MotiView
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1000 }}
                        style={styles.typingDot}
                      />
                      <MotiView
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1000, delay: 200 }}
                        style={styles.typingDot}
                      />
                      <MotiView
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1000, delay: 400 }}
                        style={styles.typingDot}
                      />
                    </View>
                    <Text style={styles.typingText}>
                      {typingUsers.slice(0, 3).join(', ')} 
                      {typingUsers.length > 3 && ` +${typingUsers.length - 3} more`} 
                      {typingUsers.length === 1 ? ' is' : ' are'} typing...
                    </Text>
                  </MotiView>
                )}
              </View>

              {/* Input */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 300 }}
                style={styles.inputContainer}
              >
                <BlurView style={styles.inputBlur} blurType="light" blurAmount={5}>
                  <View style={styles.inputRow}>
                    <TouchableOpacity style={styles.emojiButton}>
                      <Smile size={18} color="#666" />
                    </TouchableOpacity>
                    
                    <TextInput
                      style={styles.textInput}
                      value={newMessage}
                      onChangeText={(text) => {
                        setNewMessage(text);
                        setIsTyping(text.length > 0);
                      }}
                      placeholder="Type a message..."
                      placeholderTextColor="#666"
                      multiline
                      maxLength={500}
                      onSubmitEditing={handleSendMessage}
                      blurOnSubmit={false}
                    />
                    
                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        newMessage.trim() && styles.sendButtonActive
                      ]}
                      onPress={handleSendMessage}
                      disabled={!newMessage.trim()}
                    >
                      <Send size={16} color={newMessage.trim() ? '#8B5CF6' : '#666'} />
                    </TouchableOpacity>
                  </View>
                  
                  {isTyping && (
                    <MotiView
                      from={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 20 }}
                      style={styles.typingIndicator}
                    >
                      <Text style={styles.typingText}>
                        {newMessage.length}/500
                      </Text>
                    </MotiView>
                  )}
                </BlurView>
              </MotiView>
            </>
          )}
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chatContainer: {
    position: 'absolute',
    width: 280,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 1000,
  },
  chatBlur: {
    borderRadius: 16,
  },
  chatGradient: {
    flex: 1,
    borderRadius: 16,
  },
  chatHeader: {
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
  chatTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  connectionStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  viewerCount: {
    color: '#10B981',
    fontSize: 11,
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
  },
  messagesContainer: {
    flex: 1,
    maxHeight: 280,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 8,
    paddingBottom: 16,
  },
  messageContainer: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  subscriptionMessage: {
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
  },
  systemMessage: {
    opacity: 0.8,
  },
  subscriptionGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  messageContent: {
    padding: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
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
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputBlur: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    gap: 8,
  },
  emojiButton: {
    padding: 4,
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    maxHeight: 80,
    textAlignVertical: 'top',
  },
  sendButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  typingIndicator: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    alignItems: 'flex-end',
  },
  typingText: {
    color: '#666',
    fontSize: 10,
  },
  typingIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    margin: 8,
    gap: 8,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 3,
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8B5CF6',
  },
});