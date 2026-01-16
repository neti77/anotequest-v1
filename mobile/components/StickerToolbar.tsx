import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {
  ArrowRight,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Circle,
  Square,
  Star,
  Heart,
  Move,
} from 'lucide-react-native';

interface StickerType {
  type: string;
  icon: React.ComponentType<any>;
  label: string;
}

const STICKER_TYPES: StickerType[] = [
  { type: 'arrow-right', icon: ArrowRight, label: 'Arrow Right' },
  { type: 'arrow-down', icon: ArrowDown, label: 'Arrow Down' },
  { type: 'arrow-left', icon: ArrowLeft, label: 'Arrow Left' },
  { type: 'arrow-up', icon: ArrowUp, label: 'Arrow Up' },
  { type: 'circle', icon: Circle, label: 'Circle' },
  { type: 'square', icon: Square, label: 'Square' },
  { type: 'star', icon: Star, label: 'Star' },
  { type: 'heart', icon: Heart, label: 'Heart' },
];

interface StickerColor {
  color: string;
  name: string;
}

const STICKER_COLORS: StickerColor[] = [
  { color: '#3b82f6', name: 'Blue' },
  { color: '#ef4444', name: 'Red' },
  { color: '#22c55e', name: 'Green' },
  { color: '#eab308', name: 'Yellow' },
  { color: '#8b5cf6', name: 'Purple' },
  { color: '#f97316', name: 'Orange' },
];

interface StickerToolbarProps {
  selectedTool: string | null;
  setSelectedTool: (tool: string | null) => void;
  stickerColor: string;
  setStickerColor: (color: string) => void;
}

export const StickerToolbar = ({
  selectedTool,
  setSelectedTool,
  stickerColor,
  setStickerColor,
}: StickerToolbarProps) => {
  // Animated values for dragging
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.card}>
        {/* Drag Handle */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={styles.dragHandle}>
            <Move size={16} color="#9ca3af" />
            <Text style={styles.title}>Stickers</Text>
          </Animated.View>
        </GestureDetector>

        {/* Sticker Types */}
        <View style={styles.stickerTypesRow}>
          {STICKER_TYPES.map(({ type, icon: Icon, label }) => (
            <Pressable
              key={type}
              onPress={() =>
                setSelectedTool(selectedTool === type ? null : type)
              }
              style={({ pressed }) => [
                styles.stickerButton,
                selectedTool === type && styles.stickerButtonSelected,
                pressed && styles.stickerButtonPressed,
              ]}
              accessibilityLabel={label}
            >
              <Icon
                size={16}
                color={selectedTool === type ? '#fff' : '#374151'}
              />
            </Pressable>
          ))}
        </View>

        {/* Color Picker */}
        <View style={styles.colorSection}>
          <Text style={styles.colorLabel}>Color</Text>
          <View style={styles.colorRow}>
            {STICKER_COLORS.map(({ color, name }) => (
              <Pressable
                key={color}
                onPress={() => setStickerColor(color)}
                style={({ pressed }) => [
                  styles.colorButton,
                  { backgroundColor: color },
                  stickerColor === color && styles.colorButtonSelected,
                  pressed && styles.colorButtonPressed,
                ]}
                accessibilityLabel={name}
              />
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    zIndex: 50,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  dragHandle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  stickerTypesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stickerButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  stickerButtonSelected: {
    backgroundColor: '#3b82f6',
  },
  stickerButtonPressed: {
    opacity: 0.7,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  colorSection: {},
  colorLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  colorButtonSelected: {
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  colorButtonPressed: {
    transform: [{ scale: 1.1 }],
  },
});

export default StickerToolbar;

