import React from 'react';
import { TrendingUp, FileText, Type, Zap, Calendar, Target, Swords, Clock, Crown } from 'lucide-react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

export const StatsPanel = ({ stats, notes, isPremium }) => {
  const nextLevelXP = stats.level * 100;
  const currentLevelXP = stats.xp - ((stats.level - 1) * 100);
  const progressPercent = (currentLevelXP / 100) * 100;

  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const avgWordsPerNote = stats.totalNotes > 0
    ? Math.round(stats.totalWords / stats.totalNotes)
    : 0;

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const winRate = stats.battles > 0 ? Math.round((stats.wins / stats.battles) * 100) : 0;

  const statCards = [
    {
      icon: TrendingUp,
      label: 'Level',
      value: stats.level,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      icon: Zap,
      label: 'Total XP',
      value: stats.xp,
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    {
      icon: FileText,
      label: 'Notes',
      value: stats.totalNotes,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      icon: Type,
      label: 'Words',
      value: stats.totalWords.toLocaleString(),
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
  ];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold font-display flex items-center gap-2">
          <Target className="h-5 w-5 text-accent" />
          Your Stats
        </h2>
        {isPremium && (
          <Badge className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500">
            <Crown className="h-3 w-3" />
            Pro
          </Badge>
        )}
      </div>

      <ScrollArea className="h-[calc(100%-3rem)]">
        <div className="space-y-4">
          {/* Level Progress */}
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Level Progress</span>
                <span className="text-xs text-muted-foreground">Level {stats.level}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{currentLevelXP} XP</span>
                <span>{100 - currentLevelXP} XP to next level</span>
              </div>
            </div>
          </Card>

          {/* Time & Battles */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <div className="flex flex-col gap-2">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time Spent</p>
                  <p className="text-lg font-bold">{formatTime(stats.timeSpent)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex flex-col gap-2">
                <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Swords className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Battles</p>
                  <p className="text-lg font-bold">{stats.wins}/{stats.battles}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((stat, index) => (
              <Card key={index} className="p-3 hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-2">
                  <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold">{stat.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Additional Stats */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Writing Insights</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg words per note</span>
                <span className="font-medium">{avgWordsPerNote}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Battle win rate</span>
                <span className="font-medium">{winRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">XP per note</span>
                <span className="font-medium text-primary">10 XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">XP per 10 words</span>
                <span className="font-medium text-accent">1 XP</span>
              </div>
            </div>
          </Card>

          {/* File Limit */}
          {!isPremium && (
            <Card className="p-4 bg-warning/10 border-warning/30">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Free Tier Limit
              </h3>
              <div className="space-y-2">
                <Progress value={(stats.totalNotes / 100) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {stats.totalNotes}/100 notes used. Battle to earn more or upgrade to premium!
                </p>
              </div>
            </Card>
          )}

          {/* Next Milestone */}
          <Card className="p-4 bg-gradient-to-br from-accent/10 to-secondary/10 border-accent/20">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Next Milestone
            </h3>
            <p className="text-xs text-muted-foreground">
              {stats.totalNotes < 10
                ? `Write ${10 - stats.totalNotes} more notes to unlock your first character!`
                : stats.totalNotes < 25
                ? `Write ${25 - stats.totalNotes} more notes to unlock Knight Notarius!`
                : stats.totalNotes < 50
                ? `Write ${50 - stats.totalNotes} more notes to unlock Inky the Dragon!`
                : 'Keep writing to level up your characters!'}
            </p>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export default StatsPanel;