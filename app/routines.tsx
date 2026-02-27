import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Plus,
  Play,
  Users,
  Star,
  Trash2,
} from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';

export default function RoutinesScreen() {
  const router = useRouter();
  const { allRoutines, savedRoutines, startRoutineWorkout, deleteRoutine, selectedGymId } = useApp();

  const sharedQuery = trpc.routines.getShared.useQuery(
    { gymId: selectedGymId ?? 'kabs' },
    { enabled: !!selectedGymId, staleTime: 60000 },
  );

  const incrementUsage = trpc.routines.incrementUsage.useMutation({
    onError: (error) => {
      console.error('[Routines] incrementUsage failed:', error.message);
    },
  });

  const coachRoutines = useMemo(() => {
    if (sharedQuery.data && sharedQuery.data.length > 0) {
      return sharedQuery.data.map((r) => ({
        id: r.id,
        name: r.name,
        exercises: r.exercises,
        isCoach: r.isCoach,
        coachName: r.creatorName,
        usageCount: r.usageCount,
      }));
    }
    return allRoutines.filter((r) => r.isCoach);
  }, [sharedQuery.data, allRoutines]);

  const myRoutines = savedRoutines;

  const handleStartRoutine = useCallback(
    (routine: { id: string; name: string; exercises: { exerciseId: string; exerciseName: string; targetSets: number }[]; isCoach?: boolean; coachName?: string; usageCount?: number }) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      startRoutineWorkout(routine);
      incrementUsage.mutate({ routineId: routine.id });
      router.dismiss();
      setTimeout(() => {
        router.navigate('/(tabs)/workout' as any);
      }, 100);
    },
    [startRoutineWorkout, router, incrementUsage],
  );

  const handleDeleteRoutine = useCallback(
    (id: string, name: string) => {
      Alert.alert('Delete Routine', `Delete "${name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteRoutine(id),
        },
      ]);
    },
    [deleteRoutine],
  );

  return (
    <View style={styles.container}>
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

        {myRoutines.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Routines</Text>
            {myRoutines.map((routine) => (
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
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coach Routines</Text>
          {coachRoutines.map((routine) => (
            <View key={routine.id} style={styles.routineCard}>
              <View style={styles.routineInfo}>
                <View style={styles.routineNameRow}>
                  <Star color={Colors.dark.gold} size={14} fill={Colors.dark.gold} />
                  <Text style={styles.routineName}>{routine.name}</Text>
                </View>
                <Text style={styles.routineCoach}>by {routine.coachName}</Text>
                <Text style={styles.routineExercises}>
                  {routine.exercises.length} exercises · {routine.exercises.reduce((s, e) => s + e.targetSets, 0)} sets
                </Text>
                {routine.usageCount !== undefined && (
                  <View style={styles.usageRow}>
                    <Users color={Colors.dark.textTertiary} size={12} />
                    <Text style={styles.usageText}>
                      {routine.usageCount.toLocaleString()} uses
                    </Text>
                  </View>
                )}
                <View style={styles.exerciseList}>
                  {routine.exercises.map((ex, idx) => (
                    <Text key={idx} style={styles.exerciseListItem}>
                      {ex.exerciseName} ({ex.targetSets} sets)
                    </Text>
                  ))}
                </View>
              </View>
              <View style={styles.routineActions}>
                <Pressable
                  onPress={() => handleStartRoutine(routine)}
                  style={styles.startBtn}
                >
                  <Play color="#fff" size={16} fill="#fff" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 14,
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
  routineNameRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  routineName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  routineCoach: {
    fontSize: 13,
    color: Colors.dark.accent,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  routineExercises: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginTop: 4,
  },
  usageRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 4,
  },
  usageText: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
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
