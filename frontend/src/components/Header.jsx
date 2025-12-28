import React, { useState } from 'react';
import { Moon, Sun, BookOpen, Swords, Crown, Pencil, Search, Undo2, Redo2, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

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
  canRedo
}) => {
  const { theme, setTheme } = useTheme();
  const [showSearch, setShowSearch] = useState(false);
  const currentLevelXP = stats.xp - ((stats.level - 1) * 100);
  const progressPercent = (currentLevelXP / 100) * 100;

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold font-display gradient-text">AnoteQuest</h1>
          </div>
        </div>

        {/* Center - Search, Undo/Redo, XP */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Search */}
          <div className="relative">
            {showSearch ? (
              <div className="flex items-center gap-1 bg-muted/50 rounded-full px-3 py-1">
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
          <div className="flex items-center gap-0.5 bg-muted/30 rounded-full p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
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

          {/* XP Bar - Hidden on small screens */}
          <div className="hidden lg:flex items-center gap-3 bg-muted/30 rounded-full px-4 py-1.5 min-w-[160px]">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Lv {stats.level}</span>
                <span className="text-xs text-muted-foreground">{currentLevelXP}/100</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>
          </div>

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

          {/* Battle Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onBattle}
            className="gap-1.5 hover:bg-destructive/10 hover:text-destructive border-destructive/30 h-8"
          >
            <Swords className="h-4 w-4" />
            <span className="hidden sm:inline">Battle</span>
          </Button>

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
