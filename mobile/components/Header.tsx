import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  useColorScheme,
} from 'react-native';
import { styled } from 'nativewind';
import {
  Search,
  Undo2,
  Redo2,
  X,
  Folder,
  ChevronDown,
  FolderPlus,
  Home,
  Check,
  Download,
  FileText,
  Crown,
  Pencil,
  Swords,
} from 'lucide-react-native';

// Styled components
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);
const StyledTextInput = styled(TextInput);
const StyledScrollView = styled(ScrollView);

// Types
interface Stats {
  totalNotes: number;
  totalWords: number;
  xp: number;
  level: number;
  timeSpent: number;
  battles: number;
  wins: number;
}

interface Folder {
  id: number;
  name: string;
  createdAt: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
  folderId: number | null;
}

interface HeaderProps {
  stats: Stats;
  onBattle?: () => void;
  isPremium: boolean;
  isDrawingMode: boolean;
  userName: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  notes?: Note[];
  tables?: any[];
  todos?: any[];
  showBattle?: boolean;
  folders?: Folder[];
  activeFolder: number | null;
  setActiveFolder: (id: number | null) => void;
  addFolder: (name: string) => void;
  deleteFolder?: (id: number) => void;
  showFolderView?: boolean;
  setShowFolderView?: (show: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  onBattle,
  isPremium,
  isDrawingMode,
  userName,
  searchQuery,
  setSearchQuery,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  notes = [],
  tables = [],
  todos = [],
  showBattle = false,
  folders = [],
  activeFolder,
  setActiveFolder,
  addFolder,
  deleteFolder,
  showFolderView,
  setShowFolderView,
}) => {
  const colorScheme = useColorScheme();
  const [showSearch, setShowSearch] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);

  const currentFolder = folders.find((f) => f.id === activeFolder);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
      setIsAddingFolder(false);
      Alert.alert('Success', 'Folder created!');
    }
  };

  const getFolderNoteCount = (folderId: number) => {
    return notes.filter((note) => note.folderId === folderId).length;
  };

  const exportToText = () => {
    // In React Native, we'd use Sharing API or write to file system
    // For now, show an alert with the content summary
    let text = `AnoteQuest Notes\n`;
    text += `==================\n`;
    text += `User: ${userName}\n`;
    text += `Total Notes: ${notes.length}\n`;

    Alert.alert(
      'Export',
      `Would export ${notes.length} notes for user ${userName}.\n\nNote: Full export requires native file system access.`
    );
    setShowExportMenu(false);
  };

  return (
    <StyledView className="h-16 border-b border-slate-700/60 bg-slate-900/95 px-4 flex-row items-center justify-between">
      {/* Logo & Title */}
      <StyledView className="flex-row items-center gap-2.5">
        <StyledText className="text-2xl">📝</StyledText>
        <StyledText className="text-lg font-extrabold text-amber-400 tracking-wide">AnoteQuest</StyledText>
      </StyledView>

      {/* Center - Search, Undo/Redo */}
      <StyledView className="flex-row items-center gap-2.5">
        {/* Search */}
        {showSearch ? (
          <StyledView className="flex-row items-center gap-1.5 bg-slate-700/60 rounded-lg px-3 py-1.5 border border-slate-600/40">
            <Search size={16} color="#94a3b8" />
            <StyledTextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search..."
              placeholderTextColor="#64748b"
              className="h-8 w-28 text-slate-100 text-sm font-medium"
              autoFocus
            />
            <StyledPressable
              onPress={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
              className="p-1.5 rounded-md bg-slate-600/40"
            >
              <X size={14} color="#94a3b8" />
            </StyledPressable>
          </StyledView>
        ) : (
          <StyledPressable
            onPress={() => setShowSearch(true)}
            className="w-9 h-9 items-center justify-center rounded-lg bg-slate-700/50"
          >
            <Search size={18} color="#94a3b8" />
          </StyledPressable>
        )}

        {/* Undo/Redo */}
        <StyledView className="flex-row items-center gap-1 bg-slate-700/50 rounded-lg p-1">
          <StyledPressable
            onPress={onUndo}
            disabled={!canUndo}
            className={`w-8 h-8 items-center justify-center rounded-md ${!canUndo ? 'opacity-35' : ''}`}
          >
            <Undo2 size={16} color={canUndo ? '#e2e8f0' : '#64748b'} />
          </StyledPressable>
          <StyledPressable
            onPress={onRedo}
            disabled={!canRedo}
            className={`w-8 h-8 items-center justify-center rounded-md ${!canRedo ? 'opacity-35' : ''}`}
          >
            <Redo2 size={16} color={canRedo ? '#e2e8f0' : '#64748b'} />
          </StyledPressable>
        </StyledView>

        {/* Drawing Mode Indicator */}
        {isDrawingMode && (
          <StyledView className="flex-row items-center gap-1.5 bg-violet-500/15 px-2.5 py-1.5 rounded-full border border-violet-500/30">
            <Pencil size={12} color="#a78bfa" />
            <StyledText className="text-violet-400 text-xs font-semibold">Drawing</StyledText>
          </StyledView>
        )}

        {/* Folder Selector */}
        <StyledPressable
          onPress={() => setShowFolderMenu(true)}
          className="flex-row items-center gap-1.5 bg-slate-700/60 px-3 py-2 rounded-lg border border-slate-600/40"
        >
          <Folder size={14} color="#a78bfa" />
          <StyledText className="text-slate-100 text-sm font-semibold" numberOfLines={1}>
            {currentFolder ? currentFolder.name : 'All'}
          </StyledText>
          <ChevronDown size={12} color="#94a3b8" />
        </StyledPressable>
      </StyledView>

      {/* Right Actions */}
      <StyledView className="flex-row items-center gap-2.5">
        {/* Time Badge */}
        <StyledView className="bg-slate-700/50 px-2.5 py-1.5 rounded-lg">
          <StyledText className="text-slate-400 text-xs font-semibold">{formatTime(stats.timeSpent)}</StyledText>
        </StyledView>

        {/* Premium Badge */}
        {isPremium && (
          <StyledView className="flex-row items-center gap-1 bg-amber-500 px-2.5 py-1.5 rounded-full shadow-sm">
            <Crown size={12} color="#FFFFFF" />
            <StyledText className="text-white text-xs font-bold">Pro</StyledText>
          </StyledView>
        )}

        {/* Export Button */}
        <StyledPressable
          onPress={() => setShowExportMenu(true)}
          className="w-9 h-9 items-center justify-center rounded-lg bg-slate-700/60 border border-slate-600/30"
        >
          <Download size={16} color="#94a3b8" />
        </StyledPressable>
      </StyledView>

      {/* Folder Menu Modal */}
      <Modal visible={showFolderMenu} transparent animationType="fade">
        <StyledPressable
          onPress={() => {
            setShowFolderMenu(false);
            setIsAddingFolder(false);
            setNewFolderName('');
          }}
          className="flex-1 bg-black/70 justify-center items-center"
        >
          <StyledPressable
            onPress={(e) => e.stopPropagation()}
            className="bg-slate-900 rounded-2xl w-80 max-h-96 overflow-hidden border border-slate-700/60 shadow-xl"
          >
            <StyledScrollView className="p-3">
              {/* All Notes */}
              <StyledPressable
                onPress={() => {
                  setActiveFolder(null);
                  setShowFolderMenu(false);
                }}
                className="flex-row items-center gap-3 p-3.5 rounded-xl"
              >
                <Home size={18} color="#9CA3AF" />
                <StyledText className="flex-1 text-white">All Notes</StyledText>
                <StyledView className="bg-gray-700 px-2 py-0.5 rounded">
                  <StyledText className="text-gray-400 text-xs">{notes.length}</StyledText>
                </StyledView>
                {activeFolder === null && <Check size={16} color="#8B5CF6" />}
              </StyledPressable>

              {/* Separator */}
              <StyledView className="h-px bg-gray-700 my-1" />

              {/* Folders */}
              {folders.map((folder) => (
                <StyledPressable
                  key={folder.id}
                  onPress={() => {
                    setActiveFolder(folder.id);
                    setShowFolderMenu(false);
                  }}
                  className="flex-row items-center gap-3 p-3 rounded-lg"
                >
                  <Folder size={18} color="#A78BFA" />
                  <StyledText className="flex-1 text-white" numberOfLines={1}>
                    {folder.name}
                  </StyledText>
                  <StyledView className="bg-gray-700 px-2 py-0.5 rounded">
                    <StyledText className="text-gray-400 text-xs">
                      {getFolderNoteCount(folder.id)}
                    </StyledText>
                  </StyledView>
                  {activeFolder === folder.id && <Check size={16} color="#8B5CF6" />}
                </StyledPressable>
              ))}

              {folders.length > 0 && <StyledView className="h-px bg-gray-700 my-1" />}

              {/* Add Folder */}
              {isAddingFolder ? (
                <StyledView className="p-2">
                  <StyledView className="flex-row gap-2">
                    <StyledTextInput
                      value={newFolderName}
                      onChangeText={setNewFolderName}
                      placeholder="Folder name"
                      placeholderTextColor="#6B7280"
                      className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-md text-sm"
                      autoFocus
                      onSubmitEditing={handleAddFolder}
                    />
                    <StyledPressable
                      onPress={handleAddFolder}
                      className="bg-purple-600 px-3 py-2 rounded-md"
                    >
                      <StyledText className="text-white font-medium">Add</StyledText>
                    </StyledPressable>
                  </StyledView>
                </StyledView>
              ) : (
                <StyledPressable
                  onPress={() => setIsAddingFolder(true)}
                  className="flex-row items-center gap-3 p-3 rounded-lg"
                >
                  <FolderPlus size={18} color="#9CA3AF" />
                  <StyledText className="text-gray-300">New Folder</StyledText>
                </StyledPressable>
              )}

              {/* View All Folders */}
              {setShowFolderView && (
                <>
                  <StyledView className="h-px bg-gray-700 my-1" />
                  <StyledPressable
                    onPress={() => {
                      setShowFolderMenu(false);
                      setShowFolderView(true);
                    }}
                    className="flex-row items-center gap-3 p-3 rounded-lg"
                  >
                    <Folder size={18} color="#9CA3AF" />
                    <StyledText className="text-gray-300">View All Folders</StyledText>
                  </StyledPressable>
                </>
              )}
            </StyledScrollView>
          </StyledPressable>
        </StyledPressable>
      </Modal>

      {/* Export Menu Modal */}
      <Modal visible={showExportMenu} transparent animationType="fade">
        <StyledPressable
          onPress={() => setShowExportMenu(false)}
          className="flex-1 bg-black/60 justify-center items-center"
        >
          <StyledPressable
            onPress={(e) => e.stopPropagation()}
            className="bg-gray-800 rounded-xl w-64 overflow-hidden"
          >
            <StyledView className="p-2">
              <StyledPressable
                onPress={exportToText}
                className="flex-row items-center gap-3 p-3 rounded-lg"
              >
                <FileText size={18} color="#9CA3AF" />
                <StyledText className="text-white">Export as Text</StyledText>
              </StyledPressable>
              <StyledPressable
                onPress={() => {
                  Alert.alert(
                    'PDF Export',
                    'PDF export is not available on mobile. Use text export instead.'
                  );
                  setShowExportMenu(false);
                }}
                className="flex-row items-center gap-3 p-3 rounded-lg"
              >
                <FileText size={18} color="#9CA3AF" />
                <StyledText className="text-white">Export as PDF</StyledText>
              </StyledPressable>
            </StyledView>
          </StyledPressable>
        </StyledPressable>
      </Modal>
    </StyledView>
  );
};

export default Header;
