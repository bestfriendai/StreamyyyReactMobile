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
  ThumbsUp,
  Share2,
} from 'lucide-react-native';
import { UniversalStream } from '@/services/multiPlatformStreamingApi';
import { ModernTheme } from '@/theme/modernTheme';
import { streamQualityManager, QualityLevel } from '@/services/streamQualityManager';
import { streamHealthMonitor } from '@/services/streamHealthMonitor';

interface EnhancedYouTubePlayerProps {
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
  showSuperChat?: boolean;
}

interface YouTubePlayerStats {
  loadTime: number;
  bufferHealth: number;
  playbackRate: number;
  videoQuality: string;
  currentTime: number;
  duration: number;
  bytesLoaded: number;
  bytesTotal: number;
  playerState: string;
}

export const EnhancedYouTubePlayer: React.FC<EnhancedYouTubePlayerProps> = ({
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
  showSuperChat = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<YouTubePlayerStats>({
    loadTime: 0,
    bufferHealth: 100,
    playbackRate: 1,
    videoQuality: 'auto',
    currentTime: 0,
    duration: 0,
    bytesLoaded: 0,
    bytesTotal: 0,
    playerState: 'unstarted',
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

  // Generate YouTube embed HTML with YouTube API integration
  const getEmbedHtml = useCallback(() => {
    const videoId = stream.id;
    const apiKey = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY || '';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Enhanced YouTube Player - ${stream.streamerDisplayName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            width: 100%;
            height: 100%;
            background: #000;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .player-container {
            width: 100%;
            height: 100%;
            position: relative;
            display: ${showSuperChat ? 'flex' : 'block'};
        }
        
        .video-section {
            flex: ${showSuperChat ? '3' : '1'};
            position: relative;
        }
        
        .chat-section {
            flex: 1;
            display: ${showSuperChat ? 'block' : 'none'};
            border-left: 1px solid #333;
            background: #181818;
        }
        
        #youtube-player {
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
            border-top: 3px solid #FF0000;
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
            background: rgba(0, 0, 0, 0.9);
            border-radius: 8px;
            border: 1px solid #ff6b6b;
        }
        
        .retry-btn {
            background: #FF0000;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            margin-top: 15px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            transition: background 0.2s;
        }
        
        .retry-btn:hover {
            background: #CC0000;
        }
        
        .stream-info {
            position: absolute;
            top: 15px;
            left: 15px;
            background: linear-gradient(135deg, rgba(255, 0, 0, 0.9), rgba(204, 0, 0, 0.9));
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: bold;
            z-index: 50;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .viewer-count {
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 11px;
            z-index: 50;
            backdrop-filter: blur(10px);
        }
        
        .stats-overlay {
            position: absolute;
            bottom: 15px;
            left: 15px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 10px;
            border-radius: 6px;
            font-size: 10px;
            font-family: monospace;
            z-index: 50;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            min-width: 140px;
        }
        
        .quality-indicator {
            position: absolute;
            bottom: 15px;
            right: 15px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            z-index: 50;
        }
        
        .progress-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: rgba(255, 255, 255, 0.2);
            z-index: 60;
            width: 100%;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #FF0000, #CC0000);
            transition: width 0.3s ease;
        }
        
        .superchat-container {
            padding: 10px;
            overflow-y: auto;
            height: 100%;
        }
        
        .superchat-message {
            background: rgba(255, 0, 0, 0.1);
            border: 1px solid #FF0000;
            border-radius: 4px;
            padding: 8px;
            margin-bottom: 8px;
            color: white;
            font-size: 12px;
        }
        
        .superchat-amount {
            color: #FF0000;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="player-container">
        <div class="video-section">
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <div>Loading ${stream.streamerDisplayName}</div>
                <div style="font-size: 11px; opacity: 0.7; margin-top: 5px;">YouTube Live • Quality: ${quality.toUpperCase()}</div>
            </div>
            
            <div class="error" id="error" style="display: none;">
                <div style="font-size: 16px; margin-bottom: 10px;">📺 Stream Unavailable</div>
                <div>Unable to load ${stream.streamerDisplayName}</div>
                <div style="font-size: 11px; margin: 5px 0; opacity: 0.8;">YouTube Live • Retry: ${retryCount + 1}</div>
                <button class="retry-btn" onclick="retryLoad()">Retry Stream</button>
                <button class="retry-btn" onclick="openYouTube()" style="margin-left: 10px; background: #CC0000;">Open YouTube</button>
            </div>
            
            <div class="stream-info">
                🔴 LIVE • ${stream.game}
            </div>
            
            <div class="viewer-count">
                👥 ${stream.viewerCount.toLocaleString()}
            </div>
            
            <div class="stats-overlay" id="stats" style="display: none;">
                <div style="font-weight: bold; margin-bottom: 5px;">YouTube Stats</div>
                <div>Quality: <span id="current-quality">${quality}</span></div>
                <div>State: <span id="player-state">--</span></div>
                <div>Rate: <span id="playback-rate">1.0</span>x</div>
                <div>Time: <span id="current-time">0:00</span> / <span id="duration">0:00</span></div>
                <div>Buffered: <span id="buffered-percent">0</span>%</div>
                <div>Loaded: <span id="bytes-loaded">--</span> MB</div>
            </div>
            
            <div class="quality-indicator" id="quality-indicator">
                ${quality.toUpperCase()}
            </div>
            
            <div class="progress-bar">
                <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
            </div>
            
            <div id="youtube-player"></div>
        </div>
        
        ${showSuperChat ? `
        <div class="chat-section">
            <div class="superchat-container" id="superchat-container">
                <div style="color: #fff; font-weight: bold; margin-bottom: 10px; text-align: center;">
                    Super Chat & Comments
                </div>
                <!-- Super Chat messages will be populated here -->
            </div>
        </div>
        ` : ''}
    </div>
    
    <!-- YouTube API Script -->
    <script src="https://www.youtube.com/iframe_api"></script>
    
    <script>
        let player;
        let hasLoaded = false;
        let loadStartTime = Date.now();
        let statsInterval;
        let isPlayerReady = false;
        
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const stats = document.getElementById('stats');
        
        // YouTube API ready callback
        function onYouTubeIframeAPIReady() {
            console.log('YouTube API ready');
            initializePlayer();
        }
        
        function initializePlayer() {
            player = new YT.Player('youtube-player', {
                height: '100%',
                width: '100%',
                videoId: '${videoId}',
                playerVars: {
                    'autoplay': ${autoplay && isPlaying ? 1 : 0},
                    'mute': ${isMuted ? 1 : 0},
                    'controls': 0,
                    'disablekb': 1,
                    'fs': 0,
                    'iv_load_policy': 3,
                    'modestbranding': 1,
                    'playsinline': 1,
                    'rel': 0,
                    'showinfo': 0,
                    'origin': window.location.origin
                },
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange,
                    'onPlaybackQualityChange': onPlaybackQualityChange,
                    'onError': onPlayerError
                }
            });
        }
        
        function onPlayerReady(event) {
            console.log('YouTube player ready');
            isPlayerReady = true;
            hideLoading();
            startPerformanceMonitoring();
            
            // Set initial quality if specified
            if ('${quality}' !== 'auto') {
                try {
                    const availableQualities = player.getAvailableQualityLevels();
                    if (availableQualities.includes('${quality}')) {
                        player.setPlaybackQuality('${quality}');
                    }
                } catch (e) {
                    console.log('Quality setting failed:', e);
                }
            }
            
            notifyReactNative({
                type: 'loaded',
                streamId: '${stream.id}',
                streamer: '${stream.streamerDisplayName}',
                loadTime: Date.now() - loadStartTime,
                quality: '${quality}'
            });
        }
        
        function onPlayerStateChange(event) {
            const stateNames = {
                '-1': 'unstarted',
                '0': 'ended',
                '1': 'playing',
                '2': 'paused',
                '3': 'buffering',
                '5': 'cued'
            };
            
            const stateName = stateNames[event.data] || 'unknown';
            console.log('Player state changed:', stateName);
            
            // Update UI
            if (document.getElementById('player-state')) {
                document.getElementById('player-state').textContent = stateName;
            }
            
            // Handle buffering
            if (event.data === 3) { // buffering
                showBuffering();
            } else {
                hideBuffering();
            }
            
            notifyReactNative({
                type: 'state_change',
                streamId: '${stream.id}',
                state: stateName,
                data: event.data
            });
        }
        
        function onPlaybackQualityChange(event) {
            console.log('Quality changed to:', event.data);
            
            if (document.getElementById('current-quality')) {
                document.getElementById('current-quality').textContent = event.data;
            }
            
            if (document.getElementById('quality-indicator')) {
                document.getElementById('quality-indicator').textContent = event.data.toUpperCase();
            }
            
            notifyReactNative({
                type: 'quality_change',
                streamId: '${stream.id}',
                quality: event.data
            });
        }
        
        function onPlayerError(event) {
            console.error('YouTube player error:', event.data);
            showError('YouTube player error: ' + event.data);
            
            notifyReactNative({
                type: 'error',
                streamId: '${stream.id}',
                error: 'Player error: ' + event.data
            });
        }
        
        function hideLoading() {
            if (loading) loading.style.display = 'none';
            hasLoaded = true;
        }
        
        function showError(message) {
            if (loading) loading.style.display = 'none';
            if (error) error.style.display = 'block';
            
            notifyReactNative({
                type: 'error',
                streamId: '${stream.id}',
                message: message
            });
        }
        
        function showBuffering() {
            // Visual buffering indication
        }
        
        function hideBuffering() {
            // Hide buffering indication
        }
        
        function retryLoad() {
            if (error) error.style.display = 'none';
            if (loading) loading.style.display = 'block';
            hasLoaded = false;
            
            // Reinitialize player
            if (player && player.destroy) {
                player.destroy();
            }
            
            setTimeout(() => {
                initializePlayer();
            }, 1000);
            
            notifyReactNative({
                type: 'retry',
                streamId: '${stream.id}'
            });
        }
        
        function openYouTube() {
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
                if (player && isPlayerReady) {
                    updatePerformanceStats();
                }
            }, 2000);
        }
        
        function updatePerformanceStats() {
            try {
                const currentTime = player.getCurrentTime() || 0;
                const duration = player.getDuration() || 0;
                const bufferedFraction = player.getVideoLoadedFraction() || 0;
                const playbackRate = player.getPlaybackRate() || 1;
                const quality = player.getPlaybackQuality() || 'auto';
                const bytesLoaded = player.getVideoBytesLoaded() || 0;
                const bytesTotal = player.getVideoBytesTotal() || 0;
                
                // Update UI
                if (document.getElementById('current-time')) {
                    document.getElementById('current-time').textContent = formatTime(currentTime);
                    document.getElementById('duration').textContent = formatTime(duration);
                    document.getElementById('playback-rate').textContent = playbackRate.toFixed(1);
                    document.getElementById('buffered-percent').textContent = Math.round(bufferedFraction * 100);
                    document.getElementById('bytes-loaded').textContent = (bytesLoaded / 1024 / 1024).toFixed(1);
                    
                    // Update progress bar
                    const progressFill = document.getElementById('progress-fill');
                    if (progressFill && duration > 0) {
                        progressFill.style.width = (currentTime / duration * 100) + '%';
                    }
                }
                
                // Send performance data to React Native
                notifyReactNative({
                    type: 'performance_update',
                    streamId: '${stream.id}',
                    stats: {
                        currentTime,
                        duration,
                        bufferedFraction,
                        playbackRate,
                        quality,
                        bytesLoaded,
                        bytesTotal,
                        bufferHealth: Math.round(bufferedFraction * 100)
                    }
                });
            } catch (e) {
                console.log('Stats update error:', e);
            }
        }
        
        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return mins + ':' + (secs < 10 ? '0' : '') + secs;
        }
        
        function notifyReactNative(data) {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify(data));
            }
        }
        
        // Handle clicks
        document.addEventListener('click', function(e) {
            if (e.target.id === 'youtube-player' || e.target.closest('#youtube-player')) {
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
                    if (player && isPlayerReady) {
                        if (player.isMuted()) {
                            player.unMute();
                        } else {
                            player.mute();
                        }
                    }
                    notifyReactNative({ type: 'mute_toggle' });
                    break;
                case ' ':
                    e.preventDefault();
                    if (player && isPlayerReady) {
                        const state = player.getPlayerState();
                        if (state === 1) { // playing
                            player.pauseVideo();
                        } else {
                            player.playVideo();
                        }
                    }
                    notifyReactNative({ type: 'play_toggle' });
                    break;
            }
        });
        
        // Prevent context menu
        document.addEventListener('contextmenu', e => e.preventDefault());
        
        console.log('Enhanced YouTube Player initialized for ${stream.streamerDisplayName}');
    </script>
