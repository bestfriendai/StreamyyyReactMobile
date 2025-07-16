import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Volume2,
  VolumeX,
  X,
  Eye,
  ExternalLink,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Monitor,
  Maximize,
  Minimize,
  DollarSign,
  MessageSquare,
  Zap,
} from 'lucide-react-native';
import { UniversalStream } from '@/services/multiPlatformStreamingApi';
import { ModernTheme } from '@/theme/modernTheme';
import { streamQualityManager, QualityLevel } from '@/services/streamQualityManager';
import { streamHealthMonitor } from '@/services/streamHealthMonitor';

interface EnhancedKickPlayerProps {
  stream: UniversalStream;
  width: number;
  height: number;
  isActive?: boolean;
  isMuted?: boolean;
  isPlaying?: boolean;
  quality?: QualityLevel;
  onPress?: () => void;
  onRemove?: () => void;
  onMuteToggle?: () => void;
  onPlayToggle?: () => void;
  onQualityChange?: (quality: QualityLevel) => void;
  onFullscreen?: () => void;
  onPictureInPicture?: () => void;
  showControls?: boolean;
  autoplay?: boolean;
  showChat?: boolean;
}

interface KickPlayerStats {
  loadTime: number;
  bufferHealth: number;
  currentBitrate: number;
  fps: number;
  latency: number;
  connectionType: string;
  streamUptime: number;
  chatActivity: number;
}

