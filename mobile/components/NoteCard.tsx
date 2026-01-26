import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  Image,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Gesture, GestureDetector, GestureUpdateEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { Trash2, GripVertical, X, Maximize2, Copy, Expand } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

// Note colors for mobile
const NOTE_COLORS = [
  { name: 'default', bg: '#1F2937', border: '#374151' },
  { name: 'pink', bg: '#4C1D4C', border: '#9333EA' },
  { name: 'lavender', bg: '#312E81', border: '#6366F1' },
  { name: 'mint', bg: '#064E3B', border: '#10B981' },
  { name: 'peach', bg: '#44403C', border: '#78716C' },
];

// Types
interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface NoteImage {
  id: number;
  data: string;
}

interface Folder {
  id: number;
  name: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
  position: Position;
  size?: Size;
  color?: string;
  images?: NoteImage[];
  folderId?: number | null;
  createdAt: string;
}

interface NoteCardProps {
  note: Note;
  updateNote: (id: number, updates: Partial<Note>) => void;
  deleteNote: (id: number) => void;
  addNote?: (note: Partial<Note>) => void;
  folders?: Folder[];
  onItemClick?: () => void;
  isConnecting?: boolean;
  isSelected?: boolean;
  zoom?: number;
  shouldDeleteOnDrop?: (x: number, y: number) => boolean;
  onNoteClick?: (note: Note) => void;
  openReaderMode?: boolean;
  onReaderModeClosed?: () => void;
  onMultiDrag?: (deltaX: number, deltaY: number) => void;
  selectedCount?: number;
}

