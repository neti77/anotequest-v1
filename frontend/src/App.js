import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from './components/ui/sonner';
import Header from './components/Header';
import Canvas from './components/Canvas';
import Sidebar from './components/Sidebar';
import CharacterPanel from './components/CharacterPanel';
import StatsPanel from './components/StatsPanel';
import WelcomeModal from './components/WelcomeModal';
import BattleModal from './components/BattleModal';
import CharacterUnlockModal from './components/CharacterUnlockModal';
import { Sparkles } from 'lucide-react';

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
    timeSpent: 0, // in seconds
    battles: 0,
    wins: 0
  });
  const [showWelcome, setShowWelcome] = useState(true);
  const [showBattle, setShowBattle] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [characterPanelOpen, setCharacterPanelOpen] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const timeIntervalRef = useRef(null);

  // Load data from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem('anotequest_notes');
    const savedFolders = localStorage.getItem('anotequest_folders');
    const savedStickers = localStorage.getItem('anotequest_stickers');
    const savedCharacters = localStorage.getItem('anotequest_characters');
    const savedStats = localStorage.getItem('anotequest_stats');
    const savedPremium = localStorage.getItem('anotequest_premium');
    const hasVisited = localStorage.getItem('anotequest_visited');

    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedFolders) setFolders(JSON.parse(savedFolders));
    if (savedStickers) setStickers(JSON.parse(savedStickers));
    if (savedCharacters) setCharacters(JSON.parse(savedCharacters));
    if (savedStats) setStats(JSON.parse(savedStats));
    if (savedPremium) setIsPremium(JSON.parse(savedPremium));
    if (hasVisited) setShowWelcome(false);
  }, []);

  // Track time spent
  useEffect(() => {
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
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('anotequest_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('anotequest_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('anotequest_stickers', JSON.stringify(stickers));
  }, [stickers]);

  useEffect(() => {
    localStorage.setItem('anotequest_characters', JSON.stringify(characters));
  }, [characters]);

  useEffect(() => {
    localStorage.setItem('anotequest_stats', JSON.stringify(stats));
  }, [stats]);

  // Calculate stats and check for unlocks
  useEffect(() => {
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
  }, [notes]);

  const checkCharacterUnlocks = (totalNotes, totalWords, xp, timeSpent) => {
    const characterTypes = [
      { id: 1, name: 'Scribe the Wizard', requirement: { notes: 10, words: 100, time: 0 }, emoji: '🧙', type: 'wizard', unlocked: false },
      { id: 2, name: 'Knight Notarius', requirement: { notes: 25, words: 500, time: 300 }, emoji: '⚔️', type: 'soldier', unlocked: false },
      { id: 3, name: 'Inky the Dragon', requirement: { notes: 50, words: 1000, time: 600 }, emoji: '🐉', type: 'dragon', unlocked: false },
      { id: 4, name: 'Sage the Owl', requirement: { notes: 75, words: 1500, time: 900 }, emoji: '🦉', type: 'sage', unlocked: false },
      { id: 5, name: 'Phoenix Wordsmith', requirement: { notes: 100, words: 2500, time: 1800 }, emoji: '🔥', type: 'phoenix', unlocked: false },
      { id: 6, name: 'Warrior Scribbles', requirement: { notes: 150, words: 3500, time: 2700 }, emoji: '🛡️', type: 'warrior', unlocked: false },
      { id: 7, name: 'Dragon Lord Quill', requirement: { notes: 200, words: 5000, time: 3600 }, emoji: '🐲', type: 'dragon_lord', unlocked: false },
    ];

    setCharacters(prev => {
      const updated = characterTypes.map(char => {
        const existing = prev.find(c => c.id === char.id);
        const shouldUnlock = 
          totalNotes >= char.requirement.notes && 
          totalWords >= char.requirement.words &&
          timeSpent >= char.requirement.time;
        
        if (!existing && shouldUnlock) {
          setUnlockedCharacter({ ...char, unlocked: true, level: 1, xp: 0, position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 }, caged: false });
          return { ...char, unlocked: true, level: 1, xp: 0, position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 }, caged: false };
        }
        
        if (existing && existing.unlocked) {
          const charLevel = Math.floor(xp / (char.id * 150)) + 1;
          return { ...existing, level: charLevel, xp };
        }
        
        return existing || char;
      });
      return updated;
    });
  };

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    localStorage.setItem('anotequest_visited', 'true');
  };

  const addNote = (note) => {
    // Check file limit for free users
    if (!isPremium && notes.length >= 100) {
      return { error: 'Free tier limited to 100 notes. Upgrade to premium or win battles for more!' };
    }

    const newNote = {
      id: Date.now(),
      ...note,
      position: note.position || { x: 100 + (notes.length % 5) * 100, y: 100 + Math.floor(notes.length / 5) * 150 },
      createdAt: new Date().toISOString(),
      images: note.images || []
    };
    setNotes(prev => [...prev, newNote]);
    return { success: true, note: newNote };
  };

  const updateNote = (id, updates) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, ...updates } : note
    ));
  };

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const addFolder = (name, parentId = null) => {
    const newFolder = {
      id: Date.now(),
      name,
      parentId,
      createdAt: new Date().toISOString(),
      expanded: true
    };
    setFolders(prev => [...prev, newFolder]);
  };

  const deleteFolder = (id) => {
    setFolders(prev => prev.filter(folder => folder.id !== id));
    setNotes(prev => prev.map(note => 
      note.folderId === id ? { ...note, folderId: null } : note
    ));
  };

  const addSticker = (sticker) => {
    const newSticker = {
      id: Date.now(),
      ...sticker,
      createdAt: new Date().toISOString()
    };
    setStickers(prev => [...prev, newSticker]);
  };

  const updateSticker = (id, updates) => {
    setStickers(prev => prev.map(sticker => 
      sticker.id === id ? { ...sticker, ...updates } : sticker
    ));
  };

  const deleteSticker = (id) => {
    setStickers(prev => prev.filter(sticker => sticker.id !== id));
  };

  const updateCharacter = (id, updates) => {
    setCharacters(prev => prev.map(char => 
      char.id === id ? { ...char, ...updates } : char
    ));
  };

  const handleBattleWin = (reward) => {
    setStats(prev => ({
      ...prev,
      battles: prev.battles + 1,
      wins: prev.wins + 1
    }));
    
    if (reward.notes) {
      reward.notes.forEach(note => addNote(note));
    }
  };

  const handleBattleLose = () => {
    setStats(prev => ({
      ...prev,
      battles: prev.battles + 1
    }));
  };

  const filteredNotes = activeFolder 
    ? notes.filter(note => note.folderId === activeFolder)
    : notes;

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="h-screen overflow-hidden flex flex-col bg-background">
        <Header 
          stats={stats}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleCharacterPanel={() => setCharacterPanelOpen(!characterPanelOpen)}
          onBattle={() => setShowBattle(true)}
          sidebarOpen={sidebarOpen}
          characterPanelOpen={characterPanelOpen}
          isPremium={isPremium}
        />
        
        <div className="flex-1 flex overflow-hidden relative">
          {sidebarOpen && (
            <Sidebar
              folders={folders}
              notes={notes}
              activeFolder={activeFolder}
              setActiveFolder={setActiveFolder}
              addFolder={addFolder}
              deleteFolder={deleteFolder}
            />
          )}
          
          <div className="flex-1 relative overflow-hidden">
            <Canvas
              notes={filteredNotes}
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
            />
          </div>
          
          {characterPanelOpen && (
            <div className="w-80 border-l border-border bg-card/50 backdrop-blur-sm">
              <div className="h-1/2 border-b border-border overflow-y-auto">
                <CharacterPanel 
                  characters={characters} 
                  updateCharacter={updateCharacter}
                />
              </div>
              <div className="h-1/2 overflow-y-auto">
                <StatsPanel stats={stats} notes={notes} isPremium={isPremium} />
              </div>
            </div>
          )}
        </div>

        {showWelcome && <WelcomeModal onClose={handleWelcomeClose} />}
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