import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Pressable,
  Dimensions,
  StyleSheet,
  Image,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  Undo2,
  Redo2,
  GripVertical,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Canvas configuration
const CANVAS_WIDTH = 4000;
const CANVAS_HEIGHT = 4000;

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

export default function App() {
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
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [scale, setScale] = useState(1);
  const scrollViewRef = useRef<ScrollView>(null);

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

  // Note functions
  const addNote = useCallback((noteData?: Partial<Note>) => {
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
  }, [activeFolder]);

  const updateNote = useCallback((id: number, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    );
  }, []);

  const deleteNote = useCallback((id: number) => {
    const noteToDelete = notes.find((n) => n.id === id);
    if (noteToDelete) {
      setTrash((prev) => [
        ...prev,
        { id: Date.now(), type: 'note', item: noteToDelete, deletedAt: new Date().toISOString() },
      ]);
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, [notes]);

  // Todo functions
  const addTodo = useCallback(() => {
    const newTodo: Todo = {
      id: Date.now(),
      title: 'New Checklist',
      items: [{ text: '', completed: false }],
      position: { x: 200 + Math.random() * 200, y: 200 + Math.random() * 200 },
      folderId: activeFolder,
      createdAt: new Date().toISOString(),
    };
    setTodos((prev) => [...prev, newTodo]);
  }, [activeFolder]);

  const updateTodo = useCallback((id: number, updates: Partial<Todo>) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const deleteTodo = useCallback((id: number) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
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

  // Filtered notes based on active folder and search
  const filteredNotes = notes.filter((note) => {
    const inFolder = activeFolder === null || note.folderId === activeFolder;
    const matchesSearch =
      !searchQuery ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    return inFolder && matchesSearch;
  });

  // Render grid dots
  const renderGrid = () => {
    const dots: React.ReactNode[] = [];
    const step = 100;
    const maxDots = 40;
    for (let i = 0; i < maxDots; i++) {
      for (let j = 0; j < maxDots; j++) {
        dots.push(
          <View
            key={`dot-${i}-${j}`}
            style={[styles.gridDot, { left: i * step, top: j * step }]}
          />
        );
      }
    }
    return dots;
  };

  // State for sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* ===== HEADER ===== */}
        <View style={styles.header}>
          {/* Logo */}
          <View style={styles.headerLogo}>
            <Image source={require('./assets/logo.png')} style={styles.logoImage} />
          </View>
          
          {/* Search */}
          <Pressable style={styles.headerIconButton}>
            <Search size={20} color="#9CA3AF" />
          </Pressable>
          
          {/* Undo/Redo */}
          <Pressable style={styles.headerIconButton}>
            <Undo2 size={18} color="#6B7280" />
          </Pressable>
          <Pressable style={styles.headerIconButton}>
            <Redo2 size={18} color="#6B7280" />
          </Pressable>
          
          {/* Folder Dropdown */}
          <Pressable 
            style={styles.folderDropdown}
            onPress={() => setShowFolderDropdown(!showFolderDropdown)}
          >
            <Folder size={16} color="#9CA3AF" />
            <Text style={styles.folderDropdownText}>{activeFolderName}</Text>
            <ChevronDown size={16} color="#9CA3AF" />
          </Pressable>
          
          {/* Right icons */}
          <Pressable style={styles.headerIconButton}>
            <Download size={18} color="#9CA3AF" />
          </Pressable>
          <Pressable style={styles.headerIconButton} onPress={() => setShowNameInput(true)}>
            <Sun size={18} color="#9CA3AF" />
          </Pressable>
        </View>

        {/* ===== MAIN CONTENT AREA ===== */}
        <View style={styles.mainContent}>
          
          {/* ===== LEFT SIDEBAR ===== */}
          <View style={[styles.sidebar, sidebarCollapsed && styles.sidebarCollapsed]}>
            {/* Collapse button */}
            <Pressable 
              style={styles.sidebarButton}
              onPress={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <ChevronLeft size={20} color="#9CA3AF" />
            </Pressable>
            
            <View style={styles.sidebarDivider} />
            
            {/* Tool buttons */}
            <Pressable 
              style={[styles.sidebarButton, activeTool === 'add' && styles.sidebarButtonActive]}
              onPress={() => {
                setActiveTool('add');
                addNote();
              }}
            >
              <Plus size={20} color="#9CA3AF" />
            </Pressable>
            
            <Pressable style={styles.sidebarButton}>
              <Pencil size={20} color="#9CA3AF" />
            </Pressable>
            
            <Pressable style={styles.sidebarButton}>
              <Minus size={20} color="#9CA3AF" />
            </Pressable>
            
            <Pressable style={styles.sidebarButton}>
              <ArrowRight size={20} color="#9CA3AF" />
            </Pressable>
            
            <Pressable style={styles.sidebarButton}>
              <Circle size={20} color="#9CA3AF" />
            </Pressable>
            
            <Pressable style={styles.sidebarButton}>
              <ImageIcon size={20} color="#9CA3AF" />
            </Pressable>
            
            <Pressable 
              style={[styles.sidebarButton, styles.sidebarButtonHighlight]}
              onPress={() => setShowNewFolderModal(true)}
            >
              <Folder size={20} color="#F59E0B" />
            </Pressable>
            
            <Pressable style={styles.sidebarButton}>
              <Square size={20} color="#9CA3AF" />
            </Pressable>
            
            <Pressable style={styles.sidebarButton}>
              <Table size={20} color="#9CA3AF" />
            </Pressable>
            
            <Pressable 
              style={styles.sidebarButton}
              onPress={addTodo}
            >
              <CheckSquare size={20} color="#9CA3AF" />
            </Pressable>
            
            <Pressable style={styles.sidebarButton}>
              <Link size={20} color="#9CA3AF" />
            </Pressable>
          </View>

          {/* ===== CANVAS AREA ===== */}
          <View style={styles.canvasArea}>
            {/* Zoom Controls Bar */}
            <View style={styles.zoomBar}>
              <Pressable onPress={handleZoomOut} style={styles.zoomButton}>
                <ZoomOut size={16} color="#9CA3AF" />
              </Pressable>
              <Text style={styles.zoomText}>{Math.round(scale * 100)}%</Text>
              <Pressable onPress={handleZoomIn} style={styles.zoomButton}>
                <ZoomIn size={16} color="#9CA3AF" />
              </Pressable>
              <Pressable onPress={resetZoom} style={styles.zoomButton}>
                <RotateCcw size={14} color="#9CA3AF" />
              </Pressable>
              
              {/* Note count */}
              <View style={styles.noteCountBadge}>
                <Text style={styles.noteCountText}>{filteredNotes.length}/100 notes</Text>
              </View>
            </View>

            {/* Canvas */}
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              style={styles.canvasScrollView}
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
                  {/* Grid */}
                  <View style={styles.gridContainer}>{renderGrid()}</View>

                  {/* Empty State */}
                  {filteredNotes.length === 0 && todos.length === 0 && (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateIcon}>📝</Text>
                      <Text style={styles.emptyStateTitle}>Your canvas awaits!</Text>
                      <Text style={styles.emptyStateSubtitle}>Tap + to add notes</Text>
                    </View>
                  )}

                  {/* Note Cards (dark themed) */}
                  {filteredNotes.map((note) => (
                    <Pressable
                      key={note.id}
                      onPress={() => setEditingNote(note)}
                      onLongPress={() => {
                        Alert.alert('Delete Note', `Delete "${note.title || 'Untitled'}"?`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => deleteNote(note.id) },
                        ]);
                      }}
                      style={[styles.noteCard, { left: note.position.x, top: note.position.y }]}
                    >
                      <View style={styles.noteCardHeader}>
                        <View style={styles.noteCardDrag}>
                          <GripVertical size={14} color="#6B7280" />
                        </View>
                        <Text style={styles.noteCardTitle} numberOfLines={1}>
                          {note.title || 'New Note'}
                        </Text>
                        <Pressable onPress={() => deleteNote(note.id)} style={styles.noteCardClose}>
                          <X size={14} color="#6B7280" />
                        </Pressable>
                      </View>
                      <View style={styles.noteCardBody}>
                        <Text style={styles.noteCardContent} numberOfLines={6}>
                          {note.content || 'Click to start writing...'}
                        </Text>
                      </View>
                      <Text style={styles.noteCardWordCount}>
                        {note.content?.split(/\s+/).filter(Boolean).length || 0} words
                      </Text>
                    </Pressable>
                  ))}

                  {/* Yellow Sticky Note Stickers */}
                  {noteStickers.map((sticker) => (
                    <View
                      key={sticker.id}
                      style={[styles.stickyNote, { left: sticker.position?.x || 200, top: sticker.position?.y || 200 }]}
                    >
                      {/* Pushpin */}
                      <View style={styles.pushpin}>
                        <View style={styles.pushpinHead} />
                        <View style={styles.pushpinPoint} />
                      </View>
                      {/* Fold effect */}
                      <View style={styles.stickyFold} />
                      <Text style={styles.stickyTitle} numberOfLines={1}>
                        {sticker.title || ''}
                      </Text>
                      <Text style={styles.stickyContent} numberOfLines={4}>
                        {sticker.content || ''}
                      </Text>
                    </View>
                  ))}

                  {/* Todo Cards */}
                  {todos.map((todo) => (
                    <View
                      key={todo.id}
                      style={[styles.todoCard, { left: todo.position.x, top: todo.position.y }]}
                    >
                      <View style={styles.todoHeader}>
                        <View style={styles.todoHeaderLeft}>
                          <CheckSquare size={14} color="#8B5CF6" />
                          <Text style={styles.todoTitle}>{todo.title || 'Todo List'}</Text>
                        </View>
                        <View style={styles.todoHeaderRight}>
                          <Text style={styles.todoCount}>
                            {todo.items?.filter(i => i.completed).length || 0}/{todo.items?.length || 0}
                          </Text>
                          <Pressable onPress={() => deleteTodo(todo.id)}>
                            <X size={14} color="#ef4444" />
                          </Pressable>
                        </View>
                      </View>
                      {todo.items?.slice(0, 5).map((item, idx) => (
                        <Pressable
                          key={idx}
                          onPress={() => {
                            const newItems = [...todo.items];
                            newItems[idx] = { ...item, completed: !item.completed };
                            updateTodo(todo.id, { items: newItems });
                          }}
                          style={styles.todoItemRow}
                        >
                          <View style={[styles.todoCheckbox, item.completed && styles.todoCheckboxChecked]}>
                            {item.completed && <Text style={styles.todoCheckmark}>✓</Text>}
                          </View>
                          <Text
                            style={[styles.todoItemText, item.completed && styles.todoItemCompleted]}
                            numberOfLines={1}
                          >
                            {item.text || 'Add a task...'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ))}


                </View>
              </ScrollView>
            </ScrollView>

            {/* Floating Trash Button */}
            <Pressable 
              style={styles.trashFloatingButton}
              onPress={() => setIsTrashOpen(true)}
            >
              <Trash2 size={24} color="#EF4444" />
            </Pressable>
          </View>
        </View>

        {/* ===== BOTTOM DOCK ===== */}
        <View style={styles.bottomDock}>
          <Pressable style={styles.dockButton} onPress={() => addNote()}>
            <View style={styles.dockButtonInner}>
              <Plus size={22} color="#fff" />
            </View>
            <Text style={styles.dockButtonText}>Note</Text>
          </Pressable>
          
          <Pressable style={styles.dockButton} onPress={addTodo}>
            <View style={styles.dockButtonInner}>
              <CheckSquare size={22} color="#fff" />
            </View>
            <Text style={styles.dockButtonText}>Todo</Text>
          </Pressable>
          
          <Pressable style={styles.dockButton} onPress={() => setShowNewFolderModal(true)}>
            <View style={[styles.dockButtonInner, styles.dockButtonHighlight]}>
              <Folder size={22} color="#F59E0B" />
            </View>
            <Text style={styles.dockButtonText}>Folder</Text>
          </Pressable>
          
          <Pressable style={styles.dockButton}>
            <View style={styles.dockButtonInner}>
              <ImageIcon size={22} color="#fff" />
            </View>
            <Text style={styles.dockButtonText}>Image</Text>
          </Pressable>
          
          <Pressable style={styles.dockButton}>
            <View style={styles.dockButtonInner}>
              <Table size={22} color="#fff" />
            </View>
            <Text style={styles.dockButtonText}>Table</Text>
          </Pressable>
        </View>

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
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 16,
    fontSize: 16,
  },
  
  // Header - matching web design
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    gap: 8,
  },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    flex: 1,
    marginHorizontal: 4,
  },
  folderDropdownText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  // Main content area
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },

  // Left Sidebar
  sidebar: {
    width: 56,
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#334155',
  },
  sidebarCollapsed: {
    width: 0,
    overflow: 'hidden',
  },
  sidebarButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  sidebarButtonActive: {
    backgroundColor: '#334155',
  },
  sidebarButtonHighlight: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  sidebarDivider: {
    width: 32,
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 8,
  },

  // Canvas area
  canvasArea: {
    flex: 1,
    position: 'relative',
  },
  canvasScrollView: {
    flex: 1,
  },

  // Zoom bar - positioned like web
  zoomBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  zoomButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  noteCountBadge: {
    marginLeft: 'auto',
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  noteCountText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Canvas
  canvasContent: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: '#151a2e',
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
    backgroundColor: 'rgba(75, 85, 99, 0.4)',
  },
  
  // Empty state
  emptyState: {
    position: 'absolute',
    top: 200,
    left: 100,
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    color: '#9ca3af',
    fontSize: 14,
  },

  // Note Card - dark themed like web
  noteCard: {
    position: 'absolute',
    width: 220,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  noteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    backgroundColor: '#1e293b',
  },
  noteCardDrag: {
    marginRight: 8,
  },
  noteCardTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noteCardClose: {
    padding: 2,
  },
  noteCardBody: {
    padding: 12,
    backgroundColor: '#0f172a',
    minHeight: 100,
  },
  noteCardContent: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 20,
  },
  noteCardWordCount: {
    color: '#6B7280',
    fontSize: 11,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  
  // Sticky Note - yellow post-it style (for note stickers)
  stickyNote: {
    position: 'absolute',
    width: 160,
    minHeight: 140,
    backgroundColor: '#fbbf24',
    padding: 16,
    paddingTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    transform: [{ rotate: '-2deg' }],
  },
  pushpin: {
    position: 'absolute',
    top: -8,
    left: '50%',
    marginLeft: -8,
    alignItems: 'center',
    zIndex: 10,
  },
  pushpinHead: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#D97706',
    borderWidth: 2,
    borderColor: '#92400E',
  },
  pushpinPoint: {
    width: 4,
    height: 8,
    backgroundColor: '#6B7280',
    marginTop: -2,
  },
  stickyFold: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    backgroundColor: '#F59E0B',
    borderTopLeftRadius: 30,
  },
  stickyTitle: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  stickyContent: {
    color: '#374151',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  stickyWordCount: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 8,
  },
  
  // Todo card - dark themed like web
  todoCard: {
    position: 'absolute',
    width: 200,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  todoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  todoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todoHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  todoCount: {
    color: '#6B7280',
    fontSize: 12,
  },
  todoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  todoCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoCheckboxChecked: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  todoCheckmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  todoItemText: {
    flex: 1,
    fontSize: 13,
    color: '#9CA3AF',
  },
  todoItemCompleted: {
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },

  // Floating Trash Button
  trashFloatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderWidth: 2,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Bottom Dock
  bottomDock: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  dockButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dockButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dockButtonHighlight: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  dockButtonText: {
    color: '#9ca3af',
    fontSize: 11,
  },

  // Note Editor Modal
  noteEditorModal: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#334155',
    borderBottomWidth: 0,
  },
  noteEditorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  noteEditorDragHandle: {
    marginRight: 12,
  },
  noteEditorTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noteEditorClose: {
    padding: 4,
  },
  noteEditorContent: {
    padding: 16,
  },
  noteTitleInput: {
    backgroundColor: '#334155',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  noteContentInput: {
    backgroundColor: '#0f172a',
    color: '#9CA3AF',
    fontSize: 14,
    padding: 12,
    borderRadius: 8,
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#334155',
  },
  noteWordCount: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },

  // Folder Dropdown Modal
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  folderDropdownMenu: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#334155',
    maxWidth: 250,
  },
  folderMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 10,
  },
  folderMenuItemActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  folderMenuItemText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  folderMenuItemTextActive: {
    color: '#F59E0B',
  },
  folderMenuDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 4,
  },

  // Modal buttons
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  
  // Name modal
  nameModalContent: {
    backgroundColor: '#1e293b',
    margin: 20,
    marginBottom: 40,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  nameModalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  nameModalSubtitle: {
    color: '#9ca3af',
    fontSize: 15,
    marginBottom: 20,
  },
  nameInput: {
    backgroundColor: '#334155',
    color: '#fff',
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 16,
  },
  nameSubmitButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  nameSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Trash
  trashList: {
    maxHeight: 400,
  },
  trashEmpty: {
    color: '#9ca3af',
    textAlign: 'center',
    padding: 32,
  },
  trashItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  trashItemTitle: {
    color: '#fff',
    fontSize: 14,
  },
  trashRestore: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
});
