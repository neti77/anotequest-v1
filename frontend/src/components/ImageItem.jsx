import React, { useRef } from 'react';
import Draggable from 'react-draggable';
import { X, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';

export const ImageItem = React.memo(({
  image,
  updateImage,
  deleteImage,
  onItemClick,
  isConnecting,
  isSelected,
  zoom = 1,
  shouldDeleteOnDrop,
  onMultiDrag,
  selectedCount = 0,
}) => {
  const nodeRef = useRef(null);
  const lastDragPosRef = useRef({ x: 0, y: 0 });

  const handleResize = (e) => {
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = image.size?.width || 300;
    const startHeight = image.size?.height || 200;

    const handleMouseMove = (moveEvent) => {
      const deltaX = (moveEvent.clientX - startX) / zoom;
      const deltaY = (moveEvent.clientY - startY) / zoom;

      updateImage(image.id, {
        size: {
          width: Math.max(100, startWidth + deltaX),
          height: Math.max(80, startHeight + deltaY),
        }
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleConnectionClick = (e) => {
    if (isConnecting) {
      e.stopPropagation();
      onItemClick?.();
    }
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={image.position}
      scale={zoom}
      disabled={isConnecting}
      cancel="button, [data-no-drag]"
      onStart={(e, data) => {
        lastDragPosRef.current = { x: data.x, y: data.y };
      }}
      onDrag={(e, data) => {
        if (isSelected && selectedCount > 1 && onMultiDrag) {
          const deltaX = data.x - lastDragPosRef.current.x;
          const deltaY = data.y - lastDragPosRef.current.y;
          onMultiDrag(deltaX, deltaY);
        }
        lastDragPosRef.current = { x: data.x, y: data.y };
      }}
      onStop={(e, data) => {
        if (shouldDeleteOnDrop && shouldDeleteOnDrop(e)) {
          deleteImage(image.id);
        } else {
          updateImage(image.id, {
            position: { x: data.x, y: data.y },
          });
        }
      }}
    >
      <div
        ref={nodeRef}
        onClick={handleConnectionClick}
        className={`absolute group ${
          isConnecting
            ? 'cursor-pointer hover:ring-2 hover:ring-primary'
            : 'cursor-move'
        } ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
        style={{
          width: image.size?.width || 300,
          height: image.size?.height || 200,
          zIndex: 12
        }}
      >
        <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg border-2 border-border hover:border-primary transition-colors">
          <img
            src={image.data}
            alt="Canvas image"
            className="w-full h-full object-cover"
            draggable={false}
          />

          {/* Delete Button */}
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              deleteImage(image.id);
            }}
          >
            <X className="h-3 w-3" />
          </Button>

          {/* Resize Handle (subtle) */}
          <div
            data-no-drag
            className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center"
            onMouseDown={handleResize}
          >
            <Maximize2 className="h-3 w-3 text-muted-foreground/70 rotate-90" />
          </div>
        </div>
      </div>
    </Draggable>
  );
});

ImageItem.displayName = 'ImageItem';
export default ImageItem;

