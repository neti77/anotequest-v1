import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ViewStyle } from 'react-native';

interface TableCardVisualProps {
  data?: string[][];
  isSelected?: boolean;
  isEditing?: boolean;
  onCellChange?: (row: number, col: number, value: string) => void;
  onAddRow?: () => void;
  onAddColumn?: () => void;
  style?: ViewStyle;
}

/**
 * Pure visual component for rendering a table on the canvas.
 * Does NOT handle positioning or dragging - use inside DraggableCanvasItem.
 */
export const TableCardVisual: React.FC<TableCardVisualProps> = ({
  data = [['', '', ''], ['', '', ''], ['', '', '']],
  isSelected = false,
  isEditing = false,
  onCellChange,
  onAddRow,
  onAddColumn,
  style,
}) => {
  const rows = data.length;
  const cols = data[0]?.length || 3;

  return (
    <View style={[styles.container, isSelected && styles.selected, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>📊 Table</Text>
        <Text style={styles.sizeText}>{rows}×{cols}</Text>
      </View>

      {/* Table grid */}
      <View style={styles.tableGrid}>
        {data.slice(0, 5).map((row, rowIdx) => (
          <View key={rowIdx} style={styles.tableRow}>
            {row.slice(0, 5).map((cell, colIdx) => (
              <View
                key={colIdx}
                style={[
                  styles.tableCell,
                  rowIdx === 0 && styles.headerCell,
                  colIdx === 0 && styles.firstColumn,
                ]}
              >
                {isEditing ? (
                  <TextInput
                    style={styles.cellInput}
                    value={cell}
                    onChangeText={(text) => onCellChange?.(rowIdx, colIdx, text)}
                    placeholder="-"
                    placeholderTextColor="#9ca3af"
                    multiline={false}
                  />
                ) : (
                  <Text style={styles.cellText} numberOfLines={1}>
                    {cell || '-'}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* Overflow indicators */}
      {(rows > 5 || cols > 5) && (
        <Text style={styles.overflowText}>
          {rows > 5 ? `+${rows - 5} rows` : ''} 
          {rows > 5 && cols > 5 ? ' • ' : ''}
          {cols > 5 ? `+${cols - 5} cols` : ''}
        </Text>
      )}

      {/* Add buttons (when editing) */}
      {isEditing && (
        <View style={styles.addButtons}>
          <Pressable onPress={onAddRow} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Row</Text>
          </Pressable>
          <Pressable onPress={onAddColumn} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Column</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 280,
    minHeight: 100,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
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
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  sizeText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  tableGrid: {
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    flex: 1,
    minWidth: 48,
    height: 32,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerCell: {
    backgroundColor: '#f3f4f6',
  },
  firstColumn: {
    backgroundColor: '#f9fafb',
  },
  cellText: {
    fontSize: 12,
    color: '#374151',
  },
  cellInput: {
    fontSize: 12,
    color: '#374151',
    padding: 0,
    margin: 0,
  },
  overflowText: {
    color: '#9ca3af',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 6,
    backgroundColor: '#f9fafb',
  },
  addButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
  addButtonText: {
    color: '#374151',
    fontSize: 12,
  },
});

export default TableCardVisual;
