import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { X, Plus, Minus, Maximize2 } from 'lucide-react-native';

interface Table {
  id: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  data?: string[][];
}

interface TableItemProps {
  table: Table;
  updateTable: (id: string, updates: Partial<Table>) => void;
  deleteTable: (id: string) => void;
  zoom?: number;
  shouldDeleteOnDrop?: (x: number, y: number) => boolean;
  isSelected?: boolean;
  onMultiDrag?: (deltaX: number, deltaY: number) => void;
  selectedCount?: number;
}

export const TableItem = React.memo(function TableItem({
  table,
  updateTable,
  deleteTable,
  zoom = 1,
  shouldDeleteOnDrop,
  isSelected,
  onMultiDrag,
  selectedCount = 0,
}: TableItemProps) {
  const [data, setData] = useState<string[][]>(
    table.data || [['', '', ''], ['', '', ''], ['', '', '']]
  );

  // Animated values for dragging
  const translateX = useSharedValue(table.position?.x || 0);
  const translateY = useSharedValue(table.position?.y || 0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const lastDragX = useSharedValue(0);
  const lastDragY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Animated values for resizing
  const currentWidth = useSharedValue(table.size?.width || 300);
  const currentHeight = useSharedValue(table.size?.height || 200);
  const startWidth = useSharedValue(table.size?.width || 300);
  const startHeight = useSharedValue(table.size?.height || 200);

  // Sync position when table.position changes externally
  useEffect(() => {
    if (!isDragging.value) {
      translateX.value = table.position?.x || 0;
      translateY.value = table.position?.y || 0;
    }
  }, [table.position?.x, table.position?.y]);

  // Sync size when table.size changes externally
  useEffect(() => {
    currentWidth.value = table.size?.width || 300;
    currentHeight.value = table.size?.height || 200;
  }, [table.size?.width, table.size?.height]);

  // Sync data when table.data changes externally
  useEffect(() => {
    if (table.data) {
      setData(table.data);
    }
  }, [table.data]);

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = data.map((row, r) =>
      row.map((cell, c) => (r === rowIndex && c === colIndex ? value : cell))
    );
    setData(newData);
    updateTable(table.id, { data: newData });
  };

  const addRow = () => {
    const newData = [...data, new Array(data[0].length).fill('')];
    setData(newData);
    updateTable(table.id, { data: newData });
  };

  const addColumn = () => {
    const newData = data.map((row) => [...row, '']);
    setData(newData);
    updateTable(table.id, { data: newData });
  };

  const removeRow = () => {
    if (data.length > 1) {
      const newData = data.slice(0, -1);
      setData(newData);
      updateTable(table.id, { data: newData });
    }
  };

  const removeColumn = () => {
    if (data[0].length > 1) {
      const newData = data.map((row) => row.slice(0, -1));
      setData(newData);
      updateTable(table.id, { data: newData });
    }
  };

  const handleDelete = () => {
    deleteTable(table.id);
  };

  const handleDragEnd = (x: number, y: number) => {
    if (shouldDeleteOnDrop && shouldDeleteOnDrop(x, y)) {
      deleteTable(table.id);
    } else {
      updateTable(table.id, {
        position: { x, y },
      });
    }
  };

  const handleResizeEnd = (width: number, height: number) => {
    updateTable(table.id, {
      size: { width, height },
    });
  };

  const handleMultiDrag = (deltaX: number, deltaY: number) => {
    if (onMultiDrag) {
      onMultiDrag(deltaX, deltaY);
    }
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

  const animatedTableHeightStyle = useAnimatedStyle(() => ({
    maxHeight: currentHeight.value,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.container,
          animatedContainerStyle,
          animatedSizeStyle,
          isSelected && styles.selected,
        ]}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Table</Text>
            <View style={styles.headerButtons}>
              <Pressable
                onPress={addColumn}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.iconButtonPressed,
                ]}
                hitSlop={8}
              >
                <Plus size={12} color="#6b7280" />
              </Pressable>
              <Pressable
                onPress={removeColumn}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.iconButtonPressed,
                ]}
                hitSlop={8}
              >
                <Minus size={12} color="#6b7280" />
              </Pressable>
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
          </View>

          {/* Table */}
          <Animated.View style={animatedTableHeightStyle}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                <View style={styles.table}>
                  {data.map((row, r) => (
                    <View key={r} style={styles.tableRow}>
                      {row.map((cell, c) => (
                        <View key={c} style={styles.tableCell}>
                          <TextInput
                            value={cell}
                            onChangeText={(value) => handleCellChange(r, c, value)}
                            style={styles.cellInput}
                            placeholder=""
                            placeholderTextColor="#9ca3af"
                          />
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </ScrollView>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerButtons}>
              <Pressable
                onPress={addRow}
                style={({ pressed }) => [
                  styles.rowButton,
                  pressed && styles.rowButtonPressed,
                ]}
              >
                <Text style={styles.rowButtonText}>+ Row</Text>
              </Pressable>
              <Pressable
                onPress={removeRow}
                style={({ pressed }) => [
                  styles.rowButton,
                  pressed && styles.rowButtonPressed,
                ]}
              >
                <Text style={styles.rowButtonText}>− Row</Text>
              </Pressable>
            </View>
            <GestureDetector gesture={resizeGesture}>
              <Animated.View style={styles.resizeHandle}>
                <Maximize2
                  size={12}
                  color="#9ca3af"
                  style={{ transform: [{ rotate: '90deg' }] }}
                />
              </Animated.View>
            </GestureDetector>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
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
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ef4444',
  },
  deleteButtonPressed: {
    backgroundColor: '#dc2626',
  },
  table: {
    padding: 4,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    minWidth: 80,
  },
  cellInput: {
    height: 32,
    paddingHorizontal: 8,
    fontSize: 12,
    color: '#1f2937',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  rowButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  rowButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  rowButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  resizeHandle: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
  },
});

export default TableItem;
