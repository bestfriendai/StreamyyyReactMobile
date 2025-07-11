import React, { useState, useEffect, useRef } from 'react';
import { UnifiedStream } from '@/services/platformService';
import { useCrossPlatformStore } from '@/store/useCrossPlatformStore';
import { platformDetection } from '@/utils/crossPlatformStorage';

interface ResponsiveMultiStreamGridProps {
  streams: UnifiedStream[];
  onStreamSelect?: (stream: UnifiedStream) => void;
  onStreamRemove?: (streamId: string) => void;
  maxStreams?: number;
  className?: string;
}

interface GridDimensions {
  width: number;
  height: number;
  columns: number;
  rows: number;
}

const ResponsiveMultiStreamGrid: React.FC<ResponsiveMultiStreamGridProps> = ({
  streams,
  onStreamSelect,
  onStreamRemove,
  maxStreams = 4,
  className = '',
}) => {
  const [dimensions, setDimensions] = useState<GridDimensions>({
    width: 0,
    height: 0,
    columns: 2,
    rows: 2,
  });
  const [fullscreenStream, setFullscreenStream] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Cross-platform store
  const { webSettings, updateWebSettings } = useCrossPlatformStore();

  // Calculate optimal grid layout based on container size and stream count
  const calculateGridLayout = (containerWidth: number, containerHeight: number, streamCount: number) => {
    const aspectRatio = 16 / 9; // Standard video aspect ratio
    const minStreamWidth = 320;
    const minStreamHeight = 180;
    
    let bestLayout = { columns: 1, rows: 1 };
    let bestScore = 0;
    
    // Try different grid configurations
    for (let cols = 1; cols <= Math.ceil(Math.sqrt(streamCount)); cols++) {
      const rows = Math.ceil(streamCount / cols);
      const streamWidth = containerWidth / cols;
      const streamHeight = containerHeight / rows;
      
      // Check if streams fit with minimum dimensions
      if (streamWidth >= minStreamWidth && streamHeight >= minStreamHeight) {
        // Calculate how well this layout uses the available space
        const usedSpace = (streamWidth * streamHeight * streamCount) / (containerWidth * containerHeight);
        const aspectRatioFit = Math.min(streamWidth / streamHeight, streamHeight / streamWidth) / aspectRatio;
        
        const score = usedSpace * aspectRatioFit;
        
        if (score > bestScore) {
          bestScore = score;
          bestLayout = { columns: cols, rows };
        }
      }
    }
    
    return bestLayout;
  };

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        const layout = calculateGridLayout(rect.width, rect.height, streams.length);
        
        setDimensions({
          width: rect.width,
          height: rect.height,
          columns: layout.columns,
          rows: layout.rows,
        });
      }
    };

    // Initial measurement
    handleResize();

    // Set up ResizeObserver for better performance than window resize
    if (gridRef.current && 'ResizeObserver' in window) {
      resizeObserverRef.current = new ResizeObserver(handleResize);
      resizeObserverRef.current.observe(gridRef.current);
    } else {
      // Fallback to window resize
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [streams.length]);

  // Handle keyboard shortcuts (web-specific)
  useEffect(() => {
    if (!platformDetection.isWeb || !webSettings.keyboardShortcuts) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts if not in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'f':
        case 'F':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (streams.length > 0) {
              setFullscreenStream(fullscreenStream ? null : streams[0].id);
            }
          }
          break;
        case 'Escape':
          if (fullscreenStream) {
            setFullscreenStream(null);
          }
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const index = parseInt(event.key) - 1;
            if (streams[index]) {
              onStreamSelect?.(streams[index]);
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [streams, fullscreenStream, webSettings.keyboardShortcuts, onStreamSelect]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenStream(null);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Toggle fullscreen for web
  const toggleFullscreen = async (streamId: string) => {
    if (!platformDetection.isWeb) return;

    try {
      if (fullscreenStream === streamId) {
        // Exit fullscreen
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        setFullscreenStream(null);
        updateWebSettings({ fullscreenMode: false });
      } else {
        // Enter fullscreen
        if (gridRef.current) {
          await gridRef.current.requestFullscreen();
          setFullscreenStream(streamId);
          updateWebSettings({ fullscreenMode: true });
        }
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  // Stream item component
  const StreamItem: React.FC<{ stream: UnifiedStream; index: number }> = ({ stream, index }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isStreamLoading, setIsStreamLoading] = useState(true);

    const isFullscreen = fullscreenStream === stream.id;
    const itemStyle: React.CSSProperties = {
      position: 'relative',
      width: isFullscreen ? '100%' : `${100 / dimensions.columns}%`,
      height: isFullscreen ? '100%' : `${100 / dimensions.rows}%`,
      border: '1px solid #333',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#000',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      transform: isHovered ? 'scale(1.02)' : 'scale(1)',
      zIndex: isFullscreen ? 1000 : 1,
    };

    const handleStreamLoad = () => {
      setIsStreamLoading(false);
      setHasError(false);
    };

    const handleStreamError = () => {
      setIsStreamLoading(false);
      setHasError(true);
    };

    return (
      <div
        style={itemStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onStreamSelect?.(stream)}
        onDoubleClick={() => toggleFullscreen(stream.id)}
      >
        {/* Stream iframe */}
        <iframe
          src={stream.embedUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: hasError ? 'none' : 'block',
          }}
          allow="autoplay; encrypted-media"
          allowFullScreen
          onLoad={handleStreamLoad}
          onError={handleStreamError}
        />

        {/* Loading state */}
        {isStreamLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            fontSize: '14px',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                border: '2px solid #333',
                borderTop: '2px solid #fff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              Loading stream...
            </div>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            fontSize: '14px',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <div>⚠️ Stream unavailable</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setHasError(false);
                setIsStreamLoading(true);
              }}
              style={{
                padding: '4px 8px',
                backgroundColor: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Stream info overlay */}
        {isHovered && !isFullscreen && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
            color: '#fff',
            padding: '8px',
            fontSize: '12px',
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
              {stream.streamerDisplayName}
            </div>
            <div style={{ opacity: 0.8 }}>
              {stream.title.length > 50 ? stream.title.substring(0, 50) + '...' : stream.title}
            </div>
            <div style={{ marginTop: '4px', fontSize: '11px' }}>
              <span style={{ 
                color: stream.platform === 'twitch' ? '#9146FF' : 
                      stream.platform === 'youtube' ? '#FF0000' : '#53FC18' 
              }}>
                {stream.platform.toUpperCase()}
              </span>
              {' • '}
              {stream.viewerCount.toLocaleString()} viewers
            </div>
          </div>
        )}

        {/* Control buttons */}
        {isHovered && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'flex',
            gap: '4px',
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen(stream.id);
              }}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Toggle fullscreen"
            >
              {isFullscreen ? '⊟' : '⊞'}
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStreamRemove?.(stream.id);
              }}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(255, 0, 0, 0.6)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Remove stream"
            >
              ×
            </button>
          </div>
        )}
      </div>
    );
  };

  // Main grid styles
  const gridStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    width: '100%',
    height: '100%',
    gap: '4px',
    padding: '4px',
    backgroundColor: '#111',
    borderRadius: '8px',
    position: 'relative',
  };

  return (
    <div className={className}>
      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div ref={gridRef} style={gridStyle}>
        {streams.map((stream, index) => (
          <StreamItem key={stream.id} stream={stream} index={index} />
        ))}
        
        {/* Empty slots */}
        {streams.length < maxStreams && (
          <div style={{
            flex: 1,
            minHeight: '180px',
            border: '2px dashed #333',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '14px',
            cursor: 'pointer',
          }}>
            + Add Stream
          </div>
        )}
      </div>
      
      {/* Fullscreen controls */}
      {fullscreenStream && (
        <div style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 1001,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: '#fff',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          Press ESC to exit fullscreen
        </div>
      )}
      
      {/* Keyboard shortcuts help */}
      {webSettings.keyboardShortcuts && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          opacity: 0.7,
        }}>
          Ctrl+F: Fullscreen • Ctrl+1-9: Select stream
        </div>
      )}
    </div>
  );
};

export default ResponsiveMultiStreamGrid;