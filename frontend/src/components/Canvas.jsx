import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import NoteCard from './NoteCard';
import StickerItem from './StickerItem';
import ImageItem from './ImageItem';
import TableItem from './TableItem';
import TodoItem from './TodoItem';
import CharacterRoamer from './CharacterRoamer';
import DrawingCanvas from './DrawingCanvas';
import ConnectionLine from './ConnectionLine';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

export const Canvas = ({ 
  notes, 
  totalNoteCount,
  stickers,
  images = [],
  tables = [],
  todos = [],
  characters,
  connections = [],
  addNote, 
  updateNote, 
  deleteNote,
  addSticker,
  updateSticker,
  deleteSticker,
  addImage,
  updateImage,
  deleteImage,
  updateTable,
  deleteTable,
  updateTodo,
  deleteTodo,
  addConnection,
  deleteConnection,
  updateCharacter,
  folders,
  isPremium,
  isDrawingMode,
  onCloseDrawing,
  userName,
  activeFolder,
  isLinkMode,
  connectingFrom,
  setConnectingFrom
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 3000, height: 2000 });
  const [drawings, setDrawings] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

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

  // Calculate canvas size based on content
  useEffect(() => {
    const padding = 500;
    let maxX = 1500;
    let maxY = 1000;

    notes.forEach(note => {
      const noteRight = note.position.x + (note.size?.width || 320);
      const noteBottom = note.position.y + (note.size?.height || 200);
      maxX = Math.max(maxX, noteRight);
      maxY = Math.max(maxY, noteBottom);
    });

    stickers.forEach(sticker => {
      const stickerRight = sticker.position.x + (sticker.size?.width || 100);
      const stickerBottom = sticker.position.y + (sticker.size?.height || 100);
      maxX = Math.max(maxX, stickerRight);
      maxY = Math.max(maxY, stickerBottom);
    });

    setCanvasSize({
      width: Math.max(3000, maxX + padding),
      height: Math.max(2000, maxY + padding)
    });
  }, [notes, stickers]);

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

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Drag and drop image handling
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
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

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type.startsWith('image/'));
    
    if (!imageFile) {
      toast.error('Please drop an image file');
      return;
    }

    // Get drop position relative to canvas
    const rect = canvasRef.current.getBoundingClientRect();
    const scrollLeft = canvasRef.current.scrollLeft;
    const scrollTop = canvasRef.current.scrollTop;
    const x = (e.clientX - rect.left + scrollLeft) / zoom;
    const y = (e.clientY - rect.top + scrollTop) / zoom;

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

  // Connection handling - now controlled by isLinkMode from parent
  const handleItemClick = (itemId, itemType) => {
    if (!isLinkMode) return;
    
    if (!connectingFrom) {
      setConnectingFrom({ id: itemId, type: itemType });
      toast.info('Now click another item to connect');
    } else if (connectingFrom.id !== itemId) {
      addConnection({
        from: connectingFrom,
        to: { id: itemId, type: itemType }
      });
      setConnectingFrom(null);
      toast.success('Items connected!');
    }
  };

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

  return (
    <div className="relative w-full h-full">
      {/* Zoom Controls */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-card/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg border border-border">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => handleZoom(-0.1)}
          disabled={zoom <= 0.5}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => handleZoom(0.1)}
          disabled={zoom >= 2.5}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setZoom(1)}
          disabled={zoom === 1}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>

      {/* File Limit Badge */}
      {!isPremium && (
        <div className="absolute top-4 right-4 z-20">
          <Badge variant="outline" className="bg-card/80 backdrop-blur-sm">
            {totalNoteCount}/100 notes
          </Badge>
        </div>
      )}

      {/* Drag overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-30 bg-primary/10 border-4 border-dashed border-primary rounded-lg flex items-center justify-center pointer-events-none">
          <div className="bg-card/90 backdrop-blur-sm rounded-xl px-6 py-4 text-center">
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
          />

          {/* Connection Lines */}
          {connections.map((conn, idx) => {
            const fromPos = getItemPosition(conn.from.id, conn.from.type);
            const toPos = getItemPosition(conn.to.id, conn.to.type);
            if (fromPos && toPos) {
              return (
                <ConnectionLine
                  key={idx}
                  from={fromPos}
                  to={toPos}
                  onDelete={() => deleteConnection && deleteConnection(idx)}
                />
              );
            }
            return null;
          })}

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
              folders={folders}
              onStartConnection={() => handleStartConnection(note.id, 'note')}
              onEndConnection={() => handleEndConnection(note.id, 'note')}
              isConnecting={connectingFrom !== null}
              zoom={zoom}
            />
          ))}

          {/* Render Stickers */}
          {stickers.map((sticker) => (
            <StickerItem
              key={sticker.id}
              sticker={sticker}
              updateSticker={updateSticker}
              deleteSticker={deleteSticker}
            />
          ))}

          {/* Render Images */}
          {images.map((image) => (
            <ImageItem
              key={image.id}
              image={image}
              updateImage={updateImage}
              deleteImage={deleteImage}
              onStartConnection={() => handleStartConnection(image.id, 'image')}
              onEndConnection={() => handleEndConnection(image.id, 'image')}
              isConnecting={connectingFrom !== null}
            />
          ))}

          {/* Render Tables */}
          {tables.map((table) => (
            <TableItem
              key={table.id}
              table={table}
              updateTable={updateTable}
              deleteTable={deleteTable}
            />
          ))}

          {/* Render Todos */}
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              updateTodo={updateTodo}
              deleteTodo={deleteTodo}
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
