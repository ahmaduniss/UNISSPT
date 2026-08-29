import { useLocalSearchParams } from 'expo-router';
import { Calendar } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';

export default function CoachHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const historyQuery = trpc.workouts.getHistory.useQuery({ clientId: id }, { enabled: !!id });
  const history = historyQuery.data ?? [];

  const totalStats = useMemo(() => ({
    totalSessions: history.length,
    totalVolume: history.reduce((s, w) => s + w.totalVolume, 0),
  }), [history]);

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
            <Text style={styles.emptySubtitle}>Your coach hasn&apos;t logged a session yet</Text>
          </View>
        ) : (
          history.map((workout) => (
            <View key={workout.id} style={styles.workoutCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{workout.name}</Text>
                <Text style={styles.cardMeta}>
                  {formatDate(workout.date)} · {formatTime(workout.date)}
                </Text>
              </View>

              {workout.duration >= 60 && (
                <Text style={styles.cardStatText}>{formatDuration(workout.duration)}</Text>
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
    marginBottom: 4,
  },
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
  cardStatText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    fontWeight: '500' as const,
    marginTop: 8,
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
});
