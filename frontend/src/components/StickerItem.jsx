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
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      const newWidth = Math.max(30, startWidth + deltaX);
      const newHeight = Math.max(30, startHeight + deltaY);
      
      updateSticker(sticker.id, {
        size: { width: newWidth, height: newHeight }
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [sticker.id, size, updateSticker]);

  return (
    <Draggable
      nodeRef={nodeRef}
      position={sticker.position}
      onStop={handleDragStop}
      bounds="parent"
      disabled={isResizing}
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