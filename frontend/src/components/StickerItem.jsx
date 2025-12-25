import React, { useRef } from 'react';
import Draggable from 'react-draggable';
import { ArrowRight, ArrowDown, ArrowLeft, ArrowUp, Circle, Square, Star, Heart, RotateCw, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

const STICKER_ICONS = {
  'arrow-right': ArrowRight,
  'arrow-down': ArrowDown,
  'arrow-left': ArrowLeft,
  'arrow-up': ArrowUp,
  'circle': Circle,
  'square': Square,
  'star': Star,
  'heart': Heart,
};

export const StickerItem = ({ sticker, updateSticker, deleteSticker }) => {
  const nodeRef = useRef(null);
  const Icon = STICKER_ICONS[sticker.type] || Circle;

  const handleDragStop = (e, data) => {
    updateSticker(sticker.id, {
      position: { x: data.x, y: data.y }
    });
  };

  const handleRotate = () => {
    updateSticker(sticker.id, {
      rotation: (sticker.rotation + 45) % 360
    });
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={sticker.position}
      onStop={handleDragStop}
      bounds="parent"
    >
      <div
        ref={nodeRef}
        className="absolute cursor-move group"
        style={{
          transform: `rotate(${sticker.rotation}deg)`
        }}
      >
        <div className="relative">
          <Icon className="h-12 w-12 text-primary/60 hover:text-primary transition-colors" strokeWidth={2.5} />
          
          {/* Controls */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              variant="secondary"
              size="icon"
              className="h-6 w-6"
              onClick={handleRotate}
            >
              <RotateCw className="h-3 w-3" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="h-6 w-6"
              onClick={() => deleteSticker(sticker.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Draggable>
  );
};

export default StickerItem;