import React, { useRef } from 'react';
import Draggable from 'react-draggable';
import { X, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';

export const ImageItem = React.memo(({ image, updateImage, deleteImage }) => {
  const nodeRef = useRef(null);
  
  const handleDrag = (e, data) => {
    updateImage(image.id, {
      position: { x: data.x, y: data.y }
    });
  };

  const handleResize = (e) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = image.size?.width || 300;
    const startHeight = image.size?.height || 200;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const newWidth = Math.max(100, startWidth + deltaX);
      const newHeight = Math.max(80, startHeight + deltaY);
      
      updateImage(image.id, {
        size: { width: newWidth, height: newHeight }
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={image.position}
      onStop={handleDrag}
      bounds="parent"
    >
      <div
        ref={nodeRef}
        className="absolute group cursor-move"
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

          {/* Resize Handle */}
          <div
            className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={handleResize}
          >
            <Maximize2 className="h-4 w-4 text-muted-foreground rotate-90" />
          </div>
        </div>
      </div>
    </Draggable>
  );
});

ImageItem.displayName = 'ImageItem';
export default ImageItem;
