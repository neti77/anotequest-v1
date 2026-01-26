import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  StatusBar,
  Pressable,
  Dimensions,
  StyleSheet,
  Image,
  Share,
  Clipboard,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CanvasInteractionProvider } from './contexts/CanvasInteractionContext';
import {
  Plus,
  FileText,
  CheckSquare,
  Trash2,
  Folder,
  Settings,
  Search,
  X,
  Edit3,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  Pencil,
  Minus,
  ArrowRight,
  Circle,
  ImageIcon,
  Square,
  Table,
  Link,
  ChevronDown,
  Download,
  Sun,
  Moon,
  Undo2,
  Redo2,
  GripVertical,
} from 'lucide-react-native';

// Canvas configuration - initial size (grows dynamically)
const CANVAS_MIN_WIDTH = 1200;
const CANVAS_MIN_HEIGHT = 800;
const CANVAS_PADDING = 300;

// Drawing colors
const DRAWING_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#eab308', '#8b5cf6', '#f97316',
  '#ec4899', '#14b8a6', '#000000', '#6b7280', '#ffffff'
];

// Types
interface Note {
  id: number;
  title: string;
  content: string;
  position: { x: number; y: number };
  createdAt: string;
  images: string[];
  folderId: number | null;
}

interface Folder {
  id: number;
  name: string;
  createdAt: string;
}

interface TrashItem {
  id: number;
  type: string;
  item: any;
  deletedAt: string;
}

interface Stats {
  totalNotes: number;
  totalWords: number;
  xp: number;
  level: 1;
  timeSpent: number;
  battles: number;
  wins: number;
}

interface Todo {
  id: number;
  title: string;
  items: { text: string; completed: boolean }[];
  position: { x: number; y: number };
  folderId: number | null;
  createdAt: string;
}

// Helper functions
const safePosition = (pos: any) =>
  pos && typeof pos.x === 'number' && typeof pos.y === 'number'
    ? pos
    : { x: 100, y: 100 };

const safeSize = (size: any, fallback: { width: number; height: number }) =>
  size && typeof size.width === 'number' && typeof size.height === 'number'
    ? size
    : fallback;