</body>
</html>`;
  }, [stream, isMuted, isPlaying, autoplay, quality, showSuperChat, retryCount]);

  // WebView event handlers
  const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log(`Enhanced YouTube player message:`, data);
      
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
          setError(data.message || 'YouTube stream unavailable');
          streamHealthMonitor.recordError(stream.id, data.message);
          break;
          
        case 'retry':
          setRetryCount(prev => prev + 1);
          streamHealthMonitor.recordError(stream.id, 'Retry attempt', true);
          break;
          
        case 'performance_update':
          setStats(prev => ({ ...prev, ...data.stats }));
          break;
          
        case 'state_change':
          // Handle player state changes
          break;
          
        case 'quality_change':
          // Handle quality changes
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
      console.log('YouTube WebView message parse error:', error);
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
        {/* YouTube WebView */}
        <WebView
          ref={webViewRef}
          source={{ html: embedHtml }}
          style={styles.video}
          onMessage={handleWebViewMessage}
          allowsInlineMediaPlaybook={true}
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
            <ActivityIndicator size="large" color="#FF0000" />
            <Text style={styles.loadingText}>Loading {stream.streamerDisplayName}...</Text>
            <Text style={styles.loadingSubtext}>YouTube Live • Please wait</Text>
          </View>
        )}

        {/* Error Overlay */}
        {error && (
          <View style={styles.errorOverlay}>
            <AlertCircle size={32} color="#ff6b6b" />
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorPlatform}>Platform: YouTube</Text>
            <View style={styles.errorButtons}>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={() => webViewRef.current?.reload()}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.platformButton, { backgroundColor: '#FF0000' }]} 
                onPress={() => {/* Handle external opening */}}
              >
                <Text style={styles.platformText}>Open YouTube</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Enhanced Controls */}
        {showControls && controlsVisible && !error && (
          <View style={styles.controlsOverlay}>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
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
                    {stream.game} • YouTube Live
                  </Text>
                </View>

                <View style={styles.rightControls}>
                  <TouchableOpacity style={styles.controlButton}>
                    <ThumbsUp size={18} color="#fff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.controlButton}>
                    <Share2 size={18} color="#fff" />
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
                  {q === 'auto' && ' (Adaptive)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Active Indicator */}
        {isActive && (
          <View style={styles.activeIndicator}>
            <LinearGradient
              colors={['#FF0000', '#CC0000']}
              style={styles.activeGradient}
            />
          </View>
        )}

        {/* YouTube Platform Badge */}
        <View style={styles.platformBadge}>
          <Text style={styles.platformBadgeText}>📺 YOUTUBE</Text>
        </View>

        {/* Health Status */}
        <View style={styles.healthIndicator}>
          <View style={[
            styles.healthDot,
            { 
              backgroundColor: hasLoaded 
                ? '#00ff00' 
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
  } as ViewStyle,
  
  playerContainer: {
    flex: 1,
    position: 'relative',
  } as ViewStyle,
  
  video: {
    flex: 1,
    backgroundColor: '#000',
  } as ViewStyle,
  
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
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
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.xs,
    marginTop: ModernTheme.spacing.xs,
    opacity: 0.7,
  } as TextStyle,
  
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
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
    color: ModernTheme.colors.text.secondary,
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  
  removeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.7)',
  } as ViewStyle,
  
  streamTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
    textAlign: 'center',
  } as TextStyle,
  
  streamGame: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.xs,
    textAlign: 'center',
    marginTop: 2,
  } as TextStyle,
  
  qualityMenu: {
    position: 'absolute',
    bottom: 80,
    left: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.md,
    minWidth: 150,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: '#FF0000',
  } as ViewStyle,
  
  qualityText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
  } as TextStyle,
  
  qualityTextActive: {
    color: ModernTheme.colors.text.primary,
    fontWeight: ModernTheme.typography.weights.semibold,
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
    backgroundColor: '#FF0000',
    paddingHorizontal: ModernTheme.spacing.sm,
    paddingVertical: ModernTheme.spacing.xs,
    borderRadius: ModernTheme.borderRadius.sm,
  } as ViewStyle,
  
  platformBadgeText: {
    color: ModernTheme.colors.text.primary,
    fontSize: 10,
    fontWeight: ModernTheme.typography.weights.bold,
  } as TextStyle,
  
  healthIndicator: {
    position: 'absolute',
    top: ModernTheme.spacing.xs,
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

export default EnhancedYouTubePlayer;