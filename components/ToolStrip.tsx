import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  StickyNote,
  Pencil,
  Minus,
  ArrowRight,
  Circle,
  Link2,
  Sticker,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
  Plus,
  FolderPlus,
  Table,
  CheckSquare,
  Trash2,
  Expand,
  Copy,
  Palette,
  FolderOpen,
  Check,
  X,
  Image as ImageIcon,
} from 'lucide-react-native';

interface Folder {
  id: string;
  name: string;
}

interface Note {
  id: string;
  title?: string;
  content?: string;
  folderId?: string | null;
  color?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  images?: { id: number; data: string }[];
}

interface ToolStripProps {
  onAddNote: (note?: Partial<Note>) => void;
  drawingTool: string | null;
  setDrawingTool: (tool: string | null) => void;
  addSticker: (sticker: any) => void;
  onAddSource: (source: { url: string; title?: string }) => void;
  addNoteSticker: () => void;
  folders: Folder[];
  notes: Note[];
  activeFolder: string | null;
  setActiveFolder: (id: string | null) => void;
  addFolder: (name: string) => void;
  deleteFolder: (id: string) => void;
  onToggleCharacters?: () => void;
  characterPanelOpen?: boolean;
  onAddImage: (image: any) => void;
  onAddTable: (table: any) => void;
  onAddTodo: (todo: any) => void;
  activeNote: Note | null;
  onClearActiveNote: () => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  onOpenReaderMode?: (id: string) => void;
}

const STICKER_TYPES = [
  { type: 'arrow-right', icon: '→', label: 'Arrow' },
  { type: 'arrow-down', icon: '↓', label: 'Down' },
  { type: 'circle', icon: '○', label: 'Circle' },
  { type: 'square', icon: '□', label: 'Square' },
  { type: 'star', icon: '☆', label: 'Star' },
  { type: 'heart', icon: '♡', label: 'Heart' },
];

const NOTE_COLORS = [
  { name: 'default', color: '#ffffff' },
  { name: 'pink', color: '#fce7f3' },
  { name: 'lavender', color: '#ede9fe' },
  { name: 'mint', color: '#d1fae5' },
  { name: 'peach', color: '#ffedd5' },
];

const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#eab308', '#8b5cf6',
  '#f97316', '#ec4899', '#14b8a6', '#000000', '#6b7280',
];

