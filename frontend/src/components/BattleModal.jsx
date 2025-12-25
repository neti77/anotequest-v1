import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Shield, Heart, Zap, Trophy, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';

const OPPONENT_NAMES = [
  'Shadow Scribe', 'Note Ninja', 'Word Warrior', 'Script Sorcerer', 'Page Paladin',
  'Ink Assassin', 'Quill Knight', 'Tome Tactician', 'Paper Phantom', 'Legend Writer'
];

export const BattleModal = ({ onClose, onWin, onLose, playerStats }) => {
  const [battleState, setBattleState] = useState('ready'); // ready, fighting, won, lost
  const [playerHP, setPlayerHP] = useState(100);
  const [opponentHP, setOpponentHP] = useState(100);
  const [logs, setLogs] = useState([]);

  const opponent = {
    name: OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)],
    level: Math.max(1, playerStats.level + Math.floor(Math.random() * 3) - 1),
    emoji: ['⚔️', '🛡️', '🗡️', '🏹', '⚡'][Math.floor(Math.random() * 5)]
  };

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, id: Date.now() }]);
  };

  const startBattle = () => {
    setBattleState('fighting');
    addLog('Battle started!', 'info');
    
    // Simulate battle
    let pHP = 100;
    let oHP = 100;
    let turn = 0;

    const battleInterval = setInterval(() => {
      turn++;
      
      // Player attack
      const playerDamage = Math.floor(Math.random() * 20) + 10 + (playerStats.level * 2);
      oHP -= playerDamage;
      addLog(`You dealt ${playerDamage} damage!`, 'success');
      setOpponentHP(Math.max(0, oHP));

      if (oHP <= 0) {
        clearInterval(battleInterval);
        setBattleState('won');
        addLog('Victory! You won the battle!', 'success');
        
        // Reward: 1-3 random notes
        const rewardNotes = [];
        const noteCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < noteCount; i++) {
          rewardNotes.push({
            title: `Battle Trophy ${Date.now() + i}`,
            content: `Won from ${opponent.name}!\n\nThis note was earned through victory in battle!`,
            color: 'default'
          });
        }
        onWin({ notes: rewardNotes });
        return;
      }

      // Opponent attack
      setTimeout(() => {
        const opponentDamage = Math.floor(Math.random() * 15) + 8 + (opponent.level * 2);
        pHP -= opponentDamage;
        addLog(`${opponent.name} dealt ${opponentDamage} damage!`, 'danger');
        setPlayerHP(Math.max(0, pHP));

        if (pHP <= 0) {
          clearInterval(battleInterval);
          setBattleState('lost');
          addLog('Defeat... Better luck next time!', 'danger');
          onLose();
        }
      }, 800);

    }, 1600);
  };

  const handleClose = () => {
    if (battleState === 'won') {
      onClose();
    } else if (battleState === 'lost') {
      onClose();
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Swords className="h-6 w-6 text-destructive" />
            Battle Arena
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Battle Status */}
          <div className="grid grid-cols-2 gap-6">
            {/* Player */}
            <Card className="p-4 bg-primary/10 border-primary/30">
              <div className="text-center space-y-2">
                <div className="text-4xl">🛡️</div>
                <div>
                  <p className="font-semibold">You</p>
                  <Badge>Level {playerStats.level}</Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>HP</span>
                    <span>{playerHP}/100</span>
                  </div>
                  <Progress value={playerHP} className="h-3" />
                </div>
              </div>
            </Card>

            {/* Opponent */}
            <Card className="p-4 bg-destructive/10 border-destructive/30">
              <div className="text-center space-y-2">
                <div className="text-4xl">{opponent.emoji}</div>
                <div>
                  <p className="font-semibold">{opponent.name}</p>
                  <Badge variant="destructive">Level {opponent.level}</Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>HP</span>
                    <span>{opponentHP}/100</span>
                  </div>
                  <Progress value={opponentHP} className="h-3" />
                </div>
              </div>
            </Card>
          </div>

          {/* Battle Log */}
          <Card className="p-4 h-48 overflow-y-auto bg-muted/30">
            <h3 className="font-semibold mb-2 text-sm">Battle Log</h3>
            <div className="space-y-1">
              <AnimatePresence>
                {logs.map(log => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`text-xs ${
                      log.type === 'success' ? 'text-success' :
                      log.type === 'danger' ? 'text-destructive' :
                      'text-muted-foreground'
                    }`}
                  >
                    {log.message}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Card>

          {/* Battle Result */}
          {battleState === 'won' && (
            <Card className="p-6 bg-success/10 border-success/30 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-3 text-success" />
              <h3 className="text-xl font-bold mb-2">Victory!</h3>
              <p className="text-sm text-muted-foreground">
                You won 1-3 new notes as rewards!
              </p>
            </Card>
          )}

          {battleState === 'lost' && (
            <Card className="p-6 bg-destructive/10 border-destructive/30 text-center">
              <Shield className="h-12 w-12 mx-auto mb-3 text-destructive" />
              <h3 className="text-xl font-bold mb-2">Defeat</h3>
              <p className="text-sm text-muted-foreground">
                Train harder and try again!
              </p>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-3">
            {battleState === 'ready' && (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Retreat
                </Button>
                <Button onClick={startBattle} className="gap-2">
                  <Zap className="h-4 w-4" />
                  Start Battle!
                </Button>
              </>
            )}
            {(battleState === 'won' || battleState === 'lost') && (
              <Button onClick={handleClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BattleModal;