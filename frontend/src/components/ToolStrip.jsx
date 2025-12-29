import React, { useState, useRef } from 'react';
import { 
  StickyNote, 
  Pencil, 
  Sticker, 
  Folder, 
  ImagePlus, 
  ChevronLeft,
  ChevronRight,
  Plus,
  FolderPlus,
  Table,
  CheckSquare,
  Link2
} from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
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

const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#eab308', '#8b5cf6', '#f97316',
  '#ec4899', '#14b8a6', '#000000', '#6b7280'
];

export const ToolStrip = ({ 
  onAddNote, 
  onToggleDrawing, 
  isDrawing,
  addSticker,
  folders,
  notes,
  activeFolder,
  setActiveFolder,
  addFolder,
  onToggleCharacters,
  characterPanelOpen,
  onAddImage,
  onAddTable,
  onAddTodo
}) => {
  const [expandedTool, setExpandedTool] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [stickerColor, setStickerColor] = useState('#3b82f6');
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);
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

  if (isCollapsed) {
    return (
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-l-none rounded-r-lg h-12 w-6 shadow-lg"
          onClick={() => setIsCollapsed(false)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 flex gap-2">
      {/* Main Tool Strip */}
      <div className="bg-card/90 backdrop-blur-md rounded-2xl shadow-xl border border-border/50 p-2 flex flex-col gap-1">
        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 mb-1"
          onClick={() => setIsCollapsed(true)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Add Note */}
        <Button
          variant={expandedTool === 'note' ? 'default' : 'ghost'}
          size="icon"
          className="h-10 w-10 rounded-xl"
          onClick={() => {
            onAddNote();
            toast.success('Note created!');
          }}
          title="Add Note"
        >
          <Plus className="h-5 w-5" />
        </Button>

        {/* Draw */}
        <Button
          variant={isDrawing ? 'default' : 'ghost'}
          size="icon"
          className="h-10 w-10 rounded-xl"
          onClick={onToggleDrawing}
          title="Draw"
        >
          <Pencil className="h-5 w-5" />
        </Button>

        {/* Stickers */}
        <Button
          variant={expandedTool === 'stickers' ? 'default' : 'ghost'}
          size="icon"
          className="h-10 w-10 rounded-xl"
          onClick={() => handleToolClick('stickers')}
          title="Stickers"
        >
          <Sticker className="h-5 w-5" />
        </Button>

        {/* Upload Image */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl"
          onClick={handleImageClick}
          title="Upload Image"
        >
          <ImagePlus className="h-5 w-5" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Add Table */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl"
          onClick={handleAddTable}
          title="Add Table"
        >
          <Table className="h-5 w-5" />
        </Button>

        {/* Add Todo List */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl"
          onClick={handleAddTodo}
          title="Add Todo List"
        >
          <CheckSquare className="h-5 w-5" />
        </Button>

        {/* Folders */}
        <Button
          variant={expandedTool === 'folders' ? 'default' : 'ghost'}
          size="icon"
          className="h-10 w-10 rounded-xl"
          onClick={() => handleToolClick('folders')}
          title="Folders"
        >
          <Folder className="h-5 w-5" />
        </Button>

        {/* Characters - Using emoji face */}
        <Button
          variant={characterPanelOpen ? 'default' : 'ghost'}
          size="icon"
          className="h-10 w-10 rounded-xl text-lg"
          onClick={onToggleCharacters}
          title="Characters"
        >
          🧙
        </Button>
      </div>

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

          {/* Folders Panel */}
          {expandedTool === 'folders' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-muted-foreground">Folders</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowFolderInput(!showFolderInput)}
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                </Button>
              </div>

              {showFolderInput && (
                <div className="flex gap-1 mb-2">
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Name"
                    className="h-7 text-xs"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddFolder()}
                    autoFocus
                  />
                  <Button size="sm" onClick={handleAddFolder} className="h-7 px-2 text-xs">
                    Add
                  </Button>
                </div>
              )}

              <ScrollArea className="max-h-48">
                <div className="space-y-1">
                  <button
                    className={`w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                      activeFolder === null ? 'bg-primary/20 text-primary' : 'hover:bg-muted'
                    }`}
                    onClick={() => setActiveFolder(null)}
                  >
                    <span className="flex items-center gap-1.5">
                      <StickyNote className="h-3.5 w-3.5" />
                      All Notes
                    </span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                      {notes.length}
                    </Badge>
                  </button>

                  {folders.map(folder => (
                    <button
                      key={folder.id}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                        activeFolder === folder.id ? 'bg-primary/20 text-primary' : 'hover:bg-muted'
                      }`}
                      onClick={() => setActiveFolder(folder.id)}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Folder className="h-3.5 w-3.5 flex-shrink-0" />
                        {folder.name}
                      </span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1">
                        {getFolderNoteCount(folder.id)}
                      </Badge>
                    </button>
                  ))}

                  {folders.length === 0 && !showFolderInput && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      No folders yet
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ToolStrip;
