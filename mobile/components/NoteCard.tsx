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
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  titleInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  menuButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  menuIcon: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  contentScroll: {
    flex: 1,
  },
  imagesContainer: {
    padding: 10,
    gap: 10,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 130,
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  contentContainer: {
    flex: 1,
    padding: 14,
  },
  content: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  contentInput: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
    minHeight: 90,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  wordCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  resizeHandle: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsMenu: {
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderRadius: 16,
    padding: 10,
    minWidth: 220,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
    borderRadius: 10,
  },
  optionEmoji: {
    fontSize: 20,
  },
  optionText: {
    fontSize: 15,
    color: '#f1f5f9',
    fontWeight: '500',
  },
  optionDivider: {
    height: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    marginVertical: 6,
  },
  colorPicker: {
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderRadius: 18,
    padding: 20,
    minWidth: 260,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  colorPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  colorOption: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 4,
    borderColor: '#a78bfa',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  colorCheck: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  readerContainer: {
    flex: 1,
    backgroundColor: '#0a0f1a',
  },
  readerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
    paddingTop: 54,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  readerCloseText: {
    fontSize: 17,
    color: '#a78bfa',
    fontWeight: '600',
  },
  readerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#f1f5f9',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 18,
    letterSpacing: 0.2,
  },
  readerContent: {
    flex: 1,
    padding: 20,
  },
  readerImages: {
    marginBottom: 20,
    gap: 14,
  },
  readerImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },
  readerTextInput: {
    fontSize: 17,
    color: '#f1f5f9',
    lineHeight: 26,
    minHeight: 320,
    letterSpacing: 0.1,
  },
  readerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.5)',
    paddingBottom: 34,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  readerWordCount: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  readerSaveButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  readerSaveButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

NoteCard.displayName = 'NoteCard';
export default NoteCard;
