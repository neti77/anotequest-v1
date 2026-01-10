import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import NoteCard from './NoteCard';
import StickerItem from './StickerItem';
import ImageItem from './ImageItem';
import TableItem from './TableItem';
import TodoItem from './TodoItem';
import CharacterRoamer from './CharacterRoamer';
import DrawingCanvas from './DrawingCanvas';
import NoteSticker from './NoteSticker';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

export const Canvas = ({ 
  notes, 
  totalNoteCount,
  stickers,
  noteStickers = [],
  images = [],
  tables = [],
  todos = [],
  characters,
  addNote, 
  updateNote, 
  deleteNote,
  addSticker,
  updateSticker,
  deleteSticker,
  addImage,
  updateImage,
  deleteImage,
  addTable,
  updateTable,
  deleteTable,
  addTodo,
  updateTodo,
  deleteTodo,
  updateCharacter,
  folders,
  isPremium,
  isDrawingMode,
  onCloseDrawing,
  userName,
  activeFolder,
  // NoteSticker-specific handlers
  updateNoteSticker,
  deleteNoteSticker,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const trashRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1600, height: 1000 });
  const [drawings, setDrawings] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Touch pinch-zoom state (for iPad/phones)
  const pinchState = useRef({
    isPinching: false,
    startDistance: 0,
    startZoom: 1,
  });

  // Load drawings from localStorage (per folder)
  useEffect(() => {
    const key = activeFolder ? `anotequest_drawings_${activeFolder}` : 'anotequest_drawings';
    const saved = localStorage.getItem(key);
    if (saved) {
      setDrawings(JSON.parse(saved));
    } else {
      setDrawings([]);
    }
  }, [activeFolder]);

  // Save drawings (per folder)
  useEffect(() => {
    const key = activeFolder ? `anotequest_drawings_${activeFolder}` : 'anotequest_drawings';
    localStorage.setItem(key, JSON.stringify(drawings));
  }, [drawings, activeFolder]);

  // Calculate canvas size based on content and grow as needed (right & bottom only)
  useEffect(() => {
    const padding = 300;
    const minWidth = 1600;
    const minHeight = 1000;

    let maxX = 0;
    let maxY = 0;

    const consider = (item, defaultWidth, defaultHeight) => {
      if (!item || !item.position) return;
      const width = item.size?.width || defaultWidth;
      const height = item.size?.height || defaultHeight;
      maxX = Math.max(maxX, item.position.x + width);
      maxY = Math.max(maxY, item.position.y + height);
    };

    notes.forEach(note => consider(note, 320, 200));
    stickers.forEach(sticker => consider(sticker, 100, 100));
    noteStickers.forEach(sticker => consider(sticker, 200, 160));
    images.forEach(image => consider(image, 300, 200));
    tables.forEach(table => consider(table, 400, 200));
    todos.forEach(todo => consider(todo, 280, 200));

    const targetWidth = Math.max(minWidth, maxX + padding);
    const targetHeight = Math.max(minHeight, maxY + padding);

    setCanvasSize(prev => ({
      width: Math.max(prev.width, targetWidth),
      height: Math.max(prev.height, targetHeight),
    }));
  }, [notes, stickers, noteStickers, images, tables, todos]);

  // Zoom handlers
  const handleZoom = useCallback((delta, clientX, clientY) => {
    setZoom(prevZoom => {
      const newZoom = Math.min(2.5, Math.max(0.5, prevZoom + delta));
      return newZoom;
    });
  }, []);

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      handleZoom(delta, e.clientX, e.clientY);
    }
  }, [handleZoom]);

  // Touch pinch-to-zoom (mobile/tablet)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getDistance = (touch1, touch2) => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        const dist = getDistance(e.touches[0], e.touches[1]);
        pinchState.current = {
          isPinching: true,
          startDistance: dist,
          startZoom: zoom,
        };
      }
    };

    const handleTouchMove = (e) => {
      if (!pinchState.current.isPinching || e.touches.length < 2) return;
      // Prevent browser page zoom while pinching inside the canvas
      e.preventDefault();
      const dist = getDistance(e.touches[0], e.touches[1]);
      if (pinchState.current.startDistance === 0) return;
      const scale = dist / pinchState.current.startDistance;
      const nextZoom = Math.min(2.5, Math.max(0.5, pinchState.current.startZoom * scale));
      setZoom(nextZoom);
    };

    const handleTouchEnd = () => {
      // Reset when fingers lifted
      pinchState.current = {
        isPinching: false,
        startDistance: 0,
        startZoom: zoom,
      };
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    // touchmove must be non-passive so we can call preventDefault during pinch
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [zoom]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Drag and drop handling (images + internal items)
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Only show the "drop image" overlay when actual files are being dragged
    const types = Array.from(e.dataTransfer?.types || []);
    const isFileDrag = types.includes('Files');
    setIsDraggingOver(isFileDrag);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    // Get drop position relative to canvas
    const rect = canvasRef.current.getBoundingClientRect();
    const scrollLeft = containerRef.current.scrollLeft;
    const scrollTop = containerRef.current.scrollTop;
    const x = (e.clientX - rect.left + scrollLeft) / zoom;
    const y = (e.clientY - rect.top + scrollTop) / zoom;

    // First, handle internal drag-from-toolbar items
    const itemData = e.dataTransfer.getData('application/anotequest-item');
    if (itemData) {
      try {
        const item = JSON.parse(itemData);
        const basePosition = { x, y };

        switch (item.kind) {
          case 'note':
            if (addNote) {
              addNote({ position: { x: basePosition.x - 160, y: basePosition.y - 120 } });
              toast.success('Note created!');
            }
            return;
          case 'noteSticker':
            // creation of note stickers happens via parent handler; here we just place a basic one via addNote
            return;
          case 'table':
            if (addTable) {
              addTable({
                type: 'table',
                position: { x: basePosition.x - 200, y: basePosition.y - 100 },
                size: { width: 400, height: 200 },
                rows: 3,
                cols: 3,
                data: [['', '', ''], ['', '', ''], ['', '', '']],
              });
              toast.success('Table added!');
            }
            return;
          case 'todo':
            if (addTodo) {
              addTodo({
                type: 'todo',
                position: { x: basePosition.x - 140, y: basePosition.y - 100 },
                size: { width: 280, height: 200 },
                title: 'Todo List',
                items: [{ id: Date.now(), text: '', completed: false }],
              });
              toast.success('Todo list added!');
            }
            return;
          case 'sticker':
            if (addSticker) {
              addSticker({
                type: item.type,
                position: { x: basePosition.x - 30, y: basePosition.y - 30 },
                size: { width: 60, height: 60 },
                rotation: 0,
              });
              toast.success('Sticker added!');
            }
            return;
          default:
            break;
        }
      } catch (err) {
        console.error('Failed to parse internal drag data', err);
      }
    }

    // Then handle external image drops
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type.startsWith('image/'));
    
    if (!imageFile) {
      toast.error('Please drop an image file');
      return;
    }

    try {
      toast.loading('Processing image...');
      
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true
      };
      
      const compressedFile = await imageCompression(imageFile, options);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (addImage) {
          addImage({
            type: 'image',
            data: reader.result,
            position: { x: x - 150, y: y - 100 },
            size: { width: 300, height: 200 }
          });
        }
        toast.dismiss();
        toast.success('Image dropped on canvas!');
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to process image');
    }
  };

  // Connection feature removed

  const getItemPosition = (itemId, itemType) => {
    let item;
    switch (itemType) {
      case 'note':
        item = notes.find(n => n.id === itemId);
        if (item) {
          return {
            x: item.position.x + (item.size?.width || 320) / 2,
            y: item.position.y + (item.size?.height || 200) / 2
          };
        }
        break;
      case 'image':
        item = images.find(i => i.id === itemId);
        if (item) {
          return {
            x: item.position.x + (item.size?.width || 300) / 2,
            y: item.position.y + (item.size?.height || 200) / 2
          };
        }
        break;
      default:
        return null;
    }
    return null;
  };

  const shouldDeleteOnDrop = useCallback((e) => {
    if (!trashRef.current || !e) return false;
    const rect = trashRef.current.getBoundingClientRect();
    const { clientX, clientY } = e;
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  }, []);

  return (
    <div className="relative w-full h-full">
 {/* Zoom Controls – melted into header */}
<div
  className="
    fixed
    top-14
    left-1/2
    -translate-x-1/2
    z-40

    flex items-center gap-1
    px-3 py-0.5

    bg-card/95 backdrop-blur-md
    border border-border border-t-0

    rounded-b-xl
    shadow-[0_8px_20px_-10px_rgba(0,0,0,0.35)]
  "
>
  <Button
    variant="ghost"
    size="icon"
    className="h-6 w-6"
    onClick={() => handleZoom(-0.1)}
    disabled={zoom <= 0.5}
  >
    <ZoomOut className="h-3.5 w-3.5" />
  </Button>

  <span className="text-[11px] font-medium w-10 text-center">
    {Math.round(zoom * 100)}%
  </span>

  <Button
    variant="ghost"
    size="icon"
    className="h-6 w-6"
    onClick={() => handleZoom(0.1)}
    disabled={zoom >= 2.5}
  >
    <ZoomIn className="h-3.5 w-3.5" />
  </Button>

  <Button
    variant="ghost"
    size="icon"
    className="h-6 w-6"
    onClick={() => setZoom(1)}
    disabled={zoom === 1}
  >
    <RotateCcw className="h-3 w-3" />
  </Button>
</div>


      {/* File Limit Badge */}
      {!isPremium && (
        <div className="absolute top-1 right-2 z-20">
          <Badge variant="outline" className="bg-card/80 backdrop-blur-sm">
            {totalNoteCount}/100 notes
          </Badge>
        </div>
      )}

      {/* Trash zone for drag-to-delete */}
      <div
        ref={trashRef}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive shadow-lg backdrop-blur-md"
      >
        <Trash2 className="h-6 w-6" />
      </div>

      {/* Drag overlay */}
        {isDraggingOver && (
        <div className="absolute inset-0 z-30 bg-primary/10 border-4 border-dashed border-primary rounded-lg flex items-center justify-center pointer-events-none">
          <div className="bg-card/90 backdrop-blur-sm rounded-lg px-6 py-4 text-center">
            <p className="text-lg font-medium">Drop image here</p>
            <p className="text-sm text-muted-foreground">Image will be placed at drop location</p>
          </div>
        </div>
      )}

      <div 
        ref={containerRef}
        className="w-full h-full overflow-auto"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div 
          ref={canvasRef}
          className="relative bg-gradient-to-br from-background via-primary/5 to-accent/5"
          data-anotequest-canvas-board
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--border)) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        >
          {/* Drawing Canvas Layer */}
          <DrawingCanvas 
            canvasSize={canvasSize}
            drawings={drawings}
            setDrawings={setDrawings}
            isActive={isDrawingMode}
            onClose={onCloseDrawing}
            zoom={zoom}
            scrollContainerRef={containerRef}
          />

          {/* Empty State */}
          {notes.length === 0 && stickers.length === 0 && images.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-4 animate-fadeIn">
                <div className="text-6xl">📝</div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground/80">Your canvas awaits!</h3>
                  <p className="text-muted-foreground">Click + to add notes, or drag images here</p>
                </div>
              </div>
            </div>
          )}

          {/* Render Notes */}
          {notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              updateNote={updateNote}
              deleteNote={deleteNote}
              addNote={addNote}
              folders={folders}
              zoom={zoom}
              shouldDeleteOnDrop={shouldDeleteOnDrop}
            />
          ))}

          {/* Render Stickers */}
          {stickers.map((sticker) => (
            <StickerItem
              key={sticker.id}
              sticker={sticker}
              updateSticker={updateSticker}
              deleteSticker={deleteSticker}
              zoom={zoom}
              shouldDeleteOnDrop={shouldDeleteOnDrop}
            />
          ))}

          {/* Render Images */}
          {images.map((image) => (
            <ImageItem
              key={image.id}
              image={image}
              updateImage={updateImage}
              deleteImage={deleteImage}
              zoom={zoom}
              shouldDeleteOnDrop={shouldDeleteOnDrop}
            />
          ))}

          {/* Render Tables */}
          {tables.map((table) => (
            <TableItem
              key={table.id}
              table={table}
              updateTable={updateTable}
              deleteTable={deleteTable}
              zoom={zoom}
              shouldDeleteOnDrop={shouldDeleteOnDrop}
            />
          ))}

          {/* Render Todos */}
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              updateTodo={updateTodo}
              deleteTodo={deleteTodo}
              zoom={zoom}
              shouldDeleteOnDrop={shouldDeleteOnDrop}
            />
          ))}

          {/* Render Note Stickers (highest layer) */}
          {noteStickers.map((sticker) => (
            <NoteSticker
              key={sticker.id}
              sticker={sticker}
              updateNoteSticker={updateNoteSticker}
              deleteNoteSticker={deleteNoteSticker}
              zoom={zoom}
              shouldDeleteOnDrop={shouldDeleteOnDrop}
            />
          ))}


          {/* Render Roaming Characters */}
          {characters.map(character => (
            <CharacterRoamer
              key={character.id}
              character={character}
              updateCharacter={updateCharacter}
              canvasRef={canvasRef}
              userName={userName}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Canvas;
