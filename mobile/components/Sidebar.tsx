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
    <StyledView className="flex-1 bg-gray-800/50 border-r border-gray-700">
      {/* Tabs */}
      <StyledView className="p-4 border-b border-gray-700">
        <StyledView className="flex-row bg-gray-700 rounded-lg p-1">
          <StyledPressable
            onPress={() => setActiveTab('folders')}
            className={`flex-1 py-2 rounded-md ${
              activeTab === 'folders' ? 'bg-gray-600' : ''
            }`}
          >
            <StyledText
              className={`text-center text-sm font-medium ${
                activeTab === 'folders' ? 'text-white' : 'text-gray-400'
              }`}
            >
              Folders
            </StyledText>
          </StyledPressable>
          <StyledPressable
            onPress={() => setActiveTab('images')}
            className={`flex-1 py-2 rounded-md ${
              activeTab === 'images' ? 'bg-gray-600' : ''
            }`}
          >
            <StyledText
              className={`text-center text-sm font-medium ${
                activeTab === 'images' ? 'text-white' : 'text-gray-400'
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
          <StyledView className="p-4 border-b border-gray-700">
            <StyledView className="flex-row items-center justify-between mb-3">
              <StyledText className="text-white font-semibold text-sm">Organization</StyledText>
              <StyledPressable
                onPress={() => setIsAdding(!isAdding)}
                className="w-8 h-8 items-center justify-center rounded-md bg-gray-700"
              >
                <FolderPlus size={16} color="#9CA3AF" />
              </StyledPressable>
            </StyledView>

            {/* Add folder input */}
            {isAdding && (
              <StyledView className="flex-row gap-2">
                <StyledTextInput
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  placeholder="Folder name"
                  placeholderTextColor="#6B7280"
                  className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-md text-sm"
                  autoFocus
                  onSubmitEditing={handleAddFolder}
                  returnKeyType="done"
                />
                <StyledPressable
                  onPress={handleAddFolder}
                  className="bg-purple-600 px-4 py-2 rounded-md"
                >
                  <StyledText className="text-white font-medium text-sm">Add</StyledText>
                </StyledPressable>
              </StyledView>
            )}
          </StyledView>

          {/* Folder List */}
          <StyledScrollView className="flex-1 p-2">
            {/* All Notes */}
            <StyledPressable
              onPress={() => setActiveFolder(null)}
              className={`mb-2 p-3 rounded-lg border ${
                activeFolder === null
                  ? 'bg-purple-600/20 border-purple-500'
                  : 'bg-gray-800 border-gray-700'
              }`}
            >
              <StyledView className="flex-row items-center justify-between">
                <StyledView className="flex-row items-center gap-2">
                  <StyledText className="text-lg">📝</StyledText>
                  <StyledText className="text-white text-sm font-medium">All Notes</StyledText>
                </StyledView>
                <StyledView className="bg-gray-700 px-2 py-0.5 rounded">
                  <StyledText className="text-gray-300 text-xs">{notes.length}</StyledText>
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
                  className={`mb-2 p-3 rounded-lg border ${
                    activeFolder === folder.id
                      ? 'bg-purple-600/20 border-purple-500'
                      : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  <StyledView className="flex-row items-center justify-between">
                    <StyledView className="flex-row items-center gap-2 flex-1">
                      <Folder size={16} color="#A78BFA" />
                      <StyledText className="text-white text-sm font-medium" numberOfLines={1}>
                        {folder.name}
                      </StyledText>
                    </StyledView>
                    <StyledView className="flex-row items-center gap-2">
                      <StyledView className="bg-gray-700/50 px-2 py-0.5 rounded border border-gray-600">
                        <StyledText className="text-gray-400 text-xs">{noteCount}</StyledText>
                      </StyledView>
                      <StyledPressable
                        onPress={() => handleDeleteFolder(folder)}
                        className="w-6 h-6 items-center justify-center rounded"
                      >
                        <Trash2 size={14} color="#EF4444" />
                      </StyledPressable>
                    </StyledView>
                  </StyledView>
                </StyledPressable>
              );
            })}

            {/* Empty State */}
            {folders.length === 0 && !isAdding && (
              <StyledView className="items-center py-8">
                <Folder size={32} color="#6B7280" />
                <StyledText className="text-gray-400 text-sm mt-2">No folders yet</StyledText>
                <StyledText className="text-gray-500 text-xs mt-1">Tap + to create one</StyledText>
              </StyledView>
            )}
          </StyledScrollView>
        </StyledView>
      )}

      {/* Images Tab */}
      {activeTab === 'images' && (
        <StyledScrollView className="flex-1 p-4">
          <StyledView className="flex-row items-center gap-2 mb-4">
            <StyledText className="text-lg">🖼️</StyledText>
            <StyledText className="text-white font-semibold text-sm">Image Gallery</StyledText>
            <StyledView className="bg-gray-700 px-2 py-0.5 rounded">
              <StyledText className="text-gray-300 text-xs">{allImages.length}</StyledText>
            </StyledView>
          </StyledView>

          {allImages.length > 0 ? (
            <StyledView className="flex-row flex-wrap gap-2">
              {allImages.map((image) => (
                <StyledPressable
                  key={`${image.noteId}-${image.id}`}
                  onPress={() => Alert.alert('Image', `From note: ${image.noteTitle}`)}
                  className="w-[48%] aspect-square rounded-lg overflow-hidden border border-gray-700"
                >
                  <StyledImage
                    source={{ uri: image.data }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <StyledView className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                    <StyledText className="text-white text-xs" numberOfLines={1}>
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
