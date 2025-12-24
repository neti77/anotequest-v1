import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from './components/ui/sonner';
import Header from './components/Header';
import Canvas from './components/Canvas';
import Sidebar from './components/Sidebar';
import CharacterPanel from './components/CharacterPanel';
import StatsPanel from './components/StatsPanel';
import WelcomeModal from './components/WelcomeModal';
import { Brain } from 'lucide-react';

function App() {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalWords: 0,
    xp: 0,
    level: 1,
    streak: 0
  });
  const [showWelcome, setShowWelcome] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [characterPanelOpen, setCharacterPanelOpen] = useState(true);

  // Load data from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem('notes');
    const savedFolders = localStorage.getItem('folders');
    const savedCharacters = localStorage.getItem('characters');
    const savedStats = localStorage.getItem('stats');
    const hasVisited = localStorage.getItem('hasVisited');

    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedFolders) setFolders(JSON.parse(savedFolders));
    if (savedCharacters) setCharacters(JSON.parse(savedCharacters));
    if (savedStats) setStats(JSON.parse(savedStats));
    if (hasVisited) setShowWelcome(false);
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('characters', JSON.stringify(characters));
  }, [characters]);

  useEffect(() => {
    localStorage.setItem('stats', JSON.stringify(stats));
  }, [stats]);

  // Calculate stats and check for character unlocks
  useEffect(() => {
    const totalNotes = notes.length;
    const totalWords = notes.reduce((sum, note) => {
      const wordCount = note.content.trim().split(/\s+/).filter(w => w.length > 0).length;
      return sum + wordCount;
    }, 0);

    // XP calculation: 10 XP per note + 1 XP per 10 words
    const xp = (totalNotes * 10) + Math.floor(totalWords / 10);
    const level = Math.floor(xp / 100) + 1;

    setStats(prev => ({
      ...prev,
      totalNotes,
      totalWords,
      xp,
      level
    }));

    // Check for character unlocks
    checkCharacterUnlocks(totalNotes, totalWords, xp);
  }, [notes]);

  const checkCharacterUnlocks = (totalNotes, totalWords, xp) => {
    const characterTypes = [
      { id: 1, name: 'Notey the Owl', requirement: { notes: 10, words: 100 }, emoji: '🦉', unlocked: false },
      { id: 2, name: 'Scribbles the Fox', requirement: { notes: 25, words: 500 }, emoji: '🦊', unlocked: false },
      { id: 3, name: 'Inky the Octopus', requirement: { notes: 50, words: 1000 }, emoji: '🐙', unlocked: false },
      { id: 4, name: 'Sage the Dragon', requirement: { notes: 100, words: 2500 }, emoji: '🐉', unlocked: false },
      { id: 5, name: 'Wisdom the Phoenix', requirement: { notes: 200, words: 5000 }, emoji: '🔥', unlocked: false },
    ];

    setCharacters(prev => {
      const updated = characterTypes.map(char => {
        const existing = prev.find(c => c.id === char.id);
        const shouldUnlock = totalNotes >= char.requirement.notes && totalWords >= char.requirement.words;
        
        if (!existing && shouldUnlock) {
          return { ...char, unlocked: true, level: 1, xp: 0 };
        }
        
        if (existing && existing.unlocked) {
          // Level up character based on XP
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
    localStorage.setItem('hasVisited', 'true');
  };

  const addNote = (note) => {
    const newNote = {
      id: Date.now(),
      ...note,
      position: note.position || { x: 100, y: 100 },
      createdAt: new Date().toISOString()
    };
    setNotes(prev => [...prev, newNote]);
  };

  const updateNote = (id, updates) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, ...updates } : note
    ));
  };

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const addFolder = (name) => {
    const newFolder = {
      id: Date.now(),
      name,
      createdAt: new Date().toISOString()
    };
    setFolders(prev => [...prev, newFolder]);
  };

  const deleteFolder = (id) => {
    setFolders(prev => prev.filter(folder => folder.id !== id));
    // Remove folder reference from notes
    setNotes(prev => prev.map(note => 
      note.folderId === id ? { ...note, folderId: null } : note
    ));
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
          sidebarOpen={sidebarOpen}
          characterPanelOpen={characterPanelOpen}
        />
        
        <div className="flex-1 flex overflow-hidden relative">
          {sidebarOpen && (
            <Sidebar
              folders={folders}
              activeFolder={activeFolder}
              setActiveFolder={setActiveFolder}
              addFolder={addFolder}
              deleteFolder={deleteFolder}
              noteCount={notes.length}
            />
          )}
          
          <div className="flex-1 relative overflow-hidden">
            <Canvas
              notes={filteredNotes}
              addNote={addNote}
              updateNote={updateNote}
              deleteNote={deleteNote}
              folders={folders}
            />
          </div>
          
          {characterPanelOpen && (
            <div className="w-80 border-l border-border bg-card/50 backdrop-blur-sm">
              <div className="h-1/2 border-b border-border overflow-y-auto">
                <CharacterPanel characters={characters} />
              </div>
              <div className="h-1/2 overflow-y-auto">
                <StatsPanel stats={stats} notes={notes} />
              </div>
            </div>
          )}
        </div>

        {showWelcome && <WelcomeModal onClose={handleWelcomeClose} />}
        <Toaster richColors position="top-right" />
      </div>
    </ThemeProvider>
  );
}

export default App;