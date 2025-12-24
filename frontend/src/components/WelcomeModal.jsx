import React from 'react';
import { Sparkles, Target, Users, TrendingUp, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Card } from './ui/card';

export const WelcomeModal = ({ onClose }) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-3xl font-bold font-display gradient-text flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Welcome to NoteQuest!
            </DialogTitle>
          </div>
          <DialogDescription className="text-base mt-4">
            Your note-taking journey just got a whole lot more exciting! Combine the visual freedom of Milanote with the power of Obsidian, and level up as you write.
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
                  <h3 className="font-semibold mb-1">Canvas-Based Notes</h3>
                  <p className="text-sm text-muted-foreground">
                    Drag and drop notes anywhere on the infinite canvas. Organize visually!
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
                  <h3 className="font-semibold mb-1">Unlock Characters</h3>
                  <p className="text-sm text-muted-foreground">
                    Collect unique characters as you reach writing milestones. First unlock at 10 notes!
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Level Up System</h3>
                  <p className="text-sm text-muted-foreground">
                    Gain XP for every note and word you write. Watch your level grow!
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
                  <h3 className="font-semibold mb-1">Smart Organization</h3>
                  <p className="text-sm text-muted-foreground">
                    Create folders, link notes, and customize with colors. Stay organized!
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
                <span>Click the <strong>+</strong> button or anywhere on the canvas to create a note</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                <span>Drag notes by their header to reposition them</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-secondary mt-0.5">•</span>
                <span>Earn <strong>10 XP per note</strong> and <strong>1 XP per 10 words</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success mt-0.5">•</span>
                <span>Your first character unlocks at <strong>10 notes + 100 words</strong></span>
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
            Start Your Quest!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;