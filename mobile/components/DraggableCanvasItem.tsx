import React, { useCallback, useRef, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ViewStyle, 
  Pressable,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useCanvasInteraction } from '../contexts/CanvasInteractionContext';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface DraggableCanvasItemProps {
  id: number;
  type: string;
  position: Position;
  size?: Size;
  rotation?: number;
  children: React.ReactNode;
  onPositionChange?: (id: number, position: Position) => void;
  onDragStart?: (id: number, type: string) => void;
  onDragEnd?: (id: number, type: string, position: Position) => void;
  onTap?: (id: number, type: string) => void;
  onLongPress?: (id: number, type: string) => void;
  onDragActiveChange?: (isDragging: boolean) => void;
  isSelected?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  dragTouchZone?: 'full' | 'edges'; // 'full' for images/stickers, 'edges' for notes/todos/tables
}

/**
 * DraggableCanvasItem - A wrapper component for draggable canvas items.
 * Uses React Native's PanResponder for gesture support.
 * Prevents canvas scrolling when dragging items.
 */
export const DraggableCanvasItem: React.FC<DraggableCanvasItemProps> = ({
  id,
  type,
  position,
  size,
  rotation = 0,
  children,
  onPositionChange,
  onDragStart,
  onDragEnd,
  onTap,
  onLongPress,
  onDragActiveChange,
  isSelected = false,
  disabled = false,
  style,
  dragTouchZone = 'edges',
}) => {
  const { setIsDraggingItem } = useCanvasInteraction();
  const [currentPosition, setCurrentPosition] = useState(position);
  const positionRef = useRef(position);
  
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  
  const isDragging = useRef(false);
  const startPosition = useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    if (!isDragging.current) {
      translateX.value = 0;
      translateY.value = 0;
      positionRef.current = position;
      setCurrentPosition(position);
    }
  }, [position.x, position.y]);

  const isTouchInDragZone = useCallback((x: number, y: number) => {
    if (dragTouchZone === 'full') return true;
    
    const edgeThreshold = 40;
    const sideThreshold = 20;
    const width = size?.width || 200;
    const height = size?.height || 150;
    
    if (y < edgeThreshold) return true;
    if (x < sideThreshold || x > width - sideThreshold) return true;
    
    return false;
  }, [size, dragTouchZone]);

  const handleDragStart = useCallback(() => {
    isDragging.current = true;
    setIsDraggingItem(true);
    onDragActiveChange?.(true);
    onDragStart?.(id, type);
  }, [id, type, onDragStart, onDragActiveChange, setIsDraggingItem]);

  const handleDragEnd = useCallback((finalX: number, finalY: number) => {
    const newX = Math.round(finalX / 10) * 10;
    const newY = Math.round(finalY / 10) * 10;
    const newPosition = { x: newX, y: newY };
    // Update position immediately
    positionRef.current = newPosition;
    setCurrentPosition(newPosition);
    // Notify parent
    onPositionChange?.(id, newPosition);
    onDragEnd?.(id, type, newPosition);
    // End drag state
    isDragging.current = false;
    setIsDraggingItem(false);
    onDragActiveChange?.(false);
    // Instantly reset translation
    translateX.value = 0;
    translateY.value = 0;
  }, [id, type, onPositionChange, onDragEnd, onDragActiveChange, setIsDraggingItem, translateX, translateY]);

  // ⚠️ Gesture arbitration is critical — item drag must block canvas pan.

const panGesture = Gesture.Pan()
  .enabled(!isDragging.current) // Ensure item drag blocks canvas pan
  .onStart((event) => {
    startPosition.current = { x: positionRef.current.x, y: positionRef.current.y };

    if (isTouchInDragZone(event.x, event.y)) {
      runOnJS(handleDragStart)();
    }
  })
  .onUpdate((event) => {
    if (isDragging.current) {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    }
  })
  .onEnd((event) => {
    if (isDragging.current) {
      const finalX = startPosition.current.x + event.translationX;
      const finalY = startPosition.current.y + event.translationY;
      runOnJS(handleDragEnd)(finalX, finalY);
    }
  })
  .onFinalize(() => {
    if (isDragging.current) {
      translateX.value = 0;
      translateY.value = 0;
      isDragging.current = false;
      runOnJS(setIsDraggingItem)(false);
      runOnJS(onDragActiveChange ?? (() => {}))(false);
    }
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation}deg` },
    ],
  }));

  const handlePress = useCallback(() => {
    if (!isDragging.current) {
      onTap?.(id, type);
    }
  }, [id, type, onTap]);

  const handleLongPress = useCallback(() => {
    if (!isDragging.current) {
      onLongPress?.(id, type);
    }
  }, [id, type, onLongPress]);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.container,
          {
            left: currentPosition.x,
            top: currentPosition.y,
            width: size?.width,
            height: size?.height,
            borderWidth: isSelected ? 2 : 0,
            borderRadius: 8,
            borderColor: isSelected ? '#8b5cf6' : 'transparent',
            borderStyle: 'solid',
          },
          animatedStyle,
          style,
        ]}
      >
        <Pressable
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={500}
          style={styles.pressable}
        >
          {children}
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  pressable: {
    width: '100%',
    height: '100%',
  },
  // Removed selected style; now handled inline on Animated.View
});

export default DraggableCanvasItem;
