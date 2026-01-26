import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { styled } from 'nativewind';
import { FolderPlus, Folder, Trash2 } from 'lucide-react-native';

// Styled components
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);
const StyledScrollView = styled(ScrollView);
const StyledTextInput = styled(TextInput);
const StyledImage = styled(Image);

// Types
interface FolderType {
  id: number;
  name: string;
  createdAt: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
  folderId: number | null;
  images?: { id: number; data: string }[];
}

interface SidebarProps {
  folders: FolderType[];
  notes: Note[];
  activeFolder: number | null;
  setActiveFolder: (id: number | null) => void;
  addFolder: (name: string) => void;
  deleteFolder: (id: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  folders,
  notes,
  activeFolder,
  setActiveFolder,
  addFolder,
  deleteFolder,
}) => {
  const [newFolderName, setNewFolderName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'folders' | 'images'>('folders');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<FolderType | null>(null);

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
      setIsAdding(false);
      Alert.alert('Success', 'Folder created!');
    }
  };

  const handleDeleteFolder = (folder: FolderType) => {
    setFolderToDelete(folder);
    setDeleteModalVisible(true);
  };

  const confirmDeleteFolder = () => {
    if (folderToDelete) {
      deleteFolder(folderToDelete.id);
      if (activeFolder === folderToDelete.id) {
        setActiveFolder(null);
      }
      setDeleteModalVisible(false);
      setFolderToDelete(null);
      Alert.alert('Success', 'Folder deleted');
    }
  };

  const getFolderNoteCount = (folderId: number) => {
    return notes.filter((note) => note.folderId === folderId).length;
  };

  const allImages = notes.reduce<{ id: number; data: string; noteId: number; noteTitle: string }[]>(
    (acc, note) => {
      if (note.images && note.images.length > 0) {
        note.images.forEach((img) => {
          acc.push({ ...img, noteId: note.id, noteTitle: note.title });
        });
      }
      return acc;
    },
    []
  );

  return (
    <StyledView className="flex-1 bg-slate-900/60 border-r border-slate-700/60">
      {/* Tabs */}
      <StyledView className="p-4 border-b border-slate-700/50">
        <StyledView className="flex-row bg-slate-800/70 rounded-xl p-1.5">
          <StyledPressable
            onPress={() => setActiveTab('folders')}
            className={`flex-1 py-2.5 rounded-lg ${
              activeTab === 'folders' ? 'bg-slate-700' : ''
            }`}
          >
            <StyledText
              className={`text-center text-sm font-semibold ${
                activeTab === 'folders' ? 'text-slate-100' : 'text-slate-500'
              }`}
            >
              Folders
            </StyledText>
          </StyledPressable>
          <StyledPressable
            onPress={() => setActiveTab('images')}
            className={`flex-1 py-2.5 rounded-lg ${
              activeTab === 'images' ? 'bg-slate-700' : ''
            }`}
          >
            <StyledText
              className={`text-center text-sm font-semibold ${
                activeTab === 'images' ? 'text-slate-100' : 'text-slate-500'
              }`}
            >
              Images
            </StyledText>
          </StyledPressable>
        </StyledView>
      </StyledView>

      {/* Folders Tab */}
      {activeTab === 'folders' && (
        <StyledView className="flex-1">
          {/* Header */}
          <StyledView className="p-4 border-b border-slate-700/50">
            <StyledView className="flex-row items-center justify-between mb-3">
              <StyledText className="text-slate-100 font-bold text-sm tracking-wide">Organization</StyledText>
              <StyledPressable
                onPress={() => setIsAdding(!isAdding)}
                className="w-9 h-9 items-center justify-center rounded-lg bg-slate-700/70 border border-slate-600/40"
              >
                <FolderPlus size={16} color="#94a3b8" />
              </StyledPressable>
            </StyledView>

            {/* Add folder input */}
            {isAdding && (
              <StyledView className="flex-row gap-2.5">
                <StyledTextInput
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  placeholder="Folder name"
                  placeholderTextColor="#64748b"
                  className="flex-1 bg-slate-700/70 text-slate-100 px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-600/40"
                  autoFocus
                  onSubmitEditing={handleAddFolder}
                  returnKeyType="done"
                />
                <StyledPressable
                  onPress={handleAddFolder}
                  className="bg-violet-600 px-4 py-2.5 rounded-lg shadow-sm"
                >
                  <StyledText className="text-white font-bold text-sm">Add</StyledText>
                </StyledPressable>
              </StyledView>
            )}
          </StyledView>

          {/* Folder List */}
          <StyledScrollView className="flex-1 p-3">
            {/* All Notes */}
            <StyledPressable
              onPress={() => setActiveFolder(null)}
              className={`mb-3 p-3.5 rounded-xl border ${
                activeFolder === null
                  ? 'bg-violet-600/15 border-violet-500/60'
                  : 'bg-slate-800/70 border-slate-700/60'
              }`}
            >
              <StyledView className="flex-row items-center justify-between">
                <StyledView className="flex-row items-center gap-2.5">
                  <StyledText className="text-lg">📝</StyledText>
                  <StyledText className="text-slate-100 text-sm font-semibold">All Notes</StyledText>
                </StyledView>
                <StyledView className="bg-slate-700/70 px-2.5 py-1 rounded-lg">
                  <StyledText className="text-slate-300 text-xs font-semibold">{notes.length}</StyledText>
                </StyledView>
              </StyledView>
            </StyledPressable>

            {/* Folders */}
            {folders.map((folder) => {
              const noteCount = getFolderNoteCount(folder.id);
              return (
                <StyledPressable
                  key={folder.id}
                  onPress={() => setActiveFolder(folder.id)}
                  onLongPress={() => handleDeleteFolder(folder)}
                  className={`mb-3 p-3.5 rounded-xl border ${
                    activeFolder === folder.id
                      ? 'bg-violet-600/15 border-violet-500/60'
                      : 'bg-slate-800/70 border-slate-700/60'
                  }`}
                >
                  <StyledView className="flex-row items-center justify-between">
                    <StyledView className="flex-row items-center gap-2.5 flex-1">
                      <Folder size={16} color="#a78bfa" />
                      <StyledText className="text-slate-100 text-sm font-semibold" numberOfLines={1}>
                        {folder.name}
                      </StyledText>
                    </StyledView>
                    <StyledView className="flex-row items-center gap-2.5">
                      <StyledView className="bg-slate-700/60 px-2.5 py-1 rounded-lg border border-slate-600/40">
                        <StyledText className="text-slate-400 text-xs font-semibold">{noteCount}</StyledText>
                      </StyledView>
                      <StyledPressable
                        onPress={() => handleDeleteFolder(folder)}
                        className="w-7 h-7 items-center justify-center rounded-lg"
                      >
                        <Trash2 size={14} color="#f87171" />
                      </StyledPressable>
                    </StyledView>
                  </StyledView>
                </StyledPressable>
              );
            })}

            {/* Empty State */}
            {folders.length === 0 && !isAdding && (
              <StyledView className="items-center py-10">
                <Folder size={36} color="#64748b" />
                <StyledText className="text-slate-400 text-sm mt-3 font-medium">No folders yet</StyledText>
                <StyledText className="text-slate-500 text-xs mt-1">Tap + to create one</StyledText>
              </StyledView>
            )}
          </StyledScrollView>
        </StyledView>
      )}

      {/* Images Tab */}
      {activeTab === 'images' && (
        <StyledScrollView className="flex-1 p-4">
          <StyledView className="flex-row items-center gap-2.5 mb-5">
            <StyledText className="text-lg">🖼️</StyledText>
            <StyledText className="text-slate-100 font-bold text-sm">Image Gallery</StyledText>
            <StyledView className="bg-slate-700/70 px-2.5 py-1 rounded-lg">
              <StyledText className="text-slate-300 text-xs font-semibold">{allImages.length}</StyledText>
            </StyledView>
          </StyledView>

          {allImages.length > 0 ? (
            <StyledView className="flex-row flex-wrap gap-3">
              {allImages.map((image) => (
                <StyledPressable
                  key={`${image.noteId}-${image.id}`}
                  onPress={() => Alert.alert('Image', `From note: ${image.noteTitle}`)}
                  className="w-[47%] aspect-square rounded-xl overflow-hidden border-2 border-slate-700/60"
                >
                  <StyledImage
                    source={{ uri: image.data }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <StyledView className="absolute bottom-0 left-0 right-0 bg-slate-900/75 p-2">
                    <StyledText className="text-slate-100 text-xs font-medium" numberOfLines={1}>
                      {image.noteTitle}
                    </StyledText>
                  </StyledView>
                </StyledPressable>
              ))}
            </StyledView>
          ) : (
            <StyledView className="items-center py-12">
              <StyledText className="text-5xl mb-3">🖼️</StyledText>
              <StyledText className="text-gray-400 text-sm">No images yet</StyledText>
              <StyledText className="text-gray-500 text-xs mt-1">Add images to your notes</StyledText>
            </StyledView>
          )}
        </StyledScrollView>
      )}

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <StyledPressable
          onPress={() => setDeleteModalVisible(false)}
          className="flex-1 bg-black/60 items-center justify-center px-6"
        >
          <StyledPressable
            onPress={(e) => e.stopPropagation()}
            className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm"
          >
            <StyledText className="text-white text-lg font-bold mb-2">Delete Folder?</StyledText>
            <StyledText className="text-gray-400 text-sm mb-6">
              This will remove the folder "{folderToDelete?.name}" but keep all notes.
            </StyledText>
            <StyledView className="flex-row gap-3">
              <StyledPressable
                onPress={() => {
                  setDeleteModalVisible(false);
                  setFolderToDelete(null);
                }}
                className="flex-1 bg-gray-700 py-3 rounded-xl"
              >
                <StyledText className="text-gray-300 font-medium text-center">Cancel</StyledText>
              </StyledPressable>
              <StyledPressable
                onPress={confirmDeleteFolder}
                className="flex-1 bg-red-600 py-3 rounded-xl"
              >
                <StyledText className="text-white font-bold text-center">Delete</StyledText>
              </StyledPressable>
            </StyledView>
          </StyledPressable>
        </StyledPressable>
      </Modal>
    </StyledView>
  );
};

export default Sidebar;
