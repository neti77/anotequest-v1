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
  const toolbarRef = useRef(null);
  const dragHandleRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw all paths
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
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }, [drawings]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPath([{ x, y }]);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newPath = [...currentPath, { x, y }];
    setCurrentPath(newPath);

    const ctx = canvasRef.current.getContext('2d');
    
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = brushSize * 2; // Eraser is larger
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
    ctx.lineTo(x, y);
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
        style={{ zIndex: 5 }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />

      {/* Draggable Drawing Controls */}
      <Draggable handle=".drag-handle" bounds="parent" nodeRef={toolbarRef}>
        <div ref={toolbarRef} className="fixed bottom-24 right-8 z-50">
          <Card className="bg-card/95 backdrop-blur-md border-2 border-border shadow-xl p-3 w-56">
            {/* Drag Handle */}
            <div className="drag-handle flex items-center justify-between mb-3 cursor-move pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Move className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Drawing Tools</span>
              </div>
            </div>
            
            {/* Tool Selection */}
            <div className="flex gap-2 mb-3">
              <Button
                variant={!isEraser ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsEraser(false)}
                className="flex-1"
              >
                <Pen className="h-4 w-4 mr-1" />
                Pen
              </Button>
              <Button
                variant={isEraser ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsEraser(true)}
                className="flex-1"
              >
                <Eraser className="h-4 w-4 mr-1" />
                Eraser
              </Button>
            </div>

            {/* Color Picker */}
            {!isEraser && (
              <div className="mb-3">
                <span className="text-xs font-medium mb-2 block">Color:</span>
                <div className="grid grid-cols-6 gap-2">
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
                      className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
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
          </Card>
        </div>
      </Draggable>
    </>
  );
};

export default DrawingCanvas;