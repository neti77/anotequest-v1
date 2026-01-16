import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

// Note color mappings
const NOTE_COLORS: Record<string, { bg: string; border: string }> = {
  default: { bg: '#fef3c7', border: '#fde68a' },
  pink: { bg: '#fce7f3', border: '#fbcfe8' },
  lavender: { bg: '#ede9fe', border: '#ddd6fe' },
  mint: { bg: '#d1fae5', border: '#a7f3d0' },
  peach: { bg: '#ffedd5', border: '#fed7aa' },
  blue: { bg: '#dbeafe', border: '#bfdbfe' },
  gray: { bg: '#f3f4f6', border: '#e5e7eb' },
};

interface NoteCardVisualProps {
  title?: string;
  content?: string;
  color?: string;
  createdAt?: string;
  images?: { id: number; data: string }[];
  isSelected?: boolean;
  style?: ViewStyle;
}

/**
 * Pure visual component for rendering a note card.
 * Does NOT handle positioning or dragging - use inside DraggableCanvasItem.
 */
export const NoteCardVisual: React.FC<NoteCardVisualProps> = ({
  title,
  content,
  color = 'default',
  createdAt,
  images = [],
  isSelected = false,
  style,
}) => {
  const colorScheme = NOTE_COLORS[color] || NOTE_COLORS.default;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme.bg, borderColor: colorScheme.border },
        isSelected && styles.selected,
        style,
      ]}
    >
      {/* Title */}
      <Text style={styles.title} numberOfLines={1}>
        {title || 'Untitled'}
      </Text>

      {/* Content preview */}
      <Text style={styles.content} numberOfLines={4}>
        {content || 'Tap to edit...'}
      </Text>

      {/* Image indicator */}
      {images.length > 0 && (
        <View style={styles.imageIndicator}>
          <Text style={styles.imageIcon}>🖼️</Text>
          <Text style={styles.imageCount}>{images.length}</Text>
        </View>
      )}

      {/* Date */}
      {createdAt && (
        <Text style={styles.date}>
          {new Date(createdAt).toLocaleDateString()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 240,
    minHeight: 120,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
  },
  selected: {
    borderColor: '#8b5cf6',
    borderWidth: 3,
  },
  title: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  content: {
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  imageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  imageIcon: {
    fontSize: 14,
  },
  imageCount: {
    color: '#6b7280',
    fontSize: 12,
  },
  date: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 10,
  },
});

export default NoteCardVisual;
