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
  const timeIntervalRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    console.log('Loading data from localStorage...');
    try {
      const savedNotes = localStorage.getItem('anotequest_notes');
      const savedFolders = localStorage.getItem('anotequest_folders');
      const savedStickers = localStorage.getItem('anotequest_stickers');
      const savedCharacters = localStorage.getItem('anotequest_characters');
      const savedStats = localStorage.getItem('anotequest_stats');
      const savedPremium = localStorage.getItem('anotequest_premium');
      const savedUserName = localStorage.getItem('anotequest_username');

      if (savedNotes) {
        const parsed = JSON.parse(savedNotes);
        console.log('Loaded notes:', parsed.length);
        setNotes(parsed);
      }
      if (savedFolders) setFolders(JSON.parse(savedFolders));
      if (savedStickers) {
        const parsed = JSON.parse(savedStickers);
        console.log('Loaded stickers:', parsed.length);
        setStickers(parsed);
      }
      if (savedCharacters) setCharacters(JSON.parse(savedCharacters));
      if (savedStats) setStats(JSON.parse(savedStats));
      if (savedPremium) setIsPremium(JSON.parse(savedPremium));
      if (savedUserName) setUserName(savedUserName);
      
      // Only show name input if no username saved
      if (!savedUserName) {
        setShowNameInput(true);
      }
      
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
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
    const saveTimeout = setTimeout(() => {
      localStorage.setItem('anotequest_notes', JSON.stringify(notes));
    }, 500);
    return () => clearTimeout(saveTimeout);
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
    localStorage.setItem('anotequest_characters', JSON.stringify(characters));
  }, [characters, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('anotequest_stats', JSON.stringify(stats));
  }, [stats, isLoaded]);

  // Calculate stats and check for unlocks
  useEffect(() => {
    if (!isLoaded) return;
    
    const totalNotes = notes.length;
    const totalWords = notes.reduce((sum, note) => {
      const wordCount = note.content.trim().split(/\s+/).filter(w => w.length > 0).length;
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
      return { error: 'Free tier limited to 100 notes. Upgrade to premium!' };
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
      createdAt: new Date().toISOString()
    };
    setStickers(prev => [...prev, newSticker]);
  }, []);

  const updateSticker = useCallback((id, updates) => {
    setStickers(prev => prev.map(sticker => 
      sticker.id === id ? { ...sticker, ...updates } : sticker
    ));
  }, []);

  const deleteSticker = useCallback((id) => {
    setStickers(prev => prev.filter(sticker => sticker.id !== id));
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
    
    // Unlock dragon at 100 wins
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

  const filteredNotes = useMemo(() => {
    return activeFolder 
      ? notes.filter(note => note.folderId === activeFolder)
      : notes;
  }, [notes, activeFolder]);

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
        />
        
        <div className="flex-1 flex overflow-hidden relative">
          {/* Floating Tool Strip (Milanote style) */}
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
          />
          
          {/* Main Canvas */}
          <div className="flex-1 relative overflow-hidden">
            <Canvas
              notes={filteredNotes}
              totalNoteCount={notes.length}
              stickers={stickers}
              characters={characters.filter(c => c.unlocked && !c.caged)}
              addNote={addNote}
              updateNote={updateNote}
              deleteNote={deleteNote}
              addSticker={addSticker}
              updateSticker={updateSticker}
              deleteSticker={deleteSticker}
              updateCharacter={updateCharacter}
              folders={folders}
              isPremium={isPremium}
              isDrawingMode={isDrawingMode}
              onCloseDrawing={() => setIsDrawingMode(false)}
              userName={userName}
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