export const NoteCard: React.FC<NoteCardProps> = React.memo(({
  note,
  updateNote,
  deleteNote,
  addNote,
  folders,
  onItemClick,
  isConnecting = false,
  isSelected = false,
  zoom = 1,
  shouldDeleteOnDrop,
  onNoteClick,
  openReaderMode,
  onReaderModeClosed,
  onMultiDrag,
  selectedCount = 0,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [showReaderMode, setShowReaderMode] = useState(false);
  const [readerContent, setReaderContent] = useState(note.content || '');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Animated values for dragging
  const translateX = useSharedValue(note.position.x);
  const translateY = useSharedValue(note.position.y);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const lastPosRef = useRef({ x: note.position.x, y: note.position.y });

  // Update position when note prop changes
  useEffect(() => {
    translateX.value = note.position.x;
    translateY.value = note.position.y;
    lastPosRef.current = { x: note.position.x, y: note.position.y };
  }, [note.position.x, note.position.y]);

  // Sync title/content when note changes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.title, note.content]);

  // Open reader mode when triggered from outside
  useEffect(() => {
    if (openReaderMode) {
      setReaderContent(note.content || '');
      setShowReaderMode(true);
    }
  }, [openReaderMode, note.content]);

  const colorScheme = NOTE_COLORS.find(c => c.name === note.color) || NOTE_COLORS[0];
  const noteSize = note.size || { width: 280, height: 200 };

  // Handle reader mode close
  const handleReaderClose = () => {
    setShowReaderMode(false);
    if (onReaderModeClosed) {
      onReaderModeClosed();
    }
  };

  // Handle save
  const handleSave = () => {
    updateNote(note.id, { title, content });
    setIsEditing(false);
    Alert.alert('Saved', 'Note saved!');
  };

  // Handle reader save
  const handleReaderSave = () => {
    updateNote(note.id, { content: readerContent });
    setContent(readerContent);
    Alert.alert('Saved', 'Note updated!');
  };

  // Handle copy
  const handleCopyAll = async () => {
    await Clipboard.setStringAsync(readerContent || '');
    Alert.alert('Copied', 'Note text copied to clipboard');
  };

  // Handle delete
  const handleDelete = () => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteNote(note.id) },
    ]);
  };

  // Handle color change
  const handleColorChange = (colorName: string) => {
    updateNote(note.id, { color: colorName });
    setShowColorPicker(false);
  };

  // Handle duplicate
  const handleDuplicate = () => {
    if (!addNote) return;
    const basePosition = note.position || { x: 200, y: 160 };

    addNote({
      title: note.title || 'New Note',
      content: note.content,
      size: note.size,
      color: note.color,
      images: [...(note.images || [])],
      position: {
        x: basePosition.x + 40,
        y: basePosition.y + 40,
      },
      folderId: note.folderId,
    });
    setShowOptionsMenu(false);
    Alert.alert('Duplicated', 'Note duplicated!');
  };

  // Handle remove image
  const handleRemoveImage = (imageId: number) => {
    updateNote(note.id, {
      images: note.images?.filter(img => img.id !== imageId) || [],
    });
  };

  // Handle connection click
  const handlePress = () => {
    if (isConnecting && onItemClick) {
      onItemClick();
    } else if (!isEditing) {
      onNoteClick?.(note);
    }
  };

  // Update position callback
  const updatePosition = (x: number, y: number) => {
    updateNote(note.id, { position: { x, y } });
  };

  // Check trash drop
  const checkTrashDrop = (x: number, y: number) => {
    if (shouldDeleteOnDrop && shouldDeleteOnDrop(x, y)) {
      deleteNote(note.id);
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
    .enabled(!isConnecting && !isEditing)
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
    zIndex: isDragging.value ? 100 : 10,
  }));

  const wordCount = content?.trim().split(/\s+/).filter(w => w.length > 0).length || 0;

  return (
    <>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.container,
            {
              width: noteSize.width,
              height: noteSize.height,
              backgroundColor: colorScheme.bg,
              borderColor: isSelected ? '#8B5CF6' : colorScheme.border, // Change selection outline to purple
            },
            animatedStyle,
          ]}
        >
          {/* Header - drag handle */}
          <View style={styles.header}>
            <GripVertical size={16} color="#9CA3AF" />
            {isEditing ? (
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  updateNote(note.id, { title: text });
                }}
                placeholder="Note title"
                placeholderTextColor="#6B7280"
              />
            ) : (
              <Pressable style={styles.titleContainer} onPress={() => setIsEditing(true)}>
                <Text style={styles.title} numberOfLines={1}>
                  {title || 'Untitled'}
                </Text>
              </Pressable>
            )}
            <Pressable onPress={() => setShowOptionsMenu(true)} style={styles.menuButton}>
              <Text style={styles.menuIcon}>⋯</Text>
            </Pressable>
          </View>

          {/* Content area */}
          <ScrollView style={styles.contentScroll}>
            {/* Images */}
            {note.images && note.images.length > 0 && (
              <View style={styles.imagesContainer}>
                {note.images.map(image => (
                  <View key={image.id} style={styles.imageWrapper}>
                    <Image source={{ uri: image.data }} style={styles.image} resizeMode="cover" />
                    <Pressable
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveImage(image.id)}
                    >
                      <X size={12} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Content */}
            <Pressable style={styles.contentContainer} onPress={handlePress}>
              {isEditing ? (
                <TextInput
                  style={styles.contentInput}
                  value={content}
                  onChangeText={(text) => {
                    setContent(text);
                    updateNote(note.id, { content: text });
                  }}
                  placeholder="Start writing your note..."
                  placeholderTextColor="#6B7280"
                  multiline
                  textAlignVertical="top"
                />
              ) : (
                <Text style={styles.content} numberOfLines={8}>
                  {content || 'Tap to start writing...'}
                </Text>
              )}
            </Pressable>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.wordCount}>{wordCount} words</Text>
            {isEditing && (
              <Pressable style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            )}
          </View>

          {/* Resize handle - TODO: implement resize gesture */}
          <View style={styles.resizeHandle}>
            <Maximize2 size={12} color="#6B7280" />
          </View>
        </Animated.View>
      </GestureDetector>

      {/* Options Menu Modal */}
      <Modal visible={showOptionsMenu} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowOptionsMenu(false)}>
          <View style={styles.optionsMenu}>
            <Pressable style={styles.optionItem} onPress={() => { setShowReaderMode(true); setShowOptionsMenu(false); }}>
              <Expand size={18} color="#FFFFFF" />
              <Text style={styles.optionText}>Expand View</Text>
            </Pressable>
            <Pressable style={styles.optionItem} onPress={() => { setShowColorPicker(true); setShowOptionsMenu(false); }}>
              <Text style={styles.optionEmoji}>🎨</Text>
              <Text style={styles.optionText}>Change Color</Text>
            </Pressable>
            <Pressable style={styles.optionItem} onPress={handleDuplicate}>
              <Copy size={18} color="#FFFFFF" />
              <Text style={styles.optionText}>Duplicate</Text>
            </Pressable>
            <View style={styles.optionDivider} />
            <Pressable style={styles.optionItem} onPress={() => { handleDelete(); setShowOptionsMenu(false); }}>
              <Trash2 size={18} color="#EF4444" />
              <Text style={[styles.optionText, { color: '#EF4444' }]}>Delete</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Color Picker Modal */}
      <Modal visible={showColorPicker} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowColorPicker(false)}>
          <View style={styles.colorPicker}>
            <Text style={styles.colorPickerTitle}>Choose Color</Text>
            <View style={styles.colorGrid}>
              {NOTE_COLORS.map(color => (
                <Pressable
                  key={color.name}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color.bg, borderColor: color.border },
                    note.color === color.name && styles.colorOptionSelected,
                  ]}
                  onPress={() => handleColorChange(color.name)}
                >
                  {note.color === color.name && <Text style={styles.colorCheck}>✓</Text>}
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Reader Mode Modal */}
      <Modal visible={showReaderMode} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.readerContainer}
        >
          <View style={styles.readerHeader}>
            <Pressable onPress={handleReaderClose}>
              <Text style={styles.readerCloseText}>Close</Text>
            </Pressable>
            <Text style={styles.readerTitle} numberOfLines={1}>{title}</Text>
            <Pressable onPress={handleCopyAll}>
              <Copy size={20} color="#f76555" />
            </Pressable>
          </View>

          <ScrollView style={styles.readerContent}>
            {/* Images in reader mode */}
            {note.images && note.images.length > 0 && (
              <View style={styles.readerImages}>
                {note.images.map(image => (
                  <Image
                    key={image.id}
                    source={{ uri: image.data }}
                    style={styles.readerImage}
                    resizeMode="contain"
                  />
                ))}
              </View>
            )}

            <TextInput
              style={styles.readerTextInput}
              value={readerContent}
              onChangeText={setReaderContent}
              placeholder="Start writing your note..."
              placeholderTextColor="#6B7280"
              multiline
              textAlignVertical="top"
            />
          </ScrollView>

          <View style={styles.readerFooter}>
            <Text style={styles.readerWordCount}>
              {readerContent?.trim().split(/\s+/).filter(w => w.length > 0).length || 0} words
            </Text>
            <Pressable style={styles.readerSaveButton} onPress={handleReaderSave}>
              <Text style={styles.readerSaveButtonText}>Save changes</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  titleInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  menuButton: {
    padding: 4,
  },
  menuIcon: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  contentScroll: {
    flex: 1,
  },
  imagesContainer: {
    padding: 8,
    gap: 8,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    padding: 12,
  },
  content: {
    fontSize: 13,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  contentInput: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 20,
    minHeight: 80,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  wordCount: {
    fontSize: 11,
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#A855F7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saveButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  resizeHandle: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsMenu: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  optionEmoji: {
    fontSize: 18,
  },
  optionText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  optionDivider: {
    height: 1,
    backgroundColor: '#374151',
    marginVertical: 4,
  },
  colorPicker: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    minWidth: 240,
  },
  colorPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 4,
    borderColor: '#A855F7',
  },
  colorCheck: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  readerContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  readerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingTop: 50,
  },
  readerCloseText: {
    fontSize: 16,
    color: '#A855F7',
    fontWeight: '500',
  },
  readerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  readerContent: {
    flex: 1,
    padding: 16,
  },
  readerImages: {
    marginBottom: 16,
    gap: 12,
  },
  readerImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  readerTextInput: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    minHeight: 300,
  },
  readerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingBottom: 30,
  },
  readerWordCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  readerSaveButton: {
    backgroundColor: '#A855F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  readerSaveButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

NoteCard.displayName = 'NoteCard';
export default NoteCard;
