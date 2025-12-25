import React, { useRef, useState, useEffect } from 'react';
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
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState(null);
  
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

  const handleResizeStart = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY, width: size.width, height: size.height });
  };

  const handleResizeMove = (e) => {
    if (!isResizing || !resizeStart) return;
    
    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    
    const newWidth = Math.max(30, resizeStart.width + deltaX);
    const newHeight = Math.max(30, resizeStart.height + deltaY);
    
    updateSticker(sticker.id, {
      size: { width: newWidth, height: newHeight }
    });
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeStart(null);
  };

  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, resizeStart]);

  const isArrow = sticker.type.includes('arrow');

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
          height: size.height
        }}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <Icon 
            className="text-primary/70 hover:text-primary transition-colors" 
            strokeWidth={2.5}
            style={{
              width: '100%',
              height: '100%'
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
            className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={handleResizeStart}
            style={{ 
              background: 'linear-gradient(135deg, transparent 50%, hsl(var(--primary)) 50%)',
            }}
          />
        </div>
      </div>
    </Draggable>
  );
};

export default StickerItem;