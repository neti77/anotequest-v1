import React, { useState } from 'react';
import { Moon, Sun, BookOpen, Swords, Crown, Pencil, Search, Undo2, Redo2, X, Download, FileText, Folder, ChevronDown, FolderPlus, Home, Check, Trash2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Link } from "react-router-dom";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const Header = ({ 
  stats, 
  onBattle, 
  isPremium, 
  isDrawingMode, 
  userName,
  searchQuery,
  setSearchQuery,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  notes = [],
  tables = [],
  todos = [],
  showBattle = false,
  // Folder props
  folders = [],
  activeFolder,
  setActiveFolder,
  addFolder,
  deleteFolder,
  showFolderView,
  setShowFolderView,
}) => {
  const { theme, setTheme } = useTheme();
  const [showSearch, setShowSearch] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);

  const currentFolder = folders.find(f => f.id === activeFolder);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
      setIsAddingFolder(false);
      toast.success('Folder created!');
    }
  };

  const getFolderNoteCount = (folderId) => {
    return notes.filter(note => note.folderId === folderId).length;
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    toast.loading('Creating canvas PDF...');

    try {
      const board = document.querySelector('[data-anotequest-canvas-board]');
      if (!board) {
        toast.dismiss();
        toast.error('Could not find canvas to export');
        setIsExporting(false);
        return;
      }

      const canvas = await html2canvas(board, {
        useCORS: true,
        backgroundColor: getComputedStyle(document.body).backgroundColor || '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'px', [canvas.width, canvas.height]);
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`AnoteQuest_Canvas_${userName}_${new Date().toISOString().split('T')[0]}.pdf`);

      toast.dismiss();
      toast.success('PDF exported!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.dismiss();
      toast.error('Failed to create PDF');
    }

    setIsExporting(false);
  };

  const exportToText = () => {
    try {
      let text = `AnoteQuest Notes\n`;
      text += `==================\n`;
      text += `User: ${userName}\n`;
      text += `Exported: ${new Date().toLocaleString()}\n\n`;

      if (notes.length > 0) {
        notes.forEach((note, index) => {
          text += `[${index + 1}] ${note.title || 'Untitled Note'}\n`;
          text += `${'-'.repeat(30)}\n`;
          text += `${note.content || '(No content)'}\n\n`;
        });
      } else {
        text += 'No notes yet.\n';
      }
      // Download as txt file
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AnoteQuest_Export_${userName}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Text file exported!');
    } catch (error) {
      console.error('Text export error:', error);
      toast.error('Failed to export text');
    }
  };

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md fixed top-0 left-0 right-0 z-50">
      <div className="h-full px-4 flex items-center justify-between">
        
     {/* Logo & Title */}
<Link
  to="/"
  aria-label="Go to AnoteQuest home"
  className="flex items-center gap-2 cursor-pointer"
>
  <img
    src="/logo.png"
    alt="AnoteQuest Logo"
    className="w-12 h-12"
  />
  <div className="hidden sm:block">
    <h1 className="text-lg font-bold font-display text-amber-500
">
      AnoteQuest
    </h1>
  </div>
</Link>


        

        {/* Center - Search, Undo/Redo, XP */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Search */}
          <div className="relative">
            {showSearch ? (
              <div className="flex items-center gap-1 bg-muted/50 rounded-md px-3 py-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes..."
                  className="h-7 w-32 md:w-48 border-0 bg-transparent focus-visible:ring-0 text-sm"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowSearch(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5 bg-muted/30 rounded-md p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Drawing Mode Indicator */}
          {isDrawingMode && (
            <Badge variant="secondary" className="gap-1 animate-pulse hidden sm:flex">
              <Pencil className="h-3 w-3" />
              Drawing
            </Badge>
          )}

          {/* Folder Navigation */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 h-8 px-3 min-w-[120px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium truncate max-w-[100px]">
                    {currentFolder ? currentFolder.name : 'All Notes'}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              <DropdownMenuItem 
                onClick={() => setActiveFolder(null)}
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                <span className="flex-1">All Notes</span>
                <Badge variant="secondary" className="text-xs">{notes.length}</Badge>
                {activeFolder === null && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {folders.map(folder => (
                <DropdownMenuItem 
                  key={folder.id}
                  onClick={() => setActiveFolder(folder.id)}
                  className="gap-2 group"
                >
                  <Folder className="h-4 w-4 text-accent" />
                  <span className="flex-1 truncate">{folder.name}</span>
                  <Badge variant="outline" className="text-xs">{getFolderNoteCount(folder.id)}</Badge>
                  {activeFolder === folder.id && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              ))}
              
              {folders.length > 0 && <DropdownMenuSeparator />}
              
              {/* Add new folder */}
              {isAddingFolder ? (
                <div className="px-2 py-1.5">
                  <div className="flex gap-1">
                    <Input
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Folder name"
                      className="h-7 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddFolder();
                        if (e.key === 'Escape') {
                          setIsAddingFolder(false);
                          setNewFolderName('');
                        }
                      }}
                    />
                    <Button size="sm" className="h-7 px-2" onClick={handleAddFolder}>
                      Add
                    </Button>
                  </div>
                </div>
              ) : (
                <DropdownMenuItem onClick={() => setIsAddingFolder(true)} className="gap-2">
                  <FolderPlus className="h-4 w-4" />
                  <span>New Folder</span>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => setShowFolderView(true)} className="gap-2">
                <Folder className="h-4 w-4" />
                <span>View All Folders</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Time - Hidden on small screens */}
          <Badge variant="outline" className="text-xs hidden md:flex">
            {formatTime(stats.timeSpent)}
          </Badge>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Greeting */}
          <span className="hidden lg:block text-sm text-muted-foreground mr-2">
            Hi, <span className="font-medium text-foreground">{userName}</span>
          </span>

          {/* Battle Button (temporarily hidden) */}
          {showBattle && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBattle}
              className="gap-1.5 hover:bg-destructive/10 hover:text-destructive border-destructive/30 h-8"
            >
              <Swords className="h-4 w-4" />
              <span className="hidden sm:inline">Battle</span>
            </Button>
          )}

          {/* Export Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isExporting}
                className="gap-1.5 h-8"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToText}>
                <FileText className="h-4 w-4 mr-2" />
                Export as Text
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Premium Badge */}
          {isPremium && (
            <Badge className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hidden md:flex">
              <Crown className="h-3 w-3" />
              Pro
            </Badge>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-8 w-8"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
