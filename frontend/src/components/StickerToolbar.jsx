import React, { useRef, useState } from 'react';
import Draggable from 'react-draggable';
import {
  ArrowRight,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Circle,
  Square,
  Star,
  Heart,
  Move
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

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

const STICKER_COLORS = [
  { color: '#3b82f6', name: 'Blue' },
  { color: '#ef4444', name: 'Red' },
  { color: '#22c55e', name: 'Green' },
  { color: '#eab308', name: 'Yellow' },
  { color: '#8b5cf6', name: 'Purple' },
  { color: '#f97316', name: 'Orange' },
];

export const StickerToolbar = ({
  selectedTool,
  setSelectedTool,
  stickerColor,
  setStickerColor
}) => {
  const nodeRef = useRef(null);

  // controlled position (safe)
  const [position, setPosition] = useState({ x: 0, y: 0 });

  return (
    <Draggable
      nodeRef={nodeRef}
      position={position}
      handle=".drag-handle"
      cancel="button"
      onStop={(e, data) => {
        setPosition({ x: data.x, y: data.y });
      }}
    >
      <div
        ref={nodeRef}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
      >
        <Card className="p-3 bg-card/95 backdrop-blur-md shadow-xl border-2 border-border">
          {/* Drag Handle */}
          <div className="drag-handle flex items-center gap-2 mb-3 cursor-move pb-2 border-b border-border">
            <Move className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold">Stickers</span>
          </div>

          {/* Sticker Types */}
          <div className="flex items-center gap-2 mb-3">
            {STICKER_TYPES.map(({ type, icon: Icon, label }) => (
              <Button
                key={type}
                variant={selectedTool === type ? 'default' : 'ghost'}
                size="icon"
                className="h-9 w-9"
                onClick={() =>
                  setSelectedTool(selectedTool === type ? null : type)
                }
                title={label}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>

          {/* Color Picker */}
          <div>
            <span className="text-xs font-medium mb-2 block">Color</span>
            <div className="flex gap-2">
              {STICKER_COLORS.map(({ color, name }) => (
                <button
                  key={color}
                  className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 ${
                    stickerColor === color
                      ? 'border-primary ring-2 ring-primary/50'
                      : 'border-border'
                  }`}
                  style={{ background: color }}
                  onClick={() => setStickerColor(color)}
                  title={name}
                />
              ))}
            </div>
          </div>
        </Card>
      </div>
    </Draggable>
  );
};

export default StickerToolbar;

