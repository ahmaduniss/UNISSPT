import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Plus,
  Play,
  Trash2,
  Info,
} from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import type { Routine } from '@/types/workout';

export default function RoutinesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clientId, clientName } = useLocalSearchParams<{ clientId?: string; clientName?: string }>();
  const { startRoutineWorkout } = useApp();
  const utils = trpc.useUtils();

  const routinesQuery = trpc.routines.list.useQuery();
  const routines = routinesQuery.data ?? [];

  const historyQuery = trpc.workouts.getHistory.useQuery(
    { clientId: clientId ?? '' },
    { enabled: !!clientId },
  );

  const incrementUsage = trpc.routines.incrementUsage.useMutation({
    onError: (error) => console.error('[Routines] incrementUsage failed:', error.message),
  });

  const deleteMutation = trpc.routines.delete.useMutation({
    onSuccess: () => utils.routines.list.invalidate(),
    onError: (error) => Alert.alert('Could not delete routine', error.message),
  });

  const handleStartRoutine = useCallback(
    (routine: Routine) => {
      if (!clientId || !clientName) {
        Alert.alert('Pick a client first', 'Open a client’s page and choose "From Routine" to start this template for them.');
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      startRoutineWorkout({ id: clientId, name: clientName }, routine, historyQuery.data ?? []);
      incrementUsage.mutate({ routineId: routine.id });
      router.navigate('/(tabs)/workout' as any);
    },
    [clientId, clientName, startRoutineWorkout, historyQuery.data, incrementUsage, router],
  );

  const handleDeleteRoutine = useCallback(
    (id: string, name: string) => {
      Alert.alert('Delete Routine', `Delete "${name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate({ routineId: id }),
        },
      ]);
    },
    [deleteMutation],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Routines</Text>
      </View>

      {clientName && (
        <View style={styles.contextBanner}>
          <Info color={Colors.dark.accent} size={14} />
          <Text style={styles.contextBannerText}>Starting a routine for {clientName}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.push('/create-routine' as any)}
          style={({ pressed }) => [styles.createBtn, pressed && styles.createBtnPressed]}
        >
          <Plus color={Colors.dark.accent} size={20} />
          <Text style={styles.createBtnText}>Create New Routine</Text>
        </Pressable>

        {routines.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No routines yet</Text>
            <Text style={styles.emptySubtitle}>Build reusable templates for your clients&apos; sessions</Text>
          </View>
        ) : (
          routines.map((routine) => (
            <View key={routine.id} style={styles.routineCard}>
              <View style={styles.routineInfo}>
                <Text style={styles.routineName}>{routine.name}</Text>
                <Text style={styles.routineExercises}>
                  {routine.exercises.length} exercises · {routine.exercises.reduce((s, e) => s + e.targetSets, 0)} sets
                </Text>
                <View style={styles.exerciseList}>
                  {routine.exercises.slice(0, 3).map((ex, idx) => (
                    <Text key={idx} style={styles.exerciseListItem}>
                      {ex.exerciseName}
                    </Text>
                  ))}
                  {routine.exercises.length > 3 && (
                    <Text style={styles.exerciseListMore}>
                      +{routine.exercises.length - 3} more
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.routineActions}>
                <Pressable
                  onPress={() => handleStartRoutine(routine)}
                  style={styles.startBtn}
                >
                  <Play color="#fff" size={16} fill="#fff" />
                </Pressable>
                <Pressable
                  onPress={() => handleDeleteRoutine(routine.id, routine.name)}
                  style={styles.deleteBtn}
                  hitSlop={8}
                >
                  <Trash2 color={Colors.dark.textTertiary} size={16} />
                </Pressable>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  contextBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  contextBannerText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.accentLight,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  createBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderStyle: 'dashed' as const,
    marginBottom: 24,
  },
  createBtnPressed: {
    opacity: 0.7,
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.accent,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingTop: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    textAlign: 'center' as const,
    marginTop: 6,
    paddingHorizontal: 20,
  },
  routineCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row' as const,
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  routineExercises: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginTop: 4,
  },
  exerciseList: {
    marginTop: 10,
    gap: 3,
  },
  exerciseListItem: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    paddingLeft: 8,
  },
  exerciseListMore: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    paddingLeft: 8,
    fontStyle: 'italic' as const,
  },
  routineActions: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginLeft: 12,
  },
  startBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.accent,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.dark.cardElevated,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
