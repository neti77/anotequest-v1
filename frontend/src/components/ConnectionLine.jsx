import React from 'react';
import { X } from 'lucide-react';

export const ConnectionLine = ({ from, to, onDelete }) => {
  // Calculate line properties
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // Midpoint for delete button
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  return (
    <div className="pointer-events-none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5 }}>
      {/* Line */}
      <div
        className="absolute bg-primary/60 hover:bg-primary transition-colors group"
        style={{
          left: from.x,
          top: from.y,
          width: length,
          height: 3,
          transform: `rotate(${angle}deg)`,
          transformOrigin: '0 50%',
          pointerEvents: 'auto',
          cursor: 'pointer'
        }}
      >
        {/* Arrow head */}
        <div 
          className="absolute right-0 top-1/2 -translate-y-1/2 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-primary/60"
          style={{ right: -2 }}
        />
      </div>
      
      {/* Connection dots */}
      <div 
        className="absolute w-3 h-3 bg-primary rounded-full border-2 border-background shadow-sm"
        style={{ left: from.x - 6, top: from.y - 6 }}
      />
      <div 
        className="absolute w-3 h-3 bg-primary rounded-full border-2 border-background shadow-sm"
        style={{ left: to.x - 6, top: to.y - 6 }}
      />
      
      {/* Delete button at midpoint */}
      {onDelete && (
        <button
          className="absolute w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity shadow-md"
          style={{ 
            left: midX - 10, 
            top: midY - 10,
            pointerEvents: 'auto'
          }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

export default ConnectionLine;
