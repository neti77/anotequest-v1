import React, { useRef } from 'react';
import { View, Text, Pressable, Image, Alert, StyleSheet } from 'react-native';
import { Gesture, GestureDetector, GestureUpdateEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { X, Maximize2 } from 'lucide-react-native';

// Types
interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface ImageData {
  id: number;
  data: string;
  position: Position;
  size?: Size;
}

interface ImageItemProps {
  image: ImageData;
  updateImage: (id: number, updates: Partial<ImageData>) => void;
  deleteImage: (id: number) => void;
  onItemClick?: () => void;
  isConnecting?: boolean;
  isSelected?: boolean;
  zoom?: number;
  shouldDeleteOnDrop?: (x: number, y: number) => boolean;
  onMultiDrag?: (deltaX: number, deltaY: number) => void;
  selectedCount?: number;
}

export const ImageItem: React.FC<ImageItemProps> = React.memo(({
  image,
  updateImage,
  deleteImage,
  onItemClick,
  isConnecting = false,
  isSelected = false,
  zoom = 1,
  shouldDeleteOnDrop,
  onMultiDrag,
  selectedCount = 0,
}) => {
  // Animated values for drag
  const translateX = useSharedValue(image.position.x);
  const translateY = useSharedValue(image.position.y);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  
  // Track last position for multi-drag
  const lastPosRef = useRef({ x: image.position.x, y: image.position.y });

  // Update position when image prop changes
  React.useEffect(() => {
    translateX.value = image.position.x;
    translateY.value = image.position.y;
    lastPosRef.current = { x: image.position.x, y: image.position.y };
  }, [image.position.x, image.position.y]);

  const width = image.size?.width || 300;
  const height = image.size?.height || 200;

  // Handle delete
  const handleDelete = () => {
    Alert.alert('Delete Image', 'Are you sure you want to delete this image?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteImage(image.id) },
    ]);
  };

  // Handle connection click
  const handlePress = () => {
    if (isConnecting && onItemClick) {
      onItemClick();
    }
  };

  // Update position callback
  const updatePosition = (x: number, y: number) => {
    updateImage(image.id, { position: { x, y } });
  };

  // Check if dropped on trash
  const checkTrashDrop = (x: number, y: number) => {
    if (shouldDeleteOnDrop && shouldDeleteOnDrop(x, y)) {
      deleteImage(image.id);
    }
  };

  // Handle multi-drag
  const handleMultiDrag = (deltaX: number, deltaY: number) => {
    if (isSelected && selectedCount > 1 && onMultiDrag) {
      onMultiDrag(deltaX, deltaY);
    }
  };

  // Pan gesture for dragging
  const panGesture = Gesture.Pan()
    .enabled(!isConnecting)
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

  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: isDragging.value ? 1.02 : 1 },
    ],
    zIndex: isDragging.value ? 100 : 12,
  }));

  // TODO: Implement resize gesture for mobile
  // Resize would require a separate pan gesture on the resize handle
  // that updates the size instead of position

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.container,
          {
            width,
            height,
          },
          animatedStyle,
          isSelected && styles.selected,
        ]}
      >
        <Pressable onPress={handlePress} style={styles.pressable}>
          <Image
            source={{ uri: image.data }}
            style={styles.image}
            resizeMode="cover"
          />

          {/* Delete Button */}
          <Pressable
            onPress={handleDelete}
            style={styles.deleteButton}
          >
            <X size={14} color="#FFFFFF" />
          </Pressable>

          {/* Resize Handle - TODO: Implement resize gesture */}
          <View style={styles.resizeHandle}>
            <Maximize2 size={14} color="#9CA3AF" />
          </View>

          {/* Selection indicator */}
          {isSelected && (
            <View style={styles.selectionIndicator} />
          )}
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#4B5563',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selected: {
    borderColor: '#A855F7',
  },
  pressable: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resizeHandle: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#A855F7',
    borderRadius: 8,
  },
});

ImageItem.displayName = 'ImageItem';
export default ImageItem;