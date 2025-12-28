import React from 'react';
import { Lock, Sparkles, TrendingUp, Lock as LockClosed, Unlock, X } from 'lucide-react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';

export const CharacterPanelSlim = ({ characters, updateCharacter, onClose }) => {
  const unlockedCharacters = characters.filter(c => c.unlocked);
  const lockedCharacters = characters.filter(c => !c.unlocked);

  const handleCageToggle = (character) => {
    updateCharacter(character.id, { caged: !character.caged });
    toast.success(character.caged ? `${character.name} released!` : `${character.name} caged`);
  };

  const formatRequirement = (req) => {
    const parts = [];
    if (req.notes > 0) parts.push(`${req.notes} notes`);
    if (req.words > 0) parts.push(`${req.words} words`);
    if (req.time > 0) {
      const mins = Math.floor(req.time / 60);
      parts.push(`${mins}m time`);
    }
    return parts.join(' • ');
  };

  return (
    <div className="w-56 h-full bg-card/95 backdrop-blur-md border-l border-border/50 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Characters</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] h-5">
            {unlockedCharacters.length}/{characters.length}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Characters List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {/* Unlocked Characters */}
          {unlockedCharacters.map(char => (
            <Card 
              key={char.id} 
              className="p-2.5 bg-gradient-to-br from-card to-primary/5 border-primary/30"
            >
              <div className="flex items-center gap-2">
                <div className="text-2xl relative flex-shrink-0">
                  {char.emoji}
                  {char.caged && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
                      <LockClosed className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium truncate">{char.name}</h3>
                    <Badge variant="outline" className="text-[9px] h-4 px-1">
                      Lv{char.level}
                    </Badge>
                  </div>
                  <div className="mt-1">
                    <Progress value={(char.xp % 150) / 150 * 100} className="h-1" />
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-6 text-[10px] mt-2"
                onClick={() => handleCageToggle(char)}
              >
                {char.caged ? (
                  <><Unlock className="h-3 w-3 mr-1" /> Release</>
                ) : (
                  <><LockClosed className="h-3 w-3 mr-1" /> Cage</>
                )}
              </Button>
            </Card>
          ))}

          {/* Locked Characters */}
          {lockedCharacters.map(char => (
            <Card 
              key={char.id} 
              className="p-2.5 bg-muted/30 border-dashed"
            >
              <div className="flex items-center gap-2 opacity-50">
                <div className="text-2xl grayscale flex-shrink-0">{char.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    <span className="text-xs font-medium">???</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {formatRequirement(char.requirement)}
                  </p>
                </div>
              </div>
            </Card>
          ))}

          {characters.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Write notes to unlock!</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CharacterPanelSlim;
