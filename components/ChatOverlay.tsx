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
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [viewerCount, setViewerCount] = useState(1247);
  const [isTyping, setIsTyping] = useState(false);
  
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

  // Simulate new messages
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        username: `User${Math.floor(Math.random() * 1000)}`,
        message: [
          'Nice stream!',
          'PogChamp',
          'Amazing play!',
          'KEKW',
          '5Head move',
          'EZ Clap',
          'Heart eyes emoji',
        ][Math.floor(Math.random() * 7)],
        timestamp: new Date(),
        type: 'normal',
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
      };
      
      setMessages(prev => [...prev.slice(-49), newMsg]);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        chatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 3000 + Math.random() * 4000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      username: 'You',
      message: newMessage,
      timestamp: new Date(),
      type: 'normal',
      color: '#8B5CF6',
    };
    
    setMessages(prev => [...prev.slice(-49), message]);
    setNewMessage('');
    setIsTyping(false);
    
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
});