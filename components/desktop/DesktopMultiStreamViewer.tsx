import React, { useState, useEffect, useRef } from 'react';
import { UnifiedStream } from '@/services/platformService';
import { useCrossPlatformStore } from '@/store/useCrossPlatformStore';

interface DesktopMultiStreamViewerProps {
  streams: UnifiedStream[];
  onStreamSelect?: (stream: UnifiedStream) => void;
  onStreamRemove?: (streamId: string) => void;
  className?: string;
}

const DesktopMultiStreamViewer: React.FC<DesktopMultiStreamViewerProps> = ({
  streams,
  onStreamSelect,
  onStreamRemove,
  className = '',
}) => {
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Cross-platform store
  const { desktopSettings, updateDesktopSettings } = useCrossPlatformStore();

  // Initialize desktop features
  useEffect(() => {
    initializeDesktopFeatures();
  }, []);

  const initializeDesktopFeatures = async () => {
    if (typeof window !== 'undefined' && (window as any).electron) {
      const electron = (window as any).electron;

      try {
        // Get system info
        const info = await electron.system.getInfo();
        setSystemInfo(info);

        // Set up IPC listeners
        electron.ipcRenderer.on('navigate-to-settings', () => {
          // Navigate to settings - this would be handled by the router
          console.log('Navigate to settings requested');
        });

        electron.ipcRenderer.on('create-new-layout', () => {
          // Create new layout
          console.log('Create new layout requested');
        });

        electron.ipcRenderer.on('save-current-layout', () => {
          // Save current layout
          console.log('Save current layout requested');
        });

        electron.ipcRenderer.on('update-available', info => {
          addNotification(`Update available: ${info.version}`);
        });

        electron.ipcRenderer.on('download-progress', progress => {
          addNotification(`Download progress: ${Math.round(progress.percent)}%`);
        });

        electron.ipcRenderer.on('update-downloaded', info => {
          addNotification(`Update downloaded: ${info.version}. Restart to apply.`);
        });

        // Set up system tray if enabled
        if (desktopSettings.systemTrayEnabled) {
          electron.systemTray.setup();
        }

        // Set up auto-start if enabled
        if (desktopSettings.autoStart) {
          electron.autoStart.setup();
        }

        console.log('Desktop features initialized');
      } catch (error) {
        console.error('Error initializing desktop features:', error);
      }
    }
  };

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== message));
    }, 5000);

    // Show native notification if enabled
    if (desktopSettings.nativeNotifications && (window as any).electron) {
      (window as any).electron.notification.show({
        title: 'Streamyyy',
        body: message,
        icon: '/assets/icon.png',
      });
    }
  };

  const toggleAlwaysOnTop = async () => {
    if (typeof window !== 'undefined' && (window as any).electron) {
      const newValue = !isAlwaysOnTop;
      setIsAlwaysOnTop(newValue);

      try {
        await (window as any).electron.window.setAlwaysOnTop(newValue);
        updateDesktopSettings({ alwaysOnTop: newValue });
        addNotification(`Always on top ${newValue ? 'enabled' : 'disabled'}`);
      } catch (error) {
        console.error('Error toggling always on top:', error);
      }
    }
  };

  const minimizeToTray = () => {
    if (typeof window !== 'undefined' && (window as any).electron) {
      (window as any).electron.window.minimizeToTray();
    }
  };

  const toggleAutoStart = async () => {
    if (typeof window !== 'undefined' && (window as any).electron) {
      const newValue = !desktopSettings.autoStart;

      try {
        (window as any).electron.autoStart.toggle();
        updateDesktopSettings({ autoStart: newValue });
        addNotification(`Auto-start ${newValue ? 'enabled' : 'disabled'}`);
      } catch (error) {
        console.error('Error toggling auto-start:', error);
      }
    }
  };

  const toggleSystemTray = () => {
    const newValue = !desktopSettings.systemTrayEnabled;
    updateDesktopSettings({ systemTrayEnabled: newValue });

    if (newValue && (window as any).electron) {
      (window as any).electron.systemTray.setup();
    }

    addNotification(`System tray ${newValue ? 'enabled' : 'disabled'}`);
  };

  const toggleHardwareAcceleration = () => {
    const newValue = !desktopSettings.hardwareAcceleration;
    updateDesktopSettings({ hardwareAcceleration: newValue });
    addNotification(
      `Hardware acceleration ${newValue ? 'enabled' : 'disabled'}. Restart required.`
    );
  };

  const toggleNativeNotifications = () => {
    const newValue = !desktopSettings.nativeNotifications;
    updateDesktopSettings({ nativeNotifications: newValue });
    addNotification(`Native notifications ${newValue ? 'enabled' : 'disabled'}`);
  };

  // Stream component optimized for desktop
  const DesktopStreamItem: React.FC<{ stream: UnifiedStream; index: number }> = ({
    stream,
    index,
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isPiP, setIsPiP] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const isSelected = selectedStream === stream.id;
    const gridColumns = Math.ceil(Math.sqrt(streams.length));
    const itemWidth = `${100 / gridColumns}%`;

    const handleStreamSelect = () => {
      setSelectedStream(stream.id);
      onStreamSelect?.(stream);
    };

    const handleStreamRemove = () => {
      onStreamRemove?.(stream.id);
      if (selectedStream === stream.id) {
        setSelectedStream(null);
      }
    };

    const togglePictureInPicture = async () => {
      if (iframeRef.current) {
        try {
          if (isPiP) {
            await (document as any).exitPictureInPicture();
          } else {
            await (iframeRef.current as any).requestPictureInPicture();
          }
          setIsPiP(!isPiP);
        } catch (error) {
          console.error('Picture-in-picture error:', error);
        }
      }
    };

    const itemStyle: React.CSSProperties = {
      width: itemWidth,
      height: '300px',
      border: isSelected ? '2px solid #007bff' : '1px solid #333',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#000',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      transform: isHovered ? 'scale(1.02)' : 'scale(1)',
      boxShadow: isSelected ? '0 0 20px rgba(0, 123, 255, 0.3)' : 'none',
      position: 'relative',
    };

    return (
      <div
        style={itemStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleStreamSelect}
        onDoubleClick={togglePictureInPicture}
      >
        {/* Stream iframe */}
        <iframe
          ref={iframeRef}
          src={stream.embedUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: hasError ? 'none' : 'block',
          }}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          onLoad={() => {
            setIsLoading(false);
            setHasError(false);
          }}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div
            style={{
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
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid #333',
                  borderTop: '3px solid #007bff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              Loading stream...
            </div>
          </div>
        )}

        {/* Error overlay */}
        {hasError && (
          <div
            style={{
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
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '24px' }}>⚠️</div>
            <div>Stream unavailable</div>
            <button
              onClick={e => {
                e.stopPropagation();
                setHasError(false);
                setIsLoading(true);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
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

        {/* Desktop-specific controls */}
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              display: 'flex',
              gap: '4px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: '4px',
              borderRadius: '4px',
            }}
          >
            <button
              onClick={e => {
                e.stopPropagation();
                togglePictureInPicture();
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Picture-in-picture"
            >
              📺
            </button>

            <button
              onClick={e => {
                e.stopPropagation();
                handleStreamRemove();
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'rgba(255, 0, 0, 0.6)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '16px',
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

        {/* Stream info */}
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
              color: '#fff',
              padding: '12px',
              fontSize: '12px',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {stream.streamerDisplayName}
            </div>
            <div style={{ opacity: 0.8, marginBottom: '4px' }}>
              {stream.title.length > 60 ? `${stream.title.substring(0, 60)  }...` : stream.title}
            </div>
            <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
              <span
                style={{
                  color:
                    stream.platform === 'twitch'
                      ? '#9146FF'
                  stream.platform === 'youtube' ? '#FF0000' : '#53FC18'
                }}
              >
                {stream.platform.toUpperCase()}
              </span>
              <span>{stream.viewerCount.toLocaleString()} viewers</span>
            </div>
          </div>
        )}

        {/* Selection indicator */}
        {isSelected && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              backgroundColor: '#007bff',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
            }}
          >
            SELECTED
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Add spin animation */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>

      {/* Desktop toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          backgroundColor: '#1a1a1a',
          borderBottom: '1px solid #333',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
            Desktop Multi-Stream Viewer
          </span>
          {systemInfo && (
            <span style={{ color: '#666', fontSize: '12px' }}>
              {systemInfo.platform} • Electron {systemInfo.electronVersion}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleAlwaysOnTop}
            style={{
              padding: '4px 8px',
              backgroundColor: isAlwaysOnTop ? '#007bff' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title="Toggle always on top"
          >
            📌
          </button>

          <button
            onClick={minimizeToTray}
            style={{
              padding: '4px 8px',
              backgroundColor: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            title="Minimize to tray"
          >
            ⬇️
          </button>
        </div>
      </div>

      {/* Desktop settings panel */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px',
          backgroundColor: '#222',
          borderBottom: '1px solid #333',
          gap: '12px',
          fontSize: '12px',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', color: '#ccc' }}>
          <input
            type="checkbox"
            checked={desktopSettings.systemTrayEnabled}
            onChange={toggleSystemTray}
            style={{ marginRight: '4px' }}
          />
          System Tray
        </label>

        <label style={{ display: 'flex', alignItems: 'center', color: '#ccc' }}>
          <input
            type="checkbox"
            checked={desktopSettings.autoStart}
            onChange={toggleAutoStart}
            style={{ marginRight: '4px' }}
          />
          Auto Start
        </label>

        <label style={{ display: 'flex', alignItems: 'center', color: '#ccc' }}>
          <input
            type="checkbox"
            checked={desktopSettings.hardwareAcceleration}
            onChange={toggleHardwareAcceleration}
            style={{ marginRight: '4px' }}
          />
          Hardware Acceleration
        </label>

        <label style={{ display: 'flex', alignItems: 'center', color: '#ccc' }}>
          <input
            type="checkbox"
            checked={desktopSettings.nativeNotifications}
            onChange={toggleNativeNotifications}
            style={{ marginRight: '4px' }}
          />
          Native Notifications
        </label>
      </div>

      {/* Stream viewer */}
      <div
        ref={viewerRef}
        style={{
          flex: 1,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '8px',
          backgroundColor: '#111',
          overflow: 'auto',
        }}
      >
        {streams.map((stream, index) => (
          <DesktopStreamItem key={stream.id} stream={stream} index={index} />
        ))}

        {/* Empty state */}
        {streams.length === 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              color: '#666',
              fontSize: '16px',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '48px' }}>📺</div>
            <div>No streams added yet</div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
              Add streams to start multi-streaming
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {notifications.map((notification, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                color: '#fff',
                padding: '12px 16px',
                borderRadius: '4px',
                fontSize: '14px',
                maxWidth: '300px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              }}
            >
              {notification}
            </div>
          ))}
        </div>
      )}

      {/* Desktop shortcuts help */}
      <div
        style={{
          padding: '8px 16px',
          backgroundColor: '#1a1a1a',
          borderTop: '1px solid #333',
          fontSize: '11px',
          color: '#666',
        }}
      >
        Desktop shortcuts: Ctrl+Shift+S Show/Hide • Ctrl+Shift+F Fullscreen • Double-click for PiP
      </div>
    </div>
  );
};

export default DesktopMultiStreamViewer;
