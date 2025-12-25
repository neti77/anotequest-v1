import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Pen } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

export const DrawingCanvas = ({ canvasSize, drawings, setDrawings }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#3b82f6');
  const [brushSize, setBrushSize] = useState(3);
  const [currentPath, setCurrentPath] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw all paths
    drawings.forEach(drawing => {
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
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
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
      setDrawings([...drawings, { path: currentPath, color, brushSize }]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  };

  const clearDrawing = () => {
    setDrawings([]);
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
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

      {/* Drawing Controls */}
      <div className="fixed bottom-24 right-8 z-50 flex flex-col gap-2 bg-card/90 backdrop-blur-md border border-border rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Pen className="h-4 w-4" />
          <span className="text-xs font-medium">Draw</span>
        </div>
        
        <div className="flex gap-2">
          {['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#8b5cf6', '#000000'].map(c => (
            <button
              key={c}
              className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-primary' : 'border-transparent'}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs">Size:</span>
          <Slider
            value={[brushSize]}
            onValueChange={(v) => setBrushSize(v[0])}
            min={1}
            max={10}
            step={1}
            className="w-20"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={clearDrawing}
          className="w-full"
        >
          <Eraser className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </div>
    </>
  );
};

export default DrawingCanvas;
