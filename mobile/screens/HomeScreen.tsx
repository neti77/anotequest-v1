import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Modal,
  TextInput,
  Alert,
  StatusBar,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Plus,
  Folder,
  Settings,
  LogOut,
  Search,
  Trash2,
  MoreVertical,
} from 'lucide-react-native';

interface Folder {
  id: number;
  name: string;
  createdAt: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
  position: { x: number; y: number };
  createdAt: string;
  images: string[];
  folderId: number | null;
}

export const HomeScreen: React.FC<{
  navigation: any;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}> = ({ navigation, isDarkMode, setIsDarkMode }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [userName, setUserName] = useState('Adventurer');
  const [isLoading, setIsLoading] = useState(true);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [stats, setStats] = useState({ totalNotes: 0, totalWords: 0 });

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedFolders = await AsyncStorage.getItem('anotequest_folders');
        const loadedNotes = await AsyncStorage.getItem('anotequest_notes');
        const loadedUserName = await AsyncStorage.getItem('anotequest_username');

        if (loadedFolders) setFolders(JSON.parse(loadedFolders));
        if (loadedNotes) {
          const notes = JSON.parse(loadedNotes);
          setNotes(notes);
          setStats({
            totalNotes: notes.length,
            totalWords: notes.reduce((sum: number, n: Note) => sum + (n.content?.split(/\s+/).filter(Boolean).length || 0), 0),
          });
        }
        if (loadedUserName) setUserName(loadedUserName);
        setIsLoading(false);
      } catch (err) {
        console.error('Load error:', err);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    const newFolder: Folder = {
      id: Date.now(),
      name: newFolderName.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...folders, newFolder];
    setFolders(updated);
    await AsyncStorage.setItem('anotequest_folders', JSON.stringify(updated));
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  const updateFolder = async () => {
    if (!editingFolderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    const updated = folders.map(f =>
      f.id === editingFolderId ? { ...f, name: editingFolderName.trim() } : f
    );
    setFolders(updated);
    await AsyncStorage.setItem('anotequest_folders', JSON.stringify(updated));
    setEditingFolderId(null);
    setEditingFolderName('');
    setShowEditModal(false);
  };

  const deleteFolder = async (id: number) => {
    Alert.alert(
      'Delete Folder',
      'Items in this folder will be moved to "All Notes". Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Move notes to all notes (folderId = null)
            const updated = notes.map(n =>
              n.folderId === id ? { ...n, folderId: null } : n
            );
            await AsyncStorage.setItem('anotequest_notes', JSON.stringify(updated));

            // Delete folder
            const updatedFolders = folders.filter(f => f.id !== id);
            setFolders(updatedFolders);
            await AsyncStorage.setItem('anotequest_folders', JSON.stringify(updatedFolders));
          },
        },
      ]
    );
  };

  const getNotesInFolder = (folderId: number | null) => {
    return notes.filter(n => n.folderId === folderId);
  };

  const getFolderPreviewImage = (folderId: number | null) => {
    const folderNotes = getNotesInFolder(folderId);
    if (folderNotes.length === 0) return null;

    // Get first note with images
    for (const note of folderNotes) {
      if (note.images && note.images.length > 0) {
        return note.images[0];
      }
    }
    return null;
  };

  const allNotesCount = getNotesInFolder(null).length;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, !isDarkMode && styles.containerLight]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={[styles.loadingText, !isDarkMode && styles.loadingTextLight]}>
            Loading your workspace...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, !isDarkMode && styles.containerLight]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, !isDarkMode && styles.headerLight]}>
        <View>
          <Text style={[styles.greeting, !isDarkMode && styles.greetingLight]}>
            Welcome back, {userName}! 👋
          </Text>
          <Text style={[styles.subtitle, !isDarkMode && styles.subtitleLight]}>
            {stats.totalNotes} notes • {stats.totalWords} words
          </Text>
        </View>
        <Pressable
          style={[styles.settingsButton, !isDarkMode && styles.settingsButtonLight]}
          onPress={() => setIsDarkMode(!isDarkMode)}
        >
          <Text style={styles.settingsIcon}>🌙</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* All Notes Card */}
        <Pressable
          style={[styles.allNotesCard, !isDarkMode && styles.allNotesCardLight]}
          onPress={() => navigation.navigate('Canvas', { folderId: null })}
        >
          <View style={styles.allNotesIcon}>
            <Text style={styles.allNotesIconText}>📝</Text>
          </View>
          <View style={styles.allNotesInfo}>
            <Text style={[styles.allNotesTitle, !isDarkMode && styles.allNotesTitleLight]}>
              All Notes
            </Text>
            <Text style={[styles.allNotesCount, !isDarkMode && styles.allNotesCountLight]}>
              {allNotesCount} items
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        {/* Folders Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, !isDarkMode && styles.sectionTitleLight]}>
              Your Folders
            </Text>
            <Pressable
              style={[styles.addButton, !isDarkMode && styles.addButtonLight]}
              onPress={() => setShowNewFolderModal(true)}
            >
              <Plus size={16} color="#fff" />
            </Pressable>
          </View>

          {folders.length === 0 ? (
            <View style={[styles.emptyState, !isDarkMode && styles.emptyStateLight]}>
              <Text style={styles.emptyStateIcon}>📂</Text>
              <Text style={[styles.emptyStateTitle, !isDarkMode && styles.emptyStateTitleLight]}>
                No folders yet
              </Text>
              <Text style={[styles.emptyStateSubtitle, !isDarkMode && styles.emptyStateSubtitleLight]}>
                Create one to organize your notes
              </Text>
            </View>
          ) : (
            <View style={styles.foldersGrid}>
              {folders.map((folder) => {
                const folderNotes = getNotesInFolder(folder.id);
                const previewImage = getFolderPreviewImage(folder.id);

                return (
                  <Pressable
                    key={folder.id}
                    style={[styles.folderCard, !isDarkMode && styles.folderCardLight]}
                    onPress={() => navigation.navigate('Canvas', { folderId: folder.id })}
                    onLongPress={() => {
                      setEditingFolderId(folder.id);
                      setEditingFolderName(folder.name);
                      setShowEditModal(true);
                    }}
                  >
                    {previewImage ? (
                      <Image
                        source={{ uri: previewImage }}
                        style={styles.folderPreviewImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.folderPreview, !isDarkMode && styles.folderPreviewLight]}>
                        <Folder size={40} color="#8b5cf6" />
                      </View>
                    )}

                    <View style={[styles.folderInfo, !isDarkMode && styles.folderInfoLight]}>
                      <Text
                        style={[styles.folderName, !isDarkMode && styles.folderNameLight]}
                        numberOfLines={1}
                      >
                        {folder.name}
                      </Text>
                      <Text style={[styles.folderItemCount, !isDarkMode && styles.folderItemCountLight]}>
                        {folderNotes.length} items
                      </Text>
                    </View>

                    <Pressable
                      style={styles.folderMoreButton}
                      onPress={() => {
                        Alert.alert('Folder Options', '', [
                          {
                            text: 'Rename',
                            onPress: () => {
                              setEditingFolderId(folder.id);
                              setEditingFolderName(folder.name);
                              setShowEditModal(true);
                            },
                          },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => deleteFolder(folder.id),
                          },
                          { text: 'Cancel', style: 'cancel' },
                        ]);
                      }}
                    >
                      <MoreVertical size={16} color="#94a3b8" />
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* New Folder Modal */}
      <Modal visible={showNewFolderModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, !isDarkMode && styles.modalContentLight]}>
            <Text style={[styles.modalTitle, !isDarkMode && styles.modalTitleLight]}>
              New Folder
            </Text>
            <TextInput
              style={[styles.modalInput, !isDarkMode && styles.modalInputLight]}
              placeholder="Folder name..."
              placeholderTextColor={isDarkMode ? '#6b7280' : '#9ca3af'}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalCancelButton, !isDarkMode && styles.modalCancelButtonLight]}
                onPress={() => setShowNewFolderModal(false)}
              >
                <Text style={[styles.modalButtonText, !isDarkMode && styles.modalCancelButtonText]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalCreateButton]}
                onPress={createFolder}
              >
                <Text style={styles.modalCreateButtonText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Folder Modal */}
      <Modal visible={showEditModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, !isDarkMode && styles.modalContentLight]}>
            <Text style={[styles.modalTitle, !isDarkMode && styles.modalTitleLight]}>
              Rename Folder
            </Text>
            <TextInput
              style={[styles.modalInput, !isDarkMode && styles.modalInputLight]}
              placeholder="Folder name..."
              placeholderTextColor={isDarkMode ? '#6b7280' : '#9ca3af'}
              value={editingFolderName}
              onChangeText={setEditingFolderName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalCancelButton, !isDarkMode && styles.modalCancelButtonLight]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={[styles.modalButtonText, !isDarkMode && styles.modalCancelButtonText]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalCreateButton]}
                onPress={updateFolder}
              >
                <Text style={styles.modalCreateButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1222',
  },
  containerLight: {
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 16,
    fontSize: 15,
    fontWeight: '500',
  },
  loadingTextLight: {
    color: '#64748b',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.6)',
  },
  headerLight: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f1f5f9',
    letterSpacing: 0.2,
  },
  greetingLight: {
    color: '#0c1222',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '500',
  },
  subtitleLight: {
    color: '#64748b',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButtonLight: {
    backgroundColor: '#f1f5f9',
  },
  settingsIcon: {
    fontSize: 20,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // All Notes Card
  allNotesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 28,
  },
  allNotesCardLight: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  allNotesIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  allNotesIconText: {
    fontSize: 28,
  },
  allNotesInfo: {
    flex: 1,
  },
  allNotesTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f1f5f9',
    letterSpacing: 0.2,
  },
  allNotesTitleLight: {
    color: '#0c1222',
  },
  allNotesCount: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '500',
  },
  allNotesCountLight: {
    color: '#64748b',
  },
  chevron: {
    fontSize: 24,
    color: '#8b5cf6',
    fontWeight: '700',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f1f5f9',
    letterSpacing: 0.2,
  },
  sectionTitleLight: {
    color: '#0c1222',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonLight: {
    backgroundColor: '#8b5cf6',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  emptyStateLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f1f5f9',
    letterSpacing: 0.2,
  },
  emptyStateTitleLight: {
    color: '#1e293b',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  emptyStateSubtitleLight: {
    color: '#64748b',
  },

  // Folders Grid
  foldersGrid: {
    gap: 14,
  },
  folderCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  folderCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  folderPreview: {
    width: '100%',
    height: 140,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderPreviewLight: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  folderPreviewImage: {
    width: '100%',
    height: 140,
  },
  folderInfo: {
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  folderInfoLight: {
    backgroundColor: '#f8fafc',
  },
  folderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
    flex: 1,
    letterSpacing: 0.2,
  },
  folderNameLight: {
    color: '#0c1222',
  },
  folderItemCount: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    marginLeft: 8,
  },
  folderItemCountLight: {
    color: '#64748b',
  },
  folderMoreButton: {
    padding: 8,
    marginLeft: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  modalContentLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f1f5f9',
    marginBottom: 18,
    letterSpacing: 0.2,
  },
  modalTitleLight: {
    color: '#0c1222',
  },
  modalInput: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.4)',
    borderRadius: 12,
    color: '#f1f5f9',
    fontSize: 16,
    padding: 14,
    marginBottom: 20,
    fontWeight: '500',
  },
  modalInputLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    color: '#0c1222',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.4)',
  },
  modalCancelButtonLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94a3b8',
  },
  modalCancelButtonText: {
    color: '#64748b',
  },
  modalCreateButton: {
    backgroundColor: '#8b5cf6',
  },
  modalCreateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
