import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';

interface ImageCardVisualProps {
  data?: string; // Base64 or URI
  caption?: string;
  isSelected?: boolean;
  style?: ViewStyle;
}

/**
 * Pure visual component for rendering an image on the canvas.
 * Does NOT handle positioning or dragging - use inside DraggableCanvasItem.
 */
export const ImageCardVisual: React.FC<ImageCardVisualProps> = ({
  data,
  caption,
  isSelected = false,
  style,
}) => {
  const hasImage = data && data.length > 0;

  return (
    <View style={[styles.container, isSelected && styles.selected, style]}>
      {hasImage ? (
        <Image
          source={{ uri: data }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>🖼️</Text>
          <Text style={styles.placeholderText}>No image</Text>
        </View>
      )}

      {/* Caption */}
      {caption && (
        <View style={styles.captionContainer}>
          <Text style={styles.caption} numberOfLines={2}>
            {caption}
          </Text>
        </View>
      )}

      {/* Resize handle indicator */}
      <View style={styles.resizeHandle}>
        <Text style={styles.resizeIcon}>⤡</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 150,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  selected: {
    borderColor: '#8b5cf6',
    borderWidth: 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
  },
  placeholderIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  placeholderText: {
    color: '#6b7280',
    fontSize: 12,
  },
  captionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  caption: {
    color: '#fff',
    fontSize: 12,
  },
  resizeHandle: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 4,
  },
  resizeIcon: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default ImageCardVisual;
