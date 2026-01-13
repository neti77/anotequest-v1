import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Eraser, Pen, X } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#eab308', '#8b5cf6', '#f97316',
  '#ec4899', '#14b8a6', '#000000', '#6b7280', '#ffffff'
];

export const DrawingCanvas = ({ canvasSize, drawings, setDrawings, onPan, isActive, onClose, zoom = 1, scrollContainerRef, drawingTool = 'freehand' }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [color, setColor] = useState('#3b82f6');
  const [brushSize, setBrushSize] = useState(4);
  const [currentPath, setCurrentPath] = useState([]);
  const [isEraser, setIsEraser] = useState(false);
  
  const touchStateRef = useRef({
    touchCount: 0,
    lastPanPosition: null
  });

  const shapeStartRef = useRef(null);

  // Redraw canvas when drawings change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawings.forEach(drawing => {
      const isErasingStroke = drawing.isEraser;

      if (isErasingStroke) {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
      
      ctx.strokeStyle = isErasingStroke ? 'rgba(0,0,0,1)' : drawing.color;
      // Make stored eraser strokes chunkier so they fully clear previous lines
      const effectiveBrushSize = isErasingStroke ? drawing.brushSize * 3 : drawing.brushSize;
      ctx.lineWidth = effectiveBrushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      drawing.path.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    });
    
    ctx.globalCompositeOperation = 'source-over';
  }, [drawings]);

  const getPosition = useCallback((touch) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scrollContainer = scrollContainerRef?.current || canvas.closest('.overflow-auto');
    const scrollLeft = scrollContainer ? scrollContainer.scrollLeft : 0;
    const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
    
    return {
      x: (touch.clientX - rect.left + scrollLeft) / zoom,
      y: (touch.clientY - rect.top + scrollTop) / zoom,
    };
  }, [scrollContainerRef, zoom]);

  // Mouse handlers
  const handleMouseDown = (e) => {
    if (!isActive) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const pos = {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };

    setIsDrawing(true);

    if (drawingTool && drawingTool !== 'freehand') {
      shapeStartRef.current = pos;
    } else {
      setCurrentPath([pos]);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !isActive) return;
    e.preventDefault();

    // For straight-line/shape tools we only care about start/end, no live ink drawing yet
    if (drawingTool && drawingTool !== 'freehand') {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const pos = {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
    setCurrentPath(prev => [...prev, pos]);
    drawStroke(pos);
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;

    if (!isActive) {
      setIsDrawing(false);
      setCurrentPath([]);
      shapeStartRef.current = null;
      return;
    }

    if (drawingTool && drawingTool !== 'freehand') {
      const rect = canvasRef.current.getBoundingClientRect();
      const endPos = {
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom,
      };
      const start = shapeStartRef.current;

      if (start && (start.x !== endPos.x || start.y !== endPos.y)) {
        const path = createShapePath(drawingTool, start, endPos);
        if (path && path.length > 1) {
          setDrawings(prev => [
            ...prev,
            { path, color, brushSize, isEraser: false, tool: drawingTool },
          ]);
        }
      }

      shapeStartRef.current = null;
      setIsDrawing(false);
      setCurrentPath([]);
    } else {
      finishDrawing();
    }
  };

  // Touch handlers for iPad
  const handleTouchStart = useCallback((e) => {
    if (!isActive) return;
    const touchCount = e.touches.length;
    touchStateRef.current.touchCount = touchCount;
    
    if (touchCount === 1) {
      e.preventDefault();
      setIsPanning(false);
      const pos = getPosition(e.touches[0]);
      setIsDrawing(true);

      if (drawingTool && drawingTool !== 'freehand') {
        shapeStartRef.current = pos;
      } else {
        setCurrentPath([pos]);
      }
    } else if (touchCount === 2) {
      e.preventDefault();
      setIsDrawing(false);
      setIsPanning(true);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      touchStateRef.current.lastPanPosition = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };
    }
  }, [getPosition, isActive]);

  const handleTouchMove = useCallback((e) => {
    if (!isActive) return;
    const touchCount = e.touches.length;
    
    if (touchCount === 1 && isDrawing && !isPanning) {
      // For straight-line/shape tools we only care about final endpoint
      if (drawingTool && drawingTool !== 'freehand') {
        return;
      }
      e.preventDefault();
      const pos = getPosition(e.touches[0]);
      setCurrentPath(prev => [...prev, pos]);
      drawStroke(pos);
    } else if (touchCount === 2 && isPanning) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentCenter = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };
      
      if (touchStateRef.current.lastPanPosition) {
        const deltaX = touchStateRef.current.lastPanPosition.x - currentCenter.x;
        const deltaY = touchStateRef.current.lastPanPosition.y - currentCenter.y;
        const scrollContainer = canvasRef.current?.closest('.overflow-auto');
        if (scrollContainer) {
          scrollContainer.scrollLeft += deltaX;
          scrollContainer.scrollTop += deltaY;
        }
        if (onPan) onPan(deltaX, deltaY);
      }
      touchStateRef.current.lastPanPosition = currentCenter;
    }
  }, [isDrawing, isPanning, getPosition, onPan, isActive]);

  const handleTouchEnd = useCallback((e) => {
    if (!isActive) return;
    const remainingTouches = e.touches.length;
    
    if (remainingTouches === 0) {
      if (isDrawing) {
        if (drawingTool && drawingTool !== 'freehand') {
          const touch = e.changedTouches && e.changedTouches[0];
          if (shapeStartRef.current && touch) {
            const endPos = getPosition(touch);
            const path = createShapePath(drawingTool, shapeStartRef.current, endPos);
            if (path && path.length > 1) {
              setDrawings(prev => [
                ...prev,
                { path, color, brushSize, isEraser: false, tool: drawingTool },
              ]);
            }
          }
          shapeStartRef.current = null;
        } else if (currentPath.length > 1) {
          setDrawings(prev => [...prev, { path: currentPath, color, brushSize, isEraser }]);
        }
      }
      setIsDrawing(false);
      setIsPanning(false);
      setCurrentPath([]);
      touchStateRef.current.touchCount = 0;
      touchStateRef.current.lastPanPosition = null;
    } else if (remainingTouches === 1 && isPanning) {
      setIsPanning(false);
      touchStateRef.current.lastPanPosition = null;
    }
  }, [isDrawing, isPanning, currentPath, color, brushSize, isEraser, setDrawings, isActive, drawingTool, getPosition]);

  const drawStroke = (pos) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || currentPath.length === 0) return;
    
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      // Eraser is intentionally larger than brush to clear strokes more easily
      ctx.lineWidth = brushSize * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
    }
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const prevPoint = currentPath[currentPath.length - 1];
    ctx.moveTo(prevPoint.x, prevPoint.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const createShapePath = (type, start, end) => {
    switch (type) {
      case 'line':
        return [start, end];
      case 'arrow':
        return createArrowPath(start, end);
      case 'ellipse':
        return createEllipsePath(start, end);
      default:
        return [start, end];
    }
  };

  const createArrowPath = (start, end) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (!length) return [start, end];

    const ux = dx / length;
    const uy = dy / length;
    const headLength = 12 + brushSize; // scale arrow head a bit with brush size
    const angle = Math.PI / 7; // about 25 degrees

    const tip = end;

    const leftX =
      tip.x - headLength * (ux * Math.cos(angle) + uy * Math.sin(angle));
    const leftY =
      tip.y - headLength * (uy * Math.cos(angle) - ux * Math.sin(angle));

    const rightX =
      tip.x - headLength * (ux * Math.cos(-angle) + uy * Math.sin(-angle));
    const rightY =
      tip.y - headLength * (uy * Math.cos(-angle) - ux * Math.sin(-angle));

    return [
      start,
      end,
      { x: leftX, y: leftY },
      end,
      { x: rightX, y: rightY },
    ];
  };

  const createEllipsePath = (start, end) => {
    const centerX = (start.x + end.x) / 2;
    const centerY = (start.y + end.y) / 2;
    const rx = Math.abs(end.x - start.x) / 2;
    const ry = Math.abs(end.y - start.y) / 2;
    const steps = 32;
    const points = [];

    if (rx === 0 && ry === 0) {
      return [start, end];
    }

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      points.push({
        x: centerX + rx * Math.cos(t),
        y: centerY + ry * Math.sin(t),
      });
    }

    return points;
  };

  const finishDrawing = () => {
    if (isDrawing && currentPath.length > 1) {
      setDrawings(prev => [...prev, { path: currentPath, color, brushSize, isEraser }]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  };

const toolbar = isActive ? (
  <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50">
    <div className="bg-card/90 backdrop-blur-xl rounded-2xl shadow-lg border border-border/60 px-2 py-3 flex flex-col items-center gap-3">
      {/* Label */}
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/60 select-none">
        Draw
      </span>

      {/* Pen/Eraser Toggle */}
      <div className="flex flex-col gap-1 bg-muted/50 rounded-full p-1">
        <Button
          variant={!isEraser ? 'default' : 'ghost'}
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => setIsEraser(false)}
        >
          <Pen className="h-4 w-4" />
        </Button>
        <Button
          variant={isEraser ? 'default' : 'ghost'}
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => setIsEraser(true)}
        >
          <Eraser className="h-4 w-4" />
        </Button>
      </div>

      {/* Brush Size (vertical) */}
      <div className="flex flex-col items-center gap-1">
        <Slider
          orientation="vertical"
          value={[brushSize]}
          onValueChange={(v) => setBrushSize(v[0])}
          min={1}
          max={20}
          step={1}
          className="h-24"
        />
        <span className="text-[10px] text-muted-foreground">{brushSize}</span>
      </div>

      {/* Colors (vertical) */}
      <div className="flex flex-col items-center gap-1">
        {COLORS.slice(0, 5).map(c => (
          <button
            key={c}
            className={`w-5 h-5 rounded-full border-2 transition-all ${
              color === c ? 'border-primary scale-110' : 'border-transparent'
            }`}
            style={{ background: c }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>

      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  </div>
) : null;

  return (
    <>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="absolute inset-0"
        style={{ 
          zIndex: isActive ? 15 : 5, 
          touchAction: 'none',
          pointerEvents: isActive ? 'auto' : 'none',
          cursor: isActive ? 'crosshair' : 'default'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Toolbar is portaled to <body> so it is not affected by canvas transforms/scroll */}
      {typeof document !== 'undefined' && toolbar
        ? createPortal(toolbar, document.body)
        : null}
    </>
  );
};

export default DrawingCanvas;
