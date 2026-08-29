import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Save, Archive, RotateCcw } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
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

export default function EditClientScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const utils = trpc.useUtils();

  const clientQuery = trpc.clients.getById.useQuery({ clientId: id });

  const [name, setName] = useState<string>('');
  const [sport, setSport] = useState<SportKey>('general');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [goal, setGoal] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (clientQuery.data) {
      setName(clientQuery.data.name);
      setSport(clientQuery.data.sport);
      setEmail(clientQuery.data.email ?? '');
      setPhone(clientQuery.data.phone ?? '');
      setGoal(clientQuery.data.goal ?? '');
      setNotes(clientQuery.data.notes ?? '');
    }
  }, [clientQuery.data]);

  const invalidateAndBack = useCallback(() => {
    utils.clients.list.invalidate();
    utils.clients.getById.invalidate({ clientId: id });
    router.back();
  }, [utils, id, router]);

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      invalidateAndBack();
    },
    onError: (error) => Alert.alert('Could not save', error.message),
  });

  const archiveMutation = trpc.clients.archive.useMutation({
    onSuccess: invalidateAndBack,
    onError: (error) => Alert.alert('Could not update status', error.message),
  });

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter the client’s name.');
      return;
    }
    updateMutation.mutate({
      clientId: id,
      name: name.trim(),
      sport,
      email: email.trim(),
      phone: phone.trim(),
      goal: goal.trim(),
      notes: notes.trim(),
    });
  }, [id, name, sport, email, phone, goal, notes, updateMutation]);

  const handleArchive = useCallback(() => {
    const isActive = clientQuery.data?.status === 'active';
    if (isActive) {
      Alert.alert('Archive Client', `Mark ${clientQuery.data?.name} as inactive?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => archiveMutation.mutate({ clientId: id }),
        },
      ]);
    } else {
      updateMutation.mutate({ clientId: id, status: 'active' });
    }
  }, [clientQuery.data, id, archiveMutation, updateMutation]);

  const isActive = clientQuery.data?.status === 'active';

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
          placeholderTextColor={Colors.dark.textTertiary}
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

        <Text style={styles.label}>EMAIL</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholderTextColor={Colors.dark.textTertiary}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>PHONE</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholderTextColor={Colors.dark.textTertiary}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>GOAL</Text>
        <TextInput
          style={styles.input}
          value={goal}
          onChangeText={setGoal}
          placeholderTextColor={Colors.dark.textTertiary}
        />

        <Text style={styles.label}>NOTES</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholderTextColor={Colors.dark.textTertiary}
          multiline
          textAlignVertical="top"
        />

        <Pressable
          onPress={handleArchive}
          style={({ pressed }) => [styles.archiveBtn, pressed && { opacity: 0.7 }]}
        >
          {isActive ? (
            <Archive color={Colors.dark.danger} size={16} />
          ) : (
            <RotateCcw color={Colors.dark.success} size={16} />
          )}
          <Text style={[styles.archiveBtnText, { color: isActive ? Colors.dark.danger : Colors.dark.success }]}>
            {isActive ? 'Archive Client' : 'Reactivate Client'}
          </Text>
        </Pressable>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleSave}
          disabled={updateMutation.isPending}
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && styles.saveBtnPressed,
            updateMutation.isPending && { opacity: 0.6 },
          ]}
        >
          <Save color="#fff" size={18} />
          <Text style={styles.saveBtnText}>Save Changes</Text>
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
  archiveBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  archiveBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
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
