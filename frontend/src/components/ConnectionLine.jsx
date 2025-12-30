import React, { useRef, useEffect, memo } from 'react';

const ConnectionLine = ({ from, to, onDelete, isDragging }) => {
  const pathRef = useRef(null);
  const startRef = useRef(null);
  const endRef = useRef(null);
  const deleteRef = useRef(null);
  const rafRef = useRef(null);

  const updateLine = () => {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const curvature = Math.min(Math.abs(dx), Math.abs(dy)) * 0.3;

    const d = `M ${from.x} ${from.y}
               Q ${midX} ${midY - curvature}
               ${to.x} ${to.y}`;

    pathRef.current?.setAttribute('d', d);
    startRef.current?.setAttribute('cx', from.x);
    startRef.current?.setAttribute('cy', from.y);
    endRef.current?.setAttribute('cx', to.x);
    endRef.current?.setAttribute('cy', to.y);

    if (deleteRef.current) {
      deleteRef.current.setAttribute(
        'transform',
        `translate(${midX}, ${midY})`
      );
    }
  };

  useEffect(() => {
    if (rafRef.current) return;

    rafRef.current = requestAnimationFrame(() => {
      updateLine();
      rafRef.current = null;
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [from.x, from.y, to.x, to.y]);

  return (
    <>
      {/* Line */}
      <path
        ref={pathRef}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        strokeLinecap="round"
        style={{
          transition: isDragging ? 'none' : 'stroke 0.15s ease',
        }}
      />

      {/* Start point */}
      <circle
        ref={startRef}
        r="5"
        fill="hsl(var(--primary))"
      />

      {/* End point */}
      <circle
        ref={endRef}
        r="5"
        fill="hsl(var(--primary))"
      />

      {/* Delete button */}
      {onDelete && (
        <g
          ref={deleteRef}
          className="cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
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

