import React, { useMemo, useRef, useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { X, ExternalLink, Link2, Play, Image as ImageIcon, WifiOff } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';

// Extract YouTube video ID from various YouTube URL formats
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Check if URL is from a video platform
const getVideoInfo = (url) => {
  if (!url) return null;
  
  // YouTube
  const ytId = getYouTubeVideoId(url);
  if (ytId) {
    return {
      type: 'youtube',
      id: ytId,
      thumbnail: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`,
    };
  }
  
  // Vimeo (basic pattern)
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      type: 'vimeo',
      id: vimeoMatch[1],
      thumbnail: null, // Vimeo requires API call
    };
  }
  
  return null;
};

export const SourceItem = React.memo(function SourceItem({
  source,
  updateSource,
  deleteSource,
  zoom = 1,
  shouldDeleteOnDrop,
  isSelected,
  onMultiDrag,
  selectedCount = 0,
}) {
  const nodeRef = useRef(null);
  const lastDragPosRef = useRef({ x: 0, y: 0 });
  const [previewImage, setPreviewImage] = useState(source.previewImage || null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const domain = useMemo(() => {
    if (!source?.url) return '';
    const raw = source.url.trim();
    if (!raw) return '';

    let normalized = raw;
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }

    try {
      const urlObj = new URL(normalized);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return raw;
    }
  }, [source?.url]);

  const getHref = useMemo(() => {
    if (!source?.url) return null;
    let href = source.url.trim();
    if (!href) return null;
    if (!/^https?:\/\//i.test(href)) {
      href = `https://${href}`;
    }
    return href;
  }, [source?.url]);

  const videoInfo = useMemo(() => getVideoInfo(getHref), [getHref]);

  // Fetch preview for the link
  useEffect(() => {
    if (previewImage || previewLoading || !getHref) return;
    
    // Don't try to fetch if offline
    if (isOffline) return;
    
    // If it's a YouTube video, use the thumbnail directly
    if (videoInfo?.thumbnail) {
      setPreviewImage(videoInfo.thumbnail);
      // Save to source so we don't refetch
      updateSource(source.id, { previewImage: videoInfo.thumbnail });
      return;
    }

    // For other URLs, try to fetch Open Graph image using a free API
    const fetchPreview = async () => {
      setPreviewLoading(true);
      try {
        // Using jsonlink.io free tier (no API key needed for basic usage)
        const response = await fetch(
          `https://jsonlink.io/api/extract?url=${encodeURIComponent(getHref)}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.images && data.images.length > 0) {
            const img = data.images[0];
            setPreviewImage(img);
            updateSource(source.id, { 
              previewImage: img,
              title: source.title || data.title || source.url,
              description: source.description || data.description,
            });
          } else {
            setPreviewError(true);
          }
        } else {
          setPreviewError(true);
        }
      } catch {
        setPreviewError(true);
      } finally {
        setPreviewLoading(false);
      }
    };

    // Only fetch if we don't already have a preview saved
    if (!source.previewImage) {
      fetchPreview();
    }
  }, [getHref, videoInfo, previewImage, previewLoading, source.id, source.previewImage, source.title, source.description, updateSource, isOffline]);

  const handleOpen = () => {
    if (!getHref) return;
    window.open(getHref, '_blank', 'noopener,noreferrer');
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={source.position}
      scale={zoom}
      handle=".source-handle"
      onStart={(e, data) => {
        lastDragPosRef.current = { x: data.x, y: data.y };
      }}
      onDrag={(e, data) => {
        if (isSelected && selectedCount > 1 && onMultiDrag) {
          const deltaX = data.x - lastDragPosRef.current.x;
          const deltaY = data.y - lastDragPosRef.current.y;
          onMultiDrag(deltaX, deltaY);
        }
        lastDragPosRef.current = { x: data.x, y: data.y };
      }}
      onStop={(e, data) => {
        if (shouldDeleteOnDrop && shouldDeleteOnDrop(e)) {
          deleteSource(source.id);
        } else {
          updateSource(source.id, {
            position: { x: data.x, y: data.y },
          });
        }
      }}
    >
      <div
        ref={nodeRef}
        className={`absolute ${isSelected ? 'ring-2 ring-primary ring-offset-2 rounded-lg' : ''}`}
        style={{
          width: source.size?.width || 260,
          zIndex: 12,
        }}
      >
        <Card className="overflow-hidden shadow-lg bg-card/95 backdrop-blur-sm border border-border/80">
          {/* Preview Image or Offline/Loading State */}
          {(previewImage || previewLoading || (isOffline && !source.previewImage && !previewError)) && (
            <div className="relative w-full aspect-video bg-muted/50 overflow-hidden">
              {isOffline && !previewImage && !previewLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-1.5 text-muted-foreground/60">
                    <WifiOff className="h-5 w-5" />
                    <span className="text-[10px]">Go online to load preview</span>
                  </div>
                </div>
              ) : previewLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-pulse flex flex-col items-center gap-1">
                    <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground/50">Loading preview...</span>
                  </div>
                </div>
              ) : previewImage ? (
                <button
                  type="button"
                  className="w-full h-full"
                  onClick={handleOpen}
                >
                  <img
                    src={previewImage}
                    alt={source.title || 'Link preview'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    onError={() => {
                      setPreviewImage(null);
                      setPreviewError(true);
                    }}
                  />
                  {/* Play button overlay for videos */}
                  {videoInfo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                      <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                        <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                  )}
                </button>
              ) : null}
            </div>
          )}

          {/* Header / handle */}
          <div className="source-handle flex items-center justify-between px-3 py-1.5 bg-muted/60 border-b border-border cursor-move">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Link2 className="h-3 w-3" />
              {videoInfo ? 'Video' : 'Source'}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-destructive"
              onClick={() => deleteSource(source.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Body / preview */}
          <button
            type="button"
            className="w-full text-left hover:bg-muted/30 transition-colors"
            onClick={handleOpen}
          >
            <div className="px-3 py-2 space-y-1">
              {domain && (
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground/80">
                  {domain}
                </div>
              )}

              <div className="flex items-start gap-2">
                {/* Only show icon if no preview image */}
                {!previewImage && !previewLoading && (
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                    {videoInfo ? (
                      <Play className="h-3 w-3" />
                    ) : (
                      <ExternalLink className="h-3 w-3" />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium line-clamp-2">
                    {source.title || source.url}
                  </div>
                  {!previewImage && (
                    <div className="text-[11px] text-muted-foreground truncate">
                      {source.url}
                    </div>
                  )}
                  {source.description && (
                    <div className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                      {source.description}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </button>
        </Card>
      </div>
    </Draggable>
  );
});

SourceItem.displayName = 'SourceItem';
export default SourceItem;
