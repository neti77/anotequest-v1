import React, { useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { ArrowRight, ArrowDown, ArrowLeft, ArrowUp, Circle, Square, Star, Heart, RotateCw, Trash2, Maximize2 } from 'lucide-react';
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
  
  // Default size if not specified
  const size = sticker.size || { width: 48, height: 48 };

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

  // For arrows, calculate length-based scaling
  const isArrow = sticker.type.includes('arrow');
  const scaleFactor = isArrow 
    ? Math.max(size.width, size.height) / 48 
    : Math.min(size.width, size.height) / 48;

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
          transform: `rotate(${sticker.rotation}deg)`,
          width: isArrow ? Math.max(size.width, 48) : size.width,
          height: isArrow ? Math.max(size.height, 48) : size.height
        }}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <Icon 
            className="text-primary/70 hover:text-primary transition-colors" 
            strokeWidth={2.5}
            style={{
              width: isArrow ? '100%' : `${Math.max(24, scaleFactor * 48)}px`,
              height: isArrow ? '100%' : `${Math.max(24, scaleFactor * 48)}px`
            }}
          />
          
          {/* Controls */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
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