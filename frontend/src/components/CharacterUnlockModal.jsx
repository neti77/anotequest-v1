import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Star, Trophy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export const CharacterUnlockModal = ({ character, onClose }) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="text-center space-y-6 py-6">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="relative"
          >
            <div className="text-8xl mb-4">{character.emoji}</div>
            <motion.div
              className="absolute inset-0 -z-10"
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{
                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity }
              }}
            >
              <Sparkles className="h-24 w-24 text-primary/30 mx-auto" />
            </motion.div>
          </motion.div>

          <div className="space-y-2">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold gradient-text"
            >
              Character Unlocked!
            </motion.h2>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-xl font-semibold">{character.name}</h3>
              <Badge className="mt-2">
                <Star className="h-3 w-3 mr-1" />
                Level 1
              </Badge>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground"
          >
            <Trophy className="h-5 w-5 mx-auto mb-2 text-primary" />
            <p>
              {character.name} will now roam your canvas! You can cage them anytime by clicking the lock icon.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <Button onClick={onClose} size="lg" className="w-full">
              Awesome!
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CharacterUnlockModal;