import React, { useRef, useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Eraser, Pen, Move } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Card } from './ui/card';

export const DrawingCanvas = ({ canvasSize, drawings, setDrawings }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#3b82f6');
  const [brushSize, setBrushSize] = useState(3);
  const [currentPath, setCurrentPath] = useState([]);
  const [isEraser, setIsEraser] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const toolbarRef = useRef(null);
  const lastTouchTime = useRef(0);

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

  const getPosition = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Handle both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPosition(e);
    setCurrentPath([pos]);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const pos = getPosition(e);
    const newPath = [...currentPath, pos];
    setCurrentPath(newPath);

    const ctx = canvasRef.current.getContext('2d');
    
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

  const stopDrawing = () => {
    if (isDrawing && currentPath.length > 1) {
      setDrawings([...drawings, { path: currentPath, color, brushSize, isEraser }]);
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
        className="absolute inset-0 pointer-events-auto"
        style={{ zIndex: 5, touchAction: 'none' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      {/* Draggable Drawing Controls */}
      <Draggable handle=".drag-handle" bounds="parent" nodeRef={toolbarRef}>
        <div ref={toolbarRef} className="fixed bottom-20 right-4 md:bottom-24 md:right-8 z-50">
          <Card className="bg-card/95 backdrop-blur-md border-2 border-border shadow-xl transition-all">
            {/* Drag Handle */}
            <div className="drag-handle flex items-center justify-between p-2 md:p-3 cursor-move border-b border-border">
              <div className="flex items-center gap-2">
                <Move className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                <span className="text-xs md:text-sm font-semibold">Drawing</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </Button>
            </div>
            
            {!isMinimized && (
              <div className="p-2 md:p-3 w-48 md:w-56">
                {/* Tool Selection */}
                <div className="flex gap-2 mb-3">
                  <Button
                    variant={!isEraser ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setIsEraser(false)}
                    className="flex-1 text-xs"
                  >
                    <Pen className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    Pen
                  </Button>
                  <Button
                    variant={isEraser ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setIsEraser(true)}
                    className="flex-1 text-xs"
                  >
                    <Eraser className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    Eraser
                  </Button>
                </div>

                {/* Color Picker */}
                {!isEraser && (
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
                          className={`w-6 h-6 md:w-8 md:h-8 rounded-md border-2 transition-all active:scale-95 ${
                            color === c.color ? 'border-primary ring-2 ring-primary/50' : 'border-border'
                          }`}
                          style={{ background: c.color }}
                          onClick={() => setColor(c.color)}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Brush Size */}
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
              </div>
            )}
          </Card>
        </div>
      </Draggable>
    </>
  );
};

export default DrawingCanvas;