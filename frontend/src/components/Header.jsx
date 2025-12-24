import React from 'react';
import { Moon, Sun, PanelLeftClose, PanelRightClose, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

export const Header = ({ stats, onToggleSidebar, onToggleCharacterPanel, sidebarOpen, characterPanelOpen }) => {
  const { theme, setTheme } = useTheme();
  const nextLevelXP = stats.level * 100;
  const currentLevelXP = stats.xp - ((stats.level - 1) * 100);
  const progressPercent = (currentLevelXP / 100) * 100;

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="hover:bg-primary/10"
          >
            <PanelLeftClose className={`h-5 w-5 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display gradient-text">NoteQuest</h1>
              <p className="text-xs text-muted-foreground">Your Gamified Note Journey</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* XP Progress */}
          <div className="hidden md:flex items-center gap-3 bg-muted/30 rounded-full px-4 py-2 min-w-[200px]">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Level {stats.level}</span>
                <span className="text-xs text-muted-foreground">{currentLevelXP}/{100} XP</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hover:bg-primary/10"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCharacterPanel}
            className="hover:bg-primary/10"
          >
            <PanelRightClose className={`h-5 w-5 transition-transform ${!characterPanelOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;