export const EnhancedKickPlayer: React.FC<EnhancedKickPlayerProps> = ({
  stream,
  width,
  height,
  isActive = false,
  isMuted = true,
  isPlaying = true,
  quality = 'auto',
  onPress,
  onRemove,
  onMuteToggle,
  onPlayToggle,
  onQualityChange,
  onFullscreen,
  onPictureInPicture,
  showControls = true,
  autoplay = true,
  showChat = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<KickPlayerStats>({
    loadTime: 0,
    bufferHealth: 100,
    currentBitrate: 0,
    fps: 30,
    latency: 0,
    connectionType: 'unknown',
    streamUptime: 0,
    chatActivity: 0,
  });
  const [controlsVisible, setControlsVisible] = useState(true);
  
  const webViewRef = useRef<WebView>(null);
  const loadStartTime = useRef<number>(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize stream quality management
  useEffect(() => {
    streamQualityManager.initializeStream(stream.id, quality, quality === 'auto');
    
    // Create a mock TwitchStream object for health monitoring
    const mockStream = {
      id: stream.id,
      user_id: stream.streamerName,
      user_login: stream.streamerName,
      user_name: stream.streamerDisplayName,
      game_id: '',
      game_name: stream.game,
      type: 'live',
      title: stream.title,
      viewer_count: stream.viewerCount,
      started_at: stream.startTime,
      language: stream.language,
      thumbnail_url: stream.thumbnailUrl,
      tag_ids: stream.tags,
      is_mature: stream.isMature,
    };
    
    streamHealthMonitor.initializeStream(mockStream);
    
    return () => {
      streamQualityManager.removeStream(stream.id);
      streamHealthMonitor.removeStream(stream.id);
    };
  }, [stream.id, quality]);

  // Auto-hide controls
  useEffect(() => {
    if (controlsVisible && showControls) {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
      controlsTimer.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
    
    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, [controlsVisible, showControls]);

  // Generate Kick embed HTML with custom player integration
  const getEmbedHtml = useCallback(() => {
    const channelName = stream.streamerName;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Enhanced Kick Player - ${stream.streamerDisplayName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            width: 100%;
            height: 100%;
            background: #0f0f23;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .player-container {
            width: 100%;
            height: 100%;
            position: relative;
            display: ${showChat ? 'flex' : 'block'};
        }
        
        .video-section {
            flex: ${showChat ? '3' : '1'};
            position: relative;
        }
        
        .chat-section {
            flex: 1;
            display: ${showChat ? 'block' : 'none'};
            border-left: 1px solid #53FC18;
            background: #0f0f23;
        }
        
        iframe, video {
            width: 100%;
            height: 100%;
            border: none;
            background: #000;
        }
        
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #fff;
            text-align: center;
            z-index: 100;
            font-size: 14px;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #333;
            border-top: 3px solid #53FC18;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .error {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ff6b6b;
            text-align: center;
            z-index: 100;
            padding: 20px;
            font-size: 14px;
            background: rgba(15, 15, 35, 0.95);
            border-radius: 8px;
            border: 1px solid #53FC18;
        }
        
        .retry-btn {
            background: #53FC18;
            color: #0f0f23;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            margin-top: 15px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 700;
            transition: background 0.2s;
        }
        
        .retry-btn:hover {
            background: #42d613;
        }
        
        .stream-info {
            position: absolute;
            top: 15px;
            left: 15px;
            background: linear-gradient(135deg, rgba(83, 252, 24, 0.9), rgba(66, 214, 19, 0.9));
            color: #0f0f23;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: bold;
            z-index: 50;
            backdrop-filter: blur(10px);
        }
        
        .viewer-count {
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(15, 15, 35, 0.9);
            color: #53FC18;
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 11px;
            z-index: 50;
            backdrop-filter: blur(10px);
            border: 1px solid #53FC18;
        }
        
        .stats-overlay {
            position: absolute;
            bottom: 15px;
            left: 15px;
            background: rgba(15, 15, 35, 0.95);
            color: #53FC18;
            padding: 10px;
            border-radius: 6px;
            font-size: 10px;
            font-family: monospace;
            z-index: 50;
            backdrop-filter: blur(10px);
            border: 1px solid #53FC18;
            min-width: 140px;
        }
        
        .quality-indicator {
            position: absolute;
            bottom: 15px;
            right: 15px;
            background: rgba(15, 15, 35, 0.9);
            color: #53FC18;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            z-index: 50;
            border: 1px solid #53FC18;
        }
        
        .kick-branding {
            position: absolute;
            top: 50px;
            left: 15px;
            color: #53FC18;
            font-size: 12px;
            font-weight: bold;
            z-index: 45;
            text-shadow: 0 0 10px rgba(83, 252, 24, 0.5);
        }
        
        .chat-container {
            padding: 10px;
            overflow-y: auto;
            height: 100%;
        }
        
        .chat-message {
            background: rgba(83, 252, 24, 0.1);
            border: 1px solid #53FC18;
            border-radius: 4px;
            padding: 6px;
            margin-bottom: 6px;
            color: #fff;
            font-size: 11px;
        }
        
        .chat-username {
            color: #53FC18;
            font-weight: bold;
        }
        
        .live-indicator {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .kick-glow {
            box-shadow: 0 0 20px rgba(83, 252, 24, 0.3);
        }
    </style>
</head>
<body>
    <div class="player-container">
        <div class="video-section">
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <div>Loading ${stream.streamerDisplayName}</div>
                <div style="font-size: 11px; opacity: 0.7; margin-top: 5px;">Kick Live • Quality: ${quality.toUpperCase()}</div>
                <div class="live-indicator" style="font-size: 10px; margin-top: 3px;">⚡ LIVE STREAMING</div>
            </div>
            
            <div class="error" id="error" style="display: none;">
                <div style="font-size: 16px; margin-bottom: 10px;">⚡ Stream Unavailable</div>
                <div>Unable to load ${stream.streamerDisplayName}</div>
                <div style="font-size: 11px; margin: 5px 0; opacity: 0.8;">Kick Live • Retry: ${retryCount + 1}</div>
                <button class="retry-btn" onclick="retryLoad()">Retry Stream</button>
                <button class="retry-btn" onclick="openKick()" style="margin-left: 10px; background: #42d613;">Open Kick</button>
            </div>
            
            <div class="stream-info kick-glow">
                🟢 LIVE • ${stream.game}
            </div>
            
            <div class="viewer-count kick-glow">
                👥 ${stream.viewerCount.toLocaleString()}
            </div>
            
            <div class="kick-branding">
                ⚡ KICK.COM
            </div>
            
            <div class="stats-overlay kick-glow" id="stats" style="display: none;">
                <div style="font-weight: bold; margin-bottom: 5px; color: #fff;">Kick Stats</div>
                <div>Quality: <span id="current-quality">${quality}</span></div>
                <div>FPS: <span id="fps">30</span></div>
                <div>Bitrate: <span id="bitrate">--</span> kbps</div>
                <div>Latency: <span id="latency">--</span> ms</div>
                <div>Uptime: <span id="uptime">--</span></div>
                <div>Chat: <span id="chat-activity">--</span>/min</div>
            </div>
            
            <div class="quality-indicator">
                ${quality.toUpperCase()}
            </div>
            
            <!-- Kick Player Iframe -->
            <iframe 
                id="kick-player"
                src="https://player.kick.com/${channelName}?autoplay=${autoplay ? 'true' : 'false'}&muted=${isMuted ? 'true' : 'false'}"
                allowfullscreen="true"
                scrolling="no"
                frameborder="0"
                allow="autoplay; fullscreen; encrypted-media">
            </iframe>
        </div>
        
        ${showChat ? `
        <div class="chat-section">
            <div class="chat-container" id="chat-container">
                <div style="color: #53FC18; font-weight: bold; margin-bottom: 10px; text-align: center;">
                    ⚡ Kick Chat
                </div>
                <div class="chat-message">
                    <span class="chat-username">KickBot:</span>
                    Welcome to ${stream.streamerDisplayName}'s stream!
                </div>
                <div class="chat-message">
                    <span class="chat-username">Viewer1:</span>
                    This stream is amazing! ⚡
                </div>
                <div class="chat-message">
                    <span class="chat-username">StreamFan:</span>
                    Love the energy on Kick!
                </div>
            </div>
        </div>
        ` : ''}
    </div>
    
    <script>
        let hasLoaded = false;
        let loadStartTime = Date.now();
        let statsInterval;
        let chatInterval;
        let performanceData = {
            loadTime: 0,
            bufferHealth: 100,
            currentBitrate: 2500,
            fps: 30,
            latency: 150,
            connectionType: 'websocket',
            streamUptime: 0,
            chatActivity: 0
        };
        
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const stats = document.getElementById('stats');
        const iframe = document.getElementById('kick-player');
        
        function hideLoading() {
            if (loading) loading.style.display = 'none';
            hasLoaded = true;
            startPerformanceMonitoring();
            
            notifyReactNative({
                type: 'loaded',
                streamId: '${stream.id}',
                streamer: '${stream.streamerDisplayName}',
                loadTime: Date.now() - loadStartTime,
                quality: '${quality}'
            });
        }
        
        function showError(message = 'Stream failed to load') {
            if (loading) loading.style.display = 'none';
            if (error) error.style.display = 'block';
            
            notifyReactNative({
                type: 'error',
                streamId: '${stream.id}',
                message: message
            });
        }
        
        function retryLoad() {
            if (error) error.style.display = 'none';
            if (loading) loading.style.display = 'block';
            hasLoaded = false;
            
            // Reload iframe with cache busting
            const currentSrc = iframe.src;
            const separator = currentSrc.includes('?') ? '&' : '?';
            iframe.src = currentSrc.split('&_retry')[0] + separator + '_retry=' + Date.now();
            
            loadStartTime = Date.now();
            
            notifyReactNative({
                type: 'retry',
                streamId: '${stream.id}'
            });
        }
        
        function openKick() {
            notifyReactNative({
                type: 'open_external',
                url: '${stream.streamUrl}'
            });
        }
        
        function toggleStats() {
            const isVisible = stats.style.display !== 'none';
            stats.style.display = isVisible ? 'none' : 'block';
            
            notifyReactNative({
                type: 'stats_toggle',
                visible: !isVisible
            });
        }
        
        function startPerformanceMonitoring() {
            statsInterval = setInterval(() => {
                updatePerformanceStats();
            }, 2000);
            
            chatInterval = setInterval(() => {
                simulateChatActivity();
            }, 5000);
        }
        
        function updatePerformanceStats() {
            // Simulate Kick-specific performance data
            performanceData.fps = Math.floor(Math.random() * 10) + 25; // 25-35 fps
            performanceData.currentBitrate = Math.floor(Math.random() * 1000) + 2000; // 2000-3000 kbps
            performanceData.latency = Math.floor(Math.random() * 100) + 100; // 100-200 ms (Kick typically has lower latency)
            performanceData.bufferHealth = Math.max(60, Math.floor(Math.random() * 40) + 60); // 60-100%
            performanceData.streamUptime += 2; // seconds
            performanceData.chatActivity = Math.floor(Math.random() * 20) + 5; // 5-25 messages per minute
            
            // Update UI
            if (document.getElementById('fps')) {
                document.getElementById('fps').textContent = performanceData.fps;
                document.getElementById('bitrate').textContent = performanceData.currentBitrate;
                document.getElementById('latency').textContent = performanceData.latency;
                document.getElementById('uptime').textContent = formatUptime(performanceData.streamUptime);
                document.getElementById('chat-activity').textContent = performanceData.chatActivity;
            }
            
            // Send stats to React Native
            notifyReactNative({
                type: 'performance_update',
                streamId: '${stream.id}',
                stats: performanceData
            });
        }
        
        function simulateChatActivity() {
            if (!${showChat}) return;
            
            const chatContainer = document.getElementById('chat-container');
            if (!chatContainer) return;
            
            const messages = [
                { user: 'KickFan123', text: 'Amazing stream! ⚡' },
                { user: 'LiveViewer', text: 'Kick is the future!' },
                { user: 'StreamLover', text: 'This quality is incredible' },
                { user: 'ChatMaster', text: 'Low latency FTW!' },
                { user: 'KickSupporter', text: '${stream.streamerDisplayName} is killing it!' }
            ];
            
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message';
            messageDiv.innerHTML = '<span class="chat-username">' + randomMessage.user + ':</span> ' + randomMessage.text;
            
            chatContainer.appendChild(messageDiv);
            
            // Keep only last 10 messages
            const chatMessages = chatContainer.querySelectorAll('.chat-message');
            if (chatMessages.length > 10) {
                chatMessages[1].remove(); // Keep header
            }
            
            // Auto-scroll to bottom
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        function formatUptime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            
            if (hours > 0) {
                return hours + 'h ' + minutes + 'm';
            } else if (minutes > 0) {
                return minutes + 'm ' + secs + 's';
            } else {
                return secs + 's';
            }
        }
        
        function notifyReactNative(data) {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify(data));
            }
        }
        
        // Initialize load timeout
        setTimeout(() => {
            if (!hasLoaded) {
                console.log('Kick player load timeout');
                showError('Loading timeout - stream may be offline');
            }
        }, 20000);
        
        // Listen for iframe events
        iframe.addEventListener('load', function() {
            console.log('Kick iframe loaded');
            setTimeout(hideLoading, 2000); // Kick loads faster
        });
        
        iframe.addEventListener('error', function() {
            console.log('Kick iframe error');
            showError('Failed to load Kick player');
        });
        
        // Handle clicks
        document.addEventListener('click', function(e) {
            if (e.target.id === 'kick-player' || e.target.closest('#kick-player')) {
                notifyReactNative({
                    type: 'touch',
                    streamId: '${stream.id}',
                    target: 'player'
                });
            }
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            switch(e.key) {
                case 's':
                case 'S':
                    toggleStats();
                    break;
                case 'm':
                case 'M':
                    notifyReactNative({ type: 'mute_toggle' });
                    break;
                case ' ':
                    e.preventDefault();
                    notifyReactNative({ type: 'play_toggle' });
                    break;
            }
        });
        
        // Prevent context menu
        document.addEventListener('contextmenu', e => e.preventDefault());
        
        console.log('Enhanced Kick Player initialized for ${stream.streamerDisplayName}');
    </script>
</body>
</html>`;
  }, [stream, isMuted, isPlaying, autoplay, quality, showChat, retryCount]);

  // WebView event handlers
  const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log(`Enhanced Kick player message:`, data);
      
      switch (data.type) {
        case 'loaded':
          setIsLoading(false);
          setError(null);
          setHasLoaded(true);
          setRetryCount(0);
          streamHealthMonitor.recordSuccess(stream.id, data.loadTime);
          break;
          
        case 'error':
          setIsLoading(false);
          setError(data.message || 'Kick stream unavailable');
          streamHealthMonitor.recordError(stream.id, data.message);
          break;
          
        case 'retry':
          setRetryCount(prev => prev + 1);
          streamHealthMonitor.recordError(stream.id, 'Retry attempt', true);
          break;
          
        case 'performance_update':
          setStats(prev => ({ ...prev, ...data.stats }));
          break;
          
        case 'touch':
          if (data.target === 'player') {
            setControlsVisible(true);
            onPress?.();
          }
          break;
          
        case 'mute_toggle':
          onMuteToggle?.();
          break;
          
        case 'play_toggle':
          onPlayToggle?.();
          break;
          
        case 'stats_toggle':
          setShowStats(data.visible);
          break;
          
        case 'open_external':
          // Handle external link opening
          break;
      }
    } catch (error) {
      console.log('Kick WebView message parse error:', error);
    }
  }, [onPress, onMuteToggle, onPlayToggle, stream.id]);

  // Handle quality change
  const handleQualityChange = useCallback((newQuality: QualityLevel) => {
    streamQualityManager.setStreamQuality(stream.id, newQuality, true);
    onQualityChange?.(newQuality);
    setShowQualityMenu(false);
    webViewRef.current?.reload();
  }, [stream.id, onQualityChange]);

  const embedHtml = getEmbedHtml();
  const qualityOptions: QualityLevel[] = ['auto', 'source', '720p', '480p', '360p'];

  return (
    <View style={[styles.container, { width, height }]}>
      <View style={styles.playerContainer}>
        {/* Kick WebView */}
        <WebView
          ref={webViewRef}
          source={{ html: embedHtml }}
          style={styles.video}
          onMessage={handleWebViewMessage}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scalesPageToFit={false}
          bounces={false}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          originWhitelist={['*']}
          mixedContentMode={'compatibility'}
          allowsFullscreenVideo={true}
          allowsProtectedMedia={true}
          cacheEnabled={true}
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
        />

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#53FC18" />
            <Text style={styles.loadingText}>Loading {stream.streamerDisplayName}...</Text>
            <Text style={styles.loadingSubtext}>Kick Live • Ultra-low latency</Text>
          </View>
        )}

        {/* Error Overlay */}
        {error && (
          <View style={styles.errorOverlay}>
            <Zap size={32} color="#53FC18" />
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorPlatform}>Platform: Kick</Text>
            <View style={styles.errorButtons}>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={() => webViewRef.current?.reload()}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.platformButton, { backgroundColor: '#53FC18' }]} 
                onPress={() => {/* Handle external opening */}}
              >
                <Text style={[styles.platformText, { color: '#0f0f23' }]}>Open Kick</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Enhanced Controls */}
        {showControls && controlsVisible && !error && (
          <View style={styles.controlsOverlay}>
            <LinearGradient
              colors={['transparent', 'rgba(15,15,35,0.9)']}
              style={styles.controlsGradient}
            >
              <View style={styles.controlsContainer}>
                <View style={styles.leftControls}>
                  <TouchableOpacity style={styles.controlButton} onPress={onMuteToggle}>
                    {isMuted ? <VolumeX size={18} color="#fff" /> : <Volume2 size={18} color="#fff" />}
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.controlButton} onPress={onPlayToggle}>
                    {isPlaying ? <Pause size={18} color="#fff" /> : <Play size={18} color="#fff" />}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={() => setShowQualityMenu(!showQualityMenu)}
                  >
                    <Settings size={18} color="#fff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={() => setShowStats(!showStats)}
                  >
                    <Monitor size={18} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.centerControls}>
                  <Text style={styles.streamTitle} numberOfLines={1}>
                    {stream.streamerDisplayName}
                  </Text>
                  <Text style={styles.streamGame} numberOfLines={1}>
                    {stream.game} • Kick Live
                  </Text>
                </View>

                <View style={styles.rightControls}>
                  <TouchableOpacity style={styles.controlButton}>
                    <DollarSign size={18} color="#53FC18" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.controlButton}>
                    <MessageSquare size={18} color="#fff" />
                  </TouchableOpacity>
                  
                  {onPictureInPicture && (
                    <TouchableOpacity style={styles.controlButton} onPress={onPictureInPicture}>
                      <Minimize size={18} color="#fff" />
                    </TouchableOpacity>
                  )}
                  
                  {onFullscreen && (
                    <TouchableOpacity style={styles.controlButton} onPress={onFullscreen}>
                      <Maximize size={18} color="#fff" />
                    </TouchableOpacity>
                  )}
                  
                  {onRemove && (
                    <TouchableOpacity 
                      style={[styles.controlButton, styles.removeButton]} 
                      onPress={onRemove}
                    >
                      <X size={18} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Quality Menu */}
        {showQualityMenu && (
          <View style={styles.qualityMenu}>
            <Text style={styles.qualityTitle}>Video Quality</Text>
            {qualityOptions.map((q) => (
              <TouchableOpacity
                key={q}
                style={[styles.qualityOption, quality === q && styles.qualityOptionActive]}
                onPress={() => handleQualityChange(q)}
              >
                <Text style={[styles.qualityText, quality === q && styles.qualityTextActive]}>
                  {q.toUpperCase()}
                  {q === 'auto' && ' (Ultra-low latency)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Active Indicator */}
        {isActive && (
          <View style={styles.activeIndicator}>
            <LinearGradient
              colors={['#53FC18', '#42d613']}
              style={styles.activeGradient}
            />
          </View>
        )}

        {/* Kick Platform Badge */}
        <View style={styles.platformBadge}>
          <Zap size={12} color="#0f0f23" />
          <Text style={styles.platformBadgeText}>KICK</Text>
        </View>

        {/* Low Latency Indicator */}
        <View style={styles.latencyIndicator}>
          <Text style={styles.latencyText}>⚡ LOW LATENCY</Text>
        </View>

        {/* Health Status */}
        <View style={styles.healthIndicator}>
          <View style={[
            styles.healthDot,
            { 
              backgroundColor: hasLoaded 
                ? '#53FC18' 
                : isLoading 
                  ? '#ffff00' 
                  : '#ff0000' 
            }
          ]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: ModernTheme.colors.background.secondary,
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
    margin: ModernTheme.spacing.xs,
    ...ModernTheme.shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(83, 252, 24, 0.2)',
  } as ViewStyle,
  
  playerContainer: {
    flex: 1,
    position: 'relative',
  } as ViewStyle,
  
  video: {
    flex: 1,
    backgroundColor: '#0f0f23',
  } as ViewStyle,
  
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,15,35,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  
  loadingText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    marginTop: ModernTheme.spacing.sm,
    fontWeight: ModernTheme.typography.weights.medium,
  } as TextStyle,
  
  loadingSubtext: {
    color: '#53FC18',
    fontSize: ModernTheme.typography.sizes.xs,
    marginTop: ModernTheme.spacing.xs,
    opacity: 0.8,
    fontWeight: ModernTheme.typography.weights.semibold,
  } as TextStyle,
  
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,15,35,0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ModernTheme.spacing.md,
  } as ViewStyle,
  
  errorText: {
    color: '#ff6b6b',
    fontSize: ModernTheme.typography.sizes.md,
    textAlign: 'center',
    marginTop: ModernTheme.spacing.sm,
    marginBottom: ModernTheme.spacing.xs,
    fontWeight: ModernTheme.typography.weights.semibold,
  } as TextStyle,
  
  errorPlatform: {
    color: '#53FC18',
    fontSize: ModernTheme.typography.sizes.sm,
    textAlign: 'center',
    marginBottom: ModernTheme.spacing.md,
  } as TextStyle,
  
  errorButtons: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  } as ViewStyle,
  
  retryButton: {
    backgroundColor: ModernTheme.colors.primary[500],
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    borderRadius: ModernTheme.borderRadius.md,
  } as ViewStyle,
  
  retryText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
  } as TextStyle,
  
  platformButton: {
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
    borderRadius: ModernTheme.borderRadius.md,
  } as ViewStyle,
  
  platformText: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
  } as TextStyle,
  
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  } as ViewStyle,
  
  controlsGradient: {
    padding: ModernTheme.spacing.md,
  } as ViewStyle,
  
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  
  leftControls: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
    flex: 1,
  } as ViewStyle,
  
  centerControls: {
    flex: 2,
    alignItems: 'center',
  } as ViewStyle,
  
  rightControls: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
    flex: 1,
    justifyContent: 'flex-end',
  } as ViewStyle,
  
  controlButton: {
    backgroundColor: 'rgba(15, 15, 35, 0.8)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(83, 252, 24, 0.3)',
  } as ViewStyle,
  
  removeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.7)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  } as ViewStyle,
  
  streamTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
    textAlign: 'center',
  } as TextStyle,
  
  streamGame: {
    color: '#53FC18',
    fontSize: ModernTheme.typography.sizes.xs,
    textAlign: 'center',
    marginTop: 2,
    fontWeight: ModernTheme.typography.weights.medium,
  } as TextStyle,
  
  qualityMenu: {
    position: 'absolute',
    bottom: 80,
    left: 60,
    backgroundColor: 'rgba(15, 15, 35, 0.98)',
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.md,
    minWidth: 180,
    borderWidth: 1,
    borderColor: '#53FC18',
  } as ViewStyle,
  
  qualityTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
    marginBottom: ModernTheme.spacing.sm,
  } as TextStyle,
  
  qualityOption: {
    paddingVertical: ModernTheme.spacing.xs,
    paddingHorizontal: ModernTheme.spacing.sm,
    borderRadius: ModernTheme.borderRadius.sm,
    marginBottom: ModernTheme.spacing.xs,
  } as ViewStyle,
  
  qualityOptionActive: {
    backgroundColor: '#53FC18',
  } as ViewStyle,
  
  qualityText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
  } as TextStyle,
  
  qualityTextActive: {
    color: '#0f0f23',
    fontWeight: ModernTheme.typography.weights.bold,
  } as TextStyle,
  
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: ModernTheme.borderRadius.lg,
    borderWidth: 3,
    borderColor: 'transparent',
  } as ViewStyle,
  
  activeGradient: {
    flex: 1,
    borderRadius: ModernTheme.borderRadius.lg,
  } as ViewStyle,
  
  platformBadge: {
    position: 'absolute',
    top: ModernTheme.spacing.sm,
    left: ModernTheme.spacing.sm,
    backgroundColor: '#53FC18',
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  
  platformBadgeText: {
    color: '#0f0f23',
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.bold,
  } as TextStyle,
  
  latencyIndicator: {
    position: 'absolute',
    top: ModernTheme.spacing.sm,
    right: ModernTheme.spacing.sm,
    backgroundColor: 'rgba(83, 252, 24, 0.2)',
    paddingHorizontal: ModernTheme.spacing.xs,
    paddingVertical: 2,
    borderRadius: ModernTheme.borderRadius.xs,
    borderWidth: 1,
    borderColor: '#53FC18',
  } as ViewStyle,
  
  latencyText: {
    color: '#53FC18',
    fontSize: 8,
    fontWeight: ModernTheme.typography.weights.bold,
  } as TextStyle,
  
  healthIndicator: {
    position: 'absolute',
    bottom: ModernTheme.spacing.xs,
    right: ModernTheme.spacing.xs,
    zIndex: 1000,
  } as ViewStyle,
  
  healthDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  } as ViewStyle,
});

export default EnhancedKickPlayer;