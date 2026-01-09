import React, { memo } from 'react';

const ConnectionLine = ({ from, to, onDelete, isDragging }) => {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const curvature = Math.min(Math.abs(dx), Math.abs(dy)) * 0.3;
  const controlY = midY - Math.sign(dy || 1) * curvature;

  const d = `M ${from.x} ${from.y} Q ${midX} ${controlY} ${to.x} ${to.y}`;

  return (
    <>
      {/* Curved line */}
      <path
        d={d}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        strokeLinecap="round"
        pointerEvents="none"
        style={{ transition: isDragging ? 'none' : 'stroke 0.15s ease' }}
      />

      {/* Start / End points */}
      <circle r="5" cx={from.x} cy={from.y} fill="hsl(var(--primary))" />
      <circle r="5" cx={to.x} cy={to.y} fill="hsl(var(--primary))" />

      {/* Delete button */}
      {onDelete && !isDragging && (
        <g
          className="cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
          transform={`translate(${midX}, ${midY})`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <circle r="10" fill="hsl(var(--destructive))" />
          <text
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

export default memo(ConnectionLine);
