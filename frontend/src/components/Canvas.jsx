import React, { useRef, useState } from 'react';
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
  const fileInputRef = useRef(null);

  const handleCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current && selectedTool && selectedTool !== 'note') {
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
    if (e.target === canvasRef.current && selectedTool === 'note') {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + canvasRef.current.scrollLeft;
      const y = e.clientY - rect.top + canvasRef.current.scrollTop;
      handleAddNote({ x, y });
      setSelectedTool(null);
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
        {/* Floating Add Button */}
        <Button
          onClick={() => handleAddNote()}
          size="lg"
          className="fixed bottom-8 right-8 rounded-full w-14 h-14 shadow-glow hover:scale-110 transition-transform z-10 bg-gradient-to-br from-primary to-accent"
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
            <div className="text-center animate-slideInUp">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center animate-float">
                <Plus className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2 gradient-text">Start Your Quest!</h2>
              <p className="text-muted-foreground mb-6">Click the + button or use the toolbar to create notes and stickers</p>
              <div className="flex gap-4 justify-center text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  <span>Drag notes & stickers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning"></div>
                  <span>Battle for rewards</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive"></div>
                  <span>Unlock characters</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Render Stickers (behind notes) */}
        {stickers.map(sticker => (
          <StickerItem
            key={sticker.id}
            sticker={sticker}
            updateSticker={updateSticker}
            deleteSticker={deleteSticker}
          />
        ))}

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
  );
};

export default Canvas;