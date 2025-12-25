import React from 'react';
import { Sparkles, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Target, Users, TrendingUp, Swords, Image, Sticker } from 'lucide-react';

export const WelcomeModal = ({ onClose }) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-3xl font-bold font-display gradient-text flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Welcome to AnoteQuest!
            </DialogTitle>
          </div>
          <DialogDescription className="text-base mt-4">
            Your epic note-taking adventure begins! Combine visual freedom with gamification, unlock animated characters, and battle for rewards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Canvas Notes</h3>
                  <p className="text-sm text-muted-foreground">
                    Drag notes, add images, and use stickers to connect ideas visually!
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Animated Characters</h3>
                  <p className="text-sm text-muted-foreground">
                    Unlock wizards, dragons, and warriors that roam your canvas!
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <Swords className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Battle System</h3>
                  <p className="text-sm text-muted-foreground">
                    Fight opponents to win new notes and expand your collection!
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Level Up</h3>
                  <p className="text-sm text-muted-foreground">
                    Gain XP for notes, words, and time spent. Unlock characters!
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Tips */}
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Quick Tips
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span><strong>Create Notes:</strong> Click + button or use the toolbar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                <span><strong>Add Stickers:</strong> Use arrows, shapes, and icons to connect notes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-secondary mt-0.5">•</span>
                <span><strong>Earn XP:</strong> 10 XP per note + 1 XP per 10 words</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success mt-0.5">•</span>
                <span><strong>First Character:</strong> Unlocks at 10 notes + 100 words</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warning mt-0.5">•</span>
                <span><strong>Free Limit:</strong> 100 notes max (battle to earn more!)</span>
              </li>
            </ul>
          </Card>
        </div>

        <div className="flex justify-center pt-2">
          <Button
            size="lg"
            onClick={onClose}
            className="bg-gradient-to-r from-primary to-accent hover:shadow-glow transition-shadow"
          >
            Begin Your Quest!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;