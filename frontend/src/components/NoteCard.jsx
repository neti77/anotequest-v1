import React, { useState, useRef, useEffect, useCallback } from 'react';
import Draggable from 'react-draggable';
import { Trash2, GripVertical, FolderOpen, Palette, Check, Image as ImageIcon, X, Maximize2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { toast } from 'sonner';

const NOTE_COLORS = [
  { name: 'default', bg: 'bg-card', border: 'border-border' },
  { name: 'pink', bg: 'bg-secondary/30', border: 'border-secondary' },
  { name: 'lavender', bg: 'bg-accent/30', border: 'border-accent' },
  { name: 'mint', bg: 'bg-primary/30', border: 'border-primary' },
  { name: 'peach', bg: 'bg-muted/50', border: 'border-muted-foreground' },
];

export const NoteCard = React.memo(({ note, updateNote, deleteNote, folders, onImageUpload }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isResizing, setIsResizing] = useState(false);
  const nodeRef = useRef(null);
  const fileInputRef = useRef(null);

  const colorScheme = NOTE_COLORS.find(c => c.name === note.color) || NOTE_COLORS[0];
  const noteSize = note.size || { width: 320, height: 280 };

  const handleDragStop = (e, data) => {
    updateNote(note.id, {
      position: { x: data.x, y: data.y }
    });
  };

  const handleResizeStart = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = noteSize.width;
    const startHeight = noteSize.height;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      const newWidth = Math.max(250, startWidth + deltaX);
      const newHeight = Math.max(200, startHeight + deltaY);
      
      updateNote(note.id, {
        size: { width: newWidth, height: newHeight }
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [note.id, noteSize, updateNote]);

  const handleSave = () => {
    updateNote(note.id, { title, content });
    setIsEditing(false);
    toast.success('Note saved!');
  };

  const handleDelete = () => {
    deleteNote(note.id);
    toast.success('Note deleted');
  };

  const handleColorChange = (colorName) => {
    updateNote(note.id, { color: colorName });
    toast.success('Color updated!');
  };

  const handleFolderChange = (folderId) => {
    updateNote(note.id, { folderId });
    toast.success('Moved to folder!');
  };

  const handleRemoveImage = (imageId) => {
    updateNote(note.id, {
      images: note.images.filter(img => img.id !== imageId)
    });
    toast.success('Image removed');
  };

  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".drag-handle"
      position={note.position}
      onStop={handleDragStop}
      bounds="parent"
      disabled={isResizing}
    >
      <div
        ref={nodeRef}
        className="absolute"
        style={{ width: `${noteSize.width}px` }}
      >
        <Card 
          className={`note-card group shadow-md ${colorScheme.bg} ${colorScheme.border} border-2 overflow-hidden relative`}
          style={{ height: `${noteSize.height}px`, display: 'flex', flexDirection: 'column' }}
        >
          {/* Header */}
          <div className="drag-handle px-4 py-3 bg-card/50 backdrop-blur-sm flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {isEditing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-7 text-sm font-semibold"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <h3 className="font-semibold text-sm truncate">{title}</h3>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Image Upload */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onImageUpload}
              />

              {/* Color Picker */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Palette className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                  {NOTE_COLORS.map(color => (
                    <DropdownMenuItem
                      key={color.name}
                      onClick={() => handleColorChange(color.name)}
                      className="flex items-center gap-2"
                    >
                      <div className={`w-4 h-4 rounded ${color.bg} ${color.border} border-2`}></div>
                      <span className="capitalize">{color.name}</span>
                      {note.color === color.name && <Check className="h-4 w-4 ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Folder Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => handleFolderChange(null)}>
                    <span>No Folder</span>
                    {!note.folderId && <Check className="h-4 w-4 ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {folders.map(folder => (
                    <DropdownMenuItem
                      key={folder.id}
                      onClick={() => handleFolderChange(folder.id)}
                    >
                      <span>{folder.name}</span>
                      {note.folderId === folder.id && <Check className="h-4 w-4 ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            {/* Images */}
            {note.images && note.images.length > 0 && (
              <div className="p-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                {note.images.map(image => (
                  <div key={image.id} className="relative group/image">
                    <img 
                      src={image.data} 
                      alt="Note attachment" 
                      className="w-full rounded border border-border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover/image:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(image.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="p-4" onClick={(e) => e.stopPropagation()}>
              {isEditing ? (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your note..."
                  className="min-h-[100px] resize-none"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div
                  className="min-h-[100px] text-sm whitespace-pre-wrap cursor-text"
                  onClick={() => setIsEditing(true)}
                >
                  {content || <span className="text-muted-foreground italic">Click to start writing...</span>}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-card/30 backdrop-blur-sm flex items-center justify-between text-xs text-muted-foreground border-t border-border flex-shrink-0">
            <span>{wordCount} words</span>
            {isEditing && (
              <Button
                size="sm"
                onClick={handleSave}
                className="h-7 text-xs"
              >
                Save
              </Button>
            )}
          </div>

          {/* Resize Handle */}
          <div
            className="absolute bottom-1 right-1 w-6 h-6 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            onMouseDown={handleResizeStart}
            style={{ 
              background: 'hsl(var(--primary))',
              borderRadius: '0 0 4px 0'
            }}
          >
            <Maximize2 className="h-4 w-4 text-primary-foreground" />
          </div>
        </Card>
      </div>
    </Draggable>
  );
});

export default NoteCard;