import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UnifiedStream, platformService } from '@/services/platformService';
import { useCrossPlatformStore } from '@/store/useCrossPlatformStore';
import { platformDetection } from '@/utils/crossPlatformStorage';

interface WebStreamBrowserProps {
  onStreamSelect?: (stream: UnifiedStream) => void;
  onStreamAdd?: (stream: UnifiedStream) => void;
  className?: string;
}

const WebStreamBrowser: React.FC<WebStreamBrowserProps> = ({
  onStreamSelect,
  onStreamAdd,
  className = '',
}) => {
  const [streams, setStreams] = useState<UnifiedStream[]>([]);
  const [filteredStreams, setFilteredStreams] = useState<UnifiedStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['twitch', 'youtube', 'kick']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'viewers' | 'title' | 'platform'>('viewers');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  
  // Cross-platform store
  const { webSettings, addStream, activeStreams } = useCrossPlatformStore();

  // Load streams on mount
  useEffect(() => {
    loadStreams();
  }, []);

  // Filter streams when search/filters change
  useEffect(() => {
    filterStreams();
  }, [streams, searchQuery, selectedPlatforms, selectedCategories, sortBy]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMoreStreams();
        }
      },
      { rootMargin: '100px' }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!webSettings.keyboardShortcuts) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case '/':
          event.preventDefault();
          searchInputRef.current?.focus();
          break;
        case 'r':
        case 'R':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            refreshStreams();
          }
          break;
        case 'g':
        case 'G':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setView(view === 'grid' ? 'list' : 'grid');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [webSettings.keyboardShortcuts, view]);

  const loadStreams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const newStreams = await platformService.getAllLiveStreams(50);
      setStreams(newStreams);
      setPage(1);
      setHasMore(newStreams.length === 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load streams');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreStreams = async () => {
    try {
      setLoading(true);
      
      // Simulate pagination (in real app, this would be actual API pagination)
      const newStreams = await platformService.getAllLiveStreams(20);
      setStreams(prev => [...prev, ...newStreams]);
      setPage(prev => prev + 1);
      setHasMore(newStreams.length === 20);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more streams');
    } finally {
      setLoading(false);
    }
  };

  const refreshStreams = async () => {
    await loadStreams();
  };

  const filterStreams = () => {
    let filtered = [...streams];

    // Platform filter
    if (selectedPlatforms.length > 0) {
      filtered = filtered.filter(stream => selectedPlatforms.includes(stream.platform));
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(stream => 
        selectedCategories.some(cat => 
          stream.category.toLowerCase().includes(cat.toLowerCase())
        )
      );
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(stream =>
        stream.title.toLowerCase().includes(query) ||
        stream.streamerDisplayName.toLowerCase().includes(query) ||
        stream.category.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'viewers':
          return b.viewerCount - a.viewerCount;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'platform':
          return a.platform.localeCompare(b.platform);
        default:
          return 0;
      }
    });

    setFilteredStreams(filtered);
  };

  const handleStreamClick = (stream: UnifiedStream) => {
    onStreamSelect?.(stream);
  };

  const handleStreamAdd = (stream: UnifiedStream) => {
    if (activeStreams.some(s => s.id === stream.id)) {
      return; // Already added
    }
    
    addStream(stream);
    onStreamAdd?.(stream);
  };

  const isStreamActive = useCallback((stream: UnifiedStream) => {
    return activeStreams.some(s => s.id === stream.id);
  }, [activeStreams]);

  // Get unique categories for filter
  const categories = [...new Set(streams.map(s => s.category))].filter(Boolean);

  const StreamCard: React.FC<{ stream: UnifiedStream }> = ({ stream }) => {
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    const cardStyle: React.CSSProperties = {
      backgroundColor: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: '8px',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative',
    };

    const hoverStyle: React.CSSProperties = {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      borderColor: stream.platform === 'twitch' ? '#9146FF' : 
                  stream.platform === 'youtube' ? '#FF0000' : '#53FC18',
    };

    return (
      <div
        style={cardStyle}
        onMouseEnter={(e) => Object.assign(e.currentTarget.style, hoverStyle)}
        onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardStyle)}
        onClick={() => handleStreamClick(stream)}
      >
        {/* Thumbnail */}
        <div style={{ position: 'relative', paddingBottom: '56.25%', backgroundColor: '#000' }}>
          {!imageError && (
            <img
              src={stream.thumbnailUrl}
              alt={stream.title}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: imageLoading ? 'none' : 'block',
              }}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
          )}
          
          {(imageLoading || imageError) && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#333',
              color: '#666',
              fontSize: '14px',
            }}>
              {imageLoading ? 'Loading...' : '📺'}
            </div>
          )}

          {/* Live indicator */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            backgroundColor: '#ff0000',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
          }}>
            LIVE
          </div>

          {/* Viewer count */}
          <div style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
          }}>
            {stream.viewerCount.toLocaleString()} viewers
          </div>

          {/* Platform badge */}
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: stream.platform === 'twitch' ? '#9146FF' : 
                            stream.platform === 'youtube' ? '#FF0000' : '#53FC18',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
          }}>
            {stream.platform.toUpperCase()}
          </div>
        </div>

        {/* Stream info */}
        <div style={{ padding: '12px' }}>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#fff',
            lineHeight: '1.2',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {stream.title}
          </h3>

          <div style={{
            fontSize: '12px',
            color: '#ccc',
            marginBottom: '4px',
          }}>
            {stream.streamerDisplayName}
          </div>

          <div style={{
            fontSize: '11px',
            color: '#999',
          }}>
            {stream.category}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: '8px',
          opacity: 0,
          transition: 'opacity 0.2s ease',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '8px',
          borderRadius: '4px',
        }}
        className="stream-actions"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStreamAdd(stream);
            }}
            disabled={isStreamActive(stream)}
            style={{
              padding: '6px 12px',
              backgroundColor: isStreamActive(stream) ? '#666' : '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: isStreamActive(stream) ? 'not-allowed' : 'pointer',
              fontSize: '12px',
            }}
          >
            {isStreamActive(stream) ? 'Added' : 'Add'}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(stream.embedUrl, '_blank');
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#666',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            View
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style jsx>{`
        .stream-card:hover .stream-actions {
          opacity: 1;
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '16px',
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {/* Search bar */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search streams... (press / to focus)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: '#333',
              border: '1px solid #555',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '14px',
            }}
          />
          
          <button
            onClick={refreshStreams}
            disabled={loading}
            style={{
              padding: '8px 12px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {loading ? '⟳' : '↻'}
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Platform filter */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#ccc' }}>Platform:</span>
            {['twitch', 'youtube', 'kick'].map(platform => (
              <button
                key={platform}
                onClick={() => {
                  setSelectedPlatforms(prev => 
                    prev.includes(platform) 
                      ? prev.filter(p => p !== platform)
                      : [...prev, platform]
                  );
                }}
                style={{
                  padding: '4px 8px',
                  backgroundColor: selectedPlatforms.includes(platform) ? '#007bff' : '#333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                {platform}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#ccc' }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '4px 8px',
                backgroundColor: '#333',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '4px',
                fontSize: '11px',
              }}
            >
              <option value="viewers">Viewers</option>
              <option value="title">Title</option>
              <option value="platform">Platform</option>
            </select>
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#ccc' }}>View:</span>
            <button
              onClick={() => setView('grid')}
              style={{
                padding: '4px 8px',
                backgroundColor: view === 'grid' ? '#007bff' : '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Grid
            </button>
            <button
              onClick={() => setView('list')}
              style={{
                padding: '4px 8px',
                backgroundColor: view === 'list' ? '#007bff' : '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              List
            </button>
          </div>
        </div>

        {/* Results count */}
        <div style={{ fontSize: '12px', color: '#999' }}>
          {filteredStreams.length} streams found
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#ff4444',
            color: '#fff',
            borderRadius: '4px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {filteredStreams.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: view === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr',
            gap: '16px',
          }}>
            {filteredStreams.map(stream => (
              <div key={stream.id} className="stream-card">
                <StreamCard stream={stream} />
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div style={{
              textAlign: 'center',
              color: '#999',
              marginTop: '40px',
            }}>
              No streams found matching your criteria
            </div>
          )
        )}

        {/* Loading indicator */}
        <div ref={loadingRef} style={{ padding: '20px', textAlign: 'center' }}>
          {loading && (
            <div style={{ color: '#999' }}>
              Loading streams...
            </div>
          )}
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      {webSettings.keyboardShortcuts && (
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#1a1a1a',
          borderTop: '1px solid #333',
          fontSize: '11px',
          color: '#666',
        }}>
          Shortcuts: / Search • Ctrl+R Refresh • Ctrl+G Toggle view
        </div>
      )}
    </div>
  );
};

export default WebStreamBrowser;