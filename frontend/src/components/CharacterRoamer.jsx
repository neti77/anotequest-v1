import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';
import { Button } from './ui/button';

const CHARACTER_MESSAGES = [
  "Keep writing! 📝",
  "You're doing great! ⭐",
  "Words are power! 💪",
  "Note-taking champion! 🏆",
  "Knowledge is treasure! 💎",
  "Write more, learn more! 📚",
  "Your notes look amazing! ✨",
  "Battle ready! ⚔️",
  "Level up time! 🎮",
  "Epic progress! 🚀",
  "Brilliant ideas! 💡",
  "Organize everything! 📋",
  "Connection matters! 🔗",
  "Keep the streak! 🔥",
  "Master note-taker! 👑",
];

export const CharacterRoamer = ({ character, updateCharacter, canvasRef }) => {
  const [position, setPosition] = useState(character.position || { x: 100, y: 100 });
  const [direction, setDirection] = useState({ x: 1, y: 1 });
  const [message, setMessage] = useState(null);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const interval = setInterval(() => {
      setPosition(prev => {
        const canvasWidth = canvasRef.current.clientWidth;
        const canvasHeight = canvasRef.current.clientHeight;
        
        let newX = prev.x + direction.x * 2;
        let newY = prev.y + direction.y * 2;
        let newDirX = direction.x;
        let newDirY = direction.y;

        // Bounce off edges
        if (newX <= 0 || newX >= canvasWidth - 60) {
          newDirX = -direction.x;
          newX = Math.max(0, Math.min(canvasWidth - 60, newX));
        }
        if (newY <= 0 || newY >= canvasHeight - 60) {
          newDirY = -direction.y;
          newY = Math.max(0, Math.min(canvasHeight - 60, newY));
        }

        if (newDirX !== direction.x || newDirY !== direction.y) {
          setDirection({ x: newDirX, y: newDirY });
        }

        return { x: newX, y: newY };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [direction, canvasRef]);

  useEffect(() => {
    updateCharacter(character.id, { position });
  }, [position]);

  // Random message display
  useEffect(() => {
    const messageInterval = setInterval(() => {
      const randomMessage = CHARACTER_MESSAGES[Math.floor(Math.random() * CHARACTER_MESSAGES.length)];
      setMessage(randomMessage);
      setShowMessage(true);

      setTimeout(() => {
        setShowMessage(false);
      }, 3000);
    }, 15000 + Math.random() * 15000); // Random between 15-30 seconds

    return () => clearInterval(messageInterval);
  }, []);

  const handleCageToggle = () => {
    updateCharacter(character.id, { caged: !character.caged });
  };

  return (
    <motion.div
      className="absolute pointer-events-auto z-20"
      style={{
        left: position.x,
        top: position.y,
      }}
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <div className="relative group">
        {/* Speech Bubble */}
        <AnimatePresence>
          {showMessage && message && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap z-30"
            >
              <div className="bg-card border-2 border-primary rounded-lg px-3 py-2 shadow-lg relative">
                <p className="text-xs font-medium">{message}</p>
                {/* Speech bubble arrow */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary" />
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-card" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-5xl animate-float cursor-pointer" title={character.name}>
          {character.emoji}
        </div>
        
        {/* Level Badge */}
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md">
          {character.level}
        </div>

        {/* Cage Toggle */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCageToggle}
        >
          <Lock className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
};

export default CharacterRoamer;