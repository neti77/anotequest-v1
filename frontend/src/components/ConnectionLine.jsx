import React from 'react';
import { X } from 'lucide-react';

export const ConnectionLine = ({ from, to, onDelete }) => {
  // Calculate control points for a smooth curve
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  
  // Create a curved path
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  // Control point offset for curve
  const curvature = Math.min(Math.abs(dx), Math.abs(dy)) * 0.3;
  
  const path = `M ${from.x} ${from.y} Q ${midX} ${midY - curvature} ${to.x} ${to.y}`;

  return (
    <>
      {/* The actual line */}
      <path
        d={path}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        strokeLinecap="round"
        className="transition-all duration-75"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
      />
      
      {/* Arrow head at the end */}
      <circle
        cx={to.x}
        cy={to.y}
        r="5"
        fill="hsl(var(--primary))"
      />
      
      {/* Start point */}
      <circle
        cx={from.x}
        cy={from.y}
        r="5"
        fill="hsl(var(--primary))"
      />
      
      {/* Delete button at midpoint */}
      {onDelete && (
        <g 
          className="cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <circle
            cx={midX}
            cy={midY}
            r="10"
            fill="hsl(var(--destructive))"
          />
          <text
            x={midX}
            y={midY}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize="12"
            fontWeight="bold"
          >
            ×
          </text>
        </g>
      )}
    </>
  );
};

export default ConnectionLine;