// Draggable wrapper component using Gesture API
const DraggableItem: React.FC<{
  children: React.ReactNode;
  position: { x: number; y: number };
  onPositionChange: (newPos: { x: number; y: number }) => void;
  onDragStart: () => void;
  onDragEnd: (pageX: number, pageY: number) => void;
  scale: number;
  style?: any;
  isDragging: boolean;
  itemType?: string;
}> = ({ children, position, onPositionChange, onDragStart, onDragEnd, scale, style, isDragging, itemType }) => {
  // Use shared values for 60fps animations on UI thread
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(position.x);
  const startY = useSharedValue(position.y);
  const pageXRef = useSharedValue(0);
  const pageYRef = useSharedValue(0);
  const isGestureActive = useSharedValue(false);
  
  // Update start position when prop changes (but NOT while dragging)
  useEffect(() => {
    if (!isGestureActive.value) {
      startX.value = position.x;
      startY.value = position.y;
      translateX.value = 0;
      translateY.value = 0;
    }
  }, [position.x, position.y]);
  
  // Pan gesture with world-space scale compensation
  const panGesture = Gesture.Pan()
    .minDistance(5)
    .onStart(() => {
      'worklet';
      isGestureActive.value = true;
      runOnJS(onDragStart)();
    })
    .onUpdate((e) => {
      'worklet';
      // All drag math in worklet (UI thread) - compensate for canvas scale
      translateX.value = e.translationX / scale;
      translateY.value = e.translationY / scale;
      pageXRef.value = e.absoluteX;
      pageYRef.value = e.absoluteY;
    })
    .onEnd(() => {
      'worklet';
      // Commit final position immediately without spring
      const finalX = startX.value + translateX.value;
      const finalY = startY.value + translateY.value;
      
      // Update shared values synchronously
      startX.value = finalX;
      startY.value = finalY;
      translateX.value = 0;
      translateY.value = 0;
      isGestureActive.value = false;
      
      // Update parent with final position
      runOnJS(onPositionChange)({ x: finalX, y: finalY });
      runOnJS(onDragEnd)(pageXRef.value, pageYRef.value);
    });
  
  // Animated style - runs on UI thread (no spring, direct values)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  // Drag indicator style - purple glow for all items
  const dragStyle = isDragging ? {
    opacity: 0.95,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 15,
    zIndex: 9999,
  } : {};

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          style,
          { left: position.x, top: position.y, position: 'absolute' },
          animatedStyle,
          dragStyle,
          isDragging && {
            borderWidth: 2.5,
            borderColor: '#a78bfa',
            borderRadius: itemType === 'sticker' ? 4 : 16,
          },
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

// BottomDock component with safe area insets
const BottomDock: React.FC<{
  isDarkMode: boolean;
  addNote: () => void;
  addTodo: () => void;
  addNoteSticker: () => void;
  addTable: () => void;
  addImage: () => void;
  addSource: () => void;
  isDrawingMode: boolean;
  setIsDrawingMode: (val: boolean) => void;
  setShowNewFolderModal: (val: boolean) => void;
  setIsTrashOpen: (val: boolean) => void;
  trashZoneRef: any;
  setTrashZoneLayout: (layout: any) => void;
  isOverTrash: boolean;
}> = ({
  isDarkMode,
  addNote,
  addTodo,
  addNoteSticker,
  addTable,
  addImage,
  addSource,
  isDrawingMode,
  setIsDrawingMode,
  setShowNewFolderModal,
  setIsTrashOpen,
  trashZoneRef,
  setTrashZoneLayout,
  isOverTrash,
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[
      styles.bottomDockContainer,
      !isDarkMode && styles.bottomDockContainerLight,
      { paddingBottom: Math.max(insets.bottom, 8) }
    ]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bottomDockScroll}
      >
        <Pressable style={styles.dockButton} onPress={() => addNote()}>
          <View style={[styles.dockButtonInner, !isDarkMode && styles.dockButtonInnerLight]}>
            <Plus size={16} color={isDarkMode ? "#fff" : "#64748b"} />
          </View>
          <Text style={[styles.dockButtonText, !isDarkMode && styles.dockButtonTextLight]}>Note</Text>
        </Pressable>
        
        <Pressable style={styles.dockButton} onPress={addTodo}>
          <View style={[styles.dockButtonInner, !isDarkMode && styles.dockButtonInnerLight]}>
            <CheckSquare size={16} color={isDarkMode ? "#fff" : "#64748b"} />
          </View>
          <Text style={[styles.dockButtonText, !isDarkMode && styles.dockButtonTextLight]}>Todo</Text>
        </Pressable>
        
        <Pressable style={styles.dockButton} onPress={addNoteSticker}>
          <View style={[styles.dockButtonInner, !isDarkMode && styles.dockButtonInnerLight]}>
            <FileText size={16} color={isDarkMode ? "#fff" : "#64748b"} />
          </View>
          <Text style={[styles.dockButtonText, !isDarkMode && styles.dockButtonTextLight]}>Sticker</Text>
        </Pressable>
        
        <Pressable style={styles.dockButton} onPress={() => setShowNewFolderModal(true)}>
          <View style={[styles.dockButtonInner, styles.dockButtonHighlight, !isDarkMode && styles.dockButtonHighlightLight]}>
            <Folder size={16} color="#F59E0B" />
          </View>
          <Text style={[styles.dockButtonText, !isDarkMode && styles.dockButtonTextLight]}>Folder</Text>
        </Pressable>
        
        <Pressable style={styles.dockButton} onPress={addImage}>
          <View style={[styles.dockButtonInner, !isDarkMode && styles.dockButtonInnerLight]}>
            <ImageIcon size={16} color={isDarkMode ? "#fff" : "#64748b"} />
          </View>
          <Text style={[styles.dockButtonText, !isDarkMode && styles.dockButtonTextLight]}>Image</Text>
        </Pressable>
        
        <Pressable style={styles.dockButton} onPress={addTable}>
          <View style={[styles.dockButtonInner, !isDarkMode && styles.dockButtonInnerLight]}>
            <Table size={16} color={isDarkMode ? "#fff" : "#64748b"} />
          </View>
          <Text style={[styles.dockButtonText, !isDarkMode && styles.dockButtonTextLight]}>Table</Text>
        </Pressable>
        
        <Pressable style={styles.dockButton} onPress={addSource}>
          <View style={[styles.dockButtonInner, !isDarkMode && styles.dockButtonInnerLight]}>
            <Link size={16} color={isDarkMode ? "#fff" : "#64748b"} />
          </View>
          <Text style={[styles.dockButtonText, !isDarkMode && styles.dockButtonTextLight]}>Source</Text>
        </Pressable>
        
        <Pressable style={styles.dockButton} onPress={() => setIsDrawingMode(!isDrawingMode)}>
          <View style={[styles.dockButtonInner, isDrawingMode && styles.dockButtonActive, !isDarkMode && styles.dockButtonInnerLight]}>
            <Pencil size={16} color={isDrawingMode ? "#F59E0B" : (isDarkMode ? "#fff" : "#64748b")} />
          </View>
          <Text style={[styles.dockButtonText, !isDarkMode && styles.dockButtonTextLight]}>Draw</Text>
        </Pressable>
        
        <View
          ref={trashZoneRef}
          onLayout={(event) => {
            event.target.measure((x, y, width, height, pageX, pageY) => {
              setTrashZoneLayout({ x: pageX, y: pageY, width, height });
            });
          }}
        >
          <Pressable style={styles.dockButton} onPress={() => setIsTrashOpen(true)}>
            <View style={[
              styles.dockButtonInner, 
              styles.dockButtonTrash, 
              !isDarkMode && styles.dockButtonTrashLight,
              isOverTrash && styles.dockButtonTrashActive,
            ]}>
              <Trash2 size={16} color="#EF4444" />
            </View>
            <Text style={[styles.dockButtonText, !isDarkMode && styles.dockButtonTextLight]}>
              Trash
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

// Canvas with Gesture-based pan and pinch zoom
const CanvasWithGestures: React.FC<any> = ({
  scale,
  setScale,
  draggingItem,
  isDarkMode,
  renderGrid,
  filteredNotes,
  todos,
  filteredStickers,
  tables,
  sources,
  images,
  drawings,
  currentPath,
  canvasSize,
  updateItemPosition,
  setDraggingItem,
  isPositionOverTrash,
  handleDragDelete,
  setIsOverTrash,
  setViewingNote,
  updateTodo,
  setViewingSticker,
  deleteSource,
  deleteImage,
}) => {
  // Shared values for canvas pan
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  
  // Shared values for pinch zoom
  const scaleValue = useSharedValue(scale);
  const savedScale = useSharedValue(scale);
  
  // Update scale when prop changes
  useEffect(() => {
    scaleValue.value = scale;
    savedScale.value = scale;
  }, [scale]);
  
  // Pan gesture - only active when NOT dragging item
  const panGesture = Gesture.Pan()
    .minDistance(12)
    .enabled(!draggingItem)
    .onUpdate((e) => {
      'worklet';
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      'worklet';
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });
  
  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      'worklet';
      const newScale = savedScale.value * e.scale;
      // Clamp between 0.25x and 3x
      scaleValue.value = Math.max(0.25, Math.min(3, newScale));
    })
    .onEnd(() => {
      'worklet';
      savedScale.value = scaleValue.value;
      runOnJS(setScale)(scaleValue.value);
    });
  
  // Combine gestures - pan and pinch can happen simultaneously
  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);
  
  // Animated style for canvas container
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scaleValue.value },
    ],
  }));
  
  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.canvasScrollView, { flex: 1 }]}>
        <Animated.View style={[
          styles.canvasContent,
          !isDarkMode && styles.canvasContentLight,
          { width: canvasSize.width, height: canvasSize.height },
          animatedStyle,
        ]}>
          {/* Grid */}
          <View style={[styles.gridContainer, { width: canvasSize.width, height: canvasSize.height }]}>{renderGrid()}</View>

          {/* Empty State */}
          {filteredNotes.length === 0 && todos.length === 0 && (
            <View style={[styles.emptyState, !isDarkMode && styles.emptyStateLight]}>
              <Text style={styles.emptyStateIcon}>📝</Text>
              <Text style={[styles.emptyStateTitle, !isDarkMode && styles.emptyStateTitleLight]}>Your canvas awaits!</Text>
              <Text style={styles.emptyStateSubtitle}>Tap + to add notes</Text>
            </View>
          )}

          {/* Note Cards - Draggable */}
          {filteredNotes.map((note: any) => (
            <DraggableItem
              key={note.id}
              position={note.position}
              onPositionChange={(newPos) => updateItemPosition('note', note.id, newPos)}
              onDragStart={() => setDraggingItem({ type: 'note', id: note.id })}
              onDragEnd={(pageX, pageY) => {
                if (isPositionOverTrash(pageX, pageY)) {
                  handleDragDelete('note', note.id);
                }
                setDraggingItem(null);
                setIsOverTrash(false);
              }}
              scale={scale}
              style={[styles.noteCard, !isDarkMode && styles.noteCardLight]}
              isDragging={draggingItem?.type === 'note' && draggingItem?.id === note.id}
              itemType="note"
            >
              <Pressable onPress={() => setViewingNote(note)}>
                <View style={[styles.noteCardHeader, !isDarkMode && styles.noteCardHeaderLight]}>
                  <View style={styles.noteCardDrag}>
                    <GripVertical size={14} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
                  </View>
                  <Text style={[styles.noteCardTitle, !isDarkMode && styles.noteCardTitleLight]} numberOfLines={1}>
                    {note.title || 'New Note'}
                  </Text>
                </View>
                <View style={[styles.noteCardBody, !isDarkMode && styles.noteCardBodyLight]}>
                  <Text style={[styles.noteCardContent, !isDarkMode && styles.noteCardContentLight]} numberOfLines={6}>
                    {note.content || 'Tap to view...'}
                  </Text>
                </View>
                <Text style={[styles.noteCardWordCount, !isDarkMode && styles.noteCardWordCountLight]}>
                  {note.content?.split(/\s+/).filter(Boolean).length || 0} words
                </Text>
              </Pressable>
            </DraggableItem>
          ))}

          {/* Yellow Sticky Note Stickers - Draggable */}
          {filteredStickers.map((sticker: any) => (
            <DraggableItem
              key={sticker.id}
              position={sticker.position || { x: 200, y: 200 }}
              onPositionChange={(newPos) => updateItemPosition('sticker', sticker.id, newPos)}
              onDragStart={() => setDraggingItem({ type: 'sticker', id: sticker.id })}
              onDragEnd={(pageX, pageY) => {
                if (isPositionOverTrash(pageX, pageY)) {
                  handleDragDelete('sticker', sticker.id);
                }
                setDraggingItem(null);
                setIsOverTrash(false);
              }}
              scale={scale}
              style={styles.stickyNoteContainer}
              isDragging={draggingItem?.type === 'sticker' && draggingItem?.id === sticker.id}
              itemType="sticker"
            >
              <Pressable onPress={() => setViewingSticker(sticker)}>
                {/* Sticker image */}
                <Image 
                  source={require('./assets/notesticker.png')} 
                  style={styles.stickyNoteImage}
                  resizeMode="contain"
                />
                {/* Text overlay */}
                <View style={styles.stickyNoteTextOverlay}>
                  <Text style={styles.stickyTitle} numberOfLines={1}>
                    {sticker.title || 'Tap to view'}
                  </Text>
                  <Text style={styles.stickyContent} numberOfLines={4}>
                    {sticker.content || ''}
                  </Text>
                </View>
              </Pressable>
            </DraggableItem>
          ))}

          {/* Todo Cards - Draggable */}
          {todos.map((todo: any) => (
            <DraggableItem
              key={todo.id}
              position={todo.position}
              onPositionChange={(newPos) => updateItemPosition('todo', todo.id, newPos)}
              onDragStart={() => setDraggingItem({ type: 'todo', id: todo.id })}
              onDragEnd={(pageX, pageY) => {
                if (isPositionOverTrash(pageX, pageY)) {
                  handleDragDelete('todo', todo.id);
                }
                setDraggingItem(null);
                setIsOverTrash(false);
              }}
              scale={scale}
              style={[styles.todoCard, !isDarkMode && styles.todoCardLight]}
              isDragging={draggingItem?.type === 'todo' && draggingItem?.id === todo.id}
              itemType="todo"
            >
              <View style={[styles.todoHeader, !isDarkMode && styles.todoHeaderLight]}>
                <View style={styles.todoHeaderLeft}>
                  <CheckSquare size={14} color="#8B5CF6" />
                  <Text style={[styles.todoTitle, !isDarkMode && styles.todoTitleLight]}>{todo.title || 'Todo List'}</Text>
                </View>
                <Text style={[styles.todoCount, !isDarkMode && styles.todoCountLight]}>
                  {todo.items?.filter((i: any) => i.completed).length || 0}/{todo.items?.length || 0}
                </Text>
              </View>
              {todo.items?.slice(0, 5).map((item: any, idx: number) => (
                <Pressable
                  key={idx}
                  onPress={() => {
                    const newItems = [...todo.items];
                    newItems[idx] = { ...item, completed: !item.completed };
                    updateTodo(todo.id, { items: newItems });
                  }}
                  style={styles.todoItemRow}
                >
                  <View style={[styles.todoCheckbox, item.completed && styles.todoCheckboxChecked, !isDarkMode && !item.completed && styles.todoCheckboxLight]}>
                    {item.completed && <Text style={styles.todoCheckmark}>✓</Text>}
                  </View>
                  <Text
                    style={[styles.todoItemText, item.completed && styles.todoItemCompleted, !isDarkMode && styles.todoItemTextLight]}
                    numberOfLines={1}
                  >
                    {item.text || 'Add a task...'}
                  </Text>
                </Pressable>
              ))}
            </DraggableItem>
          ))}

          {/* Tables - Draggable */}
          {tables.map((table: any) => (
            <DraggableItem
              key={table.id}
              position={table.position || { x: 200, y: 200 }}
              onPositionChange={(newPos) => updateItemPosition('table', table.id, newPos)}
              onDragStart={() => setDraggingItem({ type: 'table', id: table.id })}
              onDragEnd={(pageX, pageY) => {
                if (isPositionOverTrash(pageX, pageY)) {
                  handleDragDelete('table', table.id);
                }
                setDraggingItem(null);
                setIsOverTrash(false);
              }}
              scale={scale}
              style={[styles.tableCard, !isDarkMode && styles.tableCardLight]}
              isDragging={draggingItem?.type === 'table' && draggingItem?.id === table.id}
              itemType="table"
            >
              <View style={[styles.tableHeader, !isDarkMode && styles.tableHeaderLight]}>
                <Text style={[styles.tableTitle, !isDarkMode && styles.tableTitleLight]} numberOfLines={1}>
                  {table.title || 'Table'}
                </Text>
              </View>
              <View style={styles.tableContent}>
                {table.rows?.map((row: string[], rowIndex: number) => (
                  <View key={rowIndex} style={[styles.tableRow, rowIndex === 0 && styles.tableHeaderRow]}>
                    {row.map((cell: string, cellIndex: number) => (
                      <View key={cellIndex} style={[styles.tableCell, rowIndex === 0 && styles.tableHeaderCell]}>
                        <Text style={[styles.tableCellText, rowIndex === 0 && styles.tableHeaderCellText, !isDarkMode && styles.tableCellTextLight]} numberOfLines={1}>
                          {cell}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </DraggableItem>
          ))}

          {/* Sources - Draggable */}
          {sources.map((source: any) => (
            <DraggableItem
              key={source.id}
              position={source.position || { x: 200, y: 200 }}
              onPositionChange={(newPos) => updateItemPosition('source', source.id, newPos)}
              onDragStart={() => setDraggingItem({ type: 'source', id: source.id })}
              onDragEnd={(pageX, pageY) => {
                if (isPositionOverTrash(pageX, pageY)) {
                  deleteSource(source.id);
                }
                setDraggingItem(null);
                setIsOverTrash(false);
              }}
              scale={scale}
              style={[styles.sourceCard, !isDarkMode && styles.sourceCardLight]}
              isDragging={draggingItem?.type === 'source' && draggingItem?.id === source.id}
              itemType="source"
            >
              <View style={styles.sourceHeader}>
                <Link size={14} color="#3b82f6" />
                <Text style={styles.sourceTitle} numberOfLines={1}>{source.title || 'Source'}</Text>
              </View>
              <Text style={styles.sourceUrl} numberOfLines={2}>{source.url || 'No URL'}</Text>
            </DraggableItem>
          ))}

          {/* Images - Draggable */}
          {images.map((image: any) => (
            <DraggableItem
              key={image.id}
              position={image.position || { x: 200, y: 200 }}
              onPositionChange={(newPos) => updateItemPosition('image', image.id, newPos)}
              onDragStart={() => setDraggingItem({ type: 'image', id: image.id })}
              onDragEnd={(pageX, pageY) => {
                if (isPositionOverTrash(pageX, pageY)) {
                  deleteImage(image.id);
                }
                setDraggingItem(null);
                setIsOverTrash(false);
              }}
              scale={scale}
              style={[styles.imageCard, !isDarkMode && styles.imageCardLight]}
              isDragging={draggingItem?.type === 'image' && draggingItem?.id === image.id}
              itemType="image"
            >
              {image.data ? (
                <Image source={{ uri: image.data }} style={styles.imageContent} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <ImageIcon size={32} color="#9ca3af" />
                  <Text style={styles.imagePlaceholderText}>No image</Text>
                </View>
              )}
            </DraggableItem>
          ))}

          {/* Drawing paths */}
          {drawings.map((drawing: any, pathIndex: number) => (
            <View key={pathIndex} style={styles.drawingPath} pointerEvents="none">
              {drawing.path?.map((point: {x: number, y: number}, pointIndex: number) => (
                <View
                  key={pointIndex}
                  style={[
                    styles.drawingDot,
                    { 
                      left: point.x - (drawing.brushSize || 3), 
                      top: point.y - (drawing.brushSize || 3),
                      width: (drawing.brushSize || 6),
                      height: (drawing.brushSize || 6),
                      borderRadius: (drawing.brushSize || 6) / 2,
                      backgroundColor: drawing.color || '#F59E0B',
                    }
                  ]}
                />
              ))}
            </View>
          ))}

          {/* Current drawing path */}
          {currentPath.map((point: {x: number, y: number}, index: number) => (
            <View
              key={index}
              style={[
                styles.drawingDot,
                { left: point.x - 3, top: point.y - 3 }
              ]}
            />
          ))}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

export default function App() {
  const { width: windowWidth } = useWindowDimensions();
  const headerScale = Math.min(windowWidth / 390, 1.2); // Base on iPhone 12 Pro, max 1.2x
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolder, setActiveFolder] = useState<number | null>(null);
  const [stickers, setStickers] = useState<any[]>([]);
  const [noteStickers, setNoteStickers] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalNotes: 0,
    totalWords: 0,
    xp: 0,
    level: 1,
    timeSpent: 0,
    battles: 0,
    wins: 0,
  });
  const [showNameInput, setShowNameInput] = useState(false);
  const [userName, setUserName] = useState('Adventurer');
  const [nameInputValue, setNameInputValue] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const timeIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [trash, setTrash] = useState<TrashItem[]>([]);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  
  // View vs Edit modes - tap to view first, then edit
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingSticker, setViewingSticker] = useState<any | null>(null);
  const [editingSticker, setEditingSticker] = useState<any | null>(null);
  const [editingStickerTitle, setEditingStickerTitle] = useState('');
  const [editingStickerContent, setEditingStickerContent] = useState('');
  
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [scale, setScale] = useState(1);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawings, setDrawings] = useState<any[]>([]);
  const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([]);
  const [drawingColor, setDrawingColor] = useState('#3b82f6');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  
  // Dynamic canvas size
  const [canvasSize, setCanvasSize] = useState({ width: CANVAS_MIN_WIDTH, height: CANVAS_MIN_HEIGHT });
  
  // Drag and drop state
  const [draggingItem, setDraggingItem] = useState<{ type: string; id: number } | null>(null);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const trashZoneRef = useRef<View>(null);
  const [trashZoneLayout, setTrashZoneLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Undo/Redo history
  const [history, setHistory] = useState<{ notes: Note[], todos: Todo[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const maxHistoryLength = 50;

  // Calculate dynamic canvas size based on content
  useEffect(() => {
    let maxX = 0;
    let maxY = 0;
    
    const consider = (item: any, defaultWidth: number, defaultHeight: number) => {
      if (!item || !item.position) return;
      const width = item.size?.width || defaultWidth;
      const height = item.size?.height || defaultHeight;
      maxX = Math.max(maxX, item.position.x + width);
      maxY = Math.max(maxY, item.position.y + height);
    };
    
    notes.forEach(note => consider(note, 230, 200));
    noteStickers.forEach(sticker => consider(sticker, 170, 170));
    tables.forEach(table => consider(table, 240, 150));
    todos.forEach(todo => consider(todo, 210, 200));
    sources.forEach(source => consider(source, 220, 100));
    images.forEach(image => consider(image, 200, 150));
    
    const targetWidth = Math.max(CANVAS_MIN_WIDTH, maxX + CANVAS_PADDING);
    const targetHeight = Math.max(CANVAS_MIN_HEIGHT, maxY + CANVAS_PADDING);
    
    // Canvas only grows, never shrinks (like freeform)
    setCanvasSize(prev => ({
      width: Math.max(prev.width, targetWidth),
      height: Math.max(prev.height, targetHeight),
    }));
  }, [notes, noteStickers, tables, todos, sources, images]);

  // Save current state to history
  const saveToHistory = useCallback(() => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ notes: [...notes], todos: [...todos] });
      if (newHistory.length > maxHistoryLength) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, maxHistoryLength - 1));
  }, [notes, todos, historyIndex]);

  // Undo action
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNotes(prevState.notes);
      setTodos(prevState.todos);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNotes(nextState.notes);
      setTodos(nextState.todos);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      console.log('Loading data from AsyncStorage...');
      try {
        const load = async (key: string) => {
          const raw = await AsyncStorage.getItem(key);
          return raw ? JSON.parse(raw) : [];
        };

        const loadedNotes = await load('anotequest_notes');
        setNotes(
          loadedNotes.map((n: any) => ({
            ...n,
            position: safePosition(n.position),
          }))
        );

        setFolders(await load('anotequest_folders'));

        const loadedStickers = await load('anotequest_stickers');
        setStickers(
          loadedStickers.map((s: any) => ({
            ...s,
            position: safePosition(s.position),
            rotation: s.rotation ?? 0,
          }))
        );

        const loadedNoteStickers = await load('anotequest_notestickers');
        setNoteStickers(
          loadedNoteStickers.map((s: any) => ({
            ...s,
            position: safePosition(s.position),
          }))
        );

        const loadedTables = await load('anotequest_tables');
        setTables(
          loadedTables.map((t: any) => ({
            ...t,
            position: safePosition(t.position),
          }))
        );

        const loadedTodos = await load('anotequest_todos');
        setTodos(
          loadedTodos.map((t: any) => ({
            ...t,
            position: safePosition(t.position),
          }))
        );

        setCharacters(await load('anotequest_characters'));

        const savedTrash = await AsyncStorage.getItem('anotequest_trash');
        if (savedTrash) setTrash(JSON.parse(savedTrash));

        const savedStats = await AsyncStorage.getItem('anotequest_stats');
        if (savedStats) setStats(JSON.parse(savedStats));

        const savedPremium = await AsyncStorage.getItem('anotequest_premium');
        if (savedPremium) setIsPremium(JSON.parse(savedPremium));

        const savedUserName = await AsyncStorage.getItem('anotequest_username');
        if (savedUserName) {
          setUserName(savedUserName);
        } else {
          setShowNameInput(true);
        }

        setIsLoaded(true);
      } catch (err) {
        console.error('Corrupted AsyncStorage, resetting', err);
        await AsyncStorage.clear();
        setIsLoaded(true);
      }
    };

    loadData();
  }, []);

  // Track time spent
  useEffect(() => {
    if (!isLoaded) return;

    timeIntervalRef.current = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        timeSpent: prev.timeSpent + 1,
      }));
    }, 1000);

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [isLoaded]);

  // Save to AsyncStorage with debounce
  useEffect(() => {
    if (!isLoaded) return;
    const timeout = setTimeout(() => {
      AsyncStorage.setItem('anotequest_notes', JSON.stringify(notes));
    }, 500);
    return () => clearTimeout(timeout);
  }, [notes, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem('anotequest_folders', JSON.stringify(folders));
  }, [folders, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem('anotequest_stickers', JSON.stringify(stickers));
  }, [stickers, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem('anotequest_notestickers', JSON.stringify(noteStickers));
  }, [noteStickers, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem('anotequest_tables', JSON.stringify(tables));
  }, [tables, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem('anotequest_todos', JSON.stringify(todos));
  }, [todos, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem('anotequest_characters', JSON.stringify(characters));
  }, [characters, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem('anotequest_stats', JSON.stringify(stats));
  }, [stats, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem('anotequest_trash', JSON.stringify(trash));
  }, [trash, isLoaded]);

  // Free tier limit
  const FREE_NOTE_LIMIT = 100;

  // Note functions
  const addNote = useCallback((noteData?: Partial<Note>) => {
    // Check note limit for free users
    if (!isPremium && notes.length >= FREE_NOTE_LIMIT) {
      Alert.alert(
        'Note Limit Reached',
        `You've reached the free limit of ${FREE_NOTE_LIMIT} notes. Upgrade to Pro for unlimited notes!`,
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade', style: 'default', onPress: () => {
            // TODO: Navigate to upgrade screen
            Alert.alert('Coming Soon', 'Pro upgrade will be available soon!');
          }},
        ]
      );
      return null;
    }
    
    saveToHistory();
    const newNote: Note = {
      id: Date.now(),
      title: noteData?.title || '',
      content: noteData?.content || '',
      position: noteData?.position || { x: 150 + Math.random() * 200, y: 150 + Math.random() * 200 },
      createdAt: new Date().toISOString(),
      images: [],
      folderId: activeFolder,
    };
    setNotes((prev) => [...prev, newNote]);
    setEditingNote(newNote);
    setStats((prev) => ({ ...prev, totalNotes: prev.totalNotes + 1, xp: prev.xp + 10 }));
    return newNote;
  }, [activeFolder, saveToHistory, isPremium, notes.length]);

  const updateNote = useCallback((id: number, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    );
  }, []);

  const deleteNote = useCallback((id: number) => {
    saveToHistory();
    const noteToDelete = notes.find((n) => n.id === id);
    if (noteToDelete) {
      setTrash((prev) => [
        ...prev,
        { id: Date.now(), type: 'note', item: noteToDelete, deletedAt: new Date().toISOString() },
      ]);
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, [notes, saveToHistory]);

  // Todo functions
  const addTodo = useCallback(() => {
    saveToHistory();
    const newTodo: Todo = {
      id: Date.now(),
      title: 'New Checklist',
      items: [{ text: '', completed: false }],
      position: { x: 200 + Math.random() * 200, y: 200 + Math.random() * 200 },
      folderId: activeFolder,
      createdAt: new Date().toISOString(),
    };
    setTodos((prev) => [...prev, newTodo]);
  }, [activeFolder, saveToHistory]);

  const updateTodo = useCallback((id: number, updates: Partial<Todo>) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const deleteTodo = useCallback((id: number) => {
    saveToHistory();
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, [saveToHistory]);

  // Note Sticker functions
  const addNoteSticker = useCallback(() => {
    saveToHistory();
    const newSticker = {
      id: Date.now(),
      title: 'New Sticker',
      content: '',
      position: { x: 180 + Math.random() * 200, y: 180 + Math.random() * 200 },
      folderId: activeFolder,
      createdAt: new Date().toISOString(),
    };
    setNoteStickers((prev) => [...prev, newSticker]);
  }, [activeFolder, saveToHistory]);

  const updateNoteSticker = useCallback((id: number, updates: any) => {
    setNoteStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const deleteNoteSticker = useCallback((id: number) => {
    saveToHistory();
    setNoteStickers((prev) => prev.filter((s) => s.id !== id));
  }, [saveToHistory]);

  // Table functions
  const addTable = useCallback(() => {
    saveToHistory();
    const newTable = {
      id: Date.now(),
      title: 'New Table',
      rows: [
        ['Header 1', 'Header 2', 'Header 3'],
        ['Cell 1', 'Cell 2', 'Cell 3'],
        ['Cell 4', 'Cell 5', 'Cell 6'],
      ],
      position: { x: 220 + Math.random() * 150, y: 220 + Math.random() * 150 },
      folderId: activeFolder,
      createdAt: new Date().toISOString(),
    };
    setTables((prev) => [...prev, newTable]);
  }, [activeFolder, saveToHistory]);

  // Image functions
  const addImage = useCallback(async () => {
    // For now, create a placeholder - full image picker would need expo-image-picker
    Alert.alert(
      'Add Image',
      'Image picker requires additional setup. For now, a placeholder will be created.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add Placeholder', 
          onPress: () => {
            const newImage = {
              id: Date.now(),
              data: null, // Would be base64 data
              position: { x: 200 + Math.random() * 150, y: 200 + Math.random() * 150 },
              size: { width: 200, height: 150 },
              folderId: activeFolder,
              createdAt: new Date().toISOString(),
            };
            setImages((prev) => [...prev, newImage]);
          }
        },
      ]
    );
  }, [activeFolder]);

  const deleteImage = useCallback((id: number) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // Source functions
  const addSource = useCallback(() => {
    setShowSourceModal(true);
  }, []);

  const createSource = useCallback(() => {
    if (!newSourceTitle.trim() && !newSourceUrl.trim()) {
      Alert.alert('Error', 'Please enter a title or URL');
      return;
    }
    const newSource = {
      id: Date.now(),
      title: newSourceTitle.trim() || 'New Source',
      url: newSourceUrl.trim(),
      position: { x: 200 + Math.random() * 150, y: 200 + Math.random() * 150 },
      folderId: activeFolder,
      createdAt: new Date().toISOString(),
    };
    setSources((prev) => [...prev, newSource]);
    setNewSourceTitle('');
    setNewSourceUrl('');
    setShowSourceModal(false);
  }, [newSourceTitle, newSourceUrl, activeFolder]);

  const deleteSource = useCallback((id: number) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Folder functions
  const addFolder = useCallback(() => {
    if (!newFolderName.trim()) return;
    const newFolder: Folder = {
      id: Date.now(),
      name: newFolderName.trim(),
      createdAt: new Date().toISOString(),
    };
    setFolders((prev) => [...prev, newFolder]);
    setNewFolderName('');
    setShowNewFolderModal(false);
  }, [newFolderName]);

  const deleteFolder = useCallback((id: number) => {
    // Move all notes in this folder to "All Notes"
    setNotes((prev) => prev.map(n => n.folderId === id ? { ...n, folderId: null } : n));
    setNoteStickers((prev) => prev.map(s => s.folderId === id ? { ...s, folderId: null } : s));
    setTodos((prev) => prev.map(t => t.folderId === id ? { ...t, folderId: null } : t));
    setTables((prev) => prev.map(t => t.folderId === id ? { ...t, folderId: null } : t));
    setSources((prev) => prev.map(s => s.folderId === id ? { ...s, folderId: null } : s));
    setImages((prev) => prev.map(i => i.folderId === id ? { ...i, folderId: null } : i));
    
    // Remove the folder
    setFolders((prev) => prev.filter((f) => f.id !== id));
    
    // If we were viewing this folder, go back to All Notes
    if (activeFolder === id) {
      setActiveFolder(null);
    }
    
    Alert.alert('Deleted', 'Folder deleted. Items moved to All Notes.');
  }, [activeFolder]);

  // Export functions
  const generateExportText = useCallback(() => {
    let text = `AnoteQuest Notes\n`;
    text += `==================\n`;
    text += `User: ${userName}\n`;
    text += `Exported: ${new Date().toLocaleString()}\n\n`;

    if (notes.length > 0) {
      text += `📝 NOTES (${notes.length})\n`;
      text += `${'='.repeat(30)}\n\n`;
      notes.forEach((note, index) => {
        text += `[${index + 1}] ${note.title || 'Untitled Note'}\n`;
        text += `${'-'.repeat(30)}\n`;
        text += `${note.content || '(No content)'}\n\n`;
      });
    }

    if (todos.length > 0) {
      text += `\n✅ TODOS (${todos.length})\n`;
      text += `${'='.repeat(30)}\n\n`;
      todos.forEach((todo, index) => {
        text += `[${index + 1}] ${todo.title || 'Checklist'}\n`;
        todo.items?.forEach((item: any) => {
          text += `  ${item.completed ? '☑' : '☐'} ${item.text || '(empty)'}\n`;
        });
        text += '\n';
      });
    }

    if (noteStickers.length > 0) {
      text += `\n📌 STICKERS (${noteStickers.length})\n`;
      text += `${'='.repeat(30)}\n\n`;
      noteStickers.forEach((sticker, index) => {
        text += `[${index + 1}] ${sticker.title || 'Sticker'}\n`;
        if (sticker.content) text += `${sticker.content}\n`;
        text += '\n';
      });
    }

    if (tables.length > 0) {
      text += `\n📊 TABLES (${tables.length})\n`;
      text += `${'='.repeat(30)}\n\n`;
      tables.forEach((table, index) => {
        text += `[${index + 1}] ${table.title || 'Table'}\n`;
        table.rows?.forEach((row: string[]) => {
          text += `| ${row.join(' | ')} |\n`;
        });
        text += '\n';
      });
    }

    return text;
  }, [notes, todos, noteStickers, tables, userName]);

  const exportAsText = useCallback(async () => {
    try {
      const text = generateExportText();
      await Share.share({
        message: text,
        title: `AnoteQuest Export - ${userName}`,
      });
      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Could not export your notes.');
    }
  }, [generateExportText, userName]);

  const copyToClipboard = useCallback(async () => {
    try {
      const text = generateExportText();
      Clipboard.setString(text);
      Alert.alert('Copied!', 'Your notes have been copied to clipboard.');
      setShowExportModal(false);
    } catch (error) {
      console.error('Copy error:', error);
      Alert.alert('Copy Failed', 'Could not copy to clipboard.');
    }
  }, [generateExportText]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(3, prev + 0.25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(0.25, prev - 0.25));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
  }, []);

  // Save username
  const saveUserName = useCallback(() => {
    if (nameInputValue.trim()) {
      setUserName(nameInputValue.trim());
      AsyncStorage.setItem('anotequest_username', nameInputValue.trim());
    }
    setShowNameInput(false);
  }, [nameInputValue]);

  // Check if position is over trash zone
  const isPositionOverTrash = useCallback((pageX: number, pageY: number) => {
    const { x, y, width, height } = trashZoneLayout;
    return pageX >= x && pageX <= x + width && pageY >= y && pageY <= y + height;
  }, [trashZoneLayout]);

  // Handle item deletion by drag
  const handleDragDelete = useCallback((type: string, id: number) => {
    saveToHistory();
    if (type === 'note') {
      const noteToDelete = notes.find((n) => n.id === id);
      if (noteToDelete) {
        setTrash((prev) => [
          ...prev,
          { id: Date.now(), type: 'note', item: noteToDelete, deletedAt: new Date().toISOString() },
        ]);
      }
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } else if (type === 'sticker') {
      const stickerToDelete = noteStickers.find((s) => s.id === id);
      if (stickerToDelete) {
        setTrash((prev) => [
          ...prev,
          { id: Date.now(), type: 'sticker', item: stickerToDelete, deletedAt: new Date().toISOString() },
        ]);
      }
      setNoteStickers((prev) => prev.filter((s) => s.id !== id));
    } else if (type === 'todo') {
      const todoToDelete = todos.find((t) => t.id === id);
      if (todoToDelete) {
        setTrash((prev) => [
          ...prev,
          { id: Date.now(), type: 'todo', item: todoToDelete, deletedAt: new Date().toISOString() },
        ]);
      }
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } else if (type === 'table') {
      const tableToDelete = tables.find((t) => t.id === id);
      if (tableToDelete) {
        setTrash((prev) => [
          ...prev,
          { id: Date.now(), type: 'table', item: tableToDelete, deletedAt: new Date().toISOString() },
        ]);
      }
      setTables((prev) => prev.filter((t) => t.id !== id));
    } else if (type === 'source') {
      setSources((prev) => prev.filter((s) => s.id !== id));
    } else if (type === 'image') {
      setImages((prev) => prev.filter((i) => i.id !== id));
    }
    setDraggingItem(null);
  }, [notes, noteStickers, todos, tables, saveToHistory]);

  // Update item position
  const updateItemPosition = useCallback((type: string, id: number, newPosition: { x: number, y: number }) => {
    // Ensure position is not negative
    const safePos = {
      x: Math.max(0, newPosition.x),
      y: Math.max(0, newPosition.y),
    };
    
    if (type === 'note') {
      setNotes((prev) => prev.map((n) => n.id === id ? { ...n, position: safePos } : n));
    } else if (type === 'sticker') {
      setNoteStickers((prev) => prev.map((s) => s.id === id ? { ...s, position: safePos } : s));
    } else if (type === 'todo') {
      setTodos((prev) => prev.map((t) => t.id === id ? { ...t, position: safePos } : t));
    } else if (type === 'table') {
      setTables((prev) => prev.map((t) => t.id === id ? { ...t, position: safePos } : t));
    } else if (type === 'source') {
      setSources((prev) => prev.map((s) => s.id === id ? { ...s, position: safePos } : s));
    } else if (type === 'image') {
      setImages((prev) => prev.map((i) => i.id === id ? { ...i, position: safePos } : i));
    }
  }, []);

  // Filtered notes based on active folder and search
  const filteredNotes = notes.filter((note) => {
    const inFolder = activeFolder === null || note.folderId === activeFolder;
    const matchesSearch =
      !searchQuery ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    return inFolder && matchesSearch;
  });

  // Filtered stickers based on active folder
  const filteredStickers = noteStickers.filter((sticker) => {
    return activeFolder === null || sticker.folderId === activeFolder;
  });

  // Render grid dots based on canvas size
  const renderGrid = useCallback(() => {
    const dots: React.ReactNode[] = [];
    const step = 50;
    const cols = Math.ceil(canvasSize.width / step);
    const rows = Math.ceil(canvasSize.height / step);
    // Limit for performance
    const maxDots = Math.min(cols, 60);
    const maxRows = Math.min(rows, 60);
    
    for (let i = 0; i < maxDots; i++) {
      for (let j = 0; j < maxRows; j++) {
        dots.push(
          <View
            key={`dot-${i}-${j}`}
            style={[styles.gridDot, { left: i * step, top: j * step }]}
          />
        );
      }
    }
    return dots;
  }, [canvasSize]);

  // State for sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Loading screen
  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading your notes...</Text>
      </View>
    );
  }

  const activeFolderName = activeFolder 
    ? folders.find(f => f.id === activeFolder)?.name || 'Folder'
    : 'All Notes';

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <CanvasInteractionProvider>
          <SafeAreaView style={[styles.container, !isDarkMode && styles.containerLight]} edges={['top', 'left', 'right']}>
          <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

        {/* ===== HEADER ===== */}
        <View style={[styles.header, !isDarkMode && styles.headerLight]}>
          {/* Logo */}
          <View style={[styles.headerLogo, { width: 30 * headerScale, height: 30 * headerScale, borderRadius: 6 * headerScale }]}>
            <Image source={require('./assets/logo.png')} style={[styles.logoImage, { width: 30 * headerScale, height: 30 * headerScale, borderRadius: 6 * headerScale }]} resizeMode="contain" />
          </View>
          
          <View style={{ width: 8 }} />
          
          {/* Folder Dropdown */}
          <View style={styles.folderDropdownWrapper}>
            <Pressable 
              style={[styles.folderDropdown, !isDarkMode && styles.folderDropdownLight, {
                paddingHorizontal: 10 * headerScale,
                paddingVertical: 6 * headerScale,
                borderRadius: 8 * headerScale,
                gap: 4 * headerScale,
                minWidth: 80 * headerScale,
                maxWidth: 140 * headerScale,
              }]}
              onPress={() => setShowFolderDropdown(!showFolderDropdown)}
            >
              <Folder size={Math.round(14 * headerScale)} color="#8B5CF6" />
              <Text style={[styles.folderDropdownText, !isDarkMode && styles.folderDropdownTextLight, { fontSize: 13 * headerScale }]} numberOfLines={1}>
                {activeFolderName}
              </Text>
              <ChevronDown size={Math.round(12 * headerScale)} color={isDarkMode ? "#6B7280" : "#9CA3AF"} style={showFolderDropdown && { transform: [{ rotate: '180deg' }] }} />
            </Pressable>
            
            {/* Dropdown Menu */}
            {showFolderDropdown && (
              <View style={[styles.folderDropdownMenu, !isDarkMode && styles.folderDropdownMenuLight]}>
                <Pressable 
                  style={[styles.folderDropdownItem, !activeFolder && styles.folderDropdownItemActive]}
                  onPress={() => { setActiveFolder(null); setShowFolderDropdown(false); }}
                >
                  <Folder size={14} color={!activeFolder ? "#8B5CF6" : (isDarkMode ? "#9CA3AF" : "#64748b")} />
                  <Text style={[styles.folderDropdownItemText, !isDarkMode && styles.folderDropdownItemTextLight, !activeFolder && styles.folderDropdownItemTextActive]}>All Notes</Text>
                </Pressable>
                {folders.map((folder) => (
                  <Pressable 
                    key={folder.id}
                    style={[styles.folderDropdownItem, activeFolder === folder.id && styles.folderDropdownItemActive]}
                    onPress={() => { setActiveFolder(folder.id); setShowFolderDropdown(false); }}
                  >
                    <Folder size={14} color={activeFolder === folder.id ? "#8B5CF6" : (isDarkMode ? "#9CA3AF" : "#64748b")} />
                    <Text style={[styles.folderDropdownItemText, !isDarkMode && styles.folderDropdownItemTextLight, activeFolder === folder.id && styles.folderDropdownItemTextActive]} numberOfLines={1}>{folder.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          
          {/* Flexible spacer */}
          <View style={{ flex: 1 }} />
          
          {/* Middle: Search, Undo, Redo */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pressable style={[styles.headerIconButton, { width: 28 * headerScale, height: 28 * headerScale, borderRadius: 6 * headerScale }]} onPress={() => setShowSearchModal(true)}>
              <Search size={Math.round(16 * headerScale)} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            </Pressable>
            <Pressable 
              style={[styles.headerIconButton, { width: 28 * headerScale, height: 28 * headerScale, borderRadius: 6 * headerScale }, historyIndex <= 0 && styles.headerIconButtonDisabled]} 
              onPress={handleUndo}
              disabled={historyIndex <= 0}
            >
              <Undo2 size={Math.round(16 * headerScale)} color={historyIndex > 0 ? (isDarkMode ? "#9CA3AF" : "#6B7280") : (isDarkMode ? "#4B5563" : "#CBD5E1")} />
            </Pressable>
            <Pressable 
              style={[styles.headerIconButton, { width: 28 * headerScale, height: 28 * headerScale, borderRadius: 6 * headerScale }, historyIndex >= history.length - 1 && styles.headerIconButtonDisabled]} 
              onPress={handleRedo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo2 size={Math.round(16 * headerScale)} color={historyIndex < history.length - 1 ? (isDarkMode ? "#9CA3AF" : "#6B7280") : (isDarkMode ? "#4B5563" : "#CBD5E1")} />
            </Pressable>
          </View>
          
          {/* Flexible spacer */}
          <View style={{ flex: 1 }} />
          
          {/* Right: Theme toggle + Export + Note count */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pressable 
              style={[styles.headerIconButton, { width: 28 * headerScale, height: 28 * headerScale, borderRadius: 6 * headerScale }, styles.themeToggleButton, !isDarkMode && styles.themeToggleButtonLight]} 
              onPress={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? <Sun size={Math.round(16 * headerScale)} color="#F59E0B" /> : <Moon size={Math.round(16 * headerScale)} color="#64748B" />}
            </Pressable>
            
            <Pressable style={[styles.headerIconButton, { width: 28 * headerScale, height: 28 * headerScale, borderRadius: 6 * headerScale }]} onPress={() => setShowExportModal(true)}>
              <Download size={Math.round(16 * headerScale)} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            </Pressable>
            
            <View style={[
              { paddingHorizontal: 6 * headerScale, paddingVertical: 3 * headerScale, borderRadius: 8 * headerScale, minWidth: 20 * headerScale },
              styles.headerNoteCount, 
              !isDarkMode && styles.headerNoteCountLight,
              notes.length >= 61 && styles.headerNoteCountRed,
              notes.length >= 40 && notes.length <= 60 && styles.headerNoteCountYellow,
              notes.length < 40 && styles.headerNoteCountGreen,
            ]}>
              <Text style={[
                styles.headerNoteCountText,
                { fontSize: 11 * headerScale },
                notes.length >= 61 && styles.headerNoteCountTextRed,
                notes.length >= 40 && notes.length <= 60 && styles.headerNoteCountTextYellow,
                notes.length < 40 && styles.headerNoteCountTextGreen,
              ]}>{notes.length}{!isPremium && `/${FREE_NOTE_LIMIT}`}</Text>
            </View>
          </View>
        </View>

        {/* ===== MAIN CONTENT AREA ===== */}
        <View style={styles.mainContent}>
          {/* ===== CANVAS AREA ===== */}
          <View style={styles.canvasArea}>
            {/* Canvas with Gesture-based pan/zoom */}
            <CanvasWithGestures
              scale={scale}
              setScale={setScale}
              draggingItem={draggingItem}
              isDarkMode={isDarkMode}
              renderGrid={renderGrid}
              filteredNotes={filteredNotes}
              todos={todos}
              filteredStickers={filteredStickers}
              tables={tables}
              sources={sources}
              images={images}
              drawings={drawings}
              currentPath={currentPath}
              canvasSize={canvasSize}
              updateItemPosition={updateItemPosition}
              setDraggingItem={setDraggingItem}
              isPositionOverTrash={isPositionOverTrash}
              handleDragDelete={handleDragDelete}
              setIsOverTrash={setIsOverTrash}
              setViewingNote={setViewingNote}
              updateTodo={updateTodo}
              setViewingSticker={setViewingSticker}
              deleteSource={deleteSource}
              deleteImage={deleteImage}
            />
          </View>
        </View>

        {/* Drawing Mode Toolbar - like frontend with pen/eraser/colors */}
        {isDrawingMode && (
          <View style={styles.drawingToolbar}>
            {/* Pen/Eraser Toggle */}
            <View style={styles.drawingToolGroup}>
              <Pressable
                style={[styles.drawingToolButton, !isEraser && styles.drawingToolButtonActive]}
                onPress={() => setIsEraser(false)}
              >
                <Pencil size={18} color={!isEraser ? "#fff" : "#94a3b8"} />
              </Pressable>
              <Pressable
                style={[styles.drawingToolButton, isEraser && styles.drawingToolButtonActive]}
                onPress={() => setIsEraser(true)}
              >
                <Eraser size={18} color={isEraser ? "#fff" : "#94a3b8"} />
              </Pressable>
            </View>
            
            {/* Color Palette */}
            <View style={styles.drawingColorPalette}>
              {DRAWING_COLORS.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.drawingColorOption,
                    { backgroundColor: color, borderColor: color === '#ffffff' ? '#94a3b8' : color },
                    drawingColor === color && styles.drawingColorOptionActive,
                  ]}
                  onPress={() => { setDrawingColor(color); setIsEraser(false); }}
                />
              ))}
            </View>
            
            {/* Brush Size */}
            <View style={styles.drawingBrushSize}>
              {[2, 4, 8, 12].map((size) => (
                <Pressable
                  key={size}
                  style={[styles.drawingBrushButton, brushSize === size && styles.drawingBrushButtonActive]}
                  onPress={() => setBrushSize(size)}
                >
                  <View style={[styles.drawingBrushDot, { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 }]} />
                </Pressable>
              ))}
            </View>
            
            {/* Close */}
            <Pressable style={styles.drawingCloseButton} onPress={() => setIsDrawingMode(false)}>
              <X size={20} color="#fff" />
            </Pressable>
          </View>
        )}
              }
            }}
          >
            <View style={styles.drawingModeIndicator}>
              <Pencil size={16} color="#F59E0B" />
              <Text style={styles.drawingModeText}>Drawing Mode - Tap outside to exit</Text>
              <Pressable onPress={() => setIsDrawingMode(false)} style={styles.drawingModeClose}>
                <X size={16} color="#fff" />
              </Pressable>
            </View>
            
            {/* Render current drawing */}
            {currentPath.map((point, index) => (
              <View
                key={index}
                style={[
                  styles.drawingDot,
                  { left: point.x - 3, top: point.y - 3, backgroundColor: '#F59E0B' }
                ]}
              />
            ))}
            
            {/* Render saved drawings */}
            {drawings.map((path, pathIndex) => (
              path.points.map((point: {x: number, y: number}, pointIndex: number) => (
                <View
                  key={`${pathIndex}-${pointIndex}`}
                  style={[
                    styles.drawingDot,
                    { left: point.x - 3, top: point.y - 3, backgroundColor: path.color }
                  ]}
                />
              ))
            ))}
            
            {/* Clear drawings button */}
            <Pressable 
              style={styles.clearDrawingsBtn}
              onPress={() => setDrawings([])}
            >
              <Trash2 size={16} color="#EF4444" />
              <Text style={styles.clearDrawingsText}>Clear</Text>
            </Pressable>
          </View>
        )}

        {/* ===== BOTTOM DOCK (Scrollable) ===== */}
        <BottomDock 
          isDarkMode={isDarkMode}
          addNote={addNote}
          addTodo={addTodo}
          addNoteSticker={addNoteSticker}
          addTable={addTable}
          isDrawingMode={isDrawingMode}
          setIsDrawingMode={setIsDrawingMode}
          setShowNewFolderModal={setShowNewFolderModal}
          setIsTrashOpen={setIsTrashOpen}
          trashZoneRef={trashZoneRef}
          setTrashZoneLayout={setTrashZoneLayout}
          isOverTrash={isOverTrash}
        />

        {/* Drag indicator when dragging */}
        {draggingItem && (
          <View style={styles.dragIndicator}>
            <Text style={styles.dragIndicatorText}>
              Drag to 🗑️ Trash to delete
            </Text>
          </View>
        )}

        {/* ===== NOTE EDITOR MODAL ===== */}
        <Modal visible={editingNote !== null} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.noteEditorModal}>
              <View style={styles.noteEditorHeader}>
                <View style={styles.noteEditorDragHandle}>
                  <GripVertical size={16} color="#6B7280" />
                </View>
                <Text style={styles.noteEditorTitle}>
                  {editingNote?.title || 'New Note'}
                </Text>
                <Pressable onPress={() => setEditingNote(null)} style={styles.noteEditorClose}>
                  <X size={20} color="#9CA3AF" />
                </Pressable>
              </View>
              {editingNote && (
                <View style={styles.noteEditorContent}>
                  <TextInput
                    style={styles.noteTitleInput}
                    value={editingNote.title}
                    onChangeText={(text) => {
                      setEditingNote({ ...editingNote, title: text });
                      updateNote(editingNote.id, { title: text });
                    }}
                    placeholder="Add Task"
                    placeholderTextColor="#6b7280"
                  />
                  <TextInput
                    style={styles.noteContentInput}
                    value={editingNote.content}
                    onChangeText={(text) => {
                      setEditingNote({ ...editingNote, content: text });
                      updateNote(editingNote.id, { content: text });
                    }}
                    placeholder="Click to start writing..."
                    placeholderTextColor="#6b7280"
                    multiline
                    textAlignVertical="top"
                  />
                  <Text style={styles.noteWordCount}>
                    {editingNote.content?.split(/\s+/).filter(Boolean).length || 0} words
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* ===== STICKER EDITOR MODAL ===== */}
        <Modal visible={editingSticker !== null} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.noteEditorModal, { backgroundColor: '#FEF3C7' }]}>
              <View style={[styles.noteEditorHeader, { backgroundColor: '#FDE68A' }]}>
                <View style={styles.noteEditorDragHandle}>
                  <GripVertical size={16} color="#92400E" />
                </View>
                <Text style={[styles.noteEditorTitle, { color: '#92400E' }]}>
                  Edit Sticker
                </Text>
                <Pressable 
                  onPress={() => {
                    if (editingSticker) {
                      updateNoteSticker(editingSticker.id, { 
                        title: editingStickerTitle, 
                        content: editingStickerContent 
                      });
                    }
                    setEditingSticker(null);
                  }} 
                  style={styles.noteEditorClose}
                >
                  <X size={20} color="#92400E" />
                </Pressable>
              </View>
              <View style={styles.noteEditorContent}>
                <TextInput
                  style={[styles.noteTitleInput, { color: '#92400E', borderBottomColor: '#FCD34D' }]}
                  value={editingStickerTitle}
                  onChangeText={(text) => {
                    setEditingStickerTitle(text);
                  }}
                  placeholder="Sticker title..."
                  placeholderTextColor="#B45309"
                />
                <TextInput
                  style={[styles.noteContentInput, { color: '#78350F' }]}
                  value={editingStickerContent}
                  onChangeText={(text) => {
                    setEditingStickerContent(text);
                  }}
                  placeholder="Write your note here..."
                  placeholderTextColor="#B45309"
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* ===== FOLDER DROPDOWN MODAL ===== */}
        <Modal visible={showFolderDropdown} animationType="fade" transparent>
          <Pressable style={styles.dropdownOverlay} onPress={() => setShowFolderDropdown(false)}>
            <View style={styles.folderDropdownMenu}>
              <Pressable 
                style={[styles.folderMenuItem, !activeFolder && styles.folderMenuItemActive]}
                onPress={() => { setActiveFolder(null); setShowFolderDropdown(false); }}
              >
                <Folder size={16} color={!activeFolder ? "#F59E0B" : "#9CA3AF"} />
                <Text style={[styles.folderMenuItemText, !activeFolder && styles.folderMenuItemTextActive]}>
                  All Notes
                </Text>
              </Pressable>
              {folders.map(folder => (
                <Pressable 
                  key={folder.id}
                  style={[styles.folderMenuItem, activeFolder === folder.id && styles.folderMenuItemActive]}
                  onPress={() => { setActiveFolder(folder.id); setShowFolderDropdown(false); }}
                >
                  <Folder size={16} color={activeFolder === folder.id ? "#F59E0B" : "#9CA3AF"} />
                  <Text style={[styles.folderMenuItemText, activeFolder === folder.id && styles.folderMenuItemTextActive]}>
                    {folder.name}
                  </Text>
                </Pressable>
              ))}
              <View style={styles.folderMenuDivider} />
              <Pressable 
                style={styles.folderMenuItem}
                onPress={() => { setShowFolderDropdown(false); setShowNewFolderModal(true); }}
              >
                <Plus size={16} color="#8B5CF6" />
                <Text style={[styles.folderMenuItemText, { color: '#8B5CF6' }]}>New Folder</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* ===== NEW FOLDER MODAL ===== */}
        <Modal visible={showNewFolderModal} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.nameModalContent}>
              <Text style={styles.nameModalTitle}>Create New Folder</Text>
              <TextInput
                style={styles.nameInput}
                value={newFolderName}
                onChangeText={setNewFolderName}
                placeholder="Folder name..."
                placeholderTextColor="#6b7280"
                autoFocus
              />
              <View style={styles.modalButtonRow}>
                <Pressable style={styles.modalCancelButton} onPress={() => setShowNewFolderModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.nameSubmitButton} onPress={addFolder}>
                  <Text style={styles.nameSubmitText}>Create</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* ===== SEARCH MODAL ===== */}
        <Modal visible={showSearchModal} animationType="fade" transparent>
          <Pressable style={styles.searchModalOverlay} onPress={() => setShowSearchModal(false)}>
            <Pressable style={[styles.searchModalContent, !isDarkMode && styles.searchModalContentLight]} onPress={(e) => e.stopPropagation()}>
              <View style={styles.searchModalHeader}>
                <Search size={20} color="#8B5CF6" />
                <TextInput
                  style={[styles.searchInput, !isDarkMode && styles.searchInputLight]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search notes..."
                  placeholderTextColor={isDarkMode ? "#6b7280" : "#9CA3AF"}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <X size={18} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
                  </Pressable>
                )}
              </View>
              
              {/* Search Results */}
              {searchQuery.length > 0 && (
                <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
                  {filteredNotes.length > 0 ? (
                    filteredNotes.map((note) => (
                      <Pressable 
                        key={note.id} 
                        style={[styles.searchResultItem, !isDarkMode && styles.searchResultItemLight]}
                        onPress={() => {
                          setEditingNote(note);
                          setShowSearchModal(false);
                          setSearchQuery('');
                        }}
                      >
                        <Text style={[styles.searchResultTitle, !isDarkMode && styles.searchResultTitleLight]} numberOfLines={1}>
                          {note.title || 'Untitled Note'}
                        </Text>
                        <Text style={[styles.searchResultContent, !isDarkMode && styles.searchResultContentLight]} numberOfLines={2}>
                          {note.content || 'No content'}
                        </Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text style={[styles.searchNoResults, !isDarkMode && styles.searchNoResultsLight]}>
                      No notes found matching "{searchQuery}"
                    </Text>
                  )}
                </ScrollView>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* ===== EXPORT MODAL ===== */}
        <Modal visible={showExportModal} animationType="fade" transparent>
          <Pressable style={styles.modalOverlay} onPress={() => setShowExportModal(false)}>
            <Pressable style={[styles.exportModalContent, !isDarkMode && styles.exportModalContentLight]} onPress={(e) => e.stopPropagation()}>
              <View style={styles.exportModalHeader}>
                <Download size={24} color="#8B5CF6" />
                <Text style={[styles.exportModalTitle, !isDarkMode && styles.exportModalTitleLight]}>Export Your Notes</Text>
                <Pressable onPress={() => setShowExportModal(false)} style={styles.exportModalClose}>
                  <X size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                </Pressable>
              </View>
              
              <Text style={[styles.exportModalSubtitle, !isDarkMode && styles.exportModalSubtitleLight]}>
                Export {notes.length} notes, {todos.length} todos, {noteStickers.length} stickers, and {tables.length} tables
              </Text>
              
              <View style={styles.exportOptions}>
                <Pressable style={[styles.exportOption, !isDarkMode && styles.exportOptionLight]} onPress={exportAsText}>
                  <View style={styles.exportOptionIcon}>
                    <FileText size={24} color="#8B5CF6" />
                  </View>
                  <View style={styles.exportOptionInfo}>
                    <Text style={[styles.exportOptionTitle, !isDarkMode && styles.exportOptionTitleLight]}>Share as Text</Text>
                    <Text style={[styles.exportOptionDesc, !isDarkMode && styles.exportOptionDescLight]}>Share your notes via any app</Text>
                  </View>
                  <ArrowRight size={20} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
                </Pressable>
                
                <Pressable style={[styles.exportOption, !isDarkMode && styles.exportOptionLight]} onPress={copyToClipboard}>
                  <View style={styles.exportOptionIcon}>
                    <FileText size={24} color="#F59E0B" />
                  </View>
                  <View style={styles.exportOptionInfo}>
                    <Text style={[styles.exportOptionTitle, !isDarkMode && styles.exportOptionTitleLight]}>Copy to Clipboard</Text>
                    <Text style={[styles.exportOptionDesc, !isDarkMode && styles.exportOptionDescLight]}>Copy all notes as text</Text>
                  </View>
                  <ArrowRight size={20} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ===== NAME INPUT MODAL ===== */}
        <Modal visible={showNameInput} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.nameModalContent}>
              <Text style={styles.nameModalTitle}>Welcome to AnoteQuest!</Text>
              <Text style={styles.nameModalSubtitle}>What should we call you?</Text>
              <TextInput
                style={styles.nameInput}
                value={nameInputValue}
                onChangeText={setNameInputValue}
                placeholder="Enter your name..."
                placeholderTextColor="#6b7280"
                autoFocus
              />
              <Pressable style={styles.nameSubmitButton} onPress={saveUserName}>
                <Text style={styles.nameSubmitText}>Let's Go!</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* ===== TRASH MODAL ===== */}
        <Modal visible={isTrashOpen} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🗑️ Trash</Text>
                <Pressable onPress={() => setIsTrashOpen(false)}>
                  <X size={24} color="#9CA3AF" />
                </Pressable>
              </View>
              <ScrollView style={styles.trashList}>
                {trash.length === 0 ? (
                  <Text style={styles.trashEmpty}>Trash is empty</Text>
                ) : (
                  trash.map((item) => (
                    <View key={item.id} style={styles.trashItem}>
                      <Text style={styles.trashItemTitle}>
                        {item.type}: {item.item?.title || 'Untitled'}
                      </Text>
                      <Pressable
                        onPress={() => {
                          if (item.type === 'note') {
                            setNotes((prev) => [...prev, item.item]);
                          }
                          setTrash((prev) => prev.filter((t) => t.id !== item.id));
                        }}
                      >
                        <Text style={styles.trashRestore}>Restore</Text>
                      </Pressable>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
        </SafeAreaView>
        </CanvasInteractionProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0f1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 20,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  
  // Header - refined mobile design
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.6)',
    zIndex: 1000,
    elevation: 1000,
  },
  headerLogo: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    borderRadius: 8,
  },
  headerIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 8,
  },
  headerIconButtonDisabled: {
    opacity: 0.4,
  },
  folderDropdownWrapper: {
    position: 'relative',
    zIndex: 100,
  },
  folderDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.4)',
  },
  folderDropdownLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  folderDropdownText: {
    color: '#e2e8f0',
    fontWeight: '600',
    flex: 1,
    letterSpacing: 0.2,
  },
  folderDropdownTextLight: {
    color: '#334155',
  },
  folderDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 15,
    minWidth: 150,
    maxHeight: 240,
    overflow: 'hidden',
  },
  folderDropdownMenuLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  folderDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.4)',
  },
  folderDropdownItemActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
  },
  folderDropdownItemText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  folderDropdownItemTextLight: {
    color: '#334155',
  },
  folderDropdownItemTextActive: {
    color: '#a78bfa',
    fontWeight: '600',
  },
  headerZoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
    flex: 1,
    marginHorizontal: 6,
  },
  headerZoomButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerZoomText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
  headerNoteCount: {
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerNoteCountLight: {
    backgroundColor: '#f1f5f9',
  },
  headerNoteCountGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.6)',
  },
  headerNoteCountYellow: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.6)',
  },
  headerNoteCountRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.6)',
  },
  headerNoteCountText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  headerNoteCountTextGreen: {
    color: '#4ade80',
  },
  headerNoteCountTextYellow: {
    color: '#fbbf24',
  },
  headerNoteCountTextRed: {
    color: '#f87171',
  },

  // Main content area
  mainContent: {
    flex: 1,
  },

  // Canvas area
  canvasArea: {
    flex: 1,
    position: 'relative',
  },
  canvasScrollView: {
    flex: 1,
  },
  
  // Canvas - refined background
  canvasContent: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: '#0c1222',
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
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(71, 85, 105, 0.35)',
  },
  
  // Empty state - polished
  emptyState: {
    position: 'absolute',
    top: 200,
    left: 80,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    padding: 36,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  emptyStateIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyStateTitle: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  emptyStateSubtitle: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '500',
  },

  // Note Card - refined styling
  noteCard: {
    position: 'absolute',
    width: 230,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  noteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  noteCardDrag: {
    marginRight: 10,
    opacity: 0.6,
  },
  noteCardTitle: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  noteCardClose: {
    padding: 4,
  },
  noteCardBody: {
    padding: 14,
    backgroundColor: 'rgba(10, 15, 26, 0.9)',
    minHeight: 110,
  },
  noteCardContent: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  noteCardWordCount: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.5)',
  },
  
  // Sticky Note - using notesticker.png image
  stickyNoteContainer: {
    position: 'absolute',
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyNoteImage: {
    width: 170,
    height: 170,
    position: 'absolute',
  },
  stickyNoteTextOverlay: {
    position: 'absolute',
    top: 28,
    left: 16,
    right: 16,
    bottom: 28,
    padding: 10,
  },
  // Legacy sticky note styles (keeping for backwards compatibility)
  stickyNote: {
    position: 'absolute',
    width: 170,
    minHeight: 150,
    backgroundColor: '#fcd34d',
    padding: 18,
    paddingTop: 26,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 14,
    transform: [{ rotate: '-2deg' }],
    borderRadius: 4,
  },
  pushpin: {
    position: 'absolute',
    top: -10,
    left: '50%',
    marginLeft: -9,
    alignItems: 'center',
    zIndex: 10,
  },
  pushpinHead: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#dc2626',
    borderWidth: 2,
    borderColor: '#991b1b',
  },
  pushpinPoint: {
    width: 4,
    height: 10,
    backgroundColor: '#4b5563',
    marginTop: -2,
    borderRadius: 1,
  },
  stickyFold: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    backgroundColor: '#fbbf24',
    borderTopLeftRadius: 32,
  },
  stickyTitle: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  stickyContent: {
    color: '#374151',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
    letterSpacing: 0.1,
  },
  stickyWordCount: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 10,
    fontWeight: '600',
  },
  stickerDeleteBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // Table card styles - refined
  tableCard: {
    position: 'absolute',
    minWidth: 240,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  tableCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(71, 85, 105, 0.5)',
  },
  tableHeaderLight: {
    backgroundColor: '#f8fafc',
    borderBottomColor: '#e2e8f0',
  },
  tableTitle: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.2,
  },
  tableTitleLight: {
    color: '#1e293b',
  },
  tableDeleteBtn: {
    padding: 6,
  },
  tableContent: {
    padding: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
  },
  tableHeaderRow: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: 'rgba(51, 65, 85, 0.4)',
  },
  tableHeaderCell: {
    backgroundColor: 'transparent',
  },
  tableCellText: {
    color: '#94a3b8',
    fontSize: 12,
    letterSpacing: 0.1,
  },
  tableHeaderCellText: {
    color: '#fbbf24',
    fontWeight: '700',
  },
  tableCellTextLight: {
    color: '#475569',
  },
  
  // Todo card - refined mobile styling
  todoCard: {
    position: 'absolute',
    width: 210,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  todoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.4)',
  },
  todoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todoHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  todoTitle: {
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  todoCount: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  todoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  todoCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4b5563',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  todoCheckboxChecked: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  todoCheckmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  todoItemText: {
    flex: 1,
    fontSize: 14,
    color: '#94a3b8',
    letterSpacing: 0.1,
  },
  todoItemCompleted: {
    color: '#64748b',
    textDecorationLine: 'line-through',
  },

  // Floating Trash Button - refined
  trashFloatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 2,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },

  // Bottom Dock (Scrollable) - polished
  bottomDockContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.6)',
  },
  bottomDockScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
  },
  dockButton: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dockButtonInner: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  dockButtonHighlight: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.6)',
  },
  dockButtonActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  dockButtonTrash: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  dockButtonTrashActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 2.5,
    borderColor: '#f87171',
    transform: [{ scale: 1.08 }],
  },
  dockButtonText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  
  // Dragging styles - refined
  draggingItem: {
    opacity: 0.85,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 25,
    borderWidth: 2,
    borderColor: '#a78bfa',
  },
  dragIndicator: {
    position: 'absolute',
    top: 90,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#a78bfa',
    zIndex: 1000,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  dragIndicatorText: {
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Note Editor Modal - polished
  noteEditorModal: {
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  noteEditorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  noteEditorDragHandle: {
    marginRight: 14,
    opacity: 0.6,
  },
  noteEditorTitle: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  noteEditorClose: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.4)',
  },
  noteEditorContent: {
    padding: 20,
  },
  noteTitleInput: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    color: '#f1f5f9',
    fontSize: 17,
    fontWeight: '700',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.4)',
    letterSpacing: 0.2,
  },
  noteContentInput: {
    backgroundColor: 'rgba(10, 15, 26, 0.8)',
    color: '#cbd5e1',
    fontSize: 15,
    padding: 16,
    borderRadius: 12,
    minHeight: 220,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  noteWordCount: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'right',
    fontWeight: '600',
  },

  // Folder Dropdown Modal - polished
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingTop: 100,
    paddingHorizontal: 24,
  },
  folderMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 12,
  },
  folderMenuItemActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  folderMenuItemText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '500',
  },
  folderMenuItemTextActive: {
    color: '#fbbf24',
    fontWeight: '600',
  },
  folderMenuDivider: {
    height: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    marginVertical: 6,
  },

  // Modal buttons - polished
  modalButtonRow: {
    flexDirection: 'row',
    gap: 14,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.4)',
  },
  modalCancelText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Modals - refined
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.4)',
  },
  modalTitle: {
    color: '#f1f5f9',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  
  // Name modal - polished
  nameModalContent: {
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    margin: 24,
    marginBottom: 48,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  nameModalTitle: {
    color: '#f1f5f9',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  nameModalSubtitle: {
    color: '#94a3b8',
    fontSize: 16,
    marginBottom: 24,
    fontWeight: '500',
  },
  nameInput: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    color: '#f1f5f9',
    fontSize: 17,
    padding: 14,
    borderRadius: 12,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.4)',
    textAlign: 'center',
    fontWeight: '600',
  },
  nameSubmitButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nameSubmitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  
  // Trash - polished
  trashList: {
    maxHeight: 450,
  },
  trashEmpty: {
    color: '#94a3b8',
    textAlign: 'center',
    padding: 40,
    fontSize: 15,
    fontWeight: '500',
  },
  trashItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.4)',
  },
  trashItemTitle: {
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  trashRestore: {
    color: '#a78bfa',
    fontWeight: '700',
    fontSize: 14,
  },

  // ===== LIGHT MODE STYLES - polished =====
  containerLight: {
    backgroundColor: '#f8fafc',
  },
  headerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderBottomColor: '#e2e8f0',
  },
  themeToggleButton: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 8,
  },
  themeToggleButtonLight: {
    backgroundColor: '#f1f5f9',
  },
  canvasContentLight: {
    backgroundColor: '#f1f5f9',
  },
  emptyStateLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderColor: '#e2e8f0',
  },
  emptyStateTitleLight: {
    color: '#1e293b',
  },
  noteCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  noteCardHeaderLight: {
    backgroundColor: '#f8fafc',
    borderBottomColor: '#e2e8f0',
  },
  noteCardTitleLight: {
    color: '#1e293b',
  },
  noteCardBodyLight: {
    backgroundColor: '#ffffff',
  },
  noteCardContentLight: {
    color: '#475569',
  },
  noteCardWordCountLight: {
    color: '#94a3b8',
    backgroundColor: '#f8fafc',
    borderTopColor: '#e2e8f0',
  },
  todoCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  todoHeaderLight: {
    borderBottomColor: '#e2e8f0',
  },
  todoTitleLight: {
    color: '#1e293b',
  },
  todoCountLight: {
    color: '#64748b',
  },
  todoCheckboxLight: {
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  todoItemTextLight: {
    color: '#334155',
  },
  bottomDockContainerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopColor: '#e2e8f0',
  },
  dockButtonInnerLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  dockButtonTextLight: {
    color: '#64748b',
  },
  dockButtonHighlightLight: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  dockButtonTrashLight: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  
  // Search Modal - polished
  searchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  searchModalContent: {
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderRadius: 20,
    padding: 20,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  searchModalContentLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
  },
  searchInput: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 17,
    paddingVertical: 10,
    fontWeight: '500',
  },
  searchInputLight: {
    color: '#1e293b',
  },
  searchResults: {
    marginTop: 16,
    maxHeight: 420,
  },
  searchResultItem: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.4)',
    borderRadius: 8,
    marginBottom: 4,
  },
  searchResultItemLight: {
    borderBottomColor: '#f1f5f9',
  },
  searchResultTitle: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  searchResultTitleLight: {
    color: '#1e293b',
  },
  searchResultContent: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
  },
  searchResultContentLight: {
    color: '#64748b',
  },
  searchNoResults: {
    color: '#64748b',
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 32,
    fontWeight: '500',
  },
  searchNoResultsLight: {
    color: '#94a3b8',
  },
  
  // Drawing styles - polished
  drawingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    zIndex: 1000,
  },
  drawingModeIndicator: {
    position: 'absolute',
    top: 60,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  drawingModeText: {
    color: '#f1f5f9',
    fontSize: 15,
    flex: 1,
    fontWeight: '600',
  },
  drawingModeClose: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.4)',
  },
  drawingDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#fbbf24',
  },
  drawingPath: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  clearDrawingsBtn: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#f87171',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  clearDrawingsText: {
    color: '#f87171',
    fontSize: 15,
    fontWeight: '700',
  },
  
  // Export Modal styles - polished
  exportModalContent: {
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderRadius: 20,
    padding: 24,
    width: '92%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  exportModalContentLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  exportModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 14,
  },
  exportModalTitle: {
    color: '#f1f5f9',
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
    letterSpacing: 0.2,
  },
  exportModalTitleLight: {
    color: '#1e293b',
  },
  exportModalClose: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.4)',
  },
  exportModalSubtitle: {
    color: '#94a3b8',
    fontSize: 15,
    marginBottom: 24,
    fontWeight: '500',
  },
  exportModalSubtitleLight: {
    color: '#64748b',
  },
  exportOptions: {
    gap: 14,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.4)',
  },
  exportOptionLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  exportOptionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportOptionInfo: {
    flex: 1,
  },
  exportOptionTitle: {
    color: '#f1f5f9',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  exportOptionTitleLight: {
    color: '#1e293b',
  },
  exportOptionDesc: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  exportOptionDescLight: {
    color: '#64748b',
  },
});
