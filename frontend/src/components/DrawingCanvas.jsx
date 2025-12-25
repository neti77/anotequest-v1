import React, { useRef, useState, useEffect, useCallback } from 'react';
import Draggable from 'react-draggable';
import { Eraser, Pen, Move, Minus, Plus, Sticker, ArrowRight, ArrowDown, ArrowLeft, ArrowUp, Circle, Square, Star, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Card } from './ui/card';
import { toast } from 'sonner';

const STICKER_TYPES = [
  { type: 'arrow-right', icon: ArrowRight, label: 'Arrow' },
  { type: 'arrow-down', icon: ArrowDown, label: 'Down' },
  { type: 'circle', icon: Circle, label: 'Circle' },
  { type: 'square', icon: Square, label: 'Square' },
  { type: 'star', icon: Star, label: 'Star' },
  { type: 'heart', icon: Heart, label: 'Heart' },
];

export const DrawingCanvas = ({ canvasSize, drawings, setDrawings, onPan, addSticker }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [color, setColor] = useState('#3b82f6');
  const [brushSize, setBrushSize] = useState(3);
  const [currentPath, setCurrentPath] = useState([]);
  const [toolMode, setToolMode] = useState('pen'); // 'pen', 'eraser', 'sticker'
  const [isMinimized, setIsMinimized] = useState(false);
  const toolbarRef = useRef(null);
  
  // Touch tracking for multi-touch
  const touchStateRef = useRef({
    touchCount: 0,
    lastPanPosition: null,
    initialPinchDistance: null
  });

  const isEraser = toolMode === 'eraser';

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

  // Mouse event handlers (for desktop)
  const handleMouseDown = (e) => {
    if (toolMode === 'sticker') return; // Stickers don't draw
    e.preventDefault();
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const pos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    setCurrentPath([pos]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || toolMode === 'sticker') return;
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const pos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    const newPath = [...currentPath, pos];
    setCurrentPath(newPath);
    drawStroke(pos);
  };

  const handleMouseUp = () => {
    finishDrawing();
  };

  // Touch event handlers - for iPad
  const handleTouchStart = useCallback((e) => {
    if (toolMode === 'sticker') return;
    
    const touchCount = e.touches.length;
    touchStateRef.current.touchCount = touchCount;
    
    if (touchCount === 1) {
      // Single finger = draw
      e.preventDefault();
      setIsPanning(false);
      setIsDrawing(true);
      const pos = getPosition(e.touches[0]);
      setCurrentPath([pos]);
    } else if (touchCount === 2) {
      // Two fingers = pan
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
  }, [getPosition, toolMode]);

  const handleTouchMove = useCallback((e) => {
    if (toolMode === 'sticker') return;
    
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
        
        if (onPan) {
          onPan(deltaX, deltaY);
        }
      }
      
      touchStateRef.current.lastPanPosition = currentCenter;
    }
  }, [isDrawing, isPanning, getPosition, onPan, toolMode]);

  const handleTouchEnd = useCallback((e) => {
    if (toolMode === 'sticker') return;
    
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
  }, [isDrawing, isPanning, currentPath, color, brushSize, isEraser, setDrawings, toolMode]);

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

  // Handle sticker placement
  const handleAddSticker = useCallback((stickerType) => {
    if (!addSticker) return;
    
    // Get scroll container to find visible area
    const scrollContainer = canvasRef.current?.closest('.overflow-auto');
    const scrollLeft = scrollContainer ? scrollContainer.scrollLeft : 0;
    const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
    const viewWidth = scrollContainer ? scrollContainer.clientWidth : 800;
    const viewHeight = scrollContainer ? scrollContainer.clientHeight : 600;
    
    // Place sticker in visible area with some randomness
    const x = scrollLeft + (viewWidth / 2) + (Math.random() - 0.5) * 200;
    const y = scrollTop + (viewHeight / 2) + (Math.random() - 0.5) * 150;
    
    addSticker({
      type: stickerType,
      position: { x: x - 30, y: y - 30 },
      size: { width: 60, height: 60 },
      rotation: 0,
      color: color
    });
    
    toast.success('Sticker added!');
  }, [addSticker, color]);

  // Handle minimize button
  const handleMinimizeClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMinimized(prev => !prev);
  }, []);

  const handleMinimizeTouch = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMinimized(prev => !prev);
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="absolute inset-0 pointer-events-auto"
        style={{ 
          zIndex: 5, 
          touchAction: 'none',
          pointerEvents: toolMode === 'sticker' ? 'none' : 'auto'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Draggable Drawing Controls */}
      <Draggable handle=".drag-handle" bounds="parent" nodeRef={toolbarRef}>
        <div ref={toolbarRef} className="fixed bottom-20 right-4 md:bottom-24 md:right-8 z-50">
          <Card className="bg-card/95 backdrop-blur-md border-2 border-border shadow-xl transition-all">
            {/* Header with Drag Handle and Minimize Button */}
            <div className="flex items-center justify-between p-2 md:p-3 border-b border-border">
              <div className="drag-handle flex items-center gap-2 cursor-move flex-1">
                <Move className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                <span className="text-xs md:text-sm font-semibold">Tools</span>
              </div>
              <button
                type="button"
                className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent active:bg-accent/80 transition-colors touch-manipulation"
                onClick={handleMinimizeClick}
                onTouchEnd={handleMinimizeTouch}
                style={{ touchAction: 'manipulation' }}
              >
                {isMinimized ? (
                  <Plus className="h-4 w-4" />
                ) : (
                  <Minus className="h-4 w-4" />
                )}
              </button>
            </div>
            
            {!isMinimized && (
              <div className="p-2 md:p-3 w-52 md:w-60">
                {/* Tool Mode Selection */}
                <div className="flex gap-1 mb-3">
                  <Button
                    variant={toolMode === 'pen' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setToolMode('pen')}
                    className="flex-1 text-xs"
                  >
                    <Pen className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    Pen
                  </Button>
                  <Button
                    variant={toolMode === 'eraser' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setToolMode('eraser')}
                    className="flex-1 text-xs"
                  >
                    <Eraser className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    Eraser
                  </Button>
                  <Button
                    variant={toolMode === 'sticker' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setToolMode('sticker')}
                    className="flex-1 text-xs"
                  >
                    <Sticker className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    Sticker
                  </Button>
                </div>

                {/* Sticker Selection (shown when sticker mode) */}
                {toolMode === 'sticker' && (
                  <div className="mb-3">
                    <span className="text-xs font-medium mb-2 block">Click to add:</span>
                    <div className="grid grid-cols-6 gap-1">
                      {STICKER_TYPES.map(({ type, icon: Icon, label }) => (
                        <button
                          key={type}
                          className="h-8 w-8 rounded-md border border-border hover:bg-accent hover:border-primary transition-all flex items-center justify-center active:scale-95"
                          onClick={() => handleAddSticker(type)}
                          title={label}
                          style={{ color: color }}
                        >
                          <Icon className="h-5 w-5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Picker (always visible) */}
                <div className="mb-3">
                  <span className="text-xs font-medium mb-2 block">Color:</span>
                  <div className="grid grid-cols-6 gap-1.5">
                    {[
                      { color: '#3b82f6', name: 'Blue' },
                      { color: '#ef4444', name: 'Red' },
                      { color: '#22c55e', name: 'Green' },
                      { color: '#eab308', name: 'Yellow' },
                      { color: '#8b5cf6', name: 'Purple' },
                      { color: '#f97316', name: 'Orange' },
                      { color: '#ec4899', name: 'Pink' },
                      { color: '#14b8a6', name: 'Teal' },
                      { color: '#000000', name: 'Black' },
                      { color: '#ffffff', name: 'White' },
                      { color: '#6b7280', name: 'Gray' },
                      { color: '#a855f7', name: 'Violet' },
                    ].map(c => (
                      <button
                        key={c.color}
                        className={`w-6 h-6 md:w-7 md:h-7 rounded-md border-2 transition-all active:scale-95 ${
                          color === c.color ? 'border-primary ring-2 ring-primary/50' : 'border-border'
                        }`}
                        style={{ background: c.color }}
                        onClick={() => setColor(c.color)}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Brush Size (only for pen/eraser) */}
                {toolMode !== 'sticker' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{isEraser ? 'Eraser' : 'Brush'} Size:</span>
                      <span className="text-xs text-muted-foreground">{isEraser ? brushSize * 2 : brushSize}px</span>
                    </div>
                    <Slider
                      value={[brushSize]}
                      onValueChange={(v) => setBrushSize(v[0])}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </Draggable>
    </>
  );
};

export default DrawingCanvas;
