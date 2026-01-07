import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'anotequest_notes';

export default function NotesScreen() {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setNotes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load notes', e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      } catch (e) {
        console.error('Failed to save notes', e);
      }
    })();
  }, [notes]);

  const addNote = () => {
    if (!text.trim()) return;
    const newNote = { id: Date.now().toString(), content: text.trim(), createdAt: new Date().toISOString() };
    setNotes(prev => [newNote, ...prev]);
    setText('');
  };

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Write a quick note"
          value={text}
          onChangeText={setText}
        />
        <Button title="Add" onPress={addNote} />
      </View>

      <FlatList
        data={notes}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.noteRow}>
            <Text style={styles.noteText}>{item.content}</Text>
            <TouchableOpacity onPress={() => deleteNote(item.id)}>
              <Text style={styles.delete}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => <Text style={styles.empty}>No notes yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  inputRow: { flexDirection: 'row', marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 8, marginRight: 8, borderRadius: 6 },
  noteRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteText: { flex: 1, marginRight: 8 },
  delete: { color: 'red' },
  empty: { textAlign: 'center', color: '#666', marginTop: 40 }
});
