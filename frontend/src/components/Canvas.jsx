import React, { useRef, useState, useEffect } from 'react';
import { Plus, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import NoteCard from './NoteCard';
import StickerItem from './StickerItem';
import CharacterRoamer from './CharacterRoamer';
import StickerToolbar from './StickerToolbar';
import { toast } from 'sonner';

export const Canvas = ({ 
  notes, 
  stickers,
  characters,
  addNote, 
  updateNote, 
  deleteNote,
  addSticker,
  updateSticker,
  deleteSticker,
  updateCharacter,
  folders,
  isPremium
}) => {
  const canvasRef = useRef(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [drawPreview, setDrawPreview] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 3000, height: 2000 });
  const fileInputRef = useRef(null);

  // Calculate canvas size based on content
  useEffect(() => {
    const padding = 500;
    let maxX = 1500;
    let maxY = 1000;

    // Check all notes
    notes.forEach(note => {
      const noteRight = note.position.x + (note.size?.width || 320);
      const noteBottom = note.position.y + (note.size?.height || 200);
      maxX = Math.max(maxX, noteRight);
      maxY = Math.max(maxY, noteBottom);
    });

    // Check all stickers
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

  const handleCanvasMouseDown = (e) => {
    const canvasArea = e.target.closest('.canvas-area');
    if ((e.target === canvasRef.current || canvasArea) && selectedTool && selectedTool !== 'note') {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + canvasRef.current.scrollLeft;
      const y = e.clientY - rect.top + canvasRef.current.scrollTop;
      
      setIsDrawing(true);
      setDrawStart({ x, y });
      setDrawPreview({ x, y, width: 0, height: 0 });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || !drawStart || !selectedTool) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left + canvasRef.current.scrollLeft;
    const currentY = e.clientY - rect.top + canvasRef.current.scrollTop;
    
    const width = currentX - drawStart.x;
    const height = currentY - drawStart.y;
    
    setDrawPreview({
      x: drawStart.x,
      y: drawStart.y,
      width,
      height
    });
  };

  const handleCanvasMouseUp = (e) => {
    if (!isDrawing || !drawStart || !selectedTool) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const endX = e.clientX - rect.left + canvasRef.current.scrollLeft;
    const endY = e.clientY - rect.top + canvasRef.current.scrollTop;
    
    const width = endX - drawStart.x;
    const height = endY - drawStart.y;
    
    // Minimum size threshold
    if (Math.abs(width) > 20 || Math.abs(height) > 20) {
      addSticker({
        type: selectedTool,
        position: { x: drawStart.x, y: drawStart.y },
        size: { width: Math.abs(width), height: Math.abs(height) },
        rotation: 0
      });
      toast.success('Sticker added!');
    }
    
    setIsDrawing(false);
    setDrawStart(null);
    setDrawPreview(null);
    setSelectedTool(null);
  };

  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current || e.target.closest('.canvas-area')) {
      if (selectedTool === 'note') {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + canvasRef.current.scrollLeft;
        const y = e.clientY - rect.top + canvasRef.current.scrollTop;
        handleAddNote({ x, y });
        setSelectedTool(null);
      }
    }
  };

  const handleAddNote = (position = null) => {
    const pos = position || { 
      x: Math.random() * 500 + 100, 
      y: Math.random() * 300 + 100 
    };
    
    const result = addNote({
      title: 'New Note',
      content: '',
      color: 'default',
      position: pos
    });
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Note created! Start writing to gain XP');
    }
  };

  const handleImageUpload = (e, noteId) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;
      if (noteId) {
        // Add to specific note
        const note = notes.find(n => n.id === noteId);
        updateNote(noteId, {
          images: [...(note.images || []), { id: Date.now(), data: imageData }]
        });
      } else {
        // Create new note with image
        addNote({
          title: 'Image Note',
          content: '',
          color: 'default',
          position: { x: 100, y: 100 },
          images: [{ id: Date.now(), data: imageData }]
        });
      }
      toast.success('Image added!');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative w-full h-full">
      {/* Toolbar */}
      <StickerToolbar 
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        onAddImage={() => fileInputRef.current?.click()}
      />

      {/* File Limit Badge */}
      {!isPremium && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="outline" className="bg-card/80 backdrop-blur-sm">
            {notes.length}/100 notes
          </Badge>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImageUpload(e, null)}
      />

      <div 
        ref={canvasRef}
        className={`w-full h-full overflow-auto relative bg-gradient-to-br from-background via-primary/5 to-accent/5 ${selectedTool ? 'cursor-crosshair' : ''}`}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        style={{
          backgroundImage: `
            radial-gradient(circle at 2px 2px, hsl(var(--border)) 1px, transparent 0)
          `,
          backgroundSize: '32px 32px'
        }}
      >
        {/* Expanding canvas container */}
        <div 
          className="canvas-area relative min-w-full min-h-full"
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`
          }}
        >
        {/* Floating Add Button */}
        <Button
          onClick={() => handleAddNote()}
          size="lg"
          className="fixed bottom-8 right-8 rounded-full w-14 h-14 shadow-glow hover:scale-110 transition-transform z-10 bg-gradient-to-br from-primary to-accent md:bottom-8 md:right-8 bottom-4 right-4"
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* Drawing Preview */}
        {isDrawing && drawPreview && selectedTool && (
          <div
            className="absolute pointer-events-none border-2 border-primary border-dashed bg-primary/10 rounded"
            style={{
              left: drawPreview.x,
              top: drawPreview.y,
              width: Math.abs(drawPreview.width),
              height: Math.abs(drawPreview.height),
              transform: `translate(${drawPreview.width < 0 ? drawPreview.width : 0}px, ${drawPreview.height < 0 ? drawPreview.height : 0}px)`
            }}
          />
        )}

        {/* Empty State */}
        {notes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center animate-slideInUp pointer-events-auto">
              <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center animate-float shadow-lg">
                <Plus className="h-16 w-16 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-3 gradient-text">Welcome to AnoteQuest!</h2>
              <p className="text-muted-foreground mb-8 text-lg">Click the + button to create your first note and start your journey</p>
              <div className="flex gap-6 justify-center text-sm">
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
                  <div className="w-3 h-3 rounded-full bg-success"></div>
                  <span className="font-medium">Drag notes anywhere</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
                  <div className="w-3 h-3 rounded-full bg-warning"></div>
                  <span className="font-medium">Battle for rewards</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
                  <div className="w-3 h-3 rounded-full bg-destructive"></div>
                  <span className="font-medium">Unlock characters</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Render Stickers (behind notes) */}
        {console.log('Rendering stickers:', stickers.length)}
        {stickers.map((sticker, index) => {
          console.log('Rendering sticker', index, sticker);
          return (
            <StickerItem
              key={sticker.id}
              sticker={sticker}
              updateSticker={updateSticker}
              deleteSticker={deleteSticker}
            />
          );
        })}

        {/* Render Notes */}
        {notes.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            updateNote={updateNote}
            deleteNote={deleteNote}
            folders={folders}
            onImageUpload={(e) => handleImageUpload(e, note.id)}
          />
        ))}

        {/* Render Roaming Characters */}
        {characters.map(character => (
          <CharacterRoamer
            key={character.id}
            character={character}
            updateCharacter={updateCharacter}
            canvasRef={canvasRef}
          />
        ))}
        </div>
      </div>
    </div>
  );
};

export default Canvas;