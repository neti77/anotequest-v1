import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface NoteStickerVisualProps {
  color?: string;
  paths?: { d: string; color: string; strokeWidth: number }[];
  isSelected?: boolean;
  style?: ViewStyle;
}

// Default sticky note colors
const STICKY_COLORS: Record<string, { bg: string; shadow: string }> = {
  yellow: { bg: '#fef08a', shadow: '#eab308' },
  pink: { bg: '#fbcfe8', shadow: '#ec4899' },
  blue: { bg: '#bfdbfe', shadow: '#3b82f6' },
  green: { bg: '#bbf7d0', shadow: '#22c55e' },
  orange: { bg: '#fed7aa', shadow: '#f97316' },
  purple: { bg: '#ddd6fe', shadow: '#8b5cf6' },
};

/**
 * Pure visual component for rendering a sticky note (handwriting area).
 * Does NOT handle positioning or dragging - use inside DraggableCanvasItem.
 */
export const NoteStickerVisual: React.FC<NoteStickerVisualProps> = ({
  color = 'yellow',
  paths = [],
  isSelected = false,
  style,
}) => {
  const colorScheme = STICKY_COLORS[color] || STICKY_COLORS.yellow;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme.bg },
        isSelected && styles.selected,
        style,
      ]}
    >
      {/* Fold effect */}
      <View style={[styles.fold, { borderLeftColor: colorScheme.shadow }]} />

      {/* Drawing area with SVG paths */}
      <View style={styles.drawingArea}>
        <Svg style={StyleSheet.absoluteFill}>
          {paths.map((path, index) => (
            <Path
              key={index}
              d={path.d}
              stroke={path.color || '#374151'}
              strokeWidth={path.strokeWidth || 2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </Svg>
      </View>

      {/* Lines for visual guide */}
      <View style={styles.linesContainer}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.line} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 180,
    height: 160,
    borderRadius: 4,
    overflow: 'hidden',
    // Paper shadow effect
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  selected: {
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  fold: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderTopWidth: 20,
    borderLeftWidth: 20,
    borderTopColor: 'transparent',
    borderLeftColor: '#eab308',
    opacity: 0.5,
  },
  drawingArea: {
    flex: 1,
    margin: 8,
  },
  linesContainer: {
    position: 'absolute',
    top: 32,
    left: 12,
    right: 12,
    bottom: 12,
    gap: 24,
  },
  line: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export default NoteStickerVisual;
