import React, { useCallback, useRef, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ViewStyle, 
  PanResponder,
  Animated,
  Pressable,
} from 'react-native';

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
  isSelected?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * DraggableCanvasItem - A wrapper component for draggable canvas items.
 * Uses React Native's PanResponder for basic drag support.
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
  isSelected = false,
  disabled = false,
  style,
}) => {
  // Current position state
  const [currentPosition, setCurrentPosition] = useState(position);
  const positionRef = useRef(position);
  
  // Animated values for smooth drag
  const pan = useRef(new Animated.ValueXY(position)).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  // Track if we're dragging vs tapping
  const isDragging = useRef(false);
  const dragDistance = useRef(0);

  // Update position when prop changes
  React.useEffect(() => {
    if (!isDragging.current) {
      pan.setValue(position);
      positionRef.current = position;
      setCurrentPosition(position);
    }
  }, [position.x, position.y]);

  // Create pan responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture if moved more than 5px
        return !disabled && (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5);
      },
      onPanResponderGrant: () => {
        isDragging.current = false;
        dragDistance.current = 0;
        pan.setOffset({
          x: positionRef.current.x,
          y: positionRef.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
        
        // Scale up slightly
        Animated.spring(scale, {
          toValue: 1.05,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        dragDistance.current = Math.sqrt(
          gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy
        );
        
        if (dragDistance.current > 5) {
          if (!isDragging.current) {
            isDragging.current = true;
            onDragStart?.(id, type);
          }
          pan.setValue({ x: gestureState.dx, y: gestureState.dy });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        
        // Scale back
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
        
        if (isDragging.current) {
          // Snap to grid (10px)
          const newX = Math.round((positionRef.current.x + gestureState.dx) / 10) * 10;
          const newY = Math.round((positionRef.current.y + gestureState.dy) / 10) * 10;
          
          const newPosition = { x: newX, y: newY };
          positionRef.current = newPosition;
          setCurrentPosition(newPosition);
          
          Animated.spring(pan, {
            toValue: newPosition,
            useNativeDriver: true,
          }).start();
          
          onPositionChange?.(id, newPosition);
          onDragEnd?.(id, type, newPosition);
        }
        
        isDragging.current = false;
      },
    })
  ).current;

  // Handle tap
  const handlePress = useCallback(() => {
    if (!isDragging.current && dragDistance.current < 5) {
      onTap?.(id, type);
    }
  }, [id, type, onTap]);

  // Handle long press
  const handleLongPress = useCallback(() => {
    if (!isDragging.current) {
      onLongPress?.(id, type);
    }
  }, [id, type, onLongPress]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        size && { width: size.width, height: size.height },
        isSelected && styles.selected,
        style,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { rotate: `${rotation}deg` },
            { scale: scale },
          ],
        },
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
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  pressable: {
    flex: 1,
  },
  selected: {
    // Selection indicator handled by child component
  },
});

export default DraggableCanvasItem;
