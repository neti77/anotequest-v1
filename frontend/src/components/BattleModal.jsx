import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Brain, Trophy, X, Clock, CheckCircle, XCircle, Zap } from 'lucide-react';
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

// IQ Quiz Questions Database
const QUIZ_QUESTIONS = {
  pattern: [
    {
      question: "What comes next? 2, 4, 8, 16, ?",
      options: ["24", "32", "30", "20"],
      correct: 1,
      explanation: "Each number doubles (×2)"
    },
    {
      question: "What comes next? 1, 1, 2, 3, 5, 8, ?",
      options: ["11", "13", "12", "10"],
      correct: 1,
      explanation: "Fibonacci sequence (sum of previous two)"
    },
    {
      question: "What comes next? 3, 6, 9, 12, ?",
      options: ["14", "16", "15", "18"],
      correct: 2,
      explanation: "Add 3 each time"
    },
    {
      question: "What comes next? 1, 4, 9, 16, 25, ?",
      options: ["30", "36", "34", "32"],
      correct: 1,
      explanation: "Square numbers (1², 2², 3², 4², 5², 6²)"
    },
    {
      question: "What comes next? 2, 6, 12, 20, 30, ?",
      options: ["40", "42", "44", "38"],
      correct: 1,
      explanation: "Differences increase by 2 (4, 6, 8, 10, 12)"
    }
  ],
  shapes: [
    {
      question: "Which shape completes the pattern?\n◯ △ ◯ △ ◯ ?",
      options: ["◯", "△", "□", "◇"],
      correct: 1,
      explanation: "Alternating circle and triangle"
    },
    {
      question: "Which shape comes next?\n□ □ △ □ □ △ □ □ ?",
      options: ["□", "△", "◯", "◇"],
      correct: 1,
      explanation: "Two squares then one triangle repeats"
    },
    {
      question: "Complete the sequence:\n★ ☆ ★ ★ ☆ ★ ★ ★ ?",
      options: ["★", "☆", "◯", "△"],
      correct: 1,
      explanation: "Filled stars increase, then empty star"
    },
    {
      question: "What comes next?\n◯ ◯ △ △ △ □ □ □ □ ?",
      options: ["□", "◯", "△", "◇"],
      correct: 0,
      explanation: "Count increases: 2, 3, 4, 5 (5 squares)"
    }
  ],
  vocabulary: [
    {
      question: "What does 'Ephemeral' mean?",
      options: ["Lasting forever", "Short-lived", "Very large", "Mysterious"],
      correct: 1,
      explanation: "Ephemeral means lasting for a very short time"
    },
    {
      question: "What does 'Ubiquitous' mean?",
      options: ["Rare", "Present everywhere", "Ancient", "Dangerous"],
      correct: 1,
      explanation: "Ubiquitous means present, appearing, or found everywhere"
    },
    {
      question: "What does 'Pragmatic' mean?",
      options: ["Idealistic", "Practical", "Artistic", "Chaotic"],
      correct: 1,
      explanation: "Pragmatic means dealing with things sensibly and realistically"
    },
    {
      question: "What is the opposite of 'Benevolent'?",
      options: ["Kind", "Malevolent", "Generous", "Humble"],
      correct: 1,
      explanation: "Malevolent (wishing harm) is opposite of Benevolent (wishing good)"
    },
    {
      question: "What does 'Ambiguous' mean?",
      options: ["Clear", "Uncertain/unclear", "Ambitious", "Angry"],
      correct: 1,
      explanation: "Ambiguous means open to more than one interpretation"
    }
  ],
  logic: [
    {
      question: "If all Bloops are Razzies, and all Razzies are Lazzies, then all Bloops are definitely:",
      options: ["Razzies only", "Lazzies", "Neither", "Cannot determine"],
      correct: 1,
      explanation: "By transitive property: Bloops → Razzies → Lazzies"
    },
    {
      question: "A is taller than B. C is shorter than B. Who is shortest?",
      options: ["A", "B", "C", "Cannot determine"],
      correct: 2,
      explanation: "A > B > C, so C is shortest"
    },
    {
      question: "If it rains, the ground gets wet. The ground is wet. Did it rain?",
      options: ["Yes", "No", "Maybe", "Definitely yes"],
      correct: 2,
      explanation: "The ground could be wet from other causes (sprinkler, etc.)"
    },
    {
      question: "Tom is older than Jerry. Jerry is older than Spike. Tom is older than Spike.",
      options: ["Always true", "Always false", "Sometimes true", "Cannot determine"],
      correct: 0,
      explanation: "If Tom > Jerry > Spike, then Tom > Spike is always true"
    }
  ],
  math: [
    {
      question: "If 5 machines take 5 minutes to make 5 widgets, how long would 100 machines take to make 100 widgets?",
      options: ["100 minutes", "5 minutes", "20 minutes", "1 minute"],
      correct: 1,
      explanation: "Each machine makes 1 widget in 5 minutes, regardless of count"
    },
    {
      question: "A bat and ball cost $1.10 together. The bat costs $1 more than the ball. How much is the ball?",
      options: ["$0.10", "$0.05", "$0.15", "$0.01"],
      correct: 1,
      explanation: "Ball = $0.05, Bat = $1.05, Total = $1.10"
    },
    {
      question: "What is 15% of 200?",
      options: ["15", "30", "25", "35"],
      correct: 1,
      explanation: "15% × 200 = 0.15 × 200 = 30"
    },
    {
      question: "If you have 3 apples and take away 2, how many do you have?",
      options: ["1", "2", "3", "0"],
      correct: 1,
      explanation: "You took 2, so you have 2"
    }
  ]
};

