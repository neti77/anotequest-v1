import React from 'react';
import { TrendingUp, FileText, Type, Zap, Calendar, Target } from 'lucide-react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';

export const StatsPanel = ({ stats, notes }) => {
  const nextLevelXP = stats.level * 100;
  const currentLevelXP = stats.xp - ((stats.level - 1) * 100);
  const progressPercent = (currentLevelXP / 100) * 100;

  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const avgWordsPerNote = stats.totalNotes > 0
    ? Math.round(stats.totalWords / stats.totalNotes)
    : 0;

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
                <span className="text-muted-foreground">XP per note</span>
                <span className="font-medium text-primary">10 XP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">XP per 10 words</span>
                <span className="font-medium text-accent">1 XP</span>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          {recentNotes.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Recent Notes</h3>
              </div>
              <div className="space-y-2">
                {recentNotes.map(note => {
                  const wordCount = note.content.trim().split(/\s+/).filter(w => w.length > 0).length;
                  return (
                    <div key={note.id} className="text-xs p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors">
                      <p className="font-medium truncate mb-1">{note.title}</p>
                      <p className="text-muted-foreground">{wordCount} words</p>
                    </div>
                  );
                })}
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
                ? `Write ${25 - stats.totalNotes} more notes to unlock your second character!`
                : stats.totalNotes < 50
                ? `Write ${50 - stats.totalNotes} more notes to unlock your third character!`
                : 'Keep writing to level up your characters!'}
            </p>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export default StatsPanel;