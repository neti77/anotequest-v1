import React, { useState, useRef, useCallback, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Trash2, GripVertical, FolderOpen, Palette, Check, Image as ImageIcon, X, Maximize2, Link2, Expand, Copy, Bold, Italic, Search, Type } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
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

// Image compression utility
const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export const NoteCard = React.memo(({ 
  note, 
  updateNote, 
  deleteNote, 
  addNote,
  folders, 
  onItemClick,
  isConnecting,
  isSelected,
  zoom = 1,
  shouldDeleteOnDrop,
  onNoteClick,
  openReaderMode,
  onReaderModeClosed,
  onMultiDrag,
  selectedCount = 0,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isResizing, setIsResizing] = useState(false);
  const [showReaderMode, setShowReaderMode] = useState(false);
  const [readerContent, setReaderContent] = useState(note.content || '');
  const [readerFont, setReaderFont] = useState('system');
  const [searchTerm, setSearchTerm] = useState('');
  const readerSelectionIndexRef = useRef(0);
  const nodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const readerTextareaRef = useRef(null);
  const isDraggingRef = useRef(false);
  const lastDragPosRef = useRef({ x: 0, y: 0 });

  // Open reader mode when triggered from outside (e.g., ToolStrip)
  useEffect(() => {
    if (openReaderMode) {
      setReaderContent(note.content || '');
      setShowReaderMode(true);
    }
  }, [openReaderMode, note.content]);

  // Notify parent when reader mode closes
  const handleReaderClose = (open) => {
    setShowReaderMode(open);
    if (!open && onReaderModeClosed) {
      onReaderModeClosed();
    }
  };

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
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const startX = clientX;
    const startY = clientY;
    const startWidth = noteSize.width;
    const startHeight = noteSize.height;

    const handleMove = (moveEvent) => {
      const moveClientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const moveClientY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
      
      const deltaX = (moveClientX - startX) / zoom;
      const deltaY = (moveClientY - startY) / zoom;
      
      const newWidth = Math.max(250, startWidth + deltaX);
      const newHeight = Math.max(200, startHeight + deltaY);
      
      updateNote(note.id, {
        size: { width: newWidth, height: newHeight }
      });
    };

    const handleEnd = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  }, [note.id, noteSize, updateNote, zoom]);

  const handleSave = () => {
    // Kept for compatibility, but edits are now auto-saved as you type
    updateNote(note.id, { title, content });
    setIsEditing(false);
    toast.success('Note saved!');
  };

  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const handleReaderOpen = () => {
    setReaderContent(content || '');
    setSearchTerm('');
    readerSelectionIndexRef.current = 0;
    setShowReaderMode(true);
  };

  const handleReaderSave = () => {
    updateNote(note.id, { content: readerContent });
    setContent(readerContent);
    toast.success('Note updated');
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(readerContent || '');
      toast.success('Note text copied');
    } catch (err) {
      console.error('Copy failed', err);
      toast.error('Unable to copy text');
    }
  };

  const handleSearchNext = () => {
    if (!searchTerm.trim() || !readerTextareaRef.current) return;

    const text = readerContent || '';
    const term = searchTerm.toLowerCase();

    // Start searching after the current selection index
    let startIndex = readerSelectionIndexRef.current;
    if (startIndex >= text.length) startIndex = 0;

    const idx = text.toLowerCase().indexOf(term, startIndex);
    if (idx === -1) {
      // Wrap around
      const wrapIdx = text.toLowerCase().indexOf(term, 0);
      if (wrapIdx === -1) return;
      readerSelectionIndexRef.current = wrapIdx + term.length;
      readerTextareaRef.current.focus();
      readerTextareaRef.current.setSelectionRange(wrapIdx, wrapIdx + term.length);
      return;
    }

    readerSelectionIndexRef.current = idx + term.length;
    readerTextareaRef.current.focus();
    readerTextareaRef.current.setSelectionRange(idx, idx + term.length);
  };

  const applyInlineFormat = (marker) => {
    if (!readerTextareaRef.current) return;
    const textarea = readerTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === null || end === null || start === end) return;

    const text = readerContent || '';

    const before = text.slice(0, start);
    const selected = text.slice(start, end);
    const after = text.slice(end);

    const hasPrefix = before.endsWith(marker);
    const hasSuffix = after.startsWith(marker);

    let newText;
    let newStart = start;
    let newEnd = end;

    if (hasPrefix && hasSuffix) {
      // Remove existing markers (toggle off)
      newText =
        before.slice(0, before.length - marker.length) +
        selected +
        after.slice(marker.length);
      newStart = start - marker.length;
      newEnd = end - marker.length;
    } else {
      // Add markers around selection (toggle on)
      newText = before + marker + selected + marker + after;
      newStart = start + marker.length;
      newEnd = end + marker.length;
    }

    setReaderContent(newText);

    // Restore selection after React updates value
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newStart, newEnd);
      readerSelectionIndexRef.current = newEnd;
    });
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

  const handleDuplicate = () => {
    if (!addNote) return;
    const basePosition = note.position || { x: 200, y: 160 };

    addNote({
      title: note.title || 'New Note',
      content: note.content,
      size: note.size,
      color: note.color,
      images: [...(note.images || [])],
      position: {
        x: basePosition.x + 40,
        y: basePosition.y + 40,
      },
      folderId: note.folderId,
    });
    toast.success('Note duplicated');
  };

  const handleRemoveImage = (imageId) => {
    updateNote(note.id, {
      images: note.images.filter(img => img.id !== imageId)
    });
    toast.success('Image removed');
  };

  const handleImageUploadLocal = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    try {
      toast.info('Compressing image...');
      const compressedImage = await compressImage(file, 800, 800, 0.7);
      
      if (compressedImage.length > 500000) {
        const furtherCompressed = await compressImage(file, 600, 600, 0.5);
        const newImage = { id: Date.now(), data: furtherCompressed };
        updateNote(note.id, {
          images: [...(note.images || []), newImage]
        });
      } else {
        const newImage = { id: Date.now(), data: compressedImage };
        updateNote(note.id, {
          images: [...(note.images || []), newImage]
        });
      }
      
      toast.success('Image added!');
    } catch (error) {
      console.error('Image compression error:', error);
      toast.error('Failed to add image.');
    }
  };

  const handleConnectionClick = (e) => {
    if (isConnecting) {
      e.stopPropagation();
      onItemClick?.();
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <>
      <Draggable
        nodeRef={nodeRef}
        position={note.position}
        handle=".drag-handle"
        scale={zoom}
        disabled={isResizing || isConnecting}
        cancel="input, textarea, button, [data-no-drag]"
        onStart={(e, data) => {
          isDraggingRef.current = false;
          lastDragPosRef.current = { x: data.x, y: data.y };
        }}
        onDrag={(e, data) => {
          isDraggingRef.current = true;
          // Multi-drag: move other selected items by the same delta
          if (isSelected && selectedCount > 1 && onMultiDrag) {
            const deltaX = data.x - lastDragPosRef.current.x;
            const deltaY = data.y - lastDragPosRef.current.y;
            onMultiDrag(deltaX, deltaY);
          }
          lastDragPosRef.current = { x: data.x, y: data.y };
        }}
        onStop={(e, data) => {
          if (shouldDeleteOnDrop && shouldDeleteOnDrop(e)) {
            deleteNote(note.id);
          } else {
            updateNote(note.id, {
              position: { x: data.x, y: data.y },
            });
          }
          // Reset after a short delay to allow click to check
          setTimeout(() => { isDraggingRef.current = false; }, 50);
        }}
      >

        <div
          ref={nodeRef}
          className="absolute"
          style={{ width: `${noteSize.width}px`, zIndex: 10 }}
        >
          {/* Connection Bump - REMOVED, now using toolbar link tool */}

          <Card 
            className={`note-card group shadow-md ${colorScheme.bg} ${colorScheme.border} border-2 overflow-hidden relative ${isConnecting ? 'cursor-pointer hover:ring-2 hover:ring-primary' : ''} ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            style={{ height: `${noteSize.height}px`, display: 'flex', flexDirection: 'column' }}
            onClick={(e) => {
              handleConnectionClick(e);
              if (!isDraggingRef.current) {
                onNoteClick?.(note);
              }
            }}
          >
            {/* Header */}
            <div className="drag-handle px-4 py-3 bg-card/50 backdrop-blur-sm flex items-center gap-2 cursor-grab active:cursor-grabbing border-b border-border flex-shrink-0">
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {isEditing ? (
                <Input
                  value={title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setTitle(newTitle);
                    updateNote(note.id, { title: newTitle });
                  }}
                  className="h-7 text-sm font-semibold flex-1"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <h3 className="font-semibold text-sm truncate flex-1">{title}</h3>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUploadLocal}
              />
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
                    onChange={(e) => {
                      const newContent = e.target.value;
                      setContent(newContent);
                      updateNote(note.id, { content: newContent });
                    }}
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

            {/* Footer (also draggable area) */}
            <div className="drag-handle px-4 py-2 bg-card/30 backdrop-blur-sm flex items-center justify-between text-xs text-muted-foreground border-t border-border flex-shrink-0 cursor-grab active:cursor-grabbing">
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

            {/* Resize Handle (subtle) */}
            <div
              data-no-drag
              className="absolute bottom-1 right-1 w-4 h-4 cursor-nwse-resize opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center touch-none"
              onMouseDown={handleResizeStart}
              onTouchStart={handleResizeStart}
              style={{
                borderRadius: '6px',
                zIndex: 100,
              }}
            >
              <Maximize2 className="h-3 w-3 text-primary/50" />
            </div>
          </Card>
        </div>
      </Draggable>

      {/* Reader Mode Dialog */}
      <Dialog open={showReaderMode} onOpenChange={handleReaderClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex gap-4">
            {/* Tools sidebar – docked on the left in doc view */}
            <div className="w-56 flex-shrink-0 border-r pr-4 flex flex-col gap-4 text-xs">
              {/* Text style */}
              <div>
                <div className="font-semibold mb-2 flex items-center gap-2 text-sm">
                  <Type className="h-4 w-4" />
                  Text style
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Button
                    size="sm"
                    variant={readerFont === 'system' ? 'default' : 'outline'}
                    className="h-7 px-2 text-xs"
                    onClick={() => setReaderFont('system')}
                  >
                    Sans
                  </Button>
                  <Button
                    size="sm"
                    variant={readerFont === 'serif' ? 'default' : 'outline'}
                    className="h-7 px-2 text-xs"
                    onClick={() => setReaderFont('serif')}
                  >
                    Serif
                  </Button>
                  <Button
                    size="sm"
                    variant={readerFont === 'mono' ? 'default' : 'outline'}
                    className="h-7 px-2 text-xs"
                    onClick={() => setReaderFont('mono')}
                  >
                    Mono
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-9 px-0 flex items-center justify-center"
                    onClick={() => applyInlineFormat('**')}
                    title="Bold selection"
                  >
                    <Bold className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-9 px-0 flex items-center justify-center"
                    onClick={() => applyInlineFormat('*')}
                    title="Italic selection"
                  >
                    <Italic className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div>
                <div className="font-semibold mb-1 flex items-center gap-2 text-sm">
                  <Search className="h-4 w-4" />
                  Search
                </div>
                <div className="flex gap-2 mb-1">
                  <Input
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      readerSelectionIndexRef.current = 0;
                    }}
                    placeholder="Find in note..."
                    className="h-7 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={handleSearchNext}
                  >
                    Next
                  </Button>
                </div>
                {searchTerm && (
                  <p className="text-[11px] text-muted-foreground">
                    {(() => {
                      const regex = new RegExp(escapeRegExp(searchTerm), 'gi');
                      const matches = readerContent.match(regex);
                      const count = matches ? matches.length : 0;
                      return count === 1 ? '1 match' : `${count} matches`;
                    })()}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div>
                <div className="font-semibold mb-1 flex items-center gap-2 text-sm">
                  <Copy className="h-4 w-4" />
                  Actions
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 justify-start text-xs"
                    onClick={handleCopyAll}
                  >
                    Copy all text
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 justify-start text-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-3 w-3 mr-1" />
                    Add image
                  </Button>
                </div>
              </div>
            </div>

            {/* Main document area */}
            <div className="flex-1 overflow-y-auto pl-2">
              {/* Images in reader mode */}
              {note.images && note.images.length > 0 && (
                <div className="space-y-4 mb-4">
                  {note.images.map(image => (
                    <img 
                      key={image.id}
                      src={image.data} 
                      alt="Note attachment" 
                      className="w-full rounded-md border border-border"
                    />
                  ))}
                </div>
              )}

              {/* Editable content in reader mode */}
              <Textarea
                ref={readerTextareaRef}
                value={readerContent}
                onChange={(e) => {
                  setReaderContent(e.target.value);
                  readerSelectionIndexRef.current = e.target.selectionEnd || 0;
                }}
                placeholder="Start writing your note..."
                className="min-h-[260px] h-full resize-none text-base leading-relaxed"
                style={{
                  fontFamily:
                    readerFont === 'serif'
                      ? 'Georgia, Cambria, "Times New Roman", Times, serif'
                      : readerFont === 'mono'
                      ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                      : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                }}
              />
            </div>
          </div>

          <div className="pt-4 mt-2 border-t flex items-center justify-between text-sm text-muted-foreground">
            <span>{readerContent.trim().split(/\s+/).filter(w => w.length > 0).length} words</span>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Created: {new Date(note.createdAt).toLocaleDateString()}</span>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleReaderSave}>
                Save changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

NoteCard.displayName = 'NoteCard';
export default NoteCard;
