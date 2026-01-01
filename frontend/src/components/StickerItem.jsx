import React, { useState, useRef, useCallback } from 'react';
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
  RotateCw,
  Trash2,
  Maximize2
} from 'lucide-react';
import { Button } from './ui/button';

const STICKER_ICONS = {
  'arrow-right': ArrowRight,
  'arrow-down': ArrowDown,
  'arrow-left': ArrowLeft,
  'arrow-up': ArrowUp,
  circle: Circle,
  square: Square,
  star: Star,
  heart: Heart,
};

export const StickerItem = React.memo(({
  sticker,
  updateSticker,
  deleteSticker,
  zoom = 1
}) => {
  const nodeRef = useRef(null);
  const Icon = STICKER_ICONS[sticker.type] || Circle;
  const [isResizing, setIsResizing] = useState(false);

  const size = sticker.size || { width: 48, height: 48 };
  const color = sticker.color || '#3b82f6';

  const handleRotate = () => {
    updateSticker(sticker.id, {
      rotation: ((sticker.rotation || 0) + 45) % 360
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

    const handleMove = (moveEvent) => {
      const deltaX = (moveEvent.clientX - startX) / zoom;
      const deltaY = (moveEvent.clientY - startY) / zoom;

      updateSticker(sticker.id, {
        size: {
          width: Math.max(30, startWidth + deltaX),
          height: Math.max(30, startHeight + deltaY),
        }
      });
    };

    const handleEnd = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
  }, [size, sticker.id, updateSticker, zoom]);

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={sticker.position}
      scale={zoom}
      disabled={isResizing}
      cancel="[data-no-drag]"
      onStop={(e, data) => {
        updateSticker(sticker.id, {
          position: { x: data.x, y: data.y }
        });
      }}
    >
      <div
        ref={nodeRef}
        className="absolute cursor-move group"
        style={{
          width: size.width,
          height: size.height,
          zIndex: 20
        }}
      >
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{ transform: `rotate(${sticker.rotation || 0}deg)` }}
        >
          <Icon
            strokeWidth={2.5}
            style={{
              width: '100%',
              height: '100%',
              color
            }}
          />

          {/* Controls */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              variant="secondary"
              size="icon"
              className="h-6 w-6"
              onClick={handleRotate}
              data-no-drag
            >
              <RotateCw className="h-3 w-3" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="h-6 w-6"
              onClick={() => deleteSticker(sticker.id)}
              data-no-drag
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          {/* Resize */}
          <div
            data-no-drag
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center"
            onMouseDown={handleResizeStart}
            style={{ background: color }}
          >
            <Maximize2 className="h-3 w-3 text-white" />
          </div>
        </div>
      </div>
    </Draggable>
  );
});

StickerItem.displayName = 'StickerItem';
export default StickerItem;

