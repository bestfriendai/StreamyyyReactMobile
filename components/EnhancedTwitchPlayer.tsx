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
  Heart,
  MessageCircle,
  Share2,
  Maximize,
  Minimize,
  Monitor,
} from 'lucide-react-native';
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
  Dimensions,
  PanGestureHandler,
  State,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { performanceOptimizer } from '@/services/performanceOptimizer';
import { streamHealthMonitor } from '@/services/streamHealthMonitor';
import { streamQualityManager, QualityLevel } from '@/services/streamQualityManager';
import { TwitchStream, twitchApi } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';

interface EnhancedTwitchPlayerProps {
  stream: TwitchStream;
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
  showChat?: boolean;
  autoplay?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

interface PlayerStats {
  loadTime: number;
  bufferHealth: number;
  frameDrops: number;
  bitrate: number;
  fps: number;
  latency: number;
  memoryUsage: number;
}

export const EnhancedTwitchPlayer: React.FC<EnhancedTwitchPlayerProps> = ({
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
  showChat = false,
  autoplay = true,
  priority = 'medium',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<PlayerStats>({
    loadTime: 0,
    bufferHealth: 100,
    frameDrops: 0,
    bitrate: 0,
    fps: 0,
    latency: 0,
    memoryUsage: 0,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const webViewRef = useRef<WebView>(null);
  const loadStartTime = useRef<number>(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const controlsTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize stream quality management
  useEffect(() => {
    streamQualityManager.initializeStream(stream.id, quality, quality === 'auto');
    streamHealthMonitor.initializeStream(stream);

    return () => {
      streamQualityManager.removeStream(stream.id);
      streamHealthMonitor.removeStream(stream.id);
    };
  }, [stream.id, quality]);

  // Monitor performance and adjust quality
  useEffect(() => {
    const interval = setInterval(() => {
      updatePerformanceStats();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (controlsVisible && showControls) {
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
      controlsTimer.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }

    return () => {
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
    };
  }, [controlsVisible, showControls]);

  const updatePerformanceStats = useCallback(() => {
    // Get performance metrics from the performance optimizer
    const metrics = performanceOptimizer.getCurrentPerformance();
    const qualityState = streamQualityManager.getStreamQuality(stream.id);

    if (metrics && qualityState) {
      const newStats: PlayerStats = {
        loadTime: stats.loadTime,
        bufferHealth: qualityState.bufferHealth,
        frameDrops: qualityState.frameDrops,
        bitrate: qualityState.bitrate,
        fps: qualityState.fps,
        latency: qualityState.latency,
        memoryUsage: metrics.memoryUsage,
      };

      setStats(newStats);

      // Update stream quality manager with current metrics
      streamQualityManager.updateStreamMetrics(stream.id, {
        bufferHealth: newStats.bufferHealth,
        frameDrops: newStats.frameDrops,
        bitrate: newStats.bitrate,
        fps: newStats.fps,
        latency: newStats.latency,
      });
    }
  }, [stream.id, stats.loadTime]);

  // Generate enhanced embed HTML with advanced features
  const getEmbedHtml = useCallback(() => {
    const embedUrl = twitchApi.generateEmbedUrl(stream.user_login, {
      autoplay: autoplay && isPlaying,
      muted: isMuted,
      quality: quality === 'auto' ? 'auto' : quality,
    });

    const chatUrl = showChat
      ? `https://www.twitch.tv/embed/${stream.user_login}/chat?parent=localhost&parent=127.0.0.1&parent=expo.dev`
      : null;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Enhanced Twitch Player - ${stream.user_name}</title>
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
            display: ${showChat ? 'flex' : 'block'};
        }
        
        .video-section {
            flex: ${showChat ? '2' : '1'};
            position: relative;
        }
        
        .chat-section {
            flex: 1;
            display: ${showChat ? 'block' : 'none'};
            border-left: 1px solid #333;
        }
        
        iframe {
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
            border-top: 3px solid #9146FF;
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
            background: #9146FF;
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
            background: #7928CA;
        }
        
        .stream-info {
            position: absolute;
            top: 15px;
            left: 15px;
            background: linear-gradient(135deg, rgba(145, 70, 255, 0.9), rgba(121, 40, 202, 0.9));
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
            min-width: 120px;
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
        
        .buffer-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: rgba(255, 255, 255, 0.2);
            z-index: 60;
            width: 100%;
        }
        
        .buffer-fill {
            height: 100%;
            background: linear-gradient(90deg, #9146FF, #7928CA);
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="player-container">
        <div class="video-section">
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <div>Loading ${stream.user_name}</div>
                <div style="font-size: 11px; opacity: 0.7; margin-top: 5px;">Quality: ${quality.toUpperCase()}</div>
                <div style="font-size: 10px; opacity: 0.6; margin-top: 3px;">Priority: ${priority.toUpperCase()}</div>
            </div>
            
            <div class="error" id="error" style="display: none;">
                <div style="font-size: 16px; margin-bottom: 10px;">⚠️ Stream Unavailable</div>
                <div>Unable to load ${stream.user_name}</div>
                <div style="font-size: 11px; margin: 5px 0; opacity: 0.8;">Quality: ${quality} • Retry: ${retryCount + 1}</div>
                <button class="retry-btn" onclick="retryLoad()">Retry Stream</button>
                <button class="retry-btn" onclick="openTwitch()" style="margin-left: 10px; background: #772CE8;">Open Twitch</button>
            </div>
            
            <div class="stream-info">
                🔴 LIVE • ${stream.game_name}
            </div>
            
            <div class="viewer-count">
                👥 ${stream.viewer_count.toLocaleString()}
            </div>
            
            <div class="stats-overlay" id="stats" style="display: none;">
                <div style="font-weight: bold; margin-bottom: 5px;">Stream Stats</div>
                <div>Quality: <span id="current-quality">${quality}</span></div>
                <div>FPS: <span id="fps">--</span></div>
                <div>Bitrate: <span id="bitrate">--</span> kbps</div>
                <div>Latency: <span id="latency">--</span> ms</div>
                <div>Buffer: <span id="buffer-health">100</span>%</div>
                <div>Memory: <span id="memory">--</span> MB</div>
            </div>
            
            <div class="quality-indicator" id="quality-indicator">
                ${quality.toUpperCase()}
            </div>
            
            <div class="buffer-bar">
                <div class="buffer-fill" id="buffer-fill" style="width: 100%"></div>
            </div>
            
            <iframe 
                id="twitch-player"
                src="${embedUrl}"
                allowfullscreen="true"
                scrolling="no"
                frameborder="0"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture">
            </iframe>
        </div>
        
        ${
  showChat
    ? `
        <div class="chat-section">
            <iframe 
                id="twitch-chat"
                src="${chatUrl}"
                scrolling="yes"
                frameborder="0">
            </iframe>
        </div>
        `
    : ''
}
    </div>
    
    <script>
        let loadTimeout;
        let hasLoaded = false;
        let statsInterval;
        let performanceData = {
            loadTime: 0,
            bufferHealth: 100,
            frameDrops: 0,
            fps: 30,
            bitrate: 0,
            latency: 0,
            memoryUsage: 0
        };
        
        const iframe = document.getElementById('twitch-player');
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const stats = document.getElementById('stats');
        const qualityIndicator = document.getElementById('quality-indicator');
        
        function hideLoading() {
            if (loading) loading.style.display = 'none';
            hasLoaded = true;
            clearTimeout(loadTimeout);
            
            // Start performance monitoring
            startPerformanceMonitoring();
            
            // Notify React Native about successful load
            notifyReactNative({
                type: 'loaded',
                streamId: '${stream.id}',
                streamer: '${stream.user_name}',
                loadTime: Date.now() - loadStartTime,
                quality: '${quality}'
            });
        }
        
        function showError(message = 'Stream failed to load') {
            if (loading) loading.style.display = 'none';
            if (error) error.style.display = 'block';
            clearTimeout(loadTimeout);
            
            notifyReactNative({
                type: 'error',
                streamId: '${stream.id}',
                message: message,
                retryCount: ${retryCount}
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
            loadTimeout = setTimeout(() => {
                if (!hasLoaded) showError('Loading timeout');
            }, 25000);

            notifyReactNative({
                type: 'retry',
                streamId: '${stream.id}',
                retryCount: ${retryCount + 1}
            });
        }
        
        function openTwitch() {
            notifyReactNative({
                type: 'open_external',
                url: 'https://twitch.tv/${stream.user_login}'
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
        }
        
        function updatePerformanceStats() {
            // Simulate performance data (in real implementation, this would come from player API)
            performanceData.fps = Math.floor(Math.random() * 10) + 25; // 25-35 fps
            performanceData.bitrate = Math.floor(Math.random() * 1000) + 2000; // 2000-3000 kbps
            performanceData.latency = Math.floor(Math.random() * 100) + 50; // 50-150 ms
            performanceData.bufferHealth = Math.max(50, Math.floor(Math.random() * 50) + 50); // 50-100%
            performanceData.memoryUsage = Math.floor(Math.random() * 20) + 40; // 40-60 MB
            
            // Update UI
            if (document.getElementById('fps')) {
                document.getElementById('fps').textContent = performanceData.fps;
                document.getElementById('bitrate').textContent = performanceData.bitrate;
                document.getElementById('latency').textContent = performanceData.latency;
                document.getElementById('buffer-health').textContent = performanceData.bufferHealth;
                document.getElementById('memory').textContent = performanceData.memoryUsage;
                
                // Update buffer bar
                const bufferFill = document.getElementById('buffer-fill');
                if (bufferFill) {
                    bufferFill.style.width = performanceData.bufferHealth + '%';
                }
            }
            
            // Send stats to React Native
            notifyReactNative({
                type: 'performance_update',
                streamId: '${stream.id}',
                stats: performanceData
            });
        }
        
        function notifyReactNative(data) {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify(data));
            }
        }
        
        // Initialize
        loadStartTime = Date.now();
        
        loadTimeout = setTimeout(() => {
            if (!hasLoaded) {
                console.log('Twitch player load timeout');
                showError('Loading timeout - stream may be offline');
            }
        }, 25000);
        
        // Listen for iframe events
        iframe.addEventListener('load', function() {
            console.log('Twitch iframe loaded');
            setTimeout(hideLoading, 3000);
        });
        
        iframe.addEventListener('error', function() {
            console.log('Twitch iframe error');
            showError('Failed to load Twitch player');
        });
        
        // Handle clicks
        document.addEventListener('click', function(e) {
            notifyReactNative({
                type: 'touch',
                streamId: '${stream.id}',
                target: e.target.id || 'player'
            });
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
        
        // Prevent context menu and selection
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('selectstart', e => e.preventDefault());
        
        // Focus iframe for better interaction
        setTimeout(() => {
            if (iframe.contentWindow) {
                iframe.contentWindow.focus();
            }
        }, 4000);
        
        console.log('Enhanced Twitch Player initialized for ${stream.user_name}');
    </script>
</body>
</html>`;
  }, [stream, isMuted, isPlaying, autoplay, quality, showChat, retryCount, priority]);

  // WebView event handlers
  const handleWebViewLoad = useCallback(() => {
    console.log(`✅ Enhanced Twitch player loaded: ${stream.user_name}`);
    const loadTime = Date.now() - loadStartTime.current;
    streamHealthMonitor.recordSuccess(stream.id, loadTime);
  }, [stream.id, stream.user_name]);

  const handleWebViewError = useCallback(
    (syntheticEvent: any) => {
      const { nativeEvent } = syntheticEvent;
      console.error('❌ Enhanced Twitch player error:', stream.user_name, nativeEvent);
      setError('Failed to load enhanced Twitch player');
      setIsLoading(false);
      streamHealthMonitor.recordError(stream.id, nativeEvent.description || 'WebView error');
    },
    [stream.id, stream.user_name]
  );

  const handleWebViewLoadStart = useCallback(() => {
    console.log(`🔄 Enhanced Twitch player loading: ${stream.user_name}`);
    setIsLoading(true);
    setError(null);
    setHasLoaded(false);
    loadStartTime.current = Date.now();
  }, [stream.user_name]);

  // Handle WebView messages
  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        console.log('Enhanced Twitch player message:', data);

        switch (data.type) {
          case 'loaded':
            setIsLoading(false);
            setError(null);
            setHasLoaded(true);
            setRetryCount(0);
            setStats(prev => ({ ...prev, loadTime: data.loadTime }));
            break;

          case 'error':
            setIsLoading(false);
            setError(data.message || 'Twitch stream unavailable');
            streamHealthMonitor.recordError(stream.id, data.message);
            break;

          case 'retry':
            setRetryCount(data.retryCount);
            streamHealthMonitor.recordError(stream.id, 'Retry attempt', true);
            break;

          case 'performance_update':
            setStats(data.stats);
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
        console.log('WebView message parse error:', error);
      }
    },
    [onPress, onMuteToggle, onPlayToggle, stream.id]
  );

  // Handle retry
  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setHasLoaded(false);
    setRetryCount(prev => prev + 1);
    webViewRef.current?.reload();
  }, []);

  // Handle quality change
  const handleQualityChange = useCallback(
    (newQuality: QualityLevel) => {
      streamQualityManager.setStreamQuality(stream.id, newQuality, true);
      onQualityChange?.(newQuality);
      setShowQualityMenu(false);
      webViewRef.current?.reload();
    },
    [stream.id, onQualityChange]
  );

  // Handle gesture controls
  const onGestureEvent = useCallback(
    (event: any) => {
      const { translationX, translationY } = event.nativeEvent;

      // Swipe right to remove
      if (translationX > 100) {
        onRemove?.();
      }
      // Swipe up for fullscreen
      else if (translationY < -100) {
        onFullscreen?.();
      }
      // Swipe down for picture-in-picture
      else if (translationY > 100) {
        onPictureInPicture?.();
      }
    },
    [onRemove, onFullscreen, onPictureInPicture]
  );

  const embedHtml = getEmbedHtml();
  const qualityOptions: QualityLevel[] = [
    'auto',
    'source',
    '720p60',
    '720p',
    '480p',
    '360p',
    '160p',
  ];

  return (
    <View style={[styles.container, { width, height }]}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.END) {
            setControlsVisible(true);
          }
        }}
      >
        <View style={styles.gestureContainer}>
          {/* Enhanced WebView */}
          <WebView
            ref={webViewRef}
            source={{ html: embedHtml }}
            style={styles.video}
            onLoad={handleWebViewLoad}
            onError={handleWebViewError}
            onLoadStart={handleWebViewLoadStart}
            onMessage={handleWebViewMessage}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
            scalesPageToFit={false}
            bounces={false}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            originWhitelist={['*']}
            mixedContentMode="compatibility"
            allowsFullscreenVideo
            allowsProtectedMedia
            thirdPartyCookiesEnabled
            sharedCookiesEnabled
            cacheEnabled
            incognito={false}
            userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
          />

          {/* Enhanced Controls Overlay */}
          {showControls && controlsVisible && !error && (
            <Animated.View style={[styles.controlsOverlay, { opacity: fadeAnim }]}>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.controlsGradient}
              >
                <View style={styles.controlsContainer}>
                  <View style={styles.leftControls}>
                    <TouchableOpacity style={styles.controlButton} onPress={onMuteToggle}>
                      {isMuted ? (
                        <VolumeX size={18} color="#fff" />
                      ) : (
                        <Volume2 size={18} color="#fff" />
                      )}
                    </TouchableOpacity>

                    {onPlayToggle && (
                      <TouchableOpacity style={styles.controlButton} onPress={onPlayToggle}>
                        {isPlaying ? (
                          <Pause size={18} color="#fff" />
                        ) : (
                          <Play size={18} color="#fff" />
                        )}
                      </TouchableOpacity>
                    )}

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
                      {stream.user_name}
                    </Text>
                    <Text style={styles.streamGame} numberOfLines={1}>
                      {stream.game_name}
                    </Text>
                  </View>

                  <View style={styles.rightControls}>
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

                    <TouchableOpacity style={styles.controlButton} onPress={handleRetry}>
                      <RotateCcw size={18} color="#fff" />
                    </TouchableOpacity>

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
            </Animated.View>
          )}

          {/* Quality Selection Menu */}
          {showQualityMenu && (
            <View style={styles.qualityMenu}>
              <Text style={styles.qualityTitle}>Video Quality</Text>
              {qualityOptions.map(q => (
                <TouchableOpacity
                  key={q}
                  style={[styles.qualityOption, quality === q && styles.qualityOptionActive]}
                  onPress={() => handleQualityChange(q)}
                >
                  <Text style={[styles.qualityText, quality === q && styles.qualityTextActive]}>
                    {q.toUpperCase()}
                    {q === 'auto' && ' (Recommended)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Performance Stats Overlay */}
          {showStats && (
            <View style={styles.statsOverlay}>
              <Text style={styles.statsTitle}>Performance Stats</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Quality</Text>
                  <Text style={styles.statValue}>{quality.toUpperCase()}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>FPS</Text>
                  <Text style={styles.statValue}>{stats.fps}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Bitrate</Text>
                  <Text style={styles.statValue}>{(stats.bitrate / 1000).toFixed(1)}k</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Latency</Text>
                  <Text style={styles.statValue}>{stats.latency}ms</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Buffer</Text>
                  <Text style={styles.statValue}>{stats.bufferHealth}%</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Memory</Text>
                  <Text style={styles.statValue}>{stats.memoryUsage}MB</Text>
                </View>
              </View>
            </View>
          )}

          {/* Active Stream Indicator */}
          {isActive && (
            <View style={styles.activeIndicator}>
              <LinearGradient colors={['#9146FF', '#7928CA']} style={styles.activeGradient} />
            </View>
          )}

          {/* Priority Indicator */}
          {priority === 'high' && (
            <View style={styles.priorityIndicator}>
              <Text style={styles.priorityText}>HIGH</Text>
            </View>
          )}

          {/* Health Status Indicator */}
          <View style={styles.healthIndicator}>
            <View
              style={[
                styles.healthDot,
                {
                  backgroundColor: hasLoaded ? '#00ff00' : isLoading ? '#ffff00' : '#ff0000',
                },
              ]}
            />
          </View>
        </View>
      </PanGestureHandler>
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

  gestureContainer: {
    flex: 1,
    position: 'relative',
  } as ViewStyle,

  video: {
    flex: 1,
    backgroundColor: '#000',
  } as ViewStyle,

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
    backgroundColor: '#9146FF',
  } as ViewStyle,

  qualityText: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.sm,
  } as TextStyle,

  qualityTextActive: {
    color: ModernTheme.colors.text.primary,
    fontWeight: ModernTheme.typography.weights.semibold,
  } as TextStyle,

  statsOverlay: {
    position: 'absolute',
    top: ModernTheme.spacing.md,
    right: ModernTheme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.md,
    minWidth: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  } as ViewStyle,

  statsTitle: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
    marginBottom: ModernTheme.spacing.sm,
  } as TextStyle,

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ModernTheme.spacing.sm,
  } as ViewStyle,

  statItem: {
    width: '48%',
    alignItems: 'center',
  } as ViewStyle,

  statLabel: {
    color: ModernTheme.colors.text.secondary,
    fontSize: ModernTheme.typography.sizes.xs,
    marginBottom: 2,
  } as TextStyle,

  statValue: {
    color: ModernTheme.colors.text.primary,
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
    fontFamily: 'monospace',
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

  priorityIndicator: {
    position: 'absolute',
    top: ModernTheme.spacing.xs,
    left: ModernTheme.spacing.xs,
    backgroundColor: '#FF6B35',
    paddingHorizontal: ModernTheme.spacing.xs,
    paddingVertical: 2,
    borderRadius: ModernTheme.borderRadius.xs,
  } as ViewStyle,

  priorityText: {
    color: ModernTheme.colors.text.primary,
    fontSize: 8,
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

export default EnhancedTwitchPlayer;
