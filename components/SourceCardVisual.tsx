import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, Linking } from 'react-native';
import { ExternalLink, Globe, AlertCircle } from 'lucide-react-native';

interface SourceCardVisualProps {
  url: string;
  title?: string;
  favicon?: string;
  previewImage?: string;
  isOffline?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * Pure visual component for rendering a source/link card on the canvas.
 * Does NOT handle positioning or dragging - use inside DraggableCanvasItem.
 */
export const SourceCardVisual: React.FC<SourceCardVisualProps> = ({
  url,
  title,
  favicon,
  previewImage,
  isOffline = false,
  isSelected = false,
  onPress,
  style,
}) => {
  // Extract domain from URL
  const getDomain = (urlString: string): string => {
    try {
      const domain = new URL(urlString).hostname;
      return domain.replace('www.', '');
    } catch {
      return urlString;
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (!isOffline) {
      Linking.openURL(url).catch(() => {});
    }
  };

  const domain = getDomain(url);
  const displayTitle = title || domain;

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.container,
        isSelected && styles.selected,
        isOffline && styles.offline,
        style,
      ]}
    >
      {/* Icon */}
      <View style={styles.iconContainer}>
        {isOffline ? (
          <AlertCircle size={20} color="#f59e0b" />
        ) : (
          <Globe size={20} color="#3b82f6" />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {displayTitle}
        </Text>
        <Text style={styles.url} numberOfLines={1}>
          {domain}
        </Text>
      </View>

      {/* External link indicator */}
      <View style={styles.linkIcon}>
        <ExternalLink size={14} color="#9ca3af" />
      </View>

      {/* Offline indicator */}
      {isOffline && (
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineText}>Offline</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 220,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#bfdbfe',
    gap: 10,
  },
  selected: {
    borderColor: '#8b5cf6',
    borderWidth: 3,
  },
  offline: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  url: {
    color: '#60a5fa',
    fontSize: 11,
  },
  linkIcon: {
    padding: 4,
  },
  offlineBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  offlineText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});

export default SourceCardVisual;
