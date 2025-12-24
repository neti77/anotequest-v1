import React, { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from './ui/button';
import NoteCard from './NoteCard';
import { toast } from 'sonner';

export const Canvas = ({ notes, addNote, updateNote, deleteNote, folders }) => {
  const canvasRef = useRef(null);
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNotePosition, setNewNotePosition] = useState({ x: 100, y: 100 });

  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + canvasRef.current.scrollLeft;
      const y = e.clientY - rect.top + canvasRef.current.scrollTop;
      setNewNotePosition({ x, y });
      setShowNewNote(true);
    }
  };

  const handleAddNote = () => {
    // Find a random position on canvas
    const x = Math.random() * 500 + 100;
    const y = Math.random() * 300 + 100;
    
    addNote({
      title: 'New Note',
      content: '',
      color: 'default',
      position: { x, y }
    });
    toast.success('Note created! Start writing to gain XP');
  };

  return (
    <div 
      ref={canvasRef}
      className="w-full h-full overflow-auto relative bg-gradient-to-br from-background via-primary/5 to-accent/5"
      onClick={handleCanvasClick}
      style={{
        backgroundImage: `
          radial-gradient(circle at 2px 2px, hsl(var(--border)) 1px, transparent 0)
        `,
        backgroundSize: '32px 32px'
      }}
    >
      {/* Floating Add Button */}
      <Button
        onClick={handleAddNote}
        size="lg"
        className="fixed bottom-8 right-8 rounded-full w-14 h-14 shadow-glow hover:scale-110 transition-transform z-10 bg-gradient-to-br from-primary to-accent"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Empty State */}
      {notes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center animate-slideInUp">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center animate-float">
              <Plus className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2 gradient-text">Start Your Quest!</h2>
            <p className="text-muted-foreground mb-6">Click the + button or anywhere on the canvas to create your first note</p>
            <div className="flex gap-4 justify-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <span>Drag notes anywhere</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning"></div>
                <span>Unlock characters</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive"></div>
                <span>Level up as you write</span>
              </div>
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
        />
      ))}

      {/* Show new note at click position */}
      {showNewNote && (
        <div
          className="absolute"
          style={{ left: newNotePosition.x, top: newNotePosition.y }}
        >
          <div className="animate-slideInUp">
            {/* This would trigger the addNote function */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;