export const ToolStrip = ({
  onAddNote,
  drawingTool,
  setDrawingTool,
  addSticker,
  onAddSource,
  addNoteSticker,
  folders,
  notes,
  activeFolder,
  setActiveFolder,
  addFolder,
  deleteFolder,
  onToggleCharacters,
  characterPanelOpen,
  onAddImage,
  onAddTable,
  onAddTodo,
  activeNote,
  onClearActiveNote,
  updateNote,
  deleteNote,
  onOpenReaderMode,
}: ToolStripProps) => {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [stickerColor, setStickerColor] = useState('#3b82f6');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  const handleToolClick = (tool: string) => {
    if (expandedTool === tool) {
      setExpandedTool(null);
    } else {
      setExpandedTool(tool);
    }
  };

  const handleAddSticker = (type: string) => {
    addSticker({
      type,
      position: {
        x: 200 + Math.random() * 300,
        y: 150 + Math.random() * 200,
      },
      size: { width: 60, height: 60 },
      rotation: 0,
      color: stickerColor,
    });
  };

  const handleAddSourceClick = () => {
    if (!onAddSource) return;
    let url = newLinkUrl.trim();
    const title = newLinkTitle.trim();
    if (!url) return;

    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    onAddSource({ url, title });
    setNewLinkUrl('');
    setNewLinkTitle('');
    setExpandedTool(null);
  };

  const handleImageClick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const imageData = `data:image/jpeg;base64,${asset.base64}`;

      if (onAddImage) {
        onAddImage({
          type: 'image',
          data: imageData,
          position: {
            x: 150 + Math.random() * 200,
            y: 100 + Math.random() * 150,
          },
          size: { width: 300, height: 200 },
        });
      }
    }
  };

  const handleAddTable = () => {
    if (onAddTable) {
      onAddTable({
        type: 'table',
        position: {
          x: 150 + Math.random() * 200,
          y: 100 + Math.random() * 150,
        },
        size: { width: 400, height: 200 },
        rows: 3,
        cols: 3,
        data: [
          ['', '', ''],
          ['', '', ''],
          ['', '', ''],
        ],
      });
    }
  };

  const handleAddTodo = () => {
    if (onAddTodo) {
      onAddTodo({
        type: 'todo',
        position: {
          x: 150 + Math.random() * 200,
          y: 100 + Math.random() * 150,
        },
        size: { width: 280, height: 200 },
        title: 'Todo List',
        items: [{ id: Date.now(), text: '', completed: false }],
      });
    }
  };

  const handleNoteImagePick = async () => {
    if (!activeNote) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const imageData = `data:image/jpeg;base64,${asset.base64}`;
      const newImage = { id: Date.now(), data: imageData };
      updateNote(activeNote.id, {
        images: [...(activeNote.images || []), newImage],
      });
    }
  };

  if (isCollapsed) {
    return (
      <View style={styles.collapsedContainer}>
        <Pressable
          onPress={() => setIsCollapsed(false)}
          style={({ pressed }) => [
            styles.expandButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <ChevronRight size={16} color="#374151" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main Tool Strip */}
      <View style={styles.toolStrip}>
        {/* Collapse Button */}
        <Pressable
          onPress={() => setIsCollapsed(true)}
          style={({ pressed }) => [
            styles.toolButton,
            styles.collapseButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <ChevronLeft size={16} color="#6b7280" />
        </Pressable>

        {/* Add Note */}
        <Pressable
          onPress={() => onAddNote()}
          style={({ pressed }) => [
            styles.toolButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Plus size={20} color="#374151" />
        </Pressable>

        {/* Freehand Draw */}
        <Pressable
          onPress={() => setDrawingTool(drawingTool === 'freehand' ? null : 'freehand')}
          style={({ pressed }) => [
            styles.toolButton,
            drawingTool === 'freehand' && styles.toolButtonActive,
            pressed && styles.buttonPressed,
          ]}
        >
          <Pencil size={20} color={drawingTool === 'freehand' ? '#fff' : '#374151'} />
        </Pressable>

        {/* Straight Line */}
        <Pressable
          onPress={() => setDrawingTool(drawingTool === 'line' ? null : 'line')}
          style={({ pressed }) => [
            styles.toolButton,
            drawingTool === 'line' && styles.toolButtonActive,
            pressed && styles.buttonPressed,
          ]}
        >
          <Minus size={20} color={drawingTool === 'line' ? '#fff' : '#374151'} />
        </Pressable>

        {/* Arrow */}
        <Pressable
          onPress={() => setDrawingTool(drawingTool === 'arrow' ? null : 'arrow')}
          style={({ pressed }) => [
            styles.toolButton,
            drawingTool === 'arrow' && styles.toolButtonActive,
            pressed && styles.buttonPressed,
          ]}
        >
          <ArrowRight size={20} color={drawingTool === 'arrow' ? '#fff' : '#374151'} />
        </Pressable>

        {/* Circle */}
        <Pressable
          onPress={() => setDrawingTool(drawingTool === 'ellipse' ? null : 'ellipse')}
          style={({ pressed }) => [
            styles.toolButton,
            drawingTool === 'ellipse' && styles.toolButtonActive,
            pressed && styles.buttonPressed,
          ]}
        >
          <Circle size={20} color={drawingTool === 'ellipse' ? '#fff' : '#374151'} />
        </Pressable>

        {/* Stickers */}
        <Pressable
          onPress={() => handleToolClick('stickers')}
          style={({ pressed }) => [
            styles.toolButton,
            expandedTool === 'stickers' && styles.toolButtonActive,
            pressed && styles.buttonPressed,
          ]}
        >
          <Sticker size={20} color={expandedTool === 'stickers' ? '#fff' : '#374151'} />
        </Pressable>

        {/* Note Sticker */}
        <Pressable
          onPress={() => addNoteSticker()}
          style={({ pressed }) => [
            styles.toolButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <StickyNote size={20} color="#fbbf24" />
        </Pressable>

        {/* Upload Image */}
        <Pressable
          onPress={handleImageClick}
          style={({ pressed }) => [
            styles.toolButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <ImagePlus size={20} color="#374151" />
        </Pressable>

        {/* Add Table */}
        <Pressable
          onPress={handleAddTable}
          style={({ pressed }) => [
            styles.toolButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Table size={20} color="#374151" />
        </Pressable>

        {/* Add Todo */}
        <Pressable
          onPress={handleAddTodo}
          style={({ pressed }) => [
            styles.toolButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <CheckSquare size={20} color="#374151" />
        </Pressable>

        {/* Links */}
        <Pressable
          onPress={() => handleToolClick('links')}
          style={({ pressed }) => [
            styles.toolButton,
            expandedTool === 'links' && styles.toolButtonActive,
            pressed && styles.buttonPressed,
          ]}
        >
          <Link2 size={20} color={expandedTool === 'links' ? '#fff' : '#374151'} />
        </Pressable>

        {/* Characters */}
        {onToggleCharacters && (
          <Pressable
            onPress={onToggleCharacters}
            style={({ pressed }) => [
              styles.toolButton,
              characterPanelOpen && styles.toolButtonActive,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.emojiButton}>🧙</Text>
          </Pressable>
        )}
      </View>

      {/* Note Tools Panel */}
      {activeNote && (
        <View style={styles.noteToolsPanel}>
          <View style={styles.noteToolsHeader}>
            <Text style={styles.noteToolsTitle}>Note Tools</Text>
            <Pressable onPress={onClearActiveNote} hitSlop={8}>
              <X size={14} color="#6b7280" />
            </Pressable>
          </View>
          <Text style={styles.noteName} numberOfLines={1}>
            {activeNote.title || 'Untitled'}
          </Text>

          {/* Reader Mode */}
          <Pressable
            onPress={() => activeNote && onOpenReaderMode?.(activeNote.id)}
            style={({ pressed }) => [
              styles.noteToolButton,
              pressed && styles.noteToolButtonPressed,
            ]}
          >
            <Expand size={12} color="#374151" />
            <Text style={styles.noteToolText}>Reader</Text>
          </Pressable>

          {/* Add Image */}
          <Pressable
            onPress={handleNoteImagePick}
            style={({ pressed }) => [
              styles.noteToolButton,
              pressed && styles.noteToolButtonPressed,
            ]}
          >
            <ImageIcon size={12} color="#374151" />
            <Text style={styles.noteToolText}>Image</Text>
          </Pressable>

          {/* Duplicate */}
          <Pressable
            onPress={() => {
              const basePosition = activeNote.position || { x: 200, y: 160 };
              onAddNote({
                title: activeNote.title || 'New Note',
                content: activeNote.content,
                size: activeNote.size,
                color: activeNote.color,
                images: [...(activeNote.images || [])],
                position: {
                  x: basePosition.x + 40,
                  y: basePosition.y + 40,
                },
                folderId: activeNote.folderId,
              });
            }}
            style={({ pressed }) => [
              styles.noteToolButton,
              pressed && styles.noteToolButtonPressed,
            ]}
          >
            <Copy size={12} color="#374151" />
            <Text style={styles.noteToolText}>Duplicate</Text>
          </Pressable>

          {/* Color */}
          <Pressable
            onPress={() => setShowColorPicker(true)}
            style={({ pressed }) => [
              styles.noteToolButton,
              pressed && styles.noteToolButtonPressed,
            ]}
          >
            <Palette size={12} color="#374151" />
            <Text style={styles.noteToolText}>Color</Text>
          </Pressable>

          {/* Folder */}
          <Pressable
            onPress={() => setShowFolderPicker(true)}
            style={({ pressed }) => [
              styles.noteToolButton,
              pressed && styles.noteToolButtonPressed,
            ]}
          >
            <FolderOpen size={12} color="#374151" />
            <Text style={styles.noteToolText}>Folder</Text>
          </Pressable>

          {/* Delete */}
          <Pressable
            onPress={() => {
              Alert.alert('Delete Note', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    deleteNote(activeNote.id);
                    onClearActiveNote();
                  },
                },
              ]);
            }}
            style={({ pressed }) => [
              styles.noteToolButton,
              styles.deleteToolButton,
              pressed && styles.noteToolButtonPressed,
            ]}
          >
            <Trash2 size={12} color="#ef4444" />
            <Text style={[styles.noteToolText, styles.deleteText]}>Delete</Text>
          </Pressable>
        </View>
      )}

      {/* Expanded Panel - Stickers */}
      {expandedTool === 'stickers' && (
        <View style={styles.expandedPanel}>
          <Text style={styles.panelTitle}>Stickers</Text>
          <View style={styles.stickerGrid}>
            {STICKER_TYPES.map(({ type, icon, label }) => (
              <Pressable
                key={type}
                onPress={() => handleAddSticker(type)}
                style={({ pressed }) => [
                  styles.stickerButton,
                  pressed && styles.stickerButtonPressed,
                ]}
              >
                <Text style={[styles.stickerIcon, { color: stickerColor }]}>{icon}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.panelSubtitle}>Color</Text>
          <View style={styles.colorGrid}>
            {COLORS.map((color) => (
              <Pressable
                key={color}
                onPress={() => setStickerColor(color)}
                style={[
                  styles.colorButton,
                  { backgroundColor: color },
                  stickerColor === color && styles.colorButtonSelected,
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {/* Expanded Panel - Links */}
      {expandedTool === 'links' && (
        <View style={styles.expandedPanel}>
          <Text style={styles.panelTitle}>Save a source</Text>
          <TextInput
            value={newLinkUrl}
            onChangeText={setNewLinkUrl}
            placeholder="https://example.com/article"
            placeholderTextColor="#9ca3af"
            style={styles.linkInput}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TextInput
            value={newLinkTitle}
            onChangeText={setNewLinkTitle}
            placeholder="Optional title"
            placeholderTextColor="#9ca3af"
            style={styles.linkInput}
          />
          <Pressable
            onPress={handleAddSourceClick}
            style={({ pressed }) => [
              styles.addLinkButton,
              !newLinkUrl.trim() && styles.addLinkButtonDisabled,
              pressed && styles.buttonPressed,
            ]}
            disabled={!newLinkUrl.trim()}
          >
            <Text style={styles.addLinkButtonText}>Add to canvas</Text>
          </Pressable>
        </View>
      )}

      {/* Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowColorPicker(false)}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Choose Color</Text>
            {NOTE_COLORS.map((noteColor) => (
              <Pressable
                key={noteColor.name}
                onPress={() => {
                  updateNote(activeNote!.id, { color: noteColor.name });
                  setShowColorPicker(false);
                }}
                style={({ pressed }) => [
                  styles.pickerOption,
                  pressed && styles.pickerOptionPressed,
                ]}
              >
                <View style={[styles.colorSwatch, { backgroundColor: noteColor.color }]} />
                <Text style={styles.pickerOptionText}>{noteColor.name}</Text>
                {activeNote?.color === noteColor.name && <Check size={16} color="#3b82f6" />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Folder Picker Modal */}
      <Modal
        visible={showFolderPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFolderPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFolderPicker(false)}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Choose Folder</Text>
            <Pressable
              onPress={() => {
                updateNote(activeNote!.id, { folderId: null });
                setShowFolderPicker(false);
              }}
              style={({ pressed }) => [
                styles.pickerOption,
                pressed && styles.pickerOptionPressed,
              ]}
            >
              <Text style={styles.pickerOptionText}>No Folder</Text>
              {!activeNote?.folderId && <Check size={16} color="#3b82f6" />}
            </Pressable>
            {folders.map((folder) => (
              <Pressable
                key={folder.id}
                onPress={() => {
                  updateNote(activeNote!.id, { folderId: folder.id });
                  setShowFolderPicker(false);
                }}
                style={({ pressed }) => [
                  styles.pickerOption,
                  pressed && styles.pickerOptionPressed,
                ]}
              >
                <Text style={styles.pickerOptionText}>{folder.name}</Text>
                {activeNote?.folderId === folder.id && <Check size={16} color="#3b82f6" />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -200 }],
    zIndex: 40,
    flexDirection: 'row',
    gap: 8,
  },
  collapsedContainer: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: [{ translateY: -24 }],
    zIndex: 40,
  },
  expandButton: {
    width: 24,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  toolStrip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 8,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  toolButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collapseButton: {
    width: 32,
    height: 32,
    marginBottom: 4,
  },
  toolButtonActive: {
    backgroundColor: '#3b82f6',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  emojiButton: {
    fontSize: 20,
  },
  noteToolsPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 8,
    width: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  noteToolsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noteToolsTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
  },
  noteName: {
    fontSize: 10,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  noteToolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  noteToolButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  noteToolText: {
    fontSize: 11,
    color: '#374151',
  },
  deleteToolButton: {},
  deleteText: {
    color: '#ef4444',
  },
  expandedPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  panelTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  panelSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 12,
    marginBottom: 8,
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stickerButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  stickerIcon: {
    fontSize: 18,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  colorButton: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    borderColor: '#3b82f6',
  },
  linkInput: {
    height: 32,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 12,
    marginBottom: 8,
    color: '#1f2937',
  },
  addLinkButton: {
    height: 32,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addLinkButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  addLinkButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: 200,
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  pickerOptionPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  pickerOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    textTransform: 'capitalize',
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export default ToolStrip;
