import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from './components/ui/sonner';
import Header from './components/Header';
import Canvas from './components/Canvas';
import ToolStrip from './components/ToolStrip';
import CharacterPanelSlim from './components/CharacterPanelSlim';
import BattleModal from './components/BattleModal';
import CharacterUnlockModal from './components/CharacterUnlockModal';
import NameInputModal from './components/NameInputModal';

function App() {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null);
  const [stickers, setStickers] = useState([]);
  const [images, setImages] = useState([]);
  const [tables, setTables] = useState([]);
  const [todos, setTodos] = useState([]);
  const [connections, setConnections] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [unlockedCharacter, setUnlockedCharacter] = useState(null);
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalWords: 0,
    xp: 0,
    level: 1,
    timeSpent: 0,
    battles: 0,
    wins: 0
  });
  const [showNameInput, setShowNameInput] = useState(false);
  const [userName, setUserName] = useState('Adventurer');
  const [showBattle, setShowBattle] = useState(false);
  const [characterPanelOpen, setCharacterPanelOpen] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const timeIntervalRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const safePosition = (pos) =>
  pos && typeof pos.x === 'number' && typeof pos.y === 'number'
    ? pos
    : { x: 100, y: 100 };

  const safeSize = (size, fallback) =>
  size && typeof size.width === 'number' && typeof size.height === 'number'
    ? size
    : fallback;


  // Undo/Redo state
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedo = useRef(false);

  // Load data from localStorage on mount