const BOT_NAMES = [
  'Professor Puzzler', 'Quiz Master Q', 'Brain Bot 3000', 'IQ Champion', 
  'Logic Lord', 'Riddle Rex', 'Clever Claude', 'Smart Steve'
];

const CATEGORIES = ['pattern', 'shapes', 'vocabulary', 'logic', 'math'];

export const BattleModal = ({ onClose, onWin, onLose, playerStats }) => {
  const [gameState, setGameState] = useState('ready'); // ready, playing, won, lost
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [usedQuestions, setUsedQuestions] = useState([]);
  
  const totalQuestions = 5;
  const botName = useState(() => BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)])[0];
  const botEmoji = useState(() => ['🤖', '🧠', '🎓', '👨‍🔬', '🦊'][Math.floor(Math.random() * 5)])[0];

  const getRandomQuestion = useCallback(() => {
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const questions = QUIZ_QUESTIONS[category];
    const availableQuestions = questions.filter((_, idx) => 
      !usedQuestions.includes(`${category}-${idx}`)
    );
    
    if (availableQuestions.length === 0) {
      // Reset if all questions used
      setUsedQuestions([]);
      return questions[Math.floor(Math.random() * questions.length)];
    }
    
    const randomIdx = Math.floor(Math.random() * availableQuestions.length);
    const originalIdx = questions.indexOf(availableQuestions[randomIdx]);
    setUsedQuestions(prev => [...prev, `${category}-${originalIdx}`]);
    
    return { ...availableQuestions[randomIdx], category };
  }, [usedQuestions]);

  const startGame = () => {
    setGameState('playing');
    setQuestionNumber(1);
    setPlayerScore(0);
    setBotScore(0);
    setCurrentQuestion(getRandomQuestion());
    setTimeLeft(15);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  // Timer
  useEffect(() => {
    if (gameState !== 'playing' || showResult) return;
    
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }

    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameState, showResult]);

  const handleTimeout = () => {
    setShowResult(true);
    // Bot gets the point on timeout
    setBotScore(s => s + 1);
    
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  const handleAnswer = (answerIndex) => {
    if (selectedAnswer !== null || showResult) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    const isCorrect = answerIndex === currentQuestion.correct;
    
    if (isCorrect) {
      setPlayerScore(s => s + 1);
    } else {
      // Bot has ~60% chance to get it right when player is wrong
      if (Math.random() < 0.6) {
        setBotScore(s => s + 1);
      }
    }

    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  const nextQuestion = () => {
    if (questionNumber >= totalQuestions) {
      // Game over
      if (playerScore + (selectedAnswer === currentQuestion?.correct ? 1 : 0) > botScore) {
        setGameState('won');
        onWin();
      } else if (playerScore + (selectedAnswer === currentQuestion?.correct ? 1 : 0) < botScore + (selectedAnswer !== currentQuestion?.correct && Math.random() < 0.6 ? 1 : 0)) {
        setGameState('lost');
        onLose();
      } else {
        // Tie - give to player
        setGameState('won');
        onWin();
      }
    } else {
      setQuestionNumber(n => n + 1);
      setCurrentQuestion(getRandomQuestion());
      setTimeLeft(15);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const getCategoryEmoji = (category) => {
    switch(category) {
      case 'pattern': return '🔢';
      case 'shapes': return '🔷';
      case 'vocabulary': return '📚';
      case 'logic': return '🧩';
      case 'math': return '➕';
      default: return '❓';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            IQ Battle Arena
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Score Display */}
          {gameState !== 'ready' && (
            <div className="grid grid-cols-3 gap-4 items-center">
              <Card className="p-3 bg-primary/10 border-primary/30 text-center">
                <div className="text-2xl mb-1">🧠</div>
                <p className="text-sm font-medium">You</p>
                <p className="text-2xl font-bold text-primary">{playerScore}</p>
              </Card>
              
              <div className="text-center">
                <Badge variant="outline" className="text-lg px-4 py-1">
                  {questionNumber}/{totalQuestions}
                </Badge>
              </div>
              
              <Card className="p-3 bg-destructive/10 border-destructive/30 text-center">
                <div className="text-2xl mb-1">{botEmoji}</div>
                <p className="text-sm font-medium">{botName}</p>
                <p className="text-2xl font-bold text-destructive">{botScore}</p>
              </Card>
            </div>
          )}

          {/* Ready State */}
          {gameState === 'ready' && (
            <Card className="p-6 text-center space-y-4">
              <div className="text-6xl mb-4">🧠 VS {botEmoji}</div>
              <h3 className="text-xl font-bold">Challenge {botName}!</h3>
              <p className="text-muted-foreground">
                Answer 5 IQ questions faster than the bot!<br/>
                Categories: Patterns, Shapes, Vocabulary, Logic, Math
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button variant="outline" onClick={onClose}>
                  Maybe Later
                </Button>
                <Button onClick={startGame} className="gap-2">
                  <Zap className="h-4 w-4" />
                  Start Battle!
                </Button>
              </div>
            </Card>
          )}

          {/* Question State */}
          {gameState === 'playing' && currentQuestion && (
            <>
              {/* Timer */}
              <div className="flex items-center gap-2">
                <Clock className={`h-4 w-4 ${timeLeft <= 5 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`} />
                <Progress value={(timeLeft / 15) * 100} className="h-2 flex-1" />
                <span className={`text-sm font-mono ${timeLeft <= 5 ? 'text-destructive font-bold' : ''}`}>
                  {timeLeft}s
                </span>
              </div>

              {/* Question */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{getCategoryEmoji(currentQuestion.category)}</span>
                  <Badge variant="secondary" className="capitalize">
                    {currentQuestion.category}
                  </Badge>
                </div>
                <p className="text-lg font-medium whitespace-pre-line mb-4">
                  {currentQuestion.question}
                </p>
                
                {/* Options */}
                <div className="grid grid-cols-2 gap-2">
                  {currentQuestion.options.map((option, idx) => {
                    let buttonClass = "h-auto py-3 justify-start text-left";
                    
                    if (showResult) {
                      if (idx === currentQuestion.correct) {
                        buttonClass += " bg-success/20 border-success text-success-foreground";
                      } else if (idx === selectedAnswer && idx !== currentQuestion.correct) {
                        buttonClass += " bg-destructive/20 border-destructive text-destructive";
                      }
                    }
                    
                    return (
                      <Button
                        key={idx}
                        variant="outline"
                        className={buttonClass}
                        onClick={() => handleAnswer(idx)}
                        disabled={showResult}
                      >
                        <span className="mr-2 font-bold">{String.fromCharCode(65 + idx)}.</span>
                        {option}
                        {showResult && idx === currentQuestion.correct && (
                          <CheckCircle className="ml-auto h-4 w-4 text-success" />
                        )}
                        {showResult && idx === selectedAnswer && idx !== currentQuestion.correct && (
                          <XCircle className="ml-auto h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-muted/50 rounded-lg"
                  >
                    <p className="text-sm text-muted-foreground">
                      <strong>Explanation:</strong> {currentQuestion.explanation}
                    </p>
                  </motion.div>
                )}
              </Card>
            </>
          )}

          {/* Win State */}
          {gameState === 'won' && (
            <Card className="p-6 bg-success/10 border-success/30 text-center">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-success" />
              <h3 className="text-2xl font-bold mb-2">Victory!</h3>
              <p className="text-lg mb-2">
                You: <strong>{playerScore}</strong> - {botName}: <strong>{botScore}</strong>
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Your brain is mightier than the bot! +10 XP earned.
              </p>
              <Button onClick={onClose}>
                Claim Victory
              </Button>
            </Card>
          )}

          {/* Lose State */}
          {gameState === 'lost' && (
            <Card className="p-6 bg-destructive/10 border-destructive/30 text-center">
              <div className="text-6xl mb-4">😔</div>
              <h3 className="text-2xl font-bold mb-2">Defeat</h3>
              <p className="text-lg mb-2">
                You: <strong>{playerScore}</strong> - {botName}: <strong>{botScore}</strong>
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                The bot wins this round! Keep practicing!
              </p>
              <Button onClick={onClose}>
                Try Again Later
              </Button>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BattleModal;
