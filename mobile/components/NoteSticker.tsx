import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';
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
  updateNoteSticker: (id: number, updates: Partial<Sticker>) => void;
  deleteNoteSticker: (id: number) => void;
  zoom?: number;
  shouldDeleteOnDrop?: (x: number, y: number) => boolean;
  isSelected?: boolean;
  onMultiDrag?: (deltaX: number, deltaY: number) => void;
  selectedCount?: number;
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
}) => {
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentPath, setCurrentPath] = useState<Position[]>([]);

  // Animated values for dragging
  const translateX = useSharedValue(sticker.position.x);
  const translateY = useSharedValue(sticker.position.y);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const lastPosRef = useRef({ x: sticker.position.x, y: sticker.position.y });
  const containerRef = useRef<View>(null);
  const containerLayout = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Update position when sticker prop changes
  useEffect(() => {
    translateX.value = sticker.position.x;
    translateY.value = sticker.position.y;
    lastPosRef.current = { x: sticker.position.x, y: sticker.position.y };
  }, [sticker.position.x, sticker.position.y]);

  const width = sticker.size?.width || 200;
  const height = sticker.size?.height || 160;

  // Position update callback
  const updatePosition = (x: number, y: number) => {
    updateNoteSticker(sticker.id, { position: { x, y } });
  };

  // Check trash drop
  const checkTrashDrop = (x: number, y: number) => {
    if (shouldDeleteOnDrop && shouldDeleteOnDrop(x, y)) {
      deleteNoteSticker(sticker.id);
    }
  };

  // Multi-drag handler
  const handleMultiDrag = (deltaX: number, deltaY: number) => {
    if (isSelected && selectedCount > 1 && onMultiDrag) {
      onMultiDrag(deltaX, deltaY);
    }
  };

  // Finish drawing path
  const finishPath = () => {
    if (currentPath.length > 1) {
      const newPath: PathData = {
        points: currentPath,
        color: '#111827',
        size: 2,
      };
      const paths = [...(sticker.paths || []), newPath];
      updateNoteSticker(sticker.id, { paths });
    }
    setCurrentPath([]);
    setIsDrawingMode(false);
  };

  // Pan gesture for dragging (when not in drawing mode)
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

  // Drawing gesture (when in drawing mode)
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

  // Combine gestures
  const composedGesture = Gesture.Race(
    isDrawingMode ? drawGesture : panGesture,
    doubleTapGesture
  );

  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: isDragging.value ? 1.02 : 1 },
    ],
    zIndex: isDragging.value ? 100 : 40,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        ref={containerRef}
        style={[
          styles.container,
          {
            width,
            height,
          },
          animatedStyle,
          isSelected && styles.selected,
        ]}
        onLayout={(e) => {
          containerLayout.current = e.nativeEvent.layout;
        }}
      >
        {/* Yellow sticky note background */}
        <View style={styles.stickyBackground}>
          <View style={styles.stickyInner} />
        </View>

        {/* Drawing surface using SVG */}
        <View style={styles.drawingSurface}>
          <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
            {/* Render saved paths */}
            {(sticker.paths || []).map((p, idx) => (
              <Path
                key={idx}
                d={pointsToPath(p.points)}
                stroke={p.color || '#111827'}
                strokeWidth={p.size || 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
            {/* Render current drawing path */}
            {currentPath.length > 0 && (
              <Path
                d={pointsToPath(currentPath)}
                stroke="#111827"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </Svg>
        </View>

        {/* Drawing mode indicator */}
        {isDrawingMode && (
          <View style={styles.drawingIndicator}>
            <Text style={styles.drawingIndicatorText}>✏️ Drawing...</Text>
          </View>
        )}

        {/* Resize handle - TODO: implement resize gesture */}
        <View style={styles.resizeHandle}>
          <Maximize2 size={12} color="#B45309" />
        </View>

        {/* Hint text */}
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
  container: {
    position: 'absolute',
  },
  selected: {
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#A855F7',
  },
  stickyBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  stickyInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: '#FDE68A',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  drawingSurface: {
    ...StyleSheet.absoluteFillObject,
  },
  drawingIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  drawingIndicatorText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  resizeHandle: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
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
    fontSize: 12,
    color: '#92400E',
    opacity: 0.6,
  },
});

NoteSticker.displayName = 'NoteSticker';
export default NoteSticker;
