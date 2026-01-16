import React, { useState, useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
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
  RotateCw,
  Trash2,
  Maximize2,
} from 'lucide-react-native';

const STICKER_ICONS: Record<string, React.ComponentType<any>> = {
  'arrow-right': ArrowRight,
  'arrow-down': ArrowDown,
  'arrow-left': ArrowLeft,
  'arrow-up': ArrowUp,
  circle: Circle,
  square: Square,
  star: Star,
  heart: Heart,
};

interface Sticker {
  id: string;
  type: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  color?: string;
  rotation?: number;
}

interface StickerItemProps {
  sticker: Sticker;
  updateSticker: (id: string, updates: Partial<Sticker>) => void;
  deleteSticker: (id: string) => void;
  zoom?: number;
  shouldDeleteOnDrop?: (x: number, y: number) => boolean;
  isSelected?: boolean;
  onMultiDrag?: (deltaX: number, deltaY: number) => void;
  selectedCount?: number;
}

export const StickerItem = React.memo(function StickerItem({
  sticker,
  updateSticker,
  deleteSticker,
  zoom = 1,
  shouldDeleteOnDrop,
  isSelected,
  onMultiDrag,
  selectedCount = 0,
}: StickerItemProps) {
  const Icon = STICKER_ICONS[sticker.type] || Circle;
  const [showControls, setShowControls] = useState(false);

  const size = sticker.size || { width: 48, height: 48 };
  const color = sticker.color || '#3b82f6';

  // Animated values for dragging
  const translateX = useSharedValue(sticker.position?.x || 0);
  const translateY = useSharedValue(sticker.position?.y || 0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const lastDragX = useSharedValue(0);
  const lastDragY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Animated values for resizing
  const currentWidth = useSharedValue(size.width);
  const currentHeight = useSharedValue(size.height);
  const startWidth = useSharedValue(size.width);
  const startHeight = useSharedValue(size.height);

  // Sync position when sticker.position changes externally
  useEffect(() => {
    if (!isDragging.value) {
      translateX.value = sticker.position?.x || 0;
      translateY.value = sticker.position?.y || 0;
    }
  }, [sticker.position?.x, sticker.position?.y]);

  // Sync size when sticker.size changes externally
  useEffect(() => {
    currentWidth.value = size.width;
    currentHeight.value = size.height;
  }, [size.width, size.height]);

  const handleRotate = () => {
    updateSticker(sticker.id, {
      rotation: ((sticker.rotation || 0) + 45) % 360,
    });
  };

  const handleDelete = () => {
    deleteSticker(sticker.id);
  };

  const handleDragEnd = (x: number, y: number) => {
    if (shouldDeleteOnDrop && shouldDeleteOnDrop(x, y)) {
      deleteSticker(sticker.id);
    } else {
      updateSticker(sticker.id, {
        position: { x, y },
      });
    }
  };

  const handleResizeEnd = (width: number, height: number) => {
    updateSticker(sticker.id, {
      size: { width, height },
    });
  };

  const handleMultiDrag = (deltaX: number, deltaY: number) => {
    if (onMultiDrag) {
      onMultiDrag(deltaX, deltaY);
    }
  };

  const toggleControls = () => {
    setShowControls((prev) => !prev);
  };

  // Pan gesture for dragging
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

  // Tap gesture to toggle controls
  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(toggleControls)();
  });

  // Pan gesture for resizing
  const resizeGesture = Gesture.Pan()
    .onStart(() => {
      startWidth.value = currentWidth.value;
      startHeight.value = currentHeight.value;
    })
    .onUpdate((event) => {
      const newWidth = Math.max(30, startWidth.value + event.translationX / zoom);
      const newHeight = Math.max(30, startHeight.value + event.translationY / zoom);
      currentWidth.value = newWidth;
      currentHeight.value = newHeight;
    })
    .onEnd(() => {
      runOnJS(handleResizeEnd)(currentWidth.value, currentHeight.value);
    });

  // Combine tap and pan for main sticker
  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const animatedSizeStyle = useAnimatedStyle(() => ({
    width: currentWidth.value,
    height: currentHeight.value,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          styles.container,
          animatedContainerStyle,
          animatedSizeStyle,
          isSelected && styles.selected,
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            { transform: [{ rotate: `${sticker.rotation || 0}deg` }] },
          ]}
        >
          <Icon
            size={Math.min(currentWidth.value, currentHeight.value) * 0.8}
            color={color}
            strokeWidth={2.5}
          />

          {/* Controls - shown on tap */}
          {showControls && (
            <View style={styles.controls}>
              <Pressable
                onPress={handleRotate}
                style={({ pressed }) => [
                  styles.controlButton,
                  styles.rotateButton,
                  pressed && styles.controlButtonPressed,
                ]}
                hitSlop={8}
              >
                <RotateCw size={12} color="#fff" />
              </Pressable>
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [
                  styles.controlButton,
                  styles.deleteButton,
                  pressed && styles.controlButtonPressed,
                ]}
                hitSlop={8}
              >
                <Trash2 size={12} color="#fff" />
              </Pressable>
            </View>
          )}

          {/* Resize handle */}
          {showControls && (
            <GestureDetector gesture={resizeGesture}>
              <Animated.View style={styles.resizeHandle}>
                <Maximize2 size={12} color="#94a3b8" />
              </Animated.View>
            </GestureDetector>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 20,
  },
  selected: {
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    position: 'absolute',
    top: -32,
    left: '50%',
    flexDirection: 'row',
    gap: 4,
    transform: [{ translateX: -28 }],
  },
  controlButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  controlButtonPressed: {
    opacity: 0.8,
  },
  rotateButton: {
    backgroundColor: '#64748b',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  resizeHandle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

StickerItem.displayName = 'StickerItem';
export default StickerItem;

