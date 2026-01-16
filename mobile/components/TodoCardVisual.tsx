import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';

interface TodoItemData {
  id?: number;
  text: string;
  completed: boolean;
}

interface TodoCardVisualProps {
  title?: string;
  items?: TodoItemData[];
  isSelected?: boolean;
  onToggleItem?: (index: number) => void;
  style?: ViewStyle;
}

/**
 * Pure visual component for rendering a todo card.
 * Does NOT handle positioning or dragging - use inside DraggableCanvasItem.
 */
export const TodoCardVisual: React.FC<TodoCardVisualProps> = ({
  title = 'Todo List',
  items = [],
  isSelected = false,
  onToggleItem,
  style,
}) => {
  const visibleItems = items.slice(0, 6);
  const remainingCount = items.length - 6;
  const completedCount = items.filter(item => item.completed).length;

  return (
    <View style={[styles.container, isSelected && styles.selected, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.counter}>
          {completedCount}/{items.length}
        </Text>
      </View>

      {/* Progress bar */}
      {items.length > 0 && (
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(completedCount / items.length) * 100}%` },
            ]}
          />
        </View>
      )}

      {/* Todo items */}
      <View style={styles.itemsContainer}>
        {visibleItems.map((item, idx) => (
          <Pressable
            key={item.id || idx}
            onPress={() => onToggleItem?.(idx)}
            style={styles.todoItem}
          >
            <Text style={styles.checkbox}>
              {item.completed ? '✅' : '⬜'}
            </Text>
            <Text
              style={[
                styles.itemText,
                item.completed && styles.itemTextCompleted,
              ]}
              numberOfLines={1}
            >
              {item.text || 'New task...'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Remaining count */}
      {remainingCount > 0 && (
        <Text style={styles.moreText}>+{remainingCount} more items</Text>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <Text style={styles.emptyText}>No tasks yet</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 220,
    minHeight: 100,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  selected: {
    borderColor: '#8b5cf6',
    borderWidth: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#1f2937',
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
  },
  counter: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  itemsContainer: {
    gap: 4,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 32,
  },
  checkbox: {
    fontSize: 16,
    marginRight: 10,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  itemTextCompleted: {
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  moreText: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
});

export default TodoCardVisual;
