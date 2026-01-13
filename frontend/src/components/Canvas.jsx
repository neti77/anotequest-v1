import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Trash2, MousePointer2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import NoteCard from './NoteCard';
import StickerItem from './StickerItem';
import ImageItem from './ImageItem';
import TableItem from './TableItem';
import TodoItem from './TodoItem';
import SourceItem from './SourceItem';
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
  sources = [],
  drawings,
  setDrawings,
  drawingTool,
  updateSource,
  deleteSource,
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
  // Opens the trash modal in parent
  onOpenTrash,
  onNoteClick,
  readerModeNoteId,
  onReaderModeClosed,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const trashRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1600, height: 1000 });
  const [zoom, setZoom] = useState(1);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Multi-select state
  const [selectedItems, setSelectedItems] = useState([]); // Array of { type, id }
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState(null); // { startX, startY, currentX, currentY }
  const [selectMode, setSelectMode] = useState(false); // Toggle select mode on/off

  // Touch pinch-zoom state (for iPad/phones)
  const pinchState = useRef({
    isPinching: false,
    startDistance: 0,
    startZoom: 1,
  });

  // Drawing persistence is now managed in MainApp via the shared `drawings` prop.

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
    sources.forEach(source => consider(source, 260, 120));

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

  // Touch pinch-to-zoom (mobile/tablet), anchored around finger center
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
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = getDistance(touch1, touch2);
      if (pinchState.current.startDistance === 0) return;

      // Prevent browser/page zoom while pinching inside the canvas
      e.preventDefault();

      const oldZoom = pinchState.current.startZoom || zoom;
      const scaleDelta = dist / pinchState.current.startDistance;
      const nextZoomRaw = oldZoom * scaleDelta;
      const nextZoom = Math.min(2.5, Math.max(0.5, nextZoomRaw));

      const rect = container.getBoundingClientRect();
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      // Position of pinch center in scrolled content BEFORE zoom
      const offsetX = centerX - rect.left + container.scrollLeft;
      const offsetY = centerY - rect.top + container.scrollTop;
      const contentX = offsetX / oldZoom;
      const contentY = offsetY / oldZoom;

      // After zoom, keep the same content point under the pinch center
      const newScrollLeft = contentX * nextZoom - (centerX - rect.left);
      const newScrollTop = contentY * nextZoom - (centerY - rect.top);

      setZoom(nextZoom);
      container.scrollLeft = newScrollLeft;
      container.scrollTop = newScrollTop;

      // Prepare for next incremental step
      pinchState.current.startZoom = nextZoom;
      pinchState.current.startDistance = dist;
    };

    const handleTouchEnd = () => {
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

  // Multi-select box logic
  const getCanvasCoordinates = useCallback((clientX, clientY) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    // rect already accounts for scroll position, just need to account for zoom
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom
    };
  }, [zoom]);

  const handleCanvasMouseDown = useCallback((e) => {
    // Only start selection if in select mode and clicking directly on canvas (not an item)
    if (!selectMode) return;
    if (drawingTool) return; // Don't select while drawing
    
    // Check if clicking on an item - if so, don't start selection box
    const target = e.target;
    if (target !== canvasRef.current && !target.hasAttribute('data-anotequest-canvas-board')) {
      return;
    }

    // Prevent default to stop text selection
    e.preventDefault();

    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    setIsSelecting(true);
    setSelectionBox({
      startX: coords.x,
      startY: coords.y,
      currentX: coords.x,
      currentY: coords.y
    });
    // Clear selection when starting a new box
    setSelectedItems([]);
  }, [selectMode, drawingTool, getCanvasCoordinates]);

  const handleCanvasMouseMove = useCallback((e) => {
    if (!isSelecting || !selectionBox) return;
    
    // Prevent text selection while dragging
    e.preventDefault();
    
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    setSelectionBox(prev => ({
      ...prev,
      currentX: coords.x,
      currentY: coords.y
    }));
  }, [isSelecting, selectionBox, getCanvasCoordinates]);

  const handleCanvasMouseUp = useCallback(() => {
    if (!isSelecting || !selectionBox) {
      setIsSelecting(false);
      setSelectionBox(null);
      return;
    }

    // Calculate selection box bounds
    const minX = Math.min(selectionBox.startX, selectionBox.currentX);
    const maxX = Math.max(selectionBox.startX, selectionBox.currentX);
    const minY = Math.min(selectionBox.startY, selectionBox.currentY);
    const maxY = Math.max(selectionBox.startY, selectionBox.currentY);

    // Check if box is too small (just a click)
    if (maxX - minX < 10 && maxY - minY < 10) {
      setIsSelecting(false);
      setSelectionBox(null);
      return;
    }

    // Find all items that intersect with the selection box
    const newSelectedItems = [];

    const intersects = (item, defaultWidth, defaultHeight) => {
      if (!item?.position) return false;
      const itemX = item.position.x;
      const itemY = item.position.y;
      const itemWidth = item.size?.width || defaultWidth;
      const itemHeight = item.size?.height || defaultHeight;
      
      // Check if rectangles overlap
      return !(itemX + itemWidth < minX || 
               itemX > maxX || 
               itemY + itemHeight < minY || 
               itemY > maxY);
    };

    notes.forEach(note => {
      if (intersects(note, 320, 200)) {
        newSelectedItems.push({ type: 'note', id: note.id });
      }
    });

    stickers.forEach(sticker => {
      if (intersects(sticker, 60, 60)) {
        newSelectedItems.push({ type: 'sticker', id: sticker.id });
      }
    });

    noteStickers.forEach(sticker => {
      if (intersects(sticker, 200, 160)) {
        newSelectedItems.push({ type: 'noteSticker', id: sticker.id });
      }
    });

    images.forEach(image => {
      if (intersects(image, 300, 200)) {
        newSelectedItems.push({ type: 'image', id: image.id });
      }
    });

    tables.forEach(table => {
      if (intersects(table, 400, 200)) {
        newSelectedItems.push({ type: 'table', id: table.id });
      }
    });

    todos.forEach(todo => {
      if (intersects(todo, 280, 200)) {
        newSelectedItems.push({ type: 'todo', id: todo.id });
      }
    });

    sources.forEach(source => {
      if (intersects(source, 260, 120)) {
        newSelectedItems.push({ type: 'source', id: source.id });
      }
    });

    setSelectedItems(newSelectedItems);
    if (newSelectedItems.length > 0) {
      toast.success(`Selected ${newSelectedItems.length} item${newSelectedItems.length > 1 ? 's' : ''}`);
    }

    setIsSelecting(false);
    setSelectionBox(null);
  }, [isSelecting, selectionBox, notes, stickers, noteStickers, images, tables, todos, sources]);

  // Handle moving all selected items together
  const handleMultiDrag = useCallback((deltaX, deltaY, draggedType, draggedId) => {
    if (selectedItems.length <= 1) return;
    
    // Move all selected items except the one being dragged (it moves itself)
    selectedItems.forEach(({ type, id }) => {
      if (type === draggedType && id === draggedId) return; // Skip the dragged item
      
      switch (type) {
        case 'note': {
          const note = notes.find(n => n.id === id);
          if (note) {
            updateNote(id, {
              position: {
                x: note.position.x + deltaX,
                y: note.position.y + deltaY
              }
            });
          }
          break;
        }
        case 'sticker': {
          const sticker = stickers.find(s => s.id === id);
          if (sticker) {
            updateSticker(id, {
              position: {
                x: sticker.position.x + deltaX,
                y: sticker.position.y + deltaY
              }
            });
          }
          break;
        }
        case 'noteSticker': {
          const noteSticker = noteStickers.find(s => s.id === id);
          if (noteSticker) {
            updateNoteSticker(id, {
              position: {
                x: noteSticker.position.x + deltaX,
                y: noteSticker.position.y + deltaY
              }
            });
          }
          break;
        }
        case 'image': {
          const image = images.find(i => i.id === id);
          if (image) {
            updateImage(id, {
              position: {
                x: image.position.x + deltaX,
                y: image.position.y + deltaY
              }
            });
          }
          break;
        }
        case 'table': {
          const table = tables.find(t => t.id === id);
          if (table) {
            updateTable(id, {
              position: {
                x: table.position.x + deltaX,
                y: table.position.y + deltaY
              }
            });
          }
          break;
        }
        case 'todo': {
          const todo = todos.find(t => t.id === id);
          if (todo) {
            updateTodo(id, {
              position: {
                x: todo.position.x + deltaX,
                y: todo.position.y + deltaY
              }
            });
          }
          break;
        }
        case 'source': {
          const source = sources.find(s => s.id === id);
          if (source) {
            updateSource(id, {
              position: {
                x: source.position.x + deltaX,
                y: source.position.y + deltaY
              }
            });
          }
          break;
        }
        default:
          break;
      }
    });
  }, [selectedItems, notes, stickers, noteStickers, images, tables, todos, sources, 
      updateNote, updateSticker, updateNoteSticker, updateImage, updateTable, updateTodo, updateSource]);

  // Clear selection when clicking outside or pressing Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedItems([]);
        setSelectMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check if an item is selected
  const isItemSelected = useCallback((type, id) => {
    return selectedItems.some(item => item.type === type && item.id === id);
  }, [selectedItems]);

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

    let clientX;
    let clientY;

    // Support both mouse and touch end events
    if (typeof TouchEvent !== 'undefined' && e instanceof TouchEvent) {
      const touch = e.changedTouches && e.changedTouches[0];
      if (!touch) return false;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else if ('changedTouches' in e && e.changedTouches && e.changedTouches[0]) {
      // Fallback for generic events from libraries
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    if (clientX == null || clientY == null) return false;

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

  <div className="w-px h-4 bg-border mx-1" />

  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={selectMode ? "default" : "ghost"}
          size="icon"
          className="h-6 w-6"
          onClick={() => {
            setSelectMode(!selectMode);
            if (selectMode) {
              setSelectedItems([]);
            } else {
              toast.info('Click and drag to select items');
            }
          }}
        >
          <MousePointer2 className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{selectMode ? 'Exit select mode (Esc)' : 'Select multiple items'}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
  
  {selectedItems.length > 0 && (
    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
      {selectedItems.length}
    </Badge>
  )}
</div>


      {/* File Limit Badge */}
      {!isPremium && (
        <div className="absolute top-1 right-2 z-20">
          <Badge variant="outline" className="bg-card/80 backdrop-blur-sm">
            {totalNoteCount}/100 notes
          </Badge>
        </div>
      )}

      {/* Trash zone for drag-to-delete and opening trash modal */}
      <div
        ref={trashRef}
        onClick={onOpenTrash}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive shadow-lg backdrop-blur-md cursor-pointer"
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
        className={`w-full h-full overflow-auto ${isSelecting ? 'select-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        <div 
          ref={canvasRef}
          className={`relative bg-gradient-to-br from-background via-primary/5 to-accent/5 ${selectMode ? 'cursor-crosshair select-none' : ''}`}
          data-anotequest-canvas-board
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--border)) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
            userSelect: selectMode ? 'none' : 'auto',
            WebkitUserSelect: selectMode ? 'none' : 'auto',
          }}
          onMouseDown={handleCanvasMouseDown}
        >
          {/* Selection Box Overlay */}
          {isSelecting && selectionBox && (
            <div
              className="absolute border-2 border-primary bg-primary/10 pointer-events-none z-50"
              style={{
                left: Math.min(selectionBox.startX, selectionBox.currentX),
                top: Math.min(selectionBox.startY, selectionBox.currentY),
                width: Math.abs(selectionBox.currentX - selectionBox.startX),
                height: Math.abs(selectionBox.currentY - selectionBox.startY),
              }}
            />
          )}

          {/* Drawing Canvas Layer */}
          <DrawingCanvas 
            canvasSize={canvasSize}
            drawings={drawings}
            setDrawings={setDrawings}
            isActive={isDrawingMode}
            onClose={onCloseDrawing}
            zoom={zoom}
            scrollContainerRef={containerRef}
            drawingTool={drawingTool}
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
              onNoteClick={onNoteClick}
              openReaderMode={readerModeNoteId === note.id}
              onReaderModeClosed={onReaderModeClosed}
              isSelected={isItemSelected('note', note.id)}
              onMultiDrag={(deltaX, deltaY) => handleMultiDrag(deltaX, deltaY, 'note', note.id)}
              selectedCount={selectedItems.length}
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
              isSelected={isItemSelected('sticker', sticker.id)}
              onMultiDrag={(deltaX, deltaY) => handleMultiDrag(deltaX, deltaY, 'sticker', sticker.id)}
              selectedCount={selectedItems.length}
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
              isSelected={isItemSelected('image', image.id)}
              onMultiDrag={(deltaX, deltaY) => handleMultiDrag(deltaX, deltaY, 'image', image.id)}
              selectedCount={selectedItems.length}
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
              isSelected={isItemSelected('table', table.id)}
              onMultiDrag={(deltaX, deltaY) => handleMultiDrag(deltaX, deltaY, 'table', table.id)}
              selectedCount={selectedItems.length}
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
              isSelected={isItemSelected('todo', todo.id)}
              onMultiDrag={(deltaX, deltaY) => handleMultiDrag(deltaX, deltaY, 'todo', todo.id)}
              selectedCount={selectedItems.length}
            />
          ))}

          {/* Render Sources / Links */}
          {sources.map((source) => (
            <SourceItem
              key={source.id}
              source={source}
              updateSource={updateSource}
              deleteSource={deleteSource}
              zoom={zoom}
              shouldDeleteOnDrop={shouldDeleteOnDrop}
              isSelected={isItemSelected('source', source.id)}
              onMultiDrag={(deltaX, deltaY) => handleMultiDrag(deltaX, deltaY, 'source', source.id)}
              selectedCount={selectedItems.length}
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
              isSelected={isItemSelected('noteSticker', sticker.id)}
              onMultiDrag={(deltaX, deltaY) => handleMultiDrag(deltaX, deltaY, 'noteSticker', sticker.id)}
              selectedCount={selectedItems.length}
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