useEffect(() => {
  console.log('Loading data from localStorage...');
  try {
    const load = (key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    };

    setNotes(
      load('anotequest_notes').map(n => ({
        ...n,
        position: safePosition(n.position)
      }))
    );

    setFolders(load('anotequest_folders'));

    setStickers(
      load('anotequest_stickers').map(s => ({
        ...s,
        position: safePosition(s.position),
        rotation: s.rotation ?? 0
      }))
    );

    setImages(
      load('anotequest_images').map(i => ({
        ...i,
        position: safePosition(i.position),
        size: safeSize(i.size, { width: 300, height: 200 })
      }))
    );

    setTables(
      load('anotequest_tables').map(t => ({
        ...t,
        position: safePosition(t.position),
        size: safeSize(t.size, { width: 400, height: 200 }),
        data: t.data ?? [['']]
      }))
    );

    setTodos(
      load('anotequest_todos').map(t => ({
        ...t,
        position: safePosition(t.position)
      }))
    );

    setCharacters(load('anotequest_characters'));

    const savedStats = localStorage.getItem('anotequest_stats');
    if (savedStats) setStats(JSON.parse(savedStats));

    const savedPremium = localStorage.getItem('anotequest_premium');
    if (savedPremium) setIsPremium(JSON.parse(savedPremium));

    const savedUserName = localStorage.getItem('anotequest_username');
    if (savedUserName) setUserName(savedUserName);
    else setShowNameInput(true);

    setIsLoaded(true);
  } catch (err) {
    console.error('Corrupted localStorage, resetting', err);
    localStorage.clear();
    setIsLoaded(true);
  }
}, []);


  // Track time spent
  useEffect(() => {
    if (!isLoaded) return;
    
    timeIntervalRef.current = setInterval(() => {
      setStats(prev => ({
        ...prev,
        timeSpent: prev.timeSpent + 1
      }));
    }, 1000);

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [isLoaded]);

  // Save to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    const timeout = setTimeout(() => {
      localStorage.setItem('anotequest_notes', JSON.stringify(notes));
    }, 500);
    return () => clearTimeout(timeout);
  }, [notes, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('anotequest_folders', JSON.stringify(folders));
  }, [folders, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('anotequest_stickers', JSON.stringify(stickers));
  }, [stickers, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('anotequest_images', JSON.stringify(images));
  }, [images, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('anotequest_tables', JSON.stringify(tables));
  }, [tables, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('anotequest_todos', JSON.stringify(todos));
  }, [todos, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('anotequest_characters', JSON.stringify(characters));
  }, [characters, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('anotequest_stats', JSON.stringify(stats));
  }, [stats, isLoaded]);

  // Save history for undo/redo (simplified - just notes)
  useEffect(() => {
    if (!isLoaded || isUndoRedo.current) {
      isUndoRedo.current = false;
      return;
    }
    
    const state = { notes: [...notes] };
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(state);
      // Keep only last 50 states
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [notes, isLoaded]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedo.current = true;
      const prevState = history[historyIndex - 1];
      setNotes(prevState.notes);
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedo.current = true;
      const nextState = history[historyIndex + 1];
      setNotes(nextState.notes);
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex]);

  // Calculate stats and check for unlocks
  useEffect(() => {
    if (!isLoaded) return;
    
    const totalNotes = notes.length;
    const totalWords = notes.reduce((sum, note) => {
      const wordCount = note.content?.trim().split(/\s+/).filter(w => w.length > 0).length || 0;
      return sum + wordCount;
    }, 0);

    const xp = (totalNotes * 10) + Math.floor(totalWords / 10);
    const level = Math.floor(xp / 100) + 1;

    setStats(prev => ({
      ...prev,
      totalNotes,
      totalWords,
      xp,
      level
    }));

    checkCharacterUnlocks(totalNotes, totalWords, xp, stats.timeSpent);
  }, [notes, isLoaded]);

  const checkCharacterUnlocks = useCallback((totalNotes, totalWords, xp, timeSpent) => {
    const characterTypes = [
      { id: 1, name: 'Scribe the Wizard', requirement: { notes: 5, words: 50, time: 0 }, emoji: '🧙', type: 'wizard', unlocked: false },
      { id: 2, name: 'Knight Notarius', requirement: { notes: 15, words: 200, time: 60 }, emoji: '⚔️', type: 'soldier', unlocked: false },
      { id: 3, name: 'Inky the Dragon', requirement: { notes: 30, words: 500, time: 180 }, emoji: '🐉', type: 'dragon', unlocked: false },
      { id: 4, name: 'Sage the Owl', requirement: { notes: 50, words: 1000, time: 300 }, emoji: '🦉', type: 'sage', unlocked: false },
      { id: 5, name: 'Phoenix Wordsmith', requirement: { notes: 75, words: 1500, time: 600 }, emoji: '🔥', type: 'phoenix', unlocked: false },
      { id: 6, name: 'Warrior Scribbles', requirement: { notes: 100, words: 2500, time: 900 }, emoji: '🛡️', type: 'warrior', unlocked: false },
      { id: 7, name: 'Dragon Lord Quill', requirement: { notes: 150, words: 4000, time: 1800 }, emoji: '🐲', type: 'dragon_lord', unlocked: false },
    ];

    setCharacters(prev => {
      let hasNewUnlock = false;
      let newlyUnlocked = null;
      
      const updated = characterTypes.map(char => {
        const existing = prev.find(c => c.id === char.id);
        const shouldUnlock = 
          totalNotes >= char.requirement.notes && 
          totalWords >= char.requirement.words &&
          timeSpent >= char.requirement.time;
        
        if (!existing?.unlocked && shouldUnlock) {
          hasNewUnlock = true;
          newlyUnlocked = { ...char, unlocked: true, level: 1, xp: 0, position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 }, caged: false };
          return newlyUnlocked;
        }
        
        if (existing?.unlocked) {
          const charLevel = Math.floor(xp / (char.id * 150)) + 1;
          return { ...existing, level: charLevel, xp };
        }
        
        return existing || char;
      });
      
      if (hasNewUnlock && newlyUnlocked) {
        setTimeout(() => setUnlockedCharacter(newlyUnlocked), 500);
      }
      
      return updated;
    });
  }, []);

  const handleNameSubmit = useCallback((name) => {
    setUserName(name);
    localStorage.setItem('anotequest_username', name);
    setShowNameInput(false);
  }, []);

  const addNote = useCallback((note) => {
    if (!isPremium && notes.length >= 100) {
      return { error: 'Free tier limited to 100 notes!' };
    }

    const newNote = {
      id: Date.now(),
      title: 'New Note',
      content: '',
      ...note,
      position: note?.position || { x: 100 + (notes.length % 5) * 100, y: 100 + Math.floor(notes.length / 5) * 150 },
      createdAt: new Date().toISOString(),
      images: note?.images || [],
      folderId: activeFolder || null
    };
    setNotes(prev => [...prev, newNote]);
    return { success: true, note: newNote };
  }, [isPremium, notes.length, activeFolder]);

  const updateNote = useCallback((id, updates) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, ...updates } : note
    ));
  }, []);

  const deleteNote = useCallback((id) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  }, []);

  const addFolder = useCallback((name) => {
    const newFolder = {
      id: Date.now(),
      name,
      createdAt: new Date().toISOString()
    };
    setFolders(prev => [...prev, newFolder]);
  }, []);

  const addSticker = useCallback((sticker) => {
    const newSticker = {
      id: Date.now() + Math.random(),
      ...sticker,
      folderId: activeFolder,
      createdAt: new Date().toISOString()
    };
    setStickers(prev => [...prev, newSticker]);
  }, [activeFolder]);

  const updateSticker = useCallback((id, updates) => {
    setStickers(prev => prev.map(sticker => 
      sticker.id === id ? { ...sticker, ...updates } : sticker
    ));
  }, []);

  const deleteSticker = useCallback((id) => {
    setStickers(prev => prev.filter(sticker => sticker.id !== id));
  }, []);

  // Image handlers
  const addImage = useCallback((image) => {
    const newImage = {
      id: Date.now() + Math.random(),
      ...image,
      folderId: activeFolder,
      createdAt: new Date().toISOString()
    };
    setImages(prev => [...prev, newImage]);
  }, [activeFolder]);

  const updateImage = useCallback((id, updates) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, ...updates } : img
    ));
  }, []);

  const deleteImage = useCallback((id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  }, []);

  // Table handlers
  const addTable = useCallback((table) => {
    const newTable = {
      id: Date.now() + Math.random(),
      ...table,
      folderId: activeFolder,
      createdAt: new Date().toISOString()
    };
    setTables(prev => [...prev, newTable]);
  }, [activeFolder]);

  const updateTable = useCallback((id, updates) => {
    setTables(prev => prev.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ));
  }, []);

  const deleteTable = useCallback((id) => {
    setTables(prev => prev.filter(t => t.id !== id));
  }, []);

  // Todo handlers
  const addTodo = useCallback((todo) => {
    const newTodo = {
      id: Date.now() + Math.random(),
      ...todo,
      folderId: activeFolder,
      createdAt: new Date().toISOString()
    };
    setTodos(prev => [...prev, newTodo]);
  }, [activeFolder]);

  const updateTodo = useCallback((id, updates) => {
    setTodos(prev => prev.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ));
  }, []);

  const deleteTodo = useCallback((id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  }, []);

  // Connection handlers
  const addConnection = useCallback((connection) => {
    const newConnection = {
      ...connection,
      id: Date.now() + Math.random(),
      folderId: activeFolder
    };
    setConnections(prev => [...prev, newConnection]);
  }, [activeFolder]);

  const deleteConnection = useCallback((index) => {
    setConnections(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateCharacter = useCallback((id, updates) => {
    setCharacters(prev => prev.map(char => 
      char.id === id ? { ...char, ...updates } : char
    ));
  }, []);

  const handleBattleWin = useCallback(() => {
    const newWins = stats.wins + 1;
    setStats(prev => ({
      ...prev,
      battles: prev.battles + 1,
      wins: newWins
    }));
    
    if (newWins === 100) {
      setCharacters(prev => {
        const dragonChar = prev.find(c => c.type === 'dragon' || c.type === 'dragon_lord');
        if (dragonChar && !dragonChar.unlocked) {
          setTimeout(() => setUnlockedCharacter({ ...dragonChar, unlocked: true }), 500);
          return prev.map(c => 
            c.id === dragonChar.id ? { ...c, unlocked: true, level: 1, xp: 0, position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 }, caged: false } : c
          );
        }
        return prev;
      });
    }
  }, [stats.wins]);

  const handleBattleLose = useCallback(() => {
    setStats(prev => ({
      ...prev,
      battles: prev.battles + 1
    }));
  }, []);

  // Filter notes by folder and search
  const filteredNotes = useMemo(() => {
    let result = activeFolder 
      ? notes.filter(note => note.folderId === activeFolder)
      : notes.filter(note => !note.folderId); // Root folder shows only unassigned notes
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(note => 
        note.title?.toLowerCase().includes(query) ||
        note.content?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [notes, activeFolder, searchQuery]);

  // Filter other items by folder (each folder has its own canvas)
  const filteredStickers = useMemo(() => {
    return activeFolder 
      ? stickers.filter(s => s.folderId === activeFolder)
      : stickers.filter(s => !s.folderId);
  }, [stickers, activeFolder]);

  const filteredImages = useMemo(() => {
    return activeFolder 
      ? images.filter(i => i.folderId === activeFolder)
      : images.filter(i => !i.folderId);
  }, [images, activeFolder]);

  const filteredTables = useMemo(() => {
    return activeFolder 
      ? tables.filter(t => t.folderId === activeFolder)
      : tables.filter(t => !t.folderId);
  }, [tables, activeFolder]);

  const filteredTodos = useMemo(() => {
    return activeFolder 
      ? todos.filter(t => t.folderId === activeFolder)
      : todos.filter(t => !t.folderId);
  }, [todos, activeFolder]);

  const filteredConnections = useMemo(() => {
    return activeFolder 
      ? connections.filter(c => c.folderId === activeFolder)
      : connections.filter(c => !c.folderId);
  }, [connections, activeFolder]);

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading AnoteQuest...</div>
      </div>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="h-screen overflow-hidden flex flex-col bg-background">
        <Header 
          stats={stats}
          onBattle={() => setShowBattle(true)}
          isPremium={isPremium}
          isDrawingMode={isDrawingMode}
          userName={userName}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          notes={notes}
          tables={tables}
          todos={todos}
        />
        
        <div className="flex-1 flex overflow-hidden relative">
          {/* Floating Tool Strip */}
          <ToolStrip
            onAddNote={() => addNote()}
            onToggleDrawing={() => setIsDrawingMode(!isDrawingMode)}
            isDrawing={isDrawingMode}
            addSticker={addSticker}
            folders={folders}
            notes={notes}
            activeFolder={activeFolder}
            setActiveFolder={setActiveFolder}
            addFolder={addFolder}
            onToggleCharacters={() => setCharacterPanelOpen(!characterPanelOpen)}
            characterPanelOpen={characterPanelOpen}
            onAddImage={addImage}
            onAddTable={addTable}
            onAddTodo={addTodo}
            isLinkMode={isLinkMode}
            onToggleLinkMode={() => {
              setIsLinkMode(!isLinkMode);
              setConnectingFrom(null);
            }}
          />
          
          {/* Main Canvas */}
          <div className="flex-1 relative overflow-hidden">
            <Canvas
              notes={filteredNotes}
              totalNoteCount={notes.length}
              stickers={filteredStickers}
              images={filteredImages}
              tables={filteredTables}
              todos={filteredTodos}
              connections={filteredConnections}
              characters={characters.filter(c => c.unlocked && !c.caged)}
              addNote={addNote}
              updateNote={updateNote}
              deleteNote={deleteNote}
              addSticker={addSticker}
              updateSticker={updateSticker}
              deleteSticker={deleteSticker}
              addImage={addImage}
              updateImage={updateImage}
              deleteImage={deleteImage}
              updateTable={updateTable}
              deleteTable={deleteTable}
              updateTodo={updateTodo}
              deleteTodo={deleteTodo}
              addConnection={addConnection}
              deleteConnection={deleteConnection}
              updateCharacter={updateCharacter}
              folders={folders}
              isPremium={isPremium}
              isDrawingMode={isDrawingMode}
              onCloseDrawing={() => setIsDrawingMode(false)}
              userName={userName}
              activeFolder={activeFolder}
              isLinkMode={isLinkMode}
              connectingFrom={connectingFrom}
              setConnectingFrom={setConnectingFrom}
            />
          </div>
          
          {/* Slim Character Panel */}
          {characterPanelOpen && (
            <CharacterPanelSlim
              characters={characters}
              updateCharacter={updateCharacter}
              onClose={() => setCharacterPanelOpen(false)}
            />
          )}
        </div>

        {/* Modals */}
        {showNameInput && (
          <NameInputModal onComplete={handleNameSubmit} />
        )}
        {showBattle && (
          <BattleModal 
            onClose={() => setShowBattle(false)}
            onWin={handleBattleWin}
            onLose={handleBattleLose}
            playerStats={stats}
          />
        )}
        {unlockedCharacter && (
          <CharacterUnlockModal 
            character={unlockedCharacter}
            onClose={() => setUnlockedCharacter(null)}
          />
        )}
        <Toaster richColors position="top-right" />
      </div>
    </ThemeProvider>
  );
}

export default App;
