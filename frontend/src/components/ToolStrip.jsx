import React, { useState, useRef } from 'react';
import { 
  StickyNote, 
  Pencil,
  Minus,
  ArrowRight,
  Circle,
  Link2,
  Sticker, 
  Folder, 
  ImagePlus, 
  ChevronLeft,
  ChevronRight,
  Plus,
  FolderPlus,
  Table,
  CheckSquare,
  Trash2,
  Expand,
  Copy,
  Palette,
  FolderOpen,
  Check,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

const STICKER_TYPES = [
  { type: 'arrow-right', icon: '→', label: 'Arrow' },
  { type: 'arrow-down', icon: '↓', label: 'Down' },
  { type: 'circle', icon: '○', label: 'Circle' },
  { type: 'square', icon: '□', label: 'Square' },
  { type: 'star', icon: '☆', label: 'Star' },
  { type: 'heart', icon: '♡', label: 'Heart' },
];

const NOTE_COLORS = [
  { name: 'default', bg: 'bg-card', border: 'border-border' },
  { name: 'pink', bg: 'bg-secondary/30', border: 'border-secondary' },
  { name: 'lavender', bg: 'bg-accent/30', border: 'border-accent' },
  { name: 'mint', bg: 'bg-primary/30', border: 'border-primary' },
  { name: 'peach', bg: 'bg-muted/50', border: 'border-muted-foreground' },
];

const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#eab308', '#8b5cf6', '#f97316',
  '#ec4899', '#14b8a6', '#000000', '#6b7280'
];

