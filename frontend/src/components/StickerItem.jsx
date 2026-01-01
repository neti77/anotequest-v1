import React, { useState, useRef, useEffect, useCallback } from 'react';
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

export const StickerItem = React.memo(({ sticker, updateSticker, deleteSticker }) => {
  const nodeRef = useRef(null);
  const Icon = STICKER_ICONS[sticker.type] || Circle;
  const [isResizing, setIsResizing] = useState(false);
  
  const size = sticker.size || { width: 48, height: 48 };
  const color = sticker.color || '#3b82f6';

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

  const handleResizeStart = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    
    // Support both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const startX = clientX;
    const startY = clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const handleMove = (moveEvent) => {
      const moveClientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const moveClientY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
      
      const deltaX = moveClientX - startX;
      const deltaY = moveClientY - startY;
      
      const newWidth = Math.max(30, startWidth + deltaX);
      const newHeight = Math.max(30, startHeight + deltaY);
      
      updateSticker(sticker.id, {
        size: { width: newWidth, height: newHeight }
      });
    };

    const handleEnd = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  }, [sticker.id, size, updateSticker]);

  return (
    <Draggable
  nodeRef={nodeRef}
  handle=".drag-handle"
  defaultPosition={item.position}
  scale={zoom}
  onStop={(e, data) => {
    updateItem(item.id, {
      position: { x: data.x, y: data.y }
    });
  }}
>

      <div
        ref={nodeRef}
        className="absolute cursor-move group"
        style={{
          transform: `rotate(${sticker.rotation}deg)`,
          width: size.width,
          height: size.height,
          zIndex: 20
        }}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <Icon 
            className="transition-colors" 
            strokeWidth={2.5}
            style={{
              width: '100%',
              height: '100%',
              color: color
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

          {/* Resize Handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center"
            onMouseDown={handleResizeStart}
            style={{ 
              background: color,
            }}
          >
            <Maximize2 className="h-3 w-3 text-white" />
          </div>
        </div>
      </div>
    </Draggable>
  );
});

export default StickerItem;
