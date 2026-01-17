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
  Moon,
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
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [scale, setScale] = useState(1);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Undo/Redo history
  const [history, setHistory] = useState<{ notes: Note[], todos: Todo[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const maxHistoryLength = 50;

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
  }, [activeFolder, saveToHistory]);

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, !isDarkMode && styles.containerLight]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

        {/* ===== HEADER ===== */}
        <View style={[styles.header, !isDarkMode && styles.headerLight]}>
          {/* Logo */}
          <View style={styles.headerLogo}>
            <Image source={require('./assets/logo.png')} style={styles.logoImage} />
          </View>
          
          {/* Spacer */}
          <View style={{ flex: 1 }} />
          
          {/* Folder Dropdown */}
          <View style={styles.folderDropdownWrapper}>
            <Pressable 
              style={[styles.folderDropdown, !isDarkMode && styles.folderDropdownLight]}
              onPress={() => setShowFolderDropdown(!showFolderDropdown)}
            >
              <Folder size={14} color="#8B5CF6" />
              <Text style={[styles.folderDropdownText, !isDarkMode && styles.folderDropdownTextLight]} numberOfLines={1}>
                {activeFolderName}
              </Text>
              <ChevronDown size={12} color={isDarkMode ? "#6B7280" : "#9CA3AF"} style={showFolderDropdown && { transform: [{ rotate: '180deg' }] }} />
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
          
          {/* Spacer */}
          <View style={{ flex: 1 }} />
          
          {/* Middle: Search, Undo, Redo */}
          <Pressable style={styles.headerIconButton} onPress={() => setShowSearchModal(true)}>
            <Search size={18} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
          </Pressable>
          <Pressable 
            style={[styles.headerIconButton, historyIndex <= 0 && styles.headerIconButtonDisabled]} 
            onPress={handleUndo}
            disabled={historyIndex <= 0}
          >
            <Undo2 size={18} color={historyIndex > 0 ? (isDarkMode ? "#9CA3AF" : "#6B7280") : (isDarkMode ? "#4B5563" : "#CBD5E1")} />
          </Pressable>
          <Pressable 
            style={[styles.headerIconButton, historyIndex >= history.length - 1 && styles.headerIconButtonDisabled]} 
            onPress={handleRedo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo2 size={18} color={historyIndex < history.length - 1 ? (isDarkMode ? "#9CA3AF" : "#6B7280") : (isDarkMode ? "#4B5563" : "#CBD5E1")} />
          </Pressable>
          
          {/* Right: Theme toggle + Note count */}
          <Pressable 
            style={[styles.headerIconButton, styles.themeToggleButton, !isDarkMode && styles.themeToggleButtonLight]} 
            onPress={() => setIsDarkMode(!isDarkMode)}
          >
            {isDarkMode ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#64748B" />}
          </Pressable>
          
          {/* Note count badge */}
          <View style={[styles.headerNoteCount, !isDarkMode && styles.headerNoteCountLight]}>
            <Text style={[styles.headerNoteCountText, !isDarkMode && styles.headerNoteCountTextLight]}>{filteredNotes.length}</Text>
          </View>
        </View>

        {/* ===== MAIN CONTENT AREA ===== */}
        <View style={styles.mainContent}>
          {/* ===== CANVAS AREA ===== */}
          <View style={styles.canvasArea}>
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
              pinchGestureEnabled={true}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ width: CANVAS_WIDTH * scale, height: CANVAS_HEIGHT * scale }}
              >
                <View style={[styles.canvasContent, { transform: [{ scale }] }, !isDarkMode && styles.canvasContentLight]}>
                  {/* Grid */}
                  <View style={styles.gridContainer}>{renderGrid()}</View>

                  {/* Empty State */}
                  {filteredNotes.length === 0 && todos.length === 0 && (
                    <View style={[styles.emptyState, !isDarkMode && styles.emptyStateLight]}>
                      <Text style={styles.emptyStateIcon}>📝</Text>
                      <Text style={[styles.emptyStateTitle, !isDarkMode && styles.emptyStateTitleLight]}>Your canvas awaits!</Text>
                      <Text style={styles.emptyStateSubtitle}>Tap + to add notes</Text>
                    </View>
                  )}

                  {/* Note Cards */}
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
                      style={[styles.noteCard, { left: note.position.x, top: note.position.y }, !isDarkMode && styles.noteCardLight]}
                    >
                      <View style={[styles.noteCardHeader, !isDarkMode && styles.noteCardHeaderLight]}>
                        <View style={styles.noteCardDrag}>
                          <GripVertical size={14} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
                        </View>
                        <Text style={[styles.noteCardTitle, !isDarkMode && styles.noteCardTitleLight]} numberOfLines={1}>
                          {note.title || 'New Note'}
                        </Text>
                        <Pressable onPress={() => deleteNote(note.id)} style={styles.noteCardClose}>
                          <X size={14} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
                        </Pressable>
                      </View>
                      <View style={[styles.noteCardBody, !isDarkMode && styles.noteCardBodyLight]}>
                        <Text style={[styles.noteCardContent, !isDarkMode && styles.noteCardContentLight]} numberOfLines={6}>
                          {note.content || 'Click to start writing...'}
                        </Text>
                      </View>
                      <Text style={[styles.noteCardWordCount, !isDarkMode && styles.noteCardWordCountLight]}>
                        {note.content?.split(/\s+/).filter(Boolean).length || 0} words
                      </Text>
                    </Pressable>
                  ))}

                  {/* Yellow Sticky Note Stickers - keep yellow in both modes */}
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
                      style={[styles.todoCard, { left: todo.position.x, top: todo.position.y }, !isDarkMode && styles.todoCardLight]}
                    >
                      <View style={[styles.todoHeader, !isDarkMode && styles.todoHeaderLight]}>
                        <View style={styles.todoHeaderLeft}>
                          <CheckSquare size={14} color="#8B5CF6" />
                          <Text style={[styles.todoTitle, !isDarkMode && styles.todoTitleLight]}>{todo.title || 'Todo List'}</Text>
                        </View>
                        <View style={styles.todoHeaderRight}>
                          <Text style={[styles.todoCount, !isDarkMode && styles.todoCountLight]}>
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
                    </View>
                  ))}


                </View>
              </ScrollView>
            </ScrollView>

          </View>
        </View>

        {/* ===== BOTTOM DOCK (Scrollable) ===== */}
        <View style={[styles.bottomDockContainer, !isDarkMode && styles.bottomDockContainerLight]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bottomDockScroll}
          >
            <Pressable style={styles.dockButton} onPress={() => addNote()}>
              <View style={[styles.dockButtonInner, !isDarkMode && styles.dockButtonInnerLight]}>
                <Plus size={18} color={isDarkMode ? "#fff" : "#64748b"} />
              </View>
              <Text style={[styles.dockButtonText, !isDarkMode && styles.dockButtonTextLight]}>Note</Text>
            </Pressable>
            
            <Pressable style={styles.dockButton} onPress={addTodo}>
              <View style={[styles.dockButtonInner, !isDarkMode && styles.dockButtonInnerLight]}>
                <CheckSquare size={18} color={isDarkMode ? "#fff" : "#64748b"} />
              </View>
              <Text style={[styles.dockButtonText, !isDarkMode && styles.dockButtonTextLight]}>Todo</Text>
            </Pressable>
            
            <Pressable style={styles.dockButton}>
              <View style={[styles.dockButtonInner, !isDarkMode && styles.dockButtonInnerLight]}>
                <FileText size={18} color={isDarkMode ? "#fff" : "#64748b"} />
              </View>
              <Text style={[styles.dockButtonText, !isDarkMode && styles.dockButtonTextLight]}>Sticker</Text>
            </Pressable>
            
            <Pressable style={styles.dockButton} onPress={() => setShowNewFolderModal(true)}>
              <View style={[styles.dockButtonInner, styles.dockButtonHighlight, !isDarkMode && styles.dockButtonHighlightLight]}>
                <Folder size={18} color="#F59E0B" />
              </View>
              <Text style={[styles.dockButtonText, !isDarkMode && styles.dockButtonTextLight]}>Folder</Text>
            </Pressable>
            
            <Pressable style={styles.dockButton}>
              <View style={[styles.dockButtonInner, !isDarkMode && styles.dockButtonInnerLight]}>
                <ImageIcon size={18} color={isDarkMode ? "#fff" : "#64748b"} />
              </View>
              <Text style={[styles.dockButtonText, !isDarkMode && styles.dockButtonTextLight]}>Image</Text>
            </Pressable>
            
            <Pressable style={styles.dockButton}>
              <View style={[styles.dockButtonInner, !isDarkMode && styles.dockButtonInnerLight]}>
                <Table size={18} color={isDarkMode ? "#fff" : "#64748b"} />
              </View>
              <Text style={[styles.dockButtonText, !isDarkMode && styles.dockButtonTextLight]}>Table</Text>
            </Pressable>
            
            <Pressable style={styles.dockButton}>
              <View style={[styles.dockButtonInner, !isDarkMode && styles.dockButtonInnerLight]}>
                <Link size={18} color={isDarkMode ? "#fff" : "#64748b"} />
              </View>
              <Text style={[styles.dockButtonText, !isDarkMode && styles.dockButtonTextLight]}>Source</Text>
            </Pressable>
            
            <Pressable style={styles.dockButton}>
              <View style={[styles.dockButtonInner, !isDarkMode && styles.dockButtonInnerLight]}>
                <Pencil size={18} color={isDarkMode ? "#fff" : "#64748b"} />
              </View>
              <Text style={[styles.dockButtonText, !isDarkMode && styles.dockButtonTextLight]}>Draw</Text>
            </Pressable>
            
            <Pressable style={styles.dockButton} onPress={() => setIsTrashOpen(true)}>
              <View style={[styles.dockButtonInner, styles.dockButtonTrash, !isDarkMode && styles.dockButtonTrashLight]}>
                <Trash2 size={18} color="#EF4444" />
              </View>
              <Text style={[styles.dockButtonText, !isDarkMode && styles.dockButtonTextLight]}>Trash</Text>
            </Pressable>
          </ScrollView>
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
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    gap: 6,
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
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconButtonDisabled: {
    opacity: 0.5,
  },
  folderDropdownWrapper: {
    position: 'relative',
    zIndex: 100,
  },
  folderDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    minWidth: 100,
  },
  folderDropdownLight: {
    backgroundColor: '#f1f5f9',
  },
  folderDropdownText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
    maxWidth: 80,
  },
  folderDropdownTextLight: {
    color: '#334155',
  },
  folderDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    minWidth: 140,
    maxHeight: 200,
    overflow: 'hidden',
  },
  folderDropdownMenuLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  folderDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  folderDropdownItemActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  folderDropdownItemText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  folderDropdownItemTextLight: {
    color: '#334155',
  },
  folderDropdownItemTextActive: {
    color: '#8B5CF6',
  },
  headerZoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 2,
    flex: 1,
    marginHorizontal: 4,
  },
  headerZoomButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerZoomText: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'center',
  },
  headerNoteCount: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  headerNoteCountText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
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

  // Bottom Dock (Scrollable) - Compact
  bottomDockContainer: {
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingBottom: 20,
  },
  bottomDockScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  dockButton: {
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dockButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  dockButtonHighlight: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  dockButtonTrash: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  dockButtonText: {
    color: '#9ca3af',
    fontSize: 9,
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

  // ===== LIGHT MODE STYLES =====
  containerLight: {
    backgroundColor: '#f8fafc',
  },
  headerLight: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0',
  },
  themeToggleButton: {
    backgroundColor: '#334155',
    borderRadius: 6,
  },
  themeToggleButtonLight: {
    backgroundColor: '#f1f5f9',
  },
  headerNoteCountLight: {
    backgroundColor: '#e2e8f0',
  },
  headerNoteCountTextLight: {
    color: '#64748b',
  },
  canvasContentLight: {
    backgroundColor: '#f1f5f9',
  },
  emptyStateLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  emptyStateTitleLight: {
    color: '#1e293b',
  },
  noteCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  noteCardHeaderLight: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0',
  },
  noteCardTitleLight: {
    color: '#1e293b',
  },
  noteCardBodyLight: {
    backgroundColor: '#f8fafc',
  },
  noteCardContentLight: {
    color: '#475569',
  },
  noteCardWordCountLight: {
    color: '#94a3b8',
    backgroundColor: '#ffffff',
  },
  todoCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  todoHeaderLight: {
    backgroundColor: '#ffffff',
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
    backgroundColor: '#ffffff',
    borderTopColor: '#e2e8f0',
  },
  dockButtonInnerLight: {
    backgroundColor: '#f1f5f9',
  },
  dockButtonTextLight: {
    color: '#64748b',
  },
  dockButtonHighlightLight: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  dockButtonTrashLight: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  
  // Search Modal
  searchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingTop: 80,
    paddingHorizontal: 16,
  },
  searchModalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchModalContentLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  searchInput: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 16,
    paddingVertical: 8,
  },
  searchInputLight: {
    color: '#1e293b',
  },
  searchResults: {
    marginTop: 12,
    maxHeight: 400,
  },
  searchResultItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  searchResultItemLight: {
    borderBottomColor: '#e2e8f0',
  },
  searchResultTitle: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  searchResultTitleLight: {
    color: '#1e293b',
  },
  searchResultContent: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  searchResultContentLight: {
    color: '#64748b',
  },
  searchNoResults: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  searchNoResultsLight: {
    color: '#94a3b8',
  },
});
