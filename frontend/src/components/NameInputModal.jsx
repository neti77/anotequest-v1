import React, { useState } from 'react';
import { User, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

export const NameInputModal = ({ onComplete }) => {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    const finalName = name.trim() || 'Adventurer';
    localStorage.setItem('anotequest_username', finalName);
    onComplete(finalName);
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold font-display gradient-text flex items-center gap-2 justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
            Welcome to AnoteQuest!
          </DialogTitle>
          <DialogDescription className="text-base mt-4 text-center">
            Begin your epic note-taking journey! Your companions will greet you by name as you progress.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <label className="text-sm font-semibold mb-2 block">What should we call you?</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="h-10"
                  maxLength={20}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  autoFocus
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Your characters will use this name to encourage you during your quest!
            </p>
          </Card>

          <div className="text-center space-y-2">
            <Button
              size="lg"
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-glow transition-shadow"
            >
              Begin Your Quest!
            </Button>
            <p className="text-xs text-muted-foreground">
              {name.trim() ? `Welcome, ${name}!` : "We'll call you 'Adventurer' if you skip this"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NameInputModal;
