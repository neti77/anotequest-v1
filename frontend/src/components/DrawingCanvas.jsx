import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Pen, X } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#eab308', '#8b5cf6', '#f97316',
  '#ec4899', '#14b8a6', '#000000', '#6b7280', '#ffffff'
];

export const DrawingCanvas = ({ canvasSize, drawings, setDrawings, onPan, isActive, onClose }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [color, setColor] = useState('#3b82f6');
  const [brushSize, setBrushSize] = useState(3);
  const [currentPath, setCurrentPath] = useState([]);
  const [isEraser, setIsEraser] = useState(false);
  
  const touchStateRef = useRef({
    touchCount: 0,
    lastPanPosition: null
  });

  // Redraw canvas when drawings change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawings.forEach(drawing => {
      if (drawing.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
      
      ctx.strokeStyle = drawing.color;
      ctx.lineWidth = drawing.brushSize;
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
    const scrollContainer = canvas.closest('.overflow-auto');
    const scrollLeft = scrollContainer ? scrollContainer.scrollLeft : 0;
    const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
    
    return {
      x: touch.clientX - rect.left + scrollLeft,
      y: touch.clientY - rect.top + scrollTop
    };
  }, []);

  // Mouse handlers
  const handleMouseDown = (e) => {
    if (!isActive) return;
    e.preventDefault();
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setCurrentPath([pos]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !isActive) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setCurrentPath(prev => [...prev, pos]);
    drawStroke(pos);
  };

  const handleMouseUp = () => {
    finishDrawing();
  };

  // Touch handlers for iPad
  const handleTouchStart = useCallback((e) => {
    if (!isActive) return;
    const touchCount = e.touches.length;
    touchStateRef.current.touchCount = touchCount;
    
    if (touchCount === 1) {
      e.preventDefault();
      setIsPanning(false);
      setIsDrawing(true);
      const pos = getPosition(e.touches[0]);
      setCurrentPath([pos]);
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
      if (isDrawing && currentPath.length > 1) {
        setDrawings(prev => [...prev, { path: currentPath, color, brushSize, isEraser }]);
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
  }, [isDrawing, isPanning, currentPath, color, brushSize, isEraser, setDrawings, isActive]);

  const drawStroke = (pos) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || currentPath.length === 0) return;
    
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = brushSize * 2;
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

  const finishDrawing = () => {
    if (isDrawing && currentPath.length > 1) {
      setDrawings(prev => [...prev, { path: currentPath, color, brushSize, isEraser }]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  };

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

      {/* Transparent Floating Toolbar - Only when drawing is active */}
      {isActive && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-card/80 backdrop-blur-xl rounded-full shadow-lg border border-border/50 px-4 py-2 flex items-center gap-3">
            {/* Pen/Eraser Toggle */}
            <div className="flex gap-1 bg-muted/50 rounded-full p-1">
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

            {/* Divider */}
            <div className="w-px h-6 bg-border" />

            {/* Colors */}
            <div className="flex gap-1">
              {COLORS.slice(0, 6).map(c => (
                <button
                  key={c}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    color === c ? 'border-primary scale-110' : 'border-transparent'
                  }`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-border" />

            {/* Brush Size */}
            <div className="flex items-center gap-2 w-24">
              <Slider
                value={[brushSize]}
                onValueChange={(v) => setBrushSize(v[0])}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <span className="text-xs text-muted-foreground w-4">{brushSize}</span>
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
      )}
    </>
  );
};

export default DrawingCanvas;
