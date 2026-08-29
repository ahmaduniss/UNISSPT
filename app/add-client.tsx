import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Colors from '@/constants/colors';
import { SPORTS } from '@/constants/sports';
import { trpc } from '@/lib/trpc';
import type { SportKey } from '@/types/workout';

export default function AddClientScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [name, setName] = useState<string>('');
  const [sport, setSport] = useState<SportKey>('general');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [goal, setGoal] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
    onError: (error) => {
      Alert.alert('Could not add client', error.message);
    },
  });

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter the client’s name.');
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      sport,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      goal: goal.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }, [name, sport, email, phone, goal, notes, createMutation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Sara K."
          placeholderTextColor={Colors.dark.textTertiary}
          autoFocus
        />

        <Text style={styles.label}>SPORT</Text>
        <View style={styles.sportRow}>
          {SPORTS.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => setSport(s.key)}
              style={[styles.sportChip, sport === s.key && styles.sportChipActive]}
            >
              <Text style={[styles.sportChipText, sport === s.key && styles.sportChipTextActive]}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>EMAIL (optional)</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="client@email.com"
          placeholderTextColor={Colors.dark.textTertiary}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>PHONE (optional)</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+962 7..."
          placeholderTextColor={Colors.dark.textTertiary}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>GOAL (optional)</Text>
        <TextInput
          style={styles.input}
          value={goal}
          onChangeText={setGoal}
          placeholder="e.g. Fat loss, strength, marathon prep..."
          placeholderTextColor={Colors.dark.textTertiary}
        />

        <Text style={styles.label}>NOTES (optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Injuries, preferences, anything to remember..."
          placeholderTextColor={Colors.dark.textTertiary}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleSave}
          disabled={createMutation.isPending}
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && styles.saveBtnPressed,
            createMutation.isPending && { opacity: 0.6 },
          ]}
        >
          <UserPlus color="#fff" size={18} />
          <Text style={styles.saveBtnText}>
            {createMutation.isPending ? 'Adding...' : 'Add Client'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.dark.textTertiary,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 18,
  },
  input: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: '500' as const,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  notesInput: {
    minHeight: 90,
  },
  sportRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  sportChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  sportChipActive: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  sportChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  sportChipTextActive: {
    color: '#fff',
  },
  bottomBar: {
    padding: 20,
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.background,
  },
  saveBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.dark.accent,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  saveBtnPressed: {
    opacity: 0.85,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
