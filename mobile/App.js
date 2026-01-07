import React, { useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable, ScrollView, PanResponder } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>nq</Text>
        </View>
        <Text style={styles.appName}>AnoteQuest</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heroTitle}>Think spatially. Keep your notes local.</Text>
        <Text style={styles.heroText}>
          A calm, local-first canvas for notes, images, tasks, tables, and sketches.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Canvas')}
        >
          <Text style={styles.primaryButtonText}>Open the canvas</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function CanvasScreen() {
  const [notes, setNotes] = useState([
    {
      id: '1',
      title: 'Research outline',
      body: 'Structure chapters, questions, and open threads.',
      position: { x: 40, y: 40 },
    },
    {
      id: '2',
      title: 'Reading notes',
      body: 'Key ideas, citations, and follow-ups.',
      position: { x: 260, y: 220 },
    },
    {
      id: '3',
      title: 'Tasks',
      body: 'Next debugging steps, refactors, and experiments.',
      position: { x: 520, y: 140 },
    },
  ]);

  const panBase = useRef({ x: 0, y: 0 }).current;
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const handleAddNote = () => {
    const nextId = String(notes.length + 1);
    const base = { x: 600, y: 360 };
    setNotes((prev) => [
      ...prev,
      {
        id: nextId,
        title: 'New note',
        body: 'Drop a thought here.',
        position: { x: base.x + prev.length * 32, y: base.y + prev.length * 24 },
      },
    ]);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_evt, gesture) => {
        setPanOffset({
          x: panBase.x + gesture.dx,
          y: panBase.y + gesture.dy,
        });
      },
      onPanResponderRelease: (_evt, gesture) => {
        panBase.x += gesture.dx;
        panBase.y += gesture.dy;
      },
    })
  ).current;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.canvasHeader}>
        <View>
          <Text style={styles.canvasTitle}>Canvas</Text>
          <Text style={styles.canvasSubtitle}>Drag to pan. Tap notes to focus.</Text>
        </View>
        <View style={styles.canvasBadge}>
          <Text style={styles.canvasBadgeText}>{notes.length}/100 notes</Text>
        </View>
      </View>
      <View style={styles.canvasViewport} {...panResponder.panHandlers}>
        <View
          style={[
            styles.canvasBoard,
            { transform: [{ translateX: panOffset.x }, { translateY: panOffset.y }] },
          ]}
        >
          {notes.map((note) => (
            <View
              key={note.id}
              style={[
                styles.noteCard,
                { left: note.position.x, top: note.position.y },
              ]}
            >
              <Text style={styles.noteTitle}>{note.title}</Text>
              <Text style={styles.noteBody}>{note.body}</Text>
            </View>
          ))}
        </View>
        <Pressable style={styles.addNoteButton} onPress={handleAddNote}>
          <Text style={styles.addNoteText}>+ New note</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Canvas" component={CanvasScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617', // slate-950-ish
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#020617',
    textTransform: 'uppercase',
  },
  appName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f9fafb',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 8,
  },
  heroText: {
    fontSize: 14,
    color: '#cbd5f5',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f9fafb',
  },
  canvasHeader: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
  },
  canvasTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f9fafb',
  },
  canvasSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#9ca3af',
  },
  canvasViewport: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 24,
  },
  canvasBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#020617',
  },
  canvasBadgeText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  canvasBoard: {
    width: 1400,
    height: 1000,
    borderRadius: 16,
    backgroundColor: '#020617',
    borderColor: '#111827',
    borderWidth: 1,
    overflow: 'hidden',
  },
  addNoteButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  addNoteText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#e5e7eb',
  },
  noteCard: {
    position: 'absolute',
    width: 240,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  noteBody: {
    fontSize: 13,
    lineHeight: 18,
    color: '#9ca3af',
  },
});
