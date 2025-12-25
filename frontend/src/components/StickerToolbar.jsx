import React from 'react';
import { ArrowRight, ArrowDown, ArrowLeft, ArrowUp, Circle, Square, Star, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Separator } from './ui/separator';

const STICKER_TYPES = [
  { type: 'arrow-right', icon: ArrowRight, label: 'Arrow Right' },
  { type: 'arrow-down', icon: ArrowDown, label: 'Arrow Down' },
  { type: 'arrow-left', icon: ArrowLeft, label: 'Arrow Left' },
  { type: 'arrow-up', icon: ArrowUp, label: 'Arrow Up' },
  { type: 'circle', icon: Circle, label: 'Circle' },
  { type: 'square', icon: Square, label: 'Square' },
  { type: 'star', icon: Star, label: 'Star' },
  { type: 'heart', icon: Heart, label: 'Heart' },
];

export const StickerToolbar = ({ selectedTool, setSelectedTool }) => {
  return (
    <Card className="absolute top-4 left-1/2 -translate-x-1/2 z-10 p-2 bg-card/90 backdrop-blur-md shadow-lg">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground px-2">Stickers:</span>
        <Separator orientation="vertical" className="h-6" />
        {STICKER_TYPES.map(({ type, icon: Icon, label }) => (
          <Button
            key={type}
            variant={selectedTool === type ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedTool(selectedTool === type ? null : type)}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default StickerToolbar;