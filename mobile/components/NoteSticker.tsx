import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';
import NoteStickerVisual from './NoteStickerVisual';
import { Gesture, GestureDetector, GestureUpdateEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Maximize2 } from 'lucide-react-native';

// Types
interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface PathData {
  points: Position[];
  color: string;
  size: number;
}

interface Sticker {
  id: number;
  position: Position;
  size?: Size;
  paths?: PathData[];
}

interface NoteStickerProps {
  sticker: Sticker;
  updateNoteSticker?: (id: number, updates: Partial<Sticker>) => void;
  deleteNoteSticker?: (id: number) => void;
  zoom?: number;
  shouldDeleteOnDrop?: (x: number, y: number) => boolean;
  isSelected?: boolean;
  onMultiDrag?: (deltaX: number, deltaY: number) => void;
  selectedCount?: number;
  onPositionChange?: (position: Position) => void;
}

// Convert points array to SVG path string
const pointsToPath = (points: Position[]): string => {
  if (!points || points.length === 0) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
};

export const NoteSticker: React.FC<NoteStickerProps> = React.memo(({
  sticker,
  updateNoteSticker,
  deleteNoteSticker,
  zoom = 1,
  shouldDeleteOnDrop,
  isSelected = false,
  onMultiDrag,
  selectedCount = 0,
  onPositionChange,
}) => {
  const width = sticker.size?.width || 200;
  const height = sticker.size?.height || 160;
  // Animated values for dragging
  const translateX = useSharedValue(sticker.position.x);
  const translateY = useSharedValue(sticker.position.y);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const lastPosRef = useRef({ x: sticker.position.x, y: sticker.position.y });

  // Update position when sticker prop changes
  useEffect(() => {
    translateX.value = sticker.position.x;
    translateY.value = sticker.position.y;
    lastPosRef.current = { x: sticker.position.x, y: sticker.position.y };
  }, [sticker.position.x, sticker.position.y]);

  // Drawing logic preserved
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentPath, setCurrentPath] = useState<Position[]>([]);
  const finishPath = () => {
    if (currentPath.length > 1) {
      const newPath: PathData = {
        points: currentPath,
        color: '#111827',
        size: 2,
      };
      const paths = [...(sticker.paths || []), newPath];
      updateNoteSticker?.(sticker.id, { paths });
    }
    setCurrentPath([]);
    setIsDrawingMode(false);
  };
  // Drawing gesture
  const drawGesture = Gesture.Pan()
    .enabled(isDrawingMode)
    .onStart((e) => {
      const pos = { x: e.x, y: e.y };
      setCurrentPath([pos]);
    })
    .onUpdate((e) => {
      const pos = { x: e.x, y: e.y };
      setCurrentPath((prev) => [...prev, pos]);
    })
    .onEnd(() => {
      runOnJS(finishPath)();
    });
  // Double tap to toggle drawing mode
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(setIsDrawingMode)(true);
    });
  // Combine gestures (only pass gestures, not undefined)
  const composedGesture = isDrawingMode
    ? Gesture.Race(drawGesture, doubleTapGesture)
    : doubleTapGesture;

  // Update position callback
  const updatePosition = (x: number, y: number) => {
    updateNoteSticker?.(sticker.id, { position: { x, y } });
  };

  // Check trash drop
  const checkTrashDrop = (x: number, y: number) => {
    if (shouldDeleteOnDrop && shouldDeleteOnDrop(x, y)) {
      deleteNoteSticker?.(sticker.id);
    }
  };

  // Multi-drag handler
  const handleMultiDrag = (deltaX: number, deltaY: number) => {
    if (isSelected && selectedCount > 1 && onMultiDrag) {
      onMultiDrag(deltaX, deltaY);
    }
  };

  // Pan gesture for dragging
  const panGesture = Gesture.Pan()
    .enabled(!isDrawingMode)
    .onStart(() => {
      isDragging.value = true;
      offsetX.value = translateX.value;
      offsetY.value = translateY.value;
    })
    .onUpdate((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      const newX = offsetX.value + e.translationX / zoom;
      const newY = offsetY.value + e.translationY / zoom;

      translateX.value = newX;
      translateY.value = newY;

      runOnJS(onPositionChange ?? (() => {}))({ x: newX, y: newY });

      // Multi-drag support
      const deltaX = newX - lastPosRef.current.x;
      const deltaY = newY - lastPosRef.current.y;
      if (deltaX !== 0 || deltaY !== 0) {
        runOnJS(handleMultiDrag)(deltaX, deltaY);
      }
      lastPosRef.current = { x: newX, y: newY };
    })
    .onEnd((e: { absoluteX: number; absoluteY: number }) => {
      isDragging.value = false;
      const finalX = translateX.value;
      const finalY = translateY.value;

      runOnJS(updatePosition)(finalX, finalY);
      runOnJS(checkTrashDrop)(e.absoluteX, e.absoluteY);
    });

  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: isDragging.value ? 1.02 : 1 },
    ],
    zIndex: isDragging.value ? 100 : 10,
  }));

  // Match NoteCard structure: Animated.View with border, background, selection, gesture
  const colorScheme = { bg: '#fef08a', border: '#eab308' };
  const stickerSize = sticker.size || { width: 200, height: 160 };
  return (
    <GestureDetector gesture={Gesture.Race(panGesture, composedGesture)}>
      
        
<Animated.View
  style={[
    {
      position: 'absolute', // 🔥 REQUIRED
      width: stickerSize.width,
      height: stickerSize.height,
      backgroundColor: colorScheme.bg,
    },
    animatedStyle,
  ]}
>
          
        <NoteStickerVisual
          color="yellow"
          paths={
            [
              ...(sticker.paths || []).map((p) => ({
                d: pointsToPath(p.points),
                color: p.color,
                strokeWidth: p.size,
              })),
              ...(currentPath.length > 0
                ? [{ d: pointsToPath(currentPath), color: '#111827', strokeWidth: 2 }]
                : []),
            ]
          }
          isSelected={isSelected}
        />
        {isDrawingMode && (
          <View style={styles.drawingIndicator}>
            <Text style={styles.drawingIndicatorText}>✏️ Drawing...</Text>
          </View>
        )}
        <View style={styles.resizeHandle}>
          <Maximize2 size={12} color="#B45309" />
        </View>
        {!isDrawingMode && (sticker.paths?.length === 0 || !sticker.paths) && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>Double-tap to draw</Text>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  // container and selected styles now handled inline
  stickyBackground: {
    ...StyleSheet.absoluteFillObject,
   position: 'absolute',
    borderRadius: 14,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  stickyInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: '#FCD34D',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  drawingSurface: {
    ...StyleSheet.absoluteFillObject,
  },
  drawingIndicator: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  drawingIndicatorText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  resizeHandle: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.55,
  },
  hintContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    fontSize: 13,
    color: '#92400E',
    opacity: 0.65,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

NoteSticker.displayName = 'NoteSticker';
export default NoteSticker;