export const ToolStrip = ({ 
  onAddNote, 
  drawingTool,
  setDrawingTool,
  addSticker,
  onAddSource,
  addNoteSticker,
  folders,
  notes,
  activeFolder,
  setActiveFolder,
  addFolder,
  deleteFolder,
  onToggleCharacters,
  characterPanelOpen,
  onAddImage,
  onAddTable,
  onAddTodo,
  activeNote,
  onClearActiveNote,
  updateNote,
  deleteNote,
  onOpenReaderMode,
}) => {
  const [expandedTool, setExpandedTool] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [stickerColor, setStickerColor] = useState('#3b82f6');
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const noteImageInputRef = useRef(null);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const fileInputRef = useRef(null);

  const handleToolClick = (tool) => {
    if (expandedTool === tool) {
      setExpandedTool(null);
    } else {
      setExpandedTool(tool);
    }
  };

  const handleAddSticker = (type) => {
    addSticker({
      type,
      position: { 
        x: 200 + Math.random() * 300, 
        y: 150 + Math.random() * 200 
      },
      size: { width: 60, height: 60 },
      rotation: 0,
      color: stickerColor
    });
    toast.success('Sticker added!');
  };

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
      setShowFolderInput(false);
      toast.success('Folder created!');
    }
  };

  const handleAddSourceClick = () => {
    if (!onAddSource) return;
    let url = newLinkUrl.trim();
    const title = newLinkTitle.trim();
    if (!url) return;

    // Ensure URL has a protocol so it opens as an external site, not a local route
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    onAddSource({ url, title });
    setNewLinkUrl('');
    setNewLinkTitle('');
    toast.success('Source added to canvas!');
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      toast.loading('Processing image...');
      
      // Compress the image
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true
      };
      
      const compressedFile = await imageCompression(file, options);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result;
        
        // Add image to canvas
        if (onAddImage) {
          onAddImage({
            type: 'image',
            data: imageData,
            position: { 
              x: 150 + Math.random() * 200, 
              y: 100 + Math.random() * 150 
            },
            size: { width: 300, height: 200 }
          });
        }
        
        toast.dismiss();
        toast.success('Image added to canvas!');
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to process image');
      console.error(error);
    }
    
    // Reset input
    e.target.value = '';
  };

  const handleAddTable = () => {
    if (onAddTable) {
      onAddTable({
        type: 'table',
        position: { 
          x: 150 + Math.random() * 200, 
          y: 100 + Math.random() * 150 
        },
        size: { width: 400, height: 200 },
        rows: 3,
        cols: 3,
        data: [
          ['', '', ''],
          ['', '', ''],
          ['', '', '']
        ]
      });
      toast.success('Table added!');
    }
  };

  const handleAddTodo = () => {
    if (onAddTodo) {
      onAddTodo({
        type: 'todo',
        position: { 
          x: 150 + Math.random() * 200, 
          y: 100 + Math.random() * 150 
        },
        size: { width: 280, height: 200 },
        title: 'Todo List',
        items: [
          { id: Date.now(), text: '', completed: false }
        ]
      });
      toast.success('Todo list added!');
    }
  };

  const getFolderNoteCount = (folderId) => {
    return notes.filter(note => note.folderId === folderId).length;
  };

  const handleDeleteFolder = (folder) => {
    const confirmed = window.confirm(
      `Delete folder "${folder.name}"? This cannot be undone. Notes will be kept and moved to All Notes.`
    );
    if (!confirmed) return;
    deleteFolder(folder.id);
    toast.success('Folder deleted');
  };

  if (isCollapsed) {
    return (
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-l-none rounded-r-md h-12 w-6 shadow-lg"
          onClick={() => setIsCollapsed(false)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 flex gap-2">
      {/* Main Tool Strip */}
      <div className="bg-card/90 backdrop-blur-md rounded-xl shadow-xl border border-border/50 p-2 flex flex-col gap-1">
        {/* Collapse Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 mb-1"
              onClick={() => setIsCollapsed(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Collapse toolbar</p>
          </TooltipContent>
        </Tooltip>

        {/* Add Note */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={expandedTool === 'note' ? 'default' : 'ghost'}
              size="icon"
              className="h-10 w-10 rounded-lg"
              onClick={() => {
                onAddNote();
                toast.success('Note created!');
              }}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/anotequest-item', JSON.stringify({ kind: 'note' }));
                e.dataTransfer.effectAllowed = 'copy';
              }}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Add a note</p>
          </TooltipContent>
        </Tooltip>

        {/* Freehand Draw */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={drawingTool === 'freehand' ? 'default' : 'ghost'}
              size="icon"
              className="h-10 w-10 rounded-lg"
              onClick={() =>
                setDrawingTool(drawingTool === 'freehand' ? null : 'freehand')
              }
            >
              <Pencil className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Freehand draw</p>
          </TooltipContent>
        </Tooltip>

        {/* Straight Line */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={drawingTool === 'line' ? 'default' : 'ghost'}
              size="icon"
              className="h-10 w-10 rounded-lg"
              onClick={() =>
                setDrawingTool(drawingTool === 'line' ? null : 'line')
              }
            >
              <Minus className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Draw a line</p>
          </TooltipContent>
        </Tooltip>

        {/* Arrow */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={drawingTool === 'arrow' ? 'default' : 'ghost'}
              size="icon"
              className="h-10 w-10 rounded-lg"
              onClick={() =>
                setDrawingTool(drawingTool === 'arrow' ? null : 'arrow')
              }
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Draw an arrow</p>
          </TooltipContent>
        </Tooltip>

        {/* Circle / Ellipse */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={drawingTool === 'ellipse' ? 'default' : 'ghost'}
              size="icon"
              className="h-10 w-10 rounded-lg"
              onClick={() =>
                setDrawingTool(drawingTool === 'ellipse' ? null : 'ellipse')
              }
            >
              <Circle className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Draw a circle</p>
          </TooltipContent>
        </Tooltip>

        {/* Stickers */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={expandedTool === 'stickers' ? 'default' : 'ghost'}
              size="icon"
              className="h-10 w-10 rounded-lg"
              onClick={() => handleToolClick('stickers')}
            >
              <Sticker className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Stickers</p>
          </TooltipContent>
        </Tooltip>

        {/* Note Sticker (yellow sticky) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-lg"
              onClick={() => {
                addNoteSticker();
                toast.success('Note sticker added!');
              }}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/anotequest-item', JSON.stringify({ kind: 'noteSticker' }));
                e.dataTransfer.effectAllowed = 'copy';
              }}
            >
              <StickyNote className="h-5 w-5 text-amber-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Add sticky note</p>
          </TooltipContent>
        </Tooltip>

        {/* Upload Image */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-lg"
              onClick={handleImageClick}
            >
              <ImagePlus className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Upload image</p>
          </TooltipContent>
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Add Table */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-lg"
              onClick={handleAddTable}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/anotequest-item', JSON.stringify({ kind: 'table' }));
                e.dataTransfer.effectAllowed = 'copy';
              }}
            >
              <Table className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Add a table</p>
          </TooltipContent>
        </Tooltip>

        {/* Add Todo List */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-lg"
              onClick={handleAddTodo}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/anotequest-item', JSON.stringify({ kind: 'todo' }));
                e.dataTransfer.effectAllowed = 'copy';
              }}
            >
              <CheckSquare className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Add todo list</p>
          </TooltipContent>
        </Tooltip>

        {/* Links / Sources */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={expandedTool === 'links' ? 'default' : 'ghost'}
              size="icon"
              className="h-10 w-10 rounded-lg"
              onClick={() => handleToolClick('links')}
            >
              <Link2 className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Add links / sources</p>
          </TooltipContent>
        </Tooltip>

        {/* Characters - Using emoji face (temporarily disabled if no handler) */}
        {onToggleCharacters && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={characterPanelOpen ? 'default' : 'ghost'}
                size="icon"
                className="h-10 w-10 rounded-lg text-lg"
                onClick={onToggleCharacters}
              >
                🧙
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Characters</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Note Tools Panel - shown when a note is selected */}
      {activeNote && (
        <Card className="bg-card/95 backdrop-blur-md shadow-xl border border-border/50 p-2 w-36 animate-in slide-in-from-left-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground">Note Tools</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClearActiveNote}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-[10px] font-medium truncate mb-2 text-foreground">{activeNote.title || 'Untitled'}</p>
          
          <div className="space-y-0.5">
            {/* Reader Mode */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-7 text-[11px] px-2"
              onClick={() => {
                if (activeNote && onOpenReaderMode) {
                  onOpenReaderMode(activeNote.id);
                }
              }}
            >
              <Expand className="h-3 w-3 mr-1.5" />
              Reader
            </Button>

            {/* Add Image */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-7 text-[11px] px-2"
              onClick={() => noteImageInputRef.current?.click()}
            >
              <ImageIcon className="h-3 w-3 mr-1.5" />
              Image
            </Button>
            <input
              ref={noteImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !activeNote) return;
                try {
                  const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 800 });
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const newImage = { id: Date.now(), data: ev.target.result };
                    updateNote(activeNote.id, {
                      images: [...(activeNote.images || []), newImage]
                    });
                    toast.success('Image added!');
                  };
                  reader.readAsDataURL(compressed);
                } catch (err) {
                  toast.error('Failed to add image');
                }
                e.target.value = '';
              }}
            />

            {/* Duplicate */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-7 text-[11px] px-2"
              onClick={() => {
                const basePosition = activeNote.position || { x: 200, y: 160 };
                onAddNote({
                  title: activeNote.title || 'New Note',
                  content: activeNote.content,
                  size: activeNote.size,
                  color: activeNote.color,
                  images: [...(activeNote.images || [])],
                  position: {
                    x: basePosition.x + 40,
                    y: basePosition.y + 40,
                  },
                  folderId: activeNote.folderId,
                });
                toast.success('Note duplicated');
              }}
            >
              <Copy className="h-3 w-3 mr-1.5" />
              Duplicate
            </Button>

            {/* Color Picker */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-[11px] px-2">
                  <Palette className="h-3 w-3 mr-1.5" />
                  Color
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {NOTE_COLORS.map(color => (
                  <DropdownMenuItem
                    key={color.name}
                    onClick={() => {
                      updateNote(activeNote.id, { color: color.name });
                      toast.success('Color updated!');
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className={`w-4 h-4 rounded-sm ${color.bg} ${color.border} border-2`}></div>
                    <span className="capitalize">{color.name}</span>
                    {activeNote.color === color.name && <Check className="h-4 w-4 ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Folder */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start h-7 text-[11px] px-2">
                  <FolderOpen className="h-3 w-3 mr-1.5" />
                  Folder
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {
                  updateNote(activeNote.id, { folderId: null });
                  toast.success('Moved to All Notes');
                }}>
                  <span>No Folder</span>
                  {!activeNote.folderId && <Check className="h-4 w-4 ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {folders.map(folder => (
                  <DropdownMenuItem
                    key={folder.id}
                    onClick={() => {
                      updateNote(activeNote.id, { folderId: folder.id });
                      toast.success('Moved to folder!');
                    }}
                  >
                    <span>{folder.name}</span>
                    {activeNote.folderId === folder.id && <Check className="h-4 w-4 ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Delete */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-7 text-[11px] px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                deleteNote(activeNote.id);
                onClearActiveNote();
                toast.success('Note deleted');
              }}
            >
              <Trash2 className="h-3 w-3 mr-1.5" />
              Delete
            </Button>
          </div>
        </Card>
      )}

      {/* Expanded Panel */}
      {expandedTool && (
        <Card className="bg-card/95 backdrop-blur-md shadow-xl border border-border/50 p-3 w-48 animate-in slide-in-from-left-2">
          {/* Stickers Panel */}
          {expandedTool === 'stickers' && (
            <div>
              <h3 className="text-xs font-semibold mb-2 text-muted-foreground">Stickers</h3>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {STICKER_TYPES.map(({ type, icon, label }) => (
                  <button
                    key={type}
                    className="h-10 w-full rounded-lg border border-border hover:bg-accent hover:border-primary transition-all flex items-center justify-center text-lg active:scale-95"
                    onClick={() => handleAddSticker(type)}
                    title={label}
                    style={{ color: stickerColor }}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/anotequest-item', JSON.stringify({ kind: 'sticker', type }));
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <h4 className="text-xs font-semibold mb-2 text-muted-foreground">Color</h4>
              <div className="grid grid-cols-5 gap-1">
                {COLORS.map(color => (
                  <button
                    key={color}
                    className={`h-6 w-6 rounded-md border-2 transition-all ${
                      stickerColor === color ? 'border-primary ring-1 ring-primary/50' : 'border-transparent'
                    }`}
                    style={{ background: color }}
                    onClick={() => setStickerColor(color)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Links / Sources Panel */}
          {expandedTool === 'links' && (
            <div>
              <h3 className="text-xs font-semibold mb-2 text-muted-foreground">Save a source</h3>
              <div className="space-y-2 mb-2">
                <Input
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  className="h-7 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddSourceClick();
                    }
                  }}
                />
                <Input
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  placeholder="Optional title"
                  className="h-7 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddSourceClick();
                    }
                  }}
                />
              </div>
              <Button
                size="sm"
                className="w-full h-7 text-xs"
                onClick={handleAddSourceClick}
                disabled={!newLinkUrl.trim()}
              >
                Add to canvas
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
    </TooltipProvider>
  );
};

export default ToolStrip;
