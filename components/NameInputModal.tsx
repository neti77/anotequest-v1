import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Sparkles } from 'lucide-react-native';

interface NameInputModalProps {
  onComplete: (name: string) => void;
}

export const NameInputModal: React.FC<NameInputModalProps> = ({ onComplete }) => {
  const [name, setName] = useState('');

  const handleSubmit = async () => {
    const finalName = name.trim() || 'Adventurer';
    await AsyncStorage.setItem('anotequest_username', finalName);
    onComplete(finalName);
  };

  return (
    <Modal visible={true} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.backdrop} />
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Sparkles size={28} color="#A855F7" />
              <Text style={styles.title}>Welcome to AnoteQuest!</Text>
            </View>
            <Text style={styles.description}>
              Begin your epic note-taking journey! Your companions will greet you by name as you progress.
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Name Input Card */}
            <View style={styles.card}>
              <View style={styles.inputRow}>
                <View style={styles.avatar}>
                  <User size={24} color="#A855F7" />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>What should we call you?</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    placeholderTextColor="#6B7280"
                    maxLength={20}
                    onSubmitEditing={handleSubmit}
                    autoFocus
                    returnKeyType="done"
                  />
                </View>
              </View>
              <Text style={styles.hint}>
                Your characters will use this name to encourage you during your quest!
              </Text>
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>Begin Your Quest!</Text>
            </Pressable>

            {/* Preview text */}
            <Text style={styles.previewText}>
              {name.trim()
                ? `Welcome, ${name}!`
                : "We'll call you 'Adventurer' if you skip this"}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#A855F7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    backgroundColor: '#9333EA',
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  previewText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default NameInputModal;