import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Dimensions,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ZoomIn, ZoomOut, RotateCcw, Trash2 } from 'lucide-react-native';

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
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [scale, setScale] = useState(1);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(3, prev + 0.25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(0.25, prev - 0.25));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
  }, []);

  // Render a note card
  const renderNoteCard = (note: Note) => (
    <Pressable
      key={note.id}
      onPress={() => onNoteClick?.(note)}
      onLongPress={() => {
        Alert.alert('Delete Note', `Delete "${note.title}"?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteNote(note.id) },
        ]);
      }}
      style={[
        styles.noteCard,
        {
          left: note.position.x,
          top: note.position.y,
          width: note.size?.width || 280,
        },
      ]}
    >
      <Text style={styles.noteTitle} numberOfLines={1}>
        {note.title || 'Untitled'}
      </Text>
      <Text style={styles.noteContent} numberOfLines={4}>
        {note.content || 'Tap to edit...'}
      </Text>
    </Pressable>
  );

  // Render a todo item
  const renderTodoItem = (todo: Todo) => (
    <View
      key={todo.id}
      style={[
        styles.todoCard,
        {
          left: todo.position.x,
          top: todo.position.y,
          width: todo.size?.width || 240,
        },
      ]}
    >
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
  );

  // Render sticker
  const renderSticker = (sticker: Sticker) => (
    <Pressable
      key={sticker.id}
      onLongPress={() => {
        if (deleteSticker) {
          Alert.alert('Delete Sticker', 'Delete this sticker?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteSticker(sticker.id) },
          ]);
        }
      }}
      style={[
        styles.stickerItem,
        {
          left: sticker.position.x,
          top: sticker.position.y,
          width: sticker.size?.width || 60,
          height: sticker.size?.height || 60,
          transform: [{ rotate: `${sticker.rotation || 0}deg` }],
        },
      ]}
    >
      <Text style={styles.stickerEmoji}>{sticker.type || '⭐'}</Text>
    </Pressable>
  );

  // Render image
  const renderImage = (image: Image) => (
    <View
      key={image.id}
      style={[
        styles.imageCard,
        {
          left: image.position.x,
          top: image.position.y,
          width: image.size?.width || 200,
          height: image.size?.height || 150,
        },
      ]}
    >
      <Text style={styles.imagePlaceholderIcon}>🖼️</Text>
      <Text style={styles.imagePlaceholderText}>Image</Text>
    </View>
  );

  // Render table
  const renderTable = (table: Table) => (
    <View
      key={table.id}
      style={[
        styles.tableCard,
        {
          left: table.position.x,
          top: table.position.y,
          width: table.size?.width || 300,
        },
      ]}
    >
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
  );

  // Render source
  const renderSource = (source: Source) => (
    <Pressable
      key={source.id}
      onLongPress={() => {
        if (deleteSource) {
          Alert.alert('Delete Source', 'Delete this source?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteSource(source.id) },
          ]);
        }
      }}
      style={[
        styles.sourceCard,
        {
          left: source.position.x,
          top: source.position.y,
          width: source.size?.width || 220,
        },
      ]}
    >
      <Text style={styles.sourceTitle} numberOfLines={1}>
        🔗 {source.title || source.url}
      </Text>
      <Text style={styles.sourceUrl} numberOfLines={1}>
        {source.url}
      </Text>
    </Pressable>
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
        <Trash2 size={24} color="#EF4444" />
      </Pressable>

      {/* Scrollable Canvas */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ width: CANVAS_WIDTH * scale, height: CANVAS_HEIGHT * scale }}
        maximumZoomScale={3}
        minimumZoomScale={0.25}
        bouncesZoom
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ width: CANVAS_WIDTH * scale, height: CANVAS_HEIGHT * scale }}
        >
          <View style={[styles.canvasContent, { transform: [{ scale }] }]}>
            {/* Grid Background */}
            <View style={styles.gridContainer}>
              {renderGrid()}
            </View>

            {/* Empty State */}
            {notes.length === 0 && stickers.length === 0 && images.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📝</Text>
                <Text style={styles.emptyStateTitle}>Your canvas awaits!</Text>
                <Text style={styles.emptyStateSubtitle}>Tap + to add notes</Text>
              </View>
            )}

            {/* Render all items */}
            {notes.map(renderNoteCard)}
            {todos.map(renderTodoItem)}
            {stickers.map(renderSticker)}
            {images.map(renderImage)}
            {tables.map(renderTable)}
            {sources.map(renderSource)}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
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
    position: 'absolute',
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
    position: 'absolute',
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
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerEmoji: {
    fontSize: 32,
  },
  
  // Image card
  imageCard: {
    position: 'absolute',
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
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
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#d1d5db',
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
    position: 'absolute',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: '#bfdbfe',
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
});

export default Canvas;
