import React, { useRef, useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Maximize2 } from 'lucide-react';

// Small yellow sticky that you can only draw on
export const NoteSticker = React.memo(function NoteSticker({
  sticker,
  updateNoteSticker,
  deleteNoteSticker,
  zoom = 1,
  shouldDeleteOnDrop,
}) {
  const nodeRef = useRef(null);
  const canvasRef = useRef(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);

  // Redraw paths when sticker.paths changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    (sticker.paths || []).forEach((p) => {
      if (!p.points || p.points.length === 0) return;
      ctx.strokeStyle = p.color || '#1f2933';
      ctx.lineWidth = p.size || 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      p.points.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
    });
  }, [sticker.paths]);

  const getPos = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom,
    };
  };

  const drawStroke = (pos) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || currentPath.length === 0) return;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const prev = currentPath[currentPath.length - 1];
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const finishPath = () => {
    if (currentPath.length > 1) {
      const next = {
        points: currentPath,
        color: '#111827',
        size: 2,
      };
      const paths = [...(sticker.paths || []), next];
      updateNoteSticker(sticker.id, { paths });
    }
    setIsDrawing(false);
    setCurrentPath([]);
    // After finishing a stroke, exit drawing mode so the sticker becomes draggable again
    setIsDrawingMode(false);
  };

  const handleMouseDown = (e) => {
    if (!isDrawingMode) return;
    e.stopPropagation();
    e.preventDefault();
    const pos = getPos(e.clientX, e.clientY);
    setCurrentPath([pos]);
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e.clientX, e.clientY);
    setCurrentPath((prev) => [...prev, pos]);
    drawStroke(pos);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    finishPath();
  };

  const handleTouchStart = (e) => {
    if (!isDrawingMode) return;
    const t = e.touches[0];
    if (!t) return;
    e.preventDefault();
    const pos = getPos(t.clientX, t.clientY);
    setCurrentPath([pos]);
    setIsDrawing(true);
  };

  const handleTouchMove = (e) => {
    if (!isDrawing) return;
    const t = e.touches[0];
    if (!t) return;
    e.preventDefault();
    const pos = getPos(t.clientX, t.clientY);
    setCurrentPath((prev) => [...prev, pos]);
    drawStroke(pos);
  };

  const handleTouchEnd = () => {
    if (!isDrawing) return;
    finishPath();
  };

  const width = sticker.size?.width || 200;
  const height = sticker.size?.height || 160;

  const handleToggleDrawingMode = () => {
    // Double-click puts us into drawing mode; we'll exit automatically after one stroke
    if (!isDrawingMode) {
      setIsDrawingMode(true);
    }
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={sticker.position}
      scale={zoom}
      disabled={isDrawingMode}
      onStop={(e, data) => {
        if (shouldDeleteOnDrop && shouldDeleteOnDrop(e)) {
          deleteNoteSticker(sticker.id);
        } else {
          updateNoteSticker(sticker.id, {
            position: { x: data.x, y: data.y },
          });
        }
      }}
    >
      <div
        ref={nodeRef}
        className="absolute"
        style={{ width, height, zIndex: 40 }}
        onDoubleClick={handleToggleDrawingMode}
      >
        <div className="relative w-full h-full rounded-xl shadow-md border border-amber-300/80 bg-[#f5e6a7]">
          {/* Tape / pin - slightly skewed for a more organic feel */}
          <div className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1">
            <div className="h-3 w-10 rounded-[2px] bg-amber-200/80 shadow-sm rotate-[-6deg] opacity-90" />
            <div className="h-3 w-10 rounded-[2px] bg-amber-200/80 shadow-sm rotate-[4deg] opacity-90" />
          </div>

          {/* Folded corner */}
          <div className="pointer-events-none absolute top-0 right-0 w-8 h-8 overflow-hidden rounded-tr-xl">
            <div className="absolute right-0 top-0 h-6 w-6 origin-top-right rotate-45 bg-[#e8cf7f] shadow-md" />
            <div className="absolute right-0 top-0 h-px w-10 origin-top-right rotate-45 bg-amber-400/70 opacity-70" />
          </div>

          {/* Drawing surface */}
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="absolute inset-0 rounded-xl"
            style={{
              touchAction: 'none',
              background: 'transparent',
              cursor: isDrawingMode ? 'crosshair' : 'grab',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />

          {/* Subtle resize handle */}
          <div
            data-no-drag
            className="absolute bottom-1 right-1 w-4 h-4 cursor-nwse-resize opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <Maximize2 className="h-3 w-3 text-amber-700/70" />
          </div>
        </div>
      </div>
    </Draggable>
  );
});

NoteSticker.displayName = 'NoteSticker';
export default NoteSticker;
