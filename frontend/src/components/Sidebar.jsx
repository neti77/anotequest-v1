import React, { useState } from 'react';
import { FolderPlus, Folder, Trash2, StickyNote, Image, Sticker as StickerIcon, ArrowRight, ArrowDown, ArrowLeft, ArrowUp, Circle, Square, Star, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { toast } from 'sonner';

const STICKER_TYPES = [
  { type: 'arrow-right', icon: ArrowRight, label: 'Arrow Right' },
  { type: 'arrow-down', icon: ArrowDown, label: 'Arrow Down' },
  { type: 'arrow-left', icon: ArrowLeft, label: 'Arrow Left' },
  { type: 'arrow-up', icon: ArrowUp, label: 'Arrow Up' },
  { type: 'circle', icon: Circle, label: 'Circle' },
  { type: 'square', icon: Square, label: 'Square' },
  { type: 'star', icon: Star, label: 'Star' },
  { type: 'heart', icon: Heart, label: 'Heart' },
];

const STICKER_COLORS = [
  { color: '#3b82f6', name: 'Blue' },
  { color: '#ef4444', name: 'Red' },
  { color: '#22c55e', name: 'Green' },
  { color: '#eab308', name: 'Yellow' },
  { color: '#8b5cf6', name: 'Purple' },
  { color: '#f97316', name: 'Orange' },
];

export const Sidebar = ({ folders, notes, activeFolder, setActiveFolder, addFolder, deleteFolder, selectedTool, setSelectedTool, stickerColor, setStickerColor }) => {
  const [newFolderName, setNewFolderName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
      setIsAdding(false);
      toast.success('Folder created!');
    }
  };

  const handleDeleteFolder = (id) => {
    deleteFolder(id);
    if (activeFolder === id) {
      setActiveFolder(null);
    }
    toast.success('Folder deleted');
  };

  const getFolderNoteCount = (folderId) => {
    return notes.filter(note => note.folderId === folderId).length;
  };

  const allImages = notes.reduce((acc, note) => {
    if (note.images && note.images.length > 0) {
      note.images.forEach(img => {
        acc.push({ ...img, noteId: note.id, noteTitle: note.title });
      });
    }
    return acc;
  }, []);

  return (
    <div className="w-64 md:w-64 w-full border-r border-border bg-card/50 backdrop-blur-sm flex flex-col">
      <Tabs defaultValue="folders" className="flex-1 flex flex-col">
        <div className="p-4 border-b border-border flex-shrink-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="folders">Folders</TabsTrigger>
            <TabsTrigger value="stickers">Stickers</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="folders" className="flex-1 overflow-hidden mt-0">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm font-display">Organization</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAdding(!isAdding)}
                className="h-8 w-8"
              >
                <FolderPlus className="h-4 w-4" />
              </Button>
            </div>

            {isAdding && (
              <div className="flex gap-2 animate-slideInUp">
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  className="h-8 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFolder()}
                  autoFocus
                />
                <Button size="sm" onClick={handleAddFolder} className="h-8">
                  Add
                </Button>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              <Card
                className={`mb-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                  activeFolder === null
                    ? 'bg-primary/20 border-primary shadow-sm'
                    : 'bg-card hover:bg-muted/50'
                }`}
                onClick={() => setActiveFolder(null)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">All Notes</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {notes.length}
                  </Badge>
                </div>
              </Card>

              {folders.map(folder => {
                const noteCount = getFolderNoteCount(folder.id);
                return (
                  <Card
                    key={folder.id}
                    className={`mb-2 p-3 cursor-pointer transition-all hover:shadow-md group ${
                      activeFolder === folder.id
                        ? 'bg-primary/20 border-primary shadow-sm'
                        : 'bg-card hover:bg-muted/50'
                    }`}
                    onClick={() => setActiveFolder(folder.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Folder className="h-4 w-4 text-accent flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{folder.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {noteCount}
                        </Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Folder?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the folder but keep all notes.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteFolder(folder.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                );
              })}

              {folders.length === 0 && !isAdding && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No folders yet</p>
                  <p className="text-xs mt-1">Click + to create one</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="stickers" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div>
                <h2 className="font-semibold text-sm font-display mb-3 flex items-center gap-2">
                  <StickerIcon className="h-4 w-4" />
                  Sticker Tools
                </h2>
                <p className="text-xs text-muted-foreground mb-3">Select a sticker, then click and drag on canvas to place it</p>
              </div>

              {/* Sticker Types */}
              <div>
                <span className="text-xs font-medium mb-2 block">Type:</span>
                <div className="grid grid-cols-4 gap-2">
                  {STICKER_TYPES.map(({ type, icon: Icon, label }) => (
                    <Button
                      key={type}
                      variant={selectedTool === type ? 'default' : 'outline'}
                      size="icon"
                      className="h-12 w-12"
                      onClick={() => setSelectedTool(selectedTool === type ? null : type)}
                      title={label}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <span className="text-xs font-medium mb-2 block">Color:</span>
                <div className="grid grid-cols-3 gap-2">
                  {STICKER_COLORS.map(({ color, name }) => (
                    <button
                      key={color}
                      className={`h-10 rounded-md border-2 transition-all hover:scale-105 ${
                        stickerColor === color ? 'border-primary ring-2 ring-primary/50' : 'border-border'
                      }`}
                      style={{ background: color }}
                      onClick={() => setStickerColor(color)}
                    >
                      <span className="text-xs text-white drop-shadow-md font-medium">{name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="images" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <h2 className="font-semibold text-sm font-display mb-4 flex items-center gap-2">
                <Image className="h-4 w-4" />
                Image Gallery
                <Badge variant="secondary" className="text-xs">{allImages.length}</Badge>
              </h2>

              {allImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {allImages.map((image, index) => (
                    <div key={`${image.noteId}-${image.id}`} className="relative group aspect-square">
                      <img
                        src={image.data}
                        alt={`From ${image.noteTitle}`}
                        className="w-full h-full object-cover rounded border border-border hover:border-primary transition-colors cursor-pointer"
                        onClick={() => {
                          toast.info(`From note: ${image.noteTitle}`);
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                        <p className="text-white text-xs px-2 text-center truncate w-full">{image.noteTitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No images yet</p>
                  <p className="text-xs mt-1">Add images to your notes</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Sidebar;