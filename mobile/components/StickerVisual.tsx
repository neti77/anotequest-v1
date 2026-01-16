import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

// Sticker type to emoji/icon mapping
const STICKER_ICONS: Record<string, string> = {
  'arrow-right': '→',
  'arrow-down': '↓',
  'arrow-left': '←',
  'arrow-up': '↑',
  'circle': '○',
  'circle-filled': '●',
  'square': '□',
  'square-filled': '■',
  'star': '☆',
  'star-filled': '★',
  'heart': '♡',
  'heart-filled': '♥',
  'check': '✓',
  'cross': '✕',
  'plus': '+',
  'minus': '-',
  'question': '?',
  'exclamation': '!',
  'lightning': '⚡',
  'fire': '🔥',
  'sparkle': '✨',
  'thumbs-up': '👍',
  'thumbs-down': '👎',
  'flag': '🚩',
  'pin': '📌',
  'bulb': '💡',
};

interface StickerVisualProps {
  type: string;
  color?: string;
  size?: number;
  isSelected?: boolean;
  style?: ViewStyle;
}

/**
 * Pure visual component for rendering a sticker.
 * Does NOT handle positioning, dragging, or rotation - use inside DraggableCanvasItem.
 */
export const StickerVisual: React.FC<StickerVisualProps> = ({
  type,
  color = '#3b82f6',
  size = 48,
  isSelected = false,
  style,
}) => {
  const icon = STICKER_ICONS[type] || type || '⭐';

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 4,
        },
        isSelected && styles.selected,
        style,
      ]}
    >
      <Text
        style={[
          styles.icon,
          {
            fontSize: size * 0.6,
            color: color,
          },
        ]}
      >
        {icon}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  selected: {
    borderColor: '#8b5cf6',
    borderWidth: 2,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  icon: {
    textAlign: 'center',
  },
});

export default StickerVisual;
