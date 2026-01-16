import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { X, ExternalLink, Link2, Play, Image as ImageIcon, WifiOff } from 'lucide-react-native';
import NetInfo from '@react-native-community/netinfo';

// Extract YouTube video ID from various YouTube URL formats
const getYouTubeVideoId = (url: string | undefined): string | null => {
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

interface VideoInfo {
  type: 'youtube' | 'vimeo';
  id: string;
  thumbnail: string | null;
}

// Check if URL is from a video platform
const getVideoInfo = (url: string | null): VideoInfo | null => {
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

interface Source {
  id: string;
  url: string;
  title?: string;
  description?: string;
  previewImage?: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
}

interface SourceItemProps {
  source: Source;
  updateSource: (id: string, updates: Partial<Source>) => void;
  deleteSource: (id: string) => void;
  zoom?: number;
  shouldDeleteOnDrop?: (x: number, y: number) => boolean;
  isSelected?: boolean;
  onMultiDrag?: (deltaX: number, deltaY: number) => void;
  selectedCount?: number;
}

export const SourceItem = React.memo(function SourceItem({
  source,
  updateSource,
  deleteSource,
  zoom = 1,
  shouldDeleteOnDrop,
  isSelected,
  onMultiDrag,
  selectedCount = 0,
}: SourceItemProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(source.previewImage || null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Animated values for dragging
  const translateX = useSharedValue(source.position?.x || 0);
  const translateY = useSharedValue(source.position?.y || 0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const lastDragX = useSharedValue(0);
  const lastDragY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Sync position when source.position changes externally
  useEffect(() => {
    if (!isDragging.value) {
      translateX.value = source.position?.x || 0;
      translateY.value = source.position?.y || 0;
    }
  }, [source.position?.x, source.position?.y]);

  // Track online/offline status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    // Check initial state
    NetInfo.fetch().then((state) => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
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
    Linking.openURL(getHref);
  };

  const handleDelete = () => {
    deleteSource(source.id);
  };

  const handleDragEnd = (x: number, y: number) => {
    if (shouldDeleteOnDrop && shouldDeleteOnDrop(x, y)) {
      deleteSource(source.id);
    } else {
      updateSource(source.id, {
        position: { x, y },
      });
    }
  };

  const handleMultiDrag = (deltaX: number, deltaY: number) => {
    if (onMultiDrag) {
      onMultiDrag(deltaX, deltaY);
    }
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      startX.value = translateX.value;
      startY.value = translateY.value;
      lastDragX.value = translateX.value;
      lastDragY.value = translateY.value;
    })
    .onUpdate((event) => {
      const newX = startX.value + event.translationX / zoom;
      const newY = startY.value + event.translationY / zoom;
      translateX.value = newX;
      translateY.value = newY;

      if (isSelected && selectedCount > 1) {
        const deltaX = newX - lastDragX.value;
        const deltaY = newY - lastDragY.value;
        runOnJS(handleMultiDrag)(deltaX, deltaY);
      }

      lastDragX.value = newX;
      lastDragY.value = newY;
    })
    .onEnd(() => {
      isDragging.value = false;
      runOnJS(handleDragEnd)(translateX.value, translateY.value);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const width = source.size?.width || 260;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.container,
          animatedStyle,
          { width },
          isSelected && styles.selected,
        ]}
      >
        <View style={styles.card}>
          {/* Preview Image or Offline/Loading State */}
          {(previewImage || previewLoading || (isOffline && !source.previewImage && !previewError)) && (
            <View style={styles.previewContainer}>
              {isOffline && !previewImage && !previewLoading ? (
                <View style={styles.offlineContainer}>
                  <WifiOff size={20} color="#9ca3af" />
                  <Text style={styles.offlineText}>Go online to load preview</Text>
                </View>
              ) : previewLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#9ca3af" />
                  <Text style={styles.loadingText}>Loading preview...</Text>
                </View>
              ) : previewImage ? (
                <Pressable onPress={handleOpen} style={styles.previewImageButton}>
                  <Image
                    source={{ uri: previewImage }}
                    style={styles.previewImage}
                    resizeMode="cover"
                    onError={() => {
                      setPreviewImage(null);
                      setPreviewError(true);
                    }}
                  />
                  {/* Play button overlay for videos */}
                  {videoInfo && (
                    <View style={styles.playOverlay}>
                      <View style={styles.playButton}>
                        <Play size={20} color="#fff" fill="#fff" />
                      </View>
                    </View>
                  )}
                </Pressable>
              ) : null}
            </View>
          )}

          {/* Header / handle */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Link2 size={12} color="#9ca3af" />
              <Text style={styles.headerText}>
                {videoInfo ? 'Video' : 'Source'}
              </Text>
            </View>
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.deleteButtonPressed,
              ]}
              hitSlop={8}
            >
              <X size={12} color="#9ca3af" />
            </Pressable>
          </View>

          {/* Body / preview */}
          <Pressable
            onPress={handleOpen}
            style={({ pressed }) => [
              styles.body,
              pressed && styles.bodyPressed,
            ]}
          >
            <View style={styles.bodyContent}>
              {domain && (
                <Text style={styles.domain}>{domain.toUpperCase()}</Text>
              )}

              <View style={styles.bodyRow}>
                {/* Only show icon if no preview image */}
                {!previewImage && !previewLoading && (
                  <View style={styles.iconContainer}>
                    {videoInfo ? (
                      <Play size={12} color="#3b82f6" />
                    ) : (
                      <ExternalLink size={12} color="#3b82f6" />
                    )}
                  </View>
                )}
                <View style={styles.textContainer}>
                  <Text style={styles.title} numberOfLines={2}>
                    {source.title || source.url}
                  </Text>
                  {!previewImage && (
                    <Text style={styles.url} numberOfLines={1}>
                      {source.url}
                    </Text>
                  )}
                  {source.description && (
                    <Text style={styles.description} numberOfLines={2}>
                      {source.description}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </Pressable>
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 12,
  },
  selected: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  offlineText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  loadingText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  previewImageButton: {
    width: '100%',
    height: '100%',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
  },
  deleteButton: {
    padding: 4,
    borderRadius: 4,
  },
  deleteButtonPressed: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  body: {
    width: '100%',
  },
  bodyPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  bodyContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  domain: {
    fontSize: 11,
    letterSpacing: 1,
    color: 'rgba(156, 163, 175, 0.8)',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  iconContainer: {
    marginTop: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  url: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  description: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
});

SourceItem.displayName = 'SourceItem';
export default SourceItem;
