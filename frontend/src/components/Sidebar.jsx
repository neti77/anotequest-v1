import React, { useState } from 'react';
import { FolderPlus, Folder, Trash2, StickyNote, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
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

export const Sidebar = ({ folders, notes, activeFolder, setActiveFolder, addFolder, deleteFolder }) => {
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

  return (
    <div className="w-64 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col">
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
          {/* All Notes */}
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

          {/* Folder List */}
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
                            This will remove the folder but keep all notes. Notes in this folder will be moved to "All Notes".
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
    </div>
  );
};

export default Sidebar;