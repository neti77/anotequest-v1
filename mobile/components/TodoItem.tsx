import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { X, Plus, Maximize2, Square, CheckSquare } from 'lucide-react-native';

interface TodoItemData {
  id: number;
  text: string;
  completed: boolean;
}

interface Todo {
  id: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  items?: TodoItemData[];
  title?: string;
}

interface TodoItemProps {
  todo: Todo;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  zoom?: number;
  shouldDeleteOnDrop?: (x: number, y: number) => boolean;
  isSelected?: boolean;
  onMultiDrag?: (deltaX: number, deltaY: number) => void;
  selectedCount?: number;
}

export const TodoItem = React.memo(function TodoItem({
  todo,
  updateTodo,
  deleteTodo,
  zoom = 1,
  shouldDeleteOnDrop,
  isSelected,
  onMultiDrag,
  selectedCount = 0,
}: TodoItemProps) {
  const [items, setItems] = useState<TodoItemData[]>(
    todo.items || [{ id: Date.now(), text: '', completed: false }]
  );
  const [title, setTitle] = useState(todo.title || 'Todo List');

  // Animated values for dragging
  const translateX = useSharedValue(todo.position?.x || 0);
  const translateY = useSharedValue(todo.position?.y || 0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const lastDragX = useSharedValue(0);
  const lastDragY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Animated values for resizing
  const currentWidth = useSharedValue(todo.size?.width || 280);
  const currentHeight = useSharedValue(todo.size?.height || 200);
  const startWidth = useSharedValue(todo.size?.width || 280);
  const startHeight = useSharedValue(todo.size?.height || 200);

  // Sync position when todo.position changes externally
  useEffect(() => {
    if (!isDragging.value) {
      translateX.value = todo.position?.x || 0;
      translateY.value = todo.position?.y || 0;
    }
  }, [todo.position?.x, todo.position?.y]);

  // Sync size when todo.size changes externally
  useEffect(() => {
    currentWidth.value = todo.size?.width || 280;
    currentHeight.value = todo.size?.height || 200;
  }, [todo.size?.width, todo.size?.height]);

  // Sync items when todo.items changes externally
  useEffect(() => {
    if (todo.items) {
      setItems(todo.items);
    }
  }, [todo.items]);

  // Sync title when todo.title changes externally
  useEffect(() => {
    if (todo.title) {
      setTitle(todo.title);
    }
  }, [todo.title]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    updateTodo(todo.id, { title: value });
  };

  const toggleItem = (itemId: number) => {
    const newItems = items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setItems(newItems);
    updateTodo(todo.id, { items: newItems });
  };

  const updateItemText = (itemId: number, text: string) => {
    const newItems = items.map((item) =>
      item.id === itemId ? { ...item, text } : item
    );
    setItems(newItems);
    updateTodo(todo.id, { items: newItems });
  };

  const addItem = () => {
    const newItems = [...items, { id: Date.now(), text: '', completed: false }];
    setItems(newItems);
    updateTodo(todo.id, { items: newItems });
  };

  const deleteItem = (itemId: number) => {
    if (items.length > 1) {
      const newItems = items.filter((item) => item.id !== itemId);
      setItems(newItems);
      updateTodo(todo.id, { items: newItems });
    }
  };

  const handleDelete = () => {
    deleteTodo(todo.id);
  };

  const handleDragEnd = (x: number, y: number) => {
    if (shouldDeleteOnDrop && shouldDeleteOnDrop(x, y)) {
      deleteTodo(todo.id);
    } else {
      updateTodo(todo.id, {
        position: { x, y },
      });
    }
  };

  const handleResizeEnd = (width: number, height: number) => {
    updateTodo(todo.id, {
      size: { width, height },
    });
  };

  const handleMultiDrag = (deltaX: number, deltaY: number) => {
    if (onMultiDrag) {
      onMultiDrag(deltaX, deltaY);
    }
  };

  // Pan gesture for dragging (on header)
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

  // Pan gesture for resizing
  const resizeGesture = Gesture.Pan()
    .onStart(() => {
      startWidth.value = currentWidth.value;
      startHeight.value = currentHeight.value;
    })
    .onUpdate((event) => {
      const newWidth = Math.max(200, startWidth.value + event.translationX / zoom);
      const newHeight = Math.max(120, startHeight.value + event.translationY / zoom);
      currentWidth.value = newWidth;
      currentHeight.value = newHeight;
    })
    .onEnd(() => {
      runOnJS(handleResizeEnd)(currentWidth.value, currentHeight.value);
    });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const animatedSizeStyle = useAnimatedStyle(() => ({
    width: currentWidth.value,
  }));

  const animatedListHeightStyle = useAnimatedStyle(() => ({
    maxHeight: currentHeight.value - 80,
  }));

  const completedCount = items.filter((i) => i.completed).length;

  return (
    <Animated.View
      style={[
        styles.container,
        animatedContainerStyle,
        animatedSizeStyle,
        isSelected && styles.selected,
      ]}
    >
      <View style={styles.card}>
        {/* Header - draggable */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={styles.header}>
            <View style={styles.headerLeft}>
              <CheckSquare size={16} color="#3b82f6" />
              <TextInput
                value={title}
                onChangeText={handleTitleChange}
                style={styles.titleInput}
                placeholder="Todo List"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.countText}>
                {completedCount}/{items.length}
              </Text>
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && styles.deleteButtonPressed,
                ]}
                hitSlop={8}
              >
                <X size={12} color="#fff" />
              </Pressable>
            </View>
          </Animated.View>
        </GestureDetector>

        {/* Items */}
        <Animated.View style={animatedListHeightStyle}>
          <ScrollView
            style={styles.itemsList}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {items.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  item.completed && styles.itemRowCompleted,
                ]}
              >
                <Pressable
                  onPress={() => toggleItem(item.id)}
                  style={styles.checkbox}
                  hitSlop={8}
                >
                  {item.completed ? (
                    <CheckSquare size={16} color="#22c55e" />
                  ) : (
                    <Square size={16} color="#9ca3af" />
                  )}
                </Pressable>
                <TextInput
                  value={item.text}
                  onChangeText={(text) => updateItemText(item.id, text)}
                  style={[
                    styles.itemInput,
                    item.completed && styles.itemInputCompleted,
                  ]}
                  placeholder="Add a task..."
                  placeholderTextColor="#9ca3af"
                />
                <Pressable
                  onPress={() => deleteItem(item.id)}
                  style={({ pressed }) => [
                    styles.itemDeleteButton,
                    pressed && styles.itemDeleteButtonPressed,
                  ]}
                  hitSlop={8}
                >
                  <X size={12} color="#9ca3af" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable
            onPress={addItem}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
          >
            <Plus size={12} color="#6b7280" />
            <Text style={styles.addButtonText}>Add Task</Text>
          </Pressable>
          <GestureDetector gesture={resizeGesture}>
            <Animated.View style={styles.resizeHandle}>
              <Maximize2
                size={16}
                color="#9ca3af"
                style={{ transform: [{ rotate: '90deg' }] }}
              />
            </Animated.View>
          </GestureDetector>
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 12,
  },
  selected: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  titleInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    padding: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  deleteButton: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  deleteButtonPressed: {
    backgroundColor: '#dc2626',
  },
  itemsList: {
    padding: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 6,
    borderRadius: 6,
    marginBottom: 4,
  },
  itemRowCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  checkbox: {
    flexShrink: 0,
  },
  itemInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    padding: 0,
  },
  itemInputCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  itemDeleteButton: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDeleteButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  addButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  addButtonText: {
    fontSize: 12,
    color: '#6b7280',
  },
  resizeHandle: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

TodoItem.displayName = 'TodoItem';
export default TodoItem;
