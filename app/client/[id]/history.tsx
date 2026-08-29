import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Repeat } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import type { Workout } from '@/types/workout';

export default function ClientHistoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { repeatWorkout } = useApp();

  const clientQuery = trpc.clients.getById.useQuery({ clientId: id });
  const historyQuery = trpc.workouts.getHistory.useQuery({ clientId: id }, { enabled: !!id });
  const history = historyQuery.data ?? [];
  const client = clientQuery.data;

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const totalStats = useMemo(() => ({
    totalSessions: history.length,
    totalVolume: history.reduce((s, w) => s + w.totalVolume, 0),
  }), [history]);

  const handleRepeat = useCallback((workout: Workout) => {
    if (!client) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    repeatWorkout(client, workout);
    router.navigate('/(tabs)/workout' as any);
  }, [client, repeatWorkout, router]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalStats.totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {totalStats.totalVolume >= 1000 ? `${(totalStats.totalVolume / 1000).toFixed(1)}k` : totalStats.totalVolume}
            </Text>
            <Text style={styles.statLabel}>Total Vol (kg)</Text>
          </View>
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar color={Colors.dark.textTertiary} size={40} />
            <Text style={styles.emptyTitle}>No Workouts Yet</Text>
            <Text style={styles.emptySubtitle}>
              Complete a session with this client and it will show up here
            </Text>
          </View>
        ) : (
          history.map((workout) => (
            <Swipeable
              key={workout.id}
              renderLeftActions={() => (
                <TouchableOpacity
                  style={styles.swipeRepeatBtn}
                  onPress={() => handleRepeat(workout)}
                  activeOpacity={0.85}
                >
                  <Repeat color="#fff" size={20} />
                  <Text style={styles.swipeRepeatText}>Repeat</Text>
                </TouchableOpacity>
              )}
              overshootLeft={false}
            >
              <View style={styles.workoutCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.cardName}>{workout.name}</Text>
                    <Text style={styles.cardMeta}>
                      {formatDate(workout.date)} · {formatTime(workout.date)}
                    </Text>
                  </View>
                </View>

                {workout.duration >= 60 && (
                  <View style={styles.cardStats}>
                    <Text style={styles.cardStatText}>{formatDuration(workout.duration)}</Text>
                  </View>
                )}

                {workout.exercises.length > 0 && (
                  <View style={styles.exerciseSnapshot}>
                    {workout.exercises.map((ex, idx) => {
                      const completedSets = ex.sets.filter((s) => s.weight > 0 && s.reps > 0).length;
                      return (
                        <View key={`${ex.exerciseId}-${idx}`} style={styles.snapshotRow}>
                          <Text style={styles.snapshotName} numberOfLines={1}>{ex.exerciseName}</Text>
                          <Text style={styles.snapshotSets}>{completedSets} sets</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </Swipeable>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  statsGrid: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center' as const,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
    fontWeight: '500' as const,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.dark.textTertiary,
    textAlign: 'center' as const,
    marginTop: 6,
    lineHeight: 20,
  },
  workoutCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  cardLeft: { flex: 1 },
  cardName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  cardMeta: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  cardStats: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 10,
    gap: 6,
  },
  cardStatText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    fontWeight: '500' as const,
  },
  exerciseSnapshot: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border,
    gap: 5,
  },
  snapshotRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  snapshotName: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    fontWeight: '500' as const,
    flex: 1,
    marginRight: 8,
  },
  snapshotSets: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    fontWeight: '500' as const,
  },
  swipeRepeatBtn: {
    backgroundColor: Colors.dark.accent,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    width: 85,
    borderRadius: 14,
    marginBottom: 10,
    gap: 4,
  },
  swipeRepeatText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700' as const,
  },
});
