import React from 'react';
import { Lock, Sparkles, TrendingUp } from 'lucide-react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

export const CharacterPanel = ({ characters }) => {
  const unlockedCharacters = characters.filter(c => c.unlocked);
  const lockedCharacters = characters.filter(c => !c.unlocked);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold font-display flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Characters
        </h2>
        <Badge variant="secondary" className="text-xs">
          {unlockedCharacters.length}/{characters.length}
        </Badge>
      </div>

      <ScrollArea className="h-[calc(100%-3rem)]">
        <div className="space-y-3">
          {/* Unlocked Characters */}
          {unlockedCharacters.map(char => (
            <Card key={char.id} className="p-4 bg-gradient-to-br from-card to-primary/5 border-primary/30 character-glow animate-slideInUp">
              <div className="flex items-start gap-3">
                <div className="text-4xl animate-float">{char.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm truncate">{char.name}</h3>
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Lv {char.level}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{char.xp} XP</span>
                      </div>
                      <Progress value={(char.xp % 150) / 150 * 100} className="h-1.5" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Keep writing to level up {char.name}!
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Locked Characters */}
          {lockedCharacters.map(char => (
            <Card key={char.id} className="p-4 bg-muted/30 border-dashed relative overflow-hidden">
              <div className="flex items-start gap-3 opacity-60">
                <div className="text-4xl grayscale">{char.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-3 w-3" />
                    <h3 className="font-semibold text-sm">???</h3>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1">
                      <span className="font-medium">Unlock at:</span>
                    </p>
                    <p>• {char.requirement.notes} notes</p>
                    <p>• {char.requirement.words} words</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {characters.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Start writing notes to unlock characters!</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CharacterPanel;