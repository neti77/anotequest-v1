import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Dimensions,
  Alert,
  StyleSheet,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDecay,
  withSpring,
} from 'react-native-reanimated';
import { ZoomIn, ZoomOut, RotateCcw, Trash2 } from 'lucide-react-native';
import { DraggableCanvasItem } from './DraggableCanvasItem';
import NoteSticker from './NoteSticker';
import { useCanvasInteraction } from '../contexts/CanvasInteractionContext';
import type { JSX } from 'react';

// Types
interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface Note {
  id: number;
  title: string;
  content: string;
  position: Position;
  size?: Size;
  folderId: number | null;
}

interface Sticker {
  id: number;
  type: string;
  position: Position;
  size?: Size;
  rotation?: number;
}

interface Image {
  id: number;
  data: string;
  position: Position;
  size?: Size;
}

interface Table {
  id: number;
  position: Position;
  size?: Size;
  data: string[][];
}

interface Todo {
  id: number;
  title: string;
  items: { id: number; text: string; completed: boolean }[];
  position: Position;
  size?: Size;
}

interface Source {
  id: number;
  url: string;
  title: string;
  position: Position;
  size?: Size;
}

interface Character {
  id: number;
  name: string;
  emoji: string;
  position: Position;
}

interface CanvasProps {
  notes: Note[];
  totalNoteCount: number;
  stickers: Sticker[];
  noteStickers?: any[];
  images?: Image[];
  tables?: Table[];
  todos?: Todo[];
  sources?: Source[];
  drawings?: any[];
  setDrawings?: (drawings: any[]) => void;
  drawingTool?: string | null;
  updateSource?: (id: number, updates: Partial<Source>) => void;
  deleteSource?: (id: number) => void;
  characters: Character[];
  addNote: (note?: Partial<Note>) => any;
  updateNote: (id: number, updates: Partial<Note>) => void;
  deleteNote: (id: number) => void;
  addSticker?: (sticker: Partial<Sticker>) => void;
  updateSticker?: (id: number, updates: Partial<Sticker>) => void;
  deleteSticker?: (id: number) => void;
  addImage?: (image: Partial<Image>) => void;
  updateImage?: (id: number, updates: Partial<Image>) => void;
  deleteImage?: (id: number) => void;
  addTable?: (table: Partial<Table>) => void;
  updateTable?: (id: number, updates: Partial<Table>) => void;
  deleteTable?: (id: number) => void;
  addTodo?: (todo: Partial<Todo>) => void;
  updateTodo?: (id: number, updates: Partial<Todo>) => void;
  deleteTodo?: (id: number) => void;
  updateCharacter?: (id: number, updates: Partial<Character>) => void;
  folders: any[];
  isPremium: boolean;
  isDrawingMode: boolean;
  onCloseDrawing?: () => void;
  userName: string;
  activeFolder: number | null;
  updateNoteSticker?: (id: number, updates: any) => void;
  deleteNoteSticker?: (id: number) => void;
  onOpenTrash?: () => void;
  onNoteClick?: (note: Note) => void;
  readerModeNoteId?: number | null;
  onReaderModeClosed?: () => void;
  shouldDeleteOnDrop?: (x: number, y: number) => boolean;
  onMultiDrag?: (deltaX: number, deltaY: number) => void;
  selectedCount?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Canvas configuration
const CANVAS_WIDTH = 4000;
const CANVAS_HEIGHT = 4000;
const GRID_SPACING = 50;

export const Canvas: React.FC<CanvasProps> = ({
  notes,
  totalNoteCount,
  stickers,
  noteStickers = [],
  images = [],
  tables = [],
  todos = [],
  sources = [],
  drawings,
  setDrawings,
  drawingTool,
  updateSource,
  deleteSource,
  characters,
  addNote,
  updateNote,
  deleteNote,
  addSticker,
  updateSticker,
  deleteSticker,
  addImage,
  updateImage,
  deleteImage,
  addTable,
  updateTable,
  deleteTable,
  addTodo,
  updateTodo,
  deleteTodo,
  updateCharacter,
  folders,
  isPremium,
  isDrawingMode,
  onCloseDrawing,
  userName,
  activeFolder,
  updateNoteSticker,
  deleteNoteSticker,
  onOpenTrash,
  onNoteClick,
  readerModeNoteId,
  onReaderModeClosed,
  shouldDeleteOnDrop,
  onMultiDrag,
  selectedCount,
}) => {
  const { isDraggingItem } = useCanvasInteraction();
  const [scale, setScale] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isDraggingItemLocal, setIsDraggingItemLocal] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(CANVAS_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState(CANVAS_HEIGHT);
  const [selectedPosition, setSelectedPosition] = useState({ x: 0, y: 0 });

  // Update selected position with animation
  const updateSelectedPosition = useCallback((position: { x: number; y: number }) => {
    setSelectedPosition(position);
    selectionX.value = position.x;
    selectionY.value = position.y;
  }, []);

  // Update selected position when selection changes
  useEffect(() => {
    if (selectedType === 'noteSticker' && selectedId) {
      const id = parseInt(selectedId.split('-')[1]);
      const sticker = noteStickers.find(s => s.id === id);
      if (sticker) {
        setSelectedPosition(sticker.position);
        selectionX.value = sticker.position.x;
        selectionY.value = sticker.position.y;
      }
    }
  }, [selectedId, selectedType, noteStickers]);

  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Selection overlay animation
  const selectionX = useSharedValue(0);
  const selectionY = useSharedValue(0);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(3, prev + 0.25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(0.25, prev - 0.25));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    offsetX.value = withSpring(0);
    offsetY.value = withSpring(0);
  }, [offsetX, offsetY]);

  const panGesture = Gesture.Pan()
    .enabled(!isDraggingItem) // Disable canvas dragging when an item is being dragged
    .onStart(() => {
      startX.value = offsetX.value;
      startY.value = offsetY.value;
    })
    .onUpdate((event) => {
      offsetX.value = startX.value + event.translationX;
      offsetY.value = startY.value + event.translationY;
    })
    .onEnd((event) => {
      offsetX.value = withDecay({
        velocity: event.velocityX,
        deceleration: 0.998,
      });
      offsetY.value = withDecay({
        velocity: event.velocityY,
        deceleration: 0.998,
      });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale },
    ],
  }));

  const handleDragNearEdge = useCallback((x: number, y: number) => {
    const buffer = 100; // Distance from edge to trigger expansion
    const growthAmount = 500; // Amount to grow the canvas

    if (x > canvasWidth - buffer) {
      setCanvasWidth((prev) => prev + growthAmount);
    }
    if (y > canvasHeight - buffer) {
      setCanvasHeight((prev) => prev + growthAmount);
    }
  }, [canvasWidth, canvasHeight]);

  // Render a note card
  const renderNoteCard = (note: Note) => {
    const isSelected = selectedId === `note-${note.id}` && (isDraggingItemLocal || !isDraggingItem);
    return (
      <DraggableCanvasItem
        key={note.id}
        id={note.id}
        type="note"
        position={note.position}
        size={note.size || { width: 280, height: 120 }}
        isSelected={isSelected}
        onTap={() => {
          setSelectedId(`note-${note.id}`);
          setSelectedType('note');
          onNoteClick?.(note);
        }}
        onDragStart={() => {
          setSelectedId(`note-${note.id}`);
          setSelectedType('note');
        }}
        onDragActiveChange={setIsDraggingItemLocal}
        onPositionChange={(id, position) => {
          updateNote(id, { position });
        }}
        dragTouchZone="edges"
      >
        <Pressable
          onPress={() => {
            setSelectedId(`note-${note.id}`);
            setSelectedType('note');
            onNoteClick?.(note);
          }}
          onLongPress={() => {
            Alert.alert('Delete Note', `Delete "${note.title}"?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteNote(note.id) },
            ]);
          }}
          style={[styles.noteCard, isSelected && styles.selectedNoteCard]}
        >
          <Text style={styles.noteTitle} numberOfLines={1}>
            {note.title || 'Untitled'}
          </Text>
          <Text style={styles.noteContent} numberOfLines={4}>
            {note.content || 'Tap to edit...'}
          </Text>
        </Pressable>
      </DraggableCanvasItem>
    );
  };

  // Render a todo item
  const renderTodoItem = (todo: Todo) => (
    <DraggableCanvasItem
      key={todo.id}
      id={todo.id}
      type="todo"
      position={todo.position}
      size={todo.size || { width: 240, height: 150 }}
      isSelected={selectedId === `todo-${todo.id}` && !isDraggingItem}
      onTap={() => {
        setSelectedId(`todo-${todo.id}`);
        setSelectedType('todo');
      }}
      onDragStart={() => {
        setSelectedId(`todo-${todo.id}`);
        setSelectedType('todo');
      }}
      onDragActiveChange={setIsDraggingItemLocal}
      onPositionChange={(id, position) => {
        updateTodo?.(id, { position });
      }}
      dragTouchZone="edges"
    >
      <View style={styles.todoCard}>
        <Text style={styles.todoTitle}>{todo.title}</Text>
        {todo.items?.slice(0, 5).map((item, idx) => (
          <Pressable
            key={idx}
            onPress={() => {
              if (updateTodo) {
                const newItems = [...todo.items];
                newItems[idx] = { ...item, completed: !item.completed };
                updateTodo(todo.id, { items: newItems });
              }
            }}
            style={styles.todoItemRow}
          >
            <Text style={styles.todoCheckbox}>{item.completed ? '✅' : '⬜'}</Text>
            <Text
              style={[styles.todoItemText, item.completed && styles.todoItemCompleted]}
              numberOfLines={1}
            >
              {item.text || 'New item...'}
            </Text>
          </Pressable>
        ))}
        {todo.items?.length > 5 && (
          <Text style={styles.todoMore}>+{todo.items.length - 5} more items</Text>
        )}
      </View>
    </DraggableCanvasItem>
  );

  // Render sticker
  const renderSticker = (sticker: Sticker) => {
    const isSelected = selectedId === `sticker-${sticker.id}` && !isDraggingItem;
    return (
      <DraggableCanvasItem
        key={sticker.id}
        id={sticker.id}
        type="sticker"
        position={sticker.position}
        size={sticker.size || { width: 60, height: 60 }}
        rotation={sticker.rotation}
        isSelected={isSelected}
        onTap={() => {
          setSelectedId(`sticker-${sticker.id}`);
          setSelectedType('sticker');
        }}
        onDragStart={() => {
          setSelectedId(`sticker-${sticker.id}`);
          setSelectedType('sticker');
        }}
        onDragActiveChange={setIsDraggingItemLocal}
        onPositionChange={(id, position) => {
          updateSticker?.(id, { position });
        }}
        dragTouchZone="full"
      >
        <Pressable
          onLongPress={() => {
            if (deleteSticker) {
              Alert.alert('Delete Sticker', 'Delete this sticker?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteSticker(sticker.id) },
              ]);
            }
          }}
          style={[styles.stickerItem, isSelected && styles.selectedNoteSticker]}
        >
          <Text style={styles.stickerEmoji}>{sticker.type || '⭐'}</Text>
        </Pressable>
      </DraggableCanvasItem>
    );
  };

  // Render image
  const renderImage = (image: Image) => (
    <DraggableCanvasItem
      key={image.id}
      id={image.id}
      type="image"
      position={image.position}
      size={image.size || { width: 200, height: 150 }}
      isSelected={selectedId === `image-${image.id}` && !isDraggingItem}
      onTap={() => {
        setSelectedId(`image-${image.id}`);
        setSelectedType('image');
      }}
      onDragStart={() => {
        setSelectedId(`image-${image.id}`);
        setSelectedType('image');
      }}
      onDragActiveChange={setIsDraggingItemLocal}
      onPositionChange={(id, position) => {
        deleteImage?.(id);
        addImage?.({ ...image, position });
      }}
      dragTouchZone="full"
    >
      <View style={styles.imageCard}>
        <Text style={styles.imagePlaceholderIcon}>🖼️</Text>
        <Text style={styles.imagePlaceholderText}>Image</Text>
      </View>
    </DraggableCanvasItem>
  );

  // Render table
  const renderTable = (table: Table) => (
    <DraggableCanvasItem
      key={table.id}
      id={table.id}
      type="table"
      position={table.position}
      size={table.size || { width: 300, height: 200 }}
      isSelected={selectedId === `table-${table.id}` && !isDraggingItem}
      onTap={() => {
        setSelectedId(`table-${table.id}`);
        setSelectedType('table');
      }}
      onDragStart={() => {
        setSelectedId(`table-${table.id}`);
        setSelectedType('table');
      }}
      onDragActiveChange={setIsDraggingItemLocal}
      onPositionChange={(id, position) => {
        updateTable?.(id, { position });
      }}
      dragTouchZone="edges"
    >
      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>📊 Table</Text>
        </View>
        <View style={styles.tableBody}>
          {table.data?.slice(0, 3).map((row, rowIdx) => (
            <View key={rowIdx} style={styles.tableRow}>
              {row.slice(0, 3).map((cell, colIdx) => (
                <View key={colIdx} style={styles.tableCell}>
                  <Text style={styles.tableCellText} numberOfLines={1}>
                    {cell || '-'}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    </DraggableCanvasItem>
  );

  // Render source
  const renderSource = (source: Source) => (
    <DraggableCanvasItem
      key={source.id}
      id={source.id}
      type="source"
      position={source.position}
      size={source.size || { width: 220, height: 80 }}
      isSelected={selectedId === `source-${source.id}` && !isDraggingItem}
      onTap={() => {
        setSelectedId(`source-${source.id}`);
        setSelectedType('source');
      }}
      onDragStart={() => {
        setSelectedId(`source-${source.id}`);
        setSelectedType('source');
      }}
      onDragActiveChange={setIsDraggingItemLocal}
      onPositionChange={(id, position) => {
        updateSource?.(id, { position });
      }}
      dragTouchZone="edges"
    >
      <Pressable
        onLongPress={() => {
          if (deleteSource) {
            Alert.alert('Delete Source', 'Delete this source?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteSource(source.id) },
            ]);
          }
        }}
        style={styles.sourceCard}
      >
        <Text style={styles.sourceTitle} numberOfLines={1}>
          🔗 {source.title || source.url}
        </Text>
        <Text style={styles.sourceUrl} numberOfLines={1}>
          {source.url}
        </Text>
      </Pressable>
    </DraggableCanvasItem>
  );

  // Render note sticker
  const renderNoteSticker = (sticker: any) => (
    <NoteSticker
      key={sticker.id}
      sticker={sticker}
      updateNoteSticker={updateNoteSticker}
      deleteNoteSticker={deleteNoteSticker}
      zoom={scale}
      shouldDeleteOnDrop={shouldDeleteOnDrop}
      isSelected={selectedId === `noteSticker-${sticker.id}` && !isDraggingItem}
      onMultiDrag={onMultiDrag}
      selectedCount={selectedCount}
      onPositionChange={selectedId === `noteSticker-${sticker.id}` ? updateSelectedPosition : undefined}
    />
  );

  // Render grid dots
  const renderGrid = () => {
    const dots: React.ReactNode[] = [];
    const dotSize = 2;
    const step = GRID_SPACING * 2;
    const maxDots = 40;
    
    for (let i = 0; i < maxDots; i++) {
      for (let j = 0; j < maxDots; j++) {
        const x = i * step;
        const y = j * step;
        dots.push(
          <View
            key={`dot-${i}-${j}`}
            style={[
              styles.gridDot,
              { left: x, top: y, width: dotSize, height: dotSize },
            ]}
          />
        );
      }
    }
    return dots;
  };

  const renderDraggableItem = useCallback(
    (item: any, renderFunction: (item: any) => JSX.Element) => {
      return React.cloneElement(renderFunction(item), {
        onDrag: (id: number, position: Position) => {
          handleDragNearEdge(position.x, position.y);
        },
      });
    },
    [handleDragNearEdge]
  );

  return (
    <View style={styles.container}>
      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <Pressable onPress={handleZoomOut} style={styles.zoomButton}>
          <ZoomOut size={18} color="#9CA3AF" />
        </Pressable>

        <Text style={styles.zoomText}>{Math.round(scale * 100)}%</Text>

        <Pressable onPress={handleZoomIn} style={styles.zoomButton}>
          <ZoomIn size={18} color="#9CA3AF" />
        </Pressable>

        <View style={styles.zoomDivider} />

        <Pressable onPress={resetZoom} style={styles.zoomButton}>
          <RotateCcw size={16} color="#9CA3AF" />
        </Pressable>
      </View>

      {/* Note Limit Badge */}
      {!isPremium && (
        <View style={styles.noteLimitBadge}>
          <Text style={styles.noteLimitText}>{totalNoteCount}/100 notes</Text>
        </View>
      )}

      {/* Trash Zone */}
      <Pressable onPress={onOpenTrash} style={styles.trashZone}>
        <Trash2 size={24} color="#8B5CF6" />
      </Pressable>

      {/* Canvas with Gesture Handler */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.canvasWrapper, animatedStyle]}>
          <View
            style={[styles.canvasContent, { width: canvasWidth, height: canvasHeight }]}
          >
            {/* Grid Background */}
            <View style={styles.gridContainer}>{renderGrid()}</View>

            {/* Render all items dynamically */}
            {notes.map((note) => renderDraggableItem(note, renderNoteCard))}
            {todos.map((todo) => renderDraggableItem(todo, renderTodoItem))}
            {stickers.map((sticker) => renderDraggableItem(sticker, renderSticker))}
            {images.map((image) => renderDraggableItem(image, renderImage))}
            {tables.map((table) => renderDraggableItem(table, renderTable))}
            {sources.map((source) => renderDraggableItem(source, renderSource))}
            {noteStickers.map((sticker) => renderNoteSticker(sticker))}
          </View>
          {/* Selection Overlay */}
          {selectedType === 'noteSticker' && selectedId && (() => {
            const id = parseInt(selectedId.split('-')[1]);
            const sticker = noteStickers.find(s => s.id === id);
            return sticker ? (
              <Animated.View
                style={{
                  position: 'absolute',
                  width: sticker.size?.width || 200,
                  height: sticker.size?.height || 160,
                  borderWidth: 2,
                  borderColor: '#8B5CF6',
                  pointerEvents: 'none',
                  transform: [
                    { translateX: selectionX.value },
                    { translateY: selectionY.value },
                  ],
                }}
              />
            ) : null;
          })()}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    overflow: 'hidden',
  },
  canvasWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  canvasContent: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: '#1f2937',
    transformOrigin: 'top left',
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  gridDot: {
    position: 'absolute',
    borderRadius: 1,
    backgroundColor: 'rgba(75, 85, 99, 0.4)',
  },
  
  // Zoom controls
  zoomControls: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -80,
    zIndex: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  zoomButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  zoomText: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '500',
    width: 48,
    textAlign: 'center',
  },
  zoomDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#4b5563',
    marginHorizontal: 4,
  },
  
  // Note limit badge
  noteLimitBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 40,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  noteLimitText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  
  // Trash zone
  trashZone: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 50,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  
  // Empty state
  emptyState: {
    position: 'absolute',
    top: CANVAS_HEIGHT / 2 - 100,
    left: CANVAS_WIDTH / 2 - 100,
    width: 200,
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyStateSubtitle: {
    color: '#9ca3af',
    fontSize: 14,
  },
  
  // Note card
  noteCard: {
    flex: 1,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
    borderWidth: 2,
    borderColor: '#fde68a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  noteTitle: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  noteContent: {
    color: '#4b5563',
    fontSize: 14,
  },
  
  // Todo card
  todoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  todoTitle: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  todoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  todoCheckbox: {
    fontSize: 16,
    marginRight: 8,
  },
  todoItemText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  todoItemCompleted: {
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  todoMore: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  
  // Sticker item
  stickerItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerEmoji: {
    fontSize: 32,
  },
  
  // Image card
  imageCard: {
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  imagePlaceholderIcon: {
    fontSize: 32,
  },
  imagePlaceholderText: {
    color: '#6b7280',
    fontSize: 12,
  },
  
  // Table card
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#d1d5db',
    flex: 1,
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  tableBody: {
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    flex: 1,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableCellText: {
    fontSize: 12,
    color: '#4b5563',
  },
  
  // Source card
  sourceCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: '#bfdbfe',
    flex: 1,
  },
  sourceTitle: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  sourceUrl: {
    color: '#60a5fa',
    fontSize: 12,
    marginTop: 4,
  },
  
  // Selected styles
  selectedNoteCard: {
    borderColor: '#8B5CF6',
  },
  selectedNoteSticker: {
    borderColor: '#8b5cf6',
  },
});

export default Canvas;
