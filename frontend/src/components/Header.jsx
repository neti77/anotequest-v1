import React, { useState } from 'react';
import { Moon, Sun, PanelLeftClose, PanelRightClose, BookOpen, Swords, Crown } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';

export const Header = ({ stats, onToggleSidebar, onToggleCharacterPanel, onBattle, sidebarOpen, characterPanelOpen, isPremium }) => {
  const { theme, setTheme } = useTheme();
  const nextLevelXP = stats.level * 100;
  const currentLevelXP = stats.xp - ((stats.level - 1) * 100);
  const progressPercent = (currentLevelXP / 100) * 100;

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="h-full px-2 md:px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="hover:bg-primary/10 h-8 w-8 md:h-10 md:w-10"
          >
            <PanelLeftClose className={`h-4 w-4 md:h-5 md:w-5 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </Button>
          
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold font-display gradient-text">AnoteQuest</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Your Epic Note Journey</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Time Spent */}
          <div className="hidden md:flex lg:flex items-center gap-2 text-xs text-muted-foreground">
            <span>Time:</span>
            <Badge variant="secondary">{formatTime(stats.timeSpent)}</Badge>
          </div>

          {/* XP Progress */}
          <div className="hidden md:flex items-center gap-3 bg-muted/30 rounded-full px-3 py-1.5 md:px-4 md:py-2 min-w-[150px] md:min-w-[200px]">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Level {stats.level}</span>
                <span className="text-xs text-muted-foreground">{currentLevelXP}/{100}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>

          {/* Battle Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onBattle}
            className="gap-1 md:gap-2 hover:bg-destructive/10 hover:text-destructive border-destructive/30 h-8 px-2 md:px-3"
          >
            <Swords className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline text-xs md:text-sm">Battle</span>
          </Button>

          {/* Premium Badge */}
          {isPremium && (
            <Badge className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hidden md:flex">
              <Crown className="h-3 w-3" />
              <span className="hidden lg:inline">Premium</span>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hover:bg-primary/10 h-8 w-8 md:h-10 md:w-10"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 md:h-5 md:w-5" /> : <Moon className="h-4 w-4 md:h-5 md:w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCharacterPanel}
            className="hover:bg-primary/10 h-8 w-8 md:h-10 md:w-10 hidden lg:flex"
          >
            <PanelRightClose className={`h-4 w-4 md:h-5 md:w-5 transition-transform ${!characterPanelOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;